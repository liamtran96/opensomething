# The life of an engine turn: warm engines, steering, MCP loading and rebuilt conversations

Feature rows of [`../reference-features.md`](../reference-features.md):

- `claude-endpoint.md`, `claude-tool-lifecycle.md`: "Custom endpoints for
  one engine; capabilities that end with the turn; how MCP servers load;
  warm engines; steering into a running turn; rebuilt conversations".
- `codex-browser-routing.md`, `codex-helpers.md`, `codex-instructions.md`:
  "One engine in detail: it uses our browser bridge; the events of its
  helpers are separate; bot instructions with a receipt".

These five documents are in `docs/verification/` of the reference project.
This file is for step 9 (the ACP driver) and step 5 (the chat API driver) of
[`../../plan/README.md`](../../plan/README.md).

Read on 2026-11-27. The reference project was at commit `42f86aefd`
(2026-11-27). That commit has the tag v0.1.184. Our
[`../changelog.md`](../changelog.md) stops at v0.1.182. All paths are in
the reference project unless a line says "ours". Nobody opened its
`enterprise/` directory. Eight subagents read the files in eight groups. The
main session checked the key lines of each group against the code.

Three commits that this file cites are in no release tag: `5638d70a4` (a
Claude rebuild when an old CLI keeps a stale system prompt), `b683e4116` and
`5b740a190` (the Codex instruction overflow reset). Commit `b2e662007` (the
byte budget for relayed MCP servers) is in v0.1.184 only.

**What this file adds to the done research files:**

- [`queue-and-steer.md`](queue-and-steer.md) §3.12 has the steer of each
  driver. This file adds the engine side: the read signal that only one
  engine gives and nobody uses, the cause and the fix of the double send of
  v0.1.182, a double send that is still possible on the queue steer route,
  a loss that the fix can cause, and the steer of the steering engine.
- [`acp-core.md`](acp-core.md) has the ACP steer strategies. This file adds
  the current lines, the wait for steer prompts at the end of a turn, and
  the ACP rebuild with no notice.
- [`engine-process-lifecycle.md`](engine-process-lifecycle.md) has the stop
  and the kill. This file adds the warm keep of each engine, the stop of a
  Claude turn while the root process is alive, and the kill of a kept Codex
  process.
- [`custom-mcp-servers.md`](custom-mcp-servers.md) has the custom servers.
  This file adds the turn side: when MCP servers start and stop for each
  engine, the byte budget of v0.1.182 and v0.1.184, and the bearer that
  stays the same while its record changes each turn.
- [`harness-upgrades.md`](harness-upgrades.md) and
  [`context.md`](context.md) have the rebuild text, the resume plan, the
  keep-warm rules and the warm summary. This file adds the driver side of a
  rebuild for each engine, the chat driver that has no session, and the
  usage of an aborted keep-warm ping.
- [`chat-turns.md`](chat-turns.md) has the chat turn. This file adds what
  the chat driver keeps between turns and what ends with the turn.
- [`recovery-and-pausing.md`](recovery-and-pausing.md) has the replay rule.
  This file adds the Codex instruction overflow and the stale prompt rebuild
  of Claude.
- [`engines-and-accounts.md`](engines-and-accounts.md) has the sign-in and
  the account homes. This file adds the custom Claude endpoint and checks
  again the four cases where Codex reads the person's `AGENTS.md`.
- [`driver-contract.md`](driver-contract.md) has the `Driver` contract. This
  file adds the full protocol of the fake Claude CLI and the fake Codex app
  server.

## 1. In short

An **engine turn** is one request to an AI engine and everything that the
engine does until it gives its answer. The reference project runs several
kinds of engines. Each kind has a **driver**, which is the code that starts
the engine, sends it the turn and reads its events.

- The **Claude driver** runs the Claude Code CLI. It keeps one CLI process
  for each conversation and writes each message on the standard input of
  that process.
- The **Codex driver** runs `codex app-server`. That program speaks
  JSON-RPC on its standard input and output.
- The **ACP driver** runs any engine that speaks the Agent Client Protocol.
- The **chat API driver** sends HTTP requests to an OpenAI-compatible
  server. It has no process.

This file describes six things that happen around one turn.

1. **Warm engines.** After a turn ends, a CLI engine process stays alive for
   some minutes. The next turn of the same conversation uses it again, so it
   does not wait for a new process and its MCP servers. The driver uses a
   warm process again only when its **launch key** (also called the **spawn
   contract**) is the same. The launch key is a digest of everything that
   shaped the launch: the arguments, the environment, the system prompt and
   the MCP servers. Two more warm features exist for Claude only:
   - A **keep-warm ping** sends one small request on a **fork** (a copy) of
     the conversation, so that the prompt cache of the provider lives for
     one more hour.
   - A **prestart** starts an engine before the first message arrives.
2. **Capabilities that end with the turn.** A bot reaches the tools of the
   reference project through a **bearer** (a secret token). The bearer stays
   the same between turns, so a warm engine does not need a new launch. The
   record behind the bearer belongs to one turn. The server accepts the
   bearer only while a turn of that conversation runs. Background tasks and
   cron jobs of the engine are off, so nothing runs after the turn.
3. **How MCP servers load.** An **MCP server** gives tools to an engine. The
   CLI engines start their MCP servers with the engine process and keep them
   while the engine stays warm. The chat API driver starts them at the start
   of each turn and stops them at its end. Two budgets limit the tools: a
   count that a provider refused before, and a byte size that one CLI keeps
   for a whole session.
4. **Steering into a running turn.** A **steer** puts a new message of the
   person into a turn that runs now. A driver returns `steered`, `refused` or
   `indeterminate` (not known). "Steered" means a different thing for each
   engine. Only the Claude CLI tells when a model call read the steer (an
   **echo**), and the reference project does not pass that signal to the
   server. In v0.1.182 the server guessed wrong and sent one steered message
   two times.
5. **Rebuilt conversations.** When an engine cannot open its old session, or
   when the person edits a message, the turn starts a new session. The
   server gives the driver a **recovery text**: the conversation rebuilt
   from stored data. The driver marks the new session as **rebuilt**. The
   chat API driver has no session, so each of its turns sends the whole
   stored conversation again.
6. **Engine details.** Some facts belong to one engine:
   - A **custom endpoint** is a Claude engine that sends its requests to
     another server that speaks the Anthropic API.
   - Codex runs **helper threads**, and the driver keeps their events out
     of the turn.
   - Codex keeps **bot instructions with a receipt**: a file that records
     which instruction block the native thread already holds.
   - Codex uses the browser bridge of the reference project, not its own
     browser.

## 2. Files read completely

All paths are in the reference project at `42f86aefd`. "Ranges" means that
only those line ranges were read.

**Group claude-driver**

| File | Lines |
|---|---|
| `server/drivers/claude.ts` | 1954, all, in 12 ranges |
| `server/drivers/claude-turn-result.ts` | 32 |
| `server/drivers/claude-spawn-contract.ts` | 35 |
| `server/drivers/claude-hooks.ts` | 19 |
| `server/drivers/claude-background.ts` | 42 |
| `server/drivers/claude-unusable-tools.ts` | 17 |
| `server/drivers/claude-bot-settings.ts` and its test | 97, 113 |
| `server/drivers/claude-endpoint-folder.ts` and its test | 20, 33 |
| `server/drivers/claude-own-memory.ts` | 6 |
| `server/claude-endpoints.ts` and its test | 174, 219 |
| `server/drivers/claude-cli-version.ts` | 58 |
| `server/resume-recovery.ts` | 50 |
| `server/drivers/claude-auth-recovery.ts` | 116 |
| `server/drivers/claude-elicitation.ts` | 118 |
| `server/drivers/shell-off.ts`, `server/drivers/team-tools.ts` | 5, 19 |
| `docs/verification/claude-endpoint.md` | 96 |
| `server/drivers/retry.ts` | 261, the diff from `ed8cb7278` and lines 1-6, 222-226 |

**Group claude-warm-and-tools**

| File | Lines |
|---|---|
| `server/drivers/claude-keepwarm.ts`, its test, `claude-keepwarm-box.test.ts` | 240, 138, 254 |
| `server/drivers/claude-prestart.ts` and its test | 65, 431 |
| `server/drivers/claude-warm-summary.ts` and its test | 149, 194 |
| `server/drivers/claude-tool-search.ts` and its test | 138, 98 |
| `server/drivers/claude-project-mcp.ts` | 20 |
| `server/drivers/agents-claude-defer.ts` and its test | 47, 102 |
| `server/drivers/agents-tool-limit.ts` | 4 |
| `server/cache-keepwarm.ts`, its test, `cache-keepwarm-target.test.ts` | 236, 239, 101 |
| `server/warm-summary.ts` and its test | 256, 268 |
| `server/engine-prestart.ts` | 229 |
| `server/drivers/claude-cost-history.ts` | 92 |
| `src/lib/cache-keepwarm.ts` | 23 |
| `docs/verification/claude-tool-lifecycle.md` | 144 |
| Ranges: `server/index.ts` 1640-1730, 2846-2851, 3470-3478, 5120-5212, 11798-11812. `server/host/warm-summary-host.ts` 20-40, 172-200, 238-249. `server/agents-bridge-switch.ts` 25-40, 262-310 | |

**Group claude-tests**

| File | Lines |
|---|---|
| `server/testing/fake-claude-cli.ts` | 1450 |
| `server/drivers/claude.test.ts` | 5274, all, in 11 ranges |

**Group codex-driver**

| File | Lines |
|---|---|
| `server/drivers/codex.ts` | 1577, all, in ranges |
| `server/drivers/codex-process.ts` and its test | 132, 55 |
| `server/drivers/codex-instructions.ts` and its test | 146, 220 |
| `server/drivers/codex-compact.ts` and its test | 154, 407 |
| `server/drivers/codex-background-text.ts` and its test | 265, 468 |
| `server/drivers/codex-tool-surface.ts` | 16 |
| `server/drivers/codex-config-provider.ts` | 142 |
| `server/drivers/codex-endpoint-config.ts` | 41 |
| `server/drivers/codex-unsupported-calls.ts` and its test | 99, 67 |
| `server/drivers/codex-shared-home.ts` and its test | 159, 292 |
| `server/drivers/codex-errors.ts`, `codex-guest.ts`, `codex-images.ts`, `codex-action-notice.ts` | 147, 53, 36, 6 |
| `docs/verification/codex-browser-routing.md`, `codex-helpers.md`, `codex-instructions.md` | 32, 27, 83 |
| Ranges: `server/drivers/codex-catalog.ts` 36-73, `server/drivers/codex-login.ts` 60-75 | |

**Group codex-warm-mcp-and-tests**

| File | Lines |
|---|---|
| `server/drivers/codex-warm.ts` and its test | 426, 357 |
| `server/drivers/codex-mcp-startup.ts` and its test | 72, 115 |
| `server/drivers/codex-mcp-mount.ts` | 77 |
| `server/drivers/codex-mcp-names.ts` and its test | 88, 129 |
| `server/drivers/codex.test.ts` | 4765, all, in 10 ranges |
| `server/testing/fake-codex-app-server.ts` | 1319 |

**Group mcp-loading**

| File | Lines |
|---|---|
| `server/drivers/turn-mcp.ts` and its test | 137, 143 |
| `server/drivers/session-tool-budget.ts` and its test | 106, 199 |
| `server/drivers/own-mcp-session-budget.ts` and its test | 88, 254 |
| `server/drivers/own-mcp-http.ts` and its test | 88, 152 |
| `server/drivers/agents-mcp.ts` | 81 |
| `server/drivers/agents-mcp-env.ts` and its test | 13, 13 |
| `server/harness-mcp-token.ts`, `server/harness-mcp-proxy.ts` and its test | 4, 59, 219 |
| `server/harness-mcp-request.ts` | 112 |
| `server/turn-context.ts` and its test | 81, 228 |
| `server/drivers/session-idle.ts` and its test | 281, 438 |
| `server/routes/own-mcp-http.ts`, `server/routes/own-mcp-http-path.ts` | 128, 5 |
| `server/drivers/pi-mcp-servers.ts` | 49 |
| Ranges: `server/index.ts` 1605-1790. `server/drivers/acp/core.ts` 185-230, 275-285, 880-1000, 1120-1180. `server/drivers/claude.ts` 955-1110. `server/drivers/codex.ts` 440-560. `server/drivers/pi.ts` 396-432. `server/drivers/openai-chat.ts` 505-530, 605-625, 885-895. `server/drivers/chat-mcp-tools.ts` 70-115, 540-640 | |

