# ACP engines in detail: what differs from one engine to the next

The record of how each ACP engine of the reference project differs from
the others. The aim is one list of differences, and for each one a choice:
is it a **capability flag** of a driver (behaviour), or is it **data** (a
list, a string, a number)?

The rows are in [`../reference-features.md`](../reference-features.md):
`2026-08-15-opencode-go-integration.md`, `plans/opencode-go-integration.md`,
`opencode-go.md`, `2026-10-22-deepseek-harness-engine.md`,
`opencode-variants.md`, `pi-shell-timeouts.md`, `qwen-models.md`,
`cline.md`, `copilot-engine.md`, `custom-acp-models.md`, `kimi-models.md`,
`grok-steering.md` (login, models and thinking only), and the
`requirements/` and `design/` files of issue 1688. The crate that gets the
port is `bot-engine`: step 9 of [`../../plan/README.md`](../../plan/README.md)
(the ACP driver) and step 4 (the registry and its model lists).

- **Reference commit:** `42f86aefd` (2026-11-27). It includes release
  v0.1.184.
- **Method:** a workflow of eight subagents, one for each group of files.
  Each subagent read its files completely and gave a file and a line for
  each fact. The lead checked 34 key claims against the code. All 34 agree.
  Section 2.2 lists the checks.
- **Earlier research that this file builds on:**
  [`engines-and-accounts.md`](engines-and-accounts.md) (the engine list,
  sign-in flows, keys and the UI of the AI page),
  [`acp-core.md`](acp-core.md) and [`acp-adapter.md`](acp-adapter.md) (the
  generic ACP core and the Cursor adapter),
  [`tool-selection.md`](tool-selection.md), [`turn-limits.md`](turn-limits.md),
  [`usage-and-budgets.md`](usage-and-budgets.md) and
  [`harness-upgrades.md`](harness-upgrades.md). This file does not analyze
  the generic core again. It adds only the detail of each engine.
- **Border with this batch:** [`engine-turn-lifecycle.md`](engine-turn-lifecycle.md)
  owns steering into a running turn, warm engines, background work after a
  turn and MCP loading. Section 3.11 gives only pointers to them.

## 1. In short

**Terms.**

- **ACP** (Agent Client Protocol): JSON-RPC 2.0 over the standard input and
  output of a child process. The client sends `initialize`, `session/new`
  or `session/load`, then `session/prompt`.
- **The core:** `server/drivers/acp/core.ts`. One generic ACP client for all
  ACP engines.
- **An adapter:** one object of type `AcpSupport` that the core takes
  (`core.ts:96-277`). It holds all that is specific to one engine. Its
  fields are of three kinds:
  - a **capability flag**: a boolean or a small enum that turns on a
    behaviour of the core, for example `modelVariants: true`.
  - **data**: a string, a number or a list, for example
    `engineTools: 24` or `credentialEnv: ["DEEPSEEK_API_KEY"]`.
  - a **hook**: a function that the core calls at a fixed point, for
    example `isAuthenticated`.
- **A model list** (a "catalog" in the code): `{default, options}`. Each
  option has an `id`, a `label` and optional fields such as `provider`,
  `custom`, `contextWindow` and `variants` (`server/contracts.ts:543-564`).
- **Discovery:** a short ACP session that the app opens only to read the
  model list of an engine. It sends no prompt.
- **A passthrough id:** a model id, for example `agent-default`, that means
  "keep the model that the engine has now". The app sends no switch for it.
- **An effort level:** one value of a fixed scale (`none`, `low`, `medium`,
  `high`, `xhigh`, `max`, `ultra`) that the app knows.
- **A variant:** an opaque reasoning choice that the engine names for one
  model, for example `default` or `custom/Deep_mode`. The app does not know
  the values in advance.
- **The selection channel:** how a driver tells the engine which model to
  use: an argument on the command line, the ACP call `session/set_model`, or
  the ACP call `session/set_config_option` with a config id such as
  `model`.
- **A usage-limit scope:** how far a usage limit reaches: the whole engine,
  or a list of models. A **hold** keeps the limited models from new turns
  until the limit resets.
- **A status log:** a log file of the engine that the app reads while the
  engine sends nothing over ACP.
- **The model manifest:** `server/model-manifest/model-manifest.json`. One
  JSON file with the fixed model lists of five engines.
- **The steering engine:** the ACP engine whose files have a name that
  `AGENTS.md` does not let us write in prose. This file writes its driver
  kind as `<steering>Agent` and its CLI as `<steering-cli>`. Its files are
  named only inside quoted paths.
- **OpenCode Go:** not a second engine. It is the model prefix
  `opencode-go/` on the one OpenCode driver (`driverKind: "opencodeGo"`).
  All the "Go" names in the code are aliases of the OpenCode ones
  (`server/drivers/acp/opencode-go.ts:320`, `:816`, `:853-855`;
  `shared/opencode-model-id.ts:33-35`).
- **DeepSeek Harness:** the CLI `dsh`, run as `dsh --profile acp`
  (`server/drivers/acp/deepseek.ts:1-2`).
- **Pi:** not an ACP engine. It has its own RPC and its own driver
  (`server/drivers/pi*.ts`). This file has it only for the limits of its
  shell timeout (section 3.9.9).

**The main facts.**

1. Each ACP engine is one adapter object of about 30 fields on one core.
   Most differences between engines are data. About 25 are capability
   flags, and about 20 are hooks (section 3.1).
2. Five places give a model list: a fixed list in code or in the model
   manifest, a discovery session, a CLI command of the engine, a public
   HTTP list, and a config file of the person. OpenCode merges three of
   them (section 3.3).
3. A failed model read keeps the last list and marks it "unconfirmed" with
   a reason: `failed`, `signedOut` or `timedOut`. It counts as signed out
   only when the engine's own error classifier says so
   (`server/drivers/acp/model-catalog.ts:48-51`;
   `server/drivers/acp/custom-model-catalog.ts:72-77`).
4. Three selection channels exist. Twelve adapters set `selectModel`, and
   so use `session/set_config_option`, mostly with the config id `model`. The app checks
   that the engine confirms the switch before it sends the prompt, and
   fails the turn if not (`server/drivers/acp/session-model-controls.ts:93-120`).
5. Reasoning has two shapes. Two engines have a fixed list of effort
   levels (Cline and the steering engine). Nine engines have variants that
   the engine reports for each model (`modelVariants: true`). A saved
   choice has an effort or a variant, never both
   (`server/config.ts:252-258`; `server/member-turn.ts:4-14`).
6. Each engine checks its sign-in in its own way: a file read, a CLI
   command, an empty ACP session, or nothing. Some fail open and some fail
   closed (section 3.2). P499 already proposes one rule.
7. The core deletes each key of its two lists of provider and app keys
   that is not in the adapter's `credentialEnv`, from any source
   (`core.ts:333-343`). A key that is not on those lists, for example
   `VENICE_API_KEY`, passes.
8. Three adapters narrow a usage limit to a list of models: OpenCode,
   Cline and Antigravity (`limitFacts`). The others hold the whole engine
   (`core.ts:1384`).
9. Only OpenCode and Qwen have a status log. So the 2-minute stop of a turn
   that waits out a usage limit in silence works only for them
   (`server/drivers/acp/quiet-status.ts:348`). The other engines get the
   5-minute stop of an engine with no sign of life.
10. The app installs DeepSeek Harness at version `0.2.2-rc.1`
    (`server/engine-versions.ts:37`). Its approval plugin needs
    `0.2.2-rc.2` (`server/drivers/acp/deepseek.ts:316`). So the copy that the
    app installs never gets "Approve for me", but the UI offers it by the
    driver name (`packages/phone-protocol/src/approval-mode.ts:41-46`).
11. At least 15 rules of this feature choose by a driver name, not by a
    flag. Section 3.12 lists them. `AGENTS.md` forbids this for our code.
12. Issue 1688 added one model to a fixed list with a 1M context window.
    The first change was code (commit `ad3ed7608`). Later the lists moved
    to the model manifest, a JSON file with a schema (commit `5f245f96d`).
    The context window comes from the engine report first, then the list,
    then a pattern table (`server/context-budget.ts:7-13`).

**What this file adds to the done research files.**

- [`engines-and-accounts.md`](engines-and-accounts.md) has the sign-in
  flows and the keys at the level of all engines. This file adds, for each
  ACP engine, what proves a sign-in, what the login command is, which keys
  the process gets and which keys it loses (sections 3.2 and 3.6).
- [`acp-adapter.md`](acp-adapter.md) has the Cursor adapter. This file adds
  the other eight ACP adapters and a matrix of all flags (section 3.1).
- [`tool-selection.md`](tool-selection.md) and
  [`turn-limits.md`](turn-limits.md) have the retry at 128 tools. This file
  adds only the data of each engine for it (section 3.7.3).
- New in this file: the model list of each engine, the selection channel,
  reasoning levels, usage-limit scopes, the status log, the model manifest
  and issue 1688.

## 2. Files read completely

Paths are in the reference project. Each subagent wrote its notes to
`.research/<group>.md` in this worktree. Git does not track that folder.

### 2.1 The groups

| Group | Files read completely (lines) | Read in ranges |
|---|---|---|
| `opencode-code` | `server/drivers/acp/opencode-go.ts` (855), `opencode-go.test.ts` (1849, in five ranges that cover all of it), `opencode-model-refresh.ts` (181), `opencode-probe.ts` (286), `opencode-typed-model.ts` (45), `opencode-release.ts` (48), `opencode-unreached.ts` (19), `opencode-background.ts` (53), `opencode-background.test.ts` (56), `opencode-cloud.test.ts` (140), `opencode-refresh.test.ts` (268), `opencode-price-holds.test.ts` (302), `opencode-acknowledged-holds.test.ts` (60), `shared/opencode-model-id.ts` (35) | `core.ts` (grep of hook points) |
| `opencode-host` | `docs/superpowers/plans/2026-08-15-opencode-go-integration.md` (93), `docs/plans/opencode-go-integration.md` (312), `docs/opencode-go.md` (86), `docs/verification/opencode-variants.md` (112), `server/drivers/agents-tool-limit.ts` (4), `server/tool-count-limit.ts` (138), `server/key-hint.ts` (37), `src/components/model-picker-reasoning.ts` (62) | `server/config.ts` (40, 248-260, 340-352, 400-412, 730-742, 770-866, 886-900, 1060-1075, 1095-1135), `server/credential-env.ts` (75-112), `server/routes/config.ts` (110-120, 144-152, 530-670), `server/plan-usage.ts` (1-30, 114, 120-185, 236-275, 850-935, 967-969, 1025-1039), `server/index.ts` (1066-1072, 1370-1395, 1488-1536, 2550-2612, 2645-2655, 7532-7545, 8305-8320, 9592-9602, 9688-9698, 10412-10430, 11578-11590, 11640-11660), `server/contracts.ts` (60-90, 285-298), `server/member-turn.ts` (1-15), `server/routes/tasks.ts` (262-290, 375-380), `electron/workspace-credentials.mjs` (1-40), `electron/credential-patch.mjs` (1-30), `src/state/store.tsx` (210-220, 494-502, 1326-1362, 2125-2160, 2636-2660) |
| `device-login-engines` | `server/drivers/acp/grok.ts` (659), `grok-sign-in.ts` (63), `grok-catalog.test.ts` (113), `grok-device-auth.test.ts` (229), `grok-sign-in.test.ts` (118), `grok-session.test.ts` (266), `kimi.ts` (587), `kimi-device-auth.test.ts` (258), `kimi-model-selection.test.ts` (86), `docs/verification/grok-steering.md` (126), `docs/verification/kimi-models.md` (31) | `core.ts` (105-150, 872-890, 1084-1102, 1196-1215, 1350-1358), `server/model-manifest/model-manifest.json` (90-140), `server/model-manifest/schema.ts` (1-40), `server/drivers/device-auth.ts` (the diff from `fcce0b6de`) |
| `deepseek` | `server/drivers/acp/deepseek.ts` (431), `deepseek.test.ts` (598), `dsh-approval-plugin.ts` (140), `dsh-approval-plugin.test.ts` (214), `docs/superpowers/plans/2026-10-22-deepseek-harness-engine.md` (418), `server/deepseek-variants.e2e.test.ts` (94) | `core.ts` (hook points), `config-options.ts` (41-66), `server/engine-versions.ts` (1-45), `failure-words.ts` (1-60), `server/runtime/capabilities.ts` (1-45), `server/runtime/level.ts` (1-30), `packages/phone-protocol/src/approval-mode.ts` (15-55), `server/config.ts` (712-720, 776-782, 1078-1118), `server/credential-env.ts` (1-20, 77-115), `server/engine-homes/layout.ts` (50-66), `server/env-path.ts` (385-400), `src/components/EngineSetup.tsx` (545-556, 620-630), `src/components/keys/key-catalog.ts` (118-127) |
| `cline-copilot-qwen` | `server/drivers/acp/cline.ts` (229), `cline-models.ts` (80), `cline.test.ts` (343), `copilot.ts` (282), `copilot.test.ts` (395), `qwen.ts` (242), `qwen-catalog.test.ts` (251), `qwen-approvals.test.ts` (25), `docs/verification/cline.md` (101), `docs/verification/copilot-engine.md` (97), `docs/verification/qwen-models.md` (53) | `core.ts` (105-125, 186-195, 205-222, grep hits), `server/env-path.ts` (217-219), `server/drivers/local-inject.ts` (71-77, 106-108, 132-138), `quiet-status.ts` (65-85) |
| `custom-and-model-plumbing` | `server/drivers/acp/custom.ts` (55), `custom.test.ts` (129), `custom-model-catalog.ts` (310), `custom-model-catalog.test.ts` (289), `model-catalog.ts` (83), `model-catalog.test.ts` (70), `session-model-controls.ts` (187), `session-model-controls.test.ts` (150), `session-modes.ts` (76), `session-modes.test.ts` (107), `config-options.ts` (121), `config-options.test.ts` (48), `config-decode.ts` (13), `capabilities.ts` (23), `api-key-account.ts` (12), `driver-hooks.ts` (134), `docs/verification/custom-acp-models.md` (84), `docs/requirements/issue-1688-requirements.md` (18), `docs/design/issue-1688-design.md` (33), `server/model-context-window.ts` (17), `server/model-manifest/bundled.ts` (28), `server/model-manifest/schema.ts` (118) | `core.ts` (86-277, 305-372, 514-540, 582-590, 730-738, 922-940, 978-983, 994-1004, 1036-1042, 1064-1140, 1196-1290, 1322-1330, 1374-1390, 1418-1462), `server/context-budget.ts` (1-25), `server/contracts.ts` (540-566), `model-manifest.json` (24-40), `server/startup-model-catalog.ts` (grep), commit `ad3ed7608` |
| `ui` | `src/components/EngineSetup.tsx` (842), `ModelPicker.tsx` (1017, in three ranges), `model-picker-reasoning.ts` (62), `CloudEngineSignIn.tsx` (240), `keys/key-catalog.ts` (296), `keys/KeyPanels.tsx` (242), `src/lib/model-choices.ts` (55), `src/lib/built-in-instances.ts` (8) | `src/state/config-status.ts` (1-40, 60-92, 190-200), `EngineSetup.test.ts` (254-310), `EngineSetup.refresh.test.ts` (73-92), `ModelPicker.test.ts` (107-290, 366-390), `CloudEngineSignIn.test.ts` (96-142), one fact each from `effort-levels.ts`, `engine-sign-in.ts`, `DeviceSignIn.tsx`, `engine-rail.ts`, `EngineLibrary.tsx`, `local-model-probe.ts` |
| `pi-and-changelog` | `docs/verification/pi-shell-timeouts.md` (42), `server/shell-timeout-hint.ts` (22), `shell-timeout-hint.test.ts` (40), `server/drivers/pi-mcp-extension.ts` (762), `pi-catalog.ts` (46), `pi-model-id.ts` (5), `server/instance-fleets.ts` (87), `server/drivers/pi-agent-dir.ts` (144), `server/host/limit-takeover.ts` (360) | `server/config.ts` (186-200, 237-262, 300-312, 438-446, 650-679, 710-745, 1040-1227), `limit-takeover.test.ts` (11-35, 555-590), `quiet-status.ts` (1-60, 315-370), `quiet-watch.ts` (18-82), `server/drivers/engine-errors.ts` (13-18), `server/drivers/pi.ts` (66-85, 205-235), `server/automatic-recovery.ts` (34-43), `server/limit-failover.ts` (21-31), `server/workspace.ts` (16-18), `server/system-prompt.ts` (296-300) |

