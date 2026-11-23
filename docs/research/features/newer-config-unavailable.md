# Rule: a config from a newer version loads in an older version as "unavailable"

Read on 2026-11-23 for part 2 of [`../README.md`](../README.md), and for steps
4 (the registry) and 6 (settings) of [`../../plan/README.md`](../../plan/README.md). All
paths are in the reference project, under `server/` unless a path starts with
another folder (`src/`, `shared/`). Nobody opened the `enterprise/` directory.

This file adds to [`driver-contract.md`](driver-contract.md). It does
not repeat that file. It closes two open points of that file: the six wrappers
around each instance, and the lines of `config.ts` that were not read.

## 1. In short

A person can run two versions of the application on the same data folder. For
example, they update on one computer and then open an old copy, or they go
back to an older version after a bad update. The newer version can write
things into the settings file that the older version does not know. The
reference project has a rule for this case: the older version must still
start, and each engine that it cannot build shows as "unavailable". It must
not crash, and it must not delete what it does not understand.

Terms used in this file:

- **The config**: the file `config.json` in the data folder. It holds all
  settings, and each configured engine.
- **An instance**: one configured engine, for example "Claude (work)" or "my
  Ollama server". It is one entry under the key `instances` of the config. Its
  `driver` field names the kind of engine.
- **A driver**: the code for one kind of engine. The reference has 31 drivers
  (`drivers/builtIn.ts:34-66`).
- **The registry**: the object that makes one live engine from each instance
  (`harness/registry.ts`).
- **A shadow**: what the registry keeps for an instance that it cannot build.
  It has the name, the driver kind and a reason. It has no engine. The UI
  shows it as "unavailable".
- **Round trip**: the older version reads the file and then saves it. The
  data that only the newer version understands must still be in the file
  after the save.

The rule is in the plan of the reference
(`docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md:42-44`):

> **Unknown config round-trips.** A config written by a newer build must load
> in an older one and degrade to "unavailable" rather than throwing.
> `InstanceConfig.driver` is deliberately unvalidated for this reason.

**The main finding: the rule holds only for a part of the config.** It holds
for an unknown driver kind, an unknown instance, an unknown field in an
instance, an unknown top-level key and an unknown feature switch. It does not
hold for an unknown key in one of about 16 "strict" sections, or for a new
value of a closed list (an enum). In those cases the older version ignores
the whole file and starts with default settings (section 3.1).

## 2. Files read completely

Five subagents read the files. I checked their key findings against the code
(the lines that this file cites for the schema, the load, the save, the
registry, the delete route, the turn refusal and the UI box).

Config and its storage: `config.ts` (1228), `config.test.ts` (2500),
`atomic.ts` (142), `config-backup.ts` (195), `config-backup.test.ts` (203),
`config-backup-clock.test.ts` (61), `config-cli.ts` (117),
`instance-fleets.ts` (87), `schema.ts` (17), `local-vm-settings.ts` (66),
`vps-config.ts` (43), `settled-file.ts` (31), `legacy-feature-flags.ts` (27),
`unreadable-aside.ts` (22), `computer-engine-removal.ts` (75),
`workspace-backup-policy.ts` (82), `decider/config-errors.ts` (13).

Registry and contract: `harness/registry.ts` (595), `harness/registry.test.ts`
(789), `harness/registry-start-read.test.ts` (248),
`harness/engine-status-file.ts` (127) and its test (44),
`harness/wsl-launch.ts` (27), `contracts.ts` (663), `drivers/builtIn.ts` (66),
`default-model-selection.ts` (99) and its test (374), `engine-entry.ts` (15),
`testing/fake-driver.ts` (100), `cli-setup.ts` (332).

The six wrappers: `crash-guard.ts` (128) and its test (148),
`engine-memory.ts` (929) and its test (1120), `bot-memory-cap.ts` (460) and
its test (355), `engine-homes/engine-homes.ts` (127) and its test (120),
`harness/unasked-stop.ts` (46) and its test (80), `drivers/local-inject.ts`
(475), `drivers/ollama-context.ts` (142) and its test (299).

API and wiring: `routes/instances.ts` (597) and its test (360),
`routes/config.ts` (718), `routes/config-engine-effect.ts` (30) and its test
(138), `routes/config-browser-proxy.test.ts` (25), `provider-icon.ts` (76),
`hosted-models.ts` (136), `host/no-ai-notice.ts` (112),
`first-engine-read.ts` (14), `thread-model.ts` (32),
`headless/engine.test.ts` (150).

