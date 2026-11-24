# Turn limits: model steps, tool calls, tool deadlines, loop detection and the tool list

Feature row of [`../reference-features.md`](../reference-features.md): "Turn
limits: 64 model steps and 200 tool calls" (document of the reference:
`docs/verification/openai-tools.md`). Steps 5 and 9 of
[`../../plan/README.md`](../../plan/README.md). Crate: `bot-engine`.

Read on 2026-11-24 at commit `ad27f0716` of the reference project. All paths
are in the reference project unless a line says "ours". The `enterprise/`
directory was not opened. Four subagents read four groups of files, and the
main session checked the key lines (section 9 lists what is not checked).

In quoted text from the reference, `<product>` replaces the product name of
the reference.

## What this file adds to earlier research

- [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md) (read at
  `3aec210`) found that the limit of 64 model steps is gone. This file
  confirms it at `ad27f0716` and gives the history with the release of each
  change. Between `3aec210` and `ad27f0716`, `server/drivers/openai-chat.ts`
  changed in 9 lines, and no limit changed.
- This file adds the limits of each driver, not only the chat driver: Codex,
  Claude, ACP, Pi and Muse Code.
- It adds the tool deadlines of each driver, the host loop guard, and the
  history of the tool-list limit.
- It corrects three points of `chat-driver-tool-calls.md`:
  1. The deadline of one tool call is not a fixed 10 minutes. It is the
     setting `mcp.callTimeoutMinutes`, 1 to 60, default 10, since `4f124885e`
     (v0.1.98). It applies to the chat driver only.
  2. "So that the server can offer Continue" is not exact. The server
     continues a stopped turn by itself only for delegated work. A person's
     own chat has no Continue control (section 3.2).
  3. The short paths `chat.ts` and `mcp.ts` of that file are
     `server/drivers/openai-chat.ts` and `server/drivers/chat-mcp-tools.ts`.
- Out of scope, with a pointer:
  - The stops of a quiet engine go to
    [`engine-process-lifecycle.md`](engine-process-lifecycle.md):
    - the idle stop of an engine process.
    - the ACP prompt idle guard (15 minutes) and the ACP "no signs" stop
      (5 minutes).
    - the turn watchdog (`TURN_STALL_MS`, `TOOL_STALL_MS`,
      `server/index.ts:4917-4918`).
  - The person-first stop (a long tool call is stopped when the person's
    message waits): [`queue-and-steer.md`](queue-and-steer.md) section 3.4.
  - The settings of the room turn timeout and of the MCP call timeout have
    their own rows in `reference-features.md` (rows 414 and 416). This file
    gives only their values and what happens at the limit.
  - Limits on many turns (a group goal run of 13 turns,
    `server/group-goal-run.ts:7`, and `OMB_HANDOFF_MAX_TURNS`) are not limits
    on one turn.

## 1. In short

A **turn** is one request to a bot and the work that the engine does until it
gives a final answer. A **model step** (also called a round) is one request
to the model inside a turn. A **tool call** is one request from the model to
run a tool. An **engine** is the program or API that runs the model. A
**driver** is the code of the reference that talks to one kind of engine.

Other terms:

- **MCP** (Model Context Protocol) is the protocol that gives tools to a
  model. An **MCP server** is a program that offers a list of tools.
- **ACP** (Agent Client Protocol) is a protocol to drive an agent program
  over JSON-RPC on stdio. Several agent programs speak it.
- To **steer** is to send a message into a turn that runs. The engine reads
  it at its next step.
- The **"Responses" route** is the newer OpenAI API (`/responses`). The chat
  driver can use it in place of chat completions.
- The **Local VM** and a **lent computer** are computers that a bot can use
  through a tool server of the product.

The reference has two kinds of driver:

- **The chat driver** (`server/drivers/openai-chat.ts`) talks to an
  OpenAI-compatible API. The driver itself runs the loop: it asks the model,
  runs the tool calls, and asks again. Nine API engines and the "Responses"
  route use this one loop. So the reference can put limits on steps and calls
  here.
- **The CLI drivers** (Codex, Claude, ACP agents, Pi, Muse Code) start an
  agent program. That program runs its own loop and its own tools. The
  reference sees only the events. It cannot count steps, and it can only
  stop the whole turn.

What the reference limits now:

1. **Model steps: no limit.** The limit of 64 came in v0.1.96 and went in
   v0.1.166. The verification document still says 64.
2. **Tool calls: 200 for each turn, chat driver only.** The batch of calls
   that would pass 200 does not run. The turn fails with a plain message. The
   driver writes a **handoff file** (a Markdown file with the task and the
   steps that ran) and sends the event `cap.exhausted`. For delegated work,
   the server starts the turn again with the handoff file. A person's own
   chat shows only the error.
3. **Tool calls in one reply: 32.** A reply with more fails the turn, and no
   call runs.
4. **Tool deadlines:** chat driver 1 to 60 minutes (a setting, default 10).
   Codex and Pi 960 s for the tools of the product. Claude and ACP: no
   deadline from the reference.
5. **Loop detection:** two separate guards. The host **loop guard** watches
   the events of all drivers and acts on one shell command that fails the
   same way again and again. It is off by default for a turn that a person
   watches. The **chat repeat guard** is in the chat driver, only for a local
   model.
6. **The tool list: 128 tools for a chat request.** The tools of the product
   are cut to fit. A server of the person that does not fit goes behind three
   **directory tools** (a tool search). An ACP engine learns its limit from a
   refusal and tries the turn again one time.

## 2. Files read completely

