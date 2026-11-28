# Custom MCP servers: the registry, grants, sign-in, the proxy and the timeout

Feature row of [`../reference-features.md`](../reference-features.md),
group 3. The parts are:

- the MCP registry and the MCP tool grants for each bot.
- the "MCP servers" tab.
- the stdio proxy for a remote server.
- OAuth sign-in to a remote MCP server, also from another computer.
- the token store and refresh.
- the `mcp_server` chat tool and the MCP call timeout.

Step 16 of [`../../plan/README.md`](../../plan/README.md). Crate:
`bot-engine`, with types in `bot-protocol` and the stored list in `bot-core`
(section 7).

Read on 2026-11-25 at commit `96ff84455` of the reference project. Updated
on 2026-11-28 to commit `e1cc6a290` (after the release v0.1.186, tag commit
`70eb44c1a`). This file is correct at `e1cc6a290` for the changes that the
section "Changes up to `e1cc6a290` (v0.1.186)" names. The other parts were
read at `96ff84455`. A line number in a part that did not change is a line
at `96ff84455`.

All paths are in the reference project unless a line says "ours". The
`enterprise/` directory was not opened. For the first read, ten subagents
read ten groups of files, and the main session checked 25 key claims against
the code. For the update, four subagents read four groups of changed files,
and the main session checked 24 key claims (section 9 lists what is not
checked).

In quoted text from the reference project, `<product>` replaces the product
name of the reference project.

## What this file adds to earlier research

- [`agent-tools.md`](agent-tools.md) has our own tools given to engines as an
  MCP server, the tool directory (`search_tools`, `describe_tool`,
  `call_tool`) and the 128-tool limit. This file does not repeat them. It
  adds the person's own servers: how they are stored, tested, granted,
  signed in to and started for each engine.
- [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md) has the tool loop
  of the chat driver. This file adds the remote proxy behind that loop, the
  MCP call timeout and the `mcp_server` tool.
- [`write-only-secrets.md`](write-only-secrets.md) section 3.9 has the
  `vault:<id>` pointers in outline. This file adds the rules of
  `server/vault/mcp-keys.ts` (section 3.2).
- [`approval-cards.md`](approval-cards.md) has the double answer and the
  supersede rule of MCP change cards. This file adds the full action matrix
  of `mcp_server` (section 3.9).
- [`security-model.md`](security-model.md):993-994 lists the content and the
  mode of `mcp-oauth.json` as not verified. Section 4.3 of this file answers
  it.

**Lines of done research files that are now wrong** (the reference project moved 127
commits since `eee23ebbe`, and some files were read at older commits):

| Done file and line | It says | At `96ff84455` |
|---|---|---|
| `write-only-secrets.md:157-158` | `server/mcp-registry.ts:126-127`, `:211-241` | `:142-143` (`MAX_ARGS`, `MAX_ENV`). The schema range is now `:228-259`: env `:228`, `:238`, headers `:259`, `:269`, client secret `:250`, `:272` |
| `write-only-secrets.md:66` | `server/mcp-registry.ts` has 551 lines | 584 lines |
| `chat-driver-tool-calls.md:94` | `chat-mcp-tools.ts` (950) | 953 lines |
| `chat-driver-tool-calls.md:123` | `fake-http-mcp-server.ts` (375) | 377 lines |
| `chat-driver-tool-calls.md:95` | `own-mcp-http.ts` (81) | 83 lines |
| `agent-tools.md:144` | `own-mcp-http.ts` and test: 81, 140 | 83, 152. The cited lines `:1-8`, `:17-20` and `:61-66` are still correct (the change is at line 78) |
| `chat-driver-tool-calls.md:363-365`, `:515` | one tool call gets 10 minutes | True for a command server only. A URL server goes through the remote proxy in directory mode, which stops `tools/call` at 120 s (`server/drivers/chat-mcp-tools.ts:584-589`, `server/mcp-remote-proxy.ts:339`). So the limit of a URL server is the smaller of the setting and 120 s |
| `chat-driver-tool-calls.md:384-386` | a timed-out server stops for the turn | Exact for a setting below 2 minutes: the chat client's own timer fires first and closes the server (`chat-mcp-tools.ts:280`, `:287-289`). With a setting above 2 minutes, the proxy answers at 120 s with a JSON-RPC error (`-32800`). The chat client treats each JSON-RPC error as a refusal and keeps the server (`:256`, `:288`, `:890`) |
| `turn-limits.md:339` | `contracts.ts:227-228` | `contracts.ts:234-235` |
| `driver-contract.md:600` | `contracts.ts:227` | `contracts.ts:234` |
| `agent-tools.md` section 3.9 item 6 | a server with more than 40 tools is listed as `search_tools` | Incomplete. The feature page limits this to API-model bots, Pi and Codex on a ChatGPT plan. It searches command servers only on API models (`docs/custom-mcp-servers.md:379-380`, `:398`). Checked in the document only |
| `approval-cards.md:548` | the supersede rule | Incomplete. MCP sign-in cards also replace older cards (`server/host/mcp-sign-in-cards.ts:241-247`) |
| `security-model.md:571-574`, `:942` | a "person's own sign-in" turn links `config.toml` and the MCP sign-ins | Narrower than the code. Plan and device homes link `config.toml`, skills, plugins and `.credentials.json` too. Only `auth.json` depends on the kind of login (`server/drivers/codex-shared-home.ts:88`) |

The other cited lines of this feature are still correct. The main session
checked each cited file of this feature with `git diff` from the commit of
its done file:

- `agents-mcp-env.ts` changed one name list at line 8. The cited range
  `:5-10` and the count of 10 lines are correct at `96ff84455`. At
  `e1cc6a290` the file has 13 lines and the list is at `:6-13` (commits
  `68991787a` and `bd23c1d82` add `TOOL_SCHEMA_PROFILE_ENV`).
