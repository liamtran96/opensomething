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
P64. Batch 4 (six features, reference `ed8cb7278`) gave P65 to P121. Batch 5 (six features, reference `ad27f0716`) gives P122 to P163. Batch 6 (group 3, reference `eee23ebbe`) gives P164 to P229. Batch 7 (reference `96ff84455`) gives P230 and after. Batch 8 (reference `83d18e3af`) gives P406 and after. Batch 9 (reference `140172d88`) gives P471 and after. Batch 10 (reference `fcce0b6de`) gives P515 and after. Batch 11 (reference `42f86aefd`) gives P559 and after. Batch 12 (reference `42f86aefd`) gives P626 and after. Each
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
| [`assignment-runtime.md`](assignment-runtime.md) | [`assignment-runtime.md`](../research/features/assignment-runtime.md) | P164 to P172, and new facts for P83, P85, P138 | 13, 14 |
| [`automations.md`](automations.md) | [`automations.md`](../research/features/automations.md) | P173 to P181 | 15, later |
| [`threads.md`](threads.md) | [`threads.md`](../research/features/threads.md) | P182 to P193 | 8, 11, 12 |
| [`agent-tools.md`](agent-tools.md) | [`agent-tools.md`](../research/features/agent-tools.md) | P194 to P203 | 12, D8 |
| [`memory.md`](memory.md) | [`memory.md`](../research/features/memory.md) | P204 to P217 | 15, D8 |
| [`bot-coordination.md`](bot-coordination.md) | [`bot-coordination.md`](../research/features/bot-coordination.md) | P218 to P229, and new facts for P64, P120, P182 | 2, 12, 14, gap |
| [`custom-mcp-servers.md`](custom-mcp-servers.md) | [`custom-mcp-servers.md`](../research/features/custom-mcp-servers.md) | P230 to P245 | 4, 9, 12, 16, D12, gap |
| [`context.md`](context.md) | [`context.md`](../research/features/context.md) | P246 to P255 | 3, 5, 8, 13, D22, new step, later |
| [`connected-apps.md`](connected-apps.md) | [`connected-apps.md`](../research/features/connected-apps.md) | P256 to P268, and new facts for P44, P232, P240 | 10, 16, D12, gap |
| [`team-structure.md`](team-structure.md) | [`team-structure.md`](../research/features/team-structure.md) | P272 to P288, and new facts for P113, P120, P142, P164, P165, P182, P219, P222 | 14, D10, gap, not planned |
| [`app-settings.md`](app-settings.md) | [`app-settings.md`](../research/features/app-settings.md) | P289 to P300 | 6, 7, 8, 10, 12, D8, D10 |
| [`bot-attachments.md`](bot-attachments.md) | [`bot-attachments.md`](../research/features/bot-attachments.md) | P301 to P313, and new facts for P41, P194, P201, P203 | 7, 8, 9, 12, 13, 14, D10, D17, gap |
| [`notifications.md`](notifications.md) | [`notifications.md`](../research/features/notifications.md) | P314 to P325 | 10, 11, 12, 13, 15, D10, D17, D20, new step |
| [`mentions.md`](mentions.md) | [`mentions.md`](../research/features/mentions.md) | P326 to P340, and new facts for P34, P218, P229 | 2, 14, D17, D18, gap, later |
| [`bot-contact-cards.md`](bot-contact-cards.md) | [`bot-contact-cards.md`](../research/features/bot-contact-cards.md) | P341 to P350 | 10, 16, D12 |
| [`chat-and-teams-site.md`](chat-and-teams-site.md) | [`chat-and-teams-site.md`](../research/features/chat-and-teams-site.md) | P351 to P364 | 8, 12, 13, 14, new steps, gap |
| [`hosted-app-connections.md`](hosted-app-connections.md) | [`hosted-app-connections.md`](../research/features/hosted-app-connections.md) | P365 to P377 | 6, 10, 16, D12, gap |
| [`usage-and-budgets.md`](usage-and-budgets.md) | [`usage-and-budgets.md`](../research/features/usage-and-budgets.md) | P378 to P385, and new facts for P124, P251 | 2, 5, 8, new step, later |
| [`safety-floor.md`](safety-floor.md) | [`safety-floor.md`](../research/features/safety-floor.md) | P386 to P393, and new facts for P46, P49, P97, P117 | 8, 9, 10, D10, later |
| [`chat-widgets-and-proposals.md`](chat-widgets-and-proposals.md) | [`chat-widgets-and-proposals.md`](../research/features/chat-widgets-and-proposals.md) | P394 to P405 | 10, 11 to 15, new step, gap |
| [`bot-profile.md`](bot-profile.md) | [`bot-profile.md`](../research/features/bot-profile.md) | P406 to P426, and new facts for P22, P76, P120, P289, P290, P404, P405 | 6, 8, D16, new step, later |
| [`skills.md`](skills.md) | [`skills.md`](../research/features/skills.md) | P428 to P442, and new facts for P48, P61, P103, P112, P139 to P144, P194 to P203, P275 | 9, 10, 12, 15, new step, later |
| [`tool-selection.md`](tool-selection.md) | [`tool-selection.md`](../research/features/tool-selection.md) | P443 to P452, and new facts for P202, P234, P237, P238, P243 | 9, 12, 16, new step, later |
| [`recovery-and-pausing.md`](recovery-and-pausing.md) | [`recovery-and-pausing.md`](../research/features/recovery-and-pausing.md) | P453 to P470, and new facts for P55, P60, P165, P249 | 3, 9, 13, 15, new step, gap |
| [`github-sign-in.md`](github-sign-in.md) | [`github-sign-in.md`](../research/features/github-sign-in.md) | P471 to P483, and a correction of `acp-adapter.md` | 6, 9, 10, 16 |
| [`team-board.md`](team-board.md) | [`team-board.md`](../research/features/team-board.md) | P484 to P498 | 12, 13, gap |
| [`engines-and-accounts.md`](engines-and-accounts.md) | [`engines-and-accounts.md`](../research/features/engines-and-accounts.md) | P499 to P514, a correction of P88, and new facts for P41, P61, P68, P462 | 3, 4, 6, 7, 9, D16, new step, later |
| [`work-digests.md`](work-digests.md) | [`work-digests.md`](../research/features/work-digests.md) | P515 to P524 | after 8 and 12, gap |
| [`session-search.md`](session-search.md) | [`session-search.md`](../research/features/session-search.md) | P525 to P534 | 8, 15, new step |
| [`goals.md`](goals.md) | [`goals.md`](../research/features/goals.md) | P535 to P544 | 13, new step after 15, gap |
| [`environments-and-flags.md`](environments-and-flags.md) | [`environments-and-flags.md`](../research/features/environments-and-flags.md) | P545 to P558, and new facts for P22, P61, P76, P77, P504 | 6, D10, new step, gap |
| [`vault-bitwarden.md`](vault-bitwarden.md) | [`vault-bitwarden.md`](../research/features/vault-bitwarden.md) | P559 to P575, and new facts for P19, P20, P22, P40, P232, P367, P480 | 6, 8, 9, new decision, new step after 16, later |
| [`bot-box.md`](bot-box.md) | [`bot-box.md`](../research/features/bot-box.md) | P576 to P588, and new facts for P41, P61, P68, P70, P95, P103, P472 to P474, P504, P508 | 6, 9, D10, gap, later |
| [`engine-turn-lifecycle.md`](engine-turn-lifecycle.md) | [`engine-turn-lifecycle.md`](../research/features/engine-turn-lifecycle.md) | P589 to P608, and new facts for P19, P34, P40, P57, P60, P63, P64, P65, P73, P197, P250, P251, P254, P461, P504 | 5, 9, 12, 13, later |
| [`acp-engine-details.md`](acp-engine-details.md) | [`acp-engine-details.md`](../research/features/acp-engine-details.md) | P609 to P625, and new facts for P19, P103, P113, P130, P470, P500, P503, P504, P507, P508 | 4, 6, 9, 10, later, gap |
| [`onboarding.md`](onboarding.md) | [`onboarding.md`](../research/features/onboarding.md) | P626 to P635, and new facts for P19, P61, P232, P429, P508, P513 and `security-model.md` | 6, new step after 7, D10, gap |
| [`helper-bot.md`](helper-bot.md) | [`helper-bot.md`](../research/features/helper-bot.md) | P636 to P643, and new facts for P209, P247, P251, P323, P381 | 3, 15, new step after 15, cap step, later |
| this file | the plan itself and [`changelog.md`](../research/changelog.md) | P26, P41, P48 | 7, 9, 12 |

