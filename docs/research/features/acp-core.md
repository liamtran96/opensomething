# Engines that keep a session: the ACP core, its adapters and the fake ACP CLI

Read on 2026-11-24 for step 9 of [`../../plan/README.md`](../../plan/README.md)
(crate `bot-engine`, module `acp`: a generic core, a fake ACP CLI for tests,
then one adapter). The reference project was at commit `ed8cb7278`. All paths
are in the reference project unless a line says "ours". Nobody opened its
`enterprise/` directory. Process start and stop (the kill of a process tree,
SIGTERM) is in the feature engine-process-lifecycle. This file records only
how the ACP core calls it.

Other research files already cover parts of this feature. This file does not
repeat them:

| File | What it covers | What this file adds |
|---|---|---|
| [`driver-contract.md`](driver-contract.md) (at `d6660e2`) | The flow of `sendTurn` in the ACP core, the busy check, the stop, the settle, the stop reasons, the waits, the permission broker | The rest of the core: the env, the shared process, the session load and the rebuild, the model and variant checks, the quiet watch, the startup recovery, the error mapping. The line map from `d6660e2` to `ed8cb7278` (section 3.1). The adapters, the fake CLI, the tests and the UI |
| [`queue-and-steer.md`](queue-and-steer.md) | The three ACP steer strategies and their outcomes | How the steer of each adapter is enabled, and the serial order of steers (section 3.11) |
| [`file-modes-atomic-writes-redaction.md`](file-modes-atomic-writes-redaction.md) | The redaction of the stderr tail and of a tool title, the config files that three adapters write | For a local model server, six adapters write a plain API key into the config files of the person, and five set no file mode. Only one engine cleans tool payloads in the native log (section 8) |
| [`event-bus-fold.md`](event-bus-fold.md), [`chat-turns.md`](chat-turns.md) | The bus, the fold, the turn in the host | The ACP update kinds and the events that each one gives (section 3.8) |

## 1. In short

The reference project runs about 18 kinds of AI engine through one shared
driver core for ACP. Each engine is a command-line program (a CLI) that the
server starts as a child process. The server and the engine talk JSON-RPC
over the standard input and output of that process. The engine keeps the
conversation (the "session") itself, so the server can load it again in the
next turn. Each engine has a thin **adapter**. The adapter gives the command
line, the sign-in, the model list and the approval mode of the engine, and
works around its bugs. A **fake ACP CLI** acts as an engine in the tests.

Terms used in this file:

- **ACP**: Agent Client Protocol. JSON-RPC 2.0 with one JSON object on each
  line of stdin and stdout. The client (the server of the reference project)
  sends `initialize`, `session/new` or `session/load`, then `session/prompt`.
  The engine streams `session/update` notifications. The result of
  `session/prompt` ends the turn. `session/cancel` is a notification that
  asks the engine to stop.
- **The core**: `server/drivers/acp/core.ts` (1573 lines). The function
  `createAcpDriver(support)` makes a driver from one adapter.
- **Adapter, `AcpSupport`**: the object that one engine file gives to the
  core (`core.ts:95-276`). It has about 70 optional fields. `AcpDriverHooks`
  (`driver-hooks.ts:9-51`) is a smaller set of 13 hooks inside it.
- **Host**: one engine process and the threads that use it
  (`host.ts:126-388`). With `shareProcess`, one host serves up to 6 threads.
- **Session**: the conversation inside the engine. Its id is the **resume
  cursor**. The server stores the cursor and sends it back with
  `session/load` or `session/resume` in the next turn.
- **Spawn contract**: the command, the arguments and a hash of the
  environment. A pooled process is used again only when the contract is the
  same (`core.ts:932-935`).
- **Config option**: a setting that the engine reports in its session, for
  example `model` or an effort level. The client changes it with
  `session/set_config_option` and must read the new value from the reply.
- **Variant**: an effort level (thinking level) of one model.
- **Quiet watch**: a timer that looks at a silent turn every 15 s. It reads
  the CPU, the network connections and the log of the engine, shows a notice
  and stops a turn that shows no signs of life (`quiet-watch.ts`,
  `quiet-status.ts`).
- **Startup recovery**: the host can ask for it. Then a turn that failed
  before any work comes back as "not started", and a backup engine can take
  it (`startup-recovery.ts`).
- **Local inject**: a model on a local model server (for example Ollama) that
  an adapter writes into the config of the engine.
- **The person**: the human who owns the server and the engines.
- **The xAI CLI**: the engine of `grok.ts`. This file uses that name in the
  prose.

**The main findings.**

1. The core is a large generic protocol client, and the adapters are small
   but many. `AcpSupport` has about 70 fields. Each field exists because one
   engine needed it. Most adapters use none of the 13 hooks of
   `driver-hooks.ts`. They use the larger `AcpSupport` fields.
2. The custom ACP adapter is 55 lines (`custom.ts`). It has no sign-in, no
   engine bug and no extra hook. Its test drives the fake CLI. It is the
   smallest real adapter.
3. The environment of an engine is still a deny-list. The core copies all of
   `process.env` and deletes the keys of two fixed lists and of the control
   plane (`core.ts:339-354`, `server/credential-env.ts:5-55`). It does
   not change `HOME` or `XDG_*`. Off a Team Cloud, "every spawn keeps the
   server's HOME" (`server/engine-homes/engine-homes.ts:1-3`). So each engine
   reads the config, the sign-in and the instruction files of the person.
4. For a model on a local model server, six adapters write the key of that
   server as plain text into the config file of the person. Five of them set
   no file mode (`opencode-go.ts:416`, `droid.ts:88`, `grok.ts:250`,
   `kimi.ts:455`, `hermes.ts:84`). Qwen sets 0600. But when its
   `settings.json` does not parse, Qwen starts from `{}` and writes that
   back, so the settings of the person are lost (`qwen.ts:109-114`, `:146`).
5. Each wait on the engine has a limit, except the prompt. The prompt has an
   idle limit of 15 min, and that limit starts again with no end while a tool
   or a question is open (`host.ts:288`). A value of the env variable that is
   not valid turns the limit off (`quiet-status.ts:21-22`).
6. A shared process links the turns of different threads. A stop that the
   engine does not confirm in 5 s kills the process, and the turns of the
   other threads fail (`core.ts:438-447`).
7. The fake CLI is 1954 lines with about 60 modes and about 100 env knobs.
   It keeps its waiting prompt and its open permission in global slots, not
   one for each session (`fake-acp-cli.ts:573-589`).

## 2. Files read completely

Nine subagents read the files, one for each group. The usage limit stopped
all nine one time. Each one continued from its saved state. Each report ended
with "Files read completely" and "Not verified".

**The core.** `server/drivers/acp/core.ts` (1573, in ranges 1-400, 400-799,
799-1188, 1189-1573), `capabilities.ts` (23), `driver-hooks.ts` (122),
`applied-config.ts` (35), `config-decode.ts` (13), `config-options.ts` (121),
`harness-failure.ts` (42), `quiet-watch.ts` (90), `startup-refresh.ts` (62),
`startup-recovery.ts` (21), `rpc-error.ts` (51), `turn-state.ts` (140),
`exit-report.ts` (144), `failure-words.ts` (47), `node-version.ts` (20),
`version-probe.ts` (31), `session-delete.ts` (19), `prompt-usage.ts` (21),
`api-key-account.ts` (12).

**The session and turn helpers, with their tests.** `host.ts` (388) and its
test (112), `steer.ts` (190) and test (161), `background-text.ts` (231) and
test (178), `background-work.ts` (51) and test (66), `quiet-status.ts` (444)
and test (315), `quiet-log-rotation.test.ts` (68), `tool-items.ts` (26),
`tool-log.ts` (71), `media-links.ts` (92) and test (74), `client-path.ts` (36)
and test (54), `client-file-request.ts` (55), `question-requests.ts` (64),
`session-model-controls.ts` (187) and test (150), `session-reports.ts` (132)
and test (225), `load-replay.ts` (38) and test (81), `model-catalog.ts` (83)
and test (70), `browser-auth.ts` (310) and test (194), `tool-scope.test.ts`
(168).

**The core tests.** `acp.test.ts` (3727, in ranges 1-700, 700-1399,
1400-2099, 2100-2919, 2920-3728), `config-options.test.ts` (48),
`startup-refresh.test.ts` (46), `rpc-error.test.ts` (54),
`turn-state.test.ts` (114), `exit-report.test.ts` (95),
`failure-words.test.ts` (37), `node-version.test.ts` (19),
`version-probe.test.ts` (48), `turn-health.test.ts` (88),
`probe-errors.test.ts` (51), `server/testing/events.ts` (46),
`server/testing/setup.ts` (41).

**The fake CLI and the protocol tests.** `server/testing/fake-acp-cli.ts`
(1954, in ranges 1-500, 501-1000, 1001-1500, 1501-1954),
`acp/shared-process.test.ts` (371), `acp/live-reply-matrix.test.ts` (81),
`acp/approval-matrix.test.ts` (125), `server/acp-recovery.e2e.test.ts` (122),
`server/acp-context-reports.e2e.test.ts` (142),
`server/acp-memory-model.e2e.test.ts` (60),
`server/testing/fakes-self-contained.test.ts` (45),
`server/testing/fake-parent-lifecycle.test.ts` (49),
`server/testing/live-reply-cases.ts` (59), and the small fakes
`fake-cursor-login-cli.ts` (47), `fake-grok-login-cli.ts` (59),
`fake-kimi-login-cli.ts` (62), `fake-custom-acp-models.ts` (102),
`fake-vibe-acp-signin.mjs` (34).

