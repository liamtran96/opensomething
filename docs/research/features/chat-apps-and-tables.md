# Chat apps, rich tables and the open part of chat polish

This file is for three rows of
[`../reference-features.md`](../reference-features.md):

- "Chat apps: a bot shows an HTML page in the chat (`show_html`,
  `update_html`) in a sandbox; MCP applications drawn in the chat; a switch
  for each MCP server" (`superpowers/specs/2026-10-14-chat-apps-design.md`).
- "Rich tables: sort, search, copy and export; previews of CSV files"
  (`rich-tables.md`).
- The open part of `chat-polish.md`: tool details that open in the chat,
  search in the settings and shortcut hints.

No step of [`../../plan/README.md`](../../plan/README.md) owns these rows
yet. The MCP applications touch step 16 (outside tools). Section 7 names the
steps that fit.

- **Reference commit:** `42f86aefd` (2026-11-27, after the tag `v0.1.184`).
  Each line number in this file is at that commit.
- **Method:** six subagents on Opus 5.5 read six groups of files:
  1. the spec and the wire types.
  2. the server side of bot pages.
  3. the server side of MCP applications.
  4. the shared frame core.
  5. the desktop UI of the frames.
  6. the tables with the chat polish.

  Each subagent read its files completely, or
  in recorded ranges. A seventh subagent checked 60 key claims and the
  changelog answers against the code. It found no wrong claim, five claims
  that were partly right, and nine differences between the reports or
  between the spec and the code (section 2.2). The main session then read
  the key lines again.
- **Product names:** quoted strings and identifiers that hold the product
  name of the reference project show it as `<app>`. The names of
  environment variables (`OMB_...`) are kept as the code writes them.

### What this file adds to earlier research

- [`custom-mcp-servers.md`](custom-mcp-servers.md) has the registry, the
  PATCH with one key `enabled` or `apps` (its lines 384-386) and lists
  `McpAppsSwitch.tsx` as read. This file adds what the switch does: the
  catalog of servers that have apps, the observer, the connections that the
  server keeps for apps, and each place that obeys `apps: false`
  (section 3.6).
- [`chat-widgets-and-proposals.md`](chat-widgets-and-proposals.md) says that
  `createAgentCard` sends `mcp_app`, `show_html` and `update_html` to "the
  app feature" (its line 280). This file is that feature.
- [`team-structure.md`](team-structure.md) has "pages in a room are
  view-only" (`room-pages.md`). This file adds the exact checks on each
  layer: the frame, the bridge and the routes (section 3.9).
- [`bot-attachments.md`](bot-attachments.md) has the attachment gallery and
  preview of `chat-polish.md`, and says that `RichTable.tsx` was not read
  (its line 1169). This file reads `RichTable.tsx`, the table file preview
  and the HTML file preview.
- [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md) has the tool
  chip and `server/tool-summary.ts` when it had 73 lines. This file adds
  what is new in the 122-line version and the full output that loads on
  demand (section 3.12).
- [`environments-and-flags.md`](environments-and-flags.md) read part of
  `SettingsPrimitives.tsx`. This file adds the settings search, which is in
  `src/components/settings/`, and the shortcut hints (section 3.13).
- Not here: the "Published apps" page (`published-apps.md`), the hosting of
  sites (`included-hosting.md`, `publish-to-netlify.mdx`) and the local apps
  page. This file names them only where a bot page calls them.

## 1. In short

A bot can show a small web page inside the chat, and an MCP server can show
its own page when one of its tools runs. Both pages run in a locked frame. A
frame cannot see the rest of the application, cannot reach the network
except a short list of addresses, and cannot act for the person unless the
person clicked in it. The reference project calls both kinds of page an
"app row". Tables in a reply also get a better view: sort, search, copy,
download and a large view.

The terms:

- **App row:** a chat message of kind `app`. It holds no HTML. It holds the
  title, the identifier of the stored page, its version and the network
  that the page may use (`packages/phone-protocol/src/app.ts:112-148`).
- **Bot page** (source `html`): a page that the bot writes with the tool
  `show_html`. The bot can send HTML, one React component (`jsx`) or a
  folder (`path`) (`app.ts:226-240`).
- **MCP application** (source `mcp`): a page that an MCP server declares for
  one of its tools, in `_meta.ui.resourceUri`, with an address that starts
  with `ui://`. The standard is "MCP Apps" (`io.modelcontextprotocol/ui`,
  SEP-1865, stable version `2026-01-26`) (`app.ts:6-8`, spec:7).
- **Frame:** an HTML `iframe` whose content is given inline (`srcdoc`), with
  `sandbox="allow-scripts allow-forms"`. It has an opaque origin: the
  browser treats it as a site with no name, so it cannot read the cookies or
  the storage of the application
  (`src/components/app/app-frame-host.ts:5-7`).
- **CSP (Content Security Policy):** a list of the addresses from which a
  page may load scripts, styles, images and data. The server puts it as the
  first tag of each frame document (`shared/app-frame/document.ts:10, 33-40`).
- **Bridge:** the code in the window of the application that answers the
  messages of a frame. The frame and the bridge speak JSON-RPC 2.0 over
  `postMessage` (`shared/app-frame/bridge.ts:1-3`).
- **Helper:** a small script that the server puts into each bot page. It
  gives the page `window.<app>` with `send`, `open`, `setContext`, `data`,
  `state` and `connectors` (`shared/app-frame/helper.ts:4-19`).
- **Engagement:** proof that the person clicked in the frame just now. A
  frame needs it to send a message or open a link
  (`app-frame-host.ts:11-14, 29-89`).
- **Model context:** text that a frame gives to the bot. It goes in front of
  the next message of the person, one time (`server/chat-apps.ts:348-392`).
- **Observer:** code inside our MCP proxies that sees a tool result with a
  `ui://` page and reports it to the server, so that the server can make an
  app row (`server/mcp-app-observer.ts:1-4`).
- **App catalog:** a file that records which MCP servers have apps, so that
  a turn knows which servers to observe (`server/mcp-app-catalog.ts:1-3`).
- **App-only tool:** an MCP tool whose `_meta.ui.visibility` does not list
  `model`. Only the frame can call it. The model never sees it
  (`mcp-app-observer.ts:64-77`).
- **Pool:** the limit of live frames in one window: three
  (`src/components/app/app-pool.ts:5-11`).
- **Rich table:** the one table component for a Markdown table in a reply,
  a CSV or TSV file preview and a table widget
  (`src/components/RichTable.tsx`).

Why the feature exists: a bot can show a chart, a form or a game without a
separate site. A tool such as Excalidraw can show its drawing in the chat. The design was written on 2026-10-14 (spec:1-12). The code then grew
beyond the spec: folder pages, React pages, live folders, versions, data,
state, connector calls from a page, rooms, Point and publishing. Section 3
follows the code, and section 8 lists where the spec and the code differ.

## 2. Files read completely

All paths are in the reference project. "spec" is
`docs/superpowers/specs/2026-10-14-chat-apps-design.md`.

### 2.1 By group

**Spec and wire types**

| File | Lines |
|---|---|
| `docs/superpowers/specs/2026-10-14-chat-apps-design.md` | 817 |
| `docs/verification/rich-tables.md` | 52 |
| `docs/verification/chat-polish.md` | 74 |
| `packages/phone-protocol/src/app.ts` | 570 |
| `packages/phone-protocol/src/app-rpc.ts` | 39 |
| `shared/app-samples.ts` | 139 |
| `shared/app.test.ts` | 190 |
| `apps/docs/content/docs/changelog/index.mdx` | 15 |

**Server: bot pages**

| File | Lines |
|---|---|
| `server/chat-apps.ts` | 659 |
| `server/chat-apps.test.ts` | 886 |
| `server/chat-apps.e2e.test.ts` | 102 |
| `server/routes/chat-apps.ts` | 175 |
| `server/routes/chat-apps.test.ts` | 284 |
| `server/routes/bot-page-rpc.ts` | 141 |
| `server/routes/bot-page-rpc.test.ts` | 238 |
| `server/routes/bot-messages-apps.test.ts` | 394 |
| `server/chat-pages.e2e.test.ts` | 140 |
| `server/open-page.ts` | 31 |
| `server/drivers/agents-app-tools.ts` | 23 |

Ranges: `server/drivers/chat-mcp-tools.ts` (953) 1-30, 285-330, 540-600,
780-790, 855-872. `server/index.ts` (15217) 239, 468, 471, 7778-7792,
9668-9674, 11900-11910, 11940-11951, 12190-12204, 12442, 12715-12730,
12835-12880. `server/message-db.ts` (1000) 23-24, 40-170, 195-237,
414-476, 670-690. `server/system-prompt.ts` (349) 81, 86-112, 305-316.
`server/store.ts` 1133-1150, 1234-1248. `server/app-docs.ts` (203) 1-12,
85-150. `server/drivers/agents-call-cards.ts` (91) 1-70.
`packages/phone-protocol/src/agents-tool-names.ts` 1-75.

**Server: MCP applications**

| File | Lines |
|---|---|
| `server/chat-apps-mcp.ts` | 501 |
| `server/chat-apps-mcp.test.ts` | 517 |
| `server/chat-apps-mcp.e2e.test.ts` | 116 |
| `server/mcp-app-observer.ts` | 241 |
| `server/mcp-app-observer.test.ts` | 359 |
| `server/mcp-app-catalog.ts` | 163 |
| `server/mcp-app-connections.ts` | 334 |
| `server/mcp-app-connections-box.test.ts` | 113 |
| `server/mcp-app-mounts.test.ts` | 152 |
| `server/mcp-app-cancellation.test.ts` | 197 |
| `server/host/mcp-servers-host.ts` | 261 |
| `server/drivers/codex-app-approval.ts` | 99 |
| `server/testing/fake-stdio-app-server.ts` | 128 |

Ranges: `server/mcp-registry.ts` (592) 25-90, 158-170, 230-240, 262-272,
360-372, 402-432, 500-540. `server/drivers/codex.ts` 725-750, 840-850.

**Shared frame core**

| File | Lines |
|---|---|
| `shared/app-frame/bridge.ts` | 529 |
| `shared/app-frame/bridge.test.ts` | 580 |
| `shared/app-frame/bridge-sdk.test.ts` | 141 |
| `shared/app-frame/csp.ts` | 148 |
| `shared/app-frame/csp.test.ts` | 151 |
| `shared/app-frame/document.ts` | 116 |
| `shared/app-frame/document.test.ts` | 121 |
| `shared/app-frame/helper.ts` | 353 |
| `shared/app-frame/helper.test.ts` | 374 |
| `shared/app-frame/host-page.ts` | 235 |
| `shared/app-frame/host-page.test.ts` | 166 |
| `shared/app-frame/app-host.html` | 10 |
| `shared/app-frame/heading.test.ts` | 147 |
| `shared/app-frame/jsx-page.ts` (role only) | 294 |
| `shared/app-frame/point.ts` (role only) | 293 |

