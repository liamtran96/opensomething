# Step 2. Identifiers, message types and the event union

- **Crate:** `bot-protocol` (all paths below are in `crates/bot-protocol/src`)
- **Done when:** a test shows the JSON of each event.
- **Rule:** this crate depends on no other crate of ours and does no I/O.

## Pull requests

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [x] 2.1 | `build(protocol): add serde` | root `Cargo.toml`, `crates/bot-protocol/Cargo.toml` | `serde` with `derive` as a dependency, and `serde_json` as a dev-dependency | `cargo deny check` passes |
| [x] 2.2 | `feat(protocol): add the identifier types` | `ids.rs`, `lib.rs` | `BotId`, `ThreadId`, `TurnId` and `MessageId`: one struct around a `String` for each. Each one is a plain string in JSON | A test turns each identifier into JSON and back |
| [ ] 2.3 | `feat(protocol): add the message types` | `message.rs`, `lib.rs` | `Role` (`user`, `assistant`, `system`) and `Message` (identifier, role, text) | A test shows the JSON of a message |
| [ ] 2.4 | `feat(protocol): add the event union` | `event.rs`, `lib.rs` | The `Event` enum with a `type` field in JSON: `turn.started`, `content.delta`, `turn.completed`, `runtime.error` | One test for each event shows its exact JSON |

## Choices

- Who makes an identifier, and its form (UUID or another form). This crate
  does no I/O, so the caller makes it.
- The fields of `runtime.error`: a code from a fixed list, and a message.
