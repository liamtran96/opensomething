# Agent tools: the catalog, the proxy, the tool bridge and large results

Feature rows of [`../reference-features.md`](../reference-features.md),
group 3: `agents-tool-bridge.md`, `verification/tool-results.md`, "A tool
directory when a bot has more than 128 MCP tools", and the tools `list_bots`
and `check_delegation`. Step 12 of [`../../plan/README.md`](../../plan/README.md).
Crate: `bot-engine` (an MCP server with our own tools).

Read on 2026-11-25 at commit `eee23ebbe` of the reference project (the merge
of the release branch v0.1.179). All paths are in the reference project
unless a line says "ours". The `enterprise/` directory was not opened. Nine
subagents read nine groups of files. The main session checked 14 key claims
against the code (section 9 lists what is not checked).

In quoted text from the reference, `<product>` replaces the product name of
the reference. The reference calls the default helper bot of a person by a
product name. This file calls it "the helper bot".

## What this file adds to earlier research

- [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md) has the tool loop
  of the chat driver. This file does not repeat it. It adds how the chat
  driver is an MCP client of the server's own tools
  (`server/drivers/chat-mcp-tools.ts:555`), and the name prefix `agents_`.
- [`turn-limits.md`](turn-limits.md) section 3.7 has the layout of the
  128-tool limit in the chat driver, and the ACP retry after a refusal. This
  file does not repeat them. It adds:
  1. what the three changelog items about the tool list really were
     (section 3.13).
  2. the size of the server's own list for each role, from the golden files.
  3. the tool bridge (`find_tool` and `use_tool`), and why it stays off.
  4. how the server's own list keeps its share of a limit.
- [`acp-core.md`](acp-core.md) has how an ACP engine gets its MCP servers in
  `session/new`. This file adds what the server puts in that list: the
  `agents` server, its environment, its bearer and the URL form.
- This file corrects one line of ours: `docs/comparison.md:108` says "a
  token for the turn". Since v0.1.96 the token is stable for each bot,
  thread and set of grants. Only the record behind it is for one turn
  (section 3.2).

## 1. In short

The server of the reference project has about 78 tools of its own: list the
other bots, give work to a bot, post in a room, save a memory, set a
trigger, and more. Each engine (Claude Code, Codex, an ACP agent, Pi, or the
chat API driver) gets these tools as one MCP server with the name `agents`.

- **MCP** (Model Context Protocol): a protocol in JSON-RPC 2.0. A client
  asks a server for its tools (`tools/list`) and calls one (`tools/call`).
- **The agents proxy**: a small Node process
  (`server/drivers/agents-proxy.ts`, 33 lines) that the engine starts. It
  speaks MCP on stdin and stdout. It holds no state. For each tool call it
  sends one HTTP request to the main server on the loopback address.
- **The harness**: the reference's name for its main server process.
- **The catalog**: the static list of all tool definitions
  (`server/drivers/agents-catalog.ts`).
- **The profile**: the set of flags that chooses which tools of the catalog
  one conversation sees (`server/drivers/agents-catalog-profile.ts`).
- **The role**: two of those flags: Chief of Staff (the bot that leads a
  department) or not, and the helper bot or not.
- **The bearer** (`OMB_COMMS_TOKEN`): a random token in the environment of
  the proxy. The harness maps it to a record in memory, the **internal
  capability**, with the bot, the thread, the turn and what the turn may do.
  The proxy's own bot id and thread id are only claims. The bearer is the
  proof.
- **The tool bridge**: an option that lists a short set of tools plus two
  tools, `find_tool` (search the hidden tools) and `use_tool` (call a hidden
  tool by name). It is off by default.
- **The tool directory**: a different option, for the person's own MCP
  servers. A large server is listed as three tools: `search_tools`,
  `describe_tool` and `call_tool`.
- **The golden test**: a test that starts the real proxy for 31 profiles and
  compares the bytes of `tools/list` with files in git.

The main facts:

1. The list is the same, byte for byte, on each turn of one conversation and
   for each bot of the same role. The reason is the prompt cache of the
   model provider: the tools come first in a request, so a change of one
   byte makes the provider read the whole conversation again at the full
   price (`server/agents-turn.ts:1-4`).
2. The list is not a permission. The harness checks each call against the
   record of the bearer. A call that the turn may not make gets a refusal
   with a reason (`server/index.ts:1800`, `:12759-12769`).
3. A large result (more than 24,000 characters) goes to the model as the
   first 16,000 characters and a notice. The full text stays in memory for
   one hour. The bot reads the rest with the tool `tool_result_read`
   (`server/drivers/agents-result.ts:16-31`).
4. The limit of 128 tools comes from the OpenAI-compatible chat API
   (`shared/tool-budget.ts:1-2`). It applies to the chat driver before each
   request, and to an ACP engine only after a provider refused a turn.
5. `list_bots` lists the bots that this bot can reach, one line for each
   bot. `check_delegation` does not exist now. It was removed in v0.1.108,
   and `assignment_status` replaced it.

## 2. Files read completely

Line counts are at `eee23ebbe`. "Ranges" means that only those lines were
read.

**Catalog, profile and role (group 1)**

| File | Lines |
|---|---|
| `server/drivers/agents-catalog.ts` | 886 |
| `server/drivers/agents-catalog-profile.ts` | 69 |
| `server/drivers/agents-tool-groups.ts` and test | 53, 87 |
| `packages/phone-protocol/src/tool-groups.ts`, `shared/tool-groups.ts` | 33, 1 |
| `server/drivers/agents-schema.ts` and test | 116, 168 |
| `server/drivers/agents-claude-defer.ts` and test | 47, 99 |
| `server/drivers/agents-tool-limit.ts` | 4 |
| `packages/phone-protocol/src/agents-tool-names.ts`, `shared/agents-tool-names.ts` | 99, 1 |
| `server/drivers/agents-catalog-wire.test.ts` | 472 |
| `server/drivers/agents-aliases.test.ts` | 190 |
| `server/drivers/agents-catalog-local-vm.test.ts` | 32 |
| `server/tool-schema-profile.ts` and test | 294, 177 |
| `server/agent-tool-policy.ts` and test | 34, 49 |
| `server/chief-level.ts` | 37 |
| `server/agents-turn.ts` and test | 101, 140 |

**Golden files and the small tool files (group 2)**

| File | Lines |
|---|---|
| `server/drivers/agents-catalog-goldens/full.tools-list.json` | 2,549 |
| `server/drivers/agents-catalog-goldens/bridged.tools-list.json` | 609 |
| `server/drivers/agents-catalog-goldens/profiles.json` | 1,909 |
| `server/drivers/agents-catalog-goldens/bridged.profiles.json` | 758 |
| 25 files `server/drivers/agents-*-tool(s).ts` (from `agents-app-settings-tool.ts`, 27, to `agents-workflow-tool.ts`, 101) | 6 to 101 each |
| `agents-mausbot-tools.test.ts`, `agents-usage-tool.test.ts`, `agents-wait-tools.test.ts`, `agents-options-card.test.ts` | 27, 58, 138, 86 |

**The connection (group 3)**

| File | Lines |
|---|---|
| `server/drivers/agents-mcp.ts` | 75 |
| `server/drivers/agents-proxy.ts` | 33 |
| `server/drivers/agents-client.ts` | 57 |
| `server/drivers/agents-mcp-env.ts` and test | 10, 13 |
| `server/drivers/agents-timing.ts` | 19 |
| `server/drivers/agents-bridge.ts` | 228 |
| `server/drivers/agents-bridge.test.ts`, `agents-bridge-wire.test.ts`, `agents-bridge-chat.test.ts` | 532, 404, 162 |
| `server/routes/own-mcp-http.ts`, `own-mcp-http-path.ts` | 127, 3 |
| `server/drivers/own-mcp-http.ts` and test | 81, 140 |
| `server/drivers/turn-mcp.ts` and test | 129, 125 |
| `server/proxy-paths.ts` | 31 |
| `scripts/mcp-server.ts`, `server/mcp-server.test.ts`, `docs/mcp-server.md` | 1,411, 766, 157 |
| `server/routes/internal-mcp.ts` | 529 |
| `server/mcp-server-app.ts` and test | 52, 60 |
| `scripts/bundle-server.mjs` | 180 |

**Proxy tests (group 4)**

| File | Lines |
|---|---|
| `server/drivers/agents-proxy.test.ts` | 2,856 (seven consecutive ranges) |
| `server/agents-bridge.e2e.test.ts` | 385 |
| `server/agents-bridge-gates.test.ts` | 235 |

**Call dispatch and identity (group 5)**

| File | Lines |
|---|---|
| `server/drivers/agents-call.ts` and test | 996, 780 |
| `server/drivers/agents-call-cards.ts` and test | 89, 235 |
| `server/drivers/agents-call-triggers.ts` and test | 505, 158 |
| `server/drivers/agents-result.ts` and test | 31, 44 |
| `server/drivers/agents-blank-arguments.ts` | 66 |
| `server/trigger-tools.ts` and test | 245, 145 |
| `server/host/internal-body-ids.ts` | 13 |
| `server/host/turn-call-signals.ts` | 28 |
| `server/turn-dispatch-guard.ts` | 178 |

**The 128 limit, the bridge switch and the directory (group 6)**

| File | Lines |
|---|---|
| `server/agents-bridge-switch.ts` and test | 382, 884 |
| `server/agents-bridge-names.ts` and test | 18, 97 |
| `server/tool-count-limit.ts` and test | 138, 88 |
| `server/mcp-trim.ts` and test | 232, 170 |
| `server/mcp-gate.ts` and test | 428, 549 |
| `server/mcp-gate-config.ts` and test | 246, 207 |
| `server/mcp-directory.ts` and test | 565, 443 |
| `server/drivers/chat-mcp-tools.ts` | 953 |
| `server/tool-budgets.ts`, `shared/tool-budget.ts` | 21, 19 |
| `docs/agents-tool-bridge.md`, `docs/tool-selection.md`, `docs/feature-flags.md` | 225, 133, 123 |
| `docs/superpowers/specs/2026-11-01-mcp-in-chat-design.md` | 387 |
| `scripts/verify-local-tool-selection.ts`, `scripts/verify-tool-scope.ts` | 157, 121 |
| `server/drivers/acp/tool-scope.test.ts` | 168 |
| `evals/tool-choice/` (score, its test, cases, context, runner) | 40, 42, 18, 27, 86 |
| `server/drivers/pi-mcp-servers.ts` | 49 |

**Large results (group 7)**

