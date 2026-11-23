# The chat API driver with streaming

Batch 2, gap 1 of [`../progress.md`](../progress.md): "The chat API driver
with streaming". Rows of [`../features.md`](../features.md):
`custom-engines.md` and "A model connection with no tools". Step 5 of
[`../../plan.md`](../../plan.md), crate `bot-engine`.

Read on 2026-11-23, at commit 3aec210 of the reference project. All paths
are in the reference project unless a line says "ours". The `enterprise/`
directory was not opened.

This file adds to three earlier files and does not repeat them:

- [`../driver-contract.md`](../driver-contract.md) section 4 has a short
  summary of the chat driver. It gives the config, the request, the end of
  the stream, the retry numbers and the rejected key. This file gives the full
  flow, the error paths, the limits and the tests.
- [`../turn-flow-comparison.md`](../turn-flow-comparison.md) section 2 has
  the order of the events of a turn. This file adds the order for each
  error path, and `turn.retrying`.
- [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md) has the tool
  loop. This file touches tool calls only where they change the stream:
  the fragments of a streamed call, and the text that is held back.

Short names used below:

| Short name | Path |
|---|---|
| `chat.ts` | `server/drivers/openai-chat.ts` |
| `compat.ts` | `server/drivers/openai-compat.ts` |
| `responses.ts` | `server/drivers/openai-responses.ts` |
| `protocol.ts` | `server/drivers/openai-chat-protocol.ts` |
| `refusals.ts` | `server/drivers/openai-chat-refusals.ts` |
| `retry.ts` | `server/drivers/retry.ts` |
| `events.ts` | `packages/phone-protocol/src/runtime-events.ts` |
| `bus.ts` | `server/harness/bus.ts` |
| `index.ts` | `server/index.ts` |
| `live-reply.ts` | `src/state/live-reply.ts` |

## 1. In short

A chat API is a web service that runs a language model. The program sends
the conversation in one HTTP request, and the service sends the reply back.
Many services use the same request form, first made by OpenAI: a `POST` to
`<address>/chat/completions`. The reference project calls a service of this
form "OpenAI-compatible". OpenRouter, Groq, Mistral, a local Ollama server
and many others accept it.

**Streaming** means that the service does not wait until the reply is
complete. It sends the reply in small pieces while the model writes it. The
person sees the words appear one by one, and a long reply does not look
like a frozen program.

The pieces come as **server-sent events (SSE)**. SSE is a text format. Each
piece is a line that starts with `data: ` and holds one JSON object (a
**chunk**). The last line is `data: [DONE]`. A piece of new text in a
chunk is a **delta**.

A model that **reasons** writes hidden "thinking" text before its answer.
Some services send this text in the same stream, in a separate field
(`reasoning_content` or `reasoning`). The reference project keeps the two
kinds apart: answer text and reasoning text.

The driver of the reference project does these things:

1. It sends the conversation with `stream: true`.
2. It reads the SSE lines, and changes each chunk into an event
   `content.delta`, with a **stream kind**: `assistant_text` or
   `reasoning_text`.
3. When the stream ends, it sends the full reply in one event
   `item.completed`. That is the text the server saves. The deltas are only
   for the live display.
4. When something goes wrong before any text was shown, it may **retry**:
   send the same request again after a short wait (**backoff**). It sends a
   `turn.retrying` event first. It never retries after text was shown,
   because the person would then see two answers joined.
5. When the service stops sending for too long (an **idle timeout**), it
   stops the request and reports an error.
6. When the person presses Stop, it **aborts** the request (cancels the
   HTTP request) and ends the turn as "interrupted".
7. Each turn ends with exactly one `turn.completed`.

The reference has one shared runtime for all chat services
(`createOpenAIChatRuntime`, `chat.ts:203`). Each service has a small file
that gives options: the address, the body of the request, the timeout,
whether reasoning text is shown (section 3.9).

## 2. Files read completely

Seven subagents read these files, each line. The main session then
checked the key findings against the code. It read these ranges a second
time:

- `chat.ts:236-456`, `:512-530`, `:636-760`, `:880-970`
- `retry.ts:60-70`, `:216-258`
- `compat.ts:17-28`, `:419-440`
- `responses.ts:250-270`
- `bus.ts:15-50`, `:101-170`, and `server/harness/public-reply.ts` (all)
- `index.ts:6286-6296`, `:6616-6642`
- `live-reply.ts:83-123`, `:178-186`, `:230-242`
- `src/state/turn-status.ts:66-70`, `src/lib/activity-runs.ts:1-60`,
  `src/components/StatusActivityRow.tsx` (all)
- `server/first-reply-rescue.ts:9-24`, `server/room-turn-timeout.ts:9-12`
- `docs/verification/chat-ui.md:214-224`
- the tests `openai-chat-stream-retry.test.ts:58-70` and
  `openai-compat.test.ts:1178-1230`

**The streaming core** (in `server/drivers/`): `openai-chat.ts` (999),
`openai-chat-fetch.ts` (24), `openai-chat-protocol.ts` (188),
`openai-chat-refusals.ts` (119), `chat-text-tool-calls.ts` (164),
`chat-announcement.ts` (42), `runtime-notice-error.ts` (15).

**Retry and errors:** `server/drivers/retry.ts` (258),
`server/drivers/engine-errors.ts` (234), `server/drivers/chat-size-limit.ts`
(148), `server/drivers/session-idle.ts` (239), `server/chat-notices.ts`
(209), `server/key-rejections.ts` (47), `server/turn-continuation.ts` (88),
`server/turn-outcome.ts` (157), `shared/provider-safety.ts` (7),
`shared/request-too-large.ts` (13).

**The services** (in `server/drivers/`): `openai-compat.ts` (456),
`openai-responses.ts` (282), `ollama.ts` (187), `ollama-context.ts` (142),
`groq.ts` (103), `cerebras.ts` (106), `mistral.ts` (120), `minimax.ts`
(168), `modelgo.ts` (123), `meta.ts` (121), `greenference.ts` (124),
`grok.ts` (64), `openrouter-free.ts` (139).

**The contract, the callers and the docs:** `server/contracts.ts` (663),
`packages/phone-protocol/src/runtime-events.ts` (213),
`server/runtime/capabilities.ts` (66), `server/first-reply-rescue.ts`
(175), `server/room-turn-timeout.ts` (189), `server/harness/bus.ts` (312),
`server/harness/public-reply.ts` (17), `docs/custom-engines.md` (235),
`docs/verification/openai-tools.md` (212),
`docs/verification/provider-recovery.md` (129).