Paths in the table without a folder are in `server/drivers/acp/`.

### 2.2 The checks of the lead

The lead read these lines at `42f86aefd`. Each one agrees with the report
of its subagent.

| # | Claim | Lines |
|---|---|---|
| 1 | OpenCode reserves 24 tools for itself | `opencode-go.ts:708-709` |
| 2 | The core default of own tools is 32, and the learned limit is keyed by instance and model | `core.ts:889-893` |
| 3 | OpenCode turns off the person's Claude instructions with one env var | `opencode-go.ts:715-718` |
| 4 | OpenCode turns off project config only in folders that the app owns | `opencode-go.ts:721-722` |
| 5 | The local-model inject writes `{ $schema }` over an `opencode.json` that does not parse | `opencode-go.ts:375-380`, `:416` |
| 6 | A non-free limit on an `opencode-go/` model holds only the Go models | `opencode-go.ts:782-787` |
| 7 | The user doc says a Go limit holds the whole account | `docs/opencode-go.md:72-74` |
| 8 | The learned tool limit lives in memory, 500 entries at most | `server/tool-count-limit.ts:82-98` |
| 9 | DeepSeek Harness is pinned to `0.2.2-rc.1` | `server/engine-versions.ts:37` |
| 10 | The approval plugin needs `0.2.2-rc.2` | `deepseek.ts:316`, `:368` |
| 11 | Native review and the levels of each engine are lists of driver names | `approval-mode.ts:22-26`, `:41-46` |
| 12 | `modelSwitchNeedsAsk` is in the same file | `approval-mode.ts:33-39` |
| 13 | The steering engine's sign-in probe fails open | `grok-sign-in.ts:50-62` |
| 14 | Kimi's sign-in check fails closed | `kimi.ts:43-50` |
| 15 | A device sign-in with no `failureReason` reports `exited` | `server/drivers/device-auth.ts:148` |
| 16 | No ACP adapter sets `failureReason` | grep of `server/drivers/acp/` |
| 17 | The steering engine writes `config.toml` with no file mode, but stages it with 0600 elsewhere | `grok.ts:251`, `:404-409` |
| 18 | Kimi writes `config.toml` with no file mode | `kimi.ts:455`, `:457` |
| 19 | Qwen writes `{}` plus its rows over a settings file that does not parse | `qwen.ts:108-122`, `:146` |
| 20 | Copilot counts any failure that is not a login refusal as signed in | `copilot.ts:117-124` |
| 21 | Cline counts a bad provider file as signed out | `cline.ts:50-60` |
| 22 | Only OpenCode and Qwen set `statusLog` | `opencode-go.ts:692`, `qwen.ts:239` |
| 23 | The usage-limit stop needs a logged signal | `quiet-status.ts:348` |
| 24 | The desktop writes an empty value for the OpenCode key and the DeepSeek key, not for the provider keys | `server/routes/config.ts:596`, `:601`. No `providerKeys` in `electron/` |
| 25 | "Shares the workspace" is a list of driver names | `server/workspace.ts:16-18` |
| 26 | The thinking option is found by four ids and two categories | `config-options.ts:41-44` |
| 27 | Discovery limits: 8 s, 60 s, 8 MiB, 1 MiB, 128 models | `custom-model-catalog.ts:12-16` |
| 28 | The core deletes each provider key that is not in `credentialEnv`, after the instance env | `core.ts:333-343` |
| 29 | Claude Opus 5.5 has `contextWindow: 1000000` in the manifest | `model-manifest.json:25-36` |
| 30 | The context window order: report, list, pattern, 128,000 | `server/context-budget.ts:7-13` |
| 31 | Cline keeps one model list for the whole process | `cline-models.ts:56` |
| 32 | `auth_required` with credit or quota words is not a sign-out | `server/host/limit-takeover.ts:89-93` |
| 33 | Pi sets 120 s and blocks a timeout outside (0, 900] | `server/drivers/pi-mcp-extension.ts:607-615` |
| 34 | The UI gives Codex sign-in texts to an unknown driver, and asks Cline for an explicit sign-in | `src/components/DeviceSignIn.tsx:37-44`; `src/components/EngineLibrary.tsx:12-20` |

The lead also read `server/index.ts:1386-1392` (the model refresh of each
`opencodeGo` instance by name), `server/config.ts:1128-1131` (keys injected
by name), `server/member-turn.ts:4-14` (the 409 for a variant),
`server/drivers/pi.ts:205-214` (an empty Pi list after 15 s) and
`server/host/limit-takeover.ts:186-190` (the backup checks).

### 2.3 Lines that did not change

`git diff --stat fcce0b6de 42f86aefd` is empty for all OpenCode, DeepSeek,
Cline, Copilot and Qwen files of this feature. So the lines that
`acp-core.md` and `engines-and-accounts.md` cite in them still hold. The
files that changed are in section 9.2.

## 3. How it works

### 3.1 The differences: a matrix of flags and data

Each row is one way that ACP engines differ. "F" marks a capability flag
(or an enum), "D" marks data, "H" marks a hook (a function). The last
column is our choice for the port: what becomes a flag of our `Driver`, and
what becomes data of an adapter. Paths are in `server/drivers/acp/`.

| Difference | OpenCode | DeepSeek | Kimi | Steering engine | Cline | Copilot | Qwen | Custom | Our choice |
|---|---|---|---|---|---|---|---|---|---|
| Sign-in check | key, `auth.json` or any model listed (`opencode-go.ts:736-741`) | a key in env, `.credentials.yaml` or `.env` (`deepseek.ts:121-128`) | a token file with tokens (`kimi.ts:25-50`) | `auth.json` exists, then `<steering-cli> models` two times (`grok-sign-in.ts:13-62`) | `CLINE_API_KEY` or a saved OAuth token (`cline.ts:57-60`) | an empty `session/new` probe (`copilot.ts:133-141`) | none (`qwen.ts:231`) | none (`custom.ts:33`) | F: the kind of check (none, file, CLI, probe). D: paths and words |
| Check that cannot finish | n/a | signed out | signed out | signed in | signed out | signed in for 15 s | n/a | n/a | P499: one `Unknown` state |
| ACP `authenticate` method | none (`:734`) | none (`deepseek.ts:414`) | none (`kimi.ts:579`) | `cached_token`, then the vendor's web login method (`grok.ts:651`) | the saved OAuth provider (`cline.ts:132-135`) | none (`copilot.ts:220`) | none | none | D: a list of method ids |
| `authFailure` | `continue` | `continue` | `continue` | `fail` | `fail-request` | `continue` | `continue` | `continue` | F: enum of three |
| Refuse a turn before spawn when signed out | no | no | no | no | yes (`cline.ts:142`) | no | no | no | F |
| Static model list | empty (`opencode-go.ts:53`) | three models (`deepseek.ts:46-53`) | manifest, four models | manifest, three models | `cline-default` (`cline.ts:14-15`) | `auto` (`copilot.ts:18-19`) | empty (`qwen.ts:13`) | `agent-default` (`custom.ts:22`) | D |
| Live model list | discovery session plus CLI plus provider lists (section 3.3.3) | own discovery session (`deepseek.ts:202-313`) | manifest plus `config.toml` (`kimi.ts:494-537`) | manifest plus `config.toml` (`grok.ts:94-154`) | public HTTP list (`cline-models.ts:6`) | shared discovery (`copilot.ts:127-131`) | the person's `settings.json` (`qwen.ts:22-90`) | shared discovery (`custom-model-catalog.ts:124`) | F: the source kind. D: URL, path, options |
| Read the list at create | yes | no (`deepseek.ts:410`) | yes | yes | yes, only when signed in (`cline.ts:143-145`) | no (`copilot.ts:208-210`) | yes | no (`custom.ts:28`) | F: `resolveModelsOnCreate` |
| Selection channel | config option `model` (`opencode-go.ts:700`) | config option `model` (`deepseek.ts:402`) | config option `model`, plus `-m` that the CLI ignores (`kimi.ts:561-567`) | `-m` on argv plus `session/set_model` (`grok.ts:541-555`, `:607-624`) | `provider` option, then `model` option or `set_model` (`cline.ts:168-180`) | config option `model`, `auto` confirms unset (`copilot.ts:211`) | config option `model` (`qwen.ts:230`) | config option `model`, legacy `set_model` allowed (`custom.ts:29`) | F: enum of the channel. D: the config id |
| Model no longer offered | free model or the catalog default, with a notice (`opencode-go.ts:701-705`) | catalog default, then current (`deepseek.ts:419-425`) | turn fails, "did not switch to" | turn fails with the list of offered models (`grok.ts:156-169`) | turn fails (`cline.ts:148-150`) | `auto`, with a notice (`copilot.ts:213-217`) | turn fails (`qwen.ts:184-187`) | no fallback, so the switch fails | F: fallback or fail |
| Reasoning | variants from the engine (`opencode-go.ts:706`) | variants: off, low, high, max (`deepseek.ts:11-14`, `:403`) | none | fixed `low`, `medium`, `high` (`grok.ts:513-514`) | fixed `none` to `xhigh` (`cline.ts:118`) | variants from the engine (`copilot.ts:212`) | none | variants (`custom.ts:30`) | F: `modelVariants`. D: `effortLevels` |
| How effort reaches the engine | config option | config option | n/a | live config option, restart if refused (`grok.ts:464-484`) | `--thinking` on argv, so a new process (`cline.ts:119`) | config option | n/a | config option | F: enum of the channel |
| Keys that reach the process | `OPENCODE_API_KEY` and ten provider keys (`opencode-go.ts:699`) | `DEEPSEEK_API_KEY` (`deepseek.ts:400`) | none, and it deletes `MOONSHOT_API_KEY`, `KIMI_API_KEY`, `KIMI_MODEL_*` (`kimi.ts:569-574`) | none, and it deletes `XAI_API_KEY` (`grok.ts:631-634`) | `CLINE_API_KEY` (`cline.ts:121`) | none, and it deletes server `GH_TOKEN`, `GITHUB_TOKEN`, `COPILOT_ALLOW_ALL` (`copilot.ts:200-206`) | none | none | D: `credentialEnv` |
| Usage-limit scope | free models of one provider, Go models, or the engine (`opencode-go.ts:776-795`) | engine | engine | engine | ClinePass models, or the engine (`cline.ts:183-187`) | engine | engine | engine | H, returns typed data |
| Writes into the person's engine config | `opencode.json` (`opencode-go.ts:361-418`) | no | `config.toml` (`kimi.ts:402-460`) | `config.toml` (`grok.ts:187-253`) | no | no | `settings.json` (`qwen.ts:92-150`) | no | P103: never |
| Status log | yes, one shared file (`opencode-go.ts:692`) | no | no | no | no | no | yes, debug log (`qwen.ts:239`) | no | F plus D: path and parser |
| New process when tools change | no | yes (`deepseek.ts:405-407`) | no | no | yes (`cline.ts:120`) | yes (`copilot.ts:218`) | yes (`qwen.ts:229`) | no | F: `restartOnMcpChange` |
| Engine's own tools | 24 (`opencode-go.ts:709`) | default 32 | default 32 | default 32 | default 32 | default 32 | default 32 | default 32 | D: a number |
| System text | in the prompt text | in the prompt text (`deepseek.ts:427-428`) | in the prompt text (`kimi.ts:584`) | in the prompt text (`grok.ts:655-656`) | n/a | in the prompt text (`copilot.ts:226`) | in the prompt text (`qwen.ts:234`) | n/a | F: in the prompt or in setup |
| Install | npm `@opencode/cli`, or a pinned build (`opencode-go.ts:680-690`; `opencode-release.ts`) | npm `@deepseek-ai/dsh` (`deepseek.ts:349-356`) | curl, PowerShell or npm (`kimi.ts:549-558`) | curl, no Windows (`grok.ts:520-528`) | npm `cline` (`cline.ts:110-115`) | npm `@github/copilot` (`copilot.ts:193-198`) | curl or PowerShell script (`qwen.ts:218-225`) | none | D |
| Sign-in command | `opencode auth login` | none (a key) | `kimi login` | `<steering-cli> login` | `cline auth` | `copilot login` | none | none | D |

The capability flags that the core reads, with their default and the
engines that set them, were found by a grep of `name:` at the start of a
line in `server/drivers/` (section 9.1 says why the grep can miss one):

