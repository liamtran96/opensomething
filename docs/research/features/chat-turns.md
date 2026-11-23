# Chat turns: one turn from send to reply, the parts that the first study did not read

Feature row of [`../features.md`](../features.md): `chat-turns.md`, "Chat
turns and independent tasks". Gap 3 of batch 2 in
[`../progress.md`](../progress.md), the capability for step 7 of
[`../../plan.md`](../../plan.md). Documents of the reference:
`docs/verification/chat-turns.md` and `docs/verification/chat-ui.md`.

Read at commit 3aec210 (2026-11-23) of the reference project. All paths are
in the reference project unless a line says "ours". Nobody opened the
`enterprise/` directory.

This file adds to these files and does not repeat them:

- [`../turn-flow-comparison.md`](../turn-flow-comparison.md) has the happy
  path, the events of the chat driver, the failure row and the chat UI. Its
  section 6 lists four open points. This file closes two of them: the
  wrappers around `sendTurn`, and when "busy" starts. The other two stay
  open (a test of the full event order of a driver turn, and the CSS of
  the bubbles).
- [`queue-and-steer.md`](queue-and-steer.md) has admission, the queue and
  steer. This file names a call into them and stops there.
- [`../driver-contract.md`](../driver-contract.md) has the driver methods.

The two files above read the same commit, 3aec210. Their line numbers
agree with this file.

## 1. In short

A **turn** is one run of the engine: the server gets one message from a
person, the engine works, and the bot replies. The earlier study followed the
events of a turn. This study follows the server code around those events.
It answers four questions:

- What does the server check before it calls the engine?
- How does the server mark a conversation as busy?
- How does the server protect the turn against a late Stop?
- How does the turn end when the engine does not end it?

The reference project needs a lot of code for this. A turn can fail in many
places before the engine sees it. A person can press Stop at any time. An
engine can send its last event before the server knows the turn identifier.
The server also runs more than one conversation of one bot at the same time.

Special terms, explained one time:

- **Task** or **thread**: one conversation of one bot. A bot has a list of
  tasks. Each task has its own transcript, its own engine session, its own
  model and its own approval level. The code uses both words for the same
  thing.
- **Selected task**: the task that the window shows (`bot.threadId`). It is
  navigation only, with one exception (see the edge case at the end of 3.1).
- **Busy**: a turn runs on this thread now. In the reference project, busy
  is true when the task's `busy` flag is true or when a dispatch claim exists
  for the thread (`server/index.ts:2179-2181`).
- **Activity**: a word for the state of a task. The values are `working`,
  `waiting-on-you`, `idle`, `no-signal`, `dead` and `parked.computer`
  (`packages/phone-protocol/src/wire.ts:88`). The store derives `busy` from
  the activity (`server/store.ts:122`).
- **Dispatch claim**: a record in memory that says "a turn is starting on
  this thread". The server writes it before the first `await` of a turn and
  deletes it after the engine accepts the turn (`server/index.ts:7658`,
  `:8376`). It has a phase, `setup` or `dispatching`.
- **Generation**: a random identifier that the server makes for each turn
  (`dispatchClaimId`, `server/index.ts:7623`). Late callbacks compare their
  generation with the current one. A callback of an old turn then does
  nothing to a new turn.
- **Wrapper**: a function around the engine call `sendTurn` that adds one
  behaviour. The server stacks five of them (3.3).
- **Watchdog**: a timer per thread that stops a turn after a period with no
  events (`server/turn-watchdog.ts`).
- **Quarantine**: a short window after a cancelled start. In this window the
  server ignores events from the engine on that thread
  (`server/turn-dispatch-guard.ts:109-162`).
- **Room**: a group chat with several bots. A **member turn** is the turn
  of one bot in a room. A **hop** is a turn that starts because another bot
  named this bot with `@`.
- **Place** (the code also says **surface**): where a turn acts. The values
  are `cloud`, `vm`, `local` and `browser` (`wire.ts:69`). **Works on** is
  the setting of the bot. A **pin** is the setting of one task.
- **Saved steps**: a recording of desktop actions that the server can play
  again without the engine (3.7).

## 2. Files read completely

Eight subagents read the files in groups, one subagent for each group. I
checked the key findings against the code myself. The checked lines are
listed in section 9.

### Group 1: direct send and the start of `beginTurn`

| File | Lines |
|---|---|
| `server/direct-send.ts` | 31 |
| `server/live-turns.ts` | 30 |
| `server/internal-turns.ts` | 15 |
| `server/turn-route.ts` | 131 |
| `server/turn-route.test.ts` | 228 |
| `server/turn-settings.ts` | 141 |
| `server/turn-settings.test.ts` | 103 |
| `server/turn-context.ts` | 81 |
| `server/turn-context.test.ts` | 228 |
| `server/turn-resources.ts` | 116 |
| `server/turn-resources.test.ts` | 144 |
| `server/message-text.ts` | 6 |
| `server/send-idempotency.ts` | 111 |
| `server/host/dispatch-claims.ts` | 46 |
| `server/bot-thread-limits.ts` | 36 |

### Group 2: the wrappers around `sendTurn`

| File | Lines |
|---|---|
| `server/turn-dispatch-guard.ts` | 178 |
| `server/turn-dispatch-guard.test.ts` | 227 |
| `server/quick-model-fallback.ts` | 188 |
| `server/quick-model-fallback.test.ts` | 208 |
| `server/engine-prestart.ts` | 147 |
| `server/engine-prestart.test.ts` | 222 |

### Group 3: saved steps

| File | Lines |
|---|---|
| `server/saved-steps/computer-client.ts` | 69 |
| `server/saved-steps/dispatch.ts` | 303 |
| `server/saved-steps/driver-wire.ts` | 115 |
| `server/saved-steps/journal-tap.ts` | 70 |
| `server/saved-steps/journal.ts` | 144 |
| `server/saved-steps/key.ts` | 39 |
| `server/saved-steps/replay.ts` | 104 |
| `server/saved-steps/resolve.ts` | 159 |
| `server/saved-steps/rules.ts` | 320 |
| `server/saved-steps/saved-steps.ts` | 139 |
| `server/saved-steps/screen-words.ts` | 129 |
| `server/saved-steps/store.ts` | 106 |
| `server/saved-steps/dispatch.test.ts` | 827 |
| `server/saved-steps/saved-steps.test.ts` | 459 |
| `server/saved-steps/replay.test.ts` | 226 |
| `server/routes/saved-steps.ts` | 19 |
| `server/routes/computer-journal.ts` | 24 |
| `server/drivers/chat-tool-approval.ts` | 122 |
| `server/bot-folder.ts` | 87 |
| `server/atomic.ts` | 142 |
| `server/local-computer-proxy.ts` | 51 |
| `server/testing/saved-steps-fixtures.ts` | 41 |
| `src/components/SavedStepsChip.tsx` | 36 |
| `src/components/SavedStepsRow.tsx` | 37 |

