# Hosted app connections: a social posting service and a hosted app with OAuth and no key

Feature rows of [`../reference-features.md`](../reference-features.md),
group 3, part 20:

- "A connection to a social posting service" (`postiz.md`).
- "A connection to a hosted application with OAuth and no key" (`whop.md`).

Step 16 of [`../../plan/README.md`](../../plan/README.md). Crate:
`bot-engine`, with the stored key in `bot-core` and the cards in
`bot-desktop` (section 7).

Read on 2026-11-26 at commit `96ff84455` of the reference project. The HEAD
of the clone was `96ff84455`, so the readers read the files directly. All
paths are in the reference project unless a line says "ours". The
`enterprise/` directory was not opened. Four subagents read four groups of
files. The main session checked 14 key claims against the code, and all 14
agree (section 9 lists what is not checked).

In quoted text from the reference project, `<product>` replaces the product
name of the reference project.

## What this file adds to earlier research

- [`custom-mcp-servers.md`](custom-mcp-servers.md) has the MCP registry, the
  gate, the OAuth sign-in, the refresh and the token store. It names the
  hosted cards in one line (`:1008-1010`). This file does not repeat that
  research. It adds the two connections that use it: what each one stores,
  how each card calls the sign-in, and how each Disconnect works.
- [`write-only-secrets.md`](write-only-secrets.md) names the posting service
  three times: as one `key` field (`:147`), as one of five keys that the
  server tests before the save (`:173`), and in the list of key fields
  (`:388`). This file adds the full path of that key (section 3.2):
  - the address rules.
  - the header that only a turn gets.
  - the empty value on disk on the desktop, and the clear text on a server.
  - the refusal for a paired phone.
  - the rejection mark in memory.
  - a log line that can quote part of the key.
- [`approval-cards.md`](approval-cards.md) section 3.7 has "never remembered
  for anything that sends, posts or moves money" (v0.1.176) and the name
  rule `isOutboundTool`. This file adds only how a post and a payment reach
  that rule. It adds three new facts (section 3.6):
  - the rule misses some tool names of the two connections.
  - the per-bot sending rule does not apply to these servers.
  - a second path, the view of an app, has no card.
- [`custom-mcp-servers.md`](custom-mcp-servers.md) section 4.3 records that
  a corrupt `mcp-oauth.json` reads as empty and that the next `put` writes
  over it. This file adds two facts (section 3.7). All five methods that
  change the store do this. The spent-refresh mark can be lost in the same
  way.
- The border with `bot-contact-cards` and `connected-apps` (other worktrees):
  the contact cards use the same browser sign-in
  (`src/lib/mcp-sign-in.ts`). The connected-apps catalog (Composio) shows
  the same grid of cards (`src/components/PluginsPanel.tsx:738-749`). This
  file gives only the parts of the two connections.

**Lines of done files that this file makes more exact:**

| Done file and line | It says | At `96ff84455` |
|---|---|---|
| `approval-levels.md:87-88` | the outbound hold shows "before a send through a connected app (mail, chat, posts, payments)" | True for the Composio apps and for meetings only. A post or a payment through a custom MCP server (both connections of this file) never gets this card (section 3.6) |
| `approval-levels.md:906-909` | "A send with no card happens only at Full with no rule, or with "allow"" | For a custom MCP server, Full access approves a send with any rule, and "allow" does not remove the outbound card below Full (`server/auto-approve.ts:112-114`) |
| `approval-cards.md:743-747` | the list of send verbs and nouns | Correct, but the lists have singular words only, so `payouts_create` and `transfers_create` are not outbound (section 3.6) |

## 1. In short

The reference project connects two kinds of outside service to its bots.
Each one becomes one ordinary custom MCP server. After the connection, the
usual MCP rules apply: the gate, the server list of each bot and the scopes
of a team.

**Terms used in this file:**

- **MCP server:** a program or an address that gives tools to an engine
  through the Model Context Protocol.
- **The posting service:** a social post scheduler (Postiz). Its own MCP
  server gives four tools: list the channels, read the rules of a channel,
  make a post (draft, schedule or now) and list the posts
  (`server/testing/fake-postiz.ts:32-43`).
- **The hosted app:** a payment and membership platform (Whop) that has an
  official MCP server at a fixed address,
  `https://mcp.whop.com/mcp` (`src/lib/hosted-mcp-apps.ts:30-38`). It has a
  browser sign-in and no key.
- **Hosted app table:** a list of eight hosted MCP apps in the window code
  (`src/lib/hosted-mcp-apps.ts:27-107`). Each row gives an address, a name,
  an icon, a text and, for some apps, a key field. The cards, the search,
  the "Connected" filter and the count all come from this table
  (`:27-28`).
- **OAuth sign-in:** the person signs in to the outside service in the
  browser. The service gives the reference project a token. The person
  types no key.
- **Organisation API key:** a key that the person copies from the settings
  of the posting service. It is the second way to connect the posting
  service.
- **Outbound tool:** a tool that "sends something to someone, or moves
  money", as the function `isOutboundTool` decides from the tool name only
  (`packages/phone-protocol/src/outbound.ts:93-105`).
- **Sending rule:** a per-bot setting "ask" or "allow" for outbound tools
  (`outbound.ts:8-11`). It shows a "Send on your behalf?" card.
- **App view:** an interactive card that an MCP server draws in the chat
  (an "MCP App"). The view can call the tools of its server
  (`server/chat-apps-mcp.ts:300-330`).
- **`readOnlyHint`, `destructiveHint`:** marks that an MCP server puts on
  its own tools: "this tool only reads", "this tool deletes or destroys".
  The server decides them. The reference project does not check them.
- **App-only tool:** a tool that only an app view can call. The model does
  not see it (`chat-apps-mcp.ts:328`).
- **Approval level:** how much a bot does before it asks the person. **Full
  access** is the level that asks for nothing. See `approval-levels.md`.
- **Composio:** an outside service that gives many connected apps through
  one MCP endpoint (decision D12). Its path in the reference project has
  its own send card.
- **Gate, PKCE, dynamic client registration, loopback listener:** see
  `custom-mcp-servers.md` section 1. In short: the gate filters and checks
  each MCP call. PKCE is a one-time secret that ties the sign-in to the
  program that started it. Dynamic client registration makes a new OAuth
  client for each sign-in. The loopback listener is a port on
  `127.0.0.1` where the browser comes back.
- **Spent-refresh mark:** a refresh token that the store records as sent
  before the answer comes. A server that rotates tokens can revoke the whole
  sign-in when it sees one token two times.

**The posting service** has two ways to connect:

1. Browser sign-in, for the cloud service only. The card writes a server
   entry that is off, the generic MCP sign-in runs, the card tests the
   tools and then turns the server on.
2. An organisation API key, for the cloud service or a self-hosted one. The
   server tests the key, stores it apart from the server entry and adds it
   as a header only when it starts a turn.

**The hosted app** has one way: browser sign-in. The card adds a server
entry at the exact address, off and with no header. Then it runs the
generic sign-in, tests the tools and turns the server on. Disconnect turns
the server off and signs out. The entry stays.

**Main findings:**

- A post of the posting service is an outbound tool, so the rule
  "never remembered" applies to it. Most money actions of the hosted app
  are not outbound by the name rule: `payouts_create`, `transfers_create`,
  `payments_create`, `payments_void` and a fee change pass as ordinary
  writes. Only `payments_refund` is outbound (section 3.6). The names come
  from a synthetic catalog. The live names are not verified.
- At Full access, the approval function approves each call before the
  outbound check (`server/auto-approve.ts:112`). The per-bot sending rule
  is read only on the Composio path (`server/index.ts:14257`), so it does
  not apply to these two servers.
