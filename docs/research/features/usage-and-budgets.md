# Usage and budgets

The record of how the reference project counts the usage of a turn, stores
it, prices it, stops new work at a spend cap, and shows it in the UI.

- Reference: the reference project at commit `96ff84455` (HEAD of the clone
  on 2026-11-26, so the files were read directly).
- Rows of [`reference-features.md`](../reference-features.md): "Token usage
  split into new input, cache write and cache read" and "Spend caps for each
  bot and for the workspace, checked before a turn starts", from the plan
  `docs/superpowers/plans/2026-08-31-01-usage-accounting-and-budgets.md`.
  Part 21. Group "later".
- Six subagents read the files in groups: `ledger`, `caps-and-spend`,
  `trace-and-token-split`, `routes-insights-callers`, `ui-usage-caps` and
  `ui-trace-insights`. A seventh subagent checked 60 key claims against the
  code: 54 were confirmed, 6 were partly right and were corrected here, none
  were wrong. The lead checked seven claims in the code (`index.ts:1342-1351`,
  `:4958`, `:5131-5142`, `:7480`, `recorder.ts:87-90`, `runtime-events.ts:61-71`,
  `usage-caps.ts:54-57`).

## 1. In short

When a bot finishes a turn, the server of the reference project writes one
row to the **usage ledger**. The row holds the token counts of the turn, its
cost, the bot, the thread, the model and who asked for the work. The Usage
page, the caps and the bot's own `usage_limits` tool all read this ledger.

Terms:

- **Turn**: one request to an engine and the reply, with its tool calls.
- **Usage ledger**: an append-only file of JSON lines, one file for each UTC
  month, at `<data>/usage/YYYY-MM.jsonl`. "Append-only" means that the server
  adds lines and never changes or removes a line.
- **Fresh input**: prompt tokens that the provider did not have in its cache.
- **Cache read** (`cachedInput` in the reference): prompt tokens that the
  provider read from its prompt cache. They cost less.
- **Cache write** (`cacheWrite`): prompt tokens that the provider wrote to its
  cache on this call. For Claude they cost more than fresh input.
- **`input`** in the ledger is the gross prompt: fresh input plus cache reads,
  and for Claude and pi also cache writes. The reference subtracts
  `cachedInput` to get "new tokens".
- **Bar tokens**: fresh input plus output, summed row by row. The Usage page
  bars and the token caps count this figure (`server/usage-ledger.ts:375`,
  `server/usage-caps.ts:54-57`).
- **Running total**: some engine CLIs report the total of a whole session or
  process, not of one turn. The driver must take the difference.
- **Cost source**: `reported` (the engine gave a figure) or `estimated` (the
  server multiplied tokens by a price). A row with no price has
  `costUsd: null`, which the reference calls **unpriced**.
- **Notional cost**: a cost that an engine reports on a subscription sign-in.
  Nobody pays it per token.
- **Usage cap**: a limit that the owner sets, in dollars or tokens, for one UTC
  day or one UTC month, for all bots together ("server") or for one bot.
- **Monthly spend limit** (the "budget"): a second, separate limit in dollars
  for the whole workspace. Only an edition with the `budgets` feature has it.
- **`stops`**: what a reached usage cap stops. `unattended` (the default)
  stops only work that no person waits for. `everything` also stops a
  person's own messages.
- **Trace**: a timeline of one run. It shows each AI step and each tool call
  of a turn and of the turns that it delegated, with times, tokens and a share
  of the cost.

The 2026-08-31 plan is **not** what the reference built. The plan asked for a
three-way split of `input` (`inputFresh`, `inputCacheWrite`, `inputCacheRead`),
a pure `server/budget.ts`, a `budgetUsd` field on each bot and a
`budget.exceeded` event. None of these is in the code. The reference built
day and month caps in dollars and tokens instead (`docs/usage-caps.md:10-19`),
and kept `input` as one gross number with `cachedInput` inside it
(`packages/phone-protocol/src/wire.ts:91-103`). The table in section 3.8 has
each task of the plan.

What this file adds to the files that are done:

- [`harness-upgrades.md`](harness-upgrades.md) found the keep-warm fix of
  v0.1.178 and named the ledger as built. This file adds the full row, the
  write path, the caps, the trace and the UI, and finds three more paths that
  lose usage (section 3.3).
- [`automations.md`](automations.md) found that a capped routine run becomes
  a skip row. This file adds where the cap comes from, how it is counted and
  why a person's manual run is not stopped.
- [`chat-ui.md`](chat-ui.md) section 3.15 has the per-thread usage that
  `store.addTaskUsage` keeps in `bots.json`. This file shows that it is a
  second store, apart from the ledger (section 4.4).
- Border with `chat-and-teams-site`: the token usage row of the chat
  (`src/lib/chat-usage-summary.ts`, `usageChip` in `src/lib/usage.ts:132-137`)
  and the group usage chip (`GroupUsageChip.tsx`) are its parts. They meet
  this feature at two places only: `GroupUsageReader` reads the ledger for a
  room thread (`server/group-thread-usage.ts:35-91`), and the per-thread
  totals come from `store.addTaskUsage` (`server/store.ts:1805-1842`).

## 2. Files read completely

Paths are relative to the root of the reference project.

