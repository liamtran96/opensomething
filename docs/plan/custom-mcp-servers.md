# Plan: Custom MCP servers

The proposals from the research file
[`../research/features/custom-mcp-servers.md`](../research/features/custom-mcp-servers.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 9, 12 and 16, and a later step for OAuth sign-in.
- **State:** all open.
- **The main finding:** a person's server goes through a small gate process
  that removes excluded tools and refuses their calls. A URL server goes
  through a local stdio proxy. Claude Code is the exception: it connects to a
  URL server itself when no gate is necessary
  (`server/drivers/claude.ts:1064-1068`).

## Proposals

- **P230 (decision). Correct the references of D12.** `server/connector-proxy.ts`
  is the Composio connector, not the proxy of custom servers. For custom
  servers, name `server/mcp-gate.ts` (it filters and checks) and
  `server/mcp-remote-proxy.ts` (it talks to a URL server). Also correct
  `docs/comparison.md:138-139`: 20 MB is the Composio limit; custom servers
  have 32 MiB.
  - Why: D12 mixes the two paths.
  - Source: `server/connector-proxy.ts:1-2`, `:37`; `server/mcp-gate.ts:310-323`;
    `server/mcp-http.ts:37-38`.
- **P231 (decision). Is our proxy always between the engine and the server?**
  Option a: always (better than the reference: each call goes through one
  check). Option b: follow the reference: no gate when no scope and no result
  budget, and Claude Code connects to a URL server itself.
  - Why: D12 says "a proxy of ours stands between the engine and the tool
    server", and the reference does not always do this.
  - Source: `server/drivers/claude.ts:1064-1068`; `server/mcp-gate-config.ts:47`, `:190`.
- **P232 (decision, step 16). The store of tokens and server secrets.** A
  failed read of the token store gives a typed error, and no write follows it.
  Tokens and server secrets are encrypted or in the system keychain, not in
  clear text in the settings file and its backups. A secret field takes only
  a reference to a stored secret; a literal value from a bot is refused.
  - Why: better than the reference. A corrupt `mcp-oauth.json` reads as empty,
    and the next sign-in deletes the other records ("a file written over after
    a failed read"). Tokens and keys are in clear text in 10 backups, and a
    key that a bot types is saved ("a secret in the wrong place").
  - Source: `server/mcp-oauth-store.ts:63-66`, `:106-118`;
    `server/config-backup.ts:13-16`; `server/secret-vault.ts:165-175`.
- **P233 (decision, steps 4 and 16). The MCP call timeout is a capability of
  the driver.** Each driver states if it takes a deadline for each MCP call.
  The remote proxy has a deadline for `tools/call`. A timeout sends
  `notifications/cancelled` before the process stops.
  - Why: better than the reference. Only the chat driver reads the setting,
    but the UI says it applies to each tool. The proxy has no `tools/call`
    deadline outside directory mode. A timeout sends no cancel ("a wait that
    does not end").
  - Source: `server/drivers/openai-chat.ts:614`; `server/contracts.ts:234-235`;
    `server/mcp-remote-proxy.ts:339`; `server/drivers/chat-mcp-tools.ts:275-289`.
- **P234 (plan, step 16). Split step 16 into pull requests.** Each one has 200
  lines or fewer and builds alone: the spec types, the name rule and the
  limits (`bot-protocol`); the tool scope parse and match (`bot-protocol`);
  the stored list (`bot-core`); the stdio client and the server test
  (`bot-engine`); the gate; the URL client, Streamable HTTP first; the grants
  of each bot (`bot-core`); the "MCP servers" panel (`bot-desktop`). OAuth
  sign-in is later (P244).
  - Why: follows the modules of the reference.
  - Source: `server/mcp-registry.ts:110-169`;
    `packages/phone-protocol/src/tool-scope.ts:45-92`;
    `server/host/mcp-config.ts:144-241`; `server/mcp-gate.ts:291-426`.
- **P235 (plan, step 16). Add, change and remove are one transaction.** A
  change to a server, its secret grants and its sign-in is one transaction. A
  refused save leaves no grant. A remove always forgets the sign-in.
  - Why: our rule in `AGENTS.md`. In the reference, `add` and `replace` grant
    secrets before the save, and `remove` has no `finally`.
  - Source: `server/host/mcp-config.ts:151-152`, `:188-189`, `:234-238`.
- **P236 (plan, steps 12 and 16). The step of `mcp_server`, and the
  self-grant rule.** `mcp_server` is a tool of our own MCP server (step 12),
  and it needs the stored list of step 16, so it comes with step 16. Below
  Full access, a server that a bot adds is always saved off, and a card turns
  it on.
  - Why: better than the reference, and follows its own design spec. Below
    Full access, a bot can add a public https server, and it turns on and
    joins the bot's list with no card ("an access right in the wrong place").
  - Source: `server/drivers/agents-tool-groups.ts:36`;
    `server/routes/internal-mcp.ts:235-248`;
    `docs/superpowers/specs/2026-11-01-mcp-in-chat-design.md:91`.
- **P237 (decision, with P199). Tool selection support is a driver
  capability.** None, MCP only, or native and MCP: a flag on the driver, not a
  table keyed by the driver kind.
  - Why: our rule in `AGENTS.md`.
  - Source: `shared/tool-scope-support.ts:4-9`; `server/drivers/turn-mcp.ts:112-115`.
- **P238 (plan, steps 9 and 16). The person's own Codex servers do not reach
  the bots.** A bot gets only the servers of our stored list. Link this to the
  proposal of `changelog.md` section 7.
  - Why: outside a company Codex home, Codex runs the servers of the person's
    `config.toml` on each turn, and no setting stops it.
  - Source: `server/drivers/codex-shared-home.ts:1-5`, `:84-118`;
    `server/drivers/codex.ts:441-443`.
- **P239 (plan, step 16). An address check for each remote request.** The URL
  client does not follow a redirect. A loopback or private address needs the
  person's choice in the settings.
  - Why: the client of the reference allows both, so a header can go to a new
    address. Its discovery code and URL check already refuse redirects.
  - Source: `server/mcp-http.ts:66-69`, `:312`; `server/mcp-oauth-discovery.ts:45-74`.
- **P240 (plan, step 16). One rule for a dead server on each engine.** When
  one server does not start or stops, the turn continues on each engine, and
  the person and the bot hear its name one time. The start check of one
  server does not hold a slot of other bots.
  - Why: v0.1.153 is only in the chat driver. Codex holds its launch slot for
    30 s, and all bots share 2 check slots ("one slow part blocks the others").
  - Source: `server/drivers/chat-mcp-tools.ts:884-895`;
    `server/drivers/codex.ts:549-551`; `server/mcp-health.ts:15`.
- **P241 (plan, step 16). Keep the "off" state of a URL server on disk.** A
  URL that is not an MCP endpoint stays off after a restart until a check
  proves it.
  - Why: the reference keeps it in memory, so a 405 server is mounted after a
    restart until the check ends (v0.1.178: "named once").
  - Source: `server/host/mcp-url-checks.ts:100-114`, `:135-141`.
- **P242 (plan, step 16). One mask for an address in each view.** Each
  listing shows a URL without its query and hides the arguments after a
  secret flag. The bot view and the settings view use the same mask.
  - Why: the settings listing returns `url` and `args` in full, and the
    route's own comment says that they can hold secrets.
  - Source: `server/mcp-registry.ts:204-214`; `server/routes/mcp-servers.ts:18-19`;
    `server/mcp-bot-rules.ts:111-128`.
- **P243 (plan, step 16, with D10). Only the person widens the grants of a
  bot.** A change that widens `mcpServers` or `toolScope` needs a token of the
  desktop process, not a request header.
  - Why: outside the packaged desktop, any loopback caller is the owner, and
    "A shell can forge an Origin header". A bot shell can widen its grants.
  - Source: `server/routes/bot-patch.ts:619-620`, `:636`, `:650-657`.
- **P244 (gap, after step 16). OAuth sign-in to a URL server.** The first
  version of step 16 uses headers only. Sign-in comes later, with the
  loopback listener first (D10), then the paste of the address from another
  computer.
  - Why: the sign-in code is large: discovery, registration, PKCE, refresh.
  - Source: `server/mcp-oauth.ts:301-321`, `:356-371`, `:569-615`.
- **P245 (gap, with P244). Stop cancels a sign-in.** A Sign in card does not
  open an address after the flow ended.
  - Why: in the reference, a sign-in can finish after Stop. The card keeps an
    address for 10 minutes, but the flow ends after 5.
  - Source: `server/index.ts:2013-2025`; `server/host/mcp-sign-in-cards.ts:73-76`;
    `server/mcp-oauth.ts:51`.
