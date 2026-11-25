# Connected apps: the connector service, the proxy, grants, sign-in and sends

Feature rows of [`../reference-features.md`](../reference-features.md),
group 3:

- `composio.md` (row 295), without the app events.
- `cloudflare/composio-broker/README.md` (row 480), only as far as the local
  server talks to the broker.
- `connected-apps-oauth.md` (row 346): the sign-in and its recovery.
- "Connector grants for each bot, by exact tool name" (row 89).
- "Connector grants by verb class" (row 90).
- "A bot can be kept to some accounts of a connected app" (row 513).
- The docs site pages `connected-apps/` (row 477).

Step 16 of [`../../plan/README.md`](../../plan/README.md). Crate:
`bot-engine`, with types in `bot-protocol` and the bot grants in `bot-core`
(section 7).

Read on 2026-11-26 at commit `96ff84455` of the reference project. All paths
are in the reference project unless a line says "ours". The `enterprise/`
directory was not opened. Nine subagents read nine groups of files, about
120 files in all. The main session checked 30 key claims against the code.
Section 9 lists what is not checked.

In quoted text from the reference project, `<product>` replaces the product
name of the reference project. Environment variable names (`OMB_…`) and the
`omb-retry-` alias stay as identifiers.

## What this file adds to earlier research

- [`custom-mcp-servers.md`](custom-mcp-servers.md) has the person's own MCP
  servers, the MCP gate, the remote proxy, OAuth sign-in to an MCP server
  and the Sign in card. Section 5.4 of that file says that the Sign in card
  reuses the connector card. This file adds the connector card for apps
  (section 5.2), the connector service behind it, and the grants of apps.
- [`agent-tools.md`](agent-tools.md) has the tool directory and the tool
  budget. The "three small tools" of v0.1.101 are that directory
  (`search_tools`, `describe_tool`, `call_tool`, `agent-tools.md:70`,
  `:941`, `:957`), for engines that cannot search tools. This file adds the
  share of the budget that the connector proxy reads (section 3.4).
- [`approval-cards.md`](approval-cards.md) has the "Send on your behalf?"
  card, its 9-minute limit and `outbound.ts` (`approval-cards.md:161`,
  `:194`, `:550`). This file adds only how a send through an app reaches
  that card (section 3.9).
- [`approval-levels.md`](approval-levels.md) has `autoVerdict`. This file
  adds one fact: an Email app send at Full access does not read the bot's
  send rule (section 3.9, section 8).
- [`automations.md`](automations.md) has the app events. This file gives
  only the border: an app automation names a connected `accountId`, and the
  account limit of a bot also limits its automations (`docs/composio.md:103`).

**Lines of our documents that this file corrects:**

| Our file and line | It says | At `96ff84455` |
|---|---|---|
| `docs/decisions.md` D12 | "A person saves their own Composio project key. The server then keeps one Composio session and gives its MCP endpoint to the engine" | Not an error, because D12 is our choice. It differs from the reference, and no decision marks the difference. In the reference the engine never gets the Composio endpoint, so the key never reaches a process that the engine starts. The engine gets a stdio bridge with a loopback token only. The bridge talks to a relay route of the server, and the relay runs every check (`server/composio.ts:247-248`, `server/index.ts:14144-14314`). The managed broker, not the key, is the default of the reference (`server/composio.ts:143-147`). D12 gives its reason for no broker. P230 corrects only the paths of D12 |
| `docs/comparison.md:137` | "One project key, one stable user identifier, one Tool Router Session" | True only for the "self-hosted" mode. The managed mode holds a broker token and no key (`server/composio-broker-access.ts:13-58`) |
| `docs/comparison.md:138` | the proxy "checks the grant again on each call" | The proxy only trims the tool list. "call-time enforcement stays the authority" (`server/connector-advertisement.ts:1-2`). The check is in the relay route (`server/index.ts:14175-14250`) |
| `docs/research/reference-features.md:90` | grants by verb class: "superseded, not built" | The five-class stored grant of the plan is superseded. A two-class grant (read, or read and write) for each app is built and enforced (`packages/phone-protocol/src/connector-scopes.ts:1-4`, `:99-110`). Five verb classes live on as chips that select tools in the UI (`src/lib/connector-grants.ts:3-22`) |
| `docs/research/reference-features.md:295` | `composio.md` is "partial" | This file covers it, without the app events |

**Documents of the reference project that the code contradicts:**

| Document | It says | The code |
|---|---|---|
| `docs/composio.md:93`, `apps/docs/content/docs/connected-apps/multiple-accounts.mdx:23` | five usable accounts for each app | 10 (`server/composio-session.ts:41`, and the broker `cloudflare/composio-broker/src/index.ts:109`) |
| `multiple-accounts.mdx:25-27` | "Grants apply to tools, not accounts". Use a separate installation to keep a bot away from an account | A bot can be kept to some accounts (`packages/phone-protocol/src/connector-scopes.ts:106-107`, `src/components/bot-settings/AccessSection.tsx:905-916`) |
| `docs/composio.md:252` | seven named mail and calendar tools | Nine (`server/connector-app-tools.ts:45-176`) |
| `docs/composio.md:5-15` | the packaged desktop app needs a pasted key | The packaged app registers with the managed broker. A key is optional (`electron/managed-composio.mjs:112-120`) |
| `docs/composio.md:9`, `index.mdx:31`, `src/locales/en.json:6109` | three different places for the key field | The UI text points to "Settings → AI → Other services" (`shared/connector-availability.ts:22-28`) |

## 1. In short

A **connected app** is an outside service, such as Gmail, Slack or GitHub,
that a bot can use with the person's own account. The person signs in to the
app one time. Then a bot reads mail, posts a message or opens an issue
through tools.

The reference project does not keep the app passwords or tokens. A
**connector service**, Composio, keeps them. Composio holds the OAuth tokens
of the provider (Google, Slack and the others) and runs each tool call
against the provider.

These terms are used in this file:

- **Toolkit** or **app**: one service in Composio, named by a **slug** such
  as `gmail`. A **tool** is one action of a toolkit, named in upper case, such
  as `GMAIL_SEND_EMAIL`.
- **Connected account**: one sign-in of one person to one app, with an id
  such as `ca_…`, an optional **alias** (a label such as `work`) and a status
  (`ACTIVE`, `INITIATED`, `EXPIRED` and others). One app can have up to 10.
- **Project key**: the secret key of a Composio project. It starts with
  `ak_`. A person who has one runs in **self-hosted** mode.
- **Managed broker**: a service on Cloudflare that the reference project
  operates. It holds the project key of the reference project. Each
  installation of the app gets a **broker token** (64 hex characters). An app
  without a project key runs in **managed** mode with that token.
- **Composio user**: the identity in Composio that owns the connected
  accounts. Each installation has one, with an id such as `<product>_<uuid>`.
- **Session** (Tool Router Session): an object in Composio that gives one MCP
  endpoint for one Composio user. The project-key mode keeps one Session and
  reuses it.
- **Bridge** or **connector proxy**: a small stdio MCP server
  (`server/connector-proxy.ts`). The engine starts it for each turn. It
  forwards each MCP frame to the **relay**, a route of the server.
- **Relay**: the route `POST /api/internal/connectors/mcp`. It checks each
  call against the grants of the bot and then sends it to Composio or to the
  broker.
- **Meta tools**: tools of Composio that are not app actions:
  `COMPOSIO_SEARCH_TOOLS`, `COMPOSIO_GET_TOOL_SCHEMAS`,
  `COMPOSIO_MULTI_EXECUTE_TOOL` (runs one or more app tools in one call) and
  `COMPOSIO_MANAGE_CONNECTIONS` (starts a sign-in).
- **Grants**: what one bot may do with the connected apps. There are three
  layers on the bot record:
  - `composio`: a switch. `false` turns all apps off for the bot.
  - `connectorTools`: exact tool names (or `"*"`) for each app.
  - `connectorScopes`: for each app, "read" or "write", and optionally the
    connected-account ids that the bot may use ("Accounts this bot may use").
- **Connector card**: a chat message that asks the person to connect an app.
  The model never writes or sees the sign-in address.
- **Send**: a call that reaches a person outside the app or moves money, such
  as `GMAIL_SEND_EMAIL`. Below Full access a send waits for the "Send on your
  behalf?" card.

The design has three trust zones:

1. The **engine** and the bridge get only a loopback token for one turn.
2. The **server** holds the project key or the broker token, checks every
   call and writes every allow and deny to the decision log.
3. **Composio** (or the broker in front of it) holds the provider tokens.

## 2. Files read completely

Line counts are at `96ff84455`.

**The connector service**

| File | Lines |
|---|---|
| `server/composio.ts` | 953 |
| `server/composio-project.ts` | 358 |
| `server/composio-session.ts` | 326 |
| `server/composio-catalog.ts` | 330 |
| `server/composio-share.ts` | 121 |
| `server/composio-broker-access.ts` | 90 |
| `server/composio-files.ts` | 71 |
| `server/composio-inventory-cache.ts` | 70 |
| `server/composio-inventory-schema.ts` | 30 |
| `server/cloud-connected-apps.ts` | 228 |
| `server/cloud-connections.ts` | 283 |
| `server/team-connections.ts` | 425 |
| `shared/composio-storage.ts` | 26 |
| `shared/connector-availability.ts` | 28 |
| `shared/connector-account-link.ts` | 37 |
| `electron/managed-composio.mjs` | 120 |
| `electron/secure-credentials.mjs` | 93 |
| `server/testing/fake-composio-project.ts` | 122 |

**The proxy, the relay helpers and the grants**

| File | Lines |
|---|---|
| `server/connector-proxy.ts` | 434 |
| `server/connector-advertisement.ts` | 163 |
| `server/connector-discovery-fallback.ts` | 70 |
| `server/connector-signed-out-hint.ts` | 30 |
| `server/connector-scope-hint.ts` | 132 |
| `server/connector-account-hint.ts` | 144 |
| `server/connector-arguments.ts` | 217 |
| `server/connector-verdict.ts` | 203 |
| `server/connector-app-tools.ts` | 242 |
| `server/connector-tools-list.ts` | 97 |
| `server/connector-tools.ts` | 48 |
| `shared/connector-scopes.ts` (a re-export) | 1 |
| `packages/phone-protocol/src/connector-scopes.ts` | 149 |
| `server/inherited-apps.ts` | 31 |
| `server/drivers/turn-mcp.ts` | 129 |

**Mail, calendar and sends**

| File | Lines |
|---|---|
| `server/email/service.ts` | 325 |
| `server/email/host.ts` | 211 |
| `server/email/instructions.ts` | 34 |
| `server/connected-reads.ts` | 655 |
| `server/read-and-draft.ts` | 188 |
| `server/outbound-hold.ts` | 119 |
| `server/outbound-requests.ts` | 90 |
| `server/cloud-send-kinds.ts` | 437 |
| `server/auto-approve.ts` | 165 |
| `server/host/person-calendar.ts` | 42 |
| `packages/phone-protocol/src/outbound.ts` | 179 |

**Routes and cards**

| File | Lines |
|---|---|
| `server/routes/connectors-listing.ts` | 51 |
| `server/routes/cloud-connections.ts` | 110 |
| `server/routes/team-connections.ts` | 180 |
| `server/routes/chat-apps.ts` (border: MCP app frames, not connected apps) | 125 |
| `server/host/connector-cards.ts` | 92 |

**The UI**

| File | Lines |
|---|---|
| `src/components/ConnectorCard.tsx` | 247 |
| `src/components/ConnectorAlsoUseful.tsx` | 90 |
| `src/components/SidebarConnectApps.tsx` | 98 |
| `src/components/AppsSection.tsx` | 32 |
| `src/components/ConnectionDetail.tsx` (not this feature: phone pairing) | 40 |
| `src/components/SavedKeysReset.tsx` | 54 |
| `src/components/AppGrantPrompt.tsx` | 232 |
| `src/components/MemberApps.tsx` | 121 |
| `src/components/bot-settings/AccessSection.tsx` | 920 |
| `src/components/bot-settings/useBotApps.ts` | 117 |
| `src/lib/connector-oauth.ts` | 55 |
| `src/lib/connected-apps.ts` | 69 |
| `src/lib/connected-apps-cache.ts` | 81 |
| `src/lib/connector-grants.ts` | 94 |
| `src/lib/bot-app-access.ts` | 61 |

**Tests and checks**