| Flag | Default | Set by | Lines |
|---|---|---|---|
| `access` | `subscription` (`core.ts:323`) | `custom`: custom, Hermes, Qwen, OMP | `custom.ts:21`, `qwen.ts:211` |
| `images` | true unless `false`. Native image input only when `true` (`capabilities.ts:13-14`) | true: 8 engines, Cline and Copilot among them | `cline.ts:108`, `copilot.ts:191` |
| `effortLevels` | none | Cline, the steering engine | `cline.ts:118`, `grok.ts:514` |
| `modelVariants` | false | custom, Antigravity, OMP, Kiro, Devin, Command Code, DeepSeek, Copilot, OpenCode | `capabilities.ts:16` |
| `resolveModelsOnCreate` | read at create | `false`: custom, Mistral Vibe, OMP, Kiro, Copilot, Devin, DeepSeek, Command Code | `core.ts:351`, `:356-363` |
| `selectModel` (its presence) | the model goes on argv | 12 engines | `session-model-controls.ts:8-16` |
| `authFailure` | required | `fail`: Antigravity, the steering engine. `fail-request`: Cline. `continue`: the others | `core.ts:1096-1102` |
| `requireAuthenticationBeforeSpawn` | false | Antigravity, Cline | `core.ts:876-887` |
| `skipAuthenticateWhenAuthenticated` | false | Cursor | `core.ts:1086-1103` |
| `sessionScopedApproval` | false | Antigravity, Kiro, Devin, Hermes | `core.ts:306-308` |
| `resumeMethod` | `load` | `resume`: Antigravity, DeepSeek | `core.ts:1132` |
| `restartOnMcpChange` | false | Cline, Copilot, Hermes, Command Code, Cursor, Qwen, DeepSeek | `core.ts:422`, `:954` |
| `mcpServersFromLaunch` | false | Copilot | `core.ts:1133`, `:1176` |
| `shareProcess` | false | Mistral Vibe, OpenCode | `core.ts:939` |
| `ownMcpOverHttp` | false | true: Cursor, OMP, OpenCode. `advertised`: Antigravity, the steering engine | `core.ts:209` |
| `engineTools` | 32 | OpenCode 24 | `core.ts:893` |
| `steer` | none | custom (when its config asks), Hermes, Devin, OpenCode, the steering engine | `capabilities.ts:20` |
| `askTool` | none | the steering engine | `capabilities.ts:19` |
| `credentialEnv` | none: every provider key is deleted | 11 engines, DeepSeek, Cline and OpenCode among them | `core.ts:338-343` |
| `classifyError` (hook) | a discovery error is `failed` | Antigravity, Cursor, Devin, OpenCode, Copilot, Command Code | `core.ts:353` |
| `limitFacts` (hook) | `{limit: "engine"}` | Antigravity, Cline, OpenCode | `core.ts:1384` |
| `statusLog` (hook plus data) | none | OpenCode, Qwen | `core.ts:215` |

`server/drivers/acp/driver-hooks.ts:9-63` adds 16 optional hooks. The
steering engine and Antigravity set most of them. The custom engine sets
none (`custom.ts:18-34`).

`acpCapabilities` (`capabilities.ts:4-23`) maps an adapter to the
capabilities that the rest of the app sees. For all ACP engines it says:
no model switch inside a session, all MCP kinds, the context as a "meter"
and a strict resume. It reads only `images`, `effortLevels`,
`modelVariants`, `askTool` and `steer` from the adapter.

### 3.2 Flow: the sign-in check of each engine

[`engines-and-accounts.md`](engines-and-accounts.md) sections 3.10 and
3.11 have the device sign-in flow. These are the checks that say "signed
in" or "signed out" in the status of each engine.

1. **OpenCode.** Signed in when one of these is true (`opencode-go.ts:736-741`):
   - `OPENCODE_API_KEY` is set.
   - `auth.json` has an entry with a `key`, an `access` or a `refresh`
     (`:440-463`). The app looks in the XDG data folder first, even on
     macOS, then in the folder of the OS (`:425-438`).
   - Any model can be listed, because the free Zen models need no login
     (`:292-310`). The answer is kept 30 s (`:59`).
   With no own key or login and only free models, the status gets
   `freeFallback: true` (`:470-479`, `:842-847`). A change of the size or
   the time of `auth.json` starts a new process, because a running
   `opencode acp` does not read the file again (`:647-657`).
2. **DeepSeek Harness.** Signed in when a key is in `DEEPSEEK_API_KEY`, in
   `$DSH_HOME/.credentials.yaml` (two layouts) or in `$DSH_HOME/.env`
   (`deepseek.ts:83-128`). A file that cannot be read means no key. There
   is no `authenticate` call (`:414-416`). A turn with no key still starts
   `dsh`, and `dsh` refuses it.
3. **Kimi.** Signed in when a token file in `<home>/credentials/` holds a
   token (`kimi.ts:25-50`). The file name has two forms: one for each region
   (`:25-27`). A file with both tokens empty is a revoked login. Any read
   error means signed out (`:47-49`). Sign-out deletes the files, because
   the CLI has no logout command (`:65-72`).
4. **The steering engine.** The turn gate checks only that `auth.json`
   exists (`grok.ts:37-39`). The status runs `<steering-cli> models`
   (`grok-sign-in.ts:13-62`):
   1. The app reads only the output words. It never reads the token.
   2. The first "not authenticated" does not count, because the CLI
      refreshes an old token in the same call. Only a second one counts
      (`:25-30`).
   3. The call has 8 s. A killed call is `unknown`. The answer is kept
      5 minutes, and an old answer comes back at once while a new call
      runs (`:36-62`).
   4. Only `signed-out` gives false (`:56-61`).
5. **Cline.** Signed in when `CLINE_API_KEY` is set, or the saved provider
   in `providers.json` is an OAuth provider with a token (`cline.ts:22-60`).
   A file over 256 KiB, a wrong version or a bad field means signed out
   (`:32-52`). Cline refuses the turn before it starts the process
   (`:142`).
6. **Copilot.** The app opens an empty session with no prompt
   (`copilot.ts:133-141`):
   1. Signed out only when the error is a login refusal: code `-32000` and
      a login phrase, not an MCP error (`:148-173`).
   2. Any other failure counts as signed in for 15 s (`:117-124`).
   3. Signed in is kept 5 minutes, signed out 60 s. A caller waits at most
      3 s, then gets the last answer or "signed in" (`:25-31`, `:142-145`).
   4. Open risk: Copilot CLI 1.0.105 lists models with an invalid token,
      so the probe cannot see a bad token (`docs/verification/copilot-engine.md:93-95`).
7. **Qwen and the custom engine.** No check: always signed in
   (`qwen.ts:231-233`, `custom.ts:31-33`).

Edge cases:

- The login commands get no API key: `XAI_API_KEY` and `MOONSHOT_API_KEY`
  are removed (`grok-device-auth.test.ts:71-72`, `kimi-device-auth.test.ts:109-110`).
- A stored `auth.json` of the steering engine reads as signed in, but a
  new sign-in still runs the login, because the stored login can be the
  one that a turn just refused (`grok-device-auth.test.ts:115-123`).
- The shared device controller now gives each failure a code (`timed_out`,
  `expired`, `exited`, `failed`, `cancelled`, `not_installed`). An adapter
  can map the CLI words to a code with `failureReason`. No ACP adapter does
  this, so each failed login of the steering engine and of Kimi is
  `exited` (`server/drivers/device-auth.ts:148`).
- The device prompt differs. Kimi prints a code that lives 600 s and can
  send a new code. The CLI gives up after 900 s (`kimi-device-auth.test.ts:35`,
  `kimi.ts:74-75`). The steering engine prints no lifetime. Both get the
  same 15-minute limit of the controller (`server/drivers/device-auth.ts:140-141`).
- The steering engine refuses a page link with an extra query. Kimi removes
  the extra query from the link that it shows (`grok-device-auth.test.ts:43`,
  `kimi-device-auth.test.ts:57-60`).

### 3.3 Flow: the model list

#### 3.3.1 The shared state of one instance

`acpModelCatalog` (`model-catalog.ts:5-83`) holds the live list of one
instance. The core makes it at `core.ts:348-353`.

1. **Start.** With `resolveModels` and `resolveModelsOnCreate: false`, the
   list starts from the saved startup cache. Else it starts from the fixed
   list (`model-catalog.ts:27-28`). The saved cache is
   `DATA_DIR/providers/engine-models/<instanceId>.json`
   (`server/startup-model-catalog.ts:18-21`). It is fresh for 6 hours and
   for the same build (`:14`, `:155`).
2. **Read.** A non-empty result replaces the list and clears the problem
   (`model-catalog.ts:39-47`).
3. **Read cut short.** A read that ran out of time keeps the variants of an
   earlier read for the models that it did not reach. The cache gets
   `checkedAt: 0`, so the next start reads again (`:40-44`, `:73-79`).
4. **Read failed or empty.** The list stays, and it is marked
   "unconfirmed" with a reason: `timedOut`, `signedOut` or `failed`
   (`:48-51`). `signedOut` comes only when the engine's own
   `classifyError` says `invalid_credentials`
   (`custom-model-catalog.ts:72-77`). Without the hook, it is `failed`.
5. **Write.** Each read writes the startup cache (`model-catalog.ts:53`).
6. **Two refreshes.** A read that runs is shared. A "fresh" request waits
   for a running read that was not fresh, then reads again (`:63-69`).
7. **After a sign-in.** A device or browser sign-in refreshes the list
   (`core.ts:367-368`).

An engine with a fixed list and no `resolveModels` is never
"unconfirmed" (`model-catalog.ts:61-62`).

#### 3.3.2 Shared discovery

`discoverAcpModels` (`custom-model-catalog.ts:128-310`) serves the custom
engine, Copilot, Cursor, Devin, Mistral Vibe, OMP, Kiro and Command Code.

1. Make a temporary folder as the working folder (`:134`).
2. Start the engine and send `initialize` with no file system and no
   terminal (`:221-229`).
3. If the adapter has `authMethod`, call `authenticate` (`:230-236`).
4. Send `session/new` with no MCP servers (`:237`).
5. Read the model option (`:241`). No option: "The ACP agent did not
   advertise any models. The previous catalog was kept." (`:242`).
6. For each model, switch to it and read its reasoning option. Use
   `session/set_config_option` when the option has a config id, else
   `session/set_model` (`:251-284`). The response or a later
   `config_option_update` confirms the switch (`:172-178`).
7. Delete the session if the engine says it can. Else call the adapter's
   `forgetSession`. Stop the process (grace, then a kill of the process
   tree). Remove the folder (`:296-306`).

Limits: 8 s for one request, 60 s in all, 8 MiB of output, 1 MiB for one
line, 128 models, 200 characters for an id or a label (`:12-16`, `:103`,
`:111`).

Security:

- Each request from the engine is refused during discovery
  (`:165-171`).
- An id must match a strict pattern with no `..` (`:99-105`). A label with
  a control character or a bidi control falls back to the id (`:107-117`).
- The error text of the engine is cut to 500 characters and never goes to
  the person (`:50-60`).

Per-engine options are mostly data (`:20-48`): the passthrough id,
`custom`, `variants`, `variantLimit`, `maxModels`, `default`,
`clientCapabilitiesMeta`, `exitGraceMs` and the time limits. Three are
hooks: `authMethod` with `authMeta`, `label`, and `forgetSession`.

A second survey loop, `surveyModelVariants` (`config-options.ts:98-121`),
serves OpenCode and Antigravity. DeepSeek and OpenCode each have their own
small JSON-RPC client for discovery (`deepseek.ts:202-313`,
`opencode-probe.ts:164-286`). So the reference has three discovery clients
and two survey loops.

#### 3.3.3 The list of each engine

1. **OpenCode** (`opencode-go.ts:242-285`):
   1. Run, at the same time, a discovery session and
      `opencode models --verbose`. Only OpenCode 1 has the second one. It
      adds names, the context window, prices and variants (`:106-176`,
      `:240-241`).
   2. The session list wins. The verbose data joins it by id (`:266-272`).
   3. With neither, use the last good list for that CLI path, else an
      empty list (`:276-279`).
   4. Each half gets one retry, because two processes in a new home can
      race to make the database (`:256-261`).
   5. The probe runs in a git folder that the app owns, because OpenCode
      files each session under the project of its folder
      (`opencode-probe.ts:84-103`). OpenCode 2.2 keeps every session in the
      person's history, so the probe deletes the sessions that it opened. A
      ledger file lists them (`:121-158`).
   6. Refresh: `opencode models --refresh` (75 s) on OpenCode 1. OpenCode 2
      does not have it, so the app waits 10 s for the engine's own refresh
      (`opencode-go.ts:213-223`, `:248-252`). A changed set of ids starts a
      new process (`:280-290`).
   7. A timer refreshes every 3 hours, and checks every 10 minutes
      (`opencode-model-refresh.ts:35-36`, `:162-181`).
   8. For Venice, the app reads the provider's own list and gives it to
      OpenCode through `OPENCODE_CONFIG_CONTENT`. It drops models that need
      an encrypted prompt (`opencode-model-refresh.ts:23-33`).
   9. A model that the person types (`typed::provider/model`) is declared
      the same way, only under a provider that the list already has
      (`opencode-typed-model.ts:31-45`).
   10. Default: a free model first, because "OpenCode 2 with a key picks a
       paid model on its own" (`opencode-go.ts:84-98`).
2. **DeepSeek Harness.** Three fixed models. The live list comes only on
   Refresh, because a cold start took about 120 s (`deepseek.ts:18-21`,
   `:410`). Its own client switches to each model to read its levels
   (`:202-313`). Above 128 models it reads only the current one (`:196`).
   The time limit is 60 s, and an env var can change it (`:184-194`). The
   picker id is `provider/model`. The engine takes a JSON pair, so the
   adapter splits on the first slash (`:55-75`).
3. **Kimi and the steering engine.** The fixed list is in the model
   manifest (`model-manifest.json:96-140`). Each adapter adds the models of
   the engine's own `config.toml` (`kimi.ts:494-537`, `grok.ts:94-154`).
   Only the steering engine reads a default from that file.
4. **Cline.** One fixed entry, "Cline default (configured)", plus a public
   list of free and ClinePass models (`cline-models.ts:6`). The fetch has
   3 s. On a failure it keeps the last list, which starts as a bundled list
   (`:56`, `:63-79`). An empty tier replaces the old one, because "Cline can
   end one" (`:76-77`). The list is read only when signed in
   (`cline.ts:143-145`).
