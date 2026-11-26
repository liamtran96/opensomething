# The bot profile and the bot settings

This file is for these rows of
[`../reference-features.md`](../reference-features.md), group "later":

- "The bot profile: one document for all parts of a bot, with a version log
  and rollback" (`2026-08-31-02-bot-profile.md`).
- "Export of one bot, and a clone of one bot" (the same plan). This file has
  the clone (Duplicate). Export is part 44 and is named only.
- `bot-settings.md`: the settings dialog and its sections, history with
  Undo, duplicate a bot, "New bot" and its defaults, the simple bot panel.
- `bot-continuity.md`: the set-up interview, only on `/setup`.
- `superpowers/specs/2026-09-05-bot-folder-and-self-setup-design.md`:
  `SOUL.md`, set-up by conversation, `propose_profile` cards, history and
  Undo.
- `presets.md`: preset bots.

No step of [`../../plan/README.md`](../../plan/README.md) has this feature.
Section 7 proposes a new step after step 16, "The bot profile", in four
pull-request groups. The main session gives the step its number. The `/setup` part and the presets come after it.

- **Reference commit:** `83d18e3af`. Each line number in this file is at
  that commit. The earlier file
  [`chat-widgets-and-proposals.md`](chat-widgets-and-proposals.md) read
  `96ff84455`. Some of its `server/index.ts` lines moved: `undoAppliedChange`
  is now at `server/index.ts:9276`, not `:9283`.
- **Method:** six subagents read six groups of files. The groups are the
  documents, the profile store, set-up and proposals, new bot with presets
  and Duplicate, the settings dialog, and the bot panel with `SOUL.md`. Each subagent read
  its files completely, or in recorded ranges. The main session then read
  the key lines again (section 2.2).
- **Product names:** a quoted string that holds the product name of the
  reference project shows it as `<app>`.
- **Border:** the Skills, Access (tool selection), Memory and backup-model
  sections of the settings are other features of this batch. This file
  names them only.

### What this file adds to earlier research

- [`chat-widgets-and-proposals.md`](chat-widgets-and-proposals.md) has the
  card of a profile proposal from end to end: the route, auto-apply, the
  card states, Undo and `changed-since`. This file does not repeat it. It
  adds the input schema of `propose_profile`, the field list, the `cwd`
  risk, and three texts that still promise a confirm step (section 8).
- [`app-settings.md`](app-settings.md) has the Undo record of an app
  setting. This file adds one entry of that tool: `bots.newBotTemplate`,
  which lets a bot replace the template of all new bots.
- [`memory.md`](memory.md) has `profile-learned.json` (the "About me" facts).
  This file adds that its load gives empty lists after a parse error, and
  the next save writes over the file (section 8).
- [`team-structure.md`](team-structure.md) has `create_bot` of a Chief and
  "A new bot starts at Full access". This file adds `copyFromBotId`
  (`server/create-bot-fields.ts`) and the New-bot template.
- [`store-and-data-format.md`](store-and-data-format.md) has `bots.json` and
  the doctor that writes a missing `SOUL.md`. This file adds the `SOUL.md`
  mirror, the drift check and `history.ndjson`.
- This file adds:
  - the profile fields, their limits, and the revision hash.
  - the version log: its rows, its write queue, its read caps, and
    rollback for `SOUL.md` only.
  - `SOUL.md`: the mirror, drift, apply and discard, and the prompt block.
  - `/setup` and the setup card.
  - the New-bot template, random names, presets and Duplicate.
  - the settings dialog, the simple bot panel, and their sections.
  - the plan of 2026-08-31 compared with what the reference built.
  - eight problems of the reference, with their lines (section 8).

## 1. In short

Each bot has a profile: a name, a job title, a short description and its
standing instructions. A person changes the profile in the settings of the
bot. A bot can also change its own profile with a tool. Each change goes
to a log. The person can undo a change of the standing instructions from
that log.

The plan of 2026-08-31 wanted one profile document for all parts of a bot,
with a version log and a rollback of the whole document. The reference did
not build that design. It built a smaller design:

- The profile fields stay on the bot record.
- The log has one row for each changed field.
- Only the standing instructions can go back to an earlier version
  (`server/index.ts:14653`).

The special terms:

- **Bot record:** the row of one bot in `<data folder>/bots.json`. It holds
  all settings of the bot, the profile fields too
  (`server/store.ts:1518-1535`).
- **Profile:** in the version log and in proposals, these seven fields:
  `name`, `title`, `description`, `soul`, `cwd`, `notifications`,
  `speakReplies` (`packages/phone-protocol/src/profile-request.ts:10`).
- **Soul (standing instructions):** free text that the bot gets at the
  start of each turn. The person writes it. The limit is 24,000 UTF-8 bytes
  (`shared/bot-profile.ts:10`).
- **`SOUL.md`:** a copy of the soul in a file,
  `<data folder>/bots/<bot id>/SOUL.md`. The bot record is the source of
  truth, and the file is only a mirror (`server/bot-folder.ts:1-2`).
- **Drift:** the file `SOUL.md` is different from the record, because a
  person changed the file in an editor. The reference shows drift. It never
  applies the file on its own (`server/bot-folder.ts:1-2`).
- **`cwd` (working folder):** the folder where the tools of the bot read and
  write files (`server/profile-requests.ts:217`).
- **Profile revision:** a SHA-256 hash of the seven profile fields and of
  the id of the last applied proposal (`server/profile-revision.ts:19-26`).
  A request that changes the profile sends the revision that it saw. A
  different revision gives 409.
- **Version log (history):** `<data folder>/bots/<bot id>/history.ndjson`,
  one JSON row for each changed field (`server/profile-versions.ts:12-34`).
- **Rollback (Undo):** set the soul back to the `before` text of one row of
  the log (`server/index.ts:14640-14667`).
- **`propose_profile`:** the tool that a bot calls to change its own
  profile, or, for a Chief, the profile of a teammate
  (`server/drivers/agents-catalog.ts:657-678`). The change applies at once,
  and the person gets a card with Undo (`server/direct-apply.ts:17-20`).
- **`/setup`:** a chat command. The bot asks the person up to four
  questions, then sets itself up with tools (`server/setup-mode.ts:84-92`).
- **New-bot template ("Defaults for new bots"):** a template in the config
  file. Each new bot starts from it (`shared/new-bot-defaults.ts:33-38`).
- **Preset:** a starting role for a new bot, from a file or from an
  organization. It can set identity, soul, look, playbooks, skills and
  notes, never access (`shared/package-format.ts:390-405`).
- **Duplicate:** a copy of a bot, made by the window with two requests
  (`src/state/store.tsx:2497-2516`).
- **Simple mode, Advanced mode:** one switch for the whole window
  (`src/lib/interface-mode.ts:7`). Simple mode shows the bot panel with
  three tabs. Advanced mode shows a dialog with 15 sections
  (`src/components/BotSettingsDialog.tsx:182-190`).

## 2. Files read completely

### 2.1 By group

Paths are in the reference project. "Ranges" lists partial reads of
callers.

**Documents** (7 files, 1,421 lines)

| File | Lines |
|---|---|
| `docs/superpowers/plans/2026-08-31-02-bot-profile.md` | 228 |
| `docs/superpowers/specs/2026-09-05-bot-folder-and-self-setup-design.md` | 121 |
| `docs/verification/bot-settings.md` | 223 |
| `docs/verification/bot-continuity.md` | 123 |
| `docs/verification/presets.md` | 177 |
| `docs/presets.md` | 104 |
| `DESIGN.md` | 445 |

Ranges: `server/drivers/agents-call.ts` 678-700, `server/agents-bridge-switch.ts`
110-118 and 225-240, `server/presets.ts` 145-200 and 255-270. Commits read
with `git show`: `c433a60ae`, `5d69ece95`, `50362a940`, `b09fcb083`,
`761102925`, `a9d725204`, `31218a77e`, `593fd1c5a`, `05948b876`,
`a3a9ed2e7`.

**The profile store** (11 files, 2,681 lines)

| File | Lines |
|---|---|
| `server/bot-profile.ts` | 149 |
| `server/bot-profile.test.ts` | 200 |
| `shared/bot-profile.ts` | 23 |
| `server/profile-versions.ts` | 174 |
| `server/profile-versions.test.ts` | 191 |
| `server/profile-revision.ts` | 26 |
| `server/profile-learned.ts` | 170 |
| `server/routes/bot-settings.ts` | 254 |
| `server/routes/bot-patch.ts` | 798 (in four ranges) |
| `server/routes/bot-patch.test.ts` | 664 (in two ranges) |
| `server/create-bot-fields.ts` | 32 |

Ranges: `server/index.ts` 2930-2990, 11885-11915, 14550-14690,
15195-15235. `server/store.ts` 292-300, 1515-1540. `server/request-auth.ts`
560-625.