**Group steering-engine-side**

| File | Lines |
|---|---|
| `server/steer-e2e.test.ts` | 1080 |
| `server/steer-unattended.e2e.test.ts` | 180 |
| `server/host/person-first.ts` | 181 |
| `server/drivers/acp/steer.ts` | 190 |
| `server/drivers/acp/capabilities.ts` | 23 |
| `server/drivers/codex-questions.ts` | 58 |
| Commits read in full: `1128b084f`, `a28d29d3d`, `dad54b565` (the chat part), `812c99063` (message and stat) | |
| Ranges: `server/index.ts` 3836-3843, 4752-4760, 6040-6084, 6970-7000, 7020-7070, 7095-7275, 12300-12325. `server/drivers/claude.ts` 300-320, 560-600, 700-740, 805-830, 895-920, 1095-1110, 1250-1262, 1295-1305, 1340-1380, 1440-1460, 1500-1600, 1700-1760, 1875-1905. `server/drivers/codex.ts` 320-330, 690-725, 1005-1020, 1160-1172, 1520-1552. `server/drivers/openai-chat.ts` 196-210, 570-640, 735-800, 875-925, 940-975. `server/drivers/acp/core.ts` 86-95, 188-196, 276-282, 700-712, 1015-1045, 1270-1345, 1490-1505. `server/drivers/acp/grok.ts` 360-420, 520-540, 628-640. `server/routes/bot-messages.ts` 418-472 | |

`server/steer-queue.ts` (325) did not change since the commit that
`queue-and-steer.md` read, so nobody read it again.

**Group rebuilt-and-chat-parity**

| File | Lines |
|---|---|
| `server/context-rebuild.ts` and its test | 238, 585 |
| `server/delta-context.ts` and its test | 347, 532 |
| `server/resume-plan.ts` | 37 |
| `server/resume-recovery.ts` and its test | 50, 76 |
| `server/warm-summary.e2e.test.ts` | 171 |
| `server/drivers/openai-chat.ts` | 996, all, in 5 ranges |
| Ranges: `server/delta-context.e2e.test.ts` (1389) 1-40, 353-370, 520-612, 650-731, 836-984, 1095-1389. `server/index.ts` 7660-7800, 8270-8400. `server/runtime/capabilities.ts` 1-60. `server/contracts.ts` 295-312. `server/drivers/claude.ts` 885-950, 1095-1130, 1370-1380, 1625-1700. `server/drivers/codex.ts` 1240-1335. `server/drivers/acp/core.ts` 940-960, 1112-1200 | |

## 3. How it works

### 3.1 One Claude turn

The CLI fact behind the design (`server/drivers/claude.ts:679-681`): with
`--input-format stream-json`, the CLI ends a turn with a `result` frame and
keeps stdin open. It takes the next stdin message as a new turn. It folds a
message that arrives during a turn into that turn before its next model call
(CLI 2.1.221).

1. **Refusals before any process.** These throw a plain `Error`
   (`claude.ts:851-856`, `:869`, `:876-879`, `:900-902`, `:911-913`,
   `:919-921`):
   - a hosted model that is not assigned.
   - `requireApiKey` with no key.
   - a busy thread ("a turn is already running on this thread").
   - a guest mode that the CLI cannot confine.
   - a CLI too old to run with no shell.
   - a tool scope that the CLI cannot confirm.
2. **The turn id.** A first launch makes a new id. A relaunch keeps the id
   (`:880`). The session id is the resume cursor, or a new id when
   `sessionReset` is set or no cursor exists (`:889-890`).
3. **The arguments.**
   - The base is `-p --output-format stream-json --input-format
     stream-json --verbose --include-partial-messages --permission-mode <m>`
     (`:892-899`).
   - `--replay-user-messages` is added when the CLI version is 2.1.282 or
     newer, or is not known (`:914-915`).
   - Isolation adds `--strict-mcp-config` and `--setting-sources project`
     (`:916-927`).
   - The system prompt goes in a 0600 file, not in argv. The reasons are the
     size limit of Windows and that "the prompt may be sensitive" (`:955`).
4. **The MCP config and the settings.** The driver writes the MCP config and
   a private settings file, each 0600, in a new temp folder (`:1041-1045`,
   `:1206-1212`). Section 3.7 has the order of the servers.
5. **The launch key.** `argsKey` is JSON of these parts (`:1076-1094`):
   - the arguments without the private file paths.
   - the stable system prompt, the MCP servers, the folder and the model.
   - the base URL, the config folder, the hooks, the box key and the tool
     search setting.
   - a sha256 of the bot settings.
   - a sha256 of the auth settings and the account keys.
6. **Warm reuse.** The driver uses the live process again when all of these
   are true (`:1100`):
   - no `sessionReset`.
   - the images are not over the limit.
   - the process is alive and runs no turn.
   - the key and the session are the same.

   It then writes the message with `writeUser` and returns (`:1101-1125`).
   A changed roster of the team, or a changed volatile half of the system
   prompt, rides that message as a note, with no relaunch (`:1112-1116`).
7. **A new process.** Else the driver closes the old process first, "so two
   never share the session" (`:1127-1128`). The close line in the native log
   names the changed fields of the key and never their values
   (`server/drivers/claude-spawn-contract.ts:4-35`). Then it spawns the CLI
   and writes the prompt on stdin, "never argv (ARG_MAX); stdin stays open
   for steers and the next turn" (`claude.ts:1725`).
8. **The stream.** `handleLine` reads each frame (`:1323-1553`):
   - `system/init` marks `sawInit`, records the session id and emits
     `session.started` (`:1343-1378`).
   - A `text_delta` becomes `content.delta` and sets `sawStreamDelta`
     (`:1392`). A `thinking_delta` becomes reasoning text and does not set
     that flag (`:1394-1396`).
   - An `assistant` frame with no error sets `answered = true` (`:1424`).
   - A `tool_progress` frame (CLI 2.1.306 sends one every 30 s) becomes
     `item.updated`, which is the proof of life for the host watchdog
     (`:1470-1473`).
   - A `result` with `origin.kind = "task-notification"` is ignored
     (`:1475-1476`).
9. **The end.** At a `result`, the driver holds the result while a steer
   waits (section 3.8). Else it calls `settle` (`:1266-1299`), which:
   1. answers each open permission ask with the system reply
      (`broker.pause`, `:1284`).
   2. removes the MCP config folder and the system prompt file
      (`:1285-1288`).
   3. closes the process at once after `auth_required` or
      `update_required` (`:1292-1294`).
   4. books the cost as the growth of the CLI running total
      (`:1295-1296`).
   5. emits `turn.completed` and arms the idle timer (`:1297-1298`).
10. **Retry.** The driver sends a turn again only when it ended before the
    turn, or after a transient nonzero exit with nothing streamed and
    nothing answered. The limit is 2 tries (`server/drivers/retry.ts:6`,
    `:222-226`, `claude.ts:1609-1624`). A held result never relaunches: "A
    result is held, so the prompt already ran: never relaunch"
    (`claude.ts:1593-1594`).
11. **Stop.** `stop()` sets `stopRequested` and closes the session. The
    reason: "taskkill is asynchronous on Windows: retire steering and
    approvals before the child submits more". Then it kills the tree
    (`:1714-1721`). `interruptTurn` ignores the turn id (`:1901`).
    - When the kill of the tree is not confirmed, the driver warns one time
      (`:1302`).
    - If the root process is dead, the turn ends as `interrupted`
      (`releaseInterrupted`, `:753-759`).
    - If the root process is alive, "A live root keeps the verified-stop
      wait" (`:756`): the turn ends when the root closes (`:1580-1592`).
      Test: "settles an interrupted turn once the root closes, even with
      tree uncertainty" (`server/drivers/claude.test.ts:3319`).
    - A root that never closes keeps the turn open. Inferred from the code,
      not tested.
12. **Elicitation.** An MCP elicitation (CLI 2.1.317) becomes a permission
    card that always needs an explicit answer. A form or a URL request is
    declined at once (`server/drivers/claude-elicitation.ts:52-84`).
    `settle` does not close these cards. Only the close of the session
    closes them (`claude.ts:779-797`, `:1702`).

A test fixes the order of the events of one turn: `turn.started`,
`session.started`, `content.delta`, `item.completed`, `item.started`,
`thread.token-usage.updated`, `item.completed`, `turn.completed`
(`claude.test.ts:611-637`).

### 3.2 One Codex turn

The driver runs `codex app-server` with JSON-RPC as one JSON object for each
line. A turn ends at `turn/completed`. The resume cursor is the Codex thread
id (`server/drivers/codex.ts:10-11`).

1. **Routes.** A turn goes on one of four routes (`:216-220`, `:300`,
   `:404`):
   - a routed endpoint or company provider.
   - a ChatGPT plan with a token that the server holds.
   - a ChatGPT account that signs in by device code in its own `CODEX_HOME`.
   - the person's own Codex login.
2. **The signed-out check.** For a ChatGPT turn, `codex login status` that
   says "missing" ends the turn before any process. The events are
   `turn.started`, `runtime.error` (setup) and `turn.completed` with
   `unsent: true` (`:406`, `:410-415`).
3. **The launch slot.** At most `max(2, CPUs)` app servers start at the same
   time (`server/drivers/codex-process.ts:8-12`). A waiting turn sees
   "Waiting for a free Codex slot: N Codex runs are starting on this
   computer. This one starts on its own." (`codex.ts:418-432`). A reused
   warm process needs no slot (`:549`).
4. **Warm take.** On the first attempt only, the driver asks the pool for a
   kept process with the same spawn contract and the same native thread
   (`:546-550`). A plan login has no contract: "A plan login reaches its
   process through this turn's token or bridge, which end with the turn"
   (`:545`).
5. **The handshake.** A new process gets `initialize` with
   `experimentalApi: true`, then `initialized`. A reused one skips both
   (`:1173-1178`).
6. **`config/read`.** The driver reads the effective config, because
   "developerInstructions replaces, rather than appends to, native config"
   (`:1180-1195`). On a reused process, a changed config digest closes it
   and relaunches with no notice (`:1196-1198`).
7. **Checks before the prompt.** Each check fails closed with "No prompt was
   sent." (`:1200-1234`):
   - shell snapshots must be off when the turn has private env or a bridge.
   - the shell policy must be a plain object, and the driver adds its
     exclusions.
   - with a tool scope, the enabled MCP servers of the config must equal
     the selected set.
   - a guest turn must see its shell off.
8. **Instructions.** The bot rules, the sandbox note, then the person's own
   `developer_instructions` last (`server/drivers/codex-instructions.ts:63-77`).
   Section 3.10 has the receipt.
9. **Resume or start.** `thread/resume` or `thread/start` (`codex.ts:1255-1320`).
   Section 3.9 has the rebuild when a resume fails.
10. **The MCP wait.** The driver waits until each enabled mount is ready,
    failed or cancelled, at most 30 s (section 3.7).
11. **`turn/start`.** The request carries the input (text and inline
    images) and `environments: []` when the shell is off (`:1336-1350`).
    The response binds `codexTurnId`. Events that came before the response
    are buffered, at most 1024, and replayed (`:614-626`, `:928-937`). Over
    that cap, the turn ends with "too_many_events_before_turn_start".
12. **After acceptance.** The driver commits the volatile receipt, then
    frees the launch slot (`:1361-1363`).
13. **Events.** Section 3.10 has the filter of helper events.
    - Any `item/*` except a user message sets `streamed` (`:944`).
    - Usage is the running total of the process minus a baseline
      (`:1047-1079`).
    - A `contextCompaction` item becomes `context.compacted` (`:1042-1044`).
14. **The end.** Only `turn/completed` for the bound pair of thread and turn
    ends a turn normally (`:1080-1095`). The other ends are a process exit
    (`:1139-1166`), a spawn error (`:1134-1138`) and Stop (`:646-666`).
    - A `failed` turn with only "Reconnecting... n/5" errors reports the
      last reconnect text (`:1087-1089`, `:1100-1103`).
    - At the end, the driver scans the rollout file for "unsupported call"
      (section 3.10).
15. **Relaunch.** The driver relaunches only when `turn/start` was never
    acknowledged and no early events were buffered: "a replay could re-run
    tools the user saw" (`:1159`). If an early event was a tool, the error
    says "A tool action may have run. Check its effects before trying
    again." (`server/drivers/codex-action-notice.ts:4-6`).