5. **Copilot.** Shared discovery, with a label that adds the price
   multiplier: "Claude Haiku 4.5 · 0.33x" (`copilot.ts:38-47`). Copilot
   keeps each ACP session in a folder of its own, so the adapter deletes
   the folder of the discovery session (`:73-88`). It is not read at
   create, because any `copilot` on the PATH would start
   (`:208-210`).
6. **Qwen.** The routes of the person's `~/.qwen/settings.json`
   (`qwen.ts:22-90`). Rows for images, voice or fast use only are skipped
   (`:50`). Two routes with one id get an opaque id from a hash, with no
   host or key in it (`:58-73`). A bad address or two routes that cannot
   be told apart fail the read (`:45`, `:74-76`).
7. **Custom.** Shared discovery with the passthrough `agent-default`, all
   models marked `custom` (`custom-model-catalog.ts:124`).

### 3.4 Flow: the model at turn time

1. The adapter's `resolveTurnModel` maps the saved id to the engine id, for
   example the DeepSeek JSON pair (`deepseek.ts:418`).
2. With `selectModel`, `pickSessionModel` runs
   (`session-model-controls.ts:137-187`):
   1. A pooled process that lacks a model of the list is stale: the turn
      fails and a new process starts. It never runs another model
      (`:164-166`).
   2. A model that the session does not offer runs the adapter's
      `fallbackModel`, if it has one. The person sees one notice for each
      session: "<name> no longer offers <wanted>, so this conversation uses
      <fallback>." (`:170-185`).
   3. Without `fallbackModel`, the saved model stays, with no notice
      (`session-model-controls.test.ts:143-149`).
3. `select` sends the switch (`:93-120`):
   - No switch for no model, the passthrough id, or the current model.
   - The legacy `session/set_model` only when `allowLegacy` is set (only the
     custom engine).
   - Else `session/set_config_option {configId, value}`.
   - If the engine does not confirm, the turn fails: "<name> did not switch
     to <m> (still <x>)" (`:115-118`).
4. With a variant: `session/set_config_option` with the variant, and
   "did not apply variant" if it is not confirmed (`core.ts:1244-1250`).
5. Before the prompt, the turn fails if the model, the variant or the mode
   changed (`core.ts:1273-1281`).

Engine detail:

- **The steering engine** puts `-m` between `agent` and `stdio`, because
  CLI 1.0.6 takes `-m` first as a TUI option (`grok.ts:541-555`). It still
  sends `session/set_model`, because the session starts on the default of
  `config.toml` (`:573`, `:607-624`). A model that the account does not
  offer gives a plain sentence with the offered models. It is final for
  routines, and the process stops (`:156-169`, `:615-618`). The model and
  the effort are not in the process contract, so a change does not start a
  new process (`:453-458`).
- **Kimi** CLI 2.5.3 ignores `-m` for ACP, so the config option does the
  work, and the app checks the result (`kimi.ts:1-2`,
  `docs/verification/kimi-models.md:3-7`).
- **Cline** sets the `provider` option first, then the `model` option. The
  ACP agent lists only the models of its provider, but runs a model that it
  did not list (`cline.ts:168-174`). Cline 3.0.74 refuses the `provider`
  option while `CLINE_PROVIDER` is set, so the adapter renames that
  variable (`:17-18`, `:124-126`).
- **Copilot** CLI 1.0.105 leaves the current value unset on Auto. So an
  unset value confirms only `auto` (`copilot.ts:2-6`, `:211`).
- **OpenCode** with a key and no saved model: the adapter sends a free
  model, because OpenCode would pick a paid one (`opencode-go.test.ts:1616-1640`).

### 3.5 Flow: reasoning levels

1. **Two shapes.** A saved choice has `effort` (a fixed level) or
   `variant` (an opaque id), never both (`server/config.ts:252-258`). The
   save route refuses both: "choose either a model variant or an effort
   level" (`server/index.ts:2562-2576`).
2. **Effort levels.** The model's own list first, then the instance's, then
   the adapter's (`packages/phone-protocol/src/effort-levels.ts:10-16`).
   "Default" sends nothing. "None" sends a level (`src/components/ModelPicker.tsx:50-53`).
3. **Variants.** With `modelVariants`, the app finds the reasoning option by
   the ids `effort`, `reasoning_effort`, `thought_level` or `thinking`, or
   the categories `thought_level` or `thinking` (`config-options.ts:41-44`).
   The values stay as the engine gives them. A test fixture uses the
   unusual id `thinking` on purpose, "so a driver hardcoded to the ID
   `effort` cannot pass" (`docs/verification/custom-acp-models.md:15-20`).
4. **The live list.** Each turn reports the engine's current choices in the
   event `session.model-variants` (`core.ts:996-1001`). The window uses that
   list first, then the list of the catalog
   (`src/components/model-picker-reasoning.ts:20-28`).
5. **Save.** `PATCH /api/bots/{bot}/tasks/{thread}` saves the choice of one
   conversation (`server/routes/tasks.ts:375-380`). The route checks only
   the flag, not the value (`server/index.ts:2601-2607`).
6. **Turn.** A saved variant on an engine with no `modelVariants` gives
   409 `unsupported_model_variant` (`server/member-turn.ts:4-14`). A
   variant that the model does not offer fails before the prompt
   (`opencode-go.test.ts:1463-1468`).
7. **While the bot works,** the reasoning row is the only change that the
   picker allows. It applies from the next turn
   (`model-picker-reasoning.ts:37-45`).

Engine detail:

- **The steering engine:** a fixed list, because its levels differ by
  model and its CLI checks a level only when it uses it. One of its models
  refuses `xhigh` (`grok.ts:513-514`). It changes the level live and checks the reply. If
  the engine refuses, it starts again with `--reasoning-effort` on the
  command line (`:464-484`). A cleared level needs a new process
  (`grok-session.test.ts:209-220`).
- **Cline:** a fixed list sent as `--thinking`, because Cline 3.0.74 has no
  ACP effort option (`cline.ts:117-119`). So each change needs a new
  process.
- **OpenCode** names a model's levels only after that model is selected. So
  the probe selects each model in turn, with a budget of 8 s
  (`opencode-probe.ts:14`, `:111-119`).
- **Kimi and Qwen:** no reasoning choice (`kimi.ts:539-585`,
  `qwen.ts:208-240`).
- **Pi** (not ACP) maps `none` to `off` and `ultra` to `max`
  (`server/drivers/pi.ts:77-79`).

### 3.6 Flow: keys and the environment of the engine process

1. The core starts from the environment of the server, then adds the
   instance's own environment (`core.ts:333-337`).
2. It deletes each key of `PROVIDER_CREDENTIAL_ENV` and
   `WORKSPACE_CREDENTIAL_ENV` that is not in the adapter's `credentialEnv`,
   from any source (`core.ts:338-343`). The reason in the code: "Foreign
   provider keys would flip billing off the CLI's login".
3. The adapter's `transformEnv` runs last (`core.ts:344`).
4. The server puts saved keys into the environment of an instance by the
   driver name (`server/config.ts:1106-1131`): `DEEPSEEK_API_KEY` only for
   `deepseekAgent`, and `OPENCODE_API_KEY` with the provider keys only for
   `opencodeGo`.

Edge cases:

- **The custom engine** has no `credentialEnv`. So a provider key that the
  person puts in the custom instance's own environment is deleted too
  (`core.ts:333-343`, `custom.ts:18-34`). No test covers this case
  (`custom.test.ts:111-122` tests only a key of the server).
- **OpenCode provider keys.** The person can save up to 20 keys by their
  env name (`server/config.ts:820-864`). The name must end in `_API_KEY`,
  `_KEY` or `_TOKEN`. Names of the app and of other engines are refused.
  OpenCode reads ten provider keys from the server environment
  (`server/credential-env.ts:100-112`). On a Cloud home, a hosted team, a
  managed desktop or an open sign-in list, the adapter removes those keys
  unless the instance set them itself, "where every bot would bill the
  operator's key" (`opencode-go.ts:322-355`).
- **Where the keys are stored.** On the desktop, the main OpenCode key and
  the DeepSeek key go to the OS store, and `config.json` gets an empty value
  (`server/routes/config.ts:596`, `:601`). The OpenCode provider keys stay
  as plain text in `config.json`. The UI saves them with a plain
  `PUT /api/config` (`src/components/keys/KeyPanels.tsx:23`), and
  `electron/` has no `providerKeys`.
- **The status shows** `{configured, last4}` and the names of the provider
  keys, to admins only (`server/index.ts:11585`, `server/key-hint.ts:4-15`).
  The old plan said only `configured`
  (`docs/plans/opencode-go-integration.md:114-115`).

### 3.7 Flow: usage limits

#### 3.7.1 The scope of a limit

1. The core sees a usage limit through `acpUsageLimit` or a quota code with
   limit words. It calls the adapter's `limitFacts`, or uses
   `{limit: "engine"}` (`core.ts:1384`).
2. `modelControls.usageLimit` maps the engine's model ids back to the
   picker's ids (`session-model-controls.ts:71-82`).
3. **OpenCode** (`opencode-go.ts:776-795`):
   - A free-model limit holds that model and the free models of the same
     provider that the list offers. The paid models stay.
   - Another limit on an `opencode-go/` model holds all Go models.
   - Any other limit holds the engine.
   The hold uses the model that the engine reported at the start of the
   turn, not the saved id (`opencode-acknowledged-holds.test.ts:43-53`).
   A sibling model is held only when its current price is confirmed free
   (`opencode-price-holds.test.ts:218-271`).
4. **Cline** reads "reached your ... limit" and the time to the reset, and
   adds one minute because "Cline rounds the wait down"
   (`cline.ts:64-87`). A ClinePass limit holds only the ClinePass models
   and the default, so the free models keep running (`:183-187`).
5. **Copilot** gives "Check its Copilot plan and premium request
   allowance", with no reset time (`copilot.ts:175-178`).
6. **The others** hold the whole engine.

Doc drift: `docs/opencode-go.md:72-74` says that a Go limit holds the whole
account. The code holds only the Go models (`opencode-go.ts:782-787`).

#### 3.7.2 Signed out or out of credit

ACP engines stop a turn as `auth_required` for an account with no credit or
no plan too. The host counts such a stop as a sign-out only when the error
words are not about credits or quota (`server/host/limit-takeover.ts:89-93`).
The tests use the words of the steering engine
(`limit-takeover.test.ts:572-579`). So a change of words in a CLI changes
the result.

The backup engine (v0.1.166, v0.1.175) is in
[`recovery-and-pausing.md`](recovery-and-pausing.md). For ACP engines, two
facts:

- The backup's model must be in its list (`limit-takeover.ts:190`). Pi
  returns an empty list after 15 s (`server/drivers/pi.ts:212`). Whether
  that empty list replaces the stored list of Pi is not traced (section
  9.1).
- The backup gets the chosen effort or variant only if it offers it
  (`limit-takeover.ts:205`; `limit-takeover.test.ts:73-100`).

#### 3.7.3 The retry at 128 tools

[`turn-limits.md`](turn-limits.md) (P130) has the retry. The data of each
engine:

- `engineTools` is the number of the engine's own tools. OpenCode says 24,
  because "OpenCode 1.18.27's build agent lists 13 tools of its own". All
  others use the core default 32 (`opencode-go.ts:708-709`, `core.ts:893`).
- The MCP budget is `max(0, limit - engineTools)`
  (`server/tool-count-limit.ts:117-120`).
- The app learns the limit from the English words of the refusal
  (`server/tool-count-limit.ts:55-80`). It keeps it for each instance and
  model, in memory, 500 at most, until the server stops (`:82-98`).
- `server/drivers/agents-tool-limit.ts` is not the tool count. It is a
  time limit of 960 s for one tool call. Only Codex and Pi use it
  (`agents-tool-limit.ts:4`; P134).

#### 3.7.4 The usage meter of OpenCode Go

1. The app reads `https://opencode.ai/zen/go/v1/usage` with an 8 s limit
   (`server/plan-usage.ts:114`, `:129-130`).
2. The credential order is the saved key, `OPENCODE_AUTH_CONTENT`, then
   `auth.json`. OpenCode 2 keeps its logins in its own database, so only
   the saved key works there (`:857-883`).
3. 403 means a key without Go. The app shows an OK row with no plan
   (`:1032-1033`).
4. With no key and no login there is no row (`:914-922`).
5. The rolling window goes into the slot of a 5-hour window, the weekly one
   into `weekly`, and the monthly one into an extra line (`:239-258`).

### 3.8 Flow: a quiet engine

The timers of all ACP engines are in [`turn-limits.md`](turn-limits.md) and
[`engine-process-lifecycle.md`](engine-process-lifecycle.md). The parts
that differ by engine:

1. A driver with `statusLog {path, parse, shared?}` lets the app read the
   engine's log while ACP is quiet (`core.ts:215`). Only OpenCode (one log
   for all processes) and Qwen (one debug log for each session) have one
   (`opencode-go.ts:692`, `qwen.ts:239`).
2. Qwen needs `QWEN_DEBUG_LOG_FILE=1`, because "Qwen says nothing over ACP
   while it retries or compresses" (`qwen.ts:235-238`).
3. The stop of a turn that waits out a usage limit, after 2 minutes, needs
   a signal from that log (`quiet-status.ts:348`). The watch sets that
   signal only from lines of the log (`quiet-watch.ts:23-49`). So an engine
   with no log that waits in silence gets the 5-minute stop of an engine
   with no open request and no CPU use (`quiet-status.ts:323-326`), or the
   15-minute guard (`:14-23`). It waits 5 minutes, not 2.
4. OpenCode 1.18.27 sleeps the whole retry-after of a provider (5 hours,
   five times) and sends nothing (`opencode-go.test.ts:1017-1037`). This was
   the case that led to v0.1.132 (commit `b3eefc4f2`).
5. Discovery and probes have their own limits: OpenCode probe 20 s,
   reasoning survey 8 s, `models --verbose` 20 s, refresh 75 s, Venice list
   10 s, DeepSeek discovery 60 s, Cline list 3 s, Copilot sign-in wait 3 s,
   steering engine sign-in 8 s, Pi list 15 s.

### 3.9 Each engine: what the matrix does not say

#### 3.9.1 OpenCode

