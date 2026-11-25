# Threads: a bot has more than one conversation

The feature is the row "Threads: a bot with more than one conversation,
folders, pins, parallel threads, snooze" of
[`../reference-features.md`](../reference-features.md) (part 12), with the rows
`threads.md`, `plans/2026-09-09-independent-threads.md`,
`plans/2026-09-09-thread-aware-bots.md`, issue 1635 and the parallel-turns part
of `plans/2026-09-02-bot-concurrency.md`. It is for step 11 of
[`../../plan/README.md`](../../plan/README.md). The port goes to `bot-core`
(the store and the thread slot) and `bot-desktop` (the thread list).

The reference project is the local clone next to this repository, at commit
`eee23ebbe` (2026-11-24, the merge of the branch `release/v0.1.179`). The
version v0.1.179 has no tag and no release. The next release is v0.1.180
(tag commit `5478065c4`, three commits after `eee23ebbe`). Section 2.5 says
what v0.1.180 and its two thread commits change. Nobody opened its
`enterprise/` directory. The product name is replaced by `<product>` in
strings and keys.

Paths: a path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md`, `docs/comparison.md` or `docs/desktop-window.md` is
ours, and so is `AGENTS.md`. Every other path is in the reference project,
relative to its root. This includes `docs/plans/`, `docs/verification/`,
`docs/design/` and `docs/requirements/`. The reference has no `docs/plan/`,
`docs/research/`, `docs/decisions.md` or `docs/comparison.md`.

What this file adds to the earlier research:

- [`chat-turns.md`](chat-turns.md) has the start of a turn, the dispatch
  claim, the watchdog and the limit formula (its sections 3.2, 3.6, 3.9, 4.1
  and 5.1, at commit `3aec210`). This file does not repeat the turn. It adds
  the complete slot (sections 3.13 to 3.18 and 3.23):
  - every place that reads or frees it.
  - the main-thread exemption and the child limit.
  - the second gate on a Cloud.
  - the state machine of one thread.
- [`queue-and-steer.md`](queue-and-steer.md) has the queue of messages, its
  table `chat_followups` and the restart rule of a queued send (its sections
  3.5, 3.10, 4.3 and 5.2). This file does not repeat the queue. It adds how a
  thread is "queued" for the slot, and how the queue order between threads
  works (section 3.15).
- [`store-and-data-format.md`](store-and-data-format.md) has `bots.json`,
  `messages.db`, the save speeds and the repairs at load (its sections 3.6 to
  3.8). This file adds the thread record field by field, the delete of a
  thread, and what is never saved (sections 3.2 to 3.5 and 4.1).
- New in this file:
  - create, switch, rename, folders, pins, order, snooze and archive.
  - the main thread, and the title, the model and the working folder of a
    thread.
  - the tools `list_threads`, `start_thread` and `close_thread`.
  - the thread list of the desktop.
  - the problems of `changelog.md` section 5 in this code.

## 1. In short

In the reference project, a bot has many conversations. Each conversation is a
**thread**. Each thread has its own transcript, its own engine session, its own
model choice, its own working folder and its own busy state. Two threads of
one bot can run at the same time, up to a limit for each bot.

The main facts:

- **A thread is a "task" in the code.** `WireTask` is "One task = one
  conversation with its own context, thread and provider session"
  (`packages/phone-protocol/src/wire.ts:116`). The HTTP API still says
  `/tasks`, and a folder is still a "project" on the wire.
- **The thread records live inside their bot**, in `bots.json`
  (`BotRecord.tasks`, `server/store.ts:154-172`). The transcripts are rows in
  `messages.db`, keyed by the thread id.
- **The unit of busy is the thread.** A thread is busy when its flag
  `task.busy` is true, or when an in-memory dispatch claim exists for it
  (`server/index.ts:2179-2181`). The flag is live state. The store never
  saves it and sets every thread idle at load (`server/registry-store.ts:73-76`,
  `server/store.ts:526-529`).
- **The limit is for each bot.** The default is one thread for each 2 GiB of
  memory, from 3 to 16 (`server/bot-thread-limits.ts:15-18`). A saved
  setting from 1 to 16 wins. The main thread of the person never waits for
  the limit (`server/index.ts:2188-2191`).
- **What waits is a message, not a thread.** A send that finds no free slot
  goes into the same queue as a follow-up, with the reason `capacity`. The
  queue is in SQLite and survives a restart (`server/steer-queue.ts:61-79`,
  `:140`). The plan document says the opposite. The code wins.
- **The order of the list is derived.** Pinned threads first, then the newest
  "order" time (`wire.ts:608-619`). Nobody can drag a thread into an order.
  Only folders can be reordered.
- **Bots manage threads too.** All three tools of the plan are built:
  `list_threads`, `start_thread` and `close_thread`, plus `rename_thread` and
  `post_to_thread`.
- **Two old designs were reversed and left traces.** "One conversation for
  each bot" left a per-bot "selected thread" on the server. "Busy as a flag
  of the bot" left a bot-level busy slot that rooms still use.

Special terms, explained one time:

- **Thread**: one conversation of one bot. The code calls it a task.
- **Main thread**: the one thread of a bot that the bot opens to when the
  thread list is hidden, and where its routines report. A person can choose
  it. Else it is the oldest open thread that a person started
  (`server/main-thread.ts:29-32`).
- **Selected thread**: the thread that the window shows for a bot. The server
  keeps it as `bot.threadId` (`wire.ts:266-267`).
- **Folder**: two different things.
  - A **list folder** (`projectId`) groups threads in the list. It is
    "Organizational grouping only; never a directory or provider context"
    (`wire.ts:131-132`).
  - A **working folder** (`cwd`) is the directory where the engine of the
    thread works. It is "pinned on its first turn" (`wire.ts:188-189`).
- **Slot**: the right of one thread to run a turn now. A bot has a limited
  number of slots.
- **Dispatch claim**: an in-memory record that a turn is being set up or sent
  to the engine for a thread (`directTurnDispatchClaims`,
  `server/index.ts:1876`).
- **Child limit**: the limit for work that a bot started (its own thread, a
  hand-off). It is the same as the person limit, except on the Starter plan
  (`server/bot-thread-limits.ts:28-30`).
- **Drain**: the server takes queued messages and starts their turns when a
  slot is free. See [`queue-and-steer.md`](queue-and-steer.md).
- **Snooze**: hide a thread from the list until a time, or until new
  activity. "Snooze is a display preference, not a pause or cancellation of
  work." (`docs/verification/threads.md:90-95`).
- **Archive**: hide a thread from the list. It deletes nothing.
- **Close**: a bot marks a thread as done (`closedBy`). It deletes nothing and
  stops nothing.
- **Standing work thread**: the one thread that a conversation keeps with a
  teammate for hand-offs (`server/host/work-thread.ts:5-19`).
- **One-shot thread**: a thread that a bot opened for one hand-off
  (`openedBy.oneShot`, `packages/phone-protocol/src/task-provenance.ts:10-12`).
- **Simple mode** and **Advanced mode**: the two levels of the desktop UI. Only
  Advanced mode shows the thread tree (`src/lib/thread-preferences.ts:64-67`).

## 2. Files read completely

Nine subagents read the files in nine groups. Each one read its files from
the first line to the last, except the ranges in section 2.2. The lead checked
the key claims against the code (section 2.3).

### 2.1 Read completely

| Group | File | Lines |
|---|---|---|
| Documents | `docs/verification/threads.md`, `docs/verification/sidebar.md` | 193, 133 |
| | `docs/plans/2026-09-09-independent-threads.md`, `2026-09-09-thread-aware-bots.md`, `2026-09-02-bot-concurrency.md` | 105, 171, 64 |
| | `docs/requirements/issue-1635-requirements.md`, `docs/design/issue-1635-design.md` (in Japanese, translated) | 49, 144 |
| | `apps/docs/content/docs/features/bots-and-tasks.mdx`, `scripts/verify-threads.ts` | 73, 60 |
| Record and storage | `server/store.ts` (in ten ranges that cover every line) | 2256 |
| | `server/task-record.ts`, `task-record.test.ts`, `main-thread.ts`, `main-thread.test.ts`, `main-thread.e2e.test.ts` | 57, 116, 53, 112, 483 |
| | `server/legacy-work-threads.ts`, `legacy-work-threads.test.ts`, `thread-bot-index.ts`, `thread-bot-index.test.ts` | 41, 83, 46, 137 |
| | `server/thread-cache.ts`, `thread-cache.test.ts`, `thread-cache-read-budget.test.ts`, `thread-history.ts` | 123, 159, 143, 72 |
| | `server/thread-events.ts`, `thread-events.test.ts`, `store-deferred-saves.test.ts`, `registry-shape.test.ts` | 274, 251, 132, 95 |
| | `server/registry-store.ts`, `registry-save.ts`, `registry-save.test.ts`, `save-batch.ts`, `atomic.ts`, `bots-text.ts` | 190, 76, 300, 108, 142, 58 |
| | `server/host/thread-maps.ts`, `thread-maps.test.ts`, `server/tasks.test.ts`, `independent-task-store.test.ts` | 43, 23, 440, 674 |
| | `server/store-retired-bot-fields.test.ts`, `store-forks.ts`, `testing/fixtures/registry-format1/bots.json` | 79, 71, 92 |
| HTTP routes | `server/routes/threads.ts`, `tasks.ts`, `thread-models.ts`, `thread-models.test.ts` | 612, 449, 51, 116 |
| | `server/routes/pinned-client-thread.ts`, `bulk-delete.ts`, `fork-request.ts` | 18, 14, 16 |
| | `server/host/message-pages.ts`, `bot-frames.ts`, `snapshot-tail.ts`, `bot-access-gate.ts` | 57, 33, 59, 136 |
| | `server/routes/threads-*.test.ts` (seven files) | 54 to 168 |
| | `server/independent-threads-api.test.ts`, `paired-thread-targets-api.test.ts`, `thread-folder-settings.e2e.test.ts` | 757, 147, 83 |
| | `server/thread-archive.test.ts`, `thread-snooze.test.ts`, `archived-unread.test.ts` | 74, 110, 68 |
| Slot and limit | `server/bot-thread-limits.ts`, `box-memory.ts`, `admission.ts`, `direct-send.ts`, `live-turns.ts`, `restart.ts` | 36, 39, 163, 31, 30, 50 |
| | `server/coordinator.ts`, `activity.ts`, `steer-queue.ts`, `turn-watchdog.ts` | 282, 361, 325, 281 |
| | `server/engine-memory.ts`, `process-room.ts`, `thread-presence.ts`, `thread-presence.test.ts` | 954, 233, 61, 27 |
| | `server/host/idle-threads.ts`, `idle-threads.test.ts`, `dispatch-claims.ts`, `person-stop.ts`, `turn-order.ts` | 50, 124, 46, 94, 23 |
| | `server/host/queued-reason.ts`, `wait-words.ts`, `starter-caps.ts`, `cloud-plan-tier.ts`, `work-thread.ts` | 34, 69, 77, 45, 46 |
| | `server/room-parallel-threads.e2e.test.ts`, `body-thread-guards.e2e.test.ts` | 104, 41 |
| Thread tools | `server/drivers/agents-list-threads-tool.ts`, `agents-thread-title-tool.ts`, `agents-thread-post-tool.ts`, `agents-schema.ts` | 44, 29, 41, 116 |
| | `server/routes/internal-threads.ts`, `internal-threads.test.ts`, `internal-models.ts` | 144, 126, 129 |
| | `server/host/own-threads.ts`, `self-threads.ts`, `self-threads.test.ts`, `thread-person.ts`, `thread-posts.ts`, `thread-posts.test.ts` | 82, 12, 14, 18, 119, 118 |
| | `server/host/work-thread.test.ts`, `finished-work.ts`, `finished-work.test.ts`, `outside-fence.ts` | 110, 57, 137, 79 |
| | `server/too-long.ts`, `thread-starters.ts`, `shared/thread-link.ts`, `shared/thread-link.test.ts`, `server/thread-link.test.ts` | 38, 76, 26, 31, 86 |
| | `server/thread-aware-bots.e2e.test.ts`, `self-threads.e2e.test.ts`, `start-thread-routing.e2e.test.ts`, `outside-work-threads.e2e.test.ts` | 954, 59, 69, 51 |
| | `server/system-prompt.ts` | 341 |
| Thread life | `server/thread-title.ts`, `thread-title-generate.ts`, `thread-title.test.ts`, `thread-title-regenerate.e2e.test.ts` | 91, 34, 168, 146 |
| | `server/host/handed-thread-title.ts`, `handed-thread-title.test.ts` | 24, 52 |
| | `server/thread-model.ts`, `thread-model.test.ts`, `shared/thread-model.ts`, `server/thread-model-follow.e2e.test.ts` | 32, 262, 29, 147 |
| | `shared/thread-folder.ts`, `thread-folder.test.ts`, `server/bot-cwd.ts` | 6, 21, 62 |
| | `server/thread-retention.ts`, `thread-retention.test.ts`, `host/start-upkeep.ts`, `start-upkeep.test.ts` | 48, 128, 99, 124 |
| | `server/task-workspace-retention.ts`, `task-workspace-retention.test.ts`, `thread-log-rotation.ts`, `thread-log-rotation.test.ts` | 85, 101, 77, 122 |
| | `server/host/thread-log-sweep.ts`, `thread-log-sweep.test.ts`, `thread-log-sweep.e2e.test.ts` | 457, 312, 58 |
| | `server/host/conversation-folder-cleanup.ts`, its test, its Linux test | 756, 631, 99 |
| | `server/host/idle-reclaim.ts`, `orphan-sweep.ts` | 478, 318 |
| | `server/bot-thread-frames.e2e.test.ts`, `thread-page-frames.e2e.test.ts` | 80, 231 |
| Sidebar | `src/components/Sidebar.tsx`, `SidebarThreadRow.tsx`, `SidebarThreadRow.test.ts`, `SidebarThreadRow.snooze-expiry.test.ts` | 1669, 469, 864, 133 |
| | `src/components/sidebar-thread-labels.ts`, its test, `SidebarThreadLabels.tsx`, its DOM test | 77, 72, 204, 49 |
| | `src/components/SidebarPinnedThreadsPanel.tsx`, its test, `SidebarBotActivity.tsx`, its test | 55, 138, 273, 324 |
| | `src/components/PinnedCircleThreads.tsx`, `Sidebar.pinned-circle-threads.test.ts`, `Sidebar.pinned-show-all.dom.test.ts` | 370, 265, 172 |
| | `src/components/SidebarNewChatPanel.tsx`, its test, `SidebarBotListItem.test.ts`, `.expansion.test.ts` | 221, 207, 478, 112 |
| | `src/lib/sidebar-preferences.ts`, its test, `sidebar-layout.ts`, `thread-preferences.ts`, `thread-fold-preferences.ts` | 511, 276, 347, 67, 64 |
| | `src/components/BotThreads.test.ts`, `bot-panel/Conversations.tsx`, `sidebar-state.ts`, `SidebarRowMarkers.tsx` | 147, 229, 37, 68 |
| | `src/components/Sidebar.rows.test.ts`, `Sidebar.memo-isolation.dom.test.ts`, `Sidebar.perf-polish.dom.test.ts` | 176, 162, 193 |
| | `src/components/SidebarActiveThreads.tsx`, `SidebarWorkingStep.tsx` | 44, 39 |
| Client state | `src/state/thread-navigation.ts`, its test, `thread-stamps.ts`, `thread-edits.ts`, `bot-thread-frame.ts`, its test | 155, 86, 47, 11, 22, 72 |
| | `src/state/new-chat.ts`, its test, `new-task-once.ts`, its test, `snapshot-navigation.ts`, its test | 122, 362, 26, 69, 106, 192 |
| | `src/state/app-store.ts`, `api.ts`, `saved-state.ts`, `chat-snapshot.ts`, `queue-receipts.ts` | 118, 97, 21, 38, 68 |
| | `src/state/task-write-recovery.test.ts`, `task-folder-navigation.test.ts`, `chat-switch-page.test.ts` | 172, 142, 55 |
| | `src/components/HeaderThreadTabs.tsx`, its DOM test, `thread-tabs.ts`, its test, `thread-tab-motion.ts` | 197, 105, 66, 60, 72 |
| | `src/components/ThreadSwitcherPill.tsx`, its DOM test, `ChatHeadPill.tsx`, `NewThreadHeaderButton.tsx` | 172, 84, 101, 27 |
| | `src/components/ThreadChip.tsx`, its test, `ThreadRefs.tsx`, its test, `ThreadLinkMenu.tsx` | 66, 106, 143, 276, 44 |
| | `src/components/ThreadConcurrencySettings.tsx`, its test, `ThreadCleanupSettings.tsx`, its two tests | 44, 34, 194, 57, 54 |
| | `src/components/ThreadModelsLine.tsx`, its two tests, `TaskPicker.tsx`, `ComposerQueuedMessages.tsx` | 42, 53, 85, 494, 173 |
| | `src/components/inbox/PinnedThreads.tsx`, `FinishedThreads.tsx`, `pinned.dom.test.ts`, `ChatView.missing-thread.test.ts` | 71, 93, 84, 65 |
| | `src/lib/thread-refs.ts`, its test, `thread-target.ts`, `use-feature.ts` | 435, 290, 34, 16 |
| Ours | `crates/bot-core`, `bot-protocol`, `bot-cli`, `bot-engine`, `bot-desktop` (the files that list conversations) | 1 to 385 each |
| | `docs/decisions.md`, `docs/comparison.md`, `docs/plan/README.md` and nine files of `docs/plan/` | 719, 392, 413 |
| | `docs/research/features/chat-turns.md`, `store-and-data-format.md`, `queue-and-steer.md` | 977, 1023, 818 |

### 2.2 Read in ranges

- `server/index.ts` (15,258 lines): 780, 806, 920-960, 1005-1025, 1578-1590,
  1824-1900, 2170-2350, 2610-2690, 2750-2800, 2835-2880, 3445-3456,
  3700-3720, 3815-3900, 3929, 4407-4420, 4440-4560, 4915-5035, 5432-5530,
  6540-6790, 6990-7300, 7385-7830, 8140-8156, 8210-8232, 8300-8530,
  9945-9960, 10705-10745, 11595-11640, 11860-11880, 11940-12185,
  12290-12306, 12535-12560, 13010-13030, 13481-13580, 13690, 13846-13910,
  15060-15137. Found with grep for `threadBusy`, `botAtThreadCapacity`,
  `directTurnDispatchClaims`, `setTaskActivity`, `startTurn`,
  `acceptDirectSend`, `startOrQueueOpenedThread`, `wireTask`, `botMainThread`,
  `healThreadModel`, `followupsReady` and the route registrations. Between
  7700 and 8300 only the lines with `setTaskActivity`, `claim`, `catch`,
  `throw` or `await` were read.
- `src/state/store.tsx` (3,260): 1-76, 190-409, 500-800, 862-1400, 1526-1800,
  1860-2372, 2536-2552, 2638-3260.
- `packages/phone-protocol/src/wire.ts` (1,000): 1-40, 85-330, 590-660,
  890-1000.
- `server/drivers/agents-catalog.ts` (886): 1-60, 115-125, 225-310, 340-355,
  760-886. `agents-call.ts` (996): 30-80, 200-260, 405-500, 765-775,
  810-819. `agents-proxy.test.ts` (2,856): 265-300, 985-1125, 1340-1400.
- `server/config.ts`: 229, 265-290, 590-600, 885-900. `config.test.ts`:
  150-176, 905-920. `server/message-db.ts`: 20-87, 334-345, 640-666.
- `server/store.test.ts` (2,937): 1-40, 459-514, 854-922, 1074-1087,
  1415-1461, 1852-1902, 1959-2008, 2059-2253, 2444-2631.
- `src/components/SidebarBotMenu.tsx` (458): 56-190, 260-458.
- `server/parallel-threads.e2e.test.ts` (547): 1-140, 196-232, 395-433,
  506-547, and the rest by test names. `server/thread-capacity-api.test.ts`
  (654): 122-258, 546-654, and the rest by test names.
  `server/chat-followups-restart.test.ts` (254): 1-110, and the rest by
  `expect` lines.
- About 20 sidebar test files were read by their test names and `expect`
  lines only. `src/locales/en.json` was read by grep for thread keys.
- `DESIGN.md`, `docs/cloud-pro.md` and `chat-and-teams.mdx`: their thread parts
  only, found by grep.

### 2.3 Claims that the lead checked against the code

| Claim | Where |
|---|---|
| The limit formula, the Starter value 1, the child limit 16 on Starter, the refusal text | `server/bot-thread-limits.ts:5-36` |
| Busy is the task flag or a dispatch claim | `server/index.ts:2179-2181` |
| The main thread and burst lanes are never at capacity, and the count uses `threadBusy` | `server/index.ts:2188-2191` |
| `ACTIVITY_BUSY` is working, waiting-on-you and no-signal | `server/store.ts:124` |
| Load sets each thread idle | `server/store.ts:526-529` |
| `setTaskActivity` and the derived `bot.busy` with the bot-level slot | `server/store.ts:1601-1636` |
| `persistedBot` drops busy, activity and the start time | `server/registry-store.ts:73-76` |
| The three refusals of `beginTurn`: `thread_busy`, room turn, `thread_limit` | `server/index.ts:7486-7492` |
| No `await` from the start of `beginTurn` to the slot take, and the first `await` is at `:7667`, inside the detached setup | `server/index.ts:7406-7663` |
| The slot take: claim `setup`, then `working`, then the watchdog | `server/index.ts:7640-7656` |
| The queue saves each item to SQLite and loads the pending rows at start | `server/steer-queue.ts:61-79`, `:140` |
| A queued dispatch cut by a restart comes back as a user line with a notice, and never runs again | `server/index.ts:15077-15106` |
| `maxConcurrentPerBot` is 1 to 16, and the first save of the `threads` section writes the default | `server/config.ts:270`, `:897` |
| `close_thread` refuses while busy, queued, handed off or waiting on the person, and only sets `closedBy` | `server/routes/internal-threads.ts:111-143` |
| `MAX_THREADS_OPENED_PER_TURN = 5`, and `startOrQueueOpenedThread` | `server/index.ts:7248-7284` |
| The opening text of `start_thread` wraps the model's own words | `server/index.ts:13895-13896` |
| The order: pins, then `lastThreadOrderAt ?? createdAt` | `packages/phone-protocol/src/wire.ts:608-619` |
| The short list keeps 6 open threads plus pins, the main thread and attention | `src/components/SidebarThreadRow.tsx:140-167` |
| An expired snooze is dropped on read, not on disk | `server/index.ts:2846-2853` |
| The PATCH allow-list of 16 keys, and the delete refusal while busy | `server/routes/tasks.ts:94-105`, `:270` |
| The v0.1.151 fix: Stop and the watchdog free a thread that nothing holds | `server/host/idle-threads.ts:1-50`, `server/turn-watchdog.ts:269-280` |
| `besideBusy` and the one-shot close and archive rules | `server/host/work-thread.ts:36-46`, `server/host/finished-work.ts:12-57` |
| The client falls back to the bot-level `busy`, and a tab shows working from it | `src/state/store.tsx:372`, `src/components/thread-tabs.ts:36` |
| The client guesses that the open thread was deleted | `src/state/store.tsx:1136-1148` |
| A delete of threads is one SQLite transaction with the `bots.json` save inside | `server/message-db.ts:653-666` |
| The main-thread rule | `server/main-thread.ts:29-45` |
| The model of a thread falls back with a notice | `server/index.ts:2676-2685` |
| The first-message title is cut to 48 characters | `server/thread-title.ts:9-15` |
| The plan says "three ... from one to ten" and "in-memory, not restart-durable" | `docs/plans/2026-09-09-independent-threads.md:41-48` |
| The docs site says "Up to three direct threads can run per bot" | `apps/docs/content/docs/features/bots-and-tasks.mdx:22` |
| The concurrency plan that D8 cites says it is superseded | `docs/plans/2026-09-02-bot-concurrency.md:6-9` |

### 2.4 Changes since the commits of the earlier research

| File | Earlier research | Now at `eee23ebbe` |
|---|---|---|
| `server/store.ts`, the load reset of each thread | `:524-527` (`chat-turns.md`, at `3aec210`) | `:526-529` |
| `server/index.ts`, `botAtThreadCapacity` | `:2189-2191` (`chat-turns.md`) | `:2188-2191` |

Changes between v0.1.178 and `eee23ebbe` that touch threads (from
`git diff v0.1.178 eee23ebbe` of each file):

| File | The change |
|---|---|
| `server/main-thread.ts` | the rule is now: the choice, else the oldest open thread that a person started. A kept choice (`mainThreadKept`, `server/store.ts:1463`) makes the main thread stay put |
| `server/host/finished-work.ts` | new, 57 lines: one-shot hand-off threads close and archive themselves |
| `server/host/work-thread.ts` | new `besideBusy` (`:36-46`) |
| `server/drivers/agents-list-threads-tool.ts` | each archived row says ", archived: no longer in the person's sidebar" (`:13`) |
| `server/held-unread.ts` | new, 14 lines: a person's "mark unread" holds until a bot reply |

### 2.5 v0.1.180 and the commits after `eee23ebbe`

The note of v0.1.180 (2026-11-24, `gh release view v0.1.180`) has these
thread items. The first seven are in the code at `eee23ebbe` already:

| Item of the note | In the code at `eee23ebbe` |
|---|---|
| "A send to a busy standing thread runs beside the busy turn instead of waiting." | Yes. `besideBusy` (`server/host/work-thread.ts:36-46`), called at `server/index.ts:13548` |
| "A bot's main conversation is marked and stays put ... A message to it never waits behind the bot's other threads." | Yes. The "Main" mark (`src/components/SidebarRowMarkers.tsx:62-68`), `mainThreadKept` (`server/store.ts:1463`). The "never waits" part is true for the per-bot slot only, not for the Cloud memory gate (section 3.14) |
| "One-off hand-off threads tidy themselves up ... Standing threads, and threads you pinned, filed or wrote in, stay open." | Yes, `server/host/finished-work.ts`. But the code closes the standing work thread when its result is back (`:15`). It is not archived. The note's "stay open" is not exact |
| "Archived conversations no longer light a bot's unread dot" | Yes. `taskCountsAsBotUnread` (`server/store.ts:259-261`) |
| "Thread tabs ... (off by default)" in Settings → Features | Yes. `features.threadTabs` (`server/config.ts:229`, `server/index.ts:11629`) |
| "Switch threads from the top pill." | Yes. `src/components/ThreadSwitcherPill.tsx` |
| "Mark as unread sticks, on the open chat too, after a reload and in a second window." | Yes. `heldUnread` (`server/held-unread.ts:4-14`, `wire.ts:166`) |
| "Pinned threads show right under their own bot in the sidebar; the separate 'Pinned threads' box at the top is gone." | No. Commit `7090651c8` |
| "Ctrl+Tab and Ctrl+Shift+Tab switch between a bot's threads, pinned ones first." | No. Commit `7090651c8` |
| "Thread tabs look cleaner" | No. Commit `5fec92982` |

**Commit `5fec92982`** ("Thread tabs: one frame with the sidebar, the chat as
a card, every control on one centre line", parent `eee23ebbe`, 4 files):

- The open tab gets one sliding indicator (`useSlidingIndicator`,
  `src/components/thread-tab-motion.ts:80-99`), not its own background.
- The bot button of the tab strip shows the avatar and the bot name
  (`HeaderThreadTabs.tsx:149`).
- The strip carries `data-panel-beside` when a side panel is open (`:54`,
  `:144`).
- The rest is layout in `src/styles.css` (min width 768 px). Switch, archive
  with Undo, rename, keys and filters do not change.

**Commit `7090651c8`** ("Threads: Ctrl+Tab switches a bot's threads; pinned
threads stay under the bot; the sidebar's Pinned threads box goes", parent
`5fec92982`, 16 files, +305 −267):

- It removes `SidebarPinnedThreadsPanel.tsx` and its test, `PinnedThreadRows`
  in `SidebarBotActivity.tsx`, and `PINNED_THREADS_SECTION_ID`.
  `crossBotPinnedThreads` stays defined and tested, but nothing uses it.
- It adds `src/components/thread-cycle.ts` (46 lines). The cycle order is the
  order of the header tabs without the blank tab. It wraps around. It acts
  only in the chat view, with no dialog open, and ignores key repeat.
- It adds the shortcut entry `switch-thread` and `threadCycleStep` in
  `src/lib/keyboard-shortcuts.ts`. The key is Ctrl+Tab on macOS too, because
  "⌘Tab belongs to the system". Shift steps back. IME composition is ignored.
- In Simple mode, `pinnedThreads(bot)` puts the pinned threads of a bot first
  under its row, folded or not (`sidebar-thread-labels.ts:28-35`, `:71-89` in
  the new file). A small pin mark shows by the title.

The Advanced tree does not change. It already put pins first.

## 3. How it works

### 3.1 The parts and who owns what

1. `server/store.ts` owns each thread record, each change and each store
   event. It writes `bots.json` and joins `messages.db` for a delete.
2. `server/index.ts` (the composition root) owns the slot: `threadBusy`,
   `botAtThreadCapacity`, the claims, `beginTurn`, the drains and the
   recovery at start.
3. `server/admission.ts` is a pure decision table: "no IO, no store reads, no
   adapter calls" (`:1`). It answers start, queue, steer or refuse for nine
   kinds of request (`:5-14`).
4. `server/steer-queue.ts` owns the queue and its rows.
5. `server/bot-thread-limits.ts` owns the numbers of the limit.
6. `server/routes/tasks.ts` and `threads.ts` are the HTTP API for the person.
   `server/routes/internal-threads.ts` and the inline route at
   `server/index.ts:13846-13910` are the API for the thread tools.
7. `packages/phone-protocol/src/wire.ts` holds the shared rules for order,
   snooze and the next open thread. The server and the window use the same
   functions.
8. The window keeps a copy of the records in `src/state/store.tsx`.

### 3.2 Create a thread (checked: `server/routes/tasks.ts:183-222`, `server/store.ts:2133-2145`)

1. The person clicks "New thread". The window opens a blank chat with the
   placeholder id `new-chat-<botId>` and creates nothing yet
   (`src/state/new-chat.ts:33-47`).
2. The first send creates the thread: `POST /api/bots/:id/tasks
   {projectId?}`. Later sends of the same blank chat wait for the same
   create (`new-chat.ts:65-78`).
3. The route checks the body:
   - not a JSON object: 400.
   - `select` not a boolean: 400 "select must be a boolean".
   - no such bot: 404.
   - `cwd` without the admin scope: 403 "Choosing a working folder requires
     the admin scope". A bad path: 400 (section 3.10).
   - `projectId` not a folder of this bot: 400.
   - a phone secret is being saved on this bot: 409.
4. `store.createTask` calls `buildTask` (`server/task-record.ts:39-57`). The
   defaults: a new id, the title "New thread", `createdAt = updatedAt = now`,
   an empty cursor map, `unread: false`, `activity: "idle"`, `busy: false`.
   A model is stored only when it differs from the bot's model (`:51`).
5. The store puts the thread first in `bot.tasks`. With `select` (the
   default), it also makes it the selected thread.
6. The store saves "now". A failed save rolls memory back and throws
   "Couldn't save the new thread: ..." (`server/registry-save.ts:15-25`).
7. The answer is 201 `{bot, task}`.

Limits and edge cases:

- The store has no limit on the number of threads. The parallel limit acts on
  running turns, not on records.
- The create has no busy check. A new thread can start while other threads of
  the bot run.
- A create with a working folder (`cwd`) does not use the blank chat. It is
  guarded by `createNewTaskOnce`: one create in flight for each bot, folder
  and `cwd`. A double click gets the same result
  (`src/state/new-task-once.ts:9-25`). This guard is in one window only.
- The blank chat gives the message back when the create fails, and stays
  open (`new-chat.test.ts:290-300`).
- A new bot gets its first thread with the same shape (`server/store.ts:1303-1312`).

### 3.3 Select a thread (checked: `server/routes/tasks.ts:241-264`)

1. The window marks the target at once: `switchingTo = threadId`
   (`src/state/store.tsx:1677-1683`).
2. It sends `POST /api/bots/:id/tasks/:threadId?messages=80`.
3. The server saves the new `bot.threadId` ("Navigation only: execution owns
   its thread, never this selected id", `:248`) and answers with the bot and
   80 messages.
4. A per-bot counter drops an answer that a newer switch made stale
   (`store.tsx:2719-2731`).
5. Errors: no such thread gives 404. The window clears `switchingTo` and
   shows the error.

The selected thread is server state, one value for each bot, shared by all
windows and phones of the person. This is a trace of "one conversation for
each bot". The window has much guard code against it (`keepBotNavigation`,
`src/state/snapshot-navigation.ts:52-89`): "A reconnect snapshot does not
preserve navigation, and the server often still names the older thread."
(`:72`).

### 3.4 Change a thread: rename, folder, pin, snooze, archive, model (checked: `server/routes/tasks.ts:265-413`)

One PATCH `/api/bots/:id/tasks/:threadId` does all of these.

1. A key outside the allow-list of 16 keys gives 400 "unsupported thread
   setting" (`:270`). `updatedAt` and `archived` are refused this way.
2. No such thread: 404. A Cloud member who did not start the thread: 403.
3. Each value is checked in order:
   - `projectId`: a folder of this bot, or null to ungroup.
   - `title`: a string. The store trims it, cuts it to 80, and an empty title
     becomes "New thread" (`server/store.ts:2020`).
   - `archivedAt`: a number ≥ 0 or null. "archivedAt must be a timestamp, or
     null to unarchive".
   - `pinned`: a boolean. Only `true` is stored. False removes the key
     (`server/store.ts:2021`, `server/registry-store.ts:66-71`).
   - `snoozedUntil`: a number ≥ 0 or null.
   - `link`: http(s), at most 2,048 characters.
   - `surface`: 409 "Stop this thread before changing its computer
     destination." while busy.
   - `modelSelection`: 409 while busy (section 3.9).
4. The store applies the patch in one change. A model change goes through its
   own path, `switchTaskModel`. A permission change saves "now". The rest
   saves "pass", which keeps the change in memory when the write fails
   (`store-and-data-format.md` section 3.7).
5. The answer is 200 `{task, bot}`. The store sends a `bot` event for the
   thread.

In the window, every one of these except rename uses the action
`updateTask`:

1. The window merges the patch at once (optimistic).
2. Writes for one thread go one at a time (`store.tsx:2141-2156`).
3. When a write fails, the window shows the error and reads the bot again with
   backoff (2, 5, 15, 30 s) until it succeeds. Sends on that thread wait for
   the read, and a waiting send is dropped (`task-write-recovery.test.ts:40-171`).

A rename is optimistic too, but a failure reloads all bots without messages
(`store.tsx:2097-2104`).

### 3.5 Delete a thread (checked: `server/routes/tasks.ts:94-119`, `server/message-db.ts:653-666`)

1. The window sends `DELETE /api/bots/:id/tasks/:threadId`. The window does
   not change its list first.
2. The route refuses:
   - no such thread: 404.
   - not the Cloud member's thread: 403.
   - a phone secret is being saved: 409.
   - `threadBusy`, or a routine runs in it: 409 "this task is running — stop
     it first".
3. The route cancels the direct hand-off of the thread.
4. `store.deleteTasks` runs one SQLite transaction. It deletes the rows of
   `chat_followups`, `messages`, `thread_state` and `notification_log`. The
   `bots.json` save runs inside the transaction. If the save throws, the SQL
   delete rolls back and no event is sent.
5. When the last thread goes, the store makes a fresh "New thread". A bot
   always has one thread.
6. When the selected thread goes, the next one is `nextOpenThread`: listed
   open threads first, then any open thread, then any own thread
   (`wire.ts:627-633`).
7. After the commit, the store removes the event logs of the thread and sends
   `thread.deleted`.
8. The route then clears the in-memory maps of the thread.

Bulk delete (`POST /api/bots/:id/tasks/delete`) takes 1 to 500 ids. It answers
with `deleted` and `refused` (`busy` or `not-found`). It sends one `bot` event.

Edge cases:

- A queued thread can be deleted. Its queued items end as cancelled
  (`server/independent-threads-api.test.ts:346-384`).
- The working folder of the thread stays on disk on the desktop.
- The window guesses that the open thread was deleted. The guess is: the bot
  frame names another `threadId`, and the old thread is not in its list
  (`src/state/store.tsx:1136-1148`). No "thread deleted" frame reaches the
  window as such.

### 3.6 Order and the short list (checked: `wire.ts:608-619`, `src/components/SidebarThreadRow.tsx:140-167`)

The reference project has **no manual thread order**. No route or store
method reorders threads. Only folders can be reordered.

1. The order is: pinned threads first, then the newest `lastThreadOrderAt`
   (or `createdAt`), then the original index.
2. `lastThreadOrderAt` moves only for a message that `movesThreadToTop`: a
   person's line that is not a bot's request, or a final reply text
   (`wire.ts:605-606`). A tool step does not move the thread.
3. The store changes this time in memory on each message. It saves it with the
   next save, and rebuilds it from `messages.db` at load. It never moves back
   (`server/store.ts:553-587`).
4. In Advanced mode the tree shows the main thread first, then folders, then
   the threads.
5. The short list keeps:
   - every pinned thread and the main thread.
   - the first 6 other open threads (`open++ < 6`).
   - every thread that needs attention: current, waiting on the person,
     working, waiting on a teammate, queued or unread.
   - an archived thread only when it is open on screen.
   - a closed or snoozed thread only when it needs attention.
   - for a routine, only its newest run.
6. "Show all N threads" shows everything. The choice is kept for each bot in
   the device storage.
7. Simple mode uses other limits: at most 4 active rows from the last 7 days
   and 3 working rows (`sidebar-thread-labels.ts:6-8`). Its unfolded rows sort
   by `updatedAt`, not by the order time.

### 3.7 The main thread (checked: `server/main-thread.ts:29-45`)

1. If the person chose a main thread and it is open, it is the main thread.
2. Else it is the oldest open thread that a person started (no `openedBy`).
3. Else it is the oldest thread.
4. `mainThreadToKeep` saves the result one time, as `mainThreadKept`, so that
   the main thread stays put when other threads change. When the kept thread
   is archived or deleted, the main thread moves to the oldest open thread
   that a person started. Reopening the old one moves nothing back.

What the main thread changes:

- The bot opens to it when the thread list is hidden.
- Routines that name no thread report to it.
- It never counts as at capacity when the person sends to it (section 3.14).
- It cannot be hidden or closed from a tab.

### 3.8 The title of a thread

1. **Instant title.** The first non-empty message of a turn gives the title
   at once: its first line, cut to 48 characters with "…"
   (`server/thread-title.ts:9-15`). This happens only while the title is
   "New thread" or "New task" and `titleFromFirstMessage` is not set
   (`server/store.ts:2203-2213`).
2. **Generated title.** For a thread that a person opened, the server then
   asks the engine of the bot for a title, in the background
   (`server/index.ts:7523-7533`):
   - The prompt asks for "a short title: 3 to 6 words, plain text, no quotes,
     no trailing period", from the first 1,500 characters.
   - It waits for one of 3 shared background slots, ahead of memory upkeep.
   - It has 10 s once it has a slot. A timeout or an error gives nothing.
   - The answer must be 1 to 48 characters after clean-up.
   - It replaces the instant title only if the title did not change
     meanwhile (`server/store.ts:2215-2219`). A rename by the person wins.
3. **Gate.** No generated title when the engine cannot generate text, the
   plan does not allow the model, a policy refuses, or the spend cap is
   reached (`server/index.ts:7388-7400`).
4. **Regenerate.** `POST .../tasks/:threadId/title` makes a title from the
   last 12 lines of the conversation. It replaces any title, also one that the
   person typed. Errors: 409 "a new title is already being generated for
   this thread", 409 "this thread has no messages to take a title from yet",
   502 "couldn't generate a title — try again, or rename the thread".
5. **Hand-off threads** get their title from the brief, with the prefix
   "@Sender · " (`server/host/handed-thread-title.ts:8-22`).

### 3.9 The model of a thread (checked: `server/index.ts:2676-2685`)

1. A thread stores no model while it follows its bot. It stores one only when
   a person picks another model in that thread (`server/task-record.ts:51`).
2. The wire always sends the model in use and `followsBotModel`
   (`server/store.ts:104-110`).
3. Picking the bot's own model clears the thread's model. The thread follows
   the bot again.
4. When the bot's model changes, the threads that follow move with it. Threads
   with their own model keep it. "Switch them too" (`POST
   /api/bots/:id/threads/follow-model`) clears their own model, and skips busy
   threads.
5. A model change on a busy thread gives 409.
6. At each turn start, `healThreadModel` checks the thread's own model. Its
   engine can be missing, disabled, unavailable or refused. Then the thread
   goes back to the bot's model, with the notice "This thread's model (<name>)
   isn't available, so it now uses <Bot>'s model (<name>)." This is skipped
   while the thread is busy.

### 3.10 The working folder of a thread

1. A create can name a folder (`cwd`, admin only). The path must be
   absolute and must exist (`server/bot-cwd.ts:9-25`).
2. At the first turn, for an engine that works in folders, the server makes
   `<data>/task-workspaces/<bot>/<thread>` (mode 0700) and pins the folder of
   the thread (`server/store.ts:1853-1875`):
   - a folder given at create stays.
   - else the bot's working folder, or the thread's own folder when the bot
     has none.
   - an old thread with a live engine session pins null.
3. The folder is pinned on the first turn and never read again. No route
   changes it later. A PATCH of `cwd` gives 400.
4. The bot can get a working folder later. Then a thread that sits in its own
   folder moves to the bot's folder at its next turn. It gets a new engine
   session and a replay of the transcript (`server/bot-cwd.ts:29-33`). A thread pinned
   to an older bot folder does not move.
5. Which engines get no folder is decided by a list of nine driver names
   (`server/workspace.ts:16-18`), not by a capability flag.

### 3.11 Snooze

1. PATCH `{snoozedUntil}` takes 0 ("until new activity"), a time in ms, or
   null (wake now). There is no upper bound and no check that the time is in
   the future.
2. A timed snooze ends only on read. The server leaves an expired value on
   disk and drops it from the wire (`server/index.ts:2846-2853`). Nothing is
   sent at the end time.
3. The window sets one timer for the soonest snooze end and draws the list
   again then (`SidebarThreadRow.tsx:169-184`).
4. The value 0 ends at the next activity change of the thread, or when the
   thread is marked unread (`server/store.ts:1622-1625`, `:2019`). This is the
   only disk write inside `setTaskActivity`.
5. A snooze survives a restart.
6. The window offers three presets: "Until new activity", "Until 6 PM" and
   "Until 9 AM tomorrow" (`SidebarThreadRow.tsx:457`). After 18:00, "Until 6
   PM" means 18:00 tomorrow, but the label does not say so.

### 3.12 Archive, and the close of hand-off threads

Manual archive:

1. PATCH `{archivedAt: Date.now()}` from the window. The server keeps the
   value that the window sends. Null unarchives.
2. Archive has no effect on disk. It stops nothing: the PATCH has no busy
   check. The window disables the menu item while the thread works.
3. An archived thread does not count for the bot's unread dot. It is never
   the main thread or the next open thread. Hand-offs do not use it again.
4. Closing a header tab archives the thread, with Undo.
5. The plan's automatic archive after "24 hours / 1 week / 1 month" was never
   built (`docs/plans/2026-09-09-independent-threads.md:78-87`).

Automatic close and archive of a hand-off thread (`server/host/finished-work.ts`):

1. A hand-off child ends with a result. The server calls
   `finishHandedThread` (`server/index.ts:3929`).
2. The standing work thread always closes.
3. A one-shot thread closes only if it is not pinned, not in a folder, and no
   person wrote in it. Threads from `start_thread` never close this way.
4. A closed one-shot thread is also archived, unless it is unread or a wait is
   armed on it.
5. Close and archive are two separate writes with the same time.
6. When the opener sends to it again, a thread archived on its result comes
   back. A thread that the person archived stays archived.

### 3.13 The slot: what "busy" means (checked: `server/index.ts:2179-2181`, `server/store.ts:1611-1636`)

1. A thread is busy when `task.busy` is true, or when a dispatch claim exists
   for it.
2. `setTaskActivity` sets `task.busy` from the activity: busy for "working",
   "waiting-on-you" and "no-signal". "dead" and "parked.computer" are not busy.
   A thread that waits for the person's approval holds its slot.
3. `noTurnRunning` lets a thread show "waiting-on-you" without being busy
   (since v0.1.141).
4. `bot.busy` is derived: any busy thread, or the old bot-level slot
   `legacyActivities` (`server/store.ts:278-279`, `:1631-1636`). Room turns
   still set the bot-level slot.
5. The claim covers the time before the flag means anything, and the time
   after an engine that ends early clears the flag. The comment says
   "threadBusy, not the stored flag: a reservation holds its slot after an
   early completion clears the flag" (`server/index.ts:2189`).
6. Claims, generations and watchdog entries are keyed by the thread id only,
   not by the bot id.

### 3.14 The limit of parallel threads (checked: `server/bot-thread-limits.ts:5-36`)

| Limit | Value | Where |
|---|---|---|
| Ceiling | 16 | `bot-thread-limits.ts:5` |
| Default, no memory gate | `min(16, max(3, round(memory / 2 GiB)))` | `:15-18` |
| Default, memory gate on (a Cloud) | 16, and the gate decides | `:16` |
| Memory | the container limit when one is set, else the machine memory, read one time for each process | `server/box-memory.ts:14-23` |
| Saved setting | `threads.maxConcurrentPerBot`, integer 1 to 16 | `server/config.ts:270` |
| Starter plan, person and routine work | 1 | `bot-thread-limits.ts:22` |
| Starter plan, work that a bot started | 16 | `:28-30` |
| Threads a bot can open in one turn | 5 | `server/index.ts:7248` |
| Starter plan, turns on the whole Cloud | 2 | `server/host/starter-caps.ts:9` |

Examples from the tests: 2 GB gives 3, 8 GB gives 4, 15.8 GB gives 8, 32 GB
or more gives 16 (`server/config.test.ts:159-160`).

The capacity check (`botAtThreadCapacity`, `server/index.ts:2188-2191`):

1. A send of the person to the main thread is never at capacity. A burst lane
   is never at capacity.
2. Else the server counts the bot's threads where `threadBusy` is true, except
   burst lanes. On Starter, a person's request does not count the threads
   that run a hand-off.
3. The thread is at capacity when the count reaches the child limit (for work
   that a bot started) or the person limit.

Edge cases:

- The main thread counts when other threads ask, so a bot can run the limit
  plus one (`server/thread-capacity-api.test.ts:229-257`).
- The first save of any `threads` setting writes the default of that moment as
  a saved value (`server/config.ts:897`). After that, the limit no longer
  follows the memory.
- On a Cloud a second gate runs inside the engine call: the engine memory gate
  (`server/engine-memory.ts:525-579`). It counts turns of all bots by free
  memory and room for processes. It has no main-thread exemption. A thread can
  pass the slot, show "working", and still wait for memory.

### 3.15 Admission and the "queued" state

What waits is a message, never a thread record. A thread is "queued" when it
has a waiting message with the reason `capacity` or `group-turn`.

A send of the person (`acceptDirectSend`, `server/index.ts:7105-7239`):

1. Refusals first: a moved bot, the spend cap, no such thread. A known
   `sendId` returns the earlier result.
2. If the thread is busy, `admit("direct-busy")` steers the message into the
   running turn, or queues it. See [`queue-and-steer.md`](queue-and-steer.md).
3. If the thread is not busy, `admit("direct")` with `atCapacity`. At
   capacity, the message is queued with the reason `capacity`. Else the turn
   starts.
4. The answer is 202 in both cases. A queued answer is `{ok, queued: true,
   queueId, threadId, reason, why}`. The `why` is "Queued. Starts when this
   bot has a free thread slot."

The start of a turn (`beginTurn`, `server/index.ts:7406-8502`):

1. It refuses with 409 and a code: `thread_busy` "this thread is already
   working — interrupt it first", `thread_busy` "the bot is already working
   in a channel — wait for it to finish", or `thread_limit` with the limit
   text (`:7486-7492`).
2. It takes the slot: a claim with the phase `setup`, the activity "working",
   and a watch (`:7640-7656`).
3. Steps 1 and 2 run with no `await` between them. In one process, two sends
   to one thread, or two threads near the limit, cannot both pass.
4. The setup and the engine call then run detached (`:7663`). `beginTurn`
   returns the user message before the engine is called.

Other kinds of request:

- A routine or a webhook at capacity is refused "busy". The routine manager
  keeps the run "queued" and tries again.
- A peer request or a resume at capacity is refused. The caller tries again.
- `canAdmitDirectTurn` (`:2194-2200`) is a separate check for the assignment
  runtime. If it passes and the slot is taken before the start, `beginTurn`
  refuses with a typed 409, and the runtime reads that as "not now". The
  bot cannot go over its limit through this path.

The drain (`server/steer-queue.ts:178-257`):

1. It runs after each turn end, a failed start, a Stop, a watchdog release, a
   change of the settings, and at start-up.
2. It walks the threads in the order their queue entry was made (first in,
   first out between threads).
3. It skips a thread that is busy or blocked (capacity, room turn,
   coordination).
4. It takes the head group of one thread, removes it from memory, and starts
   one turn with it.
5. If the start throws, the message is not tried again. Only an activity row
   "queued message could not start — <why>" stays.

Raising the limit starts queued work at once. Lowering it stops no running
work.

### 3.16 Releasing the slot: every exit

| Exit | What frees the thread | Where |
|---|---|---|
| Normal end | `turn.completed`, then settle (at most about 10 s for the digest and the last screen), then idle and a drain | `server/index.ts:6625-6770`, `:7013-7018` |
| Error before the engine call | the setup is cancelled, idle, drain | `:8406-8417` |
| The engine refused to start | a failure row, idle, drain ("A dispatch failure emits no turn.completed") | `:8379-8499` |
| Backup engine retry | idle, then a new start with no `await` between | `:8441-8478` |
| Waiting for a computer | "parked.computer", which is not busy | `:8422-8430` |
| Engine setup error | "dead", which is not busy | `:6617` |
| Stop by the person | frees the thread if no engine turn holds it | `server/host/person-stop.ts:52-64` |
| Watchdog stall | silent 20 min (`OMB_TURN_STALL_MS`), 2 h with a tool, 2 min after the engine process exits. It interrupts, writes a failed row, then idle after 6 s | `server/index.ts:4915-5000` |
| Busy with nothing running | the watchdog frees each thread that nothing holds, after the stall time | `server/turn-watchdog.ts:269-280` |
| Restart | load sets each thread idle | `server/store.ts:526-529` |

### 3.17 A restart (checked: `server/index.ts:15077-15106`)

1. The store loads every thread as idle. Busy, activity and the start time are
   never on disk.
2. All claims, generations, watches, live turns and the memory gate are lost.
3. The queue rows in `chat_followups` stay:
   - a `pending` row loads again and runs after the first drain.
   - a `dispatching` or `interrupted` row comes back as a user line with the
     notice "Queued follow-up interrupted by restart or restore — it may have
     already run…". It never runs again.
   - a row for a thread that no longer exists is cancelled.
4. The server drains the queue when it starts to listen (`:15129-15130`).
5. A direct turn that ran at the crash is dropped. It gets no reply and no
   notice in the code that was read. Its user line keeps `requestPending:
   true`, and no code reads that flag at start.
6. Hand-offs of the assignment runtime are started again by its own restart
   rule (`server/coordinator.ts:236`). A turn that ran through an
   out-of-memory freeze and used the browser ends with a notice instead
   (`server/memory-freeze-restart.ts:46-55`).
7. Snooze, archive, pins, the folder and the model of each thread survive.

### 3.18 A thread that stays busy (the fix of v0.1.151)

The bug: a card answered after its turn ended turned a resting thread back to
"working" with no turn. Nothing cleared it. Every queued message and hand-off
waited behind it, and Stop found nothing (commit `1d72099d5`).

The fix:

1. A card answer returns the thread to "working" only if a running turn waited
   on it (`server/index.ts:6585-6586`).
2. Stop frees a thread that no claim and no engine turn holds
   (`server/host/idle-threads.ts:42-48`).
3. The watchdog lists such threads each minute and frees one that stays
   unheld for the stall time (`server/turn-watchdog.ts:269-280`).
4. A turn parked on a computer whose engine is gone stops after 30 + 20 min.

What can still stay stuck:

- A turn parked on a person while its engine process lives has no time limit
  (`server/turn-watchdog.ts:246`). This is by design.
- The memory gate on a Cloud has no deadline. A thread shows "working" while
  it waits for memory.
- A tool command that keeps using CPU is never stopped.
- If a driver never sends `turn.completed`, the memory gate keeps its place.
  This was not verified.

### 3.19 The tool `list_threads` (checked: `server/routes/internal-threads.ts:42-91`)

1. The tool calls `GET /api/internal/threads`. The bot and the thread of the
   caller come from the turn's capability, not from the request.
2. Rows: the caller's own threads, plus threads that it opened on teammates
   it can reach. A Chief of Staff also sees threads that one teammate opened
   on another.
3. The state of each row, first match wins: waiting-on-you, running,
   waiting-on-you (parked), queued, queued (a hand-off), closed, idle. So
   "closed" shows only when nothing else applies.
4. Rows are newest first, 100 to a page.
5. Archived threads stay in the list with ", archived: no longer in the
   person's sidebar".
6. The text header is "Threads, newest first:". The empty text is "No threads
   yet: you have none of your own beyond this one, and you have not opened any
   on a teammate."

### 3.20 The tool `start_thread` (checked: `server/index.ts:13846-13910`, `:7250-7284`)

1. The proxy checks the arguments: `title` and `message` are mandatory,
   `folder`, `model_selection` and `report_back` are optional. An unknown
   argument stops the call before any request.
2. The route refuses:
   - the source thread is not the caller's: 403.
   - the work came from outside (a webhook): 403 "This work came in from
     outside, so it can't open a new thread. Finish it here."
   - no title or no message: 400. A title over 80 or on two lines: 400.
   - five threads already opened in this turn: 429 "... Do not retry ...".
   - an unknown folder: 400 with the list of folders.
   - a model that cannot run: 400.
   - this turn serves a hand-off, or a thread that the bot opened itself:
     409 "Only a person's own request can open separate threads on yourself
     ...". So a bot cannot fan out from its own threads.
3. The store creates the thread with `openedBy {botId, name, at}`, the
   source's model and level, and the folder.
4. The source thread gets a chip "Opened thread #Title". The person's selected
   thread does not change.
5. The opening message is the model's own `message`, inside a frame:
   "[Thread you opened yourself from #Source. The request below is your own
   words, not the person's: ...]". It is stored as a bot request.
6. `startOrQueueOpenedThread` uses the child limit. The answer is `running`,
   `queued` with a position, or `failed`. A failed start leaves the thread
   with a failure row.
7. With `report_back`, the thread is a hand-off to the bot itself. It runs
   after the opener's turn, and its result resumes the opener.

Edge cases:

- Nothing checks that titles are unique, so `#Title` can name two threads.
- The reply gives the person limit, but the admission uses the child limit.
  On Starter the number in the reply is wrong.
