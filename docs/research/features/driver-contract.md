# The driver contract of the reference project

Read on 2026-11-23 for step 3 of [`../../plan/README.md`](../../plan/README.md)
(the `Driver` trait, capability flags and a fake driver, crate `bot-engine`).
The reference project was at commit `d6660e2`. All paths are in the
reference project. Nobody opened its `enterprise/` directory.

This file replaces the short note from before batch 1. It keeps sections 1
and 5 of that note (the three layers, and how the server uses the contract),
checked again at `d6660e2`. Other research files already cover parts of this
feature. This file does not repeat them:

| File | What it covers | What this file adds |
|---|---|---|
| [`newer-config-unavailable.md`](newer-config-unavailable.md) | The registry, shadows, the six wrappers, the config | The contract of `create` and `decodeConfig`. That `dispose` and `disposeAll` have no limit. The client view of the flags (section 5) |
| [`event-bus-fold.md`](event-bus-fold.md) | The bus, the log, the fold | The terminal events of each driver, and the events that come before `sendTurn` returns |
| [`chat-streaming.md`](chat-streaming.md), [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md) | The chat driver | The chat driver only as one of five implementations of the contract, for comparison |
| [`queue-and-steer.md`](queue-and-steer.md) | Steer and the queue | Three new facts: a Codex question answer that reports "indeterminate" as "answered" (`server/drivers/codex-questions.ts:35-40`), a 409 with no stored row after "steered" (`server/index.ts:7211-7216`), and Claude "steered" on a pipe write (`server/drivers/claude.ts:1796-1815`) |
| [`chat-turns.md`](chat-turns.md) | One turn from send to reply | The busy check in each driver, and the race behind it |
| [`../turn-flow-comparison.md`](../turn-flow-comparison.md) | The events of the chat driver, in order | The same flow in the other four drivers: when `sendTurn` returns, the busy check, the stop outcome of each driver, and the waits with no limit |

## 1. In short

The reference project runs about 31 kinds of AI engine behind one interface.
A **driver** is the code for one kind of engine (for example the Claude CLI,
Codex, or an engine that speaks ACP). The server never talks to an engine
directly. It calls the methods of the driver contract, and it receives
events. Our step 3 builds the same thing in Rust: the `Driver` trait in
`bot-engine`.

Terms used in this file:

- **The contract**: the TypeScript interfaces in `server/contracts.ts`. Line 1
  says that they are ported from an upstream design "with Promises for Effect
  and listeners for Stream".
- **Driver, instance, adapter**: the three layers of the contract.
  - `ProviderDriver` (`contracts.ts:640-657`) is one kind of engine. It decodes
    a config and creates instances.
  - `ProviderInstance` (`contracts.ts:597-632`) is one configured engine, for
    example "Claude (work)". It has the models, a status read (`snapshot`) and
    `dispose`.
  - `ProviderAdapter` (`contracts.ts:253-364`) runs turns. It has the
    capability flags, `sendTurn`, `interruptTurn`, `respondToRequest`, an
    optional `steer`, `hasSession`, `stopAll` and `onEvent`.
- **A turn**: one request to the engine and all its work until the reply
  ends. A thread has at most one turn at a time (section 3.3).
- **A capability flag**: a field of `adapter.capabilities`
  (`contracts.ts:255-310`). The server reads it to decide what the engine can
  do, for example `queueing` (it can take a steer) or `effortLevels`.
- **Steer**: text that the person sends while a turn runs, given to the
  running turn. The result is `steered`, `refused` or `indeterminate`
  (`contracts.ts:324-329`, `:382`).
- **A request**: a question from the engine to the person, for permission
  for a tool or for an answer. The driver emits `request.opened`. The server
  answers with `respondToRequest`.
- **ACP**: Agent Client Protocol, JSON-RPC over the standard input and output
  of an engine CLI. One shared driver core (`server/drivers/acp/core.ts`)
  serves 18 engines.
- **A shadow**: what the registry keeps for an instance that it cannot
  create. It has no adapter. The UI shows it as "unavailable".
- **The fake driver**: `server/testing/fake-driver.ts`, a driver in memory for
  the registry and bus tests.