**The adapters, with their tests and documents.** OpenCode: `opencode-go.ts`
(855), `opencode-background.ts` (53), `opencode-model-refresh.ts` (181),
`opencode-probe.ts` (286), `opencode-release.ts` (48),
`opencode-typed-model.ts` (45), `opencode-unreached.ts` (19), seven tests
(`opencode-go.test.ts` 1849 in five ranges, and 60, 56, 140, 302, 268, 132),
`server/opencode-provider-keys.e2e.test.ts` (162), `docs/opencode-go.md`
(86), `docs/superpowers/plans/2026-08-15-opencode-go-integration.md` (93),
`docs/superpowers/specs/2026-08-15-opencode-go-integration-design.md` (49),
`docs/plans/opencode-go-integration.md` (312),
`scripts/verify-opencode-permissions.ts` (113). Cursor, Gemini, custom,
Copilot, Cline: `cursor.ts` (565), `cursor-release.ts` (27), `gemini.ts`
(91), `custom.ts` (55), `custom-model-catalog.ts` (300), `copilot.ts` (282),
`cline.ts` (229), `cline-models.ts` (80), their seven tests (964, 205, 73,
129, 289, 395, 343), `docs/cursor.md` (142), `docs/verification/cline.md`
(101), `docs/verification/copilot-engine.md` (97). The xAI CLI, Kimi, Hermes:
`grok.ts` (652), `grok-follow-up.ts` (113), `grok-sign-in.ts` (63),
`grok-signals.ts` (63), `kimi.ts` (587), `hermes.ts` (465), their thirteen
tests (170, 113, 229, 60, 266, 118, 198, 200, 258, 86, 90, 248, 469),
`docs/verification/grok-steering.md` (126), `docs/verification/kimi-models.md`
(31). The other eight: `deepseek.ts` (360), `qwen.ts` (242), `devin.ts`
(140), `droid.ts` (214), `kiro.ts` (130), `mistral-vibe.ts` (206),
`mistral-vibe-release.ts` (32), `omp.ts` (71), `command-code.ts` (123), their
nine tests (466, 25, 251, 240, 149, 207, 244, 134, 190),
`server/deepseek-variants.e2e.test.ts` (94), the DeepSeek spec (165) and plan
(418), `docs/verification/qwen-models.md` (53).

**The callers, the wiring and the UI.** `server/drivers/builtIn.ts` (66),
`server/drivers/antigravity.ts` (353), `server/turn-watchdog.ts` (281),
`server/engine-versions.ts` (47), `server/cli-probe.ts` (61),
`server/standalone-releases.ts` (8),
`src/components/CustomAcpModelPicker.test.ts` (169),
`src/components/CopilotModelPicker.test.ts` (126),
`src/components/EngineBrowserSignIn.tsx` (156),
`src/components/model-picker-reasoning.ts` (61),
`src/components/EngineLiveCheck.tsx` (55),
`src/components/ModelPickerBusyMenu.tsx` (25).

**Read in ranges only.** `server/index.ts`: 795-806, 1060-1080, 1365-1395,
4915-5040, 7180-7250, 7498-7525, 7665-7712, 8318-8360.
`server/harness/registry.ts`: 20-60, 153-240, 505-595.
`server/routes/instances.ts`: 100-170, 318-600. `server/engine-updates.ts`:
17-31, 185-240, 300-330. `server/credential-env.ts`: 1-106.
`server/drivers/codex.ts`: 205-250. `src/components/EngineSetup.tsx`: 18-35,
218-270. `src/components/ApprovalCard.tsx`: 125-135, 483-490. `DESIGN.md`:
26-31. `docs/custom-engines.md`: 20-130.

**Not read.** `server/procs.ts`, `server/drivers/engine-stop.ts` and the bot
box (engine-process-lifecycle has them), `server/drivers/device-auth.ts`
(only its timeouts), `server/prompt-split.ts`, `tool-count-limit.ts`,
`ModelPicker.tsx` (1017), `EnginesSettings.tsx` (602), `QuestionCard.tsx`
(301).

**The checks of the main session.** I read these lines myself at
`ed8cb7278`. Each check agrees with the report of its subagent, except the
two corrections below.

1. The timeouts: `INIT_TIMEOUT` 300 s, `NEW_SESSION_TIMEOUT` 300 s,
   `LOAD_SESSION_TIMEOUT` 120 s, steer 15 s, `SHARED_SESSIONS_MAX` 6 and
   `SHARED_SESSIONS_LIFETIME` 12 (`core.ts:279-289`).
2. The env is a deny-list: `{...process.env, ...input.environment, PATH}`,
   then a delete of each listed key that is not in `credentialEnv`
   (`core.ts:339-354`). `stripControlPlaneEnv` compares names without case
   (`server/credential-env.ts:46-55`).
3. The busy check comes two times, before and after the await of admission
   (`core.ts:868`, `:973`).
4. A stop sends `session/cancel` and arms a 5 s timer
   (`core.ts:1042-1056`).
5. `session/prompt` has no hard timeout, only the idle timeout
   (`core.ts:1306-1319`).
6. A permission card has a 15 min timer (`core.ts:672-675`).
7. `decodeAcpConfig` does not decode `steer` (`config-decode.ts:4-13`).
8. The idle timer of the host starts again while `busy()` is true
   (`host.ts:288`), and the env value `0` or a value that is not valid turns
   it off (`quiet-status.ts:17-23`).
9. The fake keeps `pendingPermissionId` and `hangingPromptId` as global
   slots (`fake-acp-cli.ts:573-581`).
10. `custom.ts:18-34`, the Cline key copy (`cline.ts:122-130`), the Droid
    write with no mode (`droid.ts:88`), the xAI key delete
    (`grok.ts:625-627`) and the HOME rule of engine homes
    (`engine-homes.ts:1-3`).
11. OpenCode turns off the Claude instructions (`opencode-go.ts:718`) and
    turns off project config only in the folders of the app
    (`opencode-go.ts:487-490`, `:722`).
12. The stdout of a host has no limit for the length of a line
    (`host.ts:165-182`). A folder belongs to one thread for the life of the
    process (`host.ts:145-148`, `:214-218`).
13. The watchdog limits are 20 min, 2 h and 30 min (`index.ts:4922-4924`),
    and the comment about the 6 s hold is at `index.ts:4968`.
14. `interruptTurn` takes only the thread id (`core.ts:1534`). A steer with
    pictures is refused (`core.ts:1535-1536`).
15. Qwen catches a parse error, keeps `{}` and writes the file
    (`qwen.ts:109-114`, `:146`). OpenCode writes `opencode.json` with no
    mode (`opencode-go.ts:416`).
16. Ten adapters return null from `pickAuthMethod`: custom, Kimi, Hermes,
    DeepSeek, Qwen, Devin, Droid, Command Code, Copilot and OpenCode (a
    search of `pickAuthMethod` in `server/drivers/`).
17. The default folder of a turn is `homedir()` when no folder is set
    (`core.ts:880`).

**Corrections to the reports.**

- The helpers report says that no driver sets `sanitizeToolPayload`. That is
  wrong. `server/drivers/antigravity.ts:163` sets it. It is the only one. So
  the 17 other ACP engines write the full tool payloads to the native log,
  with only pattern redaction.
- The task named `src/components/CustomAcpModelPicker.tsx` and
  `CopilotModelPicker.tsx`. These components do not exist. Only the two test
  files exist, and they test the shared `ModelPicker`.

## 3. How it works

### 3.1 The lines that earlier files cite, at `ed8cb7278`

`core.ts` changed by +194/-126 lines since `d6660e2d7` (commit `343c745d8`,
for the Antigravity engine). `host.ts` changed too. This table maps the
lines that `driver-contract.md`, `queue-and-steer.md`,
`plan/driver-contract.md` and `changelog.md` section 7 cite.

| Earlier cite (`d6660e2`) | Now | Behaviour |
|---|---|---|
| env build `core.ts:333-346` | `:339-354` | Same. A deny-list |
| busy check `:922`, again `:1022` | `:868`, `:973` | Same |
| `active.set` `:1105` | `:1056` | Same |
| stop `:1091-1104` | `:1042-1056` | Same |
| `session/prompt` `:1362-1373` | `:1306-1319` | Same |
| permission timer `:733` | `:672-675` | Same |
| settle `:558-579` | `:500-521` | Same |
| steer timeout `:275` | `:281` | Same |
| startup timeouts `:273-277` | `:279-284` | Same |
| `interruptTurn` ignores the turn id `:1572` | `:1534` | Same |
| steer with pictures refused `:1573-1574` | `:1535-1536` | Same |
| idle timer `host.ts:276` | `host.ts:275-299` | **Changed.** It counts in slices of 60 s. A slice that ends more than 10 s late is sleep, and the count starts again (`host.ts:22`, `:285`). The busy rule at `:288` is the same |
| `codex.ts:225-236` | `codex.ts:225-242` | Same deny-list |

The other changes in `core.ts` since `d6660e2d7`:

1. The quiet watch moved to `quiet-watch.ts`, with sleep detection
   (`quiet-watch.ts:36-41`, `:51`).
2. A stderr line can fail the process (`harness-failure.ts:21-33`). A pooled
   session on that process is not used again (`core.ts:958`). A prompt reply
   after the failure is refused (`core.ts:1320`).
3. `AppliedConfig` (`applied-config.ts:11-30`) skips a config call when the
   session already confirmed the value (`core.ts:1251-1257`).
