# Step 1. The chat skeleton with mock data

- **Crate:** `bot-desktop` (all paths below are in `crates/bot-desktop/ui/src`)
- **Done when:** the window shows a mock conversation, and you can type in it.

## Pull requests

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [ ] 1.1 | `feat(desktop): add background templates` | `features/backdrop/backdrops.ts`, `features/backdrop/BackdropPicker.tsx`, `app/App.tsx` | Five backgrounds, a swatch picker, the glass panel. Each background sets the colour mode | A click on a swatch changes the background |
| [ ] 1.2 | `feat(desktop): make the scroll bar thin` | `global.css`, `app/App.tsx` | A 4 px scroll bar. The chat cuts the strip below the composer | A long chat shows a thin bar, and no message shows below the composer |
| [ ] 1.3 | `refactor(desktop): move the chat to its own feature` | `features/chat/ChatPane.tsx`, `features/chat/types.ts`, `app/App.tsx` | Move the message list and the composer out of `App.tsx`. No change in behaviour | The window looks and works as before |
| [ ] 1.4 | `feat(desktop): show a mock conversation` | `mocks/bots.ts`, `features/chat/ChatPane.tsx` | Mock bots, each with a name and a list of messages. The chat opens with the messages of the first bot | The window opens with a conversation in it |
| [ ] 1.5 | `feat(desktop): add the bot list` | `features/bots/BotList.tsx`, `app/App.tsx` | A list of bots at the left of the glass panel. A click selects a bot and shows its conversation | Each bot shows its own conversation. A typed message stays with its bot |
| [ ] 1.6 | `feat(desktop): add the settings panel` | `features/settings/SettingsPanel.tsx`, `app/App.tsx` | A button opens a panel with the provider address, the model, the API key and the background picker. Nothing is saved | The panel opens and closes. The key field hides its text |

Pull requests 1.1 and 1.2 are written and not committed.

## Choices

- The Astryx component for the bot list (`SideNav`, `List` or our own) and for
  the settings panel (`Drawer` or `Dialog`).
- A typed message still goes to the echo command until step 7. The other
  choice is a fixed mock reply with no Tauri call.