| File | Lines |
|---|---|
| `server/composio.test.ts` | 1594 |
| `server/composio-auth-configs.test.ts` | 443 |
| `server/composio-catalog.test.ts` | 302 |
| `server/composio-reuse.test.ts` | 183 |
| `server/composio-service-slugs.test.ts` | 157 |
| `server/composio-inventory.test.ts` | 152 |
| `server/composio-inventory-shared.test.ts` | 122 |
| `server/composio-files.test.ts` | 81 |
| `server/composio-broker-access.test.ts` | 59 |
| `server/composio-availability.test.ts` | 43 |
| `server/cloud-connected-apps.test.ts` | 416 |
| `server/connector-proxy.test.ts` | 893 |
| `server/connector-scope-hint.test.ts` | 116 |
| `server/connected-app-tools.e2e.test.ts` | 192 |
| `server/routes/connectors-listing.test.ts` | 59 |
| `shared/connector-scopes.test.ts` | 218 |
| `shared/composio-storage.test.ts` | 72 |
| `electron/managed-composio.test.mjs` | 211 |
| `scripts/verify-connected-apps.ts` | 252 |
| `src/components/ConnectorCard.test.ts` | 84 |
| `src/components/ConnectorCard.refusal.test.ts` | 76 |
| `src/components/ConnectorAlsoUseful.test.ts` | 89 |
| `src/components/SidebarConnectApps.test.ts` | 59 |
| `src/components/SidebarConnectApps.dom.test.ts` | 35 |
| `src/lib/connected-apps-cache.test.ts` | 79 |
| `src/lib/connector-grants.test.ts` | 147 |
| `src/lib/bot-app-access.test.ts` | 85 |
| `src/components/bot-settings/AccessSection.test.ts` | 457 |
| `src/components/bot-settings/useBotApps.test.ts` | 78 |
| `src/components/bot-settings/useBotApps.dom.test.ts` | 150 |
| `src/components/bot-settings/ConnectorScopesControl.dom.test.ts` | 45 |

**Documents**

| File | Lines |
|---|---|
| `docs/composio.md` | 256 |
| `docs/verification/connected-apps-oauth.md` | 37 |
| `docs/verification/gmail-drafts.md` | 49 |
| `docs/verification/full-access.md` | 71 |
| `docs/superpowers/plans/2026-08-31-04-connector-scopes.md` | 158 |
| `docs/superpowers/specs/2026-09-30-per-bot-tool-scoping-design.md` | 300 |
| `cloudflare/composio-broker/README.md` | 207 |
| `apps/docs/content/docs/connected-apps/index.mdx` | 82 |
| `apps/docs/content/docs/connected-apps/multiple-accounts.mdx` | 27 |
| `apps/docs/content/docs/connected-apps/self-hosted-composio.mdx` | 31 |
| `apps/docs/content/docs/connected-apps/github-sign-in.mdx` (border: GitHub CLI sign-in, not Composio) | 47 |
| `apps/docs/content/docs/connected-apps/meta.json` | 5 |
| `apps/docs/content/docs/troubleshooting/connected-apps.mdx` | 30 |

**Read in ranges** (the file is too large, or only a part is about this
feature):

| File (lines) | Ranges |
|---|---|
| `server/index.ts` (15258) | 115-120, 394-410, 465-469, 641-646, 1350-1380, 1470-1480, 1575-1690, 1890-1940, 2415-2430, 2765-2790, 2905-2960, 6430-6500, 7775-7800, 8236-8252, 9079, 9515-9525, 9655-9700, 10978-10992, 11330-11360, 11470-11480, 11578-11592, 11664-11674, 11949-11951, 12040-12046, 12665-12770, 14130-14335, 14730-14835, 15127, 15210 |
| `server/store.ts` (2256) | 1-6, 38, 300-330, 1455-1504 |
| `server/config.ts` (1227) | 340-348, 450-456, 700-815, 866-905, 980-995 |
| `server/routes/config.ts` | 398-425, 570-605 |
| `server/routes/bot-patch.ts` | 268-350, 615-660, 695-712 |
| `server/request-auth.ts` | 312-320, 370-420, 472-475, 533-540, 575-592, 636-650 |
| `server/host/team-connections-host.ts` | 199, 230-335 |
| `electron/main.mjs` | 360-450, 1100-1135, 1205-1232, 2730-2750, 2850-2875 |
| `src/components/PluginsPanel.tsx` (807) | 52-130, 131-400, 440-488, 600-656, 750-807 |
| `src/components/AppTile.tsx` (301) | 50-180, 198-301 |
| `server/email/tools.ts` | 19-45 |
| `server/drivers/claude.ts` | 1045-1060 |
| `cloudflare/composio-broker/src/index.ts` | 107-110, 297, 312-322, 712-722 |
| Small helpers | `server/connector-request-items.ts` 1-35, `src/lib/connector-poll.ts` 1-44, `src/lib/connector-status.ts` 1-74, `src/lib/mcp-sign-in.ts` 26-36, `packages/phone-protocol/src/wire.ts` 240-260, `src/state/store.tsx` 1526-1556, 2805-2830, `src/components/PluginsPanel.grants.test.ts` 190-260 |

## 3. How it works

### 3.1 The two modes and where the secret is

1. `connectionMode(cfg)` gives one of three modes
   (`server/composio.ts:143-147`):
   - `"self-hosted"` when a project key is saved.
   - else `"managed"` when broker access is present.
   - else `"unavailable"`.
   A saved key wins. An empty key `""` means "cleared", and the broker takes
   over again at once (`server/composio-session.ts:53-56`,
   `server/composio.test.ts:731-755`).
2. **The project key on the desktop.** The desktop keeps secrets in
   `credentials.bin` in the Electron user data folder. It is a JSON document
   encrypted with Electron `safeStorage` (`electron/main.mjs:364`,
   `:385-398`). The key name is `composioApiKey`. At start, a packaged app
   moves a plain `ak_…` key out of `config.json` into that store, blanks the
   field and deletes the old `key` and `url` fields of the two-key flow. It
   writes through a temporary file and a rename, mode `0600`
   (`electron/main.mjs:400-433`).
3. The desktop gives the key to the server process as the environment
   variable `COMPOSIO_API_KEY` (`electron/main.mjs:1124-1126`). The server
   copies it into `cfg.composio.apiKey`. The environment wins over the file
   (`server/config.ts:715`, `:734-735`). `config.json` keeps only
   `composio.userId` and `composio.sessionId`, and `apiKey: ""` as a
   tombstone "so no older plaintext survives the merge"
   (`server/routes/config.ts:574-595`).
4. **Saving a key.** `PATCH` config with a non-blank key first runs
   `prepareProjectSession`. A key that does not start with `ak_` gives
   "Composio project API keys start with ak_". A key that Composio refuses
   gives a 400, and nothing is saved (`server/composio-session.ts:195-197`,
   `server/routes/config.ts:405-416`). A blank key clears `apiKey` and
   `sessionId`.
5. **The broker token on the desktop.** When the person has no own key, the
   Electron main process registers the installation with the broker
   (`electron/managed-composio.mjs:57-120`):
   1. If a token is held, it sends `GET {url}/v1/me` with
      `Authorization: Bearer <token>`, `redirect: "error"`, 8 s. Only a 401
      deletes the token. "Only a definitive auth failure rotates the
      credential, so an outage never strands authorized accounts"
      (`:73-88`).
   2. Else it sends `POST {url}/v1/installations` with `{}`, 15 s. The answer
      must have a 64-hex `token` and an `installationId`. It saves both in the
      encrypted store (`:89-105`).
   3. Any failure only logs "connected-apps registration failed" and keeps
      the old values (`:106-110`).
   4. A broker URL needs HTTPS, or HTTP on loopback, with no user, query or
      fragment (`:23-35`). The default URL is used only by a shipped build,
      "so development and tests never register" (`:16-21`).
   5. `OMB_COMPOSIO_BROKER=off` (also `0`, `false`, `no`) stops all traffic
      to the broker (`:6-9`).
6. The desktop gives the broker URL and token to the server as
   `OMB_COMPOSIO_BROKER_URL` and `OMB_COMPOSIO_BROKER_TOKEN`. It first
   deletes any inherited values (`electron/managed-composio.mjs:45-55`).
   Later changes go by a parent-port message
   `{type: "<product>:managed-composio", access}`
   (`electron/main.mjs:1216-1227`, `server/composio-broker-access.ts:27-44`,
   `server/index.ts:1477`). `access: null` clears the access.
7. **An unreadable store.** A macOS keychain can say "temporarily
   unavailable" at launch. The desktop tries again after 100, 200, 400 and
   800 ms (`electron/secure-credentials.mjs:1-40`). "Unavailable" must never
   look like "empty", or "a caller would register a fresh installation over
   the real one". While the store is unreadable, the desktop:
   - loads no saved keys and refuses every write: "Writing from an unread
     store would drop the secrets it could not read"
     (`electron/main.mjs:378-389`).
   - does not register with the broker (`electron/main.mjs:1211-1214`).
   - tells the server `OMB_CREDENTIAL_STORE=unavailable`
     (`electron/main.mjs:1127`). The server then answers
     `credentialStore: "unavailable"` "so the UI keeps its list instead of
     wiping it" (`server/composio.ts:153-162`).
8. **Reset saved keys.** After the person confirms, the desktop renames the
   file to `credentials.bin.unreadable-<ms>` and restarts with an empty store.
   A store that was read is never touched. Only `ENOENT` counts as moved
   (`electron/secure-credentials.mjs:42-61`, `electron/main.mjs:2746-2747`).
9. **A Cloud home** has its own broker installation
   (`server/cloud-connected-apps.ts`). Its token is in
   `<data>/connected-apps-installation.json`, mode `0600`,
   `{version: 1, brokerUrl, installationId, token}`. No backup carries the
   file (`:18-32`, `:168-170`, `server/workspace-backup-policy.test.ts:72-75`).
   The rules:
   - A token on the volume serves at once. Then `GET /v1/me` checks it
     (`:190-193`).
   - Only a 401 registers again. A 5xx, a 429 or a network error keeps the
     token (`server/cloud-connected-apps.test.ts:117-141`).
   - With no token, the server keeps booting and tries again after 30 s,
     1 min, 2 min, 5 min, 10 min, then every 30 min, plus 0 to 20 % jitter
     (`:20-21`, `:115-120`).
   - It never uses a token that it could not save: "An unsaved token would be
     a different installation after the next restart, its connected accounts
     left behind" (`:176-177`).
   - A file that cannot be read, or of another version, is kept as it is
     (`:63`, `:72`, `:81`).
   - A file with invalid JSON reads as "none" (`:75`). Valid JSON of the
     wrong shape also reads as "none" when its version is 1 or missing
     (`:76-80`). The next registration then writes over the file.
   - A token goes only to the broker that issued it (`:82-83`).
   - A saved project key wins, and then the home sends the broker nothing
     (`:150-153`).
   - `OMB_CLOUD_CONNECTED_APPS_GRANT` is a proof of a paid Cloud. The home
     sends it with `PUT /v1/installation/cloud {grant}` (`:122-146`). Plans
     and billing are out of scope.
10. **Where the key never goes.** The bridge gets "only this boot's loopback
    token; project and broker credentials never leave the harness"
    (`server/composio.ts:247`). The settings status returns only a hint of the
    key (`server/index.ts:11584-11587`). Caches are keyed by a SHA-256
    fingerprint of the kind, the endpoint and the credential, "so no
    plaintext copy" of the key is kept (`server/composio.ts:103-112`,
    `server/composio-project.ts:149-152`).

### 3.2 The Session (project-key mode)

1. `ensureProjectSession(cfg, wanted)` (`server/composio-session.ts:284-303`):
   1. No key gives "No Composio project key configured".
   2. It reads the saved Session: `GET /tool_router/session/{id}`, 15 s.
      A 404 gives null (`:104-112`).
   3. It reuses the Session when the echo has `multi_account.enable === true`
      and every wanted auth config is in it (`:85-89`, `:114-126`).
   4. Else it tries to change the auth configs in place with
      `PATCH /tool_router/session/{id}`. The id and the MCP address stay
      (`:246-260`).
   5. Else it makes a new Session (`prepareProjectSession`, then
      `adoptProjectSession`).
2. **Create.** `POST /tool_router/session`, 30 s, with `user_id`,
   `manage_connections {enable, enable_wait_for_connections,
   enable_connection_removal}` all true, `multi_account {enable: true,
   max_accounts_per_toolkit: 10, require_explicit_selection: true}`, and
   `auth_configs` only when not empty (`:39-51`, `:128-157`). 10 is the
   maximum of Composio (range 2 to 10, `:37-38`).
   - If Composio refuses named auth configs (400, 404, 409 or 422), the
     server drops the configs that the message names, or all of them, and
     tries again. "No config may block the rest" (`:140-157`).
   - A final failure gives "Composio rejected this key (HTTP n)" (`:158`).