**Desktop UI of the frames**

| File | Lines |
|---|---|
| `src/components/app/app-api.ts` | 144 |
| `src/components/app/app-blocked.ts`, `app-blocked.test.ts` | 17, 41 |
| `src/components/app/app-frame-host.ts`, `app-frame-host.test.ts` | 296, 378 |
| `src/components/app/app-host-context.ts`, `app-host-context.test.ts` | 128, 51 |
| `src/components/app/app-pool.ts`, `app-pool.test.ts` | 185, 191 |
| `src/components/app/AppChrome.tsx` | 202 |
| `src/components/app/AppFrame.tsx` | 134 |
| `src/components/app/AppMessage.tsx`, `AppMessage.test.ts`, `AppMessage.compact.test.ts` | 407, 372, 339 |
| `src/components/app/PageTools.tsx`, `PageTools.test.ts` | 377, 307 |
| `src/components/app/PointedChips.tsx` | 55 |
| `src/components/app/SaveAsApp.tsx`, `SaveAsApp.test.ts` | 53, 108 |
| `src/components/McpAppsSwitch.tsx`, `McpAppsSwitch.test.ts` | 39, 67 |
| `src/lib/hosted-mcp-apps.ts`, `hosted-mcp-apps.test.ts` | 160, 69 |
| `scripts/smoke-app-frames.mjs` | 387 |

Ranges: `src/locales/en.json` 7405-7409, 8136-8164, 8203-8246, 9922-9929.
`src/components/RichMessageRow.tsx` was read completely by the next group.

**Tables and chat polish**

| File | Lines |
|---|---|
| `src/components/RichTable.tsx`, `RichTable.test.ts`, `RichTable.fit.test.ts` | 225, 97, 117 |
| `src/components/MarkdownTable.tsx` | 44 |
| `src/components/TableFilePreview.tsx` | 100 |
| `src/components/HtmlFilePreview.tsx`, `.test.ts`, `.dom.test.ts` | 197, 102, 59 |
| `src/components/RichMessageRow.tsx` | 74 |
| `src/lib/table-data.ts`, `src/lib/table-fit.ts`, `src/lib/table-file.worker.ts` | 82, 31, 6 |
| `scripts/verify-rich-tables.ts` | 51 |
| `scripts/testing/check-rich-tables.mjs` | 107 |
| `scripts/testing/rich-table-composer-ui.e2e.test.ts` | 105 |
| `src/components/ShortcutHint.tsx`, `ShortcutHint.test.ts` | 12, 27 |
| `src/components/SettingsPrimitives.tsx` | 380 |
| `src/components/ToolActivity.tsx` | 82 |
| `server/tool-summary.ts` | 122 |
| `scripts/verify-chat-polish.ts` | 53 |

Ranges: `src/lib/copy-text.ts` (156) 3-9, 63, 74-143.
`src/lib/table-data.test.ts` 25-50. `src/components/AttachmentPreview.tsx`
224-249. `src/lib/keyboard-shortcuts.ts` (278) 1-60, 100-120, 245-278.
`src/components/settings/settings-index.ts` (344) 160-200, 265-344.
`src/components/settings/SettingsNav.tsx` (381) 150-381.
`src/components/settings/SettingsWindow.tsx` (219) 60-140.
`server/host/message-pages.ts` 8, 20-34. `server/routes/threads.ts` 190-215.
`server/tool-summary.test.ts` 15-66. `electron/save-file.mjs` 185, 190-229.
`src/locales/en.json` 116-174, 1033-1045, 1082, 1324-1329, 11427-11453.

### 2.2 Checks of the verifier and the main session

The verifier opened the cited lines of each key claim. Its result:

- **Partly right, now correct in this file:**
  1. The rpc route takes only the four MCP methods, and any other method
     gets 400. This is true only for an MCP row. For a bot page the same
     route also takes the six page methods, and any other method gets 404
     "That app has no server to call." (`server/routes/chat-apps.ts:121-123,
     141-165`).
  2. An app's change runs only at Full access. Two more kinds of tool run at
     any level: a read-only tool, and an app-only tool that is not marked
     destructive (`server/chat-apps-mcp.ts:333-336`).
  3. The full-screen view came from `371854811`. That commit added a pane
     beside the chat, and `9c701e24b` removed it the next day. The full
     screen of today comes from `9c701e24b`.
  4. The catalog file name is set at `server/chat-apps-mcp.ts:134`, not in
     `mcp-app-catalog.ts`.
  5. The throttle of 10 minutes is only for automatic probes. A change to a
     remote server queues a probe with no throttle
     (`chat-apps-mcp.ts:412-417, 433-435`).
- **Spec against code:** the cap of domains is 64, not 16 (`csp.ts:63`).
  `ui/message` from a bot page fills the message box and does not send.
  Apps show in rooms, view-only. The spec has an Allow bar in its Decision
  10 (spec:72-73) and says there is none in spec:312-316 and spec:482. The
  code has none.
- **The main session read again:** `shared/app-frame/csp.ts:11-25`,
  `app-frame-host.ts:5-7`, `chat-apps-mcp.ts:218-256, 331-337`,
  `mcp-app-connections.ts:239-243, 251, 292`, `app-pool.ts:5-11`,
  `AppMessage.tsx:205-210`, `table-data.ts:3-6, 77-82`,
  `HtmlFilePreview.tsx:14, 196`, `chat-apps.ts:411-417, 445-457`,
  `routes/chat-apps.ts:86-98, 111-140`, `mcp-app-catalog.ts:43-52`,
  `mcp-app-observer.ts:1-4, 233-239`, `index.ts:12855`,
  `app-docs.ts:11-12, 93-99`, `bridge.ts:22-40`, `server/page-files.ts:1-27,
  91-142` and `server/request-auth.ts:410-420`. All agree with this file.

## 3. How it works

### 3.1 A bot shows a page (`show_html`)

1. The model has one page tool, `show_html`, on the bot's own "agents" MCP
   server (`server/drivers/agents-app-tools.ts:3-21`). The input schema has
   `html`, `jsx`, `path`, `title`, `height`, `fallback_text`, `frameless`,
   `live`, `uses` and `app_id`, and refuses other keys (`:6-21`). The
   description gives the model these rules (`:5`):
   - no network requests, storage, popups or form posts.
   - scripts only from three CDNs and Google Fonts.
   - at most 256 KB.
   - "Call again with its app_id to replace it".
   - "Never put secrets in it".
   - "In rooms everyone sees it, view-only".
2. The agents proxy parses the input (`parseShowHtmlInput`). On an error it
   gives the error text to the model as an error result
   (`server/drivers/agents-call-cards.ts:17-20, 36`). Else it posts
   `{tool, html|jsx|path, title, height, fallback_text, frameless, live,
   uses}` to `POST /api/internal/options-card` with the token of the turn
   (`:25-35`).
3. The server checks the internal capability of the turn. No capability
   gives 401. The bot must exist (`server/index.ts:12720-12728`). The
   conversation of the turn must belong to the sender, else 403 "source
   conversation does not belong to sender" (`:12846-12848`). The conversation
   comes from the capability, not from the input of the model (`:12851-12856`).
   For a conversation that a Cloud guest drives, the server forces
   `frameless: false` (`:12855`).
4. `createAgentCard` sends `show_html` to `createAppCard`
   (`server/chat-apps.ts:106-130`). The limits
   (`packages/phone-protocol/src/app.ts`):
   - exactly one of `html`, `jsx` or `path`, else "Send one of html, jsx or
     path." (`:311`).
   - `html` or `jsx` at most 256 KiB of UTF-8 after trim (`:12, :293-295`).
   - a fragment with no `<html` or `<body` tag is wrapped in a whole
     document with `<meta charset="utf-8">` (`:283-286`).
   - `jsx` needs `export default` (`:305`) and must compile, else the error
     has its line: "jsx: line 2: Unexpected token. Fix it and send the whole
     file again." (`chat-pages.e2e.test.ts:83, 89`).
   - `path` at most 4,096 characters (`:314`). It must be a folder with an
     `index.html` inside the bot's own folders: outside gives 403, missing
     gives 404, no `index.html` gives 400 (`chat-apps.ts:69, 81-90`).
     Hidden files (`.env`, `.git/`) and unknown types are left out with a
     note (`chat-apps.test.ts:283-299`).
   - `title` one line, 1 to 80 characters (`app.ts:325-330`).
   - `height` is clamped to 80..720 and rounded, not refused
     (`:460-462`).
   - `fallback_text` at most 1,500 characters (`:464-468`).
   - `live` only with `path` (`:341`).
   - `uses`: `data`, `state` and connector tools. At most 8 apps or servers
     and 24 tools. No `*`, no `composio`, no tool that ends in
     `_MANAGE_CONNECTIONS` or `_WAIT_FOR_CONNECTIONS` (`:355-362, 390,
     404-405`).
5. The server removes secrets from the HTML, the title and the fallback text
   with `redactSecretsInText`. The result says `masked` when it changed
   something (`chat-apps.ts:45-49, 101-102, 154`).
6. The server stores the page in AppDocs, a store keyed by content (the
   SHA-256 of the HTML and its data) under `<DATA_DIR>/app-docs`
   (`chat-apps.ts:92-96, 513`, `server/app-docs.ts:120-124`). It writes a
   temporary file with mode 0600 and renames it (`app-docs.ts:96-98`). The
   store has a ceiling of 512 MiB (`:11`). When the store refuses, the row
   is still written with `doc: ""` and `blocked: "too-large"`
   (`chat-apps.ts:144, 150`).
7. The server appends the row: role bot, kind `app`, text = the fallback
   text, and `app` = `{v: 1, source: "html", title, doc, rev: 0, bytes,
   height?, border, live?, network}` (`chat-apps.ts:142-152`). The fallback
   text is the given `fallback_text`, or `[App] <title>` and up to 600
   characters of the visible text (`app.ts:523-528`).
8. The route answers 201 `{messageId, masked?, leftOut?}`
   (`index.ts:12857-12858`). The tool result is: `Shown as app <id>. To
   change it, call show_html again with app_id "<id>".`
   (`agents-call-cards.ts:43`).

### 3.2 A bot replaces a page, and the versions

1. A `show_html` call with `app_id` is the "update" form. The old tool name
   `update_html` is now only an alias for it, for an engine session, a saved
   skill or a memory that still uses the old name
   (`packages/phone-protocol/src/agents-tool-names.ts:27, 34-35, 63`).
   Without `app_id`, the alias gets an empty id, so it refuses instead of
   making a new page (`:42-43`).
2. `app_id` must match `^[\w-]{1,128}$` (`app.ts:475`).
3. The row must be in this conversation and, when it has `from`, belong to
   this bot. Else 404 "No page with that id in this conversation."
   (`chat-apps.ts:23, 156-157`). An MCP row gives 409 (`:158`).