| File | Lines |
|---|---|
| `server/drivers/openai-chat.ts` | 1000 |
| `server/drivers/openai-chat-tools.test.ts` | 1688 |
| `server/drivers/openai-responses.ts` | 282 |
| `server/drivers/chat-repeat-guard.ts` | 71 |
| `server/drivers/chat-repeat-guard.test.ts` | 71 |
| `server/turn-continuation.ts` | 88 |
| `server/turn-continuation.test.ts` | 123 |
| `docs/verification/openai-tools.md` | 212 |
| `shared/tool-budget.ts` | 19 |
| `server/tool-count-limit.ts` | 138 |
| `server/tool-count-limit.test.ts` | 88 |
| `server/tool-budgets.ts` | 20 |
| `server/drivers/chat-mcp-tools.ts` | 953 |
| `server/drivers/turn-mcp.ts` | 129 |
| `server/drivers/turn-mcp.test.ts` | 125 |
| `server/drivers/claude-tool-search.ts` | 138 |
| `server/drivers/runtime-notice-error.test.ts` | 72 |
| `src/components/bot-settings/ToolBudgetLine.tsx` | 33 |
| `src/components/bot-settings/ToolBudgetLine.dom.test.ts` | 83 |
| `server/drivers/agents-tool-limit.ts` | 4 |
| `server/drivers/pi-mcp-extension.ts` | 761 |
| `server/room-turn-timeout.ts` | 247 |
| `src/lib/mcp-call-timeout.ts` | 22 |
| `src/lib/mcp-call-timeout.test.ts` | 48 |
| `src/lib/room-turn-timeout.test.ts` | 26 |
| `src/components/McpCallTimeoutSettings.tsx` | 87 |
| `docs/superpowers/specs/2026-10-06-configurable-mcp-call-timeout-design.md` | 121 |
| `server/host/loop-guard.ts` | 257 |
| `server/host/loop-guard.test.ts` | 839 |
| `server/host/unattended-turns.ts` | 152 |
| `server/repeat-detector.ts` | 48 |
| `server/repeat-detector.test.ts` | 91 |
| `server/repeat-streak.ts` | 60 |
| `server/repeat-streak.test.ts` | 176 |
| `packages/phone-protocol/src/failed-turn.ts` | 58 |
| `src/components/ToolActivity.tsx` | 82 |
| `src/lib/tool-step-label.ts` | 90 |
| `src/lib/failed-turn.ts` | 51 |

**Read in ranges:**

- `server/drivers/openai-chat-protocol.ts`: 1-60, 95-150 (of 188).
- `packages/phone-protocol/src/runtime-events.ts`: 60-80.
- `server/harness/bus.ts`: 35-60.
- `server/index.ts`: 1888-1894, 4905-4940, 5000-5035, 6650-6680,
  6990-7020, 10085-10200.
- `server/runtime-coordinator.ts`: 385-396, 692. `server/runtime/tree.ts`:
  30-70. `server/runtime/envelope.ts`: 270-295. `server/runtime/runtime.ts`:
  545-560.
- `server/config.ts`: 40-80, 385-395, 445-452, 578-584.
  `server/app-settings/registry.ts`: 215-245. `server/turn-settings.ts`:
  120-141. `server/contracts.ts`: 220-231.
- `server/drivers/codex.ts`: 100-110, 470-500, 585-720, 805-880, 990-1002.
  `server/drivers/codex-process.ts`: 60-86.
- `server/drivers/claude.ts`: 85-125, 330-350, 436-530, 1525-1575,
  1830-1875. `server/system-prompt.ts`: 292-298.
  `server/drivers/claude-background.ts`: 6-10.
- `server/drivers/acp/core.ts`: 79, 205-214, 265-335, 660-680, 764-775,
  870-910, 1286-1330, 1345-1400. `server/drivers/acp/opencode-go.ts`:
  700-712. `server/drivers/acp/quiet-status.ts`: 11-37, 321-356.
- `server/drivers/pi.ts`: 580-592. `server/drivers/muse-code.ts`: a search
  for limits and timeouts only.
- Tests, in ranges or by test name only:
  `server/drivers/acp/opencode-cloud.test.ts` 88-140,
  `server/drivers/acp/acp.test.ts` 2443-2459, `server/config.test.ts`
  598-612, `server/drivers/chat-mcp-tools.test.ts` 1355-1380,
  `server/drivers/pi-mcp-extension.test.ts` 308-334,
  `server/room-turn-timeout.test.ts`,
  `src/components/McpCallTimeoutSettings.test.ts` (names only).
- Documents: `docs/plans/agent-harness-upgrades.md` 340-357,
  `docs/plans/agent-harness-upgrades-v2.md` 36-53, 116, 124,
  `docs/custom-mcp-servers.md` 355-422, `docs/agents-tool-bridge.md` 1-40,
  `docs/feature-flags.md` 95-123, `docs/self-hosting.md` 1767-1800.
- UI files found by a search of the text keys only:
  `src/components/RoomTurnTimeoutSettings.tsx`,
  `src/components/ConversationTurnLimit.tsx`, `src/locales/en.json`.
- History: `git log -S` for `MAX_CHAT_ROUNDS`, `200 tool calls`,
  `CHAT_TOOL_LIMIT`, `AGENTS_TOOL_TIMEOUT_SECONDS` and `callTimeoutMinutes`.
  `git show` of `e5da2fd3e` and `d6788b49c`. `git log v0.1.135..v0.1.136`.

## 3. How it works

### 3.1 The limits of each driver

"Chat" is the chat driver and every engine that uses its loop. The
"Responses" route is a transport inside the same loop
(`openai-chat.ts:282-317`), so each chat limit applies to it too.