- **The fake engine**: `server/testing/fake-claude-cli.ts`, a program that acts
  as the Claude CLI. Environment variables script it. Release v0.1.71 made it
  scriptable (commit `cf838aae3`: "scriptable fake engine tool calls and
  FAKE_CLAUDE passthrough").

**The main findings.**

1. The contract has no flag for streaming, interrupt or approvals.
   `interruptTurn`, `respondToRequest` and `onEvent` are mandatory for each
   driver (`contracts.ts:311-334`). The 26 flags are about mounts of tools,
   images, effort, steer, resume and guests. Our plan (PR 3.2 and PR 3.5)
   names flags that the reference does not have.
2. The methods do not mean the same thing in each driver.
   - `sendTurn` returns after the prompt is written (Claude), before the
     process starts (Codex), or after the handshake (pi).
   - `interruptTurn` ignores the turn id in four of five drivers. Only the
     chat driver checks it (`server/drivers/openai-chat.ts:961-966`).
   - A stop ends as `ok: true` "cancelled" in pi and ACP, and as `ok: false`
     "interrupted" in Claude.
3. Each driver refuses a second turn on a thread with the same untyped
   `Error("a turn is already running on this thread")`. In Claude and ACP,
   awaits come between the check and the write of the busy state. Only the
   claim of the host, made before its first await, prevents a race.
4. The contract says that behaviour is gated by flags. But the code has
   about 22 decisions by driver name, and two tables by driver name: one for
   resume (`server/runtime/capabilities.ts:17-49`) and one for approval levels
   (`packages/phone-protocol/src/approval-mode.ts:22-45`).
5. Some parts of the contract are dead. No code constructs `ProviderError`.
   No code reads the one mandatory flag, `sessionModelSwitch`. `hasSession`
   and `stopAll` have no caller in the host.
6. No contract test runs against all drivers. The fake driver returns the
   same turn id, `"fake-turn"`, for each turn and emits no event
   (`fake-driver.ts:79`).

## 2. Files read completely

Six subagents read the files, one for each group. I checked the key
findings against the code: the lines that this file cites for the contract,
the busy checks, the stop paths, the fake driver, the registry view of the
flags, the name tables and the steer gate in the UI.

**The contract and its documents.** `server/contracts.ts` (663),
`server/runtime/capabilities.ts` (66) and its test (99),
`server/drivers/acp/capabilities.ts` (23), `server/drivers/builtIn.ts` (66),
`server/drivers/native.ts` (118), `packages/phone-protocol/src/runtime-events.ts`
(213), `docs/runtime-contract.md` (144), `docs/custom-engines.md` (235),
`shared/runtime-events.ts` (1), `packages/phone-protocol/src/turn-progress.ts`
(68), `packages/phone-protocol/src/approval-mode.ts` (112),
`server/runtime/level.ts` (37) and its test (94),
`server/harness-capabilities.ts` (60), `server/turn-context.ts` (81),
`server/drivers/claude-auth-recovery.ts` (105),
`server/drivers/acp/startup-recovery.ts` (21), `server/drivers/retry.ts` (258).

**The ACP core.** `server/drivers/acp/core.ts` (1611, in two ranges, 1-800
and 800-1611), `acp/host.ts` (374), `acp/steer.ts` (190) and its test (161),
`acp/turn-state.ts` (138) and its test (114), `acp/driver-hooks.ts` (119),
`acp/rpc-error.ts` (51) and its test (54), `acp/custom.ts` (55),
`acp/config-decode.ts` (13), `acp/host.test.ts` (91),
`acp/shared-process.test.ts` (371), `acp/tool-log.ts` (71),
`server/engine-stop.ts` (21).

**The other drivers.** `server/drivers/claude.ts` (2016, in five ranges),
`server/drivers/codex.ts` (1585, in four ranges), `server/drivers/pi.ts`
(1014, in four ranges), `server/drivers/engine-errors.ts` (234),
`codex-errors.ts` (147), `codex-process.ts` (132), `claude-limits.ts` (130),
`codex-update.ts` (38), `codex-login.ts` (66), `codex-mcp-mount.ts` (77),
`codex-questions.ts` (58), `pi-session.ts` (29),
`shared/tool-scope-support.ts` (24).

**The callers.** `server/harness/registry.ts` (595), `server/tested-ai.ts` (346),
`server/default-model-selection.ts` (99), `server/host/room-sessions.ts` (404),
`server/engine-check.ts` (65), `server/member-turn.ts` (27),
`server/automatic-recovery.ts` (33).

**The fakes and the tests.** `server/testing/fake-driver.ts` (100),
`server/testing/registry.ts` (49), `server/runtime/testing/fake-runner.ts` (343),
`server/runtime/testing/fake-clock.ts` (28), `server/testing/stream-script.ts`
(72), `server/testing/fake-claude-cli.ts` (1415, in two ranges),
`server/harness/registry.test.ts` (789), `server/harness/registry-start-read.test.ts`
(248), `evals/providers/mock/scripted-plan.ts` (47) and its test (53),
`scripts/control-omb.ts` (556), `server/testing/events.ts` (46),
`server/testing/live-reply-cases.ts` (59), `server/testing/room-handoff-agent.ts`
(269), `server/testing/fakes-self-contained.test.ts` (45),
`fake-claude-cadence.test.ts` (54), `fake-claude-dump.test.ts` (138),
`server/testing/oversized-tool-schema.ts` (80), `server/testing/host-timeout.ts`
(10), the six `*-clock-hooks.mjs` files (16 to 30 each),
`server/harness/text-items.testkit.ts` (53), `server/drivers/capability-fields.test.ts`
(84), `server/drivers/acp/live-reply-matrix.test.ts` (81),
`server/drivers/acp/approval-matrix.test.ts` (125),
`server/drivers/claude-live-reply.test.ts` (55),
`server/drivers/tool-scope-coverage.test.ts` (18).

**The UI.** `DESIGN.md` (420), `server/routes/instances.ts` (597),
`src/components/Composer.tsx` (980), `ComposerQueuedMessages.tsx` (173),
`composer-simple.ts` (87), `shared/follow-up.ts` (37), `src/lib/follow-up.ts`
(72), `PendingApproval.tsx` (373), `src/lib/stop-turn.ts` (106),
`src/state/turn-status.ts` (123), `thread-approval.tsx` (60),
`model-picker-reasoning.ts` (61), `ModelPicker.tsx` (1017),
`ModelPickerBusyMenu.tsx` (25), `src/lib/approval-mode-options.ts` (83),
`EngineLibrary.tsx` (134), `src/lib/engine-rail.ts` (67),
`EnginesSettings.tsx` (602), `EngineSetup.tsx` (737).

**Read in ranges, or with long lines cut.** A file in this list was not read
completely. Its facts are marked with the range.

- `server/index.ts` (15,276): all of `beginTurn` (7424-8521) at full width.
  These ranges with each line cut at 300 to 700 characters: 1380-1392,
  2175-2275, 2484-2494, 2560-2656, 2720-2736, 3746-3756, 4236-4250,
  4362-4372, 4733-5060, 5756-5770, 5895-6100, 6925-7260, 8599-8900,
  9062-9072, 9485-10500, 11695-11895, 15220-15240.
- `server/drivers/acp/acp.test.ts` (3727): 1-120, 243-467, 1225-1253,
  1609-2067, 2194-2686, 2759-3727.
- `server/procs.ts` (735): 406-436, 472-542, 600-735.
- `server/drivers/openai-chat.ts` (999): 200-219, 510-549, 940-999.
- `server/engine-memory.ts` (929): 45-58, 820-929.
- `server/turn-dispatch-guard.ts` (178): 11-51, 105-170.
- `src/state/store.tsx` (3278): 380-520, 1010-1110, 1300-1360, 1595-1630,
  1725-1745, 2285-2345, 2415-2515, 2725-2835, 3175-3245, lines cut at 500
  to 600 characters.
- `server/routes/bot-messages.ts` (872): 380-440, 670-872, lines cut at 450
  to 500 characters.
- Lines cut at 330 to 400 characters: `ComposerSendButton.tsx` (79),
  `EngineAccounts.tsx` (360), `DeviceSignIn.tsx` (271),
  `ApprovalModeSelector.tsx` (202), `ModelSection.tsx` (163),
  `ModelPickerFull.tsx` (211), `SimpleModelMenu.tsx` (354),
  `simple-model-menu.ts` (235).
- Small ranges: `server/drivers/acp/quiet-status.ts` (17-37, 325-370),
  `server/tool-count-limit.ts` (92-120), `server/runtime/types.ts` (60-80,
  237-386), `server/runtime/runtime.test.ts` (12-77), `server/workspace.ts`
  (1-40), `server/routes/channels.ts` (535-630), `src/components/ChatView.tsx`
  (160-215, 995-1040), `src/components/ActivityPanel.tsx` (55-110),
  `src/lib/inspector.ts` (85-115).

## 3. How it works

### 3.1 The three layers (checked: `contracts.ts:253-364`, `:597-657`)

1. `ProviderDriver<Config>` (`:640-657`) has `driverKind`, `metadata`
   (`displayName`, `supportsMultipleInstances?`, `access?`, `cliVersion?`),
   `install?`, `models`, `decodeConfig`, `defaultConfig` and `create`.
   - `decodeConfig` "throw[s] on invalid (→ shadow)" (`:651`).
   - `create` "must reject, never throw synchronously" (`:655`). The registry
     catches both a throw and a rejection (`registry.ts:207-219`), so this rule
     has no effect.
2. `ProviderInstance` (`:597-632`) has the models and the model refresh
   (`:602-612`), `snapshot()`, the optional sign-in hooks (`:613-622`), the
   one-shot calls `generateText?`, `generateMemoryText?` and
   `reviewPermission?` (`:626-630`), `dispose()` (`:631`) and `adapter`.
   `reviewPermission` is separate "so no security capability is inferred from
   a generic helper" (`:629`).
3. `ProviderAdapter` (`:253-364`) has `provider`, `capabilities`, and these
   methods:
   - `sendTurn(input): Promise<{turnId}>` (`:311`)
   - `interruptTurn(threadId, turnId?)` (`:312`)
   - `respondToRequest(threadId, requestId, {behavior, message?, always?})`,
     which "never throws for a vanished ask" (`:313-323`)
   - `steer?(threadId, text, images?)` (`:324-329`)
   - `hasSession(threadId)`, `enginePid?(threadId)`, `stopAll()`,
     `onEvent(listener)`, which returns an unsubscribe function (`:330-334`)
   - optional extras: `cacheKeepWarm`, `compactSession`, `prestart`,
     `contextBreakdown` (`:339-363`).
4. The 31 built-in drivers are in `server/drivers/builtIn.ts:34-66`.
   - 18 use the ACP core (`createAcpDriver`).
   - 9 use the chat runtime (`createOpenAIChatRuntime`).
   - 4 have their own protocol: `claudeAgent` (stream-json), `codex`
     (app-server JSON-RPC), `piAgent` (RPC) and `museCode` (an SDK).
   - The family of each driver comes from a search for the factory name.
     The driver files of the 27 small drivers were not read.

### 3.2 Create an instance (checked: `registry.ts:198-206`)

1. The registry disposes an old instance with the same id (`registry.ts:178`).
2. An unknown driver name gives a shadow (`:179-192`).
3. `decodeConfig(entry.config)`, or `defaultConfig()` when the entry has no
   config (`:194`).
4. `driver.create(...)` inside six wrappers: `withTurnScope`,
   `withEngineMemory`, `withBotMemoryCap`, `withEngineHomes`,
   `withUnaskedStops`, `withLocalContext` (`:198-204`). Then `shareSnapshot`
   (`:205`) and an optional `decorate` (`:206`).
5. A throw or a rejection in step 3 or 4 gives a shadow with
   `reason: e.message` (`:207-219`).
6. Claude, Codex and pi start no engine process at create. For the ACP core
   this was not checked. Claude and pi wait for the
   model catalog (`claude.ts:731-736`, `pi.ts:373-378`). The ACP core keeps the
   model refresh as a promise, and `sendTurn` awaits it (`acp/core.ts:357-366`,
   `:913`).
7. The ACP core builds the environment of the child process from all of
   `process.env`, then deletes a list of known credential keys
   (`acp/core.ts:333-346`). This is a deny-list.

### 3.3 Send a turn

The common rule: one turn for each thread. Each driver has a map `active`
from thread to turn, and refuses a second turn with an untyped error:

| Driver | Check | Busy state written | Awaits between |
|---|---|---|---|
| ACP | `acp/core.ts:922`, again at `:1022` on the new-session path | `:1105` | `:937` (sign-in check), `:961` (command). The await at `:1020` is before the second check |
| Claude | `claude.ts:951` | `:1168` (warm process) or `:1784` | `:990` (model), `:992-993` (CLI version), `:1162` (tool list), and more on the path to `:1784` |
| Codex | `codex.ts:408` | `:420` or `:1169` | not read (see section 9) |
| pi | `pi.ts:413` | `:589` | none |
| chat | `openai-chat.ts:518` | not read | not read |

The host prevents the race. `beginTurn` checks `threadBusy` at
`index.ts:7504` and sets `directTurnDispatchClaims` at `:7658`, with no await
between them. `threadBusy` reads that claim (`:2179-2181`). Room turns check
`bot.busy` two times (`:9562-9577`, `:9780-9794`). So the driver race is
latent: a second caller without these checks gets it.

**Flow of `sendTurn` in the ACP core** (`acp/core.ts:911-1476`):

1. Wait for the model refresh and for the background work of the thread.
   Check that the instance is not shutting down (`:912-914`).
2. Parse the tool scope. On an error, throw (`:915-920`).
3. Busy check: throw (`:922`).
4. The approval mode of the turn overrides the `fullAuto` config
   (`:923-925`). Local computer control with `fullAuto` but without an
   explicit "full" mode throws (`:926-929`).
5. If the engine must be signed in before the spawn and it is not: emit
   `turn.started`, `runtime.error {setup: true}`, `turn.completed {ok: false,
   stopReason: "auth_required"}`, and return `{turnId}` (`:933-945`). No
   throw.
6. If the command cannot be resolved: the same three events with
   `"setup_required"` (`:958-974`).
7. Build the process contract (command, arguments, a hash of the environment,
   the folder) and the session key (`:977-1001`). The session key is the
   MCP server list, with its tokens, as JSON text in memory.
8. Reuse a pooled session with the same contract, or close it and wait for
   admission, then check busy again (`:1007-1025`).
9. Write `active`, emit `turn.started`, and run the rest in a detached block
   (`:1105-1109`).
10. The detached block:
    - `initialize`, 300 s, one time for each process (`:1122-1139`)
    - `authenticate` (`:1140-1155`)
    - `session/load` or `session/resume` (120 s), else `session/new` (300 s)
      (`:1172-1235`)
    - `session.started` (`:1324`)
    - `session/prompt` with no hard limit and an idle limit of 15 minutes
      (`:1362-1373`; `quiet-status.ts:17-23`)
    - the stop reason of the answer settles the turn (`:1405-1416`).
11. Return `{turnId}` (`:1475`). With `startupRecovery`, return a held
    acknowledgement instead (`:1038-1043`).

**What `sendTurn` returns, by driver:**

| Driver | Returns when | A failure after that |
|---|---|---|
| ACP | after `turn.started`, before the handshake (`acp/core.ts:1475`) | events only |
| Claude | after the prompt is written to stdin (`claude.ts:1787-1791`) | events only |
| Codex | before the process starts: `void launchAttempt(0)` (`codex.ts:1394-1395`) | events only |
| pi | after the handshake and the model, before the prompt is accepted (`pi.ts:914`) | events. One path emits `turn.completed` and also throws (`pi.ts:856-862`) |
| chat | after the turn starts (`openai-chat.ts:520`, from `turn-flow-comparison.md`) | events only |

The host notes that "an adapter may emit the whole turn before it resolves"
(`index.ts:8319`). So events of a turn can arrive before the host knows its
id. Proposal P2 (the runtime makes the `TurnId`) closes this.

### 3.4 A turn that never started (checked: `contracts.ts:40-49`, `index.ts:8399-8401`)

1. `TurnNotStartedError {turnId}` says "the attempt never reached a prompt or
   client-side action and its process stopped, so the harness may recover
   it" (`contracts.ts:40`). Two subclasses add `known`:
   `TurnAuthenticationRefusedError` (`:51-61`) and
   `TurnUsageLimitRefusedError {resetsAt?, scope, known}` (`:63-79`).
2. A driver holds its acknowledgement and rejects with it when the host set
   `startupRecovery` (`contracts.ts:153-154`). The memory wrapper of the
   registry also throws it, with no `startupRecovery`:
   `new TurnNotStartedError(newId(), "stopped while waiting for memory")`
   (`engine-memory.ts:893`). The wrapper is the second of the six
   (`registry.ts:198`). It acts for the engine kinds in its list
   (`engine-memory.ts:53-57`, `:847`).
   - Claude holds all events except `turn.started` and `session.started`
     until the first model activity. On a sign-in or limit refusal it stops
     the process and rejects (`claude-auth-recovery.ts:63-87`). The wait at
     `:97` has no timer.
   - ACP stops the process tree, then rejects (`acp/core.ts:1442-1445`). If
     the process does not stop, it emits `runtime.error` and
     `turn.completed` instead (`:1447-1450`). A failure is recoverable only
     when it is transient, the prompt was not sent, and it is not a JSON-RPC
     shape error (`acp/startup-recovery.ts:13-21`).
3. The host: "Only the driver can prove a task was never submitted; an error
   string is not that proof" (`index.ts:8399`). It then tries each backup
   engine one time, on the direct path only (`:8452-8496`). A room turn
   stores any rejection as a failed row, with no backup (`:10239-10253`).
4. Before the dispatch, a known limit or sign-out throws a made-up refusal
   with an id `limit-<uuid>` or `signed-out-<uuid>` (`index.ts:8325`). The
   memory wrapper uses `newId()` (`engine-memory.ts:893`). Neither id belongs
   to a turn.
5. `ProviderError` (`contracts.ts:30-38`) is never constructed. A search of
   `server/`, `shared/`, `packages/` and `src/` found no `new ProviderError`.

### 3.5 Stop (`interruptTurn`)

| Driver | What it does | Uses `turnId` | Waits for the end | Last event |
|---|---|---|---|---|
| ACP | `session/cancel`, then after 5 s closes the session or stops the process tree (`acp/core.ts:1091-1104`, `:427-445`) | no (`:1572`) | no | `ok: true, "cancelled"`, or `ok: false, "stop_failed"` |
| Claude | closes stdin and stops at once (`claude.ts:1963`) | no | no | `ok: false, "interrupted"` (`:1654`) |
| Codex | `turn/interrupt`, 750 ms, then stops the tree (`codex.ts:646-666`) | no (`:1551-1553`) | yes | from the settle |
| pi | `abort`, then stops the tree (`pi.ts:563-568`) | no | yes | `ok: true, "cancelled"` |
| chat | aborts the HTTP request (`openai-chat.ts:961-966`) | yes | yes | `ok: false, "interrupted"` |

Edge cases:

- On a shared ACP process, a stop that times out closes the sessions of the
  other threads too. Each of their turns ends `"exit_before_result"`
  (`acp/core.ts:431-440`). A test shows that Stop takes at least 5.5 s when
  the agent confirms the close (`acp/shared-process.test.ts:323`).
- If the process tree cannot be confirmed stopped:
  - pi throws inside its settle and keeps the thread in `active`
    (`pi.ts:529`, `:542-545`)
  - Claude returns before it settles (`claude.ts:1645-1649`). That the turn
    then stays in `active` is inferred.
- The host calls `interruptTurn` from about 14 places. Most of them drop a
  rejection with `.catch(() => {})` (group D, table F5).
- The UI sends the `turnId` that it saw start (`src/lib/stop-turn.ts:64-92`).
  The server answers `already-stopped` when that turn is over
  (`routes/bot-messages.ts:825`, `:864`). But the driver does not use the id.

### 3.6 Requests to the person (`respondToRequest`)

1. ACP (`acp/core.ts:622-751`):
   - With no running turn, the driver answers `cancelled` itself
     (`:583-590`).
   - It picks only an `allow_once` option, then any `allow*` option, never by
     position (`:637-641`).
   - It arms a 15-minute limit and emits `request.opened` (`:730-750`).
2. `finish` (`acp/core.ts:678-729`) runs one time only (`:684`). It sends the
   answer and emits `request.resolved`. It returns `"allowed-once"` for an
   allow, also when `always` was granted (`:728`).
3. A turn that settles cancels each open request with source `system`
   (`acp/core.ts:565`). Dispose goes through the same settle (`:1602`).
4. The limits by driver:
   - 15 minutes for a permission in each driver (Claude `:448`, Codex
     `:838`, pi `:677-686`)
   - no limit for a question in Claude, Codex and pi (Claude `:511`).
5. `always` is honoured by Claude (allow only, `claude.ts:575`). Codex and pi
   ignore it.
6. The host (`index.ts:4742-4818`):
   - It sends the answer to the engine that runs the turn
     (`runningTurnEngines`, `:4761`).
   - A throw becomes `"unavailable"` (`:4767-4769`).
   - On `"unavailable"`, it dismisses the card and stores the row "Couldn't
     deliver that answer — the request is no longer open, so the action was
     not run" (`:4800-4816`).

### 3.7 Steer

Section 3.12 of [`queue-and-steer.md`](queue-and-steer.md) has the steer of
each driver. New facts:

- Claude returns `"steered"` when the stdin write succeeds
  (`claude.ts:1809-1814`). It never returns `"indeterminate"`. The driver
  holds the result while a steer waits (`:1593-1611`). If the CLI stops
  before a model call reads the text, the text is lost, but the driver
  reported it as delivered (inferred).
- A Codex question is answered with a steer. A `"refused"` steer gives
  `"unavailable"`. An `"indeterminate"` steer gives `"answered"`
  (`codex-questions.ts:35-40`). An answer that maybe did not arrive is
  reported as delivered.
- When the engine says `"steered"` but the turn ended during the call, the
  host returns 409 "the running turn ended before the steered message could
  be recorded" and stores no row (`index.ts:7211-7216`). The engine has the
  words, and the transcript does not.
- The UI decides "Steer" from `queueing` on the **selected** instance
  (`src/components/Composer.tsx:153-157`). The server decides from `queueing`
  and the presence of `steer` on the **running** instance
  (`routes/bot-messages.ts:404-405`). The two can differ after a backup
  engine takes the turn.

### 3.8 The end of a turn

Each driver ends a turn that started with one `turn.completed {ok,
stopReason, cost, usage?}`, with an optional `runtime.error` before it. The
ACP core has one `settle` (`acp/core.ts:558-579`). It does these steps:

1. It returns if the turn is already settled (`:560`).
2. It cancels each open request (`:565`) and fails the pending RPC calls
   (`:566`).
3. It removes the turn from `active` before the last events, because "a
   listener may start the next turn synchronously" (`:567-569`).
4. It emits the optional `runtime.error` and then `turn.completed`
   (`:571-572`).

The stop reasons of the ACP core (group B, table F12) are:

- `ok: true`: `null` and `"cancelled"`
- `ok: false`: `"empty_turn"`, `"ended_after_tools"`, `"exit_before_result"`,
  `"spawn_error"`, `"stop_failed"`, `"auth_required"`, `"setup_required"`,
  `"rpc_error"`, `"quota"`, and the agent's own reason.

Five more emit sites are outside `settle` (`acp/core.ts:940-943`, `:965-973`,
`:1318-1319`, `:1426-1427`, `:1449-1451`). The retry after `LiveSwitchRefused`
runs `sendTurn` again with the same turn id. Then `session.started` can come
two times (`:1314`, `:1317`, `:1324`). This is inferred from the code. No
test shows it.

### 3.9 Status, stop all and dispose

- The `snapshot()` of the ACP core does not throw, except when its sign-in
  check throws (inferred). The registry turns any throw into
  `{state: "unavailable", reason: e.message}` (`registry.ts:472-474`).
  - The ACP core runs `cli --version` with an 8 s limit, and maps an error
    to a plain reason. It never shows the CLI output (`acp/core.ts:1478-1502`).
  - pi always says `authenticated: true`, because "pi manages its own
    credentials" (`pi.ts:943-944`).
  - The registry shares one read, reuses it for 3 s, and stops waiting
    after 60 s (`registry.ts:71-87`, `:225-239`). It does not stop the probe
    process (inferred).
- `hasSession` is `active.has(threadId)` in each driver. It means "a turn
  runs", not "a native session exists" (`acp/core.ts:1581`; Claude
  `:1974`, Codex `:1565`, pi `:998`, chat `:975`). The host does not call it.
