# Plan

The steps to a desktop application that runs one bot, then a team of bots.
This file has the steps, the pull requests of each step of part 1 and
the open choices. The proposals are in one file for each feature, next to
this file. The reasons for this order are in decision D14 of [`decisions.md`](../decisions.md).

## How we work

- One step is one or more pull requests. Each pull request obeys the size
  limit in [`AGENTS.md`](../../AGENTS.md) (200 lines), builds, passes the checks
  without the ones after it, and ends with a program that runs.
- Tick a step when its "done when" is true. Tick a pull request when it is
  merged.
- "Choices" are open points. Record each one in [`decisions.md`](../decisions.md)
  when you make it, and remove it from this file.
- Split a later part into pull requests when the part before it is done,
  because its design depends on what we learn.
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

## Open proposals

The research of batches 1 and 2 (`../research/features/`) and the release
history (`../research/changelog.md`) gave 51 proposals, P1 to P51. Batch 3 (the driver contract) gave P52 to
P64. Batch 4 (six features, reference `ed8cb7278`) gave P65 to P121. Batch 5 (six features, reference `ad27f0716`) gives P122 to P163. Each
proposal is in the plan file of its feature. Each step below links to its
proposals. The author decides each one. Reply with the numbers, for example
"accept P1, P2. P5 option a. Reject P9". Then the proposal becomes a
decision, a pull request or a choice, and its text leaves the feature file.

| Feature plan | Research | Proposals | Steps |
|---|---|---|---|
| [`chat-turns.md`](chat-turns.md) | [`chat-turns.md`](../research/features/chat-turns.md) | P2, P3, P6, P8, P9, P31, P35, P36, P38, P51 | 2, 3, 7, 8, 14 |
| [`event-bus-fold.md`](event-bus-fold.md) | [`event-bus-fold.md`](../research/features/event-bus-fold.md) | P1, P27 to P30, P37, P39 | 2, 7, 8 |
| [`chat-streaming.md`](chat-streaming.md) | [`chat-streaming.md`](../research/features/chat-streaming.md) | P5, P13 to P17 | 2, 5 |
| [`newer-config-unavailable.md`](newer-config-unavailable.md) | [`newer-config-unavailable.md`](../research/features/newer-config-unavailable.md) | P10, P11, P12, P22, P23 | 4, 6 |
| [`file-modes-atomic-writes-redaction.md`](file-modes-atomic-writes-redaction.md) | [`file-modes-atomic-writes-redaction.md`](../research/features/file-modes-atomic-writes-redaction.md) | P4, P18, P24, P25 | 2, 6, 7 |
| [`write-only-secrets.md`](write-only-secrets.md) | [`write-only-secrets.md`](../research/features/write-only-secrets.md) | P19, P20, P21, P32, P40 | 6, 7, 9 |
| [`queue-and-steer.md`](queue-and-steer.md) | [`queue-and-steer.md`](../research/features/queue-and-steer.md) | P34 | 7, 8 |
| [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md) | [`chat-driver-tool-calls.md`](../research/features/chat-driver-tool-calls.md) | P7, P33, P42 to P47, P49, P50 | 2, 10, 12 |
| [`driver-contract.md`](driver-contract.md) | [`driver-contract.md`](../research/features/driver-contract.md) | P53 to P64, and more cases for P6. P52 is decided (D22) | 3, 4, 5, 7, 8, 9 |
| [`engine-process-lifecycle.md`](engine-process-lifecycle.md) | [`engine-process-lifecycle.md`](../research/features/engine-process-lifecycle.md) | P65 to P73 | 3, 9, 10 |
| [`store-and-data-format.md`](store-and-data-format.md) | [`store-and-data-format.md`](../research/features/store-and-data-format.md) | P74 to P85 | 6, 8, 13 |
| [`composition-root.md`](composition-root.md) | [`composition-root.md`](../research/features/composition-root.md) | P86 to P94, and new facts for P26 | 4, 6, 7, 15, later |
| [`security-model.md`](security-model.md) | [`security-model.md`](../research/features/security-model.md) | P95 to P101 | 6, before 9, 10, 12 |
| [`acp-core.md`](acp-core.md) | [`acp-core.md`](../research/features/acp-core.md) | P102 to P109, and new facts for P6, P53, P54, P61, P63 | 8, 9, 10 |
| [`approval-levels.md`](approval-levels.md) | [`approval-levels.md`](../research/features/approval-levels.md) | P110 to P121, and new facts for P42, P44 to P46, P49 | 3, 10, 12, 14 |
| [`chat-ui.md`](chat-ui.md) | [`chat-ui.md`](../research/features/chat-ui.md) | P122 to P128, and new facts for P25, P27, P28, P34, P35, P36 | 5, 7, 8, gap |
| [`turn-limits.md`](turn-limits.md) | [`turn-limits.md`](../research/features/turn-limits.md) | P129 to P134, and new facts for P33 | 2, 9, 13 |
| [`question-cards.md`](question-cards.md) | [`question-cards.md`](../research/features/question-cards.md) | P135 to P138, and new facts for P42, P44, P45, P116, P118, P120, P121 | 9, 10, 13, 14 |
| [`approval-cards.md`](approval-cards.md) | [`approval-cards.md`](../research/features/approval-cards.md) | P139 to P144, and new facts for P25, P44, P45, P121, P128 | 6, 10, 11 to 16 |
| this file | the plan itself and [`changelog.md`](../research/changelog.md) | P26, P41, P48 | 7, 9, 12 |