4. `replacePage` (`chat-apps.ts:166-199`):
   - when the new call does not name `uses`, the old `uses` and connectors
     stay (`:170-172`).
   - the same document and title change nothing (`:178-182`).
   - else it drops `context`, `blocked`, `format` and `live`, puts the old
     document id into `history`, keeps the last 9 (`APP_PAGE_VERSIONS - 1`,
     `app.ts:68`) and adds 1 to `rev` (`:184-190`).
   - it patches the same row: the same message id (`:198`).
5. The tool result is `Updated app <id>.` (`agents-call-cards.ts:40-44`).
6. The window fetches an old version with `?rev=N`. A version that is no
   longer kept gives 404 `serverError.page.versionGone`
   (`routes/chat-apps.ts:82-83, 105`, `chat-apps.ts:209-215`).
7. Edge case: a deleted row gives 404 to the model as an error result
   (`chat-apps.e2e.test.ts:50`).

### 3.3 The server builds the frame document

1. The window asks `GET /api/threads/:t/messages/:m/app[?rev=N]`
   (`routes/chat-apps.ts:61`). The route refuses:
   - an unknown conversation, with 404, before the store can make it
     (`:77-78`).
   - a viewer who cannot see the conversation, with 404 (`:79-80`).
   - a row that is not an app row, with 404 "no app on that message" (`:81`).
   - a `rev` that is not 1 to 6 digits, with 400 (`:82-83`).
   - a document that is not stored, with 404 "This app's page is not stored
     on this computer." (`:105`).
2. The answer has `cache-control: private, no-store`, because `can` and
   `blocked` change (`:106-107`).
3. `buildSrcdoc` writes, in this order (`shared/app-frame/document.ts:33-40`):
   1. `<!DOCTYPE html><meta http-equiv="Content-Security-Policy"
      content="...">`, with the policy escaped (`:10-14`).
   2. a `<base href>` for a folder page only.
   3. for a bot page only: the theme style, the helper (or the room helper)
      and the Point script (`:36-37`).
   4. the content, after it removes a leading BOM, white space, comments,
      `<?...>`, `<!...>` and the page's own doctype (`:16-31`). No byte of
      the page comes before the CSP tag.
4. The CSP of a bot page (`shared/app-frame/csp.ts:11-25`):
   - `default-src 'none'`.
   - Scripts with `'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'` from
     `cdnjs.cloudflare.com`, `cdn.jsdelivr.net` and `unpkg.com`.
   - Styles also from `fonts.googleapis.com`. Fonts also from
     `fonts.gstatic.com`.
   - Images from `data:`, `blob:` and the CDNs.
   - `connect-src` only the three CDNs. `worker-src blob:`.
   - `frame-src`, `object-src`, `base-uri`, `form-action` and
     `manifest-src` are `'none'`.
   - Images from other hosts are refused, so a page cannot load a tracking
     pixel (`:2-3`).
5. A folder page adds its files folder to the source lists and to
   `connect-src`, sets `base-uri` to that folder, and allows
   `https://extensions.duckdb.org` in `connect-src` (`csp.ts:46-57`). The
   folder URL is `/api/page-files/<token>/`. The token is 32 random bytes
   (43 characters), one for each viewer and document, kept in memory, at
   most 5,000, and forgotten after a day unused (`server/page-files.ts:1-12,
   25-27, 133-142`). The route answers before the sign-in gate, so the token
   is its whole authority. It answers only while the viewer can still see
   the conversation and the document is the current version or a kept one
   (`page-files.ts:1-7`, `chat-apps.ts:543-546`).
6. The CSP of an MCP application (`csp.ts:121-139`) uses the domains that
   the server declares in `_meta.ui.csp`, after a filter (`:82-119`):
   - only `https://host[:port]`, or `wss://` in the connect list. An entry
     with a path, query, fragment, user, quote, semicolon, comma, backslash
     or space is refused.
   - `*.` only as the leftmost label, with at least two labels after it, so
     `*.com` and `*` are refused.
   - `http://localhost` and `http://127.0.0.1` only when the MCP server is a
     command or a loopback server (`:93-96`).
   - at most 64 domains in each list (`:63`). The rest go to
     `network.refused`, cut to 120 characters (`:64, 115`).
   - `frameDomains` and `baseUriDomains` are ignored (`:4-5`).
   - `connect-src 'none'` when the connect list is empty, no `'self'`,
     because the origin is opaque (`:121, 132`).
7. `can` (what the frame may ask) is `BOT_HTML_CAN` for a bot page: no
   server tools or resources, but messages, links and model context
   (`document.ts:55`). Declared `uses` add `data`, `state` and `connectors`
   (`:81-86`). In a room it is `ROOM_CAN` (section 3.9). For an MCP row,
   `access()` computes it each time (section 3.7).

### 3.4 The window shows the frame

1. `RichMessageRow` draws `AppMessage` for a message of kind `app`
   (`src/components/RichMessageRow.tsx:34-35`). A row with no valid payload
   shows its text (`AppMessage.tsx:82-86`).
2. Only the newest 20 app rows of a conversation mount by themselves. An
   older row shows "Open app" (`app-pool.ts:10`, `AppMessage.tsx:59-70`,
   `AppChrome.tsx:190`).
3. An `IntersectionObserver` with a margin of 300 px asks the pool for a
   slot when the row comes into view (`app-pool.ts:158-166`).
4. The pool has 3 live frames for each window (`app-pool.ts:5-11`). When it
   is full, it tears down the frame that left the view longest ago, or else
   the visible frame that came into view first (`:41-52`). The new frame
   waits until that teardown ends. A frame that is in teardown still holds
   its slot (`:37-38, 54-74`).
5. With a slot, the row fetches the document with `?origin=<window
   origin>` (`src/components/app/app-api.ts:42-53`). A document younger
   than 60 s is used again, except on Reload (`AppMessage.tsx:25, 150-152`).
   Error paths:
   - no answer: the strip "Reconnect to use this app" and "Try again"
     (`AppMessage.tsx:243-246`).
   - a server error: the server's sentence, state "unavailable"
     (`:246, 257`).
   - a body with no `srcdoc` string or no `can`: "The app's page did not
     arrive whole." (`app-api.ts:46`).
6. `mountAppFrame` makes the iframe with `sandbox="allow-scripts
   allow-forms"`, `referrerpolicy="no-referrer"` and no `allow` attribute
   (`app-frame-host.ts:174-190`). It adds the `message` listener first and
   sets `srcdoc` after it (`:240-243`). The frame origin is `"null"`
   (`scripts/smoke-app-frames.mjs:302`).
7. The height starts at the cached height of this version, else the
   `height` of the payload, else 520 px for a page or 160 px for an MCP
   application (`AppMessage.tsx:110-111`, `PageTools.tsx:27`,
   `bridge.ts:25`). A size report is clamped to 48 px .. the maximum. The
   maximum is min(720, 70% of the window height) (`app-host-context.ts:96-99`).
   A page is capped at 560 px (`PageTools.tsx:27`).
8. Teardown: the host sends `ui/resource-teardown` and waits at most 1 s for
   the answer (`bridge.ts:29, 504-520`). When a row unmounts, the frame
   moves to a hidden, inert parking element and the teardown runs there
   (`app-frame-host.ts:269-293`). A new version of a page tears down the old
   frame first, and the new frame keeps the height (`AppMessage.tsx:155-156,
   179-182`).
9. Edge cases: the pool has no time limit of its own. A teardown that never
   ends would keep its slot, but the bridge ends each teardown after 1 s
   (`app-pool.ts:68-72`, `app-frame-host.test.ts:275-288`). There is no load
   time limit and no fetch time limit for a document (section 9). The
   full-screen frame is mounted outside the pool (`PageTools.tsx:369-372`).

### 3.5 The bridge: the handshake and the methods

1. The bridge drops a message, with no answer, when (`bridge.ts:136-150,
   479-481`):
   - `event.source` is not the frame's own window. This is the only origin
     check. It compares windows, not origin strings.
   - it is not JSON-RPC 2.0, or it is a batch.
   - it is larger than 1,000,000 bytes of UTF-8.
   - the method or a string id is longer than 200 characters.
2. The frame sends `ui/initialize`. The host answers with
   `protocolVersion: "2026-01-26"`, `hostInfo {name: "<app>", version}`,
   `hostCapabilities` and `hostContext` (`bridge.ts:381-389`). The host
   context has the theme, about 70 style variables with resolved values,
   `displayMode: "inline"`, the size, the locale, the time zone, the
   platform, the device capabilities and the user agent `<app>/<version>`.
   It has no token and no user id (`app-host-context.ts:114-128`).
3. Until the frame sends `ui/notifications/initialized`, the host answers
   no other request, not even with an error (`bridge.ts:390-391`). After
   it, an MCP application gets `tool-input` and then `tool-result`, one time
   each (`:328-333`).
4. The methods that the host answers (`bridge.ts:381-444`):
   - `ping` gives `{}`.
   - `ui/request-display-mode` always gives `{mode: "inline"}`.
   - `ui/open-link`: needs `can.openLinks` and engagement, only `http:` or
     `https:`, no user name or password, at most 2,048 characters, 1 each
     2 s (`:397-409, 175-182, 37`).
   - `ui/message`: needs `can.message` and engagement, text only, role
     `user`, 1 to 4,000 characters. At most 1 each 3 s and 10 each 10 minutes
     (`:410-423, 36`). A waiting model context goes first (`:417`).
   - `ui/update-model-context`: needs `can.modelContext`, no engagement.
     The latest wins, at most one each second (`:424-439, 32`).
   - `tools/call`, `tools/list`, `resources/read`, `resources/list`: only
     for an MCP application, and only when `can` allows (`:341-357`).
   - `<app>/data/query`, `<app>/state/get|set|keys`,
     `<app>/connectors/call|list`: only for a bot page that declared them
     (`:362-378`).
   - server calls and page calls share one limit: 10 each 10 s and 120 each
     10 minutes (`:38, 349, 371`).
5. Any other method gets -32601 "Method not found", for example
   `ui/download-file`, `sampling/createMessage` and `prompts/list`
   (`bridge.test.ts:166-173`). Unknown notifications are dropped
   (`bridge.ts:470-471`). Logs from the frame are kept up to 50 each minute
   (`:33, 464-466`).
6. Engagement on the desktop: focus came into the frame while the pointer
   was over it or within 40 px of it, or a Tab press came within 1 s, and
   the window has focus. A frame that takes focus by itself is not engaged
   (`app-frame-host.ts:11-14, 29-89`, `smoke-app-frames.mjs:374-377`). On a
   phone: a touch within 10 s (`bridge.ts:31`, `host-page.ts:182`).
7. Side channels beside the bridge: text selection
   (`<app>/notifications/selection`, at most 12,001 characters), the page
   heading (`<app>/notifications/heading`) and the Point messages
   (`helper.ts:44-51`, `point.ts:15-18`). The host reads them only from the
   frame's own window (`app-frame-host.ts:222`, `point.ts:76-79`).