- `stopAll` stops each turn. Claude does not wait. pi throws the first
  failure again (`pi.ts:389-393`). The host does not call it.
- `dispose`:
  - ACP sets `disposing`, stops each turn, settles each session as
    "cancelled", clears the listeners, and stops each process tree: EOF,
    500 ms, SIGTERM, 1.5 s, SIGKILL (`acp/core.ts:1595-1607`
    `engine-stop.ts:5-20`).
  - After dispose, `sendTurn` throws "shutting down" (ACP, `:370-373`) or
    "This provider was removed" (Codex, `:351`).
  - The registry has no limit on `dispose` and `disposeAll`
    (`registry.ts:579-595`).

### 3.10 Waits and their limits

| Wait | Limit | Where |
|---|---|---|
| `guardTurnDispatch` awaits `sendTurn` | none | `turn-dispatch-guard.ts:16` |
| pi session handshake | none: `awaitResponse(command, Infinity)` | `pi.ts:793` |
| ACP `session/prompt` | none hard; 15 min idle | `acp/core.ts:1362-1373` |
| ACP idle timer while a tool runs | stays armed with no end | `acp/host.ts:276`, `acp/core.ts:514` |
| Claude startup hold | none | `claude-auth-recovery.ts:97` |
| ACP admission, model refresh | none | `acp/core.ts:913-914`, `:1020` |
| dispose | none | `registry.ts:579-595` |
| A question to the person | none | `claude.ts:511` |
| A permission | 15 min | `acp/core.ts:733` |
| The watchdog of the host | 20 min for a turn, 2 h with a tool | `index.ts:4922-4924` |
| ACP startup calls | 120 s to 300 s | `acp/core.ts:273-277` |
| Codex RPC calls | 60 s, 180 s at startup | `codex-process.ts:69-74` |
| A steer | Codex 10 s, pi 20 s, ACP request 15 s | `codex.ts:705-721`, `pi.ts:572-588`, `acp/core.ts:275` |
| Status read | 60 s | `registry.ts:71` |
| The connection check of `tested-ai` | 90 s | `engine-check.ts:13`, `:44-50` |

