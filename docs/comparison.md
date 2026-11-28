# Comparison: OpenMausBot (TypeScript) and opensomething (Rust)

This file compares how OpenMausBot builds each feature with what opensomething
uses, or can use, for the same feature. It is a reference for the port. The
decisions are in [`decisions.md`](decisions.md).

- **Date:** 2026-11-20
- **Reference version:** OpenMausBot 0.1.170 (commit `c444029f3`)
- **Not read:** the `enterprise/` directory of OpenMausBot (see decision D2).

## How to read the tables

- **Technique** is what OpenMausBot does. File paths are in its repository.
- **TypeScript** is the npm package or Node built-in module that it imports.
  "Hand-written" means its own code, with no library.
- **Rust** is the crate we propose. A version is the newest one on crates.io
  on 2026-11-20.
- **Scope** says where the feature is in our plan: `D8` (target architecture),
  `D10` (desktop), `D12` (outside tools) or `Out` (not planned).

Cautions that apply to all tables:

- Only the existence of each crate was checked. Check the license of a crate
  with `cargo deny check` before you add it.
- The Tauri plugins show `3.0.0-alpha.3` on crates.io. The workspace pins
  Tauri 2, so use the 2.x line of each plugin.

## Main finding

OpenMausBot writes almost all of its protocols by hand on Node built-in
modules. It uses no MCP SDK, no ACP SDK, no JSON-RPC library and no HTTP
framework. The Rust port needs crates mostly where Node has a built-in module:
HTTP, SQLite, processes and cryptography.

## 1. Product shape

| Topic | OpenMausBot | opensomething |
|---|---|---|
| Language | TypeScript on Node 24, run with type stripping | Rust 1.94, edition 2024 |
| Server | One harness process on `127.0.0.1:8799` | The core library, started by the CLI or the desktop shell |
| Desktop shell | Electron 43; the server is a utility process | Tauri 2; the core runs in the same process (D10) |
| UI | React 19, Vite 7, Tailwind 4 | Web UI in the Tauri window; framework not chosen |
| Engines | Claude, Codex and ACP agent CLIs, OpenAI-compatible HTTP | ACP agent CLI or chat API; first engine not chosen (D8) |
| Data folder | `~/.openmausbot`: JSON files, two SQLite files, NDJSON logs | One folder named by one setting (D10) |
| Hosted services | Relay, control plane, Composio broker, cloud computers | None (D10) |
| Size | About 3,500 server files | Four crates and a desktop crate |

## 2. Core runtime (scope D8)

| Feature | Technique | TypeScript | Rust |
|---|---|---|---|
| Driver contract | Interfaces with `sendTurn`, `interruptTurn`, `respondToRequest`, `steer`, an event listener. Capability flags gate behaviour. Typed refusals. | Hand-written | A `Driver` trait in `bot-engine`; `thiserror` 2 |
| Event union | One set of events for all engines: `turn.started`, `content.delta`, `item.*`, `request.opened`, `turn.completed` | Hand-written types, `zod` | `serde` enums in `bot-protocol` |
| Event bus | Fan-in from all drivers. Text deltas merge for each thread for 50 ms. A terminal event forces a flush. | Hand-written | `tokio` 1 `broadcast` and `mpsc`, `futures` |
| Event log | `events/<threadId>.ndjson`, appended after redaction, mode 0600, rotation keeps the newest half | `node:fs/promises` | `tokio::fs`, `serde_json` |
| HTTP API | Raw server, an ordered route table, 1 MB body limit | `node:http` | `axum` 0.8, `tower-http` |
| Event stream to clients | SSE frames with `id: <streamId>:<seq>`. A 500-frame buffer serves `Last-Event-ID`. Heartbeat each 15 s. | Hand-written | `axum::response::sse` |
| Request validation | Strict schemas on each body and each stored row | `zod` 4 | `serde` with `deny_unknown_fields` |
| Sessions | Random 256-bit token; only its SHA-256 is stored; constant-time compare | `node:crypto` | `rand`, `sha2`, `subtle` |
| Assignment store | Three tables: `assignments`, `assignment_events` (append-only), `inbox`. WAL mode. | `node:sqlite` | `rusqlite` 0.43, feature `bundled` |
| Transactions | `BEGIN IMMEDIATE`; nested calls use savepoints; the row and its event go in one transaction | `node:sqlite` | `rusqlite` `Transaction` and `Savepoint` |
| Runtime loop | `tick()` expires, validates and dispatches. One running turn for each thread. Budgets renew on progress. | Hand-written, `setTimeout` | `tokio::time` |
| Restart recovery | On open, reconcile the deepest node first. A cut turn runs again one time, unless it acted outward. | Hand-written | Same logic in `bot-core` |
| Runtime tests | Scripted fake runner, fake clock, nine invariant checks after each scenario | `vitest` | `cargo test`, `tokio::time::pause`, `insta` |
| Atomic file write | Temp file, `fsync`, rename; rename retries on Windows | Hand-written, `node:fs` | `tempfile` (`persist`) or `atomic-write-file` |
| One server for each data folder | Lease file made with a hard link; the record holds pid and boot identifiers | Hand-written | `fs4` |
| Config | `config.json`, checked and merged on save, reloaded after each save; no file watcher | `zod` | `serde`, `serde_json` |
| Secret redaction | Regular expressions for key shapes, applied before text reaches disk | Hand-written | `regex`, `secrecy` |
| Logging | Plain logs with redaction | Hand-written | `tracing` |