16. **Timers.** The driver has no idle timer after `turn/start`.
    - RPC calls have 180 s at startup and 60 s after it
      (`codex-process.ts:69-74`).
    - A permission waits 15 min. A question has no timer (`codex.ts:838`).
    - A stop that is not confirmed retries 12 times, every 5 s, then the
      turn completes with "did not shut down" (`codex-process.ts:80-87`,
      `codex.ts:681-685`).
    - The host stops a quiet turn after `TURN_STALL_MS` (20 min by
      default). That timer is in the host, not in the driver.

### 3.3 One chat API turn (step 5)

1. **Refusals.** A busy thread and a missing key throw a plain `Error`
   before `turn.started` (`server/drivers/openai-chat.ts:512-513`).
2. **No session.** The driver never reads `resumeCursor`, `sessionReset` or
   `recoveryText`. Each request has the system prompt, every entry of
   `turn.transcript`, then the new message (`:479-509`). It emits
   `session.started` with `sessionId: null` on each turn (`:608`).
3. **Tools for one turn.** The driver mounts the MCP servers at the start of
   the turn (`mountChatTools`, `:613-614`). Late servers join between
   rounds (`:630-632`).
4. **Rounds.** A loop of rounds (`:622`). At the top of each round, the
   parked steers go in as one user message (section 3.8).
5. **Limits in one turn** (`:145-146`, `:192`, `:430`, `:764-791`):
   - 200 tool calls.
   - 3 nudges after an announcement with no call.
   - 2 corrective rounds for a local model.
   - a repeated tool call id refuses the turn.
   - a stream frame over 2,000,000 characters fails.
6. **The end.** One `finally` always runs (`:886-924`):
   1. it sets `ending`, so a later steer is refused.
   2. it closes the approval broker and ends the reply item.
   3. it closes the tools, 5 s per client or 15 s on Windows
      (`server/drivers/chat-mcp-tools.ts:211-221`). A close that cannot be
      confirmed fails the turn with "Tool processes could not be stopped;
      their execution state is uncertain." (`openai-chat.ts:892-897`).
   4. it emits `chat.notice.unreadMessage` when the turn failed with a steer
      that the model did not read (`:899`).
   5. it writes a hand-off file for a continuable failure (`:905-916`).
   6. it emits `turn.completed` (`:918-922`).
7. **Stop.** `interruptTurn` aborts the request and waits for the end
   (`:956-961`).
8. **What stays between turns.** All of it is in memory and is lost at a
   restart:
   - `delivered`: the exact text sent for each thread, so the next request
     has a byte-identical prefix for the prompt cache. The limits are 256
     threads and 24,000 extra bytes (`:148-190`, `:219`).
   - `sessionGrants`: the "Allow for this session" grants, at most 256
     (`:220-221`).
   - The models that refused a reasoning echo, and the route state
     (`:207-208`).

   After a restart, one request misses the cache. No part of the
   conversation is lost, because it comes from the store.

### 3.4 One ACP turn: the parts this feature adds

`acp-core.md` has the ACP core. This feature adds four facts.

1. **The pool key.** `sessionKey = JSON.stringify([mcpServers, toolScope,
   inheritedScopeFingerprint])` (`server/drivers/acp/core.ts:945`). With the
   driver flag `restartOnMcpChange`, the driver uses a pooled process again
   only when the key and the hash of the held system prompt are the same
   (`:953-954`). The key holds the bearer tokens, so a stable bearer keeps
   the process warm.
2. **MCP after `initialize`.** The URL or stdio form of our own servers, and
   the byte budget, come from the agent's `initialize` answer
   (`:1133`, `:1176`, `server/drivers/own-mcp-http.ts:66-88`).
3. **The rebuild** (section 3.9). The ACP core sets `rebuilt: true` and
   shows the person no notice (`acp/core.ts:1195`).
4. **Steer prompts.** After the turn's own `session/prompt` answers, the
   core waits for each open steer (`:1298-1306`, section 3.8).

### 3.5 Warm engines

**The Claude process.**

1. **Idle close.** A process with no turn closes after its idle time:
   - 10 min by default, 150 s on a box of 1.5 GB or less, 10 s at least
     (`server/drivers/session-idle.ts:51-58`).
   - 30 s for a conversation that nobody watched in 30 min
     (`:232-234`).
2. **The idle-engine cap.** At most `OMB_IDLE_ENGINES_MAX`, or 1 for each
   2 GB between 4 and 8, or 2 on a small box (`:110-121`).
3. **Cost.** "One warm engine and its MCP servers take 250 to 450 MB"
   (`:52-53`).
4. **A presence hold.** When the person has the conversation open, the
   process stays 10 min past the activity, with keep-warm on or off
   (`server/host/warm-summary-host.ts:38-39`, `:240-246`).

**The Codex process** (`server/drivers/codex-warm.ts`).

1. **Keep.** After a completed turn, the driver keeps the app server, one
   for each conversation, when all of these are true (`codex.ts:679-680`):
   - the turn ended `ok` and has a contract and a native thread.
   - no stop, abandon, dispose or MCP failure happened.

   `OMB_CODEX_SESSION_KEEP=0` turns the keep off (`codex-warm.ts:261`).
2. **Reread.** At the keep, the driver asks `config/read` once more and
   stores its digest (`:346-357`).
3. **Take.** The pool hands a process back only to its own conversation,
   with an equal contract and the same native thread (`:361-373`). "A kept
   process is never handed to another conversation" (`:266`).
4. **The contract.** It holds digests of these parts (`:143-212`):
   - `config.toml`.
   - the CLI path, mtime and size (an update in place changes it).
   - the arguments, each env value, the box and the thread parameters.
   - the folder.
   - the login account, not the token (Codex rewrites `auth.json` when it
     renews a token).
5. **Between turns.** A request from the engine gets JSON-RPC -32601 "No
   <product> turn is running on this thread." (`:129-133`). The driver
   tracks the token total of the kept thread, so the next turn books only
   its own usage (`:134-136`).
6. **The end.** The driver kills the whole tree, because MCP servers and
   shells can outlive the app server (`:288-297`). A lent process (for a
   compaction) retries a failed kill. A kept process gets one attempt only
   (`codex-warm.test.ts:324`).

**Prestart (Claude).**

1. **The last launch.** The server keeps the last launch of each bot, at
   most 32. It keeps a launch only when it mounts only our own servers
   (`server/engine-prestart.ts:76-83`, `:100`).
2. **When it starts a spare.**
   - A new conversation starts a spare that waits 30 s.
   - A conversation that the person opens (desktop app only) starts one
     that waits 180 s (`:140-166`, `session-idle.ts:235-246`).
   - At most 2 spares wait at a time.
   - The memory gate is `prestartAllowed` (`session-idle.ts:252-256`).
3. **Reconnect before the take.** The tool lists of `browser`, `computer`,
   `data`, `email` and `device` work only during a turn. So before a turn
   takes a spare, the driver asks the CLI to reconnect those servers, 3 s
   each (`server/drivers/claude-prestart.ts:1-15`).
4. **A CLI with no reconnect.** A CLI that answers `unsupported_request`
   turns prestart off until the server restarts (`:17-22`).
5. **The take.** A turn takes a spare only when the launch key and the
   session are the same. Else the driver closes the spare with no grace
   (`claude.ts:1096-1128`).

**The keep-warm ping (Claude).**

1. **When.** Only for a subscription sign-in, after an `ok` turn with at
   least 50,000 context tokens (`server/cache-keepwarm.ts:6-7`, `:162-192`,
   `server/index.ts:5156-5165`).
2. **The window.**
   - A ping goes 50 min after the last request.
   - The window is 180 min by default (15 to 1,440).
   - A busy bot is asked again after 1 min (`cache-keepwarm.ts:13-20`).
3. **The stops.** A cold cache is never pinged. A ping that writes 10% or
   more of what it reads ends the window (`:59-62`, `:86-99`, `:135-137`).
4. **The fork.** A ping is `--resume <s> --fork-session
   --no-session-persistence` with the exact launch contract, so the prefix
   is the same bytes and the provider reads the cache (`claude-keepwarm.ts:43-62`).
5. **No tools in a fork.** The permission proxy points at a dead socket. A
   `PreToolUse` hook denies every call. The hook variables are removed
   (`:64-80`, `:184-185`).
6. **Files.** The contract holds the turn's credentials and is kept only in
   memory. The files of the fork are 0600 in a temp folder that is removed
   when the fork ends (`:29-37`, `:169-182`, `:209`).
7. **Abort.** A turn that starts aborts a ping in flight
   (`cache-keepwarm.ts:152-160`). The abort kills the fork and returns
   `ok: false`, so the ping is not booked (`claude-keepwarm.ts:212-215`,
   `cache-keepwarm.ts:122`). The prompt was already on stdin
   (`claude-keepwarm.ts:237`).

**The warm summary (Claude).** `context.md` §3.4 has the schedule.

1. **The run.** Claude Code's own `/compact` runs on a persisted fork, with
   a limit of 5 min (`server/drivers/claude-warm-summary.ts:14-25`).
2. **The swap.** The conversation moves to the fork only when no turn
   started in the meantime (`:129-146`).
3. **Parked contracts.** The contract of a process that closed for idleness
   is parked for 1 hour (at most 200), so a summary can still fork it
   (`:16-18`, `:88-109`).

**A restart.** Nothing warm survives. "Nothing is persisted: after a restart
the CLI relaunches with a fresh system prompt that misses the cache anyway"
(`cache-keepwarm.ts:7-8`). A restart loses:

- the windows, the contracts, the spares and the parked forks.
- the bearers and the last launch of each bot.

Only the cost history file survives (`claude-cost-history.ts:7`). `dispose`
stops every engine tree, because "Engines lead sessions of their own, so
nothing stops them once this server exits" (`claude.ts:1948-1949`).

### 3.6 Capabilities that end with the turn

1. **One bearer, a new record each turn.** The bearer string stays the same
   while the bot, thread, kind and grants stay the same (`server/index.ts:1655-1657`,
   `:1673`). The record behind it belongs to one turn. A mint for a turn
   that is not active throws "cannot mint an integration capability for an
   inactive turn" (`:1669-1672`).
2. **The grants of the key.** The grants leave out `generation`, `depth`,
   `roomHandoffId` and `skillAuthoring`, and add the approval level
   (`:1657-1660`). A security invariant says that the server reads these
   turn facts "from that record on every call, never from the engine"
   (`:1651-1653`).
3. **Revocation.** A new turn on the thread revokes the record of the turn
   before it (`:1644-1649`). These events also revoke it:
   - the engine reports the end of the turn (`:1740-1745`).
   - the thread ends (`:1719-1722`).
   - the server shuts down (`:1724-1732`).

   A record that no turn ended expires after 30 days (`:1610`).
4. **A new bearer each turn.** The computer gets a new bearer each turn:
   "an engine whose own process bridges into a machine that can stop
   between turns needs a fresh start, which a new bearer forces"
   (`:1672-1673`).
5. **What a revoked bearer gets.** A call gets 401 "the internal turn
   capability has expired". The proxy turns that into a tool error with a
   recovery text (`server/harness-mcp-proxy.test.ts:73-112`).
6. **Claude switches.** Each launch sets `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`
   and `CLAUDE_CODE_DISABLE_CRON=1`: "Approvals and browser credentials
   expire at the turn boundary; native background workers and cron jobs
   must not outlive it" (`claude.ts:1067-1068`).
7. **The hook bearer.** It is in a file for each thread that the driver
   writes again each turn, "so a long-lived CLI process never presents a
   stale token" (`:1049-1057`).
8. **A background result.** A result with `origin.kind =
   "task-notification"` does not end a turn or use its permissions
   (`docs/verification/claude-tool-lifecycle.md:16-19`, `claude.ts:1475-1476`).
9. **Asks at the end.** At `settle`, each open ask gets the system reply:
   a question gets "<product>: the turn is ending — wrap up." and a
   permission gets a deny with "<product>: the turn ended"
   (`claude.ts:293-297`, `:1284`).
10. **Per-turn limits.** The server counts the limits of one turn (bots
    made, threads opened, room posts), not the proxy that a warm engine
    keeps (`docs/verification/claude-tool-lifecycle.md:62-65`).

### 3.7 How MCP servers load

**Claude** (`claude.ts:959-1045`).

1. **The order.** `composio`, our own apps, the local computer (never
   pre-allowed), `agents` (pre-allowed), `phone`, `browser`, `data`,
   `device`, `email` (only its read tools pre-allowed), then `dweb`.
2. **The person's servers.** They come next. They are not pre-allowed, so
   each call goes to the approval broker (`:1001-1010`).