UI: `src/components/EnginesSettings.tsx` (602), `EngineSetup.tsx` (737),
`EngineAccounts.tsx` (360), `EngineLibrary.tsx` (134), `keys/KeyRow.tsx`
(503), `bot-settings/ModelSection.tsx` (163), `AutomaticRecoverySettings.tsx`
(93), `CompanyModels.tsx` (70), `onboarding/MeetScreen.tsx` (156),
`NoEngines.tsx` (113); `src/lib/company-models.ts` (47), `engine-rail.ts`
(67), `onboarding.ts` (258), `failed-turn.ts` (51), `simple-model-menu.ts`
(235), `engine-name.ts` (13); `src/state/config-status.ts` (254),
`engine-install.ts` (68), `use-show-instances.ts` (13); and the tests of
`EnginesSettings`, `EngineSetup`, `EngineLibrary`, `KeyRow`, `ModelSection`,
`AutomaticRecoverySettings`, `CompanyModels`, `company-models`,
`engine-rail` and `onboarding`.

Read in ranges only:

- `index.ts` (15,276 lines): 765-780, 1385-1400, 1505-1530, 2455-2685,
  5095-5115, 7424-7432, 7485-7530, 8390-8520, 8850-8865, 11578-11600,
  11686-11760, 11790-11910, and short ranges around each search match.
- `src/state/store.tsx` (3285): 380-480, 2855-2904, 3030-3059, 3175-3275.
- `src/components/ChatView.tsx`: 120-277, 675-700. `src/App.tsx`: 180-229,
  425-469. `src/components/ModelPicker.tsx`: 286-321, 366-413, 500-589,
  640-829. `src/components/ProviderIcons.tsx`: 150-296.
- The drivers `openai-compat.ts`, `codex.ts`, `claude.ts`: their
  `decodeConfig`, `defaultConfig` and the start of `create`.
- `DESIGN.md`: by search only.

## 3. How it works

### 3.1 The load

1. At start, `index.ts:771` calls `loadConfig()`.
2. `loadConfig` (`config.ts:699-758`) reads `DATA_DIR/config.json` through a
   cache (`config.ts:697`). It removes a leading BOM, parses the JSON
   (`schema.ts:8-10`), then checks it with `storedAppConfigSchema`
   (`parseStoredConfig`, `config.ts:544-548`).
3. The schema library is zod 4 (`package.json:154`, `"zod": "4.6.7"`). In zod
   4, a plain `z.object` removes unknown keys without an error, and
   `.strict()` refuses them.
4. What the schema does with each kind of unknown data:

   | Unknown data | Schema | Result at load |
   |---|---|---|
   | A driver kind | `driver: z.string().min(1)` (`config.ts:238`) | Accepted |
   | An instance id | `z.record(z.string(), instanceConfigSchema)` (`:251`) | Accepted |
   | Any content in an instance's `config` | `config: z.json().optional()` (`:249`) | Accepted, kept whole |
   | A key beside `driver` in an instance | plain `z.object` (`:237`) | Removed from memory |
   | A top-level key | plain `z.object` (`:288-401`) | Removed from memory |
   | A feature switch | plain `z.object`, comment `:199` | Removed from memory |
   | A key in a strict section | `.strict()` | **The whole file is ignored** |
   | A new value of `access` or `icon.kind` in an instance | `z.enum`, strict union (`:242-248`) | **The whole file is ignored** |
   | A value of a wrong type (for example `enabled: "yes"`) | | **The whole file is ignored** |

   The strict sections in `config.ts` are `mcp` (73), the browser profile
   (81, 87), `onboarding` (236), the instance `icon` (242-243),
   `automaticRecovery` (262), `cacheKeepWarm` (268), `threads` (275),
   `newBots` (279), `memory` (387), `burst` (388), `decisions` (390) and
   `safetyFloor` (392). Other files add `loopGuard`
   (`host/loop-guard.ts:34`), `usageCaps` (`usage-caps-config.ts:11`),
   `newBotDefaults` (`new-bot-defaults.ts:112`) and the image slots
   (`image-generation-config.ts:8`).

5. Some parts are loose on purpose. One bad entry is dropped, not the file:
   `vpsServers` (`vps-config.ts:36-43`), `mcpServers` (`config.ts:399-400`),
   `opencodeGo.providerKeys` (`:406-411`), and `helper`, which becomes
   `undefined` on a bad value (`side-jobs.ts:15-20`).
6. When the file is absent, the config is `{}` and no warning is printed
   (`config.ts:712-714`).