| File | Lines |
|---|---|
| `server/tool-results.ts`, test, end-to-end test | 71, 78, 112 |
| `server/host/tool-results-sweep.ts` and test | 218, 167 |
| `server/host/late-tool-results.ts` and test | 91, 76 |
| `server/tool-result-spill.ts` | 12 |
| `docs/verification/tool-results.md` | 59 |
| `src/components/bot-settings/ToolBudgetLine.tsx` and DOM test | 33, 83 |

**`list_bots`, wiring and the bot box (group 8)**

| File | Lines |
|---|---|
| `server/peer-roster.ts` and test | 437, 566 |
| `server/contracts.ts` | 680 |
| `server/activity.ts` and test | 361, 267 |
| `server/system-prompt.ts` | 341 |
| `src/lib/ready-bots.ts` | 426 |
| `server/host/personal-reach.ts` | 104 |
| `server/drivers/claude-tool-search.ts`, `codex-mcp-mount.ts` | 138, 77 |
| `server/bot-box/broker.ts`, `broker-mcp.ts`, `broker-mcp-refusal.ts`, `broker-env.ts`, `broker-probe.ts`, `harness-gate.ts`, and the five tests | 231, 85, 31, 88, 49, 87. Tests: 165, 143, 157, 60, 66 |

**Documents and history (group 9)**

| File | Lines |
|---|---|
| `docs/agents-tool-bridge.md`, `docs/runtime-contract.md` | 225, 144 |
| `docs/verification/README.md`, `engines.md`, `claude-tool-lifecycle.md`, `openai-tools.md`, `tool-results.md` | 385, 197, 144, 212, 59 |
| `docs/superpowers/specs/2026-11-12-app-settings-tool-design.md` | 253 |

**Ranges** (not complete):

- `server/index.ts` (15,258 lines): 1540-1899, 2899, 5380-5435,
  8100-8159, 9600-9612, 12380-12392, 12540-12566, 12670-12860,
  12900-13174, 13624.
- `server/drivers/claude.ts`: 400-430, 960-1159. `codex.ts`: 400-574,
  970-1000. `acp/core.ts`: 180-198, 280-283, 880-969, 1120-1199,
  1352-1356. `pi-mcp-extension.ts`: 1-299, 470-761. `openai-chat.ts`:
  585-700. `mcp-remote-proxy.ts`: 86-383. `antigravity.ts`: 1-40,
  150-340.
- `CONTRIBUTING.md`: 1-112, 228-427. `docs/self-hosting.md`: 590-602,
  926-934, 1060-1124, 1690-1829.
- `server/host/conversation-folder-cleanup.ts`, `orphan-sweep.ts`,
  `server/routes/mcp-servers.ts`, `src/components/McpServersPanel.tsx`:
  the lines that use the result folders and the tool budget.
- Git: the messages, the file lists and some diffs of `d83f5b3b3`,
  `e086adf6b`, `9413b5147`, `ddab4356b`, `41c89c416`, `e4dd55c19`,
  `00018c7ee`, `76b0a368b`, `a96950e01`, `4776d25b0`, `81ad92cf3`,
  `b945b7b98`, `ffd126e54`, `f6af8a06e`, `28fb7ce7f`, `3f15b33c4`. The
  release notes of v0.1.76, v0.1.101, v0.1.111, v0.1.120, v0.1.141 and
  v0.1.180.

**Ours:** `README.md`, `docs/plan/README.md`, `docs/decisions.md`,
`docs/comparison.md`, the three research files named above, and all 302
lines of Rust in `crates/`.

## 3. How it works

### 3.1 Two MCP servers with the same tool name

The reference has two MCP servers. They share no code. Do not mix them up.

| | The `agents` server (for engines) | `scripts/mcp-server.ts` (for outside apps) |
|---|---|---|
| Who starts it | An engine of a bot, on each turn | Claude Desktop, Cursor or another MCP app of the person |
| Code | `agentsMcp(env)`, `server/drivers/agents-mcp.ts:21-75`, JSON-RPC by hand | 1,411 lines, JSON-RPC by hand |
| Server name, version | `<product>-agents`, `0.1.0` (`agents-mcp.ts:34-39`) | `<product>-mcp`, `1.1.0` (`mcp-server.ts:1279-1282`) |
| Protocol version | the client's version, else `2024-11-05` | one of four, else `2025-11-25` (`:1270-1273`) |
| Tools | 41 to 68 for each conversation (section 3.3) | a fixed list of 20 (`:153-471`) |
| Who it acts as | one bot, in one thread, in one turn | the person, on any bot |
| Calls go to | `/api/internal/*` with the turn's bearer | the public API with a paired session token |

Both have a tool with the name `list_bots`. They are different tools
(`server/mcp-server.test.ts:80-110`). The rest of this file is about the
`agents` server only. The outside server is part 33 of
[`../README.md`](../README.md).

`server/routes/internal-mcp.ts` is not the transport of the engines. It is
`/api/internal/mcp-servers`, the server side of the tool `mcp_server`, which
manages the person's own MCP servers (`internal-mcp.ts:23`). That is part 20.

### 3.2 Turn start: the bearer and the record

1. A turn of a thread starts. `beginInternalCapabilityGeneration(threadId)`
   revokes the previous generation of the thread and makes a new random
   generation id (`server/index.ts:1642-1647`). So one turn of a thread is
   active at a time.
2. The host decides if the engine gets the tools:
   `instance.adapter.capabilities.agentsMcp === true`
   (`index.ts:7603`, `:2899`, room turns `:9607`). This is a capability
   flag of the driver (`server/contracts.ts:257-258`).
3. `agentsIntegration(...)` builds the server: `{ command: node, args:
   [<agents-proxy>], env }` (`index.ts:1789-1806`). The env comes from
   `agentsServerEnv(conversation, turn, bearer, harnessUrl)`
   (`server/agents-turn.ts:36-60`).
4. The bearer function calls `mintInternalCapability({ botId, threadId,
   kind: "agents", createdBots: 0, openedThreads: 0, ...turn })`
   (`index.ts:1667-1683`).
   - It throws "cannot mint an integration capability for an inactive
     turn" when the generation is not active.
   - The token is `sessionBearer`: stable for one bot, thread, kind and set
     of grants (`index.ts:1649-1665`). `engine-prestart.ts:21-29` keeps the
     token while the grants JSON is the same, else it makes
     `randomBytes(24)` in hex.
   - The grants leave out the generation, the depth, the hand-off and the
     skill authoring flag. They include the approval mode
     (`index.ts:1658-1661`).
   - With `perTurn`, the token is new each turn. The computer integration
     uses this: "an engine whose own process bridges into a machine that
     can stop between turns needs a fresh start, which a new bearer forces"
     (`index.ts:1671`).
5. The record behind the token is for one turn. It has the bot, the thread,
   the generation, the depth, the kind, the grants, counters for the turn
   (bots made, threads opened, room posts, files attached), an orphan time
   of 30 days and the start time (`index.ts:1574-1609`). It is in memory
   only: `Map<token, InternalCapability>` (`:1609`).
6. Why the token is stable and the record is not: "The bearer is part of
   the engine's launch contract, so it stays stable per bot, thread and
   grants; the record behind it is per turn and honoured only during one.
   Security invariant: a turn's depth, the hand-off it runs for and whether
   it may author skills are read from that record on every call, never from
   the engine" (`index.ts:1649-1651`). Before v0.1.96 the token was new on
   each turn. The token is part of the MCP config, and the drivers compare
   that config to reuse a process. So "every turn relaunched Claude with
   --resume and ran ACP's session/load" (commit `e086adf6b`).

The limits of one turn, kept in the record (`index.ts:1603-1606`,
`:1785-1786`):

| Limit | Value |
|---|---|
| Files attached | 10 |
| Room posts | 3 |
| Bots made | 4, with at most 4,000 characters of instructions each |
| Depth of hand-offs | 1 (`MAX_COMMS_DEPTH`) |
| Bots in a workspace | 100 |

### 3.3 `tools/list`: the catalog, the profile and the role

1. The harness puts the facts of the conversation in the env of the proxy
   (`agents-turn.ts:36-60`):
   - `OMB_HARNESS_URL`, `OMB_BOT_ID`, `OMB_THREAD_ID`, `OMB_COMMS_TOKEN`.
   - flags as `"1"` or `"0"`: skill authoring, workflows, memory, shared
     computers, cloud home, team people, room, voice notes, X research,
     research, image generation, meetings, app hosting, computer
     selection, local VM.
   - `roleToolEnv(bot)`: `OMB_CHIEF_OF_STAFF` and the helper bot flag
     (`server/chief-level.ts:34-37`).
   - `OMB_TOOLS_OFF`: the groups of tools that the person turned off.
2. Some flags come from rules, not from one setting
   (`agents-turn.ts:36-60`):
   - research = the host has X and research, and the bot did not turn X
     research off.
   - meetings = the host has meetings and the turn is not in a room.
   - computer selection = not in a room, the bot's computer is not off, no
     team computer, and a person drives the turn.
3. The proxy reads the env one time when it starts:
   `catalogProfileFromEnv(env)` (`agents-catalog-profile.ts:46-69`).
   "Everything is off unless the harness says \"1\"". Three flags are on
   unless `"0"`: workflows, memory and the local VM.
4. `agentsToolList(env)` (`agents-mcp.ts:14-19`):
   1. `available = availableTools(profile)`.
   2. with the bridge on (`OMB_AGENTS_TOOL_BRIDGE === "1"`), the listed
      tools are the bridge's short list (section 3.8).
   3. else, with `OMB_AGENTS_DEFER_TOOLS === "1"` (Claude with tool
      search), the tools get a defer mark (step 7).
   4. else the listed tools are all available tools.
5. `availableTools(profile)` (`agents-catalog.ts:834-848`):
   1. `catalogTools(profile)` filters the catalog (step 6).
   2. `withoutToolsOff` removes the groups that the person turned off.
   3. on a cloud home, it removes `vm_exec` and narrows the choices of
      `select_computer` to auto, cloud and browser. With no container
      runtime, it removes `vm_exec` and the "vm" choice. The reason: "A
      model shown a tool it cannot use spends turns finding out"
      (`:840-841`).
   4. `advertisedSchema` on each tool (section 3.3.1).
6. `catalogTools(profile)` (`agents-catalog.ts:857-886`). This table has
   each condition that adds or removes a tool:

| Tool or tools | Listed only when | Line |
|---|---|---|
| `create_options_card` | the bot is the Watcher bot (one fixed id) | `:859` |
| `memory_update`, `memory_log` | memory is not off | `:860` |
| `select_computer` | computer selection is on | `:861` |
| `wait_until`, `list_waits`, `cancel_wait`, `check_back`, `burst`, `rename_thread` | not a room | `:822-823`, `:862` |
| `generate_image`, `edit_image` | image generation is on | `:863` |
| `publish_app`, `check_app_hosting` | app hosting is on | `:863` |
| 5 meeting tools and `reset_cloud_computer` | meetings is on | `:864` |
| `run_workflow`, `workflow_edit` | workflows are not off | `:865` |
| `skills_list`, `skill_manage` | skill authoring is on | `:866-868` |
| `list_shared_computers`, `shared_computer` | shared computers are on | `:869-871` |
| `ask_for_computer` | shared computers, a cloud home, and not a team | `:872` |
| `send_voice_note` | voice notes are on | `:873-875` |
| `x_search` | X research is on | `:876-877` |
| `research_search`, `research_endpoint`, `research_call` | X research and research are on | `:876-877` |
| 7 Chief tools: `create_bot`, `list_team_setup`, `list_team_library`, `propose_team_setup`, `propose_bot_deletion`, `manage_room`, `retry_thread` | the bot is a Chief | `:814-816`, `:878-880` |
| the fields `for_bot_id` and `browserProfile` of `propose_profile`, `propose_model`, `reset_cloud_computer` | the bot is a Chief (else the fields and their sentence are removed) | `:817-818`, `:880-884` |
| `list_unread_notifications`, `mark_notifications_read` | the bot is the helper bot (added last) | `:885` |
| `vm_exec` | not a cloud home, and a local VM can run | `:836-846` |
| any tool of a group in `OMB_TOOLS_OFF` | the group is not off | `agents-tool-groups.ts:40-48` |

   All other tools are always listed, for example `list_bots`,
   `coordinate_bots`, `assignment_status`, `message_person`, the trigger
   tools and `mcp_server`.

7. Claude with tool search (`server/drivers/agents-claude-defer.ts`):
   - The Claude driver mounts the server with `alwaysLoad: true` and sets
     `OMB_AGENTS_DEFER_TOOLS=1` only when tool search is on
     (`claude-tool-search.ts:134-138`).
   - Each tool outside a small set gets
     `_meta: { "anthropic/alwaysLoad": false }` (`:29-34`). Claude Code then
     keeps it behind its own tool search. This needs Claude Code 2.1.285 or
     later, checked on 2.1.321 (`:1-4`).
   - The set that stays loaded: `tool_result_read`, `list_bots`,
     `message_person`, `create_options_card`, and for a Chief also
     `coordinate_bots` (`:13-21`).
   - Why `list_bots` stays: "a deferred list_bots loses to Claude Code's
     own ListAgents when the bot inherits this machine's setup" (`:9-10`).
8. The proxy cuts the list to the turn's tool limit, if a limit is set:
   `capToolListResult` with `toolLimitFromEnv` (`agents-mcp.ts:23`, `:46`).
   It keeps the first N tools (section 3.9).
9. The list does not change in a turn. Neither server sends
   `notifications/tools/list_changed` (`agents-mcp.ts:34-39`). A change to
   the person's MCP servers reaches the bot "on your next turn"
   (`internal-mcp.ts:31-37`).

#### 3.3.1 Two schemas for each tool

- The catalog has the full schema of each tool. Each call is checked
  against it: `outOfBounds(name, fullInputSchema(name), args)`
  (`agents-call.ts:219`, `agents-schema.ts:103-111`).
- `tools/list` sends a shorter schema (`advertisedSchema`,
  `agents-schema.ts:54-56`). It leaves out only these keywords, which the
  check enforces: `minLength`, `maxLength`, `minimum`, `maximum`,
  `minItems`, `maxItems`, `uniqueItems`, `pattern` (`:8`). A bound is left
  out when the description states the number, or when it is generous
  (at least 200 characters, at least 32 items), or when it is a minimum of
  1 (`:25-34`).
- The check does not test types, enums or required fields. Each tool checks
  its own, because "several accept a stringified object, a camelCase alias
  or a case variant on purpose" (`agents-schema.ts:99-102`).
- The refusal text: "`<tool>` was not run: `<problem>`; ... and N more. Fix
  these and call it again." It shows at most 4 problems (`:13`, `:110`).
- The schemas have no `oneOf`, `anyOf`, `allOf`, `const`, `format` or
  `$ref`. "several agent CLIs flatten or drop JSON-Schema composition when
  converting MCP tools, and a model that never saw the branches guesses
  shapes" (`agents-catalog.ts:31-32`). "$ref/$defs do not survive provider
  conversions" (`:64`). A test refuses these keywords
  (`agents-catalog-wire.test.ts`).
- A free object keeps `additionalProperties: true`, because "Moonshot reads
  a bare `{\"type\":\"object\"}` as endless recursion"
  (`agents-schema.ts:6-7`).

#### 3.3.2 Merged tools and old names

- Some tools do several things. Each call has a member name, for example
  `trigger` with `action: "create"` is the member `create_trigger`
  (`packages/phone-protocol/src/agents-tool-names.ts:20-32`).
- Old names still work as calls, but are not listed: `list_triggers`,
  `list_trigger_events`, `create_trigger`, `manage_trigger`,
  `create_room`, `session_read`, `update_widget`, `update_html`,
  `x_user_posts`, `x_post`, `x_profile` (`:45-67`). The reason: "an engine
  session that saw it, a saved skill or memory, or an external runtime may
  use one" (`:34-35`).
- An old name works only where its target tool is listed: "never a way to
  a tool this turn was not given" (`agents-mcp.ts:53`).
- Security rule: "an engine may remember \"always allow\" by a tool's
  name, so a tool never does anything more destructive than each of its
  members did alone: deleting a trigger is a tool of its own"
  (`agents-tool-names.ts:3-5`).

#### 3.3.3 The size of the list

From the golden files (group 2):

| Profile | Tools | Bytes of `tools/list` |
|---|---|---|
| default (a Chief) | 55 | 61,780 |
| not a Chief | 48 | |
| default in a room | 48 | |
| not a Chief, in a room (smallest) | 41 | 48,580 |
| fullest in the goldens | 68 | 74,796 |
| all tools of the catalog | 78 | not pinned |

- The page `docs/agents-tool-bridge.md:3-4` says "27 to 39 tools, 43 to 57
  KB". That was true at v0.1.111. It is stale now.
- No golden profile turns meetings on, so the 5 meeting tools and
  `reset_cloud_computer` are not pinned by bytes.

### 3.4 How each engine gets the tools

| Engine | How the server is attached | Name the model sees |
|---|---|---|
| Claude Code | `--mcp-config` file, mode 0600, removed at the end of the turn, with `--strict-mcp-config` (`claude.ts:1007`, `:1102-1107`) | `mcp__agents__<tool>` |
| Codex | `-c mcp_servers.agents.*` overrides. The env is passed by name only (`env_vars`), so the token is not in the process list (`codex-mcp-mount.ts:26-33`). `tool_timeout_sec=960` (`codex.ts:488`). Approval mode `approve` (`codex.ts:487`) | `<tool>` (no prefix) |
| ACP engines | in `mcpServers` of `session/new`, `session/load` or `session/resume` (`acp/core.ts:897-899`, `:1137-1140`, `:1182`). Copilot gets a launcher file `--additional-mcp-config` | `agents__<tool>` |
| Pi | a 0600 file in `OMB_MCP_CONFIG`, read by an extension (`pi.ts:398-426`, `pi-mcp-servers.ts:26`) | `agents_<tool>` |
| Chat API driver | the harness is the MCP client and starts the proxy itself (`chat-mcp-tools.ts:555-556`) | `agents_<tool>` |

The prefixes are in `agents-bridge.ts:68-70`.

Points of each engine:

- **Claude.** Without `--strict-mcp-config`, "every turn gets this
  machine's MCP servers, connectors, skills, hooks and CLAUDE.md (one
  desktop: 407 tools, ~10k tokens)" (`claude.ts:1007`). `list_bots` is
  allowed before the turn, "or the CLI's own ListAgents look-alike shadows
  it" (`claude.ts:1034`).
- **Codex.** "Codex hands MCP children its shell environment, so mounted
  variables ... leave that shell" (`codex.ts:525`). The mounted names go in
  an exclude list of the shell, and shell snapshots are turned off
  (`codex.ts:526-535`). So the bearer does not reach the shell commands of
  the bot.
- **Codex timeout.** "Codex CLI otherwise ends an MCP tool call after the
  server's tool_timeout_sec, 60 by default in its config docs"
  (`agents-tool-limit.ts:1-3`). The value 960 s is "a lent computer's
  command of up to 900 seconds, plus the time its result takes to come
  back".
- **Warm processes.** Each driver keys its process or session on the list
  of servers, with the env and the bearer (`claude.ts:1142-1158`,
  `codex.ts:546-548`, `acp/core.ts:951-960`). That is why the bearer must
  be stable (section 3.2).

#### 3.4.1 The URL form (opt-in)

With `OMB_OWN_MCP_HTTP=1`, an engine reaches the server by HTTP, not by a
child process. The reason: "every engine process otherwise starts one Node
helper per server, about 7 threads each, all counted against a container's
pids limit" (`server/drivers/own-mcp-http.ts:1-8`).

1. `ownMcpOverHttp(server)` changes a stdio server to a URL only when the
   harness address is `http://127.0.0.1:<port>` and the args name the real
   proxy (`turn-mcp.ts:91-108`).
2. The URL is `<harness>/api/internal/mcp-http/agents`. The headers are
   `authorization: Bearer <token>` and `x-omb-agents-env`: base64url JSON
   of the profile settings (`turn-mcp.ts:96-101`). Only the names in
   `AGENTS_MCP_ENV` can travel (`agents-mcp-env.ts:5-10`). The token and
   the harness address are not in that list.
3. The route (`server/routes/own-mcp-http.ts`):
   - It is matched before the gate of `/api/internal/` (`index.ts:12566`).
   - It needs a `Bearer` header, else 401. It does not check the token
     itself (`:61-62`). It builds a new `agentsMcp(env)` for each request.
   - Only POST (else 405). No event stream to open and no session id.
   - At most 16 requests in flight for one server and one token
     (`MAX_PENDING`, `:18`). The 17th fails at once: "Too many pending
     <kind> requests."
   - A `tools/call` with `Accept: text/event-stream` gets an event stream
     with a keep-alive line every 15 s (`:20`, `:37-41`).
4. A `tools/list` needs no harness call, so it works with any token in the
   header. A `tools/call` goes to the harness gate, where the token is
   checked (section 3.5).
