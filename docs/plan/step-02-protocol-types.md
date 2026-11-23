# Step 2. Identifiers, message types and the event union

- **Crate:** `bot-protocol` (all paths below are in `crates/bot-protocol/src`)
- **Done when:** a test shows the JSON of each event.
- **Rule:** this crate depends on no other crate of ours and does no I/O.

## Pull requests

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [x] 2.1 | `build(protocol): add serde` | root `Cargo.toml`, `crates/bot-protocol/Cargo.toml` | `serde` with `derive` as a dependency, and `serde_json` as a dev-dependency | `cargo deny check` passes |
| [x] 2.2 | `feat(protocol): add the identifier types` | `ids.rs`, `lib.rs` | `BotId`, `ThreadId`, `TurnId` and `MessageId`: one struct around a `String` for each. Each one is a plain string in JSON | A test turns each identifier into JSON and back |
| [ ] 2.3 | `feat(protocol): add the message types` | `message.rs`, `lib.rs` | `Role` (`user`, `assistant`) and `Message` (identifier, role, text) | A test shows the JSON of a message |
| [ ] 2.4 | `feat(protocol): add the event envelope and the turn events` | `event.rs`, `lib.rs` | `Event` (thread, turn, kind), and `EventKind` with a `type` field in JSON: `turn.started` and `turn.completed`. `Outcome`: `completed`, `failed`, `interrupted` | One test for each event shows its exact JSON. An unknown `type` is an error |
| [ ] 2.5 | `feat(protocol): add the content and error events` | `event.rs`, `lib.rs` | `content.delta` (a kind of stream and a piece of text), `item.completed` (the full reply text) and `runtime.error` (a code and a message) | One test for each event shows its exact JSON |

## Choices

- Who makes an identifier, and its form (UUID or another form). This crate
  does no I/O, so the caller makes it.
- The fields of `runtime.error`: a code from a fixed list, and a message.
  Decided in D20: the codes are `setup`, `engine_failed` and `internal`.

## The order of the events of one turn

Decision D20 records these rules. The fake driver of step 3 and each real
driver must obey them.

1. `turn.started` is the first event.
2. `content.delta` comes any number of times. It is for the live display.
3. `item.completed` has the full reply text. A turn that fails before the
   reply is complete has none.
4. `runtime.error` says why a turn failed. It does not end the turn.
5. `turn.completed` is the last event of each turn that started: `completed`
   after a reply, `failed` after a `runtime.error`, `interrupted` after a
   stop. A stop sends no `runtime.error`.
