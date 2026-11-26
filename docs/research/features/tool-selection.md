# Tool selection for each bot

The research record of one feature of the reference project: the allow and
deny lists of a bot for native tools and MCP tools, the selector syntax, the
sub-names of the agent tools, the MCP gate, the "Tool selection" card of the
Access settings, and the table of engine support.

- Reference project: the local clone, commit `83d18e3af`.
- Group of `reference-features.md`: later. Crates that get the port:
  `bot-protocol`, `bot-engine`, `bot-core`, `bot-desktop`.
- Method: 10 readers in two workflows. Each reader read its files and wrote
  a report. The lead read some files in full and checked the key claims
  against the code (section 9 lists the checks).
- Release v0.1.181 (2026-11-25) has no change to tool selection. One line
  is about the tool connection of an engine: "Antigravity CLI: bots keep
  their team, browser and connected-apps tools from the first message."

## 1. In short

A bot of the reference project gets many tools in each turn: the tools of
its engine, the tools of the project, and the tools of MCP servers. **Tool
selection** lets the owner make this list smaller for one bot. The main
reason is a local model with a small context window. A second reason is to
keep a tool away from a bot.

The terms:

- **Native tool**: a tool that the engine itself has, for example `read` in
  Pi or `read_file` in Grok CLI.
- **MCP tool**: a tool that an MCP server gives. MCP (Model Context
  Protocol) is the JSON-RPC protocol between an engine and a tool server.
- **Selector**: one line that names tools. `native:read` names one native
  tool. `mcp:mail:read_notes` names one tool of the server `mail`.
  `native:*` and `mcp:mail:*` name all tools of that group.
- **Allow list** (`allow`): when it is present, the bot gets only the tools
  that it names. An empty allow list gives no tools.
- **Exclude list** (`deny` in the data, "Exclude" in the UI): the bot never
  gets a tool that it names. Exclude wins over allow.
- **Tool scope** (`toolScope`): the stored value `{allow?, deny?}` on the
  bot. No value means "all current tools".
- **Gate**: a small process between the engine and one MCP server. It
  removes excluded tools from each tool list and refuses a call to an
  excluded tool before the server sees it.
- **Agent tools**: the tools of the project itself, on the MCP server
  `agents`. Some of them do several actions.
- **Sub-name** (the code says "member"): the name of one action of an agent
  tool. For example, the tool `trigger` has the sub-names `create_trigger`
  and `manage_trigger`. A selector can name a sub-name.
- **Support level**: what an engine can apply. `native-and-mcp` engines
  apply all selectors. `mcp` engines apply only MCP selectors, so `native:*`
  must stay in the allow list.
- **Widen** and **narrow**: a change that gives a bot more tools widens.
  A change that removes tools narrows. The two have different save rules.
- **Bridge**: an option that lists a short set of agent tools and two
  extra tools, `find_tool` and `use_tool`, to reach the rest.
- **Directory mode**: a large MCP server is shown as three tools,
  `search_tools`, `describe_tool` and `call_tool`.

### What the earlier research files already cover

Do not read this file as a full repeat. These files already cover parts of
the feature:

- [`custom-mcp-servers.md`](custom-mcp-servers.md), section 3.6 and
  sections 4.2 and 5.3: the selector grammar, the limits, "deny wins", a bad
  scope allows nothing, the 409 at turn start, widen after the save and
  narrow at once, owner-only changes, the gate steps, the drop of servers
  in `turn-mcp.ts`, the support table, and a short note on the card.
  Proposals P237 (support as a capability) and P243 (only the person
  widens) come from it.
- [`approval-levels.md`](approval-levels.md): tool selection is not an
  approval level. `OMB_PERMISSION_TOOL_SCOPE` reaches the permission proxy.
- [`agent-tools.md`](agent-tools.md): the 128-tool limit, the bridge, the
  directory and their switches. It records that any tool selection turns
  the bridge off (`:821-822`) and the gate test of `use_tool` (`:1244`).
- [`connected-apps.md`](connected-apps.md): the per-tool grants of a
  connected app (`connectorTools`). This is a different allow list. It
  notes that only a wider `toolScope` waits for the save (`:1451`). Its
  open point "Whether the per-bot `toolScope` design ... shipped as
  written" (`:1586`) gets its answer here: mostly yes. The differences are
  the save during a turn (section 3.3), the sub-names (section 3.2) and
  the support table (section 3.6).
- [`turn-limits.md`](turn-limits.md): the limits of one turn. Tool
  selection has no limit of its own on the number of tools.

This file adds:

1. the sub-names and aliases of the agent tools, and how a call is judged
   by its action (section 3.2).
2. the phone batch rule, the mount test `canUseMcpServer` and the widen
   test `toolScopeWidens` in full (section 3.1).
3. how each engine applies the scope: Claude Code, Codex, the ACP core,
   Grok CLI, Pi and the chat driver (section 3.6).
4. the gate details: the call target, the directory mode and the remote
   proxy (section 3.7).
5. which checks read the live scope during a turn, and which use the copy
   from the turn start (section 3.8).
6. the effects of any scope, also one that allows all tools, on the
   prestart and Claude Code (section 3.5). The bridge part is already in
   `agent-tools.md:821-822`.
7. the create, duplicate, backup and team-file paths (section 3.4).
8. the card, its text and its states (section 5).
9. the documents of the reference and their differences from the code.

Border: the bot profile, the skills and the recovery are other features of
this batch. This file names them only.

## 2. Files read completely

Paths are in the reference project. "Ranges" means the reader read only the
listed lines of a large file.

