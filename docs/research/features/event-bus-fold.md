# The event bus, the fold and the streamed reply in the window

Capability 6 of group 1 in [`../features.md`](../features.md): "The event
bus, the fold, the streamed reply in the window". Batch 2, gap 2 of
[`../progress.md`](../progress.md). Step 7 of [`../../plan.md`](../../plan.md).
Rows of `features.md`: `README.md` ("the event bus and the event stream",
"streaming replies") and `chat-ui.md` ("streaming replies"). Parts 1, 2, 6
and 22 of [`../README.md`](../README.md).

We read the reference project on 2026-11-23, at commit 3aec210. All paths
are in the reference project, unless a line says "ours". Nobody opened the
`enterprise/` directory. Six subagents read the files, one subagent for each
group in section 2. The main session then read the key lines again. The word
"checked" marks a fact that the main session read again in the code.

This file adds to these files:

- [`../driver-contract.md`](../driver-contract.md), section 3, has a short
  summary of the bus. This file gives all the rules of the bus, its log and
  the readers of the log.
- [`../turn-flow-comparison.md`](../turn-flow-comparison.md), sections 1 and
  5, has a short summary of the flow and the UI. This file gives the fold for
  each event, the SSE stream, the client stores and the chat components.
- [`queue-and-steer.md`](queue-and-steer.md) has the queue. This file tells
  only which code clears "busy" and which code starts the drain.

This file does not repeat the driver events. They are in section 2 of
`turn-flow-comparison.md`.

## 1. In short

When a bot works, its engine sends many small events. Examples: "the turn
started", "here are three more words", "a tool started", "the reply is
complete", "the turn ended". The reference project moves each event through
three stations:

1. **The event bus** (server). It collects the events of all engines in one
   place. It joins small pieces of text. It writes each event to a log file
   for its thread. Then it gives each event to each part of the server that
   listens.
2. **The fold** (server). It is the main listener. It changes events into
   stored chat messages. It stores a reply message when a reply is complete.
   It stores an error message when a turn fails. It stores a tool row when a
   tool runs. It also sends each event to the window.
3. **The window** (client). It shows the words of a reply when they arrive.
   Then it puts the stored message in their place, with no jump and no
   duplicate.

Why the feature exists:

- The person sees the answer grow word by word.
- The store keeps only complete text.
- Many parts of the server (the queue, the notifications, memory, usage) use
  the same events, and each part does not know about the others.

Special terms. Each term has this meaning in all of this file:

- **Runtime event**: one thing that occurs in a turn. It is a JSON object
  with a `type`, for example `content.delta` or `turn.completed`.
- **Delta**: a small piece of reply text (`content.delta`). The window shows
  it live. The store never keeps it as a message.
- **Item id**: an identifier for one message of a reply. All deltas of one
  message and its last `item.completed` have the same item id. The window
  uses it to replace the live text with the stored message.
- **Listener**: a function that the bus calls for each event. The code calls
  it a subscriber.
- **Fold**: the listener that changes events into stored rows. The name
  comes from "fold a stream into a state".
- **Terminal event**: an event that ends a turn. The terminal events are
  `turn.completed`, `cap.exhausted`, `session.exited`, and `runtime.error`
  with `terminal: true`.
- **NDJSON log**: a text file with one JSON object on each line. The bus
  keeps one log for each thread.
- **SSE** (server-sent events): one long HTTP response. The server writes
  frames on it, and the browser reads them with `EventSource`.
- **Frame**: one message on the SSE stream, for example
  `{kind:"runtime", event}` or `{kind:"message", threadId, message}`.
- **Replay buffer**: the last frames that the server keeps in memory. A
  window that lost its connection gets the frames that it did not receive.
- **Cursor**: `<stream id>:<sequence number>`. It is the position of the
  last frame that a window has.
- **Live row**: a temporary chat row in the window, with the id
  `live:<key>`. It shows the words of a reply that the store does not have
  yet.

## 2. Files read completely

The line counts are at commit 3aec210. `index.ts` is `server/index.ts`
(15,276 lines). The subagents read it in ranges only.

**Group A: the bus and its log**

- `server/harness/bus.ts` (312), `server/harness/bus.test.ts` (629)
- `server/thread-log-rotation.ts` (77), `server/thread-log-rotation.test.ts` (122)
- `server/thread-events.ts` (274), `server/thread-events.test.ts` (251)
- `packages/phone-protocol/src/runtime-events.ts` (213). `shared/runtime-events.ts` (1) only exports it again.
- `server/routes/status.ts` (250)
- `server/harness/text-items.ts` (66), `server/harness/progress-gate.ts` (80),
  `shared/inspector.ts` (21), `server/redact.ts` (48),
  `packages/phone-protocol/src/turn-progress.ts` (68)

**Group B: the fold**

- `index.ts` ranges 1460-1530, 2260-2319, 4450-4489, 6240-6859
- `server/live-turns.ts` (30), `server/first-reply-rescue.ts` (175), `server/first-reply-rescue.test.ts` (262)
- `server/harness/public-reply.ts` (17), `shared/client-cancel.ts` (79),
  `server/person-stops.ts` (70), `server/host/turn-attachments.ts` (80),
  `server/turn-dispatch-guard.ts` (178), `packages/phone-protocol/src/failed-turn.ts` (58),
  `packages/phone-protocol/src/first-reply-rescue.ts` (38)
- Ranges: `packages/phone-protocol/src/wire.ts` 495-609, `server/store.ts`
  760-780 and 1100-1290, `server/message-db.ts` 440-484,
  `server/group-goal-run.ts` 25-64, `server/message-redaction.ts` 1-60,
  `server/save-batch.ts` 10-25

**Group C: the other listeners**

- `server/steer-queue.test.ts` (1,083)
- `index.ts` ranges 1478-1527, 2085-2199, 2295-2319, 3500-3515, 4930-5420,
  5555-5569, 6245-6284, 6643-7270, 10080-10258
- `server/store.ts` 1619-1648

**Group D: the SSE stream**

- `server/sse-fanout.ts` (69), `server/sse-fanout.test.ts` (202)
- `server/read-and-draft-sse.test.ts` (55). It is not part of this feature.
  It tests the event streams of outside MCP servers.
- `server/host/team-presence-host.ts` (141)
- `packages/phone-protocol/src/wire.ts` (1,000), `shared/wire.ts` (1)
- `server/host/sse-replay.ts` (61), `server/host/sse-replay.test.ts` (70),
  `server/host/bot-frames.ts` (33), `server/host/message-pages.ts` (57)
- `index.ts` ranges 4430-4760, 6240-6339, 14470-14600, 2295-2320,
  11900-11912, 12525-12536, 12576-12584

**Group E: the client state**

