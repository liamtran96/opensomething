# Look and design

The research of the feature "Look and design": the layout rules of the
window, the command palette, Simple mode and Advanced mode, skins, themes that
a bot makes, right-to-left text and the rail of places. Group "later", crate
`bot-desktop`. The reference project is the clone at commit `95f3c9f16`.
Eight readers read the files of eight groups. The lead checked the key
findings against the code.

Borders with the files that are done. This file adds only what they do not
have:

- [`chat-ui.md`](chat-ui.md) has the chat window, the streaming and the
  inspector. This file adds the floating chat header, the side panel widths
  and the per-block direction of text.
- [`threads.md`](threads.md) has the order of the thread list and its limits.
  This file adds only where the tree shows (Advanced mode) and the rule of
  DESIGN.md for Simple mode.
- [`bot-settings-ui.md`](bot-settings-ui.md) and
  [`bot-profile.md`](bot-profile.md) have the bot settings dialog. This file
  adds the shell of the Simple bot panel and how settings open in it.
- [`desktop-shell.md`](desktop-shell.md) has the window shell and the failed
  read of `environments.json`. This file adds the rail view and its IPC gates.
- [`environments-and-flags.md`](environments-and-flags.md) (section 3.16) has
  the local workspaces: `profiles.json`, the wait with no time limit, the
  removal to the Trash. This file adds the rail UI that drives them.
- [`app-settings.md`](app-settings.md) (section 3.9) has the five theme
  actions of the `app_settings` tool, and the card Undo that a restart loses.
  This file adds the theme format, the CSS checks, the files on disk, the
  history and the HTTP routes.
- [`onboarding.md`](onboarding.md) has the key `omb-advanced-mode`.
  [`mentions.md`](mentions.md) has the mirror of the composer and the
  contrast of mention colours. This file adds the whole mode history and the
  skin contrast check.
- The feature "sidebar-and-departments" (another worktree) owns the sidebar
  rows, "mark all as read", sounds and departments.

## 1. In short

The reference project has one written set of design rules, `DESIGN.md`. A
reviewer cites a section number of it. The window has three places only: the
sidebar, the chat and the bot panel. No new place, no new header button, no
count badge and no confirm dialog is allowed. Undo takes the place of a
confirm dialog.

The look comes from **skins**. A skin is a block of CSS custom properties
(colour, radius, font tokens) under `[data-skin="<name>"]`. There are 13
skins. The default choice "system" follows the light or dark setting of the
operating system. A script checks the contrast of each skin in CI.

On top of a skin, a person can wear a **theme**. A bot makes a theme with the
`app_settings` tool, or the person makes one in Settings. A theme has colours,
a font, pictures and free CSS. The server checks the CSS, and the window
removes each part of the CSS that could load a file from outside. The server
keeps the last 30 changes of the look, so the person can go back. A key
combination and an address parameter take a broken theme off.

The window has two **modes**. Simple mode is for most people and is the
default of a new install. Advanced mode adds tokens, logs and developer
tools. The mode is one value in the local storage of the browser. The mode
changed three times in the releases: Simple became the default (v0.1.94),
Simple became the only mode (v0.1.151), and Advanced came back one day later
(v0.1.152). The second change deleted eight settings of the person, and the
third change did not bring them back.

**Right-to-left text** (Arabic, Hebrew) in messages finds its direction line
by line and block by block. Code stays left-to-right. The window chrome is
always left-to-right, because no right-to-left language pack exists.

The **rail of places** is a strip, 36 px wide, at the left edge of the
desktop window. It shows a tile for each place where bots live: this
computer, a Cloud, a server of the person, and more local workspaces. Each
place can have a colour and a banner picture.

### Special terms

- **Place**: a server where bots live. "This computer", a Cloud, a server of
  the person or a local workspace.
- **Rail**: the strip of place tiles at the left edge. It is a separate
  Electron view with its own page, `/rail`.
- **Local workspace** (in code: profile): a second data folder on this
  computer, `<data>-profiles/<id>`, with its own bots.
- **Skin**: a named set of CSS custom properties (tokens). Built into the
  app.
- **Token**: a CSS custom property such as `--color-app` or `--radius-lg`.
  Components use tokens, never raw colours.
- **Theme**: a look that a bot or a person makes. It is stored on the server
  for each person. It sits on top of a skin.
- **Look**: the pair (worn theme, skin). The look history records each change
  of it.
- **Safe look**: a window that starts without the theme, opened with the
  address parameter `?safe-look`.
- **Simple mode, Advanced mode**: the two levels of the window. One switch
  for the whole window.
- **Side panel**: a panel at the end edge of the chat: the bot panel, the
  computer panel, the inspector, a room thread.
- **Floating chat header**: in Simple mode, the chat header has no band. The
  transcript runs to the top of the window under the header controls.
- **Command palette**: a search box that Cmd+K or Ctrl+K opens. It finds bots,
  group chats, one command and messages.
- **Banner picture**: a picture for each workspace. It fades into the top of
  the sidebar.
- **IME**: an input method editor, the tool that composes Chinese, Japanese
  or Korean text from keys.
- **Bidi**: bidirectional text, a mix of left-to-right and right-to-left
  scripts.

## 2. Files read completely

The paths are in the reference project. The count is the number of lines.

**Design rules, accessibility, right-to-left (group A):** `DESIGN.md` (445),
`docs/localization.md` (82), `docs/verification/bidi.md` (60),
`docs/verification/mentions.md` (196), `scripts/verify-bidi.ts` (103),
`src/components/chat-dir-auto.test.ts` (31), `src/lib/i18n.ts` (113),
`src/locales/index.ts` (79), `src/components/PartlyDoneRow.tsx` (23),
`src/components/touch-actions.test.ts` (142),
`src/components/Select.guard.test.ts` (63), `src/lib/copy-text.guard.test.ts`
(34), `src/locales/vocabulary.test.ts` (202),
`src/locales/everyday-words.test.ts` (140), `src/locales/words.test.ts` (52),
`src/locales/welcome-words.test.ts` (23),
`scripts/testing/file-size-ratchet.test.ts` (75), `src/lib/menu-keys.ts`
(23), `src/lib/menu-keys.test.ts` (37), `src/components/model-menu-keys.ts`
(117), `src/components/menu-recipe.ts` (32), `src/components/MenuMotion.tsx`
(52), `src/components/MenuMotion.test.ts` (128),
`src/components/mascot-motion.ts` (408),
`src/components/mascot-motion.test.ts` (104), and the three JSON files
`docs/verification/evidence/mentions/rtl-dom.json` (142),
`rtl-messages.json` (153), `rtl-wait.json` (156).

**The stylesheet (group B):** `src/styles.css` (3989, in the ranges 1-500,
501-1000, 1001-1500, 1501-2000, 2001-2500, 2501-3000, 3001-3500,
3501-3989), `src/lib/control-scale.test.ts` (57),
`src/components/DigestChip.tsx` (84), `src/lib/use-media-query.ts` (32),
`src/components/bot-panel/side-panel.ts` (80).

**Themes on the server (group C):** `apps/docs/content/docs/features/themes.mdx`
(54), `shared/theme.ts` (283), `shared/theme.test.ts` (80),
`server/themes/store.ts` (302), `server/themes/store.test.ts` (141),
`server/themes/history.ts` (65), `server/themes/routes.ts` (130),
`server/themes/routes.test.ts` (115), `server/themes/tool.ts` (265),
`server/themes/tool.test.ts` (275), `server/themes.tool.e2e.test.ts` (123),
`server/themes.ui.e2e.test.ts` (150), `server/app-settings/host.ts` (299),
`server/drivers/agents-app-settings-tool.ts` (27).

**Themes in the window, and skins (group D):** `src/lib/theme/palette.ts`
(92), `palette.test.ts` (36), `runtime.ts` (192), `runtime.dom.test.ts` (89),
`hooks.test.ts` (29), `theme-css.ts` (90), `theme-css.dom.test.ts` (47),
`theme-css.chromium.test.ts` (88), `src/components/CustomThemesSettings.tsx`
(209), `src/components/ThemeRow.tsx` (43),
`src/components/AppearanceSelectRows.tsx` (68),
`src/components/NewLookNotice.tsx` (78), `NewLookNotice.test.ts` (112),
`src/components/CommandPalette.theme.dom.test.ts` (101),
`src/rail.theme.test.ts` (29), `src/lib/skins.ts` (145), `skins.test.ts`
(118), `skins.default.test.ts` (108), `src/components/SkinPicker.tsx` (151),
`electron/skin-overlay.cjs` (38), `electron/skin-overlay.test.mjs` (81),
`scripts/check-skin-contrast.mjs` (345),
`src/components/ChromeRail.skin.test.ts` (64), `src/main.tsx` (94),
`index.html` (19), `src/components/ChromeRail.tsx` (21),
`src/lib/prior-run.ts` (10), `src/lib/color-scheme.ts` (25),
`src/lib/browser-chrome.ts` (47), `src/lib/window-pref-changes.ts` (17),
`apps/docs/content/docs/changelog/index.mdx` (15).

**Modes and reversals (group E):** `src/lib/interface-mode.ts` (78),
`interface-mode.test.ts` (101), `src/lib/simple-only.ts` (2),
`src/lib/new-look.ts` (105), `new-look.test.ts` (204),
`src/lib/simple-mode-prompt.ts` (47), `simple-mode-prompt.test.ts` (35),
`src/components/SimpleModePrompt.tsx` (103), `SimpleModePrompt.test.ts`
(134), `src/components/AppSettingsRows.tsx` (423),
`src/components/bot-panel/AdvancedSettingsRow.tsx` (22),
`src/lib/window-prefs.ts` (125), `server/routes/app-settings.ts` (51),
`src/components/ChatView.simple-only.test.ts` (84),
`src/components/Composer.simple.test.ts` (376),
`src/components/Composer.advanced.test.ts` (248),
`src/components/BotSettingsDialog.simple.test.ts` (1609, in four ranges),
`src/components/notice-dialogs.ts` (31). Also the file
`src/lib/interface-mode.ts` (87) at commit `b9ab44b97`.

**Layout parts (group F):** `src/components/CommandPalette.tsx` (278),
`CommandPalette.ime.test.ts` (90), `src/lib/palette-rank.ts` (12),
`palette-rank.test.ts` (34), `src/components/bot-panel/side-panel.dom.test.ts`
(102), `src/hooks/use-remembered-side-panel.ts` (62) and its DOM test (164),
`src/components/NewThreadHeaderButton.tsx` (27),
`server/host/room-new-thread.ts` (24), `src/components/PinnedMessagesMenu.tsx`
(133), `PinnedMessagesMenu.test.ts` (11), `PinnedMessagesMenu.dom.test.ts`
(119), `server/routes/undo.ts` (23), `src/components/UndoToast.tsx` (29),
`src/components/BotThreads.test.ts` (147), `src/state/new-chat.ts` (122),
`src/components/GlassScrollFrame.tsx` (136), `src/components/elevated.ts`
(11), `src/components/SidebarTiles.tsx` (181), `SidebarTiles.test.ts` (155),
`src/components/bot-panel/PanelShell.tsx` (189), `PanelShell.dom.test.ts`
(442), `page-registry.ts` (94), `page-registry.test.ts` (54),
`panel-link.ts` (61), `panel-link.test.ts` (62),
`src/components/BotSettingsDialog.tsx` (288), `src/lib/last-bot-section.ts`
(39), `last-bot-section.test.ts` (57), `src/lib/search-disclosure.ts` (66),
`server/direct-apply.ts` (32), `src/components/SidebarGroupThreadList.tsx`
(52), `docs/verification/threads.md` (193).

