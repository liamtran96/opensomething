# The bot settings dialog and the creation of a bot

The reference project at commit `42f86aefd` (2026-11-27, after the tag
v0.1.184). This record continues
[`bot-profile.md`](bot-profile.md). That file already has the profile, the
presets, the soul, the history and the rollback routes. It also has the main
sections of the dialog and the Duplicate request. This file does not repeat them. It adds
these parts:

- the save path of the dialog and the panel, with its errors and its races
- the dialog sections that bot-profile.md did not read
- the four `src/lib` files of creation, and the path of "New bot" today
- the simple bot panel: its tabs, its rows and the look editor
- the scope of a model change, and the model picker for a signed-out or an
  absent engine
- the `/setup` entry points, and the text that tells a bot where the files
  of its other threads are
- the answers to the open points of section 9 of bot-profile.md that are in
  scope.

It also adds to two other done files:

- [`threads.md`](threads.md) does not have the keys of the file-location
  text (3.10), or the scope rules of a model change in the picker (3.7).
- [`engines-and-accounts.md`](engines-and-accounts.md) does not have the
  picker side of a signed-out engine (3.8). It also does not say that the
  rail keeps an absent engine only for the current selection
  (`src/lib/engine-rail.ts:7-11`).

Memory, skills, routines, permissions, usage and access have their own
files. For each of them this file gives only the dialog part (the UI, the
states and the save path) and links the file.

## 1. In short

The person changes a bot in one of two views. The **settings dialog** is a
side panel with sections (identity, soul, model, permissions, memory and
others). The **simple bot panel** has three tabs (Details, Library and
Computer) and opens other pages from rows on those tabs. The **UI mode**
selects the view: **Simple** or **Advanced**. The mode is one value for
each browser, kept in `localStorage`.

Most fields save in the same way. The section changes the bot in the local
state at once. This is an **optimistic save**. The change then waits
400 ms in the **patch queue** of the bot, and the queue sends one
`PATCH /api/bots/:id`. A failed save reads the bot again and puts the server
copy back. The save has no revision check, so the last write wins. Some
fields (visibility, the VPS server, the memory model, the Bot API, written
commands and organization skills) do not use the queue. They send their own
request and show their own error.

**New bot** makes the bot at once from the saved **New-bot template** (the
defaults of a new bot) and opens its chat. It shows no dialog. A
**draft** (an unsaved bot in memory) exists only for "Templates → Add".
**Duplicate** makes a copy with a POST and then a PATCH.

A model change from a thread has a **scope**. "Only this thread" gives the
thread its own model. "Thread + bot default" changes the default model of
the bot. Then every thread that **follows the bot model** (a thread with no
model of its own) changes too. When the new engine cannot keep the current
approval level, the person must confirm a reset to **Ask** (the bot asks
before each action). **Custom** is an approval level that only the packaged
desktop app can leave.

The model picker has a **rail**: a list of engine instances on its left
side. A **signed-out** engine (installed, but with no sign-in) stays on the
rail with a sign-in card and hides its cloud models. Its local models stay.
An **absent** engine (its CLI is not found) stays only when the current bot
or thread uses it.

Special terms of this file:

- **Bot record**: one object for each bot in `bots.json`. It holds the
  profile, the model, the approval level and the threads.
- **Team User**: a member of a Team Cloud who is not an admin.
- **`toolScope`**: the list of tools that a bot may use. An absent scope
  allows every tool.
- **`connectorScopes`**: the connected apps that a bot may use. An absent
  value means "all connected apps".
- **Engine instance**: one configured engine with one sign-in, for example
  one Claude account.

## 2. Files read completely

All paths are in the reference project. The files that bot-profile.md read
completely are not listed again. See its section 2.

### 2.1 Creation and Duplicate

| File | Lines |
|---|---|
| `src/lib/bot-presets.ts` | 101 |
| `src/lib/bot-presets.test.ts` | 89 |
| `src/lib/bot-creation-draft.ts` | 157 |
| `src/lib/bot-creation-draft.test.ts` | 67 |
| `src/lib/create-configured-bot.ts` | 118 |
| `src/lib/create-configured-bot.test.ts` | 182 |
| `src/lib/new-bot.ts` | 107 |
| `src/lib/new-bot.test.ts` | 180 |
| `src/lib/random-bot-name.ts` | 15 |
| `src/lib/random-bot-name.test.ts` | 40 |
| `src/components/SidebarBotMenu.tsx` | 484 |
| `src/lib/own-team-bot.ts` | 13 |

Ranges: `src/state/store.tsx` 710-722, 1720-1735, 2480-2560;
`server/routes/bots-create.ts` 90-316; `server/store.ts` 1405-1465;
`server/new-bot-defaults.ts` 130-156; `server/request-auth.ts` 545-612;
`packages/phone-protocol/src/tool-scope.ts` 1-40, 70-80;
`server/bot-folder.ts` 60-80; `docs/verification/bot-settings.md` 135-155;
`scripts/testing/bot-tools-ui.e2e.test.ts` 66-135.

### 2.2 Dialog sections and the save path

All in `src/components/bot-settings/`, except where the path says otherwise.

| File | Lines |
|---|---|
| `VisibilitySection.tsx` | 181 |
| `VisibilitySection.test.ts` | 50 |
| `VoiceSection.tsx` | 60 |
| `VoiceSection.dom.test.ts` | 80 |
| `BotApiCard.tsx` | 228 |
| `BotApiCard.dom.test.ts` | 183 |
| `RoutinesSection.tsx` | 25 |
| `RoutinesSection.test.ts` | 151 |
| `SoulSection.tsx` | 19 |
| `ReplyStyleField.tsx` | 39 |
| `field.ts` | 13 |
| `CheckWorkSetting.tsx` | 46 |
| `CheckWorkSetting.dom.test.ts` | 58 |
| `MemoryModelSetting.tsx` | 68 |
| `MemoryModelSetting.dom.test.ts` | 70 |
| `ManagedTeamsSettings.tsx` | 40 |
| `PackageProvenance.tsx` | 32 |
| `PhoneAppsCard.tsx` | 30 |
| `VpsAliasField.tsx` | 109 |
| `VpsAliasField.dom.test.ts` | 102 |
| `WriteCommandCard.tsx` | 120 |
| `WriteCommandCard.test.ts` | 21 |
| `SlackSection.tsx` | 19 |
| `SlackSection.test.ts` | 32 |
| `useSlackManagement.ts` | 32 |
| `OrgSkillsCard.tsx` | 99 |
| `src/state/bot-patch-queue.ts` | 333 |
| `src/lib/interface-mode.ts` | 78 |
| `src/lib/simple-only.ts` | 2 |

Ranges: `src/state/store.tsx` 750-762, 1526-1555, 1899-1980, 2055-2090,
2195-2215, 2800-2820; `server/routes/bot-patch.ts` 140-185, 750-810;
`server/store.ts` 290-312, 1251, 1305-1314, 1462-1475, 2245-2256;
`server/registry-store.ts` 100-135; `server/atomic.ts` 95-142;
`server/bot-api.ts` 20-35, 70-80, 115-132, 262;
`src/components/bot-settings/ModelSection.tsx` 82-100.

### 2.3 The simple bot panel

All in `src/components/bot-panel/`, except where the path says otherwise.