### Group 4: the end of a turn, busy and the outcome

| File | Lines |
|---|---|
| `server/turn-outcome.ts` | 157 |
| `server/turn-outcome.test.ts` | 181 |
| `server/turn-watchdog.ts` | 281 |
| `server/turn-watchdog.test.ts` | 743 |
| `server/turn-clock.ts` | 48 |
| `server/turn-clock.test.ts` | 78 |
| `server/turn-clock.e2e.test.ts` | 84 |
| `server/turn-continuation.ts` | 88 |
| `server/turn-continuation.test.ts` | 123 |
| `server/turn-log.ts` | 17 |
| `server/turn-log.test.ts` | 19 |
| `server/cancelled-turn.e2e.test.ts` | 134 |
| `server/claude-turn-failures.e2e.test.ts` | 189 |
| `server/person-stop.e2e.test.ts` | 103 |
| `server/crash-guard.ts` | 128 |
| `server/host/idle-threads.ts` | 50 |
| `server/host/person-waits.ts` | 151 |
| `server/host/setup-recovered.ts` | 47 |
| `server/job-view.ts` | 180 |

### Group 5: tasks and parallel threads

| File | Lines |
|---|---|
| `server/task-record.ts` | 47 |
| `server/store-forks.ts` | 64 |
| `server/group-task-state.ts` | 61 |
| `server/routes/tasks.ts` | 450 |
| `server/tasks.test.ts` | 440 |
| `server/independent-task-store.test.ts` | 674 |
| `server/routes/fork-request.ts` | 6 |
| `server/routes/bulk-delete.ts` | 14 |
| `server/thread-title.ts` | 91 |
| `server/thread-title-generate.ts` | 34 |
| `server/thread-presence.ts` | 61 |
| `server/main-thread.ts` | 31 |
| `server/registry-save.ts` | 76 |
| `packages/phone-protocol/src/task-provenance.ts` | 33 |
| `shared/wire.ts` | 1 |
| `docs/verification/chat-turns.md` | 340 |
| `docs/verification/chat-ui.md` | 359 |
| `docs/runtime-contract.md` | 143 |
| `docs/plans/2026-09-02-bot-concurrency.md` | 64 |

### Group 6: room turns

| File | Lines |
|---|---|
| `server/room-round-turns.ts` | 57 |
| `server/room-turn-level.ts` | 22 |
| `server/room-turn-level.test.ts` | 37 |
| `server/room-turn-end.ts` | 12 |
| `server/room-turn-end.test.ts` | 28 |
| `server/room-turn-timeout.ts` | 189 |
| `server/room-turn-timeout.test.ts` | 334 |
| `server/member-turn.ts` | 27 |
| `server/member-turn.test.ts` | 33 |
| `server/agents-turn.ts` | 100 |
| `server/agents-turn.test.ts` | 140 |
| `server/room-member-lock.ts` | 58 |
| `server/room-member-lock.test.ts` | 67 |
| `server/room-parallel-threads.e2e.test.ts` | 104 |
| `server/room-chat-wait.e2e.test.ts` | 246 |
| `server/room-reply.ts` | 42 |
| `server/host/room-transcript.ts` | 78 |
| `server/same-name-mentions.ts` | 86 |
| `server/room-holds.ts` | 168 |
| `docs/superpowers/specs/2026-08-19-configurable-room-turn-timeout-design.md` | 111 |

### Group 7: the place of a turn, pictures and video

| File | Lines |
|---|---|
| `server/turn-images.ts` | 279 |
| `server/turn-images.test.ts` | 402 |
| `server/turn-video.ts` | 110 |
| `server/turn-video.test.ts` | 117 |
| `server/surface.ts` | 356 |
| `src/components/PlaceChip.tsx` | 200 |
| `src/components/PlaceChip.test.ts` | 200 |
| `src/components/WorksOnGrid.tsx` | 87 |
| `src/components/FailedTurnRow.place.test.ts` | 130 |
| `src/lib/place.ts` | 52 |

### Group 8: the task UI, busy and Stop

| File | Lines |
|---|---|
| `src/components/TaskPicker.tsx` | 494 |
| `src/components/TaskPicker.test.ts` | 125 |
| `src/components/TaskPicker.visibility.test.ts` | 171 |
| `src/components/SidebarThreadRow.tsx` | 420 |
| `src/components/SidebarThreadRow.test.ts` | 760 |
| `src/components/SidebarActiveThreads.tsx` | 44 |
| `src/components/ThreadConcurrencySettings.tsx` | 44 |
| `src/components/ThreadConcurrencySettings.test.ts` | 34 |
| `src/components/ModelPickerBusyMenu.tsx` | 25 |
| `src/lib/stop-turn.ts` | 106 |
| `src/lib/stop-turn.test.ts` | 93 |
| `src/lib/turn-tail.ts` | 29 |
| `src/lib/turn-tail.test.ts` | 68 |
| `src/state/new-task-once.ts` | 26 |
| `src/state/new-task-once.test.ts` | 69 |
| `src/state/thread-navigation.ts` | 155 |
| `src/state/thread-navigation.test.ts` | 86 |
| `src/state/turn-status.ts` | 123 |
| `src/state/turn-status.test.ts` | 112 |
| `src/state/stop-turn-store.test.ts` | 106 |
| `shared/client-cancel.ts` | 79 |
| `server/person-stops.ts` | 70 |
| `src/lib/room-threads.ts` | 79 |
| `src/lib/bulk-select.ts` | 90 |

### Large files, read in ranges

`server/index.ts` has 15,276 lines. The subagents read these ranges
completely:

- 815-835, 1476-1492, 1640-1660, 1820-1900, 2020-2049, 2160-2360
- 3048-3062, 3466-3512, 3705-3716, 3780-3790, 4000-4010, 4048-4431
- 4530-4561, 4910-5060, 5094-5100, 5190-5372, 5930-5975
- 6255-6927, 7030-8521 (all of the direct send and all of `beginTurn`)
- 8545-8560, 9424-10479 (all of the member turn), 10780-10869
- 11395-11420, 11612-11630, 11750-11785, 11855-11885
- 13910-13930, 14330-14341, 15048-15066, 15124-15135, 15198-15212

Other ranges:

- `server/store.ts` (2,265 lines): 25-335, 422-432, 505-562, 630-760,
  832-862, 945-1200, 1600-1720, 1785-1852, 1974-2265.
- `server/routes/bot-messages.ts` (872 lines): 170-374 and 795-872.
- `packages/phone-protocol/src/wire.ts` (1,000 lines): 69, 80-200, 300-312,
  390-433, 439-572, 605-650, 800-868.