**The rail in the window (group G):** `docs/verification/cloud-rail.md` (231),
`src/components/PlacesRail.tsx` (522), `PlacesRail.test.ts` (957, in three
ranges), `PlacesRail.frame.test.ts` (65), `src/rail.tsx` (28), `rail.html`
(12), `src/lib/places.ts` (166), `src/lib/two-places.ts` (32),
`src/lib/places-together.ts` (179) and its test (48),
`src/components/PlacesTogetherSwitch.tsx` (26),
`src/components/TwoPlacesCard.tsx` (46), `scripts/verify-cloud-rail.ts`
(134), `scripts/testing/rail-preview.tsx` (266),
`scripts/testing/rail-profile-ui.e2e.test.ts` (479, in two ranges),
`src/components/ChromeRailToggle.tsx` (43), `electron/start-place.mjs` (38),
`electron/local-profiles.mjs` (258), `electron/home-places.mjs` (115),
`electron/place-switch.mjs` (64).

**The rail in the main process, the colour, the banner (group H):**
`electron/cloud-rail.mjs` (308), `cloud-rail.d.mts` (102),
`cloud-rail.node-test.mjs` (537), `electron/chrome-rail.mjs` (219),
`chrome-rail.d.mts` (46), `chrome-rail.node-test.mjs` (406),
`electron/rail-accounts.mjs` (48), `rail-accounts.node-test.mjs` (175),
`electron/place-look.mjs` (107), `place-look.d.mts` (28),
`place-look.node-test.mjs` (193), `src/lib/place-look.ts` (65),
`src/lib/place-banner.ts` (103), `place-banner.test.ts` (83),
`server/workspace-banner.ts` (193), `workspace-banner.test.ts` (97),
`workspace-banner.e2e.test.ts` (109), `server/routes/workspace-banner.ts`
(104), `server/routes/workspace-banner.test.ts` (96),
`electron/environments-file.mjs` (39).

**Read in ranges only, for single facts:** `src/components/ChatMarkdown.tsx`
(150-205, 745-770), `src/components/Composer.tsx` (820-835),
`src/components/ChatView.tsx` (320-335, 720-790, 880-1060),
`src/components/Sidebar.tsx` (440-668 and four short ranges),
`src/components/SidebarThreadRow.tsx` (1-200), `src/App.tsx` (120-140,
255-270, 470-542), `src/state/store.tsx` (1366-1392, 2025-2042, 2090-2100),
`src/lib/sidebar-preferences.ts` (160-200, 400-512),
`src/lib/sidebar-layout.ts` (120-160), `src/components/AppNotices.tsx` (five
ranges), `src/components/settings/SettingsNav.tsx` (235-280),
`server/app-settings/registry-window.ts` (1-40), `server/atomic.ts` (1-130),
`server/index.ts` (9270-9330, 12160-12200, 14050-14080, and single lines),
`electron/main.mjs` (1488-1535, 1928-1985, 2240-2275, 2445-2470, 2580-2625),
`electron/preload.cjs` (60-100, 160-256), `electron/account-places.mjs`
(30-59), `server/move-waits.ts` (1-40), `announcements/releases.json` (by
search). Each range is in the report of its reader.

**Named only, not opened:** the screenshots in `docs/pr-screenshots/cloud-rail/`,
`rail-this-mac/`, `rail-workspaces/`, `docs/verification/evidence/rail-collapse/`,
`mentions/rtl-*.png`, and `src/mascot-preview.css` (a developer page).

## 3. How it works

### 3.1 The layout rules of DESIGN.md

1. The window has three places: the sidebar, the chat and the bot panel. A
   new thing goes into one of them. There is no fourth place
   (`DESIGN.md:39-41`).
2. No new header buttons (`DESIGN.md:43-44`). The chat header shows the bot,
   its model and its screen. Two exceptions:
   - A button that exists only while the conversation has what it shows. The
     pinned message is the example. It opens a menu and goes away when there
     is nothing to show (`DESIGN.md:45-47`).
   - "New thread": a plus button with the shortcut Cmd+T, at the end of the
     header in both modes. With "Thread tabs" on, the threads of the bot are
     tabs in the header, and the plus is at their end (`DESIGN.md:47-51`).
3. No count badges and no "needs you" summary above the sidebar list or in
   the header. A status mark on the row that owns it is allowed
   (`DESIGN.md:52-53`).
4. The settings of one bot are only in its bot panel. The settings of the
   app are only in Settings (`DESIGN.md:54-55`).
5. No new global settings, switches or hidden flags. The one exception is
   "Settings → Features": an on/off switch for a whole feature, only when
   "off" hides the whole feature and loses nothing that the person made
   (`DESIGN.md:56-63`).
6. No new asks: no permission asks, approval cards, confirm dialogs, nags or
   waits, and no default below Full access. A change that may need a way back
   gets "Undo" (`DESIGN.md:64-66`).
7. A bot sets itself up by a conversation (`/setup`), not by form fields
   (`DESIGN.md:67-68`).
8. Simple mode is the default of a new install and is designed first. An
   everyday feature is at most two clicks from the chat in Simple mode
   (`DESIGN.md:69-72`).
9. Layout numbers (`DESIGN.md:193-234`, `src/lib/use-media-query.ts:16-32`):
   - The sidebar is 280 px in both modes. A person can drag it from 240 to
     480 px, and the chat keeps at least 320 px
     (`src/lib/sidebar-preferences.ts:171-175`). Simple and Advanced keep
     separate widths (`:12-13`).
   - A side panel is 320 px in Simple mode and `min(420px, 42vw)` in Advanced
     mode (`src/components/bot-panel/side-panel.ts:12`).
   - The sidebar stays open beside a side panel while the chat keeps 440 px:
     from 1040 px with a 320 px panel, from 1280 px with a wider one. Two
     side panels fit from 1536 px. Narrower, the sidebar folds to its avatars
     (`DESIGN.md:213-215`).
   - Below 920 px, the Simple bot panel floats over the edge of the chat. It
     never moves the sidebar (`DESIGN.md:216-219`).
   - Below 768 px (the phone layout), the sidebar is a full-screen bot list, a
     side panel covers the window and Settings is a bottom sheet
     (`src/styles.css:1786-1799`, `:3634-3639`).
   - Pinned bot tiles are 95 × 92 px with a 60 px avatar
     (`DESIGN.md:195-196`).
   - The window is designed for 1440 × 900. Nothing may clip or overlap at
     the smallest window (`DESIGN.md:233-234`).
10. Layout uses logical properties only (`ms-`, `me-`, `ps-`, `pe-`,
    `start-`, `end-`). A directional icon flips with `rtl:-scale-x-100`
    (`DESIGN.md:230-232`). No automatic check enforces this rule
    (`DESIGN.md:419-432`).
11. Motion: an animation lasts 300 ms at most. Hover changes colour and
    opacity in 120 ms. Nothing grows from zero, only from about 96 %. Nothing
    loops except a status that is really live (`DESIGN.md:305-322`). A mascot
    holds still at rest and moves only while its bot works, for a beat that
    explains a change, or under the pointer (`DESIGN.md:323-326`).
12. The rules are rules, not advice. A pull request that breaks one changes
    `DESIGN.md` in the same pull request (`DESIGN.md:7-9`). The pull request
    checklist asks for screenshots in Midnight and Daylight, in Simple mode,
    at 1440 × 900 and narrow, with test data only (`DESIGN.md:434-445`).

### 3.2 Choose and wear a skin

1. At start, `src/main.tsx` applies the skin and the cached theme at module
   top level, before React renders (`src/main.tsx:26-32`). The skin is the
   attribute `data-skin` on `<html>` (`src/lib/skins.ts:97-98`).
2. The stored choice is `localStorage["omb-skin"]` (`src/lib/skins.ts:39`).
   "system" follows `(prefers-color-scheme: dark)`: Daylight on a light
   system, Midnight on a dark system (`src/lib/skins.ts:32-40`). A browser
   with a prior run and no valid stored skin gets Midnight (`:37`,
   `src/lib/prior-run.ts:2`).
3. The picker opens each skin as a live miniature. This works because a skin
   block uses `[data-skin=...]`, not `:root[data-skin=...]`, so any subtree
   can open its own skin (`src/styles.css:94-96`,
   `src/components/SkinPicker.tsx:15-21`).
4. A pick in the picker also takes off the custom theme
   (`SkinPicker.tsx:93`). The "Theme" row (System, Light, Dark) and the
   palette command "Toggle light/dark" do not take it off (`ThemeRow.tsx:32`,
   `CommandPalette.tsx:115`).
5. The skin choice goes to the main process, which paints the native window
   background, the talk panel and the rail (`src/lib/skins.ts:104`,
   `electron/main.mjs:2250-2262`). The table of `--color-app` for each skin
   in `electron/skin-overlay.cjs` is a hand-kept copy. A test keeps it equal
   to the stylesheet (`electron/skin-overlay.test.mjs:28-32`).
6. Before the renderer loads, Electron paints `#121212` or `#fcfcfc` by the
   light or dark setting of the system, not by the stored skin
   (`electron/window-chrome.mjs:3-6`). On Windows the window waits up to 5 s
   for the skin before it shows (`electron/main.mjs:1970-1977`). On macOS and
   Linux it shows at once. Thus a person with a pinned skin of the other mode
   may see a flash of the wrong colour. Nobody measured it.
7. A person can also set a font (`:root[data-font=system|inter|poppins|serif]`)
   and a chat width (`:root[data-chat-width=wide|full]`). The font outranks
   the skin (`src/styles.css:221-247`, `:1413-1435`).

### 3.3 A bot makes a theme

The five actions are in [`app-settings.md`](app-settings.md) section 3.9.
This is the path of `set_theme`.

1. The bot calls `app_settings` with `action: "set_theme"` and a JSON string
   `theme` of 120,000 characters at most
   (`server/drivers/agents-app-settings-tool.ts:20`).
2. The host finds the person. A thread that a guest drives, or a turn that
   the person did not start, gets 403: "A theme changes only for the person
   who asked, in their own conversation…" (`server/app-settings/host.ts:206-207`).
   On a server of the person, the person is "owner". On a Team Cloud, it is
   the person who asked (`server/index.ts:12226`).
3. The theme passes the zod schema of `shared/theme.ts:59-74`, and
   `themeCssProblem` checks the CSS (`shared/theme.ts:191-202`). A refusal is
   a 400 with a sentence that a bot can act on.
4. The write spends one of the 10 writes of the turn
   (`server/app-settings/host.ts:19`, `:100-106`). Over the budget: 429.