- `pi-mcp-extension.ts` did not change from `ad27f0716` to `96ff84455`.
  After `96ff84455` it changed: `0163e1782` adds `windowsHide: true`
  (`:111`), and `696a3bfb6` adds `startupMs` (section "Changes up to
  `e1cc6a290`").
- `chat-mcp-tools.ts` changed only after line 494 since `ed8cb7278`, so
  `security-model.md` (`:144`) is still correct.

## 1. In short

A person adds an **MCP server** in the settings. MCP (Model Context Protocol)
is a JSON-RPC protocol that lets an engine list and call tools of another
program. A server is one of two kinds:

- a **command server** (stdio): the server starts a local program and talks
  to it on its standard input and output.
- a **URL server** (remote): the engine talks to an HTTP address. The
  transport is **Streamable HTTP** or the older **SSE** transport.
  Streamable HTTP sends one POST for each message and gets a JSON or an
  event-stream reply. SSE keeps one GET stream for the replies.

The **registry** is the `mcpServers` map in `<data>/config.json`. It holds at
most 100 servers. A new server is saved **off**. A **test** (the probe)
starts it or calls it, reads its tool list and turns it on when it answers.
The person can also paste a whole configuration from another tool.

Each bot gets servers through two **grants**:

1. `mcpServers`: the list of servers that the bot gets. No list means "every
   server that is on, also the ones added later". At most 20 for each bot.
2. `toolScope`: allow and deny lists of tool selectors, for example
   `mcp:mail:read_notes` or `mcp:mail:*`. Deny wins.

The **gate** is a small stdio process in front of a server. It removes the
tools that the scope excludes from each tool list. It refuses a call to such
a tool before the server sees it.

A URL server reaches most engines through the **remote proxy**: a local stdio
process that does its own handshake with the remote server. One engine (Claude
Code) connects to URL servers itself, unless a gate is necessary.

A URL server can ask for **OAuth sign-in**. The reference project finds the
authorization server (discovery). It registers a new client for each sign-in
(dynamic client registration). Then it opens the browser with PKCE (a
one-time code challenge). The browser comes back to a loopback listener, to a public
https callback, or, from **another computer**, the person pastes the
redirect address back. The tokens go to `<data>/mcp-oauth.json` (mode 0600,
not encrypted). The server refreshes a token before a turn when two minutes
or less are left, and adds `Authorization: Bearer <token>` to the server spec
of the turn.

A bot can manage servers itself with the **`mcp_server`** tool: list, add,
update, enable, disable, restart, test, sign_in, sign_out and remove. Below
Full access, a change that turns a server on, changes it or removes it shows
an **approval card**. A sign-in always shows a **Sign in card**.

The **MCP call timeout** is a setting from 1 to 60 minutes (default 10). Only
the chat driver applies it. CLI engines use their own deadlines.

The UI has four parts:

- the "MCP servers" filter of the Apps pop-up (the plans called it the
  "Connections Center").
- the "MCP servers" card of the Access settings of a bot.
- the "Tool selection" card of the same settings.
- the "Tool time limit" row of the settings.

## Changes up to `e1cc6a290` (v0.1.186)

The range is `96ff84455..e1cc6a290`. It has 736 commits. 82 of them touch
the MCP files that this file cites. The table has each commit that changes
the behaviour of custom MCP servers. "Tag" means that the commit is in the
tag v0.1.186 (`git merge-base --is-ancestor <commit> 70eb44c1a`). "After"
means that it is not. The column "First release" gives the first tag that
has the commit. Some fixes came before v0.1.186, because the base commit is
older than the tags v0.1.182 and v0.1.184.

| # | Change | Commit | Tag or after | First release | File and line at `e1cc6a290` | Sections it changes |
|---|---|---|---|---|---|---|
| 1 | A start check that only times out is no verdict. The server stays in turns and is checked again after 1 minute. After 3 timeouts in a row, it is off, the person hears it once, and the next check is after 30 minutes. Release note: "A server whose start check only timed out stays on, unless that happens three times in a row." | `e375e704e`, `c887e11ab` | tag | v0.1.186 | `server/mcp-health.ts:18-20`, `:83-86`, `:92-97`; `server/host/mcp-servers-host.ts:130` | 3.3, 4.4, 8, 9 |
| 2 | `e375e704e` made the first model request of the chat driver wait for custom servers. `c887e11ab` removed that wait again, before the tag. No release has it | `e375e704e`, `c887e11ab` | tag | none (no net change) | `server/drivers/chat-mcp-tools.ts:803-804` | none |
| 3 | One ACP engine waits up to 30 s (`REMOTE_MCP_STARTUP_MS`), not 10 s, for its selected MCP catalog | `e375e704e` | tag | v0.1.186 | `server/drivers/acp/grok.ts:584`, `:603` | 3.4 |
| 4 | The chat driver counts the stand-in tool of the host computer one time, not two times, in the tool room. A server that fits exactly is listed whole | `2b5394ce2` | tag | v0.1.186 | `server/drivers/chat-mcp-tools.ts:692-693` | none |
| 5 | Claude Code: when the `system/init` message lists a custom server as `failed`, the driver closes the session after the turn. The next turn starts a new process with `--resume`, so the server connects again | `3ce9cc7bf`, `c2c82f1d8` | after | none yet | `server/drivers/claude.ts:734`, `:1293`, `:1375`; `server/drivers/team-tools.ts:12-19` | 3.4, 8 |
| 6 | Pi gives the `agents` server `agentsStartupMs()` (20 s, 30 s on a Cloud) to start. Each other server keeps 8 s, and a server config cannot set its own time | `696a3bfb6`, `87fdf2c5d` | after | none yet | `server/drivers/pi-mcp-servers.ts:47-49`; `server/drivers/pi-mcp-extension.ts:107`, `:230`, `:247` | "What this file adds", 3.4 |
| 7 | Sign in card: a server with no registration endpoint and no pre-registered app makes the card `failed` with the reason. The bot hears the reason one time. Release note: "Servers that can't sign in apps say why on the Sign in card." (`announcements/releases.json:63`) | `fb16c3f2a` (merge `c080c8f16`) | tag | v0.1.186 | `server/host/mcp-sign-in-cards.ts:174-178`, `:194-200` | 3.8 |
| 8 | A turn that parks after the card failed hears the failure text too | `237f93a7a` | tag | v0.1.186 | `server/host/mcp-sign-in-cards.ts:60`, `:296` | 3.8 |
| 9 | Only `no-registration` fails the card. `not-oauth` and `port-busy` leave the card for another tap, because `not-oauth` also covers a discovery that failed for now | `9b065ddc2` | tag | v0.1.186 | `server/host/mcp-sign-in-cards.ts:174-177` | 3.7, 3.8 |
| 10 | Discovery reads `client_id_metadata_document_supported`. A server with that flag and no registration endpoint gets its own `no-registration` text: the reference project does not support a client ID metadata document | `4cc5abe9c` | tag | v0.1.186 | `server/mcp-oauth-discovery.ts:13-14`, `:217`; `server/mcp-oauth.ts:537-541` | 3.7 |
| 11 | A new stdio line reader splits frames on `\n` only. Before, `node:readline` also split on U+2028 and U+2029, which `JSON.stringify` leaves raw in a string. A request then got no answer, or a scoped gate exited. After a handler throws, the buffered frames still come out one by one | `d0d95ebe9`, `41e71b856` | tag | v0.1.182 | `server/stdio-lines.ts:7-41`; `server/mcp-gate.ts:298`, `:363`; `server/mcp-remote-proxy.ts:367-375` | 3.5, 3.6 |
| 12 | A model that reads text only: after its first image refusal, the ACP driver puts `OMB_MCP_TEXT_ONLY=1` on each server of the next turns. The gate, the remote proxy and the proxy of own servers then replace each image of a `tools/call` result with a short text note. The memory is in the process only (500 keys). The bot box lets the variable through | `e60bfef8a`, `2ee617c61` | tag | v0.1.186 | `server/mcp-text-only.ts:13`, `:22-56`; `server/drivers/turn-mcp.ts:115-125`; `server/mcp-gate.ts:424-426`; `server/mcp-remote-proxy.ts:347-349`; `server/bot-box/env.ts:30` | 3.4, 3.5, 3.6 |
| 13 | A second schema profile, `gemini` (2,000 bytes for each tool), goes to Gemini CLI and Antigravity by driver kind. So on these engines a person's command server always runs behind the gate, also with no scope. The gate shortens each schema. A tool that is still over 2,000 bytes at its shortest is left out of the list, with one stderr line | `68991787a`, `bd23c1d82`, `ed8c01df9`; `08fc34c51` and `b66e84ee3` (v0.1.186) keep `items` on a collapsed array | tag | v0.1.182 | `server/tool-schema-profile.ts:30`, `:55`; `server/drivers/turn-mcp.ts:47-50`; `server/mcp-tool-schema.ts:116-120` | 3.6, 7, 8 |
| 14 | The native Antigravity CLI has one byte budget for all the tools of a session (55,000 bytes). The person's servers now get a share of it in `OMB_TOOL_LIST_SHARE`. The relay writes the full list to `<data>/tool-list-records/<hash>.json` and fits the list into the share. A search of `server/` found no code that removes a record | `b2e662007` | tag | v0.1.184 | `server/drivers/session-tool-budget.ts:66-106`; `server/tool-list-share.ts:35-66`; `server/mcp-gate.ts:229-233`, `:420-422`; `server/mcp-remote-proxy.ts:350` | 3.5, 3.6, 4.4, 8 |
| 15 | Header values of a URL server are trimmed on save and on read. A save refuses a value that Node cannot send in a header (for example a curly quote). A stored bad value fails only its own request, with a 502 that names the header and not the value | `88a285945` | tag | v0.1.184 | `server/mcp-registry.ts:204-206`, `:393-397`; `server/bot-box/broker-headers.ts:10-37` | 3.2 |
| 16 | Hermes: "Always allow" for a tool of a server that only Hermes's own `config.yaml` has is now saved. The key hashes `{engineOwn, server}`, so an edit of that server in `config.yaml` keeps the grant | `b479b025f`, `610f255dc` | tag | v0.1.182 | `server/provider-tool-allow.ts:12-21`; `server/drivers/acp/hermes-mcp-trust.ts:10-23` | 3.6, 3.11 |
| 17 | A bot page can call a tool of the person's server outside a turn (`mcp:<server>:<tool>` in `uses`). A tool with `readOnlyHint: true` runs with no approval and no click, at each access level | `3529752e9` | tag | v0.1.184 | `server/connector-gate.ts:293-322`, `:310-315`; `server/chat-apps-mcp.ts:348-376` | 3.3, 3.6 |

No change in the range: `server/routes/mcp-servers.ts`,
`server/mcp-oauth-store.ts`, `src/lib/mcp-sign-in.ts`,
`src/components/McpServersPanel.tsx`, `src/components/McpServerEditor.tsx`
and `server/mcp-gate-config.ts`. No `en.json` key of the MCP sign-in changed.

**Errors of the first read.** Two statements were already wrong at
`96ff84455`. They are not changes of the range, and the sections correct
them in place:

- Section 7, D12 row: a command server with no scope also gets a gate for
  an MCP apps mount, a schema profile or a tool limit
  (`server/mcp-gate-config.ts:190`, `server/drivers/turn-mcp.ts:47-50`).
- Section 3.11: Hermes is probably a fourth way that the person's own
  config reaches bots. The driver uses `HERMES_HOME`, or else `~/.hermes`
  of the person (`server/drivers/acp/hermes.ts:76-78`,
  `server/env-path.ts:217-219`, the same code at `96ff84455`). Hermes runs
  the MCP servers of its own `config.yaml` (code comment,
  `server/drivers/acp/hermes-mcp-trust.ts:3-6`). Hermes's own code was not
  read (section 9).

## 2. Files read completely

Each subagent wrote its notes to `.research/<group>.md` (not in git). Line
counts are at `96ff84455`. "Ranges" means that only the named lines were
read.

**registry**

| Path | Lines |
|---|---|
| `docs/custom-mcp-servers.md` | 638 |
| `docs/superpowers/plans/2026-08-31-03-mcp-registry.md` | 249 |
| `server/mcp-registry.ts`, test | 584, 481 |
| `server/routes/mcp-servers.ts`, test | 246, 332 |
| `server/host/mcp-servers-host.ts`, test | 261, 393 |
| `server/host/mcp-config.ts`, test | 297, 228 |
| `server/vault/mcp-keys.ts`, test | 146, 118 |
| `shared/mcp-name.ts`, test | 27, 24 |
| `packages/phone-protocol/src/mcp-request.ts`, `shared/mcp-request.ts` | 18, 1 |
| `server/testing/fake-mcp-server.ts` | 40 |
| `server/unreadable-aside.ts` | 22 |
| Ranges: `server/config.ts` (1,227) 395-440, 535-547, 680-760, 860-1000, 1190-1227. `server/config-backup.ts` 1-120. `server/index.ts` 1354, 9145, 11660-11683, 12200-12240. `server/host/mcp-chat.ts` 120-151 | |

**probe-health**

| Path | Lines |
|---|---|
| `server/mcp-probe.ts`, test | 339, 611 |
| `server/mcp-health.ts`, test | 167, 198 |
| `server/host/mcp-url-checks.ts`, test | 198, 153 |
| `server/mcp-public-url.ts`, test | 28, 55 |
| `server/mcp-environment.ts`, test | 37, 30 |
| `server/mcp-restart.e2e.test.ts`, `mcp-own-servers.e2e.test.ts`, `mcp-empty-event.test.ts` | 99, 86, 83 |
| `server/mcp-failure.ts`, test | 78, 78 |
| `server/drivers/team-tools.ts` | 19 |
| Ranges: `server/system-prompt.ts` 277-284. `server/host/connection-health-host.ts` 165-200. `server/routes/internal-mcp.ts` 220-252. `src/locales/en.json` 537-541 | |

**oauth-core**

| Path | Lines |
|---|---|
| `docs/superpowers/specs/2026-09-30-mcp-sign-in-and-plugin-catalog-design.md` | 205 |
| `docs/superpowers/plans/2026-09-30-mcp-sign-in.md` | 179 |
| `server/mcp-oauth.ts` (in two ranges, 1-450 and 450-859), test | 859, 873 |
| `server/mcp-oauth-discovery.ts`, test | 221, 219 |
| `server/mcp-oauth-store.ts`, test | 120, 48 |
| `server/mcp-oauth-refresh-races.test.ts` | 223 |
| `server/testing/fake-oauth-server.ts` | 232 |
| `docs/verification/mcp-sign-in.md` | 49 |
| Ranges: `server/index.ts` 1345-1385, 12415-12445. `server/workspace-backup-policy.ts` 30-50. `server/host/team-connections-host.ts` 340-372. `server/drivers/claude.ts` 1100-1118, 1184-1192 | |

**sign-in-flow**

| Path | Lines |
|---|---|
| `server/host/mcp-sign-in-cards.ts` | 293 |
| `server/mcp-sign-in-card.test.ts`, `.e2e.test.ts` | 424, 97 |
| `src/lib/mcp-sign-in.ts`, test | 101, 176 |
| `src/locales/mcp-sign-in-path.test.ts` | 21 |
| `src/components/ConnectorCard.tsx` | 247 |
| `scripts/verify-mcp-sign-in.ts`, `scripts/testing/mcp-sign-in-preview.tsx` | 126, 12 |
| `docs/verification/evidence/mcp-sign-in/before.png`, `waiting.png`, `authenticating.png` | viewed |
| Ranges: `server/routes/mcp-servers.ts` 1-60, 110-200. `server/index.ts` 1350-1372, 1915-1935, 2013-2025, 4610-4628, 12405-12440. `src/lib/connector-oauth.ts` 9-55. `src/lib/app-links.ts` 40-60. `electron/main.mjs` 2282-2290 | |

**proxy-bridge**

| Path | Lines |
|---|---|
| `server/mcp-remote-proxy.ts`, test | 383, 744 |
| `server/mcp-http.ts`, test, `mcp-http-framing.test.ts` | 565, 152, 190 |
| `server/mcp-sse-budget.test.ts`, `mcp-sse-disconnect.test.ts`, `mcp-strict-handshake.test.ts` | 73, 57, 203 |
| `server/mcp-proxy-cidr.test.ts` | 120 |
| `server/mcp-bridge.ts`, test, `.respawn.test.ts`, `.spawn.test.ts` | 582, 493, 195, 44 |
| `server/harness-mcp-proxy.ts`, test, `harness-mcp-request.ts`, `harness-mcp-token.ts` | 56, 197, 106, 4 |
| `server/testing/fake-http-mcp-server.ts` | 377 |
| Ranges: `server/mcp-gate-config.ts` 95-164, 196-212. `server/drivers/chat-mcp-tools.ts` 71-92, 132-139, 250-292, 375-385, 558-592, 735-745, 876-900. `server/drivers/codex.ts` 440-470. `announcements/releases.json` 1160-1200 | |

**grants-gate**

| Path | Lines |
|---|---|
| `docs/superpowers/specs/2026-09-30-per-bot-tool-scoping-design.md`, plan | 300, 172 |
| `server/mcp-bot-servers.ts`, test | 213, 221 |
| `server/mcp-bot-rules.ts`, test | 190, 194 |
| `server/mcp-grant-spec.ts`, test | 100, 205 |
| `server/mcp-gate.ts`, test, `mcp-gate-lifetime.test.ts` | 428, 549, 91 |
| `server/mcp-gate-config.ts`, test | 246, 207 |
| `packages/phone-protocol/src/tool-scope.ts`, `shared/tool-scope.ts`, `shared/tool-scope-support.ts`, `shared/tool-scope.test.ts` | 148, 1, 24, 122 |
| `server/tool-scope.e2e.test.ts`, `server/drivers/acp/tool-scope.test.ts`, `server/drivers/tool-scope-coverage.test.ts`, `server/mcp-selection.e2e.test.ts` | 190, 168, 18, 172 |
| `scripts/verify-tool-scope.ts`, `scripts/verify-pi-tool-scope.ts` | 121, 118 |
| `src/components/bot-settings/ToolSelectionCard.tsx` | 100 |
| `scripts/testing/tool-selection-ui.e2e.test.ts`, `bot-tools-ui.e2e.test.ts` | 151, 240 |
| `server/drivers/turn-mcp.ts` | 129 |
| Ranges: `src/components/bot-settings/AccessSection.tsx` (920) 1-47, 100-214, 625-759. `server/routes/bot-patch.ts` 350-374, 615-714. `server/store.ts` 1466-1505. `server/request-auth.ts` 142-170, 220-250, 705-740 | |

**engine-wiring**

| Path | Lines |
|---|---|
| `server/drivers/codex-mcp-mount.ts` | 77 |
| `server/drivers/codex-mcp-names.ts`, test | 88, 129 |
| `server/drivers/codex-mcp-startup.ts`, test | 72, 115 |
| `server/drivers/claude-project-mcp.ts` | 20 |
| `server/drivers/pi-mcp-servers.ts` | 49 |
| `server/drivers/pi-mcp-extension.ts`, test | 761, 640 |
| `server/container-mcp.ts`, test, `server/vps-container-mcp.ts`, test | 27, 163, 38, 86 |
| `server/bot-box/broker-mcp.ts`, test, `broker-mcp-refusal.ts`, test | 85, 143, 31, 157 |
| `scripts/verify-codex-mcp-startup.mjs` | 121 |
| `server/mcp-result-budget.ts` | 32 |
| Ranges: the MCP parts of `server/drivers/claude.ts`, `codex.ts`, `pi.ts`, `acp/core.ts`, `acp/copilot.ts`, `acp/cline.ts`, `acp/capabilities.ts`, `openai-chat.ts`. The message of commit `ddab4356b` | |

**other-cli**

| Path | Lines |
|---|---|
| `server/setup-import.ts`, test, `.e2e.test.ts` | 771, 761, 218 |
| `server/routes/setup-import.ts`, test | 99, 271 |
| `server/drivers/codex-shared-home.ts`, test | 159, 292 |
| `server/toml-lite.ts`, test | 300, 125 |
| `server/turn-settings.ts`, test | 141, 103 |
| `src/components/ClaudeCodeSwitches.tsx`, `shared/setup-import.ts`, `src/lib/setup-import.ts` | 57, 35, 97 |
| Ranges: `server/config.ts` 45-75, 205-220, 370-415, 575-590, 640-655, 868-960, 982-1000, 1190-1227. `server/drivers/codex.ts` 225-250, 355-380, 420-445, 1435-1450. `server/drivers/claude.ts` 136-150, 990-1015. `src/components/ImportSettings.tsx` 86-217 | |

**chat-tool-timeout**

| Path | Lines |
|---|---|
| `docs/superpowers/specs/2026-11-01-mcp-in-chat-design.md`, plan, `mockup.html` and its three images | 387, 342, 289 |
| `docs/superpowers/specs/2026-10-06-configurable-mcp-call-timeout-design.md` | 121 |
| `server/host/mcp-chat.ts` | 152 |
| `server/host/mcp-requests.ts`, test | 180, 172 |
| `server/mcp-cards.e2e.test.ts` | 82 |
| `server/routes/internal-mcp.ts` | 529 |
| `src/lib/mcp-call-timeout.ts`, test | 22, 48 |
| `src/components/McpCallTimeoutSettings.tsx`, test | 87, 105 |
| `server/mcp-result-budget.ts`, test, `src/components/McpResultBudgetField.tsx` | 32, 37, 58 |
| `src/lib/mcp-request-label.ts`, `server/drivers/agents-tool-groups.ts` | 12, 53 |
| Ranges: `server/drivers/chat-mcp-tools.ts` 40-134, 160-294, 540-619, 815-953, and its test 395-455, 1355-1379. `server/drivers/agents-catalog.ts` 455-476, 766-808. `server/drivers/agents-call.ts` 940-969. `server/app-settings/registry.ts` 40-60, 225-240. `server/host/secret-cards.ts` 373-381. `server/secret-vault.ts` 150-209 | |

**connections-ui**

| Path | Lines |
|---|---|
| `src/components/McpServersPanel.tsx` | 813 |
| its tests: `.test.ts`, `.add`, `.embedded`, `.hosted`, `.limit`, `.live`, `.sign-in`, `.translated` | 98, 575, 158, 412, 22, 66, 66, 64 |
| `src/components/McpServerEditor.tsx`, `mcp-draft.ts`, `McpSecretRows.tsx` | 234, 204, 71 |
| `src/lib/mcp-paste.ts`, test | 373, 175 |
| `src/lib/mcp-servers.ts`, test | 76, 112 |
| `src/lib/hosted-mcp-apps.ts`, test, `src/components/HostedMcpIcon.tsx` | 160, 69, 8 |
| `src/components/PluginsPanel.tsx` | 807 |
| `src/components/settings/pages/PlacePages.tsx`, `SettingsModal.connections.test.ts` | 209, 69 |
| `src/components/McpAppsSwitch.tsx`, `src/lib/connect-link.ts` | 39, 18 |
| Ranges: `DESIGN.md` (440) 1-73, 275-295, 327-390. `src/components/PluginsPanel.navigation.test.ts` 125-177, 495-545. `src/components/app/AppMessage.tsx` 225-245 | |

## 3. How it works

### 3.1 Add and test a server (Settings)

1. The person opens Apps, chooses the "MCP servers" filter and clicks "Add
   server" (`src/components/PluginsPanel.tsx:592-601`).
2. The person pastes a URL, a `claude mcp add` line, an `npx`, `uvx`,
   `bunx`, `pnpm dlx`, `yarn dlx` or `docker run` line, or a JSON block
   (`src/lib/mcp-paste.ts:58-75`, `:144-153`, `:206-218`). Section 5.2 has
   the rules of the paste.
3. The window POSTs each server to `/api/mcp/servers`, one at a time
   (`src/components/McpServersPanel.tsx:246-262`).
   - The first error stops the loop. The servers added before it stay. So a
     paste of several servers is not "all or none" here. The all-or-none
     route `POST /api/mcp/servers/import` (`server/routes/mcp-servers.ts:193-214`)
     has no caller in `src/`.
4. The route checks the request (`server/routes/mcp-servers.ts:177-190`):
   - 415 unless the content type is JSON.
   - `parseMcpServerMutation` with no existing entry. So `enabled` is false
     unless the body says `enabled: true` (`server/mcp-registry.ts:413-416`).
   - Vault item ids are kept only on a desktop that owns its Vault
     (`server/routes/mcp-servers.ts:29-35`).
5. `server/host/mcp-config.ts` writes it (`:144-157`):
   1. One busy flag guards each writer of `cfg.mcpServers`. A second writer
      gets 409 "MCP servers are already being updated." (`:99`, `:119-127`).
   2. 409 when the name is taken.
   3. The limits: 100 in all, 20 for each bot (`server/mcp-registry.ts:110-134`).
   4. The organization policy can refuse with 403 `managed_policy`
      (`:135-140`).
   5. Vault items are given to the server (`keys.grant`, `:151`).
   6. `persistMcpServers` saves `config.json` and then sets the memory copy
      (`server/index.ts:11679-11682`).
   7. The app catalog, the health checks and the `mcp.changed` broadcast are
      told. The reply is 201 with the full list.
6. The window tests each added server: `POST /api/mcp/servers/<name>/test`
   (`McpServersPanel.tsx:215-236`). At most two tests run at a time. A
   third gets 429 "Two MCP connection tests are already running."
   (`server/host/mcp-config.ts:98`, `:249-251`).
7. The probe (`server/mcp-probe.ts`):
   - A command server starts with no inherited credentials. It must answer
     the handshake and `tools/list` in 8 s. A URL server gets 30 s
     (`:59-60`, `server/mcp-http.ts:41`). Each exit kills the process tree
     and clears the timer (`:269-276`, `:315-317`).
   - It returns at most 100 tools, names cut to 200 characters,
     descriptions to 500, and `total` (`:57-58`, `:103-113`). It reads at most
     32 MiB.
   - Errors have a `reason`: `keys`, `unreachable` or `timeout`
     (`:20-22`, `:210-228`). Child stderr, env values and header values
     never reach the UI. A value that the server echoes back is redacted
     (`:77-113`).
   - Sign-in detection: when the probe sends no credential, it calls a fake
     tool `<product>.sign-in-check` (5 s). On a person's Test only, it can
     then call one read-only, non-destructive tool that has at least one
     required argument, with no arguments. Only a 401 with an RFC 9728
     protected-resource document means "sign in" (`:37-39`, `:144-184`).
   - A 401 after a Bearer that it sent marks "needs sign-in". A 401 with no
     Bearer only marks "requires sign-in", so a probe never signs anyone
     out (`server/host/mcp-config.ts:286-290`).
8. When the test passes, the window sends PATCH `{enabled: true}`
   (`McpServersPanel.tsx:215-236`). A click on the switch in the next 1.5 s
   is ignored ("{name} is on: it passed its test a moment ago.", `:54`,
   `:307-309`).
9. When exactly one server was added and the test says
   `auth: "required"`, the sign-in starts at once (`:268`).

Edge cases:

- A switch click turns a server on with no test (`McpServersPanel.tsx:306-329`).
  So "A new server is turned on once it answers" (`en.json:6154`) is true
  only for add. A test shows that a server whose personal key failed can be
  switched on by hand (`McpServersPanel.add.test.ts:503-531`).
- A person's Test gives a package runner (`npx`, `uvx`) only the default
  8 s, but the start check of a turn gives it 120 s
  (`server/host/mcp-servers-host.ts:54-57`, `:129`,
  `server/host/mcp-config.ts:285`). So a first Test of an `npx` server can
  time out while the background check passes. This is an inference.
- A boxed Test (a bot box on Linux) goes through the credential broker. When
  the broker path fails and the direct path works, the reply says the fault
  is "on our side" (`server/host/mcp-config.ts:74-87`).

### 3.2 Edit, restart and remove

1. **Edit** (`PUT /api/mcp/servers/<name>`, `server/routes/mcp-servers.ts:216-243`):
   - 404 when the name is not saved. 400 when the saved entry does not
     parse. A hand-broken entry cannot be edited, only removed.
   - A secret value of `true` means "keep the saved value". A key left out
     is deleted (`server/mcp-registry.ts:237-238`, `:268-269`, `:324-339`).
     `true` with no saved value fails "No saved value exists for <KEY>."
   - The OAuth client secret is kept only when the client id stays the same
     (`:276-290`).
   - The sign-in is dropped when the URL changes, when the client id or the
     scopes change, or when the state is already "needs-sign-in". A new
     client secret alone keeps it (`server/host/mcp-config.ts:193-200`).
   - The PUT body is not filtered by `mcpServerBody`, so a PUT may set `bot`
     and `apps` (`server/routes/mcp-servers.ts:239-240`). Not verified as
     intended.
2. **PATCH** takes exactly one boolean key, `enabled` or `apps`
   (`:232-237`). Turning on checks the policy. Turning off never does
   (`server/host/mcp-config.ts:203-214`).
3. **Restart** writes nothing. It bumps a restart count. The next turn adds
   `OMB_MCP_RESTART=<n>` to the spec of a command server, so an engine that
   keeps a warm process starts a new one
   (`server/host/mcp-servers-host.ts:98-105`, `:165-168`). Codex starts new
   children each turn, so `perTurnCustomMcp` removes that variable for it
   (`server/mcp-registry.ts:171-185`).
4. **Remove** (`server/host/mcp-config.ts:229-241`): persist the map without
   the server, then forget its Vault grants, its sign-in, the member keys
   (Team Cloud) and the app catalog entry.
   - Order gap: `remove` has no `finally`. If forgetting the Vault grants
     throws, the sign-in is not forgotten. `botDeleted` uses a `finally` for
     this (`server/host/mcp-servers-host.ts:228-241`).
   - Order gap: `add` and `replace` give Vault items before the save
     (`server/host/mcp-config.ts:151-152`, `:188-189`). A refused save
     leaves a grant for a server that was not saved.

**Vault pointers** (`server/vault/mcp-keys.ts`). An env value, a header value
or a client secret can be `vault:<id>`, also inside text such as
`Bearer vault:<id>` (`:11-12`, `:72-81`).

- A pointer is read only for a server that the item was given to. A pointer
  that a bot typed reads nothing (`:4-5`, `:55`).
- It is read only for a bot that the item allows (`:59`, `:66`). A Team
  Cloud member's own secret is never a server key (`:64-65`).
- A header value or a client secret with a line break is refused (`:77`).
- A plain header value (not a pointer) is trimmed on save and on read since
  v0.1.184. A save refuses a value that Node cannot send. A stored bad
  value is read as it is, and only its own request fails
  (`server/mcp-registry.ts:204-206`, `:393-397`, change 15).
- A value from a linked password manager is kept in memory for 15 minutes
  and read again after 5 (`:15-16`).
- When a key cannot be read, the server is off for that bot. The reason is
  one of three texts: "its key is no longer in the Vault.", "its key in the Vault
  is kept to other bots. …" or "its key could not be read from the linked
  password manager." (`:45-47`).

### 3.3 Which servers start for a turn

`server/host/mcp-servers-host.ts` decides, for each bot, what a turn mounts
(`mounted`, `:173`).

1. The engine must have the capability flag `customMcp === true`. Else the
   bot starts no servers (`server/index.ts:1354`). The flag is set by the
   drivers of Claude, Codex, Pi, Muse Code, each ACP engine, and the chat
   driver when its tools are on (`server/drivers/claude.ts:1942`,
   `codex.ts:1537`, `pi.ts:943`, `muse-code.ts:649`,
   `acp/capabilities.ts:8`, `openai-chat.ts:952`).
2. `configured(bot)` = the organization policy over
   `customMcpServers(cfg, bot.mcpServers, bot.id)` (`:108`). That function
   skips a server that is off, runs on another computer, or belongs to
   another bot (`server/config.ts:1212-1227`). A bad entry is logged once
   for each name and reason (`:1204-1220`).
3. `keyed(bot)` resolves the Vault pointers. A server whose key fails is off
   for that bot (`:110-118`).
4. The start check of command servers (`server/mcp-health.ts`): at most two
   checks at a time for all bots (`:21` at `e1cc6a290`). A failed server is
   checked again after 30 minutes, a working one after 6 hours (`:16-17`).
   A turn waits only for the first check of each server. Since v0.1.186
   (change 1), a check that only times out is no verdict:
   - The server stays in turns, and the person and the bot hear nothing.
   - The next check is after 1 minute (`RECHECK_TIMEOUT_MS`, `:18`, `:86`).
   - The record counts the timeouts in a row (`timeouts`, `:92-95`). At 3
     (`TIMEOUTS_FOR_A_VERDICT`, `:20`, `:83-84`), the server is off, as
     after a failure of another kind, and the next check is after 30
     minutes.
   - A pass, a failure of another kind, an edit or restart (`changed`,
     `:165-170`) or a new start key ends the count.
   - There is no timer. A check runs before a turn (`:130-140`), at boot
     (`:172-174`) and when an engine reports a failed server
     (`engineFailed`, `:160-163`). So 3 timeouts need at least three
     checks more than 1 minute apart (derived, not run).
   - The time limit of one check is 8 s, or 120 s for a package runner
     such as `npx` (`server/mcp-probe.ts:59`,
     `server/host/mcp-servers-host.ts:55-58`). The state is in
   `<data>/mcp-health.json` (0600). The key is a SHA-256 of the command,
   arguments, environment and the size and time of each named file.
5. The URL check (`server/host/mcp-url-checks.ts`): only HTTP 405 to
   `initialize` turns a URL server off, and only when a GET does not answer
   with an event stream (`:20`, `:38-52`, `:65-70`). A 404, a redirect, a
   timeout or a 401 keeps it. A server that is off and then times out stays
   off: "a timeout proves nothing" (`:135-141`).
   - The check never follows a redirect, "so a server's keys never reach
     another address" (`:31-33`).
   - It never contacts a server that the policy blocks, and it never checks
     a person's own server (`server/host/mcp-servers-host.ts:141-145`).
6. The restart count is added (`:165-168`).
7. The person hears about a server that does not start one time, as a
   notice. The bot hears it on each turn in the system prompt: "The MCP
   server "X" is off for you because it doesn't start for you (<error>);
   it is tried again on its own." (`server/system-prompt.ts:277-284`).
   Since v0.1.186 a server that only timed out is "off" only at the third
   timeout in a row. The notice is sent one time for each start key: `told`
   is not cleared after a pass (`server/mcp-health.ts:96-97`).
8. The OAuth step: `withMcpSignIn` adds the Bearer token to each signed-in
   URL server, and drops a server whose token is null
   (`server/mcp-oauth.ts:843-859`, section 3.7).

A person's server can also run outside a turn since v0.1.184: a bot page
can call its tools through the shared app connection (change 17,
`server/chat-apps-mcp.ts:348-376`, section 3.6).

### 3.4 How each engine gets the servers

| Engine | How | Reference |
|---|---|---|
| Claude Code | A temporary `mcp.json` (0600) under the temp folder, given with `--mcp-config` and `--strict-mcp-config`. Removed when the turn settles. URL servers in the file directly, unless a gate is necessary. The project's `.mcp.json` servers merge last, never for a guest. After the tag v0.1.186 (change 5): when `system/init` lists a custom server as `failed`, the session closes after the turn, and the next turn starts a new process with `--resume`. Claude Code connects MCP servers only when its process starts | `server/drivers/claude.ts:1064-1086`, `:1103-1107`, `:842-849` (at `96ff84455`; `:999-1021` at `e1cc6a290`), `claude-project-mcp.ts:4-6`; retire: `claude.ts:1293`, `:1375` |
| Codex | `-c mcp_servers.<m>.command/args/env_vars`. Only the env names are in argv. The values are in the env of the app-server. A URL server goes through the remote proxy with one private env record `OMB_REMOTE_MCP_CONFIG_<64 hex>`. That family of variables is kept out of the shell | `server/drivers/codex-mcp-mount.ts:26-33`, `codex.ts:453-463`, `:99`, `:524-535` |
| ACP engines | `session/new` and `session/load` `mcpServers`, env as name and value pairs. Each URL server first becomes the remote proxy. Copilot and Cline get a 0600 file each, kept for each thread until the instance is disposed. Since v0.1.186 (change 12): after a model refuses an image, each server of the next turns gets `OMB_MCP_TEXT_ONLY=1`, and own servers stay on stdio. Since v0.1.182 (change 13): on Gemini CLI and Antigravity each command server goes behind the gate | `server/drivers/turn-mcp.ts:21-22`, `:40-50` (`:23-24`, `:42-52` at `e1cc6a290`), `:115-125`, `acp/copilot.ts:246-269`, `acp/cline.ts:193-223` |
| Pi | A 0600 file in `OMB_MCP_CONFIG`, removed when the turn settles. URL servers go through the proxy in directory form. A command server has 8 s to start. After the tag v0.1.186 (change 6), only the `agents` server gets 20 s, or 30 s on a Cloud | `server/drivers/pi.ts:397-431`, `pi-mcp-servers.ts:37-46` (`:38-49` at `e1cc6a290`), `pi-mcp-extension.ts:107` |
| Chat driver | It is the MCP client itself. More than 32 servers throws. Each URL server goes through the proxy in directory form | `server/drivers/chat-mcp-tools.ts:562-567`, `:577-594` |

Codex details (`server/drivers/codex-mcp-names.ts`, `codex-mcp-startup.ts`):

- A custom name that is already in the person's `config.toml` gets a product
  suffix, because a merged stdio-and-URL entry "kills the turn"
  (`codex-mcp-names.ts:1-3`, `:83-88`).
- A server that `config.toml` already runs the same way is not mounted twice
  (`:70-81`).
- On Codex 0.117.0 or later, the driver waits up to 30 s for
  `mcpServer/startupStatus/updated`. `failed` and `cancelled` count as
  settled. A timeout lets the turn start (`codex-mcp-startup.ts:2-12`,
  `:49-70`). The driver holds its launch slot during this wait
  (`codex.ts:549-551`, `:1358-1369`), so one slow server delays the start
  of other Codex bots.

One ACP engine with a tool selection waits for its selected MCP catalog
before it sends the prompt. Since v0.1.186 the limit is 30 s
(`REMOTE_MCP_STARTUP_MS`), not 10 s (`server/drivers/acp/grok.ts:584`,
`:603`, change 3).

**Why one engine is an exception (v0.1.101).** The commit `ddab4356b` says
that each engine except Claude Code reaches URL servers through the
reference project's connector. The code gives the reason. Other engines' MCP clients
add initialize fields that strict servers refuse. But "Claude Code 2.1.292
sends only spec-defined initialize fields (2025-11-25), so strict servers
accept it, and it keeps its MCP tool search for big catalogs"
(`server/drivers/claude.ts:1065-1068`, `:1000-1003` at `e1cc6a290`;
`server/mcp-remote-proxy.ts:1-2`).
`server/mcp-strict-handshake.test.ts:106-124` replays real Codex and Claude
Code handshakes to prove that no engine field reaches the remote server.

**Bot box** (Linux sandbox, seam). URL headers stay in the credential broker.
The engine sees `http://127.0.0.1:<port>/b/<token>/mcp-<name>` with no
headers (`server/bot-box/broker-mcp.ts:1-6`, `:34-68`). The env secrets of a
command server still reach the engine (`broker-mcp.test.ts:34`).

### 3.5 The remote proxy

`server/mcp-remote-proxy.ts` is a stdio MCP server process. It forwards each
request to one remote server through `RemoteMcpClient` (`:167-178`).

1. Settings arrive in env, or in one private env record named by
   `--config-env`, "because Codex hands every MCP child one shared
   environment" (`:66-84`). The proxy deletes them from its env after it
   reads them. Credentials never go in argv
   (`server/mcp-remote-proxy.test.ts:154-155`).
2. A bad setting exits with code 1 and a fixed text on stderr. "A selection
   that cannot be read must never widen to all tools" (`:86-110`).
3. The proxy does its own `initialize` with protocol `2025-06-18` and client
   name "<product> tool proxy" (`:200`). It removes the engine's
   protocol-version `_meta` from each request, except `server/discover`
   (`:184-195`).
4. For each request (`handle`, `:318-359`):
   1. Not JSON: `-32700`. Not a request: `-32600`. A duplicate id: `-32600`.
      Since v0.1.182 (change 11) a frame ends only at `\n`. Before, the
      reader also cut a frame at U+2028 or U+2029 inside a string, so both
      halves got `-32700` with `id: null` and the real request got no
      answer (`server/stdio-lines.ts:7-41`, `mcp-remote-proxy.ts:367-375`
      at `e1cc6a290`).
   2. `notifications/cancelled` aborts the pending request and is sent
      upstream with the proxy's own id (`:324-328`).
   3. Deadline: 30 s for each method except `tools/call`. `tools/call` gets
      120 s in directory mode and **no deadline of its own** otherwise
      (`:338-340`, `:341-343` at `e1cc6a290`; still true). The comment
      says: "Engines keep their own tool-call deadline (Gemini CLI and Qwen
      Code wait ten minutes) and cancel through this proxy."
   4. A `tools/list` result goes through the schema profile and the tool
      count limit (`:344`). Since v0.1.184 it then goes through the session
      share of the native Antigravity CLI (`:350` at `e1cc6a290`, change
      14).
   5. Since v0.1.186, with `OMB_MCP_TEXT_ONLY=1`, each image of a
      `tools/call` result becomes a text note (`:347-349`, change 12).