| Limit | Chat | Codex | Claude | ACP | Pi | Muse Code |
|---|---|---|---|---|---|---|
| Model steps in a turn | none (`openai-chat.ts:623`) | none | none: no `--max-turns` | none | none | none found |
| Tool calls in a turn | 200 (`:143`, `:796`) | none | none | none | none | none found |
| Tool calls in one reply | 32 (`openai-chat-protocol.ts:14`, `:117`) | none | none | none | none | none found |
| Arguments of one reply | 256,000 characters (`openai-chat-protocol.ts:15`) | none | none | none | none | none found |
| One tool call | setting, 1-60 min, default 10 (`config.ts:51-53`, `chat-mcp-tools.ts:114`, `:863`) | 960 s for the product's tools, 560 s for the computer server (`codex.ts:488`, `:491`) | none from the reference | none from the reference | 960 s for each MCP server (`pi-mcp-extension.ts:84`) | not verified |
| Shell command | (no shell tool) | Codex default | 1 day maximum (`system-prompt.ts:294`) | engine default | 120 s default, 900 s maximum (`pi-mcp-extension.ts:90-91`) | not verified |
| Loop guard of the host (3.5) | never acts: no `summary` field | steer and stop | steer and stop | stop only, if steer is not supported | steer and stop | steer (fields not checked) |
| Chat repeat guard (3.6) | local model only (`openai-chat.ts:599`) | n/a | n/a | n/a | n/a | n/a |
| Tool list | 128, learned lower (`shared/tool-budget.ts:2`) | none | none: tool search is on | learned from a refusal (`acp/core.ts:898-899`) | none | not verified |
| Permission wait | not in this file | 15 min, then deny (`codex.ts:838`) | 15 min, then deny (`claude.ts:448`, `:511`) | 15 min, then deny (`acp/core.ts:673-676`) | no timer (`pi-mcp-extension.ts:723-729`) | not verified |

### 3.2 A chat turn reaches 200 tool calls

1. Each round, the driver adds the steered text of the person (the
   `asides`), joins MCP servers that started late, and asks the model
   (`openai-chat.ts:626-633`).
2. When the reply has tool calls, the driver adds each call id to the set
   `seenCalls`. A repeated id fails the turn: "provider reused a tool-call
   ID; refusing to repeat an operation" (`:792-795`).
3. If `seenCalls` now has more than 200 ids, the driver throws a
   `ChatProtocolError` (`:796`). This happens before the reply goes into the
   messages (`:797`) and before any call runs (`:803`).
   - Exactly 200 calls are permitted. The batch that passes 200 does not run
     at all.
   - The message is: "Stopped after 200 tool calls without a final answer.
     The steps so far already ran, so ask only for what's left."
4. The events of that last round that are already sent stay: the streamed
   text, `thread.token-usage.updated` (`:742`) and the reply text as
   `item.completed` (`:747`). No `item.started` is sent for the calls that
   did not run.
5. The `catch` sets `stopReason: "error"` and the failure text, cut to 2,000
   characters (`:887-890`).
6. The `finally` block (`:892-909`):
   1. It sets `ending = true`. A later steer gets "refused".
   2. It closes the approvals and the MCP servers. If the close fails, the
      failure becomes "Tool processes could not be stopped; their execution
      state is uncertain." and the turn is no longer a cap stop.
   3. If steered text was not read, it sends `runtime.notice` with
      `chat.notice.unreadMessage` (`:903`).
   4. It sends `runtime.error` with `terminal: true` (`:904-909`).
7. `classifyContinuable` reads the failure text with a regular expression
   from its start: `/^(?:stopped after \d+ [a-z ]+ without a final
   answer|model-call limit reached)/i` (`turn-continuation.ts:83-88`). A
   match gives `"cap"`. A provider error that quotes the text does not match.
8. The driver writes the handoff file (`openai-chat.ts:913-918`, section 4).
   If the write succeeds, it sends `cap.exhausted { handoffPath, reason:
   "cap" }` (`:919`).
9. It sends `turn.completed { ok: false, stopReason: "error" }`
   (`:922-926`).

The order of the last events: `runtime.notice` (if text is unread),
`runtime.error`, `cap.exhausted`, `turn.completed`.

**What happens next** (`server/index.ts:5008-5030`):

1. The server stores the handoff path of the turn (`turn-outcome.ts:26-35`).
2. On `turn.completed`, the outcome gets `cap: { note: STEP_CAP_NOTE,
   handoffPath }`. The note is "Your previous turn stopped at the step limit;
   continue from where it stopped." (`index.ts:1894`). The name and text
   still speak of the step limit, which no longer exists.
3. If the turn has an owner (delegated work), the runtime gets `continue`
   (`runtime-coordinator.ts:393`, `:692`). The runtime puts the work in the
   queue again with the note and the handoff path. The text of the next turn
   is the note plus "Every step so far is listed in <path>; read it before
   going on." (`runtime/envelope.ts:279-293`).
4. The runtime stops the continuations (`runtime/tree.ts:38-63`):
   - after 2 continuations with no successful tool call: "Stopped after N
     continuations without progress: <text>".
   - after 3 identical errors: "Stopped after 3 identical errors: <text>".
5. A cap stop does not report a failure incident and does not switch the
   engine (`index.ts:6666-6668`). For a routine run, a cap stop is final
   (`routine-recovery.ts:105`).
6. A person's own chat has no owner. Nothing continues by itself, and the
   window has no Continue control. The person sees the error line, which
   says "ask only for what's left".

**Edge cases:**

- If the handoff file cannot be written, `writeTurnHandoff` returns `null`
  and no `cap.exhausted` is sent (`turn-continuation.ts:77-79`). The turn is
  then an ordinary failure, and no log line says why.
- A stop by the person writes no handoff file (`openai-chat.ts:910`).
- "Tool calls used" in the file is `seenCalls.size`. This count includes the
  ids of the batch that did not run: 201 for one call in each reply
  (`:794`, `:915`).

### 3.3 The other limits of the chat loop

Each limit below makes sure that the loop ends, now that the limit of steps
is gone. The commit that removed the step limit names them
(`d6788b49c`).