5. The theme setting has the tier "safe" (`server/themes/tool.ts:77`). So the
   change applies at once, with no approval card. The host posts a card
   with `autoApplied: true` and Undo, keeps the Undo data in a memory map, and
   logs the decision as "auto-approved" (`server/app-settings/host.ts:144-150`).
6. The store writes the theme file, then `active.json`, then one history
   entry (`server/themes/store.ts:176-184`). These are three separate atomic
   writes, not one transaction.
7. The server pushes a `theme` frame. On a Team Cloud it goes only to the
   windows of that person. On a server of the person it goes to the admin
   windows (`server/index.ts:12226`). Each window calls `loadTheme()` and
   paints the theme (`src/lib/theme/runtime.ts:137-142`).
8. `add_theme_asset` copies a picture from the folders of the bot, or from
   an attachment of this conversation. A HEIC photo is refused by its bytes.
   Over 10 MB gives 413. With no theme worn, it makes an unworn theme named
   "Background" (`server/themes/tool.ts:166-191`, `:216-260`). It spends a
   write but posts no card and records no look change
   (`server/app-settings/host.ts:212-214`).

### 3.4 The checks on theme CSS

The checks run in two places. The server check is an early answer in words.
The window check is the guard (`shared/theme.ts:188-189`).

1. The server refuses (`shared/theme.ts:191-202`):
   - `@import`,
   - a backslash outside a quoted string,
   - `image-set()`, `image()` and `src()`,
   - a `url()` that it cannot read,
   - a `url()` whose target is not `data:`, `#id` or
     `/api/theme-assets/<theme>/<file>` without `..`
     (`shared/theme.ts:122-126`).
2. A colour value may not contain `url`, `image`, `src` or `attr`
   (`shared/theme.ts:52-54`).
3. The window puts the CSS into one adopted stylesheet after the app styles
   (`src/lib/theme/theme-css.ts:74-78`). It calls `replaceSync(css)` and then
   walks the parsed rules from last to first (`:43-64`, `:80-81`):
   - In `@keyframes` and in each rule with a style, it deletes each
     declaration that loads a file (`:47-53`, `:59-60`).
   - It deletes an `@property` whose initial value loads (`:54-58`).
   - It walks into `@media` and nested rules (`:61`).
   - It deletes each other rule kind, except a `@layer` statement (`:62`).
   The browser decodes escapes such as `u\72l(` before this walk, so an
   escape cannot hide a load (`:1-4`).
4. Any error empties the sheet. Then the theme has no CSS at all
   (`theme-css.ts:82-84`).
5. A test in real Chromium proves that no request leaves the page
   (`theme-css.chromium.test.ts:81-84`).
6. The checks limit only loads. They do not limit selectors or properties. A
   theme can hide, move or relabel any element. The theme guide lists
   `[data-look="approval-card"]` and `[data-look="ask-card"]` as stable hooks
   (`shared/theme.ts:231-232`).

### 3.5 Wear a theme in the window

1. The runtime paints the theme colours as inline `--color-<role>` values on
   `<html>`, over the skin tokens (`src/lib/theme/runtime.ts:81-86`). The
   order of the merge is: the canvas palette, the accent palette, then
   `theme.colors`, then the colours of the light or dark block
   (`:75-80`).
2. Derived colours keep contrast floors: ink 12:1 on the canvas, secondary
   and tertiary ink 4.5:1 on hover, accent text and focus 4.5:1 on the ground
   (`src/lib/theme/palette.ts:54`, `:74-75`, `:84`). Explicit `colors` skip
   these floors (`runtime.ts:78-79`). `parseHex` turns a bad colour into
   black with no error (`palette.ts:9-14`).
3. A theme with both a light and a dark block, and no own skin, follows the
   light or dark choice of the person. Else the skin of the theme, or the
   mode of its canvas, wins (`runtime.ts:67-70`).
4. A font sets `--font-sans` and sets the tracking to 0 (`runtime.ts:91-95`).
5. The runtime sets `data-theme=<id>` and applies the CSS (`runtime.ts:96-97`).
6. It caches the theme in `localStorage["omb-theme"]` (`runtime.ts:10`,
   `:105-113`). At the next start the cache paints before the server
   answers. A cache that fails the schema gives no theme (`:115-123`).
7. `loadTheme()` asks `GET /api/themes/active`. An error keeps what is
   painted. An answer whose theme fails the schema of the client takes the
   theme off and clears the cache (`runtime.ts:125-135`). Thus a schema
   change between versions drops the theme of the person with no message.
8. A picture background stays readable through a veil of `--color-app`. The
   veil keeps main text at 4.5:1 over a black or white pixel in the default
   skins (`palette.test.ts:24-35`).
9. The rail page is a separate web page. It runs the same first-paint steps
   and asks the server itself, because it gets no `theme` frames
   (`src/rail.tsx:15-25`).

### 3.6 The ways back from a theme

1. **Reset key:** Cmd+Option+Shift+R on a Mac, Ctrl+Alt+Shift+R elsewhere. A
   capture listener on `window` catches it (`runtime.ts:169-182`).
   `resetLook()` sets the default skin, takes the theme off and sends
   `PUT /api/themes/active {id: null, skin}` (`runtime.ts:162-167`).
2. **Safe look:** the parameter `?safe-look` opens one window without the
   theme. The server state stays. The window keeps the flag in
   `sessionStorage["omb-safe-look"]` (`runtime.ts:11`, `:29-36`,
   `server/themes.ui.e2e.test.ts:71-77`).
3. **"Reset look"** in Settings (`CustomThemesSettings.tsx:202-204`).
4. **The skin picker** (`SkinPicker.tsx:93`).
5. **The bot:** `set_theme` with the id `none` (`server/themes/tool.ts:126`),
   or `undo_theme`.
6. **Error path:** `takeOffTheme()` and `resetLook()` do not read the answer
   of the PUT (`runtime.ts:144-153`, `:162-167`). When the PUT fails, the
   window shows the default look. At the next start or the next `theme`
   frame, `loadTheme()` wears the old theme of the server again.
7. A phone keeps its own look (`themes.mdx:7`).

### 3.7 The history of looks and Undo

1. Each change of the look adds one entry to `history.json`: the look before
   and after, and a snapshot of each theme file that it wrote over. The file
   keeps the last 30 entries (`shared/theme.ts:94`,
   `server/themes/history.ts:15-33`, `:46-51`).
2. A snapshot keeps the names of pictures and fonts, not their bytes
   (`history.ts:18-20`). A restore brings back `theme.json` but not a deleted
   picture. The tool names the missing files (`store.ts:210-213`,
   `tool.ts:154-156`).
3. A restore is a new entry of the kind `undid`. So the Undo of an Undo is a
   Redo (`server/themes/store.ts:200-207`).
4. Card Undo: the card keeps `undoTo`, the newest history number before the
   change (`server/themes/tool.ts:79`). A restore undoes every entry after
   it (`history.ts:58`). The stale check compares only the name of the worn
   theme (`tool.ts:72-75`, `host.ts:268-269`). So a later edit in Settings
   that keeps the theme name is undone too, with no stale warning.
5. The Undo data of the card is in a memory map. After a restart the card
   gives 409 "This change can't be undone here." (`host.ts:88`, `:266-267`).
   `undo_theme` and "Recent changes" in Settings still work, because they
   read `history.json`.
6. **Error path, failed read:** `readHistory` returns `[]` on a read, JSON or
   schema error. The next `appendHistory` writes that empty list plus one
   entry over the file. All the earlier history is lost
   (`server/themes/history.ts:37-51`).
7. **Error path, failed read of a theme:** `read` returns null for a damaged
   `theme.json` (`store.ts:95-103`). A save then treats the theme as new, and
   writes over the damaged file. The snapshot records `file: null`, so the
   old content cannot come back (`store.ts:177-178`, `:182`).
8. A damaged `active.json`, or a worn theme that no longer parses, gives the
   default look with no message (`store.ts:121-128`).
9. A crash between the theme write and the history write leaves a change
   with no history entry. It cannot be undone (`store.ts:178-184`).

### 3.8 "Your themes" in Settings and the HTTP routes

1. Settings, Appearance lists the themes of the person with Edit, Use and
   Stop using. The editor has Name, Background, Accent, Custom CSS,
   Duplicate, Export, Delete, Cancel and Save. There are Import, New theme and
   "Recent changes" with Restore (`CustomThemesSettings.tsx:50-121`,
   `:176-208`).
2. The routes (`server/themes/routes.ts:30-128`):
   - `GET /api/themes`, the list,
   - `GET|PUT /api/themes/active`,
   - `GET /api/themes/history`, and `POST` with an index to restore,
   - `POST /api/themes/import`,
   - `GET|PUT|PATCH|DELETE /api/themes/<id>`, and `/<id>/export`,
     `/<id>/duplicate`,
   - `GET|HEAD /api/theme-assets/<id>/<file>`.
3. Each route needs a person. On a server of the person, the owner or an
   admin maps to "owner", so admins share the themes of the owner. On a Team
   Cloud, it is the person of the session (`server/index.ts:12226`).
4. A theme file is served with `nosniff`, `private, no-cache`, a sandbox CSP
   and `Cross-Origin-Resource-Policy: same-origin`. So an SVG with a script
   cannot run as a page (`routes.ts:39-43`, `routes.test.ts:93-96`).
5. PUT (an edit) is recorded in the history. PATCH (a rename) is not. DELETE
   of a theme that is not worn records nothing and removes the folder at
   once. DELETE of an unknown id answers 200 (`store.ts:261-265`,
   `routes.ts:122-127`).
6. Delete in Settings has an Undo that lives in the state of the component.
   A move to another page or a restart loses it
   (`CustomThemesSettings.tsx:164-172`).
7. Duplicate copies the pictures before the save. If the save refuses, the
   copied folder stays with no `theme.json`. It counts against the limit of
   50 themes but does not show in the list (`store.ts:105-111`, `:254-258`,
   `:293-296`).

### 3.9 Switch between Simple mode and Advanced mode

1. The mode is `localStorage["omb-advanced-mode"]`: `"1"` is Advanced, `"0"`
   is Simple (`src/lib/interface-mode.ts:7`, `:26-27`). It is per browser
   and per device, not per account.
2. With no stored value, a browser with a prior run (`omb-skin`,
   `omb-installed`, `omb-email-gate`, `omb-drafts` or `omb-show-threads`)
   gets Advanced, and a new browser gets Simple (`interface-mode.ts:28`,
   `src/lib/prior-run.ts:2-7`). The default is written once at start, so it
   does not drift (`interface-mode.ts:34-39`, `src/main.tsx:26-27`).
3. A storage error reads as Simple. A write error still switches the mode
   for the session (`interface-mode.ts:29-31`, `:67-71`). An unknown stored
   value, for example `'true'`, falls back to the prior-run default
   (`interface-mode.ts:26-28`).
4. Entry points:
   - the "Advanced mode" switch at the foot of the Settings page list
     (`src/components/settings/SettingsNav.tsx:245-259`),
   - a popup shown one time (`SimpleModePrompt.tsx:28-31`),
   - the "Advanced" row of the Simple bot panel, which switches the whole app
     to reach one setting (`bot-panel/AdvancedSettingsRow.tsx:13-16`),
   - the computer panel (`ComputerPanel.tsx:1472`),
   - a bot, through `app_settings` (`server/app-settings/registry.ts:168`).
