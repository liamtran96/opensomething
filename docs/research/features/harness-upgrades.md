# Harness upgrades: message branches, context rebuild, retry and activity state

The feature is the row `plans/agent-harness-upgrades.md` and `-v2.md` of
[`../reference-features.md`](../reference-features.md): 17 planned upgrades of
the reference project, and the message branches with a version switcher. It
is for step 8 of [`../../plan/README.md`](../../plan/README.md): the store of
threads and messages, and the event log of each thread, in `bot-core`.

The reference project is the local clone next to this repository, at commit
`ad27f0716`. All paths in this file are relative to its root, unless a path
starts with `crates/` or `docs/`, which are ours. Nobody opened its
`enterprise/` directory.

Scope:

- **In full:** message branches (edit, rewind, the version switcher, Undo),
  the context rebuild on a model switch, portable context, automatic retry
  and the activity state on the server. These are the parts that the store
  and the event log of step 8 must hold.
- **What, files and lines only:** the other upgrades (section 3.1).
- **Other features of batch 5:** tool deadlines and loop detection belong to
  `turn-limits`. Approvals that fail closed belong to `approval-cards`. This
  file names their files and lines only.

What this file adds to the earlier research:

- [`store-and-data-format.md`](store-and-data-format.md) (read at
  `ed8cb7278`) says that `branchMessage` changes memory before the database.
  This file adds the consequences: a leaf that is not on disk, later rows
  under it, and history cut at a restart (section 8). It also adds the
  `thread_state` table and the split of the `rewound` flag into another file.
- [`chat-turns.md`](chat-turns.md) (read at `3aec210`) says only "An edit
  makes a new branch instead". This file adds the whole rewind path: the flag,
  its ten setters, the resume plan, the preambles, and why the flag clears
  only after a dispatch.
- [`event-bus-fold.md`](event-bus-fold.md) (read at `3aec210`) has the event
  log, its rotation and the `turn.retrying` row. This file adds the setters
  of each activity state, the state that nothing sets, what a restart keeps, and
  the repeated `turn.started` of a retry.
- [`chat-streaming.md`](chat-streaming.md) has the retry of the chat runtime.
  This file adds the retry of the Claude and Codex drivers, the cause of
  "A Claude turn is never sent twice", and the three layers of retry.
- New in this file: the status of all 17 upgrades with proof, the engine
  switch rule, the replay budget and its cuts, the compaction record, Start
  fresh, and the client side of branches.

## 1. In short

**What the feature is.** The reference project wrote two plans on
2026-08-17. Plan v1 has 17 upgrades of its "harness", the server part that
runs the engines (`docs/plans/agent-harness-upgrades.md:9-10`). Plan v2 keeps
the design text of v1 and changes the order and the scope
(`docs/plans/agent-harness-upgrades-v2.md:20-25`, `:43-51`). Plan v2 also
adds one item, a working folder for each bot. At `ad27f0716`, of these 18
items, eight are built, nine are partly built and one is not built. The
message branches are older than the plans and are built (section 3.1).

**The terms, each explained one time:**

- **Thread:** one conversation. Its messages are in `messages.db`. Its
  record (`TaskRecord`) is in `bots.json`.
- **Message tree:** each message has a `parentId`, the message before it. A
  root message has `parentId: null`. Two messages with the same parent are
  **siblings**.
- **Active leaf** (`activeLeafId`): the one message at the end of the
  conversation on screen. The visible conversation is the path from the leaf
  up through the parents (`server/store.ts:1109-1120`).
- **Branch:** one path from the root to a leaf. An edit does not change a
  message. It adds a sibling with the new text and makes it the leaf
  (`server/store.ts:1199-1224`). The old message and its replies stay, off
  the active path.
- **Version:** a user text message that has siblings that are also user
  text messages. The **version switcher** "‹ 2/3 ›" under a user message
  moves the leaf to another version (`src/components/ChatView.tsx:542-564`).
- **Engine session** and **resume cursor:** an engine, for example the
  Claude CLI, keeps its own copy of the conversation. The cursor is the id
  of that session, so that the next turn can continue it. A thread keeps one
  cursor for each engine instance (`resumeCursors`).
- **Rewind** and the **`rewound` flag:** after an edit or a switch, the
  engine session still holds the old branch. The flag `rewound: true` on the
  thread record tells the next turn not to continue that session
  (`server/resume-plan.ts:22-35`).
- **Rebuild** (also **replay**): the server sends the history of the active
  branch to a new engine session as text, in front of the new message
  (`server/turn-context.ts:61-81`). The history comes from stored messages.
- **Native replay:** some engines (the chat API engines) take the history as
  a list in the turn request, not as text (`server/index.ts:8338`).
- **Compaction record:** a summary of the older messages, stored as a
  message of kind `compaction`. A rebuild sends the summary in place of the
  older messages (`server/context-rebuild.ts:148-155`, `:209-216`).
- **Start fresh** and its **divider:** a person can start a new engine
  session. The server adds a divider message, and a rebuild reads only what
  comes after the newest divider (`server/fresh-start.ts:11-13`, `:29-32`).
- **`sendId`:** a key that the client makes for each send and each edit. A
  repeat of the same `sendId` gets the stored message, not a second turn
  (`server/routes/bot-messages.ts:546-554`).
- **Dispatch:** the moment the server gives a turn to the engine
  (`sendTurn`).
- **Busy:** a turn runs on the thread. The server refuses an edit and a
  switch on a busy thread with HTTP 409.
- **Activity state:** what a thread does now: `working`, `waiting-on-you`,
  `idle`, `no-signal`, `dead` or `parked.computer`
  (`packages/phone-protocol/src/wire.ts:88`).
- **Transient** and **terminal** errors: a transient error (a rate limit, an
  overload, a reset connection) can pass if the server tries again. A
  terminal error (a bad key, an unknown model) cannot
  (`server/drivers/retry.ts:188-214`).
- **Backoff:** the wait before the next try: 1 s, 3 s, then 8 s, each ±25 %
  (`server/drivers/retry.ts:9`, `:225-229`).

**The main facts:**

1. **Branches.** The tree is a `parentId` on each message and one
   `active_leaf_id` for each thread, in the table `thread_state`
   (`server/message-db.ts:76-79`). An edit adds a sibling. A switch walks
   from the chosen message down to its newest descendant
   (`shared/conversation-branch.ts:3-13`). The client and the server use the
   same function.
2. **Rewind.** An edit, a switch, Start fresh, a move to another model and a
   change of who can see the thread set `rewound: true` (ten places,
   section 4.3). The next turn does not resume. It rebuilds the active
   branch. The flag clears only after a dispatch that worked
   (`server/index.ts:8372`). So a failed dispatch rebuilds again on the next
   try.
3. **Model switch.** A turn rebuilds when another engine instance ran the
   last turn, or when this instance has no cursor
   (`server/turn-context.ts:18-29`). The first rule, "no cursor", failed for
   the switch A → B → A. The reference replaced it
   (`docs/plans/agent-harness-upgrades.md:141-143`).
4. **Portable context.** The rebuild has a fixed budget of 24,000 bytes and
   40 messages (`server/context-rebuild.ts:157`, `:194`). The plan wanted a
   budget sized to the window of the target model. That part is not built.
5. **Retry.** One module has the policy: 3 tries, backoff, a classifier by
   text. A Claude turn is sent again only if no model call answered and no
   text streamed (`server/drivers/retry.ts:219-223`). This is the fix behind
   "A Claude turn is never sent twice" (v0.1.150).
6. **Activity state.** The store keeps it in memory only. Load sets every
   thread to `idle` (`server/store.ts:316-318`, `:526-529`). `no-signal`
   exists in the type, and no code sets it.
7. **No Undo.** No control undoes an edit, a switch or Start fresh. The old
   version stays, and "‹" goes back to it. The design rule of the reference
   says "a change that needs undoing gets **Undo**" (`DESIGN.md:59`).
8. **Two stores, no shared transaction.** The branch row and the leaf are in
   one SQLite transaction (`server/message-db.ts:461-466`). The `rewound`
   flag is in `bots.json`, a different file. A failed or lost save of
   `bots.json` leaves a new branch with no rewind. Then the next turn can
   resume a session that holds the old branch (section 8).

## 2. Files read completely

Seven subagents read the files. Each one read its group of files completely,
or in ranges that are listed here. Group 1 read the two plans and the proof
of each upgrade. Groups 2 and 3 read the branches in the store and the send
path. Group 4 read the rebuild. Group 5 read the retry. Group 6 read the
activity state and the inspector. Group 7 read the UI.

### 2.1 Read completely

| File | Lines |
|---|---|
| `docs/plans/agent-harness-upgrades.md` | 648 |
| `docs/plans/agent-harness-upgrades-v2.md` | 388 |
| `shared/conversation-branch.ts` | 13 |
| `server/store.ts` | 2,256 |
| `server/routes/bot-messages.ts` | 874 |
| `server/branching.test.ts` | 279 |
| `server/thread-cache.ts` | 123 |
| `server/send-idempotency.ts` | 111 |
| `server/store-forks.ts` | 71 |
| `server/fresh-start.ts` | 42 |
| `server/fresh-start.test.ts` | 68 |
| `server/fresh-start.e2e.test.ts` | 128 |
| `server/resume-plan.ts` | 37 |
| `server/turn-context.ts` | 81 |
| `server/turn-context.test.ts` | 228 |
| `server/turn-dispatch-guard.ts` | 178 |
| `server/memory-freeze-restart.ts` | 55 |
| `server/context-rebuild.ts` | 238 |
| `server/context-rebuild.test.ts` | 585 |
| `server/compaction-summary.ts` | 82 |
| `server/compaction-summary.test.ts` | 205 |
| `server/context-budget.ts` | 34 |
| `server/host/conversation-compaction.ts` | 146 |
| `server/host/resume-check.ts` | 54 |
| `server/delta-context.ts` | 347 |
| `server/replay-settings.ts` | 18 |
| `server/replay-settings.test.ts` | 53 |
| `server/drivers/chat-size-limit.ts` | 148 |
| `server/native-replay.e2e.test.ts` | 71 |
| `server/drivers/retry.ts` | 258 |
| `server/drivers/retry.test.ts` | 224 |
| `server/drivers/retry-delay.test.ts` | 55 |
| `server/turn-outcome.ts` | 157 |
| `server/turn-outcome.test.ts` | 181 |
| `server/routine-recovery.ts` | 292 |
| `server/drivers/acp/startup-recovery.ts` | 21 |
| `server/process-shortage.ts` | 35 |
| `server/drivers/grok.ts` | 64 |
| `server/activity.ts` | 361 |
| `server/activity.test.ts` | 267 |
| `packages/phone-protocol/src/activity.ts` | 40 |
| `shared/activity.ts` | 1 |
| `src/lib/activity.ts` | 150 |
| `server/thread-events.ts` | 274 |
| `server/thread-events.test.ts` | 251 |
| `shared/inspector.ts` | 21 |
| `server/drivers/native.ts` | 118 |
| `server/host/idle-threads.ts` | 50 |
| `server/host/setup-recovered.ts` | 47 |
| `server/thread-retention.ts` | 48 |
| `server/turn-watchdog.ts` | 281 |
| `server/message-search-worker.ts` | 75 |
| `server/message-search-query.ts` | 79 |
| `server/model-prices.ts` | 54 |
| `server/redact.ts` | 48 |
| `server/drivers/claude-cost-history.ts` | 92 |
| `server/commands.ts` | 35 |
| `src/components/ChatView.tsx` | 1,201 |
| `src/components/message-menu.tsx` | 115 |
| `src/components/BubbleEditor.tsx` | 77 |
| `src/components/ChatView.cancelled-turn.test.ts` | 137 |
| `src/components/InspectorPanel.tsx` | 270 |
| `src/components/ActivityPanel.tsx` | 185 |
| `src/state/fork-panel.ts` | 126 |
| `src/state/fork-panel.test.ts` | 72 |
| `src/state/thread-stamps.ts` | 47 |
| `src/state/snapshot-navigation.ts` | 106 |
| `src/state/optimistic-send.ts` | 54 |
| `src/state/api.ts` | 97 |
| `src/lib/focus-message.ts` | 161 |
| `src/lib/transcript-derivations.ts` | 63 |
| `src/lib/inspector.ts` | 197 |
| `src/lib/inspector-window.ts` | 72 |