- An app view can run a tool with no card when the outside server marks the
  tool app-only and not destructive (`server/chat-apps-mcp.ts:326-329`).
- A sign-in in progress is in memory only. A restart ends it, and the
  window shows "Sign-in didn't finish. Try again." (section 3.8).
- Each method that changes the token store writes over the whole file
  after a failed read (`server/mcp-oauth-store.ts:63-104`, `:107-114`).

## 2. Files read completely

Line counts at `96ff84455`.

**Group 1, the posting service, server side:**

| File | Lines |
|---|---|
| `shared/postiz.ts` | 40 |
| `server/postiz/connection.ts`, `.test.ts` | 80, 69 |
| `server/postiz/service.ts`, `.test.ts` | 223, 212 |
| `server/routes/postiz.ts` | 55 |
| `server/postiz.e2e.test.ts` | 182 |
| `server/testing/fake-postiz.ts` | 171 |
| `skills/social-posts/SKILL.md`, `manifest.json` | 92, 46 |
| `server/skill-social-posts.test.ts` | 27 |
| `electron/workspace-credentials.mjs` | 82 |
| `electron/credential-patch.mjs` | 97 |

**Group 2, the posting service, UI and documents:**

| File | Lines |
|---|---|
| `src/components/PostizCard.tsx`, `.test.ts` | 355, 222 |
| `src/lib/postiz.ts` | 37 |
| `docs/verification/postiz.md` | 71 |
| `scripts/verify-postiz.ts` | 115 |
| `docs/pr-screenshots/postiz/1-…png` to `7-…png` | 7 images, each looked at |

**Group 3, the hosted app:**

| File | Lines |
|---|---|
| `src/lib/hosted-mcp-apps.ts` | 160 |
| `src/components/HostedMcpIcon.tsx` | 8 |
| `src/components/McpServersPanel.hosted.test.ts` | 412 |
| `src/components/McpServersPanel.embedded.test.ts` | 158 |
| `server/testing/whop-like-catalog.ts` | 152 |
| `docs/verification/whop.md` | 72 |
| `scripts/verify-whop.ts` | 174 |
| `scripts/testing/whop-preview.tsx` | 10 |
| `src/assets/whop/README.md` | 6 |
| `src/lib/app-catalog.test.ts` | 53 |

**Group 4, the shared paths:**

| File | Lines |
|---|---|
| `packages/phone-protocol/src/outbound.ts` | 179 |
| `shared/outbound.ts`, `shared/outbound.test.ts` | 1, 213 |
| `server/auto-approve.ts`, `.test.ts` | 165, 221 |
| `server/provider-tool-allow.ts`, `.test.ts` | 50, 70 |
| `server/always-allow.ts` | 90 |
| `server/credential-env.ts` | 106 |
| `electron/diagnostics.mjs` | 375 |
| `server/mcp-http.ts` | 565 |
| `server/user-errors.ts` | 269 |
| `server/mcp-oauth-store.ts`, `.test.ts` | 120, 48 |
| `server/key-rejections.ts` | 47 |
| `src/lib/mcp-sign-in.ts` | 101 |
| `src/lib/analytics-allowlist.ts` | 94 |
| `docs/analytics.md` | 206 |

**Ranges of large files:**

| File (lines) | Ranges read |
|---|---|
| `server/index.ts` (15,258) | 95-102, 6425-6520, 11560-11578, 11664, 12200-12226, 14190-14300 |
| `server/config.ts` (1,227) | 300-308, 434-439, 712-724, 765-806, 875-905, 1195-1235 |
| `server/routes/config.ts` (729) | 405-425, 570-640 |
| `server/mcp-oauth.ts` (859) | 1-100, 224-530 |
| `server/chat-apps-mcp.ts` (463) | 1-20, 280-370 |
| `server/host/connection-health-host.ts` (293) | 1-130, 176-230 |
| `server/host/mcp-config.ts` (297) | 1-30, 240-275 |
| `server/host/mcp-servers-host.ts` (261) | 170-200 |
| `server/routes/mcp-servers.ts` (246) | 120-150 |
| `server/outbound-hold.ts` (119) | 1-60 |
| `server/turn-outcome.ts` (157) | 1-12, 90-125 |
| `server/mcp-grant-spec.ts` (100) | 1-40 |
| `src/components/McpServersPanel.tsx` (813) | 60-200, 290-650, 700-813 |
| `src/components/PluginsPanel.tsx` (807) | 34-35, 70-82, 140-150, 400-442, 618-630, 732-752 |
| `src/components/keys/key-catalog.ts` (293) | 48-52, 178-187 |
| `src/state/config-status.ts` (254) | 28-36 |
| `src/lib/ready-bots.ts` (426) | 110-155 |
| `src/components/ReadyBotGallery.tsx` (77) | 10-77 |
| `src/lib/usage-snapshot.ts` (288) | 45-78 |
| `src/locales/en.json` (12,062) | 15-45, 90-115, and single lines (section 5) |
| `src/assets/whop/LICENSE.txt` (201) | 1-5, for the license name: Apache-2.0 |

`src/assets/whop/logo.png` was not opened.

## 3. How it works

### 3.1 The posting service: what a bot gets

1. One MCP server entry with the name `postiz` (`shared/postiz.ts:4-5`).
   "It is one `postiz` MCP server entry, so the MCP gate, each bot's server
   selection and a Team Cloud's scopes treat it like any other"
   (`server/postiz/service.ts:2-3`).
2. The tools come from the posting service, not from the reference project:
   `integrationList`, `integrationSchema`, `schedulePostTool` (with `type`
   `draft`, `schedule` or `now`) and `postsListTool`
   (`server/testing/fake-postiz.ts:32-43`, `server/postiz.e2e.test.ts:103`).
   Claude Code loads them on demand, because `alwaysLoad` is not set
   (`server/postiz.e2e.test.ts:112-113`).
3. A skill `social-posts` shows previews of posts. It does not post, and it
   works with or without the connection (`skills/social-posts/SKILL.md:3`).
   When the service is connected, "its `integrationSchema` is the authority
   for that channel's rules" (`SKILL.md:91`).
4. A ready bot "Buzz", "Social media manager", uses the connection
   (`src/lib/ready-bots.ts:119-143`). Its instructions say:
   - make each post a draft unless the person gave a time (`:129`).
   - "Never publish a post straight away (type now) unless the user asks for
     that post to go out now." (`:130`).
   - add the post "without waiting for a reply" after the preview (`:128`).
   - start with a paused routine "Weekly post plan" (`:143`).

### 3.2 The posting service: connect with an API key

1. The person opens the key form and types a key and an optional address.
   An empty address means the cloud service, `https://api.postiz.com`
   (`shared/postiz.ts:8`, `server/postiz/connection.ts:19`).
2. The card first calls `POST /api/postiz/key-check {key, address?}`
   (`src/components/PostizCard.tsx:190`). The server:
   - refuses a body that is not JSON (415) or larger than 8,192 bytes
     (`server/routes/postiz.ts:43-46`).
   - refuses an empty key, a key longer than 512 characters or a key with
     white space: 400 `key_rejected` (`:48`).
   - checks the address (step 3).
   - asks the policy of the organisation: 403 `managed_policy`.
   - sends `initialize` and `tools/list` to `<address>/mcp` with
     `Authorization: Bearer <key>`, with a limit of 15 s
     (`server/postiz/service.ts:32`, `:119-128`).
   - saves nothing and runs no tool (`service.test.ts:62-68`).
