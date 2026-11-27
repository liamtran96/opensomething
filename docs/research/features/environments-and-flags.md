# Feature flags and local environments

The record of how the reference project stores and applies its feature
switches, and how its desktop application keeps more than one data folder on
one computer and switches between them.

- Reference: the reference project at commit `fcce0b6de` (2026-11-26, 13
  commits after the tag `v0.1.182`). Each path below is relative to its
  clone.
- Rows of [`reference-features.md`](../reference-features.md), group
  "later":
  - "Local environments: more than one data folder on a computer, one active
    at a time" (`2026-10-07-local-environments.md`).
  - "The switch of environment: stop, release the lease, start, check, and
    roll back on failure" (`2026-10-07-local-environments.md`).
  - "Local environments in the settings" (`local-environments.md`).
  - "`feature-flags.md`: the `features` switches in the config; the opt-out
    file of the library; three states of server lending; environment
    overrides; the loop guard; removed flags".
  - "`plans/local-environments.md`: named local environments".
- For no step yet (group "later") of [`../../plan/README.md`](../../plan/README.md).
  The flags touch step 6 (settings). The environments touch `bot-desktop`.
- Eight subagents read the files in groups: `flags-docs`, `flags-config`,
  `flags-consumers`, `flags-ui`, `env-docs`, `env-store`, `env-switch` and
  `env-ui-descriptor`. Two more readers came after them, because the eight
  reports showed two gaps: `env-local-profiles` (a second local mechanism
  that no group had) and `data-dir-lease` (the lease internals, which no
  finished research file has, see `engine-process-lifecycle.md:1004-1006`).
  Section 2 lists the files.
- The lead checked the key claims of the readers at these lines, and the
  release of each lease fix with `git describe --contains`. All agree with
  the code:
  - `server/config.ts:199-201`, `:543-547`, `:644-647`, `:679`, `:699-714`,
    `:884-902`, `:989-991`, and `:200-229` has no `nullable`
  - `server/skill-library.ts:343-353`, `server/skill-share.ts:32-35`,
    `server/app-settings/registry-config.ts:115`
  - `server/index.ts:655-657`, `:11619`
  - `server/environment.ts:66-75`
  - `electron/environment-switch.mjs:16-34`, `:76-83`
  - `electron/environments-file.mjs:13-24`
  - `electron/environments.cjs:296-302`, `:407-421`
  - `electron/main.mjs:1113`, `:1555-1557`, `:1573-1577`, `:1596`, `:1616`,
    `:1868-1887`, `:1902-1906`, `:2961-2985`
  - `src/components/ConnectedWorkspacesSettings.tsx:96`, `:110`
  - `src/components/settings/pages/FeaturesPage.tsx:19-23`
  - `src/lib/feature-flags.ts:21`, `:89`, `:102`, `:106-108`
  - `electron/local-profiles.mjs:45-64`, `:82-87`, `:152-173`, `:235-253`
  - `electron/data-dir-lease.mjs:322-338`, `:386-395`, `:469-478`, `:487-493`, `:719-723`, `:737-751`
- Two reports disagreed, and the lead decided with the code:
  - `flags-docs` said that a `null` in a `features` patch deletes the key.
    The merge loop deletes a `null` value (`server/config.ts:899-901`), but
    the patch schema refuses `null` for each feature key before the merge
    (`server/config.ts:200-229, 887`). So a patch cannot remove a feature
    key. It can only set `true` or `false`.
  - `flags-config` said that two features have an environment override.
    `flags-consumers` read the sites outside `config.ts` and found four that
    win over the file, and one more that can only switch a feature on
    (section 3.3).

## 1. In short

**Feature flags.** The server keeps a set of on/off switches in its config
file. The person changes a few of them in the settings. An operator changes
the others by hand or with an environment variable. Each switch has a
default that the code decides, not the file. Some features start on unless
the file says `false`, and some start off unless the file says `true`.

**Local environments.** The desktop application can keep more than one data
folder on one computer. Each folder has its own bots, conversations, keys and
config. Only one folder is in use at a time. To change the folder, the
application stops its server, moves the folder lock, starts the server on the
other folder, checks it, and goes back to the first folder if a step fails.

Terms, explained one time:

- **Feature flag (switch):** one key in the `features` object of the
  server's `config.json`. In the reference project there are 25 keys
  (`server/config.ts:200-229`).
- **Gate function:** a small function that reads one key and gives the
  effective value. It holds the default. The style "on unless false" tests
  `!== false`. The style "off unless true" tests `=== true`
  (`server/config.ts:599-651`).
- **Environment override:** a variable in the environment of the server
  process that wins over the key in the file, for example `OMB_PHONE_PUSH`
  (`server/phone-push.ts:77-81`).
- **Opt-out file:** `<data>/skill-state/<bot id>/library-opt-out.json`. It
  lists the shared library skills that one bot switched off
  (`server/skill-library.ts:306-311`).
- **Data folder:** the folder that holds all the data of one server, for
  example `~/.openmausbot`. The server reads its path one time, when the
  module loads (`server/config.ts:679`).
- **Lease:** a lock record in the data folder. It makes sure that only one
  server process uses the folder. The desktop application holds it and gives
  it to its server child (`electron/main.mjs:1112-1113`). Its format is in
  section 3.18.
- **Named local environment:** an extra data folder with a name, kept in a
  list by the desktop application (`electron/environments.cjs:317`).
- **"This computer":** the default data folder. It has no entry in the list.
  Its reserved identifier is `local` (`electron/environments.cjs:4`).
- **Registry:** the file `environments.json` in the application's own
  settings folder (Electron `userData`). It holds the named environments, the
  saved remote servers and the active identifier
  (`electron/main.mjs:1493-1495`).
- **Active identifier (`activeId`):** the entry that the application opens at
  start. It can differ from the folder that runs now
  (`electron/main.mjs:270-271`).
- **Switch:** the change from one data folder to another
  (`electron/environment-switch.mjs:27-83`).
- **Rollback:** the return to the first folder after a failed switch
  (`electron/main.mjs:1597-1615`).
- **Revive:** a last attempt to start a server on the first folder when a
  failed switch left no server (`electron/environment-switch.mjs:86-105`).
- **Supervisor:** the part of the desktop application that restarts a server
  child that stops (`electron/server-supervisor.mjs:1-3`).
- **Packaged build:** an installed application, not a development run. Only a
  packaged build can make or switch a named environment
  (`electron/main.mjs:1555`, `:1667`).
- **Environment identifier:** one UUID in `<data>/environment-id`. It tells
  two data folders apart (`server/environment.ts:49`).
- **Environment descriptor:** the public answer of
  `GET /.well-known/openmausbot/environment`. It holds the identifier, a
  label, the platform, the version and a list of capabilities
  (`server/environment.ts:129-153`).
- **Local profile (workspace):** a second, newer mechanism for more data
  folders on this computer, opened from the "+" of the left rail
  (`electron/local-profiles.mjs`, commit `50df92437`, 2026-11-07). Section
  3.16 describes it.

What this file adds to the finished research:

- [`skills.md`](skills.md) lists the opt-out file (`skills.md:1091`). This
  file adds its write rule: a write after a failed read loses the earlier
  opt-outs (section 3.7).
- [`chat-ui.md`](chat-ui.md) covers `showToolCalls` and records
  `src/lib/feature-flags.ts` at 99 lines (`chat-ui.md:192`). At `fcce0b6de`
  the file has 124 lines and 20 keys.
- [`team-board.md`](team-board.md) covers the Board switch
  (`team-board.md:267`). This file adds the general rule of the Features
  page: a row shows only when the server reports the key.
- [`newer-config-unavailable.md`](newer-config-unavailable.md) cites the
  rename of `skillRecorder` (`newer-config-unavailable.md:167`). This file
  adds its exact rules, its tests and the history of each removed flag.
- [`turn-limits.md`](turn-limits.md) covers the loop guard. This file adds
  only its config keys and environment variables (section 3.3).
- [`store-and-data-format.md`](store-and-data-format.md) covers the order of
  the start and the data format. This file adds the desktop side of the
  lease: the switch, the rollback and the revive.
- `docs/comparison.md:251` cites `server/config.ts:219-248` for the flags.
  At `fcce0b6de` the schema is at `server/config.ts:199-229`.
- All of the local environments is new here.

## 2. Files read completely

Each group read its files with all lines, or in the ranges given.

### Group `flags-docs`

| File | Lines | Read |
|---|---|---|
| `docs/feature-flags.md` | 123 | all |
| `docs/self-hosting.md` | 2054 | 743-777, 822-868, 925-960, 1574-1600, 1771-1830, 1882-1916, 2007-2054, and a grep of the whole file |
| `apps/docs/content/docs/computers/lend-to-your-server.mdx` | 76 | all |
| `server/legacy-feature-flags.ts` | 27 | all |
| `src/components/settings/pages/FeaturesPage.tsx` | 57 | all |
| `docs/cloud-pro.md`, `docs/memory.md`, `docs/phone-push.md`, `docs/multi-device.md`, `docs/team-board.md`, `docs/verification/{browser-live,chat-ui,codex-browser-routing,desktop-server-connection,digests,live-calls,room-coordination,saved-steps}.md` | - | the paragraphs around each `features.` hit |
| `announcements/releases.json` | 1341 | grep, lines 1-30 and each hit |
| git | - | `git log v0.1.182..HEAD`, `git show --stat` of each commit, `git log -S` for five removed flag names, `git describe --contains` for eight commits |

### Group `flags-config`

| File | Lines | Read |
|---|---|---|
| `server/config.ts` | 1227 | all, in three ranges |
| `server/legacy-feature-flags.ts` | 27 | all |
| `server/config-backup.ts` | 195 | all |
| `server/decider/config-errors.ts` | 13 | all |
| `server/config.test.ts` | 2510 | 1-40, 225-335, 650-730, 1500-1592, 1870-1945, 2156-2186 |
| `server/routes/config.ts` | 741 | 1-309, 560-741. 310-559 has no `features` (grep) |
| `server/index.ts` | 15253 | 650-672, 11585-11665, 693, and grep lines |
| `server/data-dir.ts` | 56 | 18-56 |
| `server/phone-push.ts` 70-82, `server/boat-recovery.ts` 65-75, `server/phone-screen/flag.ts` 1-12, `server/skill-library.ts` 14-20, `server/turn-settings.ts` 6-11, `server/host/room-jobs.ts` 20-24, `server/saved-steps/saved-steps.ts` 60-66, `server/skill-burger/store.ts` 22-27 | - | the gate functions |

### Group `flags-consumers`

| File | Lines | Read |
|---|---|---|
| `server/agents-bridge-switch.ts` | 382 | all |
| `server/drivers/acp/session-reports.ts` | 132 | all |
| `server/skill-library.ts` | 612 | all |
| `server/routes/bot-skills.test.ts` | 399 | all |
| `server/skills-library.test.ts` | 261 | all |
| `server/agents-turn.ts` | 101 | all |
| `server/config.ts` | 1227 | 195-240, 590-680, 740-800 |
| `server/phone-push.ts` | 555 | 1-10, 36-95 |
| `server/boat-recovery.ts` | 800 | 60-90 |
| `server/drivers/claude.ts` | - | 135-160, 675-690 |
| `server/imported-skills.ts` | - | 420-445 |
| `server/drivers/agents-catalog-profile.ts` | - | 40-70 |
| `server/skills.ts` | - | 1295-1332 |
| `server/skill-burger/store.ts` | 253 | 23-25, 230-250 |
| `server/routes/bot-skills.ts` | 210 | 105-160, 185-210 |
| `server/own-home.ts` | 51 | 1-30, 42-49 |
| `server/request-auth.ts` | - | 313, 320-340, 530-545, 700-710 |
| `server/routes/config.ts` | 741 | 222-232, 612-630, 650-680 |
| `server/index.ts` | 15253 | 772, 2805-2825, 11600-11625, 12503-12510, 12628-12636 |
| `server/turn-settings.ts` | 141 | 1-12, 125-140 |
| `server/host/room-jobs.ts` | 110 | 15-30 |
| `server/skill-share.ts` | 415 | 25-40 |
| `server/app-settings/registry-config.ts` | 210 | 28-40, 95-125 |

### Group `flags-ui`

| File | Lines | Read |
|---|---|---|
| `src/components/AppSettingsRows.tsx` | 423 | all |
| `src/lib/feature-flags.ts` | 124 | all |
| `src/lib/feature-flags.test.ts` | 107 | all |
| `src/lib/use-feature.ts` | 18 | all |
| `src/components/settings/pages/FeaturesPage.tsx` | 57 | all |
| `src/components/ClaudeCodeSwitches.tsx` | 59 | all |
| `src/components/SavedStepsRow.tsx` | 37 | all |
| `src/components/UsbPhoneTakeoverSettings.tsx` | 29 | all |
| `src/components/ShareLearnedSkillsSettings.tsx` | 60 | all |
| `src/components/SkillReviewSettings.tsx` | 113 | all |
| `src/components/BrowserSettingsRows.tsx` | 155 | all |
| `src/components/settings/pages/SettingsPageBody.tsx` | 34 | all |
| `src/components/settings/AdvancedSection.tsx` | 39 | all |
| `src/lib/config-status-frame.ts` | 61 | all |
| `src/components/ComputerPanel.tsx` | - | 1030-1090 |
| `src/components/bot-settings/MemorySection.tsx` | - | 240-300, and lines 131, 358, 513-522 |
| `src/state/store.tsx` | - | 1015-1035, 2835-3025, 3140-3175, and lines 656, 2833 |
| `src/components/settings/pages/PlacePages.tsx` | 209 | 154-205 |
| `src/components/settings/pages/AppPages.tsx` | 192 | 160-185 |
| `src/components/settings/settings-index.ts` | - | lines 54, 68, 72, 89-90, 265-267 |
| `src/components/settings/SettingsWindow.test.ts` | - | 280-334 |
| `src/components/SettingsPrimitives.tsx` | 380 | 16-46, 98-204, 331-353 |
| `src/locales/en.json` | 12251 | 1725-1728, 2097-2102, 2123-2126, 3895-3928, 3967, 6288-6294, 11468, 11471, 11531-11534, 11547-11549, 12103-12134 |
| `DESIGN.md` | 445 | 50-70, 192-202, 288-300, 385-420 |