### 2.2 Read in ranges

Each function that this file describes was read whole inside its range.

| File | Lines in the file | Ranges |
|---|---|---|
| `server/index.ts` | 15,271 | 7419-8057 and 8290-8515 (`beginTurn` is 7419-8515), 6365-6380, 6400-6430, 6560-6632, 6692-6702, 6760-6775, 6880-6995, 7040-7075, 3770-3795, 4020-4035, 4917-4997, 2179-2190, 2226-2232, 9786-9792, 14248-14267, 15085-15130 |
| `server/message-db.ts` | 1,000 | 55-80, 360-470, 588-606 |
| `server/drivers/claude.ts` | 2,016 | 770-1009, 1155-1420, 1445-1495, 1540-1575, 1630-1816, 1945-1965 |
| `server/drivers/codex.ts` | 1,585 | 380-440, 640-720, 870-905, 1075-1100, 1136-1175, 1355-1395 |
| `server/drivers/openai-chat.ts` | 1,000 | 670-741 |
| `server/drivers/acp/core.ts` | 1,559 | 1350-1430 |
| `server/drivers/claude-keepwarm.ts` | 240 | 85-115 |
| `server/registry-store.ts` | 190 | 15-96, 146-190 |
| `server/registry-save.ts` | 76 | 1-71 |
| `server/save-batch.ts` | 108 | 1-60 |
| `server/harness/bus.ts` | 317 | 1-60, 100-115, 230-300 |
| `server/routes/status.ts` | 253 | 20-60, 110-140, 228-253 |
| `server/routes/threads.ts` | 612 | 512-570 |
| `server/runtime/runtime.ts` | 936 | 100-160 |
| `server/runtime/capabilities.ts` | 66 | 12-15, 40-53 |
| `server/contracts.ts` | 680 | 121-122, 144, 180-195, 294-316, 382, 520-545 |
| `server/host/person-waits.ts` | 156 | 1-20, 45-60, 118-130 |
| `server/side-jobs.ts` | 315 | 99-103, 155-200, 280-315 |
| `server/context-compaction.e2e.test.ts` | 520 | 123-185, 387-400, 458-520 |
| `server/delta-context.e2e.test.ts` | 1,389 | 520-580 |
| `server/store.test.ts` | 2,937 | 706-747, 860-872, 922-953, 1746-1902, 2007-2028, 2493-2514 |
| `server/drivers/claude.test.ts` | 5,117 | 3972-4165, 4975-5000 |
| `server/drivers/grok.test.ts` | 216 | 1-30, 118-200 |
| `packages/phone-protocol/src/wire.ts` | 1,000 | 80-92, 165-185, 392-400 |
| `packages/phone-protocol/src/runtime-events.ts` | 213 | 20-75, 130-133 |
| `src/state/store.tsx` | 3,277 | 85-160, 330-350, 560-575, 620-680, 715-790, 855-880, 1135-1280, 1545-1675, 2185-2260, 2345-2440, 3060-3095 |
| `src/state/store.test.ts` | 3,455 | 191-217, 1266-1400, 1539-1585, 2204-2240 |
| `src/components/ChatMoreMenu.tsx` | 289 | 120-185 |

### 2.3 Partly read

- `server/index.ts:8058-8260` (computer, browser, prompt and checkpoint setup
  in `beginTurn`) was read with each line cut at 170 to 500 characters.
  `:8261-8289` (the prompt parts) was searched only.
- About 20 calls of `store.activePath` in `server/index.ts` were read at the
  call line and the head of the function only (section 9).
- Test titles only: `server/drivers/codex.test.ts:4294-4525`,
  `server/turn-watchdog.test.ts`, `server/usage-ledger.test.ts`,
  `server/commands.test.ts`, `server/steer-e2e.test.ts`,
  `server/turn-images.test.ts`.
- Search only: `src/locales/en.json` (the keys cited), `DESIGN.md` (the words
  branch, version, edit and undo), `server/user-errors.ts:22-23`.
- For the upgrades out of scope, group 1 read the proof function of each
  one, not the whole file (section 3.1).

### 2.4 Claims that the lead checked against the code

| Claim | Checked at |
|---|---|
| The leaf rule: the newest child by `at`, a tie goes to the later row | `shared/conversation-branch.ts:1-13` |
| The path walk from the leaf | `server/store.ts:1109-1120` |
| `branchMessage` changes memory before the database, then sends `message` and `thread` | `server/store.ts:1199-1224` |
| `setActiveLeaf` changes memory before the database | `server/store.ts:1226-1234` |
| The row and the leaf are written in one transaction | `server/message-db.ts:461-466`, `:594-596` |
| The `sendId` check comes before the busy check, and a match gets 202 | `server/routes/bot-messages.ts:546-556` |
| A switch always sets `rewound: true` | `server/routes/bot-messages.ts:582-597` |
| An edit sets `rewound: true` after `branchMessage` | `server/index.ts:7569-7573` |
| The flag and the cursors clear after the dispatch | `server/index.ts:8372` |
| The resume plan | `server/resume-plan.ts:1-37` |
| `engineIsFresh` and the four preambles | `server/turn-context.ts:18-39` |
| The budget is fixed. The comment of `contextWindow` says that it sizes the rebuild | `server/context-rebuild.ts:155-232`, `server/host/resume-check.ts:25-31`, `server/contracts.ts:532-533` |
| Retry limits and the resend gate | `server/drivers/retry.ts:1-12`, `:216-229` |
| `answered` and `sawStreamDelta` in the Claude driver | `server/drivers/claude.ts:1452-1492` |
| `busy` is stored and can differ from the activity | `server/store.ts:1611-1636` |
| Load sets every thread to `idle` | `server/store.ts:314-319` |
| No code sets `no-signal` | a search of `server`, `shared`, `src` and `packages/phone-protocol/src` |
| The client edit and the switch, with no rollback of a failed switch | `src/state/store.tsx:2394-2420` |
| The switcher and its disabled state | `src/components/ChatView.tsx:540-566` |
| Regenerate sends an edit with the same text | `src/components/ChatView.tsx:904-908` |
| The strings of the 409 refusals and the switcher | `src/locales/en.json:2712-2713`, `:9725`, `:9728` |
| `sessionHolds` decides "resumes" from the cursor only | `server/routine-recovery.ts:187-195`, `server/index.ts:8750` |
| The command receipt is in the same transaction as the rows | `server/commands.ts:1-35` |
| A failed batched save is only logged | `server/save-batch.ts:26-36` |
| Outside a batch, `patchTask` saves at once inside `commitRegistryChange`, and a failed save puts the old record back. `rewound` is not a deferred field | `server/store.ts:638`, `:2008-2028`, `server/registry-save.ts:16-25`, `:59-64`, `server/registry-store.ts:146-156`, `server/save-batch.ts:21-24` |
| Ten places set `rewound: true` | a search for `rewound` in `server/` and `shared/`, without the tests |
| `markTaskDispatched` saves and sends no event | `server/store.ts:1789-1794` |
| Start fresh writes the flag first, then the divider | `server/fresh-start.ts:17-33` |
| The design rule for Undo | `DESIGN.md:59` |
| Commit `812c99063` (2026-11-08) is "Never send a Claude turn again after one of its model calls answered". v0.1.150 is dated 2026-11-09 | `git show`, `docs/research/changelog.md:392` |
| Commit `a9d483545` (2026-11-23) is "fix: charge Claude session forks for their own usage". v0.1.178 is dated 2026-11-23 | `git show`, `docs/research/changelog.md:410` |

### 2.5 Lines that moved since the earlier research

| Earlier citation | Now (`ad27f0716`) |
|---|---|
| `chat-turns.md`: the edit block at `server/index.ts:7574-7579` (3aec210) | `:7569-7574`. `beginTurn` moved up by 5 lines |
| `chat-turns.md`: the busy check at `server/index.ts:7504` | `:7499` |
| `chat-turns.md`: `ACTIVITY_BUSY` at `server/store.ts:122` | `:124` |
| `chat-turns.md`: the load reset at `server/store.ts:314-316`, `:524-527` | `:316-318`, `:526-529` |
| `chat-turns.md`: `setTaskActivity` and `refreshBotActivity` at `:1619-1644` | `:1611-1636` |
| `chat-turns.md`: `buildTurnContext` call at `server/index.ts:7751` | `:7746` |
| `store-and-data-format.md`: `branchMessage` memory first at `server/store.ts:1215-1217` (ed8cb7278) | `:1216-1218`. Lines after `:49` moved down by 1 |
| `store-and-data-format.md`: `insertMessageAfter` at `:1159-1160` | `:1160-1161` |
| `event-bus-fold.md`: the `turn.retrying` row at `server/index.ts:6618-6624` | `:6613-6618` |
| `event-bus-fold.md`: the append group of `server/harness/bus.ts` | `:250-266`. Lines after `:214` moved by +5 |
| `event-bus-fold.md`: the activity route of `server/routes/status.ts` | `:237-250`. The events route `:119-134` did not move |
| `chat-streaming.md`: `chat.ts:681-731` | The file is `server/drivers/openai-chat.ts`. The lines did not change |
| `turn-context.ts`, `resume-plan.ts`, `context-rebuild.ts`, `retry.ts`, `turn-outcome.ts`, `runtime/runtime.ts` | No change since `3aec210` or `ed8cb7278` |