7. When the JSON is bad or the schema fails (`config.ts:705-711`):
   1. The whole file is ignored. The config in memory is `{}`.
   2. The server prints one warning:
      `config: ignoring <path> and using defaults: <reason>`. For bad JSON
      the reason is only "invalid JSON", because the parser text can quote a
      key (comment at `:706`). For a schema failure the reason is the path
      and the message of the first problem (`schema.ts:12-17`).
   3. The same warning is not printed again (`:710`).
   4. The file is not changed, renamed or copied.
   5. No part is saved. Test `config.test.ts:2256-2268`: a bad `threads`
      section also loses the Claude instance.
8. There is no version field and no format marker in the config. There is no
   migration step in `loadConfig`. `ensureDirs()` renames one old feature
   switch in the raw file (`legacy-feature-flags.ts:11-27`).
9. `instanceConfigs(cfg)` (`config.ts:1136-1198`) makes the map that the
   registry gets:
   1. No instances or an empty map gives the default fleet
      (`instance-fleets.ts:27-57`, `config.ts:1137`).
   2. It drops each entry with the removed driver `boxAgent` (`:1138`). This
      is the only entry that it drops.
   3. An unknown driver stays. It gets no injected key (`:1109-1134`). Test
      `config.test.ts:1230-1233`: `{ ghost: { driver: "not-a-real-driver" } }`
      gives only `["ghost"]`.
10. `registry.load(...)` (`index.ts:1393`) builds each instance (section
    3.2). The server start continues for each result.

### 3.2 The registry builds each instance

1. `load()` (`registry.ts:153-171`) starts all instances at the same time
   with `Promise.all`. Each entry goes into the map when its own build ends.
2. `createEntry()` (`registry.ts:173-220`) does these steps for one instance:
   1. It disposes the old instance with the same id (`:178`).
   2. It finds the driver by `entry.driver` (`:179`).
   3. **Cause 1, no driver** (`:180-192`): it returns a shadow with the reason
      `unknown driver "<kind>" — kept as configured, unavailable here`.
   4. It decodes the config: `driver.decodeConfig(entry.config)`, or
      `driver.defaultConfig()` when `config` is absent (`:194`).
   5. It calls `await driver.create({...})` and puts the six wrappers around
      the result (`:198-204`, section 3.3).
   6. It shares the status read (`:205`) and applies the `decorate` callback
      (`:206`).
   7. **Causes 2 and 3** (`:207-219`): when step 4, 5 or 6 throws or
      rejects, it returns a shadow with the error message as the reason
      (`:216`).
3. The shadow (`registry.ts:29-36`) has `instanceId`, `driverKind` (the raw
   string), `displayName`, `cli`, `shadow: true` and `reason`. It does not
   keep `enabled`, `environment` or the config.
4. The reason is plain text. It has no code, and it does not say which of the
   three causes occurred. Nobody redacts it (no import of a redaction
   function in `registry.ts:2-27`).
5. The contract tells the driver what to do (`contracts.ts:651-656`):
   `decodeConfig` throws on an invalid config ("→ shadow"), and `create`
   "must reject, never throw synchronously".
6. After `Promise.all`, `load()` puts the entries in config order
   (`registry.ts:163-170`). An instance that was there before keeps its
   place. A new one goes to the end.
7. `load()` adds and replaces. It never removes an entry. Only `dispose(id)`
   and `disposeAll()` remove one.

Edge cases of the registry, from the code (no test covers them):

- `createEntry` can still reject in two places that are outside the `try`:
  when the old instance rejects in `dispose()` (`:178`, `:593`), and when a
  map value is `null` (`:179`). Then `Promise.all` rejects, `load()` rejects
  for the caller, and the order step does not run. The other instances still
  go into the map.
- When `create` succeeds and a wrapper or `decorate` then throws, the new
  instance becomes a shadow and is never disposed. Its processes can stay.
- `cliByInstance` is set before `create` (`:197`). It stays set when
  `create` fails.

### 3.3 The six wrappers around each live instance

`registry.ts:198`:
`withLocalContext(withUnaskedStops(withEngineHomes(withBotMemoryCap(withEngineMemory(withTurnScope(await driver.create(...)))))))`

Each wrapper keeps the old `adapter`, makes a new object `{ ...adapter,
<changes> }`, puts it into `instance.adapter` and returns the same instance.
No wrapper changes `snapshot`, `dispose` or `models`.