**The tests:** in `server/drivers/`: `retry.test.ts` (224),
`retry-delay.test.ts` (55), `engine-errors.test.ts` (329),
`runtime-notice-error.test.ts` (72), `openai-chat.test.ts` (1160),
`openai-chat-stream-retry.test.ts` (135), `openai-chat-protocol.test.ts`
(252), `openai-responses.test.ts` (658), `openai-compat.test.ts` (1336),
`openai-compat-reasoning.test.ts` (91), `openai-compat-idle.test.ts` (122),
`openai-compat-reply-wait.test.ts` (28), `openai-context-window.test.ts`
(96), `ollama.test.ts` (537), `ollama-context.test.ts` (299). Also
`server/turn-outcome.test.ts` (181), and the helpers in `server/testing/`:
`fake-openai-live.ts` (247) and its test (175), `sse.ts` (101),
`stream-script.ts` (72).

**The UI:** `src/state/live-reply.ts` (370) and its test (322),
`src/state/turn-status.ts` (123) and its test (112),
`src/components/ChatView.live-reply.test.ts` (211),
`ChatView.live-status.test.ts` (244), `GroupView.live-reply.test.ts` (68),
`TurnPresence.tsx` (256), `RoomTextMessage.tsx` (245),
`SidebarWorkingStep.tsx` (39), `PartlyDoneRow.tsx` (23),
`CancelledTurnRow.tsx` (31), `InspectorPanel.tsx` (270), `ActivityPanel.tsx`
(185), `StatusActivityRow.tsx` (39), all in `src/components/`. In `src/lib/`:
`live-activity.ts` (209), `friendly-activity.ts` (54), `failed-turn.ts`
(51), `stop-turn.ts` (106), `turn-tail.ts` (29), `inspector.ts` (197).
Also `shared/client-cancel.ts` (79), `shared/failed-turn.ts` (1),
`shared/runtime-events.ts` (1).

**Read in ranges only:**

- `server/index.ts` (15,276): 1470-1500, 2225-2330, 4225-4250, 4920-5060,
  5190-5260, 6250-6840, 7000-7060, 7700-7740, 8290-8379, 8595-8660,
  8735-8760, 9870-9890, 10080-10259, 11765-11790, 14726-14765.
- `server/turn-watchdog.ts`: 40-75.
- `src/components/ChatView.tsx` (1227): 150-459, 600-744, 815-934,
  1110-1189. `ChatMarkdown.tsx` (983): 855-983. `GroupView.tsx` (989):
  705-729, 915-944. `MessageActions.tsx` (316): 70-81, 215-229.
  `NowCard.tsx` (71): 47-71.
- `src/lib/live-events.ts` (413): 80-149. `src/lib/activity-runs.ts`:
  1-60. `src/state/store.tsx`: 2033-2045, 3145-3157.
- `src/locales/en.json`: the keys at 2603-2619, 2895-2911, 2934,
  2970-2977.
- `docs/verification/chat-ui.md` (359): 180-359. `DESIGN.md` (420):
  290-354.

## 3. How it works

### 3.1 The start of a turn

1. The host calls `adapter.sendTurn(input)` (`index.ts:8326-8355`). The
   input has the thread, the text, the model, and the earlier messages as
   `transcript` (`server/contracts.ts:161-162`). Chat drivers get the
   conversation this way because they keep no session
   (`server/runtime/capabilities.ts:15`, `:40-48`).
2. `sendTurn` refuses at once, with no event, when there is no key or when
   a turn already runs on the thread: `"a turn is already running on this
   thread"` (`chat.ts:517-518`). The host then saves a failure row itself
   (see `turn-flow-comparison.md` section 2).
3. It makes the turn id and a new `AbortController` for the turn. It also
   makes the list of secrets to hide (`chat.ts:519-536`). The list has the
   API key. It also has each environment value of an integration whose name
   has `key`, `token`, `password`, `secret` or `authorization`. A value
   goes on the list only if it has 8 or more characters.
4. It returns `{ turnId }` at once. The turn runs on in the background
   (`chat.ts:930`).
5. It emits `turn.started` (`chat.ts:581`) and `session.started { sessionId:
   null, model }` (`chat.ts:609`).

### 3.2 The request

`completeOn` (`chat.ts:252-296`) sends one request:

1. It starts the idle timer (section 3.6) before anything else
   (`chat.ts:262-271`). So the timer also covers the wait for the model and
   for the first byte.
2. It joins the turn's abort signal and the idle timer's signal into one
   signal with `AbortSignal.any` (`chat.ts:275-277`). A test checks that
   this happens one time for each request (`openai-compat.test.ts:529`).
3. It builds the body with the service's own `requestBody` function
   (`chat.ts:280`). For the generic service it is (`compat.ts:419-430`):

   ```json
   { "model": "...", "messages": [...], "stream": true,
     "stream_options": { "include_usage": true } }
   ```

   plus the reasoning effort when the person chose one. The comment says
   "Local servers (oMLX in particular) emit stream usage only with
   stream_options.include_usage" (`openai-compat.test.ts:761`).
4. It sends `POST <address>/chat/completions` with the headers
   `authorization: Bearer <key>` and `content-type: application/json`
   (`chat.ts:289-296`). When a message has an image, the request refuses
   redirects (`redirect: "error"`).
5. When the timeout is longer than 300 s, it uses its own HTTP agent with
   no header or body limit (`fetchPastLimit`). The reason: Node's `fetch`
   (undici 7.29 in Electron 43, 8.9 in Node 26) fails a request after 300 s
   with no bytes (`openai-chat-fetch.ts:3-12`).

### 3.3 An HTTP error

When the status is not 2xx (`chat.ts:297-312`):

1. The driver reads the body as text. A failure to read gives `""`.
2. It builds the message `<label> HTTP <status>: <detail>`. The label is the
   service name, or `upstream` for a generic address. The detail is the
   service's own message, cut to 500 characters, with ` (<code>)` when the
   body has a code (`refusals.ts:25-33`).
3. It then looks for a special case, in this order:
   1. a sentence of the service's own (`plainRefusal`, for example
      ModelGo's "balance has run out", `modelgo.ts:45-50`)
   2. a refused route (section 3.10)
   3. a rejected key (`rejectsKey`). The driver then marks the key as
      rejected.
   4. a request that is too large
   5. a refused `tools` parameter
   6. a refused tool call
   7. a refused replay of reasoning text

   Anything else is a plain error.
4. A 2xx answer marks the key as accepted (`chat.ts:313`).

The driver keeps the rejected key in memory only, as the address and the first 32
hex characters of the SHA-256 of the key. The key itself is never stored
(`server/key-rejections.ts:1-10`). A restart forgets it.

### 3.4 Reading the stream

`chat.ts:361-448`:

1. No body: an error (`chat.ts:361-363`).
2. A loop reads the body piece by piece. For each piece:
   1. Reset the idle timer (`chat.ts:433`).
   2. Decode the bytes as UTF-8 and add them to a buffer.
   3. If the buffer is longer than 2,000,000 characters, stop with
      `"provider stream frame exceeded the size limit"` (`chat.ts:434`).
   4. Take each complete line (up to `\n`) off the buffer, trim it (so
      `\r\n` also works) and read it (`chat.ts:436-441`).
3. Reading one line (`sseData`, `refusals.ts:110-119`):
   - A line that starts with `error:` is an error. If its JSON has a number
     `code`, it is read as an HTTP error with that status. The comment:
     llama.cpp before b7200 (seen on b6500) refuses a streamed request with
     HTTP 200 and an `error:` event.
   - A line that starts with `data:` gives its text.
   - Any other line (`event:`, `id:`, a comment, a blank line) is skipped.
   - A `data:` field on more than one line is not joined. Each line is read
     as its own JSON.
4. Reading one chunk (`consumeDataLine`, `chat.ts:376-414`):
   1. `[DONE]` ends the stream.
   2. JSON that does not parse sets a flag "malformed frame", and the
      reader goes on (`chat.ts:383-386`). The turn fails later, at the end
      of the stream (`protocol.ts:162`). The reader ignores a part that
      does not parse at the very end of the stream. The comment calls it
      "an incomplete frame (stop, abort, drop), not a malformed one".
   3. An `error` field in the chunk is an error, also with HTTP 200. So is
      MiniMax's `base_resp.status_code` other than 0 (`refusals.ts:9-20`).
   4. Choice 0 is used: the choice with `index` 0 or with no `index`.
      Other choices are ignored (`chat.ts:390`).
   5. Tool-call fragments go to `ChatToolCalls` (section 3.5).
   6. The last `finish_reason` that is not empty is kept (`chat.ts:396`).
   7. Reasoning text is `delta.reasoning_content ?? delta.reasoning`. It is
      always kept for the next request of the same turn. It is shown only
      when the service's option `reasoning` is on (`chat.ts:397-401`).
   8. Answer text is `delta.content`, or what the service's `contentText`
      makes of it (Mistral can send a list of typed parts,
      `mistral.ts:41-46`).
   9. Reasoning goes out first, then the answer text (`chat.ts:403-410`).
   10. Usage is `chunk.usage`, or `chunk.x_groq.usage` for Groq. A later
       usage replaces an earlier one (`chat.ts:411-412`).
5. The end of the stream (`chat.ts:418-431`):
   1. Read what is left in the buffer as a last line.
   2. If that line is `data: [DONE]`, or a `finish_reason` came, the stream
      ended well. The comment: MiniMax's `api.minimax.io/v1` closes the
      connection after the `finish_reason` chunk and never sends `[DONE]`.
   3. If no choice came at all, try to read the rest of the buffer as one
      JSON error body. This catches a service that answers 200 with a JSON
      error and an event-stream content type (tests
      `openai-chat.test.ts:816-829`).
   4. Otherwise: `StreamTruncatedError("Stream ended before completion")`.
6. The reader is always cancelled at the end (`chat.ts:443-445`).
7. After the loop: if the turn was aborted, throw. If no choice came:
   `"provider returned no streaming completion choice"` (`chat.ts:446-447`).
8. A response with the type `application/json`, although streaming was
   asked for, is read as one JSON reply (`chat.ts:320-359`).

### 3.5 Tool-call fragments

A streamed tool call comes in fragments: the name and the arguments are cut
into pieces across chunks. `ChatToolCalls` joins them (`protocol.ts:79-188`):

- A fragment goes to the slot of its `index`. With no `index` (Gemini sends
  each call whole), it goes to the slot with the same `id`, or to a new
  slot (`protocol.ts:152-158`).
- `null` or `""` in a later fragment counts as "not sent", because
  DashScope/Qwen sends the id only in the first one (`protocol.ts:111-113`).
- A changed id is an error. A `type` other than `function` is an error.
- Limits: 32 calls in one reply, 256,000 characters of arguments in total,
  64 characters for a name, 4,000,000 characters of `reasoning_details`
  (`protocol.ts:14-18`).
- At the end, a `finish_reason` other than `null`, `tool_calls`,
  `function_call` or `stop` with calls (for example `length`) is "provider
  tool calls were truncated or malformed" (`protocol.ts:160-187`).

### 3.6 The idle timeout and the liveness probe

1. The idle timer is `setTimeout(timeoutMs)`. When it fires, it aborts the
   request with `"Streaming idle timeout elapsed"` (`chat.ts:264-269`).
2. It restarts on each piece of the body. So a slow reply that keeps
   sending is never stopped (test `openai-compat.test.ts:1232-1294`: three
   pieces 100 s apart pass a 180 s limit).
3. There is no limit on the total time of a reply.
4. The values are in section 3.9. Most services use 180 s. The xAI service uses
   120 s. Meta uses 600 s ("Muse reasons privately and streams nothing
   until it answers", `meta.ts:112-113`). The generic service takes
   `OPENMAUS_OPENAI_COMPAT_IDLE_TIMEOUT_MS` (1,000 to 2,147,483,647), or the
   per-connection setting `replyWaitMinutes` (a whole number from 1 to 60),
   which wins (`compat.ts:17-23`, `:107-113`, `:434`).
5. For a server on this computer or this network (loopback, `.local`,
   `10.*`, `192.168.*`, `172.16-31.*`, IPv6 `fc`/`fd`), the driver also
   runs a **liveness probe**: each 30 s it asks `GET <address>/models`
   (`compat.ts:24-34`, `:435`, `chat.ts:239-250`).
   - Any HTTP answer, a 5xx too, resets the count of misses.
   - After 3 misses in a row, it stops the reply with the notice "The model
     server at <host> stopped answering, so the reply was stopped." (key
     `chat.notice.modelServerStoppedAnswering`).
   - This error is never retried (`chat.ts:726`).
   - So the probe does not stop a local model that is slow to send its
     first word, while the server still answers (test
     `openai-compat-idle.test.ts:95-113`).
   - The probe stops a server that froze soon, long before the idle limit
     (`:75-93`).

### 3.7 From deltas to events

`chat.ts:636-680`:

1. For each attempt, the driver keeps two flags: `streamed` (any delta
   came, reasoning too) and `answerStreamed` (answer text came).
2. **Text held back for tool calls written as text.** This applies only
   to a local model with tools (`chat-text-tool-calls.ts:139-156`).
   - `TextCallHoldback` shows nothing while the reply starts with `{` or a
     backtick. Such a reply may be one tool call written as JSON.
   - It holds back a tail that may be the start of `<tool_call>` or
     `<function=`.