| File | Lines |
|---|---|
| `PanelHero.tsx` | 163 |
| `AvatarEditorCard.tsx` | 306 |
| `rows.tsx` | 336 |
| `rows.test.ts` | 18 |
| `side-panel.ts` | 80 |
| `side-panel.dom.test.ts` | 102 |
| `panel-link.ts` | 61 |
| `panel-link.test.ts` | 62 |
| `AdvancedSettingsRow.tsx` | 22 |
| `ComputerTab.tsx` | 194 |
| `LibraryTab.tsx` | 100 |
| `LibraryTab.dom.test.ts` | 127 |
| `library-items.ts` | 96 |
| `library-items.test.ts` | 57 |
| `TryAsking.tsx` | 24 |
| `TryAsking.test.ts` | 50 |
| `Keeps.tsx` | 53 |
| `Conversations.tsx` | 250 |
| `HeavyBotRow.tsx` | 46 |
| `use-bot-library.ts` | 20 |
| `src/lib/bot-app-access.ts` | 61 |
| `src/lib/bot-app-access.test.ts` | 85 |
| `server/routes/bot-library.ts` | 30 |
| `shared/bot-library.ts` | 23 |
| `src/lib/computer-panel-view.ts` | 43 |
| `src/lib/place.ts` | 52 |

Ranges: `src/components/avatar-editing.tsx` 20-32, 134-200;
`src/components/PlaceChip.tsx` 19-40; `src/lib/place-view.ts` 99-102,
171-182; `src/components/bot-settings/AccessSection.tsx` 561-591;
`src/components/BotSettingsDialog.tsx` 125-150;
`src/components/bot-panel/pages.tsx` 1-16, 62-77.

### 2.4 Model scope, the picker, `/setup` and files across threads

| File | Lines |
|---|---|
| `src/components/ModelPicker.tsx` | 1,017 (in three ranges: 1-350, 350-700, 700-1017) |
| `src/components/ModelPickerFull.tsx` | 211 |
| `src/components/ModelPickerTrigger.tsx` | 60 |
| `src/components/ModelPicker.interaction.test.ts` | 304 |
| `src/components/ModelPickerBusyMenu.tsx` | 25 |
| `src/components/local-model-probe.ts` | 26 |
| `src/lib/model-picker-pane.ts` | 44 |
| `shared/thread-model.ts` | 29 |

Ranges: `server/index.ts` 2544-2665, 3225-3405; `server/store.ts` 112,
646-649, 1340-1420, 2035-2100; `server/routes/tasks.ts` 262-300, 380-435;
`src/state/store.tsx` 375-400, 1330-1360, 1882-1907, 2120-2200, 2620-2665;
`src/components/Composer.tsx` 300-420; `src/lib/engine-rail.ts` 7-26;
`server/workspace.ts` 125-160; `src/lib/ai-switch.ts` 170-200;
`packages/phone-protocol/src/approval-mode.ts` 33-39, 88-98;
`src/components/EngineSetup.tsx` 23-34.

### 2.5 Read before, in other research files

- [`engines-and-accounts.md`](engines-and-accounts.md): `src/lib/engine-rail.ts`,
  `server/default-model-selection.ts`, `src/lib/interface-mode.ts` and the
  history of the UI mode.
- [`threads.md`](threads.md): the thread record and
  `server/independent-threads-api.test.ts`.
- [`store-and-data-format.md`](store-and-data-format.md): the load of
  `bots.json` and the seed at start.
- [`memory.md`](memory.md), [`skills.md`](skills.md),
  [`connected-apps.md`](connected-apps.md),
  [`usage-and-budgets.md`](usage-and-budgets.md),
  [`tool-selection.md`](tool-selection.md): the large sections of the
  dialog.

### 2.6 Checks of the main session

| Claim | Lines | Result |
|---|---|---|
| The panel has three tabs: Details, Library, Computer | `src/components/bot-panel/page-registry.ts:4-10` | agrees. The verification text says six tabs (written 2026-10-14, `31218a77e`). The three tabs came on 2026-10-27 (`d8ad64820`). No file in `src/components/bot-panel/` has the word "vault" in any case |
| A failed read of `bots.json` gives an empty list, and the file writer has no guard | `server/store.ts:297-303`, `server/atomic.ts:136-141`, `server/registry-store.ts:107-113` | agrees |
| The seed at start makes a bot when the list is empty | `server/store.ts:2247-2253`, `server/tested-ai.ts:316-319` | agrees. Already in store-and-data-format.md and P76 |
| A team User's Duplicate sends `{}`, and the server forces `useDefaults: false` | `src/lib/bot-duplicate.ts:17`, `server/routes/bots-create.ts:135-141` | agrees |
| A member cannot put `settings.toolScope` in a create | `server/request-auth.ts:605-609` | agrees. `toolScope` is in no member field list |
| An absent scope allows every tool | `packages/phone-protocol/src/tool-scope.ts:72-75` | agrees |
| Duplicate has no guard against a double click and no rollback | `src/state/store.tsx:2483-2517` | agrees. `newBot` has the guard at `:2485` |
| The scope starts at "thread". Simple writes the bot default for an owner or an admin | `src/components/ModelPicker.tsx:230`, `:429`, `:469` | agrees |
| `switchTaskModel` saves before it changes memory | `server/store.ts:2049-2066` | agrees |
| The first "off" of one app writes all other connected apps | `src/lib/bot-app-access.ts:28-32` | agrees |
| The HTTP model switch has no `try` around the save | `server/routes/tasks.ts:408-411` | agrees |

## 3. How it works

### 3.1 The save of a field in the dialog or the panel

1. A section calls `patch({...})`. `useBotSettingsDerived` dispatches
   `updateBot` (`src/components/bot-settings/useBotSettingsDerived.ts:70`).
   Some parts dispatch `updateBot` directly
   (`src/components/bot-settings/CheckWorkSetting.tsx:18`).
2. The reducer changes the bot in the local state at once
   (`src/state/store.tsx:1526-1554`).
3. The store keeps the bot as it was before the change and adds the patch to
   the queue of that bot (`src/state/store.tsx:2199-2203`, `:2809-2812`).
   The queue merges the patches of one bot (`src/state/bot-patch-queue.ts:236`).
4. The queue waits 400 ms (`src/state/bot-patch-queue.ts:160`, `:213-219`).
   Changes to `approvalMode`, `modelSelection` and `connectorTools` go at
   once (`:248-255`).
5. `persistBotUpdate` sends `PATCH /api/bots/:id` with the merged body
   (`src/state/store.tsx:1899-1927`). The approval levels Custom, and Full
   when the desktop bridge is there, go through the desktop bridge and not
   HTTP (`:1915-1977`).
6. The route checks each field and calls `store.patchBot` or
   `store.patchBotProfile` (`server/routes/bot-patch.ts:762-768`). It
   answers `{ bot }` (`:805-806`). The queue puts the answer under the edits
   that still wait (`src/state/bot-patch-queue.ts:179-182`).

Error paths and limits:

- A failed save reads the bot again (`readOneBot`), because a lost answer
  can still have committed. The server copy then replaces the local
  change. The error goes to the global error banner, and the section shows
  nothing (`src/state/bot-patch-queue.ts:183-201`;
  `src/state/store.tsx:2070-2077`).
- A newer approval change replaces an aborted one, and the aborted one gives
  no error (`src/state/bot-patch-queue.ts:185-188`).
- The body has no revision, and the route reads none. The last write wins
  for each field. Each 409 of the route is a "busy" refusal, not a conflict
  check:
  - an approval change still runs (`server/routes/bot-patch.ts:178`)
  - a turn runs during a memory or browser change (`:349`, `:427`, `:708`)
  - the VPS is busy during a server move (`:465-505`)
  - the bots of a department are busy (`:655-656`)
  - "a bot is working right now" (`:715-730`).