3. **The project's `.mcp.json`.** Its servers merge last, only when the turn
   is isolated, and never for a guest (`:1013-1019`). The file is read with
   no size or type check (`server/drivers/claude-project-mcp.ts:9`).
4. **Tool search.** `ENABLE_TOOL_SEARCH=true` goes in the private settings,
   so each server without `alwaysLoad` loads its schemas only when the model
   searches for a tool (`server/drivers/claude-tool-search.ts:1-16`,
   `claude.ts:1061-1062`).
   - Only `ogb`, `agents` and (when the turn plans to browse) `browser`
     load at once (`claude.ts:979-984`).
   - The person's own opt-out in `~/.claude/settings.json` still counts
     (`claude-tool-search.ts:102-104`).
5. **Deferred agents tools.** The `agents` server sends 4 tools whole (5
   for a Chief) and only the names of the rest
   (`server/drivers/agents-claude-defer.ts:13-21`). A test holds these bytes
   within 2%, and the total under 8,000 bytes
   (`agents-claude-defer.test.ts:60-73`).

**Codex** (`codex.ts:440-560`, `server/drivers/codex-mcp-mount.ts`).

1. **Mounts.** Each mount is `-c mcp_servers.<name>....` with env names only
   in argv, "so credentials never appear in process listings"
   (`codex-mcp-mount.ts:31-32`).
2. **Name collisions.** A name that `config.toml` already has gets a
   suffix, because "stdio over url is 'invalid configuration' that kills
   the turn" (`server/drivers/codex-mcp-names.ts:1-3`, `:83-88`).
3. **The startup wait.** After the thread request, the driver waits until
   each enabled mount reports `ready`, `failed` or `cancelled`, at most
   30 s (`server/drivers/codex-mcp-startup.ts:2-5`, `:37-72`).
   - A timeout lets the turn start.
   - A stop or an exit ends the wait, with no `turn/start`.
   - The wait is skipped on a reused process, and on Codex older than
     0.117.0. That gate reads the version string, not a capability flag
     (`:8-12`).
4. **The slot during the wait.** The launch slot stays held during the wait
   (`codex.ts:1351-1363`).
5. **A failed server.** A failed optional server does not stop the turn.
   `mcpFailed` stops the keep, so the next turn starts cold (`:909-910`,
   `:679`).

**ACP** (`server/drivers/turn-mcp.ts`).

1. **The built-ins.** They go in a fixed order: `agents`, `composio`, our
   own apps, `browser`, `data`, `email`, `device`, `computer` (`:33-41`).
2. **The person's servers.** They come after the built-ins. A name that a
   built-in has is skipped (`:42-44`). A URL server always becomes a stdio
   remote proxy (`:47`).
3. **The count budget.** A tool count budget gives `agents` its whole list
   first and shares the rest (`:71-83`).
4. **The byte budget.** One native CLI gets a byte budget for the whole
   session (section "Two budgets" below).

**Chat API** (`openai-chat.ts:613`, `server/drivers/chat-mcp-tools.ts`).

1. **Required servers.** Only the `agents` server and a Local VM are
   required. Any other built-in that fails is skipped, and the model is told
   (`chat-mcp-tools.ts:561-566`, the v0.1.153 fix).
2. **Start limits.** 8 s, 30 s on a Cloud, 20 s for a built-in on Windows,
   and at least 20 s for `agents`. At most 32 servers (`:77-99`, `:593`).
3. **Stop.** The tools close at the end of the turn (section 3.3).

**Our own servers by URL** (`server/drivers/own-mcp-http.ts`).

1. **Why.** Each stdio proxy is "one Node helper per server, about 7
   threads each, all counted against a container's pids limit" (`:1-3`).
2. **The URL form.** It has the same token, so it has the same identity
   (`:3-4`).
3. **What stays stdio.** The permission server, the phone tools and the
   person's servers (`:4-5`).

**The harness proxy** (`server/harness-mcp-proxy.ts`,
`server/harness-mcp-request.ts`).

1. **Local answers.** `initialize` and `ping` are answered locally. Only
   `tools/list` and `tools/call` reach the server
   (`harness-mcp-request.ts:76-84`).
2. **The token never leaves the machine.** It is sent only to an `http`
   loopback URL with no path, no user and no query, and redirects are
   refused (`:86-96`).
3. **Limits.**
   - 1 MiB in, 16 MiB out, 16 requests in flight
     (`harness-mcp-proxy.ts:12`, `:22-26`, `:34`).
   - Timeouts are 130 s by default, 550 s for the computer and 705 s for a
     device (`server/harness-budget.ts:2-18`).
4. **Errors.** A `tools/call` error is a tool result with `isError: true`
   and a recovery text. The text tells refused, reset and timed out apart
   (`harness-mcp-request.ts:31-47`).

**Two budgets.**

1. **A count.** The driver learns the count from a refusal of the provider,
   retries one time, and keeps the count in memory only
   (`server/tool-count-limit.ts:82-120`).
2. **A byte size.** One native ACP CLI keeps about 58,700 bytes of tool
   definitions for the session. Past that it "leaves out the session's
   largest tools first" (`server/drivers/session-tool-budget.ts:6-8`). The
   reference project sets 55,000 bytes (`server/tool-list-budget.ts:17`) and
   gives each server a share.
   - For a relayed server, the next session sizes it from a record of the
     session before (`session-tool-budget.ts:3-5`, `:79-84`).
   - Over the budget, the reference project writes only a log line
     (`:90-92`).
   - The budget applies only when the agent's `initialize` names that CLI
     (`own-mcp-session-budget.test.ts:174-180`).
3. **The right to call.** A trim hides a definition. It does not remove the
   right to call the tool (`server/drivers/agents-mcp.ts:22`).

### 3.8 Steering into a running turn: the engine side

`queue-and-steer.md` §3 has the queue, the server's choice and the drain.
This section has what the engine does with a steer.

**The gates on the server.**

1. **The flags.** A steer needs `capabilities.queueing && adapter.steer`
   (`server/index.ts:7166`). Pictures also need `steerImages &&
   nativeImageInput`, and no videos (`:6078-6081`, `:7160-7164`). No driver
   name is checked.
   - Only Claude sets `steerImages` (`claude.ts:1891`).
   - ACP sets `queueing` only when the adapter has a steer
     (`server/drivers/acp/capabilities.ts:20`), and it refuses pictures
     (`acp/core.ts:1500-1501`).
2. **The engine that started the turn.** A steer goes to that engine, not to
   the bot's engine of now: "An interrupt or steer must reach the engine
   actually running, whatever the bot's settings say now"
   (`server/index.ts:6072-6076`).
3. **Checks after the wait.** After the steer call returns, the server reads
   the bot and the task again (`:7178-7182`). Test: a delayed steer after
   the bot is deleted gets 404 (`server/steer-e2e.test.ts:581`).
4. **A late "steered".** When the driver says `steered` but the turn has
   ended, the arrival path answers 409 "the running turn ended before the
   steered message could be recorded" and stores nothing (`index.ts:7186-7191`).
5. **Steers from the server itself.**
   - The loop guard steers a note into an unattended turn that loops
     (`:6982-6994`).
   - Question routing steers a teammate's answer (`:3842`).
   - Codex steers the answer of an async question (`codex-questions.ts:35`).

**What "steered" means for each engine.**

| Engine | The wire | "Steered" means | Read signal |
|---|---|---|---|
| Claude | One stream-json user line with a new `uuid` on stdin (`claude.ts:1744-1747`) | The write to stdin worked (`:1752`) | Yes, from CLI 2.1.282: an echo `{type:"user", isReplay:true, uuid}` when a model call takes the line in (`:1451-1455`). Nothing else reads it |
| Codex | `turn/steer {threadId, input, expectedTurnId}`, 10 s (`codex.ts:705-721`) | The RPC answered | No |
| Chat API | Nothing on the wire. The text goes in `asides` (`openai-chat.ts:964-969`) | Parked in memory | No signal to the server. The driver knows when it splices the text in (`:623-629`) |
| ACP, command (Hermes, custom) | A second `session/prompt` with `/steer <text>` | The agent's answer accepts it | No |
| ACP, request (OpenCode) | `_session/steering`, 15 s (`acp/core.ts:280`) | The request resolved | No |
| ACP, prompt (Devin, the steering engine) | A second `session/prompt` with the text (`acp/steer.ts:139-156`) | The prompt was sent | No |

**The Claude steer, step by step** (`claude.ts:1734-1753`).

1. **Refused.** The steer is refused when there is no session or no turn,
   the turn is settled, the session closes, or the child has exited
   (`:1736`).
2. **Counted first.** A new `uuid` goes into `pendingSteers` before the
   write: "a `result` read while the words are in flight must hold for them"
   (`:1744-1746`).
3. **A failed write.** It removes the uuid and returns `refused`
   (`:1747-1750`).
4. **A held result.** If a result is held, the steer gives the grace its
   full time again (`:1751`, commit `2130df92e`).
5. **The answer.** The steer returns `steered`, never `indeterminate`.

**One logical turn over several native turns (Claude).**

1. **The hold.** At each `result`, the driver holds the result when a steer
   waits or `queued_turn_count > 0` (`claude.ts:1531-1550`). The reason is
   in the code: "a turn.completed now would revoke the turn's capabilities
   under the continuation (its internal tools would answer 401)"
   (`:1532-1533`).
2. **A count of 0 decides nothing.** "queued_turn_count … misses a stdin
   steer not yet queued: it said 0 and the CLI ran the message 58 ms later.
   So 0 decides nothing." (`:1527-1530`).
3. **No echo.** Without `--replay-user-messages`, the driver cannot tell a
   folded steer from one that runs next. So it holds one time and clears
   the set (`:1534`).
4. **The grace.** `STEERED_CONTINUATION_GRACE_MS = 2_000`. With no `init`
   of the next native turn in that time, the held result settles the turn
   (`:309-311`, `:1536-1546`).
5. **The silence limit.** After the continuation's `init`,
   `STEERED_CONTINUATION_SILENCE_MS = 30_000`. A continuation that stays
   silent ends with `runtime.error` "Claude began a steered message but
   went silent; the turn was closed." (`:313-315`, `:1361-1374`).
6. **Usage and cost.** The driver adds the usage of the native turns. Cost
   takes the latest value, because the CLI reports a running total
   (`server/drivers/claude-turn-result.ts:11-32`).
7. **The proof.** An e2e test: the internal tools answer 200 during the
   continuation and 401 after it, and the event file has exactly one
   `turn.completed` (`steer-e2e.test.ts:327`).
8. **A late steer.** A steer that the CLI takes later than 2 s after the
   held result runs in the warm process after `turn.completed`, with the old
   turn id in its frames (`claude.ts:1301`). Inferred from the code, not
   tested.

**The ACP steer at the end of a turn** (`acp/core.ts:1298-1324`).

1. **The wait.** After the turn's own `session/prompt` answers, no new steer
   is taken. The core flushes the text and waits for each open steer
   prompt: "a steer the agent ran as a prompt of its own streams into this
   turn until then" (`acp/steer.ts:42-44`).
2. **A failed steer prompt.** A prompt steer that failed after `steered`
   fails the whole turn (`acp/core.ts:1305`).
3. **Folded replies.** A reply marked as folded does not decide the stop
   reason (`acp/steer.ts:166-169`). The steering engine marks it with
   `_meta.completionKind = "removedFromQueue"` (`server/drivers/acp/grok.ts:381`).
4. **One at a time.** The command and request kinds send one steer at a
   time (`acp/steer.ts:66-68`, `:101-134`).

**The steering engine** (`server/drivers/acp/grok.ts:360-414`).

1. **The engine fact.** For its CLI 1.0.89, `[ui] follow_up_behavior =
   "steer"` in its `config.toml` puts a second `session/prompt` into the
   running turn. The default "queue" makes the second prompt wait for the
   end of the turn. `initialize` does not report the setting (`:369-371`).
2. **The check.** Its prompt-steer object reads `config.toml` from the
   engine home on each turn. It is on only when the value is "steer". A
   read error means off, and then the steer is refused with no send
   (`:372-380`).
3. **The write.** Before each turn of a signed-in account, the driver writes
   `follow_up_behavior = "steer"` into that `config.toml`, unless the file
   already sets it or is not clear (`:388-414`, `:636`). The new file is
   0600, made with `wx`, then renamed, because the file "can hold `api_key`
   values" (`:404-406`).
4. **The engine home.** It is the engine's home variable, else a folder in
   the user's home (`:33-35`). If no instance home is set, the file is the
   person's own file. Not verified.