- The plain `message` has no length limit. The `report_back` brief has 12,000.

### 3.21 The tool `close_thread` (checked: `server/routes/internal-threads.ts:111-143`)

1. The caller names a thread id.
2. Refusals:
   - not found or not shown: 404.
   - not the owner, not the opener, and not a Chief that may tidy: 403.
   - the caller's own thread: 400 "you cannot close the thread you are
     speaking in — finish your turn instead".
   - the thread waits on the person's answer: 409.
   - the thread is busy, queued or handed off: 409 "#T is still running —
     wait for it to finish (list_threads), or the person can stop it from the
     app".
3. A thread closed already: 200 with `alreadyClosed`. Nothing is written.
4. Else the server writes the row "Closed by @Bot", clears unread and sets
   `closedBy`. These are separate writes.
5. Close stops nothing, cancels nothing, archives nothing and deletes
   nothing. The window moves a closed thread out of the short list.
6. A new message from the person removes `closedBy`.

The tool family has two more tools:

- `rename_thread`: the bot renames only the thread it is in, cut to 80.
- `post_to_thread`: a note into another open thread, at most 8,000
  characters, with a delivery id.

### 3.22 Clean-up of old threads

Five mechanisms exist. All skip threads that are busy, unread or handed off.
Only the first is on by default.

