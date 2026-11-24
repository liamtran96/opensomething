# One ACP engine in detail: the Cursor adapter

The record of how one adapter of the reference project works on top of its
generic ACP core. The engine is Cursor's agent CLI (`cursor-agent`). The row
is `cursor.md` in [`../reference-features.md`](../reference-features.md),
group 2. The crate that gets the port is `bot-engine`, step 9 of
[`../../plan/README.md`](../../plan/README.md).

- **Reference commit:** `ad27f0716` (2026-11-24).
- **Method:** a workflow of five subagents (A to E), one for each group of
  files. Each subagent read its files completely and gave a file and a line
  for each fact. The lead checked 26 key claims against the code. All 26
  agree. Section 2 lists the checks.
- **Earlier research that this file builds on:**
  [`acp-core.md`](acp-core.md) and
  [`engine-process-lifecycle.md`](engine-process-lifecycle.md), both read at
  `ed8cb7278`. This file does not repeat them. Section 3.12 records what
  changed in the core since then. Section 9.2 lists the lines of
  `acp-core.md` that are now wrong.

## 1. In short

**Terms.**

- **ACP** (Agent Client Protocol): JSON-RPC 2.0 over the standard input and
  output of a child process. The client sends `initialize`, `session/new` or
  `session/load`, then `session/prompt`. The engine streams
  `session/update` notifications and can send requests back, for example
  `session/request_permission`.
- **The core:** `server/drivers/acp/core.ts`. One generic ACP client that
  all ACP engines of the reference use.
- **An adapter:** one object of type `AcpSupport` that the core takes
  (`core.ts:96-277`). It holds all that is specific to one engine. For
  Cursor it is `server/drivers/acp/cursor.ts:468-559`.
- **A hook:** one field of `AcpSupport` that is a function. The core calls
  it at a fixed point. The 15 optional hooks of `AcpDriverHooks`
  (`driver-hooks.ts:9-59`) are part of `AcpSupport`.
- **A snapshot:** the status of one engine instance: `available` or
  `unavailable`, the version, and `authenticated?: boolean`
  (`server/contracts.ts:391-393`).
- **Device sign-in:** a sign-in where the server runs the CLI's own login
  command and shows the person a link (and, for some engines, a code). The
  person finishes it in a browser on any device. For Cursor there is a link
  and no code.
- **Approval level:** Ask, Edits, Auto, Full or Custom
  (`packages/phone-protocol/src/approval-mode.ts:5`). It decides which tool
  calls need the person.
- **A question card:** a card in the chat that asks the person one to six
  questions for the engine, and sends the answer back.
- **A backup engine:** another engine that takes the turns of a bot when its
  own engine is at a limit or signed out (`server/host/limit-takeover.ts`).
- **A parameterised model id:** Cursor's id for one variant of a model, for
  example `gpt-5.6-sol[fast=false]`. The model picker shows a flat slug, for
  example `gpt-5.6-sol`. The adapter maps one to the other.
- **Install on a Cloud:** the app downloads Cursor's own pinned Linux build
  into its data folder. Out of our plan. Section 3.13 records only its files
  and lines.

**The main facts.**

1. The Cursor adapter is one `AcpSupport` object with 10 required fields
   and 13 optional fields. It sets none of the 15 `AcpDriverHooks`
   (`cursor.ts:468-559`, `core.ts:96-277`).
2. The core needs only 10 fields from an adapter: `driverKind`,
   `displayName`, `models`, `defaultCli`, `nativeSource`, `loginNote`,
   `spawnArgs`, `pickAuthMethod`, `authFailure` and `isAuthenticated`
   (`core.ts:103-234`). All else is optional.
3. The approval level becomes a command-line flag: Full gives `--force`,
   Auto gives `--auto-review`, Ask gives no flag. `--approve-mcps` is always
   there (`cursor.ts:495-500`).
4. A sign-in hiccup is still read as "signed out" for Cursor. Changelog
   problem 1 is present on two paths:
   - The status probe returns `false` when `cursor-agent status` fails or
     takes more than 8 s (`cursor.ts:298-311`). Then Cursor is not chosen as
     a backup and the setup card asks for a sign-in
     (`server/default-model-selection.ts:42-48`).
   - Any JSON-RPC error with code `-32000` is classified as
     `invalid_credentials` (`cursor.ts:386`). The turn then stops as
     `auth_required`. The engine is then held as signed out for 60 minutes
     (`core.ts:1376-1418`, `limit-takeover.ts:152-155, 325`,
     `server/limit-resets.ts:110`). When the bot has a backup that the
     person chose, or an automatic recovery backup, new turns of the bot go
     to that backup (`server/automatic-recovery.ts:10-19`).

   The fixes of v0.1.177 and v0.1.178 are in commits `de4edc3ee` and
   `e9d08cade`. The first changed Grok's code only. The second changed the
   core, but only for an adapter with the `signInRequest` hook. Cursor has
   no such hook, so neither fix applies to Cursor.
5. The person's own Cursor config can reach the bots (changelog problem 3).
   Off a Team Cloud, the engine process keeps the server's `HOME`
   (`server/engine-homes/engine-homes.ts:1-3`). `CURSOR_CONFIG_DIR` is
   never set. The default folder of a turn is the home folder
   (`core.ts:881`).
6. Each Cursor turn waits for the model read on a first start. It also
   waits on a later start with no fresh saved model list. The ACP discovery
   of the model read can take up to 60 s. Then up to two text probes of 8 s
   each can follow (changelog problem 4).

**What this file adds to the earlier research.**

- The full list of what an adapter gives to the core, and which fields are
  required (section 3.1).
- The Cursor flows: launch, Windows launch, version check, model discovery,
  model selection, sign-in, question card and tools (sections 3.2 to 3.11).
- The changes of the core from `ed8cb7278` to `ad27f0716`: the new
  `session-system.ts` and the new hooks (section 3.12).
- The answer to the "Not verified" item of `acp-core.md:1165`: the Windows
  launch through `powershell.exe -File` is real code (section 3.3).
- The chain from one engine error to a backup engine (section 3.9).
- The lines of `acp-core.md` that are now wrong (section 9.2).

## 2. Files read completely

All paths are in the reference project at `ad27f0716`. No file under
`enterprise/` was opened.

| Subagent | File | Lines |
|---|---|---|
| A, adapter | `server/drivers/acp/cursor.ts` | 565 |
| A | `server/drivers/acp/cursor-release.ts` | 27 |
| A | `docs/cursor.md` | 142 |
| A | `server/drivers/acp/version-probe.ts` | 31 |
| A | `server/drivers/acp/question-requests.ts` | 64 |
| A | `server/drivers/acp/custom-model-catalog.ts` | 300 |
| A | `server/model-manifest/bundled.ts` | 28 |
| A, C | `server/drivers/device-auth.ts` | 387 |
| A, C | `shared/device-sign-in.ts` | 114 |
| B, core boundary | `server/drivers/acp/session-system.ts` | 45 |
| B | `server/drivers/acp/driver-hooks.ts` | 130 |
| B | `server/drivers/acp/background-text.ts` | 233 |
| B | `docs/research/features/acp-core.md` (this repository) | 1174 |
| B | `git diff ed8cb7278 ad27f0716 -- server/drivers/acp/ server/procs.ts` | 5 files |
| C, sign-in | `src/components/DeviceSignIn.tsx` | 271 |
| C | `src/components/EngineSetup.tsx` | 776 |
| C, D | `server/testing/fake-cursor-login-cli.ts` | 47 |
| C | `server/provider-auth-sessions.ts` | 147 |
| D, tests | `server/drivers/acp/cursor.test.ts` | 964 |
| D | `server/drivers/acp/cursor-sign-in.test.ts` | 205 |
| D | `src/components/DeviceSignIn.test.ts` | 188 |
| D | `src/components/EngineSetup.cursor.test.ts` | 88 |
| D | `server/drivers/acp/live-reply-matrix.test.ts` | 81 |
| E, wiring and Cloud | `server/drivers/builtIn.ts` | 66 |
| E | `server/runtime/capabilities.ts` | 66 |
| E | `server/engine-versions.ts` | 47 |
| E | `server/standalone-releases.ts` | 8 |
| E | `server/engine-install.ts` | 272 |
| E | `server/engine-standalone.ts` | 899 |
| E | `server/env-path.ts` | 472 |
| E | `packages/phone-protocol/src/approval-mode.ts` | 112 |
| E | `shared/tool-scope-support.ts` | 24 |
| E | `server/perf/process-buckets.ts` | 136 |
| E | `server/cli-probe.ts` | 71 |

**Read in ranges.**

| File (lines) | Ranges |
|---|---|
| `server/drivers/acp/core.ts` (1559) | A: 1-389, 520-629, 850-949, 1078-1117, 1143-1164, 1262-1281, 1368-1459. B: 60-1559 in parts, which covers every hook call site |
| `server/procs.ts` (741) | A, E: 1-80, 400-570, 600-741 |
| `server/index.ts` (15271) | C: 1354, 4622, 8655, 9370, 11742-11839, 11915, 15134. E: 1040-1110, 188, 803 |
| `server/drivers/acp/acp.test.ts` (3727) | D: 200-245, 255-335, 1215-1265, 2636-2700 |
| `server/testing/fake-acp-cli.ts` (1957) | D: 1-110, 222-230, 290-560, 975-1110, 1155-1320, 1880-1957 |
| `server/routes/instances.ts` | C: 300-420. E: 340-400 |
| `server/harness/registry.ts` | C: 220-232, 470-500, 550-580. E: 40-60, 340-400 |
| `server/host/limit-takeover.ts` | A: 80-100. C: 25-35, 91-93, 140-175. Lead: 148-186, 318-330 |
| `server/engine-updates.ts` | E: 1-75, 100-125, 165-260, 296-395 |
| `server/startup-model-catalog.ts` (159) | A: 125-159. Lead: 140-159 |
| `server/drivers/acp/startup-refresh.ts` | A: 21-52 |
| `server/engine-homes/engine-homes.ts` | A: 2-14, 92-104 |
| `server/model-manifest/manifest.ts` (271) | A: 1-50, 235-271 |
| `packages/phone-protocol/src/ask-question.ts` | A: 13, 154-175, 257-265, 325-348 |
| `server/drivers/prompt-split.ts` | B: 12-29, 128-164 |
| `server/contracts.ts` | C: 390-393, 504-521, 625-640 |
| `server/instance-fleets.ts` | E: 20-87 |
| `server/default-model-selection.ts` | Lead: 42-48 |
| `src/locales/en.json` | C: 3746, 3761, 3785, 6269, 6289-6307, 6328-6335. A: 3564, 3570, 3573 |