- `src/lib/live-events.ts` (413), `src/lib/live-events.test.ts` (509)
- `src/state/live-reply.ts` (370), `src/state/live-reply.test.ts` (322)
- `src/state/turn-status.ts` (123), `src/state/turn-status.test.ts` (112)
- `src/state/live-frames.test.ts` (161), `src/state/frame-batching.test.ts` (128)
- `src/lib/stop-turn.ts` (106), `src/components/LiveConnectionStrip.tsx` (50)
- `src/state/app-store.ts` (118), `src/state/optimistic-send.ts` (54)
- `src/state/store.tsx` (3,285) ranges 855-884, 1160-1319, 1355-1359,
  1554-1683, 1730-1744, 2020-2079, 2180-2219, 2340-2429, 2730-2744, 2990-3285

**Group F: the UI and its documents**

- `src/components/ChatView.tsx` (1,227), `src/components/ChatMarkdown.tsx` (983)
- `src/hooks/use-transcript-viewport.ts` (570)
- `src/components/ChatView.live-reply.test.ts` (211),
  `src/components/ChatMarkdown.streaming.test.ts` (196),
  `src/components/ChatMarkdown.stream-identity.test.ts` (225),
  `src/hooks/use-transcript-viewport.reopen.test.ts` (326),
  `src/components/GroupView.live-reply.test.ts` (68)
- `docs/verification/chat-ui.md` (359), `docs/verification/chat-turns.md` (340)
- `src/components/ConversationalReply.tsx` (64), `src/components/MessageActions.tsx` (316),
  `src/components/RoomTextMessage.tsx` (245), `src/components/TurnPresence.tsx` (256),
  `src/components/JumpToLatestButton.tsx` (19), `src/components/ChatEmptyState.tsx` (33),
  `src/lib/bottom-follow.ts` (32)
- Ranges: `src/components/GroupView.tsx` 100-339, `DESIGN.md` 115-164,
  229-352 and 371-408, `src/lib/transcript-follow.ts` 1-45

**The main session** read these ranges again to check the findings.
`index.ts` 2179-2181, 5439-5512, 6311-6353, 6383-6384, 6627-6655,
6704-6712, 6771-6788, 7030-7036, 14515-14532, `server/store.ts` 1115-1150,
`src/state/store.tsx` 360-372, `server/drivers/openai-chat.ts` 520-545 and
640-660, `packages/phone-protocol/src/wire.ts` 415-418 and 524-562.

`features.md` names the feature document `chat-ui.md`. Its real path is
`docs/verification/chat-ui.md`. The file `docs/chat-ui.md` does not exist.

## 3. How it works

### 3.1 Which part connects to which part

```text
driver adapters ──onEvent──▶ EventBus ──subscribe──▶ about 20 listeners in index.ts
   (one per engine)            │                        ├─ the fold ──▶ store rows ──▶ SSE "message"
                               │                        │          └──▶ SSE "runtime"
                               └─▶ events/<thread>.ndjson ├─ queue drain, memory, usage, watchdog, …
                                                          └─ first-reply rescue, live turns, …
SSE /api/events ──▶ live-events.ts ──┬─▶ live-reply.ts, turn-status.ts (outside React state)
                                     └─▶ app-store frame queue ──▶ reducer (store.tsx)
```

- The server makes the bus one time: `new EventBus(undefined, gate)`. The
  gate is `quickFallback.take(event) || savedSteps.dispatch.take(event)`
  (checked: `index.ts:1485`). Then `bus.attach(registry.instances())` runs
  (`:1486`).
- The bus does not know about messages, threads or the window. The fold does
  not know about the log file.

### 3.2 An engine event goes into the bus (checked: `bus.ts:101-130`)

1. `attach(instances)` first detaches each instance. Then it listens to
   `adapter.onEvent` (`bus.ts:85-88`).
2. The bus drops an event when its `provider` is not the driver kind of its
   instance. It writes the log line "bus: dropped cross-driver event"
   (`bus.ts:90-92`).
3. The bus adds `providerInstanceId` to the event (`bus.ts:94`).
4. The gate gets the event. If the gate returns true, the gate keeps the
   event and publishes what it wants later. If not, the bus publishes the
   event (`bus.ts:95`). A direct call to `publish()` does not go through the
   gate.
5. `publish` does these steps (`bus.ts:101-130`):
   1. `textItems.stamp(event)` gives reply text its item id. The bus drops a
      delta that has only white space before the first word
      (`bus.ts:103-104`, `text-items.ts:38-39`, `:61`).
   2. `turn.progress` goes to a progress gate. The bus never logs it
      (`bus.ts:105-108`). The bus adds `item.output` to the status line. It
      never delivers or logs `item.output` (`bus.ts:109-112`).
   3. `steps.observe` can add a step name to `item.started` (`bus.ts:113`).
   4. A status-line event or a terminal event removes a waiting progress
      frame (`bus.ts:114`).
   5. A `content.delta` goes to the merge (3.3), and `publish` returns.
   6. For any other event, the bus first sends the waiting text of the
      thread. Then it writes and delivers the event (`bus.ts:127-129`).

### 3.3 The 50 ms merge of deltas (checked: `bus.ts:37-40`, `:115-125`)

1. Only `content.delta` merges. This includes `assistant_text` and
   `reasoning_text`.
2. Each thread has one waiting slot.
3. A delta joins the waiting delta only when these fields are all equal:
   `provider`, `providerInstanceId`, `turnId`, `itemId`, `streamKind` and
   `synthetic`. The bus joins the text. The first delta keeps its `eventId`
   and `createdAt`.
4. The timer starts at the first delta. A merge does not reset it. It fires
   after `DELTA_MERGE_MS = 50` (`bus.ts:18`). A test shows that 30 ms plus
   20 ms gives one event (`bus.test.ts:400-421`).
5. A delta of a different stream on the same thread sends the waiting delta
   first. Thus, mixed reasoning text and reply text stop each other's merge.
6. These actions send the waiting text at once: any event of the thread that
   is not a delta, a released progress frame, `flush()` and `detach()`.
7. Result: the window gets about one text frame every 50 ms, not one frame
   for each token.

### 3.4 Item ids (`text-items.ts`, 66 lines)

1. A turn boundary (`turn.started` or a terminal event) closes the open
   message of the thread. A tool `item.started` also closes it
   (`text-items.ts:14-16`, `:29-36`).
2. An `assistant_text` delta with an engine id gets the scope
   `<turnId>:<id>`. The reason: engines use ids such as `m1` again in each
   turn (`:53-57`).
3. A delta with no engine id uses the open id of the same turn (`:59`). If
   there is no open id, the bus makes a new id `text-<uuid>` (`:62-64`).
4. `item.completed` of `assistant_text` gets the same id and closes the
   message (`:41-45`).
5. `reasoning_text` deltas get no item id (`:37`).
6. Result: "text, tool, text" in one turn gives two reply messages with two
   ids (`bus.test.ts:444-464`).

### 3.5 Delivery and order (`bus.ts:159-166`, `:285-300`)

1. `write` puts the event in the log queue first. Then it delivers the
   event. A listener can publish during delivery. That new event goes into
   the queue after the first event. Thus, the log keeps the order of
   publication (`bus.test.ts:270-285`).