1. **32 calls in one reply.** A 33rd call has index 32 or more. The parser
   throws "provider returned an invalid tool-call index"
   (`openai-chat-protocol.ts:117`). Nothing in that reply runs.
2. **256,000 characters of arguments in one reply.** "provider tool calls
   exceeded the size limit" (`openai-chat-protocol.ts:145-146`). A tool name
   longer than 64 characters fails the same way.
3. **3 announcement nudges** (`MAX_ANNOUNCEMENT_NUDGES`, `openai-chat.ts:144`,
   `:769-781`). A **nudge** is a message to the model when it says what it
   will do but calls no tool. Only with the option `nudgeAnnouncedAction`.
   - At the limit: `stopReason: "incomplete_action"`, "Stopped after 3
     announcement nudges without a verified final answer. Earlier operations
     may have taken effect; inspect their state and continue only the
     remaining work."
   - A second announcement with no tool progress after a nudge also stops
     the turn (`:774-776`).
   - These stops do not continue. The regular expression of 3.2 step 7 does
     not match them.
4. **Corrective rounds** after a failed tool call. The number is the larger
   of two values (`:761`): 2 for a local model (`LOCAL_CORRECTIVE_ROUNDS`,
   `:194`), and the setting `loopGuard.correctiveRounds` (0-5, default 0).
   The setting counts only when the loop guard is on
   (`loop-guard.ts:72-74`). No corrective round follows a denial. When the
   rounds are used up: `stopReason: "tool_error"`.
5. **One second request** for a text tool call that the driver cannot read
   (local model only, `:600`, `:749-752`).
6. **Retries:** at most 3 attempts for a refused tool call (`:710-717`).
   No retry after text streamed or after a call ran.
7. **Time:** a stream idle timeout that each chunk resets (`:262-271`), and
   3 missed liveness checks for a local server (`:82`, `:239-250`). There is
   no time limit for the whole turn.

**A steer during a tool call.** `steer` puts the text in `asides` and returns
"steered" (`openai-chat.ts:968-973`). The driver adds it only at the start of
the next round, "never mid-tool-batch" (`:207`, `:626`). If the model gives a
final answer while steered text waits, the loop runs one more round so that
the model answers it (`:783-786`). A person can steer for ever, so the loop
has no hard end in that case.

### 3.4 Tool deadlines

1. **Chat driver.** `mcp.callTimeoutMinutes` (1-60, default 10) becomes
   `turn.mcpCallTimeoutMs` for each turn (`turn-settings.ts:138`,
   `contracts.ts:227-228`). The driver gives it to `mountChatTools`
   (`openai-chat.ts:614`). With no value, `DEFAULT_CALL_MS` is 10 minutes
   (`chat-mcp-tools.ts:114`).
   1. When the time ends, the call fails with "MCP request timed out;
      execution outcome may be uncertain" (`chat-mcp-tools.ts:85`, `:280`).
   2. The turn fails in two cases (`:884-887`): the person stopped the
      turn, or the server is a required server (the product's server or the
      Local VM). The driver then closes all servers.
   3. Else the result is `ok: false`, and only that server stops: "... That
      was the MCP server "X". It is stopped for the rest of this turn; your
      other tools still work." (`:888-893`). The model continues.
   4. A call that is already running keeps its old deadline when the setting
      changes (spec, lines 28-30).
2. **Codex.** The driver passes
   `-c mcp_servers.agents.tool_timeout_sec=960` (`codex.ts:488`) and
   `computer.tool_timeout_sec=560` (`:491`). The value 960 is a command of
   up to 900 s on a lent computer, plus the time for its result
   (`agents-tool-limit.ts:1-4`, `9dd48816e`, v0.1.136). Other servers get
   the default of Codex, "60 by default in its config docs" (a comment only).
   The Codex program enforces the deadline.
3. **Pi.** Each MCP call waits at most 960 s (`pi-mcp-extension.ts:84`,
   `:262-268`). When the time ends, the extension sends
   `notifications/cancelled` to the server and throws "MCP tools/call timed
   out after 960000ms". Pi marks the tool as failed, and the turn continues.
   No test covers the 960 s value.
4. **Claude and ACP.** The reference sets no MCP deadline. The program uses
   its own default. For Claude, the shell maximum is 1 day
   (`BASH_MAX_TIMEOUT_MS`, `system-prompt.ts:294`, `claude.ts:119`). An
   environment value of the person replaces it.
5. **The room turn.** In a room, a turn stops after a time with no progress
   (`rooms.turnTimeoutMinutes`, default 5, 1-1440, `config.ts:48-50`).
   While a tool runs, the limit is at least 60 minutes
   (`ROOM_TOOL_QUIET_LIMIT_MS`, `room-turn-timeout.ts:52`, `6fe142640`,
   v0.1.136). The 60 is the maximum of the MCP setting, not its value. At
   the limit, the server stops the turn and writes the row "{bot}'s room
   turn made no progress for {count} minutes and was stopped"
   (`index.ts:10114-10125`).

### 3.5 Loop detection: the host loop guard

The guard is in `server/host/loop-guard.ts`. It reads the events of all
drivers from the bus (`index.ts:7016`). It has three parts.

**The repeat chip** (always on):

1. The guard makes a key from the title and the input of each tool start,
   and from the tool and summary of each permission request
   (`repeat-detector.ts:4-19`, `loop-guard.ts:120-126`). A title with no
   space and no "/" (for example "Bash") gives no key.
2. It counts the same key in the whole turn, not only one after another. At
   exactly 5, 10 and 20 it adds an activity row with `ok: false`: "Same call
   repeated N× — <tool>: <args, 80 characters> — it may be stuck"
   (`loop-guard.ts:100`, `:231-237`).
3. It does not steer and does not stop. A new turn does not clear the count
   (test `:542`).

**The steer and the stop** (off by default for a watched turn):