| Group | Files read completely (lines) | Files read in ranges |
|---|---|---|
| Lead | `packages/phone-protocol/src/tool-scope.ts` (148), `packages/phone-protocol/src/agents-tool-names.ts` (99), `shared/tool-scope-support.ts` (24), `src/components/bot-settings/ToolSelectionCard.tsx` (100) | `server/store.ts` 1474-1502; `server/routes/bot-patch.ts` 356-365, 620-706; `server/index.ts` 2866-2876; `server/mcp-gate.ts` 305-325, 383-412; `server/drivers/claude.ts` 900-903, 970-980, 1052-1069; `server/drivers/codex.ts` 346-349, 439-445, 1212-1230; `server/drivers/pi.ts` 399-414, 834-849; `server/drivers/acp/grok.ts` 341-366, 563-610; `server/drivers/turn-mcp.ts` 50-84; `server/agents-bridge-switch.ts` 296-310; `server/engine-prestart.ts` 78-84; `src/lib/bot-duplicate.ts` 13-26; `server/request-auth.ts` 584-588; `server/headless/team-apply.ts` 221-231; `server/chat-apps-mcp.ts` 300-318; `server/team-backup.ts` 184-198 |
| scope-model | `packages/phone-protocol/src/tool-scope.ts` (148), `shared/tool-scope.ts` (1), `shared/tool-scope-support.ts` (24), `shared/tool-scope.test.ts` (122), `shared/new-bot-defaults.ts` (38), `src/lib/bot-duplicate.ts` (44), `src/lib/bot-duplicate.test.ts` (58), `packages/phone-protocol/src/agents-tool-names.ts` (99) | `packages/phone-protocol/src/wire.ts` (1000) 1-25, 240-410; `packages/phone-protocol/src/place-view.ts` (592) 1-35, 85-130, 180-250, 275-340; `shared/place-view.test.ts` (266) 1-30, 60-115; `src/state/store.tsx` 2490-2515 |
| mcp-gate | `server/mcp-gate.ts` (428), `server/mcp-gate.test.ts` (549), `server/mcp-gate-config.ts` (246), `server/mcp-gate-config.test.ts` (207), `server/provider-tool-allow.ts` (54), `server/provider-tool-allow.test.ts` (70), `server/mcp-grant-spec.ts` (100), `server/drivers/turn-mcp.ts` (131) | `server/tool-count-limit.ts` 1-60 |
| drivers-claude-codex | `server/drivers/tool-scope-coverage.test.ts` (18), `server/permission-proxy.ts` (263), `server/agents-bridge-switch.ts` (382) | `server/drivers/claude.ts` (1989) 1-60, 196-300, 336-606, 880-1180, 1205-1222, 1372-1392; `server/drivers/codex.ts` (1583) 1-20, 95-200, 330-600, 760-850, 1160-1305, 1340-1375; `server/drivers/claude.test.ts` 505-550, 2060-2095, 2340-2372; `server/drivers/codex.test.ts` 255-545, 1590-1625, 1915-1940 |
| drivers-acp | `server/drivers/acp/tool-scope.test.ts` (168), `server/drivers/acp/hermes-mcp-trust.test.ts` (100), `server/drivers/acp/capabilities.ts` (23) | `server/drivers/acp/core.ts` (1541) 1-480, 555-712, 845-1000, 1100-1215, 1335-1375, 1436-1460, 1490-1510; `server/drivers/acp/grok.ts` (656) 1-40, 250-370, 440-656; `acp.test.ts` 1340-1380, 1578-1650; `cline.test.ts` 95-130, 330-343; `copilot.test.ts` 40-55, 300-345; `grok-session.test.ts` 140-175 |
| drivers-pi-chat | `server/drivers/pi-mcp-extension.ts` (761), `server/drivers/pi-mcp-servers.ts` (49), `server/drivers/chat-mcp-tools.ts` (953), `scripts/verify-pi-tool-scope.ts` (118) | `server/drivers/pi.ts` (1000) 1-120, 288-294, 330-1000; `server/drivers/openai-chat.ts` (1000) 100-125, 520-900, 940-962; `pi.test.ts` 150-262, 390-420, 935-985; `pi-mcp-extension.test.ts` 1-64, 273-476, 565-602; `openai-chat.test.ts` 120-185; `chat-mcp-tools.test.ts` 135-200, 620-632, 895-960, 1025-1095 |
| store-routes | `server/routes/bot-patch.ts` (798), `server/routes/bots-create.ts` (316), `server/contracts.ts` (698), `server/team-backup.ts` (271), `server/headless/team-file.ts` (272), `server/tool-scope.e2e.test.ts` (190) | `server/store.ts` (2255) 1-20, 114-118, 150-200, 290-320, 625-700, 1255-1540, 2000-2030; `server/index.ts` (15253) 2855-2885, 5965-5985, 7490-7510, 7770-7840, 8270-8330, 9665-9680, 9800-9812, 10160-10185, 10400-10440; `bot-patch.test.ts` 1-80, 470-510; `store.test.ts` 1-140; `team-backup.test.ts` 75-105; `server/headless/team-apply.ts` (493) 1-130, 190-344, 400-493 |
| ui | `src/components/bot-settings/AccessSection.tsx` (920), `AccessSection.test.ts` (457), `ToolSelectionCard.tsx` (100), `scripts/testing/tool-selection-ui.e2e.test.ts` (151), `ToolGroupsCard.tsx` (50), `ToolBudgetLine.tsx` (33), `BotEditorContext.tsx` (11) | `src/locales/en.json` 6500-6507, 6957-6981, 7384-7418; `src/state/store.tsx` 225-400, 1114-1170, 1690-1730, 2065-2101, 2490-2540; `DESIGN.md` (445) 18-70, 95-135, 156-235, 280-300, 362-396, 419-445 |
| docs-verify | `docs/tool-selection.md` (133), `docs/verification/tool-selection.md` (201), `docs/superpowers/plans/2026-09-30-per-bot-tool-scoping.md` (172), `docs/superpowers/specs/2026-09-30-per-bot-tool-scoping-design.md` (300), `docs/agents-tool-bridge.md` (225), `scripts/verify-tool-scope.ts` (121), `scripts/verify-local-tool-selection.ts` (157) | `apps/docs/content/docs/getting-started/configuration.mdx` (99) 30-99; `docs/verification/engines.md` (197) 50-75, 176-197 |
| live-consumers | `server/chat-apps-mcp.ts` (463), `server/host/message-person-bots.ts` (67), `server/host/ask-cards.ts` (391), `server/host/mcp-chat.ts` (152), `server/host/mcp-servers-host.ts` (261), `server/bot-safety-digest.ts` (30) | `server/host/team-connections-host.ts` 255-330; `server/surface.ts` 120-175; `server/engine-prestart.ts` 55-110, 136-176; `server/request-auth.ts` 540-625; `server/admin-activity.ts` 215-245; `server/index.ts` 3995-4025, 5525-5545, 7470-7510, 7780-7845, 8295-8320, 9660-9682, 12716-12720, 12785-12800, 14060-14092 |
| gate-helpers | `server/drivers/agents-bridge.ts` (228), `src/lib/bot-duplicate.ts` (44) | `server/mcp-gate.ts` 40-70, 205-225, 260-428; `server/mcp-directory.ts` (565) 1-80, 505-565; `server/mcp-remote-proxy.ts` (381) 1-36, 88-120, 150-381; `server/routes/bots-create.ts` 96-316; `server/team-backup.ts` 160-210, 255-271; `server/headless/team-apply.ts` 52-60, 94-102, 185-245 |

The `enterprise/` directory was not opened.

## 3. How it works

### 3.1 Parse and match the selectors

The code is in `packages/phone-protocol/src/tool-scope.ts`.
`shared/tool-scope.ts:1` only exports it again. Section 3.6 of
`custom-mcp-servers.md` has the grammar. The new facts are below.

**Parse** (`parseToolScope`, `:45-63`):

1. `undefined` gives "no scope", which inherits every tool (`:44`, `:46`).
2. Each other value must be a plain object with only the keys `allow` and
   `deny`. Each key holds an array of at most 256 strings (`:48-57`).
3. The parser refuses getters, symbol keys, other prototypes and holes in
   an array (`:49-59`). The comment: "Array.from exposes holes as
   undefined instead of silently skipping them" (`:58`).
4. Each entry must be a valid selector (`:59`). All errors give one text:
   "Tool selection must contain only valid allow and deny lists." (`:47`).
5. The parser removes duplicates and keeps the first order (`:60`). It
   does not trim, sort or fold case.
6. `{}` and `{deny: []}` stay as they are. They are a present scope that
   allows every tool. Section 3.5 shows why this matters.

**Selector rules** (`selectorIdentity`, `:28-42`):

- A server name matches `^[a-z][a-z0-9_-]{0,31}$` (`:15`).
- A tool name is not blank, has at most 1,024 characters, no control
  character (`\x00-\x1f`, `\x7f`) and no `*` (`:18`, `:22-26`).
- The server ends at the first `:` after `mcp:`, so a tool name can
  contain `:` (`:34`; `shared/tool-scope.test.ts:43`, `:46`).
- The only wildcard is the whole name `*`. `native:read*` and `mcp:*:read`
  are invalid (`:32`, `:38`).

**Match** (`permits`, `:77-86`):

1. A tool with an invalid name, or an MCP tool with an invalid server
   name, is never allowed (`:78`).
2. The tool `mcp:phone:batch` is allowed only when `batch` and each of the
   seven phone step tools are allowed. The comment: "A phone batch runs
   the step tools, so a selection that refuses any of them refuses the
   batch" (`:79-82`).
3. A tool of the `agents` server is judged by its sub-names (section 3.2,
   `:83-85`).
4. Each other tool is allowed when `allow` is absent or one allow entry
   matches, and no deny entry matches (`:72-75`).
5. `allowsTool` parses the scope again on each call. A bad scope allows
   nothing (`:89-92`).

**Mount test** (`canUseMcpServer`, `:104-117`): the host uses it to drop a
whole server before the turn.

1. A bad scope or a bad server name gives false (`:106`).
2. With a list of tool names, the server is used when one of the names is
   allowed (`:107-109`).
