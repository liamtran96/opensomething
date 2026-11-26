# Plan: Tool selection for each bot

The proposals from the research file
[`../research/features/tool-selection.md`](../research/features/tool-selection.md)
(batch 8, reference commit `83d18e3af`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 9, 12 and 16, and a new step after 16 for tool selection for
  each bot (P443).
- **State:** all open.
- **The main finding:** the reference stores one scope `{allow?, deny?}` on
  each bot and copies it into each turn at the start. Each gate and each
  engine gets this copy, so a narrowing does not stop a tool behind a gate
  until the turn ends. Only host checks read the live scope. Six engines
  apply the scope in six ways, and the support table is keyed by the driver
  kind (`server/index.ts:2868-2874`, `:7500`;
  `shared/tool-scope-support.ts:4-24`; `server/chat-apps-mcp.ts:305-317`).

## Proposals

- **P443 (plan, step 16 and a new step after 16, `bot-protocol`,
  `bot-core`, `bot-engine` and `bot-desktop`, amends P234). The place of the
  feature.** Keep "the tool scope parse and match"
  (`bot-protocol::tool_scope`) in step 16, as P234 says, because the gate of
  step 16 needs it. Add a new step after step 16, "Tool selection for each
  bot". Its pull requests:
  1. the stored scope in the bot row (`bot-core`), with the save rules for a
     widening and a narrowing;
  2. the copy at the turn start and the typed refusal of a bad scope
     (`bot-core`);
  3. the support capability on each driver and the check at the turn start
     (`bot-engine`);
  4. the native scope of the chat driver (`bot-engine`), after P33 (tools on
     the chat API);
  5. the "Tool selection" card in the Access settings (`bot-desktop`).

  Change P234: its tool-scope pull request has the parse, the match, the
  mount test and the widen test, and nothing more. In
  `docs/research/reference-features.md`, the tool selection rows (lines 140,
  240 and 313) list `bot-protocol`, `bot-engine` and `bot-desktop`. Add
  `bot-core` to them.
  - Why: follows the modules of the reference. The gate needs the MCP mounts
    of steps 12 and 16. The native scope needs the drivers of steps 5 and 9.
  - Source: `packages/phone-protocol/src/tool-scope.ts:45-148`;
    `server/store.ts:1474-1501`; `server/index.ts:2868-2874`;
    `shared/tool-scope-support.ts:4-24`;
    `src/components/bot-settings/ToolSelectionCard.tsx:1-100`.
- **P444 (decision, step 16, `bot-protocol`). The `ToolScope` type cannot
  hold a scope with no effect.** An enum: `All` or
  `Restricted { allow: Option<SelectorSet>, deny: SelectorSet }`. The parse
  turns `{}` and `{deny: []}` into `All`. A bad stored value stays on disk,
  and the turn start gives a typed refusal, as in the reference.
  - Why: Better than the reference. The compiler refuses the wrong state. In
    the reference, `{deny: []}` allows all tools. But it also turns off the
    agents bridge and the prestart, and Claude Code then needs the strict
    config. The card can save this value, and the status then says "Custom
    selection saved". The team file already maps it to "all tools".
  - Source: `packages/phone-protocol/src/tool-scope.ts:60-62`;
    `src/components/bot-settings/ToolSelectionCard.tsx:28-30`, `:59`;
    `server/agents-bridge-switch.ts:301-304`; `server/engine-prestart.ts:82`;
    `server/drivers/claude.ts:973-975`; `server/headless/team-file.ts:124-126`;
    `server/index.ts:2868-2874`.
- **P445 (decision, the new step after 16, `bot-core`, with P243). A bot and
  its scope are one write on each path.** Create, copy, the import of a
  backup and the apply of a team file give the scope to the create step. A
  copy keeps the scope of its source, also when a team member makes the
  copy. If it cannot, the copy is refused.
  - Why: Better than the reference, and our rule of one transaction for each
    state change ("an access right in the wrong place"). Team apply makes the
    bot with all tools, then sends the scope in a second request. When the
    second request fails, the bot keeps all tools, and nothing deletes it.
    The import also creates the bot first and patches the scope after. The
    copy of a member loses the scope. The reference's own comment names the
    risk: "a later patch that failed would leave it unrestricted".
  - Source: `server/headless/team-apply.ts:223-229`;
    `server/team-backup.ts:184-198`; `src/lib/bot-duplicate.ts:1`, `:13-17`;
    `server/routes/bots-create.ts:135-140`, `:233-234`.
- **P446 (decision, the new step after 16, `bot-core` and `bot-engine`, new
  facts for P237). The support capability has three values, and the save
  refuses what the engine cannot apply.** The values: none, MCP only, and
  native and MCP. When the bot's driver cannot apply a scope, the save of
  that scope gets a typed refusal. The turn start checks again, because the
  engine of a bot can change. A driver with MCP only refuses `{allow: []}`.
  - Why: Better than the reference. The reference saves such a scope, shows
    only a warning, and fails each later turn ("This selection will stop
    before sending a prompt"). New facts for P237: the table has 31 engines,
    and the user document lists fewer. The ACP core decides by the presence
    of a hook (`toolScopeSessionParams`), not by a flag.
  - Source: `shared/tool-scope-support.ts:4-24`;
    `src/components/bot-settings/ToolSelectionCard.tsx:32-35`, `:86-93`;
    `src/locales/en.json:7414-7415`;
    `scripts/testing/tool-selection-ui.e2e.test.ts:73-78`;
    `server/drivers/acp/core.ts:865-867`; `docs/tool-selection.md:99-103`.
- **P447 (decision, the new step after 16, `bot-core` and `bot-engine`). A
  narrowing reaches the running gate.** The gate is a process that the
  engine starts. At each `tools/call`, the gate asks `bot-core` for the
  current scope of the bot over a local socket. When the socket is gone, the
  gate refuses the call. This is the pattern of the permission proxy of the
  reference. A widening still waits for the next turn. The card text says
  exactly which tools stop at once.
  - Why: Better than the reference. In the reference, the engine gets a copy
    of the scope at the turn start, and each gate gets it in its
    environment. A tool behind a gate does not stop until the turn ends.
    Only host checks read the live scope: the calls of an app card, the
    `mcp_server` tool and the list of the computer choice tool. The text
    "removed access may stop sooner" does not say which tools stop. Cost:
    one local round trip for each call (inference).
  - Source: `server/index.ts:5973`, `:7500`, `:8309`, `:10165`;
    `server/contracts.ts:134-138`; `server/mcp-gate-config.ts:217`;
    `server/chat-apps-mcp.ts:305-317`; `server/host/mcp-chat.ts:94`;
    `src/locales/en.json:6500`; `docs/tool-selection.md:12-14`. The socket
    pattern: `server/drivers/claude.ts:1063-1068`,
    `server/permission-proxy.ts:31-37`.
- **P448 (plan, step 12, `bot-protocol`, with P194 to P203). Sub-names of
  our own tools, only if a tool takes an action argument.** If step 12 keeps
  one tool for each action, we need no sub-names. When one tool of our MCP
  server does several actions, each action has a sub-name. A selector can
  name a sub-name. The gate judges a call by the sub-name of its action. The
  tool list shows a tool when one of its sub-names is allowed. A delete is a
  tool of its own. The table goes in `bot-protocol::tool_scope`.
  - Why: follows the reference. Its rule: "a tool never does anything more
    destructive than each of its members did alone".
  - Source: `packages/phone-protocol/src/agents-tool-names.ts:1-5`, `:20-32`,
    `:45-67`, `:83-85`, `:89-99`;
    `packages/phone-protocol/src/tool-scope.ts:83-85`.
  - Note for the author: in the reference, when the own name of a tool is
    also one of its sub-names, a selector of that name allows only that
    action. `mcp:agents:x_search` does not allow `x_post`.
- **P449 (decision, later, `bot-engine`, new facts for P202). If we build
  the bridge, it stays on under a scope.** P202 keeps the bridge off for
  now. If a small local model brings it back, the gate judges a `use_tool`
  call by its target and the arguments of that target. Then the bridge does
  not need to go off under a scope.
  - Why: Better than the reference ("the size of the tool list of one
    turn"). In the reference, any scope turns off the bridge, so the list
    has all agent tools in full (27 to 39 tools, 43 to 57 KB). The gate of
    the reference already judges the `use_tool` target.
  - Source: `server/agents-bridge-switch.ts:301-304`;
    `server/mcp-gate.ts:315-320`; `server/mcp-gate-config.ts:211`;
    `docs/agents-tool-bridge.md:3-4`, `:72-78`.
- **P450 (plan, the new step after 16, `bot-desktop`). The card follows the
  reference.** The card has the same modes, fields, hints and states. The
  save waits for the acknowledgement and is not optimistic. A late error
  never shows on another bot. Each refusal has a translated text, not the
  raw text of the parser.
  - Why: follows the reference, with one change: the reference shows the
    raw text of the parser, and this text is not translated.
  - Source: `src/components/bot-settings/ToolSelectionCard.tsx:13`,
    `:37-49`, `:89`; `src/components/bot-settings/AccessSection.tsx:750`;
    `src/locales/en.json:7386-7418`.
- **P451 (plan, steps 9 and 16, `bot-engine`, new facts for P238). An
  engine that loads its own MCP servers refuses a scoped turn when it cannot
  prove that only our servers are on.** Under a scope, the driver turns off
  the own servers of the engine. Then it checks the result before it sends
  the prompt.
  - Why: follows the reference. Claude Code needs `--strict-mcp-config`.
    Codex turns off the servers of `config.toml` and checks `config/read`.
    One ACP engine (`server/drivers/acp/grok.ts`) checks `_x.ai/mcp/list`.
    Each refusal says "No prompt was sent".
  - Source: `server/drivers/claude.ts:973-979`;
    `server/drivers/codex.ts:443`, `:1214-1229`;
    `server/drivers/acp/grok.ts:573-602`.
- **P452 (choice, step 16, `bot-engine`). One answer for a withheld tool and
  a missing tool in the directory.** The author chooses between this answer
  and the message of the reference.
  - Why: Better than the reference: a small "access right in the wrong
    place". The reference tells the bot that a hidden tool exists. Against:
    the message of the reference helps the model to stop its tries.
  - Source: `server/mcp-directory.ts:351-353`, `:513-515`, `:548-550`,
    `:563-565`.