| Wrapper (inner to outer) | What it is for | Decides by | Can throw when applied |
|---|---|---|---|
| `withTurnScope` (`crash-guard.ts:34-43`) | An uncaught error stops only the turn that caused it, not the server | nothing | No |
| `withEngineMemory` (`engine-memory.ts:846-929`) | On a Cloud or a small Linux server, a turn waits until memory has room | the host (`:834-835`), **driver names** (`:847`, `:907`), the flag `engineAdmission` (`:898`) | Yes, when active: it calls `adapter.onEvent` (`:855`) |
| `withBotMemoryCap` (`bot-memory-cap.ts:383-419`) | A turn whose engine the per-bot memory watchdog stopped fails with that reason | nothing | Yes: it always calls `adapter.onEvent` (`:406`) |
| `withEngineHomes` (`engine-homes/engine-homes.ts:110-125`) | On a Team Cloud, an engine runs with the home folder of its conversation | `homes.active()` at wrap time (`:111`) | No |
| `withUnaskedStops` (`harness/unasked-stop.ts:19-45`) | "Request was aborted." without a Stop is shown as a failure | event type and text | No |
| `withLocalContext` (`drivers/local-inject.ts:92-103`) | Before an Ollama turn, make a model name with a larger context window | the host id in the model id | No |

Facts for this feature:

- A wrapper that throws when it is applied makes the instance a shadow,
  because the wrappers run inside the `try`.
- The order matters. `withTurnScope` must be the innermost (comment
  `crash-guard.ts:8-9`). `withEngineMemory` sets `prestart: undefined`
  (`engine-memory.ts:877`), so the outer wrappers see no `prestart` on those
  engine kinds. The error texts are changed in the order memory, bot cap,
  unasked stop.
- `withEngineMemory` decides by a list of driver names. This breaks the rule
  that a capability flag gates behaviour.
- Two wrappers keep module-level state that `dispose` does not clean:
  `runningTurns` (`bot-memory-cap.ts:133`) and the `engineMemory` object
  (`engine-memory.ts:835`).

The full notes on each wrapper (numbers, limits, tests) are in the subagent
report of this session. They belong to parts 65 and 38 of the research
table, not to this feature.

### 3.4 What a shadow does in the server

1. **Start.** Nothing is logged for a shadow. `readAtStart` reads only live
   instances (`registry.ts:255`, `:335-337`), but its result list has the
   shadow (`:284`).
2. **Methods.** `get` gives `null` (`:306-308`). `instances()` leaves it out.
   `entries()` and `describe()` have it. `refreshModels` and the sign-in
   methods give `false` or `null`. `installRuntime` can run when the driver
   is known (`:351-373`), but it does not build the instance again.
3. **A shadow becomes live** only when `registry.load` runs again for its id:
   at a restart, or after a save that changes that instance (section 3.6).
4. **A turn.** `beginTurn` (`index.ts:7519-7523`) finds no instance and
   throws status 409 with
   `provider instance "<id>" is unavailable — pick another model in settings`.
   The same check is in the edit and re-run route (`routes/bot-messages.ts:558-565`)
   and in a room turn (`index.ts:9551-9552`, the line
   `<bot name>'s model is unavailable`). `noAiNotice` does nothing here,
   because it acts only for a bot with no instance at all
   (`host/no-ai-notice.ts:93`).
5. **A bot keeps its choice.** No code changes a bot whose
   `modelSelection.instanceId` names a shadow. When the newer version runs
   again, the bot works again. `refreshUnsetModelSelections` changes only a
   bot with an empty choice (`index.ts:2491-2493`).
6. **The default model.** A saved default on an unavailable instance gives an
   empty choice in memory. The saved value stays. Comment
   `default-model-selection.ts:53-54`: "an unavailable provider sends new bots
   to setup, never silently to another provider."
7. **A backup engine** that is a shadow is skipped (`index.ts:8455`), or
   refused with "The backup AI is unavailable." (`:8469`).
8. **A thread with its own model** on a shadow follows the bot's model, with
   one notice in the thread (`thread-model.ts:19-32`, `index.ts:2680-2684`).

### 3.5 The API

- `GET /api/instances` (`routes/instances.ts:119-126`) lists each instance.
  A shadow has (`registry.ts:517-530`):

  ```json
  {
    "instanceId": "mystery",
    "driverKind": "from-the-future",
    "displayName": "Tomorrow",
    "snapshot": { "state": "unavailable", "reason": "unknown driver \"from-the-future\" — kept as configured, unavailable here" },
    "models": { "default": "", "options": [] },
    "capabilities": { "computerMcp": false, "agentsMcp": false, "localComputerMcp": false },
    "access": "subscription",
    "cliCandidates": []
  }
  ```

  `install`, `authentication`, `cli` and `cliDefault` are absent, because
  their values are `undefined`. `cli` is present when the raw config has a
  `cli` string. `displayName` falls back to the
  driver kind. A live instance has 15 capability keys; a shadow has 3.