| Mechanism | Default | What it does |
|---|---|---|
| Log size cap | on, 256 MiB for each file | keeps the newest half of an event log (`server/thread-log-rotation.ts`) |
| Log retention by days | off | removes the event logs of threads closed or archived longer than N days, once a day (`server/thread-retention.ts`) |
| Workspace dependency sweep | off (`OMB_TASK_WORKSPACE_RETENTION`) | removes `node_modules` and virtual environments from idle thread folders |
| Cloud log sweep | off, Cloud only | trims idle logs when the volume is full |
| Cloud folder clean-up, idle reclaim, orphan sweep | off, Cloud only | removes installs from the folders of deleted or idle threads |

The transcript in `messages.db` is never trimmed by these.

### 3.23 The state machine of one thread

| From | To | When | Where |
|---|---|---|---|
| idle | running | `beginTurn` passes its checks | `server/index.ts:7486-7492`, `:7654` |
| idle | queued | `admit` answers queue: capacity, room turn, coordination | `server/admission.ts:111-119` |
| running | running with queued items | a send to a busy thread that is not steered | `server/index.ts:7221-7234` |
| queued | running | a drain finds the thread free | `server/steer-queue.ts:203` |
| running | waiting-on-you (still busy) | a card opens | `server/index.ts:6567` |
| waiting-on-you | running | the card is answered and the turn waited on it | `:6585-6586` |
| running | settling (still busy) | `turn.completed` | `:6745` |
| settling | idle | the settle ends | `:6685-6686` |
| running | parked.computer or dead (not busy) | a computer wait, an engine setup error | `:8425`, `:6617` |
| running | idle | a failure, Stop, the watchdog | section 3.16 |
| any | idle | a restart. Queued items stay | `server/store.ts:526-529` |