5. **A queue that looks like a steer.** The capability `queueing` is static,
   so a person who chose "queue" gets the steer path, and the engine
   refuses each steer. The e2e test uses this case as "an engine without
   live steering" (`steer-e2e.test.ts:123`, `:614`).

**The chat API steer** (`openai-chat.ts`).

1. **Park.** `steer` pushes the text to `asides` and returns `steered`. It
   returns `refused` when no turn runs or `ending` is set (`:964-969`).
2. **Splice.** At the top of each round, the driver takes all asides, joins
   them with a blank line and adds them as one user message. It never does
   this inside a tool batch (`:623-629`).
3. **The read point.** The tool calls of one batch run one after the other
   in one round (`:798-880`). So a steer that arrives during a batch is read
   only after the last call of the batch.
4. **A final answer with asides.** When the model gives its final answer and
   asides wait, the driver keeps the answer and runs one more round
   (`:778-781`, commit `86f082c93`).
5. **No round cap.** Since commit `d6788b49c` there is no limit on rounds.
   Repeated steers can make one turn longer, up to 200 tool calls (`:145`,
   `:791`). Inferred, not tested.
6. **The Stop window.** `ending` is set only in `finally` (`:887`). Between
   `abort()` and `finally`, a steer returns `steered`, the server stores it,
   and the turn ends with only the unread notice (`:899`). Inferred, not
   tested.

**Why a steered message was sent two times before v0.1.182.**

1. **The rule.** The "person first" rule stops a turn when its oldest tool
   call runs 60 s while the person's message waits
   (`server/host/person-first.ts:12`, `:98-126`).
2. **The requeue.** A steered message has a `requeue` callback. When the
   turn stops, the callback puts the same row back at the front of the
   queue (`server/index.ts:7192-7209`).
3. **The bug.** The engine reads a steered message together with the result
   of the tool call that runs at that time. Before the fix, the watch set
   `read = true` at a tool `item.completed` but kept the `requeue`.
   - The next tool call ran long with no text before it.
   - The rule stopped the turn and the message went back to the queue.
   - The engine had already read the words, so they ran a second time.
4. **The fix.** Commit `1128b084f`, merged as `a28d29d3d`, in v0.1.182: at
   each tool `item.completed`, every wait loses its `requeue`. "The engine's
   next step reads a steered message with this result, so queueing it again
   would run it twice" (`person-first.ts:165-167`). Test:
   `server/host/person-first.test.ts:81`.
5. **The cause that stays.** The server still guesses "read" from "a tool
   call completed". No driver sends a read event. The Claude driver has
   the echo, but it only deletes the uuid (`claude.ts:1451-1455`).

**Open cases at `42f86aefd`.**

1. **A loss.** Inferred, not tested.
   - After the first tool result of a batch, the rule drops the `requeue`
     (`person-first.ts:163-167`).
   - The chat API reads asides only after the whole batch
     (`openai-chat.ts:623-629`).
   - If the second call runs 60 s, the turn stops with no requeue. The
     engine never gets the words, and the person gets only
     `chat.notice.unreadMessage`.
2. **A second send on the queue steer route.** Inferred from the code, not
   tested.
   - The route stores rows only for `steered` with a busy bot, or for
     `indeterminate` (`server/routes/bot-messages.ts:431-434`).
   - A `steered` that returns after the turn ended restores the queue and
     drains it (`:466-468`). For Claude, the words are already on stdin.
   - The arrival path does the opposite: 409 and no row.

### 3.9 Rebuilt conversations

1. **The server decides.** The server, not the driver, decides between a
   resume and a rebuild (`server/resume-plan.ts:18-37`,
   `server/turn-context.ts:61-81`).
   - It sends `sessionReset: !resume`.
   - It sends a `resumeCursor` only on a resume.
   - It sends a `recoveryText` only with a cursor (`server/index.ts:7735-7746`,
     `:8315-8317`).
   - The `rewound` flag clears only after a dispatch that worked (`:8352`).
2. **The texts come from stored data.** The recovery text and the inline
   rebuild come from the stored branch (`selectReplay`'s `inline`, with
   tool lines when that setting is on). The `transcript` field has messages
   only, with no tool lines (`server/context-rebuild.ts:184-190`,
   `index.ts:7697`, `:7720-7740`). Tool lines are `[ran: <name>: <target> —
   ok|failed]`, at most 120 characters and at most 20. They never have the
   result body (`context-rebuild.ts:24-25`, `:69-93`).
3. **Native replay is a table, not a flag.** It is a table keyed by driver
   kind (`server/runtime/capabilities.ts:12-53`). All chat kinds have
   `{ resume: false, transcript: true }`.
4. **The driver says "rebuilt".** A driver reports a new session built from
   the recovery text with `session.started { rebuilt: true }`
   (`server/contracts.ts:302-304`). The only reader is `Handoffs`, which
   then credits the new session only with what the rebuild carried
   (`server/delta-context.ts:290-297`, `:318-338`).
5. **The classification** (`server/resume-recovery.ts:1-24`). The driver
   classifies a failed resume "from the driver's protocol state, never from
   provider error text".
   - `before-accept` may replay one time.
   - `after-accept` and `unknown` may not.
6. **Claude.**
   - A `--resume` that the CLI refused before `init` rebuilds one time, with
     the same turn id (`claude.ts:1477-1483`, `:1654-1690`). The CLI either
     exits or, from 2.1.295, sends an error result and stays up.
   - New, in no tag: a CLI below 2.1.267 keeps the system prompt it
     recorded at launch. When the prompt hash changed, the driver drops the
     resume and rebuilds (`:939-951`, commit `5638d70a4`).
   - An edit closes the live process with the reason "context reset"
     (`:1100`, `:1128`).
   - The notice: "<engine> could not reopen this conversation's session, so
     it went on in a new one started from the chat; results of earlier tool
     calls did not carry over." (`resume-recovery.ts:44-46`,
     `claude.ts:1376-1377`).
7. **Codex.**
   - An archived thread is unarchived and resumed (`codex.ts:1255-1266`).
   - A missing thread, an archived thread or a provider mismatch rebuilds
     one time (`:1280-1294`).
   - New, in no tag: past 85,000 characters of instruction blocks, the
     next edit moves the thread to a new session with
     `instructionsOverflowNotice` (`codex-instructions.ts:38-39`,
     `:104-109`, `codex.ts:1321-1331`). The commit message says that before
     this, the thread "froze silently" with a 400 error on each turn.
   - `docs/verification/codex-instructions.md:26-28` is out of date: it
     says that a failed resume is not replayed.
8. **ACP.**
   - `sessionReset` closes the pooled session (`acp/core.ts:947-950`).
   - A failed load of the live session relaunches one time
     (`:1155-1164`).
   - Else the core rebuilds, always as `before-accept`. With no recovery
     text, the turn fails (`:1166-1181`).
   - It sets `rebuilt: true` and shows no notice (`:1195`). Only `claude.ts`
     and `codex.ts` import `rebuiltSessionNotice`.
9. **The chat API.** It has no session. A rewind, a Start fresh, a
   compaction or an engine switch uses the same code as a normal turn
   (section 3.3).
10. **A restart.** `Handoffs` writes its record at the first acting event.
    A restart loses only the credits of `turn.completed`. The next turn
    resumes and offers those replies again (`delta-context.ts:299-308`,
    `server/delta-context.e2e.test.ts:1120`). A chat teammate cut by a
    restart runs again one time with "this turn continues it"
    (`delta-context.e2e.test.ts:650-702`).

### 3.10 Engine details

**A custom Claude endpoint** (`server/claude-endpoints.ts`).

1. **What it is.** A Claude instance whose requests go to another host that
   speaks the Anthropic API. It has its own folder, and the person's own
   Claude CLI keeps its sign-in (`:1-3`).
2. **What the instance keeps** (`:93-145`):
   - `endpointModels` (the first one is the default) and
     `requireApiKey: true`.
   - `configDir = <DATA_DIR>/providers/<id>`.
   - `access: "custom"`.
   - the token in the instance environment of `config.json`, as
     `ANTHROPIC_AUTH_TOKEN` and `ANTHROPIC_API_KEY`.
3. **The tiers.** Four tier fields map to `ANTHROPIC_DEFAULT_OPUS_MODEL`,
   `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL` and
   `ANTHROPIC_SMALL_FAST_MODEL` (`:48-53`).
4. **Edits.** A new address needs the token again. "A saved token belongs
   to the address it was entered for" (`:157-158`).
5. **The turn.**
   - It strips the inherited account keys (`claude.ts:122-129`).
   - It pins the model to the endpoint list (`:233`).
   - It makes the folder before each spawn, because the Cloud box needs it
     (`server/drivers/claude-endpoint-folder.ts:3-20`).
   - When a resumed thread would send more than 20 images, it folds the old
     images into a note (`claude.ts:1099`, `:1213`).

**Codex helper events** (`codex.ts:917-943`,
`docs/verification/codex-helpers.md`).

1. **The filter.** A message whose `threadId` is not the parent's is
   dropped: "only this request's parent writes or settles". After the turn
   id binds, the turn id must match too.
2. **What passes.** A connection-level `error` with no thread and no turn,
   and a `guardianWarning` scoped to the thread (Codex 0.147).
3. **Approvals of helpers.** They are not filtered. They go to the approval
   broker (`codex.ts:724-859`).

**Codex instructions with a receipt** (`codex-instructions.ts`).

1. **The receipt file.** `<DATA_DIR>/codex-instructions/<sha256(key,
   nativeThreadId)>.sha256` is JSON `{instructions, volatile?, injected?}`,
   mode 0600. It holds no prompt text (`:89-92`).
2. **A changed block.** On a resumed thread, a changed block goes with
   `thread/inject_items`, because Codex 0.153.4 keeps the first developer
   message until compaction (`:102-128`).
3. **The two writes.** The driver writes the receipt after Codex
   acknowledges. It writes the volatile digest only after `turn/start`
   accepts the input, so a rejected turn sends it again (`codex.ts:1361-1362`).

**Codex and the browser** (`server/drivers/codex-tool-surface.ts`,
`docs/verification/codex-browser-routing.md`).

1. **Off for each launch.** `-c` overrides turn off Codex's own browser,
   computer use and plugins for each launch: "Plugins the ChatGPT account
   installed reach every Codex home signed in to it (codex-cli 0.167.0)"
   (`:1-13`).
2. **Our bridge.** The bot uses our `browser` MCP mount instead
   (`codex.ts:493-495`).
3. **Web search.** Native web search stays as the person's config sets it
   (`codex-tool-surface.ts:14`).

**Codex unsupported calls** (`server/drivers/codex-unsupported-calls.ts`).

1. **The problem.** When a gateway drops the MCP namespace of a tool call,
   Codex answers the model "unsupported call" and the turn goes on.
2. **The scan.** The only trace is the rollout file, so at
   `turn/completed` the driver scans what the turn appended, at most
   16 MiB (`:1-4`, `:16`, `:63-99`).
3. **The notice.** It tells the person to pick another model.

**Background calls.**

1. **Claude.** One-shot calls have no tools, no MCP and no session file.
   Thinking and hooks are off. They run in an empty temp folder, with
   limits of 60 s and 1 MB (`server/drivers/claude-background.ts:8-42`,
   `claude.ts:1775-1814`).
2. **Codex.** It uses `codex exec --ephemeral --ignore-user-config` with 16
   features off. Any tool item ends the call before its result is read
   (`server/drivers/codex-background-text.ts:104-125`, `:185-190`).

## 4. The data

### 4.1 Types and events

| Name | Fields | Source |
|---|---|---|
| `SteerOutcome` | `"steered" \| "refused" \| "indeterminate"` | `server/contracts.ts` (see `queue-and-steer.md` §3.12) |
| `session.started` | `sessionId` (null for the chat driver), `model`, `rebuilt?`, `mcpFailed?` | `server/contracts.ts:302-304`, `claude.ts:1375-1378`, `openai-chat.ts:608` |
| `NativeTurnResult` (Claude) | `ok`, `stopReason`, `cost`, `usage?`, `unsent?` | `server/drivers/claude-turn-result.ts:1-32` |
| `KeepWarmContract` (Claude) | `args`, `env`, `cwd`, `system`, `mcpServers`, `settings`. In memory only | `server/drivers/claude-keepwarm.ts:29-37` |
| `KeptCodex` | connection, contract, `nativeThreadId`, `configDigest`, cwd, identity, provider, model, carried | `server/drivers/codex-warm.ts:238-250` |
| `HandedState` | `session?`, `config?`, `effort?`, `omitted?`, `through?`, `ids` for each thread and engine | `server/delta-context.ts:37-48` |
| `ReplayEntry` | `id`, `role`, `text`, `priorSummary?` | `server/context-rebuild.ts:10-15` |
| `CacheKeepWarmStatus` | `state: "warm"\|"stopped"`, `until?`, `nextPingAt?`, `last?: {at, read, write, costUsd}`, `stopped?` | `packages/phone-protocol/src/wire.ts:196-202` |
| `PersonWait` | `requeue?(note)` | `server/host/person-first.ts:17-22` |