- When the page closes (`pagehide` or `beforeunload`), the queue sends the
  waiting edits with `keepalive`. It does this only for a body under
  60,000 bytes (`src/state/bot-patch-queue.ts:315-333`). A crash or a
  larger body loses them.
- `memoryEnabled` is not in the type of the queue
  (`src/state/bot-patch-queue.ts:4-53`). It still reaches the server,
  because the queue sends all the keys that it holds.

### 3.2 The sections that save with their own request

These sections do not use the queue. Each one shows a busy state and its own
error line.

1. **Visibility** (`VisibilitySection.tsx`). Three modes: everyone, admins,
   people (`:13`, `:48-52`). "People" takes emails or `@domain` entries. The
   section splits them on spaces, commas or semicolons, makes them lower
   case and removes copies (`:21-25`). An empty list is refused before a
   request (`:96-100`). Save sends `PATCH /api/bots/:id` with
   `{ visibility }` (`:105`). The section shows only in a browser, not in the
   desktop shell. It shows only to an owner or an admin, and only for a bot
   that is not in a named team (`:54-59`). A change of the stored value from elsewhere resets the
   form and loses the unsaved edits (`:76-81`). The section also lists the
   rooms whose audience is different. Each room has a reset button that
   sends `PATCH /api/groups/:id` with `{ resetAudience: true }` (`:83-93`).
2. **VPS server** (`VpsAliasField.tsx`). The person picks the default
   server, a named server, the current alias or "Other SSH alias"
   (`:21-23`, `:72-96`). A pick is a draft until Save (`:49-54`). Save sends
   `PATCH /api/bots/:id` with `{ vpsAlias }`, and an empty value is `null`
   (`:30-44`). The code does not save at once, because the server refuses a
   move while the computer of the bot is still on the old host (`:14-17`).
   The server accepts only a simple SSH alias or `null`
   (`server/routes/bot-patch.ts:449-457`).
3. **Memory model** (`MemoryModelSetting.tsx`). "Auto" or one model of the
   upkeep engine. A saved model that the engine no longer offers stays as
   an extra option (`:22`, `:58-63`). Save sends `PATCH /api/bots/:id` with
   `{ memoryModel }` and reads the upkeep status again (`:28-43`). The
   setting shows nothing in Simple (`:23-26`). Details are in
   [`memory.md`](memory.md).
4. **Bot API** (`BotApiCard.tsx`). It reads `GET /api/bots/:id/bot-api`
   (`:107-115`). The on/off switch, "New key" and "Acts as owner" each send a
   POST and replace the view with the answer (`:117-133`). A new key needs a
   confirm step (`:191-196`). Only the owner can turn on "Acts as owner".
   Each person who can manage the bot can turn it off (`:183`). The answer
   that makes a key holds the key once. The card keeps it only in React
   state and puts it in a `curl` command (`:42-43`, `:122-124`, `:134`). The
   server keeps only a SHA-256 of the key in `bot-api.json`, not in the bot
   record (`server/bot-api.ts:28`, `:76-78`, `:115-129`). A new key clears
   "Acts as owner" (`server/bot-api.ts:126`). The Cloud Starter plan shows
   one line and an Upgrade button, and the card sends no request (`:74-90`).
5. **Write a command** (`WriteCommandCard.tsx`). A slash name (lower case,
   spaces become dashes, 64 characters at most), a description (1,024 at
   most) and the instructions (`:76-103`). A check before the request gives
   one of these problems: `name`, `reserved`, `taken`, `description`,
   `instructions` (`:12-18`). Save sends `POST /api/bots/:id/skill-template`
   (`:39-49`). Details are in [`skills.md`](skills.md).
6. **Organization skills** (`OrgSkillsCard.tsx`). It reads
   `GET /api/org-library/skills?botId=` (`:19-31`). "Add" sends
   `POST /api/org-library/skills` (`:44-59`). A read error hides the card
   with no message (`:28-29`).

The other sections use the queue of 3.1:

- **Voice** (`VoiceSection.tsx`): the voice settings, the Live call voice
  and the notifications switch (`:28`, `:30-39`, `:41-57`). The Live call
  voice is not shown for a draft, or when Live is not set up, or for the
  providers `fish` and `elevenlabs` (`:22-24`).
- **Soul** (`SoulSection.tsx`): the soul field, the reply style and the
  status of a chief-of-staff proposal (`:10-17`). The reply style is
  `default` or `conversational` (`ReplyStyleField.tsx:6-9`).
- **Check before done** (`CheckWorkSetting.tsx`): `checkWork: {}`,
  `{ checker }` or `null` (`:18-19`, `:25`). The checker is "its own thread
  on another AI" or another visible bot (`:15`, `:21-33`).
- **Phone apps** (`PhoneAppsCard.tsx`): Off, Read, or Read and write, for
  each capability of the paired phone (`:17-27`).

Read-only parts: **Slack** shows one link "Manage in Admin" when the server
gives an `https` address (`SlackSection.tsx:5-18`;
`useSlackManagement.ts:6-31`). **Package provenance** shows where an
organization package came from (`PackageProvenance.tsx:10-31`).

The dialog part of the sections of other files:

| Section | What the dialog does | File |
|---|---|---|
| Memory | `patch({ memoryEnabled })` (`BotSettingsDialog.tsx:138`). Upkeep on/off by `updateBot` (`MemorySection.tsx:256`). A config change by `PATCH /api/config` (`:264-268`). The server refuses a change with 409 while a turn runs (`server/routes/bot-patch.ts:345-351`) | [`memory.md`](memory.md) |
| Skills | Direct requests to the skill routes, not the queue (`SkillsSection.tsx:75`, `:109-110`, `:139-148`, `:162`, `:180`, `:199`, `:377`) | [`skills.md`](skills.md) |
| Routines | A list with a switch for each routine. The switch dispatches `updateRoutine` (`RoutinesSection.tsx:14-23`) | [`automations.md`](automations.md) |
| Access | The working folder by its own `PATCH` (`AccessSection.tsx:59`). The other fields by `patch` (`:144` to `:621`). It holds the Bot API card, the phone apps and the VPS server | [`team-structure.md`](team-structure.md), [`connected-apps.md`](connected-apps.md), [`tool-selection.md`](tool-selection.md) |
| Permissions | Managed teams save by `patch({ managedSections, acknowledgePeerScope: true })` (`PermissionsSection.tsx:108`) | [`approval-levels.md`](approval-levels.md) |
| Usage | No save. A button opens the usage page of the app settings (`UsageSection.tsx:26`) | [`usage-and-budgets.md`](usage-and-budgets.md) |

### 3.3 New bot

1. The person presses New bot or Ctrl+N. The store refuses at the bot
   limit. It refuses a second create while one is pending. The comment
   says: "A double click lands before React paints the pending state"
   (`src/state/store.tsx:2483-2496`).
2. A team User: the client sends a POST with only the name, or with `{}`
   (`src/lib/new-bot.ts:59-62`). The server sets `useDefaults: false`, so
   the bot gets an empty template (`server/routes/bots-create.ts:135-141`;
   `server/new-bot-defaults.ts:144`).
3. A paired device: a POST with the section and the name only
   (`src/lib/new-bot.ts:63-66`). The host applies its own defaults.