- `server/config.ts`: 40-70, 262-290, 575-595, 888-905.
- `server/harness/bus.ts`: 75-100. `server/contracts.ts`: 35-101.
- `server/host/skills-library.ts`: 68-81, 350-389.
  `server/skill-share.ts`: 76-190.
- `server/message-db.ts`: 220-250, 443-480, 648-680.
- `server/drivers/chat-mcp-tools.ts`: 77, 85, 148-175, 255-330.
  `server/mcp-bridge.ts`: 220-245, 350-362, 455-490.
- `packages/phone-protocol/src/place-view.ts`: 1-60.
- `src/state/store.tsx` (3,285 lines): 165-305, 720-780, 1730-1750,
  2030-2100, 2725-2745, 3135-3215.
- `src/components/ChatView.tsx`: 820-830, 864-872, 1010-1035, 1126-1133.
  `src/components/Composer.tsx`: 405-460. `src/lib/live-events.ts`: 120-150.
- `DESIGN.md` (420 lines): 1-66, 171-211, 256-370.
- `scripts/mcp-server.ts`: 755-800, 1055-1100.

## 3. How it works

### 3.1 From the HTTP request to the start of a turn

The route is `POST /api/bots/:id/messages`
(`server/routes/bot-messages.ts:199-371`).

1. The route checks the body. It refuses a body that is not a JSON object,
   a text with a NUL byte, and an empty text with 400
   (`bot-messages.ts:203-235`, `server/message-text.ts:2-5`). **The route
   sets no limit on the length of the text.**
2. The route finds the bot (404 if it does not exist) and the thread. A
   `threadId` must match `^[\w-]+$`. With no `threadId`, the route uses the
   selected task (`bot-messages.ts:236-242`).
3. The client can send a `sendId`. It must match `^[A-Za-z0-9_-]{16,80}$`
   (`server/send-idempotency.ts:4-12`). The server makes one for a phone
   that sends none (`bot-messages.ts:268-269`).
4. The server resolves the sender from the session, never from the body
   (`server/index.ts:815-819`, `wire.ts:410-418`). A request from the local
   machine with no session has no sender.
5. `acceptDirectSend` (`server/index.ts:7123-7257`) does these steps in
   order:
   1. It checks three typed refusals (`directSendRefusal`,
      `server/index.ts:7111-7121`): the bot moved (409 `moved`), the budget
      is spent (409 `spend_cap`), or the task does not exist (409).
   2. It joins two sends with the same `sendId`. A second caller with the
      same text shares the first promise. A different text gives 409
      "sendId already belongs to another message"
      (`send-idempotency.ts:43-65`). A stored row with the same `sendId`
      returns that row as the receipt (`server/index.ts:7138-7151`).
   3. It waits until the server reads the engine list (`server/index.ts:7161-7169`).
   4. It reads the task again, because the task can change during the wait
      (`server/index.ts:7170-7174`).
   5. It refuses a message to a paused bot, and it handles a typed "stop"
      command (`server/index.ts:7176-7179`).
   6. If the thread is busy, admission decides between steer, queue and
      restart (`server/index.ts:7180-7253`). See
      [`queue-and-steer.md`](queue-and-steer.md).
   7. If the thread is not busy, it calls `startOrQueueDirectMessage`
      (`server/index.ts:7075-7099`). Admission can still queue the message
      because of the limit of the bot or a room turn. Otherwise the server
      calls `startTurn`.
6. The route answers 202 with the receipt (`bot-messages.ts:362`). The turn
   runs in the background.

Edge case: `beginTurn` uses the selected task when the caller gives no
thread (`server/index.ts:7469`). The comment of the select route says
"navigation only" (`server/routes/tasks.ts:249`). These two statements do
not agree.

### 3.2 `beginTurn`: the synchronous part

`startTurn` calls `beginTurn` (`server/index.ts:7424`). The first part has no
`await` from line 7466 to line 7680. I checked this with a search. So no
other request can run between a check and the claim that follows it.

1. The server checks these refusals, in this order. Each one is an `Error`
   with a `status` and sometimes a `code` (`server/index.ts:7466-7531`):
   1. Maintenance or a move of the workspace runs.
   2. The bot does not exist (404).
   3. The bot is held or paused (409).
   4. An approval grant is still pending (409 `settling`).
   5. The provider account changes (409 `settling`).
   6. The budget or the usage cap is spent.
   7. The cloud computer changes (409 `settling`).
   8. **The thread is busy**: 409 `thread_busy`, "this thread is already
      working — interrupt it first" (`server/index.ts:7504`).
   9. **A room turn holds the bot**: 409 `thread_busy`, "the bot is already
      working in a channel — wait for it to finish" (`:7505-7507`).
   10. **The bot is at its limit of threads**: 409 `thread_limit`
       (`:7508-7510`).
   11. The engine instance does not exist, or a policy refuses it (409).
   12. A guest thread needs an engine with confined guest turns (409
       `guest_engine`).
2. It reads the pictures and the video from the text (3.8).
3. It chooses the model. A short, simple chat line can go to a faster model
   of the same provider (3.4).
4. **It stores the user row** (`server/index.ts:7580-7596`). The row has
   `role: "user"`, `kind: "text"`, the text, `sendId`, `sender`, `peerAsk`,
   `automated` and other optional fields. An edit makes a new branch
   instead (`:7574-7579`). A card continuation makes a row in memory only
   and does not store it (`:7581-7582`).
5. Typed words can answer an open question of the coordinator. The turn then
   ends with no engine call (`:7599-7605`).
6. It makes the generation and sets `requestPending: true` on the user row
   (`:7623-7654`).
7. **It sets the dispatch claim** with phase `setup` (`:7658`). From now on
   `threadBusy` is true.
8. **It sets the activity to `working`** (`:7672`). The store sets
   `task.busy = true` and `turnStartedAt` (`server/store.ts:1619-1637`).
9. It starts the watchdog. The comment says: "Watch from admission, not
   dispatch: a turn can wedge in setup long before any provider event
   exists" (`server/index.ts:7673-7674`).
10. It returns the user row at once. The setup continues in a detached
    `async` block (`:7681`, `:8518-8519`).

These steps are not one transaction. The server stores the user row in
SQLite first. The claim and the busy flag are in memory. Only the message
goes to disk.

### 3.3 `beginTurn`: setup and the five wrappers

The detached block prepares the turn (`server/index.ts:7681-8325`):

1. It reads the engine, the cloud computer, summaries and the compaction of
   the history. After each `await` it checks the claim again. A failed check
   throws `DirectTurnSetupCancelled` (`:7683-7699`). The check needs four
   things: no shutdown, the same claim, the same bot and `task.busy`
   (`:2310-2313`).