Archive, snooze, pin, close and folder are separate marks. They do not change
this state.

## 4. The data

### 4.1 The thread record (`TaskRecord`, in `bots.json`)

| Field | Type | Stored | Meaning |
|---|---|---|---|
| `threadId` | string | yes | the id. Also the key of the transcript. Cannot change |
| `title` | string, at most 80 | yes | "New thread" by default |
| `titleFromFirstMessage` | `true`? | yes | stops a second instant title |
| `createdAt` | ms | yes | fallback order key |
| `updatedAt` | ms | with the next save, rebuilt at load | the newest message. "Clients must not write it" (`wire.ts:150-152`) |
| `lastThreadOrderAt` | ms? | with the next save, rebuilt at load | the order key (section 3.6) |
| `projectId` | string? | yes | the list folder |
| `pinned` | `true`? | only `true` | pinned |
| `snoozedUntil` | ms? | yes | 0 = until new activity |
| `archivedAt` | ms? | yes | archived. Set by the window |
| `closedBy` | `{botId, name, at}`? | yes | set by `close_thread` or a finished hand-off |
| `openedBy` | `{botId, name, at, kind?, oneShot?, burstId?, ...}`? | yes | "Set when a bot, not a person, opened this thread" |
| `modelSelection` | object? | yes | absent = follows the bot |
| `cwd` | string, null or absent | yes | absent = not pinned yet. null = default |
| `resumeCursors` | map | yes, never on the wire | the engine sessions |
| `unread`, `heldUnread`, `lastReadMessageId` | | yes | read state |
| `askedAt` | ms? | yes, never on the wire | the last time a person wrote here |
| `routineRunId` | string? | yes | the thread of a routine run |
| `approvalMode`, `autoApprove`, `alwaysAllow` | | yes | out of scope ([`approval-levels.md`](approval-levels.md)) |
| `activity` | enum | **never** | working, waiting-on-you, idle, no-signal, dead, parked.computer |
| `busy` | boolean | **never** | section 3.13 |
| `turnStartedAt` | ms? | **never** | the start of the busy time |