3. **The Composio user.** A new Session keeps the Composio user id of the
   old one: "Connections belong to the Composio user, not the Session"
   (`:201-213`). A new user id is `<product>_<uuid>` (`:207`, `:216`).
   `adoptProjectSession` saves `userId` and `sessionId` with `saveConfig`
   (`:230-244`).
4. **Reuse of an earlier user** (opt-in, `reuseEarlierUser`):
   1. A fresh personal installation reads up to 4 pages of all connected
      accounts of the project (`EARLIER_USER_PAGES`, `:164-187`).
   2. It takes the one `<product>_*` user with an `ACTIVE` account. It takes
      none when it finds 0 or more than 1 such user, when it reaches the page
      limit, or on an error.
   3. The config route passes `reuseEarlierUser: !sharedMembership()`
      (`server/routes/config.ts:409`). A Team Cloud or a shared server never
      looks, "because every member's bots would then get that person's apps"
      (`docs/composio.md:91`).
5. **The MCP address** of a Session is trusted only when it is HTTPS on
   `composio.dev` or a subdomain, or on the origin of an explicit
   `OMB_COMPOSIO_API`. Otherwise "Composio returned an untrusted Session MCP
   URL" (`:58-83`).
6. **The account cap of an old Session.** `raiseAccountCap` sends a `PATCH`
   with `multi_account` once for each boot when the echo cap is below 10.
   A failure only logs, and "this link goes ahead" (`:262-282`).
7. **Memory for each boot** (lost at a restart by design): the upgrade
   attempts and the auth configs that Composio refused (`:91-102`).
8. **Auth configs** (the person's own OAuth app in their Composio project,
   for an app such as Xero that Composio does not sign in itself):
   - The list is read with `GET /auth_configs?is_composio_managed=false`, up
     to 20 pages, cached 60 s, 15 s after a failure. A failed read keeps the
     last list (`server/composio-project.ts:67-69`, `:113-174`).
   - For each app, the newest enabled config wins, unless a bot named one
     (`:176-199`).
   - A bot names a config with `auth_config_id: "ac_…"` in
     `COMPOSIO_MANAGE_CONNECTIONS`. The server checks it (exists, same app,
     not managed, enabled) and saves the pick in
     `<data>/composio-auth-configs.json`, mode `0600`, keyed by the project
     fingerprint, with no key (`:224-285`).
   - When a config has "enabled for Tool Router" off, the server turns it on
     with `PATCH /auth_configs/{id}`. A key without that right gives a 409
     with advice (`:209-222`, `server/composio-session.ts:305-326`).
   - The managed mode cannot use an auth config of the person. The answer is
     a 409 that tells the person to add a project key
     (`shared/connector-availability.ts:22-28`). X (Twitter) is always off in
     the managed mode (`:3`, `:11-17`).
9. **A Team Cloud member** uses a Session only while its `user_id` is the
   member's. A Session for another user throws "Composio returned a Session
   for another user" (`server/composio-session.ts:291-301`). Member Session
   ids are kept by a callback, never in `config.json` (`:221-228`).

### 3.3 The inventory: what is connected

1. **Project-key mode** (`server/composio.ts:445-457`). It runs two reads
   at the same time:
   - the Session toolkits: `GET /tool_router/session/{id}/toolkits?limit=50&is_connected=true`,
     15 s, up to 100 pages (`:320-348`). "Unfiltered, this endpoint pages
     through the whole marketplace 50 at a time" (`:329-330`).
   - the connected accounts of the user: `GET /connected_accounts?limit=50&order_by=updated_at&order_direction=desc&user_ids=…`,
     up to 100 pages (`server/composio-project.ts:302-340`).
   A failed account read (a scoped key can lack the right) does not throw. It
   marks the inventory `complete: false`.
2. **Managed mode**: `GET /v1/connectors/connected` on the broker. A reply
   with no `complete` field counts as complete. Only `complete: false` is
   incomplete (`server/composio.ts:425-444`).
3. **Strict schemas** decide "complete" (`server/composio-inventory-schema.ts:3-30`):
   - `ACCOUNT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/`.
   - `TOOLKIT_SLUG` refuses the literal `__proto__`.
   - each toolkit item needs an account or `is_no_auth: true`.
   A repeated cursor, the page limit or a bad item gives `complete: false`,
   not an error.
4. **One app's state** (`server/composio.ts:377-389`):
   - `connected` = any account is `ACTIVE`.
   - `pending` = any account is `INITIATED`, `INITIALIZING` or `PENDING`.
   - `status` = the active one, else the pending one, else the first, else
     `"not_connected"`.
   A no-auth toolkit counts as connected (`:391-418`). Accounts are sorted
   newest first. An invalid id is dropped (`:350-369`).
5. **Three readers, three rules:**
   1. **What a person sees** (`sharedConnectedInventory`): one read is shared
      for 20 s. Only a complete read is kept. A start or a removal of a
      connection forgets it. A read that began before that is not kept. "A
      bot's tool call never reads it" (`server/composio-inventory-cache.ts:1-50`).
      A status check that differs from the kept copy also forgets it
      (`server/composio.ts:700-704`).
   2. **Which app owns a tool name** (the service slugs): fresh for 60 s,
      served stale up to 5 min while one read runs behind it, then awaited. A
      failed read answers the last good list for the same backend
      (`server/composio.ts:555-606`). The list exists so that
      `BLAND_AI_MAKE_CALL` is not caught by a grant of `bland` (`:555-563`).
   3. **A check that gates a call** (`verifiedConnectedServiceSlugs`): never
      cached. It throws "Connected-app inventory is incomplete; account
      discovery did not finish." (`:473-477`). A team bridge refuses the
      opaque `COMPOSIO_PROXY_EXECUTE` when this check fails
      (`server/host/team-connections-host.ts:315-326`).
6. **The route** `GET /api/connectors/connected`
   (`server/routes/connectors-listing.ts:30-48`):
   - When the mode is not configured: `{configured: false, credentialStore:
     "unavailable" | "ok", services: {}}`, with no read.
   - Else: `{configured: true, credentialStore: "ok", inventoryComplete,
     services}`. Only the header `cache-control: no-cache` (the Refresh
     button) forces a fresh read.

### 3.4 How the bridge reaches a turn

1. **Mount.** A direct turn mounts the bridge when
   `bot.composio !== false`, the mode is configured and the engine has the
   capability `composioMcp` (`server/index.ts:7786-7788`). The capability
   `mcpToolsFoundByName` (only the Claude driver) chooses dotted tool names
   (`gmail.search_emails`). Other engines get `gmail_search_emails`
   (`server/contracts.ts:268-272`, `server/drivers/claude.ts:1944`).
2. `appsIntegrations` (`server/host/team-connections-host.ts:263-277`)
   builds:
   - `composio`: the bridge of the installation or the team.
   - `composioOwn`: on a Team Cloud turn that acts for a member who has own
     apps, a second bridge with that member's access and a token with
     `connectorsFor: <person>`.
3. **The token.** It is an internal capability of kind `"connectors"`
   (`server/index.ts:1574-1602`). It is stable for each bot, thread and set of
   grants (`:1649-1665`). The server refuses to mint one for a turn that is
   not active (`:1667-1670`). Each path under `/api/internal/connectors/`
   refuses another kind: "this internal capability cannot access that
   service" (`:12750-12757`).
4. **The command** (`server/composio.ts:219-259`): the server's own Node
   binary with `SPAWNED_PROXIES.connectors`, and these variables:
   - `ELECTRON_RUN_AS_NODE=1`.
   - `OMB_CONNECTOR_UPSTREAM_URL=<harness>/api/internal/connectors/mcp`.
   - `OMB_CONNECTOR_UPSTREAM_HEADERS={"authorization":"Bearer <token>"}`.
   - `OMB_HARNESS_URL`, `OMB_CONNECTOR_TOKEN`, `OMB_BOT_ID`, `OMB_THREAD_ID`.
   - `OMB_CONNECTOR_ALLOWED_TOOLS`: the grants as JSON.
   - `OMB_CONNECTOR_SERVICE_SLUGS`: the connected slugs.
   - `OMB_CONNECTOR_APP_TOOLS` and `OMB_CONNECTOR_APP_TOOL_NAMES`.
   The token has its own name because "Codex flattens all mounted MCP env
   into one environment" (`:251`).
5. **Limits at the start of a turn.**
   - The start waits at most 5 s (`TURN_START_SLUGS_WAIT_MS`) for the slugs
     when it holds no list. Then it starts without them
     (`server/composio.ts:235`, `:603`,
     `server/composio-service-slugs.test.ts:121-150`).
   - A grants list or a slug list over 32 KiB is not sent. The tool list
     then stays unfiltered, and "grants are enforced per call"
     (`server/composio.ts:224-241`, `server/connector-advertisement.ts:6-13`).
   - A bot with no grants causes no read of the slugs
     (`server/composio-service-slugs.test.ts:152-156`).
6. **The order of servers** of a turn: `agents`, `composio`, the own-apps
   server, `browser`, `data`, `email`, `device`, `computer`, then the
   person's own servers. A name clash keeps the built-in
   (`server/drivers/turn-mcp.ts:31-42`). The bridge always stays a stdio
   process, also for engines that take URL servers (`:87-107`).
7. **The tool budget.** The bridge is one of the proxies that read their own
   share from `OMB_TOOL_LIMIT` (`server/drivers/turn-mcp.ts:65-79`). The
   budget itself is in `agent-tools.md`.
8. **Errors.**
   - A room (group) turn catches an error of `appsIntegrations`. It appends
     "connected apps are unavailable — <error>" and does not start the turn
     (`server/index.ts:9661-9674`).
   - A direct turn has no local catch at that line (`:7786-7788`).
9. **The prompt part** "Connected apps" is `composioSystemPrompt(connectorTools)`
   plus `describeConnectorScopes(connectorScopes)`, only when the bridge is
   mounted (`server/index.ts:8249`). An example of the scope sentence: " This
   bot may use only these connected apps: gmail (read only), slack (read and
   write). Do not try others, and do not write to a read-only one."
   (`packages/phone-protocol/src/connector-scopes.ts:136-149`).

### 3.5 The bridge (`server/connector-proxy.ts`)

The bridge is a stdio MCP server. stdout carries MCP. Logs go to stderr
(`:1-2`). It never talks to Composio. It talks only to the relay.

1. **`initialize`.** It forwards the frame with a 1 s limit and ignores a
   failure. It always answers itself with `serverInfo {name:
   "<product>-connectors", version: "1"}`. "A stalled provider must never keep
   the local MCP client from mounting the connector tools" (`:38`,
   `:316-329`).
2. **`server/discover`** gets -32601 at once (`:330-336`).
3. **`tools/list`** (`:283-305`, `:386`):
   1. Two tries, 500 ms apart, 3 s in all. "Antigravity's CLI drops a stdio
      server whose tool list is not back ~5 s after it starts" (`:40-42`).
   2. A 4xx other than 429, or a result that is not a list, is a refusal. The
      bridge then lists no tools.
   3. A timeout, a dropped connection, a 5xx, a 429, a JSON-RPC error or an
      unreadable reply is an outage. The bridge then lists the four meta
      tools, with the note "(The connected-apps service did not answer when
      this session started; if a call fails, try it again shortly.)"
      (`server/connector-discovery-fallback.ts:1-70`). This is the fix of
      v0.1.177.
   4. Then, in order: the grants filter, two new parameters (`auth_config_id`
      and `find`) on `COMPOSIO_MANAGE_CONNECTIONS`, the named app tools, the
      schema profile and the tool-count cap (`:238-273`).
4. **The grants filter** (`server/connector-advertisement.ts:96-111`):
   - `COMPOSIO_MANAGE_CONNECTIONS` is always listed, so a bot with no grants
     can still ask for a sign-in.
   - The meta tools are listed when any grant exists.
   - An app tool is listed when its app has `"*"` or its exact name.
   - A grants map with any bad entry reads as null, and the list stays
     unfiltered (`:53-79`).
   - At Full access, and only for a bot with no scopes, the app sandbox tools
     (`COMPOSIO_REMOTE_WORKBENCH`, `COMPOSIO_REMOTE_BASH_TOOL`) are added
     (`:26-31`).
5. **`tools/call`** (`:337-388`):
   1. The bridge fits the arguments to the schema of that tool, if the tool
      was listed (section 3.7).
   2. A name that ends in `MANAGE_CONNECTIONS` is caught. It never reaches
      Composio (section 3.6).
   3. A name that ends in `WAIT_FOR_CONNECTIONS` gets a local answer: the
      app "is handling connection completion and will continue the task
      automatically" (`:368-371`). The model cannot hold a turn open for a
      sign-in.
   4. A named app tool becomes one `COMPOSIO_MULTI_EXECUTE_TOOL` call
      (section 3.8).
   5. Other calls go to the relay. The answer gets the signed-out hint and
      the argument notes.