4. A saved model list can stand in for the startup model read
   (`startup-refresh.ts:27-53`, `core.ts:857-858`). If the engine refuses the
   model, the turn runs again one time after the read (`core.ts:1370-1383`).
5. `brokenSessions`: a session id that broke is never loaded again
   (`core.ts:1423`, `:1131`).
6. New support fields: `sessionSetupTimeoutMs` (`:186`), `coldStartCost`
   (`:180`), `stderrFailure` (`:184`), `modelListStandsIn` (`:182`), and the
   hook `allowsAlone` (`driver-hooks.ts:29-31`).

In that range, no adapter file changed. The 17 adapters are OpenCode,
Cursor, Gemini, custom, Copilot, Cline, the xAI CLI, Kimi, Hermes, DeepSeek,
Qwen, Devin, Droid, Kiro, Mistral Vibe, OMP and Command Code. The fake CLI got 5 lines: the knobs
`FAKE_ACP_PROMPT_STDERR` and `FAKE_ACP_PROMPT_STDERR_THEN=hang`
(`fake-acp-cli.ts:47`, `:1328-1331`).

### 3.2 Registration and the instance

1. `BUILT_IN_DRIVERS` (`builtIn.ts:34-66`) has 17 drivers from `./acp/*` and
   the Antigravity driver, which wraps `createAcpDriver`
   (`antigravity.ts:261`).
2. The registry finds a driver by its `driverKind`. It decodes the config,
   or uses `defaultConfig()` when the entry has no config
   (`registry.ts:194`). It calls `create`. A throw gives a "shadow" entry
   with the reason, and the other instances run (`registry.ts:180-218`).
3. The config of an instance is `AcpConfig {cli, fullAuto, workspace?,
   steer?}` (`core.ts:89-92`). `decodeAcpConfig` reads only `cli` (the
   default CLI when it is not a string), `fullAuto` (true only for a literal
   `true`) and `workspace` (`config-decode.ts:4-13`). The custom adapter adds
   `steer` itself (`custom.ts:41-44`).
4. A person writes a custom engine in `config.json`:
   `{"instances": {"my-agent": {"driver": "customAcp", "displayName": "My
   Agent", "environment": {...}, "config": {"cli": "my-agent acp"}}}}`
   (`custom.ts:1-5`, `docs/custom-engines.md:30-41`). `cli` is the whole
   command line.
5. `create` returns the instance: the models, the status read
   (`snapshot`), the sign-in surface, `dispose`, and the adapter with
   `sendTurn`, `interruptTurn`, `steer?`, `respondToRequest`, `hasSession`,
   `enginePid`, `stopAll` and `onEvent` (`core.ts:1515-1570`).
6. The capabilities are fixed for all ACP engines, except `images`,
   `effortLevels`, `modelVariants`, `askTool` and `queueing`
   (`capabilities.ts:4-23`). `queueing` is true only when the adapter has
   `steer`.
7. The core starts no process at create. With `resolveModelsOnCreate:
   false`, it does not even read the model list (`custom.ts:28`).

### 3.3 The environment of the engine process

1. The base is `{...process.env, ...input.environment, PATH:
   augmentedPath()}` (`core.ts:340-344`).
2. Each key of `PROVIDER_CREDENTIAL_ENV` (20 keys of model providers) and of
   `WORKSPACE_CREDENTIAL_ENV` (keys of the server) is deleted, unless the
   adapter lists it in `credentialEnv` (`core.ts:345-350`,
   `server/credential-env.ts:5-43`).
3. `stripControlPlaneEnv` deletes `OMB_LICENSE_KEY`,
   `OMB_INSTALLATION_CREDENTIAL` and each `OMB_CLOUD_*` key. It compares
   names without case, because Windows does (`credential-env.ts:46-55`).
4. The adapter's `transformEnv` runs (`core.ts:352`). Examples: the xAI CLI
   deletes `XAI_API_KEY`, because a leaked key moves the subscription of the
   person to pay-as-you-go billing (`grok.ts:624-627`). Kimi deletes its
   provider keys and `KIMI_MODEL_*` (`kimi.ts:569-574`). Copilot deletes
   `COPILOT_ALLOW_ALL` and the GitHub tokens of the server (`copilot.ts:200-206`).
5. For each turn, `applyTurnEnv` changes the env with the model, the folder
   and the MCP servers (`core.ts:899-902`).
6. `resolveCommand` can give its own env, which replaces the built env
   (`core.ts:927`).
7. The contract key has `sha256(JSON(spawnEnv)).slice(0, 16)`, so no secret
   is in the key (`core.ts:928-935`).

What the core does not do: it does not set `HOME`, `XDG_CONFIG_HOME` or a
config folder of the engine. A search of `core.ts` for HOME finds nothing.
Off a Team Cloud the engine homes module starts nothing, and "every spawn
keeps the server's HOME" (`engine-homes.ts:1-3`, `:108-111`). So the engine
reads the config, the sign-in, the MCP servers and the instruction files of
the person. Section 8 lists what each adapter does about it.

### 3.4 Start, reuse and admission of a process

1. With no folder, a turn runs in `turn.cwd ?? workspace ?? homedir()`
   (`core.ts:880`). Without a folder, the bot runs in the home folder of the
   person.
2. With `requireAuthenticationBeforeSpawn`, `isAuthenticated()` runs. If it
   is false, the turn emits `turn.started`, `runtime.error {setup: true}`
   and `turn.completed {ok: false, stopReason: "auth_required"}`, and does
   not start a process (`core.ts:882-894`).
3. The core uses the pooled session of the thread again when all of these
   are true (`core.ts:956-962`):
   - it is not dead and not closing
   - it has the same contract key and no stderr failure
   - with `restartOnMcpChange`, it has the same MCP set.
4. Else the core closes the old session with the reason "contract", awaits
   `turn.engineAdmission("session" | "process", pid)`, checks busy again and
   opens a session (`core.ts:964-975`).
5. `hostFor` uses a shared host again when its key matches and
   `host.accepts(6, 12, threadId, cwd)` is true. Else it calls `spawnCli`
   with `stdio` pipes and the bot box, and wraps the child in an `AcpHost`
   (`core.ts:533-549`). The internals of `spawnCli` belong to
   engine-process-lifecycle.
6. `accepts` is true only when all of these are true (`host.ts:214-218`):
   - the host is alive and not draining
   - it has fewer than 6 links and opened fewer than 12 sessions in its life
   - no other thread owns the folder.

   The security note: an engine can key its MCP servers by folder and name.
   So "a second thread in a folder would call through the first one's
   servers" (`host.ts:145-148`).
7. Before the first stdout line, a stderr line that says the system has no
   more threads counts as a refused start. The host tells the process budget
   `EAGAIN` (`host.ts:185-191`, `:206-210`).
8. The stop helpers that the core calls: `stopEngineTree(child, 0, 5_000)`
   to retire a child (`core.ts:398`), `stopEngineTree(child, 5_000, 5_000)`
   after EOF (`:430`), `killCliTree(child)` when a cancel is not confirmed
   (`:448`) and in startup recovery (`:1402`), `stopEngineTrees([...])` at
   dispose (`:1568`).

### 3.5 The handshake

1. Before the handshake, the core waits for the old children of this thread
   to stop. If one cannot be stopped, the turn throws "could not close its
   previous tool session" (`core.ts:1064-1071`).
2. `initialize` runs one time for each process (`host.once`), with a limit
   of 300 s (`core.ts:1073-1090`). The parameters:
   - `protocolVersion: 1`.
   - `clientInfo` (a default name and `version: "0.0.0"`, or the hook).
   - `clientCapabilities: {fs: {readTextFile, writeTextFile}, terminal:
     false}`, where `fs` is true only with `clientFileSystem`.
   - `_meta` from `initializeMeta` and `clientCapabilitiesMeta`.
3. If the turn has pictures, the adapter says `images: true`, and the engine
   does not report `promptCapabilities.image`, the turn throws, unless
   `acceptsUnadvertisedImages` accepts the engine (`core.ts:1107-1114`).
4. `authenticate` runs one time for each process, with a limit of 300 s. It
   is skipped for a local inject model (`core.ts:1091-1106`).
   - `pickAuthMethod(authMethods, env)` gives the method id or null.
   - On a failure, `authFailure` decides: "continue" goes on, "fail" throws
     the `loginNote`, "fail-request" throws the error
     (`driver-hooks.ts:115-121`).
   - With no method and "fail", the turn throws the `loginNote`.
5. Ten of the 18 adapters return null from `pickAuthMethod`. The sign-in
   of those engines is done outside ACP (section 3.14).

### 3.6 Session: new, load, resume and rebuild

1. The cursor is null on `sessionReset`. Else it comes from
   `backgroundWork.resumeCursor` or from `turn.resumeCursor`
   (`core.ts:1120`).
2. The live session is kept when its id is set, its MCP set did not change,
   and the cursor is null or the same id (`core.ts:1125`).
3. A load runs when there is a cursor and the cursor is not in
   `brokenSessions` (`core.ts:1131`). With `closeBeforeLiveLoad`, the core
   first sends `session/close` (30 s), because Mistral Vibe 3.1.2 opens a
   second copy that streams each reply two times (`core.ts:198`).
4. `session/load` (or `session/resume` with `resumeMethod: "resume"`) gets
   `{sessionId, cwd, mcpServers, ...}` with a limit of 120 s, or
   `sessionSetupTimeoutMs` (`core.ts:1133-1147`). With `loadReplayQuietMs`,
   the load counts as done when the replay is quiet for that time
   (`load-replay.ts:7-38`).