Points that a port must keep:

- A rule reads a capability flag, never a driver name.
- An unknown driver or a bad config becomes "unavailable". It does not stop
  the other engines.
- The approval level is sent again on each turn.
- OpenMausBot now runs one turn for each thread, with 3 to 16 parallel
  threads for each bot. Its plan `2026-09-02-bot-concurrency.md`, which D8
  cites for "one turn per bot", says that it is superseded.

## 3. Engine drivers (scope D8)

| Feature | Technique | TypeScript | Rust |
|---|---|---|---|
| Process start and stop | Child in its own process group. Stop: close stdin, then terminate the group, then kill. A run tag in the environment finds orphans after a crash. | `node:child_process` | `tokio::process`, `process-wrap` 10 |
| Line framing | One JSON object for each line on stdio; UTF-8 decoded across chunk borders | Hand-written, `node:readline` | `tokio-util` `LinesCodec`, `serde_json` |
| Claude driver | `claude -p --output-format stream-json --input-format stream-json`. One process for each thread. Resume with `--resume`. | Hand-written | Same, on the line codec |
| Codex driver | `codex app-server`, JSON-RPC 2.0: `initialize`, `thread/start` or `thread/resume`, `turn/start`, `turn/interrupt` | Hand-written | Same, on the line codec |
| ACP driver | `initialize`, `session/new` or `session/load`, `session/prompt`. The result of `session/prompt` ends the turn. `session/cancel` interrupts. | Hand-written | `agent-client-protocol` 5 |
| Chat API driver | POST to `/chat/completions` with streaming. The server runs the tool loop. | `fetch`, `undici`, hand-written SSE parser | `reqwest` 0.13, `eventsource-stream` |
| Custom engines | An entry in the config names a command line (ACP) or a URL (chat API) | `zod` | `serde` |
| Model catalog | A manifest fetched with a 1-hour lifetime and a bundled fallback; models.dev with ETag | `fetch`, `zod` | `reqwest`, `serde` |
| Usage caps | A JSONL ledger for each month. A cap is checked only before new work starts. | `node:fs/promises` | `tokio::fs`, `serde_json` |
| Check of provider id tokens | Verify a signed JWT (RS256, ES256) | `jose` | `jsonwebtoken` 12 |

Points that a port must keep:

- Never put the prompt or the MCP config on the command line.
- Answer each request from the engine, also between turns. If not, the engine
  blocks.
- Start a turn again only when no output was seen. If not, a tool can run
  two times.

## 4. Tools and approvals (scope D8)

| Feature | Technique | TypeScript | Rust |
|---|---|---|---|
| Own tools for engines | A small stdio proxy is given to each engine as an MCP server. It calls the server on loopback with a token for each bot, thread and set of grants; the record behind the token is for one turn. | Hand-written MCP, `node:readline`, `node:http` | `rmcp` 3, or the line codec |
| Tool schemas | JSON Schema written as literals; calls checked by hand-written code | Hand-written | `schemars` 1 to generate |
| Schema check of outside tools | Validate arguments against the schema that the tool server listed | `ajv`, `ajv-formats` | `jsonschema` 0.61 |
| Delegation | `coordinate_bots` writes an assignment; the runtime owns the hand-off | Hand-written | `bot-core` runtime |
| Tool search | `find_tool` and `use_tool` rank tools with BM25 | Hand-written | Hand-written, or SQLite FTS5 |
| Approval levels | `ask < edits < auto < full`, mapped to the permission mode of each engine | Hand-written | An enum in `bot-protocol` |
| Permission broker (Claude) | The CLI calls an MCP tool. That tool sends the request through a Unix socket or a named pipe to the server. | `node:net` | `tokio::net` (`UnixListener`, named pipes) |
| Permission broker (ACP) | Answer `session/request_permission`. Select an option by its `kind`, never by its position. | Hand-written | `agent-client-protocol` |
| Command allowlist | Exact string equality on command, folder and engine; 200 rules for each bot | Hand-written | Hand-written |

## 5. Memory, routines and triggers (scope D8)

