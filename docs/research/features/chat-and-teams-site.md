# Chat and teams site page: reactions, usage, inbox, people, team map, second opinion, checked edits, folders

Feature row of [`../reference-features.md`](../reference-features.md): "Docs
site: `features/chat-and-teams.mdx`" (document of the reference:
`apps/docs/content/docs/features/chat-and-teams.mdx`, 137 lines). Steps 8,
11, 12 and 14 of [`../../plan/README.md`](../../plan/README.md), and new
steps that section 8 proposes. Crates: `bot-protocol`, `bot-core`,
`bot-engine`, `bot-desktop`.

Read on 2026-11-26 at commit `96ff84455` of the reference project. HEAD of
the local clone was `96ff84455`, so the files were read directly. All paths
are in the reference project unless a line says "ours". The `enterprise/`
directory was not opened. Seven subagents read seven groups of files. The
main session checked the key lines (section 2.3) and resolved the conflicts
between the reports.

In quoted text from the reference, `<product>` replaces the product name of
the reference. The reference has two template bots, a writer and a checker.
This file names them by their role.

## What this file adds to earlier research

| Feature of the page (mdx lines) | Covered by | Gap analyzed here | Reference code | Step |
|---|---|---|---|---|
| Bots and threads, queue and steer (7-11) | [`threads.md`](threads.md), [`queue-and-steer.md`](queue-and-steer.md) | none | `server/routes/tasks.ts`, `server/steer-queue.ts` | 11 |
| Reactions (13-21) | none. [`question-cards.md`](question-cards.md):410 and [`approval-cards.md`](approval-cards.md):505 name a reaction on a card. [`harness-upgrades.md`](harness-upgrades.md):428 keeps a reaction on edit | all | `server/reactions.ts`, `server/routes/reactions.ts`, `server/person-replies.ts`, `server/replies.ts`, `src/components/Reactions.tsx` | new step after 11 (T4) |
| Token usage (23-33) | [`chat-ui.md`](chat-ui.md) §3.15 and P124 (the usage menu row, `addTaskUsage`) | the cache rule, the ledger, the two totals that disagree | `server/usage-ledger.ts`, `server/store.ts:1805-1840`, `src/lib/usage.ts`, `src/lib/chat-usage-summary.ts`, `src/components/ChatMoreMenu.tsx` | 8 with P124 (T5) |
| Groups and group timeouts (35-39) | [`bot-coordination.md`](bot-coordination.md) §3.7, [`turn-limits.md`](turn-limits.md) | only the checks of changelog problems | `server/room-turn-timeout.ts` | gap of rooms (P224, P229) |
| Group token usage (41-45) | none | all | `server/group-thread-usage.ts`, `src/components/GroupUsageChip.tsx` | gap of rooms (T11) |
| Departments, rename, delete, membership (47-71) | `team-structure` (runs now, other worktree) | border only | not read here | theirs |
| Who a bot reports to, a Chief for each person (73-80) | `team-structure` and `mentions` (run now) | border only: what the inbox and the map use | not read here | theirs |
| The team map (80, and the menus of 59, 63) | none. [`bot-coordination.md`](bot-coordination.md):233 names the hand-off lines | all | `src/components/TeamMapPage.tsx`, `src/components/TeamCanvas.tsx`, `src/lib/team-map.ts`, `server/index.ts:14300-14420` | new step after 14 (T10) |
| The team inbox and "answering is replying" (82-91) | none. [`question-cards.md`](question-cards.md):775-795 lists the files only | all | `server/host/person-inbox.ts`, `server/host/team-messages.ts`, `server/host/relayed-turn.ts` | gap: team mode (T1) |
| Everyone has an Inbox, inbox at a glance, the count (93-97) | none | all | `server/host/place-inbox.ts`, `server/host/person-waits.ts`, `server/routes/inbox.ts`, `src/components/inbox/`, `src/state/inbox.ts` | new step after 15 (T3) |
| An assistant answers simple facts (99) | none | all | `server/host/representative.ts`, `server/host/person-calendar.ts` | gap: team mode (T1) |
| People in the sidebar (101) | none | all | `src/components/SidebarPeople.tsx`, `server/routes/team-owners.ts`, `server/team-presence.ts` | gap: team mode (T1) |
| A message rate limit (103) | none. [`agent-tools.md`](agent-tools.md) names `message_person` | all | `server/host/team-messages.ts:39`, `server/host/place-inbox.ts:32` | 12 (T8) |
| Delegation, direct delegation (107-109) | [`bot-coordination.md`](bot-coordination.md) (":559 "Sent to {bot} directly") | none | `server/coordinator.ts` | 14 |
| A second opinion on a different model (111-115) | [`threads.md`](threads.md) §3.20 (`start_thread`, `model_selection`, `report_back`) | `list_models`, `own-threads.ts`, the refusals, the result lines | `server/host/own-threads.ts`, `server/routes/internal-models.ts`, `server/host/engine-hints.ts` | 12 (T7) |
| Edits that a second bot checks (117-121) | none | all | `src/lib/ready-bots.ts`, `server/checker-model.ts`, `server/host/remote-teammate-handoff.ts`, `server/host/check-work.ts` | 14 (T6) |
| The Chief makes specialists (123-131) | `team-structure` (runs now) | border only | not read here | theirs |
| Rewind and branches (133) | [`harness-upgrades.md`](harness-upgrades.md) (the whole rewind path) | none | not read again | see that file |
| Memory and shared working folders (135-137) | [`memory.md`](memory.md), [`threads.md`](threads.md) §3.10 (a thread's folder) | the group folder, the folder a hand-off shares, the guest's private folder | `server/bot-cwd.ts`, `server/room-cwd.ts`, `server/room-folder.ts`, `server/store.ts:1840-1905` | 11 (P192). Rooms: gap |

What this file adds to the earlier files, one point for each:

- [`question-cards.md`](question-cards.md) did not read `person-inbox.ts` or
  the inbox wire types. Section 3.5 here covers the routing, the copy of a
  card, `answeredIn`, the tabs and the inbox home.
- [`harness-upgrades.md`](harness-upgrades.md):257 read `person-waits.ts`
  in ranges. This file reads it completely, with its test and
  `shared/person-wait.ts`.
- [`chat-ui.md`](chat-ui.md) §3.15 and P124 cover the usage menu row and
  `addTaskUsage`. This file adds the cache rule that makes an unknown count
  zero, the group path, and the two totals that disagree (section 3.3).
- [`threads.md`](threads.md) §3.20 covers `start_thread`. This file adds
  `list_models`, the refusals of a model, and the edge case where a
  person's line lifts the "cannot open more" rule (section 3.9).
- [`bot-coordination.md`](bot-coordination.md) §3.7 covers the room turn
  timeout. This file adds only the checks against changelog problems
  (section 3.12).
- [`assignment-runtime.md`](assignment-runtime.md) A7 finds that a waiting
  child shows as "running". This file adds that the team map draws it as an
  animated "Running" line (section 3.8).
- [`agent-tools.md`](agent-tools.md) names `message_person`. This file adds
  its route, refusals, limits and delivery (section 3.6).

Out of scope: paid plans and billing, and the phone application. The wire
types in `packages/phone-protocol/src/` were read because the server and the
desktop share them.

## 1. In short

The docs page describes many small features that sit on top of chats and
groups. Most of them are a second view of state that already exists:

- a reaction is a reply;
- an inbox line is a card or a message;
- a usage chip is a sum of turn rows;
- a map edge is an open assignment.

Terms, each explained one time:

- **Reaction:** one of six emoji that a person puts under a message
  (`packages/phone-protocol/src/reactions.ts:4`). A 👍 or 👎 on a bot's
  message is also the person's answer to it.
- **Feeling:** a reaction that is not 👍 or 👎 (❤️ 😂 🎉 👀). It starts no
  turn. The bot reads it with the next message (`server/reactions.ts:53`).
- **sendId:** an id that the caller makes for a message. A second send with
  the same id does nothing (decision D17 is the same idea).
- **Usage ledger:** a file of one JSON row for each settled turn,
  `<data>/usage/YYYY-MM.jsonl` (`server/usage-ledger.ts:103-109`).
- **Uncached input:** input tokens that the provider did not serve from its
  prompt cache. **Cached input** is the rest of the input.
- **Room:** the code name of a group chat. A **lane** is a thread where a
  room job runs beside the room (`server/host/room-jobs.ts:69-72`).
- **Team Cloud:** a server that several people of one team use. **Place:**
  this computer, or one Cloud. The rail of the desktop shows one circle for
  each place.
- **Person inbox:** the inbox of one person on a Team Cloud. Its lines are
  posted into one conversation, the **inbox home**
  (`server/host/person-inbox.ts:151-188`).
- **Place inbox:** the inbox of a place that is not a team. It has one
  person and copies no card (`server/host/place-inbox.ts:1-5`).
- **Ask:** an inbox line that waits for a decision: a question card or an
  approval card. **News** is every other line.
- **Needs you, For your info, Done:** the three groups of inbox lines. The
  server computes them on each read (`person-inbox.ts:255-258`).
- **`message_person`:** the tool that a bot uses to pass a message to a
  person ("Tell Ben that…") (`server/drivers/agents-person-tools.ts:16-30`).
- **The assistant (representative):** code that answers a teammate's simple
  question for a person, from facts that the server builds
  (`server/host/representative.ts`).
- **Confined conversation:** a conversation that a Cloud guest or an
  outside app drives. It never reaches an inbox
  (`person-inbox.ts:93-94`).
- **Own thread:** a thread that a bot opens on itself with `start_thread`.
  With `report_back`, its result resumes the bot.
- **Checker:** a teammate whose role is to compare a result with the request
  and the source. **Rework** is a hand-off that sends a fixed result back to
  the same checker.
- **Pin (a folder):** the server fixes the working folder of a thread at its
  first turn and keeps it (`server/store.ts:1853-1900`).

The four main results:

1. Much of the page is for a Team Cloud only: the person inbox, the people
   in the sidebar, presence and the assistant. Our product is a desktop
   application for one person (decision D10). The place inbox is the model
   that fits us (section 8, T1 and T3).
2. The page and the code disagree in ten places. Section 8.1 lists them. Two
   are features that the reference removed: the three inbox tabs and the
   "Who reports to whom" map.
3. The reference keeps two copies of one fact in several places: two usage
   totals, a card and its inbox copy, two waiting counts. Each copy needs
   code that keeps it in step. One row in our store removes that code.
4. Several guards live in memory only: the hourly limits, the dedupe of
   @mentions, the remote rework count, the reaction stamp. A restart resets
   them.

## 2. Files read completely

Seven subagents read seven groups. Each one wrote a report and listed its
files. Line counts are from `wc -l` at `96ff84455`.

### 2.1 Read from the first line to the last

| Group | Files (lines) |
|---|---|
| Reactions | `server/reactions.ts` (156), `server/reactions.test.ts` (377), `server/reactions.e2e.test.ts` (255), `server/reaction-delivery-lifetime.test.ts` (82), `server/routes/reactions.ts` (34), `server/routes/reactions.test.ts` (88), `shared/reactions.ts` (1), `shared/reactions.test.ts` (42), `packages/phone-protocol/src/reactions.ts` (34), `src/components/Reactions.tsx` (210), `src/components/Reactions.test.ts` (220), `src/components/Reactions.shared.test.ts` (33), `src/components/ChatView.reactions.test.ts` (74), `server/person-replies.ts` (138), `server/replies.ts` (210), `server/host/room-transcript.ts` (78), `docs/verification/reactions.md` (118) |
| Token usage | `server/usage-ledger.ts` (470), `server/usage-ledger.test.ts` (392), `server/group-thread-usage.ts` (92), `server/group-thread-usage.test.ts` (71), `server/group-thread-usage.e2e.test.ts` (41), `server/routes/bot-usage.ts` (91), `server/routes/bot-usage.test.ts` (123), `server/bot-usage.e2e.test.ts` (128), `server/usage-attribution.ts` (46), `server/usage-attribution.test.ts` (42), `server/drivers/openai-chat-cached-input.test.ts` (99), `server/routes/usage-not-billed.test.ts` (19), `server/drivers/acp/prompt-usage.ts` (21), `server/drivers/pi-usage.ts` (60), `server/drivers/claude-cost-history.ts` (92), `src/lib/usage.ts` (143), `src/lib/usage.test.ts` (185), `src/lib/chat-usage-summary.ts` (24), `src/components/ChatMoreMenu.tsx` (289), `src/components/GroupUsageChip.tsx` (30), `src/components/GroupUsageChip.test.ts` (22), `src/components/RoomHeader.tsx` (287), `src/components/RoomMoreMenu.tsx` (153), `docs/verification/usage-ledger.md` (148), `scripts/testing/usage-details-ui.e2e.test.ts` (156) |
| Inbox, server | `server/host/person-inbox.ts` (571), `server/host/person-inbox.test.ts` (393), `server/host/place-inbox.ts` (325), `server/host/place-inbox.test.ts` (481), `server/host/handoff-inbox.ts` (228), `server/host/handoff-inbox.test.ts` (73), `server/host/inbox-triage.ts` (72), `server/host/inbox-triage.test.ts` (194), `server/decider/inbox-triage.ts` (40), `server/host/inbox-words.ts` (36), `server/host/person-waits.ts` (156), `server/host/person-waits.test.ts` (267), `server/routes/inbox.ts` (46), `server/routes/inbox.test.ts` (98), `shared/inbox.ts` (1), `packages/phone-protocol/src/inbox.ts` (78), `server/testing/team-inbox-fixture.ts` (138), `server/place-inbox.e2e.test.ts` (259), `server/cloud-team-inbox.e2e.test.ts` (425), `server/host/team-messages.ts` (456), `server/host/team-messages.test.ts` (281), `server/host/representative.ts` (156), `server/host/representative.test.ts` (86), `server/host/long-waits.ts` (15), `server/host/relayed-turn.ts` (35), `server/host/team-away-host.ts` (56), `server/host/team-away-events.ts` (85), `server/host/refused-handoffs.ts` (100), `server/host/share-notice.ts` (40), `server/host/access-requests.ts` (123), `shared/person-wait.ts` (97), `docs/verification/inbox.md` (49) |
| Inbox, UI | the 22 files of `src/components/inbox/` (2,317 in all), `src/components/InboxLine.tsx` (88), `src/components/SidebarInboxRow.tsx` (56), `electron/place-inbox-watch.mjs` (68), `electron/place-inbox-watch.node-test.mjs` (89), `scripts/verify-place-inbox-rail.mjs` (267), `src/state/inbox.ts` (160), `src/state/inbox.test.ts` (90), `src/testing/inbox-fixture.ts` (33), `src/lib/bot-unread.ts` (34), `src/lib/bot-unread.test.ts` (67), `docs/verification/sidebar-attention.md` (49) |
| People and the assistant | `server/drivers/agents-person-tools.ts` (30), `server/host/representative-wait.test.ts` (30), `server/host/representative-calendar-limit.test.ts` (42), `server/host/person-calendar.ts` (42), `server/host/person-calendar.test.ts` (46), `server/calendar-transparency.test.ts` (48), `server/host/acting-person.ts` (198), `server/host/acting-person.test.ts` (260), `server/chief-of-staff.ts` (107), `server/host/team-presence-host.ts` (141), `server/host/team-presence-host.test.ts` (152), `shared/team-presence.ts` (1), `packages/phone-protocol/src/team-presence.ts` (44), `server/team-presence.ts` (200), `server/team-presence.test.ts` (168), `src/state/team-presence.ts` (120), `src/state/team-presence.dom.test.ts` (147), `src/state/team-people.ts` (197), `src/components/SidebarPeople.tsx` (133), `src/components/SidebarPeople.test.ts` (193), `src/components/PeopleSection.tsx` (318), `src/components/PeopleSection.test.ts` (105), `src/components/TeammateChip.tsx` (21), `src/components/TeamPresence.tsx` (36), `server/routes/team-owners.ts` (155), `server/team-people.ts` (99), `server/cloud-team-people.e2e.test.ts` (116), `server/cloud-team-presence.e2e.test.ts` (148), `docs/verification/people.md` (53) |
| Team map | `src/components/TeamMapPage.tsx` (444), `src/components/TeamMapPage.edges.test.ts` (53), `src/lib/team-map.ts` (117), `src/lib/team-map.test.ts` (83), `src/components/team-map-dialogs.test.ts` (38), `server/team-map-api.test.ts` (39), `src/components/TeamCanvas.tsx` (546), `src/lib/team-canvas.ts` (115), `src/lib/team-canvas.test.ts` (119), `src/lib/team-canvas-handoffs.ts` (139), `src/lib/team-canvas-handoffs.test.ts` (79), `src/lib/team-canvas-computers.ts` (99), `src/lib/team-canvas-computers.test.ts` (109), `src/components/TeamCanvas.settle.dom.test.ts` (164), `src/components/TeamDialog.tsx` (119), `src/components/ConfirmDialog.tsx` (165), `src/components/TeamMemoryDialog.tsx` (328), `src/components/MapComposer.tsx` (146), `src/lib/map-composer.ts` (86), `src/lib/map-composer.test.ts` (92), `src/components/CanvasComputers.tsx` (290), `src/lib/map-computers.ts` (169), `shared/map-computer.ts` (23), `shared/team-computer.ts` (16), `server/routes/computer-frames.ts` (132), `server/routes/computer-frames.test.ts` (72), `server/computer-frames.ts` (219), `server/routes/stop-line.ts` (20), `src/components/SidebarTeamMenu.tsx` (78), `scripts/testing/team-map-computers-ui.e2e.test.ts` (135), `scripts/testing/team-map-everyone-ui.e2e.test.ts` (88), `scripts/testing/team-canvas-ui.e2e.test.ts` (388), `docs/verification/teams.md` (160) |
| Second opinion, checks, folders | `server/host/own-threads.ts` (93), `server/routes/internal-models.ts` (158), `server/routes/internal-models.test.ts` (160), `shared/engine-sign-in.ts` (14), `server/host/engine-hints.ts` (120), `server/local-models-once.ts` (106), `server/host/spawn-level.ts` (50), `server/start-thread-routing.e2e.test.ts` (69), `server/checker-model.ts` (16), `server/checker-model.test.ts` (27), `server/checked-handoff.e2e.test.ts` (123), `src/lib/ready-bots.ts` (426), `server/host/remote-teammate-handoff.ts` (278), `server/host/check-work.ts` (360), `server/host/self-threads.ts` (12), `server/host/self-threads.test.ts` (14), `server/self-threads.e2e.test.ts` (59), `server/thread-model.ts` (32), `server/room-cwd.ts` (8), `server/room-cwd.test.ts` (22), `server/bot-cwd.ts` (62), `server/bot-cwd.test.ts` (134), `shared/thread-folder.ts` (6), `server/room-folder.ts` (9), `server/task-cwd-api.test.ts` (83), `src/components/Sidebar.working-folder.test.ts` (93), `server/room-turn-timeout.ts` (247), `server/room-member-lock.ts` (58) |

Each subagent also read the docs page,
`apps/docs/content/docs/features/chat-and-teams.mdx` (137).

### 2.2 Read in ranges, or by test names only

- `server/index.ts` (15,258 lines): 629-640, 800-870, 995-1007, 1338-1360,
  2238-2255, 2658, 2755-2783, 2850, 3505-3510, 3835-3836, 3905-4075,
  4800-4965, 5128-5141, 6612-6800, 6958, 7055-7125, 7248, 7515-7580,
  7690-7812, 8146, 8237, 8585-8600, 8720-8735, 9061-9073, 9467-9480,
  9970-10200, 11381, 11900-12106, 12570-12600, 12785, 13283, 13505,
  13846-13910, 14300-14420, 14535-14539, 15127.
- `server/store.ts` (2,256): 1040-1056, 1236-1250, 1795-1905.
  `server/store.test.ts` (2,937): 888-920, 2015-2039, 2448-2486, 2585-2630.
- The drivers, for how usage reaches the ledger: `server/drivers/claude.ts`
  (370-390, 1352-1372, 1495-1512, 1575-1590, 1880-1905), `codex.ts`
  (410-432, 668-678, 1045-1075), `openai-chat.ts` (120-140, 725-745),
  `openai-responses.ts` (200-210), `pi.ts` (470-505), `claude-billing.ts`
  (25-40), `claude-keepwarm.ts` (85-99).
- `server/drivers/agents-call.ts` (996): 420-520.
  `server/drivers/agents-catalog.ts` (886): 245-303, 525, 834-875.
  `server/drivers/agents-proxy.test.ts`: 990-1070.
- `server/thread-aware-bots.e2e.test.ts` (955): 340-600.
  `server/cloud-team-inbox.e2e.test.ts` was also read completely by the
  inbox-server group (section 2.1).
- `server/steer-queue.ts` (325): 30-70, 105-150, 176-300.
  `server/channel-queue.ts` (225): 55-125. `server/message-db.ts`: 320-372,
  615-630. `server/routes/bot-messages.ts` (875): 150-172, 215-300,
  355-368, 565-580.
- `server/runtime/runtime.ts`: 705-740, 855-885.
  `server/runtime-coordinator.ts`: 35-60, 552-572.
  `server/runtime-coordinator.test.ts`: 1205-1250.
  `server/board/wiring.ts`: 95-125. `server/host/handoff-sent.ts`: 1-60.
- `server/workspace.ts` (644): 1-110. `server/cloud-home-settle.ts` (128):
  1-100. `server/routes/groups.ts`: 65-95. `server/config.ts`: 48-63,
  578-579. `server/host/room-jobs.ts`: 1-22, 60-80.
- `server/host/no-ai-notice.ts`: 60-112. `server/routes/conversation-share.ts`:
  150-206. `shared/today.ts`: 55-66. `packages/phone-protocol/src/wire.ts`:
  85-110, 175-190, 420-436, 565-582, 830-842.
  `packages/phone-protocol/src/runtime-events.ts`: 55-80, 178-186.
  `packages/phone-protocol/src/live-approval.ts`: 1-50.
- Client ranges: `src/state/store.tsx` (115-125, 218-224, 684-700,
  2399-2440), `src/App.tsx` (100-130, 205-220, 280-290),
  `src/components/ChatView.tsx` (360-392, 530-541, 640-760, 822-835),
  `src/components/RoomTextMessage.tsx` (90-136, 236-242),
  `src/components/TaskPicker.tsx` (50-66, 200-215),
  `src/components/NewBotDialog.tsx` (82-99, 229-238),
  `electron/main.mjs` (155-180), `electron/cloud-rail.mjs` (36-50),
  `electron/window-state.cjs` (86-97).
- `docs/team-cloud.md` (1,136): 178-188, 660-702, 913-1076.
- Test names only: `server/room-turn-timeout.test.ts` (521),
  `server/host/check-work.test.ts` (267), `server/check-work.e2e.test.ts`
  (73), `server/check-work-restart.e2e.test.ts` (78),
  `server/host/spawn-level.test.ts` (194), `server/local-models-once.test.ts`
  (113), `src/lib/ready-bots.test.ts` (174, names plus 124-174).
- Locale strings: `src/locales/en.json`, by key only.
- Git history: `git log` and `git show` of the commits that section 3 names.

### 2.3 Claims that the lead checked against the code

| Claim | Where |
|---|---|
| A reaction on a card in a group gives "none" | `server/reactions.ts:97-99` |
| An answer that reached the queue after its reaction was cleared is withdrawn | `server/reactions.ts:139-146`, commit `6f18a3752` (2026-11-21) |
| `MESSAGE_PERSON_HOURLY = 10`, `PLACE_MESSAGES_HOURLY = 10` | `server/host/team-messages.ts:39`, `server/host/place-inbox.ts:32` |
| The sender of a pass is the last person who wrote | `server/host/team-messages.ts:122-126` |
| `turnSettled` runs on every patch of a settled bot line, with an in-memory dedupe | `server/host/team-messages.ts:259-263`, `:286-294` |
| The Chief's `message_person` text becomes the answer, marked as the person's | `server/host/team-messages.ts:171-178`, `:184-185` |
| The team count adds unread news to the asks | `server/host/team-messages.ts:395-400` |
| A bot thread's cache total adds 0 for a missing count once one turn reported | `server/store.ts:1817-1821` |
| The group total keeps an unknown cache count unknown | `server/group-thread-usage.ts:14-18` |
| Keep-warm and compaction rows are booked on the conversation's thread id | `server/index.ts:5128-5141` |
| The turn total falls back to the last live event | `server/index.ts:6696` |
| The cost caption uses the bot's engine, not the thread's | `src/lib/chat-usage-summary.ts:10` |
| The bot usage chip is in the ⋯ menu, with a `title` tooltip | `src/components/ChatMoreMenu.tsx:157-163` |
| `ASSISTANT_HOURLY = 20`, spent before the gates | `server/host/person-inbox.ts:39`, `:328-330` |
| A correction through the Chief does not find an answered line | `server/host/person-inbox.ts:478-481` |
| A bad inbox file is logged and the inbox starts empty. The next save writes over it | `server/host/person-inbox.ts:134-147`, `server/host/place-inbox.ts:98-102` |
| Old hand-off result lines are dropped on load | `server/host/place-inbox.ts:100-101` |
| A card older than 7 days no longer rests on the person | `server/host/person-waits.ts:39-44`, `shared/today.ts:66` |
| The three inbox tabs were removed | commit `bef6fd7c4` (2026-11-02), `src/components/inbox/InboxPanel.dom.test.ts:55-58` |
| The "Who reports to whom" map was added, then removed | commits `b0a59c7bd` (2026-10-23) and `103f1c82d` (2026-11-11, deletes `TeamOrgChart.tsx`) |
| The map draws every live edge that is not queued as "running" | `server/runtime-coordinator.ts:560-561` |
| The rework limit of 4 is for a teammate on another server only | `server/host/remote-teammate-handoff.ts:36-38`, `server/checked-handoff.e2e.test.ts:107` |
| From a room, only `report_back` is refused | `server/index.ts:13877`, `:13880` |
| A person's message in an own thread lets it open one more | `server/thread-aware-bots.e2e.test.ts:354-358` |
| A missing room folder throws an untyped error | `server/room-folder.ts:5-9` |
| At most 5 threads opened per turn | `server/index.ts:7248` |
| Parallel room jobs are on by default and run in lane threads | `server/host/room-jobs.ts:21-22`, `:69-72`, `server/host/room-access.test.ts:20-21` |

## 3. How it works

### 3.1 Reactions: set, replace and clear

1. The client sends `POST /api/threads/:t/messages/:m/reactions` with
   `{emoji, on}`. The client always sends `on`
   (`src/components/Reactions.tsx:44`, `:53`).
2. The route accepts only the six emoji. `normalizeReaction` also accepts
   skin tones, U+FE0F and Slack short names, and refuses input over 64
   characters (`packages/phone-protocol/src/reactions.ts:18-34`). A bad
   emoji or a bad `on` gives 400 (`server/routes/reactions.ts:21-23`).
3. The route refuses a Cloud guest in a conversation that the guest did not
   start, with 403 (`server/routes/reactions.ts:24-25`).
4. The server takes the person from the session, never from the body
   (`server/routes/reactions.ts:11-12`, `:27`). `reactorFor` gives `"user"`
   on a workspace of one person, and a hashed person key `p_…` on a shared
   workspace (`server/index.ts:855-861`, `server/person-key.ts:5-10`).
5. `react` finds the message, else 404 (`server/reactions.ts:116-117`). It
   computes the next emoji from the person's previous one and `on`
   (`:118-120`). No change: the answer is "none" and nothing is written
   (`:121`).
6. The server writes the entry with a new stamp before any delivery
   (`:124-125`). `setReaction` removes the person's old entry, so each
   person has one reaction for each message (`server/store.ts:1049-1054`).
   The write saves before memory and then emits `message.patch`
   (`server/store.ts:1236-1249`). Other viewers see the reaction through
   that event.
7. A line with no recipient keeps the reaction and does nothing more: a
   person's line, or a room line with no `from` (`server/reactions.ts:75-79`,
   `:126`).
8. A feeling returns "noted" and starts no turn (`server/reactions.ts:95-96`).
   - In a direct chat, the next typed turn gets one note line for each
     feeling made since the person's previous message:
     `(NAME reacted E to your message “EXCERPT”.)`, excerpt 160 characters
     (`server/reactions.ts:56-65`, `server/index.ts:7722-7726`).
   - In a room, the note sits under the bot line in every room window. It
     has no "since" limit (`server/host/room-transcript.ts:64-65`).
   - Security invariant: a name loses its parentheses and becomes one line,
     so it cannot close the note (`server/reactions.ts:50-52`, test
     `server/reactions.test.ts:363-370`).

Limits: six emoji. Input of 64 characters at most. The stamp `lastStamp` is
in memory only (`server/reactions.ts:83-84`).

### 3.2 A reaction as an answer

1. A 👍 or 👎 on a bot text or widget line becomes the person's reply.
   Its sendId is `reaction-<first 32 hex of sha256(thread, message,
   person)>-<stamp><y|n>` (`server/reactions.ts:30-32`, `:89`).
2. On a line of the person's own team inbox, the answer goes back at once
   to the sender of the line (`server/host/team-messages.ts:381-387`). It
   cannot be withdrawn, and it counts in the hourly limit (section 3.6).
3. Else `personReplies.deliver` sends it (`server/person-replies.ts:57-103`):
   - In a room, the text is `@<bot>: 👍` and it goes to the bot that wrote
     the line. The bot must still be a member, else 409 (`:60-65`).
   - A sendId already in the transcript is "repeated", and nothing is sent
     (`:68-70`). A queued item with the same sendId is "queued" (`:72-83`).
   - The spend cap can refuse it with 409 (`:87`).
   - A busy thread queues the answer in the durable `chat_followups` table.
     An idle thread starts a turn (`server/index.ts:7057-7080`). Busy is the
     state of the thread, not of the bot (`server/index.ts:7060`).
4. The turn prompt says what the reaction means
   (`server/replies.ts:151-176`):
   - 👍 after a question or an offer means "yes, go ahead".
   - 👍 after a statement means "got it". The bot starts no new work and
     answers in a few words.
   - 👎 means no. If nothing was asked, the bot asks what to change.
   - The quoted message (900 characters at most) is fenced as untrusted
     text.
5. Each change is told once. `answersSent` scans the transcript for the
   last answer of this person to this message. The same emoji again sends
   nothing (`server/reactions.ts:86-90`, `:104`).
6. A change of mind sends the new answer first and then withdraws the old
   one (`server/reactions.ts:128-138`). A clear withdraws the old one
   (`:131-134`). A withdraw removes only an item that still waits in the
   queue (`server/person-replies.ts:105-114`). An answer that started stays
   (`server/reaction-delivery-lifetime.test.ts:74-82`). The docs say "taking
   the reaction back before the bot gets to it" (mdx:17). That holds.
7. Race: the person clears or replaces the reaction while the answer is
   being queued. After a "queued" delivery, `react` reads the stored
   reaction again. If it changed, the server withdraws this answer and
   returns "none" (`server/reactions.ts:139-146`). Another person's change
   does not count (`server/reaction-delivery-lifetime.test.ts:64-72`).
8. Error path: `reply` or `answerCard` throws (spend cap, bot left the room,
   card refused). The server rolls the reaction back to the previous one,
   only if the stored entry is still this one by `at` and emoji
   (`server/reactions.ts:148-152`). The route returns the status and the
   code (`server/routes/reactions.ts:28-32`). The client restores its own
   state only if this tap is still the newest
   (`src/components/Reactions.tsx:56-59`).
9. A 👍 or 👎 on an open card, in a direct chat only
   (`server/reactions.ts:97-102`):
   - An approval card: 👍 allows, 👎 denies.
   - A question card: only one question that is not multi-select, with a
     yes/no option (`server/reactions.ts:34-48`).
   - Any other card, or a card in a room: "none". The reaction stays
     under the card (`server/reactions.ts:98-99`).
   - `respondToCard` runs the card's own checks and records
     `answeredBy.via = "reaction"` (`server/index.ts:4815-4864`). It maps an
     inbox copy of a card back to its source (`:4824`).
10. The decision stays. A clear calls only `withdraw`, never `answerCard`
    (`server/reactions.ts:128-134`). By reading, a later 👎 on the real path
    finds the card already answered: `liveCardKind` is null, the card is
    not a text line, and the answer is "none" (`:97`, `:104`). The unit
    test at `server/reactions.test.ts:271-272` shows a second `answerCard`
    call, but its fake never marks the card answered. Section 9 lists this.
11. A 👍 that a chat channel relays (the Slack worker) is a guarded send
    with `reactedWith`. The server then records the reaction with
    `Date.now()` and no withdraw (`server/routes/bot-messages.ts:228-231`,
    `:292-296`, `:363`). This path does not use `createReactions`.

Limits: the reply excerpt is 900 characters in the reaction prompt
(`server/replies.ts:7`) and 220 in a transcript replay (`:199`). A 👍 never
names the thread (`server/index.ts:7523`). Queued answers of one person
join into one turn with the person's other queued lines
(`server/steer-queue.ts:206`, `:260-266`).

### 3.3 Token usage: the bot chip and the group badge

1. A driver reports usage in two events
   (`packages/phone-protocol/src/runtime-events.ts:61-70`, `:181-185`):
   - `thread.token-usage.updated` during the turn. Its meaning differs for
     each driver: one model call (Claude, `server/drivers/claude.ts:1499-1510`),
     the process total (Codex, `server/drivers/codex.ts:1069-1073`), or the
     running sum of the turn (chat API, `server/drivers/openai-chat.ts:736-744`).
     The doc comment says that it "must never be summed" (`runtime-events.ts:67-69`).
   - `turn.completed{cost?, usage?}` at the end, with the total of the turn.
2. Input always includes cached tokens (`claude.ts:1580`, `codex.ts:1048-1049`,
   `acp/prompt-usage.ts:17-19`, `pi-usage.ts:46`). A cache count is set only
   when the engine sent a valid number (`openai-chat.ts:130-136`).
3. The host keeps the last live figure of each thread in memory
   (`server/index.ts:4912`, `:6619-6624`).
4. A turn ends in a bot's own thread (`server/index.ts:6665-6731`):
   - The tokens are `event.usage ?? lastReported` (`:6696`). If the turn
     has no final usage, the last live figure becomes the total.
   - `store.addTaskUsage` adds the turn to the thread totals in `bots.json`,
     with only a cost that the engine reported (`:6699-6705`). The save is
     deferred, and a crash can lose the last turn
     (`server/registry-save.ts:54-55`).
   - `bookTurnUsage` appends one ledger row (`:1342-1350`). `ledgerCost`
     keeps a reported cost, or adds an estimate from list prices marked
     `estimated` (`server/model-prices.ts:43-54`). The write never fails the
     turn (`server/usage-ledger.ts:140`).
5. A turn ends in a group thread (`server/index.ts:6771-6797`): only
   `bookTurnUsage`. Then the ledger flushes, `GroupUsageReader.refresh()`
   runs and the group frame goes out. An error is ignored, so the badge
   stays old until the next refresh (`:6797`).
6. The group reader (`server/group-thread-usage.ts`):
   - It reads every month file ever written, and re-reads only a file whose
     stamp changed (`:35-86`).
   - It keys rows by thread id only. Any row of that thread counts, from
     any bot (`:11`, `:89`).
   - One row with no cache count makes the cache total unknown for good
     (`:16`). Cost sums only rows that have one (`:18`).
   - `publicGroupState` puts the usage of the group's current thread, or
     null, on every group frame (`server/index.ts:4042-4073`). A new thread
     gives null. The figures come from files, so they survive a restart.
7. The bot chip (`src/lib/chat-usage-summary.ts`, `src/lib/usage.ts`):
   - Short text: the cost when known, else "X uncached" when the cache split
     is known, else "X input" (`usage.ts:132-137`).
   - Tooltip: turns, the split or "X input (cached + uncached)", the last
     message, the context fill, a nudge at 80 %, keep-warm, and the cost with
     a caption (`chat-usage-summary.ts:12-22`).
   - It sits in the ⋯ menu of the chat as the trailing text of a "Usage"
     row, with a `title` tooltip (`src/components/ChatMoreMenu.tsx:157-163`).
     The docs say "the usage chip in a bot's chat header" (mdx:25).
8. The group badge is a focusable pill in the room header in Advanced mode,
   with `title` and `aria-label` (`src/components/GroupUsageChip.tsx:25-30`,
   `src/components/RoomHeader.tsx:263`). In Simple mode it is a row of the
   room ⋯ menu (`src/components/RoomMoreMenu.tsx:114-121`). It is hidden
   when the thread has no turns (`GroupUsageChip.tsx:13`).

The two totals disagree in four ways:

| Rule | Bot chip (`bots.json`) | Group badge (ledger) |
|---|---|---|
| A turn with no cache count, after a turn with one | adds 0 cached input (`server/store.ts:1817-1821`, test `server/store.test.ts:900-912` expects 1010) | the total becomes unknown (`group-thread-usage.ts:16`) |
| Cost | only a cost the engine reported (`server/index.ts:6703`) | also list-price estimates, under the label "Reported costs" (`group-thread-usage.ts:18`, `src/locales/en.json:6858`) |
| Keep-warm and compaction rows | not counted | counted as turns, and can become the "last turn" (`server/index.ts:5128-5141`) |
| Strings | "X uncached", "(cached + uncached)" | "X uncached input", "(cache split unknown)" (`en.json:2880-2901`, `:6851-6858`) |

Edge cases:

- A NaN cache count is stored as a known 0 (`usage-ledger.ts:123`, test
  `server/usage-ledger.test.ts:83`, `:89`).
- In one chat API turn, a round with no cache count adds nothing, and the
  sum is "complete" when any round reported
  (`server/drivers/openai-chat-cached-input.test.ts:28-29`, `:90`).
- The cost caption uses the engine of the bot, not of the thread
  (`chat-usage-summary.ts:10`).

Limits: a ledger range read is 366 days at most (`usage-ledger.ts:86`). The
parse cache keeps 26 month files (`:183`). The group reader has no limit.

### 3.4 Everyone has an Inbox: the place inbox

The server makes the place inbox only when the place is not a team
(`server/index.ts:2761`). One person uses it, so it copies nothing
(`server/host/place-inbox.ts:1-5`).

1. **Asks are read live.** An ask is the open card itself, read from the
   open cards of the messages table (`place-inbox.ts:144-193`). So one
   answer settles every surface. The list leaves out:
   - a card that does not wait on the person (`shared/person-wait.ts:27-46`).
   - a card that the viewer may not answer (`place-inbox.ts:156`). The check
     is the same one that the card answer uses (`server/index.ts:2761`).
   - a question that the person wrote past, unless a running turn still
     waits on it (`place-inbox.ts:148-157`).
   - a thread that someone closed (`:159`).
   - the Results-chat copy of an automation's question, when the original is
     in the view (`:212-214`).
2. **Other waits.** A conversation that rests on the person with no live
   card (a password, a sign-in, an app connection, an ask left after its
   turn) comes from `personWaits.waiting()` (`place-inbox.ts:174-191`).
3. **News lines are stored.** `place-inbox.json` holds
   `{version: 1, lines, seenAsks}`, written atomically with mode 0600
   (`place-inbox.ts:23-46`, `:109`). A line is a message, a result or a
   notice. One job keeps one result row (`:218-224`).
4. **What files a line.** A routine report, a summary, a failure of a
   routine or of handed work (`place-inbox.ts:256-268`). The notification
   goes out unchanged (`:267`). A finished hand-off files no line: only the
   asking bot's own answer is news (`:4-5`).
5. **`message_person` with no team.** The message is posted into the
   conversation that sent it, with one line and one notification. The `to`
   field is ignored (`place-inbox.ts:230-252`, `server/host/team-messages.ts:333-338`).
6. **When news is settled.** The person writes in that conversation after
   the line. In a room, only a reply to that line counts (`untilReply`,
   `place-inbox.ts:125-133`). A read routine result goes to Done (`:136`).
7. **Who sees what.** The viewer is the owner, a guest or nobody. A guest
   sees only lines of the guest's own conversation. The owner sees no guest
   line. A guest's ask reaches the owner labelled `askedBy`. A loopback
   shell sees nothing (`place-inbox.ts:56-65`, `:138-142`, `:167`).
8. **Each place keeps its own.** Nothing syncs between places
   (`docs/team-cloud.md:180-182`). The desktop asks each place that is not
   on screen for `GET /api/inbox/count` every 120 s, while the window is
   visible, and puts a dot on that place in the rail
   (`electron/place-inbox-watch.mjs`, `electron/cloud-rail.mjs:47`, `:97`).
   A place that is asleep is never asked. A non-OK answer clears the dot. A
   network error keeps it.

Limits: 2,000 lines, 2,000 seen asks, 30 days, 200 rows in a view with
active rows first, 4,000 characters for each row, 2,000 for stored text
(`place-inbox.ts:24-29`, `:210-211`).

### 3.5 The team inbox and "answering is replying"

This is for a Team Cloud only (`server/host/person-inbox.ts:132`).

1. **The inbox home.** The person's own Chief, else the person's own default
   bot, which the server makes when it is missing (`person-inbox.ts:152-162`).
   The conversation is the kept one, else the "Brief" chat renamed "Inbox",
   else the person's newest own chat, else a new "Inbox" task (`:157-188`).
   Crowning another Chief moves the inbox (`:201-204`). The reference's own
   design doc says that the app no longer offers a personal Chief
   (`docs/team-cloud.md:916-918`). The page still describes one (mdx:78, 84).
2. **What arrives** (`server/host/team-messages.ts:240-284`,
   `person-inbox.ts:396-417`):
   - `message_person` (section 3.6);
   - an @mention by a teammate or by a bot. The `mentions` research owns the
     tag rules;
   - asks from bots that report to the person;
   - work handed back, failures and routine results.
3. **One notification.** Every notification passes `teamMessages.route`
   (`server/index.ts:4903`). For an ask kind or a routine result, on a team:
   - An ask in the person's own chat stays there (`person-inbox.ts:402-403`).
   - A confined thread only notifies the person, and copies nothing (`:401`).
   - Else the server copies the open card once into the inbox, as an
     `options` message, and re-addresses the notification to the inbox
     thread (`:404-416`). The dedupe key is request id, origin and person
     (`:405`).
4. **The copy follows the original.** A store subscription patches the copy
   when the original card changes. A deleted origin closes the copy as
   "unavailable" (`person-inbox.ts:425-446`). An answer on the copy maps
   back to the original with `answeredIn` before it is applied
   (`:420-422`, `server/index.ts:3835`, `:4824`, `:11944`).
5. **Answering is replying.** Three ways:
   - **Reply** on a line: `replyIn` posts the person's line with
     `replyToId` and sends the answer back. The inbox bot takes no turn. A
     retried sendId returns the first result. The hourly limit applies
     (`team-messages.ts:301-314`).
   - **A 👍 or 👎**: `reactedIn`, the same path with the emoji as the text
     (`:381-387`).
   - **Telling the Chief** ("tell Cleo Friday works"): the Chief's prompt
     lists the waiting lines as quoted data (`:316-325`). A `message_person`
     to a sender who waits becomes the answer (`:184-185`). The text is the
     model's text, but the server stores it as an answer `by: "person"`
     (`:173`). Section 8 raises this.
6. **Where the answer goes** (`person-inbox.ts:349-386`):
   - To a bot in a one-to-one chat: `continueTurn` starts the bot's turn now,
     or queues it behind the running turn (`server/host/relayed-turn.ts:25-29`).
     The server builds the text: `"<name> replied to your message
     (\"<quote>\"): <answer>"`. It carries information authority, not command
     authority (`relayed-turn.ts:23-24`).
   - To a room: a relay line under the asking bot's name. It starts no turn,
     unless a board item waits on the person (`person-inbox.ts:362-364`,
     `server/board/wiring.ts:105-109`). The docs say that the bot carries on
     (mdx:91).
   - To a teammate (an answer to an @tag): a new line in the teammate's
     inbox (`person-inbox.ts:372-378`).
   - Errors: the person left 410, the origin is gone 410, no inbox 409,
     nothing waits 409 (`:351`, `:359-361`, `:379`). A failed reply posts a
     "not passed" activity line (`team-messages.ts:312`).
7. **The tabs.** The server computes the group of each row on read:
   an ask with a request id is "needs-you" while it waits, else "done".
   Other lines are "done" when done, answered there, or a read result, else
   "info" (`person-inbox.ts:255-258`). An ask waits while both the copy and
   the original are live (`:227-232`). A message is answered there when the
   person writes in the origin conversation after the line (`:235-243`).
8. **Done.** `markDone` refuses an ask with 409: "answer it, or close it,
   where it asks" (`server/routes/inbox.ts:42`, test `server/routes/inbox.test.ts:47-55`).
   Mark all read answers nothing (`person-inbox.ts:535-543`).
9. **Someone leaves.** The server forgets the person's inbox
   (`server/index.ts:2783`). A pass to that person gives 410
   (`team-messages.ts:146`).
10. **Store.** `person-inbox.json` holds `{version: 1, homes, items}`, mode
    0600, atomic (`person-inbox.ts:29`, `:62`, `:144`). The line is first
    appended to the message store, then the item is saved
    (`person-inbox.ts:305`, `:316`). A crash between them leaves a line that
    cannot be answered.

Limits: 2,000 items, 30 days, 200 rows in a view, 4,000 characters for
each row, 400 for stored text, `from` 200 (`person-inbox.ts:33-37`, `:47`,
`:55`). A waiting message stays in Needs you for 7 days
(`team-messages.ts:41`, `:423`).

### 3.6 `message_person` and the message rate limit

1. A turn that has the agents tools gets a "People" section in its system
   prompt: up to 30 people, not the person it talks with
   (`server/host/team-messages.ts:43`, `:357-368`).
2. The bot calls `message_person {to, message}`
   (`server/drivers/agents-person-tools.ts:16-30`). The agents server posts
   to `/api/internal/people/message` with the turn's capability. The server
   takes the bot and the thread from the capability, never from the body
   (`team-messages.ts:328-329`, `server/index.ts:12785`).
3. Refusals, in order (`team-messages.ts:181-207`, `:129-148`, `:340`):

| Status | When |
|---|---|
| 403 | a confined conversation (`OUTSIDE_REFUSAL`) |
| 400 | a bad body |
| 403 | the bot does not speak in this conversation |
| 404 | nobody of that name, with the list of names |
| 409 | two people of that name: ask for the email |
| 410 | the person left the team |
| 400 | the person the bot talks with |
| 200 | the person's last line already tagged them: "don't pass it on again" |
| 429 | 10 passes from this conversation in the last hour: "Don't retry" |
| 403 | the target cannot use this bot |
| 409 | the target has no inbox |

4. Success: one line in the target's inbox with `to: "bot"`, a "Told Ben"
   chip in the sending chat, one notification (`team-messages.ts:163-168`,
   `:197-206`). A later @mention of the same person in the same turn does
   not tell them again (`toldThisTurn`, `:204`, `:264-276`).
5. The name match: email, then full name, then first name, then the local
   part of the email (`team-messages.ts:137-140`).

The limit (`MESSAGE_PERSON_HOURLY = 10`, `team-messages.ts:39`) is for each
conversation, not for each bot or person. Answers from an inbox count too
(`:172`, `:308`). The comment gives the reason: "enough for a person's
errands, too few for two bots to ping-pong for long" (`:38`). The place
inbox has its own limit of 10 (`place-inbox.ts:32`, `:235`). The counter is
in memory (`team-messages.ts:150-153`), so a restart resets it. The board's
`ask` has no limit (`:209-223`). Limits: 2,000 characters for a message, 254
for `to` (`:37`, `:46`).

### 3.7 The assistant answers simple facts

1. It runs only for a delivery marked `representable` (`message_person`, a
   teammate's @tag), and only when the server wired it
   (`server/host/person-inbox.ts:320`, `server/index.ts:2761`). Asks and
   approvals never reach it (`person-inbox.ts:407-411`).
2. Budget: 20 answers for each person in an hour (`ASSISTANT_HOURLY`,
   `person-inbox.ts:39`). The budget is spent before any gate runs
   (`:328-330`), so a statement uses it too.
3. Gates before the model (`server/host/representative.ts:44-64`, `:146-149`):
   - not a question (no `?` and no question word, English and German): wait.
   - a word of decision, approval, promise, booking, sending, sharing,
     outside, private or salary: wait.
   - no calendar, no notes and no work: no model call.
4. Facts that the server builds:
   - busy times from the person's own Google Calendar, 14 days ahead, start
     and end only, at most 80 slots (`server/host/person-calendar.ts:17-40`,
     `representative.ts:11-13`, `:91-93`).
   - shared notes of bots that are not restricted, 2,000 characters for each
     bot and 6,000 in all, and their work status (`person-inbox.ts:277-286`,
     `representative.ts:14`, `:99-101`).
   - Never a private chat, About you or the person's memory
     (`representative.ts:4-8`).
5. One text call with no tools, on the inbox bot's engine, with a 60 s
   timeout (`server/index.ts:2761`). The prompt fences the data with markers
   and replaces brackets in the data with spaces, so a note cannot close the
   fence (`representative.ts:76-77`, `:114-124`).
6. Gates after the model: JSON only. `{"wait": true}` wins. One line of 600
   characters at most. An answer that speaks for the person's will
   ("approved", "deal", "Ben will do it") is dropped (`representative.ts:69-74`,
   `:127-139`).
7. After the call, the server checks again: the item is answered, done or
   settled, the person left, the inbox moved, the server stops. Any of these
   drops the answer (`person-inbox.ts:339-341`, tests
   `server/host/person-inbox.test.ts:35-122`).
8. The answer goes back like a reply, labelled "<name>'s assistant"
   (`person-inbox.ts:367-368`). The notification says that the assistant
   answered (`:344`).
9. Correcting it: a Reply on the line still works and adds a second answer
   (`person-inbox.ts:474-476`). "Tell Cleo, actually…" through the Chief
   does not find the line, because `waitingFrom` skips answered items
   (`:478-481`). So "replying corrects it" (mdx:99) holds for Reply and
   reactions only.
10. A calendar read error becomes "no busy times", and the prompt then says
    "not connected" (`representative.ts:80`, `:148`).

### 3.8 The team map

1. The person opens "Team map" from the sidebar tools in Advanced mode
   (`src/components/SidebarFooterNav.tsx:166-175`). Departments come from
   three sources, General first: the sidebar sections, the room sections and
   the bot sections (`src/components/TeamMapPage.tsx:291-295`,
   `src/lib/team-map.ts:47-64`). Archived bots are not drawn (`:290`).
2. The canvas stays hidden until the saved layout loads, at most 1.5 s
   (`src/components/TeamCanvas.tsx:91-92`, `:147-184`).
3. **Live hand-offs.** The page reads `GET /api/team-map` at once and then
   every 3 s while it is visible (`TeamMapPage.tsx:311-327`). The server
   returns ids, relations and times only, never prompts or replies
   (`server/index.ts:14333-14361`, test `server/team-map-api.test.ts:30`,
   `:35`):
   - `collaborations`: direct-message rooms of exactly two bots.
   - `queued` and `running`: open assignments whose parent is another bot,
     filtered to bots and rooms that the viewer may see.
   The client keeps one edge for each pair, running before queued before
   connected (`team-map.ts:66-106`). A failed poll shows an alert and keeps
   the last snapshot (`TeamMapPage.tsx:316-318`).
4. The runtime maps every state that is not "queued" to "running"
   (`server/runtime-coordinator.ts:560-561`). So a hand-off that waits for
   the person shows as an animated "Running" line. The client type has a
   `reason` field that the server never sends (`team-map.ts:15`).
5. **A card** shows the name, a crown for a Chief, the title, a status dot
   and the model (`TeamCanvas.tsx:32-87`).
6. **Arrange.** Drag a department, or move it with arrow keys. Drag a card
   inside its department to reorder it. The layout is saved in this
   browser's localStorage only, never on the server
   (`TeamCanvas.tsx:186-212`, `:339-349`).
7. **Move a bot to another department.** Only when the person may manage
   (`TeamMapPage.tsx:392`). A confirm dialog, then
   `POST /api/sidebar-sections` (`:329-341`). The card moves only after the
   server answers (`:332-336`). The refusals belong to the departments
   research.
8. **The department menu**: move bots, shared instructions, department
   memory, rename and delete (`TeamCanvas.tsx:465-484`). General cannot be
   renamed or deleted. The delete dialog closes before the request, so a
   slow delete shows nothing until it fails (`TeamMapPage.tsx:434-440`).
9. **Show screens** draws each bot's cloud computer with live frames. The
   server captures only while a map asked in the last 6 s, at most 4 a
   second, 3 at once, never a computer that a person holds
   (`server/computer-frames.ts:79-199`). This is a cloud feature.
10. **The map composer** sends a message to @bot, @department or @everyone.
    @everyone goes to the Chief of the whole team, unless the line is a
    stop, which goes to every bot (`src/lib/map-composer.ts:64-81`).

What the map does not do at `96ff84455`: show people, show "who reports to
whom", or let you drag a bot onto a person. The page says it does (mdx:80).
The view was added in `b0a59c7bd` (2026-10-23) and removed in `103f1c82d`
(2026-11-11): "The Team map's … 'See who looks after what' … are gone; the
routes stay."

### 3.9 A second opinion on a different model

[`threads.md`](threads.md) §3.20 covers `start_thread`. This section adds
the rest.

1. The bot calls `list_models {search?}`, 200 characters at most
   (`server/drivers/agents-catalog.ts:295-303`). The route answers for the
   calling bot and thread only, and needs a live capability
   (`server/routes/internal-models.ts:147-158`). It probes no engine. It
   reads the registry in memory (`:15`).
2. The order in each engine: the turn's current model, the bot's own model,
   the engine default, then the catalog (`internal-models.ts:85`).
3. The list is short: 8 for each engine, or the whole list when an engine
   has 12 or fewer. A search gives 20 at most in all (`internal-models.ts:6-10`,
   `:104`). Test: a catalog of 2,000 models gives 8, `more` 1,992, under 400
   characters of JSON (`server/routes/internal-models.test.ts:19-27`).
4. Each listed model passes the same refusal that `start_thread` uses
   (`internal-models.ts:107-118`, `server/host/own-threads.ts:40`). Three
   refusals in a row end the scan of an engine (`internal-models.ts:12`).
   Models that the organization turned off, or that need a newer CLI, go to
   `blocked` with the reason (`:89-90`).
5. An engine that cannot run is grouped under `unavailable` with `why` and
   `connect` (`internal-models.ts:93-103`). The words come from `engineHint`
   (`server/host/engine-hints.ts:44-84`). Its first comment gives the
   reason: a bot once said that a Google engine needs a paid API key, but it
   signs in with a Google account (`:1-4`). The test proves that the
   refusal of `start_thread` equals the list's reason word for word
   (`server/thread-aware-bots.e2e.test.ts:459-461`).
6. A local model on one loopback port is listed once, with one `localAlso`
   line (`server/local-models-once.ts:1-6`, `:86-106`).
7. `start_thread` with `model_selection` and `report_back: true`. The server
   refuses, in this order (`server/index.ts:13877-13881`):
   - a bad selection.
   - "model_selection is only for threads on yourself" (to another bot).
   - `ownThreads.refusal`: turned off by the organization, CLI too old,
     signed out, engine unavailable (`server/index.ts:9061-9072`,
     `own-threads.ts:36-40`).
   - 409 when this turn runs a hand-off, or when the latest person-role
     line has `peerAsk` (`server/host/self-threads.ts:6-12`).
   - 400 for `report_back` from a room (`server/index.ts:13880`).
   - a brief over the hand-off limit (`server/checked-handoff.e2e.test.ts:80-89`).
   At most 5 threads opened in a turn (`server/index.ts:7248`).
8. Accepted: a hand-off to the bot itself with `thread: "new"` and
   `reply: "resume"` (`server/index.ts:13881`). The new thread takes the
   picked model and the approval level of the source conversation
   (`own-threads.ts:61-73`, `server/host/spawn-level.ts:29-49`). The bot is
   told to finish its turn and not to wait (`server/drivers/agents-call.ts:460-462`).
9. The person sees "Opened thread #<title>" and later "#<title> replied"
   (`server/host/handoff-sent.ts:26`, `:48-55`, `src/locales/en.json:425`).
10. When the thread's turn starts, the server checks the model again. If it
    can no longer run, the turn fails with "Nothing ran on another model in
    its place" (`own-threads.ts:44-49`, `server/index.ts:3988`, test
    `thread-aware-bots.e2e.test.ts:574-600`). There is no fall back to the
    bot's own model.
11. The bot may steer its own thread only from the source conversation
    (`own-threads.ts:50-54`).

Edge cases:

- "A thread opened this way can't open more" holds only while the latest
  person-role line is the bot's own opening. A person's message in the
  thread lets it open one more (`thread-aware-bots.e2e.test.ts:354-358`).
- From a room, only `report_back` is refused (`server/index.ts:13880`).
  `model_selection` without `report_back` opens a thread
  (`:13882-13883`). The docs say "these threads can't be opened from a group
  chat" (mdx:115).
- When both the picked engine and the bot's own engine are signed out, the
  check returns null, the thread opens and its turn fails by itself
  (`server/thread-model.ts:28-31`).

### 3.10 People in the sidebar and presence

1. The client loads `GET /api/team/people`:
   `{email, name, role, you?, pictureUrl?, here?}` (`src/state/team-people.ts:106-110`).
   The server returns current members only. Pictures and presence go to a
   team session only. About you is never served
   (`server/routes/team-owners.ts:6-7`, `:84-97`). A picture is
   `private, no-cache` with an etag (`:99-114`).
2. `SidebarPeople` shows faces: you first, then people here now, then by
   name (`src/components/SidebarPeople.tsx:38-40`). Off a team, or alone and
   not an admin: nothing (`:68-70`).
3. Click yourself: the inbox bot and the inbox panel open (`:82-85`). Click a
   teammate: `@Name ` goes into the draft of the open composer, or of your
   inbox when no chat is open (`:87-94`).
4. Your face shows the number of open asks in your inbox (`:76`).
5. The @ list adds teammates after the bots (`src/components/MentionMenu.tsx:21-24`).
6. Presence: each team session's event stream counts its person as here.
   Each window posts `{tab, threadId}` on change and every 60 s
   (`src/state/team-presence.ts:94-119`). A private chat is sent as "no
   conversation" (`server/host/team-presence-host.ts:59-71`). A person is
   away 45 s after the last stream closed (`server/team-presence.ts:7`).
   Presence is in memory only (`docs/team-cloud.md:1031-1032`).

### 3.11 Edits that a second bot checks

1. The pair is two templates in `src/lib/ready-bots.ts`: the writer (179-203)
   and the checker (204-229). They name each other with `partner`
   (`:202`, `:227`). The whole protocol is standing-instruction text
   (`:186-197`, `:211-222`).
2. When the person adds the checker, the dialog asks
   `/api/bot-defaults?checker=1` (`src/components/NewBotDialog.tsx:86`).
   `otherProviderSelection` picks a model of another provider (another
   `driverKind`), ready to run, not the free backup
   (`server/checker-model.ts:7-16`). Null on a hosted workspace or when no
   other is ready (`server/index.ts:14535-14539`). The dialog shows one line
   that names the model, or says that no other AI is ready
   (`NewBotDialog.tsx:229-238`, `en.json:7921-7922`).
3. The writer, by its instructions, saves `request.md`, `source.md` and
   `result.md` under `checks/<task>/` in its folder, picks the teammate whose
   role is Checker, and sends `coordinate_bots` with `files`
   (`ready-bots.ts:191-192`). Only files attached in this conversation pass
   on. They land byte for byte in the checker's thread folder
   (`server/checked-handoff.e2e.test.ts:54-78`). A request over the limit
   is refused, never cut (`:39-52`).
4. The checker answers "pass" or "issues: N" on its first line
   (`ready-bots.ts:220`). The writer fixes and sends `rework` to the same
   thread, up to 3 rounds by its instructions (`:195-196`).
5. The app does not enforce a limit for a local checker. The test sends six
   reworks and none is refused: "no round limit, the worker decides when to
   stop" (`server/checked-handoff.e2e.test.ts:107-123`). The only limit is 4
   reworks to a teammate on another server (`server/host/remote-teammate-handoff.ts:36-38`,
   `:146`). Its count is in memory for 6 hours, so a restart resets it
   (`:39`, `:85`). The page says that the app refuses more than four reworks
   (mdx:119).
6. With no Checker teammate, the writer opens `start_thread` with
   `report_back` on another provider's model (`ready-bots.ts:193`), as in
   section 3.9.
7. "Not checked:" comes from the instructions only (`ready-bots.ts:197`).
   A separate bot setting, "Check before done", enforces a check loop in
   code (`server/host/check-work.ts:20-31`, `:248-321`, `:349`,
   `packages/phone-protocol/src/check-work.ts:10-12`):
   - 3 rounds and 30 minutes at most;
   - an answer of at least 400 characters, or a file;
   - the verdict on the first line;
   - a "Not checked: <reason>" line for each other end. It saves its flows in
   `check-work.json` and reports "Not checked: the app restarted" after a
   restart (`check-work.ts:129-146`, `:285-295`). So two paths do one job.

### 3.12 Group timeouts: the checks only

[`bot-coordination.md`](bot-coordination.md) §3.7 describes the deadline.
Here are only the checks against changelog problems.

1. Progress events keep a member turn alive: deltas, item events and turn
   progress (`server/room-turn-timeout.ts:9-12`). Late progress after the
   limit cannot revive a turn (`:140-146`).
2. Sleep of the computer is not silence: a gap of more than 15 s between
   looks is a suspend (`room-turn-timeout.ts:54-59`, `:173-182`). The
   comment names the cause: on macOS, timers and the clock run during sleep.
3. A running tool may be quiet for 60 minutes (`:51-52`).
4. Open waits hold the clock until all of them end (`:149-164`).
   [`bot-coordination.md`](bot-coordination.md) P224 already raises that
   this wait has no limit.
5. The deadline fires once (`:217-222`). `finish` runs once
   (`server/index.ts:10113-10122`). The stall handler for the setup is
   swapped for the turn's handler in the same step as the dispatch
   (`:10137`).
6. The stall registry keeps one handler for each thread id, and a new
   `register` replaces the old one (`room-turn-timeout.ts:228-233`). This is
   correct while one member turn runs at a time on one room thread. Room jobs
   run one at a time (`server/room-queue.ts:48`, `:55`). A bot is held by one
   room thread at a time (`server/room-member-lock.ts:18-22`). Parallel room
   jobs are on by default (`server/host/room-jobs.ts:21-22`), but they run in
   lane threads with their own ids (`server/host/room-access.test.ts:20-21`).
7. The general watchdog ends a room member's wait through the registry
   (`server/index.ts:4960`).

### 3.13 Working folders

[`threads.md`](threads.md) §3.10 covers the folder of a one-to-one thread.

1. A folder that a person gives must be absolute, must exist and must be a
   folder. `~` expands. Blank clears (`server/bot-cwd.ts:9-25`). A link is
   kept as given (test `server/bot-cwd.test.ts:88-90`).
2. A bot's thread pins its folder at its first turn: the given folder, else
   the bot's folder, else `task-workspaces/<bot>/<thread>`
   (`server/store.ts:1853-1876`, `server/index.ts:7800-7810`). A thread in
   its own folder moves to the bot's folder when the bot gets one, with a new
   engine session (`bot-cwd.ts:29-33`, `server/index.ts:7706`, `:7716`).
   A PATCH of a thread's folder gives 400 (`server/task-cwd-api.test.ts:51`, `:62`).
3. A Cloud guest's, a Bot API or a link-limited conversation keeps its
   private folder (`server/index.ts:1002-1007`, `:7706`, `:7808-7810`).
4. **A group's shared folder** is set at room setup, before the first
   message (`server/routes/groups.ts:72-79`). Each group thread pins
   `group.cwd ?? null` at its first dispatch and keeps it, also after a
   reload (`server/store.ts:1878-1900`, `server/store.test.ts:2590-2613`).
   The comment gives the reason: "engines key their sessions and files to the
   folder a thread starts in" (`store.ts:1877`).
5. Each member whose engine works in folders runs in that folder. A member
   whose engine runs off the host gets no folder and does not pin
   (`server/room-cwd.ts:2-8`, `server/index.ts:9989-9994`).
6. A pinned room folder that was deleted stops the turn before launch with
   "This room's working folder no longer exists" (`server/room-folder.ts:5-9`,
   `server/index.ts:9995`). It is a thrown `Error`, not a typed refusal.
7. A hand-off outside a room shares the sender's folder (`in_my_folder`, on
   by default) only when the folder is outside the data folder, also after
   links resolve. A link is shared as its target at check time
   (`bot-cwd.ts:38-62`, `server/index.ts:13505`). Security invariant: a
   bot's private workspace never reaches a teammate.