8. Phones use the same bridge in a host page, `app-host.html`, which is a
   built bundle with a SHA-256 on its first line. The iOS and Android code
   checks that each message comes from the main frame of that page
   (`host-page.ts:1-34`, `host-page.test.ts:39-49`).

### 3.6 MCP applications: from a tool call to an app row

1. **The catalog** (`server/mcp-app-catalog.ts`): the file
   `DATA_DIR/mcp-app-catalog.json` (`chat-apps-mcp.ts:134`). Each entry is
   keyed by the server name and a hash of its configuration. The hash leaves
   out the headers, so a new sign-in token is the same server, and the
   restart count, so a restarted server keeps its apps. Only the hash is
   stored, never a credential (`mcp-app-catalog.ts:43-52`). An entry is
   stale after 7 days (`:11`). It is written to a temporary file with mode
   0600 and renamed (`:98-108`). A file that cannot be read counts as empty
   (`:86-96`).
2. **How the catalog learns:** from the Settings "Test" (`chat-apps-mcp.ts:425-431`),
   from each tool list of the server's own app connection (`:141-147`), from
   each observed call (`:257`), and from background probes. A probe:
   - runs one at a time on one chain, up to 45 s each (`:28-29, 422, 452`).
   - for a turn whose bot may use a server with a stale entry, at most each
     10 minutes for each server (`:412-417, 464`).
   - 20 s after start, only for remote servers with a stale entry
     (`:24, 472-478`).
   - never starts a command server that no turn would start (`:407-408`).
   - skips a server of one person, a disabled server, a server with apps
     off, a `runsOn` server, a server that needs sign-in and a server whose
     key is off (`:442-448`).
3. **Turn mounts:** when the driver has the capability `customMcp`,
   `turnMounts` adds `integrations.mcpApps[name] = {extension}` for each
   server that has apps (`index.ts:7782-7786`, `chat-apps-mcp.ts:458-468`).
   A command server is wrapped in an observing `mcp-gate` with the variable
   `OMB_GATE_APPS`. A URL server goes through an observing
   `mcp-remote-proxy` with `OMB_REMOTE_MCP_APPS`. The variable holds the
   harness URL and the comms token of the turn. Only the innermost
   component observes, so a call is reported one time
   (`mcp-app-mounts.test.ts:30-63`, `mcp-app-observer.test.ts:256-272`).
4. **The proxy** adds the UI extension to `initialize`. A server that
   refuses it gets a second `initialize` without it, and the catalog records
   `uiExtension: "refused"` (`mcp-app-observer.ts:79-84`,
   `mcp-app-connections.ts:123-140`). The proxy removes the app-only tools
   from `tools/list` and refuses a model call to one with -32602 "This tool
   belongs to an app view." (`mcp-app-observer.ts:10, 74-77`).
5. **The observer** sees a result of a tool whose definition has a `ui://`
   page (`_meta.ui.resourceUri`, or the old flat key `_meta["ui/resourceUri"]`,
   at most 2,048 characters) (`mcp-app-observer.ts:54-59`). It builds a
   report from the whole result, before anything cuts it (`:210`). The
   report must fit in 900 KiB: first it drops `structuredContent` and sets
   `oversized`, then it keeps only text blocks, then it cuts the text. When
   the arguments alone are too large, it sends nothing (`:127-148`). It
   posts the report to `/api/internal/options-card` with the token, with a
   time limit of 10 s, and does not wait for it. A failure goes only to the
   log (`:150-172, 233-239`). "A report never delays or alters what is
   relayed to the engine." (`:1-4`).
6. **`recordMcpAppCall`** (`chat-apps-mcp.ts:193-260`):
   - refusals: no bot gives 404. A bad shape gives 400. No `ui://` page
     gives 400 "That tool has no app.". A server that is not mounted or not
     in the tool scope gives 404. Apps off gives 409 "Apps are off for that
     server." (`:198-213`). A room gets no row.
   - it reads the page with `resources/read`, with a time limit of 30 s and
     a cache of 10 minutes (`:160-191`). The MIME type must be
     `text/html;profile=mcp-app`, else `unavailable`. More than 2 MiB gives
     `too-large`. 401 gives `signed-out`.
   - it stores the HTML and `{tool, toolInput, toolResult, network}` in
     AppDocs and appends the row with `source: "mcp"` (`:239-255`). A page
     that cannot be read still gives a row, with `doc: ""` and `blocked`
     (`:250-252`).
   - the row text is `<server title> · <tool title>` and up to 600
     characters of the text result, with secrets removed (`:253-255`,
     `app.ts:530-537`). The stored tool result is not redacted (`:220-225`,
     spec:813). Section 8 has this point.
7. Each call of the server outside a turn uses the server's own app
   connections (`server/mcp-app-connections.ts`):
   - at most 6 open, the least recently used is closed first (`:16, 239-243`).
   - closed after 5 minutes idle (`:15, 257-260`).
   - 30 s to open (`:251`, `server/mcp-http.ts:41`).
   - the tool list is cached 60 s and dropped on `list_changed` (`:17,
     246-249`).
   - a command server starts in the bot box when the box is on
     (`:49-55`, `mcp-app-connections-box.test.ts:34-70`).
   - stderr is drained and never kept, "may carry secrets" (`:63-64`).
   - a cancel sends `notifications/cancelled` (`:108-112`). A cancel or a
     JSON-RPC error keeps the connection. A lost transport closes it, and
     the next request opens a new one (`:292`).

### 3.7 An MCP application calls its server

1. The frame calls `POST /api/bots/:bot/apps/:row/rpc` with `{threadId,
   method, params}` (`app-api.ts:83-99`). The route reads at most 64 KiB +
   16 KiB (`routes/chat-apps.ts:114`).
2. The route refuses (`routes/chat-apps.ts:115-168`):
   - no `threadId`: 400, no bot: 404.
   - a room: 409 `ROOM_VIEW_ONLY`.
   - a conversation that is not a task of this bot: 404.
   - a Cloud guest conversation: 403.
   - a row that is not in this conversation, or is from another bot: 404.
   - a bot page that asks an MCP method: 404 "That app has no server to
     call.".
   - a method that is not one of the four: 400.
3. `chatAppsMcp.rpc` (`chat-apps-mcp.ts:379-405`):
   - signed out: 401 with `signIn: {server}`. The window shows "Sign in to
     <server> again" (`:391-392`).
   - server removed, disabled or apps off: 410 with `blocked` (`:393`).
   - more than 60 calls each minute for this row: 429 (`:149, 394`).
   - the server is the one in the row's own `mcp.server`. The frame cannot
     name another server (`:395`).
4. `tools/call` (`chat-apps-mcp.ts:307-338`):
   - the tool must exist and list `app` in its visibility, else 403.
   - a tool that the model can also see must be in the bot's tool
     selection. An app-only tool needs only the server in scope
     (`:308-314`).
   - arguments at most 64 KiB and valid for the schema, else 400
     (`:326-330`).
   - **the approval rule:** the call runs when the tool is read-only, or
     when it is app-only and not marked destructive, or when the bot is at
     Full access for this conversation. Else 403 -32000: "This bot asks
     before it changes anything, so its apps can only look. Ask the bot to
     make the change, or set it to Full access." No card is drawn
     (`:31-32, 331-337`).
   - the time limit is 120 s for `tools/call` and 30 s for the other
     methods (`:25-26, 338`). `resources/read` takes a URI of at most 2,048
     characters and gives 413 above 8 MiB (`:297-299`).
5. A change that runs, by a tool the model can also see, writes `app.done`
   on the row: the tool, a short text and an `https` link. The window shows
   "Done: <tool>" after a reload (`chat-apps-mcp.ts:340-344`,
   `app.ts:88-98, 545-558`, `AppChrome.tsx:157-165`).
6. Errors: 401 from the server means sign in. A JSON-RPC error gives 502
   with the detail cut to 1,000 characters, and the configured URL, header
   and environment values replaced by «redacted». Anything else, a time
   limit included, gives 502 "The app's server could not be reached."
   (`chat-apps-mcp.ts:286-291, 400-404`).
7. Each call is logged with the method and the tool name, never the
   arguments (`chat-apps-mcp.ts:383-387`).
8. `access(row, threadId)` runs each time a row opens
   (`chat-apps-mcp.ts:262-281`). These cases block the row: a removed
   server, a disabled server, apps off, a sign-in that is due, or a bot
   that lost the server. A blocked frame keeps messages, links and model
   context. It loses server calls and gets `blocked` with a sentence.

### 3.8 A frame talks back: a message and model context

1. **A message from a bot page in the chat** goes into the message box as a
   draft. Nothing is sent. The person presses Send (`AppMessage.tsx:205-210`,
   commit `972069a3c`).
2. **A message from an MCP application** (or from a page pinned to the
   sidebar, where no message box shows) is sent. The window first saves a
   bot setting that waits (`flushBotPatches`), then posts
   `POST /api/bots/:bot/messages` with `{threadId, sendId, appMessage:
   {messageId, text}}` (`AppFrame.tsx:87-93`, `app-api.ts:111-120`).
3. The send route checks that the app row is in this conversation and that
   the text has 1 to 4,000 characters. It allows at most 20 each hour for
   each row. A retry with the same `sendId` is free. A refused send gives
   its slot back (`chat-apps.ts:400-443`, `bot-messages-apps.test.ts:138-207`).
   Not with
   `widgetAction`, and never through a guarded send (`:159-172`).
4. The message is stored as a user line with `replyToId` = the app row and
   `fromApp {messageId, title}`. The window shows "Sent from <title>"
   (`RichMessageRow.tsx:62-69`). The prompt says: "The current message was
   sent from an app shown in this chat after the person pressed something
   in it: <title> (a page you made with show_html)."
   (`bot-messages-apps.test.ts:138-157`).
5. **Model context:** `POST /api/bots/:bot/apps/:row/context` with
   `{threadId, content?, structuredContent?}` (`app-api.ts:101-106`). The
   server joins the text blocks and the JSON, cuts to 4,000 characters,
   removes secrets, and stores `{text, at, delivered: false}` on the row.
   Empty content clears it (`chat-apps.ts:321-345`). At most 120 each
   minute for each row (`routes/chat-apps.ts:70, 137-138`).
6. The next accepted message of the person, by start, steer or queue, gets
   one block for each row with context that is not delivered. The block is
   inside `--- app context ---` fences with a note that it is untrusted
   content. The app text cannot close the fence (`chat-apps.ts:348-392`).
   The row is marked delivered only when `at` did not change in between
   (`:378-385`). A retry of an accepted send carries no context
   (`bot-messages-apps.test.ts:227-257`).

### 3.9 Rooms: everything is view-only

1. A room shows pages, applications and widgets to all members, with the
   same sandbox and CSP (commit `65c67319d`).