3. **Text held back for secrets.** `delta()` adds the new text to the
   text it held. It replaces each whole secret with `[redacted]`. Then it
   holds back the longest tail that could be the start of a secret. The comment: "A
   configured credential can straddle chunks: hold any suffix that could be
   its prefix" (`chat.ts:643-657`).
4. It emits `content.delta { streamKind, delta }` with the visible part
   (`chat.ts:656`).
5. After a good stream, it releases what was held and flushes both kinds
   (`chat.ts:666-679`).
6. Usage: the driver adds the round's usage to the turn's totals and emits
   `thread.token-usage.updated` with the totals and `contextTokens` = this
   round's input + output (`chat.ts:733-744`).
7. The reply text is the answer text. If the answer is empty and there is
   no tool call, the reasoning text becomes the reply (`chat.ts:746`, test
   `openai-compat.test.ts:597-638`).
8. If the reply is not empty: `item.completed { itemType: "assistant_text",
   text }` (`chat.ts:747`).
9. Then two checks: an empty reply with no tool call is `"provider returned
   an empty response"`, and a `finish_reason` other than `stop` is
   `"provider did not finish the response (<reason>)"` (`chat.ts:754-758`).
   These come after `item.completed`, so the window gets the reply and then
   an error for the same round.

The bus of the server then joins the deltas of one stream that come
within 50 ms (`DELTA_MERGE_MS`, `bus.ts:116-126`). It sends a waiting delta
before any other event of the thread. This part belongs to gap 2 of
batch 2.

### 3.8 Retry

The decision is in the `catch` of each attempt (`chat.ts:681-731`). The
cases are tried in this order:

1. **Too many tools** (nothing streamed, no call handled, not aborted): list
   fewer tools, emit `runtime.notice`, then `turn.retrying { attempt: 1,
   delayMs: 0, reason: "tool_limit" }`, and send again.
2. **Reasoning replay refused** (nothing streamed): remove
   `reasoning_content` from all messages and send again, with no event.
3. **Request too large** (status 413, or a "too large" or
   `context_length_exceeded` body). The driver builds a smaller request
   (`chat-size-limit.ts:101-144`). It removes images first, then long tool
   output, then the oldest messages. It emits `turn.retrying { attempt:
   <count of resends>, delayMs: 0, reason: "request_too_large" }` and sends
   again. At
   most 1 resend, or 2 when the service gave its window size
   (`chat-size-limit.ts:50`).
4. **Tool call refused** (Groq `tool_use_failed`, oMLX `invalid_tool_call`
   or `incomplete_tool_call`): if no answer text streamed, `turn.retrying {
   reason: "tool_use_failed", delayMs: 0 }` and send again with no wait.
   Reasoning text alone does not stop this retry (test
   `openai-chat.test.ts:861-879`).
5. **Tools parameter refused**, when only the question tool was offered:
   drop the tools and send again, with no event.
6. **Backoff retry.** The driver gives up (throws) when any of these is
   true (`chat.ts:725-726`):
   - The service did not opt in (`retryScale` undefined), and the error is
     not a truncated stream.
   - The turn was aborted.
   - Any delta streamed in this attempt, reasoning too.
   - A tool call ran in this turn.
   - The error is the liveness notice.
   - The error is not a truncated stream, and it is a protocol error or the
     classifier says it is not transient.
   - The attempt count is 2 or more.

   Otherwise: `delayMs = computeBackoff(attempt++)`, emit `turn.retrying {
   attempt, delayMs, reason }`, wait `delayMs * retryScale` in a wait that a
   Stop ends at once (`interruptibleDelay`), then send again
   (`chat.ts:727-730`).

The numbers (`retry.ts:6-9`, `:225-229`):

- `RETRY_MAX_ATTEMPTS = 3`. The backoff retry and the tool-call retry share
  one counter, so together they send at most 3 requests. The other resends
  (too many tools, reasoning replay, request too large, tools parameter) do
  not use this counter. So one turn can send more than 3 requests.
- Backoff bases 1 s, 3 s, 8 s, with ±25% random spread. Attempt 0 waits
  0.75-1.25 s, attempt 1 waits 2.25-3.75 s. The chat driver never reaches
  the 8 s step, because it stops at attempt 2.

Only `openai-compat` and `grok` set `retryScale` (`compat.ts:439`,
`grok.ts:55`). The value comes from a test environment variable
(`FAKE_OPENAI_COMPAT_RETRY_SCALE`, `FAKE_GROK_RETRY_SCALE`) and is 1 when it
is not set. So Groq, Cerebras, Mistral, MiniMax, ModelGo, Meta and
Greenference retry only a truncated stream, and never a 429 or a 5xx.

**The classifier** (`classifyError`, `retry.ts:188-214`) reads the error
message as text:

1. A safety block of the service ("blocked by our safety systems" and
   similar, `shared/provider-safety.ts:3`) is never retried, even inside a
   503.
2. The classifier reads the terminal words next (`retry.ts:60-76`):
   - `401`, `403`, "unauthorized", "invalid api key" give `auth`.
   - Usage-limit words, `402`, "quota", "billing", "subscription" give
     `quota`.
   - "model not found" gives `unknown_model`.
   - `400`, `422`, "malformed" give `invalid_request`.
   - `404` gives `not_found`.
   - "interrupted", "cancelled by user" give `interrupted`.
3. Then it reads the HTTP status in the forms `HTTP 409`,
   `(status 409 ...)` or `API Error: 409` (`retry.ts:105`). 429 gives
   `rate_limited`, and 408 gives `timeout`. 409 gives `server_error` only at
   OpenAI's own address, because OpenAI's SDK retries a 409
   (`retry.ts:143-184`).
4. Then transient words: `429`, "rate limit", "overloaded", any number from
   500 to 599, "ECONNRESET", "fetch failed", "socket hang up", "timed out"
   (`retry.ts:34-46`).
5. Nothing matched: terminal, reason `unknown`.

The reason is a plain `string` (`retry.ts:31`). The values in the events
are listed in `server/perf/turn-record.ts:24-26`.

### 3.9 The services

All of these call `createOpenAIChatRuntime` and use `/chat/completions`.

| Service | File | Reasoning shown | `stream_options` | Idle limit | Retries a 429 or 5xx |
|---|---|---|---|---|---|
| Generic, OpenRouter, OpenAI, Gemini, local servers | `compat.ts` | yes | yes | 180 s, or 1-60 min | yes |
| Groq | `groq.ts` | yes, replayed as `reasoning` | no (usage in `x_groq.usage`) | 180 s | no |
| Cerebras | `cerebras.ts` | yes, replayed as `reasoning` | yes | 180 s | no |
| Mistral | `mistral.ts` | no | no | 180 s | no |
| MiniMax | `minimax.ts` | yes, with `reasoning_split: true` | yes | 180 s | no |
| ModelGo | `modelgo.ts` | yes | no | 180 s | no |
| Meta | `meta.ts` | yes | yes | 600 s | no |
| Greenference | `greenference.ts` | yes | no | 180 s | no |
| xAI | `grok.ts` | no | no | 120 s | yes |