2. The listeners are in a `Set`. The bus calls them in the order that they
   were added. Each call has its own `try/catch`. When a listener throws an
   error, the bus logs "bus: listener threw", and the other listeners still
   run (`bus.ts:285-295`, `bus.test.ts:159-170`).
3. In one thread, the waiting text always goes out before any later event.
   Across threads, a waiting delta can arrive after later events of a
   different thread (`bus.test.ts:466-484`).
4. `subscribe` returns a function that removes the listener
   (`bus.ts:297-300`).

### 3.6 The log of a thread (checked: `bus.ts:159-190`)

1. The path is `<data folder>/events/<threadId>.ndjson`, with file mode 0600
   (`bus.ts:250-252`). The bus does not make the folder. If the folder is
   missing, each write fails (`bus.test.ts:112-131`).
2. The bus redacts each event one time, then serializes it. Redaction masks
   keys that look like a secret and text that looks like a secret
   (`bus.ts:170`, `redact.ts`). The bus does not redact the live event.
3. The queue limits are 4,096 events or 32 MiB (`bus.ts:22-23`). The queue
   accepts one large event when it is empty.
4. Above a limit, the bus does not log an event that is not terminal. But it
   still delivers that event live. The first time for a thread, the bus logs
   and delivers a `runtime.error` "Canonical event history is incomplete …
   Live updates will continue." (`bus.ts:15-16`, `:174-183`).
5. The bus never drops a terminal event (`bus.ts:174`,
   `bus.test.ts:287-303`).
6. The writer takes 64 lines or fewer at a time. It groups the lines of one
   thread and appends them in order (`bus.ts:229-261`).
7. When a write fails, the lines of that group are lost. The bus does not
   try again. It delivers one warning live. That warning becomes the first
   line of the next good write (`bus.ts:277-283`, `bus.test.ts:133-157`).
8. A terminal event starts a flush of the disk queue (`bus.ts:163-165`). At
   shutdown, the server waits 1,000 ms or less (`flushWithin`,
   `index.ts:15265`).
9. Size limit: after each good append, the bus cuts a log that is larger
   than the limit to its newest half. The default limit is 256 MiB, and the
   config can change it. The cut occurs at a line boundary, through a
   staging file and a rename (`thread-log-rotation.ts:6`, `:25-76`). The cut
   reads half of the file synchronously.

### 3.7 How the server reads the log (`thread-events.ts`, `routes/status.ts:119-134`)

1. The route is `GET /api/threads/:id/events?limit=N`.
   - The thread must belong to a bot or a room. If not, the answer is 404
     "no such thread".
   - `limit` must be a positive integer. If not, the answer is 400 "limit
     must be a positive whole number".
2. The server clamps the limit to the range 1 to 2,000. The default is 300.
   The reader reads back from the end in chunks of 64 KiB, and 8 MiB or less
   in total.
3. The reader checks each line against the event type. It skips a bad line,
   but `total` counts it.
4. The reader merges the runtime log and the native log of the engine by
   time.
5. The Inspector panel of the window reads it with `limit=400`
   (`src/lib/inspector-window.ts:4`). No other code builds state from the
   log. The stored messages are the source of the transcript.

### 3.8 The listeners, in the order that they run

The order is the order of the `bus.subscribe` calls in `index.ts`. The code
depends on this order. Two comments say "registered before the fold"
(`index.ts:5041`) and "registered after the main fold" (`:7031`).

1. `savedSteps.observe` (`:1486`)
2. Check work: `turn.completed` with `ok` (`:3509`)
3. The watchdog, turn stops and follow-ups (`:5011-5039`)
4. Memory rows, on `turn.completed` or `session.exited` (`:5043-5052`). This
   listener runs before the fold "so the rows are stashed when it writes the
   digest".
5. The first cloud turn (`:5097-5113`)
6. Prompt-cache keep-warm (`:5199-5220`)
7. Memory capture (`:5257-5281`)
8. Skill review (`:5324-5341`)
9. The memory journal line (`:5343-5372`)
10. The usage trace (`:6255`)
11. **The fold** (`:6256-6841`)
12. Repeats and the loop guard (`:7021`). Person first and team files
    (`:7024`).
13. Live turns and the first-reply rescue (`:7029`)
14. The queue drain on each `turn.completed` (`:7032-7036`)

Three more modules add listeners inside their own code: the perf host, cloud
health and the first-hour host (`index.ts:2765`, `:2783`, `:8788`). We did
not read them. A room member turn adds a temporary listener and removes it
when the turn ends (`index.ts:10117-10155`).

Almost each listener starts with
`if (shouldIgnoreProviderEvent(event)) return;` (`index.ts:2302-2308`). This
check ignores three kinds of events:

- events of a retired turn
- events of a thread that has a pending cancel
- a `session.exited` with no turn id while the thread is busy.

### 3.9 The fold, event by event (`index.ts:6256-6841`)

1. The fold ignores quarantined events (`:6257`).
2. Goal coordinator turns are a special case. The fold keeps their reply
   text and drops their deltas. At `turn.completed`, it broadcasts the
   visible part as one synthetic `item.completed` (`:6266-6310`).
3. **The fold broadcasts first** (checked: `:6311-6316`).
   - Each event goes to the window as `{kind:"runtime", event}`. The only
     exception is `assistant_image`.
   - `request.opened` loses `command`, `commandLine` and `reads`.
   - Other events go through `publicReplyEvent` (checked:
     `public-reply.ts:13-17`). An `item.completed` of `assistant_text` gets
     the redacted saved text. A room delta gets `botId`.
   - The server does not redact deltas here. They go out "as the engine
     writes them". The chat driver itself masks its key and the secret
     values of its integrations before it emits a delta. It also keeps back
     an end of text that can be the start of a secret (checked:
     `server/drivers/openai-chat.ts:526-541`, `:643-656`). We did not read
     whether all other drivers do this.
4. The fold finds the owner: a bot thread or a room. If there is no owner,
   the fold stops and stores no row (`:6319-6323`). The broadcast of step 3
   has already occurred at that time.
5. Then the fold does one of these actions:

| Event | What the fold does | Lines |
|---|---|---|
| `turn.started` | Records the start time and clears the stop marks. No row | `:6371-6375` |
| `session.started` | Saves the resume cursor and the model. `mcpFailed` adds an MCP row | `:6376-6381` |
| `content.delta` | Nothing. Broadcast only | none |
| `item.completed`, `assistant_text` | Stores a bot row `{role:"bot", kind:"text", text, turnId, itemId}`. A client cancel sentence becomes a "stopped" row (checked) | `:6345-6353`, `:6383-6384` |
| `item.completed`, `assistant_image` | Saves the picture and keeps it for the turn | `:6385-6402` |
| `item.started`, tool | Stores an activity row with the item id as its key | `:6426-6437` |
| `item.completed`, tool | Changes that activity row: `ok` and `output` | `:6403-6424` |
| `request.opened`, `request.resolved` | Stores or changes a card row. Sets the task to "waiting-on-you" or "working" | `:6438-6617` |
| `turn.retrying` | Row "retrying — attempt N/M in Xs — reason" | `:6618-6624` |
| `context.compacted` | A compaction row | `:6625` |
| `runtime.notice` | Row "notice: …", cut at 400 characters | `:6626` |
| `runtime.error` | After a stop: a "stopped" row. In other cases: the error row `error: <cause>`, cut at 600 characters. With `setup`, the task becomes "dead" (checked) | `:6627-6636` |
| `thread.token-usage.updated` | Memory only | `:6637-6642` |
| `turn.completed` | See step 6 | `:6643-6839` |