3. Without names: `deny` with `mcp:<server>:*` gives false. No `allow`
   gives true. Otherwise one allow entry must name this server with `*` or
   with a tool that the deny list does not remove (`:110-116`).

**Native test** (`narrowsNativeTools`, `:95-101`): true when `allow` is
present without `native:*`, when `deny` has a `native:` selector, or when
the scope is bad. The drivers use it to find a scope that only a
`native-and-mcp` engine can apply.

**Widen test** (`toolScopeWidens`, `:120-148`):

1. A new scope that is bad never counts as a widening (`:123`). The route
   refuses it before this test (section 3.3).
2. The test collects each exact name of the old and the new scope, for
   each group (`native`, and each `mcp:<server>`) (`:124-133`).
3. It adds a made-up server (`unlisted`, `unlisted0`, ...) and a made-up
   tool for each group (`__unlisted_tool__`, ...) (`:134-140`).
4. It is a widening when the new scope allows one of these tools and the
   old scope does not (`:141-145`). A bad old scope allows nothing, so
   each valid new scope widens it.
5. The remove of a scope counts as a widening
   (`shared/tool-scope.test.ts:118`). `{allow: []}` to `{deny: [x]}`
   widens (`server/store.test.ts:83`).

### 3.2 The sub-names of the agent tools

The file is `packages/phone-protocol/src/agents-tool-names.ts`. The header
states the rule: "a selector or a saved skill naming a member means exactly
those calls", and "a tool never does anything more destructive than each of
its members did alone: deleting a trigger is a tool of its own" (`:1-5`).

The tools with sub-names (`AGENTS_ACTION_TOOLS`, `:20-32`):

| Tool | Sub-names | Which sub-name a call has |
|---|---|---|
| `trigger_info` | `list_triggers`, `list_trigger_events` | `action: "events"` gives `list_trigger_events` |
| `trigger` | `create_trigger`, `manage_trigger` | `action: "create"` gives `create_trigger` |
| `delete_trigger` | `manage_trigger` | always `manage_trigger` |
| `manage_room` | `manage_room`, `create_room` | `action: "create"` gives `create_room` |
| `session_search` | `session_search`, `session_read` | a `thread_id` or a `message_id` gives `session_read` |
| `show_widget` | `show_widget`, `update_widget` | a `widget_id` gives `update_widget` |
| `show_html` | `show_html`, `update_html` | an `app_id` gives `update_html` |
| `x_search` | `x_search`, `x_user_posts`, `x_post`, `x_profile` | the `action` field |

**Aliases** (`AGENTS_TOOL_ALIASES`, `:45-67`): a sub-name can also come as
a call name. The comment says that an engine session, a saved skill or an
outside runtime can use one (`:34-35`). The alias becomes a call of its
tool. For example, `manage_trigger` with `action: "delete"` becomes a call
of `delete_trigger` (`:49-58`). An update alias needs its id. When the id
is missing, the alias sends an empty id, "so the tool refuses rather than
creates" (`:42-43`, `:61-63`).

**How a call is judged** (`agentsCallIdentities`, `:89-99`):

1. With arguments (a call), the code finds the one sub-name of this call.
   The selector must allow that sub-name (`:93-94`, `:98`).
2. A tool whose own name is not one of its sub-names is also judged by its
   own name. `named` gives `[tool, member]` in that case (`:83-85`). So a
   selector that names the tool itself, for example `mcp:agents:trigger`,
   allows each action of `trigger_info`, `trigger` and `delete_trigger`.
3. The converse: `x_search`, `manage_room`, `session_search`, `show_widget`
   and `show_html` have their own name as a sub-name. For them `named`
   gives only the sub-name (`:83-85`). So `mcp:agents:x_search` allows the
   plain search only, not `x_post`. `mcp:agents:manage_room` does not allow
   `create_room`.
4. Without arguments (a tool list), the code makes one set for each
   possible sub-name. The tool is listed when any one of its sub-names is
   allowed (`:92`, `:98`).
5. The user document says the same: a tool is listed when one of its
   sub-actions is allowed, and each call is checked against what it does
   (`docs/tool-selection.md:94-95`).

The design spec and the plan of 2026-09-30 do not name sub-names. They came
later (`docs/tool-selection.md:80-89`).

### 3.3 Save a selection from the card

1. The person opens Settings, Access, "Tool selection", and changes the
   draft (`ToolSelectionCard.tsx:36`).
2. On each render, the card makes the proposed scope and parses it
   (`:28-31`).
   - "All current tools" gives no scope. The card sends `null`.
   - "Custom selection" always sends `deny` (it can be `[]`). It sends
     `allow` only when "Only allow listed tools" is ticked.
3. A parse error shows the raw parser text and disables Save (`:89`, `:93`).
4. An engine that cannot apply the scope shows a warning. The warning does
   not disable Save (`:32-35`, `:86-88`, `:93`). The end-to-end test saves
   such a scope on purpose (`scripts/testing/tool-selection-ui.e2e.test.ts:73-78`).
5. Save sends `PATCH /api/bots/<id>` with `{toolScope: <scope> | null}`
   directly. It does not use the queue of optimistic writes. The comment:
   "a rejected restriction must never appear saved in the optimistic
   queue" (`:13`, `:41`). A ref stops a second save while one runs (`:22`,
   `:38`).
6. The route (`server/routes/bot-patch.ts`):
   1. A paired device or a client session gets 403 for `toolScope`
      (`:121-135`; `server/tool-scope.e2e.test.ts:51-53`). A Team Cloud
      editor gets 403 too, because `toolScope` is not in
      `EDITOR_BOT_PATCH_FIELDS` (`server/request-auth.ts:585-587`). An
      editor can still change `mcpServers` and `toolsOff`.
   2. An absent key keeps the scope. `null` clears it. Each other value
      goes to `parseToolScope`, and a bad one gives 400 with its text
      (`:360-364`).
   3. A widening joins the list `loosened` (`:654`). For a loopback caller
      with no session, no `Origin` header and no packaged desktop, a
      loosening gives 409 while any bot is busy, and a warning in the log
      otherwise (`:655-663`). The code calls this a "Known gap" (`:625-626`)
      and says "A shell can forge an Origin header" (`:642`).
   4. After the slow steps of the request, the route reads the bot again.
      It checks the session again (401) and the widen rule again (409)
      (`:698-705`).
   5. The route calls `store.patchBot` and returns the wire bot.
7. The store (`server/store.ts:1474-1501`):
   - A **narrowing** goes into the bot in memory first, then to disk. The
     comment: "Revocations take effect in memory even when the disk write
     fails" (`:1484-1485`).
   - A **widening** is held back. The store writes a copy of the bots with
     the new scope. Only after that write does the bot in memory get the
     new scope. The comment: "New authority goes live only after its
     durable save succeeds" (`:1496-1499`).
   - Edge case: when the widening write fails, the other fields of the
     same patch are already changed in memory (`server/store.test.ts:93`).
8. The server sends the changed bot to each client. The reducers
   `botPatched` and `taskSwitched` copy `toolScope` explicitly, so a cleared
   scope does not stay in the window (`src/state/store.tsx:1147`,
   `:1155-1158`, `:1700-1705`).
9. On success the card drops its draft. On an error it shows the server
   text and keeps the draft for a retry (`ToolSelectionCard.tsx:42-44`).
10. Each change of `toolScope` goes into the admin activity log with the
    old and the new value (`server/admin-activity.ts:228`) and into the
    safety digest (`server/bot-safety-digest.ts:8`).

The route accepts a save while the bot works. The test
`server/routes/bot-patch.test.ts:482-493` shows a narrowing that is accepted
during a turn. The design spec said to refuse a save during a turn
(`docs/superpowers/specs/2026-09-30-per-bot-tool-scoping-design.md:127`).
The code does not.

### 3.4 Create, copy, import and team files

**New bot** (`POST /api/bots`):

1. The request can carry `settings.toolScope`, or the "New bot defaults"
   can give one (`shared/new-bot-defaults.ts:17`). The defaults schema
   accepts a scope only when it parses (`server/new-bot-defaults.ts:51`).
