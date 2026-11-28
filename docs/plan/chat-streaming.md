# Plan: The chat API driver with streaming

The proposals from the research file
[`../research/features/chat-streaming.md`](../research/features/chat-streaming.md).
The steps, the pull requests and the order are in
[`README.md`](README.md). The author decides each proposal. Then it
becomes a decision, a pull request or a choice, and its text leaves this
file.

- **Steps:** 2, 5.
- **State:** open. No proposal is decided.
- **Reference checked at:** `e1cc6a290` (after release v0.1.186) for the
  changes that the research file lists in "Changes up to `e1cc6a290`
  (v0.1.186)". A line "Update (v0.1.186)" in a proposal says what the
  reference does now.

## Proposals

- **P5 (step 2). What happens to a partial reply.** One rule for text that the window
  showed before an error, a Stop or a length limit. Option a:
  `item.completed` with a mark `partial: true`, and the store keeps the
  text. Option b: no `item.completed`, and the window removes the live text,
  as the reference does. In both options, the driver decides the outcome
  before it sends `item.completed`. It never sends a complete item and then
  fails the same round.
  - Why: in the reference the person sees words vanish. For
    `finish_reason: "length"` the reference sends the reply as complete, then
    a terminal error.
  - Source: `chat-streaming.md` 8.8, 8.11. `chat.ts:747`, `:756-757`,
    `src/state/live-reply.ts:78-80`.
  - Changes: PR 2.5, D20, PR 5.4, PR 7.5. Recommendation: a.
  - Update (v0.1.186): the reference changed the case of the length
    limit, but the proposal still has a reason.
    - The reference now continues a reply cut at the output limit with a
      new request, at most 8 times in a turn, and sends the pieces as one
      `item.completed` (`server/drivers/openai-chat-protocol.ts:22-47`,
      `server/drivers/openai-chat.ts:736-738`, `:747-750`). See P772.
    - "Item, then error" stays in four cases: the limit of 8, a local
      model with tools, a cut with reasoning text only, and a finish reason
      that is not `stop` or `length`. In each one, `answer.end()`
      (`openai-chat.ts:738`) runs before the error (`:747`, `:751-752`).
      The lines `chat.ts:747` and `:756-757` above are now
      `openai-chat.ts:737-738` and `:751-752`.
    - A failure or a Stop in a chain of pieces now keeps the pieces that
      finished as a normal reply with no mark (`openai-chat.ts:889`, before
      `runtime.error` at `:904`). The words of the piece that was
      streaming still vanish. For one reply, all the words still vanish.
      `live-reply.ts:78-80` did not change.
    - So option a now also covers a chain: one item for the chain, and
      `partial: true` on it when the chain fails or stops. The driver
      decides the outcome of a reply (complete, continue, cut) before it
      sends the item.

- **P13 (step 5). An error enum by kind.** `Http { status, body }`, `Connect`, `Idle`,
  `Truncated`, `Protocol`. The status decides the class. The body is only for
  the message.
  - Why: the reference reads the words of the message, so
    `HTTP 503: ... subscription ...` becomes `quota`, and "max 500 tokens"
    becomes a server error.
  - Source: `chat-streaming.md` 8.2, 8.3. `retry.ts:37`, `:205-209`.
  - Changes: PR 5.5.
  - Update (v0.1.186): the problem stays. The reference now keeps the
    HTTP status in `ChatHttpError.status` (`server/drivers/openai-chat.ts:305`)
    and `ChatCompletionError.status`
    (`server/drivers/openai-chat-refusals.ts:37-51`), but `classifyError`
    still reads only the message (`server/drivers/retry.ts:191-217`). A new
    cut reason, `stream_cut`, is also found by words
    (`retry.ts:47-48`). The lines above are now `retry.ts:38` and
    `:208-212`.

- **P14 (step 5). Three timeouts.** One to connect, one to the first piece, one
  between pieces.
  - Why: the reference has one idle timer, so a slow local model needs a
    long limit for the whole reply.
  - Source: `chat-streaming.md` 8.9. `chat.ts:271`.
  - Changes: answers the choice of the timeouts.
  - Update (v0.1.186): no change in the reference. The line is now
    `server/drivers/openai-chat.ts:266`.