## 3. How it works

### 3.1 The status of each upgrade

"v1" is `docs/plans/agent-harness-upgrades.md`, "v2" is
`docs/plans/agent-harness-upgrades-v2.md`. Only the rows marked "in full" are
analyzed in the next sections. For each other row, this table is the whole
record.

| # | Upgrade (plan text) | Status | Proof in the code | Note |
|---|---|---|---|---|
| 1 | Rebuild the context for a new engine after a model switch. Decide by who ran the last turn (v1:125-150, v2:59-65, `:162-380`) | Built. **In full**, 3.6 | `server/turn-context.ts:18-29`, `server/resume-plan.ts:18-37`, `server/store.ts:1789-1794` | The first rule failed for A → B → A and was replaced (v1:141-143, v2:169-180) |
| 2 | Attachments from the person to the bot (v1:152-175) | Built: images and files, gated by `capabilities.images` | `server/turn-images.ts:66-83`, `server/attachments.ts:21-23`, `server/contracts.ts:144`, `src/components/Composer.tsx:289-300` | v2 cut it to images and moved it from 1.6 to 3.5 (v2:45, `:96-98`, `:126`) |
| 3 | Automatic retry in the main drivers (v1:177-198) | Built. **In full**, 3.10 and 3.11 | `server/drivers/retry.ts:6-9`, `:188-223`, `server/drivers/claude.ts:1663-1717` | v2 moved it from 1.3 to 3.4 (v2:74-77, `:125`). Plan 3.4 says "a retry after partial output discards the partial". The code refuses the retry instead (`retry.ts:222`) |
| 4 | Search across threads, with filters and pages (v1:200-219) | Partly built: no filter by bot or kind, no pages | `server/routes/threads.ts:515-552`, `server/message-search-query.ts:39-44`, `server/message-search-worker.ts:21`, `:27`, `:57` | A `LIKE` scan with no index, 1 to 100 hits. Activity rows match on the tool name only (`message-search-query.ts:42`). A hit on another branch switches the branch for a bot, not for a room (`src/lib/focus-message.ts:58-66`) |
| 5 | Cost and usage for each turn, thread and bot (v1:221-237) | Built | `server/model-prices.ts:43-54`, `server/usage-ledger.ts:22-54`, `src/components/UsageSection.tsx:46-61` | See problem (3) in section 8.2 |
| 6 | A liveness check that polls the engine processes, with a "lost" state (v1:243-262) | Partly built: a silence watchdog, no process poll, no "lost" state | `server/turn-watchdog.ts:49`, `:69-81`, `:228-251`, `server/index.ts:4917-4918` | The blanket reset at load stays (`server/store.ts:315-318`, `:526-529`). v1 wanted to replace it (v1:258-259) |
| 7 | Portable context: 7a the window in the catalog, 7b tool lines in a replay, 7c a compaction record, 7d a rebuild sized to the target window (v1:264-322) | Partly built. **In full**, 3.7 and 3.8 | `server/context-rebuild.ts:96-238`, `server/host/conversation-compaction.ts:77-140` | 7a and 7c are built. 7b is built and off by default (`server/replay-settings.ts:6-17`). 7d is not built |
| 8 | Durable delegations: store the queue, drain it after the liveness check (v1:324-338) | Built, by another design | `server/runtime/runtime.ts:108-158`, `server/runtime/store.ts:116-149` | The job runtime in `runtime.db` took the place of `server/delegations.ts`. See `store-and-data-format.md` 3.10 |
| 9 | Tool deadlines and loop detection (v1:340-356) | Partly built. Feature `turn-limits` | `server/repeat-detector.ts:1-15`, `server/drivers/chat-repeat-guard.ts:6-9`, `server/index.ts:4918` | v2 split it: detection (2.8), then enforcement after steering (3.3) (v2:116, `:124`) |
| 10 | Redact secrets in tool results before they are stored (v1:358-373) | Partly built | `server/message-redaction.ts:7`, `server/store.ts:1136`, `:1158` | Tool input and output get only `scrubHeldSecrets` (`server/index.ts:6407`, `:6427`). `patchMessage` does not redact (`server/store.ts:1236-1250`) |
| 11 | Approvals that fail closed, with a typed outcome (v1:375-396) | Partly built. Feature `approval-cards` | `server/contracts.ts:121-122`, `:313` | The outcome is `allowed-once`, `rejected`, `answered` or `unavailable`, not `cancelled`. `request.opened` still has `tool` and `summary`, not `itemId` (`packages/phone-protocol/src/runtime-events.ts:130-133`) |
| 12 | A generation number on each event of a driver, to drop old events (v1:398-415) | Not built. v2 deferred it (v2:48, `:136-140`) | No field on `RuntimeEventBase` (`packages/phone-protocol/src/runtime-events.ts:24-38`) | The host fences with a claim id for each turn instead (`server/index.ts:1877`, `:7623`, `:4965-4966`) |
| 13 | The store sends the event as part of the write (v1:417-432) | Partly built, by a rule that each method follows or not | `server/store.ts:1134-1149`, `server/commands.ts:1-35` | Three methods break the rule (section 8.2, problem (1)) |
| 14 | Activity state on the server: five states, `busy` derived (v1:434-455) | Partly built. **In full**, 3.12 | `packages/phone-protocol/src/wire.ts:88`, `server/store.ts:124`, `:1611-1636` | Six states. `busy` is stored, not derived. `no-signal` has no setter |
| 15 | A raw event inspector, with the driver generation of each event (v1:457-469) | Partly built: no generation | `server/routes/status.ts:119-134`, `server/thread-events.ts:8-11`, `:140-234`, `src/components/InspectorPanel.tsx:19`, `:195-211` | v2 moved it up to 1.2 (v2:67-72). `turn.progress` shows live and is not logged (`server/harness/bus.ts:105-108`) |
| 16 | A driver for local models (Ollama, LM Studio, vLLM), with pruning of old tool results (v1:475-505) | Built, by another design | `server/drivers/openai-compat.ts:94-111`, `:190-193`, `server/drivers/ollama.ts:7-12` | One `openai-compat` driver with a `catalog` kind. The pruning was not found |
| 17 | Steering in the middle of a turn (v1:507-538) | Built | `server/contracts.ts:329`, `:382`, `server/drivers/claude.ts:1787`, `:1796-1815` | The plan feared that stdin closes after the prompt. It stays open now. See `queue-and-steer.md` |
| v2 1.4 | A working folder for each bot (v1:611-612, v2:79-87) | Built, and also for each thread | `server/bot-cwd.ts:9-32`, `server/routes/bot-patch.ts:493` | |
| — | Message branches with a version switcher. v1 says "do not rebuild" (v1:99-105) | Built (commit `aac0cf212`, 2026-08-13). **In full**, 3.2 to 3.5 | `server/store.ts:1109-1120`, `:1199-1234`, `server/routes/bot-messages.ts:527-597` | A tree view was deferred (v1:570-572) |

### 3.2 Edit a message

The client sends `POST /api/bots/:id/messages/:messageId/edit` with
`{ text, threadId, sendId }` (`src/state/store.tsx:2399-2402`).

The route (`server/routes/bot-messages.ts:527-580`):

1. Find the thread. A thread of another person on a team server gets 403
   (`:531-534`).
2. A refused text or an empty text gets 400 (`:535-538`).
3. The source must be a user text message, else 404 "only user messages can
   be edited" (`:539-543`). It can be on any branch.
4. A retry by a person who may not retry gets 403 `retry_not_yours`
   (`:544-545`).
5. **The `sendId` check, before the busy check.** The comment: "a retried
   edit's own fork is what is busy" (`:546`).
   1. Find the first row of the thread with this `sendId`. This is a linear
      scan of all rows on all branches (`server/send-idempotency.ts:26`).
   2. A row with another role, kind, text or reply target is a conflict
      (`server/send-idempotency.ts:28-36`). A match with another parent is
      also a conflict (`:550`).
   3. A conflict gets 409 "sendId already belongs to another message"
      (`:551`). A match gets 202 with the stored row and **starts no turn**
      (`:553`).
6. **The busy check.** A busy thread gets 409 "the thread is working — stop
   it before editing" (`:556`, `src/locales/en.json:9725`). The comment says
   that the code is synchronous from here, so two edits cannot both pass
   (`:555`).
7. A credential that a phone saves now gets 409 (`:557-559`).
8. A missing engine or a policy refusal gets 409 (`:560-570`).
9. A line from the Bot API with the same words goes to `botApiRetry`
   (`:571-573`).
10. Call `startTurn` with `editedMessageId` and `sendId`, and answer 202 with
    the new row (`:577-579`).

The start of the turn (`beginTurn`, `server/index.ts:7419-8515`, inside
`batchSaves` at `:7418`):

11. Run the typed refusals in order: maintenance, no bot (404), held or
    paused (409), budget, busy (409 `thread_busy`) and others
    (`:7461-7526`).
12. `store.branchMessage(...)`. A null result gets 400 "only a user text
    message can be edited" (`:7570-7571`).
13. `store.patchTask(..., { rewound: true })` (`:7572`). This save of
    `bots.json` is written when the synchronous pass ends
    (`server/save-batch.ts:10-24`).
14. Mark the request row and set the dispatch claim to `setup`. Set the
    activity to `working` and start the watchdog. Start the setup in the
    background, and return the row (`:7648-7676`, `:8514`). There is no `await` from step 11
    to here.

The store (`branchMessage`, `server/store.ts:1199-1224`):

15. Find the source. None gives null (`:1200-1202`).
16. Build a new user text row with a new id, the new text, the parent of the
    source (`source.parentId ?? null`) and the reply target of the source
    (`:1203-1209`).
17. Keep the reaction of the source only if the text is the same (`:1210`).
    Keep `automated` and `waitId` only if the trimmed text is the same. The
    comment: "Regenerate and Try again send the stored words back"
    (`:1211-1212`).
18. Push the row and set the leaf **in memory** (`:1216-1217`).
19. Write the row and the leaf **to the database** in one transaction
    (`:1218`, `server/message-db.ts:461-466`).
20. Send the event `message`, then the event `thread` with the new leaf
    (`:1220-1222`). The comment: "A client adopts a new message as its leaf
    only when it chains onto its leaf; a sibling needs this pointer".

Edge cases:

- An edit of an edit adds one more sibling of the same parent (`:1208`).
- An edit of the root message gives `parentId: null`.
- With no `sendId`, each retry adds a new sibling. The client always sends
  one (`src/state/store.tsx:2397`).
- A retry of a failed edit with the same `sendId` gets the stored row and
  does not run the turn again. A new try needs a new edit, which adds a new
  sibling.

### 3.3 Switch to another version

1. The client moves its own leaf at once, then sends
   `POST /api/bots/:id/active-branch` with `{ messageId, threadId }`
   (`src/state/store.tsx:1562-1565`, `:2416-2420`).