8. The UI: "New thread in a working folder…" in the bot row menu, for an
   admin in Advanced mode only (`src/components/Sidebar.working-folder.test.ts:57-92`).

The page says: "Cloud workspaces use a stable default so generated files
remain discoverable across threads" (mdx:137). The readers found a folder
for each thread only. Section 9 lists this.

### 3.14 The waiting count, and waits that do not end

1. Five places compute "waiting" in five ways:

| Place | Rule | Where |
|---|---|---|
| `GET /api/inbox/count` (the rail) | needs-you rows + unread info rows | `server/host/team-messages.ts:395-400`, `place-inbox.ts:282-284` |
| The sidebar Inbox row | the count + team fixes + unread conversations with no line, "9+" above 9 | `src/components/SidebarInboxRow.tsx:25-26` |
| The panel header | the same, with no team fixes | `src/components/inbox/InboxPanel.tsx:84` |
| Your face under People | open asks only (`openAsks`) | `src/components/SidebarPeople.tsx:76`, `person-inbox.ts:262-268` |
| The app icon and tab title | for each bot, `max(unread ? 1 : 0, openAsks)`, + unread rooms. 999 at most on the desktop | `src/App.tsx:121-123`, `src/lib/bot-unread.ts:17-19`, `electron/window-state.cjs:86-89` |

   The page says that the same number goes to the icon and the tab (mdx:97).
   All counts drop when a card settles anywhere, because each one reads the
   card rows again.