- **Error classes** come from codes first, then from English words in a
  `-32603 APIError` (`opencode-go.ts:765-814`). "Rate limit exceeded" is not
  a quota, because OpenCode retries a 429 itself (`:769`). "User not found."
  is how OpenRouter refuses an unknown key (`:772-773`).
- **A prompt that never reached a model** (`ECONNREFUSED`,
  `provider.no-route`) can run again on another engine with no risk of a
  double action (`opencode-unreached.ts:10-19`).
- **Account texts** name the provider (Zen, Go, other) and the place
  (Cloud or local). They have at most 160 characters, because
  `server/index.ts` keeps only the first 160 characters of a chat error
  (`opencode-go.ts:617-645`; `opencode-go.test.ts:538-553`).
- **Permissions.** With Full access, `OPENCODE_PERMISSION` allows 17 names
  one by one, because "a wildcard alone leaves OpenCode's more-specific
  external-directory and read rules in place" (`opencode-go.ts:727-732`).
  Otherwise only the attachments folder and the bot's own folder are open
  outside the working folder (`:492-501`, `:586-615`).
- **The pinned build** is version 2.3.2, with a SHA-256 for each of eight
  platforms, and `OPENCODE_DISABLE_AUTOUPDATE=1` for the app's own copy
  (`opencode-release.ts:14-47`). Old programs of 1.x and 2.2.5 stay usable
  (`:26-37`).
- **The person's config (v0.1.170).** The adapter sets
  `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1` (`opencode-go.ts:715-718`, commit
  `c29e9bf51`). It does not set `OPENCODE_DISABLE_CLAUDE_CODE`, because that
  also drops the `.claude/skills` folders where the app puts bot skills.
  The person's global OpenCode config, plugins and MCP servers still load
  (`opencode-go.ts:560-581`; `opencode-probe.ts:162-163`).
- **The test of v0.1.170** checks only the env var, not that the person's
  `CLAUDE.md` stays unread (`opencode-go.test.ts:412-422`).

#### 3.9.2 DeepSeek Harness

- **The approval plugin** is code that runs inside `dsh`
  (`dsh-approval-plugin.ts:26-140`). The adapter writes it to
  `<DATA_DIR>/engines/dsh/` and loads it with `--patch` only for
  `dsh >= 0.2.2-rc.2` (`deepseek.ts:315-379`):
  1. It sets the `workspace-write` sandbox in every mode, Full access too
     (`dsh-approval-plugin.ts:32-34`).
  2. In "Approve for me", it adds the bot's memory folder as writable
     (`:35-39`, `:56-61`). It asks the session's own model to review each
     request to leave the sandbox (`:63-80`).
  3. Its parse of the answer is strict (`:82-136`). A deny, a parse
     failure or an error goes to the person's card (`:44-49`).
  4. The policy text is adapted from DeepSeek Harness (MIT)
     (`dsh-approval-plugin.ts:138`). A port needs a `NOTICE` credit. The
     policy text names the data folder of the reference product (`:15`),
     so a port must not copy that name.
- **The pin is below the plugin.** The app installs `0.2.2-rc.1`
  (`server/engine-versions.ts:37`). So the copy that the app installs never
  loads the plugin (`deepseek.test.ts:251-258`). The UI still offers
  "Approve for me" by the driver name
  (`packages/phone-protocol/src/approval-mode.ts:41-46`;
  `server/runtime/level.ts:16-18`). Without the plugin, `dsh` asks the
  person for each escalation (`docs/approval-levels.md:400`), so the
  result is not unsafe.
- **The version check** runs `dsh --version` before each start
  (`deepseek.ts:362-373`; `server/cli-version-probe.ts:15-30`).
- **Permission cards.** `dsh` sends only the call id in the request. The
  adapter builds the card from the tool-call updates that it recorded
  (`deepseek.ts:380-399`).
- **Minimum Node** is 24.9.0 (`deepseek.ts:342-343`).
- **The keyless text** says "Settings → AI → Providers" (`deepseek.ts:347`).
  The key rows are under "Other services" (`shared/settings-places.ts:54`).
  The engine card can show a key row too, so the text may be right.
- **One DeepSeek key** serves the engine and the voice feature
  (`src/components/keys/key-catalog.ts:120-122`). The key has no test.
- **Plan against code.** The plan of 2026-10-22 shipped in its core. The
  key check, the keyless text and the key row changed shape. The approval
  plugin, the restart when tools change, the Node minimum and the Windows
  `dsh.cmd` parse came later. The fake `fake-dsh-cli.ts` and the real-CLI
  check of task 5 are not in the repository.

#### 3.9.3 Kimi

- The home is `$KIMI_CODE_HOME`, else `~/.kimi-code` (`kimi.ts:21-23`).
- To use a local model, the adapter writes a provider block and a model
  block into the person's `config.toml` (`kimi.ts:402-460`). It sets
  `KIMI_MODEL_*` env vars too, because "ACP `session/new` checks auth
  against `default_model`, not `-m`" (`:462-487`).
- Kimi 0.36+ refuses `openai_legacy` as a wire protocol (`kimi.ts:438`).
- Images are off (no `images` flag).

#### 3.9.4 The steering engine

- It runs the vendor CLI on a subscription login, not on an API key
  (`grok.ts:1-2`). It deletes `XAI_API_KEY`, because "A leaked API key
  silently flips the ... subscription to pay-as-you-go" (`:631-634`).
- The failure words of the login map to five sentences, one of them for a
  CLI that is too old for `--device-auth` (`grok.ts:58-68`).
- Images need `agentVersion` 1.0.25 or later (`grok.ts:255-261`).
- The system text goes in front of the prompt, because
  `--append-system-prompt` does not reach the stdio agent (`grok.ts:655-656`).

#### 3.9.5 Cline

- The adapter reads `providers.json` and never writes it
  (`cline.ts:22-52`; `cline.test.ts:96`).
- A saved key of a non-OAuth provider goes to `CLINE_API_KEY`, "never
  another account's key" (`cline.ts:128-129`).
- A hash of `providers.json` is part of the process contract, so a change
  starts a new process (`cline.ts:131`).
- "No access to ClinePass subscription models" gives a fixed text with a
  link (`cline.ts:89-98`).

#### 3.9.6 Copilot

- The token order is `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`,
  then the stored login (`copilot.ts:23-24`).
- The adapter renames the MCP servers `browser` and `computer`, because
  Copilot refuses those names with HTTP 400 on each turn
  (`copilot.ts:229-243`).
- The login phrases were not taken from the real CLI
  (`docs/verification/copilot-engine.md:93-95`).

#### 3.9.7 Qwen

- Approval levels map to flags of the CLI: Edits to
  `--approval-mode auto-edit`, Auto to `--approval-mode auto` (an LLM
  reviewer), and `fullAuto` to `--yolo`, even at Ask (`qwen.ts:199-206`;
  `qwen-approvals.test.ts:13`).
- To use a local model, the adapter writes a row and the host key into the
  person's `~/.qwen/settings.json` (`qwen.ts:92-150`).
- The settings path ignores `QWEN_HOME`, but the log path uses it
  (`server/env-path.ts:211-219`; `qwen.ts:195`).
- The route id code is adapted from QwenLM/qwen-code `acpModelUtils.ts`
  (Apache-2.0) (`qwen.ts:56-57`). A port needs a `NOTICE` line.
- The free Qwen OAuth route cannot be chosen (`qwen-catalog.test.ts:166-174`).

#### 3.9.8 Custom

- The config is `{"driver": "customAcp", "config": {"cli": "my-agent acp",
  "steer": true}}`. `cli` is a whole command line (`custom.ts:1-7`).
- A blank `cli` gives a hint, not an ENOENT (`custom.ts:15-16`, `:43`,
  `:47`).
- The person's display name replaces "Custom (ACP)" in the texts
  (`custom.ts:48-53`; `custom.test.ts:103-109`).
- Only this engine accepts the legacy ACP model state and
  `session/set_model` (`session-model-controls.ts:12-13`, `:99-110`).

#### 3.9.9 Pi: the shell timeout (not ACP)

1. Pi 1.5 takes the shell `timeout` in seconds, with no default
   (`docs/verification/pi-shell-timeouts.md:3-6`).
2. The app's Pi extension sets 120 s when the call has no timeout. It
   blocks a value outside (0, 900] before the command runs, with the text
   "Shell timeout must be in seconds, greater than 0 and at most 900. Use
   90 for 90 seconds, not 90000." (`server/drivers/pi-mcp-extension.ts:90-91`,
   `:607-615`).
3. Claude Code is different: milliseconds, a 2-minute default and a 24-hour
   cap. There the app adds a hint after a timeout, through a
   `PostToolUseFailure` hook (`server/shell-timeout-hint.ts:3-22`;
   `server/system-prompt.ts:296-300`).
4. A running Pi keeps the extension that it loaded at start
   (`pi-shell-timeouts.md:40-42`).
5. Pi turns run with their own `PI_CODING_AGENT_DIR`. Only `auth.json` (a
   link), `models.json` (a copy) and nine settings keys come from the
   person's folder (`server/drivers/pi-agent-dir.ts:1-19`, `:115-144`,
   commit `4aba61196`, v0.1.175). This is the only allow list of the
   person's files among these engines.

### 3.10 Model lists in data: issue 1688 and the manifest

1. **Issue 1688** asked for Claude Opus 5.5 in the Claude list, with a 1M
   context window, before `claude-opus-5`, with no change of the default
   (`docs/requirements/issue-1688-requirements.md:1-13`). Claude is not an
   ACP engine. The issue matters here for the shape of a model entry.
2. **The first change** (commit `ad3ed7608`, 2026-09-23) added one line to
   `STATIC_CLAUDE_MODELS` in `server/drivers/claude.ts` and a pattern in
   `server/model-context-window.ts`. The design asked for `contextWindow`
   on the row too (`docs/design/issue-1688-design.md:9`). The commit did not
   add it.
3. **Now** the lists of Claude, Cursor, the steering engine, Kimi and
   Antigravity are in `server/model-manifest/model-manifest.json` (commit
   `5f245f96d`, "a new model lands by editing one JSON file"). The rows of
   Opus 5.5 have `contextWindow: 1000000` (`model-manifest.json:25-36`).
4. **A manifest entry** (`server/model-manifest/schema.ts:49-57`): `id` (a
   pattern for each engine, at most 160 characters, not `default`), `name`,
   `aliases?`, `status` (`current` or `legacy`), `contextWindow?`,
   `minCliVersion?`, `variants?`. An engine has `{default, models}`, 1 to
   200 models, no duplicate ids, and a `current` default (`:58-71`). Prices
   are a separate record with a source and dates (`:74-80`, `:95`).
5. **The load** is strict: a bad manifest fails at start
   (`server/model-manifest/bundled.ts:6-7`). Only `current` models are
   offered. A `legacy` model stays valid in a saved bot (`:10-23`).
6. **The context window** is the engine report, then the list's
   `contextWindow`, then the pattern table, then 128,000
   (`server/context-budget.ts:7-13`). ACP discovery never sets
   `contextWindow` (`custom-model-catalog.ts:279-283`). OpenCode 1 gives it
   through `models --verbose` (`opencode-go.ts:142-147`), and Pi through its
   RPC (`server/drivers/pi-catalog.ts:21-29`).
7. **The manifest schema file** credits T3 Code (MIT)
   (`server/model-manifest/schema.ts:1-3`). A port of it needs that credit.

### 3.11 Pointers to other features

- Steering into a running turn, background work after a turn (the OpenCode
  fork and delete, `opencode-background.ts`), warm engines and MCP loading
  (the Cline native MCP file, the Copilot `--additional-mcp-config`, the Pi
  extension): [`engine-turn-lifecycle.md`](engine-turn-lifecycle.md).
- The steering engine's files for steering and signals: `grok.ts:369-414`,
  `:575-606`, `grok-follow-up.ts`, `grok-signals.ts`.
- The backup engine: [`recovery-and-pausing.md`](recovery-and-pausing.md).
- The tool scope of each engine (`shared/tool-scope-support.ts:8`):
  [`tool-selection.md`](tool-selection.md).
- The approval levels of each engine: [`approval-levels.md`](approval-levels.md).

### 3.12 Rules that choose by a driver name

`AGENTS.md` says: "Engine behaviour is gated by capability flags on the
driver, never by a driver's name." The reference has these name checks in
the parts of this feature. P507 and P113 already ask for flags. This list
adds the ones that they do not name.

| Rule | Lines |
|---|---|
| The levels Edits and Custom, and native review | `packages/phone-protocol/src/approval-mode.ts:22-26`, `:41-46` |
| "Shares our workspace" for a backup | `server/workspace.ts:16-18` |
| Keys put into the environment of an instance | `server/config.ts:1106-1131` |
| Model refresh when the provider-key policy changes | `server/index.ts:1386-1392` |
| The list of drivers that take a command allow list | `server/index.ts:1069-1072` |
| The usage meter of a plan | `server/plan-usage.ts:139` |
| The texts of a device sign-in, with Codex as the default | `src/components/DeviceSignIn.tsx:37-44` |
| The xAI key in place of the steering engine's CLI | `src/components/EngineSetup.tsx:40-42` |
| Cline is ready only with an explicit sign-in | `src/components/EngineLibrary.tsx:15-17` |
| Typed model ids | `src/lib/model-choices.ts:37-39` |
| Variants shown as models | `src/lib/model-choices.ts:10-22` |
| Variant labels | `src/components/model-picker-reasoning.ts:9-17` |
| Local models offered | `src/components/local-model-probe.ts:23-26` |
| The tiles of the Cloud page | `src/components/CloudEngineSignIn.tsx:19-48` |
| The key row of an instance (by instance id) | `src/components/keys/key-catalog.ts:289-296` |

## 4. The data

### 4.1 Types

**The adapter, `AcpSupport`** (`server/drivers/acp/core.ts:96-277`). The
fields that this feature uses, by kind:

- Identity and install, data: `driverKind`, `displayName`, `access`,
  `defaultCli`, `nativeSource`, `loginNote`, `install` (command for each OS,
  npm package, docs link, sign-in command, `needsNode`, `settings`,
  `standalone`), `minNodeVersion`, `spawnArgs`.
- Sign-in: `pickAuthMethod` (hook), `authFailure` (enum),
  `isAuthenticated` (hook), `requireAuthenticationBeforeSpawn`,
  `skipAuthenticateWhenAuthenticated` (flags), `deviceSignIn` or
  `browserSignIn` (data records).