**Set-up and proposals** (17 files, 3,002 lines)

| File | Lines |
|---|---|
| `server/profile-requests.ts` | 535 |
| `server/profile-requests.test.ts` | 583 |
| `server/profile-requests-browser-profile.test.ts` | 193 |
| `server/profile-card-lifecycle.e2e.test.ts` | 94 |
| `shared/profile-request.ts` | 1 |
| `packages/phone-protocol/src/profile-request.ts` | 40 |
| `server/bot-folder.ts` | 87 |
| `server/bot-folder.test.ts` | 91 |
| `server/setup-mode.ts` | 109 |
| `server/setup-mode.test.ts` | 224 |
| `server/setup-request.ts` | 153 |
| `server/setup-request.test.ts` | 322 |
| `server/routes/setup-request.ts` | 72 |
| `server/routes/setup-request.test.ts` | 161 |
| `server/bot-setup.e2e.test.ts` | 47 |
| `server/bot-continuity.e2e.test.ts` | 98 |
| `src/components/SetupOffer.tsx` | 192 |

Ranges: `server/drivers/agents-catalog.ts` 112-120, 640-700, 810-830,
870-895. `server/drivers/agents-call.ts` 690-715. `server/index.ts`
2895-2930, 3037-3052, 7695-7770, 8155-8245, 9070-9110, 9980-10000,
11009-11030, 13205-13265, 14530-14680. `server/direct-apply.ts` 1-32
(complete). `server/bot-cwd.ts` 1-60.

**New bot, presets and Duplicate** (17 files, 2,812 lines)

| File | Lines |
|---|---|
| `server/new-bot-defaults.ts` | 156 |
| `server/new-bot-defaults.test.ts` | 96 |
| `server/new-bot-defaults.e2e.test.ts` | 88 |
| `shared/new-bot-defaults.ts` | 38 |
| `server/new-bot-sharing.ts` | 41 |
| `server/presets.ts` | 516 (in two ranges) |
| `server/presets.test.ts` | 334 |
| `server/presets.e2e.test.ts` | 155 |
| `server/routes/bot-presets.ts` | 21 |
| `server/routes/bot-presets.test.ts` | 74 |
| `server/routes/bots-create.ts` | 316 |
| `server/routes/bots-create.test.ts` | 127 |
| `src/components/NewBotDialog.tsx` | 397 |
| `src/components/NewBotDialog.test.ts` | 298 |
| `src/components/NewBotName.tsx` | 53 |
| `src/lib/bot-duplicate.ts` | 44 |
| `src/lib/bot-duplicate.test.ts` | 58 |

Ranges: `src/state/store.tsx` 1722-1732, 2490-2560.
`src/components/SidebarBotMenu.tsx` 280-295, 440-455. `server/config.ts`
696-720, 878-960. `server/store.ts` 1258-1324. `server/names.ts` 1-27
(complete). `shared/package-format.ts` 330-405.
`server/app-settings/registry-config.ts` 26-40, 80-110.

**The settings dialog** (25 files, 4,313 lines)

| File | Lines |
|---|---|
| `src/components/BotSettingsDialog.tsx` | 288 |
| `src/components/BotSettingsDialog.caption.test.ts` | 47 |
| `src/components/BotSettingsDialog.escape.test.ts` | 73 |
| `src/components/BotSettingsDialog.library.test.ts` | 48 |
| `src/components/BotSettingsDialog.simple.test.ts` | 1,609 (in four ranges) |
| `src/components/bot-settings/sections.ts` | 77 |
| `src/components/bot-settings/sections.test.ts` | 51 |
| `src/components/bot-settings/BotEditorContext.tsx` | 11 |
| `src/components/bot-settings/useBotSettingsDerived.ts` | 113 |
| `src/components/bot-settings/useBotSettingsDerived.test.ts` | 52 |
| `src/components/bot-settings/IdentitySection.tsx` | 116 |
| `src/components/bot-settings/HistorySection.tsx` | 76 |
| `src/components/bot-settings/HistorySection.test.ts` | 103 |
| `src/components/bot-settings/OverviewSection.tsx` | 171 |
| `src/components/bot-settings/OverviewSection.test.ts` | 169 |
| `src/components/bot-settings/useBotOverview.tsx` | 179 |
| `src/components/bot-settings/useBotOverview.test.ts` | 88 |
| `src/components/bot-settings/PromptPreview.tsx` | 64 |
| `src/components/bot-settings/PromptPreview.test.ts` | 58 |
| `src/components/bot-settings/ProposalStatus.tsx` | 28 |
| `src/components/bot-settings/ProposalStatus.test.ts` | 197 |
| `src/components/bot-settings/ModelSection.tsx` | 166 |
| `src/components/bot-settings/ModelSection.test.ts` | 138 |
| `src/components/bot-settings/PermissionsSection.tsx` | 200 |
| `src/components/bot-settings/PermissionsSection.test.ts` | 191 |

Ranges: `src/state/store.tsx` 470-491, 1365-1395, 1526-1560, 2805-2880.
`src/state/bot-patch-queue.ts` 83-240, 315-340.

**The bot panel and `SOUL.md`** (15 files, 2,469 lines)

| File | Lines |
|---|---|
| `src/components/SoulField.tsx` | 124 |
| `src/components/bot-panel/SoulChanges.tsx` | 39 |
| `src/components/bot-panel/SoulChanges.dom.test.ts` | 66 |
| `src/components/bot-panel/SettingsPage.tsx` | 288 |
| `src/components/bot-panel/PanelShell.tsx` | 189 |
| `src/components/bot-panel/PanelShell.dom.test.ts` | 442 |
| `src/components/bot-panel/page-registry.ts` | 94 |
| `src/components/bot-panel/page-registry.test.ts` | 54 |
| `src/components/bot-panel/pages.tsx` | 474 |
| `src/components/bot-panel/DetailsTab.tsx` | 106 |
| `src/components/bot-panel/DetailsTab.test.ts` | 40 |
| `src/components/bot-panel/bot-actions.ts` | 102 |
| `server/bot-overview.ts` | 312 |
| `src/testing/bot-settings.tsx` | 89 |
| `scripts/verify-bot-settings.ts` | 50 |

Ranges: `src/lib/soul.ts` 1-14, `src/lib/memory.ts` 135-141,
`server/index.ts` 2925-2995, 14540-14680.

Total: 92 files, 16,698 lines (counted with `wc -l`), read completely. Nothing in `enterprise/`
was opened.

### 2.2 Checks of the main session

The main session read these lines again at `83d18e3af`. All agree with the
reports, except where the table says so.

| Claim | Lines | Result |
|---|---|---|
| The log is `history.ndjson`. Rows go through a queue for each bot, and `.catch(() => {})` drops write errors | `server/profile-versions.ts:28-31`, `:65-81` | agrees |
| `writeRows` skips the write when the bot folder is missing | `server/profile-versions.ts:66` | agrees |
| `readHistory` reads at most 8 MiB and 500 rows. Rollback asks for `Number.MAX_SAFE_INTEGER` rows | `server/profile-versions.ts:30`, `:142`, `server/index.ts:14650` | agrees |
| Rollback checks `expectedRevision`, then works only for a soul row with `canRestore` | `server/index.ts:14645-14656` | agrees |
| The revision hash has the seven fields and `lastProfileRequestId` | `server/profile-revision.ts:5-26` | agrees |
| A proposal applies at once at every level, except in a Cloud turn that the owner did not drive | `server/direct-apply.ts:17-20`, `server/index.ts:3037-3039` | agrees. One subagent read the UI marker text and said "needs a confirm card". The code says no |
| `validateBotCwd` accepts each existing absolute folder. `propose_profile` does not call `sharedProjectFolder` | `server/bot-cwd.ts:9-25`, `:38-54`, `server/profile-requests.ts:138-143`, `:498-502` | agrees |
| The preset store loads an empty state after a parse error, and the next save writes over the file | `server/presets.ts:151-168`, `:250-269` | agrees |
| `profile-learned.json` loads empty lists after a parse error | `server/profile-learned.ts:46-48`, `:88-90` | agrees |
| A PATCH with a soul saves the other fields first and the profile second | `server/routes/bot-patch.ts:747-753` | agrees |
| The soul prompt block still says "proposed changes apply only after the user confirms" | `server/bot-folder.ts:80` | agrees |
| The `SOUL.md` mirror at the start and at create is written with `durable: false` | `server/store.ts:328`, `:1318`, `server/bot-folder.ts:26-31` | agrees |
| The simple panel tests the driver name `antigravityAgent` | `src/components/bot-panel/SettingsPage.tsx:62-63` | agrees |
| `bots.newBotTemplate` is an app setting that a bot can write. All writable entries have tier `safe` | `server/app-settings/registry-config.ts:91-96`, `server/app-settings/registry.ts:48` | agrees |
| Duplicate is a POST, then a PATCH | `src/state/store.tsx:2497-2516`, `src/lib/bot-duplicate.ts:29-44` | agrees |
| Undo in the simple panel gets a new revision just before it posts | `src/components/bot-panel/SoulChanges.tsx:23-25` | agrees |
| The overview says "Profile proposal cards require your approval." when the level is not Full | `server/bot-overview.ts:266` | agrees. The text is wrong at this commit (section 8) |
| With `--setting-sources project`, the Claude CLI still reads `<launch folder>/.claude/settings*.json` | `server/agents-bridge-switch.ts:232-234` | agrees. This is a comment of the reference |
| The default approval level is Full | `packages/phone-protocol/src/approval-mode.ts:76` | agrees |
| 64 fixed random names | `server/names.ts:1-20` | agrees |