- Decide P1 to P7 first, and P218 with them. They change the types of `bot-protocol`, and step
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

**Proposals:** [P1](event-bus-fold.md), [P3](chat-turns.md), [P4](file-modes-atomic-writes-redaction.md), [P5](chat-streaming.md), [P7](chat-driver-tool-calls.md), [P129](turn-limits.md), [P326](mentions.md), [P378](usage-and-budgets.md).

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

**Proposals:** [P2](chat-turns.md), [P6](chat-turns.md), [P8](chat-turns.md), [P9](chat-turns.md), [P53 to P60](driver-contract.md), [P65](engine-process-lifecycle.md), [P66](engine-process-lifecycle.md), [P67](engine-process-lifecycle.md), [P113](approval-levels.md), [P254](context.md), [P453](recovery-and-pausing.md), [P454](recovery-and-pausing.md), [P499](engines-and-accounts.md), [P500](engines-and-accounts.md), [P637](helper-bot.md).

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

**Proposals:** [P10](newer-config-unavailable.md), [P11](newer-config-unavailable.md), [P12](newer-config-unavailable.md), [P62](driver-contract.md), [P88](composition-root.md), [P499](engines-and-accounts.md), [P505](engines-and-accounts.md), [P507](engines-and-accounts.md), [P610](acp-engine-details.md), [P611](acp-engine-details.md), [P613](acp-engine-details.md), [P622](acp-engine-details.md).

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