2. The route checks the thread (403) and the busy state: 409 "the thread is
   working — stop it before switching versions" (`server/routes/bot-messages.ts:585-589`,
   `src/locales/en.json:9728`). A credential that a phone saves gets 409
   (`:590-592`).
3. `store.setActiveLeaf` (`server/store.ts:1226-1234`):
   1. An id that is not a message of the thread gives null, and the route
      answers 404 "no such message" (`:1228`, `bot-messages.ts:594`).
   2. `branchLeafFrom` (`shared/conversation-branch.ts:3-13`): for each
      parent, keep the child with the largest `at`. A tie goes to the later
      row, because the test is `>=` (`:8`). Then walk from the chosen id down
      the newest child until there is none.
   3. Set the leaf in memory, then in `thread_state`, then send `thread`
      (`:1230-1232`).
4. The route sets `rewound: true`, also when the leaf did not change, and
   answers 200 `{ activeLeafId }` (`bot-messages.ts:595-596`). No turn
   starts.

Edge cases:

- The id can be any message, also a bot message. A search hit off the active
  path also switches the branch (`src/components/ChatFindBar.tsx:63-67`,
  `src/lib/focus-message.ts:58-62`). So the next turn rebuilds.
- The walk goes to the newest continuation by `at`, not to the leaf that the
  person left on that version.
- This route runs outside any save batch. So the save of `rewound` is
  written at once, and a failed save throws (`server/save-batch.ts:21-24`).
  The leaf is already moved at that point (section 8.2).

### 3.4 Why a busy thread refuses an edit and a switch

1. `threadBusy` is `task.busy` or a dispatch claim in memory
   (`server/index.ts:2179-2181`).
2. A new row of a turn takes the leaf of the moment of the write as its
   parent (`server/store.ts:1136`). If the leaf moves during a turn, the rest
   of that turn goes onto another branch.
3. So the edit, the switch and Start fresh refuse a busy thread with 409
   (`server/routes/bot-messages.ts:556`, `:589`, and `:499-510`).
4. A guarded send from an outside interface (the Slack worker) must also
   name the leaf it saw: `expectedActiveLeafId`. Another leaf gets 409
   `guarded_branch` "the conversation changed before this message could
   start" (`:323-325`).
5. The test "refuses to rewind a live thread" checks both 409s and that no
   row was added (`server/branching.test.ts:193-200`).
6. Dispatch claims are in memory only. After a restart, `threadBusy` is
   false, and edits and switches work again.

### 3.5 Start fresh

1. The route refuses a busy thread (409 "stop it before starting fresh") and
   a thread that saves a credential (`server/routes/bot-messages.ts:499-510`,
   `src/locales/en.json:9729`).
2. `startFresh` writes the thread record first: `rewound: true`, no cursors,
   no applied compaction, no context floor, no context model, and no
   `usage.context`. The usage totals stay (`server/fresh-start.ts:19-25`).
   The comment says why the record comes first: "a divider with the old
   session still resumable would look fresh and not be" (`:17-18`).
3. If the path is empty, or its newest row is a divider, add nothing and
   return null (`:26-28`). A second press still clears the cursor
   (`server/fresh-start.test.ts:51-58`).
4. Else add the divider: `role: "bot"`, `kind: "compaction"`,
   `compaction.fresh: true`, `foldedThroughId` = the newest id (`:29-32`).
5. Each reader that builds engine context reads only what comes after the
   newest divider (`sinceFreshStart`, `:11-13`). These readers are at
   `server/index.ts:5407`, `:6986`, `:7707`, `:12304`, `:15108` and
   `server/host/resume-check.ts:46`. The readers for the UI and for
   bookkeeping read the whole active path.
6. There is no Undo of Start fresh. The menu item is off while busy, with no
   messages, or at a fresh start already (`src/components/ChatMoreMenu.tsx:126-132`).

### 3.6 The choice between resume and rebuild, at dispatch

The setup of a turn (`server/index.ts:7706-7777`):

1. Take the active path after the newest divider:
   `sinceFreshStart(store.activePath(threadId))` (`:7707`). The row of this
   turn is not replayed (`:7706`).
2. `replayInputs` maps each row to `{ id, role, text }` with `directContext`
   (`:6946-6962`), finds the newest compaction record, and calls
   `selectReplay` with the budget (`server/host/resume-check.ts:25-31`).
3. `resumePlan` decides (`server/resume-plan.ts:18-37`):
   1. `contextReset`: a compaction record applies, and its id is not the
      `appliedCompactionId` of the thread (`:20`).
   2. The cursors count as empty after a reset or a change of folder (`:21`).
   3. `rewound` comes from the thread record (`:22`).
   4. `fresh` is true when not rewound, with no outside update, and
      `engineIsFresh` is true (`:23`).
   5. The thread resumes only when it is not rewound, not fresh, not reset,
      and has no outside update (`:35`, `server/turn-context.ts:58-59`).
4. `engineIsFresh` (`server/turn-context.ts:18-29`):
   1. No user message in the history: false. A greeting alone never causes a
      rebuild (`:25`).
   2. The thread knows the last engine (`lastInstanceId`): fresh when
      another instance ran the last turn, **or** this instance has no cursor
      (`:26`).
   3. An old thread with no `lastInstanceId`: not fresh only when the one
      cursor belongs to this instance (`:27-28`).
5. On a reset, the server clears all cursors in the store now (`:7726`).
6. `buildTurnContext` (`server/turn-context.ts:61-81`) makes the text:
   - A resume, a native replay or an empty history: the text of the person
     alone (`:67`).
   - Else a preamble, then `User: …` and `Assistant: …` lines, then
     "[Now reply to the user's latest message:]", then the new text.
   - The preamble is one of these (`:31-39`): "[The user rewound this
     conversation (edited a message or switched to another version).
     Everything before this point was replaced by the following history:]",
     "[You are joining this conversation mid-thread (the user switched this
     bot over to you). The conversation so far:]", or the text for an
     outside update.
7. The server makes a recovery text only when it sends a cursor. The
   driver uses it when the engine refuses the cursor: "[Your previous session for this
   conversation could not be resumed, so this is a new session. The
   conversation so far:]" (`server/index.ts:7757-7760`,
   `server/turn-context.ts:38-55`).
8. `sendTurn` gets the text, the cursor, `sessionReset: !resume`, the
   recovery text, and `transcript` for a native replay (`:8335-8338`). The
   engines with a native replay are the chat API engines
   (`server/runtime/capabilities.ts:15`, `:40-53`). This is a capability
   table, not a test of the driver name.
9. Wait until a stopped start of the same thread is clear of its engine,
   for at most 30 s (`:8232`, `server/turn-dispatch-guard.ts:109-167`).
10. After a dispatch that worked (`:8371-8377`):
    - `if (rewound) patchTask({ rewound: false, resumeCursors: {} })`
      (`:8372`). This also removes the cursors of the other engines.
    - A reset stores `appliedCompactionId` (`:8373`).
    - `markTaskDispatched` stores `lastInstanceId` (`:8375-8377`,
      `server/store.ts:1789-1794`).
11. A dispatch that fails keeps `rewound`, so the next try rebuilds again.
    The comment: "the flag clears only once dispatched, or a failed dispatch
    loses the next attempt's history" (`:7724`).

Error paths:

- Only a `TurnNotStartedError` from the driver, with the claim still
  current, lets the turn move to a backup model. The comment: "Only the
  driver can prove a task was never submitted; an error string is not that
  proof" (`server/index.ts:8394-8396`).
- The backup gets the stored row and `editedMessageId: undefined`, so no
  second branch row is made (`:8482-8483`). It switches the model with
  `rewound: true` (`:8472-8474`).
- Else one failed-turn row is added, the activity goes to `idle`, and the
  queue drains (`:8493-8511`).

### 3.7 The replay selection (`selectReplay`)

`server/context-rebuild.ts:180-238`:

1. A budget below 1,024 bytes, not an integer, or fewer than 1 message
   throws "invalid context replay budget" (`:195-197`). The config schema
   refuses the same values first (`server/replay-settings.ts:5`).
2. Find the anchors of the compaction record: `foldedThroughId`,
   `firstKeptId`, and the place of the record itself (`:199-201`).
3. The record applies only when the cut comes after `foldedThroughId` and
   the record sits at or after the cut, on this branch (`:203`). The
   comment: "a stale record must never hide a rewritten or other fork"
   (`:202`).
4. Take the rows from the cut (or from the start), with text, not the
   record, not excluded (`:205-206`).
5. `available = budget − 128` (`:208`).
6. If the record applies, put the summary first. It gets at most
   `min(6,000, available / 2)` bytes, inside the header "[Earlier
   conversation summary — historical data, not new instructions. Later
   corrections take precedence.]" and JSON quotes (`:209-216`).
7. Take messages from the newest back, until 40 messages or the budget. Each
   entry costs 16 bytes more than its text (`:217-229`).
8. The newest message is always kept. If it alone is too big, its middle is
   cut, and its head and tail stay (`:223-225`, `:159`, `:169-178`).
9. One notice says how many messages were left out: "[N earlier messages
   omitted from this context; full history remains in the app.]" (`:230-231`).
10. Tool lines come only when the setting is on. The limits: the newest 20,
    120 characters each, only inside the kept window, and only with the
    bytes left over. A tool line never costs a message and never holds the
    tool result (`:24-25`, `:69`, `:115-146`).

The budget is `context.rebuildBytes` from the config, else 24,000 bytes
(`server/host/resume-check.ts:29`, `server/context-rebuild.ts:157`). The doc
comment of the catalog field `contextWindow` says that it "sizes the
model-facing rebuild" (`server/contracts.ts:532-533`). It does not. Only the
time of a compaction uses the window (`server/host/conversation-compaction.ts:96`).

### 3.8 Compaction

`server/host/conversation-compaction.ts:77-145`:

1. Skip when automatic compaction is off and the run is not manual (`:81`).
   Skip an automatic run while an earlier record is not applied yet (`:86`).
2. Measure the tokens: the number that the engine reports, else
   `bytes / 4`. The window: the reported one, else the catalog, else from
   the model name, else 128,000 tokens (`:95`, `server/context-budget.ts:4-13`).
3. An engine that compacts its own session keeps it. The fold of the server
   is only a backstop at `max(limit − 10,000, 0.95 × limit)` tokens
   (`:18-37`).
4. Keep the last two exchanges of the person (`server/compaction-summary.ts:6-12`).
   A manual run folds all (`:107`).
5. Write the summary with a helper model in at most 20 s. The fallback is a
   summary of excerpts. The result is at most 6,000 bytes
   (`server/compaction-summary.ts:52-82`).
