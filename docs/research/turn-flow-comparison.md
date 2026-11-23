# One chat turn: the reference project and ours

Read on 2026-11-23, for steps 2.3 (messages) and 2.4 (events). All paths are
in the reference project unless a line says "ours". The `enterprise/`
directory was not read.

## 1. The flow in the reference

1. The UI adds the user message at once, with the id `optimistic-<sendId>`
   (`src/state/optimistic-send.ts:14-24`, `src/state/store.tsx:1631-1649`).
2. `POST /api/bots/:id/messages` with `text`, `threadId`, `sendId`
   (`src/state/store.tsx:2357-2398`, `server/routes/bot-messages.ts:199`).
   The server answers 202.
3. `beginTurn` stores the user row before the driver runs
   (`server/index.ts:7583-7595`). The store adds `id` (UUID), `at` and
   `parentId` (`server/store.ts:1133`).
4. The transcript: stored rows of kind `text` (and a few others) only. Error
   rows, stopped rows and tool rows are not in it
   (`server/delta-context.ts:33-35`). `bot` becomes `assistant`
   (`server/index.ts:6956`). The current user line is not in it
   (`server/index.ts:7711`). Limit: 24,000 bytes and 40 messages
   (`server/context-rebuild.ts:157`, `:194`).
5. `sendTurn(input)` returns `{ turnId }` before the turn ends
   (`server/contracts.ts:249-251`, `:311`; `server/drivers/openai-chat.ts:520`,
   `:930`). The driver makes the turn id.
6. The driver emits events to its listeners
   (`server/drivers/openai-chat.ts:228-237`). The bus stamps an `itemId`,
   merges deltas of one stream for 50 ms, writes each event to the thread log
   and gives it to each subscriber (`server/harness/bus.ts:101-130`).
7. The fold stores a bot row for each `item.completed` with
   `itemType: "assistant_text"` (`server/index.ts:6382-6384`, `:6345-6353`).
   No delta is stored.
8. On `turn.completed`, the last bot text row of the turn gets
   `turnTerminal: true` and `turnCompletedAt` (`server/store.ts:1119-1129`,
   `server/index.ts:6654-6655`).
9. Each runtime event and each store change goes to the UI as an SSE frame on
   `/api/events` (`server/index.ts:4672-4691`, `:6315`, `:4450-4462`).

## 2. The events of the chat driver, in order

Base of each event: `eventId`, `provider`, `threadId`, `turnId`, `createdAt`
(`server/drivers/openai-chat.ts:231-237`).

Success (`server/drivers/openai-chat.ts`):

1. `turn.started` (`:581`)
2. `session.started { sessionId: null, model }` (`:609`)
3. `content.delta { streamKind, delta }`, many times (`:656`)
4. `thread.token-usage.updated`, if the provider sent usage (`:735-744`)
5. `item.completed { itemType: "assistant_text", text }`: the full reply
   (`:746-747`)
6. `turn.completed { ok: true, stopReason: null, cost: null, usage? }`
   (`:923-926`)

Failure: `runtime.error { message, terminal: true }` (`:904-909`), then
`turn.completed { ok: false, stopReason: "error" }` (`:923`). Test:
`server/drivers/openai-chat.test.ts:816`.

Stop: `interruptTurn` aborts the request (`:961-966`). No `runtime.error`.
Then `turn.completed { ok: false, stopReason: "interrupted" }` (`:902`,
`:923`). The server stores a row `stopped: ...` (`server/person-stops.ts:58-70`).

`turn.completed` is the last event of each turn that started.

A failure before the first event: `sendTurn` rejects, no event is sent, and
the server stores the failure row itself (`server/index.ts:8498-8503`).

## 3. What is stored after a failure

- `runtime.error` makes a row: `role: "bot"`, `kind: "activity"`,
  `tool: { name: "error: <cause>", ok: false }`, cause cut at 600 characters
  (`server/index.ts:6627-6636`, `packages/phone-protocol/src/failed-turn.ts`).
- Text that streamed before the failure is not stored: the round has no
  `item.completed`.

## 4. A second message while a turn runs

The composer stays usable. The server steers the text into the running turn
when the engine can take it, and queues it when not
(`server/admission.ts:102-110`, `server/index.ts:7180-7253`). The driver
refuses a second turn on one thread (`server/drivers/openai-chat.ts:518`).

## 5. The UI

- **Live text:** kept outside the store, as temporary rows `live:<key>`
  (`src/state/live-reply.ts:44`, `:87-99`). Only `assistant_text` is drawn.
  `reasoning_text` only sets the status line to "Thinking" (`:88`,
  `src/state/turn-status.ts:68-69`).
- **End of the stream:** `item.completed` sets the full text. The saved
  message then replaces the live row by `itemId` (`live-reply.ts:100-105`,
  `:127-139`, `:246-263`). An unsaved live row is dropped at the turn end
  (`:112-114`).
- **Events that change UI state:** `turn.started` and `turn.completed`.
  `runtime.error` changes nothing by itself: the failure row arrives as a
  message (`src/state/store.tsx:2033-2038`, `:3066-3080`).
- **User message:** right, a bubble, plain text. **Bot message:** left, a
  bubble with the card fill; Markdown (`src/components/ChatView.tsx:396-432`,
  `DESIGN.md:246-252`). The time shows on hover (`ChatView.tsx:530-537`).
- **Working state:** the bot avatar and "Typing..." or "Working" with a timer
  (`ChatView.tsx:1150-1170`). A Stop button shows next to Send
  (`src/components/Composer.tsx:935-951`).
- **Error row:** a red box, a plain sentence, "Details" with the raw cause,
  and Retry on the last row only (`ChatView.tsx:139-210`, `:683-692`). Retry
  sends the last user message again (`ChatView.tsx:913-917`).
- **Empty chat:** the avatar, the bot name, and the description or "Send a
  message to start the conversation." (`src/components/ChatEmptyState.tsx:8-33`).
- **Scroll:** follows the bottom while text streams, stops when the person
  scrolls up, and shows "Jump to latest"
  (`src/hooks/use-transcript-viewport.ts`, `src/lib/bottom-follow.ts`).

## 6. Not verified

- The wrappers around `sendTurn` in `server/index.ts:8326-8353`
  (`savedSteps`, `quickFallback`, `guardTurnDispatch`).
- When the server sets `bot.busy` after a send.
- No reference test asserts the complete event order of a successful turn.
- The CSS result of the bubble classes in `styles.css`.