### Group `env-docs`

| File | Lines | Read |
|---|---|---|
| `docs/plans/local-environments.md` | 61 | all |
| `docs/verification/local-environments.md` | 122 | all |
| `docs/superpowers/plans/2026-10-07-local-environments.md` | 122 | all |
| `docs/superpowers/specs/2026-10-07-local-environments-design.md` | 161 | all |
| `docs/verification/README.md` | 386 | 120-132 |
| `announcements/releases.json` | 1341 | grep |
| git | - | messages and stats of `e07b27c28`, `31d4aef72`, `2781ca422`, `874c8bef8`, `0942e3b42`, `84539fde0`, `0b2c12707`, `50df92437`, `d28734b5d`, `ea3202854`, `2774d87bb`, `ca9d0c377` |

### Group `env-store`

| File | Lines | Read |
|---|---|---|
| `electron/environments.cjs` | 508 | all |
| `electron/environments-file.mjs` | 39 | all |
| `electron/environments.node-test.mjs` | 490 | all |
| `src/types/ogb.d.ts` | 661 | 255-320 |
| `electron/cloud-account.mjs` | - | 1-45 |
| `electron/main.mjs` | 3124 | 1413, 1485-1540, 2815-2835 |

### Group `env-switch`

| File | Lines | Read |
|---|---|---|
| `electron/environment-switch.mjs` | 105 | all |
| `electron/environment-switch.node-test.mjs` | 273 | all |
| `electron/server-supervisor.mjs` | 130 | all |
| `electron/clean-workspace.mjs` | 163 | all |
| `electron/place-switch.mjs` | 64 | all |
| `electron/server-boot-probe.mjs` | 101 | all |
| `server/data-dir-lease.ts` | 33 | all |
| `electron/main.mjs` | 3124 | 255-370, 1100-1215, 1405-1760, 1867-1925, 2400-2420, 2638-2662, 2815-2860, 2955-2992, 3060-3124 |
| `electron/server-supervisor.node-test.mjs` | 549 | 1-308, 414-549 |

### Group `env-ui-descriptor`

| File | Lines | Read |
|---|---|---|
| `src/components/ConnectedWorkspacesSettings.tsx` | 169 | all |
| `src/components/ConnectedWorkspacesSettings.test.ts` | 209 | all |
| `src/components/AlwaysOnHomeSection.tsx` | 250 | all |
| `server/environment.ts` | 153 | all |
| `server/environment.test.ts` | 223 | all |
| `packages/phone-protocol/src/environment.ts` | 55 | all |
| `electron/local-origin.cjs` | 50 | all |
| `electron/server-status.mjs` | 149 | all |
| `electron/preload.cjs` | 843 | 490-540 |
| `electron/main.mjs` | 3124 | 1400-1445, 1554-1570, 1645-1700, 1867-1925, 2440-2460, 2640-2680, and lines 461, 1783, 1791, 1799, 2615 |
| `src/App.tsx` | 586 | 125-165 |
| `src/components/settings/pages/AppPages.tsx` | 192 | 60-80 |
| `src/locales/en.json` | 12251 | 2-22, 9179-9180, 9187-9188, 9997-9998, 10040-10046, 11076, 11407, 11498, 11545-11546, 11762-11768 |
| `server/index.ts` | 15253 | 665-672, 12420-12470, and lines 518, 785, 2772, 11920, 12496, 12563, 12571, 12608, 15151 |
| `electron/server-probe.mjs` | - | 95-145 |
| `electron/own-home-main.mjs` | - | 50-75 |
| `electron/computer-sharing.mjs` | - | 405-445, 495-525 |
| `electron/lent-mcp.mjs` | - | 80-105 |
| `electron/environments.cjs` | 508 | 307-318, 405-422 |

### Group `env-local-profiles`

| File | Lines | Read |
|---|---|---|
| `electron/local-profiles.mjs` | 258 | all |
| `electron/local-profiles.node-test.mjs` | 306 | all |
| `electron/local-profiles.d.mts` | 59 | all |
| `electron/start-place.mjs` | 38 | all |
| `docs/verification/cloud-rail.md` | - | 95-170 |
| `electron/main.mjs` | 3124 | 108, 1420-1436, 1444, 1644-1648, 1652, 2583, 2598-2620, 2676-2678, 2686-2695 |
| `electron/environments.cjs` | 508 | 70-110 |
| `electron/cloud-rail.mjs` | - | 20-21, 58-101, 157-250 |
| `electron/clean-workspace.mjs` | 163 | 30-70, 82-95, 110-163 |
| `electron/preload.cjs` | 843 | 200-222 |
| `src/lib/places.ts` | - | 120-160 |
| `src/components/PlaceAddSheet.tsx` | - | 230-314 |
| `src/components/PlacesRail.tsx` | - | 40-41, 162, 246, 315-380 |
| git | - | messages and stats of `50df92437`, `516ca7598`, `3b0779633`, `076a319e9`, `ac5b12179` |

### Group `data-dir-lease`

| File | Lines | Read |
|---|---|---|
| `electron/data-dir-lease.mjs` | 864 | all, in three ranges |
| `electron/data-dir-lease.node-test.mjs` | 846 | all, in two ranges |
| `server/data-dir-lease.ts` | 33 | all |
| `server/doctor/checks/lease.ts` | 33 | all |
| `server/doctor/run.ts` | - | 85-135 |
| `electron/cua-launch.test.mjs` | - | 275-298 |
| `electron/data-dir-lease-windows.node-test.mjs` | - | 1-37 and the test titles |
| git | - | the log of `electron/data-dir-lease.mjs`, with `git describe --contains` for each Windows and pid fix |

## 3. How it works

### 3.1 Where a flag lives, and its default

1. The server keeps all switches in one optional object, `features`, in
   `<data folder>/config.json` (`server/config.ts:394`). With
   `OMB_DATA_DIR` set, the file is in that folder (`docs/feature-flags.md:13-14`).
   So each data folder, and each named environment, has its own switches.
2. The schema `featureConfigSchema` has 25 optional keys: 23 booleans, one
   enum (`shareLearnedSkills`: `off`, `ask`, `auto`) and one whole number
   (`skillReviewSteps`, 3 to 100) (`server/config.ts:200-229`).
3. The schema is not strict on purpose: "a stale client's unknown flag must
   be dropped, not fail the whole config" (`server/config.ts:199`). An
   unknown key is removed from the parsed value. It stays in the file
   (section 3.4).
4. The TypeScript type is a second list of the same 25 keys, kept by hand
   (`server/config.ts:470`).
5. The default is not in the schema. Each key is read by a gate function
   with one of two styles (`server/config.ts:599-651`):
   - "on unless false" (`!== false`): `skillAuthoring`, `browser`,
     `autoRecall`, `smartSetupChoices`, `parallelRoomJobs`, `savedSteps`,
     `cloudComputerAutoReplace`, `phonePush`, `skillBurger`,
     `suggestedReplies`.
   - "off unless true" (`=== true`): all other booleans.
6. The gates are in about ten files: `server/config.ts:599-651`,
   `server/skill-library.ts:16-18`, `server/turn-settings.ts:8-10`,
   `server/host/room-jobs.ts:21-23`, `server/saved-steps/saved-steps.ts:62-64`,
   `server/skill-burger/store.ts:24-26`, `server/phone-screen/flag.ts:5-7`,
   `server/phone-push.ts:74-81`, `server/boat-recovery.ts:65-75`,
   `server/setup-suggestions.ts:423`, and inline in `server/index.ts:11619`.
7. Some gates depend on another key:
   - `skillReview` is on only when `skillAuthoring` is on and
     `skillReview === true` (`server/config.ts:607-609`).
   - `skillReviewSteps` is rounded and clamped to 3 to 100, default 10
     (`server/config.ts:603-615`).
   - `shareLearnedSkills` is `off` when the library is off, else the value,
     else `ask` (`server/skill-share.ts:32-35`).
   - `teamBoard` exists only on a Team Cloud (`server/index.ts:11619`).
8. The Settings registry codes the default a second time
   (`server/app-settings/registry-config.ts:34-38`). For
   `shareLearnedSkills` the two disagree: the registry shows `off` for a
   missing key (`registry-config.ts:115`), and the runtime uses `ask`
   (`skill-share.ts:34`).
9. `builtInBrowserEnabled` takes an argument `_env` that it does not use
   (`server/config.ts:640-642`). Its test is named "the browser off by
   default", but its body asserts that the browser is on
   (`server/config.test.ts:658`, `:667`). Both are left over from an older
   rule.

The full table of keys is in section 4.1.

### 3.2 How the server reads the flags at start

1. `ensureDirs` makes the data folders and then runs
   `migrateLegacyFeatureFlags` (`server/config.ts:684-693`). It runs at
   `server/index.ts:655`, one line before the server takes the lease at
   `:657`. So the rename of section 3.5 can write `config.json` before this
   process holds the lease. The write is atomic and runs one time
   (`server/legacy-feature-flags.ts:18`, `:22`).
2. `loadConfig` reads the file through a cache that is keyed by the file
   stamp (`server/config.ts:696`).
3. The parse checks the whole file with the stored schema. A failure throws
   (`server/config.ts:543-547`).
4. On any error other than "no file", `loadConfig` logs one warning and runs
   on `{}`, all defaults (`server/config.ts:699-714`):
   `config: ignoring <path> and using defaults: <reason>`. A JSON syntax
   error shows only "invalid JSON", because "JSON.parse errors can quote the
   input" (`server/config.ts:705-707`).
5. The effect on flags: one bad value in any checked section, for example
   `features.browser: "yes"` or a bad `rooms` value, makes every flag go back
   to its default. "On unless false" switches turn on. "Off unless true"
   switches turn off. The person sees only a console line. Two sections are
   exempt: `mcpServers` (`z.unknown`) and `opencodeGo.providerKeys`
   (`.catch({})`) (`server/config.ts:399-411`).
6. The server keeps one object `cfg = loadConfig()` for its life
   (`server/index.ts:772`). A hand edit of `config.json` reaches `cfg` only
   at the next save or the next start. The lead found no file watcher.
   `acpPlanLines` is the exception: it reads the file again through a cache
   keyed by the file stamp (`server/drivers/acp/session-reports.ts:76`,
   `server/config.ts:759-769`).
7. Some effects happen only at start: the sweep of the skills library runs
   only if the flag is on at start (`server/index.ts:2810-2825`), and the
   Chrome launcher starts only if the browser flag is on
   (`server/index.ts:15122`).

### 3.3 Environment overrides

1. An override is a variable of the server process. It is read at each use,
   but the process gets its environment only at start, so a change needs a
   restart (`docs/feature-flags.md:107-108`).
2. Four flags have an override that wins over the file:

   | Flag | Variable | Accepted values | Site |
   |---|---|---|---|
   | `agentsToolBridge` | `OMB_AGENTS_TOOL_BRIDGE` | exactly `1` or `0` | `server/agents-bridge-switch.ts:33-38` |
   | `acpPlanLines` | `OMB_ACP_PLAN_LINES` | exactly `1` or `0` | `server/drivers/acp/session-reports.ts:78-83` |
   | `phonePush` | `OMB_PHONE_PUSH` | exactly `1` or `0` | `server/phone-push.ts:77-81` |
   | `cloudComputerAutoReplace` | `OMB_CLOUD_COMPUTER_AUTO_REPLACE` | trimmed, lower case. On: `1`, `true`, `on`, `yes`. Off: `0`, `false`, `off`, `no` | `server/boat-recovery.ts:65-75` |

   Any other value falls through to the file.
3. `OMB_CLAUDE_INHERIT_USER_CONFIG=1` can only add. It is an OR with
   `features.claudeUserMcp` and `features.claudeUserSkills`. It cannot switch
   them off (`server/agents-bridge-switch.ts:221`,
   `server/drivers/claude.ts:139-156`, `server/imported-skills.ts:436`).
4. The document lists only the first two
   (`docs/feature-flags.md:97-108`). It says "exactly 1 or 0", which is not
   true for `OMB_CLOUD_COMPUTER_AUTO_REPLACE`.
5. For a local model, `agentsToolBridge` acts as on with no setting. Only
   `OMB_AGENTS_TOOL_BRIDGE=0` stops it (`server/agents-bridge-switch.ts:40-47`,
   `:299`, commit `4776d25b0`). The other refusals of the bridge still apply
   (`:300-305`).
6. The server never passes its own value of the bridge variable to a tool
   process. It always writes `"1"` or `"0"` for each turn
   (`server/agents-bridge-switch.ts:24-26`, `:326-334`).
