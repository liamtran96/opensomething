# Step 5. The chat API driver with streaming

- **Crate:** `bot-engine` (all paths below are in `crates/bot-engine/src/chat`)
- **Done when:** a test with a fake HTTP server gets the reply in pieces.
- **Rule:** a test never uses the network or a real account. The API key
  never reaches a log or an error message.

## Pull requests

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [ ] 5.1 | `feat(engine): add the chat API wire types` | `wire.rs`, `mod.rs` | The request body and the stream chunk of the OpenAI-compatible chat API, with `serde` | Tests show the request JSON and read a chunk |
| [ ] 5.2 | `feat(engine): add the event stream parser` | `sse.rs` | A parser with no I/O: bytes in, `data:` lines out. It handles a line that is split between two pieces, and the `[DONE]` line | Tests with whole, split and empty input |
| [ ] 5.3 | `build(engine): add reqwest and the fake HTTP server` | root `Cargo.toml`, `crates/bot-engine/Cargo.toml` | `reqwest` with rustls and streaming. A fake HTTP server as a dev-dependency | `cargo deny check` passes |
| [ ] 5.4 | `feat(engine): add the chat driver` | `driver.rs`, `mod.rs` | `ChatDriver` implements `Driver`: it sends the request and changes each chunk into `content.delta` | A test with the fake server reads three deltas and `turn.completed` |
| [ ] 5.5 | `feat(engine): report chat API failures as events` | `driver.rs` | A bad status, a broken stream and a timeout become `runtime.error` with a code | A test for each failure. A test shows that the key is not in the error |
| [ ] 5.6 | `feat(engine): register the chat driver` | `../registry.rs`, `../config.rs` | The `chat` kind with its settings: address, model and key | A test builds a `chat` entry. An entry with no key is "unavailable" |

## Choices

- The fake HTTP server: the `wiremock` crate, or a small `tokio` listener of
  our own. Check the license before you add a crate.
- The timeouts: for the connection, and for the time between two chunks.
- `interrupt` stops the stream. Set the capability flag to agree.
