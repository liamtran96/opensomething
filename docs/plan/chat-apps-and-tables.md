# Plan: Chat apps and rich tables

The proposals from the research file
[`../research/features/chat-apps-and-tables.md`](../research/features/chat-apps-and-tables.md)
(batch 12, reference commit `42f86aefd`). The steps, the pull requests and
the order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project. "spec" is
`docs/superpowers/specs/2026-10-14-chat-apps-design.md` of the reference.

- **Steps:** none yet. P644 decides the scope. With its option a, bot pages
  get a new step after step 12 (or after the step of P394), with P646,
  P647, P648, P649, P654, P655 and P657. P645 goes to step 10. P650, P651,
  P652 and P658 go to step 16. P656 (rich tables and the other window
  parts) goes to a window step after step 1.
- **State:** all open. Decide P644 first.
- **The main finding:** a bot can show a small web page in the chat
  (`show_html`), and an MCP server can show its own `ui://` page when one
  of its tools runs (the MCP Apps standard). Both pages run in a frame with
  `sandbox="allow-scripts allow-forms"` and an opaque origin
  (`src/components/app/app-frame-host.ts:5-7`). The server puts a CSP as
  the first tag of each frame document
  (`shared/app-frame/document.ts:33-40`). The window and the frame speak
  JSON-RPC 2.0 over `postMessage` (`shared/app-frame/bridge.ts:1-3`). A
  frame must have a click from the person before it can send a message or
  open a link (`app-frame-host.ts:11-14`, `:29-89`). The calls of an MCP
  application frame run outside a turn, on the server's own connections
  (`server/mcp-app-connections.ts:1-3`).

## Proposals, in order of importance

Decide P644 first: each proposal from P645 to P655 depends on it.

### P644 (decision, decide first). Is the feature in scope?

- **What:** decide if bot pages (`show_html`) and MCP applications in the
  chat are in scope. Decide the rich tables, the CSV preview, the tool
  details and the settings search on their own: they are window code only.
- **Problem:** `docs/comparison.md` section 10 lists "Pages made by a bot"
  under "More features that are not planned (scope Out)". The row of
  `docs/research/reference-features.md` says "later". The two documents do
  not agree.
- **Reason:** every other proposal from P645 to P655 depends on this answer.
- **Options:**
  - a. In scope, later: a new step after step 12 for bot pages, and the MCP
    applications in step 16 or after it.
  - b. Only the window parts (P656) now. Bot pages and MCP applications stay
    out, and `comparison.md` stays as it is.
  - c. Bot pages in, MCP applications out (they need the observer, the
    catalog and the app connections of step 16).
- **Source:** `server/chat-apps.ts` (659 lines), `server/chat-apps-mcp.ts`
  (501), `shared/app-frame/` (bridge, csp, document, helper), spec:14-32.

### P645 (plan, step 10, `bot-core`). An app's change goes through the one approval function. No Allow bar.

- **What:** a call from an MCP application that changes something asks the
  same pure function of step 10 as a tool call of the bot. The function
  gets the tool annotations (read-only, destructive, visible to the model
  or not). We draw no Allow bar of our own.
- **Problem in the reference:** the approval model changed. The reference
  added an Allow bar on 2026-10-14 (`d5dba1449` for the bridge, `a7bad77fe`
  for the server 409 "The person has to allow <title>.") and removed it on
  2026-10-22 (`ffb5c9aa0`). All three commits are first in v0.1.122, so no
  release had the bar. The spec still describes it (spec:72-73) and also
  says there is none (spec:312-316, 482). Today the rule is one more place
  that decides "ask or allow" (`server/chat-apps-mcp.ts:331-337`).
- **Reason:** `changelog.md` section 6 shows that the approval model
  changed about 10 times. One function in one place stops another drift.
- **Follow the reference for the rule itself:** a call runs when the tool
  is read-only, or app-only and not destructive, or the bot is at Full
  access. Else 403 -32000 with the text "This bot asks before it changes
  anything, so its apps can only look. Ask the bot to make the change, or
  set it to Full access." (`chat-apps-mcp.ts:31-32, 333-337`).