3. The address rules (`server/postiz/connection.ts:17-37`):
   - The address must be https, or http on `127.0.0.1`, `localhost` or
     `[::1]`, and http only when the server is not a cloud or a hosted
     workspace (`:11`, `:20-31`, `server/index.ts:12209`).
   - A user name or a password is refused (`:27`).
   - A `?` or `#` part is refused (`:28`).
   - A path that ends in `/mcp/<x>` or `/sse/<x>` is refused with "That
     address has a key in it" (`:33-35`, `server/user-errors.ts:177`).
   - A trailing `/` and a pasted `/mcp`, `/mcp-oauth` or
     `/mcp-oauth-dynamic` are removed (`:32`, `:36`).
4. If the wanted address is not the saved one, the card sends
   `PUT /api/config {postiz:{url}}`. Then it saves the key with
   `saveCredential("postiz", …)`, which becomes `PUT /api/config
   {postiz:{key}}` (`PostizCard.tsx:198-201`, test `:146`). These are two
   requests. If the second one fails, the address is already changed.
5. Before the write, `configCheck` tests the key again at the new or saved
   address (`server/routes/config.ts:418-419`,
   `server/postiz/service.ts:149-163`). A refused key is never stored
   (`server/postiz.e2e.test.ts:146-150`).
6. Where the key goes:
   - **On the desktop:** into the encrypted store of the desktop as
     `postizApiKey` (`electron/workspace-credentials.mjs:29`). With
     `?secretStorage=external`, the server writes `postiz.key = ""` to
     `config.json` (`server/routes/config.ts:610`). The desktop gives the
     key to the server as the variable `OMB_POSTIZ_API_KEY`
     (`workspace-credentials.mjs:75-82`).
   - **On a server with no desktop:** in clear text in `config.json`
     (`server/routes/config.ts:616-617`).
   - A paired phone cannot set this key: `postiz` is not in
     `PHONE_KEY_CREDENTIALS` (`electron/credential-patch.mjs:35-46`).
   - The engine processes never get the variable
     (`server/credential-env.ts:4-5`, `:34`).
7. After the save, `configSaved` clears the rejection mark and writes the
   server entry `{type:"http", url:"<address>/mcp", headers:{}, enabled:true}`
   (`server/routes/config.ts:637`, `server/postiz/service.ts:167-181`). The
   entry never holds the key (`service.test.ts:89-91`).
8. For each turn, `customMcpServers` adds `Authorization: Bearer <key>` to
   the `postiz` server (`server/config.ts:1222-1224`). `postizKeyHeaders`
   adds it only when three conditions are true
   (`server/postiz/connection.ts:75-80`):
   - the server name is `postiz`.
   - a key is saved.
   - the server address is `<saved address>/mcp`.
9. The test route of MCP servers adds the same header
   (`server/host/mcp-config.ts:262-264`).

**Error paths and limits:**

- The refusal texts show only the host, not the key
  (`server/postiz/service.ts:40-49`): `key_rejected` "Postiz didn't accept
  this API key. Copy it again from Postiz → Settings → Public API.",
  `unreachable` and `not_postiz`.
- The key check sends the key to each https address that the admin types,
  also to an address on a private network. Only the policy of the
  organisation limits this (`service.ts:120-125`).
- A change of the address only removes the entry: the method becomes
  `old-key`, and the person must save the key again
  (`connection.ts:61-70`, `service.test.ts:93-96`).
- To remove the key (`PUT {postiz:{key:""}}`) removes the entry
  (`service.ts:180`, `e2e:175-176`).
- **The write can be lost.** `write()` waits while another MCP change is in
  progress and tries again every 50 ms. After 10 s it stops and says
  nothing (`server/postiz/service.ts:34-35`, `:70-75`). `configSaved`
  returns nothing, so a key save can succeed and the entry is never
  written. The retry is in a timer, so a restart also loses it.
- A test environment variable `OMB_POSTIZ_CLOUD_URL` replaces the cloud
  address in the shipped code. It accepts each https host
  (`connection.ts:39-50`).

### 3.3 The posting service: connect with the browser sign-in

1. The person clicks Connect. The card opens a browser tab during the click,
   "before a request uses up the browser's user activation"
   (`src/components/PostizCard.tsx:125-126`).
2. The card calls `POST /api/postiz/sign-in` (`PostizCard.tsx:134`). The
   server (`server/postiz/service.ts:136-142`):
   - refuses with 409 `busy` when another MCP change is in progress.
   - refuses with 409 `taken` when a `postiz` server exists that the card
     did not make (section 3.5).
   - refuses with 403 `managed_policy` when the policy refuses.
   - else writes `{type:"http", url:"<cloud>/mcp-oauth-dynamic", headers:{},
     enabled:false}` (`service.test.ts:146`).
3. The card runs the generic sign-in `runMcpSignIn("postiz", …)`
   (`PostizCard.tsx:140-144`). The steps are in `custom-mcp-servers.md`
   section 3.7: dynamic client registration, PKCE S256, `resource`, a
   loopback listener, and a poll of
   `GET /api/mcp/servers/postiz/sign-in/:flowId` until `succeeded`
   (`server/postiz.e2e.test.ts:91-100`).
4. On success, the card tests the tools with
   `POST /api/mcp/servers/postiz/test` (`PostizCard.tsx:151`).
   - A failure shows "Signed in, but Postiz’s tools could not be loaded:
     {reason} Please connect again." (`:154`, `en.json:115`). The sign-in
     stays stored. The card does not remove it.
5. Then the card turns the server on with `PATCH /api/mcp/servers/postiz
   {enabled:true}` (`PostizCard.tsx:157`). Until then, the status is
   `not-connected` although the sign-in succeeded (`service.ts:111`,
   `service.test.ts:156-158`).
6. The token is kept only in `mcp-oauth.json` (`e2e:119`). Tokens of the
   posting service do not expire and have no refresh token
   (`service.test.ts:162-163`, `fake-postiz.ts:156-159`).
7. To change from a key to the sign-in, `prepareSignIn` writes over the
   entry with the sign-in address. The key stays in the config, but no turn
   sends it, because the address no longer agrees (`service.test.ts:175-179`,
   `connection.ts:78`).

**Error paths and limits:**

- The sign-in is for the cloud service only. A self-hosted service has no
  sign-in in the reference project (`connection.ts:52`).
- A refused consent gives `error=access_denied` (`fake-postiz.ts:137-139`).
  The card shows the message of the result or "Sign-in didn't finish. Try
  again." (`PostizCard.tsx:146-148`, `en.json:6196`).
- A blocked popup shows "Your browser blocked the connection page. Click
  Continue to open it." (`PostizCard.tsx:113`, `:142`).
- A sign-in that ends when the card is not open leaves the entry off. The
  status stays `not-connected` until someone turns it on (`service.ts:111`,
  `:133-134`).
- **Team mode "Only for me":** the card sets the scope to `person`
  (`PUT /api/team/connection-scopes`), turns the server on and starts the
  sign-in of the person (`POST /api/team/my-connections/mcp/postiz/sign-in`).
  It asks every 1.5 s for 5 minutes, then shows "The sign-in took too long.
  Connect again." (`PostizCard.tsx:19-20`, `:103-120`, `en.json:103`).

### 3.4 The posting service: check again and Disconnect

**Check again** (`POST /api/postiz/check`, `server/postiz/service.ts:198-219`):

1. The card calls it when it opens with a connected status and team scope
   (`PostizCard.tsx:81-86`). No timer calls it.
2. The server checks only an entry that is on and that the card made. It
   checks at most every 5 minutes for each service object (`service.ts:33`,
   `:54`, `:204`, `:213`). Each write resets the time (`:86`).
3. A sign-in that gets 401: `markNeedsSignIn`, and the state becomes
   `needs-sign-in` (`:215`, `e2e:122-123`).
4. A key that fails: `noteKeyRejected`, and the state becomes `key-refused`
   (`:216`, `:114`). A success clears the mark (`:217`).