The watchdog of the host is the outer limit for a turn
(`index.ts:4940-5007`). On a stall it calls `interruptTurn`, stores a failed
row, and frees the thread after 6 s.

### 3.11 How the server uses the contract (old note, section 5, checked again)

- Flags gate mounts and refusals:
  - `queueing` and `steer` give `engineCanSteer` (`index.ts:7191`)
  - `effortLevels` (`:7566`)
  - `guestTurns` (`:7528-7531`, 409 `guest_engine`).
- Many decisions use the driver name (section 8, problem 8).
- `ProviderError` is never constructed (section 3.4).
- `TurnNotStartedError` is the only proof of a turn that never started
  (`index.ts:8399-8401`).
- A permission request: `request.opened`, a card, `respondToRequest`, then
  `request.resolved`. The chat driver has a 15-minute limit for a permission
  (`server/drivers/chat-tool-approval.ts:68`).
- Steer: "steered" is recorded, "refused" is queued, and "indeterminate" is
  treated as delivered and never sent again (`index.ts:7180-7249`, `:7217`).
- No shared contract test exists for all drivers (section 6).

### 3.12 The connection check (`tested-ai.ts`)

The check runs in the background, one instance at a time, for the person's
own instances, and only while no default model is saved (`tested-ai.ts:62-66`,
`:125`, `:242-263`). It does not call `sendTurn`. It calls `generateText ??
generateMemoryText` with the prompt "This is a connection check. Reply with
the single word OK." and a 90 s limit (`engine-check.ts:12-13`, `:36-65`). A
regular expression over the CLI text decides "signed out"
(`engine-check.ts:14`). So a pass says nothing about the path of a turn.

