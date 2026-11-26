# Plan: Hosted app connections

The proposals from the research file
[`../research/features/hosted-app-connections.md`](../research/features/hosted-app-connections.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 6, 10 and 16, a note to D12, and the gap of OAuth sign-in
  (P369, with P244).
- **State:** all open.
- **The main finding:** the posting service (a key) and the hosted app (an
  OAuth sign-in, no key) each become one ordinary custom MCP server. A post
  or a payment through such a server never meets the per-bot sending rule:
  Full access approves before the outbound check, and the "Send on your
  behalf?" hold has only two callers (`server/auto-approve.ts:112-114`,
  `server/index.ts:14257`, `server/meetings/routes.ts:101`). The name rule
  misses plural tool names such as `payouts_create`
  (`packages/phone-protocol/src/outbound.ts:14-40`).

## Proposals

- **P365 (decision, steps 10 and 16). Decide money and posts by more than
  the tool name.** A server, or a row of the hosted app table, can be marked
  as one that moves money. Then each tool of that server with no
  `readOnlyHint` is outbound. This belongs to the "one pure approval
  function" row of `changelog.md` section 7. See also P342.
  - Why: the name rule has singular words only. `payouts_create`,
    `transfers_create`, `payments_create` and `payments_void` are not
    outbound, so "Always allow" can be saved for them, against v0.1.176.
    The names come from a synthetic catalog.
  - Source: `packages/phone-protocol/src/outbound.ts:14-40`, `:94-105`;
    `server/provider-tool-allow.ts:39`; `server/turn-outcome.ts:107`;
    `server/testing/whop-like-catalog.ts:1-2`, `:104-108`, `:128`.
- **P366 (decision, step 10). One approval function for each MCP tool
  call.** The sending rule and Full access follow the same rule on the
  Composio path and on the custom MCP path. The same row of `changelog.md`
  section 7. Same rule as P341.
  - Why: Full access approves before the outbound check. The "Send on your
    behalf?" hold has two callers only, Composio and meetings.
  - Source: `server/auto-approve.ts:112-114`; `server/index.ts:14257`;
    `server/meetings/routes.ts:101`.
- **P367 (decision, step 16, extends P232). The token store never writes
  after a failed read.** This holds for all five methods that change it, and
  for the spent-refresh marks too.
  - Why: each read error reads as empty, and each changing method writes
    that empty object plus its change. A failed read during a refresh
    deletes each other sign-in.
  - Source: `server/mcp-oauth-store.ts:63-104`, `:107-114`;
    `server/mcp-oauth.ts:475`, `:482`.
- **P368 (plan, step 16, with P234). The key path of the posting service
  fits the first version of step 16 (headers only).** The key is stored
  apart from the entry and added as a header only when a turn starts, only
  for the saved address. The address rules apply.
  - Why: it needs only a header, so it fits the first version of step 16.
    The reference adds the key only for the server `postiz` at its saved
    address, and only when a turn starts.
  - Source: `server/postiz/connection.ts:17-37`, `:75-80`;
    `server/config.ts:1222-1224`; `server/postiz/service.ts:149-181`.
- **P369 (gap, with P244). The hosted app cards come after P244.** They
  need the OAuth sign-in. The flow: save off, sign in, test the tools, then
  turn on. Recognition is by the exact address. The sign-in contact cards
  wait in the same way (P345).
  - Why: they need the OAuth sign-in of P244.
  - Source: `src/lib/hosted-mcp-apps.ts:8-38`, `:117-150`;
    `src/components/McpServersPanel.tsx:341-414`.
- **P370 (plan, step 16). Disconnect is one core command.** It turns the
  server off, forgets the token, revokes it and removes the key, in one
  transaction. See also P347.
  - Why: the hosted app can stay signed in and off. The route of the
    posting service does not remove the key, so the window saves an empty
    key first.
  - Source: `src/components/McpServersPanel.tsx:472-475`;
    `server/postiz/service.ts:183-196`; `src/components/PostizCard.tsx:226`.
- **P371 (plan, step 16). A write of the server entry never stops in
  silence.** It gives a typed refusal.
  - Why: after a busy wait of 10 s, `write()` stops with no error, so a key
    save can succeed and the entry is never written.
  - Source: `server/postiz/service.ts:34-35`, `:70-75`.
- **P372 (plan, step 16). Keep the "key refused" mark across a restart,
  and tell the person that a restart ended a sign-in.** See also P346.
  - Why: "state lost at a restart". The mark is in memory. The window turns
    a 404 and a lost connection into the same text.
  - Source: `server/key-rejections.ts:6`; `server/mcp-oauth.ts:228-232`;
    `src/lib/mcp-sign-in.ts:84-86`.
- **P373 (decision, step 16 or later). A new connection does not reach all
  bots at once.** Same choice as P344.
  - Why: each bot with "every enabled MCP server" gets the payment tools at
    once, and the hosted app asks for admin access across businesses.
  - Source: `src/locales/en.json:30`, `:27`.
- **P374 (plan, step 6). Test the one redaction function with the JSON key
  shape and the token-store shape.**
  - Why: a `JSON.parse` error can quote part of a key in a log line. The
    diagnostics mask misses `"key"`, `"access"` and `"refresh"`.
  - Source: `electron/workspace-credentials.mjs:61`, `:70`;
    `electron/diagnostics.mjs:66-67`.
- **P375 (plan, step 16, extends P239). A key check goes only to an address
  that passed the address check.** An SSE endpoint must have the same origin
  as its server.
  - Why: the key check sends a key to a private address. The SSE transport
    sends the `Authorization` header to the address that the server names.
  - Source: `server/postiz/service.ts:120-125`;
    `server/mcp-http.ts:383-387`, `:421-425`.
- **P376 (decision, adds to D12). The cards of named services are data rows
  of one table.** We reach the posting service only through its public
  endpoints, because it is AGPL-3.0. If we include the logo of the hosted
  app (Apache-2.0), it needs a line in `NOTICE`. See also P345.
  - Why: our license rules in `AGENTS.md`.
  - Source: `docs/verification/postiz.md:7`;
    `src/assets/whop/README.md:1-6`; `src/lib/hosted-mcp-apps.ts:27-28`.
- **P377 (plan, step 16, tests). No test address switch in shipped code.**
  A test injects the address through the constructor.
  - Why: the environment variable `OMB_POSTIZ_CLOUD_URL` accepts each https
    host.
  - Source: `server/postiz/connection.ts:39-50`.

Already a proposal, not numbered again: never show the last four characters
of a key is P20 (`server/index.ts:11570`).