5. The rejection mark is a SHA-256 fingerprint of the key beside the
   address, in a `Set` in memory (`server/key-rejections.ts:1`, `:6`,
   `:9-10`). A restart loses it, so a refused key shows `connected` until
   the next check.
6. In person scope the card does not call the check (`PostizCard.tsx:85`).

**Disconnect** (`DELETE /api/postiz`, `service.ts:183-196`):

1. The card asks "Disconnect Postiz? Bots stop using it until you connect it
   again." (`PostizCard.tsx:219`, `en.json:110`).
2. If a key is saved, the card first saves an empty key
   (`PUT /api/config {postiz:{key:""}}`) (`PostizCard.tsx:226`, test
   `:172-182`).
3. The server refuses with 409 `busy` or `taken`. Else it signs out of the
   sign-in, removes the entry (`write(null)`, which also forgets the sign-in
   and the app view list, `service.ts:83-85`), and calls
   `team.forgetServer("postiz")`.
4. The server route does not remove the key. Only the config save removes
   it (`service.ts:183-184`). The card does step 2 for this reason.
5. After Disconnect, the next turn has no `postiz`, and the token is in no
   file, log or answer (`e2e:125-131`).

### 3.5 The hosted app: connect and Disconnect

**The record** (`src/lib/hosted-mcp-apps.ts:8-25`, row `:30-38`): `id`
`whop`, `label` "Whop", `url` `https://mcp.whop.com/mcp`, an image icon, a
description key, a notice key and search words. The row has no `key` field,
so the card uses the browser sign-in (`:15-17`).

**Recognition by address** (`hostedMcpApp`, `:117-128`):

1. The server must be `type: "http"` with an address.
2. An address with a query, a fragment, a user name or a password is never
   this app (`:123`). The comment says: "A look-alike host or a URL carrying
   a key is never branded" (`:117-118`).
3. The origin must be equal, and the path equal or equal plus `/`
   (`:124-127`).
4. The name of the server has no part in it. A server named `whop` at
   another address is not this app (`McpServersPanel.embedded.test.ts:120-125`).

**Connect** (`connectHosted`, `src/components/McpServersPanel.tsx:393-414`):

1. The card does nothing while the list loads, while another action runs or
   while another sign-in is open (`:394`). One sign-in at a time for all
   cards (`:109-110`).
2. If a server at this address exists under any name, the card signs in to
   it and saves nothing new (`:395`, `:397`).
3. Else the name is `whop`, then `whop-2`, `whop-3` (`hostedServerName`,
   `hosted-mcp-apps.ts:130-136`). The card sends `POST /api/mcp/servers
   {name, type:"http", url, enabled:false}` with no header and no key
   (`McpServersPanel.tsx:405-406`, test `McpServersPanel.hosted.test.ts:166-173`).
   It checks that the saved row has this name at this address, else it
   shows `hostedMcp.setupFailed` (`:408-409`).
4. `signIn` calls the generic sign-in `runMcpSignIn(server.name, {api,
   open, signal, onStarted})` (`:358-361`).
5. On success, the card tests the tools (`signedInToolsCheck`, `:69-80`,
   `:365`). A failure shows "Signed in, but Whop's tools could not be
   loaded: <reason> Please connect again to retry." and the server stays off
   (`:368`, test `:108-139`).
6. When the tools load, the card sends `PATCH {enabled:true}` (`:369`) and
   shows "{service} is connected and enabled. Bot access follows each bot's
   MCP server selection." (`en.json:28`).

**"Connected"** (`hostedConnections`, `hosted-mcp-apps.ts:140-150`): a
server at this address is on and its `auth` is `signed-in`. The listing
gives header names only, not values (`:145`).

**Disconnect** (`signOut`, `McpServersPanel.tsx:459-482`):

1. `PATCH /api/mcp/servers/<name> {enabled:false}` (`:472-474`).
2. `POST /api/mcp/servers/<name>/sign-out` (`:475`). The sign-out deletes
   the token record and then revokes the token, best effort
   (`custom-mcp-servers.md` section 3.7).
3. The server entry stays, off (`scripts/verify-whop.ts:131`, test
   `:194-202`). A key app is different: its Disconnect deletes the server
   and the key with it (`:467-470`).

**Error paths and limits:**

- If step 1 succeeds and step 2 fails, the server is off and still signed
  in. The card then shows Connect, and Connect signs in again (derived from
  `:549`, `:565-567`. No test covers it).
- If the service moves its address, the saved server is no longer this app.
  It shows as a server of the person (`hosted-mcp-apps.ts:152-155`), and
  Connect adds a second server.
- Connect is off when an organisation manages the server, or when the policy
  forbids custom servers with an empty allow list (`McpServersPanel.tsx:566`,
  test `:204-214`).
- A connection reaches each bot whose selection is "every enabled MCP
  server" at once: "Bots using every enabled MCP server inherit this
  connection." (`en.json:30`).
- In the plain list of MCP servers, the row of a hosted server has its own
  on/off switch. That switch skips the tool test after the sign-in
  (`McpServersPanel.tsx:753-769`).

### 3.6 How a post or a payment reaches the approval rules

Both connections are custom MCP servers, so a tool call takes the path of
an engine permission request. `approval-cards.md` section 3.7 has the rule.
These are the steps for the two servers:

1. The engine's own permission mode decides first. Only a request that it
   leaves for a person arrives as `request.opened` (`server/index.ts:6431`).
2. `providerMcpTool` parses `mcp__<server>__<tool>` (`:6452-6454`).
3. The server config for the key is the stored spec (`:6455`, `:11664`).
   The key of the posting service is added only at the start of a turn
   (`server/config.ts:1223`), so it is not in the fingerprint of a grant. A
   new key keeps the grants.
4. `providerToolAllowKey` gives a key, or null for an outbound tool
   (`server/provider-tool-allow.ts:39`). Null means "never remembered".
5. `autoVerdict` decides (`server/auto-approve.ts:105-122`):
   - Full access approves each call, before the outbound check (`:112`).
   - An outbound tool is held with the note "This sends something on your
     behalf, so it asks you first." (`:114`, `:138`).
   - Then a saved grant can approve (`:116`).

**What the name rule gives for the two servers.** The rule reads the tool
name only (`outbound.ts:94-105`). It drops the server part and splits the
rest at camel case and at each other character (`:66-78`). A token must be
in `SEND_VERBS` (`:14-35`), or a create verb must come with a noun of
`SENT_NOUNS` (`:39-40`). Both lists have only singular words. The main
session read the code and the subagent ran the function on the fake names:

| Tool (fake names) | Outbound | Why |
|---|---|---|
| `schedulePostTool` (posting service) | yes | the token `POST` |
| `integrationList`, `integrationSchema`, `postsListTool` | no | not a send |
| `payments_refund` (hosted app) | yes | the token `REFUND` |
| `payouts_create`, `transfers_create`, `payments_create`, `refunds_create` | **no** | `PAYOUTS`, `TRANSFERS`, `PAYMENTS` are plural and are in no list |
| `payments_retry`, `payments_void`, `accounts_update-fees`, `memberships_cancel`, `promo-codes_create` | **no** | no send verb |

The tool names of the hosted app come from a synthetic catalog: "A synthetic
catalog shaped like Whop's official MCP server (425 tools, 1.2 MB of JSON)
… All made up." (`server/testing/whop-like-catalog.ts:1-2`). If the live
server uses such names, three things follow:

- "Always allow" can be saved for a payout (step 4 gives a key).
- Below Full access, the outbound guard does not hold it (step 5).
- A turn that a restart cut is not "outward" by `outwardActions`
  (`server/turn-outcome.ts:100-107`), so the restart rule can treat it as a
  turn that did no outward action.

A draft of the posting service is also outbound, because `POST` comes
before the check for `DRAFT` (`outbound.ts:102-103`). No test of
`shared/outbound.test.ts` uses a name of either server.