5. Errors (`:345-357`):
   - HTTP 401: a fixed text that tells the engine to send the message again,
     because "<product> refreshes sign-ins when a message starts"
     (`:52-54`). The proxy never refreshes a token itself.
   - 403, 404, 429, 5xx and "unreachable": one fixed sentence each
     (`:143-152`).
   - Before the proxy relays a remote error text, it replaces the URL parts
     and header values with «redacted». It removes the secret patterns and
     cuts the text to 1,000 characters (`:117-141`).
6. Directory mode reads the whole catalog once, in 120 s and at most 100
   pages, and lists three tools (`:156-157`, `:221-239`). A
   `notifications/tools/list_changed` clears the cached catalog
   (`:170-177`).
7. On stdin close, SIGTERM or SIGINT, it aborts the pending requests and
   exits 0 (`:371-383`).

`server/mcp-http.ts` is the HTTP client:

- `MAX_REMOTE_MCP_BYTES` is 32 MiB, up from 1 MiB, because one server's tool
  list of 425 tools is 1.2 MB (`:37-38`). It applies to one JSON reply, to
  the stream of one SSE reply, and to each event of the old SSE transport
  (`:148-174`, `:183-201`).
- A ping from the server gets `{}`. Each other request from the server gets
  `-32601` at once (`:453-472`).