2. The document has `room: true` and `ROOM_CAN`: no message, no model
   context, no server calls, but links open "for whoever clicks them, and
   nothing acts for anyone" (`document.ts:56-57, 76, 112`). An MCP row loses
   its `blocked` in a room (`:113`).
3. The room helper makes `send` and `setContext` do nothing
   (`helper.ts:305-306, 314-315`).
4. The bridge refuses `ui/message` and `ui/update-model-context` with
   `ROOM_VIEW_ONLY`: "In a room, pages, apps and widgets are view-only: they
   cannot send messages or tell a bot what anyone sees." (`app.ts:222`).
5. The server refuses context, rpc and `appMessage` for a room with 409
   (`routes/chat-apps.ts:123-126`, `bot-messages-apps.test.ts:174-188`).
6. A folder page's files token is the viewer's own and stops when the
   viewer can no longer see the room (`routes/chat-apps.test.ts:195-212`).

### 3.10 Page data, state and connectors (beyond the spec)

1. A page declares `uses` in `show_html`. Each call answers only for what
   the current version declared, else 409 with a sentence that names the
   declaration (`server/routes/bot-page-rpc.ts:119-122`, `bridge.ts:185-191`).
2. **Data:** one `SELECT` on the bot's own database. At most 5,000 rows,
   1,000,000 bytes, 20,000 characters of SQL and 10 s. Over the byte limit
   it removes 10% of the rows at a time until the JSON fits, and sets
   `truncated` (`bot-page-rpc.ts:58-92`, `app.ts:35-38`). Writes, `ATTACH`,
   `COPY TO`, `INSTALL`, several statements and `read_csv('/etc/hosts')` are
   refused with 409 "A page runs one SELECT on its bot's own tables and
   views." (`bot-page-rpc.test.ts:87-102`). During a backup it answers 503
   (`bot-page-rpc.ts:23, 60`).
3. **State:** a small store for each conversation and row, shared by all
   versions of the page, under `<DATA_DIR>/app-state`. Key at most 200
   characters, value at most 64 KiB, 256 KiB and 200 keys in all
   (`app.ts:40-43`, `chat-apps.ts:464-465, 514`).
4. **Connectors:** a page may call only the connector tools that it
   declared. The call runs with the viewing person's own connection and the
   bot's grants (`app.ts:62-64`). The person needs the level "chat" or
   "edit" (403 "Only someone who can chat with <bot> can use this page's
   connected apps.") (`routes/chat-apps.ts:145-152`). A change needs Full
   access and a click. The host sets `engaged`, and a value that the page
   sends is dropped (`bridge.ts:244-248`, `chat-apps-mcp.test.ts:494-506`).
   Limits: 64 KiB of arguments, 512 KiB of result, 60 s, 30 calls each
   minute for each page (`app.ts:49-54`).
5. These page calls need the viewer to see the conversation, else 404
   (`routes/chat-apps.ts:133-135`). Context and MCP rpc do not have this
   check (section 8).

### 3.11 Other page tools (owned by other features)

These are on the same row. This file records only how they touch it:

- **Live folder page:** `show_html {path, live: true}` reloads when the
  folder changes. The server checks every 5 s, watches the 50 newest live
  rows, retries a failed read after 60 s and waits during a backup. After a
  restart it lists the live rows again from SQLite (`chat-apps.ts:495-498,
  550-614`, `server/message-db.ts:682-685`).
- **Download:** `GET .../app/download` gives the HTML as
  `application/octet-stream` with `content-security-policy: sandbox`,
  `nosniff` and `no-store`. "a bot's page is untrusted HTML; it leaves only
  as opaque bytes to save, never to render." A folder page with files gives
  409 (`routes/chat-apps.ts:84-98`).
- **Publish:** `POST .../app/publish {rev}` makes a static copy at
  `https://<pageId>.<app>.page/`. The published copy has no CSP
  (`document.ts:50-53`, `chat-pages.e2e.test.ts:124-139`).
- **Save as app**, **Pin to sidebar** (Advanced mode, stored in
  `localStorage` `omb-web-panels`), **Full screen** and **Point** (the
  person picks parts of the page, and each part becomes a chip for the next
  message) (`SaveAsApp.tsx`, `PageTools.tsx:132-201, 330-377`,
  `point.ts:1-29`).
- **Open page:** when the person types while a page is open in the large
  view, the prompt names that page and its version (`server/open-page.ts:22-30`).

### 3.12 Tool details in the chat (open part of `chat-polish.md`)

1. A tool step is a native `<details>` element, closed by default, with
   `aria-expanded` (`src/components/ToolActivity.tsx:29-34`).
2. The open body shows the status, the raw tool name when the label differs,
   the input in a `<pre>` of at most 13 rem and the output in a `<pre>` of
   at most 16 rem. All text is React text, so it is escaped
   (`ToolActivity.tsx:44-55`). The footer says "Shortened, automatically
   redacted preview. Review before sharing." (`en.json:1044`).
3. The server cuts the output of a plain activity step to 1,000 characters
   in pages and live frames, and marks it `clipped`
   (`server/host/message-pages.ts:8, 24-33`).
4. When the person opens a clipped step, the window fetches
   `GET /api/threads/:t/messages/:m/tool` one time. It shows "Loading the
   full result…" and, on a failure, "Showing the start of the result only"
   (`ToolActivity.tsx:19, 56, 63-82`). The route returns the stored output
   as it is (`server/routes/threads.ts:194-199`).
5. The input preview (`server/tool-summary.ts:5-89`):
   - a key that names a secret (`token`, `secret`, `password`, `cookie`,
     `authorization`, `api key`, `key`) becomes `[redacted]` (`:11, 74-75`).
   - then shape-based redaction runs on the whole value (`:85`). Redaction
     runs before the cut, so half a key is still found (`:1`).
   - budgets: 200 nodes, 256,000 characters of strings, depth 6, 40 items,
     40 fields, and 6,000 characters at the end with "[… preview
     shortened]" (`:7-8, 50, 70, 82, 88`).
   - `data:...;base64` and keys named `data`, `base64` or `blob` become
     "[binary content omitted]" (`:60, 78-79`).
   - new since the earlier research: an `error` value is kept, redacted,
     up to 500 characters, even when the rest is cut (`:10-56`).

### 3.13 Settings search and shortcut hints (open part of `chat-polish.md`)

1. The search is in `src/components/settings/`, not in
   `SettingsPrimitives.tsx`. The field has focus when Settings opens. `/`
   (when not typing) or Cmd/Ctrl+F gives it focus again
   (`SettingsWindow.tsx:119-133`).
2. Scores (`settings-index.ts:291-301`):

   | Match | Score |
   |---|---|
   | A "top for" word | 100 |
   | The title | 90 |
   | A title prefix | 80 |
   | A word prefix | 70 |
   | All words in the title | 60 |
   | A synonym | 50 |
   | A synonym prefix, or a substring of more than 3 characters | 40 |
3. The search covers Advanced rows also in Simple mode and marks them
   "Advanced". Rows of another place come back as "elsewhere"
   (`settings-index.ts:305-344`).
4. At most 8 hits here, 8 key hits and 8 hits elsewhere. No hit gives
   "Nothing matches “<query>”" and a Help Center link
   (`SettingsNav.tsx:261-292`).
5. Escape clears the query. A second Escape closes Settings
   (`SettingsNav.tsx:166-172`).
6. A shortcut hint reads the same table as the cheat sheet, so the label
   cannot drift. It shows `⌘ N` on macOS and `Ctrl N` on Windows and Linux,
   in `<kbd aria-hidden="true">` (`ShortcutHint.tsx:3-12`,
   `ShortcutHint.test.ts:9-21`). It is next to New bot (Advanced mode only),
   New thread, Find conversation and the Close button of Settings
   (`Sidebar.tsx:1168`, `ChatMoreMenu.tsx:102, 112`,
   `SettingsWindow.tsx:156`).

### 3.14 Rich tables and file previews

1. **A Markdown table:** `MarkdownTable` takes the cells that react-markdown
   already cleaned and never draws raw HTML from the model
   (`MarkdownTable.tsx:30`). Columns come from the first header row, with
   left, right or centre alignment (`:37-40`).
2. **The view** (`RichTable.tsx`):
   - up to 8 rows: no search box and no count. More: a search box and
     "<shown> of <total> rows · <n> columns" (`:48, 100-105`).
   - search: a substring in any cell, without case (`table-data.ts:66-67`).
   - sort by a header click: ascending, descending, off. Empty cells go
     last. Numbers sort as numbers (`RichTable.tsx:92`,
     `table-data.ts:68-73`).
   - more than 80 visible rows are virtualized, with a height of 400 px
     (`RichTable.tsx:157, 189`).
   - fit to width only when the minimum widths fit (`table-fit.ts:26-31`).
   - Expand opens a native modal `<dialog>`. Escape closes it and focus
     goes back (`RichTable.tsx:26-46`).
3. **Copy and download** use the visible rows, in the visible order, as CSV
   (`RichTable.tsx:71-83`). There is no size limit: the browser check copies
   50,000 rows (`check-rich-tables.mjs:53-56`). Copy tries the web
   clipboard for 3 s, then the desktop bridge, then an old method
   (`copy-text.ts:9, 76-88`). Download adds a UTF-8 BOM and a safe file
   name of at most 150 characters (`RichTable.tsx:76-83`).
4. **Formula cells:** a cell that starts with `=`, `+`, `-`, `@`, a tab or
   a carriage return gets a `'` in front, except a plain number such as
   `-12.50`. The header row too (`table-data.ts:77-82`,
   `table-data.test.ts:28-38`).
5. **A CSV or TSV file preview** (`TableFilePreview.tsx`):
   - only for a file of a message (`RichTable.test.ts:43-49`).
   - the read stops above 10 MiB, and the text must be valid UTF-8
     (`TableFilePreview.tsx:13-38`).
   - the parse runs in a Web Worker. More than 100,000 rows, 200 columns or
     500,000 cells gives "too large". A NUL byte or a parse error gives
     "format". Rows of different lengths give "columns". An error shows a
     message and Retry. The file is never cut silently (`table-data.ts:3-6,
     16-32`, `TableFilePreview.tsx:80-97`).
6. **An HTML file preview** (`HtmlFilePreview.tsx`):
   - `<iframe sandbox="" referrerPolicy="no-referrer" srcDoc>`: no
     scripts, no forms, no popups, no navigation (`:196`).
   - CSP `default-src 'none'; img-src data:; style-src 'unsafe-inline';
     font-src data:; media-src data:` and `<base target="_blank">`, so a
     link becomes a popup that the sandbox blocks (`:13-14, 46-49`).
   - the read stops above 25 MiB (`:159`). The limit was 2 MiB until
     `b8445d7f2` (section 8).
   - "Open in browser" exists only on the desktop, for a local window. It
     writes a copy (mode 0600, at most 2 MiB) and opens it in the system
     browser with no sandbox (`:51-56, 128-136`,
     `electron/save-file.mjs:185, 198-213`).