5. Replay updates with `_meta.isReplay === true` are dropped
   (`core.ts:700`). Other updates before the prompt are ignored
   (`core.ts:711`).
6. Load errors:
   - A sign-in error, or `-32602` that is not "session not found", is thrown
     again. The turn does not make a new session, because that would replace
     the native history (`core.ts:1153-1155`, test `acp.test.ts:2662-2684`).
   - "Session not found" is `error.data` equal to `{sessionId: cursor}`, or
     the vendor text `Session "<id>" not found` with the same id
     (`rpc-error.ts:39-51`).
   - Other errors fall through to `session/new`.
7. If the load failed on the live session, the core closes it, starts a new
   process and tries again (`core.ts:1159-1167`).
8. A new session after a cursor needs `turn.recoveryText`. Without it, the
   turn throws. With it, the prompt is `system + "\n\n" + recoveryText`, and
   `session.started` has `rebuilt: true` (`core.ts:1171-1178`, test
   `acp.test.ts:2643-2660`).
9. `session/new` has a limit of 300 s. A reply with no `sessionId` throws
   (`core.ts:1180-1188`).
10. `session.started` is the only event that carries the cursor to the host
    (`core.ts:1191-1201`, `:1259`).

### 3.7 Model, mode and config options

1. With `selectModel`, `pickSessionModel` chooses the model
   (`session-model-controls.ts:139-187`):
   - It maps an old id onto the list that the session offers.
   - A pooled process that does not offer a model of the catalog is "stale".
     The turn fails, and the next turn starts a new process.
   - Else it uses `fallbackModel`, with one notice for each session.
   - A local inject model is never replaced.
2. `select` sends `session/set_config_option {configId, value}`, or the old
   `session/set_model` with `allowLegacy`. Then it checks that the session
   names the model. If not, it throws "did not switch to X (still Y)"
   (`session-model-controls.ts:18-121`). A later notification wins over an
   earlier reply (test `session-model-controls.test.ts:90`).
3. `configureSession` (`core.ts:258-275`) gets a raw `request(method,
   params, timeoutMs)`. So an adapter can call any method. Adapters use it
   for the approval mode, the model or the MCP list (section 3.15).
4. The variant (effort) is sent with `session/set_config_option`, unless
   `AppliedConfig.holds` says that this session confirmed it and the last
   reported value is the same. After the call, a value that differs throws
   "did not apply variant" (`core.ts:1251-1257`).
5. Before the prompt, with `modelVariants` (`core.ts:1297-1302`):
   - a model that is not confirmed throws "changed model before the prompt"
   - a variant that drifted throws "changed variant before the prompt".
6. `LiveSwitchRefused` from an adapter, on a session that was used before,
   closes it and runs `sendTurn` one time more with the same turn id
   (`core.ts:1261-1267`).
7. `config-options.ts` finds the model option by `id == configId` or
   category `model`, and the variant option by the ids `effort`,
   `reasoning_effort`, `thought_level`, `thinking` or those categories
   (`config-options.ts:41-80`). It flattens groups to a depth of 8.

### 3.8 The prompt and the stream

1. The prompt text (`core.ts:1270-1296`):
   - With a stable part of the system prompt, the full prompt goes one time
     for each native session. Later turns send the bare text, with a note
     when a volatile part changed.
   - The full prompt goes again after 8 bare turns
     (`ACP_PROMPT_RE_ANCHOR_TURNS`, `core.ts:289`), or when the usage report
     shows a drop below 60 % of the peak (`session-reports.ts:11`, `:26-40`).
   - A receipt for each `[threadId, sessionId]` records this (storage not
     read).
   - `buildPromptText` of the adapter, else `system + "\n\n" + text`.
   - Pictures become base64 image blocks. Media files named in the text can
     become `resource_link` blocks, up to 8 files and 19 MiB
     (`media-links.ts:27-30`).
2. If the turn is settled, stopped or closing, the core throws "turn
   stopped" (`core.ts:1303`). Then `promptSent = true`.
3. `session/prompt` has no hard limit. It has the idle limit of 15 min
   (`core.ts:1306-1319`, section 3.10).
4. `session/update` kinds and their events (`core.ts:696-796`):

   | Update | Event |
   |---|---|
   | `agent_message_chunk` text | `content.delta assistant_text`. Text that starts with `<SYSTEM_MESSAGE` or `<SYSTEM_NOTIFICATION` is not streamed (`:742-747`) |
   | `agent_message_chunk` image | `item.completed assistant_image` (`:726-735`) |
   | `agent_thought_chunk` | `content.delta reasoning_text` (`:751-756`) |
   | `tool_call` | `item.started` tool, title cut to 80 characters. A call with no id gets `acp-tool-unkeyed-N` (`:757-773`) |
   | `tool_call_update` completed or failed | `item.completed` tool, one time only for each id (`tool-items.ts:13-26`) |
   | `usage_update` | `thread.token-usage.updated` with the context (`session-reports.ts`) |
   | `plan` | a made-up tool `plan-<id>`, only with `features.acpPlanLines` (`session-reports.ts:55-128`) |
   | `session_info_update` | Hermes compaction marker |
   | `config_option_update` | the new variants during a turn, or a clear of `AppliedConfig` between turns (`:703-707`) |
   | `available_commands_update` | the command list of the session, for a command steer (`steer.ts:52-56`) |

5. With no current turn, or before the prompt, updates are dropped, except a
   wake of background work (`core.ts:711`).
6. After the reply: a stderr failure throws, the steers are awaited, the
   receipt is written, the usage is emitted (`prompt-usage.ts:8-21`), and
   `promptOutcome` runs (`core.ts:1320-1353`).
7. The stop reason: `end_turn` settles `ok`, `cancelled` settles
   `"cancelled"`, any other reason gives `acpStopFailure` and settles
   `false` (`core.ts:1354-1363`).
8. `endTurn` (`turn-state.ts:128-140`) turns an `end_turn` into:
   - `"cancelled"` when the person stopped the turn.
   - an error when the reply is only an error body of a provider.
   - `empty_turn` when nothing came.
   - `ended_after_tools` when reasoning came after the last tool and no
     reply came.
9. An adapter with `promptCompletion` (the xAI CLI) can end the prompt with
   its own notification. The host waits 2 s for the real reply, then uses
   the notification (`host.ts:18`, `:343-358`).

### 3.9 Requests from the engine

1. Each request marks activity (`core.ts:565`).
2. `fs/read_text_file` and `fs/write_text_file` go to
   `answerClientFileRequest`, only with `clientFileSystem`
   (`core.ts:566-568`). Only the Antigravity adapter sets it.
   - The path must be absolute and inside `cwd` (reads can also use the read
     roots). A symbolic link as the last part is refused. The nearest
     existing parent is resolved with `realpath` (`client-path.ts:9-36`).
   - The limit is 8 MiB (`client-file-request.ts:7`).
   - Each error is answered `-32602` with the message.
3. Question methods of an adapter (for example `cursor/ask_question`) go to
   `openQuestionRequest` (`core.ts:570-571`). One card holds all the
   questions. A malformed set is refused with `-32602`
   (`question-requests.ts:25-64`).
4. Each other method except `session/request_permission` gets `-32601`
   "method not found", so the engine never waits (`core.ts:572-575`).
   `terminal` is false in the handshake.
5. `session/request_permission` (`core.ts:579-693`):
   - The core picks an `allow_once` option, then any option whose kind
     starts with `allow`. It never trusts the order of the options.
   - With `allowsAlone`, or full access with no approval mode of the turn,
     it answers alone when `acpAnswersAlone(rawInput)` is true. If there is
     no allow option, it sends `cancelled` and an error event.
   - A session cache `sessionAllows` remembers "always" for one operation
     when the engine offered no `allow_always`. It is not used for questions
     or for control of the local computer (`core.ts:600-606`, `:643-647`).
   - Else it emits `request.opened` with a tool name, a summary of up to 200
     characters, and `requiresExplicitApproval` for a sandbox escape
     (`core.ts:677-692`). A `toolCallId` that starts with `interaction_`
     makes a question (`core.ts:593`).
   - After 15 min with no answer, the core denies it (`core.ts:672-675`).
   - `finish` sends `{outcome: "selected", optionId}` or `{outcome:
     "cancelled"}`. An allow with no allow option interrupts the turn,
     because "cancelled" means a cancel of the prompt in ACP
     (`core.ts:659-661`).
6. Between turns, `refuse` answers a permission with `cancelled`, a question
   with its cancelled value, and any other request with `-32601`
   (`core.ts:525-532`, `:823`).

### 3.10 Waits and their limits