## 3. How it works

### 3.1 The profile fields and their checks

1. The limits are in `BOT_PROFILE_LIMITS` (`shared/bot-profile.ts:5-11`):
   name 100 characters, title 200, description 4,000, voice 200, soul
   24,000 UTF-8 bytes.
2. `fitsOnOneLine` refuses control characters, U+2028 and U+2029 in the name
   and the title (`shared/bot-profile.ts:13-23`). A name is quoted on one
   line in prompts, so a new line could add text to the prompt.
3. One parser, `parseBotProfilePatch`, has two modes
   (`server/bot-profile.ts:42-149`):
   - Strict, for paired devices and for proposals: an unknown key gives
     "unsupported profile field: X" (`:115-123`). Tests show that strict
     mode refuses `autoApprove`, `approvalMode`, `cwd`, `composio` and
     `chiefOfStaff` (`server/bot-profile.test.ts:6-23`).
   - Lenient, for the PATCH of the desktop: unknown keys are dropped.
   - `avatarUrl` of `""` or `null` clears the picture (`:145-147`).
4. The window sets only `maxLength`. The description shows a counter above
   3,000 characters (`src/components/bot-settings/IdentitySection.tsx:104-108`).
   An over-limit soul is not sent. It stays in the text box with a red ring
   and a byte counter (`src/lib/soul.ts:12-14`,
   `src/components/SoulField.tsx:44-48`, `:106`, `:118-119`).

### 3.2 A person changes the profile

The desktop has two routes.

1. `PATCH /api/bots/:id/profile` is strict
   (`server/routes/bot-settings.ts:108-130`).
   - On a Cloud home, only the owner session or a person with "edit" access
     can change name, title, description, soul or notifications. Others get
     403 (`:116-122`).
   - It logs the change with actor `user` and via `api` (`:126`).
2. `PATCH /api/bots/:id` is lenient and also takes the runtime and access
   fields (`server/routes/bot-patch.ts:115-795`).
   - A paired device counts as "chat" access. A member goes through
     `memberBotPatchViolation`. "edit" adds connector, MCP and tool fields.
     "view" can send only `unread` (`:121-135`,
     `server/request-auth.ts:568-596`).
   - The route finds changes that widen access ("loosening") at
     `:625-663`. Its comment says: "Known gap: outside the packaged
     desktop, loopback is the owner, so these loosenings are one curl from
     the bot they constrain." A loopback caller with no session can loosen
     only while each bot is idle (`:625-626`).
   - When the patch has a soul, the route saves the runtime fields first,
     then the profile fields: two saves (`:747-753`). A test shows that
     the first save stays when the second fails
     (`server/routes/bot-patch.test.ts:304-314`).
   - It logs each change as actor `user`, via `api`, whoever sent it
     (`:782-785`).
3. `store.patchBotProfile` merges the patch, sets `soulHash` and
   `soulDrift: false`, saves `bots.json`, then writes the `SOUL.md` mirror
   (`server/store.ts:1518-1535`). A failed mirror write gives only a
   warning in the log.
4. The window queues each edit. There is no Save button. Each field
   dispatches `updateBot` (`src/components/bot-settings/useBotSettingsDerived.ts:70`).
   - The store applies the edit at once in the window, then puts it in a
     queue for the bot (`src/state/store.tsx:1526-1555`, `:2809-2813`).
   - The queue merges edits and sends after a pause of 400 ms
     (`src/state/bot-patch-queue.ts:160`, `:213-236`).
   - On an error, it reads the server copy again before it rolls back
     (`:189-203`).
   - It sends what is left on `pagehide` and `beforeunload`, with
     `keepalive` for less than 60,000 bytes (`:316`, `:321-335`).
   - Name, title and description send a patch on each key press
     (`IdentitySection.tsx:66`, `:76`, `:100`).

### 3.3 The version log

1. `recordProfileChange(botId, actor, via, before, after)` compares the
   seven fields and makes one row for each changed field
   (`server/profile-versions.ts:84-101`).
2. A row has `id`, `at`, `actor`, `via`, `field`, `summary`, `before`,
   `after`, `canRestore` and `restoreUnavailableReason` (`:14-25`).
   - `actor` is `user`, `bot`, `file`, `import` or `system` (`:12`).
   - `via` is `ui`, `api`, `card:<id>`, `rollback`, `undo:<id>` or
     `library`.
3. A soul row keeps the full `before` and `after` text. Other fields are
   cut to one line of 200 characters (`:29`, `:40-49`).
4. The text goes through `redactSecrets` before the write (`:52`, `:69`).
   `canRestore` is true only for a soul row whose `before` text did not
   change in redaction (`:51-63`). A test shows that an `sk-ant-…` key does
   not reach the disk (`server/profile-versions.test.ts:97-114`).
5. The row goes to a promise queue for the bot (`:73-82`).
   - `writeRows` returns with no write when the bot folder is missing
     (`:66`).
   - `appendFile` writes with mode 0600 and no disk sync (`:70`).
   - `.catch(() => {})` drops each error (`:76-77`).
   - There is no debounce.
6. `flushProfileHistory` waits for the queue of one bot.
   `flushAllProfileHistory` waits for all queues (`:103-109`). The server
   calls them before the overview and history reads
   (`server/index.ts:2960`, `:14626`, `:14643`), before a backup
   (`:11903`) and at shutdown (`:15216`).
7. `readHistory` reads only the last 8 MiB of the file, and at most 500 rows
   (`server/profile-versions.ts:118-160`). It skips a torn line, and gives a
   row with no id a stable id from its offset and text (`:150-153`).
8. Nothing trims the file. A search found no other code that writes or
   trims it.
9. `soulChanges` turns soul rows into diffs for the panel (`:163-174`).

### 3.4 Rollback (Undo of a soul change)

1. `GET /api/bots/:id/history` flushes the queue, then returns
   `{rows, revision}` (`server/index.ts:14622-14639`).
   - `limit` is 1 to 500, default 100.
   - `view=changes` gives diffs.
   - A soul row has no `before` and `after` text unless `full=1`.
2. `POST /api/bots/:id/history/rollback {id, expectedRevision}`
   (`server/index.ts:14640-14667`):
   1. It flushes the queue, then finds the bot. None: 404.
   2. A different revision: 409 "This bot's profile changed; reload history
      before undoing".
   3. It looks for the row in `readHistory(id, MAX_SAFE_INTEGER)`. That read
      gives at most 500 rows, so an older row is not found.
   4. No row, a row that is not a soul row, or no `before` text: 400
      "rollback is available for SOUL.md entries only".
   5. `canRestore` false: 400 with the reason.
   6. It parses the `before` text with the strict parser, sets the soul,
      and logs actor `user`, via `rollback`. The log keeps the newer text in
      its new row, so the rollback is not lost
      (`docs/verification/bot-settings.md:33-38`).
3. The advanced History section asks first: "Restore previous
   instructions?" (`src/components/bot-settings/useBotOverview.tsx:162-179`).
   It sends the revision of the history that it shows (`:156`). So a change
   after the person read the list gives 409.
4. The simple panel (`SoulChanges`) shows the last five soul changes. Its
   Undo has no confirm step. It flushes the edits, reads the history again
   to get the newest revision, and posts at once
   (`src/components/bot-panel/SoulChanges.tsx:9`, `:19-31`). So the
   revision check only finds a change made in that short time. An Undo of
   an older row removes all later changes of the soul. The log keeps them,
   so the person can get them back by hand.

### 3.5 `SOUL.md`: the mirror and drift

1. The canonical soul is `BotRecord.soul` in `bots.json`. The file
   `<data folder>/bots/<bot id>/SOUL.md` is a copy
   (`docs/superpowers/specs/2026-09-05-bot-folder-and-self-setup-design.md:21-23`,
   `server/bot-folder.ts:1-20`). The folder is outside the workspace that
   the bot can write to. So a bot that reads untrusted text cannot keep
   that text in its own instructions (`server/bot-folder.ts:1-2`).