7. Related switches outside `features` use two more styles:
   `OMB_SAFETY_FLOOR` (trimmed, only `1` switches on,
   `server/safety-floor-gate.ts:16`) and `OMB_LOOP_GUARD` (not trimmed,
   only `1`, `server/host/loop-guard.ts:65`). So the reference project has
   four parse styles for one idea.
8. Per turn, the server also turns host facts into `"1"`/`"0"` variables for
   its tool process: `OMB_SKILL_AUTHORING_ENABLED`, `OMB_SKILL_BURGER`,
   `OMB_SHARED_COMPUTERS_ENABLED`, `OMB_TEAM_BOARD` and others
   (`server/agents-turn.ts:36-61`). These are signals from the server, not
   overrides. An operator cannot set them on the server.

### 3.4 A change from the settings

1. Every client writer sends `PATCH /api/config` with one key:
   `{ "features": { "<key>": <value> } }` (`src/components/AppSettingsRows.tsx:345-348`,
   `src/components/settings/pages/FeaturesPage.tsx:29`). No writer sends the
   whole object.
2. A paired phone may change only API keys. A feature change from a phone
   gets 403 "From a phone, only API keys can be changed. Change other
   settings on your computer." (`server/routes/config.ts:146-149`).
3. The server checks the patch. A wrong type gives 400 with the path of the
   key (`server/config.ts:561-567`). An unknown feature key is dropped with
   no error (`server/config.ts:199`).
4. A second save while one runs gives 409 (`server/routes/config.ts:216`).
5. `saveConfig` (`server/config.ts:875-999`):
   1. It reads the raw file. If the file cannot be read or is not a JSON
      object, it refuses with 503 and writes nothing. It keeps a bad file
      aside (`server/config.ts:884-885`, `server/config-backup.ts:62-70`).
   2. It merges the `features` patch key by key onto the raw section on disk,
      not onto the parsed one (`server/config.ts:892-902`). So a retired or
      unknown key on disk stays through every save.
   3. It writes a dated copy of the old text first. It keeps at most 10
      copies. A failed copy refuses the save with 503
      (`server/config.ts:989`, `server/config-backup.ts:16`, `:74-79`).
   4. It writes the file atomically with mode `0600`
      (`server/config.ts:990`).
   5. It drops the read cache and calls each save listener with the file
      before and after. A listener error is logged
      (`server/config.ts:991-998`).
6. The save checks the patch, but not the merged result. A file that is
   valid JSON but fails the schema is accepted as the base of a save. The
   server keeps running on defaults after it (`server/config.ts:885-887`).
7. The route updates the live object in place:
   `Object.assign(cfg, loadConfig())` (`server/routes/config.ts:619`,
   `:626`). Most gates read `cfg` at each use, so the change applies at the
   next call with no restart.
8. Inference, not tested: `Object.assign` cannot delete a key. If the file
   fails the schema, `loadConfig` returns `{}`, and the old `cfg.features`
   stays in memory. The running server then keeps the old switches, and a
   restart uses the defaults.
9. After the save (`server/routes/config.ts:660-714`):
   - When lending is now off, the server closes all lent computers and
     their control.
   - When the browser goes off, it closes all live browser views.
   - It restarts an engine only when its launch config changed. A feature
     change restarts no engine (`server/config.test.ts:2165-2169`).
   - It sends a `config` event with the new status to all clients.
10. It answers 200 with the new status (`server/routes/config.ts:727`).
11. One listener reads the raw file: a USB phone hold ends when
    `features.usbPhoneTakeover` is no longer `true`
    (`server/index.ts:2053`, `server/phone-screen/flag.ts:9-12`).

### 3.5 The one migration: `skillRecorder` to `skillAuthoring`

1. If there is no `config.json`, it returns
   (`server/legacy-feature-flags.ts:14`).
2. If the file is not a JSON object, or `features` has no own
   `skillRecorder` key, it returns (`:15-18`). So it runs one time.
3. It copies `features`. If `skillAuthoring` is not set, it sets it to
   `skillRecorder === true`. A value that is not a boolean becomes `false`
   (`:20`).
4. It deletes `skillRecorder` and writes the whole file atomically with mode
   `0600`. It writes no dated copy (`:21-22`).
5. Any error is logged, and the start continues (`:24-26`).
6. The default changed with it. `skillRecorder` was off unless true.
   `skillAuthoring` is on unless false (`server/config.ts:201`, `:599-601`).
   A person who had the old key keeps "off". All others get "on"
   (`server/config.test.ts:1551-1556`).

### 3.6 Lending: one key, three states

`features.sharedComputers` has two gates with opposite defaults
(`server/config.ts:644-647`):

| Value | `sharedComputersEnabled` | `ownerLendingEnabled` | Meaning |
|---|---|---|---|
| `true` | true | true | Every paired session may lend its computer |
| missing | false | true | Only the owner of a one-person server may lend. The desktop asks its person first |
| `false` | false | false | No lending |

1. The security comment: every paired session may lend only when `true`,
   "because a read-only folder grant can still be escalated to a shell"
   (`server/config.ts:644`).
2. The schema comment says "Off unless true, set by hand: there is no
   Settings toggle" (`server/config.ts:211`). It does not describe the
   missing state.
3. The deciding closures are on one line (`server/index.ts:693`):
   - `lendingEnabled() = sharedComputersEnabled(cfg) || CLOUD_HOME !== null || ownHome.here()`.
     So a Cloud home, or a home that took a move from its owner, lends even
     with `false`. The document says this on purpose
     (`docs/feature-flags.md:82-88`).
   - `ownerLends() = ownerLendingEnabled(cfg) && ownHome.takesMove()`.
4. The flag reaches the auth layer. A client-scope rule for
   `/api/shared-computers*` applies only while `lendingEnabled()`. Else the
   path needs the admin scope (`server/request-auth.ts:535-542`,
   `server/index.ts:12507`).
5. The descriptor adds the capability `sharedComputers` only while lending
   is on. "Never advertise a protocol this server would refuse"
   (`server/environment.ts:137-139`).
6. The documents disagree on the version and the platforms. One says 0.1.179
   (`lend-to-your-server.mdx:68`). The release note says 0.1.180
   (`announcements/releases.json:205`). `docs/self-hosting.md:927` lists
   Linux, and the page does not.

### 3.7 The library opt-out file

1. Path: `<DATA_DIR>/skill-state/<bot id>/library-opt-out.json`. A bot id
   that does not match `^[\w-]+$` gives no path
   (`server/skill-library.ts:308-311`).
2. Format: a JSON array of skill names, sorted, two-space indent, a final
   new line. Mode `0600`, folder mode `0700`. Atomic write
   (`server/skill-library.ts:306`, `:351-352`).
3. Read (`librarySkillOptOuts`, `server/skill-library.ts:323-341`):
   - No file: an empty set.
   - Any other read error, bad JSON, or a value that is not a list of
     strings: an empty set and one warning for each path for the life of
     the process: "Library opt-outs at <path> can't be read (<why>); every
     every-bot skill stays on for that bot until one is switched off again."
     (`:313-318`).
   - Names that fail `isSkillName` are dropped (`:338`).
   - The comment calls this "fail open": the bot keeps working with every
     every-bot skill (`:323-324`).
4. Write (`setLibrarySkillOptOut`, `server/skill-library.ts:343-353`):
   1. A bad name or bot id: return with no change and no error.
   2. Read the current set with the reader above. A damaged file gives an
      empty set.
   3. No change: return.
   4. Add or delete the name, then write the whole set.
5. The loss: when the file exists but cannot be read, step 2 gives an empty
   set, and step 4 writes a file with only the new name. All earlier
   opt-outs are lost. Nothing is set aside, and the person is not told. The
   warning text accepts it ("until one is switched off again", `:318`). The
   writers of the library index refuse in the same case
   (`server/skill-library.ts:391-392`, `:434-435`, `:546-547`, `:583-584`).
   No test writes over a damaged opt-out file
   (`server/routes/bot-skills.test.ts:375-398` tests only reads).
6. Routes:
   - `DELETE /api/bots/:id/skills/:name` writes an opt-out, then saves the
     bot row. These are two writes, not one transaction
     (`server/routes/bot-skills.ts:121-123`). An explicit assignment wins
     over an opt-out (`server/skill-library.ts:358`).
   - `PUT /api/bots/:id/skills-library` removes the opt-out of each name it
     gets and never adds one. So `[]` brings back every every-bot skill
     (`server/routes/bot-skills.ts:204-205`, test
     `server/routes/bot-skills.test.ts:317-329`).
   - With the library off, the library routes answer 404 "skills library is
     not enabled" (`server/routes/bot-skills.ts:135`, `:158`, `:178`).

### 3.8 How the client learns the flags

1. The client reads `GET /api/config` at start. `features` is one field of
   the answer (`src/state/store.tsx:2861-2867`).
2. The server sends the effective value of each switch, not the stored value
   (`server/index.ts:11605-11621`). So the client cannot tell "missing,
   default on" from "set to true".
3. Six keys are not in the answer: `smartSetupChoices`, `acpPlanLines`,
   `agentsToolBridge`, `cloudComputerAutoReplace`, `phonePush`,
   `llmThreadTitles`. Three values in the answer are not stored keys:
   `savedStepsHere`, `roomFeed`, `roomFeedSince` (`server/index.ts:11619`).
4. A failed load is tried again with back-off `min(30 s, 1 s × 2^min(n, 5))`
   (`src/state/store.tsx:2900`).
5. A live `config` event replaces `state.config`. It carries `features`
   (`src/state/store.tsx:3158-3162`, `src/lib/config-status-frame.ts:6`,
   `:50`). "A setting left out here is wiped from state.config whenever a
   config frame lands" (`config-status-frame.ts:3`).
6. Events that come during the first load wait and apply after it
   (`src/state/store.tsx:2976-2997`). A later event raises a version, so a
   retried read cannot write over a newer event (`:3018`, `:2921-2925`).
7. The client keeps the flags only in memory. Each reader is a pure function
   (`src/lib/feature-flags.ts:19-124`).
8. The client default for a boolean is "off", because the server sends the
   effective value. Three keys default on in the client: `skillAuthoring`,
   `savedSteps`, `skillBurger` (`src/lib/feature-flags.ts:21`, `:89`,
   `:102`). So a newer client on an older server hides a feature that the
   server does not know, except these three.

### 3.9 The history of the flags

| Flag | Added | Removed or changed |
|---|---|---|
| `skillRecorder` | `ddc0cb054`, v0.1.46 | Removed in `40b096af2`, v0.1.71. "Skill authoring on by default" in `6420f72bc`, v0.1.72. Renamed on disk at start (section 3.5) |
| `cloudOverflow`, `computerClaimIdleRelease` | `df207eb7a`, v0.1.90 | Deleted in `3764befd6`, v0.1.96, six releases later |
| `chiefEscalations` | `2879ad492`, v0.1.121 (first commit with the string) | Removed in `5819d22d6`, v0.1.152 |
| `llmThreadTitles` | `c65486db6`, v0.1.85 | Retired in `c18086673`, v0.1.166. Still accepted "so older config files load" (`server/config.ts:215-216`) |
| `routinesInConversation` | not traced | Dropped at parse (`server/config.test.ts:712-716`) |
| Room feed switch | `680499b67`, before v0.1.181 | Removed in `ea5500065`, v0.1.182 ("Room feed for everyone: no switch"). The client still reads `roomFeed` for old homes (`src/lib/feature-flags.ts:115-120`) |
| `sharedComputers` | `eb839b96c` "gate computer sharing behind a flag that defaults off" | Later gained the third state (section 3.6) |

Tests show that the removed keys are dropped, not refused
(`server/config.test.ts:245-259`, `:666`, `:712-716`). `DESIGN.md:60` still
lists "room feed" among the switches. None of the 13 commits after v0.1.182
changes a flag. `88a285945` changes `server/config.ts`, but only to trim saved
provider keys.

### 3.10 The registry of environments

1. The file is `environments.json` in Electron `userData`, not in a data
   folder (`electron/main.mjs:1493-1495`). With `OMB_CLOUD_STAGING=1` it is
   `environments-staging.json` (`electron/cloud-account.mjs:16-20`). The list
   must exist before the application chooses the data folder, so it cannot
   live in a data folder.
2. Read (`electron/environments-file.mjs:13-24`):
   1. Read the file and parse it (`parseEnvironments`,
      `electron/environments.cjs:294-332`).
   2. For each local entry, set `missing: !fs.existsSync(dataDir)`. For each
      remote entry, set `missing: false` (`environments-file.mjs:18-19`).
      This check runs only at read.
   3. On any exception (no file, no permission, an I/O error), return
      `{ environments: [], activeId: "local" }` with no log
      (`environments-file.mjs:21-23`).
3. Parse rules (`electron/environments.cjs:294-332`):
   - Bad JSON gives the empty state (`:298-300`).
   - A missing `version` means 1. A version other than 1 or 2 gives the
     empty state (`:301-302`). So a file from a newer version reads as
     empty (test `electron/environments.node-test.mjs:228-229`).
   - A version 1 entry with no `kind` becomes a remote entry (`:321`, test
     `:194-207`).
   - Bad or repeated entries are dropped one by one. A local entry needs an
     absolute folder. A local folder seen before (by its normalized key) is
     dropped, "so one folder never gets two owners" (`:304-315`).
   - `activeId` stays only if it names a kept entry. Else it is `local`
     (`:329`).