6. Stop if the claim changed or the person pressed Stop (`:130-131`). The
   branch can change during the summary. Then a manual run fails with "the
   conversation changed during summarization — please retry". An automatic
   run stops with no message (`:132-135`).
7. Append the record as a message with the command key
   `compaction.append` and `<thread>:<last id>:<firstKeptId>` (`:136-140`).
   Nothing is deleted.
8. The next turn sees `contextReset` (3.6 step 3) and rebuilds with the
   summary.

### 3.9 How a client shows the tree

1. The client keeps all loaded rows of the open thread in one array, and one
   leaf (`src/state/store.tsx:337`, `:342`).
2. The visible path is the walk from the leaf up through `parentId`,
   reversed (`src/state/snapshot-navigation.ts:17-33`). With no leaf, or a
   leaf that is not loaded, the whole array shows, all branches mixed
   (`:19`, `:23`).
3. A new row becomes the leaf only if its parent is the current leaf. A row
   that is already there is ignored. A server row replaces the optimistic
   row with the same `sendId` (`src/state/store.tsx:1196-1220`).
4. A sibling made by another client does not chain onto the leaf. The
   `thread` event moves the leaf for it (`src/state/store.tsx:3079-3081`).

The edit, the switch and their error paths on the client are in section 5.

### 3.10 Retry in the Claude driver

`finalizeClose`, `server/drivers/claude.ts:1641-1769`:

1. Stop the process tree. If that fails, warn and stop (`:1644-1650`).
2. The person pressed Stop: end the turn `interrupted` (`:1653-1654`).
3. A result was held: never launch again, and settle it (`:1655-1663`).
4. Classify the error (`:1670-1671`, `server/drivers/retry.ts:188-214`):
   1. A safety block of the provider is terminal, also inside a 503 or a
      429 (`:190-191`).
   2. An exit by a signal is terminal, `interrupted` (`:192-194`).
   3. Terminal words come first: auth, usage limit, quota, unknown model,
      400, 404, "cancelled by user" (`:60-76`).
   4. Then the HTTP status. 429 is a rate limit, 5xx goes on to step 5
      (`:146-184`).
   5. Then transient words: 429, "overloaded", any `5\d\d`, `ECONNRESET`,
      "timeout" (`:34-46`).
   6. Else terminal (`:203`, `:213`).
5. `mayResendTurn` (`retry.ts:219-223`) allows a resend in two cases:
   - the launch never took the prompt.
   - all of these hold: a nonzero exit, a transient error, **no text
     streamed, no model call answered**, and attempt < 2.
6. On a resend, drop the session. For a real failure, add 1 to the attempt,
   compute the backoff and send `turn.retrying { attempt, delayMs, reason }`
   (`claude.ts:1676-1686`). A resend of a launch that never took the prompt
   has no event, no wait and no count.
7. Wait. A Stop during the wait ends the turn with `turn.completed { ok:
   false, stopReason: "interrupted" }` (`:1688-1695`, `retry.ts:237-258`).
8. Launch again with the same turn id. A Stop just before the spawn also
   ends the turn (`:1287-1292`, `:1698-1700`).
9. The new process sends `turn.started` again with the same turn id
   (`:1785`). The Codex and ACP drivers send it once only (`codex.ts:421`,
   `acp/core.ts:1058`). The repeat deletes the error that the first try
   recorded (`server/turn-outcome.ts:27-29`), and resets the start time of
   the fold (`server/index.ts:6366-6369`).

Limits:

- `answered` is set on each assistant frame that is not an error
  (`claude.ts:1487`). A tool call is always in such a frame. So tool work
  means `answered`.
- `sawStreamDelta` is set by `text_delta` only, not by `thinking_delta`
  (`:1454-1458`). A turn that streamed only reasoning and then died is sent
  again, and its reasoning tokens were already spent.
- Every capped path stops at attempt 2, so no path reaches the 8 s step.
- Some resends do not count:
  - the resend before the prompt (`retry.ts:221`)
  - the quiet relaunch of a warm Codex process (`codex.ts:690-692`)
  - the resends of the chat runtime for `tool_limit` and
    `request_too_large` (`openai-chat.ts:685-722`).

  So one turn can go to the engine more than 3 times.
- The Codex relaunch for `unsupported_input` has no attempt guard
  (`codex.ts:893`). After two counted tries it would wait 6 to 10 s and show
  "attempt 4/3". This is from the code. Nobody saw it.

### 3.11 The three layers of retry

| Layer | When | Sends a turn again after work? | Stored | Source |
|---|---|---|---|---|
| (a) The driver | A transient error | Never: `answered` and `streamed` stop it | No. In memory, and the timer does not hold the process open | `retry.ts:219-223`, `:251`, `claude.ts:927`, `codex.ts:393-417` |
| (b) The runtime at a restart | A `running` job at the start | Yes, once, unless it did an outward action: a send, a git commit or push, money words | Yes, `runtime.db` | `server/runtime/runtime.ts:129-145`, `server/turn-outcome.ts:100-114` |
| (c) A routine run | A failure, after 15 s or 60 s | Yes, once, with a note: "check what the first start already did … so nothing is done twice" | Yes, `routines.json` | `server/routine-recovery.ts:64-65`, `:161-185` |

The ACP core has no backoff. A failed start that did nothing goes to a
backup engine. Its comment: "Never replay an accepted prompt (it may have run
tools)" (`server/drivers/acp/core.ts:1380-1408`).

Layer (c) has one more path. `sessionHolds` decides if the engine still
holds the first prompt. If so, the second start sends only a short note
that says "The routine's instructions are in the message above and are not
repeated here" (`server/routine-recovery.ts:182-208`). Its wiring decides
"resumes" from `lastInstanceId` and the cursor only, and passes the whole
active path (`server/index.ts:8750`). It does not read `rewound`, the
divider of Start fresh, or the real replay budget. So after an edit or a
Start fresh, the second start can send the note to an engine that does not
have the instructions. This is from the code. No test or run shows it.

### 3.12 The activity state

`setTaskActivity(botId, threadId, activity, noTurnRunning = false)`
(`server/store.ts:1611-1629`):

1. A missing bot or thread gives null (`:1614`).
2. `busy = ACTIVITY_BUSY.has(activity) && !noTurnRunning` (`:1615`). The
   busy set is `working`, `waiting-on-you` and `no-signal` (`:124`).
3. Nothing changes if the activity and busy are the same (`:1616`).
4. Write `activity` and `busy`. Set `turnStartedAt` when busy starts. Delete
   it when busy ends (`:1617-1621`).
5. Clear a snooze "until new activity" and save `bots.json`. This is the
   only save here (`:1622-1625`).
6. Compute the state of the bot from its threads in this order:
   `waiting-on-you`, `no-signal`, `working`, `dead`, else `idle`
   (`:1631-1636`). So a bot with one dead thread and one working thread
   reads `working`.
7. Send the event `{ type: "bot", botId, threadId }` (`:1627`).

Who sets each state:

| State | Set by | Source |
|---|---|---|
| `working` | A direct turn is admitted, then the watchdog starts | `server/index.ts:7667-7669` |
| `working` | A room turn starts. A card that the turn waited on gets its answer | `index.ts:9790`, `:6587-6589` |
| `waiting-on-you` | A `request.opened` card with no answer, in the fold | `index.ts:6566-6570` |
| `waiting-on-you`, not busy | A turn ended with a card still open | `server/host/person-waits.ts:46-58` |
| `idle` | `turn.completed` ends a direct turn, unless the thread is `dead` | `index.ts:6698-6700` |
| `idle` | The watchdog finds a stall. The comment: "Stands in for the missing turn.completed" | `index.ts:4990-4997` |
| `idle` | A busy thread that no claim and no engine hold | `server/host/idle-threads.ts:26-39` |
| `dead` | A `runtime.error` with `setup: true` | `index.ts:6630` |
| `parked.computer` | A turn ends while its computer is parked | `index.ts:6699`, `:8435-8439` |
| `no-signal` | **Nothing** | A search of `server`, `shared`, `src` and `packages/phone-protocol/src` |

How a busy state that is wrong is cleared:

1. The watchdog watches a turn from its admission, "not dispatch: a turn can
   wedge in setup long before any provider event exists" (`index.ts:7668-7669`).
2. Its limits: 20 minutes of silence, 2 hours while a tool runs, 2 minutes
   after the engine process exited (`index.ts:4917-4918`,
   `server/turn-watchdog.ts:49`, `:245-251`).
3. On a stall, it stops the turn, sets `idle` and drains the queue
   (`index.ts:4935-4997`).
4. Each sweep also frees a busy thread that no claim and no engine hold
   (`index.ts:4934`, `server/host/idle-threads.ts:26-39`).
5. A `dead` thread has no time limit. It clears at the next dispatch, after
   a good turn on the same engine, or at a restart
   (`server/host/setup-recovered.ts:18-43`).

### 3.13 A restart

1. The store sets `busy = false` and `activity = "idle"` on each bot and
   thread, and deletes `turnStartedAt` (`server/store.ts:315-318`,
   `:526-529`). A save never writes them (`server/registry-store.ts:73-76`).
2. `waiting-on-you` is made again from the stored cards of a recent window
   (`server/host/person-waits.ts:124-130`).
3. A `dead` mark is lost. The comment: "Marks do not outlive the server"
   (`server/host/setup-recovered.ts:18`).
4. A thread loads when it is first read: the rows by `rowid`, then the
   stored leaf, else the last row (`server/message-db.ts:377-382`,
   `server/thread-cache.ts:67`). An old row with no `parentId` chains to
   the row before it (`server/thread-cache.ts:57-66`).
5. `rewound`, `resumeCursors`, `lastInstanceId` and `appliedCompactionId`
   are in `bots.json`. The divider of Start fresh is a message. Both
   survive a restart (`server/fresh-start.test.ts:60-67`).
6. A retry that waits in a driver is lost (3.11). A queued send left in
   `dispatching` or `interrupted` comes back with a notice and is never sent
   to a model again (`server/index.ts:15090-15118`).

## 4. The data

### 4.1 The message tree in `messages.db`

| What | Where | Fields | Source |
|---|---|---|---|
| A message | table `messages`, key `(thread_id, id)` | columns `at`, `role`, `kind`, `text`, `json`. `parentId` and `sendId` are only inside the `json` text. No column, no index | `server/message-db.ts:55-61` |
| The extra indexes | `messages` | `(thread_id, at)` and `(thread_id, role)` | `server/message-db-bot-text-indexes.ts:4-6` |
| The active leaf | table `thread_state(thread_id PRIMARY KEY, active_leaf_id TEXT)` | an upsert | `server/message-db.ts:76-79`, `:594-596` |
| The order at load | `ORDER BY rowid` | | `server/message-db.ts:378` |
| A command receipt | in `messages.db`, in the same transaction as the rows | `(kind, key, at, result)` | `server/commands.ts:1-35` |
| An old file | `messages-<threadId>.json` | an array, or `{ messages, activeLeafId }`. Imported in one transaction and renamed to `.imported` | `server/message-db.ts:406-437` |