**The sending rule does not apply here.** The "Send on your behalf?" hold
(`server/outbound-hold.ts`) has two callers: the Composio path
(`server/index.ts:14257`, `:14293`) and the meeting routes
(`server/meetings/routes.ts:101-104`, through `server/index.ts:5608`). The
path of a custom MCP server does not call it. So the per-bot sending rule
does not change a call of these two servers:

- A rule "ask" does not stop a post at Full access (`auto-approve.ts:112`).
- A rule "allow" does not remove the outbound card at the other levels
  (`:114`).

The header of `outbound.ts:2-3` says that the rule applies to all outbound
tools. That is true for the Composio path only.

**The second path: an app view.** When an MCP server draws a view in the
chat, the view can call a tool of its server
(`server/chat-apps-mcp.ts:300-330`). This path does not read
`isOutboundTool`, the saved grants or the sending rule. The call runs when
one of these is true (`:326-329`):

- the server marks the tool `readOnlyHint`.
- the tool is not visible to the model and the server does not mark it
  `destructiveHint`.
- the approval level is Full access.

Else the call is refused, and "<product> draws no Allow card of its own"
(`:324-325`). So the outside server's own marks decide. Each call is logged
with the bot, the server, the method and the tool name, and "its arguments
never are" (`:344-348`). The posting service gets this catalog object
(`server/index.ts:12209`). It is not verified whether either service has a
view.

**What the hosted app says itself.** "Consequential operations retain
Whop's prepare/confirm protocol and idempotency requirements. This change
adds no blanket auto-confirm policy, new payment tools, or independent
credential store. Normal <product> approval modes are unchanged."
(`docs/verification/whop.md:68-70`). The live sign-in asks for admin access
"across businesses you manage" (`en.json:27`).

### 3.7 Where the token or key is kept, and the problems of the store

| Secret | Where | Mode and form |
|---|---|---|
| OAuth token (both services) | `<data>/mcp-oauth.json` | 0600, clear JSON (`custom-mcp-servers.md` section 4.3) |
| Key of the posting service, desktop | encrypted store of the desktop, `postizApiKey` | not verified |
| Key of the posting service, server | `config.json` → `postiz.key` | clear text (`server/routes/config.ts:616-617`) |

**A failed read of the token store** (`server/mcp-oauth-store.ts:107-114`):

1. Each read error (also `EACCES`, a busy file on Windows, a partial read)
   and a schema error of one record read as `{servers:{}, spentRefresh:{}}`.
2. Each of the five methods that change the store writes that empty object
   plus its own change: `put` (`:63-67`), `delete` (`:69-75`),
   `forgetSpentRefresh` (`:78-83`), `markSpentRefresh` (`:92-96`) and
   `clearSpentRefresh` (`:99-104`).
3. A file that stays corrupt does not start a refresh, because
   `accessToken` finds no token first. That case is in
   `custom-mcp-servers.md`. The new case: a read fails during a refresh,
   after an earlier read of the same refresh succeeded. Two effects follow:
   - `spentRefreshFor` reads an empty map, so the replay guard
     (`server/mcp-oauth.ts:475`) sees no spent token.
   - `markSpentRefresh` writes the mark of this server into an empty file
     (`:92-96`). This deletes the records of each other server, the sign-in
     of the posting service too, and their spent marks. A spent mark is a
     token that "a restart must not present" again (`:90-91`).
4. The store has no lock between processes, and it reads the file on each
   call (`:106`).
5. The only test of a failed read checks the current behaviour, with one
   record (`server/mcp-oauth-store.test.ts:40-47`).

**A secret in an address, a log or a listing:**

- In an address: the posting service refuses a key in the address
  (section 3.2, step 3). The hosted app card adds no header and no query
  (`McpServersPanel.tsx:406`).
- In a listing: the MCP listing gives header names only
  (`server/mcp-registry.ts:500`). The status of the posting service is
  "Never a key or a token" (`shared/postiz.ts:13`). The settings listing
  shows the last 4 characters of the key (`server/index.ts:11570`,
  `e2e:154`). `docs/analytics.md:35-45` forbids "last characters" in
  analytics, not in a settings listing.
- In a log: the MCP client "never logs a header value"
  (`server/mcp-http.ts:1`). The e2e test finds the token and the key in no
  answer, log, transcript or prompt (`e2e:115-131`, `:164-181`).
- **A log line can quote part of a key.** The desktop migration parses
  `config.json` and logs `credential migration failed: ${error.message}` on
  an error (`electron/workspace-credentials.mjs:61`, `:70`). A V8
  `JSON.parse` message quotes the text near the error. The subagent ran this
  with node 25 and got a part of a fake key in the message. Where this log
  writes is not verified.
- **The diagnostics bundle masks less than it seems.** The bundle "is pasted
  into public issues" (`electron/diagnostics.mjs:1`). It masks the variable
  `OMB_POSTIZ_API_KEY`, `Bearer` values and the query of an address
  (`:37`, `:68-71`, `:84-99`). A JSON line `{"postiz":{"key":"…"}}` and the
  `access` and `refresh` fields of the token store pass unchanged, because
  the name must contain `api_key`, `secret`, `token`, `password` or
  `authorization` (`:66-67`). No code was found that writes those lines to
  the log.
- **The old SSE transport sends the header to a new address.** The `endpoint`
  event of an SSE server is resolved against the server address, with no
  check of the origin (`server/mcp-http.ts:383-387`). Each later POST sends
  all headers, `Authorization` too, to that address (`:421-425`). This is
  for `type: "sse"` only. Both connections use `http`.

### 3.8 Expiry, refusal and a restart

**An expired or refused OAuth token** (`server/mcp-oauth.ts`. The steps are
in `custom-mcp-servers.md` section 3.7):

1. A refresh starts when less than 2 minutes are left (`:52`, `:401-407`).
2. After an engine gets a 401, `tokenRefused` forces a refresh at most once
   in 60 s (`:416-426`). The connection-health observer calls it after each
   MCP tool step (`server/host/connection-health-host.ts:177-191`). The
   failed call is not sent again. The bot sees the failure.
3. A refresh that cannot work makes the state `needs-sign-in` and drops the
   tokens (`:466-469`, `:499-509`).
4. The posting service card shows "Signed out. Reconnect to keep using it."
   (`en.json:6131`). The hosted app card shows Connect, because "connected"
   needs `signed-in` (`hosted-mcp-apps.ts:148`).
5. An app view gets `401 "Sign-in needed"` with the server name
   (`server/chat-apps-mcp.ts:353`, `:363`).

**A refused key of the posting service:** no refresh. The health observer
calls a 401 "refused" only when the stored entry has a header
(`connection-health-host.ts:75-77`). The entry of the posting service has
no header. So on a Team Cloud the observer records a refused key as a
sign-in problem, and on a desktop it records nothing. Only the check of
section 3.4 finds it.

**A sign-in in progress at a restart:**

1. The flows, the PKCE verifier, the state and the loopback listeners are
   in memory only (`server/mcp-oauth.ts:228-232`). `onSettled` hears each
   end "except when the server shuts down" (`:238-239`).
2. After a restart, the flow is not found, and the route answers 404 "This
   sign-in is no longer available in this browser. Start again."
   (`server/routes/mcp-servers.ts:138-141`).
3. The window turns each failed poll, a 404 or a refused connection, into
   `expired` (`src/lib/mcp-sign-in.ts:84-86`). The card shows "Sign-in didn't
   finish. Try again." (`McpServersPanel.tsx:373-374`, `en.json:6196`).
4. The browser comes back to a loopback port that has no listener, and gets
   no page.
5. The server entry is already saved off, so the next Connect uses the same
   entry: "Retry reuses the same entry" (`scripts/verify-whop.ts:100`).
