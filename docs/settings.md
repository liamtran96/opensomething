# Settings

A dialog with a list of pages at the left and the selected page at the right.
Two pages have content. Nothing is saved yet.

## What the person does

- Opens the dialog with `Ctrl+,`, or with **Settings** in the account menu.
- Clicks a page in the list. The search field shows only the pages whose
  label contains the typed text.
- Closes the dialog with the **Close** button.

## Pages

| Page | Content |
|---|---|
| **This computer** | Three status rows (**Phone & devices**, **AI**, **Apps**) and the **Sidebar picture** picker (see [`backgrounds.md`](backgrounds.md)) |
| **AI** | Three fields: **Provider address**, **Model** and **API key** |
| All other pages | The line "This page has no settings yet." |

- The dialog opens on **This computer**. Its second line shows the number of
  bots.
- The **API key** field hides its text.
- The values of the three fields stay until the application closes. No code
  reads them.

## Code

- `crates/bot-desktop/ui/src/features/settings/SettingsDialog.tsx`

## Not built

- To save the settings and to use them for a turn: step 6 and step 7.6 of
  the plan. The window must never get a saved key back.
- The status rows on **This computer** have fixed text.
- The **Advanced mode** switch changes nothing.
- Ten pages have no content. Some name features that are not in the plan
  (see the open risks of decision D16).
