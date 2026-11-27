# Plan: ACP engine details

The proposals from the research file
[`../research/features/acp-engine-details.md`](../research/features/acp-engine-details.md)
(batch 11, reference commit `42f86aefd`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project. A short path such as `core.ts` is in
`server/drivers/acp/`.

- **Steps:** 4 and 9. Also step 6 (P617), step 10 (P616) and later steps
  (P614, P624).
- **State:** all open. Decide P609 first. The other proposals of this file
  add flags, data or hooks to its record.
- **The main finding:** the reference often chooses engine behaviour by the
  name of a driver. Examples: the approval levels
  (`packages/phone-protocol/src/approval-mode.ts:22-26`) and "shares our
  workspace" (`server/workspace.ts:16-18`). Our `AGENTS.md` forbids this:
  "Engine behaviour is gated by capability flags on the driver, never by a
  driver's name." But the ACP adapter of the reference is already a record
  of data, flags and hooks (`server/drivers/acp/core.ts:96-277`). So P609
  makes that record our contract, and P622 lists the name checks that it
  replaces.

## Proposals

- **P609 (decision and plan, step 9, `bot-engine`, decide first). An ACP
  adapter is one record of data, a small set of capability flags, and a few
  named hooks.** Follows the reference: `AcpSupport` is such a record
  (`core.ts:96-277`).
  - The flags of our first version, from the matrix of section 3.1 of the
    research file:
    - the kind of sign-in check: none, file, CLI or probe
    - `auth_failure`, with three values (`continue`, `fail`,
      `fail-request`, `core.ts:1096-1102`)
    - `refuse_before_spawn` (`core.ts:876-887`)
    - the model source, and `read_models_at_create` (`core.ts:351`,
      `:356-363`)
    - the selection channel (P612), `model_variants` and the effort channel
      (P613)
    - the fallback policy for a model that the session no longer offers
      (P612)
    - `restart_on_tool_change` (`core.ts:422`, `:954`)
    - `resume_method`: `load` or `resume` (`core.ts:1132`)
    - the place of the system text: in the prompt or in the setup
    - the status log (P615, `core.ts:215`).
  - The data: the static model list, `credential_env`, `engine_tools`, the
    limits and the texts.
  - The hooks: the sign-in check, the error classifier (`core.ts:353`) and
    the usage-limit scope (`core.ts:1384`, P614).
  - Source: section 3.1, `server/drivers/acp/capabilities.ts:4-23`,
    `server/drivers/acp/driver-hooks.ts:9-63` (16 optional hooks).
  - Judgment call: no release problem. The better part is the type. In the
    reference the record has string fields, and a flag with three values
    can get a fourth value. A Rust struct with enums cannot.
  - Rule conflict: none if we follow this record. The name checks of P622
    are the parts of the reference that break `AGENTS.md`.
  - Options:
    - a. A Rust struct with an enum for each flag that has more than two
      values, and a trait object for each hook.
    - b. Follow the reference more closely: optional fields with string
      values, read at run time.
- **P610 (plan, step 4, `bot-protocol` and `bot-engine`). The model list is
  data in one JSON file with a schema, and each entry has its context
  window.** Follows the reference at `42f86aefd`: the model manifest has
  `id`, `name`, `aliases`, `status`, `contextWindow`, `minCliVersion` and
  `variants`. The load is strict and fails at start. The app offers only
  `current` models (`server/model-manifest/schema.ts:49-71`;
  `server/model-manifest/bundled.ts:6-23`). The context window comes from
  four sources, in this order (`server/context-budget.ts:7-13`): the
  engine report, the manifest entry, a guess from the model name, and the
  default.
  - Judgment call: start with the file. The reference first added the model
    of issue 1688 in code, with no context window on the row (commit
    `ad3ed7608`). It moved the lists to the file later (commit
    `5f245f96d`). That was work done two times.
  - A port of the schema credits T3 Code (MIT) in `NOTICE`
    (`server/model-manifest/schema.ts:1-3`).
- **P611 (plan, steps 4 and 9, `bot-engine`). The live model list of an
  instance keeps the last good list and says why it can be old. It reads a
  sign-out only from the classifier of the driver.** Follows the reference
  (`model-catalog.ts:35-54`; `custom-model-catalog.ts:72-77`).
  - A failed or empty read keeps the list. It marks the list
    `Unconfirmed { reason }`, with the reason `Failed`, `SignedOut` or
    `TimedOut`. Only the classifier of the driver gives `SignedOut`.
  - The startup cache is fresh for 6 hours.
  - This rule is the answer of the reference to "Sign-in to an engine, and
    engine CLIs that change" (v0.1.177, v0.1.178). A brief failure does not
    count as signed out.
  - Judgment call: the list is one value that the instance owns. In the
    reference it is a module map with the CLI path as its key
    (`opencode-go.ts:55-57`, the OpenCode case of P109). With one owner, a
    late read needs no generation counter to win the race
    (`opencode-go.ts:665-672`).
- **P612 (plan, step 9, `bot-engine`). The selection channel is one enum,
  and the engine confirms a switch before the prompt.** Follows the
  reference (`session-model-controls.ts:93-120`).
  - The enum: `Argv`, `SetModel` (legacy) or
    `ConfigOption { config_id, unset_ids, agent_default }`.
  - A switch that the engine does not confirm fails the turn, and the
    prompt is not sent.
  - A driver states what it does with a model that the session no longer
    offers: `Fallback`, with one notice for each session, or `Fail`. In the
    reference, OpenCode, DeepSeek and Copilot fall back
    (`opencode-go.ts:701-705`, `deepseek.ts:419-425`, `copilot.ts:213-217`).
    Cline and Qwen fail (`cline.ts:148-150`, `qwen.ts:184-187`).
  - Judgment call: the refusal is a typed value with the offered models,
    for every engine. Today only the steering engine names the offered
    models (`grok.ts:156-169`). The others give "did not switch to <m>
    (still <x>)" as a plain `Error` (`session-model-controls.ts:115-118`).
    `AGENTS.md` asks for typed refusals.
- **P613 (plan, step 4, `bot-protocol`, extends the types of step 2).
  Reasoning is one type: `Reasoning::Effort(level)` or
  `Reasoning::Variant(id)`.** Follows the reference in meaning
  (`server/config.ts:252-258`):
  - effort levels for each model, with a fallback to the levels of the
    engine
  - opaque variants that the session reports
  - "Default" (send nothing) is not the same as "None"
    (`packages/phone-protocol/src/effort-levels.ts:10-16`;
    `src/components/ModelPicker.tsx:50-53`).
  - Judgment call: the reference refuses an effort and a variant together
    only at run time. It gives a 400 at save (`server/index.ts:2562-2576`)
    and a 409 at the turn (`server/member-turn.ts:4-14`). Our type cannot
    hold both. Also, check a saved variant at save time against the last
    list that the engine reported. `server/index.ts:2601-2607` checks only
    the flag.
  - The effort channel is a flag of the driver, with three values:
    - a config option
    - a live option, with a restart if the engine refuses it (the steering
      engine, `grok.ts:464-484`)
    - a command-line argument, so a new process (Cline,
      `cline.ts:117-119`).
- **P614 (new facts for P470 and P500, later step). A driver returns the
  scope of a usage limit as a typed value. The driver also says if a stop
  is a sign-out or a lack of credit.** Follows the reference for the scope
  (`opencode-go.ts:776-795`; `cline.ts:183-187`): `Engine` or
  `Models(Vec<ModelId>)`, with the model that the engine reported.
  - **Problem in the reference:** an ACP `auth_required` stop counts as a
    sign-out, unless English words say "credits" or "quota"
    (`server/host/limit-takeover.ts:89-93`). When a CLI changes its words,
    a bot with no credit goes into the sign-in path, or the reverse. The
    release problem: "Sign-in to an engine, and engine CLIs that change"
    (v0.1.177, v0.1.178), and section 6, "A bot at a usage limit"
    (v0.1.166, v0.1.175).
  - Also: `docs/opencode-go.md:72-74` says that a Go limit stops the whole
    account. The code stops only the Go models (`opencode-go.ts:782-787`).
    A test of the feature page against the code (P121, D19) finds this.
- **P615 (plan, step 9, `bot-engine`, with P133). A driver states if it has
  a status log. A test shows what each engine gets without one.** Follows
  the reference: the status log is an optional capability with a path and a
  parser (`core.ts:215`; `opencode-go.ts:692`; `qwen.ts:239`). Only OpenCode
  and Qwen have one.
  - Judgment call: the difference is small. With a log, a turn that waits
    out a usage limit in silence stops after 2 minutes. Without a log, it
    stops after 5 minutes, when the engine has no open request and no CPU
    use (`quiet-status.ts:323-326`, `:348`; `quiet-watch.ts:23-49`; commit
    `b3eefc4f2`). This is the area of "A turn or a wait that does not end"
    (v0.1.132). With the flag on record, the window can say why a turn
    stopped late.
- **P616 (new facts for P113, steps 9 and 10). The app offers a feature
  that needs an engine version only when the installed engine has that
  version. A test checks each pinned version against the minimum of each
  feature.**
  - **Problem in the reference:** the app installs DeepSeek Harness
    `0.2.2-rc.1` (`server/engine-versions.ts:37`;
    `server/harness/registry.ts:491`). Its approval plugin needs
    `0.2.2-rc.2` (`deepseek.ts:316`). The UI offers "Approve for me" by the
    driver name (`packages/phone-protocol/src/approval-mode.ts:41-46`). So
    on the copy that the app installs, the level promises a review that
    the installed version cannot give. The release problems: "The approval
    model changed" (section 6, v0.1.55, v0.1.74), and "Sign-in to an
    engine, and engine CLIs that change" (v0.1.101).
  - Better: the snapshot of the engine has the features of its version.
    The pin and the feature minimum are data in one place.
  - Also: read the version one time for each file identity (path, size,
    time), not before each start (`deepseek.ts:362-373`;
    `server/cli-version-probe.ts:15-30`).
- **P617 (new facts for P19, step 6). All keys of one engine have one place
  of storage.**
  - **Problem in the reference:** on the desktop, the main OpenCode key and
    the DeepSeek key go to the store of the OS
    (`server/routes/config.ts:596`, `:601`). The OpenCode provider keys stay
    as plain text in `config.json`
    (`src/components/keys/KeyPanels.tsx:23`; no `providerKeys` in
    `electron/`). The release problem: "A secret or an access right in the
    wrong place" (v0.1.19, v0.1.92).
  - Better: P19 puts every key in the keychain. This adds the provider keys
    of an engine to that rule. A test shows that no saved key is in a
    settings file.
- **P618 (new facts for P103, step 9). New facts on writes into the engine
  config of the person.**
  - **Problem in the reference:** the OpenCode local-model inject reads the
    `opencode.json` of the person with a plain `JSON.parse`. A file with
    comments does not parse. Then the app writes `{ $schema }` and its
    provider over the file (`opencode-go.ts:375-380`, `:416`). The same
    file has a JSONC parser, but this code does not use it
    (`opencode-go.ts:503-530`). The release problem: "A file written over
    after a failed read" (v0.1.103, v0.1.151).
  - Line drift: P103 cites `grok.ts:250`. At `42f86aefd` the write is at
    `grok.ts:251`.
- **P619 (new facts for P504, step 9). The agent folder of Pi is the model
  for the allow list, and it is in the reference itself.** Pi turns run
  with `PI_CODING_AGENT_DIR` in the data folder. Only `auth.json`,
  `models.json` and nine settings keys come from the folder of the person
  (`server/drivers/pi-agent-dir.ts:1-19`, `:115-144`).
  - **Problem in the reference:** OpenCode blocks only the Claude
    instructions and the project config of the folders of the app. The
    global OpenCode config, plugins and MCP servers of the person still
    load into bot turns and into the model probe (`opencode-go.ts:560-581`;
    `opencode-probe.ts:162-163`). Kimi, the steering engine and Qwen read
    the config files of the person (`kimi.ts:494-502`, `grok.ts:95-103`,
    `qwen.ts:22-28`). The release problem: "The person's own engine config
    reaches the bots" (v0.1.104, v0.1.170, v0.1.175).
- **P620 (new facts for P130, step 9). The data of the retry at 128
  tools.** Follows the reference: `engine_tools` is data of each adapter
  (OpenCode 24, the default 32). The learned limit has the instance and the
  model as its key (`opencode-go.ts:708-709`; `core.ts:889-893`;
  `server/tool-count-limit.ts:82-98`). The release problem that the retry
  answers: "The size of the tool list" (v0.1.101).
  - Judgment call: keep the learned limit in the store, with an expiry. The
    reference keeps it in memory only, so after each restart the engine
    refuses the first turn one more time.
- **P621 (plan, step 9, the later discovery PR of P102, `bot-engine`). One
  discovery client and one survey loop.** Follows the limits and the
  security rules of the reference (`custom-model-catalog.ts:12-16`,
  `:99-117`, `:165-171`, `:221-229`, `:303`).
  - Judgment call: the reference has three discovery clients: the shared
    one, `opencode-probe.ts:164-286` and `deepseek.ts:202-313`. It has two
    survey loops (`custom-model-catalog.ts:251-284`,
    `config-options.ts:98-121`). One client gives one set of limits and one
    set of tests.
- **P622 (new facts for P507, steps 4 and 9 and the UI steps). The rules
  that choose by a driver name.** Section 3.12 of the research file lists
  15 such rules. P507 and P113 name some of them. These are new:
  - "shares our workspace" for a backup: `server/workspace.ts:16-18`
  - the keys put into the environment of an instance:
    `server/config.ts:1106-1131`
  - a model refresh when the provider-key policy changes:
    `server/index.ts:1386-1392`
  - the usage meter of a plan: `server/plan-usage.ts:139`
  - variants shown as models, and typed model ids:
    `src/lib/model-choices.ts:10-22`, `:37-39`
  - the variant labels: `src/components/model-picker-reasoning.ts:9-17`
  - the local models offered: `src/components/local-model-probe.ts:23-26`
  - the tiles of the Cloud page: `src/components/CloudEngineSignIn.tsx:19-48`
  - the key row of an instance, by instance id:
    `src/components/keys/key-catalog.ts:289-296`.
  - Judgment call: it is the rule of `AGENTS.md`, not a release problem.
    The UI gives the Codex texts to an unknown driver
    (`src/components/DeviceSignIn.tsx:42`). That gives a wrong text, not a
    failure.
- **P623 (new facts for P503, step 9). A driver maps the words of a failed
  login to a typed outcome.**
  - **Problem in the reference:** the device controller has outcome codes,
    but no ACP adapter sets `failureReason`. So the app records an expired
    or refused login of the steering engine or of Kimi as `exited`
    (`server/drivers/device-auth.ts:148`; `grok.ts:72-84`;
    `kimi.ts:84-96`). The person sees no reason. The release problem:
    "Sign-in to an engine, and engine CLIs that change". v0.1.153 closed
    the same gap for Claude only: "An expired Claude sign-in is
    recognised".
- **P624 (later, the Pi step if it comes). The shell timeout of an engine
  is data: its unit, its default and its maximum.** Follows the reference
  for Pi: 120 s, at most 900 s. The app refuses a bad value before the
  command runs (`server/drivers/pi-mcp-extension.ts:607-615`).
  - Judgment call: one place for this policy. The reference has two files
    with two methods: a block before the command for Pi, and a hint after
    the command for Claude Code (`server/shell-timeout-hint.ts:3-22`).
- **P625 (new facts for P508, step 9). A key that the person puts in the
  environment of a custom instance reaches that engine.**
  - Judgment call: the reference deletes every listed provider key that is
    not in `credentialEnv`. It also deletes a key that the person set on
    the instance on purpose (`core.ts:333-343`; `custom.ts:18-34`). A
    bring-your-own agent often needs such a key. Keep the removal of the
    keys of the server.
