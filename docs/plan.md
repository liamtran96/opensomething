# Plan

The steps to a desktop application that runs one bot, then a team of bots.
Tick a box when its "done when" is true. The reasons for this order are in
decision D14 of [`decisions.md`](decisions.md).

## How we work

- One step is one or more pull requests. Each pull request obeys the size
  limit in [`AGENTS.md`](../AGENTS.md) and ends with a program that runs.
- Record a choice in [`decisions.md`](decisions.md) when you make one.
- Before every commit:

  ```
  cargo fmt --all
  cargo clippy --workspace --all-targets -- -D warnings
  cargo test --workspace
  ```

- After adding or changing a dependency, also run `cargo deny check`.
- Commit messages follow Conventional Commits, for example
  `feat(engine): add the chat driver`.
- Never put an API key in a file in this repository or in a commit.
- Follow the rules in decision D10: settings do not live in the code, all
  data is in one folder, and logic stays in the library crates.
- A test never uses the network, a real engine account or a real data folder.
  It uses the fake driver, a fake HTTP server, a fake engine CLI or an
  in-memory database.

## Done before this plan

- [x] An echo loop in `bot-cli`.
- [x] The desktop window, which sends a line to `bot-core` and shows the echo.

## Work outside the steps

- [x] The plan of part 1, split into pull requests in [`plan/`](plan/README.md)
  (#5).
- [ ] The docs web site in `apps/docs`, with a home page (decision D15, #10).
  Done when the site is published at a public address. The host and the
  publish workflow are not chosen yet.

## Part 1. One bot that answers

| Step | What to build | Crate | Concepts | Done when |
|---|---|---|---|---|
| 1 | The chat skeleton with mock data: bot list, chat pane, composer, settings panel | `bot-desktop` | React components and state | The window shows a mock conversation, and you can type in it |
| 2 | Identifiers, message types and the event union: `turn.started`, `content.delta`, `item.completed`, `runtime.error`, `turn.completed` | `bot-protocol` | Structs, enums, `serde` | A test shows the JSON of each event |
| 3 | The `Driver` trait with capability flags and typed refusals, and a fake driver | `bot-engine` | Traits, `async`, `thiserror`, unit tests | A test sends a turn to the fake driver and reads its events |
| 4 | The registry: each config entry becomes a driver. An unknown driver or a bad entry becomes "unavailable" | `bot-engine` | `HashMap`, trait objects | A test loads one good entry and one bad entry, and the good one works |
| 5 | The chat API driver with streaming | `bot-engine` | `reqwest`, `tokio`, streams | A test with a fake HTTP server gets the reply in pieces |
| 6 | Settings and the data folder, with atomic writes and redaction of secrets | `bot-core` | Files, `Result`, `regex` | Settings stay after a restart. A test shows that a key does not reach a log |
| 7 | The event bus. The window shows the streamed reply. The settings panel takes the API key | `bot-core`, `bot-desktop` | Channels, Tauri commands and events | You enter a key, send a message, and the answer appears word by word |

- [x] 1
- [ ] 2
- [ ] 3
- [ ] 4
- [ ] 5
- [ ] 6
- [ ] 7

Each step of this part is split into pull requests in
[`plan/`](plan/README.md).

Providers that speak the OpenAI-compatible chat API include OpenRouter, Groq
and a local Ollama server. Check each one's current pricing and terms before
you choose.

## Part 2. The bot remembers and acts

| Step | What to build | Crate | Concepts | Done when |
|---|---|---|---|---|
| 8 | The SQLite store for threads and messages, and the event log for each thread | `bot-core` | `rusqlite`, ownership, transactions | You quit, start again, and the conversation is there |
| 9 | The ACP driver: a generic core, a fake ACP CLI for tests, then one adapter | `bot-engine` | Child processes, JSON-RPC on stdio | A test runs a turn with the fake CLI |
| 10 | Approvals: the approval levels, the permission request path and the approval box | `bot-protocol`, `bot-engine`, `bot-desktop` | Ordered enums, requests across the bus | A permission request shows in the window, and your answer reaches the engine |

- [ ] 8
- [ ] 9
- [ ] 10

Write `docs/threat-model.md` before step 9: this is the first step where the
program starts another program.

## Part 3. A team of bots

| Step | What to build | Crate | Done when |
|---|---|---|---|
| 11 | Tasks: a bot has more than one thread | `bot-core`, `bot-desktop` | Two tasks of one bot have separate conversations |
| 12 | Our own tools for engines, given as an MCP server: `list_bots` first | `bot-engine` | An engine lists the bots through the tool |
| 13 | The assignment runtime and its invariant tests | `bot-core` | Each scenario test passes the invariant checks |
| 14 | Several bots: `coordinate_bots` writes an assignment | `bot-core`, `bot-engine` | One bot gives work to a second bot and gets the result |
| 15 | Memory, then routines | `bot-core` | A bot recalls a fact in a new task. A routine starts a turn at its time |
| 16 | Outside tools: custom MCP servers, then Composio (decision D12) | `bot-engine` | A bot calls a tool of a custom MCP server |

- [ ] 11
- [ ] 12
- [ ] 13
- [ ] 14
- [ ] 15
- [ ] 16

An HTTP server is not in these steps. The core runs in the process of the
desktop application (decision D10).

## What to expect

- Steps 1 and 2 are mostly new syntax.
- Step 3 is the first conceptual jump: traits and `async` together.
- Step 5 is the hardest step of part 1.
- Step 8 is where the borrow checker pushes back. That is normal.

## Reference

- The Rust Programming Language: https://doc.rust-lang.org/book/
- Rust by Example: https://doc.rust-lang.org/rust-by-example/
- Clippy's lint list, for when a lint message is unclear:
  https://rust-lang.github.io/rust-clippy/master/
