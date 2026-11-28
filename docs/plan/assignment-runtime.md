# Plan: The assignment runtime

The proposals from the research file
[`../research/features/assignment-runtime.md`](../research/features/assignment-runtime.md)
(batch 6, reference commit `eee23ebbe`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. All paths below are in the reference project.

- **Steps:** 13 and 14.
- **State:** all open.
- **Update of 2026-11-28:** the research file was corrected for the
  reference at `e1cc6a290` (v0.1.186 is the tag `70eb44c1a`). Each
  proposal that the changes touch has an "Update (v0.1.186)" line. Its
  lines are at `e1cc6a290`. The other lines of a proposal are at
  `eee23ebbe`. The new proposals are P794 to P797. The main session gives
  them their P-numbers.
- **The main finding:** the product does not use the defaults of the
  runtime. It sets 64 requests and 96 turns for each root, not 24 and 48
  (`server/runtime-coordinator.ts:48-49`, `:180`;
  `server/runtime/types.ts:374-386`). Stop cancels the running children
  too (`server/runtime/runtime.ts:675-693`), and the contract document
  still says that they keep running (`docs/runtime-contract.md:48`).

## Proposals

- **P164 (step 13). The limits as named settings, with the product values
  as defaults.** Depth 4, 64 requests and 96 turns for each root, 48 wakes,
  300 turns in all and 5 failures in a row for unattended roots, and four
  clocks: the queue 24 h, the stall of a tree 4 h, the reminder 24 h, the
  close 72 h. The shell reads them from the settings of step 6. Decide who
  owns the stall of one turn (see P133): the runtime sets 24 h, and the
  watchdog of the host stops a turn after 20 minutes.
  - Why: follows the reference, but with one set of values. The reference
    has two sets, and the merge of the defaults under the options decides
    which one applies.
  - Source: `server/runtime-coordinator.ts:41-49`, `:180`;
    `server/runtime/types.ts:374-386`; `server/runtime/runtime.ts:100`;
    `server/runtime/handoff-limits.ts:3-14`; `server/index.ts:4915`.
  - Also: correct the row "Limits of the runtime: depth 4, 24 requests for
    each root" in `../research/reference-features.md`.
  - Update (v0.1.186): the values did not change. The lines moved:
    `server/runtime-coordinator.ts:188`, `server/runtime/runtime.ts:104`,
    `server/index.ts:4928`. One host clock changed: the 4-hour limit of an
    unattended turn now uses a monotonic clock, because a clock set forward
    or a computer asleep is not time that a turn worked
    (`server/host/unattended-turns.ts:91-92`, commit `b0b8cdf0f`, in the
    tag). This is the same problem as the row "A quiet engine" of section 6
    of `../research/changelog.md` ("a room turn no longer counts the
    computer's sleep as silence", v0.1.178). So each limit of our settings
    names its clock: monotonic for "how long it worked", wall clock for
    "how old it is".
- **P165 (step 13). Typed refusals.** One enum for the refusals of
  `enqueue`, `answer`, `begin` and `end`, with the values as fields. The
  coordinator maps the enum to the text for the model.
  - Why: `AGENTS.md` says that the runtime returns typed refusals. The
    reference gives a free-text reason, a bare `false` from `answer` and a
    throw from `begin` on a repeated identifier. The coordinator then reads
    the text with a regular expression.
  - Source: `server/runtime/types.ts:237-239`;
    `server/runtime/runtime.ts:172-175`, `:645`;
    `server/runtime-coordinator.ts:309-312`.
  - Update (v0.1.186): the reference still gives free text and reads it
    with regular expressions (`server/runtime-coordinator.ts:339-342`;
    `server/runtime/runtime.ts:176-179`, `:687`). One refusal changed:
    since `c47a9d772` (after the tag) the ancestor refusal applies only to
    a reply of `resume` (`server/runtime/runtime.ts:238-243`). So the enum
    value carries the reply, for example `Ancestor { reply }`. See P795.
- **P166 (step 13). Stop follows the code.** Stop cancels the running
  children too, and our contract says so. One hand-off can also be stopped
  alone.
  - Why: follows the code of the reference, not its old document.
  - Source: `server/runtime/runtime.ts:675-693`;
    `server/runtime-coordinator.ts:474-486`; `docs/runtime-contract.md:48`.
- **P167 (step 13, with P84). The restart policy covers roots.** Each
  running row runs again one time, roots too. Five branches, in this order:
  it gave out work, it did an outward action, it was cut two times, the host
  hook `restartCut` (the freeze for want of memory, published in v0.1.180),
  else it runs again. The host blocks the rerun of a person's root after a
  follow-up in its thread.
  - Why: follows the reference. The row of `reference-features.md` says "a
    cut turn of a teammate", but the code runs the turns of the person
    again too.
  - Source: `server/runtime/runtime.ts:109-158`, `:140-142`;
    `server/index.ts:4022-4030`.
- **P168 (step 13). An index for each read of the runtime.** Add to the
  row "The runtime scans all ended work" of section 7 of
  `../research/changelog.md` the three full reads that the reference still
  has, and give each an index in our port.
  - Why: a known problem of the reference ("the server could use all its
    CPU re-checking the queue", v0.1.149).
  - Source: `server/runtime/runtime.ts:157` (all rows at the start),
    `:429-431` (all rows of a thread); `server/runtime-coordinator.ts:717`
    (`all({openSince})`).
- **P169 (step 13). The pace of the tick counts only rows that can start,
  and a tick that fails waits longer.** In the reference three cases keep
  the pace at "busy" (4 ticks each second) for ever: a queued row that
  `canStart` always refuses, a tick that throws, and the set
  `parkedNodesToReconcile`. Each tick reads all open rows two times. No
  test covers these cases.
  - Why: a known problem of the reference (the same CPU problem as P168).
  - Source: `server/runtime/runtime.ts:276-283`, `:319`, `:380`,
    `:418-420`; `server/handoff-ticks.ts:5`, `:33-38`;
    `server/index.ts:9385`, `:9398`.
  - Update (v0.1.186): the three cases are still there
    (`server/runtime/runtime.ts:285-292`, `:330`, `:391`, `:429-431`;
    `server/index.ts:9386`, `:9399`). A fourth case is new by design. When
    the store refuses a settlement five times, the runtime drops the result
    (`server/runtime/runtime.ts:557-561`). The row stays `running` with no
    handle, so `pace()` stays "busy" (`:289`) until the tree stall ends the
    root after 4 h (test `server/runtime/runtime.test.ts:1769`). Before
    v0.1.186 a lost result left the same row, so the window is not new, but
    the commit text now names it as the intended path. P794 removes it.
- **P170 (step 13). Redact the brief, the question and the result before
  the store write.**
  - Why: a secret in the wrong place (section 5 of the changelog). The
    reference redacts an answer only when it is longer than 12,000
    characters, and it stores and sends the brief and the result with no
    redaction.
  - Source: `server/runtime/runtime.ts:647-648`;
    `server/runtime/envelope.ts:140`, `:183`; `server/index.ts:3920`.
- **P171 (steps 13 and 14). The split between the steps.**
  - Step 13: the runtime, the two ports (`TurnRunner`, `Clock`), the store,
    the invariant checks, a fake runner and a fake clock.
  - Step 14: the coordinator with one check for duplicates, views that keep
    `needs_input`, and a stop by the person that stays after a restart.
  - The shell: the timer of the tick.
  - Why: the reference has the same border. `server/runtime/` imports
    nothing of the host.
  - Source: `server/runtime/index.ts:1-8`;
    `server/runtime-coordinator.ts:97-125`, `:160`, `:281-283`, `:561`;
    `server/runtime/runtime.ts:237-239`; `server/handoff-ticks.ts:1-61`.
- **P172 (step 14, with P120). The person decides a question that only the
  person can answer, in every language.** The reference sends a child's
  question to the person when it asks for a sign-in, a payment or a secret.
  It finds these with English and German words only, so a question in
  another language goes to a bot.
  - Why: a wrong decision that depends on the language of the model.
  - Source: `server/runtime/questions.ts:7-21`.
  - Update (v0.1.186): `questions.ts` did not change. Since `d184bc6f9`
    (after the tag) the question comes from the full reply as a field
    (`server/runtime-coordinator.ts:97-103`), but the runtime still clips
    the parked question to 12,000 characters
    (`server/runtime/runtime.ts:606`). See P797.

## New proposals from v0.1.186 (P794 to P797)

- **P794 (step 13, with P83 and P169). A settlement that the store refuses
  is kept as data, and a node whose settlement cannot be written fails
  with a typed outcome.** The runtime holds a typed
  `PendingSettlement { id, executions, result, attempts }` and retries it
  first in each tick, with the guards of the reference (the node is still
  `running`, with the same `executions`). A retry writes the row and its
  event in one transaction. When the retries end, the runtime fails the
  node with its own outcome, for example `StoreUnavailable`.
  - **Problem in the reference:** v0.1.186 keeps the result only in the
    in-memory map `pendingSettlements` (`server/runtime/runtime.ts:90-91`).
    A crash in the retry window loses it, and `open()` then sees a
    `running` row and can run the turn again (`:113-162`). After the fifth
    failure the result is dropped (`:557-561`), and the row waits 4 h for
    the tree stall with the pace at "busy" (`:289`, test
    `server/runtime/runtime.test.ts:1769`). The release problem: "The same
    work done or delivered two times, or lost" (v0.1.83, v0.1.108,
    v0.1.150, and v0.1.186 itself: "a result the store couldn't save is
    kept and retried.").
  - Follow the reference in: the retry before the windows of the tick
    (`server/runtime/runtime.ts:325-327`), the drop of an entry for a node
    that left `running` or was dispatched again (`:548-551`), and the
    exemption from the tree stall while an entry waits (`:363`).
  - Options:
    - a. Follow the reference: the map in memory, 5 retries, then the tree
      stall.
    - b. The typed entry in memory, and a typed failure after the retries.
      No 4-hour wait and no "busy" loop.
    - c. Option b, and the result also goes to a small durable journal, so
      a restart settles it and does not run the turn again.
  - Tests to port: `server/runtime/runtime.test.ts:1706`, `:1731`, `:1753`,
    `:1769`, with a fake store that refuses a transaction.
- **P795 (step 13, with P165 and P221). The ancestor rule is one function
  that uses the reply.** Follow the reference: work back to an ancestor is
  refused only when its reply is `resume`. A reply of `none` or `poll`
  cannot close a wait cycle (commit `c47a9d772`, after the tag;
  `server/runtime/runtime.ts:232-243`). Our version: one pure function in
  `bot-core` computes the reply that applies, checks the ancestors and the
  crossed wait together, and returns `Ancestor { reply }` or
  `CrossedWait { request }`. Our contract states the rule.
  - **Problem in the reference:** the rule and the reply are computed in
    two places. Only the coordinator changes the reply to `poll` under a
    `poll` root (`server/runtime-coordinator.ts:307-308`), and the runtime
    does not (`server/runtime/runtime.ts:232`). The crossed check still
    refuses a `poll` ask back to the bot that delegated
    (`server/runtime-coordinator.ts:322-323`, `:775-782`), so through the
    tools the new path is mostly a one-way notice. The contract was not changed (`docs/runtime-contract.md:36`).
  - Judgment call: no theme of section 5 names this. The reference fixed
    it as issue #6539, after v0.1.186.
- **P796 (step 13, with P171). The shell builds every port before the
  runtime opens.** `bot-cli` builds the store, the `TurnRunner` and each
  host part, then calls `open()` one time, before a routine or a tick
  starts.
  - **Problem in the reference:** `runtime.open()` can run inside the
    constructor of `RoutineManager`, while `server/index.ts` still builds
    the host objects. The report of a settled child then read
    `ownThreads` before it existed, threw, and the row was reported later
    (commit `a15f6ab26`, after the tag; `server/index.ts:3845-3857`; test
    `server/coordinator-restart-report.e2e.test.ts:16`).
  - Judgment call: it came at a restart, but no theme of section 5 names a
    start order. In Rust most of this is a compile error, and the explicit
    order makes it testable.
- **P797 (step 13, with P172). The question of a turn result is a typed
  field, set before any clip.** `RunResult` gets `question:
  Option<String>` from the driver or from one parser, set from the full
  reply. The clip to 12,000 characters applies to the summary text only.
  - Follow the reference: since commit `d184bc6f9` (after the tag) the
    question comes from the full reply as its own field
    (`server/runtime-coordinator.ts:97-103`, `:724`;
    `server/coordinator.ts:97`). Before, the host clipped the reply to
    12,000 characters before it read the `NEEDS INPUT:` line, so a
    question at the end of a long reply was lost and the child ended
    `completed`.
  - Judgment call: the reference still parses the question from free text
    in three places, the host, the coordinator and the private hand-back
    (`server/host/acting-person.ts:185-199`), and a field that is not set
    falls back to a parse of the clipped text
    (`server/runtime-coordinator.ts:101-103`). One typed field set at one
    place removes that fallback. No theme of section 5 names the fault,
    and no release note names its fix yet.

## New facts for proposals that exist

- **P83 (one transaction for each restart decision).** Three more places
  with two writes:
  - The park of a child's question and its wake are two transactions. The
    start parks the child again but never sends the wake again. A crash
    between them leaves the requester waiting with no question.
  - `report()` calls the host before it writes `reportedAt`, and the wake
    of a result is a third transaction. A crash can give a second report,
    or lose the wake of a requester that polls.
  - The branch "outward action" and the branch "cut two times" of the start
    are two writes each.
  - Source: `server/runtime/runtime.ts:134-139`, `:568`, `:572`,
    `:795-803`, `:805-826`, `:855-856`.
  - Update (v0.1.186): the three places are still there, at
    `server/runtime/runtime.ts:138-143`, `:610`, `:614`, `:837-845`,
    `:847-868`, `:897-898`. A fourth case changed: a settlement whose
    transaction throws is no longer lost. It is kept in memory and retried
    on the next 5 ticks (`:540-564`, commits `dc668ab6c`, `14b421cdd`,
    `827c728bf`, in the tag). It is still lost at a crash (P794).
- **P85 (the invariant checks).** The checker reads all rows, and I10 has
  no check (`server/runtime/invariants.ts:37-126`). Also correct
  `../comparison.md`, which says "nine invariant checks": the contract has
  ten (`docs/runtime-contract.md:101-110`).
  - Update (v0.1.186): a store write that throws at settle now has four
    tests (`server/runtime/runtime.test.ts:1705-1790`). Two of them call
    `checkInvariants` (`:1727`, `:1750`). The test of the give-up (`:1769`)
    does not, and its end state is an I1 gap: a `running` row with no live
    owner until the tree stall. Enqueue throws still have no test.
- **P138 (a limit for a question).** A parked root has no time limit and is
  never pruned. A test keeps one for 40 days
  (`server/runtime/types.ts:366-368`; `server/runtime/runtime.ts:859-861`;
  `server/runtime-coordinator.test.ts:1854`).