### 3.15 At a restart, and when a part fails

| What | After a restart | Where |
|---|---|---|
| The app row with `doc`, `rev`, `history`, `context`, `live`, `done` | Kept. SQLite, written before memory | `store.ts:1136-1139, 1239-1245`, `message-db.ts:52-61, 136-141` |
| The page bytes | Kept. Files in `app-docs`, written before the row, with a rename and no `fsync` | `chat-apps.ts:141, 152`, `app-docs.ts:96-98` |
| Page state | Kept. Files in `app-state` | `chat-apps.ts:514` |
| The app catalog | Kept. `mcp-app-catalog.json` | `mcp-app-catalog.ts:98-108` |
| The switch `apps: false` | Kept. `config.json` | `mcp-registry.ts:30-31` |
| Rate counters (20 each hour, 60 and 120 each minute) | Lost. Memory only | `chat-apps.ts:411-460`, `routes/chat-apps.ts:70-71` |
| App connections, tool list cache, page cache, probe throttle | Lost. Opened again on the next use | `chat-apps-mcp.ts:149-150, 410-411, 470-471` |
| Folder page tokens | Lost. A new document fetch makes a new token | `page-files.ts:91` |
| Live folder watches | Listed again from SQLite | `chat-apps.ts:565-570` |
| Window caches (heights, headings, documents) | Lost at a window reload | `AppMessage.tsx:25-51` |
| What the page keeps in the frame | Nothing: storage and cookies fail in the sandbox | `smoke-app-frames.mjs:304-306` |

Unused documents are removed 30 s after start and 2 s after a conversation
is deleted. Files younger than 10 minutes stay (`chat-apps.ts:538-541`,
`app-docs.ts:12`).

When an MCP server dies or hangs:

1. A dead command server fails each waiting request and its process tree is
   killed (`mcp-app-connections.ts:65-66, 95-101`). The frame gets 502
   "The app's server could not be reached." (`chat-apps-mcp.ts:403`).
2. A hung server costs at most 30 s to open, 120 s for a call and 30 s for
   other methods (section 3.7).
3. The turn does not wait: a probe is only queued, and the observer does
   not wait for its report (`chat-apps-mcp.ts:440, 464`,
   `mcp-app-observer.ts:233-235`).
4. Two places couple the servers. The limit of 6 connections closes
   another server's connection (`mcp-app-connections.ts:239-243`). All
   probes share one chain, so one slow probe (up to 45 s) delays the next
   (`chat-apps-mcp.ts:422, 440`).

## 4. The data

### 4.1 The app row (`AppPayload`, `app.ts:112-148`)

The row never holds HTML (`app.ts:111`).

| Field | Type | Meaning |
|---|---|---|
| `v` | `1` | Version of the shape |
| `source` | `"html"` or `"mcp"` | Bot page or MCP application |
| `title` | string, at most 80 | Bot title, or the MCP tool title |
| `doc` | string | Content id of the stored document. `""` when nothing is stored (`:118-120`) |
| `rev` | number | Version. `+1` each time a page is replaced (`:121-122`) |
| `history` | string[] | Earlier document ids, oldest first, at most 9 (`:123-125`) |
| `format` | `"jsx"` | A React page (`:126-127`) |
| `bytes` | number | Size of the page |
| `height` | number | Start height, 80..720 |
| `border` | boolean | `false` for a frameless page or `prefersBorder: false` |
| `network` | `{connect, resources, refused?}` | The hosts that the CSP allows (`:74-78`) |
| `mcp` | `{server, serverTitle?, tool, resourceUri, isError?}` | MCP only (`:100-109`) |
| `context` | `{text, at, delivered}` | Model context that waits (`:82-86`) |
| `done` | `{tool, text?, url?, at}` | The last change that the card made (`:90-98`) |
| `blocked` | reason | Why the page cannot run (`:145`) |
| `live` | `true` | A folder page that reloads (`:146-147`) |

The reasons of `blocked` (`app.ts:165, 560-570`): `signed-out` "Sign in to
<name> again", `server-removed` "<name> is no longer connected",
`server-disabled` "<name> is switched off in Settings", `apps-off` "Apps
from <name> are switched off in Settings", `too-large` "This app is too
large to store", `unavailable` "<name> did not send this app's page".

A user line sent from a frame has `fromApp {messageId, title}`
(`app.ts:151-154`). A user line with picks has `pointed: [{appId, label}]`
(`:156-161`).

### 4.2 The frame document (`AppDocument`, `app.ts:199-219`)

Fetched only for a frame, never with a conversation load (spec:126).

| Field | Meaning |
|---|---|
| `v`, `messageId`, `rev` | Which version |
| `srcdoc` | Starts with `<!DOCTYPE html><meta http-equiv="Content-Security-Policy" ...>` |
| `csp` | The same policy, so that a phone can enforce it on the network too |
| `network` | The hosts |
| `tool`, `toolInput`, `toolResult` | MCP only. A document with `tool` is MCP (`:198`) |
| `can` | `{serverTools, serverResources, message, openLinks, modelContext, data?, state?, connectors?}` (`:168-179`) |
| `blocked` | `{reason, text}` |
| `room` | `true` in a room |

### 4.3 The JSON-RPC methods (`app-rpc.ts`)

- MCP methods: `tools/call`, `tools/list`, `resources/read`,
  `resources/list` (`:16-17`).
- Page methods: `<app>/data/query {sql, params?}` gives `{columns, rows,
  truncated}`, `<app>/state/get {key}`, `<app>/state/set {key, value?}`, no
  value removes the key, `<app>/state/keys`, `<app>/connectors/call
  {connector|server, tool, arguments?, engaged}` gives `{result,
  truncated?}`, `<app>/connectors/list` (`:20-28`).
- Error codes: -32601 not found, -32602 bad parameters, -32000 refused by
  the host (`:37-39`).

### 4.4 The observer report (`McpAppReport`, `mcp-app-observer.ts:95-104`)

`{tool: "mcp_app", server, serverInfo?, definition, call {arguments,
toolUseId?}, result {content, structuredContent?, _meta?, isError?},
oversized?}`. The mount that tells a proxy to observe is `{server,
harnessUrl, token, extension}` in `OMB_GATE_APPS` or `OMB_REMOTE_MCP_APPS`.
A bad value stops the proxy with "invalid MCP apps configuration", so that a
mount never stops observing in silence (`:18-46`).

### 4.5 The catalog entry (`mcp-app-catalog.ts:14-33`)

`{apps, uiExtension: "ok" | "refused" | "unknown", tools: {name: {title?,
visibility, resourceUri?, readOnly, destructive}}, at, hash}`, in a file
`{v: 1, servers: {...}}`. At most 500 tools for each server (`:12`). The
file is written when the content changes or one hour after `at` (`:130`).

### 4.6 Files on disk

| Path | Content | Where |
|---|---|---|
| `<DATA_DIR>/app-docs/{html,data,doc}/<sha256>` | Page HTML, page data, the pair. Files 0600, folders 0700. The same `ui://` page is stored one time | spec:775, `app-docs.ts:95-98` |
| `<DATA_DIR>/app-state/` | Page state | `chat-apps.ts:514` |
| `<DATA_DIR>/mcp-app-catalog.json` | The catalog, 0600 | `chat-apps-mcp.ts:134` |
| SQLite `messages` | The row, with its `app` in the JSON column. A partial index on `kind = 'app'` | `message-db.ts:52-61, 73` |

### 4.7 Limits

| Limit | Value | Where |
|---|---|---|
| Page HTML or JSX | 256 KiB | `app.ts:12` |
| Folder page | 5 MB | `agents-app-tools.ts:5` |
| MCP page | 2 MiB | `app.ts:25` |
| Title | 80 characters | `app.ts:13` |
| Fallback text, excerpt | 1,500, 600 | `app.ts:14-15` |
| Height | 80..720 (frame 48..min(720, 70% of window)) | `app.ts:16-17`, `app-host-context.ts:96-99` |
| Message from a frame | 4,000 characters. Frame: 1 each 3 s and 10 each 10 min. Server: 20 each hour | `app.ts:19, 31`, `bridge.ts:36` |
| Model context | 4,000 characters. Frame: 1 each second. Server: 120 each minute | `app.ts:21`, `bridge.ts:32`, `routes/chat-apps.ts:70` |
| Server and page calls | Frame: 10 each 10 s and 120 each 10 min. Server: 60 each minute for each row | `bridge.ts:38`, `app.ts:33` |
| Link | 2,048 characters, 1 each 2 s | `bridge.ts:28, 37` |
| Message from the frame | 1,000,000 bytes | `bridge.ts:23` |
| MCP arguments, resource | 64 KiB, 8 MiB | `app.ts:27, 29` |
| CSP domains | 64 for each list | `csp.ts:63` |
| Kept versions | 10 with the current one | `app.ts:68` |
| AppDocs store | 512 MiB | `app-docs.ts:11` |
| Live frames, auto mount | 3, newest 20 | `app-pool.ts:5-11` |
| App connections | 6, 5 min idle, 30 s to open | `mcp-app-connections.ts:15-16`, `mcp-http.ts:41` |
| MCP call time | 120 s `tools/call`, 30 s others | `chat-apps-mcp.ts:25-26` |
| Report | 900 KiB, 10 s | `mcp-app-observer.ts:11-12` |
| Table file preview | 10 MiB, 100,000 rows, 200 columns, 500,000 cells | `table-data.ts:3-6` |
| HTML file preview | 25 MiB | `HtmlFilePreview.tsx:159` |

## 5. The UI

### 5.1 Which component draws what

| Component | What it draws | Where |
|---|---|---|
| `RichMessageRow` | Chooses the row: settings card, helper key, burst, goal run, app, widget. "Sent from <title>" under a user line | `RichMessageRow.tsx:23-74` |
| `AppMessage` | The app row: fetch, pool slot, frame, header, strips, page tools | `AppMessage.tsx:94-407` |
| `AppFrame` | Mounts one frame and connects the bridge to the server | `AppFrame.tsx:56-131` |
| `AppChrome` | Header, page footer, info panel, warning strip, "Done" line, placeholder | `AppChrome.tsx` |
| `PageTools` | Versions, Point, Share, Save to device, Open in new tab, Full screen, Pin | `PageTools.tsx:218-312` |
| `PointedChips` | Chips above the message box for picked parts, with a note | `PointedChips.tsx` |
| `McpAppsSwitch` | "Show its apps in chat" in the MCP settings | `McpAppsSwitch.tsx` |
| `RichTable`, `MarkdownTable`, `TableFilePreview`, `HtmlFilePreview` | Tables and previews | section 3.14 |
| `ToolActivity` | The tool step | section 3.12 |

### 5.2 Layout