- The old SSE transport has one GET stream for all replies. When it ends,
  each pending and later request fails. There is no reconnect
  (`:355-451`, `server/mcp-sse-disconnect.test.ts`).
- The URL check accepts http or https with no user info (`:66-69`). There is
  no filter of private addresses, and the POST follows redirects by default
  (`:312`).

`server/mcp-bridge.ts` is not on this path. It is the relay of the computer
tools (seam: computer lending). `server/harness-mcp-*.ts` serve the
project's own tool families (seam: agent-tools).

### 3.6 Grants for each bot, and the gate

**The server list of a bot** (`mcpServers` in the bot row of `<data>/bots.json`):

1. `PATCH /api/bots/:id {mcpServers}`: absent keeps the list, `null` means
   every server that is on, `[]` means none. More than 20 gives 400 "Select
   at most 20 MCP servers." (`server/routes/bot-patch.ts:352-374`).
2. The settings card writes an explicit list on the first switch click, "so
   servers added later never silently reach this bot"
   (`src/components/bot-settings/AccessSection.tsx:131-134`). Before that
   click, a server that the person turns on reaches each bot with no list
   (`scripts/testing/bot-tools-ui.e2e.test.ts:190-193`).
3. A server can have an owner bot (`bot: <id>`). It then starts only for that
   bot (`server/mcp-bot-servers.ts:147-162`). On a first boxed start, a
   server whose files are in one bot's folders becomes that bot's own, and
   the person hears it once (`server/host/mcp-servers-host.ts:244-254`).

**The tool scope** (`toolScope` in the same row,
`packages/phone-protocol/src/tool-scope.ts`):

1. Selectors: `native:<name>`, `native:*`, `mcp:<server>:<name>`,
   `mcp:<server>:*`. At most 256 for each list, at most 1,024 characters
   each (`:19-20`). Exact names only. No case folding (`:65-70`).
2. A tool is allowed when `allow` is absent or one allow entry matches, and
   no deny entry matches (`:72-75`). `allow: []` allows nothing.
3. A malformed scope allows nothing (`:89-92`). A corrupt stored scope blocks
   the turn with 409 "This bot's tool selection is invalid. …"
   (`server/index.ts:2868-2874`).
4. A wider scope goes live only after its save to disk. A narrower one goes
   live at once, "even when the disk write fails"
   (`server/store.ts:1477-1501`).
5. Only the owner changes it. A paired client session gets 403
   (`server/tool-scope.e2e.test.ts:51-53`). A bot cannot change it through
   its tools.
6. Known gap, stated in the code: outside the packaged desktop, a loopback
   caller is the owner, and "A shell can forge an Origin header". A
   loosening with no `Origin` header is refused only while any bot is busy
   (`server/routes/bot-patch.ts:619-620`, `:636`, `:650-657`; at
   `e1cc6a290` the same code is at `:637-638`, `:654`, `:668-675`).

**The gate** (`server/mcp-gate.ts`), when a scope applies:

1. The scope is parsed before the server starts. A bad scope exits with
   code 1: "corrupt policy must never become pass-through" (`:56-65`,
   `:212-213`).
2. Each `tools/list` page is filtered, `nextCursor` stays (`:393-401`).
3. A `tools/call` to an excluded tool gets `-32602` "Tool selection excludes
   this tool. Check the bot's Access settings." The server never sees it
   (`:310-323`, `:317-330` at `e1cc6a290`).