**Proposals:** [P13](chat-streaming.md), [P14](chat-streaming.md), [P15](chat-streaming.md), [P16](chat-streaming.md), [P17](chat-streaming.md), [P60](driver-contract.md) (the contract test runs on the chat driver), [P124](chat-ui.md), [P251](context.md), [P378](usage-and-budgets.md), [P379](usage-and-budgets.md), [P589](engine-turn-lifecycle.md), [P590](engine-turn-lifecycle.md), [P591](engine-turn-lifecycle.md), [P592](engine-turn-lifecycle.md), [P593](engine-turn-lifecycle.md).

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

**Proposals:** [P18](file-modes-atomic-writes-redaction.md), [P19](write-only-secrets.md), [P20](write-only-secrets.md), [P21](write-only-secrets.md), [P22](newer-config-unavailable.md), [P23](newer-config-unavailable.md), [P24](file-modes-atomic-writes-redaction.md), [P74](store-and-data-format.md), [P76](store-and-data-format.md), [P77](store-and-data-format.md), [P86](composition-root.md), [P91](composition-root.md), [P100](security-model.md), [P144](approval-cards.md), [P297](app-settings.md), [P374](hosted-app-connections.md), [P419](bot-profile.md), [P475](github-sign-in.md), [P480](github-sign-in.md), [P505](engines-and-accounts.md), [P546](environments-and-flags.md), [P553 to P556](environments-and-flags.md), [P564](vault-bitwarden.md), [P580](bot-box.md), [P617](acp-engine-details.md), [P627](onboarding.md), [P628](onboarding.md).

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

**Proposals:** [P25](file-modes-atomic-writes-redaction.md), P26, [P27](event-bus-fold.md), [P28](event-bus-fold.md), [P29](event-bus-fold.md), [P30](event-bus-fold.md), [P31](chat-turns.md), [P32](write-only-secrets.md), [P64](driver-contract.md) (or step 8), [P87](composition-root.md), [P89](composition-root.md), [P90](composition-root.md), [P91](composition-root.md), [P93](composition-root.md), [P122](chat-ui.md), [P123](chat-ui.md), [P125](chat-ui.md), [P126](chat-ui.md), [P127](chat-ui.md), [P294](app-settings.md), [P296](app-settings.md), [P310](bot-attachments.md), [P506](engines-and-accounts.md).

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