1. The guard tracks only a shell command with a `summary` field
   (`:131-141`). The chat driver sends no `summary`
   (`openai-chat.ts:816-818`, `:844-846`), so the guard never acts on a chat
   turn. The document of the reference says the same
   (`docs/self-hosting.md:1790-1793`).
2. On each completion, the guard compares the key and a SHA-256 digest of
   the failure output with the last completion (`repeat-streak.ts:7-13`,
   `:48-52`). Same key and same failure: the **streak** grows by 1. A
   success, an empty output, an output of 4,000 characters or more, or a
   masked output ends the streak.
3. At `steerAt` (default 5, 2-1000, `:44`) the guard steers one note to the
   engine, one time for each key: "[<product>: this exact call has failed
   the same way N times in a row: “<tool>: <command>”. Change approach, or
   stop and report what is blocking.]" (`:150`). An engine that cannot steer
   gets no note.
4. At `stopAt` the guard stops the turn and writes the row "error: the same
   call failed the same way N times in a row: “...” — the turn was stopped"
   (`:154`, `:188-200`). The window shows it as a failed turn with Retry.
   - A watched turn has no `stopAt` by default. So the guard never stops it.
   - An **unattended turn** (no person waits for it: a routine, or a bot
     that works alone) is forced on with `stopAt` 20
     (`DEFAULT_UNATTENDED_STOP_AT`, `:46`, `:61-62`, `f5f8392c2`, v0.1.165).
5. The guard does not act while the turn waits on a person or a computer. It
   acts at the first completion after the wait (`:206-208`).
6. The stop is one attempt. "An engine that ignores it runs on, as after the
   person's Stop." (`:198`).
7. A loop of successes with the same output (a poll) is never stopped, by
   design (`repeat-streak.ts:1`, test `:222`). A wait that fails until a
   service is ready looks the same as a loop, so a watched turn only gets a
   note.

### 3.6 Loop detection: the chat repeat guard

`server/drivers/chat-repeat-guard.ts`, made only when `options.localModel` is
set (`openai-chat.ts:599`, `637161105`, v0.1.139).

1. The key is the tool name plus the arguments as JSON with sorted keys
   (`:18-27`). The count is for each key in the turn, not one after another.
2. After 3 identical failures, a note goes on the result: this call will not
   run again (`:59`).
3. The next same call does not run. Its result is "[<product>: this exact
   call was not run. ...]" (`:43`).
4. The second such refusal stops the turn: "The model kept repeating a call
   to NAME that had already failed N times the same way, so the turn was
   stopped. ..." (`:40-41`).
5. The same successful answer gets a note from the 3rd time (`:64`). At the
   10th, the turn stops (`:61-62`).
6. A result with an image resets the count (`:50-53`).
7. The stop has `stopReason: "incomplete_action"` (`openai-chat.ts:883`) and
   does not continue.

The comment at `chat-repeat-guard.ts:1` still says "until the round limit".

### 3.7 The size of the tool list

**Chat driver** (`chat-mcp-tools.ts`):

1. The limit is `chatToolLimitFor(apiUrl, model)` (`tool-count-limit.ts:128-134`):
   a limit that a refusal taught, else none for `venice.ai`, else 128.
2. One place is kept for `ask_user` (`chat-mcp-tools.ts:118`, `:678`).
3. The tools of the product (the built-in servers) are cut to their shares,
   the product's server first (`:682-691`). Each server keeps its first
   tools in its own order (`tool-count-limit.ts:21-23`, `:39-53`).
4. The servers of the person may not fit. Then the driver lists the
   smallest servers whole. It puts all the others behind three directory
   tools:
   `mcp_search_tools`, `mcp_describe_tool` and `mcp_call_tool`
   (`chat-mcp-tools.ts:122`, `:527-537`). A server of the person is never
   cut.
5. The driver sends a `runtime.notice` for each change, for example "To fit
   the model's 128-tool limit, the tools of "notes" are reached through the
   tool search this turn." (`:332-351`, `openai-chat.ts:617`). The turn
   continues.
6. The provider can refuse the count. Then the driver reads the limit from
   the error text and keeps it in memory (at most 500 entries, lost at a
   restart). It lists the tools again and sends
   `turn.retrying { reason: "tool_limit" }` (`openai-chat.ts:681-691`). It does this only if the count gets smaller,
   so the loop ends.
7. The driver stores the **tool budget** (how many tools the last turn
   listed, of what limit) in memory for the window (`tool-budgets.ts`,
   `openai-chat.ts:616`).

**ACP:** there is no limit until a refusal (`acp/core.ts:898-899`). After a
refusal, the driver learns the limit and sends the same turn again one time,
with each server cut to a share. The share goes to each server in
`OMB_TOOL_LIMIT` or the header `x-omb-tool-limit` (`turn-mcp.ts:69-81`). A
second refusal ends the turn: "{provider} refused this turn because this
model takes at most {limit} tools and this bot offers more, even with its
tool lists trimmed, so nothing ran. ..." (`server/chat-notices.ts:41`).

**Claude:** no count. The driver turns on the tool search of Claude
(`ENABLE_TOOL_SEARCH=true`) unless the person set it
(`claude-tool-search.ts:51-58`, `:105-120`).

**Other limits of the chat driver's MCP servers** (`chat-mcp-tools.ts:114-126`,
`:593`):

- 32 servers in a turn, and 2,000 tools for one server.
- 100 pages of `tools/list`.
- 64 KB for one schema, and 1 MB for all definitions.
- 50 KB of result text.

### 3.8 History of the limits