- `ProviderSnapshot.state` has only two values, `available` and
  `unavailable` (`contracts.ts:391`). A not-installed CLI on a live instance
  is also `unavailable`. The client cannot tell a shadow from a missing CLI.
- `GET /api/health/engines` counts only `available` (`:136-140`).
- **No route can create an instance with an unknown driver.** Each create
  route sets the driver in server code (`routes/instances.ts:183`, `:201`,
  `:218`, `:268`, `:313`). The config patch schema omits `instances`
  (`config.ts:413`).
- **A shadow with an unknown driver cannot be removed.** `DELETE
  /api/instances/:id` allows only added accounts and endpoints, which it
  recognises by driver name (`routes/instances.ts:564-567`), and returns 400
  "Only added accounts and custom endpoints can be removed here." The person
  can hide it (`PATCH { hidden: true }`) or edit the file.
- **A shadow can be edited in part.** `PATCH /api/instances/:id` works on the
  config, not the registry (`:490-491`). `cli`, `hidden` and the icon are
  allowed. Other fields return 400 with a text that names the drivers that
  have them.
- `POST /:id/check`, `/refresh-models`, `/auth/start` and `/auth/sign-out`
  return 404 `unknown instance` for a shadow.

### 3.6 The save keeps the unknown data

1. `saveConfig(patch, options)` (`config.ts:876-1000`) reads the raw JSON from
   disk again (`:885`). It does not use the schema for the file.
2. A file that is not JSON or not an object: the save refuses with 503, and a
   bad file is first copied to `config.json.unreadable-<hex>` (at most 5)
   (`:886`, `config-backup.ts:62-70`).
3. A file that is valid JSON but fails the schema counts as "ok". The save
   continues on the raw object (`:887`).
4. The patch is checked and its unknown keys are removed (`:888`).
5. Each named section of the patch is merged over the raw section on disk.
   Unknown keys in that section stay (`:893-904`). `null` deletes a key.
6. Fifteen keys are replaced whole, for example `newBotDefaults`,
   `usageCaps`, `mcpServers` (`:906-958`).
7. Top-level unknown keys stay, because the save writes the raw object back
   (`:991`). Test `config.test.ts:1753-1776` (`futureSetting`).
8. Instances (`:959-974`):
   1. Without `replaceInstances`: each instance of the patch is merged over
      its raw entry. Instances that are not in the patch stay.
   2. With `replaceInstances` (all API saves of instances:
      `index.ts:11799`, `routes/instances.ts:164`): the map is built again
      from the patch. For each instance of the patch, the known fields come
      from the patch, and the unknown fields come from disk:
      ```ts
      // Shadow entries keep fields only a newer app or driver understands.
      if (options.replaceInstances) {
        for (const key of Object.keys(instanceConfigSchema.shape)) delete merged[key];
      }
      Object.assign(merged, entry);
      ```
      An instance that is not in the patch is removed with its unknown
      fields. This is how a delete works.
   3. The `config` field of an instance survives whole, because memory keeps
      it as raw JSON (`z.json()`) and `persistableInstanceConfigs` writes it
      back (`config.ts:1035-1036`).
9. Before the write, the old text goes to `config.json.bak.YYYYMMDD-HHMMSS`
   (10 kept, mode 0600). If the copy fails, the save stops with 503 (`:990`,
   `config-backup.ts:16`, `:88-152`).
10. The write is atomic: a temp file with mode 0600, `fsync`, then rename,
    with retries on Windows (`:991`, `atomic.ts:28-67`).
11. The listeners get the raw objects before and after (`:993-999`). The
    server finds the changed instances with a deep compare
    (`changedInstanceIds`, `:675-678`) and loads only those again
    (`index.ts:11830-11896`, already in
    [`driver-contract.md`](driver-contract.md)).
12. After a save of one instance, `persistProviderInstance`
    (`index.ts:11797-11810`) loads it again. A shadow is always built again,
    because `registry.get` is null for it.

Two holes, from the code (no test covers them):

- **A save after an ignored file can replace the fleet.** When the load
  ignored the file (section 3.1, step 7), memory has the default fleet. An
  API save of an instance sends `persistableInstanceConfigs(cfg)`, which is
  the default fleet, with `replaceInstances`. The instances of the file that
  are not in the default fleet are then removed. The dated backup is the only
  protection. This is an inference; we did not run it.
- **`boxAgent` entries** are removed at the first API save of any instance
  (`config.ts:1138`). This is on purpose, for one removed driver.

### 3.7 Export and backup

- The workspace backup carries only nine config keys
  (`workspace-backup-policy.ts:7-10`). `instances` is not one of them. A
  restore keeps the destination's instances, shadows and unknown keys
  (`:21-35`).