- Decide P1 to P7 first. They change the types of `bot-protocol`, and step
  2.5 is not typed yet.
- Decide [P65 to P67](engine-process-lifecycle.md) before step 3 is
  typed. They change the `interrupt` method of the `Driver` trait.
- Two proposals change the structure: [P33](chat-driver-tool-calls.md)
  (tools for a bot on the chat API) and P26 (the composition root, which
  blocks PR 7.3).
- Each proposal has a reason of one of these kinds: a wrong state that the
  compiler refuses, less code, or a known problem of the reference.
- All reference lines come from the research files, which read the reference
  at commit `3aec210`. On 2026-11-23 the reference was at `77f41d3`. Two cited
  files changed: `server/index.ts` (43 added, 44 deleted lines) and
  `packages/phone-protocol/src/app-settings.ts` (1 deleted line). Some
  `index.ts` line numbers can be wrong by some lines. Check them before the
  author types a step (step 7 of "How to run a batch" in
  [`../research/progress.md`](../research/progress.md)). The files of
  batch 4 read the reference at `ed8cb7278`.

## Done before this plan

- [x] An echo loop in `bot-cli`.
- [x] The desktop window, which sends a line to `bot-core` and shows the echo.

## Work outside the steps

- [x] The plan of part 1, split into pull requests (#5).
- [ ] The docs web site in `apps/docs`, with a home page (decision D15, #10).
  Done when the site is published at a public address. The host and the
  publish workflow are not chosen yet.

## Part 1. One bot that answers

| Step | What to build | Crate | Concepts | Done when |
|---|---|---|---|---|
| 1 | The chat skeleton with mock data: bot list, chat pane, composer, settings panel | `bot-desktop` | React components and state | The window shows a mock conversation, and you can type in it |
| 2 | Identifiers, message types and the event union: `turn.started`, `content.delta`, `item.completed`, `runtime.error`, `turn.completed` | `bot-protocol` | Structs, enums, `serde` | A test shows the JSON of each event |
| 3 | The `Driver` trait with typed refusals, and a fake driver | `bot-engine` | Traits, `async`, `thiserror`, unit tests | A test sends a turn to the fake driver and reads its events |
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

Providers that speak the OpenAI-compatible chat API include OpenRouter, Groq
and a local Ollama server. Check each one's current pricing and terms before
you choose.

### Step 1. The chat skeleton with mock data

- **Crate:** `bot-desktop` (all paths below are in `crates/bot-desktop/ui/src`)
- **Done when:** the window shows a mock conversation, and you can type in it.

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [x] 1.1 | `feat(desktop): add background templates` | `features/backdrop/backdrops.ts`, `features/backdrop/BackdropPicker.tsx`, `app/App.tsx` | Five backgrounds, a swatch picker, the glass panel. Each background sets the colour mode | A click on a swatch changes the background |
| [x] 1.2 | `feat(desktop): make the scroll bar thin` | `global.css`, `app/App.tsx` | A 4 px scroll bar. The chat cuts the strip below the composer | A long chat shows a thin bar, and no message shows below the composer |
| [x] 1.3 | `refactor(desktop): move the chat to its own feature` | `features/chat/ChatPane.tsx`, `features/chat/types.ts`, `app/App.tsx` | Move the message list and the composer out of `App.tsx`. No change in behaviour | The window looks and works as before |
| [x] 1.4 | `feat(desktop): show a mock conversation` | `mocks/bots.ts`, `features/chat/ChatPane.tsx` | Mock bots, each with a name and a list of messages. The chat opens with the messages of the first bot | The window opens with a conversation in it |
| [x] 1.5 | `feat(desktop): add the bot list` | `features/bots/BotList.tsx`, `app/App.tsx` | A list of bots at the left of the glass panel. A click selects a bot and shows its conversation | Each bot shows its own conversation. A typed message stays with its bot |
| [x] 1.6 | `feat(desktop): add the settings panel` | `features/settings/SettingsPanel.tsx`, `app/App.tsx` | A button opens a panel with the provider address, the model, the API key and the background picker. Nothing is saved | The panel opens and closes. The key field hides its text |

Pull request 1.1 was merged as #6, and 1.2 as #7 and #9. Pull requests 1.3
to 1.6 became one pull request, which builds the complete layout of the
reference project (decision D16). Its files are in `features/sidebar`,
`features/chat`, `features/settings` and `mocks`, not at the paths in the
table.

**Choices**

- The bot list is our own component, and the settings are an Astryx `Dialog`
  (decision D16).
- A typed message still goes to the echo command until step 7. The other
  choice is a fixed mock reply with no Tauri call.

### Step 2. Identifiers, message types and the event union

- **Crate:** `bot-protocol` (all paths below are in `crates/bot-protocol/src`)
- **Done when:** a test shows the JSON of each event.
- **Rule:** this crate depends on no other crate of ours and does no I/O.
- **Code to type:** [`code/turn-flow-comparison/`](../code/turn-flow-comparison/README.md).

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [x] 2.1 | `build(protocol): add serde` | root `Cargo.toml`, `crates/bot-protocol/Cargo.toml` | `serde` with `derive` as a dependency, and `serde_json` as a dev-dependency | `cargo deny check` passes |
| [x] 2.2 | `feat(protocol): add the identifier types` | `ids.rs`, `lib.rs` | `BotId`, `ThreadId`, `TurnId` and `MessageId`: one struct around a `String` for each. Each one is a plain string in JSON | A test turns each identifier into JSON and back |
| [x] 2.3 | `feat(protocol): add the message types` | `message.rs`, `lib.rs` | `Role` (`user`, `assistant`) and `Message` (identifier, role, text) | A test shows the JSON of a message |
| [x] 2.4 | `feat(protocol): add the event envelope and the turn events` | `event.rs`, `lib.rs` | `Event` (thread, turn, kind), and `EventKind` with a `type` field in JSON: `turn.started` and `turn.completed`. `Outcome`: `completed`, `failed`, `interrupted` | One test for each event shows its exact JSON. An unknown `type` is an error |
| [ ] 2.5 | `feat(protocol): add the content and error events` | `event.rs`, `lib.rs` | `content.delta` (a kind of stream and a piece of text), `item.completed` (the full reply text) and `runtime.error` (a code and a message) | One test for each event shows its exact JSON |

**The order of the events of one turn.** Decision D20 records these rules.
The fake driver of step 3 and each real driver must obey them.

1. `turn.started` is the first event.
2. `content.delta` comes any number of times. It is for the live display.
3. `item.completed` has the full reply text. A turn that fails before the
   reply is complete has none.
4. `runtime.error` says why a turn failed. It does not end the turn.
5. `turn.completed` is the last event of each turn that started: `completed`
   after a reply, `failed` after a `runtime.error`, `interrupted` after a
   stop. A stop sends no `runtime.error`.

**Choices**

- Who makes an identifier, and its form (UUID or another form). This crate
  does no I/O, so the caller makes it.

**Proposals:** [P1](event-bus-fold.md), [P3](chat-turns.md), [P4](file-modes-atomic-writes-redaction.md), [P5](chat-streaming.md), [P7](chat-driver-tool-calls.md), [P129](turn-limits.md).

### Step 3. The `Driver` trait and a fake driver

- **Crate:** `bot-engine` (all paths below are in `crates/bot-engine/src`)
- **Done when:** a test sends a turn to the fake driver and reads its events.
- **Rule:** behaviour is gated by capability flags, never by a driver's name.
- **Decided:** each driver streams, takes a stop and answers a request. These
  are not flags (decision D22). Step 3 has no capability flag. The
  `Capabilities` struct comes with the first step that reads a flag.

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [ ] 3.1 | `build(engine): add thiserror, tokio and the stream crate` | root `Cargo.toml`, `crates/bot-engine/Cargo.toml` | The dependencies of this step, and `bot-protocol` | `cargo deny check` passes |
| [ ] 3.2 | `feat(engine): add the driver refusals` | `error.rs`, `lib.rs` | The `DriverError` enum: the typed refusals of a driver | A test shows the message of each error |
| [ ] 3.3 | `feat(engine): add the Driver trait` | `driver.rs`, `lib.rs` | `TurnRequest` and the trait: `send_turn` (returns a stream of events) and `interrupt`, which each driver must support. Each has a doc comment | The crate builds, and the trait works as a trait object |
| [ ] 3.4 | `feat(engine): add the fake driver` | `fake.rs`, `lib.rs` | A driver that gives a fixed list of events that the test sets | A test reads `turn.started`, the deltas, `item.completed` and `turn.completed` in order |
| [ ] 3.5 | `test(engine): stop a turn of the fake driver` | `fake.rs` | A test only | After `interrupt`, the last event is `turn.completed` with `interrupted` (D20) |

**Choices**

- How an async method works in a trait object: the `async-trait` crate, or a
  method that returns a boxed future.
- The stream type: `futures-core` with `tokio-stream`, or a `tokio` channel.
- Where the fake driver lives until `bot-testkit` exists (decision D8): a
  public module behind a Cargo feature.

**Proposals:** [P2](chat-turns.md), [P6](chat-turns.md), [P8](chat-turns.md), [P9](chat-turns.md), [P53 to P60](driver-contract.md), [P65](engine-process-lifecycle.md), [P66](engine-process-lifecycle.md), [P67](engine-process-lifecycle.md), [P113](approval-levels.md).

### Step 4. The registry

- **Crate:** `bot-engine` (all paths below are in `crates/bot-engine/src`)
- **Done when:** a test loads one good entry and one bad entry, and the good
  one works.

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [ ] 4.1 | `feat(engine): add the driver config entry` | `config.rs`, `lib.rs` | `DriverEntry`: an identifier, a kind (`fake`, later `chat` and `acp`) and the settings of that kind. It is read with `serde` | A test reads an entry from JSON |
| [ ] 4.2 | `feat(engine): add the registry` | `registry.rs`, `lib.rs` | `Registry` holds a `HashMap` from the identifier to a slot. A slot is a driver or "unavailable" with a reason. `get` returns the driver or a typed refusal | A test builds a registry from one `fake` entry and sends a turn |
| [ ] 4.3 | `test(engine): keep a bad entry as unavailable` | `registry.rs` | A test with an unknown kind and a test with bad settings | The bad entry is "unavailable" with its reason, and the good entry works |

**Choices**

- The registry never fails as a whole: one bad entry must not stop the others.
- The reason of an unavailable entry is shown to the person, so it must not
  contain a secret.

**Proposals:** [P10](newer-config-unavailable.md), [P11](newer-config-unavailable.md), [P12](newer-config-unavailable.md), [P62](driver-contract.md), [P88](composition-root.md).

### Step 5. The chat API driver with streaming

- **Crate:** `bot-engine` (all paths below are in `crates/bot-engine/src/chat`)
- **Done when:** a test with a fake HTTP server gets the reply in pieces.
- **Rule:** a test never uses the network or a real account. The API key
  never reaches a log or an error message.

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [ ] 5.1 | `feat(engine): add the chat API wire types` | `wire.rs`, `mod.rs` | The request body and the stream chunk of the OpenAI-compatible chat API, with `serde` | Tests show the request JSON and read a chunk |
| [ ] 5.2 | `feat(engine): add the event stream parser` | `sse.rs` | A parser with no I/O: bytes in, `data:` lines out. It handles a line that is split between two pieces, and the `[DONE]` line | Tests with whole, split and empty input |
| [ ] 5.3 | `build(engine): add reqwest and the fake HTTP server` | root `Cargo.toml`, `crates/bot-engine/Cargo.toml` | `reqwest` with rustls and streaming. A fake HTTP server as a dev-dependency | `cargo deny check` passes |
| [ ] 5.4 | `feat(engine): add the chat driver` | `driver.rs`, `mod.rs` | `ChatDriver` implements `Driver`: it sends the request, changes each chunk into `content.delta`, and sends the full text in `item.completed` | A test with the fake server reads three deltas, `item.completed` and `turn.completed` |
| [ ] 5.5 | `feat(engine): report chat API failures as events` | `driver.rs` | A bad status, a broken stream and a timeout become `runtime.error` with a code | A test for each failure. A test shows that the key is not in the error |
| [ ] 5.6 | `feat(engine): register the chat driver` | `../registry.rs`, `../config.rs` | The `chat` kind with its settings: address, model and key | A test builds a `chat` entry. An entry with no key is "unavailable" |

**Choices**

- The fake HTTP server: the `wiremock` crate, or a small `tokio` listener of
  our own. Check the license before you add a crate.
- The timeouts: for the connection, and for the time between two chunks
  (P14).
- `interrupt` follows the chat driver of the reference: it does nothing when
  no turn runs or the turn id is another turn, else it aborts the request and
  waits for the turn to end (`server/drivers/openai-chat.ts:961-966`). Each
  driver must support it (D22).

**Proposals:** [P13](chat-streaming.md), [P14](chat-streaming.md), [P15](chat-streaming.md), [P16](chat-streaming.md), [P17](chat-streaming.md), [P60](driver-contract.md) (the contract test runs on the chat driver), [P124](chat-ui.md).

### Step 6. Settings and the data folder

- **Crate:** `bot-core` (all paths below are in `crates/bot-core/src`)
- **Done when:** settings stay after a restart. A test shows that a key does
  not reach a log.
- **Rule:** all data is in one folder, and one setting names that folder
  (decision D10). A test uses a temporary folder, never a real data folder.

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [ ] 6.1 | `feat(core): add the data folder` | `data_dir.rs`, `error.rs`, `lib.rs` | `DataDir` is made from a path that the caller gives. It creates the folder and gives the path of each file in it | Tests with a temporary folder |
| [ ] 6.2 | `feat(core): add the settings type` | `settings.rs`, `lib.rs` | `Settings` with `serde`: the driver entries and the chosen background. A missing field gets its default | A test reads an empty file and an old file |
| [ ] 6.3 | `feat(core): save settings with an atomic write` | `settings.rs`, `atomic.rs` | Write to a temporary file in the same folder, then rename it | A test saves, loads and compares. A test shows that a failed write keeps the old file |
| [ ] 6.4 | `feat(core): redact secrets` | `redact.rs`, `lib.rs` | `redact(text)` replaces the known secret values and the text that matches a key pattern | A test shows that a key in an error message does not reach the output |
| [ ] 6.5 | `feat(core): keep the key out of Debug output` | `settings.rs` | A `Secret` type for the key. Its `Debug` output is `[redacted]` | A test prints the settings and finds no key |

**Choices**

- The file format of the settings: TOML or JSON.
- Where the API key lives: in the settings file in the data folder, or in the
  keychain of the operating system (P19). Record the risk of the choice.
- The default data folder comes from the shell (`bot-desktop` or `bot-cli`),
  and the environment variable that overrides it.

**Proposals:** [P18](file-modes-atomic-writes-redaction.md), [P19](write-only-secrets.md), [P20](write-only-secrets.md), [P21](write-only-secrets.md), [P22](newer-config-unavailable.md), [P23](newer-config-unavailable.md), [P24](file-modes-atomic-writes-redaction.md), [P74](store-and-data-format.md), [P76](store-and-data-format.md), [P77](store-and-data-format.md), [P86](composition-root.md), [P91](composition-root.md), [P100](security-model.md), [P144](approval-cards.md).

### Step 7. The event bus and the streamed reply in the window

- **Crates:** `bot-core` and `bot-desktop`
- **Done when:** you enter a key, send a message, and the answer appears word
  by word.
- **Rule:** the runtime in `bot-core` reaches the host only through its
  `TurnRunner` trait. Logic stays in the library crates.

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [ ] 7.1 | `feat(core): add the event bus` | `bot-core/src/bus.rs` | A bus on a `tokio` broadcast channel. Each subscriber gets each event | A test with two subscribers |
| [ ] 7.2 | `feat(core): add the TurnRunner trait` | `bot-core/src/runner.rs` | The trait, with a doc comment, and a function that runs one turn and publishes its events on the bus | A test with a fake runner reads the events from the bus |
| [ ] 7.3 | `feat(desktop): run turns through the registry` | `bot-desktop/src/main.rs`, `bot-desktop/src/runner.rs` | The desktop loads the settings, builds the registry and gives `bot-core` a `TurnRunner` that calls the driver | `send_message` returns immediately, and the turn runs |
| [ ] 7.4 | `feat(desktop): send bus events to the window` | `bot-desktop/src/events.rs`, `capabilities/default.json` | A task that reads the bus and emits each event to the window | The events show in the console of the window |
| [ ] 7.5 | `feat(desktop): show the streamed reply` | `ui/src/features/chat/useTurnEvents.ts`, `ChatPane.tsx` | The chat listens for the events. It shows the `assistant_text` deltas as live text, and replaces that text with the text of `item.completed`. A `runtime.error` shows as an error notice. `turn.completed` ends the working state | The answer appears word by word |
| [ ] 7.6 | `feat(desktop): save the API key from the settings panel` | `bot-desktop/src/settings.rs`, `ui/src/features/settings/SettingsPanel.tsx` | Commands to load and save the settings. The window never gets the saved key back, only "a key is set" | You enter a key, restart, and the bot answers |

**Choices**

- `AGENTS.md` says that `bot-cli` is the only composition root. In this step
  `bot-desktop` also connects the crates (P26).
- What a slow subscriber of the bus loses, and how the window recovers
  (P28).
- The name and the payload of the Tauri event (P29).

**Proposals:** [P25](file-modes-atomic-writes-redaction.md), P26, [P27](event-bus-fold.md), [P28](event-bus-fold.md), [P29](event-bus-fold.md), [P30](event-bus-fold.md), [P31](chat-turns.md), [P32](write-only-secrets.md), [P64](driver-contract.md) (or step 8), [P87](composition-root.md), [P89](composition-root.md), [P90](composition-root.md), [P91](composition-root.md), [P93](composition-root.md), [P122](chat-ui.md), [P123](chat-ui.md), [P125](chat-ui.md), [P126](chat-ui.md), [P127](chat-ui.md).

- **P26. The composition root. This blocks PR 7.3.**
  - Option a: change the rule of `AGENTS.md`: `bot-cli` and `bot-desktop`
    are the two composition roots, and neither has logic.
  - Option b: a shared function in a library crate builds the parts, and
    both binaries call it.
  - Recommendation: a. It is one line of `AGENTS.md`, and D10 already makes
    the desktop the product.

## Part 2. The bot remembers and acts

| Step | What to build | Crate | Concepts | Done when |
|---|---|---|---|---|
| 8 | The SQLite store for threads and messages, and the event log for each thread | `bot-core` | `rusqlite`, ownership, transactions | You quit, start again, and the conversation is there |
| 9 | The ACP driver: a generic core, a fake ACP CLI for tests, then one adapter | `bot-engine` | Child processes, JSON-RPC on stdio | A test runs a turn with the fake CLI |
| 10 | Approvals: the approval levels, the permission request path and the approval box | `bot-protocol`, `bot-engine`, `bot-desktop` | Ordered enums, requests across the bus | A permission request shows in the window, and your answer reaches the engine |

- [ ] 8
- [ ] 9
- [ ] 10

- **Proposals of step 8:** [P75](store-and-data-format.md), [P76](store-and-data-format.md), [P77](store-and-data-format.md), [P78](store-and-data-format.md), [P79](store-and-data-format.md), [P80](store-and-data-format.md), [P81](store-and-data-format.md), [P82](store-and-data-format.md), [P108](acp-core.md), [P124](chat-ui.md).
- **Proposals of step 9:** [P66](engine-process-lifecycle.md), [P67](engine-process-lifecycle.md), [P68](engine-process-lifecycle.md), [P69](engine-process-lifecycle.md), [P70](engine-process-lifecycle.md), [P71](engine-process-lifecycle.md), [P72](engine-process-lifecycle.md), [P102](acp-core.md), [P103](acp-core.md), [P104](acp-core.md), [P105](acp-core.md), [P106](acp-core.md), [P108](acp-core.md), [P109](acp-core.md), [P130](turn-limits.md), [P134](turn-limits.md), [P136](question-cards.md).
- **Proposals of step 10:** [P72](engine-process-lifecycle.md), [P73](engine-process-lifecycle.md), [P96](security-model.md), [P97](security-model.md), [P107](acp-core.md), [P110](approval-levels.md), [P111](approval-levels.md), [P112](approval-levels.md), [P113](approval-levels.md), [P114](approval-levels.md), [P115](approval-levels.md), [P116](approval-levels.md), [P117](approval-levels.md), [P118](approval-levels.md), [P119](approval-levels.md), [P120](approval-levels.md), [P121](approval-levels.md), [P135](question-cards.md), [P136](question-cards.md), [P137](question-cards.md), [P139](approval-cards.md), [P141](approval-cards.md).

Write `docs/threat-model.md` before step 9: this is the first step where the
program starts another program. What it must cover: [P95](security-model.md).

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

## Gaps that have no step

Each one is in the file of its feature: [P33](chat-driver-tool-calls.md), [P34](queue-and-steer.md), [P35](chat-turns.md), [P36](chat-turns.md), [P128](chat-ui.md).

## Notes for steps 8 to 14

Each note is in the file of its feature: [P37](event-bus-fold.md), [P38](chat-turns.md), [P39](event-bus-fold.md), [P40](write-only-secrets.md), [P42](chat-driver-tool-calls.md), [P43](chat-driver-tool-calls.md), [P44](chat-driver-tool-calls.md), [P45](chat-driver-tool-calls.md), [P46](chat-driver-tool-calls.md), [P47](chat-driver-tool-calls.md), [P49](chat-driver-tool-calls.md), [P50](chat-driver-tool-calls.md), [P51](chat-turns.md), [P61](driver-contract.md), [P63](driver-contract.md), [P131](turn-limits.md), [P132](turn-limits.md), [P133](turn-limits.md), [P138](question-cards.md), [P140](approval-cards.md), [P142](approval-cards.md), [P143](approval-cards.md).
Two notes come from the release history, not from a feature:

| # | Step | Note | Source |
|---|---|---|---|
| P41 | 9 | A test that starts and stops a fake engine with a process tree on Windows | `changelog.md` 7 |
| P48 | 12 | A limit on the number of tools is a capability of the driver | `changelog.md` 7 |

## The problems of the reference, and the proposals

Each problem of section 5 of [`research/changelog.md`](../research/changelog.md),
and the proposals that answer it.

| Problem | Proposals |
|---|---|
| A turn or a wait that does not end | P6, P14, P30, P36, P65, P73, P133, P136, P138 |
| The same work done two times, or lost | P1, P2, P34, P72, P80, P83, P137 |
| Process control on Windows | P41, P68, P86 |
| Sign-in to an engine, engine CLIs that change | P10, P11. No other |
| A secret in the wrong place | P18 to P21, P24, P25, P40, P96, P98 to P100, P103, P108, P132, P143, P144 |
| A feature added, then removed | P3, P33, P126 |
| "Busy" and races between bots | P3, P27, P34, P104, P109 |
| The size of the tool list | P48, P130 |
| State lost at a restart | P34, P37, P44, P69, P79, P82, P84, P86, P87, P90 |
| A file written over after a failed read | P22, P76, P77, P103 |
| The approval model changed | P42 to P47, P97, P111, P112, P114, P117, P120, P135, P136, P140 |
| Memory and the number of processes | P70 |
| Usage and cost numbers | P124 |
| Tests that fail by chance | P17. Also P16, but only with option a |
| The person's own engine config reaches the bots | P61, P103 |
| The updater loops, sticks or breaks the window | P94 |
| One slow or stuck part blocks the others | P88, P92 |

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