- Width: at most 760 px for an app, 560 px for a page card
  (`AppMessage.tsx:21-22`).
- The header is outside the frame: the title, the origin "Page made by
  <bot>" or "App from <server>", "About this app" and "Reload app"
  (`AppChrome.tsx:24-72`, `en.json:8136-8148`). The frame cannot draw over
  it (spec:454-463).
- In the chat, a page shows as a compact card with a preview of 296 px, a
  fade and a footer. The preview is covered until the page says if it opens
  with a heading (1.5 s, or 10 s when the page says it still draws). Then the
  title goes above it or not (`AppMessage.tsx:261-282`,
  `PageTools.tsx:324`).
- "About this app" opens a panel in the card. It shows:
  - "It runs in a locked frame: it cannot see the rest of the app, your
    other chats or your files.".
  - the hosts it loads from and connects to.
  - the hosts that it asked for and that were refused.
  - the size.
  - "Always off: Camera, microphone, location, clipboard, pop-ups and
    downloads" (`AppChrome.tsx:118-139`,
  `en.json:8140-8147`).

### 5.3 States of a row

`data-app-state` is one of (`AppMessage.tsx:257-258`):

| State | When | What shows |
|---|---|---|
| `idle` | No slot yet | The placeholder at the kept height. Older rows: "Open app" |
| `loading` | Slot granted, document not here | "Opening the app" after 400 ms (`AppChrome.tsx:178`) |
| `live` | The frame runs | The frame |
| `unavailable` | No document, or a server error | The fallback text, cut to 6 lines, and the reason |
| `collapsed` | The frame asked to close | "Open again" |

The strips, by priority (`AppMessage.tsx:239-255`): sign-in ("Sign in to
<server> again" and "Sign in"), offline ("Reconnect to use this app" and
"Try again"), a blocked reason, a fetch error, then the `blocked` of the
document or the row.

### 5.4 Behaviour

- A 403 change refusal goes back to the frame as -32000. No Allow button
  and no strip show (`AppMessage.test.ts:314-330`).
- The "Sign in" button opens the MCP servers in Settings
  (`AppMessage.tsx:237`).
- Selected text in a frame gives a citation button, only when engaged, not
  in a room and when the person can write (`AppMessage.tsx:393-400`,
  `app-frame-host.ts:231-238`).
- The page tools: "v<n> of <count>", Earlier and Later, "Back to the
  latest" and an "Updated" badge for 2.5 s after a replace
  (`PageTools.tsx:39-55, 218-231`). "Open in new tab" stays off until the
  page is shared (`:254-257`). Full screen uses a dialog or the page pane.
  Escape stops Point first, then closes (`:330-377`).
- Point: "Click the part of the page you want changed. Press Esc to stop."
  A pick counts only from the frame's own window and only while Point is
  on, so a page cannot fill the message box by itself
  (`PageTools.tsx:132-160`).
- `McpAppsSwitch` is hidden when the listing has no boolean `apps`. It is
  hidden while it is on for a server that was not seen to offer an app, and
  shown while it is off, so that the person can turn it on again. It sends
  `PATCH /api/mcp/servers/<name> {apps}` and shows an error in place
  (`McpAppsSwitch.tsx:14-36`).

## 6. The tests

The tests show what the reference guarantees. The spec numbers its
security rules and says "Every rule below is a test." (spec:19, 542-580).

| Test file | What it proves |
|---|---|
| `shared/app-frame/csp.test.ts` | Both policies byte for byte. 35 bad domain entries refused. Loopback `http` only with the loopback filter. The cap of 64. A folder page adds its folder to 7 places, never the whole origin |
| `shared/app-frame/document.test.ts` | The CSP tag is first. A comment that hides a second CSP is removed. The helper only in bot pages. `ROOM_CAN` in a room |
| `shared/app-frame/bridge.test.ts` | No answer before `initialize`. Refused methods. Rate limits. Message shape. Link rules. Drops by window and size. Teardown after 1 s. The host sets `engaged` for connector calls |
| `shared/app-frame/bridge-sdk.test.ts` | The official MCP Apps SDK `App` works with this bridge, unchanged |
| `shared/app-frame/helper.test.ts`, `heading.test.ts` | The helper in a real page: theme, `send`, room no-ops, the click rule, height rules, heading report |
| `shared/app-frame/host-page.test.ts` | The phone host page is the committed build, has no CSP and no outside URL. Exact sandbox. Android message checks |
| `src/components/app/app-frame-host.test.ts` | Exact sandbox, no `allow`, no-referrer. Answers only its own frame. Engagement cases, with a frame that focuses itself |
| `src/components/app/app-pool.test.ts` | 3 live frames. The fourth waits for the teardown. Eviction order |
| `src/components/app/AppMessage.test.ts`, `.compact.test.ts` | States, strips, the page draft, rooms, a replace, `request-teardown`, sign-in, no Allow button |
| `src/components/app/PageTools.test.ts` | Versions, Point, Share and Unpublish, Pin, full screen |
| `server/chat-apps.test.ts` | Limits, secret removal, store full, versions, folders, live pages, context fences, message rate |
| `server/routes/chat-apps.test.ts` | Document route refusals, download headers, rooms, per-viewer files token, rpc refusals, `confirmed` ignored |
| `server/routes/bot-page-rpc.test.ts` | Only one `SELECT` on the bot's own data. Row and byte caps. State caps. Visibility |
| `server/routes/bot-messages-apps.test.ts` | `appMessage` shape, rate, room 409, `fromApp` on start, steer and queue, context one time, Point records |
| `server/chat-apps-mcp.test.ts` | Row from a report, rooms, "rule 17" refusals, the approval rule at "ask" and Full, `done`, rpc refusals, 60 each minute, probes, keys never logged |
| `server/mcp-app-observer.test.ts` | Report size steps, the gate and proxy hide app-only tools, the retry without the extension, one report only, a dead harness only logged |
| `server/mcp-app-connections-box.test.ts` | App connections start in the bot box and cannot see the data folder |
| `server/mcp-app-cancellation.test.ts` | A cancel keeps the connection. A transport failure replaces it |
| `server/chat-apps.e2e.test.ts`, `chat-apps-mcp.e2e.test.ts`, `chat-pages.e2e.test.ts` | Whole flows with a fake engine. The token of a turn stops working when the turn ends |
| `scripts/smoke-app-frames.mjs` | In real Electron: `fetch`, XHR, WebSocket, storage, cookies, parent DOM, navigation, popups and permissions all fail. A local HTTP sink gets 0 requests |
| `src/components/RichTable.test.ts`, `.fit.test.ts` | 8-row rule, virtualization, fit to width, sanitized cells |
| `scripts/testing/check-rich-tables.mjs` | 50,000-row CSV, sticky header, copy of all rows, malformed file errors, a late answer after Escape |
| `src/components/HtmlFilePreview.test.ts`, `.dom.test.ts` | Empty sandbox, CSP with no script source, a page over 2 MiB previews |
| `server/tool-summary.test.ts`, `ToolActivity.full.test.ts` | Redaction before the cut, budgets, error kept, full output loads one time |
| `src/components/ShortcutHint.test.ts` | Platform labels |

Not tested in `shared/app.test.ts`: `checkLive`, `checkFrameless`, `jsx`,
`path` and the refusal "Send one of html, jsx or path." (the reader searched
lines 1-190). The server tests cover them (`chat-apps.test.ts:136-149,
310-323, 692-700`).

## 7. Ours compared

We have none of this feature yet. Our crates are `bot-protocol`,
`bot-engine`, `bot-core`, `bot-cli` and `bot-desktop`. The window is React in
`crates/bot-desktop/ui` (decision D13). The table says where each part of
the reference would go.

| Part | Reference files | Our crate and module | Step |
|---|---|---|---|
| Wire types: `AppPayload`, `AppDocument`, `AppCan`, the limits, the blocked reasons | `packages/phone-protocol/src/app.ts`, `app-rpc.ts` | `bot-protocol`, a new module `app` (types only, no I/O) | after step 12 |
| The `show_html` tool | `server/drivers/agents-app-tools.ts`, `agents-call-cards.ts` | `bot-engine`, our tools MCP server | 12 |
| Store the page, versions, sweep | `server/chat-apps.ts`, `server/app-docs.ts` | `bot-core`, a module `apps` beside the store of step 8 | after 12 |
| Build the document: CSP, srcdoc, domain filter | `shared/app-frame/csp.ts`, `document.ts` | `bot-core::apps::document` (pure functions in Rust) | after 12 |
| Frame helper script | `shared/app-frame/helper.ts` | a static script in `bot-core` that the document builder puts in, or in `bot-desktop/ui` | after 12 |
| Bridge, frame host, pool, engagement | `shared/app-frame/bridge.ts`, `src/components/app/app-frame-host.ts`, `app-pool.ts` | `bot-desktop/ui/src/features/chat/apps/` (TypeScript) | after 12 |
| The app row UI | `src/components/app/AppMessage.tsx`, `AppChrome.tsx`, `AppFrame.tsx` | `bot-desktop/ui/src/features/chat/apps/` | after 12 |
| The routes `/app`, `/rpc`, `/context` | `server/routes/chat-apps.ts` | Tauri commands in `bot-desktop/src`, which call `bot-core` | after 12 |
| Model context and `fromApp` on the send path | `server/chat-apps.ts:321-443` | `bot-core`, the send path of step 8 and 11 | after 12 |
| The approval rule for an app's change | `server/chat-apps-mcp.ts:331-337` | `bot-core`, the one approval function of step 10 | 10, 16 |
| MCP catalog, observer, app connections | `server/mcp-app-catalog.ts`, `mcp-app-observer.ts`, `mcp-app-connections.ts` | `bot-engine`, the MCP proxy of decision D12 | 16 |
| Switch "Show its apps in chat" | `src/components/McpAppsSwitch.tsx`, `server/mcp-registry.ts:30-31, 426-429` | `bot-core` settings, `bot-desktop/ui/src/features/settings` | 16 |
| Rich table, CSV preview, HTML preview | `src/components/RichTable.tsx`, `src/lib/table-data.ts`, `TableFilePreview.tsx`, `HtmlFilePreview.tsx` | `bot-desktop/ui/src/features/chat/` (TypeScript only) | after 1 |
| Tool details | `src/components/ToolActivity.tsx`, `server/tool-summary.ts` | `bot-desktop/ui/src/features/chat/`, and the preview in `bot-core` with the redaction of step 6 | 5, 6 |
| Settings search, shortcut hints | `src/components/settings/settings-index.ts`, `ShortcutHint.tsx` | `bot-desktop/ui/src/features/settings` | after 1 |

Differences of structure:

1. **Scope.** [`../../comparison.md`](../../comparison.md) section 10 lists
   "Pages made by a bot" under "More features that are not planned (scope
   Out)". [`../reference-features.md`](../reference-features.md) marks this
   row "later". The table above shows where the parts would go if the
   author takes them. The rich tables, the tool details and the settings
   search are window code only, and do not depend on that choice.