### 4.2 Capability flags that this feature reads

These are flags on the adapter (`server/contracts.ts:255-310`):

- `queueing` (it takes a steer) and `steerImages` (it takes pictures in a
  steer).
- `strictResume`. Claude makes it a getter on the version of its CLI
  (`claude.ts:1893-1895`).
- `nativeCompaction` and `cacheKeepWarm` (with `.compact`).
- `ownMcpOverHttp`, `mcpServersFromLaunch`, `restartOnMcpChange` and
  `sessionToolBudget` (ACP).
- `coldStart: "expensive"` (session idle).

Native replay is not a flag. It is the kind table
`server/runtime/capabilities.ts:12-53`.

### 4.3 Files on disk

| File | Mode | Life |
|---|---|---|
| `<tmp>/omb-mcp-XXXX/mcp.json`, `auth-settings.json` (Claude) | 0600 | Removed at `settle` (`claude.ts:1285-1288`) |
| `<tmp>/omb-system-XXXX/prompt.txt` (Claude) | 0600 | Removed at `settle` |
| `<DATA_DIR>/hook-tokens/<sha256(botId\0threadId)[0..24]>/token` | 0600 in a 0700 folder | Written each turn (`claude.ts:321-326`, `:1049-1057`) |
| `<tmp>/omb-keepwarm-*` (fork files) | 0600 | Removed when the fork ends (`claude-keepwarm.ts:161-209`) |
| `claude-cost-history.json` | — | 100 sessions, 8 states each. Written with `durable: false`, errors ignored (`claude-cost-history.ts:7-9`, `:35-37`) |
| `<DATA_DIR>/codex-instructions/<sha>.sha256` | 0600 | Written after the acknowledgement (`codex-instructions.ts:89-92`) |
| `<DATA_DIR>/providers/codex-own/<sha256(instanceId)>/codex` | 0700 | The Codex home of an own-login turn (`codex-shared-home.ts:141-159`) |
| `<DATA_DIR>/providers/<id>` | 0700 | The folder of a custom Claude endpoint |
| `DATA_DIR/tool-list-records/<sha256(botId\0server)[0..40]>.json` | — | The list of a relayed server, for the next session (`session-tool-budget.ts:38-40`, `:70`) |
| `task.handedMessages[instanceId]` | in the thread record | Written at the first acting event (`index.ts:6965-6971`) |

### 4.4 Settings and environment variables

| Name | Effect | Source |
|---|---|---|
| `cacheKeepWarm: {enabled, windowMinutes 15..1440}` | Keep-warm. Off by default, 180 min | `server/config.ts:264-268`, `:586-587` |
| `OMB_CLAUDE_INHERIT_USER_CONFIG=1` | Every Claude bot loads the person's MCP servers, skills, hooks and `CLAUDE.md` | `claude.ts:141-156`, `:916` |
| `OMB_CLAUDE_AUTOCOMPACT` | A token count, `auto` or `off`. Clamped to 100,000..1,000,000 | `claude.ts:183-194` |
| `OMB_CODEX_SESSION_KEEP=0` | No warm Codex keep | `codex-warm.ts:261` |
| `OMB_CODEX_LAUNCH_SLOTS` | The number of Codex launch slots | `codex-process.ts:8-12` |
| `OMB_<PREFIX>_SESSION_IDLE_MS`, `OMB_SESSION_IDLE_MS`, `OMB_IDLE_ENGINES_MAX` | Idle times and the cap | `session-idle.ts:65-121` |
| `OMB_ENGINE_PRESTART=0` | No prestart | `session-idle.ts:252-256` |
| `OMB_OWN_MCP_HTTP` | Exactly "1": our servers by URL. "0": off | `own-mcp-http.ts:13-21` |
| `OMB_SESSION_TOOL_BUDGET=0` | Count only our own servers in the byte budget | `session-tool-budget.ts:18-19` |
| `OMB_PERSON_FIRST_MS` | The tool time before a stop for the person (60 s) | `person-first.ts:12`, `index.ts:6997` |
| `OMB_WARM_SUMMARY=0` | No warm summary | `index.ts:5183` |
| `ENABLE_TOOL_SEARCH` | Set to `true` in the private Claude settings | `claude-tool-search.ts:5-12` |
| `FAKE_CLAUDE_*_SCALE`, `FAKE_CODEX_STEER_TIMEOUT_MS` | Test time scales that the production drivers read | `claude.ts:317-319`, `:888`, `codex.ts:709` |

### 4.5 Limits

| Limit | Value | Source |
|---|---|---|
| Steer grace and silence (Claude) | 2 s, 30 s | `claude.ts:309-315` |
| `turn/steer` (Codex) | 10 s | `codex.ts:709` |
| ACP request steer | 15 s | `acp/core.ts:280` |
| Codex RPC | 180 s at startup, 60 s after | `codex-process.ts:69-74` |
| Codex MCP startup wait | 30 s | `codex-mcp-startup.ts:4-5` |
| Codex early events | 1024 | `codex.ts:928-937` |
| Codex stop retries | 12 × 5 s | `codex-process.ts:80-87` |
| Codex instruction blocks | 85,000 characters | `codex-instructions.ts:38-39` |
| Claude retry | 2 tries | `retry.ts:6`, `:222-226` |
| Claude session close | 5 s, then a kill | `claude.ts:796` |
| Keep-warm | 50 min ping, 60 min TTL, 50,000 tokens, write ratio 0.1, ping timeout 120 s | `cache-keepwarm.ts:13-20`, `claude-keepwarm.ts:27` |
| Warm summary | 5 min. Parked forks: 1 h, 200 | `claude-warm-summary.ts:14-18` |
| Prestart | 2 spares, 30 s or 180 s, 3 s for each reconnect, 32 launches | `session-idle.ts:235-246`, `claude-prestart.ts:15`, `engine-prestart.ts:100` |
| Byte budget (one ACP CLI) | 55,000 bytes, 8,000 reserved for an unknown list | `tool-list-budget.ts:17`, `session-tool-budget.ts:21-22` |
| Harness proxy | 1 MiB in, 16 MiB out, 16 in flight, 130 / 550 / 705 s | `harness-mcp-proxy.ts:12`, `harness-budget.ts:2-18` |
| Chat MCP start | 8 s, 30 s Cloud, 20 s Windows built-in or agents, 32 servers | `chat-mcp-tools.ts:77-99`, `:593` |
| Chat tool close | 5 s, 15 s on Windows | `chat-mcp-tools.ts:211-221` |
| Chat delivered text | 256 threads, 24,000 extra bytes | `openai-chat.ts:155-156` |
| Person first | 60 s, 500 ms floor, 10 s recheck | `person-first.ts:12-14`, `:72` |
| Capability orphan | 30 days | `index.ts:1610` |

## 5. The UI

1. **The keep-warm line.** Each task carries a `cacheKeepWarm` status
   (`server/index.ts:2846-2851`). The chat shows "cache warm · next ping
   {time} · last ping read {tokens} for {cost} · until {time}", or
   "keep-warm stopped: {reason}" (`src/lib/cache-keepwarm.ts:7-23`).
2. **The keep-warm setting.** The setting is "Keep prompt cache warm", "For
   Claude bots signed in with a subscription". Its help text says "Nothing
   appears in the chat" (`src/locales/en.json`, keys `settings.keepWarm.*`).
3. **A steered message.** It shows in the transcript with `steered: true`
   in its place in time (`steer-e2e.test.ts:169`). A Hermes answer to
   `/steer` never shows (`:671`).
4. **Notices in the chat:**
   - `rebuiltSessionNotice` and `instructionsOverflowNotice` (section 3.9).
   - `chat.notice.unreadMessage`, when a chat turn failed before it read a
     steer (`openai-chat.ts:899`).
   - `TEAM_TOOLS_FAILED`: "This bot's team tools didn't connect, so it
     couldn't reach other bots this time. They reconnect on your next
     message." (`server/drivers/team-tools.ts:2`).
   - "Waiting for a free Codex slot …" (`codex.ts:418-432`).
   - `chat.notice.codexActionMayHaveRun` and `chat.notice.codexUnsupported*`
     (section 3.10).
   - "Claude began a steered message but went silent; the turn was closed."
     (`claude.ts:1370-1371`).
5. **The person-first stop line.** It is the line
   "server.personFirst.stoppedSeconds|Minutes", stored as an activity row
   (`person-first.ts:54-58`, `index.ts:6998`).
6. **Custom endpoint UI.** In Settings → Engines → the Claude card:
   - **Add endpoint** asks for a name, a base URL, an API key and an
     optional model.
   - A row has **Edit** and **Remove**. The token is never shown.
   - **Remove** is off while a bot uses the endpoint
     (`docs/verification/claude-endpoint.md:20-42`).
7. **Update card.** Below Claude CLI 2.1.267 the card is "Update Claude Code
   for context controls" (`server/drivers/claude-cli-version.ts:40-58`).

## 6. The tests

**Claude** (`server/drivers/claude.test.ts`, 259 tests, with
`server/testing/fake-claude-cli.ts`).

- The event order of one turn (`:611-637`).
- Never sent again after an answer (`:4202-4215`, `:4277-4288`,
  `:5132-5150`).
- Stop ends the turn one time as `interrupted`: with an unconfirmed tree
  once the root closes, in a steer hold, in a continuation and during a retry wait
  (`:3319-3406`, `:3670-3726`, `:3791-3810`, `:4290-4335`).
- Steering:
  - "keeps the turn open while a steered message the CLI could not fold
    runs as its next native turn" (`:3478`).
  - "holds on queued_turn_count 0 too" (`:3539`).
  - "closes the turn at once on a steer the CLI echoed as taken in"
    (`:3620`).
  - "gives a steer that lands while a result is held the whole grace"
    (`:3728`).
  - "closes a steered continuation that announces itself and then stays
    silent" (`:3764`).
- Rebuilt sessions: one fresh session from `recoveryText`, `rebuilt: true`,
  one notice, only one time (`:5008-5163`). The stale prompt rebuild
  (`:1711-1740`).
- Spawn contract and warm reuse (`:434-479`, `:3953-4069`).

**The fake Claude CLI.** It has five surfaces chosen by argv: probes,
sign-in, one-shot text, the stream-json turn process and an orphan guard
(`fake-claude-cli.ts:356-457`, `:459-595`, `:597-1450`, `:158-168`).

- A line that arrives during a turn is steered. `FAKE_CLAUDE_LATE_STEER_GATE`
  plays the 2.1.282 behaviour, where a late steer runs as the next native
  turn (`:1428-1435`).
- `FAKE_CLAUDE_QUEUED_TURN_COUNT=zero` plays the count of 0 that 2.1.282
  reports (`:89`, `:1198`).
- Each dump writes all of `process.env` to a file (`:475`, `:501`, `:568`,
  `:942`).

**Codex** (`server/drivers/codex.test.ts` with
`server/testing/fake-codex-app-server.ts`).

| Behaviour | Tests |
|---|---|
| MCP startup wait | `:188-243` |
| Warm (kept) app servers | `:823`, `:3093`, `:3605-3837`, keep off `:2415` |
| Rebuilt conversations | `:879`, `:1851`, `:1869`, `:2696-2760`, `:2892-3020` |
| Helper events | `:927`, `:954`, `:3157` |
| Instructions with a receipt | `:837`, `:879`, `:1220`, `:3022-3080`, `:4420` |
| Steer and async answers | `:3317`, `:3839-3915` |
| Stop and an unconfirmed end | `:2659`, `:2801`, `:2819`, `:3932-3964` |
| Retries and no replay | `:4404-4652` |

The fake app server answers `turn/steer` only when `expectedTurnId` matches
(`fake-codex-app-server.ts:802-821`). It does not play an MCP server that
dies during a turn, or a URL that answers 405 (`:387-410`). No test checks
that a failed MCP server blocks the warm keep (`FAKE_CODEX_MCP_FAILED` is
used only at `codex.test.ts:189`).

**Steering, end to end** (`server/steer-e2e.test.ts`, POSIX only).