- **Proposals of step 8:** [P75](store-and-data-format.md), [P76](store-and-data-format.md), [P77](store-and-data-format.md), [P78](store-and-data-format.md), [P79](store-and-data-format.md), [P80](store-and-data-format.md), [P81](store-and-data-format.md), [P82](store-and-data-format.md), [P108](acp-core.md), [P124](chat-ui.md), [P246](context.md), [P291](app-settings.md), [P301](bot-attachments.md), [P304](bot-attachments.md), [P309](bot-attachments.md), [P354](chat-and-teams-site.md), [P380](usage-and-budgets.md), [P386](safety-floor.md), [P419](bot-profile.md), [P565](vault-bitwarden.md).
- **Proposals of step 9:** [P66](engine-process-lifecycle.md), [P67](engine-process-lifecycle.md), [P68](engine-process-lifecycle.md), [P69](engine-process-lifecycle.md), [P70](engine-process-lifecycle.md), [P71](engine-process-lifecycle.md), [P72](engine-process-lifecycle.md), [P102](acp-core.md), [P103](acp-core.md), [P104](acp-core.md), [P105](acp-core.md), [P106](acp-core.md), [P108](acp-core.md), [P109](acp-core.md), [P130](turn-limits.md), [P134](turn-limits.md), [P136](question-cards.md), [P311](bot-attachments.md), [P388](safety-floor.md), [P432](skills.md), [P451](tool-selection.md), [P466](recovery-and-pausing.md), [P467](recovery-and-pausing.md), [P470](recovery-and-pausing.md), [P478](github-sign-in.md), [P503](engines-and-accounts.md), [P504](engines-and-accounts.md), [P508](engines-and-accounts.md), [P511](engines-and-accounts.md), [P512](engines-and-accounts.md), [P562](vault-bitwarden.md), [P563](vault-bitwarden.md), [P577](bot-box.md), [P578](bot-box.md), [P582](bot-box.md), [P593](engine-turn-lifecycle.md), [P594](engine-turn-lifecycle.md), [P595](engine-turn-lifecycle.md), [P596](engine-turn-lifecycle.md), [P597](engine-turn-lifecycle.md), [P598](engine-turn-lifecycle.md), [P609](acp-engine-details.md), [P611](acp-engine-details.md), [P612](acp-engine-details.md), [P615](acp-engine-details.md), [P616](acp-engine-details.md), [P618](acp-engine-details.md), [P619](acp-engine-details.md), [P620](acp-engine-details.md), [P621](acp-engine-details.md), [P622](acp-engine-details.md), [P623](acp-engine-details.md), [P625](acp-engine-details.md).
- **Proposals of step 10:** [P72](engine-process-lifecycle.md), [P73](engine-process-lifecycle.md), [P96](security-model.md), [P97](security-model.md), [P107](acp-core.md), [P110](approval-levels.md), [P111](approval-levels.md), [P112](approval-levels.md), [P113](approval-levels.md), [P114](approval-levels.md), [P115](approval-levels.md), [P116](approval-levels.md), [P117](approval-levels.md), [P118](approval-levels.md), [P119](approval-levels.md), [P120](approval-levels.md), [P121](approval-levels.md), [P135](question-cards.md), [P136](question-cards.md), [P137](question-cards.md), [P139](approval-cards.md), [P141](approval-cards.md), [P260](connected-apps.md), [P291](app-settings.md), [P314](notifications.md), [P341](bot-contact-cards.md), [P365](hosted-app-connections.md), [P366](hosted-app-connections.md), [P386](safety-floor.md), [P387](safety-floor.md), [P389](safety-floor.md), [P390](safety-floor.md), [P391](safety-floor.md), [P394](chat-widgets-and-proposals.md), [P398](chat-widgets-and-proposals.md), [P429](skills.md), [P437](skills.md), [P479](github-sign-in.md), [P616](acp-engine-details.md).

Write `docs/threat-model.md` before step 9: this is the first step where the
program starts another program. What it must cover: [P95](security-model.md).

## Part 3. A team of bots