2. The route passes it to `store.createBot` (`server/routes/bots-create.ts:233-234`).
   The later settle patch removes the key (`:237`).
3. The store saves the bot before it shows or greets it. The end-to-end
   test makes the greeting fail. The create gives 500, but the scope is on
   disk and in the API (`server/tool-scope.e2e.test.ts:60-82`).
4. A team member cannot send `toolScope`: 403 "is an admin's to set"
   (`bots-create.ts:135-138`). A member also gets `useDefaults: false`, so
   a default scope does not reach the bot (`:139-140`).

**Copy of a bot** (`src/lib/bot-duplicate.ts`):

1. The header says why: a later PATCH that fails would leave the copy with
   no restriction (`:1`). So the scope goes in the create request (`:16-26`;
   `src/state/store.tsx:2497-2517`). The comment: "A copy of a restricted
   bot is restricted from its first moment." (`store.tsx:2501`).
2. A team User (not an admin) sends `{}` (`bot-duplicate.ts:13-17`). The
   server refuses `toolScope` from a member. So the copy of a restricted
   bot has no scope, which means all tools. The copy is wider than its
   source. A member can make a new bot with all tools in any case, so this
   is a surprise more than a new right (inference).

**Import of a team backup** (`server/team-backup.ts`):

1. `store.createBot` makes the bot with no scope (`:184-193`).
2. `store.patchBot` then sets `toolScope` and turns off other grants:
   `composio: false`, `computer: "off"`, `browser: false`,
   `autoApprove: false`, `connectorTools: {}` (`:196-198`).
3. No `await` is between the two calls, so no turn can start between them
   (inference). They are two disk writes.
4. An error deletes each new bot (`:261-269`).
5. The export has `toolScope` and `connectorTools`, but not `mcpServers`
   or `toolsOff` (`:114-128`).

**Team file** (`server/headless/team-file.ts`, `team-apply.ts`):

1. The file has `tools: {allow, deny}` (`team-file.ts:53`). `{}` and
   `{deny: []}` mean all tools and become `null`. `{allow: []}` is not all
   tools (`:102`, `:124-126`, `:217-222`).
2. Defaults merge one level deep. A bot's `tools` replaces the default
   `tools` (`:205`).
3. Apply checks the scope against the engine with
   `assertToolScopeSupported` before it writes (`team-apply.ts:202-215`).
4. Apply makes a new bot with `POST /api/bots` and no scope, then sends a
   second request, `PATCH`, with the scope (`:223-229`). Between the two
   requests the bot has all tools. If the PATCH fails, the bot stays with
   all tools, and nothing deletes it. This is the case that
   `bot-duplicate.ts:1` warns about.
5. Apply waits until an existing busy bot is idle before its PATCH (`:236`).

### 3.5 The start of a turn

1. `toolScopeForTurn` reads the bot and parses its scope
   (`server/index.ts:2868-2874`). A bad stored scope throws 409, code
   `tool_scope`: "This bot's tool selection is invalid. Open Access
   settings and save a valid selection before starting a turn."
   - A direct message gets 409, and no message is stored
     (`server/tool-scope.e2e.test.ts:113-119`).
   - A room gets a failure message. A goal run is marked failed
     (`:121-135`; `index.ts:10413-10433`).
   - No engine starts (`e2e:137`).
   - The store keeps a bad scope at load. It does not drop it
     (`e2e:107`; `server/store.test.ts:128-136`).
2. The turn gets a copy of the scope at its start: `index.ts:7500` and
   `:8309` for a direct turn, `:10165` and `:10180` for a room turn. The
   field is `SendTurnInput.toolScope` (`server/contracts.ts:137-138`).
   There is no live function for it, unlike `approvalModeNow`
   (`contracts.ts:134-136`, `index.ts:8308`).
3. The room session key has the scope (`index.ts:10169`). The resume check
   of a direct thread does not (`server/host/resume-check.ts:34-37`).
4. The driver checks the support level (`assertToolScopeSupported`,
   `shared/tool-scope-support.ts:11-24`). It is called at
   `server/drivers/claude.ts:902` and `server/drivers/codex.ts:348`. The
   ACP core has its own check (section 3.6).
   - An engine that is not in the table refuses any `allow` and any
     non-empty `deny` (`:17-18`).
   - An `mcp` engine refuses a scope that narrows native tools: "native
     tool selection is not supported by this engine. Keep native:* in the
     selection or choose a supported engine." (`:19-20`).
   - So `{allow: []}` fails on each `mcp` engine
     (`server/drivers/codex.test.ts:266`, `claude.test.ts:517`).
5. **Any present scope** changes three things, even `{}` or `{deny: []}`,
   which allow everything:
   - The agents bridge goes off. The comment: "selection gates match the
     name in the call, so any selection, even one that permits everything
     or cannot be read, means no bridge" (`server/agents-bridge-switch.ts:301-304`).
     Then all agent tools are listed in full: 27 to 39 tools and 43 to 57
     KB (`docs/agents-tool-bridge.md:3-4`, `:72-78`).
   - The engine is never started early (prestart)
     (`server/engine-prestart.ts:82`).
   - On Claude Code, the turn needs an isolated config and a CLI that has
     `--strict-mcp-config`. Otherwise it throws (`claude.ts:973-975`).
   - The card saves `{deny: []}` for "Custom selection" with the box not
     ticked and an empty Exclude list (`ToolSelectionCard.tsx:28-30`). The
     status line then says "Custom selection saved" (`:59`). The team file
     makes the same value `null` (`team-file.ts:124-126`). The card and
     the route do not.

### 3.6 How each engine applies the scope

The support table (`shared/tool-scope-support.ts:4-9`) has 31 entries:

- `native-and-mcp` (11): `grok`, `grokAgent`, `piAgent`, `openai-compat`,
  `mistral`, `minimax`, `cerebras`, `groq`, `greenference`, `modelgo`,
  `meta`.
- `mcp` (20): `claudeAgent`, `codex`, `geminiAgent`, `kimiAgent`,
  `droidAgent`, `cursorAgent`, `opencodeGo`, `qwenAgent`, `hermesAgent`,
  `clineAgent`, `copilotAgent`, `commandCodeAgent`, `kiroAgent`,
  `devinAgent`, `ompAgent`, `mistralVibeAgent`, `deepseekAgent`,
  `customAcp`, `antigravityAgent`, `museCode`.
- A test checks that the keys are the same as the built-in drivers
  (`server/drivers/tool-scope-coverage.test.ts:6`).

The table of the user document has fewer engines
(`docs/tool-selection.md:99-103`). It does not have OMP, Mistral Vibe,
Cline, Copilot and others.

**Claude Code** (`mcp`):

1. The driver checks the support level (`claude.ts:902`).
2. It throws unless the turn is isolated, does not use the person's own
   MCP config, and has a known CLI with `--strict-mcp-config`. The text:
   "Claude cannot confirm a restricted MCP configuration for this
   account. ..." (`:973-975`). An isolated turn adds `--strict-mcp-config`
   and `--setting-sources project`. The comment says that without them one
   desktop got "407 tools, ~10k tokens" (`:976-979`).
3. For each MCP server (all of them, when there is a scope), it removes a
   server that `canUseMcpServer` refuses, and puts each other server
   behind a gate with the scope (`:1054-1057`). `--allowedTools` keeps
   only the servers that remain (`:1059`).
4. The permission proxy `ogb` gets `OMB_PERMISSION_TOOL_SCOPE`
   (`:1067-1068`). It lists `ask_user` only when the scope allows
   `mcp:ogb:ask_user`, and it refuses a call to it: "this question tool is
   excluded by the bot's tool selection." (`server/permission-proxy.ts:13`,
   `:203`, `:208`).
5. The engine-level settings `tools` and `disallowedTools` of a Claude
   instance are a different feature. They become `--tools` and
   `--disallowedTools` (`claude.ts:958`, `:971-972`).