- **Options:** a. one function (this proposal). b. Follow the reference: a
  separate rule in the app module.
- **Problems table row:** "The approval model changed".

### P646 (plan, step 12, `bot-engine`). One tool: `show_html` with `app_id`.

- **What:** a call without `app_id` makes a page. A call with `app_id`
  replaces it. No `update_html` tool and no alias.
- **Problem in the reference:** a feature added, then removed.
  `update_html` came as a second tool on 2026-10-14 (`a0a5d08ac`, first in
  v0.1.122) and was merged into `show_html` on 2026-10-29 (`a96950e01`,
  first in v0.1.132). The alias stays for old sessions, skills and memories
  (`packages/phone-protocol/src/agents-tool-names.ts:27, 34-35, 42-43, 63`).
- **Reason:** no reversal to carry, and one tool less in the tool list.
- **Follow the reference for the input:** `html`, `jsx` or `path` (exactly
  one), `title` (1 to 80), `height` (clamped 80..720), `fallback_text`
  (at most 1,500), `frameless`, `live`, `uses`, `app_id`
  (`server/drivers/agents-app-tools.ts:6-21`;
  `packages/phone-protocol/src/app.ts:10-55, 226-256, 441-499`).
- **Problems table rows:** "A feature added, then removed" and "The size of
  the tool list".

### P647 (plan, the new step of P644, `bot-core` and `bot-desktop`). Rooms are view-only, and a page message is a draft, from the first version.

- **What:** one `can` value, decided in `bot-core`, turns off messages,
  model context and server calls in a room. Links stay on. A message from
  a bot page in the chat goes into the message box as a draft. The person
  presses Send.
- **Problem in the reference:** two reversals.
  - The spec made apps a non-goal in rooms (spec:25, 75). `65c67319d`
    (2026-11-07, first in v0.1.145) added them, view-only, with checks on
    four layers: `ROOM_CAN` (`shared/app-frame/document.ts:56-57`), the
    room helper (`shared/app-frame/helper.ts:305-306, 314-315`), the bridge
    (`shared/app-frame/bridge.ts:411`) and the routes
    (`server/routes/chat-apps.ts:123-126`).
  - A page message was sent at once (spec:74, 325-338). `972069a3c`
    (2026-11-22, first in v0.1.178) made it a draft
    (`src/components/app/AppMessage.tsx:205-210`). MCP applications and
    pages pinned to the sidebar still send (`AppFrame.tsx:87-93`).
- **Reason:** no reversal, and the person sees the words before the bot
  gets them.
- **Problems table row:** "A feature added, then removed".

### P648 (decision, new, follows the reference). The security rules of a frame.

- **What:** record these rules as a decision, each with a test:
  1. The frame is `<iframe sandbox="allow-scripts allow-forms"
     referrerpolicy="no-referrer" srcdoc>`, with no `allow` attribute
     (`src/components/app/app-frame-host.ts:5-7, 174-190`).
  2. The CSP tag is the first tag of the document. No byte of the page
     comes before it. A leading BOM, comments, `<?...>`, `<!...>` and the
     page doctype are removed (`shared/app-frame/document.ts:10-40`).
  3. The CSP of a bot page: `default-src 'none'`, scripts, styles, fonts,
     images and connect only from `cdnjs.cloudflare.com`,
     `cdn.jsdelivr.net` and `unpkg.com`, Google Fonts for styles and fonts,
     `frame-src`, `object-src`, `base-uri`, `form-action` and
     `manifest-src` are `'none'` (`shared/app-frame/csp.ts:11-25`).
  4. The CSP of an MCP application comes from its declared domains after a
     filter: `https` only (`wss` in connect), no path or query, `*.` only
     leftmost, `http` loopback only for a loopback server, at most 64 for
     each list, `frameDomains` and `baseUriDomains` ignored
     (`csp.ts:63, 82-139`).
  5. The host takes a message only when `event.source` is the frame's own
     window, it is JSON-RPC 2.0, and it is at most 1,000,000 bytes. It
     answers nothing before `initialize` (`bridge.ts:23, 136-150, 390-391,
     479-481`).
  6. `ui/message` and `ui/open-link` need a click in the frame. A frame
     that takes focus by itself is not engaged (`app-frame-host.ts:11-14,
     29-89`, `bridge.ts:397-423`).
  7. Rate limits: messages 1 each 3 s and 10 each 10 minutes, links 1 each
     2 s, calls 10 each 10 s and 120 each 10 minutes (`bridge.ts:34-39`).
