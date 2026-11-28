# Engines and accounts

The record of how the reference project lists its engines, checks them, and
signs them in and out, with one or more accounts for each engine.

- Reference: the reference project at commit `140172d88` (2026-11-26,
  version 0.1.182). Each path below is relative to its clone.
- Updated on 2026-11-28 to commit `e1cc6a290` (2026-11-28). The tag
  v0.1.186 is commit `70eb44c1a`, and `e1cc6a290` has commits after it.
  The section "Changes up to `e1cc6a290` (v0.1.186)" lists the changes of
  this feature from `140172d88` to `e1cc6a290`. This file is correct for
  those changes at `e1cc6a290`. The other parts were read at `140172d88`,
  and their line numbers are from that commit, unless a line gives
  `e1cc6a290`. Four subagents read the diffs of the range, and the main
  session checked the key lines against the code.
- Rows of [`reference-features.md`](../reference-features.md), group
  "later":
  - "The list of engines and `doctor`; named accounts; many engines and API
    providers; the engine library in the settings and in onboarding"
    (`engines.md`, `engines-ui.md`, parts 7, 9 and 25).
  - "Sign-in and sign-out of engine accounts in the settings"
    (`chatgpt-plan.md`, `claude-account.md`, `codex-account.md`).
  - "Sign-in to an engine with a device code in the browser"
    (`server-settings.md`).
  - "The default model after the first start" (`onboarding.md`).
  - A gateway as a provider (docs site `providers/gateway.mdx`).
- For steps 4 and 9 of [`../../plan/README.md`](../../plan/README.md), and
  for the later steps of the settings and the accounts.
- Eight subagents read the files in groups: `engine-list-status`,
  `doctor-headless`, `cli-accounts`, `device-code-sign-in`,
  `antigravity-account`, `providers-gateway-default-model`,
  `ui-settings-ai` and `ui-library-setup-sign-in`. Together they read 335
  files completely and about 65 in ranges (section 2). Some files were read
  by two groups. Five writers made sections 3
  to 6 from their reports.
- The lead checked 26 key claims of the readers and 6 lines of the writers at the cited lines. All 32 agree with the
  code:
  - `server/harness/registry.ts:96-114`, `:285-305`, `:600-622`
  - `server/harness/probe-hold.ts:13-29`, `:34-40`, `:64-73`
  - `server/engine-check.ts:12-14`
  - `server/harness/engine-status-file.ts:64`, `:98-114`, `server/index.ts:802`
  - `server/routes/instances.ts:319-321`, `:372-379`, `:577-597`
  - `server/drivers/claude.ts:76-89`, `:119-135`
  - `server/drivers/claude-auth-status.ts:5-36`
  - `server/drivers/codex-login.ts:22-74`
  - `server/drivers/codex-shared-home.ts:14-33`, `:107-115`, `:145-158`
  - `server/drivers/device-auth.ts:14-16`, `:118-128`, `:137-141`, `:373-386`
  - `server/provider-auth-sessions.ts:1-45`, `:150-152`
  - `server/host/sign-in-resume.ts:18-23`, `:89-117`
  - `server/drivers/chatgpt-plan-auth.ts:10-15`, `:63-73`, `:368-388`
  - `server/drivers/acp/grok-sign-in.ts:19-23`, `:56-61`,
    `server/drivers/acp/cursor.ts:298-311`,
    `server/drivers/acp/mistral-vibe.ts:52-66`
  - `server/provider-key-check.ts:89-135`,
    `server/drivers/openai-compat.ts:205-216`, `server/credential-env.ts:55-78`
  - `server/default-model-selection.ts:41-94`, `shared/ai-ranking.ts:21-30`
  - `src/lib/simple-only.ts`, `src/lib/interface-mode.ts:20-32`
  - `server/headless/commands.ts:21-36`
- The writers checked the reports against the code again and corrected
  four claims of the readers:
  - The server doctor with no `--wait` does not end with exit 5. It throws
    the error again (`server/headless/commands.ts:91`). The exit code comes
    from the client error handling, which was not read (section 9).
  - The app does not show the library grid on the settings page. The only
    mount of `EnginesSettings` passes `simple`
    (`src/components/settings/pages/PlacePages.tsx:133`). So the check of
    `docs/verification/engines-ui.md` for "Ready / Needs setup" in two
    columns describes a layout that the app does not show at `140172d88`.
  - Two 403 texts of the browser sign-in
    (`server/routes/instances.ts:375-378`) and some line numbers.
  - Other client calls with a time limit: the onboarding test message
    (120 s), the pill poll (10 s) and the ConnectAi list (10 s).
- In quotes of the reference, `<product>` replaces the product name.
- Borders. Other research files have these parts. This file cites them and
  does not analyze them again:
  - the registry and "unavailable":
    [`newer-config-unavailable.md`](newer-config-unavailable.md).
  - the `Driver` trait and its flags:
    [`driver-contract.md`](driver-contract.md).
  - the 60 s shared engine checks of the composition root:
    [`composition-root.md`](composition-root.md).
  - the ACP protocol and one adapter: [`acp-core.md`](acp-core.md),
    [`acp-adapter.md`](acp-adapter.md).
  - the backup engine and provider recovery:
    [`recovery-and-pausing.md`](recovery-and-pausing.md).
  - key storage: [`write-only-secrets.md`](write-only-secrets.md),
    [`file-modes-atomic-writes-redaction.md`](file-modes-atomic-writes-redaction.md).
  - the chat API driver and custom engines:
    [`chat-streaming.md`](chat-streaming.md).
- Out of scope: the organization policy for engines (company models), all
  of `enterprise/`, the detail of each ACP engine except its account and
  sign-in code, the onboarding screens except the engine library and the
  default model, engine updates, and the plan usage numbers.

## 1. In short

The reference project does not run a model itself. It starts other
programs and services, and it calls each one an **engine**. An engine is
one of two kinds:

- an **engine CLI**: an agent program on the computer, such as Claude Code,
  Codex, Grok, Kimi or Cursor. The program has its own sign-in.
- an **API provider**: a remote HTTP API that the reference project calls
  itself with a saved key, such as OpenAI, OpenRouter or Mistral. It needs
  no program on the computer.

The config has a list of **instances**. An instance is one entry of the
engine list: a driver (the code that runs one kind of engine), a display
name, and its settings. One driver can have more than one instance.

A **named account** is an added instance of a built-in driver with its own
id, its own name and its own sign-in place. Examples: a second Claude
account, a second ChatGPT account, a second Google account for
Antigravity. The built-in instance (`claude`, `codex`, `antigravityAgent`)
uses the **shared sign-in of the computer**, which is the sign-in that the
person made in a terminal. The settings cannot remove the built-in
instance.

Each named account keeps its sign-in in its own **engine home**. An engine
home is a folder that the engine reads its sign-in and settings from, for
example `CLAUDE_CONFIG_DIR` for Claude or `CODEX_HOME` for Codex.

The **registry** is the module that owns the engine list
(`server/harness/registry.ts`). It reads the **status** of each engine: is
it installed, which version, is it signed in, which account. A status read
runs the engine CLI, so it can be slow or hang. The registry shares one
read between all callers, gives each read 60 s, and keeps the last status
when a read cannot finish (the **probe hold**). It saves the statuses to a
file, so that the next start can show them before the first read ends.

**Sign-in** has several forms. The server starts the sign-in, and the
window shows it:

- **device code**: the server runs the login command of the CLI. The
  command prints a web address and a short code. The person opens the
  address, types the code, and the CLI gets the sign-in.
- **paste code**: the person opens a link, signs in, and pastes a code back
  into the window (Claude).
- **browser**: a sign-in page opens on the computer, and the answer comes
  back to a local address (the ChatGPT plan, Mistral Vibe).

A **sign-in session** is the server's record of one sign-in that runs. It
lives in memory only, belongs to one browser session, a paired phone or
the local computer, and ends after 15 minutes. **Sign-in resume** sends a
person's message again when the engine that refused it as "signed out"
becomes signed in.

**`doctor`** is a command with three forms: the server doctor (is the
server up, how many engines are ready), the host doctor (containers, ports,
clock), and the data doctor (it checks and repairs the data folder). No
doctor checks the sign-in of an engine.

The **default model** of a new bot is not saved. The server computes it
again at each start and after each engine read. It prefers an engine that
is ready and that answered a short test message, and it ranks Claude, then
ChatGPT, then Gemini and Antigravity, then Grok, then the others.

A **gateway** is one address and one key for many models of many vendors.
The reference project takes a gateway as a Claude or Codex **custom
endpoint**, and reads its model list from `{base}/models`.

The **UI** of this feature is the AI page of the settings, with one row for
each engine and one card for the accounts of each provider. The **set-up
card** (`EngineSetup`) installs and signs in one engine. The settings, the
first screen, the chat, the model picker and the "no engines" page all use
it. The **engine library** is a grid of engine cards with "Ready" and "Needs
setup" groups (`EngineSections`). At `140172d88` the app does not show the
grid: the settings always open the Simple list
(`src/components/settings/pages/PlacePages.tsx:133`,
`src/components/EnginesSettings.tsx:598`), and the grid renders only in
tests (section 5.5).

What this file adds to the done research files:

- [`newer-config-unavailable.md`](newer-config-unavailable.md) has the
  shadow entry of an unknown driver. This file adds the status read, the
  probe hold, the status file and the routes of the list (sections 3.1 to
  3.4).
- [`composition-root.md`](composition-root.md) has the 60 s limit. This
  file shows that at `140172d88` the registry also holds a read that cannot
  finish, with a back-off. The row "One slow or stuck part" of
  `changelog.md` section 7 says the opposite and is out of date (section
  8).
- [`acp-adapter.md`](acp-adapter.md) has the sign-in of Cursor. This file
  adds the sign-in check of each other ACP engine, the device code
  controller and the sign-in sessions (sections 3.10 and 3.11).
- [`recovery-and-pausing.md`](recovery-and-pausing.md) has the sign-in
  resume as a recovery. This file adds its file, its limits and its read
  failure (section 3.12).
- New in this file: named accounts and engine homes, the ChatGPT plan, the
  Antigravity account, `doctor`, API keys, the gateway, the default model,
  the UI mode, and the UI of the AI page and the engine library.

## Changes up to `e1cc6a290` (v0.1.186)

All lines are at `e1cc6a290`. "Tag" means that the commit is in v0.1.186
(`git merge-base --is-ancestor <commit> 70eb44c1a`). "New fact" means that
this file did not describe the part before, so no statement changed.

### Sign-in

| Change | Commit | Tag or after | File and line | Sections of this file |
|---|---|---|---|---|
| Each end of a sign-in has a fixed reason code, on the status, on the error and in the error body of the route. Ten codes: `completed`, `wrong_code`, `refused`, `expired`, `cancelled`, `exited`, `interrupted`, `not_installed`, `timed_out`, `failed` | `46f016125` (#7723) | tag | `shared/sign-in-outcome.ts:4-25`; `server/drivers/device-auth.ts:351-366`; `server/drivers/claude-login-auth.ts:363`, `:376`; `server/routes/instances.ts:424-428` | 3.10, 3.11 |
| On a Cloud home, a code that the engine refused, or a login command that exited, ends the session at once (`expiresAt = 0`). The person can start again at once. A pasted value that is not a code keeps the session open. A desktop keeps the old behaviour | `46f016125` | tag | `server/provider-auth-sessions.ts:161-166`, `:175-185`, `:78-81` | 3.11 |
| On a Cloud home, a sign-in that a server stop cut short answers `interrupted`. The attempts are in `sign-in-trace.json` with only a hash of the instance and the flow id | `46f016125` | tag | `server/sign-in-trace.ts:14`, `:57`, `:126-142`; `server/provider-auth-sessions.ts:133-140` | 3.11 |
| On a Cloud home, the `active` getter records the outcome of a flow past its expiry. There is still no sweep timer | `46f016125` | tag | `server/provider-auth-sessions.ts:51-70` | 3.11 |
| The screens show "This sign-in was interrupted. Start again." with "Try again" for `interrupted`, or for a 404 or 410 with no reason. Only 401 and 403 show "expired" or the pairing note | `94a1a6d1f` | tag | `src/components/DeviceSignIn.tsx:31-35`, `:102-106`, `:134`; `src/components/ClaudeSignIn.tsx:107-120` | 3.19.3, 5.3, 5.5.4, 5.5.5 |
| The server refuses the code that Claude emails (digits only, up to 8), and the form warns about it. New refusal text with `wrong_code` | `94a1a6d1f` | tag | `server/drivers/claude-login-auth.ts:46-51`, `:154`; `src/components/ClaudeSignIn.tsx:33-36`, `:147` | 3.7, 5.5.5 |
| The Codex step "turn on device code sign-in in ChatGPT Settings → Security" is step 1 above the code. New Codex refusal text with the reason `refused` | `94a1a6d1f`, `5aea9c95e` | tag | `src/components/DeviceSignIn.tsx:145-149`; `server/drivers/codex-device-auth.ts:18`, `:23`, `:27-31` | 3.8, 5.3, 5.5.4 |
| A `failed` status with the reason `expired` shows the expired line | `1c82a0f0c` | tag | `src/components/DeviceSignIn.tsx:133` | 5.3 |
| The browser sign-in names the engine, not always Mistral | `5b07c79c4` (#5995) | tag | `src/components/EngineBrowserSignIn.tsx:18-21`; `src/components/EngineSetup.tsx:778` | 5.5.6 |
| A site sign-in card from an earlier turn settles when a later turn uses the site | `88c29487a` (#6285) | after | `server/host/sign-in-settle.ts:122-128` | 3.12 |
| A member (client scope) can read `GET /api/instances`, and gets a short list with no accounts, paths or addresses | `1b5e01402`, `d48ce8033` | after | `server/request-auth.ts:349-350`; `server/routes/instances.ts:76-83`, `:133` | 3.4 |
| The server trims each saved provider key | `88a285945` | tag | `server/config.ts:40` | 3.14 |

### Engines

| Change | Commit | Tag or after | File and line | Sections of this file |
|---|---|---|---|---|
| Cursor asks the CLI if it is signed in before the turn handshake sends `authenticate("cursor_login")`. A second `cursor_login` deletes the stored login of the CLI. The memory one-shot path does not have this check (see below) | `73f557e06` | tag | `server/drivers/acp/core.ts:236`, `:1086-1089`; `server/drivers/acp/cursor.ts:525-527` | 3.10 |
| Cursor model discovery has its own request limit of 20 s. Before, a cold start used 8 s, fell back to the static list, and kept it as confirmed for 6 hours | `30a835bb3` | tag | `server/drivers/acp/custom-model-catalog.ts:47`, `:198`; `server/drivers/acp/cursor.ts:368` | new fact |
| Devin authenticates with the API key in `authenticate._meta` when `WINDSURF_API_KEY` is set. Model discovery authenticates too. The native log replaces `_meta` with `[redacted]` | `e1f1140f6`, `ae38437b7` | tag | `server/drivers/acp/devin.ts:48-58`; `server/drivers/acp/core.ts:229-230`, `:1091-1093`; `server/drivers/acp/tool-log.ts:41-44` | 9 (new fact) |
| Codex reads its model catalog a second time before it falls back to the static list | `521d09ac5` (#7637) | tag | `server/drivers/codex-catalog.ts:425-428` | new fact |
| The Codex update card updates the copy that the app runs: an npm install into the app's own prefix, when the first Codex on the PATH is in the app's engine folder | `db45afce6` | tag | `server/drivers/codex-update.ts:35-38`, `:53` | new fact |
| A gateway name of Claude Opus 5.5 (1M), such as `claude/claude-opus-5-5[1m]` or `us.anthropic.claude-opus-5-5[1m]`, compacts at 1M tokens. Before, only the bare id did, and a gateway id compacted near 167k | `c4a3e3165` | tag | `server/drivers/claude.ts:189`, `:194` | new fact |
| An older Claude CLI starts a new session when the bot's instructions change (see [`engine-turn-lifecycle.md`](engine-turn-lifecycle.md) section 3.9) | `5638d70a4`, `642968816`, `af534cdca` | tag | `server/drivers/claude.ts:930-950` | new fact |
| A Codex conversation near the instruction limit of the provider moves to a new session (see [`engine-turn-lifecycle.md`](engine-turn-lifecycle.md) section 3.9) | `b683e4116`, `5b740a190` | tag | `server/drivers/codex-instructions.ts:39`, `:104-108` | new fact |
| A compacted Gemini or Antigravity tool schema keeps an `items` type on each array. A tuple, an unknown or a cyclic item becomes `{type: "string"}`. The walk has a limit of 8 hops and 4,096 visits | `08fc34c51`, `b66e84ee3` | tag | `server/tool-schema-profile.ts:240-292`; `server/tool-list-budget.ts:102-114` | new fact |
| Antigravity honours `usageMeter: false`: the plan usage does not read its quota | `95cf3d4c7` | tag | `server/plan-usage.ts:163`; `server/engine-limits.ts:107-108` | new fact |
| A provider's short throttle that Grok reports is a rate limit, not the usage limit of the plan | `c7b2af0bb` (#7635) | tag | `server/drivers/acp/grok-signals.ts:39`, `:44-47` | new fact |
| An added OpenAI-compatible server takes the workspace model and provider only at the workspace server's address | `4a62e5856` | tag | `server/credential-env.ts:70-74`; `server/config.ts:1186-1187`; `server/drivers/openai-compat.ts:167-170` | new fact |
| An OpenCode usage limit holds only the models of the provider that hit it | `645566fe8`, `2624b5105` (#4878) | after | `server/drivers/acp/opencode-go.ts:782-806`; `server/limit-resets.ts:163-173` | new fact (see [`recovery-and-pausing.md`](recovery-and-pausing.md)) |
| The bot settings refuse a backup AI that can never take over the bot's work | `248379166` | tag | `server/routes/bot-patch.ts:259-279` | new fact (see [`recovery-and-pausing.md`](recovery-and-pausing.md)) |

The commit message of `73f557e06` says: "The memory one-shot session gets
the same gate". The code does not do this. The one-shot path passes
`support.pickAuthMethod` with no status check (`server/drivers/acp/core.ts:1454`),
and `runAcpOneShot` sends `authenticate` when a method is picked
(`server/drivers/acp/background-text.ts:217-220`). So a Cursor memory
one-shot with no key in the environment can still send `cursor_login`.
Inferred: nobody checked when the reference project runs a memory one-shot
for Cursor.

## 2. Files read completely

Each group lists the files that its reader read completely, then the files that it read in ranges, with the ranges. The lists are copied from the reports of the readers.

### Group `engine-list-status`


- server/harness/registry.ts (762)
- server/harness/engine-status-file.ts (130)
- server/harness/probe-hold.ts (94)
- server/engine-check.ts (65)
- server/cli-probe.ts (71)
- server/cli-probe-cache.ts (179)
- server/cli-program.ts (34)
- server/cli-version-probe.ts (32)
- server/engine-records.ts (283)
- server/engine-roots.ts (22)
- server/engine-versions.ts (47)
- server/engine-start-failures.ts (26)
- server/host/engine-hints.ts (120)
- server/routes/instances.ts (606)
- server/routes/status.ts (253)
- server/doctor/checks/engine-runs.ts (62)
- shared/engine-sign-in.ts (14)
- src/components/EngineLiveCheck.tsx (55)
- server/first-engine-read.ts (14)
- server/harness/registry-probe-hold.test.ts (321)
- server/harness/registry-start-read.test.ts (248)
- server/harness/registry.test.ts (840)
- server/harness/engine-status-file.test.ts (44)
- server/harness/probe-hold.test.ts (69)
- server/engine-check.test.ts (68)
- server/cli-probe.test.ts (52)
- server/cli-probe-antigravity.test.ts (21)
- server/cli-probe-cache.test.ts (207)
- server/cli-probe-env.test.ts (120)
- server/cli-version-probe.test.ts (136)
- server/engine-records.test.ts (224)
- server/routes/instances.test.ts (441)
- server/engine-status-reads.e2e.test.ts (191)
- server/engine-status-seed.e2e.test.ts (69)
- server/host/engine-hints.test.ts (173)
- src/App.engine-status.test.ts (85)
- docs/verification/engines.md (197)

Read in ranges:
- server/contracts.ts (698): lines 100-121 and 395-698.
- server/index.ts (15,253): lines 795-810, 2785-2810, 11670-11712, 11769-11800.
- src/components/EngineLibrary.tsx: lines 12-20 only (`engineReady`).
- src/locales/en.json: lines 1839-1842 only.
- server/request-auth.ts: lines 10-66 only (`SERVICE_ALLOW`).
- server/instance-fleets.ts: lines 8-18 only (`CLAUDE_API_INSTANCE`).


### Group `doctor-headless`


Source (25): server/doctor/types.ts 73, server/doctor/files.ts 56, server/doctor/backup.ts 147, server/doctor/run.ts 172, server/doctor/command.ts 34, server/doctor/start.ts 78, server/doctor/checks/data-format.ts 29, server/doctor/checks/engine-runs.ts 62, server/doctor/checks/folders.ts 44, server/doctor/checks/lease.ts 33, server/doctor/checks/messages-db.ts 99, server/doctor/checks/registry.ts 91, server/doctor/checks/secret-modes.ts 44, server/doctor/checks/settings-file.ts 32, server/doctor/checks/temp-files.ts 28, server/testing/doctor-folders.ts 46, server/headless/host-doctor.ts 323, server/headless/commands.ts 236, server/headless/engine.ts 143, server/headless/login.ts 204, server/headless/args.ts 264, server/headless/main.ts 242, server/headless/context.ts 141, server/headless/output.ts 68, server/cli-usage.ts 137.

Tests (19): server/doctor/run.test.ts 123, server/doctor/start.test.ts 95, server/doctor/doctor.e2e.test.ts 148, server/doctor/checks/data-format.test.ts 50, engine-runs.test.ts 44, folders.test.ts 39, lease.test.ts 65, messages-db.test.ts 183, registry.test.ts 165, secret-modes.test.ts 32, settings-file.test.ts 32, temp-files.test.ts 41, server/headless/host-doctor.test.ts 195, server/headless/doctor.test.ts 93, server/headless/engine.test.ts 150, server/headless/login.e2e.test.ts 172, server/headless/args.test.ts 93, server/headless/main.test.ts 88, server/headless-cli.e2e.test.ts 232.

Docs (3): docs/headless-cli.md 569, docs/verification/headless-cli.md 39, docs/verification/engines.md 197.

Read in ranges (10): server/cli.ts 1053 (1-20, 970-990), server/index.ts 15253 (518, 655-672), server/routes/status.ts 253 (1-80), server/routes/instances.ts 606 (125-150), server/cloud-health.ts 376 (290-376), docs/self-hosting.md 2054 (2000-2054), docs/deploy-vps.md 814 (498-530, 612-630), scripts/control-omb.ts 556 (45-60, 470-495), deploy/update.sh 1011 (530-550, 605-630, 995-1011), deploy/update-npm.sh 293 (75-110). Also server/data-format.ts lines 30-53 only (by grep, to check the unreadable-marker rule).


### Group `cli-accounts`


| File | Lines |
|---|---|
| server/claude-accounts.ts | 111 |
| server/claude-accounts.test.ts | 73 |
| server/drivers/claude-login-auth.ts | 428 |
| server/drivers/claude-login-auth.test.ts | 270 |
| server/drivers/claude-auth-status.ts | 47 |
| server/drivers/claude-auth-recovery.ts | 116 |
| server/drivers/claude-auth-recovery.test.ts | 211 |
| server/drivers/claude-auth.test.ts | 229 |
| server/drivers/claude-accounts.test.ts | 218 |
| server/claude-account-api.test.ts | 458 |
| server/account-signin.ts | 144 |
| server/account-signin.test.ts | 65 |
| server/sign-in-env.ts | 38 |
| server/sign-in-env.test.ts | 36 |
| server/engine-homes/engine-homes.ts | 127 |
| server/engine-homes/engine-homes.test.ts | 120 |
| server/engine-homes/layout.ts | 124 |
| server/engine-homes/layout.test.ts | 93 |
| server/engine-homes/migrate.ts | 175 |
| server/engine-homes/migrate.test.ts | 101 |
| server/engine-homes/sign-ins.ts | 85 |
| server/engine-homes/sign-ins.test.ts | 93 |
| server/engine-homes/box.linux.test.ts | 73 |
| server/cloud-team-engine-homes.e2e.test.ts | 192 |
| server/drivers/chatgpt-plan-auth.ts | 443 |
| server/drivers/chatgpt-plan-auth.test.ts | 317 |
| server/drivers/chatgpt-plan-token-bridge.ts | 50 |
| server/drivers/chatgpt-plan-token-bridge.test.ts | 39 |
| server/drivers/chatgpt-plan-token-command.ts | 16 |
| server/chatgpt-plan-api.test.ts | 179 |
| server/drivers/codex-account-home.ts | 27 |
| server/drivers/codex-login.ts | 75 |
| server/drivers/codex-login.test.ts | 41 |
| server/drivers/codex-identity.ts | 89 |
| server/drivers/codex-identity.test.ts | 106 |
| server/drivers/codex-shared-home.ts | 159 |
| server/drivers/codex-shared-home.test.ts | 292 |
| server/drivers/codex-device-auth.ts | 47 |
| server/drivers/codex-device-auth.test.ts | 357 |
| server/drivers/codex-plan-token.ts | 79 |
| server/drivers/codex-plan-token.test.ts | 33 |
| server/testing/fake-codex-login-cli.ts | 39 |
| docs/verification/claude-account.md | 49 |
| docs/verification/codex-account.md | 51 |
| docs/verification/chatgpt-plan.md | 68 |
| scripts/verify-claude-account.ts | 61 |
| scripts/verify-claude-auth-settings.ts | 84 |
| scripts/verify-codex-account.ts | 62 |
| scripts/verify-chatgpt-plan.mjs | 106 |
| scripts/verify-codex-token-refresh.mjs | 69 |

50 files read completely.

Read in ranges:
- server/drivers/claude.ts (1989): 70-190, 262-321, 580-605, 668-697, 1060-1139, 1780-1920.
- server/drivers/codex.ts (1583): 76-145, 210-439, 1195-1219, 1390-1548.
- server/routes/instances.ts (606): 1-200, 296-430, 470-606.
- server/config.ts (1227): 690-764, 870-995, 1020-1060.
- server/index.ts (15253): 11695-11799.
- server/config-backup.ts (195): 1-100.
- server/request-auth.ts: 535-600.
- server/harness/probe-hold.ts: 34-46.


### Group `device-code-sign-in`


| Lines | Path |
|---|---|
| 387 | server/drivers/device-auth.ts |
| 125 | server/drivers/device-auth.test.ts |
| 114 | shared/device-sign-in.ts |
| 14 | shared/engine-sign-in.ts |
| 7 | shared/sign-in-notice.ts |
| 16 | shared/cli-login.ts |
| 152 | server/provider-auth-sessions.ts |
| 243 | server/provider-auth-sessions.test.ts |
| 76 | server/provider-auth-stale.test.ts |
| 20 | server/routes/sign-in.ts |
| 116 | server/routes/sign-in.test.ts |
| 189 | server/routes/cli-login.ts |
| 89 | server/routes/cli-login.test.ts |
| 94 | server/cli-login.e2e.test.ts |
| 170 | server/sign-in-code.e2e.test.ts |
| 297 | server/host/sign-in-resume.ts |
| 484 | server/host/sign-in-resume.test.ts |
| 136 | server/host/sign-in-settle.ts |
| 134 | server/host/sign-in-settle.test.ts |
| 158 | server/sign-in-resume.e2e.test.ts |
| 90 | server/sign-in-resume-antigravity.e2e.test.ts |
| 312 | server/drivers/acp/browser-auth.ts |
| 194 | server/drivers/acp/browser-auth.test.ts |
| 63 | server/drivers/acp/grok-sign-in.ts |
| 118 | server/drivers/acp/grok-sign-in.test.ts |
| 229 | server/drivers/acp/grok-device-auth.test.ts |
| 258 | server/drivers/acp/kimi-device-auth.test.ts |
| 205 | server/drivers/acp/cursor-sign-in.test.ts |
| 12 | server/drivers/acp/api-key-account.ts |
| 101 | server/grok-sign-in-api.test.ts |
| 34 | server/testing/fake-vibe-acp-signin.mjs |
| 59 | server/testing/fake-grok-login-cli.ts |
| 39 | server/testing/fake-codex-login-cli.ts |
| 47 | server/drivers/codex-device-auth.ts |
| 357 | server/drivers/codex-device-auth.test.ts |
| 67 | docs/verification/server-settings.md |
| 271 | src/components/DeviceSignIn.tsx |
| 84 | src/components/CliLoginCard.tsx |
| 76 | src/components/CliLoginCard.dom.test.ts |
| 114 | src/components/GrokSignIn.interaction.test.ts |
| 240 | src/components/onboarding/SignInPill.tsx |
| 206 | server/drivers/acp/mistral-vibe.ts |

42 files read completely.

Read in ranges (11 files):

| Lines | Path | Ranges |
|---|---|---|
| 656 | server/drivers/acp/grok.ts | 1-90, 232-252, 398-412, 505-535, 620-656 |
| 587 | server/drivers/acp/kimi.ts | 20-100, 425-490, 540-587 |
| 574 | server/drivers/acp/cursor.ts | 1-12, 105, 236-395, 480-530 |
| 282 | server/drivers/acp/copilot.ts | 15-40, 90-230 |
| 229 | server/drivers/acp/cline.ts | 15-150 |
| 855 | server/drivers/acp/opencode-go.ts | 318-340, 420-480, 645-745, 818-855 |
| 431 | server/drivers/acp/deepseek.ts | 1-20, 80-130, 345-362, 398-418 |
| 1541 | server/drivers/acp/core.ts | 19-20, 34, 128-145, 222-242, 330-380, 878-896, 1086-1108, 1352-1364, 1386-1396, 1424-1462, 1492-1500, 1522-1530 |
| 15253 | server/index.ts | 215, 526, 1355, 4616-4626, 6654, 8455, 8479, 8490, 8634, 9350, 9439, 11714-11722, 11762-11778, 11812-11818, 11888-11895, 12210-12220, 15115 |
| 606 | server/routes/instances.ts | 105-124, 312-420, 560-606 |
| 842 | src/components/EngineSetup.tsx | 18-35, 665-842 |

Also grepped, not read as files: `src/locales/en.json` lines 6337-6392 (only the `engineSetup.device`, `engineSetup.grok` and `engineSetup.chatgpt` keys quoted above).


### Group `antigravity-account`


| File | Lines | How |
|---|---|---|
| server/drivers/antigravity-account.ts | 82 | complete |
| server/drivers/antigravity-account.test.ts | 65 | complete |
| server/drivers/antigravity-auth.ts | 196 | complete |
| server/drivers/antigravity-native-login.ts | 295 | complete |
| server/drivers/antigravity-native-login.test.ts | 252 | complete |
| server/drivers/antigravity-native-sign-in.ts | 47 | complete |
| server/drivers/antigravity-native-sign-in.test.ts | 97 | complete |
| server/drivers/antigravity-native-signin.test.ts | 438 | complete |
| server/drivers/antigravity-native-status.ts | 188 | complete |
| server/drivers/antigravity-native-status.test.ts | 200 | complete |
| server/drivers/antigravity-sign-in.test.ts | 477 | complete |
| server/drivers/antigravity-cli-login.test.ts | 130 | complete |
| server/drivers/antigravity-opt-in.test.ts | 183 | complete |
| server/antigravity-account-api.test.ts | 148 | complete |
| server/antigravity-auth-blip.e2e.test.ts | 128 | complete |
| server/antigravity-first-install.test.ts | 175 | complete |
| server/cli-probe-antigravity.test.ts | 21 | complete |
| server/routes/antigravity-accounts.ts | 38 | complete |
| server/routes/instances-antigravity-native.test.ts | 304 | complete |
| server/testing/fake-antigravity-signin.ts | 39 | complete |
| server/drivers/antigravity-cli-install.ts | 289 | complete |
| apps/docs/content/docs/providers/antigravity.mdx | 59 | complete |
| server/sign-in-resume-antigravity.e2e.test.ts | 90 | complete |
| server/testing/antigravity-native-fixture.ts | 94 | complete |
| server/testing/fake-antigravity-cli.ts | 173 | complete |
| server/plan-usage-antigravity-native.test.ts | 94 | complete |
| src/components/AntigravitySwitchCli.tsx | 58 | complete |
| src/components/EnginesSettings.antigravity.dom.test.ts | 423 | complete |
| src/components/EnginesSettings.antigravity-switch.dom.test.ts | 168 | complete |
| src/components/EngineSetup.antigravity.test.ts | 174 | complete |
| docs/verification/engines-ui.md | 117 | complete |
| server/engine-updates-host.ts | 99 | complete |
| server/admin-audit-plan.ts | 43 | complete |
| server/drivers/antigravity.ts | 504 | ranges 110-504 |
| server/drivers/antigravity-acp.ts | 889 | ranges 54-463, 580-746, 795-889 |
| server/drivers/antigravity-runtime.ts | 604 | ranges 1-20, 55-114, 185-380, 500-604 |
| server/index.ts | 15253 | ranges 189, 616-617, 626-627, 804, 11700-11701, 12170-12189 |
| src/components/EnginesSettings.tsx | 621 | ranges 338-437, 536-575 |
| server/cloud-home-start.ts | 549 | range 25-59 |
| server/routes/instances.ts | 606 | ranges 336-348, 565-604 |
| server/request-auth.ts | 763 | range 535-542 |
| src/locales/en.json | 12251 | single lines cited: 2591, 3831, 3836, 3847, 3855, 3856, 4935, 4944-4953, 6340-6341 |

33 files read completely, 9 read in ranges.


### Group `providers-gateway-default-model`

- server/provider-key-check.ts (135), server/key-hint.ts (37), server/default-model-selection.ts (106), shared/ai-ranking.ts (65), server/tested-ai.ts (346), server/engine-check.ts (65), server/setup-mode.ts (109), server/routes/config-engine-effect.ts (30), server/key-rejections.ts (47), server/routes/status.ts (253), server/instance-fleets.ts (87), server/anthropic-key-env.ts (8), server/model-catalog/presets.ts (241), server/model-catalog/catalog.ts (371), server/model-catalog/trim.ts (235), server/drivers/openai-compat.ts (456), server/drivers/openrouter-free.ts (152), server/agent-endpoint-models.ts (102), server/drivers/builtIn.ts (66).
- src/lib/interface-mode.ts (78), src/lib/simple-only.ts (2), src/lib/prior-run.ts (10), src/lib/simple-mode-prompt.ts (47), src/lib/new-look.ts (105), src/components/SimpleModePrompt.tsx (103), src/components/keys/key-catalog.ts (296), src/components/keys/key-save.ts (68), src/components/keys/KeyRow.tsx (503).
- Tests: server/provider-key-check.test.ts (256), server/provider-key-flow.test.ts (191), server/opencode-provider-keys.e2e.test.ts (162), server/default-model-selection.test.ts (392), server/onboarding-model-default.e2e.test.ts (243), server/setup-mode.test.ts (224), server/model-providers-docs.test.ts (223), server/routes/config-engine-effect.test.ts (160), server/model-catalog/presets.test.ts (114), server/key-hint.test.ts (35), src/lib/interface-mode.test.ts (101), src/components/SimpleModePrompt.test.ts (134).
- Docs: apps/docs/content/docs/providers/index.mdx (96), model-providers.mdx (336), gateway.mdx (57), custom-acp.mdx (57), troubleshooting.mdx (39), meta.json (5).
- Read in ranges: server/credential-env.ts (106) 55-78, server/routes/config.ts (741) 1-250, 490-741, server/config.ts (1227) 1-40, 215-484, 640-1227, server/index.ts (15253) 770-780, 2469-2534, 2722-2737, 2788-2808, 7136-7143, 11674-11690 and one line 12220, server/routes/instances.ts (606) 186-258, 331-372, server/request-auth.test.ts 195-210, 600-621, 735-760, 783-788, src/components/AppNotices.tsx 340-365, src/locales/en.json lines 2145-2150, 4202-4213, 4308-4314, 8374-8391, 11491, docs/verification/onboarding.md (204) 1-80, docs/custom-engines.md (235) 50-64, 94-100, 140-176, 218-235.


### Group `ui-settings-ai`


- src/components/settings/pages/PlacePages.tsx (209)
- src/components/settings/pages/SettingsPageBody.tsx (34)
- src/components/EnginesSettings.tsx (621)
- src/components/EngineAccounts.tsx (412)
- src/components/HiddenProviders.tsx (90)
- src/components/EngineLibrary.tsx (140)
- src/components/EngineSetup.tsx (842)
- src/components/EngineLiveCheck.tsx (55)
- src/components/EngineAppCopy.tsx (65)
- src/components/EngineGroupLabel.tsx (21)
- src/components/EngineUsage.tsx (278)
- src/components/ProviderIcons.tsx (296)
- shared/provider-icon.ts (103)
- src/components/settings/pages/AccountPages.tsx (117)
- src/components/settings/account-summary.ts (72)
- src/state/use-show-instances.ts (13)
- src/state/engine-install.ts (68)
- src/components/ClaudeSignIn.tsx (198)
- src/components/ChatGptPlanStatus.tsx (49)
- src/components/AntigravitySwitchCli.tsx (58)
- docs/verification/engines-ui.md (117)
- scripts/verify-engines-ui.ts (172)
- scripts/verify-engines-ui.test.mjs (107)
- scripts/testing/engines-preview.tsx (30)
- src/components/EnginesSettings.test.ts (554)
- src/components/EnginesSettings.added-server.dom.test.ts (70)
- src/components/EnginesSettings.ai-sign-in.dom.test.ts (73)
- src/components/EnginesSettings.antigravity-switch.dom.test.ts (168)
- src/components/EnginesSettings.antigravity.dom.test.ts (423)
- src/components/EnginesSettings.app-copy.test.ts (65)
- src/components/EnginesSettings.codex-shared-setup.dom.test.ts (55)
- src/components/EnginesSettings.gemini.dom.test.ts (233)
- src/components/EnginesSettings.hidden-providers.dom.test.ts (334)
- src/components/EnginesSettings.hidden.test.ts (55)
- src/components/EngineUpdateNotice.test.ts (64)
- src/components/ProviderIcons.deepseek.test.ts (21)
- shared/provider-icon.test.ts (20)

- src/state/api.ts (97)

Read in ranges:
- src/state/store.tsx (3258): 380-509, 1015-1025, 2820-2974, 3005-3025, 3155-3175, 3195-3239
- src/components/settings/settings-index.ts (341): 54-75, 115-130, 205-216
- src/locales/en.json (12251): single keys, lines cited in the notes
- DESIGN.md: 20-35


### Group `ui-library-setup-sign-in`


| File | Lines |
|---|---|
| src/components/EngineLibrary.tsx | 140 |
| src/components/NoEngines.tsx | 113 |
| src/components/EngineSetup.tsx | 842 |
| src/components/DeviceSignIn.tsx | 271 |
| src/components/ClaudeSignIn.tsx | 198 |
| src/components/EngineBrowserSignIn.tsx | 156 |
| src/components/CloudEngineSignIn.tsx | 240 |
| src/components/PinnedSignInSlot.tsx | 31 |
| src/components/onboarding/SignInPill.tsx | 240 |
| src/state/engine-install.ts | 68 |
| src/lib/engine-name.ts | 13 |
| src/lib/engine-rail.ts | 67 |
| src/lib/sign-in.ts | 15 |
| src/lib/sign-in-gate.ts | 12 |
| shared/device-sign-in.ts | 114 |
| shared/engine-sign-in.ts | 14 |
| src/components/onboarding/WelcomeFlow.tsx | 176 |
| src/components/onboarding/MeetScreen.tsx | 156 |
| src/components/onboarding/ConnectAi.tsx | 220 |
| src/components/onboarding/welcome-ai.ts | 82 |
| src/components/EngineLibrary.test.ts | 89 |
| src/components/EngineSetup.test.ts | 381 |
| src/components/EngineSetup.antigravity.test.ts | 174 |
| src/components/EngineSetup.cursor.test.ts | 88 |
| src/components/EngineSetup.grok.test.ts | 118 |
| src/components/EngineSetup.kimi.test.ts | 66 |
| src/components/EngineSetup.refresh.test.ts | 92 |
| src/components/DeviceSignIn.test.ts | 188 |
| src/components/ClaudeSignIn.test.ts | 17 |
| src/components/ClaudeSignIn.interaction.test.ts | 114 |
| src/components/ChatGptPlanSignIn.interaction.test.ts | 103 |
| src/components/GrokSignIn.interaction.test.ts | 114 |
| src/components/CloudEngineSignIn.test.ts | 142 |
| src/components/onboarding/SignInPill.test.ts | 29 |
| src/components/onboarding/SignInPill.poll.test.ts | 171 |
| src/state/engine-refresh.test.ts | 55 |
| src/state/engine-setup-lifecycle.test.ts | 64 |
| src/lib/engine-name.test.ts | 19 |
| src/lib/engine-rail.test.ts | 202 |
| src/components/onboarding/ConnectAi.test.ts | 312 |
| docs/verification/onboarding.md | 204 |
| docs/verification/engines-ui.md | 117 |

Read in ranges:
- src/locales/en.json (12,251 lines): 1075-1078, 1731-1752, 3405, 3696-3710, 3722-3733, 3811-3891 (only the keys printed by grep), 4964-4969, 5009, 5023-5031, 6337-6383, 6479-6485, 9322-9323.
- src/App.tsx: 440-485, and lines 230-231, 241 (grep).
- src/lib/onboarding.ts (290 lines): 99-114 (grep), 235-290.
- src/components/EnginesSettings.tsx (621 lines): 225-250, 490-621.
- src/components/EngineAccounts.tsx: 15-40.
- src/components/onboarding/FirstConversationTour.tsx: 1-40.



## 3. How it works

### 3.1 The engine list

An "engine" is one AI program that the bots use, such as a coding CLI or an API service. An "instance" is one configured entry of an engine, with its own id, name and settings. One engine kind can have more than one instance (for example, two Claude accounts).

#### Entries and shadows

1. The config holds a map `InstanceConfigMap` from an instance id to an `InstanceConfig` entry (`server/contracts.ts:103-119`). The `driver` field is free text. An unknown driver stays in the config and shows as unavailable (`server/contracts.ts:103`).
2. The class `ProviderRegistry` owns the list (`server/harness/registry.ts:139`). Each list entry is a `RegistryEntry`: a live `ProviderInstance` or a `ShadowInstance` (`server/harness/registry.ts:40-51`). A "shadow" is a placeholder row for an entry that cannot run. It keeps the id, the driver kind, the name and the CLI, with `shadow: true` and a `reason`.
3. The registry makes a shadow in two cases:
   - The driver kind is unknown. The reason is `unknown driver "<kind>" — kept as configured, unavailable here` (`server/harness/registry.ts:236-247`).
   - `decodeConfig` or `create` throws. The reason is the error message (`server/harness/registry.ts:264-276`). A failure of one entry does not touch the other entries (`server/harness/registry.test.ts:90-114`).
4. The registry is built one time in the composition root (`server/index.ts:802`).

#### Load

1. The registry starts the model manifest watch one time. On a change, it calls `refreshModels` for three driver kinds in `MANIFEST_REBUILT_DRIVERS` (`server/harness/registry.ts:137`, `server/harness/registry.ts:198-207`). This is a check by driver name.
2. It creates all entries in parallel with `Promise.all` (`server/harness/registry.ts:212-218`).
3. `createEntry` first disposes the old entry with the same id (`server/harness/registry.ts:234`).
4. With no config in the entry, it uses `driver.defaultConfig()`. Else it uses `driver.decodeConfig` (`server/harness/registry.ts:250`).
5. It keeps a CLI in `cliByInstance` only when the config sets the CLI itself (`server/harness/registry.ts:251-253`).
6. It wraps the live instance in six layers: `withTurnScope`, `withEngineMemory`, `withBotMemoryCap`, `withEngineHomes`, `withUnaskedStops`, `withLocalContext`. `enabled` defaults to true and `environment` to `{}` (`server/harness/registry.ts:254-260`).
7. `shareSnapshot` replaces `instance.snapshot` with the shared read (see 3.2). `watchTurns` listens to the events of the adapter (`server/harness/registry.ts:261-262`, `server/harness/registry.ts:308-316`).
8. An instance that is disposed while another one loads does not return (`server/harness/registry.test.ts:161-180`).

#### The order

- The list keeps the config order. A replaced instance keeps its old slot. A new instance goes to the end (`server/harness/registry.ts:219-226`, `server/harness/registry.test.ts:182-191`).
- `enginesByUse` orders engines by the number of selections that use them, most first, and drops empty ids (`server/harness/registry.ts:128-132`). Only the start read uses this order (see 3.2).

#### The row of one engine (`describeWith`)

The registry builds all rows in parallel (`server/harness/registry.ts:682`).

| Row kind | Fields | Source |
|---|---|---|
| Shadow | `instanceId`, `driverKind`, `displayName`, `snapshot {state:"unavailable", reason}`, `models {default:"", options:[]}`, all three `capabilities` false, `access`, `install`, `cli`, `cliDefault`, `cliCandidates` | `server/harness/registry.ts:685-698` |
| Live | `instanceId`, `driverKind`, `displayName`, `snapshot` (through `withWslNotice`), `models`, optional `modelsUnconfirmed` and `modelsUnreadable`, 15 `capabilities` flags, `access`, `install`, `authentication`, `cli`, `cliDefault`, `cliCandidates` | `server/harness/registry.ts:700-733` |

- `cliCandidates` come from `findCliCandidates(name)` on the default CLI name. The result is cached for one call (`server/harness/registry.ts:671-680`).
- `install` hides the pinned release. For the app's own copy of a CLI, the row drops `signInCommand` and sets `appCopy: true` (`server/harness/registry.ts:53-60`).
- `authentication` comes from `signInOf`. It is undefined when the instance has no `startAuthentication`. The method is `authenticationMethod`, else "paste-code" (get and complete exist), else "device-code" (get exists), else "callback-url" (`server/harness/registry.ts:63-74`).
- `describeInstances()` in the composition root adds more fields to each row: the tested-AI info, update notices, icon, colour, `access`, `replyWaitMinutes` (`server/index.ts:11681-11685`). Hosted, cloud-credit and desktop-managed rows get `readOnly: true` and lose `install`, `authentication`, `cli` and `cliCandidates` (`server/index.ts:11686-11698`).

#### The routes (`server/routes/instances.ts`)

`createInstanceRoutes(deps)` builds the routes (`server/routes/instances.ts:73`). The auth gate before the routes is in another file. This file adds only the checks below.

Guards that many routes share:

| Guard | Answer | Source |
|---|---|---|
| Body is not `content-type: application/json` | 415 "content-type must be application/json" | `server/routes/instances.ts:147-149`, `server/routes/instances.ts:332-334` |
| Another provider change runs (the busy flag) | 409 "provider settings are already being updated" | `server/routes/instances.ts:159`, `server/routes/instances.ts:175` |
| `hostedModels` is true and the method is not GET | 403 `HOSTED_PROVIDER_SETTINGS_ERROR` | `server/routes/instances.ts:142` |
| A `company.*` id and the method is not GET | 403 "Company accounts are read-only here. Manage this connection in desktop Settings." | `server/routes/instances.ts:141-143` |

The comment at `server/routes/instances.ts:425` and `server/routes/instances.ts:477` gives the reason for the 415 rule: a hostile page cannot send such a body as a simple cross-origin request.

"In use" (`providerInUse`, `server/routes/instances.ts:83-85`) means: the new-bot default, a bot model, a bot backup list (`fallback`), a task model, or a busy selection. A busy selection is a task whose thread is busy, or the bot model while a group turn runs or the bot is busy with no busy task (`server/routes/instances.ts:86-91`).

Routes that read:

1. GET `/api/instances/hidden` returns the entries with `hidden: true` as `{instanceId, driverKind, displayName}` (`server/routes/instances.ts:115-118`).
2. GET `/api/instances` (`server/routes/instances.ts:119-126`):
   1. It calls `resetPathCache()`, because Windows never pushes PATH changes into a live process.
   2. With `?fresh=1` it calls `registry.forgetSnapshots()`.
   3. It starts a model manifest refresh and does not wait for it.
   4. It returns `{instances: describeInstances()}`.
   5. At `e1cc6a290`, after the tag v0.1.186 (commits `1b5e01402`, `d48ce8033`): the route is on the client allow list (`server/request-auth.ts:349-350`). A session without the `admin` scope gets `memberInstances(describeInstances())`, with none of steps 1 to 3. A member entry has `instanceId`, `driverKind`, `displayName`, `readOnly: true`, `icon`, `access`, `models`, `capabilities` and `snapshot {state, authenticated}`, and no account, CLI path, sign-in command, config folder or address (`server/routes/instances.ts:76-83`, `:133`). Before, a member got 403, so the composer had no capabilities and never offered a steer. The admin path is at `server/routes/instances.ts:132-138`.
3. GET `/api/health/engines` returns `{app:"openmausbot", engines: <count of rows with state "available">}`. It never names the engines. A shared server lets a local caller without a session call it (`server/routes/instances.ts:134-140`).
4. GET `/api/instances/ollama` is for the owner or an admin only, else 403 (`server/routes/instances.ts:127-133`).
5. GET `/api/cli-candidates?name=` lists every program of that name on the augmented PATH, in PATH order (`server/routes/instances.ts:417-421`).

Routes that add an instance or an account:

1. POST `/api/instances/chatgpt-accounts` (`server/routes/instances.ts:171-188`):
   1. The body is `{displayName}`, at most 8 KiB and 80 characters.
   2. The new id is `chatgpt-<uuid>` with driver `codex` and config `{authMode:"chatgpt-plan", cli?}`.
   3. It copies the CLI path from the `chatgpt` or `codex` entries, "never another account's environment" (`server/routes/instances.ts:180`).
   4. It answers 201 `{instanceId, instances}`.
2. POST `/api/instances/claude-accounts` takes `{displayName, configDir?}` and calls `newClaudeAccount` (`server/routes/instances.ts:304-317`). It answers 201. Another writer covers the account code.
3. POST routes for an OpenAI-compatible server, Claude and Codex endpoints and Bedrock (`server/routes/instances.ts:190-302`). Another writer covers these.

Routes that change an instance:

1. PATCH `/api/instances/:id/icon` takes a body of at most 192 KiB, saves the config and broadcasts `{kind:"config"}`. An unknown id gives 404 (`server/routes/instances.ts:145-169`).
2. PATCH `/api/instances/:id` (`server/routes/instances.ts:475-563`). The body follows `instanceSettingsSchema`, at most 16 KiB. The fields are `cli` ("" means the driver default), `hidden`, `tools`, `replyWaitMinutes`, `models`, `url`, `apiKey`, `displayName`, `configDir`.
   1. Busy, or a bot uses the instance now: 409 (`server/routes/instances.ts:486-488`).
   2. `displayName` is for claudeAgent, codex and antigravityAgent only. `configDir` is for claudeAgent only (`server/routes/instances.ts:499-501`). This is a check by driver name.
   3. `hidden: true` while the instance is in use: 409 (`server/routes/instances.ts:502-504`).
   4. `url` and `apiKey`: owner or admin only (`server/routes/instances.ts:531`).
   5. A `configDir` change while any bot, backup, task, resume cursor or last instance uses the account: 409 "This account is used by bots or conversation history. Add another account and select it for the bot instead." Then `assertSeparateClaudeAccount` refuses two accounts in one folder (`server/routes/instances.ts:540-550`).
   6. It saves with `persistProviderInstance`. When an address or a key changed, it refreshes the models and adds a warning when it cannot read the list (`server/routes/instances.ts:557-562`).
3. POST `/api/instances/:id/refresh-models` rediscovers the model of a gateway endpoint under the busy flag, then calls `registry.refreshModels`. An unknown id gives 404 (`server/routes/instances.ts:349-362`).
4. POST `/api/instances/:id/install` calls `registry.installRuntime` (`server/routes/instances.ts:363-368`):
   - A null result gives 404 "Installing this engine from Settings is not available on this server. Use the install command on the machine running <product>."
   - A `{useCli}` result points the engine at the app's copy, but not while busy or in use (`server/routes/instances.ts:94-108`).
   - The answer is `{instances, usingAppCopy?}`.
   - The registry installs with the instance's own `installRuntime`, else the standalone build, else npm with a pinned version. It calls `forgetSnapshots()` after each install, also after a failure (`server/harness/registry.ts:475-497`).
5. POST `/api/instances/:id/claude-update` is for `claudeAgent` only (`server/routes/instances.ts:439-471`):
   - It takes the program from the registry, never from the request (`server/routes/instances.ts:438`).
   - It runs one update for each executable (`server/routes/instances.ts:112-113`, `server/routes/instances.ts:451`).
   - A Claude task on the same executable gives 409.
   - It runs the update with a credential-free environment and calls `forgetSnapshots()` in `finally`, because a failed update can replace the program (`server/routes/instances.ts:468-469`).

The route that removes an instance (DELETE `/api/instances/:id`, `server/routes/instances.ts:565-603`):

1. Busy: 409. Else it sets the busy flag before it reads the config and keeps it until the save. The reason: a sign-out waits on a CLI, and another change in that time would be lost to an older copy (`server/routes/instances.ts:568-570`).
2. An unknown id gives 404.
3. Only these entries can go: an added ChatGPT account (`chatgpt-*`, driver `codex`), an added Antigravity account (`antigravity-*`), a Codex endpoint, an added endpoint, or a claudeAgent entry whose id is not `claude`. Else 400 "Only added accounts and custom endpoints can be removed here." (`server/routes/instances.ts:577-579`).
4. In use: 409 "Choose another account for the bots and default model using this account before removing it."
5. An added ChatGPT account signs out first, as the session id or "loopback" (`server/routes/instances.ts:587`). Only the error code `chatgpt_revocation_unconfirmed` lets the delete continue. Any other error gives 409 (`server/routes/instances.ts:585-593`).
6. It deletes the entry and calls `persistProviderInstance`. For an added Antigravity account it then removes the profile folder (`server/routes/instances.ts:597`).
7. `finally` clears the busy flag.

`persistProviderInstance` saves the config with `replaceInstances: true`. When it cannot keep the loaded engine, it clears the sign-in flows of that id, detaches the bus, and loads or disposes the entry (`server/index.ts:11769-11781`). So a change of an account ends its open sign-in flows.

#### The busy flag

- `providerConfigBusy` is one flag for the whole process (`server/routes/instances.ts:49-71`). Each route sets it and clears it in `try/finally`.
- A second change while one runs gets 409 (`server/routes/instances.ts:159`).
- The live check (POST `check`) does not use the flag. `checkEngine` shares one run per engine instead (`server/routes/instances.ts:340-348`).

#### Who owns a sign-in flow

1. The owner of a flow is the session id, or `companion:<device header>` for a paired phone, or "loopback" (`server/routes/instances.ts:319-321`). Each phone has its own flow. It never resumes or reads the flow of the computer or of another phone.
2. POST `auth/start` (`server/routes/instances.ts:369-388`):
   1. For a `browser-pkce` or `browser` sign-in, a proxied request, a request not from loopback, or a request from a paired device gets 403, because the OAuth callback ends on this machine (`server/routes/instances.ts:373-379`).
   2. Else it calls `providerAuthSessions.start(instance, owner)`. A result `succeeded` calls `forgetSnapshots()`.
   3. If the session ended in the meantime, it calls `revokeOwner(owner)` and answers 401 "Your session ended. Start a new sign-in." (`server/routes/instances.ts:382-386`).
3. GET `auth/status?flowId=` answers with `no-store`. When the phase is not "waiting", it calls `forgetSnapshots()` (`server/routes/instances.ts:322-329`).
4. POST `auth/complete` needs `{flowId, code | callbackUrl}`, else 400. Then it calls `forgetSnapshots()` and answers `{ok:true}` (`server/routes/instances.ts:396-405`).
5. POST `auth/cancel` answers `{ok:true}` (`server/routes/instances.ts:406-408`). POST `auth/sign-out` calls `forgetSnapshots()` and returns the list (`server/routes/instances.ts:389-395`).
6. Errors of these routes keep their status only for 400, 401, 404, 409, 413 or 415. Any other status becomes 500 (`server/routes/instances.ts:409-413`).
7. The registry passes sign-in calls through with no time limit of its own (`server/harness/registry.ts:499-521`). Problem d shows here.

### 3.2 The status read of one engine

A "snapshot" is the status of one engine at one time: available or not, signed in or not, version, and a few marks (`server/contracts.ts:395-437`). Models are not in the snapshot.

#### The shared read

1. A caller calls `instance.snapshot()`. The registry replaced this function at load (`server/harness/registry.ts:285-296`).
2. If a read of the same generation is in flight, the caller joins it. A "generation" is a counter that `forgetSnapshots()` increments.
3. If a read of the same generation ended less than `SNAPSHOT_REUSE_MS` (3 s) ago, that read answers again (`server/harness/registry.ts:98`, `server/harness/registry.ts:289-290`).
4. A failed read is never reused (`server/harness/registry.ts:293`).
5. Else a new read starts. It races `SNAPSHOT_DEADLINE_MS` (60 s) (`server/harness/registry.ts:96`, `server/harness/registry.ts:105-114`). At the deadline it rejects with `SnapshotDeadlineError` and the reason "This engine did not report its status within a minute. Check that its CLI starts in a terminal." (`server/harness/registry.ts:101`). The deadline does not stop the work of the driver.
6. "Pressed" and "small" are two flags of the machine pressure gauge (`machinePressure.pressed`, `machinePressure.small`) on a server where turns wait for room. `probeGate()` gives `pressed` and `small` from the machine pressure, and `turnsProve` from the memory gate. All are off on the desktop app (`server/harness/registry.ts:35-38`, `server/harness/registry-probe-hold.test.ts:288-296`).
7. On a small machine, a read of an engine with a CLI waits for the read before it, at most `PROBE_QUEUE_WAIT_MS` (35 s). Elsewhere, and for an engine with no CLI, it starts at once (`server/harness/registry.ts:300-305`, `server/harness/probe-hold.ts:29`).

#### `read(instance)`: the one place that records a status

1. It calls `instance.snapshot()` (`server/harness/registry.ts:594-650`).
2. It decides if the answer is inconclusive, holds it if necessary, and counts calm failures. Section 3.3 gives these steps.
3. It records the read in `readsOf` when the read answered or was inconclusive (`server/harness/registry.ts:629`).
4. Only when the instance is still the live one, it does these steps (`server/harness/registry.ts:631-641`):
   1. It schedules a retry, or stops the retry.
   2. It calls `noteProbeUnsettled(cli, ...)`.
   3. It sets `lastSnapshots` and removes the id from `unread`.
   4. It calls `saveStatus()`.
   5. It calls `healWrongCli` when the answer was not inconclusive.
5. `lastAuth` keeps the newest plain "signed in" answer, by the order in which reads began. A change from false to true calls the `onSignedIn` listeners (`server/harness/registry.ts:642-647`).

#### Limits

| Constant | Value | What it limits | Source |
|---|---|---|---|
| `SNAPSHOT_REUSE_MS` | 3 s | Reuse of a finished read | `server/harness/registry.ts:98` |
| `SNAPSHOT_DEADLINE_MS` | 60 s | One status read | `server/harness/registry.ts:96` |
| `ENGINE_LIST_REUSE_MS` | 60 s | Reuse for the list route | `server/harness/registry.ts:100` |
| `START_READ_STEP_MS` | 5 s | Wait on one CLI before the next at start | `server/harness/registry.ts:117` |
| `PROBE_QUEUE_WAIT_MS` | 35 s | Wait for the read before, small machine | `server/harness/probe-hold.ts:29` |
| `STATUS_SAVE_DELAY_MS` | 1 s | Writes of the status file | `server/harness/engine-status-file.ts:64` |

#### The start read (`readAtStart`)

1. The composition root calls it when the store does not need a seed. It gives `enginesByUse([default, ...bot models])` as the first engines (`server/index.ts:2791-2796`). On a new install there is no start read. The server waits up to 15 s for the cloud credit and then releases `firstEngineRead()` at once (`server/index.ts:2792-2793`).
2. It reads the status file. It takes a row only for an engine that is live (`server/harness/registry.ts:371`). The rows become "seeds": statuses that the last run saved.
3. It sets `unread` to all live engines.
4. It reads engines with no CLI at once, in parallel (`server/harness/registry.ts:379`).
5. It probes engines with a CLI one at a time, the `first` list first. It waits at most 5 s for each before it starts the next. `afterFirst` runs after each (`server/harness/registry.ts:380-384`).
6. It waits for all reads (`server/harness/registry.ts:386`). A stuck CLI holds the read until its 60 s deadline (`server/harness/registry-start-read.test.ts:95-116`).
7. An engine that its seed called available, and that is now unavailable or has an open retry that is not deferred, is read one more time after `forgetSnapshots()` (`server/harness/registry.ts:388-394`).
8. `finally`: `unread` becomes null and the seeds are cleared (`server/harness/registry.ts:395-399`).
9. It returns `{engines, changed}`. `changed` compares each new snapshot (through `snapshotFrom`) with its seed as JSON (`server/harness/registry.ts:400-401`).
10. After the start read, the root refreshes unset model selections and broadcasts `config` when `changed` is true. An error gives the log line "[engines] reading the engines at start failed: ..." and does not stop the server (`server/index.ts:2796`).

`server/first-engine-read.ts:3-14` holds a process-wide promise. Background work that reads program files waits on it until the first engine is probed.

While the start read runs:

- `engineRead(...ids)` gives null unless the start read has not yet reached one of the ids. Then it gives the shared probes, so a turn on that engine probes it at once (`server/harness/registry.ts:405-411`).
- `provisional(described)` is true during the start read, or when a snapshot is a seed object (`server/harness/registry.ts:414-416`).
- `knownSnapshot` gives the probed status, else the seed. Its comment says "For reports, never for choosing where a turn runs" (`server/harness/registry.ts:418-421`).

#### The status file seeds

1. The file is `<data>/providers/engine-status.json` (`server/index.ts:802`).
2. A read uses a row only when the engine still has the same `driverKind` and the same `cli` (`server/harness/engine-status-file.ts:109`).
3. A file that cannot be read or parsed gives an empty map (`server/harness/engine-status-file.ts:98-103`). The `v` field is not checked.
4. `describe({known: true})` answers an unread engine from its seed during the start read (`server/harness/registry.ts:575-592`).
5. `saveStatus` writes rows for all live instances from `lastSnapshots` or the seed (`server/harness/registry.ts:663-668`). Section 4.1 gives the write rules.
6. Problem e shows here: the save does not depend on a successful read. The file is only a cache, so this loses seeds only.

#### The list reuse and `?fresh=1`

1. `describeInstances()` calls `registry.describe({known: true, reuse: {ms: ENGINE_LIST_REUSE_MS, changed: broadcast config}})` (`server/index.ts:11677`).
2. With `reuse`, the registry answers from `readsOf` when the read is of the current generation (`server/harness/registry.ts:575-592`):
   - Older than `ms` (60 s): it answers the old read and reads again in the background. `changed()` runs when the JSON differs.
   - Older than `maxAgeMs`: it reads first.
   - While `probeDeferred` is true and the status is younger than 10 min, the old answer stands.
3. With no `reuse`, the registry reads every engine through the shared read (3 s reuse).
4. `?fresh=1` on GET `/api/instances` calls `forgetSnapshots()` first, so every engine is read again (`server/routes/instances.ts:122`, `server/routes/instances.test.ts:166-175`).

#### `forgetSnapshots()`

1. It increments the generation, sets `changedAt` and clears the seeds (`server/harness/registry.ts:356-360`).
2. After it, a read in flight is never given to a later caller (`server/harness/registry.test.ts:470-493`).
3. Callers: `refreshModels` (`server/harness/registry.ts:470`), `installRuntime` (`server/harness/registry.ts:495`), engine updates (`server/index.ts:804`), and the routes: `?fresh=1`, `check`, `auth/*` when a phase ends, `auth/sign-out`, `auth/complete` and `claude-update` (`server/routes/instances.ts:122`, `server/routes/instances.ts:322-408`, `server/routes/instances.ts:468-469`).

### 3.3 The probe hold

The "probe hold" is the rule that a check that could not finish never records an engine as "unavailable" (`server/harness/probe-hold.ts:1-5`).

#### Which failures are inconclusive

`inconclusiveFailure(error)` is true for these failures (`server/harness/probe-hold.ts:34-40`):

| Failure | Inconclusive? | Source |
|---|---|---|
| A process shortage code (EAGAIN, ENOMEM, EMFILE, ENFILE) | Yes | `server/harness/probe-hold.test.ts:13-19` |
| `killed === true` with no string code (the time limit) | Yes | `server/harness/probe-hold.ts:38` |
| `signal === "SIGKILL"` with no numeric code (the OOM killer) | Yes | `server/harness/probe-hold.ts:39` |
| ENOENT, EACCES, EPERM | No: an answer | `server/harness/probe-hold.test.ts:21-25` |
| A crash signal (SIGSEGV, SIGABRT, SIGBUS, SIGTERM without `killed`) | No: an answer | `server/harness/probe-hold.test.ts:21-25` |
| An exit status | No: an answer | `server/harness/probe-hold.test.ts:21-25` |

In `read()` these answers are also inconclusive (`server/harness/registry.ts:600-605`):

- A snapshot `unavailable` with `busy: true`.
- A throw of the 60 s deadline.

A throw becomes `{state:"unavailable", reason, busy?}`.

#### The held snapshot

When a read is inconclusive and the failure is not "believed" (see below), the registry replaces the answer with `heldSnapshot(before, now, present)` (`server/harness/registry.ts:623-628`). `before` is the last snapshot, else the seed. `present` checks the program file with `cliPresent` and starts no process (`server/harness/probe-hold.ts:50-59`).

1. `before` was available and the file is not known to be missing: keep `before` (`server/harness/probe-hold.ts:64-73`).
2. The file is there: `{state:"available", unverified:true, version?}`. This is "available, unverified": the program is installed but no check finished.
3. The file is missing: `now` without `busy`, state unavailable.
4. Unknown (no CLI): `now` with state unavailable and `busy: true`.

An engine that is only "available, unverified" is never chosen to run a turn, as the default, or as a backup (`server/harness/registry-probe-hold.test.ts:220-226`). A saved status never restores a deleted program (`server/harness/registry-probe-hold.test.ts:195-218`).

#### The back-off

After an inconclusive read, `retryLater` schedules one more read (`server/harness/registry.ts:330-347`).

1. The normal delays are `PROBE_RETRY_MS`: 30 s, 60 s, 120 s, 300 s, 600 s. After the last step, it stays at 600 s (`server/harness/probe-hold.ts:13`).
2. Within `PERSON_CHECK_MS` (2 min) after `forgetSnapshots()`, up to `PROMPT_RETRIES` (5) retries run after `PROMPT_RETRY_MS` (5 s), pressed or not (`server/harness/probe-hold.ts:21-24`, `server/harness/registry.ts:336-337`, `server/harness/registry.ts:345`).
3. When the timer fires, the read is "due" if one of these is true: it is a prompt retry, it is a held sign-out, it is the last back-off step, or the status is `STATUS_STALE_MS` (10 min) old (`server/harness/registry.ts:342`).
4. When it is not due and `probeDeferred` is true, the registry schedules the retry again and does not read (`server/harness/registry.ts:343`). `probeDeferred` is true while a turn of that engine runs or the machine is pressed (`server/harness/registry.ts:320`).
5. The timers are `unref`ed (`server/harness/registry.ts:346`).
6. A turn proves that the engine runs only while it had an event less than `TURN_PROOF_MS` (5 min) ago (`server/harness/probe-hold.ts:26`, `server/harness/probe-hold.ts:78-94`).

#### The calm count of 3

1. The registry counts inconclusive reads in a row on a machine that is not pressed (a "calm" machine) (`server/harness/registry.ts:613-614`).
2. At `CALM_FAILURES_BELIEVED` (3) the failure is "believed": `busy` is removed and the state is `unavailable` (`server/harness/probe-hold.ts:16`, `server/harness/registry.ts:615-622`).
3. The engine goes into `calmBroken`. The next inconclusive read on a calm machine is then believed at once, until a read answers (`server/harness/registry.ts:615-619`).
4. On a pressed machine, the failure is never believed (`server/harness/registry-probe-hold.test.ts:143-159`).

#### The sign-out hold on a pressed machine

1. The registry holds a sign-out answer one time when all these are true (`server/harness/registry.ts:607-612`):
   - The engine was signed in before.
   - The answer now is available with `authenticated === false`.
   - No `forgetSnapshots()` ran since the last read of this engine.
   - The machine is pressed.
2. A held sign-out counts as inconclusive. The retry is due at once at the next timer, after `PROBE_RETRY_MS[0]` (`server/harness/registry-probe-hold.test.ts:175-185`).
3. The second sign-out answer is believed.
4. A sign-out after a sign-in change is believed at once (`server/harness/registry-probe-hold.test.ts:187-193`).
5. On a calm machine a sign-out is believed at once. Problem a shows here.

### 3.4 The live check and the CLI test

#### The live check (one test message)

A "live check" sends one small real message through the engine (`server/engine-check.ts:1`).

1. The client POSTs `/api/instances/:id/check`. An unknown id gives 404 (`server/routes/instances.ts:340-348`).
2. The route calls `instance.forgetAuthentication?.()` and `forgetSnapshots()`. Its comment says "a check is the person asking again" (`server/routes/instances.ts:344`).
3. The route calls `checkInstance` when the root gives it, else `checkEngine` (`server/routes/instances.test.ts:193-200`).
4. `checkEngine(instance, {timeoutMs})` (`server/engine-check.ts:36-65`):
   1. It uses `generateText`, else `generateMemoryText`. With neither, it answers `{ok:null}`.
   2. One check runs for each engine at a time. A second caller gets the same promise (`server/engine-check.ts:30`, `server/engine-check.ts:41-42`).
   3. It sends the prompt "This is a connection check. Reply with the single word OK." (`server/engine-check.ts:12`).
   4. At `TIMEOUT_MS` (90 s), a timer aborts the call and answers `{ok:false, reason:"timeout"}` with the user error `serverError.engineCheck.timeout` (`server/engine-check.ts:13`, `server/engine-check.ts:46-49`).
   5. Any non-empty answer gives `{ok:true}`.
   6. An empty answer gives `{ok:false, reason:"empty", error:"<name> answered with nothing. Check again in a minute."}` (`server/engine-check.ts:53`).
   7. A throw, also a synchronous one, gives a reason and an error from the message (`server/engine-check.ts:52-57`).
   8. `finally` removes the entry from `running` (`server/engine-check.ts:62`).
5. The error text (`server/engine-check.ts:17-23`):
   - The `SIGNED_OUT` pattern matches: "<name> isn't signed in on this computer anymore. Sign in again, then check again."
   - Else the text of `engineFailureMessage`.
   - Else "<name> couldn't answer: <text>", with secrets redacted, spaces collapsed, and at most 300 characters.
   - An empty text gives "<name> didn't answer. Check again in a minute."
6. The reason is "signed_out", else `engineFailureKind`, else "other" (`server/engine-check.ts:25-28`).
7. `SIGNED_OUT` matches these words in the error text: "not logged in", "please run /login", "login required", "not signed in", "sign in again", "invalid api key", "invalid_api_key", "401", "unauthorized" (`server/engine-check.ts:14`). Problem a shows here: a CLI that changes its words falls to "other".
8. The client waits 120 s (`src/components/EngineLiveCheck.tsx:22`).

#### The CLI test (`--version`, 10 s)

The "Test" button for a CLI path in Settings runs `<cli> --version` (`server/cli-probe.ts:1`).

1. The client POSTs `/api/cli-test` with `{cli, driver}`, at most 4 KiB. An empty CLI or a CLI with a newline gives 400 (`server/routes/instances.ts:424-436`).
2. For the Antigravity driver with a native or pinned alias, no process starts. The answer comes from `resolveAntigravityRuntime` (`server/cli-probe.ts:12-18`). This is a check by driver name.
3. Else it runs `execCli(cli, ["--version"], {timeout: 10_000, killSignal: "SIGKILL", maxBuffer: 64 KiB, env})` (`server/cli-probe.ts:24-33`). It uses SIGKILL because a child that traps TERM would hold the HTTP socket (`server/cli-probe.ts:29`).
4. The environment is the server environment with `PATH = augmentedPath()`, minus the workspace credential keys and minus each key of `PROVIDER_CREDENTIAL_ENV` (`server/cli-probe.ts:61-66`).
5. Errors (`server/cli-probe.ts:35-48`):

| Case | Message |
|---|---|
| Output over 64 KiB | "CLI test produced more than 64 KiB of output" |
| Spawn failure | The `describeSpawnFailure` message, with `install` when it is a setup failure |
| Killed | "CLI test timed out after 10s" |
| Other | "CLI exited with error <code>: <first 200 chars of stderr or the first line of the message>" |

6. On success, `version` is the first line of stdout. When `metadata.cliVersion` (a regular expression) does not match it, the answer is `{ok:false, message: notThisCli(...)}` (`server/cli-probe.ts:50-54`).
7. The route answers 200 also for a failure.

#### The version probe

1. `cliVersionProbe(cli, run)` returns a function of `env` (`server/cli-version-probe.ts:12-32`).
2. Callers with the same `env.PATH` share the probe in flight (`server/cli-version-probe.ts:16`).
3. It finds the first copy on that PATH. When the found copy changes, it makes a new reader, so it never gives an old version for a new copy (`server/cli-version-probe.ts:17-18`).
4. It runs `<cli> --version` to a deadline of `CLI_VERSION_TIMEOUT_MS` (`server/cli-version-probe.ts:20-23`). The test sets this limit at 30 s (`server/cli-version-probe.test.ts:11-23`).
5. An empty answer with no error is tried one more time before the deadline (`server/cli-version-probe.ts:26`).
6. The reader keeps the last version through temporary failures. ENOENT, EACCES and EPERM forget it (`server/cli-version-probe.test.ts:66-85`).
7. On Windows it launches the checked copy by its full path, because spawn there uses the PATH of the app, not of the turn (`server/cli-version-probe.ts:5-8`). Problem h shows here.

#### The probe cache

The probe cache keeps `--version` and `--help` answers on disk, for the desktop app only (`server/cli-probe-cache.ts:1-11`).

1. It is on only when `OMB_DESKTOP_PARENT === "1"` and `OMB_USER_DATA` is an absolute path (`server/cli-probe-cache.ts:33-35`).
2. It caches only one argument, `--version` or `--help`. It never caches a sign-in check (`server/cli-probe-cache.ts:4`, `server/cli-probe-cache.ts:25`, `server/cli-probe-cache.ts:147`).
3. It does not cache these CLIs (`server/cli-probe-cache.ts:41-64`):
   - a CLI string with more than one word.
   - a version manager shim, or a path with a "shims" part.
   - a `.ps1`, `.sh`, `.cmd` or `.bat` file, or a shell script.
   - a script whose interpreter is not found.
4. The key is the first 40 hex characters of a sha256 of `[appVersion, platform, program identity, interpreter identity, args]`. The identity is the real path, size, mtime ns, ctime ns, inode and device (`server/cli-probe-cache.ts:101-113`).
5. `exec` gives a kept answer through `queueMicrotask`, unless any CLI has an unsettled probe (`server/cli-probe-cache.ts:146-171`). The reason: on Windows a probe names the program by the path of the copy it found (`server/cli-program.ts:32-33`).
6. After a run, it keeps the answer only with no error, some output, sizes in the limit, and the same key after the run.
7. An entry has no time limit. It stays until the file identity or the app version changes.
8. `forget()` empties the cache and saves (`server/cli-probe-cache.ts:166`).

`noteProbeUnsettled(cli, open)` keeps a process-wide set of CLIs whose last status check could not finish (`server/cli-program.ts:21-26`). The registry calls it after each read (`server/harness/registry.ts:637`).

#### Pinned engine versions

1. `ENGINE_VERSIONS` gives a pin for each of 15 driver kinds: `target`, `minimum`, optional `acp` arguments and optional `formerNpm` (`server/engine-versions.ts:13-41`). For example, `claudeAgent` has `target: "latest"` and `minimum: "2.1.267"`. `codex` has `0.167.0` and `0.146.0`.
2. `pinnedNpmVersion(driverKind)` gives the target, or undefined for "latest" (`server/engine-versions.ts:44-47`). The registry gives it to the npm install (`server/harness/registry.ts:492`).
3. The comment says each version was installed and answered `--version` on 2026-11-07 (`server/engine-versions.ts:3-5`). So Settings installs a tested version, not a newer one.

#### Engine-run records

These records let the next server stop engine processes that a dead server left (`server/engine-records.ts`). Problem h shows here.

1. On win32, `startEngineRecords` returns at once. The records are off on Windows (`server/engine-records.ts:148`).
2. The server makes `<data>/engine-runs/<tag>/` with mode 0o700. The tag is 16 random bytes as 32 hex characters (`server/engine-records.ts:20-21`, `server/engine-records.ts:150`, `server/engine-records.ts:155`).
3. It writes `server.json` (`{pid, start, boot, ns}`, mode 0o600) (`server/engine-records.ts:156`). A write error is logged and the function returns.
4. Each child gets `OMB_ENGINE_TAG` in its environment and a `<pid>.json` record (`server/engine-records.ts:34-36`, `server/engine-records.ts:238`).
5. The server sweeps each earlier run folder (`server/engine-records.ts:147-165`, `server/engine-records.ts:181-225`):
   - A run with `clean` is forgotten.
   - `serverState` "gone" (other boot id or pid namespace) is forgotten.
   - Only a "dead" run is swept. It sends SIGTERM, waits up to 1,500 ms in 100 ms steps, then sends SIGKILL and waits up to 1,000 ms. It reads the process table again before each signal.
   - If a process is left, the folder stays.
6. `leftBehind` never takes a zombie, itself, pid 1 or lower, a process with this server's tag, an `AGENT_BROWSER_DAEMON=1` process, or a process that started after this server (`server/engine-records.ts:124-142`).
7. On macOS a start time matches within 2 s of the recorded spawn time (`server/engine-records.ts:106-111`). The process list comes from `/proc` on Linux and from `ps -A -E -ww` on macOS, with a 10 s limit and a 64 MiB buffer (`server/engine-records.ts:40-43`, `server/engine-records.ts:61-81`).
8. A clean shutdown writes an empty `clean` file, only when no recorded group still runs (`server/engine-records.ts:234-278`).

### 3.5 doctor

#### Three doctors in one verb

`openmausbot doctor` is always a headless verb (`server/cli-usage.ts:5-11`). The verb dispatches on its flags (`server/headless/commands.ts:73-98`):

| Flags | Doctor | Refused flags (exit 2) | Source |
|---|---|---|---|
| `--host` | Host doctor | `--wait`, `--url`, `--data`, `--fix` | `server/headless/commands.ts:74-78` |
| `--data` or `--fix` | Data doctor | `--wait`, `--url`, `--port`, `--token-file`, `--domain` | `server/headless/commands.ts:79-82` |
| none of these | Server doctor | `--data-dir` or `--domain` alone | `server/headless/commands.ts:83` |

The refusal texts are "doctor --host checks this machine: drop --wait and --url" and "doctor --host and doctor --data are two runs" (`server/headless/commands.ts:75-76`). `--fix` alone means `--data` (`server/headless/doctor.test.ts:56-86`).

No doctor checks an engine sign-in. The verification page says "Doctor proves server/engine readiness, not authentication against a real provider." (`docs/verification/engines.md:48-49`).

#### The data doctor on command

`openmausbot doctor --data [--fix] [--data-dir DIR] [--json]` does not need the server (`server/doctor/command.ts:1-2`). The data folder is `--data-dir`, else `defaultDataDir(env)` (`server/doctor/command.ts:32`).

1. `runDoctor` builds the context. `startedAt` defaults to `performance.timeOrigin` (`server/doctor/run.ts:80-81`).
2. It looks at each of the nine checks in order, one after the other, synchronously (`server/doctor/run.ts:83`). A check that throws gets status `failed` with "The check itself failed: <first 300 chars>" (`server/doctor/run.ts:42-50`).
3. With `fix: false`, it stops and reports.
4. With `fix: true`, no fix runs in these cases. Each case sets `fix.why`, which ends with "Nothing was changed." (`server/doctor/run.ts:93-112`):
   - A result is `blocking`.
   - The folders check has a problem that is not fixable.
   - In command mode on POSIX, the data folder owner is not the effective user (`server/doctor/run.ts:65-72`).
   - In command mode, the lease holder is `alive`, `other-machine` or `invalid`.
   - The lease cannot be taken.
5. In command mode with a `dead` lease holder, it copies the old lease file to the backup and takes the lease. The lease result becomes `fixed` with "Retired the lease process <pid> left." (`server/doctor/run.ts:105-109`).
6. For each check that wants a fix (a `fix` function, status problem, and `fixable` or `keepCopy`) (`server/doctor/run.ts:76`):
   1. It looks again with `earlier` set. If the problem is gone, it records the fresh result (`server/doctor/run.ts:120-125`).
   2. It runs `fix`. A throw gives `failed` with "<summary> The fix failed: <text>" (`server/doctor/run.ts:127-132`).
   3. It looks once more. `repaired` is true only when the fresh finding was fixable, the last look did not fail, and the last look is ok or no longer fixable (`server/doctor/run.ts:133-137`).
7. It releases the lease in `finally` (`server/doctor/run.ts:142-144`).
8. `counts.problems` counts `problem` and `failed`. `counts.fixed` counts `repaired` (`server/doctor/run.ts:148-161`).
9. No check has a time limit. All work is synchronous file and SQLite work.

The nine checks, in order (`server/doctor/run.ts:23-25`). The registry check runs before temp-files, because a temp file can be the only whole copy of a registry file (`server/doctor/run.ts:22`).

| # | id | Looks at | Fix rule | Source |
|---|---|---|---|---|
| 1 | `data-format` | `data-format.json` | No fix. A newer format is a blocking problem. | `server/doctor/checks/data-format.ts:8-26` |
| 2 | `lease` | `openmausbot-server.lease` | No fix of its own. The runner retires a dead lease. | `server/doctor/checks/lease.ts:9-30` |
| 3 | `folders` | `events`, `native` | Makes missing folders. No data folder, a file in place of a folder, or no write access: no fix, and no other fix runs. | `server/doctor/checks/folders.ts:8-42` |
| 4 | `registry` | `bots.json`, `groups.json` | Puts back a damaged file only from a whole, newer temp file of an interrupted save. With no copy, keeps a copy of the damaged file. An unreadable file is "not checked" and left alone. | `server/doctor/checks/registry.ts:13-89` |
| 5 | `temp-files` | `<file>.<pid>.<id>.tmp` at the top level | Moves each into the backup. Never deletes. | `server/doctor/checks/temp-files.ts:11-26` |
| 6 | `engine-runs` | `engine-runs/` | Moves orphaned run folders into the backup. A folder that names processes but no server is left for a person. | `server/doctor/checks/engine-runs.ts:22-60` |
| 7 | `messages-db` | `messages.db`, `messages.db-wal` | Copies the files, then runs `PRAGMA wal_checkpoint(TRUNCATE)` for a log over 64 MiB. Never rewrites a damaged database. | `server/doctor/checks/messages-db.ts:53-97` |
| 8 | `secret-modes` | 8 private files at the top level | Notes the old mode, then `chmod 0600`. Copies no content. "Not checked on Windows." | `server/doctor/checks/secret-modes.ts:10-42` |
| 9 | `settings-file` | `config.json` | No fix. Points to `openmausbot config restore latest`. | `server/doctor/checks/settings-file.ts:8-29` |

Edge cases:

- A temp file name has the exact form `<file>.<pid>.<uuid>.tmp`. The doctor skips a file whose pid is a live process other than this one. It takes a file with its own pid only when the file is older than `ctx.startedAt`, because a restarted container often gets the pid of the earlier server (`server/doctor/files.ts:9-27`).
- `registryState` gives `missing`, `ok`, `damaged` or `unreadable`. `unreadable` shows only the error code, because "an fs message carries the full path" (`server/doctor/files.ts:39-47`).
- The registry check names the risk it guards against: "The Store takes one it cannot read for an empty list, and the next save writes over it." (`server/doctor/checks/registry.ts:1-2`). Problem e shows here.
- `messages-db` opens the database read-only with `PRAGMA quick_check(20)` and a 5 s busy timeout. A locked or unreadable database is "not checked", never damaged (`server/doctor/checks/messages-db.ts:4-5`, `server/doctor/checks/messages-db.ts:31-48`). The fix is possible only when free disk is unknown or more than 2 x (database + log) (`server/doctor/checks/messages-db.ts:75-82`).
- An unreadable `data-format.json` is ok while this version writes format 1. It is a blocking problem once the version writes format 2 (`server/doctor/checks/data-format.test.ts:20-30`).

Limits of the data doctor:

| Constant | Value | Source |
|---|---|---|
| `START_CHECK_MAX_BYTES` | 256 MiB (database + log, at start only) | `server/doctor/checks/messages-db.ts:15` |
| `LARGE_WAL_BYTES` | 64 MiB | `server/doctor/checks/messages-db.ts:17` |
| SQLite busy timeout | 5000 ms | `server/doctor/checks/messages-db.ts:48` |
| `DOCTOR_BACKUPS_KEPT` | 10 runs | `server/doctor/backup.ts:9-14` |
| `DOCTOR_BACKUPS_MAX_BYTES` | 2 GiB for older runs | `server/doctor/backup.ts:9-14` |
| `DOCTOR_BACKUPS_REGISTRY_DAYS` | 30 days for a run with a registry copy | `server/doctor/backup.ts:9-14` |

Backups:

1. The doctor makes `<data>/doctor-backups/<time>/` at the first change of a run. A run that changes nothing makes no folder (`server/doctor/backup.ts:2-3`, `server/doctor/backup.ts:39-53`).
2. The time is the ISO time with no milliseconds, with `:` replaced by `-`. A second run in the same second gets `-2`, `-3` (`server/doctor/backup.ts:44-47`).
3. There are three operations (`server/doctor/backup.ts:84-107`):
   - `copy` copies a file or a folder. The original stays.
   - `move` does one `renameSync`.
   - `note` copies nothing and records a mode as an octal string.
4. Pruning runs when a new run folder opens, oldest first. It ignores errors (`server/doctor/backup.ts:51`, `server/doctor/backup.ts:57-73`). A run whose manifest cannot be read counts as a run with a registry copy (`server/doctor/backup.ts:124-132`).

Output and exit:

1. The first line is `Data folder: <dir> (checked by <version>)`. Then one line for each check with a mark padded to 8 (`ok`, `fixed`, `PROBLEM`, `FAILED`) and `<title>: <summary>` (`server/doctor/command.ts:12-27`).
2. Optional lines follow: `        done: <fixed>`, `        what to do: <instruction>`, and `        openmausbot doctor --data --fix repairs it` for a fixable problem when no fix ran.
3. Then `No fixes ran: <why>` and `What was changed was copied to <backup> first.`
4. The last line is `<n> problem(s) left[, <m> fixed].`, `All fine now: <m> fixed.` or `All fine.`
5. The JSON result is `{ok: problems === 0, ...report}`. The exit code is 8 (`EXIT.dataProblems`) when a problem is left, else 0 (`server/doctor/command.ts:28`).

#### The data doctor at start

1. The server runs these steps in order at start (`server/index.ts:655-667`):
   1. `dataFormatAtStart("check")`. A newer data format stops the server here.
   2. `ensureDirs()`.
   3. It takes the data folder lease.
   4. `startEngineRecords`.
   5. A pending workspace restore.
   6. `dataFormatAtStart("stamp")`.
   7. `doctorAtStart(DATA_DIR, serverVersion())`, before the Store, the config and the sessions load.
2. `doctorAtStart` reads `doctor-state.json`. A missing or bad file gives null (`server/doctor/start.ts:35-42`).
3. If the stored version equals this version, it does not run. It keeps the stored summary with `thisStart: false` (`server/doctor/start.ts:58-61`).
4. Else it runs `runDoctor` with `mode: "start"` and `fix: true` (`server/doctor/start.ts:62`). In start mode the runner does not take the lease, because the server holds it (`server/doctor/run.ts:97`).
5. It logs each report line as `[doctor] <line>`, then `[doctor] first start of <version>[ (last: <old>)]: <n> checks, <n> fixed, <n> need a person[; what was changed was copied to <backup> first].` (`server/doctor/start.ts:63-65`).
6. It writes the state file. A failed write is logged, and the doctor runs again at the next start (`server/doctor/start.ts:68-72`).
7. Any throw is logged as `[doctor] did not run: <text>` and gives null. The doctor never stops the start (`server/doctor/start.ts:74-77`).
8. The checks are synchronous, so a slow `quick_check` delays the start. The 256 MiB limit at start bounds it (`server/doctor/checks/messages-db.ts:61`).

The update scripts also use the data doctor. When a new version fails its health check, `doctor_repaired` runs `openmausbot doctor --data --fix --json`. It counts a repair only when the JSON has `"fixed": [1-9]`. Then the new version starts once more, else the update rolls back (`deploy/update.sh:608-628`, `deploy/update.sh:1002-1011`).

#### The host doctor

`doctor --host` looks at a Linux machine before an install. It changes nothing (`server/headless/host-doctor.ts:1-3`). Its levels are `ok`, `warn` and `FAIL` (`server/headless/host-doctor.ts:14`). The data doctor has no warn level.

1. Not Linux: one FAIL `platform`, "doctor --host checks a Linux server, and this is <macOS|Windows|name>" (`server/headless/host-doctor.ts:244-247`).
2. It runs the container, port, clock and connector checks in parallel (`server/headless/host-doctor.ts:248`).
3. Then it adds the results in this order: system, arch, containers, userns, seccomp, cgroup, disk, encryption, size, port, web-ports, clock, connector checks (`server/headless/host-doctor.ts:249-250`).
4. The port is `--port`, else `OMB_PORT`, else 8799. A bad port gives "--port must be 1-65535" (`server/headless/host-doctor.ts:315-323`).
5. The JSON is `{ok: problems === 0, problems, warnings, checks}`. The exit is 7 (`EXIT.hostMissing`) when a FAIL exists, else 0. The last human line is "<n> problem(s)[, <m> warning(s)]." or "Ready[, with <m> warning(s)]." (`server/headless/host-doctor.ts:253-265`).

| Limit | Value | Source |
|---|---|---|
| Each external command | 10 000 ms, with `LC_ALL=C` added to the whole `process.env` | `server/headless/host-doctor.ts:267-273` |
| Clock HEAD request | 5 s | `server/headless/host-doctor.ts:292-303` |
| Port probe `GET /api/health` | 2 s | `server/headless/host-doctor.ts:304-311` |
| Disk | under 10 GB FAIL, under 100 GB warn (GB = 10^9) | `server/headless/host-doctor.ts:54`, `server/headless/host-doctor.ts:162-169` |
| Memory and CPU | under 2 GiB FAIL, under 4 CPUs or 7.5 GiB warn | `server/headless/host-doctor.ts:193-199` |
| Clock offset | over 300 s FAIL, over 30 s or not synced warn | `server/headless/host-doctor.ts:55`, `server/headless/host-doctor.ts:229-241` |

A command that passes its time limit gives `ok: false, missing: false`. So a hung docker reads as FAIL "daemon is not running" (`server/headless/host-doctor.ts:85-88`). The host doctor does not look at engines or sign-in.

#### The server doctor

`openmausbot doctor [--wait DURATION]` asks a running server over HTTP (`server/headless/commands.ts:19-71`).

1. It calls the tools `get_system_health` and `list_available_models` in parallel (`server/headless/commands.ts:26`).
2. After a 403 from the models tool, it reads `GET /api/health/engines`, which gives only a count. This is the case of a local caller with no session on a shared server, such as `docker compose exec omb openmausbot doctor` (`server/headless/commands.ts:21-25`).
3. An engine is "available" when `instance.snapshot.state === "available"` (`server/headless/commands.ts:29`). The doctor reads the snapshot of the server. It does not probe engines itself.
4. It reads `/.well-known/openmausbot/environment`, `/api/auth/session` and `/api/config` in parallel. Each error becomes null (`server/headless/commands.ts:31-36`).
5. Problems (`server/headless/commands.ts:39-43`):
   - The server is not the reference app.
   - The server has no `capabilities.jobs` ("too old for the headless commands").
   - No engine is available: "no engine is available: set one up with `openmausbot engine set KIND --key-env VAR`".
6. Warnings: the session expires in under 14 days, or the bots have no browser (`server/headless/commands.ts:44-48`).
7. Exit: 0 when ready, 1 when it is the right server and not too old but has no engine, else 5 (`server/headless/commands.ts:61`).
8. With `--wait`, it loops until it is ready or the deadline passes. A throw before the deadline counts as `{ok:false}` with exit 5. It sends a progress event `{event:"doctor", ready:false, problems}` and sleeps min(1000 ms, time left) (`server/headless/commands.ts:84-97`). With no `--wait` it runs once.
9. A throw at or after the deadline is thrown again (`server/headless/commands.ts:91`). With no `--wait` the deadline is already past, so any throw is thrown again. The exit code then comes from the error handling of the client, not from `EXIT.unreachable`.
10. `--wait` takes `90`, `90s`, `5m`, `2h` or `30d`. A bare number is seconds. The default bounds are 1 s to 1 day (`server/headless/args.ts:222-236`).

#### The headless `engine set` command

`engine set` sets API keys only. It has no sign-in for a CLI engine and no account folders (`server/headless/engine.ts`).

1. It reads the key from `--key-env VAR` or `--key-file FILE`, "Never from the command line itself". Exactly one of the two must be given (`server/headless/engine.ts:23-41`, `server/headless/engine.ts:130`). The value is trimmed. These are usage errors: an unset variable, a file that cannot be read (only the code shows), an empty file, or neither flag.
2. It checks the kind against `ENGINE_KINDS` (ten kinds), the base URL against the rule of the kind (`no`, `allowed`, `required`) and against `^https?://\S+$`. `--only-claude-api` is for claude only (`server/headless/engine.ts:10-21`, `server/headless/engine.ts:70-75`).
3. It reads `GET /api/config`. `configured === true` means a key is set (`server/headless/engine.ts:77-78`).
4. When the kind is not configured, or with `--rotate`, it patches `key` (and `url` when given). Else it patches only a different base URL, and only when the server shows the URL (`server/headless/engine.ts:81-88`).
5. For claude it writes `everyClaudeBot = !onlyClaudeApi` when the key changes or the flag differs (`server/headless/engine.ts:89-92`).
6. A base URL that the server hides gives a warning and is not written (`server/headless/engine.ts:93-96`).
7. `--dry-run` returns the result with `dryRun: true` and sends nothing (`server/headless/engine.ts:97`).
8. It sends `PUT /api/config` with `{[config]: patch}` when the patch is not empty. The key is in the HTTP body (`server/headless/engine.ts:98`).
9. With `--install`, it reads `GET /api/instances`. An `available` instance gives `installed: "already"`. Else it sends a progress event `{event:"installing", engine}` and calls `POST /api/instances/<id>/install` with `INSTALL_TIMEOUT_MS` = 21 min. The server stops a download at 20 min (`server/headless/engine.ts:54-67`, `server/headless/engine.ts:99-108`).
10. The result is `{ok:true, kind, instanceId, configured, changed, dryRun?, warnings?, installed?, state?}`. It never holds the key (`server/headless/engine.ts:95-106`).

`engine list` calls `list_available_models` and `GET /api/config` in parallel. The JSON is `{instances, keys: {<kind>: boolean}}`. It never shows a key value (`server/headless/engine.ts:114-125`).

#### The headless `login` command

`login` signs the CLI in to a server of the reference project. It is not an engine sign-in (`server/headless/login.ts:1-2`).

1. In a bot's shell, `login`, `logout`, `use` and `servers` are refused with exit 5 (`server/headless/login.ts:22-25`).
2. Each HTTP call has a 15 000 ms timeout and `redirect: "error"` (`server/headless/login.ts:27-34`).
3. It finds the server: the typed address, else a named server, else a probe of 127.0.0.1 ports 8799, 18799 and 28799. None gives exit 5 (`server/headless/login.ts:14`, `server/headless/login.ts:42-61`).
4. It reads `GET /.well-known/openmausbot/environment`. No `environmentId` gives exit 5 (`server/headless/login.ts:117-120`).
5. A loopback server that is not the desktop app pairs directly (`server/headless/login.ts:70-76`).
6. Else it sends the SHA-256 of a random 32-byte verifier to `POST /api/auth/cli-login`. 404 gives "this server does not take openmausbot login yet". It shows the code on stderr (`server/headless/login.ts:78-111`).
7. It polls `POST /api/auth/cli-login/<id>` (`server/headless/login.ts:95-110`):
   - The interval comes from the server, clamped to 500..5000 ms, default 1000.
   - The deadline is the server `expiresAt`, default now + 10 min.
   - 202 continues. 200 with a token returns.
   - `state: "denied"` gives exit 5. An abort gives exit 130. Past the deadline: "nobody allowed the sign-in within ten minutes" with exit 1.
8. It saves the server and the token to the macOS Keychain or a private file. The result never holds the token (`server/headless/login.ts:128-136`).

#### Exit codes

| Name | Code | Source |
|---|---|---|
| done | 0 | `server/headless/args.ts:6-23` |
| failed | 1 | same |
| usage | 2 | same |
| needsInput | 3 | same |
| timeout, needsLogin | 4 | same |
| unreachable, notAllowed | 5 | same |
| changes, conflict | 6 | same |
| notFound, hostMissing (`doctor --host`) | 7 | same |
| dataProblems (`doctor --data`) | 8 | same |
| interrupted | 130 | same |

Server refusals map the same way for every verb: 401 needsLogin, 403 notAllowed, 409 conflict, 404 notFound (`server/headless/args.ts:3-5`). With `--json`, stdout has exactly one JSON document, errors too: `{ok:false, error, hint?, exitCode}`. Progress goes to stderr as JSON lines. All printed text is redacted (`server/headless/output.ts:1-61`).

### 3.6 Named accounts, the default account and the Claude account environment

A **named account** is one more entry in the list of engine instances (an instance is one configured engine with its own settings). The entry has its own id, its own home folder for the sign-in, and no environment of its own. A bot selects an account with its `modelSelection.instanceId`. Each turn of that bot runs in that account (`server/claude-account-api.test.ts:299-318`).

The list of instances is the `instances` map in `<DATA_DIR>/config.json` (`server/config.ts:883`, `server/config.ts:958-973`). Section 4.2 gives the file rules.

There are three kinds of named account in this theme:

| Kind | Id | Driver and config | Sign-in store |
|---|---|---|---|
| Claude account | `claude-<uuid>` | `claudeAgent`, `config.configDir` | The Claude CLI's own store in `CLAUDE_CONFIG_DIR` (`server/claude-accounts.ts:73-84`) |
| ChatGPT plan account | `chatgpt-<uuid>` | `codex`, `config.authMode: "chatgpt-plan"` | The server's own `credentials.json`, or Codex's `auth.json` on a Cloud (`server/routes/instances.ts:171-188`, `server/drivers/codex-account-home.ts:13-21`) |
| Default accounts | `claude`, `codex`, `chatgpt` | Built-in entries | The sign-in of the computer (Claude, Codex) or the server's own file (ChatGPT plan) |

**The default account.** The built-in entry `claude` is the default Claude account. It has no explicit directory. When the entry environment and the server environment do not set `CLAUDE_CONFIG_DIR`, `configuredAccountDirectory` returns `""` (`server/claude-accounts.ts:47-52`). An empty directory means the CLI's own default, so the default account uses the shared sign-in of the computer: the server's `CLAUDE_CONFIG_DIR` or `~/.claude`. `claudeAccountInfo` marks it with `isDefault: instanceId === "claude"` (`server/claude-accounts.ts:103-111`). The default account cannot be deleted. A delete of `claude` gives 400 (`server/claude-account-api.test.ts:295-296`).

#### Add a Claude account

1. The owner sends `POST /api/instances/claude-accounts` with `{ displayName, configDir? }` (`server/routes/instances.ts:304-317`).
2. The route accepts JSON only. Another content type gives 415. Malformed JSON gives 400 (`server/claude-account-api.test.ts:428-457`).
3. The route checks the body with `createClaudeAccountSchema`. The schema is strict. `displayName` is trimmed, 1 to 80 characters, with no control characters. `configDir` is trimmed, at most 4096 characters, with no control characters (`server/claude-accounts.ts:13-15`). An extra key, for example `environment`, gives 400 (`server/claude-accounts.test.ts:14-27`).
4. Only one settings change runs at a time. A second change gets 409 "provider settings are already being updated" at once. It does not wait (`server/routes/instances.ts:171-188`, `server/routes/instances.ts:565-571`).
5. A paired client token gets 403. Only the owner (the "admin" scope) can create, change or delete an account (`server/request-auth.ts:535-542`, `server/claude-account-api.test.ts:449-455`).
6. `newClaudeAccount(cfg, body)` builds the new map from `persistableInstanceConfigs(cfg)`. It does not write (`server/claude-accounts.ts:71-89`).
   - The id is `claude-<uuid>` (`server/claude-accounts.ts:73`).
   - The entry copies the `cli` of the first `claudeAgent` entry. It does not copy that entry's environment or sign-in (`server/claude-accounts.ts:74-76`). So the token of the default entry never reaches the new account (`server/claude-accounts.test.ts:14-27`).
   - With no `configDir` in the body, the home is `<DATA_DIR>/providers/<instanceId>` (`server/claude-accounts.ts:82`).
7. The folder check (see "How the folder is checked" below) runs on the new entry.
8. `persistProviderInstance` saves the whole map with `saveConfig({ instances }, { replaceInstances: true })`. Then it reloads only that instance. Sibling instances keep the same object and their running processes (`server/index.ts:11769-11782`, `server/claude-accounts.test.ts:49-72`, `server/claude-account-api.test.ts:320-351`).
9. The reply is 201 with `{ instanceId, instances }`. Each Claude row has `claudeAccount: { configDir, signInCommand, isDefault }`, and `install.signInCommand` has the same command (`server/claude-account-api.test.ts:36-41`, `server/index.ts:11696-11711`).

The create route does not sign the account in. The person signs in later (section 3.7).

#### How the folder is chosen and checked

1. `resolveClaudeConfigDir(configDir, env)` takes the given directory. Else it takes `CLAUDE_CONFIG_DIR`. Else it takes `<HOME or USERPROFILE or os home>/.claude` (`server/drivers/claude.ts:91-99`).
2. `~` and `~/` expand to the home. A relative path, a path such as `~other/work`, or a control or format character throws "claude: configDir must be an absolute path or start with ~/" (`server/drivers/claude.ts:91-99`, `server/drivers/claude-accounts.test.ts:87-99`).
3. `accountDirectory(entry)` calls the resolver with `{...process.env, ...entry.environment}`. A value that is not a string, or a path that does not resolve, gives status 400: "Use an absolute Claude configuration directory or a path beginning with ~/." (`server/claude-accounts.ts:37-45`).
4. Two accounts cannot share a folder. The check compares real paths (`realpathSync.native`). On Windows it compares them in lower case. A malformed other entry does not block. A match gives status 409: "That Claude directory is already configured. Select the existing account or use a separate directory." (`server/claude-accounts.ts:54-69`).
5. A saved entry with a bad directory does not stop the server. Its snapshot shows `state: "unavailable"` and it has no sign-in command. `PATCH` with an absolute `configDir` repairs it. A relative one gives 400 and the saved value stays (`server/claude-account-api.test.ts:246-260`).

#### Change, rename and delete

1. `PATCH /api/instances/:id` uses the strict `instanceSettingsSchema`. It needs at least one key (`server/claude-accounts.ts:16-30`). An empty body gives 400 (`server/claude-account-api.test.ts:428-457`).
2. `configDir` is allowed only for Claude. `displayName` is allowed for Claude, Codex (ChatGPT) and Antigravity (`server/routes/instances.ts:499-501`).
3. An account with a running turn refuses a change with 409 "Wait for bots using this account to finish before changing its settings." (`server/routes/instances.ts:486-488`).
4. A `configDir` change that moves the resolved folder gives 409 "This account is used by bots or conversation history. Add another account and select it for the bot instead." when any bot, backup, task, resume cursor or last engine of a task names the account (`server/routes/instances.ts:540-549`). This stays true after the bot moved to another account (`server/claude-account-api.test.ts:299-318`).
5. A rename keeps the id and the folder (`server/claude-account-api.test.ts:281-284`).
6. `DELETE /api/instances/:id` removes only added accounts. Other ids give 400 "Only added accounts and custom endpoints can be removed here." (`server/routes/instances.ts:575-579`). An account in use gives 409 (`server/routes/instances.ts:580-582`).
7. A delete removes only the saved entry. The account folder and its files stay. The account is not signed out (`server/claude-accounts.ts:1-2`, `server/claude-account-api.test.ts:286-294`).

#### How the environment of a Claude account is built

`claudeEnvironment(model, source, configDir, instanceEnvironment, endpoint, bedrock)` builds one environment. The sign-in checks and the turns use the same function, so a check never reports a login that a turn removes (`server/drivers/claude.ts:110-137`).

1. It starts from the whole server environment plus the instance environment (`{ ...process.env, ...input.environment }`) (`server/drivers/claude.ts:681`). It adds to `PATH` and sets `NPM_CONFIG_LOGLEVEL=error` (`server/drivers/claude.ts:119`).
2. It sets `CLAUDE_CONFIG_DIR` to the account folder (`server/drivers/claude.ts:120-121`). It does not change `HOME`. So two Claude accounts differ only in `CLAUDE_CONFIG_DIR` (`server/drivers/claude-accounts.test.ts:101-125`).
3. For a named account, an endpoint or a Bedrock engine, it removes every key in `CLAUDE_ACCOUNT_ENV_KEYS`, except a key that the instance itself sets (`server/drivers/claude.ts:122-129`). The list is in the table below.
4. It always removes `CLAUDE_CODE_OAUTH_*` and the `*_FILE_DESCRIPTOR` keys. So a subscription login always comes from the account's own sign-in (`server/drivers/claude.ts:122-129`).
5. A Bedrock engine also loses the parent's AWS keys (`server/drivers/claude.ts:123`). A named account with `CLAUDE_CODE_USE_BEDROCK` keeps them (`server/drivers/claude-accounts.test.ts:168-196`).
6. It removes `CLAUDECODE`, `CLAUDE_CODE_ENTRYPOINT` and the workspace credential variables (`server/drivers/claude.ts:130-132`).
7. It removes an inherited `ANTHROPIC_API_KEY`, unless the instance sets one or a local model is injected. The code comment says the key "would flip a subscription login to pay-as-you-go" (`server/drivers/claude.ts:133-135`).

The default account (no `configDir`) keeps the other keys of the parent. For example, the parent's `ANTHROPIC_AUTH_TOKEN` and the inherited `CLAUDE_CONFIG_DIR` reach the CLI. `ANTHROPIC_API_KEY` does not (`server/drivers/claude-accounts.test.ts:127-135`).

| `CLAUDE_ACCOUNT_ENV_KEYS` (`server/drivers/claude.ts:75-89`) |
|---|
| `CLAUDE_CODE_OAUTH_TOKEN`, `CLAUDE_CODE_OAUTH_REFRESH_TOKEN`, `CLAUDE_CODE_OAUTH_SCOPES` |
| `CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR`, `CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR` |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_CUSTOM_HEADERS` |
| `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, `CLAUDE_CODE_USE_FOUNDRY` |

Other rules for the process:

- Keys reach the CLI in the environment, never in the arguments. The MCP config with credentials is a temp file with mode 0600, because `ps` shows the arguments (`server/drivers/claude.ts:1073-1078`).
- The server reuses a live Claude process only when its key matches. The key holds `CLAUDE_CONFIG_DIR` and a hash of the auth settings and the account keys. So a rotated key or a changed account starts a new process (`server/drivers/claude.ts:1112-1128`).
- `OMB_CLAUDE_INHERIT_USER_CONFIG=1` lets bots load the MCP servers, skills, hooks and personal `CLAUDE.md` of the computer. The snapshot then shows a warning and the log says so (`server/drivers/claude.ts:139-156`, `server/drivers/claude.ts:683-685`).
- The sign-in command that a person can copy unsets every account key and `CLAUDE_CONFIG_DIR`, then exports the account's `CLAUDE_CONFIG_DIR` and runs `'<cli>' 'auth' 'login'` in a subshell. On Windows it is a PowerShell block that saves, clears and restores the same keys in `finally`. All values are single-quoted (`server/claude-accounts.ts:91-101`). The command of the default account has no `export CLAUDE_CONFIG_DIR=` (`server/claude-accounts.test.ts:29-39`).

#### How the `settings.json` of the account reaches a turn

1. `readClaudeAuthSettings(env, instanceEnvironment)` reads the `settings.json` in the account folder (`server/drivers/claude.ts:158-181`).
2. It takes only two things: the account keys in its `env` block (not the file-descriptor keys), and `apiKeyHelper` (a command that prints an API key).
3. It takes nothing when the instance itself sets an account key. A read error gives nothing.
4. A turn with isolation writes these values into its own settings file and passes it with `--settings auth-settings.json` (`server/drivers/claude.ts:1081-1082`, `server/drivers/claude.ts:1096`, `server/drivers/claude.ts:1106-1108`).
5. So the hooks, permissions, MCP servers and instructions of the account's `settings.json` do not reach the bot. Personal `~/.claude/CLAUDE.md` and rules are excluded with `claudeMdExcludes` (`server/drivers/claude.ts:1098`).
6. `readClaudeModelCatalog` also reads the account's `settings.json`, for extra model ids. A read error gives an empty settings object (`server/drivers/claude.ts:295-316`).

A manual script checks this with the real Claude CLI. The account's `settings.json` holds `apiKeyHelper` or `env.ANTHROPIC_API_KEY`, `env.ANTHROPIC_BASE_URL` and a personal `SessionStart` hook. Every request must carry the key, the personal hook must not run, and the bot's own `Stop` hook must run (`scripts/verify-claude-auth-settings.ts:51-77`). An endpoint engine does not get the `env` of the person's own `~/.claude/settings.json` (`server/claude-account-api.test.ts:353-400`).

### 3.7 Claude sign-in, sign-out and the "signed in" check

`ClaudeLoginController` owns the sign-in of one Claude instance. It runs the unchanged CLI commands `claude auth login`, `claude auth logout` and `claude auth status --json`. The file header says the project has no OAuth client code for Claude on purpose (`server/drivers/claude-login-auth.ts:1-5`). The server never reads or writes the Claude credential file. The CLI owns it.

#### Limits

| Limit | Value | Where |
|---|---|---|
| Output buffer of the login CLI | `MAX_OUTPUT = 32_768` characters | `server/drivers/claude-login-auth.ts:15` |
| Time to show a sign-in link (`startupTimeoutMs`) | 30 s | `server/drivers/claude-login-auth.ts:66-74`, `server/drivers/claude-login-auth.ts:125` |
| Life of one flow (`lifetimeMs`) | 15 min | `server/drivers/claude-login-auth.ts:113`, `server/drivers/claude-login-auth.ts:127` |
| Time to finish after the code (`completeTimeoutMs`) | 60 s | `server/drivers/claude-login-auth.ts:159` |
| Time to stop a child (`terminateTimeoutMs`) | 1.5 s | `server/drivers/claude-login-auth.ts:409` |
| `auth status --json` | 8 s, then SIGKILL of the child only | `server/drivers/claude-login-auth.ts:288-305`, `server/drivers/claude-auth-status.ts:15` |
| Status output for the snapshot (`maxBuffer`) | 65,536 | `server/drivers/claude-auth-status.ts:15` |
| Logout | 30 s (`startupTimeoutMs`) | `server/drivers/claude-login-auth.ts:232-268` |
| Pasted code | 8 to 1024 characters of `[A-Za-z0-9_\-#.:]`. At `e1cc6a290` (commit `94a1a6d1f`, v0.1.186) also not digits only up to 8 digits, so the code that Claude emails is refused | `server/drivers/claude-login-auth.ts:44-47`; at `e1cc6a290` `:46-49` |
| Trusted link hosts | `claude.com`, `claude.ai`, `console.anthropic.com`, `platform.claude.com` and their subdomains, `https:` only, no user name or password | `server/drivers/claude-login-auth.ts:17-31` |

#### The per-home lock

A module-level set `authenticatingHomes` holds the canonical path of each credential home that has a sign-in or a sign-out in progress (`server/drivers/claude-login-auth.ts:18-19`). The home key is the canonical path of `CLAUDE_CONFIG_DIR`, or `<home>/.claude` (`server/drivers/claude-login-auth.ts:102-106`). Only one flow can run for one home, also across two controllers. The lock does not block turns. The lock is in memory only, so it does not live past a restart.

#### Start a sign-in (`start`, `server/drivers/claude-login-auth.ts:89-142`)

1. A disposed controller throws "This provider was removed. Refresh Settings before signing in." (`server/drivers/claude-login-auth.ts:90`, `server/drivers/claude-login-auth.ts:96`).
2. A waiting flow that has its link is returned again. A waiting flow with no link yet throws "A Claude sign-in is already starting. Please wait for the link." (`server/drivers/claude-login-auth.ts:91-94`).
3. The controller waits until the previous flow has stopped (`server/drivers/claude-login-auth.ts:95`).
4. It reads the environment from `options.environment()`, which is the same `claudeEnvironment` as a turn. `HOME`/`USERPROFILE` and `CLAUDE_CONFIG_DIR` must be absolute, else it throws (`server/drivers/claude-login-auth.ts:97-101`).
5. It takes the home lock. A second sign-in for the same home throws "A Claude sign-in is already running for this server account..." (`server/drivers/claude-login-auth.ts:102-106`).
6. It makes the flow: a random `flowId`, `expiresAt` = now + 15 min, a startup timer and an expiry timer. Both timers are unref'd (`server/drivers/claude-login-auth.ts:107-131`).
   - The startup timer (30 s) ends the flow `failed`: "Claude Code did not show a sign-in link in time...".
   - The expiry timer (15 min) ends the flow `expired`: "The Claude sign-in link expired. Start sign-in again."
7. It runs `auth status --json` first. If the account is signed in already, the flow ends `succeeded` and no login process starts. The code comment says: "Never replace a working login because the button was clicked twice" (`server/drivers/claude-login-auth.ts:132-138`).
8. Else it starts `claude auth login` with pipes. On POSIX the environment has `BROWSER=true`, so the CLI prints the link. `NO_COLOR=1` is always set (`server/drivers/claude-login-auth.ts:310-319`).
9. stdout and stderr go into one buffer. More than 32,768 characters fails the flow: "Claude Code returned an unexpected sign-in response. Update the server's Claude CLI and try again." (`server/drivers/claude-login-auth.ts:325-330`).
10. `claudeLoginPrompt` removes terminal control codes, ignores the last line (it may be partial), takes the first `https://` token of a line, removes trailing `),.;`, and accepts it only when `claudeSignInLink` accepts it (`server/drivers/claude-login-auth.ts:33-41`).
11. When a trusted link appears, the flow becomes `ready`, the startup timer stops, and `start` returns `{ phase: "waiting", flowId, authorizationUrl, expiresAt }` (`server/drivers/claude-login-auth.ts:333-338`). A link on another host is never shown. The start then times out (`server/drivers/claude-login-auth.test.ts:249-253`).
12. A spawn error with ENOENT gives "Claude Code is not installed on this server...". Another spawn error gives "Claude Code could not start on this server. Check the configured CLI path and its executable permissions." (`server/drivers/claude-login-auth.ts:342-347`).

#### Paste the code (`complete`, `server/drivers/claude-login-auth.ts:144-166`)

The person opens the link, signs in at Anthropic, and copies a code from the page. The window sends it with `POST /api/instances/:id/auth/complete` `{ flowId, code }` (`server/routes/instances.ts:396-405`).

1. A wrong `flowId`, a flow that is not waiting, or a flow with no link throws "This sign-in is no longer available. Start sign-in again." (`server/drivers/claude-login-auth.ts:146-147`, `server/drivers/claude-login-auth.ts:76`).
2. A second code throws "A code was already sent for this sign-in..." (`server/drivers/claude-login-auth.ts:148`).
3. A code that fails `claudeLoginCode` throws "Paste the whole code shown on Anthropic's page after signing in." (`server/drivers/claude-login-auth.ts:149-150`). The code is not sent then. At `e1cc6a290` (commits `94a1a6d1f`, `46f016125`, v0.1.186) the text is `NOT_THE_CODE`: "That is not the code from Claude's page. If it is the login code Claude emails you, enter it on Claude's page, click Authorize, then paste the longer code Claude shows.", and the error has `reason: "wrong_code"` (`server/drivers/claude-login-auth.ts:51`, `:154`).
4. The controller writes the code and a newline to the stdin of the login process. A write error fails the flow (`server/drivers/claude-login-auth.ts:162-164`).
5. It waits for the flow to finish. A 60 s timer fails it: "Claude Code did not finish the sign-in after the code was entered. Start sign-in again." (`server/drivers/claude-login-auth.ts:155-161`).

#### The login process closes (`server/drivers/claude-login-auth.ts:348-367`)

1. The controller runs `auth status --json` again. Only "in" gives `succeeded`.
2. Not signed in, code sent, and the output matches `/invalid|expired|denied|rejected/i`: "Anthropic did not accept that code...".
3. Not signed in, code sent, other output: "Claude Code finished but is not signed in. Start sign-in again."
4. No code sent and exit 0: the same text. No code sent and exit not 0: "Claude Code stopped before the sign-in finished. Check the server's connection and try again."

The exit code of the login CLI is never the proof of a sign-in. The status command is the proof.

#### End of a flow (`finish`, `server/drivers/claude-login-auth.ts:370-406`)

1. It sets the final phase once.
2. It clears both timers, the link, `expiresAt` and the output buffer.
3. It settles the promises of `start` and `complete`.
4. It stops the child. `stopChild` calls `killCliTree(child, 1500 ms)`. If that fails, on POSIX it sends SIGKILL to the process group, and on Windows it calls only `child.kill("SIGKILL")`. Then it waits at most 1.5 s for the close (`server/drivers/claude-login-auth.ts:408-427`).
5. It releases the home lock only when the child stopped. If the child cannot stop, the status becomes `failed`: "Claude Code could not be stopped on this server. Ask the server administrator to stop the login process before trying again." The lock is then released when the child closes.
6. On `succeeded` it calls `onAuthenticated` and ignores its error (`server/drivers/claude-login-auth.ts:405`). The driver uses this to refresh the model list (`server/drivers/claude.ts:1904-1908`).

`cancel` ends a waiting flow as `cancelled` ("Claude sign-in cancelled."), waits for the stop, throws if the stop failed, and stops a running logout child (`server/drivers/claude-login-auth.ts:173-180`). `dispose` sets `disposed`, cancels, waits at most 1.5 s for a sign-out in progress, and drops the flow (`server/drivers/claude-login-auth.ts:182-189`).

#### Sign out (`signOut`, `server/drivers/claude-login-auth.ts:192-268`)

1. A waiting flow blocks a sign-out: "Finish or cancel the Claude sign-in in progress before signing out." (`server/drivers/claude-login-auth.ts:204`).
2. The controller does the same absolute-path check and takes the same home lock as a sign-in (`server/drivers/claude-login-auth.ts:207-216`). A sign-in on another controller of the same home blocks it too (`server/drivers/claude-login-auth.test.ts:160-177`).
3. It runs `<cli> auth logout` with stdin closed. A 30 s timer stops a CLI that hangs. If the CLI cannot be stopped, the promise rejects (`server/drivers/claude-login-auth.ts:232-268`).
4. It runs `auth status --json` again (`server/drivers/claude-login-auth.ts:220-222`):
   - "in" throws "Claude Code still reports a sign-in on this server...".
   - "unknown" throws "Claude Code could not confirm the sign-out on this server...".
   - Only "out" is a success.
5. It releases the home lock at once, or when a logout child that still runs closes (`server/drivers/claude-login-auth.ts:223-229`).
6. The controller deletes no file. The CLI owns the credentials.

#### How "signed in" is found

There are two readers of `auth status --json`.

**The login controller** (`authStatus`, `server/drivers/claude-login-auth.ts:274-308`):

| Result | Condition |
|---|---|
| "in" | Exit code 0 and JSON `loggedIn === true` |
| "out" | Exit code 1 and JSON `loggedIn === false` |
| "unknown" | A spawn error, the 8 s timeout, output that is not JSON, or an exit code and a flag that do not agree |

Only "in" maps to true (`server/drivers/claude-login-auth.ts:270-272`). So for `start`, "unknown" starts a login process. It does not report "signed out". An exit code 2 with `loggedIn:false` is not a proof of sign-out (`server/drivers/claude-login-auth.test.ts:230-233`).

**The snapshot** (`claudeAuthStatus`, `server/drivers/claude-auth-status.ts:15-36`). It runs the same command with a timeout of 8000 ms and `maxBuffer` 65,536. It reads only the JSON, not the exit code.

| Output | Result |
|---|---|
| Process killed (timeout) | `{}`: no `authenticated` value (`server/drivers/claude-auth-status.ts:16`) |
| JSON `loggedIn === false` | `{ authenticated: false }` (`server/drivers/claude-auth-status.ts:19-20`) |
| JSON `loggedIn` missing or another value | `{}` (`server/drivers/claude-auth-status.ts:19-20`) |
| JSON `loggedIn === true` | `{ authenticated: true, account? }` (`server/drivers/claude-auth-status.ts:33`) |
| Not JSON | `{}` (`server/drivers/claude-auth-status.ts:34-36`) |

The doc comment gives the rule: only `loggedIn: false` means signed out. A timeout, for example a Keychain prompt that stays open, "says nothing". The server asks the CLI because the credential store differs by platform (Keychain or a JSON file), and a check that a file exists accepts old credentials (`server/drivers/claude-auth-status.ts:5-8`).

`account` holds `email` (trimmed, at most 254 characters, no control or format characters, the shape of an address), `organization` from `orgName` (at most 160), and `method: "api-key"` when `authMethod === "api_key"` (`server/drivers/claude-auth-status.ts:21-32`). Tokens and other fields of the status JSON never reach the snapshot (`server/drivers/claude-accounts.test.ts:198-217`).

The snapshot flow (`server/drivers/claude.ts:1795-1806`):

1. It reads the CLI version first. A failed read gives `state: "unavailable"`, with `busy` when the check could not finish (`server/drivers/claude.ts:1795-1796`).
2. An instance that needs an API key and has none is unavailable: "No Anthropic API key — open Settings → AI → Providers." (`server/drivers/claude.ts:264`, `server/drivers/claude.ts:1803`). An instance that needs an API key and has one counts as signed in, with no status call (`server/drivers/claude.ts:1804`).
3. Else it calls `claudeAuthStatus` (8 s). When the result has no `authenticated` value, it uses the last known result `lastAuth`. A definite result replaces `lastAuth` (`server/drivers/claude.ts:1804-1805`).
4. It returns `{ state: "available", version, authenticated?, account?, billing..., update?, warning? }` (`server/drivers/claude.ts:1806`).

Edge case: at the first check after a start there is no `lastAuth`. A timeout then gives a snapshot with no `authenticated` field. The helper `claudeSignedIn` folds "unknown" into false (`server/drivers/claude-auth-status.ts:41-47`, `server/drivers/claude-auth.test.ts:30-40`). The report found no server code outside tests that calls it. (Problem a.)

#### The routes

- `POST /api/instances/:id/auth/start`, `auth/complete`, `auth/cancel`, `auth/sign-out` accept JSON only. The `auth/*` replies have `Cache-Control: no-store` (`server/routes/instances.ts:330-338`).
- `GET /api/instances/:id/auth/status?flowId=` has `no-store`. A finished flow drops the cached snapshots (`server/routes/instances.ts:322-329`).
- The owner of a flow is a session id, `companion:<device header>` for a paired device, or "loopback". Each phone has its own sign-in and never resumes the sign-in of another (`server/routes/instances.ts:319-321`).
- `check` forgets the last read of the sign-in (`forgetAuthentication`) and runs the engine check again (`server/routes/instances.ts:340-348`).
- An error keeps its status when it is 400, 401, 404, 409, 413 or 415. Any other error is 500 (`server/routes/instances.ts:409-413`).

After a turn stops with `auth_required`, the driver closes the process ("authentication required") (`server/drivers/claude.ts:1330`). The detection of a signed-out turn (`claudeAuthFailure`, the synthetic refusal frame of Claude Code 2.1.295) is part of provider recovery (`server/drivers/claude-auth-recovery.ts:15-50`).

### 3.8 Codex accounts, the Codex shared home and engine homes

#### The four kinds of Codex account

`CodexConfig` has `cli`, `fullAuto`, `authMode?: "chatgpt-plan"`, `managed?` (company) and `endpoint?` (direct API). A config cannot combine the three kinds (`server/drivers/codex.ts:77-97`). The driver has four routes (`server/drivers/codex.ts:216-220`, `server/drivers/codex.ts:300`):

| Route | Condition | Sign-in store |
|---|---|---|
| The person's own Codex login | `ownLogin = !plan && !routed` | `$CODEX_HOME` or `~/.codex` |
| ChatGPT plan, browser sign-in | `plan` | The server's `credentials.json` (section 3.9) |
| ChatGPT plan, device sign-in (`deviceHome`) | A plan on a Cloud or a hosted workspace | Codex's `auth.json` in `<account folder>/codex` |
| Routed endpoints | `endpoint` or `managed` | A key in the instance environment (another writer covers it) |

`chatgptAccountSignsInByDevice(config, env)` is true for `authMode === "chatgpt-plan"` when a hosted workspace or a cloud home is configured (`server/drivers/codex-account-home.ts:23-27`). The first Codex account keeps the person's own Codex home (`server/drivers/codex-account-home.ts:1-5`).

#### How the Codex environment is built (`childEnv`, `server/drivers/codex.ts:221-240`)

1. It starts from the whole server environment plus the instance environment, and adds to `PATH` (`server/drivers/codex.ts:222-227`).
2. It removes `OPENAI_API_KEY`. The comment says: "A leaked API key silently flips Codex's own ChatGPT login to pay-as-you-go". It also removes the workspace credential variables, `OPENMAUSBOT_CHATGPT_TOKEN`, `OPENMAUSBOT_CODEX_API_KEY` and the three bridge variables (`server/drivers/codex.ts:228-233`).
3. A direct API endpoint gets its key and its `CODEX_HOME` from its instance environment (`server/drivers/codex.ts:234-237`).
4. A plan account (both sign-in kinds) gets `CODEX_HOME=<DATA_DIR>/providers/chatgpt-plan/<sha256 of id>/codex` and loses `CODEX_SQLITE_HOME` (`server/drivers/codex.ts:238`).

#### "Signed in" for the person's own login (`server/drivers/codex-login.ts`)

Codex keeps its login in `<CODEX_HOME>/auth.json`, unless `config.toml` moves it to the keyring with `cli_auth_credentials_store`. The default is "file" in codex-cli 0.160.1 (`server/drivers/codex-login.ts:1-2`).

1. `readCodexLogin(cli, env)` runs `<cli> login status` with an 8000 ms timeout (`server/drivers/codex-login.ts:35-36`).
2. It reads the text of the output:

| Result | Condition | Line |
|---|---|---|
| "signed-in" | No error, and a line starts with "Logged in" or "API key configured" | `server/drivers/codex-login.ts:22-26`, `server/drivers/codex-login.ts:38` |
| "signed-out" | An error, and a line starts with "Not logged in" or "Error checking login status" | `server/drivers/codex-login.ts:40` |
| "unknown" | All other cases | `server/drivers/codex-login.ts:40` |
| `apiKey` | "Logged in using an API key" (0.160.1) or "API key configured" (0.165.0) | `server/drivers/codex-login.ts:28-29`, `server/drivers/codex-login.ts:41` |
| `busy: true` | Not signed in, and the failure is not clear: a resource shortage code, a killed process with no string code, or SIGKILL with no number code | `server/drivers/codex-login.ts:42`, `server/harness/probe-hold.ts:34-40` |

3. `keptCodexLogin()` keeps the last finished answer when a check is `busy`. With no earlier answer it gives false (`server/drivers/codex-login.ts:47-51`). So a timeout does not change a signed-in account to signed out. An "unknown" that is not `busy` (for example, a new output text) counts as not signed in.

Edge case: a corrupt `auth.json` that Codex cannot read counts as signed out, because Codex prints "Error checking login status" (`server/drivers/codex-login.ts:40`).

**The check before a turn** (`codexLoginCheck`, `server/drivers/codex-login.ts:57-75`). Without a login, Codex runs a turn and fails only after a minute of reconnects. So the driver checks first:

1. A readable JSON `auth.json` is "present". No CLI call runs (`server/drivers/codex-login.ts:65-66`).
2. Else it asks `login status`. Only Codex's own "not logged in" gives "missing", and only when `auth.json` is still unreadable after the check. Another Codex may rewrite the file at that time (`server/drivers/codex-login.ts:67-71`).
3. A login that Codex reads from another place (the keyring) is remembered for that exact stored value. Later turns skip the check until `forget` runs after a turn found the login gone. A status asked before `forget` does not confirm it again (`server/drivers/codex-login.ts:61-73`).
4. "unknown" counts as "present". The turn runs.
5. On "missing" the turn ends at once with `runtime.error` (setup) and `turn.completed { ok: false, stopReason: "auth_required", unsent: true }` (`server/drivers/codex.ts:402-415`).

**The snapshot** (`server/drivers/codex.ts:1398-1426`):

1. It reads the CLI version first. A failed read is `unavailable`, with `busy` when the check could not finish (`server/drivers/codex.ts:1401-1402`).
2. Own login and device home: a new CLI version refreshes the models. Then `readCodexLogin` and `keptCodexLogin` run (`server/drivers/codex.ts:1409-1412`).
3. A login that OpenAI refused (a failed turn marks it) shows `authenticated: false` with `CODEX_SIGN_IN_EXPIRED` (`server/drivers/codex.ts:1413-1416`).
4. The email comes from `account/read` only for a ChatGPT login (`server/drivers/codex.ts:1417`). An API-key login shows `account: { method: "api-key" }` and no ChatGPT sign-out (`server/drivers/codex.ts:1422`).

**The email** (`codexAccountEmail`, `server/drivers/codex-identity.ts:17-89`). Codex itself resolves the active account, also from the keyring. A direct read of `auth.json` can show the email of an old file, so the server asks the CLI (`server/drivers/codex-identity.ts:1-2`).

1. It gives null when the working folder (`HOME`, `USERPROFILE` or the OS home) is not absolute, or there is no Codex home (`server/drivers/codex-identity.ts:23-24`). `codexHome(env)` is `CODEX_HOME` when absolute, else `<user home>/.codex`. A relative `CODEX_HOME` gives null (`server/drivers/codex-identity.ts:11-15`).
2. It starts `<cli> app-server`. A spawn error gives null (`server/drivers/codex-identity.ts:26-32`). It reads stderr and never keeps or logs it (`server/drivers/codex-identity.ts:59`).
3. It sends `initialize` with `clientInfo: { name: "openmausbot", version: "1" }`, then `initialized` and `account/read` with `refreshToken: false` (`server/drivers/codex-identity.ts:75-79`, `server/drivers/codex-identity.ts:87`).
4. It takes the email only when `account.type === "chatgpt"`, at most 254 characters, the shape of an address, no control or format characters (`server/drivers/codex-identity.ts:80-83`).
5. A parse error, an error reply, output over 16,384 bytes, a close or the 3 s timeout gives null (`server/drivers/codex-identity.ts:8`, `server/drivers/codex-identity.ts:53-74`).
6. `finish` stops the process tree with `killCliTree(child, 1000)`. If that fails, it sends SIGKILL to the process group on POSIX, or calls `child.kill("SIGKILL")` on Windows. If the process still runs, it drops the email (`server/drivers/codex-identity.ts:37-52`).

#### Device sign-in for Codex (`server/drivers/codex-device-auth.ts`)

A **device sign-in** shows a URL and a short user code. The person opens the URL on any device and types the code. The generic controller is in `server/drivers/device-auth.ts`. Another writer covers it. Only the Codex settings are here.

1. Commands: `codex login --device-auth` to sign in, `codex login status` to check, `codex logout` to sign out (`server/drivers/codex-device-auth.ts:1`, `server/drivers/codex-device-auth.ts:25-43`). The home is `CODEX_HOME` or `~/.codex` (`server/drivers/codex-device-auth.ts:29-30`).
2. `codexDevicePrompt(output)` removes terminal codes and asks the shared parser for a URL and a user code (`server/drivers/codex-device-auth.ts:7-10`). It accepts only `https://auth.openai.com/codex/device` with a full code line (`server/drivers/codex-device-auth.test.ts:65-75`).
3. The status reader for the device flow (`server/drivers/codex-device-auth.ts:34-41`):

| Result | Condition |
|---|---|
| "signed-in" | Exit 0 and a line "Logged in ... ChatGPT" |
| "other" | Exit 0 and another login ("Logged in" or "API key configured") |
| "signed-out" | Exit not 0 and "Not logged in" |
| "unknown" | All other cases |

   This reader differs from `readCodexLogin`, which also reads "Error checking login status" as signed out (`server/drivers/codex-login.ts:40`).
4. Start: a working ChatGPT login is not replaced. The flow ends `succeeded` after one status call. If the provider refused the login (`signInRejected`), a new login runs. An API-key login is not replaced: "different sign-in method". An unknown status fails closed: "could not confirm the existing sign-in" (`server/drivers/codex-device-auth.test.ts:234-262`).
5. Success needs a status after the device command that says "Logged in ... ChatGPT". An exit 0 of the device command is not a proof (`server/drivers/codex-device-auth.test.ts:310-316`).
6. Sign-out runs `login status`, `logout`, `login status`. A sign-out of an API-key login, or with an unknown status, is refused: "did not confirm a ChatGPT sign-in". No `logout` runs then (`server/drivers/codex-device-auth.test.ts:136-145`, `server/drivers/codex-device-auth.test.ts:222-226`).
7. Failure texts are fixed sentences, never the words of the CLI (`server/drivers/codex-device-auth.ts:12-23`):
   - An old CLI with no `--device-auth`: "needs updating ... npm install -g @openai/codex@latest".
   - Device login turned off: "Enable device-code login in your ChatGPT security settings...". At `e1cc6a290` (commits `94a1a6d1f`, `5aea9c95e`, v0.1.186): "OpenAI did not allow device code sign-in. Turn it on in ChatGPT Settings → Security (your ChatGPT admin may need to), then try again.", with the reason `refused` (`server/drivers/codex-device-auth.ts:18`, `:23`, `:27-31`).
   - The code expired, and a general text.
8. Two controllers of one home: the second start fails "already running for this server account" until the first cancels (`server/drivers/codex-device-auth.test.ts:345-356`).

The driver's sign-out for the own login or a device home closes the warm sessions ("signed out"), runs the device controller's sign-out (`codex logout`, then `login status`), and clears the "refused" mark (`server/drivers/codex.ts:1505-1511`). `startAuthentication` is refused while a sign-out runs (`server/drivers/codex.ts:1493-1497`).

#### The Codex shared home (`server/drivers/codex-shared-home.ts`)

The server's Codex turns run in Codex homes that the server owns. A ChatGPT plan account signs in there, so its login never mixes with the person's. A turn on the person's own login links their login in. The other things the person set up for Codex (`config.toml`, skills, plugins, MCP sign-ins) are linked in from their home too. So a turn works like the person's own Codex. But the server's chats stay in its own home, because the Codex and ChatGPT apps list every session in the person's home as their history (`server/drivers/codex-shared-home.ts:1-5`).

The lists use the names that codex-cli 0.167.2 and 0.169.0 keep:

| List | Entries | Line |
|---|---|---|
| Shared folders, made in the person's home first | `worktrees`, `skills`, `plugins`, `cache`, `logs`, `mcp-oauth-locks` | `server/drivers/codex-shared-home.ts:14-15` |
| Private login files, never linked for a plan's own login | `auth.json`, `auth.lock`, `models_cache.json` | `server/drivers/codex-shared-home.ts:16-17` |
| Chats, never linked | `sessions`, `archived_sessions`, `sqlite`, `shell_snapshots`, `thread-writer-locks`, `history.jsonl`, `session_index.jsonl` and its lock, `.sqlite-maintenance.lock`, every `*.sqlite` | `server/drivers/codex-shared-home.ts:18-22` |
| The person's instructions, never linked | `AGENTS.md`, `AGENTS.override.md` (Codex adds them to every turn, codex-cli 0.169.0) | `server/drivers/codex-shared-home.ts:23-24` |
| Kept per home | `log`, `memories`, `tmp`, `.DS_Store` | `server/drivers/codex-shared-home.ts:25-26` |
| Never linked alone | SQLite journals `-wal`, `-shm`, `-journal` | `server/drivers/codex-shared-home.ts:31-33` |

These are **deny lists**. Every other entry of the person's Codex home is linked: `config.toml` with its MCP servers, model and settings, and any other file, for example a `.credentials.json` of another tool (`server/drivers/codex-shared-home.test.ts:34-62`). (Problems b and f.)

**`linkSharedCodexHome(sharedHome, mausHome, login = "own")`** (`server/drivers/codex-shared-home.ts:81-118`):

1. It makes the server home with mode 0o700 (`server/drivers/codex-shared-home.ts:85`).
2. It removes old links to entries that must stay apart: chats, databases, the instructions, and the private login files when the login is "own". It does this before the sharing, so it happens also when the sharing fails. The person's files behind the links do not change (`server/drivers/codex-shared-home.ts:88-95`).
3. It returns false when there is no absolute person home, or when one home is inside the other (`server/drivers/codex-shared-home.ts:96-98`).
4. It makes the shared folders in the person's home and lists that home. An error is logged once ("could not share your Codex home...") and the function returns false (`server/drivers/codex-shared-home.ts:99-106`).
5. It links each other entry with `linkEntry` (`server/drivers/codex-shared-home.ts:56-76`, `server/drivers/codex-shared-home.ts:107-115`):
   - A link that points to the target stays. A wrong link is replaced.
   - A real entry stays, unless it is an empty rebuilt folder or a lock folder with no held lock.
   - On Windows a folder becomes a junction and a file becomes a file link.
   - EEXIST from a race is accepted.
   - A link error is logged once and does not fail the turn (`server/drivers/codex-shared-home.ts:82`, `server/drivers/codex-shared-home.ts:112-114`).
6. It returns true for "own". For "person" it returns true only when the server home's `auth.json` resolves to the person's file, or when neither home has one (`server/drivers/codex-shared-home.ts:117-126`).

Callers:

- A plan turn links the person's home into the plan's home before each turn and each background call (`server/drivers/codex.ts:370`, `server/drivers/codex.ts:1445`).
- A device home is linked with login "own" when the account is made, before each auth call and before each turn. Errors at create are ignored (`server/drivers/codex.ts:241-243`, `server/drivers/codex.ts:320`, `server/drivers/codex.ts:372`).
- A turn on the person's own login calls `keepChatsOutOfCodexHistory(env, instanceId)` (`server/drivers/codex.ts:435`).

**`keepChatsOutOfCodexHistory(env, instanceId)`** (`server/drivers/codex-shared-home.ts:141-159`):

1. It keeps the person's own home and changes nothing in these cases (`server/drivers/codex-shared-home.ts:148`):
   - there is no Codex home.
   - a Team Cloud is active.
   - the home is already inside the data folder.
   - the person's home has no `auth.json`.
   - the login may be in the keyring.
2. The keyring test is true when `/etc/codex/managed_config.toml` or `/etc/codex/requirements.toml` mentions `credentials_store`, or when the person's `config.toml` has a top-level `cli_auth_credentials_store = "keyring"` or `"auto"`. A setting inside a table does not count. Windows has no system files in the list (`server/drivers/codex-shared-home.ts:128-139`).
3. Else the home is `<dataDir>/providers/codex-own/<sha256 of instance id>/codex`. It is linked with login "person" (`server/drivers/codex-shared-home.ts:149-151`).
4. If the link returns false, the turn uses the person's home. If making the home throws, the log says "could not make <product>'s Codex home, so this turn uses yours: ..." and the turn uses the person's home (`server/drivers/codex-shared-home.ts:152-155`).
5. Else it sets `CODEX_HOME` and `CODEX_SQLITE_HOME` to the new home (`server/drivers/codex-shared-home.ts:156-158`).

In every fallback case of steps 1 and 4 the turn runs in the person's own Codex home. Codex then reads the person's own `AGENTS.md` there. The report found no other code in `server/drivers/codex.ts` that removes `AGENTS.md` (problem f).

#### Engine homes on a Team Cloud (`server/engine-homes/`)

An **engine home** is a folder that the server sets as `HOME` for an engine process. It splits engine state by audience (the team, one room or one member) on a Team Cloud. Engine homes are not named accounts. Off a Team Cloud nothing starts, and every spawn keeps the server's `HOME` (`server/engine-homes/engine-homes.ts:1-3`).

**Spawn flow** (`forSpawn`, `server/engine-homes/engine-homes.ts:90-104`). `procs.ts` calls it for each spawn in a conversation.

1. `within(threadId, start, botId)` runs a start function inside the conversation, so each spawn that it makes counts for that conversation (`server/engine-homes/engine-homes.ts:44-47`). `withEngineHomes(instance)` wraps `sendTurn`, `compactSession`, `prestart.start`, `cacheKeepWarm.ping` and `cacheKeepWarm.compact` in this way (`server/engine-homes/engine-homes.ts:109-127`).
2. `scope()` gives the audience key, so engines never share one process across audiences (`server/engine-homes/engine-homes.ts:59-63`).
3. It runs the migration once (see below).
4. It makes the audience home `<dataDir>/engine-homes/<key>` with mode 0o700. The key is `team`, `room-<16 hex>` or `member-<16 hex>` (`server/engine-homes/layout.ts:12`, `server/engine-homes/layout.ts:18-31`).
5. `homedSpawn` builds the new environment (`server/engine-homes/layout.ts:90-124`):
   1. The real home is the given `HOME`, unless that is inside the engine homes root. Then it is the server home (`server/engine-homes/layout.ts:94-95`).
   2. `HOME` becomes the audience home (`server/engine-homes/layout.ts:96`).
   3. Each folder variable with an absolute value moves. It stays when it is inside the home already. It goes to the same relative place when it was under the real home and not in the data folder. Else it goes to `<home>/.omb-folders/<VAR>-<12 hex of sha256 of the path>` (`server/engine-homes/layout.ts:98-110`).
   4. For each engine, the source of its sign-in is the named folder or `<realHome>/<folder>`. The target is the moved folder. A source inside the engine homes root is skipped. Duplicate targets are dropped (`server/engine-homes/layout.ts:111-122`).
6. It makes each engine folder with mode 0o700. It copies the team's sign-in files into this home and every other audience home (`syncSignIns`).

So a named Claude account (`CLAUDE_CONFIG_DIR` in the data folder) moves to `.omb-folders/CLAUDE_CONFIG_DIR-<hash>` in each audience home. Its `.credentials.json` comes from the account's own folder.

`ENGINE_FOLDERS` names the sign-in files of each engine (`server/engine-homes/layout.ts:56-68`):

| Engine | Folder variable or folder under `HOME` | Sign-in files ("shared") |
|---|---|---|
| Claude | `CLAUDE_CONFIG_DIR` or `.claude` | `.credentials.json` |
| Codex | `CODEX_HOME` or `.codex` | `auth.json`, `config.toml` |
| Eight other engines | (in the same table) | (in the same table) |

Other variables that move with `HOME`: `HERMES_HOME`, `OPENCODE_HOME`, `XDG_STATE_HOME`, `XDG_CACHE_HOME` (`server/engine-homes/layout.ts:70-71`). So on a Team Cloud the Codex `config.toml` is shared to every audience as a sign-in file. Each entry also has a `drivers` field: "the driver kinds whose engine signs in here; a bot box of any other engine never reads these files" (`server/engine-homes/layout.ts:48-49`).

**Sign-in copies** (`server/engine-homes/sign-ins.ts`). Each audience home keeps a copy of each team sign-in file. Inside a bot box, the team's file itself is bound over the copy, so a refreshed token lands in the team's file. Outside a box the engine writes its copy, and a later spawn takes the newest settled copy back into the team's file (`server/engine-homes/sign-ins.ts:1-3`).

`syncSignIn(file, peers, now)` (`server/engine-homes/sign-ins.ts:52-79`):

1. A target that is not a file (a folder, a link) is removed (`server/engine-homes/sign-ins.ts:56-59`).
2. If the team's file is missing, the copy is removed ("removed"). So a sign-out of the team removes every copy at its next spawn (`server/engine-homes/sign-ins.ts:60-64`).
3. The newest settled whole copy among this target and the peer targets, if it is newer than the team's file, is written back into the team's file ("taken back") (`server/engine-homes/sign-ins.ts:65-72`).
4. A copy that is newer but not settled stays. A copy with equal time, size and bytes stays (`server/engine-homes/sign-ins.ts:74-76`).
5. Else the team's file is copied over the target ("copied") (`server/engine-homes/sign-ins.ts:77-78`).

| Limit or rule | Value | Line |
|---|---|---|
| `SETTLED_MS` | 2,000 ms: a younger copy may be half-written and is not taken | `server/engine-homes/sign-ins.ts:9-10` |
| Whole copy | A `.json` copy must parse. Another file must be non-empty | `server/engine-homes/sign-ins.ts:16-19` |
| `copyInto` | Folder 0o700. Temp file `.<name>.<pid>.omb` with mode 0o600, source times copied, then a rename | `server/engine-homes/sign-ins.ts:21-27` |
| `writeInPlace` | Opens the team's file `r+`, writes, truncates, restores times. In place, so a bound box still sees it | `server/engine-homes/sign-ins.ts:29-40` |
| Errors | `syncSignIns` ignores every error of one file. A failed sync never stops a spawn and nothing reports it | `server/engine-homes/sign-ins.ts:81-85` |

A Linux test shows why the write is in place: Claude Code 2.1.294 renames a temp file over its credentials. On a bind mount the rename is refused (EBUSY), so the CLI writes in place, and the refreshed token lands in the team's file (`server/engine-homes/box.linux.test.ts:62-66`).

#### The migration (`server/engine-homes/migrate.ts`)

This is the one migration of engine homes. At the first start of a Team Cloud, it moves the session files that the engines kept in the server's `HOME` into the home of their conversation (`server/engine-homes/migrate.ts:1-4`).

1. `migrate()` runs once after a start. With the marker `<dataDir>/engine-homes/.migrated` present, it does not run again. The marker holds `{ at, moved, held }` with mode 0o600 (`server/engine-homes/migrate.ts:11`, `server/engine-homes/migrate.ts:98`, `server/engine-homes/migrate.ts:157`).
2. `storeThreads(bots)` lists the main thread and each task of each bot, with its resume cursors and working folder (`server/engine-homes/migrate.ts:161-175`).
3. It looks at the state that Claude Code 2.1 and Codex 0.16 keep (`server/engine-homes/migrate.ts:45-51`):

| Engine | Matched to a conversation | Held whole |
|---|---|---|
| Claude | `projects`, `file-history`, `session-env`, `todos`, `debug` | `history.jsonl`, `shell-snapshots`, `plans`, `paste-cache` |
| Codex | `sessions`, `archived_sessions` | `history.jsonl`, `log`, `shell_snapshots` |

   Sign-in files do not move.
4. Matching: it looks up a UUID in the file name among the session ids of every stored conversation. A Claude project folder can also match by its slug (the working folder with each non-alphanumeric character made `-`). A slug that two threads share matches none (`server/engine-homes/migrate.ts:40-43`, `server/engine-homes/migrate.ts:100-108`, `server/engine-homes/migrate.ts:131-139`). It walks a Codex folder at most 6 levels deep (`server/engine-homes/migrate.ts:68-80`).
5. A target that exists already, or no match, goes to `.held/<now>/<engine home>/...` (`server/engine-homes/migrate.ts:109-128`). A held file is never written over a file in its home.
6. `moveEntry` renames. On `EXDEV` it copies with times and removes the source (`server/engine-homes/migrate.ts:53-62`).
7. `sweepHeld` deletes `.held/<ms>` folders older than `HELD_DAYS = 30` on each run (`server/engine-homes/migrate.ts:82-92`, `server/engine-homes/layout.ts:13-15`).
8. Errors inside are thrown. The caller catches them and logs "engine homes: the move from the server's home failed: ...". The result is then `{ ran: false, moved: 0, held: 0, swept: 0 }`, and the server does not try again in that run (`server/engine-homes/engine-homes.ts:65-80`).

When a member leaves, `POST /api/cloud/team/member-left` deletes the engine home of that member only (`server/cloud-team-engine-homes.e2e.test.ts:170-176`).

### 3.9 The ChatGPT plan account

`ChatGptPlanAuthController` is the server's own OAuth client to OpenAI. There is one controller per ChatGPT plan account. Only a safe status and the one-time authorization URL reach the window (`server/drivers/chatgpt-plan-auth.ts:80`). **PKCE** is the OAuth extension where the client sends a hash of a secret first and the secret later, so a stolen code alone is not enough.

#### Constants and limits

| Item | Value | Line |
|---|---|---|
| Issuer | `https://auth.openai.com` | `server/drivers/chatgpt-plan-auth.ts:10` |
| Resource | `https://api.openai.com/v1` | `server/drivers/chatgpt-plan-auth.ts:11` |
| Direct scope | `chatgpt.tokens.use.direct` | `server/drivers/chatgpt-plan-auth.ts:12` |
| Scopes | `openid profile email offline_access resource.invoke chatgpt.tokens.use.direct` | `server/drivers/chatgpt-plan-auth.ts:13` |
| Flow life | 15 min | `server/drivers/chatgpt-plan-auth.ts:14` |
| Terminal refresh errors | `invalid_grant`, `invalid_refresh_token`, `token_expired`, `refresh_token_expired`, `refresh_token_invalidated`, `refresh_token_reused` | `server/drivers/chatgpt-plan-auth.ts:15` |
| HTTP request | `redirect: "error"`, 15 s timeout, 1 MiB body limit | `server/drivers/chatgpt-plan-auth.ts:180-201` |
| `state`, `nonce`, PKCE `verifier` | 32 random bytes each, base64url | `server/drivers/chatgpt-plan-auth.ts:252-254` |
| Token `expires_in` | 1 to 86,400 s | `server/drivers/chatgpt-plan-auth.ts:205-217` |
| ID token clock tolerance | 30 s | `server/drivers/chatgpt-plan-auth.ts:227-237` |
| Credential lock | Retry every 50 ms, at most 30 s | `server/drivers/chatgpt-plan-auth.ts:61-78` |
| File read | At most 512,000 bytes | `server/drivers/chatgpt-plan-auth.ts:49-54` |
| Refresh margin | A token with more than 60 s left is used as is | `server/drivers/chatgpt-plan-auth.ts:361` |
| Revocation | At most 2 attempts, 250 ms between | `server/drivers/chatgpt-plan-auth.ts:414-442` |

#### Add an account

1. The owner sends `POST /api/instances/chatgpt-accounts` with `{ displayName }` (`server/routes/instances.ts:171-188`).
2. The route accepts JSON only (415). It uses the name schema of Claude accounts (400 "Enter an account name (up to 80 characters)."). Only one settings change runs at a time (409).
3. The id is `chatgpt-<uuid>`. The entry is `{ driver: "codex", displayName, config: { authMode: "chatgpt-plan", cli? } }`. `cli` comes from the `chatgpt` or `codex` entry, "never another account's environment".
4. The reply is 201 with `{ instanceId, instances }`. The saved entry is exactly `{ authMode: "chatgpt-plan", cli }`, with no `environment` (`server/chatgpt-plan-api.test.ts:98-113`).

The built-in plan account is `chatgpt: { driver: "codex", config: { authMode: "chatgpt-plan", cli } }` (`server/chatgpt-plan-api.test.ts:59`). The account folder is `<DATA_DIR>/providers/chatgpt-plan/<sha256 hex of the instance id>` (`server/drivers/codex-account-home.ts:13-16`). The file `credentials.json` does not exist before a sign-in finishes (`server/chatgpt-plan-api.test.ts:128-130`).

#### Sign in (`server/drivers/chatgpt-plan-auth.ts:239-336`)

1. The route refuses a `browser-pkce` start with 403 when the request is proxied, does not come from a loopback address, or comes from a paired device. The text is "Continue with ChatGPT on the computer running <product name>: this sign-in finishes in a browser there. Open <product name> on that computer to sign in." The reason: the callback is a loopback on the server's computer (`server/routes/instances.ts:369-379`).
2. Two calls of `start` at the same time share one promise. A disposed controller throws. A waiting flow is returned again (`server/drivers/chatgpt-plan-auth.ts:239-246`).
3. The controller prepares the folders and reads the saved record. A failed read throws, and the sign-in stops before it can write over the file (`server/drivers/chatgpt-plan-auth.ts:248`).
4. It takes the saved `clientId`, or the `retryClientId` of a failed attempt. It reads or makes the host id under a lock of the parent folder. A record of another host throws "This ChatGPT registration belongs to another host..." (`server/drivers/chatgpt-plan-auth.ts:247-251`).
5. It makes `state`, `nonce` and the PKCE `verifier` (`server/drivers/chatgpt-plan-auth.ts:252-254`).
6. It starts a loopback HTTP server on `127.0.0.1:0`. The redirect URI is `http://127.0.0.1:<port>/auth/callback` (`server/drivers/chatgpt-plan-auth.ts:255-283`).
7. It builds the authorization URL `<issuer>/api/accounts/authorize` with these parameters (`server/drivers/chatgpt-plan-auth.ts:284-290`):
   - `client_id`: the saved one, or `dynamic_agent_client` with `agent_name_hint` for a new registration.
   - `ext_agent_host_id`, `login_hint` (the saved email).
   - `prompt=consent` when the old tokens lack the direct scope.
   - `response_type=code`, `redirect_uri`, `scope`, `resource`, `state`, `nonce`, `code_challenge_method=S256`, `code_challenge`.
8. It returns `{ phase: "waiting", flowId, authorizationUrl, expiresAt }`. A 15 min timer ends the flow `expired`: "ChatGPT sign-in expired. Start again." The loopback server then closes (`server/drivers/chatgpt-plan-auth.ts:291-304`).
9. The route returns this status with `Cache-Control: no-store`. The flow belongs to the admin session that started it. Another admin gets 409 on start and 404 on status and cancel. The flow id and the URL never appear in `GET /api/instances` (`server/chatgpt-plan-api.test.ts:116-148`).
10. The callback (`server/drivers/chatgpt-plan-auth.ts:259-277`):
    - A wrong host or origin gives 400 "Invalid sign-in callback...". It does not use up the flow.
    - A request that is not GET, a wrong path, a used or ended flow, a `state` that fails a constant-time compare, or a repeated query key gives 400 "Invalid or expired sign-in...".
    - A good callback is used once. The page says "Finishing sign-in. You can return to <product>." and the server closes.
11. `complete` (`server/drivers/chatgpt-plan-auth.ts:306-320`):
    - An `error` parameter fails "not approved".
    - The `client_id` comes from the callback. It must not be `dynamic_agent_client` and must match a saved one.
    - It fetches the identity keys (JWKS, the public keys that sign the ID token).
    - It exchanges the code with the verifier. On `invalid_grant` for a new registration it keeps the client id for the retry, so no second client is made.
12. It checks the token set: bearer type, `expires_in` 1 to 86,400 s, an ID token, scopes. The direct scope needs a refresh token (`server/drivers/chatgpt-plan-auth.ts:205-217`).
13. It verifies the ID token: issuer, audience, RS256 or ES256, `sub`, `exp`, `iat`, a 30 s tolerance, `azp` when there are several audiences, and the nonce (`server/drivers/chatgpt-plan-auth.ts:227-237`). A failure saves nothing.
14. A subject that differs from the saved one fails: "ChatGPT returned a different account. Use a separate account entry; the saved account was not replaced." (`server/drivers/chatgpt-plan-auth.ts:323`).
15. Under the lock it checks that the saved record did not change during the flow. It saves the new record and clears the refused models (`server/drivers/chatgpt-plan-auth.ts:324-331`).
16. It ends `succeeded` when the direct scope was granted. Else it ends `failed` with the consent text. Errors of `onAuthenticated` are ignored (`server/drivers/chatgpt-plan-auth.ts:331-332`).

`get(flowId)` returns the status (`server/drivers/chatgpt-plan-auth.ts:337-340`). `cancel` ends a waiting flow `cancelled` (`server/drivers/chatgpt-plan-auth.ts:341-344`). A cancel during a slow exchange saves no late credentials (`server/drivers/chatgpt-plan-auth.ts:301-310`).

#### The token file and its lock

The account folder holds `credentials.json` with mode 0o600. Section 4.2 gives the shape. The lock (`locked`, `server/drivers/chatgpt-plan-auth.ts:61-78`):

1. It opens `<account folder>/.credentials.lock` with `open(path, "wx", 0o600)` and writes the pid into it.
2. On EEXIST it tries again every 50 ms for at most 30 s.
3. After 30 s it fails: "ChatGPT credentials are busy. If another app process crashed, stop it and remove its abandoned credential lock before trying again."
4. Another open error fails: "ChatGPT credentials could not be locked safely."
5. It deletes the lock file in `finally`.

An abandoned lock fails closed, on purpose, so that a rotating refresh token is never used twice. The lock is not tied to a live pid and is never broken automatically. The verification document tells the person to stop the dead process, confirm it exited, and remove only that account's `.credentials.lock`: "We do not guess that a live lock is stale." (`docs/verification/chatgpt-plan.md:24-26`). Every turn of a plan account reads `accessToken()` under this lock (`server/drivers/codex.ts:355`).

#### "Signed in" (`snapshot`, `server/drivers/chatgpt-plan-auth.ts:346-352`)

The snapshot reads only the saved file. It makes no network call.

- `authenticated` is true when tokens exist and their scopes include the direct scope.
- `account` is `{ method: "login", email?, organization: "ChatGPT · <last 8 of clientId>" }`.
- `reason` is the sign-in text or the consent text.
- A read error throws out of `snapshot`.

The driver adds `chatgptPlan: true` and `billing: "subscription"`. For a Codex CLI older than 0.165.0 it adds the warning "Update Codex to 0.165.0 or newer to renew ChatGPT credentials during a running task." (`server/drivers/codex.ts:1404-1406`). A plan account shows `authenticationMethod: "browser-pkce"` (`server/drivers/codex.ts:1491`).

#### Refresh (`accessToken`, `server/drivers/chatgpt-plan-auth.ts:353-394`)

All steps run under the lock.

1. No tokens: it throws the sign-in text. No direct scope: it throws the consent text (`server/drivers/chatgpt-plan-auth.ts:359-360`).
2. More than 60 s left: it returns the saved access token (`server/drivers/chatgpt-plan-auth.ts:361`).
3. Before `earliestRefreshAt`: it returns the saved token if it has not expired. Else it fails "ChatGPT credentials cannot refresh yet. Please try again shortly." (`server/drivers/chatgpt-plan-auth.ts:362-365`).
4. It fetches the JWKS first, so nothing can fail between the receipt of a rotated token and its save (`server/drivers/chatgpt-plan-auth.ts:366-367`). With the JWKS down, no refresh is sent and nothing changes (`server/drivers/chatgpt-plan-auth.test.ts:275-286`).
5. It sends `grant_type=refresh_token`. It does not send `scope` (`server/drivers/chatgpt-plan-auth.test.ts:251`).
6. The result decides what happens (`server/drivers/chatgpt-plan-auth.ts:368-388`):

| Result | Effect |
|---|---|
| A terminal error code (the six codes above) | Deletes the tokens and saves the record. The account is signed out |
| `invalid_client` | Throws a configuration text. Tokens stay |
| A 5xx or a network error | Tokens stay: "ChatGPT could not renew access right now. Try again later; your saved account has not been removed." |
| An invalid successor, or an ID token for another subject | Deletes the tokens, because the old refresh token is used up |
| A valid successor | Saves the new tokens (`server/drivers/chatgpt-plan-auth.ts:389`) |

Two controllers, or two processes, that refresh at the same time make exactly one refresh call. Both get the rotated token (`server/drivers/chatgpt-plan-auth.test.ts:245-265`).

#### Models

`models` sends `GET <resource>/models` with the bearer token. It keeps rows with `visibility: "list"`, a slug with no space or control character, a display name, not repeated, and not refused. 401/403 and other errors have their own texts (`server/drivers/chatgpt-plan-auth.ts:395-413`). A model that ChatGPT refuses for this account is kept in memory at once and saved under the lock. An unreadable saved list is never written over with one model (`server/drivers/chatgpt-plan-auth.ts:145-164`).

Before a plan turn (`server/drivers/codex.ts:346-369`):

1. It reads `accessToken()` first (a refresh if needed).
2. It checks that the account did not change (`planGeneration`) and did not start a sign-out. Else: "The ChatGPT account changed while this message was preparing...". A plan sign-in start increments `planGeneration`, so a running turn sees the change (`server/drivers/codex.ts:1493-1497`).
3. A model that this account refused is replaced by the first usable one. A model that is not listed fails: "This model is not available to the selected ChatGPT plan... API billing will not be used."

#### How the token reaches Codex

The choice depends on the Codex version (`server/drivers/codex.ts:407`, `server/drivers/codex.ts:436-437`):

| Codex version | Path |
|---|---|
| 0.165.0 or later (major > 0 or minor >= 165) | The socket bridge with `auth.command` (renewing) |
| Older, or the version read failed | The token itself in `OPENMAUSBOT_CHATGPT_TOKEN` (fixed) |

`renewsToken(version)` reads the version string (`server/drivers/codex-plan-token.ts:38-41`). `planTokenRenewal(readVersion)` keeps the answer until a snapshot reads another version, and shares a read in flight. A failed read is not kept and gives false for that turn (`server/drivers/codex-plan-token.ts:43-61`). So a version read that times out sends the fixed token for that turn.

`chatgptPlanCodexArgs(renewing)` gives these `-c` overrides (`server/drivers/codex-plan-token.ts:15-35`):

- a model provider `openai_chatgpt_plan` at `https://api.openai.com/v1` with `wire_api="responses"`, `requires_openai_auth=false`, `supports_websockets=false`.
- `cli_auth_credentials_store="ephemeral"`.
- `features.tool_search=false` (the code says the bridge has no hosted tool search in Codex 0.159.0, so MCP tools load at the start).
- `shell_environment_policy.ignore_default_excludes=false`.
- renewing: `auth.command` = the server's own runtime (`process.execPath`) with the token helper script, `refresh_interval_ms=30000`, `timeout_ms=60000` (`server/drivers/codex-plan-token.ts:22-26`).
- fixed: `env_key="OPENMAUSBOT_CHATGPT_TOKEN"`. The variable is removed from the shell through `extendShellExclusions` (`server/drivers/codex-plan-token.ts:27`, `server/drivers/codex-plan-token.ts:34`).

**The bridge** (`server/drivers/chatgpt-plan-token-bridge.ts`). The file says "No OAuth credentials cross the command line" (`server/drivers/chatgpt-plan-token-bridge.ts:7`).

1. There is one bridge per Codex run, with a random 32-byte hex secret (`server/drivers/chatgpt-plan-token-bridge.ts:9`).
2. On POSIX it listens on a Unix socket `<tmpdir>/omb-auth-XXXXXX/s` in a `mkdtemp` folder. On Windows it listens on a named pipe `\\.\pipe\omb-auth-<32 hex>` (`server/drivers/chatgpt-plan-token-bridge.ts:10-11`).
3. A client must send the secret and a newline within 128 characters. The compare is constant-time. A wrong secret closes the socket. A socket that is idle for 60 s is closed (`server/drivers/chatgpt-plan-token-bridge.ts:18-27`).
4. On a good secret it calls `accessToken()` (the controller's refresh) and writes the token, unless the bridge closed in the meantime (`server/drivers/chatgpt-plan-token-bridge.ts:28-30`).
5. The child gets `OMB_CODEX_AUTH_SOCKET` and `OMB_CODEX_AUTH_SECRET` in its environment (`server/drivers/chatgpt-plan-token-bridge.ts:41`). `startPlanTokenBridge` also adds `ELECTRON_RUN_AS_NODE=1`, because the runtime is Electron in the desktop app (`server/drivers/codex-plan-token.ts:63-79`).
6. `stillCurrent` runs before and after each token read. It throws when the account changed or the task ended. A throw at start closes the bridge (`server/drivers/codex-plan-token.ts:63-79`).
7. `close` destroys the connections, closes the server and removes the folder (`server/drivers/chatgpt-plan-token-bridge.ts:42-48`).

**The helper** (`server/drivers/chatgpt-plan-token-command.ts:3-16`). Codex runs it to get a token. It reads the two variables and exits 1 if one is missing. It connects, writes the secret, and has a 55 s timeout. It prints the reply to stdout only if the reply is not empty and has at most 16,384 characters. A failure prints nothing.

**Shell exclusion.** `PLAN_TOKEN_BRIDGE_ENV` names `OMB_CODEX_AUTH_SOCKET`, `OMB_CODEX_AUTH_SECRET` and `ELECTRON_RUN_AS_NODE`. The code says "none of it may reach the agent's shell" (`server/drivers/codex-plan-token.ts:6-7`). The driver adds the token variable and the bridge variables to Codex's `shell_environment_policy.exclude` (or its `filters` table). If the driver cannot confirm Codex's effective policy, the turn fails "No prompt was sent." (`server/drivers/codex.ts:132-145`, `server/drivers/codex.ts:1206-1213`). Shell snapshots must be off with a bridge, else: "Codex could not disable inherited shell snapshots. No prompt was sent." (`server/drivers/codex.ts:1200-1205`). The run secret is still in the environment of the Codex process itself for the run (problem b).

#### Device sign-in on a Cloud

Where the browser cannot call back (a Cloud, a hosted workspace), the plan account uses Codex's own device sign-in (section 3.8). It writes Codex's `auth.json` into `<account folder>/codex` (`server/drivers/codex-account-home.ts:1-5`, `server/drivers/codex-account-home.ts:18-21`). Status, logout, name, models, limits and turns use that home (`docs/verification/chatgpt-plan.md:28-40`).

#### Sign out (`signOut`, `server/drivers/chatgpt-plan-auth.ts:414-442`)

The driver first stops every active turn of the plan. If a turn cannot stop, it fails "A ChatGPT task could not stop safely. Stop the task before signing out." Then it clears the models and calls `planAuth.signOut()` (`server/drivers/codex.ts:1512-1523`).

1. The controller cancels a flow, prepares the folders and takes the lock.
2. No tokens: nothing to do. No refresh token: it deletes the tokens and saves.
3. Else it reads the OpenID discovery document. If the issuer matches and the revocation endpoint is on the issuer's origin, it posts the refresh token there. It makes at most 2 attempts, 250 ms apart, and stops at a status below 500.
4. It always deletes `tokens` from the record, saves it, and clears the refused list. The record keeps `clientId`, `subject`, `email` and `hostId`, so the next sign-in uses the same client registration.
5. If the revocation was not confirmed, it throws with code `chatgpt_revocation_unconfirmed`: "Signed out locally, but remote revocation was not confirmed. Disconnect <product> in ChatGPT Settings → Usage to end access there." The driver shows this as a warning on the snapshot, not as an error (`server/drivers/codex.ts:1512-1523`).

#### Delete (`server/routes/instances.ts:565-603`)

1. The route holds the config busy flag from the read to the save, so a sign-out that waits on a CLI cannot be written over by a parallel change (`server/routes/instances.ts:567-571`).
2. An unknown id gives 404. Only added accounts can be removed. The built-in `chatgpt` gives 400 (`server/routes/instances.ts:575-579`, `server/chatgpt-plan-api.test.ts:164-178`).
3. An account in use by a bot, a backup, a task, the default or a running turn gives 409 (`server/routes/instances.ts:580-582`).
4. An added ChatGPT account is signed out first, because its sign-in is in the data folder. A failed sign-out gives 409 and keeps the account. An unconfirmed revocation does not block the delete (`server/routes/instances.ts:583-593`).
5. The route removes the entry and saves (`server/routes/instances.ts:594-595`).

`configDir` is refused for a plan account with 400 (`server/chatgpt-plan-api.test.ts:164-178`).

### 3.10 The device code sign-in

A device code sign-in is a sign-in where the engine CLI prints a web page and a short code, and the person enters the code on that page in any browser. The reference project runs the CLI's own login command on the server and reads the page and the code from its output. The server does not poll the provider. The CLI polls the provider, and the server waits for the CLI process to close (`server/drivers/device-auth.ts:143-152`).

#### The controller

The class `DeviceAuthController` owns the flow. There is one controller for each provider instance (an engine account in the settings). Each engine gives a `DeviceSignIn` spec (`server/drivers/device-auth.ts:30-53`):

| Engine | Login command | Home variable, default home | Status command | Sign-out |
|---|---|---|---|---|
| Codex | `codex login --device-auth` | `CODEX_HOME`, `~/.codex` | `codex login status` | `logout` (`server/drivers/codex-device-auth.ts:25-43`) |
| Grok | `grok login --device-auth` | `GROK_HOME`, `~/.grok` | none | `logout` (`server/drivers/acp/grok.ts:69-83`) |
| Kimi | `kimi login` | `KIMI_CODE_HOME`, `~/.kimi-code` | none | the server deletes the token files (`server/drivers/acp/kimi.ts:65-72`, `84-96`) |
| Cursor | `cursor-agent login` with `NO_OPEN_BROWSER=1` | `CURSOR_CONFIG_DIR`, `~/.cursor` | `status --format json` | none (`server/drivers/acp/cursor.ts:329-343`) |

The limits of one flow:

| Limit | Value | Where |
|---|---|---|
| Time to get a page and a code (startup timer) | 30 s | `server/drivers/device-auth.ts:137` |
| Life of the flow (expiry timer) | 15 min | `server/drivers/device-auth.ts:134`, `138` |
| CLI output kept | 16 384 (`MAX_OUTPUT`) | `server/drivers/device-auth.ts:14`, `323` |
| Time for a status or logout command | 30 s | `server/drivers/device-auth.ts:288-293` |
| Time to stop a process | 1500 ms, then SIGKILL | `server/drivers/device-auth.ts:80-89`, `373-386` |
| Sign-ins at one time | one for each credential home in the process | `server/drivers/device-auth.ts:15-16`, `124-128` |

Both timers call `unref`, so they do not keep the process alive (`server/drivers/device-auth.ts:139-140`).

Flow of `start()` (`server/drivers/device-auth.ts:115-163`):

1. If the controller is disposed, refuse with "This provider was removed. Refresh Settings before signing in." (`server/drivers/device-auth.ts:117`).
2. If a flow is `waiting` and has a code, return the same status again, with the same flow id and the same code (`server/drivers/device-auth.ts:118-119`). If a flow is `waiting` and has no code yet, refuse with "A {account} sign-in is already starting. Please wait for the code." (`server/drivers/device-auth.ts:120`).
3. Wait until an older flow stops (`server/drivers/device-auth.ts:122`).
4. Find the home. `home()` needs an absolute `HOME` (or `USERPROFILE`, or `homedir()`) and an absolute `$homeEnv`, else it throws. The home key is the canonical path of `$homeEnv`, or of `~/homeDir` (`server/drivers/device-auth.ts:105-113`). `canonicalPath` uses `realpathSync`. When the path does not exist, it resolves the parent and adds the base name (`server/drivers/device-auth.ts:18-23`).
5. If the home key is in `authenticatingHomes`, refuse with "A {account} sign-in is already running for this server account. Finish or cancel it before starting another." Else add the key (`server/drivers/device-auth.ts:126-128`). This set is a lock for the sign-in only. Turns do not take it (`server/drivers/device-auth.ts:15-16`).
6. Make the flow: phase `waiting`, a new `flowId` (UUID), `authorizationUrl: null`, `expiresAt` = now + 15 min (`server/drivers/device-auth.ts:131-135`).
7. Start the two timers. The startup timer fails the flow with "{product} did not provide a sign-in code in time. Check the server connection and update {product}, then try again.". The expiry timer ends the flow as `expired` with "The {account} sign-in code expired. Start sign-in again." (`server/drivers/device-auth.ts:137-138`).
8. If the spec has a status command, run it first (`server/drivers/device-auth.ts:154-161`):
   - `signed-in`, and the provider did not refuse the stored sign-in (`signInRejected`): end the flow as `succeeded` with no login.
   - `signed-in` with a refusal, or `signed-out`: start the login.
   - `other` (a sign-in by another method, such as an API key): fail with "{product} already has a different sign-in method on this server. Ask the server administrator to review it before changing accounts.".
   - `unknown`: fail with "{product} could not confirm the existing sign-in on this server. Update {product} and check its login status before trying again.".
   - With no status command, the login starts at once.
9. Run the login command (`server/drivers/device-auth.ts:143-152`, `307-345`). The environment is `{...env, NO_COLOR: "1", ...spec.env}`. The working folder is the home. Standard input closes at once. Standard output and standard error go into one buffer.
10. For each chunk of output: if the buffer would pass `MAX_OUTPUT`, fail with "{product} returned an unexpected sign-in response. Update the server's {product} CLI and try again." (`server/drivers/device-auth.ts:323-326`). Else remove the ANSI codes and parse the page and the code (see "Parsing" below). On the first prompt, set `ready`, clear the startup timer, and resolve `start()` with the `waiting` status. A later, different prompt replaces the code in the status (`server/drivers/device-auth.ts:328-335`).
11. When the login process closes:
    - Exit code not 0, or no prompt was found: fail with `spec.failure(output)`. This is one fixed sentence that the spec picks with regular expressions. The CLI's own words never reach the person (`server/drivers/device-auth.ts:144-147`, `server/drivers/codex-device-auth.ts:12-23`).
    - Else start a new 30 s timer ("{product} finished sign-in but could not confirm the account. Refresh Settings and try again.") and confirm the account. The confirm runs the status command again, or `spec.signedIn(env)`. An exception counts as false. The result is `succeeded`, or `failed` with "{product} finished sign-in but did not confirm a {account} account. Refresh Settings and try again." (`server/drivers/device-auth.ts:148-151`, `247-256`).

Error paths of the start:

- A spawn exception fails the flow with "could not start ... Install or update the configured {product} CLI" (`server/drivers/device-auth.ts:314-316`).
- A child `error` event with ENOENT gives "{product} is not installed on this server. {install}". Another error gives "could not start ... Check the configured CLI path and its executable permissions." (`server/drivers/device-auth.ts:258-263`, `339`).

The end of a flow, `finish()` (`server/drivers/device-auth.ts:347-371`):

1. It runs one time only, while the phase is `waiting`. It clears both timers.
2. The status becomes `{phase, flowId, authorizationUrl: null, expiresAt: null, message?}`. A `succeeded` status has no message.
3. If `start()` did not resolve yet, it resolves for `succeeded` and rejects with the message for the other phases.
   - At `e1cc6a290` (commit `46f016125`, v0.1.186), `finish` also takes a fixed reason code and puts it on the status (`reason`) and on the error of a waiting `start()` (`server/drivers/device-auth.ts:351-366`). The codes are in `shared/sign-in-outcome.ts:4-25`: `completed`, `wrong_code`, `refused`, `expired`, `cancelled`, `exited`, `interrupted`, `not_installed`, `timed_out` and `failed`. The startup timer gives `timed_out`, the expiry `expired`, a cancel `cancelled`, a missing command `not_installed` (`:342`), and a login exit `spec.failureReason?.(output) ?? "exited"` (`:148`). Codex maps device sign-in turned off to `refused` and an expired code to `expired` (`server/drivers/codex-device-auth.ts:27-31`). The Claude `finish` does the same (`server/drivers/claude-login-auth.ts:363`, `:376-400`).
4. It stops the child. When the child is gone, it frees the home lock.
5. If the stop fails, it sets `terminationFailed` and changes the status to `failed` with "{product} could not be stopped on this server. Ask the server administrator to stop the login process before trying again.". The lock stays until the child's `close` event (`server/drivers/device-auth.ts:360-369`).
6. On `succeeded` it calls `onAuthenticated()` (a model refresh) and ignores its error (`server/drivers/device-auth.ts:370`).

`stopChild()` calls `killCliTree(child, 1500)`. If that fails, it sends SIGKILL to the process group on POSIX (`process.kill(-pid)`), or `child.kill("SIGKILL")` on Windows. Then it waits up to 1500 ms for `close` (`server/drivers/device-auth.ts:373-386`).

The other actions:

- `get(flowId)`: an empty id, or an id that is not the current flow, gives "This sign-in is no longer available. Start sign-in again." Else a copy of the status (`server/drivers/device-auth.ts:165-168`).
- `cancel()`: ends a waiting flow as `cancelled` with "{account} sign-in cancelled.", waits for the stop, and throws if the stop failed. It also stops a status or logout command that runs (`server/drivers/device-auth.ts:170-177`).
- `dispose()`: marks the controller disposed, cancels, waits up to 1500 ms for a sign-out that runs, and clears the flow (`server/drivers/device-auth.ts:179-186`).
- `signOut()` (`server/drivers/device-auth.ts:189-245`):
  1. It needs `logoutArgs` or `removeCredentials`, and a way to read the state.
  2. It refuses during a waiting flow: "Finish or cancel the {account} sign-in in progress before signing out.".
  3. It takes the same home lock.
  4. It reads the state. `signed-out` returns at once. A state that is not `signed-in` throws "{product} did not confirm a {account} sign-in. Other authentication methods will not be removed; ...".
  5. It runs the logout command (an exit code not 0 is an error) or `removeCredentials`.
  6. It reads the state again. If it is not `signed-out`, it throws "{product} still reports a sign-in on this server. ...".
  7. It frees the lock in `finally`, or at the `close` of a command that could not be stopped (`server/drivers/device-auth.ts:238-244`).

#### Parsing of the page and the code

The parser is in `shared/device-sign-in.ts`. The server uses it to read the CLI output. The app uses it again to check the link before it shows it.

1. Split the text into lines. Drop the last line, because it can be half of a chunk. Trim each line and remove the provider's label (`shared/device-sign-in.ts:99-114`).
2. Keep a line only if it is a valid provider page. A page must match `^https:\/\/[^\s#]+$`, parse as a URL, have no user name, password or port, and have an allowed host (`shared/device-sign-in.ts:14-19`).
3. For a link-only provider (Cursor), the page is the prompt. For the other providers, look in the later lines for the first line that is a code (after a leading `code:` is removed). The link must accept that code.
4. The last valid pair wins. So when a CLI prints a new pair after the first code expires, the server follows it. kimi-code 2.4.1 does this (`shared/device-sign-in.ts:99-114`).

| Provider | Page rule | Code rule | Where |
|---|---|---|---|
| codex | exactly `https://auth.openai.com/codex/device` (a trailing slash is allowed) | `^[A-Z0-9]{4,8}-[A-Z0-9]{4,8}$` | `shared/device-sign-in.ts:28-31` |
| grok | host `x.ai` or `grok.com` or a subdomain, only the query key `user_code` | `^[A-Z0-9]{4,12}(?:-[A-Z0-9]{2,12}){0,3}$` | `shared/device-sign-in.ts:32-40` |
| kimi | host `kimi.com` or `kimi.ai` or a subdomain, the query is reduced to `user_code` | as grok | `shared/device-sign-in.ts:41-56` |
| cursor | host `cursor.com` or `www.cursor.com`, path `/loginDeepControl`, a fixed list of query keys, each key one time, `challenge` 16 to 128 characters, `uuid` 8 to 64 characters | no code | `shared/device-sign-in.ts:57-71` |

The patterns name the CLI versions they were written for: kimi-code 2.4.1, cursor-agent 2026.10.22, grok 1.0.25 and 1.0.41. There is no version check. When a CLI changes its output, no line matches, and the 30 s startup timer fails the flow with "did not provide a sign-in code in time ... update {product}" (`shared/device-sign-in.ts:41-71`, `server/drivers/device-auth.ts:137`). This is a case of problem a.

#### How each ACP engine finds "signed in"

An ACP engine is an engine that the server drives through the Agent Client Protocol (JSON-RPC over the CLI's standard input and output). Each engine has its own test for "signed in". The test runs for the status in Settings and before a turn.

| Engine | Test | Brief failure (timeout, crash, new output) counts as | Where |
|---|---|---|---|
| Grok | `auth.json` exists, then `grok models` output. Only a second `signed-out` in a row counts, because the first run can refresh an expired token. 8 s for each call, result kept 5 min, a stale result is answered at once while a new probe runs | signed in | `server/drivers/acp/grok-sign-in.ts:13-62`, `server/drivers/acp/grok.ts:40-44` |
| Copilot | an empty ACP `session/new`. Signed in kept 5 min, signed out 60 s, an unproven probe 15 s. A caller waits at most 3 s, then gets the last answer, or true | signed in for 15 s | `server/drivers/acp/copilot.ts:25-31`, `117-146` |
| Cursor | a key in the environment, else `status --format json`, then `status`. 8 s for each call. At `e1cc6a290` (commit `73f557e06`, v0.1.186) the turn handshake also runs this check before it sends `authenticate("cursor_login")`, and sends nothing when the CLI is signed in, because a second `cursor_login` deletes the stored login (`server/drivers/acp/core.ts:1086-1089`, `server/drivers/acp/cursor.ts:525-527`) | signed out | `server/drivers/acp/cursor.ts:105`, `298-311` |
| Kimi | a token file in `credentials/` that parses and has tokens that are not empty | signed out | `server/drivers/acp/kimi.ts:29-50` |
| Cline | a key in `CLINE_API_KEY`, else the OAuth entry of `providers.json` | signed out | `server/drivers/acp/cline.ts:138-141` |
| DeepSeek | `DEEPSEEK_API_KEY`, else the credentials file, else `.env` | signed out (no key) | `server/drivers/acp/deepseek.ts:121-128` |
| Codex (start of a sign-in) | `codex login status` | `unknown`, and the start fails with "could not confirm the existing sign-in" | `server/drivers/codex-device-auth.ts:34-41` |

So a brief failure has opposite results. Grok and Copilot "fail open": they keep "signed in", and the turn shows the real error. Cursor, Kimi, Cline and DeepSeek "fail closed": they show "signed out", and the person sees a sign-in request that is not necessary. Codex refuses to start a sign-in. The Grok rule has one more effect: if a new Grok version changes its words, the answer is always `unknown`, and Grok never reports "signed out" again (`server/drivers/acp/grok-sign-in.ts:36-62`).

For sign-out, the state readers of Grok and Kimi give `unknown` on a file error that is not ENOENT, and the sign-out then refuses (`server/drivers/acp/grok.ts:46-55`, `server/drivers/acp/kimi.ts:54-63`).

A turn of an engine with `requireAuthenticationBeforeSpawn` checks `isAuthenticated` first. If the engine is not signed in, the turn emits `runtime.error` with the engine's `loginNote` and `setup: true`, then `turn.completed` with `ok: false`, `stopReason: "auth_required"` and `unsent: true`. No process starts (`server/drivers/acp/core.ts:882-895`). Sign-in resume (3.12) uses the `unsent` turn.

The sign-in runs with the same environment as a turn of that instance (`childEnv()`), so the credential lands in that instance's engine home (`server/drivers/acp/core.ts:374-375`). The built-in instance uses the server user's own homes, such as `~/.grok` and `~/.codex`, unless its environment sets the home variable (`server/drivers/acp/grok.ts:31-34`, `server/drivers/acp/kimi.ts:21-23`). This is a case of problem f.

### 3.11 The sign-in session

#### ProviderAuthSessions

The class `ProviderAuthSessions` ties an engine sign-in to the browser session that started it. The composition root makes one object for the whole server (`server/index.ts:526`, `1355`). The device code never goes on the shared live event stream (`server/provider-auth-sessions.ts:1`).

The owner key is set by the route (`server/routes/instances.ts:319-321`):

- a browser session: its session id.
- a paired phone: `companion:<device header>`.
- else: `"loopback"`. All loopback callers without a session share this one owner.

Data: a map from instance id to one `Flow`, in memory only (`server/provider-auth-sessions.ts:21`). So each instance has at most one sign-in session. A `Flow` holds `instance`, `owner`, `flowId`, `expiresAt`, `busy`, `starting`, `revoked`, `revision` and `told` (`server/provider-auth-sessions.ts:5-16`). At `e1cc6a290` (commit `46f016125`, v0.1.186) it also holds `attempt` (an entry of the sign-in trace, null on a desktop) and `settling` (`server/provider-auth-sessions.ts:11-26`).

States of a session:

| State | Meaning | Blocks another owner |
|---|---|---|
| busy | a start, a status read or a sign-out runs | yes, always |
| live | not expired and not revoked | yes, until `expiresAt` |
| ended | phase not `waiting` or `verifying`, so `expiresAt = 0` | no |
| revoked | the owner's browser session ended, or the instance was cleared | no |

Flow of `start(instance, owner)` (`server/provider-auth-sessions.ts:34-66`):

1. If the instance has no `startAuthentication`, refuse with 404 "Account setup is unavailable for this provider.".
2. If a session exists and is busy, or belongs to another owner and is not expired, refuse with 409 "A sign-in is already in progress. Finish or cancel it in the browser that started it, or wait for it to expire.".
3. If the same owner has a live session that is not revoked, use the same `Flow` object again (a resume). Else make a new flow with `expiresAt` = now + 15 min (`server/provider-auth-sessions.ts:41`).
4. Mark the flow busy and starting, and put it in the map before the engine call. So a second start waits behind the first and gets 409.
5. Call `startAuthentication()`. If the flow was revoked or replaced meanwhile, call `cancelAuthentication` and refuse with 409 "Sign-in cancelled because the session or provider changed." (`server/provider-auth-sessions.ts:47-50`).
6. Store the `flowId`. If the result has a valid `expiresAt`, use it in place of the 15 min default (`server/provider-auth-sessions.ts:51-53`).
7. If the phase is `succeeded` (the engine was signed in already), delete the flow and call `signedIn(instanceId)` (`server/provider-auth-sessions.ts:54-57`).
8. On an error, delete the flow, unless it was a resume that is not revoked (`server/provider-auth-sessions.ts:60`). At `e1cc6a290`, on a Cloud home, a resumed flow whose new engine start failed gets `expiresAt = 0`, so nothing stays open (`server/provider-auth-sessions.ts:111-114`).

The other actions:

- `owned()`: a missing, revoked or foreign flow, or a wrong flow id, gives 404 "This sign-in is no longer available in this browser. Start a new sign-in.". A busy flow gives 409 "The sign-in is still being updated. Try again shortly." (`server/provider-auth-sessions.ts:68-75`). At `e1cc6a290`, a flow that a server stop cut short (see "What a restart loses") gives 404 "This sign-in was interrupted because the server stopped. Start sign-in again." with `reason: "interrupted"` (`server/provider-auth-sessions.ts:29`, `:125`).
- `status()`: calls `getAuthentication(flowId)`. If the flow changed during the call, it gives 404 "This sign-in session ended.". A phase other than `waiting` or `verifying` sets `expiresAt = 0`. On `succeeded` it calls `signedIn` one time only (`told`) (`server/provider-auth-sessions.ts:77-89`). At `e1cc6a290`, a flow that a server stop cut short answers 200 `{phase: "failed", flowId, authorizationUrl: null, expiresAt: null, reason: "interrupted"}` with no `message`, before the owner check, so the screen words the reason in the person's language (`server/provider-auth-sessions.ts:137-140`).
- `complete(instanceId, owner, flowId, callbackUrl)`: for engines that take a pasted callback address or code. Without engine support it gives 400 "This provider does not use a callback URL.". Then it deletes the flow and calls `signedIn` (`server/provider-auth-sessions.ts:91-101`). At `e1cc6a290` (commit `46f016125`, v0.1.186), on a Cloud home, a code that the engine refused calls `afterRefusedCode`: it reads the status of the engine. When the engine ended the flow (the provider refused the code, or the login command exited), it sets `expiresAt = 0` at once and records the reason. A pasted value that is not a code (`wrong_code`) keeps the flow open for another try (`server/provider-auth-sessions.ts:161-166`, `:178-185`). Because the start gate refuses another owner only while `expiresAt > now` (`:78-81`), the person can start again at once. Before, a failed `complete` kept `expiresAt` 15 min ahead. A desktop keeps the old behaviour (`:175-177`). Tests: `server/sign-in-awake.test.ts:126`, `:152`, `:192`.
- `cancel()`: increments `revision`, so a status read in flight cannot announce success. Then it calls `cancelAuthentication` and sets `expiresAt = 0`. The owner can still read the `cancelled` status later (`server/provider-auth-sessions.ts:103-110`). At `e1cc6a290`, a flow that a server stop cut short returns at once with nothing to cancel (`server/provider-auth-sessions.ts:187-189`).
- `signOut(instance, owner)`: 404 without engine support. 409 when a flow is busy or belongs to another live owner. Else it puts a busy placeholder flow for 60 s, cancels the old flow, calls `instance.signOut()` and removes the placeholder (`server/provider-auth-sessions.ts:113-127`).
- `revokeOwner(owner)`: marks each flow of that owner revoked. A flow that is starting stays, because its own start cancels it. The others are cancelled and deleted (`server/provider-auth-sessions.ts:129-140`). The root calls it when a browser session is revoked (`server/index.ts:4621-4622`).
- `clear()` and `clearInstance(id)`: mark revoked and delete. They do not call `cancelAuthentication` (`server/provider-auth-sessions.ts:142-151`). The engine controller stops when its instance is disposed (`server/drivers/acp/core.ts:1525-1527`). The root calls `clearInstance` when instances stop or reload (`server/index.ts:11719`, `11766`, `11774`, `11816`).

Expiry: there is no sweep timer. An expired flow stays in the map until the next start for the same instance replaces it (`server/provider-auth-sessions.ts:156`). The getter `active` is true while a flow is not expired and is busy or not revoked (`server/provider-auth-sessions.ts:30-32`). At `e1cc6a290` there is still no sweep timer. But on a Cloud home the getter calls `settleLate` for each flow past `expiresAt`: on a later tick it asks the engine for the outcome, ignores errors, and records the outcome or `expired` (`server/provider-auth-sessions.ts:51-70`). The map entry stays.

What waits on an active sign-in: while `active` is true, the workspace restore does not run (`server/index.ts:11892`), the data move does not run (`server/index.ts:9350`), and maintenance does not run (`server/index.ts:15115`). A start that never returns stops counting after 15 min. A sign-out that never returns stops counting after 60 s (`server/provider-auth-sessions.test.ts:218-242`). This is a case of problem d.

What a restart loses: every session, because the map is in memory only. The engine's login process also stops with the server. The person must start the sign-in again. The app does not keep the flow either (`src/components/DeviceSignIn.tsx` keeps it in React state only). At `e1cc6a290` (commit `46f016125`, v0.1.186), a Cloud home writes each attempt to `<dataDir>/sign-in-trace.json`, with only a SHA-256 key of the instance and the flow id (`server/sign-in-trace.ts:14`, `:57`). At a stop it keeps the open attempts open. At the next start it records each open attempt as `interrupted` (`:126-142`, called at `server/index.ts:15083`). Then the screen's next read hears `interrupted` and shows "This sign-in was interrupted. Start again." with "Try again" (`server/provider-auth-sessions.ts:133-140`; `src/components/DeviceSignIn.tsx:102-106`). The map of sessions is still lost, and a desktop has no trace (`server/index.ts:1356`).

The HTTP routes (all answers carry `cache-control: no-store`, `server/routes/instances.ts:324`, `338`):

| Route | Body | Result |
|---|---|---|
| `POST /api/instances/{id}/auth/start` | `{}` | 200 `{auth}` (`server/routes/instances.ts:369-388`) |
| `GET /api/instances/{id}/auth/status?flowId=` | none | 200 `{auth}`. A phase that is not `waiting` forgets the engine snapshots (`server/routes/instances.ts:322-329`) |
| `POST /api/instances/{id}/auth/complete` | `{flowId, callbackUrl}` or `{flowId, code}`, at most 8192 bytes | 200 `{ok: true}`, 400 without the fields (`server/routes/instances.ts:396-405`) |
| `POST /api/instances/{id}/auth/cancel` | `{flowId}`, at most 4096 bytes | 200 `{ok: true}` (`server/routes/instances.ts:406-408`) |
| `POST /api/instances/{id}/auth/sign-out` | `{}` | 200 `{instances}` (`server/routes/instances.ts:389-395`) |

Rules on these routes:

1. A POST without `content-type: application/json` gets 415 (`server/routes/instances.ts:330-334`).
2. `auth/start` on an unknown instance gets 404.
3. A `browser` or `browser-pkce` sign-in is refused with 403 when the request is proxied, not from loopback, or from a paired phone: "This sign-in happens in a browser on the computer running {product}. ..." (`server/routes/instances.ts:372-379`). A device code sign-in has no such limit. It works from a phone or a remote browser.
4. If the browser session ended while the start ran, the route revokes the owner and answers 401 "Your session ended. Start a new sign-in." (`server/routes/instances.ts:382-386`).
5. An error keeps its status when it is 400, 401, 404, 409, 413 or 415, else 500 (`server/routes/instances.ts:409-413`). At `e1cc6a290`, the body of an `auth/*` error also has the `reason` of the error, when it has one (`server/routes/instances.ts:424-428`).
6. The routes check the owner key only. The scope gate is outside them: every path that is not on the client allow-list needs the `admin` scope (`server/request-auth.ts:535-542`).

#### The terminal login route (cli-login)

This is not an engine sign-in. It is the login of the reference project's own terminal command to the server. It uses the same pattern: a code that shows in two places, and a poll. `CLI_LOGIN_PATH = "/api/auth/cli-login"` (`shared/cli-login.ts:2`).

| Limit | Value | Where |
|---|---|---|
| Life of a request | 10 min (`CLI_LOGIN_TTL_MS`) | `server/routes/cli-login.ts:15` |
| An allowed session that the terminal does not collect is revoked after | 2 min (`UNCOLLECTED_MS`) | `server/routes/cli-login.ts:16-17` |
| Waiting requests in all | 5 | `server/routes/cli-login.ts:18` |
| Waiting requests from one source | 2 | `server/routes/cli-login.ts:19` |
| Start body | 4096 bytes | `server/routes/cli-login.ts:89-103` |
| Poll interval given to the terminal | 1000 ms | `server/routes/cli-login.ts:119` |

Flow:

1. The terminal sends `POST /api/auth/cli-login` with `{label?, scope?, verifierHash}`. No session is necessary (`server/routes/cli-login.ts:139-150`). The route refuses: 415 without JSON, 403 from a browser, 403 from the refusal hooks, 400 for a bad body, 429 when too many requests wait (`server/routes/cli-login.ts:89-103`).
2. The server makes an id (`randomBytes(18)`, base64url) and a code of 8 symbols in the form `ABCD-EFGH` (`server/routes/cli-login.ts:57-61`, `106`). It answers 201 `{id, code, expiresAt, intervalMs: 1_000}`.
3. The owner or an admin sees the request in the app and compares the code. `POST /api/auth/cli-login/{id}/allow` or `/deny`. Another person gets 403 "only the owner or an admin allows a terminal" (`server/routes/cli-login.ts:152-186`).
4. The terminal polls `POST /api/auth/cli-login/{id}` with its `verifier`. The server compares the SHA-256 with `timingSafeEqual`. An unknown id or a wrong verifier gives 404 `{state: "gone"}`. A waiting request gives 202. A final state is given one time only and then deleted: 200 `{state: "allowed", token, session, environment}`, or 403 `{state, error}` (`server/routes/cli-login.ts:122-137`).
5. There is no timer. `prune()` runs on each read of the list and on each poll (`server/routes/cli-login.ts:72-87`).

The requests are in memory only, so a restart loses them (`server/routes/cli-login.ts:70`).

#### The browser sign-in of an ACP engine

The class `AcpBrowserAuth` signs in an engine through the engine's own ACP `authenticate` request. The engine opens the person's browser itself and holds the request until the person finishes (`server/drivers/acp/browser-auth.ts:1-6`). Mistral Vibe uses it (`server/drivers/acp/mistral-vibe.ts:163-183`).

| Limit | Value | Where |
|---|---|---|
| Handshake (`initialize`) | 30 s | `server/drivers/acp/browser-auth.ts:14-17`, `188-192` |
| Life of the flow, and the limit of `authenticate` | 15 min | `server/drivers/acp/browser-auth.ts:43-55`, `201` |
| One output line | 1 MiB | `server/drivers/acp/browser-auth.ts:14-17` |
| Output buffer | 8 MiB | `server/drivers/acp/browser-auth.ts:14-17` |
| Time to stop the process | 2 s, then SIGKILL to the child only | `server/drivers/acp/browser-auth.ts:306-311` |

Flow of `start()` (`server/drivers/acp/browser-auth.ts:99-210`):

1. Refuse if disposed. Wait for an older stop. If a flow is still there, refuse with "A {product} sign-in is already in progress. Finish or cancel it first.".
2. Make a flow with a new UUID and an expiry of now + 15 min. Start the startup timer (30 s) and the expiry timer (`server/drivers/acp/browser-auth.ts:106-119`).
3. Start the engine with the turn's arguments and environment (`server/drivers/acp/browser-auth.ts:134-137`). A spawn error fails the flow. ENOENT adds the spec's `serverHint`.
4. Read standard output as JSON lines. Drop standard error (`server/drivers/acp/browser-auth.ts:158-169`).
5. Send `initialize`. On the answer, clear the startup timer and pick the auth method. No method fails the flow (`server/drivers/acp/browser-auth.ts:188-200`).
6. Send `authenticate {methodId}`. An answer is `succeeded`. An error fails the flow (`server/drivers/acp/browser-auth.ts:201-204`).
7. `start()` resolves at once with `{phase: "waiting", flowId, authorizationUrl: null, expiresAt}`. There is no code and no link (`server/drivers/acp/browser-auth.ts:208`).

The poll is `get(flowId)`. While the flow waits, it calls `spec.signedIn(env)`. If that is true, the flow ends as `succeeded`, also when the engine never answers `authenticate` (`server/drivers/acp/browser-auth.ts:212-218`). Every request that the engine sends during the sign-in gets the JSON-RPC error -32601 "Not available during sign-in." (`server/drivers/acp/browser-auth.ts:258-268`). The failure messages come from the stage only, never from the engine's words (`server/drivers/acp/browser-auth.ts:19-20`, `273-276`).

Sign-out needs `removeCredentials`. It refuses during a flow. It refuses when the engine is signed in by an API key: "{product} is signed in by an API key here, which signing out cannot remove. Remove the key under Settings → AI to disconnect it." (`server/drivers/acp/browser-auth.ts:235-248`).

The route refuses this sign-in from a phone, a proxy or a remote address (`server/routes/instances.ts:372-379`).

#### An API-key account of an ACP engine

An API-key account is an engine that is signed in by a key in an environment variable of the engine process.

1. Each engine lists the variable names it may receive in `credentialEnv`, for example `["CURSOR_API_KEY", "CURSOR_AUTH_TOKEN"]` (`server/drivers/acp/cursor.ts:513`) or `["MISTRAL_API_KEY"]` (`server/drivers/acp/mistral-vibe.ts:160`).
2. `childEnv()` starts from the whole server `process.env`, adds the instance's `environment` and `PATH`, and deletes every provider or workspace credential key that is not in `credentialEnv` (`server/drivers/acp/core.ts:339-354`).
3. The driver's `transformEnv` can remove more. Grok removes `XAI_API_KEY` (`server/drivers/acp/grok.ts:628-631`). Kimi removes `MOONSHOT_API_KEY` and `KIMI_API_KEY` (`server/drivers/acp/kimi.ts:569-574`). Copilot removes `GH_TOKEN` and `GITHUB_TOKEN` unless the instance sets them (`server/drivers/acp/copilot.ts:200-206`).
4. `keyedBy(env, names)` is true when any listed variable has a value that is not blank. `apiKeyAccount` gives `{account: {method: "api-key"}}` when the engine is signed in and keyed (`server/drivers/acp/api-key-account.ts:6-12`).
5. With `account.method === "api-key"`, Settings offers no "Sign out", because the key signs the engine in whatever its own login says (`server/drivers/acp/api-key-account.ts:1-3`).
6. `keyOnlyEngine(instance)` is true when `access === "api"`, not `managed`, and (the driver is not `claudeAgent` or the snapshot has a version). The provider card and the engine hints both use it (`shared/engine-sign-in.ts:1-14`).

The place where a pasted key is stored is not in these reports.

### 3.12 Sign-in resume

Sign-in resume sends a person's own message again by itself when the engine is signed in again. The message must have failed because the engine was signed out, before the model saw it. The signed-out notice rows in the chat change to "signed in again" (`server/host/sign-in-resume.ts:1-3`).

#### The waiting message and the file

| Limit | Value | Where |
|---|---|---|
| A waiting message is forgotten after | 24 h (`RESUME_WINDOW_MS`) | `server/host/sign-in-resume.ts:18` |
| A notice is forgotten after | 30 days (`NOTICE_TTL_MS`) | `server/host/sign-in-resume.ts:19` |
| First recheck delay | 15 s (`RECHECK_MS`) | `server/host/sign-in-resume.ts:20` |
| Longest recheck delay | 5 min (`RECHECK_MAX_MS`) | `server/host/sign-in-resume.ts:21` |
| Status reads without "signed in" in a row before the timer stops | 5 (`RECHECKS_UNANSWERED`) | `server/host/sign-in-resume.ts:23` |

How a wait is recorded:

1. A turn fails, the hold kind is `signed-out`, the turn is `unsent`, and the request came from the person. The root hands the wait over after the turn settles and after the backup engine switch decides (`server/index.ts:6654`).
2. A start refused with `TurnAuthenticationRefusedError` for a person's turn also records a wait (`server/index.ts:8490`).
3. `signInWait(...)` builds the wait from the thread's current model selection. Without a message id or a selection it gives null (`server/host/sign-in-resume.ts:66-69`).
4. `waiting(wait)` ignores the wait if a newer wait for the same thread exists. It replaces older waits of that thread, except one that is being sent. It saves the file. It runs a pass only if a sign-in came after `failedAt` (`server/host/sign-in-resume.ts:228-233`).
5. Signed-out notices come from automatic recovery, the takeover notice and the backup engine switch, through `noticed(notice)` (`server/index.ts:8455`, `8479`, `9439`, `server/host/sign-in-resume.ts:235-239`).

The file is `<dataDir>/sign-in-resume.json` with `{waiting, notices}`. It is written with `writeFileAtomic` and mode `0o600`. A failed save is only logged (`server/host/sign-in-resume.ts:36`, `110-117`).

#### The pass

A sign-in event calls `signedIn(instanceId)`. It records the time, resets the recheck, and runs a pass (`server/host/sign-in-resume.ts:241-245`). The events are: a status read that sees "signed in" (`registry.onSignedIn`), and a sign-in in the app (`appSignedIn`, called by `ProviderAuthSessions`) (`server/host/sign-in-resume.ts:285-295`, `server/index.ts:1355`). Each sign-in also calls `takeover.signedIn(instanceId)` first, for the backup engine (`server/host/sign-in-resume.ts:285-288`). So a sign-in in a terminal also resumes the messages (`server/sign-in-resume.e2e.test.ts:98-112`).

There is one pass chain for each instance. A pass that is queued and not started is shared (`server/host/sign-in-resume.ts:211-221`).

Flow of a pass, `run(instanceId)` (`server/host/sign-in-resume.ts:164-209`):

1. `signedInWhen` is the time of the last sign-in event, or now. Only rows of this instance from before that time count. With no such rows, stop.
2. Read the status again with `signedInNow(instanceId)`. The host forgets the cached snapshots, reads `instance.snapshot()`, and counts it as signed in only when `state === "available"`, `authenticated === true`, and the registry still holds the same instance object (`server/host/sign-in-resume.ts:272-278`). An exception counts as null.
3. If the read is null, arm a recheck as "unanswered" and stop.
4. For each waiting row that is not being sent:
   1. Stop if the read no longer stands (the instance was replaced).
   2. If the row is older than 24 h, drop it without a resend.
   3. Ask `resumable(wait)`. A busy bot at capacity gives "park": keep the row and go on.
   4. Else, if the message can be sent, send it again as the Retry button does: `startTurn(botId, text, {threadId, editedMessageId: message.id, ...})` (`server/host/sign-in-resume.ts:279-283`). A failure is only logged.
   5. Remove the row and save.
5. If the read no longer stands: save, arm a recheck, stop.
6. For each notice: if the row is still a setup sign-in notice, change its tool to `chat.notice.signedInAgain` with the engine name. Remove the notice row and save (`server/host/sign-in-resume.ts:201-205`).
7. If a row was parked, arm a recheck. Else reset the recheck.

`resumable(wait)` refuses (null) when (`server/host/sign-in-resume.ts:119-134`):

- the task is gone or the conversation is busy.
- another user message or a fresh start came after `failedAt`.
- the message is not plain user text on the active path, or it is a peer ask, relayed, a spoken line, from an app, or a reaction.
- it answers a widget or an app.
- after it on the path there is a user message, a fresh start, or anything that ran.
- the thread's model selection changed.

#### The rechecks

1. An unanswered read adds 1 to a counter. A read that answers resets it (`server/host/sign-in-resume.ts:152-162`).
2. After 5 unanswered reads in a row, no timer is armed. The rows wait for the next sign-in event.
3. Else one timer is armed (with `unref`). The delay is 15 s, then 30 s, 60 s, and so on, up to 5 min.
4. Only one timer is armed for each instance at a time.

After a restart, `resumeSaved()` runs after the first engine read. Each instance with saved rows gets `signedInAt = now` if it has none, and one pass (`server/host/sign-in-resume.ts:247-252`, `290`).

#### After a failed read of the file

Load of the file (`server/host/sign-in-resume.ts:89-108`):

1. ENOENT is silent.
2. Another read error or a parse error is logged, and both lists stay empty.
3. A value that is not an object is logged and left out.
4. Rows that fail the type guards are dropped and counted in a log (`server/host/sign-in-resume.ts:39-47`, `102-105`).
5. `prune()` drops waits older than 24 h and notices older than 30 days.

The next `save()` writes the empty or reduced lists over the old file. The unreadable file is not kept aside (`server/host/sign-in-resume.ts:110-117`). So one bad read loses every saved wait. This is a case of problem e. The test checks only that a damaged file does not throw (`server/host/sign-in-resume.test.ts:402-420`).

#### What "sign-in settle" is

"Sign-in settle" is not an engine sign-in. It ends a web-site sign-in card that a bot put in the chat. In that card, the person signs in to a web site in the bot's browser or computer, then presses Done or Cancel (`server/host/sign-in-settle.ts:9-27`). The card and the hand-off belong to another part.

- `settle(..., "done" | "cancelled")` hands the browser or computer back, resumes the bot's work with a fixed prompt, and marks the card. A second call on a settled card answers 200 with `resumed: true` (`server/host/sign-in-settle.ts:51-71`).
- `expire()` ends a card that nobody answered (`server/host/sign-in-settle.ts:74-83`).
- `answerInChat()`: a line that the person writes in the chat settles every open card on the active path as `answeredInChat` (`server/host/sign-in-settle.ts:86-111`). The prompt quotes the person's line, cut to 400 characters, inside a fixed template (`server/host/sign-in-settle.ts:32-35`).
- `verified()`: a card is marked done when a later successful tool call names the site (`server/host/sign-in-settle.ts:120-133`). At `140172d88` this was true only for cards made in the turn that ended (`message.at < since`). After the tag v0.1.186 (commit `88c29487a`, issue #6285), `verified(botId, threadId)` has no `since`, so any open card of the active path settles, also a card from an earlier turn (`server/host/sign-in-settle.ts:122-128` at `e1cc6a290`, caller `server/index.ts:1964`; test `server/host/sign-in-settle.test.ts:81`).

The route `POST /api/internal/request-sign-in` makes such a card. It is also not an engine sign-in (`server/routes/sign-in.ts:11`).

### 3.13 The Antigravity account

Antigravity is Google's coding engine. The reference project lists it as "Google Gemini (Antigravity)" (`server/drivers/antigravity.ts:179`). A person can add more than one Google account. Each account is a provider instance with its own profile folder.

#### Profile folders

| Item | Path or value | Where |
|---|---|---|
| Profile folder of an account | `<DATA_DIR>/providers/antigravity/<sha256(instanceId) hex>` | `server/drivers/antigravity-acp.ts:196-198` |
| Folders inside | `antigravity-acp/` and `omb-skills/`, mode `0o700` | `server/drivers/antigravity-acp.ts:262-272` |
| Token file of the pinned runtime | `<profile>/antigravity-acp/acp_token.json` | `server/drivers/antigravity-acp.ts:209-212` |
| Token file of the native CLI | `<profile>/antigravity-acp/antigravity-oauth-token` | `server/drivers/antigravity-acp.ts:214-217`, `server/drivers/antigravity-cli-install.ts:39` |
| Settings file | `<profile>/antigravity-acp/settings.json` = `{"auth":{"type":"oauth-personal"}}`, mode `0o600`, written on each launch | `server/drivers/antigravity-acp.ts:273-277` |

`prepareAntigravityProfile` makes the environment of the engine (`server/drivers/antigravity-acp.ts:253-329`):

1. Start from the base environment. This is `process.env`, plus the instance `environment`, plus a longer `PATH` (`server/drivers/antigravity.ts:365`).
2. Remove the Google keys and project variables, without case: `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_CLOUD_PROJECT`, and more (`server/drivers/antigravity-acp.ts:76-98`, `286-289`). Then remove the workspace credentials (`server/drivers/antigravity-acp.ts:290`).
3. Set `GEMINI_HOME = <profile>` and `AGY_ACP_FORCE_FILE_STORAGE=1` (`server/drivers/antigravity-acp.ts:291-296`).
4. For the native CLI, set `AGY_CLI_DISABLE_AUTO_UPDATE=1`, a fixed `SSH_CONNECTION`, and `AGY_CLI_FORCE_FILE_TOKEN_STORAGE=1`. For the pinned runtime, set `ANTIGRAVITY_HARNESS_PATH` (`server/drivers/antigravity-acp.ts:297-314`).
5. Set `BROWSER` to a helper of the app that prints the link on standard error (`server/drivers/antigravity-acp.ts:279-285`).

The vendor fact behind step 4: the native CLI keeps one sign-in for each computer in the OS keyring, whatever `--gemini-dir` says. Versions 1.5.14 and 1.5.15 use a file when they think they run over SSH. Version 1.5.16 ignores `SSH_CONNECTION` and needs `AGY_CLI_FORCE_FILE_TOKEN_STORAGE` (`server/drivers/antigravity-acp.ts:301-306`, `server/drivers/antigravity-native-sign-in.ts:12-15`). With both variables, each account has its own sign-in file, and the keyring and a terminal sign-in are never touched. This answers problem f for this engine.

#### The two forms

| Form | Executable | Sign-in method | Life | Where |
|---|---|---|---|---|
| Pinned runtime ("Classic") | `agy_acp_server` with `localharness_external` beside it | ACP `authenticate`, the person pastes the loopback redirect address (`callback-url`) | 5 min | `server/drivers/antigravity-auth.ts:25`, `71-178` |
| Native CLI | `antigravity` 1.5 or later, no harness | `acp --login`, the person pastes a code (`pasted-code`) | 10 min | `server/drivers/antigravity-native-login.ts:17`, `131-275` |

The CLI path of the account picks the form (`server/drivers/antigravity-runtime.ts:1-12`, `272-326`):

1. A custom path: the first candidate that is a runtime. Else "The custom Antigravity ACP executable or its localharness_external sibling is missing. ...".
2. `antigravity`: the active installed CLI, else "The Google Antigravity CLI is not installed yet. Install it here.".
3. No path, or `agy`: the active CLI when the opt-in is on or the CLI came first (`cli-first.json`). Else the installed pinned release, then the active CLI, then a pinned runtime on `PATH`.

The opt-in is `OMB_ANTIGRAVITY_NATIVE_CLI=1`. Only the exact value "1" counts. The server reads it one time at start (`server/drivers/antigravity-cli-install.ts:27-33`). The driver reports `authenticationMethod: "callback-url"` for both forms. The native start answer adds `kind: "pasted-code"` (`server/drivers/antigravity.ts:461`).

`startAuthentication` (`server/drivers/antigravity.ts:462-471`):

1. Wait for a pinned sign-out that runs.
2. Resolve the runtime and the profile.
3. Cancel the native login. If it cannot stop, refuse with "The Antigravity sign-in in progress could not be stopped. Try again.".
4. Cancel the pinned flow.
5. Native: `login.start`. Pinned: check the browser helper, then `auth.start`.

A start and a sign-out never overlap (`alone`, `server/drivers/antigravity.ts:394-401`).

#### Sign-in of the pinned runtime

Limits:

| Limit | Value | Where |
|---|---|---|
| Time to get the link | 90 s (`STARTUP_TIMEOUT_MS`) | `server/drivers/antigravity-acp.ts:56`, `server/drivers/antigravity-auth.ts:98-101` |
| Life of the flow and of `authenticate` | 5 min (`AUTH_TIMEOUT_MS`) | `server/drivers/antigravity-auth.ts:25`, `97` |
| Pasted address | 16 384 characters | `server/drivers/antigravity-acp.ts:616-639` |
| Delivery of the redirect to the runtime | 10 s | `server/drivers/antigravity-acp.ts:641-667` |
| Browser helper check | 30 s, 64 KiB | `server/drivers/antigravity-acp.ts:124-152` |

Flow (`server/drivers/antigravity-auth.ts:71-178`):

1. Cancel a flow in progress.
2. Open a relay from the bot box, so that the redirect can reach a runtime in the box (`server/drivers/antigravity-auth.ts:79`).
3. Start an ACP client in the profile folder. Its callback receives the link (`server/drivers/antigravity-auth.ts:82-85`). The runtime prints the link on standard error after the prefix "Open the following link to authenticate the ACP server: " (`server/drivers/antigravity-acp.ts:54`).
4. Send `initialize`. Set `expiresAt` = now + 5 min.
5. Send `authenticate {methodId: "oauth-personal"}` with a 5 min limit (`server/drivers/antigravity-auth.ts:97`).
6. Race three events: the link arrives, `authenticate` ends, or 90 s pass ("Google sign-in did not start in time.") (`server/drivers/antigravity-auth.ts:98-101`).
7. If `authenticate` ends first, the account was signed in already. Close, call `onSignedIn`, and return `succeeded` (`server/drivers/antigravity-auth.ts:102-106`).
8. Else check the link and return `{phase: "waiting", flowId, authorizationUrl, expiresAt}` (`server/drivers/antigravity-auth.ts:107-120`). The link must have origin `https://accounts.google.com`, path `/o/oauth2/v2/auth`, one `state`, one `response_type=code`, and one `redirect_uri` of the form `http://127.0.0.1:<port>/` with a port from 1024 to 65535. Else "Antigravity returned an invalid Google sign-in URL." (`server/drivers/antigravity-acp.ts:587-614`).
9. The person signs in to Google. Google sends the browser to the loopback address. On the same computer, the runtime's own listener receives it. On another computer, the page does not load, and the person pastes its address.
10. `complete(flowId, pasted)` (`server/drivers/antigravity-auth.ts:163-178`):
    1. No flow, a wrong id, or past `expiresAt`: "This Google sign-in is no longer active. Start again.".
    2. Already sent: "The sign-in response was already sent. Wait for Google to finish.".
    3. Check the address: http on 127.0.0.1, the same port and path, one `state` equal to the flow's state, one `code` or one `error`, at most one `iss` equal to `https://accounts.google.com`. Else "This redirect URL does not belong to the current sign-in." (`server/drivers/antigravity-acp.ts:616-639`).
    4. Set `callbackSent` and forward the address to the runtime's listener with a GET. A failure sets `callbackSent` back and throws "Could not deliver the sign-in response. If Google already finished in your browser, wait a moment. Otherwise send it again." (`server/drivers/antigravity-auth.ts:170-176`).
    5. Wait for `authenticate` to end.
11. When `authenticate` resolves, the flow ends as `succeeded` and `onSignedIn` runs one time. When it rejects, the flow ends with a fixed line (`server/drivers/antigravity-auth.ts:128-139`).

`failureLine(error)` maps each error to a fixed line, because the runtime's own words can carry an authorization code (`server/drivers/antigravity-auth.ts:37-44`):

| Error | Line |
|---|---|
| `SUBSCRIPTION_REQUIRED` | "Google requires an eligible Antigravity subscription for this account." |
| `access_denied`, `denied access`, `cancelled` | "Google sign-in was not approved. Start sign-in again." |
| `SignInExpired` | phase `expired`, "Google sign-in expired. Start sign-in again." |
| other | "Google sign-in failed. Start sign-in again." |

`get(flowId)` gives `verifying` after the address was sent, else `waiting`. It never gives the link again. An unknown id gives `expired` (`server/drivers/antigravity-auth.ts:149-161`).

#### Sign-in of the native CLI

Limits:

| Limit | Value | Where |
|---|---|---|
| Time to get the link | 90 s (`STARTUP_TIMEOUT_MS`) | `server/drivers/antigravity-native-login.ts:12`, `124` |
| Life of a sign-in that nobody finishes | 10 min (`LOGIN_TIMEOUT_MS`) | `server/drivers/antigravity-native-login.ts:17` |
| Wait for the CLI to exit after the code | 60 s (`SUBMIT_TIMEOUT_MS`) | `server/drivers/antigravity-native-login.ts:18` |
| Wait for a killed process to exit | 10 s (`EXIT_CONFIRM_MS`) | `server/drivers/antigravity-native-login.ts:19` |
| Link | 16 384 characters | `server/drivers/antigravity-native-login.ts:20` |
| Output before the link | 64 KiB | `server/drivers/antigravity-native-login.ts:21` |
| Pasted code | 2 048 characters | `server/drivers/antigravity-native-login.ts:22` |
| Pasted address | 16 384 characters | `server/drivers/antigravity-native-login.ts:23` |

Flow of `start(runtime, profile)` (`server/drivers/antigravity-native-login.ts:131-190`):

1. Cancel the flow in progress and wait until all login processes end. If one is still alive, throw "The Antigravity sign-in in progress could not be stopped. Try again.". If another cancel came during the wait, throw the cancelled line (`server/drivers/antigravity-native-login.ts:133-134`).
2. Remove `DISPLAY` and `WAYLAND_DISPLAY`, so the CLI only prints the link and opens no browser (`server/drivers/antigravity-native-login.ts:135-136`).
3. Start `acp --login --gemini-dir <profile> --app-data-dir antigravity-acp` in the profile folder, in the bot box, with `<profile>/omb-skills` read-only (`server/drivers/antigravity-native-login.ts:35-37`, `137-142`). No secret is in the arguments.
4. Put the child in the map of live login processes until it exits. The map is shared with the controller of a rebuilt instance, because a process that outlived its kill can still write a sign-in (`server/drivers/antigravity-native-login.ts:104-106`, `145-150`).
5. Collect standard output until a link is found. Ignore the output after the link, so the code never reaches the person (`server/drivers/antigravity-native-login.ts:159`).
6. Race: the link, the exit of the child, or the 90 s timer. The last two throw "Google sign-in did not return a link. Start sign-in again." (`server/drivers/antigravity-native-login.ts:173-180`).
7. Return `{phase: "waiting", flowId, authorizationUrl, expiresAt, kind: "pasted-code"}` (`server/drivers/antigravity-native-login.ts:183-184`).
8. On an error, kill the process tree and throw.

The link is found by its shape, not by the words around it. It is the first `http(s)://` token followed by white space. It must have origin `https://accounts.google.com`, a path that starts with `/o/oauth2/`, one `redirect_uri` equal to `https://antigravity.google/oauth-callback`, one `response_type=code`, and a `state` (if present) of at most 512 characters. A first address that fails gives "Antigravity returned an invalid Google sign-in link." (`server/drivers/antigravity-native-login.ts:15`, `42-57`).

Flow of `complete(flowId, pasted)` (`server/drivers/antigravity-native-login.ts:238-275`):

1. No flow, a wrong id, or past the expiry: "This Google sign-in is no longer active. Start again.". Already sent: "The sign-in code was already sent. Wait for Google to finish.".
2. Check the input (`server/drivers/antigravity-native-login.ts:61-83`):
   - empty: "Paste the authorization code, or the full address of the page Google ended on.".
   - CR, LF or NUL: "Paste only the authorization code, or the full address of the page Google ended on.".
   - a code over 2 048 characters, or with other characters than `[\w./~+=%-]`: "That does not look like an authorization code. ...".
   - an address with another origin or path: "That address is not the page Google ends on after sign-in. ...".
   - an `error` parameter: the not-approved line.
   - not exactly one `code`: "That address has no sign-in code. ...".
   - another `state`: "That address belongs to another sign-in. Start again from the link above.".
3. Set `submitted` and write the line and a newline to standard input. A failed write ends the flow as `failed` and kills the tree.
4. Wait up to 60 s for the CLI to exit. Exit code 0 is `succeeded` and calls `signedIn`. Another exit is `failed` (`server/drivers/antigravity-native-login.ts:206-217`).
5. If the CLI does not exit in time, call `confirm()`: a fresh check of the sign-in. True is `succeeded`. False or an error is `failed`. Then kill the tree (`server/drivers/antigravity-native-login.ts:261-273`).

The 10 min timer ends a flow that was not submitted as `expired` and kills the tree. It does not fire after the code is sent (`server/drivers/antigravity-native-login.ts:198-202`). `cancel()` ends the flow as `cancelled`, closes standard input, kills every live login process and waits up to 10 s for each. It returns true only when no login process is left (`server/drivers/antigravity-native-login.ts:278-294`).

#### How "signed in" is found

Pinned runtime (`server/drivers/antigravity-acp.ts:331-343`):

1. The token file is a file of 1 byte to 1 MiB and can be read. The content is not parsed.
2. Its stamp (`mtimeMs:size:ino`) is not the stamp recorded at the last refusal.
3. Any error, including a read error, is "signed out".

When the runtime asks for a new sign-in during a turn or a model probe, `noteAntigravitySignInRequired` records the file stamp. The account reads signed out until a sign-in succeeds or the file changes. This note is in memory only (`server/drivers/antigravity-acp.ts:236-249`).

Native CLI (`server/drivers/antigravity-native-status.ts:1-6`, `68-91`): the CLI has no status command, and the file does not say if Google still accepts it. So the server asks the CLI:

1. Start a new CLI process and send `initialize` (20 s window, 60 s cap).
2. Send `session/new` in the profile folder (30 s).
3. A refusal with code -32000 and a message like "Authentication required" or "Sign-in required" is "out" (`server/drivers/antigravity-native-status.ts:39-43`). Another -32000 (such as "Authentication service unavailable") says nothing.
4. Any other error is thrown. It is never counted as "out".
5. If the CLI offers it, send `session/close` (5 s, errors ignored). Return "in".

The answer cache `NativeSignInCache` (`server/drivers/antigravity-native-status.ts:120-188`):

- "out" is kept 30 s. "in" is kept until `forget`, because each question starts a whole CLI that talks to Google.
- The key includes the executable path and the version, so a CLI update asks again (`server/drivers/antigravity.ts:157`).
- One read in flight is shared. A failed read is not kept.
- `forget` increments a generation. A read that began before `forget` does not write its answer back.
- A rebuilt instance, a person's "check" and a refused session all call `forget` (`server/drivers/antigravity.ts:347-348`, `server/routes/instances.ts:340-348`).

Before a native turn, `isAuthenticated` is true unless the cache knows "out". The turn's own `session/new` is the real question (`server/drivers/antigravity.ts:283-295`). The snapshot leaves `authenticated` out when the CLI could not answer, and no caller reads that as signed out (`server/drivers/antigravity.ts:300-304`).

`antigravitySignInError` decides if a pinned runtime error asks for a sign-in (`server/drivers/antigravity.ts:113-130`):

1. Code -32603 with a message that starts "No browser is available here" is a sign-in request.
2. Else only code -32000 counts.
3. The reason is the message and the `data` fields, each cut to 2 000 characters.
4. Words that ask for a sign-in decide. Words that only mention a sign-in count, unless the reason has a network word or is transient.

#### The auth blip

An auth blip is a moment when Google cannot confirm a sign-in. The rule is: "a sign-in Google cannot confirm for a moment is not a sign-out" (`server/antigravity-auth-blip.e2e.test.ts:14`). The test shows the flow:

1. A pinned account reads `authenticated: true`. A bot uses it with Codex as the backup engine (`server/antigravity-auth-blip.e2e.test.ts:44-89`).
2. The runtime answers `authenticate` with -32603 "Failed to refresh token: network is unreachable" (`server/antigravity-auth-blip.e2e.test.ts:93`).
3. No line says "signed out" or "needs a Google account". The reason "network is unreachable" shows. The account still reads signed in. The backup engine does not take the turn (`server/antigravity-auth-blip.e2e.test.ts:96-103`).
4. The failed process gets no prompt and stops within 15 s (`server/antigravity-auth-blip.e2e.test.ts:106-110`).
5. The next turn runs on a new process on Antigravity (`server/antigravity-auth-blip.e2e.test.ts:111-116`).

One brief failure does count against the account. For a custom native path, a `--version` probe that fails or passes its 5 s limit is cached as "not native" by `size:mtime` (`server/drivers/antigravity-runtime.ts:202-217`). Then `resolveAntigravityRuntime` throws until the file changes, and `isAuthenticated` returns false before the turn (`server/drivers/antigravity.ts:285-295`). This is a case of problem a.

#### Sign-out confirmed

The driver's `signOut` (`server/drivers/antigravity.ts:481-496`):

1. Cancel both sign-in flows. A login process that cannot be stopped fails the sign-out.
2. Stop all turns of the account (`base.adapter.stopAll()`, `server/drivers/antigravity.ts:484`).
3. If the path runs the native CLI and it cannot be resolved, throw. It must not pass as done.
4. Native: `signOutNative` (below).
5. Pinned: delete both token files at once. When the runtime processes are gone, delete them again, because a process "can write the token file again as it exits". A process that outlived its kill is only warned about (`server/drivers/antigravity.ts:479-495`). The profile folder stays (`server/drivers/antigravity-acp.ts:224-227`).

`signOutNative` (`server/drivers/antigravity.ts:404-419`, `server/drivers/antigravity-native-status.ts:95-118`):

1. Mark a sign-out as running. A native process that starts now is killed at once (`server/drivers/antigravity.ts:151-154`).
2. Stop all runtime processes of the account. Else "Antigravity is still running and could not be stopped. Try again.".
3. Forget the cache.
4. Start a CLI and send `logout` if the CLI offers `auth.logout`. Ignore its errors. Wait for the exit.
5. Delete the native token file (4 retries, 250 ms).
6. Start a new CLI and ask again. "in" throws "Antigravity still reports a Google sign-in for this account. Update Antigravity and check its sign-in before trying again.". A failed check throws "Antigravity could not confirm the sign-out for this account. ...".
7. Forget the cache again and clear the mark.

So the sign-out is confirmed, not assumed.

#### The add-account route

`POST /api/instances/antigravity-accounts` with `{displayName, sourceInstanceId}` (`server/routes/antigravity-accounts.ts:1-38`):

1. Another method or path goes to the next handler.
2. A content type other than `application/json` gets 415.
3. The body is at most 8192 bytes. A bad body gets 400 "Enter an account name (up to 80 characters) and select an Antigravity provider.". The schema is strict (`server/antigravity-account-api.test.ts:66-78`).
4. Inside the shared settings lock: the source must have `driver === "antigravityAgent"`, else 400 "Select a personal Antigravity provider.".
5. Make the id `antigravity-<uuid>`.
6. Copy only `config.cli` from the source. "Only share the runtime. Each instance gets its own Google profile." (`server/routes/antigravity-accounts.ts:28-31`). No environment and no sign-in are copied. The new account starts signed out.
7. Persist, then answer 201 `{instanceId, instances}`.
8. If the lock is held, answer 409 "provider settings are already being updated".

The lock is the root's `providerConfigBusy` flag (`server/index.ts:12180-12189`). The same flag guards `DELETE /api/instances/<id>` (`server/routes/instances.ts:567-570`). The route needs the `admin` scope (`server/request-auth.ts:535-542`). The admin log records it as `account-add` (`server/admin-audit-plan.ts:17-18`).

Removal of an added account (`server/routes/instances.ts:565-604`): the original `antigravity` account cannot be removed (400). An account that bots use gets 409. Else the config entry is deleted and saved, then `removeAntigravityProfile` deletes the whole profile folder. The delete is best effort, so a failure leaves the sign-in file on disk with no account (`server/drivers/antigravity-acp.ts:200-207`).

#### The email lookup

`antigravityAccount(tokenPath)` finds the email of the Google account for display. It never decides "signed in" (`server/drivers/antigravity-account.ts:10-33`).

1. `stat` the token file. Not a file, or more than 1 MiB: no email.
2. Read the text and take its SHA-256 as the fingerprint.
3. If the cache has the same fingerprint and is not expired, return the cached promise. Two calls at one time share one lookup.
4. Parse the JSON. Accept the native shape with an access token that has more than 60 s left, or the pinned shape with `client_id`, `client_secret` and `refresh_token`. Else no email and no network request.
5. Put a cache entry with a 60 s life. If the lookup gives an email, the life becomes 60 min (`server/drivers/antigravity-account.ts:21-23`).
6. The cache holds at most 128 entries. The oldest is removed (`server/drivers/antigravity-account.ts:26`).
7. Any thrown error deletes the entry and gives no email.

The lookup has one 3 s limit for both requests (`server/drivers/antigravity-account.ts:68`):

1. For the pinned shape, POST the refresh token to the fixed `https://oauth2.googleapis.com/token`. A redirect is an error (`server/drivers/antigravity-account.ts:49-64`).
2. GET `https://www.googleapis.com/oauth2/v3/userinfo` with the access token.
3. The email must be a string of at most 254 characters that matches a simple pattern (`server/drivers/antigravity-account.ts:76`).

The token file's own `token_uri` is ignored. The access token stays in memory. "Identity lookup failure must not mark a working engine as signed out." (`server/drivers/antigravity-account.ts:79`).

#### The switch from pinned to native

1. The app offers the switch only for an `antigravityAgent` account that is available, not on the CLI already, and with a CLI path that is empty, `agy` or `agy_acp_server` (`src/components/AntigravitySwitchCli.tsx:11-14`). A custom path gets no offer.
2. The app sends `PATCH /api/instances/<id>` with `{cli: "antigravity"}`, then `POST /api/instances/<id>/install` (`src/components/AntigravitySwitchCli.tsx:25-42`).
3. If the install fails, the app sets the old path back (errors ignored) and shows the error. So a working account keeps working.
4. The app always refreshes the instances at the end.
5. The native CLI keeps its sign-in in another file, so the person must sign in with Google again (`apps/docs/content/docs/providers/antigravity.mdx:46`).

The switch is one way. The UI has no runtime selector and no "Classic runtime" choice after the switch (`src/components/EnginesSettings.antigravity-switch.dom.test.ts:62-77`, `102-117`). The install of the native CLI comes from a fixed Google origin, is checked by SHA-512, must hold one regular file, and its folder is made read-only (`server/drivers/antigravity-cli-install.ts:47-55`, `123-128`, `162-208`). The usage numbers follow the runtime at once after a switch (`server/plan-usage-antigravity-native.test.ts:80-93`).

### 3.14 API providers and keys

An API provider is a remote HTTP service that the server calls itself with a saved key. It needs no CLI on the computer, and it gives no terminal and no workspace files (`apps/docs/content/docs/providers/index.mdx:53-57`, `apps/docs/content/docs/providers/model-providers.mdx:96-100`). An engine CLI is different: it is an agent program that the app starts on the computer, and it uses its own login (`apps/docs/content/docs/providers/index.mdx:7`). Both kinds are "instances" in `config.json`. An instance is one configured engine entry with a `driver` field. API instances have `access: "api"` (`server/config.ts:237-250`, `server/instance-fleets.ts:9-23`).

#### Key kinds and base URLs

The key check knows 11 key kinds (`server/provider-key-check.ts:4`, `server/provider-key-check.ts:11`). Each kind has a fixed default base URL (`server/provider-key-check.ts:30-42`).

| Kind | Default base URL |
|---|---|
| `anthropic` | `https://api.anthropic.com` |
| `openai` | `https://api.openai.com/v1` |
| `openrouter` | `https://openrouter.ai/api/v1` |
| `openaiCompat` | `https://openrouter.ai/api/v1` |
| `xai` | `https://api.x.ai/v1` |
| `mistral` | `https://api.mistral.ai/v1` |
| `cerebras` | `https://api.cerebras.ai/v1` |
| `groq` | `https://api.groq.com/openai/v1` |
| `greenference` | `https://llm.eu.greenference.com/v1` |
| `modelgo` | `https://api.modelgo.ai/v1` |
| `meta` | `https://api.meta.ai/v1` |

DeepSeek and OpenCode keys exist in the config, but they have no test (`src/components/keys/key-catalog.ts:120-126`).

The default fleet has these API instances: `openai`, `claudeApi`, `xaiApi` and `openrouter` (the `API_KEY_FLEET`), and also `openaiCompat`, `mistral`, `cerebras`, `groq`, `greenference`, `modelgo` and `meta` (`server/instance-fleets.ts:9-57`). The `API_KEY_FLEET` entries are applied again on every load, "so the openai/openrouter instances never fall back to the shared key and URL" (`server/config.ts:1146-1152`).

#### How a key is saved

1. The person pastes a key into a key row in Settings. The UI cleans it: it removes zero-width characters, trims it and removes one pair of quotes (`src/components/keys/key-save.ts:39-43`). A value with whitespace inside is refused in the UI (`src/components/keys/KeyRow.tsx:202-207`). At `e1cc6a290` (commit `88a285945`, v0.1.186) the server also trims each saved provider key (`secretText = z.string().trim().optional()`, `server/config.ts:40`).
2. On the desktop, the UI writes the key to the OS-encrypted store through `window.ogb.setCredential(slot, value, options)`. This happens when the row has a slot and the desktop is not a remote client of another computer (`src/components/keys/key-save.ts:9-17`).
3. In all other cases, the UI sends `PUT /api/config` with the row's patch. An empty string removes the key (`src/components/keys/key-save.ts:19-27`).
4. The route accepts only an admin caller. A member token gets 403 (`server/request-auth.test.ts:735-760`). A paired phone may send only a key-only patch, else it gets 403 "From a phone, only API keys can be changed. Change other settings on your computer." (`server/routes/config.ts:146-149`, `server/provider-key-check.ts:13-28`). On hosted models, a patch with a provider kind gets 403 `HOSTED_PROVIDER_SETTINGS_ERROR` (`server/routes/config.ts:150`). A second save while one runs gets 409 "provider settings are already being updated" (`server/routes/config.ts:216`).
5. The route does not check provider keys against the provider. It calls `checkProviderKey` nowhere (`server/routes/config.ts:496-517` checks only TTS and decider keys).
6. With `?secretStorage=external` (desktop only, never from a phone), the keys are already in the OS store. The server writes `""` into every key field of `config.json`, so no older plain-text copy stays (`server/routes/config.ts:578-615`).
7. `saveConfig` writes the file. Then `syncCredentialEnv` sets the same env vars in the server process, because "loadConfig prefers env over the file for credentials, so the env must follow the save" (`server/routes/config.ts:615-626`, `server/config.ts:771-815`). So each saved key also lives in the server's own process environment.
8. After the save, the server clears the rejected-key marks of the old and new key (`server/routes/config.ts:639`). It forgets all engine status snapshots when the patch may change engine status (`server/routes/config.ts:642-643`). It revokes the capabilities of each engine whose launch spec changed and reloads those engines (`server/routes/config.ts:689-712`). It broadcasts the new config and replies 200 (`server/routes/config.ts:713-727`).
9. `GET /api/config` never returns a key. It returns booleans, and for admins the last 4 characters (`server/routes/config.ts:140-143`). A hint exists only when the trimmed key has 12 or more characters (`server/key-hint.ts:4-11`). `withoutKeyHints` removes every `last4` for a client session (`server/key-hint.ts:33-37`).

#### How a key is checked

After a save, the UI checks the saved key at once if the row is testable (`src/components/keys/KeyRow.tsx:231`). The UI posts `{provider}` only, with no key, so the server tests the SAVED key (`src/components/keys/key-save.ts:54-55`).

1. `POST /api/keys/test` takes `{provider, key?, url?}`. The body limit is 8192 bytes (`server/routes/status.ts:146-148`). The provider must be one of the 11 kinds, else 400 (`server/routes/status.ts:161-163`).
2. The key is the pasted key or the saved key. No key gives 400 "No key to test. Paste one or save one first." A key longer than 512 characters gives 400 "That does not look like an API key." (`server/routes/status.ts:165-171`). A paired phone must paste a key and may not send its own URL (`server/routes/status.ts:150-152`, `server/routes/status.ts:172`).
3. `checkProviderKey` runs (`server/provider-key-check.ts:89-135`):
   1. An empty key gives `rejected` with no request (`server/provider-key-check.ts:94`).
   2. A bad URL gives `unexpected`. Plain `http` is allowed only to a loopback host. Any other host gives `unexpected` with no request (`server/provider-key-check.ts:96-103`, `server/provider-key-check.ts:47-50`).
   3. The URL is `{base}/models`. For `anthropic` it is `/v1/models` (`server/provider-key-check.ts:69-73`). For OpenRouter, the path becomes `/api/v1/key`, because OpenRouter's model list is public and proves nothing (`server/provider-key-check.ts:104-106`).
   4. The header is `x-api-key` plus `anthropic-version: 2023-06-01` for Anthropic, and `authorization: Bearer` for all others (`server/provider-key-check.ts:107-110`).
   5. The server sends one GET with a 10 000 ms timeout and `redirect: "manual"`, so the key never goes to a second host (`server/provider-key-check.ts:92`, `server/provider-key-check.ts:111-115`).
   6. The server reads the answer and gives a verdict (table below).
4. The reply has `cache-control: no-store` and the verdict JSON. The verdict never carries the key (`server/routes/status.ts:146`, `server/routes/status.ts:173-180`).
5. For kinds other than `anthropic`, an ok verdict calls `noteKeyAccepted` and a `rejected` verdict calls `noteKeyRejected`. An `unreachable` verdict changes nothing (`server/routes/status.ts:175-179`).
6. The test route does not save the key. Only `PUT /api/config` saves (`server/routes/config.ts:144`).

| Answer | Verdict | Line |
|---|---|---|
| 401 or 403 | `{ok:false, reason:"rejected", status}` | `server/provider-key-check.ts:116` |
| Other non-2xx | `unexpected` with status | `server/provider-key-check.ts:117` |
| Body is not a JSON object | `unexpected` | `server/provider-key-check.ts:118-119` |
| OpenRouter `/key` with boolean `data.is_free_tier` | `{ok:true, check:"authentication", models:[], freeTier}` | `server/provider-key-check.ts:120-125` |
| OpenRouter `/key` without that boolean | `unexpected` | `server/provider-key-check.ts:120-125` |
| A model list (`data`, `models` or a bare array) | `{ok:true, check:"models", models}` (first 5 ids, each 120 characters or fewer) | `server/provider-key-check.ts:44`, `server/provider-key-check.ts:75-87`, `server/provider-key-check.ts:126-129` |
| Network error or timeout | `unreachable` | `server/provider-key-check.ts:130-131` |

Edge cases:

- A 200 from `/models` proves only access to the model list. It does not prove that the key works for chat (`server/provider-key-check.ts:1`). The UI says "Authentication and chat not verified." (`src/locales/en.json:4205-4206`).
- A network error never marks a key as rejected (problem a, `server/provider-key-check.ts:130-131`).
- A separate in-memory list holds rejected-key marks. A mark is `"<base url> <first 32 hex of sha256(key)>"`. The key itself is never kept (`server/key-rejections.ts:1`, `server/key-rejections.ts:6-10`). `rejectsKey` never counts a body that names quota, billing, credits, rate limit or insufficient balance. It counts 401. It counts 400 or 403 only when the body says the key is invalid, incorrect, revoked, expired or disabled, because "xAI answers a wrong key with HTTP 400, not 401" (`server/key-rejections.ts:41-46`).

#### How a key reaches an engine

1. At load, the env wins over the file for every credential: "the desktop shell injects them as env at spawn" (`server/config.ts:715`). The server reads names such as `OMB_ANTHROPIC_API_KEY`, `OMB_OPENAI_API_KEY`, `OMB_OPENROUTER_API_KEY`, `XAI_API_KEY` and `OPENAI_COMPAT_API_KEY` (`server/config.ts:716-739`). It never reads `ANTHROPIC_API_KEY`: "an operator's stray variable must not move every Claude bot onto API billing" (`server/config.ts:721-724`).
2. `injectedEnvironment` gives each secret only to the driver that reads it (`server/config.ts:1107-1133`). Examples: `mistral` gets `MISTRAL_API_KEY`, `grok` gets `XAI_API_KEY`, the `openai` instance gets `OMB_OPENAI_API_KEY`, and other openai-compat instances get `OPENAI_COMPAT_API_KEY` and `OPENAI_COMPAT_URL`.
3. The key goes into the environment of that one engine instance, not into command arguments (problem b, `server/config.ts:1107-1133`, `apps/docs/content/docs/providers/model-providers.mdx:240-242`).
4. An instance that owns its routing never gets the workspace key, "which would go to its host" (`server/config.ts:1064-1105`). An instance owns its routing when it has its own key, env key, `apiKeyEnv` or URL. For `claudeAgent`, any of `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, `ANTHROPIC_CUSTOM_HEADERS` or `CLAUDE_CODE_USE_BEDROCK/VERTEX/FOUNDRY` in its environment also counts (`server/config.ts:1046-1060`).
5. The openai-compat driver finds its key in this order: `config.key`, the instance env var `apiKeyEnv`, the instance `OPENAI_COMPAT_API_KEY` (only for the default name), the operator env for that name, then the default name (`server/drivers/openai-compat.ts:207-215`).
6. A saved key reaches the next turn of an existing bot with no restart (`server/provider-key-flow.test.ts:77-81`).

#### everyClaudeBot

`anthropic.everyClaudeBot` decides whether the workspace Anthropic key runs every Claude bot instead of its login. Unset means true (`server/config.ts:443-444`).

1. The `claudeApi` instance always gets the key as `ANTHROPIC_API_KEY`, plus `ANTHROPIC_BASE_URL` when a URL is set (`server/anthropic-key-env.ts:3-7`).
2. Each other Claude instance also gets it, unless `everyClaudeBot === false` (`server/anthropic-key-env.ts:6`).
3. A Claude instance that owns its routing never gets it (`server/config.ts:1166-1168`).
4. The UI sets `everyClaudeBot: false` when it saves the first Anthropic key, both in the config patch and in the desktop store options. So a first key does not move existing Claude logins to API billing (`src/components/keys/key-catalog.ts:90-94`).
5. A key that is set in the file with no `everyClaudeBot` field replaces the login of every Claude instance without own routing (problem f).

#### Open risks that the docs name

- Keys exported in a server's own shell (`OPENROUTER_API_KEY`, `FIREWORKS_API_KEY`, `TOGETHER_API_KEY`) are not filtered. They "reach every engine on that server, and any bot that can run commands can read them." (`apps/docs/content/docs/providers/model-providers.mdx:87-91`, `server/model-providers-docs.test.ts:185-199`).
- "An engine without a key uses the key from Connections and sends it to that engine's address." (`apps/docs/content/docs/providers/model-providers.mdx:122-123`). On a server, an added openai-compat instance with its own URL and no key of its own falls back to `operatorEnvKey(OPENAI_COMPAT_API_KEY)` (`server/drivers/openai-compat.ts:213-214`). That function reads the live `process.env` (`server/credential-env.ts:66-68`), and `syncCredentialEnv` wrote the saved key there (`server/config.ts:782`). So the workspace key goes to that host. Under the desktop app (`OMB_DESKTOP_PARENT=1`), `operatorEnvKey` returns nothing for 5 names: `MISTRAL_API_KEY`, `CEREBRAS_API_KEY`, `OPENAI_COMPAT_API_KEY`, `OMB_OPENAI_API_KEY` and `OMB_OPENROUTER_API_KEY` (`server/credential-env.ts:62-68`).
- On Windows, environment names are case-insensitive. A differently-cased copy of a removed name in the server's environment is not removed for a custom ACP engine (`apps/docs/content/docs/providers/custom-acp.mdx:45-46`).
- "config.json is written with mode 0600; values in environment are stored as plaintext in that file." (`docs/custom-engines.md:232-233`).
- A key saved without the desktop store stays in plain text in `config.json` (`server/provider-key-flow.test.ts:82-83`).
- Keys in the person's `~/.claude/settings.json` `env` block change Claude Code everywhere on the computer. On a server, terminal exports could send a saved Anthropic key to that provider (`apps/docs/content/docs/providers/model-providers.mdx:204-225`).

### 3.15 The gateway as a provider

A gateway is one address and one key in front of many upstream models: "A gateway such as OmniRoute or LiteLLM puts several upstream models behind one address and one key, and can switch accounts or models when one runs out. How you connect it decides what a bot on it can do." (`apps/docs/content/docs/providers/gateway.mdx:7-9`).

There are two ways to connect a gateway (`apps/docs/content/docs/providers/gateway.mdx:11-29`):

| Way | What a bot can do | What the gateway must support |
|---|---|---|
| An OpenAI-compatible server (the Chat engine) | Chat completions plus the app's own tools (browser, computer, connected apps, agents, data). No terminal, no workspace files. | Chat completions |
| A Claude custom endpoint | Claude Code's native tools (Bash, Read, Edit) run against the gateway | Streaming `POST /v1/messages` with tool use (`apps/docs/content/docs/providers/model-providers.mdx:198-200`) |
| A Codex custom endpoint ("Codex direct API") | Codex's native tools | Streaming `POST /v1/responses` with tool calls (`apps/docs/content/docs/providers/model-providers.mdx:243-245`) |

"Each endpoint is its own engine, so different bots can use different gateway models." (`apps/docs/content/docs/providers/gateway.mdx:41`).

#### Claude or Codex custom endpoint with model discovery

A gateway endpoint is a Claude or Codex instance whose address is not the official one. The official URLs are `https://api.openai.com/v1` for Codex and `https://api.anthropic.com` for Claude (`server/agent-endpoint-models.ts:7`). The address is `config.endpoint.url` for Codex and `environment.ANTHROPIC_BASE_URL` for Claude (`server/agent-endpoint-models.ts:12-20`).

1. The person sends `POST /api/instances/claude-endpoint` or `POST /api/instances/codex-endpoint`. The body must be JSON (else 415) and 16 384 bytes or fewer. A bad body gives 400. A busy provider setting gives 409 (`server/routes/instances.ts:208-216`).
2. The server builds the instance with `newClaudeEndpoint` or `newCodexEndpoint` (`server/routes/instances.ts:208-226`).
3. If the person typed a model, discovery is skipped. A saved fixed model (`endpoint.model` for Codex, `ANTHROPIC_MODEL` for Claude) is never replaced by discovery (`server/agent-endpoint-models.ts:22-27`).
4. Else `discoverAgentEndpointModels` runs (`server/agent-endpoint-models.ts:50-102`):
   1. For an official endpoint, it returns the static list (the Codex static catalog or the current Claude manifest) (`server/agent-endpoint-models.ts:29-32`, `server/agent-endpoint-models.ts:55`).
   2. It reads the key from the instance environment: `OPENMAUSBOT_CODEX_API_KEY` for Codex, `ANTHROPIC_API_KEY` for Claude (`server/agent-endpoint-models.ts:56-57`).
   3. Headers: Bearer for Codex. Bearer plus `x-api-key` plus `anthropic-version: 2023-06-01` for Claude (`server/agent-endpoint-models.ts:58`).
   4. It accepts only `https`, or `http` on loopback. Else 400 "<product> reads a model list only over HTTPS or from this computer, so your key is not sent in the clear." (`server/agent-endpoint-models.ts:61-65`).
   5. It sends one GET with `redirect: "manual"` and a 10 000 ms timeout (`server/agent-endpoint-models.ts:66-71`).
   6. It reads the answer and the body (error table and limits below).
5. Discovery runs before `persistProviderInstance`. So nothing is saved when discovery fails, and the route returns the failure status (400) and message (`server/routes/instances.ts:219-220`).
6. On success, the server stores the list in `config.endpoint.models` (Codex) or `config.endpointModels` (Claude) and replies 201 `{instanceId, instances}` (`server/agent-endpoint-models.ts:101`, `server/routes/instances.ts:208-226`). The list serves "per-agent selection without storing a provider-wide model choice" (`server/agent-endpoint-models.ts:50`).
7. `PATCH /api/instances/:id/(claude|codex)-endpoint` gives 409 while a bot that uses the endpoint is busy: "Wait for bots using this endpoint to finish before changing its settings." It discovers models again only when no model is fixed and the token or address changed (`server/routes/instances.ts:228-257`).
8. `POST /api/instances/:id/refresh-models` discovers again for a gateway endpoint with no fixed model, under the busy flag (`server/routes/instances.ts:349-362`).

| Error | Result | Line |
|---|---|---|
| Network error or timeout | 400 with a hint about localhost inside a container | `server/agent-endpoint-models.ts:72-78` |
| 401 or 403 | "The gateway rejected the API key (HTTP n). Use the gateway's client API key, not a ChatGPT or Claude login token." | `server/agent-endpoint-models.ts:79-85` |
| 404 | A message to check the base URL | `server/agent-endpoint-models.ts:79-85` |
| 3xx | A message that "credentials are never forwarded through redirects" | `server/agent-endpoint-models.ts:79-85` |
| No usable ids | 400 "The gateway returned no supported model IDs..." | `server/agent-endpoint-models.ts:100` |

| Limit | Value | Line |
|---|---|---|
| Timeout | 10 000 ms | `server/agent-endpoint-models.ts:70` |
| Body size | 2 MiB (`MAX_CATALOG_BYTES`) | `server/agent-endpoint-models.ts:8`, `server/agent-endpoint-models.ts:86` |
| Models | 1000 (`MAX_MODELS`) | `server/agent-endpoint-models.ts:9`, `server/agent-endpoint-models.ts:95` |
| Id length | 160 characters | `server/agent-endpoint-models.ts:98` |
| Codex id pattern | `^[\w][\w./+-]*$` | `server/agent-endpoint-models.ts:34-48` |
| Claude id | `CLAUDE_MODEL_ID`. The id `default` is dropped, because "Claude Code reads --model default as its own default model" | `server/agent-endpoint-models.ts:34-48`, `server/agent-endpoint-models.ts:98` |

Edge cases from the docs:

- The Base URL is the gateway root without `/v1/messages`. The Token is needed even when the gateway accepts any token. An empty Model reads `/v1/models`, and this fails if the gateway protects that route (`apps/docs/content/docs/providers/gateway.mdx:31-39`).
- "Saving with a typed model, or with the official Anthropic or OpenAI URL, doesn't check the key; a wrong key shows up on the bot's first turn." (`apps/docs/content/docs/providers/model-providers.mdx:251-266`).
- A Claude endpoint gets its own config folder `DATA_DIR/providers/<instanceId>` and ignores the person's `~/.claude` (`server/model-providers-docs.test.ts:104-123`). The docs say: "The token is saved in <product>'s own config.json and sent only to the base URL you enter." (`apps/docs/content/docs/providers/model-providers.mdx:186-202`).
- Each Codex endpoint has its own Codex home. "The key is saved in config.json and is never shown in the app or passed in command arguments. Changing the URL asks for the key again." (`apps/docs/content/docs/providers/model-providers.mdx:227-249`).
- Web-session providers behind a gateway have no native function calling. The docs say to keep them out of models and `auto/*` combos that a tool-using bot can land on (`apps/docs/content/docs/providers/gateway.mdx:45-57`).

#### The OpenAI-compatible way

The openai-compat driver serves "OpenRouter, Groq, Together, llama.cpp, and other endpoints that speak the OpenAI chat-completions contract" (`server/drivers/openai-compat.ts:1-2`). It reads `GET {url}/models` with the Bearer key and an 8 s timeout. A non-2xx or an error keeps the seeded list with no message (`server/drivers/openai-compat.ts:319-323`, `server/drivers/openai-compat.ts:373`). A `managedModels` list fixes the models, and the server is not asked (`server/drivers/openai-compat.ts:216`, `server/drivers/openai-compat.ts:226-227`). For an OpenRouter URL, a `provider` value pins one upstream with `allow_fallbacks: false` (`server/drivers/openai-compat.ts:367-372`).

#### The preset table is not used

`server/model-catalog/presets.ts:51-180` holds 16 provider presets with pinned base URLs: "a catalog refresh can never change where a newly pasted key for a recommended provider is sent" (`server/model-catalog/presets.ts:1`). `server/model-catalog/catalog.ts` downloads and caches the models.dev catalog (`server/model-catalog/catalog.ts:43-48`).

No runtime module imports either file. A grep of `server/`, `src/`, `shared/`, `scripts/`, `electron/`, `packages/` and `apps/` finds only the module's own tests, `scripts/build-model-catalog.mjs`, a plain file copy in `scripts/bundle-server.mjs:155-160` and a comment in `server/perf/disk-categories.ts:245`. The docs agree: "There is no shared provider list that configures every engine. Use each engine's setup above, and do not assume a key saved for one engine changes another engine's sign-in or model list." (`apps/docs/content/docs/providers/model-providers.mdx:311-315`). The bundle copies the snapshot, so a later step may connect it. A dynamic import with another spelling would not show in the grep.

### 3.16 The default model after the first start

The default model is the engine instance and model that a new bot gets when the person chose none. The server computes it. It does not save it to `config.json` (`server/index.ts:2483-2494`).

#### Computed, not saved

1. `bootSelection` starts empty. The store gives it to each new bot (`server/index.ts:2725`, `server/index.ts:2731-2733`).
2. `refreshUnsetModelSelections` stops at once while the registry read is provisional (`server/index.ts:2484`).
3. It settles cloud-credit moves (`server/index.ts:2486`).
4. It calls `defaultSelection(undefined, ...)` with no saved choice and only the instances that are ready to run. It passes the result through `testedAi.settle` (`server/index.ts:2487`).
5. On hosted models, or when the result is empty, it stops (`server/index.ts:2488`).
6. Else it adds the new-bot effort and calls `store.applyModelDefault` for each bot whose selection is empty (`server/index.ts:2489-2493`). That writes `bots.json`, not `config.json` (`server/onboarding-model-default.e2e.test.ts:111-143`).

On hosted models, the server replaces the saved default with `hostedModels.select(...)` at start and saves it if it changed (`server/index.ts:773-780`). `saveNewBotModel` is the only other writer of `defaultModelSelection` in `server/index.ts`. It is used when the removed Computer engine was the default (`server/index.ts:2496-2534`).

#### The selection and the ranking

`selectDefaultModelSelection(instances, preferred, context)` (`server/default-model-selection.ts:62-94`):

1. A saved choice wins if it is usable. It must have an available, enabled, not signed-out instance, a non-blank model that is in the catalog, no policy refusal, and a supported variant. Else the result is empty `{instanceId:"", model:""}`. This sends new bots to setup and never moves them to another provider without a word (`server/default-model-selection.ts:60-80`).
2. A saved effort that the engine no longer offers is dropped. The model stays (`server/default-model-selection.ts:81-84`).
3. With no saved choice, `available` is the set of instances that are enabled, confirmed available, not refused and that have a default model. `ready` is the subset that is ready to run (`server/default-model-selection.ts:86-87`).
4. On an enrolled desktop (some instance belongs to a Company), the best personal ready instance wins first, "so billing stays the person's choice" (`server/default-model-selection.ts:60-61`, `server/default-model-selection.ts:88-91`).
5. Else the best ready instance wins. If none is ready, the best available instance wins (`server/default-model-selection.ts:92`).
6. The model of the instance is `models.default` if it is not blank, else the first option id (`server/default-model-selection.ts:56-58`).

Terms used here:

| Term | Meaning | Line |
|---|---|---|
| confirmed available | State `available` and not `unverified`. An engine found only as installed while checks could not finish is never chosen. | `server/default-model-selection.ts:41-45` |
| signed out | State `available`, access not `custom`, and `authenticated === false` exactly. `undefined` is not signed out. | `server/default-model-selection.ts:47-50` |
| ready to run | Enabled, confirmed available, no refusal, not signed out | `server/default-model-selection.ts:52-54` |
| hidden | A provider with `hidden: true` in the saved config drops out of every model list | `server/default-model-selection.ts:31-39` |

The ranking is shared with the welcome screen (`shared/ai-ranking.ts:1-3`, `shared/ai-ranking.ts:21-30`):

| Tier | Drivers |
|---|---|
| 0 | `claudeAgent` (Claude account) |
| 1 | `codex` (ChatGPT plan) |
| 2 | `geminiAgent`, `antigravityAgent` |
| 3 | `grokAgent`, `grok` |
| 4 | All others, and any instance with `access: "custom"` (`shared/ai-ranking.ts:39-41`) |
| 5 | The OpenCode free no-login backup |

The sort is stable: tier first, then the app's list order (`shared/ai-ranking.ts:45-49`). Inside a group, `best` takes the first instance that answered its test, then the first that is not known to have failed. It takes the OpenCode free backup only when no other instance answered (`server/default-model-selection.ts:22-29`).

#### Tested-AI background checks

"Test before trusting": a new bot's default is an AI that answered one tiny test message whenever any AI did (`server/tested-ai.ts:1-13`). Nothing waits for a test. The ranking picks the default at once (`server/tested-ai.ts:3-5`).

1. The server tests own AIs in the background, one at a time, in ranking order. It stops at the first AI that answers (`server/tested-ai.ts:242-263`). It does not test Company instances (`server/tested-ai.ts:240-245`).
2. The test sends "This is a connection check. Reply with the single word OK." (`server/engine-check.ts:12`). The limit is 90 000 ms (`server/engine-check.ts:13`). Only one check runs per engine at a time (`server/engine-check.ts:30`, `server/engine-check.ts:41-42`).
3. On timeout, the server aborts the call and records `{ok:false, reason:"timeout"}` (`server/engine-check.ts:44-49`). An empty answer gives `empty` (`server/engine-check.ts:53`). Error text that matches the `SIGNED_OUT` regex gives `signed_out` (`server/engine-check.ts:14`, `server/engine-check.ts:25-26`). An engine with no text call gives `{ok:null}`, which means untestable (`server/engine-check.ts:37-39`). Problem a: a CLI that changes its error wording falls to "other".
4. A pass sets `passed`. A miss adds 1 to `misses` and sets the next retry time (`server/tested-ai.ts:167-179`).
5. `answered` is true after a pass, false only after 2 misses in a row, and undefined otherwise (`server/tested-ai.ts:146-151`).
6. The results are saved for 24 h in `DATA_DIR/providers/ai-checks.json` (`server/tested-ai.ts:58`, `server/index.ts:2727`).
7. Each test result calls `refreshUnsetModelSelections` again (`server/index.ts:2726`).

| Constant | Value | Meaning | Line |
|---|---|---|---|
| `TIMEOUT_MS` | 90 000 ms | Limit of one test message | `server/engine-check.ts:13` |
| `BACKGROUND_SPACING_MS` | 5 min | A new sign-in is tested in the background at most this often per AI | `server/tested-ai.ts:49-51` |
| `RETRY_AFTER_MS` | [2 min, 10 min] | Retry after the first miss, then after the second | `server/tested-ai.ts:52-54` |
| `SLOW_RETRY_MS` | 1 h | Retry after that | `server/tested-ai.ts:55` |
| `MISSES_TO_FAIL` | 2 | Misses in a row before "didn't answer" | `server/tested-ai.ts:56-57` |
| `RESULT_TTL_MS` | 24 h | Age limit of a stored result | `server/tested-ai.ts:58` |

The switch `backgroundAiChecks` is on unless `OMB_AI_CHECKS=0`. Under vitest or a sealed test fixture it is off unless `OMB_AI_CHECKS=1` (`server/tested-ai.ts:60-66`). A result holds until the sign-in key or the config identity changes. The identity is the first 16 hex characters of the sha256 of the engine entry, so a changed key counts as a new sign-in (`server/tested-ai.ts:68-73`, `server/tested-ai.ts:127`, `shared/ai-ranking.ts:59-65`).

#### The first bot follows the default

1. At start, `testedAi.seed` makes the chief-of-staff bot (or the first bot) of a fresh store the follower (`server/tested-ai.ts:315-325`, `server/index.ts:2808`).
2. The follower moves only after a test result, only to an AI that passed. It moves away only from an AI that failed, is signed out or is turned off, or up to a better-ranked AI (`server/tested-ai.ts:181-211`).
3. "Only a plain "signed out" or "turned off" counts as can't run: a status read that timed out says neither, and moves nothing." (`server/tested-ai.ts:201`).
4. It does not move while a thread of that bot is busy (`server/tested-ai.ts:207`).
5. The bot stops following when the person writes to it, picks a model for it or one of its conversations, or deletes it (`server/tested-ai.ts:265-290`, `server/tested-ai.ts:204-206`).

#### When it is computed again

| Trigger | Line |
|---|---|
| At start, on a store that needs its first seed, after a wait of up to 15 000 ms for the cloud credit | `server/index.ts:2792-2793` |
| At start, on an existing store, after the start-up read of engines in use | `server/index.ts:2794-2796` |
| After each engine's start-up model refresh | `server/index.ts:2797-2807` |
| After each tested-AI result | `server/index.ts:2726` |
| Before a turn of a bot whose selection is empty (snapshots forgotten first) | `server/index.ts:7139-7142` |
| On every `describeInstances` (a GET of the engine list) | `server/index.ts:11674-11678` |

#### What it never does

- It never writes `config.json` (`server/index.ts:2483-2494`).
- It never replaces a bot's chosen model or a thread's pinned model, and a restart changes none of them (`server/onboarding-model-default.e2e.test.ts:111-143`).
- It never sets a signed-out or disabled engine on a blank starter bot (`server/onboarding-model-default.e2e.test.ts:158-168`).
- It never moves a usable saved default to another provider. An unusable saved default gives setup (`server/default-model-selection.test.ts:100-109`).
- It never tests or moves a saved default (Settings, `openmausbot setup`, New Bot defaults) or a hosted workspace (`server/tested-ai.ts:13`, `server/tested-ai.ts:125`, `server/tested-ai.ts:193`, `server/tested-ai.ts:243`).
- It never picks an instance that policy refuses (`server/default-model-selection.test.ts:213-266`).

### 3.17 The UI mode (Simple and Advanced)

The UI mode is a per-browser display setting with two values, Simple and Advanced. It is not a server setting.

#### How the mode is read and stored

1. The value lives in localStorage key `omb-advanced-mode`, as `"1"` (Advanced) or `"0"` (Simple) (`src/lib/interface-mode.ts:7`, `src/lib/interface-mode.ts:65-74`).
2. `readAdvancedMode` returns Simple when `SIMPLE_ONLY` is true (`src/lib/interface-mode.ts:21`).
3. Else a choice made in this session wins. `sessionChoice` stands in when storage fails (`src/lib/interface-mode.ts:9`, `src/lib/interface-mode.ts:22`).
4. Else a stored `"1"` or `"0"` wins (`src/lib/interface-mode.ts:24-27`).
5. Else the default is Advanced when the browser has a prior run, and Simple when it has none (`src/lib/interface-mode.ts:28`). A prior run is any of `omb-skin`, `omb-installed`, `omb-email-gate`, `omb-drafts` or `omb-show-threads` (`src/lib/prior-run.ts:1-10`). So a new install starts in Simple, and an existing browser keeps Advanced.
6. Storage that throws gives Simple (`src/lib/interface-mode.ts:29-31`).
7. `settleAdvancedModeDefault` writes that default once (`src/lib/interface-mode.ts:34-39`).
8. Other tabs follow through the `storage` event (`src/lib/interface-mode.ts:45-63`). The server render default is Simple (`src/lib/interface-mode.ts:76-78`).

61 non-test files under `src/` read the mode. The report did not read what each one hides.

#### State at 0.1.182

`SIMPLE_ONLY` is false: "Simple is the only mode. false keeps the Advanced mode switch, and each browser the mode it had." (`src/lib/simple-only.ts:1-2`). So both modes exist, and the Advanced switch is present.

#### History

| Version (date) | Change | Source |
|---|---|---|
| v0.1.94 (2026-10-02) | "Simple mode by default, an Advanced mode switch" | release notes of v0.1.94 |
| v0.1.151 (2026-11-09) | "**Simple is now the only mode.**" | release notes of v0.1.151, and commit 1de1164d5 "Make Simple the only mode (flip, reversible) (#5007)" |
| v0.1.152 (2026-11-10) | "**Choose Simple or Advanced again.** The switch is back in the app. If you were on Advanced before 0.1.151, you're put back on it." | release notes of v0.1.152, and commit 6f83379a8 "Bring Advanced mode back, and put browsers that were on it back on it (#5231)" |
| v0.1.182 | "**Simple mode stays Simple.**" (see 3.18) | release notes of v0.1.182 |

This is a change that the project made and then reversed (problem g, one line). The code keeps both paths behind `SIMPLE_ONLY` (`src/lib/new-look.ts:11-59`):

- `omb-new-look` records the mode that a browser had when Simple became the only mode: `"due"` (it was Advanced, a notice is owed), `"seen"` or `"none"` (`src/lib/new-look.ts:11-13`).
- With `SIMPLE_ONLY` on, the code resets the Advanced-only device preferences once and removes `omb-advanced-mode` (`src/lib/new-look.ts:15-18`, `src/lib/new-look.ts:49-56`).
- With `SIMPLE_ONLY` off (now), a browser with `omb-new-look` and no mode key gets its old mode back. A browser that was Advanced gets `omb-advanced-back = "due"` for a one-time "Advanced is back" notice (`src/lib/new-look.ts:20-21`, `src/lib/new-look.ts:39-47`).

`server/setup-mode.ts` is not the UI mode. It is the `/setup` chat command, and it has nothing about engines, keys or the default model (`server/setup-mode.ts:1-17`).

#### Config fields that make every engine probe again

A save of `PUT /api/config` calls `registry.forgetSnapshots()` when the patch may change engine status, because "A saved key reaches an engine through the environment its status read uses, often with no reload" (`server/routes/config.ts:642-643`). Then every engine probes its CLI again on the next read (`server/routes/config-engine-effect.ts:1-4`).

`patchMayChangeEngineStatus` is false only when every field in the patch is on a short "quiet" list (`server/routes/config-engine-effect.ts:8-15`, `server/routes/config-engine-effect.ts:17-30`):

| Field | Quiet part |
|---|---|
| `language` | whole field |
| `computerName` | whole field |
| `everyBotRules` | whole field |
| `onboarding` | `completedAt`, `version`, `reelSeen`, `hintsSeen`, `firstTurnAt` |
| `profile` | `name`, `email`, `aboutMe`, `avatarUrl` |
| `features` | `showToolCalls` |

Any other field makes every engine probe again. This includes every provider key, `defaultModelSelection`, `automaticRecovery`, a field added later, and a quiet field with the wrong shape (`server/routes/config-engine-effect.ts:1-4`, `server/routes/config-engine-effect.test.ts:23-53`). The UI mode itself is not a config field, so a mode switch makes no probe.

### 3.18 Release notes of v0.1.181 and v0.1.182 for this feature

The reader read these with `gh release view` on 2026-11-26. No note in either release names doctor or the default model.

v0.1.181 (published 2026-11-25):

- "**Codex: several ChatGPT accounts on a Cloud.** Each account signs in with a device code and keeps its own login, with its own email and sign-out in Settings."
- "**Claude on a custom endpoint stays under the 20-image limit.** On an Anthropic-compatible endpoint set in Settings, older images in a long conversation are folded away so new requests are not refused. Anthropic's own service is unchanged."
- "**ModelGo** is in the main Providers list in Settings → AI, right after Google Gemini, instead of under More providers. New installs see ModelGo's sponsor card again on their first launch, after the first reply."
- "**Antigravity CLI:** bots keep their team, browser and connected-apps tools from the first message."
- "**Bots know how to connect an engine.** When a bot lists the models it can use, it now sees why an engine can't run yet and how to connect it, for example that Antigravity signs in with a Google account and needs no API key. A local model is listed once, not under several engines."
- "**A busy Cloud no longer looks unset.** When a Cloud is under heavy load, a check that can't finish no longer shows the "connect an AI" setup page; it says plainly that the Cloud is too busy right now."
- "**On a My Cloud, each bot reaches only its own AI account's sign-in**, not other engines' or accounts' logins."
- "**The desktop app starts faster:** some start-up checks wait until after the window is up, and engines warm up ahead of your first message."
- UI mode: "**Thread tabs:** ... and in Simple mode the sidebar buttons line up with the tabs."

v0.1.182:

- "**A message stopped because an AI was signed out runs by itself** once that AI is signed in again, and its notice says so."
- "**What's new, in one place.** A short centred tour with three slides shows the new <product> Cloud, Team plans and ModelGo, each with a short clip of the app. Everyone sees it once."
- "**Antigravity accounts sit on one card** in Settings → AI, like Claude's and ChatGPT's."
- "**ModelGo sits in the top three** of Settings → AI → Providers."
- "**Antigravity CLI:** every one of the bot's tools fits under the CLI's size limit, so none go missing. Each account keeps its own Google sign-in on CLI 1.5.16 (accounts that were using the computer's shared sign-in sign in once more), and when Google's quota runs out the fallback model takes over."
- "**Gemini:** the bot's tools fit the CLI's tool budget."
- "**Backup AIs** can each keep their own reasoning level, used when they take over."
- "Tailscale on Headscale, or without MagicDNS, now says so instead of "signed out"."
- "**Windows:** dictation and calls say when Windows has no speech recognizer for your language, and Antigravity runtimes left running after a crash are stopped at start."
- "Kiro bots can open images you paste; Antigravity bots receive files a teammate handed them; Pi (omp) turns no longer hang when omp fails before it starts."
- "**While your Cloud is being updated the app says so,** instead of failing to load."
- UI mode: "**Simple mode stays Simple.** A bot asked to change a setting only Advanced mode shows changes it without switching the app to Advanced. Bots switch modes only when you ask for Simple or Advanced by name."
- UI mode: "**Set as main thread** is in the chat's ⋯ menu (and in the bot panel in Simple mode)".
- "Sign-in and CLI check requests have a size limit."

### 3.19 What the client does

The client is the browser or desktop renderer of the reference project. It does not find engines or sign-ins itself. It reads the engine list that the server sends, shows it, and calls the server routes. An "engine" here is one entry of that list (an `InstanceInfo`, see 4.5). A "flow" is one sign-in attempt that the server keeps open under a `flowId`.

#### 3.19.1 How the client loads and refreshes the engine list

No timer polls the engine list. The list changes only on the events in this table.

| Event | Request | Timeout | Notes | Source |
|---|---|---|---|---|
| App start | `GET /api/instances` | none | Dispatches only when the JSON differs from the current list (`sameJson`). | `src/state/store.tsx:2853-2860` |
| Failed load at start | same | none | Retry with backoff `min(30_000, 1_000 * 2 ** min(attempt, 5))` ms: 1, 2, 4, 8, 16, then 30 s. A sleeping Cloud home is not woken for a retry. | `src/state/store.tsx:2892-2909` |
| Live `config` frame | reload of the list | none | A retry never replaces a live patch that arrived after the retry began. | `src/state/store.tsx:2921-2925`, `src/state/store.tsx:3018`, `src/state/store.tsx:3160-3171` |
| Window focus, or the page becomes visible | `GET /api/instances` (`cached: true`) | 120 s | At most once per 30,000 ms. | `src/state/store.tsx:3221-3236` |
| "Check again" button | `GET /api/instances?fresh=1` | 120 s | `reportErrors: true`, so the button can show the error. | `src/components/EngineLibrary.tsx:110-140` |
| Any action route (install, sign-out, hide, remove, add) | the route itself | none | The answer carries the new `instances` array. The page shows it without a second request. | `src/state/use-show-instances.ts:6-13` |
| Onboarding "Connect an AI" dialog | `GET /api/instances` on mount, `?fresh=1` on its button | 10 s | Only the latest request may write. Unmount drops a late answer. | `src/components/onboarding/ConnectAi.tsx:57-80` |

The comment on the focus limit gives the reason: "a status read can run engine CLIs, and a Keychain prompt refocuses the window" (`src/state/store.tsx:3225`).

`refreshInstances` works as follows (`src/state/store.tsx:3202-3212`):

1. The caller picks the path. `cached` gives `/api/instances`. Otherwise the path is `/api/instances?fresh=1`.
2. If a request for the same path is in flight, the caller shares it (`instanceProbes`). The client never sends two requests for one path at the same time.
3. The request has `timeoutMs: 120_000`. The `api` helper turns this into `AbortSignal.timeout` (`src/state/api.ts:46-50`). A test checks that a hung request is released at 120 s, so that a retry can start (`src/state/engine-refresh.test.ts:43-55`).
4. The answer must contain an `instances` array. If not, the client throws `engineSetup.invalidStatus` ("Couldn't get the status of your AIs. Try checking again.", `src/locales/en.json:3818`). The old list stays on screen (`src/state/engine-refresh.test.ts:38-41`).
5. On success the reducer replaces `state.instances` as a whole (`src/state/store.tsx:1019-1020`).
6. On failure the error is dropped, unless the caller asked for `reportErrors` (`src/state/store.tsx:3210`).

Edge cases:

- The `api` helper has no default timeout. A call without `timeoutMs` waits until the server answers (`src/state/api.ts:46-50`). Install, sign-out, remove, hide, `POST /api/cli-test`, `claude-update` and `auth/start` pass no timeout (`src/components/EngineSetup.tsx:173`, `src/components/EngineSetup.tsx:404`, `src/components/EnginesSettings.tsx:100`, `src/components/EnginesSettings.tsx:248`, `src/components/EnginesSettings.tsx:356`). A hung call keeps only its own button busy.
- A failed "Check again" keeps the previous status and shows "Could not refresh provider status. The previous status is still shown. {reason}" (`src/components/EngineLibrary.tsx:128`, `src/locales/en.json:3816`).
- The list of hidden engines is read again each time the engine list changes (`src/components/HiddenProviders.tsx:14-27`). A failed read gives an empty list and writes nothing.
- `refreshModels(id)` is a separate call: `POST /api/instances/{id}/refresh-models`, which also returns the list (`src/state/store.tsx:3214-3219`).
- A test runs one whole set-up with the real store: CLI missing, server offline on refresh, signed out, then a window `focus` that makes the card "Ready to use" (`src/state/engine-setup-lifecycle.test.ts:40-60`).

#### 3.19.2 The three sign-in states, "ready" and "needs sign-in"

The server sends `snapshot.authenticated` as `true`, `false` or absent. The client keeps all three values apart. It does not make "absent" into "signed out".

| Value of `snapshot.authenticated` | Account state (`accountState`) | Row text in an account card | Source |
|---|---|---|---|
| `true` | `signedIn` | e-mail · organization, or "Signed in" | `src/components/EngineAccounts.tsx:33-36` |
| `false` | `signedOut` | "Not signed in" | `src/locales/en.json:4938` |
| absent | `unknown` | "Sign-in not confirmed yet" | `src/locales/en.json:4939` |
| (any, with `state !== "available"`) | `unavailable` | `snapshot.reason` or "Needs setup" | `src/components/EngineAccounts.tsx:222-228` |

"Ready" is one function, `engineReady` (`src/components/EngineLibrary.tsx:12-20`):

1. `snapshot.unverified === true` gives "not ready". The comment says the engine was "Only found installed while its checks could not finish: its sign-in is not known yet." (`src/components/EngineLibrary.tsx:13`).
2. For `clineAgent`, ready needs `state === "available"` and `authenticated === true` (`src/components/EngineLibrary.tsx:15-17`).
3. For all other engines, ready needs `state === "available"` and either `access === "custom"` or `authenticated !== false` (`src/components/EngineLibrary.tsx:18-19`). So an absent value counts as ready.

"Needs sign-in" is `needsSignIn`: `state === "available"` and `authenticated === false` (`src/components/EngineSetup.tsx:23-25`). Only an explicit `false` starts a sign-in panel.

Edge cases:

- An `unknown` account still gets a "Sign in" button, in a quieter style than for `signedOut` (`src/components/EngineAccounts.tsx:254-259`). A test checks that it offers "Sign in", not "Install" (`src/components/EnginesSettings.antigravity.dom.test.ts:382-389`).
- An `unverified` engine is not ready, so its Simple row falls to "Not set up · …" (`src/components/EnginesSettings.tsx:451-452`). There is no "checking" row state.
- `snapshot.busy` means that the status check could not finish, "not a sign that it is missing" (`src/state/store.tsx:427`). The onboarding code never counts a busy engine as missing (`src/lib/onboarding.ts:246-250`).
- An engine that worked earlier in this page load stays out of the "no engines" screen until a check that answered says it is gone (`src/lib/onboarding.ts:254-276`).

#### 3.19.3 The polls of each sign-in component

All sign-ins use one route family per engine: `POST /api/instances/{id}/auth/start`, `GET .../auth/status?flowId=`, `POST .../auth/complete`, `POST .../auth/cancel`. The client learns the end of a flow only by a poll of the status route, by the answer of `/auth/complete`, or by a manual "Check again". It uses no push event.

| Component | Used for | Poll interval | Client limit | Errors that end the flow | Errors that do not end it | Source |
|---|---|---|---|---|---|---|
| `DeviceSignIn` | device code (Codex, Grok, Kimi, Cursor), ChatGPT plan (`browser-pkce`) | one status call 2,000 ms after each new answer | a timer at `expiresAt`, only when the server sends a valid date | HTTP 401, 403, 404, 410 | every other error: the message shows and the poll runs again in 2 s | `src/components/DeviceSignIn.tsx:78-80`, `src/components/DeviceSignIn.tsx:180-211` |
| `EngineBrowserSignIn` | method `browser` (the engine opens the browser itself) | same as `DeviceSignIn` | same | 401, 403, 404, 410 | same | `src/components/EngineBrowserSignIn.tsx:41-72` |
| `ManagedEngineSetup` | Google sign-in of a managed engine (Antigravity) | `setInterval` of 2,000 ms | none | a final phase from the server. A 404 ends the flow with no error | every other error is ignored | `src/components/EngineSetup.tsx:314-348` |
| `ClaudeSignIn` | method `paste-code` | no poll | a timer at `expiresAt` | 401, 403, 404, 410 on `/auth/complete` show "expired". At `e1cc6a290` (commit `94a1a6d1f`, v0.1.186) only 401 and 403 show "expired". A reason `interrupted`, or a 404 or 410 with no reason, shows "This sign-in was interrupted. Start again." (`src/components/ClaudeSignIn.tsx:107-114`) | another error makes one `GET .../status`. If the phase is still `waiting`, the form stays open | `src/components/ClaudeSignIn.tsx:58-64`, `src/components/ClaudeSignIn.tsx:90-109` |
| `useSignInPill` | the first onboarding screen | `min(2_000 * 2 ** stalls, 30_000)` ms | 3 stalls in a row. Each request has a 10 s timeout | any `ApiError` with status below 500, at once. Three stalls end with "Lost touch with the server during sign-in. Check the connection and start again." | a timeout, a dropped connection or a 5xx counts as one stall | `src/components/onboarding/SignInPill.tsx:17-20`, `src/components/onboarding/SignInPill.tsx:117-158`, `src/locales/en.json:6380` |

The `DeviceSignIn` poll, step by step (`src/components/DeviceSignIn.tsx:180-242`):

1. The poll runs while `phase === "waiting"`, a `flowId` exists and the component is not busy.
2. If `expiresAt` parses as a date, a timer fires at `expiresAt - now` (at least 0). It aborts the poll and shows `expired`. If `expiresAt` is null or not a date, there is no client limit.
3. After 2,000 ms the client sends one status request with an `AbortController`.
4. A new answer replaces `auth` and clears the error. A new `auth` value runs the effect again, so the next call follows in 2 s.
5. On `succeeded` the client refreshes the list and the models. It ignores failures of these refreshes: "a failed catalog refresh must not read as a failed sign-in" (`src/components/DeviceSignIn.tsx:172-178`).
6. On 401, 403, 404 or 410 the flow ends as `failed` with `engineSetup.device.flowEnded` or `engineSetup.chatgpt.flowEnded`. At `e1cc6a290` (commit `94a1a6d1f`, v0.1.186), a 404 or 410, or a reason `interrupted`, ends the flow with "This sign-in was interrupted. Start again." and "Try again" (`signInInterrupted`, `unavailableFlow`, `src/components/DeviceSignIn.tsx:31-35`, `:102-106`). Only 401 and 403 keep `flowEnded`.
7. On any other error the client shows the message and sets `auth` to a copy of itself. This starts the 2 s poll again. A test checks that a network error, 503 and 429 stay retryable (`src/components/DeviceSignIn.test.ts:69-73`).

The Google poll, step by step (`src/components/EngineSetup.tsx:314-348`):

1. The poll runs while a flow exists and `snapshot.authenticated` is not true.
2. `waiting` or `verifying` keeps the poll running.
3. `expired` ends the flow with "Google sign-in expired. Start again." (`src/locales/en.json:3850`). Another non-success phase ends it with `auth.message` or "Google sign-in did not finish. Start again." (`src/locales/en.json:3851`).
4. `succeeded` refreshes the list and the models, then ends the flow.
5. A 404 means that the flow is gone on the server. The client refreshes the list and ends the flow with no error (`src/components/EngineSetup.tsx:338-343`).
6. Other errors are ignored and the poll continues.

The pill poll, step by step (`src/components/onboarding/SignInPill.tsx:117-158`):

1. The poll runs for the slots `waiting` and `code`.
2. The first check is after 2 s. A `waiting` answer resets the stall count to 0 and schedules the next check.
3. A new valid code from the server replaces the code and the link on screen.
4. A test shows the timing: three misses give polls at 2, 4 and 8 s, then the error, then no more polls for 60 s (`src/components/onboarding/SignInPill.poll.test.ts:88-107`). A request that never returns counts as a miss after 10 s (`src/components/onboarding/SignInPill.poll.test.ts:109-124`).
5. The pill has no expiry timer and no Cancel button. While the server answers `waiting`, the pill waits.

One answer behaves differently in two places: `DeviceSignIn` retries a 429, but the pill ends at once on it, because 429 is below 500 (`src/components/onboarding/SignInPill.tsx:146`). This is a case of problem a.

#### 3.19.4 The client never cancels an abandoned sign-in

The client sends `POST .../auth/cancel` only when the person presses Cancel. It sends nothing when the person leaves a flow.

1. Unmount of `DeviceSignIn`, `EngineBrowserSignIn` or the pill clears the timers and aborts the poll request only (`src/components/DeviceSignIn.tsx:206-210`, `src/components/onboarding/SignInPill.tsx:153-157`).
2. Unmount of `ManagedEngineSetup` only clears its interval (`src/components/EngineSetup.tsx:347`).
3. The `ClaudeSignIn` expiry timer only sets local state to `expired` (`src/components/ClaudeSignIn.tsx:58-64`).
4. An account card drops the sign-in of an account that leaves the list, with no cancel call (`src/components/EngineAccounts.tsx:370-376`).
5. The `EngineCard` keeps its children mounted when the card closes, so closing a card does not leave a flow (`src/components/EngineLibrary.tsx:36`).

The server alone must end a flow that nobody finishes. This is a case of problem d.

## 4. The data

### 4.1 Engine list, status and doctor data

#### Types

`InstanceConfig` is one entry of the engine list in the config (`server/contracts.ts:103-119`):

| Field | Type | Note |
|---|---|---|
| `driver` | string | Any text. An unknown kind becomes an unavailable shadow (`server/contracts.ts:103`). |
| `displayName` | string, optional | |
| `accentColor`, `icon` | optional | The look of the row. |
| `environment` | `Record<string,string>`, optional | Environment variables for this instance (`server/contracts.ts:110`). |
| `enabled` | boolean, optional | Defaults to true at load (`server/harness/registry.ts:254-260`). |
| `hidden` | boolean, optional | Left out of every model list, picker and automatic choice. The CLI and the sign-in stay (`server/contracts.ts:112`). |
| `access` | optional | `EngineAccess`: subscription, custom or api (`server/contracts.ts:667-671`). Default "subscription" (`server/harness/registry.ts:438-441`). |
| `config` | unknown | Decoded by the driver. |

`InstanceConfigMap` maps an instance id to an entry (`server/contracts.ts:119`).

`ProviderSnapshot` is the status of one engine (`server/contracts.ts:395-437`):

| Field | Meaning |
|---|---|
| `state` | "available" or "unavailable" |
| `reason?` | Text for the person |
| `authenticated?` | Signed in |
| `version?` | string or null |
| `account?` | `{email?, organization?, method?: "login"\|"api-key"}`. Display identity, never credentials (`server/contracts.ts:416-417`). |
| `busy?` | With unavailable: the check could not finish. "never a reason to show that no AI is connected" (`server/contracts.ts:411-413`). |
| `unverified?` | With available: the program file is there, but the check did not finish (`server/contracts.ts:414-415`). |
| `notEngineCli?`, `nativeCli?`, `installing?` | Marks |
| `authenticationUnavailableReason?`, `chatgptPlan?`, `freeFallback?` | Marks |
| `update?` | `{title, message, command?, serverInstall?: false}` |
| `billing?` | "metered" or "subscription". On a subscription a cost is notional (`server/contracts.ts:428-429`). |
| `warning?` | `{title, message}` |
| `ollama?` | Ollama state |

Models are not in the snapshot. They are on the instance: `models: ModelCatalog`, `modelsUnconfirmed?`, `modelsUnreadable?: "signedOut"|"timedOut"|"failed"` (`server/contracts.ts:563`, `server/contracts.ts:631-637`).

`ProviderInstance` is the live object (`server/contracts.ts:626-665`). Its fields include `instanceId`, `driverKind`, `displayName`, `enabled`, `models`, `snapshot()`, `adapter`, `dispose()` and these optional functions: `refreshModels`, `startupModelRefresh`, `installRuntime`, `startAuthentication`, `authenticationMethod` ("browser-pkce", "browser" or "callback-url"), `getAuthentication`, `completeAuthentication`, `cancelAuthentication`, `signOut` ("never touches another instance's home", `server/contracts.ts:652`), `forgetAuthentication` (`server/contracts.ts:654-655`), `generateText`, `generateMemoryText`, `reviewPermission`.

`ProviderDriver` (`server/contracts.ts:673-692`) has `driverKind`, `metadata {displayName, supportsMultipleInstances?, access?, signInAccount?, cliVersion?: RegExp}`, `install?`, `decodeConfig` (a throw makes a shadow), `defaultConfig`, `models` and `create`. `create` must reject and never throw synchronously. A rejection makes a shadow (`server/contracts.ts:690`).

`EngineInstall` (`server/contracts.ts:440-470`) has `platform`, `command` for each platform, `docsUrl`, `signInCommand`, `needsNode`, `npmPackage`, `managed {label, downloadBytes, sizeUnknown?}`, `settings: "connections"`, `standalone`, `server` and `appCopy`. `clientInstall` removes `standalone` before a client sees it (`server/contracts.ts:472-477`).

Sign-in types (`server/contracts.ts:520-537`):

- `ProviderAuthenticationStart {phase: "waiting"|"succeeded", flowId, authorizationUrl, expiresAt, userCode?, kind?: "pasted-code"}`.
- `ProviderAuthenticationStatus.phase` is one of waiting, verifying, succeeded, failed, expired, cancelled. Its `message` is safe text, "never unfiltered CLI output or credentials" (`server/contracts.ts:533-536`).

`RegistryEntry` is a live `ProviderInstance` or a `ShadowInstance {instanceId, driverKind, displayName, cli, shadow: true, reason}` (`server/harness/registry.ts:40-51`).

`EngineCheck`, the result of the live check, is `{ok:true}`, `{ok:false, reason?, error...}` or `{ok:null}` (`server/engine-check.ts:10`).

#### JSON shapes of the routes

| Route | Answer | Source |
|---|---|---|
| GET `/api/instances` | `{instances: rows}`. Section 3.1 gives the row fields. | `server/routes/instances.ts:119-126` |
| GET `/api/instances/hidden` | `{instances:[{instanceId, driverKind, displayName}]}` | `server/routes/instances.ts:115-118` |
| GET `/api/health/engines` | `{app:"openmausbot", engines: <count>}` | `server/routes/instances.ts:136-140` |
| GET `/api/instances/:id/auth/status` | `{auth: state}` | `server/routes/instances.ts:322-329` |
| POST `/api/instances/:id/check` | `EngineCheck` | `server/routes/instances.ts:340-348` |
| POST `/api/instances/:id/install` | `{instances, usingAppCopy?}` | `server/routes/instances.ts:363-368` |
| POST `/api/instances/chatgpt-accounts` | 201 `{instanceId, instances}` | `server/routes/instances.ts:171-188` |
| Errors of the `/api/instances/:id/*` POST routes | `{error, ...userErrorFields}` | `server/routes/instances.ts:409-413` |
| GET `/api/health` | `{app, version?, pid, static, capabilities, box?, doctor?}`. `doctor` is `doctorSummary()`. | `server/routes/status.ts:55-62` |

#### Files on disk

| File | Mode | Who writes it | Failed read |
|---|---|---|---|
| `<data>/providers/engine-status.json` | 0o600 | The registry, through `saveStatus` (`server/index.ts:802`, `server/harness/registry.ts:663-668`) | Empty map. The next save writes over it (`server/harness/engine-status-file.ts:98-103`). |
| `<OMB_USER_DATA>/engine-probes.json` (desktop app only) | No mode is given | The probe cache (`server/cli-probe-cache.ts:22`, `server/cli-probe-cache.ts:143`) | No cache entry. Errors are swallowed. |
| `<data>/engine-runs/<tag>/` | Folder 0o700 | The server at start (`server/engine-records.ts:155`) | The doctor check `engine-runs` reads it (see 3.5). |
| `<data>/engine-runs/<tag>/server.json` | 0o600 | The server (`server/engine-records.ts:156`) | A run with no readable `server.json` and no `clean` is "unknown" or "orphaned" (`server/doctor/checks/engine-runs.ts:38-42`). |
| `<data>/engine-runs/<tag>/<pid>.json` | 0o600 | The server, for each started child (`server/engine-records.ts:238`) | |
| `<data>/engine-runs/<tag>/clean` | 0o600, empty | The server at a clean shutdown (`server/engine-records.ts:275`) | |
| `<data>/doctor-state.json` | 0o600, atomic | `doctorAtStart` (`server/doctor/start.ts:69`) | Null: the doctor runs (`server/doctor/start.ts:35-42`). |
| `<data>/doctor-backups/<time>/` | Root and run folder 0700, files 0600 | The data doctor (`server/doctor/backup.ts:42-49`, `server/doctor/backup.ts:89`) | Pruning ignores errors (`server/doctor/backup.ts:57-73`). |
| `<data>/doctor-backups/<time>/manifest.json` | 0600, plain `writeFileSync` (not atomic) | The data doctor, again in full after each entry (`server/doctor/backup.ts:109-113`) | Read as a run with a registry copy (`server/doctor/backup.ts:124-132`). |

The status file body is `{"v":1,"engines":[rows]}` (`server/harness/engine-status-file.ts:114`). A row is `EngineStatusRow {instanceId, driverKind, cli: string|null, snapshot}` (`server/harness/engine-status-file.ts:7-12`).

- `snapshotFrom(value)` keeps only these fields: `state` (only "available" or "unavailable"), `reason`, `authenticated`, `chatgptPlan`, `freeFallback`, `unverified` (only with available), `busy` (only with unavailable), `authenticationUnavailableReason`, `account {email, organization, method}`, `version`, `update {title, message, command, serverInstall:false}`, `billing`, `warning {title, message}` (`server/harness/engine-status-file.ts:35-60`). It drops `notEngineCli` and the model lists. An account `token` and an unknown `secret` field are dropped (`server/harness/registry-start-read.test.ts:235-242`).
- The comment says the file holds the display identity of an account only, never credentials (`server/harness/engine-status-file.ts:75`).
- A save writes at most once each `STATUS_SAVE_DELAY_MS` (1 s), with the latest rows. It does not write when the body equals the last saved body (`server/harness/engine-status-file.ts:64`, `server/harness/engine-status-file.ts:113-128`).
- The write calls `mkdirSync` recursive, then `writeFileAtomicIfChanged(file, body, {mode: 0o600, durable: false})`. A write error is swallowed (`server/harness/engine-status-file.ts:87-92`).
- `flushEngineStatusFiles()` writes all pending bodies on `process.once("exit")`. A hard kill loses at most one second (`server/harness/engine-status-file.ts:71-73`, `server/harness/engine-status-file.ts:123-126`).

The probe cache body is `{"v":1,"entries":[[key, {stdout, stderr}], ...]}`. It keeps at most `KEPT` (64) entries, each with output of at most `OUTPUT_MAX` (64 KiB) (`server/cli-probe-cache.ts:23-24`, `server/cli-probe-cache.ts:115-128`).

The data doctor types (`server/doctor/types.ts`):

| Type | Fields | Source |
|---|---|---|
| `DoctorContext` | `dataDir`, `version`, `mode: "start"\|"command"`, `now()`, `startedAt`, `pidAlive(pid)`, `earlier?` | `server/doctor/types.ts:6-20` |
| `Finding` | `status: "ok"\|"problem"`, `summary` ("Never a secret, never a file's contents"), `fixable?`, `keepCopy?`, `blocking?`, `instruction?`, `detail?` | `server/doctor/types.ts:22-36` |
| `DoctorCheck` | `id`, `title`, `looksAt`, `check(ctx)`, optional `fix(ctx, finding, backup)`. Synchronous. | `server/doctor/types.ts:38-46` |
| `CheckResult` | `status: "ok"\|"problem"\|"fixed"\|"failed"`, `summary`, `fixable`, `blocking`, `instruction?`, `fixed?`, `repaired?` | `server/doctor/types.ts:48-61` |
| `DoctorReport` | `dataDir`, `version`, `at`, `fix {asked, ran, why?}`, `checks`, `backup`, `counts {checked, problems, fixed, blocking}` | `server/doctor/types.ts:63-73` |
| `DoctorSummary` | `at`, `version`, `checked`, `fixed: string[]`, `problems: string[]`, `thisStart`. Check ids and counts, "never a path or a file's contents". | `server/doctor/start.ts:15-25` |
| `BackupEntry` | `{check, action, path, savedAs?, mode?}` in `manifest.json` as `{entries}` | `server/doctor/backup.ts:18`, `server/doctor/backup.ts:109-113` |
| `HostCheck` | `{id, status: "ok"\|"warn"\|"FAIL", message, fix?}` | `server/headless/host-doctor.ts:14-21` |

`doctor-state.json` holds `{version, summary}` (`server/doctor/start.ts:13`, `server/doctor/start.ts:27`).

#### State kept in memory only

The registry keeps these maps (`server/harness/registry.ts:140-179`). None of them is saved, except through `saveStatus`.

| Map | Holds |
|---|---|
| `byId` | Each entry, live or shadow |
| `cliByInstance` | The CLI that the config sets itself |
| `lastSnapshots` | The last recorded snapshot of each engine |
| `seeds`, `seedObjects` | The statuses of the last run, during the start read |
| `unread` | Engines that the start read has not probed |
| `snapshotGeneration` | The generation counter |
| `lastAuth` | The newest plain "signed in" answer and the order of its read |
| `readsOf` | A WeakMap by instance object: snapshot, time, generation |
| `retries` | The retry state: attempt, calm count, since, prompt count, signOut, timer |
| `changedAt` | The time of the last `forgetSnapshots()` |
| `calmBroken` | Engines whose calm failures are believed |
| `turns` | Turn activity for each engine |
| `probeQueue` | The read before, on a small machine |

Other process-wide state:

- `providerConfigBusy`, one busy flag for all provider changes (`server/routes/instances.ts:49-71`).
- `claudeUpdatesInFlight`, one Claude update for each executable (`server/routes/instances.ts:112-113`).
- `running` in `server/engine-check.ts:30`: one live check for each engine.
- `unsettled` in `server/cli-program.ts:21`: CLIs whose last status check could not finish.
- The start failure notes: a map from thread id to `{at, why}`, with `why` "overloaded" or "provider". Codes only, never the words of the engine. At most `CAP` (200) notes for `START_FAILURE_KEEP_MS` (120 s). A note is taken one time (`server/engine-start-failures.ts:3-26`).
- `held` in `server/first-engine-read.ts:3-14`: the promise that background work waits on until the first engine is probed.
- The doctor summary for the health routes (`server/doctor/start.ts:29-33`).
- On the client, the set of engines that worked earlier lives only as long as the page (`forgetWorkedEngines`, `src/App.engine-status.test.ts:16-19`).

### 4.2 Named accounts, sign-in files and engine homes

#### Config entries

The list of accounts is the `instances` map in `<DATA_DIR>/config.json` (default `~/.openmausbot/config.json`). Each value is `{ driver, displayName?, config?, environment?, hidden?, ... }` (`server/config.ts:1`, `server/config.ts:883`, `server/config.ts:958-973`, `server/claude-account-api.test.ts:90-105`).

| Entry | Shape | Source |
|---|---|---|
| Claude account | `{ driver: "claudeAgent", displayName, config: { cli?, configDir } }`. No `environment`. Id `claude-<uuid>` | `server/claude-accounts.ts:73-84` |
| ChatGPT plan account | `{ driver: "codex", displayName, config: { authMode: "chatgpt-plan", cli? } }`. No `environment`. Id `chatgpt-<uuid>` | `server/routes/instances.ts:171-188` |
| Built-in ChatGPT plan | `chatgpt: { driver: "codex", config: { authMode: "chatgpt-plan", cli } }` | `server/chatgpt-plan-api.test.ts:59` |
| Codex endpoint (another writer covers it) | Saves `CODEX_HOME` and the key as `OPENMAUSBOT_CODEX_API_KEY` in plain `environment` | `server/claude-account-api.test.ts:218-229` |

`CodexConfig`: `cli`, `fullAuto`, `authMode?: "chatgpt-plan"`, `managed?`, `endpoint?`. The last three cannot be combined (`server/drivers/codex.ts:77-97`). The Claude config fields are `cli`, `configDir`, `managed`, `managedModels`, `endpointModels`, `permissionMode`, `tools`, `disallowedTools`, `requireApiKey`, `bedrock` (`server/drivers/claude.ts:266-277`). `decodeConfig` needs `configDir` to be a string that resolves (`server/drivers/claude.ts:589-591`, `server/drivers/claude.ts:596`).

#### Request bodies

| Schema | Fields | Source |
|---|---|---|
| `createClaudeAccountSchema` | `{ displayName, configDir? }`, strict. `displayName` trimmed, 1 to 80 characters, no control characters. `configDir` trimmed, at most 4096 characters, no control characters | `server/claude-accounts.ts:13-15` |
| `instanceSettingsSchema` (PATCH) | `cli` (max 4096), `displayName`, `configDir`, `tools`, `hidden`, `replyWaitMinutes` (integer 1 to 60, or null), `models`, `url`, `apiKey`. Strict, at least one key | `server/claude-accounts.ts:16-30` |
| ChatGPT account create | `{ displayName }`, the same name rules | `server/routes/instances.ts:171-188` |
| `auth/complete` | `{ flowId, code \| callbackUrl }` | `server/routes/instances.ts:396-405` |
| `auth/cancel` | `{ flowId }` | `server/routes/instances.ts:406-408` |

#### Reply shapes

| Shape | Fields | Source |
|---|---|---|
| `claudeAccountInfo` | `{ configDir, signInCommand, signInShell: "powershell" \| "sh", isDefault }`. `configDir` is `""` for the default account | `server/claude-accounts.ts:103-111`, `server/claude-accounts.ts:47-52` |
| Row of `GET /api/instances` (Claude) | Adds `claudeAccount` and sets `install.signInCommand`. A bad saved folder drops the command | `server/index.ts:11696-11711` |
| Flow status (Claude) | `{ phase, flowId, authorizationUrl, expiresAt, message? }`. After success: `{ phase, flowId, authorizationUrl: null, expiresAt: null }` | `server/drivers/claude-login-auth.ts:49-64`, `server/drivers/claude-login-auth.test.ts:119-134` |
| Flow status (device) | `{ phase: "waiting", userCode, authorizationUrl, flowId }` | `server/drivers/codex-device-auth.test.ts:106-118` |
| Claude snapshot | `{ state: "available", version, authenticated?, account?, billing, update?, warning? }` | `server/drivers/claude.ts:1806`, `server/drivers/claude-accounts.test.ts:204-207` |
| Claude `account` | `email` (at most 254), `organization` from `orgName` (at most 160), `method: "api-key"` for `authMethod === "api_key"` | `server/drivers/claude-auth-status.ts:21-32` |
| `claudeAuthStatus` result | `{ authenticated?: boolean, account? }` | `server/drivers/claude-auth-status.ts:15-36` |
| Plan snapshot (signed out) | `{ state: "available", authenticated: false, chatgptPlan: true, billing: "subscription" }`, an empty model list, `authentication: { method: "browser-pkce" }` | `server/chatgpt-plan-api.test.ts:40-48`, `server/chatgpt-plan-api.test.ts:85-88` |
| Plan `account` | `{ method: "login", email?, organization: "ChatGPT · <last 8 of clientId>" }` | `server/drivers/chatgpt-plan-auth.ts:346-352` |
| `readCodexLogin` | "signed-in", "signed-out" or "unknown", plus `apiKey` and `busy` | `server/drivers/codex-login.ts:22-45` |
| `migrate()` result | `{ ran, moved, held, swept }` | `server/engine-homes/engine-homes.ts:65-80` |

The CLI output that the server reads:

| CLI | Command | Fields read |
|---|---|---|
| Claude | `auth status --json` | `loggedIn`, `authMethod`, `email`, `orgName` (`server/drivers/claude-auth-status.ts:19-33`) |
| Codex | `login status` | Text lines "Logged in", "API key configured", "Not logged in", "Error checking login status" (`server/drivers/codex-login.ts:22-40`) |
| Codex | `app-server`, `account/read { refreshToken: false }` | `account.type`, the email (`server/drivers/codex-identity.ts:75-87`) |

#### Files on disk

| Path | Mode | Who writes it | Failed read |
|---|---|---|---|
| `<DATA_DIR>/config.json` | 0o600, atomic write (`server/config.ts:990`) | The server, `saveConfig` | Load: missing gives defaults. Unreadable or invalid is ignored with "config: ignoring <path> and using defaults: <reason>". A JSON error shows only "invalid JSON", because the message could quote a credential (`server/config.ts:698-714`). Save: an unreadable or invalid file refuses the save with 503 and keeps the bytes. An invalid file is also copied aside (`server/config.ts:884-885`, `server/config-backup.ts:41-70`) |
| `<DATA_DIR>/config.json.bak.YYYYMMDD-HHMMSS[-n]` | (not given) | The server, before each save. Up to 10 kept | If the copy cannot be written, the save is refused (`server/config.ts:989`, `server/config-backup.ts:13-16`, `server/config-backup.ts:72-79`, `server/config-backup.ts:86-100`) |
| `<DATA_DIR>/providers/<instanceId>/` | (not given) | The Claude CLI (default folder of an added Claude account) | The server never reads the credential file. A delete of the account keeps the folder (`server/claude-accounts.ts:1-2`, `server/claude-accounts.ts:82`) |
| `<account folder>/settings.json` | Owned by the person or the CLI | Not the server | Auth settings: a read error gives nothing. Model catalog: a read error gives an empty object (`server/drivers/claude.ts:158-181`, `server/drivers/claude.ts:295-316`) |
| `<DATA_DIR>/providers/chatgpt-plan/<sha256(id)>/` | 0o700, checked to be a real folder and not a symlink, then chmod (`server/drivers/chatgpt-plan-auth.ts:44-48`) | The plan controller | See the files below |
| `.../credentials.json` | 0o600, atomic | The plan controller, under the lock | ENOENT is "no file". Another error throws "ChatGPT credential storage could not be read safely. Check its permissions before signing in." Bad fields throw "Saved ChatGPT registration is invalid..." or "Saved ChatGPT credentials are invalid...". Sign-in, refresh and sign-out stop. The file is never written over (`server/drivers/chatgpt-plan-auth.ts:49-59`, `server/drivers/chatgpt-plan-auth.ts:113-123`, `server/drivers/chatgpt-plan-auth.ts:248`) |
| `.../refused-models.json` | 0o600, atomic | The plan controller, under the lock | An unreadable list is never written over with one model (`server/drivers/chatgpt-plan-auth.ts:145-164`) |
| `.../.credentials.lock` | 0o600, opened with `wx`, holds the pid | The plan controller | An old lock is never broken. A wait of 30 s, then an error (`server/drivers/chatgpt-plan-auth.ts:61-78`) |
| `<DATA_DIR>/providers/chatgpt-plan/host-id.json` | 0o600 | The plan controller, under a lock of the parent | `{ hostId: "urn:uuid:<uuid>" }`. Shared by all plan accounts of the host (`server/drivers/chatgpt-plan-auth.ts:165-178`) |
| `<DATA_DIR>/providers/chatgpt-plan/<sha256(id)>/codex/` | Owner-only (`docs/verification/chatgpt-plan.md:28-40`) | Codex (device sign-in on a Cloud, and every plan turn) | Its `auth.json`, model list and chats (`server/drivers/codex-account-home.ts:18-21`) |
| `<DATA_DIR>/providers/codex-own/<sha256(id)>/codex/` | 0o700 (`server/drivers/codex-shared-home.ts:85`) | The server makes it and links the person's Codex home into it. Codex writes chats | A failure to make it: the turn uses the person's home (`server/drivers/codex-shared-home.ts:149-155`) |
| `$CODEX_HOME/auth.json` or `~/.codex/auth.json` | The person's | Codex | `storedCodexLogin` gives null (`server/drivers/codex-login.ts:11-15`) |
| `<dataDir>/engine-homes/<key>/` | 0o700 | The server | `audienceHomes` gives `[]` on a read error (`server/engine-homes/layout.ts:33-41`) |
| `<home>/.omb-folders/<VAR>-<12 hex>` | 0o700 | The server (moved folder variables) | (`server/engine-homes/layout.ts:98-110`) |
| Sign-in copies in each audience home | 0o600, temp `.<name>.<pid>.omb` then rename | `syncSignIns` | Every error is ignored (`server/engine-homes/sign-ins.ts:21-27`, `server/engine-homes/sign-ins.ts:81-85`) |
| `<dataDir>/engine-homes/.held/<ms>/` | (not given) | The migration | Deleted after 30 days (`server/engine-homes/layout.ts:13-15`) |
| `<dataDir>/engine-homes/.migrated` | 0o600 | The migration | `{ at, moved, held }`. Its presence stops a second run (`server/engine-homes/migrate.ts:11`, `server/engine-homes/migrate.ts:98`, `server/engine-homes/migrate.ts:157`) |
| `<tmpdir>/omb-auth-XXXXXX/s` | `mkdtemp` folder | The token bridge, one per Codex run | Removed by `close` (`server/drivers/chatgpt-plan-token-bridge.ts:10-11`, `server/drivers/chatgpt-plan-token-bridge.ts:42-48`) |
| Claude MCP config with credentials | 0600 temp file | The Claude driver | (`server/drivers/claude.ts:1073-1078`) |

`credentials.json` shape (`server/drivers/chatgpt-plan-auth.ts:19-22`, `server/drivers/chatgpt-plan-auth.ts:110`):

```json
{
  "clientId": "...",
  "subject": "...",
  "email": "...",
  "hostId": "urn:uuid:...",
  "tokens": {
    "access": "...", "refresh": "...", "id": "...",
    "scopes": ["..."], "expiresAt": 0, "earliestRefreshAt": 0
  }
}
```

`email`, `tokens` and `earliestRefreshAt` are optional. A sign-out deletes only `tokens`. The rest stays, so the next sign-in uses the same client registration (`server/drivers/chatgpt-plan-auth.ts:414-442`).

`refused-models.json`: `{ subject, models[] }` (`server/drivers/chatgpt-plan-auth.ts:129-163`).

The plan account folder is excluded from workspace backups (`excludedWorkspaceAuthPath`) (`server/chatgpt-plan-api.test.ts:128-130`). Portable backups and the move to the Cloud exclude it too (`docs/verification/chatgpt-plan.md:20-22`).

#### Environment variables

| Variable | Set by | Purpose | Source |
|---|---|---|---|
| `CLAUDE_CONFIG_DIR` | Claude driver | The account folder. `HOME` does not change | `server/drivers/claude.ts:120-121` |
| `CODEX_HOME` | Codex driver | The plan home, the own-login home, or the endpoint's | `server/drivers/codex.ts:234-238`, `server/drivers/codex-shared-home.ts:156-158` |
| `CODEX_SQLITE_HOME` | Codex driver | Set with the own-login home. Removed for a plan | `server/drivers/codex.ts:238`, `server/drivers/codex-shared-home.ts:156-158` |
| `OMB_CODEX_AUTH_SOCKET`, `OMB_CODEX_AUTH_SECRET`, `ELECTRON_RUN_AS_NODE` | Plan turn, Codex 0.165.0+ | The token bridge | `server/drivers/codex-plan-token.ts:6-7`, `server/drivers/chatgpt-plan-token-bridge.ts:41` |
| `OPENMAUSBOT_CHATGPT_TOKEN` | Plan turn, older Codex | The token itself | `server/drivers/codex-plan-token.ts:27` |
| `OMB_CLAUDE_INHERIT_USER_CONFIG` | The operator | `1` lets bots load the computer's Claude setup | `server/drivers/claude.ts:139-156` |
| `BROWSER=true`, `NO_COLOR=1` | Claude login controller | The CLI prints the link (POSIX). No colour codes | `server/drivers/claude-login-auth.ts:310-319` |

#### State kept in memory only

| State | Holder | Effect | Source |
|---|---|---|---|
| `authenticatingHomes` | Module-level set in the Claude login controller | One sign-in or sign-out per credential home. Lost on restart | `server/drivers/claude-login-auth.ts:18-19` |
| `Flow` | One per Claude controller: status, child, `ready`, `codeSent`, output, timers, `homeKey`, `env`, `completion`, `stopping`, `terminationFailed` | The live sign-in | `server/drivers/claude-login-auth.ts:49-64` |
| `lastAuth` | Claude driver | The last definite "signed in" answer. Used when a check gives no answer | `server/drivers/claude.ts:1804-1805` |
| Last Codex login answer | `keptCodexLogin` | Used when a check is `busy` | `server/drivers/codex-login.ts:47-51` |
| Keyring login memo | `codexLoginCheck` | A login read from elsewhere, kept for that stored value until `forget` | `server/drivers/codex-login.ts:61-73` |
| Plan token renewal answer | `planTokenRenewal` | Kept until a snapshot reads another version. A failed read is not kept | `server/drivers/codex-plan-token.ts:43-61` |
| `planGeneration` | Codex driver | A plan sign-in start increments it. A running turn sees the change | `server/drivers/codex.ts:349-356`, `server/drivers/codex.ts:1493-1497` |
| Refused models | Plan controller | Known at once, then saved under the lock | `server/drivers/chatgpt-plan-auth.ts:145-164` |
| PKCE `state`, `nonce`, `verifier`, loopback server | Plan controller, one flow | Lost on restart. The flow expires after 15 min | `server/drivers/chatgpt-plan-auth.ts:252-296` |
| Flow owner | `providerAuthSessions` | Session id, `companion:<device>` or "loopback" | `server/routes/instances.ts:319-321` |
| Thread and bot slots (`AsyncLocalStorage`) | `EngineHomes` | Tie each spawn to its conversation | `server/engine-homes/engine-homes.ts:15-34` |
| Config busy flag | Routes | One settings change at a time | `server/routes/instances.ts:565-571` |

### 4.3 Sign-in data: device code, sessions, resume and Antigravity

#### Wire types

The status of a sign-in, as the app reads it (`src/components/DeviceSignIn.tsx:12-19`):

```ts
DeviceSignInStatus = {
  phase: "waiting" | "succeeded" | "failed" | "expired" | "cancelled",
  flowId, authorizationUrl, userCode?, expiresAt /* ISO */, message?
}
```

The server also uses the phase `verifying` (a code or address was sent, and the engine has not finished) for the Antigravity forms (`server/drivers/antigravity-auth.ts:149-161`, `server/drivers/antigravity-native-login.ts:228-235`). The native Antigravity start adds `kind: "pasted-code"` (`server/drivers/antigravity-native-login.ts:183-184`).

| Shape | Fields | Where |
|---|---|---|
| Start answer | `{auth: {phase: "waiting", flowId, authorizationUrl, userCode, expiresAt}}` (device code) | `server/grok-sign-in-api.test.ts:72-75` |
| Start answer, native Antigravity | `{auth: {phase: "waiting", kind: "pasted-code", flowId, authorizationUrl, expiresAt}}` | `server/routes/instances-antigravity-native.test.ts:99-131` |
| Finished status | `{phase, flowId, authorizationUrl: null, expiresAt: null, message?}`, no message on `succeeded` | `server/drivers/device-auth.ts:347-371` |
| Browser sign-in start | `{phase: "waiting", flowId, authorizationUrl: null, expiresAt}` | `server/drivers/acp/browser-auth.ts:208` |
| Complete body | `{flowId, callbackUrl}` or `{flowId, code}`, at most 8192 bytes | `server/routes/instances.ts:396-405` |
| Cancel body | `{flowId}`, at most 4096 bytes | `server/routes/instances.ts:406-408` |
| Error body | `{error, ...userErrorFields}` | `server/routes/instances.ts:409-413` |
| Instance row | `authentication {method: "device-code", signOut: true}`, `install {signInCommand}`, `snapshot {state, authenticated?, account?}` | `server/grok-sign-in-api.test.ts:60-69` |
| API-key account | `{account: {method: "api-key"}}` | `server/drivers/acp/api-key-account.ts:10-12` |
| Add Antigravity account | request `{displayName, sourceInstanceId}`, answer 201 `{instanceId, instances}` | `server/routes/antigravity-accounts.ts:15`, `32-33` |
| Terminal login wire | `id`, `code`, `label`, `scopes`, `local`, `source`, `createdAt`, `expiresAt`. Never the poll secret or a token | `shared/cli-login.ts:5-16` |

The sign-in methods that an instance reports: `device-code`, `browser` (the engine opens the browser), `browser-pkce` (the ChatGPT plan), `paste-code` (Claude), `callback-url` (Antigravity, both forms) (`src/components/EngineSetup.tsx:687-690`, `server/drivers/antigravity.ts:461`, `server/drivers/acp/browser-auth.ts:72-80`).

#### Types in the server

| Type | Fields | Where |
|---|---|---|
| `DeviceSignInState` | `"signed-in" \| "signed-out" \| "other" \| "unknown"`. `other` is a sign-in by another method, never replaced | `server/drivers/device-auth.ts:27-28` |
| `DeviceSignIn` spec | `provider`, `product`, `account`, `homeEnv`, `homeDir`, `loginArgs`, `env?`, `install`, `failure(output)`, `status?`, `signedIn?`, `signInState?`, `logoutArgs?`, `removeCredentials?` | `server/drivers/device-auth.ts:30-53` |
| `DeviceAuthOptions` | `cli`, `environment()`, `onAuthenticated?`, `signInRejected?`, `startupTimeoutMs?` (30 000), `lifetimeMs?` (15 min), `terminateTimeoutMs?` (1500) | `server/drivers/device-auth.ts:80-89` |
| `DeviceSignInProvider` | `"codex" \| "grok" \| "kimi" \| "cursor"` | `shared/device-sign-in.ts:9` |
| `AcpBrowserSignInSpec` | `product`, `args?`, `methodId(authMethods, env)`, `signedIn?`, `serverHint?`, `failure(stage, detail?)`, `removeCredentials?`, `signedInByApiKey?` | `server/drivers/acp/browser-auth.ts:22-41` |
| `AcpBrowserAuthStage` | `"start" \| "initialize" \| "authenticate" \| "processEnded" \| "expired"` | `server/drivers/acp/browser-auth.ts:19-20` |
| `SignInWait` | `botId`, `threadId`, `messageId`, `selection` (instance id and model), `trigger?`, `failedAt` | `server/host/sign-in-resume.ts:25-32` |
| `SignedOutNotice` | `instanceId`, `threadId`, `messageId`, `at` | `server/host/sign-in-resume.ts:34` |
| `AntigravityProfile` | `directory`, `tokenPath`, `environment`, `tempDirectory?` | `server/drivers/antigravity-acp.ts:69-74` |
| `AntigravityRuntime` | `executablePath`, `harnessPath` (null for the native CLI), `source` (`managed`, `override` or `path`), `version` | `server/drivers/antigravity-runtime.ts:94-100` |
| `NativeSignIn` | `"in" \| "out"` | `server/drivers/antigravity-native-status.ts:20` |
| `Identity` | `{email, method: "login"} \| undefined` | `server/drivers/antigravity-account.ts:4` |
| `AntigravityStoredSignIn` | `{client_id, client_secret, refresh_token}`, the pinned token file | `server/drivers/antigravity-account.ts:35` |

#### Files on disk

| File | Mode | Who writes it | Failed read |
|---|---|---|---|
| `<dataDir>/sign-in-resume.json` = `{waiting: SignInWait[], notices: SignedOutNotice[]}` | `0o600`, atomic write | sign-in resume, after each change (`server/host/sign-in-resume.ts:110-117`) | ENOENT is silent. Other errors are logged, the lists stay empty, and the next save writes over the file (`server/host/sign-in-resume.ts:89-108`) |
| Engine homes: `$CODEX_HOME` or `~/.codex`, `$GROK_HOME` or `~/.grok` (`auth.json`), `$KIMI_CODE_HOME` or `~/.kimi-code` (`credentials/kimi-code*.json`), `$CURSOR_CONFIG_DIR` or `~/.cursor`, `$VIBE_HOME` or `~/.vibe` | set by each CLI | the engine CLI during the login (`server/drivers/acp/core.ts:374-375`) | Grok: not ENOENT gives `unknown` (sign-out refuses). Kimi: any error is "signed out" (`server/drivers/acp/grok.ts:46-55`, `server/drivers/acp/kimi.ts:43-63`) |
| Antigravity profile folder `<DATA_DIR>/providers/antigravity/<sha256(instanceId)>/` with `antigravity-acp/` and `omb-skills/` | `0o700` | the server, before each launch (`server/drivers/antigravity-acp.ts:196-198`, `262-272`) | not applicable |
| `<profile>/antigravity-acp/acp_token.json` (pinned) | `0o600` in the fakes | the pinned runtime (`server/testing/fake-antigravity-signin.ts:15-28`) | any error is "signed out". The content is not parsed (`server/drivers/antigravity-acp.ts:331-343`) |
| `<profile>/antigravity-acp/antigravity-oauth-token` (native), `{"token":{"access_token","expiry",...},"auth_method":"consumer"}` | `0o600` in the fake | the native CLI (`server/drivers/antigravity-cli-install.ts:35-39`) | the email lookup and the usage reader give nothing. "Signed in" is asked of the CLI, not read from the file |
| `<profile>/antigravity-acp/settings.json` = `{"auth":{"type":"oauth-personal"}}` | `0o600`, atomic | the server, on each launch (`server/drivers/antigravity-acp.ts:273-277`) | not read |
| `<data>/tools/antigravity-acp/<platform>-<arch>/versions/<id>/` with `.install-complete.json` | folder `0o555`, executable `0o555`, record `0o444` | the CLI installer (`server/drivers/antigravity-cli-install.ts:123-128`) | a record that does not match makes the release invalid, and the folder is removed (`server/drivers/antigravity-cli-install.ts:94-113`) |
| `active.json` `{releaseId}` | `0o600`, atomic | the CLI installer (`server/drivers/antigravity-cli-install.ts:158-160`) | not in the reports |
| `cli-first.json` | `0o600`, atomic | the installer, on a computer with no runtime before (`server/drivers/antigravity-runtime.ts:262-269`) | not in the reports |

A sign-out of a pinned account deletes both token files and keeps the profile folder (`server/drivers/antigravity-acp.ts:224-227`). Removal of an added account deletes the whole profile folder, best effort (`server/drivers/antigravity-acp.ts:200-207`).

#### State in memory only

A restart loses all of these.

| State | Owner | Where |
|---|---|---|
| One flow, one extra command child, `signingOut`, `disposed` | each `DeviceAuthController` | `server/drivers/device-auth.ts:93-96` |
| `authenticatingHomes`: a set of canonical home paths that sign in now | the device-auth module, for the whole process | `server/drivers/device-auth.ts:15-16` |
| One flow, the last `finished` status, `stopping` | each `AcpBrowserAuth` | `server/drivers/acp/browser-auth.ts:83-92` |
| `flows: Map<instanceId, Flow>` with `owner`, `flowId`, `expiresAt`, `busy`, `starting`, `revoked`, `revision`, `told` | `ProviderAuthSessions`, one for the server | `server/provider-auth-sessions.ts:5-21` |
| `requests: Map<id, CliLoginRequest>` with `verifierHash`, `state`, `token?`, `session?` | the terminal login route | `server/routes/cli-login.ts:23-30`, `70` |
| `sending`, `signedInAt`, a pass chain per instance, `rechecks {ms, armed, unanswered}` | sign-in resume | `server/host/sign-in-resume.ts:77-81` |
| Grok answer cache, keyed by `[cli, authFile]`, stamp `mtimeMs:size`, fresh 5 min | `grokLoginCheck` | `server/drivers/acp/grok-sign-in.ts:36-62` |
| Copilot answer cache, keyed by CLI, home, `GH_HOST` and a SHA-256 of the token values | `rememberSignIn` | `server/drivers/acp/copilot.ts:95-115` |
| `runtimeProcesses`, `launched`, `nativeSignIn` (cache), `loginProcesses`, `nativeSigningOut` | the Antigravity driver module, shared by every instance | `server/drivers/antigravity.ts:132-157` |
| Native answer cache entry `{state, at, generation, runtime}` | `NativeSignInCache` | `server/drivers/antigravity-native-status.ts:120-188` |
| Refusal note: the token file stamp at the last refusal | pinned Antigravity | `server/drivers/antigravity-acp.ts:236-249` |
| Pinned flow `{id, completed, pending {redirectUri, state}, expiresAt, callbackSent}` and the `ended` status | `AntigravityAuthController` | `server/drivers/antigravity-auth.ts:46-64` |
| Native flow `{id, child, state, expiresAt, submitted, exited, settled, timer}` | `AntigravityCliLogin` | `server/drivers/antigravity-native-login.ts:85-96` |
| Email cache `Map<tokenPath, {fingerprint, expires, result}>`, at most 128 entries | `antigravityAccount` | `server/drivers/antigravity-account.ts:5`, `26` |
| `--version` result of a custom native CLI, keyed by `size:mtime`, at most 32 entries | `nativeCliVersion` | `server/drivers/antigravity-runtime.ts:202-217` |
| A passed browser helper check | the pinned Antigravity form, for the process | `server/drivers/antigravity-acp.ts:124-152` |

The Antigravity refusal note is in memory only. After a restart, a pinned account whose token Google refused reads "signed in" again until the next refusal (`server/drivers/antigravity-acp.ts:236-249`).

### 4.4 Providers, keys, the gateway, the default model and the UI mode

#### Types

`ProviderKeyKind` has 11 values: `anthropic`, `openai`, `openrouter`, `openaiCompat`, `xai`, `mistral`, `cerebras`, `groq`, `greenference`, `modelgo`, `meta` (`server/provider-key-check.ts:4`, `server/provider-key-check.ts:11`).

The key-check verdict (`server/provider-key-check.ts:6-9`):

```
{ ok: true,  check: "authentication" | "models", models: string[], freeTier?: boolean }
{ ok: false, reason: "rejected" | "unreachable" | "unexpected", status?: number }
```

The engine-check result is `{ok:true}`, `{ok:false, reason?}` or `{ok:null}` (untestable) (`server/engine-check.ts:10`).

Test states are `"testing" | "passed" | "failed" | "untestable"`. A test reason is one word of a fixed list of 13, never the provider's text (`shared/ai-ranking.ts:12-19`).

`SelectableInstance` is `{instanceId, driverKind, snapshot, models, capabilities?{effortLevels, modelVariants}, access?, enabled?}` (`server/default-model-selection.ts:5-13`). The selection context has `company(instanceId)`, `refusal(instance)` and `answered(instance)` (`server/default-model-selection.ts:15-20`). `answered` is true, false or undefined (`server/tested-ai.ts:146-151`).

`OpenAICompatConfig` is `{tools?, url, apiKeyEnv, catalog? "openai"|"lmstudio"|"ollama", key?, model?, provider?, managedModels?, reasoningEfforts?, replyWaitMinutes? 1-60}` (`server/drivers/openai-compat.ts:94-113`). The default `url` is `https://openrouter.ai/api/v1` and the default `apiKeyEnv` is `OPENAI_COMPAT_API_KEY` (`server/drivers/openai-compat.ts:57`, `server/drivers/openai-compat.ts:172-176`).

The preset type `ProviderPreset` (not used at run time, see 3.15) is `{id, catalogId?, label, recommended?, api, npm?, env?, doc?, anthropic?{baseUrl, auth?, doc?}, codex?, keyCheck?, publicModels?, chat?, checkedAt}` (`server/model-catalog/presets.ts:24-45`).

#### JSON shapes in config.json

An instance entry (one engine), in a map keyed by instance id (`server/config.ts:237-251`):

| Field | Type |
|---|---|
| `driver` | string, required |
| `displayName`, `accentColor`, `icon` | string (icon is a preset or a custom data URL) |
| `environment` | string map |
| `enabled`, `hidden` | boolean |
| `access` | `"subscription"` or `"custom"` or `"api"` |
| `config` | free JSON |

An example of a built-in API instance: `openai` is `{driver:"openai-compat", displayName:"OpenAI", access:"api", config:{url:"https://api.openai.com/v1", apiKeyEnv:"OMB_OPENAI_API_KEY", catalog:"openai"}}` (`server/instance-fleets.ts:10-13`). `claudeApi` has `config:{requireApiKey:true}` (`server/instance-fleets.ts:14-17`).

Provider key sections at the top level (`server/config.ts:304-316`, `server/config.ts:341-350`):

| Section | Fields | Note in the code |
|---|---|---|
| `anthropic` | `key`, `url`, `everyClaudeBot` | "Anthropic API key for Claude Code billed per token; url is for a proxy or test double. Never a login OAuth token". `everyClaudeBot` unset means true (`server/config.ts:443-444`). |
| `openai` | `key` | "for the openai instance only; Codex keeps its own login" |
| `openrouter` | `key` | "for the openrouter instance only" |
| `openaiCompat` | `key`, `url`, `model`, `provider` | "model seeds the default selection; provider pins an OpenRouter upstream (e.g. fireworks)" |
| `xai`, `groq`, `meta` | `key`, `url` | |
| `mistral`, `cerebras`, `greenference`, `modelgo`, `deepseek` | `key` | |
| `opencodeGo` | `apiKey`, `providerKeys` | "both write-only and only for its child" |

`opencodeGo.providerKeys` holds up to 20 keys (`OPENCODE_PROVIDER_KEY_LIMIT`). A name must match `^[A-Z][A-Z0-9_]{0,59}_(API_KEY|KEY|TOKEN)$`. A value is printable ASCII of 1 to 4096 characters. An empty string removes a key (`server/config.ts:820-864`).

The default model (`server/config.ts:252-258`):

```
defaultModelSelection: { instanceId: string(1-200), model: string(1-500), effort?, variant? }   // not both effort and variant
automaticRecovery:     { enabled, backup? }                                                       // backup required when enabled
newBots:               { effort? }                                                                // effort for a new bot whose selection names none
```

Saving `defaultModelSelection` also sets `newBotDefaults.profile.modelSelection`, and the reverse. The two stay in step (`server/config.ts:913-930`).

A gateway endpoint stores its discovered list in the instance: `config.endpoint.models` (Codex) or `config.endpointModels` (Claude) (`server/agent-endpoint-models.ts:54`, `server/agent-endpoint-models.ts:101`). Its address is `config.endpoint.url` (Codex) or `environment.ANTHROPIC_BASE_URL` (Claude). A fixed model is `config.endpoint.model` (Codex) or `environment.ANTHROPIC_MODEL` (Claude) (`server/agent-endpoint-models.ts:12-27`).

#### Environment variables

The server reads credentials from its environment first (`server/config.ts:715-753`):

| Env name | Section |
|---|---|
| `OMB_ANTHROPIC_API_KEY`, `OMB_ANTHROPIC_API_URL` | `anthropic` (never `ANTHROPIC_API_KEY`, `server/config.ts:721-724`) |
| `OMB_OPENAI_API_KEY` | `openai` |
| `OMB_OPENROUTER_API_KEY` | `openrouter` |
| `OPENAI_COMPAT_API_KEY`, `_URL`, `_MODEL`, `_PROVIDER` | `openaiCompat` |
| `XAI_API_KEY` | `xai` |
| `MISTRAL_API_KEY`, `CEREBRAS_API_KEY` | `mistral`, `cerebras` |
| `OMB_GROQ_API_KEY`, `OMB_META_API_KEY`, `OMB_DEEPSEEK_API_KEY`, `OMB_GREENFERENCE_API_KEY`, `OMB_MODELGO_API_KEY` | the sections with the same name |
| `OPENCODE_API_KEY` | `opencodeGo.apiKey` |

After a save, `syncCredentialEnv` sets or deletes the same names in the server process (`server/config.ts:771-815`).

#### Files on disk

| File | Mode | Who writes it | Failed read |
|---|---|---|---|
| `DATA_DIR/config.json` (`~/.openmausbot/config.json`) | 0o600, atomic write, backup of the old text first (`server/config.ts:989-990`) | `saveConfig` (`server/config.ts:875-999`) | `loadConfig` warns once "config: ignoring <path> and using defaults: <reason>" and reports JSON errors only as "invalid JSON" (`server/config.ts:700-714`). `saveConfig` throws `configSaveRefusal` and writes nothing when the file is unreadable or invalid (`server/config.ts:884-885`). A failed backup throws `configBackupRefusal` (`server/config.ts:989`). |
| `DATA_DIR/providers/ai-checks.json` | 0o600, `writeFileAtomic` (`server/tested-ai.ts:129-137`) | tested-AI results (`server/index.ts:2727`) | Unreadable or bad JSON gives empty results with no rename. Entries older than 24 h or malformed are dropped. The next save writes over it. This file holds cache data only (`server/tested-ai.ts:86-101`). A failed write only warns (`server/tested-ai.ts:134-136`). |
| `DATA_DIR/bots.json` | not in the report | `store.applyModelDefault` fills an empty bot selection (`server/onboarding-model-default.e2e.test.ts:30-32`, `server/onboarding-model-default.e2e.test.ts:46`) | not in the report |
| `DATA_DIR/providers/model-providers/models-dev.json` | default mode, `writeFileAtomic` (`server/model-catalog/catalog.ts:256-259`) | the catalog module (not used at run time) | An unreadable or wrong-format cache is deleted and logged (`server/model-catalog/catalog.ts:168-181`). |
| `DATA_DIR/providers/<instanceId>` | not in the report | a Claude custom endpoint's own config folder (`server/model-providers-docs.test.ts:104-123`) | not in the report |

`ai-checks.json` has this shape (`server/tested-ai.ts:75-78`):

```
{
  results: { <instanceId>: { key, state: "passed"|"failed"|"untestable", misses, at, error?, reason?, retryAt? } },
  follower?: { botId, selection }
}
```

The result `key` is `aiSignInKey(snapshot)|identity` (`server/tested-ai.ts:127`). `aiSignInKey` is the JSON of state, authenticated, account email, org, method, `chatgptPlan` and `freeFallback` (`shared/ai-ranking.ts:59-65`). `identity` is the first 16 hex characters of the sha256 of `[driver, config, environment]` of the engine entry (`server/tested-ai.ts:68-73`).

#### State kept in memory only

| State | Where | Line |
|---|---|---|
| Rejected-key marks `"<base url> <first 32 hex of sha256(key)>"`. The key itself is never kept. | `server/key-rejections.ts` | `server/key-rejections.ts:1`, `server/key-rejections.ts:6-10` |
| OpenRouter free-tier answers, by key SHA-256, at most 32 keys | `server/drivers/openrouter-free.ts` | `server/drivers/openrouter-free.ts:25-27`, `server/drivers/openrouter-free.ts:77-93` |
| `bootSelection`, the computed default for new bots | `server/index.ts` | `server/index.ts:2725`, `server/index.ts:2731-2733` |
| One running test check per engine (`running` map) | `server/engine-check.ts` | `server/engine-check.ts:30` |
| `providerConfigBusy`, the lock of provider settings | `server/routes/config.ts` | `server/routes/config.ts:216`, `server/routes/config.ts:736` |
| Saved keys copied into the server's own process environment | `server/config.ts` | `server/config.ts:771-815` |

#### UI mode keys in the browser (localStorage)

| Key | Values | Line |
|---|---|---|
| `omb-advanced-mode` | `"1"` Advanced, `"0"` Simple | `src/lib/interface-mode.ts:7` |
| `omb-simple-mode-prompt` | `"1"` when the prompt was closed | `src/lib/simple-mode-prompt.ts:3-28` |
| `omb-new-look` | `"due"`, `"seen"`, `"none"` | `src/lib/new-look.ts:11-13` |
| `omb-advanced-back` | `"due"` for the one-time "Advanced is back" notice | `src/lib/new-look.ts:20-21` |
| `omb-skin`, `omb-installed`, `omb-email-gate`, `omb-drafts`, `omb-show-threads` | any value means a prior run | `src/lib/prior-run.ts:1-10` |

When storage fails, an in-memory `sessionChoice` holds the mode for the session (`src/lib/interface-mode.ts:9`, `src/lib/interface-mode.ts:67`).

### 4.5 The client types and the client state

The client keeps no engine data on disk. It reads the engine list from `GET /api/instances` and holds it in memory. This section gives the shapes that the client reads and the small state that it keeps itself.

#### 4.5.1 `InstanceInfo`: one engine as the client sees it

`InstanceInfo` is the JSON shape of one entry of `/api/instances` (`src/state/store.tsx:415-466`). The reducer replaces the whole list on each `instances` action (`src/state/store.tsx:1019-1020`).

| Field | Type | Meaning | Source |
|---|---|---|---|
| `instanceId`, `driverKind`, `displayName` | string | identity and the name that the person sees | `src/state/store.tsx:416-418` |
| `icon?` | `ProviderIcon` | a preset or a custom image (see 4.5.4) | `src/state/store.tsx:419` |
| `serverKind?` | `"ollama"` | a local Ollama server | `src/state/store.tsx:419` |
| `readOnly?` | boolean | an engine that an organization manages. The UI shows text only | `src/state/store.tsx:420` |
| `trialCredit?` | `"active" \| "used_up" \| "ended"` | trial credit of the Cloud | `src/state/store.tsx:421` |
| `managed?` | `{ organizationId, organizationName }` | organization data | `src/state/store.tsx:422` |
| `policy?` | `{ organizationName, reason, team? }` | the policy note | `src/state/store.tsx:423` |
| `snapshot` | object | the last status check (next table) | `src/state/store.tsx:424-437` |
| `aiTest?`, `aiTestError?`, `aiTestReason?` | | "What one tiny test message through this AI showed, for its current sign-in" | `src/state/store.tsx:438-441` |
| `models` | `{ default, options[] }` | the model list | `src/state/store.tsx:442` |
| `capabilities?` | flags | driver capability flags | `src/state/store.tsx:443-457` |
| `access?` | `"subscription" \| "custom" \| "api"` | how the engine reaches a model | `src/state/store.tsx:458` |
| `authentication?` | `{ method, signOut? }` | `method` is `"device-code" \| "paste-code" \| "browser" \| "browser-pkce" \| "callback-url"`. `signOut` allows the Sign out action | `src/state/store.tsx:459` |
| `install?` | `EngineInstall` | how to install the engine (4.5.2) | `src/state/store.tsx:460` |
| `cli?`, `cliDefault?`, `cliCandidates?` | string, string, string[] | the CLI path that the person set, the default name, and the candidates | `src/state/store.tsx:461-463` |
| `claudeAccount?` | `{ configDir, signInCommand, signInShell: "powershell" \| "sh", isDefault }` | the config folder and sign-in command of one Claude account | `src/state/store.tsx:464` |
| `freeUpSpace?`, `replyWaitMinutes?`, `modelsUnconfirmed?`, `autoUpdated? { version, at }` | | other status | `src/state/store.tsx:465` |
| `modelsUnreadable?` | `"signedOut" \| "timedOut" \| "failed"` | why the model list could not be read | `src/state/store.tsx:465` |

The fields of `snapshot` (`src/state/store.tsx:424-437`):

| Field | Type | Meaning (doc comment where the code has one) |
|---|---|---|
| `state` | `"available" \| "unavailable"` | found or not found |
| `reason?` | string | why it is unavailable |
| `authenticated?` | boolean | `true`, `false`, or absent for "not known" (see 3.19.2) |
| `busy?` | `true` | "Its status check could not finish (a busy machine): not a sign that it is missing." |
| `unverified?` | `true` | "Installed, not yet confirmed." |
| `notEngineCli?` | `true` | "The CLI path runs another program, not this engine's CLI." |
| `nativeCli?`, `installing?`, `chatgptPlan?` | boolean | runtime kind, a server install in progress, a ChatGPT plan sign-in |
| `freeFallback?` | | "Ready only through OpenCode's free no-login models: a backup, never 'an AI already works'" |
| `authenticationUnavailableReason?` | string | this server cannot run the sign-in of this engine |
| `account?` | `{ email?, organization?, method?: "login" \| "api-key" }` | the signed-in account |
| `version?` | `string \| null` | CLI version output |
| `update?` | `{ title, message, command?, serverInstall?: false }` | an update notice from the server |
| `billing?` | `"metered" \| "subscription"` | how the engine is paid |
| `warning?` | `{ title, message }` | a standing warning from the server |
| `ollama?` | object | Ollama status |

Edge cases of the data:

- The client shows a version only when a regex `/\d+\.\d+(?:\.\d+)?(?:[-+][\w.-]+)?/` finds one, because "Some CLIs return their executable name rather than a version." (`src/components/EngineLibrary.tsx:45-46`).
- A hidden engine is not in `/api/instances`. The client reads it from `GET /api/instances/hidden` as `HiddenProvider { instanceId, driverKind?, displayName }` (`src/components/HiddenProviders.tsx:10-27`). An older server has no such route, so the client takes an empty list.
- The browser receives the `configDir` and `signInCommand` of each Claude account (`src/state/store.tsx:464`). The fixture command is `CLAUDE_CONFIG_DIR=/profiles/{id} claude auth login` (`src/components/EnginesSettings.test.ts:414`).

#### 4.5.2 The install state

`EngineInstall` is the server's description of how to install one engine (`src/state/engine-install.ts:4-15`).

| Field | Type | Meaning |
|---|---|---|
| `platform?` | `"darwin" \| "win32" \| "linux"` | the platform of the server |
| `command?` | per platform | the install command |
| `docsUrl?` | string | the set-up guide |
| `signInCommand?` | string | a terminal sign-in command |
| `needsNode?` | boolean | the command needs Node.js and npm |
| `managed?` | `{ label, downloadBytes, sizeUnknown? }` | the app downloads and manages the engine |
| `server?` | `{ package?, standalone? { version, downloadBytes } }` | the server can install the engine |
| `settings?` | `"connections"` | set-up happens in the key settings |
| `appCopy?` | boolean | the CLI runs the copy that the app installed. The person's terminal does not reach it (`src/state/engine-install.ts:13-14`) |

`installCommandFor` picks the command for `install.platform`. If that is absent, it uses this computer's platform from `window.ogb.platform` or the user agent (`src/state/engine-install.ts:19-31`). A test checks that the server's platform wins (`src/components/EngineSetup.test.ts:11-15`).

Install progress is not a type. It is the server flag `snapshot.installing` plus the local busy state of a button (`src/components/EngineSetup.tsx:438-439`).

#### 4.5.3 The sign-in status (`DeviceSignInStatus`)

The server returns this object under `auth` from `/auth/start` and `/auth/status` (`src/components/DeviceSignIn.tsx:12-19`).

| Field | Type |
|---|---|
| `phase` | `"waiting" \| "succeeded" \| "failed" \| "expired" \| "cancelled"` |
| `flowId` | `string \| null` |
| `authorizationUrl` | `string \| null` |
| `userCode?` | string |
| `expiresAt` | `string \| null` |
| `message?` | string |

The Google flow also uses the phase `verifying` and a field `kind` (`"pasted-code"` or a redirect paste) (`src/components/EngineSetup.tsx:326`, `src/components/EngineSetup.tsx:481-530`).

The client shows a link only when it passes a fixed rule:

| Flow | Rule | Source |
|---|---|---|
| Claude paste code | `https:` only, no user or password, host is or ends with `claude.com`, `claude.ai`, `console.anthropic.com` or `platform.claude.com` | `src/components/ClaudeSignIn.tsx:9-25` |
| ChatGPT plan | origin `https://auth.openai.com`, path `/api/accounts/authorize`, no user, password or hash | `src/components/DeviceSignIn.tsx:91-98` |
| codex device code | page exactly `https://auth.openai.com/codex/device`, code `^[A-Z0-9]{4,8}-[A-Z0-9]{4,8}$` | `shared/device-sign-in.ts:28-31` |
| grok | hosts `x.ai` or `grok.com`, only `user_code` in the query | `shared/device-sign-in.ts:32-40` |
| kimi | hosts `kimi.com` or `kimi.ai`, written against kimi-code 2.4.1 output | `shared/device-sign-in.ts:41-56` |
| cursor | host `cursor.com`, path `/loginDeepControl`, fixed query keys, no code, written against cursor-agent 2026.10.22 output | `shared/device-sign-in.ts:57-71` |

#### 4.5.4 Provider icon

`ProviderIcon` is `{ kind: "preset"; preset }` or `{ kind: "custom"; dataUrl }` (`shared/provider-icon.ts:8-10`).

| Limit | Value | Source |
|---|---|---|
| `PROVIDER_ICON_MAX_BYTES` | 128 * 1024 | `shared/provider-icon.ts:12` |
| `PROVIDER_ICON_MAX_DIMENSION` | 1024 | `shared/provider-icon.ts:13` |
| Types | PNG, JPEG, WebP, checked by magic bytes | `shared/provider-icon.ts:14`, `shared/provider-icon.ts:38-77` |

A custom icon is a local data URL, never a remote URL (`shared/provider-icon.ts:79-80`).

#### 4.5.5 State in memory only

| State | Where | Lifetime | Source |
|---|---|---|---|
| Engine list `state.instances` | client store | until the next `instances` action | `src/state/store.tsx:1019-1020` |
| In-flight list requests, one per path | `instanceProbes` map | until the request ends | `src/state/store.tsx:3202-3212` |
| Time of the last focus refresh | `lastFocusProbe` ref | page load | `src/state/store.tsx:3221-3236` |
| Engines that switched to the app's own copy | module-level `Set` with listeners | until Dismiss, or until Settings unmounts (`forgetAppCopySwitches`) | `src/state/engine-install.ts:33-68`, `src/components/EnginesSettings.tsx:581` |
| Engines seen working in this page load (`workedEarlier`) | module-level set | cleared when the live connection drops | `src/lib/onboarding.ts:254-276` |
| Accounts that sign in now | `AccountsCard` state. Antigravity allows several at once. Claude and ChatGPT allow one | until done, or until the account leaves the list | `src/components/EngineAccounts.tsx:367-376` |
| A sign-in flow and its pasted code | component state | until done, cancel or unmount | `src/components/ClaudeSignIn.tsx:40-43` |

#### 4.5.6 Browser storage

The client writes two small keys to `localStorage`. Neither key holds sign-in data.

| Key | Value | Who writes it | Failed read | Source |
|---|---|---|---|---|
| `omb:chatgpt-plan-welcome:{instanceId}` | `"1"` after the person closes the welcome dialog | `ChatGptPlanStatus` | a read that throws counts as "not seen", so the dialog shows again. Settings passes `welcome={false}` and never reads the key | `src/components/ChatGptPlanStatus.tsx:18-33`, `src/components/EngineAccounts.tsx:286` |
| `omb-settings-grouped-note` | state of a one-time note that shows for 30 days (`GROUPED_DAYS`) | `PlacePages` | not about engines | `src/components/settings/pages/PlacePages.tsx:45-67` |

The doc comment of the first key says: "Security: this marker only dismisses a welcome message; no sign-in data lives in the renderer." (`src/components/ChatGptPlanStatus.tsx:15-16`).

## 5. The UI

### 5.1 The live check line and the "no engines" rule

No UI shows doctor results. The only `doctor` text in `src/` is in test strings that quote `pnpm control:omb doctor` (`src/components/RunLog.test.ts:19-23`, `src/lib/drafts.test.ts:380-400`). The Settings cards for engines and the sign-in screens are covered by another writer.

#### The live check line (`src/components/EngineLiveCheck.tsx`)

The "live check" sends one small real message to an engine right after the person connects it.

1. `useEngineLiveCheck(engines)` keeps the `engineReady` value of each engine (`src/components/EngineLiveCheck.tsx:15-37`).
2. At the first render it only records the values. An engine that is ready at the first render gets no check (`src/components/EngineLiveCheck.tsx:13-14`, `src/components/EngineLiveCheck.tsx:33`).
3. When an engine changes from not ready to ready, the hook POSTs `/api/instances/<id>/check` with the body `{}` and a client timeout of 120 s (`src/components/EngineLiveCheck.tsx:22`).
4. An answer `ok:true` gives the state `working`. An answer `ok:false` gives `failed` with the error. An answer `ok:null` removes the line (`src/components/EngineLiveCheck.tsx:27`).
5. A request error gives `failed` with the error message.

`engineReady` (`src/components/EngineLibrary.tsx:12-20`):

- false when `snapshot.unverified` is true.
- for Cline: `authenticated === true` (a check by driver name).
- for the others: `state === "available"` and (custom access or `authenticated !== false`).

`EngineCheckLine` (`src/components/EngineLiveCheck.tsx:39-55`) shows one of three states. The English text is in `src/locales/en.json:1839-1842`.

| State | Look | Exact text |
|---|---|---|
| Busy (`checking`) | Spinner, `role="status"`, small secondary text | "Sending {name} a short test message…" |
| Success (`working`) | Check mark, `role="status"`, green medium text | "{name} is working" |
| Error (`failed`) | `role="alert"`, rounded warning box with a warning icon | "{name} is connected but didn't answer a test message." then the server error text |
| Error button | Button with a refresh icon | "Test again" |

The server error texts that can follow the error line come from the live check (`server/engine-check.ts:17-23`, `server/engine-check.ts:53`):

- "<name> isn't signed in on this computer anymore. Sign in again, then check again."
- "<name> answered with nothing. Check again in a minute."
- "<name> couldn't answer: <text>"
- "<name> didn't answer. Check again in a minute."
- The timeout text of the key `serverError.engineCheck.timeout`. In a test with a 5 s limit it reads "<name> didn't answer within 5 seconds." (`server/engine-check.test.ts:46-67`).

The callers are `src/components/CloudEngineSignIn.tsx:49`, `src/components/CloudEngineSignIn.tsx:103` and `src/components/cloud-welcome/WelcomeSteps.tsx:54`. Another writer covers these screens.

#### The "no engines" counting rule

The app shows its "no AI connected" setup page by this rule: there is at least one row, no row is `available`, and no row is `busy` (`server/harness/registry-probe-hold.test.ts:24-25`, which copies `noEnginesDue` from `src/lib/onboarding.ts`).

1. A check that could not finish sets `busy: true`, so it never shows the setup page (`server/contracts.ts:411-413`).
2. With no conversation and every engine unavailable, the setup page shows with the text "Check again" (`src/App.engine-status.test.ts:47-63`).
3. An engine that worked earlier on this page and is now unavailable with `busy: true` does not show the setup page again. An answer such as "`claude` CLI not found" shows it again (`src/App.engine-status.test.ts:65-85`).
4. A saved conversation stays visible while its engine is unavailable, and the model selection of the bot does not change (`src/App.engine-status.test.ts:21-45`).
5. An engine that is only "available, unverified" counts as available for this rule, but it is never chosen to run a turn (`server/harness/registry-probe-hold.test.ts:80-85`, `server/harness/registry-probe-hold.test.ts:220-226`).

### 5.2 Account sign-in and sign-out in Settings → Engines (from the verification documents)

The report did not read the UI components (`ClaudeSignIn`, `ChatGptPlanSignIn`, `DeviceSignIn`). Sections 5.4 and 5.5 cover them. The facts below come only from the manual verification documents.

**Claude account sign-out** (`docs/verification/claude-account.md:12-25`):

| State | What the person sees |
|---|---|
| Signed in | The row shows the email, for example `ada@example.test`. The row has a **⋯** menu with **Sign out** |
| Confirm | A confirmation. It says that running tasks are not cancelled. Cancel keeps the identity |
| Busy | The **⋯** button shows a spinner and is disabled |
| Error | An error shows below the **⋯** button. The account stays connected. The menu allows a retry |
| Done | The email goes. The row reads **Not signed in** and offers one **Sign in** button. A reload keeps this state |

**Codex sign-out** (`docs/verification/codex-account.md:17-22`, `docs/verification/codex-account.md:47-51`):

| State | What the person sees |
|---|---|
| Error | The error is visible. The account stays connected. The button becomes usable again |
| Done | The returned snapshot replaces the account controls with **Connect ChatGPT** at once, with no second catalog request. A reload keeps the signed-out state |

Sign-out does not cancel running tasks. The identity comes from `account/read` with `refreshToken:false`, never from a decode of a credential file.

**ChatGPT plan** (`docs/verification/chatgpt-plan.md:3-8`). The **ChatGPT plan** account in Settings → Engines is separate from the legacy Codex login and from company models. The person chooses **Continue with ChatGPT**, approves plan use, then selects a model from the refreshed list of that account. This does not move existing bots or change their billing. Another identity needs another named ChatGPT account. A sign-out keeps the registration.

### 5.3 Sign-in UI: device code and Antigravity accounts

The engine library is in 5.4 and the settings pages are in 5.5. This part covers the device code sign-in widget, the first-screen sign-in pill, and the Antigravity parts of the sign-in card and the accounts card.

#### Which widget shows

`EngineSetup` picks the widget by `instance.authentication.method` (`src/components/EngineSetup.tsx:687-690`, `777-790`):

| Method | Widget |
|---|---|
| `device-code` | `DeviceSignIn` |
| `browser-pkce` (ChatGPT plan) | `DeviceSignIn` in PKCE mode |
| `browser` (the engine opens the browser) | `EngineBrowserSignIn` |
| `paste-code` (Claude) | `ClaudeSignIn` |

The app tests "signed out" only by `snapshot.state === "available" && snapshot.authenticated === false` (`src/components/EngineSetup.tsx:23-25`). The provider text comes from the driver name: `grokAgent` is grok, `kimiAgent` is kimi, `cursorAgent` is cursor, and all others are codex (`src/components/DeviceSignIn.tsx:21-28`). For a device code engine other than Codex, with a sign-in command and a server terminal, a closed section shows the terminal command (`src/components/EngineSetup.tsx:782-787`).

#### DeviceSignIn

The component is in `src/components/DeviceSignIn.tsx`. Its English text is in `src/locales/en.json` lines 6337-6392.

Layout while the phase is `waiting` (`src/components/DeviceSignIn.tsx:121-150`), with the Codex text:

1. "Enter this one-time code on OpenAI's sign-in page:"
2. The code in large monospace text, with a copy button "Copy sign-in code".
3. A link button "Open ChatGPT sign-in". The desktop shell opens it when the app runs in one. The app never opens the page by itself for a device code (`src/components/GrokSignIn.interaction.test.ts:54-72`).
4. A spinner and "Waiting for you to finish signing in…".
5. "Code expires at {time}" (hour and minute).
6. The security note "Only enter a code you requested here. This signs Codex in for your bots and uses your account's limits. ...".
7. Codex only: "Device-code login may need enabling in ChatGPT security settings or by your ChatGPT admin." (`src/components/DeviceSignIn.tsx:268`). At `e1cc6a290` (commit `94a1a6d1f`, v0.1.186), the step that turns on device code sign-in in ChatGPT is step 1, above the code, while the flow waits. It stays under a flow that ended without success (`engineSetup.device.enableNote`, `src/components/DeviceSignIn.tsx:145-149`, `:294-296`; `src/locales/en.json:6391`).

Cursor has no code. Its "enter code" text is the "open" text (`src/components/DeviceSignIn.tsx:67-68`).

Before it shows the link, the app checks it again with `deviceSignInLink` (`src/components/DeviceSignIn.tsx:86-98`, `105`). A bad link or code shows the alert "Codex did not return a valid OpenAI sign-in link and code. Cancel and try again." (`src/components/DeviceSignIn.tsx:116-119`).

States after `waiting` (`src/components/DeviceSignIn.tsx:108-114`):

| State | Text |
|---|---|
| succeeded | "ChatGPT connected. Your models are being refreshed." |
| cancelled | "Sign-in cancelled. You can request a new code when ready." |
| expired | "This code expired. Request a new code to try again." At `e1cc6a290` also a `failed` status with `reason: "expired"` (`src/components/DeviceSignIn.tsx:133`, commit `1c82a0f0c`) |
| failed | the server's `message`, else "Sign-in could not be completed. Try again, or check the Codex installation." |
| interrupted (at `e1cc6a290`: a reason `interrupted`, or HTTP 404 or 410) | "This sign-in was interrupted. Start again." with "Try again" (`src/components/DeviceSignIn.tsx:134`; `src/locales/en.json:6402`) |
| flow gone (HTTP 401, 403, 404, 410; at `e1cc6a290` 401 and 403 only) | "This sign-in session is no longer available. Check that this browser is still paired with Full access, then request a new code." (`src/components/DeviceSignIn.tsx:78-84`) |

Buttons and busy states (`src/components/DeviceSignIn.tsx:213-260`):

- The start button sends `POST {base}/start`. While busy it reads "Getting your sign-in code…". After an outcome it reads "Try again". For Grok the first label is "Sign in to Grok" (`src/components/GrokSignIn.interaction.test.ts:54-72`).
- The cancel button reads "Cancel sign-in", and "Cancelling…" while busy. It sends `POST {base}/cancel {flowId}`, then shows `cancelled`.
- A failed start shows the server's sentence in one alert and one "Try again" button (`src/components/GrokSignIn.interaction.test.ts:89-102`).

The poll (`src/components/DeviceSignIn.tsx:180-211`):

1. While `waiting` with a flow id and not busy, one timer of 2000 ms calls `GET {base}/status?flowId=...`. Each new state arms it again.
2. A client timer at `expiresAt` stops the poll and shows `expired`, also with no answer from the server.
3. A poll error with 401, 403, 404 or 410 ends the flow. Another error shows its message and keeps the status, so the poll continues.
4. On `succeeded` the app tracks `engineSignedIn`, then refreshes the instances and the models. It ignores their errors, because "a failed catalog refresh must not read as a failed sign-in" (`src/components/DeviceSignIn.tsx:172-178`).

The component keeps the flow in React state only. After a page reload, the person presses start again, and the server gives back the same live flow to the same owner (`server/provider-auth-sessions.ts:34-66`, `server/drivers/device-auth.ts:118-119`).

#### The first-screen sign-in pill

`SignInPill` is the sign-in on the first screen (`src/components/onboarding/SignInPill.tsx`).

- Width 288 px. Busy or waiting: a spinner and a "waiting" text that opens the link again on a click. A paste field with a submit arrow. A code with a copy button. Else one button: "Set up", "Install", "Sign in" or "Connect" (`src/components/onboarding/SignInPill.tsx:165-238`).
- A `callback-url` engine (Antigravity) goes to the dialog, because the pill has no room to paste a redirect address (`src/components/onboarding/SignInPill.tsx:33-38`).
- For a device code the pill opens the link by itself, unlike `DeviceSignIn` (`src/components/onboarding/SignInPill.tsx:96-99`).
- The poll starts after 2 s and repeats every 2 s, with a 10 s limit for each request. A 4xx answer fails at once with the server's words. A 5xx, a timeout or a lost connection is a stall: the delay doubles (2 s, 4 s, 8 s, up to 30 s). After 3 stalls the pill shows "Lost touch with the server during sign-in. Check the connection and start again." (`src/components/onboarding/SignInPill.tsx:17-20`, `117-158`).
- The pill has no cancel button. When it closes, the poll stops but the server flow continues until its expiry (`src/components/onboarding/SignInPill.tsx:153-157`).

#### The Antigravity sign-in card

The tests of `EngineSetup` give the Antigravity card. The card component code was not read.

Pinned form (`callback-url`) (`src/components/EngineSetup.antigravity.test.ts:57-111`):

1. The button reads "Sign in with Google".
2. While waiting, the redirect paste field `[data-redirect-paste] input` shows the whole time, with an aria-label. There is no code field. A button "I finished signing in" shows.
3. "Open Google sign-in again" opens the same link and does not start a new sign-in.
4. On a Cloud home the hint is "After you sign in, Google opens a page that won’t load. Copy its address and paste it below." and the field label is "Google’s page didn’t load? Paste its address here". Elsewhere the section is "Signing in from another computer?".
5. The paste placeholder is "Code, or https://antigravity.google/oauth-callback?…" (`src/locales/en.json:3847`).
6. The start text is "Starting Antigravity can take up to 90 seconds. Your browser will open when it’s ready." (`src/locales/en.json:3836`).

Native form (`pasted-code`) (`src/components/EngineSetup.antigravity.test.ts:150-173`):

1. No redirect field, no "I finished signing in", no "won’t load" text.
2. The code field `[data-code-paste]` says "paste the code it shows, or the full address of the page you end on", with the aria-label "Sign-in code or page address".
3. "Send code" is disabled while the field is empty. It sends `auth/complete {flowId, callbackUrl: <pasted>}`, then refreshes the models.

States of both forms (`src/components/EngineSetup.antigravity.test.ts:78-94`):

| State | What shows |
|---|---|
| expired | "Google sign-in expired. Start again." (the app's own text). The paste field closes and the button reads "Sign in with Google" again |
| failed | the server's fixed reason |
| succeeded | the models refresh and the field closes |

The card says "has its own Google account" on both forms, never "keeps one sign-in" (`src/components/EngineSetup.antigravity.test.ts:121-131`). The install button reads "Install Google Antigravity CLI" for no path, `agy` and `antigravity`, and "Install Classic runtime" for `agy_acp_server` (`src/components/EngineSetup.antigravity.test.ts:133-147`).

#### The Antigravity accounts card

One card "Google Gemini (Antigravity)" lists every account as a row (`src/components/EnginesSettings.antigravity.dom.test.ts:105-120`, `src/locales/en.json:4935`).

Each row (`src/components/EnginesSettings.tsx:404-437`):

- The switch to the native CLI, when offered (below).
- On Windows, a free-up-space notice.
- The email, or "Signed in with Google" (`src/locales/en.json:6341`), when signed in.
- "Sign out" only when `authenticated === true` and the engine offers sign-out.
- "Remove" only for ids that start with `antigravity-`. The first account has no "Remove".
- An account whose status could not be read has `data-account-state="unknown"` and offers "Sign in", not install (`src/components/EnginesSettings.antigravity.dom.test.ts:382-389`).

Add an account (`src/components/EnginesSettings.antigravity.dom.test.ts:122-144`):

1. "Add Google account" (`src/locales/en.json:6340`) opens a form `form[data-add-account]` with a name field.
2. "Add and sign in" sends `POST /api/instances/antigravity-accounts`, then `POST /api/instances/<new id>/auth/start`.
3. The new row shows a sign-in panel `[data-account-sign-in]` with "Open Google sign-in again".
4. The panel closes when the row reads signed in with an email.

Sign-in panel rules (`src/components/EnginesSettings.antigravity.dom.test.ts:146-339`):

- Two accounts can each have a sign-in waiting at one time.
- "Cancel" sends `auth/cancel {flowId}` and closes the panel.
- A cancel before the start answers keeps the panel with all controls disabled. When the start answers, no Google page opens and the flow is cancelled.
- If the server refuses the cancel ("The sign-in is finishing. Try again in a moment."), the panel stays with "Open Google sign-in again" and "Cancel" usable.
- "Rename" in the "Options for <name>" menu is disabled while a sign-in runs.
- "Send redirect" sends `auth/complete` and closes the panel. While it sends, "Cancel" and "I finished signing in" do not show.
- Focus moves into the panel, and back to "Sign in" after a cancel.

Remove and sign out (`src/components/EnginesSettings.tsx:340-378`):

| Action | Dialog title | Dialog text |
|---|---|---|
| Remove | "Remove {name}?" | "This removes the account and its sign-in from {app}. Your other Antigravity accounts stay connected." |
| Sign out | "Sign out of {name}?" | "Bots that use this account need it signed in again before their next task. Running tasks are not cancelled." |

The button shows a spinner while it runs. Remove is disabled while bots use the account: "{count} bot(s) use this account. Pick another model for them first." An error shows in `role="alert"` (`src/locales/en.json:4945-4953`). The sign-out text says that running tasks are not cancelled, but the driver calls `base.adapter.stopAll()` before it removes the sign-in (`server/drivers/antigravity.ts:484`). The reports did not read `stopAll`.

#### The switch to the native CLI

`AntigravitySwitchCli` (`src/components/AntigravitySwitchCli.tsx:44-56`):

- A box with the note "Google's Antigravity CLI replaces the Classic runtime. After you switch, you sign in with Google once more." (`src/locales/en.json:3856`).
- A full-width button "Switch to Google Antigravity CLI" (`src/locales/en.json:3855`).
- Busy: a spinner and "Downloading and verifying…" (`src/locales/en.json:3831`). The button is disabled.
- Error: the message of the error in a line with `role="alert"`.

While the server installs by itself (`snapshot.installing: true`), the card shows a disabled "Downloading and verifying…" button and no install button (`src/components/EnginesSettings.antigravity-switch.dom.test.ts:140-148`). The UI has no runtime selector and no "Runs on" text (`src/components/EnginesSettings.antigravity-switch.dom.test.ts:62-77`).

The chat's AI sign-in card is visible only to an owner or an admin (`AdminOnly`, `src/components/EnginesSettings.tsx:573`).

### 5.4 The AI page of the settings

The AI page is `AiPage` (`src/components/settings/pages/PlacePages.tsx:121-152`). `SettingsPageBody` maps the page id `ai` to it (`src/components/settings/pages/SettingsPageBody.tsx:13`). All English text below comes from `src/locales/en.json`, at the line given.

#### 5.4.1 Who sees the page

- The whole page is inside `<AdminOnly>` (`src/components/settings/pages/PlacePages.tsx:131`). A person who is not an admin does not see the engine list.
- The settings index shows the page only when `adminPage` holds: not a remote client, and not a team member who is not an admin (`src/components/settings/settings-index.ts:54`, `src/components/settings/settings-index.ts:68`).
- The search words of the page include "models", "providers", "engines", "api keys", "claude", "codex", "ollama", "lm studio" and "local model" (`src/components/settings/settings-index.ts:68-69`). The list itself has no search box.
- Old anchors still work: `engines` goes to `ai#providers`, `connections` goes to `ai#ai-keys` (`src/components/settings/settings-index.ts:117-125`).
- The overview page has an "At a glance" row for AI. It shows "{count} ready" (`src/locales/en.json:11133`) with the count of engines whose `snapshot.state === "available"`, "Add a key to start" (`src/locales/en.json:11134`) when that count is 0, and "Set by an admin" (`src/locales/en.json:11132`) for a non-admin (`src/components/settings/pages/PlacePages.tsx:72`, `src/components/settings/pages/PlacePages.tsx:92-93`).

#### 5.4.2 Layout of the page

The page has these blocks, top to bottom (`src/components/settings/pages/PlacePages.tsx:132-149`):

1. Block `providers`: `<EnginesSettings simple more={...} />`. The page always passes `simple`, in Simple mode and in Advanced mode.
2. Simple mode only: a fold row "Other services" (`src/locales/en.json:11414`) with the subtitle "Keys for voices, computers, apps and helpers, beyond your main models." (`src/locales/en.json:11415`) and the count of key sections other than `ai`.
3. When open: the group `ai-keys` with `<KeysPage bare>`. The `ai` key section is left out unless the anchor is `ai-keys`.
4. Advanced mode only: the sections `backup-model`, `routing` and `images`. Other parts of the research cover them.

"Other services" is open by default in Advanced mode or when the anchor asks for keys (`src/components/settings/pages/PlacePages.tsx:125-127`). The code comment says: "Simple ends after Providers: Other services is one closed fold row, so the page fits one window." (`src/components/settings/pages/PlacePages.tsx:124`).

`EnginesSettings` also has a full layout with a title, cards and a "Hidden" section (`src/components/EnginesSettings.tsx:605-620`). The app does not mount it. The only mount is `src/components/settings/pages/PlacePages.tsx:133`, with `simple` and `more`, so `src/components/EnginesSettings.tsx:598` always returns the Simple layout. The preview script opens the old section `engines`, which resolves to `ai#providers` (`src/components/settings/settings-index.ts:124`), so it shows the Simple layout too. Only tests reach the full layout. Section 5.5.1 describes its cards.

#### 5.4.3 Which engines the page lists

`EnginesSettings` reads `s.instances` and `s.config?.managedPolicy` from the store (`src/components/EnginesSettings.tsx:579`). It lists an engine when one of these holds (`src/components/EnginesSettings.tsx:582`):

- `readOnly`
- `cli` or `cliDefault` is set
- `snapshot.state === "unavailable"`
- it is an API-key engine
- `claudeEndpoint`, `claudeBedrock` or `codexEndpoint` is set

An "account group" is a provider with several named accounts: `claude`, `chatgpt` or `antigravity` (`src/components/EngineAccounts.tsx:20`). `accountGroupOf` gives no group for `readOnly`, trial credit, `access === "custom"` or `access === "api"` (`src/components/EngineAccounts.tsx:22-29`). All accounts of one group share one card. The card takes the place of the first account in list order (`src/components/EnginesSettings.tsx:548-559`).

A "hosted workspace" is a list where every row is `readOnly` (`src/components/EnginesSettings.tsx:586`). When there is no `claude` group and the workspace is not hosted, the Claude endpoint and Bedrock sections show under the list. The same rule applies to the Codex endpoint section and the `chatgpt` group (`src/components/EnginesSettings.tsx:587-588`, `src/components/EnginesSettings.tsx:601-602`).

#### 5.4.4 The "Providers" group (`SimpleEngines`)

`SimpleEngines` builds the group (`src/components/EnginesSettings.tsx:495-538`):

1. Group label "Providers" (`src/locales/en.json:11073`) with a quiet "Check again" button (`RefreshEngines`) (`src/components/EnginesSettings.tsx:524`).
2. Featured rows: rows that are ready, or have an `authentication` method, or are a Gemini server (`src/components/EnginesSettings.tsx:510`).
3. A "Google AI Studio" row (`geminiServer.title`, `src/locales/en.json:4224`). It shows when the workspace is not hosted, no Gemini server exists, and no hidden provider is the Gemini preset (`src/components/EnginesSettings.tsx:513-514`).
4. A sponsor row is raised among the first three rows (`src/components/EnginesSettings.tsx:504`, `src/components/EnginesSettings.tsx:515-516`). The rule is in `@/lib/modelgo-offer`, which nobody read. Tests show it: it takes Cursor's place, directly above Cursor (`src/components/EnginesSettings.gemini.dom.test.ts:180-206`).
5. A fold row "More providers" (`src/locales/en.json:11409`) with the count of other rows plus hidden providers. It shows only when the count is above 0 (`src/components/EnginesSettings.tsx:517`, `src/components/EnginesSettings.tsx:528-534`). Inside: the other rows as compact rows, then the hidden providers.
6. Only one provider fold is open at a time (`src/components/EnginesSettings.tsx:507`, `src/components/EnginesSettings.tsx:518-521`).

One row (`ProviderRow`, `src/components/EnginesSettings.tsx:457-474`):

- The provider mark at 18 px in a 32 px slot.
- The name: the group title for Antigravity, else `displayName`.
- A status line with a 6 px dot. A compact row that is not ready and has no tone hides the line.
- A button: "Close" when open, "Manage" (`src/locales/en.json:7202`) when ready, else "Set up" (`src/locales/en.json:7203`).
- The fold holds the engine content (5.4.5) or the account card (5.4.6).

The status line (`simpleStatus`, `src/components/EnginesSettings.tsx:443-453`):

| Condition, in order | Dot | Text |
|---|---|---|
| ready | success | "Ready" (`src/locales/en.json:11410`), plus " · {email}" when `authenticated === true` and an e-mail exists |
| `snapshot.ollama` set | none | the short Ollama status |
| `available` and `authenticated === false` | warning | "Needs attention" (`src/locales/en.json:11412`) |
| else | none | "Not set up · Use your account or a key" (`src/locales/en.json:11411`, `src/locales/en.json:11492`) when the engine has an `authentication` method, else "Not set up · Use a key" (`src/locales/en.json:11493`) |

There is no "checking" status and no per-row spinner. An `unverified` engine is not ready, so it falls to the last row. An engine with `authenticated` absent counts as ready for most drivers, so it shows "Ready".

#### 5.4.5 The fold of one engine (`EngineRow`)

`EngineRow` shows this content, in this order (`src/components/EnginesSettings.tsx:390-440`):

1. Trial credit: only a line of text (`src/components/EnginesSettings.tsx:394-397`).
2. `readOnly`: the policy note "Managed by {organization}", the managed text, and an "unavailable" line when not ready (`src/components/EnginesSettings.tsx:398-402`). Nothing else.
3. Otherwise:
   - the policy note
   - `EngineSetup` when not ready (5.5.3). The intent is `inject` for `access === "custom"`, else `cloud`
   - the API-key panel when ready
   - Ollama models for a ready Ollama server
   - Remove for an added server, with the body "This removes the endpoint from app settings. The bots that used it need another model." (`src/locales/en.json:4987`)
   - the app copy notice and the update notice
   - the Antigravity "switch CLI" offer and the warning notice
   - a success line when ready and signed in: the `connectedAccount` text of the device copy, or "Claude connected" (`src/locales/en.json:6484`) for paste code
   - Sign out (5.4.7), Antigravity "free up space", Antigravity account lines
   - "CLI path and updates" (5.4.9)

The API-key panel of a ready key engine shows the configured state with "Change key" (`src/locales/en.json:3878`) (`src/components/EngineSetup.tsx:653-656`). A test shows the saved key masked as `••••••••a1b2`, from `config.openai.last4` (`src/components/EnginesSettings.test.ts:318-352`).

The "Google AI Studio" fold holds `GeminiServer`. Its status is "Not set up · Use a key". The comment says that Google AI Studio has no engine. Its key adds an OpenAI-compatible server at Google's address (`src/components/EnginesSettings.tsx:476-493`). A test shows the request: `POST /api/instances/openai-compat` with `{ displayName: "Google Gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai", key }`. "Add Google AI Studio" stays disabled until the person types a key (`src/components/EnginesSettings.gemini.dom.test.ts:58-73`).

#### 5.4.6 The account card (`AccountsCard`)

The card is for Claude, ChatGPT and Antigravity (`src/components/EngineAccounts.tsx:365-412`).

Card summary (`summaryFor`, `src/components/EngineAccounts.tsx:64-78`):

| Part | Text |
|---|---|
| Title | "Claude" (`src/locales/en.json:4933`), "ChatGPT" (`src/locales/en.json:4934`) or "Google Gemini (Antigravity)" (`src/locales/en.json:4935`) |
| Subtitle, several accounts | "{count} accounts · {signedIn} signed in" (`src/locales/en.json:4936`) |
| Subtitle, one account | the e-mail of the signed-in account, or the provider name |
| Status | "Ready", "Sign-in required" or "Needs setup" |
| Action | "Manage", "Sign in" (`src/locales/en.json:4941`) or "Set up" |

The card body:

1. When no account is `available` (and the group is not Antigravity), the card shows `EngineSetup` of the first account instead of the list (`src/components/EngineAccounts.tsx:378`, `src/components/EngineAccounts.tsx:388`).
2. The policy note from the first account that has one.
3. One `AccountRow` for each account.
4. The add button, unless the first account has `authenticationUnavailableReason` (`src/components/EngineAccounts.tsx:398`).
5. For ChatGPT browser accounts: "ChatGPT Business and Enterprise organizations can block adding an account here (OpenAI shows 3p_delegated_access_policy_denied)." (`src/locales/en.json:4956`).
6. For the ChatGPT group, always: "Bots that use these accounts also share your own Codex setup: config.toml, skills and plugins, but not your own instructions (AGENTS.md)." (`src/locales/en.json:4957`, `src/components/EngineAccounts.tsx:404`).
7. The update notice, the warning notice, then the "CLI path and updates" details (`src/components/EngineAccounts.tsx:407-409`).

One account row (`AccountRow`, `src/components/EngineAccounts.tsx:201-294`):

- Attributes `data-account={id}` and `data-account-state={state}`.
- The mark: a check on a success circle when signed in. Otherwise a 6 px dot, warning color when signed out, grey when not.
- The detail line:

| State | Text |
|---|---|
| `authenticationUnavailableReason` set and not signed in | the reason. No button |
| signed in with `account.method === "api-key"` | "Uses an API key" (`src/locales/en.json:4940`) |
| signed in | "{email} · {organization}", else "Signed in with Google" (`src/locales/en.json:6341`) for Antigravity, else "Signed in" (`src/locales/en.json:4937`) |
| signed out | "Not signed in" (`src/locales/en.json:4938`) |
| unknown | "Sign-in not confirmed yet" (`src/locales/en.json:4939`) |
| unavailable | `snapshot.reason` or "Needs setup" |

- A "Sign in" button shows when the account is not signed in, not unavailable, not blocked and not signing in. It has the accent style when signed out and a quieter style when unknown (`src/components/EngineAccounts.tsx:254-259`).
- The sign-in panel opens under the row. Claude gets `ClaudeSignIn autoStart`, and a "Prefer a terminal?" (`src/locales/en.json:3891`) details with "Open sign-in in Terminal" (`src/locales/en.json:3867`) when `signInCommand` exists. Antigravity gets the Google sign-in. ChatGPT gets `DeviceSignIn provider="codex"` with `autoStart`. When the group has several accounts, ChatGPT also shows "Before you enter the code, check that ChatGPT shows the account you want here. If it shows another one, switch accounts there first." (`src/locales/en.json:4958`) (`src/components/EngineAccounts.tsx:265-284`).
- Focus moves to the first enabled button of a new panel. When the panel closes, focus goes back to "Sign in" if focus was in the panel (`src/components/EngineAccounts.tsx:234-239`).
- A signed-in ChatGPT plan account shows "Using ChatGPT plan" (`src/locales/en.json:6351`) and a "Manage usage" (`src/locales/en.json:6352`) link to `https://chatgpt.com/settings/usage` (`src/components/ChatGptPlanStatus.tsx:7`, `src/components/ChatGptPlanStatus.tsx:36-39`).

The "⋯" menu of one account (`AccountMenu`, `src/components/EngineAccounts.tsx:80-162`):

- The menu button has `aria-label` "Options for {name}" (`src/locales/en.json:4942`). It shows a spinner while busy.
- Items: "Rename" (`src/locales/en.json:4943`, disabled while signing in), "Sign out" (when allowed), "Hide" (when allowed, disabled when in use, with the hint as title), and a note "{count} bot(s) use this account. Pick another model for them first." (`src/locales/en.json:4945`) when in use.
- A visible "Remove" (`src/locales/en.json:4944`) button in danger color, for added accounts only. It is disabled while busy or in use.
- "In use" counts bots whose model is this account, or whose `fallback` list holds it (`src/components/EngineAccounts.tsx:89`).
- Escape or a pointer down outside closes the menu (`src/components/EngineAccounts.tsx:91-103`).
- An error shows in a `role="alert"` box.

Which actions each account allows (`accountActions`, `src/components/EngineAccounts.tsx:48-57`):

| Action | Allowed when |
|---|---|
| Remove | Claude: id is not `claude` and `claudeAccount.isDefault !== true`. Others: id starts with `{group}-`. So the first account of a provider stays |
| Sign out | signed in, `authentication.signOut === true`, and `account.method !== "api-key"` |
| Hide | group `chatgpt` and not removable (the built-in Codex and ChatGPT plan rows) |

Rename (`RenameForm`, `src/components/EngineAccounts.tsx:164-199`): an input of at most 80 characters with `aria-label` "Account name" (`src/locales/en.json:4959`). Escape cancels. An empty or unchanged name closes the form with no call. Otherwise the client sends `PATCH /api/instances/{id}` with `{ displayName }`.

#### 5.4.7 Add an account

The add form (`AddAccount`, `src/components/EngineAccounts.tsx:296-363`):

1. The person presses "+ Add another Claude account" (`src/locales/en.json:4954`), "+ Add another ChatGPT account" (`src/locales/en.json:4955`) or "+ Add Google account" (`src/locales/en.json:6340`).
2. The form shows "Account name" (`src/locales/en.json:4959`) with the placeholder "Work" (`src/locales/en.json:4960`), at most 80 characters, required.
3. For Claude only, a details "Use an existing Claude folder" (`src/locales/en.json:4962`) holds a folder input with the placeholder `~/.claude-work`, at most 4096 characters, and the hint "Leave this empty to keep the account separate. To reuse a sign-in you already have, enter its folder, such as ~/.claude-work." (`src/locales/en.json:4963`).
4. The submit button says "Add and sign in" (`src/locales/en.json:4961`). The client sends `POST /api/instances/{group}-accounts` with `{ displayName, configDir? }`. For Antigravity it adds `sourceInstanceId`, the first available account or the first account (`src/components/EngineAccounts.tsx:399-400`).
5. The client shows the returned list. The form closes. The sign-in of the new account starts at once (`src/components/EngineAccounts.tsx:319-323`, `src/components/EngineAccounts.tsx:401`).
6. An error shows in a `role="alert"` paragraph. The draft stays.
7. While busy, the controls are disabled and a spinner shows. Cancel closes the form and clears the error.

There is no confirmation for Add.

#### 5.4.8 Remove, sign out and hide: texts and confirmations

| Action | Where | Confirmation | Body text | Request |
|---|---|---|---|---|
| Sign out (account) | "⋯" menu | yes. Title "Sign out of {name}?" (`src/locales/en.json:4946`), confirm "Sign out" | "Bots that use this account need it signed in again before their next task. Running tasks are not cancelled." (`src/locales/en.json:4947`) | `POST /api/instances/{id}/auth/sign-out` |
| Sign out (engine with its own CLI login) | engine fold, `aria-label` "Sign out of {name}" (`src/locales/en.json:4949`) | yes, same title | the body above, plus "This also signs {name}'s own command-line app out on this computer." (`src/locales/en.json:4948`) | same |
| Remove (Claude account) | Remove button | yes. Title "Remove {name}?" (`src/locales/en.json:4950`), neutral tone | "This removes the account from {app}. Claude's own sign-in files stay on this computer." (`src/locales/en.json:4951`) | `DELETE /api/instances/{id}` |
| Remove (ChatGPT account) | Remove button | yes | "This signs the account out and removes it from {app}." (`src/locales/en.json:4952`) | same |
| Remove (Antigravity account) | Remove button | yes | "This removes the account and its sign-in from {app}. Your other Antigravity accounts stay connected." (`src/locales/en.json:4953`) | same |
| Remove (added server) | engine fold | yes | "This removes the endpoint from app settings. The bots that used it need another model." (`src/locales/en.json:4987`) | same |
| Hide | "⋯" menu, or "CLI path and updates" | no | | `PATCH /api/instances/{id}` with `{ hidden: true }` |
| Unhide | "More providers" | no | | `PATCH /api/instances/{id}` with `{ hidden: false }` |

Rules and edge cases:

- The dialog of an engine action uses `pending={running}`. Cancel does nothing while the request runs (`src/components/EnginesSettings.tsx:371-376`).
- The engine-row Remove is disabled while a bot uses the engine as its model. It does not count backups (`src/components/EnginesSettings.tsx:348`). The account-menu Remove counts backups too (`src/components/EngineAccounts.tsx:89`).
- Sign out has no in-use check (`src/components/EnginesSettings.tsx:348`).
- Sign out never hides the provider. It "stays listed with Set up" (`src/components/EnginesSettings.tsx:340-341`).
- Sign out is not offered for an engine that an API key signs in. The comment says: "removing its own sign-in would leave it connected" (`src/components/EnginesSettings.tsx:424-425`).
- The Hide in "CLI path and updates" has no client in-use check. Its doc comment says the server refuses it "while something uses it" (`src/components/EnginesSettings.tsx:232-241`).
- The hint of Hide is "Leave this provider out of every model list. Its app and sign-in stay as they are, and you can unhide it here." (`src/locales/en.json:4923`).
- The hidden rows in "More providers" show the header "Hidden ({count})" (`src/locales/en.json:4924`), the mark, the name, the status "Hidden from every model list" (`src/locales/en.json:11413`) and a button "Unhide" (`src/locales/en.json:4926`), busy "Unhiding…" (`src/locales/en.json:4928`), `aria-label` "Unhide {name}" (`src/locales/en.json:4927`). Only one Unhide runs at a time. All Unhide buttons are disabled while one runs (`src/components/HiddenProviders.tsx:44-65`).
- A refused Unhide keeps the provider hidden and shows the server message as an alert (`src/components/EnginesSettings.hidden-providers.dom.test.ts:131-140`).

#### 5.4.9 "CLI path and updates" (`EngineAdvanced`)

The details (`src/components/EnginesSettings.tsx:200-338`):

- Summary "CLI path and updates" (`src/locales/en.json:5029`). With several Antigravity accounts it adds " · {accountName}".
- Footer "Set CLI points a model provider at a specific binary: a versioned build, a wrapper script, or an absolute path. Changes are saved only when the selected provider is idle. Other providers keep running." (`src/locales/en.json:5010`).
- The CLI path (`instance.cli` or `cliDefault`) and `snapshot.version`.
- Buttons:

| Button | Shown when | Busy text | Request | After |
|---|---|---|---|---|
| "Update Claude" (`src/locales/en.json:4917`) | driver `claudeAgent` | "Updating…" (`src/locales/en.json:4918`) | `POST /api/instances/{id}/claude-update` with `{}` | "Claude updated to {version}" (`src/locales/en.json:4929`), then a list refresh |
| "Reset" (`src/locales/en.json:4919`) | `instance.cli` is set | "Resetting…" (`src/locales/en.json:4920`) | `PATCH /api/instances/{id}` with `{ cli: "" }` | list refresh |
| "Hide" (`src/locales/en.json:4922`) | always | | `PATCH /api/instances/{id}` with `{ hidden: true }` | shows the returned list |
| "Set CLI…" (`src/locales/en.json:4921`) | always | | opens the picker | |

- An error shows as `role="alert"` text in danger color (`src/components/EnginesSettings.tsx:325`).

The CLI path picker (`CustomPicker`, `src/components/EnginesSettings.tsx:42-198`):

1. On mount, once, the client sends `GET /api/cli-candidates?name={cliDefault}` and gets `{ candidates: string[] }`. On error the list becomes empty.
2. The picker shows a select with the placeholder "Select a detected binary…" (`src/locales/en.json:4909`) and a text input with the placeholder "Enter path manually…" (`src/locales/en.json:4910`).
3. Save, or Enter in the input, sends `POST /api/cli-test` with `{ cli, driver }`. The answer is `{ ok, version?, message? }`.
4. On `ok`, the client sends `PATCH /api/instances/{id}` with `{ cli }`. The line "Test passed: {version}" (`src/locales/en.json:4914`) shows.
5. On failure, an alert "Test failed: {message} Register this path anyway?" (`src/locales/en.json:4913`) shows, with "Edit path" (`src/locales/en.json:4915`) and "Save anyway" (`src/locales/en.json:4916`). "Save anyway" saves with no test.
6. A new value clears the last test result. The picker closes when `instance.cli` changes.
7. None of these calls has a client timeout.

#### 5.4.10 Updates, warnings and keys

- Update notice (`EngineUpdateNotice`, `src/components/EngineSetup.tsx:222-251`): a warning box with the server's `update.title` and `update.message`. When the server can install and `serverInstall !== false`, it shows the button "Update {name} here" (`src/locales/en.json:3880`). Otherwise it shows the command with "Open update in Terminal" (`src/locales/en.json:3830`) where the desktop can open a terminal. The settings page passes `quiet`, so the notice does not compete with Sign in.
- Warning notice (`EngineWarningNotice`, `src/components/EngineSetup.tsx:253-274`): a warning box with the server's `warning.title` and `warning.message`.
- App copy notice: "Another copy of {name} on this computer doesn't start, so {name} now uses the copy {app} installed." (`src/locales/en.json:3883`) with "Dismiss" (`src/locales/en.json:3884`). Settings forgets it on unmount (`src/components/EnginesSettings.tsx:580-581`).
- Keys: a key engine shows "{name} needs an API key" (`src/locales/en.json:3871`) until a key is saved, and "{name} uses your API key" (`src/locales/en.json:3875`) after. A rejected key shows "The provider rejected the saved key." (`src/locales/en.json:3870`). A remote client gets no key entry and no button (`src/components/EngineSetup.tsx:605-640`).

#### 5.4.11 Busy, empty and error states of the page

| State | What the page shows | Source |
|---|---|---|
| Busy refresh | the "Check again" button reads "Checking…" | `src/components/EngineLibrary.tsx:129` |
| Failed refresh | the button reads "Try again". Its title is "Could not refresh provider status. The previous status is still shown. {reason}" (`src/locales/en.json:3816`) | `src/components/EngineLibrary.tsx:126-131` |
| Busy action | a spinner in the button of that action only | `src/components/EnginesSettings.tsx:366` |
| Failed action | the message in a `role="alert"` paragraph under the action | `src/components/EnginesSettings.tsx:370` |
| No hidden providers | no hidden rows | `src/components/HiddenProviders.tsx:48` |
| No other rows and no hidden rows | no "More providers" row | `src/components/EnginesSettings.tsx:517` |

#### 5.4.12 The chat's "AI sign-in" card

`AiSignInSettings` reuses `SimpleEngines` with `accountsOnly` (`src/components/EnginesSettings.tsx:561-576`). It lists only account-group engines and non-read-only Antigravity. Every row is featured. There is no fold and no hidden row. It is inside `AdminOnly`. A test shows the order `claude`, `codex`, `antigravity`. A person who is not an admin sees "Only an admin of this installation can change this.", or nothing on a team (`src/components/EnginesSettings.ai-sign-in.dom.test.ts:54-72`).

### 5.5 The engine library, set-up and sign-in

These components show one engine card, the set-up of an engine that is not ready, and each sign-in. Settings and onboarding share them.

#### 5.5.1 The engine library (`EngineLibrary`)

`EngineCard` (`src/components/EngineLibrary.tsx:36-81`):

- A `<details>` element with `data-engine-card={instanceId}`. When open it spans the full grid row.
- Its children stay mounted when it closes. So closing a card does not leave a sign-in or a CLI path draft.
- The summary row has the provider mark at 28 px in a 48 px tile, the title and a subtitle. The subtitle is the e-mail when signed in, "Bring your own model" (`src/locales/en.json:5023`) for custom access, or the provider name.
- A status pill: a check and "Ready" (`src/locales/en.json:3732`), or a warning dot and "Sign-in required" (`src/locales/en.json:3405`) when `available` and `authenticated === false`, else "Needs setup" (`src/locales/en.json:3733`).
- The right side: for a ready engine, "Updated to {version}" (`src/locales/en.json:4930`) once after an update, else `v{version}`, else "Manage". For an engine that is not ready, "Set up" with an arrow.

`EngineSections` (`src/components/EngineLibrary.tsx:83-108`):

- One CSS grid, `repeat(auto-fit, minmax(min(100%,280px),1fr))`.
- Two groups: ready first, then not ready. Each group has the heading "Ready" or "Needs setup" and a count, "1 model provider" or "{count} model providers".
- The order inside a group is the caller's order. An optional sponsor row is raised.
- The cards are flat siblings with a key. A card that moves to the other group keeps its open state and its unsaved input.
- Empty state: "No model provider apps detected yet." (`src/locales/en.json:5009`).
- No filter and no search.

`RefreshEngines` (`src/components/EngineLibrary.tsx:110-140`):

- In Settings: a quiet text button, "Check again" (`src/locales/en.json:5028`), "Checking…" while busy, "Try again" after an error. The error text is the title.
- Outside Settings: a button with a turning icon while busy, an alert "Could not refresh provider status. The previous status is still shown. {reason}" and the status "Provider status refreshed." (`src/locales/en.json:3817`) after success.

#### 5.5.2 The "no engines" screen (`NoEngines`)

The app shows this screen when it is connected, knows some engines, none is available or busy, and none worked earlier in this page load (`src/lib/onboarding.ts:269-276`, `src/App.tsx:477-478`).

- Remote client: the title "The host needs an AI" (`src/locales/en.json:9322`), the body "Set up Claude or another supported AI in {app} on the host computer, then come back here." (`src/locales/en.json:9323`), and one "Check again" button (`src/components/NoEngines.tsx:26-40`).
- Local view (`src/components/NoEngines.tsx:43-112`):
  1. The title "Install a model provider to get started" (`src/locales/en.json:1075`) and the intro "{app} doesn't ship a model of its own. Your bots run on an AI CLI installed on this computer, using your existing login. Set up any one of these and your bots come alive." (`src/locales/en.json:1076`).
  2. Engines with an `install` object. Engines with a command for this platform come first.
  3. The group "Cloud" (`src/locales/en.json:1077`): one card for each subscription engine, with `EngineSetup intent="cloud"`.
  4. One button "Use an API key" (`src/locales/en.json:1743`) with the hint "Pay as you go with an OpenAI, Anthropic, xAI or OpenRouter key, in Settings → AI." (`src/locales/en.json:1744`). It opens the key settings. A remote client does not see it.
  5. The group "Local" (`src/locales/en.json:1078`): cards for custom engines, with `EngineSetup intent="inject"`.
  6. "Check again", with a spinner and "Checking…" while busy. A failure shows no error.

#### 5.5.3 Set-up of one engine (`EngineSetup`)

`EngineSetup` picks one view. The first match wins (`src/components/EngineSetup.tsx:658-842`):

| Order | Condition | View |
|---|---|---|
| 1 | `onHost` (a paired desktop) | the title and "This app uses the AIs on the host computer. Set up {name} there, then come back and pick it." (`src/locales/en.json:5152`) |
| 2 | API-key set-up | the API-key panel (5.4.10) |
| 3 | `grokAgent` with no CLI and no server terminal | "Grok with your grok.com subscription isn't installed here. Use an xAI API key instead." (`src/locales/en.json:6393`) and an xAI key row |
| 4 | no `install`, or `authenticationUnavailableReason`, or Ollama | "{name} isn't ready" and the reason, else "This model provider is not available on this machine." (`src/locales/en.json:3866`). Ollama gets its status and "Check again" |
| 5 | sign-in only, `install.appCopy`, and not device, browser or paste | the app copy set-up |
| 6 | else | the framed panel below |

The framed panel:

- Title "Sign in to {name}" (`src/locales/en.json:3852`) when the intent is `cloud` and the engine needs sign-in. Else "Set up {name}" (`src/locales/en.json:3811`). The intent `inject` never shows a sign-in.
- A description chosen by the method or the install kind (`src/components/EngineSetup.tsx:693-716`).
- The server's `reason` for an unavailable engine, as a red alert. With `quiet`, it goes under "Details" (`src/locales/en.json:3892`) in grey. On a Cloud the reason is hidden when the app cannot install there or installs on the server (`src/components/EngineSetup.tsx:683-686`, `src/components/EngineSetup.tsx:766-775`).
- The body, first match wins (`src/components/EngineSetup.tsx:777-810`):

| Method or install | Body |
|---|---|
| `browser` | `EngineBrowserSignIn` |
| `device-code` or `browser-pkce` | `DeviceSignIn`. A device-code engine other than Codex with a `signInCommand` and a server terminal also gets "Prefer a terminal?" with the command |
| `paste-code` | `ClaudeSignIn` |
| `install.server`, not signing in | server install |
| `install.managed` | the managed set-up (Google sign-in) |
| a Cloud that cannot install | "{name} can't be installed on the Cloud yet. Choose another AI in the model picker." (`src/locales/en.json:3814`) |
| a command | a command row. No terminal on a Cloud home |
| none | "There isn't a one-line installer for this platform. Use the setup guide below." (`src/locales/en.json:3869`) |

- "Requires Node.js and {npm}." (`src/locales/en.json:3893`) when the command needs Node.js and no server install exists.
- For a terminal command: "Install and sign in on the computer running {app}, as the same user. On a remote connection, that means the machine it runs on, not this device. Then choose Check again. No app restart needed." (`src/locales/en.json:3813`), the path hint (`src/locales/en.json:3815`) when the CLI is missing, and "Check again". The person tells the app that a terminal sign-in is done with this button. No timer does it.
- "View setup guide" (`src/locales/en.json:3894`) when `install.docsUrl` exists.

The command row (`CommandRow`, `src/components/EngineSetup.tsx:44-156`) has "Copy command" (`src/locales/en.json:3810`), "Copied" (`src/locales/en.json:3821`) and "Terminal" (`src/locales/en.json:3824`). The status text clears after 2,200 ms.

The server install (`ServerEngineInstall`, `src/components/EngineSetup.tsx:158-220`):

1. The button reads "Install {name} here" (`src/locales/en.json:3879`) or "Update {name} here" (`src/locales/en.json:3880`).
2. While busy it reads "Installing. This can take a minute." (`src/locales/en.json:3881`) with a spinner.
3. A standalone build shows "About {mb} MB download. {app} checks it before installing." in decimal MB, at least 1.
4. The client sends `POST /api/instances/{id}/install` and shows the returned list.
5. If the engine is still not `available`, the client shows "The installer finished, but the provider is not usable yet. {reason}" (`src/locales/en.json:3819`).
6. Otherwise it shows "Installation verified. Sign in if requested." (`src/locales/en.json:3820`).
7. "Prefer a terminal?" shows the npm command when the server has npm.

The managed set-up (Google sign-in, `src/components/EngineSetup.tsx:292-537`):

- Buttons: "Sign in with Google" (`src/locales/en.json:3835`), "Starting Google sign-in…" (`src/locales/en.json:3833`) while busy, "Open Google sign-in again" (`src/locales/en.json:3834`) once a flow exists.
- While starting: "Starting Antigravity can take up to 90 seconds. Your browser will open when it's ready." (`src/locales/en.json:3836`).
- With `kind === "pasted-code"`: the hint "Sign in on the page Google opens. Then paste the code it shows, or the full address of the page you end on, here." (`src/locales/en.json:3845`), the label "Sign-in code or page address" (`src/locales/en.json:3846`), and "Send code" (`src/locales/en.json:3848`).
- Otherwise: "I finished signing in" and a redirect box. Its summary is "Signing in from another computer?" (`src/locales/en.json:3838`) or, on a Cloud, "Google's page didn't load? Paste its address here" (`src/locales/en.json:3840`). The hint is "After Google redirects to a page that cannot load, paste that page's complete URL here." (`src/locales/en.json:3839`). The placeholder is `http://127.0.0.1:…/?code=…`. The button is "Send redirect" (`src/locales/en.json:3844`).
- Cancel shows only when the caller gives `onDone`. A failed cancel keeps the flow and shows the error.
- Install mode: "Install Google Antigravity CLI" (`src/locales/en.json:3859`) or "Install Classic runtime" (`src/locales/en.json:3860`). It reads "Downloading and verifying…" (`src/locales/en.json:3831`) while busy or while `snapshot.installing === true`.

#### 5.5.4 `DeviceSignIn`

Device code sign-in for Codex, Grok, Kimi and Cursor, and the ChatGPT plan sign-in (`browser-pkce`) (`src/components/DeviceSignIn.tsx:102-271`). Each provider has its own nine texts (`src/components/DeviceSignIn.tsx:30-76`). The Codex texts are below.

| State | What shows |
|---|---|
| Idle | "Connect ChatGPT" (`src/locales/en.json:6364`), or "Continue with ChatGPT" (`src/locales/en.json:6339`) for the ChatGPT plan |
| Starting | "Getting your sign-in code…" (`src/locales/en.json:6365`), or "Opening ChatGPT sign-in…" (`src/locales/en.json:6343`) |
| Waiting | "Enter this one-time code on OpenAI's sign-in page:" (`src/locales/en.json:6366`), the code in large monospace text, "Copy sign-in code" (`src/locales/en.json:6367`), the link as a button, a spinner with "Waiting for you to finish signing in…" (`src/locales/en.json:6369`), "Code expires at {time}" (`src/locales/en.json:6370`), the security note (`src/locales/en.json:6371`), and "Cancel sign-in" |
| No valid link or code | an alert, for example "Codex did not return a valid OpenAI sign-in link and code. Cancel and try again." (`src/locales/en.json:6381`). The code is hidden |
| Succeeded | "ChatGPT connected. Your models are being refreshed." (`src/locales/en.json:6373`) |
| Cancelled | "Sign-in cancelled. You can request a new code when ready." (`src/locales/en.json:6377`) |
| Expired | "This code expired. Request a new code to try again." (`src/locales/en.json:6378`) |
| Interrupted (at `e1cc6a290`: a reason `interrupted`, or 404 or 410) | "This sign-in was interrupted. Start again." (`src/locales/en.json:6402`) |
| Flow gone (401, 403, 404, 410; at `e1cc6a290` 401 and 403 only) | "This sign-in session is no longer available. Check that this browser is still paired with Full access, then request a new code." (`src/locales/en.json:6382`) |
| Failed | the server message, or "Sign-in could not be completed. Try again, or check the Codex installation." (`src/locales/en.json:6379`), and "Try again" (`src/locales/en.json:6383`) |

- Codex device code only: "Device-code login may need enabling in ChatGPT security settings or by your ChatGPT admin." (`src/locales/en.json:6372`). At `e1cc6a290` it is step 1 above the code (see section 5.3).
- Cursor prints no code. Its waiting view has only the link "Open Cursor sign-in" (`src/components/DeviceSignIn.tsx:67-68`).
- The ChatGPT plan flow opens the checked link at once after start (`src/components/DeviceSignIn.tsx:221-224`). The device-code flows never open a page by themselves (`src/components/GrokSignIn.interaction.test.ts:54-63`).
- Attributes: `data-device-sign-in={provider}` and `data-chatgpt-plan-sign-in`.

#### 5.5.5 `ClaudeSignIn`

The Claude paste-code sign-in (`src/components/ClaudeSignIn.tsx:31-198`):

1. Idle: "Sign in to Claude". While busy: "Preparing sign-in…".
2. Start opens the checked link in the system browser.
3. Waiting with no valid link: the alert "Claude Code did not return a valid Anthropic sign-in link. Cancel and try again."
4. Waiting with a link: a form.
   - "1. Sign in on the Claude page that opened" with the link "Open Claude sign-in".
   - "2. Paste the code Claude shows you" with an input (placeholder "Paste code", autofocus).
   - "Finish" (`src/locales/en.json:4968`), busy "Checking with Claude Code…". It stays disabled while busy or while the trimmed code has fewer than 8 characters (`src/components/ClaudeSignIn.tsx:159`). At `e1cc6a290` (commit `94a1a6d1f`, v0.1.186) it also stays disabled while the value looks like the code that Claude emails (digits only, up to 8), and a warning shows under the field (`looksLikeEmailedCode`, `src/components/ClaudeSignIn.tsx:33-36`, `:147`; `src/locales/en.json:4986`).
   - The note "The code goes to Claude Code once and is never saved." (`src/locales/en.json:4969`).
   - Cancel.
5. Finish sends `POST .../auth/complete` with `{ flowId, code }`. A 200 is the sign-in. A 401, 403, 404 or 410 shows "This code expired. Request a new code to try again." (At `e1cc6a290`: see the polls table of section 3.19.3. Only 401 and 403 show "expired".) Another error makes one status call. If the flow still waits, the error shows and the form stays open (`src/components/ClaudeSignIn.tsx:90-109`).
6. Success: "Claude connected. Your models are being refreshed."
7. Ended: the expired text or the failure message, and "Try again".

#### 5.5.6 `EngineBrowserSignIn`

The engine opens the person's browser itself. The app shows no link and no code (`src/components/EngineBrowserSignIn.tsx:1-2`). The code is generic, but all texts name Mistral (`src/locales/en.json:6355-6363`). At `e1cc6a290` (commit `5b07c79c4`, v0.1.186, issue #5995) each text uses the display name of the engine, `{name}` (`src/components/EngineBrowserSignIn.tsx:18-21`, passed at `src/components/EngineSetup.tsx:778`; `src/locales/en.json:6375-6382`). Before, Antigravity (Google Gemini) showed "Sign in to Mistral". The release note says: "The browser sign-in names the right AI." The table has the texts at `140172d88`:

| State | Text |
|---|---|
| Idle | "Sign in to Mistral" |
| Starting | "Opening the Mistral sign-in…" |
| Waiting | spinner, "Finish the sign-in in the browser that opened…", "The sign-in window closes at {time}.", "Cancel sign-in" |
| Succeeded | "Connected to Mistral. Your models are being refreshed." |
| Cancelled | "Sign-in cancelled." |
| Expired | "The Mistral sign-in window expired. Start it again to retry." |
| Failed | "The Mistral sign-in did not finish. Start it again to retry.", with "Try again" |

#### 5.5.7 Onboarding: `MeetScreen`, `SignInPill` and `ConnectAi`

The first run has two screens, `meet` and `chief` (`src/components/onboarding/WelcomeFlow.tsx:49-50`). `MeetScreen` mounts the sign-in pill and the "Connect an AI" dialog (`src/components/onboarding/MeetScreen.tsx:131`, `src/components/onboarding/MeetScreen.tsx:152`). It does not mount the engine library.

`MeetScreen` (`src/components/onboarding/MeetScreen.tsx:58-156`):

- Up to three pills for the kinds `claude`, `chatgpt` and `opencode`. If none fits, one Claude pill. Pills after the first are quiet. The ChatGPT pill is named "ChatGPT".
- A pill waits while the test message of its AI runs.
- An error line (alert): the first pill error, else the test error, else "{name} is signed in but didn't answer. Try another way." (`src/locales/en.json:3728`).
- Success: "Connected to {name}" (`src/locales/en.json:3700`) with a check, then "Next" (`src/locales/en.json:3697`).
- Links: "Other ways to connect" (`src/locales/en.json:3701`) opens the dialog. "Set up later" (`src/locales/en.json:3702`) skips the step.

`SignInPill` (`src/components/onboarding/SignInPill.tsx:196-240`):

- A pill of 288 × 36 px.
- Label, by the way the pill acts (`pillWay`, `src/components/onboarding/SignInPill.tsx:31-38`): "Set up {name}" (`src/locales/en.json:3707`), "Install {name}" (`src/locales/en.json:3706`), "Sign in with {name}" (`src/locales/en.json:3705`), "Connect {name}" (`src/locales/en.json:3704`) or "Connect an AI" (`src/locales/en.json:3703`). A signed-out engine with method `callback-url` opens the dialog, because a pasted redirect has no room in the pill.
- Busy or waiting: a spinner pill "Waiting for {name}…" (`src/locales/en.json:3708`). A click opens the link again.
- Paste slot (Claude): an input with the label and placeholder "Paste the code from {name}" (`src/locales/en.json:3709`) and the submit arrow "Use this code" (`src/locales/en.json:3710`), disabled while empty.
- Code slot (device code): the code in monospace with "Copy".
- No Cancel button and no expiry. The pill does not show its error. `MeetScreen` shows it.

`ConnectAi` (`src/components/onboarding/ConnectAi.tsx:18-220`):

- A modal of 440 px width and at most 640 px height. Title "Connect an AI". Escape, a click on the scrim, or "Close" closes it.
- Rows: the leading AIs (Claude, ChatGPT, OpenCode), then an organization row, then a sponsor option, then every other offered engine as a collapsible row, then "Check again".
- A provider sign-in gets one plain line: "Use the {name} account you already have. You sign in on their own website, so your password stays with them." (`src/locales/en.json:3731`).
- States:

| State | Text |
|---|---|
| List check failed | "Couldn't check your AI connections. Try again." (`src/locales/en.json:3722`) |
| Test runs | spinner, "Checking that {name} answers…" (`src/locales/en.json:3727`) |
| Test passed | "Connected · {name}" (`src/locales/en.json:3726`) |
| No test possible | "{name} is connected. Your bots can start now." (`src/locales/en.json:3725`) |
| Test failed | the reason, or "{name} is signed in but didn't answer. Try another way.", plus "Or connect another AI below." (`src/locales/en.json:3729`), and "Check again" |
| Only the free backup works | "{name}'s free model is ready as a backup. For the best answers, connect an AI you already use." (`src/locales/en.json:3730`) |
| Nothing yet | "Checking…" |

- A test shows that the dialog never uses the words "engine", "Ready", "Needs setup" or "provider" (`src/components/onboarding/ConnectAi.test.ts:103-112`).

The onboarding test message: `POST /api/instances/{id}/check` with `{}` and a 120 s timeout (`src/components/onboarding/welcome-ai.ts:48`).

#### 5.5.8 `CloudEngineSignIn`

The Cloud sign-in page (`src/components/CloudEngineSignIn.tsx:164-240`). The app shows it when `firstRun === "sign-in"` (`src/App.tsx:466-468`).

- Title "Connect an AI to the Cloud" (`src/locales/en.json:1731`), or "Connect an AI to do it" (`src/locales/en.json:1750`) when a job waits.
- Intro "The Cloud runs your bots with your own AI account. Choose one below; the sign-in stays in the Cloud." (`src/locales/en.json:1732`).
- Tiles in a grid of 2 or 3 columns:

| Tile | Hint | Shown when |
|---|---|---|
| "Claude" (`src/locales/en.json:1734`) | "Use your Claude subscription." (`src/locales/en.json:1735`) | always |
| "ChatGPT" (`src/locales/en.json:1737`) | "Use your ChatGPT plan with Codex." (`src/locales/en.json:1738`) | always |
| "OpenCode" (`src/locales/en.json:1739`) | "Free models, no account needed." (`src/locales/en.json:1740`) | an instance exists |
| "Grok" (`src/locales/en.json:1741`) | "Use your grok.com subscription with Grok Build." (`src/locales/en.json:1742`) | its instance is `available` |

- A connected tile shows "Connected" (`src/locales/en.json:1838`). A tile signed in by a key shows "Runs on your API key." (`src/locales/en.json:1736`).
- A picked tile opens `EngineSetup unframed`, or "This model provider isn't available in the Cloud yet." (`src/locales/en.json:1745`).
- After a new connection, a live check line: "Sending {name} a short test message…" (`src/locales/en.json:1839`), "{name} is working" (`src/locales/en.json:1840`), or "{name} is connected but didn't answer a test message." (`src/locales/en.json:1841`) with "Test again" (`src/locales/en.json:1842`). The check has a 120 s timeout (`src/components/EngineLiveCheck.tsx:22`).
- "or" (`src/locales/en.json:1749`), then "Use an API key" with its hint.
- The limits note (`src/locales/en.json:1733`).
- "Already signed in?" (`src/locales/en.json:1748`) with "Check again".
- With a waiting job, a newly ready engine shows "Connected. Starting your job…" (`src/locales/en.json:1752`). The job starts after 1,200 ms (`src/components/CloudEngineSignIn.tsx:173-187`).
- Trial credit lines: "Your trial Claude credit is used up. …" (`src/locales/en.json:1746`) and "Trial Claude credit isn't available in the Cloud anymore. …" (`src/locales/en.json:1747`).

### 5.6 Key rows and the Simple mode prompt

The rest of Settings → AI (the provider list and the engine cards) is in the parts on the Settings AI page and the engine library, which other writers cover.

#### Key catalog

The Settings key page has 6 sections: `ai`, `servers`, `voice`, `computers`, `apps` and `helpers` (`src/components/keys/key-catalog.ts:11-20`). This part covers `ai` and `servers`.

Testable providers show a check: anthropic, openai, openrouter, openaiCompat, xai, mistral, cerebras, groq, greenference, modelgo, meta and treg (`src/components/keys/key-catalog.ts:22`).

The rows of the "ai" section (`src/components/keys/key-catalog.ts:86-129`):

| Row | Env name | Placeholder | Shape | Key page |
|---|---|---|---|---|
| OpenAI | `OMB_OPENAI_API_KEY` | `sk-…` | `^sk-(proj\|svcacct\|admin)-` | https://platform.openai.com/api-keys |
| Anthropic | `OMB_ANTHROPIC_API_KEY` | `sk-ant-…` | `^sk-ant-` | https://console.anthropic.com/settings/keys |
| xAI | `XAI_API_KEY` | `xai-…` | `^xai-` | |
| OpenRouter | `OMB_OPENROUTER_API_KEY` | `sk-or-v1-…` | `^sk-or-` | |
| Mistral | `MISTRAL_API_KEY` | | | |
| Cerebras | `CEREBRAS_API_KEY` | | `^csk-` | |
| Groq | `OMB_GROQ_API_KEY` | | `^gsk_` | |
| Greenference | `OMB_GREENFERENCE_API_KEY` | | | |
| ModelGo | `OMB_MODELGO_API_KEY` (a sponsor row with its own event) | | | |
| Meta | `OMB_META_API_KEY` | `LLM\|…` | `^LLM\|` | |
| DeepSeek | `OMB_DEEPSEEK_API_KEY` (no test) | | | |
| OpenCode | `OPENCODE_API_KEY` (no test) | | | |
| OpenCode other providers | a panel, configured when any provider key is saved | | | |

The "servers" section has Ollama (a panel), LM Studio (a panel) and OpenAI-compatible (`OPENAI_COMPAT_API_KEY`, `OPENAI_COMPAT_URL`). For OpenAI-compatible, `testAt` is the saved URL, so a new address checks the saved key again (`src/components/keys/key-catalog.ts:38-39`, `src/components/keys/key-catalog.ts:130-137`).

An engine instance maps to a key row: `openai`, `claudeApi` → anthropic, `xaiApi` and `grok` → xai, `openrouter`, `mistral`, `cerebras`, `groq`, `greenference`, `modelgo`, `meta`, `deepseek`, `opencodeGo`, `openaiCompat` (`src/components/keys/key-catalog.ts:289-296`).

#### Key row layout

1. A heading: a 32 px mark, the label, the purpose and a status chip (`src/components/keys/KeyRow.tsx:68-79`).
2. Under it, one of three things: the field, the masked saved key, or "Use your own key" for a row that a Cloud plan includes (`src/components/keys/KeyRow.tsx:429-444`).
3. The field is a password input. In Settings, the order is: field, "Get a key" link, then Cancel (when the person replaces a key) and Save on the right. Outside Settings, the field has a Show/Hide eye and Save/Cancel (`src/components/keys/KeyRow.tsx:309-414`).
4. The placeholder is "Paste your key", or "Paste the new key" when the person replaces a key (Settings). Else it is the provider placeholder (`src/components/keys/KeyRow.tsx:336`, `src/components/keys/KeyRow.tsx:391`).
5. A saved key shows the mask "••••••••" plus the last 4 characters, and the buttons Replace and Remove (`src/components/keys/KeyRow.tsx:16`, `src/components/keys/KeyRow.tsx:40-47`, `src/components/keys/KeyRow.tsx:416-424`). A row that points at another key has no Remove (`src/components/keys/KeyRow.tsx:149`, `src/components/keys/KeyRow.tsx:421`).

#### Key row behaviour

- Paste saves at once when the text looks like a key and does not look like another provider's key (`src/components/keys/KeyRow.tsx:316-324`, `src/components/keys/KeyRow.tsx:371-379`). A value that matches another provider's shape is flagged (`src/components/keys/key-catalog.ts:282-287`) with "That looks like the {label}, not this one." (`src/locales/en.json:8378`).
- Enter saves. Escape cancels a replace (`src/components/keys/KeyRow.tsx:325-334`).
- Remove saves `""` (`src/components/keys/KeyRow.tsx:272-293`).
- A change of the address next to the key (`testAt`) checks the saved key again (`src/components/keys/KeyRow.tsx:177-178`, `src/components/keys/KeyRow.tsx:266-270`).
- A generation counter stops a late answer for one service from showing on another (`src/components/keys/KeyRow.tsx:144-146`, `src/components/keys/KeyRow.tsx:182-196`).

#### States and exact text

| State | Text | Line |
|---|---|---|
| Busy, saving | chip "Saving…" | `src/components/keys/KeyRow.tsx:208-217`, `src/locales/en.json:8374` |
| Busy, removing | chip "Removing…" | `src/locales/en.json:8375` |
| Busy, checking | chip "Checking…" | `src/components/keys/KeyRow.tsx:169-175` |
| Error | chip "Didn't work", detail "Didn't work: <message>" | `src/components/keys/KeyRow.tsx:233`, `src/components/keys/KeyRow.tsx:448-453`, `src/locales/en.json:8376` |
| OK and tested | chip "Connected" | `src/components/keys/KeyRow.tsx:169-175`, `src/locales/en.json:4209` |
| OK, not tested | chip "Saved" | `src/components/keys/KeyRow.tsx:169-175` |
| Cloud plan | "Included with your Cloud plan" | `src/locales/en.json:4202` |
| Whitespace in the key | "That doesn't look like an API key: keys have no spaces. Copy the key again and paste it here." | `src/components/keys/KeyRow.tsx:202-207` |
| Key not kept after save | "The key didn't stay saved. Try again." | `src/components/keys/KeyRow.tsx:218-228` |
| Check: rejected | "The provider rejected this key." | `src/components/keys/key-save.ts:56-67` |
| Check: unreachable | "Couldn't reach the provider. Check the address and your internet connection, then test again." | `src/components/keys/key-save.ts:56-67` |
| Check: unexpected | "The provider answered unexpectedly (status {status})." | `src/components/keys/key-save.ts:56-67` |
| Check: OpenRouter `/key` ok | "Saved key:" then "API key authenticated. Chat not tested." | `src/components/keys/key-save.ts:56-67` |
| Check: OpenRouter free tier | adds "Free account: bots will use free models (marked "free" in the model picker)." | `src/locales/en.json:4204` |
| Check: model list ok | "Model catalog reachable: {models}. Authentication and chat not verified." or "Model catalog reachable. Authentication and chat not verified." | `src/locales/en.json:4205-4206` |
| Engine rejects the key | "Didn't work: The provider rejected this key." when an API engine for this key is `available` with `authenticated === false`. A check that worked clears it. | `src/components/keys/KeyRow.tsx:152-153`, `src/components/keys/KeyRow.tsx:163-164` |
| Engine missing | "Saved, but {engine} can't run on this computer yet, so this key isn't used. Install it with this command, then check again:" with the command and a "Check again" button. The Grok CLI is excluded: "The Grok CLI signs in with a grok.com account and drops XAI_API_KEY". | `src/components/keys/KeyRow.tsx:154-162`, `src/components/keys/KeyRow.tsx:466-479`, `src/locales/en.json:8379` |

The server reason for a rejected key is "The provider rejected this key. Change it in Settings → AI." (`server/key-rejections.ts:4`).

#### Simple mode prompt

The app shows the prompt once per browser from AppNotices. When `SIMPLE_ONLY` is on or Advanced is back, it shows `NewLookNotice` instead (`src/components/AppNotices.tsx:360-362`). A closed prompt stores `omb-simple-mode-prompt = "1"`. Storage that cannot be read counts as seen, because it "would ask again at every launch" (`src/lib/simple-mode-prompt.ts:3-28`).

Layout (`src/components/SimpleModePrompt.tsx:16-103`):

1. A modal dialog, width `min(440px, 100vw-32px)`.
2. The title gets the focus on open, so no key flips the switch by accident (`src/components/SimpleModePrompt.test.ts:51-70`).
3. A body line.
4. A switch row with a hint.
5. A footer line.
6. A Done button and an × button.

Behaviour:

- The switch changes the mode at once, in both directions. The title stays the one it opened with. The prompt stays open (`src/components/SimpleModePrompt.tsx:28-31`, `src/components/SimpleModePrompt.test.ts:72-89`).
- Escape, ×, Done or a click outside closes it for good (`src/components/SimpleModePrompt.tsx:16-103`).
- Tab stays inside the dialog. The focus goes back to the opener on close (`src/components/SimpleModePrompt.test.ts:111-127`).
- It respects reduced motion (`src/components/SimpleModePrompt.test.ts:129-133`).
- It sends the analytics event `simple_mode_prompt` with action `shown`, `toggled` or `closed`, and the mode (`src/components/SimpleModePrompt.tsx:12-14`).

Exact text (`src/locales/en.json:2145-2150`):

| Part | Text |
|---|---|
| Title (opened in Advanced) | "Try the new Simple mode" |
| Title (opened in Simple) | "You're on Simple mode" |
| Body | "A calmer screen, with every feature still there." |
| Switch | "Simple mode" |
| Switch hint | "Flip it to see the difference right away." |
| Footer | "Switch any time in Settings → Advanced mode." |
| Button | "Done" (`common.done`) |

## 6. The tests

### 6.1 Tests of the engine list, the status reads and doctor

The registry tests use fake drivers, fake timers and a temporary status file. (`server/harness/registry-probe-hold.test.ts:29-46`). The end-to-end tests start the real server with a temporary home and data folder and a fake CLI.

#### Engine list and status reads

| Test file | What behaviour it guarantees |
|---|---|
| `server/harness/registry.test.ts` | Live instances for known drivers, `defaultConfig` when the entry has no config, `cli` only when the config sets it, default access "subscription" (16-75). An unknown driver, a decode error or a `create` rejection gives a shadow, and the other entries stay (77-114). Creation is concurrent, the list keeps the config order, a failure is isolated (116-159). A disposed instance does not return, and a replaced one keeps its slot (161-191). A `wsl.exe` CLI on Windows gets a warning (193-208). `onSignedIn` fires only on a change from signed out to signed in (210-283). A throw gives unavailable with the error, and a hang gives unavailable at 60 s while other engines are still read (285-314). Concurrent reads share one probe, and a read is reused for 3 s (398-432). A failed or timed-out read is never reused, and after `forgetSnapshots()` a probe in flight is never given to a later read (448-493). With `reuse` (60 s) the old answer comes first, a background read follows, and `changed` runs once on a change (495-527). npm install, standalone build, app copy and wrong-CLI heal, POSIX only (571-840). |
| `server/harness/registry-start-read.test.ts` | CLIs are probed one at a time, most used first, and engines with no CLI at once. `engineRead` probes the engine of a turn at once. `provisional()` is true until the read ends (53-93). A stuck CLI lets the next start after 5 s and ends unavailable at 60 s (95-116). The list answers from the seed until the read reaches the engine. The status file is written a second after the probe, with mode 0o600 on POSIX (118-155). A seed that was available and a cold probe that is unavailable lead to one more warm probe (157-180). A terminal-only `update` is kept (182-201). `changed` is false when the probe agrees (203-210). No seed when the driver kind or the CLI changed, and `forgetSnapshots()` drops seeds (212-231). `snapshotFrom` drops an account `token` and an unknown `secret` field (235-242). `enginesByUse` orders by count (244-247). |
| `server/harness/registry-probe-hold.test.ts` | A timed-out check keeps the last status, signed in included (55-65). The CLI stays unsettled until a check answers (67-78). First check with the program file there gives "available, unverified". No file gives unavailable without `busy` (80-93). A missing binary always shows the setup page (95-102). The 60 s deadline is held the same way (104-113). The back-off uses `PROBE_RETRY_MS`, and the third calm failure is believed (115-141). A pressed machine never takes an engine as broken, but checks it at the last back-off step (143-159). After `forgetSnapshots()` a failed check is retried after 5 s (161-173). A sign-out on a pressed machine is checked once more, and a sign-out after a sign-in change is believed at once (175-193). A restart starts from the saved status, but a deleted program never comes back (195-218). An "available, unverified" engine is never chosen to run (220-226). Checks wait during the turn of the engine. A turn silent for 5 min proves nothing (232-256). While pressed, no reused check runs until the status is 10 min old (258-286). With no turn signal or pressure, reads are as before (288-296). A small machine runs one status check at a time (300-320). |
| `server/harness/engine-status-file.test.ts` | A save is not written at once. A flush writes `{v:1, engines:[row]}`. A read gives the snapshot back for the same driver kind and CLI. The exit listener is added once (15-28). `freeFallback`, `chatgptPlan` and `account` survive a save and a read (30-44). |
| `server/harness/probe-hold.test.ts` | A timeout kill, a SIGKILL with no timeout, and EAGAIN, ENOMEM, EMFILE, ENFILE are inconclusive (13-19). ENOENT, EACCES, EPERM, crash signals, exit status 1 and null are answers (21-25). `heldSnapshot` keeps, drops or marks "unverified" by the program file (30-42). `cliPresent` finds an executable without a start. A missing file, a folder, an empty string or a non-executable file off Windows is not there. On Windows any file is there (45-68). |
| `server/engine-check.test.ts` | Any answer is `{ok:true}`, and only the short prompt is sent (8-13). "Not logged in · Please run /login" gives `signed_out`. A 402 gives `credits`, empty gives `empty`, ENOENT gives `other`, a 429 gives `rate_limit`, and a key in the error text is redacted (15-24). No one-off call gives `{ok:null}`. One check runs for each engine at a time (26-38). `generateMemoryText` is used when it is the only call (40-44). A hang past the limit gives `reason:"timeout"`, aborts the call, leaves no timer, and lets the next check start (46-67). |
| `server/cli-probe.test.ts` | A missing CLI gives `ok:false` with install commands and without the standalone pins (26-32). EAGAIN is not "not installed" (34-39). Windows answers with a file extension in upper or lower case are accepted (41-46). Another program's answer gives "is not ... CLI" (48-52). |
| `server/cli-probe-antigravity.test.ts` | The Antigravity test gives `{ok:true}` before install and a version after a fake managed install (13-21). It uses the real `DATA_DIR` runtimes folder and removes it after each test (6, 11). |
| `server/cli-probe-cache.test.ts` | The file exists only under the desktop app (49-55). An unchanged program answers from the cache, also after a restart (57-72). A replaced file, changed content or a new app version asks again (74-93). A failure, an empty answer, a sign-in check and a program not on PATH are never kept (95-112). Shell scripts, shims and CLIs with flags are not kept (114-132). No file means every probe runs (134-142). An unsettled status check runs the program again (174-206). |
| `server/cli-probe-env.test.ts` | The real server runs with every credential variable set to a fixture value. The `cli-test` stub and the Claude updater get none of these names or values (110-120). |
| `server/cli-version-probe.test.ts` | A 30 s limit, and callers with the same PATH share one run (11-23). A different PATH never shares (25-41). An empty answer is tried once more (43-64). The last version is kept through temporary failures (66-77). ENOENT, EACCES, EPERM forget the version (79-85). An unknown failure hides the private output (87-91). A new copy first on PATH gives its own version (93-114). Windows launches the checked copy by its full path (116-136). |
| `server/engine-records.test.ts` | POSIX only (55, 140). A dead earlier server's engine and its child are stopped and the folder is forgotten (56-65). A live server's run, a reused pid and a run with no `server.json` are left alone (76-95). Another boot is forgotten without a stop (97-104). Children get `OMB_ENGINE_TAG` and a record (106-120). A daemon in its own session survives (140-191). `leftBehind` rules (194-223). |
| `server/routes/instances.test.ts` | A real HTTP server with a real registry and a fake driver (21-80). Sign-in routes cause a new probe only when something changed (83-109). A paired phone gets 403 for a browser sign-in (114-147). Each phone has its own sign-in owner: 409 on start, 404 on cancel of the computer's flow (150-164). `?fresh=1` reads every engine again (166-175). `/api/health/engines` counts and names none (177-191). `check` goes through `checkInstance` (193-200). `install` with `{useCli}` (202-258). Hiding gives 409 while in use (365-389). Body caps give 413 (421-441). |
| `server/engine-status-reads.e2e.test.ts` | A slow (9 s) or once-empty `--version` still gives `available` and signed in to three concurrent list reads, with one or two version runs (70-95). At a later start, `--version`, `--help` and `auth` run once each (97-116). A sign-out, a model refresh, a saved key and a Claude update cause a new probe. Else the last read is reused (118-160). Hide and show do not probe (162-184). DELETE of `claudeApi` disposes its engine (186-191). |
| `server/engine-status-seed.e2e.test.ts` | A saved seed shows its version and `update` before the probe ends. The probed version shows within 15 s after the probe is released (36-62). |
| `server/host/engine-hints.test.ts` | Each reason why an engine cannot run gets one line of text for the bots, and every built-in driver gets a non-empty text for every case (10-128). No line about engines is in the bot persona (132-135). A fresh install names every engine in at most 7 groups and under 1,000 bytes (137-172). |
| `src/App.engine-status.test.ts` | A saved conversation stays while its engine is unavailable (21-45). With no conversation and every engine unavailable, the setup page shows "Check again" (47-63). A `busy` failure of an engine that worked does not show the setup page again. A "CLI not found" answer shows it (65-85). |

#### doctor and headless commands

| Test file | What behaviour it guarantees |
|---|---|
| `server/doctor/run.test.ts` | A fix that changes nothing is not a repair: `fixed: "Tried."`, `repaired: false`, three looks (11-30). A look after the fix that throws gives `failed` (32-46). The first `detail` goes to the later looks (48-61). On POSIX, a user who is not the folder owner changes nothing and gets the owner `why` (63-81). Backup pruning keeps registry runs under 30 days (97-122). |
| `server/doctor/start.test.ts` | The first start of a version moves a stray temp file, logs two lines and writes `doctor-state.json` with no path in the summary (20-34). The same version does not run again. The next version logs "(last: 1.2.3)" (36-47). A throwing check never stops the start (49-56). 12 runs leave 10 backup folders (60-69). `--data` without `--fix` exits 8. With `--fix` it exits 0 and removes the lease file (73-94). |
| `server/doctor/doctor.e2e.test.ts` | A real server with damage in eight places. `doctor --data --json` exits 8 and finds the fixable problems. `--fix` exits 0, and the server lists the same bots (112-133). A new version's first start repairs the same damage itself, except lease and folders (135-148). |
| `server/doctor/checks/data-format.test.ts` | No marker or a known format is ok (13-18). An unreadable marker is ok while the version writes format 1 (20-30). A newer format blocks every fix and makes no backup (32-49). |
| `server/doctor/checks/engine-runs.test.ts` | An orphaned run moves into the backup. A valid, clean or non-tag folder stays (12-28). A run that names a process is left for a person (30-39). No folder is ok (41-43). |
| `server/doctor/checks/folders.test.ts` | A missing `native` is made and noted (12-20). A missing data folder or a file in place of a folder is not fixed (22-38). |
| `server/doctor/checks/lease.test.ts` | Start mode is ok (20-22). A dead pid is fixed and the old record is in the backup (28-37). A live pid stops every fix (39-48). Another machine or an unreadable record is never fixed (50-64). |
| `server/doctor/checks/messages-db.test.ts` | Sound and missing databases are ok (28-33). A damaged file is not rewritten (35-42). A large WAL is folded back after a copy, and an open writer keeps its rows (44-62). Low disk blocks the fix (64-74). The start size limit (76-83, 170-182). A locked, unreadable or folder database is "not checked" (100-136). A failed checkpoint is `failed` but the copy exists (138-158). |
| `server/doctor/checks/registry.test.ts` | A cut file is put back from a whole temp copy with mode 0600 (23-39). With no copy, a copy is kept and the file stays (41-54). An older temp file or a live save's temp file is never used (56-79). An unreadable file is "not checked" (81-115). A failed rename or a failed backup changes nothing (117-149). |
| `server/doctor/checks/secret-modes.test.ts` | A 0644 `config.json` becomes 0600, and the backup holds only the old mode (9-25). Windows: "Not checked on Windows." (28-31). |
| `server/doctor/checks/settings-file.test.ts` | Missing or a JSON object with a BOM is ok (9-14). A cut file is not fixable and the finding never holds the key text (16-31). |
| `server/doctor/checks/temp-files.test.ts` | Only a dead pid's temp file moves. Live, own newer, non-matching and sub-folder files stay (10-28). An own-pid file older than the start counts as a predecessor's (30-36). |
| `server/headless/host-doctor.test.ts` | A healthy fake Ubuntu gives 12 "ok" lines and "Ready." (50-68). Each FAIL gives exit 7 with a fix line (70-94). Connector cases (96-117). Warnings still exit 0 (119-130). `--domain` cases (132-139). macOS and Windows exit 7 (156-160). Under `NODE_ENV=test` without `--data-dir`, it refuses the real data folder (162-179). Wrong flag mixes exit 2 (181-185). |
| `server/headless/doctor.test.ts` | A shared server without a session gives only a count of engines (8-42). With 0 engines: "no engine is available" (44-48). `doctor --data` never calls the server (56-86). `--data --url`, `--fix --wait`, `--host --data` exit 2 (88-92). |
| `server/headless/engine.test.ts` | `engine set claude --key-env` writes the key once and never prints it. A second run writes nothing. `--rotate` writes again (52-66). `--install` on an available engine does not install (68-73). The install has its own longer timeout (75-113). `--only-claude-api` gives `claudeApi` (115-127). Key flag errors and dry run (129-138). `engine list` shows booleans for keys (141-149). |
| `server/headless/login.e2e.test.ts` | Login uses a fake Keychain, never prints the token, and is refused in a bot's shell with exit 5 (64-118). After `logout` a mutating verb exits 4 (140-142). Against `openmausbot serve` it saves to a file (146-171). |
| `server/headless/args.test.ts` | `engine set` and `engine list` parse (28-29). Unknown flags and `--token` exit 2 (33-40, 60-65). `engine set` is mutating, `doctor` is not (42-47). `0`, `25h`, `5d` are refused as durations (76). |
| `server/headless/main.test.ts` | `--json` prints exactly one document, a failure included (20-27). Secrets are redacted in all output (36-45). Every verb has help text (47-55). |
| `server/headless-cli.e2e.test.ts` | `doctor --json` exits 0 against a fake-engine server with `capabilities.jobs` and a loopback session (57-59). |

### 6.2 Tests for named accounts, sign-in and engine homes

All tests use fake CLIs, fake OAuth servers and disposable homes. None uses a real account.

| Test file | What behaviour it guarantees |
|---|---|
| `server/claude-accounts.test.ts` | Two new accounts get different ids and folders. A new account has no `environment` and keeps the default entry's `cli`. An unknown-driver entry stays. A duplicate folder throws "already configured". A relative folder throws "absolute". The schema refuses an extra `environment` key and a blank name (14-27). The default account has `configDir` "" and its command has no `export CLAUDE_CONFIG_DIR=`. PowerShell doubles a single quote and uses `finally` (29-39). The POSIX command passes exactly `auth login`, keeps quotes and `$(...)` in the folder, and drops `CLAUDE_CODE_OAUTH_TOKEN` (41-47). A reload of one instance disposes only that one (49-72) |
| `server/drivers/claude-accounts.test.ts` | `configDir` decoding: " ", "~/work", "~", none, "", an explicit path. A number, null, a relative path, "~other/work" and a newline are refused (87-99). Two accounts at the same time are isolated: own models, identity, turn and permission review. Each made 5 CLI calls with its own `CLAUDE_CONFIG_DIR`, the server's `HOME`, and none of the parent's account keys (101-125). The default account gets the inherited `CLAUDE_CONFIG_DIR` and `ANTHROPIC_AUTH_TOKEN`, not `ANTHROPIC_API_KEY` (127-135). Endpoint and Bedrock key rules (137-196). The snapshot publishes only a bounded identity and never tokens (198-217) |
| `server/claude-account-api.test.ts` | Real server: create gives 201 with `claudeAccount` and the sign-in command. The default folder is `<dataDir>/providers/<id>` (267-275). No token in `GET /api/instances` (276-280). Rename keeps id and folder (281-284). Delete keeps the folder's files. Delete of `claude` or `ghost` gives 400 (286-296). A bad saved folder shows `unavailable` and can be repaired (246-260). An account used by a bot or its history gives 409 on folder change and delete (299-318). A running turn blocks a `cli` change. Siblings change without a stop (320-351). Input gates 415, 400, 409, 404. A client token gets 403 (428-457) |
| `server/drivers/claude-login-auth.test.ts` | Link check: https and Anthropic hosts only. A partial last line is not accepted. Code check (62-78). Happy path: link, UUID `flowId`, same flow on a second start, `succeeded`, cleared status, CLI calls `auth status --json`, `auth login`, `auth status --json` with the account's `HOME` and `CLAUDE_CONFIG_DIR`, `BROWSER` "true" except on Windows (119-134). A bad code is not sent. A rejected code fails and the process is gone (136-144). Sign-out success, the refusals during a sign-in on the same or another controller, "still reports a sign-in", "could not confirm the sign-out", a hung logout, SIGTERM ignored (POSIX), dispose (149-228). Exit 2 with `loggedIn:false` is not sign-out (230-233). Missing CLI, disposed controller (235-240). Already signed in: status only (243-247). Foreign host link times out (249-253). Cancel (255-264) |
| `server/drivers/claude-auth.test.ts` | `claudeSignedIn` runs `auth status --json` with timeout 8000 (11-20). `loggedIn:false` is signed out (22-28). An error with no output, "not json", "null", "{}" and `{"loggedIn":"yes"}` give unknown (30-40). `claudeAuthFailure` classifies only CLI-marked frames (43-72). `claudeVersionTooOld` (74-87) |
| `server/drivers/claude-auth-recovery.test.ts` | A synthetic signed-out refusal rejects with `TurnAuthenticationRefusedError` only after the process stop (36-48). No recovery after model activity or with a non-structured frame (65-102). Usage limit refusals (172-210) |
| `server/drivers/codex-login.test.ts` | A status asked before `forget` does not confirm the login again. A later signed-out check is "missing" (21-27). `keptCodexLogin` keeps the last answer only for a `busy` check (30-40) |
| `server/drivers/codex-identity.test.ts` | The CLI is asked through `app-server` with `initialize`, `initialized`, `account/read { refreshToken: false }` and the account's `CODEX_HOME`. The process is gone after (37-47). A keyring identity wins over an old `auth.json` (49-54). API-key, no-account and error replies give null (56-60). Unsafe emails, relative homes, missing CLI, hung request, oversized and secret-bearing replies give null and are cleaned up (62-105) |
| `server/drivers/codex-device-auth.test.ts` | The prompt parser accepts only `https://auth.openai.com/codex/device` with a full code line (65-75). Happy path and CLI calls with the account's `HOME` and `CODEX_HOME` (106-118). Sign-out, its refusals, a failed or no-op logout, a hung logout, SIGTERM ignored, dispose (136-213). An API-key or unknown login is not signed out (222-231). A working login is not replaced, unless refused. An API-key login is not replaced. Unknown fails closed (234-262). Retry, cancel, startup limit, dispose (264-308). Exit 0 is not proof (310-316). Expiry (336-343). Two controllers of one home (345-356) |
| `server/drivers/codex-shared-home.test.ts` | Into a plan home it links `config.toml`, `skills`, other files, `plugins`, `mcp-oauth-locks`, and not the login, chat, database or per-home entries (34-62). `AGENTS.md` and `AGENTS.override.md` are never linked (64-89). Old chat links are removed, also on failure (91-119). Login "person" links `auth.json` and `models_cache.json` (121-141). Login "own" keeps the plan's real `auth.json` (143-157). Earlier plan files stay (159-192). A second run changes nothing (194-219). `keepChatsOutOfCodexHistory` sets `CODEX_HOME` and `CODEX_SQLITE_HOME` and leaves out `AGENTS.md` (231-249). It keeps the person's home for keyring, Team Cloud, server home, own real login, no `auth.json`, system store file, and a home that cannot be made (251-291) |
| `server/drivers/codex-plan-token.test.ts` | The version is read once and again only after a snapshot notes another. 0.164.0 does not renew, 0.165.0 does (5-16). A read in flight is shared. A failed read gives false and is asked again. 1.0.0 renews (18-32) |
| `server/drivers/chatgpt-plan-auth.test.ts` | Happy path: `dynamic_agent_client`, `urn:uuid:` host id, S256 verifier, listed models only, no token in the snapshot, modes 0o600 and 0o700 (110-131). Refused models per account (132-156). Bad nonce, issuer, audience, `iat`, expiry or signature saves nothing (157-162). Bad state or repeated query key gives 400 before any token call. A callback works once (163-194). Declined callback and used code (195-211). Missing direct scope (212-221). Sign-out keeps the registration and revokes. Two accounts share the host id (222-236). Another subject or client never replaces the record (237-244). Two controllers or processes make one refresh (245-265). A 503 keeps the record. `refresh_token_reused` deletes the tokens (266-274). JWKS down sends no refresh (275-286). A bad successor clears the tokens (287-295). Failed revocation still clears (296-300). Cancel during exchange saves nothing (301-310). Two starts share one flow. A non-loopback test URL is refused (311-316) |
| `server/chatgpt-plan-api.test.ts` | A signed-out plan snapshot with no token words (40-48, 85-88). Create refuses bad names and `environment`, then saves `{ authMode, cli }` only (89-113). `auth/start` gives a `no-store` reply with the OpenAI authorize URL, S256 and a `127.0.0.1` redirect (116-127). The folder path and its exclusion from backups (128-130). A flow belongs to the admin session that started it (132-148). A proxied start gives 403 (151-162). Rename, delete, `configDir` refused, built-in `chatgpt` not deletable (164-178) |
| `server/drivers/chatgpt-plan-token-bridge.test.ts` | The helper prints the current token with empty stderr. A later call gets a new token. A wrong secret fails. After `close` the helper fails. A bridge closed during a refresh returns no token (14-38) |
| `server/engine-homes/engine-homes.test.ts` | Off a Team Cloud nothing changes (30-47). On a Team Cloud a spawn in a conversation gets its audience home (mode with no group or other bits), the team's Claude sign-in, and the `.migrated` marker (49-61). Turns, pings, summaries and compaction run in their conversation's scope (63-98). Only bot spawns get the audience home. After `stop` all spawns keep the server's `HOME` (101-119) |
| `server/engine-homes/layout.test.ts` | Home keys and distinct homes (14-22). `HOME` moves and sign-ins come from the server's `HOME` (24-39). Folder variables move or go to `.omb-folders` (41-55). Two ChatGPT accounts keep separate Codex homes and sign-ins (57-64). Idempotent (77-83). `audienceHomes` never lists `.held` (86-93) |
| `server/engine-homes/sign-ins.test.ts` | Copies have no group or other bits. No change when nothing changed. A new team sign-in reaches every audience (27-37). A refresh in one audience becomes the team's in place (same inode) (39-61). A young or half copy is never taken back (63-74). A team sign-out removes the copy. A link or folder is replaced by a file (76-92) |
| `server/engine-homes/migrate.test.ts` | The first start moves 6 entries and holds 3 (40-68). The server's `HOME` keeps its sign-ins and no transcript (69-75). Runs once. An existing file is held, not written over. Old held folders are deleted (78-100) |
| `server/engine-homes/box.linux.test.ts` | Linux with unprivileged bubblewrap only. A boxed shell cannot read another member's transcripts or the server's `HOME`, and reads the team's Claude sign-in (53-61). A refreshed token lands in the team's file through the bind mount (62-66). Without an engine home the leak exists (69-72) |
| `server/cloud-team-engine-homes.e2e.test.ts` | Real Team Cloud: each person's chat runs in that person's home, the team chat in `team`, all signed in with the team's token (90-116). Transcripts stay in their home (97-104). No cross-member reads (118-134). Resume from the own home (136-144). A refreshed token reaches the team after 2.5 s (146-154). The migration reruns after the marker is deleted (156-168). `member-left` deletes one home (170-176). "My Cloud" is unchanged (178-192) |
| `server/account-signin.test.ts`, `server/sign-in-env.test.ts` | People signing in to the server, not engine accounts: the allow-list parser and domain match, wrong code 401, control-plane sign-out, pinned lists from the environment (`account-signin.test.ts:6-64`, `sign-in-env.test.ts:5-36`) |

Manual checks, not run by the test suite: `scripts/verify-claude-account.ts`, `scripts/verify-claude-auth-settings.ts` (the account's `settings.json` supplies the key, its hooks do not run, 65-77), `scripts/verify-codex-account.ts`, `scripts/verify-chatgpt-plan.mjs` (bearer token, `store: false`, no `tool_search`, 90-99), `scripts/verify-codex-token-refresh.mjs` (the fixed token fails at `token_expired`, the bridge recovers, the tool shell never sees `OMB_CODEX_AUTH_SECRET`, 53-64).

### 6.3 Tests of sign-in, sessions, resume and the Antigravity account

All engine processes in these tests are local fakes in a temporary HOME. Most tests that start a real process are skipped on Windows.

#### Device code sign-in and sessions

| Test file | What behaviour it guarantees |
|---|---|
| `server/drivers/device-auth.test.ts` | Sign-out without a status command. It reads the sign-in through `signedIn`, runs `logout` and confirms the sign-in is gone, and a second sign-out runs nothing (77-85). Nothing signed in runs no logout (87-91). A logout that exits 1 gives "Fake could not remove the sign-in on this server." and keeps the file (93-98). No logout command gives "Signing out of Fake is not available from here." (100-104). `removeCredentials` deletes the file with no CLI (106-114). An `unknown` state refuses the sign-out and keeps the file (116-124) |
| `server/drivers/codex-device-auth.test.ts` | Page and code only from whole lines (65-75). Success runs exactly `login status`, `login --device-auth`, `login status` with the instance's own HOME and `CODEX_HOME` (106-118). Sign-out order, refusal during a sign-in and from another controller on the same home, a failed logout without the CLI's words, a logout that lies, a hung logout freed by its limit, a logout that ignores SIGTERM (136-213). A working ChatGPT login is not replaced. A refused login is replaced. An API-key login gives "different sign-in method". An unknown status gives "could not confirm" (234-262). A second start gives the same code without a new process (264-269). Cancel and dispose during the first status check (271-290). Old CLI, disabled device login, 48 000 characters of output, missing CLI, bad page, hung status (292-308). Exit 0 without an account gives "did not confirm" (310-316). 1.5 s lifetime gives `expired` (336-343). Two controllers on one home (345-356) |
| `server/drivers/acp/grok-device-auth.test.ts` | Prompt parsing, rejected pages and code shapes (20-53). `logoutArgs` is `["logout"]` (57-61). The login runs as `login --device-auth` with `XAI_API_KEY` removed (72, 91-102). A custom `GROK_HOME` gets the sign-in (104-113). A stored login is signed in again, not trusted (115-123). Cancel kills a process that ignores SIGTERM (125-135). Expiry (137-150). Another host is never shown, and the startup timer fails the start (152-162). Fixed failure messages (164-188). A second click gives the same code, and a sibling instance on the same home is refused (190-200). Dispose and sign-out (202-228) |
| `server/drivers/acp/kimi-device-auth.test.ts` | The parser on kimi-code 2.4.1 output, and a new code after expiry replaces the first (30-55). Extra query keys are dropped (57-60). No `logoutArgs`, but `removeCredentials` and `signInState`. An unreadable credential folder is `unknown` (83-99). The login runs with `MOONSHOT_API_KEY` removed (110, 130-141). A custom `KIMI_CODE_HOME` (143-151). A revoked login with empty tokens is not a sign-in (169-173). The renewed code reaches the status (175-183). Sign-out removes the file without a CLI (249-257) |
| `server/drivers/acp/cursor-sign-in.test.ts` | The version pattern tells Cursor's build from curl's banner (28-34). A wrong program reads `unavailable` with `notEngineCli` (56-66). The link has no code (102-107). Bad links are refused (113-124). `readCursorStatus` maps exit 0 with the flag, else `unknown` (126-131). `login` runs with `NO_OPEN_BROWSER=1` (159-170). A crash gives a fixed sentence (192-204) |
| `server/drivers/acp/grok-sign-in.test.ts` | The output table of `grok models` (33-46). Signed out needs two calls (50-66). A hang keeps "signed in" (68-74). No `auth.json` is false with no call (76-80). A new probe only when `auth.json` changes (82-92). A stale answer comes at once and a background probe updates it (94-102). An expired login reads `authenticated: false` (104-117) |
| `server/drivers/acp/browser-auth.test.ts` | POSIX only (37). Start gives `waiting` with no URL, and `succeeded` once the readiness file exists (38-50). The startup timer covers only the handshake (52-68). Cancel, an exit after `initialize`, no auth methods (70-96). The engine's words never reach the status (98-107). An unknown flow id rejects (109-115). Sign-out refuses with an API key and reports "still reports a sign-in" (117-160). A missing CLI adds the server hint (162-175). `onAuthenticated` runs on success (177-193) |
| `server/grok-sign-in-api.test.ts` | The HTTP surface on a full server: the instance row (60-69), `auth/start` with `cache-control: no-store` (72-75), `auth/status` (79), `auth/cancel` stops the process and leaves no `auth.json` (81-88), and a poll that reaches `succeeded` with `authenticated: true` (91-100) |
| `server/provider-auth-sessions.test.ts` | `signedIn` is told for a success by poll, by `complete` and by an already signed-in start, never for `waiting` or `failed`, and one time only (21-53). `clearInstance` forgets only one provider (57-66). Another admin gets 409 on start and 404 on the rest (67-77). The exact flow id is required (79-87). The slot is taken before the CLI start (89-99). `revokeOwner` during a pending start (101-110). A failed resume keeps the first flow (130-138). Cancel or a final status frees the slot (140-153). Sign-out rules (173-203). `active` stops after 15 min for a start and 60 s for a sign-out that never returns (207-242) |
| `server/provider-auth-stale.test.ts` | After cancel, the owner can read `cancelled` and `signedIn` is not called (21-32). A poll in flight during a cancel or a sign-out gives 404 and never announces success (34-61). A `complete` in flight during a revoke gives 404 (63-75) |
| `src/components/GrokSignIn.interaction.test.ts` | Nothing is called before the click. Start posts to `/auth/start`. The app never opens the page by itself. The poll comes after 2000 ms. Success refreshes once and tracks `engine_signed_in` (54-72). Cancel leaves one "Try again" (74-87). A failed start shows one alert (89-102). The client marks `expired` at `expiresAt` (104-113) |

#### Terminal login (not an engine sign-in)

| Test file | What behaviour it guarantees |
|---|---|
| `server/routes/cli-login.test.ts` | A loopback refusal gives 403 (52-55). Two waiting requests from one source, the third gets 429, a guest gets 403 on the list and on allow (57-66). A session that cannot be made gives 403, and an uncollected session is revoked (68-80). A request ends after 10 min (82-88) |
| `server/cli-login.e2e.test.ts` | The code shape `ABCD-EFGH`, no token in the start answer, no verifier in the list, a wrong verifier gives 404, a second read gives 404 (37-63). A `client` session cannot allow others (65-74). Deny, a cross-site request, the cap of 2 per source (77-93) |

#### Sign-in resume and sign-in settle

| Test file | What behaviour it guarantees |
|---|---|
| `server/host/sign-in-resume.test.ts` | Each waiting message is sent again after a sign-in, and the notice becomes "Claude is signed in again." (84-96). Nothing is sent while the read says signed out (98-112). The message is not sent, but the notice changes, when the conversation is busy, the person wrote again, the bot answered, or the model changed (114-131). Spoken lines, reactions, widget presses, app lines and relayed lines are never sent (133-142, 184-200, 228-237, 391-400). One recheck timer (202-226). Five unanswered reads, then wait for an event (239-258). Only rows from before the sign-in (260-280). A replaced instance stops the pass (282-295). The newer of two messages wins (317-329). Park at capacity, with delays 15 s, 30 s, 60 s, 120 s (331-345, 376-389). Past 24 h the message is forgotten but the notice changes (347-356). A damaged file drops bad rows and does not throw (402-420). It does not check the file after a later save. Host: `appSignedIn` and restart (448-483) |
| `server/sign-in-resume.e2e.test.ts` | A full server. A signed-out turn fails with two setup rows (88-94). A sign-in in a terminal sends each stuck message exactly once more, and one "signed in again" notice shows (98-112). A thread moved to another model is not sent again (116-137). A message refused between two sign-ins less than 60 s apart is sent after the second (139-157) |
| `server/sign-in-resume-antigravity.e2e.test.ts` | Skipped on Windows (15). A signed-out native Antigravity account gives "error: Antigravity needs a Google account — choose Sign in with Google in engine setup" and a signed-out notice, with no prompt sent (63-70). `auth/start` and `auth/complete` send the stuck message once and the turn settles (72-80) |
| `server/host/sign-in-settle.test.ts` | Not an engine sign-in. An answer in the chat resumes handed-on work and hands the browser back (43-51). The person's own parked conversation is released (53-59). `verified` needs an `ok: true` tool call on that site (71-79). When a computer is handed back (98-133) |

#### The Antigravity account

| Test file | What behaviour it guarantees |
|---|---|
| `server/drivers/antigravity-account.test.ts` | Two calls at one time share one lookup with 2 fetches, the first with `redirect: "error"`, and the token file does not change (17-31). A changed file gives a new lookup (33-45). Bad shapes and a file over 1 MiB make no fetch (47-52). Offline, 401, no token and a bad email give no email, and a second call makes no request (54-65) |
| `server/drivers/antigravity-native-login.test.ts` | The link is found by its shape, and bad links are refused (38-64). Pasted input rules (70-97). Exact arguments (100-104). Success with a code and with an address (118-138). A refused code gives a fixed line and never shows the code (140-151). A second paste is refused (153-162). `confirm()` when the CLI stays up (164-184). No link in time (186-192). Expiry (194-202). Cancel kills the process, and a kill that fails blocks a new start (204-230). Cancel during start (232-240). A second start cancels the first (242-251) |
| `server/drivers/antigravity-native-status.test.ts` | "out" on `Authentication required`, "in" after `--login`, and never `authenticate` (33-40). A crash, a hung `session/new` or a silent `initialize` throws, never "out" (42-55). Sign-out is confirmed (59-99). The cache keeps "out" 30 s exactly and "in" until `forget` (103-184). The refusal pattern (186-200) |
| `server/drivers/antigravity-native-signin.test.ts` | Skipped on Windows (70). The full loop of start, complete, turn and sign-out (71-102). A terminal sign-in is read (104-117). One CLI process for each turn (132-141). A crash is not read as signed out (177-192). Sign-out keeps other accounts, never touches the keyring, and fails when it cannot confirm (212-361). A `-32000` "Authentication service unavailable" is not a sign-out (350-360). `ProviderAuthSessions.signOut` during a sign-in ends the login first (410-423) |
| `server/drivers/antigravity-native-sign-in.test.ts` | The access token only with more than 60 s left (23-35). The profile file is read whatever `HOME` or `SSH_CONNECTION` say (50-57). The usage request never contains the token, the refresh token or the email (79-96) |
| `server/drivers/antigravity-sign-in.test.ts` | Pinned form. A sign-in request during a turn ends `auth_required`, and a new token file reads signed in again (92-121). A -32603 or -32000 network failure keeps the account signed in (138-158). The words that count as a sign-in request (180-216). Pinned sign-out (229-256). Controller states, the pasted redirect, a second redirect, a wrong state, a failed delivery (293-365). Fixed failure lines (367-376). Expiry after 5 min (378-392). Only the browser that started a flow may read it (394-405). Browser helper check (425-467) |
| `server/drivers/antigravity-cli-login.test.ts` | The native profile environment: no auto-update, a fixed `SSH_CONNECTION`, file token storage (71-81). The pinned runtime keeps the server's `SSH_CONNECTION` (82-91). "No browser is available here" with -32603 is a sign-in request (101-104). The real `acp --login` launch writes the token file (107-129) |
| `server/drivers/antigravity-opt-in.test.ts` | The opt-in counts only for the value "1" (76-83). With the pinned runtime present, no path and `agy` stay on it (85-97). An account set to `antigravity` runs the CLI (99-106). The pinned profile reads only `acp_token.json` (116-131). New install and opt-in rules (135-182) |
| `server/antigravity-account-api.test.ts` | The add route: validation, 415, 403 for a `client` session, and no change to `config.json` (66-78). Two adds, no copied environment or secret, no token for the new account, and both accounts survive a restart (80-114). Rename (116-130). The original cannot be removed. Removal deletes the profile folder (132-148) |
| `server/antigravity-auth-blip.e2e.test.ts` | A -32603 network failure on `authenticate` is not a sign-out, sends no notice, does not use the backup engine, and the next turn runs on a new process (93-116) |
| `server/routes/instances-antigravity-native.test.ts` | The sign-in routes (99-131). A check asks the CLI again (133-143). 40 list reads start no new CLI for a signed-in account (145-168). Removal deletes the profile without `logout` (178-188). Accounts never share the keyring (190-230). Sign-out during a sign-in cancels it (232-241). The settings lock gives 409 and keeps earlier removals (244-303) |
| `server/antigravity-first-install.test.ts` | The first install only when opted in or in use, never on a Classic computer, and one install at a time (90-175) |
| `server/plan-usage-antigravity-native.test.ts` | Which paths are native, decided from files alone, and the usage follows the runtime right after a switch (43-93) |
| `src/components/EnginesSettings.antigravity.dom.test.ts` | One card with a row for each account (105-120). Add and sign in (122-144). Two waiting sign-ins (146-154). Cancel rules (156-210, 291-312). Rename disabled while signing in (212-221). Send redirect (223-231, 314-339). Focus (233-289). An unknown status offers "Sign in" (382-389) |
| `src/components/EnginesSettings.antigravity-switch.dom.test.ts` | No runtime selector (62-77). When the switch is offered (79-100). Switch, and no way back (102-117). A failed install puts the old path back (119-130). A disabled button while the server installs (140-148) |
| `src/components/EngineSetup.antigravity.test.ts` | Pinned form paste field and "I finished signing in" (57-68). "Open Google sign-in again" makes no new start (70-76). Expired, failed and succeeded states (78-94). Cloud hint (96-111). Install wording (133-147). Native code field and "Send code" (150-173) |

### 6.4 Tests for providers, keys, the gateway, the default model and the UI mode

| Test file | What behaviour it guarantees |
|---|---|
| `server/provider-key-check.test.ts` | No real provider is contacted (`server/provider-key-check.test.ts:39`). Loopback is `localhost`, `127.x`, `::1` and `[::1]`. Look-alike hosts (`127.example.test`, `128.0.0.1`, `127.0.0.999`) are not, and a key is never sent to them over http (`:5-20`). Normalised loopback forms (`127.1`, `2130706433`, `0x7f000001`) and any https work (`:22-36`). The models URL is right per provider and base (`:78-85`). Anthropic sends `x-api-key` and `anthropic-version` and no Authorization. Others send Bearer only (`:87-97`). Model ids come from an array, `data` or `models`. The first 5 valid ids are kept. Non-strings and ids over 120 characters are skipped (`:99-105`). 401 is rejected, 500 is unexpected, a refused connection is unreachable (`:107-111`). A 200 with a body that is not a list is unexpected (`:113-120`). An empty list is ok (`:122-126`). An empty or blank key is rejected with no request (`:128-135`). OpenRouter is always checked at `/key` with redirect manual, and a free key gives `freeTier:true` (`:137-160`). An OpenAI key goes to OpenAI, never OpenRouter (`:162-170`). Groq, ModelGo, Greenference and Meta use their default URLs (`:172-219`). A custom server is never sent to `/key` (`:221-229`). A redirect, HTML, a list or an error from `/key` is unexpected (`:231-241`). A hanging provider gives unreachable after the timeout, and a 302 is not followed (`:243-247`). Plain http to a non-loopback host and a bad URL are refused with no request (`:249-255`). |
| `server/provider-key-flow.test.ts` | End to end, with a real server process and local fake providers. A key test with no saved key gives 400 (`:41-44`). Look-alike loopback URLs give unexpected (`:45-48`). `PUT /api/config` with `openaiCompat {url, key}` returns `configured:true` and never the key (`:49-54`). A public `/models` gives `check:"models"`, never authenticated (`:14-18`, `:55-56`). An empty, blank or non-string key gives 400 (`:57-62`). After a key change, the next turn of the same bot sends the new key with no restart (`:77-81`). Without the desktop store, `config.json` holds the key in plain text (`:82-83`). A cleared key makes the instance `unavailable` (`:84-87`). No key appears in `/api/bots`, `/api/config`, SSE frames or the server log (`:88-93`). A change of `openaiCompat.url` and key moves model discovery and the next turn to the new server, the new key never goes to the old server, and an instance with its own url and key keeps them (`:104-191`, `:168-185`). |
| `server/opencode-provider-keys.e2e.test.ts` | The server's own `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` never reach the OpenCode child (`:86-87`, `:109-110`). `PUT /api/config` `opencodeGo.providerKeys` saves keys by env name. The reply and GET show only the sorted names, never the values (`:113-121`). The saved keys reach the OpenCode child as env vars, also for a turn's process, and its model list then has the provider's models (`:122-140`). An empty string removes one key and the child restarts without it (`:144-150`). A reserved name (`OMB_CLOUD_BOAT_TOKEN`) gets 400 with an exact message and `config.json` stays the same byte for byte. `OPENCODE_API_KEY` gets "Save the OpenCode key in the OpenCode API key box instead." (`:153-162`). |
| `server/default-model-selection.test.ts` | A saved API-key provider is accepted (`:27-31`). A custom endpoint on the Claude driver ranks below the person's own plan, but alone it is chosen. A saved custom endpoint is kept even with `authenticated:false` (`:32-44`). A saved variant needs `modelVariants`. A saved effort is kept when offered, else dropped with the model kept (`:45-91`). A saved default whose provider is missing, unavailable, signed out or disabled, or whose model is gone, gives setup, never another provider (`:100-109`). A fully empty saved default counts as unset. A half-filled one gives setup (`:117-123`). With nothing saved: Claude first, then Codex. Empty catalogs are skipped (`:111-139`). A disabled engine is never chosen (`:141-148`). A ready engine beats a signed-out Claude. With nothing runnable, the first available by rank wins (`:150-159`). The ranking is the same as the welcome screen. OpenCode free is only last or alone (`:162-185`). A saved default beats ranking and tests (`:187-193`). A failed test moves the default to the best that answered. With no answer, ranking decides (`:195-210`). With Company enrolment, a signed-in personal engine beats a Company one, and policy refusals are never picked (`:213-266`). A wiring test runs the real `selectableInstances`, `defaultSelection` and `selectionContext` from `server/index.ts` (`:269-362`). New-bot effort and hidden providers (`:365-391`). |
| `server/onboarding-model-default.e2e.test.ts` | With a real server and a fake Claude CLI. Connecting a provider fills a blank starter bot and future bot defaults, in memory and in `bots.json`. A thread pinned to another model and a bot created with a chosen model keep theirs. A restart changes no saved choice (`:111-143`). A CLI that appears after start is found at the first send with no settings write (`:145-156`). A signed-out or disabled provider is never set on a blank starter (`:158-168`). A guarded send held during first-run discovery is checked again, and a change meanwhile gives 409 `guarded_permissions` or `guarded_branch` (`:170-212`). A fresh install with a signed-out Claude stays unset until the CLI is signed in (`:214-243`). |
| `server/model-providers-docs.test.ts` | Pins each workaround of the "Other model providers" docs page to the code (`:1`). Claude bots carry `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_CUSTOM_HEADERS` from `~/.claude/settings.json` (`:59-73`), but not while an Anthropic API key is saved (`:98-102`). A Claude custom endpoint has its own config folder and ignores `~/.claude` (`:104-123`). The app edits `~/.config/opencode/opencode.json`, and a provider written with a comment is lost (`:145-183`). Keys exported on a server reach every engine (`:185-199`). `CLINE_API_KEY` is scoped to Cline and OpenCode (`:201-209`). |
| `server/routes/config-engine-effect.test.ts` | Quiet fields never make engines read again (`:10-21`). Every other field, including all provider keys, `defaultModelSelection` and `automaticRecovery`, does (`:23-32`). An unknown field, `toString`, or a quiet field with the wrong shape does (`:34-53`). Engine-facing flags do (`:43-47`). Through the real PUT route, a quiet save never calls `registry.forgetSnapshots`, and a save of `groq.url` or `context` calls it once (`:141-159`). The test uses its own data folder (`:57`). |
| `server/model-catalog/presets.test.ts` | The 13 recommended presets are in the agreed order (`:12-20`). Ids are unique and match `^[a-z0-9-]{1,32}$`. Every `api` is https and normalised (`:22-37`). Every catalog preset is in the bundled snapshot (`:39-46`). 7 presets have Anthropic-compatible endpoints (`:48-61`). Codex is documented only for OpenRouter, Fireworks and OpenAI (`:63-66`). OpenRouter's key is proven at `/key` (`:68-72`). These tests cover data that the running server does not use (see 3.15). |
| `server/key-hint.test.ts` | A hint is the last 4 characters only for keys of 12 or more characters after trim (`:5-11`). Image keys get hints (`:13-18`). `withoutKeyHints` removes every `last4` at any depth and does not change the input (`:20-34`). |
| `server/setup-mode.test.ts` | `/setup` is recognised only at the start of the text, in any case (`:23-37`). A blank profile alone never turns on setup mode (`:50-66`). The prompt rules (`:68-224`). This is the `/setup` chat command, not the UI mode. |
| `src/lib/interface-mode.test.ts` | With `SIMPLE_ONLY` true, Advanced reads off and cannot be turned on, and the stored value stays (`:36-45`). The shipped value keeps the switch: Advanced can be turned on and stays on after a relaunch (`:47-57`). A fresh install defaults to Simple and stores `"0"` once. An existing install defaults to Advanced. An explicit choice wins. A failed storage write still switches for the session. Unreadable storage gives Simple (`:60-100`). |
| `src/components/SimpleModePrompt.test.ts` | Exact text and roles (dialog, aria-modal). The title matches the mode it opened in. Focus starts on the title (`:51-70`). The switch changes the app at once, stores `"0"` or `"1"`, keeps the title, sends `toggled` events and never closes the prompt (`:72-89`). It follows another tab (`:91-97`). Done, Close, Escape or a click outside close it for good and set `omb-simple-mode-prompt = "1"`, with one `closed` event (`:99-109`). Tab stays inside, and focus goes back to the opener (`:111-127`). Reduced motion is respected (`:129-133`). |

The onboarding verification doc names three of these as the check for "Providers connected after first launch". It says: "Real provider authentication and packaged native installation are not exercised by these offline fixtures." (`docs/verification/onboarding.md:58-74`).

### 6.5 Tests of the client UI for engines and accounts

The tests render the components with a mocked store or a small model of the server. No test uses a real provider sign-in or a real home folder. A manual preview script uses sample engines and rejects every install, sign-in, path and account request with HTTP 400 "Preview only: no real account or installation is changed." (`scripts/verify-engines-ui.ts:124-126`).

#### 6.5.1 The AI page of the settings

| Test file | What behaviour it guarantees |
|---|---|
| `src/components/EnginesSettings.test.ts` | ChatGPT accounts: a signed-out account shows `data-account-state="signedOut"`, "Not signed in" and one "Sign in" (34-41). A signed-in account shows its e-mail, or "Signed in" (43-49). An API-key login shows "Uses an API key" and no sign-out (51-59). `accountActions` for the built-in and added ChatGPT accounts (61-72). The workspace note shows only with a browser account (94-100). Grok uses its own device-code sign-in, never the ChatGPT card (104-132). One Add button per provider, none on a read-only or custom card, none when `authenticationUnavailableReason` is set (135-170). Antigravity e-mail, Remove only for `antigravity-*`, Sign out for every signed-in account (195-239). Company providers have no Set CLI, Sign out, Update or Add (241-257). "Install Kimi here" turns into "Update Kimi here" (259-276). A server warning shows as `data-engine-warning-notice` (278-297). API-key engines: the inline key row, then the masked key `••••••••a1b2` (318-352). Claude accounts on one card, "2 accounts · 1 signed in", "Sign-in not confirmed yet" for an absent value, and a Sign in button for both signed out and unknown (403-465). Simple mode order and the "More providers" count (467-501). |
| `src/components/EnginesSettings.hidden-providers.dom.test.ts` | Hide sends `PATCH {hidden: true}`. The provider moves to "More providers → Hidden" with "Hidden from every model list". Unhide brings it back. Neither way needs a full refresh (93-119). A refused Unhide keeps the provider hidden and shows the server message (131-140). A CLI sign-out shows the CLI line in the dialog, sends `POST .../auth/sign-out` and keeps the provider listed (161-206). No Sign out for an API-key engine (224-231). Every built-in driver stays reachable in each state: CLI missing, connected, signed out, sign-in unknown, hidden (234-271). Hide is disabled while a bot uses the account as model or as backup (319-333). |
| `src/components/EnginesSettings.antigravity.dom.test.ts` | All Antigravity accounts share one card (105-113). Add sends `{ displayName, sourceInstanceId }` and starts the sign-in of the new row at once (122-144). Two accounts can wait on Google at the same time (146-154). Cancel sends `POST .../auth/cancel` and holds the controls until the server answers (156-210). Focus moves into a new panel and back to "Sign in" after Cancel (233-289). An account with `authenticated` absent has `data-account-state="unknown"` and offers Sign in, not Install (382-389). |
| `src/components/EnginesSettings.antigravity-switch.dom.test.ts` | The "Switch to Google Antigravity CLI" offer shows only for a Classic account (79-100). A failed install puts the old path back and shows the error (119-130). While the server installs, the button reads "Downloading and verifying…" and starts no second install (140-148). |
| `src/components/EnginesSettings.added-server.dom.test.ts` | An added server is removed only after the confirm dialog, with one `DELETE` (51-61). Remove is disabled while a bot uses the server (63-69). |
| `src/components/EnginesSettings.ai-sign-in.dom.test.ts` | The chat's "AI sign-in" card lists only `claude`, `codex` and `antigravity` (54-61). A person who is not an admin sees no rows (63-72). |
| `src/components/EnginesSettings.codex-shared-setup.dom.test.ts` | The ChatGPT card shows one note that bots share the person's Codex setup but not AGENTS.md (43-49). The Claude card does not show it (51-54). |
| `src/components/EnginesSettings.hidden.test.ts` | `HiddenEngines` renders nothing when no provider is hidden (35-40). Unhide sends `PATCH {hidden: false}` and shows the returned list with no second refresh (42-54). |
| `src/components/EnginesSettings.app-copy.test.ts` | After a server install with `usingAppCopy: true`, the card turns Ready and keeps the app copy notice until Dismiss (43-54). The notice ends when Settings unmounts (56-65). |
| `src/components/EnginesSettings.gemini.dom.test.ts` | The Google AI Studio row sends the key in the JSON body of `POST /api/instances/openai-compat` (58-73). The row is not offered once a Gemini server exists, while one is hidden, or in a hosted workspace (89-117). The sponsor row order (120-233). |
| `src/components/EngineUpdateNotice.test.ts` | `serverInstall: false` gives the terminal command, not the one-click update (23-30). With `install.server`, the one-click "Update Codex here" (32-36). With no command, only the note (47-54). |
| `src/components/ProviderIcons.deepseek.test.ts` | `providerName` of `deepseekAgent` is "DeepSeek". The driver mark and the preset render the same SVG (10-20). |
| `shared/provider-icon.test.ts` | Accepts a preset and small valid PNG, JPEG and WebP data URLs (5-11). Rejects a remote URL, a forged media type, a truncated PNG and an image above 128 KB (13-19). |
| `scripts/verify-engines-ui.test.mjs` | The preview launcher only: signal handlers, cleanup on failure, shutdown order (45-107). It says nothing about engine behaviour. |

#### 6.5.2 The engine library, set-up and sign-in

| Test file | What behaviour it guarantees |
|---|---|
| `src/components/EngineLibrary.test.ts` | `engineReady`: signed in is ready, absent is ready, `false` is not ready, custom with `false` is ready, custom but unavailable is not ready (36-42). Cline stays in set-up until `authenticated === true` (44-50). The card is a closed `<details>` that keeps its children mounted (52-59). A signed-out card never shows the old e-mail (61-67). An executable name is not shown as a version (69-73). A regrouped card is not mounted again (75-88). |
| `src/state/engine-refresh.test.ts` | A failure rejects only with `reportErrors` (15-20). Two refreshes share one request, and a retry is allowed after a failure (22-36). A malformed answer does not replace the list (38-41). A hung request is released after 120 s (43-55). |
| `src/state/engine-setup-lifecycle.test.ts` | One set-up with the real store: "Set up Kimi", then a 503 that keeps the previous status, then "Sign in to Kimi" and "Sign-in required", then "Ready to use" after a window `focus`. The same `<details>` stays open (40-60). |
| `src/components/EngineSetup.refresh.test.ts` | A failed refresh shows that the previous status is still shown, and the button stays usable (31-41). The button reads "Checking" and is disabled while a request runs (43-51). A server install whose engine is still unavailable says "installer finished, but the provider is not usable yet" (53-61). An available answer says "Installation verified. Sign in if requested." (63-71). |
| `src/components/EngineSetup.test.ts` | The server's platform picks the command (11-15). A missing binary is an install, `authenticated: false` is a sign-in (27-45). A managed engine with a profile error shows the reason and "Install Google Antigravity CLI", never "CLI not found" (63-86). A quiet set-up hides the reason under "Details" (158-168). The app copy is finished in the app (204-233). ChatGPT plan shows "Continue with ChatGPT" and no `codex login` (254-266). `authenticationUnavailableReason` offers no sign-in or install (268-280). A rejected key and a missing key row (320-351). Ollama never asks for an API key (355-380). |
| `src/components/EngineSetup.antigravity.test.ts` | The redirect box shows while the flow waits (57-68). A second click opens the same link, and `/auth/start` runs once (70-76). `expired` shows "Google sign-in expired. Start again." (78-83). A `succeeded` poll refreshes the models (90-94). The Cloud and non-Cloud wording of the redirect box (96-111). The pasted-code form sends `{ flowId, callbackUrl }` (150-173). |
| `src/components/EngineSetup.cursor.test.ts` | On a Cloud, "Install Cursor here" and no "Set CLI" (47-57). An engine that a Cloud cannot install gets one line and no command (72-80). |
| `src/components/EngineSetup.kimi.test.ts` | On a Cloud, "Install Kimi here" with the command only to copy (43-50). Signed out uses the device-code sign-in in the app (52-58). |
| `src/components/EngineSetup.grok.test.ts` | Signed out uses the device-code sign-in in the app (48-57). With no CLI and no server terminal, an xAI key field in place (76-97). A paired desktop gets no button (99-103). |
| `src/components/DeviceSignIn.test.ts` | The Codex code, the official link and "Waiting for you" (18-27). A bad link is never shown, and the code is hidden (29-44). 401, 403, 404 and 410 stop an old flow (61-67). A network error, 503 and 429 stay retryable (69-73). ChatGPT plan link rules (76-109). Grok and Cursor texts and link rules (111-187). |
| `src/components/ClaudeSignIn.test.ts` | `claudeSignInLink` keeps only the allowed https hosts and refuses look-alike hosts and user info (5-16). |
| `src/components/ClaudeSignIn.interaction.test.ts` | An accepted code is the sign-in, with no status call after it (56-68). A refused code ends the flow (70-77). A code never taken keeps the flow open (79-87). A past `expiresAt` turns the flow `expired` (89-103). `autoStart` starts once (105-114). |
| `src/components/ChatGptPlanSignIn.interaction.test.ts` | The sign-in starts only on request, polls after 2,000 ms with an abort signal, and refreshes on success (51-68). An untrusted link is never opened. Cancel sends `POST .../auth/cancel` (70-81). `AddAccount` sends the trimmed name and hands back the new id (83-103). |
| `src/components/GrokSignIn.interaction.test.ts` | The sign-in starts only on request and never opens a page by itself (54-63). Cancel and "Try again" (74-102). The client timer sets `expired` at `expiresAt` (104-114). |
| `src/components/CloudEngineSignIn.test.ts` | Exact tile texts and the limits note (61-69). A picked tile opens its own set-up (71-79). The person's own engine is picked, never a custom or company one (86-94). Grok and OpenCode tile rules (96-132). A key sign-in says "Runs on your API key." (134-142). |
| `src/components/onboarding/SignInPill.test.ts` | `pillWay`: device code, paste code and ChatGPT plan give "sign-in". `callback-url` gives "dialog". A managed install comes before its sign-in. No instance gives "dialog" (13-29). |
| `src/components/onboarding/SignInPill.poll.test.ts` | The poll runs every 2 s while the server waits (74-86). Three misses at 2, 4 and 8 s end with "Lost touch with the server…" and no more polls (88-107). A request that never returns counts after 10 s (109-124). A 404 ends at once (126-139). An abort by unmount is not counted (141-154). One miss, then success, gives no error (156-170). |
| `src/components/onboarding/ConnectAi.test.ts` | A failed list check keeps the old list and shows the error (85-101). The leading order is Claude, ChatGPT, OpenCode (103-112). "Connected" only after a test message passes (156-167). A failed test shows its reason and offers the next way (169-201). A stored server result is used without a new test (203-213). The dialog closes on Escape and on a click outside (263-276). |
| `src/lib/engine-rail.test.ts` | `splitEngineRail` groups by `access` (6-24). A signed-out engine keeps its model catalog (50-72). `modelsAwaitEngine` (155-167). `signInFamily` (169-178). |
| `src/lib/engine-name.test.ts` | Only the server's default names are translated (9-18). |

## 7. Ours compared

What we have now: `bot-engine` has only `lib.rs`. The plan has the registry
in step 4, the chat API driver in step 5, the settings and the data folder
in step 6, the settings panel that takes one API key in step 7, and the ACP
driver with one adapter in step 9. We have no HTTP server (decision D10):
the window calls the core through Tauri commands. We have no account, no
sign-in flow, no status read and no `doctor`.

| Part of the reference | Reference files | Our crate and module | Step | State |
|---|---|---|---|---|
| The engine list, shadows | `server/harness/registry.ts`, `server/contracts.ts:103-119` | `bot-engine`, `registry.rs`, `config.rs` | 4 | Planned (PR 4.1 to 4.3) |
| The status read: shared read, 3 s reuse, 60 s limit | `server/harness/registry.ts:96-114`, `:285-305` | `bot-engine`, `registry.rs` | 4 | Not planned. P88 asks for limits |
| The probe hold, the back-off, the calm count | `server/harness/probe-hold.ts`, `registry.ts:594-650` | `bot-engine`, `registry.rs` | 4 | Not planned (P505) |
| The status file of the last run | `server/harness/engine-status-file.ts`, `server/index.ts:802` | `bot-core`, `data_dir.rs` (the path), `bot-engine`, `registry.rs` | 6 | Not planned (P505) |
| The readiness of an engine, three sign-in states | `server/contracts.ts:395-437`, `src/components/EngineLibrary.tsx:12-20` | `bot-engine`, `driver.rs`, `bot-desktop` | 3, 4 | P62 asks for one enum. P499 adds the sign-in state |
| The live check (one test message, 90 s) | `server/engine-check.ts` | `bot-engine`, `check.rs` | after 5 | Not planned (P500) |
| The routes of the list and the accounts | `server/routes/instances.ts` | `bot-desktop`, Tauri commands, `bot-core`, `accounts.rs` | 7, later | Not planned. D10: no HTTP |
| Named accounts and engine homes | `server/claude-accounts.ts`, `server/engine-homes/`, `server/drivers/codex-account-home.ts` | `bot-core`, `settings.rs` (the entries), `bot-engine`, each adapter | 9, later | Not planned (P501, P502, P504). P103 asks for a home that the app owns |
| The device code controller and its parsing | `server/drivers/device-auth.ts`, `shared/device-sign-in.ts` | `bot-engine`, `sign_in.rs` (no I/O for the parsing) | 9 | Not planned (P503, P511) |
| The sign-in session, its owner and expiry | `server/provider-auth-sessions.ts` | `bot-core`, `sign_in.rs` | 9 | Not planned (P503) |
| Sign-in resume | `server/host/sign-in-resume.ts` | `bot-core`, the store | new step of P462 | P462 |
| The ChatGPT plan (an OAuth client of the server) | `server/drivers/chatgpt-plan-auth.ts`, `codex-plan-token.ts` | none | none | Not planned |
| The Antigravity account | `server/drivers/antigravity-*.ts` | none | none | Not planned |
| API keys and their check | `server/provider-key-check.ts`, `server/routes/config.ts:496-627`, `server/config.ts:1107-1133` | `bot-engine`, `chat/key_check.rs`, `bot-core`, `settings.rs` | 5 to 7 | The key is planned (PR 5.6, 7.6). The check is not (P506) |
| The gateway as a custom endpoint | `server/agent-endpoint-models.ts`, `routes/instances.ts:208-226` | `bot-engine`, `chat/` | 5 | Our chat driver takes any address. Model discovery is not planned |
| The default model | `server/default-model-selection.ts`, `shared/ai-ranking.ts`, `server/tested-ai.ts` | `bot-core`, `defaults.rs` | later | Not planned (P510) |
| `doctor` | `server/doctor/`, `server/headless/commands.ts`, `server/headless/host-doctor.ts` | `bot-cli`, `doctor.rs` | later | Not planned (P514) |
| `engine set` of the headless CLI | `server/headless/engine.ts` | `bot-cli` | later | Not planned |
| The UI mode (Simple and Advanced) | `src/lib/simple-only.ts`, `src/lib/interface-mode.ts` | `bot-desktop` | none | We have one layout (D16). P513 |
| The AI page, the engine library, the sign-in components | `src/components/EnginesSettings.tsx`, `EngineAccounts.tsx`, `EngineLibrary.tsx`, `EngineSetup.tsx`, `DeviceSignIn.tsx`, `ClaudeSignIn.tsx` | `bot-desktop`, `ui/src/features/settings/` | 7, later | Step 7 has one key field. The rest is not planned |

Where we differ by design, and the decision:

1. We have no HTTP routes (D10). The checks of the routes that protect a
   sign-in from a phone or a remote browser
   (`server/routes/instances.ts:319-321`, `:372-379`) have no equivalent.
   The owner of a sign-in flow is the one window of the desktop.
2. We have one person (D10). The Team Cloud engine homes and the copies of
   the team's sign-in files (`server/engine-homes/sign-ins.ts`) are out of
   scope.
3. The reference project keeps keys in `config.json` or in the store of the
   desktop OS (`server/config.ts:771-815`). P19 asks for the keychain only.

## 8. Where we can be better

Each point has a reason. A point that answers a problem of section 5 of
[`changelog.md`](../changelog.md) names it.

The problems of `changelog.md` section 5 that the reference repaired in
this feature up to `e1cc6a290`:

| Problem | What the reference repaired | Commit, tag or after | File and line |
|---|---|---|---|
| A turn or a wait that does not end | On a Cloud home, a refused or cut-short sign-in no longer sits on "Waiting…". It says why, and the person can start again at once (v0.1.186) | `46f016125`, `94a1a6d1f`, tag | `server/provider-auth-sessions.ts:133-140`, `:178-185`; `src/components/DeviceSignIn.tsx:102-106` |
| Sign-in to an engine, and engine CLIs that change | Cursor no longer clears its own sign-in when a session starts (v0.1.186). Devin 3000.15+ refuses `session/new` until `authenticate` carries the key, and the driver now sends it (v0.1.186). An older Claude CLI starts a new session when the instructions change (v0.1.186) | `73f557e06`, `e1f1140f6`, `5638d70a4`, tag | `server/drivers/acp/core.ts:1086-1089`; `server/drivers/acp/devin.ts:48-58`; `server/drivers/claude.ts:941-950` |
| The size of the tool list of one turn | A compacted Gemini tool list keeps the item type of each list field, so Gemini does not refuse the request (v0.1.186) | `08fc34c51`, `b66e84ee3`, tag | `server/tool-schema-profile.ts:252-292`; `server/tool-list-budget.ts:102-114` |
| A secret or an access right in the wrong place | The Devin API key is kept out of the native log. A member gets an engine list with no accounts, paths or addresses (after the tag) | `ae38437b7`, tag; `d48ce8033`, after | `server/drivers/acp/tool-log.ts:41-44`; `server/routes/instances.ts:76-83` |

The repairs that stay open: a desktop keeps a refused sign-in open until a
read or the 15-minute expiry (`server/provider-auth-sessions.ts:175-177`).
The Cursor memory one-shot can still send `cursor_login`
(`server/drivers/acp/core.ts:1454`). Section 3.10 and the section "Changes
up to `e1cc6a290` (v0.1.186)" have the details.

1. **One sign-in state type with "unknown".** The engines of the reference
   project treat a check that cannot finish in opposite ways:
   - Grok counts a timeout or an unknown answer as signed in
     (`server/drivers/acp/grok-sign-in.ts:19-23`, `:56-61`). Copilot counts
     each failure that is not a sign-in failure as signed in
     (`server/drivers/acp/copilot.ts:25-31`, `:117-146`).
   - Cursor returns false after two failed status commands
     (`server/drivers/acp/cursor.ts:298-311`). Kimi, Cline and DeepSeek
     count a read or parse error as signed out (`kimi.ts:43-50`,
     `cline.ts:138-141`, `deepseek.ts:124-128`).
   - Claude and the native Antigravity CLI leave `authenticated` out
     (`server/drivers/claude-auth-status.ts:5-36`,
     `server/drivers/antigravity-native-status.ts:39-43`).
   - Codex shows an unknown status text as not signed in, but lets a turn
     run (`server/drivers/codex-login.ts:22-74`).

   The registry adds a probe hold on top (`server/harness/probe-hold.ts`),
   but it sees only what each driver gives. A type with three values
   (`SignedIn`, `SignedOut`, `Unknown`) makes "unknown" a value that the
   compiler asks each driver to give. A contract test runs on each driver.
   Changelog problem: "Sign-in to an engine, and engine CLIs that change"
   (v0.1.177, v0.1.178). P499.
2. **"Signed out" is a typed refusal of the driver, not a match of words.**
   The live check finds "signed out" with a regular expression on the error
   text (`server/engine-check.ts:14`). A CLI that changes its words gives
   "other". The sign-in errors of Antigravity are also found by words
   (`server/drivers/antigravity.ts:113-130`). Our `DriverError` (PR 3.2)
   can have a `SignedOut` variant that each adapter makes from its own
   protocol. The same problem as point 1. P500.
3. **No sign-in token next to an engine home.** The refresh token of a
   ChatGPT plan is in `providers/chatgpt-plan/<sha256(id)>/credentials.json`.
   The `CODEX_HOME` of each turn of that plan is the folder `codex` in the
   same place (`server/drivers/codex-account-home.ts:14-21`,
   `server/drivers/chatgpt-plan-auth.ts:110`). The lead checked the bot box:
   - In the box, the data folder is replaced by an empty folder, and only
     the named folders come back (`server/bot-box/plan.ts:255-265`). An
     engine home in the data folder comes back only as itself, by the
     variables of `PATH_ENV_NAMES` (`server/bot-box/plan.ts:204`,
     `:303-309`). So the box hides the parent folder and its
     `credentials.json`. An Antigravity turn gets back only its own profile
     through `GEMINI_HOME`. The profiles of the other accounts stay hidden.
   - The sign-in masks hide the sign-in files of other engines and other
     accounts in the server's `HOME`. They do not cover the data folder
     (`server/bot-box/sign-in-masks.ts:1-4`, `:33`, `:52-57`). This is the
     v0.1.181 change: "each bot reaches only its own AI account's sign-in".
   - The box uses bubblewrap mounts (`server/bot-box/plan.ts:408-412`).
     With no box, a bot's shell runs as the same user as the server, and the
     whole data folder is in reach anyway (security model).

   So the reference has no confirmed failure here. A separate folder for
   the tokens is a cheap guard if a later change puts back the parent
   folder. This is a judgment call. P502.
4. **Each sign-in flow ends on the server, and the window cancels a flow
   that it leaves.**
   - The sign-in sessions expire after 15 minutes, but no timer removes
     them (`server/provider-auth-sessions.ts:41`, `:150-152`).
   - The first-screen pill has no Cancel. A pill that the person leaves
     keeps the login process of the server until its expiry
     (`src/components/onboarding/SignInPill.tsx:117-158`). An account that
     leaves the list drops its sign-in with no cancel call
     (`src/components/EngineAccounts.tsx:372-376`).
   - While any sign-in runs, the restore of a workspace, the move of the
     data and the maintenance wait, up to 15 minutes
     (`server/index.ts:9350`, `:11892`, `:15115`).
   - The Google sign-in poll has no client limit
     (`src/components/EngineSetup.tsx:314-348`).
   - At `e1cc6a290` (commit `46f016125`, v0.1.186) the reference repaired a
     part, on a Cloud home only: a refused code or an exited login ends the
     session at once, the `active` getter records a flow past its expiry,
     and a flow that a stop cut short answers `interrupted`
     (`server/provider-auth-sessions.ts:51-70`, `:133-140`, `:178-185`).
     There is still no sweep timer, a desktop keeps the old behaviour
     (`:175-177`), and a flow that the person leaves still holds `active`
     until its 15-minute expiry (`server/sign-in-trace.test.ts:41`).

   Changelog problem: "A turn or a wait that does not end" (v0.1.124: "A
   sign-in card for an app no longer waits forever"; v0.1.186: a refused AI
   sign-in on a Cloud no longer sits "on "Waiting…""). P503.
5. **The files of the person that a server engine home gets are an allow
   list.** The Codex shared home links each file of the person's Codex
   home into each server Codex home, except a deny list
   (`server/drivers/codex-shared-home.ts:14-33`, `:107-115`). A new file
   that a new Codex version writes is linked too. In four cases the turn
   runs in the person's own home and reads the person's `AGENTS.md`:
   - the person's home has no `auth.json`.
   - the login is in the keyring.
   - a link fails.
   - the server home cannot be made.

   The source is `server/drivers/codex-shared-home.ts:145-158`. Changelog
   problem: "The person's own engine config reaches the bots" (v0.1.170,
   v0.1.175: "Codex bots no longer load your own `AGENTS.md`."). P504.
6. **The capability flags of a driver replace the checks by driver name.**
   The readers found checks by name in the server and in the window:
   - the server: `server/harness/registry.ts:137`,
     `server/cli-probe.ts:12-18`, `server/routes/instances.ts:447`,
     `:499-501`, `:510`, `shared/ai-ranking.ts:21-30`.
   - the window: `src/components/EngineLibrary.tsx:15-17`,
     `src/components/DeviceSignIn.tsx:21-28`,
     `src/components/EngineSetup.tsx:40-42`, `:276-286`,
     `src/lib/engine-rail.ts:26-32`.

   Our `AGENTS.md` forbids such checks. This answers no release problem
   directly. It is the rule of `AGENTS.md`. P507.
7. **A failed read of the sign-in resume file keeps the old file.** A read
   or parse error leaves the lists empty, and the next save writes over the
   file (`server/host/sign-in-resume.ts:89-117`). The saved messages of the
   person are lost. Changelog problem: "A file written over after a failed
   read" (v0.1.103, v0.1.107, v0.1.151). New facts for P462.
8. **The keys of an engine process come from an allow list.** Two paths
   give a key to an engine that the person may not expect:
   - On a server, not on the desktop, an added OpenAI-compatible server
     with its own address and no key of its own reads the workspace key
     from the process environment, and sends it to its own address
     (`server/drivers/openai-compat.ts:205-216`,
     `server/credential-env.ts:62-68`). This is by design: the docs say
     "An engine without a key uses the key from Connections and sends it to
     that engine's address"
     (`apps/docs/content/docs/providers/model-providers.mdx:122-123`). It
     is still a risk, because the key goes to a host that its vendor does
     not run.
   - Keys that are exported in the shell of the server reach every engine.
     The docs name this as an open risk
     (`server/model-providers-docs.test.ts:185-199`).

   Changelog problem: "A secret or an access right in the wrong place".
   New facts for P61.
9. **No synchronous process in a status check.** The sign-in check of
   Mistral Vibe runs `security find-generic-password` synchronously, with
   a 2 s limit, so it can stop the event loop for 2 s at each check
   (`server/drivers/acp/mistral-vibe.ts:52-66`). It also reads one keychain
   entry that all Vibe instances of the user share. Changelog problem: "One
   slow or stuck part blocks all the others". In Rust, a blocking call in
   an async task has the same effect. P499 adds a rule for it.
10. **The status file checks its version.** The status file has `"v":1`,
    but the read does not check it (`server/harness/engine-status-file.ts:98-114`).
    A newer file is read as if it were version 1. This answers no release
    problem. It is a judgment call. P505.

The problems of section 5 that the reference project has here:

| Problem | In this feature | Where |
|---|---|---|
| Sign-in to an engine, and engine CLIs that change | Yes. Each engine finds "signed in" in its own way, and a brief failure counts as signed in or signed out by engine. The patterns are written for named CLI versions, with no version gate. The registry holds a read that cannot finish | Point 1, `shared/device-sign-in.ts:14-114`, `server/harness/probe-hold.ts:34-73` |
| A secret or an access right in the wrong place | Mostly answered. The status file keeps display fields only. Named Claude accounts lose the OAuth keys of the parent. The CLI test gets no credentials. The bot box masks the sign-ins of other engines and accounts. But see point 8 | `server/harness/engine-status-file.ts:35-60`, `server/drivers/claude.ts:119-135`, `server/cli-probe.ts:61-66` |
| One slow or stuck part blocks all the others | Mostly answered: each read has 60 s, one read is shared, the start read moves on after 5 s. The 60 s limit stops only the wait. See point 9 | `server/harness/registry.ts:96-114`, `:369-402` |
| A turn or a wait that does not end | Partly: each flow has 30 s to give a code and 15 minutes of life. See point 4 | `server/drivers/device-auth.ts:137-141` |
| A file written over after a failed read | The accounts file is safe: `config.json` refuses a save after a failed read and keeps 10 dated copies. The sign-in resume file is not (point 7) | `server/config.ts:884-990`, `server/config-backup.ts:41-79` |
| The person's own engine config reaches the bots | Yes for Codex (point 5). Claude takes only the auth keys of the account's `settings.json` | `server/drivers/claude.ts:139-181` |
| A feature added, then removed or reversed | Yes. The UI mode changed four times (v0.1.94, v0.1.151, v0.1.152, v0.1.182). The Antigravity driver was replaced two times. A backup engine never takes over at a usage limit with another sign-in of the same subscription | `src/lib/simple-only.ts`, `apps/docs/content/docs/providers/antigravity.mdx:20-24`, `src/lib/engine-rail.ts:57-67` |
| Process control on Windows | Yes. A sign-in process is stopped as a group on POSIX, but only the child on Windows. The records of engine processes are off on Windows | `server/drivers/device-auth.ts:373-386`, `server/engine-records.ts:148` |
| Usage and cost numbers corrected | Only where an account changes them: a key of the parent is removed so that a subscription login is not billed as an API key | `server/drivers/claude.ts:133-135`, `server/drivers/codex.ts:228-229` |

## 9. Not verified

- The bot box: the lead read `server/bot-box/sign-in-masks.ts` completely
  (70 lines) and `server/bot-box/plan.ts` in the ranges 204, 224-265,
  300-312 and 408-412 (section 8, point 3). Not read: the two test files
  of the masks, the rest of `plan.ts`, and where the server decides to use
  the box. So the platforms on which a bot runs in the box are not
  confirmed here. The box uses bubblewrap, a Linux tool.
- The scope gate before the routes of the list: which members or admins
  may call each `/api/instances` route. The readers confirmed that a local
  caller with no session reaches only GET `/api/health/engines`
  (`server/request-auth.ts:42-60`), and that the settings change only
  through an admin (`server/request-auth.ts:535-542`). The full allow
  lists were not read.
- `server/procs.ts`: `spawnCli`, `killCliTree`, `cliVersionReader` and
  `CLI_VERSION_TIMEOUT_MS`. If `spawnCli` makes a process group, which the
  group kill of `device-auth.ts:373-386` needs.
- The full lists `PROVIDER_CREDENTIAL_ENV`, `WORKSPACE_CREDENTIAL_ENV` and
  `OPENCODE_PROVIDER_ENV` of `server/credential-env.ts`. Only lines 55-78
  were read.
- The `snapshot()` of each driver outside the account and sign-in ranges.
  (At `e1cc6a290`, the sign-in of Devin with an API key is in the section
  "Changes up to `e1cc6a290` (v0.1.186)".)
  The engines Pi, OMP, Hermes, Droid, Devin, Kiro and Command Code were not
  read.
- The fake CLIs `fake-kimi-login-cli.ts`, `fake-cursor-login-cli.ts` and
  `fake-acp-cli.ts`.
- `server/config-backup.ts` lines 101-195 (the listing, the keep rule and
  the restore of the backups).
- The other callers of `registry.describe` in `server/index.ts` (lines
  2475, 2485, 2772, 3508, 13273, 14526).
- `server/headless/client.ts` and `saved-servers.ts`: the time limit of the
  HTTP calls of the server doctor, the exit code of the server doctor when
  a read fails with no `--wait` (the error goes to the client error
  handling, `server/headless/commands.ts:91`), and the file and mode of a
  saved CLI sign-in.
- What each of the 61 UI files that read `useAdvancedMode` hides in Simple
  mode.
- That the 16 presets of `server/model-catalog/presets.ts` are not used
  rests on a search for "model-catalog". An import by another spelling is
  not found by that search.
- Live behaviour of the vendors (consent pages, quotas, real CLI output).
  The fake CLIs record what the reference project measured.
- Non-English texts of the window.
- The update to `e1cc6a290` (2026-11-28):
  - `server/sign-in-trace.ts` was read only in parts.
  - Nobody checked if a client other than `DeviceSignIn` and
    `ClaudeSignIn` (for example `SignInPill` or `ManagedEngineSetup`) reads
    the new `reason`.
  - The lines of the tests of `1c82a0f0c` and `8f5f6889d` were not found.
  - The Responses API path of the continued reply (`9a8c5667c`) and the
    call sites of `withoutResultImages` were not read.
  - Nobody checked when the reference project runs a Cursor memory
    one-shot.