6. **Numbers.** A number in `params.arguments` that does not survive a round
   trip (above 2^53, `1e400`, a lossy decimal) stops the call: "This
   connected-app call was not sent: an argument contains a numeric literal
   that cannot be preserved. Send precision-sensitive IDs as JSON strings…"
   (`:397-425`).
7. **Limits.** A reply over 20 MiB fails with "connector response exceeded
   20 MB" (`:37`, `:84-103`). A call waits up to 10 min (`:39`). The bridge
   keeps one upstream `mcp-session-id` for its life (`:57`, `:137-138`).
8. **Errors.** An error of `tools/call` becomes an `isError` text result.
   Other methods get JSON-RPC error -32000 (`:389-394`). stdin close ends the
   process with code 0 (`:434`).
9. **The last good list.** The relay keeps the last good `tools/list` of
   each backend (endpoint and credential) in memory. It serves it on a
   thrown error, a 5xx or a 429. A 4xx is never masked (`server/connector-tools-list.ts:1-97`).
   Only when that cache is empty does the bridge use the four meta tools.

### 3.6 A bot asks for an app: the connector card

1. The model calls `COMPOSIO_MANAGE_CONNECTIONS` with `toolkits`. Each item
   is a slug, or `{toolkit|name, action, alias|account, auth_config_id}`.
   Only the actions `add`, `connect` and `initiate` count. The bridge
   lower-cases the slugs and removes duplicates of (slug, alias)
   (`server/connector-proxy.ts:167-208`).
2. A bad auth config id gives an error with no card: "auth_config_id must be
   a Composio auth config id (ac_ and then letters or digits)…"
   (`:149-150`, `:348-351`).
3. The bridge sends `POST /api/internal/connectors/request` with
   `{botId, threadId, items, resumeKey: randomUUID()}` and 30 s
   (`:211-222`). A `find` string goes to `/api/internal/connectors/find`
   instead (`:225-235`).
4. The server (`server/host/connector-cards.ts:27-88`) checks, in order:
   1. the thread belongs to the bot, else 403.
   2. the `resumeKey` matches `^[\w-]{8,100}$`, else 400.
   3. 1 to 12 items, else 400 "one to twelve valid connection requests are
      required".
   4. the mode is configured and `bot.composio !== false`, else 409.
   5. with `connectorScopes`, each slug is in `apps`. Else it writes an
      `auto-denied` decision and answers 403 "<bot> has not been given access
      to <slug>; allow it under the bot's Access settings first".
   6. the managed policy and the Team Cloud owner rule, else 409.
5. It reads the status of the apps. A failure counts as `{}` (`:49`). An app
   that is connected, with no alias, gets a card with status `connected` and
   a note that tells the model how to add another account (`:67-72`).
6. **No second card.** A request with the same `resumeKey`, slug and alias
   reuses the card of the thread (`:56-64`).
7. The card is a message of kind `connector` with
   `{slug, label, description, status, resumeKey, alias?}` (`:76-82`).
8. The bridge tells the model one of two things (`:352-361`):
   - "…showed the user a secure connection card for X. End this turn now. The
     app will continue the task automatically after the connection
     finishes."
   - or, when nothing needs a sign-in: "…already connected; no sign-in
     started. Do not end this turn: carry on now."
9. **The card routes** are
   `/api/bots/{bot}/connector-cards/{msg}/(authorize|status|resume|dismiss)`.
   "The browser auth URL goes only to this local UI and is never stored in
   the transcript." (`server/index.ts:14773-14832`):
   - **authorize** needs the admin scope: "Members reach authorize for an
     MCP server's Sign in card; connecting an app stays an admin's"
     (`:14786-14787`). It sets the card to `authorizing`, then calls
     `authorizeService`. On an error, the card becomes `failed` with the
     error cut to 180 characters (`:14788-14799`).
   - **status** reads the app. With an alias, only the account with that
     alias counts: "A different active account must never complete a
     second-account card; missing alias metadata stays pending."
     (`:14801-14812`). `failed|expired|revoked|error` gives `failed` with
     "Connection <STATUS>".
   - When connected, the server resumes the parked turn only when every card
     with the same `resumeKey` is connected and not dismissed. The text is
     fixed: "<product> connection update: the user securely connected
     <labels>. Continue the task that paused for this connection. Do not ask
     them to connect it again." (`:1897-1898`, `:11344-11354`).
   - **resume** answers 409 "finish connecting every requested app first"
     until all cards are done (`:14821-14825`).
   - **dismiss** marks the card `dismissed` and releases the wait with "The
     connection request was dismissed" (`:14827-14830`).

### 3.7 Sign-in, more than one account, and recovery

1. **The start of a sign-in** (`authorizeService`, `server/composio.ts:834-889`):
   1. It normalizes the alias: 1 to 64 printable characters
      (`:77-83`, `:201-210`). It maps the old slug `x` to `twitter`
      (`server/composio-project.ts:44-48`).
   2. It forgets the caches before it starts (`:840`).
   3. **Managed:** `POST /v1/connectors/{toolkit}/authorize` with
      `{alias?}` (`:841-851`).
   4. **Project key:** it gets the Session for the toolkit, lists the
      user's accounts for the toolkit (a failure counts as none) and plans
      the link (`:852-861`).
   5. It sends `POST /tool_router/session/{id}/link` with `{toolkit, alias?}`,
      30 s (`:863-871`).
   6. An error that matches `/does not manage auth|auth[_ ]?config/i` makes
      it read the configs again, rebuild the Session and try the link one
      more time (`:217`, `:872-886`).
   7. The address must be HTTPS on `composio.dev` or a subdomain
      (`trustedAuthUrl`, `:192-199`, `:887-888`).