| Step | What to build | Crate | Done when |
|---|---|---|---|
| 11 | Tasks: a bot has more than one thread ([P182 to P193](threads.md), [P314](notifications.md), [P317](notifications.md)) | `bot-core`, `bot-desktop` | Two tasks of one bot have separate conversations |
| 12 | Our own tools for engines, given as an MCP server: `list_bots` first ([P194 to P203](agent-tools.md), [P292](app-settings.md), [P295](app-settings.md), [P299](app-settings.md), [P303](bot-attachments.md), [P312](bot-attachments.md), [P314](notifications.md), [P323](notifications.md), [P357](chat-and-teams-site.md), [P358](chat-and-teams-site.md), [P431](skills.md), [P433](skills.md), [P448](tool-selection.md), [P493](team-board.md), [P598](engine-turn-lifecycle.md), [P599](engine-turn-lifecycle.md), [P600](engine-turn-lifecycle.md), [P607](engine-turn-lifecycle.md)) | `bot-engine` | An engine lists the bots through the tool |
| 13 | The assignment runtime and its invariant tests ([P164 to P172](assignment-runtime.md), [P309](bot-attachments.md), [P318](notifications.md), [P458](recovery-and-pausing.md), [P488](team-board.md), [P497](team-board.md), [P535](goals.md), [P599](engine-turn-lifecycle.md)) | `bot-core` | Each scenario test passes the invariant checks |
| 14 | Several bots: `coordinate_bots` writes an assignment ([P218 to P229](bot-coordination.md), [P272](team-structure.md), [P273](team-structure.md), [P275](team-structure.md), [P277](team-structure.md), [P279 to P284](team-structure.md), [P307](bot-attachments.md), [P327](mentions.md), [P328](mentions.md), [P330](mentions.md), [P332](mentions.md), [P356](chat-and-teams-site.md), [P363](chat-and-teams-site.md)) | `bot-core`, `bot-engine` | One bot gives work to a second bot and gets the result |
| 15 | Memory, then routines ([P204 to P217](memory.md), [P533](session-search.md), [P173 to P181](automations.md), [P314](notifications.md), [P322](notifications.md), [P435](skills.md), [P458](recovery-and-pausing.md), [P636](helper-bot.md), [P637](helper-bot.md)) | `bot-core` | A bot recalls a fact in a new task. A routine starts a turn at its time |
| 16 | Outside tools: custom MCP servers, then Composio (decision D12) ([P230 to P243](custom-mcp-servers.md), [P257 to P267](connected-apps.md), [P342 to P350](bot-contact-cards.md), [P365](hosted-app-connections.md), [P367](hosted-app-connections.md), [P368](hosted-app-connections.md), [P370 to P373](hosted-app-connections.md), [P375](hosted-app-connections.md), [P377](hosted-app-connections.md), [P443](tool-selection.md), [P444](tool-selection.md), [P451](tool-selection.md), [P452](tool-selection.md), [P471 to P474](github-sign-in.md), [P476](github-sign-in.md), [P477](github-sign-in.md), [P481 to P483](github-sign-in.md)) | `bot-engine` | A bot calls a tool of a custom MCP server |

- [ ] 11
- [ ] 12
- [ ] 13
- [ ] 14
- [ ] 15
- [ ] 16

An HTTP server is not in these steps. The core runs in the process of the
desktop application (decision D10).

## Gaps that have no step