| Commit | Date | Release | Change |
|---|---|---|---|
| (before `e5da2fd3e`) | | | 16 rounds (`for (let round = 0; round < 16; ...)`) and 32 calls in a turn, with the text "tool-call limit reached" |
| `e5da2fd3e` | 2026-10-05 | v0.1.96 | 64 steps (`MAX_CHAT_ROUNDS`) and 200 calls (`MAX_TURN_TOOL_CALLS`). The 32 became the limit of one reply |
| `bdfe6943b` | 2026-10-06 | v0.1.97 | The handoff file and the continuation |
| `4f124885e` | 2026-10-06 | v0.1.98 | The setting `mcp.callTimeoutMinutes` replaces the fixed 10 minutes |
| `9413b5147` | 2026-10-08 | v0.1.101 | Big MCP catalogs: the directory tools. The fix of "API-engine bots failed past 128 tools" |
| `777c7acd9` | 2026-10-13 | v0.1.111 | The loop guard replaces the repeat subscriber |
| `e4dd55c19` | 2026-10-15 | v0.1.111 | The opt-in `find_tool`/`use_tool` bridge: the "65-74%" cut |
| `074e6cde3` | 2026-10-17 | v0.1.120 | The limit of 3 announcement nudges |
| `ee18389e0` | 2026-10-24 | v0.1.126 | `tool-count-limit.ts`: learn a limit from a refusal |
| `9dd48816e` | 2026-10-31 | v0.1.136 | 960 s for the product's tools on Codex and Pi |
| `6fe142640` | 2026-10-31 | v0.1.136 | A room turn waits for a running tool, up to 60 minutes |
| `ffd126e54` | 2026-11-02 | v0.1.139 | `CHAT_TOOL_LIMIT = 128`, the directory for servers past the limit, the tool budget line |
| `637161105` | 2026-11-02 | v0.1.139 | The chat repeat guard for local models |
| `f6af8a06e` | 2026-11-07 | v0.1.145 | Mount every tool of a server, and use the real limit of each provider |
| `605fd9a52` | 2026-11-14 | v0.1.160 | The handoff keeps the active task and the steered text |
| `f5f8392c2` | 2026-11-16 | v0.1.165 | Stop at 20 for unattended turns |
| `d6788b49c` | 2026-11-16 | v0.1.166 | "Remove the 64-step cap from chat-engine turns" |

`d6788b49c` also removed `stepCap`/`CHAT_STEP_CAP = 64` from
`server/runtime/capabilities.ts`. It did not change
`docs/verification/openai-tools.md:68` ("One turn stops after 64 model
steps") or `STEP_CAP_NOTE` (`index.ts:1894`).

## 4. The data

**Events:**

| Event | Fields | Where |
|---|---|---|
| `cap.exhausted` | `handoffPath` (absolute), `reason: "cap"` | `runtime-events.ts:72-80`. The server refuses an empty path or another reason (`thread-events.ts:181-182`). The bus and the window treat it as an end of the turn (`harness/bus.ts:45-49`, `src/state/turn-status.ts:57-60`) |
| `turn.completed` | `ok`, `stopReason`: `"error"` (200 calls), `"incomplete_action"` (nudges, repeat guard), `"tool_error"` (corrective rounds), `"rpc_error"` (ACP) | `runtime-events.ts:60-70` |
| `runtime.error` | `message`, `terminal`, `partial` | `openai-chat.ts:904-909` |
| `turn.retrying` | `reason: "tool_limit"` | `openai-chat.ts:689` |
| `runtime.notice` | the tool-list notices, `chat.notice.unreadMessage` | `openai-chat.ts:617`, `:903` |

**The handoff file** (`turn-continuation.ts:27-80`):

- Path: `<data folder>/handoffs/cap-<thread 8>-<turn 8>-<time>.md`, mode
  `0600`.
- Content: thread, turn, model, tool calls used, tokens, stop reason, time.
  Then the current task (8,000 characters), the steered texts in order
  (8,000 each), each tool call as `n. name - args` (300 characters) with its
  result (220 characters), the last reply text (6,000 characters), and four
  instructions for the next turn.
- The writer calls no redaction function. The arguments of each tool call
  come from the model without a change (`openai-chat.ts:797`). So a secret in
  an argument or in the task can go to disk.

**Settings and environment:**

| Name | Values | Where |
|---|---|---|
| `mcp.callTimeoutMinutes` | 1-60, default 10 | `config.ts:51-53`, `:65-73` |
| `rooms.turnTimeoutMinutes` | 1-1440, default 5 | `config.ts:48-50` |
| `loopGuard` | `enabled`, `steerAt` 2-1000, `stopAt` 2-1000 or null, `unattended`, `unattendedStopAt`, `correctiveRounds` 0-5 | `loop-guard.ts:15-34` |
| `OMB_LOOP_GUARD`, `OMB_LOOP_GUARD_STOP_AT`, `OMB_LOOP_GUARD_UNATTENDED_STOP_AT` | "1", a count, a count or "off" (in that order) | `loop-guard.ts:58-65` |
| `OMB_TOOL_LIMIT`, header `x-omb-tool-limit` | the share of tools for one server | `tool-count-limit.ts:8-10` |

The limits 200, 32 and 128, and the limits of 3.3, are constants. No setting
changes them (`docs/verification/openai-tools.md:72`).

**Types:** `ToolBudget { limit, listed, servers[] }` (`shared/tool-budget.ts:5-12`),
`HandoffInput` (`turn-continuation.ts:10-25`), `LoopGuardSettings`
(`loop-guard.ts:37-42`).

## 5. The UI

- **The error line.** A cap stop shows the text of `runtime.error` as is. No
  control continues the turn in a person's own chat. The "Continue" texts in
  `src/locales/en.json` belong to other features.
- **The repeat chip.** An activity row with a red X (`ToolActivity.tsx:21-36`)
  and English text from the server, with no translation key: "Same call
  repeated 5× — tool: git status — it may be stuck" (test
  `loop-guard.test.ts:126`).
