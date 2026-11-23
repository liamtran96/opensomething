# Tool calls for the chat API drivers

Read on 2026-11-23, at commit `3aec210` of the reference project. This file
is for the feature row "Tool calls for the chat API drivers, with approvals,
deny and interrupt" of [`reference-features.md`](../reference-features.md) (parts 9 and 10 of
[`README.md`](../README.md)). All paths are in the reference project unless a
line says "ours". The `enterprise/` directory, the ACP drivers and the CLI
drivers were not read.

Two files are complete and are not repeated here:
[`driver-contract.md`](driver-contract.md) (the request with no tools, the
stream parser, the retry rules, redaction) and
[`turn-flow-comparison.md`](../turn-flow-comparison.md) (the events of a turn
with no tool, the stored reply, the chat UI).

Short names in this file:

| Short | File |
|---|---|
| `chat.ts` | `server/drivers/openai-chat.ts` |
| `proto.ts` | `server/drivers/openai-chat-protocol.ts` |
| `mcp.ts` | `server/drivers/chat-mcp-tools.ts` |
| `approval.ts` | `server/drivers/chat-tool-approval.ts` |
| `events.ts` | `packages/phone-protocol/src/runtime-events.ts` |
| `index.ts` | `server/index.ts` |

Some texts in the code contain the product name. This file writes
`<product>` in its place.

## 1. In short

A **chat API driver** talks to a model through an HTTP endpoint of the form
`POST /chat/completions`. Such a model cannot do work by itself. It can only
answer with text, or ask the caller to run a **tool**: a named function with
JSON arguments. So the driver does four jobs that an agent CLI does for the
other drivers:

1. It gives the model the list of tools with each request.
2. It reads a **tool call** (a tool name and arguments) from the reply.
3. It asks the person for permission, when the approval level needs that.
4. It runs the tool, gives the result to the model, and sends the next
   request. This repeats until the model answers with text only. One request
   and its reply is a **round** (the reference also says "step").

Terms that this file uses:

- **MCP server:** a separate program that offers tools through the Model
  Context Protocol. The driver starts it as a child process and talks to it
  with one JSON object for each line. Almost all tools of a chat driver come
  from MCP servers.
- **Approval level:** the setting that says how much a bot can do with no
  question: `ask`, `edits`, `auto`, `full` or `custom`.
- **Card:** the box in the chat with the buttons Allow and Deny (a
  permission card) or with a question (a question card).
- **Request:** the driver side of a card. The driver opens a request, waits,
  and gets an answer.
- **Session grant:** the answer "Always allow this session". The driver then
  runs the same tool with no card.
- **Safety floor:** a list of destructive shell commands that the server
  never approves automatically.
- **Denial:** a tool call that did not run because the person, a time limit
  or the safety floor said no.

The feature exists because a plain chat model is only useful as a bot when it
can act. The reference keeps this loop in one shared runtime
(`createOpenAIChatRuntime` in `chat.ts`), and each chat driver (the generic
OpenAI-compatible one and the named providers) reuses it with option flags.

The most important rules of the design:

- A tool never runs two times for one call. Many error texts say "execution
  outcome may be uncertain", and the driver stops instead of a replay.
- A "no" from the person fails the turn, also when the model then writes a
  good reply.
- A failed tool does not fail the turn if the model then uses tools again.
- The model always gets an answer for each tool call, also for a call that
  did not run.

## 2. Files read completely

Five subagents read these files, each line. The key findings were then
checked against the code by a second read of `chat.ts:544-633` and
`:750-929`, `approval.ts` (all), and `mcp.ts:70-126` and `:820-893`.

**The turn loop:** `server/drivers/openai-chat.ts` (999),
`openai-chat-protocol.ts` (188), `openai-chat-refusals.ts` (119),
`chat-announcement.ts` (42), `chat-repeat-guard.ts` (71),
`chat-text-tool-calls.ts` (164), `tool-failure.ts` (28), `tool-progress.ts`
(150), `agents-tool-limit.ts` (4), `chat-size-limit.ts` (148),
`runtime-notice-error.ts` (15), all in `server/drivers/`. Also
`server/tool-summary.ts` (73), `server/turn-continuation.ts` (88) and
`packages/phone-protocol/src/runtime-events.ts` (213).

**The tools:** `server/drivers/chat-mcp-tools.ts` (950), `turn-mcp.ts` (129),
`chat-images.ts` (79), `chat-host-computer.ts` (128), `own-mcp-http.ts` (81),
`openai-compat.ts` (456), `openai-responses.ts` (282), `grok.ts` (64),
`minimax.ts` (168), `cerebras.ts` (106). Also `server/mcp-failure.ts` (78),
`shared/tool-budget.ts` (19), `server/tool-budgets.ts` (20),
`server/mcp-directory.ts` (565), `server/tool-count-limit.ts` (138),
`server/mcp-schema-validator.ts` (185), `server/mcp-tool-schema.ts` (191),
`server/computer-tool-list.ts` (27), `server/tool-groups.ts` (14),
`server/mcp-result-budget.ts` (32) and
`packages/phone-protocol/src/ask-question.ts` (400).

**The approval path:** `server/drivers/chat-tool-approval.ts` (122),
`permission-command.ts` (83), `server/auto-approve.ts` (165),
`server/safety-floor-gate.ts` (177), `server/decision-log.ts` (275),
`packages/phone-protocol/src/approval-mode.ts` (112),
`server/request-card.ts` (34), `server/card-dismissal.ts` (18) and
`docs/approval-levels.md` (428).

**The tests:** `server/drivers/openai-chat-tools.test.ts` (1688),
`server/openai-tools.e2e.test.ts` (291), `openai-chat-protocol.test.ts`
(252), `openai-chat-announcement.test.ts` (86), `chat-repeat-guard.test.ts`
(71), `chat-text-tool-calls.test.ts` (105), `tool-failure.test.ts` (29),
`tool-progress.test.ts` (128), `chat-mcp-tools.test.ts` (1671),
`turn-mcp.test.ts` (125), `chat-images.test.ts` (50),
`chat-host-computer.test.ts` (189), `openai-chat-local-model.test.ts` (279),
`chat-tool-approval.test.ts` (246), `permission-command.test.ts` (58),
`openai-chat-safety-floor.test.ts` (237),
`self-answer-safety-floor.test.ts` (292), `server/auto-approve.test.ts`
(221), `server/auto-approve-undelivered.test.ts` (24), and the test helpers
`server/testing/events.ts` (46), `fake-http-mcp-server.ts` (375),
`cua-driver-tools.ts` (75), `stream-script.ts` (72), `live-reply-cases.ts`
(59), `cleanup.ts` (62).

**The stored rows and the UI:** `server/person-stops.ts` (70),
`server/request-card.ts` (34), `server/turn-context.ts` (81),
`packages/phone-protocol/src/wire-tool.ts` (23), `failed-turn.ts` (58),
`shared/client-cancel.ts` (79), `src/state/turn-status.ts` (123), and in
`src/components/`: `ApprovalCard.tsx` (598), `PendingApproval.tsx` (373),
`AskCard.tsx` (363), `ToolActivity.tsx` (82), `ActivityRun.tsx` (57),
`StatusActivityRow.tsx` (39), `ChatRows.tsx` (51), `CancelledTurnRow.tsx`
(31), `OptionsCardRow.tsx` (51), `TurnNarrationRun.tsx` (42),
`ToolActivity.test.ts` (39). In `src/lib/`: `activity-runs.ts` (190),
`approval-summary.ts` (98), `tool-liveness.ts` (19), `friendly-activity.ts`
(54).

