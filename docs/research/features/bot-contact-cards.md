# Bot contact cards: email, phone numbers and calls for a bot

Feature row `bot-contact-cards.md` of
[`../reference-features.md`](../reference-features.md), group 3: "Cards that
give a bot its own email, phone number and calls".

Step 16 of [`../../plan/README.md`](../../plan/README.md). Crate:
`bot-engine`, with the card table in `bot-protocol`, the stored server and
its key in `bot-core`, and the cards in `crates/bot-desktop/ui` (section 7).

Read on 2026-11-26 at commit `96ff84455` of the reference project. The HEAD
of the local clone was `96ff84455`, so the readers read the files directly.
All paths are in the reference project unless a line says "ours". The
`enterprise/` directory was not opened. Five subagents read five groups of
files. The main session checked the key claims against the code (section 9
lists what is not checked).

In quoted text from the reference project, `<product>` replaces the product
name of the reference project.

## What this file adds to earlier research

- [`custom-mcp-servers.md`](custom-mcp-servers.md) has the MCP registry, the
  gate, the probe, OAuth sign-in and the token store. This file does not
  repeat them. It adds only what the four contact cards add:
  - their table rows
  - the pasted-key flow and the refusal of a bad key
  - Disconnect of a key card
  - how a send or a call through their tools reaches the approval rules.
- [`write-only-secrets.md`](write-only-secrets.md) has the write-only keys of
  the Settings. This file adds that a contact-card key is **not** one of
  those keys. It has no row on the Keys page, no slot in the encrypted store
  of the desktop and no `last4` hint (section 3.5).
- [`approval-cards.md`](approval-cards.md) has the approval card. This file
  adds only the path from a contact-card tool to that card. It also adds a
  gap: the "Sending on your behalf" rule of a bot does not apply to these
  tools
  (section 3.6).
- The Composio connector service is out of scope. The `connected-apps`
  research covers it.

**Corrections to earlier files and to the brief:**

1. The commit that adds the cards (`9d2549a8d`, 2026-11-05) changes no server
   file. It changes 9 files: four table rows, a key branch in the panel, 13
   strings, tests, a browser script and documents (`git show --stat
   9d2549a8d`). The approval rules for calls and purchases came 18 minutes
   before, in commit `84b13621b`.
2. The brief assumed that the vault keeps a pasted key. It does not. The
   card saves the key as the literal header value `Bearer <key>` in
   `config.json` → `mcpServers.<name>.headers`. The 10 dated backups of
   `config.json` also hold it (section 4.2).
3. `write-only-secrets.md:89` gives `electron/credential-patch.mjs` 48 lines.
   At `96ff84455` it has 97 lines.
4. The reference document says "Four cards give bots their own email,
   numbers and calls" (`docs/custom-mcp-servers.md:88`). Its table has five
   rows (`:91-97`). The fifth row is Higgsfield, an image and video service
   that commit `1c905a7b4` added later.

## 1. In short

The Apps window of the reference project has a group of **hosted cards**. A
hosted card is a card for one outside service that has its own MCP server on
the internet at a fixed address. Four of these cards are **contact cards**.
They give a bot its own email inbox, phone numbers, text messages and phone
calls, on accounts that the person owns and pays for:

| Card | What it gives | How it connects |
|---|---|---|
| AgentMail | Email inboxes | Sign-in in the browser (OAuth) |
| AgentPhone | US and Canadian numbers, texts and calls | Sign-in in the browser (OAuth) |
| Vapi | Phone calls | A pasted API key |
| Telnyx | Numbers in many countries, texts and calls | A pasted API key |

Terms:

- **MCP server**: a program or a web address that gives tools to an AI
  engine through the Model Context Protocol.
- **Hosted MCP server**: an MCP server that the service itself runs on the
  internet. The reference project does not run it.
- **OAuth sign-in**: the person signs in on the web page of the service, and
  the service gives a token to the program. `custom-mcp-servers.md` has the
  full flow.
- **Bearer key**: an API key that goes in the HTTP header
  `Authorization: Bearer <key>`.
- **Outbound tool**: a tool that sends something to a person outside the
  program, or moves money. Examples: send an email, place a call, buy a
  phone number.
- **"Sending on your behalf"**: a rule for each bot, `ask` or `allow`. It
  says if an outbound action waits for the person's tap.
- **Full access**: the highest approval level of a bot. At this level the
  bot does most things with no question.

The main facts:

1. A contact card is one row in one table (`src/lib/hosted-mcp-apps.ts:29-107`).
   The card adds no server code. It uses the normal custom MCP server path.
2. A sign-in card adds a server with no key, then runs the OAuth sign-in.
   This is the same flow as the Whop card.
3. A key card saves the server **off**, with the key in the `Authorization`
   header. Then it tests the server. It turns the server on only when the
   test passes. A refused key stays saved, but the server stays off.
4. Disconnect on a key card deletes the whole server entry, and the key
   with it. Disconnect on a sign-in card turns the server off and signs out.
5. The key never goes in the address, and no listing returns it. But it is
   in clear text in `config.json` and in its backups.
6. A name rule decides which tools are outbound. The rule knows calls,
   purchases and Telnyx's single tool that reaches the whole API.
7. **Gap:** the bot's "Sending on your behalf" rule is not applied to these
   tools. At Full access, a call or a purchase goes out with no question,
   even when the bot's rule is `ask`. The card texts say the opposite.

## 2. Files read completely

Each subagent wrote its notes to `.research/<group>.md` (not in git). Line
counts are at `96ff84455`. "Ranges" means that only the named lines were
read.

**catalog** (the card table and the Apps window)

| Path | Lines |
|---|---|
| `src/lib/hosted-mcp-apps.ts`, test | 160, 69 |
| `src/components/HostedMcpIcon.tsx` | 8 |
| `src/components/PluginsPanel.tsx` | 807 |
| `src/state/config-status.ts` | 254 |
| Ranges: `src/locales/en.json` (12,062) 15-60, 3578-3600, 6120-6141, 7145-7166. `src/components/PluginsPanel.navigation.test.ts` (747) 1-185, 570-590, 630-690. `DESIGN.md` (440) 58-72, 328-340 | |