2. `writeSoulMirror` makes the folder with mode 0700 and writes the file
   atomically with mode 0600 (`:28-31`). With `durable: false` it skips the
   disk sync. A power loss can then leave an empty file, which reads as
   drift (`:26-27`). The start and the create use `durable: false`
   (`server/store.ts:328`, `:1318`).
3. `readSoulDrift` reads at most 24,001 bytes (`server/bot-folder.ts:36-61`).
   - More than 24,000 bytes: it throws status 400, "SOUL.md exceeds 24000
     bytes; shorten it in your editor" (`:49-51`).
   - A missing file: it writes the mirror again, and returns no drift
     (`:54-57`).
   - Another read error: it throws. It does not write over the file.
   - The SHA-256 of the file is the same as `soulHash`: no drift. Else:
     drift, with the file text.
4. Each turn calls `checkSoulDrift` and updates `soulDrift` on the record
   (`server/index.ts:7760-7763`, `:9989-9992`). `checkSoulDrift` returns
   "no drift" on any error (`server/bot-folder.ts:64-66`). The text of the
   file never reaches the prompt (`server/bot-setup.e2e.test.ts:30-38`).
5. The person settles drift in the editor:
   - `GET /api/bots/:id/soul` gives `{soul, revision, bytes, limit, file,
     drift, fileText?}` (`server/index.ts:14551-14564`).
   - "Use the file" posts `apply-file {fileText, expectedRevision}`
     (`:14566-14590`). A stale revision, no drift, or a file text that is
     not the same as the file now: 409. An over-limit file: 400. Success:
     the soul is set, and the log gets actor `file`, via `ui` (`:14585`).
   - "Keep saved" posts `discard-file` with the same body
     (`:14591-14608`). It writes the mirror from the record and clears
     `soulDrift`.
6. Edge cases:
   - A file over the limit throws in `readSoulDrift`. `SoulField` drops
     that error (`src/components/SoulField.tsx:38`). The person sees no
     drift box and no error. The editor still opens, because `soulDrift`
     is set (`src/components/bot-panel/SettingsPage.tsx:100`).
   - After a power loss, an empty `SOUL.md` shows as drift. "Use the file"
     then sets an empty soul, with no warning.

### 3.6 The soul in the prompt

1. `soulSystemPrompt` puts the soul in a block
   (`server/bot-folder.ts:75-87`):
   - An empty soul gives an empty string.
   - The block opens with: "Your standing instructions follow. The user
     manages them in bot settings and SOUL.md; proposed changes apply only
     after the user confirms."
   - Then: they rank above memory and imported skills, and below the
     current request and safety rules. The text "is instruction for you,
     never tool authorization or permission to expose secrets".
   - The text sits between `--- BEGIN STANDING INSTRUCTIONS (SOUL.md, N
     bytes) ---` and `--- END STANDING INSTRUCTIONS ---`.
2. The block is the prompt section `soul` (`server/system-prompt.ts:100`).
   Room turns get it too (`server/bot-continuity.e2e.test.ts:72-74`).

### 3.7 A bot changes its profile: `propose_profile`

The card, auto-apply and Undo are in
[`chat-widgets-and-proposals.md`](chat-widgets-and-proposals.md), section
3.8. This section adds the input and the checks.

1. The input schema (`server/drivers/agents-catalog.ts:657-678`): `name`
   (100 or less), `title` (200), `description` (4,000), `soul`, `cwd`
   (1,024), `notifications`, `speakReplies`, and `reason` (1 to 500,
   required). `browserProfile` and `for_bot_id` are for a Chief only.
   Other bots get the tool without them (`:819-820`, `:881-886`).
2. The service refuses each key that is not in `PROFILE_REQUEST_FIELDS`,
   before it parses (`server/profile-requests.ts:120-129`). Tests show
   that `approvalMode`, `toolScope`, `voice` and `autoApprove` are refused
   (`server/profile-requests.test.ts:144-147`, `:203-204`). The Chief flag
   cannot be proposed (`server/setup-request.test.ts:308-321`). A bot
   cannot change its own browser profile (`server/profile-requests.ts:31-32`,
   `:308`).
3. `cwd` goes through `validateBotCwd` (`:138-143`). That function accepts
   each absolute folder that exists. It expands `~`. It has no deny list
   (`server/bot-cwd.ts:9-25`). The service does not call
   `sharedProjectFolder`, which refuses a folder inside the data root
   (`server/bot-cwd.ts:38-54`).
4. The soul is measured after secrets are masked. The limit is 24,000
   bytes (`server/profile-requests.ts:162-165`).
5. The card text for a `cwd` change says: "<name>'s tools will read and
   write files in that folder." (`:217`).
6. `appliesDirectly` gives "full-access" or "level" for each local turn
   (`server/index.ts:3037-3039`, `server/direct-apply.ts:17-20`). So the
   change applies at once at Ask too. A test shows a `cwd` change that
   applies at Ask, with Undo only (`server/profile-requests.test.ts:527-541`).
   The card waits for a person only in a Cloud turn that a guest or a
   webhook started.
7. The profile and the receipt `lastProfileRequestId` go to the store in one
   write. So a crash between them does not apply the change two times
   (`server/profile-requests.ts:461-468`, test `:355-369`).
8. `recordAutoApplied` drops its own error. A card can then have no Undo
   (`:371-385`).
9. A cap of 8 open cards for each conversation applies only to the path of
   the owner card, with 429 (`server/index.ts:11009-11026`).

### 3.8 `/setup`: set-up by conversation

1. `/setup [words]` must be the first word, in any case
   (`server/setup-mode.ts:3-9`). The server changes the text of that turn
   to "Set yourself up for this job: <words>", or to "Set yourself up. Ask
   me what you need to know, then propose your configuration." (`:11-17`).
   This happens only when the agents tools are mounted
   (`server/index.ts:7713`).
2. Set-up starts only on `/setup` (`server/setup-mode.ts:19-21`). An empty
   profile started it before commit `50362a940`
   (`docs/verification/bot-continuity.md:13-16`).
3. The prompt block for that turn (`server/setup-mode.ts:84-109`) tells
   the bot to:
   1. ask at most four questions: the job, when it runs, which apps or
      accounts, and which folder.
   2. say its plan in plain words before any tool call.
   3. send one message, then make the tool calls.
   4. continue when a change applied, and end the turn when a change waits.
   5. use `propose_profile` for identity, rules and folder, `trigger` for a
      schedule or a webhook, and `request_credential` for a missing token.
   The block also says "changes to your own profile and routines apply
   immediately, and the person sees each with an Undo" (`:88`). For a
   Chief, one clause keeps it the Chief. The block applies to that turn
   only (`server/bot-continuity.e2e.test.ts:54-56`).
4. The setup card shows under the greeting of a blank bot
   (`src/components/SetupOffer.tsx`):
   - five answers and "Something else", with keys A to H, a close button
     and a waiting chip.
   - only when the model has the capability `agentsMcp` (`:58-59`).
5. `POST` and `DELETE /api/bots/:id/setup-request`
   (`server/routes/setup-request.ts:25-70`):
   - A pick has 1 to 500 characters. A second pick while one sends is
     blocked.
   - "Something else" adds a line from the bot and marks the conversation.
     The mark stays after a restart (`server/setup-request.ts:50-66`, test
     `:98-106`).
   - `takeSetupRequest` marks the next line of the person and runs it as
     `/setup <words>` (`server/setup-request.ts:113-139`,
     `server/index.ts:7580`).
   - In a shared place, only the person who pressed can use or close it.
     An owner or an admin can also close it.
6. The settings Overview has "Set up with the bot". It shows only when the
   engine has `agentsMcp` and the bot is not busy. It closes the panel and
   sends `/setup` to the main thread
   (`src/components/BotSettingsDialog.tsx:117-120`).

### 3.9 New bot and its defaults

1. A new bot has no fixed defaults in code. The person saves a template in
   `config.json` under `newBotDefaults` (`server/config.ts:296`). Its shape
   is `{profile, memory, skills, routines}` (`shared/new-bot-defaults.ts:33-38`).
2. The limits of the template (`server/new-bot-defaults.ts:105-113`):
   - memory: `MEMORY.md` or `memory/<name>.md`, 256 KiB each, 100 files.
   - skills: 100. Routines: 100. The whole template: 900 KB.
   - name: 100 characters, one line. Department: 60 characters.
   - The profile is `.strict()`, so consent and grant fields are refused
     (`:31-58`, test `:19-21`).
   - A read removes the old fields `peers` and `approvePeerComms` (`:22-29`).
3. The profile of the template can hold access settings: `approvalMode` up
   to Full, `alwaysAllow`, `mcpServers`, `composio` and `toolScope`
   (`:39-52`).
4. A save replaces the whole template (`server/config.ts:923-924`). It also
   sets or deletes `defaultModelSelection` (`:925-929`).
