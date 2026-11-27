# Plan: The helper bot and the helper model

The proposals from the research file
[`../research/features/helper-bot.md`](../research/features/helper-bot.md)
(batch 12, reference commit `42f86aefd`). The steps, the pull requests and
the order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project. `<HELPER>` is the default name of the helper bot,
and `OMB_<HELPER>` is the reference setting with that name in it.

- **Steps:** the helper bot has no step. P638 adds a new step after step
  15, with P640 and P643. P636 and P637 go to step 15 with P209, and P637
  also changes step 3. P639 goes to the cap step of P381. P642 is later.
- **State:** all open. Decide P637 first: it changes the request type of a
  background call, which step 3 makes. Then decide P638, because it says
  if we have a helper bot at all.
- **The main finding:** the helper bot and the helper model are two parts
  with no relation in the code (`server/side-jobs.ts` does not read
  `defaultBot`).
  - The **helper bot** is a normal bot record with the mark `defaultBot`.
    The server makes it once for each place and each member of a Team
    Cloud. On a new installation it is the first bot and the Chief of
    Staff (`server/store.ts:2249-2253`). It can be renamed, recoloured and
    hidden, never deleted
    (`packages/phone-protocol/src/default-bot.ts:4-5`).
  - The **helper model** writes the **side jobs**: small model calls
    outside a turn, such as summaries, memory upkeep and skill review. A
    side job runs on the bot's own engine when that engine has a one-shot
    text call. A person can name one other engine in `config.json` as
    `helper` for the bots whose engine has no such call. It is off by
    default, and each bot has a switch `helperModel`
    (`server/side-jobs.ts:1-2`).

## Proposals

- **P636 (plan, step 15 with P209, `bot-core`). Titles use the background
  service, on the bot's own engine only, and they book usage.** A thread
  title goes through the same background service as the side jobs. It runs
  only on the bot's own engine, never on the helper model. It books one
  usage row, and the cap gate checks it.
  - **Problem in the reference:** a title passes no usage callback
    (`server/thread-title-generate.ts:32`). A search for `onUsage` in
    `server/` (not the tests) finds it only in `server/side-jobs.ts:178`,
    `:192`, `:241`. So each title on a paid engine is spent and never
    counted. The title gate has no usage-cap check
    (`server/index.ts:7381-7393`), but the docs of the reference say that
    caps stop titles (`docs/usage-caps.md:55-56`). The release problem:
    "Usage and cost numbers corrected" (v0.1.90, v0.1.178).
  - Why: follows the reference, which keeps titles on the own engine for
    privacy: "On the bot's own engine, which already saw the requests, so
    nothing new reaches OpenAI" (`server/index.ts:12292`). Better than the
    reference: one path, so a title books and is capped like each other
    background call.
  - Options:
    - a. Titles go through the background service (this proposal).
    - b. Titles keep their own path, and only add a usage callback and the
      usage-cap check.
    - c. Follow the reference: no booking.
  - Must keep: a title never uses the helper model. A bot whose engine has
    no one-shot call gets no generated title, as in the reference
    (`server/index.ts:7384`).
  - Source: `server/thread-title-generate.ts:5-6`, `:14-45`;
    `server/index.ts:7381-7393`, `:7520`, `:10725`, `:3845`, `:12292`;
    `server/routes/tasks.ts:424-447`; `docs/usage-caps.md:55-56`.
- **P637 (plan, step 3 and the step of P209, `bot-core`). A background call
  cannot be made without a deadline, and the wait for a slot has its own
  limit.** The request type of a background call holds a deadline. The
  deadline stops the call and kills the engine process. The wait for a slot
  has a separate limit, with a typed refusal "busy". A slot is released
  when the deadline passes, not when the engine answers.
  - **Problem in the reference:**
    - The representative and the skill burger give only `timeoutMs` and no
      signal (`server/index.ts:2762`, `:11922`). The HTTP runtime does not
      read `timeoutMs` (`server/drivers/openai-chat.ts:981-988`). So the
      10 s of the skill burger becomes the idle timer of the runtime: 180 s
      by default on the OpenAI-compatible driver
      (`server/drivers/openai-compat.ts:17-23`).
    - The skill burger waits for a slot with no limit, because a waiter
      leaves the queue only on an abort (`server/job-slots.ts:47-53`).
    - A title that gave up still holds its slot until the engine call ends
      (`server/thread-title-generate.ts:12-13`).
    - The queue has 3 slots for all bots (`server/job-slots.ts:87-89`), so
      three stuck calls stop the titles, memory and summaries of each bot.
    - Memory upkeep and skill review start their timer before the slot
      wait, so a full queue gives "did not answer in time" with no model
      call (`server/memory-upkeep.ts:221-243`,
      `server/skill-review.ts:476-481`).
    - The release problems: "A turn or a wait that does not end" (v0.1.132,
      v0.1.153) and "One slow or stuck part blocks the others" (v0.1.114,
      v0.1.177).
  - Why: better than the reference. It extends P209 (the timer starts after
    the slot) and P254 (each wait has a limit) to all callers. One caller of
    the reference already has the better form: the setup suggestions pause
    the timer during the slot wait (`server/setup-suggestions.ts:259-264`).
  - Options:
    - a. The deadline is a required field of the request type (this
      proposal).
    - b. A default deadline for each job kind in the service, with no field.
    - c. Follow the reference.
  - If the author accepts it, extend the D8 item "Driver contract", or the
    decision of P209: a background call is a typed request with a required
    deadline (`server/contracts.ts:608-620`, `server/job-slots.ts:47-74`).
  - Source: `server/index.ts:2762`, `:11922`; `server/job-slots.ts:47-74`,
    `:87-89`; `server/drivers/openai-chat.ts:257-272`, `:981`;
    `server/drivers/openai-compat.ts:17-23`;
    `server/thread-title-generate.ts:12-13`, `:24-30`;
    `server/memory-upkeep.ts:221-243`; `server/skill-review.ts:476-481`;
    `server/setup-suggestions.ts:259-264`.
