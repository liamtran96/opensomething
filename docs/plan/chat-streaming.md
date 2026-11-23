# Plan: The chat API driver with streaming

The proposals from the research file
[`../research/features/chat-streaming.md`](../research/features/chat-streaming.md).
The steps, the pull requests and the order are in
[`README.md`](README.md). The author decides each proposal. Then it
becomes a decision, a pull request or a choice, and its text leaves this
file.

- **Steps:** 2, 5.
- **State:** open. No proposal is decided.

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

- **P13 (step 5). An error enum by kind.** `Http { status, body }`, `Connect`, `Idle`,
  `Truncated`, `Protocol`. The status decides the class. The body is only for
  the message.
  - Why: the reference reads the words of the message, so
    `HTTP 503: ... subscription ...` becomes `quota`, and "max 500 tokens"
    becomes a server error.
  - Source: `chat-streaming.md` 8.2, 8.3. `retry.ts:37`, `:205-209`.
  - Changes: PR 5.5.

- **P14 (step 5). Three timeouts.** One to connect, one to the first piece, one
  between pieces.
  - Why: the reference has one idle timer, so a slow local model needs a
    long limit for the whole reply.
  - Source: `chat-streaming.md` 8.9. `chat.ts:271`.
  - Changes: answers the choice of the timeouts.

- **P15 (step 5). Fail at the first bad frame.** The parser of 5.2 returns an error
  at once.
  - Why: the reference keeps reading and fails only at the end.
  - Source: `chat-streaming.md` 8.7. `chat.ts:385`.
  - Changes: PR 5.2.

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