**apps-panel** (the card UI and its flows)

| Path | Lines |
|---|---|
| `src/components/McpServersPanel.tsx` | 813 |
| `src/components/McpServersPanel.hosted.test.ts` | 412 |
| `src/components/McpServersPanel.embedded.test.ts` | 158 |
| `git show 9d2549a8d` (the whole diff) | 634 lines of output |
| `packages/phone-protocol/src/outbound.ts` | 179 |
| Ranges: `server/mcp-oauth.ts` 255-270. `server/mcp-registry.ts` 485-515. `server/host/mcp-chat.ts` 132-136 | |

**key-store** (where the key is kept, and the key test)

| Path | Lines |
|---|---|
| `server/routes/mcp-servers.ts` | 246 |
| `server/vault/mcp-keys.ts`, test | 146, 118 |
| `server/mcp-probe.ts` | 339 |
| `server/key-hint.ts`, test | 37, 35 |
| `src/components/keys/key-catalog.ts`, test | 293, 163 |
| `electron/credential-patch.mjs` | 97 |
| `electron/workspace-credentials.mjs` | 82 |
| `packages/phone-protocol/src/credential-request.ts`, `shared/credential-request.ts` | 324, 1 |
| `server/credential-request.test.ts` | 115 |
| Ranges: `server/host/mcp-config.ts` 120-245. `server/mcp-registry.ts` 1-40, 490-530. `server/config-backup.ts` (195) 1-40. `electron/workspace-credentials.test.mjs` (258) by search only, no line names a card | |

**outbound** (the approval path)

| Path | Lines |
|---|---|
| `packages/phone-protocol/src/outbound.ts`, `shared/outbound.ts` | 179, 1 |
| `shared/outbound.test.ts` | 213 |
| `server/provider-tool-allow.ts`, test | 50, 70 |
| `server/outbound-hold.ts`, test | 119, 205 |
| `server/outbound-requests.ts`, test | 90, 70 |
| `server/mcp-grant-spec.ts` | 100 |
| `server/auto-approve.ts` | 165 |
| `shared/today-outcomes.ts` | 157 |
| Ranges: `src/components/bot-settings/PermissionsSection.tsx` (200) 1-30, 140-200. `src/components/DecisionModelSettings.tsx` (443) 1-40. `server/store.ts` (2,256) 290-340, 534-536. `server/index.ts` 6400-6560, 11664, 14180-14320. `server/routes/bot-patch.ts` 280-300, 615-660. `server/drivers/agents-bridge.ts` 60-90. `server/drivers/claude.ts` 950-962, 1070-1110. `server/safety-floor-gate.ts` 85-140. `server/mcp-gate-config.ts` 160-200 | |

**verification-docs** (the browser check and the documents)

| Path | Lines |
|---|---|
| `docs/verification/bot-contact-cards.md` | 29 |
| `docs/verification/whop.md` | 72 |
| `scripts/verify-bot-contact-cards.ts` | 92 |
| `scripts/verify-whop.ts` | 174 |
| `scripts/testing/whop-preview.tsx` | 10 |
| `server/testing/whop-like-catalog.ts` | 152 |
| `docs/custom-mcp-servers.md` | 638 |
| Ranges: `docs/verification/README.md` (386) 1-20, 140-165. `server/testing/fake-http-mcp-server.ts` (377) 1-200, 246-261. `scripts/control-omb.ts` (556) 289-319 | |

The main session also read these lines to check the key claims:

- `McpServersPanel.tsx:390-442`, `:560-585`, `:710-716`, `:744-748`
- `server/host/mcp-config.ts:135-242`
- `server/mcp-registry.ts:15-22`, `:495-503`
- `server/vault/mcp-keys.ts:88-98`
- `packages/phone-protocol/src/outbound.ts:1-50`, `:84-122`
- `server/auto-approve.ts:100-120`
- `server/drivers/claude.ts:948-960`, `:1050-1054`, `:1064-1100`
- `server/index.ts:14240-14262`
- `server/mcp-probe.ts:128-160`, `:200-222`
- `server/config-backup.ts:10-18`
- `electron/workspace-credentials.mjs:40-72`
- `docs/custom-mcp-servers.md:86-109`, `:598-602`

## 3. How it works

### 3.1 The card table

1. One table, `HOSTED_MCP_APPS`, defines all eight hosted cards
   (`src/lib/hosted-mcp-apps.ts:29-107`). Its comment names the card,
   Connect, Disconnect, Bot access, the row in the MCP list, search, the
   Connected filter and the count. They "all derive from this table"
   (`:27-28`).
2. The four contact cards (the order of the table is the order of the
   cards):

   | id | Address | Key page | Icon | Lines |
   |---|---|---|---|---|
   | `agentmail` | `https://mcp.agentmail.to/mcp` | none (OAuth) | `Mail` | `:50-58` |
   | `vapi` | `https://mcp.vapi.ai/mcp` | `https://dashboard.vapi.ai` | `PhoneCall` | `:59-68` |
   | `telnyx` | `https://api.telnyx.com/v2/mcp` | `https://portal.telnyx.com/#/api-keys` | `RadioTower` | `:69-78` |
   | `agentphone` | `https://mcp.agentphone.ai/mcp` | none (OAuth) | `Smartphone` | `:79-87` |