6. On `turn.completed` (checked: `:6643-6655`, `:6704-6712`, `:6771-6788`):
   1. The fold closes the waiting cards. It sets "stopped" from
      `stopReason: "interrupted"` or from a Stop by the person.
   2. It marks the last bot text row of the turn with `turnTerminal: true`
      and `turnCompletedAt` (`store.ts:1119-1129`). Then a second write sets
      `turnSucceeded: event.ok`.
   3. It records usage, the digest, the unread flag and the notification.
   4. For a 1:1 bot, `settleDirectTurn` waits for the digest. It also waits
      for the last screen picture when the thread has one. Then it sets the
      task to "idle", which clears `busy`. Then it drains the queue
      (`:6704-6711`).
   5. For a room, the speaker becomes idle (`:6829-6836`).
7. `turn.completed` with `ok: false` writes no error row. Only a
   `runtime.error` writes an error row.

### 3.10 Which code clears "busy" and starts the next message

1. The store keeps "busy" on the task, and a task is one thread:
   `task.busy`. The store calculates `bot.busy` as "one or more of its tasks
   are busy" (checked: `store.ts:1619-1644`). `threadBusy(bot, thread)` reads
   the task or a dispatch claim (checked: `index.ts:2179-2181`).
2. The fold clears "busy" in `settleDirectTurn`. That function runs in a
   `.finally` after the digest promise (checked: `index.ts:6786-6787`).
3. The waits before "busy" ends have limits:
   - The digest has one `await`: a diff of the working folder, with a race
     against a 3,000 ms timer (checked: `index.ts:5490-5503`).
   - The last screen picture has a race against
     `SCREEN_SETTLE_TIMEOUT_MS = 10_000` (checked: `index.ts:7320`).
4. The last listener also calls `drainQueuedSends()` on each
   `turn.completed`. Its comment says "busy is already false here" (checked:
   `index.ts:7031`). This is not true for a 1:1 turn, because the fold clears
   "busy" later, in step 2. The drain that starts the next message is the
   drain in `settleDirectTurn` (`:6709-6711`). A comment there agrees: "An
   asynchronous screenshot finishes after the bus subscribers that normally
   drain have run" (`:6708`). We did not run the code to check this.
5. Four places call `drainQueuedSends`: `:6710`, `:7035`, the watchdog at
   `:5002`, and a failed start at `:7066`. Thus, the function needs a
   re-entry flag and an "owed" flag (`:7038-7048`).
6. A test shows that the thread is the unit of "busy". In the test, an idle
   task B of a bot drains its queue. At the same time, task A of the same bot
   is busy (`steer-queue.test.ts:667-687`).

### 3.11 From the store to the window (`index.ts:4450-4508`, `:4672-4691`)

1. Each change in the store emits a change event. `message` and
   `message.patch` become frames with `pageMessage(message)`. That function
   replaces a screen picture with `hasImage: true`. It also cuts a tool
   output that is longer than 1,000 characters and marks it `clipped`
   (`message-pages.ts:18-34`).
2. `appendMessage` writes the row in one SQLite transaction. Then it
   changes the copy in memory. Then it emits the change (checked:
   `store.ts:1131-1149`, `message-db.ts:460-465`). `patchMessage` is one
   `UPDATE`, then the emit.
3. `broadcast(payload)` does these steps (checked: `index.ts:4672-4691`):
   1. It sets `seq = ++lastSeq`. The frame is
      `id: <STREAM_ID>:<seq>\ndata: {...payload, seq}\n\n`. `STREAM_ID` has
      8 characters. The server makes a new one at each start, because `seq`
      starts again at 1.
   2. It makes a member version of the frame when the two versions are
      different.
   3. It puts both versions in the replay buffer.
   4. For each open stream, it skips the frame if the stream does not want
      it or must not see it. Else it writes the frame with `deliverSseFrame`.

### 3.12 The SSE stream (`index.ts:14493-14551`, `sse-fanout.ts`)

1. The request is
   `GET /api/events?since=<cursor>&screens=off&window=1&frames=thread`.
2. A heartbeat starts. Every 15 s the server writes
   `: keepalive\n\ndata: {"kind":"ping"}\n\n` (`sse-fanout.ts:46`). The
   interval is `SSE_HEARTBEAT_MS`, from the environment, or 15,000
   (`index.ts:4652-4656`).
3. The cursor is the `Last-Event-ID` header. If there is no header, the
   cursor is the `since` parameter (checked: `index.ts:14515-14518`). A
   cursor of a different `STREAM_ID` becomes null.
4. `resumed` is true only when all three conditions are true (checked:
   `:14520-14525`):
   - The buffer still has each frame after the cursor.
   - The stream did not lose a whole bot frame.
   - For a team member, no audience change occurred after the cursor.

   The code comment says: "A cursor that fell off the buffer gets no
   partial replay: it would leave a permanent hole."
5. The server writes `{kind:"hello", cursor, resumed}` with no `id:` line
   (`:14526-14532`). With `resumed: true`, it then writes each buffered frame
   after the cursor. With `resumed: false`, the window must load all data
   again. There is no separate "reset" frame.
6. The replay buffer keeps 500 frames or fewer, and 8,000,000 characters or
   fewer (checked: `sse-replay.ts:15-17`, `:53-56`). `screen` and `power`
   frames keep their number but not their content.
7. A slow window (checked: `sse-fanout.ts:12-36`):
   - When more than 4 MiB is not sent yet, the server closes the stream. The
     window connects again and gets the replay.
   - When a `write` returns false, the server drops `screen` frames until the
     `drain` event. It always writes the other frames.
8. The server writes replayed frames with a plain `res.write`, with no size
   check (`index.ts:14543`).

Each runtime frame uses one place in the buffer of 500. This includes the
delta frames. A long reply at one frame each 50 ms fills the buffer in about
25 seconds. Thus, a window that is away for longer than that during a reply
gets `resumed: false` and a full reload. This is a calculation from the
numbers above. We did not measure it.

### 3.13 The window gets frames (`src/lib/live-events.ts`)

1. The window opens one `EventSource` on `/api/events` (`:9`), with the URL
   of 3.12, step 1.