## 4. The data

### 4.1 The capability flags (checked: `contracts.ts:255-310`)

There are 26 fields. One is mandatory: `sessionModelSwitch: "in-session" |
"unsupported"`. No production code reads it. A search found it only where
drivers set it and in tests. There is no flag for streaming, interrupt or
approvals.

| Group | Flags | Main readers |
|---|---|---|
| Tool mounts | `agentsMcp`, `computerMcp`, `composioMcp`, `phoneMcp`, `browserMcp`, `dataMcp`, `emailMcp`, `deviceMcp`, `localComputerMcp`, `customMcp`, `hooks`, `mcpToolsFoundByName` | `index.ts` integration block (7792-8252), room turns, `automatic-recovery.ts:28` |
| Media | `images`, `nativeImageInput`, `nativeVideoBytes` | `Composer.tsx:292`, `turn-images.ts:187-219` |
| Model | `effortLevels`, `modelVariants`, `sessionModelSwitch` | `index.ts:7566`, `member-turn.ts:4-15`, `default-model-selection.ts:69-76` |
| Steer | `queueing`, `steerImages` | `index.ts:6095`, `:7191`, `routes/bot-messages.ts:405` |
| Session | `strictResume`, `nativeCompaction`, `contextReading`, `engineAdmission` | `index.ts:6939`, `:6977`, `:7725`, `engine-memory.ts:898` |
| Guests and questions | `guestTurns`, `askTool` | `index.ts:7529`, `:9370`, `:9550`, `:4020` |

Facts about the flags:

- Each driver writes its own block: Claude `claude.ts:1938-1959`, Codex
  `codex.ts:1531-1547`, pi `pi.ts:960-975`, chat `openai-chat.ts:951-959`. All
  18 ACP drivers share `acp/capabilities.ts:4-23`.
- Claude's `strictResume` is a getter that depends on the CLI version
  (`claude.ts:1955-1957`). The value can change between a read and a turn.
- The doc of `localComputerMcp` says that a full-auto instance "must leave
  this false" (`contracts.ts:290`). Each driver sets it to true with no
  condition (`acp/capabilities.ts:17`, `claude.ts:1958`, `codex.ts:1537`).
  Claude and pi refuse host control under full auto inside `sendTurn`
  (`claude.ts:958-961`, `pi.ts:414-419`). A check for Codex was not found.
- The table of flags by driver is in the group C report. For example,
  `queueing` is true in Claude, Codex, pi and chat, and in ACP only when the
  engine has a steer method.

### 4.2 The second table by driver name (checked: `runtime/capabilities.ts:15-20`, `level.ts:16-21`)

- `ENGINES` has 31 rows of `{resume, transcript?}` (`runtime/capabilities.ts:17-49`).
- `engineCapabilities(kind)` adds `nativeReviewer`, `full`, `edits` and
  `subagents: false` from the name lists of `approval-mode.ts:22-45`.
- No production code calls `engineCapabilities`. The level rule calls the
  name lists directly (`runtime/level.ts:16-21`). Only a test keeps the two
  in agreement (`level.test.ts:67-86`).
- `docs/runtime-contract.md:116` says: "Engine drivers declare capabilities
  … The level rule and the continuation rule read these flags, never driver
  names." The code does not do this.

### 4.3 The input of a turn (`SendTurnInput`, `contracts.ts:125-231`)

About 40 fields. The ones that change the contract:

- `threadId`, `text`, `images?`, `videos?`, `model?`, `effort?`, `variant?`
- `resumeCursor?: unknown`, `sessionReset?` (wins over the cursor), and
  `recoveryText?` (sent one time when the engine refuses the cursor)
  (`:150-160`)
- `startupRecovery?`: hold the acknowledgement, and permit
  `TurnNotStartedError` (`:153-154`)
- `engineAdmission?(start, joining?)`: the driver asks for a slot of memory
  itself (`:155-158`)