3. A row with a `key` field takes a pasted key, "sent as `Authorization:
   Bearer`". `key.url` is the page where the person makes a key. A row with
   no `key` signs in with the browser (`:15-17`). A test pins the key cards
   to exactly `vapi` and `telnyx` (`hosted-mcp-apps.test.ts:56-59`).
4. The icons are plain glyphs, not logos: "None of these four publishes a
   logo licence we have checked, so neutral glyphs stand in." (`:49`).

**How a server becomes a card** (`hostedMcpApp`, `:117-128`):

1. The server must be `type: "http"` with a URL that parses (`:120-122`).
2. The URL must have no query, no hash, no user name and no password
   (`:123`).
3. The origin must be equal to the origin of the card. The path must be
   equal, with or without one trailing slash (`:124-127`).
4. Result: "A look-alike host or a URL carrying a key is never branded"
   (`:117-118`). A test checks `?key=secret`, `key@host`, `http:`, a
   look-alike host and another path (`hosted-mcp-apps.test.ts:20-27`).
5. The name of the server does not count. A server with any name at the
   exact address is the card's server.

**The name of a new server** (`hostedServerName`, `:130-136`): the card id,
then `id-2`, `id-3`, and so on. It never takes a name that exists.

**"Connected"** (`hostedConnections`, `:140-150`):

1. A sign-in card is connected when a server at its address is on and
   `auth === "signed-in"`.
2. A key card is connected when a server at its address is on and has a
   header **named** `Authorization`. The name check ignores case (`:145`).
   The value is not checked. A wrong key or a revoked key still shows
   "Connected".
3. Tests: an `Authorization` header does not connect a sign-in card
   (`hosted-mcp-apps.test.ts:44`). `X-Api-Key` does not connect a key card
   (`:51`). A signed-in key server with no header is not connected (`:53`).

### 3.2 Connect a sign-in card (AgentMail, AgentPhone)

`connectHosted` (`McpServersPanel.tsx:393-414`), then `signIn` (`:341-391`):

1. Stop when the list is not loaded, or when an action or a sign-in runs
   (`:394`).
2. Find a server at the exact address, with any name (`:395`). If one
   exists, sign in to it (`:397`). A test uses a server named "business"
   (`McpServersPanel.hosted.test.ts:186-192`).
3. If none exists, `POST /api/mcp/servers` with
   `{name, type: "http", url, enabled: false}` (`:406`). If the answer has
   no server with that name at that address, show `hostedMcp.setupFailed`
   (`:409`).
4. Reserve a browser page in the click, so the browser does not block the
   pop-up (`:342`). Run the OAuth flow (`:358`). A blocked pop-up gives
   "Your browser blocked the connection page. Allow pop-ups, then try
   again." (`:356`).
5. After a sign-in, test the tools (`:365`). A failed test leaves the
   server off and shows "Signed in, but {service}’s tools could not be
   loaded: {reason} Please connect again to retry." (`:368`).
6. A passing test sends `PATCH {enabled: true}` (`:369`).
7. While the sign-in runs, the button is Cancel. Cancel aborts the flow
   (`:564`).

This is the flow of the Whop card. `scripts/verify-whop.ts` checks it in a
browser. The contact-card check does not run it for AgentMail or AgentPhone
(section 6).

### 3.3 Connect a key card (Vapi, Telnyx)

`connectHosted` (`:393-396`), then `connectWithKey`
(`McpServersPanel.tsx:416-442`):

1. Stop when the list is not loaded, or when an action or a sign-in runs
   (`:394`).
2. Find a server at the exact address, with any name (`:395`).
3. Trim the typed key. An empty key stops the flow with no message
   (`:417-418`).
4. The name is the name of the existing server, or a new name from
   `hostedServerName` (`:424`).
5. Make the entry (`:427`):

   ```json
   { "type": "http", "url": "<official address>",
     "headers": { "Authorization": "Bearer <key>" }, "enabled": false }
   ```

6. A new server: `POST /api/mcp/servers` with the name. An existing server:
   `PUT /api/mcp/servers/<name>` with the entry and no name (`:428-431`).
   The server is saved **off**.
7. Test the tools: `POST /api/mcp/servers/<name>/test` (`:432`, `:62`). The
   key test gets no abort signal, and the card has no Cancel during it.
8. A refusal (`reason: "keys"`) shows "{service} didn’t accept that key.
   Check it and connect again." (`:434`, `en.json:40`). Another failure
   shows "{service}’s tools could not be loaded with that key: {reason}
   Connect again to retry." (`en.json:41`).
9. On a failure, stop (`:435`). The server stays saved and off, **with the
   refused key in its header**. The typed key stays in the field.
10. On a pass, `PATCH {enabled: true}` (`:436`). Clear the typed key
    (`:437`). Set the notice "{service} is connected and enabled." (`:438`).
    The card view does not show this notice. The check mark is the only sign
    of success.
11. A thrown error goes to the error line of this card only (`:440`).

**A new key after a refused key:** Connect again finds the same server and
sends a `PUT` (step 6). The script checks that only one server is at the
address after the good key (`scripts/verify-bot-contact-cards.ts:78`).

**The `PUT` replaces the whole entry** (`server/host/mcp-config.ts:174-197`).
A person can make a server by hand at the same address. The `PUT` then
loses its other headers and fields. A server that was on goes off during the
test.

**The Enter key:** Enter in the key field calls `connectHosted` (`:577`).
The button has more rules (`:566`): a server managed by an organisation, or
a policy with no custom servers and an empty allowlist, disables it. The
Enter path skips these rules in the window. The server still refuses the
save: `add` and `replace` call `refused`, which calls `mcpPolicyRefusal` and
gives 403 `managed_policy` (`server/host/mcp-config.ts:135-140`, `:149`,
`:184`). So this is a difference in the UI, not a way around the policy.

### 3.4 How the server finds a bad key

The key test is `probeRemoteMcpServer` (`server/mcp-probe.ts:186-233`):

1. Send `initialize`, then `tools/list`, with the stored headers
   (`:198-201`).
2. A server that gets a key does not get the extra sign-in check
   (`sendsCredentials`, `:133-135`, `:205`). A key card always sends a key.
3. Remove header values from tool names and descriptions. Keep at most 100
   tools (`:58`, `:77-113`, `:208-209`).
4. Errors, in this order (`:210-228`):
   1. HTTP 401, and the address publishes OAuth metadata: "This server needs
      you to sign in." (`:213-215`, `asksForSignIn` `:144-149`).
   2. HTTP 401 or 403: "The server didn't accept the keys (HTTP <n>). Check
      the header values." with `reason: "keys"` (`:216-218`).
   3. A JSON-RPC error with a text like "unauthorized" or "invalid api key":
      the same message with no status (`:41`, `:219-221`).
   4. Other HTTP status, a protocol error, or no answer: other messages.
5. The card changes `reason: "keys"` to its own text (section 3.3, step 8).

Edge cases:

- **Order of the checks.** A 401 from an address that publishes OAuth
  metadata reads as "needs sign-in", not as a bad key (`:213-215` before
  `:216-218`). A key card has no sign-in, so the person would get the wrong
  advice. Not verified: if Vapi or Telnyx publish such metadata.
- **The removal of a key from the tool text** looks for the whole header
  value `Bearer <key>` (`:208`). A server that shows the bare key in a tool
  description is not masked.
- Only the commit message of `9d2549a8d` says that the real addresses
  refuse a bad key with 401: "the four real endpoints answer a bad key
  with 401". No script checks it.

### 3.5 Where the key is kept, and Disconnect

**Save:**

1. The key is a literal header value, not a `vault:<id>` pointer. The type
   allows both (`server/mcp-registry.ts:18-20`). The vault resolver passes a
   literal value through with no change (`server/vault/mcp-keys.ts:95`).
2. `add` and `replace` write the entry to `config.json` → `mcpServers`
   (`server/host/mcp-config.ts:143-155`, `:174-197`).
3. The 10 dated backups `config.json.bak.<stamp>` hold the key too
   (`server/config-backup.ts:13-16`).
4. The desktop moves model keys out of `config.json` into its encrypted
   store. That move does not look at MCP headers
   (`electron/workspace-credentials.mjs:3-31`, `:40-53`). So on the desktop,
   the Vapi and Telnyx keys stay in clear text while model keys do not.
5. The reference document says this: "They do persist as plaintext in the
   0600 config file — prefer tokens scoped to the one server."
   (`docs/custom-mcp-servers.md:600-601`).

**Read:**

1. `GET /api/mcp/servers` returns header **names** only:
   `headerKeys: Object.keys(server.headers).sort()`
   (`server/mcp-registry.ts:500`).
2. A phone gets four fields for each server (`server/routes/mcp-servers.ts:18-27`).
3. The test result never has a header value (`server/mcp-probe.ts:115`,
   `:208`).
4. There is no `last4` hint for these keys (`server/key-hint.ts:17-31`), so
   the person cannot see which key is saved.
5. The Keys page has no row for these keys
   (`src/components/keys/key-catalog.ts:49-52`). Only the card can change
   them.

**A bot asks for a key:** a bot cannot ask for a Vapi or Telnyx key by name.
The 19 fixed targets of the secret card have none of them
(`packages/phone-protocol/src/credential-request.ts:7-122`,
`server/credential-request.test.ts:71`). A bot can ask with `customSecret`
and get a reference (`:154-159`). A server that a bot then adds at the
official address with `Authorization: Bearer vault:<id>` would also light the
card. This is derived from `hostedConnections`, with no test.

**Disconnect** (`signOut`, `McpServersPanel.tsx:459-482`):

1. A key card: one `DELETE /api/mcp/servers/<name>` (`:468-470`). The
   comment says "A key card's server is the key, so disconnecting removes it
   and the key with it." There is no confirm dialog. The Remove button of
   the list asks for a confirm (`:487`).
2. The server side removes the entry, writes the file, then forgets the
   vault grants, the sign-in and the people links
   (`server/host/mcp-config.ts:230-241`).
3. The key stays in the dated backups until they rotate out.
4. Disconnect matches by address (`:395`, `:548`). So Disconnect deletes a
   server that the person added by hand at the same address, with another
   name.
5. A sign-in card: `PATCH {enabled: false}`, then
   `POST /api/mcp/servers/<name>/sign-out` (`:472-475`). The entry stays.

### 3.6 From a tool call to the approval rules

**Which tools are outbound** (`isOutboundTool`,
`packages/phone-protocol/src/outbound.ts:94-105`):

1. `COMPOSIO_PROXY_EXECUTE`, or a name that matches
   `/^mcp__.+__invoke_api_endpoint$/`, is outbound (`:43`, `:97`). The
   comment: "Telnyx's hosted server reaches its whole API through one tool,
   so any call of it may ring, text or buy." (`:42`). The rule matches this
   tool on any server name, `telnyx-2` too.
2. Remove `mcp__<server>__` and split the rest into words (`:64-79`).
3. A read verb first (`GET`, `LIST`, `FETCH`, `SEARCH`, `READ`, `FIND`,
   `RETRIEVE`, `LOOKUP`, `DOWNLOAD`, `VIEW`, `CHECK`, `COUNT`): not outbound
   (`:47`, `:84-88`, `:101`).
4. A send verb anywhere: outbound. The list has `SEND`, `REPLY`, `FORWARD`,
   `POST`, `PAY`, `TRANSFER`, `BUY`, `PURCHASE`, `DIAL` and others (`:14-35`).
5. A `DRAFT` word with no send verb: not outbound (`:103`).
6. `CREATE`, `ADD`, `NEW` or `MAKE`, with a noun such as `MESSAGE`, `EMAIL`,
   `MAIL` or `CALL`: outbound (`:39-40`, `:104`). The comment: "a created
   call rings someone" (`:38`).

The tests for contact-card names (`shared/outbound.test.ts`):

| Outbound (`:29-38`) | Not outbound (`:69-75`) |
|---|---|
| `mcp__vapi__create_call` | `mcp__vapi__get_call`, `mcp__vapi__list_calls` |
| `mcp__agentphone__make_call`, `make_conversation_call` | `mcp__vapi__create_assistant` |
| `mcp__agentphone__buy_number` | `mcp__agentphone__end_call`, `list_numbers` |
| `mcp__telnyx__dial` | `mcp__telnyx__list_api_endpoints` |
| `mcp__telnyx__invoke_api_endpoint`, `mcp__telnyx-2__invoke_api_endpoint` | `mcp__telnyx__get_api_endpoint_schema` |

No AgentMail tool name is in the code or the tests. The rule is by name
only. A tool name with an unknown verb is not outbound, so the rule fails
open. The reader tried names that are **examples, not known tools** of these
services: `provision_number`, `create_phone_number`, `create_inbox`,
`start_call` and `execute_api_endpoint` would not be outbound. If a service
renames its tool to such a word, the tool stops asking with no warning.

**No "Always allow" for an outbound tool:** `providerToolAllowKey` returns
`null` for an outbound name (`server/provider-tool-allow.ts:39`, test `:20`
for Telnyx). So the card has no allow key. `autoVerdict` also checks
outbound before a saved grant (`server/auto-approve.ts:114-116`). A
non-outbound contact-card tool, such as `end_call`, can get a saved grant.

**The path of a contact-card tool call** (a contact-card server goes to the
engine like any custom server, `server/drivers/claude.ts:1070-1074`):

1. **Below Full access.** The person's server tools are not pre-allowed.
   The engine asks through `--permission-prompt-tool mcp__ogb__approve`
   (`claude.ts:1094-1096`). The request reaches `request.opened`
   (`server/index.ts:6436`), then `autoVerdict`.
2. `autoVerdict` (`server/auto-approve.ts:94-123`), in this order:
   1. A question to the person goes to the person (`:108-110`).
   2. `mode === "full"`: approve (`:112`).
   3. A request that needs an explicit approval: hold (`:113`).
   4. An outbound tool: hold, with source `outbound-guard` (`:114`).
   5. A saved command or a saved tool grant, own files, web search (`:115-120`).
3. An outbound tool gets an "Approval needed" card with the note "This
   sends something on your behalf, so it asks you first." (`:138`, `:153`)
   and no allow key (`server/index.ts:6525-6537`). `approval-cards.md` has
   the card.
4. **At Full access, on the Claude driver,** the engine runs in
   `bypassPermissions` (`claude.ts:953-957`) and gets no prompt tool
   (`:1094`). No request reaches the program. The call goes out.

**The gap: the bot's rule is not applied.** The rule "Sending on your
behalf" is `ask` or `allow`. With no rule, it is `allow` at Full access and
`ask` below it (`outbound.ts:115-120`). The file says: "at Full access they
run unless the bot has a rule of its own" (`:2-3`). Only
`server/outbound-hold.ts:54`, `:111` read the rule. That hold runs only for
the Composio relay (`server/index.ts:14257`) and the meeting chat
(`server/meetings/routes.ts:101`). `autoVerdict` never reads `bot.outbound`.
The two results:

| Bot level and rule | What the person expects (`en.json:3586`) | What happens | Direction |
|---|---|---|---|
| Full access, rule `ask` | A card | The call, text or purchase goes out with no question | **Fails open** |
| Below Full, rule `allow` | No card | A card shows | Asks too much |

- The first row is true on each path through `autoVerdict` (`:112` comes
  before `:114`). On the Claude driver, it is true before `autoVerdict`,
  because no request is made.
- Each card notice promises the rule: "each call follows Sending on your
  behalf" (`en.json:43`, `:45`, `:47`, `:49`).
- The help text of the rule says "Emails, messages, posts, invites, and
  payments through connected apps … Full access sends without asking unless
  you set a rule here." (`en.json:3586`). It does not name calls or number
  purchases.
- `DESIGN.md:64-66` says "no default below Full access". Release v0.1.109
  says "Bots start with Full access, on every engine" (`changelog.md`
  section 6). So a new bot sends, calls and buys with no question by
  default.
- A fixed-string search for `.outbound` in `server/`, `shared/`,
  `packages/`, `electron/` and `src/` finds only these readers of the rule:
  `server/outbound-hold.ts:54`, `:111` and
  `src/components/bot-settings/PermissionsSection.tsx:166`, `:187`.
  `server/routes/bot-patch.ts:288-291`, `:623` write it.

**The program's own hold, for comparison** (`server/outbound-hold.ts`). It
is not on the contact-card path, but a port can use it:

1. It decides with `sendsWithoutAsking(rule, fullAccess, opaque)`
   (`:33-37`). A call that cannot be read ("opaque") goes out under `allow`
   only at Full access.
2. A "Send on your behalf?" card with Allow and Deny waits 9 minutes
   (`:13`, `:58-72`). The bot shows "waiting on you" (`:77-81`).
3. On deny or time-out, the model gets a refusal: "<product> did not send
   this: the user declined. Do not retry it; ask the user what they would
   like instead." or "… nobody answered the approval in time …"
   (`:100-104`).
4. `beforeDispatch` checks the rule again before the send (`:110-117`).
5. Held requests are in memory only (`server/outbound-requests.ts:21-67`).
   A restart loses them.

### 3.7 Bot access

1. The card has a "Bot access" part with the hint "Bots using every enabled
   MCP server inherit this connection." and a button for each bot that
   opens its Access page (`McpServersPanel.tsx:586-591`, `en.json:29-31`).
2. A bot with no `mcpServers` list gets every server that is on
   (`custom-mcp-servers.md` section 3.6, `server/routes/bot-patch.ts:352-374`).
   The settings card writes a list only on the first switch click.
3. Result: the person connects Vapi or Telnyx. Then each bot with no list
   gets a service that spends money on the person's account. No other step
   is necessary.

### 3.8 Incoming mail, texts and calls

The cards do not connect incoming events. Each notice tells the person to
add a webhook for a bot in Automations and paste its address into the
service (`en.json:43`, `:47`, `:49`). The commit has no code for this.

### 3.9 Limits and edge cases

- The four addresses are fixed in the table (`hosted-mcp-apps.ts:53-82`)
  and again in the scripts (`scripts/verify-bot-contact-cards.ts:10`,
  `scripts/verify-whop.ts:11`). If a service moves its address, an old
  server is no longer a card. It shows as one of the person's own servers
  (`ownMcpServer`, `:153-155`), and the card shows "not connected".
- Any running action disables every card (`McpServersPanel.tsx:552`).
- The Connected count adds one for each connected card, not for each server
  (`PluginsPanel.tsx:416`, `:419`).
- `shared/today-outcomes.ts:107` counts a number purchase as a two-minute
  "message". A second AgentMail server (`agentmail-2`) counts as a message,
  not an email, because `AGENTMAIL` is the only name in `EMAIL_APPS` (`:30`).
- The Vapi notice leaves the duty to say "this is an automated call" to the
  person's Vapi assistant (`en.json:45`). The program does not check it.

## 4. The data

### 4.1 The card row (`HostedMcpApp`, `src/lib/hosted-mcp-apps.ts:8-25`)

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Card id, `data-app-tile`, and the first server name |
| `label` | string | Name of the service, never translated |
| `url` | string | The official address. "A server is this app only at exactly this address, over streamable HTTP" (`:13`) |
| `key` | `{ url }`, optional | Present: a pasted Bearer key, made at `url`. Absent: OAuth sign-in |
| `icon` | `{ image }` or `{ glyph }` | A licensed logo, or a plain glyph |
| `description`, `notice` | locale keys | The notice says "What signing in grants, and who owns the service's own approvals" (`:21-22`) |
| `keywords` | string | Search words |

Also: `HOSTED_KEY_HEADER = "Authorization"` (`:138`) and
`HostedConnections = Readonly<Record<HostedMcpAppId, boolean>>` (`:113`).

### 4.2 The stored server (`<data>/config.json` → `mcpServers`)

A key card writes this entry (`McpServersPanel.tsx:427`):

```json
"vapi": {
  "type": "http",
  "url": "https://mcp.vapi.ai/mcp",
  "headers": { "Authorization": "Bearer <key in clear text>" },
  "enabled": true
}
```

- File mode 0600 (`docs/custom-mcp-servers.md:600`). Up to 10 dated copies
  `config.json.bak.<YYYYMMDD-HHMMSS>` (`server/config-backup.ts:13-16`).
- A sign-in card writes the same entry with no `headers`. Its tokens are in
  `<data>/mcp-oauth.json` (`custom-mcp-servers.md` section 4.3).
- No new field. The cards add nothing to `config-status.ts`. "Connected" is
  derived in the window from `enabled`, `auth` and `headerKeys`.

### 4.3 The listing (`GET /api/mcp/servers`)

`{name, type, url, headerKeys, enabled, auth?, …}`
(`server/mcp-registry.ts:495-503`). `auth` is absent when there is no
sign-in record (`server/host/mcp-chat.ts:132-136`).

### 4.4 The bot rule

`outbound?: { policy: "ask" | "allow" }` in the bot row
(`outbound.ts:8-11`). The default is `ask`. With no rule, Full access means
`allow` (`:115-120`). `PATCH` checks it and refuses another shape with 400
"outbound must be { policy: ask | allow }" (`server/routes/bot-patch.ts:288-291`).
A change to `allow` counts as a loosening (`:623`).

### 4.5 The saved grant key

`provider-tool:<instance>:<server>:<tool>:<fingerprint>`. The fingerprint
is the first 16 hex characters of SHA-256 over the server config
(`server/provider-tool-allow.ts:41-42`). The config holds a vault key only
as `vault:<id>` (`server/mcp-grant-spec.ts:1-3`). For a contact-card key,
the config has the literal `Bearer` value, so a new key ends the saved
grants of its non-outbound tools. This is derived from `:17-23`, with no
test.

## 5. The UI

### 5.1 Where the cards are

1. The Apps window (`PluginsPanel.tsx:488-500`) draws no card itself. It
   passes `hostedCards` to `McpServersPanel`, which draws them (`:738`).
2. The hosted cards are first in the main grid, before the X, Email and
   Postiz cards and the Composio cards (`:738-742`).
3. A category pill hides all hosted cards (`:738`). They are never in
   "Suggested" (`:770-783`).
4. In the Connected view a card shows while its state is not known yet
   (`!== false`, `:74-79`).
5. Search is a plain substring match on the label, the keywords and the
   description (`:77`). "sms" finds Telnyx and AgentPhone.
6. When the Composio service is not set up, the notice names the connected
   hosted cards: "Connected: {services}. Set up or restore the connection
   service to use the other apps." (`:624-625`, `en.json:24`).
7. In the "MCP servers" view, the hosted servers are rows of the list
   (`:747-750`).

### 5.2 One card (`renderHostedCard`, `McpServersPanel.tsx:547-594`)

- **Title row:** a 40 px icon tile (`HostedMcpIcon.tsx:3-8`), the label, a
  green check with the label "Connected" (`:560`), and the description.
- **Button:** "Connect" or "Disconnect", with the label "Connect {service}"
  or "Disconnect {service}". "Retry" when the list did not load. A spinner
  while the card works. Cancel while a sign-in runs (`:564-570`).
- **Disabled:** while any action runs (`:566`). Also disabled when the list
  is loaded, the card is not connected, and one of these is true:
  - an organisation manages the server
  - the policy allows no custom servers and has an empty allowlist
  - the card is a key card and the key is empty.
- **Key field** (key cards, not connected, list loaded, `:573-583`): a
  password field with `autoComplete="off"`. Label "{service} API key".
  Placeholder "Paste your {service} key". A link "Get a {service} key" that
  opens `key.url`. After a connect, the field goes away and the key is
  never shown again.
- **Error line:** `role="alert"`, the error of the panel, of the card or of
  its last test (`:551`, `:584`).
- **Bot access:** a `<details>` part with the notice, the hint and a button
  "Manage {name}’s access" for each bot that is not hidden (`:586-591`).

### 5.3 The card texts (`en.json:42-49`)

- AgentMail: "Email inboxes your bots send and receive from, on your own
  AgentMail account." The notice: "Sign in with your AgentMail account. No
  API key needed. … Sending follows Sending on your behalf. …"
- Vapi: "Phone calls your bots place and answer, on your own Vapi
  account." The notice: "Paste a private API key from your Vapi dashboard.
  <product> never shows it again, and Disconnect deletes it. … each call
  follows Sending on your behalf … Have your Vapi assistant open every call
  by saying it is an automated assistant calling for you and that the call
  is recorded."
- Telnyx: "Phone numbers in many countries, texts and calls, on your own
  Telnyx account." The notice: "… Telnyx reaches its whole API through one
  tool, so every Telnyx action a bot takes follows Sending on your behalf,
  including buying numbers billed to your account. …"
- AgentPhone: "US and Canadian numbers for your bots, with texts and calls,
  on your own AgentPhone account." The notice: "… can buy numbers, text and
  place calls, billed to your account; each of those follows Sending on
  your behalf …"

### 5.4 The states

| State | What the card shows |
|---|---|
| List not loaded | A spinner, then "Retry". In card view, one banner "Couldn't load MCP apps: {reason}" with Retry (`:627-636`) |
| Empty key | Connect disabled |
| Busy | A spinner on this card. All buttons and key fields disabled |
| Key refused | Alert "{service} didn’t accept that key. Check it and connect again." The key stays in the field |
| Other test failure | Alert with the reason |
| Connected | Check mark, Disconnect, no key field |

### 5.5 The list view: a wrong sign-in button

In the list of servers, `canSignIn` is true for each hosted server that is
not signed in (`McpServersPanel.tsx:713-714`). A key server has no sign-in
record, so the listing has no `auth` (`server/host/mcp-chat.ts:132-136`).
The Vapi or Telnyx row then shows a "Connect Vapi" button that starts a
browser sign-in (`:744-748`). These services have no browser sign-in. The
tests cover only the card view.

### 5.6 The "Sending on your behalf" control

`PermissionsSection.tsx:165-199`: two buttons, "Ask every time" and "Send
without asking", with `aria-pressed`. It shows the effective rule. A click
saves a rule only when it differs from the stored rule (`:187`). So a click
on the default that is shown stores it as an explicit rule.

## 6. The tests

| Test | What it guarantees |
|---|---|
| `src/lib/hosted-mcp-apps.test.ts:5-12` | Ids are unique and valid. Addresses are unique and https |
| `:14-27` | A card matches its address with or without a slash, and never a look-alike, a query, a hash, user info, another path or `sse` |
| `:28-33` | Names `id`, `id-2`, `id-3` |
| `:39-54` | The two rules of "Connected" |
| `:56-59` | The key cards are exactly `vapi` and `telnyx`, with https key pages |
| `McpServersPanel.hosted.test.ts:96-230` | Sign-in cards: the order POST → sign-in → test → PATCH, Cancel, failure texts, Disconnect = PATCH then sign-out, the policy disables the button |
| `:246-254` | Key cards: Connect is off for an empty key and for spaces |
| `:256-267` | `" sk-live "` gives exactly `{name, type, url, headers: {Authorization: "Bearer sk-live"}, enabled: false}`, no sign-in, no PATCH before the test |
| `:269-286` | A refused key and a time-out give their texts, no PATCH |
| `:288-294` | An existing server named "calls" gets a PUT, no POST |
| `:296-305` | Disconnect is one DELETE, no sign-out |
| `McpServersPanel.embedded.test.ts:96-105` | Title "with no API key form". **Wrong for Vapi and Telnyx.** It passes because the key field is an `<input>`, not a `<textarea>`, and because other cards have the text "No API key needed" |
| `PluginsPanel.navigation.test.ts:127-178` | Hosted cards need no Composio set-up, add to the count, are found by search, and show in Connected |
| `:638-648` | A server at a hosted address is never counted as an own server |
| `shared/outbound.test.ts:29-38`, `:69-75` | The contact-card names in section 3.6 |
| `:130-140` | The effective rule: `allow` at Full access with no rule, else `ask`. A stored rule wins at each level |
| `server/provider-tool-allow.test.ts:20` | `mcp__telnyx__invoke_api_endpoint` gets no allow key |
| `server/outbound-hold.test.ts:163-186` | The hold keeps a stored rule at Full access. This is for the relay path only |
| `scripts/verify-bot-contact-cards.ts` | A browser check of the Vapi card. A local fake server accepts only `Bearer good-key` (`:12-13`). Four cards show. AgentMail has no field. Connect is off with no key. A wrong key gives the alert. The server is then off, with `headerKeys == ["Authorization"]` and no key in the address or the listing (`:57-71`). A good key uses the same server and shows "1 connected" (`:74-81`). Disconnect removes the server (`:84-86`) |

The browser check uses a middleware. It changes the saved address to the
fake only when the address is exactly `https://mcp.vapi.ai/mcp`. It changes
the address back in the answers (`:28-40`). "Only the fixture substitutes transport:
production always saves the official URL." (`:31`).