Each one is in the file of its feature: [P33](chat-driver-tool-calls.md), [P34](queue-and-steer.md), [P35](chat-turns.md), [P36](chat-turns.md), [P128](chat-ui.md), [P244](custom-mcp-servers.md), [P245](custom-mcp-servers.md). Context (part 17) has no step yet: [P247](context.md) adds one after step 13, with [P252](context.md) and [P253](context.md); [P255](context.md) is later. Connected apps: the Email app has no step: [P268](connected-apps.md). The rooms of a team have no step: [P286](team-structure.md). Bot attachments: [P308](bot-attachments.md) (`vm_exec`) has no step because we have no local VM. Notifications (part 50) has no step yet: [P314](notifications.md) adds one after step 14, with [P316](notifications.md) and [P324](notifications.md). Mentions in rooms have no step yet: [P333 to P336](mentions.md) go to the step of rooms, [P338](mentions.md) to the step of the @ picker in `bot-desktop`, and [P340](mentions.md) (the team map) is later. Three new steps come from the chat and teams page: reactions after step 11 ([P355](chat-and-teams-site.md)), the team map after step 14 ([P360](chat-and-teams-site.md)) and the person's inbox after step 15 ([P353](chat-and-teams-site.md)). Team mode is a gap if [P351](chat-and-teams-site.md) keeps one person, and [P361](chat-and-teams-site.md) waits for the rooms step with [P224](bot-coordination.md) and [P229](bot-coordination.md). The hosted app cards wait for OAuth sign-in: [P369](hosted-app-connections.md) comes after [P244](custom-mcp-servers.md). Usage and budgets (part 21) has no step for caps yet: [P381](usage-and-budgets.md) adds one after step 15, and [P383](usage-and-budgets.md) is later. The safety floor has one later proposal: [P392](safety-floor.md). Chat widgets (part 48) has no step yet: [P394](chat-widgets-and-proposals.md) adds one after step 12, with [P396](chat-widgets-and-proposals.md), [P397](chat-widgets-and-proposals.md) and [P400 to P403](chat-widgets-and-proposals.md); [P405](chat-widgets-and-proposals.md) is for our docs pages (D19). The bot profile has no step yet: [P406](bot-profile.md) adds one after step 16, with [P407 and P408](bot-profile.md), [P410 to P417](bot-profile.md), [P420 to P422](bot-profile.md) and [P424 to P426](bot-profile.md); [P409](bot-profile.md) and [P418](bot-profile.md) put `propose_profile` after it and `/setup` after steps 15 and 16, and [P423](bot-profile.md) (presets) is later. Skills have no step yet: [P428](skills.md) adds one after step 15, with [P430](skills.md), [P438](skills.md) and [P439](skills.md); [P434](skills.md), [P436](skills.md) and [P440 to P442](skills.md) are later; [P552](environments-and-flags.md) goes with [P428](skills.md). Tool selection for each bot has no step yet: [P443](tool-selection.md) adds one after step 16, with [P445 to P447](tool-selection.md) and [P450](tool-selection.md); [P449](tool-selection.md) (the bridge) is later. Recovery and pausing has no step yet: [P469](recovery-and-pausing.md) adds one after the cap step of [P381](usage-and-budgets.md) and the notifications step of [P314](notifications.md), with [P455 to P457](recovery-and-pausing.md), [P459 to P462](recovery-and-pausing.md), [P465](recovery-and-pausing.md), [P468](recovery-and-pausing.md) and [P470](recovery-and-pausing.md); [P463](recovery-and-pausing.md) is a decision with no step, and [P464](recovery-and-pausing.md) changes the table of problems. The Team Board has no step: [P484](team-board.md) asks if we build it, after the rooms step of [P286](team-structure.md), with [P485 to P492](team-board.md), [P494 to P496](team-board.md), [P498](team-board.md). Accounts for engines have no step: [P501](engines-and-accounts.md) adds one, with [P502](engines-and-accounts.md); [P510](engines-and-accounts.md) and [P514](engines-and-accounts.md) are later, and [P513](engines-and-accounts.md) is a note for D16. Work digests have no step: [P515](work-digests.md) adds one after steps 8 and 12, with [P516](work-digests.md), [P518](work-digests.md), [P519](work-digests.md) and [P522](work-digests.md); [P517](work-digests.md), [P521](work-digests.md) and [P524](work-digests.md) wait for checkpoints, which we do not plan, and [P520](work-digests.md) and [P523](work-digests.md) wait for a Claude adapter. The search of past conversations has no step: [P529 to P531](session-search.md) and [P534](session-search.md) go to a new step after step 15; [P525](session-search.md), [P527](session-search.md) and [P528](session-search.md) are one decision about the search thread, [P532](session-search.md) is a choice, [P526](session-search.md) changes step 8 and [P533](session-search.md) step 15. Goals have no step: a one-on-one goal can come in a new step after step 15, and a room goal also waits for the rooms step of [P286](team-structure.md). Decide [P535](goals.md) and [P537](goals.md) first, because each one breaks a rule of `AGENTS.md` if we follow the reference; [P536](goals.md) and [P538 to P543](goals.md) go to that step, and [P544](goals.md) to the card in `bot-desktop`. Local environments have no step: [P551](environments-and-flags.md) asks if we build them, and which of the two mechanisms of the reference we follow; [P545](environments-and-flags.md), [P547 to P550](environments-and-flags.md), [P557](environments-and-flags.md) and [P558](environments-and-flags.md) go with that step, and [P546](environments-and-flags.md) (the lease as a file lock) changes step 6. Bitwarden in the Vault has no step: a linked password manager can come in a new step after step 16, with [P559 to P561](vault-bitwarden.md), [P566 to P572](vault-bitwarden.md) and [P575](vault-bitwarden.md). Decide [P574](vault-bitwarden.md) (the license border, a new decision) and [P573](vault-bitwarden.md) (the crate of the I/O, a choice) first; [P564](vault-bitwarden.md) changes step 6, [P565](vault-bitwarden.md) step 8, and [P562](vault-bitwarden.md) and [P563](vault-bitwarden.md) step 9. The bot box has no step: the reference runs it only on a Linux Cloud server, and [P576](bot-box.md) decides if we follow that (option a) or add a Linux box in a new step after step 16 (option b). Decide P576 before step 9, because it refines D10; [P581](bot-box.md) and [P583 to P588](bot-box.md) go with that step, and [P579](bot-box.md) goes with the broker. The engine side of a turn has later proposals that wait for an adapter: [P601 to P604](engine-turn-lifecycle.md) and [P608](engine-turn-lifecycle.md) wait for a Claude adapter, [P606](engine-turn-lifecycle.md) waits for a Codex adapter, and [P605](engine-turn-lifecycle.md) is later unless the steering engine is the adapter of step 9. Decide [P589](engine-turn-lifecycle.md) and [P590](engine-turn-lifecycle.md) first, because they change D20 before step 5. The detail of each ACP engine has three proposals with no step: [P614](acp-engine-details.md) goes with [P470](recovery-and-pausing.md) to the step of recovery, [P624](acp-engine-details.md) goes to a Pi adapter if it comes, and the UI part of [P622](acp-engine-details.md) has no UI step. Decide [P609](acp-engine-details.md) first: the reference chooses engine behaviour by a driver name, which `AGENTS.md` forbids, and the other proposals add data, flags or hooks to its record. Onboarding has no step: [P626](onboarding.md) adds a first run after step 7, with [P629](onboarding.md), [P630](onboarding.md) and [P634](onboarding.md); [P627](onboarding.md) and [P628](onboarding.md) change step 6. [P631](onboarding.md) (the import from other AI tools) goes with [P428](skills.md), and [P635](onboarding.md) is a choice of its crate. [P632](onboarding.md) (the terminal wizard) has no step, and [P633](onboarding.md) is a note for D10. The helper bot has no step: [P638](helper-bot.md) adds one after step 15, with [P640](helper-bot.md) and [P643](helper-bot.md); [P639](helper-bot.md) goes to the cap step of [P381](usage-and-budgets.md), and [P642](helper-bot.md) is later.