5. The setting is off by default for Claude, Codex and most ACP engines. It
   is always off in the bot box, "where their HTTP clients have not been
   checked" (`own-mcp-http.ts:17-20`).
6. A tool selection on the bot keeps stdio, because the selection needs a
   gate process (`turn-mcp.ts:54-60`).

### 3.5 `tools/call`: from the engine to a route

**In the proxy** (`agents-mcp.ts:47-70`, `agents-call.ts:216-969`):

1. The engine sends `tools/call { name, arguments }`.
2. With the bridge on, `find_tool` and `use_tool` are handled first
   (section 3.8).
3. The proxy resolves an old name and checks that the tool is in
   `available` (the profile, not only the listed tools). Else:
   - a direct call gets the JSON-RPC error `-32602` "Unknown tool: NAME".
   - a call through `use_tool` gets a tool result with `isError` and the
     same words. The reason: "the chat runtime ends a turn on a protocol
     error" (`agents-mcp.ts:56`).
4. `callTool(name, args, context)`:
   1. resolve the old name again (`:217`).
   2. drop blank arguments (`dropBlankArguments`, `:218`). "Strict
      tool-calling engines send each optional field, as \"\" or null, when
      they mean to leave it out" (`agents-call.test.ts:116`).
   3. check the bounds of the full schema (`:219-220`). A refusal goes
      back before any HTTP call.
   4. find the handler: an `if` chain over the name. The last line is
      "Unknown tool: NAME" (`:968`).
5. The handler sends one HTTP request to the harness on loopback:
   `OMB_HARNESS_URL + /api/internal/<route>`, with
   `authorization: Bearer <OMB_COMMS_TOKEN>` (`agents-client.ts:42`).
   - It uses `node:http`, not `fetch`. "Node's fetch (undici 7.29 in
     Electron 43) fails a call after 300 s without response headers,
     whatever its signal allows" (`agents-client.ts:17-18`). So the call
     has no timeout of its own.
   - A status that is not 2xx throws `body.error ?? "HTTP <status>"`. There
     is no retry (`agents-client.ts:33-37`).
6. Before it answers, the proxy sends a timing receipt to
   `/api/internal/tool-timing` and waits for it up to 2 s
   (`agents-timing.ts:8`, `agents-mcp.ts:63`). "so the receipt is in the
   turn before the engine can end it ... A lost receipt costs only the
   timing, never the call" (`agents-timing.ts:1-3`).
7. The answer is `{ content: [{ type: "text", text }], isError? }`. A
   result of `shared_computer` with content parts goes back as it is
   (`passthrough`). A text result goes through the large-result step
   (section 3.10). A thrown error becomes a text result with `isError`.
   The proxy never sends `structuredContent`.
8. Calls of one turn are not in a queue. The proxy handles each line of
   stdin in its own promise (`agents-proxy.ts:29`), so answers can come
   back in another order.

**In the harness** (the gate of `/api/internal/`, `index.ts:12725-12785`):

1. Find the record of the token: a constant-time compare of the whole
   header with each live record (`authorizedInternalCapability`,
   `:1747-1759`). Else the late-results holder of an ended turn (section
   3.11). Else 401 `{ error: "unauthorized" }`. The bot must still exist.
2. An external runtime (a bot that runs outside the server, with a
   standing token) may call three routes only: `GET /api/internal/agents`,
   `GET /api/internal/assignment-status`, `POST
   /api/internal/coordinate-bots` (`:1617-1620`). Else 403.
3. Other refusals for some kinds of turn: read-and-draft turns, Bot API
   threads, guests (`:12737-12738`).
4. The kind of the record must match the route family. All agents tools are
   kind `agents`. Else 403 "this internal capability cannot access that
   service" (`:12739-12757`).
5. The query fields `self`, `fromBotId` and `botId` must equal the bot of
   the record. `fromThreadId` must equal its thread. Else 403 "the internal
   capability belongs to a different bot" or "... a different
   conversation" (`:12759-12769`). "The opaque bearer is the authority:
   refuse disagreeing sender ids, so a Full bot cannot reuse its token to
   impersonate a peer."
6. When the route reads a body, `readInternalBody` checks again that the
   turn is active. "Authorization at header time is not a lease: if the
   owning turn settled meanwhile, die before any side effect" (`:12772`).
   An ended turn gets 401 with this text: "This bot turn has already ended
   (it finished or was stopped), so this call was refused. Anything the call
   started before the turn ended may still have run."
   (`turn-dispatch-guard.ts:1-2`). Then `internalBodyRefusal` checks the
   body fields `fromBotId`, `botId`, `fromThreadId` and `threadId` in the
   same way (`host/internal-body-ids.ts:1-13`).
7. The route gets an abort signal tied to the turn
   (`turnCallSignals.signal`, `:12785`). "a revoked grant must reach a call
   already in flight, not only the next one"
   (`host/turn-call-signals.ts:3-4`).
8. The route takes the bot and the thread from the record, never from the
   call. Some routes check again before they commit
   (`canCommit: () => internalCapabilityIsActive(...)`, `:13120`,
   `:13144`, `:13166`).

**Identity in short.** The proxy knows `OMB_BOT_ID` and `OMB_THREAD_ID`. It
sends them as `fromBotId` and `fromThreadId` in many requests. These are
claims. The harness compares them with the record and refuses a claim that
does not agree. The proxy knows no turn id: "Which turn made it is the
harness's to know: a warm proxy serves many" (`agents-proxy.test.ts:1288`).

Arguments that the model sends with the names `fromBotId` or `fromThreadId`
are dropped by most handlers (`agents-proxy.test.ts:1467-1478`). Two
handlers put the model's arguments after their own ids:
`agents-image-tools.ts:10` and `agents-meeting-tools.ts:17`. A model value
can then win in the body. The image route and the meeting route take the
bot and the thread from their route context, not from the body
(`server/routes/image-tools.ts:136-190`, `server/meetings/routes.ts:65`),
so the claim has no effect there.

**Acting for another bot.** Only where a route allows it and checks the
authority: `for_bot_id` on the trigger tools goes to `triggerTarget`, which
needs the authority of the sender over that bot, "not just reach"
(`trigger-tools.ts:234-245`). A bot that is not a Chief still sees
`for_bot_id` on `trigger_info`, `trigger` and `delete_trigger`
(`agents-catalog-wire.test.ts:347-349`). Only the route refuses.

**Approvals.** `callTool` asks for no approval. The harness decides, and
the answer comes back as the state of a card (`completedProposalResult`,
`agents-call.ts:176-198`):

- applied: "No additional confirmation is needed."
- pending, or no state: "End this turn and wait ..."
- failed, cancelled or denied: an error, "Do not claim it was applied."

"Full Access is decided by the harness, never inferred from a model claim
or a local flag" (`agents-call.ts:176`).

**Answers that are not errors.** An engine ends a turn on a failed call.
So some refusals come back without `isError`:

- `instructionOnly`: a refusal that only says that nothing is left to do
  (`agents-result.ts:6-10`).
- `assignment_status` for an assignment that this turn sent: "An id this
  turn sent is an instruction to finish the turn, not a failed call that
  ends it" (`agents-call.ts:347-348`, since v0.1.179, commit `28fb7ce7f`).
- a trigger id that is not this bot's (`agents-call-triggers.ts:425-426`).

### 3.6 `list_bots`

`list_bots` is the first tool of our step 12, so this section has all of
it.

**The definition** (`agents-catalog.ts:201-206`,
`full.tools-list.json:226-238`):

```json
{
  "name": "list_bots",
  "description": "List every other bot (agent) you can contact, in every department, with its department, model and current status. Call this to discover exact teammate IDs before assigning work or asking advice with coordinate_bots.",
  "inputSchema": { "type": "object", "properties": {} },
  "annotations": { "readOnlyHint": true, "destructiveHint": false, "idempotentHint": true, "openWorldHint": false }
}
```

- The schema has no `additionalProperties: false` and no `required`, unlike
  most tools.
- The annotations come from an exact list of reviewed read-only tools
  (`server/agent-tool-policy.ts:3-26`): "Names, prefixes or third-party
  annotations alone must never grant read access" (`:1-2`). The list has 15
  names, for example `list_bots`, `assignment_status`, `tool_result_read`.
- It is in each profile, in the short list of the bridge, and always
  loaded on Claude.

**The flow:**

1. The engine calls `list_bots` with `{}`.
2. The proxy calls `GET /api/internal/agents?self=<OMB_BOT_ID>` with the
   bearer (`agents-call.ts:358-359`).
3. The gate checks the token, the kind `agents`, and that `self` is the bot
   of the record (section 3.5).
4. The route (`index.ts:13006-13024`) calls
   `personalReach.peers(store.bots, sender, threadId)`, which uses
   `reachablePeers` (`peer-roster.ts:147-154`):
   1. keep a bot that the sender can reach (`canReach`: not itself, not
      hidden, the same audience), or the extra rule of the personal helper
      bot (`host/personal-reach.ts:61-63`). A personal helper bot never
      sees the helper bots of other people (`:38-41`).
   2. sort: the sender's own department first, then the others by the
      lower-case department name.
5. For each bot, the route makes a row:
   `{ id, name, section, model, busy, status, statusText, title?, description? }`.
   - `section` is `""` for no department.
   - `model` is `bot.modelSelection.model`.
   - `status` comes from `peerStatus(activity, busy)`, and `statusText`
     from `peerStatusWords` (`peer-roster.ts:89-112`): "available",
     "working right now", "waiting on the user", "not responding",
     "unavailable — needs setup".
6. The route adds two more kinds of rows, with no audience filter
   (`index.ts:13023`):
   - bots of a linked server: `link-<peer>-<botId>`, status `linked` or
     `offline` (`bot-link/link.ts:769-772`).
   - remote teammates: `remote-<id>`, status `remote`, status text "on
     another server (<host>)" (`host/remote-teammate-handoff.ts:266-268`).
7. The proxy makes text (`agents-call.ts:360-372`):

```text
Bots you can reach (every department; you can contact any of them):
- <name>[ — <title>][ (<description, first 120 characters>)] [id: <id>, model: <model>[, department: <section or General>][, <statusText unless available>]]
...

Use coordinate_bots for concrete work or, with consult: true, for advice, then end your turn. Busy teammates queue and results resume you automatically.
```

   With no rows: "No other bots you can reach yet."
8. The chat shows the call as Team / "List bots"
   (`server/activity.ts:102`, `:224-231`).

**Edge cases:**

- The description is cut at 120 characters with no mark
  (`agents-call.ts:363`).