2. **The plan** (`planAccountLink`, `shared/connector-account-link.ts:20-37`).
   A "usable" account is `active`, `initiated`, `initializing` or `pending`.
   An account "may be active" when it has no id, no status, or `active`.
   1. The same alias on an account that may be active gives 409 `Account
      alias "<a>" is already in use for <toolkit>`.
   2. The same alias on accounts that are not active puts them in `replace`.
      The server deletes them with `revoke_on_delete=true` before the link
      (`server/composio.ts:861`). This is the fix of v0.1.54 ("recover
      pending sign-ins without duplicate accounts").
   3. 10 or more usable accounts (not counting `replace`) give 409
      "<toolkit> already has the maximum of 10 accounts".
   4. With an alias, or with no accounts yet, the link goes ahead.
   5. Accounts exist, one may be active, and no alias: 400 "Add an account
      alias so the existing connection is not replaced".
   6. Else (only dead or pending accounts, no alias): a new alias
      `omb-retry-<uuid>`. Nothing is deleted (`server/composio.test.ts:1297-1325`).
      A pending account counts toward the cap until Composio marks it
      `EXPIRED`, "shortly after its link lapses"
      (`src/components/ConnectorCard.tsx:18`). `EXPIRED` is not usable
      (`shared/connector-account-link.ts:14`). The dead account then stays
      in the list until the person disconnects it
      (`src/components/AppTile.tsx:89-99`).
   The broker runs the same function (`cloudflare/composio-broker/src/index.ts:715-721`).
   On the broker, a failed account list counts as no accounts (`:712-713`).
3. **Links last 10 minutes** in Composio (`src/lib/connector-oauth.ts:8-9`).
   The UI keeps a pending link in memory only, with its `createdAt`. It
   reuses the link for 10 minutes and does not renew the clock (`:11-13`,
   `src/components/ConnectorCard.tsx:96-97`). After that, a new authorize
   runs.
4. **The tab.** The UI opens a blank tab in the click, before the request,
   so the browser does not block it. It sets `opener = null`. In the
   desktop app it opens the system browser instead
   (`src/lib/connector-oauth.ts:15-55`).
5. **The card watches the status** every 4 s for 12 minutes (10 minutes of
   link and 2 minutes for Composio to mark the account `EXPIRED`), and on
   window focus (`src/components/ConnectorCard.tsx:17-19`, `:56-83`). There is
   no callback from Composio to the server.
6. **The Apps page** polls `GET /api/connectors?services=<slug>` every 5 s,
   24 times (2 minutes) (`src/lib/connector-poll.ts:4-5`). Only a new, or
   newly active, account counts as "connected".
7. **Reconnect** on the Apps page deletes the old account first, then
   authorizes under its alias (`src/components/PluginsPanel.tsx:349-352`,
   `scripts/verify-connected-apps.ts:215-230`). If the authorize then fails,
   the old account is already gone.
8. **The first account and the label.** The plan allows no label when the
   app has no accounts (`shared/connector-account-link.ts:34`). The Apps tile
   still opens the label form for every new account and refuses an empty
   label (`src/components/AppTile.tsx:148-152`, `:263-274`). A connector card
   asks for a label only after the server refuses (section 5.2).
9. **A signed-out app.** A failed result that matches `USER_NOT_LOGGED_IN`,
   `401`, "no connected account", `invalid_grant` and similar words gets a
   second text. It tells the model to call `COMPOSIO_MANAGE_CONNECTIONS`,
   end the turn, or ask the person to choose Reconnect, and not to retry
   (`server/connector-signed-out-hint.ts:6-15`).
10. **A missing OAuth permission** (`ACCESS_TOKEN_SCOPE_INSUFFICIENT`) gets
    a note. For Gmail settings it names the scope (`gmail.settings.basic` or
    `gmail.settings.sharing`) and says "Reconnecting will not add it". The
    fix is the person's own auth config (`server/connector-scope-hint.ts:1-47`).
    Only failed calls get the note.
11. **A wrong account.** A GitHub "not accessible by integration" or a
    Composio "multiple … accounts connected" error gets a note that names the
    other active accounts and asks the model to try one of them once
    (`server/connector-account-hint.ts:1-90`).
12. **Remove.**
    - `DELETE /api/connectors/{slug}/accounts/{id}` deletes one account. In
      the project-key mode it checks that the account is this user's and this
      app's (`server/composio.ts:783-808`).
    - `DELETE /api/connectors/{slug}` deletes, in the project-key mode, only
      the account that the Session selected (`:767-779`).
    - Composio deletes with `revoke_on_delete=true`, 30 s
      (`server/composio-project.ts:342-347`), so the provider grant ends too.

### 3.8 The named mail and calendar tools

1. The bridge defines nine tools itself (`server/connector-app-tools.ts:45-176`).
   Each one is one Composio tool run through `COMPOSIO_MULTI_EXECUTE_TOOL`,
   "so the relay judges it exactly as that tool: its grant, the bot's read or
   write scope, approval cards" (`:1-3`):

   | Tool | Composio tool | Defaults and limits |
   |---|---|---|
   | `gmail.search_emails` | `GMAIL_FETCH_EMAILS` | `user_id: "me"`, `max_results` 10, at most 50, no payload |
   | `gmail.read_email` | `GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID` | `format: "full"` |
   | `gmail.read_email_thread` | `GMAIL_FETCH_MESSAGE_BY_THREAD_ID` | |
   | `gmail.create_draft` | `GMAIL_CREATE_EMAIL_DRAFT` | first address is `recipient_email`, the rest `extra_recipients` |
   | `gmail.list_drafts` | `GMAIL_LIST_DRAFTS` | 20, at most 100 |
   | `gmail.read_draft` | `GMAIL_GET_DRAFT` | |
   | `gmail.update_draft` | `GMAIL_UPDATE_DRAFT` | "Never create a replacement if this fails." |
   | `gmail.send_email` | `GMAIL_SEND_EMAIL` | "Only use when the person explicitly asks to send" |
   | `googlecalendar.list_events` | `GOOGLECALENDAR_EVENTS_LIST` | `calendarId` "primary", `timeMin` now, 50, at most 250 |
   | `googlecalendar.list_calendars` | `GOOGLECALENDAR_LIST_CALENDARS` | |

2. Each tool takes an optional `account`: "Connected account id to use.
   Needed when this bot may use only certain accounts of the app." The
   bridge puts it beside `tool_slug`, not in the arguments (`:15-16`, `:229`).
3. A bot gets a tool only when the app is connected, the grant allows the
   Composio tool, and the scope allows it (`appToolsFor`, `:197-208`). A
   read-only bot never sees `create_draft`, `update_draft` or `send_email`.
   A draft counts as a write.
4. The answer is only the data of the inner tool. A refusal or an error of
   the relay comes back unchanged (`:233-242`).
5. **The Email app is a different thing.** It is a built-in IMAP and SMTP
   mailbox with a password, slug `email`, tools `mcp__email__EMAIL_*`
   (`server/email/host.ts:1-3`, `packages/phone-protocol/src/email.ts:5-12`).
   It is not a Composio app, but it follows the same grant records: it is off
   when `composio === false`, or when `connectorScopes` or `connectorTools`
   exist and do not name `email` (`server/email/host.ts:52-70`).
6. **Server reads without a turn** (`server/connected-reads.ts`) read Google
   Calendar, Gmail and Outlook for the brief and other checks. They also run
   through `COMPOSIO_MULTI_EXECUTE_TOOL` (`:70-85`, `:520-523`). Limits:
   60 s for each read (`:403`), 20 calendar pages (`:79`). "A 50-email page
   is past the connected-apps service's size limit", so a Gmail page starts
   at 20 and halves down to 5 (`:466-470`). An answer of an unknown shape is
   an error, never an empty list (`:3-4`). With several accounts, Composio
   refuses a read that names none, so one read pins one account for all its
   pages (`:424-428`, `:472-473`).

### 3.9 The relay: the check of each call

`POST /api/internal/connectors/mcp` (`server/index.ts:14144-14314`). The
checks run in this order:

1. The capability is of kind `connectors`, and its ids match the query
   (`:12750-12769`).
2. The server reads the bot again. `composio === false`, or a mode that is
   not configured, gives 403 "connected apps are not enabled for this bot"
   (`:14146-14150`). The bridge reads this 403 as a refusal and lists no
   tools.
3. **The acting person.** A member's own bridge works only in a turn that
   still acts for that member (`teamConnections.relayActor`,
   `server/host/team-connections-host.ts:298-306`). A person's app never
   goes through the team bridge, and the reverse (`:308-333`).
4. **The shape.** `connectorCallFromFrame` reads the frame
   (`server/connector-verdict.ts:85-138`). A `COMPOSIO_MULTI_EXECUTE_TOOL`
   gives its inner tools. Other `COMPOSIO_*` tools and the
   `*_MANAGE_CONNECTIONS` and `*_WAIT_FOR_CONNECTIONS` tools pass through. A
   shape it cannot read is denied when the bot has a grants record: "this bot
   may call exactly these tools" must hold "even against a model that
   garbles the protocol" (`:1-3`).
5. **Exact tool grants.** The server reads the real connected slugs, then
   runs `evaluateConnectorTools(names, connectorTools, slugs)`
   (`server/connector-verdict.ts:140-164`, `server/index.ts:14175-14217`):
   - no record: allowed, `legacy: true`.
   - a record, even empty: only the named apps and tools.
   - each denial is logged with "tool name does not name a service", "tool
     is not in this service's grant" or "service is not granted".
   - the refusal text never lists other tools: "Never lists what the bot
     could have called instead: enumerating adjacent grants teaches the
     model to probe" (`:166-176`).
6. **The read-and-draft fence** of an unattended routine: only Gmail,
   Outlook and Calendar reads, plus one reply draft for each thread, with no
   `cc` or `bcc` (`server/read-and-draft.ts:44-80`, `server/index.ts:14236`).
7. The managed policy and the team person-app rule (`server/index.ts:14237`).
8. **Scopes.** `connectorAccessDecision(connectorScopes, calls, slugs)`
   (`packages/phone-protocol/src/connector-scopes.ts:94-110`):
   - no scopes: allowed.
   - the first refusal wins, so "a batch that mixes an allowed read with a
     forbidden write is refused whole rather than half-run".
   - `COMPOSIO_PROXY_EXECUTE` is always refused for a scoped bot.
   - an app not in `apps` gives reason `app`.
   - a write in a "read" app gives reason `write`.
   - in an app with an account limit, a call must name an allowed account id.
     None, an alias or another id gives reason `account`, "so the backend
     never picks".
   The refusal texts tell the model to ask the person to change "the bot's
   Access settings" (`server/connector-verdict.ts:188-197`).
9. **The app sandbox.** `COMPOSIO_PROXY_EXECUTE` is refused when the bot has
   grants and the sandbox is not open. The sandbox is open only at Full
   access, by a direct call, for a bot with no scopes (`server/connector-verdict.ts:7-40`,
   `server/index.ts:14251-14252`).
10. **Files.** The server reads the local files that the call names and
    lists them on the card. It uploads them only after the last check
    (`server/index.ts:14253-14254`, `:14301`). The rules:
    - A file must be in the bot folder, the VM folder, or be an exact
      attachment of this conversation. Hidden folders and the data folder of
      the app are refused. At most 10 files for each call
      (`docs/composio.md:151-157`).
    - The upload link comes from `POST {api}/files/upload/request` (project
      key) or `POST {broker}/v1/files/upload`, 30 s
      (`server/composio-files.ts:49-71`).
    - The bytes go only over HTTPS to `*.composio.dev`, AWS S3 or Cloudflare
      R2 hosts, with no user, password or port (`shared/composio-storage.ts:7-26`).
11. **Sends.** `outboundCallsIn` finds the send tools. `outboundHold.hold`
    decides between no card and the card (`server/index.ts:14224-14263`):
    - `fullAccess` is true when the turn's level is "full", also a room
      turn at a Chief's level (`:14237-14240`).
    - at Full access, a bot with no send rule of its own sends with no card
      (`server/outbound-hold.ts:33-34`).
    - a rule "allow" ("Send without asking") sends with no card. An opaque
      code call goes out under "allow" only at Full access (`:35-36`).
    - else the "Send on your behalf?" card waits up to 9 minutes (`:13`,
      `:52-109`). The card lists the files to upload before the arguments,
      and cuts the arguments at 400 characters (`server/outbound-requests.ts:76-89`).
    - there is no daily cap. A search of the server found no send counter.
      The only daily counter is for images (`server/image-daily-cap.ts:16-24`).
12. **Just before dispatch**, `beforeSend` checks everything again against
    the bot as it is now (`server/index.ts:14270-14306`):
    - apps turned off: "Connected apps were disabled while this call waited.".
    - grants or scopes changed: "This bot's connected-app permissions
      changed. The call was not run.".
    - the Gmail draft reservations of the turn.
    - `outboundHold.beforeDispatch`: a changed send rule gives "The outbound
      policy changed. Ask for approval again before sending."
      (`server/outbound-hold.ts:110-117`).
    Then the server uploads the files and sends the call.
13. **The answer.** The server records the app health
    (`connectionHealth.appCall`). It adds the scope hint, the missing-file
    hint and the account hint. In a confined routine thread it wraps each
    text as records from "a connected app", so it never reads as an
    instruction (`server/index.ts:14307-14313`, `server/read-and-draft.ts:99-129`).
14. Every allow and every deny of steps 4, 5 and 8 is a decision row with
    source `connector-scope` (`server/index.ts:14157-14216`, `:14245-14248`).
    "An app this bot may not touch is refused outright, never turned into a
    question for the person." (`:14232`). Only a send can ask.

**The Email app send is on another path.** The Claude driver pre-allows only
the four Email read tools. "A send asks as any tool of a person's own server
does" (`server/drivers/claude.ts:1053`). That ask goes to `autoVerdict`. At
Full access, `autoVerdict` approves every tool before the outbound guard
(`server/auto-approve.ts:112-114`). The bot's send rule (`bot.outbound`) is
read only in `server/outbound-hold.ts` (`:54`, `:111`). So "Ask every time"
does not hold an Email app send at Full access.

### 3.10 Grants: how a person sets them

1. **The switch** `composio` on the bot. Turning it off is always possible.
   Turning it on needs a configured mode and an engine with `composioMcp` or
   `emailMcp` (`src/components/bot-settings/AccessSection.tsx:716-726`,
   `src/components/bot-settings/useBotSettingsDerived.ts:76-80`).
2. **App scopes** (`ConnectorScopesControl`, `AccessSection.tsx:858-920`):
   1. "Limit this bot to specific apps" on writes `{apps: {}}`, so all apps
      are off. Off writes `null`, so every app is on again (`:894`).
   2. Each app has Off, Read ("Search, fetch, and list only.") and Read &
      write ("Tool grants and sending limits still apply.") (`:900-903`).
      Off deletes `apps[slug]` and `accounts[slug]` (`:871-880`).
   3. **"Accounts this bot may use"** shows for an app that is on and has two
      or more accounts, or has a limit already (`:905-916`). One checkbox for
      each account, labelled with its alias or its id.
      - With no limit, every account is allowed, also later ones.
      - After one change, the ticked ids are a fixed limit. A later account
        is off until ticked.
      - Ids that are no longer connected are dropped.
      - The last ticked box is disabled, so the list is never empty
        (`:881-888`, `:912`).
      - No control clears a limit back to "every account", except Off.
3. **Exact tools** (`ConnectorToolsGrants`, `AccessSection.tsx:242-480`):
   - The list comes from `GET /api/connectors/tools`, cached 60 s in the
     client (`:207-231`). The server hides the meta tools and
     `*_MANAGE_CONNECTIONS` and `*_WAIT_FOR_CONNECTIONS`, and cuts a
     description to 240 characters (`server/composio.ts:608-622`).
   - "All tools" stores `{tools: "*"}`. A list stores the names. Unticking the
     last tool removes the app from the record, which means no tools for it
     (`:292-310`).
   - The first restriction of one app puts `"*"` on every other known app, so
     the others are not emptied (`src/lib/connector-grants.ts:77-94`). Four
     old strings of a warning dialog for that case are still in `en.json`
     (`:6898-6901`) and no code uses them.
   - **Verb chips** "Read · n", "Draft · n", "Send · n", "Modify · n" and
     "Delete · n" add every tool of that class to the list
     (`AccessSection.tsx:414-432`). The class is not stored: "Preset hints,
     not a security boundary: the grant always stores the expanded explicit
     list." (`src/lib/connector-grants.ts:3-4`). The classifier checks
     delete, then modify, send, draft and read, and the first word found
     anywhere in the name wins (`:6-22`).
   - A record that this version cannot read shows "Custom grant" and is never
     rewritten (`:24`, `:83`, `AccessSection.tsx:366-369`).
4. **The server side** of `PATCH /api/bots/:id`:
   - `connectorTools`: `null` clears it. Else `parseConnectorTools` checks
     at most 64 apps, at most 500 tools for each, and the name patterns
     (`server/connector-tools.ts:1-48`). Then `validateConnectorGrants`
     refuses tools of another app, apps that are not connected, and tools
     that a complete and fresh catalog does not have. "An unreachable
     backend never blocks the patch: the call-time check stays the
     authority." (`server/routes/bot-patch.ts:335-347`,
     `server/composio.ts:483-513`).
   - `connectorScopes`: `normalizeConnectorScopes`, else 400. A limit of
     accounts for an app that is not in `apps` is dropped
     (`packages/phone-protocol/src/connector-scopes.ts:53-77`).
   - `grantScopedApps`: an app that the scopes turn on, but that a
     `connectorTools` record leaves out, gets `{tools: "*"}`. It runs at load
     and on each patch of the scopes (`:125-134`, `server/store.ts:318`,
     `:1486`).
5. **A new app goes to the bots** (`src/components/AppGrantPrompt.tsx:118-134`).
   When an owner or an admin connects an app for the first time:
   - each eligible bot with the app off is switched on (at "write"), unless
     its `composio` is `false`. The bot from which the person started the
     connection is switched on in all cases.
   - a managed allow list can stop this (`:124`).
   - a toast says "Your bots can now use {app}." with "Change". "Change" opens
     "Which bots can use {app}?" (`:147-232`).
6. **A bot that a Chief makes** copies the Chief's `composio`,
   `connectorTools`, `connectorScopes` and `mcpServers` only with the same
   owner and the same audience. Else it starts with `composio: false` and
   `connectorTools: {}` (`server/inherited-apps.ts:15-31`). An imported bot
   and a restored bot also start with apps off (`docs/composio.md:248`).

### 3.11 The catalog of apps

1. `listToolkits(cfg)` (`server/composio.ts:918-937`):
   - project key: `GET {base}/toolkits?limit=500&sort_by=usage`, 15 s.
   - managed: `GET /v1/catalog`, 15 s.
   - neither, or no answer: 24 curated cards (`:891-916`).
2. `catalogFor` (`server/composio-catalog.ts`):
   - fresh for 10 minutes. A reader gets the held copy at once, and one walk
     runs behind it. Only the first read waits (`:66`, `:311-319`).
   - a walk reads up to 100 pages. It stops on `end`, `total-reached`,
     `page-stuck`, `cursor-repeated`, `http-error`, `bad-page` or `limit`
     (`:24-31`, `:176-261`).
   - a failed or shorter walk never replaces a whole or longer list. It backs
     off 30 s, 60 s, 2 min, 5 min, 10 min (`:70-71`, `:280-286`).
   - the newest list is saved in `<data>/connector-catalog.json`, mode
     `0600`, keyed by a SHA-256 of the backend, "without holding its
     credential" (`:83-105`, `:146-150`). After a restart the page answers
     from the file. A file that cannot be read only gives a warning, and the
     next good walk writes it (`:119-144`).
   - up to 4 backends are held in memory (`:67`).
