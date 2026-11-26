# Plan: Connected apps

The proposals from the research file
[`../research/features/connected-apps.md`](../research/features/connected-apps.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 10 and 16, D12, and a gap for the Email app (P268).
- **State:** all open.
- **The main finding:** the engine never gets the Composio endpoint or the
  key. It starts a stdio bridge that holds only a loopback token for one
  turn. The bridge sends each frame to a relay route of the server, and the
  relay checks every call against the grants of the bot before it calls
  Composio (`server/composio.ts:247-248`, `server/index.ts:14144-14314`).

## Proposals

- **P256 (decision, amends D12). Where the key lives.** Option a: the engine
  gets a stdio bridge with a loopback token for one turn. The project key
  stays in our server. A relay route of our server runs every check, then
  calls Composio. Option b: D12 as written: a proxy that the engine starts
  holds the endpoint and the key. Goes with P231.
  - Why: option a follows the reference. The key never reaches a process
    that the engine starts, and the proxy only trims the tool list: "call-time
    enforcement stays the authority".
  - Source: `server/composio.ts:247-248`; `server/index.ts:14144-14314`;
    `server/connector-advertisement.ts:1-2`.
- **P257 (decision, step 16, extends P112). One function decides a connector
  call.** A pure function in `bot-core` reads the switch, the tool grants, the
  app level, the account limit, the sandbox and the send rule. It returns
  Allow, Ask or Deny with a typed refusal (App, Write, Account, NotGranted,
  Unrecognized). The relay calls it when the call arrives and again just
  before dispatch.
  - Why: better than the reference, which repeats the checks by hand in
    three files and the route.
  - Source: `server/connector-verdict.ts:140-197`;
    `packages/phone-protocol/src/connector-scopes.ts:94-110`;
    `server/outbound-hold.ts:31-37`; `server/index.ts:14175-14300`.
- **P258 (decision, step 16). One grant type for each app.** In place of
  `composio`, `connectorTools` and `connectorScopes`: Off, or On {level: Read
  or Write, tools: All or Names, accounts: All or Ids}. An absent record
  means the legacy "all".
  - Why: better than the reference. No `grantScopedApps` migration, and the
    compiler refuses an account limit for an app that is off.
  - Source: `packages/phone-protocol/src/connector-scopes.ts:73-74`,
    `:125-134`; `server/store.ts:318`, `:1486`;
    `src/lib/connector-grants.ts:51-94`.
- **P259 (plan, step 16, new facts for P243). Grant changes that widen.**
  (a) A wider `connectorTools` and `composio: true` also count as
  "loosened". (b) A widening is saved before it acts. (c) The app switch
  keeps the account limits. (d) A first connection does not switch on an
  app for a bot whose app limit leaves it out.
  - Why: better than the reference. Its switch rebuilds `connectorScopes` as
    `{apps}` and drops every account limit of the bot.
  - Source: `server/routes/bot-patch.ts:621-657`;
    `server/store.ts:1485-1486`, `:1497-1500`;
    `src/lib/bot-app-access.ts:34-42`;
    `src/components/AppGrantPrompt.tsx:125-132`;
    `src/components/PluginsPanel.grants.test.ts:213-225`.
- **P260 (plan, step 10 or 16, new facts for P112 and P140). The send rule
  holds on every path.** "Ask every time" also holds for a send that reaches
  the engine permission path.
  - Why: better than the reference. At Full access `autoVerdict` approves an
    Email app send before the outbound guard, and only `outbound-hold.ts`
    reads `bot.outbound`.
  - Source: `server/auto-approve.ts:112-114`; `server/outbound-hold.ts:54`,
    `:111`; `server/drivers/claude.ts:1053`.
- **P261 (plan, step 16). The account-link plan is a pure function.** It has
  typed refusals and a cap of 10 accounts for each app. A retry with no label
  removes the earlier pending accounts. Reconnect deletes the old account
  only after the new one is `ACTIVE`.
  - Why: follows the reference for the plan. Better for the cleanup and the
    order of Reconnect.
  - Source: `shared/connector-account-link.ts:20-37`;
    `server/composio-session.ts:41`; `server/composio.test.ts:1297-1325`;
    `src/components/PluginsPanel.tsx:349-352`;
    `src/components/AppTile.tsx:89-99`.
- **P262 (plan, step 16). The connector card is a stored row.** No second
  card for the same (thread, resumeKey, slug, alias). An aliased card
  completes only on that alias. The resume text is built from stored data.
  Only an admin connects an app. The pending sign-in link is kept with the
  card on the server, never in the transcript.
  - Why: follows the reference, and better for the link, which the reference
    keeps in component state only.
  - Source: `server/host/connector-cards.ts:27-88`;
    `server/index.ts:14773-14832`, `:1897-1898`, `:11344-11354`;
    `src/components/ConnectorCard.tsx:28`.
- **P263 (plan, step 16). Limits at the start of a turn.** Wait at most 5 s
  for the connected slugs. The bridge answers `initialize` itself (1 s),
  lists tools within 3 s with one retry, and lists the four meta tools in an
  outage. The relay serves the last good list of each backend. The view
  cache never gates a call.
  - Why: follows the reference.
  - Source: `server/composio.ts:235`, `:473-477`, `:555-606`;
    `server/connector-proxy.ts:38-42`, `:275-329`;
    `server/connector-discovery-fallback.ts:1-10`;
    `server/connector-tools-list.ts:1-97`;
    `server/composio-inventory-cache.ts:1-2`.
- **P264 (plan, step 16, extends P234). Split the Composio part.** Pull
  requests of 200 lines or fewer: the wire types and the grant type
  (`bot-protocol`); the decision function (`bot-core`); the Session client
  and the key; the inventory and the slugs; the relay; the bridge; the card;
  the Access page; the Apps page. Add to "Done when": "A bot calls one
  granted tool of a connected app. A tool that is not granted is refused and
  logged."
  - Why: follows the module split of the reference.
  - Source: `server/composio*.ts`; `server/connector-*.ts`;
    `server/index.ts:14157-14216`.
- **P265 (plan, step 16). The account hint names only allowed accounts.** It
  names the accounts that the bot may use, by id.
  - Why: better than the reference. It lists every account of the
    installation and says "alias or id", but a limited bot is refused an
    alias.
  - Source: `server/index.ts:14313`; `server/connector-account-hint.ts:53-95`;
    `packages/phone-protocol/src/connector-scopes.ts:106-107`;
    `server/connector-verdict.ts:166`.
- **P266 (plan, step 16, small). Keep large numbers in tool arguments.** Use
  `serde_json` with `arbitrary_precision` (MIT or Apache-2.0) in place of a
  refusal.
  - Why: better than the reference, which refuses the call.
  - Source: `server/connector-proxy.ts:397-425`.
- **P267 (plan, step 16, `bot-desktop`, small). No third-party logo
  look-up.** The Apps page does not ask a favicon service for a logo.
  - Why: better than the reference.
  - Source: `src/components/SidebarConnectApps.tsx:53`.
- **P268 (gap). The Email app.** IMAP and SMTP with a password, slug
  `email`. It uses the same grant records as the connected apps.
  - Why: no step has it.
  - Source: `server/email/host.ts:1-3`, `:52-70`;
    `server/email/service.ts:208-249`.

## New facts for proposals that exist

- **P232 (`custom-mcp-servers.md`, step 16).** The failed-read rule also
  covers `composio-auth-configs.json` and any token file: the reference reads
  a bad file as empty and writes over it. For the key store, follow the
  reference: "unavailable" is never "empty", writes are refused, and a reset
  renames the file aside (`server/composio-project.ts:232-241`, `:276-285`;
  `server/cloud-connected-apps.ts:75-80`;
  `electron/secure-credentials.mjs:1-61`; `electron/main.mjs:378-389`).
- **P240 (`custom-mcp-servers.md`, step 16).** A room turn does not start
  when the apps setup throws ("connected apps are unavailable — …"). Better:
  the turn runs without the bridge and says so one time
  (`server/index.ts:9661-9674`).
- **P44 (`chat-driver-tool-calls.md`, step 10).** Held "Send on your
  behalf?" requests are in a map in memory, so a waiting card cannot settle
  after a restart. Store them as rows (`server/outbound-requests.ts:22`;
  `server/outbound-hold.ts:13`).

## Corrections for our documents

- `docs/comparison.md:137`: "one project key, one Tool Router Session" is
  true only in self-hosted mode. The managed mode holds a broker token and
  no key (`server/composio-broker-access.ts:13-58`).
- `docs/comparison.md:138`: the proxy does not check the grant on each call.
  It only trims the tool list. The check is in the relay route
  (`server/index.ts:14175-14250`).
- `docs/research/reference-features.md:90`: a read or read-and-write level
  for each app is built and enforced
  (`packages/phone-protocol/src/connector-scopes.ts:1-4`, `:99-110`). The
  five verb classes are only UI chips that select tools
  (`src/lib/connector-grants.ts:3-22`).