5. The server learns the mode only from a report of the window:
   `PUT /api/window-prefs`, owner or admin, kept in a memory map
   (`src/lib/window-prefs.ts:41`, `:114-125`,
   `server/routes/app-settings.ts:29-37`). A bot write of a window
   preference is refused while no window is open, or before the window
   reported that preference (`server/routes/app-settings.ts:43-48`). The
   push goes to every admin window, so a bot switches the mode of each open
   window at once.
6. In Simple mode the server refuses bot changes to settings that only
   Advanced mode has (threads, tool layout, pinned circles, pinned pages)
   (`server/app-settings/registry-window.ts:10-14`).
7. Settings search in Simple mode can show an Advanced section, marked, with
   no switch (`src/components/settings/AdvancedSection.tsx:25-31`).
8. A paired remote client keeps the Advanced controls in Simple mode
   (`src/components/ChatView.tsx:740`).

### 3.10 The mode history (added, then reversed)

1. v0.1.94, commit `b9ab44b97` (2026-10-02): "Simple mode by default, an
   Advanced mode switch, and the Meadow skin".
2. v0.1.151, commit `1de1164d5` (2026-11-09): "Make Simple the only mode".
   The compile-time switch `SIMPLE_ONLY` (`src/lib/simple-only.ts:2`) made
   Advanced unreadable. At start, the migration deleted eight settings that
   only Advanced mode could change: the font, the chat width, the thread
   list, the run card, the web panels, the sidebar tools layout, the pinned
   circles and the pinned pages (`src/lib/new-look.ts:17-18`, `:49-56`).
3. v0.1.152, commit `6f83379a8` (2026-11-10): "Bring Advanced mode back".
   `SIMPLE_ONLY` is `false` at HEAD. A browser whose key `omb-new-look` is
   "due" or "seen" goes back to Advanced and gets an "Advanced mode is back"
   notice one time (`new-look.ts:40-45`, `AppNotices.tsx:182-183`, `:368`).
4. The eight deleted settings did not come back. A test makes that the
   intended result (`src/lib/new-look.test.ts:160-168`). This breaks the rule
   "Switching modes never loses data" (`DESIGN.md:394`).
5. Code that stays: `SIMPLE_ONLY` branches in at least 8 files, the dead
   export `AdvancedModeRow` (`AppSettingsRows.tsx:280-293`), and the keys
   `omb-new-look` and `omb-advanced-back` in each browser that ran v0.1.151
   or v0.1.152 (`new-look.ts:13`, `:21`).
6. Other reversed features of the same kind:
   - The Today page: added in v0.1.120 (`93b4f40dc`), replaced by the brief in
     v0.1.123 (`b7fe18b04`). The route `/api/today` and its test stay, with no
     caller in the app (`server/index.ts:12035`,
     `server/routes/today.test.ts:42-65`).
   - The inline chip that quotes selected text into the prompt: added in
     v0.1.111 (`17325fc0c`), reverted in v0.1.112 (`0f1d6176e`) with no
     reason in the message. The older citation chip for selected text stays
     (`src/components/CitationUI.tsx`).
7. v0.1.137, the blank window after an update: commit `03065106b` keeps a
   preload function (`desktopNotices.shown`) that v0.1.136 removed. A Cloud
   page of v0.1.135 needed it. The cause was not a skin, a theme or the skin
   overlay. The theme runtime did not exist at v0.1.137.

### 3.11 The command palette

1. Cmd+K or Ctrl+K (no Shift, no Alt) on `window` opens and closes it. Other
   code opens it with the window event `omb:open-command-palette`
   (`src/components/CommandPalette.tsx:24-28`, `:41-46`).
2. The entries, in this order: bots (not hidden ones), group chats, the one
   command "Toggle light/dark", then message hits from
   `GET /api/search?q=&limit=12`, 150 ms after the last key, only for a query
   that is not empty (`CommandPalette.tsx:69-103`).
3. The rank: prefix matches first, then substring matches, with no case.
   Each tier keeps the input order. There is no fuzzy match
   (`src/lib/palette-rank.ts:1-12`).
4. IME: a key event with `isComposing`, or `keyCode === 229`, stops and does
   nothing. So an Enter or Escape of the input method never picks or closes
   (`src/lib/send-key.ts:22-24`, `CommandPalette.tsx:126`).
5. Error path: a failed search shows no hits and no message
   (`CommandPalette.tsx:79`).

### 3.12 Side panels, New thread, pinned messages, Undo

1. **Side panel:** from 768 px it stands beside the chat or floats over it.
   Below 768 px it covers the window (`side-panel.ts:10-17`). When a panel
   beside the chat closes, an inert copy slides out in 240 ms. There is no
   slide with reduced motion, for a floating panel, or when another panel
   takes its place (`side-panel.ts:19-72`).
2. **Remembered panel:** one global value per device,
   `localStorage["omb-side-panel-open"]`, `computer` or `inspector`. The bot
   settings panel is not remembered. Below 768 px nothing is remembered. A
   remote client never opens the inspector again
   (`src/hooks/use-remembered-side-panel.ts:5-61`). The value is not per
   bot, so after a restart the panel opens for whichever bot the chat shows.
3. **New thread:** the header button only dispatches `newTask`. The window
   opens a blank chat `new-chat-<botId>`. The server call
   `POST /api/bots/<botId>/tasks` comes with the first send, one time for
   each blank chat (`NewThreadHeaderButton.tsx:18`,
   `src/state/new-chat.ts:20-23`, `:65-78`). The shortcut is Cmd/Ctrl+T or
   Cmd/Ctrl+Shift+N (`src/App.tsx:261-266`). A reload before the first send
   loses the blank chat and its model and approval choices
   (`new-chat.ts:5`, `:24-27`). The page `docs/verification/threads.md:38-40`
   says the thread is made at once. The code does not do that.
4. **A room thread from a Chief bot:** `openRoomThread` allows 4 per turn, a
   title of 80 characters and one line, with secrets redacted
   (`server/host/room-new-thread.ts:6-24`).
5. **Pinned message:** one pinned message per thread (`pinnedMessageId`). A
   header menu has Jump and Unpin. A new pin replaces the old one. A remote
   client has no Unpin (`PinnedMessagesMenu.tsx:16-23`,
   `ChatView.tsx:328-331`). The task PATCH accepts only an id that is in the
   thread (`server/routes/tasks.ts:370-374`). The PATCH of a bot accepts any
   id that matches `^[\w-]+$` on purpose (`server/routes/bot-patch.ts:239-244`).
   A pin to a message that is not loaded shows no button.
6. **Undo on the server:** `POST /api/threads/:id/undo {requestId}`, allowed
   to whoever may answer the card with "allow". It covers changes to
   routines, webhooks, app triggers, waits, the profile, the model, skills,
   team memory, team setup and app settings. It has no time limit. A stale
   change refuses with `code: "changed-since"` (`server/routes/undo.ts:1-23`,
   `server/index.ts:9284-9330`, `server/direct-apply.ts:15`).
7. Each kind keeps its earlier state on the stored card (profile, model,
   routine, webhook, app trigger, team setup), so its Undo works after a
   restart. The app setting kind keeps it in a memory map with no size limit
   and no expiry, so only that kind fails after a restart
   (`server/app-settings/host.ts:88`, `:149`, `server/profile-requests.ts:387-405`,
   `server/model-requests.ts:245-268`).
8. **UndoToast:** a separate toast of 6 seconds in React state, for "Thread
   hidden". It does not use the server route (`UndoToast.tsx:7-17`). A reload
   in those 6 seconds loses the Undo. The hide itself is stored.

### 3.13 Threads tree, floating header, pinned bot tiles, bot panel

1. **Threads tree:** only Advanced mode shows the threads as a tree under the
   bot row. Simple mode may unfold them on a click of a small chevron, never
   on hover (`DESIGN.md:387-391`). The order and the limits are in
   [`threads.md`](threads.md). "Show all N threads" is remembered for each bot
   in `openmausbot.sidebarShowAllThreads.v1`, for 100 bots at most
   (`src/lib/sidebar-preferences.ts:461-507`). The open state of the tree and
   of folders is in memory only (`src/lib/search-disclosure.ts:3`, `:30-55`).
2. **Floating chat header:** the header is a glass bar over the transcript.
   It never hides or shrinks on scroll. Advanced mode has a blurred band.
   Simple mode has no band: the transcript fades in over 60 px under the
   floating controls, and only the controls take clicks
   (`src/components/GlassScrollFrame.tsx:89-101`, `src/styles.css:2102-2128`).
   The model pill folds to the mark of its AI while a side panel narrows the
   chat, in 240 ms (`src/styles.css:1704-1749`).
3. **Pinned bot tiles** (Simple mode, desktop only): a centred grid of
   95 × 92 tiles, at most 40 % of the window height. The main bot is first
   and never moves. The order is per device in
   `openmausbot.pinnedCircleOrder.v1` (`src/components/SidebarTiles.tsx:78`,
   `:169-180`, `src/lib/sidebar-layout.ts:137-145`).
4. **Bot panel in Simple mode:** three tabs (Details, Library, Computer), a
   page stack with Back, and a top bar with Share, a gear for Bot settings,
   and Close. Escape closes the avatar editor, then goes back one page, then
   closes the panel (`bot-panel/PanelShell.tsx:80-115`, `:135-163`). Settings
   open in the panel through `openBotSettings(dispatch, section, {page,
   anchor})`, which maps a section to a tab, a page and a card
   (`bot-panel/panel-link.ts:27-49`, `bot-panel/page-registry.ts:74-94`).
   Advanced mode shows a dialog with 12 sections instead
   (`BotSettingsDialog.tsx:54-55`).

### 3.14 Right-to-left text in messages

1. The direction of a message does not depend on the language of the UI.
   The chrome stays left-to-right (`docs/verification/bidi.md:15-17`).
2. Plain text bodies use the class `.chat-text`: `unicode-bidi: plaintext`
   and `text-align: start`. Each line takes the direction of its first strong
   character (`src/styles.css:1233-1243`). The inner text element must carry
   the class, because `unicode-bidi` is not inherited (`bidi.md:21-24`).
3. A Markdown reply sets the direction of each block in JavaScript. The
   script with more words wins. Addresses, versions, paths, flags and
   camelCase names are not counted (`src/components/ChatMarkdown.tsx:156-201`,
   `bidi.md:25-31`). So a block that opens on "Chrome 158" is still
   right-to-left.
4. The code does not use `dir="auto"` for blocks, because `dir="auto"`
   ignores children that carry their own `dir`. A quote or table whose
   children set their own direction would find no text and fall back to
   left-to-right (`bidi.md:43-47`).
5. A table has one direction for all cells (`ChatMarkdown.tsx:771-810`,
   `bidi.md:32-34`).
6. Code blocks and inline code are always left-to-right and isolated
   (`ChatMarkdown.tsx:299`, `:759`). Links use `dir="auto"` and are isolated
   (`ChatMarkdown.tsx:746`, `ChatLinks.tsx:7`).