3. `GET /api/connectors/catalog` answers `{configured, mode, setup, source,
   cards, pagination}`. `setup` is `"ready"`, `"needs-setup"` or
   `"service-unavailable"`. Only a host that comes with the managed service
   calls a missing service an outage (`server/routes/connectors-listing.ts:18-29`,
   `server/composio.ts:164-173`).
4. A changed catalog is broadcast as `{kind: "apps-catalog"}` to admins only
   (`server/index.ts:12044`).

### 3.12 One person's apps on two machines, and a team

1. **Desktop and own Cloud** (`server/composio-share.ts`):
   - managed: the desktop asks the broker for a one-time code
     (`POST /v1/installation/share {for: <installationId>}`). The Cloud
     redeems it (`POST /v1/installation/adopt {code}`) and then acts as the
     same Composio user. A Cloud that has its own active accounts gets 409
     `has_connections` and keeps them (`:88-104`,
     `cloudflare/composio-broker/README.md:50-51`, `:58-68`).
   - project key: the desktop sends `{apiKey, userId}` to the Cloud, which
     saves them (`server/cloud-connections.ts:226-229`,
     `server/composio-share.ts:108-121`). The key leaves the computer by
     design, only toward the person's own Cloud.
   - two servers reach the same apps exactly when their `account` digest is
     equal. The raw user id is never sent (`server/composio-share.ts:13-28`,
     `:79-84`).
2. **A Team Cloud** (`server/team-connections.ts`):
   - each app has a scope: `team` (default, one connection for all) or
     `person` (each member connects their own, used only in their own
     private chats). The file is `team-connection-scopes.json` (`:1-3`,
     `:27`, `:35-39`).
   - a member's own installation and token are in
     `people-connections/apps.json`, folder `0700`, file `0600`, no backup
     (`:9`, `:81-85`, `:157-167`). With a team project key, each member is a
     Composio user `omb_member_<32 hex>` from the team id and a hash of the
     person (`:119-124`).
   - a tool call goes to the member's account by the tool prefix, longest
     match first (`GMAIL_SEND_EMAIL` → `gmail`) (`:68-75`).
   - the member routes `/api/team/my-connections…` act only on the session's
     own person and never answer with a key, a token or an address path
     (`server/routes/team-connections.ts:11`, `:73-133`).
   - registration is single-flight for each person, so two clicks do not
     make two installations (`server/team-connections.ts:276-293`).
3. **Erase an installation:** `DELETE {broker}/v1/installation`, up to 40
   calls of 120 s. 202 means "call again". 200 or 401 means erased. Any other
   error keeps the token so that the call can run again
   (`server/composio-broker-access.ts:64-90`).

### 3.13 Who may do what

- `/api/connectors*` needs the admin scope. A path that no client rule names
  needs admin by default (`server/request-auth.ts:312-313`, `:533-540`).
- A member (client scope) may reach only the card routes `status`, `resume`,
  `dismiss` and `authorize` (`:412-415`). The authorize route then refuses an
  app to a member (section 3.6).
- A member who can edit a bot may change `composio`, `connectorTools` and
  `connectorScopes` (`server/request-auth.ts:580-585`).
- A wider `connectorScopes` counts as "loosened". From a bare loopback caller
  (not the desktop, no browser origin) it is refused with 409 while any bot
  is busy (`server/routes/bot-patch.ts:621-657`). A wider `connectorTools` or
  `composio: true` does not count as loosened (`:621-648`).

## 4. The data

### 4.1 The bot record (`<data>/bots.json`)

| Field | Type | Meaning |
|---|---|---|
| `composio` | `boolean?` | `false` turns all connected apps, and the Email app, off for this bot. Absent means on |
| `connectorTools` | `Record<slug, {tools: "*" \| string[]}>?` | Exact tool grants. Absent: every tool of every app (legacy). `{}`: no tools. An app that is not in the record: no tools of that app (`src/lib/connector-grants.ts:51-61`) |
| `connectorScopes` | `{apps: Record<slug, "read" \| "write">, accounts?: Record<slug, string[]>}?` | Absent: every app, read and write. Present: an app that is not in `apps` is off. `accounts[slug]` is the list of allowed account ids. An app with no entry allows every account (`packages/phone-protocol/src/connector-scopes.ts:1-4`, `:15-22`) |
| `outbound` | `{policy: "ask" \| "allow"}?` | "Sending on your behalf". Absent: "allow" at Full access, "ask" below (`packages/phone-protocol/src/outbound.ts:8-11`, `:117-120`) |

Patterns (`packages/phone-protocol/src/wire.ts:249-256`,
`packages/phone-protocol/src/connector-scopes.ts:24-25`):

- grant slug: `^(?!__proto__$)[a-z0-9_][a-z0-9_-]{0,80}$`.
- scope slug: the same, but at most 64 characters.
- tool name: `^(?:[A-Z][A-Z0-9_]{0,127}|_[A-Z0-9][A-Z0-9_]{0,126})$`.
- account id in a scope: `^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$`.

Limits: 64 apps, 500 tools for each app (`server/connector-tools.ts:4-5`).

At load, each bot runs three migrations, and a change saves `bots.json`
again: `dropRetiredApps` (today only `highlevel`), `grantScopedApps` and
`trimOutboundPolicy` (`server/store.ts:318`, `server/retired-apps.ts:10-25`).

### 4.2 The settings and the secret stores

| Place | Content | Mode |
|---|---|---|
| `config.json` → `composio` | `{apiKey?, userId?, sessionId?}`. On the desktop `apiKey` is `""` (`server/config.ts:344-345`, `server/routes/config.ts:574-595`) | `0600`, backed up before each write. Never saved over an unreadable or invalid file (`server/config.ts:883-885`, `:989-990`) |
| Desktop `credentials.bin` | `composioApiKey`, `composioBrokerToken`, `composioInstallationId`, encrypted with `safeStorage` (`electron/main.mjs:364`, `:385-398`) | OS keychain key. A reset renames it to `.unreadable-<ms>` |
| `<data>/connected-apps-installation.json` | `{version: 1, brokerUrl, installationId, token}` of a Cloud home (`server/cloud-connected-apps.ts:26-32`) | `0600`, no backup |
| `<data>/composio-auth-configs.json` | `{version: 1, projects: {<sha256 of key>: {<toolkit>: "ac_…"}}}` (`server/composio-project.ts:224-230`) | `0600`, folder `0700` |
| `<data>/connector-catalog.json` | `{version: 1, key: <sha256 of backend>, at, cards, pagination}` (`server/composio-catalog.ts:83-105`) | `0600` |
| `<data>/team-connection-scopes.json` | `{v: 1, apps: {slug: "person"}, mcp: {name: "person"}}` (`server/team-connections.ts:35-39`) | backed up, no secret |
| `<data>/people-connections/apps.json` | `{v: 1, brokerUrl, people: {<person>: {email, installationId, token}}}` (`:81-85`) | `0600`, folder `0700`, no backup |
| `<data>/people-connections/project-apps.json` | `{v: 1, keyMark, people: {<person>: {email, userId, sessionId?, again?}}, removals}`. `keyMark` is 16 hex of a SHA-256 of the key (`:93-100`, `:117`) | no secret |
| Client `localStorage` `omb-connected-apps` | `{at, services}` with only `connected`, `pending`, `status` and `accounts[{id, alias, status}]` (`src/lib/connected-apps-cache.ts:1-81`) | for the view only |

Environment variables: `COMPOSIO_API_KEY`, `OMB_COMPOSIO_API` (the API base,
default `https://backend.composio.dev/api/v3.1`), `OMB_COMPOSIO_TOOLKITS_API`,
`OMB_COMPOSIO_BROKER_URL`, `OMB_COMPOSIO_BROKER_TOKEN`,
`OMB_COMPOSIO_BROKER`, `OMB_CREDENTIAL_STORE`,
`OMB_CLOUD_CONNECTED_APPS_GRANT`, and the bridge variables of section 3.4.

### 4.3 In memory only

| What | Where | Lost at a restart |
|---|---|---|
| The service slugs (60 s, stale to 5 min) | `server/composio.ts:600-606` | yes |
| The shared inventory (20 s) | `server/composio-inventory-cache.ts:15-18` | yes |
| The last good `tools/list` of each backend | `server/connector-tools-list.ts:37` | yes |
| The auth config lists (60 s) | `server/composio-project.ts:145-147` | yes |
| The `mcp-session-id` of each backend (LRU 512) | `server/composio.ts:114-125` | yes |
| The held send cards (`OutboundRequestService`) | `server/outbound-requests.ts:22` | yes. A card that waits cannot settle after a restart |
| The pending sign-in links | `src/components/ConnectorCard.tsx:28`, `src/components/PluginsPanel.tsx:130` | yes, and also at a reload |
| The client inventory (30 s) | `src/lib/connected-apps.ts:13` | yes |

### 4.4 Wire types

- `ConnectorServiceState {connected, pending, status, accounts:
  [{id, alias?, status}]}` (`server/composio.ts:48-59`).
- The connector card: `message.kind = "connector"`, `message.connector =
  {slug, label, description, status: "required" | "authorizing" |
  "connected" | "failed", resumeKey, alias?, resumed?, stopped?, dismissed?,
  superseded?, error?, source?}` (`server/host/connector-cards.ts:76-82`,
  `src/components/ConnectorCard.tsx:23-37`).
- The card request answer: `{messageIds, authConfigNote?, connectedNote?,
  nothingToSignIn?}` or `{error}` (`server/host/connector-cards.ts:24`).
- The send card: `kind: "options"`, `card.title: "Send on your behalf?"`,
  `options: ["Allow", "Deny"]`, `outboundRequest: {tool, app, calls}`
  (`server/outbound-hold.ts:58-72`).
- The decision row: `decision: "auto-approved" | "auto-denied" |
  "card-shown"`, `source: "connector-scope" | "outbound"`, `rule`
  (`connectorTools.<app>`, `scope:<app>:<reason>`, `full-access`, `allow`)
  (`server/index.ts:14157-14250`, `server/outbound-hold.ts:73-76`, `:113`).

### 4.5 Routes

| Route | Use | Source |
|---|---|---|
| `GET /api/connectors/catalog` | the catalog | `server/routes/connectors-listing.ts:18-29` |
| `GET /api/connectors/connected` | the inventory | `:30-48` |
| `GET /api/connectors[?services=a,b]` | the status of some apps | `server/index.ts:14750-14762` |
| `GET /api/connectors/tools` | tools for the grant picker | `:14738-14749` |
| `GET /api/connectors/suggestions` | "Also useful" | `server/routes/app-suggestions.ts` |
| `POST /api/connectors/{slug}/authorize` `{alias?}` | start a sign-in | `:14763-14767` |
| `DELETE /api/connectors/{slug}/accounts/{id}` | remove one account | `:14768-14771` |
| `DELETE /api/connectors/{slug}` | remove the selected account | `:14768-14771` |
| `/api/bots/{bot}/connector-cards/{msg}/(authorize\|status\|resume\|dismiss)` | card actions | `:14773-14832` |
| `POST /api/internal/connectors/mcp` | the relay | `:14144-14314` |
| `POST /api/internal/connectors/request`, `/find` | card request, search | `:14326-14329` |
| `POST /api/cloud-connections/connected-apps` `{share, apps?}` or `{apiKey, userId, apps?}` | adopt on the own Cloud | `server/routes/cloud-connections.ts:76-108` |
| `PUT /api/team/connection-scopes` | team or person scope | `server/routes/team-connections.ts:52-71` |
| `GET/POST/DELETE /api/team/my-connections/apps/…` | a member's own apps | `:79-133` |

Broker routes that the local server calls: `POST /v1/installations`,
`GET /v1/me`, `GET /v1/catalog`, `GET /v1/connectors[/connected]`,
`POST /v1/connectors/{t}/authorize`, `DELETE /v1/connectors/{t}[/accounts/{id}]`,
`POST /v1/mcp`, `POST /v1/files/upload`, `POST /v1/installation/share`,
`POST /v1/installation/adopt`, `PUT /v1/installation/cloud`,
`DELETE /v1/installation`. The app event routes are in
[`automations.md`](automations.md).

## 5. The UI