**Not tested:**

- AgentMail and AgentPhone sign-in, and the Telnyx connect.
- The approval of any contact-card tool. The fake `create_call` is never
  called.
- The key on disk, in logs or in error texts. Only the listing is checked.
- The Enter key, the policy rules for key cards, and the list view of a
  key server.
- That the bot's rule applies to a contact-card tool.

## 7. Ours compared

Our crates are skeletons now. Step 16 builds custom MCP servers with headers
first. OAuth sign-in comes later (P244). The rows below are proposals until the
author decides.

| Reference | Ours |
|---|---|
| `src/lib/hosted-mcp-apps.ts` (the table, the address match, "connected") | `bot-protocol::mcp::hosted` (a static table and pure functions, no I/O) |
| The key entry of `McpServersPanel.tsx:416-442` | A Tauri command in `bot-desktop` that calls `bot-core::mcp_registry`: test first, then save (T3) |
| The header value in `config.json` | `bot-core::secrets` (the keychain, P19), and the entry holds only a reference |
| `server/mcp-probe.ts` (the key test) | `bot-engine::mcp::probe` |
| `packages/phone-protocol/src/outbound.ts` | `bot-protocol::outbound` (the rule type, and the classifier as a pure function) |
| `server/auto-approve.ts`, `server/outbound-hold.ts` | The one decision function of `bot-core` (P112), which reads the bot's rule (T1) |
| `server/provider-tool-allow.ts` | The saved grants of `bot-core`, with "sends" as a flag (P140) |
| `McpServersPanel.tsx` `renderHostedCard`, `PluginsPanel.tsx` | `crates/bot-desktop/ui` |