7. The composer uses `dir="auto"`. Its mirror of mention colours gets the same
   `dir` and `unicode-bidi: plaintext`, so mirror and text agree line by line
   (`Composer.tsx:829`, `MentionTextarea.tsx:59-62`, `src/styles.css:47-53`).
   A message reads the same while typed and after it is sent.
8. Right-to-left lines in Markdown get line height 1.75. The chat font maps
   Arabic and Hebrew ranges to local faces (`src/styles.css:1245-1257`,
   `:1339-1342`).
9. The UI chrome: `show()` sets `<html dir="rtl">` only for `ar`, `fa`, `he`
   or `ur` (`src/lib/i18n.ts:16`, `:44-47`). None of these packs is
   registered, so the chrome is always left-to-right
   (`src/locales/index.ts:7-23`).
10. Menus swap the meaning of Left and Right by the computed direction of the
    menu (`src/components/model-menu-keys.ts:32-62`).

### 3.15 Reduced motion, keyboard and touch

1. Two switches control reduced motion:
   - The media query of the system. A blanket rule on `*` stops every
     animation and sets each transition to 0.01 ms (`src/styles.css:3110-3124`).
   - The attribute `:root[data-reduced-motion="true"]`, which the onboarding
     preview sets. It covers only a listed set of classes
     (`src/styles.css:2627-2642`). With the attribute on and the system
     setting off, the caret, the thinking sheen, mascots and the chat
     backdrop of a theme keep moving.
2. Menus close at once under reduced motion (`MenuMotion.tsx:6-10`,
   `:28-31`). A mascot holds still, because its motion strength becomes 0
   (`CursorAvatar.tsx:597-598`). The mascot hook reads only the media query
   (`src/components/mascot-clock.ts:161-173`).
3. `prefers-reduced-transparency` makes glass solid. Forced colours use
   `Canvas` and `CanvasText` (`src/styles.css:1818-1844`, `:2202-2216`).
4. Keyboard: menus move with the arrows, Home, End, Enter, Escape and
   type-ahead. Type-ahead resets after 500 ms. One repeated letter cycles
   through the rows with that letter (`src/lib/menu-keys.ts:1-23`). Tab never
   lands on a hidden element (`model-menu-keys.ts:22-30`). A global
   `:focus-visible` ring is 2 px of `--color-focus` (`src/styles.css:2218-2223`).
5. Touch: the custom variant `touch:` is `(hover: none), (pointer: coarse)`
   (`src/styles.css:11-15`). Tailwind puts `hover:` only under
   `(hover: hover)`, so each control that hover reveals also needs `touch:`.
   A test enforces it (`touch-actions.test.ts:117-133`). Touch targets grow
   to 40 or 44 px (`src/styles.css:117`, `:1365-1385`). The composer text is
   16 px on a coarse pointer, so Safari does not zoom (`:75-77`).

### 3.16 The rail of places

1. **When it shows:** with two places or more. With a Cloud of the person's
   own, one place is enough, so that ＋ can buy another one
   (`electron/cloud-rail.mjs:18`, `:103`). Buying a Cloud and the Cloud
   plans are out of scope here. The rail shows them only as tiles, the ＋
   sheet and the progress ring of a Cloud that is set up.
2. **What it is:** a separate Electron `WebContentsView` with its own page,
   `/rail` on the local server, at x 0, 36 px wide, the full height of the
   window (`electron/chrome-rail.mjs:21-22`, `:53-57`, `:101-116`,
   `electron/main.mjs:2602-2604`). The view is sandboxed, denies pop-ups and
   blocks each navigation away from its own address (`chrome-rail.mjs:103-109`).
3. **The page beside it** moves over by 36 px. The shared preload injects
   `padding-left` and tells the page the width with `rail:beside`. The page
   exposes it as `--rail-beside` (`electron/preload.cjs:71-82`,
   `chrome-rail.mjs:60`). A test fails each fixed element at the left edge
   that does not add `--rail-beside` (`src/components/rail-safe-fixed.test.ts:28`).
4. **Who may read the list:** only the main frame of the rail view. Each
   other page gets `{places: [], beside: true}`. The list has no addresses
   and no Cloud ids (`cloud-rail.mjs:6-10`, `:150-151`, `:181-182`). Each
   action acts only on an id that main listed itself (`cloud-rail.mjs:199-248`).
   The preload asks for a user click (`navigator.userActivation.isActive`)
   for each place action from a remote page (`preload.cjs:175-221`).
5. **Tiles:** at most 8 (`RAIL_SHOWN`, `PlacesRail.tsx:30`). Past 8, the
   first 7 and the place on screen show, and "Show all {count}" opens a
   searchable list (`PlacesRail.tsx:69-73`, `:383-408`). A tile is 24 px. It
   shows the colour of the place with white initials, a laptop icon for this
   computer, or a person icon. An offline or ended place is grey at 55 %
   (`PlacesRail.tsx:105-114`). A red dot means "needs you" and an accent dot
   means an update (`:163-164`). With several accounts, a divider separates
   the tiles of each account (`:85`).
6. **Open a place:** a click marks the tile active and pending at once. A
   newer click replaces it, and only the answer to the latest click clears
   the mark. The rail covers the window with "Opening {name}…" or "Waking My
   Cloud…" (`PlacesRail.tsx:411-412`, `:430-468`, `:517-520`).
7. **Switch between local workspaces:** one local server runs at a time. A
   switch waits for the work under way, and the tile says "{name} opens once
   {bot} finishes" with a pulsing ring. The wait has no time limit. The full
   flow is in `environments-and-flags.md` section 3.16.
8. **Menus:** right-click on a tile. A workspace has Rename, Color, "Show
   bots together" and "Remove from this computer". A listed place has
   Rename, Color, "Show bots together", "Make {name} my home" and "Remove
   from list" (`PlacesRail.tsx:250-284`, `:353-380`). Remove asks first:
   "Its bots, chats and files on this computer are deleted. Its folder goes
   to the Trash first." (`PlacesRail.tsx:323-350`).
9. **Colour:** six swatches: blue, green, amber, rose, violet, and slate for
   "None". A place starts with no colour (`electron/place-look.mjs:37-52`).
   Colours are names, never CSS (`electron/environments.cjs:6-7`,
   `electron/cloud-list.mjs:11-12`). The colour of a Cloud is on the Admin
   service: the owner or a team admin may change it, and a member sees it
   locked. This computer and hand-saved servers keep a local colour in
   `environments.json` (`localColor`). Workspaces keep theirs in
   `profiles.json`. A change goes to the Admin first and is saved here only
   when the Admin answers "saved" (`place-look.mjs:89-94`).
10. **The tint:** the sidebar head paints the colour of the place at 16 % (26 %
    on dark skins) down to 16 px below the glass top (`src/styles.css:2129-2138`).