### 5.1 The Apps page (`src/components/PluginsPanel.tsx`)

1. **Where.** The sidebar pill "Connect apps", or "Apps" when an app is
   connected, opens the page. It shows three logos: connected apps first,
   then Gmail, Slack and Notion (`src/components/SidebarConnectApps.tsx:16-27`,
   `:72`). A logo without a catalog image comes from a Google favicon address
   (`:53`).
2. **Filters:** Marketplace, Connected and MCP (`PluginsPanel.tsx:96`). 48
   tiles show before "show all" (`:98`).
3. **First paint** uses the 30 s memory copy, else the `localStorage` copy,
   else nothing (`:124-129`). "Loading" shows only when there is no copy.
4. **The tile** (`src/components/AppTile.tsx`). The main button reads
   Included, Checking…, Unavailable, Continue, Check status, Reconnect, Add
   account, Retry or Connect (`src/lib/connector-status.ts:45-59`). The line
   under the name:
   - "Finish setup in your browser" while a link is live.
   - "Finish setup in your browser, or disconnect the pending account below
     to start again" after the link expired.
   - "Signed out. Reconnect to keep using it.".
   - "Authorization expired. Try again." (`AppTile.tsx:89-99`).
   Each account has a row with its alias or id, its status, Reconnect and
   Disconnect (`:201-240`). "Bots with limited tools: {count}" links to the
   Access page of each bot (`:241-262`).
5. **Connect.** One app at a time. The tab opens in the click. The tile then
   shows `INITIATED` at once and polls (section 3.7). A blocked tab gives
   "Your browser blocked the connection page. Click Continue to open it."
   (`PluginsPanel.tsx:338-390`).
6. **Disconnect** asks first: "Disconnect {identity} from {service}? Only
   this {service} account will be revoked. Your other {service} accounts will
   stay connected." (`:53-59`, `:392-398`).
7. **Notices** (`:606-653`):
   - stale: "Showing what was connected last time. The credential store
     couldn't be opened just now, so these couldn't be re-checked. Your apps
     are still connected. Restarting {app} usually clears this." with "Reset
     saved keys" (`src/components/SavedKeysReset.tsx:10-33`).
   - not set up: "Connected apps are not set up yet. To connect Gmail, Slack
     and more, add a project key in Settings → AI → Other services, under
     Self-host connected apps.", with "Open settings".
   - the service is down: "Connected apps are temporarily unavailable. Retry
     after restarting the host, or configure the connection service there.".
   - curated list in self-hosted mode: "Showing featured apps. Update your
     connected apps key for the full catalog.".
   - a member without admin: "Only an admin of this installation can connect
     apps here." (`:199`).
8. **After a first connection**, the toast "Your bots can now use {app}."
   with "Change", and the modal "Which bots can use {app}?" with one switch
   for each bot and "Done" (section 3.10).

### 5.2 The connector card in a chat (`src/components/ConnectorCard.tsx`)

The card shows in a bot chat, in a group chat with the face of the bot that
asked, and in the inbox (`src/components/ChatView.tsx:670`,
`src/components/GroupView.tsx:250`, `src/components/inbox/InboxAnswer.tsx:59`).

| State | What it shows |
|---|---|
| `dismissed` or `superseded` | nothing (`:85`) |
| stopped, not connected | "{label} · Stopped" (`:149-156`) |
| `connected` | "{label} · Connected", then " · Continuing" when resumed. "Continue task" until resumed (`:158-175`) |
| `required` | title = label, the description, "Requested by your bot", "Connect securely", "Not now" (`:184-205`) |
| `authorizing` | a spinner, "Waiting for sign-in…", "Open again" |
| `failed` | the error and "Try again" |

- The hint under the button: "Sign in or enter the app key on the secure
  connection page, never in chat." (`:211`).
- When the server asks for a label, the card shows "This app already has an
  account. Add a label such as work or personal to connect another." or
  "Another account already uses that label. Choose a different one.", and an
  input of at most 64 characters (`:213-232`). The card finds these cases
  with a regular expression on the English error
  (`src/lib/connector-status.ts:37-43`).
- An invalid address gives "The connection service returned an invalid
  authorization link." (`:103-104`).
- "Open authorization page" shows while a link is live (`:234-243`).
- **"Also useful"** under the card offers two or three other apps. A tap
  connects through the Apps route, not the card route, and polls
  (`src/components/ConnectorAlsoUseful.tsx:15-63`).
- The MCP Sign in card uses the same component
  ([`custom-mcp-servers.md`](custom-mcp-servers.md) section 3.8). For an MCP
  card a 409 is a neutral line. For an app card it is a red alert
  (`src/components/ConnectorCard.refusal.test.ts:57-75`).

### 5.3 The Access page of a bot (`src/components/bot-settings/AccessSection.tsx`)

1. **"Connected apps"** card with the switch (`:694-745`). The text under it
   (`en.json:7364-7369`):
   - not set up: "Connect apps in App Settings before giving this bot
     access.".
   - wrong engine: "This bot's current model cannot use connected apps.".
   - tools limited: "Tool access is tailored per app. Expand an app below to
     edit its tools.".
   - no tools: "Every connected app is currently limited to no tools. Expand
     an app to grant tools.".
   - on: "Let this bot use your connected Gmail, Calendar, Slack, and other
     apps.".
   - off: "Keep your connected apps unavailable to this bot."
2. **"Limit this bot to specific apps"** with Off, Read and Read & write for
   each app, and "Accounts this bot may use" (section 3.10). It shows only
   when the inventory is ready, and not for a new bot (`:730-732`). An
   unreadable inventory is "unknown", not "nothing connected"
   (`src/components/bot-settings/useBotApps.ts:46-47`). The Email app shows
   as one more app, `email`.
3. **"Per-app tools"**: a row for each app with "All tools", "No tools",
   "Tools: {count}" or "Custom grant". Open it for "All tools", the verb
   chips, a search box and a checkbox for each tool. "All tools for every
   app" clears the record (`:318-432`).
4. **"Connect an app…"** closes the settings and opens the Apps page. An app
   connected there goes to that bot, also when its apps were off
   (`src/components/AppGrantPrompt.tsx:30-36`).

### 5.4 The member page on a Team Cloud (`src/components/MemberApps.tsx`)

A member who cannot save settings sees this page in place of the Apps page
(`src/App.tsx:524`). It lists only the apps with scope `person`: "Apps you
connect here are yours alone in {team}: only your own private chats use
them." One button for each app: Connect, Disconnect or Reconnect. The page
reads again on window focus, because the sign-in ends in another tab
(`:40-46`, `:105-109`).

### 5.5 The send rule (Permissions)

"Sending on your behalf": "Emails, messages, posts, invites, and payments
through connected apps. Reading and drafting don't count as sending. Full
access sends without asking unless you set a rule here." The two choices are
"Ask every time" ("Every send waits for your tap.") and "Send without asking"
("Sends go out without waiting for your tap.") (`src/locales/en.json:3585-3590`).
Simple mode hides the row (`src/components/bot-panel/AdvancedSettingsRow.tsx:9`).

## 6. The tests

| Behaviour that the reference guarantees | Test |
|---|---|
| A project key goes only to the project, never to the broker. Clearing it moves to the broker at once | `server/composio.test.ts:653-755` |
| An `mcp-session-id` never crosses from one backend to another | `server/composio.test.ts:584-651` |
| One stable Session for each installation, with multi-account mode and cap 10. A legacy Session is made again under the same Composio user | `server/composio.test.ts:762-810` |
| The account plan: label rules, replace of a non-active label, the `omb-retry-` alias, the cap of 10 | `server/composio.test.ts:1170-1415` |
| An old Session gets cap 10 in place, once. A failed PATCH does not stop the link | `server/composio.test.ts:1417-1469` |
| The auth config rules, the pick file (`0600`, no key, kept after a restart), Tool Router on, the managed mode refusal | `server/composio-auth-configs.test.ts:190-442` |
| Inventory: incomplete pages refuse opaque calls. A failed read is not kept | `server/composio-inventory.test.ts:37-152`, `server/composio.test.ts:991-1068` |
| The shared inventory: one read for 20 s, forgotten after a change | `server/composio-inventory-shared.test.ts:35-121` |
| The service slugs: 60 s, stale to 5 min, a turn waits at most 5 s | `server/composio-service-slugs.test.ts:51-156` |
| The catalog: stale-while-revalidate, the file, never a shorter list, backoff | `server/composio-catalog.test.ts:43-301` |
| Reuse of an earlier user, never on a shared server | `server/composio-reuse.test.ts:70-182` |
| Upload links only to Composio, S3 and R2 hosts | `server/composio-files.test.ts:17-80`, `shared/composio-storage.test.ts:9-71` |
| Erase: 202 calls again, 401 counts as erased, other errors keep the token | `server/composio-broker-access.test.ts:21-58` |
| The desktop broker registration. With an own key or the switch off, nothing goes to the broker | `electron/managed-composio.test.mjs:16-210` |
| A Cloud home: 401-only rotation, never an unsaved token, never a new installation over an unreadable file | `server/cloud-connected-apps.test.ts:88-415` |
| The bridge: numbers, the card request, the local `initialize`, the 3 s list budget, the four meta tools in an outage, no tools on a refusal, the grants filter, the named tools, the argument fitting | `server/connector-proxy.test.ts:52-891` |
| Scopes: the read verbs, the account limit, a batch refused whole, the widening rules | `shared/connector-scopes.test.ts:13-218` |
| The scope hint only on failed calls | `server/connector-scope-hint.test.ts:17-115` |
| End to end: a read-only Gmail hides `gmail.send_email`. A HighLevel write is refused. A file is uploaded and a hidden file is refused | `server/connected-app-tools.e2e.test.ts:49-192` |
| The listing routes and their answers | `server/routes/connectors-listing.test.ts:27-58` |
| The browser contract of the sign-in: the tab, the blocked tab, reuse of a link, Reconnect, the label | `scripts/verify-connected-apps.ts:105-242` |
| The card states and the alias input | `src/components/ConnectorCard.test.ts:22-83` |
| Grant helpers: seeding of other apps, unreadable records, verb classes | `src/lib/connector-grants.test.ts:12-146` |
| The app switch and its patch | `src/lib/bot-app-access.test.ts:6-84` |
| The account checkboxes keep a limit | `src/components/bot-settings/ConnectorScopesControl.dom.test.ts:30-44` |
| A first connection switches on a bot with an app limit that did not list it | `src/components/PluginsPanel.grants.test.ts:213-225` |

No test covers:

- the 401 rotation on the desktop (`electron/managed-composio.mjs:82-84`).
- the per-tool grant panel and its verb chips (`AccessSection.test.ts` has no
  "Per-app tools").
- the loss of other members' tokens after a bad `apps.json`
  (`server/team-connections.ts:161-163`, `:284-286`).

The verification notes name more tests that were not read:
`server/index.test.ts -t 'second-account cards|retries abandoned connector OAuth'`,
`server/trust-controls.e2e.test.ts`, `server/outbound-hold.test.ts`,
`server/gmail-draft-policy.test.ts`, `server/connector-app-tools.test.ts`
(`docs/verification/connected-apps-oauth.md:6-10`,
`docs/verification/gmail-drafts.md:14`).

## 7. Ours compared

Our crates have no code for this feature yet. `crates/bot-engine/src/lib.rs`
has one line, and `bot-protocol` has only the message, event and id types
(ours). Decision D12 chooses custom MCP servers, then Composio with the
person's own key, and no broker of ours. The plan of the custom servers is in
[`../../plan/custom-mcp-servers.md`](../../plan/custom-mcp-servers.md)
(P230 to P245).

| Part | Reference files | Ours: crate and module | Difference |
|---|---|---|---|
| Wire types: grants, scopes, the send rule, the card | `packages/phone-protocol/src/connector-scopes.ts`, `wire.ts:249-256`, `outbound.ts` | `bot-protocol`, a new module `connector` | Not built |
| The decision for one call | `server/connector-verdict.ts`, `connector-scopes.ts:94-110`, `server/outbound-hold.ts:31-37` | `bot-core`, a pure function | The reference splits it over three files and the relay route |
| The bot grants and the switch | `server/store.ts:318`, `:1486`, `server/routes/bot-patch.ts` | `bot-core`, the bot row (step 8) | Not built |
| The Composio client: Session, inventory, sign-in, catalog | `server/composio.ts`, `composio-session.ts`, `composio-project.ts`, `composio-catalog.ts` | `bot-engine`, a module `composio` | D12: project key only |
| The relay | `server/index.ts:14144-14314` | `bot-engine`, with the decision from `bot-core` | D12 says the engine gets the Composio endpoint. The reference never does that |
| The bridge | `server/connector-proxy.ts`, `connector-advertisement.ts`, `connector-app-tools.ts` | `bot-engine`, the same gate process as P231 | Not built |
| The secret store | `electron/main.mjs:385-433`, `electron/secure-credentials.mjs` | `bot-core` (P232), `bot-desktop` for the keychain | P232 already asks for a typed error and an encrypted store |
| The connector card | `server/host/connector-cards.ts`, `src/components/ConnectorCard.tsx` | `bot-core` (the stored card), `bot-desktop` | Not built |
| The Apps page and the Access page | `src/components/PluginsPanel.tsx`, `AccessSection.tsx`, `AppGrantPrompt.tsx` | `bot-desktop` | Not built |
| The managed broker, Cloud sharing, Team Cloud | `cloudflare/composio-broker/`, `server/composio-share.ts`, `server/team-connections.ts` | none | Out of scope (D10, D12) |
| The Email app (IMAP and SMTP) | `server/email/` | none | Not in the plan |