- **The loop-guard stop.** A failed-turn line with Retry
  (`src/lib/failed-turn.ts:5-50`). The loop guard has no settings UI. It is
  set in `config.json` or with `PUT /api/config`.
- **The tool budget line** in the bot settings (`ToolBudgetLine.tsx:22-33`,
  `AccessSection.tsx:191`): "Its last turn listed {listed} of the {limit}
  tools its AI takes at once." and "Found through tool search instead:
  {names}". It loads again when the bot stops being busy. It shows nothing
  when the limit is null.
- **The MCP server test** adds, for a big server: "Some AIs take at most
  {limit} tools at once, so there its tools are found through tool search."
  (`McpServersPanel.tsx:90-97`).
- **The tool time limit** (`McpCallTimeoutSettings.tsx`): "Tool time limit",
  "How long one app tool may run before it is stopped.", a number field of
  1-60 minutes. The help says "Applies to every tool a bot uses from your MCP
  servers." This is not correct: only the chat driver reads the value
  (3.4).

## 6. The tests

| Test | What it shows |
|---|---|
| `openai-chat-tools.test.ts:1363`, `:1427` | A turn of 40 steps, and a turn of 100 requests and 99 calls, end with `ok: true`. There is no step limit |
| `openai-chat-tools.test.ts:1374` | One call in each reply: 201 requests, 200 effects, one `runtime.error` with the exact text, `stopReason: "error"` |
| `openai-chat-tools.test.ts:1392` | The handoff keeps the active task and the steered text in order, without older messages |
| `openai-chat-tools.test.ts:1438` | 25 calls in each reply: the 9th batch does not run (200 effects) |
| `openai-chat-tools.test.ts:288`, `:299` | 3 nudges, then a stop. A second announcement with no progress stops the turn |
| `openai-chat-tools.test.ts:1587-1645` | At most 128 tools. Overflow goes to the directory. A learned limit of 110 stays for the next turn |
| `openai-chat-tools.test.ts:1540` | A slow MCP server does not delay the first request |
| `turn-continuation.test.ts:106-122` | Which failure texts continue: "Stopped after 64 steps…", "model-call limit reached…", "Stopped after 200 tool calls…". A 429 or quota error does not |
| `turn-continuation.test.ts:99` | Its name says "returns null when the handoff cannot be written", but it checks `not.toBeNull()`. The `null` path has no test |
| `chat-repeat-guard.test.ts:7-64` | Refuse after 3, stop at the 2nd refusal. Note at 3 and stop at 10 for the same answer. Images do not count |
| `loop-guard.test.ts:122-834` | The chip at 5, 10 and 20. A note at 5 and no stop by default. A stop only with `stopAt`. No action while the turn waits. The output never goes into a note or a log |
| `tool-count-limit.test.ts`, `turn-mcp.test.ts` | Parse the limit from each error form. Split the shares. No limit, no change |
| `acp/opencode-cloud.test.ts:108-139` | A refused turn runs again one time with trimmed lists. A second refusal fails with the plain text |
| `chat-mcp-tools.test.ts:1367` | The setting of the call timeout replaces the default |
| `codex.test.ts:2070`, `:2176` | The arguments have `tool_timeout_sec=960` and `=560` |
| `room-turn-timeout.test.ts:375-421` | A running tool keeps a room turn alive. A tool that never ends stops at 60 minutes |

Gaps, as far as this research read:

- The names of the tests in `pi-mcp-extension.test.ts` show no test of the
  960 s deadline. Only the names and lines 308-334 were read.
- `loop-guard.test.ts` has no test of the unattended stop at 20. The tests
  of `unattended-turns.ts` were not read.

## 7. Ours compared

Our state at this commit (ours):

- `bot-protocol/src/event.rs` has `turn.started` and `turn.completed` with
  `Outcome::{Completed, Failed, Interrupted}`. Decision D20 adds
  `runtime.error` with the codes `setup`, `engine_failed` and `internal`.