4. Write (`electron/environments-file.mjs:25-37`):
   1. Write `<file>.<pid>.tmp` with mode `0600`, then rename it over the
      file (`:27-31`). There is no `fsync` before the rename.
   2. On error: remove the temporary file, log
      `environments save failed: <message>`, and throw with
      `code: "environments-save-failed"` and the text "Could not save server
      connections on this computer. Please try again." (`:33-35`).
5. `persistEnvironments` writes the file first, and changes the memory only
   after the write succeeds. Then it rebuilds the menu, the window title and
   the rail (`electron/main.mjs:1523-1529`).
6. The loss: a read error gives the same empty state as "no file". The next
   `persistEnvironments` writes the whole state, so a damaged, unreadable or
   newer file is replaced by a short list (`environments-file.mjs:21-23`,
   `main.mjs:1523-1524`). An older application after a downgrade loses the
   newer list at its first save.
7. `serializeEnvironments` writes the entries as they are, so the field
   `missing` goes to disk. The next parse drops it
   (`electron/environments.cjs:337`, `:317`).

### 3.11 Create a named environment

1. A development build refuses with `{ ok: false, error: "dev", state }`
   (`electron/main.mjs:1667`).
2. With no folder: a name is needed (`error: "name"`). The folder becomes
   `~/.openmausbot-<slug>`. The slug is the lower-case name with runs of
   other characters changed to `-`. An empty slug, `clean` or `profiles`
   becomes the first 8 characters of a random UUID
   (`electron/main.mjs:1670-1675`). `<data>-clean` and `<data>-profiles` are
   folders of other features (`electron/clean-workspace.mjs:32-33`).