- **Reason:** follows the reference. Each rule has a test there
  (`csp.test.ts`, `document.test.ts`, `bridge.test.ts`,
  `app-frame-host.test.ts`, `scripts/smoke-app-frames.mjs`).

### P649 (plan, the new step of P644, conditional). Check the viewer on `context` and `rpc`.

- **What:** each app route checks that the viewer can see the
  conversation, not only the page methods.
- **Problem in the reference:** possibly an access right in the wrong
  place. A `client` session may call `rpc` and `context`
  (`server/request-auth.ts:419-420`). The route checks the viewer only for
  page methods: "A page's data and state are a read of the conversation:
  only for whoever may see it." (`server/routes/chat-apps.ts:133-135`).
  Context and MCP rpc check the bot, the task and the row, but not the
  viewer (`:115-131`). No test sends context from a viewer who cannot see
  the conversation (`server/routes/chat-apps.test.ts:139-174`).
- **Not verified:** a gate above the route may check it. If none does, a
  signed-in person who knows the ids can put model context into a
  conversation or run the bot's app tools with the bot's sign-in.
- **Reason:** "a secret or an access right in the wrong place" (for
  example "Web pages no longer get owner access", v0.1.113).
- **Action before a decision:** search `server/index.ts` for a check of
  `client` sessions before `dispatchRoutes` (`routes/table.ts`).
- **Problems table row:** "A secret in the wrong place".

### P650 (plan, step 16, `bot-core`). Redact the MCP tool result before it is stored.

- **What:** the stored `toolResult` of an MCP application goes through the
  redaction of step 6, as the row text does.
- **Problem in the reference:** the row text is redacted
  (`server/chat-apps-mcp.ts:253-255`), but the stored `toolResult` is not
  (`:220-225`, and spec:813 says "stored result not redacted"). The
  document route gives it to each viewer who can see the conversation, and
  a room document keeps it (`shared/app-frame/document.ts:111`). So the
  people of a room read the data that the row text hides.
- **Reason:** "a secret in the wrong place". The frame's own hosts gain
  nothing new, because they belong to the server that made the result.
- **Options:** a. redact before store (a redacted value can break the
  app's view). b. Store as is, but leave `toolResult` out of a room
  document. c. Follow the reference.
- **Problems table row:** "A secret in the wrong place".

### P651 (decision, change D12). The proxy and the grant check cover the calls of a frame.

- **What:** D12 says that our proxy filters the tool list and checks the
  grant on each call. Add: a call from an MCP application frame runs
  outside a turn, through the core's own connection to the server, and the
  same grant check applies there.
- **Fact from the reference:** frame calls do not go through the engine.
  They use the server's own app connections, "long after the turn that
  called the tool has ended" (`server/mcp-app-connections.ts:1-3`;
  `server/chat-apps-mcp.ts:379-405`). The frame can call only the server of
  its own row (`:395`), only tools whose visibility lists `app`, and a tool
  that the model can also see must be in the bot's tool selection
  (`:308-314`).
- **Reason:** without this line, D12 reads as if the engine path is the
  only path.

### P652 (plan, step 16, `bot-engine`). A connection limit for each server, and server checks that do not share one queue.

- **What:** each MCP server has its own app connection and its own limit.
  A background check of one server does not wait behind the check of
  another.