- `bot-engine/src/lib.rs` is empty. Step 5 is a chat driver with streaming
  and **no tools**. No step gives the chat driver a tool loop yet: proposal
  P33 (`plan/chat-driver-tool-calls.md`) has the options. Step 9 is the ACP
  driver. Step 12 has P48 ("a limit on the number of tools is a capability
  of the driver").

| Topic | Reference | Ours | Where it goes |
|---|---|---|---|
| Step limit | None (`openai-chat.ts:623`) | None | The tool loop of the chat driver (P33), `bot-engine::chat` |
| Tool calls in a turn | 200, before the batch runs (`openai-chat.ts:143`, `:796`) | None | Same |
| Calls and argument size in one reply | 32 and 256,000 characters (`openai-chat-protocol.ts:14-15`) | None. Step 5.1 has the stream chunk types | `bot-engine::chat::wire` when tools come |
| A stop at a limit | `stopReason: "error"` and English text, read again by a regular expression (`turn-continuation.ts:83`) | `Outcome::Failed` and an error code | `bot-protocol::event` |
| Handoff and continuation | A Markdown file, then the runtime continues delegated work (`runtime/tree.ts:38-63`) | None | `bot-core` runtime, step 13 |
| Tool deadline | Chat: setting. Codex, Pi: 960 s. Claude, ACP: none | None | Step 9 (ACP) and the tool loop |
| Stream idle timeout | `openai-chat.ts:262-271` | P14 (three timeouts) | Step 5 |
| Loop guard | Host guard on the bus, plus a chat guard for local models | None | `bot-core`, after step 9 (steer) |
| Tool list | 128 for chat, learned for ACP | None (P48) | Step 12 |
| ACP | No step or call limit. 15-minute permission wait. One retry after a tool-count refusal | Step 9 | `bot-engine::acp` |

## 8. Where we can be better

1. **A typed reason for a spent limit.** The reference sends
   `stopReason: "error"` and decides if a turn can continue with a regular
   expression on English text (`turn-continuation.ts:83`). The text also
   must not change, and a test must check old texts ("Stopped after 64
   steps", "model-call limit reached"). Reason: `AGENTS.md` asks for typed
   refusals. A variant such as `LimitReached { limit, used }` in the outcome
   or the error code lets the runtime decide with no text.
2. **One `TurnLimits` struct with its defaults** (as
   `chat-driver-tool-calls.md` 8.8 and P33 propose): calls in a turn, calls
   in one reply, argument size, tool deadline, nudges, corrective rounds.
   Reason: D10 says no setting is a constant. The reference has 200, 32 and
   3 as constants, and its document still names a limit that is gone.
3. **One loop guard, chosen by a capability.** In the reference, the host
   guard never acts on the chat driver because a field is missing
   (`summary`), and the chat guard runs only behind `options.localModel`.
   Reason: `AGENTS.md` gates engine behaviour by capability flags. A driver
   that runs its own loop (chat) can refuse a call before it runs. A driver
   that runs a program (ACP) can only steer or stop. One guard with these
   two modes covers each driver.
4. **Count only the calls that ran.** The handoff says "Tool calls used: 201"
   when 200 ran (`openai-chat.ts:794`, `:915`). Reason: a wrong number in a
   file that the next turn reads.
5. **Redact the handoff.** The writer stores raw tool arguments and the task
   (`turn-continuation.ts:42-69`). Reason: `AGENTS.md` says "Redact tokens
   and keys before text reaches disk". Step 6.4 gives us `redact`.
6. **A failed handoff write is an error, not silence.** Today the turn loses
   its continuation and no log says why (`turn-continuation.ts:77-79`).
   Reason: a typed result, and the event log keeps the cause.
7. **A deadline for each tool call on each driver.** A capability states it:
   "the driver enforces it" (chat), "the engine takes a setting" (Codex,
   Pi), "none" (Claude, ACP). Reason: the help text of the reference says
   the setting applies to every tool, and four drivers ignore it
   (`McpCallTimeoutSettings.tsx`, `config.ts:51-53`).
8. **A time limit for the whole turn**, as a setting with no default value
   or a large one. Reason: 200 calls of up to 60 minutes each have no upper
   bound in time, and a person can steer for ever (`openai-chat.ts:783-786`).
9. **A notice when the 32-call limit of a reply is reached**, or a split of
   the batch, not a failed turn. Reason: a model that sends 33 parallel calls
   loses the whole turn, and nothing ran (`openai-chat-protocol.ts:117`).
   This is a choice for the author, because a split changes the order of
   effects.

**Problems of `changelog.md` section 5 in this feature:**

- **(1) A turn or a wait that does not end.** Yes, in part. The limits of 3.3
  end the chat loop. But the loop has no time limit for a turn. It also has
  no end when the person steers again and again. Questions have no timer in Claude
  and Codex (`claude.ts:511`, `codex.ts:838`), and a room turn holds its
  clock while a question is open (`room-turn-timeout.ts:118`). The loop
  guard never stops a watched turn by default. Its stop is one attempt. The
  stale "step limit" text (`index.ts:1894`,
  `docs/verification/openai-tools.md:68`) is the same theme: a limit that
  changed, and its text did not.
- **(2) The size of the tool list.** Yes. The fix of v0.1.101 is
  `9413b5147`: the directory tools for big catalogs. The "65-74%" of
  v0.1.111 is not the count limit. It is the opt-in bridge `e4dd55c19`, and
  it measures the bytes of the product's catalog (`docs/agents-tool-bridge.md:15`).
  The count limit with a learned value came later (v0.1.126, v0.1.139,
  v0.1.145). `docs/custom-mcp-servers.md:403-404` says whole servers are
  listed "in the order they are set up". The code lists the smallest first
  (`chat-mcp-tools.ts:531`).
- **(3) One slow or stuck part blocks the others.** Yes. The release v0.1.136
  says: "A message you send isn't held up behind a long tool call." Its fix
  is the person-first stop. A tool call runs for 60 s, and a message from
  the person is not read. Then the server stops the turn and runs the
  message next
  ([`queue-and-steer.md`](queue-and-steer.md) 3.4). The commit text says
  why: "No engine reads a steered message during a tool call". The chat
  driver is an example: it adds steered text only between rounds
  (`openai-chat.ts:207`, `:626`). One timed-out MCP server stops alone, and
  the other tools still work (`chat-mcp-tools.ts:888-893`).

## 9. Not verified

- What Codex does when `tool_timeout_sec` fires, and the default of 60 s for
  other servers (a comment only, `agents-tool-limit.ts:2-3`).
- The MCP deadline and the shell default of the Claude program. The "2
  minutes" is only in the prompt text (`system-prompt.ts:297-298`).
- Whether the Claude program ends a turn with `error_max_turns`. The
  reference passes no `--max-turns`. The sentinel matches only `max_turns`
  (`sentinel/detectors/turn-stop.ts:14`).
- Whether ACP questions have a timer (`acp/core.ts:673`).
- Muse Code: its tool events and whether it has a tool deadline.
  `muse-code.ts` has no step or call limit (a search only).
- Whether the "Responses" route sends tool events of its own. It runs inside
  the loop of `openai-chat.ts`, so the 200 limit applies to it.
- Whether `tools.close()` can hang and keep `turn.completed` from being sent
  (`openai-chat.ts:895`).
- What `peerLimitResend.endedUnbound` does for a person's own chat after a
  cap stop (`index.ts:5028`).
- The internals of the directory (`mcp-directory.ts`) and its thresholds of
  40 tools or about 100,000 characters (`docs/custom-mcp-servers.md:384-386`).
- The full code of `RoomTurnTimeoutSettings.tsx` and
  `ConversationTurnLimit.tsx` (text keys only).
- The tests of `unattended-turns.ts`.