4. A bad frame, a duplicate id or a reply to an unknown id ends the
   connection (`:333`, `:363-372`). Before v0.1.182, a legal frame with
   U+2028 or U+2029 in a string counted as a bad frame. On a scoped
   connection the gate then exited, and the server was gone for the rest of
   the turn. Since v0.1.182 a frame ends only at `\n` (change 11,
   `server/mcp-gate.ts:298`, `:363` at `e1cc6a290`).
5. The `OMB_GATE_*` variables are removed from the server's env (`:225-226`).
   Since v0.1.184 `OMB_TOOL_LIST_SHARE` and `OMB_TOOL_LIST_RECORD` are
   removed too (`:229-233` at `e1cc6a290`).
6. A scoped server that cannot have a gate throws. It never runs without a
   gate (`server/mcp-gate-config.ts:186-207`).
7. Since v0.1.182, under a schema profile, the gate shortens the schema of
   each listed tool. A tool that is still over the limit at its shortest
   form is left out of the list, with one stderr line
   (`server/mcp-tool-schema.ts:116-120`, change 13). Before, only Kimi and
   Moonshot models had a profile. Now Gemini CLI and Antigravity have one
   too (`server/tool-schema-profile.ts:30`, `:55`).
8. Since v0.1.184, on the native Antigravity CLI, the gate writes the full
   list to a record file and fits it into a byte share (`:420-422` at
   `e1cc6a290`, change 14).
9. Since v0.1.186, with `OMB_MCP_TEXT_ONLY=1`, the gate replaces each image
   of a `tools/call` result with a text note (`:424-426` at `e1cc6a290`,
   change 12). A person's command server with no gate gets the variable,
   but no process reads it, so its images still reach the model. This is
   derived from `server/drivers/turn-mcp.ts:47-50` and was not run.

A command server with no scope goes behind the gate also for an MCP apps
mount or a schema profile (`server/drivers/turn-mcp.ts:47-50`). The first
read missed this. Since v0.1.182 Gemini CLI and Antigravity have a schema
profile, so on these engines each command server has a gate.

In a scoped turn, each server with no allowed tool is dropped, and each other
server goes behind a gate (`server/drivers/turn-mcp.ts:54-60`). The gate is
safe only when the engine loads no other servers. Claude Code throws
unless it runs isolated with `--strict-mcp-config` (`claude.ts:1003-1008`).
Codex disables the servers of its own config (`codex.ts:442-443`).

Which engine supports which scope is a table keyed by the driver kind
(`shared/tool-scope-support.ts:4-9`), not a capability flag. A test checks
that each driver kind has a row (`server/drivers/tool-scope-coverage.test.ts:6`).

A selected tool still needs approval in a turn. The scope does not
pre-approve (`scripts/verify-pi-tool-scope.ts:111`). "Always allow" keys for
MCP tools have the form `provider-tool:<instance>:<server>:<tool>:<16 hex>`,
hashed from the spec as `config.json` holds it, with no key value and no
restart count (`server/mcp-grant-spec.ts:12`, `:17-25`).

- Since v0.1.182 (change 16), Hermes can also save "Always allow" for a
  server that only its own `config.yaml` has. The 16 hex are then the hash
  of `{engineOwn: "hermesAgent", server}`, so an edit of that server in
  `config.yaml` keeps the grant. Only a rename ends it
  (`server/provider-tool-allow.ts:12-21`). The set of such engines is keyed
  by driver kind (`OWN_MCP_CONFIG`, `:13`).
- Since v0.1.184 (change 17), a bot page can call a tool of the person's
  server outside a turn. The page declares `mcp:<server>:<tool>`. The
  server, the scope, the on state and the sign-in are checked as for a turn
  (`server/chat-apps-mcp.ts:348-376`). But approval is different: a tool
  that the server marks `readOnlyHint: true` runs with no approval and no
  click, at each access level. Each other tool needs Full access and a
  recent click (`server/connector-gate.ts:310-315`).

### 3.7 OAuth sign-in

`McpOAuthManager` (`server/mcp-oauth.ts:224`) owns the flows, the loopback
listeners and the refresh.

**Start** (`start`, `:301-321`, and `begin`, `:569-615`; `begin` is at
`:571-617` at `e1cc6a290`):

1. A waiting flow of another owner gives 409 "A sign-in is already in
   progress in another browser." The same owner and URL gets the same flow
   (`:307-308`).
2. Discovery (`server/mcp-oauth-discovery.ts:141-198`): the `WWW-Authenticate`
   hint of a 401, then the RFC 9728 protected-resource addresses, then RFC
   8414 or OpenID metadata. S256 is required. The issuer must match.
   - Each fetch has 5 s and at most 64 KB, and refuses redirects
     (`:23-24`, `:109-129`).
   - An SSRF guard: a public server cannot point a fetch at a loopback,
     private or plain-http address (`:45-74`, `:47-76` at `e1cc6a290`).
   - Scopes come from the protected-resource document, plus
     `offline_access` when the authorization server offers it (`:202-206`).
   - Since v0.1.186 discovery also reads
     `client_id_metadata_document_supported === true` into
     `clientIdMetadataDocument` (`:13-14`, `:217` at `e1cc6a290`, change
     10).
3. No metadata: `not-oauth` "This server does not offer an OAuth sign-in. Add
   its token as a header instead." (`server/mcp-oauth.ts:573`). The same
   code comes when a discovery fetch fails for now: `getJson` returns null
   for a non-2xx reply and for a thrown error
   (`server/mcp-oauth-discovery.ts:112-115`, `:134-136` at `e1cc6a290`). So
   the reference project cannot tell "no OAuth" from "discovery failed this
   time".
4. The client is a pre-registered app from the config, or a new client.
   Dynamic client registration (RFC 7591) makes a new client for each
   sign-in, "because authorization servers prune idle clients"
   (`:534-567`). No registration endpoint and no app: `no-registration`.
   Since v0.1.186 its text has two forms (`server/mcp-oauth.ts:537-541` at
   `e1cc6a290`, change 10). A server with `clientIdMetadataDocument` gets
   "This server signs in apps by a published app ID (a client ID metadata
   document), which <product> doesn't support yet." Each other server gets
   the old text "This server only signs in apps registered with it in
   advance. Edit the server and add that app's client ID under Sign-in
   app." The reference project does not implement a client ID metadata
   document.
5. Where the browser comes back:
   - A pre-registered app with its own https `redirectUri`: the public
     callback route, no listener (`:576-586`).
   - A browser on another computer with a known https origin:
     `<origin>/mcp-oauth/callback` (`:588-597`).
   - Else a loopback listener on `127.0.0.1`, port
     `20000 + fnv1a(url) % 20000`, or any free port when that one is busy
     (`:100-107`, `:618-640`). A pre-registered app with a fixed port gets
     `port-busy` instead.
6. The authorization address has PKCE S256 with a 32-byte verifier and
   state, and `resource` (RFC 8707) (`:691-701`). A remote browser that must
   use the loopback listener gets `pasteBack: true` (`:708`).
7. The flow lives 5 minutes (`:51`, `:712`).

**Callback** (`acceptCallback`, `:752-776`). One check covers the listener,
the public route and the paste:

1. An ended, used or replaced flow: 409 "This sign-in has ended or is already
   being completed. Start again if needed."
2. The address must pass each of these checks:
   - the same origin and path as the redirect.
   - no user info and no fragment.
   - each parameter only once.
   - the state equal, compared in constant time.
   - `iss` equal to the issuer (RFC 9207).
   - one code of at most 4,096 characters, or one error.
3. A mismatch: 400. A wrong state does not use up the flow, so the person can
   paste again.
4. The code exchange sends `code_verifier` and `resource` (`:783-789`). If the
   flow ended during the exchange, the new token is revoked and the result is
   409 (`:792-799`).
5. The callback page never shows the code or the server's text (`:740`). Its
   headers are `no-store` and `no-referrer` (`:720-724`).

**From another computer** (`completeCallback`, `:356-371`). The person pastes
the address that the browser could not load. It is at most 16,384 characters.
The server parses it and never fetches it. Paste-back is in Settings only.
The chat card refuses it with "Finish this sign-in in Apps → MCP servers."
(`server/host/mcp-sign-in-cards.ts:160-162`). A flow belongs to its owner (a
session id, "loopback", or a card). Another owner gets 404
(`server/mcp-oauth.ts:329-331`, `:357-361`). Logout cancels the flows of that
session (`server/index.ts:4622-4623`).

**Refresh** (`:401-516`):

1. `accessToken` returns the stored token when more than 2 minutes are left
   (`:52`, `:405`).
2. Two callers on the same record share one request (`:446-460`).
3. The store marks the refresh token spent on disk before the request
   (`:481-482`). The reason: a server that rotates refresh tokens revokes
   the whole grant when it sees one twice (`:471-474`).
4. `invalid_grant` or `invalid_client` with 400 or 401: "needs sign-in", the
   tokens are dropped (`:500-509`). A 429 or 503 keeps the token
   (`:502-507`).
5. A connection that never opened clears the spent mark. A reply lost after
   the send keeps it spent, so the next refresh ends the sign-in
   (`:493-495`, `server/mcp-oauth-refresh-races.test.ts:132-147`).
6. A new sign-in during a refresh wins. The late reply is ignored
   (`:494`, `:497`).
7. After an engine gets a 401, `tokenRefused` forces a refresh, at most once
   in 60 s (`:416-426`).
8. A server whose token cannot be refreshed is dropped from the turn (`:851`).

**Sign out** deletes the record first and then revokes the token, best
effort (`:385-393`).

### 3.8 The Sign in card in the chat

`server/host/mcp-sign-in-cards.ts`:

1. The bot calls `mcp_server` `sign_in`. An older open card of the same bot
   for the same server is set aside and its flow is cancelled (`:241-247`).
2. A message of kind `connector` with `source: "mcp"` and
   `status: "required"` is posted (`:249-256`). The flow owner is
   `card:<thread>:<message>`.
3. **Authorize** (`:150-182`): a shared server needs the admin scope. A Team
   Cloud personal server needs the person of the turn. A pre-registered app,
   or a remote browser with no https origin, gets 409 "finish this sign-in in
   Settings". Then the card is `authorizing` and only the client that asked
   gets the URL. The URL and the state never go into a message (`:3-4`).
   When the start fails (`:174-180` at `e1cc6a290`):
   - `no-registration` (change 7, v0.1.186): the card becomes `failed` with
     the reason, and the reply is 400 with the code. The bot hears
     "<product> MCP sign-in for <slug>: <reason> Nothing was signed in."
     one time (`failedText`, `:60`; `unreachable`, `:194-200`). The reason
     is a fixed text of the code, never the server's text. Before
     v0.1.186, each start error gave a 400 that only the tapping client
     saw. The card stayed on "Sign in", and the bot waited until "Not now".
   - `not-oauth` and `port-busy` (change 9): a 400 to the tapping client
     only. The card does not change and the bot hears nothing, so the
     person can tap again. A server that truly has no OAuth therefore
     stays retryable with no end (derived, not run).
   - A registration that the server refuses: a 502 with the server's
     `error_description` to the tapping client only (`:180`,
     `server/mcp-oauth.ts:216-222`). Not changed in the range.
   - The client shows a failed card with the error in red and a "Try
     again" button (`src/components/ConnectorCard.tsx:210-211`, `:240`). A
     second tap fails the same way and tells the bot nothing more.
4. **Settle** (`:275-282`): `succeeded` makes the card `connected` and
   resumes the bot. `expired` and `failed` put it back to `required`.
