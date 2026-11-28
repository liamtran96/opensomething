# Plan: The look and design

The proposals from the research file
[`../research/features/look-and-design.md`](../research/features/look-and-design.md)
(batch 13, reference commit `95f3c9f16`). The steps, the pull requests and
the order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** P691 goes to step 8, and P690 (option b) adds a field to step
  6. P693 goes to a window step after step 1. P692, P694 and P695 go to a
  theme step after step 8 and the `app_settings` tool. P696 goes with the
  first animation in `bot-desktop`. P697 goes to the step that renders the
  Markdown of a bot. P698 is a later window step. P699 and P700 wait for
  P669 and P551.
- **State:** all open. Decide P689 and P690 first: they are new decisions,
  and each one changes what a later step may build.
- **The main finding:** a theme that a bot writes can restyle any element of
  the window, also the approval and question cards, and the change needs no
  approval (`shared/theme.ts:191-202`, `:231-232`,
  `server/themes/tool.ts:77`). The UI mode of the reference changed three
  times, and one change deleted eight settings of the person
  (`src/lib/new-look.ts:17-18`, `:53`).

## Proposals

Decide P689 and P690 first.

### P689. Theme CSS cannot reach the cards that ask the person (a new decision, before any theme step)

- Kind: a decision. Better than the reference.
- **Problem in the reference:** a theme may restyle any element. The checks
  block only loads (`shared/theme.ts:191-202`). The theme guide gives
  `[data-look="approval-card"]` and `[data-look="ask-card"]` as stable hooks
  (`shared/theme.ts:231-232`). The theme change needs no approval, because
  its tier is "safe" (`server/themes/tool.ts:77`,
  `server/app-settings/host.ts:144-150`). So a bot that a prompt injection
  controls can hide the Deny button of an approval card, or relabel it with
  `content:`, in one tool call. The only guards are the check that the
  person started the turn (`host.ts:206-207`) and one sentence in the tool
  description. This is the release problem "A secret or an access right in
  the wrong place" (`changelog.md` section 5). No release note names this
  case. The research agent found it by reading the code and did not
  reproduce it.
- Options:
  - (a) Theme CSS applies with `@scope (body) to ([data-trusted])`, and the
    approval and question cards carry `data-trusted`.
  - (b) The cards render in a shadow root that theme CSS cannot select.
  - (c) Themes have tokens only and no free CSS.
- Recommended: (a) or (b), because (c) drops a feature of the reference.
  The choice depends on how our CSP
  (`crates/bot-desktop/tauri.conf.json:28`, `style-src 'self'`) treats an
  adopted stylesheet. Not verified.
- Decision text if accepted: "Theme CSS never reaches the surfaces that ask
  the person." Also an open risk in D13: how the CSP
  `default-src 'self'; style-src 'self'` treats an adopted stylesheet and
  custom properties set from script. The reference uses both
  (`src/lib/theme/theme-css.ts:74-81`, `src/lib/theme/runtime.ts:81-86`).
- Why: a look must never change what the person allows.

### P690. Decide if we have two modes; if yes, a switch never deletes a setting (a new decision, before the first mode-gated UI)

- Kind: a decision. Better than the reference.
- **Problem in the reference:** the mode changed three times: Simple by
  default in v0.1.94 (`b9ab44b97`), Simple as the only mode in v0.1.151
  (`1de1164d5`), Advanced back in v0.1.152 (`6f83379a8`). The v0.1.151
  start deleted eight settings of the person (`src/lib/new-look.ts:17-18`,
  `:53`), and v0.1.152 did not bring them back. A test pins that loss
  (`src/lib/new-look.test.ts:160-168`). This breaks the rule of the
  reference itself (`DESIGN.md:394`). The release problem: "A feature
  added, then removed or reversed" (`changelog.md` section 6, "The UI
  mode").
- Options:
  - (a) One level only, as our window is now.
  - (b) Two modes. The mode is one field in the settings of step 6, not one
    value for each browser. A setting that only Advanced mode shows stays
    stored when the mode changes. The UI gates by the mode in one place,
    not in 199 files.
- Reference files: `src/lib/interface-mode.ts:7`, `:26-31`;
  `src/lib/new-look.ts:13-21`, `:40-56`; `src/lib/simple-only.ts:2`;
  `server/routes/app-settings.ts:29-48`;
  `server/app-settings/registry-window.ts:10-14`; `DESIGN.md:378-394`.
