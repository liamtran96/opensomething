# Plan: The assignment runtime

The proposals from the research file
[`../research/features/assignment-runtime.md`](../research/features/assignment-runtime.md)
(batch 6, reference commit `eee23ebbe`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. All paths below are in the reference project.

- **Steps:** 13 and 14.
- **State:** all open.
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
- **P85 (the invariant checks).** The checker reads all rows, and I10 has
  no check (`server/runtime/invariants.ts:37-126`). Also correct
  `../comparison.md`, which says "nine invariant checks": the contract has
  ten (`docs/runtime-contract.md:101-110`).
- **P138 (a limit for a question).** A parked root has no time limit and is
  never pruned. A test keeps one for 40 days
  (`server/runtime/types.ts:366-368`; `server/runtime/runtime.ts:859-861`;
  `server/runtime-coordinator.test.ts:1854`).