- Models: `models` (the fixed list), `resolveModels` (hook),
  `resolveModelsOnCreate` (flag), `selectModel` (data), `fallbackModel`
  (hook), `resolveTurnModel` (hook), `effortLevels` (data),
  `modelVariants` (flag).
- Keys: `credentialEnv` (data), `transformEnv`, `applyTurnEnv` (hooks).
- Limits and errors: `engineTools` (number), `classifyError`, `limitFacts`,
  `describeAccountError`, `promptUnreachedModel` (hooks), `statusLog`
  (path, parser, `shared`).
- Process: `shareProcess`, `restartOnMcpChange`, `resumeMethod`,
  `mcpServersFromLaunch`, `ownMcpOverHttp` (flags), `spawnFingerprint`,
  `buildPromptText` (hooks).

**The selection of a model in a session, `AcpModelSelection`**
(`session-model-controls.ts:8-16`):

| Field | Meaning |
|---|---|
| `configId` | the config id of the model option, mostly `"model"` |
| `agentDefault?` | the passthrough id |
| `allowLegacy?` | accept the legacy `models` state and `session/set_model` |
| `unsetIds?` | ids that a switch confirms by leaving the current value unset |

**A model option** (`server/contracts.ts:543-564`): `id`, `label`,
`custom?`, `loaded?`, `provider?`, `contextWindow?`, `variants?` (each
`{id, label}`, `packages/phone-protocol/src/runtime-events.ts:12-15`),
`effortLevels?`, `orgBlocked?`, `needsCliUpdate?`, `local?`. A list is
`{default, options}`.

**A manifest entry**: section 3.10, item 4.

**The state of a model list, `AcpModelCatalog`** (`model-catalog.ts:5-16`):
`models`, `accountModels` (the ids that the account offers, or null),
`unconfirmed`, `unreadable` (`failed`, `signedOut` or `timedOut`),
`refresh`.

**A saved model choice, `ModelSelection`** (`server/config.ts:252-258`;
`src/state/store.tsx:214-219`): `instanceId`, `model` (at most 500
characters), `effort?` or `variant?`. A variant is not empty, has at most
256 characters, no space at either end and no control character
(`server/contracts.ts:82-86`).

**The live reasoning choices, the event `session.model-variants`**
(`runtime-events.ts:12-20`, `:50`): `{model, variants: {options,
currentValue?}}`.

**The scope of a usage limit** (`opencode-go.ts:782`; `server/contracts.ts:63-79`):
`{limit: "engine" | "model", limitModels?: string[]}`. A refusal of a turn
has the scope `engine`, `model` or `credits`.

**The discovery options, `AcpDiscoveryOptions`**
(`custom-model-catalog.ts:20-48`): section 3.3.2.

**An engine entry of the default fleet** (`server/instance-fleets.ts:27-57`):
only `{driver}`. The ids are `opencodeGo`, `deepseek`, `kimi`,
`githubCopilot`, `qwen`, `cline`, `pi`, `omp`, the steering engine and
others. The custom engine has no entry. An instance has
`{driver, displayName?, environment?, enabled?, hidden?, access?, config?}`.
`config` has no type for each driver (`server/config.ts:237-250`).

### 4.2 Limits and constants

| Value | Number | Lines |
|---|---|---|
| Discovery: one request, all, output, one line, models | 8 s, 60 s, 8 MiB, 1 MiB, 128 | `custom-model-catalog.ts:12-16` |
| Discovery: length of an id or a label | 200 characters | `custom-model-catalog.ts:103`, `:111` |
| Startup model cache is fresh | 6 hours | `server/startup-model-catalog.ts:14` |
| OpenCode probe, reasoning survey | 20 s, 8 s | `opencode-probe.ts:13-14` |
| OpenCode `models --verbose`, `models --refresh`, wait for self-refresh | 20 s, 75 s, 10 s | `opencode-go.ts:199`, `:217`, `:60-61` |
| OpenCode "can run" answer kept | 30 s | `opencode-go.ts:59` |
| OpenCode scheduled refresh, check | 3 hours, 10 minutes | `opencode-model-refresh.ts:35-36` |
| Venice list: time, size, models | 10 s, 4 MB, 2000 | `opencode-model-refresh.ts:37-39` |
| OpenCode provider keys | 20. Name `^[A-Z][A-Z0-9_]{0,59}_(?:API_KEY\|KEY\|TOKEN)$`. Value 1 to 4096 printable characters | `server/config.ts:820-822` |
| OpenCode own tools | 24 (default 32) | `opencode-go.ts:709`; `core.ts:893` |
| OpenCode account text | at most 160 characters | `opencode-go.test.ts:538-553` |
| OpenCode Go usage request | 8 s | `server/plan-usage.ts:114` |
| DeepSeek discovery | 60 s, env override, survey up to 128 models | `deepseek.ts:184-196` |
| DeepSeek kill grace | 1 s | `deepseek.ts:227` |
| Steering engine sign-in probe: time, fresh | 8 s, 5 minutes | `grok-sign-in.ts:36-62` |
| Steering engine live effort switch | 15 s | `grok.ts:477` |
| Copilot sign-in: signed in, signed out, not proven, wait | 5 minutes, 60 s, 15 s, 3 s | `copilot.ts:25-31` |
| Copilot discovery exit grace | 2 s | `copilot.ts:90-92` |
| Cline list fetch | 3 s | `cline-models.ts:7` |
| Cline `providers.json` | 256 KiB | `cline.ts:32` |
| Cline reset time | plus 60 s | `cline.ts:76-77` |
| Kimi device code | 600 s printed, CLI stops at 900 s | `kimi-device-auth.test.ts:35`; `kimi.ts:74-75` |
| Device sign-in controller | 15 minutes | `server/drivers/device-auth.ts:140-141` |
| Learned tool limits | 500 in memory | `server/tool-count-limit.ts:82` |
| Tool-limit value accepted | 1 to 10,000 | `server/tool-count-limit.ts:79` |
| Model hold of a usage limit | at most 6 hours | `server/host/limit-takeover.ts:28` |
| Usage-limit wait stop, no-signs stop | 2 minutes, 5 minutes | `server/drivers/engine-errors.ts:14`; `quiet-status.ts:325` |
| Pi shell timeout | default 120 s, maximum 900 s | `pi-mcp-extension.ts:90-91` |
| Pi model list | 15 s, then an empty list | `server/drivers/pi.ts:212` |
| Manifest: models of one engine, aliases, context window | 1 to 200, 20, 100,000,000 | `server/model-manifest/schema.ts:49-71` |
| Context window default | 128,000 | `server/context-budget.ts:7-13` |

### 4.3 Environment variables

| Variable | Engine | What |
|---|---|---|
| `OPENCODE_API_KEY` | OpenCode | The main key. The server env wins over the file (`server/config.ts:738-739`) |
| `OPENCODE_CONFIG_CONTENT` | OpenCode | Declares typed models and Venice models (`opencode-typed-model.ts:7-29`) |
| `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1` | OpenCode | Keeps out the person's Claude instructions (`opencode-go.ts:718`) |
| `OPENCODE_DISABLE_PROJECT_CONFIG=1` | OpenCode | Only in folders that the app owns (`opencode-go.ts:722`) |
| `OPENCODE_DISABLE_MODELS_FETCH=1` | OpenCode | During a list read that does not refresh (`opencode-go.ts:251-252`) |
| `OPENCODE_DISABLE_AUTOUPDATE=1` | OpenCode | Only for the app's own copy (`opencode-release.ts:24-25`) |
| `OPENCODE_PERMISSION` | OpenCode | The permission rules of a turn (`opencode-go.ts:727-732`) |
| `OPENCODE_AUTH_CONTENT` | OpenCode | A login given as text (`opencode-go.ts:450`) |
| `DEEPSEEK_API_KEY`, `DSH_HOME` | DeepSeek | The key and the home (`deepseek.ts:77-128`, `:400`) |
| `KIMI_CODE_HOME`, `KIMI_MODEL_*` | Kimi | The home, and a local model (`kimi.ts:21-23`, `:462-487`) |
| `XAI_API_KEY` (deleted) | the steering engine | `grok.ts:631-634` |
| `CLINE_API_KEY`, `CLINE_DIR`, `CLINE_DATA_DIR`, `CLINE_PROVIDER_SETTINGS_PATH`, `CLINE_PROVIDER` (renamed) | Cline | `cline.ts:17-31`, `:121-129` |
| `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`, `COPILOT_HOME`, `COPILOT_ALLOW_ALL` (deleted) | Copilot | `copilot.ts:23-24`, `:49-52`, `:200-206` |
| `QWEN_DEBUG_LOG_FILE=1`, `QWEN_HOME`, `QWEN_RUNTIME_DIR` | Qwen | `qwen.ts:190-197`, `:235-238` |
| `PI_CODING_AGENT_DIR` | Pi | The app's own agent folder (`server/drivers/pi-agent-dir.ts:115-144`) |

### 4.4 Files on disk

| File | Owner | Written by the app |
|---|---|---|
| `DATA_DIR/providers/engine-models/<instanceId>.json` | the app | The startup model cache (`server/startup-model-catalog.ts:18-21`) |
| `DATA_DIR/providers/opencode/live-models.json` | the app | The Venice list. Atomic, errors ignored (`opencode-model-refresh.ts:41-74`) |
| `DATA_DIR/providers/opencode/discovery/` | the app | A git folder for probes, with a ledger of probe sessions (`opencode-probe.ts:84-158`) |
| `DATA_DIR/engines/dsh/approval-preset.mjs` and two patch files | the app | Atomic, only when changed (`deepseek.ts:319-335`) |
| `~/.config/opencode/opencode.json` | the person | A local model. No file mode. A file that does not parse is lost (`opencode-go.ts:361-418`) |
| `~/.<steering>/config.toml` | the person | A local model, with its API key. No file mode (`grok.ts:187-253`) |
| `~/.kimi-code/config.toml` | the person | A local model, with its API key. No file mode (`kimi.ts:402-460`) |
| `~/.qwen/settings.json` | the person | A local model and the host key. Mode 0600. A file that does not parse is lost (`qwen.ts:92-150`) |
| `<tmp>/<p>-cline-mcp-*/<hash>.json` | the app | MCP servers for one thread, mode 0600 (`cline.ts:195-215`) |
| `<tmp>/<p>-copilot-mcp-*/<hash>.json` | the app | MCP servers for one thread, mode 0600 (`copilot.ts:250-264`) |
| `server/model-manifest/model-manifest.json` | the code | The fixed lists of five engines |

## 5. The UI

[`engines-and-accounts.md`](engines-and-accounts.md) section 5 has the
views and texts of the set-up card, the engine library and the key rows.
This section adds only what differs by engine, and how the window decides.

### 5.1 The set-up card (`src/components/EngineSetup.tsx`)

- **The sign-in widget** comes from the server field
  `authentication.method`: device code, browser, browser with PKCE, or a
  pasted code (`EngineSetup.tsx:687-690`, `:777-790`). This is a flag from
  the server.
- **The texts of a device sign-in** come from the driver name. An unknown
  driver gets the Codex texts (`src/components/DeviceSignIn.tsx:37-44`). A
  test relies on this with a fake driver kind (`EngineSetup.test.ts:287`).
- **"Prefer a terminal?"** shows `install.signInCommand` for device-code
  engines that are not Codex (`EngineSetup.tsx:782-787`).
- **The steering engine** with no CLI and no terminal of the server shows
  an xAI key row instead (`EngineSetup.tsx:40-42`, `:590-603`).
- **A key engine** (`access === "api"`) that is available but not signed in
  shows "The provider rejected the saved key." (`EngineSetup.tsx:623-627`;
  `src/locales/en.json:3881`). DeepSeek Harness has its own CLI, so it is
  only "no key yet", not "rejected" (`:623-624`).
- **The model list notes** come from `modelsUnconfirmed` and
  `modelsUnreadable` (`EngineSetup.tsx:572-585`). The texts
  (`src/locales/en.json:3444-3447`):
  - "{name} hasn't listed its models yet. These may be out of date."
  - "{name}'s model list could not be read. These may be out of date."
  - "{name} isn't signed in, so its model list could not be read."
  - "{name} took too long to list its models. These may be out of date."
- **Install.** After `POST /api/instances/{id}/install`, an engine that is
  still not available gives "The installer finished, but the provider is
  not usable yet." (`EngineSetup.tsx:173-179`). When another copy of
  OpenCode does not start, the card says that OpenCode now uses the copy
  that the app installed (`EngineSetup.refresh.test.ts:81-92`).
- **No time limit** on the calls of install and sign-in
  (`EngineSetup.tsx:173`, `:404`, `:417`). P503 has this.

### 5.2 The model picker (`src/components/ModelPicker.tsx`)

- **Effort row or variant row.** The flag `capabilities.modelVariants`
  shows a variant row in place of the effort row (`ModelPicker.tsx:72-74`).
  The effort levels come from `offeredEffortLevels` (section 3.5).
  "Default" and "None" stay two choices (`:50-53`).
- **Variant states.** A saved variant that is not in the list shows
  "Saved variant is unavailable. Choose another or use the session
  setting." when the engine reported its list, else "Saved variant has not
  been checked in this session." (`ModelPicker.tsx:135-136`;
  `src/locales/en.json:3641-3642`). "Use session setting" leaves the
  variant unset.
- **Variant labels.** OpenCode's `default` shows as "OpenCode default".
  The chat engine has fixed labels for its ids
  (`model-picker-reasoning.ts:9-17`). Every other engine shows the label
  of the engine.
- **Refresh.** When `modelsUnconfirmed` is true, opening the picker calls
  `POST /api/instances/{id}/refresh-models` (`ModelPicker.tsx:345-348`;
  `src/state/store.tsx:3214-3219`; `src/lib/engine-rail.ts:17-22`).
  Errors are not shown (`ModelPicker.tsx:338`).
- **Five models** show first, then "Show all" (`ModelPicker.tsx:43`,
  `:825-836`). A search field shows with more than five models or for
  OpenCode, which takes a typed `provider/model` id
  (`ModelPicker.tsx:789-799`; `src/lib/model-choices.ts:37-55`).
- **States.** "Loading {name} models…", "No model providers are
  available.", "No local models found", "Setup required", "Sign-in
  required", "{count} models will appear after setup."
  (`src/locales/en.json:3415-3416`, `:3598-3608`).