- **P15 (step 5). Fail at the first bad frame.** The parser of 5.2 returns an error
  at once.
  - Why: the reference keeps reading and fails only at the end.
  - Source: `chat-streaming.md` 8.7. `chat.ts:385`.
  - Changes: PR 5.2.
  - Update (v0.1.186): no change in the reference. The line is now
    `server/drivers/openai-chat.ts:380`.

- **P16 (step 5). Retry.** A retry is possible only while nothing is shown. An
  attempt state `NothingShown` or `Shown` makes this a type rule. One
  counter. The test gives the delays through the constructor, not an
  environment variable. A `turn.retrying` event tells the window "attempt 2
  of 3, wait 1.2 s".
  - Why: the reference decides with a 7-part condition and two copies of it.
  - Source: `chat-streaming.md` 8.1, 8.4, 8.5. `chat.ts:712`, `:726`,
    `compat.ts:439`.
  - Option a: a new PR 5.7, `chat/retry.rs`, and a new event kind. Option b:
    no retry in part 1, and a failure is a `runtime.error`. Recommendation:
    b for part 1, a after step 7.
  - Update (v0.1.186): the reference changed its rule, and the problem
    stays.
    - A request that the service cut before any delta is now sent again
      also after tool rounds of the turn. The earlier tool results are in
      the request, so no tool runs again (`a91ee14e1`, `b0b545aa3`,
      `server/drivers/openai-chat.ts:713-715`). A request that streamed a
      delta is still never sent again. So `NothingShown` is a state of one
      request, not of the turn. See P773.
    - The gate still has seven conditions, and two of them now have an
      exception for `stream_cut` (`openai-chat.ts:715`). The copy for a
      refused tool call is at `:701`. The lines above are now
      `openai-chat.ts:701`, `:715` and `server/drivers/openai-compat.ts:440`.

- **P17 (step 5). The tests that the reference does not have.** Add these tests to
  PR 5.2, 5.4 and 5.5:
  - an idle timeout on a real stream
  - a Stop in the middle of a reply
  - `\r\n` line ends
  - a frame split inside a UTF-8 character
  - a bad frame in the middle
  - more than one choice
  - a cut after reasoning text only

  Source: `chat-streaming.md` 8.13.

  Update (v0.1.186): the reference added tests for a reply cut at the
  output limit (`server/drivers/openai-chat.test.ts:1169-1384`) and for a
  cut after a tool round (`openai-chat-stream-retry.test.ts:80-135`). The
  seven cases above are still not tested in the reference. With P772, add:
  a Stop in a chain of pieces, and a steer text in a chain. The reference
  has no test for them.

## Proposals from the update to v0.1.186

The main session gives these their P-numbers.

- **P772 (step 5). Continue a reply cut at the output limit.** Follow the
  reference. When the reply ends with `finish_reason: "length"` and has
  answer text, the driver appends the cut text as an `assistant` message
  and a `user` note to continue, and sends a new request. At most 8
  continuations for each turn. A local model with tools is not continued,
  because a cut reply there can be half a tool call. The pieces are one
  item (P5). The note has no product name (P50 of
  [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md)).
  - Kind: follow the reference.
  - Why: the reference added this in v0.1.186: "A reply cut at the output
    limit is continued and shown as one message, instead of failing."
    Before, the turn failed after the reply showed.
  - Source: `chat-streaming.md` 3.7, 3.13.
    `server/drivers/openai-chat-protocol.ts:22-47`,
    `server/drivers/openai-chat.ts:665`, `:736-753`, `:889`,
    `server/drivers/cut-reply-text.ts:33-45`. Tests
    `server/drivers/openai-chat.test.ts:1169-1384`.
  - Changes: PR 5.4 (the turn loop of the driver), and the outcome of P5.
    Our first chat driver has no tools, so the case of a local model with
    tools comes with P33.