| Feature | Technique | TypeScript | Rust |
|---|---|---|---|
| Memory files | `MEMORY.md` and topic files for each bot. Budget: 200 lines or 24,000 bytes in the system prompt. Old entries move to an archive, which is written first. | `node:fs` | `std::fs`, `tempfile` |
| Recall | SQLite FTS5 with `bm25()` ranking. No embeddings. The result goes in the user message inside a fixed fence. | `node:sqlite` | `rusqlite` (FTS5 is in `bundled`) |
| Cron | The library only calculates the next dates. Five fields and a named time zone are required. | `croner` | `croner` 4 (Rust), `chrono-tz` or `jiff` |
| Timer | One timer to the next due time, and a wall-clock check each 60 s, because timers stop while the computer sleeps | `setTimeout` | `tokio::time` |
| Occurrence ledger | Append-only JSONL keyed by routine and scheduled time, so that each occurrence starts one time | `node:fs` | `serde_json`, or a table in SQLite |
| Missed runs | Only the newest missed occurrence runs, and only if it is 12 hours late or less | Hand-written | Hand-written |
| Webhook receiver | A second listener with only `/health` and `/hooks/...`. Authentication is checked before the body is read. Only the hash of the secret is stored. | `node:http`, `node:crypto` | `axum`, `sha2`, `subtle` |
| Secret at rest | AES-256-GCM with a key file that is never in a backup | `node:crypto` | `aes-gcm` 0.11 |
| Skills | A folder with `SKILL.md`. The system prompt gets an index; the model reads the file itself. | Hand-written parser | Hand-written, or `gray_matter` |

## 6. Outside tools: connected apps (scope D12)

| Feature | Technique | TypeScript | Rust |
|---|---|---|---|
| Custom MCP servers | A config entry names a command or a URL; the server passes it to the engine | `zod`, hand-written MCP client | `serde`, `rmcp` |
| Composio session | One project key, one stable user identifier, one Tool Router Session. Composio holds the provider tokens. | `fetch`, `zod` | `reqwest`, `serde` |
| Connector proxy | A stdio MCP server between the engine and the tool server. It filters the tool list to the grants of the bot and checks the grant again on each call. | `node:readline`, `fetch` | `rmcp`, or the line codec with `reqwest` |
| Streamable HTTP relay | POST each message; accept JSON or SSE; keep the `mcp-session-id` header; 20 MB limit | Hand-written | `reqwest`, `eventsource-stream` |
| Sign-in | A card in the chat. The model never writes an authorization address. | Hand-written | Hand-written |
| File arguments | Upload only a file from the bot folder or the conversation; refuse hidden folders | `node:fs`, `fetch` | `tokio::fs`, `reqwest` |
| Managed broker | A Cloudflare Worker with D1 holds the project key and a queue of app events | Workers runtime | Not planned (D12). If needed: `worker` 0.9 |

## 7. Desktop shell (scope D10)

| Feature | Electron | Tauri 2 / Rust |
|---|---|---|
| Server process | `utilityProcess.fork` | The core runs in the Tauri process |
| Bridge to the page | `contextBridge`, `ipcMain.handle`, an origin check on each handler | Tauri commands and capabilities |
| Secrets | `safeStorage` | `keyring` 4 |
| Update | `electron-updater` | `tauri-plugin-updater` |
| Deep links | `setAsDefaultProtocolClient` | `tauri-plugin-deep-link` |
| One instance | `requestSingleInstanceLock` | `tauri-plugin-single-instance` |
| Notifications | `Notification` | `tauri-plugin-notification` |
| Tray | `Tray` | The Tauri tray API |
| Installers | `electron-builder` | The Tauri bundler |
| CLI arguments | `node:util` `parseArgs` | `clap` 4 |
| CLI prompts | `@clack/prompts` | `inquire` 0.9 |

The UI libraries stay TypeScript, because the UI is a web page in both
projects: `react-markdown`, `remark-gfm`, `shiki`, `mermaid`, `katex`, `vega`,
`ag-grid`, `codemirror`, `@tanstack/react-virtual`, `qrcode.react`, Tailwind.

## 8. Features that are not planned (scope Out)

