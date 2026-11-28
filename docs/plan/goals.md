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
- **Update of 2026-11-28:** the research file was corrected for the
  reference at `e1cc6a290` (v0.1.186 is the tag `70eb44c1a`). Each
  proposal that the changes touch has an "Update (v0.1.186)" line. Its
  lines are at `e1cc6a290`. The other lines of a proposal are at
  `fcce0b6de`. The new proposals are P803 and P804 (P794 to P802 are in
  [`assignment-runtime.md`](assignment-runtime.md) and
  [`bot-coordination.md`](bot-coordination.md)). The main session gives
  them their P-numbers.
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
  - Update (v0.1.186): the loop state is still in memory
    (`server/group-goal-run.ts:310-320`). It has one more counter now,
    `controlMisses`, the count of lead replies in a row with no valid
    envelope (`:320`). The goal row of options a and b stores it too (P803).
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
  - Update (v0.1.186): the reference repaired the effect of a reply that
    does not parse, not its cause. It now asks the lead again, up to 3
    replies in a row, before it ends the goal `blocked`
    (`server/group-goal-run.ts:10-11`, `:363-377`; commits `9d7297ac1`,
    `05d5978b4`, in the tag; release note "**Goal runs:** ask the
    coordinator again when its reply is malformed."). Each re-ask uses one
    of the 13 turns and one paid model turn, and a stalled lead step can
    now use 4 lead turns. The parser did not change. So this proposal still
    has a reason: it is the second release that fixes the text envelope
    (v0.1.154, v0.1.186). A typed tool call removes the parse failure, but
    a model can still end a turn with no call, so P803 applies to both.
    The envelope guards moved to `server/index.ts:6264-6308`.
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
    v0.1.153).- **P539 (plan). Two Rust types: what the model decides, and how a run
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
  - Update (v0.1.186): the transient retry did not change
    (`server/group-goal-run.ts:295-305`). A second path now runs a lead
    step again: the re-ask of a malformed reply (`:363-376`). A solo lead
    does the work in its own turn, so the work of the first reply can be
    done two times. The only guard is the prompt text "Do not repeat the
    work or the assignments you already made." (`:19`). The rule of this
    proposal applies to the re-ask too.
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

## New proposals from v0.1.186 (P803 and P804)

- **P803 (with P535 and P536). A lead reply with no valid decision is asked
  again a fixed number of times, and the count is stored.** Follow the
  reference (`server/group-goal-run.ts:10-11`, `:17-20`, `:363-377`;
  commits `9d7297ac1`, `05d5978b4`, in the tag):
  - Count the misses in a row, and set the count to 0 at a valid decision.
  - Stop at 3 misses, or at a miss on the last turn, with `blocked` and
    the count in the detail.
  - Each re-ask is a new lead step and a turn of the run.
  - The next lead prompt gets a fixed note with an example decision.

  This applies also to a typed decision (P536): a model can end a turn
  with no call of the tool.
  - **Problem in the reference:** the count is a variable of the loop
    (`server/group-goal-run.ts:320`), so a restart loses it with the rest of the loop state (P535).
    The release problem: "State lost at a restart or a crash" (v0.1.24,
    v0.1.165). The guard against work done two times is only prompt text
    (`:19`), which is "The same work done or delivered two times, or lost"
    (v0.1.108, v0.1.150, v0.1.182). The progress line "Asking again
    (N/3)." is plain English with no text code (`:371`), but the line of
    the transient retry has one (`:302-303`). No test covers a re-ask in a
    room.
  - Ours: the miss count is a field of the goal row (P535), the event has
    a typed code (P228 of [`bot-coordination.md`](bot-coordination.md)),
    and a re-ask follows the rule of P540.
- **P804 (later, the bot API). A goal sent through the bot API can refuse
  while a card waits.** Follow the reference: the body field `answer:
  "never"` makes the route answer 409 with `code: "card_waiting"` while a
  question, approval, password or sign-in card is open, and it writes
  nothing. A `sendId` retry of a goal that the route already took still
  answers 202. Any other value of `answer` gives 400
  (`server/routes/bot-messages.ts:172-186`, `:228-234`, `:280`; commit
  `6b7ca34a3`, after the tag).
  - No release problem. The tests of the reference cover only plain sends
    (`server/routes/bot-messages.test.ts:673-788`), so our tests add the
    goal branch.