2. On `error`, the client closes the source itself and connects again after
   a delay. The delay starts at 500 ms, doubles each time, and stops at 10 s
   (`:11-12`, `:249-250`, checked `:259-264`). Thus, the browser never
   connects again by itself with `Last-Event-ID`. The resume uses the
   `since` parameter.
3. A `ping` resets the delay, and the client does not pass it on (checked:
   `:293-297`). With no frame for 40 s (`LIVE_EVENTS_STALE_MS`), the client
   connects again (`:10`, `:369-382`). It also connects again on `online`, on
   `focus`, and when the window becomes visible.
4. `hello` with `resumed: false`: the client calls `onSnapshotRequired()`.
   The store then does these steps (`store.tsx:3204-3211`):
   1. It applies the waiting frames.
   2. It calls `forgetLiveReplies()`.
   3. It drops the frames that arrived before the load.
   4. It forgets the live turns.
   5. It loads all data again.

   The cursor moves only after a good load (`live-events.ts:316-330`).
5. `hello` with `resumed: true`: the cursor does not move. Each replayed
   frame moves it (`:300`, `:335-341`).
6. Each other frame first goes to `tapLiveFrame` (checked: `:134-144`). A
   `runtime` frame goes to `turn-status.ts` and `live-reply.ts`. A bot text
   `message` frame goes to `live-reply.ts`. Then the frame goes to the app
   store.
7. The app store keeps frames in a queue. It applies them one time for each
   painted frame, with one notification at the end. It uses
   `requestAnimationFrame`, or 100 ms when the window is hidden
   (`app-store.ts:9-22`, `:58-104`). An action first applies the waiting
   frames, so the order stays correct (`:86-92`).

### 3.14 The live reply in the window (checked: `src/state/live-reply.ts:76-116`)

1. The client uses a `content.delta` only when all four conditions are true:
   - `streamKind` is `assistant_text`.
   - The text is not empty.
   - Its `eventId` is new. Thus, a replayed frame has no effect.
   - The person did not stop the thread.
2. After a connection gap, the client ignores deltas until the thread gets a
   boundary: `item.completed`, a tool `item.started`, `turn.started` or a
   turn end. The reason: the window cannot complete an item if it did not
   see the start.
3. The delta goes to the item with the same `itemId`. If that item is not
   complete, the client adds the text. If the item is complete, the client
   drops the delta.
4. If no item has that id, the client starts a new item. It drops the older
   items that are not complete. The code comment says: "an earlier one still
   open never completes".
5. `item.completed` of `assistant_text` replaces the text with the last text
   and marks the item complete.
6. A bot text `message` frame with the same `itemId` sets
   `savedAs = message.id` (`:127-139`).
7. `turn.started` keeps only the saved items of this turn. A turn end keeps
   only saved items. Thus, a reply that the store never got (failed or
   hidden) disappears.
8. Drawing (checked: `:182-186`): until the item is complete, the text shows
   up to the last space or line break. The code comment says: "The last word
   waits for the space after it, so a secret is masked whole or not shown."
   The client redacts the text that it shows. A client cancel sentence shows
   as nothing.
9. The client draws the live row only while the stored message is not in
   the transcript. When the stored message is there, the client removes the
   live row in the same render (`:246-263`, `:351-360`). The window never
   shows the two together.
10. The client adds live rows only when the transcript window ends at the
    newest message (`:285-288`).
11. Limits: 32 items for each thread, 200 threads, 4,096 known event ids
    (`:38-42`).

### 3.15 The status line and Stop

1. `turn-status.ts:45-84` keeps one state for each thread:
   - `turn.started` clears the state.
   - A reasoning delta shows "Thinking".
   - A reply delta sets the state "reply".
   - `turn.progress` shows the tool step.
   - A turn end sets the state to `ended`.
   - `runtime.error` changes nothing.
2. Stop (`stop-turn.ts:61-91`): the client sends
   `POST /api/bots/:id/interrupt` with `{threadId, turnId}`. It ignores a
   second press in less than 1 s. It freezes the live reply
   (`skipping: true`).

### 3.16 Error paths, limits and edge cases

1. The driver fails before the first event. There is no event. The server
   stores the failure row itself (`turn-flow-comparison.md`, section 2).
2. The driver fails after some text. It sends `runtime.error`, then
   `turn.completed { ok: false }`. The store does not get the streamed text,
   because there is no `item.completed`. The window drops it at the turn end
   (`ChatView.live-reply.test.ts:127-134`).
3. The same `item.completed` arrives two times. The fold stores two rows,
   because it does not check the item id (`index.ts:6351`). No test shows
   this case.
4. A listener throws an error. The bus logs it, and the other listeners run
   (3.5).
5. The log disk fails, or the queue is full. Live delivery continues. A
   warning line in the log marks the gap (3.6).
6. A window is slow. The server closes the stream at 4 MiB. Then the window
   gets the replay or a full reload (3.12).
7. A window is away for too long, or the server starts again with a new
   `STREAM_ID`. The window gets `resumed: false` and a full reload.
8. A reply streams when the window opens. The window does not draw it until
   the next boundary. The reason: the first `hello resumed:false` sets the
   gap flag, and no code resets the flag (`live-reply.ts:50`, `:149`).
9. The first reply does not come. After 20 s, the rescue stores one notice
   row "<bot> hasn't heard back from <engine> yet.". It changes that row at
   the first output (`first-reply-rescue.ts:11-19`, `:53-154`).

## 4. The data

### 4.1 The runtime event (`packages/phone-protocol/src/runtime-events.ts`)

The fields of each event (`:24-38`): `eventId`, `provider`,
`providerInstanceId?`, `threadId`, `createdAt` (ISO text), `turnId?`,
`itemId?`, `requestId?`, `raw?: {source, payload}`, `synthetic?`.

The variants (`:40-211`):

| Group | Types |
|---|---|
| Session | `session.started { sessionId, model?, rebuilt?, mcpFailed? }`, `session.model-variants`, `session.exited { reason? }` |
| Turn | `turn.started`, `turn.retrying { attempt, delayMs, reason }`, `turn.completed { ok, stopReason?, cost?, denials?, usage? }`, `cap.exhausted { handoffPath, reason }`, `turn.wait_started`, `turn.wait_ended` |
| Items | `item.started { itemType: tool or reasoning, title?, summary?, input?, step? }`, `item.updated`, `item.output` (never logged or sent), `turn.progress` (never logged), `item.completed` as tool `{ ok, output? }`, as `assistant_text { text }`, or as `assistant_image { data, alt?, fromTool? }` (never sent to the window) |
| Text | `content.delta { streamKind: assistant_text or reasoning_text, delta, botId? }` |
| Requests | `request.opened`, `request.resolved` |
| Other | `thread.token-usage.updated`, `runtime.error { message, partial?, setup?, terminal?, and 7 more }`, `runtime.notice`, `context.compacted`, `context.summarizing { active }` |

### 4.2 The frames (`packages/phone-protocol/src/wire.ts:953-1000`)