`openrouter-free.ts` makes no runtime. It wraps the instance of the generic
service (`openrouter-free.ts:94-139`). A first turn with no model waits up
to 4 s for the model list. The wrapper changes each `runtime.error` message
into a plain sentence for credits, privacy, tools and the free-model
limit.

With no `reasoning` option (Mistral, xAI), the reasoning deltas of the
service are dropped with no notice (`chat.ts:399`).

### 3.10 The Responses API

OpenAI has a second API, `POST /responses`, with a different event format.
The reference uses it only in one case: at the address
`https://api.openai.com/v1`, when a reasoning model refuses tools on
`/chat/completions` (`responses.ts:35-70`). At any other address it sends
`reasoning_effort: "none"` on `/chat/completions` instead. A model only
moves forward (`chat` → `responses` → `chat-reasoning-off`), so the resend
cannot loop.

The reader (`readResponsesStream`, `responses.ts:157-282`):

- `response.output_text.delta` and `response.refusal.delta` give
  `assistant_text`. `response.reasoning_summary_text.delta` gives
  `reasoning_text`.
- `response.completed` and `response.incomplete` end the stream.
- `response.failed` and `error` become an HTTP-like error: 429 for
  `rate_limit_exceeded`, 500 for `server_error`, else 400.
- Tool calls come whole, from `response.output_item.done`.
- Frame limit 16,000,000 characters, because `response.created` repeats
  the instructions and the tools.
- An early end is a protocol error, `"Stream ended before completion"`
  (`responses.ts:257`), not `StreamTruncatedError`. So a cut Responses
  stream is never retried, while a cut chat stream is.

Our plan does not have this API (section 7).

### 3.11 Stop (abort)

1. The person presses Stop. The window calls `stopLiveReply` (later deltas
   are ignored) and `POST /api/bots/:id/requests/:requestId/interrupt`
   (`src/lib/stop-turn.ts:70`, `index.ts:14730-14754`).
2. The host calls `adapter.interruptTurn(threadId)` with no turn id
   (`index.ts:2229-2245`).
3. The driver aborts the turn's controller and waits until the turn is over
   (`chat.ts:961-966`). There is no limit on this wait.
4. The request, the read and the backoff wait all stop at once.
5. The turn's `catch` sets `stopReason = "interrupted"` (`chat.ts:887-890`).
6. No `runtime.error` is sent, unless the tools could not be closed
   (`chat.ts:904`).
7. No `item.completed` is sent for the partial text. The tail held back for
   secrets is never sent.
8. `turn.completed { ok: false, stopReason: "interrupted" }` (`chat.ts:923`).
9. If the person sent a message during the turn that the model did not
   read, `runtime.notice` with `chat.notice.unreadMessage` comes before it
   (`chat.ts:903`).

### 3.12 The end of a turn

`chat.ts:887-927`:

1. On an error, `failure` is the redacted message, cut to 2,000
   characters.
2. The driver sends `runtime.error` when there is a failure and the turn
   was not aborted. It also sends it after a Stop when the tools could not
   be closed (`chat.ts:904`):

   ```json
   { "type": "runtime.error", "message": "...", "text": { "key": "..." },
     "terminal": true, "partial": true }
   ```

   `message` is the raw line for a generic address, else a plain sentence
   (`plainFailure`, `server/drivers/engine-errors.ts:212-215`). `text` is
   there only for a notice error. `terminal` is `!aborted`. So it is false
   only after a Stop with a failed tool cleanup. `partial` is there only for `stopReason: "tool_error"`.
3. When the model-step limit was spent, a handoff file is written and
   `cap.exhausted` is sent (`chat.ts:910-921`). This file is not redacted
   (`server/turn-continuation.ts:42-69`).
4. `turn.completed { ok, stopReason, cost: null, usage? }`. `stopReason` is
   `null`, `"error"`, `"interrupted"`, `"tool_error"` or
   `"incomplete_action"`. `cost` is always `null` when streaming. `usage` is
   there only when the service sets `includeUsageInCompleted`, or a tool
   ran.

### 3.13 The order of events

| Case | Events |
|---|---|
| Success | `turn.started`, `session.started`, `content.delta` × n, `thread.token-usage.updated`, `item.completed`, `turn.completed { ok: true }` |
| Retry before any delta | `turn.started`, `session.started`, `turn.retrying`, (wait), `content.delta` × n, ... as success |
| Error after a delta, or an error that is not retried | `content.delta` × n, `runtime.error { terminal: true }`, `turn.completed { ok: false, stopReason: "error" }` |
| `finish_reason: "length"` | `content.delta` × n, `thread.token-usage.updated`, `item.completed`, `runtime.error "provider did not finish the response (length)"`, `turn.completed { ok: false }` |
| Stop | `content.delta` × n, (`runtime.notice`), `turn.completed { ok: false, stopReason: "interrupted" }` |
| Refused before the turn | No event. `sendTurn` rejects |

### 3.14 The host

The host handles the driver's events in one listener
(`index.ts:6256-6840`):

- Each event goes to all clients as `{ kind: "runtime", event }`
  (`index.ts:6311-6316`). The final text of `item.completed` is redacted
  again. The deltas go out "as the engine writes them"
  (`server/harness/public-reply.ts:1-3`): the host does not redact them, so
  only the driver's own redaction (section 3.7) protects them.
- `content.delta` never becomes a message. The bus writes the joined
  deltas to the thread's event log, redacted (`bus.ts:159-170`).
- `item.completed` becomes the saved reply (`index.ts:6382-6384`).
- `turn.retrying` becomes a saved activity row with the name `retrying —
  attempt <attempt + 1>/3 in <seconds>s — <reason>`
  (`index.ts:6618-6624`).
- `runtime.notice` becomes a saved row `notice: <message>`, cut to 400
  characters (`index.ts:6626`).
- `runtime.error` becomes a saved failure row, or a "stopped" row when the
  person stopped the turn (`index.ts:6627-6636`).
- `thread.token-usage.updated` is kept in memory, and the last one replaces
  the one before (`index.ts:6637-6642`). It is used only when
  `turn.completed` has no `usage` (`index.ts:6714`).

Three timers of the host watch a turn:

- **First-reply notice:** after 20 s with no output of the AI, a row says
  that the bot is still waiting (`server/first-reply-rescue.ts:11-24`).
  `turn.retrying` does not count as output, so a long retry shows this
  notice.