**The checks of the lead**, at `ad27f0716`. Each claim agrees with the code.

1. `probeCursorAuth` returns `false` when both status runs give nothing
   (`cursor.ts:298-311`). The time limit is 8 s (`cursor.ts:105`).
2. `readCursorStatus` gives `unknown` for a non-zero exit or text that is
   not JSON (`cursor.ts:318-321`).
3. `CURSOR_SIGN_IN` has no `logoutArgs` (`cursor.ts:332-343`).
4. The sign-in timers are 30 s for the link, 15 min in all, and 30 s to
   confirm (`device-auth.ts:130-150`).
5. The card polls every 2 s (`DeviceSignIn.tsx:205`).
6. A waiting sign-in counts as `active` until it expires
   (`provider-auth-sessions.ts:27-30`).
7. The snapshot type has `authenticated?: boolean`, with no third value
   (`contracts.ts:393`).
8. The argv for each approval level (`cursor.ts:495-500`) and its test
   (`cursor.test.ts:318-324`).
9. A question card has no time limit (`cursor.test.ts:614-628`).
10. The process tests of the sign-in are skipped on Windows
    (`cursor-sign-in.test.ts:36, 134`).
11. The fake `status` command cannot fail or hang
    (`fake-acp-cli.ts:429-434`).
12. `classifyCursorError` maps code `-32000` to `invalid_credentials`
    (`cursor.ts:381-397`).
13. `pickAuthMethod` and its comment about a browser (`cursor.ts:509-513`).
14. Turns wait for the startup model read unless `modelListStandsIn` is
    set (`core.ts:374, 859`, `startup-refresh.ts:45`).
15. A later start with a saved list that is less than 6 h old does not wait
    (`startup-model-catalog.ts:14, 154`).
16. `authenticate` is skipped when `skipsAuthenticate` is true
    (`core.ts:1092`).
17. `needsAuth` blocks the startup recovery (`core.ts:1376-1381`).
18. A turn that stops as `auth_required` marks the engine signed out
    (`limit-takeover.ts:91-93, 325`).
19. A signed-out engine stays held for 60 min, or while its snapshot says
    `false` (`limit-takeover.ts:152-155`, `limit-resets.ts:110`,
    `index.ts:8655`).
20. A snapshot with `authenticated === false` makes the engine not ready
    (`default-model-selection.ts:42-48`).
21. Off a Team Cloud the engine keeps the server's `HOME`
    (`engine-homes.ts:1-3, 92-95`).
22. On Windows the engine run tag is `null` (`procs.ts:428`).
23. The Windows kill returns `true` at once when the root process exited already
    (`procs.ts:676`).
24. The version pin of Cursor has the same target and minimum
    (`engine-versions.ts:39`). The minimum is read only for the retry backoff
    (`engine-updates.ts:346`).
25. `liveSessionKey` adds a SHA-256 of the held system text to the session
    key (`session-system.ts:15-17`).
26. The hiccup fixes are in `grok-signals.ts` (`de4edc3ee`, first in
    v0.1.177) and in `antigravity.ts`, `driver-hooks.ts` and
    `rpc-error.ts` (`e9d08cade`, first in v0.1.178).

## 3. How it works

### 3.1 Registration and the adapter object

1. `CursorAgentDriver` is one entry of `BUILT_IN_DRIVERS`
   (`server/drivers/builtIn.ts:10, 40`). It is
   `createAcpDriver(support(run))`, where `run` is `execCli` and a test can
   give another function (`cursor.ts:561-565`).
2. The default instance id is `cursor`, with the driver `cursorAgent`
   (`server/instance-fleets.ts:31`). A saved fleet that has a product engine
   gets it too (`instance-fleets.ts:68-71`).
3. The registry finds a driver by `driverKind` (`registry.ts:139`).
4. The fields that the Cursor adapter sets, and what the core does with
   each:

| Field | Value | What the core does with it |
|---|---|---|
| `driverKind` (required) | `"cursorAgent"` (`cursor.ts:469`) | The key of several tables: approval support (`approval-mode.ts:22-26, 44`), tool scope (`tool-scope-support.ts:8`), resume (`capabilities.ts:28`), version pin (`engine-versions.ts:39`) |
| `displayName` (required) | `"Cursor"` (`:471`) | Messages |
| `models` (required) | a getter on `currentEngineCatalog("cursor")` (`:473, 98`) | The fixed catalog (`core.ts:334, 358`) |
| `defaultCli` (required) | `"cursor-agent"` (`:475`) | The default CLI (`core.ts:320`). The generic name `agent` is not used, because other tools install an `agent` too (`docs/cursor.md:33-35`) |
| `nativeSource` (required) | `"cursor.acp"` (`:476`) | The label of the native log (`core.ts:319`) |
| `loginNote` (required) | "Cursor is not signed in where your bots run. Choose Cursor in the model picker and sign in from its card, or set CURSOR_API_KEY." (`:478`) | An error with this text counts as a sign-in error (`core.ts:1378`) |
| `spawnArgs` (required) | section 3.2 (`:495-500`) | The argv (`core.ts:927, 946`). It is part of the process contract (`core.ts:933`) |
| `pickAuthMethod` (required) | `null` when a key is in the environment, else `"cursor_login"` if offered (`:511-513`) | The ACP `authenticate` call (`core.ts:1092-1106`) |
| `authFailure` (required) | `"continue"` (`:514`) | A failed `authenticate` is ignored (`driver-hooks.ts:123-126`) |
| `isAuthenticated` (required) | `probeCursorAuth` (`:515`) | The snapshot only (`core.ts:1449`) |
| `questionRequests` | `{"cursor/ask_question": ...}` (`:470`) | Section 3.10 (`core.ts:527-531, 571-572`) |
| `askTool` | `"AskQuestion"` (`:470`) | Named as the engine's own ask tool (`capabilities.ts:19`) |
| `cliVersion` | `CURSOR_CLI_VERSION` (`:472, 315`) | Section 3.4 (`core.ts:1445`) |
| `deviceSignIn` | `CURSOR_SIGN_IN` (`:479, 332-343`) | Section 3.8 (`core.ts:375, 1514`) |
| `install` | a command for each OS, a docs link, `signInCommand`, `standalone` (`:481-491`) | The setup card (`core.ts:333`) |
| `restartOnMcpChange` | `true` (`:502`) | A new MCP set starts a new process (`core.ts:430, 960`) |
| `ownMcpOverHttp` | `true` (`:504`) | The app's own MCP servers go to the engine as HTTP endpoints (`core.ts:898`) |
| `credentialEnv` | `CURSOR_API_KEY`, `CURSOR_AUTH_TOKEN` (`:505`) | The only provider keys that stay in the environment of the process (`core.ts:346-351`) |
| `resolveModels` | `fetchCursorModels` (`:507`) | Section 3.5 (`core.ts:356-373`) |
| `classifyError` | `classifyCursorError` (`:516, 381-397`) | Section 3.9 (`core.ts:1151-1157, 1376`) |
| `clientCapabilitiesMeta` | `{parameterizedModelPicker: true}` (`:518, 102`) | Sent in `initialize` (`core.ts:1086`) and in the discovery (`custom-model-catalog.ts:224`) |
| `configureSession` | the model and the Fast option (`:520-556`) | Section 3.6. It runs after the session opens and before the prompt (`core.ts:1221-1248`) |
| `buildPromptText` | `system + "\n\n" + text` (`:558`) | The same as the core default (`core.ts:1275-1279`) |

5. The fields that Cursor does not set, and the effect:
   - `requireAuthenticationBeforeSpawn`: no sign-in check before a turn
     (`core.ts:883-895`).
   - `modelListStandsIn`: a turn can wait for the startup model read
     (`core.ts:374, 859`).
   - `skipsAuthenticate` and `signInRequest`: no sign-in request state for
     Cursor (`driver-hooks.ts:75-130`).
   - `transformEnv`, `applyTurnEnv` and `resolveCommand`: no change of the
     environment, the home folder or the command.
   - `sessionScopedApproval`: the approval level is on the argv.
   - `clientFileSystem`: the client offers no file system and no terminal
     (`core.ts:1081-1085`).
   - `toolScopeSessionParams`: a narrower set of the engine's own tools is
     refused (`core.ts:865-866`).
   - `images`, `effortLevels`, `stderrFailure`, `statusLog` and
     `shareProcess`: not set. Cursor has one process for each thread.
6. Engine behaviour is keyed by the `driverKind` string in at least six
   lists: `approval-mode.ts:24, 44`, `capabilities.ts:17-49`,
   `tool-scope-support.ts:4-9`, `index.ts:1067-1070`,
   `engine-memory.ts:56` and `process-buckets.ts:29`.

### 3.2 Launch: argv, environment, home folder and working folder