6. The scope is in the key of the warm process. A changed scope closes the
   warm process with "spawn contract changed" (`:1115`, `:1134`, `:1162`).

**Codex** (`mcp`):

1. The driver checks the support level (`codex.ts:348`).
2. With a scope it turns off shell snapshots (`:439`) and turns off each
   MCP server of the person's `config.toml` (`:443`).
3. Each server that `canUseMcpServer` allows goes behind a gate with
   `budget: 0` and the variable `OMB_GATE_CONFIG_<sha256>` (`:451-464`).
   These variables go into the shell exclusion list, so a shell command
   does not see them (`:129-150`, `:528-533`).
4. After `config/read`, the driver checks that no other enabled server
   exists. If one does: "Codex has an MCP server outside the selected
   configuration. ... No prompt was sent." (`:1214-1229`).
5. The scope matches the server name before a rename. A custom `notes`
   can be mounted as `notes_openmausbot` (`:497-505`).
6. The scope is in the spawn contract, so a changed scope starts a new
   process (`:546-547`).

**ACP core** (all ACP engines, `server/drivers/acp/core.ts`):

1. `sendTurn` parses the scope and throws on a bad one (`:862-864`).
2. A scope that narrows native tools needs the hook
   `toolScopeSessionParams`. Without it: "native tool selection is not
   supported by this engine" (`:865-867`). Only Grok has the hook
   (`grok.ts:563-570`). The capability object has no flag for this
   (`acp/capabilities.ts:4-22`).
3. The MCP servers come from `turn-mcp.ts`: it drops each server that
   `canUseMcpServer` refuses, and puts each other server behind a gate. No
   gate: "Tool selection requires an MCP gate." (`turn-mcp.ts:55-61`).
4. The scope is in the contract key, so a changed scope closes the pooled
   session (`core.ts:936`, `:959-967`).
5. The permission path of ACP has no scope check (`core.ts:564-700`). So
   the gate is the only MCP check on this path (inference).

**Grok CLI** (`native-and-mcp`, `server/drivers/acp/grok.ts`):

1. A scope that narrows native tools becomes an inline agent profile in
   `_meta.agentProfile` (`:563-570`).
2. The profile has `injectDefaultTools: false`, `discoverSkills: false`
   and a list of the allowed native tools from 25 known names (`:273-285`,
   `:341-366`).
3. Only version 1.0.41 is accepted (`:345-348`). MCP tools need
   `native:search_tool` and `native:use_tool` (`:349-351`).
4. Grok does not accept an empty list. For an empty selection the profile
   lists `read_file` and puts it in `disallowedTools` (`:362-364`).
5. The driver joins the scope with the person's own Grok profile. It
   refuses what it cannot read safely (`:287-339`).
6. Before the prompt, it asks `_x.ai/mcp/list` for up to 10 seconds. It
   refuses the turn when a server is outside the selection, when a listed
   tool is not allowed, or when a selected server is not ready. Each text
   ends with "No prompt was sent." (`:573-602`).
7. A model change under a native scope needs a new process (`:604-608`).

**Pi** (`native-and-mcp`):

1. Pi has no MCP client. The driver writes `mcp.json` (mode 0600) with the
   servers, the scope, a receipt path, the approval mode and the
   `askUser` flag (`pi.ts:401-413`). `ask_user` is there only when the
   scope allows `native:ask_user` (`:404`).
2. The extension `pi-mcp-extension.ts` applies the scope in three layers:
   1. Pi's active tool list (`getActiveTools` / `setActiveTools`), on each
      session and model event. It refuses to load when they are missing
      (`pi-mcp-extension.ts:585`, `:613-634`).
   2. A `tool_call` hook that blocks with "Tool selection excludes this
      tool" (`:597-600`).
   3. A `before_provider_request` filter of the request to the model, for
      the OpenAI, Anthropic and Google shapes. If it fails, it sends no
      tools (`:635-656`).
3. The extension does not register an excluded MCP tool (`:700`). Each
   call is checked again with its arguments (`:710-714`).
4. The extension writes a receipt `{ok: true, toolScope}`. The driver sends
   the prompt only when the receipt has the same scope. Otherwise: "Pi
   tool selection enforcement is unavailable. ..." (`pi.ts:836-848`). The
   receipt is in a temp folder that the Pi process can write. So it proves
   that the extension ran, not that a hostile Pi extension did nothing
   (inference).

**Chat driver** (`native-and-mcp`, `openai-chat.ts`, `chat-mcp-tools.ts`):

1. The driver is its own MCP client. It passes the scope to
   `mountChatTools` (`openai-chat.ts:610-615`).
2. It skips servers that fail the mount test (`chat-mcp-tools.ts:551`). It
   filters each tool list with `allowsTool` (`:777-779`), so an excluded
   tool uses no place in the list.
3. With a scope, the agents server is not bridged (`:554-555`), and servers
   at the same address are not merged (`:579-580`).
4. Each call goes through `validate`. It checks the arguments, the
   `use_tool` target and the `call_tool` target (`:809-841`, `:936-938`).
5. `ask_user` is listed only when it is allowed, and a call to it is
   checked again (`openai-chat.ts:618-622`, `:811-812`).
6. The limit of 128 tools counts after the filter (`shared/tool-budget.ts:2`;
   `chat-mcp-tools.ts:118`, `:678`).

### 3.7 The gate

Section 3.6 of `custom-mcp-servers.md` has the main steps. The new facts:

**A call** (`server/mcp-gate.ts:310-324`):

1. With a scope, a call with no id, a name that is not a string, or
   arguments that are not an object gets -32602 "Invalid tool call"
   (`:311-314`).
2. The gate finds the call target (`callTarget`, `:285-287`). In directory
   mode, `call_tool` has the target `args.name`, and `search_tools` and
   `describe_tool` have no target (`server/mcp-directory.ts:39-44`).
3. On the server `agents`, the target of `use_tool` is a second target
   (`bridgedCallTarget`, `server/drivers/agents-bridge.ts:79-82`).
4. Each target is judged with its own arguments. A target that was
   unwrapped from `call_tool` uses the inner arguments (`mcp-gate.ts:315-320`).
5. A target that is not allowed gives -32602 "Tool selection excludes this
   tool. Check the bot's Access settings." (`:321-322`). A call with no
   target passes (`:321`).
6. With a scope, the agents server always starts without the bridge
   (`server/mcp-gate-config.ts:211`). So the `use_tool` check is a second
   guard. No test covers it.

**A tool list** (`mcp-gate.ts:383-412`), in this order:

1. remove the tools that only an app can see.
2. check the catalog. A tool with no name gives -32603 "Invalid tool
   catalog on a restricted connection" (`:393-398`).
3. apply the scope, by name only. In directory mode the three directory
   tools stay (`:399-400`).
4. fit the schemas to the profile of the model (`:402-404`).
5. add the tool `query_result` when the result budget is more than zero.
   It stays under each scope (`:405-409`; `mcp-gate.test.ts:534-541`).
6. cut the list to `OMB_TOOL_LIMIT` (`:410-412`).

**The remote proxy** (`server/mcp-remote-proxy.ts`), in directory mode:

1. It reads the scope from `OMB_REMOTE_MCP_DIRECTORY` (`{name,
   toolScope}`). A bad value stops the process: "A selection that cannot
   be read must never widen to all tools" (`:91-104`).
2. It builds the catalog with the allowed tools only. It keeps the other
   names as "withheld" (`:262-270`).
3. `call_tool` of a withheld name gets "Tool selection excludes ...". A
   name that does not exist gets "No tool named ..."
   (`mcp-directory.ts:513-515`, `:548-550`, `:563-565`). So the bot can
   find out that a hidden tool exists. It does not see its schema.
4. The proxy checks by name with no arguments (`mcp-remote-proxy.ts:153`).
   The gate checks with the arguments. A scoped remote server in
   directory mode gets the scope in both, so it is checked by both
   (inference from `mcp-gate-config.ts:196-220`).

