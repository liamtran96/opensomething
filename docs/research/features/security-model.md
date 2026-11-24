# The security model of the reference project

The feature row in [`../reference-features.md`](../reference-features.md):
`SECURITY.md`, `LICENSING.md`: loopback binding, the routes that a service can
call, the credentials file, pointers to Vault values, the meaning of full
access, sign-in to a hosted workspace fails closed. Part 11 of
[`../README.md`](../README.md). For steps 6 and 9 of
[`../../plan/README.md`](../../plan/README.md). This file is the input for
`docs/threat-model.md`, which the plan requires before step 9.

Read on 2026-11-24 at commit `ed8cb7278` by six subagents, one for each group
of files. The main session checked the key claims of each group against the
code (section 9 lists the checks). All paths are in the reference project
unless a path starts with `crates/` or `docs/`. Nobody opened its
`enterprise/` directory. No real key and no personal data is in this file.

**What this file adds to earlier research.**
[`write-only-secrets.md`](write-only-secrets.md) covers the `configured`
flags, the desktop store and the start of the Vault path (its sections 3.8 and
3.9). [`file-modes-atomic-writes-redaction.md`](file-modes-atomic-writes-redaction.md)
covers file modes, atomic writes and redaction. This file does not repeat
them. It adds:

- the request gate: loopback trust, the service routes, the desktop
  capability, the per-turn capabilities,
- sessions, pairing, terminal sign-in and the tailnet listener,
- hosted sign-in that fails closed, and the edition seam,
- the Vault key, the Vault grants and what an unreadable Vault does,
- Full access, the permission broker and the safety floor,
- the UI of all these parts,
- the changes since the earlier research files read the reference (section 3.10).

## 1. In short

The reference project is a server that runs AI engines (CLIs such as Claude
Code and Codex) as the person who installed it. The engines run real
commands with the rights of that person. So the security model must answer
three questions:

1. **Who may call the server?** The server listens only on this computer. A
   caller from this computer is trusted as the owner, or only as a
   "service", by a setting. A browser, a phone or another computer must sign
   in first.
2. **Where are the secrets?** Some keys are in an encrypted store of the
   operating system. Some are in plain text in `config.json`. Secrets that a
   bot asked for are in an encrypted file (the Vault). `config.json` then
   holds only a pointer to the Vault item.
3. **What may a bot do without asking?** A new bot starts at "Full access".
   At that level the server approves each permission request of the engine
   without a card. It never answers a question for the person.

The special terms, each one time:

- **Loopback.** The network address of this computer itself (`127.0.0.1`,
  `::1`). A request on loopback comes from a program on the same computer.
- **Loopback trust.** How much the server trusts a loopback request with no
  session. `owner` means it can do everything. `service` means it can use
  only a short list of routes.
- **Service route.** A route in the list `SERVICE_ALLOW`
  (`server/request-auth.ts:40-58`). A loopback caller under `service` trust
  can call only these.
- **Bot shell.** The shell commands that an engine runs for a bot. They run
  on the same computer, so their requests are loopback requests.
- **Session.** A sign-in of one device or browser. The server keeps only the
  hash of its token.
- **Pairing.** A one-time code or link that a signed-in owner makes. Another
  device uses it to get a session.
- **Desktop capability.** A random token that the desktop app makes at each
  start. It proves that a request comes from the desktop window.
- **Per-turn capability.** A token that the server gives to the tools of one
  turn of one bot. It stops working when the turn ends.
- **Hosted workspace.** A server that a company runs for many people, with a
  sign-in portal. The code that connects the portal is in the closed
  `enterprise/` directory.
- **Fails closed.** When a part is missing or broken, the server refuses
  access. It does not fall back to a weaker rule.
- **Edition.** `oss` (the open-source build) or `enterprise` (the closed
  layer is present and licensed).
- **`credentials.bin`.** The file of the desktop app with the provider keys,
  encrypted by the operating system (Electron `safeStorage`).
- **Vault.** Two files encrypted with AES-256-GCM, for saved logins and
  secrets. A **`vault:<id>` pointer** in `config.json` names one item in it.
- **Approval level.** How a bot asks before it acts: Ask, Edits, Auto, Full
  or Custom.
- **Full access.** The highest level. The engine runs in its own no-ask mode,
  and the server approves what is left.
- **Permission broker.** A local socket. The engine sends its permission
  requests to the server through it.
- **Card.** A box in the chat that asks the person to approve, answer or type
  a secret.