3. With a folder: it is trimmed. It is refused with `error: "path"` when it
   is empty, when a `/`-separated part is `.` or `..`, or when it differs
   from `path.normalize` of itself (`electron/main.mjs:1677-1684`). On
   Windows only the `normalize` test catches `\..\`.
4. `withLocalEnvironment` checks again (`electron/environments.cjs:407-421`):
   - `name`: empty after trim and space collapse, or more than 60
     characters.
   - `path`: not absolute by a text pattern (POSIX, drive letter or UNC). No
     `~`, no drive-relative path (`:266-270`).
   - `duplicate`: the same folder as another local entry.
   - `nested`: inside or around another local entry's folder, or inside the
     default folder. A folder that holds the default folder (for example
     the home folder) is not refused (`:418`).
   - Folders compare by text. Windows paths ignore case and slash type.
     POSIX paths keep case (`:278-288`).
5. The new entry is not active and has no colour. `persistEnvironments`
   saves it (`electron/main.mjs:1686-1689`). The folder is not made now. The
   first switch makes it.

### 3.12 The switch

The orchestrator is a pure module. The caller injects each side effect
(`electron/environment-switch.mjs:13-14`). `switchLocalEnvironmentTo` in
`electron/main.mjs:1553-1643` gives it the real steps.

Guards before the switch:

1. A development build: `{ ok: false, error: "dev" }`
   (`electron/main.mjs:1555`).
2. A switch in progress: `{ ok: false, error: "busy" }`. "A second switch
   would be un-paused by the first's finally mid-handoff"
   (`electron/main.mjs:1556-1557`). It does not wait and shows nothing.
3. It records `previousDir` (the folder that runs now) and the click counter
   of the rail (`electron/main.mjs:1558`).
4. It sets `localSwitchInFlight = true` and pauses the supervisor. "Pause
   first, or its recovery forks on the wrong data dir"
   (`electron/main.mjs:1553`, `:1565-1566`). A pause clears a queued restart
   (`electron/server-supervisor.mjs:105-110`).

The steps (`electron/environment-switch.mjs:27-83`):

1. **Stop.** Stop the server child. A child that does not exit in 9.5 s
   throws "the server child did not stop". "A child that will not die still
   writes to its folder: abort with the lease still held"
   (`electron/main.mjs:1573-1577`). The 9.5 s are the server's 8 s shutdown
   limit and its 1 s log flush (`electron/main.mjs:293`). The stop sends
   `proc.kill()` and waits for the exit event. There is no second, forced
   kill (`electron/main.mjs:342-358`). This throw rejects the whole call,
   and no rollback runs (test `environment-switch.node-test.mjs:207-224`).
2. **Release the old lease** (`electron/main.mjs:1578-1581`). It is not in a
   `try`. A throw rejects the call with no rollback. The revive (section
   3.13) then starts the old folder again.
3. **Check the target** (`validateTargetDir`,
   `electron/environment-switch.mjs:8-11`). A missing parent folder means a
   missing volume: `fail("unavailable")`, and no `mkdir` runs through it.
   The check does not test that the target is a folder or that it can be
   written.
4. **Make the folder** if it does not exist. An error gives
   `fail("unavailable")` (`:35-42`).
5. **Take the new lease.** Any error gives `fail("locked")`. The log says
   "held" for a `DataDirLeaseError` and "acquisition failed" for other
   errors (`:44-50`). On success, `runningDataDir` becomes the target
   (`electron/main.mjs:1582-1585`).
6. **Start the child** on the same port. A throw, or a result with no
   whole-number `pid`, gives `fail("start-failed")` (`:53-62`).
   `startServerOn` gives the child all of `process.env`, the system proxy,
   the lease variables, `OMB_DATA_DIR`, `OMB_PORT`, `OMB_DESKTOP_PARENT=1`
   and the workspace credentials (`electron/main.mjs:1111-1132`). It waits
   for `/api/health` to name the same pid, for 60 s, plus 180 s after the
   child prints that it listens (`electron/main.mjs:1174-1181`,
   `electron/server-boot-probe.mjs:5-7`, `:76-97`).
7. **Check.** The orchestrator has a probe step with outcomes such as
   `exited` (`:64-74`). In the application the probe is a stub that always
   gives `"ready"` (`electron/main.mjs:1596`). The real check is inside
   `startServerOn` (step 6). So the probe outcomes never occur in the
   application.
8. **Save the active identifier, last.** A throw gives
   `fail("persist-failed")`, and the new child and lease roll back too
   (`:76-82`). In the application the save runs only when `windowFollows()`
   is true (`electron/main.mjs:1616`): the switch is not a background one,
   and no newer rail click came, or the window shows a local page.
9. **Success:** `{ ok: true }` (`:83`). The window loads the same address
   again, which now serves the other folder (`electron/main.mjs:1624-1626`).
   The person waits about 15 s (`docs/plans/local-environments.md:21-23`).

After the steps (`electron/main.mjs:1620-1642`):

1. A failure logs the code and shows one native error box, "Could not switch
   environments" / "[The application] could not switch to that environment.
   The app log has the details.", unless the call is `quiet`. It returns
   `{ ok: false, error: "switch-failed" }` (`:1561-1564`,
   `src/locales/en.json:9997-9998`). The code (`locked`, `unavailable`, ...)
   goes only to the log.
2. `finally` resumes the supervisor. If the switch failed and no child runs,
   it starts the revive. `localSwitchInFlight` goes back to `false` last,
   "so a second switch cannot start while the previous folder is being taken
   back" (`:1630-1642`).

Limits and edge cases:

- There is no overall time limit. Stop (9.5 s), start (60 s plus 180 s), a
  rollback start (the same again) and the revive (up to 4 starts) add up to
  minutes. `localSwitchInFlight` stays `true` for all of it.
- A newer rail click or a background swap skips the save of the active
  identifier and the navigation. The server still runs on the new folder
  (`electron/main.mjs:1558`, `:1616`, `:1625`). The comment accepts that the
  running folder and the active identifier can differ (`:270-271`). After a
  restart, the application opens the folder of the active identifier.
- The menu wrapper shows a dialog only for a throw, so a `busy` result shows
  nothing (`electron/main.mjs:1533-1537`).
- On Windows, the desktop application stops its server with a kill, and a
  kill writes no deferred save. Up to 1 s of deferred changes can be lost
  (`store-and-data-format.md:459-463`, `server/save-batch.ts:79-84`). A
  switch stops the server in this way (`electron/main.mjs:346`).

### 3.13 Rollback and revive

Rollback (`electron/main.mjs:1597-1615`):

1. Stop the new child if one started. The result is ignored (`:1598`).
2. Release the current lease. A throw is logged and ignored (`:1599-1604`).
3. Take the old folder's lease again and set `runningDataDir` back
   (`:1605-1606`). A throw rejects the rollback.
4. Start the server on the old folder and give it to the supervisor. "Without
   ready() the rolled-back child has no owner" (`:1607-1609`). No child:
   throw "could not restart the server on X" (`:1610-1614`).
5. The orchestrator returns `rolledBack: true`, or `rolledBack: false` when
   the rollback threw (`electron/environment-switch.mjs:16-25`). "Rollback
   owns the restart: this module never calls startChild on a failure path,
   so a failed switch cannot double-start" (`:17`).

Revive (`electron/environment-switch.mjs:86-105`, called at
`electron/main.mjs:1632-1639`):

1. It runs when a failed switch left no child.
2. If no lease is held, take the old folder's lease. It never forces a lease
   that another process holds (`:86-88`, `:92`).
3. Start the child on the old folder. Success: return `true` (`:93`).
4. A start that gives no child: log and return `false`, with no retry
   (`:94-95`).
5. A throw: wait 1 s, 2 s, then 4 s, and try again. After 4 tries, log
   "gave up restarting" and return `false`. The server stays stopped
   (`:89`, `:96-103`).
6. History: commit `0b2c12707` (2026-11-06, in v0.1.145) added the revive. Its
   message says that a rollback that could not take the old lease back "left
   no lease and no server until a relaunch: the safety-net restart threw on
   the missing lease".

A risk from the code, not tested: rollback ignores a `false` result of the
stop of the new child, and releases the target lease anyway
(`electron/main.mjs:1598-1604`). This path needs a failed save of the active
identifier and a new child that does not exit in 9.5 s.

### 3.14 Start of the application: two fallbacks

1. The registry is read before the lease: "the lease and the child's
   OMB_DATA_DIR both follow a named environment" (`electron/main.mjs:2821-2822`).
   A development build ignores the named environment
   (`electron/main.mjs:2823-2824`).
2. **Missing folder.** If the active local entry is `missing`,
   `bootEnvironmentDir` gives the default folder with `fellBack: true`
   (`electron/environments.cjs:432-439`). The application saves
   `activeId: "local"` and shows "The environment's folder is missing" /
   "{folder} is not there anymore, so [the application] came up on this
   computer's default data folder instead. Restore or remount that folder,
   then choose the environment again from the Server menu."
   (`electron/main.mjs:2826-2830`, `src/locales/en.json:10054-10055`). This
   save is not in a `try` in the lines read.
3. Then it takes the lease of the chosen folder. A failure shows an error box
   and quits (`electron/main.mjs:2833-2846`).
4. **Failed start.** If the server does not start on a named folder, the
   application saves `activeId: "local"`, releases that lease, takes the
   default folder's lease, and starts again one time. Then it shows "The
   environment was unhealthy" (`electron/main.mjs:2961-2985`,
   `src/locales/en.json:10058`). If the default lease fails, it shows an
   error box and quits (`:2977-2983`).
5. A crash during a switch leaves the old active identifier on disk, because
   the switch saves it last. So the next start opens the old folder
   (`electron/environment-switch.mjs:76-82`).
6. At quit, the supervisor stops the child. A child that does not stop keeps
   the lease ("retaining the data-directory lease"). The lease is released
   at `will-quit` and at process exit, not after a crash
   (`electron/main.mjs:3069-3124`).

### 3.15 Forget a named environment

`forgetEnvironment(id, purge)` (`electron/main.mjs:1867-1924`):

1. An unknown identifier: no answer (`:1869`).
2. The active local entry: `{ ok: false, error: "active" }` (`:1870`).
3. A remote entry asks with a native dialog first (`:1871-1881`).
4. It stops computer sharing for the entry and drops its microphone choice
   (`:1882-1883`). This side effect comes before the refusals of steps 5
   and 6.
5. Purge while a switch runs: `{ ok: false, error: "busy" }` (`:1887`).
6. Purge of the folder that runs now (compared after `realpath`):
   `{ ok: false, error: "active" }` (`:1891-1894`).
7. Purge deletes the folder (recursive, force) only when its base name starts
   with `.openmausbot` and it is not the default folder or inside it
   (`:1895-1897`). A failed delete gives `{ ok: false, error: "purge" }`,
   and the entry stays (`:1898-1901`).
8. When the guard does not match, for example a folder with another name, it
   only logs "purge skipped" (`:1902-1904`). It then removes the entry and
   returns `{ ok: true }`. The person is not told that the files stay.
9. It saves the list without the entry (`:1906`).

The specification also planned "Open in Finder", the size of the data
folder, and "type the name to delete"
(`docs/superpowers/specs/2026-10-07-local-environments-design.md:112-114`).
The settings component has none of them
(`src/components/ConnectedWorkspacesSettings.tsx`, read completely).

### 3.16 Other users of the same switch, and local profiles

1. The clean workspace and its profiles use the same switch as a quiet
   "swap": "The folder swap is the one named local environments use"
   (`electron/clean-workspace.mjs:5`). The wiring is
   `switchLocalEnvironmentTo(dir, LOCAL_ID, true, background)`
   (`electron/main.mjs:1444`). So a swap shows no error box and saves
   `local` as the active identifier.
2. Its folders are `<data>-clean` and `<data>-profiles/<id>`, with
   `^[a-z0-9][a-z0-9-]{0,63}$` for the identifier
   (`electron/clean-workspace.mjs:32-38`).
3. Swaps go through one queue: "One swap at a time: a second would stop the
   server the first just started" (`electron/clean-workspace.mjs:73-79`).
   This is a second lock on top of `localSwitchInFlight`.
4. `seed(dir)` writes `config.json` with the flag `wx`, so it never writes
   over a file. It copies only `language` from the own config
   (`electron/clean-workspace.mjs:80-88`).

**Local profiles** (`electron/local-profiles.mjs`, commit `50df92437`,
2026-11-07) are a second list of local data folders. Both lists are live
(`electron/cloud-rail.mjs:94-101`, `electron/environments.cjs:80-96`,
`ConnectedWorkspacesSettings.tsx:96`, `electron/main.mjs:1652`).

1. A profile is the folder `<data>-profiles/<id>`
   (`electron/clean-workspace.mjs:33`, `:38`). The identifier is a slug of
   the name. A rename does not change it (`electron/local-profiles.mjs:67-75`,
   `:95`).
2. The registry is `<data>-profiles/profiles.json`:
   `{ v: 1, profiles: [{ id, name, color, createdAt }] }`. A name has at most
   40 characters. There are at most 20 profiles. A colour outside the list
   becomes `null` (`electron/local-profiles.mjs:20-22`, `:33`, `:37`, `:57`).
3. Read: a missing, damaged or unreadable file gives the one default entry,
   with no log. The field `v` is not checked
   (`electron/local-profiles.mjs:45-52`).
4. Write: each change reads the whole list and writes it back
   (`:82-87`, `:91-107`). The write goes to `<file>.<pid>.tmp` with mode
   `0600`, then a rename. No `fsync` and no copy (`:53-64`). So the first
   change after a damaged read writes over the file, and the other entries
   are lost. No test covers it.
5. Open: the profile switch uses the clean-workspace swap, so it shares the
   stop, lease and start steps of section 3.12 (`electron/local-profiles.mjs:182`,
   `electron/main.mjs:1444`). It runs only in a packaged build with no remote
   access (`electron/main.mjs:2600`).
6. Before it stops the server, it asks `GET /api/move/freeze` each second
   while work runs. The loop has no time limit. A failed request counts as
   "not busy" (`electron/local-profiles.mjs:23`, `:152-165`). A second click
   on the waiting place opens it at once, and the server stops "as a quit
   stops it" (`:3-4`, `:168-173`). The first version waited at most one
   minute. `3b0779633` replaced that with a Wait / Stop and switch / Cancel
   dialog. `ac5b12179` removed the dialog the next day and made the wait
   unlimited. `docs/verification/cloud-rail.md:140-142` still says "at most a
   minute".
7. When clicks overlap, the last one wins. A switch that loses returns
   nothing and shows no error. A real failure shows
   `native.places.profileFailed` (`electron/local-profiles.mjs:142`, `:178`,
   `:184`, `electron/main.mjs:2613`).
8. After a good open, `{ profile: id }` goes to `home-place.json`. The next
   start opens it again. If it cannot open, the application forgets it and
   opens My Cloud or this computer (`electron/local-profiles.mjs:183`,
   `electron/main.mjs:2583`, `electron/start-place.mjs:24-32`).
9. Remove: the rail asks first (`src/components/PlacesRail.tsx:321-350`).
   Main stops the profile if it runs, sends the folder to the Trash, and, if
   that fails, renames it to `.removed-<id>-<ms>`. Only then does it drop the
   entry (`electron/local-profiles.mjs:235-253`). No code removes
   `.removed-*` folders later. Refusals are typed strings: `name`, `taken`,
   `full`, `gone`, `failed` (`electron/local-profiles.d.mts:11`, `:35-38`).
10. A new profile's `config.json` holds only the language and the onboarding
    state (`electron/clean-workspace.mjs:40-44`, `:82-88`). Profile folders
    are on the deny list of lending, because they hold provider API keys
    (`electron/main.mjs:1429-1430`).

### 3.17 The environment identifier and descriptor

1. The identifier file is `<data>/environment-id`: one UUID and a new line
   (`server/environment.ts:49`, `:62`).
2. Read (`server/environment.ts:29-45`): no file gives nothing. Any other
   read error throws "Cannot read the existing environment identity at
   <file>; refusing to replace it." Content that is not a UUID throws "... is
   not a valid UUID; refusing to replace it." So a failed read never makes a
   new identifier.
3. Create (`server/environment.ts:54-83`):
   1. Make the folder with mode `0700` if it does not exist.
   2. Write a new UUID to `.environment-id.<pid>.<uuid>.tmp` with `wx`, mode
      `0600`, and `fsync`.
   3. Publish it with `linkSync`. "A hard link publishes atomically without
      replacing, unlike rename, which overwrites on POSIX" (`:68-69`).
   4. On `EEXIST`, another process won. Read its identifier and return it
      (`:72-74`).
   5. Always remove the temporary file (`:77-83`).
4. A test starts 12 processes on one folder at the same time. All get the
   same identifier, and no temporary file stays
   (`server/environment.test.ts:77-86`).
5. The server loads the identifier at module load, after `ensureDirs`, with
   no `catch` (`server/index.ts:669-670`). A bad file, a read error or a file
   system with no hard links stops the start.
6. `GET /.well-known/openmausbot/environment` is one of two public routes
   (`server/index.ts:12424-12428`). The label falls back to `os.hostname()`
   when no label is set (`server/environment.ts:132`). So the public answer
   can show the computer's host name.
7. Who compares the identifier:
   - lending stops with `machine-changed` when the server identifier
     differs from the saved grant (`electron/computer-sharing.mjs:507-519`).
   - the move to a server of the person's own refuses `other_server`
     (`electron/own-home-main.mjs:72`).
   - adding a server refuses the application's own local server
     (`electron/server-probe.mjs:141`).
   - the health check of a saved server checks only that the field is a
     string (`electron/server-status.mjs:36-38`).
8. Each named environment gets its own identifier at its first start
   (`docs/verification/local-environments.md:48-64`). The set of "own
   installs" holds only the default folder and the folder that runs now
   (`electron/main.mjs:1432`, `electron/lent-mcp.mjs:88-98`).
9. The wire type has no `mcpCaller`, but the server sends it
   (`packages/phone-protocol/src/environment.ts:14-54`,
   `server/environment.ts:141`).

### 3.18 The lease during a switch

The border of this batch said that `store-and-data-format.md` has the lease.
It has only the order of the start (`store-and-data-format.md:190`). Nobody
had read `electron/data-dir-lease.mjs` (`engine-process-lifecycle.md:1004-1006`).
This section gives only what the switch needs and the history of problem
(a). The full lease needs its own research row.

1. The record is `<data>/openmausbot-server.lease`. The process writes a
   candidate file with exclusive create (`wx`), mode `0600` and a flush, then
   hard-links it to the lease name. `EEXIST` means that a record exists
   (`electron/data-dir-lease.mjs:503-521`, `:692-705`). Fields: `version`,
   `pid`, `host`, `token`, `createdAt`, and the optional `boot`, `uptime`,
   `ns`, `start`, `machine` (`:296-315`).
2. A record that cannot be read, or that is not valid, always refuses. The
   code never writes over it: "cannot read the data-directory lease; refusing
   to start to protect its state" (`:322-338`).
3. The owner counts as alive when the record is from this boot,
   `kill(pid, 0)` succeeds, and the identity of the process matches
   (`:140-144`). Boot identity and uptime "may only prove a lease dead, never
   alive" (`:32-35`).
4. A reused process id:
   - Linux compares the start time of the process in the same pid namespace
     (`:469-475`).
   - Windows compares the creation time from `wmic`, or from a PowerShell
     CIM query when `wmic` is missing, with 5 s of slack (`:386-426`,
     `:487-493`). An unknown creation time counts as a match (`:490`).
   - macOS has no check within one boot (`:476`).
   - On Windows, `EPERM` counts as alive unless `tasklist` or CIM shows that
     the pid is gone (`:356-366`, `:428-467`).
5. Each probe is a blocking `execFileSync` on the main thread of the desktop
   application, with a limit of 5 s, or 15 s for PowerShell (`:164-167`,
   `:420`, `:462`).
6. A dead record is removed after an election among the processes that want
   it. Its `.reap-*` files are not deleted in normal use, so they collect in
   the folder (`:528-576`).
7. A live owner refuses a second acquire, also from the same process:
   "already using this data directory (process N)" (`:719-723`).
8. `release()` refuses while a delegated child lives (`:739`), and refuses a
   record of another process. It checks pid, host and token, then removes
   the file. The check and the removal are two calls (`:740-745`). A crash
   leaves the record, and the next acquire proves it dead.
9. The parent gives the lease to its child through two private variables,
   `OPENMAUSBOT_INTERNAL_DATA_DIR_LEASE=v1:<pid>:<token>` and
   `OPENMAUSBOT_INTERNAL_DATA_DIR_HOST`. The child deletes them, checks the
   parent's record against `process.ppid`, and takes a second lease that only
   one live child can hold. This is why a child on a fallback port never
   replaces a live child (`:621-676`, `:752-755`, `:854-864`).

What this means for the switch:

- The switch waits for the old child to exit before it releases the lease.
  It stops if the child does not exit in 9.5 s
  (`electron/main.mjs:1573-1577`). So `release()` does not meet a live
  child (`:739`).
- Between the release of folder A and the rollback to A, another process (a
  command-line server, a second application) can take A. Nothing reserves
  the folder. The revive then never forces it
  (`electron/environment-switch.mjs:86-88`), and the application stays with
  no server.
- Each acquire on Windows can block the main thread for up to 15 s per probe.

The history of problem (a) in this file, with the first release that has
each fix:

| Release | Commit | Fix |
|---|---|---|
| v0.1.66 | `c0596fa48` | A pid reused after a reboot: prove the lease dead across a reboot |
| v0.1.83 | `7c82592ff` | A pid reused in the same boot on Windows: the `wmic` creation time |
| v0.1.138 | `a5be3e504`, `267ddcd81` | Windows 11 has no `wmic`, so a lease "could never be recovered": the PowerShell CIM probe |
| v0.1.165 | `fafedc516` | A dead Windows process that still answers `EPERM` |
| v0.1.165 | `c18fe85e5` | The strict compare took over the lease of a live owner and put two servers on one folder: the 5 s slack |
| v0.1.181 | `fe8106124`, `551dd074b` | The child skips the probe of its parent. The first commit switched off the Linux check by mistake, and the second put it back the same day. No release has the first without the second |

Six more fixes were about a lease that locked a person out after a restart or
a crash: `c0596fa48` (v0.1.66), `fec95c4f8` (v0.1.91, a hostname change),
`d61397da3` (v0.1.126, a Cloud volume of an earlier machine), `773bdc1f5`
(v0.1.131, containers that restart pids from 1), `0d3ead341` (v0.1.153, a
container in a restart loop after `kill -9`) and `f8b6f75eb` (v0.1.165, "the
folder stayed locked until the file was deleted by hand").

`changelog.md` section 5 names v0.1.83 and v0.1.138 for this problem. The
code history adds v0.1.165: `c18fe85e5` fixed a compare that put two servers
on one folder.

### 3.19 The documents compared with the code

The four documents date from 2026-10-07 and did not change after it
(`a951a7b94`, `2df79e582`, `a0de367d4`). The code changed later:

| Document says | Code at `fcce0b6de` |
|---|---|
| The UI is in "Settings → Servers" (`docs/plans/local-environments.md:38`) | The group is in "Your computers" on the application page (`src/components/settings/pages/AppPages.tsx:68-71`), Advanced mode and packaged build only (`ConnectedWorkspacesSettings.tsx:96`) |
| A startup screen offers "Open This computer instead" (spec `:101-103`) | An automatic fallback with a dialog (section 3.14) |
| "User copy never says 'workspace'" (spec `:47-48`) | "New workspace on this computer…" (`electron/environments.node-test.mjs:471`, commit `50df92437`) |
| No new `en.json` keys (superpowers plan `:16`) | The text is in `en.json` (`src/locales/en.json:2-22`) |
| An empty slug is refused (superpowers plan `:89`) | It gets a random suffix (`electron/main.mjs:1671-1675`, commit `84539fde0`) |
| The confirm text has no "Running turns stop." (verification `:48-49`) | It has it (`src/locales/en.json:18`) |
| Open in Finder, folder size, type the name to delete (spec `:112-114`) | Not built |

The history of the code:

- 2026-10-07: `e07b27c28` (registry), `31d4aef72` (orchestrator, in
  v0.1.108), `2781ca422` (wiring), `874c8bef8` and `0942e3b42` ("Windows dir
  comparisons, legacy lease on switch, retry-gated fallback dialog").
- 2026-10-10: `84539fde0`. `runningDataDir` apart from `activeId`, "stopChild
  throws when the server child does not stop", a failed save rolls back with
  `persist-failed`, dedup of local folders by a normalized key, and guards on
  purge.
- 2026-11-06: `0b2c12707` (v0.1.145). The revive.
- 2026-11-07: `50df92437`. Local profiles from the rail (section 3.16).
- 2026-11-10 and 11-11: `3b0779633` added a dialog before a busy profile
  switch, and `ac5b12179` removed it the next day ("a busy switch waits on
  its own, no dialog").

`announcements/releases.json` covers only 0.1.153 (2026-11-11) to 0.1.182.
Both mechanisms are older, so it has no note for them. No release after
v0.1.182 exists yet. None of the 13 commits after the tag changes this
feature.

## 4. The data

### 4.1 The `features` keys

All keys are in `server/config.ts:200-229`. "Settings" says where the person
changes the key.

| Key | Type | Default | Gate | Override | Settings |
|---|---|---|---|---|---|
| `skillAuthoring` | boolean | on | `config.ts:599-601` | - | Early features (Bots page) |
| `skillReview` | boolean | off, needs `skillAuthoring` | `config.ts:607-609` | - | Early features |
| `skillReviewSteps` | int 3-100 | 10 | `config.ts:603-615` | - | Early features, while review is on |
| `showToolCalls` | boolean | off | `config.ts:636-638` | - | Appearance, Chat group |
| `browser` | boolean | on | `config.ts:640-642` | - | Desktops page, and the browser switch of one bot |
| `sharedComputers` | boolean | three states | `config.ts:645`, `:647` | - | none (by hand) |
| `claudeUserMcp` | boolean | off | `config.ts:649-651` | `OMB_CLAUDE_INHERIT_USER_CONFIG` adds | MCP servers panel |
| `claudeUserSkills` | boolean | off | `turn-settings.ts:8-10` | the same | MCP servers panel |
| `llmThreadTitles` | boolean | retired | none | - | none |
| `smartSetupChoices` | boolean | on | `setup-suggestions.ts:423` | - | none |
| `autoRecall` | boolean | on | `config.ts:617-619` | - | none |
| `skillsLibrary` | boolean | off | `skill-library.ts:16-18` | - | none |
| `shareLearnedSkills` | `off`/`ask`/`auto` | `ask` with the library, else `off` | `skill-share.ts:32-35` | - | Early features |
| `roomMemoryCapture` | boolean | off | `config.ts:621-623` | - | Memory section of one bot |
| `parallelRoomJobs` | boolean | on | `host/room-jobs.ts:21-23` | - | none |
| `acpPlanLines` | boolean | off | `session-reports.ts:78-83` | `OMB_ACP_PLAN_LINES` | none |
| `agentsToolBridge` | boolean | off, on for a local model | `agents-bridge-switch.ts:33-47` | `OMB_AGENTS_TOOL_BRIDGE` | none |
| `savedSteps` | boolean | on | `saved-steps.ts:62-64` | - | Desktops page, Mac only |
| `usbPhoneTakeover` | boolean | off | `phone-screen/flag.ts:5-7` | - | Early features, only with a USB port |
| `cloudComputerAutoReplace` | boolean | on | `boat-recovery.ts:65-75` | `OMB_CLOUD_COMPUTER_AUTO_REPLACE` | none |
| `phonePush` | boolean | on | `phone-push.ts:74-81` | `OMB_PHONE_PUSH` | none |
| `skillBurger` | boolean | on | `skill-burger/store.ts:24-26` | - | Features page |
| `threadTabs` | boolean | off | `index.ts:11619` | - | Features page |
| `teamBoard` | boolean | off, Team Cloud only | `index.ts:11371`, `:11619` | - | Features page |
| `suggestedReplies` | boolean | on | `index.ts:11619` | - | Features page |

`docs/feature-flags.md` documents 18 of the 25 keys. It does not list
`cloudComputerAutoReplace`, `phonePush`, `skillBurger`, `threadTabs`,
`teamBoard`, `suggestedReplies` and `llmThreadTitles`. The 16 documented
boolean defaults match the gates.

### 4.2 The files of the flags

| File | Shape | Written by | On a failed read |
|---|---|---|---|
| `<data>/config.json`, key `features` | object, 25 optional keys | `saveConfig` (`server/config.ts:875-999`): merge onto the raw file, dated copy (10 kept), atomic, `0600` | `loadConfig` uses all defaults (`:699-714`). `saveConfig` refuses with 503 (`:885`) |
| `<data>/config.json` (rename) | the same | `migrateLegacyFeatureFlags`: atomic, `0600`, no dated copy (`legacy-feature-flags.ts:22`) | returns with no write (`:15-18`, `:24-26`) |
| `<data>/skill-state/<bot>/library-opt-out.json` | sorted array of skill names | `setLibrarySkillOptOut`: atomic, `0600` (`skill-library.ts:343-353`) | empty set, one warning. The next write replaces the file (`:323-353`) |

### 4.3 The registry of environments

`environments.json` in Electron `userData`
(`electron/environments.cjs:335-338`):

```json
{
  "version": 2,
  "environments": [
    { "id": "<id>", "kind": "local", "name": "<name>", "dataDir": "<absolute path>", "color": "<colour>" },
    { "id": "<id>", "kind": "remote", "name": "<name>", "origin": "https://host:port" }
  ],
  "activeId": "local",
  "localColor": "<colour>"
}
```

| Field | Rule | Source |
|---|---|---|
| `id` | `^[\w-]{1,64}$`, not `local`, unique | `environments.cjs:291`, `:304-308` |
| `kind` | `local` or `remote`. Missing means `remote` | `:320-321` |
| `name` | trimmed, spaces collapsed, at most 60 characters. A long name in the file is cut. A long name typed by the person is refused | `:5`, `:252-255`, `:409` |
| `dataDir` | absolute by text pattern. Unique by normalized key | `:266-288`, `:310-315` |
| `origin` | `http` or `https`, no user name or password. Only the origin is kept | `:23-34` |
| `color` | one of blue, teal, purple, orange, red, yellow | `:7-8` |
| `missing` | added at read, written to disk by accident, dropped at the next parse | `environments-file.mjs:18-19`, `environments.cjs:317`, `:337` |
| `activeId` | a kept entry or `local` | `:329` |
| remote extras | `microphone`, `home`, `team {id, role}`, `cloud {id, role}` | `:326-327` |

The file holds no secret. A remote session is an HttpOnly cookie in
Chromium's cookie store (`electron/environments.cjs:1`), and a pairing code is
not saved (test `electron/environments.node-test.mjs:18-26`).

### 4.4 The state in memory of the desktop process

| Value | Meaning | Source |
|---|---|---|
| `environmentsState` | the parsed registry | `electron/main.mjs:1413` |
| `runningDataDir` | the folder that this process leases now | `electron/main.mjs:270-271` |
| `desktopDataDirLease` | the lease object | `electron/main.mjs:269` |
| `localSwitchInFlight` | the one lock against two switches | `electron/main.mjs:272` |
| `SERVER_PORT` | 8799, kept through a switch | `electron/main.mjs:136`, `:1571` |
| supervisor `paused` | blocks restarts during a switch | `electron/server-supervisor.mjs:35`, `:105-114` |

### 4.5 The bridge to the renderer

`window.ogb.environments` (`electron/preload.cjs:509-529`,
`src/types/ogb.d.ts:266-308`):

| Method | Channel | Answer |
|---|---|---|
| `state()` | `environments:state` | `{ localOrigin, remote, packaged, activeId, environments }` (`main.mjs:2648-2654`) |
| `switch(id)` | `environments:switch` | local target: `{ ok, error? }`. Remote: nothing |
| `create(name, dataDir?)` | `environments:create` | `{ ok, error?, state }` |
| `pickDir()` | `environments:pick-dir` | `{ ok: true, path }` or `{ ok: false }` |
| `forget(id, purge?)` | `environments:forget` | `{ ok }` or `{ ok: false, error }`. The bridge sends `purge` only when it is `true` |
| `addFromLink(link, name?)` | `environments:add-from-link` | remote servers only |
| `status()`, `retry(id?)` | `environments:status`, `environments:retry` | health rows of saved remote servers only (`main.mjs:2670`) |
| `onStatus(cb)` | `environments:status-changed` | no payload |
| `onOpenSettings(cb)` | `workspaces:open-settings` | a computer identifier |

Each handler needs the local page in the main window
(`localWorkspaceOnly`, `electron/main.mjs:2453-2457`,
`electron/local-origin.cjs:28-37`). The preload comment "A remote page may
read the list" (`preload.cjs:509`) is stale.

Error codes of the main process: `dev`, `busy`, `switch-failed`, `name`,
`path`, `duplicate`, `nested`, `active`, `purge`. The orchestrator also has
`unavailable`, `locked`, `start-failed`, `probe-failed`, `unhealthy` and
`persist-failed`, but these reach only the log.

### 4.6 Other files

| File | Shape | Source |
|---|---|---|
| `<data>/environment-id` | one UUID and a new line, `0600` | `server/environment.ts:49-69` |
| `<data>-clean/`, `<data>-profiles/<id>/` | data folders of the clean workspace and its profiles | `electron/clean-workspace.mjs:32-38` |
| the lease record | section 3.18 | |

## 5. The UI

### 5.1 Settings → Features

- One `SettingsGroup` with no label and four switches, in this order: Skill
  Burger, Thread tabs, Suggested replies, Board
  (`src/components/settings/pages/FeaturesPage.tsx:46-56`).
- A row shows only when the server reports its key as a boolean (`:19`,
  `:23`). So the server decides which switches show. The Board row shows
  only on a Team Cloud. An empty group hides itself
  (`src/components/SettingsPrimitives.tsx:178`).
- The page is for admin pages only: not a remote client, and not a team
  member who is not an admin (`src/components/settings/settings-index.ts:54`,
  `:89-90`). It is in Simple mode too.
- Text (`src/locales/en.json:12103-12134`): "Features". "Skill Burger" /
  "Save a bot's run as steps you can run again". "Thread tabs" / "Show a
  bot's threads as tabs above the chat"; "Suggested replies" / it "uses a
  little of your plan or API credit"; "Board".
- Save: a `saving` guard, `PATCH`, then the answer replaces the store config
  (`FeaturesPage.tsx:24-36`). While it saves, the switch is disabled with a
  wait cursor and 50 % opacity (`:40-41`).
- Error: always "Couldn't save that. Check your connection and try again."
  The server message is not shown (`:32`, `en.json:12134`).
- `DESIGN.md:56-63` allows no new toggles except this page, and only when
  "its off state is clean: the feature is hidden whole, and nothing the
  person made is lost".

### 5.2 Early features (the Bots page)

- A `SettingsGroup` with "Early features" / "Early features may change while
  we test them." (`src/components/AppSettingsRows.tsx:398`,
  `en.json:3895`, `:11468`). It is inside an Advanced section. In Simple mode
  it shows only when a search or a link asks for it
  (`src/components/settings/AdvancedSection.tsx:25-31`,
  `src/components/settings/pages/PlacePages.tsx:180`).
- Rows:
  - "Bots may write their own skills" with an "Early" tag
    (`AppSettingsRows.tsx:400-408`, `en.json:3898`).
  - "Learn skills automatically" and "Steps before a review". A number field
    saves on blur or Enter. A bad number shows "Enter a whole number from
    {min} to {max}." and sends nothing. A ref guard stops a double click
    (`src/components/SkillReviewSettings.tsx:27-101`).
  - "Share skills" with Off, Ask and Automatic. It is hidden without the
    library and disabled when authoring is off
    (`src/components/ShareLearnedSkillsSettings.tsx:10-47`).
  - the USB phone row, shown only where the server reports the key
    (`src/components/UsbPhoneTakeoverSettings.tsx:12`).
- Each row: no optimistic change, a `saving` guard per row, the error in a
  `role="alert"` line with the server message or a fallback text
  (`AppSettingsRows.tsx:340-361`).

### 5.3 Other places that write a flag

| Place | Key | Source |
|---|---|---|
| Appearance → Chat, "Tool calls" | `showToolCalls` | `AppSettingsRows.tsx:334-372`, `AppPages.tsx:174` |
| Desktops page, browser rows | `browser` | `BrowserSettingsRows.tsx:35-71` |
| Desktops page, saved steps (Mac only) | `savedSteps` | `SavedStepsRow.tsx:14-34` |
| MCP servers panel, two switches | `claudeUserMcp`, `claudeUserSkills` | `ClaudeCodeSwitches.tsx:20-56` |
| The browser switch of one bot | `browser` (turns the place-wide flag on) | `ComputerPanel.tsx:1057-1063` |
| The memory section of one bot | `roomMemoryCapture` (place-wide) | `MemorySection.tsx:259-274` |

- Four different error texts exist for the same failure (`en.json:3897`,
  `:2102`, `:2126`, `:12134`).
- The two Claude switches say what reaches the bots: "every MCP server and
  connector from your own Claude Code setup, on every message", and skills
  from `~/.claude/skills` "straight from the folder", while "your hooks, MCP
  servers and CLAUDE.md stay out" (`en.json:6289`, `:6293`).

### 5.4 Environments on this computer

The component is `src/components/ConnectedWorkspacesSettings.tsx`. It is
mounted in the application settings as "Your computers" / "Switching places
doesn't move your bots or conversations." (`AppPages.tsx:68-71`,
`en.json:11076`, `:11407`).

- Groups: "Your computers" (the places list, `ServerList`), then
  "Environments on this computer" / "Separate setups on this computer, each
  with its own bots, conversations and data folder." (`:89-166`,
  `en.json:2`, `:16`).
- The environments group shows only in Advanced mode and in a packaged build
  (`:96`). A development build shows no text for it.
- States:
  - no bridge (a browser): "Manage server connections in the desktop app."
    (`:79`, `en.json:9180`).
  - loading and load failed (`:91`).
  - busy: all buttons and inputs disabled, a spinner on Create (`:106-159`).
  - error: one `role="alert"` line (`:164`).
- One row for each local entry: a laptop icon, the name, the folder, and
  " · missing" when the folder is missing (`:103-104`).
- The active row shows "Current" and no buttons (`:105`). With "This
  computer" active, no row says "Current", and the group has no row to go
  back to it. The way back is the places list or the menu
  (`electron/environments.cjs:86`).
- Switch: a confirm "Switch to {name}? The app restarts on that environment.
  Running turns stop." (`:108`, `en.json:18`). A result with `ok: false`
  shows "Couldn't switch environments. Try again." (`:110`, `en.json:19`).
  For `switch-failed`, main has already shown its native box, so the person
  can see two messages. Switch is offered for a missing folder too.
- After a good switch the page does not read the state again: "a successful
  switch unloads this renderer" (`:66-68`).
- Forget panel: "Also delete this folder and everything in it ({path}).
  Otherwise the folder, its bots and conversations stay on this computer."
  Cancel, and a red Forget (`:117-132`, `en.json:6`). A failure shows
  "Couldn't forget the environment. Try again." (`en.json:21`).
- New environment: Name (required, at most 60), Data folder (optional,
  "Leave empty to create one in your home folder"), "Choose…" (the native
  folder picker), Create (`:135-162`, `en.json:9-15`). A failure shows
  "Couldn't create the environment. Check the data folder, then try again."
  (`en.json:22`).
- Every code from main becomes one text for each action. The person never
  sees `duplicate`, `nested`, `busy` or `locked`.

### 5.5 The menu and the native dialogs

- The server menu has a radio item "This computer", then the local profiles,
  then each saved entry. A local entry shows its folder as the sublabel. On
  Windows and Linux the status joins the label, because those menus show no
  sublabel (`electron/environments.cjs:76-104`, `:239`).
- When My Cloud is home, local entries are not in the menu (`:111`).
- Native dialogs: "Could not switch environments" (`en.json:9997-9998`).
  "The environment's folder is missing" (`:10054-10055`). "The environment
  was unhealthy" (`:10058`). "Could not update servers" with "Could not save
  server connections on this computer. Please try again." (`:9995-9996`).
  "The bot server stopped" when the supervisor gives up (`:9975-9976`).

### 5.6 Local profiles on the rail

- The "+" of the left rail offers "New workspace on this computer…" first. It
  asks a name and a colour (`electron/environments.node-test.mjs:471`,
  `src/components/PlaceAddSheet.tsx:230-314`).
- A profile's menu on the rail renames it, changes its colour and removes it.
  Remove asks first (`src/components/PlacesRail.tsx:315-380`).
- While a switch waits for work under way, the rail shows the waiting place.
  A second click opens it at once (`electron/local-profiles.mjs:152-173`).
- A failed open shows `native.places.profileFailed`
  (`electron/main.mjs:2613`).

## 6. The tests

### 6.1 Flags

- Removed keys are dropped at parse and from a patch:
  `computerClaimIdleRelease`, `cloudOverflow`, `chiefEscalations`,
  `routinesInConversation`, `skillRecorder`
  (`server/config.test.ts:245-259`, `:666`, `:712-716`).
- Gate defaults: `skillAuthoring` on, `browser` on, `showToolCalls` off,
  `sharedComputers` off unless `true`. A wrong type is refused with its path
  (`server/config.test.ts:658-724`). No test covers `ownerLendingEnabled`.
- A save keeps a stored key and an unknown top-level key
  (`server/config.test.ts:1892-1926`).
- A feature change restarts no engine (`server/config.test.ts:2165-2169`).
- The rename of `skillRecorder`: true, false, an explicit new value, a value
  that is not a boolean, `features: null`, no key, invalid JSON
  (`server/config.test.ts:1528-1591`).
- Overrides: `phone-push.test.ts:114-121` (the variable wins both ways) and
  `boat-recovery.test.ts:855-858` (the variable wins, `" FALSE "` and `Off`
  are accepted). The readers did not read the tests of the bridge and the
  plan lines.
- The library: an unknown feature key is dropped
  (`server/skills-library.test.ts:193-201`). The flag off gives no every-bot
  skill in a turn (`:163-185`). A damaged or unreadable opt-out file keeps
  every every-bot skill (`server/routes/bot-skills.test.ts:375-398`). No
  test writes over a damaged opt-out file.
- Client: `src/lib/feature-flags.test.ts` fixes the client defaults. It does
  not test `claudeUserMcp`, `claudeUserSkills`, `threadTabs`, `teamBoard`,
  `skillBurger` or `roomFeedEnabled`.
- The Features page: in Simple mode, no room feed row, the Skill Burger click
  sends a patch, the Board row only when reported, no page for a team member
  who is not an admin (`src/components/settings/SettingsWindow.test.ts:284-334`).
- No test covers: an unknown key on disk that stays through a save, one bad
  flag value that sends all flags to their defaults, and the `shareLearnedSkills`
  default of the Settings registry.

### 6.2 Environments

- `electron/environments.node-test.mjs` (pure, no disk):
  - version 1 reads as remote, version 2 needs an absolute folder, version 3
    reads as empty (`:194-229`).
  - the errors of `withLocalEnvironment`, with a sibling folder accepted
    (`:232-248`, `:303-315`).
  - path shapes, Windows case and slashes, UNC (`:289-301`, `:338-366`).
  - `bootEnvironmentDir` with a missing folder (`:278-287`).
  - a local entry cannot be renamed (`:480-490`).
- No test reads or writes the file itself (`environments-file.mjs`). The
  failed read, the temporary file and `environments-save-failed` have no
  test.
- `electron/environment-switch.node-test.mjs`: the order `stop, release,
  acquire, start, probe, persist` (`:48-60`). It also covers a missing parent, a held lease,
  a folder to make, a failed probe with exactly one restart, a failed save, a
  failed rollback, a stop that throws (`:62-224`), and the revive with and
  without a lease, with retries, and with no child (`:247-273`).
- `electron/server-supervisor.node-test.mjs`: a pause publishes
  "unavailable" and forks nothing (`:258-288`). Source tests run the text of
  `switchLocalEnvironmentTo` with fakes: guard order (`:290-307`), a failed
  release, a lost lease, one fork on success, a child that will not stop,
  boot with a missing folder, forget during a switch (`:414-549`).
- Not tested: a rollback whose stop of the new child fails, `windowFollows()`
  false, a background swap.
- `src/components/ConnectedWorkspacesSettings.test.ts`: order of groups, no
  group in a development build, create with and without a folder, "Choose…",
  forget with and without purge, the switch confirm, generic error texts, no
  Forget on the active row (`:66-175`).
- `server/environment.test.ts`: one identifier, mode `0600`, 12 processes in
  a race, a bad file stays, a folder at the path throws (`:68-107`).
- No end-to-end test exists. "The control surface cannot drive it"
  (`docs/verification/README.md:126-129`). The manual recipe does not test
  purge, Windows or Linux (`docs/verification/local-environments.md:119-122`).

### 6.3 Local profiles and the lease

- `electron/local-profiles.node-test.mjs` (306 lines) covers the list,
  create, rename, colour, remove and the wait. It does not write over a
  damaged registry (`:88-95` reads a damaged file only). When My Cloud is
  home, the default entry is listed and can be removed (`:84-85`, `:254`).
- `electron/data-dir-lease.node-test.mjs` (846 lines) covers a second
  acquire by the same process (`:419-424`), `release()` with a live child
  (`:177-180`), the child handoff (`:160-211`) and the refusal of a damaged
  record (`:841-846`). No test covers the gap between the check and the
  removal in `release()`.
- `electron/cua-launch.test.mjs:288-298` allows at most three blocking calls
  in the lease file.

## 7. Ours compared

Our crates today: `bot-protocol` has identifiers, messages and events.
`bot-core`, `bot-engine`, `bot-cli` and `bot-desktop` are skeletons
(`crates/*/src`, 299 lines in all). Step 6 plans `data_dir.rs`, `settings.rs`
and `atomic.rs` in `bot-core` ([`../../plan/README.md`](../../plan/README.md),
step 6). D10 puts the core in the desktop process.

| Part | Reference | Ours (crate and module) | Difference |
|---|---|---|---|
| Flag storage | `features` in `config.json`, a non-strict zod schema and a second TypeScript list (`server/config.ts:199-229`, `:470`) | `bot-core` `settings.rs` (step 6.2): one `Features` struct with `serde` defaults | One list. The default is on the field, not in a gate function |
| Defaults | about ten gate files and a second copy in the Settings registry (section 3.1) | one `Default` for the struct | No mismatch such as `shareLearnedSkills` |
| Unknown keys | dropped at parse, kept on disk by the merge | `serde` ignores unknown fields. A save that rewrites the struct drops them unless we keep them | P555 |
| A bad value | the whole file falls back to defaults (`server/config.ts:699-714`) | a typed error from `load` (changelog section 7, step 6) | P554 |
| Overrides | four parse styles, in the gate of each flag | `bot-cli` or `bot-desktop` read the variables, `bot-core` gets a value (D10 rule: all settings from variables, flags or a file) | One parser (P556) |
| Write | merge a patch onto the raw file, dated copy, atomic, `0600` | `atomic.rs` (step 6.3). `save` takes a value that only a good `load` can make (changelog section 7) | The same safety, and a typed refusal |
| Opt-out file | a JSON array, written over after a failed read | not planned yet (skills, P428 and later) | P552 |
| Registry of environments | `environments.json` in `userData` (`electron/environments.cjs`, `environments-file.mjs`) | `bot-desktop`, a module for places | P547, P551 |
| Data folder in a process | fixed at module load (`server/config.ts:679`). A switch needs a new server process | `bot-core` `DataDir` from a path that the caller gives (step 6.1) | We can close and open a folder in one process (P545) |
| Switch | stop the child, release, make, take, start, check, save, with rollback and revive (`electron/environment-switch.mjs`, `main.mjs:1553-1643`) | `bot-desktop` calls `bot-core`: close the runtime and the store, release the lease, open the new `DataDir`, take its lease, open the store | No child, no supervisor pause, no revive (P545) |
| Lease | a record with pid, boot and host data, many Windows fixes (section 3.18) | `bot-core` `data_dir.rs`, with `fs4` (`docs/comparison.md:66`) | An OS file lock ends with the process, so no pid check (P546) |
| Environment identifier | `<data>/environment-id`, hard-link publish (`server/environment.ts:29-84`) | `bot-core` `data_dir.rs` | We follow the reference |
| Settings UI | `FeaturesPage.tsx`, `AppSettingsRows.tsx`, `ConnectedWorkspacesSettings.tsx` | `bot-desktop` UI, settings panel (step 1, later steps) | Typed errors in the UI (P557) |

## 8. Where we can be better

Each point has a reason. A point that answers a problem of section 5 of
[`changelog.md`](../changelog.md) names it, with its releases. A point that
answers no release problem says "judgment call".

The numbers P545 to P558 are the proposals of this file.

1. **P545. Switch the data folder inside one process.**
   - Problem in the reference: a failed rollback "left no lease and no server
     until a relaunch" (`0b2c12707`, v0.1.145). The fix added a revive with
     retries (`electron/environment-switch.mjs:86-105`), on top of a
     supervisor pause and a rollback restart (`electron/main.mjs:1565-1615`).
     The cause is that the server fixes its data folder at module load
     (`server/config.ts:679`), so each switch must stop and start a process.
     On Windows the stop is a kill, and a kill writes no deferred save
     (`store-and-data-format.md:459-463`, `electron/main.mjs:346`).
   - Release problems: "State lost at a restart or a crash" (v0.1.145) and
     "Process control on Windows".
   - Condition: this holds only if the core runs in the desktop process. D10
     is "Proposed" and also allows the core on `127.0.0.1`. With a separate
     core process, we follow the reference.
   - Ours: D10 puts the core in the desktop process, and step 6.1 makes
     `DataDir` from a path that the caller gives. `bot-desktop` asks
     `bot-core` to close the runtime and the store, release the lease, open
     the new `DataDir`, take its lease and open the store. A failure opens
     the old folder again. No child, no supervisor pause, no revive, and the
     store closes normally on every platform. The engine processes still stop
     at a switch, as the reference says today ("Running turns stop.",
     `src/locales/en.json:18`).
2. **P546. An operating-system file lock for the lease.**
   - Problem in the reference: the lease record is proved dead or alive by
     process probes. A reused pid on Windows needed fixes in v0.1.83,
     v0.1.138 and v0.1.165. One fix "took over a live owner's lease, which
     put two servers on one folder" (`c18fe85e5`). The probes block the main
     thread for up to 15 s (`electron/data-dir-lease.mjs:164-167`, `:420`).
     macOS has no check in one boot (`:476`).
   - Release problem: "Process control on Windows" (v0.1.83, v0.1.138).
   - Ours: `bot-core` `data_dir.rs` holds an exclusive lock on a lock file
     with `fs4` (`docs/comparison.md:66`). The system drops the lock when
     the process ends, so there is no pid, no boot identifier and no probe. A
     second process gets a typed refusal. Keep a small record next to the lock
     only to name the holder in the message.
   - What we give up: the reference detects another machine or container on
     a shared folder (`electron/data-dir-lease.mjs:124-130`, `:271-294`). An
     advisory lock on NFS or SMB is not reliable. So the record next to the
     lock keeps the host and machine identifiers, and the lock refuses a
     folder whose record names another machine. No proposal of the plan
     covers the lease yet. `docs/comparison.md:66` already names `fs4`.
3. **P547. A failed read of a list file never leads to a save over it. New
   facts for P76.**
   - Problem in the reference: `environments.json` reads as an empty list on
     any error, with no log (`electron/environments-file.mjs:21-23`), and the
     next save writes the whole short list (`electron/main.mjs:1523-1524`).
     A file from a newer version reads as empty too
     (`electron/environments.node-test.mjs:228-229`), so a downgrade loses
     every named environment and saved server at the first save.
     `profiles.json` has the same fault (`electron/local-profiles.mjs:45-52`,
     `:82-87`). Neither write has `fsync` (`environments-file.mjs:29-31`,
     `local-profiles.mjs:53-64`).
   - Release problem: "A file written over after a failed read" (v0.1.103,
     v0.1.107, v0.1.151).
   - P76 ([`../../plan/store-and-data-format.md`](../../plan/store-and-data-format.md))
     has the rule for the store files. This adds two files of the desktop
     shell that the rule must cover too.
   - Ours: the registry in `bot-desktop` uses the rule of changelog section 7:
     `save` takes a value that only a successful `load` can make. A damaged
     or newer file gives a typed error, the file is set aside, and the
     person is told. The write uses `atomic.rs` (step 6.3) with `fsync`.
4. **P548. A time limit on the switch and on the wait for work.**
   - Problem in the reference: the switch has no overall limit. Stop, start,
     rollback start and revive add up to minutes, and the lock stays set for
     all of it (`electron/main.mjs:293`, `:1174-1181`, `:1630-1642`). The wait
     of a profile switch asks the server each second with no limit, and a
     failed request counts as "not busy" (`electron/local-profiles.mjs:152-165`).
     The first version waited at most one minute, then a dialog came and went
     in two days (`3b0779633`, `ac5b12179`).
   - Release problem: "A turn or a wait that does not end" (v0.1.15,
     v0.1.123, v0.1.151).
   - Ours: the switch is one function with one deadline. A wait for running
     turns is a value with a limit and a reason (changelog section 7). At the
     limit the switch stops the turns as a quit does, or refuses with a typed
     reason.
5. **P549. One record of where the application runs.**
   - Problem in the reference: the folder that runs and the active
     identifier are two values. A background swap or a newer rail click
     skips the save of the active identifier (`electron/main.mjs:1616`), and
     a clean-workspace swap saves `local` (`:1444`). The comment accepts that
     they differ (`:270-271`). After a restart the person opens another
     folder than the one that ran.
   - Release problem: "State lost at a restart or a crash".
   - Ours: one `running` value in `bot-desktop`, saved in the same step that
     opens the folder. A newer click cancels the older switch before it opens
     anything.
6. **P550. Each environment starts from a list of allowed variables. New
   facts for P61 and P504.**
   - Problem in the reference: every environment's server gets all of the
     desktop's `process.env` (`electron/main.mjs:1113`). The default Claude
     account uses the person's `~/.claude`, outside the data folder
     (`engines-and-accounts.md:1177`). So "API keys are isolated per
     environment" (`docs/plans/local-environments.md:29-31`) is true only for
     named accounts. `OMB_CLAUDE_INHERIT_USER_CONFIG=1` adds the whole Claude
     setup, and the file cannot switch it off (`server/drivers/claude.ts:139-156`).
   - Release problem: "The person's own engine config reaches the bots"
     (v0.1.104, v0.1.170, v0.1.175).
   - Ours: P61 ([`../../plan/driver-contract.md`](../../plan/driver-contract.md))
     gives each engine process an allow-list of variables. P504
     ([`../../plan/engines-and-accounts.md`](../../plan/engines-and-accounts.md))
     gives the files of an engine home from an allow-list. This adds the case
     of environments.
     For environments, the engine homes of the default accounts go under the
     `DataDir`, and the person's own engine setup is a switch in that
     environment's settings, off by default.
7. **P551. One mechanism for more data folders on this computer.**
   - Problem in the reference: two lists live side by side. Named
     environments are in `environments.json` with names of 60 characters and
     a purge guard (`electron/environments.cjs:5`, `electron/main.mjs:1895-1897`).
     Profiles are in `profiles.json` with names of 40 characters, at most 20,
     and a delete to the Trash (`electron/local-profiles.mjs:20-22`, `:235-253`).
     The design rule "never say workspace" was reversed by the second
     (`50df92437`). The four documents describe only the first.
   - Release problem: "A feature added, then removed or reversed" (section
     6, "Where the data is", v0.1.91 to v0.1.182).
   - Ours: one registry and one switch in `bot-desktop`. The author decides
     which name and which entry point we keep.
8. **P552. The opt-out file refuses a save after a failed read. New facts
   for P76.**
   - Problem in the reference: a damaged `library-opt-out.json` gives an empty
     set, and the next switch-off writes a file with only the new name. All
     earlier opt-outs are lost, and the person is not told
     (`server/skill-library.ts:323-353`). The index writers of the same file
     refuse (`:391-392`).
   - Release problem: "A file written over after a failed read" (v0.1.103,
     v0.1.107, v0.1.151).
   - Ours: when the skills step comes (P428), the opt-out read keeps "fail
     open" for turns, but a write after a failed read refuses with a typed
     error. Add it to [`../../plan/skills.md`](../../plan/skills.md).
9. **P553. One `Features` struct with its defaults in one place.**
   - Problem in the reference: the keys are in a schema and in a second type
     (`server/config.ts:200-229`, `:470`). The defaults are in about ten gate
     files and again in the Settings registry. For `shareLearnedSkills` the
     Settings registry shows `off` (`server/app-settings/registry-config.ts:115`)
     while the runtime acts as `ask` (`server/skill-share.ts:34`). The
     document lists 18 of 25 keys (`docs/feature-flags.md:44-61`).
   - Judgment call: no release problem of section 5.
   - Ours: `bot-core` `settings.rs`, one struct with `serde` defaults. The
     settings UI and the runtime read the same value. A test lists every key.
10. **P554. A bad flag value refuses with its key, and does not reset all
    flags. New facts for P22 and P77.**
    - Problem in the reference: one wrong value in any checked section makes
      `loadConfig` use all defaults, with only a console line
      (`server/config.ts:543-547`, `:699-714`). "On unless false" features
      turn on. The save then keeps the bad file as its base (`:885-887`).
    - Judgment call. It is near "State lost at a restart or a crash",
      because the person's choices vanish at the next start.
    - P22 ([`../../plan/newer-config-unavailable.md`](../../plan/newer-config-unavailable.md))
      keeps one bad section as raw JSON with a warning. P77
      ([`../../plan/store-and-data-format.md`](../../plan/store-and-data-format.md))
      stops the start when the file is not JSON. This adds the case of one
      bad value inside `features`: the other flags must keep their values.
    - Ours: `load` gives a typed error that names the key. The desktop shows
      it, and offers a dated copy (the reference keeps 10,
      `server/config-backup.ts:16`).
11. **P555. A list of retired keys.**
    - Problem in the reference: five flags were removed and one retired.
      Cloud overflow lived six releases (section 3.9). Removed keys are
      dropped with no log, and stay on disk through every save
      (`server/config.ts:199`, `:892-902`).
    - Release problem: "A feature added, then removed or reversed" (v0.1.96,
      v0.1.152, v0.1.166, v0.1.182).
    - Related: P22 keeps unknown keys on disk.
    - Ours: follow the reference (drop, keep on disk), and add a list of
      retired keys with the release that removed each. A test checks that a
      retired key loads with no error and logs one line.
12. **P556. One parser for environment overrides.**
    - Problem in the reference: four parse styles for one idea (section
      3.3). `OMB_CLOUD_COMPUTER_AUTO_REPLACE=true` works, and
      `OMB_PHONE_PUSH=true` does nothing (`server/boat-recovery.ts:65`,
      `server/phone-push.ts:78-79`). The document says "exactly 1 or 0" for
      all.
    - Judgment call.
    - Ours: one function in the shell crate. It accepts the same words for
      every flag and refuses an unknown word with a message at start.
13. **P557. The person sees the cause of a failed switch, create or forget.**
    - Problem in the reference: each code (`locked`, `unavailable`,
      `duplicate`, `nested`, `busy`, `purge`) becomes one text for each
      action (`src/components/ConnectedWorkspacesSettings.tsx:110`, `:127`,
      `:142`). A failed switch can show two messages: the native box and the
      line in the page (`electron/main.mjs:1562`). A `busy` from the menu
      shows nothing (`:1533-1537`).
    - Judgment call.
    - Ours: the typed refusal of `bot-core` goes to the UI as a key with a
      text for each case. One place shows it.
14. **P558. Forget refuses before it acts, and says when files stay.**
    - Problem in the reference: forget stops computer sharing before it can
      refuse with `busy`, `active` or `purge` (`electron/main.mjs:1882`,
      `:1887-1900`). A purge that the guard skips returns `ok: true`, so the
      person thinks that the folder is gone (`:1902-1908`). A folder that
      holds the default folder is accepted (`electron/environments.cjs:418`).
    - Judgment call. It follows the rule of `AGENTS.md`: write the state,
      then act, and return a typed refusal.
    - Ours: check every refusal first. Return `kept_files` when the folder
      stays. Refuse a folder that holds the default folder.

### The problems of changelog section 5 in this feature

| Problem | In the reference here? | Evidence |
|---|---|---|
| Process control on Windows (lease after a reused pid, v0.1.83, v0.1.138) | Yes, in the lease that the switch moves | Section 3.18. Also: a switch stops the server with a kill on Windows, and a kill writes no deferred save (`store-and-data-format.md:459-463`, `electron/main.mjs:346`) |
| State lost at a restart or a crash | Yes | A failed rollback "left no lease and no server until a relaunch" (`0b2c12707`, v0.1.145). The active identifier and the running folder can differ after a background swap or a newer click (`electron/main.mjs:270-271`, `:1616`). No `fsync` in the registry write (`electron/environments-file.mjs:29-31`). One bad flag value sends all flags to their defaults at start (`server/config.ts:699-714`). Against: the active identifier is saved last, so a crash in a switch keeps the old folder (`electron/environment-switch.mjs:76-82`) |
| A turn or a wait that does not end | Yes | The switch has no overall limit (section 3.12). The wait of a profile switch has no limit (`electron/local-profiles.mjs:152-165`) |
| A file written over after a failed read | Yes, three files | `environments.json` (`electron/environments-file.mjs:21-23`, `electron/main.mjs:1523-1524`), `profiles.json` (`electron/local-profiles.mjs:45-52`, `:82-87`) and `library-opt-out.json` (`server/skill-library.ts:343-353`). Against: `config.json` (`server/config.ts:885`), `environment-id` (`server/environment.ts:33-43`), the rename (`server/legacy-feature-flags.ts:15-18`), `seed` with `wx` (`electron/clean-workspace.mjs:86-87`) |
| A feature added, then removed or reversed | Yes | Five flags removed, one retired, the room feed switch removed one release after it came (section 3.9). The "never say workspace" rule reversed, a second local mechanism, a dialog added and removed the next day, a startup screen that became an automatic fallback, spec items not built (section 3.19) |
| The person's own engine config reaches the bots | Partly | Off by default and switched by the person: `claudeUserMcp`, `claudeUserSkills` (`server/config.ts:649-651`, `server/turn-settings.ts:8-10`). `OMB_CLAUDE_INHERIT_USER_CONFIG=1` adds the whole Claude setup and cannot be switched off from the file (`server/drivers/claude.ts:139-156`). Every environment's server gets all of the desktop's `process.env` (`electron/main.mjs:1113`). The default Claude account uses the person's `~/.claude`, which is outside the data folder (`engines-and-accounts.md:1177`). So the claim "API keys are isolated per environment" (`docs/plans/local-environments.md:29-31`) is true only for named accounts and saved keys |

## 9. Not verified

- How `claudeUserMcp` and `claudeUserSkills` act at a turn, apart from the
  lines in section 3.3.
- The tests of `server/agents-bridge-switch.ts` and
  `server/drivers/acp/session-reports.ts`.
- That the in-memory `cfg.features` stays after a reload of a file that fails
  the schema (section 3.4, step 8). This is an inference from
  `Object.assign`.
- That a patch with only an unknown feature key saves an unchanged file
  (`server/routes/config.ts:203`). An inference.
- How a route answers when `setLibrarySkillOptOut` throws a disk error. No
  route catches it.
- Whether a caller refreshes the skills of a bot after an opt-out change. The
  function sends no event (`server/skill-library.ts:343-353`).
- What happens when the start-time save of `activeId: "local"` throws
  (`electron/main.mjs:2828`). It is not in a `try` in the lines read.
- The rollback risk of section 3.13 (a stuck new child). It comes from the
  code. No test covers it.
- Whether `ServerList` shows a "This computer" row with a switch back to the
  default folder.
- Whether the copy check `src/locales/words.test.ts` still refuses
  "workspace".
- A file system with no hard links (FAT, some network shares) at the first
  start of a named environment: from the code only.
- Whether the release that first shipped named local environments (about
  v0.1.108) had a release note. `releases.json` starts at 0.1.153.
- The non-English locale texts.

- Whether a person can add a folder under `<data>-profiles/` as a named
  local environment. A grep found no guard. The add flow was not read for it.
- What the home window's `openProfile` does with a Cloud home.
- How the server marks the turns that a second click cuts short.
- `scripts/testing/rail-profile-ui.e2e.test.ts` and the full diffs of the
  profile commits.
- The full decision tree of a lease acquire across hosts and containers.
  This file gives only what the switch needs (section 3.18).
