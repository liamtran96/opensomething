# Orca Bots: what it does and how it is built

Orca is an open-source "agent IDE": a desktop application that runs coding
agents in git worktrees. In November 2026 it added Bots. This file describes
what a bot does, the technology under it, and the techniques that make it
work. What we can take from it is in
[`orca-bots-lessons.md`](orca-bots-lessons.md).

- **Date:** 2026-11-21
- **Version read:** commit `c9c424721a8` of `/Users/liam/orca/orca`
  (`github.com/stablyai/orca`), MIT license.
- **Method:** five readers each took one area of the code. Paths are in the
  Orca repository. A statement marked *inferred* was not read directly.
- **Not in the repository:** the hosted service that receives Slack, Linear
  and GitHub events. Only its wire contract is public.

## 1. What a bot does

The README states the product in one line: "Most bots end in a chat thread.
An Orca bot hands you the worktree."

A bot is a named persona that lives in its own folder on your computer and
runs on an agent CLI that you already have (Claude Code, Codex, or one of 18
others). You can do these things with it:

| You do | The bot does |
|---|---|
| Ask it in its chat, or mention it in Slack, Linear or GitHub | Answers where it was asked. For code work, it starts a "worker": a coding agent in a new git worktree |
| Leave it alone | The worker opens a pull request, watches its checks and reports. The bot records this on a work item |
| Open the item | You see the linked workers and pull requests, and you can open the worktree and continue the work yourself |
| Answer a question under "Needs you" | The item goes back to "In progress" and the bot continues |
| Say "every weekday at 9" or "when a check fails" | It makes an automation: a schedule, or a rule for an event |
| Do nothing | On a schedule, a read-only run "looks around" and puts suggestions in an "Up next" list |
| Put several bots in a group | They share a room, and one bot can hand work to another with `@Name` |
| Add a teammate to "Who can ask" | That person can ask the bot from Slack, Linear or GitHub |
| Share a bot | Another person gets a link, reviews the content and creates a copy |

The bot's persona and memory are Markdown files (`SOUL.md`, `MEMORY.md`) that
you can read and edit. There are 24 templates, for example pull-request
review, CI failure triage, release notes and a daily briefing.

## 2. Tech stack

Orca is TypeScript everywhere: the Electron main process is its backend, and
the window is React. opensomething has a Rust backend and a TypeScript
desktop UI. The third column is what we use, or can use, for the same job.
The table follows the style of [`comparison.md`](../comparison.md). Crate
versions are the newest on crates.io on 2026-11-21; only the existence of
each crate was checked.

**Backend.** Orca: TypeScript in the Electron main process. Us: Rust.

| Layer | Orca (TypeScript) | opensomething (Rust) |
|---|---|---|
| Language | TypeScript 7 on Node 24 | Rust 1.94, edition 2024 |
| Desktop shell | Electron 43, built with electron-vite 6 | Tauri 2; the core runs in the same process (D10) |
| Validation | zod 4 on each RPC method and each stored record | `serde` with `deny_unknown_fields` |
| Database | SQLite through `node:sqlite`, WAL mode, in a worker thread | `rusqlite` 0.43 (`bundled`), WAL mode, on a blocking task |
| Typed errors | Mostly `Error` with a string code | `thiserror` 2 enums; `anyhow` only in binaries |
| Async and timers | The Node event loop, `setInterval` | `tokio` 1 |
| Child processes | `node:child_process`, `node-pty` for terminals | `tokio::process`; `portable-pty` if we ever need a terminal |
| Claude | `@anthropic-ai/claude-agent-sdk` | No Rust SDK of that kind: an ACP agent or the chat API (D8) |
| ACP | Hand-written, with a generated protocol file | `agent-client-protocol` 5.5, or hand-written JSON-RPC on stdio |
| MCP | `@modelcontextprotocol/sdk` | `rmcp` 3.11 |
| Local RPC for the CLI | NDJSON on a Unix socket or a named pipe | Not needed while the core is a library; `interprocess` 2 if a CLI must reach a running app |
| Loopback HTTP relay | `node:http` | `axum` 0.8, `reqwest` |
| Secrets | Electron `safeStorage` and the OS keyring | `keyring` 4.2, `secrecy` |
| Hashes and tokens | `node:crypto` | `sha2`, `rand`, `subtle` |
| Schedules | `rrule` on a 60 s `setInterval` | `rrule` 0.14 or `croner` 4, on `tokio::time::interval` |
| Atomic file write | Temp file and rename | `tempfile` (`persist`) |
| Git worktrees | The `git` CLI | The `git` CLI through `tokio::process`, or `git2` 0.21 |
| Lint and format | oxlint, oxfmt, ast-grep rules, custom plugins | `cargo fmt`, `clippy -D warnings`, `cargo deny` |
| Tests | Vitest 5 | `cargo test`, `tokio::time::pause`, `insta`, the fake driver |
| Dependencies | pnpm 12, with 28 patched dependencies | Cargo workspace, versions in `[workspace.dependencies]` |
| Native code | Swift, Objective-C, C and Rust addons for OS features | Not needed for our plan; `unsafe` is forbidden in the workspace |

