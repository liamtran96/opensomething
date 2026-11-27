# Plan: Goals

The proposals from the research file
[`../research/features/goals.md`](../research/features/goals.md)
(batch 10, reference commit `fcce0b6de`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** none yet. A one-on-one goal needs step 13 (the runtime) and
  step 15 (routines). A room goal also needs the rooms step of P286, which
  does not exist yet.
- **State:** all open. Decide P535 and P537 first: if we follow the
  reference in them, each one breaks a rule of `AGENTS.md`.
- **The main finding:** a goal is a loop. A lead bot writes the next step
  in a text envelope, and a worker bot does the step. The loop goes on
  until the lead says "completed" or a limit stops it. All loop state is in
  memory, so a restart ends every goal (`server/group-goal-run.ts:303-312`).
  The loop copies the text of the lead straight into the prompt of the
  worker (`server/group-goal-run.ts:229-244`).

## Proposals

- **P535 (choice, step 13, decide first). A goal run is a stored record of
  the runtime.** The goal row holds the status, the turn count, the wait
  count, the assignment counts and the pending note. Each change writes the
  row and its event in one transaction.
  - **Problem in the reference:** a restart ends every goal, and the person
    must send the goal again (`server/group-goal-run.ts:303-312`,
    `server/host/one-on-one-goals.ts:54`, `server/store.ts:892-933`). The
    release problem: "State lost at a restart or a crash" (v0.1.24,
    v0.1.165).
  - Rule conflict: `AGENTS.md` says that the runtime in `bot-core` owns all
    work state. In the reference a room goal run routes its steps outside
    the runtime (`docs/runtime-contract.md:22`, `:49`).
  - Options:
    - a. The goal row is in the runtime, and a restart ends it `failed`, as
      the reference does.
    - b. The goal row is in the runtime, and a restart pauses it for a
      Resume. The v2 plan of the reference wanted this
      (`docs/plans/2026-09-02-goal-mode-v2.md:71-73`).
    - c. An exception to `AGENTS.md`: the loop state stays in memory, as in
      the reference.
- **P536 (decision). The decision of the lead is a typed tool call, not a
  text envelope.** For example `goal_decision`, with typed fields. No text
  needs to be hidden from the person.
  - **Problem in the reference:** the parser failed when the close tag was
    cut, escaped or followed by text. Each such reply ended the goal
    `blocked` (issue #5209, v0.1.154, `announcements/releases.json:1237`).
    The envelope also reached the person from a turn that the result of a
    teammate woke (commit `ec5c9ed0f`). Now three guards hide the envelope
    (`server/host/goal-turns.ts:37-87`, `server/index.ts:6251-6295`,
    `server/harness/public-reply.ts:9-14`).
  - Judgment call: no theme of section 5, but it has release evidence. The
    reference planned a typed decision too
    (`docs/plans/2026-09-14-phase-0-foundation.md:227-231`).
- **P537 (choice, decide first). The prompt of the worker comes from the
  stored decision row.** The loop writes the decision as a row first. The
  prompt is a fixed text built from that row, with the instruction quoted
  as data, as P51 does.
  - **Problem in the reference:** the loop copies up to 2,000 characters of
    the model text of the lead straight into three prompts. They are the
    prompt of the worker, the next solo prompt and the note of a reassign
    (`server/group-goal-run.ts:229-244`, `:383-394`, `:414-416`). Nothing
    stores the decision first.
  - Rule conflict: `AGENTS.md` says that text that opens a delegated turn
    is built from stored data, never from model output. To follow the
    reference, the author writes an exception to `AGENTS.md`.
  - No release problem. This is our rule.
- **P538 (plan). One deadline for each step, in a room and in a one-on-one
  chat.** One step function for both, with one deadline made at the start
  of the step.
  - **Problem in the reference:** in a room step, a lost claim race goes
    back to the wait (`server/index.ts:10523`), and the wait starts a new
    30-minute timer (`:4171`, `server/group-goal-run.ts:8`). The loop has no
    count and no total deadline. Commit `7eaaac9c7` corrected the same fault
    only in the one-on-one step. No test covers the room case. The release
    problem: "A turn or a wait that does not end" (v0.1.132, v0.1.151,
    v0.1.153).
- **P539 (plan). Two Rust types: what the model decides, and how a run
  ends.** `GoalDecision`: continue, completed, needs input, blocked.
  `GoalEnd`, with separate `TurnLimit` and `TimeLimit`. No `Paused` until a
  Resume exists (P535 option b).
  - **Problem in the reference:** one status list of 8 values serves the
    model, the host and the routine
    (`packages/phone-protocol/src/group-goal-run.ts:3-12`). No code sets
    `paused`. `limit-reached` means the turn limit and the time limit of a
    routine, and the text says "turn limit" for both
    (`server/store.ts:917-923`, `server/routines.ts:1374-1379`).
  - Judgment call: no release names this.
- **P540 (plan). A retry only when the first attempt did nothing outside
  the chat.** A goal step uses the restart rule of the runtime
  (`changelog.md` section 7, row "State lost at a restart").
  - **Problem in the reference:** a step that failed for a transient reason
    runs again with the same instruction. Nothing checks what the first
    attempt did (`server/group-goal-run.ts:288-298`). A step that timed out
    after it sent an email can send it two times. No test shows it. The
    release problem: "The same work done or delivered two times" (v0.1.108,
    v0.1.150, v0.1.182).
- **P541 (plan, after step 8). The goal end, the routine run and the card
  change in one transaction.**
  - **Problem in the reference:** the card and the routine run are in two
    stores. The routine run is saved later, after the card write
    (`server/host/goal-cards.ts:110`, `server/routines.ts:1335-1366`). The
    code needs a repair rule for a crash between the two writes
    (`server/index.ts:8777`). The release problem: "State lost at a restart
    or a crash" (v0.1.24, v0.1.107, v0.1.165).
- **P542 (plan). The goal has its own cost, and an optional spend limit.**
  The goal row adds the usage of each step, and the card shows it. A limit
  for each goal ends the goal `blocked` before the next step.
  - **Problem in the reference:** a routine run of a room goal never gets a
    cost (`server/routines.ts:1262-1269`, `:1289`). The card has no cost.
    Only the workspace limit stops a goal, at the next step
    (`server/spend.ts:22-59`). The v2 plan put a goal limit in "Later"
    (`docs/plans/2026-09-02-goal-mode-v2.md:170`, `:181`). The release
    problem: "Usage and cost numbers corrected" (v0.1.90, v0.1.170,
    v0.1.178).
- **P543 (decision). Follow the reference: one loop for a room and a chat
  of one.**
  - **Problem in the reference:** a separate one-on-one engine shipped on
    2026-10-24, and the reference deleted its 1,087 lines on 2026-10-26
    (commits `12fc6ce7c`, `d97559347`). Now one loop runs both, with
    `solo: true` (`server/host/one-on-one-goals.ts:190-194`). The release
    problem: "A feature added, then removed or reversed". No release note
    names it.
- **P544 (plan, the card in `bot-desktop`). A card change that comes before
  its row is not lost.** The fold of `bot-core` keeps the last state of
  each card by id, and the window reads it when it opens a task.
  - **Problem in the reference:** the client drops a patch for a row that is
    not loaded, or for a room task that is not open
    (`src/state/store.tsx:1279`, `:1285`, `:1301`). The card can say
    `working` after the goal ended, until a reload.
  - Judgment call: no release names this.