**Where our documents say something else:**

| Our document | It says | The reference project |
|---|---|---|
| `docs/decisions.md` D12 | Two ways: custom MCP servers and Composio | A third kind sits on the first way: hosted cards are table rows that make custom MCP servers at fixed addresses, with no server code (`git show --stat 9d2549a8d`) |
| `docs/plan/README.md` step 16 | "custom MCP servers, then Composio" | Key cards need only headers, so they fit the first version of step 16. Sign-in cards need OAuth (P244) |

## 8. Where we can be better

1. **Apply the bot's send rule on every path.** One decision function reads
   the level, the bot's `outbound` rule and the tool. At Full access with
   the rule `ask`, a send waits. A driver that cannot ask at Full access
   must not get outbound tools at that level, or must run them through our
   proxy. Reason: the reference ignores the rule for contact-card tools,
   and fails open at Full access (`server/auto-approve.ts:112-114`,
   `server/drivers/claude.ts:953-957`, `:1094`). Its own texts promise the
   rule (`en.json:43-49`, `:3586`). This is "the approval model changed".
2. **Fail closed for the tools of a hosted card.** Each card row lists its
   known read tools. Every other tool of that server counts as outbound.
   Reason: the name rule fails open for an unknown verb, and a renamed tool
   at the service stops asking with no warning (`outbound.ts:94-105`). Our
   own tools can carry a "sends" flag (P140), but outside tools cannot.