- **P638 (plan, new step after step 15, `bot-core`, `bot-desktop`). A step
  for the helper bot.** The step makes the helper bot of the place: the
  mark `defaultBot`, the "made once" record, the adoption of an old first
  bot, the refusals of delete and archive, hide and demote, the prompt
  paragraph and the welcome card. The bot row, its mark and the "made once"
  record are written in one transaction. Its tools come from steps 12 and
  14, and the brief from step 15.
  - **Problem in the reference:** `createDefaultBot` saves the bot, then
    saves the mark with a second `patchBot`
    (`server/default-bot.ts:101-107`). Each one is a synchronous write of
    the bots file (`server/registry-store.ts:123-131`). The ledger
    `default-bot.json` is written only after the function returns
    (`server/default-bot.ts:137`). The store has a `settle` option that
    finishes a new record "before its one save" (`server/store.ts:1269-1270`,
    `:1312`), and this code does not use it. A stop between the writes can
    leave a bot with no mark and no ledger entry.
    - On a new installation, the next start adopts that bot, because it is
      named `<HELPER>` and it is the oldest bot
      (`server/default-bot.ts:78-84`).
    - On an installation with older bots, the oldest bot is not a starter,
      so the next start makes a second helper bot. No test covers this.
    - The release problems: "The same work done or delivered two times, or
      lost" (v0.1.74, v0.1.108) and "State lost at a restart or a crash"
      (v0.1.165).
  - Why: follows the reference for the behaviour. Better than the
    reference: one transaction, as `AGENTS.md` asks for each state change.
  - Options:
    - a. A new step after step 15 (this proposal).
    - b. Put the helper bot in the step of the bot profile (P406, after
      step 16).
    - c. No helper bot: the first bot is a plain Chief.
  - What the step follows, all from the reference:
    - One helper bot for each place, made once. A deleted one is never made
      again (`server/default-bot.ts:11-13`, `:126`).
    - When two bots have the mark, the oldest one stays (`:119-121`).
    - The first bot of a new place is the helper bot and the Chief
      (`server/store.ts:2249-2253`). On a place with a Chief, it comes
      beside the Chief (`server/default-bot.ts:128`).
    - The intro with four fixed asks (`:18`, `:39-51`), and a follow-up
      from a text table, never from a model
      (`server/helper-followup.ts:52-60`).
    - The prompt paragraph (`server/system-prompt.ts:81-87`).
    - Hide from the sidebar with `sidebarHidden`. A rename or a move shows
      it again (`packages/phone-protocol/src/default-bot.ts:38-48`).
  - Source: `server/default-bot.ts:98-139`; `server/store.ts:1269-1270`,
    `:1312`, `:2249-2253`; `server/registry-store.ts:123-131`;
    `server/default-bot.test.ts:35-264`.
- **P639 (plan, the cap step of P381, `bot-core`). A background call checks
  the caps of the bot that it writes for.** The cap gate gets the bot id of
  the job. A bot at its own cap gets no background call. A summary at the
  cap uses the excerpt summary and never fails the turn.
  - **Problem in the reference:** the gate of a side job gives no bot id:
    `usageCapGate.assertTurn(undefined, true)` (`server/index.ts:5054`). So
    the cap of one bot never stops its side jobs, and a bot over its own cap
    still makes background calls that are booked to it. With "person
    waiting" true, a server cap stops side jobs only when its `stops` is
    `everything` (`docs/usage-caps.md:55-56`). The release problem: none.
    This is a judgment call, close to "Usage and cost numbers corrected".
  - Why: one rule for the cost of a bot. The author can keep the reference.
  - Options:
    - a. Check the caps of the bot (this proposal).
    - b. Follow the reference: only the server caps and the spend limit.
  - Must keep: the compaction summary falls back to the excerpt summary at
    the cap (`server/compaction-summary.ts:63-64`, `:80`).
  - Source: `server/index.ts:5054`; `server/host/usage-cap-gate.ts:31-43`;
    `server/side-jobs.ts:165-169`; `docs/usage-caps.md:55-56`.