1. The approval level of the turn sets `fullAuto` (`core.ts:870-872`):
   - With no level, `config.fullAuto` stays.
   - With a level, `fullAuto` is true only for `full`. Every driver supports
     `full` (`approval-mode.ts:25`).
   - Cursor does not offer `edits` (`approval-mode.ts:24`). `custom` is for
     Codex only (`:23`).
   - A turn that controls the local computer with `fullAuto` but without
     `full` throws (`core.ts:873-876`).
2. The argv (`cursor.ts:495-500`), in this order:
   1. `--force` when `fullAuto`, else `--auto-review` when the level is
      `auto`, else nothing.
   2. `--approve-mcps`, always.
   3. `--model <slug>` when the turn has a model.
   4. `acp`. Global flags must come before it (`cursor.ts:493`).

| Level | Text in the UI | Cursor argv |
|---|---|---|
| Ask | "Ask for approval" (`en.json:3564`) | none |
| Auto | "Approve for me" (`en.json:3570`) | `--auto-review` |
| Full | "Full access" (`en.json:3573`) | `--force` |

3. Under Ask, Cursor sends `session/request_permission` and the core shows
   an approval card. The core answers alone only when `allowsAlone` says
   so, or for the old `fullAuto` with no level. It never answers a question
   alone (`core.ts:593-599`).
4. The process contract has the argv and `fullAuto` (`core.ts:933-934`),
   and a hash of the environment (`core.ts:930`). So a new model or a new
   level starts a new process.
5. The environment (`core.ts:340-355`):
   - It starts from all of `process.env`, the instance environment and an
     augmented `PATH`.
   - It removes each provider or workspace key except `credentialEnv`.
   - It runs `stripControlPlaneEnv`.
6. The home folder and the working folder:
   - The core sets no `HOME` and no `CURSOR_CONFIG_DIR`.
   - Engine homes exist only on a Team Cloud. "Off a Team Cloud nothing is
     started and every spawn keeps the server's HOME"
     (`engine-homes.ts:1-3, 92-95`).
   - The working folder is `turn.cwd`, else the workspace, else the home
     folder (`core.ts:881`).
   - `CURSOR_CONFIG_DIR` is read only to make the lock key of the sign-in
     (`cursor.ts:336`, `device-auth.ts:105-112`).
7. The spawn: `spawnCli(..., "bot")` (`core.ts:543`). The owner `"bot"`
   turns on the engine homes and the bot box (`procs.ts:415-420`). POSIX
   gets `detached: true`, so the engine has its own process group. Windows
   gets `windowsHide: true` (`procs.ts:433-434`).
8. Since `fbdd6d96f`, an unboxed process for a bot also gets a GitHub
   credential in its environment, and the app releases it at exit
   (`procs.ts:422-424, 443, 453`).

### 3.3 Windows: launch and stop

1. The reason, in the code: libuv ignores `PATHEXT`, and Node refuses to
   start a `.cmd` without a shell. A shell is not used, because `cmd`
   changes JSON in the argv (`env-path.ts:240-243`).
2. `whichWin` finds `cursor-agent.cmd` through `PATHEXT`
   (`env-path.ts:281-296`). `resolveWord` gives a `.cmd` to `parseCmdShim`
   (`env-path.ts:451-453`). When the shim has no npm, Node or `.exe`
   target, `parsePowerShellFileShim` reads it (`env-path.ts:415-419`).
3. `parsePowerShellFileShim` (`env-path.ts:354-378`):
   - The first word of the line must be `powershell.exe` or `pwsh.exe`, as
     an absolute `.exe` path that exists, or a name that `whichWin` finds
     (`:307, 323-337`). Only `%SystemRoot%` and `%WINDIR%` are expanded.
   - A line with `-Command`, `-c`, `-e`, `-ec`, `-enc` or `-EncodedCommand`
     is skipped (`:308-316, 363`).
   - The `-File` operand must be a `.ps1` that exists in the folder of the
     shim. It can start with `%SCRIPT_DIR%` or `%~dp0`, or be an absolute
     path in that folder. Each other form is refused (`:340-351`).
   - `%*` is removed and the turn arguments are added at the end
     (`:369-375, 453`).
   - When no rule matches, the `.cmd` stays as the command and the spawn
     fails (`:453-454`).
4. The command line must be 30,000 characters or less, else
   `ENAMETOOLONG` (`procs.ts:37-58`).
5. The known folder `%LOCALAPPDATA%\cursor-agent` is on the `PATH` of the
   app (`env-path.ts:65-66`).
6. The stop on Windows (`procs.ts:676-711`):
   1. If the root process exited already, the stop returns `true`.
   2. Else it runs `taskkill /PID <pid> /T /F` and waits for `exit`.
   3. If `taskkill` fails, it calls `child.kill()` on the root and waits.
   4. After 5 s it returns `false` (`procs.ts:691`).
7. Windows has no engine run tag and no engine record
   (`procs.ts:428, 463-469`). A server that starts again after a crash
   cannot find and stop the engines that the old server left.
8. A possible orphan (an inference, not tested): on a time-out, `execCli`
   uses the time limit of `execFile`, which stops only the direct child,
   `powershell.exe` (`procs.ts:536`). 2 s later `killCliTree` runs
   (`procs.ts:516, 552`). It sees that the root exited and returns at
   once (`procs.ts:676`), so `taskkill /T` does not run. The Node process
   of Cursor can then stay alive. This applies to `--version`, `status`,
   `models` and `--list-models`.

### 3.4 The version check and the pinned release

1. The snapshot (`core.ts:1426-1450`):
   1. It runs `cli --version` with a limit of 8 s (`core.ts:1430`).
   2. On an error, the reason is "not found", "no permission", "timed out
      after 8 seconds" or a general text. The output of the CLI is never
      shown (`core.ts:1433-1440`).
   3. `versionFromProbe` takes the trimmed standard output, else the first
      line of the standard error (`version-probe.ts:4-9`).
   4. The output must match
      `^\d{4}\.\d{1,2}\.\d{1,2}(?:-[0-9a-z]+)?\s*$` (`cursor.ts:315`). Else
      the reason is "`<cli>` is not Cursor's CLI: it answered --version as
      another program." and `notEngineCli` is `true`
      (`version-probe.ts:14-16`, `core.ts:1445-1448`).
   5. Then `isAuthenticated` runs, after the version check
      (`core.ts:1449`).
2. Why the shape check exists: a person can paste the install command
   `curl https://cursor.com/install -fsS | bash` as the CLI path. Then curl
   answers `--version` (`version-probe.ts:12`, `docs/cursor.md:41-43`).
3. The Settings "Test" button uses the same pattern, with a limit of 10 s
   and 64 KiB (`server/cli-probe.ts:28-31, 50-53`).
4. The pin: `ENGINE_VERSIONS.cursorAgent` has the target and the minimum
   both at `2026.10.22-27dcf5f` (`engine-versions.ts:39`,
   `cursor-release.ts:12`).
   - The minimum is read only for the retry backoff of the updater
     (`engine-updates.ts:346`). No turn checks it.
   - The pin has no `acp` field, so the updater checks a new copy only with
     `--version`, not with an ACP `initialize` (`engine-updates.ts:216-222`).
   - The updater changes only copies that the app installed
     (`engine-updates.ts:1-4, 241-247`).

### 3.5 Model discovery

1. At create, Cursor sets no `resolveModelsOnCreate`, so the core opens
   the startup catalog (`core.ts:364-370`):
   - On a first start, `create()` waits for the full read
     (`startup-model-catalog.ts:148-152`).
   - On a later start with a saved list of the same build that is less than
     6 h old, nothing waits (`startup-model-catalog.ts:14, 154`).
   - Else the saved list is used and a read runs after the first engine
     read. The turns wait for that read (`startup-model-catalog.ts:155-158`,
     `core.ts:859`).
2. `fetchCursorModels` tries these sources in order (`cursor.ts:361-379`):
   1. An ACP discovery session: `discoverAcpModels(env, cli, ["acp"],
      {variants: false, clientCapabilitiesMeta})`, then
      `cursorCatalogFromSession`. An error gives `null`.
   2. `cursor-agent models`, then `cursor-agent --list-models`, each with
      a limit of 8 s (`cursor.ts:105, 284-296`). A non-zero exit or a
      time-out gives `null`. The text decoder runs first, then the JSON
      decoder.
   3. The catalog of the manifest (`currentCursorModels()`).
   So `resolveModels` never fails for Cursor.
3. The discovery session (`custom-model-catalog.ts:125-300`):
   - It runs in a new temporary folder `omb-acp-models-*` (`:131`), with the
     owner `"bot"` (`:201`).
   - It sends `initialize` with no file system and no terminal (`:218-226`),
     then `session/new {cwd, mcpServers: []}` (`:227`).
   - It refuses each request from the engine: a permission request gets
     `cancelled`, others get `-32601` (`:162-167`).
   - Limits: 8 s for each request and 60 s in all. 8 MiB of output and
     1 MiB for one line. 128 models, and 200 characters for an id or a label (`:12-16,
     99-114, 233`).
   - It sends `session/delete` only when `initialize` offers it (`:286`).
     Cursor gives no `exitGraceMs`, so the process stops at once (`:82-92`).
4. `cursorCatalogFromSession` (`cursor.ts:345-357`):
   - It removes the `[...]` part of each id. `default` becomes `auto`.
   - It keeps ids that match `^[a-z0-9][a-z0-9._:+-]*$`
     (`server/model-manifest/schema.ts:17`).
   - It keeps a static model only when it is the default, or when its base
     without `-fast` is offered.
   - The default is always the default of the manifest.
5. The text decoder (`cursor.ts:201-242`) reads lines `slug - Label`, with
   the markers `(default)` and `(current)`. It skips headings and blank
   lines. It keeps all static models first, with no base filter (`:241`).
6. The JSON decoder (`cursor.ts:161-199`) takes a list, or `models`,
   `data` or `modelIds`. `firstJsonValue` allows a banner before the JSON
   by trying shorter slices (`cursor.ts:109-127`).