| Group | File | Lines |
|---|---|---|
| ledger | `docs/superpowers/plans/2026-08-31-01-usage-accounting-and-budgets.md` | 242 |
| ledger | `docs/usage-caps.md` | 174 |
| ledger | `docs/verification/usage-ledger.md` | 148 |
| ledger | `server/usage-ledger.ts` | 470 |
| ledger | `server/usage-ledger.test.ts` | 392 |
| ledger | `server/usage-ledger-api.test.ts` | 74 |
| ledger | `server/usage-attribution.ts` | 46 |
| ledger | `server/usage-attribution.test.ts` | 42 |
| ledger | `server/usage-attribution.e2e.test.ts` | 308 |
| ledger | `server/group-thread-usage.ts` | 92 |
| ledger | `server/group-thread-usage.test.ts` | 71 |
| ledger | `server/group-thread-usage.e2e.test.ts` | 41 |
| ledger | `server/bot-usage.e2e.test.ts` | 128 |
| ledger | `server/room-limit-takeover.e2e.test.ts` | 122 |
| caps | `server/usage-caps.ts` | 291 |
| caps | `server/usage-caps.test.ts` | 166 |
| caps | `server/usage-caps.e2e.test.ts` | 187 |
| caps | `server/usage-caps-config.ts` | 27 |
| caps | `server/spend.ts` | 122 |
| caps | `server/spend.test.ts` | 170 |
| caps | `server/spend-cap-api.test.ts` | 307 |
| caps | `server/spend-cap-goal.e2e.test.ts` | 149 |
| caps | `server/spend-alert-write-failure.test.ts` | 71 |
| caps | `server/host/usage-cap-gate.ts` | 189 |
| caps | `server/host/usage-cap-gate.test.ts` | 146 |
| caps | `server/host/starter-caps.ts` | 77 |
| caps | `server/host/starter-caps.test.ts` | 73 |
| caps | `server/host/chief-incident-spend.test.ts` | 196 |
| caps | `server/routes/usage-caps.ts` | 40 |
| caps | `server/sentinel/detectors/cost.ts` | 27 |
| caps | `server/prices.ts` | 37 |
| caps | `server/prices.test.ts` | 27 |
| caps | `server/model-prices.ts` | 54 |
| caps | `server/model-prices.test.ts` | 121 |
| caps | `docs/verification/spend-cap.md` | 81 |
| trace | `server/usage-trace/build.ts` | 342 |
| trace | `server/usage-trace/build.test.ts` | 162 |
| trace | `server/usage-trace/detail.ts` | 76 |
| trace | `server/usage-trace/ledger.ts` | 79 |
| trace | `server/usage-trace/recorder.ts` | 456 |
| trace | `server/usage-trace/recorder.test.ts` | 279 |
| trace | `server/usage-trace/service.ts` | 83 |
| trace | `server/usage-trace/spans.ts` | 161 |
| trace | `server/usage-trace/token-breakdowns.test.ts` | 100 |
| trace | `shared/usage-trace.ts` | 185 |
| trace | `server/usage-traces.e2e.test.ts` | 76 |
| trace | `scripts/verify-usage-traces.ts` | 165 |
| trace | `packages/phone-protocol/src/runtime-events.ts` | 215 |
| trace | `server/cli-usage.ts` | 137 |
| trace | `server/drivers/pi-usage.ts` | 60 |
| trace | `server/drivers/acp/prompt-usage.ts` | 21 |
| trace | `server/drivers/claude-cost-history.ts` | 92 |
| trace | `server/drivers/claude-billing.ts` | 40 |
| trace | `server/drivers/openai-chat-cached-input.test.ts` | 99 |
| trace | `server/thread-cache-read-budget.test.ts` | 143 |
| routes | `server/routes/usage.ts` | 168 |
| routes | `server/routes/bot-usage.ts` | 91 |
| routes | `server/routes/bot-usage.test.ts` | 123 |
| routes | `server/routes/usage-not-billed.test.ts` | 19 |
| routes | `server/usage-insights.ts` | 158 |
| routes | `server/usage-insights.test.ts` | 52 |
| routes | `shared/usage-insights.ts` | 71 |
| routes | `server/host/value-ledger.ts` | 84 |
| routes | `server/host/value-ledger.test.ts` | 41 |
| routes | `server/drivers/agents-usage-tool.ts` | 36 |
| routes | `server/drivers/agents-usage-tool.test.ts` | 58 |
| UI | `src/lib/usage.ts` | 143 |
| UI | `src/lib/usage.test.ts` | 185 |
| UI | `src/components/UsageSection.tsx` | 408 |
| UI | `src/components/UsageSection.bars.test.ts` | 107 |
| UI | `src/components/UsageSection.botnames.test.ts` | 40 |
| UI | `src/components/UsageSection.model-colors.test.ts` | 37 |
| UI | `src/components/UsageCaps.tsx` | 214 |
| UI | `src/components/UsageCaps.test.ts` | 100 |
| UI | `src/components/UsageBudget.tsx` | 207 |
| UI | `src/components/UsageBudget.test.ts` | 57 |
| UI | `src/components/EngineUsage.tsx` | 278 |
| UI | `src/components/bot-settings/UsageSection.tsx` | 60 |
| UI | `src/components/bot-settings/UsageSection.test.ts` | 47 |
| UI | `src/components/usage/TraceIcon.tsx` | 81 |
| UI | `src/components/usage/TraceView.tsx` | 107 |
| UI | `src/components/usage/TraceWaterfall.tsx` | 290 |
| UI | `src/components/usage/UsageInsights.tsx` | 666 (ranges 1-340, 340-666) |
| UI | `src/lib/usage-trace.ts` | 275 |
| UI | `src/lib/usage-trace.test.ts` | 134 |
| UI | `scripts/testing/usage-details-ui.e2e.test.ts` | 156 |
| UI | `scripts/testing/usage-traces-preview.tsx` | 17 |

That is 87 files, read in full. Ranges only:

- `server/index.ts` (15,258 lines): 189-197, 1270-1360, 1652-1658,
  3844-3847, 4036-4050, 4912-4960, 5045-5060, 5125-5190, 6560-6810,
  7085-7100, 7236-7246, 7385-7406, 7440-7486, 7655-7662, 8385-8405,
  8448-8464, 8661, 9334-9340, 9588-9600, 11381, 11913, 11929, 12163-12172.
- `server/drivers/claude.ts` (2,016): 355-395, 815-830, 885-893, 1330-1400,
  1445-1456, 1480-1625, 1875-1910.
- `server/drivers/codex.ts` (1,583): 565-585, 665-680, 910-935, 1035-1085,
  1240-1262.
- `server/drivers/openai-chat.ts` (1,000): 45-80, 125-140, 315-360, 400-415,
  580-590, 725-750, 900-930.
- `server/drivers/openai-responses.ts` (282): 160-210, 270-282.
- `server/contracts.ts` (698): 58-70, 345-395, 590-612.
- `server/store.ts` (2,256): 1795-1845.
- `packages/phone-protocol/src/wire.ts` (1,000): 85-110, 178-210, 830-842.
- `server/side-jobs.ts` (315): 1-20, 40-120, 150-315.
- `server/cache-keepwarm.ts`: 85-140. `server/config.ts`: 35, 314-324,
  445-448, 908-913. `server/routes/channels.ts`: 380-410.
  `server/host/private-records.ts`: 20-50. `server/admin-activity.ts`:
  185-205. `server/routines.ts`: 1055-1075. `server/drivers/pi.ts`: 380-400,
  670-700. `server/drivers/acp/core.ts`: 1305-1335. `src/lib/limit-resets.ts`:
  20-60, 88-132. `src/state/store.tsx`: 267-275. `src/locales/en.json`: the
  keys `usage.*`, `trace.*`, `insights.*`, `chat.usage.*` (lines 2648,
  2883-2910, 4357-4495, 5590-5609, 11415-11418, 11678-11721).

Excluded on purpose: the Cloud plan usage (`server/plan-usage*`,
`CloudUsageMeter*`, `PlanUsage*`, `src/lib/usage-meter.ts`,
`src/lib/plan-spend.ts`), the analytics snapshot (`src/lib/usage-snapshot.ts`),
the chat usage row and group chip (border only), and the quota limits of the
engines (`antigravity-usage-limits`, `codex-usage-limit`, `quota-switch`).

## 3. How it works

### 3.1 How each engine reports usage

Each driver changes the raw figures of its engine into one shape:
`turn.completed { ok, cost?, usage?: { input, output, cachedInput? } }`
(`packages/phone-protocol/src/runtime-events.ts:61-71`). The comment says that
`usage` is "THIS turn's token total" and that `thread.token-usage.updated`
"must never be summed" (`:67-69`). The event has no `cacheWrite` and no
`reasoning` field. The comment does not say whether `input` includes cached
tokens. The drivers make it gross:

1. **Claude.** Turn `input` = `input_tokens + cache_read_input_tokens +
   cache_creation_input_tokens`, and `cachedInput` = cache reads
   (`server/drivers/claude.ts:1576-1586`). The CLI's `total_cost_usd` is a
   running total of the process (CLI 2.1.282, `:1554-1555`). `settle` books
   `total - previous total` (`:1361-1362`,
   `server/drivers/claude-cost-history.ts:40-46`).
   - The previous total is in the in-memory session (`claude.ts:822`). On
     `--resume`, the driver finds it again in
     `<data>/claude-cost-history.json` (100 sessions, 8 snapshots each,
     `claude-cost-history.ts:7-9`, `:71-92`).
   - If the previous total is unknown, or the total went down, the driver
     books the **whole** total as this turn (`claude-cost-history.ts:44`).
   - The history file is written with `durable: false`, and errors are
     ignored (`:36-37`).
   - Per model call, the driver sends `thread.token-usage.updated` with
     `input = fresh + cache read` only. Cache writes are not in it
     (`claude.ts:1503`, `claude-billing.ts:33-38`). So the live figure and
     the settled figure disagree. This is the bug that Task 2 of the plan
     names (plan:38-40). It is still in the code.
   - If one logical turn spans several CLI turns (a steer), the driver adds
     the usage and takes the **latest** cost (`claude.ts:373-393`).
2. **Codex.** The app-server reports a running total for its process
   (`codex.ts:574`). The driver keeps a baseline from before the turn and
   books `max(0, total - baseline)` (`:922-926`, `:1047-1062`). "codex's
   inputTokens already includes cachedInputTokens" (`:1048-1049`). Every
   `turn.completed` has `cost: null` (`:413`, `:429`, `:677`).