2. Three limits end a wait, in three modules:
   - After 24 h, the next reply of the inbox bot says it in words
     (`server/host/long-waits.ts:3`, `team-messages.ts:370-377`).
   - Handed-off work parked on the person gets one reminder after 24 h and
     expires after 72 h (`server/runtime-coordinator.ts:44-46`,
     `server/runtime/runtime.ts:866-877`).
   - A card older than 7 days no longer rests on the person
     (`server/host/person-waits.ts:39-44`, `shared/today.ts:66`).

## 4. The data

### 4.1 Wire types that the server and the desktop share

| Type | Fields | Where |
|---|---|---|
| `REACTIONS` | 👍 👎 ❤️ 😂 🎉 👀, in the order clients show them | `packages/phone-protocol/src/reactions.ts:4` |
| `ReactionDelivery` | `started`, `queued`, `answered`, `noted`, `none` | `reactions.ts:10` |
| `Message.reactions` | `[{emoji, by, name?, at?}]` on the reacted line | `packages/phone-protocol/src/wire.ts:571-575` |
| `Message.reaction` | the emoji on the person's answer line, with `replyToId` and `sendId` | `wire.ts:576-579` |
| `CardAnswerer.via` | `"call"` or `"reaction"` | `wire.ts:430-432` |
| `TaskUsage` | `input`, `output`, `cachedInput?`, `costUsd: number \| null`, `turns`, `lastTurn?`, `context?` | `wire.ts:91-103` |
| `GroupThreadUsage` | `TaskUsage` + `lastSpeaker?{botId, name}`. Always present on a group frame, null when empty | `wire.ts:105-108`, `:838-839` |
| `turn.completed` | `{ok, stopReason?, cost?, denials?, usage?{input, output, cachedInput?}}` | `runtime-events.ts:61-70` |
| `InboxItem` | on a posted message: `kind`, `from`, `via?`, `origin?` (only when the person may open it), `replies?`, `assistant?`, `answers[]` | `packages/phone-protocol/src/inbox.ts:8-24` |
| `InboxTask` | on the inbox task, for that person only: `inbox`, `openAsks?`, `inboxChangedAt` | `inbox.ts:27-35` |
| `InboxRow` | `id`, `kind`, `tab`, `from`, `via`, `workingFor?`, `askedBy?`, `origin`, `text`, `at`, `unread`, `replies?`, `answers?`, `card?`, `secret?`, `signIn?`, `connector?` | `inbox.ts:43-68` |
| `InboxView` | `{botId, threadId, rows, anchor}`. Off a team, `botId` and `threadId` are null | `inbox.ts:73-78` |
| `ModelMenu` | `{current, engines: MenuRow[], unavailable?, localAlso?}` | `server/routes/internal-models.ts:16-52` |
| `TeamMapSnapshot` | `collaborations`, `queued`, `running`, ids and times only | `src/lib/team-map.ts:13-17` |
| People | `{email, name, role, you?, pictureUrl?, here?}` | `server/routes/team-owners.ts:90-97` |