- **Problem in the reference:** one slow or stuck part blocks the others.
  All servers share 6 connections, and the least recently used one closes
  first, even when it is another server's (`server/mcp-app-connections.ts:16,
  239-243`). All background checks run one at a time on one chain, up to
  45 s each (`server/chat-apps-mcp.ts:28-29, 422, 440, 452`). The reference
  fixed this theme for turns in v0.1.153 ("A turn carries on when one
  optional MCP server dies.") and v0.1.178.
- **Follow the reference for the time limits:** 30 s to open, 120 s for
  `tools/call`, 30 s for other methods, 5 minutes idle
  (`chat-apps-mcp.ts:25-26, 338`; `mcp-app-connections.ts:15, 251`;
  `server/mcp-http.ts:41`). A cancel sends `notifications/cancelled` and
  keeps the connection. A lost transport closes it (`:108-112, 292`).
- **Problems table row:** "One slow or stuck part blocks the others".

### P653 (decision, change D13). Test the frame in WebKit, and our window CSP.

- **What:** add a concrete test to the open risk of D13 ("not tested in
  the WebKit webviews of macOS and Linux"):
  1. `sandbox="allow-scripts allow-forms"` with `srcdoc` works.
  2. `postMessage` with the target `"*"` reaches the frame and back.
  3. The click rule works: the reference keeps the last pointer place
     because Chromium isolates a sandboxed frame
     (`src/components/app/app-frame-host.ts:24-28`).
  4. Our window CSP `default-src 'self'; style-src 'self'`
     (`crates/bot-desktop/tauri.conf.json:27-28`) does not block the CDN
     scripts inside the `srcdoc` frame.
- **Reason:** the spec of the reference lists the WebKit frame messages as
  not verified (spec:753-761), and the reference runs on Electron only for
  the desktop.

### P654 (decision, note on D10). The app routes become Tauri commands.

- **What:** the three routes (document, rpc, context) become Tauri
  commands that call `bot-core`. The route that serves a folder page's
  files has no equivalent: it needs a custom URL scheme, or folder pages
  stay out.
- **Fact from the reference:** the routes are
  `GET /api/threads/:t/messages/:m/app`, `POST /api/bots/:b/apps/:m/rpc`
  and `POST /api/bots/:b/apps/:m/context`
  (`server/routes/chat-apps.ts:61-62`). The files route answers before the
  sign-in gate, and a token of 32 random bytes for each viewer and document
  is its whole authority (`server/page-files.ts:1-12, 25-27, 133-142`).
- **Options:** a. a custom scheme with the same token rule. b. No folder
  pages. c. Folder pages copied into the document.

### P655 (plan, the new step of P644, `bot-desktop`). Time limits on the frame pool and the document fetch.

- **What:** a wait for a frame teardown, a document fetch and a frame load
  each has a limit in its type.
- **Problem in the reference:** the pool has no limit of its own. A
  teardown that never ends would keep its slot. Only the bridge ends a
  teardown after 1 s (`src/components/app/app-pool.ts:68-72`;
  `shared/app-frame/bridge.ts:29`). No limit was found for a document fetch
  or a frame load (`AppMessage.tsx:169-172`).
- **Reason:** "a turn or a wait that does not end". `changelog.md`
  section 7 says a wait is a type that cannot exist without a limit.
- **Problems table row:** "A turn or a wait that does not end".

### P656 (plan, a window step after step 1, `bot-desktop`). Rich tables, the CSV preview, tool details and the settings search.

- **What:** follow the reference. These are window code only.
  - Rich table: search and count above 8 rows, sort ascending,
    descending, off, empty cells last, virtual rows above 80, copy and
    download of the visible rows as CSV, a native modal dialog
    (`src/components/RichTable.tsx:48, 71-92, 157`).
  - Formula escaping: a cell that starts with `=`, `+`, `-`, `@`, tab or
    CR gets `'`, except a plain number (`src/lib/table-data.ts:77-82`).
  - CSV and TSV preview: 10 MiB, 100,000 rows, 200 columns, 500,000 cells,
    parsed in a Web Worker, an error instead of a cut
    (`table-data.ts:3-6`; `TableFilePreview.tsx:13-38, 80-97`).
  - HTML file preview: `sandbox=""`, CSP with no script source,
    `<base target="_blank">` (`HtmlFilePreview.tsx:13-14, 46-49, 196`).
  - Tool details: closed by default, full output loaded on open, redaction
    before the cut (`ToolActivity.tsx:19, 29-82`;
    `server/tool-summary.ts:1-89`).
  - Settings search: the scores 100 to 40, 8 hits here and 8 elsewhere,
    `/` and Cmd/Ctrl+F (`settings/settings-index.ts:291-344`;
    `settings/SettingsNav.tsx:261-292`; `settings/SettingsWindow.tsx:119-133`).
  - Shortcut hints from the cheat sheet table (`ShortcutHint.tsx:3-12`).