- A row with no `statusText` shows "busy" when `busy` is true.
- No field "paused" filters the list. Only `hidden` and the audience do
  (group 8 searched the store and the wire types).
- A large list goes through the large-result step. The end-to-end test
  makes 70 bots to test this (`server/tool-results.e2e.test.ts`).
- Other refusals name `list_bots`: "No bot with id or name \"<x>\" — call
  list_bots and copy the exact id from the result."
  (`peer-roster.ts:235`).
- "One reachability rule: a bot is never told about a peer that
  coordinate_bots would refuse" (`index.ts:8136`).

The system prompt also has a roster of at most 12 peers
(`PEER_ROSTER_MAX`, `peer-roster.ts:335`). `list_bots` has no such cap.

### 3.7 `check_delegation`: history

1. Before v0.1.108, `check_delegation { task_id }` and
   `wait_delegation { task_id, timeout_seconds }` read one hand-off through
   `GET /api/internal/delegations/<id>`.
2. The job runtime came. For one release, five old names were aliases with
   a line "Deprecated alias of assignment_status(id); works for this
   release." in their description and result.
3. Commit `41c89c416` (2026-10-13, in v0.1.108) removed `delegate_bot`,
   `ask_bot`, `send_to_bot`, `check_delegation` and `wait_delegation`:
   "coordinate_bots and assignment_status are the one surface. ... Every
   catalog profile is 3,175 B lighter (default 55057 → 51882 B, 38 → 33
   tools)." Commit `8cfd295c6` removed the host route.
4. Now: `assignment_status { id?, wait_ms? }`, `wait_ms` at most 240,000
   (`agents-catalog.ts:193-200`), calls `GET
   /api/internal/assignment-status` (`agents-call.ts:330-357`). The long
   wait is "Only for a standing external runtime ... Omit inside a turn"
   (`agents-catalog.ts:198`).
5. Seven tests check that the old names do not come back, for example
   `agents-catalog-wire.test.ts:234`, `comms.test.ts:1114`,
   `peer-roster.test.ts:298`. `check_delegation` is not an old name that
   still works (it is not in the alias table).

The other tools are part of other features. One line each:

| Tools | Feature | File |
|---|---|---|
| `coordinate_bots`, `assignment_status`, `list_room_targets`, `list_rooms`, `post_to_room`, `manage_room`, `retry_thread`, `create_bot`, team setup tools | bot-coordination | `agents-catalog.ts`, `agents-call.ts` |
| `memory_update`, `memory_log`, `session_search`, `propose_team_memory` | memory | `agents-catalog.ts`, `agents-call.ts` |
| `trigger_info`, `trigger`, `delete_trigger`, `wait_until`, `list_waits`, `cancel_wait`, `check_back`, `run_workflow`, `workflow_edit` | automations | `agents-call-triggers.ts`, `agents-wait-tools.ts`, `agents-check-back-tool.ts`, `agents-workflow-tool.ts` |
| `start_thread`, `list_threads`, `close_thread`, `rename_thread`, `post_to_thread`, `burst` | threads | `agents-catalog.ts`, `agents-list-threads-tool.ts`, `agents-thread-post-tool.ts`, `agents-thread-title-tool.ts`, `agents-burst-tool.ts` |
| `create_options_card`, `show_widget`, `show_html` | cards (part 48) | `agents-call-cards.ts`, `agents-widget-tools.ts`, `agents-app-tools.ts` |
| `request_credential`, `request_sign_in`, `fill_login` | security (part 11) | `agents-call.ts:601-658` |
| `mcp_server`, `app_settings` | part 20, part 61 | `routes/internal-mcp.ts`, `agents-app-settings-tool.ts` |
| `tool_result_read` | this feature | section 3.10 |
| the others (images, meetings, pages, hosting, research, voice, computers, usage, `what_changed`, `decide`, `extract`, `report_bug`, `message_person`) | parts 30 to 59 | their `agents-*-tool(s).ts` file |

### 3.8 The tool bridge: `find_tool` and `use_tool`

**When a turn gets the bridge** (`server/agents-bridge-switch.ts:290-312`):

1. The switch is global: `~/.openmausbot/config.json`
   `{ "features": { "agentsToolBridge": true } }`, or
   `OMB_AGENTS_TOOL_BRIDGE` as exactly `"1"` or `"0"`. Default: off
   (`:1-4`, `:28-38`).
2. A bot on a local model (an Ollama-style model id, or an
   OpenAI-compatible URL on this network) gets the bridge with the switch
   unset, since v0.1.139: "Our own tool list costs about 15,000 tokens on
   every turn, which a local model has to read out of a small window at
   laptop speed" (commit `4776d25b0`).
3. No bridge when Claude Code defers the tools by its own tool search
   (`:276-285`): that costs "fewer bytes than the bridge's own two tools
   and its prompt sentence".