7. The manifest: the downloaded one, else the bundled one
   (`manifest.ts:240-242`). The download has a limit of 10 s and 512 KiB,
   and it is kept for 1 h (`manifest.ts:16-22`). The bundled Cursor models
   are `auto` (the default), `composer-2.5`, `composer-2.5-fast`,
   `gpt-5.3-codex` and `claude-sonnet-5-thinking-high`.

### 3.6 Model selection at turn time

`configureSession` (`cursor.ts:520-556`) runs after the session opens.

1. With no model on the turn, it does nothing.
2. When the session offers a `fast` option and the slug ends in `-fast`,
   it removes the suffix (`:522-524`).
3. `matchCursorAcpModel` (`cursor.ts:44-95`) tries in this order:
   1. The exact id.
   2. The same base, with the variant that is not fast first.
   3. A `-fast` slug to a `fast=true` variant.
   4. An effort slug (`minimal`, `low`, `medium`, `high`, `xhigh` or
      `max`, `:31`) to a variant with that effort, else the nearest variant
      with `exact: false`.
   5. The display name.
   6. `auto` or `default` to `default[]`.
4. When the current model of the session is different, it sends
   `session/set_model`:
   - `-32601` (no such method): it returns, and the `--model` flag on the
     argv stays.
   - `-32602` (bad parameters): a notice "Cursor did not accept X in this
     session, so it runs Y", and the turn continues.
   - Any other error: the turn fails (`:528-549`).
5. A match that is not exact gives the notice "Cursor offers ... rather
   than ..." (`:552-554`).
6. Fast (`setCursorFast`, `:445-466`): it sends
   `session/set_config_option {configId: "fast", value}`. `-32602` means
   that the model has no Fast variant. The reply must echo the value. Else
   the turn fails with "Cursor did not confirm Fast ... so the turn was not
   sent."
7. The comment at `cursor.ts:533-534` says that current CLIs ignore
   `--model` in ACP. The flag is still on the argv (`:498`).

### 3.7 The sign-in status in the snapshot

1. The snapshot calls `isAuthenticated` after the version check
   (`core.ts:1449`). For Cursor it is `probeCursorAuth`
   (`cursor.ts:298-311`):
   1. When `CURSOR_API_KEY` or `CURSOR_AUTH_TOKEN` is not blank, it returns
      `true`. It does not check the key (`:303`).
   2. Else it runs `status --format json`, then `status`. Each run has a
      limit of 8 s (`:105, 304-309`).
   3. The JSON decoder reads `isAuthenticated`, `authenticated`,
      `loggedIn`, `logged_in`, `auth.*` and some `status` words
      (`:244-274`).
   4. The text decoder reads the negative words first ("not logged in",
      "unauthenticated", "logged out"), then the positive words
      (`:276-282`).
   5. When no run gives an answer, it returns `false` (`:310`).
2. The snapshot type has no "unknown" value (`contracts.ts:393`).
3. What reads `authenticated === false`:
   - The setup card shows the sign-in card (`EngineSetup.tsx:22-24, 616`).
   - The engine is not ready, so it is not chosen as a default or as a
     backup (`default-model-selection.ts:42-48`,
     `limit-takeover.ts:170-173`).
   - A sign-out hold of the engine continues while the snapshot says
     `false` (`limit-takeover.ts:152-155`, `index.ts:8655`).
4. A "Check" action forgets the cached state and the snapshots
   (`instances.ts:340-348`). A change from signed out to signed in calls the
   `onSignedIn` listeners (`registry.ts:482-484`).

### 3.8 The sign-in card (device sign-in)

The generic controller is `DeviceAuthController` (`device-auth.ts:92-387`).
Cursor gives it only the spec `CURSOR_SIGN_IN` (`cursor.ts:332-343`).

**Start.**

1. The card sends `POST /api/instances/:id/auth/start`
   (`DeviceSignIn.tsx:213-228`). The route is in
   `server/routes/instances.ts:319-414`, not in `server/index.ts`.
   - A body that is not JSON gives 415. An unknown instance gives 404
     (`instances.ts:332-334, 371`).
   - The owner of the flow is the browser session (`instances.ts:320-321`).
2. `ProviderAuthSessions.start` (`provider-auth-sessions.ts:32-64`):
   - A busy flow, or a live flow of another owner, gives 409 (`:35-36`).
   - The same owner with a live flow gets the same flow (`:38`).
   - A new flow is reserved for 15 min (`:39`).
3. `DeviceAuthController.start` (`device-auth.ts:115-163`):
   1. A flow that is still starting gives "A Cursor sign-in is already
      starting" (`:118-121`).
   2. It finds the credential home: `$CURSOR_CONFIG_DIR`, else `~/.cursor`.
      `HOME` must be absolute (`:105-113`).
   3. A set for the whole process refuses a second sign-in on the same home
      (`:126-129`).
   4. It starts two timers: 30 s to get a link, and 15 min for the flow
      (`:130-141`).
4. The pre-check runs `status --format json` and reads it with
   `readCursorStatus` (`device-auth.ts:153-161`, `cursor.ts:318-321`):
   - `signed-in` gives success with no login.
   - `signed-out` starts the login.
   - `unknown` fails with "Cursor could not confirm the existing sign-in on
     this server ..." (`device-auth.ts:160`).
5. The login child (`device-auth.ts:307-345`):
   - `cursor-agent login`, with `NO_COLOR=1` and `NO_OPEN_BROWSER=1`, in the
     credential home, with standard input closed (`:313-319`).
   - The child starts with the default owner, not `"bot"` (`:313`,
     `procs.ts:411`). So the login goes into the server's own `~/.cursor`.
   - Standard output and standard error go into one buffer. Past 16,384
     characters the flow fails (`:14, 323-326`).
   - `ENOENT` gives "Cursor is not installed on this server ..."
     (`:258-263`).
6. The link (`shared/device-sign-in.ts:57-71, 99-114`):
   - Only complete lines are read. The last line, which can be partial, is
     dropped (`:101`).
   - The label up to "link:" is removed (`:70`). Cursor 2026.10.22 prints
     "Open a browser and navigate to this link: https://cursor.com/
     loginDeepControl?..." (`:58`).
   - The link must be `https`, with no user, no password, no port and no
     fragment. The host must be `cursor.com` or `www.cursor.com`. The path
     must be `/loginDeepControl`.
   - The query keys must be only `challenge`, `uuid`, `mode`,
     `redirectTarget` and `supportsSelectedTeamLogin`, each one time.
     `challenge` has 16 to 128 characters and `uuid` has 8 to 64.
   - The newest valid link wins, so a new link replaces an old one
     (`device-sign-in.ts:105-107`, `device-auth.ts:329-330`).
7. The first valid link answers the start request with
   `{phase: "waiting", flowId, authorizationUrl, expiresAt}`
   (`device-auth.ts:330-335`).

**Finish.**

1. The person opens the link on any device. `cursor-agent login` exits by
   itself.
2. A non-zero exit, or no link, fails the flow. The text is "The Cursor
   sign-in link expired ..." when the output has "expired" or "timed out",
   else "Cursor sign-in did not finish ..." (`cursor.ts:324-327`). The words
   of the CLI are never shown, because its output has the sign-in request
   (`cursor.ts:323`).
3. Exit 0 starts a new timer of 30 s and runs `status` again. Only
   `signed-in` gives success (`device-auth.ts:143-152, 247-256`).
4. `finish` runs one time. It clears the timers and stops the child. On
   success it calls `refreshModels` (`device-auth.ts:347-371`,
   `core.ts:375`).
5. The card polls `GET /auth/status?flowId=` every 2 s
   (`DeviceSignIn.tsx:180-211`). A final phase sets `expiresAt` to 0 and
   forgets the snapshots (`provider-auth-sessions.ts:81`,
   `instances.ts:327`).

**Cancel, revoke and sign-out.**

1. Cancel: `POST /auth/cancel {flowId}`, with a body limit of 4,096 bytes
   (`DeviceSignIn.tsx:230-242`, `instances.ts:406-408`). A new revision drops
   the polls that are in progress (`provider-auth-sessions.ts:98-105`).
2. The stop of the child: `killCliTree(child, 1500)`. If that fails, SIGKILL
   goes to the group, then the code waits 1.5 s for `close`
   (`device-auth.ts:373-385`). The reason: a cancelled flow must not go on
   and write credentials (`:375`).
3. When the child does not stop, the phase is "failed" and the lock of the
   home stays until the OS reports `close` (`device-auth.ts:360-369`).
4. When a browser session ends, its flows are cancelled
   (`provider-auth-sessions.ts:124-135`, `index.ts:4622`).
5. Cursor has no `logoutArgs`, so the app has no sign-out for Cursor
   (`device-auth.ts:63`, `registry.ts:568`).

**What a waiting flow blocks.**

- Turns are not blocked. Only another sign-in on the same home is blocked
  (`device-auth.ts:15-16`).
- A waiting flow counts as `active` for up to 15 min
  (`provider-auth-sessions.ts:27-30, 39`). While it is active, the server
  holds back a fleet reload (`index.ts:11915`), maintenance
  (`index.ts:15134`) and a move (`index.ts:9370`).

### 3.9 ACP `authenticate`, error classes and the backup engine

1. `authenticate` (`core.ts:1092-1106`):
   - When a key is in the environment, the adapter sends no method. The
     reason, from its comment: Cursor's `cursor_login` handler "would then
     delete the saved login and open a browser once the token expired"
     (`cursor.ts:509-513`).
   - Else it sends `cursor_login`, with a limit of 300 s (`core.ts:280,
     1099`).
   - `authFailure: "continue"` ignores each error (`driver-hooks.ts:126`).