The patch allow-list of the store is `TASK_PATCH_FIELDS`
(`server/store.ts:114-118`). `threadId`, `createdAt`, `updatedAt`,
`lastThreadOrderAt`, `openedBy`, `closedBy`, `busy` and `activity` cannot be
patched.

There is no format version for this record. Migrations are load steps, some
behind marker files (`store-and-data-format.md` section 3.6).

### 4.2 Thread fields on the bot

| Field | Stored | Meaning |
|---|---|---|
| `tasks` | yes | the threads, newest first |
| `threadId` | yes | the selected thread (section 3.3) |
| `resumeCursors`, `rewound`, `pinnedMessageId` | yes | a copy of the selected thread's values (`server/store.ts:2126-2131`). A trace of the old design |
| `mainThreadChoice`, `mainThreadKept` | yes, never on the wire | the main thread. The wire sends `mainThreadId` |
| `projects` | yes | the list folders: `{id, name (1 to 80), emoji?}` |
| `cwd` | yes | the bot's working folder |
| `busy`, `activity` | never | derived (section 3.13) |
| `unread` | yes | any thread unread, archived threads excluded |

### 4.3 State in memory only

| Name | Key | Lost at restart |
|---|---|---|
| `directTurnDispatchClaims` | thread id | yes |
| `directTurnGenerationByThread`, `directRequestOwners` | thread id | yes |
| `settlingTurns`, `LiveTurns`, watchdog entries | thread id | yes |
| memory gate places and its queue | thread id, all bots | yes |
| `legacyActivities` (bot-level slot) | bot id | yes |
| the queue map of `steer-queue.ts` | thread id | no: rebuilt from `chat_followups` |
| `openedThreads` (5 for each turn) | the turn's capability | yes, by design |
| the regenerate guard, the transcript cache | thread id | yes, harmless |