4. No bridge when the bot has any tool selection, or one that cannot be
   read (`:301-304`). A selection judges a call by its name, and a bridged
   call has the name `use_tool`. This was a real hole: "before the mount
   unbridged the proxy, use_tool({ name: \"vm_exec\" }) passed this gate
   and ran." (`agents-bridge-gates.test.ts:173-174`).
5. By engine (`engineBridgeRefusal`, `:261-274`):
   - Claude: only when its settings files have no rule that can match a
     tool by name (`claudeRefusal`). "Claude Code matches a deny or ask
     rule's whole tool name as a glob, so such a rule can reach a tool by
     pattern when it is called directly and miss the same call made as
     `use_tool`" (`docs/agents-tool-bridge.md:124-127`).
   - the chat API drivers: yes.
   - Codex: no, "Codex reads its own layered configuration and hooks, which
     this version does not examine".
   - Pi: no, "Pi loads the person's own extensions, which can block a tool
     by its name".
   - all ACP engines: no, "this engine keeps its own tool permissions". An
     "Allow for this session" for `use_tool` "would cover every hidden
     tool", and Grok has its own tools with these names
     (`agents-tool-bridge.md:91`).
6. If the decision throws, the turn runs with no bridge and one log line
   names only the kind of error (`:287-289`).
7. `applyAgentsBridge` writes `"1"` or `"0"` into the env of the agents
   server, before the prompt is built (`index.ts:8233`, `:10020`). The
   value is always written: "an engine may hand its MCP children this
   server's environment, where OMB_AGENTS_TOOL_BRIDGE=1 is the operator
   switch" (`:24-25`). The prompt gets one sentence about the bridge
   (`system-prompt.ts:68-69`).

**The short list** (`server/drivers/agents-bridge.ts:148-182`):

1. 16 "hot" tools, in catalog order (`BRIDGE_HOT_TOOL_NAMES`, `:35-52`):
   `create_options_card`, `tool_result_read`, `list_room_targets`,
   `coordinate_bots`, `list_bots`, `list_rooms`, `select_computer`,
   `attach_file`, `post_to_room`, `post_to_thread`, `request_credential`,
   `request_sign_in`, `fill_login`, `message_person`, `send_voice_note`,
   `memory_update`, if the profile has them.
2. Each outbound tool (a tool that sends to the outside), "derived from the
   classifier, so a new outbound tool cannot be hidden by omission"
   (`:72-76`). The reason: the restart policy "reads a turn's tool names to
   know it already posted" (`agents-proxy.test.ts:2796`).
3. `find_tool`. Its description names the hidden tools, up to 1,200
   characters, then "... and N more." (`:60`).
4. `use_tool`.

**`find_tool { query }`:**

1. Trim the query. Empty or more than 1,000 characters: an error with the
   usage text `find_tool needs { "query": "what you want to do, in a few
   words" }, ...` (`:132`).
2. Resolve an old name. A name that is in the list: "`<name>` is in your
   tool list: call it directly." (`:189`).
3. Else rank the hidden tools of this profile only with BM25F (name weight
   2, text 1, schema 0.5, `K1` 1.2, `B` 0.75, plus an area term, a bonus of
   1,000 for an exact name and a lift for a "list" intent.
   `mcp-directory.ts:179-254`). "Security: only ever a tool of this turn's
   profile, whatever the ranker returns" (`agents-bridge.ts:194`).
4. Answer JSON text `{ matches: [{ name, description, inputSchema }], next }`
   with at most 3 matches and 20,000 characters. The first match is always
   whole. 20,000 is "Under the proxy's 24,000-character result cut, so no
   schema is cut in half" (`:55-57`).
5. No match: the list of names, not an error. It matches words, not
   meaning (`agents-tool-bridge.md:211-213`).

**`use_tool { name, arguments }`:**

1. Check the shape only: a name that is a string and not blank, arguments
   that are an object. Else an error with the usage text (`:133`).
2. An outbound tool: "`<name>` is in your tool list: call it directly, not
   through use_tool. Nothing was run." (`:215-217`).
3. Else the call goes back to the proxy as `{ name, arguments ?? {} }`, and
   takes the same path as a direct call: "Security: past the bridge a
   use_tool call is a direct call: same unknown-tool check, callTool and
   result bounds." (`agents-mcp.ts:49`).

**After the turn.** The activity rows, the digest and the restart evidence
show the real tool name, not `use_tool`, for threads that the switch marked
(`agents-bridge-names.ts:16-18`). At most 5,000 threads are marked
(`agents-bridge-switch.ts:337-361`).

**Why it stays off.** The bridge cuts the bytes of the list by 65.6% to
72.9% (from 48,580-74,796 B to 16,444-20,240 B, goldens), and the count
from 41-68 to 16-20 tools. But a live eval of 6 cases gave 6 of 6 correct
for both, $0.56 for the full list and $0.58 for the bridge
(`agents-tool-bridge.md:25-39`). "A hidden tool costs one more model call,
and `find_tool` brings up to three full schemas into the conversation. ...
the small-window case above is the reason to use it, not cost. ... Run the
eval again before changing this." (`:35-39`).

### 3.9 The limit of 128 tools

The chat driver part is in [`turn-limits.md`](turn-limits.md) section 3.7.
This section adds the parts of the server's own tools.

1. **The number.** `CHAT_TOOL_LIMIT = 128` (`shared/tool-budget.ts:2`):
   "OpenAI-compatible endpoints refuse more than 128." The provider error:
   "Invalid value for 'tools': maximum number of items is 128."
   (`tool-count-limit.ts:1-3`).
2. **What counts.** Each tool in one request: the engine's own tools, the
   agents tools, the person's MCP servers and the directory tools. On the
   chat driver, `ask_user` takes one place (`chat-mcp-tools.ts:117`).
3. **The agents server comes first.** `withToolShares` (`turn-mcp.ts:69-81`)
   and `layout` (`chat-mcp-tools.ts:681`) give the agents server its whole
   list first. The other servers share what is left. "The agents server
   keeps its whole list first; configured servers fit in what the built-ins
   leave." If the budget is smaller than the agents list, the agents server
   is cut too, and the other servers get 0 (`turn-mcp.test.ts:114-117`).
4. **How a server is cut.** `capToolList` keeps the first N tools of the
   server's own order and drops the cursor (`tool-count-limit.ts:21-33`).
   The agents proxy does this in `agents-mcp.ts:46`. "a server still
   answers a call to a tool it left out" (`tool-count-limit.ts:1-3`). With
   the bridge on and a tiny limit, `find_tool` and `use_tool` are last in
   the list, so they are cut first.
5. **The directory of the chat driver.** When the person's servers do not
   fit, the smallest are listed whole and the rest go behind
   `mcp_search_tools`, `mcp_describe_tool` and `mcp_call_tool`. The
   built-in servers never go behind the directory (`chat-mcp-tools.ts:519-537`,
   `:670-728`). The turn shows a notice.
6. **The directory of one server.** A person's server with more than 40
   tools or more than 100,000 characters of definitions is listed as
   `search_tools`, `describe_tool` and `call_tool` (`mcp-directory.ts:18-54`).
   "Once searched, always searched" for that connection
   (`mcp-remote-proxy.ts:161-162`). This is part 20, not this feature.
7. **ACP engines.** No limit until a provider refuses a turn. Then the
   driver learns the number from the error text and runs the turn again one
   time with each server cut to its share. The default count of the
   engine's own tools is 32, and 24 for OpenCode Go (`acp/core.ts:897-899`,
   `:1352-1356`, `acp/opencode-go.ts:708-709`).
8. **Learned limits** are in memory, at most 500, lost at a restart
   (`tool-count-limit.ts:82-96`).

Three different ways to make a list smaller. Do not mix them up:

| Way | For | When | Lists |
|---|---|---|---|
| The tool bridge | the agents server only | the switch, or a local model | the short list plus `find_tool` and `use_tool` |
| The MCP directory | the person's servers | more than 40 tools or 100,000 characters, or no room under 128 | `search_tools`, `describe_tool`, `call_tool` |
| Cut by prefix | each server under a limit | a limit is known | the first N tools |

### 3.10 Large results of the server's own tools

The server's own tools have one path for all engines. The other four paths
are for other tools (see the table at the end).

**A large result** (`agents-mcp.ts:65`, `agents-result.ts:16-31`):

1. The handler returns text. `tool_result_read` and `passthrough` results
   skip this step.
2. If the text has 24,000 UTF-16 units or fewer, it goes back as it is,
   with no I/O (`agents-result.ts:17`).
3. Else:
   1. redact secrets in the whole text (`redactSecretsInText`).
   2. take the first 16,000 units as the preview
      (`TOOL_RESULT_PREVIEW_CHARS`, `tool-results.ts:5`). The prefix never
      ends on half of a surrogate pair (`:13-17`).
   3. take at most 131,072 units to keep (`TOOL_RESULT_MAX_CHARS`, `:6`).
   4. save: `POST /api/internal/tool-result { text, truncated }` with a
      timeout of 3 s (`agents-call.ts:139-143`). An external runtime does
      not save: "External runtime results are not cached" (`:140`).
4. The harness checks the token and the turn, then saves the text in
   memory (`ToolResults.save`, `tool-results.ts:35-57`):
   1. it redacts again: "Redact before taking the prefix, including a
      secret crossing its edge." (`:37`).
   2. the owner is the bot and the thread of the record, not the turn.
   3. it expires in 1 hour, with no renewal on read.
   4. it evicts the oldest: at most 16 entries and 2 MiB for one owner,
      then at most 128 entries and 16 MiB in total.
5. The id is `r-<uuid>`. The proxy checks it with `/^r-[0-9a-f-]{36}$/`.
6. The model gets this text (`agents-result.ts:25-27`):

```text
<first 16,000 characters>

[Large tool result: showing the first <N> characters. The remaining redacted result is temporarily saved. If a missing detail is needed, call tool_result_read with id "<id>" and offset <N>. Saved results expire after one hour, on app restart, or under cache pressure. Do not repeat an action just to retrieve its output.]
```

   If the kept text is cut, the second sentence is "Only a bounded portion
   was retained; the remaining tail was omitted."
7. If the save fails (a timeout, an error, a bad id, an external runtime),
   the notice says: "The remaining output could not be saved. The original
   operation was not retried. Do not repeat an action just to retrieve its
   output." The call keeps its success or error state: "The operation
   already happened. Saving overflow must never retry it or turn a
   successful operation into a failed MCP call." (`agents-result.ts:14-15`).

**Read the rest** (`tool_result_read { id, offset }`,
`agents-call.ts:276-286`, `index.ts:12841-12849`):

1. The proxy checks the id and that the offset is a safe whole number of 0
   or more. Else: "Use the saved result id and a non-negative integer
   offset from its notice."
2. `GET /api/internal/tool-result?id=..&offset=..`, timeout 3 s.
3. The harness returns a page of at most 16,000 units. An offset on the low
   half of a surrogate pair steps back one. An unknown id, another bot or
   thread, or an offset past the end gives 404 "Saved result unavailable in
   this bot's conversation, expired, or offset out of range. Do not repeat
   an action to retrieve its output."
4. The proxy adds `[Read more with tool_result_read id "<id>" and offset
   <next>.]`, or `[End of retained result.]`.

A later turn of the same bot in the same thread can read a result. Another
bot in the same room thread cannot (`tool-results.test.ts:27-35`).

**Other paths, for other tools** (not part of this feature):

| Path | For | Limit | Where the full text goes |
|---|---|---|---|
| Claude Code hook | each tool of a Claude turn | 512 Ki characters | `<data>/tool-results/<thread>/<sha256>.txt`, 0600. Nothing reads it back |
| MCP gate | the person's servers behind a gate | 8,000 characters | `<data>/tool-results/<thread>/<ms>-<pid>-<n>-<tool>.json`. The model gets no path unless `OMB_GATE_SPILL_HINT=1`. "Never point at the spilled whole: reading it back costs more than not trimming." (`mcp-trim.ts:100`) |
| Chat driver | each MCP result | 50 KiB | `<working folder>/mcp-results/result-*.txt`, newest 20. The model gets the path |
| Pi | each MCP result | 50 KiB or 2,000 lines | none |

The files in `tool-results/` are deleted by the gate at its start (older
than a day), by a sweep on Cloud homes only with `OMB_TOOL_RESULTS_SWEEP`,
and when a conversation is deleted (`host/tool-results-sweep.ts`).

### 3.11 Turn end, late results and a restart

1. **Turn end.** The generation is revoked. Its records are deleted, the
   calls in flight get an abort, and the hooks tokens go to the late-results
   holder (`index.ts:1695-1704`). The bearer string stays for the thread:
   "Revokes earlier turns' records but keeps the thread's bearers, so its
   engine stays warm." (`:1706`).
2. **A late call.** A call with the old token gets 401 "unauthorized". A
   call that was let in before the end, with a body read after it, gets 401
   with the turn-ended text (section 3.5).
3. **Late tool results.** Only for Claude Code hooks, not for the agents
   tools. For 60 s after the end, a `PostToolUse` hook of that turn can
   still save the full output of each of its tool calls, once each
   (`host/late-tool-results.ts:4`, `:24-25`).
4. **A deleted thread** retires its bearers (`index.ts:1716-1720`).
5. **Backstop.** A record that nothing revoked ends after 30 days: "Only an
   orphan backstop: normal terminal paths revoke a capability
   synchronously." (`index.ts:1607-1608`).
6. **A restart.** All records are in memory, so all tokens are gone. A
   proxy that lives on gets 401. The proxy does not retry, so the call is a
   tool error. If the harness is down, the connection error is a tool error
   (`agents-client.ts:33-37`). The saved large results, the learned limits
   and the tool budgets are lost too.
7. **The proxy ends** when stdin closes, at once (`agents-proxy.ts:33`).
   Calls in flight are lost. The test keeps stdin open "until the answer is
   read: on Windows a pipe write in flight dies with the proxy"
   (`agents-catalog-wire.test.ts:144`).

### 3.12 The golden test of the catalog

1. `agents-catalog-wire.test.ts` starts the real proxy (`node` with the
   source file) for 31 profiles. It sends `{"jsonrpc":"2.0","id":1,"method":"tools/list"}`
   on stdin. The env has `OMB_HARNESS_URL=http://127.0.0.1:9` and no
   `OMB_*` value from the developer's shell.
2. It compares:
   - the `result` of the fullest profile with `full.tools-list.json`,
     after `JSON.parse`, "so a CRLF checkout cannot fail them" (`:167`).
   - for each profile, the names, the bytes and the sha256 with
     `profiles.json`.
   - the size of each profile with `BUDGET_BASELINE`, within 2% in both
     directions (`:89-121`). A shrink of more than 2% also fails, "so the
     saving cannot creep back" (`:469`).
   - the helper bot adds at most 2% (`MAUSBOT_ADDS`, `:81`).
3. It also checks:
   - two bots of the same role get the same bytes: "Providers cache a
     prompt from its start, tools first: one bot's id in a schema makes
     every other bot rewrite the whole list." (`:247-254`).
   - no `$ref`, `$defs`, `definitions`, `oneOf`, `anyOf` or `allOf`.
   - the old delegation names are absent (`:234-243`).
   - the old flags of each kind of turn change nothing (`:297-305`).
   - the bundle serves the same bytes as the source, and `availableTools`
     in the process equals the bytes on the wire, "so another front end
     mounts the same tools".
4. To update: run the test with `UPDATE_AGENTS_CATALOG_GOLDENS=1`, read the
   diff in git, and move `BUDGET_BASELINE` by hand (`:1-3`, `:182-188`,
   `CONTRIBUTING.md:279-283`).
5. `agents-bridge-wire.test.ts` does the same for the bridged list with
   `bridged.tools-list.json` and `bridged.profiles.json`.
6. `agents-claude-defer.test.ts` holds the bytes that Claude sees before
   the first tool search: for a default Chief 3,896 B whole and 1,331 B of
   deferred names, within 2%, and the whole part under 8,000 B (`:24-29`).

### 3.13 History, and the problems of the changelog

What each item of [`../changelog.md`](../changelog.md) section 5 was, from
the commits:

| Release | Changelog text | What it was | Commit |
|---|---|---|---|
| v0.1.76 | "scope broker socket by bot id, not threadId alone" | The socket of the Claude permission broker had a name from the thread id only. A child turn of a hand-off can have the same thread id as its parent. "on Windows, named pipes are exclusive and the collision surfaces as an outright bind failure, breaking the delegated tool-call channel itself". The name now hashes the bot and the thread (`claude.ts:414-420`) | `d83f5b3b3` |
| v0.1.96 | (bearer per thread) | A new bearer each turn changed the MCP config, so Claude and ACP started again each turn | `e086adf6b` |
| v0.1.101 | "API-engine bots failed past 128 tools" | A person's MCP server with 425 tools (1.2 MB). The chat driver was refused at 128, Pi took all 425, and Codex loaded them all. The fix is the MCP directory for a large server. Not the agents tools | `9413b5147` |
| v0.1.101 | the tool connection of an engine (reversal) | Codex and each ACP engine had used their own MCP client for URL servers. A strict server refused a field that the engine added ("Unrecognized field 'schemaValidation'"). Now all engines except Claude Code reach URL servers through the server's own stdio proxy | `ddab4356b` |
| v0.1.108 | (five old tools removed) | Section 3.7 | `41c89c416` |
| v0.1.111 | "cuts the tool list ... by 65-74%" | The tool bridge. A cut in bytes of the agents list, not in count. Off by default | merge `e4dd55c19` |
| v0.1.120 | "41 of its 49 tools were being skipped" | The GitHub MCP server put a keyword `x-mcp-header` in its schemas. The strict schema check of the chat driver refused it, and the driver skipped the whole server. Not the agents tools | `76b0a368b` |
| v0.1.141 | one tool list for each role, "$0.228 → $0.065" | The schema of `start_thread` named the bot's own id. "tools come first in a request, so no two bots shared a cached prefix and each new bot wrote its whole first request again." The id left the schema | `81ad92cf3` |

Other changes of the list: compact schemas and 12 merged tools (`a96950e01`,
v0.1.132), the bridge for local models (`4776d25b0`, v0.1.139), more
deferred tools on Claude (`b945b7b98`), the real limit of each provider
(`f6af8a06e`, v0.1.145).

**v0.1.179 and v0.1.180.** v0.1.179 has no tag and no release page.
`eee23ebbe` is the merge of its release branch. v0.1.180 is 3 commits later
(thread tabs, Ctrl+Tab, the version), and none of the 3 touches this
feature. The items of the v0.1.180 note that touch this feature are all in
`eee23ebbe`:

1. The workflow switch: `OMB_SKILL_BURGER` lists or hides `run_workflow`
   and `workflow_edit` (`agents-catalog-profile.ts:10`, `:50`,
   `agents-catalog.ts:865`). The goldens changed with it.
2. Length limits stated in the words of deferred tools.
3. "a refused tool call names what was wrong": the chat driver says
   `Tool arguments do not match the advertised input schema: <tool>:
   <problems>.` (commit `3f15b33c4`).
4. `assignment_status` for a hand-off of the same turn is not an error
   (commit `28fb7ce7f`, section 3.5).

## 4. The data

**Env of the agents server** (`agents-turn.ts:36-60`,
`agents-proxy.ts:2-9`):

| Name | Meaning |
|---|---|
| `OMB_HARNESS_URL` | the harness on loopback, default `http://127.0.0.1:8799` |
| `OMB_BOT_ID`, `OMB_THREAD_ID` | claims, for the list and for request fields |
| `OMB_COMMS_TOKEN` | the bearer: "shared secret for the localhost-only internal endpoints" |
| `OMB_EXTERNAL_RUNTIME` | `"1"`: a standing process, large results are cut, not saved |
| `OMB_CHIEF_OF_STAFF`, helper bot flag | the role |
| 15 feature flags | section 3.3 |
| `OMB_TOOLS_OFF` | comma list of `meetings`, `data`, `pages`, `images`, `email`. Unknown names are ignored "so an older proxy never fails a turn" (`tool-groups.ts:29-33`) |
| `OMB_AGENTS_TOOL_BRIDGE` | `"1"` or `"0"`, always written |
| `OMB_AGENTS_DEFER_TOOLS` | `"1"` on Claude with tool search |
| `OMB_TOOL_LIMIT` | the share of a limit, 1 to 5 digits |

**`CatalogProfile`** (`agents-catalog-profile.ts:7-44`): `skillAuthoring`,
`skillBurger?`, `sharedComputers`, `voiceNotes`, `xResearch?`, `research?`,
`cloudHome`, `memoryEnabled?`, `chief`, `botId`, `team?`, the helper bot
flag, `computerSelection?`, `localVm?`, `room?`, `imageGeneration?`,
`meetings?`, `appHosting?`, `toolsOff?`. "Presentation only: the server
still authenticates and scopes every call" (`:5-6`). The `botId` is "Only
for Watcher's own tool. Never written into a schema: a list that names its
bot can't share a prompt cache with other bots." (`:23`).

**A tool definition:** `{ name, description, inputSchema, annotations? }`.
`annotations` only for the 15 read-only tools. On Claude with defer:
`_meta: { "anthropic/alwaysLoad": false }`.

**`InternalCapability`** (`index.ts:1574-1602`): `botId`, `threadId`,
`generation`, `depth`, `kind` (`agents`, `connectors`, `computer`,
`browser`, `hooks`, `phone`, `data`, `email`, `device`, `lent`),
`skillAuthoring`, counters, `orphanExpiresAt`, `roomHandoffId?`,
`turnStartedAt?`, `delegatedThisTurn?`, `externalRuntime?`,
`connectorsFor?`, and more. In memory: the map by token (`:1609`), the
active generation of each thread (`:1610`), the stable bearers of each
thread (`:1652`), the provider turn id to the generation (`:1612`).

**`AgentsTurn`** (`agents-turn.ts:24-32`): `{ generation, depth,
skillAuthoring, roomHandoffId?, deliversSavedFiles? }`. "What one turn may
do. Its bearer carries this to the harness, which checks it on every
call."

**`ToolCallContext`** (`agents-call.ts:37-45`): `{ botId, threadId,
externalRuntime, sharedComputers, client }`. No turn id. Made one time for
each proxy process.

**`ToolCallResult`** (`agents-call.ts:47-51`): `{ text, isError?,
passthrough? }`.

**Saved result** (`tool-results.ts:19-23`): `{ botId, threadId, text,
bytes, expiresAt, truncated }` in a `Map` by id. `save` returns `{ id,
length, truncated, expiresAt }`. `read` returns `{ id, text, offset,
nextOffset, length, truncated, expiresAt }`.

**`ToolBudget`** (`shared/tool-budget.ts:5-12`): `{ limit: number | null,
listed, servers: [{ name, tools, direct }] }`. The last chat turn of a bot,
in memory, at most 1,000 bots (`server/tool-budgets.ts`).

**Routes of the proxy** (all with the bearer): `GET /api/internal/agents`,
`GET /api/internal/assignment-status`, `POST /api/internal/coordinate-bots`,
`POST|GET /api/internal/tool-result`, `POST /api/internal/tool-timing`, and
about 45 more, one for each tool (`agents-call.ts`, dispatch table of
group 5).

**Golden files** (`server/drivers/agents-catalog-goldens/`):
`full.tools-list.json` (`{ tools: [...] }`, pretty-printed),
`profiles.json` and `bridged.profiles.json`
(`{ "<profile>": { bytes, sha256, tools: [names] } }`),
`bridged.tools-list.json`.

**Files on disk:** none for the agents tools. The Claude config file and
the Pi config file are 0600 temporary files, removed at the end of the turn.

## 5. The UI

The feature has little UI of its own.

1. **Activity rows.** A call shows with a group and a label, for example
   `mcp__agents__list_bots` as Team / "List bots" (`activity.ts:102`,
   `:224-231`). A test checks that each tool of the golden catalog has a
   label key whose English text equals the label (`activity.test.ts:64-82`).
   On a bridged turn the row shows the real tool, not `use_tool`.
2. **Tool budget line** in the Access section of the bot settings
   (`ToolBudgetLine.tsx`, `AccessSection.tsx:191`), for a chat API bot:
   - "Its last turn listed {listed} of the {limit} tools its AI takes at
     once."
   - "Found through tool search instead: {names}", when a server went
     behind the directory.
   - nothing when the limit is null or before the first turn. It fetches
     `GET /api/bots/<id>/tool-budget` when the bot is not busy.
3. **MCP server test** (`McpServersPanel.tsx:91-97`): a warning when one
   server has 64 tools or more ("crowds") or 128 or more ("exceeds").
4. **Turn notices** of the chat driver, for example "To fit the model's
   128-tool limit, the tools of "a" are reached through the tool search
   this turn." (`chat-mcp-tools.ts:332-356`).
5. **Cards.** A tool that asks for an approval makes a card in the chat.
   The tool tells the model to end the turn and wait (section 3.5).

## 6. The tests

| Test | What it guarantees |
|---|---|
| `agents-catalog-wire.test.ts` | the bytes of 31 profiles, the size budget within 2%, one list for each role, flat schemas, no old names, the bundle equals the source |
| `agents-bridge-wire.test.ts` | the same for the bridged list. The short list has 6 or more tools and less than half the count. The bytes are less than half. The bridge is on for exactly `"1"`. No schema compiler in the bundle |
| `agents-bridge.test.ts` | the 16 hot tools, outbound tools never hidden, 12 to 17 hot tools a turn, the role changes only the hidden set, a non-Chief is not told that Chief tools exist, 400 tools give names of 1,200 characters or fewer, ranking cases, `use_tool` passes arguments unchanged |
| `agents-bridge-gates.test.ts` | each mount with a tool selection starts the agents server with no bridge. The gate judges `use_tool` by the name inside it |
| `agents-bridge-switch.test.ts` | off by default, env over config, which engines can have it, Claude settings refusals (with a slow-pattern case that "took about a minute of the server's one thread"), the decision never throws |
| `agents-proxy.test.ts` (2,856 lines) | each tool's request path and body, local refusals before any HTTP, harness refusals passed on as errors, old names, large results, model ids in arguments dropped, the bridge |
| `agents-bridge.e2e.test.ts` | a bridged turn end to end in the real harness. A forged Chief flag still gets the server's refusal. A non-Chief `for_bot_id` is refused |
| `agents-schema.test.ts` | the short schema leaves out only enforced keywords. Each bound of each listed tool (more than 80 cases) is refused before any request |
| `agents-claude-defer.test.ts` | the defer marks, the loaded set, the bytes up front within 2% |
| `agents-aliases.test.ts` | an old name equals the direct call, does not reach further, and fails where its target is not listed |
| `agents-tool-groups.test.ts` | each tool is in one group exactly. Turning a group off removes exactly its tools |
| `agents-turn.test.ts` | the same bytes of `tools/list` on each kind of turn, with different bearers |
| `agents-result.test.ts`, `tool-results.test.ts` | the 24,000 threshold, redaction before the preview, paging over emoji, owner by bot and thread, expiry, eviction, a failed save is not retried |
| `tool-results.e2e.test.ts` | 70 bots make `list_bots` large. Paging gives back each name. No token: 401. Another thread: refused. After a stop, the old token: 401 |
| `agent-tool-policy.test.ts` | the exact read-only list. Prefixed or odd-case names are not read-only |
| `peer-roster.test.ts` | the reach rule, the order by department, name lookups and their refusals, roster caps of 12 |
| `comms.test.ts` | the internal routes are closed without a token. A hand-off turn has `list_bots` and none of the five old names |
| `tool-count-limit.test.ts`, `turn-mcp.test.ts` | the four provider error shapes, the shares (agents whole first), a budget of 5 gives agents 5 and the others 0 |
| `own-mcp-http.test.ts` | the URL form: off unless `"1"`, always off in the bot box, the token never in argv |

Gaps:

- No golden profile turns meetings on (section 3.3.3).
- The bound test has no profile with images, hosting or meetings, so those
  tools' bounds are not tested (`agents-schema.test.ts:13-16`).
- The cut by `OMB_TOOL_LIMIT` inside the gate has no test in
  `mcp-gate.test.ts`.
- The tests of the proxy use a stub harness that accepts any body with the
  right token. The real checks of identity are in the end-to-end tests and
  `comms.test.ts`.

## 7. Ours compared

| Point | Reference | Ours |
|---|---|---|
| Where | `server/drivers/agents-*.ts` (catalog, proxy, call, bridge, result), `server/agents-turn.ts`, the gate in `server/index.ts:12725-12785` | `bot-engine`, step 12. No module yet. Suggested: `bot-engine/src/tools/` with `catalog.rs`, `profile.rs`, `call.rs`, `result.rs`, and the MCP server in `bot-engine/src/mcp/` |
| Decision | none | D8: "The server exposes its own tools to engines as an MCP server" (`docs/decisions.md:165-166`) |
| Transport | a stdio proxy that calls the harness by loopback HTTP | D10 and D14: no HTTP server. The core runs in the desktop process (`docs/plan/README.md:359-360`). So the loopback route needs another transport |
| Identity of a call | a bearer that maps to a record in memory | nothing yet. D10: "A request is never trusted because of its network address alone" (`docs/decisions.md:236-237`) |
| Engines that are MCP clients | Claude, Codex, ACP, Pi, and the chat driver (the harness is the client) | only ACP (step 9). The chat driver has no MCP client: P33 (`docs/plan/chat-driver-tool-calls.md:26-39`) |
| The 128 limit | a constant, a learned limit, shares | P48 (a driver capability, step 12), P130 (the ACP retry, step 9) |
| Bridge | off by default | none |
| Large results | in memory, 1 hour, `tool_result_read` | none |
| Golden test | 31 profiles, bytes and sha256 | none |
| Our ids | | `BotId`, `ThreadId`, `TurnId` as strings (`crates/bot-protocol/src/ids.rs:6-21`). No tool type exists |

The step 12 of our plan says "An engine lists the bots through the tool".
Our first engine is the chat API driver. In the reference, that driver gets
the tools only because the harness is an MCP client for it
(`chat-mcp-tools.ts:555`). Our chat driver of step 5 is not an MCP client.
So step 12 can end only with the ACP driver of step 9, or after P33
option b.

## 8. Where we can be better

1. **One identity for a call, as a type.** The reference has the bot and
   the thread in two places. The claims are in the env of the proxy and in
   request fields. The truth is in the record. The gate compares them on
   each call (`index.ts:12759-12769`, `internal-body-ids.ts`). Some
   handlers put model arguments after their own ids
   (`agents-image-tools.ts:10`). Proposal: the tool handler gets a
   `CallContext` that only the runtime can make from a token. The handler
   has no other way to name a bot. Reason: a wrong state that the compiler
   refuses.
2. **A token type with a lookup by hash, not a scan.** The reference
   compares the header with each live record, one by one
   (`index.ts:1747-1759`). That is constant-time for each compare but
   linear in the number of turns. We keep a map from the SHA-256 of the
   token to the record, and compare the hash in constant time. Reason: less
   work for each call, the same safety.
3. **Check the token before `tools/list` on the URL form.** The HTTP route
   answers `tools/list` with any token (`own-mcp-http.ts:61-66`). The
   header `x-omb-agents-env` can then ask for the list of a Chief. Calls are
   still checked, so this shows names only. We check the token first and
   take the profile from the record, not from a header. Reason: a known gap
   of the reference that we do not copy.
4. **A capability flag for the bridge and the limit, not a driver name.**
   The reference decides the bridge by `driverKind` (`agents-bridge-switch.ts:261-274`),
   and the count of the engine's own tools by a number in each adapter
   (`acp/core.ts:899`). Our rule in `AGENTS.md` asks for capability flags.
   Reason: the rule of the project, and one place to change when an engine
   changes.
5. **A typed result enum, not text with flags.** The reference uses
   `{ text, isError? }` and some refusals without `isError` so that the
   engine does not end the turn (`agents-result.ts:6-10`). We have
   `ToolOutcome::{Done, Refused, Finish}` and one function that maps it to
   MCP. Reason: the meaning of each answer is in the type, not in a comment.
6. **No bridge in step 12.** The reference keeps it off because its eval
   showed no saving (`agents-tool-bridge.md:25-39`), and it needs many
   rules to be safe (section 3.8). We keep the list small by role and by
   tool groups. Reason: less code, and the same result in the reference's
   own eval.
7. **The golden test from the first tool.** The reference added byte
   budgets after the list grew to 57 KB. We add a test that pins the bytes
   of `tools/list` for each role, with a budget, in the pull request of the
   first tool. Reason: a known problem of the reference (the size of the
   list, 5 of 6 periods) that is cheap to stop early.
8. **Keep a large result in the process that runs the tool.** The
   reference keeps saved results in memory for 1 hour, and a restart loses
   them. The proxy needs a second HTTP call to save them. In our design the
   tool runs in the process of the runtime. So the handler can keep the
   large result directly, with the same limits: a preview of 16,000, 128 Ki
   kept, 1 hour, 16 entries and 2 MiB for each bot and thread. Reason: less
   code, and one less timeout.
9. **A timeout for each tool, not none.** The reference has no timeout on
   the call from the proxy to the harness (`agents-client.ts:17-18`), and
   gives Codex 960 s for each call. We give each tool a deadline in its
   definition, and a long tool (a computer command) says its own. Reason:
   a known problem of the reference ("a turn or a wait that does not end",
   6 of 6 periods).

**Problems of `changelog.md` section 5 that this feature has:**

| Problem | In the reference here | Our answer |
|---|---|---|
| The size of the tool list of one turn | 41 to 68 tools, 48 to 75 KB each turn. Answers: one list for each role, compact schemas, merged tools, Claude defer, tool groups, the bridge (off), byte budgets | points 6 and 7, P48 |
| A secret or an access right in the wrong place | Fixed: the bearer is the authority, ids that disagree are refused, the token is out of argv and out of the Codex shell. Open: `tools/list` on the URL form with any token. `for_bot_id` shown to a non-Chief. List rows of linked and remote bots skip the audience filter (`index.ts:13023`). Some keys by thread id only remain: the Copilot config path `sha256(threadId)` (`copilot.ts:255`), the ACP session pool (`acp/core.ts:957`) | points 1, 2 and 3 |
| "Busy" and races between bots | The broker socket by thread id only (v0.1.76), now bot and thread. `contracts.ts:127-128`: "threadIds may coincide across bots" | key each process resource by bot and thread from the start |
| One slow or stuck part blocks the others | Calls are not in a queue. The URL form allows 16 in flight and fails the 17th at once. No timeout on a harness call. A 2 s wait for the timing receipt on each call. The settings reader of the bridge opens only regular files of 1 MB or less, "so a FIFO (which would hold the server's one thread)" never is (`agents-bridge-switch.ts:122-135`) | point 9 |
| A turn or a wait that does not end | `assignment_status` can wait 240 s in a call. Codex waits up to 960 s | point 9 |
| State lost at a restart | All tokens, saved results, learned limits and tool budgets are in memory | accept for tokens and saved results (they end with the turn). Keep learned limits in the store |
| A feature added, then removed | Five delegation tools for one release (v0.1.108). The bridge, kept but off. The flags of each kind of turn, now ignored | one tool surface for hand-offs from the first version (step 14) |

## 9. Not verified

- How the hidden ids of a linked or remote bot in `list_bots` are filtered
  on a Team Cloud. The route adds them with no caller argument
  (`index.ts:13023`). `botLink.link.agents()` and `remoteHandoff.agents()`
  were read only at their row shapes.
- The rules of `redactSecretsInText` (`shared/redact.ts`). The mark
  `«redacted N chars»` is known only from a test.
- `bearerForGrants` (how the stable token is made and stored) was read only
  at its call (`index.ts:1664`).
- Whether `/api/internal/options-card` checks the Watcher bot id again. The
  proxy checks it (`agents-call-cards.ts:48`).
- The tool-name prefix that each ACP engine shows to its model. The
  reference sets only the server name `agents`. The table of section 3.4
  takes `agents__` from `agents-bridge.ts:68-70`.
- `claude.ts:1160-1310` (where the config file is written) was read only
  at the lines that a search found.
- The internals of `GET /api/internal/assignment-status`.
- Whether Muse Code uses the same learned limit as ACP.
- The 3 v0.1.180 items with no commit found by keyword: "Clearer refusals
  when a connected app has several accounts", "Search keeps one-character
  words", "OpenRouter memory-upkeep model". None seems to touch this
  feature.
- That `eee23ebbe` is the content of v0.1.179 comes from the title of the
  merge "release/v0.1.179". There is no tag.
- `BUDGET_BASELINE` (61,509 for the default) differs from the bytes in
  `profiles.json` (61,780). It is in the 2% band, so nobody moved it. No
  comment says why.
- The full diffs of `9413b5147` and `ddab4356b`. Only their messages and
  file lists were read.
- The tests `turn-call-signals.test.ts`, `mcp-remote-proxy.test.ts` and
  `connector-proxy.test.ts` were found by a search, not read.