3. **OpenAI-style chat and the Responses API.** `input = prompt_tokens`, which
   already includes cached tokens (`openai-chat.ts:130-136`,
   `openai-responses.ts:199-207`). The driver adds the rounds of one turn
   (`openai-chat.ts:735-744`). A failed attempt that is retried adds nothing,
   because usage is added only after a completion returns (`:725-735`). Cost is
   `null` on the turn (`:923-924`).
4. **pi.** pi's own `input` leaves out cached tokens (`pi-usage.ts:1`). For the
   turn, the driver adds `fresh + cacheRead + cacheWrite` (`:47`). pi sends a
   call's usage on `message_end` and again on `turn_end`. A flag counts it once
   (`:36`, `:55-59`). A cost of 0 stays unknown, not free (`:34`, `:51-52`).
5. **ACP engines.** opencode 1.18.25 leaves cache reads out of `inputTokens`.
   Other ACP agents count them inside. `promptTokenUsage` makes `input`
   gross in both cases (`acp/prompt-usage.ts:11-19`).

Limits and edge cases:

- An OpenAI-style provider can report `cached_tokens` larger than
  `prompt_tokens`. The ledger stores the larger figure as it is (2,400 cached
  on 2,000 input). Cost and cap tokens clamp it to the input
  (`openai-chat-cached-input.test.ts:32`, `:90-93`).
- A turn with no `usage` on `turn.completed` falls back to the last
  `thread.token-usage.updated` of the thread (`server/index.ts:6696`).

### 3.2 How one turn is booked

1. While the turn runs, each `thread.token-usage.updated` **replaces** the
   entry for the thread in the in-memory map `turnUsage`
   (`server/index.ts:6619-6620`, map at `:4912`).
2. On `turn.completed`, the server takes `tokens = event.usage ?? lastReported`
   (`:6665-6666`, `:6696`).
3. It adds the turn to the per-thread totals in `bots.json` with
   `store.addTaskUsage` (`:6699-6705`, `server/store.ts:1805-1842`). This is a
   second store (section 4.4).
4. It calls `bookTurnUsage` once (`:6714-6731`). The row has `input`,
   `output`, `cachedInput` when it is a number, `costUsd: event.cost ?? null`,
   the model (or the model of a backup engine) and the trigger. The server books
   the row if the turn succeeded or failed, and also if it was stopped.
5. `bookTurnUsage` (`:1342-1351`):
   1. Price: if tokens were reported or a cost was given, `ledgerCost`
      (section 3.5). Otherwise `costUsd: null` (`:1343`).
   2. Add the trace fields of the thread (`usageTrace.settle`: `cacheWrite`,
      `reasoning`, times, steps, tools, `usageStatus`) and the attribution
      (section 3.4) (`:1344`).
   3. `noteSpend(DATA_DIR, booked, appendUsage(DATA_DIR, booked))` (`:1346`).
      The append is asynchronous. `noteSpend` counts the row from memory until
      the append lands, so the next cap check sees it (comment at `:1345`).
   4. Send the spend alert of the monthly limit to admins, if one is due
      (`:1347-1350`).
   5. `usageCapGate.booked(botId)` announces a reached cap or the 80 % line.
      It does not stop the running turn (`usage-cap-gate.ts:176-178`).
6. `appendUsage` (`server/usage-ledger.ts:115-151`) cleans the numbers:
   negative to 0, fractions cut, a bad cost to `null`. It puts the write on a
   promise chain for each data folder. It appends
   `JSON.stringify(row) + "\n"` to the month file of the row's `at` time.
   The file mode is 0600 and the folder mode 0700. There is no fsync and no
   rename. A failed write returns `false` and the row is lost
   (`:129-140`, test `usage-ledger.test.ts:93-99`).
7. A room member turn does the same steps (`index.ts:6771-6797`). Then it
   flushes the ledger, refreshes `GroupUsageReader` and sends the new group
   state (`:6793-6797`).

Every row of the ledger comes from `bookTurnUsage`. A grep finds it only at
`index.ts:1342`, `:5054` (side jobs), `:5134` and `:5140` (keep-warm and
compaction) and `:6714`, `:6778` (turn ends).

### 3.3 Other paths that book usage, and paths that lose it

1. **Side jobs** (memory capture, organize, tidy, skill review, status reply,
   and more, `server/side-jobs.ts:42`). Before each call, the job checks the
   monthly limit (`:165`, `:172`, wired at `index.ts:5053`). It also asks the
   cap gate with no bot and a waiting person, so only the server caps apply,
   and only under `stops: everything` (`docs/usage-caps.md:55-56`). Each call books its own row with a new thread id
   `<job>-<uuid>` and the trigger `bot` or `helper` (`side-jobs.ts:166`,
   `:178`). So a side job is charged to the bot, not to the conversation it
   served.
2. **Keep-warm pings and warm summaries** (Claude on a subscription only,
   `index.ts:5162-5163`). Before each ping, `overBudget()` checks the monthly
   limit and the caps (`cache-keepwarm.ts:110`, `index.ts:5167`). Only a ping
   that succeeds is booked (`cache-keepwarm.ts:121-124`). `bookForkUsage`
   books `input = input + cacheRead + cacheWrite` and
   `cachedInput = cacheRead` (`index.ts:5131-5137`). This follows the ledger
   rule that `input` is gross, so the bar tokens of a ping are its fresh input,
   its cache write and its output. The ping row uses the thread id of the
   conversation, so a room counts a ping as one more turn
   (`group-thread-usage.ts:15`).
3. **Engine compaction in a warm summary** is booked with `costUsd: null`
   (`index.ts:5138-5141`). Compaction **inside** a turn on the bot's own
   engine is not booked on its own: "The summary belongs to a turn that
   already passed the spend limit" (`side-jobs.ts:291-292`).
4. **Lost usage.** These paths delete `turnUsage` and never call
   `bookTurnUsage`:
   - A stalled turn, from the watchdog (`index.ts:4958`, in `onStall` at
     `:4933`).
   - A failed dispatch (`:8403`).
   - A turn that is still running when the server stops. "Only a turn that
     never settles (refused before it started, or the server stopped first)
     leaves no row" (`docs/verification/usage-ledger.md:130-133`).
   - A failed ledger append (step 6 of section 3.2).
   - A keep-warm ping that fails (`cache-keepwarm.ts:121-124`).

### 3.4 Attribution: who the spend was for

1. The trigger of a row comes from what started the turn:
   `user {email?, label?}`, `owner`, `routine {routineId, runId, email?}`,
   `bot {botId}` or `helper {botId, job}` (`usage-ledger.ts:15-20`). A paired
   device gives its label. Loopback gives "This computer" (`:285-329`).
2. A queued message, a steer, or a press on Steer does not book the running
   turn again. The queued message's own turn is booked to its sender
   (`usage-attribution.e2e.test.ts:178-250`).
3. `createUsageAttribution` (`server/usage-attribution.ts:18-41`):
   - It stamps the bot's department (`section`) at booking time, so a later
     move never rewrites history (`:1-4`, `:27`).
   - It gives a routine row the email of the person who wrote the routine
     (`:29-31`).
   - It gives a delegated row (any trigger other than `user` or `routine`, with a
     `parent`) the email of the parent turn. It finds it in an in-memory map of
     at most 5,000 turns, or from the trigger of the running parent thread
     (`:7`, `:32-36`).
4. Attribution changes only `email` and `section`. The cost stays on the bot
   that did the work (`:38-40`).
5. A backup engine that takes over a turn at an engine limit books to the same
   bot and the same thread, with the backup's `instanceId`
   (`room-limit-takeover.e2e.test.ts:58`, `:73-88`).

Edge case: after a restart the map of 5,000 turns is empty. A child turn whose
parent was booked before the restart gets an email only if the trigger of the
parent thread is still known (`index.ts:1342` passes `turnTriggers.get`).

### 3.5 Cost

`ledgerCost(turn, operatorPrices, at)` (`server/model-prices.ts:43-54`):

1. A finite cost of 0 or more from the engine is kept as `reported`
   (`:48-49`). On a subscription sign-in this figure is notional.