**Read in ranges only:** `server/index.ts` (lines 1040-1129, 2225-2256,
4690-5021, 6235-6738, 6945-6965, 7612-7625, 7780-8019, 8140-8219,
8738-8758), `server/store.ts` (1060-1294), `src/components/ChatView.tsx`
(150-299, 520-769, 860-912), `src/components/Composer.tsx` (150-179,
415-444, 715-764, 836-950), `src/state/store.tsx` (1210-1304, 2395-2534),
`src/lib/live-activity.ts` (100-209), `DESIGN.md` (45-66),
`src/components/ApprovalCard.test.ts` (523-557, 753-822, all test names),
`server/routes/bot-messages.ts` (585-838), `server/contracts.ts` (1-400),
`server/safety-floor.ts` (1-60, 676-724), `server/mcp-gate.ts` (1-70),
`server/routes/instances.ts` (462-531).

## 3. How it works

### 3.1 Where the tools come from

The server decides which tool servers a turn can use. The driver starts them
and decides what the model sees.

1. The server builds `SendTurnInput.integrations`: a set of MCP server
   descriptors (`server/contracts.ts:177-214`). It adds a descriptor only
   when the capability flag of the adapter is true, for example `customMcp`
   (`index.ts:7808-7811`) and `agentsMcp` (`index.ts:7621`).
2. The driver mounts the servers in this order: `computer`, `browser`,
   `agents` (the tools of the reference server itself), `composio`, the
   own-apps server, `data`, `email`, `device`, then each server that the
   person configured (`mcp.ts:550-559`).
3. A remote MCP server (HTTP or SSE) is not called by HTTP from the driver.
   It becomes a child process that runs a proxy script
   (`server/mcp-gate-config.ts:135-164`, used at `mcp.ts:585`). So the
   driver has one transport: stdio.
4. The driver adds its own tool `ask_user`, by which the model asks the
   person a question (`chat.ts:618-622`). This tool has no MCP server.
5. A chat driver has no file tools and no shell tool of its own. On the host
   desktop, the computer bridge supplies file tools (`mcp.ts:947-950`).

All of this is off when the instance has `tools: false`, or when the model
list says that the model has no tool use (`chat.ts:613`). Then no process
starts and the request has no `tools` field (`chat.ts:287`).

### 3.2 The start of the tool servers

1. `mountChatTools` runs one time for each turn (`chat.ts:614`). The session
   closes when the turn ends (`chat.ts:895`). No process stays warm between
   turns.
2. Each server is one child process. All start at the same time, and the
   results are used in configuration order, so that tool names stay stable
   (`mcp.ts:767-768`).
3. The driver sends `initialize` (protocol `2024-11-05`), then
   `notifications/initialized`, then `tools/list` with pages
   (`mcp.ts:299-327`).
4. One time limit covers the start and the list: 8 s by default, 20 s for
   the agents server and for built-in servers on Windows, 30 s on a Cloud
   home and for a remote server (`mcp.ts:77-100`, `server/mcp-http.ts:41`).
5. The first request does not wait for a slow optional server. That server
   joins between rounds (`mcp.ts:796-802`, `chat.ts:632`).
6. A server that fails to start:
   - An optional server is skipped. The person sees the notice `MCP server
     "<name>" was skipped for this turn: <reason>` (`mcp.ts:381-383`).
   - A server that the turn must have (the agents server, a Local VM) fails
     the turn: `MCP server "<name>" didn't start: ...` (`mcp.ts:741`).
7. Limits: 32 servers, 2,000 tools for one server, 100 pages, a 64 KB schema
   for one tool, a 1 MB catalog, a 2 MiB line (32 MiB for a server that
   sends screenshots), 10,000 response lines for one server in a turn
   (`mcp.ts:115-126`, `:591`).

### 3.3 The tool list that the model sees

- **Name:** `<server>_<tool>` in lower case, each other character becomes
  `_`, cut at 64 characters. A collision gets `_2`, `_3`
  (`mcp.ts:74-76`, `:517-521`).
- **Entry:** `{ "type": "function", "function": { "name", "description",
  "parameters" } }` (`mcp.ts:37-40`). `parameters` is the input schema of the
  MCP tool, almost unchanged. A tool with no description gets `"Configured
  MCP tool"`.
- **Check of the schema:** the root must be an object. The driver compiles
  the schema with a JSON Schema validator and never fetches an outside
  `$ref` (`server/mcp-schema-validator.ts:79-103`).
- **The limit of 128 tools** for one request (`shared/tool-budget.ts:2`):
  1. One slot is kept for `ask_user`.
  2. Built-in servers come first. The agents server keeps all its tools. A
     built-in server over its share lists only its first tools.
  3. Configured servers come next, the smallest first. If all do not fit, 3
     slots go to the **directory tools** `mcp_search_tools`,
     `mcp_describe_tool` and `mcp_call_tool`, and the servers that do not
     fit are reached through them (`mcp.ts:668-726`,
     `server/mcp-directory.ts`).
  4. When a provider refuses a request and names a lower limit, the driver
     reads the number from the refusal, lists the tools again and sends the
     request one more time (`server/tool-count-limit.ts:58-90`,
     `chat.ts:685-691`).
- **The tool budget:** the last layout of each bot is kept in memory and
  served by `GET /api/bots/:id/tool-budget`
  (`server/tool-budgets.ts:3-12`, `server/routes/mcp-servers.ts:85-89`).

### 3.4 The request

The body is the body of a plain turn plus one field: `tools`, when the list
is not empty (`chat.ts:284-288`). The driver never sends `tool_choice` or
`parallel_tool_calls`. The same list goes with each round
(`chat.ts:659-664`).

### 3.5 How a tool call is read from the stream

A provider sends a tool call in pieces: `delta.tool_calls[]`, each piece with
an `index`, and the `id`, the name and the arguments text in fragments.
`ChatToolCalls.add` joins them (`proto.ts:108-150`).

1. The slot of a piece is its `index`. If there is no index, it is the slot
   of the call with the same `id`, else a new slot (`proto.ts:154-158`).
2. A field that is absent, `null` or `""` in a later piece means "no change"
   (`proto.ts:113`).
3. Name and arguments fragments are appended as text.
4. When the reply ends, `finish` checks the calls (`proto.ts:160-187`). Each
   of these fails the turn with one request and no tool run:
   - an index of 32 or more: `provider returned an invalid tool-call index`;
   - an id that changes: `provider changed or omitted a tool-call ID`;
   - a missing id, two calls with one id, or a name that does not match
     `/^[A-Za-z0-9_-]{1,64}$/`: `provider returned an incomplete or
     duplicate tool call`;
   - `finish_reason` `tool_calls` with no call: `provider ended for tool
     calls without a complete call`;
   - calls with a finish reason such as `length`: `provider tool calls were
     truncated or malformed`;
   - more than 256,000 characters of arguments in one reply (the sum of all
     calls): `provider tool calls exceeded the size limit`.
5. The arguments text is parsed as JSON only when the call runs
   (`proto.ts:29-36`). Bad JSON does not fail the turn. It becomes the
   result of that call: `tool arguments are not complete JSON; you sent N
   characters: ...`. Empty arguments are `{}`.
6. An id that an earlier reply of the same turn used stops the turn before a
   call runs: `provider reused a tool-call ID; refusing to repeat an
   operation` (`chat.ts:792-795`).

**Text that looks like a tool call.** Some local models write a call as text,
for example `<tool_call>{...}</tool_call>`. The driver reads this only for a
local model (`chat.ts:641`, `chat-text-tool-calls.ts`). It becomes a normal
call with the same checks and the same approval. For a hosted model, such
text stays text and nothing runs.

### 3.6 The loop of one turn

1. `sendTurn` refuses if there is no key or a turn already runs on the
   thread. Then it emits `turn.started` and returns `{ turnId }`. The loop
   runs in the background (`chat.ts:517-583`).
2. The driver builds `messages`, emits `session.started`, mounts the tools
   and emits a `runtime.notice` for each skipped server (`chat.ts:602-622`).
3. **Start of a round.** The driver checks for a stop. It moves each steer
   text (a message that the person sent during the turn) into one `user`
   message. It lets late servers join (`chat.ts:623-633`).
