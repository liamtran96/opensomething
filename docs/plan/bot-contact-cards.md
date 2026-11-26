# Plan: Bot contact cards

The proposals from the research file
[`../research/features/bot-contact-cards.md`](../research/features/bot-contact-cards.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 10 and 16, and a note to D12.
- **State:** all open.
- **The main finding:** a contact card (AgentMail, AgentPhone, Vapi, Telnyx)
  is one row of one table, with no server code of its own. It makes a custom
  MCP server at a fixed address (`src/lib/hosted-mcp-apps.ts:15-17`,
  `:29-107`). A key card stores the key as a clear-text header in
  `config.json` and its backups (`server/config-backup.ts:13-16`,
  `server/vault/mcp-keys.ts:95`). At Full access, the bot's "Sending on your
  behalf" rule is never read, so a call or a number purchase goes out with
  no question (`server/auto-approve.ts:112-114`).

## Proposals

- **P341 (plan, step 10, extends P112). One send rule on every path.** The
  one decision function reads the bot's `outbound` rule for every tool, also
  on the engine permission path. At Full access with the rule `ask`, a send
  waits. A driver that cannot ask at Full access gets no outbound tools at
  that level, or runs them through our proxy. Same rule as P366.
  - Why: in the reference, the bot rule does not apply to contact-card
    tools. At Full access with `ask`, a call, a text or a number purchase
    goes out with no question (fails open). Below Full access with `allow`,
    a card still shows. The card texts promise that the rule applies.
  - Source: `server/auto-approve.ts:112-114`;
    `server/drivers/claude.ts:953-957`, `:1094`;
    `server/outbound-hold.ts:33-37`, `:54`, `:111`;
    `packages/phone-protocol/src/outbound.ts:2-3`, `:115-120`;
    `src/locales/en.json:43`, `:45`, `:47`, `:49`, `:3586`.
- **P342 (plan, step 16, extends P140). The tools of a hosted card fail
  closed.** Each hosted card row lists its known read tools. Every other
  tool of that server counts as outbound. See also P365.
  - Why: the reference decides "outbound" from words in the tool name. An unknown verb is not outbound, so the rule fails open. A
    tool that the service renames stops asking with no warning.
  - Source: `packages/phone-protocol/src/outbound.ts:14-47`, `:94-105`,
    `:43`; `shared/outbound.test.ts:29-38`, `:69-75`.
- **P343 (plan, step 16, extends P19 and P232). Test a card key before the
  save, and keep it in the keychain.** The probe takes the key in memory.
  The entry is saved only after a pass. The server entry holds only a
  reference to the key, so the settings file and its backups hold no key.
  - Why: the reference saves the key before the test, so a refused key
    stays in clear text. The key is a literal header value in `config.json`
    and in 10 backups. Disconnect does not remove it from the backups. The
    desktop moves model keys to its encrypted store, but not MCP headers.
  - Source: `src/components/McpServersPanel.tsx:427-435`;
    `scripts/verify-bot-contact-cards.ts:69`;
    `server/config-backup.ts:13-16`;
    `electron/workspace-credentials.mjs:3-31`, `:40-53`;
    `server/vault/mcp-keys.ts:95`; `server/mcp-registry.ts:18-20`;
    `docs/custom-mcp-servers.md:600-601`.
- **P344 (plan, step 16, extends P243). A new hosted card reaches no bot
  until the person chooses.** When the person connects a card that spends
  money, it is not granted to the bots that use "every enabled server". The
  person picks the bots. Same choice as P373.
  - Why: in the reference, a bot with no `mcpServers` list gets every server
    that is on. So a Vapi or Telnyx key reaches each such bot with no other
    step.
  - Source: `src/components/McpServersPanel.tsx:586-591`;
    `src/locales/en.json:30`; `server/routes/bot-patch.ts:352-374`;
    `src/components/bot-settings/AccessSection.tsx:131-134` (cited in
    `custom-mcp-servers.md` section 3.6).
- **P345 (plan, step 16, and a note to D12, extends P234 and P244). Put the
  cards in the plan.** Key cards (Vapi, Telnyx) go in the first version of
  step 16, because they need only headers. Sign-in cards (AgentMail,
  AgentPhone) wait for OAuth (P244). D12 gets a note: hosted cards are table
  rows on the custom MCP path, with no server code of their own. See also
  P369 and P376.
  - Why: the commit that adds the cards changes no server file. D12 names two ways (custom MCP servers and Composio), and
    the cards are a third kind on the first way.
  - Source: `src/lib/hosted-mcp-apps.ts:29-107`, `:15-17`, `:27-28`;
    `git show --stat 9d2549a8d`; ours: `docs/decisions.md:272-300`.
- **P346 (plan, step 16). "Connected" means that the last test passed.**
  Store the time and the result of the last test. Show "key refused" after
  a 401 at a call. See also P372.
  - Why: the reference reads only the header name `Authorization`, so a
    wrong or revoked key still shows "Connected".
  - Source: `src/lib/hosted-mcp-apps.ts:140-150`, `:145`.
- **P347 (plan, step 16). Disconnect deletes only a server that the card
  made.** Mark a card's server when the card makes it. Disconnect does not
  delete a server that the person added by hand at the same address. See
  also P370.
  - Why: the reference matches by address and deletes with no confirm.
  - Source: `src/components/McpServersPanel.tsx:395`, `:468-470`, `:487`,
    `:548`.
- **P348 (plan, step 16). A key card never asks for a sign-in.** The key
  test knows the kind of the card. The list view shows no sign-in button for
  a key server.
  - Why: in the reference, a 401 with OAuth metadata reads as "needs
    sign-in" before "keys refused". The list view shows "Connect Vapi" as a
    browser sign-in for a key server.
  - Source: `server/mcp-probe.ts:144-149`, `:213-218`;
    `src/components/McpServersPanel.tsx:713-714`, `:744-748`;
    `server/host/mcp-chat.ts:132-136`.
- **P349 (plan, step 16, extends P242). Mask the bare key too.** Mask both
  `Bearer <key>` and `<key>` in tool text and errors.
  - Why: the reference masks only the whole header value.
  - Source: `server/mcp-probe.ts:77-100`, `:208`.
- **P350 (plan, step 16). One copy of the card addresses.** The scripts and
  the tests read the card table.
  - Why: the reference has three copies of the addresses, which can drift.
    A moved address leaves an old server that is no longer a card.
  - Source: `src/lib/hosted-mcp-apps.ts:53-82`, `:117-128`;
    `scripts/verify-bot-contact-cards.ts:10`; `scripts/verify-whop.ts:10-11`.