3. **Test the key before the save.** The probe takes the key in memory. The
   entry is saved only after a pass. Reason: the reference saves a refused
   key in clear text and keeps it (`McpServersPanel.tsx:427-435`,
   `verify-bot-contact-cards.ts:69`).
4. **Keep a card key in the keychain.** The entry holds a reference, so the
   settings file and its backups hold no key. Reason: the reference keeps
   it in clear text in `config.json` and 10 backups, and Disconnect does not
   remove it from the backups (`server/config-backup.ts:13-16`,
   `electron/workspace-credentials.mjs:40-53`). This is "a secret in the
   wrong place" (with P19 and P232).
5. **A new card reaches no bot until the person chooses.** Reason: a bot
   with no list gets every server that is on (`custom-mcp-servers.md`
   section 3.6). So a Vapi key reaches each such bot, and the bot can spend
   money.
   This is "an access right in the wrong place".
6. **"Connected" means that the last test passed.** Store the time and the
   result of the last test, and show "key refused" after a 401 at a call.
   Reason: the reference reads only a header name
   (`hosted-mcp-apps.ts:142-150`), so a revoked key shows "Connected".
7. **Disconnect deletes only a server that the card made.** Mark a card's
   server when the card makes it. Reason: the reference deletes any server
   at the address, with no confirm (`McpServersPanel.tsx:395`, `:468-470`).