### 4.2 HTTP routes

- `POST /api/threads/:t/messages/:m/reactions` (`server/routes/reactions.ts:18-19`).
- `GET /api/inbox`, `GET /api/inbox/count`, `POST /api/inbox/read-all`,
  `POST /api/inbox/:id/read`, `POST /api/inbox/:id/done`. Each POST answers
  with the whole new view (`server/routes/inbox.ts:17-45`). Answers to asks
  use `POST /api/threads/:t/respond`. Replies use the normal message send.
- Internal, with the turn's capability: `POST /api/internal/people/message`
  (`server/host/team-messages.ts:36`), `GET /api/internal/models?search=`
  (`server/routes/internal-models.ts:148-158`).
- `GET /api/team-map`, `GET /api/team/people`, `GET /api/bot-defaults?checker=1`.

### 4.3 Stored

| What | Where | Notes |
|---|---|---|
| Reactions | inside the message row (`server/store.ts:1236-1244`) | one entry for each person |
| Queued answers | `chat_followups`: `id, kind, owner_id, thread_id, send_id, status, payload` (`server/message-db.ts:328-332`) | a cancelled row stays as a tombstone with an empty payload (`:334-345`) |
| Thread usage totals | `task.usage` in `bots.json` (`server/store.ts:1805-1840`) | deferred save |
| Usage ledger | `<data>/usage/YYYY-MM.jsonl`, folder 0700, file 0600 (`server/usage-ledger.ts:103-151`) | no row id. Key `at\|threadId\|botId` (`:111-113`). No message text (`:1`) |
| Person inbox | `person-inbox.json` `{version, homes, items}` (`server/host/person-inbox.ts:29-62`) | 2,000 items, 30 days |
| Place inbox | `place-inbox.json` `{version, lines, seenAsks}` (`server/host/place-inbox.ts:23-46`) | 2,000 lines, 30 days |
| Team people | `team-people.json`, 500 people at most (`server/team-people.ts:12-22`) | |
| Thread folder | `cwd?: string \| null`: absent = not pinned yet, null = no folder (`server/store.ts:1853-1876`) | |
| Group folder | `group.cwd?`, and `pinnedCwd?` for each group thread (`store.ts:1878-1900`) | |
| Check before done | `<data>/check-work.json` (`server/host/check-work.ts:129-146`) | |
| Map layout | the browser's localStorage only (`src/components/TeamCanvas.tsx:176-206`) | never on the server |