| Feature | Technique | TypeScript | Rust, if needed later |
|---|---|---|---|
| Bots' browser | Hand-written Chrome DevTools Protocol driver on a pipe. The snapshot comes from the accessibility tree, with stable element references. | Hand-written, `ws` for viewers | `chromiumoxide` 0.9, or hand-written on `tokio-tungstenite` |
| Egress gate | A SOCKS5 proxy for each browser session. It resolves names itself and refuses private, loopback and metadata addresses. | `node:net`, `node:dns` | `fast-socks5` 1, `hickory-resolver` |
| Computer use | An external driver binary that speaks MCP on a socket | `@trycua/cua-driver` | The same binary; it is written in Rust |
| Cloud computer view | VNC through a WebSocket proxy | `@novnc/novnc` | Stays in the web UI |
| Phone relay | A WebSocket relay that splices two sockets. Tokens are Ed25519-signed JSON. | `ws`, `node:crypto` | `tokio-tungstenite` 0.30, `ed25519-dalek` 3 |
| End-to-end encryption | A hand-written Noise handshake on P-256, then yamux streams | `node:crypto`, hand-written | `p256`, `hkdf`, `aes-gcm`, `yamux` 0.14 |
| Sealed credential from a phone | HPKE with P-256, HKDF-SHA256 and AES-256-GCM | `@hpke/core` | `hpke` 0.15 |
| Server agent (`connector/`) | One outbound WebSocket, signed jobs, HTTP through yamux, Docker through its Unix socket | Node built-in modules only | `tokio-tungstenite`, `ed25519-dalek`, `yamux`, `bollard` 0.21 |
| Data tables | One DuckDB file for each bot | `@duckdb/node-api` | `duckdb` |
| Charts to PNG | Vega renders SVG, then SVG becomes PNG | `vega`, `@resvg/resvg-js` | `resvg` 0.50 for the PNG step; no crate for Vega |
| CSV, JSON query, archives, domains | Small utilities | `papaparse`, `jmespath`, `tar`, `tldts` | `csv`, `jmespath`, `tar` with `flate2`, `psl` or `addr` |
| Email | IMAP read, parse, SMTP send | `imapflow`, `mailparser`, `nodemailer` | `async-imap`, `mail-parser`, `lettre` |
| Speech text | Markdown changed to speakable sentences; one HTTP request for each sentence | `mdast-util-from-markdown` | `pulldown-cmark` 0.13 |
| QR code in the terminal | Pairing link | `qrcode-terminal` | `qrcode` 0.15 |
| Certificate for an own domain | A pinned Caddy binary run as a child | Hand-written | `rustls-acme` or `instant-acme` |
| Password managers | 1Password SDK; Bitwarden CLI as a child | `@1password/sdk` | No crate checked; a CLI as a child works |

## 9. Tooling

| Purpose | OpenMausBot | opensomething |
|---|---|---|
| Lint | `oxlint --deny-warnings` | `cargo clippy --workspace --all-targets -- -D warnings` |
| Format | Not found in the scripts | `cargo fmt --all --check` |
| Type check | `tsc` 7 | The compiler |
| Unit tests | `vitest` 4, `node --test` | `cargo test --workspace` |
| HTTP fakes in tests | Hand-written fake servers | `wiremock` 0.6 |
| Dependency licenses | An SBOM and `NOTICE` | `cargo deny check` (D6) |
| Bundle | `esbuild`, `vite` | `cargo build`; `vite` only for the UI |
| Behaviour tests | A real server with a scripted fake engine and a temporary data folder | The fake driver and an in-memory store (`bot-testkit`, D8) |

## 10. More features that are not planned (scope Out)

These features were analyzed, but they are not in the tables above.