- **P640 (decision, the step of P638, `bot-core`). One check in the store
  protects the helper bot.** The store refuses delete and archive of a bot
  with the mark, with one typed refusal. Each path goes through it: the
  route, the settings tool, a team setup plan and a move. Only "demote"
  (`defaultBot: null`) clears the mark.
  - **Problem in the reference:**
    - Delete is refused in three places (`server/index.ts:8887`,
      `server/store.ts:1415-1419`, `server/team-setup-requests.ts:231`).
    - Archive is refused at the route and in the settings tool
      (`server/default-bot.ts:30`, `server/routes/bot-patch.ts:147-148`,
      `server/app-settings/registry-bots.ts:244`), but not in the store:
      `patchBot` has no check (`server/store.ts:1462-1464`).
    - The move to My Cloud copies `hidden` from the record that arrives,
      with no check of the mark (`server/cloud-send-kinds.ts:280`, `:308`).
      It is not verified that this path can archive a helper bot.
    - The release problem: none. This is a judgment call.
  - Why: less code, and a new path cannot skip the check. The author can
    keep the reference.
  - Options:
    - a. One check in the store (this proposal).
    - b. Follow the reference: checks at the route and the tools.
  - If the author accepts it: a new decision in `docs/decisions.md`
    (`server/store.ts:1415-1419`, `:1462-1464`,
    `server/default-bot.ts:20-31`, `server/cloud-send-kinds.ts:280`, `:308`).
- **P641 (decision, the step of P209). The helper setting lists each job
  that sends text to the helper, and Settings shows both switches.** The
  type of the helper setting names the jobs that it can write. The
  Settings page shows them, and each bot has a visible switch
  `helperModel`.
  - **Problem in the reference:** the docs tell the person that the helper
    reads the text of three jobs: memory upkeep, skill review and the
    summary (`docs/memory.md:266-271`, `:295-309`). The code lets it write
    seven: also the setup choices, the answer of the representative to a
    teammate, the status reply and the skill burger
    (`server/side-jobs.ts:44`, `:322-326`). No screen shows the setting or
    the switch of each bot (`docs/memory.md:290-293`, `:304-309`). No
    component of the window reads `helperModel` (only
    `src/state/store.tsx:333` and `src/lib/bot-duplicate.ts`). The release
    problem: none. This is a judgment call, close to "A secret or an access
    right in the wrong place", because text reaches a second provider.
  - Why: the person can see where the text goes. The author can keep the
    reference.
  - Options:
    - a. A list of jobs in the setting, and a Settings page (this
      proposal).
    - b. Follow the reference: the file and the API only. Our docs page
      names all seven jobs.
  - Follow the reference in all else:
    - off by default (`server/side-jobs.ts:1-2`);
    - the own engine always writes when it can (`:322-326`);
    - the setting is in the file only, and a settings request cannot set it
      (`:17-18`, `server/config.ts:402`);
    - the environment wins, and a model id that is not valid turns the
      helper off (`server/side-jobs.ts:29-40`);
    - the switch of each bot fails closed
      (`packages/phone-protocol/src/wire.ts:258-259`);
    - Duplicate sends the switch in the create request
      (`src/lib/bot-duplicate.ts:1`, `:16-26`);
    - a backup can only turn it off (`shared/team-backup.ts:146-147`).
  - If the author accepts it: a new decision in `docs/decisions.md` for the
    helper model (`server/side-jobs.ts:1-2`, `:17-44`, `:296-327`,
    `packages/phone-protocol/src/wire.ts:258-259`,
    `docs/memory.md:262-333`).
  - Source: `server/side-jobs.ts:1-2`, `:44`, `:322-326`;
    `docs/memory.md:262-333`.
- **P642 (later, if we build decide and extract). Their calls book usage.**
  Each call of the decide and extract models books one usage row with its
  own trigger.
  - **Problem in the reference:** no code books these calls. The decider
    keeps only `inputTokens` in its own log
    (`server/decider/index.ts:321-338`), and it imports only `monthKey`
    from the ledger (`server/decider/log.ts:7`). The extractor is built
    with no data folder, so it keeps nothing (`server/index.ts:785`). Paid
    OpenRouter and Gemini calls do not show in usage or budgets. The
    release problem: "Usage and cost numbers corrected" (v0.1.90,
    v0.1.178).
  - Why: better than the reference. It is later, because the plan has no
    decide or extract tools.
  - Source: `server/decider/index.ts:321-338`; `server/decider/log.ts:7`;
    `server/extractor/index.ts:1-4`; `server/index.ts:785`.