- An export calls `parseStoredConfig` (`:14`). A config with an unknown key in
  a strict section cannot be exported.
- `cli-setup.ts` refuses a file that fails the schema: "Existing config.json
  could not be read or validated. Setup has not changed it; repair it before
  continuing." (`cli-setup.ts:68-75`).

## 4. The data

- **The file:** `DATA_DIR/config.json`, mode 0600, written atomically. Dated
  copies `config.json.bak.*` (10). Copies of an unreadable file
  `config.json.unreadable-*` (5).
- **One instance** (`contracts.ts:103-117`, schema `config.ts:237-250`):

  ```json
  {
    "driver": "any-non-empty-string",
    "displayName": "optional text",
    "accentColor": "optional text",
    "icon": { "kind": "preset", "preset": "..." },
    "environment": { "NAME": "value" },
    "enabled": true,
    "hidden": false,
    "access": "subscription | custom | api",
    "config": "any JSON value, decoded by the driver"
  }
  ```

  The comment above the type (`contracts.ts:103`): "`driver` is any slug: an
  unknown driver round-trips as an unavailable shadow snapshot."
- **The shadow** lives only in memory, in the registry. It is not written to
  the engine status file, which holds live instances only
  (`registry.ts:496`).
- **Secrets** are in the same file: each instance `environment`, and about 25
  `key` fields of the provider sections (`config.ts:304-316` and others).
  `GET /api/config` returns only "configured" flags
  (`routes/config.ts:135-138`).

## 5. The UI

The UI has no code for an unknown driver. It reads `snapshot.state`,
`snapshot.reason` and `install`. Two kinds of shadow look different only
because `install` is different:

| Shadow | `install` | What the settings card shows |
|---|---|---|
| Unknown driver | absent (`registry.ts:45`, `:526`) | A box "{name} isn’t ready" with the reason in grey text below it (`src/components/EngineSetup.tsx:631-641`). Without a reason: "This model provider is not available on this machine." |
| Known driver, refused config or failed create | the driver's install data | The normal install card "Set up {name}", the reason as a red alert, and an install button or command (`EngineSetup.tsx:649-670`) |

The second row is a problem: a refused config looks like a CLI that is not
installed, and the person is told to install something that is installed.

**The engines settings page** (`src/components/EnginesSettings.tsx`,
`EngineLibrary.tsx`):

- The list filter lets each unavailable instance through
  (`EnginesSettings.tsx:564`).
- A shadow with an unknown driver shows:
  - its name, or the driver kind;
  - the raw driver kind as the subtitle (`EngineLibrary.tsx:26-28`);
  - an icon with one letter of the driver kind, or "?"
    (`src/components/ProviderIcons.tsx:223-228`);
  - the chip "Needs setup" and the action "Set up", in the "Needs setup"
    section;
  - in the simple view, the row is under "More providers" and has no status
    line (`EnginesSettings.tsx:462`, `:504-505`).
- Actions on it: "Hide", "Set CLI…" and "Reset". No install, no sign in, no
  remove.
- If the file gives it `access: "api"`, the card says "{name} needs an API
  key" (`EngineSetup.tsx:433-446`). That text is wrong for this case.

**The model pickers:**

- The chat header and bot settings list only available instances with
  models, plus the one that the bot uses (`src/lib/engine-rail.ts:7-11`).
- When the bot's instance is unavailable: a warning dot and "Setup required"
  on the trigger, and the `EngineSetup` box in the full view
  (`ModelPicker.tsx:571`, `:724-730`, `:770-772`).
- When the bot's instance is absent from the list: a grey circle and the raw
  model id, or "Unavailable" in the simple menu
  (`src/lib/simple-model-menu.ts:149`).
- Automatic recovery shows a saved backup that is not available as a disabled
  option "{instanceId} (unavailable)" (`AutomaticRecoverySettings.tsx:78`).

**The chat:** no check before a send. The server refuses the turn, and the
chat shows a red error row with the server text and a "Retry" button
(`ChatView.tsx:163-205`). When the server marks the failure as a setup
problem, the `EngineSetup` box is in the row.

**Onboarding:** a shadow without `install` is never offered
(`onboarding/MeetScreen.tsx:80-81`, `NoEngines.tsx:44-45`).

**Saves from the UI** send only the changed fields: `PATCH
/api/instances/:id` with `{ cli }`, `{ hidden }` or `{ displayName }`, and
`PUT /api/config` with one section. The UI never sends a full instance back.

## 6. The tests

What the reference guarantees with a test:

- `harness/registry.test.ts:1`, the file comment: "A config written by a
  newer or differently built app must load as an unavailable shadow, never
  crash the fleet."