- **Room turn limit:** 5 min with no progress (60 min while a tool runs).
  `turn.retrying` is not progress (`server/room-turn-timeout.ts:9-12`).
- **Direct-turn watchdog:** 20 min with no event, 2 h with a tool running
  (`index.ts:4922-4997`).

## 4. The data

**The event union** (`events.ts:24-211`). The base of each event, quoted:

```ts
interface RuntimeEventBase {
  eventId: string; provider: DriverKind; providerInstanceId?: InstanceId; threadId: ThreadId;
  createdAt: string; turnId?: TurnId; itemId?: string; requestId?: string;
  raw?: { source: string; payload: unknown };
  synthetic?: boolean;
}
```

The members that this feature sends:

| Event | Fields | Line |
|---|---|---|
| `content.delta` | `streamKind: "assistant_text" \| "reasoning_text"`, `delta: string`, `botId?` (the room member that speaks) | `:128` |
| `turn.retrying` | `attempt` ("1-based: the retry about to be launched"), `delayMs`, `reason: string` | `:53-60` |
| `item.completed` | `itemType: "assistant_text"`, `text` | `:123` |
| `thread.token-usage.updated` | `input`, `output`, `cachedInput?`, `contextTokens?`, `contextWindow?`, `reasoning?` | `:181-190` |
| `runtime.error` | `message`, `partial?`, `setup?`, `terminal?`, `stalled?`, `limitResetsAt?`, `limit?`, `text?`, and more | `:191-203` |
| `runtime.notice` | `message`, `text?` | `:204-206` |
| `turn.completed` | `ok`, `stopReason?`, `cost?`, `denials?`, `usage?` | `:61-71` |

**A chunk of the stream**, as the tests send it
(`openai-chat-stream-retry.test.ts:24-25`, `openai-chat.test.ts:841-843`):

```text
data: {"choices":[{"index":0,"delta":{"reasoning_content":"user said hi"}}]}

data: {"choices":[{"index":0,"delta":{"content":"hi"}}]}

data: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":1,"completion_tokens":1}}

data: {"choices":[],"usage":{"prompt_tokens":5,"completion_tokens":9}}

data: [DONE]
```

**The result of one request** (`chat.ts:56-64`):

```ts
interface Completion { text: string; reasoning: string; usage: Usage | null; toolCalls: ChatToolCall[];
  finishReason: string | null; protocolReasoning: string; protocolReasoningDetails: Record<string, unknown>[];
  responseOutput?: ResponseItem[]; }
interface Usage { input: number; output: number; cachedInput?: number; }
```

**What is stored and where:**

- The reply: one chat message for each `item.completed` (see
  `turn-flow-comparison.md` section 1).
- The deltas: no message. The joined deltas are in the thread's event log
  `events/<threadId>.ndjson`, redacted, mode 0600 (`bus.ts:159-170`).
- The retry and the notice: an activity row each (section 3.14).
- The raw request and reply: the redacted native log `native/<thread>.ndjson`
  (`docs/verification/openai-tools.md:195-197`).
- The rejected key: in memory only (section 3.3).
- The route of each model (section 3.10): in memory only, for the life of
  the instance (`responses.ts:46`).
- The reasoning text of a round: kept in the messages of the same turn
  only, so the next request can send it back (`chat.ts:216-220`). It is not
  saved.

## 5. The UI

The window keeps the streamed text outside its main store, in two small
stores (`src/lib/live-events.ts:134-144`):

**The live reply** (`live-reply.ts`):

1. Only `content.delta` with `assistant_text` is kept. Reasoning text is
   dropped here (`live-reply.ts:88`).
2. The text grows in an item of the thread, keyed by `itemId`. A new item
   drops the earlier items that are not done: "The server opens a message
   only once the one before it is over" (`live-reply.ts:96-99`).
3. An event seen before is ignored, so a replayed stream does not double
   the text (`live-reply.ts:65-70`).
4. The window shows the text only up to the last space or new line, and
   redacts it (`live-reply.ts:182-186`). The comment: "The last word waits
   for the space after it, so a secret is masked whole or not shown".
5. A text that is only a client-cancel sentence ("operation was aborted"
   and similar) shows nothing (`shared/client-cancel.ts:22-31`).
6. `item.completed` replaces the text with the final text and marks it
   done. The live row stays until the saved message is in the transcript,
   and is then dropped in the same render. The saved bubble does not play
   its entrance animation again (`live-reply.ts:100-105`, `:246-263`).
7. `turn.completed`, `cap.exhausted`, `session.exited` and `runtime.error`
   with `terminal: true` drop every item that was not saved
   (`live-reply.ts:78-80`). So a stopped or failed reply disappears from the
   window.
8. Limits: 32 items for each thread, 200 threads, 4096 seen events
   (`live-reply.ts:37-42`).
9. While a reply streams, its actions are hidden and inert, and the
   Markdown is parsed one block at a time (`src/components/ChatMarkdown.tsx:870-885`).

**The status line** (`src/state/turn-status.ts`):

- A `reasoning_text` delta sets the status "thinking". An `assistant_text`
  delta sets "reply" (`turn-status.ts:68-69`).
- The text (`src/locales/en.json`): "Thinking" (2895), "Writing a reply"
  (2934), "Working" (2897). Simple mode shows "Typing…" (2898) or a
  friendly phrase such as "Thinking it through" (2908).
- A line "nothing new for N min" is added after a silence
  (`src/components/TurnPresence.tsx:74-82`).

**The states:**

| State | What the window shows |
|---|---|
| Empty, before the first delta | The working line: "Working · 1m 12s" |
| Busy, reasoning | "Working · 1m 12s · Thinking". The reasoning text itself is not shown |
| Busy, writing | The bubble grows word by word. The line says "Writing a reply" |
| Retrying | A saved row `retrying — attempt 2/3 in 1s — rate_limited`. It is an activity row that is not a notice. So the transcript treats it as a done tool step, and may fold it into the turn's run of steps (`src/lib/activity-runs.ts:17-24`, `:33-38`). The live stores ignore `turn.retrying` |
| Notice | A grey pill with an info icon and the text (`src/components/StatusActivityRow.tsx:32-37`) |
| Error | The live bubble disappears. A saved failure row in a danger colour, with "Details" and "Retry" (`ChatView.tsx:139-210`) |
| Partly done | "Partly done. The reply came back, but a step didn't work, ..." (`en.json:2618`) |
| Stopped | The live bubble disappears. "Stopped" and "You stopped this." (`en.json:2604-2605`) |

The reasoning text is visible only in the developer Inspector, folded to a
119-character preview (`src/lib/inspector.ts:26`, `:157-170`).

