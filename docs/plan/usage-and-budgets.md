# Plan: Usage and budgets

The proposals from the research file
[`../research/features/usage-and-budgets.md`](../research/features/usage-and-budgets.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 2, 5 and 8, a new step after 15 for caps (P381), and later
  (P383).
- **State:** all open.
- **The main finding:** the reference writes one row to a usage ledger for
  each settled turn, through one function, `bookTurnUsage`. The Usage page,
  the caps and the bot's `usage_limits` tool read this ledger. A failed write
  loses the row, and a stalled turn or a failed dispatch writes no row. Caps
  are checked only before a turn starts, so a running turn always finishes
  (`server/index.ts:1342-1351`, `:4958`, `:7480`;
  `server/usage-ledger.ts:129-140`).

## Proposals

- **P378 (plan, steps 2 and 5, `bot-protocol`). Usage on `turn.completed`.**
  `TurnCompleted` gets an optional `usage: Option<TurnUsage>`
  (`crates/bot-protocol/src/event.rs:26-27`). `TurnUsage` has `fresh_input`,
  `cache_read`, `cache_write`, `output` and `reasoning`, each an
  `Option<u64>`, and none overlaps another. It also has
  `cost: Option<Cost>`. This amends decision D20. With no usage, the JSON
  leaves the field out, so the test of step 2.4 (`event.rs:66-77`) still
  passes.
  - Why: follows the reference, which puts one usage figure for each turn
    on the last event. Better than the reference: the token fields are
    separate. The reference has three meanings of `input`, and it stores a
    cached count larger than the input.
  - Source: `packages/phone-protocol/src/runtime-events.ts:61-71`;
    `shared/usage-insights.ts:1-7`; `server/drivers/claude.ts:1503`,
    `:1579`; `server/drivers/openai-chat-cached-input.test.ts:32`.
- **P379 (plan, step 5, `bot-engine`). The chat driver reports usage.**
  PR 5.1 adds `stream_options: { include_usage: true }` to the request and a
  `usage` field to a chunk. PR 5.4 accepts a last chunk that has `usage` and
  no `choices`. It adds up the rounds of one turn and puts the total on
  `turn.completed`. A driver always gives the figures of one turn, so the
  core needs no capability flag for the ledger. If a later trace of each step
  needs the kind of report, it is a driver capability, not an engine name.
  - Why: follows the reference. Better than the reference: its recorder
    chooses by engine name, which `AGENTS.md` forbids.
  - Source: `server/drivers/openai-compat.ts:423`;
    `server/drivers/openai-compat.test.ts:746`;
    `server/drivers/openai-chat.ts:130-136`, `:411-412`, `:735-744`;
    `server/usage-trace/recorder.ts:87-90`.
- **P380 (plan, step 8, `bot-core`, amends P124). The ledger table.** A
  `turn_usage` table with a unique `(thread_id, turn_id)`, written in the
  same transaction as the end of the turn. A stalled turn and a failed
  dispatch also write a row, with what they reported. The totals of a thread
  are a query of this table, not a second store.
  - Why: follows the reference, which writes one row for each settled turn,
    for a success or a failure. Better than the reference: there a failed
    write loses the row, the stall path and the failed dispatch drop the
    tokens, nothing stops a second row for one turn (the trace adds such
    rows), and the thread totals in `bots.json` are a second store.
  - Source: `server/index.ts:6714-6731`, `:4958`, `:8403`;
    `docs/verification/usage-ledger.md:130-133`;
    `server/usage-ledger.ts:129-140`; `server/usage-trace/build.ts:99-108`;
    `server/store.ts:1805-1842`.
- **P381 (plan, new step after 15, `bot-core`). The cap gate.** Caps for
  each day and each month (UTC), in dollars and in tokens, for the workspace
  and for each bot. `stops` is `unattended` (the default) or `everything`. A
  token cap counts fresh input plus output. The gate is a pure check before
  each turn starts, and it gives a typed refusal. A run that already started
  is not checked again, and a running turn is never cut. Each cap and period
  has one notice, kept on disk. A refused hand-off gets its text from stored
  data.
  - Why: follows the reference. Better than the reference: the totals are a
    SQL sum with an index on `(bot_id, at)`. The reference reads a file cache
    again every 15 s, with a set in memory to stop a double count.
  - Source: `server/usage-caps.ts:54-57`, `:85-174`, `:224-262`;
    `server/index.ts:7444`, `:7480`, `:9598`;
    `server/host/usage-cap-gate.ts:116-175`; `docs/usage-caps.md:58-62`.
- **P382 (decision). One cap system.** Keep only the caps of P381. Do not
  port the separate monthly spend limit.
  - Why: better than the reference: less code, and one rule for a person who
    waits. The reference has two systems with the same `spend_cap` code and
    different rules. The monthly limit exists only with the `budgets`
    entitlement.
  - Source: `server/spend.ts:35-36`, `:47-60`;
    `server/usage-caps.ts:259-262`.
- **P383 (later, a new step or with P381, `bot-core`). Cost and billing
  mode.** The cost source is `Reported`, `Estimated` or `Notional`, and the
  row stores the billing mode of the engine at the time of the turn. Use the
  list price with dated changes, then the operator's own prices, in the order
  of the reference. An unknown price stays `None` and never shows as $0. A
  partial sum carries the count of rows with no price.
  - Why: follows the reference for the price order. Better than the
    reference: it decides "not billed" from today's sign-in. It prices a
    cache write as fresh input, but its own cost split weights a cache write
    at 1.25 times fresh input. The sum in the client skips unknown costs and
    does not say so.
  - Source: `server/model-prices.ts:17-54`; `server/prices.ts:19-37`;
    `server/routes/usage.ts:49-62`; `server/usage-trace/build.ts:243-244`;
    `src/lib/usage.ts:11-23`.
- **P384 (plan, the table "The problems of the reference").** Add P378,
  P379 and P383 to "Usage and cost numbers" (next to P124). Add P380 to "The
  same work done two times, or lost" and to "State lost at a restart". Add
  P381 to "A turn or a wait that does not end".
  - Why: P380 answers the state that the reference keeps only in memory:
    `turnUsage`, the recorder state and the attribution map. It also writes
    the Claude cost base with no durability. P381 follows the reference.
  - Source: `server/index.ts:4912`;
    `server/usage-trace/recorder.ts:131-137`;
    `server/usage-attribution.ts:7`;
    `server/drivers/claude-cost-history.ts:36`; `docs/usage-caps.md:58-62`.
- **P385 (plan, "Gaps that have no step").** Usage and budgets (part 21)
  puts its type in steps 2 and 5 (P378, P379) and its store in step 8
  (P380). It needs a new step after step 15 for caps (P381).
  - Why: caps refuse work in the runtime (step 13), in hand-offs (step 14)
    and in routines (step 15).
  - Source: `server/index.ts:7480`, `:3846`, `:8661`.

## New facts for proposals that exist

- **P251 and `changelog.md` section 7 ("Usage and cost numbers
  corrected"):** the text "input includes the cached tokens" is not at
  `runtime-events.ts:61-71`. It is at `server/drivers/claude.ts:1576-1586`,
  `server/drivers/codex.ts:1048-1049` and
  `server/drivers/openai-chat.ts:130-136`. For Claude and pi, `input` also
  includes cache writes (`claude.ts:1579`, `pi-usage.ts:47`). The lines
  `recorder.ts:87-90` choose by engine name how to read the token updates of
  each trace step. The turn total in the ledger comes from
  `turn.completed.usage` (`server/index.ts:6696`).
- **P124:** P380 folds into it and does not repeat it.