4. It sends the request and streams the reply as `content.delta`.
5. If the reply has usage numbers, it emits `thread.token-usage.updated`.
6. If the reply has text, it emits `item.completed` with `itemType:
   "assistant_text"`. This occurs also in a round that has tool calls
   (`chat.ts:746-747`).
7. **If the reply has no tool call,** the final checks run, in this order
   (`chat.ts:754-788`):
   1. An empty reply fails the turn.
   2. A finish reason that is not `stop` fails the turn.
   3. A tool failure is pending: see 3.9.
   4. The reply only announces an action: see 3.10.
   5. A steer text arrived: go to step 3.
   6. If not, the turn is a success.
8. **If the reply has tool calls:**
   1. The ids of the full batch are checked against the turn
      (`chat.ts:792-795`).
   2. The limit of 200 calls for a turn is checked (`chat.ts:796`).
   3. The assistant message is appended: `{ role: "assistant", content,
      tool_calls }` (`chat.ts:797`).
   4. Each call runs, **one after the other, in order** (`chat.ts:803`).
      There is no parallel run.
   5. After the batch, all screenshots go in one `user` message
      (`chat.ts:885`).
   6. Go to step 3.

The loop has no limit on the number of rounds (`chat.ts:623`). See 3.11.

### 3.7 One tool call

For each call of the batch (`chat.ts:803-884`):

1. Check for a stop.
2. Parse the arguments. Make a preview of them: pretty JSON, secrets
   replaced by `[redacted]`, cut at 6,000 characters
   (`server/tool-summary.ts:5-40`).
3. The repeat guard can refuse the call (local models only, see 3.11).
4. `tools.validate`: the tool must be in the list of this turn, the tool
   selection of the bot must permit it, and the arguments must match the
   full schema of the tool (`mcp.ts:822-839`).
5. `tools.view` says how to show the call and if it asks
   (`mcp.ts:840-855`):
   - A tool of the agents server never asks.
   - The directory tools for search and describe never ask.
   - Each other MCP tool asks. `mcp_call_tool` shows the real tool, not
     itself.
   - This is decided by where the tool comes from. A `readOnlyHint` from
     an MCP server is not used.
6. The driver reads the approval level **now**, not the level at the start
   of the turn (`chat.ts:839`). So a change of level in the middle of a turn
   applies to the next call.
7. The safety floor check, then the approval (`chat.ts:840-842`):
   - Level `full`: the call runs with no card.
   - Each other level (`ask`, `edits`, `auto`, `custom`): the driver asks.
     A chat driver has no automatic reviewer, so these four levels are the
     same for it.
   - A session grant covers the call: no card.
8. Check for a stop. Emit `item.started` (`chat.ts:844-846`). This event
   comes **after** the answer to the card.
9. If allowed, `tools.execute` runs the tool (see 3.8). If not, the result
   is the denial text (see 3.9).
10. An error in steps 2 to 9 becomes the result `{ ok: false, text }`, with
    the error message cut at 2,000 characters (`chat.ts:867-872`).
11. Emit `item.completed` with `ok` and a preview of the result.
12. Append the tool message for the model (`chat.ts:879`):
    `{ "role": "tool", "tool_call_id": "<id>", "content":
    "{\"ok\":true,\"result\":\"<text>\"}" }`. The content is always this
    JSON envelope, as a string.

`ask_user` takes a shorter path (`chat.ts:811-831`). It skips the level and
the safety floor, because "Full would auto-run an unanswered ask, Ask would
show Allow/Deny". The driver opens a question request and waits with no time
limit. The answer text goes to the model unchanged.

### 3.8 The run of a tool and its result

1. `tools/call` goes to the MCP server with the abort signal of the turn and
   a time limit of 10 minutes (`mcp.ts:114`, `:860`). The server can set
   another limit with `mcpCallTimeoutMs`.
2. The content parts of the result (`mcp.ts:864-875`):
   - `text` parts are joined.
   - An `image` part is kept only for a driver that has computer use. It
     must be PNG, JPEG, WebP or GIF, at most 20 MiB, and its bytes must
     match its type (`chat-images.ts:7-48`).
   - Each other part (a resource, audio) is left out, a line says so, and
     the result is `ok: false`, also when the tool did its work.
   - `structuredContent` is added as JSON text.
3. A result over 50 KB is cut. If the turn has a work folder, the full text
   is saved to a file and the model gets the file name (`mcp.ts:400-442`).
4. Images do not go in the tool message. After the batch, one `user` message
   has `"Screenshot result from tool call <id>:"` and the image for each
   call (`chat-images.ts:77-79`). All images of a turn share a budget of
   32 MiB. Over it, the turn stops.
5. Failures (`mcp.ts:879-891`):
   - `isError: true` from the tool: `ok: false`, the turn continues.
   - A JSON-RPC error: `ok: false`, the server stays. The model gets a fixed
     text, never the error message of the server.
   - A time limit, a dead process or a bad line: that server is stopped for
     the remainder of the turn, "so a call whose outcome is uncertain can't
     run twice on it". The other servers continue.
   - A stop, or a failure of a server that the turn must have: the full
     tool session closes and the turn ends.

### 3.9 Approval, deny and a failed tool

**The request.**

1. `approval.ask` puts a card in its `pending` map **before** it emits
   `request.opened`, because a listener can answer at once
   (`approval.ts:1`, `:70-72`).
2. The request id is a random UUID. The model cannot supply it.
3. The driver waits. A permission request has a time limit of 15 minutes
   (`approval.ts:68`). A question has none.
4. The server makes the card from the event: title `"Approval needed"`,
   subtitle = the arguments preview, options `["Allow", "Deny"]`
   (`index.ts:6540-6556`, `server/request-card.ts:10-34`).
5. The server can answer in place of the person (`server/auto-approve.ts`):
   for example when a saved "always allow" rule matches the tool. It never
   answers a question.

**The answer.** The window sends the answer to `POST
/api/threads/:id/respond` (`src/state/store.tsx:2428-2440`). A second route,
`POST /api/bots/:id/respond`, takes the same body: `requestId`, `behavior`
(`allow`, `deny` or `answer`), `message` and `always`
(`server/routes/bot-messages.ts:596-798`). The server calls
`respondToRequest`, which returns one of four outcomes
(`server/contracts.ts:122`, `approval.ts:97-116`):

| Input | Outcome | Effect |
|---|---|---|
| `deny` | `rejected` | The call does not run |
| `allow` on a permission | `allowed-once` | The call runs |
| `allow` with `always: true` | `allowed-once` | The call runs, and the grant is kept |
| `answer` with text on a question | `answered` | The text goes to the model |
| An unknown or old request, an ended turn, a wrong kind of answer | `unavailable` | Nothing |

Who can answer: a local service can only deny, and in a shared workspace
only the person who started the conversation or an admin can answer
(`index.ts:1047-1061`). For an unknown request the route still answers HTTP
200 with `outcome: "unavailable"`, and the chat gets the row `Couldn't
deliver that answer — the request is no longer open, so the action was not
run` (`index.ts:4800-4815`).

**The session grant.** The key is `[server, a hash of how the server is
started, tool]` (`mcp.ts:843`). It is kept in the memory of the driver, for
each pair of thread and bot, for at most 256 pairs (`chat.ts:226`,
`:548-552`). A restart of the server forgets it. A changed command or
environment of the MCP server makes a new key. A guest turn gets no grant.

**Deny.** A deny by the person, a time limit, and a closed gate all give the
model the same tool result (`approval.ts:21`):

> Permission denied or expired; the tool was not executed. Tell the person
> in one line what you did not do, offer the simplest other way (for a file:
> drag it into the chat or paste its text), and say what you will deliver
> once you have it.

1. The driver emits `request.resolved` with `behavior: "deny"`.
2. It emits `item.started` and `item.completed` with `ok: false`.
3. It adds the tool title to the `denials` list of the turn.
4. The loop continues: the next call of the batch runs, and the model gets
   one more round to explain.