**Fail closed.** A bad scope stops the gate before the server starts
(`mcp-gate.ts:56-65`, `:212-213`). A scoped server that cannot have a gate
throws "Tool selection requires a supported MCP server."
(`mcp-gate-config.ts:205-206`). A duplicate request id, a bad frame or an
answer to an unknown id ends the gate (`mcp-gate.ts:333`, `:363-372`).

### 3.8 A change during a turn

The note of the card says: "Added access applies from its next turn;
removed access may stop sooner." (`src/locales/en.json:6500`). The user
document adds: "Stop its turns to remove access from tools it already
loaded." (`docs/tool-selection.md:12-14`).

These checks read the live bot in the store at each call. A narrowing
stops them at once:

1. the calls of an MCP app card. `tools/list` is filtered, and
   `tools/call` gets 403 "The bot's tool selection does not include that
   tool." (`server/chat-apps-mcp.ts:305-317`). The bot comes from the
   store on each request (`server/routes/chat-apps.ts:104`).
2. whether an app card can still reach its server
   (`chat-apps-mcp.ts:261-271`).
3. the `mcp_server` tool of a bot (`server/host/mcp-chat.ts:94`, `:114`).
4. the list of the computer choice tool (`server/index.ts:5973`).
5. the text of the refusal of `message_person`. This changes only words
   (`server/host/message-person-bots.ts:46`).

These use the copy from the turn start and do not change until the turn
ends:

1. the scope in the input of the engine, and so each gate of the turn
   (`index.ts:7500`, `:10165`). The gate gets the scope in its environment
   at its start.
2. the native profile of Grok, the extension config of Pi and the server
   list of the chat driver (section 3.6).
3. the MCP mounts of the turn and the cloud computer
   (`index.ts:7783-7785`, `:7812`, `:7834`, `:9670`, `:9809`).
4. the name of the ask tool in a delegated brief
   (`server/host/ask-cards.ts:60`).

So the engine-side checks and the gates keep the copy from the turn
start. Only the host checks in the first list read the live scope. One of
them, the `mcp_server` tool, is a tool that the engine loaded, and it stops
at once. A tool behind a gate does not stop until the turn ends. The next
turn gets the new scope, because the scope is part of the process key
of Claude Code, Codex and the ACP core (section 3.6).

### 3.9 Tool selection and approvals