### 4.4 Files

| File | What |
|---|---|
| `bots.json` | all bots and their thread records, one line of JSON, mode 0600 |
| `messages.db` | transcripts, `thread_state`, `chat_followups` (the queue) |
| `events/<threadId>.ndjson`, `native/<threadId>.ndjson` | the event logs of a thread |
| `task-workspaces/<bot>/<thread>/` | the own working folder of a thread |
| `thread-starters.json` | who a thread is for, at most 50,000 entries |

### 4.5 The HTTP API for threads

| Method | Path | What |
|---|---|---|
| GET | `/api/bots` | all bots with all thread records, and the messages of the selected thread |
| POST | `/api/bots/:id/tasks` | create (section 3.2) |
| POST | `/api/bots/:id/tasks/:tid` | select (section 3.3) |
| PATCH | `/api/bots/:id/tasks/:tid` | rename, folder, pin, snooze, archive, model, link (section 3.4) |
| DELETE | `/api/bots/:id/tasks/:tid` | delete (section 3.5) |
| POST | `/api/bots/:id/tasks/delete` | bulk delete, 1 to 500 ids, admin |
| POST | `/api/bots/:id/tasks/:tid/title` | regenerate the title |
| POST, PATCH, DELETE | `/api/bots/:id/projects[/:pid]` | list folders, admin |
| PATCH | `/api/bots/:id/projects/order` | folder order: each folder exactly once |
| POST | `/api/bots/:id/threads/follow-model` | "Switch them too", admin |
| GET | `/api/threads/:tid/messages` | a page of a transcript, at most 200 |
| DELETE | `/api/bots/:id/queue/:queueId` | cancel a queued message |
| GET, POST | `/api/internal/threads[...]` | the thread tools |