2. **No HTTP server.** We have no server routes (decision D10). The three
   routes become Tauri commands. The folder page files route has no
   equivalent: it needs a custom URL scheme, or we leave folder pages out.
3. **Our window has a CSP.** `crates/bot-desktop/tauri.conf.json:27-28` has
   `default-src 'self'; style-src 'self'`. Check if this policy also
   applies inside a `srcdoc` frame. If it does, it blocks the CDN scripts
   that a bot page needs.
4. **WebKit.** On macOS and Linux, Tauri uses WebKit, not Chromium.
   Decision D13 lists "not tested in the WebKit webviews of macOS and
   Linux" as an open risk. The spec of the reference lists the WebKit frame
   messages as not verified (spec:753-761). Check `sandbox="allow-scripts
   allow-forms"`, `postMessage` with the target `"*"` and the focus rule of
   engagement (`app-frame-host.ts:24-28`) in WebKit.
5. **Proxy.** The reference observes MCP traffic in its gate and its remote
   proxy. Decision D12 already puts a proxy of ours between each engine and
   each tool server, so the observer fits there with no new process.

## 8. Where we can be better

Each point has a reason. The author decides each one in
`docs/plan/chat-apps-and-tables.md`.

1. **One tool, `show_html` with `app_id`, from the first version.** The
   reference added `update_html` as a second tool on 2026-10-14
   (`a0a5d08ac`, first in v0.1.122) and merged it into `show_html` on
   2026-10-29 (`a96950e01`, first in v0.1.132). It still keeps the alias for old sessions
   (`agents-tool-names.ts:34-35, 63`). Reason: a feature that was added
   then removed, and one tool less in the tool list.
2. **No Allow bar. An app's change goes through the one approval
   function.** The reference added an Allow bar (`d5dba1449`, `a7bad77fe`,
   2026-10-14) and removed it eight days later (`ffb5c9aa0`). All three
   commits are first in v0.1.122, so no release had the bar. Its spec
   still describes it (spec:72-73). Today the rule is in its own function
   in `chat-apps-mcp.ts:331-337`, one more place that decides "ask or
   allow". Reason: the approval model changed about 10 times
   (`changelog.md` section 6). Our step 10 plans one pure function for
   this.
3. **A page's message fills the message box from the first version.** The
   reference sent it at once and changed this on 2026-11-22 (`972069a3c`,
   first in v0.1.178).
   Reason: a feature reversed, and the person sees the words before the bot
   gets them.
4. **Rooms view-only from the first version.** The spec made apps a
   non-goal in rooms (spec:25, 75). `65c67319d` (2026-11-07, first in
   v0.1.145) added them,
   view-only, on four layers. Reason: a non-goal reversed. One `can` value
   decided in one place is easier to test.
5. **Check that the viewer can see the conversation for each app route.**
   A `client` session may call `rpc` and `context`
   (`server/request-auth.ts:419-420`). The route checks the viewer only for
   page methods: "A page's data and state are a read of the conversation:
   only for whoever may see it." (`routes/chat-apps.ts:133-135`). Context
   and MCP rpc check the bot, the task and the row, but not the viewer
   (`:115-131`). Section 9 has the open question: a gate above the route
   may check it. If no gate checks it, take a signed-in person who cannot
   see the conversation but knows its ids. That person can put model
   context into it. That person can also run the bot's app tools with the
   bot's sign-in.
   Reason: "a secret or an access right in the wrong place" (`changelog.md`
   section 5, for example "Web pages no longer get owner access",
   v0.1.113).
6. **Redact the MCP tool result before we store it.** The row text is
   redacted (`chat-apps-mcp.ts:253-255`), but the stored `toolResult` is
   not (`:220-225`, spec:813). The document route gives that result to
   each viewer who can see the conversation, and a room document keeps it
   (`document.ts:111`). So the people of a room read the same data that the
   row text hides. Reason: "a secret in the wrong place". This is the
   second check of the same data in a different place. The frame's own
   hosts gain nothing new, because they belong to the server that made the
   result.
7. **One limit of connections for each server, not one shared limit.**
   With 6 connections in all, a seventh server closes the connection of
   another (`mcp-app-connections.ts:16, 239-243`). All probes wait on one
   chain (`chat-apps-mcp.ts:422, 440`). Reason: "one slow or stuck part
   blocks the others" (v0.1.153, v0.1.178). A busy app should not close the
   app of another server.
8. **`fsync` for the page files.** AppDocs writes a temporary file and
   renames it, with no `fsync` (`app-docs.ts:96-98`). SQLite runs with
   `synchronous = NORMAL` (`message-db.ts:49-50`). After a power cut, the
   row can name a document that is empty or missing. The window then shows
   "This app's page is not stored on this computer." Reason: "state lost at
   a restart or a crash". This is a judgment call: the reference shows no
   release with this failure.
9. **A time limit on the frame pool and on the document fetch.** The pool
   has no time limit of its own (`app-pool.ts:68-72`). Only the bridge ends
   a teardown after 1 s. No time limit was found for a document fetch or a
   frame load (`AppMessage.tsx:169-172`). Reason: "a turn or a wait that
   does not end". A type that cannot exist without a limit (`changelog.md`
   section 7) makes this sure.
10. **A report that the server answers fast.** The observer stops after
    10 s (`mcp-app-observer.ts:12`). The server reads the page for up to
    30 s, after an open of up to 30 s (`chat-apps-mcp.ts:167`,
    `mcp-app-connections.ts:251`). It is not known if the row is still
    written after the proxy gives up (section 9). We can accept the report,
    answer, and then read the page. Reason: "the same work lost". This is a
    judgment call until the behaviour is verified.
11. **Remove what is left of old features.** The fallback "This app cannot
    reach its server on this computer yet." is still in the route, but the
    server always sets `mcpRpc` (`routes/chat-apps.ts:167`,
    `index.ts:11946`). The text `html.tooLarge` still says "(2 MB)" and no
    code uses it (`en.json:155`). The test server still says that a change
    "needs the person's Allow" (`fake-stdio-app-server.ts:10-11, 41-42`).
    Reason: less code to read. A judgment call.
12. **Keep the design document true.** The spec contradicts itself and the
    code in six places (section 2.2). Decision D19 says each feature has
    one page in `docs/` that a pull request keeps up to date. Reason: the
    next reader trusts the page.
13. **Keep from the reference.** Each item has a test in the reference
    (section 6):
    - the exact sandbox.
    - the CSP tag before any byte of the page.
    - the domain filter.
    - the message checks by window.
    - the click rule.
    - the per-viewer files token.
    - `cache-control: no-store`.
    - the `sandbox` CSP on the download.
    - formula escaping in CSV.
    - the empty sandbox of the HTML file preview.
    - the redaction before the cut in tool previews.

### The problems of `changelog.md` section 5 that the reference has here

| Problem | Here | Where |
|---|---|---|
| A secret or an access right in the wrong place | Yes: context and MCP rpc do not check the viewer (if no gate above does), and the MCP tool result is stored without redaction. The sandbox itself is strict | `routes/chat-apps.ts:133-135`, `chat-apps-mcp.ts:220-225` |
| A feature added, then removed or reversed | Yes, six times: `update_html` (v0.1.122 to v0.1.132), the Allow bar (in and out before v0.1.122), `send` that sends at once (to v0.1.178), rooms (v0.1.145), the pane beside the chat (in and out before v0.1.125), the 2 MiB limit of the HTML preview (v0.1.117 to v0.1.180). Also the CSP cap 16 to 64 (v0.1.141) and the page card "glaze" (`e550d9c36` to `9147cedfd`) | sections 8.1-8.4, 3.14 |
| One slow or stuck part blocks the others | Partly: a turn never waits for apps, but app connections share one limit of 6 and probes share one chain | `mcp-app-connections.ts:239-243`, `chat-apps-mcp.ts:422` |
| State lost at a restart or a crash | Little: rows, pages, state and the catalog are on disk. Rates, connections and tokens are in memory, which is safe. Page files have no `fsync` | section 3.15 |
| A turn or a wait that does not end | Small: no time limit on the frame pool or the document fetch | `app-pool.ts:68-72` |
| The approval model changed | Yes: the Allow bar came and went in eight days | `ffb5c9aa0` |
| The size of the tool list | No longer: `update_html` left the list | `a96950e01` |

"Web pages no longer get owner access" (v0.1.113): the release text is not
in the clone. The commit `a5f9183bc` ("Harden local access", 2026-10-15) is
in v0.1.113 and in no earlier tag. Its message says that browser pages no
longer get the owner's loopback trust. That rule is about requests from a
browser to the local server, not about app frames. An app frame cannot make
that request: its `connect-src` allows only the CDNs or the declared hosts,
and `http` hosts only for a loopback MCP server (`csp.ts:18, 93-96, 132`).

## 9. Not verified

- If a gate above `routes/chat-apps.ts` checks that a `client` session can
  see the conversation before `context` and MCP `rpc`. `request-auth.ts`
  only allows the path (`:419-420`). Point 8.5 depends on this.
- If the row is still written when `recordMcpAppCall` takes longer than the
  10 s of the observer. The route code in `chat-widgets.ts` was not read for
  this.
- The read-only check inside `DataEngine.pageQuery`. Only the test results
  are known (`bot-page-rpc.test.ts:87-102`).
- The Electron navigation guard (`electron/app-frame-guard.mjs`) and the
  permission handlers. Only the smoke test that uses them was read.
- The native checks on iOS and Android. Only the comments in
  `host-page.ts:32-34` were read.
- The `'` prefix of escaped CSV cells comes from Papa Parse. Its code was
  not read. The tests show the result (`table-data.test.ts:28-38`).
- If the stored tool output of a step is redacted before it is stored. The
  route returns it as it is (`server/routes/threads.ts:197-199`).
- `server/redact.ts`, `server/mcp-gate.ts`, `server/mcp-remote-proxy.ts`
  and `appMountFor` in `server/mcp-gate-config.ts`. They are known from
  their tests only.
- What a page opened with "Open in browser" can reach in the system
  browser.
- Why direct turns pass the custom servers without the lent mounts to
  `turnMounts` (`index.ts:7786`), and the other path passes them
  (`index.ts:9674`).
- If Codex at Full access answers an app access form by itself
  (`server/drivers/codex-app-approval.ts`, `codex.ts` was read only at
  725-750 and 840-850).
- The publish route, the host of `*.<app>.page` and the headers of a
  published page.
- `scripts/build-app-host.ts`, which builds `app-host.html`.
- Section 7, points 2 and 3: the CSP of our window in a `srcdoc` frame, and
  the frame in WebKit. Nothing was run.
- The release notes: the clone has no release text. The changelog page of
  its docs site reads them from GitHub
  (`apps/docs/content/docs/changelog/index.mdx:9-14`).