**Desktop UI.** Both projects write it in TypeScript with React, so this part
of Orca can be read as code in our own language.

| Layer | Orca (TypeScript) | opensomething (TypeScript) |
|---|---|---|
| Framework | React 19 with the React Compiler | React 19 |
| Build | Vite 8 through electron-vite | Vite 7 through the Tauri CLI |
| Components and styling | shadcn components on Radix, Tailwind 4 | Astryx components, StyleX (D13) |
| Icons | `lucide-react` | `lucide-react` |
| State | zustand 5 with slices | React state in `App.tsx` |
| Reads from the backend | A small store with `useSyncExternalStore`, refreshed on a `bots:changed` event | Not built yet; step 7 |
| Window to backend | Electron IPC through a preload script, then the RPC server | Tauri `invoke` and events (`@tauri-apps/api`) |
| Shared types | A `src/shared` folder that both halves import | Not possible across two languages: generate them from `bot-protocol` with `ts-rs` or `tauri-specta` |
| Long lists | `@tanstack/react-virtual` | Not needed yet |
| Lint | oxlint with a 400-line limit for `.tsx`, token rules, ast-grep rules | ESLint with `typescript-eslint` and the StyleX plugin |
| UI tests | Component fixtures with screenshots, Playwright | None yet |
| Package manager | pnpm 12 | pnpm 12 |

**Parts that we do not have.**

| Layer | Orca | opensomething |
|---|---|---|
| Mobile | Expo 58, React Native 0.88, end-to-end encryption with NaCl | Out of scope |
| Cloud in the repository | A relay for the mobile app: Hono, a Cloudflare Worker, Postgres, Cloud Run | None (D10) |
| Cloud not in the repository | The connector service at `connector.orca.dev` | None (D10) |

Size of the Bots feature: about 1,700 files and 243,000 lines, of which about
a third are tests and fixtures. The code arrived in one merge commit of
171,750 lines on 2026-11-18, so its earlier history is not visible. After
that, 366 commits touched it in four days.

## 3. Architecture in one picture

```
 Slack / Linear / GitHub / webhook
              |
   hosted connector service (closed)
              |   HTTPS long poll, 50 s
              v
+--------------------- your computer ----------------------+
|  Electron main process                                   |
|    connector client -> external conversation             |
|    automations (60 s tick)                               |
|    bot controller, items, groups, memory                 |
|    RPC server  <----  `orca` CLI  <---- the agent's shell|
|         |                                                |
|    native chat session (one per conversation)            |
|         |                                                |
|    engine: Claude SDK | Codex app-server | ACP CLI       |
|         |                                                |
|    worker: an agent in a PTY or a session, in a worktree |
+----------------------------------------------------------+
     files: ~/.orca/bots/<bot>/  SOUL.md  MEMORY.md  memory/  skills/
     SQLite: bot-items.sqlite, bot-work.sqlite, orchestration.db
```

Three design choices explain most of the code:

1. **A bot has no engine of its own.** A bot conversation is an ordinary
   "native chat" session whose working folder is the bot's home. Bot
   behaviour is added through one object of hooks: instructions, tool servers,
   per-turn context, read-only mode
   (`src/main/bots/bot-structured-session-wiring.ts`).