6. Only the spent-refresh mark is meant to stay after a restart
   (`server/mcp-oauth-store.ts:32-34`).

**A changed outside service:**

- The sign-in address of the posting service, `/mcp-oauth-dynamic`, comes
  from "Postiz 2.25: start.mcp.ts" (`server/postiz/connection.ts:7`). The
  OAuth metadata was "checked 2026-10-29" (`shared/postiz.ts:7`). If the
  service moves the path, the stored entry no longer agrees, and the card
  shows `taken` or not connected (derived from `connection.ts:65`).
- The live endpoint of the hosted app "advertises dynamic registration,
  PKCE S256, refresh tokens and the `admin` scope", from a separate check
  (`docs/verification/whop.md:43-45`).

## 4. The data

**The server entry of the posting service** (in `config.json` →
`mcpServers.postiz`, `server/postiz/service.ts:91`):

```json
{ "type": "http", "url": "https://api.postiz.com/mcp-oauth-dynamic", "headers": {}, "enabled": false }
```

With a key, the address is `<address>/mcp` and `enabled` is `true`
(`service.ts:175-178`). The card owns the entry only when it is `http`, has
no header with a value, has no `oauth` and has one of the two addresses
(`connection.ts:63-73`). Else the state is `taken`, and the card never
changes the entry (`service.test.ts:181-187`).

**The key of the posting service** (`server/config.ts:305`, `:437`):

```json
{ "postiz": { "key": "…", "url": "" } }
```

An empty `url` means the cloud service. On the desktop, `key` is `""` on
disk and the real key is in the encrypted store.

**`PostizStatus`**, the answer of `/api/postiz` (`shared/postiz.ts:14-33`),
"Never a key or a token" (`:13`):

| Field | Values |
|---|---|
| `state` | `not-connected`, `connected`, `needs-sign-in`, `key-refused`, `taken`, `blocked` |
| `how` | `sign-in`, `key`, null |
| `address`, `host`, `selfHosted`, `keySaved`, `team` | the address, its host, flags |
| `scope` | `team` or `person` |
| `tools`, `message` | optional: the tool names after a check, the policy text for `blocked` |

The order of the decision (`service.ts:93-116`): the policy, then `taken`,
then the method, then the sign-in state or the key.

**The routes of the posting service** (`server/routes/postiz.ts`). Each one
needs the `admin` scope, else 403 with "Only the owner or an admin can manage
the Postiz connection." (`:19`, `en.json:10339`). Each answer has
`Cache-Control: no-store` (`:20`).

| Route | Success | Errors |
|---|---|---|
| `GET /api/postiz` | 200 `PostizStatus` | none |
| `DELETE /api/postiz` | 200 `PostizStatus` | 409 `busy`, `taken` |
| `POST /api/postiz/sign-in` | 200 `PostizStatus` | 409 `busy`, `taken`, 403 `managed_policy` |
| `POST /api/postiz/check` | 200 `PostizStatus` and `tools` | the check stops when the client goes |
| `POST /api/postiz/key-check` | 200 `{ok:true, tools}` | 415, 400 `key_rejected`, `address`, `unreachable`, `not_postiz`, 403 `managed_policy` |
| other | none | 404, 405 |

**The hosted app record** (`src/lib/hosted-mcp-apps.ts:8-25`): `id`,
`label` (never translated), `url` (exact, streamable HTTP), `key?: {url}`
(only for an app with no sign-in), `icon` (`{image}` or `{glyph}`),
`description` and `notice` (locale keys), `keywords`.

**The server entry of the hosted app** (`McpServersPanel.tsx:406`):

```json
{ "name": "whop", "type": "http", "url": "https://mcp.whop.com/mcp", "enabled": false }
```

**The token** of both services is a record of `mcp-oauth.json`
(`custom-mcp-servers.md` section 4.3). The posting service token has no
`refresh` and no `expiresAt` (`fake-postiz.ts:156-159`).

**In memory only:**

- the rejection mark of a key (`key-rejections.ts:6`).
- the time of the last check and the retry timer of a write
  (`service.ts:54`, `:73`).
- the sign-in flows (`mcp-oauth.ts:228-232`).
- the sign-in state of each card (`McpServersPanel.tsx:127-131`,
  `PostizCard.tsx:46`, `:56`).

**Analytics:** only `api_key_saved {provider: "postiz", via, result}`
(`PostizCard.tsx:203`, `:208`). No event for an MCP sign-in or a hosted app.
No secret, address or name reaches an event (`src/lib/analytics-allowlist.ts:1-19`).
`docs/analytics.md:146` names "the X card in Apps" as the source of
`via: "apps"`, but the posting service card sends it too.

## 5. The UI

**Where:** the "Apps" window. Its title is "Apps", and its text is "Connect
an app or your own MCP server once. Then choose which bots may use it."
(screenshots 1-7). It has a search, the filters All, Social, Communication
and Productivity, and a "Connected" link with a count. The hosted cards are
one `McpServersPanel` with `hostedCards`, and the posting service card is a
separate card beside the X and email cards (`PluginsPanel.tsx:738-741`).
Both are always mounted, and a hidden card has the class `hidden`
(`:741`, `McpServersPanel.tsx:639`). The posting service card is in the
"Social" category (`src/lib/postiz.ts:10`). The hosted cards are hidden in a
category view (`PluginsPanel.tsx:738`).

**The posting service card** (`src/components/PostizCard.tsx`). Its icon is
a purple "P" of the reference project, `#612bd3`: "no Postiz artwork is
bundled" (`:22-30`).

| State | Text | Control |
|---|---|---|
| loading | "Draft, schedule and publish social posts with Postiz." | a spinner, "Checking…" |
| load failed | the same | "Retry" |
| 403 | no card | none |
| not connected | the same | "Connect", and "Use an API key instead" under it |
| sign-in waiting | "Finish signing in to Postiz in your browser.", then "Signed in. Loading Postiz’s tools…" | "Cancel", "Open sign-in page", a paste field when `pasteBack` |
| connected, sign-in | "Connected to {host}" and a green check | "…" menu with Disconnect |
| connected, key | "Connected to {host} with an API key" | "…" menu |
| connected, person | "Your own Postiz is connected." | "…" menu |
| needs sign-in | "Signed out. Reconnect to keep using it." | "Reconnect" (signs in) |
| key refused | "Postiz no longer accepts the saved key. Enter a new one." | "Reconnect" (opens the key form) |
| taken | "An MCP server named postiz is already set up. Remove it in MCP servers to connect here." | none |
| blocked | the policy text | none |

The strings are at `en.json:90-115`, `:1072`, `:6081-6083`, `:6131`,
`:6186-6196`, `:7151`.

**The key form** (`PostizCard.tsx:325-346`): a password field "Paste your
Postiz API key", an address field with the placeholder
`https://api.postiz.com` (hidden in person scope), the help "Find your key in
Postiz under Settings → Public API. Leave the address empty for Postiz Cloud,
or enter the address of your own Postiz server.", the button "Connect", the
link "Open Postiz settings" and the link "Sign in with Postiz instead". A
team admin also sees the box "Only for me" (`:319-323`).

- A refusal shows one red line with `role="alert"` (`:318`).
- On success, the card clears the key field (`:205`). On failure, the typed
  key stays in the state of the card (`:209`).
- The window finds the code of a save error in the English text of the
  server (`src/lib/postiz.ts:30-37`). The reason: "the desktop's credential
  bridge throws the server's refusal as text". A new server text gives the
  raw message.
- The key can also be set in the general Keys screen
  (`src/components/keys/key-catalog.ts:182-185`).

**The hosted app card** (`McpServersPanel.tsx:547-594`):