2. `classifyCursorError` (`cursor.ts:381-397`):
   - Code `-32000`, or the words "unauthoriz", "unauthenticated", "not
     signed in", "not logged in", "invalid api key", "invalid_credentials"
     or "authentication required", give `invalid_credentials`.
   - "inactive subscription", an expired subscription, or "upgrade your plan"
     give `inactive_subscription`.
   - `-32000` is the general server-error code of JSON-RPC.
3. In the catch of a turn (`core.ts:1374-1418`):
   - `needsAuth` is true for `invalid_credentials`,
     `inactive_subscription`, `insufficient_funds`, or a message equal to
     `loginNote`.
   - Then the turn ends with `stopReason: "auth_required"` and
     `setup: true` (`core.ts:1405, 1418`).
   - The startup recovery does not run (`core.ts:1381`).
   - A load error of that class is thrown again. The core does not open a
     new session in its place (`core.ts:1151-1157`).
4. The chain to a backup engine:
   1. `signedOutStop` is true for `auth_required`, except when the words say
      "credits" or "quota" (`limit-takeover.ts:89-93`).
   2. Then `noteSignedOut` stores the time (`limit-takeover.ts:157-162,
      325`).
   3. `signedOutHeld` is true for `SIGNED_OUT_RECHECK_MS` (60 min,
      `limit-resets.ts:110`), or longer while the snapshot says `false`
      (`limit-takeover.ts:152-155`, `index.ts:8655`).
   4. While it is held, a new turn of the bot goes to a backup
      (`limit-takeover.ts:218, 275`). The backups are the bot's own list,
      else the automatic recovery backup when it is on
      (`server/automatic-recovery.ts:10-19`, `index.ts:8655`). The switch is
      on unless `OMB_QUOTA_SWITCH=0` (`server/quota-switch.ts:85-87`).
   5. A turn that works, or a new sign-in, ends the hold
      (`limit-takeover.ts:164-169`).
5. So one Cursor error with code `-32000` can move a bot with a backup to
   that backup for 60 minutes. A status probe that times out at that time makes the hold
   longer.
6. How the reference fixed this for other engines:
   - Grok (`de4edc3ee`, first in v0.1.177): `grokReportedFailure` turns
     Grok's words "Authentication is temporarily unavailable ... still
     signed in" into a failure that is not a sign-out
     (`server/drivers/acp/grok-signals.ts`).
   - Antigravity (`e9d08cade`, first in v0.1.178): in the core, an
     `authenticate` error counts as a sign-out only when the sign-in request
     hook says so. Each other `authenticate` error is an ordinary start
     failure (`driver-hooks.ts:123-129`). An adapter with no `signInRequest`
     still turns each `authenticate` error into `loginNote` (`:127`).
   - Neither fix applies to Cursor. Cursor has no `signInRequest`, it uses
     `authFailure: "continue"`, and its `-32000` rule is in its own
     `classifyError`.

### 3.10 The question card

1. Cursor 2026.10.01 sends `cursor/ask_question` with
   `{questions: [{id, prompt, options: [{id, label}], allowMultiple}]}`. It
   sends no `sessionId` (`cursor.ts:399-410`).
2. The core refuses with `-32602` "ask needs 1 to 6 distinct questions with
   question text" when (`question-requests.ts:33-36`, `cursor.ts:406-411`):
   - `questions` is not a list.
   - There are more than 6 (`ask-question.ts:13`).
   - A question does not parse.
   - Two questions have the same text.
3. The card opens as `request.opened` with `requestType: "question"` and
   `tool: "ask_user"`. A single question with 2 or more options and no
   multiple choice gets flat `choices` (`question-requests.ts:50-63`,
   `ask-question.ts:170-175`).
4. The card has no time limit. It stays open until the person answers or
   the turn ends (`question-requests.ts:23`).
5. The answer (`cursor.ts:414-440`):
   - Each picked label maps back to one option id. A label must match
     exactly one option.
   - All picks found: `{outcome: "answered", answers: [{questionId,
     selectedOptionIds}]}`.
   - Free text, or a label that matches two options: `{outcome: "skipped",
     reason: <the answer, cut to a limit>}`.
   - No answer: `{outcome: "cancelled"}`.
6. A turn that ends while the card is open sends `cancelled`. A question
   that comes between turns gets `cancelled` and no card
   (`core.ts:527-531`).
7. A `session/request_permission` whose `toolCallId` starts with
   `interaction_` becomes a card with one question, made from the option
   names (`core.ts:594, 613-619`).
8. Other `cursor/*` methods, for example `cursor/create_plan`, get `-32601`
   (`core.ts:573-576`, `docs/cursor.md:131-133`).

### 3.11 The agent tools on this engine

1. `--approve-mcps` is on each launch (`cursor.ts:497`). The comment says
   that it covers the app's own servers from `session/new`
   (`cursor.ts:493`).
2. The app's own MCP servers go to Cursor as HTTP endpoints, with a tool
   budget of `engineTools ?? 32` (`core.ts:898-899`). The test shows the
   entry `{type: "http", name: "agents", url: "<harness>/api/internal/
   mcp-http/agents"}`, a bearer header, and a header with only the bot id,
   the thread id and one flag (`cursor.test.ts:374-391`).
3. Cursor keeps the first MCP set for the life of the process. So a new
   bearer starts a new process (`cursor.ts:501-502`, `core.ts:430, 960`,
   `cursor.test.ts:392-415`).
4. The tool scope kind is `"mcp"`. A narrower set of Cursor's own tools is
   refused with "native tool selection is not supported by this engine"
   (`tool-scope-support.ts:8, 16-21`, `core.ts:865-867`).
5. The client offers no file system and no terminal (`core.ts:1081-1085`).
   Cursor uses its own tools.

### 3.12 Changes of the core from `ed8cb7278` to `ad27f0716`

Two commits change the files in scope: `1b7f33c39` (Google's native
Antigravity CLI) and `fbdd6d96f` (GitHub access for the git of bots).

1. **New file `session-system.ts` (45 lines).** An engine can hold the
   system text in its session, in the parameters of `session/new`,
   `session/load` and `session/resume`, and not in the prompt text.
   - `sessionSystem` gives the held text when the adapter's
     `sessionSystemPrompt` hook says yes: the stable half of the system
     text, else all of it, else `""` (`session-system.ts:9-12`).
   - `liveSessionKey` adds a SHA-256 of that text to the session key
     (`:15-17`). So a session that holds another system text is loaded
     again (`:14`).
   - The core compares that key for the reuse of a process when
     `restartOnMcpChange` is set (`core.ts:960`), and for the reuse of a
     live session always (`core.ts:1127`).
   - `turnPrompt` (`:26-45`) builds the prompt. When the session holds the
     system text, the prompt has none. A short note goes as the last text
     block, because "Antigravity 1.5.14 reads commands only in a prompt's
     first block" (`:21`, `core.ts:1296`).
   - The reason, from the hook doc: an engine that reads the system text in
     the prompt "would read words of it as the person's commands"
     (`driver-hooks.ts:32-33`).
   - An edge case: the hash includes the team roster, so a change of the
     roster loads the session again (`session-system.ts:11`,
     `prompt-split.ts:145-150`).
2. **New hooks.** `AcpDriverHooks` has 15 hooks, not 13
   (`driver-hooks.ts:9-59`):
   - `skipsAuthenticate(instanceId)` (`:23-26`): the core never sends
     `authenticate`, and a refused session counts as a sign-in request. The
     reason: the engine "answers by opening a browser nobody sees". The
     core reads it at `core.ts:1092, 1476-1478`.
   - `sessionSystemPrompt(init, instanceId)` (`:32-34`).
3. **Changed hooks.**
   - `sessionSetupParams` takes the held system text (`driver-hooks.ts:29-31`,
     `core.ts:1139, 1182`).
   - `signInRequest.rpcError` takes `instanceId` (`driver-hooks.ts:20`).
   - The turn of `allowsAlone` has `approvalModeNow` (`driver-hooks.ts:39`).
   - `processStarted` runs for turns and for background text
     (`driver-hooks.ts:27`, `core.ts:1469`).
4. **`background-text.ts`.** A new option `signInRefused` turns a refused
   `session/new` into `loginNote` (`background-text.ts:64-65, 206`,
   `core.ts:1478`). An RPC error keeps its `code` and `data` (`:132`).
5. **`procs.ts`.** The GitHub credential of section 3.2, item 8.
6. **Effect on Cursor: none.** Cursor sets none of the 15 hooks. Only
   `server/drivers/antigravity.ts:251-272` uses the new hooks.
7. **Sizes.** `core.ts` 1573 to 1559 lines. `driver-hooks.ts` 122 to 130.
   `background-text.ts` 231 to 233.

### 3.13 Install on a Cloud (record only)

Out of our plan. What it is, and where it is:

- **What:** a Cloud has no terminal. On Linux, the setup card offers
  "Install Cursor here". The app downloads Cursor's pinned build into its
  data folder and runs it (`docs/cursor.md:47-66`).
- **Pinned release:** `server/drivers/acp/cursor-release.ts:1-27`
  (version `2026.10.22-27dcf5f`, host `downloads.cursor.com`, linux-x64 and
  linux-arm64 only, a SHA-256 for each archive and for the launcher).
  Cursor publishes no checksum file. The reference measured the hashes on
  2026-11-04 (`cursor-release.ts:3-5`).
- **List of releases:** `server/standalone-releases.ts:1-8`.
- **Download, unpack and checks:** `server/engine-standalone.ts`
  (download `:386-462`, unpack `:465-565`, version probe `:620-638`, install
  folder `:711-756`, activation `:838-876`, boot check `:285-329`, shared
  run `:887-894`).
- **Install route and fallback to npm:** `server/engine-install.ts:51-102`,
  `server/harness/registry.ts:351-373`, `server/routes/instances.ts:363-368`.
