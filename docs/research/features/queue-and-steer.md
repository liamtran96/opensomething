# Queue and steer: a message sent while a turn runs

Feature row of [`../features.md`](../features.md): "Enter queues a message,
and a second Enter steers it into the running turn". Document of the
reference: `docs/specs/steer-vs-queue.md`. Parts 1 and 23 of
[`../README.md`](../README.md).

Read on 2026-11-23. All paths are in the reference project
(`../OpenMausBot`) unless a line says "ours". The `enterprise/` directory was
not opened. This file adds to
[`../turn-flow-comparison.md`](../turn-flow-comparison.md) (section 4) and
[`../driver-contract.md`](../driver-contract.md) (section 5, "Steer"). It
does not repeat them.

## 1. In short

A person can type a message while a bot is still working on the previous
one. The reference project has three answers for that message:

- **Steer.** The server gives the message to the engine inside the turn that
  runs now. The engine reads it at its next step (after a tool call, or
  before its next model call). The turn does not stop and does not restart.
- **Queue.** The server keeps the message and starts a new turn with it when
  the running turn ends.
- **Restart.** The server queues the message at the front, then stops the
  running turn, so the message runs next.

Special terms, explained one time:

- **Turn**: one run of the engine, from one message of the person to the
  reply. See [`../turn-flow-comparison.md`](../turn-flow-comparison.md).
- **Driver**: the server code for one kind of engine. See
  [`../driver-contract.md`](../driver-contract.md).
- **Steer outcome**: what a driver says after a steer. `steered` (the engine
  has it), `refused` (proved not delivered, so it is safe to queue it), or
  `indeterminate` (maybe delivered, so the server must never send it again).
- **Follow-up**: the stored name of a queued message (table
  `chat_followups`). The same word also names the choice
  `steer | queue | restart` that a send carries.
- **Drain**: the server takes queued messages out of the queue and starts a
  turn with them.
- **Coalesce**: a drain joins near messages of one sender into one turn.
- **Room**: a conversation with more than one bot. In the code, "room",
  "group" and "channel" are the same object.

The name of the feature is not exact. In a 1:1 chat, **Enter steers by
default**, not queues (`shared/follow-up.ts:9`). Enter queues only in a room,
when the person changes a device setting, or when the engine cannot steer.
The "second Enter" gesture steers the first queued message when it comes
within 1.5 s.

Why the feature exists: a person often sees that the bot goes the wrong way,
or remembers a detail, while the turn runs. Without steer, the person must
wait or stop the turn and lose its work. The code comment says: "the queue
survives Stop: stop-then-steer is the feature" (`server/steer-queue.ts:1`).

## 2. Files read completely

Five subagents read the files in groups. I checked the key findings against
the code myself (the lines in section 3 marked "checked").

Server, decision and queue:
`server/admission.ts` (163), `server/admission-golden.test.ts` (146),
`server/steer-queue.ts` (325), `server/steer-queue.test.ts` (1083),
`server/queue-dispatch-failure.test.ts` (63), `server/channel-queue.ts`
(225), `server/channel-queue.test.ts` (320), `server/room-queue.ts` (56),
`server/room-queue.test.ts` (80), `server/room-queue.e2e.test.ts` (210),
`server/room-steer-addressee.ts` (19), its two tests (35, 57),
`server/host/queued-reason.ts` (34) and its test (37),
`server/host/person-first.ts` (178) and its test (167),
`server/person-first.e2e.test.ts` (68), `server/person-stops.ts` (70) and its
test (135), `server/host/person-stop.ts` (94), `server/host/idle-threads.ts`
(50), `server/live-turns.ts` (30), `server/live-call-record.ts` (56),
`server/drain-coalescing-golden.test.ts` (279), `server/steer-e2e.test.ts`
(1079), `server/steer-unattended.e2e.test.ts` (180), `shared/follow-up.ts`
(37), `server/message-text.ts` (6).

Server, routes and storage:
`server/routes/bot-messages.ts` (872) and its test (809),
`server/chat-followups.test.ts` (223), `server/chat-followups-restart.test.ts`
(251), `server/message-db.ts` (999).

Drivers:
`server/drivers/acp/steer.ts` (190), `steer.test.ts` (161),
`devin-steer.test.ts` (149), `grok-steer.test.ts` (200),
`hermes-steer.test.ts` (248), `opencode-steer.test.ts` (132),
`grok-follow-up.ts` (113) and its test (60), `turn-state.ts` (138),
`capabilities.ts` (23), `custom.ts` (55), `grok.ts` (652), `hermes.ts` (465),
`devin.ts` (140), `kiro.ts` (130), `opencode-go.ts` (855), `rpc-error.ts`
(46), all in `server/drivers/acp/`; `server/drivers/codex-questions.ts` (58),
`server/drivers/codex-process.ts` (132).

UI:
`src/components/Composer.tsx` (987), `ComposerQueuedMessages.tsx` (173) and
its test (280), `ComposerSendButton.tsx` (79), `SharedQueueLine.tsx` (90) and
its test (63), `RoomQueueList.tsx` (40), `composer-simple.ts` (87),
`Composer.room-steer.test.ts` (87), `GroupView.queue.test.ts` (70),
`Composer.advanced.test.ts` (248), `Composer.ime.test.ts` (121),
`chat-bubble.ts` (139), `ChatView.user-bubble.test.ts` (86),
`ChatErrorBanner.tsx` (47), `bot-access/RoomComposer.tsx` (12), all in
`src/components/`; `src/state/queue-receipts.ts` (68) and its test (28),
`held-tails.ts` (92), `tail-review.test.ts` (139), `optimistic-send.ts` (54),
`app-store.ts` (118), `chat-snapshot.ts` (38), `message-history.ts` (147), all
in `src/state/`; `src/lib/stop-turn.ts` (106), `keyboard-shortcuts.ts` (264),
`follow-up.ts` (72), `send-key.ts` (95), `room-threads.ts` (79).