- Why: each reversal of the reference left dead code (`SIMPLE_ONLY` in 8
  files) and lost data.

### P691. One change of the look is one transaction (step 8)

- Kind: a change of a step. Better than the reference.
- **Problem in the reference:** a change writes the theme file, then
  `active.json`, then `history.json`, as three files
  (`server/themes/store.ts:178-184`). A crash between them leaves a change
  with no history entry, so it cannot be undone. The release problem:
  "State lost at a restart or a crash" (v0.1.24, v0.1.74, v0.1.107,
  v0.1.165).
- What: the themes, the worn look and the history are rows of the SQLite
  store. One transaction writes the change and its history row.
- Reference: `server/themes/store.ts:176-184`,
  `server/themes/history.ts:46-51`, `server/atomic.ts:57-81`.
- Why: the rule of `AGENTS.md`: "Every state change in the runtime writes
  the row and its event in one transaction".

### P692. The Undo of a look change undoes only that change (the theme step, with P691)

- Kind: a choice. Better than the reference. A judgment call: no release
  problem names it.
- **Problem in the reference:** the card keeps the newest history number
  before the change (`server/themes/tool.ts:79`), and a restore undoes each
  entry after it (`server/themes/history.ts:58`). The stale check compares
  only the name of the worn theme (`tool.ts:72-75`, `host.ts:268-269`). So
  an Undo on an old card also undoes a later edit of the same theme, with
  no warning.
- Options:
  - (a) The stale check compares the whole look and the theme rows that the
    change wrote. A later change makes the card stale (recommended).
  - (b) Keep the reference: Undo goes back to the history number.
- Reference: `server/themes/tool.ts:70-80`, `server/themes/history.ts:58`,
  `server/app-settings/host.ts:264-270`.

### P693. Skins as token sets, a default that follows the system, a contrast test (a window step after step 1, a change of D16)

- Kind: a change of D16. Option a follows the reference.
- The reference: 13 skins as `[data-skin]` blocks (`src/styles.css:285` to
  `:1092`), `system` follows the OS (`src/lib/skins.ts:32-40`), and a CI
  script checks text at 4.5:1 and focus at 3:1
  (`scripts/check-skin-contrast.mjs:147-203`).
- Ours: five backdrops, each with a fixed colour mode
  (`docs/backgrounds.md`,
  `crates/bot-desktop/ui/src/features/backdrop/backdrops.ts`), and a choice
  that is not stored (`crates/bot-desktop/ui/src/app/App.tsx:18`).
- Options:
  - (a) Follow the reference: keep the Astryx theme as the token source,
    add a `data-skin` set of token overrides (start with Midnight and
    Daylight, the two reference skins, `DESIGN.md:107-109`), default
    `system` (`src/lib/skins.ts:32-40`), store the choice with the window
    settings (`src/lib/skins.ts:39`), and add a contrast test. The backdrop
    picture stays as the picture of a skin.
  - (b) Keep our five backdrops with a fixed mode (D16). Then D16 says
    "Different from the reference: each backdrop fixes the colour mode",
    with its reason.
- The sidebar width: (a) 280 px as the reference (`DESIGN.md:195`,
  `src/lib/sidebar-preferences.ts:171-175`), or (b) keep 320 px
  (`crates/bot-desktop/ui/src/features/sidebar/Sidebar.tsx:150`, D16).
- Also a rule for D16: a contrast test for each token set
  (`scripts/check-skin-contrast.mjs:147-203`).

### P694. A reset of the look stays reset (the theme step)

- Kind: a choice. Better than the reference. A judgment call: no release
  problem names it.
- **Problem in the reference:** the reset key and "Stop using" do not read
  the answer of the server (`src/lib/theme/runtime.ts:144-153`,
  `:162-167`). When the write fails, the next start wears the broken theme
  again (`runtime.ts:125-135`, `src/main.tsx:86`).
- Options:
  - (a) The safe look stays on until the server confirms the reset, and the
    window says when the reset did not reach the server (recommended).
  - (b) Keep the reference.

### P695. The history keeps what a restore needs (the theme step, with P691)

- Kind: a choice. Better than the reference. A judgment call: no release
  problem names it.