`docs/verification/chat-ui.md:216-223` says that the desktop shows a reply
only once it is finished. That is wrong: the same file at `:264-299` and the
code stream the words live.

## 6. The tests

The chat tests replace `fetch` with a function that returns a fixed SSE
string (`openai-chat.test.ts:20`). One test sends a body in two pieces by
hand (`:738-777`). The idle tests use a real `node:http` server
(`openai-compat-idle.test.ts:8-51`) or fake timers
(`openai-compat.test.ts:1178-1230`). The Responses tests have a real server
that can keep a stream open (`openai-responses.test.ts:98-153`). There is
no shared fake chat server.

What the tests guarantee:

**The end of the stream** (`openai-chat.test.ts:714-851`):

- End of the body after `finish_reason`, with no `[DONE]`, is a good end
  (`:715`).
- A last frame with no new line is read (`:727`), also when it is split
  across two pieces (`:738`).
- A frame cut after `finish_reason` is a good end. The driver drops the
  cut part (`:789`).
- `[DONE]` alone, with no `finish_reason`, is a good end (`:810`).
- A 200 answer whose body is a JSON error is an error (`:816`, `:824`).
- End of the body before `finish_reason` is `runtime.error "Stream ended
  before completion"` and `stopReason: "error"`, not "interrupted" (`:831`).
- Reasoning then answer: the stream kinds are `reasoning_text`, then
  `assistant_text`, and a usage chunk after `finish_reason` is still read
  (`:839`).
- `<think>` tags in the content stay in the reply text (`:715-721`).

**Retry** (`openai-chat-stream-retry.test.ts`, `openai-chat.test.ts`):

- A truncated stream is sent again, with one `turn.retrying { attempt: 1,
  reason: "stream_truncated" }`, and the turn ends well (`:50`).
- After 3 truncated attempts: attempts `[1, 2]`, 3 requests, then the error
  (`:60`).
- No resend after answer text streamed (`:69`), and no resend after a tool
  ran in the turn, so the tool runs once (`:80`).
- A refused tool call is sent again with `delayMs: 0`, at most 3 requests,
  and never after answer text (`openai-chat.test.ts:868-916`).
- The driver retries a 429, and a 409 only from `api.openai.com`. Three
  429 answers end with the last error (`:1133-1160`).
- The liveness notice is not retried (`:1071`).
- A network error and a 503 are retried (`openai-compat.test.ts:324-346`).
- The backoff: exact at the middle, spread within ±25%, and a Stop during
  the wait releases the timer (`retry.test.ts:172-190`,
  `retry-delay.test.ts`).

**Timeouts** (`openai-compat.test.ts`, `openai-compat-idle.test.ts`):

- 185 s with no new piece ends the turn with `ok: false` (`:1178`).
- Pieces 100 s apart never time out (`:1232`).
- A JSON answer with no body, a 400, a truncated stream and a Stop all end
  in 5 s, with no `item.completed` (`openai-compat-idle.test.ts:8-51`).
- A frozen local server ends the turn soon. A slow first word on a live
  server does not (`:75-113`).

**Reasoning** (`openai-compat.test.ts:534-638`): reasoning text is a
`reasoning_text` delta and is not in `item.completed`, except when the
answer is empty.

**The window** (`src/state/live-reply.test.ts`,
`src/components/ChatView.live-reply.test.ts`):

- The window leaves out the reasoning text.
- The last word waits for the space after it.
- The window does not show a half-typed secret.
- A replayed frame does not double the text.
- The end of a turn and a terminal error remove an unsaved reply.
- The saved bubble replaces the live one with no second animation.

**Not tested:**

- an idle timeout on the chat stream with a real server (only fake timers
  and Responses)
- a Stop in the middle of a streamed chat reply
- a 5xx retry on the chat path other than through `compat.ts`
- `\r\n` line ends
- a malformed frame in the middle of a stream
- more than one choice
- `finish_reason: "length"` on the chat path
- a truncation after reasoning text only

## 7. Ours compared

**What we have** (ours):

- `bot-protocol`: `Event` (thread, turn, kind) and `EventKind` with
  `turn.started` and `turn.completed { outcome }`
  (`crates/bot-protocol/src/event.rs`). Decision D20 adds `content.delta`
  with a stream kind, `item.completed` and `runtime.error` with a code, in
  step 2.
- `bot-engine`: empty (`crates/bot-engine/src/lib.rs`).
- `bot-core`, `bot-cli`, `bot-desktop`: an echo. No driver, no bus.

**What we plan:**

- Step 3: the `Driver` trait, with `send_turn` that returns a stream of
  events, and `interrupt`.
- Step 5, in
  [`../../plan/step-05-chat-driver.md`](../../plan/step-05-chat-driver.md).
  It has six pull requests:
  - 5.1: the wire types
  - 5.2: an SSE parser with no I/O
  - 5.3: `reqwest` and a fake server
  - 5.4: the driver
  - 5.5: failures as `runtime.error`
  - 5.6: the registry entry

**Where each part goes:**

| Reference | Ours |
|---|---|
| `chat.ts:361-448` (reading the stream), `refusals.ts:110-119` (`sseData`) | `bot-engine`, `chat/sse.rs` (5.2) |
| `chat.ts:41-76` (message and chunk types), `compat.ts:419-430` (body) | `bot-engine`, `chat/wire.rs` (5.1) |
| `chat.ts:252-296`, `:516-930` (request, turn, deltas) | `bot-engine`, `chat/driver.rs` (5.4) |
| `chat.ts:297-312`, `refusals.ts`, `engine-errors.ts` (errors) | `bot-engine`, `chat/driver.rs` (5.5), and an error type |
| `retry.ts` (classify, backoff, wait) | `bot-engine`, a new `chat/retry.rs` (not in the plan yet) |
| `chat.ts:643-657` (secret hold-back) | `bot-engine`, with the redaction of step 6 in `bot-core` |
| `compat.ts:17-28`, `:94-113` (config, timeouts) | `bot-engine`, `config.rs` and `registry.rs` (5.6) |
| `live-reply.ts`, `turn-status.ts` | `bot-desktop/ui`, step 7.5 |
| `index.ts:6616-6642` (rows for retry and notice) | `bot-core`, step 8 (the store) |

**Where we differ:**

- **The end event.** Same rule: `turn.completed` is always last, a Stop
  sends no `runtime.error`. D20 already chose one `outcome` in place of
  `ok` and `stopReason`.
- **`turn.retrying`.** The reference has it. D20 does not. Without it, a
  retry is a silent wait of up to 4 s.
- **`thread.token-usage.updated`.** The reference has it. D20 does not. D20
  has no usage at all yet.