The thread list has no server paging. Every write answers with the whole bot,
all its thread records and 50 messages (`server/index.ts:3450-3453`).

An old client that sends no thread id to a bot with two or more threads gets
409 "This bot has more than one thread. Update the ... app on this device"
(`server/routes/pinned-client-thread.ts:9-14`).

### 4.6 Events to the window

- `bot`: the whole bot, or, on a stream opened with `?frames=thread`, only the
  changed thread (`tasksPartial: true`).
- `bot.queued`: the full map of queued messages.
- `thread`: the active leaf of a thread.
- `message`, `message.patch`.

No event exists for "thread created", "thread renamed" or "thread deleted".
The window works them out from `bot` frames.

### 4.7 Settings

| Setting | Values | Default |
|---|---|---|
| `threads.maxConcurrentPerBot` | 1 to 16 | from memory (section 3.14) |
| `threads.eventLogRetentionDays` | 1 to 3,650, or none | none: keep forever |
| `threads.eventLogMaxBytes` | 256 KiB to 4 GiB | 256 MiB |
| `features.threadTabs` | boolean | off |
| Show threads (device) | on, off | on, Advanced mode only |

## 5. The UI

### 5.1 The thread tree under a bot (Advanced mode)

- The tree opens under a bot row when the bot has two or more threads, or a
  folder, or a search matches (`src/components/Sidebar.tsx:710`).
- The order from the top: the main thread, the folders, the heading
  "Threads", and the loose threads. Last comes a collapsed group "Opened by
  bots" for idle threads that bots opened.
- Footer: "Show all {count} threads", "Show fewer threads", bulk select.
- A closed folder still shows its pinned threads. An empty folder says "No
  threads yet".
- The "+" on the bot row and on a folder makes a new thread there.

Each row shows:

- the title, bold when unread, dim when closed, archived or snoozed.
- a byline: "closed by X", "Archived", "Snoozed" or "opened by X".
- the time: "just now", "N min ago", "N h ago", "yesterday", "N d ago", else
  the date.
- marks: the pin, the star "Main", "Waiting", a clock for a teammate, a
  spinner for working, "Queued", the unread dot.

The bot row shows dots: amber "Waiting for you…", green working, red "Ran into
a problem", then teammate and queued. Waiting wins over working.

### 5.2 The rows under a bot (Simple mode)

- Simple mode has no tree. It shows a few label rows under the bot.
- Folded: the threads that need attention, at most 3 working, then "+N
  running". After `7090651c8`, pinned threads come first.
- Unfolded: also the threads used in the last 7 days, at most 4, then "N
  more".
- F2 or a double click renames. The ✕ or the Delete key hides the thread
  (archive), with "Thread hidden" and Undo. The main thread, a shared chat or
  a working thread cannot be hidden.

### 5.3 The menu of a thread row

Copy link (`<product>://thread/<threadId>?bot=<botId>`), Rename thread,
memory, share, regenerate title, move to folder, Pin, Set as main thread,
remove link, Archive, Snooze (three presets), Stop snoozing, refresh
permissions, Delete thread. Simple mode keeps rename, memory, pin, set as main,
archive and delete.

Archive, snooze and delete are disabled while the thread works. Delete asks
"Delete thread?" with "“{title}” and its conversation will be deleted. This
cannot be undone." and checks the working state again.

### 5.4 Other thread views

- **Header tabs** (feature off by default): pinned first, then by order. Own
  threads that are not archived, snoozed or closed, plus pinned ones, plus the
  open one. A pulsing dot for working. ✕ archives with Undo. "+" makes a blank
  chat. Double click or F2 renames.
- **Simple pill**: "Bot · <title> ⌄" opens a list of thread chips.
- **"All threads" picker** (`TaskPicker.tsx`): search, folder headings,
  status lines, pin, rename, move, delete. Delete here has no confirm.
- **Inbox**: a "Pinned threads" section and a "Finished" section (the 10
  newest read, idle threads).
- **`#Title` links**: a title in text becomes a link "Open #{title}". Two
  threads with one title give "Open #{title} on {name}".
- **Notice**: "That thread is no longer here. Showing {name} instead."

### 5.5 The queued state on screen

- The window gets `{queued: true, reason}` from a send and shows a chip above
  the composer: "Queued. Starts when this bot has a free thread slot."
- The sidebar shows "Queued" on the row. A collapsed section shows "Queued ·
  N".
- The window has no queued field on a thread. It derives "queued" from the
  queued messages of the thread (`src/components/SidebarBotActivity.tsx:20`).

### 5.6 Settings

- **Parallel threads**: "Maximum running threads per bot", a list from 1 to
  16, on the bots page in Advanced mode. The help: "Threads waiting for
  approval use a slot. Lowering this limit does not stop running work". The
  window shows 3 until the config arrives. Starter shows 1 and is disabled.
- **Event log clean-up**: "Delete old event logs" and "Limit each event log".
  Each says "Threads stay."

### 5.7 Performance

- Memo with custom equality, a store slice for each bot, and one shared 30 s
  clock. A change to one bot draws one row.
- No virtual list. "Show all" draws every row.

## 6. The tests

| Test file | What it guarantees |
|---|---|
| `server/independent-threads-api.test.ts` | two threads of one bot run at once with separate processes and models. A model change is refused while busy. A queued thread and the last thread can be deleted. The title is cut. The limit changes live |
| `server/thread-capacity-api.test.ts` | the saved limit. 10 real processes after a raise. Overflow is queued, with `sendId` and cancel. Another bot is independent. Routines go into a free slot. The main thread runs while every slot is full. First in, first out between threads. A raise drains at once. A lower limit keeps running work |
| `server/parallel-threads.e2e.test.ts` | three threads at once on each engine, on the desktop and on Clouds. The browser and the computer are waited for in each call. The Starter rules |
| `server/chat-followups-restart.test.ts` | a real crash: pending queued sends run after restart, dispatching rows come back as user lines and never run again |
| `server/host/idle-threads.test.ts` | Stop frees a thread with no turn. It never frees a newer turn |
| `server/config.test.ts:156-175`, `:911-919` | the default from memory, the bounds, Starter, the first save writes the default |
| `server/tasks.test.ts`, `independent-task-store.test.ts` | create, select, titles, delete, the last thread, the migration of old bots, busy is never saved |
| `server/registry-save.test.ts` | a failed save rolls back, and a delete is atomic |
| `server/main-thread.test.ts`, `.e2e.test.ts` | the main-thread rule and that it stays put |
| `server/thread-aware-bots.e2e.test.ts` | the three tools end to end: queue order, the cap of 5, folders, models, `report_back`, close refusals |
| `server/routes/internal-threads.test.ts` | list states, paging, rename rules |
| `server/host/finished-work.test.ts`, `work-thread.test.ts` | the close and archive rules, `besideBusy` |
| `server/thread-snooze.test.ts`, `thread-archive.test.ts`, `archived-unread.test.ts` | the values and the healing on read |
| `server/thread-title*.test.ts`, `thread-model*.test.ts`, `thread-folder-settings.e2e.test.ts` | title, model and working folder |
| `src/components/SidebarThreadRow.test.ts` | the short list, the order, the menus |
| `src/components/SidebarThreadRow.snooze-expiry.test.ts` | the window wakes a snoozed thread without a fetch |
| `src/state/task-write-recovery.test.ts`, `new-chat.test.ts`, `new-task-once.test.ts` | the write lane, the blank chat, one create for a double click |
| `src/components/thread-tabs.test.ts`, `HeaderThreadTabs.dom.test.ts` | tab order, filters, close is archive |

No test covers:

- two `startTurn` calls on one thread at the same time (the code is safe, but
  no test pins it).
- a queued message whose start throws and is dropped.
- a thread that stays busy forever on the window side.
- a restart while a thread opened by `start_thread` is queued.
- the snooze preset times, and "Until 6 PM" after 18:00.
- archiving a busy thread.
- the two writes of `finishHandedThread`.
- a second change of the bot's working folder.
- the folder routes and the bulk delete route.

## 7. Ours compared

What we have now (our code at `95a62ee`):

- `bot-core` has `echo_reply` only (`crates/bot-core/src/lib.rs:3-5`). No
  store, no runtime, no slot.
- `ThreadId` exists (`crates/bot-protocol/src/ids.rs:8-11`), and each `Event`
  has a `thread_id` (`crates/bot-protocol/src/event.rs:9-15`). No thread
  event exists.
- The window has the old shape: the UI type `Bot` holds `messages`
  (`crates/bot-desktop/ui/src/features/bots/types.ts:3-11`). The sidebar lists
  bots. "New thread" and "New folder" have no handler
  (`crates/bot-desktop/ui/src/features/sidebar/Sidebar.tsx:68`, `:71`).
- The only busy is a local flag of the chat pane
  (`crates/bot-desktop/ui/src/features/chat/ChatPane.tsx:20`). The pane is
  keyed by the bot (`crates/bot-desktop/ui/src/app/App.tsx:53`), so a switch away and back clears the flag
  while the first call still runs.

Where each part goes:

| Part | Reference files | Ours: crate and module | Step |
|---|---|---|---|
| Thread record and its storage | `server/store.ts`, `task-record.ts`, `registry-store.ts`, `message-db.ts` | `bot-core`, store: a `threads` table beside `messages` | 8, 11 |
| The slot, busy, the limit, the queued state | `server/index.ts:2179-2215`, `:7406-7663`, `bot-thread-limits.ts`, `admission.ts`, `steer-queue.ts` | `bot-core`, runtime | 7, 8, 11 |
| Stuck-thread release | `server/host/idle-threads.ts`, `turn-watchdog.ts` | `bot-core`, runtime | 11 |
| Main thread | `server/main-thread.ts` | `bot-core`, store (a pure function) | 11 |
| Title | `server/thread-title.ts`, `thread-title-generate.ts` | `bot-core`, with the driver for the generated title | 11 |
| Model and working folder of a thread | `server/thread-model.ts`, `bot-cwd.ts`, `workspace.ts` | `bot-core` store fields, `bot-engine` capability flag | 11 |
| Thread events | none (only `bot` frames) | `bot-protocol`, `event.rs` | 11 |
| Thread commands | `server/routes/tasks.ts` | `bot-desktop` Tauri commands, logic in `bot-core` | 11 |
| The thread list | `src/components/Sidebar.tsx`, `SidebarThreadRow.tsx`, `src/state/store.tsx` | `bot-desktop/ui/src/features/sidebar/` | 11 |
| `list_threads`, `start_thread`, `close_thread` | `server/routes/internal-threads.ts`, `server/index.ts:13846-13910` | `bot-engine` tools over MCP, runtime in `bot-core` | 12 |