Documents:
`docs/specs/steer-vs-queue.md` (111), `docs/specs/steer-sigterm-audit.md`
(93), `docs/specs/aside-injection-seams.md` (62),
`docs/verification/chat-turns.md` (340), `docs/verification/chat-ui.md`
(359), `docs/verification/claude-tool-lifecycle.md` (144),
`docs/verification/grok-steering.md` (126),
`apps/docs/content/docs/features/chat-and-teams.mdx` (137).

Large files read in ranges are listed in section 9.

## 3. How it works

### 3.1 The choice in the composer (1:1 chat)

1. The person types and presses the send key. The send key is Enter by
   default, Ctrl/⌘+Enter for a Japanese locale (`src/lib/send-key.ts:13-33`).
2. During IME composition, the key handler does nothing
   (`Composer.tsx:843`).
3. If the bot is idle, the send has no `followUp`. It is a normal send
   (`shared/follow-up.ts:25`).
4. If the bot is busy, the composer resolves a choice
   (`shared/follow-up.ts:18-30`, `Composer.tsx:519`, checked):
   - the engine cannot steer: always `queue`;
   - else the device setting, default `steer`;
   - Ctrl/⌘ with the send key (or with a click on Send): the other one of
     `steer` and `queue`.
5. A menu at the Send button also offers "Restart turn" (`restart`)
   (`shared/follow-up.ts:33-37`).
6. The UI sends `POST /api/bots/:id/messages` with `followUp`
   (`src/state/store.tsx:2368-2371`).

The engine "can steer" when the instance that runs the turn has
`capabilities.queueing` and a `steer` method (`Composer.tsx:150-154`,
`server/index.ts:7191`). The instance is the one of the running turn, not the
current setting of the bot (`index.ts:6087-6091`).

### 3.2 The decision on the server (checked)

`admit` in `server/admission.ts:96-163` is a pure function: "no IO, no store
reads, no adapter calls" (`:1`). For a send to a busy 1:1 thread
(`direct-busy`, `:102-110`), the rules in order:

1. `followUp` is `restart`: queue, with `chose: "restart"`.
2. The engine can steer and `followUp` is `queue`: queue, `chose: "queue"`.
3. The engine cannot steer, or a choice of computer is open: queue.
4. The message has pictures and the engine cannot steer pictures: queue,
   `blockedBy: "images"`.
5. In all other cases: steer.

Other surfaces of the same function: `direct` (idle thread: start, or queue
with the reason `capacity` or `group-turn`), `room` (queue when the room
works, never steer), `room-steer` (the manual steer of a queued room
message), and five that are not this feature (`guarded`, `unattended`,
`peer`, `opened-thread`, `incident`).

### 3.3 The send flow on the server (checked: `index.ts:7180-7253`)

1. The route checks the body. `followUp` must be `steer`, `queue` or
   `restart`, else 400. Only a typed message can carry it
   (`routes/bot-messages.ts:215-219`).
2. A send with a known `sendId` gets the earlier result again: the stored
   message, or the same `queueId`. A `sendId` of a removed message gets 409
   (`index.ts:7134-7159`).
3. In a shared team chat, a message of a person who did not start the
   running turn always queues (`index.ts:7181`).
4. `admit("direct-busy")` decides (`:7187-7193`).
5. Steer: the server builds the prompt (with reply context and data context)
   and calls `adapter.steer`. An exception becomes `indeterminate`
   (`:7196-7202`).
6. The server reads the bot and the task again. 404 or 409 if one is gone
   (`:7203-7208`).
7. `steered` or `indeterminate`:
   - `steered`, but the turn ended: 409 "the running turn ended before the
     steered message could be recorded". Nothing is stored (`:7211-7216`).
   - else the server stores a user message with `steered: true`. It writes no
     queue row. Answer: `202 { ok, steered: true, threadId, message }`
     (`:7217-7234`).
8. `refused`, and the turn ended meanwhile: the server starts a turn or
   queues it by the idle-thread rules (`:7236-7238`).
9. Queue: the server writes a queue row, then answers
   `202 { ok, queued: true, queueId, threadId, blockedBy? }`. With `restart`,
   it then stops the turn (`:7239-7252`).

A queued message is **not** in the transcript. "Mid-turn sends wait here off
the transcript (else they become the active leaf mid-turn)"
(`steer-queue.ts:1`). The user row is written at drain time.

### 3.4 Person first (an automatic stop)

A steered message waits until the engine reads it, which is often only when a
tool call returns. `server/host/person-first.ts` watches this:

1. After a steer or a queue of the person's own message (not a room, a
   routine, a teammate or an app), the server registers a wait
   (`index.ts:7233`, `:7250`).
2. If the oldest running tool call has run for `PERSON_FIRST_MS = 60_000` ms
   and the message is not answered, the server stops the turn
   (`person-first.ts:12`, `:98-126`). Override: `OMB_PERSON_FIRST_MS`.
3. A turn that waits on the person or on a computer is not stopped. It is
   checked again after 10 s (`:14`, `:116`).
4. Text that the engine wrote before it read the message does not count as
   an answer (`:128-133`).
5. The steered message goes back into the queue at the front, as the same
   transcript row (`rowId`), with a note for the model that says why the
   turn stopped (`index.ts:7233`).

A queued message that the person chose (`queue`, `restart`) never triggers
this (`index.ts:7194-7195`).

### 3.5 The drain (checked: `steer-queue.ts:179-257`)

1. The server calls `drainQueuedSends()` on each `turn.completed`, also a
   failed one, and from about 20 other places: Stop, a provider reload, a
   room turn end, the start-up (`index.ts:7031-7036`). One drain runs at a
   time. A nested call runs again after it (`:7040-7048`).