- **A switch of engine** can ask to drop the level to Ask: "Switch model
  with Ask permissions?" (`ModelPicker.tsx:454-478`, `:995-1014`;
  `src/locales/en.json:3426`). The rule is a list of driver names
  (`approval-mode.ts:33-39`).
- **While the bot works,** the picker is locked, except for the reasoning
  row (`model-picker-reasoning.ts:37-45`).

### 5.3 Keys (`src/components/keys/`)

- The key catalog is data: one record for each key with its env name,
  placeholder, link, pattern, test and config patch
  (`key-catalog.ts:29-71`, `:86-220`).
- The OpenCode key writes `opencodeGo.apiKey`. It has no test and no
  pattern (`key-catalog.ts:123-126`). The DeepSeek key has no test
  (`:120-122`).
- **OpenCode provider keys** have their own panel
  (`KeyPanels.tsx:11-105`): "write-only" (a code comment): the server returns names, never keys, and
  gives the keys only to OpenCode. The name is upper-cased.
  The value must have no space. A remove sends `""`. The hint: "Save a key
  for any provider OpenCode supports, under the name OpenCode reads it
  from, such as VENICE_API_KEY for Venice." (`src/locales/en.json:4204`).
- **The key row of an engine** is found by the instance id
  (`key-catalog.ts:289-296`). So a second instance of the same engine has
  no key row.

### 5.4 The Cloud first page (`src/components/CloudEngineSignIn.tsx`)

- The tiles are a fixed list: Claude and Codex always, OpenCode when an
  instance exists ("Free models, no account needed."), the steering engine
  only when available (`CloudEngineSignIn.tsx:19-48`;
  `src/locales/en.json:1749`).
- OpenCode shows before it is installed, because "The server installs
  OpenCode's own build here" (`CloudEngineSignIn.tsx:41-44`).
- An engine that runs on a key says "Runs on your API key."
  (`CloudEngineSignIn.tsx:64-65`).

## 6. The tests

### 6.1 How the tests are built

- Most driver tests run the real adapter against the shared fake ACP CLI
  `server/testing/fake-acp-cli.ts`. Env vars choose its behaviour, for
  example `FAKE_ACP_MODELS`, `FAKE_ACP_MODEL_STICKS`,
  `FAKE_ACP_TOOL_LIMIT`, `FAKE_ACP_EXIT_ON_MODEL` and
  `FAKE_ACP_REJECT_LIVE_LOAD_DSH` (`opencode-refresh.test.ts:36-50`;
  `kimi-model-selection.test.ts:66-76`; `server/testing/fake-acp-cli.ts:6`).
- Discovery tests write a small `.mjs` fake for each test, with `HOME` set
  to a temporary folder (`custom-model-catalog.test.ts:24-77`).
- DeepSeek discovery uses an inline fake `dsh` (`deepseek.test.ts:376-417`).
- The approval plugin is imported from a temporary file and driven with a
  fake context (`dsh-approval-plugin.test.ts:21-72`).
- Recorded vendor texts with versions are test data: OpenCode 1.18.27 and
  2.0.20 errors (`opencode-go.test.ts:429-445`), the steering engine CLI
  1.0.25 sign-in words (`grok-sign-in.test.ts:33-46`), Kimi 2.4.1 device
  output (`kimi-device-auth.test.ts:30-38`), Claude Code 2.1.296 timeout
  text (`shell-timeout-hint.test.ts:5-6`).

### 6.2 What the tests guarantee

- A failed or empty model read keeps the old list (`model-catalog.test.ts:44-69`.
  `custom-model-catalog.test.ts:128-131`).
- A read cut short keeps all models and the old variants, and is read
  again at the next start (`model-catalog.test.ts:25-42`).
- `signedOut` comes only from the engine's classifier
  (`custom-model-catalog.test.ts:282-288`).
- Hostile ids and labels from an engine never pass
  (`custom-model-catalog.test.ts:190-223`).
- A switch that the engine does not confirm sends no prompt
  (`kimi-model-selection.test.ts:66-76`; `qwen-catalog.test.ts:226-250`;
  `session-model-controls.test.ts:50-54`).
- A retired model falls back with one notice for each session, or keeps
  the model when the adapter has no fallback
  (`session-model-controls.test.ts:143-149`; `copilot.test.ts:380-386`).
- A model added after the process started fails the turn, and the next
  turn starts a new process (`deepseek.test.ts:536-548`;
  `opencode-go.test.ts:1143-1155`).
- A variant that the model does not offer fails before the prompt
  (`opencode-go.test.ts:1463-1468`). Two conversations keep their own
  variants (`:1528-1545`).
- The retry at 128 tools runs once, then fails with a plain message
  (`opencode-cloud.test.ts:99-140`).
- The OpenCode limit scope holds only the right models
  (`opencode-go.test.ts:497-527`; `opencode-price-holds.test.ts:218-271`).
- Copilot's sign-in probe shares one call, and times out to the last
  answer (`copilot.test.ts:134-191`).
- The steering engine's sign-in fails open, and a second "signed out" is
  needed (`grok-sign-in.test.ts:62-74`).
- Each provider key of the server is removed from a custom engine
  (`custom.test.ts:111-122`).
- The DeepSeek plugin goes to a person's card for every deny or failure,
  exactly one time (`dsh-approval-plugin.test.ts:172-213`).

### 6.3 What the tests do not cover

- That the person's `CLAUDE.md` stays unread by OpenCode. The test checks
  only the env var (`opencode-go.test.ts:412-422`).
- A key in the custom instance's own environment (section 3.6).
- That the pinned DeepSeek version meets the plugin minimum.
- Copilot's login phrases against the real CLI
  (`docs/verification/copilot-engine.md:93-95`).
- The 2-minute usage-limit stop for an engine with no status log.
- That `docs/opencode-go.md` agrees with the Go limit scope.
- The DeepSeek keyless text against the real place of the key row.

## 7. Ours compared

What we have now: `bot-engine` has only `lib.rs`. `bot-protocol` has
`event.rs`, `ids.rs` and `message.rs`. The plan has the registry in step 4
and the ACP driver in step 9, with the custom adapter first (P102). We have
no model list type, no reasoning type and no adapter record yet.

| Part of the reference | Reference files | Our crate and module | Step | State |
|---|---|---|---|---|
| The adapter record and its flags | `server/drivers/acp/core.ts:96-277`, `capabilities.ts`, `driver-hooks.ts` | `bot-engine`, `acp/adapter.rs` | 9 | Not planned (P609) |
| The model option and list | `server/contracts.ts:543-564` | `bot-protocol`, `model.rs` | 4 | Not planned (P610) |
| The model manifest and its schema | `server/model-manifest/` | `bot-engine`, `models/manifest.rs`, and a JSON file in the crate | 4 | Not planned (P610) |
| The live state of a model list, the startup cache | `model-catalog.ts`, `server/startup-model-catalog.ts` | `bot-engine`, `models/catalog.rs` | 4, 9 | Not planned (P611) |
| Discovery | `custom-model-catalog.ts`, `config-options.ts` | `bot-engine`, `acp/discovery.rs` | 9, a later PR (P102) | Not planned (P621) |
| The selection channel and its check | `session-model-controls.ts` | `bot-engine`, `acp/model_select.rs` | 9 | Not planned (P612) |
| Reasoning: effort or variant | `server/config.ts:252-258`, `effort-levels.ts`, `member-turn.ts` | `bot-protocol`, `model.rs` | 4 | Not planned (P613) |
| The keys of the engine process | `core.ts:333-343`, `server/credential-env.ts` | `bot-engine`, `acp/env.rs` | 9 | P61, P508 |
| Usage-limit scope | `limitFacts` in each adapter, `session-model-controls.ts:71-82` | `bot-protocol` (the type), `bot-engine` (each adapter) | later | P470 (P614) |
| The retry at 128 tools | `server/tool-count-limit.ts`, `core.ts:889-893` | `bot-engine`, `acp/tool_limit.rs` | 9 | P130 (P620) |
| The status log | `quiet-status.ts`, `quiet-watch.ts` | `bot-engine`, `acp/quiet.rs` | 9 | Not planned (P615) |
| The DeepSeek plugin and version gate | `deepseek.ts:315-379`, `dsh-approval-plugin.ts` | none | none | Out of plan (P616 for the rule) |
| The OpenCode adapter | `opencode-*.ts` | `bot-engine`, `acp/adapters/opencode.rs` | later | Not planned |
| The set-up card, picker and key panels | `src/components/EngineSetup.tsx`, `ModelPicker.tsx`, `keys/` | `bot-desktop`, `ui/src/features/` | 7, later | Step 7 has one key field |
| The Pi shell timeout | `server/drivers/pi-mcp-extension.ts:607-615` | none | none | Out of plan (P624) |

Where we differ by design:

1. We have no HTTP routes (D10). The routes that save a variant or refresh
   a model list become Tauri commands.
2. We have one person (D10). The OpenCode rule that removes provider keys
   on a Cloud home or a hosted team (`opencode-go.ts:322-355`) has no use.
3. Our adapters take no driver name in any rule (`AGENTS.md`). Section 3.12
   lists the rules that we must turn into flags.

## 8. Where we can be better

Each proposal is T-numbered. The main session gives the P-numbers. A
proposal that is better than the reference starts with "Problem in the
reference:", or says that it is a judgment call. A proposal that only
follows the reference says so.

### 8.1 The proposals

- **P609 (decision and plan, step 9, `bot-engine`). An ACP adapter is one
  record of data, a small set of capability flags, and a few named
  hooks.** Follows the reference: `AcpSupport` is such a record
  (`core.ts:96-277`). The flags of our first version, from the matrix of
  section 3.1: the kind of sign-in check, `auth_failure` (three values),
  `refuse_before_spawn`, the model source, `read_models_at_create`, the
  selection channel, `model_variants`, the effort channel, the fallback
  policy, `restart_on_tool_change`, `resume_method`, the system text
  place, and the status log. The data: the static list, `credential_env`,
  `engine_tools`, the limits and the texts. The hooks: the sign-in check,
  the error classifier and the limit scope. Better, a judgment call: the
  record is a Rust struct with enums, so a flag with three values cannot
  hold a fourth. Source: section 3.1, `capabilities.ts:4-23`,
  `driver-hooks.ts:9-63`.
- **P610 (plan, step 4, `bot-protocol` and `bot-engine`). The model list is
  data in one JSON file with a schema, and each entry has its context
  window.** Follows the reference at `42f86aefd`: the model manifest with
  `id`, `name`, `aliases`, `status`, `contextWindow`, `minCliVersion` and
  `variants`, a strict load that fails at start, and only `current` models
  offered (`server/model-manifest/schema.ts:49-71`; `bundled.ts:6-23`).
  The context window order follows `server/context-budget.ts:7-13`.
  - Better, a judgment call: start with the file. The reference first
    added the model of issue 1688 in code, without the context window on
    the row (commit `ad3ed7608`), and moved the lists to the file later
    (commit `5f245f96d`). That was work done two times.
  - A port of the schema credits T3 Code (MIT) in `NOTICE`
    (`schema.ts:1-3`).
- **P611 (plan, steps 4 and 9, `bot-engine`). The live model list of an
  instance keeps the last good list, says why it may be old, and reads a
  sign-out only from the driver's classifier.** Follows the reference
  (`model-catalog.ts:35-54`; `custom-model-catalog.ts:72-77`). A failed or
  empty read keeps the list. It marks the list `Unconfirmed { reason }`,
  with `Failed`, `SignedOut` or `TimedOut`. The startup cache is fresh for
  6 hours. This rule is the reference's answer to "Sign-in to an engine,
  and engine CLIs that change" (v0.1.177, v0.1.178): a brief failure does
  not count as signed out.
  - Better, a judgment call: the list is one value that the instance owns,
    not a module map keyed by the CLI path (P109 has the OpenCode case,
    `opencode-go.ts:55-57`). With one owner, the race of a late read needs
    no generation counter (`opencode-go.ts:665-672`).
- **P612 (plan, step 9, `bot-engine`). The selection channel is one enum,
  and a switch is confirmed before the prompt.** Follows the reference
  (`session-model-controls.ts:93-120`): `Argv`, `SetModel` (legacy) or
  `ConfigOption { config_id, unset_ids, agent_default }`. A switch that the
  engine does not confirm fails the turn with no prompt. A driver states
  what it does with a model that the session no longer offers: `Fallback`
  (with one notice for each session) or `Fail`.
  - Better, a judgment call: the refusal is a typed value with the offered
    models, for every engine. Today only the steering engine names the
    offered models (`grok.ts:156-169`). The others give "did not switch to
    <m> (still <x>)" as a plain `Error` (`session-model-controls.ts:115-118`).
    `AGENTS.md` asks for typed refusals.
- **P613 (plan, step 4, `bot-protocol`, extends the types of step 2). Reasoning is one type:
  `Reasoning::Effort(level)` or `Reasoning::Variant(id)`.** Follows the
  reference in meaning (`server/config.ts:252-258`): effort levels for each
  model with a fallback to the engine, opaque variants from the session,
  and "Default" (send nothing) apart from "None"
  (`effort-levels.ts:10-16`; `ModelPicker.tsx:50-53`).
  - Better, a judgment call: the reference refuses both at once at run
    time, with a 400 at save (`server/index.ts:2562-2576`) and a 409 at the
    turn (`server/member-turn.ts:4-14`). Our type cannot hold both. Also
    check a saved variant against the last list that the engine reported,
    at save time (`server/index.ts:2601-2607` checks only the flag).
  - The effort channel is a flag of the driver. It has three values: a
    config option, a live option with a restart if the engine refuses it
    (the steering engine, `grok.ts:464-484`), or a command-line argument
    that needs a new process (Cline, `cline.ts:117-119`).
- **P614 (new facts for P470 and P500, later step). A driver returns the
  scope of a usage limit as a typed value, and says itself whether a stop
  is a sign-out or a lack of credit.** Follows the reference for the scope
  (`opencode-go.ts:776-795`; `cline.ts:183-187`): `Engine` or
  `Models(Vec<ModelId>)`, keyed to the model that the engine reported.
  - **Problem in the reference:** an ACP `auth_required` stop counts as a
    sign-out unless English words say credits or quota
    (`server/host/limit-takeover.ts:89-93`). A change of words in a CLI
    moves a bot with no credit into the sign-in path, or the reverse. The
    release problem: "Sign-in to an engine, and engine CLIs that change"
    (v0.1.177, v0.1.178), and section 6, "A bot at a usage limit" (v0.1.166,
    v0.1.175).
  - Also: `docs/opencode-go.md:72-74` says a Go limit holds the whole
    account, but the code holds only the Go models (`opencode-go.ts:782-787`).
    A test of the feature page against the code (P121, D19) would find it.