- **Safety floor.** An optional list of shell commands (for example "delete
  the home folder") that the server never approves automatically.

## 2. Files read completely

The subagent of each group read each of these files from the first line to
the last. The line counts come from `wc -l`.

| Group | File | Lines |
|---|---|---|
| 1 Written rules | `SECURITY.md` | 54 |
| | `LICENSING.md` | 49 |
| | `apps/docs/content/docs/security/index.mdx` | 29 |
| | `apps/docs/content/docs/security/permissions-and-secrets.mdx` | 311 |
| | `apps/docs/content/docs/security/meta.json` | 5 |
| | `server/hosted-contract.ts` | 15 |
| | `docs/verification/shared-workspace-trust.md` | 133 |
| | `docs/verification/hosted-workspaces.md` | 148 |
| | `docs/verification/full-access.md` | 71 |
| 2 Request gate | `server/request-auth.ts` | 752 |
| | `server/request-auth.test.ts` | 952 |
| | `server/request-auth.e2e.test.ts` | 75 |
| | `server/lan-address.ts` | 66 |
| | `server/harness-capabilities.ts` | 60 |
| | `server/harness-mcp-token.ts` | 4 |
| | `electron/desktop-server-auth.cjs` | 16 |
| | `electron/server-session.mjs` | 72 |
| 3 Sessions | `server/sessions.ts` | 817 |
| | `server/sessions.test.ts` | 838 |
| | `server/pairing-base.ts` | 32 |
| | `server/routes/cli-login.ts` | 189 |
| | `server/routes/cli-login.test.ts` | 89 |
| | `server/cli-login.e2e.test.ts` | 94 |
| | `shared/cli-login.ts` | 16 |
| | `server/headless/login.ts` | 204 |
| | `server/headless/saved-servers.ts` | 191 |
| | `server/hosted-access.test.ts` | 438 |
| | `server/hosted-desktop.e2e.test.ts` | 245 |
| | `server/tailnet-listener.ts` | 226 |
| | `server/tailnet-listener.test.ts` | 150 |
| | `server/enterprise.ts` (the seam file, not the `enterprise/` directory) | 228 |
| 4 Vault | `server/vault-store.ts` | 667 |
| | `server/vault-store.test.ts` | 477 |
| | `server/secret-vault.ts` | 294 |
| | `server/secret-vault.test.ts` | 188 |
| | `server/routes/vault.ts` | 106 |
| | `server/routes/vault.test.ts` | 190 |
| | `server/host/vault-readers.ts` | 27 |
| | `server/vault/choices.ts`, `choices.test.ts` | 66, 57 |
| | `server/vault/mcp-keys.ts`, `mcp-keys.test.ts` | 146, 118 |
| | `server/vault/providers.ts`, `value-limits.ts` | 87, 8 |
| | `server/credential-env.ts` | 106 |
| | `server/session-credentials.e2e.test.ts` | 202 |
| | `server/host/secret-cards.ts` | 692 |
| | `server/routes/secret-cards.ts` | 179 |
| 5 Full access | `server/auto-approve.ts`, `auto-approve.test.ts` | 165, 221 |
| | `server/approval-mode.test.ts` | 194 |
| | `packages/phone-protocol/src/approval-mode.ts` | 112 |
| | `shared/approval-mode.ts` (one re-export) | 1 |
| | `server/permission-proxy.ts`, `permission-proxy.test.ts` | 263, 445 |
| | `server/safety-floor.ts`, `safety-floor-gate.ts` | 724, 177 |
| | `server/full-access-default.e2e.test.ts` | 112 |
| | `server/full-access-workflows.e2e.test.ts` | 308 |
| | `server/credential-request.test.ts` | 115 |
| | `server/secret-requests.e2e.test.ts` | 214 |
| | `server/hosted-slack.ts` | 14 |
| 6 UI | `src/lib/vault.ts`, `vault.test.ts` | 78, 23 |
| | `src/components/VaultSettings.tsx`, `VaultSettings.test.ts` | 467, 463 |
| | `src/components/VaultChoices.tsx`, `VaultChoices.test.ts` | 61, 63 |
| | `src/components/VaultSecretForms.tsx` | 122 |
| | `src/components/SecretRequestCard.tsx`, `SecretRequestCard.test.ts` | 311, 427 |
| | `src/lib/approval-mode-options.ts` | 83 |
| | `src/components/ApprovalModeSelector.tsx`, `ApprovalModeSelector.test.ts` | 202, 131 |
| | `src/components/bot-settings/PermissionsSection.tsx` | 200 |
| | `src/components/TeamSettingsDialog.tsx` | 244 |
| | `src/components/CliLoginCard.tsx`, `CliLoginCard.dom.test.ts` | 84, 76 |
| | `src/components/PairedPhones.tsx` | 187 |
| | `src/main.tsx` | 89 |
| | `src/pair/PairPage.tsx` | 299 |
| | `src/lib/session.ts` | 212 |

**Files read in ranges.** These files are too large, or only a part is
about this feature.

- `server/index.ts` (15,276 lines): 670-690, 735-790, 1030-1075,
  1430-1480, 1560-1830, 6380-6620, 11585-11598, 11668-11676, 11885-11995,
  12280-12300, 12405-12830, 15060-15185, and the lines of searches.
- `server/drivers/claude.ts` (2,016 lines): 110-150, 395-640, 1215-1262,
  1960-1980, and lines 1093-1098, 1268-1269, 1297.
- `electron/main.mjs` (3,124 lines): 288-300, 340-420, 575-590, 780-900,
  1000-1015, 1060-1170 (this includes 1100-1165), 2700-2750, 2840-2855.
- `docs/self-hosting.md` (2,039 lines): 1-273, 295-460, 505-600, 789-1412,
  1542-1663, 1692-1761, 1902-1933, 2017-2030.
- `docs/approval-levels.md` (451 lines): 1-97, 135-152, 379-411.
- `docs/verification/guarded-messages.md` (164 lines): 20-80, 120-150.
- Other documents: `docs/cli-onboarding.md` 76-90, `docs/cloud-pro.md`
  968-995, `docs/mcp-server.md` 40-62, `docs/decision-model.md` 180-196,
  `docs/phone-relay-server.md` 198-222, `docs/design/self-hosted-design.md`
  38-52, `docs/bot-box.md` 28-42 and 126-136.
- The main session: `server/routes/config.ts` through the diff (`:142-145`,
  `:574-575`), `server/routes/internal-mcp.ts` 165-168,
  `server/drivers/acp/core.ts` 341-349 and `server/drivers/codex.ts` 220-240
  (search lines), `server/vault/mcp-keys.ts` 94-106.
- UI: `src/App.tsx` 355-375, `src/components/settings/pages/DevicesPage.dom.test.ts`
  120-140, 168-190, 230-245, and the `t()` lines of
  `src/components/LocalComputerAutoWarning.tsx`.
- Small ranges: `server/cli.ts` 250-262, 690-760, 880-892,
  `server/cli-reach.ts` 20-40, `server/engine-prestart.ts` 1-45,
  `server/procs.ts` 715-735, `server/routes/tasks.ts` 190-222,
  `server/routes/bot-messages.ts` 155-170, 270-345, 590-780,
  `server/routes/bots-create.ts` 130-142, `server/routes/bot-patch.ts`
  530-575, `server/routes/status.ts` 100-120, `server/browser-sites.ts`
  56-72, 144-183, `server/host/mcp-servers-host.ts` 85-160,
  `server/host/mcp-config.ts` 255-290, `server/drivers/codex-shared-home.ts`
  1-15, `electron/secure-credentials.mjs` 7-47,
  `electron/workspace-credentials.mjs` 75-82, `shared/vault.ts` 1-40,
  `server/data-format.ts` 1-30, `src/state/store.tsx` 1885-1990,
  `src/lib/team-bulk-settings.ts` 80-163, `src/lib/devices.ts` 60-100,
  186-196, 268-278, `src/components/settings/pages/DevicesPage.tsx`
  85-115, `src/components/devices/DeviceList.tsx` 10-45, `DESIGN.md` 37-66,
  256-276, 308-371, `src/locales/en.json` (only the keys that the UI
  uses).

## 3. How it works

### 3.1 The listener and loopback binding

1. The main server listens with `server.listen(PORT, listenHost(server))`
   (`server/index.ts:15142`). The log line always prints `127.0.0.1`, also
   when the host is `0.0.0.0` (`:15144`).
2. `listenHost` returns `127.0.0.1` unless `OMB_LAN` is exactly `"1"`
   (`server/lan-address.ts:53-54`).
3. With `OMB_LAN=1` it returns `0.0.0.0`. Each connection where one end is
   not a private address is destroyed at once (`:55-58`). IPv4 only.
4. `openmausbot serve --lan` sets `OMB_LAN` only when the computer has a
   private LAN address (`server/cli.ts:727-730`, `server/cli-reach.ts:27-29`).
5. Other listeners are never loopback:
   - a Unix socket for a tunnel (`OMB_TUNNEL_SOCKET`). Its requests have no
     peer address, so the gate treats them as "proxied" and a session is
     necessary (`server/index.ts:15162-15172`),
   - the tailnet listener (section 3.6),
   - the phone relay, which answers each stream "as a remote request"
     (`server/index.ts:15174`).
6. A LAN peer that sends `Host: 127.0.0.1` is still remote, because the gate
   also reads the TCP peer address (`server/request-auth.ts:201-207`, test
   `request-auth.test.ts:651-665`).

### 3.2 Loopback trust: owner or service

`loopbackTrust` (`server/request-auth.ts:88-111`) takes the first rule that
matches:

1. A Cloud home: `service`. `OMB_LOOPBACK_TRUST` is ignored, with a warning
   (`:91-93`).
2. The desktop app (`OMB_DESKTOP_PARENT=1`): `owner`. The variable is
   ignored, with a warning (`:94-96`).
3. `OMB_LOOPBACK_TRUST` is `owner` or `service`: that value. `owner` on a
   hosted workspace warns: "every bot's shell can change settings and approve
   cards as the owner" (`:97-105`).
4. Any other value that is not empty: `service`. This fails closed. The
   warning removes all characters outside `[\w.-]` and keeps 40 characters,
   so no new line reaches the log (`:106-108`).
5. Not set: `service` on a hosted workspace, `owner` on all other servers
   (`:109-110`).

A hosted workspace is a server where any `OMB_ADMIN_*` variable is set
(`server/enterprise.ts:71-73`).

**The CLI owner token (service trust only).**

1. `openmausbot serve` makes 32 random bytes (43 characters, base64url) only
   when its trust is `service` (`server/cli.ts:718-721`).
2. It writes the token to the stdin of the server, never to the environment,
   because each engine inherits the environment (`server/cli.ts:754-758`,
   comments `server/index.ts:753` and `server/cli.ts:717`).
3. The server reads at most 256 characters and accepts only
   `^[A-Za-z0-9_-]{43}$` (`server/index.ts:755-766`).
4. The token opens only `GET` and `POST /api/auth/pairing`
   (`server/request-auth.ts:730-735`).

**Browsers on this computer.** A request from a browser never gets loopback
trust, also for a read (`server/request-auth.ts:725`). The gate finds a
browser by a `Sec-Fetch-Site` or `Sec-Fetch-Dest` header, or by a WebSocket
upgrade with an `Origin` (`:140-144`). The one exception is a development
server run from source with owner trust and `OMB_DEV_TRUST_LOCAL_BROWSER=1`
(`:146-156`).

### 3.3 The request gate, for each request

`resolveRequestAuth` (`server/request-auth.ts:662-752`). The order is:

1. **Read the credential.** A bearer that starts with `omb_sess_`, then a
   stream ticket (only on `/api/events`), then the session cookie
   (`:668-682`). Other bearers are ignored here.
2. **Check the session**, in this order:
   1. A cookie on a request that is not same-origin: 403 (`:685`).
   2. A bearer for a session that only a browser cookie may use: 401
      (`:687`).
   3. A change by a cookie-only session without proof of the same origin:
      403 (`:688-691`).
   4. A `restricted` reason (link sessions, a Team Cloud move-in): 403
      (`:692-693`).
   5. A missing scope: 403. A route not in `CLIENT_ALLOW` needs `admin`.
      This is default deny (`:694-697`, `:310`).
   6. Renew the session, except for a stream ticket (`:699`).
3. **A credential that is not valid** gives 401. It never falls back to
   loopback (`:704-708`).
4. **The loopback test.** The request is not "proxied", the `Host` is a
   loopback name, and the `Origin` is absent or a loopback origin
   (`:710-711`). "Proxied" means one of these (`:183-213`):
   - the socket has no peer address (a Unix socket),
   - the peer address is not loopback,
   - one of eight forwarding headers is present (`X-Forwarded-For` and
     others).
5. **The loopback branch**, in this order (`:712-743`):
   1. The phone companion with its relay token: owner scopes, with the
      device id. Any wrong header: 403.
   2. A browser without the desktop header: 401 "this browser is not signed
      in".
   3. The desktop app, a change on a public route, and no desktop header:
      403.
   4. `service` trust: the CLI pairing exception, else 403 for each route
      that is not in `SERVICE_ALLOW`, else the `client` scope only.
   5. All others: `owner`, with the scopes `admin` and `client`.
6. **Not loopback:** 403, with a reason: proxied, a foreign `Host` or a
   foreign `Origin` (`:745-751`).

Some `GET` routes count as changes, because they give out a secret or
control: the desktop viewer, a webhook address, the local computer, a
browser stream (`mutatingPublicRoute`, `:630-653`).

**The desktop capability.**

1. Electron makes one desktop token and one companion token at each start
   (`electron/main.mjs:295-297`).
2. The server starts with an empty token, and an empty token matches
   nothing. So each change is refused until the token arrives
   (`server/index.ts:768-769`, test `request-auth.test.ts:905`).
3. Electron sends the token over the private port of the utility process,
   not over HTTP (`electron/main.mjs:1076-1086`, `server/index.ts:1440-1451`).
4. The window never holds the token. Chromium adds the header below
   JavaScript, only for `127.0.0.1` on the server port, on `http` and `ws`
   (`electron/server-session.mjs:34-49`). Other Electron sessions cannot
   reach the server port (`:45-48`).
5. While the desktop capability is in force, `service` trust is ignored
   (`server/request-auth.ts:613`, test `:790-793`).

### 3.4 The service routes

`SERVICE_ALLOW` has 17 rules (`server/request-auth.ts:40-58`):

| Method | Path | Note in the code |
|---|---|---|
| GET | `/api/health`, `/api/health/engines` | engines: a count for `deploy/update.sh` |
| GET | `/api/auth/session`, `/api/edition`, `/api/brand` | |
| GET | `/api/seats` | a number for the connector on the same server |
| GET | `/api/bots`, `/api/threads/:id/messages`, `/api/attachments/:name` | |
| POST | `/api/bots/:id/tasks` | open a thread |
| POST | `/api/bots/:id/messages/guarded` | the guarded send |
| GET | `/api/bots/:id/requests/:id` | |
| POST | `/api/bots/:id/requests/:id/interrupt` | |
| DELETE | `/api/bots/:id/queue/:id` | |
| POST | `/api/threads/:id/respond` | "decline only: see the handler" |
| all | `/api/internal/*` | the handler checks the capability |
| POST | `/api/testing/internal-capability` | "exists only with its private key" |

The method is upper-cased, and the query string is not part of the check
(`:60-63`). The test list `SERVICE_CALLS` holds "every call the deployed
cloud Slack worker makes" (`request-auth.test.ts:722-740`).

**The open risk, in the code** (`server/request-auth.ts:33-39`): a bot's
shell is a loopback caller too. So it can do all that the Slack worker does:

1. Post into any thread through the guarded route, also an existing
   Full-access thread. The handler checks only that the caller's
   `expectedApprovalMode` equals the level of the thread
   (`server/routes/bot-messages.ts:315-338`). The caller can read the level
   from `GET /api/bots`, which is a service route.
2. Open a new Full-access thread while the shared Full-access policy is on.
   `server/routes/tasks.ts:204-207` admits any loopback caller and does not
   exclude `service` trust.
3. Stop a request, delete a queued line and decline a card.

It cannot approve a card (`server/index.ts:1046-1051`) or reach an admin
route. The planned fix is "a relay token only the Slack worker holds"
(`server/request-auth.ts:38-39`, `SECURITY.md:24-27`).

**The documents do not agree on the list.** `docs/self-hosting.md:1077` and
`docs/verification/shared-workspace-trust.md:16-21` give two different lists,
and neither one equals the code. Use the code list above.

### 3.5 Per-turn capabilities

1. A record `InternalCapability` holds the bot, the thread, a generation
   (one turn), a depth, a kind (one of 10: agents, connectors, computer,
   browser, hooks, phone, data, email, device, lent) and counters
   (`server/index.ts:1574-1606`). The comment: "caller fields are
   assertions, never authority" (`:1573`).
2. The server mints a capability only for the active generation of the
   thread. Else it throws (`:1667-1670`).
3. The bearer is 48 hex characters. It stays the same for one thread and one
   kind across turns, so a warm engine keeps it. The exception is `perTurn`:
   an engine whose machine can stop between turns gets a new bearer at each
   turn (`:1667-1681`). The depth, the hand-off and
   skill authoring come from the record of the turn at each call
   (`:1649-1665`, `server/engine-prestart.ts:21-29`).
4. The check compares the full header in constant time. It deletes each
   record that is no longer active (`:1748-1759`). A record is active only
   while the active generation of the thread equals its generation, and the
   bindings of its computer still hold (`:1761-1784`).
5. The server revokes the records at a new turn, when the engine reports the
   end of the turn, when the thread ends and at shutdown (`:1695-1743`).
6. Before each side effect, the handler checks again that the turn is
   active. "Authorization at header time is not a lease" (`:12780-12795`).
7. The kind must match the route family. Query fields such as `botId` or
   `fromThreadId` that name another bot or thread give 403. This stops "a
   Full bot reusing its token to impersonate a peer" (`:12757-12784`).
8. Limits: 10 attached files, 3 room posts, 4 new bots, depth 1, and 30 days
   for an orphan record (`:1607-1611`, `:1768-1769`).

### 3.6 Sessions, pairing and terminal sign-in

**A session** (`server/sessions.ts`):

1. The token is `omb_sess_` plus 32 random bytes. The file keeps only its
   SHA-256, and the compare is in constant time (`:145`, `:153-157`, `:484`).
2. The file is `sessions.json` in the data folder, mode `0600` in a `0700`
   folder, written atomically (`server/index.ts:675`, `sessions.ts:262`,
   `:296-298`).
3. Before the server loads the file, it writes a marker `.open`. If the
   marker is already there (an unclean stop), the server drops the email,
   portal and account sessions, and keeps the paired devices (`:259-282`). If
   it cannot write the marker, it refuses to start the store (`:266-268`).
4. A session lasts 30 days (`OMB_SESSION_TTL_DAYS`). Renewal never passes
   180 days from creation (`OMB_SESSION_MAX_DAYS`). A session renews only
   when half its term or less is left (`:28-37`, `:690-704`).
5. The server revokes an email session when its membership no longer gives
   each scope, or when the check of the membership fails. This fails closed
   (`:641-671`).

**Pairing:**

1. An owner or an admin opens a code with `POST /api/auth/pairing`
   (`server/index.ts:12618-12650`). The code has 12 symbols (60 bits). A link
   credential is `omb_pair_` plus 32 bytes. Both are kept only as hashes
   (`sessions.ts:160-176`, `:380-381`).
2. A code lives 10 minutes by default, up to 24 hours on request, and works
   one time (`:25-26`, `:481`).
3. Five wrong codes in 5 minutes lock that source for 5 minutes (`:47`). A
   loopback source is never locked. Its fifth wrong code deletes all open
   codes (`:53-56`, `:449-455`).
4. The pair route needs a JSON body, so a form on another site cannot send
   it (`server/index.ts:12467-12470`).
5. A pairing link never uses a loopback address (`server/pairing-base.ts:21-32`).

**`openmausbot login`** (terminal sign-in, `server/routes/cli-login.ts`):

1. The terminal makes a secret and sends only its SHA-256
   (`server/headless/login.ts:79-81`).
2. `POST /api/auth/cli-login` needs no session and grants nothing. It refuses
   a web page (403), a hosted workspace (403) and a loopback caller under
   `service` trust (403). At most 5 requests wait, and 2 from one source
   (`cli-login.ts:89-120`).
3. The answer is an id and a matching code `ABCD-EFGH`, never a token.
4. The desktop window of an owner or an admin shows a card with the code.
   The person presses Allow only if the terminal shows the same code
   (`src/components/CliLoginCard.tsx`).
5. Allow opens a pairing and redeems it at once, so the rules of pairing
   apply (`cli-login.ts:152-169`).
6. The terminal polls with its secret. A wrong secret gets the same 404 as an
   unknown id. The session goes out one time, then the request is deleted
   (`:122-137`).
7. A request ends after 10 minutes. An allowed session that nobody collects
   in 2 minutes is revoked (`:15-17`, `:72-83`).
8. On a loopback server with owner trust, the terminal does not need the
   card: it opens and redeems a pairing itself (`login.ts:71-76`).

**Where the terminal keeps its session** (`server/headless/saved-servers.ts`):
on macOS in the Keychain, through `security -i` with the command on stdin,
so the token is not in the process list (`:50-51`, `:154`). Else in a `0600`
file in a `0700` folder (`:153-163`). The token goes only to the exact
origin where it was made (`:176-191`). `SECURITY.md:32-34` says that a bot
with Full access can read it, "like any of their files".

**The tailnet listener** (`server/tailnet-listener.ts`): it binds only to
Tailscale addresses, drops each peer outside the Tailscale range, and
answers 421 to a wrong `Host` (`:62-66`, `:104-113`, `:131`). Commit
`f4d0ecc05` made the address rule stricter (section 3.10). `apply()` does not
check its configuration itself (`:185-189`). Only `receive()` and `start()`
check it.

### 3.7 Hosted sign-in fails closed, and the edition seam

1. A partial hosted configuration still counts as hosted. It turns off the
   pairing and email sign-in, but it never becomes ready
   (`server/enterprise.ts:71-88`).
2. On a hosted workspace, `POST` to the pairing and email routes gives 403
   "Sign in through the workspace portal." (`server/index.ts:12429-12432`).
3. Without the closed access layer, the hosted routes, `/pair` and `/` give
   503 (`:12433-12437`). Each session request gets 503
   (`:12558-12563`).
4. `createWorkspaceAccess` "must refuse hosted access, never fall back to
   email or QR" (`server/enterprise.ts:107-111`).
5. The test "fails closed if a configured deployment loses its enterprise
   hook" shows 503 on all these routes, and shows that a loopback caller
   still gets `kind: "loopback"` (`server/hosted-access.test.ts:258-269`).
6. Where it does not fully close: a loopback caller keeps access with no
   portal. Under the default `service` trust it has only the service routes,
   with the open risk of section 3.4.
7. **The edition.** The default is `{edition: "oss", features: []}`
   (`server/enterprise.ts:52`). `loadEnterpriseLayer` never throws. Any
   failure gives `oss` with a notice (`:122-155`). It runs before the server
   takes requests (`server/index.ts:15071-15072`). `GET /api/edition`
   returns it (`server/routes/status.ts:110-114`). The open code asks only
   `entitled("admin")`: for hosted readiness, workspace access, shared Full
   access and the hosted Slack routes (`server/index.ts:748`, `:11945`,
   `:12421`).

### 3.8 Secrets: the credentials file and the Vault

The general path of a key is in [`write-only-secrets.md`](write-only-secrets.md)
sections 3.8 and 3.9. This section adds only the new facts.

**`credentials.bin`.**

1. The write refuses when the store could not be read at this start, so that
   it does not drop keys it did not read (`electron/main.mjs:386-389`).
2. The write refuses when `safeStorage.isAsyncEncryptionAvailable()` is
   false (`:390-392`). It does not check the Linux `basic_text` back end.
   The Cloud store and the organization store do check it (`:797`,
   `:881-886`). `docs/cli-onboarding.md:82` says that a Linux desktop with no
   secret store "gets only Electron's fixed-key obfuscation".
3. The keys go to the server as environment variables of the forked process.
   The argument list is empty (`electron/main.mjs:1111-1137`).
4. The server removes these names before it starts most engines
   (`server/credential-env.ts:57-60`). Three places remove only the
   control-plane names: `server/engine-standalone.ts:624`,
   `server/engine-updates.ts:211` and `server/drivers/chat-mcp-tools.ts:144`.

**The Vault.**

1. Files: `logins.json.enc` and `member-secrets.json.enc`
   (`server/vault-store.ts:18-22`).
2. The key is 32 random bytes in hex, in the file `logins-key`, mode `0600`,
   in the same data folder. It is plain text (`:206-217`). So each reader of
   the data folder can open the Vault. A bot shell runs as the same user.
3. The cipher is AES-256-GCM with the SHA-256 of the key, a random 12-byte
   nonce, and the format nonce, cipher text, tag (`server/browser-sites.ts:56-72`).
4. There is no lock and no unlock.
5. **An unreadable Vault is replaced.** A missing or wrong key, or data that
   does not parse, gives one warning and an empty Vault: "it will be replaced
   on the next save" (`server/vault-store.ts:228-233`). The next write
   replaces the file with no backup (`:255-266`).
6. **The grant is in the sealed file.** The right of an MCP server to read
   an item (`mcpKeys`) is in the encrypted file, not in `config.json`
   (`:83-85`). So a `vault:` pointer that a person or a program writes into
   `config.json` reads nothing (`server/vault/mcp-keys.ts:55`).
7. A bot that types a `vault:` value itself gets 400
   (`server/routes/internal-mcp.ts:166-167`).
8. Only MCP servers resolve `vault:` pointers, when the server starts the MCP
   server, tests it, calls it or builds a turn (`server/vault/mcp-keys.ts:94-106`).
   The environment of an engine is never resolved. A missing item or a
   refused bot turns that one MCP server off with a reason. The turn
   continues (`server/host/mcp-servers-host.ts:110-152`).
9. Limits: a stored value up to 65,536 bytes. A new value up to 64 KiB on
   data format 2, else 4,096 bytes (`server/vault/value-limits.ts:4-8`).
10. A card secret given as a file is plain text, `0600`, in
    `.openmausbot-secrets/`, and is deleted after 24 hours
    (`server/secret-vault.ts:111-149`).

**The person's own engine setup.** This is the changelog problem "The
person's own engine config reaches the bots".

- The Claude driver starts from the whole server environment, and sets
  `CLAUDE_CONFIG_DIR` only when the instance gives one
  (`server/drivers/claude.ts:119-121`). We did not check what the Claude
  CLI reads when the variable is not set. The release v0.1.104 says that the
  personal `CLAUDE.md` "no longer reaches bots that run isolated". This
  research did not check which bots run isolated.
- `OMB_CLAUDE_INHERIT_USER_CONFIG=1` loads the whole Claude Code setup of the
  person, with a warning (`server/drivers/claude.ts:139-150`).
- A Codex turn on the person's own sign-in links in their login,
  `config.toml`, skills, plugins and MCP sign-ins
  (`server/drivers/codex-shared-home.ts:1-5`).
- The ACP core copies all of `process.env` and deletes the keys that are not
  allowed (`server/drivers/acp/core.ts:341-349`).

### 3.9 Full access, the broker and the safety floor

**Defaults.**

1. A new bot or thread is at Full: `DEFAULT_APPROVAL_MODE = "full"`
   (`packages/phone-protocol/src/approval-mode.ts:75`). Commit `593fd1c5a`
   (2026-10-14) changed the default from Ask to Full, and removed the list of
   engines that could use Full.
2. A value that is not valid fails closed to Ask. The old `autoApprove` bit
   gives Auto, never Full (`:87-102`).
3. A hosted workspace starts at Ask (`server/index.ts:750`). It refuses Full
   at bot creation and in a bot change (`server/routes/bots-create.ts:138`,
   `server/routes/bot-patch.ts:549-552`).
4. A new task with Full needs a loopback caller and the shared Full-access
   policy, on each server (`server/routes/tasks.ts:201-207`). That policy needs
   `OMB_SHARED_WORKSPACE_FULL_ACCESS=1`, a full hosted configuration with
   portal membership, the access layer and the `admin` entitlement. The
   desktop app can never turn it on (`server/enterprise.ts:101-105`,
   `server/index.ts:747-748`).

**A permission request (Claude engine).**

1. The Claude CLI calls the MCP tool of `server/permission-proxy.ts`. The
   proxy sends `{t: "ask", id, tool, input}` on a local socket
   (`permission-proxy.ts:212`, `:224`).
2. If the broker is not there, the proxy denies with advice to the bot. It
   fails closed (`:30-37`, `:74-81`).
3. The broker accepts only `ask` messages. It denies a second ask with the
   same id. An ask after the turn gets a system reply and never becomes a
   card. A permission ask is denied after 15 minutes. A question has no time
   limit (`server/drivers/claude.ts:441-593`).
4. The server computes a verdict with `autoVerdict` and the safety floor
   (`server/index.ts:6466-6472`).
5. If the verdict approves, the floor can still deny. Then the server sends
   `allow`. The approval row is written only after the engine accepts
   (`:6505-6532`).
6. Else the server shows a card (`:6539-6585`).

**What Full approves** (`server/auto-approve.ts:94-123`):

1. A question (`AskUserQuestion`, `ask_user`) is never answered, at any
   level (`:63-65`, `:108-110`).
2. At Full, each other request is approved, also a request to widen the
   sandbox and an outbound tool such as "send email" (`:111-112`, test
   `auto-approve.test.ts:36-41`, `:62-68`).
3. A turn that a guest started is forced to Ask, and the saved grants of the
   owner do not apply to it (`server/index.ts:6446-6459`).
4. `request_credential` always opens a secret card for a value that the
   Vault does not have yet (`server/secret-requests.e2e.test.ts:161-168`).

**Full access conflicts with `SECURITY.md`.** `SECURITY.md:45-48` says that
Full access "must never answer questions or silently broaden product-level
confirmations such as credentials, routines, skills, or peer communication".
The tests show this behaviour:

- On a Full thread, profile changes, routines, skills and team setup apply
  with no card. Their rows say `auto-approved:full-access`
  (`server/full-access-workflows.e2e.test.ts:143-178`).
- On an Ask thread, the same actions also apply at once, as receipts with
  Undo (`:213-236`).
- The Full level of a Chief of Staff goes to the thread of a teammate that
  it gives work to (`:198-211`, `server/auto-approve.ts:42-61`).
- `docs/approval-levels.md:79` says that these actions "apply without a
  second approval", and that peer-review prompts are skipped.

Two comments in the code also disagree. `server/auto-approve.ts:111` says
that a bot change "consent-gates" the start of Full.
`server/routes/bot-patch.ts:539-540` says that Full "applies from any client
that can reach this API".

**The broker socket.**

1. On Unix it is `DATA_DIR/perm-<tag>.sock`. On Windows it is a named pipe
   in the global namespace (`server/procs.ts:729-735`).
2. After the bind, the server sets mode `0600`. If that fails, the bind
   fails (`server/drivers/claude.ts:529-542`). If no path binds, the broker
   throws (`:562-563`).
3. The broker does not check who connects: no token and no peer check. A
   Windows pipe gets no access list (`server/procs.ts:732`).
4. The bot box mounts the socket for reading and writing
   (`server/drivers/claude.ts:1297`). So a process of the same user can send
   asks. It cannot answer them, because answers come only from the server
   (`:571-577`).

**The safety floor** (`server/safety-floor.ts`, `server/safety-floor-gate.ts`):

1. It is off by default. `safetyFloor.enabled` or `OMB_SAFETY_FLOOR=1` turns
   it on (`safety-floor-gate.ts:14-17`).
2. It does nothing on Windows. It shows a warning one time (`:25-39`).
3. It acts only before an automatic approval, never on an answer of the
   person (`:1-2`).
4. It never sees a command when the engine runs in its own no-ask mode, for
   example Claude `bypassPermissions` or Codex `never` (`:3-4`). Claude and
   Codex use these modes at Full (`server/full-access-default.e2e.test.ts:73-78`).
5. The list: a recursive delete of the root, the home folder or a system
   folder, disk format, a write to a disk device, a fork bomb
   (`safety-floor.ts:5-32`).
6. A command that it cannot read to the end is never "clear". Then it asks
   with a card, or refuses where no card exists (`safety-floor.ts:3`,
   `:699`, `safety-floor-gate.ts:97-100`).

**Who may answer a card** (`server/index.ts:1046-1061`): a loopback caller
with `service` trust may only decline. On a shared workspace a session must
be an admin, the person who started the thread or the person who asked.

### 3.10 What changed since the earlier research files

Earlier files read commits `3aec210` and `d6660e2d7`. The diff to `ed8cb7278`
on the files that they cite:

1. `server/routes/config.ts`: a request from a paired phone can change only
   API keys (`:142-145`). A phone's key goes into `config.json` as plain
   text, not into `credentials.bin`, because only the desktop's own save puts
   it in the encrypted store (`:574-575`). This changes step 4 of section 3.8
   in `write-only-secrets.md`.
2. `electron/main.mjs`: the IPC handler `credential:set` is now
   `serveCredentialSaves`, with a saver for phone keys (`:2748`).
   `write-only-secrets.md` cites `:2734-2742` for this path.
3. `server/request-auth.ts`: commit `b9793be88` adds `fromPairedDevice`.
   Before it, the standalone companion sent a phone as the loopback owner,
   so the phone could change any setting.
4. `server/drivers/acp/core.ts`: the copy of the environment moved to
   `:341-349`. The behaviour is the same.

These cited files have no diff from either old commit: `shared/redact.ts`,
`server/credential-env.ts`, `server/secret-vault.ts`,
`server/host/secret-cards.ts`, `server/vault/mcp-keys.ts`,
`server/routes/internal-mcp.ts`, `server/auto-approve.ts`,
`server/safety-floor-gate.ts`, `SECURITY.md`, `electron/secure-credentials.mjs`
and `electron/workspace-credentials.mjs`. `server/drivers/codex.ts` changed,
but its environment code that changelog §7 cites (`:225-236`) still copies
the environment and removes names.

Other changes to security rules, found in the git history:

| Commit | Change | Kind |
|---|---|---|
| `593fd1c5a` (2026-10-14) | New bots start at Full, not Ask | reversal |
| `ec5693ceb` | Removes `OMB_SESSION_IDLE_DAYS`: no session ends because it was not used | removal |
| `d818c28aa` | A pairing code lives 10 minutes, not 5. A stricter lockout for pairing | looser and stricter |
| `c831e5d3f` | Pairing codes up to one day. Access tokens that do not renew | looser |
| `f4d0ecc05` | The tailnet listener binds only to Tailscale addresses | stricter |
| `f7aa43623` | An MCP key from a card goes into `config.json` as a `vault:` pointer, not the value | stricter |
| `3e27620b9` | `SECURITY.md` makes Full access an exception to "a broker bypass is a vulnerability" | rule change |
| `2e7f59ca8` (2026-09-23) | `SECURITY.md` names the Slack-worker gap | document |

## 4. The data

| Data | Where | Form | Evidence |
|---|---|---|---|
| Sessions | `<data>/sessions.json` | `{version: 1, sessions: [...]}`. Each session has `id`, `tokenHash` (64 hex), `label`, `scopes`, `createdAt`, `lastSeenAt`, `expiresAt`, and some optional fields | `server/sessions.ts:64-94` |
| Open pairings, stream tickets, lockout counters | memory | lost at a restart | `server/sessions.ts:240-244` |
| Terminal sign-in requests | memory | `{id, code, verifierHash, state, expiresAt, ...}` | `server/routes/cli-login.ts:70` |
| Terminal session | Keychain `openmausbot-cli`, or `~/.config/openmausbot/sessions/<name>` (`0600`) | the token | `server/headless/saved-servers.ts:35`, `:153-163` |
| Per-turn capabilities | memory | `InternalCapability` | `server/index.ts:1574-1606` |
| Desktop token | memory of Electron and of the server | 43 characters | `electron/main.mjs:295` |
| CLI owner token | memory, from stdin | 43 characters | `server/index.ts:755-766` |
| Provider keys (desktop) | `<userData>/credentials.bin` | encrypted by `safeStorage` | `electron/main.mjs:364`, `:385-397` |
| Provider keys (server, CLI, phone) | `config.json` | plain text, `0600` on Unix | `SECURITY.md:35-40`, `server/routes/config.ts:574-575` |
| Vault | `<data>/logins.json.enc`, `member-secrets.json.enc` | AES-256-GCM | `server/vault-store.ts:18-22`, `:70-94` |
| Vault key | `<data>/logins-key` | plain hex, `0600` | `server/vault-store.ts:206-217` |
| MCP key from a card | `config.json` `mcpServers.*.env`, `.headers`, `.oauth.clientSecret` | `vault:<uuid>` | `server/vault/mcp-keys.ts:11-12` |
| MCP grants | inside the Vault (`mcpKeys`) | item ids for each server | `server/vault-store.ts:83-85` |
| A secret reference | memory, one hour, one use | `secret-ref:<32 hex>` | `server/secret-vault.ts:20`, `:103-109` |
| A secret as a file | `.openmausbot-secrets/<thread>/<card>` | plain text, `0600`, 24 hours | `server/secret-vault.ts:111-149` |
| Approval level | the bot record and the thread record | `ask`, `edits`, `auto`, `full`, `custom` | `packages/phone-protocol/src/approval-mode.ts:5` |
| Edition | memory | `{edition: "oss" or "enterprise", features: [...]}` | `server/enterprise.ts:52` |

**Wire shapes.**

- `GET /api/auth/session` returns one of `loopback` (with `trust: "service"`
  when that applies), `session`, `unauthenticated` or `unreachable`
  (`src/lib/session.ts:17-21`, `:46-77`).
- `POST /api/auth/cli-login` returns `{id, code, expiresAt, intervalMs}`
  (`server/routes/cli-login.ts:119`). The list for the card has no verifier
  and no token (`shared/cli-login.ts:4-16`).
- `GET /api/vault` returns names, sources and the bots that may use each
  item, never a value (`src/lib/vault.ts:6-19`).
- `GET /api/edition` gives the full status to an admin, and only
  `{edition, features}` to others (`server/enterprise.ts:191-194`).

## 5. The UI

**The design rule.** `DESIGN.md:57-59`: "No new asks. No new permission asks,
approval cards, confirm dialogs, nags or waits that interrupt the person, and
no default below Full access. A bot gets on with the work; a change that needs
undoing gets Undo."

**Approval level** (`src/components/ApprovalModeSelector.tsx`,
`src/components/bot-settings/PermissionsSection.tsx`):

- Five levels: "Ask for approval", "Auto-accept edits", "Approve for me",
  "Full access" and "Custom (config.toml)". Full has the ShieldAlert icon
  and the text "Full computer access (elevated risk)"
  (`src/lib/approval-mode-options.ts:17-21`).
- There is no confirmation before Full. Full applies at once to all threads
  of the bot (`PermissionsSection.tsx:57`). The only confirmation is for Auto
  on a bot that controls this computer: "Allow Auto mode on this computer?"
  (`:53-56`).
- "Set for all bots" (`src/components/TeamSettingsDialog.tsx`) also applies
  Full to each bot with no confirmation. It shows a preview and a result for
  each bot.
- In the desktop app, Full and Custom go to the server over IPC, not over
  HTTP: "Custom authority never goes over the bot-accessible HTTP API"
  (`src/state/store.tsx:1896`).

**The terminal sign-in card** (`src/components/CliLoginCard.tsx`):

- Only an owner or an admin sees it. It is above all other dialogs.
- Title: "A terminal wants to control {app}". The code shows in a large
  monospace font. Then: "Allow it only if your terminal shows this same
  code." The scope shows as "Full control" or "Chat only".
- Buttons: Allow and Deny. To close the card is to deny.

**The pairing page** (`src/pair/PairPage.tsx`, `src/main.tsx`):

- A loopback session with `service` trust gets the full pairing page, not a
  banner: "This server does not treat this computer as its owner. Sign in or
  pair this browser to continue." (`src/main.tsx:71-75`).
- Fields: "Pairing code" (`XXXX-XXXX-XXXX`) and "This device". Over plain
  HTTP to a public host: "This connection isn't encrypted."
- The page removes the code and the sign-in credential from the address bar
  and the history before it renders (`src/lib/session.ts:95-108`).

**Devices** (`src/components/settings/pages/DevicesPage.tsx`,
`src/components/PairedPhones.tsx`): a list of signed-in devices with
"Remove". Remove has no confirmation and acts at once.

**The Vault** (`src/components/VaultSettings.tsx`):

- Only an owner or an admin sees it: "Only an admin of this installation can
  see and change the Vault." A Team Cloud member sees only their own secrets.
- There is no lock and no unlock.
- A row shows a name, a source and the bots that may use it, never a value.
  A value can only be replaced.
- Delete needs two clicks. The second label is "Delete for good". After a
  delete, a warning names the MCP servers that lost their key.
- States: "Loading the Vault…", "Nothing saved yet.", "Could not load the
  Vault."

**The secret card** (`src/components/SecretRequestCard.tsx`): a password
field and "Save securely". The value goes to the server or to the desktop
store, never into the chat. The footer says where the value goes, for
example "Saved to a private file your bot's commands can read for 24 hours,
then deleted." A card can offer "Use a saved one" with names only
(`src/components/VaultChoices.tsx`).

## 6. The tests

| Test file | What it guarantees |
|---|---|
| `server/request-auth.test.ts` | The loopback host and origin rules. Default deny of scopes. A dead credential never falls back to loopback. A proxy header is never loopback. A LAN peer is never the owner. A Unix socket is remote. Under `service`, each Slack-worker call passes and each admin call gets 403. The desktop capability is necessary for changes, and an empty token matches nothing. A browser is never the owner. |
| `server/request-auth.e2e.test.ts` | On a real server, a browser gets 401 on reads and changes, and a program on loopback gets 200. |
| `server/sessions.test.ts` | Only hashes on disk, mode `0600`. Codes are single use and expire. The lockout numbers. Expiry, renewal and the 180-day limit. Membership checks fail closed. An unclean restart drops account sessions. |
| `server/routes/cli-login.test.ts`, `server/cli-login.e2e.test.ts` | No token at start. A wrong verifier looks like an unknown id. One collection only. An uncollected session is revoked. Non-admins cannot list or allow. A cross-site start gets 403. |
| `server/tailnet-listener.test.ts` | Only Tailscale peers and the exact host. Configurations that are not valid are refused. |
| `server/hosted-access.test.ts` | Hosted sign-in fails closed without the layer, during an outage and with a bad license. Pairing and email are off. A demoted member loses scopes. A revoked stream closes in 15 s. |
| `server/vault-store.test.ts` | Mode `0600` on the key and the files. No plain text on disk. An unreadable Vault reads as empty. Grants are in the sealed file. |
| `server/vault/mcp-keys.test.ts` | Only a granted item resolves. A pointer that a person typed into `config.json` reads nothing. A header value with a line break is refused. |
| `server/routes/vault.test.ts` | No answer has a value. A member sees only their own secrets. |
| `server/secret-requests.e2e.test.ts` | Two canary secrets do not appear in any other file, in any answer, in any tool result or in the log. |
| `server/auto-approve.test.ts` | Questions are never answered. Full approves all other requests. Below Full, a sandbox widening and an outbound tool are held. |
| `server/approval-mode.test.ts` | The default is Full. A hosted default is Ask. A bad value fails to Ask. |
| `server/full-access-default.e2e.test.ts` | New bots are Full on Claude, Codex and Droid, and the engine flags. |
| `server/full-access-workflows.e2e.test.ts` | Product changes apply with no card at Full and as receipts with Undo at Ask. A new Full task without the policy gets 403. |
| `server/permission-proxy.test.ts` | With no broker, each ask fails closed. A timeout is never the answer of the person. |
| `src/components/VaultSettings.test.ts`, `SecretRequestCard.test.ts` | A typed value is not in the page after a save. Analytics never get a key or a part of it. |
| `src/components/CliLoginCard.dom.test.ts` | The card is above every other layer, and Allow works with Settings open. |

## 7. Ours compared

Our product is a desktop app. The core runs in the process of the app.
No HTTP server is in the plan (decision D10, `docs/plan/README.md` "An HTTP
server is not in these steps"). The task names step 9 with the crate
`bot-cli`, but `docs/plan/README.md` puts step 9 (the ACP driver) in
`bot-engine`. This file follows the plan. The composition root (`bot-cli`
or `bot-desktop`) is not decided yet (P26). Step 6 has two modules for this
feature: `bot-core/src/settings.rs` with the `Secret` type (PR 6.5) and
`bot-core/src/redact.rs` (PR 6.4).

| Reference | What it does | Ours | Where |
|---|---|---|---|
| `server/lan-address.ts`, `server/request-auth.ts` | Loopback bind, trust, gate | Not ported. D10 keeps the rules: bind `127.0.0.1`, never trust an address alone | D10. No crate |
| `SERVICE_ALLOW` | Routes for a session-less local caller | Not ported. We have no HTTP routes | none |
| `server/sessions.ts`, `routes/cli-login.ts`, `tailnet-listener.ts` | Sessions, pairing, terminal sign-in | Not ported. No remote access in the plan | none |
| `server/enterprise.ts` | Edition seam | Not ported. We have one edition | none |
| `electron/main.mjs` (`credentials.bin`) | Provider keys in the OS store | P19 proposes the keychain only | `bot-core` step 6, settings and secrets module |
| `server/vault-store.ts` | Vault with the key beside the file | No Vault in part 1 or 2 | later step |
| `server/credential-env.ts`, `drivers/*` environment | Copy the environment, remove names | P40 and the changelog §7 proposal: start from an allow list | `bot-engine` step 9, process start |
| Bot shell as a same-user process | Reads the data folder, the Vault key, the socket | The threat model must name it | `docs/threat-model.md`, step 9 |
| `server/auto-approve.ts`, `safety-floor*.ts` | The verdict and the floor | Changelog §7 proposal: one pure function | `bot-core` step 10 |
| `server/permission-proxy.ts`, broker in `drivers/claude.ts` | A socket with no caller check | Step 10 | `bot-engine` step 10 |
| Per-turn capability (`server/index.ts:1574-1784`) | A token for each turn and thread | `docs/comparison.md:108` names a token for each turn | `bot-engine` step 12 |

Our files now: `crates/bot-core/src/lib.rs`, `crates/bot-cli/src/main.rs`.
Nothing about security is in them yet.

## 8. Where we can be better

Each point has a reason.

1. **An authenticated broker channel.** The broker of the reference checks no
   caller (`server/drivers/claude.ts:519-563`), and the bot box mounts the
   socket (`:1297`). Each process of the same user can send asks. Give the
   engine side a token for each turn, or use the stdio pipe of the child. A
   forged ask then cannot reach the person. Reason: a known problem that we
   do not copy.
2. **A safety floor that a no-ask mode cannot skip.** The floor of the
   reference is off by default, does nothing on Windows, and never sees
   Claude or Codex at Full (`server/safety-floor-gate.ts:3-4`, `:14-39`).
   Windows is our work computer. One option: run the engine with its own
   asks on, and answer them in our verdict function. The other option: the
   threat model states that Full has no floor. Reason: a known problem.
3. **Decide the default level, and write what Full never does as code.** The
   reference flipped the default to Full (`593fd1c5a`), and its own documents
   disagree on what Full may do (section 3.9). One rule in one place: Full
   never answers a question (`server/auto-approve.ts:108-110`) and never
   types a secret. Make it a type: a question request has no "approve"
   variant. Reason: a wrong state that the compiler refuses, and a reversal
   of the reference.
4. **A per-turn capability bound to the thread and the turn.** The reference
   design is good: the identity comes from the record, never from the caller
   (`server/index.ts:1573`), and the check is done again before each side
   effect (`:12780-12795`). Copy it. A tool in another process sends the
   bearer back as a string, so the compiler cannot refuse a stale bearer at
   use. That check stays a compare of the generation at run time, as in the
   reference (`:1761-1784`). The compiler can force the mint to take a guard
   of an active turn. Reason: follow the reference, and let the compiler
   refuse a mint outside a turn.
5. **The Vault key is not beside the Vault.** The reference keeps the key in
   plain text next to the sealed file (`server/vault-store.ts:206-217`). Put
   the key in the OS keychain, as P19 proposes for API keys. Reason: a known
   problem.
6. **Never overwrite an unreadable secret store.** The reference replaces an
   unreadable Vault at the next save (`server/vault-store.ts:228-233`). This
   is the changelog problem "A file written over after a failed read", and
   P22 answers it for settings. Use the same type for the secret store.
   Reason: a known problem, and a wrong state that the compiler refuses.
7. **One check of the encryption back end.** `credentials.bin` does not check
   Linux `basic_text`, and two other stores do (`electron/main.mjs:390` and
   `:797`). One function for "is the OS store safe" is less code, and no
   store can forget it.
8. **No same-user trust by address.** A bot shell is a loopback caller. The
   reference needs a list of service routes and still has an open gap
   (`server/request-auth.ts:33-39`). We have no HTTP server (D10). If one
   comes, a request from a bot must carry its per-turn capability, and a
   loopback address alone gives nothing. Reason: a known problem.
9. **The child environment starts empty.** The reference copies the whole
   environment and removes names. Three places remove only some names
   (`server/engine-standalone.ts:624` and two others). An allow list per
   driver (changelog §7, P40) has no such gap. Reason: a known problem.

**The problems of `changelog.md` section 5 that the reference has here.**

- **A secret or an access right in the wrong place.** Yes:
  - the Vault key is beside the Vault (`server/vault-store.ts:206-217`),
  - a bot shell can use the service routes, with the Full-access gap
    (`server/request-auth.ts:33-39`),
  - the broker socket accepts any process of the same user
    (`server/drivers/claude.ts:519-563`),
  - a phone's key is plain text in `config.json` (`server/routes/config.ts:574-575`),
  - `credentials.bin` may use a fixed key on Linux (`electron/main.mjs:390`),
  - a Full bot can read the saved terminal session (`SECURITY.md:32-34`).
- **The person's own engine config reaches the bots.** Yes, partly by design:
  Codex links the person's setup (`server/drivers/codex-shared-home.ts:1-5`),
  an option loads the whole Claude setup (`server/drivers/claude.ts:139-150`),
  and the Claude driver starts from the server environment (`:119-121`).
- **A feature added, then removed or reversed (security rules).** Yes: the
  default level went from Ask to Full (`593fd1c5a`), the session idle rule
  was removed (`ec5693ceb`), and Full access became an exception to "a
  broker bypass is a vulnerability" (`3e27620b9`). Two documents and two
  comments disagree with the code (section 3.9).

## 9. Not verified

**Checks of the main session against the code.** Each of these agrees with
the code at `ed8cb7278`:

1. `listenHost` returns `127.0.0.1` unless `OMB_LAN=1`
   (`server/lan-address.ts:53-59`).
2. The order of `loopbackTrust`, and the warning for `owner` on a shared
   workspace (`server/request-auth.ts:88-111`).
3. The text of the open risk (`server/request-auth.ts:33-39`).
4. The constant-time capability check that deletes inactive records
   (`server/index.ts:1748-1759`).
5. Session expiry and the hash compare (`server/sessions.ts:28-37`,
   `:153-157`).
6. The fail-closed hosted test (`server/hosted-access.test.ts:258-269`).
7. The terminal sign-in poll (`server/routes/cli-login.ts:122-137`).
8. The Vault key, the read and the write (`server/vault-store.ts:206-266`).
9. The `credentials.bin` write checks (`electron/main.mjs:386-398`).
10. The refusal of a `vault:` value from a bot (`server/routes/internal-mcp.ts:166-167`).
11. The default level Full and the hosted default Ask
    (`packages/phone-protocol/src/approval-mode.ts:75`, `server/index.ts:750`).
12. Questions never answered, Full approves the rest
    (`server/auto-approve.ts:106-112`).
13. The safety floor is off by default and does nothing on Windows
    (`server/safety-floor-gate.ts:14-39`).
14. The broker socket: mode `0600`, a bind that fails closed, no caller check
    (`server/drivers/claude.ts:519-563`).
15. The removal of the idle rule in `ec5693ceb` (the diff to its first
    parent removes `SESSION_IDLE_MS`).
16. No confirmation before Full in the UI (`PermissionsSection.tsx:44-59`),
    and the design rule (`DESIGN.md:57-59`).

**Not verified.**

- The closed `enterprise/server/workspace-access.ts`. What happens during a
  portal outage is known only from the tests.
- Whether `safeStorage.isAsyncEncryptionAvailable()` returns true with the
  Linux `basic_text` back end.
- What the Claude CLI reads when `CLAUDE_CONFIG_DIR` is not set, and which
  bots "run isolated" (release v0.1.104).
- Whether the three places that remove only control-plane names give
  provider keys to their children.
- The content and the mode of `mcp-oauth.json`. Only its path was seen
  (`server/index.ts:1356`).
- How the product tools (`propose_profile`, `create_trigger`,
  `skill_manage`, `coordinate_bots`) decide between a card and a receipt.
  This file uses their end-to-end tests only.
- Whether the guarded send compares with the level of the thread or of the
  bot.
- The permission paths of the other engines: ACP, Codex, the chat engines
  and Pi.
- Whether a bot can reach the broker socket from inside the bot box. The
  mount is read-write, but nobody ran it.
- The texts of some refusals (`TEAM_LEFT_REFUSAL`, `TURN_ENDED_REFUSAL` and
  others), `internalBodyRefusal`, and whether code enforces the per-turn
  limits.
- The UI files `PhoneDevicesSection.tsx`, `ServerPairingCard.tsx`,
  `AddDeviceDialog.tsx` and `PermissionsSection.test.ts` were not read.
- The ranges of `docs/self-hosting.md` that are not in section 2.
- No test of the reference was run.
