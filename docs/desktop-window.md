# The desktop window

The window of the application: a sidebar with the bots at the left, and the
chat with the selected bot at the right. The layout is complete, but the data
is mock data and most buttons do nothing yet.

## What the person does

- Clicks a bot in the sidebar to see its conversation.
- Types in the composer and sends the message. The bot answers with the same
  text.
- Hides and shows the sidebar with the button at the left of the chat header.
- Opens the settings with `Ctrl+,` or from the account menu.

## The sidebar

- **Search** shows only the bots whose name contains the typed text.
- The chief bot (`isChief`) has its own row above the **Bots** group, with a
  crown next to its name.
- A bot row shows the avatar, the name, the time of the last activity and
  the last message. A bot with no messages shows "No messages".
- The **Bots** group and the **Tools** group each close and open with a
  click on their label.
- The account button at the bottom opens a menu. Only **Settings** does
  something.

## The chat

- The header shows the name and the model of the selected bot.
- A message of the person is a bubble in the colour of the bot. A message of
  the bot has no fill.
- An empty conversation shows "Send a message to start."
- The composer removes the spaces around the text and does not send an empty
  message. The **Send** button shows only when there is text. While a
  message is on its way, the composer does not send another.
- To send, the window calls the Tauri command `send_message`. The command
  returns `bot_core::echo_reply`, which is the same text.
- When the command fails, the chat shows the line "The message failed: ..."
  as a notice, not as a bubble.
- The scroll bars are 4 px wide.

## Data

- The five bots and their conversations are in `mocks/bots.ts`.
- A new message stays with its bot until the application closes. Nothing is
  saved.
- The window has its own types: a message has a `kind` of `person`, `bot` or
  `error`. It does not use the types of [`protocol.md`](protocol.md) yet.

## Code

All paths are in `crates/bot-desktop`.

- `src/main.rs`: the Tauri application and the `send_message` command.
- `ui/src/app/App.tsx`: the state of the window.
- `ui/src/features/sidebar/`: the sidebar and the account menu.
- `ui/src/features/chat/`: the header, the message list and the composer.
- `ui/src/features/bots/`: the bot type and the avatar.

## Not built

These controls are in the window and do nothing:

- Sidebar: **This computer**, **New bot**, **Inbox**, **New thread**, **New
  folder**, **More**, the three tools (**Automations**, **Team map**,
  **Published apps**) and **Plugins**.
- Chat header: **Chat activity**, the bot name, the model, **Bot screen** and
  **More**.
- Composer: **Attach a file**, **Skills**, **Goal**, **Approvals**, **Bot
  screen**, **Talk** and **More options**.
- Account menu: all items but **Settings**.

A real answer from a model arrives with steps 5 to 7 of the plan.