8. **A key card never asks for a sign-in.** The probe knows the kind of the
   card. Reason: a 401 with OAuth metadata reads as "needs sign-in"
   (`server/mcp-probe.ts:213-218`), and the list view shows a sign-in
   button for a key server (`McpServersPanel.tsx:713-714`).
9. **Mask the bare key too.** Mask both `Bearer <key>` and `<key>` in tool
   text and errors. Reason: the reference masks only the whole header value
   (`server/mcp-probe.ts:208`).
10. **One copy of the addresses.** The scripts and the tests read the
    table. Reason: three copies can drift (`hosted-mcp-apps.ts:53-82`,
    `verify-bot-contact-cards.ts:10`, `verify-whop.ts:10-11`).

**Problems of `changelog.md` section 5 in this feature:**

| Problem | In this feature | Where |
|---|---|---|
| A secret or an access right in the wrong place | Yes | Key in clear text in `config.json` and backups. A refused key stays saved. A new card reaches every bot with no list. No key in an address and no key in a listing: the reference does these two right (items 3, 4, 5) |
| The approval model changed | Yes | The cards came 18 minutes after the rule change of `84b13621b`. v0.1.176 ("never remembered for anything that sends"): the reference does this here (`server/provider-tool-allow.ts:39`). v0.1.144 (two choices for sends): the engine path ignores this rule, and Full access fails open (items 1, 2) |
| A file written over after a failed read | Inherited | Sign-in cards use `mcp-oauth.json`: a corrupt file reads as empty, and the next sign-in deletes the other records (`custom-mcp-servers.md` section 8 item 1, `server/mcp-oauth-store.ts:63-66`, `:107-114`). So a sign-in to AgentMail can delete the Whop or AgentPhone tokens. Key cards use `config.json`: invalid JSON is refused, but a file that fails the schema loads as `{}`, and the next add keeps only the new server. That is derived in `custom-mcp-servers.md` section 8 and not verified (section 9) |
| Sign-in to an outside service, and services that change | Yes | Fixed addresses with no alias. Tool names decide the approval. A 401 with OAuth metadata reads as "needs sign-in" (items 2, 6, 8, 10) |

