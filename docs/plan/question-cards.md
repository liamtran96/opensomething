# Plan: Question cards

The proposals from the research file
[`../research/features/question-cards.md`](../research/features/question-cards.md)
(batch 5, reference commit `ad27f0716`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 9, 10, 13, 14.
- **State:** all open.
- **The main finding:** the reference makes a question from the same event
  as an approval. Only `requestType` and `questions[]` are different
  (`server/index.ts:6433-6436`). Only the answer of the person settles a
  question card (`packages/phone-protocol/src/ask-question.ts:63-65`). The
  card stays open after its turn ends, and a late answer goes to the bot as
  the next message of the person.

## Proposals

- **P135 (step 10, amends D20 and D22). One `Request` enum.** `bot-protocol`
  gets `Request` with two variants: `Question { questions }` and
  `Permission { tool, … }`. The answer to a question is `Answered(text)` or
  `Closed`, with no `allow` and no `deny`. D20 gets `request.opened` and
  `request.resolved`. D22 writes the answer for each kind.
  - Why: a wrong state that the compiler refuses. The reference tells a
    question from an approval with four functions, and they disagree on an
    empty card. Codex does not check the behaviour, so `allow` on a question
    sends empty answers and marks the card "allow".
  - Source: `packages/phone-protocol/src/ask-question.ts:45-65`,
    `src/lib/question-card.ts:4-5`,
    `packages/phone-protocol/src/live-approval.ts:14-20`,
    `shared/ask-question.test.ts:457-465`, `server/drivers/codex.ts:1556-1565`,
    `server/drivers/claude.ts:574`.
- **P136 (steps 9 and 10). One fail-safe timeout, owned by the core, and
  never for a question.** The core gives each driver one timeout value for a
  permission request. No driver sets a timer on a question, the ACP question
  with an `interaction_` id too. The feature `approval-cards` gave the same
  point.
  - Why: commit `b82764109` (v0.1.126) removed the question timers in five
    drivers, but not in `acp/core.ts`. There, after 15 minutes the driver
    sends `cancelled`, writes the timeout text of a permission and stops the
    turn. Each driver has its own 15-minute timer. Step 9 builds the ACP
    driver, so the problem comes to us first.
  - Source: `server/drivers/acp/core.ts:594`, `:673-676`,
    `server/drivers/claude.ts:448`, `:511`, `server/drivers/codex.ts:838`,
    `server/drivers/pi.ts:639-648`, `server/drivers/chat-tool-approval.ts:75-96`.
  - Note: P133 of [`turn-limits.md`](turn-limits.md) raised a timer for each
    question. The author decides between them.
- **P137 (step 10). A driver reports only what the engine got.**
  `request.resolved` and the return value of an answer say what the engine
  received. A driver does not report "answered" when it sent a cancel, or
  when it does not know.
  - Why: the problem "the same work done or delivered two times, or lost".
    In the reference, Pi sends `cancelled: true` for two labels that are the
    same after a cut, and still reports `answered`. Codex reports an
    `indeterminate` steer as answered.
  - Source: `server/drivers/pi.ts:626-637`, `:955-969`,
    `server/drivers/codex.ts:714-719`, `server/drivers/codex-questions.ts:35-40`.
- **P138 (step 13). A limit for a question in the bot's own chat.** The
  author chooses one:
  - a. Follow the reference: a question in handed-on work gets one reminder
    after 24 hours and closes after 72 hours. A question in the bot's own
    chat (a root) has no limit.
  - b. Give a root question a limit too.
  - Why: the problem "a turn or a wait that does not end" (v0.1.153, "closes
    after three, instead of waiting forever"). A live question in a root
    holds the engine process with no end. A reminder that comes late gives
    48 more hours.
  - Source: `server/runtime-coordinator.ts:44-46`, `:180`,
    `server/runtime/runtime.ts:859-861`, `:868-877`,
    `server/runtime/runtime.test.ts:1043-1060`, `:1096`, commit `7dd032b8d`.

## New facts for proposals that exist

- **P118 (step 10). Questions go in step 10.** Step 10 builds the question
  card with the approval card, on the same request path. NEEDS INPUT,
  parking, the reminder and the close after 72 hours go to step 13. Relay by
  a teammate, the Chief, `notAsked` and "the requester decides" go to step
  14. "Done when" adds: "A question shows in the window, and your answer
  reaches the engine."
  - Source: `server/index.ts:6433-6436`,
    `packages/phone-protocol/src/runtime-events.ts:129-180`,
    `server/request-card.ts:19-25`, `server/runtime-coordinator.ts:82-95`,
    `:694-700`, `server/host/question-routing.ts:63-69`, `:102-139`, `:180-199`.
- **P116 and P44 (step 10).** The stored card row keeps `request_id`, and
  the core finds the card by it. No map in memory holds the link. The
  reference keeps the link in a map that a restart loses, and it already
  searches by `requestId` when the map has no entry. At start, no sweep
  handles question cards.
  - Source: `server/index.ts:4723`, `:4749-4752`, `:6307-6310`,
    `:6535-6551`, `:9419-9421`, `:1912-1954`.
- **P42 (step 10).** The card has one state:
  `Open | Answered | Closed | Stopped | Expired | DecidedBy(bot)`. The five
  flags of the reference allow a card that is `dismissed` with no
  `answered`, and the window draws it as a live card.
  - Source: `packages/phone-protocol/src/wire.ts:649-666`,
    `src/components/QuestionCard.tsx:107-109`, `server/host/ask-cards.ts:286-287`.
- **P45 (step 10).** Follow the reference for the late answer: the end of a
  turn does not close a question card, and a later answer goes to the bot as
  the next message, with a fixed send id for each card. Better than the
  reference: refuse a late answer to an expired card, and give the correct
  refusal for a closed card. The check of the reference does not read
  `expired`, and a closed card gets "this question has already been
  answered".
  - **Problem in the reference:** On the answer route of the chat, the
    late-answer check does not read `expired`, so an answer to an expired
    question card still goes to the bot. A closed card gets "this question
    has already been answered", which gives the wrong reason
    (`server/routes/bot-messages.ts:787-793`;
    `server/person-replies.ts:124-127`). The release problem: "The approval
    model changed" (v0.1.126).
  - Source: `server/index.ts:4795-4811`, `:4874-4876`,
    `server/routes/bot-messages.ts:786-797`, `server/person-replies.ts:116-135`.
- **P120 (step 14).** At Full access, in handed-on work, the reference
  answers a question in two ways: `notAsked` (the text "Not asked: …" and no
  card), and "the requester decides" for a NEEDS INPUT question, where the
  default stands when nobody answers. A question that only the person can
  answer (sign-in, payment, secrets, the person's own account) always goes
  to the person. The choice of P120 must name both ways.
  - Source: `server/host/question-routing.ts:63-69`, `server/index.ts:6446-6447`,
    `server/runtime-coordinator.ts:698-700`, `server/runtime/questions.ts:7-8`,
    `:13-26`, `server/runtime-coordinator.test.ts:2044-2061`,
    `docs/approval-levels.md:362-364`.
- **P121.** More documents of the reference disagree with the code. They say
  that a question "never runs out", and the code closes handed-on work after
  72 hours. Two comments still name a question timeout.
  - Source: `docs/runtime-contract.md:40`, `:122`, `docs/team-cloud.md:949`,
    `src/lib/card-answer.ts:1`, `server/drivers/openai-chat.test.ts:516`,
    `docs/verification/question-cards.md:81`.
