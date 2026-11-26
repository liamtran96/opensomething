# Plan: The tools that the server gives to an engine

The proposals from the research file
[`../research/features/agent-tools.md`](../research/features/agent-tools.md)
(batch 6, reference commit `eee23ebbe`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 12, and D8.
- **State:** all open.
- **The main finding:** the tool list of a conversation stays the same byte
  for byte, so that the prompt cache of the provider holds, and the list is
  not a permission. The server checks each call against the record of the
  turn's token (`server/agents-turn.ts:1-4`; `server/index.ts:1573`,
  `:1800`).

## Proposals

- **P194 (decision). How a tool call proves its bot, thread and turn.** A
  turn gets an opaque token. The runtime maps it to a record in memory: the
  bot, the thread, the turn and its grants. The token stays the same for one
  bot, one thread and one set of grants, so a warm engine process can be
  used again; the record ends with its turn. A bot id or a thread id in a
  call is a claim only, and the runtime refuses a claim that does not agree.
  A call whose turn ended gets a typed refusal with no side effect. The
  decision also names the transport, because D10 has no HTTP server:
  in-process for the ACP driver, or a local socket or pipe for a separate
  proxy process.
  - Why: follows the reference. "Identity, source thread, depth and route
    family come from this server-side record; caller fields are assertions,
    never authority" (`server/index.ts:1573`). "Authorization at header time
    is not a lease" (`:12772`). Before v0.1.96 the token was new on each
    turn, and each turn started the engine again (commit `e086adf6b`).
  - Source: `server/index.ts:1649-1683`, `:12759-12769`;
    `server/host/internal-body-ids.ts:1-13`.
- **P195 (plan, step 12). Step 12 needs an engine that is an MCP client.**
  Add "Needs step 9 (the ACP driver), or P33 option b". The "done when"
  names the ACP driver with the fake ACP CLI.
  - Why: a fact. The chat driver of the reference gets these tools only
    because the server is an MCP client for it
    (`server/drivers/chat-mcp-tools.ts:555-556`), and our chat driver of
    step 5 is not one (P33).
- **P196 (decision, add to D8). One tool list for each role.** The list is a
  pure function of the role and the facts of the host and the conversation.
  No bot id and no turn fact goes into a tool name, a description or a
  schema. A turn that may not use a listed tool gets a refusal with a
  reason when it calls it.
  - Why: follows the reference. The bot id is "Never written into a schema"
    (`server/drivers/agents-catalog-profile.ts:23`). The fix of v0.1.141
    took it out of one schema: "$0.228 → $0.065" (commit `81ad92cf3`).
- **P197 (step 12). A byte golden test and a size budget in the first pull
  request.** The test runs `tools/list` for each role and compares the bytes
  with a file in git. It holds the size of each role within 2% of a number
  in the test. It refuses `oneOf`, `anyOf`, `allOf`, `const`, `format` and
  `$ref` in a schema. An environment variable writes the files again, and a
  person reads the diff.
  - Why: follows the reference, from the first tool. "Several agent CLIs
    flatten or drop JSON-Schema composition"
    (`server/drivers/agents-catalog.ts:31-32`). The size of the tool list is
    a problem in 5 of 6 periods of section 5 of the changelog.
  - Source: `server/drivers/agents-catalog-wire.test.ts:89-121`,
    `:160-188`, `:247-254`.
- **P198 (step 12). The definition and the text of `list_bots`.** No input,
  read-only. It lists the bots that this bot can reach: not itself, not
  hidden, the same audience, its own department first. One line for each
  bot: name, title, description (120 characters), id, model, department, and
  the state when it is not available. With no bot: "No other bots you can
  reach yet." The reach rule is the function that the hand-off tool uses
  later.
  - Why: follows the reference. "One reachability rule: a bot is never told
    about a peer that coordinate_bots would refuse" (`server/index.ts:8136`).
  - Source: `server/drivers/agents-catalog.ts:201-206`;
    `server/drivers/agents-call.ts:358-373`; `server/index.ts:13006-13024`;
    `server/peer-roster.ts:147-154`; `server/agent-tool-policy.ts:1-4`.
- **P199 (step 12, refines P48). Capability flags in place of driver names.**
  The count of the engine's own tools, and whether the engine reads tool
  names for its own rules, are capability flags too.
  - Why: `AGENTS.md` gates engine behaviour on capability flags. The
    reference decides the bridge by `driverKind`
    (`server/agents-bridge-switch.ts:261-274`) and the count of the engine's
    own tools by a number in each adapter (`server/drivers/acp/core.ts:899`).
- **P200 (step 12 or later). Large results and `tool_result_read`.** A
  result of more than 24,000 characters goes to the model as the first
  16,000 characters and a notice with an id. The full text, redacted, 128 KiB
  at most, stays for 1 hour for that bot and thread. `tool_result_read
  { id, offset }` reads pages of 16,000. A failed save never runs the action
  again and never makes the call fail.
  - Why: follows the reference. "The operation already happened"
    (`server/drivers/agents-result.ts:14-15`).
  - Source: `server/drivers/agents-result.ts:16-31`;
    `server/tool-results.ts:5-11`, `:35-70`.
- **P201 (step 12, with P33). A typed result of a tool.** An enum: done,
  refused, or "finish the turn". One function maps it to MCP. "Finish the
  turn" is not an MCP error, because an engine ends a turn on a failed call.
  - **Problem in the reference:** A tool result is text with an optional
    `isError` flag. Some refusals leave out the flag on purpose, so that the
    engine does not end the turn. The type does not show which refusals do
    this, so a change can add or drop the flag, and no compiler stops it
    (`server/drivers/agents-result.ts:6-11`;
    `server/drivers/agents-call.ts:347`). The release problem: none; this is
    a judgment call.
  - Why: better than the reference. It uses `{ text, isError? }`, and some
    refusals leave out `isError` on purpose
    (`server/drivers/agents-result.ts:6-10`;
    `server/drivers/agents-mcp.ts:56`).
- **P202 (decision, a note in D8). No `find_tool` and `use_tool` for now.**
  The list stays small by role and by groups of tools that a person can turn
  off. Look at the bridge again only for a small local model.
  - Why: less code. The live eval of the reference gave the same result and
    no saving: 6 of 6 for both, $0.56 full and $0.58 bridged
    (`docs/agents-tool-bridge.md:25-39`). The bridge had a real hole:
    "use_tool({ name: "vm_exec" }) passed this gate and ran"
    (`server/agents-bridge-gates.test.ts:173-174`).
- **P203 (step 12). A deadline for each tool.** Each tool definition has a
  deadline, and a long tool states its own. The runtime ends a call at its
  deadline with a typed refusal.
  - Why: the problem "a turn or a wait that does not end". The proxy of the
    reference calls the server with no deadline
    (`server/drivers/agents-client.ts:17-18`), and Codex gets 960 s for each
    call (`server/drivers/agents-tool-limit.ts:1-4`).

## A correction

`../comparison.md:108` says that the proxy calls the server "with a token for
the turn". Since v0.1.96 the token is the same for each bot, thread and set
of grants. Only the record behind it is for one turn (`server/index.ts:1649-1651`).