- **Reason:** follows the reference. No release problem.

## Judgment calls (no release problem, the author can keep the reference)

### P657 (plan, the new step of P644, `bot-core`). `fsync` for page files.

- **What:** the page file and its folder get `fsync` before the row is
  written.
- **Fact:** the reference writes a temporary file and renames it, with no
  `fsync` (`server/app-docs.ts:93-99`). SQLite runs with `synchronous =
  NORMAL` (`server/message-db.ts:49-50`). After a power cut a row can name
  a missing document. The window then shows "This app's page is not stored
  on this computer." (`routes/chat-apps.ts:105`).
- **Why a judgment call:** no release shows this failure.

### P658 (plan, step 16, `bot-engine`). Accept an app report at once, then read the page.

- **What:** the core answers the observer's report at once and reads the
  `ui://` page after.
- **Fact:** the observer stops after 10 s (`server/mcp-app-observer.ts:12,
  160, 168`). The server reads the page for up to 30 s, after an open of up
  to 30 s (`server/chat-apps-mcp.ts:167`; `server/mcp-app-connections.ts:251`).
  It is not verified if the row is still written when the proxy gives up.
- **Why a judgment call:** the failure is not verified.

### P659 (plan, our docs pages). Carry no leftovers.

- **What:** our code and texts carry no dead fallback and no stale text.
- **Fact:** the reference still has the fallback "This app cannot reach its
  server on this computer yet." although the server always sets `mcpRpc`
  (`server/routes/chat-apps.ts:167`; `server/index.ts:11946`). The text
  `html.tooLarge` still says "(2 MB)" and no code uses it
  (`src/locales/en.json:155`). The test server says that a change "needs
  the person's Allow" (`server/testing/fake-stdio-app-server.ts:10-11,
  41-42`). The spec contradicts the code in six places (domain cap 16 against
  64, the Allow bar, rooms, `ui/message`, the rpc methods, the pane).
- **Why a judgment call:** less to read, no failure. It supports P405.

## New facts for open proposals

Each fact goes to the plan file of its proposal when the author decides it.

- **P231 (is our proxy always between the engine and the server?):**
  frame calls of an MCP application do not go through the engine. They use
  the core's own connections outside a turn
  (`server/chat-apps-mcp.ts:379-405`; `server/mcp-app-connections.ts:1-3`).
  See P651.
- **P233 (the MCP call timeout is a driver capability):** app connections
  have their own limits: 120 s for `tools/call`, 30 s for other methods,
  30 s to open, 45 s for a background check
  (`chat-apps-mcp.ts:25-29, 338`; `server/mcp-http.ts:41`). A cancel sends
  `notifications/cancelled` and keeps the connection
  (`mcp-app-connections.ts:108-112, 292`; `mcp-app-cancellation.test.ts:107-121`).
- **P236 (the step of `mcp_server`):** an observed MCP application uses the
  same internal route as the cards, `POST /api/internal/options-card` with
  `tool: "mcp_app"`, and the token of the turn. The token stops working
  when the turn ends (`chat-apps-mcp.e2e.test.ts:80-81, 100-102`).
- **P240 (one rule for a dead server):** a dead app server fails each
  waiting request, its process tree is killed, and the frame gets 502
  "The app's server could not be reached." (`mcp-app-connections.ts:65-66,
  95-101`; `chat-apps-mcp.ts:403`). The shared limit of 6 connections and
  the one chain of checks couple the servers. See P652.
- **P241 (keep the "off" state on disk):** the switch "Show its apps in
  chat" is stored only as `apps: false`, on by default, and an edit keeps
  the old value (`server/mcp-registry.ts:30-31, 63-64, 426-429`). The
  places that obey it: no catalog record, no new row (409), 410 on rpc, no
  extension on Test, no check, no turn mount
  (`chat-apps-mcp.ts:144, 213, 269, 393, 426, 444, 462, 475`).
- **P242 (one mask for an address):** the app rpc error text already
  replaces the configured URL, header and environment values (4 characters
  or more) with «redacted» and cuts to 1,000 characters
  (`chat-apps-mcp.ts:286-291`). One mask function can serve both.
- **P394 (a step for chat widgets):** app rows share the same dispatch
  (`createAgentCard` sends `show_html`, `update_html` and `mcp_app` to the
  app feature, `server/chat-widgets.ts:137-144`) and the same row component
  (`src/components/RichMessageRow.tsx:23-39`). The widget table uses the
  rich table (`src/components/widget/WidgetTable.tsx:4`). The step of P644
  can come right after the step of P394.
- **P400 (`show_widget` idempotent for each tool call):** `show_html`
  without `app_id` also appends a new row on each call, with no key
  (`server/chat-apps.ts:141-152`). The observer carries the tool use id
  (`server/mcp-app-observer.ts:217`), but `recordMcpAppCall` does not use
  it to find a row that exists (not verified beyond
  `chat-apps-mcp.ts:193-260`). The same proposal fits both.
- **P401 (one source for the limits):** the `show_html` description says
  "At most 256 KB" and a folder "up to 5 MB" (`agents-app-tools.ts:5`). The
  constant is 256 KiB (`app.ts:12`). The spec says 16 domains and the code
  has 64 (spec:279; `csp.ts:63`).
- **P403 (mask secrets in a widget field):** the reference masks the model
  context of a frame (`chat-apps.ts:341`) and the page HTML, title and
  fallback (`:45-49, 101-102`). If the text of an app message is masked was
  not verified.
- **P405 (our pages say what the code does):** the chat apps spec
  contradicts itself on the Allow bar (spec:72-73 against 312-316, 482) and
  contradicts the code in five more places (research file, section 2.2).
- **P443 to P445 (tool scope):** an app-only tool needs only its server in
  the bot's scope. A tool that the model can also see needs the per-tool
  scope (`chat-apps-mcp.ts:308-314`). The Access list hides app-only tools
  (spec:310).
- **P452 (one answer for a withheld tool):** the proxy removes app-only
  tools from `tools/list` and answers a model call to one with -32602 "This
  tool belongs to an app view." (`server/mcp-app-observer.ts:10, 74-77`).
  This is a third kind of hidden tool.
- **P576 (the bot box on our desktop):** the core's own app connection to a
  command server starts in the bot box when the box is on, and cannot see
  the data folder (`mcp-app-connections.ts:49-55`;
  `mcp-app-connections-box.test.ts:34-99`).
- **P33 (tools on the chat API):** the chat runtime adds the UI extension,
  never registers an app-only tool and observes in-process
  (`server/drivers/chat-mcp-tools.ts:20, 299-321, 586, 866`).

## Changes to `docs/decisions.md` after the author decides

1. **New decision (P644):** the scope of chat apps. Also correct
   `docs/comparison.md` section 10, row "Pages made by a bot", to agree
   with the answer.
2. **New decision (P648):** the security rules of a frame, follows the
   reference, with the file and line of each rule.
3. **D12 (P651):** add that the calls of an MCP application frame run outside
   a turn on the core's own connection, and the same grant check applies.
4. **D13 (P653):** add the WebKit frame test and the check of our window CSP
   to the open risks.
5. **D10 (P654):** add a note: the app routes become Tauri commands, and the
   files of a folder page need a custom scheme or stay out.
6. **D19 (P659, P405):** no change to the rule. Our feature page for chat
   apps says what the code does, not what the spec of the reference says.
