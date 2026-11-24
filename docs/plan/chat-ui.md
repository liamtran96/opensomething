# Plan: The chat UI of a running turn

The proposals from the research file
[`../research/features/chat-ui.md`](../research/features/chat-ui.md)
(batch 5, reference commit `ad27f0716`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 5, 7, 8, later.
- **State:** all open.
- **The main finding:** the reference sends each `content.delta` to the
  window with no masking. The window masks the text only when it draws it
  (`server/harness/public-reply.ts:1-3`, `src/state/live-reply.ts:183-185`).
  So the raw text is on the wire, in the replay buffer, in the memory of the
  window and in the Inspector. Most other problems are in the swap from the
  live text to the stored row.

## Proposals

- **P122 (step 7, PR 7.5). A larger scope for the status line.** PR 7.5
  also has a status line with "Working", the timer, and "Thinking" or
  "Writing a reply". Only `turn.completed` hides the line. No timer hides
  it, and a `runtime.error` does not end the turn.
  - Why: the plan says only "`turn.completed` ends the working state". The
    reference shows the line for the full turn.
  - Source: `src/lib/turn-tail.ts:5-19`, `src/components/ChatView.tsx:860`,
    `src/state/turn-status.ts:55-69`,
    `src/components/WorkingIndicator.tsx:21-31`, `src/lib/working-time.ts:1-7`.
- **P123 (step 7). A start time on `turn.started`.** `bot-core` writes the
  start time on `turn.started`. The timer and "Worked for" both use it. A
  state `Running { turn_id, started_at }` makes a busy turn with no start
  time impossible. This amends D20, whose open risk says that an event has no
  time.
  - Why: the reference uses the clock of the window when the server stamp is
    missing. "Worked for" starts at the user message, so the two numbers can
    disagree.
  - Source: `server/store.ts:1620-1621`, `src/components/ChatView.tsx:899-902`,
    `src/lib/activity-runs.ts:51-54`.
- **P124 (steps 5 and 8). Usage in the same transaction as the turn end.**
  The store writes the usage of a turn in the same transaction as its turn
  end. `last_turn: Option<TurnUsage>` has optional counts. The window shows
  the cost of the last turn.
  - Why: the reference shows the usage at once and saves it later, so a
    crash loses it. A turn with no report counts as 0 input. The reference
    stores the cost of the last turn and never shows it.
  - Source: `server/store.ts:1816`, `:1829-1840`,
    `server/registry-save.ts:54-55`, `src/lib/usage.ts:126-130`,
    `src/lib/usage.test.ts:180-184`.
- **P125 (step 7, PR 7.5). A simple Markdown stream first.** Parse the full
  text one time for each painted frame. Draw an open code fence as plain
  code with inert actions. Add a block cache only when a long reply is slow.
  - Why: less code. The block and piece cache of the reference is about 310
    lines, and it needs a test of 85 documents to stay equal to a full parse.
  - Source: `src/components/ChatMarkdown.tsx:659-667`, `:877-890`,
    `src/components/CodeBlock.tsx:164`, `:283`,
    `src/lib/markdown-stream-blocks.ts`, `src/lib/markdown-stream-pieces.ts`,
    `src/components/ChatMarkdown.stream-identity.test.ts:197-227`.
- **P126 (step 7, or the first step that adds window text). A test for
  locale keys with no reader.** A test fails when a locale key has no
  reader.
  - Why: the Skill Burger card replaced the "This run" card. The reference
    kept dead keys and an old setting key. This is the problem "a feature
    added, then removed" of `changelog.md` section 5.
  - Source: commit `d7791369e`, `src/locales/en.json:2578`, `:2822`, `:2837`,
    `:2857-2868`, `src/lib/skill-burger.ts:14-22`.
- **P127 (step 7). A runtime test with the reply checks of the reference.**
  A test of `bot-core` with the fake driver checks that each message has one
  id, the streamed text equals the completion, no reasoning text shows, and
  no token is doubled or lost.
  - Why: the reference runs the same checks for each driver, with no real
    engine.
  - Source: `server/harness/text-items.testkit.ts:27-53`,
    `server/testing/live-reply-cases.ts:18-44`,
    `server/drivers/claude-live-reply.test.ts:49`.
- **P128 (gap with no step). The Inspector.** Add the Inspector to "Gaps
  that have no step". It reads the event log of step 8 through the same
  filter as the chat. It shows only redacted events, and it is in Advanced
  mode only. The feature `approval-cards` gave the same point.
  - Why: the Events tab of the reference shows raw live JSON, deltas too.
    Its route computes the filter for private chats and does not use it. The
    Inspector is in the Simple menu, against the design rules of the
    reference.
  - Source: `src/components/InspectorPanel.tsx:106-113`, `:168-234`,
    `:263-267`, `src/components/ChatMoreMenu.tsx:173-180`, `DESIGN.md:359-360`,
    `server/routes/status.ts:52`, `:119-134`, `server/thread-events.ts:200-208`.

## New facts for proposals that exist

- **P25 (step 7, PRs 7.4 and 7.5).** Recommend option b or c: redact the
  live text in `bot-core`, before the event goes to the window. Hold the last
  word. Hold an open `BEGIN … PRIVATE KEY` block until its END line arrives.
  The redaction covers the replay of missed events and the Inspector too
  (from `approval-cards`).
  - Facts: the reference redacts only at draw time, and the window has no
    held secrets, so it masks by shape only. A key block with no END line
    shows unmasked. The voice path of the reference already holds such a
    block. The event log masks each 50 ms chunk, so a secret can be split
    between two chunks.
  - Source: `server/harness/public-reply.ts:1-3`, `:13-16`,
    `server/index.ts:6308-6309`, `:4652-4676`, `src/state/live-reply.ts:20`,
    `:181-186`, `shared/redact.ts:79-92`, `:125-127`, `:140-150`,
    `src/lib/spoken-reply-stream.ts:13-16`, `:49-54`,
    `server/harness/bus.ts:116-125`, `:170`.
- **D20 and P27 (step 7).** One `is_terminal()` function on the event type,
  with a `match` that has no default arm. In the reference, the live reply
  and the bus count a terminal `runtime.error` as a turn end, and the status
  line does not. After such an error with no `turn.completed`, the window
  drops the text and keeps the status line.
  - Source: `src/state/live-reply.ts:78-80`, `server/harness/bus.ts:45-50`,
    `src/state/turn-status.ts:57-60`.
- **P28 (step 7).** A window that opens asks `bot-core` for the open items
  of the thread, then listens. No global gap flag. The gap flag of the
  reference never goes back to false, so a reply that streams when the
  window opens shows nothing until its next boundary.
  - Source: `src/state/live-reply.ts:50`, `:89`, `:148-154`, `:362-369`,
    `src/state/store.tsx:3196-3203`.
- **P35 (step 7).** The window freezes the live text only after the runtime
  accepts the Stop. The Stop button shows in each layout while a turn runs.
  The reference freezes before the request, does not undo the freeze when
  the request fails, and hides the header Stop in Simple mode.
  - Source: `src/lib/stop-turn.ts:70`, `:86-91`,
    `src/state/live-reply.ts:143-145`, `src/components/ChatView.tsx:761`,
    `:1015`.
- **P36 (step 8).** The watchdog ends a stuck turn with
  `turn.completed { outcome: failed }` and an error code. The fix of the
  reference for v0.1.151 clears only the busy flag and sends no turn end, so
  the window keeps its live state until a new turn starts.
  - Source: `server/host/idle-threads.ts:1-3`, `:26-47`,
    `server/turn-watchdog.ts:269-280`, `server/index.ts:4934`.
- **P34 (step 8).** One runtime call `edit_queued(queue_id, text)` changes
  the stored row in one transaction, with the typed refusals
  `AlreadyDispatched` and `NotYours`. The reference has no edit route. An
  edit removes the message and puts the words back in the composer, so the
  message loses its place, its reply target and its mentions.
  - Source: `src/components/Composer.tsx:451-470`,
    `server/request-auth.ts:54`, `:374-375`, `:422-423`,
    `src/state/store.tsx:568`, `:2292-2298`, `server/steer-queue.ts:20-48`.