| Feature | Technique | TypeScript | Rust, if needed later |
|---|---|---|---|
| Rooms and channels | A pure function `admit(surface, state, message)` returns start, steer, queue or refuse. A room runs one turn at a time. | Hand-written | A pure function in `bot-core` |
| Message queues | Messages sent during a turn stay in memory and in a `chat_followups` table, so that a restart keeps them | `node:sqlite` | `rusqlite` |
| Room routing ("decision model") | A small model selects the bot for a message. Time limit 1.5 s. Below a probability of 0.6, the room lead answers. | `fetch` | `reqwest` |
| Fallback engine | When a turn does not start, the server selects a backup engine that has the same tools | Hand-written | Hand-written |
| Prompt-cache keep-warm | After 50 minutes of no activity, a forked session sends a small request | Hand-written timers | `tokio::time` |
| Text to speech | One HTTP request for each sentence. Sentences are split with an abbreviation check. | `fetch`, `ws`, `Intl.Segmenter` | `reqwest`, `tokio-tungstenite`, `unicode-segmentation` |
| Speech to text | On macOS, a Swift helper binary writes NDJSON. On other systems, an HTTP service. | Swift helper, `fetch` | The same helper, `reqwest` |
| Live calls | The server makes the WebRTC session with the provider, so that the key stays on the server | `fetch`, `@fishaudio/agent-client` | `reqwest`; the media stays in the web UI |
| Meeting bot | A script is copied to the cloud computer. It runs Chrome, records a PulseAudio sink with `ffmpeg` and sends audio for transcription. | Node built-in modules only | `tokio::process`; the same external tools |
| Android control | `adb` for screenshots and input. A pinned `scrcpy-server` gives H.264 video, which the page decodes. | `node:child_process`, `node:net` | `tokio::process`, `tokio::net` |
| Cloud computer | REST calls to a sandbox service: run a command, read a file, screenshot with `scrot`, input with `xdotool` | `fetch` | `reqwest` |
| Local VM | A container with a desktop. The agent runs the computer driver through `docker exec`. | `node:child_process` | `tokio::process`, or `bollard` |
| Public address | A pinned `cloudflared` binary runs as a child. The token goes in a private file, never in the arguments. | `node:child_process` | `tokio::process`, `sha2` for the pin |
| Access from other devices | `tailscale serve` as a child, or a LAN bind that drops peers that are not private | `node:child_process`, `node:net` | `tokio::process`, `std::net` |
| Pairing | A 12-symbol code (60 bits), single use, 10 minutes. Five wrong codes in 5 minutes lock pairing. | `node:crypto` | `rand` |
| Companion sidecar | A second process is the only listener off the machine. It has a default-deny route list and a hand-written mDNS responder. | Node built-in modules only | `axum`, `mdns-sd` 0.22 |
| Phone push | The control plane sends to APNs (ES256 token) and FCM (RS256 token) | WebCrypto | `a2`, `jsonwebtoken`, `reqwest` |
| Control plane | A Cloudflare Worker with D1: accounts by email code, installations, tunnels, relay tokens | `better-auth`, `zod` | `worker`; excluded by D10 |
| Team packages | One Markdown file with YAML front matter, checked with strict schemas. Routines arrive paused. No credential is in a package. | `yaml`, `zod` | `serde_norway` or `serde_yaml_ng`, `serde` |
| Headless CLI | Commands that call the running server. One JSON document on stdout, fixed exit codes, no flag that takes a token. | `node:util`, `fetch` | `clap`, `reqwest`, `keyring` |
| MCP server for outside clients | A stdio server that calls the REST API of the running server | Hand-written, `node:readline` | `rmcp` |
| Secret given to a bot | A single-use reference with a 1-hour life. The value is masked in each transcript and log. | Hand-written | Hand-written, `secrecy` |
| Workspace backup | An encrypted archive; key files and service tokens are never included | `tar`, `node:crypto` | `tar`, `flate2`, `aes-gcm` |
| Attachments | Stored by identifier. The extension comes from the claimed type. Content is hashed while it streams. | `node:fs`, `node:crypto` | `tokio::fs`, `sha2` |
| Large tool results | The result stays on the server, and the model queries it | `jmespath` | `jmespath` |
| Pages made by a bot | JSX is compiled on the server. A sandboxed frame talks to the host with JSON-RPC over `postMessage`. | `sucrase`, hand-written | `swc_core` for the compile step; the frame stays in the web UI |
| Image generation | HTTP calls to a provider, with a daily count on disk | `fetch` | `reqwest` |
| Usage analytics | Optional and anonymous, loaded only while the switch is on | `posthog-js` | Stays in the web UI |
| Translations | JSON packs with a hand-written lookup. A hash of each English text finds old translations. | Hand-written | Stays in the web UI; `rust-i18n` or `fluent` for CLI text |

## 11. Remaining features, confirmed in the source code

Each row in this section was confirmed in the OpenMausBot source code, not
only in a document. The column **Confirmed** says `yes` or names the part that
was not confirmed. All these features have scope `Out`, but the Bot API, pause
and tool selection are near the D8 scope.

### 11.1 Server features