| Wait | Limit | What happens | Where |
|---|---|---|---|
| `initialize`, `authenticate` | 300 s | reject, `acpSessionFailure`, close "rpc-failure" | `core.ts:1088`, `:1098` |
| `session/new` | 300 s, or `sessionSetupTimeoutMs` | the same | `core.ts:1180` |
| `session/load`, `session/resume` | 120 s, or `sessionSetupTimeoutMs` | the same | `core.ts:1133-1147` |
| model select, config calls | 300 s | the same | `core.ts:1216`, `:1223`, `:1253` |
| steer request | 15 s | "indeterminate" | `core.ts:1038` |
| `session/close` | 30 s, 5 s after a cancel timeout | not confirmed | `core.ts:423`, `:1131` |
| `session/prompt`, hard | none | | `core.ts:1311` |
| `session/prompt`, idle | 15 min. `0` or a value that is not valid turns it off | stall, close "prompt-stall" | `quiet-status.ts:17-23`, `host.ts:275-299` |
| idle while a tool or a question is open | starts again, no end | | `host.ts:288` |
| quiet notice | 60 s, then each 15 s, up to 12 notices | notice row | `quiet-status.ts:28-37`, `quiet-watch.ts:81` |
| no signs of life | 5 min after the stuck mark of 180 s | stall | `quiet-status.ts:325-357`, `core.ts:284` |
| wait out a usage limit | 2 min | stop as `quota` | `server/drivers/engine-errors.ts:13-17` |
| permission card | 15 min | deny | `core.ts:672-675` |
| question card (Cursor) | none, closed at settle | | test `cursor.test.ts:614-628` |
| stop | 5 s, then close or kill | `"cancelled"` or `"stop_failed"` | `core.ts:1047-1050` |
| EOF leave | 5 s + 5 s | tree stopped | `core.ts:430` |
| idle shared host | 60 s, `OMB_ACP_SHARED_RECYCLE_MS` | sessions closed | `core.ts:455-466` |
| `--version` probe | 8 s | fixed reason | `core.ts:1444` |
| `node --version` | 5 s | unknown | `node-version.ts:6` |
| background close | 10 s, two tries | kill | `background-work.ts:23` |
| memory one-shot | 120 s | error | `background-text.ts:8` |
| browser sign-in | 30 s start, 15 min wait | expired | `browser-auth.ts:17`, `:43-53` |
| model discovery (custom) | 8 s each call, 60 s in all | keep the old list | `custom-model-catalog.ts:12-13` |
| startup model read, admission, `isAuthenticated`, `resolveCommand`, `promptOutcome`, background end | none | | `core.ts:858`, `:886`, `:910`, `:970`, `:1120`, `:1302` |

The watchdog of the host is the outer limit (`index.ts:4922-4924`,
`turn-watchdog.ts`):

1. A turn stalls after 20 min with no event, or 2 h while a tool runs. Each
   value has an env override and a floor.
2. A turn that waits for a person or a computer never stalls, unless its
   engine process is gone. Then the limit is 30 min + 20 min.
3. An engine process that ended stalls the turn after 2 min
   (`turn-watchdog.ts:49`).
4. A shell command that uses CPU counts as activity
   (`turn-watchdog.ts:85-89`).
5. On a stall, the host calls `interruptTurn`, stores a notice, and keeps
   the thread for 6 s, because "ACP interruption settles within five
   seconds" (`index.ts:4940-5007`, `:4968`).

### 3.11 Stop, steer and settle

**Stop** (`core.ts:1042-1056`, `:432-452`):

1. `interrupt` sets `stopped`. With a session id it sends `session/cancel`
   (with `cancelMeta`). Without one, it closes the session.
2. After 5 s it sets `cancelling` and runs `endUncancelled`:
   - It closes the session with "cancel-timeout". On a shared host it sends
     `session/close` (5 s) and returns when the engine confirms it.
   - Else it closes each other session on the host, emits `acpRestarted` on
     their turns and settles them as `exit_before_result`
     (`core.ts:438-447`).
   - Then `killCliTree`. If that fails, the turn settles as `"stop_failed"`.
3. `interruptTurn` takes only the thread id (`core.ts:1534`).

**Steer** (`steer.ts`). ACP has no steer method. Three strategies exist:

| Kind | Adapter | How | Outcome |
|---|---|---|---|
| command | Hermes, custom with `steer: true` | a second `session/prompt` with `/steer <text>`, when the session lists the command | from the answer line: "steered", "refused" or "indeterminate" |
| request | OpenCode 2.3 | `_session/steering`, 15 s, when `initialize` says `_meta.steering.supported` | `promptRequired` or an RPC error: "refused". A timeout: "indeterminate" |
| prompt | Devin, the xAI CLI | a second `session/prompt` into the running turn | "steered" when sent |

- Steers of one turn go one at a time (`steer.ts:60-137`).
- A steer with pictures is refused (`core.ts:1535-1536`).
- The host stores a "steered" or "indeterminate" text as a user message,
  because "a resend could run them twice" (`index.ts:7217`). A "refused" text
  goes to the queue (`index.ts:7236-7250`).

**Settle** (`core.ts:500-521`). Settle runs one time for each turn:

1. It stops the quiet watch and the interrupt timer.
2. It closes each open card with "cancel" and source "system".
3. It fails the pending requests ("turn settled").
4. It removes the turn from the session before it emits, because "a listener
   may start the next turn synchronously".
5. It emits the optional `runtime.error`, then `turn.completed` with `cost:
   null`.
6. It arms the idle close again, or deletes a dead session.

### 3.12 Errors and process exit

1. `acpRpcError` (`rpc-error.ts:16-37`) makes the message from the error
   and the first text field of `data`. It redacts it and cuts it to 1500
   characters. Code `-32603` marks the session as failed. Other codes keep
   the session.
2. The catch of a turn (`core.ts:1364-1433`), in order:
   - the sign-in request hook, then `reportedFailure`.
   - a model that the saved list offered but the engine refused: one retry
     after the real read.
   - a refusal at the tool limit: one retry with fewer tools
     (`retryUnderToolLimit`, `core.ts:1384-1388`).
   - `classifyError` of the adapter. A sign-in, subscription or credit error
     gives `auth_required` with `setup: true`.
   - startup recovery (below).
   - `acpRuntimeFailure` with plain words.
   - the close reason, and the stop reason `cancelled`, `auth_required`,
     `quota` or `rpc_error`.
3. Startup recovery (`startup-recovery.ts:13-21`, `core.ts:1394-1414`). With
   `turn.startupRecovery`, the core stops the process and rejects with
   `TurnNotStartedError` when:
   - before the prompt: the failure is transient and is not a JSON-RPC shape
     error (`-32700`, `-32600`, `-32601`, `-32602`), or the approval mode was
     not confirmed.
   - after the prompt: only `promptUnreachedModel` (for example
     `ECONNREFUSED` in OpenCode), and not a stall.
   - never when the text matches the policy-denied pattern.
   - never after activity before the prompt (test
     `acp.test.ts:2908-2928`).
4. A process `error` settles `"spawn_error"` (`core.ts:828-834`).
5. A process exit during a turn emits `exitBeforeResult` and settles
   `exit_before_result`, or `"cancelled"` after a stop (`core.ts:838-848`).
   The words (`exit-report.ts:139-144`):
   - a Node that is too old.
   - a refused start (`EAGAIN`).
   - else "`<engine>` exited `<code>` before the prompt result: `<words>`.
     Last output: `<tail>`". Codes 134, 137, 139, 132, 159, 127, 126 and the
     signals have words.
6. The stderr tail keeps 3 lines, masks tokens and links, cuts each line to
   300 characters and never keeps a private key block
   (`exit-report.ts:29-126`).
7. A stderr line that matches the `stderrFailure` pattern fails each link of
   the process at once (`harness-failure.ts:21-33`).

### 3.13 Status, version and dispose

1. `snapshot()` runs `cli --version` with a limit of 8 s
   (`core.ts:1440-1464`). It gives a fixed reason for ENOENT, EACCES, a
   timeout and other failures. It never shows the CLI output.
2. With `cliVersion` and an output that does not match, the status is "not
   this CLI" (`core.ts:1459`). This finds an install command that a person
   pasted as the path.
3. `versionAtLeast` exists (`version-probe.ts:20-31`) but the core does not
   call it. No minimum version is checked at a turn. The updater checks a
   new copy with an ACP `initialize` before it uses it
   (`server/engine-updates.ts:208-214`, `server/engine-versions.ts:25-41`).
4. Then `isAuthenticated` runs, and `apiKeyAccount` says `method:
   "api-key"` when a key of `credentialEnv` is set
   (`api-key-account.ts:6-12`).
5. `dispose` stops each turn, settles each session as "cancelled" and stops
   each process tree. After dispose, `sendTurn` throws "shutting down"
   (test `acp.test.ts:2399-2417`).

### 3.14 Sign-in

Six ways exist, by adapter:

| Way | Adapters | How |
|---|---|---|
| none | custom, Hermes, Qwen, OMP | `isAuthenticated` is true. The person signs in from a terminal |
| a key in the env or a file | DeepSeek, Droid, Command Code, Kiro, Devin, Gemini | read the files of the CLI or the env. Each adapter knows the storage of its CLI |
| device code, run by the server | Cursor, the xAI CLI, Kimi | `login` of the CLI, read the link and the code from stdout. Code life 15 min |
| ACP `authenticate` with a browser | Mistral Vibe | the engine opens the browser. The request waits up to 15 min (`browser-auth.ts`) |
| ACP `authenticate` with a method | the xAI CLI (`cached_token`), Kiro (AWS), OMP (`agent`), Gemini | `pickAuthMethod` |
| a probe session | Copilot | an empty `session/new` with no prompt, cached 5 min when signed in and 60 s when not (`copilot.ts:25-31`) |

Failure messages never show the output of the CLI. The tests plant
"secret-token" and check that it does not appear
(`grok-device-auth.test.ts:175`, `browser-auth.test.ts:98`).

### 3.15 How each adapter maps the approval level