The fields of a message that the tree uses (`server/store.ts:1203-1215`):

| Field | Meaning |
|---|---|
| `id` | made by the server (`newId()`) |
| `at` | the time in milliseconds. It sorts the versions and picks the newest child |
| `parentId` | `null` for a root, a string for a child, absent in old rows |
| `role`, `kind` | `"user"` and `"text"` for an edit. `"bot"` and `"compaction"` for a summary record and for the divider of Start fresh |
| `sendId` | the client key, `^[A-Za-z0-9_-]{16,80}$` (`server/send-idempotency.ts:4-12`) |
| `replyToId`, `reaction` | a quote and a reaction, copied from the source of an edit |
| `automated`, `waitId` | kept on an edit only when the words are the same |

The shape that the leaf rule reads is only
`{ id: string; parentId?: string | null; at: number }`
(`shared/conversation-branch.ts:1`).

A compaction record, with example values (`server/context-rebuild.ts:148-155`,
`server/host/conversation-compaction.ts:136-140`):

```json
{ "role": "bot", "kind": "compaction",
  "compaction": { "summary": "…", "firstKeptId": "m-41", "foldedThroughId": "m-40",
                  "tokensBefore": 91234, "by": "person" } }
```

The divider of Start fresh is the same kind, with `summary: ""`,
`firstKeptId: ""`, `tokensBefore: 0`, `by: "person"` and `fresh: true`
(`server/fresh-start.ts:29-32`).

### 4.2 The thread record in `bots.json`

These fields decide the next turn. They are on `TaskRecord`
(`server/store.ts:82-118`) and the wire leaves them out.

| Field | Meaning | Written by |
|---|---|---|
| `resumeCursors` | a map from an engine instance to its session id | `session.started` (`server/index.ts:6371-6374`). Cleared at `:7726` and `:8372` |
| `lastInstanceId` | the engine that took the last dispatched turn | `markTaskDispatched` (`server/store.ts:1789-1794`) |
| `rewound` | the engine session holds a branch that is not the active path | ten places, 4.3 |
| `appliedCompactionId`, `contextFloor` | the summary record that the engine session holds | `server/index.ts:8373` |
| `handedMessages` | for an engine that resumes strictly: which messages its session holds | `server/delta-context.ts:37-48` |
| `lastContextModel`, `usage.context` | the last measured context | `server/host/conversation-compaction.ts:95` |
| `activity`, `busy`, `turnStartedAt` | in memory only. A save never writes them | `server/registry-store.ts:73-76` |

The save mode of `lastInstanceId` is "pass": written when the running batch
ends, or at once outside a batch. Its label says that it "must survive a
crash" (`server/registry-store.ts:20-30`).

### 4.3 The places that set `rewound: true`

| Place | When | Source |
|---|---|---|
| `beginTurn` | an edit | `server/index.ts:7572` |
| the route `active-branch` | a version switch | `server/routes/bot-messages.ts:595` |
| `startFresh` | Start fresh | `server/fresh-start.ts:23` |
| automatic recovery | the turn moves to a backup model | `server/index.ts:8473` |
| `switchBack` | the turn moves back to the first model | `server/index.ts:8661` |
| `audienceChanged` | a change of who can see the thread on a team server. Also clears the cursors | `server/index.ts:12053` |
| hosted models (two places) | a change of the hosted model | `server/hosted-models.ts:72`, `:127` |
| the Bot API host | a Bot API retry | `server/bot-api-host.ts:229` |
| a peer limit | a resend to another model after a limit | `server/host/peer-limit-resend.ts:191` |

One place clears it: `server/index.ts:8372`, after a dispatch that worked.
Two more places write it: the move of an old bot-level flag to the thread at
load (`server/store.ts:513-514`), and the Bot API host, which puts back the
old value after a failed retry (`server/bot-api-host.ts:242`). The list comes
from a search for `rewound` in `server/` and `shared/`, without the tests.

### 4.4 Limits and numbers

| Name | Value | Source |
|---|---|---|
| `DEFAULT_REBUILD_BYTES` | 24,000 | `server/context-rebuild.ts:157` |
| `context.rebuildBytes` | an integer, 1,024 to 1,000,000 | `server/replay-settings.ts:5` |
| messages in a replay | 40 | `server/context-rebuild.ts:194` |
| reserve, and cost of each entry | 128 bytes, and 16 bytes | `server/context-rebuild.ts:208`, `:222` |
| `MAX_SUMMARY_BYTES` | 6,000 | `server/context-rebuild.ts:158` |
| tool lines | 20 lines, 120 characters each, off by default | `server/context-rebuild.ts:24-25`, `server/replay-settings.ts:6-17` |
| `DEFAULT_CONTEXT_WINDOW` | 128,000 tokens | `server/context-budget.ts:4` |
| compaction point | 0.8 of the window, never above 0.9 | `server/context-budget.ts:21-25` |
| summary helper timeout | 20,000 ms | `server/compaction-summary.ts:65` |
| `RETRY_MAX_ATTEMPTS` | 3 | `server/drivers/retry.ts:6` |
| `BACKOFF_BASE_MS` | 1,000, 3,000, 8,000, each ±25 % | `server/drivers/retry.ts:9`, `:225-229` |
| quarantine of a stopped start | 30,000 ms | `server/turn-dispatch-guard.ts:109-167` |
| watchdog | 20 min silent, 2 h with a tool, 2 min after the engine exits | `server/index.ts:4917-4918`, `server/turn-watchdog.ts:49` |
| client buffer for a thread not on screen | 256 frames | `src/state/store.tsx:864-873` |

### 4.5 The events

| Event | Fields | Stored | Source |
|---|---|---|---|
| `message` | `threadId`, `message` | the store change. The row is in `messages.db` | `server/store.ts:1220` |
| `thread` | `threadId`, `activeLeafId` | the store change. The leaf is in `thread_state` | `server/store.ts:1222`, `:1232` |
| `bot` | `botId`, `threadId` | the store change. Activity is not stored | `server/store.ts:1627` |
| `turn.retrying` | `attempt` (1 is the first relaunch), `delayMs`, `reason` | one line in `events/<threadId>.ndjson`, and a transcript row | `packages/phone-protocol/src/runtime-events.ts:53-60`, `server/harness/bus.ts:250-257`, `server/index.ts:6613-6618` |

`reason` is a plain string. `provider_safety` is outside the union of the
reasons (`server/drivers/retry.ts:29-32`, `:191`). The reader of the log
checks that `attempt` is an integer ≥ 1 and `delayMs` is ≥ 0
(`server/thread-events.ts:160-169`). `turn.completed` has no field that says
"this turn was sent again".

### 4.6 The activity state type

```ts
type BotActivity = "working" | "waiting-on-you" | "idle" | "no-signal" | "dead" | "parked.computer";
```

(`packages/phone-protocol/src/wire.ts:88`). `parked.computer` is for a thread
only. It "never elevates the bot-level activity and never counts as busy"
(`:84-87`). The client types the same union again in three files
(`src/state/store.tsx:300`, `src/lib/sidebar-attention.ts:7`,
`src/lib/team-map.ts:10`).

## 5. The UI

### 5.1 The version switcher

1. A version is a user text row in a group of user text rows with the same
   `parentId`. The groups are made from all loaded rows, on all branches,
   sorted by `at` (`src/lib/transcript-derivations.ts:14-33`).
2. The switcher shows under a user bubble that is not a peer line, only when
   its group has two or more rows (`src/components/ChatView.tsx:378`, `:542`).
3. It has a "‹" button, the text `n/m`, and a "›" button. The titles are
   "Previous version" and "Next version" (`:544-562`,
   `src/locales/en.json:2712-2713`).
4. "‹" is off at the first version or while busy. "›" is off at the last
   version or while busy. An off button is at 30 % opacity (`:546-547`,
   `:557`).
5. It is the same in the simple and the advanced mode.
6. It is hidden for a bot row, a row whose siblings are not loaded, and a
   bubble in edit mode (`:367-373`).

### 5.2 The edit

1. Open the editor in one of two ways:
   - the menu item "Edit message" (a pencil). It shows only for the person's
     own text row with no attachment, not a webhook task, and not an
     optimistic row (`src/components/message-menu.tsx:108-115`,
     `ChatView.tsx:407-408`, `en.json:2644`).
   - the Up arrow in an empty composer, for the last typed message
     (`src/components/Composer.tsx:880-884`, `ChatView.tsx:1183-1185`).
2. The editor replaces the bubble: a text box of 2 to 10 rows, and the
   buttons "Cancel" and "Send". "Send" is off for an empty text. Escape
   cancels (`src/components/BubbleEditor.tsx:11-77`).
3. Submit closes the editor first. The comment: "a double Enter can't fork
   twice" (`ChatView.tsx:841-847`).
4. The client makes `sendId = randomUuid()` and keeps the leaf of before the
   edit (`src/state/store.tsx:2200`, `:2206`).
5. It adds an optimistic row with the parent of the source and makes it the
   leaf. The old answer leaves the screen at once (`store.tsx:1643-1664`).
6. It sends the request (3.2). On success, the server row replaces the
   optimistic row (`store.tsx:2403-2406`).
7. On an error, it removes the optimistic row, puts back the old leaf, and
   shows the error in the red banner (`store.tsx:2408-2411`, `:1249-1258`,
   `:2094`).
8. The edit has no retry when the answer is lost. A send has one, after 1 s
   and 3 s (`store.tsx:2362-2365`). An edit does not (`store.tsx:2398-2402`).
   So the person can see an error while the server runs the turn. The
   `message` and `thread` events then bring the version back.

### 5.3 Regenerate and Retry are edits

- "Regenerate response" sends `editMessage` with the last user message and
  its own text (`ChatView.tsx:904-908`, `en.json:2710`).
- "Retry" on a failed or stopped row does the same
  (`src/components/ChatView.cancelled-turn.test.ts:77-95`).
- So each regenerate and each retry adds a version to the switcher
  (`server/store.ts:1205-1222`).

### 5.4 The switch

1. A click moves the local leaf at once to the newest descendant of the
   chosen version (`store.tsx:1562-1565`). If the fork panel shows that
   thread, only the leaf of the panel moves (`src/state/snapshot-navigation.ts:4-11`).
2. The client sends the request (3.3). It ignores the 200 body. The `thread`
   event sets the leaf.
3. On an error it only shows the error (`store.tsx:2420`). **It does not put
   the leaf back.** After a 409, the screen shows a branch that the server
   did not select, until the next `thread` event or snapshot.

### 5.5 Undo