11. **Hide the rail:** a button in the top row of the sidebar ("Hide your
    computers") and a switch in Settings. The choice is per desktop
    (`railHidden` in `desktop-prefs.json`). Main hides the rail only beside a
    document that offered the button. After a navigation, a crash or an
    error, it waits 5 s and shows the rail again if no offer came
    (`chrome-rail.mjs:24`, `:63`, `:91-97`, `:134-135`).
12. **Restart:** the place open at close is in `home-place.json` and opens
    again. A place that cannot open gives My Cloud (or This Mac) with no
    dialog, and the choice is forgotten for good
    (`electron/home-places.mjs:19-21`, `electron/start-place.mjs:19-38`).
13. **Simple and Advanced:** the mode changes only the border of a rail with
    no frame. Simple mode has a 0.5 px edge line, Advanced mode a hairline at
    50 % (`PlacesRail.tsx:418`, `:489`).

### 3.17 The banner picture

1. The window takes a PNG, JPEG or WebP file. It shrinks it to 1600 px on
   each side and encodes it as WebP (or JPEG) under 400 KB, with qualities
   from 0.86 down to 0.5 (`src/lib/place-banner.ts:8-12`, `:48-78`).
2. `PUT /api/workspace/banner` needs an admin. `GET` needs any signed-in
   client (`server/request-auth.ts:493-494`).
3. The server trusts nothing. It checks the type by its first bytes, the
   size, the sides and that the picture is still. It removes metadata by the
   structure of the container: PNG keeps a fixed chunk list, JPEG drops
   APP1 to APP15 except APP14 and COM, WebP keeps only VP8X, VP8, VP8L and
   ALPH. EXIF (with GPS), XMP, ICC, text and trailing bytes go
   (`server/workspace-banner.ts:36-135`, `:151-163`).
4. A bad file gets a typed refusal with a sentence: 415 for the type, 413 for
   the size, 422 for the sides, an animation or damage. The old banner stays
   (`server/routes/workspace-banner.ts:45`, `:84-88`).
5. The picture is stored as an attachment. `DATA_DIR/workspace-banner.json`
   names it (`routes/workspace-banner.ts:33-41`). The page sees only a
   version, the first 16 characters of a hash of the name (`:17-22`).
6. `GET` serves it with `private, no-cache`, an ETag, `nosniff` and
   `default-src 'none'` (`routes/workspace-banner.ts:74-79`).
7. The sidebar shows it at opacity 0.3 (0.26 and darker on dark skins), with
   a 1.5 px blur and a fade mask. Reduced transparency or forced colours hide
   it, and the tint shows (`src/styles.css:2145-2174`).
8. **Error path, failed read:** `current()` caches null on a read error. The
   next PUT then does not remove the old picture and writes over the record
   (`server/workspace-banner.ts:177-181`, `routes/workspace-banner.ts:89-93`).
9. **Error path, write order:** the new picture is saved before the record.
   If the record write fails, the picture is an orphan and the answer is not
   a typed refusal (`routes/workspace-banner.ts:90-92`).

## 4. The data

### 4.1 Stored in the window (per browser, per device)

| Key | Where | Value | Source |
|---|---|---|---|
| `omb-skin` | `localStorage` | a skin id or `system` | `src/lib/skins.ts:39` |
| `omb-theme` | `localStorage` | `{id, theme}`, the cache of the worn theme | `src/lib/theme/runtime.ts:10` |
| `omb-safe-look` | `sessionStorage` | `"1"` in a safe-look window | `runtime.ts:11` |
| `omb-advanced-mode` | `localStorage` | `"1"` Advanced, `"0"` Simple | `src/lib/interface-mode.ts:7` |
| `omb-new-look`, `omb-advanced-back` | `localStorage` | migration marks of v0.1.151 and v0.1.152 | `src/lib/new-look.ts:13`, `:21` |
| `omb-side-panel-open` | `localStorage` | `computer` or `inspector` | `src/hooks/use-remembered-side-panel.ts:7` |
| `openmausbot.sidebarShowAllThreads.v1` | `localStorage` | bot ids, 100 at most | `src/lib/sidebar-preferences.ts:461-507` |
| `openmausbot.pinnedCircleOrder.v1` | `localStorage` | the order of pinned bot tiles | `sidebar-preferences.ts:20`, `:302-303` |
| `openmausbot.lastBotSection.v1` | `localStorage` | the last section of bot settings | `src/lib/last-bot-section.ts:3-39` |
| Sidebar width | `localStorage`, one key for each mode | an integer from 240 to 480 | `sidebar-preferences.ts:12-13`, `:171-195` |

The font and the chat width are attributes on `<html>` (`data-font`,
`data-chat-width`) from settings of the window (`src/styles.css:221-247`,
`:1413-1435`).

### 4.2 Stored on the server

| File | Content | Source |
|---|---|---|
| `<dataDir>/themes/<person>/<id>/theme.json` | one theme file | `server/themes/store.ts:133` |
| `<dataDir>/themes/<person>/<id>/assets/<file>` | pictures and fonts of the theme | `store.ts:147` |
| `<dataDir>/themes/<person>/active.json` | the worn theme and skin | `store.ts:227` |
| `<dataDir>/themes/<person>/history.json` | `{entries: [...]}`, 30 at most | `server/themes/history.ts:50` |
| `DATA_DIR/workspace-banner.json` | the name of the banner attachment | `server/routes/workspace-banner.ts:33` |
| `DATA_DIR/attachments/<name>` | the banner picture | `routes/workspace-banner.ts:38` |

- A person key that is not plain becomes `h_<sha256>` (`store.ts:19`).
- Each theme write is a temp file, `fsync` and a rename (`server/atomic.ts:57-81`).
  The banner record is a temp file and a rename with no `fsync`
  (`server/workspace-banner.ts:186-188`).
- The window preferences (the mode included) are in a memory map on the
  server, not on disk (`server/routes/app-settings.ts:29`).

### 4.3 The theme file

`shared/theme.ts:59-74`, a strict zod schema:

| Field | Rule |
|---|---|
| `name` | 60 characters at most |
| `skin` | a built-in skin id, optional |
| `canvas`, `accent` | hex colours |
| `colors` | up to 31 roles of `THEME_COLOR_ROLES`. A value may not contain `url`, `image`, `src` or `attr` (`:52-54`) |
| `light`, `dark` | the same colour fields for one mode |
| `font` | a list of font names |
| `css` | 100,000 characters at most |

Limits (`shared/theme.ts:13-19`): 10 MB for each file, 40 MB for each theme,
40 files for each theme, 50 themes for each person. A theme id matches
`^[a-z0-9][a-z0-9-]{0,47}$`. A file name matches
`^[a-z0-9][a-z0-9_-]{0,79}\.(png|jpe?g|webp|gif|avif|svg|woff2?|ttf|otf)$`,
and its first bytes must match the extension (`shared/theme.ts:21-22`,
`server/themes/store.ts:66-86`). An SVG is checked only by its opening tag
(`store.ts:80-83`).

### 4.4 One entry of the look history

`server/themes/history.ts:15-33`:

- `seq`: a number that grows by one,
- `at`: the time as ISO text,
- `change`: what changed, for example a theme worn, an edit, `undid`,
- `before`, `after`: a look, `{id: string | null, skin?}`,
- `themes`: for each theme written, `{file: ThemeFile | null, assets:
  string[]}`. `file: null` means "the theme did not exist yet".

### 4.5 The places of the rail

The list that main sends to the rail page (`electron/cloud-rail.mjs`, types
in `cloud-rail.d.mts`): an id, a name, a kind (local, cloud, team, server),
a colour name, a group (the account), the flags `opens`, `pairs`,
`removable`, `paint`, `together`, and the states `settling`, `waiting`,
`progress`, `attention`, `ended`, `offline`, `update`. It never holds an
address, a Cloud id or an account id (`cloud-rail.mjs:6-10`, `:151`). The
type file lacks `together` (`cloud-rail.d.mts:101`).

The files of main:

| File | Content | Source |
|---|---|---|
| `userData/environments.json` | saved places and `localColor` | `electron/main.mjs:1493-1495` and `desktop-shell.md` |
| `<data>-profiles/profiles.json` | `{v: 1, profiles: [{id, name, color, createdAt}]}` | `electron/local-profiles.mjs:20-31` |
| `home-place.json` | `{team}`, `{cloud}`, `{profile}` or `{server}` | `electron/home-places.mjs:19-21` |
| `account-places.json` | the kept places of each waiting account | `electron/account-places.mjs:41-44` |
| `desktop-prefs.json` | `railHidden` and the window frame | `electron/desktop-prefs.mjs:152-156` |

### 4.6 The skins

13 skins: midnight, atelier, foundry, lagoon, graphite, linen, dusk, daylight,
meadow, pop, halloween, diwali, aurora (`src/styles.css:285` to `:1092`,
`src/lib/skins.ts:16-30`). Each one declares the same tokens:

- surfaces: `app`, `panel`, `frame`, `raised`, `raised-hover`, `composer`,
  `composer-ring`, `menu`, `menu-hover`, `menu-active`, `card`, `inset`,
  `control`, `hairline`, `edge`,
- ink: `ink`, `ink-secondary`, `ink-tertiary`,
- accent: `accent`, `accent-border`, `accent-text`, `focus`, `accent-ink`,
- status: `success`, `danger`, `warning` and their ink colours,
- `bubble-user` and its ink, `scrollbar`, the mascot line,
- `--font-sans`, `--tracking-ui`, `--code-color-scheme` (light or dark),
- radii `xs` to `4xl`,
- twelve identity colours `--identity-*` for bots.

The radius scale of Midnight and Daylight is 2, 4, 6, 8, 12, 16, 16 and
18 px (`src/styles.css:326-333`). Other skins change `lg` and `xl` from 4/8
(Foundry) to 12/18 (Pop). The default tokens in `@theme` are the Midnight
values, so the app is never without style (`src/styles.css:84-104`).

## 5. The UI

### 5.1 Settings, Appearance

- The skin picker: one live miniature for each skin. A pick takes off a
  custom theme (`src/components/SkinPicker.tsx:93`).
- The "Theme" row: System, Light, Dark (`src/components/ThemeRow.tsx:32`).
- Selects for the font and the chat width
  (`src/components/AppearanceSelectRows.tsx`).
- "Your themes": a list with Edit, Use or Stop using, an editor with Name,
  Background, Accent, Custom CSS, Duplicate, Export, Delete, Cancel and Save,
  Import and New theme, "Recent changes" with Restore, "Reset look"
  (`src/components/CustomThemesSettings.tsx:50-121`, `:176-208`). The export
  file name and one import error carry the name of the reference product
  (`CustomThemesSettings.tsx:75`).
- The rail switch: in General in Simple mode, in Appearance in Advanced mode.

### 5.2 The mode

- The "Advanced mode" switch at the foot of the Settings page list
  (`SettingsNav.tsx:245-259`).
- The one-time popup about Simple mode (`SimpleModePrompt.tsx`). Its doc
  comment says "Settings → General", but the switch is at the foot of the
  Settings list (`SimpleModePrompt.tsx:17`).
- The look notice (`NewLookNotice.tsx`) is about the move to Simple mode, not
  about skins. Done, ×, Escape or a click outside closes it for good
  (`NewLookNotice.tsx:16-27`).
- Simple mode and Advanced mode differ in many places. Examples: the bot
  settings are a tabbed panel in Simple mode and a dialog of 12 sections in
  Advanced mode (`BotSettingsDialog.tsx:54-55`). The + menu of the composer
  has 3 rows in Simple mode and 7 in Advanced mode
  (`Composer.simple.test.ts:131`, `Composer.advanced.test.ts:147`). The
  Simple header is 48 px with no band, the Advanced header is 42 px with a
  band (`src/styles.css:3957-3958`). About 199 files read the mode.

### 5.3 The chat frame

- The chat column is at most 60 rem wide (80 rem "wide", 100 % "full").
  Bubbles are at most 35 rem or 80 % (`src/styles.css:221-247`).
- With thread tabs, from 768 px, the sidebar and the header band are one
  frame in the panel colour, and the chat is a card with round top corners
  (`src/styles.css:3925-3961`).
- Each header control is 32 px tall (`src/styles.css:3959-3961`).
- Buttons are 32, 28, 24 or 36 px. A pill is 28 px, a chip 22 px, a menu row
  30 px. All use weight 500 (`src/styles.css:1455-1594`). In Midnight and
  Daylight the primary button is a neutral ink pill, and the other skins use
  the accent fill (`src/styles.css:1172-1191`).

### 5.4 The command palette

A dialog with a search field. The rows are grouped: bots, group chats, the
command "Toggle light/dark", messages. An empty query shows bots, group chats
and the command. There is no error state for a failed search
(`CommandPalette.tsx:69-103`, `:79`).

### 5.5 The rail

- The accessible name of the strip is "Where your bots live".
- ＋ says "Add a place for your bots" when a local workspace can be added,
  else "Add a Cloud or your own server".
- The tooltip of a tile names its state: "opens once {bot} finishes",
  "needs you", offline, last seen, ended.
- The active tile has a bar of 3 px at the edge, 16 px tall (8 px on hover),
  and `aria-current="page"`.
- Rename: a field of 80 characters, but main cuts the name to 40 with no
  message (`PlacesRail.tsx:309`, `local-profiles.mjs:21`, `:29`).
- At 20 workspaces, main refuses with `full`, and the rail shows "That didn't
  work. Try again in a moment." with no reason (`local-profiles.mjs:85`,
  `:217`).
- The words are in `src/locales/en.json:803-913`.

### 5.6 Right-to-left

The text of each line and block follows its own script. Code stays
left-to-right. Some chrome parts do not flip in a right-to-left document,
because they use physical properties:

- three header chevrons with `-ml-*` and `ChevronRight`
  (`ChatView.tsx:974`, `ChatHeadPill.tsx:95`, `RoomHeader.tsx:185`),
- `text-left` in the shared menu rows (`menu-recipe.ts:3`, `:10`, `:14`) and
  in `.ui-menu-row` (`src/styles.css:1588`),
- the side panel at `right-0` with `border-l` (`side-panel.ts:13-15`),
- the Settings switch knob, the Settings rail border, the row dividers, the
  thread tab indicator, the progress fill, `panel-in` and the run-log reveal
  (`src/styles.css:1876`, `:1884`, `:1924`, `:1937`, `:1986`, `:2309`,
  `:2498`, `:3851`, `:3965-3971`).

The guard for `<Select>` allows `ml-` and `mr-` but not `ms-` and `me-`
(`Select.guard.test.ts:42`). Thus the guard pushes code away from the rule.

## 6. The tests