5. The reply of the model is emitted as text.
6. Then the turn fails: `stopReason: "tool_error"`, `runtime.error` with
   `partial: true`, and the text `Stopped because the tool call “<name>”
   wasn't allowed. The bot's reply isn't proof the work was done; that step
   didn't run.` (`chat.ts:759-767`, `tool-failure.ts:17-28`).

After a denial, the model gets no second attempt: "A person's 'no' is never
answered with another attempt" (`chat.ts:760`).

**A failed tool** (not a denial) sets the same pending flag, with two
differences (`chat.ts:798-801`, `:761`):

- If the model calls tools again after the failure, the flag is cleared. The
  failed step still shows as failed, but the turn can succeed.
- If the model answers directly after the failure, a local model gets up to
  2 **corrective rounds**: a `user` message that tells it to run the failed
  operation again. A hosted model gets none by default. Then the turn fails
  with `stopReason: "tool_error"` and `Stopped because the tool call “x”
  failed. ...`.

**The safety floor.** It applies only when no person looks at the call: at
level `full`, or when a session grant covers the call
(`approval.ts:44-47`). It reads the `command` or `cmd` argument and blocks a
command of its never-list (for example a delete of the root folder), and
also a command that it cannot read. The model gets `Blocked by the safety
floor: ...`, the call counts as a denial, and the person sees a notice. The
floor is off by default and does nothing on a Windows server
(`server/safety-floor-gate.ts:14-39`). A card that a person allows is never
checked.

**The decision log** (`<data>/decisions/YYYY-MM.ndjson`) gets a row when a
card shows, when a person allows or denies, when the server allows
automatically, and when the floor blocks. It gets no row for a call that
runs at level `full`, for a call that a session grant covers, or for a time
limit or a stop.

### 3.10 A model that says it will act and does not

Some models answer "Let me check the file" and call no tool. For drivers
with the flag `nudgeAnnouncedAction`, the driver detects such a reply
(`chat-announcement.ts`): a short reply that ends with `:` or `...`, or that
starts with words such as "let me" or "I'll" plus an action verb, with no
question mark.

1. The driver appends the reply, then a `user` message: `You said what you
   would do next but called no tool. Use your tools for only the remaining
   work, ... Never repeat an operation that succeeded, was denied, or may
   already have taken effect; ...` (`chat.ts:191`).
2. At most 3 nudges for a turn. After that the turn fails with `Stopped
   after 3 announcement nudges without a verified final answer. ...`.
3. Each nudge must be followed by a new tool call. A second announcement
   with no tool call between fails the turn.
4. Both failures have `stopReason: "incomplete_action"`.

A denial or a pending tool failure has priority: no nudge then.

### 3.11 The limits

| Limit | Value | Where | When it is reached |
|---|---|---|---|
| Rounds for a turn | none | `chat.ts:623` | See the note below |
| Tool calls for a turn | 200 | `chat.ts:143` | The batch that would pass 200 runs no call. `runtime.error`, then `turn.completed` with `ok: false`, `stopReason: "error"` |
| Tool calls for one reply | 32 | `proto.ts:14` | The turn fails, no call runs |
| Arguments of one reply | 256,000 characters | `proto.ts:15` | The turn fails, no call runs |
| Tool name | 64 characters | `proto.ts:181` | The turn fails |
| Tools for one request | 128 | `shared/tool-budget.ts:2` | The directory tools are used |
| One tool call | 10 minutes | `mcp.ts:114` | `ok: false`, that server stops for the turn |
| Wait for a permission | 15 minutes | `approval.ts:68` | The same as a deny |
| Wait for a question | none | `approval.ts:75-96` | |
| Tool result text | 50 KB | `mcp.ts:116` | Cut, or saved to a file |
| Error text of one call | 2,000 characters | `chat.ts:871` | Cut |
| Preview in an event | 6,000 characters | `server/tool-summary.ts:39` | Cut |
| One image, all images of a turn | 20 MiB, 32 MiB | `chat-images.ts:7-9` | The turn stops |
| Announcement nudges | 3 | `chat.ts:144` | The turn fails |
| Corrective rounds, local model | 2 | `chat.ts:194` | The turn fails |
| Resend after a refused tool call | 3 attempts | `chat.ts:710-717` | The turn fails |

**The limit of 64 model steps does not exist now.** The verification record
`docs/verification/openai-tools.md` says "One turn stops after 64 model
steps". Commit `e5da2fd3e` (2026-10-05) added `MAX_CHAT_ROUNDS = 64`. Commit
`d6788b49c` (2026-11-16, "Remove the 64-step cap from chat-engine turns")
removed it, and the record was not updated. A test shows a turn with 100
requests and 99 tool calls that ends with `ok: true`
(`openai-chat-tools.test.ts:1427-1436`). The limit of 200 tool calls is now
the only limit on the length of a turn.

**At 200 calls** the text is `Stopped after 200 tool calls without a final
answer. The steps so far already ran, so ask only for what's left.` The
driver also writes a **handoff file** with the task and the steer texts, and
emits `cap.exhausted` with the path, so that the server can offer "Continue"
(`chat.ts:910-920`, `server/turn-continuation.ts:83-88`).

**The repeat guard** (local models only, `chat-repeat-guard.ts`). The key of
a call is the tool name plus the arguments with sorted keys.

1. The 3rd time that the same call fails in the same way, a note is added to
   the result: this call will not run again.
2. The next same call does not run.
3. The second such refusal in a turn stops the turn.
4. The same successful answer gets a note from the 3rd time, and the turn
   stops at the 10th.
5. The stop has `stopReason: "incomplete_action"`.

### 3.12 Refusals from the provider

- **The provider refuses a tool call** (for example the code
  `tool_use_failed`: the model named a tool that it was not given). Nothing
  ran, so the driver sends the same request again, at most 3 attempts in
  all, with a `turn.retrying` event each time. If answer text already
  streamed, the turn fails instead (`chat.ts:710-717`).
- **The provider refuses the `tools` field** (HTTP 400 or 422 with a clear
  "tools not supported" message). Only when the list has `ask_user` alone,
  in the first round, with nothing streamed, the driver sends the request
  one time with no tools (`chat.ts:719-723`). A tool that the person mounted
  is never removed silently.
- **A general error after a tool ran** (for example HTTP 503) is never
  retried: "Never replay a handled call" (`chat.ts:724-726`).
- **A request that is too large:** the driver shortens old tool outputs and
  sends again (`chat-size-limit.ts`).

### 3.13 Interrupt

`interruptTurn` aborts the signal of the turn and waits for the turn to end
(`chat.ts:961-966`). What follows depends on the state:

| State | What occurs |
|---|---|
| The reply streams | The HTTP request is aborted. The text that streamed gets no `item.completed` |
| A card waits | The card closes: `request.resolved` with `behavior: "deny"`, `source: "system"`. The call did not run, but it gets the result `Tool interrupted; an operation already dispatched may have taken effect. Verify its state before retrying.` and `item.completed` with `ok: false` |
| A tool runs | The driver sends `notifications/cancelled` and closes all MCP processes. The call gets the same "Tool interrupted" result. The driver does not know if the operation took effect |
| The other calls of the batch | No event and no tool message |

In each state, the end is the same: no `runtime.error`, then one
`turn.completed` with `ok: false`, `stopReason: "interrupted"`. A late answer
to the old card gets `unavailable`. On the server, the `request.resolved`
event sets the permission card to `answered: "deny", dismissed: true`, and
`closeOpenApprovals` closes each card that is still open as `answered:
"unavailable"` (`index.ts:6604-6611`, `:4872-4886`). A question card stays,
and can take a late answer. The window shows the card as `Denied` (section
5.2).

If the tool processes cannot be stopped, the driver emits `runtime.error`
with `Tool processes could not be stopped; their execution state is
uncertain.` (`chat.ts:894-908`).

### 3.14 A message from the person during a tool turn