2. It builds the replay text for an engine that cannot resume its session
   (`server/turn-context.ts:61-81`).
3. It mounts the tools and the place (3.8), builds the system prompt and
   records a checkpoint. It checks the claim again after each slow step.
4. It waits until the quarantine of an earlier cancelled start on this
   thread is clear (`:8236-8237`). The quarantine ends after 30,000 ms at
   most (`server/turn-dispatch-guard.ts:118`).
5. It moves the claim to phase `dispatching` (`:8238-8240`).
6. It registers the engine of the thread before the call (`:8315`), because
   "an adapter may emit the whole turn before it resolves" (`:8319`).
7. A known usage limit or a sign-out throws before any send (`:8324-8325`).

Then it calls the engine through five wrappers (`server/index.ts:8326-8355`).
From the outside to the inside:

| # | Wrapper | What it does |
|---|---|---|
| 1 | `guardTurnDispatch` | It waits for `sendTurn`. If a Stop or a shutdown came during the wait, it interrupts the engine again and returns `cancelled: true` (`turn-dispatch-guard.ts:11-20`) |
| 2 | `shareNote.after` | It records a "new team skill" note as delivered when the call resolves (`server/host/skills-library.ts:361`) |
| 3 | `savedSteps.dispatch.sendTurn` | It can answer the turn from a recording, with no engine (3.7) |
| 4 | `enginePrestart.note` | It records how the turn started, so that the next new conversation of the bot can start its engine early (`server/engine-prestart.ts:97-115`) |
| 5 | `quickFallback.sendTurn` | If the provider refuses the faster model, it runs the turn again on the bot's own model and shows one turn (3.4) |

After a successful call (`server/index.ts:8356-8396`):

1. If the guard says `cancelled`, the server retires the turn identifier and
   throws `DirectTurnSetupCancelled` (`:8356-8359`).
2. It binds the engine's turn identifier to the generation (`:8361-8371`).
3. **It deletes the dispatch claim** (`:8376`). From now on only
   `task.busy` makes the thread busy.
4. If the thread is no longer busy, the engine finished during the call. The
   server releases the resources and drains the queue (`:8391-8396`).

### 3.4 The faster model and its fallback

1. `classifyTurn` marks a turn as complex in these cases
   (`server/turn-route.ts:23-34`):
   - an empty text or an attachment
   - more than 280 characters or more than 4 lines
   - code, a path or a URL
   - an action verb or a continuation word
   - tools in the previous turn
   - more than 2 question marks.

   Other turns are simple.
2. A simple turn goes to a fast model of the same provider (`:44-59`). The
   bot's model stays when the thread uses more than 60% of the context
   window of the fast model (`:98`).
3. The router keeps the bot's model when the bot's reply style is not
   conversational, the thread has its own model, or the turn is automated
   (`:89`).
4. If the provider refuses the fast model, the fallback holds all events of
   the turn. At `turn.completed` it sends the turn again on the bot's model
   (`server/quick-model-fallback.ts:116-167`). It gives the events of the
   second run the identifier of the first run. The window sees one turn and
   one reply (`:131-136`).
5. The fallback stores the refused model in
   `DATA_DIR/refused-quick-models.json`. The router does not choose that
   model again, also after a restart (`:63-72`, `:177-187`).

### 3.5 When the engine call fails

A failed call emits no `turn.completed`. So the server ends the turn itself
(`server/index.ts:8397-8517`):

1. Only a `TurnNotStartedError` from the driver proves that the engine got
   nothing. The comment says: "Only the driver can prove a task was never
   submitted; an error string is not that proof" (`:8399-8400`).
2. The server deletes the claim, revokes the tools of the turn and releases
   the resources (`:8407-8423`).
3. A cancelled setup ends with no failure row. The server sets the task to
   `idle` and drains the queue (`:8424-8435`).
4. A wait for a computer that another turn holds sets the task to
   `parked.computer` (`:8440-8448`).
5. **Automatic recovery.** If a backup model applies, the server switches
   the model of the task and starts the turn again. Nothing else can run
   between the release and the new start, because the code has no `await`
   there (`:8459-8491`).
6. Otherwise the server stores a failure row with `turnSucceeded: false`,
   sends a notification, sets `idle` and drains the queue. The comment says:
   "A dispatch failure emits no turn.completed, so drain here or the queue
   behind this turn strands" (`:8497-8516`).

### 3.6 The end of a turn

Normal end (`server/index.ts:5018-5034` and `:6643-6838`):

1. The watchdog subscriber stops the watch. It builds the outcome text for
   the caller who waits. The text is the last reply of the turn. With no
   reply, it is the stop reason or "The bot finished without a text reply".
   The subscriber cuts that text at 12,000 characters (`:5022-5027`).
2. The main fold marks the last reply row of the turn with `turnTerminal`
   and `turnCompletedAt`, and sets `turnSucceeded: event.ok`
   (`:6652-6655`). A turn with no reply text marks no row.
3. A turn is "stopped" when `stopReason` is `interrupted` or when the person
   stopped it (`:6648-6651`). A stopped turn gets one quiet row.
4. The fold books the usage, writes a digest and sets `unread` (`:6714-6770`).
5. If a screen capture runs, the thread stays busy until the last capture,
   10,000 ms at most (`:6771-6785`).
6. `settleDirectTurn` sets the activity to `idle` or `parked.computer`, but
   only if this generation is still current (`:6692-6713`).
7. A separate subscriber drains the queue on each `turn.completed`
   (`:7033-7036`).

Other ends:

| How it ends | What the server does | Where |
|---|---|---|
| `runtime.error` | One failure row. A setup error (signed out, no credits) sets the task to `dead` | `server/index.ts:6627-6636` |
| A person stops it | It marks the request as stopped, deletes the claim, interrupts the engine and writes one quiet row | `server/index.ts:2229-2245`, `server/person-stops.ts:57-70` |
| No events for too long | The watchdog interrupts the engine and writes a failure row. After 6 s it sets `idle`. The comment says: "Stands in for the missing turn.completed" (`:5001`) | `server/index.ts:4940-5007` |
| A driver throws | The crash guard fails the turn through the watchdog | `server/crash-guard.ts:63-67`, `turn-watchdog.ts:198-205` |
| The provider settings change | The server interrupts each busy task on that provider and sets it `idle` | `server/index.ts:11750-11885` |
| A busy task that nothing holds | The watchdog frees it after the stall limit | `turn-watchdog.ts:269-280`, `server/host/idle-threads.ts:26-39` |

The limits of the watchdog (`server/index.ts:4922-4939`,
`server/turn-watchdog.ts`):