2. Otherwise the server estimates it with `billableFor` and the first price
   that it finds (`:34-41`). The order is: the operator price for
   `driver/model`, for the model, then for the base model, then the built-in
   list price, then the operator `default`. The base model is the model
   without a Codex tier suffix or an Antigravity level. The result is
   `estimated`.
3. With no price at all, the cost is `null` (unpriced), "not as free"
   (`model-prices.test.ts:117-120`).

`billableFor` (`server/prices.ts:29-37`): `cached = min(cachedInput, input)`,
`fresh = input - cached`. Cached tokens use `cachedInputPerMillion`, or the
input rate when that is blank. There is no price for cache writes. Cache
writes are inside `input`, so they are priced as fresh input.

The built-in list price comes from the model manifest (`model-prices.ts:13-15`)
and honours dated price changes by the UTC day of the turn (`:22-24`).

The operator's sell prices (`cfg.billing.prices`) add a `billableUsd` column
to the summary and the CSV. Only an edition with the `billing` feature has
them (`server/routes/usage.ts:128-138`, `UsageBudget.tsx:196-207`).

`notBilled` sums the cost of rows whose engine is on a subscription **now**.
The comment says that the row keeps no record of how its engine was signed in
when it ran (`server/routes/usage.ts:49-62`).

### 3.6 Usage caps: how they are counted

1. The caps are in `config.json` under `usageCaps`, with the strict schema
   `{ stops?, server?, bots?: { <botId>: limits } }`. The limits are
   `dailyUsd`, `monthlyUsd`, `dailyTokens` and `monthlyTokens`. Dollars go from
   0 to 1,000,000. Tokens are whole numbers up to 10^12
   (`server/usage-caps-config.ts:4-24`). 0 or empty means no cap. There is no
   weekly cap (`usage-caps.test.ts:125-130`).
2. Environment variables `OMB_USAGE_CAP_DAILY_USD`, `..._MONTHLY_USD`,
   `..._DAILY_TOKENS`, `..._MONTHLY_TOKENS` and `OMB_USAGE_CAP_STOPS` win
   field by field over `config.json`. They set the server caps only, never
   the caps of a bot (`usage-caps.ts:20-26`, `:213-227`).
3. Periods are UTC days and UTC months (`:62-70`). The text of a refusal shows
   the reset time in the time zone of the host (`usage-cap-gate.ts:70-73`).
   The Settings card shows it in the time zone of the browser, with no zone
   name (`UsageCaps.tsx:67`).
4. A dollar cap counts `costUsd`, and an unpriced row counts as $0
   (`usage-caps.ts:51`, `:60`). A token cap counts bar tokens:
   `max(0, input - min(cachedInput, input)) + output` (`:54-57`). Cache reads
   are left out. Cache writes are inside `input`, so they count.
5. `usageTotals` (`:142-154`) keeps an in-memory sum for each data folder:
   - On a new day, it reads the month file again from the start (`:145`).
   - Otherwise, after 15 s (`CACHE_MS`, `:13`), it reads only the bytes that
     were appended (`:121-140`). A file that got shorter is read again from
     the start.
   - `countLines` counts whole lines only and leaves a part line for later
     (`:85-98`).
   - A row that this process booked is counted from memory at once
     (`noteUsage`, `:157-174`). When its append lands, the key
     `at|threadId|botId` is marked, and the file read skips it (`:93`). So the
     row is counted once.
   - If the append fails, the row leaves the totals (`spend.test.ts:86-91`).
6. `measure` (`:182-185`): `percent = min(999, round(used/limit*100))`,
   `warn` at 80 % or more, `reached` when `used >= limit`.
7. `reachedCap(work)` (`:259-262`): if a person waits and `stops` is not
   `everything`, nothing stops the work. Otherwise it returns the reached cap
   with the latest reset (a month cap before a day cap, `:253-256`), from the
   server caps and the caps of this bot.
8. `personWaiting` (`:277-285`) is true for a person's message, for a manual
   routine run and for a hand-off that started from a person's typed line. It
   is false for a schedule, a webhook, a Bot API call and an app event.

### 3.7 Where the caps are checked, and what happens at a cap

Caps are checked only **before** work starts. "Nothing is cut off mid-turn"
(`docs/usage-caps.md:58-62`).

| Place | Check | Result at a cap |
|---|---|---|
| `beginTurn` (`index.ts:7480`) | monthly limit, then the usage caps unless `continuesRun` | throws 409, code `spend_cap`, with `resetsAt` |
| Room member turn (`:9598`) | the same two | an activity line "reached its monthly spend limit" (`spend-cap-api.test.ts:298-301`) |
| Direct send (`:7093-7098`) | the same two | 409 `spend_cap` |
| Channel post (`routes/channels.ts:400-404`) | monthly limit only. The caps come later at `:9598` | 409 |
| Webhook enqueue (`index.ts:9338`) | caps | 429 with `Retry-After` |
| Bot API call | caps | 429 with `Retry-After` (`usage-caps.e2e.test.ts:61-66`) |
| Routine fire (`:8661`, `routines.ts:1060-1070`) | caps, with `personWaiting` false | one `missed` row for each routine, cap and period, with the cause `cap:<routineId>:<capId>:<periodKey>`. A one-time routine moves to the reset time |
| Hand-off (`:3846`) | caps | text to the asking bot: "Nothing was handed to @name ... Do not retry, and do not hand this to another bot to work around the cap." (`usage-cap-gate.ts:169-175`) |
| Side jobs (`:5053`) | monthly limit, and server caps under `everything` | the call is not sent |
| Keep-warm (`:5167`) | monthly limit and caps | the warm window ends |
| Warm summary (`:5182`) | monthly limit only, not the caps | — |
| Title generation (`:7394-7398`), person replies (`:7243`) | monthly limit only | — |

`continuesRun` is set for a hand-off result, an answered card and a restart:
"usage caps never refuse it" (`index.ts:7444`). The **monthly limit** still
applies to it (`:7480`).

The monthly limit (`server/spend.ts`) is different from the caps:

1. It exists only with the `budgets` entitlement and `monthlyUsd > 0`
   (`:35-36`).
2. It counts dollars for the whole server, for the UTC month, from the same
   totals (`:22-24`).
3. It stops **every** turn, with no exception for a waiting person
   (`:47-60`).
4. Admins get one notice at the warn percentage (default 80) and one at the
   limit. The marks are in `<data>/usage/alerts.json`. If the write fails, the
   mark stays in memory and the server tries again on the next check
   (`:71-108`, `spend-alert-write-failure.test.ts`).

What a person sees:

- One notice "Usage cap reached" for each cap and period, to admins only. The
  80 % line of a cap writes only a log line (`usage-cap-gate.ts:127-139`). The
  marks are in `<data>/usage/cap-notices.json`, written atomically. If that
  write fails, a notice can come again after a restart (`:101-108`).
- A refusal text, for example "Not started: Ada's monthly usage cap
  (5,000 tokens) is reached. New work starts again by itself after <time>, or
  sooner if the owner raises the cap in Settings → Spending."
  (`usage-cap-gate.test.ts:92-93`).

Error paths and limits:

- The turn that reaches the cap finishes. The total can go past the cap
  (`usage-caps.e2e.test.ts:56-59`, `spend-cap-api.test.ts:173`,
  `UsageCaps.test.ts:41`, 125 % used).
- A goal at the limit ends as `blocked`, with one activity line and no retry
  (`spend-cap-goal.e2e.test.ts:74-86`).
- A webhook run whose hand-off was in flight when the cap was reached carries
  on to the end (`usage-caps.e2e.test.ts:147-187`).
- At the reset, nothing is announced. Skipped repeating runs are not made up
  (`docs/usage-caps.md:99-102`).
- A PUT of the caps replaces the whole object. A body without `stops` saves
  `unattended` (`server/routes/usage-caps.ts:36-37`).

### 3.8 The 2026-08-31 plan compared with the code