## Notes for steps 8 to 14

Each note is in the file of its feature: [P37](event-bus-fold.md), [P38](chat-turns.md), [P39](event-bus-fold.md), [P40](write-only-secrets.md), [P42](chat-driver-tool-calls.md), [P43](chat-driver-tool-calls.md), [P44](chat-driver-tool-calls.md), [P45](chat-driver-tool-calls.md), [P46](chat-driver-tool-calls.md), [P47](chat-driver-tool-calls.md), [P49](chat-driver-tool-calls.md), [P50](chat-driver-tool-calls.md), [P51](chat-turns.md), [P61](driver-contract.md), [P63](driver-contract.md), [P131](turn-limits.md), [P132](turn-limits.md), [P133](turn-limits.md), [P138](question-cards.md), [P140](approval-cards.md), [P142](approval-cards.md), [P143](approval-cards.md), [P404](chat-widgets-and-proposals.md). Step 8 also makes the search index in its first schema: [P526](session-search.md).
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
| A turn or a wait that does not end | P6, P14, P30, P36, P65, P73, P133, P136, P138, P233, P465, P476, P479, P481, P489, P503, P517, P538, P548, P562, P567, P637 |
| The same work done two times, or lost | P1, P2, P34, P72, P79, P80, P83, P137, P252, P261, P262, P282, P303, P310, P462, P484, P490, P491, P540, P589, P590, P602, P608, P638 |
| Process control on Windows | P41, P66, P68, P82, P86, P478, P512, P545, P546 |
| Sign-in to an engine, engine CLIs that change | P10, P11, P109, P422, P462, P470, P499, P500, P563, P601, P614, P616, P623 |
| A secret in the wrong place | P18 to P21, P24, P25, P40, P96, P98 to P100, P103, P108, P117, P132, P143, P144, P232, P236, P257, P258, P259, P267, P273, P274, P287, P289, P290, P294, P297, P306, P329, P392, P395, P407, P425, P434, P435, P436, P445, P472, P473, P474, P480, P508, P520, P521, P523, P559, P560, P564, P577, P578, P604, P617, P631 |
| A feature added, then removed | P3, P33, P126, P185, P188 (section 6, "One conversation for each bot"), P513 (section 6, "The UI mode"), P543 (the one-on-one goal engine), P551 (section 6, \"Where the data is\"), P555 (section 6, "Features that lived for days or weeks") |
| "Busy" and races between bots | P3, P27, P34, P72, P96, P104, P109, P184, P281, P282, P286, P412, P420, P486, P487 |
| The size of the tool list | P48, P130, P431, P444, P446, P449, P493, P598, P620 |
| State lost at a restart | P34, P37, P44, P69, P79, P82, P83, P84, P86, P87, P90, P116, P189, P206, P262, P278, P279, P286, P291, P408, P430, P456, P458, P459, P476, P486, P488, P515, P526, P535, P541, P545, P549, P565, P638 |
| A file written over after a failed read | P22, P76, P77, P103, P114, P174, P232, P415, P419, P475, P485, P509, P547, P552, P618 |
| The approval model changed | P42 to P47, P73, P97, P111, P112, P113, P114, P117, P119, P120, P135, P136, P140, P236, P260, P272, P289, P407, P409, P410, P425, P436, P447, P616 |
| Memory and the number of processes | P66, P68, P70, P105, P306, P528 |
| Usage and cost numbers | P124, P378, P379, P380, P381, P383, P542, P636, P642 |
| Tests that fail by chance | P17. Also P16, but only with option a, P529 |
| The person's own engine config reaches the bots | P61, P103, P429, P432, P477, P504, P550, P601, P603, P619 |
| The updater loops, sticks or breaks the window | P75, P94 |
| One slow or stuck part blocks the others | P88, P92, P240, P465, P492, P499, P517, P525, P527, P561, P562, P566, P579, P580, P606, P637 |

A proposal in the table avoids a problem that the reference had in its
releases. Its "Problem in the reference" line names the problem and the
releases. These proposals of batches 4 to 11 answer no release problem. They
are judgment calls, and the author can keep the reference for them: P67,
P85, P89, P91, P187, P191, P201, P218, P248, P265, P266, P277, P280, P283,
P284, P295, P296, P299, P315, P382, P387, P411, P413, P416, P421, P437,
P441, P450, P452, P453, P455, P482, P483, P494, P495, P496, P502, P507, P514, P516, P518, P519, P522, P524, P530, P531, P532, P533, P536, P539, P544, P557, P558, P553, P554, P556, P568, P569, P570, P571, P572, P575, P581, P582, P583, P584, P585, P586, P587, P588, P592, P593, P594, P597, P605, P607, P609, P610, P611, P612, P613, P615, P621, P622, P624, P625, P627, P628, P629, P630, P634, P639, P640, P641. P90 and P231 have no "Problem in the
reference" line, because the research shows no failure in the reference. P573 and P574 follow the reference: they are a choice and a decision. P576 is a decision that follows the reference. P591, P595, P596, P599 and P600 follow the reference. P620 answers the tool list problem of v0.1.101 with the retry of the reference; only its stored learned limit is a judgment call. P626, P632 and P633 follow the reference, and P635 is a choice. P643 is a choice.

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