| Limit | Value |
|---|---|
| No events | 20 min. At least 60 s. Environment variable `OMB_TURN_STALL_MS` |
| No events while a tool runs | 2 h. Never less than the first limit |
| The engine process stopped | 2 min |
| Parked, and the engine is gone | 30 min + 20 min |
| Parked on a person, and the engine is alive | **No limit** (`turn-watchdog.ts:246`) |
| Check interval | 60 s. A gap of more than 3 intervals counts as sleep and is forgiven |

A shell command whose CPU time changes counts as activity. The watchdog does
not stop a command that works (`turn-watchdog.ts:252-267`).

After a restart: the store never saves `busy`, `activity` or
`turnStartedAt` (`server/registry-store.ts:73-76`). On load it sets each
task to `idle` (`server/store.ts:314-316`, `:524-527`). The claims, the
watchdog and the quarantine are in memory only and are lost.

### 3.7 Saved steps

This feature is out of scope for our plan, but it is a wrapper in the turn
path.

1. While the engine does a desktop task on the person's Mac, a tap in the
   tool bridge records each call (`server/saved-steps/journal-tap.ts`).
2. When the request ends with success, the server can save the calls as a
   **recipe**: 1 to 40 steps, keyed by the normalised request text
   (`server/saved-steps/rules.ts:17-18`, `key.ts:21-25`). Many rules refuse
   a recipe (`rules.ts:160-316`). Some examples: a word such as "this" or
   "today", a tool error, or a click by pixel. A final action such as "Send"
   and a secret field also stop a recipe.
3. On the next request with the same words, the wrapper plays the recipe and
   does not call the engine. Four conditions must be true
   (`dispatch.ts:159-162`):
   - the approval level is `full`
   - the turn uses the local computer
   - the person chose that place
   - the turn text is equal to the message text.
4. The wrapper makes its own turn identifier and emits events in the form
   of engine events (`dispatch.ts:89-121`, `replay.ts:34-64`).
5. If a step fails, the same turn falls back to the engine. A note says how
   far the replay got (`dispatch.ts:223-241`).
6. Recipes are stored in `DATA_DIR/bots/<botId>/saved-steps.json`. The
   server keeps at most 200 and drops a recipe after 60 days with no use
   (`store.ts:8-9`).

### 3.8 The place of a turn, pictures and video

Place:

1. `placeOf` decides the place in this order (`server/surface.ts:53-85`):
   1. Works on `off` beats everything.
   2. A pin of the task beats Works on.
   3. Works on names a place.
   4. Auto: the turn mounts what it can reach.
2. If a named place fails, the turn fails with a `PlaceUnavailableError`.
   The comment says: "An explicit place that cannot be attached fails the
   turn; it never quietly moves the work elsewhere" (`server/index.ts:8051`).
3. On Auto, the server pins the task to the place that the turn reached,
   with `surfaceSource: "auto"` (`server/index.ts:8227-8232`).
4. The prompt describes what the server mounted, never the setting
   (`surface.ts:299`).

Pictures (`server/turn-images.ts`):

1. The server reads `<attached-image>` tags that stand alone on a line
   (`:67-83`). It accepts a file only from its own attachments folder, with
   a UUID name, no symbolic link and at most 10 MiB (`:85-113`).
2. Limits: 10 pictures and 40 MiB for each turn. More gives 413 (`:13-15`).
3. The server checks these limits for each engine, also for an engine with
   no picture input (`server/index.ts:7532`).
4. It sends recent pictures of earlier messages again, with a note that
   they are not new (`:253-279`).

Video (`server/turn-video.ts`): one video for each message. The server takes
at most 4 frames with ffmpeg. It allows only local files as input, so a
renamed playlist cannot read other files (`:16-22`).

### 3.9 Tasks and parallel threads

1. `POST /api/bots/:id/tasks` makes a task (`server/routes/tasks.ts:186-222`).
   `buildTask` gives it a new identifier, the title "New thread", empty
   engine sessions, `activity: "idle"` and `busy: false`
   (`server/task-record.ts:29-47`).
2. Two tasks of one bot can run at the same time. The limit is
   `threads.maxConcurrentPerBot`, from 1 to 16
   (`server/bot-thread-limits.ts:5-30`):
   - The default is 16 when a memory gate runs. Otherwise it is one thread
     for each 2 GiB of memory, from 3 to 16.
   - The Starter plan allows 1 thread for work of a person or a routine, and
     16 for work that a bot started.
3. The main thread of the person is never at the limit
   (`server/index.ts:2189-2191`). The main thread is the open thread where
   the person wrote last (`server/main-thread.ts:22-31`).
4. Fork, delete, a model change and a place change are refused while the
   thread is busy (`routes/tasks.ts:101`, `:177`, `:360`, `:377`).
5. A delete deletes the messages, the queue and the logs in one SQLite
   transaction. The `bots.json` write happens inside that transaction
   (`server/message-db.ts:652-665`). A bot always keeps at least one task.

### 3.10 Room turns

1. A message of a person starts a **round**. Each chosen bot takes one
   member turn, one after another (`server/index.ts:10806-10844`).
2. A bot that is busy in another conversation waits. A chip says "{bot} is
   finishing another conversation — will reply here when free". The wait
   ends after 30 min (`server/index.ts:4176`).
3. A member turn checks `bot.busy`. The comment says "One turn per bot
   across 1:1 and rooms" (`server/index.ts:9562`). So in a room, the unit of
   busy is the bot.
4. The text that opens a member turn is the last 30 stored messages of the
   room plus a tail that the server writes (`server/host/room-transcript.ts:35-75`,
   `server/index.ts:10004-10005`). Earlier replies of bots are quoted.
5. A member turn ends after 5 min with no progress. The person can set 1 to
   1,440 min. A running tool extends it to 60 min. The clock stops while a
   person decides (`server/config.ts:48-50`, `server/room-turn-timeout.ts`).
6. A reply that names other bots with `@` starts hops, at most 3
   (`server/index.ts:9427`). **The model output decides who speaks next.**

## 4. The data

### 4.1 The task (`packages/phone-protocol/src/wire.ts:116-194`)

The important fields for a turn:

| Field | Type | Stored | Meaning |
|---|---|---|---|
| `threadId` | string | yes | The identifier of the thread |
| `modelSelection` | object | yes | The model of this thread, if it differs from the bot |
| `approvalMode` | string | yes | The approval level of this thread |
| `resumeCursors` | map | yes | The engine session for each engine instance (private, `server/store.ts:80-91`) |
| `askedAt` | number | yes | The last time a person wrote, never a bot or a routine (private, `store.ts:89`) |
| `surface`, `surfaceSource` | string | yes | The pin and who set it |
| `activity` | `BotActivity` | **no** | The state of the turn |
| `busy` | boolean | **no** | A turn runs |
| `turnStartedAt` | number | **no** | When the busy stretch started |