- `approvalMode?`, `approvalModeNow?()`, `toolScope?`, `guestConfined?`
- `transcript?`, `system?`, `systemStable?`, `systemVolatile?`
- `integrations?` with the MCP servers. Their `env`, `headers` and
  `hooks.token` are credentials (`:177-214`). Remote headers are "never on
  argv" (`:240`)
- `mcpCallTimeoutMs?`, 10 minutes by default (`:227`).

The turn id is not an input. The driver makes it (`acp/core.ts:930`:
`turnId = retryOf ?? newId()`).

### 4.4 Outcomes and errors

- `RequestOutcome = "allowed-once" | "rejected" | "answered" | "unavailable"`
  (`contracts.ts:122`).
- `SteerOutcome = "steered" | "refused" | "indeterminate"` (`:382`).
- `ProviderErrorCode` (`:20-28`): `missing_cli`, `invalid_credentials`,
  `inactive_subscription`, `insufficient_funds`,
  `quota_or_region_restriction`, `upstream_outage`, `model_catalog_outage`.
- The busy refusal and most refusals before a turn are plain `Error` with
  text.
- Error classification:
  - `classifyError` decides retry or stop from text and status
    (`retry.ts:188-214`): 3 tries, 1 s, 3 s, 8 s, ±25%.
  - `engineFailureKind` names the failure (`engine-errors.ts:90-100`).
  - Codex has its own `codex-errors.ts`. pi passes raw text. Neither calls
    `engine-errors.ts`.

### 4.5 The events

`RuntimeEvent` is one type, in `packages/phone-protocol/src/runtime-events.ts`.
`shared/runtime-events.ts:1` and `contracts.ts:6-17` export it again. It has
21 values of `type`. The base fields are `eventId`, `provider`,
`providerInstanceId?`, `threadId`, `createdAt`, `turnId?`, `itemId?`,
`requestId?`, `raw?` and `synthetic?` (`:24-38`). The live-only kinds
`item.output` and `turn.progress` are in the same union as the stored kinds
(`:116-121`). [`event-bus-fold.md`](event-bus-fold.md) section 4.1 has the
full list.

### 4.6 What the client gets

`registry.describe()` copies 13 flags by hand into the instance list
(`registry.ts:542-558`):

- the tool mounts: `computerMcp`, `agentsMcp`, `composioMcp`, `phoneMcp`,
  `deviceMcp`, `dataMcp`, `emailMcp`, `browserMcp`, `localComputerMcp`
- `images`, `effortLevels`, `modelVariants`, `queueing`.

It also makes two values from the presence of methods: `approvalReview` and
`backgroundText`. A shadow gets three false flags (`:524`). The client does
not get `sessionModelSwitch`, `steerImages`, `guestTurns`, `strictResume`,
`nativeImageInput` and the other fields.

## 5. The UI

The UI never sees an adapter. It reads `GET /api/instances`, which gives
`{instances: InstanceInfo[]}` (`server/routes/instances.ts:119-126`,
`src/state/store.tsx:415-468`).

**Effort and variants** (`src/components/ModelPicker.tsx:54-196`):

- `modelVariants` shows the variant row (`:72-74`).
- No `effortLevels` hides the effort control (`:75-76`).
- The compact form is a select, "Reasoning effort", with "Default".
- The full form is pills: "Send no effort level and let the provider decide"
  and "Ask for {level} reasoning effort".
- While a turn runs, the menu shows "Reasoning level applies from the next
  message" and "Stop this thread's turn before changing its model"
  (`ModelPickerBusyMenu.tsx:5-24`).
- The UI blocks each model change while a turn runs (`ModelPicker.tsx:466`).
  It never sees `sessionModelSwitch`.

**Steer or queue** (`Composer.tsx:153-157`, `:530`; `composer-simple.ts:57-87`):

- `canSteer` reads `queueing` of the selected instance.
- With steer:
  - the button says "Send into the running turn", or "Add this to what
    {name} is doing" in the Simple mode
  - the menu has "Steer now", "Queue" and "Restart turn".
- Without steer, the button says "Queue message", with the hint "Sends when
  the current turn finishes".
- In the strip of queued messages:
  - an engine without `queueing` gets "Stop and send", which stops the turn
    (`Composer.tsx:446-448`, `:756`)
  - an engine with `queueing` gets "Steer" and "Steering…"
  - the steering state clears after 20 s in the client
    (`Composer.tsx:483-491`).

**The approval card** (`src/components/PendingApproval.tsx:47-373`):

- The card comes from stored messages of kind `options`, not from the
  `request.opened` event (`:47-62`).
- The text field is locked with "Answer the approval above to continue"
  (`Composer.tsx:906`).
- The buttons are "Allow once", "Deny", "Always allow", "Allow for this
  session" and "Cancel turn". "Cancel turn" calls `interruptTurn`
  (`:319-323`).
- The headline uses the tool name of the engine (`Bash`, `shell`, `Read`,
  `Write`, `Edit`) (`:107-119`).
- An "Always allow" grant is saved before the answer is sent
  (`store.tsx:2436-2446`).

**Stop**:

- The button has the label "Stop this turn" (`Composer.tsx:524-526`,
  `:928-944`).
- `sendStop` ignores a second press within 1 s and sends the `turnId` of the
  live turn (`stop-turn.ts:64-92`).
- A room stop drops an engine error and answers `{ok: true}`
  (`routes/bot-messages.ts:852`).

**Engine state**:

- `needsCli` is `state !== "available"`, and `needsSignIn` is "available" and
  `authenticated === false` (`EngineSetup.tsx:22-33`).
- `engineReady` has a special case by name: `clineAgent` needs
  `authenticated === true` (`EngineLibrary.tsx:11-17`).
- The texts are "Setup required", "Sign-in required" and "No model provider
  apps detected yet.".
- The raw `snapshot.reason` is shown in an alert (`EngineSetup.tsx:631-670`).

**Decisions by driver name in the UI**:

- approval levels (`approval-mode.ts:22-45`, `approval-mode-options.ts:28-82`)
- variant labels (`model-picker-reasoning.ts:13-16`)
- the sign-in texts (`DeviceSignIn.tsx:21-28`)
- the account groups (`EngineAccounts.tsx:20-26`)
- the update button (`EnginesSettings.tsx:277`).

## 6. The tests

- **The fake driver** (`server/testing/fake-driver.ts:12-100`):
  - The options are `kind`, `failCreate`, `failSnapshot`, `hangSnapshot`,
    `holdSnapshot`, `answer` and `effortLevels`.
  - The handle records `created` (with an `emit` function),
    `decodedConfigs`, `disposed` and `probes`.
  - `sendTurn` returns `{turnId: "fake-turn"}` and emits nothing (`:79`).
  - `hasSession` is always false. `respondToRequest` returns
    `"unavailable"`. There is no `queueing` and no `steer`.
  - After `dispose`, all methods still work.
  - Tests push events through `emit` (`harness/bus.test.ts:23-50`).
- **The registry tests** (`registry.test.ts`, `registry-start-read.test.ts`)
  check these behaviours with the fake driver:
  - an unknown driver, a bad config and a failed create become shadows
    (`:77-114`)
  - creation is concurrent, in config order (`:116-159`)
  - a dispose during a load does not bring the instance back (`:161-180`)
  - concurrent probes merge (`:347-362`), and the 60 s limit holds
    (`:243-262`)
  - effort levels are forwarded (`:265-281`).