- `:77-88` an unknown driver is a shadow: `get` is null, the state is
  `unavailable`, the reason names the driver, the name is kept, no models.
- `:90-98` a `decodeConfig` error is a shadow with the error as the reason.
- `:100-114` a `create` rejection is a shadow, and the other instance is
  live.
- `:116-159` all instances build at the same time; the list keeps config
  order; the broken one is a shadow.
- `:161-191` the order after a dispose and after a second load.
- `config.test.ts:1802-1829` the main round trip: an instance with driver
  `fixture-future-driver` and a field `futureSetting` keeps the field after a
  save with `replaceInstances`; a removed instance goes with its fields.
- `config.test.ts:1753-1776` a top-level `futureSetting` stays after a save.
- `config.test.ts:231-242` an unknown top-level key is dropped at load.
- `config.test.ts:244-258`, `:702-706` removed keys and switches still load.
- `config.test.ts:1230-1233` an unknown driver is not expanded into a fleet.
- `config.test.ts:1872-1880` a repair of URLs does not touch an instance with
  a future driver.
- `config.test.ts:2251-2300` an unusable file: no warning without a file, the
  whole file is dropped on one error, one warning, no secret in the log.
- `config.test.ts:911-923` a save adds a field so that an older version can
  still read the file. This is the rule in the other direction.
- `default-model-selection.test.ts:82-91` a saved choice on an unavailable or
  missing instance gives an empty choice, without a switch to another
  instance.

What has no test:

- An unknown key in a strict section, or a new enum value, from a newer
  version. The whole-file failure is tested only with a missing field.
- The exact reason text of an unknown driver (the test checks only that it
  contains the name).
- A `create` that throws synchronously, a `defaultConfig` that throws, a
  wrapper or `decorate` that throws, a `dispose` that rejects during a load.
- A shadow that becomes live after a second load.
- The API routes on a shadow (`routes/instances.test.ts` loads only one live
  fake instance).
- The UI for an unknown driver. No UI fixture has `unavailable` with a reason
  and no `install`.
- A secret in a reason text.

## 7. Ours compared

What we have: nothing for this feature. `bot-engine` has only its crate
comment (`crates/bot-engine/src/lib.rs`), and `bot-core` has the echo
function. Steps 4 and 6 are not started.

What we plan:

- Step 4 ([`../../plan/README.md`](../../plan/README.md)):
  `DriverEntry` with an identifier, a kind and the settings of that kind
  (4.1); a registry slot that is a driver or "unavailable" with a reason
  (4.2); tests for an unknown kind and bad settings (4.3). The choices say
  that one bad entry must not stop the others, and that the reason must not
  contain a secret.
- Step 5.6: an entry of kind `chat` with no key is "unavailable".
- Step 6 ([`../../plan/README.md`](../../plan/README.md)):
  the `Settings` type with `serde`, "a missing field gets its default", and
  an atomic write.
- [`../../comparison.md`](../../comparison.md) lists "`serde` with
  `deny_unknown_fields`" for request validation, and says "An unknown driver
  or a bad config becomes 'unavailable'."

Where we differ, or where the plan is silent:

| Point | Reference | Our plan |
|---|---|---|
| Unknown driver kind | A shadow with a reason | Same (4.3) |
| Bad settings of a known kind | A shadow with the error text | Same (4.3) |
| A driver kind as a closed Rust enum | No: `driver` is a string | 4.1 says "a kind (`fake`, later `chat` and `acp`)". If this is a `serde` enum, an unknown kind fails the whole file. Not decided |
| Unknown fields in an entry, round trip | Kept at save by a merge with the raw file | Not in the plan |
| Unknown top-level keys | Kept at save | Not in the plan |
| A strict section with an unknown key | The whole file is ignored | `deny_unknown_fields` is in the comparison for requests. If it is used for the settings file, we copy the problem |
| A version marker in the file | None | None |
| The reason of an unavailable entry | Plain text, not redacted | Must contain no secret (step 4 choice) |
| Remove an unavailable entry | Not possible from the UI or the API | Not in the plan |
| Unavailable versus not installed | One state `unavailable` for both | Not in the plan |

## 8. Where we can be better

1. **Keep each entry as raw JSON until the driver decodes it.** Read the
   settings file as a list of entries where each entry is a `kind: String`
   and a `serde_json::Value` (or `Box<RawValue>`) for the rest. The registry
   decodes the settings of a known kind. *Reason:* an unknown kind or an
   unknown field cannot fail the file, because the type that reads the file
   has no closed list. The reference needs a schema rule, a merge with the
   raw file at save and a comment to get the same result.