4. Other cases: `GET /api/bot-defaults` (`src/lib/new-bot.ts:67`).
   - Name: the saved name of the template, else the `suggestedName` of the
     server. The client makes it unique as "Name 2", "Name 3" and so on,
     with no regard to case (`:24-29`, `:68`). On a team the person types
     the name first. Cancel makes no bot (`:87-93`).
   - Model: the saved model, else the workspace default (`:16-22`). With no
     AI set up, the bot has no model (`src/lib/new-bot.test.ts:122-129`).
   - Approval: the saved level. When the template says Auto on this
     computer, the bot starts on Ask, with this notice: "Pixel will ask
     before acting. To let it act on this computer by itself, choose Approve
     for me in its settings." (`src/lib/new-bot.ts:71-72`;
     `src/lib/new-bot.test.ts:165-171`).
   - Folder: the saved `cwd`. The server checks it with `validateBotCwd`
     (`server/routes/bots-create.ts:181`).
5. The client sends `POST /api/bots` and a PATCH. A failed PATCH deletes the
   bot (`src/lib/new-bot.test.ts:154-163`).
6. A bot-limit refusal gives no message (`src/lib/new-bot.ts:98`). Other
   errors say "Couldn't make a new bot: ..." (`:99`).

The popup with a role choice is gone. Commit `a9d725204` (2026-10-27) made
New bot create the bot at once. The test now presses Ctrl+N two times
during a held create, and checks for one request and no dialog
(`scripts/testing/bot-tools-ui.e2e.test.ts:81-111`). A role is now chosen
only as "Starting role" in Templates → Add (`:71-77`). The role on a draft
goes only to analytics (`src/components/NewBotDialog.tsx:137`). The text of
`docs/verification/bot-settings.md:143-149` still describes the old test.
This answers an open point of bot-profile.md.

### 3.4 A configured create (Templates → Add)

`createConfiguredBot` makes a bot from a draft
(`src/lib/create-configured-bot.ts`).

1. A `blob:` avatar is uploaded first. No file gives
   `newBot.avatar.chooseAgain`. A failed store gives
   `newBot.avatar.storeFailed` (`:9-19`).
2. A name is required (`:32`). `POST /api/bots` sends the name, title,
   description, model, section, `useDefaults: false`, visibility,
   `reportsTo`, `settings.toolScope` (only when the profile has the key)
   and the preset id (`:35-41`). It adds `requireAvailableModel: true` only
   when the instance and the model are both set (`:34`).
3. A PATCH sends the rest of the profile and the consent flags. It never
   sends `chiefOfStaff`, `managedSections`, `toolScope` or `modelSelection`
   (`:31`, `:46-48`).
4. For Full or Custom, the client checks that the bot got the level. Then
   it grants the first thread. A mismatch gives `newBot.approvalNotGranted`
   or `newBot.threadApprovalNotGranted` (`:49-60`).
5. Memory files, skills and routines go in parallel, and each kind goes in
   order. Routines start switched off. The client skips the notes and skills
   that the preset brings (`:64-89`).
6. On an error, the client deletes each new routine and then the bot. When
   that cleanup fails, the message says: "Cleanup failed for ...; remove
   them before retrying." (`:90-100`).
7. After success, a Chief of Staff PATCH and the "on" switch of routines
   run. A failure of either one is only a warning (`:101-117`).

The draft (`src/lib/bot-creation-draft.ts`) is a class in memory. It has no
`localStorage` and no file (`:19-32`). A restart or a close of the dialog
loses it. Its `request` method is a fake API, so the sections can edit the
draft. A request that needs a real bot throws "This operation requires a
created bot" (`:112-156`). An avatar must be PNG, JPEG, GIF or WebP, and at
most 10 MiB (`:85-92`). A preset never sets the model, the computer, the
folder, the approval level or the apps (`src/lib/bot-presets.ts:55-70`).

### 3.5 A failed create on the server

The route deletes the new routines and calls `store.deleteBot`
(`server/routes/bots-create.ts:285-288`). `deleteBot` removes:

- the thread records (`server/store.ts:1442-1444`)
- the workspace folder with the skills (`:1446`; `server/skills.ts:104-105`)
- the journal (`:1449`)
- the memory files and the memory journal (`:1451-1452`)
- `skill-state/<id>` (`:1454`) and the bot folder (`:1456`).

Each `rmSync` drops its error (`server/store.ts:1445-1455`). A file that
the code cannot delete stays, and no log names it. This answers an open
point of bot-profile.md.

### 3.6 Duplicate

1. The menu item dispatches `duplicateBot`
   (`src/components/SidebarBotMenu.tsx:347`, `:464-466`). It has no confirm
   step.
2. The store refuses at the bot limit. It has no guard against a double
   click, so two clicks make two copies (`src/state/store.tsx:2497-2499`).
3. `POST /api/bots` with `restrictedCopyRequest(source)`
   (`src/state/store.tsx:2502-2505`):
   - a team User sends `{}` (`src/lib/bot-duplicate.ts:17`)
   - other people send `settings.toolScope` when the source has the key,
     `settings.helperModel: false` when the source may not use the helper
     model, and `visibility` when it is not "everyone" (`:18-25`).
4. `PATCH /api/bots/:id` with `duplicateBotProfile(source)`: the name
   "<name> copy", the title, the description, the soul, the notifications,
   `modelSelection` and the five avatar fields. Not for a team User:
   `computer`, `cloudBackend`, `autoStartVps` and `vpsAlias`
   (`src/lib/bot-duplicate.ts:29-44`).
5. A failed PATCH leaves the new bot. Nothing deletes it
   (`src/state/store.tsx:2506-2516`).

What a copy does not get from its source: a secret, a token, the approval
level, `alwaysAllow`, an app connection, an MCP server. An admin's copy
gets these from the New-bot template, because its POST has no
`useDefaults: false` (bot-profile.md 3.11).

A team User's copy is less restricted than its source. The server forces
`useDefaults: false` (`server/routes/bots-create.ts:140`). The client sends
no `toolScope`, and a member cannot send one
(`server/request-auth.ts:605-609`). An absent scope allows every tool
(`packages/phone-protocol/src/tool-scope.ts:72-75`). This answers an open
point of bot-profile.md. P445 of [`tool-selection.md`](../../plan/tool-selection.md)
already names this risk.

Who sees Duplicate:

- A paired device never sees it (`src/components/SidebarBotMenu.tsx:342`,
  `:426-438`).
- A team member sees it only with edit access to a bot that is not a
  default bot (`src/lib/own-team-bot.ts:12`;
  `src/components/SidebarBotMenu.tsx:173`).
- In Simple the item is in the "More" flyout (`:347`). In Advanced it is a
  top-level item (`:464`).

The copy keeps `modelSelection` with no `requireAvailableModel`
(`src/lib/bot-duplicate.ts:36`). So a copy of a bot on a signed-out engine
keeps that engine. What the PATCH checks for a model was not read.

### 3.7 The scope of a model change

1. The picker keeps `scope` in component state. It starts at "thread" on
   each mount (`src/components/ModelPicker.tsx:230`).
2. The scope buttons show only in the full pane, for a thread, to an owner
   or an admin (`:682-697`). The labels are "Only this thread" and
   "Thread + bot default" (`src/locales/en.json:3651-3655`).
3. A pick sends `updateBotDefault` by this rule (`:469`):
   - with no thread (the Model section of the dialog): always the bot
     default
   - in the Simple list, for an owner or an admin: always the bot default
   - in the full pane: the value of the scope buttons.
4. The full pane opened from the Simple list sets the scope to "bot" for an
   owner or an admin (`:427-432`). In Advanced the full pane starts at
   "thread".