There is no Undo for an edit, a regenerate, a switch or Start fresh. The old
version stays in the tree, and "‹" goes back to it. The only rollback is the
client that removes its own optimistic row after an error. The "Undo"
strings in `en.json` are for approval cards, automations and skills
(`src/components/ApprovalCard.tsx:303`, `en.json:1150-1156`). The design rule
"a change that needs undoing gets **Undo**" (`DESIGN.md:59`) is not applied
here. `DESIGN.md` has no section on branches or versions.

### 5.6 The states

| State | What shows | Source |
|---|---|---|
| Empty thread | `EmptyChat` | `ChatView.tsx:1098` |
| Busy | The switcher buttons off. Edit, Regenerate, Retry and the Up-arrow edit off. A Stop button in the advanced header | `ChatView.tsx:546`, `:557`, `:326`, `:1111`, `:1183`, `:1015-1027`, `src/components/MessageActions.tsx:69-70` |
| Optimistic row | No switch to it, no edit | `ChatView.tsx:381`, `:407` |
| Error or 409 | A red banner with one line and "Details" | `src/components/ChatErrorBanner.tsx:24-36` |

The texts of the refusals: "the thread is working — stop it before
editing", "the thread is working — stop it before switching versions", and
"this task is securely saving a credential — try again when it finishes"
(`en.json:9725`, `:9728`, `:9735`).

### 5.7 Retry and activity in the UI

- A retry adds a transcript row: `retrying — attempt ${attempt+1}/3 in Xs —
  reason`. The server builds it in English, not with the language file
  (`server/index.ts:6613-6618`). So the first retry reads "attempt 2/3".
- The inspector shows the raw attempt, 1 for the first retry
  (`src/lib/inspector.ts:63-64`). The two views disagree by one.
- The `tool_limit` resend always sends `attempt: 1`, so it always reads
  "2/3" (`server/drivers/openai-chat.ts:689`).
- The activity state drives the sidebar and the team map. `dead` and
  `no-signal` get the same label, `canvas.status.noSignal`
  (`src/lib/team-map.ts:110`).

## 6. The tests

### 6.1 Branches

| Test | What it guarantees |
|---|---|
| `server/branching.test.ts:114-168` | End to end with a fake ACP engine. An edit with a `sendId` gets 202. The same body again gets the same row and adds no row. The same `sendId` with another text gets 409. The reply goes on the new branch. The old message stays, off the path. A switch shows the old branch |
| `server/branching.test.ts:170-227` | A change of engine during a turn gets 409. A switch and an edit get 409 and add no row. After Stop, the edit works |
| `server/branching.test.ts:229-278` | After a model switch, the new engine gets "joining this conversation" and the earlier lines, not "rewound". A switch back rebuilds again |
| `server/store.test.ts:1757-1780` | `branchMessage` takes the parent of the source, moves the leaf, sends `message` then `thread`, keeps the old row, and gives null for an unknown id |
| `server/store.test.ts:1782-1801` | `branchMessage` keeps `sendId` and `dataContext` |
| `server/store.test.ts:1824-1838` | `setActiveLeaf` goes to the newest leaf. An unknown id gives null |
| `server/store.test.ts:1840-1850` | The tree and the leaf survive a restart |
| `server/store.test.ts:1886-1902` | An old flat file is migrated with chained parents |
| `server/store.test.ts:922-941` | `insertMessageAfter` puts a late row after its anchor and keeps the leaf, also after a restart |
| `server/store.test.ts:2007-2019` | Each tree write sends its event, in order |

No test covers: a failed database write inside `branchMessage`, a failed save
of `bots.json` after the leaf moved, two children with the same `at`, or a
crash between the insert and the new parents of `insertMessageAfter`.

### 6.2 Rewind, rebuild and Start fresh

| Test | What it guarantees |
|---|---|
| `server/turn-context.test.ts:15-53` | A resume is the bare text. A rewind and a fresh engine get their preambles. A native replay is never wrapped. An empty thread is not wrapped |
| `server/turn-context.test.ts:78-107` | `engineIsFresh`: the same instance with a cursor resumes. With no cursor it rebuilds. Another instance ran last: rebuild, also with an old cursor (A → B → A). A greeting alone: no rebuild |
| `server/delta-context.e2e.test.ts:525-555` | An edit with Claude starts a new session with no resume. The replay has the rewind preamble and not the old text. The next send resumes the new session |
| `server/native-replay.e2e.test.ts:8-71` | After a rewind on a chat API engine, the history is sent once, with the new text |
| `server/fresh-start.test.ts:33-67` | Start fresh clears the cursor and the summary and keeps the usage totals. A second press adds no divider. The divider and `rewound` survive a restart |
| `server/fresh-start.e2e.test.ts:39-128` | After the divider the engine gets only the new line, with no `--resume`. A busy thread refuses Start fresh |
| `server/context-rebuild.test.ts:21-99` | The byte and message limits. The summary and the notice count in the budget. A record whose anchors left the branch is ignored. A huge message keeps its head and tail. Invalid budgets throw |
| `server/context-rebuild.test.ts:373-561` | Tool lines are off by default, never cost a message, and only come from inside the window |
| `server/context-compaction.e2e.test.ts:123-166` | A manual compaction survives a restart. The next turn rebuilds with the summary. The turn after resumes. An edit of an older message leaves the record out |
| `server/compaction-summary.test.ts:150-186` | A summary by the helper is booked to the helper. A failed helper books nothing |

### 6.3 Retry

| Test | What it guarantees |
|---|---|
| `server/drivers/retry.test.ts:6-149` | The classifier: safety blocks, auth, quota, unknown model and bad requests are never retried. 429, 5xx, overload, a reset and a timeout are transient |
| `server/drivers/retry.test.ts:152-170` | `mayResendTurn`: never after `answered` or `streamed`, never on exit 0, never at attempt 2 |
| `server/drivers/retry.test.ts:172-190` | The backoff is inside ±25 % of its base |
| `server/drivers/retry-delay.test.ts:10-54` | The wait releases its timer and its listener on each way out |
| `server/drivers/claude.test.ts:3982-4145` | Two retries `[1, 2]` with one turn id. No retry after an answer or after streamed text. A new budget for the next turn. Stop during the wait ends the turn |
| `server/drivers/grok.test.ts:124-200` | 429 then 503 retries. A cap, a terminal error, partial output and Stop each end the turn correctly |

### 6.4 Activity state

| Test | What it guarantees |
|---|---|
| `server/store.test.ts:1861-1870` | `busy` is cleared at load, also if `bots.json` says true |
| `server/thread-events.test.ts:193-210` | A `turn.retrying` line with bad fields is not read |

Not tested: a thread left `dead` across a restart, and a state that nothing
sets.

### 6.5 The client

| Test | What it guarantees |
|---|---|
| `src/state/store.test.ts:1340-1348` | An edit swaps the question at once, hides the old answer, and the switcher has 2 versions |
| `src/state/store.test.ts:1350-1362` | The server fork, the reply and a late copy leave the new branch on screen |
| `src/state/store.test.ts:1364-1373` | A failed edit puts back the old question and answer |
| `src/state/store.test.ts:1539-1580` | A repeated user row after its reply does not move the leaf back |
| `src/state/store.test.ts:2216-2233` | A row that chains onto the leaf is adopted. A late insert in the middle is not |
| `src/state/fork-panel.test.ts:45-56` | A switch in the fork panel moves only the leaf of the panel |
| `src/components/ChatView.cancelled-turn.test.ts:77-136` | Retry on a stopped turn sends `editMessage` with the same text. No Retry while busy |

Not tested on the client: the switcher buttons while busy, a failed
`active-branch` call, and the Up-arrow edit.

## 7. Ours compared

Our crate `bot-core` has only `crates/bot-core/src/lib.rs` today. Step 8
has no module yet. `bot-protocol` has `Message { id, role, text }` with two
roles, `user` and `assistant` (`crates/bot-protocol/src/message.rs`, decision
D18), and five event kinds (decision D20).

| Reference | Our crate and module | What we have or plan | Difference |
|---|---|---|---|
| `shared/conversation-branch.ts`, `server/store.ts:1109-1234` (tree, path, edit, switch) | `bot-core`, step 8, no module yet | The plan names "threads and messages" only | Our `Message` has no `parent_id`, no `send_id`, no `at` and no `kind`. The plan has no edit, no switch and no leaf |
| `server/message-db.ts:55-79`, `:461-466` (rows, `thread_state`, one transaction) | `bot-core`, step 8 | SQLite with `rusqlite` (D14) | The reference keeps `parentId` and `sendId` inside a JSON text. A column and an index are open for us |
| `TaskRecord` fields `rewound`, `resumeCursors`, `lastInstanceId`, `appliedCompactionId` in `bots.json` | `bot-core`, step 8 (the thread row) | Nothing yet | In the reference they are in another store than the messages. One database lets us write them in one transaction (P81) |
| `role: "bot"`, `kind: "compaction"` for a summary and a divider (`server/fresh-start.ts:29-32`) | `bot-protocol`, `message.rs` | Two roles, no kind (D18) | A summary and a divider are not user or assistant text. D18 does not say where they go |
| `server/turn-context.ts`, `server/resume-plan.ts` (resume or rebuild) | `bot-core`, step 9 or later, with the first driver that resumes | Nothing yet | The fields that the rule reads must exist in the step 8 schema |
| `server/context-rebuild.ts` (`selectReplay`) | `bot-core`, the step that adds a rebuild | Nothing yet | Text that opens a turn comes from stored data (`AGENTS.md`, P51). The reference does the same |
| `server/drivers/retry.ts` | `bot-engine`, each driver, with a shared module | Nothing yet | D20 has no `turn.retrying`. The reference stores the event in the log of the thread |
| `server/store.ts:1611-1636` (activity, busy) | `bot-core` | Nothing yet | The reference keeps it in memory only. Our fold (P37) owns busy |
| `events/<threadId>.ndjson`, `server/thread-events.ts` | `bot-core`, step 8 | A file or a table is open (P81) | The reader of the reference checks each event type, field by field (`server/thread-events.ts:140-234`) |
| `server/commands.ts` (command receipts) | `bot-core`, step 8 | P80 gives each event an id | A receipt in the same transaction makes a repeat return the first result |
| `src/components/ChatView.tsx:542-564`, `src/state/store.tsx:2394-2420` | `bot-desktop`, a later step | Nothing yet | The switcher and the edit box are UI work after step 8 |

## 8. Where we can be better

Each point has a reason of one of these kinds: a wrong state that the
compiler or the database refuses, less code, or a known problem of the
reference that we do not copy.

1. **Write the edit row, the leaf, the `rewound` flag and the event in one
   transaction.** The reference writes the row and the leaf in `messages.db`,
   and `rewound` in `bots.json` (`server/index.ts:7570-7572`,
   `server/routes/bot-messages.ts:593-595`). A failed batched save is only
   logged (`server/save-batch.ts:26-36`). A failed save outside a batch
   rolls `rewound` back and leaves the leaf moved
   (`server/registry-save.ts:16-25`). Then the next turn resumes a session
   that holds the old branch. Reason: a known problem that we do not copy.
   This extends P38 and P81.