## 9. Not verified

- The real tool names of the AgentMail, AgentPhone, Vapi and Telnyx servers
  today. The names `provision_number`, `create_inbox`, `start_call` and
  `execute_api_endpoint` in section 3.6 are examples, not known tools.
- If `mcp.vapi.ai` or `api.telnyx.com` publish OAuth metadata (it decides
  "refused key" or "needs sign-in").
- The claim of the commit that the four real addresses answer a bad key
  with 401.
- The OAuth metadata of AgentMail and AgentPhone.
- How drivers other than Claude (Codex, ACP, the chat runtime) handle a
  contact-card tool at Full access. The `autoVerdict` result is the same
  for all of them, but their native modes were not read.
- If the `auto` reviewer of Claude asks before an outbound MCP call
  (`claude.ts:956`).
- What the approval card shows for `invoke_api_endpoint` (the method and the
  path that the person sees).
- How the backups rotate, so how long a key stays on disk after Disconnect
  (`server/config-backup.ts` read 1-40 only).
- If the remote proxy masks the header value in its logs.
- If a later 401 at a call turns a key card off.
- If a bot-added server with `Bearer vault:<id>` at a card address lights
  the card (derived, no test).
- If a schema-invalid `config.json` loads as `{}` and the next save keeps
  only the new server (derived in `custom-mcp-servers.md`).
- If a failed read of `bots.json` can lead to a save of an empty list
  (`server/store.ts:311`, `:534`).
- `scripts/testing/preview-fixture.ts` was not read.
- Online checks of the services were not done.