### 4.4 In memory only: lost at a restart

| What | Where |
|---|---|
| The reaction stamp `lastStamp` | `server/reactions.ts:83-84` |
| The `message_person` hourly counter | `server/host/team-messages.ts:150-153` |
| The dedupe of @mentions: `toldThisTurn`, `handledTurns` (2,000 at most) | `team-messages.ts:160`, `:225`, `:260-263` |
| The assistant budget | `server/host/person-inbox.ts:325` |
| The remote rework count (6 hours) | `server/host/remote-teammate-handoff.ts:39`, `:85` |
| The last live usage figure | `server/index.ts:4912` |
| Presence | `server/team-presence.ts:61-62` |

## 5. The UI

- **Reactions.** A smiley in a bot bubble's action row, shown on hover,
  focus or a touch press of 450 ms (`src/components/MessageActions.tsx:34`,
  `:93-118`), opens a toolbar of six labelled buttons. Arrow keys, Home, End
  and Escape work (`src/components/Reactions.tsx:66-161`). Chips under the
  message: one for each emoji, with a count and the names. A viewer who may
  not write sees labels, not buttons (`:171-210`). The client updates at once,
  and the newest tap wins (`:32-62`). The person's answer line draws no
  bubble (`src/components/chat-bubble.ts:64-66`). In a room, the smiley shows
  only on a signed bot line (`src/components/RoomTextMessage.tsx:134`). An
  answered card says "· by reaction" (`src/components/ApprovalCard.tsx:468-469`).