- **Problem in the reference:** a snapshot keeps the names of pictures, not
  their bytes (`server/themes/history.ts:18-20`). A delete removes the
  pictures at once (`store.ts:264`). So a restore gives a theme with
  missing pictures (`store.ts:210-213`). A delete of a theme that is not
  worn records nothing (`store.ts:261-265`).
- Options:
  - (a) A deleted theme and its files stay until the last history row that
    names them is gone, and a delete is a history row (recommended).
  - (b) Keep the reference.
- Reference: `server/themes/history.ts:18-20`,
  `server/themes/store.ts:210-213`, `:261-265`,
  `server/themes/routes.ts:122-127`.

### P696. One reduced-motion setting stops all motion (with the first animation in `bot-desktop`)

- Kind: a choice. Better than the reference. A judgment call: no release
  problem names it.
- **Problem in the reference:** the system setting stops all motion with one
  rule (`src/styles.css:3110-3124`). The app attribute covers only a list
  of classes (`src/styles.css:2627-2642`). The mascot hook reads only the
  system setting (`src/components/mascot-clock.ts:161-173`).
- What: one source (the system setting, or our setting when the person sets
  it) and one rule in `global.css`.
- Reference: `src/styles.css:2627-2642`, `:3110-3124`,
  `src/components/MenuMotion.tsx:6-10`,
  `src/components/mascot-clock.ts:161-173`.

### P697. Right-to-left text as the reference, and a check for logical properties (the step that renders the Markdown of a bot)

- Kind: a choice. Follows the reference, with a check that the reference
  does not have. The check is a judgment call: no release problem names it.
- The reference: `unicode-bidi: plaintext` for each line
  (`src/styles.css:1233-1243`), the direction of each block by the script
  with more words (`src/components/ChatMarkdown.tsx:156-201`), code
  left-to-right and isolated (`ChatMarkdown.tsx:759`), and `dir="auto"` on
  inputs (`src/components/Composer.tsx:829`).
- **Problem in the reference:** the rule of logical properties
  (`DESIGN.md:230-232`) has no check. Physical margins stay in the header
  (`ChatView.tsx:974`, `ChatHeadPill.tsx:95`, `RoomHeader.tsx:185`), and
  the `<Select>` guard allows `ml-` but refuses `ms-`
  (`Select.guard.test.ts:42`).
- What: a lint rule on our StyleX that refuses `left`, `right`,
  `marginLeft`, `paddingRight` and the like. A D16 rule: the layout uses
  logical properties only, and a lint enforces it.
- Reference: `src/styles.css:1233-1243`,
  `src/components/ChatMarkdown.tsx:156-201`, `:299`, `:746`, `:759`,
  `:771-810`, `src/components/Composer.tsx:829`,
  `docs/verification/bidi.md:15-47`, `DESIGN.md:230-232`, `:416-417`,
  `src/components/menu-recipe.ts:3`, `:10`, `:14`, `src/lib/i18n.ts:16`,
  `:44-47`, `src/locales/index.ts:7-23`.

### P698. The command palette as the reference, with a message for a failed search (a later window step)

- Kind: a choice. Follows the reference, with one small change. The change
  is a judgment call: no release problem names it.
- The reference: Cmd/Ctrl+K, a prefix match before a substring match, and
  the IME rule (`src/components/CommandPalette.tsx:24-28`,
  `src/lib/palette-rank.ts:1-12`, `src/lib/send-key.ts:22-24`).
- **Problem in the reference:** a failed search shows no hits and no
  message (`CommandPalette.tsx:79`).
- Reference: `src/components/CommandPalette.tsx:24-28`, `:41-46`,
  `:69-103`, `:79`, `:126`.

### P699. The places rail as the reference; keep the start place after a failed open (later, after P669 and P551)

- Kind: a choice. Follows the reference, with one change.
- Keep: the list never holds an address or a Cloud id
  (`electron/cloud-rail.mjs:6-10`), each action names an id from the list
  (`:199-248`), at most 8 tiles (`src/components/PlacesRail.tsx:30`),
  colours as names (`electron/environments.cjs:6-7`), and the hidden rail
  comes back beside a page that does not offer the button
  (`electron/chrome-rail.mjs:91-97`).
- **Problem in the reference:** the remembered start place is forgotten
  after one failed open (`electron/start-place.mjs:25-26`). A short outage
  loses the choice of the person. The release problem: "State lost at a
  restart or a crash".