| Task of the plan | In the code at `96ff84455` |
|---|---|
| 1. Split `TaskUsage` into `inputFresh`, `inputCacheWrite`, `inputCacheRead` (plan:66-84) | No. `TaskUsage` is `{input, output, cachedInput?, costUsd, turns, lastTurn?, context?}` (`wire.ts:91-103`) |
| 2. One `usageFrom` formula in the Claude driver (plan:88-103) | No. The live figure leaves out cache writes (`claude.ts:1503`), and the settled figure has them (`:1579`) |
| 3. Map Codex and other drivers to the new names (plan:107-117) | No |
| 4. A pure `server/budget.ts` with `evaluateBudget` (plan:121-143) | No. The caps are in `usage-caps.ts` and `host/usage-cap-gate.ts` |
| 5. `budget.workspaceUsd` and `BotRecord.budgetUsd` (plan:147-164) | No. `usageCaps` (day and month, USD and tokens) and the licensed `budgets.monthlyUsd` (`config.ts:317-323`) |
| 6. Enforce at dispatch with a `budget.exceeded` event and 402 (plan:168-185) | Partly. Enforcement is before the turn, with 409 `spend_cap` or 429. There is no such event |
| 7. A readable Usage screen with `freshTokens` (plan:189-206) | Partly. `freshTokens = uncached input + output` (`src/lib/usage.ts:76-78`). Cache writes count as fresh |
| 8. `BudgetSection.tsx` with `parseBudgetInput` (plan:210-222) | No. `UsageCaps.tsx` and `UsageBudget.tsx` |

The plan says that 0 is "a deliberate freeze" (plan:139). The code says that 0
means no cap (`usage-caps-config.ts:13-15`).

### 3.9 The trace

1. The recorder (`server/usage-trace/recorder.ts`) listens to the event bus
   (`index.ts:6248`). It keeps live turns, steps and tools in memory (`:131-137`).
2. It reads the per-call token updates by the **name** of the engine
   (`:87-90`):
   - `claude` (per call): each repeated frame of a call replaces the step's
     figures. `cacheWrite = contextTokens - input` (`:254-255`).
   - `codex` (thread totals): the difference from the last total of the thread
     (`:257-259`).
   - nine OpenAI-style names (turn totals): the difference from the last turn
     total (`:262-264`).
   - other engines (pi, ACP, Gemini): no step tokens (`:249-265`).
3. `settle(threadId)` gives the trace fields to `bookTurnUsage` one time. A
   second call returns `{}` (`:371-399`, test `recorder.test.ts:59`). The
   `cacheWrite` of the row comes only from Claude steps (`:382`).
4. Spans go to `<data>/usage/spans/YYYY-MM-DD.jsonl`. They are batched for
   1 s, written at once when a turn ends, and a failed write is dropped
   (`spans.ts:94-117`). The last line for a span id wins (`:148-149`). Files
   older than 90 days are deleted (`:39`, `:76-83`). The ledger rows are kept
   for ever.
5. A live turn that is not seen to end is closed as interrupted after 30
   minutes, in the trace only (`recorder.ts:82-83`, `:421-434`).
6. The read side (`build.ts`, `service.ts`) reads the ledger and the spans.
   - Rows that share `threadId:turnId` are **added together** (`build.ts:99-108`,
     test `token-breakdowns.test.ts:61-68`).
   - Parent links make a tree, with a guard against loops (`:159-171`).
   - A step's cost is a share of the turn's cost, weighted by
     `fresh + 0.1·cacheRead + 1.25·cacheWrite + 5·output` (`:243-266`). It is
     an estimate, not a reported figure.
   - The list reads 3 days more on each side of the range, so late children
     link (`service.ts:19-20`).

Edge cases:

- After a restart, the recorder has no last total for a Codex thread. It drops
  the first update, so the `reasoning` of that turn in the ledger is too low.
  `input`, `output` and `cachedInput` are correct, because they come from
  `turn.completed` (`recorder.ts:136`, `:257-259`, `codex.ts:922-926`).
- No production code calls `flushSpans` at shutdown, so up to 1 s of spans can
  be lost (`spans.ts:102-117`).

### 3.10 Read routes and the bot's own view

1. `GET /api/usage?from&to&groupBy&splitBy` and `GET /api/usage.csv` need the
   admin scope (`server/request-auth.test.ts:609-619`). They return the groups,
   the total, `budget`, `caps` (owner only), `notBilled` and `billing`
   (`routes/usage.ts:101-138`). `groupBy` is bot, model, user, day, engine,
   routine or department (`usage-ledger.ts:56-57`). The CSV makes cells that
   start with `= + - @` safe (`:440-446`).
2. `GET /api/usage/insights?from&to&tz` (admin) returns the period and the
   period before it, in the time zone of the viewer (`usage-insights.ts:104-158`).
3. `GET /api/usage/traces` and `/api/usage/traces/:id` filter threads by what
   the viewer may see (`routes/usage.ts:68-88`).
4. Every read route first waits for `flushUsageLedger` (`:74`, `:84`, `:96`,
   `:104`).
5. A range is at most 366 days, with UTC dates (`usage-ledger.ts:269-283`).
6. For a viewer who cannot see a thread, a row keeps the amounts but loses the
   thread, the turn, the routine and the bot (`host/private-records.ts:24-45`).
7. The bot's `usage_limits` tool with `scope: "bot"` calls
   `GET /api/internal/engine-limits?scope=bot&period=today|month&thread=this`
   (`routes/bot-usage.ts:49`, `agents-usage-tool.ts:22-24`).
   - It shows only settled turns that the conversation can see (`:68-72`).
   - If the ledger cannot be read, it returns 503, not zero (`:63-67`).
   - It shows all caps with headroom only when the thread may read exact
     totals. Otherwise it shows only the cap that blocks work, "only the cap
     details that a refusal would disclose" (`:78-82`).

## 4. The data

### 4.1 The ledger row (`UsageRow`, `server/usage-ledger.ts:22-54`)

| Field | Type | Meaning |
|---|---|---|
| `at` | ISO string | booking time. It selects the month file |
| `botId`, `botName` | string | the bot, and its name at booking time |
| `threadId` | string | the thread. A side job has `<job>-<uuid>` |
| `instanceId`, `driverKind`, `model` | string | the engine and the model |
| `input` | integer | gross prompt tokens |
| `output` | integer | output tokens |
| `cachedInput?` | integer | cache reads, inside `input` |
| `promptBytes?` | `{stable, volatile}` | the size of the prompt |
| `costUsd` | number or `null` | the cost. `null` is unpriced |
| `costSource?` | `reported` or `estimated` | absent when the cost is `null` |
| `trigger` | object | who started the work (section 3.4) |
| `section?` | string | the bot's department at booking time |
| `turnId?`, `startedAt?`, `endedAt?`, `parent?` | trace fields | absent on old rows ("untimed") |
| `outcome?` | `{status, reason?}` | ok, error, interrupted |
| `steps?`, `tools?`, `toolErrors?` | integers | counts from the trace |
| `cacheWrite?`, `reasoning?` | integers | from the trace, Claude only for `cacheWrite` |
| `contextTokens?`, `contextWindow?` | integers | the last call's context |
| `usageStatus?` | `complete`, `partial`, `unavailable` | whether the engine reported the cache split |

There is no row id. The key `at|threadId|botId` (`:111-113`) is used only by
readers.

### 4.2 Files on disk

| Path | Content | Write |
|---|---|---|
| `<data>/usage/YYYY-MM.jsonl` | ledger rows | `appendFile`, 0600, no fsync, kept for ever |
| `<data>/usage/spans/YYYY-MM-DD.jsonl` | trace spans | batched 1 s, deleted after 90 days |
| `<data>/usage/cap-notices.json` | `{capId: {period, limit, warn?, reached?}}` | atomic, 0600 |
| `<data>/usage/alerts.json` | `{month, monthlyUsd, warn?, cap?}` | `writeFileSync`, 0600 |
| `<data>/claude-cost-history.json` | cost snapshots of Claude sessions | atomic, not durable, errors ignored |
| `config.json` → `usageCaps`, `budgets`, `billing` | the caps, the monthly limit, the sell prices | `saveConfig` |
| `bots.json` → each task's `usage` | per-thread totals | `saveRegistryFor` (`store.ts:1839`) |