| Feature | Technique (source file) | TypeScript | Rust | Confirmed |
|---|---|---|---|---|
| Bot API | A key is `bak_` + 32 random bytes; only its SHA-256 is stored, in `bot-api.json` (mode 0600). `POST /hooks/api/bots/<id>/messages` with `{message, thread?, wait?}`. Limits: 10 calls in 60 s for each bot, not for each caller, and a `GET` is not counted (`server/bot-api.ts:191-199`, `server/bot-api-host.ts:286-292`), 50 pending turns, 256 KB body. The server waits (default 50 s, maximum 300 s), then answers `200 {reply, thread}` or `202` with a status. The client then polls with `GET ?thread=`. No streaming. The message is fenced as untrusted, and a key without the owner mark gets only a small tool set. (`server/bot-api.ts`, `server/bot-api-host.ts`) | `node:crypto`, `zod` | `axum`, `rand`, `sha2`, `subtle`, `serde` | yes |
| Pause | `paused-bots.json` holds `{bots, departments, all?}`. A bot is held if it, its department or "all" is paused. A pause stops the busy threads. New turns get a 409, a scheduled routine is cancelled, the runtime refuses a hand-off with a text that tells the model not to retry. Resume removes the entry and replays nothing. (`server/host/bot-holds.ts`) | `node:fs`, `zod` | `serde_json`, `tempfile` | yes, but the webhook path was not traced |
| Presets | `org-library/presets.json`, at most 200 presets. A preset is an allowlist: name, title, description, instructions, look, playbooks, skills, memory seed. It never sets model, approval level, MCP servers or folders. Each read runs the package parser again. (`server/presets.ts`) | `zod`, `yaml` | `serde`, `serde_norway` | partly: the list of built-in roles is in the document only |
| Tool scope | Selectors `native:<name>`, `native:*`, `mcp:<server>:<name>`, `mcp:<server>:*`. A tool must match an allow entry and no deny entry. An invalid saved scope never becomes "all tools". (`packages/phone-protocol/src/tool-scope.ts`) | Hand-written | Hand-written | yes |
| Tool count limit | Limit 128 tools for a chat model. The engine's own tools are never removed. The MCP servers share the remainder. The server reads a provider's limit from its refusal text, keeps it in a 500-entry cache and tries the turn again one time. (`server/tool-count-limit.ts`) | Hand-written | Hand-written, `lru` | yes |
| Tool schema fitting | For models with a small schema limit (12,000 bytes, depth 30). Steps, in order, until the schema fits: remove annotations, remove deep descriptions, cut descriptions to 300 characters, replace deep subschemas with typed placeholders, keep top-level fields only, remove the tool. The server still checks each call against the full schema. (`server/tool-schema-profile.ts`, `server/mcp-tool-schema.ts`) | Hand-written | Hand-written on `serde_json::Value` | yes |
| Feature switches | One `features` object in `config.json`, with a schema that removes unknown keys. Each switch is read as "on unless `false`" or "off unless `true`". An environment variable wins for some. (`server/config.ts:219-248`) | `zod` | `serde` with defaults | yes; the code accepts three keys that the document does not list |
| Announcements | A JSON feed fetched from a fixed HTTPS address with no redirect, a 10 s limit and a 64 KB limit. Lifetime 1 hour after success, 5 minutes after a failure. A bundled copy and a disk cache are the fallbacks. An older feed never replaces a newer one. Targeting by version, platform, plan and language. No signature. (`server/announcements/feed.ts`, `shared/announcements.ts`) | `fetch`, `zod` | `reqwest`, `serde`, `semver` | yes |
| Sentinel (health scanner) | A CLI command that does one scan and exits; a launchd or systemd timer runs it each 120 s. It opens the databases read-only and reads the event logs from a stored byte offset. It replaces paths, numbers and identifiers in an error text with placeholders, then hashes it to group failures into issues. It writes `issues.jsonl` and `state.json` to a folder outside the data folder. (`server/sentinel/`) | `node:sqlite`, `node:crypto` | `rusqlite` (read-only flags), `sha2`, `regex`, `clap` | yes |
| Conversation search | A substring `LIKE` query on message text and tool names, in a worker thread with a read-only connection. It is not FTS. FTS5 is used only for recall (section 5). (`server/message-search-query.ts`) | `node:sqlite`, `node:worker_threads` | `rusqlite`, `tokio::task::spawn_blocking` | yes |
| Inspector | The activity view reads the event log of the thread through `GET /api/threads/:id/events`, then adds live events. Tool output and progress events are live only and are never logged. (`server/thread-events.ts`) | `node:fs` | `tokio::fs`, `serde_json` | yes |

### 11.2 Files and lent folders

Source: `electron/cloud-sync*.mjs`, `server/cloud-sync*.ts`,
`server/lent-copies.ts`. Confirmed: yes.

| Part | Technique | TypeScript | Rust |
|---|---|---|---|
| Transport | HTTPS with JSON and raw bytes under `/api/sync`. No WebSocket. No redirect is followed. | `fetch` | `reqwest` |
| Change detection | The desktop long-polls `GET /changes` (60 s) and does a full pass each 5 minutes. A file is hashed again only when its size or modification time changed. | `node:fs`, `node:crypto` | `tokio::fs`, `sha2`, `notify` |
| State | Tables `base`, `places`, `failures`, `meta` | `node:sqlite` | `rusqlite` |
| Upload | Start, send parts (16 MiB, halved on a timeout), commit. The server hashes the file again on commit. | Hand-written | Hand-written on `reqwest` |
| Conflict rule | Each write carries `baseSha256`. If the other side changed, the server answers 409 and the client tries one time with the new base. | Hand-written | Hand-written |
| Deletion rule | A file is deleted only if the base proves that it was there. The application asks the person when 10 or more files and 20% or more of the folder would go. Deleted files stay in a trash for 30 days. | Hand-written | Hand-written, `trash` |
| Download | Write to a temporary file, check the SHA-256, mark the file as downloaded, rename. An edited local file is never replaced: the new version lands beside it. | `node:fs`, `xattr` as a child | `tempfile`, `sha2`, `xattr` |
| Path rules | NFC, relative, no `..`, no backslash, no NUL. Symbolic links and hard links are never carried. Agent config files (`.mcp.json`, `CLAUDE.md`, `.claude/`) are never downloaded. | Hand-written | `unicode-normalization`, hand-written |
| Writes while the computer is away | The cloud stages each change (256 KiB limit, expected hash required). The desktop applies it later with the same compare-and-swap rule. | `zod` | `serde` |

### 11.3 Engine-specific handling

