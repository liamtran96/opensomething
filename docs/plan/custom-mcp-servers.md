# Plan: Custom MCP servers

The proposals from the research file
[`../research/features/custom-mcp-servers.md`](../research/features/custom-mcp-servers.md)
(batch 7, reference commit `96ff84455`). Updated on 2026-11-28 to the
reference commit `e1cc6a290` (after the release v0.1.186): each proposal
that a change of the reference affects has a line "Update (`e1cc6a290`)",
and the new proposals are P755 to P764. The line numbers of a Source are at
`96ff84455`, and the line at `e1cc6a290` follows in brackets where it
moved. The steps, the pull requests and the order are in
[`README.md`](README.md). The author decides each proposal.
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
  (`server/drivers/claude.ts:1064-1068` [`:999-1003`]). Since v0.1.182, on
  Gemini CLI and Antigravity, each command server goes through the gate,
  also with no scope (research, change 13).

## Proposals

- **P230 (decision). Correct the references of D12.** `server/connector-proxy.ts`
  is the Composio connector, not the proxy of custom servers. For custom
  servers, name `server/mcp-gate.ts` (it filters and checks) and
  `server/mcp-remote-proxy.ts` (it talks to a URL server). Also correct
  `docs/comparison.md:138-139`: 20 MB is the Composio limit; custom servers
  have 32 MiB.
  - Why: D12 mixes the two paths.
  - Source: `server/connector-proxy.ts:1-2`, `:37` [`:38`];
    `server/mcp-gate.ts:310-323` [`:317-330`]; `server/mcp-http.ts:37-38`.
  - Update (`e1cc6a290`): still correct. The gate and the remote proxy now
    also fit the tool list in bytes on some engines (research, changes 13
    and 14), but they keep the roles that P230 gives them.
- **P231 (decision). Is our proxy always between the engine and the server?**
  Option a: always (better than the reference: each call goes through one
  check). Option b: follow the reference: no gate when no scope and no result
  budget, and Claude Code connects to a URL server itself.
  - Why: D12 says "a proxy of ours stands between the engine and the tool
    server", and the reference does not always do this.
  - Source: `server/drivers/claude.ts:1064-1068` [`:999-1003`];
    `server/mcp-gate-config.ts:47`, `:190`.
  - Update (`e1cc6a290`):
    - Correction of the first read: option b is not exact. In the
      reference, a command server with no scope also gets a gate for an MCP
      apps mount or a schema profile (`server/drivers/turn-mcp.ts:47-50`).
    - Since v0.1.182 Gemini CLI and Antigravity have a schema profile, so
      on these engines the reference already puts each command server
      behind the gate (`server/tool-schema-profile.ts:55`). Option a is
      closer to the reference than before.
    - A new reason for option a: since v0.1.186 the reference strips images
      from tool results for a text-only model in the gate and the proxies
      only. A command server with no gate gets the variable
      `OMB_MCP_TEXT_ONLY`, but no process reads it, so its images still
      reach the model (`server/drivers/turn-mcp.ts:47-50`, `:121-123`;
      derived, not run). With a proxy always in front, one place can apply
      the scope, the image rule and a list fit (P759).