### 4.3 The cap state (`CapState`, `usage-caps.ts:187-203`)

`{ id, scope: "server" | "bot", botId?, period: "day" | "month",
unit: "usd" | "tokens", limit, used, percent, warn, reached, periodKey,
resetsAt }`. The id is stable for one cap whatever the limit, for example
`server:day:usd` or `bot:<id>:month:tokens`.

### 4.4 Three meanings of `input`

| Wire type | `input` means | Cache write |
|---|---|---|
| `turn.completed.usage`, the ledger row, `TaskUsage` | gross: fresh + cache read (+ cache write for Claude and pi) | inside `input`, or a trace field |
| `thread.token-usage.updated` from Claude | fresh + cache read, no cache write (`claude.ts:1503`) | `contextTokens - input` |
| `TraceTokens` | gross, "cache reads and writes included" (`shared/usage-trace.ts:19-26`) | `cacheWrite?` |
| `InsightTokens` | fresh only, "without the cached part" (`shared/usage-insights.ts:1-7`) | no field |

The per-thread totals in `bots.json` (`store.addTaskUsage`) and the ledger
are two stores of the same turns. The thread totals take only the engine's
reported cost, not the estimate (`index.ts:6703`). The bot settings tab sums
the thread totals (`bot-settings/UsageSection.tsx:10`), and the Usage page
sums the ledger. They can show different numbers.

## 5. The UI

### 5.1 The Usage page (Settings → Spending)

`UsageSection.tsx`, admin only (`settings/pages/DataPages.tsx:23-24`).

1. A period choice: Today, Last 7 days, This month, Last month, Last 30 days
   (the default), Last 90 days (`src/lib/usage-trace.ts:11-31`). The days come
   from the local date of the viewer, sent as UTC dates.
2. A "Measure" toggle, Spend or Tokens, and the insights panel (section 5.3).
3. The list of runs, 50 for each page, with "Show more". Each row has bot
   avatars, the title, the start time, a Live badge, "{count} failed", the
   duration or "Not timed", and the cost ("—" when unknown, "<$0.001" for a
   very small cost) (`UsageSection.tsx:251-281`).
4. "Export CSV" links to `/api/usage.csv`.
5. The Cloud plan block (out of scope), then the caps card, then the
   edition-only cards.
6. Notes under the totals: "{cost} of this is estimated, not billed: it ran
   on an AI signed in with a subscription." and "Turns counted at $0 because
   their model has no price: {count}. The total leaves them out."
   (`en.json:11417-11418`).

States: a spinner while the page loads. "No runs in this period yet." when it
is empty. A list error shows the raw message with `role="alert"`. A failed
"Show more" has no catch and shows nothing (`UsageSection.tsx:318`). After
`turn.started` or `turn.completed`, the page loads again once, 2 s later. It is
a throttle: the first frame starts the timer, and the page ignores other
frames until the timer fires (`:82`, `:303-312`).

### 5.2 The caps card and the monthly limit

`UsageCaps.tsx` (owner only):

- Title "Usage caps". Subtitle: "Stop new work once a day's or a month's
  usage reaches a limit you set. Nothing is cut off mid-turn, and work starts
  again by itself when the day or month rolls over (midnight UTC) or you
  raise the cap." (`en.json:4417`).
- One row for each cap: "All bots together, today" or the bot name,
  "{used} of {limit} ({percent}%)", a bar in accent, warning or danger colour,
  and "Reached: the work it covers is skipped and starts again {resets}" or
  "At {percent}% of the cap".
- The choice "What a reached cap stops": "Unattended work only: routines,
  webhooks, app events, Bot API calls and hand-offs nobody is waiting on" or
  "Everything, including your own messages".
- Four inputs for all bots, and one row for each bot with "Add a cap for a
  bot" and a remove button. A field that the environment sets is greyed out.
- The hint: "Dollars are the estimate this page shows: notional on a
  subscription sign-in and $0 for a model with no price, so a token cap is the
  one that always counts. Tokens are fresh input plus output."
  (`en.json:4438`).
- Save checks that dollars are 0 or more and tokens are whole, then sends
  `PUT /api/usage/caps` with `{stops, server, bots}`. It never writes a value
  from the environment to `config.json` (`UsageCaps.tsx:52-62`, `:115-162`).

`UsageBudget.tsx` (only with the `budgets` or `billing` feature):

- "Monthly spend limit": "Once the month's cost reaches the limit, no bot in
  this installation starts a turn until an admin raises it."
  (`en.json:4406`). Inputs for the limit and the warn percentage. Save sends
  `PUT /api/config`. The card does not load the summary again, so the status
  stays old until the next refresh (`UsageBudget.tsx:58-59`).
- "Sell prices": a table of model, input, output and cached price for each
  million tokens, and a currency. No cache-write price.

### 5.3 Insights and the trace

`UsageInsights.tsx` calls `/api/usage/insights` once for each range:

- A hero total (spend or tokens) with a change against the period before,
  and a line chart for each provider family.
- Tiles: turns, cost per priced turn, cache hit rate
  (`cachedInput / (input + cachedInput)`), average turn time
  (`UsageInsights.tsx:54-55`, `:364-390`).
- A heat map of weekday and hour, a share bar of fresh input, cache reads and
  output, a share bar by person, and a breakdown table with seven boards.
- The token chart sums `bucket.models` (fresh input plus output). The hero
  total includes cache reads. So the daily points do not add up to the total
  (`UsageInsights.tsx:158-162`, `:293`, `server/usage-insights.ts:136`).

`TraceView.tsx` and `TraceWaterfall.tsx` show one run:

- A strip of six figures (duration, cost, tokens, steps, tools, errors).
  Tokens get a "*" when the usage is partial.
- A tree of turns, AI steps, tools and folded groups on one time axis, with
  "Slowest" and "Most expensive" badges.
- The cost of a turn row is its own cost plus the cost of its child turns.
  The step costs are shares, so they are not added again (`usage-trace.ts:105-116`).
- The hover text of a row: "{input} in, {cached} of them from cache ·
  {output} out", and "{tokens} saved to cache" for a cache write.
- A running trace loads again 1 s after a runtime frame, or at once after
  missed frames. There is no polling (`TraceView.tsx:38-49`).

### 5.4 Other places

- The bot settings "Usage" tab shows all-time turns, "New tokens" and cost for
  one bot, from the thread totals (`bot-settings/UsageSection.tsx`). The
  caption of the cost uses the bot's **current** sign-in.
- `EngineUsage.tsx` shows the engine's own quota windows (for example a
  5-hour window). It is not our caps. Border only.

## 6. The tests