- **Card:** `src/components/EngineSetup.tsx:190-215, 725-750`.
- **Updater:** `server/engine-updates.ts:241-260`.
- **Tests:** `cursor-sign-in.test.ts:85-97`, `EngineSetup.cursor.test.ts`.

## 4. The data

### 4.1 Config and types

- `AcpConfig {cli, fullAuto, workspace?, steer?}` (`core.ts:90-93`). The
  default for Cursor is `{cli: "cursor-agent", fullAuto: false}`
  (`cursor.test.ts:153-158`).
- `AcpSupport` (`core.ts:96-277`): 10 required fields and about 70 optional
  fields. `AcpDriverHooks` (`driver-hooks.ts:9-59`): 15 optional hooks.
- `DeviceSignIn` spec (`device-auth.ts:30-53`): `provider`, `product`,
  `account`, `homeEnv`, `homeDir`, `loginArgs`, `env`, `install`,
  `failure()`, `status {args, read}`, and optional `signedIn`,
  `signInState`, `logoutArgs`, `removeCredentials`.
- `DeviceSignInState`: `signed-in`, `signed-out`, `other`, `unknown`
  (`device-auth.ts:28`).
- `DeviceAuthOptions` (`device-auth.ts:80-89`): `cli`, `environment`,
  `onAuthenticated`, `signInRejected`, `startupTimeoutMs` (30,000),
  `lifetimeMs` (900,000), `terminateTimeoutMs` (1,500).
- `ProviderAuthenticationStart` and `ProviderAuthenticationStatus`
  (`contracts.ts:504-521`): `phase` (`waiting`, `succeeded`, `verifying`,
  `failed`, `expired`, `cancelled`), `flowId`, `authorizationUrl`,
  `expiresAt`, `userCode?`, `message?`.
- The flow of a browser session (`provider-auth-sessions.ts:5-14`):
  `instance`, `owner`, `flowId`, `expiresAt`, `busy`, `starting`,
  `revoked`, `revision`.
- `AcpQuestionRequest {parse, cancelled}` (`question-requests.ts:6-11`).
- `TurnPrompt {input, note, split}` (`session-system.ts:19-24`).
- `EngineCapabilities {resume, nativeReviewer, full, edits, subagents}`
  (`capabilities.ts:4-10`). For Cursor: `true`, `true`, `true`, `false`,
  `false`.
- `EngineVersionPin {target, minimum, acp?, formerNpm?}`
  (`engine-versions.ts:11-23`).

### 4.2 Limits and constants

| Name | Value | Source |
|---|---|---|
| Status and model probe of Cursor | 8 s | `cursor.ts:105` |
| `--version` in the snapshot | 8 s | `core.ts:1430` |
| Kill after a probe time-out | 2 s | `procs.ts:516` |
| Discovery: one request, all, output, one line | 8 s, 60 s, 8 MiB, 1 MiB | `custom-model-catalog.ts:12-15` |
| Discovery: models, id, label | 128, 200, 200 | `custom-model-catalog.ts:16, 99-114` |
| Saved model list is fresh | 6 h | `startup-model-catalog.ts:14` |
| `initialize`, `authenticate`, `session/new`, set options | 300 s | `core.ts:280-283` |
| `session/load` | 120 s | `core.ts:284` |
| Sign-in: link, flow, confirm | 30 s, 15 min, 30 s | `device-auth.ts:130-150` |
| Sign-in: output buffer | 16,384 characters | `device-auth.ts:14` |
| Sign-in: stop of the child | 1.5 s | `device-auth.ts:373-385` |
| Sign-in card poll | 2 s | `DeviceSignIn.tsx:205` |
| Sign-out hold | 60 min | `limit-resets.ts:110` |
| Questions on one card | 1 to 6 | `ask-question.ts:13` |
| Tool budget for the app's MCP | 32 | `core.ts:899` |
| Windows command line | 30,000 characters | `procs.ts:37-58` |
| Windows kill wait | 5 s | `procs.ts:691` |

### 4.3 Environment variables

- Read: `CURSOR_API_KEY` and `CURSOR_AUTH_TOKEN` (`cursor.ts:303, 505,
  511-513`). `CURSOR_CONFIG_DIR`, only for the lock key (`cursor.ts:336`).
  `HOME` or `USERPROFILE` (`device-auth.ts:107`). `LOCALAPPDATA`,
  `PATHEXT`, `SystemRoot` and `WINDIR` on Windows (`env-path.ts:58, 282,
  318-321`).
- Set: `NO_OPEN_BROWSER=1` and `NO_COLOR=1` for the sign-in commands
  (`cursor.ts:339`, `device-auth.ts:313`). An augmented `PATH`
  (`core.ts:344`).
- Never set: `HOME` and `CURSOR_CONFIG_DIR` for the engine process.

### 4.4 Files on disk

| Path | Who writes it | Source |
|---|---|---|
| `~/.cursor` or `$CURSOR_CONFIG_DIR` | The CLI, at login. The server's own home | `cursor.ts:329-337` |
| `$HOME/.config/cursor/auth.json` | The fake login CLI only, mode 0600 | `fake-cursor-login-cli.ts:17, 38-43` |
| `$TMPDIR/omb-acp-models-*` | The discovery, then removed | `custom-model-catalog.ts:131, 293` |
| `<data>/providers/model-manifest/model-manifest.json` | The manifest download | `manifest.ts:25-27` |
| The startup model cache | `startup-model-catalog.ts` | path not read |
| `<data>/tools/standalone/cursor-agent/<version>/` | Install on a Cloud | `engine-standalone.ts:7-12, 711-756` |

Nothing of the Cursor adapter is in the store of the app, except the
session cursor of a thread that the core keeps (see `acp-core.md`, 4.3).

## 5. The UI

### 5.1 The sign-in card

- Title: "Sign in to {name}" (`engineSetup.signInTitle`, `en.json:3746`).
  Description: "Sign in with your Cursor account so your bots can use Cursor.
  You finish in your own browser, on any device; no terminal or password
  sharing needed." (`engineSetup.cursor.description`, `en.json:6328`).
- The texts of Cursor (`DeviceSignIn.tsx:64-75`, `en.json:6329-6335`):

| Key | Text |
|---|---|
| `engineSetup.cursor.start` | "Sign in to Cursor" |
| `engineSetup.cursor.open` | "Open Cursor sign-in" |
| `engineSetup.cursor.security` | "Only open a link you requested here. This signs Cursor in for your bots with your Cursor plan and its limits. Your password stays with Cursor, and the sign-in stays where your bots run." |
| `engineSetup.cursor.connected` | "Cursor connected. Your models are being refreshed." |
| `engineSetup.cursor.failed` | "Sign-in could not be completed. Try again, or check the Cursor installation." |
| `engineSetup.cursor.invalidChallenge` | "Cursor did not return a valid sign-in link. Cancel and try again." |

- Shared texts: "Getting your sign-in code…" (`en.json:6289`), "Waiting for
  you to finish signing in…" (`:6293`), "Sign-in expires at {time}"
  (`:6269`), "Cancel sign-in" (`:6299`), "This code expired. Request a new
  code to try again." (`:6302`), "Try again" (`:6307`). Three of them speak
  of a code, but Cursor has no code.
- States (`DeviceSignIn.tsx:102-151`):
  1. A final phase: one line, green for success.
  2. Waiting with a link that is not valid: the alert `invalidChallenge`.
     The UI checks the link again (`:105, 117-119`).
  3. Waiting with a valid link: a button that opens the link, a spinner, the
     expiry time and the security note (`:121-150`).
- Buttons: Cancel while waiting. Else Start or "Try again" (`:254-270`).
- "Prefer a terminal?" shows `cursor-agent login` only when the desktop can
  open a terminal on the server and the server is not a Cloud
  (`EngineSetup.tsx:35-37, 716-721`).
- After success, the card refreshes the instances and the models. A failed
  refresh does not show as a failed sign-in (`DeviceSignIn.tsx:172-178`).

### 5.2 The setup card and the approval levels

- The sign-in card shows when the engine is available and
  `authenticated === false` (`EngineSetup.tsx:22-24, 616`). The device card
  is used when the method is `device-code` (`EngineSetup.tsx:621`,
  `registry.ts:561-567`).
- On a Cloud: "Install Cursor here" with "About 185 MB download.", and no
  "Set CLI" or "Copy command" (`EngineSetup.cursor.test.ts:48-57`).
- The approval levels: "Ask for approval", "Approve for me" and "Full
  access" (`en.json:3564, 3570, 3573`). Edits is not offered for Cursor.
- Notices in the chat: the model notices of section 3.6 and the Fast error
  (`cursor.ts:462-463, 540-541, 553`).

## 6. The tests

### 6.1 How the tests are built

1. Pure decoders are tested with plain values: the sign-in status, the
   model catalog, the session model ids, the error classes and the link.
2. The driver runs against the fake ACP CLI as a real child process
   (`server/testing/fake-acp-cli.ts`). The tests set `FAKE_ACP_*`
   environment variables. The fake writes what it saw (argv, environment,
   config) to files next to `FAKE_ACP_DUMP` (`fake-acp-cli.ts:393-415`).
   It copies only a fixed list of environment keys (`:328-392`).
3. `FAKE_ACP_VERSION = "2026.10.22-27dcf5f"` is set for the whole driver
   block, because the driver checks the version shape
   (`cursor.test.ts:138-140`).
4. The sign-in runs against a second fake, `fake-cursor-login-cli.ts`. It
   refuses to run without `OMB_DEVICE_AUTH_FIXTURE=1` and an absolute
   `HOME` (`:11-14`). It waits for a trigger file, then writes
   `auth.json` (`:37-43`).
5. The UI cards are rendered to static markup and in happy-dom.
6. Each test uses a temporary folder. `afterEach` removes the Cursor keys
   and the fake variables (`cursor.test.ts:142-151`). Two variables are
   removed in a `finally` of one test (`cursor.test.ts:235-236`).