5. A bot can replace the template with the app setting
   `bots.newBotTemplate` (`server/app-settings/registry-config.ts:91-96`).
   All writable entries have tier `safe` (`server/app-settings/registry.ts:48`),
   so the change applies at once with Undo. The design spec lists the
   entry as "confirm"
   (`docs/superpowers/specs/2026-11-12-app-settings-tool-design.md:209`).
6. `resolveBotCreationDefaults` merges, in this order: the template, then
   `body.settings`, then the name, title, description, model and
   department of the body (`server/new-bot-defaults.ts:140-156`).
   `useDefaults: false` skips the template (`:144`). A blank name is
   removed, so the server picks a random name (`:154`).
7. `POST /api/bots` (`server/routes/bots-create.ts:111-313`):
   1. Refusals: Custom approval: 403 (`:156-158`). Full on a hosted
      workspace: 403 (`:159`). Auto on this computer needs
      `acknowledgeLocalAuto` (`:160-162`).
   2. A withdrawn organization preset: 404 "That preset is no longer
      available…" (`:148-153`).
   3. The bot limit is checked after all waits: 409 (`:223-225`).
   4. `store.createBot` makes the record: empty title, description and
      soul, and notifications on (`server/store.ts:1282-1286`). The colour is a
      starter colour that no other bot has (`server/routes/bots-create.ts:232`).
      The template merges in before the one save (`server/store.ts:1312-1317`).
   5. On the desktop, a bot with no computer gets "local" (this computer),
      except at approval Auto (`server/routes/bots-create.ts:40-42`, `:244`).
   6. Memory, preset and skills are written after the record. Routines are
      made switched off, then switched on (`:252-303`).
   7. If a step throws, the route removes the routines and deletes the bot
      (`:285-289`).
8. The default approval level is Full
   (`packages/phone-protocol/src/approval-mode.ts:76`). Bots from a preset
   also start at Full (`docs/verification/presets.md:31-32`, commit
   `593fd1c5a`).
9. Random names: 64 fixed names, from "Scout" to "Turnip". The server picks
   a free name at random, with no regard to case. When all are used, it
   adds " 2", " 3" and on (`server/names.ts:1-20`). `GET /api/bot-defaults`
   gives `suggestedName` (`server/index.ts:14528`).
10. Since commit `a9d725204`, the New bot button makes the bot at once,
    with no dialog. `NewBotDialog` is now the editor of "Defaults for new
    bots" (button "Save defaults"), and the review of a ready bot from the
    Templates gallery (button "Create bot")
    (`src/components/NewBotDialog.tsx:44-54`, `:164`, `:221`).

### 3.10 Presets

1. A preset comes from a file or from an organization (`server/presets.ts:40`).
   There are no built-in presets. The list starts empty
   (`server/presets.e2e.test.ts:33`). The "Built-in roles" of the dialog
   are the six ready bots: assistant, inbox, research, coder, community and
   ops (`src/components/NewBotDialog.tsx:283-351`,
   `src/lib/ready-bots.ts:381`).