The generic ACP driver is in section 3. Each engine adds a small adapter
(`server/drivers/acp/*.ts`). Confirmed: yes for the engines in the table; eight
more engines (Kimi, Cline, Copilot, Devin, Droid, Omp, Command-Code, Mistral
Vibe) were only skimmed.

| Engine | Command | Approval mapping | Special handling |
|---|---|---|---|
| Cursor | `cursor-agent [--force \| --auto-review] --approve-mcps acp` | Full: `--force`. Auto: `--auto-review`. | Model identifiers with parameters; `session/set_model` with a fallback when the method is not found |
| OpenCode | `opencode acp` | Full: an `OPENCODE_PERMISSION` JSON that allows all | No `authenticate` step; one process serves up to 6 sessions; a change of the auth file forces a new process |
| Grok | `grok --permission-mode X agent stdio` | Four modes, one for each level | Checks its MCP list before the prompt; `XAI_API_KEY` is removed from the environment |
| Gemini | `gemini --acp [--yolo \| --approval-mode auto_edit]` | Full: yolo. Edits: `auto_edit`. | Retired from the default list; the file says that it was not tested with a live CLI |
| Antigravity | Managed runtime | `session/set_config_option mode`, confirmed by the echo | `session/resume`; isolated profile |
| Qwen | `qwen --acp [--yolo \| --approval-mode ...]` | From the command line | Reads models from `~/.qwen/settings.json` |
| Kiro | `kiro-cli acp --agent-engine=v3 --auth-method=cli` | `set_config_option autopilot` on each turn | Reads its sign-in state from a SQLite file, read-only |
| Hermes | `hermes acp` | Generic | Steering with `/steer`; provider keys removed from the environment |
| DeepSeek | `dsh --profile acp` | Generic | `session/resume` |
| Muse Code | `muse serve` (not ACP) | Full: allow all. Other levels: prompt. | The only driver with an SDK: `@muse-code/sdk` gives the message framing |

A Rust port needs one adapter trait with the same points: command line, auth
method, model list, approval mapping, and whether a new process is necessary
when the MCP set changes. `serde_norway` reads the YAML config files of Grok
and Hermes. Rules to keep: confirm a model or mode change from the echoed
options, and stop the turn if the engine would run a different model.

### 11.4 Team and organization features in the open-source tree

Confirmed: partly. The Admin service is not in the repository, and code under
`enterprise/` was not read.

| Feature | Technique (source file) | TypeScript | Rust |
|---|---|---|---|
| Audience rule | An audience is `team`, `room:<id>` or `member:<person>`. A turn reads `team` and its own audience, and writes only to its own. No role sees the `member:` audience of another person. Memory is in a separate folder for each audience. (`server/audience.ts`) | Hand-written | An enum in `bot-protocol`, hand-written checks |
| Event filter | Each SSE frame is filtered for each person by its kind. An unknown frame kind is sent only if it names nothing hidden. (`server/bot-visibility.ts`) | Hand-written | Hand-written |
| Bot access | Levels `none < view < chat < edit`, for everyone or for an address or a domain | Hand-written | An ordered enum |
| Signed requests from the Admin | HMAC-SHA256 with a shared secret over time, nonce, method, target and body hash. Clock difference at most 300 s; a nonce cache for 10 minutes. No asymmetric signature and no key pinning. (`server/cloud-home.ts`) | `node:crypto` | `hmac`, `sha2`, `subtle` |
| Incidents | A failed or stalled run becomes a report to the Chief of Staff bot of the owner, with limits for each thread and each hour. (`server/incidents.ts`) | Hand-written | Hand-written |
| Slack | The Admin receives Slack events and calls `POST /api/slack/team/messages` with a session of the person who wrote. The call is idempotent on its `id`. (`server/team-slack.ts`) | `zod`, `node:crypto` | `axum`, `serde`, `hmac` |
| Team files | One shared folder, 5 GiB limit, links never followed. A member changes only their own uploads. (`server/host/team-files.ts`) | `node:fs` | `tokio::fs` |
| Organization library | A catalog and release files, checked by SHA-256 digest only. (`server/org-library.ts`) | `node:crypto` | `sha2` |
| Organization icons | PNG data only, checked by magic bytes and header, at most 256 × 256 pixels and 96 KiB | Hand-written | `png` or `image` |

One disagreement between document and code: `docs/desktop-library.md` says
that the desktop keeps a "verified copy" of the catalog. The code in
`electron/org-library.mjs:260-270` still adopts a catalog when its hash is
different from the expected digest, and only schedules a new attempt.

### 11.5 Phone applications

- **The native application sources are not in the repository.** The repository
  has only the shared wire types (`packages/phone-protocol`), which a script
  copies to a separate phone repository. Storage on the phone is in a document
  only and is not confirmed.
- **Server side** (confirmed): the companion sidecar, its default-deny route
  list and the end-to-end encryption are in sections 8 and 10.
- **Web application** (confirmed): the same React UI with a web manifest
  (`display: standalone`). There is no service worker, no offline mode and no
  web push. A test asserts that no service worker is registered.