- `{kind:"hello", cursor, resumed}` is always the first frame.
- `{kind:"runtime", event}`.
- `{kind:"message", threadId, message}` and
  `{kind:"message.patch", threadId, message}`. The patch has the whole
  message.
- There are about 35 more kinds: `bot`, `thread`, `group`, `config`,
  `screen`, presence and others.
- Each frame from `broadcast` also has `seq`, but the type does not declare
  it. `{kind:"ping"}` is also not in the type.

An example of a delta on the wire, from `index.ts:4677` and `:6315`:

```text
id: 1a2b3c4d:812
data: {"kind":"runtime","event":{"type":"content.delta","eventId":"…","provider":"…","providerInstanceId":"…","threadId":"t1","turnId":"u1","itemId":"text-…","createdAt":"…","streamKind":"assistant_text","delta":"three more words"},"seq":812}
```

### 4.3 The stored reply and the sender (`wire.ts:415-418`, `:495-609`, `index.ts:6351`)

- A reply row: `{id, at, parentId, role:"bot", kind:"text", text, turnId,
  itemId?}`. After the turn, the row also has `turnTerminal: true`,
  `turnCompletedAt` and `turnSucceeded`.
- The comment of `itemId` says: "the `itemId` its words streamed under, so a
  client swaps the streamed text for this message" (`wire.ts:528`).
- A user message can have `sender?: ResolvedSender`, which is
  `{ name, id? }`. The comment says: "Which person sent this user message,
  when the workspace has more than one. Absent reads as the profile name"
  (checked: `wire.ts:415-418`, `:524-526`).
- A room row has `from: {botId, name, color}`, which names the bot that
  spoke (checked: `wire.ts:555`).
- The queue keeps the sender of a waiting message. The lines of each sender
  drain as a separate turn (`steer-queue.test.ts:192-222`).

### 4.4 What the system stores, and where

| What | Where | Owner |
|---|---|---|
| Messages (rows) | SQLite, through `store.appendMessage` | the store |
| Each runtime event, without progress and tool output, redacted | `<data>/events/<threadId>.ndjson`, mode 0600, cut at 256 MiB | the bus |
| Native engine traffic | `<data>/native/` | the drivers |
| The last 500 frames | memory only (replay buffer) | `index.ts` |
| Live text | memory of the window only (`live-reply.ts`) | the client |
| Deltas | never a row. In the log as merged events | |

### 4.5 The limits

| Limit | Value | Line |
|---|---|---|
| Delta merge | 50 ms | `bus.ts:18` |
| Log queue | 4,096 events, 32 MiB | `bus.ts:22-23` |
| Log lines for each write | 64 | `bus.ts:20` |
| Log size | 256 MiB default, cut to half | `thread-log-rotation.ts:6` |
| Log read | 300 default, 2,000 maximum, 8 MiB | `thread-events.ts:8-11` |
| Replay buffer | 500 frames, 8,000,000 characters | `sse-replay.ts:15-17` |
| Bytes not sent to a window | 4 MiB | `sse-fanout.ts:13` |
| Heartbeat | 15 s | `index.ts:4652-4656` |
| Client stale time | 40 s | `live-events.ts:10` |
| Client delay before it connects again | 500 ms to 10 s | `live-events.ts:11-12` |
| Live items | 32 for each thread, 200 threads | `live-reply.ts:38-42` |
| Error text | 600 characters | `failed-turn.ts:8` |
| First-reply notice | 20 s | `first-reply-rescue.ts:11` |
| Digest wait before "busy" ends | 3 s | `index.ts:5499` |
| Screen wait before "busy" ends | 10 s | `index.ts:7320` |

## 5. The UI

### 5.1 Components

- `MessagesList` in `ChatView.tsx` merges the live rows into the list with
  `useLiveTranscriptLayout` (`:613`). It puts a live row in a
  `StreamingReplyContext` (`:731-737`). The row key is the message id. Thus,
  the key changes from `live:…` to the stored id at the replacement.
- `Bubble` reads its row with `useLiveRow` (`:301`). A live row has no file
  links, no attachments and no entry animation (`:334-341`, `:423`).
- `ChatMarkdown.tsx` draws Markdown while the text streams (`:850-976`):
  - It parses each complete block one time and keeps the result. It parses
    only the last block again.
  - An open code fence shows as plain code. Its buttons are hidden and
    inert. Mermaid waits for the closed fence.
  - It parses a long list or table in pieces.
  - The renderers are one object at module level. Thus, React does not
    mount the message again.
- `MessageActions.tsx`: the actions of a streaming row are hidden and inert
  (`:77-78`, `:226`).
- Rooms: `GroupView.tsx:153`, `:322` and `RoomTextMessage.tsx:87` do the
  same. The speaker comes from `botId` on the delta.

There is no caret or cursor at the end of the live text.

### 5.2 Text and states

| State | What shows | Lines |
|---|---|---|
| Empty | The avatar (64 px), the bot name, and the description or "Send a message to start the conversation." | `ChatEmptyState.tsx:12-30` |
| Busy, simple mode | A phrase, or "Typing…" | `TurnPresence.tsx:179-189` |
| Busy, advanced mode | "Working · <timer> · <phrase>". A Stop button ("Stop", title "Stop this turn") is in the header | `TurnPresence.tsx:190-220`, `ChatView.tsx:1024-1036` |
| Reasoning | "Thinking" | `en.json:2895` |
| Reply streams | The live row grows. The status is under it | `ChatView.tsx:897-898` |
| Reply stored | The stored row replaces the live row in the same render. The status hides at once (520 ms "popping") | `ChatView.tsx:885-894` |
| Error | A red row: a plain sentence, "Details" with the raw cause, and "Retry" on the last row when the bot is idle | `ChatView.tsx:139-258`, `:690`, `:1120` |
| Connection lost, after 4 s | "Reconnecting… New replies show up once the connection is back." | `LiveConnectionStrip.tsx:8`, `en.json:7997` |
| Connection lost, after 20 s | "Still unable to connect. Check your connection, sign-in, and any ad or tracker blocker for this site, then retry." and "Try again" | `en.json:7998-7999` |
| Offline | "You're offline. New replies show up once you're back online." | `en.json:8000` |

The busy state uses `bot.busy` (checked: `ChatView.tsx:869`). That `bot` is
`currentTaskBot(profile)`. It takes `busy` and `activity` from the task of
the open thread (checked: `ChatView.tsx:747`, `store.tsx:360-371`). Thus,
the chat of thread A does not show "Working" when only thread B is busy.

### 5.3 Scroll

`use-transcript-viewport.ts` follows the end while the text grows. The
scroll is smooth while a live row exists (`:282-289`). These actions stop
the follow: the wheel up, a touch drag, Page Up, and the scroll bar. A round
"Jump to latest" button shows after 150 ms when the view is not at the end
(`:541-547`, `transcript-follow.ts:39`).

### 5.4 Screen readers

The transcript is `role="log"` with `aria-live="off"`. A separate announcer
reads the reply one time when the turn ends (`ChatView.tsx:1093-1097`,
`:1174`).