2. For each thread queue: if the bot or the task is gone, all rows become
   `cancelled` (`steer-queue.ts:197-202`).
3. If the bot is busy, or the thread is blocked (capacity, a room turn,
   coordination), the queue waits (`:203`, `index.ts:7070-7071`).
4. The server takes one coalesced group from the head (`:206`). See 3.6.
5. The rows of the group become `dispatching`. The group leaves the memory
   queue before the turn starts (`:208-212`).
6. Each item becomes its own user row with `queueId`. An item with `rowId`
   uses its existing row (`:213-233`).
7. The prompts are joined with a blank line (`:237`). The server starts one
   turn with the last row as the user message (`index.ts:7049-7056`).
8. The turn ends: the rows are deleted. The start fails: the rows become
   `interrupted` and never run again (`:252-255`).
9. A paused bot, a move or a provider change refuses the start. The server
   appends "queued message could not start — <reason>" and deletes the row
   (`index.ts:7056-7066`).

### 3.6 Coalesce rules (checked: `admission.ts:20-49`, `steer-queue.ts:260-266`)

- The first item always drains. The next item joins when its sender identity
  is the same and the gap to the previous item is 0 to 120,000 ms
  (`DRAIN_COALESCE_WINDOW_MS`). The window is between adjacent items.
- Identity: an incident, a teammate bot (with origin and attended state),
  unattended work, or a person (`sender.id`, else the name, else `local`). A
  spoken line has its own identity for each call.
- A person's text never joins a teammate's work.
- A room also splits by reply target, keeps API, goal and pointed sends
  apart, and caps a group at 30 items (`DRAIN_COALESCE_MAX_ITEMS`,
  `channel-queue.ts:194-195`, `:214-219`). The 1:1 queue has no cap.

Order: first in, first out, with one exception. A person's own message on a
busy 1:1 thread goes in front of teammate work and unattended work
(`first`), and in a shared chat in front of other people (`aheadOfOthers`)
(`steer-queue.ts:141-146`, `index.ts:7248`).

### 3.7 Steer a queued message (checked: `routes/bot-messages.ts:389-467`)

`POST /api/bots/:id/queue/:queueId/steer` with `{ threadId }`. The "Steer"
button and the second Enter both call it.

1. The server takes the **whole** queue of the thread out of memory, for any
   item id (`holdSteeredQueue`, `steer-queue.ts:301-307`). The rows stay
   `pending`. A drain at the same time cannot take them.
2. In a shared chat, a person cannot steer the messages of another person:
   403 `waits_its_turn` (`:398-402`).
3. `admit("direct-busy")` with the picture flags. Pictures block: the queue
   goes back, `200 { queued: true, blockedBy: "images" }` (`:407-415`).
4. All prompts are joined with a blank line and sent in one `adapter.steer`
   (`:416-425`).
5. `steered` with the turn still busy, or `indeterminate` with the bot still
   there: one user row for each item with `steered: true` and `queueId`, the
   rows are deleted, `200 { steered: true, messages, queueIds }`
   (`:429-455`).
6. `indeterminate` and the bot or task is gone: the rows are deleted and
   nothing is written to the transcript, then 404 or 409 (`:456-463`).
7. `refused`, or `steered` when the turn ended during the call: the queue
   goes back in front of new items, a drain starts if the thread is idle,
   `200 { queued: true }` (`:464-466`).

Case 7 with `steered` is a fault: the engine took the words, and the queue
also runs them again as a new turn. See section 8, point 3.

### 3.8 Remove and edit

- Remove: `DELETE /api/bots/:id/queue/:queueId` with `{ threadId }`. 403
  `queued_not_yours`, 404 "no such queued message", 200 `{ ok: true }`. The
  row stays as a `cancelled` row with empty text, so a resend with the same
  `sendId` gets 409 (`routes/bot-messages.ts:373-387`, `message-db.ts:333-347`).
- Edit: the server has **no** edit route. The UI does an edit as a remove,
  then puts the text into the composer. The text comes back only after the
  server confirms the remove, so a message that already started never runs
  two times (`Composer.tsx:443-462`, checked). The edited text is a new send
  at the end of the queue. Its old place is lost.

### 3.9 Stop

- Stop does not empty the queue. After the stopped turn ends, the drain
  starts the queued messages (`steer-queue.ts:1`, `host/person-stop.ts:85-87`,
  test `steer-queue.test.ts:993`).
- The Stop request names the running `turnId`. A Stop for a turn that already
  ended answers `already-stopped` and does not stop the queued message that
  started next (`routes/bot-messages.ts:813-825`, `src/lib/stop-turn.ts:1-4`).
- "Stop and send" (the UI for an engine that cannot steer) sends only the
  Stop. The drain then runs the queue (`Composer.tsx:438-440`).

### 3.10 Restart recovery (`index.ts:15095-15149`)

1. At start-up, the server reads each row of `chat_followups`.
2. `dispatching` or `interrupted` rows (a turn may have started):
   - the owner is gone: the row becomes `cancelled`;
   - else the server writes the user row from the payload if it is not in the
     transcript, adds the notice `chat.notice.followupInterrupted`, and
     deletes the row. **It never sends these words to a model again.**
3. `pending` rows load into the memory queues (`restoreSteeredMessages`,
   `restoreChannelMessages`).
4. After the server listens, it runs the first drain. The pending messages
   then run one time (test `chat-followups-restart.test.ts:204-209`).
5. A message steered on arrival has no row. Its transcript row with
   `steered: true` stays, and nothing runs again.
6. A backup import turns each pending row into `interrupted` and removes its
   prompt, so a copy never runs the work of its source
   (`workspace-backup.ts:830-838`).

### 3.11 Rooms

- A room send never steers on arrival: `admit("room")` queues while the room
  thread works (`admission.ts:120-121`).