| Test | What it guarantees |
|---|---|
| `usage-ledger.test.ts:44-61` | one row for each turn in its month file, mode 0600, folder 0700 |
| `usage-ledger.test.ts:82-99` | bad numbers are cleaned. A torn line is skipped. A failed write does not throw and writes nothing |
| `usage-ledger.test.ts:284-297` | the bar total stays additive when one row has `cachedInput > input` (460, not 410) |
| `usage-ledger.test.ts:308-320` | sell prices bill cached input at the input rate when no cached rate is set |
| `usage-ledger-api.test.ts:33-73` | two turns give exactly two rows. No message text is in the file. A client device gets 403 |
| `usage-attribution.e2e.test.ts:178-250` | a queued message, a steer and a press on Steer do not book the running turn again |
| `usage-attribution.e2e.test.ts:214-226` | Claude's running cost across `--resume` books 0.01 and 0.01, not 0.02 |
| `usage-attribution.e2e.test.ts:136-157` | an unlisted model is unpriced (`null`), a listed one is `estimated` |
| `room-limit-takeover.e2e.test.ts:71-88` | each backup turn is booked once, to the same bot and thread |
| `group-thread-usage.test.ts:55-62` | one row without `cachedInput` removes the cache split of the thread total |
| `usage-caps.test.ts:38-51` | a booked row counts at once and once only. A new UTC day starts from 0 |
| `usage-caps.test.ts:102-112` | a person's message stops only under `everything` |
| `usage-caps.e2e.test.ts:56-80` | the call that reaches the cap is answered in full. Bot API and webhook get 429. A routine run becomes one `missed` row |
| `usage-caps.e2e.test.ts:147-187` | a run that started under the cap finishes |
| `spend.test.ts:81-94` | a row is not counted twice. A row whose write failed leaves the total |
| `spend-cap-goal.e2e.test.ts:37-148` | a goal at the limit ends as `blocked`, with no retry and one ledger row |
| `usage-cap-gate.test.ts:46-82` | five refusals give one notice. A restart does not repeat it. The next UTC day gets a new one |
| `bot-usage.e2e.test.ts:71-74` | the running turn is not cut when its cap is reached |
| `bot-usage.test.ts:80-95` | without exact rights, hidden usage does not change the tool's reply until a cap blocks work |
| `openai-chat-cached-input.test.ts:23-33` | the turn sums its rounds. Cap tokens leave out cache reads. A missing cache report is `partial`, not 0 |
| `recorder.test.ts:43-68` | repeated Claude frames of one call are not added. `cacheWrite = contextTokens - input` |
| `token-breakdowns.test.ts:61-68` | two rows with one `turnId` are added in the trace (by design) |
| `usage-trace.test.ts:72-75` | the turn cost in the waterfall leaves out step shares |
| `usage-details-ui.e2e.test.ts:42-46` | the chat chip shows "10 uncached input · 2 cached input · 5 output", never "17 read" |

No test covers: two `turn.completed` events for one turn, the first Codex
update after a restart, a crash between the turn end and the append, or the
stall path that drops usage.

## 7. Ours compared

Our state on 2026-11-26: `bot-protocol` has `EventKind::TurnCompleted { outcome }`
with no usage (`crates/bot-protocol/src/event.rs:26-27`). No crate has a
usage type, a ledger or a cap. Decision D20 has five turn events. The plan
proposal P124 ([`chat-ui.md`](../../plan/chat-ui.md), steps 5 and 8) writes
the usage of a turn in the same transaction as its end.

| Part | Reference files | Our crate and module | Step |
|---|---|---|---|
| The usage of one turn on `turn.completed` | `runtime-events.ts:61-71`, `wire.ts:91-103` | `bot-protocol`, `event.rs` (a `TurnUsage` type) | 2 (type), 5 (the chat driver fills it) |
| Per-turn usage from each engine | `claude.ts:1576-1586`, `claude-cost-history.ts`, `codex.ts:1047-1062`, `openai-chat.ts:130-136`, `pi-usage.ts`, `acp/prompt-usage.ts` | `bot-engine`, each driver, with a capability for the report kind | 5 (chat), 9 (ACP) |
| The ledger row and its write | `usage-ledger.ts`, `index.ts:1342-1351` | `bot-core`, `store` (a SQLite table) | 8 |
| Attribution | `usage-attribution.ts` | `bot-core`, `store` | 8, then 13-15 |
| Cost and prices | `model-prices.ts`, `prices.ts` | `bot-core`, a `pricing` module, with the list in settings | later (new step) |
| Caps and the gate | `usage-caps.ts`, `usage-caps-config.ts`, `host/usage-cap-gate.ts` | `bot-core`, the runtime (a pure check before a turn) | new step after 15 |
| The trace | `usage-trace/*` | `bot-core`, from the event log of step 8 | later |
| Usage page, caps card, insights | `UsageSection.tsx`, `UsageCaps.tsx`, `UsageInsights.tsx`, `usage/*` | `bot-desktop` | later |

**The step.** The feature has no step yet. It fits in three places:

- **Step 5** needs the shape: an optional `usage` on `turn.completed` with
  separate fresh input, cache read, cache write and output, and an optional
  cost. The chat driver fills it from `prompt_tokens` and
  `prompt_tokens_details.cached_tokens` and adds the rounds of one turn, like
  `openai-chat.ts:735-744`. The chat API reports a turn's own figures, so the
  driver takes no difference.
  - In a stream, the usage comes only when the request asks for it. The
    generic OpenAI-compatible driver sends
    `stream_options: { include_usage: true }` on a streamed request
    (`server/drivers/openai-compat.ts:423`, test
    `openai-compat.test.ts:746`). Groq does not, and puts the usage in
    `x_groq.usage` (`openai-chat.ts:74-75`, `:138`, `groq.test.ts:129`).
  - The parser reads `usage` from any chunk, and the last one wins
    (`openai-chat.ts:411-412`). So the last chunk can have `usage` and an
    empty `choices`.
  - PR 5.1 needs the `stream_options` field and the `usage` field of a
    chunk. PR 5.4 needs a chunk with no `choices`, and `turn.completed` with
    the usage.
- **Step 8** needs the store: a `turn_usage` table written in the same
  transaction as the turn end (P124), with one row for each `(thread, turn)`.
  The per-thread totals are a query of that table, not a second store.
- **Caps** need the runtime (step 13), hand-offs (step 14) and routines
  (step 15), because a cap refuses unattended work in each of them. The cap
  gate fits a **new step after step 15**. The ledger read views and the Usage
  page go with it or later.

Where we differ from the reference:

- We follow the reference: book once at the turn end, check caps only before
  work starts, never cut a running turn, keep `null` for an unknown cost,
  UTC periods, `stops` unattended or everything, one notice for each cap and
  period, and hand-off text built from stored data.
- We differ, as proposals (section 8): separate cache fields, gates by
  capability, one store with a transaction, a unique key for each turn, the
  billing mode stored on the row, and one cap system.

## 8. Where we can be better

1. **Separate, non-overlapping token fields.** `TurnUsage { fresh_input,
   cache_read, cache_write, output, reasoning }`, each `Option<u64>`. Totals
   are methods.
   - Reason: a wrong state that the compiler refuses. The reference has three
     meanings of `input` (section 4.4). It stores `cachedInput` larger than
     `input` (`openai-chat-cached-input.test.ts:32`). Its insights chart and
     hero total disagree (`UsageInsights.tsx:158-162`). Cache writes are priced
     as fresh input (`prices.ts:33-35`), but the reference's own cost split
     weights a cache write at 1.25 times fresh input (`build.ts:243-244`).
2. **The driver gives the turn's own figures. No engine name in the core.**
   Each driver changes a running total or per-call reports into the figures
   of one turn, as the reference drivers do (`claude-cost-history.ts:40-46`,
   `codex.ts:1055-1062`, `pi-usage.ts:32-60`). The core does not need the
   report kind for the ledger. Only a later per-step trace needs it. Then it
   is a driver capability (per call, per turn, running total), not a name.
   - Reason: `AGENTS.md` forbids a gate by name. The reference recorder uses
     names (`recorder.ts:87-90`), and engines that it does not name get no step
     tokens.
3. **The usage row in the same transaction as the turn end, with a unique
   `(thread_id, turn_id)`.**
   - Reason: a known problem of the reference. A failed append loses the row
     (`usage-ledger.ts:129-140`). A crash loses the turn
     (`verification/usage-ledger.md:130-133`). Nothing stops a second row, and
     the trace adds rows that share a turn (`build.ts:99-108`).
4. **Book a stalled or failed turn with what it reported.**
   - Reason: a known problem. The stall path and the failed dispatch path drop
     the tokens (`index.ts:4958`, `:8403`).
5. **Store the billing mode of the engine on the row** (`metered`,
   `subscription`, `unknown`), and a cost source `Reported`, `Estimated` or
   `Notional`.
   - Reason: the reference decides "not billed" from today's sign-in
     (`routes/usage.ts:49-62`), so a change of sign-in rewrites history.
6. **One cap system.** Day and month caps for the workspace and for each bot,
   in dollars and tokens, with `stops`. No second monthly limit.
   - Reason: less code. The reference has two systems with the same refusal
     code and different rules for a waiting person (`spend.ts:47-60` against
     `usage-caps.ts:259-262`). One is edition-only.