`steer` puts the text in a list and returns `"steered"` (`chat.ts:969-974`).
The text goes to the model at the start of the next round, never in the
middle of a batch (`chat.ts:625-630`). If it arrives while the model writes
its last reply, the loop does one more round (`chat.ts:783-786`).

### 3.15 A restart of the server

The waiting requests, the session grants and the map from request to card
are in memory only (`approval.ts:36`, `chat.ts:226`, `index.ts:4728`). The
card is in the stored transcript. After a restart the card still shows. An
answer then gets `unavailable`, and the card becomes `answered:
"unavailable"`. No code was found that closes open permission cards at
start-up.

## 4. The data

### 4.1 The events of a tool call

Each event has the base fields `eventId`, `provider`, `threadId`, `turnId`
and `createdAt`. The order for one round with one tool call, at level `ask`
(`chat.ts`, lines in brackets):

1. `content.delta`, 0 or more (`:656`)
2. `thread.token-usage.updated`, if the reply has usage (`:735-744`)
3. `item.completed` with `assistant_text`, if the reply has text (`:747`)
4. `request.opened` (`:556-559`)
5. `request.resolved` (`:560-563`)
6. `item.started` with `itemType: "tool"` (`:844-846`)
7. `item.completed` with `itemType: "tool"` (`:877`)

At the end of the turn: `runtime.error` on a failure (`:908`),
`cap.exhausted` at the limit of 200 (`:919`), then `turn.completed`
(`:923-926`).

For `ask_user` the order is `item.started`, `request.opened`,
`request.resolved`, `item.completed`.

Examples, built from the code (the ids are invented, and the base fields are
left out):

```json
{ "type": "request.opened", "requestType": "permission", "requestId": "<uuid>",
  "tool": "mcp__files__read_file", "summary": "{\n  \"path\": \"notes.txt\"\n}",
  "allowSession": true }

{ "type": "request.resolved", "requestId": "<uuid>", "behavior": "allow", "source": "user" }

{ "type": "item.started", "itemType": "tool", "itemId": "call_abc",
  "title": "files_read_file", "input": "{\n  \"path\": \"notes.txt\"\n}" }

{ "type": "item.completed", "itemType": "tool", "itemId": "call_abc", "ok": true,
  "output": "{\n  \"ok\": true,\n  \"result\": \"hello\"\n}" }

{ "type": "request.opened", "requestType": "question", "requestId": "<uuid>",
  "tool": "ask_user", "summary": "Which branch?",
  "questions": [{ "question": "Which branch?", "options": [{ "label": "main" }, { "label": "dev" }] }],
  "choices": ["main", "dev"] }

{ "type": "turn.retrying", "attempt": 1, "delayMs": 0, "reason": "tool_use_failed" }

{ "type": "turn.completed", "ok": false, "stopReason": "tool_error", "cost": null,
  "usage": { "input": 2400, "output": 90 }, "denials": ["files_read_file"] }
```

Field notes:

- `itemId` of a tool item is the id of the tool call from the provider.
- `tool` in `request.opened` is `mcp__<server>__<tool>`. `title` in
  `item.started` is the name that the model sees, `<server>_<tool>`. The two
  can differ.
- `summary`, `input` and `output` are text previews for the person, not
  data: redacted, and cut at 6,000 characters.
- `behavior` is `allow`, `deny` or `answer`. `source` is `user`, `timeout`
  or `system`.
- `stopReason` values of this driver: `null` (success), `"error"`,
  `"interrupted"`, `"tool_error"`, `"incomplete_action"`.
- `itemType` in the contract: `tool`, `reasoning`, `assistant_text`,
  `assistant_image` (`events.ts:103-127`). This driver emits `tool` and
  `assistant_text` only.
- The chat driver emits no progress event for a tool (`turn.progress`,
  `item.output`, `item.updated`). Those are for the CLI and ACP engines.

### 4.2 The messages for the provider

```json
{ "role": "assistant", "content": null,
  "tool_calls": [{ "id": "call_abc", "type": "function",
    "function": { "name": "files_read_file", "arguments": "{\"path\":\"notes.txt\"}" } }] }

{ "role": "tool", "tool_call_id": "call_abc",
  "content": "{\"ok\":true,\"result\":\"hello\"}" }

{ "role": "user", "content": [
  { "type": "text", "text": "Screenshot result from tool call call_abc:" },
  { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }] }
```

- The tool messages come directly after the assistant message, in call
  order. The screenshot message comes after the full batch.
- Arguments that are not JSON are sent back as `"{}"`, because a strict
  server refuses bad JSON in the history (`proto.ts:43-58`).
- Extra fields of a provider go back unchanged: `extra_content` of a call
  (one provider needs its signature), `reasoning_content` and
  `reasoning_details`.
- These messages live only in the memory of the turn. See 4.3.

### 4.3 What is stored

| Data | Where | Life |
|---|---|---|
| The provider messages of the turn (4.2) | Memory of the driver | The turn |
| Waiting requests | `pending` map (`approval.ts:36`) | The turn |
| Session grants | `sessionGrants` map (`chat.ts:226`) | Until a restart, 256 conversations |
| Request to card, tool item to row | `askMessageByRequest`, `toolMessageByItem` (`index.ts:4727-4728`) | Until a restart |
| The card | A stored message row of kind `options` (section 5.1) | Permanent |
| The tool row | A stored message row of kind `activity` with `tool.ok` and `tool.output` (section 5.1) | Permanent |
| The decision rows | `<data>/decisions/YYYY-MM.ndjson`, mode 0600, redacted | 180 days |
| The tool budget of a bot | Memory, 1,000 bots (`server/tool-budgets.ts`) | Until a restart |
| A large tool result | `<work folder>/mcp-results/result-<tool>-<time>-<hex>.txt` | The 20 newest files |
| The handoff of a stopped turn | A file, named in `cap.exhausted` | Not verified |
| Each refusal of a tool call by a provider | `native/<thread>.ndjson`, redacted | Not verified |

Tool rows and cards are not in the transcript that the model gets on the
next turn: the filter accepts kinds such as `text` and not `activity` or
`options` (`server/delta-context.ts:33-35`). So on the next turn the model
sees the reply texts of the bot, and not the tool calls or their results.
One exception is off by default: the setting `replayToolHistory` adds one
line `[ran: <name>: <detail> — ok]` for each tool row, "Never the call's
result" (`server/context-rebuild.ts:70-111`).

After a restart the two memory maps are empty. A tool row whose
`item.completed` then arrives stays without `ok`, and shows "No result".

### 4.4 The config and the capability flags

- `tools?: boolean` on a chat instance. `PATCH /api/instances/:id` with
  `{"tools": false}` sets it. The string `"false"` is refused with HTTP 400
  (`openai-tools.e2e.test.ts:145-151`).
- Capability flags of the adapter (`chat.ts:951-959`), all equal to "tools
  are not off": `agentsMcp`, `customMcp`, `composioMcp`, `dataMcp`,
  `emailMcp`, `deviceMcp`, and `askTool: { kind: "native", name: "ask_user"
  }`. Only a driver with computer use also has `computerMcp`,
  `localComputerMcp`, `browserMcp` and `nativeImageInput`.
- Option flags of the shared runtime, set by each driver: `tools`,
  `toolUse(model)`, `computerUse`, `localModel`, `nudgeAnnouncedAction`
  (`chat.ts:112-128`).

### 4.5 A second wire protocol

`openai-responses.ts` translates the same loop to the Responses API of one
provider. It is used only after the chat endpoint refuses a model with a
specific error. A tool there is `{ type: "function", name, description,
parameters, strict: false }`, a call is an item `function_call`, and a
result is an item `function_call_output`. The mount, the checks, the
approval and the run are the same.

## 5. The UI

### 5.1 What the server stores from the events (the fold)

The fold is the handler in `server/index.ts` that turns each driver event
into stored message rows (`index.ts:6256`, the `switch` at `:6370`). A row is
added with `store.appendMessage` (`server/store.ts:1131-1149`). A row is
changed with `store.patchMessage`, which writes the database before memory:
"a failed write must not mark a card answered that a restart shows pending"
(`server/store.ts:1244-1258`).