- **P615 (plan, step 9, `bot-engine`, with P133). A driver states if it has a
  status log, and a test shows what each engine gets without one.**
  Follows the reference: the status log is an optional capability with a
  path and a parser (`core.ts:215`; `opencode-go.ts:692`; `qwen.ts:239`).
  A judgment call: the difference is small. With a log, a turn that waits
  out a usage limit in silence stops after 2 minutes. Without a log, it
  stops after 5 minutes, when the engine has no open request and no CPU
  use (`quiet-status.ts:323-326`, `:348`; `quiet-watch.ts:23-49`). This is
  the area of "A turn or a wait that does not end" (v0.1.132). The record
  of the flag lets the window say why a turn stopped late.
- **P616 (new facts for P113, steps 9 and 10). The app offers a feature that
  needs an engine version only when the installed engine has that version.
  A test checks each pinned version against the minimum of each feature.**
  - **Problem in the reference:** the app installs DeepSeek Harness
    `0.2.2-rc.1` (`server/engine-versions.ts:37`). Its approval plugin
    needs `0.2.2-rc.2` (`deepseek.ts:316`). The UI offers "Approve for me"
    by the driver name (`approval-mode.ts:41-46`). So on the app's own
    copy, the promise of the level depends on a version that the app does
    not install. The release problems: "The approval model changed" and
    "Sign-in to an engine, and engine CLIs that change" (v0.1.101).
  - Better: the snapshot of the engine has the features of its version.
    The pin and the feature minimum are data in one place. Also: read the
    version once for each file identity (path, size, time), not before each
    start (`deepseek.ts:362-373`; `server/cli-version-probe.ts:15-30`).
- **P617 (new facts for P19, step 6). All keys of one engine have one place
  of storage.**
  - **Problem in the reference:** on the desktop, the main OpenCode key and
    the DeepSeek key go to the OS store (`server/routes/config.ts:596`,
    `:601`). The OpenCode provider keys stay as plain text in `config.json`
    (`src/components/keys/KeyPanels.tsx:23`; no `providerKeys` in
    `electron/`). The release problem: "A secret or an access right in the
    wrong place" (v0.1.19, v0.1.92).
  - Better: P19 puts every key in the keychain. This adds the provider
    keys of an engine to that rule, and a test that no saved key is in a
    settings file.
- **P618 (new facts for P103, step 9). New facts on writes into the
  person's engine config.**
  - **Problem in the reference:** the OpenCode local-model inject reads
    the person's `opencode.json` with a plain `JSON.parse`. A file with
    comments does not parse, and the app writes `{ $schema }` plus its
    provider over it (`opencode-go.ts:375-380`, `:416`). The JSONC parser of
    the same file is not used there (`:503-530`). The release problem: "A
    file written over after a failed read" (v0.1.103, v0.1.151).
  - Line drift: P103 cites `grok.ts:250`. At `42f86aefd` it is `grok.ts:251`.
- **P619 (new facts for P504, step 9). Pi's agent folder is the model for
  the allow list in the reference itself.** Pi turns run with
  `PI_CODING_AGENT_DIR` in the data folder, and only `auth.json`,
  `models.json` and nine settings keys come from the person's folder
  (`server/drivers/pi-agent-dir.ts:1-19`, `:115-144`).
  - **Problem in the reference:** OpenCode blocks only the Claude
    instructions and the project config of the app's folders. The person's
    global OpenCode config, plugins and MCP servers still load into bot
    turns and into the model probe (`opencode-go.ts:560-581`;
    `opencode-probe.ts:162-163`). Kimi, the steering engine and Qwen read
    the person's own config files (`kimi.ts:494-502`, `grok.ts:95-103`,
    `qwen.ts:22-28`). The release problem: "The person's own engine config
    reaches the bots" (v0.1.104, v0.1.170, v0.1.175).
- **P620 (new facts for P130, step 9). The data of the retry at 128
  tools.** Follows the reference: `engine_tools` is data of each adapter
  (OpenCode 24, default 32), and the learned limit is keyed by instance and
  model (`opencode-go.ts:708-709`; `core.ts:889-893`;
  `server/tool-count-limit.ts:82-98`). Better, a judgment call: keep the
  learned limit in the store with an expiry. The reference forgets it at
  each restart, so the engine refuses the first turn after a restart one
  time again.
- **P621 (plan, step 9, the later discovery PR, `bot-engine`). One
  discovery client and one survey loop.** Follows the limits and the
  security rules of the reference (`custom-model-catalog.ts:12-16`,
  `:99-117`, `:165-171`, `:221-229`, `:303`). Better, a judgment call: the
  reference has three discovery clients (the shared one,
  `opencode-probe.ts:164-286`, `deepseek.ts:202-313`) and two survey loops
  (`custom-model-catalog.ts:251-284`, `config-options.ts:98-121`). One
  client gives one set of limits and one set of tests.
- **P622 (new facts for P507, steps 4, 9 and the UI steps).** Section 3.12
  lists 15 rules that choose by a driver name. P507 and P113 name some of
  them. The new ones: `server/workspace.ts:16-18`,
  `server/config.ts:1106-1131`, `server/index.ts:1386-1392`,
  `server/plan-usage.ts:139`, `src/lib/model-choices.ts:10-22`, `:37-39`,
  `src/components/model-picker-reasoning.ts:9-17`,
  `src/components/local-model-probe.ts:23-26`,
  `src/components/CloudEngineSignIn.tsx:19-48` and
  `src/components/keys/key-catalog.ts:289-296`. A judgment call: the rule
  of `AGENTS.md`. The UI gives Codex texts to an unknown driver
  (`DeviceSignIn.tsx:42`), which is a wrong text, not a failure.
- **P623 (new facts for P503, step 9). A driver maps the words of a failed
  login to a typed outcome.**
  - **Problem in the reference:** the device controller has outcome codes,
    but no ACP adapter sets `failureReason`. So an expired or refused login
    of the steering engine or of Kimi is recorded as `exited`
    (`server/drivers/device-auth.ts:148`; `grok.ts:72-84`; `kimi.ts:84-96`).
    The release problem: "Sign-in to an engine, and engine CLIs that
    change".
- **P624 (later, the Pi step if it comes). The shell timeout of an engine is
  data: its unit, its default and its maximum.** Follows the reference for
  Pi: 120 s, at most 900 s, refused before the command runs
  (`pi-mcp-extension.ts:607-615`). A judgment call: one place for this
  policy, where the reference has two files with two methods (block before
  for Pi, a hint after for Claude Code, `server/shell-timeout-hint.ts:3-22`).
- **P625 (new facts for P508, step 9). A key that the person puts in a
  custom instance's own environment reaches that engine.** A judgment
  call: the reference deletes every listed provider key that is not in
  `credentialEnv`, even one that the person set on the instance on purpose
  (`core.ts:333-343`; `custom.ts:18-34`). A bring-your-own agent often
  needs such a key. Keep the removal of the server's keys.

### 8.2 The problems of `changelog.md` section 5 in this feature

| Problem | What the reference does here | Proposal |
|---|---|---|
| Sign-in to an engine, and engine CLIs that change (v0.1.14, v0.1.54, v0.1.101, v0.1.177, v0.1.178, v0.1.182) | Each adapter pins vendor facts to versions in comments: OpenCode 1.18.27 to 2.3.2, the steering engine CLI 1.0.0 to 1.0.89, Kimi 0.29.1 to 2.5.3, Cline 3.0.70 and 3.0.74, Copilot 1.0.103 and 1.0.105, Qwen 0.24, `dsh` 0.2.1 to 0.2.3. Only the steering engine (images, tool scope) and DeepSeek (plugin) check a version at run time. The brief sign-in failure of v0.1.177 and v0.1.178 is handled by fail-open checks (the steering engine, Copilot) and by "a failed model read is not a sign-out" (`custom-model-catalog.ts:72-77`). Kimi, Cline and DeepSeek still fail closed | P499, P611 (follows the reference), P614, P616, P623 |
| The size of the tool list (v0.1.101) | One retry with smaller MCP lists, learned from the words of the refusal, in memory. `engineTools` 24 for OpenCode, 32 for the others | P130, P620 |
| The person's own engine config reaches the bots (v0.1.170) | OpenCode sets `OPENCODE_DISABLE_CLAUDE_CODE_PROMPT=1`. Its global config, plugins and MCP servers still load. Pi has its own agent folder (v0.1.175) | P103, P504, P618, P619 |
| Usage and cost numbers corrected (v0.1.170) | Not in these files. The OpenCode Go meter reads percent windows, and puts a rolling window into a 5-hour slot (`server/plan-usage.ts:239-258`) | P378 to P383 |
| A turn or a wait that does not end (v0.1.132) | The 2-minute usage-limit stop and the 5-minute no-signs stop came in commit `b3eefc4f2`. The first works only with a status log, so the others wait 5 minutes. Discovery and probes have limits (section 3.8) | P615 (follows the reference) |
| A file written over after a failed read (v0.1.103, v0.1.151) | Qwen and OpenCode write over a config file of the person that does not parse | P103, P618 |
| A secret in the wrong place (v0.1.19, v0.1.92, v0.1.101) | OpenCode provider keys are plain text on the desktop. The steering engine and Kimi write local-model keys into the person's config with no file mode | P19, P103, P617 |
| Section 6: a bot at a usage limit (v0.1.166, v0.1.175) | Three adapters narrow the limit to models. The `auth_required` stop is sorted by words | P614 |

## 9. Not verified

### 9.1 Facts that no subagent confirmed

- The flag table of section 3.1 comes from a grep of `name:` at the start
  of a line. A value set through a spread or a computed object would not
  show.
- Whether a gate above the ACP driver refuses a Kimi turn when the status
  says signed out. Only `core.ts:876-887`, `:1086-1100` and `:1355-1356`
  were read.
- Whether `isAuthenticated` of the steering engine gets an environment
  that `transformEnv` already changed. The probe accepts "You are using
  XAI_API_KEY" as signed in, but turns delete that key
  (`grok-sign-in.ts:10-17`; `grok.ts:632-634`).
- How the core sends the OpenCode `default` variant, and whether it clears
  the override as `docs/verification/opencode-variants.md:17-19` says.
- How the store writes the model choice of a conversation to disk after
  `server/routes/tasks.ts:379`.
- Whether every caller of the usage reader passes `process.env`, so that
  the saved OpenCode key reaches it (`server/plan-usage.ts:264-268`).
- The vendor facts in the header of `deepseek.ts` (`:1-25`), and what `dsh`
  does after the plugin gives a request to the next responder.
- Whether the Providers page shows an inline DeepSeek key row, so that the
  keyless text is right (`src/components/EngineSetup.tsx:553-556`).
- Copilot: the read-only mount of the `@FILE` path on Linux bot boxes and
  the Windows stop timeout (`docs/verification/copilot-engine.md:42-43`,
  `:79-82`). Not in `copilot.ts`.
- The Qwen bearer reuse and the HTTP 401 after a turn
  (`docs/verification/qwen-models.md:28-33`).
- Whether Kimi has a reasoning option over ACP at all. The adapter declares
  none.
- The script files named by the verification documents
  (`scripts/verify-kimi-models.ts`, `scripts/verify-qwen-models.ts`,
  `scripts/verify-pi-shell-timeouts.ts`, the native e2e tests of Cline and
  Copilot, `server/custom-acp-models.e2e.test.ts`).
- `pi-usage.ts`, and how the omp driver differs from Pi.
- Which keys `OPENCODE_PROVIDER_ENV` holds beyond the ten names read at
  `server/credential-env.ts:100-112`.
- Whether `DATA_DIR` is a temporary folder in the test runner. Two test
  files write under it (`deepseek.test.ts:192`;
  `opencode-price-holds.test.ts:30-37`).
- Whether the empty model list of a Pi read that times out replaces the
  stored list, and so makes a chosen Pi backup `unknown-model`.
- Whether leaving Kimi and the steering engine out of the fleet additions
  for an old saved fleet is on purpose (`server/instance-fleets.ts:69-87`).

### 9.2 Lines of the done research files that are now wrong

| File | Says | At `42f86aefd` |
|---|---|---|
| [`acp-adapter.md`](acp-adapter.md) | `driver-hooks.ts:9-59`, 15 hooks | `driver-hooks.ts:9-63`, 16 hooks. The new one is `replyFailure` (`:46-49`) |
| [`acp-adapter.md`](acp-adapter.md) | `authenticateFailed` at `driver-hooks.ts:123-129` | `:127-133` |
| [`acp-adapter.md`](acp-adapter.md) | discovery `custom-model-catalog.ts:125-300`, temp folder `:131`, initialize `:218-226`, `session/new` `:227`, refused requests `:162-167`, `session/delete` `:286`, stop `:82-92` | `:128-310`, `:134`, `:221-229`, `:237`, `:165-171`, `:296`, `:85-95`. Commit `e1f1140f6` added `authMethod` and `authMeta` |
| [`acp-adapter.md`](acp-adapter.md) | `capabilities.ts:4-10` (`EngineCapabilities`), with no folder | Right for `server/runtime/capabilities.ts`. A second file with the same name, `server/drivers/acp/capabilities.ts:4-23`, maps an adapter to its capabilities. Give the full path |
| [`engines-and-accounts.md`](engines-and-accounts.md) | lines of `grok.ts` at `140172d88` | One line later after line 21, three lines later after line 581 (an import, an export rename and `REMOTE_MCP_STARTUP_MS`) |
| [`../../plan/acp-core.md`](../../plan/acp-core.md) (P103) | `grok.ts:250` | `grok.ts:251` |
| [`engine-process-lifecycle.md`](engine-process-lifecycle.md) | section 9: the 5-minute stop of v0.1.132 is "likely" | Commit `b3eefc4f2` (in v0.1.131 to v0.1.132) added `DEFAULT_LIMIT_QUIET_MS = 2 * 60_000` and `DEFAULT_NO_SIGNS_STOP_MS = 5 * 60_000` |
| [`../../comparison.md`](../../comparison.md) | "DeepSeek ... Generic" approval | DeepSeek has its own approval plugin for `dsh >= 0.2.2-rc.2` (`deepseek.ts:315-379`) |