The wire comment for the last three says: "Runtime-only state, reset on load
and never persisted" (`wire.ts:173-177`).

Tasks are stored in `DATA_DIR/bots.json`, inside each bot, newest first.
Messages are stored in SQLite `messages.db`.

### 4.2 The message fields that a turn sets (`wire.ts:439-572`)

| Field | Meaning |
|---|---|
| `sender` | The person, `{name, id?}`. The server resolves it from the session. "Absent reads as the profile name" (`:524-526`) |
| `peerAsk` | A bot sent this line: `{botId, name, unattended?, incident?}` (`:566-570`) |
| `from` | The bot that wrote a row in a room: `{botId, name, color}` (`:555`) |
| `automated` | No person wrote this line (`:521-523`) |
| `sendId` | The key of the client against a second send |
| `requestPending` | Set before the turn runs. "A restart never clears it" (`:536-538`) |
| `turnId` | The turn of the row |
| `turnTerminal`, `turnCompletedAt` | The last reply row of the turn |
| `turnSucceeded` | The result of the turn |
| `stoppedBy` | Who pressed Stop |

### 4.3 State in memory only

All of these are lost on a restart:

| Name | Key | Where |
|---|---|---|
| `directTurnDispatchClaims` | thread | `server/index.ts:1876` |
| `directRequestOwners` | thread, at most 500 generations | `server/index.ts:1879-1884`, `:7637` |
| The quarantine | thread, 30 s for each owner | `server/turn-dispatch-guard.ts:109-162` |
| Retired turn identifiers | at most 4,096 | `turn-dispatch-guard.ts:23-43` |
| The watchdog | thread | `server/turn-watchdog.ts:122` |
| `TurnStops` | thread, one entry | `server/turn-outcome.ts:23-57` |
| `groupSpeakers`, `roomMemberLock` | thread, bot | `server/index.ts:3472-3478` |

### 4.4 The claim (`server/index.ts:1824-1829`)

```ts
type DirectTurnDispatchClaim = {
  id: string;            // the generation
  botId: string;
  threadId: string;
  phase: "setup" | "dispatching";
};
```

### 4.5 The Stop request (`server/routes/bot-messages.ts:799-868`)

`POST /api/bots/:botId/interrupt` with `{"threadId": "...", "turnId": "..."}`.
The `turnId` is optional and has at most 200 characters. If the named turn
is not the live turn, the server answers
`{"ok": true, "outcome": "already-stopped"}` and stops nothing
(`server/person-stops.ts:53-55`).

## 5. The UI

### 5.1 The thread lists

- **"All threads"** (`src/components/TaskPicker.tsx`): a dropdown in the
  chat header with a search field "Search threads". The status of a row is
  the first of "Waiting", "Waiting on teammate", "Working" or "Unread"
  (`:354`). Empty state: "Nothing matches “{query}”" (`:290-293`).
- **The sidebar row** (`src/components/SidebarThreadRow.tsx`): a spinner
  for a working thread, "Working · {timer}" in the panel. The rows are in
  this order: waiting on you, working, waiting on a teammate, queued,
  unread, active, idle (`:198-213`). A working row always shows, also past
  the limit of 6 rows (`:99-100`).
- While a thread works, these actions are off: Archive, Snooze, Refresh
  permissions and Delete (`:404-415`). Bulk select refuses a running row
  with "Running threads cannot be selected".

### 5.2 Stop

1. The Stop button in the chat header shows only while the bot is busy
   (`src/components/ChatView.tsx:1024-1034`). Its label is "Stop" and its
   title is "Stop this turn".
2. `sendStop` (`src/lib/stop-turn.ts:64-92`) ignores a second press on the
   same thread within 1,000 ms (`:12`).
3. It names the turn that this window saw start. The server then cannot stop
   the queued message that starts next (`:71-74`).
4. After a success, the window shows "You stopped this." until the row of
   the server arrives (`shared/client-cancel.ts:16`).
5. An error goes to the general error area (`:86-91`). There is no
   error next to the Stop button.

### 5.3 Settings

- "Parallel threads": a list from 1 to 16 with the label "Maximum running
  threads per bot" (`src/components/ThreadConcurrencySettings.tsx:39`). Busy
  state: "Saving…". Error: "Could not save the thread limit. Please try
  again." with `role="alert"`.
- While a thread is busy, the model picker shows only the reasoning level and
  "Stop this thread's turn before changing its model"
  (`src/components/ModelPickerBusyMenu.tsx:5-24`).

### 5.4 Working dots

The dots show while the thread is busy and the last row is not a finished
reply of the bot (`src/lib/turn-tail.ts:7-19`). The comment says that no
timer hides them (`:5-6`).

### 5.5 The place

`PlaceChip` (`src/components/PlaceChip.tsx`) is an icon button with the
label "Where this conversation works: {place}". It is off while a turn runs,
with the title "Wait for the current turn to finish" (`:116`).

## 6. The tests

| Test file | What it guarantees |
|---|---|
| `server/turn-dispatch-guard.test.ts` | A late completion of a stopped turn cannot end the next turn (`:62`). The quarantine holds a new turn until the cancelled start expires (`:190`). The codes `thread_busy` and `thread_limit` count as "try again", whatever the words (`:13`) |
| `server/quick-model-fallback.test.ts` | A refused fast model runs again on the bot's model, as one turn with one reply and no error on the bus (`:100`). The refusal is remembered after a restart (`:124`). A Stop prevents the second run (`:172`) |
| `server/turn-watchdog.test.ts` | A turn stalls one time only (`:57`). Each event resets the clock (`:71`). A turn that waits on a person is never stopped (`:82`). The environment cannot switch the watchdog off: an infinite value gives 20 min and 2 h (`:659`). A busy thread that nothing holds is freed (`:404`) |
| `server/person-stop.e2e.test.ts` | Stop gives one quiet row and no failure row. The queued message runs next. A second Stop gives `already-stopped` (`:63-84`) |
| `server/cancelled-turn.e2e.test.ts` | An abort that nobody asked for gives one failure row and keeps the text that came before it (`:85-98`) |
| `server/tasks.test.ts`, `server/independent-task-store.test.ts` | Engine sessions of two tasks stay apart (`tasks.test.ts:61`). `busy`, `activity` and `turnStartedAt` are never saved (`independent-task-store.test.ts:322`). A patch cannot set `busy` (`:295`) |
| `server/room-parallel-threads.e2e.test.ts` | One bot in three room threads answers in one thread at a time. Two bots in two threads run side by side (`:46-96`) |
| `server/room-turn-timeout.test.ts` | The limit measures time with no progress, and stops while a person decides (`:42`, `:112`) |
| `src/lib/stop-turn.test.ts` | A second press within 999 ms sends nothing (`:37`). Each thread has its own Stop (`:75`) |
| `server/saved-steps/dispatch.test.ts` | A replay emits the events in this order: `turn.started`, the steps, the reply, `turn.completed` (`:223`). A failed step falls back to the engine under the same turn identifier (`:369`) |