| Event | What the fold does | Code |
|---|---|---|
| tool `item.started` | Adds an activity row with `tool: { name, input, itemId, summary }` and no `ok`. No `ok` means "running". Puts `<thread>:<itemId>` → row id in the memory map `toolMessageByItem` | `index.ts:6426-6437` |
| tool `item.completed` | Finds the row through the map, replaces the full `tool` object with `ok` and `output`, and removes the map entry. If the map has no entry, nothing changes | `index.ts:6403-6415` |
| `item.updated` | Nothing. There is no case for it | |
| `request.opened` | Tries an automatic answer first. If the person must answer: adds a row of kind `options` with a `card`, puts the request in the memory map `askMessageByRequest`, writes a `card-shown` decision row, sets the activity of the task to `waiting-on-you`, and sends a notification of kind `approval` | `index.ts:6438-6587` |
| `request.resolved` | Patches the card: see the table below. Sets the activity back to `working` | `index.ts:6588-6617` |
| `runtime.error` | Adds a failure row `error: <cause>`, unless the person stopped the turn | `index.ts:6627-6636` |
| `turn.completed` after a stop | Adds one row `stopped: You stopped this.` | `index.ts:6643-6663`, `server/person-stops.ts` |

Stored rows, built from the code:

```json
{ "id": "<id>", "at": 1700000000000, "parentId": "<leaf>", "role": "bot", "kind": "activity",
  "turnId": "<turn>",
  "tool": { "name": "files_read_file", "input": "{\n  \"path\": \"notes.txt\"\n}",
            "itemId": "call_abc", "ok": true, "output": "{\n  \"ok\": true, ... }" } }

{ "id": "<id>", "at": 1700000000000, "parentId": "<leaf>", "role": "bot", "kind": "options",
  "card": { "title": "Approval needed", "subtitle": "<summary>", "options": ["Allow", "Deny"],
            "requestId": "<uuid>", "requestType": "permission", "tool": "mcp__files__read_file",
            "allowSession": true } }
```

The card row has no `turnId`. The tool row has one.

How `request.resolved` changes the card (`index.ts:6604-6611`):

| Case | Card fields after the patch |
|---|---|
| The person allows | `answered: "allow", dismissed: false` |
| The person denies | `answered: "deny", dismissed: false` |
| A stop or a close (`source: "system"`) | `answered: "deny", dismissed: true` |
| The time limit (`source: "timeout"`) | `answered: "deny", dismissed: true, expired: true` |

Two more writers close a card. After a stop, `closeOpenApprovals` sets each
card that is still open to `answered: "unavailable", dismissed: true`
(`index.ts:4872-4886`). When an answer arrives for a request that the driver
no longer has, `answerRequest` does the same and adds the row `Couldn't
deliver that answer — the request is no longer open, so the action was not
run` (`index.ts:4800-4816`).

The fold does not tell "failed" from "denied by the person". Both are a tool
row with `ok: false`.

### 5.2 The approval: two parts

One approval shows in two places.

**The panel above the message box** (`src/components/PendingApproval.tsx`,
drawn by `Composer.tsx:733-746`). It has the buttons:

```
+--------------------------------------------------------------+
| (bot face) Dev wants to run a command         [1 of 2]  [v]  |
| +----------------------------------------------------------+ |
| | git status --short          (monospace, 3 lines at most) | |
| +----------------------------------------------------------+ |
| [Show all]                                                   |
| (!) <note, when the server held the request>                 |
|                     [Always allow]  [Deny]  [Allow once]     |
| -- behind the chevron --                                     |
| <the full detail, in a block that scrolls>                   |
| [Cancel turn]                                                |
+--------------------------------------------------------------+
```

| Element | Text | What it sends |
|---|---|---|
| Header | `"{name} wants to {action}"`. The action is a plain phrase: `"run a command"`, `"read a file"`, `"use a tool"`, or `"<server> · <tool words>"` for an MCP tool | |
| Detail | The exact command, if the server found one, else the summary of the driver. Cut at 3 lines with `Show all` | |
| Counter | `"{index} of {count}"`, only when more than one approval waits | |
| `Allow once` | The one primary button, in the colour of the bot | `{ requestId, behavior: "allow" }` |
| `Deny` | Neutral, not red | `{ requestId, behavior: "deny", message: "Denied by the user." }` |
| `Always allow` | Shown when a saved rule is possible | First saves the rule for the bot, then `{ requestId, behavior: "allow" }`, or `rememberCommand: true` for an exact command |
| `Allow for this session` | Shown in place of `Always allow` when no rule is possible and `allowSession` is true. Tooltip: `"The provider stops asking about this action until the session ends"` | `{ requestId, behavior: "allow", always: true }` |
| `Cancel turn` | Behind the chevron | The same action as the Stop button, not an answer |

All answers go to `POST /api/threads/<threadId>/respond`
(`src/state/store.tsx:2428-2440`). The panel shows each card that has a
`requestId` and a `tool` and is not answered, dismissed or expired
(`PendingApproval.tsx:47-62`). So the UI finds an open approval from the
stored rows only.

While an approval waits, the message box is disabled, with the text `"Answer
the approval above to continue"` (`Composer.tsx:913`). There are no keyboard
shortcuts.

**The line in the transcript** (`CompactApprovalRow`,
`src/components/ApprovalCard.tsx:356-441`). While the panel is open, this
line is for a screen reader only. After the answer it shows:

| State | Line |
|---|---|
| Allowed | Green check, `"<header> [detail] · Allowed"` |
| Denied, and also after a stop | X, `"<header> [detail] · Denied"` |
| Time limit | Clock, `"· No answer in time. It did not run"` |
| Answered by voice or by a reaction | The outcome, then `"· by voice"` or `"· by reaction"` |

Each answer that is not `allow` shows as `Denied` for a tool card
(`ApprovalCard.tsx:98`). So a card that a stop closed says "Denied", although
the person did not deny it. The wire type has a field `card.stopped`, but
this path does not set it and the UI does not read it.

States with no special look: there is no "sending" state and no guard
against a second click. An error from the server goes to the general error
display, not to the panel (`store.tsx:2459-2463`).

### 5.3 The tool row

`ToolActivity` (`src/components/ToolActivity.tsx:17-61`) is a small chip that
opens:

```
[icon] <label>  <summary, Advanced mode only>   [>]
```

| State | Icon | Status word |
|---|---|---|
| Running (`ok` absent, the turn is live) | Moving dots | `Running` |
| No result (`ok` absent, the turn ended) | Circle | `No result` |
| Success | Green check | `Completed` |
| Failed, and also denied | X, danger colour | `Failed` |

- The label in Simple mode is a plain phrase such as `"Run a command"`. In
  Advanced mode it is the tool name in monospace.
- Open, the chip shows `Tool`, `Input`, `Result` (each in a block that
  scrolls), and the footer `"Shortened, automatically redacted preview.
  Review before sharing."`.
- A denied tool has no own look. It is a failed row.
- A tool that was running at a stop keeps no `ok`, so after the turn it
  shows `No result`.

Grouping (`src/lib/activity-runs.ts`): two or more successful steps in
sequence become one pill, `"{count} steps · {tools}"`. When the turn has its
final text, all its successful steps go behind one pill `"Worked for
{elapsed}"`. A running or failed step is never folded.

### 5.4 The status line and other places

- The status line shows texts such as `"Running a command"` or `"Reading a
  file"` from the tool row that runs (`src/lib/live-activity.ts:120-171`).
  `request.opened` clears the status (`src/state/turn-status.ts:73-74`), and
  the chat hides the "Working" line while the activity is `waiting-on-you`
  (`ChatView.tsx:869`). So while a card waits, the panel is the only sign in
  the chat.