7. The live-reply matrix runs Cursor with 13 other ACP drivers, each with
   its own `HOME` (`live-reply-matrix.test.ts:36-62`).

### 6.2 What the tests guarantee

- **Launch:** the argv for Full, Auto and Ask (`cursor.test.ts:287-324,
  456-482`). `CURSOR_API_KEY` reaches the child and `XAI_API_KEY` does not
  (`cursor.test.ts:287-312`). The Grok driver removes the Cursor keys
  (`acp.test.ts:1225-1253`).
- **Version:** the pattern accepts Cursor builds and refuses curl, Grok,
  Claude Code and Codex outputs (`cursor-sign-in.test.ts:28-34`). A curl
  banner gives `notEngineCli` (`:56-66`).
- **Models:** the decoders (`cursor.test.ts:51-124`). The catalog from
  `models` and from `session/new` (`:168-231`). The id mapping
  (`:655-764`). The setters: `set_model`, Fast, `-32602`, `-32601`, no
  second `set_model` in a reused session, and effort slugs (`:631-652,
  768-963`). A Fast option that does not change fails the turn before the
  prompt (`:837-867`).
- **Questions:** two questions, a multiple choice and a label with a comma.
  Free text as `skipped`. Cancel at the end of the turn and between
  turns. Bad parameters, seven questions, two equal questions, and no time
  limit after 72 h (`cursor.test.ts:485-628`).
- **Tools:** the HTTP MCP entry and its headers, and a new process for a
  new bearer (`cursor.test.ts:361-415`).
- **Sign-in:** the decoders (`cursor.test.ts:28-47`). A key in the
  environment means signed in (`:240-254`). `cursor_login` is sent only
  with no key (`:422-454`). `readCursorStatus` (`cursor-sign-in.test.ts:
  126-131`). The link rules (`:101-124`). The flow: start, success,
  cancel, a bad link, a crash with a secret in the output that is not
  shown (`:134-205`).
- **UI:** the Cursor card shows only a link button and no code
  (`DeviceSignIn.test.ts:161-188`). The Cloud and desktop setup cards
  (`EngineSetup.cursor.test.ts`).
- **Errors:** `classifyCursorError` (`cursor.test.ts:127-134`).

### 6.3 What the tests do not cover

- A status probe that fails or hangs, and what the snapshot, the registry
  or the backup engine then do (changelog problem 1). The fake `status`
  cannot fail or hang (`fake-acp-cli.ts:429-434`).
- Windows: each process test of the sign-in is skipped on Windows
  (`cursor-sign-in.test.ts:36, 134`). No test covers a `.cmd` or `.ps1`
  shim, or the stop of a process tree on Windows (changelog problem 2).
- The person's own Cursor config: no test points `HOME` at a folder with a
  Cursor MCP config and checks what reaches the bot (changelog problem 3).
- A slow `models` or discovery probe at create (changelog problem 4).
- The Ask level with `fullAuto: false` and the Full level with
  `fullAuto: false` are not in one table.
- The tool calls of Cursor itself. The matrix checks only text and message
  ids (`live-reply-matrix.test.ts:75`).
- Most tests use real timers. Only the question test uses fake timers
  (`cursor.test.ts:615`).

## 7. Ours compared

Our crate is `bot-engine` (step 9). The module names below are proposals.
Step 9 has no code yet.

| Reference | What it does | Ours |
|---|---|---|
| `server/drivers/acp/core.ts`, `driver-hooks.ts`, `session-system.ts` | The generic ACP client and its hooks | `bot-engine::acp` (core). An `AcpAdapter` trait with the required methods, and default methods for the optional ones. Capability flags in place of `driverKind` lists (`AGENTS.md`) |
| `server/drivers/acp/cursor.ts:468-559` | The Cursor adapter | `bot-engine::acp::cursor`, after the custom adapter of [P102](../../plan/acp-core.md) |
| `server/drivers/acp/cursor.ts:24-95, 520-556` | The model id mapping and the Fast option | `bot-engine::acp::cursor::models`, pure functions with table tests |
| `server/drivers/acp/custom-model-catalog.ts` | The model discovery through `session/new` | `bot-engine::acp::discovery`, shared by all adapters |
| `server/drivers/device-auth.ts`, `shared/device-sign-in.ts` | The device sign-in: a login child, a link, a confirm | `bot-engine::sign_in`. One state machine. The adapter gives the login args, the status reader and the link rule |
| `server/provider-auth-sessions.ts`, `server/routes/instances.ts:319-414` | Sign-in flows for each browser session, and the routes | `bot-core` holds the flow state. `bot-desktop` shows the card. We have no HTTP server (D10) |
| `server/drivers/acp/question-requests.ts`, `cursor.ts:399-443` | The question card for a vendor method | `bot-engine::acp::questions` for the generic part. The Cursor codec in the adapter. The card is step 10 or later |
| `packages/phone-protocol/src/approval-mode.ts`, `cursor.ts:495-500` | The level to argv | A pure function in the adapter: level to argv, with a table test. The level type is in `bot-protocol` (step 10) |
| `server/procs.ts`, `server/env-path.ts:236-472` | Spawn, the Windows shim, the stop of a process tree | `bot-engine::process`, with a Job Object on Windows ([P68](../../plan/engine-process-lifecycle.md)) |
| `server/drivers/acp/version-probe.ts`, `core.ts:1426-1450` | The version check | `bot-engine::acp::probe`, with a typed "not this CLI" reason ([P11](../../plan/newer-config-unavailable.md)) |
| `server/host/limit-takeover.ts` | The backup engine after a sign-out | Not in step 9. `bot-core`, later |
| `server/engine-standalone.ts`, `cursor-release.ts` | Install on a Cloud | Not in our plan |

**What is the same in our plan.** One generic core under small adapters
(`changelog.md`, section 7). A fake ACP CLI for the tests
([P63](../../plan/driver-contract.md)). An allow list for the environment
([P61](../../plan/driver-contract.md)). A home folder that the app owns
([P103](../../plan/acp-core.md)).

**What the Cursor adapter shows that the custom adapter does not.** A
sign-in, a model mapping, a question method, a version shape, an approval
flag on the argv and MCP over HTTP. So the Cursor adapter tests more hooks
of the core. The custom adapter of P102 stays the simpler first adapter.

## 8. Where we can be better

1. **A sign-in result with three values: signed in, signed out, unknown.**
   A time-out, a failed start or output that does not parse gives
   "unknown", and the app keeps the last known value.
   - Reason: changelog problem 1 is present here. The snapshot path
     returns `false` for a failure (`cursor.ts:310`), but the sign-in card
     path returns `unknown` for the same failure (`cursor.ts:318-321`). The
     two readers disagree.
2. **No generic error code means "signed out".** Only a known code or known
   words of the engine give a sign-in error. Each other error is a failure
   that can be tried again.
   - Reason: `-32000` is the general server error of JSON-RPC, and it gives
     a 60-minute move to a backup (`cursor.ts:386`, section 3.9).
3. **The fix for a sign-in hiccup is in the core, for each adapter.**
   - Reason: the reference fixed it two times, in two releases
     (`de4edc3ee`, `e9d08cade`). The first fix is in Grok's code. The second
     is in the core, but only for adapters with `signInRequest`. Neither
     reaches Cursor.
4. **An engine home that the app owns, with `CURSOR_CONFIG_DIR` or `HOME`
   set, and an empty working folder as the default.**
   - Reason: changelog problem 3. Off a Team Cloud, Cursor reads the
     server's `~/.cursor` (`engine-homes.ts:1-3`, `core.ts:881`).
     `--approve-mcps` can then approve servers of the person (not
     verified, section 9).
5. **Turns use the saved model list and do not wait for the model read.**
   - Reason: changelog problem 4. Without `modelListStandsIn`, each Cursor
     turn can wait up to 60 s for the discovery, then for up to two probes
     of 8 s (`core.ts:859`, `custom-model-catalog.ts:12-13`,
     `cursor.ts:105`). The reference has the fix as an option that Cursor
     does not use.
6. **One deadline for the snapshot.** The version check and the sign-in
   check run at the same time, and the sign-in result is kept for a time.
   - Reason: today they run one after the other. The version check takes
     up to 8 s. Then two runs of 8 s follow, each with a kill after 2 s more (`core.ts:1430, 1449`,
     `cursor.ts:304-309`, `procs.ts:516`).
7. **On Windows, a Job Object for each engine and each probe.**
   - Reason: changelog problem 2. A probe time-out can leave the Node
     process of Cursor alive, because the stop sees that `powershell.exe`
     exited and does not run `taskkill /T` (`procs.ts:536, 676`). Windows
     has no run tag, so a new server cannot find old engines
     (`procs.ts:428`).
8. **A shim that does not parse gives a typed refusal**, not a spawn of the
   `.cmd` that then fails.
   - Reason: `env-path.ts:453-454`. The person sees a spawn error and no
     reason.
9. **Do not send `authenticate` when it can open a browser that nobody
   sees.** Use `skipsAuthenticate` and the sign-in card.
   - Reason: with no key, Cursor gets `cursor_login`, which can wait up to
     300 s (`cursor.ts:509-510`, `core.ts:1099`). The core already has the
     hook for this (`driver-hooks.ts:23-26`).
10. **The approval argv is a pure function with a table test.**
    - Reason: today it is tested only through a full spawn, and one case is
      missing (`cursor.test.ts:318-324`).
11. **Check the minimum version in the snapshot, with a typed reason.**
    - Reason: the minimum is read only for the retry backoff
      (`engine-updates.ts:346`). A CLI that is too old runs until it fails.