- What: keep the choice, and say that the place did not answer.
- Reference: `electron/chrome-rail.mjs:21-24`, `:53-57`, `:91-116`,
  `electron/cloud-rail.mjs:6-10`, `:18`, `:103`, `:150-151`, `:181-182`,
  `:199-248`, `electron/preload.cjs:71-82`, `:175-221`,
  `src/components/PlacesRail.tsx:30`, `:69-73`, `:430-468`,
  `electron/place-look.mjs:37-52`, `:89-94`,
  `electron/home-places.mjs:19-21`, `electron/start-place.mjs:19-38`.

### P700. The banner as the reference; the record and the picture in one transaction (later)

- Kind: a choice. Follows the reference, with one change.
- Keep: the server removes metadata by the structure of the container and
  trusts no upload (`server/workspace-banner.ts:36-135`), typed refusals
  (`server/routes/workspace-banner.ts:45`), and the serve headers
  (`:74-79`).
- **Problem in the reference:** the picture is saved before its record, and
  a failed record write leaves an orphan with an untyped error
  (`server/routes/workspace-banner.ts:90-92`). The release problem: "State
  lost at a restart or a crash".
- What: in our store, the record and the attachment row go in one
  transaction.
- Reference: `src/lib/place-banner.ts:8-12`, `:48-78`,
  `server/workspace-banner.ts:36-135`, `:151-163`, `:177-188`,
  `server/routes/workspace-banner.ts:17-22`, `:33-45`, `:74-93`,
  `server/request-auth.ts:493-494`.

## New facts for open proposals

- **P664** (a desktop file that cannot be read is never written over). More
  files of the reference do the same:
  - `history.json` of the themes: a failed read gives `[]`, and the next
    append writes over all the history (`server/themes/history.ts:37-51`);
  - a damaged `theme.json` is treated as new and written over
    (`server/themes/store.ts:95-103`, `:177-182`);
  - `account-places.json` gives `{}`, and the next `put` drops the other
    accounts (`electron/account-places.mjs:41-44`);
  - the banner record keeps null after a failed read
    (`server/workspace-banner.ts:177-181`);
  - `home-place.json` (`electron/home-places.mjs:44-47`).

  `profiles.json` is already in section 3.16 of
  [`environments-and-flags.md`](../research/features/environments-and-flags.md).
- **P291** (the Undo record is stored with its card). The theme card uses
  the same memory map (`server/app-settings/host.ts:88`, `:149`). The Undo
  of a theme delete in the window (`CustomThemesSettings.tsx:164-172`) and
  of a hidden thread (`UndoToast.tsx:7-17`) are in React state only.
- **P296** (window preferences). The mode is a window preference. The server
  keeps all of them in a memory map (`server/routes/app-settings.ts:29`) and
  sends a change to each admin window (`:47`). Two windows in two modes
  disagree, and the last report wins (`:35-37`).

## The problems of `changelog.md` section 5 in this feature

| Problem | In this feature | Proposal |
|---|---|---|
| A feature added, then removed or reversed | Yes. The UI mode (v0.1.94, v0.1.151, v0.1.152) lost eight settings (`src/lib/new-look.ts:17-18`, `:53`). The Today page (v0.1.120 to v0.1.123) left the route `/api/today` (`server/index.ts:12035`). The quote chip lasted one release (v0.1.111 to v0.1.112) | P690 |
| A secret or an access right in the wrong place | Yes, found by reading the code. Theme CSS can hide or relabel approval cards (`shared/theme.ts:191-202`, `:232`). Remote loads are blocked in two places. CSS may still request theme files of this server from attribute selectors, and nobody checked if a bot can see those requests | P689 |
| A file written over after a failed read | Yes. `history.json`, `theme.json`, `profiles.json`, `account-places.json`, the banner record, `environments.json` | P664 |
| State lost at a restart or a crash | Yes. The three writes of a look change (`store.ts:178-184`). The card Undo (`host.ts:88`). The window preferences on the server (`server/routes/app-settings.ts:29`). The blank New thread chat (`new-chat.ts:5`). The start place after one failed open (`start-place.mjs:25-26`). The remembered panel is global, not for each bot | P691, P291, P296, P699, P700 |
| The updater loops, sticks or breaks the window | No. The blank window of v0.1.137 came from a removed preload function, not from a skin or a theme (`03065106b`) | none |
