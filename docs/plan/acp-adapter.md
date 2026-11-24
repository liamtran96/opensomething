# Plan: One ACP adapter

The proposals from the research file
[`../research/features/acp-adapter.md`](../research/features/acp-adapter.md)
(batch 5, reference commit `ad27f0716`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 9, 10.
- **State:** all open.
- **The main finding:** an adapter is one `AcpSupport` object. The type has
  10 required fields, about 70 optional fields and 15 optional hooks
  (`server/drivers/acp/core.ts:96-277`, `:103-234`,
  `server/drivers/acp/driver-hooks.ts:9-59`). The Cursor adapter sets the 10
  required fields, 13 optional fields and none of the hooks
  (`server/drivers/acp/cursor.ts:468-559`). Since batch 4 the core holds the
  system text for each session (`server/drivers/acp/session-system.ts`) and
  has the hooks `skipsAuthenticate` and `processStarted`.

## Proposals

- **P145 (step 9). A sign-in result with three values.** The sign-in check
  of an adapter gives signed in, signed out or unknown. A time-out, a failed
  start or output that does not parse gives "unknown", and the core keeps
  the last known value. Only "signed out" shows the sign-in card or starts a
  sign-out hold.
  - Why: the problem "a brief sign-in hiccup is no longer reported as signed
    out" (v0.1.177, v0.1.178). The snapshot reader of Cursor returns `false`
    when both `status` runs fail or take more than 8 s, and the card reader
    returns `unknown` for the same failure. `false` makes the engine not
    ready and keeps a sign-out hold alive. The fixes of the reference do not
    reach Cursor.
  - Source: `cursor.ts:105`, `:298-311`, `:318-321`, `server/contracts.ts:393`,
    `server/default-model-selection.ts:42-48`,
    `server/host/limit-takeover.ts:152-155`, `server/index.ts:8655`,
    commits `de4edc3ee`, `e9d08cade`, `driver-hooks.ts:123-129`.
- **P146 (step 9). A general RPC error never means "signed out".** An
  adapter maps an error to "signed out" only from a known code or known
  words of its engine. The JSON-RPC server error `-32000` alone is an
  ordinary failure that the app can try again.
  - Why: Cursor maps each `-32000` to `invalid_credentials`. The turn then
    ends as `auth_required`, the engine counts as signed out for 60 minutes,
    and a bot with a backup moves to it.
  - Source: `cursor.ts:381-397`, `core.ts:1151-1157`, `:1376-1381`, `:1405`,
    `:1418`, `limit-takeover.ts:89-93`, `:218`, `:275`, `:325`,
    `server/limit-resets.ts:110`, `server/automatic-recovery.ts:10-19`.
- **P147 (step 9). The saved model list stands in by default.** A turn uses
  the saved model list and does not wait for the model read. The read runs
  in the background with one deadline. The reference has this as
  `modelListStandsIn`, and Cursor does not set it.
  - Why: the problem "one slow or stuck part blocks the others". Without the
    option, each turn waits for the read. The read of Cursor can take 60 s,
    then up to two probes of 8 s each.
  - Source: `core.ts:374`, `:859`, `server/drivers/acp/startup-refresh.ts:45`,
    `server/startup-model-catalog.ts:14`, `:148-158`,
    `server/drivers/acp/custom-model-catalog.ts:12-13`, `cursor.ts:361-379`,
    `server/procs.ts:516`.
- **P148 (step 9). `skipsAuthenticate` as a capability.** The adapter trait
  has a capability that says "do not send ACP `authenticate`". The Cursor
  adapter sets it when no key is in the environment, and the person signs in
  through the sign-in card.
  - Why: the problem "a wait that does not end". With no key, Cursor gets
    `cursor_login`, which can wait up to 300 s. The comment of the adapter
    says that this opens a browser when the token expires. That it really
    opens a browser is not verified.
  - Source: `driver-hooks.ts:23-26`, `:126`, `core.ts:280`, `:1092`, `:1099`,
    `:1476-1478`, `cursor.ts:509-514`.
- **P149 (step 9, a new decision or a change to D8). An adapter trait with
  10 required methods.** The required methods are `driver_kind`,
  `display_name`, `models`, `default_cli`, `native_source`, `login_note`,
  `spawn_args`, `pick_auth_method`, `auth_failure` and `is_authenticated`.
  Each other behaviour is a default method or a capability flag that comes
  with the step that reads it (D22). Engine behaviour is never keyed by a
  list of driver names.
  - Why: the required set follows the reference. The reference keys engine
    behaviour by the `driverKind` string in at least six lists, against the
    rule of `AGENTS.md`.
  - Source: `core.ts:96-277`, `cursor.ts:468-559`,
    `packages/phone-protocol/src/approval-mode.ts:24`, `:44`,
    `server/runtime/capabilities.ts:17-49`, `shared/tool-scope-support.ts:4-9`,
    `server/index.ts:1067-1070`, `server/engine-memory.ts:56`,
    `server/perf/process-buckets.ts:29`.
- **P150 (step 10). The approval flags are a pure function.** The adapter
  maps the approval level to its argv in one pure function, with a table
  test for each level, with and without `fullAuto`.
  - Why: the reference builds the argv inside `spawnArgs` and tests it only
    through a full spawn. The case Full with `fullAuto: false` has no test.
  - Source: `cursor.ts:495-500`, `cursor.test.ts:287-324`, `:456-482`.
- **P151 (step 10 or later). The core owns the question card of a vendor
  method.** The core has the generic part: 1 to 6 questions, no time limit,
  a cancel at the end of a turn and between turns, and `-32602` for bad
  parameters. The adapter gives only the codec of its method.
  - Why: follows the reference, which already splits it this way. The fake
    CLI takes the method as a parameter. Relates to P135 of
    [`question-cards.md`](question-cards.md).
  - Source: `server/drivers/acp/question-requests.ts:6-64`,
    `cursor.ts:399-443`, `core.ts:527-531`, `:571-572`,
    `server/testing/fake-acp-cli.ts:1908`, `cursor.test.ts:485-628`.
- **P152 (step 9, the Cursor pull requests). Remove what equals the
  default.** The Cursor adapter has no `build_prompt_text`, because the
  default is the same. `--model` is not on the argv and not in the process
  contract. The model is set with `session/set_model`.
  - Why: less code. The comment of the adapter says that current CLIs ignore
    `--model` in ACP, but the flag is on the argv and in the process
    contract, so a new model starts a new process. Not verified with a live
    CLI.
  - Source: `cursor.ts:498`, `:533-534`, `:558`, `core.ts:933`, `:1275-1279`.

## New facts for proposals that exist

- **P102 (step 9).** The custom adapter stays the first adapter, and Cursor
  comes after it. The custom adapter has no sign-in and no engine bug.
  Cursor has a device sign-in, a model mapping, a question method, a version
  shape, an approval flag and MCP over HTTP, so it is a good second test.
  - Source: `server/drivers/acp/custom.ts:18-34`, `cursor.ts:468-559`.
- **P103 (step 9).** Also set `CURSOR_CONFIG_DIR` (or `HOME`) to the engine
  home of the app. The default working folder of a turn is an empty folder
  of the app. A test points `HOME` at a folder with a Cursor MCP config and
  checks that the bot does not get those servers. Off a Team Cloud, each
  engine process keeps the server's `HOME`. The sign-in writes the server's
  own `~/.cursor`. No test covers it.
  - Source: `server/engine-homes/engine-homes.ts:1-3`, `:92-95`,
    `cursor.ts:329-331`, `:336`, `:497`, `server/drivers/device-auth.ts:105-112`,
    `:313`, `core.ts:881`, `procs.ts:411`.
- **P68 and P41 (step 9).** Each probe (`--version`, `status`, `models`) runs
  in a Job Object too. The Windows test starts the engine through a `.cmd`
  shim that runs `powershell.exe -File`, and checks that a probe time-out
  leaves no process. On a time-out, `execCli` stops only `powershell.exe`,
  and `killCliTree` returns at once when the root exited. This is an
  inference, and no test shows it.
  - Source: `procs.ts:428`, `:463-469`, `:516`, `:536`, `:552`, `:676`,
    `server/env-path.ts:340-378`, `:415-419`, `:451-453`,
    `cursor-sign-in.test.ts:36`, `:134`.
- **P11 (step 9 or later).** A new reason "too old": the snapshot compares
  the version with the minimum of the pin. The reference reads the minimum
  only for the retry backoff of the updater.
  - Source: `server/engine-versions.ts:39`, `server/engine-updates.ts:216-222`,
    `:346`.
- **`acp-core.md`.** Section 9 of the research file lists the lines of
  [`../research/features/acp-core.md`](../research/features/acp-core.md)
  that moved between `ed8cb7278` and `ad27f0716`.