12. **Drop what equals the core default, and what Cursor ignores.**
    - Reason: `buildPromptText` is the same as the default (`cursor.ts:558`,
      `core.ts:1275-1279`). `--model` is ignored by current CLIs in ACP
      (`cursor.ts:533-534`), but it is in the process contract and starts a
      new process for a new model (`core.ts:933`).
13. **The texts of the sign-in card do not speak of a code** when the
    engine has none.
    - Reason: `en.json:6289, 6301, 6302`.
14. **A sign-in that nobody polls stops holding back maintenance.**
    - Reason: a waiting flow holds back reloads, maintenance and moves for
      up to 15 min (`provider-auth-sessions.ts:27-30`, `index.ts:9370,
      11915, 15134`).
15. **Adapter hooks are synchronous or have a deadline.**
    - Reason: the hooks of the reference run on the event loop with no
      limit (`driver-hooks.ts:90, 98`). `promptOutcome` is awaited with no
      limit (`core.ts:1288`).
16. **The system text that a session holds is a typed property, keyed
    without the team roster.**
    - Reason: `session-system.ts:11` hashes the roster, so a change of the
      roster loads the session again. The reference avoids this for other
      engines (`prompt-split.ts:145-150`).

**Problems of `changelog.md`, section 5, that the reference has here.**

| Problem | Present? | Where |
|---|---|---|
| Sign-in to an engine, and CLIs that change | Yes. A probe failure is "signed out". `-32000` is "signed out" and moves a bot with a backup to it. Neither hiccup fix (Grok, and the core for adapters with `signInRequest`) reaches Cursor. The output of `status` and `models` changes between versions, so the adapter has two decoders for each | `cursor.ts:298-311, 381-397`, `limit-takeover.ts:152-155, 325`, `de4edc3ee`, `e9d08cade` |
| Process control on Windows | In part. The launch has no shell and has strict rules. The stop can leave an orphan after a probe time-out (inference). No run tag on Windows. No test on Windows | `env-path.ts:340-378`, `procs.ts:428, 536, 676`, `cursor-sign-in.test.ts:36, 134` |
| The person's own engine config reaches the bots | Yes. No engine home off a Team Cloud, no `CURSOR_CONFIG_DIR`, the default working folder is the home folder, and `--approve-mcps` always | `engine-homes.ts:1-3`, `core.ts:881`, `cursor.ts:497` |
| One slow or stuck part blocks the others | Yes, for the threads of one Cursor instance: turns wait for the model read. A waiting sign-in holds back maintenance for up to 15 min. Other engines are not blocked | `core.ts:859`, `startup-model-catalog.ts:155-158`, `provider-auth-sessions.ts:27-30` |
| A wait that does not end | In part. A question card has no time limit, by design. `promptOutcome` and `isAuthenticated` are awaited with no limit of the core | `question-requests.ts:23`, `core.ts:887, 1288, 1449` |
| A secret in the wrong place | No, for this adapter. The sign-in never shows the output of the CLI, and the link has no token | `cursor.ts:323-327`, `device-sign-in.ts:61-68`, `cursor-sign-in.test.ts:192-204` |

## 9. Not verified

### 9.1 Facts that no subagent confirmed

- Whether Cursor reads `~/.cursor/mcp.json`, `~/.cursor/rules`, user rules,
  or `AGENTS.md` and `CLAUDE.md` in the working folder. And whether
  `--approve-mcps` approves those servers too.
- What `--auto-review` does in Cursor. The only source is the comment at
  `cursor.ts:494`.
- Whether Cursor uses JSON-RPC `-32000` for errors that are not about the
  sign-in.
- What the takeover does for a bot with no backup when its engine is held
  as signed out. `limit-takeover.ts:218` falls back to `picked`, which no
  subagent read.
- Whether `cursor_login` really opens a browser when the token expires. The
  only source is the comment at `cursor.ts:509-510`.
- The Windows orphan of section 3.3, item 8. It is an inference from the
  behaviour of Node and from `procs.ts:536, 676`. No test shows it.
- The exact content of Cursor's Windows shim. Only the comments of the
  reference say that it is a `powershell -File` line with a `.ps1` beside
  it (`env-path.ts:65-66`, `docs/cursor.md:22`).
- Where the real CLI keeps its login, and whether `CURSOR_CONFIG_DIR` moves
  it. Only the path of the fake is known (`~/.config/cursor/auth.json`).
  The lock key of the sign-in is `~/.cursor` (`cursor.ts:337`).
- On a Team Cloud, whether `status` (run with `execCli`, with no engine
  home) reads the same home as the turns (spawned with an engine home).
- Whether Cursor keeps the sessions of the discovery on disk, and whether
  it offers `session/delete`.
- Whether the `models` getter stays live after `createAcpDriver` reads it
  at `core.ts:334`.
- The time limit of the `configureSession` requests that pass no limit.
  Possibly the 300 s of `SESSION_CONFIG_TIMEOUT` (`core.ts:281`).
- Whether `engineSetup.cursor.connectedAccount` is used. No subagent found a
  reader.
- What `ensureDirs()` creates in the tests (`cursor.test.ts:187, 288`), and
  whether it touches a real data folder.
- How the `.ts` fakes run on Windows (a shebang and `chmod`).
- The path of the startup model cache, and of `standaloneEnginesRoot`.
- Which keys `stripControlPlaneEnv` and `PROVIDER_CREDENTIAL_ENV` remove.

### 9.2 Lines of `acp-core.md` that are now wrong

`acp-core.md` read the reference at `ed8cb7278`. At `ad27f0716`, these
lines are wrong.

**Line shifts.** Under `server/drivers/acp/`, only `background-text.ts`,
`core.ts`, `driver-hooks.ts` and `session-system.ts` changed. Citations of
the other files there still hold.

- `core.ts`: +1 for old lines 22 to 1117, +2 for old lines 1118 to 1268,
  −14 from old line 1291. Examples: `:868` is `:869`, `:1534` is `:1520`,
  `:339-354` is `:340-355`, `:1306-1319` is `:1292-1305`, `:1444` is
  `:1430`.
- `driver-hooks.ts`: +8 after old line 18.
- `fake-acp-cli.ts` has 1957 lines, not 1954, and the new variable
  `FAKE_ACP_CAPABILITIES_META`. The global slots at `:573-589` are now at
  `:574-590`.
- `antigravity.ts:163` is now `:211`. `antigravity.ts:261` is now `:333`
  (cited at `acp-core.md:252, 311, 1117`).
- `index.ts` lines after old line 3934 are 5 lower. For example `:4922-4924`
  is `:4917-4919`.

**Claims that are wrong.**

| `acp-core.md` line | Claim | At `ad27f0716` |
|---|---|---|
| 40, 108 | `core.ts` has 1573 lines | 1559 lines |
| 43 | `AcpSupport` is at `core.ts:95-276` | `core.ts:96-277` |
| 43-44, 73-75 | `AcpDriverHooks` is at `driver-hooks.ts:9-51`, with 13 hooks | `driver-hooks.ts:9-59`, with 15 hooks. New: `skipsAuthenticate` (`:26`) and `sessionSystemPrompt` (`:34`) |
| 110 | `driver-hooks.ts` has 122 lines | 130 lines |
| 119 | `background-text.ts` has 231 lines | 233 lines |
| 300 | `allowsAlone` is at `driver-hooks.ts:29-31` | `:37-39`. Its turn has `approvalModeNow` (`:39`) |
| 377-381 | The reuse of a pooled process under `restartOnMcpChange` checks the MCP set | It also checks the hash of the held system text (`core.ts:960`) |
| 422-427 | `authenticate` is skipped only for a local inject. `authFailure` is at `driver-hooks.ts:115-121` | It is also skipped under `skipsAuthenticate` (`core.ts:1092`). `authenticateFailed` is at `driver-hooks.ts:123-129` |
| 429 | Ten of the 18 adapters return `null` from `pickAuthMethod` | Antigravity also sends no `authenticate`, through `skipsAuthenticate` (`antigravity.ts:251`). The one-shot forces `null` (`core.ts:1476`) |
| 437-438 | A live session is kept when its MCP set did not change | It must also match the hash of the held system text (`core.ts:1127`, `session-system.ts:15-17`) |
| 443-445 | The load parameters are `{sessionId, cwd, mcpServers, ...}` | Plus `sessionSetupParams(init, heldSystem())` (`core.ts:1139`). The same on `session/new` (`:1182`) |
| 504-513 | The prompt text is built at `core.ts:1270-1296` | `turnPrompt` builds it (`session-system.ts:26-45`, `core.ts:1273`). With a held system text, the prompt has no system text, and a note goes as the last block (`core.ts:1296`) |
| 621 | Waits with no limit at `core.ts:858, 886, 910, 970, 1120, 1302` | `:859, 887, 911, 971, 1122, 1288` |
| 685 | The sign-in request hook | It now takes `instanceId` (`driver-hooks.ts:118`) |
| 733 | The `initialize` check of the updater is at `engine-updates.ts:208-214` | `engine-updates.ts:216-222`. It does not run for Cursor, because the pin of Cursor has no `acp` field (`engine-versions.ts:39`) |
| 745-752 | Six ways to sign in | A seventh: no `authenticate`, and a refused `session/new` or `session/load` counts as a sign-in request (`driver-hooks.ts:23-26`, `core.ts:1092, 1476-1478`, `background-text.ts:206`) |
| 834-848 | The groups of `AcpSupport` | The sign-in group lacks `skipsAuthenticate` and `signInRequest`. The session group lacks `sessionSystemPrompt` and `sessionSetupParams` |
| 1150-1152 | The inside of `spawnCli` is not verified | An unboxed spawn for a bot gets a GitHub credential (`procs.ts:422-424, 443, 453`) |
| 1165 | The claims of `docs/cursor.md` about the Windows `.ps1` launch are not verified | Verified: `env-path.ts:340-378, 415-419, 451-453` |