- **The fake engine** (`fake-claude-cli.ts`):
  - It acts as the Claude CLI in the stream-json mode and in the one-shot
    mode.
  - About 100 `FAKE_CLAUDE_*` variables script it. `FAKE_CLAUDE_MODE` has
    17 values, for example `happy`, `hang`, `exit-early`, `usage-limit`,
    `not-logged-in` and `malformed`.
  - Files on disk act as gates (`RELEASE`, `FINISH_GATE`, `STEER_GATE`).
  - The header (`:2-102`) lists only a part of the variables.
  - It decides some calls from the words of the prompt, for example "This is
    a connection check." (`:506-540`).
  - Each dump writes all of `process.env` to a file (`:451`, `:919`).
  - `scripts/control-omb.ts:133-271` starts a server with this engine in a
    sealed environment, and passes only the fake variables through.
- **The fake runner** (`server/runtime/testing/fake-runner.ts`) is the fake
  `TurnRunner` of the runtime, not a driver. It runs scripts (`complete`,
  `fail`, `hang`, `handOut`), records calls, and can throw one time to test
  "no method may throw into the runtime" (`runtime/types.ts:309`).
- **Tests across drivers.** No single suite runs the contract on all
  drivers.
  - The live reply cases (`live-reply-cases.ts:18-44`) run on 14 ACP drivers,
    Claude, Codex, the chat providers and pi. Only the `stop` action takes
    part. `steer` is left out (`acp/live-reply-matrix.test.ts:40`).
  - The approval matrix runs on 7 ACP drivers
    (`acp/approval-matrix.test.ts:35-124`).
  - `capability-fields.test.ts:74-83` creates each built-in driver and checks
    one absent field.
  - No test runs `hasSession`, `stopAll`, the outcomes of `steer`, an
    interrupt with no turn, or a call after `dispose` on each driver.
- **Time** is controlled in five ways:
  - `vi.useFakeTimers`
  - `FakeClock` (`fake-clock.ts:3-28`)
  - gate files
  - `--import` hooks that rewrite source at fixed text anchors
    (`stall-clock-hooks.mjs:17-21`)
  - `hostTimeout`, which doubles a limit on Windows (`host-timeout.ts:5-10`).

## 7. Ours compared

Our state: `crates/bot-engine/src/lib.rs` has only its doc line.
`crates/bot-protocol/src/event.rs` has `Event`, `EventKind` (`TurnStarted`,
`TurnCompleted { outcome }`) and `Outcome` (`Completed`, `Failed`,
`Interrupted`). Step 2.5 adds the other three kinds of D20.

| Part | Reference | Ours (plan, step 3) | Crate and module |
|---|---|---|---|
| Layers | Driver, instance, adapter (`contracts.ts:253-657`) | One `Driver` trait. The registry (step 4) makes the instances | `bot-engine::driver` |
| Start a turn | `sendTurn(input) -> {turnId}`. The driver makes the id. Events go to listeners (`:311`, `:334`) | `send_turn(TurnRequest)` returns a stream of events. With P2 the runtime makes the `TurnId` | `bot-engine::driver` |
| Stop | `interruptTurn(threadId, turnId?)`, mandatory. Four of five drivers ignore the id | `interrupt`, gated by a flag in PR 3.5 | `bot-engine::driver` |
| Requests | `respondToRequest`, mandatory, never throws | not in step 3 | later step |
| Steer | `steer?` and `queueing` | not in step 3 | step 7 or 8 |
| Flags | 26 fields, one mandatory and not read; a second table by name | `Capabilities` with streaming, interrupt, approvals, tools (PR 3.2) | `bot-engine::capabilities` |
| Refusals | `TurnNotStartedError` and two subclasses; the rest are text | `DriverError`, which names the missing capability (PR 3.2) | `bot-engine::error` |
| End of a turn | `turn.completed {ok, stopReason}`, with different values for a stop | `turn.completed { outcome }` (D20) | `bot-protocol::event` |
| Fake | `fake-driver.ts`: fixed id, no events | A fixed list of events and flags that the test sets (PR 3.4) | `bot-engine::fake` |
| Fake engine | `fake-claude-cli.ts`, about 100 variables | step 9 (P41) | `bot-engine`, step 9 |

Where we differ, and whether it is better:

- **The stream of events from `send_turn`.** This is better: the events of a
  turn cannot reach a consumer before the turn is known, as they can in the
  reference (`index.ts:8319`). Together with P2, it also removes the
  quarantine of early events.
- **Flags for streaming, interrupt and approvals.** This is a difference
  with no reason from the reference. Each driver of the reference must have
  `interruptTurn` and `respondToRequest`, and must stream through `onEvent`.
  A stop is a promise of the contract, not an option. See P52.
- **`DriverError` that names a capability.** This is better than plain
  text, if it also has a busy refusal and a "not started" refusal. See P54
  and P55.

## 8. Where we can be better

Each point has a reason: a wrong state that the compiler refuses, less code,
or a problem of the reference that we do not copy.

1. **P52. Make interrupt mandatory, and remove the flags with no reference
   basis.** Reason: in the reference, each driver has `interruptTurn` and
   `respondToRequest` (`contracts.ts:311-323`). A Stop that the engine can
   refuse is a turn that does not end. Keep the flags that the reference
   reads, when a step reads them.
2. **P53. `interrupt(thread, turn)` with a required `TurnId`.** Reason: Claude,
   Codex, pi and ACP ignore the id (`claude.ts:1963`, `codex.ts:1551-1553`,
   `pi.ts:563-568`, `acp/core.ts:1572`). A late Stop can stop the next turn.
   Only the chat driver checks it (`openai-chat.ts:961-966`). This extends
   P35 down to the trait.
3. **P54. A typed busy refusal, and a busy slot that is taken before the first
   await.** Reason: five drivers throw the same text
   (`acp/core.ts:922`, `claude.ts:951`, `codex.ts:408`, `pi.ts:413`,
   `openai-chat.ts:518`). In ACP and Claude, awaits come between the check
   and the write. An entry API of a map, or a guard that frees the slot on
   `Drop`, refuses the race at compile time.
4. **P55. One meaning of `send_turn`.** It returns `Ok` when the engine took the
   prompt, or `Err(NotStarted)` when no work was done. After `Ok`, a failure
   comes only as events. A failure never comes as both. Reason: Codex
   returns before the process starts (`codex.ts:1394`). pi emits
   `turn.completed` and also throws (`pi.ts:856-862`). Only the driver can
   prove that no work was done (`index.ts:8399`). `NotStarted` carries no
   made-up id: the reference makes ids that belong to no turn
   (`engine-memory.ts:893`, `index.ts:8325`). With P2 the runtime already has
   the `TurnId`.
5. **P56. One outcome for a stop.** A stop ends with `Outcome::Interrupted`, in
   each driver. Reason: pi and ACP report `ok: true, "cancelled"`, Claude
   `ok: false, "interrupted"` (`pi.ts:567`, `claude.ts:1654`). D20 has the
   enum. The contract test must check it.
6. **P57. One `Capabilities` struct, and each field has a reader.** No getter, and
   no second table by name. Reason: `sessionModelSwitch` has no reader. Claude's
   `strictResume` is a getter (`claude.ts:1955-1957`). The runtime has a table
   by name that only a test keeps correct (`runtime/capabilities.ts:17-49`,
   `level.test.ts:67-86`). The registry copies 13 fields by hand
   (`registry.ts:542-558`). With `serde`, the client view is the same struct.
