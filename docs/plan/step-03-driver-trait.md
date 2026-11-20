# Step 3. The `Driver` trait and a fake driver

- **Crate:** `bot-engine` (all paths below are in `crates/bot-engine/src`)
- **Done when:** a test sends a turn to the fake driver and reads its events.
- **Rule:** behaviour is gated by capability flags, never by a driver's name.

## Pull requests

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [ ] 3.1 | `build(engine): add thiserror, tokio and the stream crate` | root `Cargo.toml`, `crates/bot-engine/Cargo.toml` | The dependencies of this step, and `bot-protocol` | `cargo deny check` passes |
| [ ] 3.2 | `feat(engine): add capabilities and refusals` | `capabilities.rs`, `error.rs`, `lib.rs` | `Capabilities` (streaming, interrupt, approvals, tools) and the `DriverError` enum. A refusal names the capability that is missing | A test shows the message of each error |
| [ ] 3.3 | `feat(engine): add the Driver trait` | `driver.rs`, `lib.rs` | `TurnRequest` and the trait: `capabilities`, `send_turn` (returns a stream of events) and `interrupt`. Each has a doc comment | The crate builds, and the trait works as a trait object |
| [ ] 3.4 | `feat(engine): add the fake driver` | `fake.rs`, `lib.rs` | A driver that gives a fixed list of events, with capability flags that the test sets | A test reads `turn.started`, the deltas and `turn.completed` in order |
| [ ] 3.5 | `test(engine): refuse an interrupt without the capability` | `fake.rs` | A test only | `interrupt` returns the typed refusal, and does not panic |

## Choices

- How an async method works in a trait object: the `async-trait` crate, or a
  method that returns a boxed future.
- The stream type: `futures-core` with `tokio-stream`, or a `tokio` channel.
- Where the fake driver lives until `bot-testkit` exists (decision D8): a
  public module behind a Cargo feature.