- **P773 (step 5). One error kind for a cut stream, and one reason on the
  wire.** Every parser returns the same `Truncated` error for a stream
  that ends early, and a read that the connection ends is a `Connect`
  error (P13). The retry of P16 sends again a request in the state
  `NothingShown` that ended with one of these errors, also after tool
  rounds, as the reference now does. The `turn.retrying` event has one
  enum value for a cut.
  - Kind: better than the reference.
  - **Problem in the reference:** The reference finds a cut by the words of
    the message (`server/drivers/retry.ts:47-48`), and it has two reasons
    for one fact (`stream_truncated`, `stream_cut`,
    `server/drivers/openai-chat.ts:717`). The list of reasons of the turn
    record does not have `stream_cut`, so each such retry is recorded as
    `other` (`server/perf/turn-record.ts:24-26`). A cut Responses stream
    is now sent again only because its error words match the pattern
    (`server/drivers/openai-responses.ts:265`), with no test. Before
    v0.1.186, a cut after a tool round failed the whole turn ("A stream
    the provider cuts is retried, also after earlier tool steps."). Theme
    of `changelog.md` section 5: "The same work done or delivered two
    times, or lost".
  - Why: one error type and one reason value give the same resend with no
    match of words, and the record of the turn gets each reason.
  - Source: `chat-streaming.md` 3.8, 3.10, 8.2, 8.3, 8.6.
  - Changes: P13, P16, PR 5.5.

- **P774 (step 5). The secret hold belongs to one message.** One type owns
  the text of one message and its held tail. The tail crosses only into
  the continuation of the same message (P772). Each other end of a
  message releases it. A unit test has a key that starts with "s" and the
  reply "Let me check the logs".
  - Kind: better than the reference.
  - **Problem in the reference:** In v0.1.186 `459da558f` carried the held
    tail across every request of the turn. The last characters of one
    message then went into the next message: "Let me check the logs" lost
    its "s" when the key started with "s". `f909454a2` repaired this
    before the tag. The rule is spread over
    `server/drivers/openai-chat.ts:641-644`, `:665-668` and `:736`, and
    the window redacts again (`src/state/live-reply.ts:182-186`). Theme
    of `changelog.md` section 5: "A secret or an access right in the
    wrong place".
  - Why: a held tail that crosses the end of a message moves text into the
    wrong message. A type that owns one message makes that impossible.
  - Source: `chat-streaming.md` 3.7, 8.10.
    `server/drivers/secret-halves.ts:1-13`,
    `server/drivers/cut-reply-text.ts:9-31`.
  - Changes: PR 5.4.

- **P775 (step 5). A connection takes its model only from its own
  entry.** The `chat` entry of the registry has its own address, model
  and key. No field of one entry fills a field of another entry. A test
  has two entries at two addresses and checks that each one sends its own
  model.
  - Kind: better than the reference.
  - **Problem in the reference:** An added server at its own address took the
    workspace model and sent it to a server that did not have it, and the
    server answered HTTP 400 ("An added server at its own address keeps
    its own models.", v0.1.186). The repair compares the addresses as
    text in two places (`server/credential-env.ts:70-74`,
    `server/drivers/openai-compat.ts:167`, `:180-186`,
    `server/config.ts:1186-1187`). No theme of `changelog.md` section 5
    fits. This is a judgment call: the author can keep the rule of the
    reference.
  - Why: each connection sends only a model that it names itself.
  - Source: `chat-streaming.md` 3.9.
  - Changes: PR 5.6.

- **P776 (step 5). A refused image is a typed failure.** When the service
  refuses an image part, the driver sends `runtime.error` with a code
  `image_not_supported`, and keeps a flag for that model in memory. With
  the flag, the next turn sends a text note in place of the image, as the
  reference does for a model that it knows is text-only.
  - Kind: better than the reference.
  - **Problem in the reference:** The generic service counts an unknown
    remote model as one that sees images
    (`server/drivers/openai-compat.ts:408`). Each turn with an image to a
    text-only model fails with the raw line `upstream HTTP 400`, because
    the driver does not use the plain sentence for the label `upstream`
    (`server/drivers/openai-chat.ts:902`). The driver does not learn that
    the model is text-only. v0.1.186 added the failure kind
    `image_content` (`server/drivers/engine-errors.ts:37-40`, `:102`) and
    repaired the thread only for the ACP engines. No theme of
    `changelog.md` section 5 fits. This is a judgment call.
  - Why: the person reads why the turn failed, and the next turn with an
    image does not fail in the same way.
  - Source: `chat-streaming.md`, "Changes up to `e1cc6a290`
    (v0.1.186)". `server/drivers/openai-chat.ts:477-489`, `:845-848`.
  - Changes: PR 5.5. Our driver builds the earlier messages from stored
    text, as the reference does (`openai-chat.ts:501-507`), so one image
    fails one turn only.