2. **Write to the database first, and change memory only after the
   commit.** `branchMessage` and `setActiveLeaf` change memory first
   (`server/store.ts:1216-1218`, `:1230-1231`). If the write throws, memory
   has a leaf that is not on disk. A later append takes it as its parent
   (`:1136`). After a restart the walk stops at the missing parent (`:1117`),
   and the earlier history is cut from the branch. Reason: a known problem.
   In Rust, a store method that returns the committed row makes the order
   hard to get wrong.
3. **`parent_id` and `send_id` as columns, with a unique index on
   `(thread_id, send_id)`.** The reference scans all rows of the thread for a
   `sendId` (`server/send-idempotency.ts:26`). Reason: the database refuses a
   second row with the same key, and the check is one lookup.
4. **A total order for "the newest child".** The reference uses `at`, and a
   tie goes to the later row in load order (`shared/conversation-branch.ts:8`).
   Use `at`, then the insert sequence of the row. Reason: one answer for each
   tree, also with a clock that steps back (P80).
5. **One setter for the activity state, `busy` derived from it, and no state
   that nothing sets.** The reference stores `busy` beside the state, and a
   flag lets them disagree (`server/store.ts:1615`). `no-signal` counts as busy
   and has no setter (`:124`). Reason: a wrong state that the type refuses.
   An enum such as `Waiting { turn_running: bool }` says what the flag says
   now.
6. **Rank `dead` above `working` in the state of a bot, or show both.** The
   reference hides a dead thread when another thread works
   (`server/store.ts:1633`). Reason: the person does not see a failed
   engine.
7. **One meaning of `attempt`.** The transcript shows `attempt + 1`, the
   inspector shows `attempt`, and `tool_limit` always sends 1
   (`server/index.ts:6617`, `src/lib/inspector.ts:63-64`,
   `server/drivers/openai-chat.ts:689`). A closed enum for `reason`.
   Reason: less code, and no "attempt 4/3".
8. **Say what a second `turn.started` with the same turn id means.** The
   Claude driver sends one on each relaunch, and the fold treats it as a new
   start. That deletes the error of the first try
   (`server/drivers/claude.ts:1785`, `server/turn-outcome.ts:27-29`).
   Reason: D20 says that `turn.started` opens a turn. A driver that sends it
   once, as Codex and ACP do, keeps that rule.
9. **Count every resend in one budget.** Some resends of the reference do
   not count (`server/drivers/retry.ts:221`, `server/drivers/codex.ts:690-692`,
   `:893`). Reason: one turn cannot then be sent more than the cap.
10. **Count `thinking_delta` as output.** The reference resends a turn that
    streamed only reasoning (`server/drivers/claude.ts:1454-1458`). Reason:
    those tokens are spent, and v0.1.150 says "never sent twice".
11. **Roll back a failed switch on the client, and retry a lost edit with
    the same `sendId`.** The reference does neither
    (`src/state/store.tsx:2398-2402`, `:2420`). Reason: the screen shows a
    branch that the server did not select, or an error for a turn that runs.
12. **Do not set `rewound` when the leaf did not change.** The route sets it
    always (`server/routes/bot-messages.ts:595`). A search hit off the path
    also sets it. Reason: a rebuild costs input tokens that a resume does
    not.
13. **Size the rebuild by the window of the target model, as plan item 7d
    asked.** The reference has the field and the doc comment, but uses a
    fixed 24,000 bytes (`server/contracts.ts:532-533`,
    `server/host/resume-check.ts:29`). Reason: a known gap of the reference.
    This is for the step that adds a rebuild, not step 8.
14. **One rule for "the engine still holds this message".** `sessionHolds`
    and `selectReplay` count in different ways
    (`server/routine-recovery.ts:187-195`, `server/context-rebuild.ts:180-238`).
    Reason: a routine can then send a note that points to a message that the
    engine does not have. This is for step 15.
15. **An Undo for an edit and for Start fresh, or a decision that versions
    take its place.** The reference keeps versions and breaks its own rule
    (`DESIGN.md:59`). Reason: the rule of the reference. Versions do not
    undo Start fresh.

### 8.1 Points that follow the reference

These are good, and step 8 can copy them:

- The leaf in its own table, written in the same transaction as the row
  (`server/message-db.ts:461-466`).
- The `sendId` check before the busy check, so a retry is not refused by its
  own turn (`server/routes/bot-messages.ts:546`).
- The flag that forces a rebuild clears only after a dispatch that worked
  (`server/index.ts:7724`, `:8372`).
- A compaction is a new row. Nothing is deleted. A record applies only while
  its anchors are on the branch (`server/context-rebuild.ts:202-203`).
- A command receipt in the same transaction as the rows
  (`server/commands.ts:1-3`).
- A resend only on proof from the driver that the turn was not sent
  (`server/index.ts:8394-8396`).

### 8.2 The problems of `changelog.md` section 5 in this code

| Problem | What the reference does here | Our answer |
|---|---|---|
| (1) State lost at a restart or a crash | The row and the leaf are one transaction. `rewound` is in another file, so a failed or lost save leaves a new branch with no rewind (point 1). Memory changes before the database (point 2). `insertMessageAfter` writes the row and the new parents in separate statements (`server/store.ts:1160-1171`). A fork writes `messages.db`, then `bots.json` (`server/store-forks.ts:18-20`). Activity is reset to `idle` at load, and a `dead` mark is lost (`server/host/setup-recovered.ts:18`). A waiting retry is lost (3.11). Item 13 of the plan, "emit inside the store", is a rule that `branchMessage`, `markTaskDispatched` and `patchBot` do not follow (`server/store.ts:1216-1217`, `:1789-1794`, `:1486`, `:1501-1502`) | Points 1, 2. P38, P81, P82 |
| (2) The same work done two times: "A Claude turn is never sent twice" (v0.1.150) | Commit `812c99063` (2026-11-08). Before it, the gate read only `sawStreamDelta`, which a tool call never set, so a turn with several model calls was sent again from the start. Now `mayResendTurn` refuses after `answered` or `streamed` (`server/drivers/retry.ts:222`, `server/drivers/claude.ts:1487`). Gaps: `thinking_delta` (point 10), resends that do not count (point 9). The edit uses `sendId`, and the route stays synchronous from the busy check to the row (`server/routes/bot-messages.ts:555`). The backup model gets the stored row, so no second branch (`server/index.ts:8482-8483`). Layers (b) and (c) of retry send a turn again after work, by design (3.11) | Points 3, 9, 10. P80 |
| (3) Usage and cost numbers: keep-warm pings and summaries "count only their own cost" (v0.1.178) | Commit `a9d483545` (2026-11-23). The Claude CLI reports a running total for the session. A summary fork booked that whole total. Now it books only the growth over the stored base (`server/drivers/claude-keepwarm.ts:86-99`, `server/drivers/claude-warm-summary.ts:30`, `:53`, `:62`). The test books 0.012 for each of two pings and one summary, not 11.452 (`server/drivers/claude-warm-summary.test.ts:131`). Gap: with no known base, the whole total is booked (`server/drivers/claude-cost-history.ts:42-46`), and that history file is written with no durability and ignores errors (`:36-37`). A summary by the helper model is booked once to the helper (`server/side-jobs.ts:174-187`). A rewind makes the next turn send the whole branch again: real input, not a double count | The row "Usage and cost numbers" of the plan says "None. D20 has no usage event yet". This is its first fact from the code |
| (4) A feature added, then removed or reversed | v2 moved retry (1.3 → 3.4) and attachments (1.6 → 3.5) to the end. Both are built now. The rule "no cursor means fresh" was built, failed A → B → A, and was replaced (v1:141-143). `no-signal` was added for a liveness clock (commit `cbc0d829c`, 2026-08-18) and nothing sets it. Plan 3.4 "discard the partial" became "refuse the retry". The activity moved from the bot to the thread. The client leaf walk became the shared `branchLeafFrom`. The classifier changed in 8 commits from 2026-11-09 to 2026-11-16 | Point 5 (no state that nothing sets). Point 7 (a closed enum) |

## 9. Not verified

- The phantom leaf after a failed write in `branchMessage`, the split of the
  leaf and `rewound` after a failed save, the two children after a crash in
  `insertMessageAfter`, and the fork rows with no thread. These come from
  reading the code. Nobody ran them.
- The `sessionHolds` problem of 3.11. It comes from reading the code. No
  test or run shows it.
- Whether `session.started` can reach the store before `sendTurn` resolves.
  If it can, `resumeCursors: {}` at `server/index.ts:8372` removes the new
  cursor, and the turn after an edit rebuilds again. For Claude,
  `server/delta-context.e2e.test.ts:549-552` shows that the next send
  resumes. Other drivers were not checked.
- About 20 calls of `store.activePath` in `server/index.ts` were read at the
  call line and the head of the function only: `:3508`, `:3962`, `:5260`,
  `:5287`, `:5323`, `:5420-5499`, `:8667`, `:9626-9635`, `:11940`,
  `:12720`, `:12900`, `:13295`, `:13344`, `:13891`.
- `server/index.ts:8058-8289` was read with each line cut short, or by
  search only.
- `server/bot-api-host.ts:226-242` puts back the old leaf and the old
  `rewound` after a failed Bot API retry. It was seen by search only.
- `server/hosted-models.ts:72`, `:127` and `server/host/peer-limit-resend.ts:191`
  set `rewound: true`. They were found by search. Their functions were not
  read.
- Whether a turn that a restart cut in its backoff is run again. That
  depends on whether each chat turn is a root job of the runtime. The
  evidence is indirect (`server/index.ts:3786-3793`, `:4022-4029`).
- Whether a summary that the engine of the bot writes is booked anywhere
  (`server/side-jobs.ts:291-292` says not there).
- The tests of `restoredCostBase` other than the one test in
  `server/drivers/claude-warm-summary.test.ts:131`.
- The bodies of the Codex retry tests (`server/drivers/codex.test.ts:4294-4525`).
- `boat.ts` and `webhooks.ts`, which plan 3.4 names as having retry.
- How a client gets `activity` and `busy` (only the store event
  `{ type: "bot" }` was read).
- Whether the drivers send `item.completed` for a tool that a Stop
  interrupted. If not, the Activity panel shows "Running" for ever
  (`server/activity.ts:311-318`).
- `src/lib/composer-attachments.ts` (893 lines) and the pruning of tool
  results of plan item 16.
- Whether an admin on a team server sees a thread through
  `GET /api/threads/:id/events` that `threadShown` hides on the activity
  route (`server/routes/status.ts:119-134`, `:246`).
- `src/components/GroupView.tsx`: whether a room has an edit or a switcher.