### 5.5 The document does not agree with the code

`docs/verification/chat-ui.md:216-227` ("In-flight reply text") says "The
renderer keeps no streamed text". The next section (`:264-299`, "A reply as
it streams"), the code and the tests all stream text (checked). The first
section is old.

## 6. The tests

**The bus** (`bus.test.ts`):

- The bus adds the instance id and checks the driver kind (`:41-63`).
- Each event is in the log, redacted one time (`:65-110`).
- After a missing folder or a failed write, live delivery continues. The
  bus sends one warning and marks the gap in the log (`:112-157`,
  `:317-370`).
- A listener that throws does not stop the other listeners (`:159-170`).
- Order: lines go in one append, in order. A write in progress holds later
  lines back. A nested publish keeps the order (`:192-233`, `:270-285`).
- Overflow at 4,096: the bus keeps the first 4,096 events and sends one
  warning. It never drops terminal events (`:235-303`).
- Deltas in 50 ms merge, and the first id stays. The waiting text goes out
  before any other event of the thread. No merge occurs across threads,
  stream kinds, turns or synthetic text (`:400-505`).
- Item ids: one id for each message, and a new id after a tool
  (`:444-464`).
- Progress frames are live only, one each 400 ms or fewer (`:523-628`).

**The log** (`thread-log-rotation.test.ts`, `thread-events.test.ts`):

- The cut keeps whole lines and the newest half.
- The reader keeps the newest lines, skips bad lines and counts them.
- The reader refuses a thread id that contains a path.

**The fold**:

- No test file tests the fold itself.
- `first-reply-rescue.test.ts` tests the 20 s notice. There is one notice,
  never two. The first output changes it. A wait pauses it.
- `steer-queue.test.ts` (`:704-1083`) runs the real server with a fake
  engine. It shows that a queued message runs one time after the turn ends.
  It also shows that a late `turn.completed` of an old turn does not end the
  new turn.

**The SSE stream** (`sse-fanout.test.ts`, `sse-replay.test.ts`):

- The server drops screens when the window is slow, but never other frames.
- The server closes a window that is above the limit.
- A closed stream closes only one time.
- The buffer keeps the newest frames inside its two limits.
- `covers` gives the correct result for an empty buffer.

**The client**:

- `live-events.test.ts`: the URL is correct. A runtime frame gets to the
  status before the store. The ping and the stale time work. The cursor
  moves only after a good reload. The delay has a maximum. A hidden window
  does not connect again and again.
- `live-reply.test.ts`:
  - The text grows. The client does not draw reasoning. The last word waits.
  - The live row stays until the stored message is in the transcript, and
    the two never show together.
  - A replayed frame changes nothing.
  - An unsaved item disappears at the turn end. Stop freezes it.
  - After a gap, the client waits for a boundary.
  - A secret that is only partly streamed never shows.
  - "Text, tool, text, tool, text" gives three messages.
  - Each thread has 32 items or fewer.
- `turn-status.test.ts`, `frame-batching.test.ts`, `live-frames.test.ts`:
  the status rules are correct. Ten frames give one render. The frames that
  arrive before an action apply first.

**The UI**:

- `ChatView.live-reply.test.ts` runs in both modes:
  - The reply grows in one row. Bold text shows while the text streams.
  - A partial word waits. The actions are inert.
  - The stored row has the same markup, and it has no second entry
    animation.
  - A failed turn removes the live row.
  - Live text belongs to its thread.
  - The replacement uses the item id when the message frame did not arrive.
- `ChatMarkdown.streaming.test.ts` and `ChatMarkdown.stream-identity.test.ts`:
  - Each prefix of 84 Markdown cases and 150 random documents draws the same
    as the whole text.
  - The component does not parse an open fence.
  - The parse work has a limit.

No test checks the order of all events of a successful turn, from the
driver to the window.

## 7. Ours compared

### 7.1 What we have now

- `bot-protocol` (ours) has `Event { thread_id, turn_id, kind }` and
  `EventKind` with `TurnStarted` and `TurnCompleted { outcome }`
  (`crates/bot-protocol/src/event.rs`).
- Step 2.5 (`docs/code/step-02/2.5-content-and-error-events.md`, ours) adds
  `ContentDelta { stream_kind, delta }`, `ItemCompleted { text }` and
  `RuntimeError { code, message }`. The author has not typed it yet. These
  kinds have no item id. The events have no `event_id` and no time (decision
  D20, open risks).
- `bot-core` (ours) has only `echo_reply`. It has no bus, no store and no
  runner.
- `bot-desktop` (ours) has one synchronous Tauri command, `send_message`,
  that returns the echo (`crates/bot-desktop/src/main.rs`). `ChatPane.tsx`
  waits for the whole answer. There are no events.
- `bot-engine` and `bot-cli` (ours) have no bus code.

### 7.2 What we plan (step 7, `docs/plan/step-07-event-bus.md`)

| PR | Ours | The reference files that it ports |
|---|---|---|
| 7.1 | `bot-core/src/bus.rs`: a `tokio` broadcast channel | `server/harness/bus.ts` (delivery, order), `server/harness/text-items.ts` (item ids) |
| 7.2 | `bot-core/src/runner.rs`: `TurnRunner`, one turn published on the bus | the gate and `attach` of `bus.ts`, and the turn part of the fold in `index.ts:6256-6841` |
| 7.3 | `bot-desktop/src/runner.rs`: the registry behind `TurnRunner` | `index.ts:1485-1486` |
| 7.4 | `bot-desktop/src/events.rs`: from the bus to Tauri events | `broadcast` and `/api/events` (`index.ts:4672-4691`, `:14493-14551`), `server/sse-fanout.ts` |
| 7.5 | `ui/src/features/chat/useTurnEvents.ts`, `ChatPane.tsx` | `src/lib/live-events.ts`, `src/state/live-reply.ts`, `src/state/turn-status.ts`, and the live parts of `ChatView.tsx` and `ChatMarkdown.tsx` |
| step 8 | the store and the event log of a thread | the log part of `bus.ts`, `server/thread-log-rotation.ts`, `server/thread-events.ts`, and the row part of the fold |

### 7.3 Where we are different

| Point | The reference | Ours (plan) |
|---|---|---|
| Transport to the window | HTTP SSE with ids, a replay of 500 frames, and `hello` | Tauri events in one process (D10). No replay yet |
| Delta merge | 50 ms on the bus | Not planned |
| Item id | The bus makes it | Not in the event type (D20, step 2.5) |
| Event id and time | On each event | Not yet (D20 open risk, step 8) |
| Where the text is stored | The fold stores it from `item.completed` | PR 7.5 replaces live text with the `item.completed` text in the window. No store before step 8 |
| Busy | On the task (thread). The bot value is calculated | Not decided (`features.md`, "What to do next", item 2) |
| Order of listeners | Implicit: the order of calls in a file of 15,000 lines | Not decided |
| Row and event | Separate writes. The event goes out before the row | `AGENTS.md`: one transaction before any action |