- A selected tool still needs its approval. The scope does not approve
  (`scripts/verify-pi-tool-scope.ts:111`; the card says "Existing approvals
  still apply", `en.json:7387`).
- "Always allow" keys are separate (`server/provider-tool-allow.ts:37-47`,
  `server/mcp-grant-spec.ts`). `custom-mcp-servers.md` section 3.6 has
  them.
- The user document says that selection is not a sandbox: an allowed shell
  tool keeps all its power (`docs/tool-selection.md:131-132`).

### 3.10 Limits and edge cases

| Item | Value | Source |
|---|---|---|
| Selectors in one list | 256 (allow and deny each) | `tool-scope.ts:19`, `:57` |
| Characters in one selector | 1,024 | `tool-scope.ts:20`, `:29` |
| Server name | `^[a-z][a-z0-9_-]{0,31}$` | `tool-scope.ts:15` |
| Grok CLI version | 1.0.41 only | `grok.ts:345-348` |
| Grok MCP catalog wait | 10 s | `grok.ts:581` |
| Chat tool limit | 128, after the filter | `shared/tool-budget.ts:2` |
| Directory mode | past 40 tools or 100,000 characters | `mcp-directory.ts:18-21` |

Edge cases:

- `{allow: []}` gives no tools. The UI says "No tools selected".
- `{}` and `{deny: []}` allow all tools but count as a scope (section 3.5).
- A valid name that is not available selects nothing. It does not fall
  back to all tools (`docs/tool-selection.md:31-32`).
- An app-only MCP tool is judged by its server, not by its name
  (`chat-apps-mcp.ts:306`). A deny of that one tool does not block it.
- `mcpServersHost.prepare` gets the Vault keys of each enabled server of
  the bot, also of a server that the scope excludes
  (`server/host/mcp-servers-host.ts:207-212`).

## 4. The data

**The stored value** (`packages/phone-protocol/src/tool-scope.ts:4-7`):

```ts
type ToolScope = { allow?: string[]; deny?: string[] };
```

- On the bot: `WireBot.toolScope?`, with the doc text "Owner-selected
  original tool identities. An empty allowlist permits none."
  (`packages/phone-protocol/src/wire.ts:390-391`).
- Stored in `<data>/bots.json`, in the bot row, not in a thread
  (`server/store.ts:114-118`, `:646-649`). It goes to each client in the
  wire bot (`store.ts:174`).
- In the turn input: `SendTurnInput.toolScope?: ToolScope`
  (`server/contracts.ts:137-138`).
- In the new-bot defaults: `toolScope?: ToolScope | null`
  (`shared/new-bot-defaults.ts:17`).
- In a team file: `tools: {allow, deny}` (`server/headless/team-file.ts:53`).

**The checked tool** (`tool-scope.ts:9-11`):

```ts
type ToolIdentity =
  | { kind: "native"; name: string }
  | { kind: "mcp"; server: string; name: string };
```

**To the gate and the proxy:**

| Variable | Holds | Source |
|---|---|---|
| `OMB_GATE_TOOL_SCOPE` | the scope as JSON | `mcp-gate-config.ts:217` |
| `OMB_GATE_CONFIG_<sha256>` | the private gate record of Codex | `mcp-gate.ts:22-39`, `codex.ts:451-464` |
| `OMB_REMOTE_MCP_DIRECTORY` | `{name, toolScope}` | `mcp-remote-proxy.ts:92-104` |
| `OMB_PERMISSION_TOOL_SCOPE` | the scope, for `ask_user` | `claude.ts:1067` |
| Pi `mcp.json` | `{mcpServers, toolScope, scopeReadyPath, approvalMode, askUser}`, mode 0600 | `pi.ts:401-413` |

The gate removes each `OMB_GATE_*` key before it starts the server
(`mcp-gate.ts:225-226`).

**The support table** is a constant keyed by the driver kind
(`shared/tool-scope-support.ts:4-9`), not a capability flag.

**Related fields of the bot** that also limit tools, separate from
`toolScope` (`wire.ts:321-391`): `mcpServers`, `toolsOff`,
`connectorTools`, `connectorScopes`, `alwaysAllow`, `phoneApps`,
`xResearch`.

## 5. The UI

The Access section is a column of cards
(`src/components/bot-settings/AccessSection.tsx:673`). Tool selection is
the seventh card, after "MCP servers" and "Tools" (the tool groups)
(`:748-750`). It shows also for a draft bot. Its key is the bot id, so a
change of bot makes a new card (`:750`).

**The card** (`ToolSelectionCard.tsx`), top to bottom:

1. Title "Tool selection". Text "Advanced: narrow the tools offered to this
   bot. Existing approvals still apply." (`:55-56`; `en.json:7386-7387`).
2. The status line (`:57-60`):
   - a bad stored value, as an alert: "This bot's saved tool selection is
     damaged, so the bot can't start. Choose its tools again to fix it."
     (`en.json:7388`).
   - `allow: []`: "No tools selected".
   - no scope: "All current tools".
   - else: "Custom selection saved".
3. "Available tools", a `Select` with "All current tools" and "Custom
   selection" (`:61-68`). From "All" to "Custom" ticks the box by default
   (`:64`).
4. In custom mode (`:69-85`):
   - the box "Only allow listed tools".
   - "Allow (one per line)", 3 rows, monospace. It is off when the box is
     not ticked.
   - the hint "An empty Allow list selects no tools. Save to apply it."
     when the box is ticked and Allow is empty.
   - "Exclude (one per line)", 2 rows, placeholder `mcp:mail:send`.
   - the syntax line: "Use original names: native:NAME or mcp:SERVER:NAME.
     native:* and mcp:SERVER:* include all tools in that group. Exclude
     wins." (`en.json:7412`).
   - for Grok CLI only: the version note and the need for
     `native:search_tool` and `native:use_tool` (`en.json:7413`).
5. The Allow placeholder depends on the engine (`:50-52`): Pi
   `native:read`, `native:edit`, `native:write`. Grok
   `native:read_file`, `native:search_replace`, `native:write`. An `mcp`
   engine `native:*`, `mcp:mail:read_notes`.
6. Alerts: the engine warning (`en.json:7414-7415`, "This selection will
   stop before sending a prompt"), the parse error, the save error
   (`:86-90`).
7. When the bot works: "This bot is working. Added access applies from its
   next turn; removed access may stop sooner." (`:91`). The editor stays
   on.
8. The button "Save tool selection", "Saving tool selection…" during a
   save. It is off while a save runs, when there is no change, or when the
   parse fails (`:93-96`). The link "Examples and AI support" opens
   `docs/tool-selection.md` of the reference project on GitHub (`:97`).

**States:**

- Saving: the select and the fields are off.
- No loading state.
- No time limit on the save. A save that hangs keeps "Saving" until it
  ends (`:37-49`).
- The parse error text comes from the parser and is not translated
  (`:89`).

**Other places that show the scope:**

- An Exclude of `mcp:computer:*` changes the place picker. The Cloud tile
  says "What {bot} can use doesn't include a desktop."
  (`packages/phone-protocol/src/place-view.ts:127`, `:184`;
  `src/lib/place-view.ts:75`; `AccessSection.test.ts:262-271`).
- The tool count line of the MCP card: "Its last turn listed {listed} of
  the {limit} tools its AI takes at once." It is the only sign of the size
  of the list (`ToolBudgetLine.tsx:7-33`; `en.json:7384-7385`).

**DESIGN.md:** the card uses `Select`, as the rule asks (`DESIGN.md:291`).
The Save button has its own classes, not `.ui-button` (`DESIGN.md:290`,
`ToolSelectionCard.tsx:94`).

## 6. The tests

| Test | What it guarantees |
|---|---|
| `shared/tool-scope.test.ts` (122) | No scope and `{}` keep all tools. Deny wins. Exact, case-sensitive names, and a name with `:`. 27 bad values allow nothing and mount no server. Duplicates go, order stays, `allow: []` stays. The mount test. The phone batch. The widen test, also from a bad old value |
| `server/mcp-gate.test.ts` (549) | Each page of the list is filtered and `nextCursor` stays. An excluded call gets -32602 and the server never runs it. Deny wins over a wildcard. A bad scope stops the gate before the server starts. A bad catalog gives -32603. Directory mode. `query_result` stays. The `OMB_GATE_*` keys do not reach the server. No test of the `use_tool` target or of a duplicate id |
| `server/mcp-gate-config.test.ts` (207) | `allow: []` is valid. The scope reaches the gate and the directory proxy |
| `server/tool-scope.e2e.test.ts` (190) | Save, clear, 400 for bad values, 403 for a client session, 400 on the profile route. New-bot defaults. The scope is on disk before a failed greeting. A bad stored scope blocks a direct turn, a room and a goal, and starts no engine |
| `server/drivers/tool-scope-coverage.test.ts` (18) | Each built-in driver has a row. `{allow: "all"}` is invalid. Only `native-and-mcp` engines accept `{allow: []}` |
| `server/drivers/acp/tool-scope.test.ts` (168) | The Grok profile and its join with the person's profile. Refusals of what Grok cannot read. The gate and the token for an ACP server. Gemini refuses a native scope, also at Full access |
| `codex.test.ts`, `claude.test.ts` (ranges) | `{allow: []}` refused. Servers of `config.toml` turned off. A server outside the selection stops the turn. The rename of a server |
| `pi-mcp-extension.test.ts`, `chat-mcp-tools.test.ts`, `openai-chat.test.ts` (ranges) | The three layers of Pi, no tools on a failure. The filter before the 128 limit. An excluded call returns `{ok: false}` |
| `server/store.test.ts`, `bot-patch.test.ts` (ranges) | Widen after the save. Narrow at once. A narrowing during a turn is accepted |
| `src/components/bot-settings/AccessSection.test.ts` (457) | The status lines. The alert for a bad value. The engine warning. The note while busy |
| `scripts/testing/tool-selection-ui.e2e.test.ts` (151) | A full flow in the real window: save, a wildcard in a name refused, an empty Allow list saved with the engine warning, clear, a 409 shown and a retry, a late error not shown on another bot, a copy keeps the scope, the busy note |
| `scripts/verify-tool-scope.ts`, `verify-local-tool-selection.ts`, `verify-pi-tool-scope.ts` | Manual checks with the real Grok 1.0.41 and Pi CLIs and a local model. The readers did not run them |

The verification document lists the checks that were done: Pi 0.99.1 and
Grok 1.0.41, Codex 0.156.1 and 0.159.2, and a local model (Qwen3.5-2B,
8,192 context) on Pi and Grok. A drafting scope gave Pi 3 schemas
(2,297 bytes) and Grok 3 schemas (3,516 bytes), against 25 schemas
(44,415 bytes) for Grok with no scope
(`docs/verification/tool-selection.md:54`, `:71-80`, `:99-117`). The other
engines, a packaged desktop and real accounts were not checked (`:196-201`).

## 7. Ours compared

We have no part of this feature yet. `bot-protocol` has `event.rs`,
`ids.rs` and `message.rs`. `bot-engine` and `bot-core` have only `lib.rs`.

| The reference project | Ours (crate and module) | State |
|---|---|---|
| `packages/phone-protocol/src/tool-scope.ts` (parse, match, mount test, widen test) | `bot-protocol::tool_scope` | P234 puts "the tool scope parse and match" in a pull request of step 16 |
| `packages/phone-protocol/src/agents-tool-names.ts` (sub-names, aliases) | `bot-protocol::tool_scope`, with the names of our own tools of step 12 | no proposal yet |
| `shared/tool-scope-support.ts` (table keyed by driver kind) | a capability of the driver in `bot-engine` | P237 (open) |
| The bot row in `bots.json`, `server/store.ts:1474-1501` | the bot row in the store of `bot-core` (steps 6 and 8) | no step yet |
| `server/routes/bot-patch.ts` (owner only, the widen guard) | a Tauri command in `bot-desktop` that calls `bot-core`. We have no HTTP server (decision D10) | P243 (open) |
| `server/index.ts:2868-2874` (scope copy at turn start) | the turn setup in `bot-core`, which passes the scope to the driver | no step yet |
| `server/mcp-gate.ts`, `mcp-gate-config.ts`, `turn-mcp.ts` | `bot-engine::mcp::gate` (step 16) | P234 |
| The drivers: `claude.ts`, `codex.ts`, `acp/core.ts`, `acp/grok.ts`, `pi.ts`, `openai-chat.ts`, `chat-mcp-tools.ts` | each driver of `bot-engine` (steps 5, 9, 16) | no proposal yet |
| `ToolSelectionCard.tsx`, `AccessSection.tsx` | `bot-desktop/ui`, the Access settings of a bot | no step yet |

Our rules that already differ from the reference:

- **Capability flags, not names** (`AGENTS.md`). The reference keys the
  support by the driver kind (`shared/tool-scope-support.ts:4-9`) and the
  ACP core uses the presence of a hook (`acp/core.ts:865-867`). P237 covers
  this.
- **Typed refusals** (`AGENTS.md`). The drivers throw an untyped `Error`
  with a text (`tool-scope-support.ts:18`, `:20`; `claude.ts:973-975`;
  `codex.ts:1214-1229`; `grok.ts:573-602`).
- **One transaction for each state change** (`AGENTS.md`). The import and
  the team file make a bot first and set its scope after
  (`team-backup.ts:184-198`, `team-apply.ts:223-229`).

## 8. Where we can be better

1. **One type that cannot hold a scope with no effect.** A Rust enum with
   two values: all tools, or a restriction. The parse turns `{}` and
   `{deny: []}` into "all tools".
   - Reason: a wrong state that the compiler refuses. In the reference,
     `{deny: []}` allows everything but turns off the bridge and the
     prestart, and it needs the strict config on Claude Code
     (`agents-bridge-switch.ts:301-304`, `engine-prestart.ts:82`,
     `claude.ts:973-975`). The card can save it (`ToolSelectionCard.tsx:28-30`).
     The team file already does this (`team-file.ts:124-126`).
2. **Make the bot and its scope in one write on each path.** Create,
   import and team apply pass the scope to the create step.
   - Reason: our rule of one transaction. In the reference, team apply
     leaves a bot with all tools between two requests, and a failed PATCH
     leaves it so (`team-apply.ts:223-229`). The duplicate code already
     knows the risk (`bot-duplicate.ts:1`).
3. **Refuse at the save a scope that the engine cannot apply.** Keep the
   check at the turn start too, because the engine of a bot can change.
   - Reason: a stored scope that can never run is a wrong state. The
     reference saves it and fails each turn later
     (`ToolSelectionCard.tsx:86-93`; `tool-selection-ui.e2e.test.ts:73-78`).
4. **A narrowing reaches the running gate.** The gate is a process that
   the engine starts, so it asks `bot-core` for the current scope over a
   local socket at each `tools/call`. It fails closed when the socket is
   gone. The reference uses this pattern for approvals: the permission
   proxy asks the broker over a socket (`claude.ts:1063-1068`,
   `permission-proxy.ts:31-37`). The cost is one local round trip for
   each call (inference).
   - Reason: in the reference, a tool behind a gate does not stop until
     the turn ends (section 3.8), and the text "may stop sooner" does not
     say which tools stop. The reference already reads the live scope for
     app cards and the `mcp_server` tool (`chat-apps-mcp.ts:305-317`,
     `mcp-chat.ts:94`).
5. **If we build the bridge, keep it on under a scope.** Our plan has no
   bridge for now (P202). If a small local model brings it back, our gate
   judges `use_tool` by its target, as the reference gate already does
   (`mcp-gate.ts:315-320`).
   - Reason: "the size of the tool list of one turn". In the reference, a
     scope that removes one tool adds all agent tools in full, 27 to 39
     tools (`agents-bridge-switch.ts:301-304`;
     `docs/agents-tool-bridge.md:72-78`).
6. **One answer for a withheld tool and a missing tool** in the
   directory.
   - Reason: "an access right in the wrong place", a small one. The
     reference tells the bot that a hidden tool exists
     (`mcp-directory.ts:513-515`, `:548-550`). This conflicts with a
     useful message for the model, so the author decides.
7. **The copy of a bot by a team member** keeps the scope of its source
   (the core copies it), or the copy is refused.
   - Reason: a copy wider than its source is a surprise
     (`bot-duplicate.ts:13-17`, `bots-create.ts:135-140`).
8. **Typed refusals with one text each.** `ToolScopeInvalid`,
   `ToolScopeUnsupported { native: bool }`, `McpConfigNotConfirmed`. The
   UI translates them.
   - Reason: our rule. The reference shows the raw parser text in the card
     (`ToolSelectionCard.tsx:89`).

**Problems of `changelog.md` section 5 in this feature:**

| Problem | What the reference has here |
|---|---|
| The size of the tool list of one turn | Good: the scope filter runs before the schema fit and the count cap (`mcp-gate.ts:393-412`, `chat-mcp-tools.ts:777-779`). Bad: any scope turns off the bridge, so the agents part of the list gets larger (point 5). The card has no count. The selection limits selectors, not tools |
| A secret or an access right in the wrong place | A loopback caller with no `Origin` header can widen while all bots are idle (`bot-patch.ts:625-663`, P243). The team apply window and the member copy (points 2 and 7). Withheld names are visible (point 6). Vault keys of excluded servers are prepared (`mcp-servers-host.ts:207-212`). An app-only tool is judged by its server only (`chat-apps-mcp.ts:306`). Good: secrets go in a 0600 file or the environment, never in argv (`claude.ts:1073-1078`, `pi.ts:401-413`, `mcp-gate-config.ts:166`), and Codex hides the gate records from the shell (`codex.ts:528-533`) |
| The tool connection of an engine (section 6) | Six ways to apply one scope: a gate and a strict config (Claude Code), a gate and a check of `config/read` (Codex), a gate for ACP, an inline profile and `_x.ai/mcp/list` (Grok), a three-layer extension and a receipt (Pi), and an in-process filter (chat driver). Each engine that loads its own servers needs a special refusal. Our single connector of D12 makes the gate the one MCP path |
| One slow or stuck part blocks the others | Codex launch slots are shared by all bots (`codex.ts:418-432`). Grok waits up to 10 s, for one turn only. In directory mode, one catalog read of up to 120 s holds each call on that server (`mcp-remote-proxy.ts:157`, `:262-279`). Background probes of app servers run one at a time, up to 45 s each (`chat-apps-mcp.ts:28`, `:384-418`). A duplicate id ends the gate of one server. The card save has no time limit |

## 9. Not verified

- How `allowsTool` with no arguments in the proxy and with arguments in
  the gate can disagree for a sub-name selector
  (`mcp-remote-proxy.ts:153`, `mcp-gate.ts:321`).
- The native tools of Codex (`server/drivers/codex-tool-surface.ts`) and
  the unusable tools of Claude Code (`claude-unusable-tools.ts`). Both
  engines are `mcp` only, so a scope cannot change them.
- Whether `teamConnections.turnMcp` and `attachCustomMcp` drop the servers
  outside the scope before a driver does.
- Whether the host routes behind the agents, phone and data tools check
  the live scope at each call (`server/routes/internal-mcp.ts` was not
  read).
- Whether `roomSessions` starts a new engine session when only the scope
  changes.
- Whether a turn can start on a new bot in the team apply window.
- What a member's copy can reach with no scope (its default servers and
  approval level).
- The draft transport of `NewBotDialog` for the card's save.
- Whether the gate records of Codex, which are in one shared environment,
  can be read by another gate (`mcp-gate.ts:22`, inference).
- Whether an inherited Grok `name_override` can rename a tool to an
  allowed name (`grok.ts:354`).
- The manual verify scripts were not run.
- `docs/verification/engines.md` lines 1-49 and 76-175, and the
  screenshots of the verification document, were not read.

**Checks of the lead against the code** (each one holds):

1. The parse, the match, the phone batch, the agents rule, the mount test
   and the widen test: `tool-scope.ts:1-148`, read in full.
2. The support table and its two refusal texts: `tool-scope-support.ts:4-24`.
3. The sub-names and aliases: `agents-tool-names.ts:1-99`, read in full.
4. The gate call check and the list order: `mcp-gate.ts:310-324`, `:383-412`.
5. Widen after the save, narrow at once: `store.ts:1474-1501`.
6. The route: null clears, 400, the widen guard and its second check:
   `bot-patch.ts:358-364`, `:625-663`, `:698-705`.
7. The 409 at turn start: `index.ts:2868-2874`.
8. The card: what it sends, the warning that does not block:
   `ToolSelectionCard.tsx:1-100`, read in full.
9. Any scope turns off the bridge and the prestart:
   `agents-bridge-switch.ts:301-304`, `engine-prestart.ts:82`.
10. Claude Code, Codex, Pi, Grok and `turn-mcp`: the lines of section 2,
    row "Lead".
11. The member copy, the editor fields, the team apply window, the import
    order and the live check of app cards: `bot-duplicate.ts:13-26`,
    `request-auth.ts:584-588`, `team-apply.ts:221-231`,
    `team-backup.ts:184-198`, `chat-apps-mcp.ts:300-318`.