| Adapter | How | Confirmed |
|---|---|---|
| Cursor | argv `--force` (full) or `--auto-review` (auto) | no |
| Gemini, Qwen | argv `--yolo` or `--approval-mode ...` | no |
| the xAI CLI | argv `--permission-mode` with four modes | no |
| Devin | `set_config_option mode` | yes, the turn fails when it does not stick |
| Antigravity | `set_config_option mode` | yes |
| Kiro | `set_config_option autopilot` | no |
| Droid, Command Code | `session/set_mode` each turn | no |
| OpenCode | env `OPENCODE_PERMISSION` | not applicable |
| DeepSeek, OMP, Mistral Vibe, custom | nothing | not applicable |

The approval matrix test runs 7 adapters with full, auto and ask on one
thread (`approval-matrix.test.ts:35-124`).

### 3.16 The fake ACP CLI

`server/testing/fake-acp-cli.ts` is a real child process with the shebang
`#!/usr/bin/env node`. A test gives its path as `config.cli`.

1. It reads stdin line by line and skips blank lines and lines that do not
   parse (`fake-acp-cli.ts:820-838`). It answers an unknown method with an id
   with `-32601` (`:1951-1952`).
2. `FAKE_ACP_MODE` chooses the scenario (`:131`). The groups:
   - replies: `happy`, `image`, `empty-reply`, `reasoning-only`,
     `interleave`.
   - failures: `exit-early`, `fail-after-text`, `crash-in-prompt`,
     `abort-in-prompt`, `authenticate-failed`.
   - silence: `hang`, `hang-initialize`, `stall-after-text`,
     `stall-after-tool`, `slow-tool`, `quiet-then-answer`.
   - tools: `unkeyed-tool`, `finished-tools`.
   - sign-in: `no-auth`, `auth-required`.
   - cards: `permission`, `question`, `ask-question`, `lend-question`.
   - config refusals: `no-session-config`, `set-model-*`.
   - steer: `hermes-steer`, `opencode-steer`, `devin-steer`, `grok-steer`.
   - work between bots: `ask-peer`, `delegate-peer` and three more.
   - MCP and background: `mcp-tools`, `mcp-calls`, `safe-agent-reads`,
     `background-wake`, `echo-gated`.
3. About 100 env knobs script the rest (`:12-124`). Examples:
   - a fixed text reply
   - a stream script, chosen by a marker in the prompt
   - an RPC failure from a file. It stays for the life of the process
   - load errors and replays, close and delete
   - the capabilities of `initialize`, the models, the variants and the
     permission options
   - files of updates, read again at each prompt.
4. `happy` sends a message chunk "hello from fake acp", a tool call with
   `password: "acp-input-secret"` in its input and `api_key:
   "acp-output-secret"` in its output, then `{stopReason: "end_turn",
   _meta: {inputTokens: 10, outputTokens: 5}}` (`:799-803`, `:1399-1408`).
   The planted secrets test the redaction.
5. `session/cancel` answers the waiting prompt with `cancelled`, unless
   `FAKE_ACP_IGNORE_CANCEL=1` (`:1935-1950`).
6. It records what it got (`:327-423`, `:563-568`):
   - a dump of argv and of the allowed env keys, written with a temporary
     file and a rename
   - the `initialize` params, the prompts and the config calls
   - one JSON line for each request, with `{pid, method, cwd, sessionId}`
   - a launch counter.
7. An orphan watch checks the parent each 500 ms and exits when the parent
   is gone (`:181-191`). The test pins the parent pid as on Windows
   (`fake-parent-lifecycle.test.ts:6`).
8. It imports nothing, because tests copy it out of the repository
   (`fakes-self-contained.test.ts:1-44`).
9. It does not send `fs/*` or `terminal/*` requests.
10. Its waiting prompt, open permission, open question and stream are global
    slots (`:573-589`). Two sessions in one fake process cannot both wait.

## 4. The data

### 4.1 Config and support

- `AcpConfig {cli, fullAuto, workspace?, steer?}` (`core.ts:89-92`). The
  config of an instance also has `environment` and `displayName`.
- `AcpSupport` (`core.ts:95-276`): about 70 optional fields. The groups:
  - identity: `driverKind`, `displayName`, `access`, `models`,
    `defaultCli`, `install`, `cliVersion`, `minNodeVersion`.
  - spawn: `spawnArgs`, `spawnFingerprint`, `resolveCommand`,
    `credentialEnv`, `transformEnv`, `applyTurnEnv`, `shareProcess`,
    `restartOnMcpChange`.
  - sign-in: `pickAuthMethod`, `authFailure`, `isAuthenticated`,
    `requireAuthenticationBeforeSpawn`, `deviceSignIn`, `browserSignIn`.
  - session: `resumeMethod`, `closeBeforeLiveLoad`, `sessionSetupTimeoutMs`,
    `selectModel`, `fallbackModel`, `configureSession`,
    `sessionScopedApproval`.
  - stream: `updateFilter`, `permissionRequest`, `questionRequests`,
    `steer`, `backgroundWork`, `resendsReasoningReply`.
  - errors: `classifyError`, `promptUnreachedModel`, `limitFacts`,
    `describeAccountError`, `stderrFailure`.
- `createAcpDriver` throws when `sessionScopedApproval` is set without
  `configureSession` (`core.ts:314-316`).

### 4.2 State in memory

- For each turn, `AcpTurn` (`turn-state.ts:18-46`): the turn id, the flags
  `settled`, `promptSent`, `stopped`, `cancelling`, the text so far, the
  usage peak, the open cards, the running tools, the ended tool ids, the
  interrupt timer and the steering.
- For each thread, `AcpSession` (`turn-state.ts:48-80`): the child, the host,
  the link, the folder, the contract key, the MCP key, the session id, the
  last session result, the idle timer, `appliedConfig`, the stderr tail, the
  current turn, the commands, the launch model.
- For each host: `initResult` and `authenticated`, shared by all sessions of
  the process.
- For each driver instance: `active`, `sessions`, `retiring`,
  `backgroundEnds`, `sessionAllows`, `brokenSessions`, `hosts`
  (`core.ts:376-523`).
- `sessionAllows`, `brokenSessions`, `AppliedConfig` and the fork map of
  OpenCode (`opencode-background.ts:17`) are lost at a restart.

### 4.3 What is stored

- The native protocol log: `NATIVE_DIR/<threadId>.ndjson`, mode 0600, each
  line through `redactSecrets` (`server/drivers/native.ts:72`, `:92-94`).
  Picture data becomes `[image data: N base64 chars]` (`tool-log.ts:39-71`).
  Tool payloads are cut only when `sanitizeToolPayload` is set.
- The resume cursor leaves only in `session.started`. The host stores it.
- The model list of each instance: `DATA_DIR/providers/engine-models/<instanceId>.json`,
  fresh for 6 h (`model-catalog.ts`, `server/startup-model-catalog.ts:13-19`).
- The prompt receipt for each `[threadId, sessionId]` (storage not read).
- OpenCode: `DATA_DIR/providers/opencode/live-models.json` and a probe folder
  that is its own git repository (`opencode-model-refresh.ts:41-50`,
  `opencode-probe.ts:62-103`).
- The config keys of OpenCode: `opencodeGo.apiKey` and
  `opencodeGo.providerKeys`, at most 20, write-only to the UI
  (`server/config.ts:349-350`, `:820-860`).

### 4.4 Files of the person that adapters read or write

| Adapter | Reads | Writes |
|---|---|---|
| OpenCode | `auth.json`, `~/.config/opencode/*` (folder rule), its log | `opencode.json` (local inject, API key, no mode) |
| Qwen | `~/.qwen/settings.json`, debug log | `settings.json` (API key in `env`, mode 0600). A file that does not parse becomes `{}` |
| Droid | `~/.factory/settings.json`, auth files | `settings.json` `customModels` with `apiKey`, no mode |
| the xAI CLI | `config.toml`, `.grok/config.toml` from the folder up to `/` | `config.toml`: `follow_up_behavior` each turn (atomic, 0600), local inject block with `api_key` (no mode) |
| Kimi | token files, `config.toml` | `config.toml` provider with `api_key`, no mode. Sign-out deletes the token files |
| Hermes | `~/.hermes/.env`, `config.yaml` | `config.yaml` provider with `api_key`, no mode |
| Cline | `providers.json` | none. It copies the saved key into `CLINE_API_KEY` (`cline.ts:129`) |
| Mistral Vibe | `whoami_cache.json`, keychain | sign-out deletes them and edits `.env` (0600) |
| Copilot | `~/.copilot` | deletes its own discovery sessions |
| Command Code | `auth.json` | deletes its own discovery session files |
| DeepSeek, Devin, Kiro, Gemini, Cursor | sign-in files | none |

## 5. The UI

The ACP core has no UI of its own. The UI shows ACP engines through the
shared engine screens.

1. **The model picker.** `ModelPicker.tsx` (not read) lists the models that
   discovery found.
   - The thinking row shows only when `capabilities.modelVariants` is true
     (`model-picker-reasoning.ts:21`, `:31`). Variant ids are opaque. The
     picker uses the variants of the session only when the instance and the
     model match.
   - While a bot works, the menu is locked, except the thinking row, which
     applies from the next message. The text: "Reasoning level applies from
     the next message" and "Stop this bot's turn before changing its model"
     (`ModelPickerBusyMenu.tsx`, `en.json:3299-3301`).
   - The default label of a custom engine is "Agent default", with the hint
     "the agent keeps its session or configured setting"
     (`CustomAcpModelPicker.test.ts:158-169`).