- An icon, "Whop", a green check when connected, and the description
  "Products, checkout links, memberships and payments through Whop's official
  integration." (`en.json:23`).
- One button: "Connect Whop" or "Disconnect Whop", or "Cancel" during the
  sign-in, or "Retry" when the list did not load (`:564-569`).
- During the sign-in: "Finish signing in in your browser…", then
  `hostedMcp.loadingTools`, an "Open again" link, and the paste field, which
  shows at once when `pasteBack` is set, else under "Signing in from another
  computer?" (`:520-545`).
- "Bot access" details: the notice "Sign in with Whop. No API key needed.
  Whop requests admin access across businesses you manage, and requires
  confirmation for consequential financial or destructive actions."
  (`en.json:27`), the hint of `en.json:30`, and one "Manage <bot>'s access"
  button for each visible bot (`:586-591`).
- One error line: the panel error, else the error of this card, else the
  failed test of its server (`:551`). The panel error shows on each card.
- In the plain MCP list, a hosted server shows the app icon and name, not
  the server name (`:709-780`). It shows the address in plain text and the
  header names only.

**Screenshots** (`docs/pr-screenshots/postiz/`): 1 the Social category, 2
the sign-in wait, 3 connected by sign-in, 4 the key refused with the red
line, 5 the key form, 6 connected by key, 7 the All list with the hosted app,
the posting service and other cards.

## 6. The tests

**The posting service, server:**

- `server/postiz/connection.test.ts`: the address rules (`:10-37`), the
  test address override (`:41-46`), the owner of the entry (`:50-58`), the
  key header only at the saved address (`:60-68`).
- `server/postiz/service.test.ts` uses the real OAuth manager with a temp
  file and the fake service:
  - the key check saves nothing and runs no tool (`:62-68`).
  - the refusal codes (`:70-78`).
  - the save, with the key only in the headers of a turn (`:80-103`).
  - a revoked key gives `key-refused`, and the 5-minute limit holds
    (`:122-137`).
  - the full sign-in: `connected` only after the switch, the same token in
    each turn, `needs-sign-in` after a revoke and a clean Disconnect
    (`:141-173`).
  - a foreign `postiz` gives `taken` (`:175-188`).
  - a write waits for the busy flag (`:190-201`). No test covers the stop
    after 10 s.
- `server/postiz.e2e.test.ts` uses a real server, a fake engine and two fake
  services:
  - the sign-in from start to end, a scripted `schedulePostTool` call with
    the token, the token only in `mcp-oauth.json` and never in a log or an
    answer, and Disconnect (`:85-132`).
  - the key path with the same checks, and `last4` in the listing
    (`:134-182`).
  - The test runs `schedulePostTool` and shows no approval step
    (`:110-114`).
- `server/skill-social-posts.test.ts`: the words that start the skill, and a
  guide of 95 lines or fewer (`:10-26`).

**The posting service, window:** `src/components/PostizCard.test.ts` has 8
tests (`:93-221`):

- the first view, the sign-in and the check when the card opens.
- the key save in two requests, and the four refusal texts.
- Disconnect with the key first.
- `taken`, 403 and "Only for me".

Not tested: the `key-refused` view, the paste field, Cancel, the time limit,
the failed tool test and Retry.

**The hosted app:**

- `src/components/McpServersPanel.hosted.test.ts`, for each app with no
  key (`:96-230`):
  - the card saves the server off with no header, then signs in.
  - the card uses an existing server at the same address.
  - the switch comes only after the tools load.
  - the failure texts, Cancel, the lock of other cards and the policy.
  - Disconnect turns the server off, then signs out (`:194-202`).
  - Bot access.
- `src/components/McpServersPanel.embedded.test.ts`: "No API key needed",
  the admin notice of the hosted app (`:107-110`), recognition by address
  and not by name (`:112-125`), the paste field (`:140-157`). These tests
  depend on the order of the `useState` calls (`:53-55`).
- `scripts/verify-whop.ts` with `docs/verification/whop.md`: a browser run
  against a fake OAuth server and a fake MCP server. It proves these facts:
  - a failed save makes no duplicate.
  - a server of the person named `whop` does not change (`:20-21`, `:113`).
  - a refused consent keeps the same entry for the next try.
  - the listing does not contain the token (`:110-111`).
  - the setup calls no tool (`:112`).
  - the connection stays after a reload.
  - Disconnect revokes the token (`:132`).
  - It prints `liveWhopAccountTested: false` (`:171`).
- `scripts/verify-postiz.ts` does the same for the posting service and
  makes the 7 screenshots. It prints `livePostizAccountTested: false`
  (`:112`).

**The approval rules:** `shared/outbound.test.ts`, `server/auto-approve.test.ts`
and `server/provider-tool-allow.test.ts` use no name of either server and
no plural money noun.

## 7. Ours compared

Our crates are skeletons now (`crates/bot-protocol/src` has `event.rs`,
`ids.rs` and `message.rs`). Step 16 builds custom MCP servers with headers
first. OAuth sign-in is a gap after step 16 ([P244](../../plan/custom-mcp-servers.md)).
So the key path of the posting service fits the first version of step 16,
and the hosted app needs P244. The rows are proposals until the author
decides.

| Reference | Ours |
|---|---|
| `shared/postiz.ts`, `server/postiz/connection.ts` (address rules, owner of the entry, key header) | `bot-engine::mcp::hosted::posting` (pure functions, no I/O) |
| `server/postiz/service.ts`, `server/routes/postiz.ts` | the same module, with the stored entry written through `bot-core::mcp_registry` in one transaction. No HTTP route (decision D10): a command of `bot-desktop` |
| The key in `config.json` or the desktop store | `bot-core::secrets` (the write-only key, [P232](../../plan/custom-mcp-servers.md)) |
| `src/lib/hosted-mcp-apps.ts` (the table and the recognition by address) | a table in `bot-protocol::mcp::hosted` that the core and the window share, with the recognition function |
| `src/components/PostizCard.tsx`, `McpServersPanel.tsx` (hosted cards) | `crates/bot-desktop/ui` |
| `packages/phone-protocol/src/outbound.ts`, `server/provider-tool-allow.ts`, `server/auto-approve.ts` | the approval function of step 10 in `bot-core` (changelog section 7, the last row) |
| `server/chat-apps-mcp.ts` (app views) | not planned |
| `server/key-rejections.ts` | `bot-core::secrets`, with the mark stored |
| `skills/social-posts/`, the ready bot of `src/lib/ready-bots.ts:119-143` | not planned |

**Where our rules already differ:**

- **Typed refusals** (`AGENTS.md`). `write()` stops after 10 s with no
  error (`server/postiz/service.ts:70-75`).
- **One transaction for each state change** (`AGENTS.md`). The card saves
  the address and the key in two requests (`PostizCard.tsx:198-201`).
  Disconnect of the hosted app is two requests, and the first can succeed
  alone (`McpServersPanel.tsx:472-475`).
- **A file written over after a failed read** (changelog section 7: `save`
  takes a value that only a successful `load` can make). The token store
  writes over the file from each of five methods (section 3.7).
- **Capability flags, not names** (`AGENTS.md`). The posting service is
  found by the server name `postiz` (`connection.ts:78`,
  `hosted-mcp-apps.ts:152-155`). A name is not a driver here, so the rule
  does not apply directly. But the same table row could carry the address
  and a "key at launch" flag.

**Licence:** the posting service is AGPL-3.0, "and none of its code is
copied" (`docs/verification/postiz.md:7`). The logo of the hosted app is
Apache-2.0, from its official repository (`src/assets/whop/README.md:1-6`).

## 8. Where we can be better

