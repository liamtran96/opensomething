# Backgrounds

A background is a picture made of colour gradients. It shows faded at the top
of the sidebar, and it sets the colour mode of the window.

## What the person does

Opens the settings, and on **This computer** clicks one of the five swatches
of **Sidebar picture**. The sidebar and the colour mode change immediately.

## The five backgrounds

| Name | Colour mode |
|---|---|
| Meadow | dark |
| Dusk | dark |
| Ocean | dark |
| Dawn | light |
| Plain | the mode of the operating system |

- The application starts with **Dawn**.
- **Plain** has no picture: it has the body colour of the theme.
- Each background has a fixed colour mode, so that the text on it stays
  readable. A person cannot choose the mode separately.

## Code

All paths are in `crates/bot-desktop/ui/src`.

- `features/backdrop/backdrops.ts`: the list, the labels, the modes and the
  gradients.
- `features/backdrop/BackdropPicker.tsx`: the swatches.
- `app/App.tsx`: keeps the selected background and gives its mode to the
  theme.

## Not built

- The choice is not saved. The application starts with **Dawn** each time.