2. **The browser sign-in** (`EngineBrowserSignIn.tsx`, for Mistral Vibe):
   - states: a start button, a spinner, "waiting" (a poll of the status each
     2 s, the close time and Cancel), "succeeded", "cancelled", "expired",
     "failed", and an error with `role=alert`.
   - text: "Sign in to Mistral", "Finish the sign-in in the browser that
     opened…", "The sign-in window closes at {time}.", "Connected to
     Mistral. Your models are being refreshed." (`en.json:6259-6267`).
   - A browser sign-in from a phone or a remote caller is refused with 403
     (`routes/instances.ts:369-376`).
3. **The live check** (`EngineLiveCheck.tsx`): after an engine is ready, the
   UI sends one test message, with a limit of 120 s. Text: "Sending {name} a
   short test message…", "{name} is working", "{name} is connected but
   didn't answer a test message.", "Test again".
4. **Engine set-up** (`EngineSetup.tsx`, ranges only): a missing CLI, a
   sign-in, an update notice with a button or a command to copy.
5. **Cards.** The permission card maps the ACP kinds shell, edit, read and
   fetch to phrases (`ApprovalCard.tsx:130-135`). A request with no kind uses
   its `mcp__…` title (`:485-487`).
6. **Quiet notices** in the chat: "X hit a rate limit (HTTP 429) and is
   retrying (attempt 2). Next try in 20 s. It is still working."
   (`quiet-status.ts:393-427`). A stuck turn: "... sent nothing for 15 min
   with no tool running, so the turn was stopped as stuck. Send the message
   again to retry." (`core.ts:1314-1318`).
7. **The HTTP routes** (`routes/instances.ts`): `GET /api/instances`,
   `POST /api/instances/:id/(refresh-models|install|check|auth/*)`,
   `PATCH /api/instances/:id` (409 while a bot of that account works),
   `POST /api/cli-test` (10 s, `cli-probe.ts`).

`DESIGN.md` has no ACP section. Its rule "every state designed" applies
(`DESIGN.md:28-31`).

## 6. The tests

### 6.1 How the tests are built

- A test makes a driver with `createAcpDriver(support)` and a support with
  only the flags under test. Behaviour is switched by support flags, never
  by a driver name (`acp.test.ts:37-49`).
- No store fake and no host fake. `recordEvents(adapter)` collects events,
  and `until(pred, 10_000)` waits for one (`server/testing/events.ts:12-46`).
- The fake CLI is a real process. Some tests change the wire in flight with
  a spy on `procs.spawnCli`, or hold the kill with a spy on
  `procs.killCliTree` (`acp.test.ts:1126-1149`, `:2824`).
- Real timers with small values from env variables. Real sleeps of 450 ms
  and 800 ms (`acp.test.ts:2278`, `:2359`). Only `host.test.ts` uses a fake
  clock (`host.test.ts:96-111`).
- `server/testing/setup.ts:10-28` makes a new HOME for each test file and
  deletes `OMB_DATA_DIR`, `HERMES_HOME`, `CODEX_HOME` and
  `PI_CODING_AGENT_DIR`. The end-to-end tests build the env of the server
  from nothing with HOME set to the data folder.

### 6.2 What the tests guarantee

| Flow | Guarantee | Test |
|---|---|---|
| event order | `turn.started, session.started, content.delta, item.completed (text), item.started (tool), item.completed (tool), thread.token-usage.updated, turn.completed`. Each event has the turn id. The planted secrets do not appear | `acp.test.ts:433-463` |
| text and tools | each text block is complete before the next tool. Each message has its own id | `acp.test.ts:1060-1091` |
| env | the child has no key of another provider and no control-plane key | `acp.test.ts:1225-1253` |
| busy | a second `sendTurn` on a thread rejects "already running" | `acp.test.ts:2194-2201` |
| stop | a stop before the prompt, and a stop answered with `end_turn`, give `ok: true, "cancelled"` | `acp.test.ts:2212-2235` |
| stop that the engine ignores | the shared process is killed. The stopped turn is `"cancelled"`. The turn of the other thread fails | `shared-process.test.ts:272-295` |
| confirmed close | a stop takes at least 5.5 s, and the process stays | `shared-process.test.ts:314` |
| kill fails | the turn fails "could not be ended" | `shared-process.test.ts:339` |
| shared process | 3 threads, 1 process, 3 sessions, 1 `initialize`. A folder is never given to two threads. A process that ends gets no new session | `shared-process.test.ts:95-181` |
| admission | asked one time for each process or session. A refusal gives `TurnNotStartedError` and no spawn | `shared-process.test.ts:358` |
| idle | a stall after text ends `rpc_error`, "no tool running", "Send the message again to retry.", `stalled: true` | `acp.test.ts:2443-2458` |
| idle while busy | a turn that waits for an approval, or runs a slow tool, does not expire | `acp.test.ts:2273-2294` |
| sleep | 30 min of sleep does not count. The stall comes after 5 min awake | `host.test.ts:96-111` |
| setup that never answers | `session/new` with a limit of 500 ms ends `ok: false` in 5 s | `turn-health.test.ts:37-52` |
| load | a load refusal never makes a new session. A missing session is rebuilt from the recovery text | `acp.test.ts:2624-2684` |
| model | a model that the session does not offer fails before the prompt. A switch that does not stick fails "did not switch" | `acp.test.ts:2556-2591` |
| permission | one card, allow gives `"allowed-once"`, deny gives `"rejected"`. A stale id gives `"unavailable"` | `acp.test.ts:1609-1642`, `:1972-1987` |
| startup recovery | a transient error on `session/new` rejects with `TurnNotStartedError` and no terminal events. A stall after the prompt is never recovered | `acp.test.ts:2818-2928` |
| exit | exit 134 gives the plain words and the masked tail | `acp.test.ts:2264-2271` |
| reply quality | 14 adapters, 13 reply cases: no text lost, doubled or glued | `live-reply-matrix.test.ts:36-75` |
| approvals | 7 adapters, full, auto and ask on one thread | `approval-matrix.test.ts:35-124` |
| one retry | an internal error on a prompt retries one time in a new process and does not send the first text again | `acp-recovery.e2e.test.ts:10-113` |
| custom adapter | a blank `cli` throws the hint. The command is kept as written. The display name is in the errors. Keys of other providers are removed | `custom.test.ts:16-122` |

### 6.3 What no test covers

- Updates that arrive after a cancel or after the prompt result. The knob
  `FAKE_ACP_LATE_UPDATE` exists, but no core test uses it.
- `session/load` that never answers (120 s), `initialize` that never answers
  (300 s).
- Lines on stdout that are not JSON, partial lines, very long lines.
- An `EPIPE` on stdin, and a pooled process that dies between turns.
- Two instances that share one engine home.
- The test "interrupt settles a hung turn" checks only the event type
  (`acp.test.ts:2203-2210`).

## 7. Ours compared

**What we have.** `crates/bot-engine/src/lib.rs` (ours) has one line. Step
3 adds the `Driver` trait. No `acp` module exists. `docs/threat-model.md`
(ours) does not exist. The plan says to write it before step 9.

**What we plan.** Step 9 builds the module `bot-engine::acp`: a generic
core, a fake ACP CLI for tests, then one adapter. Done when a test runs a
turn with the fake CLI (`docs/plan/README.md` step 9). `comparison.md`
(ours) lists the crate `agent-client-protocol` 5 for the ACP driver and the
permission broker. The reference project has no ACP SDK. It writes JSON-RPC
by hand (`host.ts`).

| Part | Reference | Ours (step 9) |
|---|---|---|
| Protocol client | `core.ts` (1573), `host.ts` (388) | `bot-engine::acp` core |
| Adapter contract | `AcpSupport`, about 70 fields (`core.ts:95-276`) | an adapter trait, not designed |
| First adapter | 18 adapters | one. The custom adapter is the smallest (`custom.ts`, 55 lines) |
| Fake engine | `server/testing/fake-acp-cli.ts` (1954), env knobs, global slots | a fake ACP CLI binary for tests. P63 asks for a typed script file |
| Process start and stop | `procs.ts`, `engine-stop.ts` | engine-process-lifecycle research. P41 asks for a Windows test |
| Env | deny-list (`core.ts:339-354`) | P61: an allow-list |
| Busy | `active.has` checked two times, around an await | P54: a typed refusal, a slot taken before the first await |
| Stop | ignores the turn id (`core.ts:1534`) | P53: the stop takes a `TurnId` |
| Waits | the prompt has no hard limit, the idle limit can grow with no end | P6: each wait has a limit and a reason |
| Approval mapping | each adapter in its own way, some not confirmed (section 3.15) | step 10. One pure function in `bot-core` (changelog section 7) |

## 8. Where we can be better

Each point has its reason. "Problem" names a theme of `changelog.md`
section 5.

1. **Start an engine process from an allow-list of env variables, with a
   home folder of the app.** Reason: problems "The person's own engine
   config reaches the bots" and "A secret in the wrong place". The core
   copies all of `process.env` (`core.ts:339-354`) and keeps the HOME of the
   person (`engine-homes.ts:1-3`). So the engine reads the config, the MCP
   servers, the plugins and the instruction files of the person. OpenCode
   turns off only the Claude instruction file (`opencode-go.ts:718`) and
   project config in the app folders (`:722`). The xAI CLI reads
   `.grok/config.toml` from each folder up to `/` (`grok.ts:298-302`). This
   extends P61 with the home folder.