- **Usage.** The bot figure is the trailing text of the "Usage" row of the
  chat's ⋯ menu, with a native `title` tooltip
  (`src/components/ChatMoreMenu.tsx:157-163`). A `title` on a span has no
  tooltip on touch or keyboard focus. The group pill is focusable and has
  an `aria-label` (`src/components/GroupUsageChip.tsx:28`). Thread picker
  rows use the same rules (`src/components/TaskPicker.tsx:54-66`).
- **The Inbox row** is the top row of the sidebar, with a count and a green
  dot while a bot works (`src/components/SidebarInboxRow.tsx`). A 404 from
  `/api/inbox` hides it and brings back the old "Active threads" tray
  (`src/state/inbox.ts:65`, `src/components/Sidebar.tsx:1291`).
- **The inbox panel** is on the right, 320 or 380 px, or wide, and a bottom
  sheet on a phone (`src/components/inbox/InboxPanel.tsx:156-174`). It shows,
  from the top (`:116-149`): pinned threads, search, one list of the lines
  that are not done (newest first), team fixes, active threads, finished
  threads (10 at most) and a closed Done section. It has no tabs (section 8.1).
- **Reading a line** shows "n of m", the bot's last text messages before the
  ask (8 at most), the line, earlier answers and the answer form
  (`src/components/inbox/InboxReading.tsx:61-105`). A single question takes
  picks, keys 1 to 9 and a note (`InboxQuestionAnswer.tsx`). After an
  answer the view moves to the next line (`InboxPanel.tsx:62-74`).
- **The inbox card** in the team inbox chat shows "N need you · M for your
  info" with the three newest asks and their buttons, under the anchor line
  (`src/components/inbox/InboxCard.tsx:24-28`, `:75-98`).