- The Claude steer (`:169`).
- The continuation keeps its internal tools until it ends (`:327`).
- Pictures in a steer (`:476`).
- A delayed steer after the bot is deleted gets 404 (`:581`).
- An engine with no live steer keeps the queue (`:614`, `:778`).
- Hermes `/steer` (`:671`).
- Codex `turn/steer` with `expectedTurnId` (`:709`).
- Room steers (`:803-1038`).

The v0.1.182 test: `server/host/person-first.test.ts:81`.

**Not tested:**

- the 409 of a late `steered`.
- a chat API steer end to end.
- the loss after the first tool of a batch.
- the steering engine with steer on, except in
  `server/drivers/acp/grok-steer.test.ts:98-190`.

**Keep-warm and MCP.**

- `cache-keepwarm.test.ts` (pings at 50, 100 and 150 min, and a stop on a
  cold ping). Its fake ping ignores the abort, so the test books an aborted ping
  that the real driver does not book (`:152-153`).
- `claude-warm-summary.test.ts:131-153` is the v0.1.178 test: two pings
  each book 0.012, not 11.452.
- `session-tool-budget.test.ts` and `own-mcp-session-budget.test.ts` hold
  the byte budget against a golden file.
- `harness-mcp-proxy.test.ts` checks that the token never goes to another
  host (`:172-176`).

**Rebuilds.** `server/delta-context.e2e.test.ts`:

- an edit resets the Claude context (`:525-555`).
- a rejected resume rebuilds once (`:353-369`).
- a restart reruns a cut teammate turn once (`:650-730`).
- a Codex thread that is gone is rebuilt (`:1197-1222`).

`resume-recovery.test.ts` checks the rule "classifies from state alone — no
error text is consulted" (`:42`).

## 7. Ours compared

Our state: step 2 is done. `crates/bot-protocol/src/event.rs` has the five
events of decision D20. `bot-engine`, `bot-core` and `bot-cli` have no
driver, no runtime and no store yet.

| Topic | Reference files | Ours (crate, module) | Difference |
|---|---|---|---|
| Steer outcome and the `queueing` flag | `server/contracts.ts:286-289`, `:324-329`, `server/index.ts:7166` | `bot-protocol` (a `SteerOutcome` type), `bot-engine::driver` (the `Driver` trait of step 3) | Not built. D22 has no `Capabilities` struct until a step reads a flag. The chat driver of step 5 would be the first reader of `queueing` |
| A read signal for a steer | `claude.ts:1451-1455` (Claude has it, nobody uses it) | `bot-protocol::event` | Not in D20. See P589 |
| Chat driver round loop and asides | `openai-chat.ts:202-205`, `:622-629`, `:778-781`, `:964-969` | `bot-engine::chat` (step 5) | Step 5 plans one request with no rounds. See P591 |
| Chat driver with no session | `openai-chat.ts:479-509`, `:608` | `bot-engine::chat`, `bot-core` (the transcript in `SendTurnInput`) | Step 5 has no transcript field yet. See P593 |
| Per-turn MCP mount and close | `openai-chat.ts:613`, `:891`, `chat-mcp-tools.ts:211-221`, `:561-566` | `bot-engine::chat` (step 12 with P33) | Not built |
| ACP pool key and MCP after `initialize` | `acp/core.ts:945-954`, `:1133`, `:1176` | `bot-engine::acp` (step 9) | Not built. See P596 and P597 |
| ACP steer strategies | `acp/steer.ts:1-190`, `acp/core.ts:1298-1324` | `bot-engine::acp` (step 9) | Not built. See P595 |
| Rebuild decided by the server | `resume-plan.ts:18-37`, `turn-context.ts:61-81`, `resume-recovery.ts` | `bot-core` (the runtime, P461) | Not built. See P593 and P594 |
| Bearer for each thread, record for each turn | `server/index.ts:1644-1790` | `bot-core` (step 12 or 13), `bot-cli` (the HTTP route) | Not built. See P599 |
| Warm Claude and Codex, keep-warm, prestart | `claude.ts`, `codex-warm.ts`, `cache-keepwarm.ts`, `engine-prestart.ts` | No step. A later Claude or Codex adapter | Not planned |
| Custom endpoint | `server/claude-endpoints.ts` | No step for Claude. The chat driver of step 5 has an address and a key | The reference keeps the token in `config.json`. Our P19 keeps keys in the keychain |

## 8. Where we can be better

### 8.1 The problems of `changelog.md` section 5 in this code

| Problem | Releases | State at `42f86aefd` |
|---|---|---|
| A turn or a wait that does not end | v0.1.85, v0.1.132, v0.1.151 | The Claude and Codex drivers have no idle timer after the start. The host stops a quiet turn after 20 min (`TURN_STALL_MS`). Claude sends `tool_progress` every 30 s as proof of life (`claude.ts:1470-1473`). The steer waits have limits: 2 s and 30 s for Claude, 10 s for Codex, 15 s for an ACP request. Codex always completes a stopped turn after 12 retries (`codex.ts:681-685`). Still open: a Claude stop whose root process stays alive waits for that root with no limit (`claude.ts:756`, inferred). The auth-recovery hold has no timer (`claude-auth-recovery.ts:108`). A Codex question has no timer (`codex.ts:838`). The chat turn always ends in its `finally` (`openai-chat.ts:886-924`) |
| The same work done or delivered two times, or lost | v0.1.150, v0.1.182 | v0.1.150: `answered` stops a resend (`claude.ts:1424`, commit `812c99063`). Still open: only `text_delta` sets `sawStreamDelta` (`:1392`), so a turn that streamed only reasoning can be sent again. v0.1.182: the requeue is dropped after a tool result (`person-first.ts:165-167`, commit `1128b084f`). Still open, inferred: the queue steer route can run steered words again (`bot-messages.ts:431-434`, `:466-468`), and a chat steer can be lost after the first tool of a batch (`openai-chat.ts:623-629`) |
| State lost at a restart or a crash | v0.1.165 | Warm state is not kept, on purpose (`cache-keepwarm.ts:7-8`). The thread record of `Handoffs` is written at the first acting event, so a restart loses only the credits of `turn.completed` (`delta-context.ts:299-308`). A chat teammate reruns one time (`delta-context.e2e.test.ts:650-702`). The learned tool count is in memory only (`tool-count-limit.ts:82-90`) |
| Sign-in to an engine, and engine CLIs that change | v0.1.101, v0.1.153, v0.1.177, v0.1.178 | v0.1.101: Codex 0.160 shell policy, commit `6ba128a89` (`codex.ts:129-150`). v0.1.153: `claudeOAuthExpired` gives `auth_required` (`claude.ts:1487`, commit `e5a4e223f`). v0.1.177 and v0.1.178: a half-written `auth.json` is not a missing login (`codex-login.ts:70-71`), and the Claude snapshot keeps the last known auth (`claude.ts:1770`). Both drivers hold many facts pinned to a CLI version. Still open: an unknown Claude version counts as supporting every flag (`claude-cli-version.ts:36-38`) |
| The size of the tool list of one turn | v0.1.182 | Claude uses tool search and deferred tools, and has no open gap (`claude-tool-search.ts`, `agents-claude-defer.ts`). For one ACP CLI, a byte budget came in v0.1.182 (`09a4d73cb`) and v0.1.184 (`b2e662007`). Still open: over the budget there is only a log line (`session-tool-budget.ts:90-92`). The first session guesses the list of a relayed server. A server that is not relayed is not fitted |
| One slow or stuck part blocks all the others | v0.1.153, v0.1.178 | The v0.1.153 fix is in the chat driver (`chat-mcp-tools.ts:561-566`, commit `84450939f`). Codex counts `failed` as settled and waits at most 30 s. The v0.1.178 fix drops a URL that answers 405 (`server/host/mcp-url-checks.ts:20-24`). Still open: the Codex launch slot is held during the MCP wait (`codex.ts:1351-1363`), so one slow server delays other launches by up to 30 s. A failed server makes the next Codex turn start cold (`:679`) |
| The person's own engine config reaches the bots | v0.1.104, v0.1.175 | v0.1.104: `claudeMdExcludes` (`claude.ts:1064`). v0.1.175: `AGENTS.md` is not linked into the Codex home of the reference project (`codex-shared-home.ts:23-24`). Still open: `OMB_CLAUDE_INHERIT_USER_CONFIG=1` (`claude.ts:141-143`). The tool search setting reads `~/.claude/settings.json` (`claude-tool-search.ts:102-104`). Codex keeps the person's own home, and so reads `AGENTS.md`, in several early returns (`codex-shared-home.ts:148-155`). The steering engine's driver may write the person's own `config.toml` (inferred) |
| Usage and cost numbers corrected | v0.1.178 | Fixed by commit `a9d483545`: a fork books only the growth over a stored base (`claude-keepwarm.ts:86-99`, `claude-cost-history.ts:71-92`). Still open: an aborted ping or summary books nothing, although its prompt was sent (`claude-keepwarm.ts:212-215`, `cache-keepwarm.ts:122`). A summary dropped as busy books nothing (`claude-warm-summary.ts:139`). With no matching base, the whole total is booked (`claude-cost-history.ts:44`) |

### 8.2 Proposals

The step of each proposal is the first step where its mechanism exists. A
proposal for a Claude or Codex adapter is "later", because the plan has no
step for those adapters.

**P589 (step 5, `bot-protocol`, changes D20). A read signal for a steer.**

Problem in the reference: a steered message ran two times. The server
guessed when the engine read it and put words back in the queue that the
engine already had (v0.1.182, "a steered message is no longer sent twice",
`server/host/person-first.ts:165-167`, commit `1128b084f`). The guess stays:
the server marks a steer "read" when any tool call completes. The Claude
driver gets the exact signal from the CLI echo and only deletes a uuid
(`claude.ts:1451-1455`). Theme: "The same work done or delivered two times,
or lost" (v0.1.150, v0.1.182).
- `Driver::steer` takes a `SteerId` that the runtime makes (D17).
- A new event `steer.read { steer_id }`, or a field of an existing event,
  says that a model call took the steer in.
- A capability `steer_read_signal` says if the driver sends it.
- The chat driver of step 5 knows the exact point: the top of a round
  (`openai-chat.ts:623-629`).
- The runtime puts a stopped steer back in the queue only when the driver
  has the signal and the event did not come. With no signal, it never puts
  it back (the v0.1.182 rule).
- This adds new facts to P64.

**P590 (step 5, `bot-protocol`, changes D20). Unread steers come back at the
end of the turn.**

Problem in the reference: after the v0.1.182 fix, a
steered message can be lost. The first tool result of a batch marks it
read, but the chat driver reads it only after the whole batch, and a stop
on the second call drops it with only a notice (`person-first.ts:163-167`,
`openai-chat.ts:623-629`, `:899`). Inferred, not tested. A steer between
`abort()` and `finally` is also never read (`openai-chat.ts:887`, `:966`).
Theme: "The same work done or delivered two times, or lost" (v0.1.182).
- `turn.completed` carries the ids of the steers that the driver did not
  splice in.
- The runtime puts them back at the front of the queue in the same
  transaction as the end of the turn (`AGENTS.md`).
- This also gives one answer for a late `steered` on both paths. The
  reference answers 409 on the arrival path (`index.ts:7186-7191`) and puts
  the words back in the queue on the queue steer route
  (`routes/bot-messages.ts:466-468`). This adds new facts to P34 and P64.

**P591 (step 5, `bot-engine::chat`, adds the `Capabilities` struct of D22 and
P57). The chat driver takes a steer between rounds.** Follows the reference.
- The driver parks the text. It refuses a steer once `ending` is set.
- At the top of each round it adds all parked steers as one user message,
  never inside a tool batch.
- When the model gives its final answer while steers wait, the driver keeps
  the answer and runs one more round.
- This works with no tools: the end of each completion is a round boundary
  (`openai-chat.ts:202-205`, `:622-629`, `:778-781`, `:964-969`, test
  `openai-chat.test.ts:584`).
- `queueing` is then the first flag that a step reads. D22 says that the
  `Capabilities` struct comes with that step.

**P592 (step 5, `bot-engine::chat`). A round budget for steers.** A judgment
call, with no release problem behind it. Since commit `d6788b49c` the
reference has no round cap, so repeated steers can make one turn longer, up
to 200 tool calls (`openai-chat.ts:145`, `:791`). Inferred, not tested.
Keep a budget of rounds. At the last round of the budget, set `ending`, as
commit `dad54b565` did, so a late steer is refused and goes to the queue.

**P593 (steps 5 and 9, `bot-core` and `bot-engine`). The runtime decides the
rebuild, and native replay is a capability flag.**