7. **P58. An optional method exists only with its flag.** For example
   `fn steer(&self) -> Option<&dyn Steer>`. Reason: the host checks both
   `queueing` and `steer` (`index.ts:7191`, `routes/bot-messages.ts:405`).
   The UI checks only `queueing`, of another instance (`Composer.tsx:153-157`).
8. **P59. A fake driver that obeys the contract.** It uses the `TurnId` of the
   request, emits a script of events in order, keeps a busy state for each
   thread, and refuses calls after dispose. Reason: the fake of the reference
   returns `"fake-turn"` for each turn and emits nothing (`fake-driver.ts:79`).
   So it cannot test the correlation of turns or the busy rule.
9. **P60. One contract test for all drivers.** A function
   `driver_contract(make_driver)` checks these points:
   - the order of events ends with one `turn.completed`
   - a stop gives `Interrupted`
   - a stop with no turn is `Ok`
   - a second turn on a thread gets the busy refusal
   - a call after dispose gets a refusal.

   It runs on the fake now and on the chat driver in step 5. Reason: the
   reference repeats tests for each family and never tests some methods
   (section 6).
10. **No wait without a limit** (extends P6, no new number). New lines of the reference:
    `pi.ts:793` (`Infinity`), `turn-dispatch-guard.ts:16`,
    `registry.ts:579-595` (dispose), `claude-auth-recovery.ts:97`,
    `acp/host.ts:276` (the idle timer is armed again while a tool runs).
11. **P61. An environment allow-list for an engine process.** Reason: the ACP core
    copies all of `process.env` and deletes known keys
    (`acp/core.ts:333-346`). An unknown secret reaches the engine. Step 9.
12. **P62. Readiness as one enum**, for example `Ready`, `NeedsSignIn`,
    `NeedsInstall`, `Unavailable { reason }`. Reason: the UI derives it in
    four places, with a special case by name (`EngineLibrary.tsx:11-17`). pi
    always says signed in (`pi.ts:943-944`). Step 4.
13. **P63. A fake engine with one typed script file**, not about 100 environment
    variables, and no routing by the words of a prompt. Reason:
    `fake-claude-cli.ts:2-102` lists only part of the variables, and it
    routes on prompt text (`:506-540`). Step 9.
14. **P64. "Steered" only after the engine confirms it.** A pipe write is
    `Indeterminate`. The host stores each `Steered` and `Indeterminate` text
    as a row, also when the turn ended during the call. Reason: Claude returns
    `"steered"` after a stdin write (`claude.ts:1796-1815`). Codex reports an
    `"indeterminate"` question answer as `"answered"`
    (`codex-questions.ts:35-40`). The host returns 409 and stores no row
    after `"steered"` (`index.ts:7211-7216`). Step 7 or 8, with P34.

### The problems of `changelog.md` section 5 in this feature

| Problem | In the reference here | Evidence |
|---|---|---|
| A turn or a wait that does not end | yes | Section 3.10. `pi.ts:793`, `turn-dispatch-guard.ts:16`, `acp/host.ts:276`, `registry.ts:579-595`. A question to the person has no limit (`claude.ts:511`) |
| The same work done two times, or lost | yes | `"indeterminate"` reported as `"answered"` (`codex-questions.ts:35-40`). 409 with no row after `"steered"` (`index.ts:7211-7216`). `session.started` two times on a retry, inferred (`acp/core.ts:1314-1324`). Guards: `TurnNotStartedError` (`index.ts:8399`), `mayResendTurn` (`retry.ts:216-223`) |
| Sign-in and engine CLIs that change | yes | Flags by CLI version (`claude.ts:199-260`), a getter flag (`:1955-1957`), version pins in comments (`claude-auth-recovery.ts:21-37`), sign-out found by a regular expression (`engine-check.ts:14`), no sign-in probe in pi (`pi.ts:943-944`) |
| Process control on Windows | yes | `taskkill /PID <pid> /T /F` with a fallback to `child.kill()` (`procs.ts:688-704`). Claude waits for the old process because "taskkill is asynchronous on Windows" (`claude.ts:946-950`). pi keeps the thread busy when a stop is not confirmed (`pi.ts:542-545`) |
| A secret in the wrong place | yes | The deny-list of the environment (`acp/core.ts:333-346`). MCP tokens as JSON in the session key (`:1001`). Raw stderr in `runtime.error` (`claude.ts:1661`, `codex.ts:1156`). A raw `snapshot()` error saved and shown (`registry.ts:473`). The fake engine dumps the environment (`fake-claude-cli.ts:451`) |
| "Busy" and races | yes | The busy check before awaits (section 3.3). `hasSession` means "a turn runs". The UI and the server read the steer flag of different instances (section 3.7) |
| The size of the tool list | partly | A limit learned from a refusal, with one retry (`acp/core.ts:947-949`, `:1423-1427`). Claude puts MCP tools behind tool search (`claude.ts:1006-1009`, `:1125-1126`). No capability for a tool limit |
| A decision by driver name | yes | About 22 places. The main ones: `runtime/capabilities.ts:17-49`, `approval-mode.ts:22-45`, `engine-memory.ts:839` (`SESSION_KINDS` next to the `engineAdmission` flag for the same decision), `index.ts:6998`, `:7774`, `workspace.ts:16-18`, `tool-schema-profile.ts:46` (`kimiAgent`), `room-sessions.ts:12-17` |

## 9. Not verified

- **Codex race.** Whether the Codex path between the busy check and
  `active.set` has an await (`warm.take`, `codexConfigMcp` and
  `codexSpawnContract` were not read).
- **The chat driver.** Where it writes `active` (`openai-chat.ts`, only the
  ranges in section 2 were read).
- **The 27 small drivers.** Their family comes from a search for the factory
  name. Their files were not read.
- **Redaction.**
  - Whether the stderr text in `runtime.error` is redacted before it is
    stored or shown.
  - The inside of `redactSecrets`.
  - The lists `PROVIDER_CREDENTIAL_ENV` and `WORKSPACE_CREDENTIAL_ENV`
    (`credential-env.ts`, not read).
- **Inferred, with no test.**
  - That a Claude turn stays in `active` after a stop that is not
    confirmed (`claude.ts:1645-1649`).
  - That the 60 s limit of a status read does not stop the probe process.
  - That a Claude steer can be lost after a successful pipe write.
- **Room interrupts.** The interrupt sites outside `index.ts` were found
  only by a search and read as single lines.
- **The six wrappers.** How they change errors and events (see
  [`newer-config-unavailable.md`](newer-config-unavailable.md) for what is
  known).
- **Flag readers.** They were found by a search for `capabilities.X`. A
  reader that destructures the object is missed, so the counts are lower
  limits. The finding that no code reads `sessionModelSwitch` was checked
  with a search for the name in all of `server/`, `src/`, `shared/` and
  `packages/`.
- **Other fake engines.** The ACP, Codex and pi fake engines
  (`fake-acp-cli.ts`, `fake-codex-app-server.ts`, `fake-pi-cli.ts`) were not
  read.
- **Tests not read.** `claude.test.ts`, `codex.test.ts`, `pi.test.ts` and
  `engine-errors.test.ts`.
- **Long lines.** The lines of the files in section 2 that were read with
  long lines cut can hide statements.