- **P232 (decision, step 16). The store of tokens and server secrets.** A
  failed read of the token store gives a typed error, and no write follows it.
  Tokens and server secrets are encrypted or in the system keychain, not in
  clear text in the settings file and its backups. A secret field takes only
  a reference to a stored secret; a literal value from a bot is refused.
  - **Problem in the reference:** A damaged `mcp-oauth.json` reads as empty.
    The next sign-in then writes over it, and the tokens of all the other
    servers are lost (`server/mcp-oauth-store.ts:63-66`, `:107-113`). Keys
    stay in clear text in 10 dated copies of the settings file
    (`server/config-backup.ts:13-16`). The release problem: "A file written
    over after a failed read" (v0.1.103, v0.1.151) and "A secret or an
    access right in the wrong place" (v0.1.86).
  - Why: better than the reference. A corrupt `mcp-oauth.json` reads as empty,
    and the next sign-in deletes the other records ("a file written over after
    a failed read"). Tokens and keys are in clear text in 10 backups, and a
    key that a bot types is saved ("a secret in the wrong place").
  - Source: `server/mcp-oauth-store.ts:63-66`, `:106-118`;
    `server/config-backup.ts:13-16`; `server/secret-vault.ts:165-175`.
  - Update (`e1cc6a290`): the problem is still in the reference. These
    files did not change. A related fix came in v0.1.184: a header value
    is trimmed, and a value that cannot be sent is refused on save (P758).
- **P233 (decision, steps 4 and 16). The MCP call timeout is a capability of
  the driver.** Each driver states if it takes a deadline for each MCP call.
  The remote proxy has a deadline for `tools/call`. A timeout sends
  `notifications/cancelled` before the process stops.
  - **Problem in the reference:** The MCP call timeout works only in the
    chat driver, but the UI says that it applies to each tool. The proxy of
    a URL server sets no deadline for `tools/call` outside directory mode,
    so the proxy itself never ends a stuck call. When the chat driver times
    out a call, it stops the server and sends no `notifications/cancelled`
    (`server/drivers/openai-chat.ts:614`; `server/mcp-remote-proxy.ts:339`;
    `server/drivers/chat-mcp-tools.ts:280`, `:288`). The release problem: "A
    turn or a wait that does not end" (v0.1.15, v0.1.98).
  - Why: better than the reference. Only the chat driver reads the setting,
    but the UI says it applies to each tool. The proxy has no `tools/call`
    deadline outside directory mode. A timeout sends no cancel ("a wait that
    does not end").
  - Source: `server/drivers/openai-chat.ts:614` [`:613`];
    `server/contracts.ts:234-235` [`:235-236`];
    `server/mcp-remote-proxy.ts:339` [`:342`];
    `server/drivers/chat-mcp-tools.ts:275-289`.
  - Update (`e1cc6a290`): the problem is still in the reference. Only
    the line numbers moved.
- **P234 (plan, step 16). Split step 16 into pull requests.** Each one has 200
  lines or fewer and builds alone: the spec types, the name rule and the
  limits (`bot-protocol`); the tool scope parse and match (`bot-protocol`);
  the stored list (`bot-core`); the stdio client and the server test
  (`bot-engine`); the gate; the URL client, Streamable HTTP first; the grants
  of each bot (`bot-core`); the "MCP servers" panel (`bot-desktop`). OAuth
  sign-in is later (P244).
  - Why: follows the modules of the reference.
  - Source: `server/mcp-registry.ts:110-169` [`:111-170`];
    `packages/phone-protocol/src/tool-scope.ts:45-92`;
    `server/host/mcp-config.ts:144-241`;
    `server/mcp-gate.ts:291-426` [`:298-439`].
  - Update (`e1cc6a290`): the split is still correct. The stdio client
    pull request gets the line rule of P757. The stored list and the URL
    client get the header rule of P758.
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
  - **Problem in the reference:** Below Full access, a bot can add a server
    at a public https address. The server turns on and joins the bot's list
    with no card, so the bot gives itself new tools with no yes from the
    person (`server/routes/internal-mcp.ts:237`, `:243-248`). The release
    problem: "A secret or an access right in the wrong place" (v0.1.128) and
    "The approval model changed" (v0.1.115).
  - Why: better than the reference, and follows its own design spec. Below
    Full access, a bot can add a public https server, and it turns on and
    joins the bot's list with no card ("an access right in the wrong place").
  - Source: `server/drivers/agents-tool-groups.ts:36`;
    `server/routes/internal-mcp.ts:235-248`;
    `docs/superpowers/specs/2026-11-01-mcp-in-chat-design.md:91`.
  - Update (`e1cc6a290`): the problem is still in the reference. These
    files did not change. Since v0.1.184 a page that a bot wrote can also
    call the tools of the person's servers outside a turn, with the grant
    check of a turn but another approval rule (P762).
- **P237 (decision, with P199). Tool selection support is a driver
  capability.** None, MCP only, or native and MCP: a flag on the driver, not a
  table keyed by the driver kind.
  - Why: our rule in `AGENTS.md`.
  - Source: `shared/tool-scope-support.ts:4-9`;
    `server/drivers/turn-mcp.ts:112-115` [`:115-119`].
  - Update (`e1cc6a290`): the reference now keys more MCP behaviour by
    driver kind or by name:
    - the `gemini` schema profile (`server/tool-schema-profile.ts:55`);
    - the engines with their own MCP config
      (`server/provider-tool-allow.ts:13`);
    - the session tool budget, chosen by the agent name of `initialize`
      (`server/drivers/antigravity-acp.ts:786-797`).

    P759 and P763 propose capabilities for two of them.
- **P238 (plan, steps 9 and 16). The person's own Codex servers do not reach
  the bots.** A bot gets only the servers of our stored list. Link this to the
  proposal of `changelog.md` section 7.
  - Why: outside a company Codex home, Codex runs the servers of the person's
    `config.toml` on each turn, and no setting stops it.
  - Source: `server/drivers/codex-shared-home.ts:1-5`, `:84-118`;
    `server/drivers/codex.ts:441-443`.
  - Update (`e1cc6a290`): Codex is not changed. The same problem is
    probably in Hermes, which the first read missed. Hermes runs the
    servers of its own `config.yaml`, in `HERMES_HOME` or else `~/.hermes`
    of the person (`server/drivers/acp/hermes.ts:76-78`,
    `server/env-path.ts:217-219`; Hermes's own code was not read). Since
    v0.1.182 an "Always allow" on such a server is saved, and its key
    hashes only the engine and the server name, so an edit of the server
    keeps the grant (`server/provider-tool-allow.ts:12-21`). P238 can name
    each engine that runs servers from its own config, not only Codex.
- **P239 (plan, step 16). An address check for each remote request.** The URL
  client does not follow a redirect. A loopback or private address needs the
  person's choice in the settings.
  - Why: the client of the reference allows both, so a header can go to a new
    address. Its discovery code and URL check already refuse redirects.
  - Source: `server/mcp-http.ts:66-69`, `:312`;
    `server/mcp-oauth-discovery.ts:45-74` [`:47-76`].
  - Update (`e1cc6a290`): the problem is still in the reference.
    `server/mcp-http.ts` did not change.
- **P240 (plan, step 16). One rule for a dead server on each engine.** When
  one server does not start or stops, the turn continues on each engine, and
  the person and the bot hear its name one time. The start check of one
  server does not hold a slot of other bots.
  - Why: v0.1.153 is only in the chat driver. Codex holds its launch slot for
    30 s, and all bots share 2 check slots ("one slow part blocks the others").
  - Source: `server/drivers/chat-mcp-tools.ts:884-895`;
    `server/drivers/codex.ts:549-551`; `server/mcp-health.ts:15` [`:21`].
  - Update (`e1cc6a290`): the reference changed its rule in three places.
    The reason for P240 stays.
    - v0.1.186: a start check that only times out is no verdict. The
      server stays in turns and is checked again after 1 minute. At 3
      timeouts in a row it is off (`server/mcp-health.ts:18-20`, `:83-86`,
      `:92-97`). P755 follows this.
    - After the tag v0.1.186: Claude Code closes a session whose custom
      server did not connect, so the next turn connects it again
      (`server/drivers/claude.ts:1293`, `:1375`). Codex already did this
      (`server/drivers/codex.ts:679`, `:910`). P756 follows this. P240 does
      not say what the next turn does. P756 adds it.
    - After the tag v0.1.186: Pi gives the `agents` server 20 s (30 s on a
      Cloud) to start, as the other engines do
      (`server/drivers/pi-mcp-servers.ts:47-49`).
    - A new cost for the slots (derived, not run). A package-runner server
      (`npx`, `uvx`) that hangs can hold one of the 2 shared check slots
      for 120 s, three times, before it is off. During that time it stays
      in the turns of each bot. The two shared slots are still in the
      reference (`server/mcp-health.ts:21`).
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
  - Source: `server/mcp-registry.ts:204-214` [`:209-219`];
    `server/routes/mcp-servers.ts:18-19`; `server/mcp-bot-rules.ts:111-128`.
  - Update (`e1cc6a290`): the problem is still in the reference. Only the
    line numbers moved.
- **P243 (plan, step 16, with D10). Only the person widens the grants of a
  bot.** A change that widens `mcpServers` or `toolScope` needs a token of the
  desktop process, not a request header.
  - Why: outside the packaged desktop, any loopback caller is the owner, and
    "A shell can forge an Origin header". A bot shell can widen its grants.
  - Source: `server/routes/bot-patch.ts:619-620`, `:636`, `:650-657`
    [`:637-638`, `:654`, `:668-675`].
  - Update (`e1cc6a290`): the problem is still in the reference. Only the
    line numbers moved.
- **P244 (gap, after step 16). OAuth sign-in to a URL server.** The first
  version of step 16 uses headers only. Sign-in comes later, with the
  loopback listener first (D10), then the paste of the address from another
  computer.
  - Why: the sign-in code is large: discovery, registration, PKCE, refresh.
  - Source: `server/mcp-oauth.ts:301-321`, `:356-371`, `:569-615`
    [`:571-617`].
  - Update (`e1cc6a290`): still a gap. In v0.1.186 the reference changed
    what a failed start of a sign-in does on the Sign in card, and it reads
    one more discovery field. The sign-in pull request must choose these
    rules too: P760 and P761.
- **P245 (gap, with P244). Stop cancels a sign-in.** A Sign in card does not
  open an address after the flow ended.
  - Why: in the reference, a sign-in can finish after Stop. The card keeps an
    address for 10 minutes, but the flow ends after 5.
  - Source: `server/index.ts:2013-2025` [`:2014-2026`];
    `server/host/mcp-sign-in-cards.ts:73-76` [`:75-78`];
    `server/mcp-oauth.ts:51`.
  - Update (`e1cc6a290`): the problem is still in the reference. Only the
    line numbers moved.

## Proposals from the update to `e1cc6a290` (v0.1.186)

The main session gives these proposals their P-numbers. Each Source is at
`e1cc6a290`. "Change n" is a row of the section "Changes up to
`e1cc6a290` (v0.1.186)" of the research file.

- **P755 (plan, step 16). A start check that only times out is no
  verdict, three times.** A start check gives a typed result: started,
  failed with a reason, or timed out. A timeout keeps the server in turns,
  says nothing, and checks again after 1 minute. The stored check record
  counts the timeouts in a row. At 3, the server is off, as after a failure,
  and the next check is after 30 minutes. A pass, a failure of another kind,
  an edit, a restart or a new start key ends the count. The record and its
  event go in one transaction.
  - Why: follows the reference (v0.1.186, change 1): "A server whose start
    check only timed out stays on, unless that happens three times in a
    row." Before, one slow check of a working server took it out of turns
    for 30 minutes. `e375e704e` kept a timed-out server on with no limit.
    `c887e11ab` added the limit of 3, so a server that hangs at each start
    is not checked each minute with no end.
  - Source: `server/mcp-health.ts:18-20`, `:83-86`, `:92-97`, `:165-170`;
    `server/host/mcp-servers-host.ts:130`; tests
    `server/mcp-health.test.ts:65`, `:89`.
  - Note: the reference has no timer. Its checks run before a turn, at boot
    and after an engine reports a failed server. So the time to the third
    timeout depends on how often the bot is used (derived, not run). The
    author can choose a fixed schedule instead (a judgment call).
- **P756 (plan, steps 4 and 16). An engine that connects MCP servers only
  at start gets a new process after a failed server.** A driver capability
  says that the engine connects MCP servers only when its process starts.
  When such an engine reports a custom server as failed, the driver closes
  the process after the turn. The next turn starts a new process and
  resumes the conversation.
  - Why: follows the reference (after the tag v0.1.186, change 5, no
    release yet). Before, a warm Claude Code process kept a failed server
    for the whole thread. The server's tools did not come back, also after
    a reconnect in Settings. Codex already refused to keep such a session.
    The capability flag, not the driver name, is our rule in `AGENTS.md`.
  - Source: `server/drivers/claude.ts:734`, `:1293`, `:1375`;
    `server/drivers/team-tools.ts:12-19`; `server/drivers/codex.ts:679`,
    `:910`; test `server/drivers/claude.test.ts:3848`.
  - Cost: each turn after a failed connect is a cold start of the engine.
  - A stop rule, a judgment call that the reference does not have: the
    retire stops when the host has the server off, because then the server
    is not in the launch any more. In the reference, the start check
    covers command servers only (`server/mcp-health.ts:28`, `:33`), and
    the URL check turns a server off only on a 405
    (`server/host/mcp-url-checks.ts:20`). So a URL server that fails to
    connect at each turn makes each Claude Code turn a cold start, with no
    end (derived, not run). Our stop rule needs an "off" state for a URL
    server too (with P241).
- **P757 (plan, step 16, the stdio client pull request). The line rule of
  stdio JSON-RPC.** The reader splits frames on `\n` only and drops one
  trailing `\r`. It decodes UTF-8 across the edges of chunks. At the end of
  the input it delivers a last frame with no `\n`. A handler that fails
  never drops or merges frames that are already in the buffer. A test sends
  U+2028 and U+2029 inside a string.
  - Why: follows the reference (v0.1.182, change 11, no line in the release
    note). Before, the reader also split at U+2028 and U+2029, which
    `JSON.stringify` leaves raw. A request with such a character got no
    answer, so the engine waited for its own timeout, or a scoped gate
    exited and the server was gone for the turn.
  - Source: `server/stdio-lines.ts:7-41`; `server/mcp-gate.ts:298`,
    `:363`; `server/mcp-remote-proxy.ts:367-375`; tests
    `server/stdio-lines.test.ts:14`, `:47-57`.
  - Option, a judgment call: our writer also escapes U+2028 and U+2029, so
    an engine that reads with a line reader of its own cannot cut our
    frames. The reference does not do this (`server/mcp-remote-proxy.ts:45`,
    `server/mcp-gate.ts:438`), and no release problem names it.
- **P758 (plan, step 16, the stored list and the URL client). A header value
  that cannot be sent.** The stored list trims each header value on save
  and on read. A save refuses a value that is not a valid HTTP header value,
  with a typed refusal that names the header, never the value. A stored bad
  value fails only the request of its server, with a typed refusal that
  names the server and the header.
  - Why: follows the reference (v0.1.184, change 15): "One saved key with a
    stray character can no longer take a Cloud down." Before, a curly quote
    in a saved key made the request code throw, and the start check of URL
    servers did it again at each start.
  - Source: `server/mcp-registry.ts:204-206`, `:393-397`;
    `server/bot-box/broker-headers.ts:10-37`; tests
    `server/bot-box/broker-headers.test.ts:46`, `:131`, `:139`.
- **P759 (decision, steps 4 and 16, with P231 and P237). Images in tool
  results for a model that reads text only.** "Reads images" is a declared
  capability of the model or the driver. When it is false, our proxy in
  front of each server replaces each image of a tool result with a short
  text note. If we also learn it from a refusal, we store it.
  - **Problem in the reference:** A text-only model fails each later
    message after one image. The reference learns "text only" from the text
    of one vendor's refusal, in the ACP driver only, and keeps it in memory,
    so after a restart the first image fails again
    (`server/drivers/engine-errors.ts:40`, `server/mcp-text-only.ts:41-56`).
    A person's command server with no gate gets the variable
    `OMB_MCP_TEXT_ONLY`, but no process reads it, so its images still reach
    the model (`server/drivers/turn-mcp.ts:47-50`, `:121-123`; derived, not
    run). The release problem: "an image in the conversation no longer
    makes every later message fail." (v0.1.186). No theme of
    `changelog.md` section 5 names it, so this is a judgment call.
  - Why: better than the reference. A capability flag is our rule in
    `AGENTS.md`, and one proxy in front of each server (P231 option a)
    leaves no server out.
  - Source: `server/mcp-text-only.ts:13`, `:22-56`;
    `server/drivers/acp/core.ts:891-893`, `:1353`;
    `server/mcp-gate.ts:424-426`; `server/mcp-remote-proxy.ts:347-349`;
    `server/bot-box/env.ts:30`.
- **P760 (plan, with P244). Discovery keeps "no OAuth" apart from "failed
  for now".** The discovery of the sign-in returns one of three results:
  the metadata, "this server has no OAuth", or a typed error for a fetch
  that failed. "No OAuth" is final for the card. A failed fetch leaves the
  card for another tap.
  - **Problem in the reference:** `getJson` returns null for a non-2xx
    reply and for a thrown error, and `begin` turns each null into
    `not-oauth` (`server/mcp-oauth-discovery.ts:112-115`, `:134-136`;
    `server/mcp-oauth.ts:574-575`). v0.1.186 therefore keeps `not-oauth`
    retryable (`server/host/mcp-sign-in-cards.ts:174-177`). So a server
    with no OAuth stays retryable with no end, and the bot waits until the
    person presses "Not now" (derived, not run). The release problem: "A
    turn or a wait that does not end" (v0.1.15, v0.1.153, v0.1.182).
  - Why: better than the reference. The person and the bot hear a final
    answer for a server that can never sign in, and a network error does
    not end the card.
  - Source: as in the problem line.
- **P761 (plan, with P244). The Sign in card says why a start failed.** A
  start failure is a typed refusal with a "final" property. A final
  failure (no registration endpoint and no pre-registered app) makes the
  card `failed` with a fixed reason, and the bot hears it one time. A turn
  that parks later hears it from the stored card row. Discovery reads
  `client_id_metadata_document_supported`, and such a server gets its own
  text: we do not support a client ID metadata document.
  - Why: follows the reference (v0.1.186, changes 7 to 10): "Servers that
    can't sign in apps say why on the Sign in card."
    (`announcements/releases.json:63`). Before, the card stayed on "Sign
    in", and the bot waited until "Not now". Text from the stored row is
    our rule in `AGENTS.md`.
  - Source: `server/host/mcp-sign-in-cards.ts:60`, `:174-178`, `:194-200`,
    `:296`; `server/mcp-oauth.ts:537-541`;
    `server/mcp-oauth-discovery.ts:13-14`, `:217`; tests
    `server/mcp-sign-in-card.test.ts:387-446`.
  - Two details, each a judgment call:
    - The reference stores the reason in the language of the chat, but a
      turn that is already parked hears English. A turn that parks later
      can hear the translated text (`:195-197`, `:296`; derived, not run).
      We store the reason as a code and make the text of the person and the
      text of the bot from it.
    - A final failure still shows "Try again" in the reference
      (`src/components/ConnectorCard.tsx:210-211`). We can show "Edit the
      server" instead.
- **P762 (plan, a later step of pages). A call from a page uses the
  approval rule of a turn.** A page that calls a tool of the person's
  server outside a turn gets the same approval as a turn. The page does not
  trust the server's own `readOnlyHint`. A read-only mark comes only from
  the person, in the tool selection.
  - **Problem in the reference:** Since v0.1.184 a bot page can call a
    tool of the person's server. A tool that the server marks
    `readOnlyHint: true` runs with no approval and no click, at each access
    level (`server/connector-gate.ts:310-315`). The mark is the server's
    own claim, so a server can mark a write as read-only. The test
    `server/connector-gate.test.ts:266-275` runs a tool named `wipe` at
    below Full access. The release problem: "A secret or an access right in
    the wrong place" (v0.1.113: "Web pages no longer get owner access";
    v0.1.128).
  - Why: better than the reference. The person decides what runs with no
    card, not the server.
  - Source: `server/connector-gate.ts:293-322`;
    `server/chat-apps-mcp.ts:348-376`;
    `packages/phone-protocol/src/app.ts:45-54`.
- **P763 (decision, step 16, with P237). The size of the tool list is a
  driver capability, and no tool goes away with no word.** A driver states
  its limit for one tool and for the whole list of a session. Our proxy
  fits each server's list into its share. When a tool still does not fit,
  it stays in the list with a minimal schema, or the bot and the person
  hear its name one time. If a share comes from an earlier session, its
  record is a row of our store and goes with the server.
  - **Problem in the reference:** Since v0.1.182, on Gemini CLI and
    Antigravity, the gate leaves out a tool of the person's server that is
    over 2,000 bytes at its shortest, with only a stderr line
    (`server/mcp-tool-schema.ts:116-120`,
    `server/tool-schema-profile.ts:30`, `:55`). The limits are keyed by
    driver kind and by the agent name
    (`server/drivers/antigravity-acp.ts:786-797`). The full tool lists of
    each bot stay in `<data>/tool-list-records/` after the server goes: a
    search of `server/` found no code that removes them
    (`server/drivers/session-tool-budget.ts:38-40`, `:70`;
    `server/tool-list-share.ts:35-46`). The release problem: "The size of
    the tool list of one turn" (v0.1.120: "41 of its 49 tools were being
    skipped"; v0.1.182; v0.1.184).
  - Why: better than the reference. The reference fixed the session budget
    in v0.1.184 ("connected apps no longer lose tools"), but its per-tool
    step can still remove a tool with no word to the bot.
  - Source: `server/drivers/session-tool-budget.ts:66-106`;
    `server/tool-list-budget.ts:167-188`; `server/mcp-gate.ts:229-233`,
    `:420-422`; `server/mcp-remote-proxy.ts:350`.
- **P764 (plan, step 16, with P240). Tell the person each time a server
  goes off.** The notice "the server is off" comes one time for each
  change from on to off, not one time for each start key.
  - **Problem in the reference:** `told` is set to the start key and is not
    cleared after a pass. A server that comes back and then fails again
    with the same key gives the person no second notice, but the bot still
    sees the line in its system prompt (`server/mcp-health.ts:96-97`). No
    theme of `changelog.md` section 5 names it, so this is a judgment call.
  - Why: better than the reference. The person knows why the bot lost the
    tools.
  - Source: `server/mcp-health.ts:57-59`, `:96-101`.