| Topic | The reference | Our plan now |
|---|---|---|
| Unit of busy | the thread | D8: "One turn per bot at a time" (`docs/decisions.md:175-176`). P3 (thread is the unit) is open |
| Limit | for each bot, 3 to 16 from memory, a setting | none. D10 says no setting is a constant |
| Queued | messages with a reason, in SQLite | P34 is a gap with no step |
| Restart | every thread loads idle, queue rows stay | no rule for chat threads |
| Selected thread | server state for each bot | P31: `send_message` takes a `ThreadId` |
| Step 11 | | "Tasks: a bot has more than one thread", no plan file, no pull request split (`docs/plan/README.md:345`) |

Where the documents of the reference disagree with its code:

| Document | Says | The code |
|---|---|---|
| `docs/plans/2026-09-09-independent-threads.md:43-44` | three threads, a setting "from one to ten" in "Settings → General" | 3 to 16 from memory, setting 1 to 16, on the bots page in Advanced mode |
| `apps/docs/content/docs/features/bots-and-tasks.mdx:22` | "Up to three direct threads can run per bot" | same as above |
| `independent-threads.md:47` | the queue "is in-memory, not restart-durable" | the queue is in SQLite and survives a restart |
| `independent-threads.md:78-87` | inactivity archive after 24 hours, 1 week or 1 month | not built |
| `docs/design/issue-1635-design.md` | the list sorts by `updatedAt` | it sorts by `lastThreadOrderAt` |
| `reference-features.md:410` (ours) | `list_threads` and `close_thread` are planned | all three tools are built |
| The note of v0.1.180 | standing threads "stay open" | the standing work thread closes on its result |

## 8. Where we can be better

1. **Make the thread the unit of busy, and write it as a decision that
   replaces D8.** The reference plan that D8 cites says "the
   direct-conversation decision below is superseded"
   (`docs/plans/2026-09-02-bot-concurrency.md:6-8`), and the code runs one turn
   for each thread (`server/index.ts:2179-2191`). Reason: a known problem of
   the reference. Its busy moved from the bot to the thread in three releases
   (v0.1.81, v0.1.83, v0.1.86), and we can start at the end.
2. **One slot type in the runtime, keyed by bot and thread.** The reference
   has four sources of busy: the task flag, the claim map, the room
   `busyBotId` and the bot-level slot (`server/store.ts:278-279`,
   `server/index.ts:2179-2181`). Some callers still read `bot.busy`
   (`server/index.ts:3858`, `:4988`, `server/routes/tasks.ts:321`). A Rust enum
   `Idle`, `Starting`, `Running { turn }`, `WaitingOnPerson { turn }`,
   `Settling { turn }`, taken by one `try_claim` that returns `Result<Slot,
   Refusal>`, has one owner. Reason: a wrong state that the compiler refuses.
3. **Never store the slot, and load every thread as idle.** The reference
   keeps busy in the record but resets it at load and never saves it
   (`server/store.ts:526-529`). Keep the slot out of the `threads` table. Reason:
   a known problem of the reference (a stored `Running` would stay busy
   forever after a crash).
4. **Add a `Queued` reason to the thread state, and send it to the window.**
   The window derives "queued" from queued messages
   (`src/components/SidebarBotActivity.tsx:20`). Reason: less code in the
   window, and one rule for the list and the tools (`list_threads` has its own
   rule, `server/routes/internal-threads.ts:47-55`).
5. **Keep "no saved limit" as a real state.** The first save of any `threads`
   setting freezes the default (`server/config.ts:897`), so a later memory
   upgrade never raises it. Reason: a known problem of the reference.
6. **Make the main thread a reserved slot, and say it in the setting.** A send
   to the main thread is never at capacity, but it counts for the others, so
   a bot runs the limit plus one (`server/index.ts:2190`,
   `server/thread-capacity-api.test.ts:229-257`). Reason: the setting text
   then says the real number of engine processes.
7. **One gate for the limit and the processes.** The reference has the slot
   of each bot, then a memory gate inside the engine call on a Cloud
   (`server/engine-memory.ts:525-579`). A thread shows "working" while it waits
   for memory. Decide this with P70. Reason: a known problem of the reference.
8. **Keep a queued message when its start is refused for a short-lived
   reason.** The drain drops it with only an activity row
   (`server/index.ts:7038-7048`). Reason: a known problem of the reference (the
   person's words leave the queue).
9. **Build the opening of `start_thread` from stored data.** The reference puts
   the model's `message` word for word into the new thread
   (`server/index.ts:13895-13896`). Our rule says "Text that opens a delegated
   turn is built from stored data, never from model output" (`AGENTS.md`).
   Store the request as a row first, then build the opening from that row.
   Reason: our own rule.
10. **Create, chip and queue in one transaction.** `createTask`, the chip in
    the source thread and the queue row are separate writes
    (`server/index.ts:13883-13896`, `server/steer-queue.ts:140`). So are close
    (`server/routes/internal-threads.ts:134-141`) and the auto close and archive
    (`server/host/finished-work.ts:41-42`). Reason: our rule "the row and its
    event in one transaction".
11. **Thread events.** Send `thread.created`, `thread.updated` and
    `thread.deleted`, not whole bot frames. The window guesses a deleted open
    thread from two frames (`src/state/store.tsx:1136-1148`). Reason: less code.
12. **Keep the selected thread in the window only.** The reference saves
    `bot.threadId` on the server (`server/routes/tasks.ts:241-264`), and two
    windows fight over it (`src/state/snapshot-navigation.ts:72`). P31 already
    gives the thread to each send. Reason: less code.
13. **A threads table, not threads inside the bot file.** Each thread change
    rewrites `bots.json`, and the narrowed write has a known crash gap
    (`server/bots-text.ts:4-6`). Reason: less code, and one transaction with
    the messages.
14. **The server stamps archive and snooze times.** The reference keeps the
    value that the window sends (`server/routes/tasks.ts:338-351`). An expired
    snooze stays on disk and nothing is sent at its end
    (`server/index.ts:2846-2853`). Reason: a wrong value cannot come in, and a
    timer event replaces the window's own clock.
15. **A capability flag for "works in a folder".** The reference uses a list of
    driver names (`server/workspace.ts:16-18`). Reason: our rule "never by a
    driver's name".
16. **One length unit for titles.** The route counts UTF-16 units
    (`server/index.ts:13856`), the schema counts code points
    (`server/drivers/agents-schema.ts:58-60`). Use `chars().count()` in one
    place. Reason: less code, and no surprise at 80.
17. **The tool reply gives the limit that was used.** `start_thread` answers
    with the person limit, but admits with the child limit
    (`server/index.ts:13898-13906`). Reason: a known problem of the reference.
18. **One title owner flag.** Regenerate replaces a title that the person typed
    (`server/routes/tasks.ts:423-446`), and `rename_thread` only advises against
    it. Reason: a wrong state that the code refuses.
19. **Server paging of the thread list.** Every snapshot and every write sends
    all thread records of a bot (`server/index.ts:3450-3453`). Reason: a bot
    with many threads makes every answer large.
20. **Name the short-list numbers.** The 6 is a literal
    (`src/components/SidebarThreadRow.tsx:165`), and Simple mode has other
    numbers. Reason: less code to keep in step.

### 8.1 The problems of `changelog.md` section 5 in this code

| Problem | What the reference does here | Our answer |
|---|---|---|
| "Busy" and races between bots | busy is per thread (`server/index.ts:2179-2181`). No race in one process: the checks and the take are in one tick (`:7406-7663`). Traces remain: the bot-level slot of rooms (`server/store.ts:278-279`), `bot.busy` in three callers, the window's fallback to `bot.busy` (`src/state/store.tsx:372`, `src/components/thread-tabs.ts:36`) | points 1 and 2 |
| One conversation for each bot (reversed) | the selected thread on the server, the bot copies its values (`server/store.ts:2126-2131`), the old-client guard (`server/routes/pinned-client-thread.ts:9-14`), the load makes a thread for a bot with none (`server/store.ts:483-494`) | point 12. We skip the one-conversation stage (D14) |
| "Busy" as a flag of the bot (reversed) | `legacyActivities` and `bot.busy` stay (`server/store.ts:1601-1636`) | point 2 |
| Memory and the number of processes | 3 to 16 from memory, 16 and a memory gate on a Cloud, the limit plus one for the main thread, the default frozen by the first save | points 5, 6 and 7 |
| State lost at a restart | busy loads idle, the queue survives, a running direct turn is dropped with no notice, `requestPending` is never read at start | point 3, and a restart rule for chat threads in step 8 |
| A turn or a wait that does not end | the v0.1.151 fix frees a thread that nothing holds. A turn parked on a person and the memory gate have no deadline | the slot is freed by the same step that writes the turn end (P27, P37) |
| The same work done or delivered two times, or lost | a dispatching queue row never runs again. A queued message whose start throws is dropped | point 8 |

## 9. Not verified

Checked by the lead against the code: the claims of section 2.3.

Not verified:

- That thread ids are unique across bots. The claims, the watchdog and the
  memory gate key by thread id only.
- That every driver always sends `turn.completed`. If one does not, the memory
  gate keeps the place of its thread.
- The middle of `beginTurn` (`server/index.ts:7700-8300`) beyond the grep
  hits. The computer setup may have other exit paths.
- The exact call path from `PATCH /api/config` to the drain. The test shows
  that a raise starts queued work at once.
- Whether a direct turn cut by a restart gets a notice from code outside the
  ranges that were read.
- Whether a corrupt `bots.json` is overwritten by the seed at the first start.
- Whether a title call that times out is ever killed. Its slot stays taken
  until the engine call ends.
- Whether `follow-model` can clear the model of a thread that becomes busy
  right after the check.
- Whether the server stops a double create from two windows. The guard
  `createNewTaskOnce` is in one window only.
- Where `nextOpenThread` is called in the window.
- The tests of idle reclaim, the orphan sweep and the inbox "Finished" section.
- The strings behind `server.queued.capacityStarter` and
  `server.queued.groupTurn`.
- About 20 sidebar test files were read by test names only.
- The UI race of our chat pane was found by reading. It was not run.