2. **The bot's tools are a command-line program.** The agent runs
   `orca bot …`, `orca orchestration …` and `gh` in its shell. There is no
   custom tool protocol for Orca's own tools.
3. **The host writes every piece of text that it can.** Prompts, notices and
   reports are built from stored records. Text from a person or a model is
   fenced and labelled.

## 4. The techniques

### 4.1 The bot and its home

- **Record.** A `Bot` is a zod object: id, name, agent, launch options,
  permission mode, paused flag, the id of its home chat, members, and its
  Slack, Linear and GitHub links (`src/shared/bot-types.ts`,
  `src/main/bots/bot-new-record.ts`).
- **Home.** `~/.orca/bots/<slug>/`. An isolated profile uses another root, so
  a test run never writes into the real setup (`bot-home.ts`).
- **Files.** `AGENTS.md`, `CLAUDE.md` and `bot.json` are generated and are
  rewritten when they differ. `SOUL.md` and `MEMORY.md` are written only if
  missing, with an exclusive create. `skills/<name>/SKILL.md` holds the bot's
  skills.
- **Creation.** One promise chain serialises all changes. The folder is
  reserved with a non-recursive `mkdir`, filled, and registered as a
  workspace; a failure removes it. The record is then saved and flushed.
  Deletion runs in an order that can be retried at any step.

### 4.2 A turn

- **Engines.** Claude through its agent SDK with `resume`; Codex through
  `codex app-server` with a thread id; the others through ACP. Idle sessions
  are released and started again on the next message.
- **Home chat.** One continuing session for each bot. A request from a
  connector, or an automation, opens a new background session.