- **An inbox line in a chat** has a caption "From X · via Bot · in Thread"
  and the assistant's answer under it: "Your assistant answered … Reply to
  correct it." (`src/components/InboxLine.tsx:66-88`).
- **People.** A row of faces, 26 px, with a green dot for people here and
  your count of open asks. The labels say "Write to Cleo", "Your inbox:
  waiting on you, N". An admin sees "Invite someone"
  (`src/components/SidebarPeople.tsx`). A "Told Ben" chip in the sending chat
  (`src/components/TeammateChip.tsx`).
- **The team map.** It has department tiles with a Chief column and a
  members column, and hand-off curves with "Running" or "Queued" pills. Zoom
  goes from 0.3 to 1.5. A list "Who hands work to whom" shows 12 rows at
  most, and a composer sits at the bottom (`src/components/TeamCanvas.tsx:432-544`, `TeamMapPage.tsx:411-414`).
  The canvas is a focusable region with a polite live region (`:379`, `:537`).
- **Checks.** The new bot dialog shows one line about the checker's model
  (`src/components/NewBotDialog.tsx:229-238`). "Opened thread #T" and
  "#T replied" lines in the chat (`server/host/handoff-sent.ts:26`, `:48-55`).
- **Folders.** "New thread in a working folder…" in the bot row menu, with
  the bot's folder filled in (`src/components/Sidebar.working-folder.test.ts:57-74`).

## 6. The tests

| Test file | What it proves | What it does not test |
|---|---|---|
| `server/reactions.test.ts` | the rules of `react`, once for each change, withdraw, rollback, two people, feelings, rooms, cards, notes, names (real `Store`, fake `reply`) | two calls at the same time. Its fake `reply` refuses a cancelled sendId (`:27-28`), but the real path does not check tombstones (`server/index.ts:7117` is in `acceptDirectSend` only) |
| `server/reaction-delivery-lifetime.test.ts` | the races of one held send: clear, replace, another person, already started | the same races in a room |
| `server/reactions.e2e.test.ts` | the real server with a fake engine CLI: answer, prompts, once only, feelings, cards, rooms, no title | a clear on a card keeps the decision, a restart with a queued answer |
| `server/routes/reactions.test.ts`, `shared/reactions.test.ts` | the HTTP contract, the person from the session, the emoji forms | — |
| `src/components/Reactions*.test.ts`, `ChatView.reactions.test.ts` | the toolbar, chips, the newest tap, the viewer's key, the hidden answer line | the room action row |
| `server/usage-ledger.test.ts` | file modes, cleaning, NaN cache stored as 0, the parse cache, ranges, all groupings, CSV safety | two rows with one key, two processes |
| `server/group-thread-usage.test.ts`, `.e2e.test.ts` | reads only changed months, merges, last speaker, unknown cache, null for a new thread | a restart, keep-warm rows, an estimated cost |
| `server/drivers/openai-chat-cached-input.test.ts` | unknown and zero cache counts, cached above input | asserts a mixed turn as "complete" |
| `server/store.test.ts:888-920` | thread totals and the cache clamp | asserts the mixed cache sum as known (1010) |
| `src/lib/usage.test.ts`, `GroupUsageChip.test.ts`, `scripts/testing/usage-details-ui.e2e.test.ts` | chip and tooltip text, unknown and zero, a real browser reads the ⋯ menu | `usageSummary` as a whole, the group badge in a browser |
| `server/host/person-inbox.test.ts` | late assistant answers dropped, routing and copy, tabs, home moves, confined threads | the 2,000 cap, 30 days, a bad file, `keepOne`, the name match of `waitingFrom` |
| `server/host/team-messages.test.ts` | `message_person`, reply, 👍, refusals and the limit, tags, the assistant | the window after one hour, a restart, 409 for two names, a correction after an assistant answer |
| `server/host/place-inbox.test.ts` | live asks, one copy of an automation's question, closed threads, guests, the limit, restart | the 30-day prune and the line cap, a bad file |
| `server/host/person-waits.test.ts` | waiting from the card rows, a card of 8 days is left, notifications | — |
| `server/routes/inbox.test.ts` | scopes, 404, 405, 409 on Done for an ask, read-all | — |
| `server/place-inbox.e2e.test.ts` | desktop and one-person Cloud: one notification for each item, a second answer refused, a message line, hand-offs file no line, guests | — |
| `server/cloud-team-inbox.e2e.test.ts` | the team flow end to end: tell, reply, @mention, an approval copy, the assistant with a fake calendar, counts, leaving | the correction path, a duplicate after a restart |
| `server/host/representative*.test.ts`, `person-calendar.test.ts` | the gates before and after the model, the fence, 80 slots, only start and end leave the calendar | a calendar read error shown as "not connected" |
| `src/components/inbox/*.test.ts`, `src/state/inbox.test.ts` | one list and no tabs, read, allow, close, done, the reading view, old answers never undo a newer state | a failed reply, a late failure of read after done |
| `electron/place-inbox-watch.node-test.mjs`, `scripts/verify-place-inbox-rail.mjs` | the rail rules, the packaged app on a CI runner | the second runs on a side branch only (`docs/verification/inbox.md:35`) |
| `src/components/SidebarPeople.test.ts`, presence tests, `server/cloud-team-people.e2e.test.ts` | faces, order, labels, count, privacy of private chats, 410, 404, 400, 10 then 429 | the click actions, a restart |
| `src/lib/team-map.test.ts`, `TeamMapPage.edges.test.ts`, `server/team-map-api.test.ts`, `scripts/testing/team-canvas-ui.e2e.test.ts` | sections, one edge for each pair, ids only, move, reorder, persistence | queued edges on the server, a member who is not an admin |
| `server/routes/internal-models.test.ts`, `server/thread-aware-bots.e2e.test.ts:340-600` | the short list, refusal reasons equal, no fall back, report_back from a room refused | `model_selection` with no `report_back` from a room, the resume row after a failed thread |
| `server/checker-model.test.ts`, `server/checked-handoff.e2e.test.ts` | another provider only, exact limit, files from this conversation only, no local rework limit | — |
| `server/bot-cwd.test.ts`, `room-cwd.test.ts`, `task-cwd-api.test.ts` | validation, the data-folder boundary with links, pin once, room override | `assertRoomFolder` has no test |
| `server/room-turn-timeout.test.ts` (names only) | the deadline with a fake clock, five shapes of sleep, the registry | — |

Pattern to keep: the inbox unit tests use an in-memory store and a real file
in a temporary folder (`server/testing/team-inbox-fixture.ts:27`, `:49-85`).
That matches our rule: a fake driver and an in-memory store.

## 7. Ours compared

Ours today: `bot-protocol` has `ids.rs`, `message.rs` and `event.rs` (five
events, decision D20). `bot-core` has 15 lines. None of these features
exists yet. The table names where each one goes.

| Feature | Reference | Ours: crate and module | Notes |
|---|---|---|---|
| The six reactions, the delivery result | `packages/phone-protocol/src/reactions.ts` | `bot-protocol::reaction` | an enum with `answer() -> Option<Answer>` |
| Set, clear and answer | `server/reactions.ts`, `server/person-replies.ts` | `bot-core::reaction`, a runtime command | one transaction (section 8) |
| The meaning of 👍 in a prompt | `server/replies.ts:151-176` | `bot-core::prompt` | built from stored data |
| Usage on `turn.completed` | `runtime-events.ts:61-70` | `bot-protocol::event` (D20 `turn.completed`) | optional counts |
| Usage totals | `server/store.ts:1805-1840`, `server/usage-ledger.ts` | `bot-core::store`, a `turn_usage` table | P124 |
| The usage figure in the window | `src/lib/usage.ts`, `ChatMoreMenu.tsx` | `bot-desktop` (TypeScript) | one formatter |
| Place inbox | `server/host/place-inbox.ts`, `person-waits.ts` | `bot-core::attention`: a query over open requests, and a `news_line` table | no copy of a card |
| Inbox panel and row | `src/components/inbox/`, `src/state/inbox.ts` | `bot-desktop` | an `inbox.changed` event, not polling |
| `message_person` | `server/drivers/agents-person-tools.ts`, `team-messages.ts` | `bot-engine` tool (step 12), refusals in `bot-core` | a typed refusal enum |
| The answer that comes back | `server/host/relayed-turn.ts` | `bot-core`, the queue of P34 | information authority |
| Team inbox, people, presence, the assistant | `person-inbox.ts`, `team-presence.ts`, `representative.ts` | none: no team mode (D10) | T1 |
| Team map | `TeamMapPage.tsx`, `server/index.ts:14333-14361` | `bot-desktop`, edges from `bot-core` events | needs departments |
| `list_models` | `server/routes/internal-models.ts`, `own-threads.ts` | `bot-engine` tool, refusal function in `bot-core` | uses the registry of step 4 |
| The rework limit | `server/host/remote-teammate-handoff.ts:38` | `bot-core` assignment runtime (step 13) | for every teammate, stored |
| The checker's other provider | `server/checker-model.ts` | `bot-core`, by a capability of the instance | not by driver kind |
| A thread's folder | `server/store.ts:1853-1876`, `server/bot-cwd.ts` | `bot-core::store`, a three-state type | P192 |
| A group's folder | `server/room-cwd.ts`, `server/room-folder.ts` | rooms: no step | P229 |
| Room turn deadline | `server/room-turn-timeout.ts` | rooms: no step | P224 |

## 8. Where we can be better

Each point says why. The T-numbers at the end of the file group them into
proposals.

1. **Never pass model text as the person's answer.** When the person tells
   the Chief "tell Cleo Friday works", the Chief's `message_person` text
   becomes the answer, stored `by: "person"`, and opens the asking bot's turn
   as "Ben replied…" (`server/host/team-messages.ts:184-185`, `:171-178`,
   `server/host/person-inbox.ts:367-369`). Reply and 👍 pass the person's own
   words. Reason: AGENTS.md says "Text that opens a delegated turn is built
   from stored data, never from model output". Mark the answer as relayed by
   the bot, or take the person's own line as the source.
2. **The inbox reads the open request. It never copies it.** The place inbox
   reads each ask live (`place-inbox.ts:2-3`, `:144-193`). The team inbox
   copies the card, keeps the copy in step with a subscription and maps
   answers back in four places (`person-inbox.ts:404-446`, `server/index.ts:3835`,
   `:4824`, `:11944`). Reason: one row, one state and one answer path. The
   copy is the source of stale copies and double answers.
3. **One row and one transaction for an inbox line.** The reference appends
   the chat line, then saves the item in another file
   (`person-inbox.ts:305`, `:316`). Reason: AGENTS.md "Every state change in
   the runtime writes the row and its event in one transaction". A crash
   between the two leaves a line that cannot be answered.
4. **One transaction for a reaction change.** The reference writes the
   reaction, delivers, then reads again and withdraws or rolls back
   (`server/reactions.ts:125`, `:139-152`). One command can update the
   reaction, cancel the old queued answer and queue the new one in one
   SQLite transaction. Reason: the race tests of
   `server/reaction-delivery-lifetime.test.ts` then guard a state that cannot
   happen. A `reactions` table with the key (message, person) makes "one for
   each person" a schema rule.
5. **A store sequence for the sendId, and a field for the last answer.** The
   reference uses a clock stamp in memory (`reactions.ts:83-84`) and scans the
   whole transcript on each reaction (`:86-90`). Reason: a store sequence
   survives a restart, and a field is one read.
6. **One usage table, one cache rule.** A `turn_usage` row for each turn,
   written in the turn-end transaction, with `cached_input: Option<u64>`,
   `cost_source` (reported or estimated) and a row kind (turn, keep-warm,
   compaction, helper). The bot figure and the group figure are one query.
   Reasons:
   - the reference has two totals that disagree on the cache, the cost and
     which rows count (section 3.3).
   - one save is deferred (`server/registry-save.ts:54-55`).
   - a NaN becomes a known 0 (`server/usage-ledger.ts:123`).
   - keep-warm rows change the turn count of a group (`server/index.ts:5128-5141`).
7. **No fall back from the final usage to a live event.** If `turn.completed`
   has no usage, book "not reported". Reason: the reference's own type says
   the live event "must never be summed" (`runtime-events.ts:67-69`), but
   `server/index.ts:6696` uses it as the total.
8. **One waiting count, computed in `bot-core`.** Reason: five surfaces count
   five ways (section 3.14), and the page promises one number (mdx:97).
9. **One limit type for a wait.** Reason: three limits in three modules
   (section 3.14, item 2). This extends P224.