| Test | What it proves |
|---|---|
| `scripts/check-skin-contrast.mjs` (`pnpm check:contrast`, CI `.github/workflows/ci.yml:108`) | Text 4.5:1 on 9 surfaces of each skin, the focus ring 3:1, surface steps 1.03 to 1.06, frame equal to panel, the inverted bubbles 4.5:1, also the phone variants. Two known Midnight baselines (3.65 and 3.10) (`:147-203`) |
| `src/lib/skins.test.ts`, `skins.default.test.ts` | The skin list, the default "system", Midnight for a prior install |
| `src/lib/control-scale.test.ts` | Button heights 32, 28 and 24 px, the pill, the chip, the code chip and the menu row, no hex colour in those rules. It reads only the first matching rule, so the Midnight and Daylight overrides and Pop are not covered (`:15-21`) |
| `src/components/touch-actions.test.ts` | Each `group-hover:` reveal has a `touch:` twin and a focus twin. 18 exemptions with reasons, and no stale exemption |
| `src/components/Select.guard.test.ts` | No native `<select>`, and only layout classes on `<Select>` |
| `src/components/chat-dir-auto.test.ts` | `dir="auto"` within 280 characters before 12 markers (inputs, the find bar, pinned message text). A text check, not a render check. The main composer is not in its list |
| `src/lib/copy-text.guard.test.ts` | Each clipboard write goes through `copyText` |
| `src/locales/vocabulary.test.ts`, `everyday-words.test.ts`, `words.test.ts`, `welcome-words.test.ts` | Retired and internal words, "Organization", no em dash in the welcome, copy names a control as its label |
| `scripts/testing/file-size-ratchet.test.ts` | A listed file over 1,000 lines can only shrink. Cap 2,000 lines |
| `src/lib/menu-keys.test.ts`, `MenuMotion.test.ts`, `mascot-motion.test.ts` | Type-ahead, a closing menu stays 200 ms inert, or closes at once with reduced motion, a mascot holds still at strength 0 |
| `shared/theme.test.ts`, `server/themes/store.test.ts`, `routes.test.ts`, `tool.test.ts` | The schema, CSS with no internet, paths and links refused, history and `undo_theme`, HEIC refused, a forged attachment tag cannot open `config.json`, the serve headers |
| `server/themes.tool.e2e.test.ts`, `server/themes.ui.e2e.test.ts` | A real server: a bot writes a theme, the reset key clears the server theme (`:67-69`), `?safe-look` keeps the server state (`:71-77`), the chat backdrop stops under reduced motion (`:139-142`) |
| `src/lib/theme/theme-css.dom.test.ts`, `theme-css.chromium.test.ts` | Loads are removed from the parsed rules, in real Chromium no request leaves (`:81-84`) |
| `src/lib/theme/runtime.dom.test.ts`, `palette.test.ts`, `hooks.test.ts` | The merge order, the light and dark blocks, the veil over a picture |
| `src/components/CommandPalette.theme.dom.test.ts`, `src/rail.theme.test.ts`, `ChromeRail.skin.test.ts` | The palette toggle, the rail page wears the theme, the rail follows the skin |
| `src/lib/interface-mode.test.ts`, `new-look.test.ts`, `simple-mode-prompt.test.ts`, `SimpleModePrompt.test.ts` | The default by prior run, the migrations of v0.1.151 and v0.1.152, that the deleted settings stay deleted (`new-look.test.ts:160-168`) |
| `ChatView.simple-only.test.ts`, `Composer.simple.test.ts`, `Composer.advanced.test.ts`, `BotSettingsDialog.simple.test.ts` | What each mode shows. The `SIMPLE_ONLY` path is tested with a mock, but it never runs in the shipped build |
| `CommandPalette.ime.test.ts`, `palette-rank.test.ts` | The IME rule, prefix before substring |
| `side-panel.dom.test.ts`, `use-remembered-side-panel.dom.test.ts` | The slide out, what is remembered and where |
| `PinnedMessagesMenu.dom.test.ts`, `BotThreads.test.ts`, `SidebarTiles.test.ts`, `PanelShell.dom.test.ts`, `page-registry.test.ts`, `panel-link.test.ts` | One pin, the tree, the tiles, the panel shell and links |
| `PlacesRail.test.ts`, `PlacesRail.frame.test.ts`, `scripts/testing/rail-profile-ui.e2e.test.ts` | 8 tiles and ⋯, the pending mark, the switch waits for a turn, the place after a restart (`:323-375`), more than eight (`:376-391`) |
| `electron/cloud-rail.node-test.mjs`, `chrome-rail.node-test.mjs`, `rail-accounts.node-test.mjs`, `place-look.node-test.mjs` | Only the rail reads the list, ids only from the list, the hide rule with the 5 s grace, colour ownership |
| `src/lib/place-banner.test.ts`, `server/workspace-banner.test.ts`, `workspace-banner.e2e.test.ts`, `routes/workspace-banner.test.ts` | The re-encode, metadata removed from PNG, JPEG and WebP fixtures, admin only for PUT and DELETE, typed refusals |
| Manual: `docs/verification/bidi.md` with `scripts/verify-bidi.ts`, `docs/verification/cloud-rail.md` with `scripts/verify-cloud-rail.ts` | Right-to-left blocks, tables and code, the rail in each mode and skin. No assertions |

## 7. Ours compared

Our window is `crates/bot-desktop/ui` (React, Astryx and StyleX, decision
D13). Its layout follows decision D16. All data in it is mock data today.

| Topic | The reference | Ours now | Where it goes |
|---|---|---|---|
| Three places | Sidebar, chat, bot panel. No new places, header buttons or badges (`DESIGN.md:39-72`) | Sidebar, chat and a Settings dialog (D16). No bot panel yet | `bot-desktop`, `ui/src/features/` |
| Sidebar width | 280 px, 240 to 480 by drag, one width for each mode (`DESIGN.md:195`, `sidebar-preferences.ts:171-175`) | 320 px, fixed (`features/sidebar/Sidebar.tsx:150`, D16) | `features/sidebar/Sidebar.tsx` |
| Colour tokens | 13 skins as `[data-skin]` blocks of custom properties, `system` follows the OS (`src/styles.css`, `src/lib/skins.ts:32-40`) | One Astryx theme (`themes/brand.ts`, built to `themes/built/`) and five backdrops, each with a fixed colour mode (`features/backdrop/backdrops.ts`, `docs/backgrounds.md`). The choice is React state, not stored (`app/App.tsx:18`) | `ui/src/themes/`, `features/backdrop/` |
| Contrast check | A script in CI for each skin (`scripts/check-skin-contrast.mjs`) | None | a test in `ui/` |
| Themes from a bot | Stored for each person, CSS checked in two places, a history of 30 looks | None. `docs/plan/app-settings.md` keeps themes for later | `bot-core` (the store and the history), `bot-desktop` (the runtime), `bot-engine` (the tool) |
| Content security policy | Theme CSS as an adopted stylesheet, colours as inline custom properties on `<html>` (`theme-css.ts:74-81`, `runtime.ts:81-86`) | `default-src 'self'; style-src 'self'` (`crates/bot-desktop/tauri.conf.json:28`). D13 says a `<style>` added at run time is blocked | `tauri.conf.json` |
| Simple and Advanced mode | One value per browser in `localStorage`, about 199 files read it | No mode | a decision first |
| Command palette | Cmd/Ctrl+K: bots, group chats, one command, messages | None | `features/palette/` |
| Side panels | 320 px (Simple) or `min(420px, 42vw)`, beside or floating, breakpoints at 768, 920, 1040, 1280 and 1536 px | None. Settings is a dialog | `features/` |
| Floating chat header | No band in Simple mode, the transcript fades in over 60 px | `features/chat/ChatHeader.tsx` with the bot pill and the model selector (D16) | `features/chat/` |
| Right-to-left text | Per line and per block, code left-to-right, the chrome always left-to-right | Not handled | `features/chat/` |
| Reduced motion | The OS query stops all motion, plus a partial app attribute | Not handled in our code. Astryx has a motion tempo token (`themes/built/brand.css:173`) | `ui/src/global.css` |
| Rail of places | A 36 px Electron view, 8 tiles, colours, banner | None. We have one place | later, with [P669](../../plan/remote-bots.md) and [P551](../../plan/environments-and-flags.md) |
| Banner picture | Per workspace, metadata removed on the server | The backdrop gradient fades into the top of the sidebar (D16). No upload | later |
| Undo | One server route for applied changes, plus a client toast | None | `bot-core`, with P291 |

The reference files and our modules:

- `DESIGN.md`, `src/styles.css`, `src/lib/skins.ts`, `scripts/check-skin-contrast.mjs`
  → `crates/bot-desktop/ui/src/themes/`, `ui/src/global.css`, a new
  `ui/src/features/look/`.
- `shared/theme.ts`, `server/themes/*.ts` → `bot-core` (a `look` module with
  tables in the SQLite store of step 8) and `bot-protocol` (the theme type).
- `src/lib/theme/*.ts`, `CustomThemesSettings.tsx`, `SkinPicker.tsx` →
  `ui/src/features/look/`.
- `src/lib/interface-mode.ts`, `src/lib/new-look.ts` → a setting in the
  settings file of step 6, if T2 keeps two modes.
- `src/components/CommandPalette.tsx`, `src/lib/palette-rank.ts` →
  `ui/src/features/palette/`.
- `src/components/ChatMarkdown.tsx` (direction), `src/styles.css:1233-1243`
  → `ui/src/features/chat/`.
- `electron/chrome-rail.mjs`, `electron/cloud-rail.mjs`, `src/components/PlacesRail.tsx`
  → `bot-desktop` (a second Tauri webview and its commands) and
  `ui/src/features/rail/`, later.
- `server/workspace-banner.ts` → `bot-core` attachments, later.

## 8. Where we can be better

The proposals are numbered T1, T2, … The main session gives the P numbers.
"Follows the reference" means we copy the reference. "Better than the
reference" starts with the problem it avoids.

**T1. Theme CSS cannot reach the cards that ask the person (better than the
reference, before any theme step).**
- Problem in the reference: a theme may restyle any element. The checks
  block only loads (`shared/theme.ts:191-202`). The theme guide gives
  `[data-look="approval-card"]` and `[data-look="ask-card"]` as stable hooks
  (`shared/theme.ts:231-232`). The theme change needs no approval, because
  its tier is "safe" (`server/themes/tool.ts:77`,
  `server/app-settings/host.ts:144-150`). So a bot that a prompt injection
  controls can hide the Deny button of an approval card, or relabel it with
  `content:`, in one tool call. The only guards are the check that the person
  started the turn (`host.ts:206-207`) and one sentence in the tool
  description. This is the release problem "A secret or an access right in
  the wrong place" (section 5). No release note names this case. The lead
  found it by reading the code and did not reproduce it.
- Options: (a) theme CSS applies with `@scope (body) to ([data-trusted])`,
  and the approval and question cards carry `data-trusted`. (b) the cards
  render in a shadow root that theme CSS cannot select. (c) themes have
  tokens only and no free CSS.
- Why: a look must never change what the person allows.

**T2. Decide if we have two modes. If yes, a switch never deletes a setting
(better than the reference, a decision before the first mode-gated UI).**
- Problem in the reference: the mode changed three times: Simple by default
  in v0.1.94 (`b9ab44b97`), Simple as the only mode in v0.1.151
  (`1de1164d5`), Advanced back in v0.1.152 (`6f83379a8`). The v0.1.151 start
  deleted eight settings of the person (`src/lib/new-look.ts:17-18`, `:53`),
  and v0.1.152 did not bring them back. A test pins that loss
  (`src/lib/new-look.test.ts:160-168`). This breaks its own rule
  (`DESIGN.md:394`). The release problem: "A feature added, then removed or
  reversed" (section 6, "The UI mode").