2. A preset can set only: name, title, description, soul, look, playbooks,
   skills (30 or less) and seed notes (1 MB or less, "daily logs never
   travel"). It cannot set approval, computer, browser, MCP, apps or model
   (`shared/package-format.ts:390-405`, `server/presets.ts:1`).
3. The store is `<data folder>/org-library/presets.json`:
   `{version: 1, presets[], content{installId: {skills, playbooks}}}`, with
   200 rows or less (`server/presets.ts:32`, `:35`, `:67-73`). It is written
   atomically with mode 0600 (`:175`).
4. Each use parses each stored row again with the package parser. A changed
   row is dropped (`:95-127`, test `:175-182`).
5. Import:
   - The same file content is stored one time (`:177-180`, `:238-242`).
   - An organization install updates its rows and removes keys that are
     gone (`:206-236`).
   - `POST /api/teams/import` always stores the source "file", also with
     `trust: "org"` in the body (`server/presets.e2e.test.ts:45-53`).
6. A "withdrawn" or "removed" organization install is hidden (`:286-290`).
   A bot that has it keeps the skill, switched off
   (`server/presets.e2e.test.ts:146-151`).
7. Apply (`server/presets.ts:353-401`): the route records `installedPackage`
   and the playbooks, installs the skills (off for a file, on and stamped
   for an organization), and writes the notes. The steps are not in one
   transaction.
8. `GET /api/bot-presets` and `DELETE /api/bot-presets/:id` are for an
   admin. Delete of an organization preset: 409 "...managed in Admin."
   (`server/routes/bot-presets.ts:11-19`).
9. Commit `05948b876` removed preset sharing and the library export. The
   documents still describe `includeDefaultsPreset` and `kind: "library"`
   (`docs/presets.md:93-97`, `docs/verification/presets.md:19-26`). The
   server code has neither.

### 3.11 Duplicate a bot

1. The sidebar menu has Duplicate (`src/components/SidebarBotMenu.tsx:291`,
   `:450`). The window stops at the bot limit (`src/state/store.tsx:2497`).
2. Step 1: `POST /api/bots` with `restrictedCopyRequest`: visibility,
   `toolScope` and `helperModel: false`
   (`src/lib/bot-duplicate.ts:16-26`). So the copy is restricted from its
   first moment (`:1`). A team User sends `{}` (`:17`).
3. Step 2: `PATCH /api/bots/:id` with `duplicateBotProfile`
   (`src/lib/bot-duplicate.ts:29-44`): "<name> copy", title, description,
   soul, notifications, model, the avatar fields, and, except for a team
   User, the computer and VPS fields.
4. Not copied: approval level, `alwaysAllow`, apps, MCP servers, browser,
   `cwd`, department, colour, voice, the Chief flag, playbooks, skills,
   memory, routines and history.
5. The POST has no `useDefaults: false`. So the copy gets the approval,
   apps, memory, skills and routines of the New-bot template, not of its
   source. If the template says Custom, Duplicate fails with 403
   (`server/routes/bots-create.ts:156-158`).
6. The two requests have no rollback. If the PATCH fails, a bot with the
   template settings and no copied profile stays.
7. A Chief can copy a bot with `create_bot` and `copyFromBotId`. That copies
   only soul, role and model, from a bot that the Chief manages, else 404.
   The combined soul must fit in 24,000 bytes
   (`server/create-bot-fields.ts:16-32`).
8. The plan of 2026-08-31 wanted `POST /api/bots/:id/clone` on the server,
   and a clone that starts inert: skills off, routines paused, apps off
   (`docs/superpowers/plans/2026-08-31-02-bot-profile.md:185`). The
   reference did not build it.

### 3.12 The plan compared with what was built

| The plan of 2026-08-31 | Built at `83d18e3af` |
|---|---|
| One `BotProfileDocument` with identity, engine, execution, autonomy, budget, connectors, skills, playbooks, routines and memory sizes (plan `:69-80`) | No. The fields stay on the bot record. `server/profile-document.ts` does not exist |
| `applyProfile`: all or nothing, with a list of changed paths (`:103-115`) | No. Two PATCH routes, and the soul PATCH saves in two steps |
| The log: `profile-versions/<bot id>.ndjson`, mode 0600, redacted, not awaited (`:51`, `:129-145`) | Yes, in a different place: `bots/<bot id>/history.ndjson`, one row for each field of seven |
| Rollback of the whole profile to a time, with a new row (`:158-166`) | Only the soul, by row id, with the revision check |
| Export without memory, budget, grants, folder or engine (`:180-184`) | Part 44, not read here. No `/export` route on the bot |
| Clone that starts inert (`:185`) | Duplicate in the window, with the template settings |
| "Restore this version" with a confirm step, Export, Duplicate (`:199-203`) | Undo of a soul row. A confirm in Advanced mode only |

## 4. The data

| What | Where | Shape | Lines |
|---|---|---|---|
| Profile fields | `bots.json`, the bot record | `name`, `title`, `description`, `soul`, `soulHash`, `soulDrift`, `cwd`, `notifications`, `speakReplies`, `browserProfile`, `lastProfileRequestId`, avatar fields | `server/store.ts:1518-1535`, `server/profile-revision.ts:5-17` |
| Limits | code | name 100, title 200, description 4,000, voice 200 characters, soul 24,000 bytes | `shared/bot-profile.ts:5-11` |
| `SOUL.md` | `<data folder>/bots/<id>/SOUL.md`, folder 0700, file 0600 | the soul text | `server/bot-folder.ts:11-31` |
| Version log | `<data folder>/bots/<id>/history.ndjson`, 0600, append only | `{id, at, actor, via, field, summary, before?, after?, canRestore?, restoreUnavailableReason?}` | `server/profile-versions.ts:14-34` |
| Revision | computed | SHA-256 of the seven fields and `lastProfileRequestId` | `server/profile-revision.ts:19-26` |
| Proposal card | a chat message | `profileRequest {requestId, botId, threadId, targetBotId, targetName, createdAt, reason, changes, before, expectedRevision}` | [`chat-widgets-and-proposals.md`](chat-widgets-and-proposals.md) section 4.3 |
| New-bot template | `config.json`, `newBotDefaults` | `{profile, memory, skills, routines}`, 900 KB or less | `shared/new-bot-defaults.ts:33-38`, `server/new-bot-defaults.ts:105-113` |
| Presets | `<data folder>/org-library/presets.json`, 0600 | `{version: 1, presets[], content{}}`, 200 rows or less | `server/presets.ts:32-73` |
| "About me" facts | `<data folder>/profile-learned.json` | `{learned[], removed[], forgotten[]}` | [`memory.md`](memory.md), `server/profile-learned.ts:11-34` |
| Window settings | `localStorage` | `omb-advanced-mode`, `<app>.lastBotSection.v1` | `src/lib/interface-mode.ts:7`, `src/lib/last-bot-section.ts:3` |

Routes of this feature:

| Route | What | Lines |
|---|---|---|
| `PATCH /api/bots/:id/profile` | strict profile change | `server/routes/bot-settings.ts:108-130` |
| `PATCH /api/bots/:id` | lenient change of all fields | `server/routes/bot-patch.ts:115-795` |
| `GET /api/bots/:id/soul` | soul, revision, drift | `server/index.ts:14551-14564` |
| `POST /api/bots/:id/soul/apply-file`, `/discard-file` | settle drift | `server/index.ts:14566-14608` |
| `GET /api/bots/:id/history` | the log | `server/index.ts:14622-14639` |
| `POST /api/bots/:id/history/rollback` | soul Undo | `server/index.ts:14640-14667` |
| `POST /api/internal/profile-requests` | `propose_profile` | `server/index.ts:13213-13242` |
| `POST`, `DELETE /api/bots/:id/setup-request` | the setup card | `server/routes/setup-request.ts:25-70` |
| `POST /api/bots` | new bot | `server/routes/bots-create.ts:111-313` |
| `GET /api/bot-defaults` | template and `suggestedName` | `server/index.ts:14528` |
| `GET /api/bot-presets`, `DELETE /api/bot-presets/:id` | presets | `server/routes/bot-presets.ts:11-19` |
| `GET /api/bots/:id/overview`, `/system-prompt` | the Overview and the prompt preview | `src/components/bot-settings/useBotOverview.tsx:72-95` |

## 5. The UI

### 5.1 Two modes, one panel

- One `<aside role="dialog">` shows the settings of a bot. In Simple mode it
  shows `BotPanel`. In Advanced mode it shows the dialog with sections
  (`src/components/BotSettingsDialog.tsx:54-55`, `:174-190`).
- Simple mode is the default on a new install (commit `b9ab44b97`).
  `DESIGN.md` says: "Advanced adds; it doesn't rearrange" and "Switching
  modes never loses data" (`DESIGN.md:385`, `:394`).
- `DESIGN.md` also says (`DESIGN.md:54-68`):
  - Settings for one bot live in its bot panel.
  - No new settings, except under Settings → Features.
  - No new asks or confirm dialogs, and no default below Full: "a change
    that needs undoing gets Undo".
  - `/setup` in the chat instead of form fields.

### 5.2 The Advanced dialog

1. A header with the name, Share and a close button, a search box, then an
   accordion (`BotSettingsDialog.tsx:190-282`).
2. The sections, in order (`src/components/bot-settings/sections.ts:25-52`):
   Overview, Identity, Slack, Soul, Skills, Memory, Library, Routines,
   Access, Model, Permissions, Voice & alerts, Who can see it, History,
   Usage.
   - Slack shows only with a Slack management address.
   - "Who can see it" shows only to an owner or admin, not in the desktop
     shell, and not on a team (`BotSettingsDialog.tsx:60-62`).
3. Search matches the English label, the translated label, keywords and
   translated inner headings. For Access it also matches the names of
   connected apps (`sections.ts:61-67`). Empty results: "Looking through
   connected apps…", then "Nothing matches “q”" (`:75-77`).
4. One section is open at a time. A click on the open row closes it
   (`BotSettingsDialog.tsx:238`, `:249-253`). Only the open section is
   mounted, except Memory, which stays mounted and hidden so that its
   draft stays (`:271-278`). Typing in search closes the open section
   (`:211-214`).
5. Escape closes the panel. It does not close it when a nested dialog is
   open, when the key came from outside, or when an inner handler called
   `preventDefault`. In the search box, the first Escape clears the text
   (`:81-103`, `:215-220`).

### 5.3 The sections of this feature

- **Overview** (`OverviewSection.tsx:28-168`), from top to bottom:
  - "Loading…", or a banner when a reload failed and old data shows.
  - "Setup ideas" ("You can start chatting now."), with steps that open
    their section, and "Set up with the bot".
  - Who, with "Read all", which opens Soul.
  - Does, Can reach, Won't.
  - the prompt preview, closed at first.
  - Recent changes, with "View all", which opens History.
  - The data comes from `server/bot-overview.ts`, with no I/O. The "who"
    part has the first paragraph of the soul, cut at 240 characters
    (`:84-89`). The identity step is done only when the name is not "New
    bot", "Bot" or "Untitled" (`:289`). The text is English and fixed.
- **Identity:** name, title and description. In the New-bot editor it adds
  random-name buttons (`IdentitySection.tsx:50-57`).
- **Soul:** `SoulField`, with the byte counter and the drift box (amber,
  with the file text, "Use the file" and "Keep saved")
  (`src/components/SoulField.tsx:84-99`). A long description can move into
  the soul with "Move instructions into SOUL.md"
  (`BotSettingsDialog.simple.test.ts:826-833`).
- **Prompt preview:** "Prompt preview · N bytes ≈ M tokens". Each part is a
  `<details>` with its label, its bytes, its full text and the note of the
  server (`PromptPreview.tsx:6-60`). The window does no redaction.
- **History:** rows from newest to oldest, as "when · actor via via ·
  summary" (`HistorySection.tsx:37-55`). "Undo this change" shows only on a
  soul row with `canRestore`. Else the row shows the reason, or "The exact
  previous instructions are unavailable…" (`:56-71`). Undo is off until the
  revision is known (`BotSettingsDialog.tsx:162`). An error shows "Couldn't
  undo that change." (`useBotOverview.tsx:137-153`).
- **Model:** the default model, "N threads use their own model" with
  "Switch them too", Reasoning, and "Keep prompt cache warm"
  (`ModelSection.tsx:15-61`). The backup models are a border feature.
- **Permissions:** the Chief switch, the approval level, "Apply Full access
  to all threads", "Manage command allowlist", and "Sending on your behalf"
  (`PermissionsSection.tsx:42-199`). Ask and Full apply to all threads.
  Auto on this computer shows a warning first.
- **Proposal markers** (`ProposalStatus.tsx:8-27`): "Chief-proposable:
  arrives as a card you confirm." and "Owner-only: never arrives as a
  proposal." They show only when another bot is the Chief of the
  department of this bot. The first text is wrong at this commit
  (section 8).

### 5.4 The simple bot panel

1. Three tabs: Details, Library and Computer (`page-registry.ts:4-11`). A
   gear opens the page "Bot settings" (`PanelShell.tsx:101-111`). There are
   nine simple pages. Each of the 15 sections maps to a tab or a page
   (`page-registry.ts:22`, `:74-90`).
2. Escape on a page goes back one page. On a tab it closes the panel
   (`PanelShell.tsx:80-93`).
3. The "Bot settings" page (`SettingsPage.tsx`):
   - Instructions: `SoulField` and `SoulChanges`, with "Done". Done sends
     the queue and does not wait for the result (`:109-145`, `:123`).
   - "Before {name} acts": Ask or Full. Another stored level shows as a
     disabled choice, "Change this in Advanced mode". A choice sends
     `{approvalMode, applyToAllThreads: true}` (`:65-75`).
   - The always-allowed list, with remove buttons only (`:172-186`).
   - Call mode, reply style, notifications, the Apps row, the job title
     (saved on blur or Enter), Slack, visibility, "More in Advanced mode",
     Bot API, Hide (`:190-284`).
4. The Details tab: model and Reasoning for this conversation. A Reasoning
   choice also becomes the default of the bot, for an owner or admin, when
   it does not need the level to go to Ask (`DetailsTab.tsx:56-65`).
5. The simple panel changed four times: four tabs (`0a46eb449`), two tabs
   (`61fd23221`), three tabs with a gear (`d8ad64820`), then memory, skills
   and folder moved to Details (`dd5496d61`).

### 5.5 The New-bot editor

`NewBotDialog` uses the same sections with `BotEditorContext {draft: true}`
(`BotEditorContext.tsx:5-9`): Identity, Soul, Skills, Memory, Routines,
Access, Model, Permissions and Voice & alerts. Model is hidden in Simple
mode (`NewBotDialog.tsx:36`, `:76`). The draft hides the proposal markers,
the thread lines, the backups, keep-warm, sending and the command
allowlist. "Starting role" offers "Custom settings", the preset groups
("From {org}", "Imported presets") and "Built-in roles"
(`NewBotDialog.tsx:283-351`). On a team Cloud, `NewBotName.tsx` asks for a
name first.

## 6. The tests

| Test | What it guarantees |
|---|---|
| `server/bot-profile.test.ts` | Strict mode refuses access fields. Limits and one-line names |
| `server/profile-versions.test.ts` | One row for each changed field. A key does not reach the disk (`:97-114`). A redacted soul row has `canRestore: false`. Legacy rows get a stable id |
| `server/routes/bot-patch.test.ts` | Who may change what. A soul PATCH saves in two steps, and the first stays when the second fails (`:304-314`) |
| `server/profile-requests.test.ts` | Refused keys (`:144-147`, `:203-204`). Masked secrets in the reason and the card (`:337-344`). One write for profile and receipt (`:355-369`). A `cwd` change applies at Ask with Undo (`:527-541`) |
| `server/profile-requests-browser-profile.test.ts` | Only a Chief changes a browser profile, and only of another bot |
| `server/profile-card-lifecycle.e2e.test.ts` | Auto-apply, Undo, `changed-since`, a superseded secret card |
| `server/bot-folder.test.ts` | Mirror modes, drift, the size refusal, a missing file written again |
| `server/bot-setup.e2e.test.ts` | Drift never reaches the prompt (`:30-38`) |
| `server/setup-mode.test.ts`, `server/bot-continuity.e2e.test.ts` | `/setup` parsing, the prompt block for one turn only, the soul in room turns |
| `server/setup-request.test.ts`, `server/routes/setup-request.test.ts` | The card picks, the mark after a restart, who may press, no Chief by proposal (`:308-321`) |
| `server/new-bot-defaults.test.ts`, `.e2e.test.ts` | The template limits, strict profile, removed old fields, Full for a new bot (`e2e :80-81`) |
| `server/routes/bots-create.test.ts` | One save with the template (`:114-126`), refusals |
| `server/presets.test.ts`, `.e2e.test.ts` | A changed row is dropped, withdrawn presets, no built-in presets, file source on import |
| `server/routes/bot-presets.test.ts` | Admin only. Delete of an organization preset gives 409 |
| `src/lib/bot-duplicate.test.ts` | Restrictions in the POST. What the PATCH copies. A team User sends no restrictions |
| `src/components/NewBotDialog.test.ts` | Save defaults, Create bot, starting roles |
| `HistorySection.test.ts` | Undo only on soul rows, the reason text, fails closed with no `canRestore` (`:85-90`) |
| `ProposalStatus.test.ts` | Where the markers show, and that a bot sees none for itself (`:117-120`) |
| `OverviewSection.test.ts`, `useBotOverview.test.ts`, `PromptPreview.test.ts` | Optional setup steps, translated old "section" words, reads after edits |
| `sections.test.ts` | Search by app name and by translated headings |
| `BotSettingsDialog.*.test.ts` | Escape (`escape.test.ts:60-72`), the header drag region, the Library section, the simple panel and its pages (1,609 lines) |
| `SoulChanges.dom.test.ts` | The labels of who changed the soul. Undo posts `{id, expectedRevision}` (`:47-66`) |
| `PanelShell.dom.test.ts`, `page-registry.test.ts`, `DetailsTab.test.ts` | Tabs, links, focus and Escape. Each section has a place |
| `src/testing/bot-settings.tsx`, `scripts/verify-bot-settings.ts` | A manual check page on a temporary server and data folder. It can delay reads and write an outside edit to `SOUL.md` |

No test checks:

- that a history row stays after a crash.
- that a rollback finds a row older than the last 500.
- that Undo in the simple panel keeps later changes.
- that `presets.json` or `profile-learned.json` stays after a parse error.

## 7. Ours compared

We have no profile, no soul and no history. `bot-desktop` has a settings
panel from step 1 (`crates/bot-desktop/ui/src/features/settings`) and a
bot list with mock bots. `bot-core` has only `lib.rs`. Under decision D10
the core runs in the desktop process, with no HTTP server. So each route
below becomes a Tauri command.

### 7.1 Where each part goes

| Part | Reference files | Our crate and module | Step |
|---|---|---|---|
| The profile fields, limits, one-line check | `shared/bot-profile.ts`, `server/bot-profile.ts` | `bot-protocol`, a new module `profile` (types and checks, no I/O) | new step |
| The bot record with the profile, and its save | `server/store.ts:1518-1535` | `bot-core`, the store of step 8 | 8, then the new step |
| The version log | `server/profile-versions.ts` | `bot-core`, a table in the SQLite store of step 8, written in the same transaction as the change | new step |
| Revision and rollback | `server/profile-revision.ts`, `server/index.ts:14622-14667` | `bot-core`, `profile` module | new step |
| `SOUL.md` mirror and drift | `server/bot-folder.ts` | `bot-core`, with the atomic write of step 6 | new step |
| The soul in the prompt | `server/bot-folder.ts:75-87` | `bot-core`, where a turn's text is built | new step |
| `propose_profile` | `server/profile-requests.ts`, `agents-catalog.ts:657-678` | `bot-engine`, our MCP server of step 12, and the change module of P142 | after the new step |
| `/setup` | `server/setup-mode.ts`, `server/setup-request.ts` | `bot-core`, turn text | after 15 and 16 (it uses `trigger` and `request_credential`) |
| The New-bot template | `server/new-bot-defaults.ts`, `server/config.ts:923-929` | `bot-core`, the settings of step 6 | new step |
| Random names | `server/names.ts` | `bot-core` | new step |
| Duplicate | `src/lib/bot-duplicate.ts` | `bot-core`, one command | new step |
| Presets | `server/presets.ts` | `bot-core`, later, with part 44 | later |
| The settings dialog and sections | `BotSettingsDialog.tsx`, `bot-settings/*`, `bot-panel/*` | `crates/bot-desktop/ui/src/features/settings` (D13, D16) | new step |

### 7.2 Which step

The feature row is group "later". No step has it. I propose a new step after
step 16, "The bot profile". The main session gives it its number. The step has these pull-request groups:

1. The types and checks in `bot-protocol`.
2. The profile in the store, the log table, rollback and the revision.
3. `SOUL.md`, drift, and the soul block in the prompt.
4. The dialog sections Identity, Soul and History, the New-bot template,
   random names and Duplicate.

`propose_profile` and `/setup` come after it, because they need the MCP
server (step 12), triggers (step 15) and credentials (step 16). Presets
wait for import and export (part 44).

One other choice is to move groups 1 to 3 to just after step 8. A bot with
no standing instructions is less useful, and step 8 gives the store. The
author decides (T1).

### 7.3 Where the reference breaks our rules in `AGENTS.md`

- "Every state change in the runtime writes the row and its event in one
  transaction before anything acts on it." The reference saves the change,
  then puts the history row in a queue that drops errors
  (`server/index.ts:14661-14664`, `server/profile-versions.ts:73-82`). A
  soul PATCH saves in two steps (`server/routes/bot-patch.ts:747-753`).
- "Engine behaviour is gated by capability flags on the driver, never by a
  driver's name." The panel tests `driverKind === "antigravityAgent"`
  (`src/components/bot-panel/SettingsPage.tsx:62-63`).
- Model output becomes standing instructions. A bot can write its own soul
  with `propose_profile`, and a Chief can write the soul of a teammate with
  `for_bot_id`. The change applies at once, at every level, with only Undo
  as the guard (`server/drivers/agents-catalog.ts:819-820`,
  `server/direct-apply.ts:17-20`). Each later turn of that bot then reads
  the text as instructions. Our rule that delegated turn text comes from
  stored data does not cover this case.

## 8. Where we can be better

1. **The history row and the change in one transaction.** Write the profile
   change and its log rows in one SQLite transaction.
   - Why: the reference saves the change, then appends the row with no
     disk sync, and drops each error (`server/profile-versions.ts:70`,
     `:76-77`). A crash or a full disk loses the row and its Undo, and the
     change stays. Our `AGENTS.md` rule asks for one transaction.
2. **No `cwd` change by a bot without a person, or a deny list at least.**
   A bot's change of its own working folder waits for the person. Or the
   folder must be outside the data folder, the home folder itself, and the
   engine config folders.
   - Why: `validateBotCwd` accepts each existing folder
     (`server/bot-cwd.ts:9-25`), and the change applies at once at Ask
     (`server/profile-requests.test.ts:527-541`). The card itself says that
     the tools "will read and write files in that folder"
     (`server/profile-requests.ts:217`). An earlier commit, `b09fcb083`,
     kept a card for `cwd` because "a new folder widens what its tools read
     and write without asking". Commit `761102925` removed it. The guard
     that already exists, `sharedProjectFolder` (`server/bot-cwd.ts:38-54`),
     is not used here.
3. **One truth about confirmation.** Three texts still promise a confirm
   step that the code does not have:
   - the prompt block: "proposed changes apply only after the user
     confirms" (`server/bot-folder.ts:80`). The setup block says the
     opposite (`server/setup-mode.ts:88`).
   - the marker: "Chief-proposable: arrives as a card you confirm."
     (`src/components/bot-settings/ProposalStatus.tsx:8-27`).
   - the Overview: "Profile proposal cards require your approval." when
     the level is not Full (`server/bot-overview.ts:266`).
   - Why: the bot and the person get a false picture of the guard. We
     build these texts from the same function that decides, so they cannot
     go apart.
4. **A load that fails gives a typed error, not empty defaults.** The
   preset store and `profile-learned.json` load empty after a parse error,
   and the next save writes over the file (`server/presets.ts:166-168`,
   `:250-269`, and `server/profile-learned.ts:46-48`, `:88-90`).
   - Why: section 5 of `changelog.md`, "A file written over after a failed
     read". Our answer is in step 6: `save` takes a value that only a
     successful `load` makes (P22, P76).
5. **Undo keeps later changes, and both views ask first.** A rollback makes
   a new version from the old text, and it warns when later changes exist.
   The simple panel has the same confirm as the Advanced dialog.
   - Why: `SoulChanges` reads a new revision just before it posts, with no
     confirm (`src/components/bot-panel/SoulChanges.tsx:23-25`). So the
     revision check does not protect the person. Only the Advanced dialog
     sends the revision that the person saw (`useBotOverview.tsx:156`).
6. **Rollback finds each row that the list shows, and the log has a size
   rule.** Look up a row by id in an index, not in the last 500 rows.
   - Why: rollback calls `readHistory(id, MAX_SAFE_INTEGER)`, but the read
     stops at 500 rows and 8 MiB (`server/index.ts:14650`,
     `server/profile-versions.ts:142`). Nothing trims the file. A SQLite
     table with an index fixes both.
7. **The New-bot template is not a safe setting for a bot.** A bot change
   to `bots.newBotTemplate` waits for the person, or it cannot raise the
   approval level or add grants.
   - Why: the template holds `approvalMode` up to Full, `alwaysAllow`, MCP
     servers and apps (`server/new-bot-defaults.ts:39-52`). A bot can
     replace it at once (`server/app-settings/registry-config.ts:91-96`,
     `registry.ts:48`). The design spec says "confirm"
     (`docs/superpowers/specs/2026-11-12-app-settings-tool-design.md:209`).
     Each later new bot, and each Duplicate, then gets the access that the
     bot chose.
8. **Duplicate is one command that copies the source, not the template.**
   - Why: the reference makes the copy with a POST and a PATCH, with no
     rollback (`src/state/store.tsx:2497-2516`). The copy takes approval,
     apps, skills and routines from the template, so it can have wider
     access than its source. The plan wanted a clone that starts inert
     (`docs/superpowers/plans/2026-08-31-02-bot-profile.md:185`). One
     command in `bot-core` with one transaction does both.
9. **Write the `SOUL.md` mirror with a disk sync, or do not show an empty
   file as drift.**
   - Why: `durable: false` at the start and at create can leave an empty
     file after a power loss (`server/bot-folder.ts:26-27`,
     `server/store.ts:328`, `:1318`). "Use the file" then empties the
     instructions with no warning.
10. **Show an over-limit `SOUL.md` as an error.**
    - Why: `readSoulDrift` throws, `SoulField` drops the error, and the
      person sees no drift box and no error
      (`server/bot-folder.ts:49-51`, `src/components/SoulField.tsx:38`).
11. **Capability flags, not a driver name.** The panel tests
    `antigravityAgent` (`SettingsPage.tsx:62-63`). Our rule is a capability
    flag such as "the engine runs Auto as Ask".
12. **The log names the real actor.** The PATCH route logs `user` / `api`
    for each caller (`server/routes/bot-patch.ts:782-785`). A paired device,
    a member and the desktop are different actors. Our command knows the
    caller.
13. **Less code: one profile parser and one route.** The reference has a
    strict and a lenient parser, two PATCH routes, and a separate soul
    route set. We have one typed patch in `bot-protocol` with an enum of
    fields, and the compiler refuses an unknown field.

### The problems of `changelog.md` section 5 that the reference has here

| Problem | Here | Lines |
|---|---|---|
| A file written over after a failed read | Yes. `presets.json` and `profile-learned.json` load empty and are saved over. A partial template save replaces the whole template. `config.json` is safe: a save is refused when the file cannot be read | `server/presets.ts:166-168`, `server/profile-learned.ts:46-48`, `server/config.ts:884-885`, `:923-924` |
| A secret or an access right in the wrong place | Access: yes. A bot sets its own `cwd` at once. A bot changes the New-bot template at once. Duplicate takes the template access. The loopback gap of PATCH. Secrets: handled. History is redacted, a redacted soul cannot be restored, and presets carry no access | `server/bot-cwd.ts:9-25`, `registry-config.ts:91-96`, `bot-patch.ts:625-626`, `profile-versions.ts:51-70` |
| State lost at a restart or a crash | Yes. History rows in a queue with no disk sync. The two saves of a soul PATCH. The mirror with no disk sync. Edits wait 400 ms in the window | `profile-versions.ts:70-82`, `bot-patch.ts:747-753`, `bot-folder.ts:26-27`, `bot-patch-queue.ts:160` |
| A feature added, then removed or reversed | Yes. The plan's profile document, rollback of the whole profile, export and clone were not built. Automatic set-up became `/setup` only (`50362a940`). Proposal cards became apply-at-once with Undo (`b09fcb083`, `761102925`). The New bot popup went (`a9d725204`). Preset sharing went (`05948b876`). Simple became the only mode (`1de1164d5`), then Advanced came back (`6f83379a8`). The simple panel changed four times. Teams became departments (`1a0df0d9c`), and the field is still `section` | section 3.12, `src/lib/simple-only.ts:2` |
| The person's own engine config reaches the bots | Possible, through `cwd`. With `--setting-sources project`, the Claude CLI still reads `<launch folder>/.claude/settings*.json`. A bot can set its own `cwd` to the home folder, so the person's `~/.claude/settings.json` can become the project settings. The files of this feature read no person config themselves | `server/agents-bridge-switch.ts:232-234`, `server/bot-cwd.ts:14` |

The release v0.1.181 (2026-11-25) changes one border of this feature. The
commit `83d18e3af` already has that change (merge `3d2d2043d`, "Skills on
all of a person's bots in one step"). The release note says:
"Skills on all your bots … Bots made later get it too, each bot can switch
it off". A new bot now also gets the skills that are on all bots. The
release note does not name the profile, the soul or the history.

## 9. Not verified

- Whether the Claude driver uses the bot's `cwd` as the launch folder of
  the CLI in each mode. The comment of `agents-bridge-switch.ts:232-234`
  says the CLI reads that folder's settings, and `folderToFollow` moves a
  thread to the bot's folder (`server/index.ts:7698`). The full path of one
  turn was not traced.
- Whether the engine starts with an isolated home folder for each bot
  (`server/drivers/claude.ts:970` has an `isolated` flag), and what the
  CLI reads from the parent folders of `cwd`.
- What the data folder holds that a bot could read after it sets `cwd` to
  it (config, tokens).
- Whether `store.saveBots` writes `bots.json` atomically and with a disk
  sync. `store.ts` imports `writeFileAtomic` (`:4`). The registry internals
  were not read.
- Which secret patterns `server/redact.ts` covers.
- Whether the internal route checks that the per-turn token belongs to
  `fromBotId`.
- That no start sweep expires an open profile card. A search found none.
- Whether an outer gate checks the caller of the rollback and the soul
  routes, beyond loopback trust.
- Whether `loopbackMutationToken` is always set in the packaged desktop.
- What an absent `toolScope` means for a team User's Duplicate.
- Whether `store.deleteBot` removes the memory and skill files when a
  create fails (`server/routes/bots-create.ts:287`).
- Whether `docs/verification/bot-settings.md:143-149` (the creation dialog
  with a role choice) is still true after `a9d725204`.
- Why `server/index.test.ts:14228` expects 500 for a discard of an unseen
  edit.
- Export of one bot (`server/package-export.ts`): part 44, not read.
- The files `src/lib/bot-presets.ts`, `src/lib/bot-creation-draft.ts`,
  `src/lib/create-configured-bot.ts` and `src/lib/new-bot.ts` were not read.
- The organization side of presets is in `enterprise/` and was not read, by
  rule.