- Outside the chat: the sidebar row of the thread shows `"Waiting"`
  (`SidebarThreadRow.tsx:288`), a notification is sent, the Inbox shows the
  same buttons (`src/components/inbox/InboxCard.tsx:38-41`), and a screen
  reader hears `"{name} needs your approval"` (`ChatView.tsx:900-905`).
- After a deny: the line says `Denied`, the tool row is `Failed`, and the
  driver then fails the turn (section 3.9), so a failure row with Retry
  follows.
- After a stop with an open card: the panel goes, the line says `Denied`, and
  one quiet row says `"You stopped this."` with Retry. There is no error row.

### 5.5 Accessibility

The panel is a `region` with the label `"Pending approval"`, and its header
has `aria-live="polite"`. The chevron has `aria-expanded` and
`aria-controls`. The buttons have a focus ring and a larger size on touch
screens. For a tool approval no code moves the focus to the panel. The tool
row is a `<details>` element with the label `"{name} · {status} · Tool
details"`.

### 5.6 The rules of `DESIGN.md`

`DESIGN.md` has no section for these components. Two rules apply:

- "**No new asks.** No new permission asks, approval cards, confirm dialogs,
  nags or waits that interrupt the person, and no default below Full
  access." (`DESIGN.md:57-59`)
- "**No count badges and no "needs you" summaries** above the sidebar list or
  in the header." (`DESIGN.md:50-51`)

## 6. The tests

The tests use real parts where they can: a real HTTP server on the loopback
address as the provider, and a real child process as the MCP server. Only
the model is fake: a test gives a script function that writes the stream
pieces for each round. The side effect of a tool is a line in a file, so a
test can prove "the tool did not run".

**What they guarantee** (`T` = `server/drivers/openai-chat-tools.test.ts`,
`E` = `server/openai-tools.e2e.test.ts`, `L` =
`openai-chat-local-model.test.ts`, `M` = `chat-mcp-tools.test.ts`, `AP` =
`chat-tool-approval.test.ts`, `P` = `openai-chat-protocol.test.ts`):

- **Allow:** before the answer there is no effect and one provider request.
  After it the effect exists, the tool message has the id of the call, and
  a second request is made (`T:808-837`, `E:167-206`).
- **Deny:** `respondToRequest` returns `rejected`. No effect. The model gets
  a tool message that matches `/denied/`. A second request is made. The
  turn is `ok: false`, also when the model says "I successfully wrote the
  receipt." (`T:1240-1252`, `E:207-211`).
- **Interrupt** at four moments (arguments half received, card open, tool
  running, second reply streaming): exactly one `turn.completed` with `ok:
  false`, `stopReason: "interrupted"`. The MCP process is dead. A late allow
  returns `unavailable` (`T:1470-1500`).
- **Session grant:** it applies to the same tool, the same bot, the same
  thread and the same start of the server. A changed `env` of the server
  asks again. A guest turn asks each time (`T:409-500`, `M:870-883`).
- **A request belongs to its thread:** a wrong thread, an unknown id, or
  `answer` on a permission card returns `unavailable` and has no effect
  (`T:1254-1267`).
- **Level `full`:** no `request.opened` (`T:1216-1228`).
- **The agents tools never ask**, and a configured server with the name
  `agents` still asks (`T:388-407`, `M:885-891`).
- **Bad calls:** bad JSON, arguments that are not an object, arguments
  outside the schema, and an unknown tool give `item.completed` with `ok:
  false` and a tool message, with no card and no effect (`T:1269-1283`).
- **Bad streams:** a duplicate id, a missing id, a changed id, a cut call:
  one request, no card, no effect, a `runtime.error` (`T:1285-1299`).
- **No replay:** HTTP 503 after a tool ran gives no retry
  (`T:1319-1331`). A used call id in a later round is refused before a
  second effect (`T:1352-1361`).
- **Limits:** 40 and 99 tool rounds finish with success. 200 calls stop the
  turn with the exact text, also when 25 calls come in one reply: the 9th
  batch runs no call (`T:1363-1452`). 32 calls for a reply and 256,000
  argument characters are the exact limits (`P:63-79`).
- **128 tools:** the exact layouts and notices (`T:1587-1650`,
  `M:998-1132`).
- **A hosted model that writes a call as text:** nothing runs
  (`T:839-852`, `T:1178-1187`). A local model: it runs, and asks first at
  level `ask` (`L:102-124`).
- **A failed tool:** a hosted model that continues with tools ends with
  success (`L:243-258`). One that answers after the failure ends with
  `tool_error` (`L:272-278`).
- **Secrets:** a tool that returns the API key does not put it in a tool
  message, an event or a log (`T:1163-1176`).
- **The gate:** a time limit denies with source `timeout`, a stop denies
  with source `system`, a question stays open after 72 hours
  (`AP:10-41`, `AP:157-174`).
- **The safety floor:** at level `full` with the floor on, a never-list
  command does not reach the tool and one decision row is written. At level
  `ask`, a card that the person allows is not blocked
  (`openai-chat-safety-floor.test.ts`).
- **The UI:** a waiting command is one hidden line in the transcript and the
  panel above the message box; a denied card says `· Denied`; an expired
  card is not in the list of open approvals
  (`src/components/ApprovalCard.test.ts`). `Allow once` is the one primary
  button and `Deny` is neutral; `Cancel turn` is behind the chevron
  (`PendingApproval.command-allowlist.test.ts`). A tool row starts closed,
  and shows `Running`, `No result`, `Failed` or `Completed`
  (`ToolActivity.test.ts`).

**What no test asserts:**

1. The complete order of the events of a tool turn. Each assertion is on one
   event. The order of `request.opened` and `item.started` is not tested.
2. `tool_choice` and `parallel_tool_calls` (the driver never sends them).
3. A reply with two calls where the person allows one and denies the other.
4. A stop between two calls of one batch.
5. The tool result and the turn state after a time limit of a card, at the
   level of the driver.
6. The exact envelope `{"ok":true,"result":...}` of a normal successful
   result. It is asserted exactly only for `ask_user` and for bad arguments.

## 7. Ours compared

We have no code for this feature. `crates/bot-engine/src/lib.rs` (ours) is
one doc comment, and `crates/bot-protocol` (ours) has only the identifier
types. So this section compares the reference with our plan and decisions.

| Topic | The reference | Ours |
|---|---|---|
| Who runs the tool loop of a chat driver | The driver (`chat.ts`) | No step of `docs/plan/README.md` says it. Step 5 is a chat driver with streaming only. `docs/comparison.md` section 3 notes "The server runs the tool loop" |
| Where tools come from | The driver is an MCP client. It starts each MCP server as a child process | D8: "The server exposes its own tools to engines as an MCP server". Step 12: "An engine lists the bots through the tool". This fits an ACP engine, which is an MCP client itself. A chat API is not |
| Events of a tool | `item.started`, `item.completed` with `itemType: "tool"`, `request.opened`, `request.resolved`, `runtime.notice`, `turn.retrying`, `cap.exhausted` | D20 has five events. Its open risk says: "`item.completed` is for reply text only ... The tool steps must extend it" |
| The end of a turn | `ok`, `stopReason` (5 values), `denials` | D20: one `outcome`: `completed`, `failed`, `interrupted`. The error codes are `setup`, `engine_failed`, `internal`. None says "a tool failed" or "the person said no" |
| Roles | The stored message has 2 roles. The provider messages have 4: `system`, `user`, `assistant`, `tool` | D18: 2 roles in `Message`. Its open risk says: "A tool result has no role" |
| Approval levels | 5 names. A chat driver compares with `full` only | D8: `ask < edits < auto < full`. Step 10 builds "the permission request path and the approval box", after the ACP driver of step 9 |
| The answer to a request | `respondToRequest` returns `allowed-once`, `rejected`, `answered` or `unavailable` | Step 3.2 has a capability flag `approvals`. No type yet |
| Capability flags | Many flags for the kinds of MCP server, and `askTool` | Step 3.2: `streaming`, `interrupt`, `approvals`, `tools` |
| Limits | Constants in the code. "There is no per-bot or per-thread setting" | D10: "No setting is a constant in the code" |
| Outside tools | Custom MCP servers, with the driver as the client | Step 16 and D12: custom MCP servers, through "a proxy of ours ... between the engine and the tool server" |
| State of a waiting request | In the memory of the driver | `AGENTS.md` (ours): "The runtime in `bot-core` owns all work state" and "Every state change in the runtime writes the row and its event in one transaction" |