- **P643 (choice, the step that adds `helperModel`). A bad value of the
  switch.** The reference reads a `"false"` or `0` that a person typed in
  `helperModel` as "never", and the bot keeps working
  (`packages/phone-protocol/src/wire.ts:258-259`). A typed `bool` field in
  our store cannot hold such a value.
  - Option a: a typed `bool`. A bad value fails the load of the record.
  - Option b: read the raw value, and map each value that is not absent or
    `true` to "never", as the reference does.

## New facts for open proposals

Each fact goes to the plan file of its proposal when the author decides it.

- **[P209](memory.md)** (background calls as a driver capability):
  - The lines moved. `server/side-jobs.ts` has 331 lines now (315 in
    `memory.md`). The raw summary is at `:307-308` (was `:291-292`). The
    switch check is at `:323`.
  - The checks by driver kind are `quickModel` at `server/side-jobs.ts:148`
    (not for the Claude driver) and `lightModelFor` at
    `server/suggested-reply/light-model.ts:49-59` (a `switch` on the driver
    kind).
  - Skill review also starts its timer before the slot wait
    (`server/skill-review.ts:476-481`). The setup suggestions pause the
    timer during the wait (`server/setup-suggestions.ts:259-264`).
  - The capability has three values, not two: a one-shot call, a slow
    one-shot call that starts an agent process (Codex, ACP), or none. The
    five jobs that someone waits on need the first
    (`server/side-jobs.ts:99-106`). Codex: "Never generateText, or titles
    and compaction would each start a Codex process"
    (`server/drivers/codex.ts:1423-1424`).
- **[P251](context.md)** (each model call books its own usage):
  - The drivers differ on a failed call. Claude books before it checks
    `is_error` (`server/drivers/claude.ts:1832-1839`). The HTTP runtime
    books before the check of the body error
    (`server/drivers/openai-chat.ts:315-330`). Codex and ACP book only when
    the call has no error (`server/drivers/codex-background-text.ts:168-176`,
    `server/drivers/acp/background-text.ts:120`). A call that timed out
    books nothing on any driver.
  - The permission review of Claude books nothing: `reviewPermission` is
    the same function as `generateText`, called with no `onUsage`
    (`server/drivers/claude.ts:1940`, `server/contracts.ts:667`).
  - Titles and the engine check book nothing (P636,
    `server/thread-title-generate.ts:32`, `server/engine-check.ts:36-65`).
  - A one-shot call cannot count a conversation again: each one runs in a
    new process or request with no saved session
    (`server/drivers/codex-background-text.ts:108`,
    `server/drivers/claude-background.ts:24`,
    `server/drivers/acp/background-text.ts:227`,
    `server/drivers/openai-chat.ts:985`).
- **[P323](notifications.md)** (the tools of the helper bot return a typed
  refusal): the two tools are listed only when `OMB_<HELPER>` is exactly
  `"1"` (`server/drivers/agents-catalog-profile.ts:48-63`,
  `server/chief-level.ts:30-37`). The server checks again on each call
  (`server/drivers/agents-catalog-profile.ts:5-6`). The helper bot of a
  member has them only when the member is an owner or an admin
  (`server/chief-level.ts:17-25`).
- **[P381](usage-and-budgets.md)** (the cap gate): side jobs give no bot id
  (P639, `server/index.ts:5054`). Titles skip the usage caps (P636,
  `server/index.ts:7381-7393`).
- **[P247](context.md)** (the context step): the idle fold of the harness
  goes through the side job `compaction` (`server/index.ts:5186-5188`,
  `:6960`). So the helper writes it for Codex, ACP, Pi and Muse Code bots
  when the helper is set.

## Corrections to research files that are done

These go into the record pull request of batch 12, not into this plan.

- `context.md`, `memory.md`, `usage-and-budgets.md`: their line numbers of
  `server/side-jobs.ts` come from a copy with 315 lines. Now: the raw
  summary is at `:307-308`, the switch at `:323`, the list of jobs at
  `:44`, and `quickModel` at `:148`.
- `threads.md` section 3.8: the title prompt does not ask for "3 to 6
  words" now. It asks for "at most 48 characters" in the language of the
  request (`server/thread-title.ts:49`, `server/thread-title.test.ts:129`).
  A title that is made again has 30 s, not 10 s
  (`server/thread-title-generate.ts:6`).
- `usage-and-budgets.md` asked if a failed side-job call books usage. It
  does on Claude and HTTP, and it does not on Codex and ACP (see P251
  above).