A judgment call: the `AGENTS.md` rule on capability flags, with no release
problem behind it. The decision itself follows the reference:
- The runtime sends `session_reset`, `resume_cursor` (only on a resume),
  `recovery_text` (only with a cursor) and `transcript`.
- It builds the recovery text from stored rows.
- `rewound` clears only after a dispatch that worked (`resume-plan.ts:18-37`,
  `turn-context.ts:61-81`, `index.ts:7735-7746`, `:8352`).
- The chat driver keeps no session and builds each request from
  `transcript` (`openai-chat.ts:479-509`).

The reference keys native replay on the driver kind
(`server/runtime/capabilities.ts:12-53`). We make it a capability flag. This
adds new facts to P250 and P461.

**P594 (step 9, `bot-core`). One notice for each rebuilt session, on every
driver.** A judgment call, with no release problem behind it. The ACP core
sets `rebuilt: true` and shows no notice (`acp/core.ts:1195`). Claude and
Codex tell the person that earlier tool results did not carry over
(`claude.ts:1376-1377`, `codex.ts:1330-1331`). The runtime shows one notice
when `session.started` has `rebuilt`, so no driver can forget it.

**P595 (step 9, `bot-engine::acp`). One `SteerStrategy` enum.** Follows the
reference.
- The variants are `None`, `Command { name }`, `Request { method }` and
  `Prompt { enabled, folded }`.
- A request has 15 s. A prompt uses the idle limit of the turn.
- Command and request send one steer at a time.
- The turn waits for its steer prompts before it ends. A failed steer
  prompt fails the turn.
- Sources: `acp/steer.ts:1-190`, `acp/core.ts:280`, `:1028-1034`,
  `:1298-1324`.

**P596 (step 9, `bot-engine`). Warm engines are capability flags, and the
pool key holds the MCP list.** Follows the reference.
- Flags: `warm_process`, `restart_on_mcp_change`, and later `fork_session`,
  `prestart` and `defers_tools`. The chat driver of step 5 sets none,
  because "A metered API key's main cache lives five minutes by default"
  (`cache-keepwarm.ts:6-7`).
- The ACP pool uses a process again only on an equal key of MCP servers,
  tool scope and system hash (`acp/core.ts:945-954`).
- A changed key closes the old process first and logs only the names of the
  changed fields (`claude-spawn-contract.ts:4-35`, `codex-warm.ts:215-235`).
- A kept process is never given to another conversation
  (`codex-warm.ts:266`).

**P597 (step 9, `bot-engine::acp`). The MCP transport and the byte budget
come from capability flags and the `initialize` answer, not from an agent
name.**

A judgment call: the `AGENTS.md` rule on capability flags, with no release
problem behind it. The behaviour follows the reference. The
reference picks the byte budget by the agent name in `initialize`
(`own-mcp-session-budget.test.ts:174-180`). It picks the built-in servers
by driver kind (`turn-mcp.ts:119`). Make both flags of the adapter.

**P598 (step 9, `bot-engine`, and step 12). A notice when the tools are over
the byte budget.**

Problem in the reference: over the budget, the reference
writes only a log line, and the CLI then drops the largest tools with no
word to anyone (`session-tool-budget.ts:90-92`). Theme: "The size of the
tool list of one turn" (v0.1.120 "41 of its 49 tools were being skipped",
v0.1.182). Send a notice to the person and the bot that names the servers
that were cut.

**P599 (steps 12 and 13, `bot-core`). One bearer for each thread, one record
for each turn.** Follows the reference.
- The bearer stays the same while the bot, thread, grants and approval stay
  the same.
- The server accepts it only while a turn of the thread runs. It reads the
  facts of the turn from the record on each call.
- A new turn, the end of a turn, the end of a thread and shutdown revoke
  the record. A computer gets a new bearer each turn.
- Sources: `server/index.ts:1644-1790`,
  `docs/verification/claude-tool-lifecycle.md:49-65`.

This is how a warm ACP session keeps its MCP servers across turns.

**P600 (step 12, `bot-engine::chat`, with P33). The chat driver mounts its
MCP servers for each turn.** Follows the reference, and keeps the v0.1.153
fix ("A turn carries on when one optional MCP server dies").
- Only our `agents` server is required. Any other server that fails is
  left out, and the model is told.
- The start limits are 8 s and 20 s. The close limit is 5 s, or 15 s on
  Windows.
- A close that cannot be confirmed fails the turn.
- Sources: `chat-mcp-tools.ts:77-99`, `:211-221`, `:561-566`,
  `openai-chat.ts:613`, `:891-897`.

**P601 (later, the Claude adapter). A CLI version is `Known` or `Unknown`.**
The ACP core probes the version of a CLI (`acp/core.ts:104`), but nobody
read whether it gates flags on a version floor.

Problem in the reference: an unknown
Claude CLI version counts as supporting every flag
(`claude-cli-version.ts:36-38`).
- So an old CLI can get a flag that it does not know: "an unknown flag is a
  hard argument error" (`:5`).
- Or, below 1.0.122, it runs with no `--setting-sources`, and "bots still
  see this machine's own Claude Code setup" (`:48`).
- Themes: "Sign-in to an engine, and engine CLIs that change" (v0.1.101,
  v0.1.177, v0.1.178) and "The person's own engine config reaches the bots"
  (v0.1.104).

Pass a flag only on a `Known` version at or above its floor. Give a typed
refusal when isolation needs a version that is `Unknown` or too old.

**P602 (later, the Claude adapter). A turn is accepted at any model
activity.**

Problem in the reference: only `text_delta` sets
`sawStreamDelta` (`claude.ts:1392`), so a turn that streamed only reasoning
and then exited with a transient error is sent again, and its reasoning is
paid again. Theme: v0.1.150 ("A Claude turn is never sent twice"). The state
of the turn is `Launched`, `Accepted` or `Answered`. Only `Launched` may be
sent again. This adds new facts to `harness-upgrades.md` §8 item 10.

**P603 (later, Claude). No environment variable that gives the bots the
person's setup.**

Problem in the reference:
- One variable of the server process, `OMB_CLAUDE_INHERIT_USER_CONFIG=1`,
  makes every Claude bot load the person's MCP servers, skills, hooks and
  `CLAUDE.md` (`claude.ts:141-156`).
- The tool search setting reads `~/.claude/settings.json` even when the
  turn uses project settings only (`claude-tool-search.ts:102-104`).
- Theme: "The person's own engine config reaches the bots" (v0.1.104,
  v0.1.175).

If we ever need such a choice, it is a setting of each bot, off by default.
The exact form is a judgment call.

**P604 (later, Claude). The env of a bot's settings file cannot set account
keys.**

Problem in the reference: the `env` of a bot's own settings file is
filtered only by "a name that the launch env does not have"
(`claude-bot-settings.ts:82`). The launch env has no `ANTHROPIC_API_KEY`
(`claude.ts:133-135`). So a bot that can write its folder can set that key
or `ANTHROPIC_BASE_URL`. Inferred, not checked with the real CLI. Theme: "A
secret or an access right in the wrong place" (v0.1.181). Drop each account
key name and `CLAUDE_CONFIG_DIR` from that `env`.

**P605 (step 9 if the steering engine is the adapter of step 9, else later).
The steering engine.** A judgment call.
- The driver writes the follow-up setting into the engine's `config.toml`
  before each turn (`server/drivers/acp/grok.ts:388-414`, `:636`). With no
  instance home, that file can be the person's own (`:33-35`). Not
  verified.
- Write the setting only into an engine home that we own.
- Report the steer capability after the driver reads that config, so that
  a "queue" setting queues the message at once
  (`acp/capabilities.ts:20`, `server/drivers/acp/grok.ts:372-380`).

**P606 (later, Codex). Free the launch slot after the handshake, not after
the MCP wait.**

Problem in the reference: the slot stays held while one
slow MCP server starts (up to 30 s), so it delays every other Codex launch
(`codex.ts:1351-1363`). Theme: "One slow or stuck part blocks all the
others" (v0.1.114, v0.1.153, v0.1.177, v0.1.178). The cost: the cap on
launches at the same time no longer covers the MCP start.

**P607 (step 12). Keep the learned tool count.** A judgment call. The
learned count is in memory only (`tool-count-limit.ts:82-90`). After a
restart, the first turn with too many tools fails one time again. Store the
count with the engine and model.

**P608 (later, Claude). An unread steer after the grace closes the
session.**

Problem in the reference: a steer whose continuation starts
later than 2 s after the held result runs in the warm process after
`turn.completed`, with the old turn id (`claude.ts:1301`, `:1536-1546`).
Inferred, not tested. Theme: "The same work done or delivered two times, or
lost" (v0.1.182). When the grace ends with a steer that has no echo, send
the steer back as unread (P590) and close the session.

### 8.3 New facts for existing proposals

- **P34 and P64** (`docs/plan/queue-and-steer.md`,
  `docs/plan/driver-contract.md`):
  - the double send of v0.1.182 and its fix (section 3.8).
  - the queue steer route that can still run words again.
  - the loss after the first tool of a batch.
- **P65** (`docs/plan/engine-process-lifecycle.md`):
  - a Claude stop with a live root waits for that root with no limit
    (`claude.ts:756`).
  - Codex completes the turn after 12 kill retries
    (`codex-process.ts:80-87`).
- **P251** (`docs/plan/context.md`): an aborted ping or warm summary books
  nothing although its prompt was sent (`claude-keepwarm.ts:212-215`,
  `cache-keepwarm.ts:122`, `warm-summary.ts:183`, `:201`). The unit test
  hides this (`cache-keepwarm.test.ts:152-153`).
- **P254** (`docs/plan/context.md`): the warm summary run still has no time
  limit (`server/warm-summary.ts:143`).
- **P250** (`docs/plan/context.md`): the tool bridge is still gated by the
  driver name (`server/agents-bridge-switch.ts:269`, `:280`).
- **P504** (`docs/plan/engines-and-accounts.md`): checked again at
  `42f86aefd`. Codex keeps the person's own home, and so reads `AGENTS.md`,
  in these cases (`codex-shared-home.ts:148-155`):
  - no `auth.json`.
  - a keyring login.
  - a link that fails.
  - a home that cannot be made.
- **P19 and P40** (`docs/plan/write-only-secrets.md`): the token of a
  custom Claude endpoint is clear text in `config.json`
  (`claude-endpoints.ts:2-3`, `:96-100`).
- **P60 and P63** (`docs/plan/driver-contract.md`, `docs/plan/acp-core.md`):
  - the full protocol of the fake Claude CLI and of the fake Codex app
    server (section 6).
  - each fake dumps all of `process.env` to a file
    (`fake-claude-cli.ts:475`).

## 9. Not verified

- The behaviour of real engines. The CLI facts come from comments in the
  reference with their versions: Claude 2.1.221 to 2.1.325, Codex 0.139 to
  0.171, the steering engine 1.0.89. Nobody ran a real CLI.
- Inferred from the code, not tested:
  - the second send on the queue steer route.
  - the loss after the first tool of a batch.
  - the chat steer between `abort()` and `finally`.
  - a Claude steer whose continuation starts after the grace.
  - a Claude stop whose root process never closes.
  - a bot settings `env` that sets an account key.
  - the steering engine that writes the person's own `config.toml`.
- What a real Codex app server does with `expectedTurnId` for a turn that
  ended. The fake refuses it.
- How a Codex MCP failure reaches `server/host/mcp-url-checks.ts`.
- The host stall watchdog (`TURN_STALL_MS`) and `createUnattendedTurns`
  (the loop guard): only their wiring was read.
- `prompt-split.ts`, `claude-limits.ts`, `native.ts`, `tool-progress.ts`,
  `claude-context-usage.ts`, `claude-billing.ts`, `claude-model-access.ts`,
  `claude-bedrock-aws.ts`, `local-inject.ts` and `permission-command.ts`:
  not read in this feature. Other research files cover most of them.
- `server/tool-schema-profile.ts` (the Gemini fit of v0.1.182), and the
  other ACP adapters (`hermes.ts`, `devin.ts`, `opencode-go.ts`,
  `custom.ts`): read only at their `steer` lines.
- The ranges of `server/delta-context.e2e.test.ts` that are not in
  section 2: only their test names were read.
- The regression commands of the five verification documents were not run.
- `queue-and-steer.md` names no commit. The steering group took `3aec210`
  as its base for the diffs.
- The `asd-ste100` skill was not in the skill list of the subagents. They
  wrote in its style by hand. The main session read the skill file and
  applied it to this file.