1. **Classify money and posts by more than the tool name.** The name rule
   misses plural nouns and actions such as void, retry and fee changes
   (section 3.6). Reason: v0.1.176 promises "never remembered for anything
   that sends, posts or moves money". The rule does not keep that promise
   for a tool named like `payouts_create` (the names are synthetic).
   A row of the hosted app table, or a setting of
   each server, can mark the server as one that moves money. Then each tool
   of that server with no `readOnlyHint` is outbound.
2. **Apply one approval function to each MCP tool call.** The sending rule
   is read on the Composio path only, and Full access approves before the
   outbound check (`server/index.ts:14257`, `server/auto-approve.ts:112`).
   Reason: "the approval model changed" (changelog section 6). Changelog
   section 7 already proposes one pure function. These two servers are a
   test case for it.
3. **No tool runs with no card because of a mark of the outside server.**
   An app view runs a tool that the server marks app-only and not
   destructive (`server/chat-apps-mcp.ts:326-329`). Reason: "an access right
   in the wrong place". We have no app views now. If we add them, they use
   the same approval function.
4. **No write after a failed read of the token store, in each method.**
   Five methods write over the file (`server/mcp-oauth-store.ts:63-104`).
   Reason: "a file written over after a failed read". This adds the
   spent-refresh mark to [P232](../../plan/custom-mcp-servers.md).
5. **Disconnect is one action.** The hosted app can stay signed in and off
   (`McpServersPanel.tsx:472-475`). The route of the posting service does
   not remove the key, so the window must save an empty key first
   (`service.ts:183-184`, `PostizCard.tsx:226`). Reason: our rule of one
   transaction. One core command turns off, forgets the token, revokes it
   and removes the key.
6. **A write of the entry never stops in silence.** Reason: typed refusals.
   The busy wait of 10 s loses the entry (`service.ts:70-75`). Our registry
   has one writer, so the wait is not necessary.
7. **Keep the rejection mark of a key across a restart.** Reason: "state
   lost at a restart". A refused key shows `connected` after a restart
   (`server/key-rejections.ts:6`).
8. **Tell the person that a restart ended a sign-in.** Reason: "state lost
   at a restart". The window turns a 404 and a lost connection into the
   same text (`src/lib/mcp-sign-in.ts:84-86`). A typed status "ended by a
   restart" is clearer. The flow itself cannot continue, because its
   loopback listener is gone.
9. **One redaction function, tested with the shapes of this feature.**
   Reason: "a secret in the wrong place". A JSON parse error can quote a
   key (`electron/workspace-credentials.mjs:61`, `:70`). The diagnostics
   mask misses `"key"`, `"access"` and `"refresh"`
   (`electron/diagnostics.mjs:66-67`).
10. **Never show part of a key.** The settings listing gives the last 4
    characters (`server/index.ts:11570`). This is already
    [P20](../../plan/write-only-secrets.md). This feature adds one more key
    that the rule covers.
11. **A new connection does not reach all bots at once.** A bot with "every
    enabled MCP server" gets the payment tools at once (`en.json:30`).
    Reason: "an access right in the wrong place". The admin scope of the
    hosted app covers each business of the person (`en.json:27`).
12. **A key check goes only to the address that the person gave, after the
    address check of [P239](../../plan/custom-mcp-servers.md).** Reason: the
    check sends a key to a private address (`service.ts:120-125`).
13. **The SSE endpoint must have the same origin.** Reason: a header can go
    to a new address (`server/mcp-http.ts:383-387`). This adds to P239.
14. **No test switch in shipped code.** `OMB_POSTIZ_CLOUD_URL` accepts each
    https host (`connection.ts:39-50`). Reason: a variable in the
    environment can send the sign-in to another host. A test can inject the
    address through the constructor.

**Problems of changelog section 5 that the reference has here:**

| Problem | Here | Where |
|---|---|---|
| A secret or an access right in the wrong place | yes | the key in clear text with no desktop, `last4`, a log line, the diagnostics mask, the SSE endpoint, a new connection for all bots (items 9-13) |
| The approval model changed | yes | the name rule misses money actions, the sending rule only on Composio, the app view path (items 1-3) |
| Sign-in to an outside service, and services that change | yes, partly handled | OAuth refresh and `needs-sign-in` work. Only a check finds a refused key. The addresses are pinned by date and version (sections 3.4, 3.8) |
| A file written over after a failed read | yes | the token store, five methods (item 4). `config.json` refuses an invalid file (`server/config.ts:885`). The desktop migration writes nothing on a parse error (`workspace-credentials.mjs:58-72`) |
| State lost at a restart | yes | a sign-in in progress, the rejection mark, the retry timer of a write (items 6-8) |
| A wait that does not end | no | each wait has a limit: 15 s for a key check, 5 minutes for a sign-in, 10 s for the busy wait |

## 9. Not verified

**Checked by the main session at `96ff84455` (all agree):**

1. `write()` stops after `BUSY_GIVE_UP_MS = 10_000` with no error
   (`server/postiz/service.ts:35`, `:70-75`).
2. `postizKeyHeaders` adds the key only for `postiz` at the saved address
   (`server/postiz/connection.ts:75-80`).
3. The status is `not-connected` until the entry is on (`service.ts:111`).
4. Full access approves before the outbound check
   (`server/auto-approve.ts:112-114`).
5. `providerToolAllowKey` is null for an outbound tool
   (`server/provider-tool-allow.ts:39`).
6. `SEND_VERBS` and `SENT_NOUNS` have only singular words, and
   `payouts_create` is not outbound by `isOutboundTool`
   (`outbound.ts:14-40`, `:94-105`, read by hand).
7. `outboundHold.hold` has two callers: the Composio path
   (`server/index.ts:14257`) and the meeting routes
   (`server/meetings/routes.ts:101`). The custom MCP path has none.
8. The app view rule (`server/chat-apps-mcp.ts:324-330`).
9. The rejection mark is a `Set` in memory (`server/key-rejections.ts:6`).
10. All five methods of the token store write after a read that can be empty
    (`server/mcp-oauth-store.ts:63-114`).
11. Disconnect of the hosted app is PATCH off, then sign-out
    (`McpServersPanel.tsx:472-475`).
12. The row of the hosted app and the recognition by address
    (`hosted-mcp-apps.ts:30-38`, `:117-128`).
13. A server with no desktop stores the key in clear text
    (`server/routes/config.ts:616-617`).
14. The flows are maps in memory (`server/mcp-oauth.ts:228-232`), and the
    window turns a failed poll into `expired` (`src/lib/mcp-sign-in.ts:84-86`).

**Not verified:**

- The live tool names of both services. The money table of section 3.6 uses
  a synthetic catalog and a fake service.
- Whether a real turn shows an approval card for `schedulePostTool`, and how
  the e2e test lets the bot run it with no card.
- Which engines send a permission request for an MCP tool at each level, and
  the tool name that Codex and the ACP engines put in `request.opened`.
- Whether the restart rule runs a cut turn again when its only action was a
  money tool that the name rule misses. The caller of `outwardActions` was
  not read.
- How Claude Code gets the address and the header of the `postiz` server.
  The e2e test leaves the launch file of the fake engine out of its secret
  scan (`e2e:50`, `:60`).
- The file, the mode and the format of the encrypted store of the desktop.
- Where the log of `migrateWorkspaceConfigFile` writes, and the wording of a
  `JSON.parse` error in the node version of the desktop.
- Whether either service has an app view, and which tools it marks
  app-only.
- `keyStatus` (where `last4` is made) was not read.
- That `request-auth.ts` leaves `/api/postiz` off the list of a client
  (only the comment at `server/routes/postiz.ts:2` says so).
- The view of a team member in person scope.
- `src/lib/hosted-mcp-apps.test.ts` (69 lines) and the seven server tests
  that use `whop-like-catalog.ts` were not read.
- The live OAuth metadata of both services. The facts come from the fakes
  and from comments dated 2026-10-29.