- **Browser pairing** (confirmed): `POST /api/auth/pair` with the code sets an
  HttpOnly session cookie.
- **Rust:** nothing more than `axum` and the crates of section 2. A Tauri 2
  mobile target is a possible way to make a phone application; it was not
  examined.
- **Disagreement:** `docs/ios-companion.md` says that Swift tests run in the
  repository CI. No workflow in `.github/workflows/` does that.

### 11.6 UI features

Confirmed: yes. All of these stay in the web UI, so no crate replaces them.

| Feature | Technique (source file) |
|---|---|
| Skins | 13 blocks of CSS custom properties, selected with `data-skin` on the root element. The choice is in `localStorage`. A hand-written script calculates the WCAG contrast of each skin and fails the build below 4.5 for text. (`src/lib/skins.ts`, `scripts/check-skin-contrast.mjs`) |
| Mascot | The `cursor` body: SVG paths, changed directly with `setAttribute` on a shared clock, with a face that a generator script places (rasterize, find the largest inscribed circle, place the face). On the desktop, the other bodies are drawn by the vendored Open Bot Avatar engine, and the generator face is used for the `cursor` body only. Our mascot is an ant (D23). (`src/components/CursorAvatar.tsx`, `scripts/gen-mascot-bodies.ts`, `src/components/Avatar.tsx:118-135`, `packages/phone-protocol/src/open-bot-avatar/`; see [`research/features/mascot.md`](research/features/mascot.md)) |
| Tool chips | Messages of kind `activity` are grouped into runs. (`src/lib/activity-runs.ts`) |
| Bot profile | Length limits for each field. An avatar address must be an attachment of the server with a raster extension: no SVG and no outside address. (`shared/bot-profile.ts`, `shared/bot-avatar.ts`) |
| Order and unread | The bot order and the unread state are stored on the server. (`shared/bot-order.ts`, `server/routes/bot-order.ts`) |
| Drafts and layout | Drafts, widths and the skin are in `localStorage` for each device. (`src/lib/drafts.ts`) |

### 11.7 Build and release

Confirmed: partly. Release secrets and the deploy hook of the documentation
site are in documents only.

| Topic | OpenMausBot | opensomething |
|---|---|---|
| Version | A workflow sets the version, records the data format and opens a pull request | `[workspace.package] version`; a release workflow is not written yet |
| Release notes | Generated by GitHub | Not decided |
| macOS signing | Certificate in a temporary keychain, `codesign`, `xcrun notarytool`, `xcrun stapler`. The update feed is made again after stapling, because stapling changes the bytes. | The Tauri bundler signs and notarizes with the same Apple tools |
| Windows signing | Not signed; NSIS installer and a zip | The Tauri bundler makes NSIS or MSI; signing is not decided |
| Linux packages | AppImage, deb, pacman | The Tauri bundler makes AppImage, deb and rpm |
| Update feed | GitHub releases with `latest*.yml`; download is not automatic; a second repository must get the same bytes for old builds | `tauri-plugin-updater` with a signed JSON feed |
| Stable channel | After 48 hours a workflow moves the `stable` tags | Not planned |
| Pinned binaries | Each downloaded binary has a version and a SHA-256 in the repository | Same rule if we bundle a binary; `sha2` |
| License records | License files in `third_party/`; an SBOM only for the Rust computer driver, made with `cargo-about` | `cargo deny check` (D6); `cargo-about` if an SBOM is necessary |
| Documentation site | Next 16 with Fumadocs, MDX content, built-in search | Not planned |
| Evaluation suite | Tier 1: JSON scenarios with a scripted fake CLI. Tier 2: recorded threads against baselines. Tier 3: live runs with a model as judge, only on request. Scorers are pure checks on a snapshot. | Tier 1 maps to the fake driver in `bot-testkit` (D8); `insta` for baselines |

## 12. What is still not covered

- The native phone applications: their source is in a different repository.
- The Admin service for teams, and all code under `enterprise/`.
- Eight ACP engines that were only skimmed (see 11.3).
- The list of built-in preset roles, the order of the notice queue in the UI,
  and the webhook path of the pause feature.
- UI components that are only layout, other than the sidebar, the bot
  settings dialog and onboarding. Those three have research files now:
  `sidebar-and-departments.md`, `bot-settings-ui.md` and `onboarding.md` in
  `docs/research/features/`.

## Open points

- `chromiumoxide` may send `Runtime.enable`. OpenMausBot never sends it,
  because web pages detect it. This was not checked.
- The `yamux` crate was not compared with the frame profile in
  OpenMausBot's `yamux.ts`.
- The Admin side of the `connector/` protocol was not in the files that were
  read.
- Sections 2 to 10 come from reading the source code and its `import`
  lines. A small number of rows there use a document as the source; section
  11 marks this for each row.