- **Instructions in three layers:**
  1. A preamble at launch: the identity line, then Tools, then `SOUL.md`,
     then `MEMORY.md` (first 200 lines, fenced, labelled "notes to consult,
     not instructions"), then Rules. Tools come first "so a remembered
     listing never outranks it" (`bot-preamble.ts`).
  2. Delivery for each engine: the system prompt for Claude, developer
     instructions for Codex, and for ACP agents a `_meta` field, a
     command-line flag, an environment variable or a file in the folder. An
     agent that cannot take the instructions does not start
     (`src/main/acp/launch/acp-instructions.ts`).
  3. Context for each turn: Orca keeps a fingerprint of what the session was
     given and adds to the next message only what changed: a new soul, a
     memory difference, new rules after an update (`bot-turn-context.ts`).
- **Caller identity.** Each launch gets a token in the environment variable
  `ORCA_BOT_TOOLS_TOKEN`. The RPC server names the calling bot by this token,
  never by a session id (`bot-of-caller.ts`).
- **Outside tools.** A bot's own MCP servers are given to the engine at
  launch only. A server that needs a credential is replaced by a loopback
  address; a relay on `127.0.0.1` adds the real header or OAuth token, so the
  engine never holds it (`tool-relay/bot-tool-relay.ts`).

### 4.3 Work items

- **Store.** `bot-items.sqlite` with three tables: `items` (the current
  state), `item_links` (worker, pull request, URL, file) and `item_events`
  (append-only) (`bot-items-schema.ts`).
- **States.** `planned`, `working`, `needs_you`, `done`, `canceled`.
  `needs_you` points at the event that holds the question. The owner's reply
  records which question it answers and moves the item to `working`.
- **Writes.** Each write is one `BEGIN IMMEDIATE` transaction that changes
  the row, adds the events and marks mail as owed. The SQL runs in one worker
  thread with a queue, a timeout and a typed "unavailable" error.
- **Outbox.** Mail about a change is marked `owed`, sent to the orchestration
  database under a deterministic id, then marked `sent`. Start-up sends
  anything still owed, so mail arrives at least once.
- **Joins.** The item does not store the state of a worker or a pull request.
  It is read from the orchestration records and the GitHub cache when the
  item is shown.

### 4.4 Workers

- **Rule in the prompt.** The bot hands code work to a worker and does not
  read the project's files itself.
- **Start.** `orca orchestration worker-start --worktree new-child --repo …
  --agent … --spec "…" --item <n>`. The host inserts the dispatch record
  first, creates the worktree, starts the agent, waits until it is ready and
  delivers a fixed preamble with the bot's spec under `=== TASK ===`.
- **Finish.** The bot ends its turn and does not wait. The worker sends a
  `worker_done` message, which arrives in the bot's chat as a new user-role
  message. If the worker stops without a report, Orca writes one with a typed
  reason.
- **Follow-up.** A small database records which worker owns a conversation's
  code work, and later turns get a note to send follow-ups to that worker.
- **Jump in.** The worktree is an ordinary Orca worktree under the bot's
  home, so the person opens it like any other (*inferred* for the UI part).

### 4.5 Groups

- A group is a room with up to 32 bots. Each member has its own session for
  the room.
- A post from the owner is delivered to the members that it addresses
  (`@Name`, `@everyone`, or the room's reply mode). Each member's turn gets
  the messages it has not seen, at most 40 messages and 24,000 characters, as
  quoted data.
- Members run at the same time. There is no "one speaker" lock; a
  "reservation" is an operation id that makes delivery happen exactly once
  after a crash.
- When a member's reply names another member, that member gets a hand-off
  turn. A chain stops after six hand-offs for each owner post.
- Stop sets "stopped through message N" for each member.
- A member on a second computer is asked by peer mail to its home chat.
  Nothing is retried in that case.

### 4.6 Memory

- **Files.** `SOUL.md` is the persona. `MEMORY.md` has one line for each
  fact: `- [2026-11-21] text · from: <source>`. Details go in
  `memory/<topic>.md`.
- **No memory tool.** The bot edits the file with its normal file tools. At
  the end of the turn the host reconciles: a fact that disappeared is put
  back, a new fact gets its source from the message origin, and a source the
  model wrote is removed (`bot-memory-record.ts`).
- **Removal.** Only `orca bot memory forget`, the owner, undo or the tidy-up
  removes a fact.
- **History.** One JSON file for each bot, outside the bot's home, with 90
  days of rows that can be undone.
- **Tidy-up.** A nightly, tool-free run. The default asks the model for a
  whole new file and refuses the draft if it breaks a limit. The pilot shows
  numbered lines with a hash and accepts only `merge`, `retire` and `demote`
  operations; no model text reaches the file, and the change is applied only
  if the file did not change since the snapshot (`bot-memory-ops.ts`).
- **Journal.** When an item closes, the host adds one line to
  `memory/journal/YYYY-MM.md`. No model writes it.

### 4.7 Connectors and triggers

- **Inbound path.** The provider calls the hosted connector service. The
  service decides whether the asker is the owner or a member, and queues a
  delivery for the computer. The desktop takes it with a long poll of about
  50 seconds, writes a receipt, acknowledges `received`, runs the turn and
  acknowledges `done` (`src/main/connector-cloud/`).
- **Offline.** A message waits up to 24 hours. When it arrives late, the
  prompt says how long it waited.
- **Outbound.** The final message goes back through a reply outbox with an
  idempotency key. Reactions and progress notes go through an actions
  endpoint.
- **Who holds what.** The service holds the Slack app tokens, and all Slack
  calls go through it. GitHub writes outside the wake thread use the local
  `gh` CLI as the owner. The owner's Linear login is sealed to a key on the
  computer. Google credentials stay on the computer.
- **The prompt.** A header line is built from the service's facts, and all
  foreign text is fenced:
  `[Orca: Slack · #channel · from @Name, who has access (not your owner)]`.
- **Schedules.** A 60-second tick on the computer runs what is due
  (`rrule`, a time zone, a grace time for a missed run).
- **Events.** Rules are sent to the service, which matches them. The
  computer checks each trigger again against its own copy of the rule.
  Webhooks have a key of 256 bits, signature adapters for six providers and a
  limit of 200 runs each hour.

### 4.8 Running in the background on a laptop

- A scheduled run starts only two minutes after wake and only in a full wake.
- The computer is held awake during the run, and the 10-minute limit counts
  awake time only.
- A run that sleep or a usage limit cut short does not use its slot.
- The owner hears about the first failure of a streak. Ten failures turn
  "look around" off.
- The read-only limit is an allow-list of `orca`, `gh` and `git` subcommands,
  checked in a hook before each tool call (`bot-look-around-policy.ts`).

## 5. How to build something like it with our stack

The order follows the dependencies in Orca's code. Each layer works without
the ones after it. These layers are all backend, so the right column names
the Rust crate of ours that owns the layer, the main crates, and the plan
step that is nearest. The window for each layer is TypeScript in
`crates/bot-desktop/ui`; it calls the backend with Tauri `invoke` and shows
what the backend's events report.

| # | Layer | What Orca does | In opensomething |
|---|---|---|---|
| 1 | A session host for one engine | Starts a session, sends a turn, resumes it, stops it | The `Driver` trait in `bot-engine` with `async` methods and an event stream (`tokio`, `futures`). Steps 3, 5 and 9 |
| 2 | A bot as a folder plus a record | Generates the instruction file, seeds the persona and memory files, builds the preamble | A `Bot` struct with `serde` in `bot-protocol`; the folder and the preamble builder in `bot-core`; atomic writes with `tempfile`. Steps 6 and 15 |
| 3 | The bot's own tools | An RPC server on a Unix socket, and a CLI that the agent runs in its shell | Our tools as an MCP server (`rmcp`), in the planned `bot-tools` crate. This is decision D8, and it does not need the agent to have a shell. Step 12 |
| 4 | Work items | One SQLite file: a state table, a link table, an append-only event table, one transaction for each change | `rusqlite` `Transaction` in `bot-core` (later `bot-store`). The state is an enum. Steps 8 and 11 |
| 5 | Workers | A dispatch record, a git worktree, an agent in it, a fixed preamble, a report that returns as a message | The assignment runtime of `bot-core` behind the `TurnRunner` trait. A worktree is only needed for a coding bot. Steps 13 and 14 |
| 6 | Automations | A tick for schedules, a policy for missed runs, a background session | `tokio::time::interval` with `croner` or `rrule`, in the planned `bot-scheduler`. Step 15 |
| 7 | Memory upkeep | The record of facts, the history, the tidy-up | Tables in SQLite plus the Markdown file, in the planned `bot-memory`. Step 15 |
| 8 | Connectors | A hosted endpoint for provider webhooks, a queue for each computer, a long poll with a two-step acknowledgement | Not planned: we host nothing (D10). Outside tools come through MCP and Composio (D12). Step 16 |
| 9 | Groups, sharing, templates, mobile | Each is built on the layers above | `coordinate_bots` covers groups (step 14). The others are out of scope |

Three points where a Rust backend differs from Orca's:

- **Typed states replace runtime checks.** Orca checks at run time that a
  "needs you" item has a question, and that a refusal has a known code. In
  Rust the question is a field of the `NeedsYou` variant, and a refusal is a
  variant of a `thiserror` enum.
- **One process, no worker threads.** Orca moves SQLite and heavy reads to
  worker threads because JavaScript has one thread. We use `tokio` tasks and
  `spawn_blocking`.
- **Capabilities replace name lists.** Orca selects engine behaviour with
  sets of engine names. Our `Driver` trait returns capability flags, and the
  runtime matches on them.

One point where the desktop differs: Orca's two halves import the same
TypeScript types. Ours are in two languages, so the types of `bot-protocol`
must be generated for the window. The lessons file has the details.

## 6. Weak points that the code shows

- A member that the owner added runs the bot with the owner's full authority.
  Prompt rules are the only limit.
- An event trigger can be fired by anyone in a shared channel or repository.
- The connector service is closed, reads message content, and its decision
  about the asker is not checked again on the desktop (*inferred*).
- Engine differences are selected by sets of engine names in several places.
- A group is one JSON value that is rewritten as a whole, and some writes do
  not go through its queue.
- The identity of a memory fact is its text, so a reworded line is a new
  fact. The record of facts is in memory only, and is unknown after a restart
  until the next launch reads the file.
- Three SQLite files hold related state, joined by an outbox.

## 7. What was not read

- The hosted connector service (not public).
- Most of the orchestration layer (about 300 files) and the native chat host.
- The renderer and mobile screens, except a few files.
- The tests.