No test asserts the full flow of `beginTurn` or its failure branch. The
watchdog test loads a part of `server/index.ts` by a marker text
(`turn-watchdog.test.ts:601-602`).

Two tests do not do what their names say:

- `server/turn-continuation.test.ts:99-103` has the name "returns null when
  the handoff cannot be written" but checks `.not.toBeNull()`.
- `server/room-turn-timeout.test.ts:28` has the name "absolute deadline",
  but the limit measures time with no progress.

## 7. Ours compared

What we have now:

- `bot-protocol` has `BotId`, `ThreadId`, `TurnId`, `MessageId`
  (`crates/bot-protocol/src/ids.rs`, ours), `Message` with `id`, `role` and
  `text` (`message.rs`, ours), and `Event` with `turn.started` and
  `turn.completed { outcome }` (`event.rs`, ours).
- `bot-core` has `echo_reply` only (`crates/bot-core/src/lib.rs`, ours).
- `bot-desktop` has one command `send_message` that returns the echo at once
  (`crates/bot-desktop/src/main.rs`, ours). The composer is off while a
  send runs (`crates/bot-desktop/ui/src/features/chat/ChatPane.tsx:20-37`,
  ours).
- `bot-engine` is empty. Step 3 plans `send_turn`, which returns a stream of
  events (`docs/plan/step-03-driver-trait.md`, ours).

The port, part by part:

| Part | Reference files | Ours: crate and module | Step |
|---|---|---|---|
| The start of a turn: checks, the user row, busy | `server/index.ts:7424-7680`, `server/direct-send.ts` | `bot-core`, `runner.rs` (plan 7.2) | 7 |
| The setup and the engine call | `server/index.ts:7681-8396`, `server/turn-dispatch-guard.ts` | `bot-core`, `runner.rs`. The engine call goes through the `TurnRunner` trait | 7 |
| A failed start | `server/index.ts:8397-8517` | `bot-core`, `runner.rs`. The driver returns a typed refusal (`bot-engine`, `error.rs`, plan 3.2) | 3, 7 |
| The end of a turn and the fold | `server/index.ts:6643-6838` | `bot-core`, a fold module | 7, 8 |
| Busy and the activity | `server/store.ts:122`, `:1619-1644` | `bot-core`, store (step 8). In step 7 the runner keeps it in memory | 7, 8 |
| The watchdog | `server/turn-watchdog.ts` | `bot-core`, a watchdog module | Not planned |
| The Stop route | `server/person-stops.ts`, `src/lib/stop-turn.ts` | `bot-core` and a Tauri command in `bot-desktop` | Not planned |
| Tasks and the thread limit | `server/task-record.ts`, `server/routes/tasks.ts`, `server/bot-thread-limits.ts` | `bot-core`, store | 11 |
| The faster model | `server/turn-route.ts`, `server/quick-model-fallback.ts` | `bot-core`, a route module, if we add it | Not planned |
| The place, pictures, saved steps | `server/surface.ts`, `server/turn-images.ts`, `server/saved-steps/` | `bot-core` (place decision), `bot-engine` (picture input as a capability), if we add them | Not planned |
| Room turns | `server/index.ts:9424-10479`, `server/room-*.ts` | `bot-core`, the assignment runtime of step 13. Part 3 has several bots, not rooms | Not planned |
| The thread list and the busy marks | `src/components/TaskPicker.tsx`, `SidebarThreadRow.tsx` | `bot-desktop/ui`, sidebar | 11 |

Where we differ:

| Topic | The reference | Our plan |
|---|---|---|
| Unit of busy | The thread for a chat. The bot for a room turn | D8 says "one turn per bot". D8 cites `docs/plans/2026-09-02-bot-concurrency.md`, and the reference replaced that plan for direct chats on 2026-09-09 (`:6-9`). `changelog.md` section 7 proposes the thread. Not decided |
| A stop by the watchdog | A failure row and a "stalled" incident (`server/index.ts:4956-4963`). No person pressed Stop | `Outcome` has `Interrupted` for a stop by a person. A stop by a timeout has no outcome of its own yet |
| Who makes the turn identifier | The driver (`sendTurn` returns it) | D17: the caller makes each identifier. Plan 3.3 does not say who makes the `TurnId` |
| How the engine call returns | A promise that resolves with the turn identifier. The events come on a separate bus, and can come first | A stream of events from `send_turn` (plan 3.3) |
| The end of a failed start | No `turn.completed`. The server writes the row itself | D20: a typed refusal of `send_turn`, not an event |
| A send while busy | Steer, queue or restart | The composer is off while a turn runs |
| The user row and busy | Two writes: SQLite, then memory | `AGENTS.md`: the row and its event in one transaction |

## 8. Where we can be better

1. **The runtime makes the turn identifier before it calls the driver.** In
   the reference project the driver makes the identifier, and the events
   can come before the server knows it. The server needs a quarantine, a
   registry of early completions, 4,096 retired identifiers and a
   `setImmediate` in the saved-steps wrapper (`server/index.ts:2303`,
   `:8370-8375`, `server/turn-dispatch-guard.ts:23-162`). With D17, the
   runtime puts the `TurnId` in the `TurnRequest`. Each event then has a
   known identifier from the first event. Reason: less code, and a known
   problem of the reference that we do not copy. Plan 3.3 must say this.
2. **One type for the state of a thread's turn.** The reference has a flag
   `busy`, a word `activity`, a claim with two phases and a set
   `ACTIVITY_BUSY`, and the code must keep them in agreement
   (`server/index.ts:2179-2181`, `server/store.ts:122`). The value
   `no-signal` counts as busy, but a search found no code that sets it. A Rust enum such as
   `Idle`, `Starting { generation }`, `Running { turn }`, `WaitingOnPerson
   { turn }` with one function for each change makes "busy with no turn"
   impossible. Reason: a wrong state that the compiler refuses.
3. **The engine call is cancel-safe by its type.** The reference checks the
   claim after each `await` by hand, in seven places
   (`server/index.ts:7683-7699`, `:7813`, `:8183`, `:8239`, `:8313`). In
   Rust, a `tokio` task with a `CancellationToken`, or a dropped future,
   stops the setup at the next `await`. Reason: less code, and no missed
   check.