- The person steers the head of the room queue with the "Steer next" button
  or the second Enter: `POST /api/groups/:id/queue/:queueId/steer`
  (`routes/channels.ts:493-624`).
- `admit("room-steer")` (`admission.ts:122-132`): the speaker bot must be
  present and able to steer; a line for another bot gives
  `blockedBy: "addressee"`; pictures give `blockedBy: "images"`; an item that
  is not the head gives 409.
- A line that names bots is for those bots. An unnamed line is not for a
  member that does a job from another bot, unless that member leads the room
  (`room-steer-addressee.ts:11-19`).
- The room steer takes the head group (one person's near messages) and puts
  the tail back (`channel-queue.ts:169-180`, `:210-212`).
- A room whose speaker cannot steer keeps the queue. Nothing stops the turn.
- The room queue sends no live event to the UI. Its chips are local to the
  client (`src/state/queue-receipts.ts:57-62`).

### 3.12 How each driver takes a steer

The contract (`server/contracts.ts:286-289`, `:324-329`, `:382`, checked):

```ts
/** The driver keeps a live session and can take a user message mid-turn (steer). */
queueing?: boolean;
/** steer() delivers `images` as structured input; requires queueing and nativeImageInput. */
steerImages?: boolean;
steer?(threadId: ThreadId, text: string, images?: readonly TurnImageInput[]): Promise<SteerOutcome>;
export type SteerOutcome = "steered" | "refused" | "indeterminate";
```

No driver emits an event for a steer. The turn id never changes, and each
turn has one `turn.completed`. No steer path stops or kills the engine
process.

| Driver | What `steer` sends | `steered` when | `refused` when | `indeterminate` when |
|---|---|---|---|---|
| Claude CLI (`claude.ts:1849-1868`, checked) | One stream-json line on stdin: `{ type: "user", message, uuid }`. Pictures as image blocks (`steerImages: true`) | The stdin write succeeds | No turn, the turn closes, the write fails, a picture cannot be read | Never |
| Codex (`codex.ts:705-721`, checked) | JSON-RPC `turn/steer` with `threadId`, `input`, `expectedTurnId`; 10 s timeout | The request resolves | No turn, Stop asked, process gone, any RPC error | Timeout, or the turn settled during the call |
| Pi (`pi.ts:572-588`, checked) | Frame `{ type: "steer", id, message }`; 20 s timeout for the answer | `success: true` | No turn, a synchronous write error, `success: false` | Timeout, process exit, async stdin error |
| Muse Code (`muse-code.ts:727-738`) | SDK command `turn/steer` with `expectedTurnId` | The command resolves | No turn, an `MspError` | Any other error |
| Chat API (`openai-chat.ts:969-974`, checked) | Nothing. The text goes into an in-memory list `asides` of the turn | Always, while the turn takes rounds | No turn, or the turn has stopped taking rounds (`ending`) | Never |
| ACP, command (Hermes, custom with `steer: true`) | A second `session/prompt` with `/steer <text>` | The agent's answer line accepts it | Empty text, turn not open, command not offered, the answer refuses, an RPC error while open | The prompt ends before a verdict, or the turn's own prompt is answered first |
| ACP, request (OpenCode) | Extension request `_session/steering`; 15 s timeout | The request resolves | `promptRequired`, an RPC error with a numeric code | Timeout, transport closed |
| ACP, prompt (Devin, the xAI CLI) | A second `session/prompt` with the text | Once sent | Turn not open, capability absent, prompt already answered | Never |

Details that matter for our design:

- **Chat API.** At the top of each round of its tool loop, the driver moves
  all parked asides into one `user` message, joined with a blank line, after
  the last `tool` message (`openai-chat.ts:623-630`). The steer never goes
  inside a tool batch. If the model gives its final answer while asides wait,
  the driver keeps the answer and runs one more round (`:783-786`). If the
  turn fails before it reads an accepted aside, the driver emits a
  `runtime.notice` `chat.notice.unreadMessage`. The words are lost to the
  engine (`:903`).
- **Claude CLI.** A steer that the CLI does not fold into the current step
  runs as the next native turn. The driver keeps one logical turn: it holds
  the `result` for 2 s (`STEERED_CONTINUATION_GRACE_MS`), and adds the usage
  of both native turns (`claude.ts:396`, `:1590-1667`). From CLI 2.1.282, the
  flag `--replay-user-messages` makes the CLI echo each steer, so the driver
  knows that the CLI took it (`:230`, `:1567-1572`).
- **Codex.** The driver does not name any error variant of `turn/steer`. Each
  RPC error that is not a timeout is `refused` (`codex.ts:716-719`).
- **ACP.** ACP has no steer method. Each agent has its own way
  (`acp/steer.ts:1-3`). A steer with pictures is always refused
  (`acp/core.ts:1573-1574`). In the prompt strategy, `steered` means "sent",
  and a later failure of that prompt fails the whole turn
  (`acp/core.ts:1397`).
- **Stop** is different for each driver. Codex sends `turn/interrupt`, waits
  750 ms, then kills the process tree (`codex.ts:637-666`). The Claude CLI
  closes stdin and kills at once, with no protocol interrupt
  (`claude.ts:1829-1836`). The chat API aborts the HTTP request
  (`openai-chat.ts:961-966`).

## 4. The data

### 4.1 Wire types (`packages/phone-protocol/src/wire.ts`)

- `FollowUp = "steer" | "queue" | "restart"`, default `steer`
  (`shared/follow-up.ts:4-9`).
- `SteerQueueReason = "capacity" | "group-turn"` (`:924`).
- `BotQueuedMessages` (`:926-928`): a map from thread id to a list of
  `{ queueId, text, reason?, why?, sender? }`. The server never sends the
  prompt or the reply context in it (`steer-queue.ts:88-98`).
- Event frame `{ kind: "bot.queued", queues: BotQueuedMessages }` (`:960`). It
  is a full snapshot of all threads on each change, not a delta.
- On a stored message: `steered?: boolean` ("user messages sent INTO a
  running turn", `:504-505`), `queueId?: string` (the queue entry that a
  drained row came from, `:601-602`), `sendId`. `queued?: boolean` exists
  (`:599-600`), but no code sets it.

### 4.2 The memory queue (checked: `steer-queue.ts:20-53`)

`Map<threadId, { botId, items }>`. One item:

| Field | Required | Meaning |
|---|---|---|
| `messageId` | yes | The `queueId`, and the row id in the table |
| `text` | yes | The words that the person sees |
| `prompt` | yes | The text for the engine, with reply and data context |
| `queuedAt` | yes | Time, for the coalesce window |
| `replyToId`, `sendId`, `dataContext`, `mentions` | no | From the send |
| `reason`, `blockedBy` | no | Why it waits: `capacity`, `group-turn`, `images` |
| `sender`, `trigger`, `origin`, `peerAsk`, `unattended`, `relay`, `fromApp` | no | Who sent it and how it is billed |
| `via`, `callId` | no | A spoken line of a call |
| `rowId` | no | The transcript row of a steered message that person-first put back |

### 4.3 The table (checked: `message-db.ts:78-87`, `:199-237`, `:327-363`)

```sql
CREATE TABLE IF NOT EXISTS chat_followups (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,        -- "bot" | "channel" | "aside"
  owner_id TEXT NOT NULL,    -- bot id, or group id
  thread_id TEXT NOT NULL,
  send_id TEXT,
  status TEXT NOT NULL,      -- "pending" | "dispatching" | "interrupted" | "cancelled"
  payload TEXT NOT NULL      -- JSON of the item
);
CREATE INDEX IF NOT EXISTS chat_followups_receipt
  ON chat_followups(kind, owner_id, thread_id, send_id);
```

- The table is in `messages.db` of the data folder, in WAL mode.
- Each write sets `PRAGMA synchronous = FULL` and runs in `BEGIN IMMEDIATE`,
  so the row is on disk before the server answers (`:228-237`).
- The server writes the row first, then changes memory. If the write fails,
  the queue does not change (test `chat-followups.test.ts:149`).
- The states of one row:

  | From | To | When |
  |---|---|---|
  | (none) | `pending` | A message is queued |
  | `pending` | (deleted) | A steer of the queue succeeds |
  | `pending` | `cancelled` | The person removes it, or the bot is gone at drain |
  | `pending` | `dispatching` | The drain starts its turn |
  | `dispatching` | (deleted) | The turn ends |
  | `dispatching` | `interrupted` | The start fails |
  | `dispatching`, `interrupted` | (deleted) | Start-up writes the user row and a notice |

- The table has no position column. A restart reads `ORDER BY rowid`, so an
  item that was put in front (`first`) can lose its place (not tested).
- Deleting a thread deletes its rows, `cancelled` rows included
  (`message-db.ts:653-665`).

### 4.4 Limits

| Name | Value | Place |
|---|---|---|
| Double-Enter window | 1,500 ms | `src/components/ComposerQueuedMessages.tsx:27` |
| Coalesce window | 120,000 ms | `server/admission.ts:20` |
| Room coalesce cap | 30 items | `server/admission.ts:23` |
| Person first | 60,000 ms, minimum 500, recheck 10,000 ms | `server/host/person-first.ts:12-14`, `:72` |
| Codex steer timeout | 10,000 ms | `server/drivers/codex.ts:709` |
| Pi steer timeout | 20,000 ms | `server/drivers/pi.ts:577` |
| ACP request steer timeout | 15,000 ms | `server/drivers/acp/core.ts:275` |
| Claude held result | 2,000 ms grace, 30,000 ms silence | `server/drivers/claude.ts:396`, `:400` |
| Codex Stop grace | 750 ms, then kill | `server/drivers/codex.ts:653` |
| UI steer busy state | 20,000 ms | `src/components/Composer.tsx:481` |
| UI receipts | 64 ids | `src/state/queue-receipts.ts:5-18` |
| Stop repeat guard | 1,000 ms | `src/lib/stop-turn.ts:12` |
| Queue length, text size, age of an item | none found | |

## 5. The UI

### 5.1 The keys (`Composer.tsx:841-910`)

| Key | Bot idle | Bot busy, 1:1 | Bot busy, room |
|---|---|---|---|
| Enter | Send | The setting: steer (default) or queue | Queue |
| Ctrl/⌘+Enter | Send | The other choice | Queue |
| Enter again within 1.5 s, empty composer | — | Steer the queue | Steer the queue head |
| Shift+Enter | New line | New line | New line |
| ArrowUp, empty composer | Edit the last sent message | Nothing | Nothing |
| Escape | Closes menus, cancels a reply, stops dictation | The same; no queue action | The same |

The second Enter steers only when all of these are true
(`ComposerQueuedMessages.tsx:29-47`, checked):

1. the engine can steer (in a room: the busy bot can steer, or no bot is
   marked busy);
2. the number of queued messages went up while the thread was busy. The
   window starts when the chip **arrives** from the server, not at the first
   Enter;
3. the composer is empty (attachments count);
4. at least one message is queued;
5. the time is inside the window.

The gesture steers `queuedMessages[0]`, the head (`Composer.tsx:428-441`).
With two or more queued messages, that is not the message that the person
just sent. In a 1:1 chat the server then steers the whole queue anyway (3.7).

### 5.2 The queued messages box (`ComposerQueuedMessages.tsx:49-173`)

- Place: directly above the composer, joined to it: rounded top corners, no
  bottom border, scroll after `max-h-36`. `aria-live="polite"`.
- One row for each message: an arrow icon (`CornerDownRight`), the text on one
  line with the full text as the tooltip, then the buttons. A message with a
  picture or a citation shows a short form, for example "Use this mockup
  [image]".
- Buttons:
  - **Steer**, on the first row only. Text: "Steer" (one message), "Steer
    all" (more, 1:1), "Steer next" (room). The tooltip says "Steer queued
    message now". While it works: "Steering…", disabled, the icon pulses.
  - **Edit** (pencil) on each row: "Edit: move this message back into the
    composer". Not shown when the composer is locked.
  - **Delete** (trash) on each row: "Delete this queued message".
- Region label: "1 queued message" or "{count} queued messages". No count is
  visible, and the box has no collapse.
- Engine cannot steer, 1:1: the button says "Stop and send" ("Stop the
  running turn and any work it handed to other bots, then send this message
  now").
- Engine cannot steer, room: no button, and the line "Queued. Sends when the
  room's current turn finishes."
- Reasons: "Queued. Starts when this bot has a free thread slot." and
  "Queued. This bot's room turn runs one at a time; it starts when that
  finishes."
- Empty queue: nothing is drawn.

### 5.3 The send button and the placeholder

- Busy and the send steers: the Send button label is "Send into the running
  turn". Busy and the send queues: a grey button with a clock icon, "Queue
  message", "Sends when the current turn finishes" (`composer-simple.ts:76-87`).
- A chevron next to Send opens "Choose how to send this message": "Steer now",
  "Queue" ("Run after the current turn"), "Restart turn" ("Start the turn over
  with this message. Also stops work it handed to other bots")
  (`ComposerSendButton.tsx`).
- Placeholder: "{name} is working. {key} sends this into the running turn",
  and with a queue "{name} is working. Press {key} again to steer the queued
  message into the running turn" (`composer-simple.ts:25-73`). This is the
  only place that tells the person about the double-Enter gesture.
- Stop: a square icon, "Stop this turn", next to Send while the bot is busy
  (`Composer.tsx:935-951`).

### 5.4 In the transcript

- A queued message is **not** in the transcript. The optimistic bubble goes
  away when the server answers `queued` (`store.tsx:2379-2388`).
- A steered message is a normal user bubble with one small grey line under
  the text: "sent mid-turn" (`ChatView.tsx:486-490`).
- A drained message is a normal user bubble with no label.
- After an interrupted drain at a restart: the user bubble and a notice row.

### 5.5 The UI state (`src/state/store.tsx:568-569`)

- `pendingQueued`: thread id to a list of `{ queueId, text, reason?, sender? }`.
  The chip is not optimistic: it shows after the server answers `queued`.
- `consumedQueueIds`: "receipts", at most 64 ids. A receipt stops a slow
  answer from adding a chip again after the message already left the queue
  (`queue-receipts.ts:1-18`).
- Sources: the send answer, the `bot.queued` frame (replaces all 1:1 queues),
  the snapshot `botQueuedMessages`, a `message` frame with a `queueId`
  (consumes the chip), the steer answer, a confirmed delete.
- Remove waits for the server. The chip stays until the server confirms.

### 5.6 Settings and other places

- "Sending while a bot works": "Steer it into the running turn" (default) or
  "Queue it for after the turn". Stored in `localStorage` on this device only
  (`AppSettingsRows.tsx:250-266`, key `omb-follow-up`).
- "Send messages with": Enter, Shift+Enter, or Ctrl/⌘+Enter (key
  `omb-send-key`).
- No setting for the gesture or its window.
- Shared team chat: the box is hidden. A line shows "Next: {name}'s request,
  then {count} more" and, for the writer only, "Yours: {text}" with a remove
  button (`SharedQueueLine.tsx`).
- `RoomQueueList` and `room-queue.ts` show **bots** that wait for a turn in a
  room, not queued messages.

## 6. The tests

What the reference guarantees, by area. The line numbers are the test start.

- **Decision** (`admission-golden.test.ts`): `direct-busy` steers plain text
  into a capable engine; pictures, an open computer choice and an incapable
  engine queue; `queue` and `restart` give `chose` (`:8`); pictures steer
  when the engine can (`:24`); a room never steers on send (`:64`); a room
  steer takes only the head (`:71`); a line for another bot is blocked
  (`:80`).
- **Coalesce** (`drain-coalescing-golden.test.ts`): a burst of three is one
  turn (`:70`); window + 1 ms splits (`:87`); senders never join (`:122`); a
  person's text never joins a teammate's (`:140`); the room cap is 30
  (`:243`).
- **Queue** (`steer-queue.test.ts`): the prompt is the same byte for byte
  through queue, hold, restore and drain (`:74`); a held queue cannot drain
  (`:391`); a restored queue goes before new items (`:418`); a queued message
  is not in the transcript until the drain (`:500`); two notes drain as one
  turn `"first note\n\nsecond note"` (`:561`); a cancelled message does not
  drain (`:608`); the queue drains after a Stop (`:993`); the row stays
  `dispatching` until its own turn ends (`:918`).
- **Durability** (`chat-followups.test.ts`, `chat-followups-restart.test.ts`):
  a failed write changes nothing in memory (`:149`); a failed dispatch is
  never run again (`:170`); a `dispatching` row is never restored (`:189`);
  after a killed server, a pending message runs one time with its fields
  (`restart:204`), an uncertain one gives the user row and one notice with no
  second prompt (`restart:232`), a removed `sendId` still gets 409
  (`restart:220`), and a second restart replays nothing (`restart:239`).
- **Dispatch failure** (`queue-dispatch-failure.test.ts`): a thrown or
  rejected start sets `interrupted`, does not stop the other threads, and
  does not run again after a restore.
- **Person first** (`host/person-first.test.ts`): a tool call that ran 9 min
  is stopped at once (`:54`); a young one gets the rest of its minute (`:66`);
  text before the read does not count (`:94`); a wait on the person is never
  stopped (`:116`).
- **End to end, POSIX only** (`steer-e2e.test.ts`): a plain message during a
  Claude CLI turn is steered with one reply (`:162`); `queue` runs as its own
  turn (`:203`); `restart` stops and runs next (`:236`); a steer that the CLI
  runs as its next native turn keeps one turn (`:320`); Codex steers through
  `turn/steer` and Stop reports no SIGTERM (`:702`); the queue steer route
  works (`:740`); an incapable engine keeps the queue, then drains after Stop
  (`:777`); a room steer folds the head into the Codex turn (`:802`).
- **Drivers**: each driver test checks `refused` with no turn, `steered` in a
  turn, and `refused` after the turn. Codex: an RPC error is `refused`, a
  timeout is `indeterminate`, and the process stays alive
  (`codex.test.ts:3718-3827`). Chat API: an aside parked during a tool round
  goes after the last `tool` message (`openai-chat.test.ts:661`), and a
  failure before the read gives a notice (`:607`). ACP: each strategy has its
  three outcomes (`acp/steer.test.ts`), and twelve agents have no
  `queueing` (`hermes-steer.test.ts:197`).
- **UI** (`ComposerQueuedMessages.test.ts`): the window opens only when the
  count goes up on a busy capable thread (`:57`); the second Enter needs an
  empty composer, a chip and an open window (`:66`); "Stop and send" when
  the engine cannot steer (`:155`). `store.test.ts`: a chip goes away when its
  user row arrives (`:1826`), only the matching id is consumed when two
  texts are equal (`:1910`), and no chip shows when the drain arrives before
  the send answer (`:1938`).

Not tested: the order of a `first` item after a restart; a crash during a
queue steer; the `steered`-but-ended case of the queue steer route; the room
queue after a UI reload; the `chat_followups` rows in `message-db.test.ts:161`
(its title names them, but no assertion reads them).

## 7. Ours compared

Our code has nothing for this feature now.

- `crates/bot-protocol/src/lib.rs` has the identifier types only.
  `crates/bot-engine/src/lib.rs` is empty. `crates/bot-core/src/lib.rs` has
  `echo_reply` only.
- Our composer (`crates/bot-desktop/ui/src/features/chat/Composer.tsx:12-22`,
  ours) refuses a send while `sending` is true (`ChatPane.tsx:37`, ours). A
  message during a turn is lost, not queued.

What we plan:

| Topic | The reference | Our plan |
|---|---|---|
| Turn end | `turn.completed` with `ok` and `stopReason` | `turn.completed` with one `outcome` (D20, step 2.4) |
| Capability flags | `queueing`, `steerImages`, about 30 others | `Capabilities` with streaming, interrupt, approvals, tools (step 3.2). No steer flag |
| Driver methods | `sendTurn`, `interruptTurn`, `steer?` | `send_turn`, `interrupt` (step 3.3). No steer |
| Chat API driver | Parks asides, adds them at the next round | Step 5 streams one reply. No tool loop yet, so no round boundary |
| Store | `chat_followups` in SQLite, four states | Step 8 store has threads and messages. No queue table |
| One turn at a time | One turn for each thread | D8: one turn for each bot |
| Rooms | A room queue and a room steer | Step 14 and later |
| UI while busy | Queue box, steer, edit, Stop and send | Not planned. Step 7 shows the streamed reply only |

Where we differ: the plan has no answer for "the person sends while the bot
works". Steps 3 and 7 need one, because the first turn that streams makes the
question real.

## 8. Where we can be better

1. **One state type for a queued message, not four strings and a flag.** The
   reference keeps the state as a text column, a `rowId` field that means
   "already in the transcript", and a memory map that must agree with the
   table. A Rust enum (`Pending`, `Dispatching`, `Interrupted`, `Cancelled`)
   with the move rules in one function makes a wrong move (for example
   `Cancelled` to `Dispatching`) a compile error. Reason: a wrong state that
   the compiler refuses.
2. **The table is the queue.** The reference keeps a memory map and a table,
   and needs hold, restore and receipts to keep them the same. We can read
   the queue from SQLite each time, in one transaction with the turn start
   (the `AGENTS.md` rule: "Every state change in the runtime writes the row
   and its event in one transaction"). Reason: less code, and no two copies.
3. **Do not copy the double run in the queue steer route.** When the engine
   answers `steered` but the turn ended during the call, the route puts the
   messages back in the queue and drains them (`bot-messages.ts:429-430`,
   `:464-465`). The engine already has the words, so they can run two times.
   The arrival path does the opposite: it returns 409 and stores nothing
   (`index.ts:7211-7216`). Treat a late `steered` like `indeterminate`: store
   it once, never queue it. Reason: a known problem of the reference.
4. **Store a position.** The table has no order column, so a restart loses
   the "person first" order (`ORDER BY rowid`). An integer position column
   fixes it. Reason: a known problem of the reference.
5. **Say what `steered` means for each driver.** In the reference, `steered`
   means "accepted" for Codex and Pi, "written to stdin" for the Claude CLI,
   "parked in memory" for the chat API, and "sent" for the ACP prompt
   strategy. The chat API can then lose an accepted aside when the turn fails
   (`openai-chat.ts:903`). We can make the chat driver give unread asides back
   to the runtime at the turn end, so the runtime queues them. Reason: a known
   problem of the reference (accepted words are lost).
6. **One rule for which messages a steer takes.** The 1:1 route steers the
   whole queue for any id. The room route steers only the head group and
   refuses another id. The UI sends the head id and labels the button "Steer
   all". A steer request that names the ids it takes, and the same rule for 1:1
   and rooms, is less code and has no surprise. Reason: less code.
7. **Keep `admit` as a pure function.** This is the best part of the design.
   In Rust it is a function that takes plain values and returns an enum
   `Admission { Steer, Queue { reason }, Start, Refuse(code) }`. A table test
   covers it with no driver and no store, like `admission-golden.test.ts`.
   Reason: a wrong state the compiler refuses (each match must handle each
   case).
8. **The default for Enter.** The reference steers by default, and its own
   specification says "Enter queues". Our first engine is the chat API, where
   a steer waits for the next round of a tool loop that step 5 does not have.
   Queue by default until a driver can steer, then decide. Reason: the
   reference documents disagree, and steer needs a round boundary that we do
   not have yet.
9. **Do not copy the per-device setting.** The reference stores the follow-up
   choice in `localStorage`, and its own `DESIGN.md:54-56` says "No new
   settings". Ctrl/⌘+Enter and the menu give the other choice for one
   message. Reason: less code, and the reference breaks its own rule.
10. **Edit as a real operation.** The reference edit is a delete plus a new
    send at the end of the queue, so the message loses its place. An edit
    route that changes the text of a `Pending` row keeps the place. Reason: a
    known problem of the reference. This is optional, and costs one route.

## 9. Not verified

Files read only in ranges:

- `server/index.ts` (15,276 lines): 800-809, 930-941, 1884-1891, 2020-2049,
  2174-2253, 2752-2791, 3446-3455, 3812-3896, 4008-4119, 4436-4485,
  4716-4727, 4940-5039, 6055-6104, 6700-6715, 6990-7309, 7455-7524,
  7560-7714, 8355-8524, 8985-9059, 10262-10325, 10462-10479, 10835-10904,
  11740-11904, 12326-12349, 15080-15219.
- `server/routes/channels.ts`: 360-695. `server/routes/threads.ts`: 100-129.
  `server/routes/tasks.ts`: 95-134. `server/workspace-backup.ts`: 755-854.
- `server/contracts.ts`: 205-389. `server/store.ts`: 852-865.
- `server/drivers/acp/core.ts`: 60-239, 268-281, 396-455, 556-605, 735-809,
  872-911, 1030-1119, 1270-1611. `acp/host.ts`: 100-129, 184-213, 250-373.
- `server/drivers/claude.ts`: 220-239, 355-409, 698-733, 830-1019,
  1040-1055, 1196-1241, 1380-1878, 1990-2029.
- `server/drivers/codex.ts`: 560-829, 926-955, 1000-1019, 1076-1171,
  1525-1591. `pi.ts`: 380-610, 700-794, 960-1013. `muse-code.ts`: 190-249,
  395-549, 640-782. `openai-chat.ts`: 198-213, 610-679, 735-979.
- The driver tests and the fake engines: only the parts about steer and Stop.
- `src/state/store.tsx` (3,285 lines): 112-173, 440-459, 555-594, 655-684,
  760-779, 880-931, 1100-1249, 1570-1690, 1715-1749, 2225-2464, 2560-2674,
  2732-2741, 2822-2835, 2965-3089. `src/state/store.test.ts`: 186-207,
  334-347, 1314-1343, 1806-2097, 2985-3149.
- `src/components/ChatView.tsx`: 395-504, 1100-1226. `GroupView.tsx`:
  700-729, 905-988. `AppSettingsRows.tsx`: 225-269. `DESIGN.md`: 40-59,
  228-239, 360-369. `src/locales/en.json`: search only.
- `packages/phone-protocol/src/wire.ts`: 330-344, 480-609, 880-999.

Claims not confirmed:

- What a real Codex app-server does after `turn/steer`. The driver has no
  code for it, and the fake engine emits nothing.
- The real error codes of the engines for a refused steer.
- Whether `@muse-code/sdk` has a timeout, and its error class at a process
  exit.
- Whether the room transcript shows "sent mid-turn".
- Where the UI keeps room chips after a reload. No server source was found.
- Who writes rows of kind `aside`. Start-up deletes them.
- The body size limit of the HTTP server, which can limit the text size.
- What `server/routes/tasks.ts` does with the queue of an archived thread.
- The e2e tests were read, not run. Two of them are skipped on Windows.

Where the documents disagree with the code:

1. `docs/specs/steer-vs-queue.md:58-60` says Enter on a busy 1:1 thread
   queues. The code steers by default (`shared/follow-up.ts:9`). The
   specification has no `followUp`, no setting and no "Restart turn".
2. The same file, `:75-77`: a room whose engine cannot steer gets the same
   "honest interrupt" as 1:1. The code never stops a room turn for this
   (`Composer.tsx:434-435`, test `Composer.room-steer.test.ts:80`).
3. The same file, `:73-74`: the second Enter steers "the just-queued"
   message. The code steers the head, and in 1:1 the server steers the whole
   queue.
4. The same file, `:62-65`: steer never interrupts. Person first stops the
   turn after 60 s of an unread message (`host/person-first.ts:1-8`).
5. The same file, `:111`: "Phase 1 adds this SPEC only". The feature is
   built.
6. `docs/specs/aside-injection-seams.md:34-46` says an ACP driver must not
   declare `queueing` or implement `steer`. Five ACP adapters do it
   (`acp/capabilities.ts:20`, `acp/core.ts:1573-1574`).
7. `server/contracts.ts:328` says a driver that cannot read a picture refuses
   the whole steer. Only the Claude CLI driver looks at pictures. The others
   ignore the argument, and the caller blocks pictures with `steerImages`.
8. `docs/specs/steer-sigterm-audit.md` gives line numbers in `codex.ts` and
   `codex.test.ts` that no longer match, and says `steerActiveTurn` returns a
   boolean. It returns the three outcomes.
9. `server/admission.ts:59` says room queues drain one item for each turn.
   The room drain takes a group of up to 30.
10. `apps/docs/content/docs/features/chat-and-teams.mdx:11` has one sentence
    on the feature. `DESIGN.md` has no part about the queue, steer or Stop.
11. Locale: `composer.followUp.steerHint` is "Interrupt what {name} is
    doing", but a steer does not interrupt. No use of it was found.