5. A guest changes only the thread. The picker treats each person as a
   guest until the owner check loads (`:233-234`). The server also refuses
   `updateBotDefault` from a person who is not an owner or an admin
   (`server/routes/tasks.ts:280-282`).
6. Before the dispatch, the picker checks each target (the thread, and the
   bot when the scope is the bot). It asks for Ask when the new driver
   cannot keep the current level, or when the level is Custom and the driver
   changes (`src/components/ModelPicker.tsx:470-473`;
   `packages/phone-protocol/src/approval-mode.ts:33-39`). Then a confirm
   dialog opens: "Switch model with Ask permissions?" with the button
   "Switch with Ask" (`:474-477`, `:995-1014`; `src/locales/en.json:3426-3429`).
7. The confirm checks again. When the bot is busy now, or the bot or the
   thread changed, it drops the switch (`:1005-1007`). Else it sends
   `resetApprovalToAsk: true` (`:1008-1010`). A switch that needs no Ask
   keeps the level.

The server (`server/index.ts:2615-2645`) refuses:

- with 409, while an approval grant is pending (`:2617`)
- with 409 `botBusy`, a new engine or model while the thread is busy. A
  change of effort only is allowed while busy (`:2577-2580`)
- with 409, the bot scope while the bot has an active group turn, even when
  this thread is idle (`:2622-2628`)
- with 403, a request that leaves Custom without the trusted desktop
  channel (`:2629-2633`)
- with 400, a switch that needs Ask without `resetApprovalToAsk`
  (`:2634-2638`)
- with 409, a reset to Ask while the thread or a group turn of the bot runs
  (`:2640-2643`).

The store (`server/store.ts:2049-2066`):

1. "Only this thread": the thread keeps its own model. When the model is
   the same as the bot model, the thread keeps no model and follows the bot
   (`:2056`).
2. "Thread + bot default": the thread follows the bot, and the bot gets the
   new default. `withDefaultModel` writes the current approval level of each
   thread onto its row. A thread that follows the bot and needs Ask gets
   Ask. A thread with its own model does not change (`:1396-1404`,
   `:2059-2061`).
3. The store calls `saveBots` first and changes memory after it
   (`:2062-2065`). So a failed disk write leaves the thread and the bot
   default as they were. The desktop channel answers "The model switch could
   not be saved. No settings were changed." (`server/index.ts:3383-3391`).
   The HTTP route has no `try` here (`server/routes/tasks.ts:408-411`). The
   state is safe, but the error goes to the generic handler.

The client changes only the task in its local state, not the bot default
(`src/state/store.tsx:1343-1348`). A failed save shows the error and reads
the bot again until a read succeeds (`:2161-2173`). A send waits for the
pending model writes, and refuses with `approvalMode.settingsNotSaved` when
the saved model differs (`:2120-2138`).

After a change of the bot default, the picker shows a notice when some
threads keep their own model (`src/components/ModelPicker.tsx:985-994`;
`shared/thread-model.ts:17-22`). The row "Use <bot>'s model" moves a thread
back to the bot model (`src/components/ModelPicker.tsx:449-462`).

### 3.8 The model picker for a signed-out or an absent engine

1. "Signed out" is `state === "available"` with `authenticated === false`.
   "CLI absent" is `state !== "available"`
   (`src/components/EngineSetup.tsx:23-34`).
2. In the main pane, either state blocks the engine
   (`src/components/ModelPicker.tsx:510-514`). The pane shows the setup card
   (for Claude, "Sign in to Claude") and a count, for example "2 models will
   appear after setup." It hides the model rows, the search and "Show all"
   (`:770-860`). The rail button has a warning dot. The status chip says
   "Sign-in required" or "Setup required"
   (`src/components/ModelPickerFull.tsx:14-18`, `:140-164`).
3. "Use a local model" stays below the card when the engine offers local
   models (`src/components/local-model-probe.ts:23-26`). An engine offers
   them when one or more local models are known. A `claudeAgent` driver
   with its CLI present and no policy also offers them. A CLI that is absent
   disables it (`src/components/ModelPicker.tsx:515`, `:883`).
4. A click opens the local pane and probes the local servers. The probe
   refreshes the models of the engine. It ends after 5,000 ms at most, and
   it never throws (`src/components/local-model-probe.ts:5-21`). The pane
   says "Looking for local models…" with `role="status"`. With no result it
   says "No local models found" and names oMLX, Ollama, Unsloth, LM Studio
   and EXO (`src/components/ModelPicker.tsx:517-523`, `:840-850`).
5. Sign-in does not block the local pane (`:510-513`). So a signed-out
   engine can still run a local model
   (`src/components/ModelPicker.interaction.test.ts:270-282`).
6. An engine with an absent CLI stays on the rail only when it is the
   instance of the current selection (`src/lib/engine-rail.ts:7-11`). Then
   it shows its install card and no local entry
   (`src/components/ModelPicker.interaction.test.ts:181-189`). Otherwise it
   is not on the rail, and the picker points to the settings
   (`:191-197`). The rule looks only at the current selection, not at
   other bots.
7. A ChatGPT plan with an empty catalog stays on the cloud rail and asks
   for sign-in. It never offers local models
   (`src/components/ModelPicker.tsx:312-314`;
   `src/components/ModelPicker.interaction.test.ts:128-140`).
8. On a paired device the sign-in goes to the host: "Set up Claude there"
   (`src/components/ModelPicker.interaction.test.ts:168-179`).