10. **Store the limits and the dedupe.** The hourly limits, the assistant
    budget, the @mention dedupe and the remote rework count live in memory
    (section 4.4). Reasons:
    - a restart lifts a limit that exists to stop two bots that ping-pong.
    - after a restart, or after 2,000 newer turns, a reaction on an old reply
      that tags @Ben patches the message, and `turnSettled` delivers the tag
      again with a new notification (`team-messages.ts:259-263`, `:286-294`).
      The reference already has a stored key, `reached`, that it does not use
      here (`person-inbox.ts:484-486`).
11. **Enforce the rework limit for every teammate, and store the count with
    the assignment.** Reason: the page promises a refusal after four reworks
    (mdx:119). The code has one only for a teammate on another server, in
    memory (`remote-teammate-handoff.ts:36-38`, `:85`). A local checker loop
    has no end (`server/checked-handoff.e2e.test.ts:107-123`).
12. **The check loop is runtime state, not prompt text.** Reason: the
    template's 3 rounds and "Not checked:" depend on the model
    (`src/lib/ready-bots.ts:190-197`). The reference wrote an enforced loop
    once already (`server/host/check-work.ts`). Two paths do one job.
13. **Mark a self-opened thread by a stored origin.** Reason: a person's line
    in the thread lifts "cannot open more"
    (`server/thread-aware-bots.e2e.test.ts:354-358`, `server/host/self-threads.ts:10-12`).
    A stored field follows our rule on stored data. This extends P186.
14. **One rule for a room.** Refuse `model_selection` from a room too, or say
    in the docs that only `report_back` is refused. Reason: the code refuses
    only `report_back` (`server/index.ts:13880`). The page says both (mdx:115).
15. **The list and the refusal come from one typed function.** `list_models`
    and `start_thread` share one check so that their words are equal
    (`server/host/own-threads.ts:1-2`, `:40`). An enum of reasons
    (signed out with `connect`, unavailable, turned off, CLI too old) makes
    that a compile-time fact.
16. **Pick the checker's provider by a capability of the instance.** Reason:
    `server/checker-model.ts:12` compares `driverKind`, and one driver kind
    can serve many providers. AGENTS.md: gate by capability, never by a name.
17. **Typed refusals.** `message_person` returns a status and a sentence
    (`team-messages.ts:129-207`). A missing room folder throws an `Error`
    (`server/room-folder.ts:7`). Reason: AGENTS.md "The runtime returns typed
    refusals". Tests then compare variants, not words.
18. **A folder pin is a three-state type**: not pinned, no folder, a folder.
    Reason: the reference relies on the difference between `undefined` and
    `null` (`server/store.ts:1853-1900`). Store the real path at validation,
    because `validateBotCwd` keeps a link as given (`server/bot-cwd.ts:16`)
    and `sharedProjectFolder` resolves it (`:44-53`).
19. **The map keeps the runtime state on an edge, and gets it by events.**
    Reasons: "waiting" and "needs input" show as "Running"
    (`server/runtime-coordinator.ts:560-561`), which hides that the person
    blocks the work (assignment-runtime A7). The 3 s poll lags and scans all
    open work each time (`TeamMapPage.tsx:311-327`).
20. **Name the person who acts from the turn, not from the last writer.**
    Reason: in a shared chat where two people write in one turn, "from Cleo"
    can name the wrong person (`team-messages.ts:122-126`). The reference
    already computes the real requester for permissions
    (`server/host/acting-person.ts:112-139`).
21. **Spend the assistant budget only on model calls, and allow a
    correction through the Chief.** Reasons: statements use the budget today
    (`person-inbox.ts:328-330`), and `waitingFrom` skips answered lines
    (`:478-481`), so the page's "replying corrects it" fails there.
22. **Show the errors.** The inbox reply form has no catch
    (`src/components/inbox/InboxAnswer.tsx:80-85`). The rail watcher treats a
    401 like "no inbox" (`electron/place-inbox-watch.mjs:30`, `:41`).
    Reason: a lost reply is lost work, and a signed-out place loses its dot.
23. **Name the four "inboxes" apart.** The person inbox, the place inbox,
    hand-off file folders (`server/host/handoff-inbox.ts`) and mail triage
    (`server/host/inbox-triage.ts`) share one word. Reason: review and
    search. For example `attention`, `handoff_files`, `mail_triage`.
24. **Keep these guards of the reference.** The person comes from the
    session, never the body (`server/routes/reactions.ts:11-12`). The bot and
    thread come from the capability (`team-messages.ts:328-329`). Names in a
    prompt note are one line (`reactions.ts:50-52`). Quoted text is fenced as
    untrusted (`server/replies.ts:164-168`). The answer carries information
    authority (`relayed-turn.ts:23-24`). The assistant has gates before and
    after the model (`representative.ts:44-74`). A hand-off never shares the
    data folder, also through links (`bot-cwd.ts:38-54`). No fall back to
    another model (`own-threads.ts:44-49`).

### 8.1 The page and the code disagree

| Page says (mdx line) | Code at `96ff84455` | Where |
|---|---|---|
| "the usage chip in a bot's chat header" (25) | a row of the chat's ⋯ menu | `src/components/ChatMoreMenu.tsx:157-163` |
| "A missing cache count is not treated as zero" (31) | true for the group badge and the client sum, false for the bot thread total | `server/store.ts:1817-1821` |
| group cost "sums only reported costs" (45) | the badge sums estimates too, under "Reported costs". The word "reported" can mean "present" | `server/group-thread-usage.ts:18`, `en.json:6858` |
| the Team map's "Who reports to whom" and drag onto a person (80) | removed | commit `103f1c82d` (2026-11-11) |
| three tabs: Needs you, For your info, Done (95) | one list and a Done section. The server still computes `tab` | commit `bef6fd7c4` (2026-11-02), `InboxPanel.dom.test.ts:55-58`, `person-inbox.ts:255-258` |
| the answer goes back "to the bot that asked, which carries on" (91) | in a room, a relay line that starts no turn | `person-inbox.ts:362-364`, `server/board/wiring.ts:105` |
| "replying corrects it" (99) | through Reply and 👍 only, not through the Chief | `person-inbox.ts:478-481` |
| "your own Chief of Staff" (78, 84) | the app no longer offers one. The code still prefers one | `docs/team-cloud.md:916-918`, `person-inbox.ts:154` |
| "These threads can't be opened from a group chat" (115) | only `report_back` is refused | `server/index.ts:13880` |
| "a thread opened this way can't open more of its own" (115) | a person's line in it lifts the rule | `thread-aware-bots.e2e.test.ts:354-358` |
| "the app refuses more than four reworks" (119) | only to a teammate on another server | `remote-teammate-handoff.ts:36-38`, `checked-handoff.e2e.test.ts:107` |
| the same count on the app icon and the tab (97) | five rules | section 3.14 |

The reference's own `docs/team-cloud.md:1019-1020` also says that
`message_person` does not exist off a team. The code and an e2e test show
that it does (`team-messages.ts:333-338`, `server/cloud-team-people.e2e.test.ts:105-116`).

### 8.2 Problems of changelog.md section 5 that the reference has here

| Problem | Here | Where |
|---|---|---|
| A turn or a wait that does not end | Fixed for the room turn: progress, sleep, the tool limit. Waits hold the clock with no limit (P224). Three wait limits in three modules. A local checker loop has no limit | `room-turn-timeout.ts:9-12`, `:51-59`, `:149-164`, section 3.14, `checked-handoff.e2e.test.ts:107-123` |
| The same work done two times, or lost | Fixed for reactions (sendId, tombstones, the queueing race `6f18a3752`) and for one decision for each card (`answeredIn`, a second `/respond` refused). Still present: the @mention after a restart, the line and the item in two stores, a reply error with no message | `reactions.ts:30-32`, `:139-146`, `place-inbox.e2e.test.ts:126-128`, `team-messages.ts:259-263`, `:286-294`, `person-inbox.ts:305`, `:316` |
| "Busy" and races between bots | Fixed: busy is the state of the thread, a relayed answer to a busy thread is queued, a late assistant answer is dropped. The room stall registry is safe while one member turn runs on one room thread (section 3.12). Present: the sender is the last writer | `server/index.ts:7060`, `relayed-turn.ts:25-29`, `person-inbox.ts:339-341`, `team-messages.ts:122-126` |
| Usage and cost numbers | Fixed: the turn's own cost for Claude (v0.1.90), cache reads in ACP input (v0.1.92), cached input for chat API models (v0.1.170), keep-warm at its own cost (v0.1.178). Present: the cache rule of the thread total, NaN as 0, estimates under "Reported", keep-warm rows in the group turns, the live event as the total | `claude-cost-history.ts:40-46`, `acp/prompt-usage.ts:13-19`, `openai-chat.ts:130-136`, `claude-keepwarm.ts:85-99`, section 3.3 |
| A file written over after a failed read | Present: both inbox files start empty after a bad read, and the next save writes over them | `person-inbox.ts:134-147`, `place-inbox.ts:98-113` |
| State lost at a restart | Present: section 4.4. Fixed: queued reaction answers, inbox items, Check before done | `steer-queue.ts:140`, `check-work.ts:129-146` |
| A feature added, then removed | The three inbox tabs (`3ff877878` 2026-10-28, removed `bef6fd7c4` 2026-11-02). "Who reports to whom" (`b0a59c7bd`, removed `103f1c82d`). A finished hand-off filed an inbox line (v0.1.153), then stopped. The inbox in the thread picker (v0.1.79), replaced by one inbox for each person (v0.1.130). Reactions in rooms (2026-08-13), taken out of the hover bar (2026-08-30), back as answers (2026-10-21), from git log | `place-inbox.ts:4-5`, `:100-101`, `docs/verification/sidebar-attention.md:3-4` |
| A secret or an access right in the wrong place | Fixed. Only busy times leave the calendar. The assistant leaves out notes of restricted bots. Pictures go to members only. Presence never names a private chat. The map sends ids only. A hand-off never shares the data folder | `person-calendar.ts:3`, `:17-27`, `person-inbox.ts:278`, `team-owners.ts:99-114`, `team-presence-host.ts:5-7`, `server/index.ts:14333`, `bot-cwd.ts:38-54` |
| Sign-in to an engine | Fixed for a second opinion: no fall back to the bot's own model when a model cannot run | `server/thread-model.ts:28-31`, `own-threads.ts:44-49` |
| One slow or stuck part blocks the others | Fixed on the map: departments show after 1.5 s even when the computers request hangs | `TeamCanvas.tsx:91-92`, `:217-220` |

## 9. Not verified

- The "Cloud stable default" folder (mdx:137). The readers found a folder
  for each thread only (`server/store.ts:1853-1900`). Which threads
  `unpinTaskCwd` clears on a Cloud is decided in `server/cloud-owner.ts`,
  which nobody read. `pinTaskCwd({none: true})` has no caller outside tests.
- A 👎 after a 👍 on an approval card, on the real path. By reading it
  returns "none" (section 3.2, item 10). Nobody ran it.
- That a restart followed by a reaction on an old reply delivers an
  @mention again. Found by reading (`team-messages.ts:259-263`, `:286-294`,
  `server/store.ts:1049-1054`, `:1248`). Nobody ran it.
- That no path runs two member turns of one room thread at the same time.
  If one does, the stall registry replaces a handler
  (`room-turn-timeout.ts:228-233`).
- That keep-warm runs on a group thread at all. Its gate was not read. If it
  does, its rows change the group badge (section 3.3).
- Whether any driver ends a turn with live events but with no usage on
  `turn.completed` (`server/index.ts:6696`).
- Whether an approval closes at a turn timeout, not only on a stop
  (`server/index.ts:4865-4875`).
- That the opener resumes with a "failed" row when its own thread fails. The
  row exists (`server/host/handoff-sent.ts:56-59`). The test checks only the
  node and the busy state (`thread-aware-bots.e2e.test.ts:595-600`).
- Whether the server refuses a department move or delete from a member who
  is not an admin. The map only hides the controls.
- The changelog rows v0.1.71, v0.1.125, v0.1.135 and the OpenRouter part of
  v0.1.86 (usage) were not checked in the code.
- The 72 h expiry of parked work from the inbox's point of view: the runtime
  tests were not read.
- Whether `DATA_DIR` in `server/host/person-waits.test.ts` is a temporary
  folder under the test runner (`server/config.ts:679` not followed).
- Six test files were read by their test names only (section 2.2).
- The notification "on your computer and your phone" for each line
  (mdx:84) was not traced. The phone is out of scope.
- `shared/person-mention.ts` (the tag rules), the routing of "reports to"
  and the department routes belong to the `team-structure` and `mentions`
  research, and were not read here.