5. The bot hears fixed text with the server name only: on, off ("call
   mcp_server enable") or unreachable (`:79-84`). Since v0.1.186 a failed
   start adds a fourth text with a fixed reason (`:60`). A turn that parks
   after the card failed hears it too: `parkedAnswer` returns it (`:296` at
   `e1cc6a290`, change 8), through `reconcileParkedNode`
   (`server/index.ts:1927-1932`). The stored error is in the language of
   the chat, but a turn that was already parked hears English (`:195`,
   `:197`). So a turn that parks late can hear a translated text for a
   server that is gone (derived, not run).
6. "Not now" tells the bot "didn't sign in". After a restart, the next status
   poll puts the card back to `required` (`:217-231`).

Gaps found:

- **A stale link.** The card keeps the authorization URL in state and reuses
  it for 10 minutes without a call to the server
  (`src/components/ConnectorCard.tsx:96-98`,
  `src/lib/connector-oauth.ts:9-12`). The server flow ends at 5 minutes. So
  from minute 5 to minute 10, "Sign in" opens a dead link. No test covers
  this. Checked in the code.
- **Stop does not cancel the flow.** Stop sets `stopped`, but
  `isCardOwnerLive` checks only `dismissed`
  (`server/index.ts:2013-2025`, `server/host/mcp-sign-in-cards.ts:73-76`;
  `:2014-2026` and `:75-78` at `e1cc6a290`). So a sign-in can still finish
  after Stop, until the 5 minutes end. Not changed in the range.

### 3.9 The `mcp_server` tool

The tool is on the shared `agents` server, so each engine can call it. It is
in `CORE_TOOLS` and in all 33 golden profiles
(`server/drivers/agents-tool-groups.ts:36`). The proxy POSTs the arguments to
`/api/internal/mcp-servers` with the bearer of the turn
(`server/drivers/agents-call.ts:958-962`).

The route (`server/routes/internal-mcp.ts`):

1. The bot is the bearer's bot, never a body field (`:42-43`). A guest-driven
   thread gets 403 for each action (`:28`, `:110`).
2. `bot`, `runsOn`, `apps` and `enabled` are removed (`:165`). A `vault:`
   value that the bot typed is refused (`:166-167`). The route does not check
   the JSON schema of the catalog.
3. Another bot's server: 403. A shared server on a Team Cloud needs an admin
   (`:177-186`).
4. The action matrix:

| Action | Full access | Below Full access | Card |
|---|---|---|---|
| list | runs | runs | none |
| add | saves, turns on, tests | saves off and shows a Turn on card, **except** a URL server on public https with no `runsOn`, which turns on at once (`:235-242`) | Turn on |
| update | applies, tests when on | Change card | Change |
| enable | applies, tests | Turn on card | Turn on |
| disable, restart, sign_out | apply | apply | none |
| test | tests, also a server that is off | refused on a server that is off (`:437-438`) | none |
| sign_in | Sign in card | Sign in card | Sign in |
| remove | applies | Remove card | Remove |

5. "Public https" means each DNS address of the host is public. Local names
   (`.local`, `.internal`, `.lan`, `.home.arpa`, `.ts.net`, `localhost`)
   need the card (`server/mcp-public-url.ts:12-28`).
6. Add and enable put the server on the bot's own `mcpServers` list when the
   bot has one (`joinBotList`, `:248`, `:486-488`). A bot with no list gets
   each server that is on. The reply names the other bots that get it too
   (`:494-500`). The tool scope is never widened (`:490-492`).
7. Secrets arrive as one-use `secretRef` values from `request_credential`, only
   in `env`, `headers` and `oauth.clientSecret`, for the same bot and thread
   (`server/host/secret-cards.ts:373-381`). But `redeem` swaps only refs and
   leaves a literal string as it is (`server/secret-vault.ts:165-175`). So a
   key that a bot types in clear text is saved in `config.json`. Only the
   tool description forbids it.
8. A card answer runs the action again as Full access. It fails when the
   server changed since the card (a SHA-256 of the masked target), when the
   server is gone, or when the held `secretRef` expired (`:377-391`). The
   fields of a Change card are in memory only, so a restart expires it
   (`server/host/mcp-requests.ts:9-10`, `:165-167`).
9. The bot sees masked addresses: no user info, no query, and long key-like
   path segments become `…`. Arguments after `--token`, `--api-key` and the
   like show as `***` (`server/mcp-bot-rules.ts:111-128`).
10. A changed URL drops the saved headers, the client secret and the sign-in
    (`server/mcp-bot-rules.ts:66-95`).

### 3.10 The MCP call timeout

1. The setting is `mcp.callTimeoutMinutes` in `config.json`: a whole number
   from 1 to 60, default 10 (`server/config.ts:51-53`, `:65-73`).
2. Each turn carries `mcpCallTimeoutMs` (`server/turn-settings.ts:138`,
   `server/contracts.ts:234-235`).
3. Only the chat driver reads it (`server/drivers/openai-chat.ts:614`).
   Codex and Pi use 960 s for the `agents` server, and Claude Code
   and the ACP engines set none (`codex.ts:488`, `pi-mcp-extension.ts:84`).
4. On a timeout, the chat client sends no `notifications/cancelled`. It sends
   that only on Stop (`chat-mcp-tools.ts:275-280`). It kills the process
   tree of the server: TERM, then KILL after 5 s, 15 s on Windows
   (`:203-222`, `:287-289`). For a URL server, this kills the local proxy.
5. The bot sees `ok: false` with "MCP request timed out; execution outcome
   may be uncertain That was the MCP server "X". It is stopped for the rest
   of this turn; your other tools still work." (`:85`, `:893`).
6. A timeout on a required server (`agents`) ends the whole turn
   (`:884-887`). `mcp_server` is on that server, so a slow `mcp_server` call
   in the chat driver ends the turn.
7. A bot can change the setting with the `app_settings` tool. It is a
   writable setting of tier "safe" (`server/app-settings/registry.ts:234-238`).
8. The UI help says "Applies to every tool a bot uses from your MCP servers."
   (`en.json:2045`). That is false for CLI engines.

### 3.11 Import from other tools, and the person's own engine config

**First-run import** (`server/setup-import.ts`):

1. It reads exactly 7 files: `~/.claude.json` (only its top-level
   `mcpServers`, at most 256 MiB), the Claude Desktop config,
   `~/.cursor/mcp.json`, `$CODEX_HOME/config.toml`, `~/.gemini/settings.json`,
   `$HERMES_HOME/config.yaml` and `openclaw.json`. Each other file is at most
   1 MiB (`:98-141`).
2. Each entry becomes a paste entry and goes through the registry parser. One
   bad entry or file drops only itself (`:604-664`).
3. Each server is sorted as present, conflict, policy or fresh (`:668-698`).
4. The import saves each server **off** (`:715`).
5. Literal env and header values (for example `GITHUB_TOKEN`) are copied in
   clear text into `config.json`, not into the Vault (`:605`, `:615-619`).
6. Only the desktop app's own server and the owner's loopback can call the
   route (`server/routes/setup-import.ts:12-15`).
7. The import saves the in-memory map over the stored one, so a hand edit
   made since the start is lost (`:708`, `:715`).

**Three ways that the person's own config reaches bots:**

1. The import copies entries (off) into `config.json`.
2. The switch "Also use my Claude Code MCP servers" is
   `features.claudeUserMcp`, off unless true. It removes
   `--strict-mcp-config`. Then the CLI loads the person's own servers and
   connectors for each Claude bot
   (`server/config.ts:213`, `server/drivers/claude.ts:1006-1008`).
3. **Codex runs the person's `config.toml` servers** on each turn with no
   tool scope, except in a company Codex home, which "never comes here"
   (`server/drivers/codex-shared-home.ts:5`). There is no setting to stop
   it. The shared Codex home links
   the person's whole Codex home: `config.toml`, skills, plugins and
   `.credentials.json` (`server/drivers/codex-shared-home.ts:1-5`, `:84-118`,
   `server/drivers/codex.ts:441-443`). The UI calls this "by design"
   (`en.json:6221`).

The first read missed a probable fourth way. **Hermes runs the servers of
its own `config.yaml`** (code comment,
`server/drivers/acp/hermes-mcp-trust.ts:3-6`). The driver uses
`HERMES_HOME`, or else `~/.hermes` of the person
(`server/drivers/acp/hermes.ts:76-78`, `server/env-path.ts:217-219`). This
code is the same at `96ff84455`. Since v0.1.182 an "Always allow" on such a
server is saved, and an edit of the server keeps it (change 16, section
3.6). Hermes's own code was not read.

## 4. The data

### 4.1 `config.json` → `mcpServers`

A map from name to entry. The schema accepts the map loosely, "one bad server
entry is skipped later" (`server/config.ts:399-400`). The general config
PATCH cannot write it (`:413`).

| Field | Kind | Rules |
|---|---|---|
| `command`, `args`, `env` | command server | command 1-1,024. At most 64 args of 4,096. At most 64 env entries of 16,384. No `OMB_*`, no `OGB_*`. `ELECTRON_RUN_AS_NODE` only as `1` (`server/mcp-registry.ts:142-169`, `:226-228`) |
| `type`, `url`, `headers` | URL server | `type` `http` (default) or `sse`. URL 1-2,048, http or https, no user or password. A query string is allowed. At most 32 headers, value 16,384 on one line (`:199`, `:204-214`, `:258-259`) |
| `oauth` | URL server | `clientId` 1-512, `clientSecret` 1-4,096, at most 32 scopes of 256, `redirectUri` https at `/mcp-oauth/callback` (`:243-253`, `:43-54`) |
| `enabled` | both | absent in a stored entry means on. Absent in a new entry means off (`:413-416`) |
| `resultBudget` | both | 0 to 2,000,000 characters. 0 never trims. Absent means 8,000 (`:23`, `:146`) |
| `runsOn` | both | `{environmentId, label}`: the server runs on a lent computer (seam) |
| `bot` | both | the owner bot id |
| `apps` | both | stored only as `false` (seam: chat apps) |

- The name is `^[a-z][a-z0-9_-]{0,31}$` (`:152`). Twelve names are reserved,
  for example `agents`, `computer`, `data`, `email` and two names with the
  product prefix (`shared/mcp-name.ts:2-15`).
- Values are in clear text in `config.json` (0600) and in its 10 dated
  backups, or are `vault:<id>` pointers (`server/mcp-registry.ts:18-20`,
  `server/config-backup.ts:13-16`).
- The listing of the API has key names only (`envKeys`, `headerKeys`,
  `clientSecretConfigured`). It returns `url` and `args` in full
  (`server/mcp-registry.ts:496-526`).
- The phone listing of a bot is built field by field: `name`, `enabled`,
  `on`, `offFor` (`server/routes/mcp-servers.ts:18-27`).

### 4.2 The bot row in `<data>/bots.json`

- `mcpServers?: string[] | null`: at most 20 names
  (`server/routes/bot-patch.ts:352-374`).
- `toolScope?: { allow?: string[]; deny?: string[] }`
  (`packages/phone-protocol/src/tool-scope.ts:4-11`).

### 4.3 `<data>/mcp-oauth.json`

Kept apart from `config.json` "so a pasted or exported config never carries
a token" (`server/mcp-oauth-store.ts:1`). Written atomically with mode 0600
(`:118`). The folder gets no mode. On Windows the file has no owner-only mode
(`server/mcp-oauth-store.test.ts:22-23`). No format marker and no encryption.
Left out of workspace backups (`server/workspace-backup-policy.ts:40`).

```json
{
  "servers": {
    "<name>": {
      "url": "https://…",
      "state": "signed-in | needs-sign-in",
      "issuer": "…", "clientId": "…",
      "clientSecret": "only a secret issued at registration",
      "tokenAuth": "client_secret_post | client_secret_basic",
      "redirectUri": "…", "tokenEndpoint": "…", "revocationEndpoint": "…",
      "tokens": { "access": "…", "refresh": "…", "expiresAt": 0, "scope": "…" }
    }
  },
  "spentRefresh": { "<name>": "<refresh token already sent>" }
}
```

(`server/mcp-oauth-store.ts:8-35`.) `get` returns a record only for the same
URL (`:58-61`). **A corrupt file reads as empty, and the next `put` writes
over it with the new record only** (`:63-66`, `:107-114`, test `:40-47`).
The store reads the file on each call and has no lock (`:106`).

### 4.4 Other files

| File | Content | Reference |
|---|---|---|
| `<data>/mcp-health.json` | start-check state of command servers, 0600. Since v0.1.186 a record can also hold `timeout: true` and `timeouts` (the count of timeouts in a row) | `server/mcp-health.ts:37-43` (`:25`, `:44-50` at `e1cc6a290`) |
| `<data>/tool-list-records/<40 hex>.json` | since v0.1.184: the full tool list (names, descriptions, schemas) of one server for one bot, written by the relay on the native Antigravity CLI. 0600 in a 0700 folder, at most 2 MiB. A search of `server/` found no code that removes it when the server goes | `server/drivers/session-tool-budget.ts:38-40`, `:70`; `server/tool-list-share.ts:13`, `:35-46` |
| `<data>/mcp-url-checks.json` | the `told` set of the URL check. The `off` map is in memory only | `server/host/mcp-url-checks.ts:100-114` |
| `<data>/mcp-bot-servers.json` | `{claimedAt}`, the one-time claim marker, 0600 | `server/host/mcp-servers-host.ts:53`, `:249` |
| `<tmp>/omb-mcp-*/mcp.json` | config of one turn of Claude Code, 0600, with Bearer tokens | `server/drivers/claude.ts:1103-1107` |
| `config.json.unreadable-<12 hex>` | a copy of an invalid `config.json`, at most 5, 0600 | `server/unreadable-aside.ts:7-21` |

### 4.5 Wire types

- `McpChangeRequest` (`packages/phone-protocol/src/mcp-request.ts:4-18`):
  `requestId`, `botId`, `threadId`, `action: "enable" | "update" | "remove"`,
  `name`, `targetHash`, `result?: {state, text}`, `resumed?`. Display data
  only. The fields and `secretRef` values of an update stay in server memory.
- `McpSignInStatus` (`server/mcp-oauth.ts:14-21`): `phase` (`waiting`,
  `succeeded`, `failed`, `cancelled`, `expired`), `flowId`,
  `authorizationUrl`, `expiresAt`, `message?`, `pasteBack?`.
- `ProbeResult` (`src/components/McpServersPanel.tsx:39-50`): `ok`, `tools?`,
  `total?`, `error?`, `auth?: "required"`, `reason?`, `status?`.
- `SendTurnInput.mcpCallTimeoutMs?` (`server/contracts.ts:234-235`).

## 5. The UI

### 5.1 Where it is

- "Connections Center" is only a plan name. The plan asked for two tabs,
  "Apps" and "MCP servers" (`docs/superpowers/plans/2026-08-31-03-mcp-registry.md:216-228`).
  The tabs are gone. A test checks that there is no `role="tab"`
  (`src/components/PluginsPanel.navigation.test.ts:499-511`).
- "MCP servers" is now a filter pill in the Apps pop-up
  (`PluginsPanel.tsx:592-601`). The bot Access page, a chat app strip and the
  deep link `/?connect=mcp[:name]` open it too (`src/lib/connect-link.ts:3-17`).

### 5.2 The "Your MCP servers" panel (`McpServersPanel.tsx`)

- Header "Your MCP servers", a refresh button and "Add server" (`:647-673`).
  "Add server" is off when a policy forbids custom servers.
- States:
  - loading: "Loading MCP servers…" (`:699-700`).
  - empty: "No custom MCP servers yet" (`:701-706`).
  - testing: "Off until it passes a test: testing it now." (`:782-786`).
  - signing in: a status line and Cancel (`:520-545`).
  - sign-in needed: an amber box and a "Needs sign-in" badge (`:788-789`, `:725`).
  - failure: "Couldn't connect. {reason}", "Saved, but off: the test failed.
    {reason} …" or "Couldn't connect, so it stays off. {reason}", with "Fix
    the keys" or "Try again" (`:787-799`).
- A row shows the URL or the command line in full (`:733`). Secrets show as
  names only: "Headers saved: {keys}", "Secrets saved: {keys}", "Sign-in app:
  {clientId} · secret saved" (`:734-737`).
- One `busy` flag for the whole panel, so each running step disables each
  row (`:123`). Only one sign-in at a time (`:127`).
- Remove uses `window.confirm` (`:487`). `DESIGN.md:288` says that
  confirmations use `ConfirmDialog`.
- The editor (`McpServerEditor.tsx`): "Connect to a URL" or "Run a command".
  Each value field is `type="password"`. A saved value shows as an empty field
  marked "saved" (`src/components/mcp-draft.ts:42-49`).
- The paste (`src/lib/mcp-paste.ts`) accepts curly quotes, line continuations
  of bash, PowerShell and cmd, shell prompts and comments. A variable or a
  placeholder (`$KEY`, `YOUR_API_KEY`) becomes a field to fill. A
  `docker run -e KEY=value` value moves into the write-only env
  (`:222-245`). One bad line fails the whole paste
  (`src/lib/mcp-paste.test.ts:81`). It does not read TOML or YAML.
- Sign-in from another computer: a field "Redirect URL" and a button
  "Complete sign-in". It shows at once when `pasteBack` is set, else under
  "Signing in from another computer?" (`:520-545`).
- Eight hosted app cards (for example Whop, Vapi, Telnyx) are recognised by
  their exact address (`src/lib/hosted-mcp-apps.ts:117-128`). Seam: connected
  apps.

### 5.3 The Access settings of a bot

- The "MCP servers" card (`AccessSection.tsx:131-205`): a switch "Let this
  bot use {name}" for each server. A server that is off globally shows
  "Switched off in Apps → MCP servers. …" with a disabled switch. "Use every
  enabled server" sends `mcpServers: null`. A tool-count line "Its last turn
  listed {listed} of the {limit} tools its AI takes at once."
- The "Tool selection" card (`ToolSelectionCard.tsx`): "All current tools" or
  "Custom selection", "Allow (one per line)", "Exclude (one per line)". It
  saves directly, not optimistically (`:13`, `:41`). The warning for an
  unsupported engine comes from `TOOL_SCOPE_SUPPORT[engineKind]` (`:32-35`).
  The UI warns but does not block. The turn refuses later
  (`scripts/testing/tool-selection-ui.e2e.test.ts:73-78`).

### 5.4 Cards in the chat

- Change cards: "Turn on {name}?", "Change", "Remove", always with "Cancel"
  as the second option (`server/host/mcp-requests.ts:20-25`, `:80`).
- The Sign in card reuses the connector card of connected apps
  (`server/host/mcp-sign-in-cards.ts:1-2`).

### 5.5 "Tool time limit"

A number field with "minutes" in the settings (`McpCallTimeoutSettings.tsx`).
It saves on blur with `PUT /api/config {mcp: {callTimeoutMinutes}}`. The
range error is "Enter a whole number from 1 to 60."

## 6. The tests

| Test file | What it guarantees |
|---|---|
| `server/mcp-registry.test.ts` | a new server is off, a stored one is on. Listings hold names, never values. `true` keeps a value. Import drops `enabled` and is all or none. Limits 20 and 100 |
| `server/routes/mcp-servers.test.ts` | the phone listing has only four fields. A personal header value is refused. The broker test path |
| `server/host/mcp-config.test.ts` | one busy flag, at most 2 tests, policy 403, sign-in kept for the same URL |
| `server/host/mcp-servers-host.test.ts` | boxed claim, restart env, 405 left out once, Vault keys only in memory, "Always allow" keys with no secret |
| `server/mcp-probe.test.ts` | the 8 s and 30 s limits at their exact edges (`:116-129`, `:509-523`) |
| `server/host/mcp-url-checks.test.ts` | no redirect, told once, a timeout does not prove anything |
| `server/mcp-oauth.test.ts` | full sign-in, wrong state, expiry, 13 bad pastes that do not use up the flow, owner isolation, a fresh client each time |
| `server/mcp-oauth-discovery.test.ts` | the SSRF guard, the 64 KB cap, S256 required |
| `server/mcp-oauth-refresh-races.test.ts` | a late reply after a new sign-in, a spent token never sent twice, also after a restart |
| `server/mcp-sign-in-card.test.ts`, `.e2e.test.ts` | the URL never in the transcript, card replace, permissions |
| `server/mcp-remote-proxy.test.ts` | no token in argv, scope refusal, cancel upstream, fixed HTTP error texts, redaction, directory mode |
| `server/mcp-strict-handshake.test.ts` | no engine handshake field reaches the server. The 2-minute cap |
| `server/mcp-gate.test.ts`, `mcp-gate-lifetime.test.ts` | filter, refuse, fail closed, stop the process tree |
| `shared/tool-scope.test.ts` | 24 malformed scopes grant nothing. Deny wins |
| `server/tool-scope.e2e.test.ts`, `server/mcp-selection.e2e.test.ts` | the scope and the server list reach the engine config. Import stays off. A client session gets 403 |
| `server/drivers/tool-scope-coverage.test.ts` | each driver kind has a row in the support table |
| `server/host/mcp-requests.test.ts`, `server/mcp-cards.e2e.test.ts` | owner review, supersede, Stop closes, a restart expires a Change card |
| `src/components/McpServersPanel.*.test.ts` | add, sign-in, hosted cards, live refresh, the switch settle time |
| `server/drivers/chat-mcp-tools.test.ts:1367-1378` | the configured timeout replaces the default |

Not covered by a test:

- a corrupt `mcp-oauth.json` with other records (only an empty case).
- the timeout of a required server in the chat driver.
- the stale link of the Sign in card.
- a sign-in that finishes after Stop.
- the `OMB_TOOL_LIMIT` cut in the gate (`agent-tools.md:1266-1267`).

## 7. Ours compared

Our crates are skeletons now (`crates/bot-protocol/src` has `message.rs`,
`event.rs` and `ids.rs`). D12 in [`../../decisions.md`](../../decisions.md)
chooses custom MCP servers and Composio, with a proxy of ours that filters
the tool list and checks each call. The rows below are where each part goes.
They are proposals until the author decides.

| Reference | Ours |
|---|---|
| `server/mcp-registry.ts`, `shared/mcp-name.ts` (types, limits, parse) | `bot-protocol::mcp` (the spec types and the name rule, no I/O) |
| `server/host/mcp-config.ts`, the `mcpServers` part of `server/config.ts` | `bot-core::mcp_registry` (the stored list, written with its event in one transaction) |
| `server/vault/mcp-keys.ts` | `bot-core::secrets` (the rule of write-only secrets) |
| `packages/phone-protocol/src/tool-scope.ts`, `server/routes/bot-patch.ts` | `bot-protocol::tool_scope` (pure parse and match), grants in the bot row of `bot-core` |
| `server/mcp-gate.ts`, `server/mcp-gate-config.ts` | `bot-engine::mcp::gate` |
| `server/mcp-remote-proxy.ts`, `server/mcp-http.ts` | `bot-engine::mcp::remote` (`rmcp` or the line codec with `reqwest`, `docs/comparison.md:138-139`) |
| `server/mcp-probe.ts`, `server/mcp-health.ts`, `server/host/mcp-url-checks.ts` | `bot-engine::mcp::probe` |
| `server/mcp-oauth*.ts` | `bot-engine::mcp::oauth` |
| `server/routes/internal-mcp.ts`, `server/host/mcp-requests.ts` | the `mcp_server` tool of step 12 in `bot-engine`, cards in `bot-core` |
| `src/components/McpServersPanel.tsx`, `AccessSection.tsx`, `ToolSelectionCard.tsx` | `crates/bot-desktop/ui` |
| The wiring in `server/index.ts:1354` | `bot-cli` (the composition root) |

**Where our documents say something else:**

| Our document | It says | The reference project |
|---|---|---|
| `docs/decisions.md` D12 references | `server/connector-proxy.ts` is the proxy that filters the tool list and checks each call | `server/connector-proxy.ts` is the Composio connector: "Connection requests become … chat cards" (`:1-2`). For custom servers, the gate (`server/mcp-gate.ts`) filters and checks, and the remote proxy (`server/mcp-remote-proxy.ts`) talks to a URL server |
| `docs/decisions.md` D12 | "a proxy of ours stands between the engine and the tool server" | Not always. Claude Code connects to a URL server itself unless a gate is necessary, and keeps its own tool search (`server/drivers/claude.ts:1064-1068`, `:999-1003` at `e1cc6a290`; `server/mcp-gate-config.ts:47`). A command server has no gate when it has no scope, no budget, no MCP apps mount and no schema profile (`:190`, `server/drivers/turn-mcp.ts:47-50`). The first read named only the scope and the budget. Since v0.1.182 Gemini CLI and Antigravity have a schema profile, so on these engines each command server has a gate |
| `docs/comparison.md:139` | the Streamable HTTP relay has a 20 MB limit | 20 MB is the limit of the Composio connector (`server/connector-proxy.ts:37`, `:38` at `e1cc6a290`). The client of custom servers has 32 MiB (`server/mcp-http.ts:37-38`) |
| `docs/comparison.md:138` | the connector proxy filters the tool list to the grants of the bot | True for Composio (`server/connector-proxy.ts:6-12`, `:5-11` at `e1cc6a290`). For custom servers the grant is the bot's `mcpServers` list plus `toolScope`, and the gate enforces the scope (section 3.6) |

Points where our rules already differ:

- **Capability flags, not names** (`AGENTS.md`). The reference project gates the
  server list by a flag (`customMcp`). But it gates the scope support, the
  schema profile and the Codex start wait by the driver kind or the version
  (`shared/tool-scope-support.ts:4-9`, `server/drivers/turn-mcp.ts:115`,
  `codex-mcp-startup.ts:8-12`). The range adds more of these: the `gemini`
  schema profile (`server/tool-schema-profile.ts:55`), the engines that
  have their own MCP config (`server/provider-tool-allow.ts:13`), and the
  session budget, which is chosen by the agent name that `initialize`
  returns (`server/drivers/antigravity-acp.ts:786-797`). "Reads text only"
  is learned from the text of one refusal, in the ACP driver only
  (`server/drivers/engine-errors.ts:40`, `server/mcp-text-only.ts:41-56`).
- **Typed refusals** (`AGENTS.md`). `perTurnCustomMcp` throws an untyped
  `Error` into the turn (`server/mcp-registry.ts:171-185`).
- **One transaction for each state change** (`AGENTS.md`). The add, replace
  and remove flows of the reference project are not one transaction (section 3.2).
- **Text of a delegated turn from stored data** (`AGENTS.md`). The reference project
  does this for change cards and sign-in cards
  (`server/host/mcp-requests.ts:27-37`, `server/host/mcp-sign-in-cards.ts:79-84`).
  Since v0.1.186 the failure text of a sign-in card comes from the stored
  card row too (`server/host/mcp-sign-in-cards.ts:296` at `e1cc6a290`).

## 8. Where we can be better

1. **Never write over the token store after a failed read.** The reference project
   reads a corrupt `mcp-oauth.json` as empty and the next sign-in deletes the
   other records (`server/mcp-oauth-store.ts:107-114`, `:63-66`). Reason: this
   is the problem "a file written over after a failed read". Our `save` takes
   a value that only a successful `load` can make (changelog section 7).
2. **Encrypt the tokens and the server secrets, or keep them in the system
   keychain.** The reference project keeps OAuth tokens and the spent refresh token
   in clear text. It also keeps the header and env values in clear text, in
   `config.json` and in 10 backups (0600, no mode on Windows)
   (`server/mcp-oauth-store.ts:118`, `server/config-backup.ts:13-16`).
   Reason: "a secret in the wrong place". A bot shell runs as the same user.
3. **Refuse a literal secret from a bot.** `redeem` keeps literal strings, so
   a key that a bot types in the chat is saved in `config.json`
   (`server/secret-vault.ts:165-175`). Reason: only the tool description
   protects it now. Our typed key value can make a literal in a secret field a
   compile-time or parse-time error.
4. **Hide a secret in a URL query or an argument.** The listing returns
   `url` and `args` in full, and a query string is allowed
   (`server/mcp-registry.ts:204-214`, `:499`, `:519`; `:209-219`, `:507`,
   `:527` at `e1cc6a290`). The route's own comment
   says these can hold secrets (`server/routes/mcp-servers.ts:18-19`). Reason:
   "a secret in the wrong place". The bot view already masks them
   (`server/mcp-bot-rules.ts:111-128`). Use one mask for each view.
5. **Apply the MCP call timeout to each engine, or label it.** Only the chat
   driver applies the setting (`server/drivers/openai-chat.ts:614`, `:613` at
   `e1cc6a290`). The UI
   says that it applies to each tool (`en.json:2045`). Reason: "a wait that
   does not end". A driver capability can say whether the engine takes a
   deadline for each server (Codex `tool_timeout_sec`).
6. **One deadline for each remote call.** The proxy gives `tools/call` no
   deadline outside directory mode (`server/mcp-remote-proxy.ts:339`,
   `:342` at `e1cc6a290`; still true). The
   old SSE stream has no idle limit (`server/mcp-http.ts:370`). An OAuth
   start can take about 50 s (`server/mcp-oauth.ts:572`). `keys.warm` and the
   DNS lookup of `publicMcpUrl` have no limit
   (`server/host/mcp-servers-host.ts:127`, `server/mcp-public-url.ts:13`).
   Reason: "a wait that does not end".
7. **Send `notifications/cancelled` on a timeout too.** The chat client sends
   it only on Stop, then kills the process (`chat-mcp-tools.ts:275-289`).
   Reason: a remote server keeps the work running after its proxy dies.
8. **One rule for a dead server on each engine.** v0.1.153 ("A turn carries
   on when one optional MCP server dies") is in the chat driver. Only Claude Code
   reports which server failed (`server/drivers/claude.ts:1439`,
   `:1375-1376` at `e1cc6a290`). After the tag v0.1.186, Claude Code also
   closes such a session after the turn, so the next turn connects the
   server again (change 5). Codex already refused to keep such a session
   (`codex.ts:679`, `:910` at `e1cc6a290`). Codex holds its launch slot for
   30 s (`codex.ts:549-551`). A URL server behind the proxy is kept after a
   timeout and fails again on each call. Reason: "one slow part blocks the
   others".
9. **Keep the "off" state of the URL check on disk.** The `off` map is in
   memory, so after a restart a 405 server is mounted until the check
   finishes (`server/host/mcp-url-checks.ts:100`). The 2-slot start queue is
   shared by all bots and one slot can be held 120 s (`server/mcp-health.ts:15`,
   `:21` at `e1cc6a290`). Since v0.1.186 a timed-out check is repeated
   after 1 minute, up to 3 times in a row (change 1). So a package-runner
   server that hangs can hold a slot for 120 s three times before it is
   off, and it stays in turns during that time (derived, not run). Reason:
   v0.1.178 "named once, instead of slowing every turn".
10. **Do not run the person's own Codex servers by default.** Outside a
    company Codex home, Codex runs the person's `config.toml` servers on each
    unscoped turn, with no setting (`server/drivers/codex.ts:441-443`,
    `server/drivers/codex-shared-home.ts:5`). Reason: "the person's own engine
    config reaches the bots". Our P-rule in changelog section 7 starts each
    engine from a list of allowed items.
11. **An address check for each remote request.** The proxy has no filter of
    private addresses and follows redirects (`server/mcp-http.ts:66-69`,
    `:312`). Discovery has one (`server/mcp-oauth-discovery.ts:45-74`, `:47-76` at
    `e1cc6a290`) and the
    URL check refuses redirects. Reason: a header can go to a new address.
12. **Scope support as a driver capability.** The reference project keys it by driver
    kind (`shared/tool-scope-support.ts:4-9`). Reason: `AGENTS.md` gates
    engine behaviour by capability flags.
13. **A transaction for add, replace and remove.** Vault grants and the
    config save are separate steps (section 3.2). Reason: a refused save
    leaves a grant, and a throw in `remove` leaves a sign-in.
14. **Bound the self-grant path.** Below Full access, a bot can add a public
    https server, turn it on and put it on its own list with no card
    (`server/routes/internal-mcp.ts:235-248`). Reason: "an access right in the
    wrong place". The spec said that such an add is saved off
    (`docs/superpowers/specs/2026-11-01-mcp-in-chat-design.md:91`).
15. **Close the loopback owner gap.** Outside the packaged desktop, any
    loopback caller with an `Origin` header can widen a bot's grants
    (`server/routes/bot-patch.ts:619-620`, `:636`; `:637-638`, `:654` at
    `e1cc6a290`). Reason: an access right
    that a bot shell can reach. D10 makes us a desktop app, so a per-process
    token is possible.
16. **Cancel the sign-in flow on Stop, and do not reuse a dead link.**
    Section 3.8. Reason: a sign-in that finishes after Stop stores a token
    that the person did not expect.
17. **Test before a switch turns a server on.** Section 3.1. Reason: the
    UI text promises it.
18. **One import path.** The window adds pasted servers one by one, and the
    all-or-none route is unused (`McpServersPanel.tsx:246-262`). Reason: a
    paste can leave half of its servers.

**Problems of changelog section 5 that the reference project has here:**

| Problem | Here | Where |
|---|---|---|
| One slow or stuck part blocks the others | yes, partly fixed | v0.1.153 only in the chat driver. v0.1.178 with an in-memory `off` map. Codex start wait holds the launch slot (items 8, 9). **Repaired in the range:** "One saved key with a stray character can no longer take a Cloud down." (v0.1.184, change 15: the start check of URL servers crashed the server again at each start). "A server whose start check only timed out stays on, unless that happens three times in a row." (v0.1.186, change 1: one slow check no longer took a working server out of turns for 30 minutes). After the tag: a Claude Code session whose server did not connect is closed, so the server comes back on the next turn (change 5, no release yet) |
| A turn or a wait that does not end | yes | the call timeout on one driver only. No `tools/call` deadline in the proxy. No SSE idle limit (items 5, 6). **Repaired in the range:** "Servers that can't sign in apps say why on the Sign in card." (v0.1.186, `announcements/releases.json:63`, changes 7 and 8: before, the bot waited until the person pressed "Not now"). A frame with U+2028 or U+2029 no longer loses its request, so the engine does not wait for its own timeout (v0.1.182, change 11, no line in the release note) |
| The size of the tool list of one turn | yes, partly fixed (was "handled elsewhere") | the grant filters by name and does not cap. The cap is `OMB_TOOL_LIMIT` (`server/mcp-gate.ts:49`, `:410-412`; `:51`, `:417-419` at `e1cc6a290`). The probe caps at 100. **Repaired in the range:** "Gemini:" "the bot's tools fit the CLI's tool budget." (v0.1.182, change 13). Antigravity CLI: "connected apps no longer lose tools", and "Every tool's description is now shortened as needed so they all fit." (v0.1.184, change 14). **Still open:** the per-tool fit of change 13 leaves out a tool that is over 2,000 bytes at its shortest, with only a stderr line (`server/mcp-tool-schema.ts:116-120`) |
| A secret or an access right in the wrong place | yes | clear-text tokens and values, the URL listing, literal secrets from a bot, the self-grant path, the loopback owner gap (items 2, 3, 4, 14, 15). **New in the range:** a page call runs a tool that the server marks `readOnlyHint: true` with no approval (change 17). A Hermes grant stays after an edit of its server (change 16). Tool lists of each bot stay on disk after the server goes (change 14) |
| The person's own engine config reaches the bots | yes | the Codex home, the Claude switch, the import of clear-text secrets (item 10). Probably also the Hermes home, which the first read missed (section 3.11) |
| (none of section 5) | repaired | text-only models: "an image in the conversation no longer makes every later message fail." (v0.1.186, change 12). The fix is learned from one refusal text and kept in memory only. An ungated command server does not strip images (derived, section 3.6) |
| A file written over after a failed read | yes | `mcp-oauth.json` (item 1). `config.json` refuses invalid JSON, but a schema-invalid file loads as `{}` and the next add keeps only the new server (derived, section 9) |
| The tool connection of an engine (section 6) | reason found | the exception is Claude Code because its client sends only spec fields (`server/drivers/claude.ts:1065-1068`) |

## 9. Not verified

- The admin scope that guards `/api/mcp/servers*`. The route file does no
  scope check.
- The path "a schema-invalid `config.json` loads as `{}`, and the next Add
  replaces the whole `mcpServers` map". It is derived from
  `server/config.ts:543-546`, `:698-713`, `:932-934` and
  `server/config-backup.ts:50-58`. It was not run.
- Whether a PUT may set `bot` or `apps` on purpose.
- What `keys.warm` does and whether it can block.
- Whether a bot can read the temporary `mcp.json` of Claude Code
  during a turn, or `mcp-oauth.json`. The shell runs as the same user
  (`security-model.md:535-536`), so this is likely.
- Whether two processes write `mcp-oauth.json` at the same time.
- Who posts the one notice after a refused refresh. The connection health
  gets `onRefresh` (`server/index.ts:1358`), not read.
- Whether a request log records the query of `/mcp-oauth/callback`.
- Whether the paste route checks the `Origin` header.
- What Codex keeps in `.credentials.json`.
- Whether Claude Code without `--strict-mcp-config` loads the
  per-project servers and the connectors of the person.
- Whether CLI engines check the catalog schema of `mcp_server` before they
  call. If not, a bot can set `resultBudget`, which the schema leaves out
  (`server/drivers/agents-catalog.ts:772-800`, `server/mcp-registry.ts:440`).
- Whether a bot's `app_settings` change of the call timeout shows a card.
- The 60 s default of Codex for `tool_timeout_sec` (only a comment,
  `server/drivers/agents-tool-limit.ts:1-3`).
- Whether `told` of the command check is cleared after a success. By the
  code it is not (`server/mcp-health.ts:81-82`).
- The release note of v0.1.178. The code comment of
  `server/host/mcp-url-checks.ts:1-9` matches the description in
  `changelog.md`.
- Whether the evidence images of the sign-in are older than the current
  paste box.

Not verified in the update to `e1cc6a290`:

- That a person's command server with no gate keeps its images for a
  text-only model. It is derived from `server/drivers/turn-mcp.ts:47-50`
  and `server/tool-schema-profile.ts:52-58`. It was not run.
- That a gate whose result trim throws sends the images unstripped
  (`server/mcp-gate.ts:432-435`). Derived, not tested.
- That `engineFailed` from Claude's `mcpFailed` adds timeouts faster than
  one a minute (`server/mcp-health.ts:160-163`, `server/index.ts:6378`).
  Not run.
- Which turn first leaves out a server after its third timeout. Derived
  from the background check at `server/mcp-health.ts:137`.
- Whether a pre-started (spare) Claude Code process can send `system/init`
  before a turn is attached. Then `failedCustomMcp` gets no server list,
  and no retire happens (`server/drivers/claude.ts:1375`).
- That no chat line tells the person about a failed command server on
  Claude Code. A grep of `mcpFailed` in `server/index.ts` found only
  `:6378`.
- That a server with no OAuth stays retryable with no end, and that a turn
  that parks late hears a translated failure text. Both are derived from
  `server/host/mcp-sign-in-cards.ts:177`, `:195-197`, `:296`.
- A card that failed with `no-registration`, after the person adds a
  client ID and taps "Try again": `resumed` is already true, so the bot
  may not hear the later success (`:206`). Read in code only.
- Whether Hermes mounts the servers of the person's own `config.yaml` on
  each bot turn. Only the commit message and a code comment say so.
- Whether a relay inside the bot box can write its tool-list record, and
  whether backups include `<data>/tool-list-records/`.
- How often the 2,000-byte fit leaves out a real tool on Gemini CLI or
  Antigravity.
- The fit rules of `server/tool-list-budget.ts` ("no tool is removed",
  "calls are checked against the full schema") come from the commit
  message.
- That the ACP engine of `server/drivers/acp/grok.ts` stops a server with
  its own `startup_timeout_sec` (code comment, `:582-583`).
- A gap in our changelog: the row v0.1.186 of section 8 of
  `docs/research/changelog.md` does not have the release line "Servers
  that can't sign in apps say why on the Sign in card."
  (`announcements/releases.json:63`). This update does not change the
  changelog.