9. The trigger shows an attention line ("Sign-in required", "Setup
   required") only in Simple (`src/components/ModelPicker.tsx:569-580`).
10. While the bot is busy, the menu shows only the effort row and the text
    "Stop this thread's turn before changing its model"
    (`src/components/ModelPickerBusyMenu.tsx:5-24`).

The rules of `engine-rail.ts` and of a signed-out account are in
[`engines-and-accounts.md`](engines-and-accounts.md).

### 3.9 `/setup`

1. The composer offers "/setup" with the hint "Have this bot interview you
   and set itself up" (`src/locales/en.json:3102`). It offers it only at the
   start of a message, not in a room, and only when the engine supports the
   agents bridge (`src/components/Composer.tsx:324`, `:339-344`).
2. The Overview section of the dialog has a "Set up" button. It shows when
   the engine has the `agentsMcp` capability and the bot is not busy. It
   closes the dialog and sends "/setup" to `bot.threadId`, which is the
   current thread of the bot, not the thread on the screen
   (`src/components/BotSettingsDialog.tsx:117-120`).
3. The gate is a capability flag, not a driver name
   (`src/components/bot-settings/useBotSettingsDerived.ts:75`).

What the command does is in bot-profile.md 3.8 (`server/setup-mode.ts`).

### 3.10 Files across threads

When the engine works in a folder, the system prompt gets a section "File
locations" (`server/index.ts:8236`, `:10020`). Its text comes from
`workspaceLocationsPrompt` (`server/workspace.ts:138-151`). The JSON keys:

| Key | Value |
|---|---|
| `currentWorkingFolder` | The folder of the thread, or "Provider default; inspect the working directory before using relative paths" |
| `sharedBotFolder` | `workspaceDir(botId)` |
| `otherThreadFiles` | `<TASK_WORKSPACES_DIR>/<botId>` |
| `configuredProjectFolder` | The `cwd` of the bot, only when it has one |

The text says: "These paths do not grant additional access." and "Do not
move old files, edit another active thread's work, or read another bot's
private folders without authorization." (`:146`). Chat links and inline
images open only files in `currentWorkingFolder` and `sharedBotFolder`
(`:147`). When the agents bridge is on, the bot is also told to attach a
file with `attach_file` (`:148-150`). The text is built from stored data,
not from model output. The limits are only text. This research found no
code that enforces them.

### 3.11 The simple bot panel

1. The panel has three tabs: Details, Library and Computer
   (`src/components/bot-panel/page-registry.ts:4-10`). Memory, Skills,
   Routines, Apps, Folder, Where and the others are pages that open from a
   row (bot-profile.md 5).
2. The hero (`PanelHero.tsx`):
   - The avatar button "Edit avatar" opens the look editor (`:78-105`).
   - The name opens an inline input on a click. The code saves a name that
     is not empty and is different. An empty name is dropped with no
     message (`:66-69`).
   - The job line shows only when the bot already has a title. So the hero
     cannot add a first title (`:150-160`). An empty job is saved and
     clears the title (`:70-73`).
   - Enter commits, Escape cancels, and a blur commits. IME keys are
     ignored (`:16-57`).
3. The look editor (`AvatarEditorCard.tsx`) has three tabs: Bot, Generate,
   Upload (`:25-29`). Each change goes through the queue of 3.1
   (`src/components/bot-panel/PanelShell.tsx:131`).
   - Bot: a body grid saves `{ mascotBody }`, and a color swatch saves
     `{ color }` and clears `mascotBodyColor` (`:81-97`, `:162-177`). A pick
     of a mascot also sets `avatarCrop: "mascot"` when an image shows
     (`:71`).
   - "Give this body to the other bots" writes `mascotBody` to each other
     bot that the person may rename. It has no confirm and no undo
     (`:75-76`, `:148-160`).
   - Reset writes `color: "green"`, `mascotBody: "cursor"` and clears the
     other look fields. It keeps `avatarUrl` (`:131-139`;
     `src/components/avatar-editing.tsx:24`).
   - Generate sends the waiting patches first, then
     `POST /api/bots/:id/avatar/generate` (`src/components/avatar-editing.tsx:180-200`).
   - Upload takes PNG, JPEG, GIF or WebP up to 10 MB (`:249-275`).
4. Details holds the rows of bot-profile.md 5, plus these:
   - "Keeps" (`Keeps.tsx:27-51`): "What it remembers", "Skills", "Working
     folder" and "Routines", each with a value. A failed memory read shows
     "Nothing yet", the same as an empty memory (`:25`).
   - "Conversations" (`Conversations.tsx`): three rows, the open thread and
     the main thread (`:16`, `:101-105`). Search matches the title first,
     then the last line (`:111-115`). "New conversation" is hidden for view
     access (`:130-133`). Previews come from
     `GET /api/threads/:id/messages?limit=8`, with a cache of 200 entries in
     memory (`:18-50`).
   - "Try asking" shows only in Simple and only for the default helper
     bot. A tap sends the example text at once (`TryAsking.tsx:11-21`).
   - "This bot loads a lot every turn." with "Tidy memory" shows when the
     system prompt is heavy (`HeavyBotRow.tsx:15-44`).
   - "More in Advanced mode" switches the whole app to Advanced and opens
     the permissions section (`AdvancedSettingsRow.tsx:12-19`).
5. Library (`LibraryTab.tsx`) is read only. It lists pages, apps and files
   of the conversations of the bot, 20 for each group with "Show all"
   (`:16-41`). It reads `GET /api/bots/:id/library` (`use-bot-library.ts:9-18`).
   The server limit is 200 for each group (`shared/bot-library.ts:3-23`).
   The route searches only the conversations that the caller may read
   (`server/routes/bot-library.ts:18-28`).
6. Computer (`ComputerTab.tsx`) shows the last screen of the bot and two
   rows: "Where <name> works" and "Signed-in sites" (`:143-190`).
7. "Where <name> works" (`ComputerTab.tsx:85-130`) is a radio group:
   - "Let it choose" saves `computer: null`
   - "This Mac" or "This PC" saves `computer: "local"`
   - "Browser" saves `computer: "browser", browser: true`
   - "Cloud desktop" saves `computer: "cloud"`
   - "Private desktop" saves `computer: "vm"` (`:96`).
   - "Local" while the approval level is Auto opens "Allow Auto mode on this
     computer?". OK saves `acknowledgeLocalAuto: true` with the place
     (`:92-95`, `:118-127`).
   - A place that the policy or a block makes unusable is disabled, with its
     reason as a hint (`:65-68`; `src/components/PlaceChip.tsx:32-35`). A
     saved place that becomes unusable stays saved and checked. The code
     never changes it (`:72-76`, `:91`). "Off" shows only when it is the
     saved value, and it is disabled.
8. The Apps page switch (`src/components/bot-panel/pages.tsx:64-67`) calls
   `appSwitchPatch` (`src/lib/bot-app-access.ts:46-61`):
   - On a bot with no `connectorScopes` (all apps), the first "off" writes
     every other connected app with `"write"` (`:28-32`). From then on the
     bot has a fixed list. An app that the person connects later is not
     given to this bot.
   - On a bot with a list, "off" deletes that app. The last "off" leaves
     `{ apps: {} }`, not "all" (`:38-41`).
   - "On" while `composio === false` turns `composio` on. When an old list
     exists, the code brings back the whole old list plus the new app
     (`:53-55`). The doc comment at `:45` says "only that app". No test
     covers this case.
9. `openBotSettings` moves the panel to a section, a page and an anchor. It
   keeps the link in memory only (`panel-link.ts:19-35`). In Simple the page
   `mcp` becomes `apps` (`:52`).
10. The panel is 320 px wide in Simple and `min(420px, 42vw)` in Advanced
    (`side-panel.ts:10-17`). A close slides out an inert copy over 240 ms,
    except with reduced motion (`:19-72`).

### 3.12 The UI mode

The mode is the key `omb-advanced-mode` in `localStorage`. With no stored
value, a browser that has a prior run starts in Advanced
(`src/lib/interface-mode.ts:7`, `:20-32`). When storage throws, the choice
stays only in memory and a restart loses it (`:9`, `:65-72`). The build
constant `SIMPLE_ONLY = false` keeps the switch
(`src/lib/simple-only.ts:1-2`).

The mode changes what the person sees and what a click does:

- The dialog hides Overview, Prompt and History in Simple
  (`src/components/BotSettingsDialog.tsx:54-72`).
- The memory model setting shows nothing in Simple
  (`src/components/bot-settings/MemoryModelSetting.tsx:23-26`).
- The bot menu has two full branches
  (`src/components/SidebarBotMenu.tsx:58`, `:308-403`, `:405-484`).
- A model pick of an owner or an admin writes the bot default in Simple,
  but starts on "Only this thread" in Advanced
  (`src/components/ModelPicker.tsx:230`, `:429`, `:469`). The verification
  text says that the header "starts at Only this thread"
  (`docs/verification/bot-continuity.md:32`). That is true only in
  Advanced.

## 4. The data

The bot record fields that this feature writes (all through
`PATCH /api/bots/:id`, except where the table says otherwise):

| Field | Values | Written by |
|---|---|---|
| `name`, `title`, `description`, `soul` | Text with the limits of `BOT_PROFILE_LIMITS` | Hero, identity, soul |
| `color`, `mascotBody`, `mascotExpression`, `mascotBodyColor`, `mascotFaceColor`, `mascotMaterial` | Look values, or `null` | Look editor |
| `avatarUrl`, `avatarCrop`, `avatarZoom`, `avatarFocusX`, `avatarFocusY` | Attachment address, `mascot`/`circle`/`rounded`/`square`, numbers | Look editor |
| `replyStyle` | `default`, `conversational` | Soul |
| `notifications`, `liveVoice` | Boolean, voice id | Voice |
| `visibility` | `everyone`, `admins`, or a list of people | Visibility |
| `checkWork` | `{}`, `{ checker }` or `null` | Model |
| `memoryModel` | `{ instanceId, model }` or `null` | Memory |
| `computer` | `null` (auto), `local`, `browser`, `cloud`, `vm`, `off` | Where page |
| `acknowledgeLocalAuto` | `true`, a consent flag | Where page |
| `vpsAlias`, `cloudBackend`, `autoStartVps` | SSH alias or `null`, `box`/`vps`, boolean | Access, Where page |
| `phoneApps` | Off, Read, or Read and write, for each capability | Phone apps |
| `composio`, `connectorScopes`, `connectorTools` | See 3.11, item 8 | Apps page |
| `modelSelection` | `{ instanceId, model, effort?, variant? }` | Model picker |

A thread row has its own `modelSelection` only when it does not follow the
bot. `ASK_NOW` is `{ approvalMode: "ask", autoApprove: false,
alwaysAllow: [] }` (`server/store.ts:112`).

Other stores:

- `bot-api.json` in the data folder keeps the SHA-256 of each Bot API key
  and the "acts as owner" flag. It refuses writes with 503 after a failed
  read (`server/bot-api.ts:28`, `:76-78`, `:262`).
- The New-bot template is server config (`cfg.newBotDefaults`,
  `server/routes/bots-create.ts:146`).
- Each browser keeps the UI mode in `localStorage` (`omb-advanced-mode`).
  It also keeps the view of the computer panel
  (`omb-computer-panel-view:<botId>`, `src/lib/computer-panel-view.ts:16-43`).
- These are in memory only: the patch queue, the scope of the picker, the
  draft, the panel link, the preview cache and the library answer.

The wire type of the library is `BotLibrary { pages, apps, files }`, with at
most 200 items in each group (`shared/bot-library.ts:3-23`).

## 5. The UI

The layout of the dialog and of the panel is in bot-profile.md 5. This
section adds the visible text and the states that this research read.

- **Busy states.** Sections that save with their own request disable their
  controls and show "saving" or a spinner
  (`VisibilitySection.tsx:125`, `:168-172`; `VpsAliasField.tsx:77`,
  `:99`; `OrgSkillsCard.tsx:85`, `:90`).
- **Errors.** Their errors show in `role="alert"`
  (`VisibilitySection.tsx:178`; `MemoryModelSetting.tsx:50`;
  `WriteCommandCard.tsx:116`; `OrgSkillsCard.tsx:96`;
  `AvatarEditorCard.tsx:302`). A section that uses the queue shows no error.
  The global banner shows it.
- **Bot API.** A status word for each call code: 200 replied, 202
  accepted, 401 wrong key, 403 off, 409 busy, 413 too large, 429 too fast,
  400 and 415 unreadable (`BotApiCard.tsx:53-66`). The key shows one time in
  the `curl` command. After a remount the command shows `YOUR_KEY`
  (`BotApiCard.dom.test.ts:109-124`). "Copy" puts the key on the clipboard
  (`BotApiCard.tsx:135-139`).
- **Accessible names.** Each row button of the panel names its target, for
  example "Edit: Instructions". The verification text also names "Open:
  Vault", but this research found no Vault page in the panel.
  The look editor is `role="dialog"` with the name "Edit avatar"
  (`AvatarEditorCard.tsx:107-113`). The Where page is a `role="radiogroup"`
  (`ComputerTab.tsx:101-115`). The scope buttons are a group with the name
  "Apply model changes to" (`src/locales/en.json:3651`).
- **Model picker.** Simple is 324 px wide and Advanced is 420 px
  (`src/components/ModelPicker.tsx:198-200`). Escape goes back in steps:
  the query, the local pane, the Simple list, then close (`:555-566`). The
  rail has three groups: Cloud, API keys and Local
  (`src/components/ModelPickerFull.tsx:104-127`).
- **Sidebar menu.** Simple puts Duplicate under "More". Advanced shows it
  after "Edit profile" (`src/components/SidebarBotMenu.tsx:347`, `:464`).

## 6. The tests

| Test | What it proves |
|---|---|
| `src/lib/new-bot.test.ts` | Server name and model, unique names, no AI, a bare POST for a team User, rollback on a failed PATCH, Auto on this computer starts on Ask (`:75-171`) |
| `src/lib/create-configured-bot.test.ts` | Visibility and `toolScope` only in the POST, the model check, the approval grant, Custom refused without the desktop, rollback of routines then the bot (`:33-180`) |
| `src/lib/bot-creation-draft.test.ts` | Edits stay local, drafts are independent, a cross-bot request throws (`:6-66`) |
| `src/lib/bot-presets.test.ts` | Groups, the patch never sets the model, approval, computer or apps, preset notes and skills are skipped (`:23-88`) |
| `src/lib/random-bot-name.test.ts` | Each list has 1,000 or more names within the name limit (`:10-13`) |
| `VisibilitySection.test.ts` | Modes, case and copies, empty list refused, mixed rooms (`:13-49`) |
| `BotApiCard.dom.test.ts` | Starter sends no read, the key shows one time, a new key needs a confirm, a viewer gets no controls (`:55-177`) |
| `VpsAliasField.dom.test.ts` | No request until Save, `null` for the default (`:51-101`) |
| `MemoryModelSetting.dom.test.ts` | The PATCH body, and nothing in Simple (`:54-70`) |
| `CheckWorkSetting.dom.test.ts` | On, off and the checker list (`:35-57`) |
| `src/lib/bot-app-access.test.ts` | The app scope rules. No test for "on" from `composio: false` with an old list (`:6-84`) |
| `LibraryTab.dom.test.ts`, `library-items.test.ts` | Merge, copies, deleted threads, local wins, a server 500 gives local items (`LibraryTab.dom.test.ts:80-127`) |
| `side-panel.dom.test.ts`, `panel-link.test.ts` | The close copy, the widths, the link targets (`side-panel.dom.test.ts:37-101`) |
| `src/components/ModelPicker.interaction.test.ts` | Signed-out and absent engines, the paired device, the local probe and its 5 s limit (`:128-303`). It runs in Advanced only (`:45-46`) |

The verification texts have drift:

- `docs/verification/bot-settings.md:143-149` describes the removed role
  popup.
- `docs/verification/bot-settings.md` "The Simple panel" lists six tabs.
  The code has three.
- `docs/verification/bot-continuity.md:32` gives the default scope of
  Advanced only.

## 7. Ours compared

Our crates are stubs. The rows give the plan step that will hold each part.

| Part | The reference | Ours |
|---|---|---|
| Settings panel | `src/components/BotSettingsDialog.tsx`, `src/components/bot-panel/` | Step 1 mock settings panel in `bot-desktop`. Layout by D16. P513 proposes no UI mode switch |
| Save of a bot field | `src/state/bot-patch-queue.ts`, `server/routes/bot-patch.ts` | Step 6 (settings and the data folder, `bot-core`). Each state change writes the row and its event in one transaction (`AGENTS.md`) |
| `bots.json` after a failed read | `server/store.ts:297-303`, `:2250-2252` | P76 of [`store-and-data-format.md`](../../plan/store-and-data-format.md), steps 6 and 8 |
| New bot and the template | `src/lib/new-bot.ts`, `server/routes/bots-create.ts` | P406 and P420 of [`bot-profile.md`](../../plan/bot-profile.md), a new step after 16 |
| Duplicate | `src/state/store.tsx:2497-2517`, `src/lib/bot-duplicate.ts` | P411 of `bot-profile.md`. The member copy: P445 of `tool-selection.md` |
| Model scope | `src/components/ModelPicker.tsx`, `server/store.ts:2049-2066`, `server/index.ts:2615-2645` | Step 11 (threads, `bot-core` and `bot-desktop`). No proposal yet |
| Reset to Ask on a switch | `packages/phone-protocol/src/approval-mode.ts:33-39` | Step 10 (approvals) |
| Signed-out engine in the picker | `src/components/ModelPicker.tsx:510-895`, `src/lib/engine-rail.ts` | P499 to P502 of [`engines-and-accounts.md`](../../plan/engines-and-accounts.md). The `SignedOut` refusal of `bot-engine` (P500) |
| App scope switch | `src/lib/bot-app-access.ts` | P258 and P259 of [`connected-apps.md`](../../plan/connected-apps.md), step 16 |
| `/setup` | `src/components/Composer.tsx:324-344`, `server/setup-mode.ts` | P418 of `bot-profile.md`, after steps 15 and 16 |
| File locations text | `server/workspace.ts:138-151` | Step 11. Text from stored data (`AGENTS.md`) |

## 8. Where we can be better

1. **One scope rule for the model change, the same in each view.** In the
   reference the same click of an owner changes the bot default in Simple
   and only the thread in Advanced (`src/components/ModelPicker.tsx:230`,
   `:429`, `:469`). Its own verification text gives only one default
   (`docs/verification/bot-continuity.md:32`). The reason: a person who
   moves between views cannot know what a click does.
2. **Follow the reference for the save order of a model switch.** The
   thread, the bot default and the reset to Ask go in one write, before
   memory changes (`server/store.ts:2049-2066`). The reason: this is our
   rule of one transaction. The reference is already right here.
3. **A save of a field carries the revision that the person saw.** The
   reference has no conflict check, and the last write wins
   (`server/routes/bot-patch.ts`, no revision). Two views, two windows or a
   bot proposal can write over an edit. The reason: P412 does this only for
   Undo.
4. **No 400 ms wait in memory for a save.** In the reference a crash loses
   the edits of the last 400 ms, and a page close loses a body of 60,000
   bytes or more (`src/state/bot-patch-queue.ts:160`, `:315-333`). The
   screen also shows a bot field before the save
   (`src/state/store.tsx:1526-1554`). The reference fixed the same problem
   for threads ("Thread changes are saved before they're shown", v0.1.115)
   and for rooms (v0.1.120), but not for bot fields. The reason: a desktop
   app with a local core can save first and show after.
5. **An app switch keeps the meaning of "all apps".** The first "off" in
   the reference writes the apps that are connected now, so an app connected
   later is not given to the bot (`src/lib/bot-app-access.ts:28-32`). An app
   list that is still loading can drop apps. The reason: the switch changes
   the access of the bot in a way the person did not ask for.
6. **Duplicate refuses a second click.** New bot has the guard
   (`src/state/store.tsx:2485`). Duplicate has none (`:2497-2499`). The
   reason: two copies of a bot with the same name and model confuse the
   person.
7. **The engine warning shows in each view.** The reference shows "Sign-in
   required" on the trigger only in Simple
   (`src/components/ModelPicker.tsx:569-580`). The reason: a person in
   Advanced sees no warning until a turn fails.
8. **Keep the Bot API key out of the page after one view.** The reference
   keeps the key in the page and on the clipboard while the view is open
   (`src/components/bot-settings/BotApiCard.tsx:134-139`, `:163`). The
   reason: a judgment call. No release problem names it.

### The problems of `changelog.md` section 5 that the reference has here

| Problem | Here | Lines |
|---|---|---|
| A feature added, then removed or reversed | Yes. The UI mode: Simple by default (v0.1.94), Simple only (v0.1.151), Advanced back (v0.1.152), "Simple mode stays Simple." (v0.1.182). Both paths stay in the menu, the dialog and the picker, and the default scope of a model change depends on the mode. The role popup of New bot was removed on 2026-10-27 | `src/lib/simple-only.ts:1-2`; `src/components/SidebarBotMenu.tsx:58`; `src/components/ModelPicker.tsx:230`, `:429`, `:469`; commit `a9d725204` |
| A file written over after a failed read | Yes. A failed read of `bots.json` gives no bots, and the seed at start writes over the file. A create has no guard either. A dialog save of an existing bot gets 404 and writes nothing. `bot-api.json` has a guard. P76 already answers this | `server/store.ts:297-303`, `:1251`, `:1312`, `:2250-2252`; `server/bot-api.ts:262` |
| State lost at a restart | Partly. A bot field shows before it is saved. The reference fixed this for threads (v0.1.115) and rooms (v0.1.120), not for bots. Edits that wait in the queue, the draft of Templates → Add, the scope of the picker, and the UI mode when storage fails | `src/state/bot-patch-queue.ts:160`, `:315-333`; `src/lib/bot-creation-draft.ts:19-32`; `src/lib/interface-mode.ts:65-72` |
| A secret or an access right in the wrong place | Partly. A copy gets no secret, and the Bot API key is a hash outside the bot record. But a team User's copy loses the tool scope (P445), and the app switch fixes a list of apps | `src/lib/bot-duplicate.ts:17`; `server/bot-api.ts:28`; `src/lib/bot-app-access.ts:28-32` |
| Sign-in to an engine | Answered in the picker: the signed-out engine stays, with a sign-in card and its local models. A Duplicate keeps a signed-out engine with no check | `src/components/ModelPicker.tsx:510-895`; `src/lib/bot-duplicate.ts:36` |

## 9. Not verified

- What `PATCH /api/bots/:id` checks for `modelSelection` (a Duplicate onto a
  signed-out engine, and the Model section of the dialog).
- The `DELETE /api/bots/:id` route that the client rollback uses. This
  research assumes that it reaches `store.deleteBot`.
- The middle of `server/routes/bot-patch.ts` (lines 186-749) beyond the
  lines this file cites.
- The default visibility and approval level of a bot that a team User
  makes.
- Whether the Apps page disables its switches while the list of connected
  apps loads.
- The Simple model list (`SimpleModelMenu.tsx`, `src/lib/simple-model-menu.ts`)
  for a signed-out or an absent engine. The full pane was read.
- The body of `EngineSetup.tsx` (the sign-in card).
- Whether any code enforces the limits of `otherThreadFiles`. The prompt
  says that the paths grant nothing.
- The error handler of the HTTP model switch
  (`server/routes/tasks.ts:409`).
- `SoulField`, `VoiceSettings`, `RoutineList`, `RoutineEditor`,
  `SidebarThreadRow`, `NewBotName.tsx` and the mascot pickers: callers, not
  read.
- `BotSettingsDialog.simple.test.ts` beyond the ranges of bot-profile.md,
  and the DOM tests of `Conversations`, `HeavyBotRow` and `Keeps`.
- These open points of bot-profile.md section 9 are out of scope, and they
  stay open:
  - the launch folder of the Claude CLI, and the isolated home folder
  - the data folder as `cwd`, and `redact.ts`
  - the per-turn token, and the start sweep of profile cards
  - the outer gate of the rollback routes, and `loopbackMutationToken`
  - the 500 of `server/index.test.ts:14228`
  - export of one bot