4. **Each wait has a limit by its type.** The reference has waits with no
   limit:
   - `guardTurnDispatch` waits for `sendTurn` with no timeout
     (`turn-dispatch-guard.ts:16`).
   - A turn that waits on a person has no limit (`turn-watchdog.ts:246`).
   - `OMB_COMPUTER_WAIT_MAX_MS` can be infinite (`server/index.ts:4924`).

   A `Deadline` type with no "infinite" value, as
   `changelog.md` section 7 proposes, refuses these cases. Reason: a known
   problem of the reference that we do not copy.
5. **The refusals keep their code across the boundary.** `beginTurn` throws
   the codes `thread_busy` and `thread_limit`. Code in the same process
   reads them (`server/routine-recovery.ts:73`,
   `server/turn-dispatch-guard.ts:7`). But the general HTTP error handler
   keeps only a fixed list of codes, and these two are not in it
   (`server/index.ts:15058`). The route modules run inside the `try` of that
   handler (`:12417`, `:12584`), so a refusal from `beginTurn` probably
   reaches the window without its code. A Rust enum for refusals goes to the window
   as a typed value. Reason: a wrong state that the compiler refuses, and
   `AGENTS.md` asks for typed refusals.
6. **The user row and the start of the turn in one transaction.** The
   reference stores the user row in SQLite and then sets the claim and busy
   in memory (`server/index.ts:7583`, `:7658`, `:7672`). A later throw
   leaves a row with no turn. `AGENTS.md` already asks for one transaction.
   Reason: a known problem that we do not copy.
7. **One unit of busy for chats and rooms.** The reference uses the thread
   for a chat and the bot for a room turn, with a lock per bot to fill the
   gap (`server/index.ts:9562`, `server/room-member-lock.ts:1`). If we
   choose the thread now, step 14 must not add a second unit. Reason: less
   code.
8. **A Stop with no turn identifier is not accepted.** In the reference a
   Stop that names no turn stops whatever runs, "as older clients expect"
   (`server/person-stops.ts:51-55`). After a reload this can stop a queued
   turn that just started. We have no older clients. Our Stop command can
   require a `TurnId`. Reason: a known problem that we do not copy.
9. **The selected thread is not an input of a turn.** The reference uses the
   selected thread when the caller gives none (`server/index.ts:7469`).
   Our `send_message` command can require a `ThreadId`. Reason: a wrong
   state that the compiler refuses.
10. **A limit on the length of the text.** The reference sets none at the
    route (`server/message-text.ts:2-5`). A limit at the command stops a
    very large paste before it reaches the store and the engine. Reason: a
    known problem that we do not copy.
11. **The text that opens a turn comes from stored data.** In a room, the
    `@` names in a model reply choose who speaks next
    (`server/index.ts:10403-10404`). A thread that a bot opens starts with
    the bot's own words (`server/index.ts:13914`). `AGENTS.md` already
    forbids this for delegated turns. Keep the rule when step 14 adds
    several bots.

## 9. Not verified

Checked by me against the code, all at commit 3aec210:

- `server/index.ts`: `:2179-2191`, `:4176`, `:4922-4939`, `:6627-6636`,
  `:6648-6655`, `:6703-6705`, `:7033-7036`, `:7504-7510`, `:7580-7596`,
  `:7658`, `:7672-7674`, `:8326`, `:8353`, `:8376`, `:8515-8516`, `:9427`,
  `:9562-9563`, `:10283-10307`, `:13914`, `:15055-15060`.
- A search found no `await` in `server/index.ts:7466-7680`.
- `server/store.ts`: `:122`, `:314-316`, `:1619-1644`.
- `server/registry-store.ts:73-76` and `server/turn-watchdog.ts:245-250`.
- `server/turn-dispatch-guard.ts`: `:11-20`, `:116-120`.
- `server/send-idempotency.ts:4-12` and `server/bot-thread-limits.ts:5-36`.
- `server/config.ts:48-53` and `server/turn-images.ts:13-17`.
- `server/saved-steps/dispatch.ts:159-162` and `server/saved-steps/store.ts:8-9`.
- `server/turn-continuation.test.ts:99-103` and `server/person-stops.ts:51-55`.
- `src/lib/stop-turn.ts:12` and `src/components/TaskPicker.tsx:392-396`.
- A search found no code that sets `no-signal`.

Not verified:

- The rules inside `admit()` and the queue. They are in
  [`queue-and-steer.md`](queue-and-steer.md).
- The bodies of these functions: `settleTrackedRequest`, `drainQueuedSends`,
  the `handoffs.*` functions, `releaseTurnResources`, `startFailureText`,
  `failedTurnTool`, `replayInputs`, `resumePlan`, `compactConversation`,
  `stopThreadForPerson`, `roomSessions.dispatch`, `roomLimits`,
  `buildSystemPrompt`, and the `mount*` functions of the place.
- Whether these waits have a limit: `registry.engineRead`,
  `refreshUnsetModelSelections`, `checkpoints.snapshot`, `mountBotVps`,
  `waitForLocalVmUpdate`, `readyLocalVmForTurn` and the consent wait of the
  local computer.
- Whether `userErrorFields` or `cloudLimitFields` add the codes
  `thread_busy` and `thread_limit` to an HTTP body. `userErrorFields`
  returns `errorKey` only (`server/user-errors.ts:249-255`).
- The exact status of the wait tool after a watchdog stall. The task becomes
  `idle`. So the status is probably `settled` or `failed`, not `stalled`.
  This is an inference.
- A Stop and then a rejection that is not a `TurnNotStartedError` may give
  a failure row and a notification instead of a quiet stop
  (`server/index.ts:8405`, `:8497-8511`). The path is plausible from the
  code. No test covers it.
- In a room, before the turn identifier is bound, the filter accepts any
  turn on the thread (`server/index.ts:10144`). A late event of an earlier
  turn may end the new turn. Not tested.
- The release after a room timeout tries again each 1 s with no limit while
  `goalTurns.hasUnboundDiscarded` is true (`server/index.ts:10287-10290`).
  If that never changes, the room keeps its speaker.
- `server/independent-threads-api.test.ts`, `server/parallel-threads.e2e.test.ts`,
  `server/surface.test.ts`, and the test files of `server/saved-steps/`
  other than the three in section 2.
- `docs/plans/2026-09-09-independent-threads.md`. The header of
  `docs/plans/2026-09-02-bot-concurrency.md:6-9` (checked) says that this
  file replaces the decision for direct conversations. Room turns still use
  one lane for each bot. Decision D8 of our project cites the older plan.
- Where the server computes `queued` and `waitingForTeammates` for the
  window, and which frame carries them.
- Credit for `NOTICE` if we port them: `server/room-reply.ts:1-3` and
  `server/room-holds.ts:1-4` say that they follow the desktop group chat of
  Hermes Agent (MIT).
