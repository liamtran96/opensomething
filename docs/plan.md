# Plan

The steps to a working single-bot chat program, one Rust concept at a time.
Tick a box when its "done when" is true. The reasons for this order are in
decision D9 of [`decisions.md`](decisions.md).

## How we work

- One step, one concept, one commit. Each step ends with a program that runs.
- Record a choice in [`decisions.md`](decisions.md) when you make one.
- Before every commit:

  ```
  cargo fmt --all
  cargo clippy --workspace --all-targets -- -D warnings
  cargo test --workspace
  ```

- After adding or changing a dependency, also run `cargo deny check`.
- Commit messages follow Conventional Commits, for example
  `feat(cli): add the echo loop`.
- Never put an API key in a file in this repository or in a commit.
- Follow the rules in decision D10 from step 2 on: settings do not live in
  the code, all data is in one folder, and logic stays in the library crates.

## Step 1. Echo loop

- [x] Read a line, print it back, stop on `/quit`.

**Concepts:** `main`, `String`, `loop`, `let mut`, borrowing with `&mut`,
`Result` and `?`.

## Step 2. A real reply from an AI

Design choices for this step:

- The program reads three environment variables: a base URL, an API key and a
  model name. Any OpenAI-compatible service then works without a code change.
- The HTTP call is blocking, with no async. Step 6 replaces it.
- All the code stays in `bot-cli`. Moving it is the lesson of steps 3 and 4.
- The bot has no memory yet: each line is a new question.

| Part | What to do | Concept | Done when |
|---|---|---|---|
| 2a | Get an API key and set it as an environment variable | How a program gets a secret without it being in the code | The terminal shows the variable is set |
| 2b | Add `reqwest`, `serde`, `serde_json` and `anyhow` to `[workspace.dependencies]` | Dependencies in Cargo | `cargo build` and `cargo deny check` pass |
| 2c | Write structs for the request and the response | Structs, `derive`, Rust data to JSON | A test shows the JSON you expect |
| 2d | Send one fixed message and print the reply | HTTP calls, real errors with `Result` and `?` | An AI answer appears in the terminal |
| 2e | Connect it to the echo loop | Functions, passing `&str` | Typing a line returns an AI reply |

- [ ] 2a
- [ ] 2b
- [ ] 2c
- [ ] 2d
- [ ] 2e

Providers that speak the OpenAI-compatible chat API include OpenRouter, Groq
and a local Ollama server. Check each one's current pricing and terms before
you choose.

## Step 3. The bot remembers the conversation

- [ ] Message types (a role and the text) live in `bot-protocol`.
- [ ] `bot-cli` keeps a list of messages and sends the whole list each time.

**Concepts:** enums, `Vec`, modules, using one crate from another.
**Done when:** you tell the bot your name, and two lines later it still knows
it.

## Step 4. The `Driver` trait

- [ ] A `Driver` trait in `bot-engine` with one method: send the conversation,
  get a reply.
- [ ] The chat-API code moves into `bot-engine` as one implementation.
- [ ] A fake driver that returns a fixed reply, used by a unit test.

**Concepts:** traits, generics, unit tests.
**Read first:** chapter 10 of The Rust Programming Language.
**Done when:** `cargo test --workspace` runs a test that uses no network.

## Step 5. Conversations survive a restart

- [ ] `bot-core` saves each message to a SQLite file and loads them at start.
- [ ] Tests use an in-memory database, never the real data file.
- [ ] Record the data folder's location as a decision.

**Concepts:** `rusqlite`, ownership and borrowing.
**Done when:** you quit, start again, and the bot still has the conversation.

## Step 6. The reply streams in

- [ ] The driver returns the reply piece by piece.
- [ ] The CLI prints each piece as it arrives.
- [ ] The blocking HTTP call from step 2 is gone.

**Concepts:** `async`/`await`, `tokio`, streams.
**Done when:** a long answer appears word by word.

## After step 6

The program is a tested single-bot chat with the same internal shape as the
target architecture (decision D8). The next steps are the build order in the
[`README`](../README.md):

- [ ] 7. The server, with an event bus and an event log. Write
  `docs/threat-model.md` here: this is the first step where something outside
  the terminal can reach the program.
- [ ] 7b. The desktop application (decision D10): a window that starts the
  core and shows a chat UI, with an installer for Windows first.
- [ ] 8. An ACP driver, with permission requests shown as approvals.
- [ ] 9. The assignment runtime and its invariant tests.
- [ ] 10. Several bots: `list_bots` and `coordinate_bots` over MCP.
- [ ] 11. Memory, then routines.

## What to expect

- Steps 2 and 3 are mostly new syntax.
- Step 4 is the first conceptual jump (traits).
- Step 5 is where the borrow checker pushes back. That is normal.
- Step 6 is the hardest.

## Reference

- The Rust Programming Language: https://doc.rust-lang.org/book/
- Rust by Example: https://doc.rust-lang.org/rust-by-example/
- Clippy's lint list, for when a lint message is unclear:
  https://rust-lang.github.io/rust-clippy/master/