2. **Never fail the whole file for one section.** Parse each top-level
   section on its own, and keep a section that fails as raw JSON with a
   warning. *Reason:* the reference's main gap: one unknown key in one of 16
   strict sections, or one new enum value, makes it ignore all settings and
   start with defaults (section 3.1). Then a later save can replace the fleet
   (section 3.6).
3. **Keep unknown fields with `#[serde(flatten)] extra: Map<String, Value>`**
   on the settings types, and write them back at save. *Reason:* the round
   trip is a property of the type, and a test can check it with a fixed
   file. The reference gets it from a merge with the file on disk at each
   save, which has the "replace the fleet" hole above.
4. **Do not use `deny_unknown_fields` on stored data.** Use it only for a
   request body, where a refusal is the correct answer. *Reason:* the two
   rules are opposite, and the comparison file lists only one of them.
5. **A typed reason.** Make the unavailable reason an enum: `UnknownKind {
   kind }`, `BadSettings { message }`, `StartFailed { message }`, and later
   `NotInstalled`. *Reason:* the reference has one text and one state for all
   causes, and its UI then shows an install card for a refused config
   (section 5). With an enum, the window can choose the correct action, and
   the compiler refuses a missing case. This agrees with D20, where an error
   code tells the window what the person can do.
6. **Make the reason safe by construction.** Build the text of
   `UnknownKind` from the kind only. For the other causes, the driver returns
   a typed error whose `Display` names the field and never the value, and the
   registry passes the text through the redaction of step 6.4. *Reason:* the
   reference stores and sends `e.message` unchanged (`registry.ts:216`,
   `:522`), and no test checks it for a secret.
7. **Building an entry cannot fail the registry.** In Rust, `create` returns
   a `Result`, so there is no "throw versus reject" difference to document
   (`contracts.ts:655`). Make the registry build return
   `Registry`, not `Result<Registry, _>`, and dispose an old driver with a
   method that cannot fail. *Reason:* the reference can still reject the
   whole load when an old instance fails to dispose (section 3.2).
8. **Let the person remove an unavailable entry.** *Reason:* in the
   reference, an entry from a newer version can only be hidden or removed by
   a hand edit of the file, because the delete route decides by driver name.
9. **Gate by capability, never by driver name.** The reference's memory
   wrapper uses a list of driver names (`engine-memory.ts:847`) and its delete
   route too (`routes/instances.ts:564-567`). Our rule in `AGENTS.md` already
   forbids this.
10. **Test the round trip and the UI.** Add a fixed settings file from a
    "future" version as a test input: it loads, each unknown part becomes
    unavailable or is kept, and a save writes the unknown parts back
    unchanged. *Reason:* the reference has no test for an unknown key in a
    strict section, and none for the UI of an unknown driver.
11. **Consider a format number in the file.** A number that a newer version
    raises only when an older one cannot read the file safely. The older
    version then opens it read-only and says so. *Reason:* the reference has
    no marker. Each break in its rule is silent. This is a proposal, not a
    fact of the reference.

## 9. Not verified

- I ran no code and no test. All statements about tests come from the test
  source.
- The "save after an ignored file replaces the fleet" path (section 3.6) is
  an inference from `config.ts:959-974` and `:1137`. No test covers it.
- `index.ts`: the long lines 2772, 3508 and 14554 (calls of
  `registry.describe`), `configStatus()` lines 11601-11685, and the SSE code
  after the `hello` frame were not read. That `GET /api/config` and the
  `config` event carry no instance list is not fully proved.
- Whether the person's message is stored before the 409 refusal of a turn
  (`index.ts:7433-7482` not read).
- `provider-auth-sessions.ts`: the result of `auth/status`, `auth/complete`
  and `auth/cancel` for a shadow.
- The `create` texts of the 31 drivers. Only parts of three drivers were
  read, so "no reason contains a secret" is not proved.
  `claude.ts:615` puts a config value (the permission mode) in an error.
- The ends of `liveConfigSchema`, `deciderConfigSchema` and
  `imageGenConfigSchema`: whether they are strict.
- Where `engineHomes.start()` is called relative to `registry.load`. If it
  runs later, the instances of the first load are not wrapped by
  `withEngineHomes`.
- The UI files `ConnectAi.tsx`, `HiddenProviders.tsx`, `CloudEngineSignIn.tsx`,
  all of `Composer.tsx`, and the suffixed test files (for example
  `EngineSetup.grok.test.ts`). A send guard in a part that was not read is
  possible.
- Where the chat gets the `engine` value for a failed-turn row, and when the
  server sets `tool.setup`.