## 8. Where we can be better

Each point has a reason. The problems of `changelog.md` section 5 that the
reference has here come after the list.

1. **One grant model, not three layers.** The reference has `composio`,
   `connectorTools` and `connectorScopes`. It needs `grantScopedApps` to keep
   them in step at load and on each patch
   (`packages/phone-protocol/src/connector-scopes.ts:125-134`). We can have
   one type for each app: off, or on with a level (read or write), a tool set
   (all or names) and an account set (all or ids).
   - Why: fewer states and no migration. The compiler refuses an account
     limit for an app that is off, which the reference drops at run time
     (`:73-74`).
2. **A switch must not drop account limits.** `withBotApp` builds
   `{apps}` again and loses `accounts` (`src/lib/bot-app-access.ts:34-42`).
   The server replaces the whole field (`server/routes/bot-patch.ts:277`,
   `server/store.ts:1486`). So "Done" in "Which bots can use {app}?" or an
   automatic grant clears "Accounts this bot may use" for every app of that
   bot.
   - Why: a known loss of a limit ("an access right in the wrong place").
     With one typed model (point 1), a change of one app cannot touch
     another.
3. **A new connection does not widen a limited bot.** A first connection by
   an admin switches the app on for each bot whose `composio` is not
   `false`, also for a bot with an app limit that did not list it
   (`src/components/AppGrantPrompt.tsx:125-132`, test
   `src/components/PluginsPanel.grants.test.ts:213-225`). The limit says
   "Everything else is off for this bot." (`en.json:7393`).
   - Why: least privilege, and the text of the reference itself. The person
     can still grant from the modal.
4. **Widening is a privileged write for each grant field.** A wider
   `connectorTools` and `composio: true` do not count as "loosened"
   (`server/routes/bot-patch.ts:621-648`). Also, `patchBot` puts a grant in
   force in memory before the save, and does not roll back if the save fails
   (`server/store.ts:1485-1486`). Only a wider `toolScope` waits for the save
   (`:1497-1500`).
   - Why: our `AGENTS.md` rule (the row and its event in one transaction
     before anything acts), and P243.
5. **The account plan cleans up pending accounts.** A retry with no label
   adds an `omb-retry-` account and leaves the earlier pending ones
   (`shared/connector-account-link.ts:30-36`,
   `server/composio.test.ts:1297-1325`). They count toward the cap of 10
   only until Composio marks them `EXPIRED`, about 10 to 12 minutes
   (`src/components/ConnectorCard.tsx:18-19`). Then they stay as dead rows
   until the person disconnects each one (`src/components/AppTile.tsx:89-99`).
   - Why: "the same work done two times" (v0.1.54) is only half fixed. Each
     retry leaves one more account in Composio and one more row in the UI.
6. **Reconnect deletes after success, not before.** The Apps page deletes
   the old account and then starts the sign-in
   (`src/components/PluginsPanel.tsx:349-352`). If the start fails, the
   account is lost.
   - Why: "the same work … lost". The plan already has `replace`, so the
     server can delete the old account when the new one is `ACTIVE`.
7. **Each small state file follows the failed-read rule.**
   - `composio-auth-configs.json`: a failed read gives `{}`, and the next
     pick writes over the file (`server/composio-project.ts:232-241`,
     `:276-285`).
   - `team-connection-scopes.json`: the same (`server/team-connections.ts:46-51`,
     `:59-65`).
   - `people-connections/apps.json`: the same, and the next registration
     writes a file with only the new member. The tokens of the other
     members are lost (`:161-163`, `:280-286`).
   - `connected-apps-installation.json`: invalid JSON, or valid JSON of the
     wrong shape with version 1 or none, reads as "none"
     (`server/cloud-connected-apps.ts:75-80`).
   - Why: "a file written over after a failed read". The reference fixed
     `credentials.bin` and `config.json`, but not these. Our answer in
     `changelog.md` section 7 (a save takes a value that only a good load
     makes) covers them all.
8. **The send rule holds on every path.** "Ask every time" holds a Composio
   send at Full access (`server/outbound-hold.ts:31-37`). It does not hold an
   Email app send. At Full access `autoVerdict` approves before the outbound
   guard (`server/auto-approve.ts:112-114`), and only
   `server/outbound-hold.ts` reads `bot.outbound` (`:54`, `:111`).
   - Why: the UI promises "Every send waits for your tap." The section 7
     answer to "the approval model changed" (one pure function) closes this.
9. **Held sends survive a restart.** The "Send on your behalf?" requests are
   in a map in memory (`server/outbound-requests.ts:22`).
   - Why: "state lost at a restart". A stored row with its event lets the
     card settle or fail cleanly after a restart.
10. **A failed apps setup does not stop the turn.** A room turn does not
    start when `appsIntegrations` throws (`server/index.ts:9661-9674`). The
    bridge already has a good outage path: four meta tools and a note
    (`server/connector-discovery-fallback.ts:1-10`).
    - Why: "one slow or stuck part blocks the others". The turn can run
      without the bridge and say so one time, as P240 asks for MCP servers.
11. **Typed refusals in place of English text.** The UI finds the two label
    cases with a regular expression on the server's English error
    (`src/lib/connector-status.ts:37-43`).
    - Why: our rule of typed refusals. A translated or changed message breaks
      the card.
12. **The decision is one function, called two times.** The relay checks
    the call when it arrives and again in `beforeSend` (`server/index.ts:14175-14250`,
    `:14277-14300`). The code repeats the checks by hand.
    - Why: less code, and the two checks cannot drift.
13. **The account hint names only allowed accounts.** After a wrong-account
    refusal, the relay names the other active accounts of the app. Its list
    comes from all connected services of the installation, with no filter by
    the bot's account limit (`server/index.ts:14313`,
    `server/connector-account-hint.ts:53-95`). The hint also says "an alias
    or an id", but a bot with a limit is refused an alias
    (`packages/phone-protocol/src/connector-scopes.ts:106-107`).
    - Why: the hint tells a limited bot about accounts it may not use. This
      is against the rule of the reference itself: "Never lists what the bot
      could have called instead" (`server/connector-verdict.ts:166`). The
      model then retries with a value that the check refuses.
14. **Numbers without loss.** The bridge refuses an argument with a number
    above 2^53 (`server/connector-proxy.ts:397-425`). A Rust JSON value can
    keep the raw number text (`serde_json` with `arbitrary_precision`).
    - Why: one refusal less, and the model does not need to know about it.
15. **No third-party favicon look-up.** The sidebar loads app logos from a
    Google favicon address (`src/components/SidebarConnectApps.tsx:53`).
    - Why: the app names that a person uses go to a third party.
16. **Pending links survive a reload.** The links are in component state
    only (`src/components/ConnectorCard.tsx:28`). After a reload the person
    must start a new sign-in, and that can make one more pending account
    (point 5).
    - Why: "the same work done two times". The server can keep the link
      with its card, never in the transcript.

**Problems of `changelog.md` section 5 in this feature:**

| Problem | In the reference now | Point |
|---|---|---|
| A secret or an access right in the wrong place | Solved for the key: the bridge gets a loopback token only (`server/composio.ts:247`). "Connected apps are per bot" (v0.1.76): the switch is checked at mount, on each frame and before dispatch (`server/index.ts:7786`, `:14146-14150`, `:14279-14280`). "Bind MCP sessions to the current acting user" (v0.1.131): solved in the broker (`cloudflare/composio-broker/src/index.ts:315-322`) and on the server (`server/composio.ts:286-295`, `server/host/team-connections-host.ts:300-306`). Open: grants widened by an automatic grant, account limits dropped, a wider `connectorTools` not counted as loosened, an account hint that names accounts outside the limit | 2, 3, 4, 13 |
| The same work done two times, or lost | v0.1.54 is fixed for one label (`shared/connector-account-link.ts:29`). Open: pending accounts with other labels stay. Reconnect deletes first | 5, 6, 16 |
| State lost at a restart | The Session and the user ids are saved (`server/composio-session.ts:240`). The Cloud token is saved before use (`server/cloud-connected-apps.ts:176-177`). The v0.1.141 note "keep their saved keys when they restart" is probably about command MCP servers (section 9). Open: held sends | 9 |
| A file written over after a failed read | v0.1.151 is fixed for `credentials.bin` (`electron/secure-credentials.mjs:42-61`) and `config.json` (`server/config.ts:883-885`). Open: four other files | 7 |
| One slow or stuck part blocks the others | v0.1.177 is fixed: 1 s `initialize`, 3 s list, four meta tools (`server/connector-proxy.ts:38-42`). 5 s wait for the slugs (`server/composio.ts:603`). Open: a room turn fails when the apps setup throws | 10 |
| The approval model changed | No card at Full access (v0.1.111), then 25 a day (v0.1.141), then no cap (v0.1.144). Now: no card and no cap at Full access with no rule. "Ask every time" holds at every level on the Composio path (`server/outbound-hold.ts:31-37`). Open: the Email app path | 8 |
| The size of the tool list of one turn | The bridge reads its own share of the budget (`server/drivers/turn-mcp.ts:65-79`). The grants filter trims the list. The "three small tools" are the tool directory (`agent-tools.md:70`) | none new |
| A feature added, then removed or reversed | The two-key Connect flow became one project key (v0.1.22, commit `81a9e5432`), then the managed broker became the default. Grants by five verb classes were planned and superseded (`docs/superpowers/plans/2026-08-31-04-connector-scopes.md:3-9`). A read and write level was built later. A warning dialog for the first grant was removed, and its strings stay (`en.json:6898-6901`) | 1 |

## 9. Not verified

- Where the error of `appsIntegrations` in a direct turn goes. Line
  `server/index.ts:7786-7788` has no local catch, and the caller was not
  traced.
- That the v0.1.141 note "Connected apps keep their saved keys when they
  restart" is commit `57b4fb016` ("Restart a command MCP server without
  losing its saved keys"). The first tag that contains that commit is
  v0.1.141 (`git tag --contains`). The Email app, which keeps a password,
  also came in v0.1.141, so the note can be about either. No code of the
  connector service matches the note.
- How other engines than Claude mount the Email app and ask for its send.
  Only `server/drivers/claude.ts:1053` was read. Section 3.9 holds for any
  engine whose send reaches `autoVerdict` at Full access, because no other
  file reads `bot.outbound`.
- Whether the relay maps an alias to an account id before
  `connectorAccessDecision`. `outboundCallsIn` and `connectorCallsIn` read
  the `account` field (`packages/phone-protocol/src/outbound.ts:148-165`).
  No code that maps an alias was found.
- The bodies of `applyManagedBrokerMessage` and `setManagedBrokerAccess`,
  `prepareConnectionAuthConfigs`, `connectorCardText`,
  `maybeResumeConnectors`, `connectCardSettle` and the merge helpers of the
  Apps page.
- `server/testing/fake-catalog-service.ts`, `fake-connected-apps.ts`,
  `server/tool-count-limit.ts` and `server/tool-schema-profile.ts` were not
  read. The values of the tool-count cap and of the schema profiles are not
  known here.
- The broker itself, beyond the routes that the local server calls and
  `cloudflare/composio-broker/src/index.ts:107-110`, `:297`, `:312-322`,
  `:712-722`.
- The tests named only in the verification notes (section 6).
- Whether a stored `connectorTools` record moves to the person's own Cloud.
  `server/cloud-send-kinds.ts:244-257` does not carry it.
- The file mode of `bots.json`.
- The comment "1-50 item tools array" of `server/connector-verdict.ts:111`:
  no code checks 50.
- Whether the per-bot `toolScope` design
  (`docs/superpowers/specs/2026-09-30-per-bot-tool-scoping-design.md`)
  shipped as written. It is the border of the tool budget.
