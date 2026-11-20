# Step 7. The event bus and the streamed reply in the window

- **Crates:** `bot-core` and `bot-desktop`
- **Done when:** you enter a key, send a message, and the answer appears word
  by word.
- **Rule:** the runtime in `bot-core` reaches the host only through its
  `TurnRunner` trait. Logic stays in the library crates.

## Pull requests

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [ ] 7.1 | `feat(core): add the event bus` | `bot-core/src/bus.rs` | A bus on a `tokio` broadcast channel. Each subscriber gets each event | A test with two subscribers |
| [ ] 7.2 | `feat(core): add the TurnRunner trait` | `bot-core/src/runner.rs` | The trait, with a doc comment, and a function that runs one turn and publishes its events on the bus | A test with a fake runner reads the events from the bus |
| [ ] 7.3 | `feat(desktop): run turns through the registry` | `bot-desktop/src/main.rs`, `bot-desktop/src/runner.rs` | The desktop loads the settings, builds the registry and gives `bot-core` a `TurnRunner` that calls the driver | `send_message` returns immediately, and the turn runs |
| [ ] 7.4 | `feat(desktop): send bus events to the window` | `bot-desktop/src/events.rs`, `capabilities/default.json` | A task that reads the bus and emits each event to the window | The events show in the console of the window |
| [ ] 7.5 | `feat(desktop): show the streamed reply` | `ui/src/features/chat/useTurnEvents.ts`, `ChatPane.tsx` | The chat listens for the events and adds each delta to the bot message. A `runtime.error` shows as a system message | The answer appears word by word |
| [ ] 7.6 | `feat(desktop): save the API key from the settings panel` | `bot-desktop/src/settings.rs`, `ui/src/features/settings/SettingsPanel.tsx` | Commands to load and save the settings. The window never gets the saved key back, only "a key is set" | You enter a key, restart, and the bot answers |

## Choices

- `AGENTS.md` says that `bot-cli` is the only composition root. In this step
  `bot-desktop` also connects the crates. Change the rule, or move the
  connection to a shared place.
- What a slow subscriber of the bus loses, and how the window recovers.
- The name and the payload of the Tauri event.