- What: (a) one level only, as our window is now. (b) two modes. Then the
  mode is one field in the settings of step 6, not one value per browser. A
  setting that only Advanced mode shows stays stored when the mode changes.
  The UI gates by the mode in one place, not in 199 files.
- Why: each reversal of the reference left dead code (`SIMPLE_ONLY` in 8
  files) and lost data.

**T3. One change of the look is one transaction (better than the reference,
with the store of step 8).**
- Problem in the reference: a change writes the theme file, then
  `active.json`, then `history.json`, as three files
  (`server/themes/store.ts:178-184`). A crash between them leaves a change
  with no history entry, so it cannot be undone. The release problem: "State
  lost at a restart or a crash" (v0.1.24, v0.1.74, v0.1.107, v0.1.165).
- What: the themes, the worn look and the history are rows of the SQLite
  store. One transaction writes the change and its history row.
- Why: this is the rule of `AGENTS.md`: "Every state change in the runtime
  writes the row and its event in one transaction".

**T4. The Undo of a look change undoes only that change (better than the
reference, with T3).**
- Problem in the reference: the card keeps the newest history number before
  the change (`server/themes/tool.ts:79`), and a restore undoes every entry
  after it (`server/themes/history.ts:58`). The stale check compares only the
  name of the worn theme (`tool.ts:72-75`, `host.ts:268-269`). So an Undo on
  an old card also undoes a later edit of the same theme, with no warning.
  The release problem: none. This is a judgment call.
- What: the stale check compares the whole look and the theme rows that the
  change wrote. A later change makes the card stale.

**T5. Skins follow the reference: token blocks, a default that follows the
system, a contrast test (follows the reference, a change of D16).**
- The reference: 13 skins as `[data-skin]` blocks (`src/styles.css:285` to
  `:1092`), `system` follows the OS (`src/lib/skins.ts:32-40`), and a CI
  script checks text 4.5:1 and focus 3:1 (`scripts/check-skin-contrast.mjs:147-203`).
- Ours: five backdrops, each with a fixed colour mode (`docs/backgrounds.md`),
  and a choice that is not stored (`app/App.tsx:18`).
- What: keep the Astryx theme as the token source, add a `data-skin` set of
  token overrides (start with Midnight and Daylight, the two reference
  skins, `DESIGN.md:107-109`), store the choice with the window settings, and
  add a contrast test. The backdrop picture stays as the picture of a skin.
- Also: the sidebar is 280 px in the reference (`DESIGN.md:195`) and 320 px in
  D16 (`features/sidebar/Sidebar.tsx:150`). The author decides if we follow
  the reference.

**T6. A reset of the look stays reset (better than the reference, with the
theme step).**
- Problem in the reference: the reset key and "Stop using" do not read the
  answer of the server (`src/lib/theme/runtime.ts:144-153`, `:162-167`).
  When the write fails, the next start wears the broken theme again
  (`runtime.ts:125-135`, `src/main.tsx:86`). The release problem: none. This
  is a judgment call.
- What: the safe look stays on until the server confirms the reset, and the
  window says when the reset did not reach the server.

**T7. The history keeps what a restore needs (better than the reference,
with T3).**
- Problem in the reference: a snapshot keeps the names of pictures, not their
  bytes (`server/themes/history.ts:18-20`). A delete removes the pictures at
  once (`store.ts:264`). So a restore gives a theme with missing pictures
  (`store.ts:210-213`). A delete of a theme that is not worn records nothing
  (`store.ts:261-265`). The release problem: none. This is a judgment call.
- What: a deleted theme and its files stay until the last history row that
  names them is gone, and a delete is a history row.

**T8. One reduced-motion setting stops all motion (better than the
reference, with the first animation).**
- Problem in the reference: the system setting stops all motion with one rule
  (`src/styles.css:3110-3124`). The app attribute covers only a list of
  classes (`src/styles.css:2627-2642`). The mascot hook reads only the system
  setting (`src/components/mascot-clock.ts:161-173`). The release problem:
  none. This is a judgment call.
- What: one source (the system setting, or our setting when the person sets
  it) and one rule in `global.css`.

**T9. Right-to-left text follows the reference, and a check guards the
logical properties (follows the reference, with a check that the reference
lacks).**
- The reference: per-line `unicode-bidi: plaintext` (`src/styles.css:1233-1243`),
  per-block direction by the script with more words
  (`src/components/ChatMarkdown.tsx:156-201`), code left-to-right and
  isolated (`ChatMarkdown.tsx:759`), `dir="auto"` on inputs.
- Problem in the reference: the rule of logical properties
  (`DESIGN.md:230-232`) has no check. Physical margins stay in the header
  (`ChatView.tsx:974`, `ChatHeadPill.tsx:95`, `RoomHeader.tsx:185`), and the
  `<Select>` guard allows `ml-` but refuses `ms-` (`Select.guard.test.ts:42`).
  The release problem: none. This is a judgment call.
- What: a lint rule on our StyleX that refuses `left`, `right`,
  `marginLeft`, `paddingRight` and the like.

**T10. The command palette follows the reference, and shows a failed search
(follows the reference, a later window step).**
- The reference: Cmd/Ctrl+K, prefix before substring, the IME rule
  (`CommandPalette.tsx:24-28`, `palette-rank.ts:1-12`, `send-key.ts:22-24`).
- Problem in the reference: a failed search shows no hits and no message
  (`CommandPalette.tsx:79`). The release problem: none. This is a judgment
  call.

**T11. The rail follows the reference when we have more than one place
(follows the reference, later, after P669 and P551).**
- Keep: the list never holds an address or a Cloud id
  (`electron/cloud-rail.mjs:6-10`), each action names an id from the list
  (`:199-248`), at most 8 tiles (`PlacesRail.tsx:30`), colours as names
  (`electron/environments.cjs:6-7`), the hidden rail comes back beside a page
  that does not offer the button (`chrome-rail.mjs:91-97`).
- Problem in the reference: the remembered start place is forgotten after one
  failed open (`electron/start-place.mjs:25-26`). A short outage loses the
  choice of the person. The release problem: "State lost at a restart or a
  crash". We keep the choice and say that the place did not answer.

**T12. The banner follows the reference (follows the reference, later).**
- Keep: the server removes metadata by the structure of the container and
  trusts no upload (`server/workspace-banner.ts:36-135`), typed refusals
  (`routes/workspace-banner.ts:45`), the serve headers (`:74-79`).
- Problem in the reference: the picture is saved before its record, and a
  failed record write leaves an orphan with an untyped error
  (`routes/workspace-banner.ts:90-92`). In our store, the record and the
  attachment row go in one transaction.

### New facts for open proposals

- **P664** (a desktop file that cannot be read is never written over). More
  files of the reference do the same:
  - `history.json` of the themes: a failed read gives `[]`, and the next
    append writes over all the history (`server/themes/history.ts:37-51`),
  - a damaged `theme.json` is treated as new and written over
    (`server/themes/store.ts:95-103`, `:177-182`),
  - `account-places.json` gives `{}`, and the next `put` drops the other
    accounts (`electron/account-places.mjs:41-44`),
  - the banner record caches null after a failed read
    (`server/workspace-banner.ts:177-181`),
  - `home-place.json` (`electron/home-places.mjs:44-47`).
  `profiles.json` is already in `environments-and-flags.md` section 3.16.
- **P291** (the Undo record is stored with its card). The theme card uses the
  same memory map (`server/app-settings/host.ts:88`, `:149`). The client
  Undo of a theme delete (`CustomThemesSettings.tsx:164-172`) and of a
  hidden thread (`UndoToast.tsx:7-17`) are in React state only.
- **P296** (window preferences). The mode is a window preference. The server
  keeps all of them in a memory map (`server/routes/app-settings.ts:29`) and
  pushes a change to every admin window (`:47`). Two windows in two modes
  disagree, and the last report wins (`:35-37`).

### The problems of changelog.md section 5 in this feature

| Problem | In this feature | Proposal |
|---|---|---|
| A feature added, then removed or reversed | Yes. The UI mode (v0.1.94, v0.1.151, v0.1.152) lost eight settings (`src/lib/new-look.ts:17-18`, `:53`). The Today page (v0.1.120 to v0.1.123) left the route `/api/today` (`server/index.ts:12035`). The quote chip lasted one release (v0.1.111 to v0.1.112) | T2 |
| A secret or an access right in the wrong place | Yes, found by reading the code. Theme CSS can hide or relabel approval cards (`shared/theme.ts:191-202`, `:232`). Remote loads are blocked in two places. CSS may still request theme files of this server from attribute selectors, and nobody checked if a bot can see those requests | T1 |
| A file written over after a failed read | Yes. `history.json`, `theme.json`, `profiles.json`, `account-places.json`, the banner record, `environments.json` | P664 |
| State lost at a restart or a crash | Yes. The three writes of a look change (`store.ts:178-184`). The card Undo (`host.ts:88`). The window preferences on the server (`server/routes/app-settings.ts:29`). The blank New thread chat (`new-chat.ts:5`). The start place after one failed open (`start-place.mjs:25-26`). The remembered panel is global, not per bot | T3, P291, P296, T11 |
| The updater loops, sticks or breaks the window | No. The blank window of v0.1.137 came from a removed preload function, not from a skin or a theme (`03065106b`) | none |

## 9. Not verified

- The behaviour of our content security policy (`style-src 'self'`) with an
  adopted stylesheet and with custom properties set from script on `<html>`.
  T1 and T5 depend on it.
- If a bot can observe requests that theme CSS makes to theme files of the
  same server (a side channel from attribute selectors).
- If an approval shows anywhere outside the themed page, for example in a
  native dialog. That would make T1 less severe.
- A flash of the wrong skin at start on macOS and Linux. Nobody ran the app.
- The rules of `themeValueLoads` in `shared/theme.ts`, beyond the parts that
  the readers quoted.
- If `ChatMarkdown.test.ts` and `ChatView.controls.test.ts` cover the cases
  that `docs/verification/bidi.md:51-57` lists. They were not read.
- Where each root attribute (`data-skin`, `data-font`, `data-chat-width`,
  `data-reduced-motion`, `data-chat-tabs-frame`) is set, other than
  `data-skin`.
- The 15 px chat font size: a comment says it (`src/styles.css:1245`), but no
  rule that was read sets it.
- If a switch to a Cloud or a hand-saved server waits for a running turn on
  this computer. The end-to-end test shows the wait only between local
  workspaces.
- How `clean.open` and `leave` stop a server with a running turn
  (`electron/clean-workspace.mjs` was only searched).
- An indirect path where the "hurry" branch cuts a running turn with no
  warning (click a waiting tile, then the place on screen, then the waiting
  tile again, `electron/local-profiles.mjs:155-177`). Found by reading the
  code. No test covers it.
- If the leftovers sweep removes an orphan banner picture
  (`server/index.ts:11953`).
- The release notes of v0.1.94 (the release card history starts at
  v0.1.151) and the reason for the revert of the quote chip (`0f1d6176e`).
- The order of `/api/search` results on the server.
- No test of the reference was run. Each fact comes from reading the source
  at commit `95f3c9f16`.