The main difference: our plan gives tools to an engine through MCP, and
that works only for an engine that is an MCP client. The first engine of our
plan is a chat API (D14). With the plan as it is, a bot on the chat driver
cannot use a tool at any step.

## 8. Where we can be better

Each point names a problem of the reference, with the line, and what we can
do in its place.

1. **One typed result for a tool call.** The reference has `ok: boolean`
   and a text. A deny, a time limit and a closed gate give the same text
   (`approval.ts:21`). On a stop while a card waits, a call that never ran
   gets `Tool interrupted; an operation already dispatched may have taken
   effect` (`chat.ts:869-871`), which is not true for it. An enum such as
   `Succeeded`, `Failed`, `Denied { by: Person | Timeout | Floor }`,
   `NotRun`, `Interrupted { dispatched: bool }` lets the compiler refuse the
   wrong combination, and the model gets a true sentence.
2. **The outcome of a turn says why.** The reference needs three fields to
   say "the person denied a call": `ok: false`, `stopReason: "tool_error"`
   and `denials`. The same `stopReason` also means "a tool failed". Our D20
   has one `outcome` enum. We can add the reason to the failed case, for
   example `tool_failed`, `tool_denied`, `limit_reached`, `incomplete`, and
   the window can then choose the correct row: a red error for a failure,
   and a neutral row for the person's own "no".
3. **A tool row that shows while the card waits.** The reference emits
   `item.started` after the answer to the card (`chat.ts:841-846`). Before
   that, the only sign of the call is the card. We can emit the start of the
   item first, with a state `waiting_for_approval`, so that the request
   always belongs to a visible item, and the order of the events has one
   rule.
4. **The answer "always for this session" has its own outcome.** The
   reference returns `allowed-once` for it (`approval.ts:107-108`), and the
   contract comment says "the app keeps no grant of its own"
   (`server/contracts.ts:320`) while the chat driver keeps one
   (`chat.ts:226`). A separate enum value, and the grant in our runtime
   store, removes both contradictions.
5. **Waiting requests in the store.** In the reference they are in memory
   (`approval.ts:36`). After a restart the card still shows, and a click
   gets "Couldn't deliver that answer". Our rule is that the runtime owns
   all work state and writes the row and its event in one transaction. Then
   start-up can close each open request with a clear state.
6. **A typed refusal for an answer that has no request.** The reference
   route answers HTTP 200 with `outcome: "unavailable"`
   (`index.ts:4800-4815`). Our runtime returns typed refusals
   (`AGENTS.md`), so "no such request", "already answered" and "the turn
   ended" can be three cases.
7. **A decision row for each allow.** The reference writes no row when a
   call runs at level `full` or under a session grant. The audit log then
   has no record of most tool runs. One row for each call that runs, with
   the reason for the allow, costs one insert.
8. **Limits as settings.** The reference had a limit of 64 rounds, then
   removed it, and its document still names it. Its other limits are
   constants. Our D10 already says that no setting is a constant in the
   code. A `TurnLimits` struct with defaults (200 calls, 32 for a reply,
   15 minutes for a card, 10 minutes for a call) makes each limit visible
   and testable.
9. **A safety floor that works on Windows.** The reference floor does
   nothing on a Windows server and reads only the keys `command` and `cmd`
   (`server/safety-floor-gate.ts:14-39`, `:147-153`). Our author works on
   Windows. Do not copy the floor as it is. Design it with the tools that we
   give to a bot, where we know which argument is a command.
10. **The `tools` setting by a capability flag.** The reference permits it
    by a list of nine driver names (`server/routes/instances.ts:504`). Our
    rule gates behaviour by capability flags, never by a driver's name.
11. **"Partly shown" is not "failed".** In the reference, a result with one
    content part that the driver cannot show is `ok: false`, also when the
    tool did its work (`mcp.ts:877`). That can fail a turn whose work was
    done. A separate flag keeps success and completeness apart.
12. **A test of the full event order.** No reference test asserts the
    complete order of the events of a tool turn. With our fake driver and
    an in-memory store, one test for each path (allow, deny, time limit,
    stop, tool error, limit) can assert the full list.
13. **The limit on arguments is for each call.** The reference counts the
    sum of all calls of one reply (`proto.ts:135-147`), so many small calls
    fail in the same way as one very large call.
14. **A stopped card says "Stopped", not "Denied".** In the reference a stop
    closes the card as `answered: "deny"` or `"unavailable"`, and the UI
    shows each of these as `Denied` (`ApprovalCard.tsx:98`). The person then
    reads that they said no. A card state enum (`Open`, `Allowed`,
    `Denied`, `Expired`, `Closed { reason }`) in place of three optional
    fields (`answered`, `dismissed`, `expired`) makes the wrong label
    impossible.
15. **A denied tool row is not a failed tool row.** The fold stores both as
    `ok: false`, and the row shows `Failed` in the danger colour
    (`ToolActivity.tsx:34-36`). With the typed result of point 1, the row can
    say "Not allowed".
16. **Tool rows link to their item in the store, not in memory.** The
    reference finds the row through a memory map (`index.ts:6405`), so after
    a restart a row stays "running" for ever. If the row key is the turn and
    the call id, no map is necessary.
17. **No product name in the text for the model.** The reference texts for
    the model start with the product name in brackets (`chat.ts:190`,
    `:193`, `chat-repeat-guard.ts:43`). Build these texts from one place,
    with no name in them.

Things to keep as they are, because they are correct and tested:

- Register the request before the event is sent.
- Check the ids of the full batch before a call runs.
- Never retry a request after a tool ran, and stop a server after a call
  with an uncertain outcome.
- Read the approval level before each call.
- A question skips the level and has no time limit.
- A hosted model's text that looks like a call never runs.
- Always answer each tool call of the model with a tool message.

## 9. Not verified

**The UI, open points:**

- What the person sees when a second device answers first. The server code
  for the voice path returns 409; the end of the HTTP route
  (`server/routes/bot-messages.ts` after line 720) was not read.
- How the general error display shows an error from `/respond`.
- The default of the switch `showToolCalls`.
- `PartlyDoneRow` and the code that sets `tool.partial`.
- The room view (`GroupView.tsx`): only search lines.
- The tests of the UI other than `ToolActivity.test.ts` were read by name
  and in ranges only.

**Other open points:**

- No start-up code was found that closes open permission cards. A sweep in
  another module can exist.
- `server/mcp-gate.ts`: lines 1-70 only. Its part in a tool call of a chat
  driver is not confirmed.
- `server/safety-floor.ts`: the patterns of the never-list were not read.
- The other chat drivers that the `tools` setting names (`mistral`, `groq`,
  `greenference`, `modelgo`, `meta`): not read.
- `shared/tool-scope.ts` (the tool selection of a bot), `server/procs.ts`
  (how a process tree is stopped), `server/mcp-remote-proxy.ts` (the HTTP
  side of a remote MCP server): not read.
- `server/drivers/openai-chat.test.ts` has more tests about approvals
  (`:213-221`, `:265`). The earlier session read it for the plain turn. Its
  tool tests were not listed again.
- The value of `turn.toolErrorCorrectiveRounds` for a hosted model
  (`server/host/loop-guard.ts`).
- Who reads `turn.completed.denials` on the server.
- How long a handoff file and the native log are kept.
- The event examples in 4.1 are built from the code. They are not from a
  run. No test was run.
- If a tool operation stops on the side of the MCP server after a stop. The
  driver only closes the process.