### 7.4 What step 7 needs from the reference, and what it does not need

Step 7 needs these parts:

- one channel for all turns
- item ids
- a delta that the window adds to a live row
- an `item.completed` that sets the last text
- a `runtime.error` that shows as an error row
- a `turn.completed` that ends the busy state
- the last-word hold and the redaction of live text
- no duplicate row at the replacement.

Step 7 does not need these parts:

- the log file (step 8)
- replay and cursors (one process)
- rooms and goal turns
- progress frames and the first-reply rescue
- pictures
- approvals (step 10).

## 8. Where we can be better

1. **One owner for the turn end, not an order of calls.** The reference
   depends on the order of about 20 `bus.subscribe` calls in thousands of
   lines (`index.ts:5041`, `:7031`). One of its own comments about that
   order is wrong (3.10). Ours: the runner in `bot-core` folds the events of
   a turn itself. It publishes a "turn settled" fact after the state
   changes. The bus only sends events to the listeners. Reason: we do not
   copy a known problem, and there is less code.
2. **"Busy" ends in the same step that stores the turn end.** The reference
   clears "busy" in a `.finally` after the digest and a screen picture
   (`index.ts:6786-6787`). It drains the queue from four places with two
   flags (`:7038-7048`). Ours: in step 8, one transaction writes the
   terminal mark and the idle state of the thread. Then one drain runs.
   Reason: we do not copy a known problem, and there is less code.
3. **The row first, then the event to the window.** The reference
   broadcasts the runtime event before it checks the owner and before it
   stores the row (`index.ts:6311-6323`). Ours (`AGENTS.md`): the store
   writes the row and its event in one transaction. Then the window gets the
   event. Deltas are the exception, because the store never keeps them.
   Reason: we do not copy a known problem.
4. **A second `item.completed` with the same item id has no effect.** The
   reference stores a second row (`index.ts:6351`). Ours: in step 8, a
   unique index on `(thread_id, item_id)`, as the identifier rule of
   decision D17 requires. Reason: the database refuses the wrong state.
5. **The type has the item id, and one place makes it.** The reference adds
   the id on the bus. It keeps an old code path for events with no id
   (`live-reply.ts:118-123`). Ours: `ContentDelta` and `ItemCompleted` have
   a mandatory `ItemId` newtype. The driver or the runner makes it. Reason:
   the compiler refuses a delta with no item, and there is less code (no old
   path).
6. **One definition of the turn end.** In the reference, four modules do
   not agree on the turn end:
   - the bus and `live-reply.ts` accept four kinds of events
   - `stop-turn.ts` accepts only `turn.completed`
   - `turn-status.ts` ignores `runtime.error`

   (`live-reply.ts:78-80`, `stop-turn.ts:32`, `turn-status.ts:54-83`). Ours:
   D20 already makes `turn.completed` the only last event. The window has
   one match on `TurnCompleted`. Reason: the type refuses the wrong state.
7. **What a slow window loses is explicit.** The reference closes the stream
   at 4 MiB, and it replays from a buffer that deltas fill (3.12). Ours: a
   `tokio::broadcast` receiver that falls behind gets
   `RecvError::Lagged(n)`. This is a fact about `tokio`, not a finding about
   the reference. The desktop task then sends one "reload" event, and the
   window loads the thread from the store again. The window never gets a
   replay of deltas. Reason: one recovery path instead of three (replay,
   close, reload). This answers the open choice of step 7: "what a slow
   subscriber of the bus loses".
8. **No replay buffer in step 7.** In one process, a Tauri event arrives, or
   the window was not open. A window that opens reads the store, then
   listens. Reason: less code. The replay of the reference exists for a
   browser over HTTP. D10 keeps that path possible for later.
9. **One place redacts live text.** In the reference, redaction of live text
   occurs in each driver (`openai-chat.ts:643-656`) and again in the window
   (`live-reply.ts:182-186`). The broadcast of the server does not redact
   deltas (`public-reply.ts:3`). Ours: the last-word hold and the redaction
   run one time in `bot-core`, before the event gets to the window, for
   each driver. Reason: a driver that does not redact cannot leak a secret.
   Also, one copy of the rule is less code than two copies. Section 7 of
   [`../changelog.md`](../changelog.md) says that one redaction function
   runs at the store, the log and the window.
10. **The frame types are complete.** The reference adds `seq` and `ping`
    outside its frame type (`index.ts:4677`, `sse-fanout.ts:46`). Ours: the
    Tauri event payload is one `serde` enum in `bot-protocol`. No code adds
    a field by hand. Reason: the compiler refuses a field that the type does
    not have.
11. **One error path for a failed turn.** The reference writes an error row
    only for `runtime.error`. A `turn.completed { ok: false }` with no
    `runtime.error` leaves no row (`index.ts:6627-6636`). Ours: the fold
    writes the error row from `TurnCompleted { outcome: Failed }`. It uses
    the error of the `runtime.error` before it, or a general error. Reason:
    a failed turn always shows.
12. **Do not copy these items:**
    - the global gap flag that hides a reply that streams when the window
      opens (`live-reply.ts:50`)
    - the frame queue with no limit (`app-store.ts:47`)
    - the empty `catch {}` (`index.ts:5371`)
    - the old section of `chat-ui.md`
    - the product name in an error text (`bus.ts:16`).

## 9. Not verified

- What the gate does: `quickFallback.take` and `savedSteps.dispatch.take`
  (`index.ts:1483-1485`).
- What `LiveSteps.observe` and `announce` change, beyond what the tests
  show.
- `batchSaves` (`server/save-batch.ts`), which is around each delivery.
- The listeners inside other modules: the perf host, cloud health, the
  first hour.
- That `task.busy` is still true when the listener at `index.ts:7032` runs
  for a 1:1 turn. We read this in the code. We did not run it.
- Whether an engine sends the same `item.completed` two times.
- How `/api/events` identifies a window (`resolveRequestAuth`,
  `streamPath`).
- Whether `event.raw` gets to the window in a runtime frame. No code that we
  read removes it.
- What `memberFramePayload` and `frameForMember` remove for a team member.
- Whether React mounts the bubble again at the replacement. The row key
  changes, but the tests say that the markup is equal.
- Whether the drivers other than the chat driver mask secrets in deltas.
- The time to fill the replay buffer during a reply (3.12). It is a
  calculation, not a measurement.
- These files belong to the driver gap of batch 2, and we did not read
  them: `server/drivers/*live-reply*.test.ts`,
  `server/drivers/acp/live-reply-matrix.test.ts`,
  `scripts/verify-live-reply.ts` and `server/testing/live-reply-cases.ts`.
- `src/lib/markdown-stream-blocks.ts`, `src/lib/markdown-stream-pieces.ts`
  and `src/components/CodeBlock.tsx`. We did not read them. Their behaviour
  in this file comes from the tests.
- `src/components/InspectorPanel.tsx` and `server/activity.ts`, which read
  the log. We did not read them.