7. **Per-thread totals as a query of the ledger, not a second store.**
   - Reason: less code, and no two numbers for one bot (`store.ts:1805-1842`
     against the ledger).
8. **A cap total as a SQL sum with an index on `(bot_id, at)`.**
   - Reason: less code. The reference keeps a cache that it reads again every
     15 s, with a memory set to stop a double count (`usage-caps.ts:85-174`).
9. **A partial sum says that it is partial.** A total cost over rows where some
   are unpriced carries a count of unpriced rows everywhere.
   - Reason: the client sum skips unknown costs and shows the result as the
     total (`src/lib/usage.ts:11-23`).
10. **The Claude cost base in the store, written durably.**
    - Reason: the reference writes `claude-cost-history.json` with
      `durable: false` and ignores errors. With no base, it books the whole
      running total (`claude-cost-history.ts:36-46`). This matters only when we
      add a Claude CLI driver (step 9 or later).

Problems of `changelog.md` section 5 that the reference has here:

| Problem | Evidence in this feature |
|---|---|
| Usage and cost numbers corrected | three meanings of `input` (4.4). Live and settled Claude figures disagree (`claude.ts:1503`, `:1579`). Running totals need differences (`claude-cost-history.ts:40-46`, `codex.ts:1047-1062`). The fixes in the release history: v0.1.86 (estimates for Codex and OpenRouter), v0.1.87 (new tokens), v0.1.90 (Claude running total), v0.1.92 (ACP cache reads, `acp/prompt-usage.ts:11-19`), v0.1.140 (pi), v0.1.170 (cached input, `openai-chat-cached-input.test.ts`), v0.1.178 (keep-warm, see `harness-upgrades.md`) |
| The same work done two times, or lost | lost: a failed append, a stall, a failed dispatch, a server stop, a failed ping (3.3). Two times: no unique key, and the trace adds rows of one turn. Guards that work: the Claude per-call replace, the pi flag, the cap memory key |
| State lost at a restart | `turnUsage`, the recorder, the Codex thread totals and the attribution map are in memory. Up to 1 s of spans. The cost base can be lost. Caps, the ledger and the notice marks survive |
| A turn or a wait that does not end | by design, a cap never cuts a turn. Work at a cap ends with a typed refusal, a `missed` row, a `blocked` goal or a hand-off text that says "Do not retry". A trace turn with no end closes after 30 minutes in the trace only |

Each release fix of the theme "Usage and cost numbers corrected"
(`changelog.md` section 5, `changelog-check.md` section 6), and where it is in
the code at `96ff84455`:

| Release | Fix | In the code |
|---|---|---|
| v0.1.71 | "Stop a conversation from paying for context it never asked for" | not verified |
| v0.1.76 | "enforce spend cap for channel turns" | the channel post checks the monthly limit (`routes/channels.ts:400-404`). The room turn checks both (`index.ts:9598`) |
| v0.1.86 | "count Codex/OpenRouter spend, book turns to who started them" | Codex gives no cost (`codex.ts:677`), so the server estimates it (`model-prices.ts:34-54`). Attribution: section 3.4, `verification/usage-ledger.md:9-13` |
| v0.1.87 | "headline the tokens actually bought" | "New tokens" leaves cache reads out (`src/lib/usage.ts:80-82`, `usage-ledger.ts:375`) |
| v0.1.90 | "book Claude turns at their own cost, not the CLI's running total" | `claude-cost-history.ts:40-46`, test `usage-attribution.e2e.test.ts:214-226` |
| v0.1.92 | "count cache reads in a turn's input" (ACP) | `acp/prompt-usage.ts:11-19` |
| v0.1.125 | Cursor bots "billed as Fast" only with a fast model | border (engine), not verified |
| v0.1.135 | models without a listed price show in "Where it went" | the bars rank by tokens, so an unpriced model still shows (`usage-trace.test.ts:108-116`) |
| v0.1.139 | "show a Claude plan's monthly spend" | Cloud plan, out of scope |
| v0.1.140 | "book pi's priced cost and cached tokens on turn.completed" | `pi-usage.ts:32-60` |
| v0.1.142, v0.1.155, v0.1.158, v0.1.160, v0.1.175, v0.1.176 | engine quota windows, plan bars, OpenCode Go limits, "Run when my limit resets", Codex credits | border: engine quotas (`EngineUsage.tsx`), not our caps |
| v0.1.170 | "Cached input is counted" | `openai-chat-cached-input.test.ts:23-33` |
| v0.1.178 | keep-warm pings "count only their own cost" | [`harness-upgrades.md`](harness-upgrades.md). The booking is `index.ts:5131-5137` |

The check of the row "Usage and cost numbers corrected" of
`changelog.md` section 7:

- Claim 1, `runtime-events.ts:61-71`: the fields are right (`input`, `output`,
  `cachedInput?`, a separate `cost`). "input includes the cached tokens" is not
  at those lines. It is true in the drivers (`claude.ts:1576-1586`,
  `codex.ts:1048-1049`, `openai-chat.ts:130-136`,
  `acp/prompt-usage.ts:11-19`) and in the comment of `shared/usage-trace.ts:19`.
  For Claude and pi, `input` also includes cache writes.
- Claim 2, `recorder.ts:87-90`: partly right. Those lines choose by engine name
  how to read the **per-step** updates of the trace. The turn total of the
  ledger comes from `turn.completed.usage` (`index.ts:6696`). The driver takes
  the difference of a running total, as the proposal of the row says
  (`claude-cost-history.ts:40-46`, `codex.ts:1055-1062`).

**Note of batch 12 (2026-11-27, reference `42f86aefd`).** `server/side-jobs.ts`
has 331 lines now. This file cites a copy with 315 lines, so some of its
lines of that file moved: the summary on the bot's own engine is at
`:307-308`, the switch `helperModel` at `:323`, the list of jobs at `:44`,
and `quickModel` at `:148`. The full record of the helper model is
[`helper-bot.md`](helper-bot.md). This file asked if a failed side-job call
books usage. It does on Claude and on the HTTP runtime, and it does not on
Codex and ACP (`server/drivers/claude.ts:1832-1839`,
`server/drivers/openai-chat.ts:315-330`,
`server/drivers/codex-background-text.ts:168-176`,
`server/drivers/acp/background-text.ts:120`).

## 9. Not verified

- Whether `turn.completed` can be folded two times for one turn (a reconnect,
  a retry). The ledger would write two rows.
- Whether the refused Claude attempt in a backup-engine take-over also leaves
  a row of its own (`room-limit-takeover.e2e.test.ts:87` checks only the Codex
  rows).
- Whether a keep-warm or warm-summary row can take (`settle`) the trace fields
  of a turn that is not yet booked (`index.ts:1344`, `:5131-5142`).
- Whether a Codex app-server process is shared by several of our threads. The
  recorder would then take differences across threads.
- Whether a Codex thread resumed in a new process always reports a total
  before the turn (`codex.ts:922-926`). If not, the carried-in total is booked.
- Whether ACP drivers put `usage` on `turn.completed`, or the ledger uses only
  the last update.
- When Claude ends a turn with no `usage`. Then the ledger has only the last
  call.
- Whether the engine's own compaction tokens are inside the turn's usage
  (`side-jobs.ts:291-292`).
- Whether a failed memory side-job call books before it fails, which can give
  two rows (`side-jobs.ts:221-227`).
- Whether thread-title generation (`index.ts:7388-7400`) is booked at all.
- The scope that `GET /api/usage/traces` needs.
- Whether any code outside `usage-ledger.ts` deletes old month files.
- The meaning of `fleet create --cap USD` (`cli-usage.ts:64-65`).
- Which list price gives `0.0000035` for 10 input and 5 output tokens
  (`spend-cap-api.test.ts:118`).
- What a turn stopped by a cap looks like in the trace (`TraceTurn.reason`).
- How engine quota holds behave across a restart (`EngineUsage.tsx`, border).