- **`runtime.notice`.** The reference has it. D20 does not.
- **The Responses API, the route of each model, MiniMax, Groq's
  `x_groq`, Ollama aliases, the liveness probe, `fetchPastLimit`.** Not in
  our plan. The plan has one generic chat service.
- **The text held back for tool calls written as text.** Not needed until
  tools (step 12).
- **Error codes.** D20 has `setup`, `engine_failed`, `internal`. The
  reference has a free message, three flags and a reason string.

## 8. Where we can be better

1. **The retry rule as a type, not a 7-part condition.** The reference
   decides on one line with seven conditions (`chat.ts:726`), and the
   tool-call retry has its own copy with `answerStreamed` in place of
   `streamed` (`chat.ts:712`). An attempt can carry a state `NothingShown`
   or `Shown`, set by the code that sends the first delta. Only
   `NothingShown` can be retried. The compiler then refuses a retry after
   text, and the rule is in one place.
2. **Classify errors by their kind, not by the words of the message.** The
   reference matches regular expressions on the message text. It reads the
   terminal words before the status. So it reads
   `HTTP 503: ... subscription ...` as `quota`, and does not retry it
   (`retry.ts:205-209`). It also reads any number from 500 to 599 in a
   body, for example "max 500 tokens", as a server error
   (`retry.ts:37`). In Rust the error is an enum from the
   start: `Http { status, body }`, `Connect`, `Idle`, `Truncated`,
   `Protocol`. The status decides, and the body is only for the message.
   Less code, and the bug cannot happen.
3. **One reason type.** The reference's `reason` is a `string`
   (`retry.ts:31`). The classifier returns `"provider_safety"`, but that
   value is not in its own union (`retry.ts:191`). An enum with `serde` gives the same JSON and a
   closed list.
4. **One attempt counter, and the real wait in the event.** In the
   reference, `tool_limit` always says attempt 1, `request_too_large`
   counts its own resends, and the others share `attempt`
   (`chat.ts:689`, `:706`, `:714`). `delayMs` is the wait before it is
   multiplied by `retryScale` (`chat.ts:728-729`). The host prints
   `attempt + 1` of 3, so the first retry reads "attempt 2/3"
   (`index.ts:6622`). One counter in the driver, and an event that says
   "attempt 2 of 3, wait 1.2 s" with the real numbers.
5. **All services retry the same way.** In the reference, only the generic
   service and the xAI service retry a 429 or a 5xx (`compat.ts:439`, `grok.ts:55`).
   They opt in through a test environment variable in production code. The
   other seven never retry a 429. We have one service type. Give it one
   policy. Give the test its delays through the constructor, not an
   environment variable.
6. **The same end rule for every stream.** A cut chat stream is retried, a
   cut Responses stream is not (`responses.ts:257`). If we add a second
   format, its parser gives the same `Truncated` error.
7. **Fail at the first bad frame.** The reference keeps reading after a
   frame that does not parse, shows the text, and fails only at the end
   (`chat.ts:385`, `protocol.ts:162`). Our parser can return an error at
   once.
8. **Do not send `item.completed` and then fail the same round.** For
   `finish_reason: "length"` the reference sends the reply as complete,
   then a terminal error (`chat.ts:747`, `:756-757`). Decide the outcome
   first. A reply cut by the length limit can be an `item.completed` with
   a mark, or no item.
9. **Separate limits for the first byte and between pieces.** The
   reference has one idle timer that also covers the wait for the model
   and the headers (`chat.ts:271`). A local model that loads slowly then
   needs a long idle limit for the whole reply. Separate `tokio` timeouts
   say what each one is for: the time to connect, the time to the first
   piece, and the time between pieces. The plan's open choice for 5.4 names
   only a connection timeout and a timeout between pieces. It does not
   cover the wait for the first piece, which is the long wait of a local
   model or of Meta (600 s).
10. **Redact the live text in one place.** The reference uses three
    places:
    - The driver redacts the configured secrets with a held-back tail
      (`chat.ts:643-657`).
    - The host does not redact deltas (`public-reply.ts:1-3`).
    - The window redacts again and holds the last word
      (`live-reply.ts:182-186`).

    We can redact once in the driver, before the event leaves
    `bot-engine`. At the end, the driver then sends or drops the held tail
    on purpose, also after an error. The reference drops it after an
    error, because the code reaches `chat.ts:678-679` only on success.
11. **Decide what happens to the partial reply.** In the reference, text
    shown before an error or a Stop is not saved, and the window then
    removes it (`live-reply.ts:78-80`, test
    `openai-compat-idle.test.ts:43`). The person sees words vanish. Choose
    on purpose: keep the partial text as an item with a mark, or remove
    it. D20 does not say.
12. **No product name in prompt text or settings.** The reference's
    environment variables and prompt text carry its own product name
    (`compat.ts:17-28`, `openai-compat.test.ts:871`). Our names follow
    `AGENTS.md`.
13. **Tests that pin what the reference leaves open.** Our plan's own fake
    server (5.3) can hold a stream open and send pieces by hand. The
    reference's `fetch` stubs cannot. Test these cases:
    - an idle timeout on a real chat stream
    - a Stop in the middle of a streamed reply
    - `\r\n` line ends
    - a frame split in the middle of a UTF-8 character
    - a malformed frame in the middle of a stream
    - more than one choice
    - a truncation after reasoning text only

## 9. Not verified

- Whether `await turn.done` in `interruptTurn` (`chat.ts:965`) can wait
  forever, for example when a tool process does not close.
- How the window draws the saved `retrying —` row. The transcript code
  treats it as a done tool step (`src/lib/activity-runs.ts:33-38`). Nobody
  read the component that draws a tool step for this case.
- How MiniMax sends its reasoning with `reasoning_split: true`: the code
  reads `reasoning_content` and the test sends it, but no MiniMax document
  was read.
- `server/drivers/compat-reasoning.ts`, `redactSecretsInText`,
  `prepareChatModel` beyond its signature, `TextItems.stamp` (how the bus
  gives an `itemId` to a delta) and `ProgressGate`.
- Whether the tests that write to the native log use the person's real
  data folder (`openai-chat.test.ts:882-885`). Nobody read the config that
  sets the folder in tests.
- Whether a real Responses stream sends `data: [DONE]`: the reader would
  fail on it (`responses.ts:265-268`).
- The "ACP quiet watch at 60 s and 180 s" in the comment of
  `server/first-reply-rescue.ts:4-5`.
- The service behaviours stated only in comments: MiniMax with no
  `[DONE]` (`chat.ts:422-424`), llama.cpp `error:` lines
  (`refusals.ts:110`), DashScope ids (`protocol.ts:111-113`), Node's 300 s
  limit (`openai-chat-fetch.ts:3-5`). A comment gives a version where it
  has one. Nobody checked these behaviours against the services.