2. **Never write into the config files of the person.** Reason: problems
   "A secret in the wrong place" and "A file written over after a failed
   read". For a local model server, six adapters write a plain API key into
   the config of the person. Five set no file mode (`opencode-go.ts:416`,
   `droid.ts:88`, `grok.ts:250`, `kimi.ts:455`, `hermes.ts:84`). Qwen keeps
   `{}` when the file does not parse and then writes it (`qwen.ts:109-114`,
   `:146`). With a home folder of the app (point 1),
   an adapter writes only into that folder, with mode 0600.
3. **One process for each thread in step 9, with no shared process.**
   Reason: problem "Busy and races between bots". On a shared process, a
   stop that the engine does not confirm kills the turns of the other
   threads (`core.ts:438-447`, test `shared-process.test.ts:272-295`). One
   bug of OpenCode made the folder rule necessary (`host.ts:145-148`). The
   reference project uses `shareProcess` only for OpenCode and Mistral Vibe.
   It is an option for later, with its own test.
4. **A hard limit on the prompt, and a limit on the busy extension.**
   Reason: problem "A turn or a wait that does not end". The idle limit
   starts again with no end while a tool or a question is open
   (`host.ts:288`). A value of the env variable that is not valid turns the
   limit off (`quiet-status.ts:21-22`). The `Deadline` type of P6 makes a
   limit of zero impossible. A long tool gets a second, larger limit, as the
   watchdog of the host has (2 h, `index.ts:4923`).
5. **A maximum length for a line on stdout.** Reason: less risk with less
   code. `host.ts:165-182` keeps the buffer with no limit. The discovery
   client and the browser sign-in have limits (1 MiB for each line, 8 MiB
   in all, `custom-model-catalog.ts:14-15`, `browser-auth.ts:14-15`). A
   line codec with a maximum length gives this with no extra code.
6. **The fake keeps its state for each session, and reads one typed
   script.** Reason: the global slots (`fake-acp-cli.ts:573-589`) prevent a
   test of two waiting sessions. About 100 env knobs grow with each engine.
   This extends P63. The smallest useful set, ranked by use in the tests:
   - line framing, with `-32601` for an unknown method
   - `initialize` with switchable capabilities
   - `session/new`, `session/load` and `session/close`
   - a prompt with a text reply, a stream script, a tool call with planted
     secrets, and usage
   - `session/cancel` with an "ignore" switch
   - failure knobs: hang on a marker, crash in the prompt, error after
     text, a startup failure
   - one permission request
   - an append log of `{pid, method, sessionId}`
   - an orphan watch.
7. **The first adapter is the custom adapter.** Reason: less code. It is 55
   lines with no sign-in and no engine bug (`custom.ts:18-34`). Its test
   drives the fake (`custom.test.ts:81-101`). It tests the core, not an
   engine. Model discovery (`custom-model-catalog.ts`, 300 lines) can be a
   later pull request, because the static `agent-default` model works alone
   (`resolveModelsOnCreate: false`).
8. **The approval mode is confirmed from the reply, for each adapter.**
   Reason: problem "The approval model changed". Devin and Antigravity check
   the echoed value and fail the turn when it does not stick. Kiro, Droid
   and Command Code do not check it (section 3.15). A person's own default
   mode "must never skip the app's approvals" (`command-code.ts:26`).
9. **Answer each request of the engine, also between turns.** Reason:
   problem "A turn or a wait that does not end". The reference project does
   this (`core.ts:525-532`, `:572-575`), and `comparison.md` already lists
   it. We keep it, and a fake test checks it.
10. **A turn needs an explicit folder.** Reason: a security risk. With no
    folder, a bot runs in the home folder of the person
    (`core.ts:880`). This goes into `docs/threat-model.md`.
11. **The stop uses the turn id.** Reason: P53 at `core.ts:1534`. The line
    moved, the behaviour did not.
12. **Clean tool payloads in the log for each engine.** Reason: problem "A
    secret in the wrong place". Only Antigravity sets
    `sanitizeToolPayload` (`antigravity.ts:163`). The other engines log the
    full tool input and output after pattern redaction only.
13. **A capability flag, not a list of driver names.** Reason: an
    `AGENTS.md` rule. `COMMAND_ALLOWLIST_DRIVERS` lists ACP driver kinds
    (`index.ts:1067-1070`), and `variantLabel` tests `opencodeGo` by name
    (`model-picker-reasoning.ts:14-15`).
14. **Module caches keyed by the instance, not by the CLI path.** Reason:
    problem "Busy and races between bots". OpenCode keys its catalog cache
    by the CLI path (`opencode-go.ts:55-62`). Two instances with different
    keys share it.

### The problems of `changelog.md` section 5 in this feature

| Problem | Here | Evidence |
|---|---|---|
| A turn or a wait that does not end | yes | No hard limit on the prompt. The idle limit starts again with no end while busy (`host.ts:288`). An invalid env value turns it off (`quiet-status.ts:21-22`). Admission, the model read and `isAuthenticated` have no limit (`core.ts:858`, `:886`, `:970`). Fixes: the quiet watch with sleep detection, the 5 min "no signs" stop, the 2 min usage limit stop, `loadReplayQuietMs`, the 2 s prompt completion |
| Sign-in to an engine, and engine CLIs that change | yes | Each adapter reads the private storage of its CLI. Comments name many exact CLI versions. No minimum version at a turn (`version-probe.ts:20-31` not called). Fixes: `cliVersion` finds a wrong program, a temporary sign-in failure is not "signed out" (`grok-signals.ts:55-59`), the updater checks `initialize` before a switch |
| "Busy" and races between bots | yes | A cancel timeout kills the turns of other threads on the process (`core.ts:438-447`). Awaits between the busy checks (`core.ts:868`, `:973`). OpenCode caches by CLI path. Fixes: the folder rule (`host.ts:145-148`), routing by session id, a hold of 6 s after a stop (`index.ts:4968`) |
| The person's own engine config reaches the bots | yes | The deny-list env and the HOME of the person (`core.ts:339-354`, `engine-homes.ts:1-3`). Cline copies the saved key of the person (`cline.ts:129`). OpenCode reads the global config of the person (`opencode-go.ts:543-584`) |
| A secret or an access right in the wrong place | yes | Plain keys of a local model server in the config of the person, no mode (`opencode-go.ts:416`, `droid.ts:88`, `grok.ts:250`, `kimi.ts:455`, `hermes.ts:84`). Full tool payloads in the native log. Fixes: the stderr tail masks, the env hash in the contract key, failure messages never show CLI output |
| A file written over after a failed read | yes | Qwen keeps `{}` after a parse error and writes it, on the local model path (`qwen.ts:109-114`, `:146`) |
| State lost at a restart or a crash | partly | `brokenSessions`, `sessionAllows` and the OpenCode fork map are in memory only |
| One slow or stuck part blocks the others | partly | One stop on a shared process ends the turns of other threads |
| The size of the tool list of one turn | yes | One retry with fewer tools at a refusal (`core.ts:1384-1388`). OpenCode counts 24 tools of its own (`opencode-go.ts:709`). Kimi caps a schema at 12000 bytes (`acp.test.ts:1530-1559`) |
| Memory and the number of processes | yes | 6 sessions and 12 in the life of a shared process. A refused start counts as `EAGAIN` (`host.ts:206-210`). Admission for each process and session |
| Process control on Windows | partly | The fake has an orphan watch with the parent pid pinned (`fake-parent-lifecycle.test.ts:6`). Names compared without case (`credential-env.ts:48-55`). The stop helpers belong to engine-process-lifecycle |
| Tests that fail by chance | yes | Real timers and real sleeps of 450 and 800 ms (`acp.test.ts:2278`, `:2359`) |
| The approval model changed | yes | Each adapter maps the level in its own way. Five do not confirm it (section 3.15) |
| Usage and cost numbers corrected | partly | OpenCode cache reads are added to input unless the total has them (`acp.test.ts:1175-1223`). `turn.completed` has `cost: null` |
| The same work done or delivered two times | partly | A "steered" or "indeterminate" text is stored and not sent again (`index.ts:7217`). The retry after an internal error does not send the first text again (`acp-recovery.e2e.test.ts:101-107`) |

## 9. Not verified

- The internals of `spawnCli`, `killCliTree`, `engine-stop.ts` and the bot
  box: which env names the box passes, and whether the box changes HOME.
  Engine-process-lifecycle covers them.
- Where the prompt receipt is stored (`server/prompt-split.ts`), and how
  long a learned tool limit lasts (`tool-count-limit.ts`).
- Whether the config file that holds `opencodeGo.apiKey` is encrypted.
- How Mistral Vibe gets the approval level. Its header names `mode`, but the
  adapter sets nothing.
- Whether a change of the approval level of Qwen starts a new process
  (approvals are on argv, so it is probable).
- The default time limits of the device sign-in controller
  (`server/drivers/device-auth.ts`), seen only at a few lines.
- Whether a hard timer and an idle timer of one host request can both stay
  armed after the request settles (`host.ts:269-292`).
- `MAX_QUESTIONS` is 6, from a test message (`cursor.test.ts:602`).
- The claims of `docs/cursor.md` about Windows `.ps1`, a fallback to one
  permission for each question, and the Cloud install.
- Which WebSocket events carry ACP cards, beyond `broadcast({kind:
  "config"})`.
- `ModelPicker.tsx`, `EnginesSettings.tsx`, `QuestionCard.tsx` and
  `ApprovalCard.tsx` were not read completely.
- OpenCode 2 keeps sign-ins in its own database (`docs/opencode-go.md:78-80`).
  The spawn fingerprint reads only `auth.json`, so a sign-in change on
  OpenCode 2 may not start a new process. Not tested.
