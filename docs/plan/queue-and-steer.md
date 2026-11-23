# Plan: Queue and steer

The proposals from the research file
[`../research/features/queue-and-steer.md`](../research/features/queue-and-steer.md).
The steps, the pull requests and the order are in
[`README.md`](README.md). The author decides each proposal. Then it
becomes a decision, a pull request or a choice, and its text leaves this
file.

- **Steps:** 7, 8.
- **State:** open. No proposal is decided.

## Gaps that have no step

- **P34. The person sends while the bot works.** Now the composer refuses a
  send during a turn. Queue by default. An `admit` pure function returns
  `Admission { Start, Queue { reason }, Refuse(code) }`, and `Steer` later.
  In step 8 the queue is a table with a position column, read in the same
  transaction as the turn start. Steer comes when a driver has a round
  boundary.
  - Why: less code (no memory copy of the queue), and two known problems.
    The reference loses the order at a restart. It can run a steered message
    two times.
  - Source: `queue-and-steer.md` 8.1, 8.2, 8.3, 8.4, 8.7, 8.8.
    `bot-messages.ts:429-430`, `:464-465`.
  - Changes: step 7 keeps the composer off. A new PR in step 8. A new
    decision.
