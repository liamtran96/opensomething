# The store and the data folder, with the data format marker and stores that repair themselves

The feature is the row `CONTRIBUTING.md` of
[`../reference-features.md`](../reference-features.md) (part 4, the store and
the data folder). It is for steps 6 and 8 of
[`../../plan/README.md`](../../plan/README.md): settings and the data folder,
and the SQLite store with the event log of a thread.

The reference project is the local clone next to this repository, at commit
`ed8cb7278`. All paths in this file are relative to its root, unless a path
starts with `crates/` or `docs/`, which are ours. Nobody opened its
`enterprise/` directory.

What this file adds to the earlier research:

- [`file-modes-atomic-writes-redaction.md`](file-modes-atomic-writes-redaction.md)
  has the atomic write, the file modes and the mode repair (its sections
  3.1 to 3.4). This file does not repeat them. It adds only one fact about
  modes: the marker file has no mode (section 4.1).
- [`newer-config-unavailable.md`](newer-config-unavailable.md) and
  [`write-only-secrets.md`](write-only-secrets.md) have the load and the save
  of `config.json` and its dated copies. This file confirms their main
  finding at `ed8cb7278` and adds the paths that write with no dated copy
  (section 3.11).
- [`event-bus-fold.md`](event-bus-fold.md) has the event log of a thread,
  `events/<threadId>.ndjson`. This file does not repeat it.
- New in this file: the data format marker and the doctor. The open and the
  repair of the main store, of `messages.db` and of `runtime.db`. The restart
  rule at `ed8cb7278`. The four problems of the changelog in this code.

## 1. In short

The reference project keeps all its data in one folder, the data folder.
Three kinds of store keep data in it:

- JSON files: `bots.json`, `groups.json`, `config.json` and about 40 more.
- The SQLite database `messages.db`: the transcripts.
- The SQLite database `runtime.db`: the work that bots give to each other.
 The project has no numbered migrations. Each
store looks at its files when it opens them and repairs or extends them. A
folder-wide number, the data format marker, stops an older version from
running on data that only a newer version understands.

These are the main facts:

1. At start, before any store opens, the server reads `data-format.json`.
   Maybe a newer version wrote the data in a format that this version cannot
   read. Then the server writes one line and stops with exit code 1. It
   changes nothing.
2. A format change takes two releases: first a release that can read the new
   format, then a release that writes it. A test fails the build on any other
   step.
3. On the first start of each new version, a "doctor" checks the folder and
   does safe repairs. It copies each thing that it changes into a backup
   folder first.
4. Each store repairs its own files when it opens them. It decides by looking
   at the data: a missing column, a legacy file, or a marker file.
5. The repairs are not all safe. A corrupt `bots.json` loads as "no bots",
   and the start then writes a new default bot over the corrupt file
   (section 3.6).
6. `runtime.db` writes each state change with its event in one transaction.
   At a restart, one function decides from the stored rows what happens to
   each turn that was running.

Terms used in this file:

- **Data folder:** the folder that holds all data. It is `OMB_DATA_DIR`, or
  `~/.openmausbot` (`server/data-dir.ts:45-55`).
- **Data format marker:** the file `data-format.json` in the data folder. It
  holds the newest format that a version left the folder in.
- **`writes` and `reads`:** two numbers in the code of each version.
  `writes` is the format that the version writes. `reads` is the newest
  format that it can read (`server/data-format.ts:9-13`).
- **Two-release rule:** a change to the stored format first raises `reads`
  in one release, then raises `writes` in the next release
  (`CONTRIBUTING.md:145-150`).
- **Marker file:** an empty or small file whose presence means "this one-time
  repair is done", for example `thread-model-copies-cleared`.
- **Doctor:** the module `server/doctor/` that checks and repairs the data
  folder.
- **WAL (write-ahead log):** a SQLite mode. A commit goes to a side file
  (`-wal`) first. Readers do not block the writer.
- **`synchronous = NORMAL` and `FULL`:** SQLite settings. With WAL and
  `NORMAL`, a power loss can lose the last commits, but the file stays
  whole. With `FULL`, each commit reaches the disk before the commit
  returns.
- **Deferred save:** a save that waits up to 1 s, so that many small changes
  give one write (`server/save-batch.ts:44-56`).
- **Cut turn:** a turn that was running when the server stopped. At the next
  start, the runtime decides to run it again, to wait, or to fail it.

## 2. Files read completely

Seven subagents read the files. Each one read its files completely, and the
lead checked the key claims against the code (section 2.3).

### 2.1 Read completely

| Group | File | Lines |
|---|---|---|
| Data format and doctor | `server/data-format.ts` | 137 |
| | `server/data-format.test.ts` | 293 |
| | `server/data-format-released.json` | 5 |
| | `server/doctor/start.ts`, `run.ts`, `types.ts`, `backup.ts`, `files.ts`, `command.ts`, `start.test.ts` | 78, 172, 73, 147, 56, 34, 95 |
| | `server/doctor/checks/data-format.ts`, `data-format.test.ts`, `lease.ts`, `folders.ts`, `registry.ts`, `temp-files.ts`, `engine-runs.ts`, `messages-db.ts`, `secret-modes.ts`, `settings-file.ts` | 29, 50, 33, 44, 91, 28, 62, 99, 44, 32 |
| | `scripts/record-data-format.mjs`, `scripts/testing/record-data-format.test.ts` | 38, 31 |
| | `CONTRIBUTING.md`, `docs/releasing.md`, `docs/feature-flags.md` | 419, 225, 123 |
| | `server/vault/value-limits.ts` | 8 |
| Main store | `server/store.ts` | 2256 |
| | `server/store-forks.ts`, `registry-store.ts`, `registry-save.ts`, `legacy-work-threads.ts`, `always-allow.ts`, `save-batch.ts`, `bots-text.ts` | 71, 190, 76, 41, 90, 108, 58 |
| | `shared/registry-save-failure.ts` | 10 |
| Tests of the main store | `server/store.test.ts` | 2916 |
| | `server/store-create-settle.test.ts`, `store-deferred-saves.test.ts`, `store-owners.test.ts`, `store-rename-instances.test.ts`, `store-reorder-groups.test.ts`, `store-retired-bot-fields.test.ts` | 98, 132, 76, 37, 27, 79 |
| | `server/testing/registry.ts` | 49 |
| Message database | `server/message-db.ts` | 1000 |
| | `server/message-db-attention.ts`, `message-db-bot-text-indexes.ts`, `message-db-memory-index.ts` | 7, 6, 17 |
| | `server/message-db.test.ts` | 653 |
| | `docs/verification/persistence-performance.md` | 144 |
| Runtime store | `server/runtime/store.ts`, `store.test.ts`, `types.ts`, `invariants.ts`, `tree.ts`, `index.ts` | 384, 275, 402, 126, 162, 8 |
| | `server/runtime/import-legacy.ts`, `import-legacy.test.ts` | 285, 240 |
| | `server/runtime/testing/fake-clock.ts`, `fake-runner.ts` | 28, 343 |
| Runtime restart | `server/runtime/runtime.ts`, `runtime.test.ts`, `scenarios.test.ts` | 936, 1677, 2215 |
| | `server/memory-freeze-restart.ts` | 55 |
| Settings | `server/config.ts` | 1227 |
| | `server/config-backup.ts`, `data-dir.ts`, `settled-file.ts`, `unreadable-aside.ts`, `legacy-feature-flags.ts`, `config-cli.ts` | 195, 56, 31, 22, 27, 117 |
| | `server/config-backup.test.ts`, `config-backup-clock.test.ts`, `server/doctor/checks/settings-file.test.ts` | 203, 61, 32 |

### 2.2 Read in ranges

- `server/index.ts`: 500-780, 2690-2810, 3844-3845, 4445-4475, 7423,
  8805-8830, 11790-11802, 11920-11940, 15215-15276.
- `server/atomic.ts`: 1-82, 110-142.
- `server/workspace-backup.ts`: 30-125, 612-640, 676-760, 810-835, 876-988.
- `server/workspace-backup.test.ts`: 60-75, 178-222.
- `server/runtime-coordinator.ts`: 51-52, 120-240, 560-590.
- `server/config.test.ts`: 615-624, 700-760, 905-925, 1518-1590, 1880-1925,
  2230-2500.
- `server/cjk-search.ts`: 60-97. `server/testing/setup.ts`: 1-45.
  `vite.config.ts`: 15-75. `server/thread-cache.ts`: 1-30.
  `server/tested-ai.ts`: 310-330. `server/default-bot.ts`: 98-139.
  `server/cli.ts`: 430-470. `server/routes/instances.ts`: 150-170.
  `server/provider-icon.ts`: 14-22. `server/routes/status.ts`: 50-70.
  `server/cloud-health.ts`: 265-290. `.github/workflows/prepare-release.yml`:
  90-135. `docs/self-hosting.md`: 228-240, 1992-2040. `package.json`: 15-25.

### 2.3 Claims that the lead checked against the code

| Claim | Where | Result |
|---|---|---|
| `DATA_FORMAT = { writes: 2, reads: 2 }`, and the released record is 0.1.178 with 2 and 2 | `server/data-format.ts:13`, `server/data-format-released.json:1-5` | Correct |
| An unreadable marker stops the start while `writes` is 2. A failed marker write stops it too | `server/data-format.ts:55-59`, `:95-96` | Correct |
| A corrupt `bots.json` loads as no bots. The seed at start then writes over the file | `server/store.ts:296-301`, `:2249-2254`, `server/registry-store.ts:111-112`, `server/atomic.ts:136-141`, `server/index.ts:2808` | Correct |
| The grant recovery runs with an empty bot list and writes its marker | `server/store.ts:427`, `server/always-allow.ts:62-64`, `:82-85` | Correct |
| A deferred save is written only at exit codes 0 and 75 | `server/save-batch.ts:75-85` | Correct |
| `messages.db` opens again, empty, when its file is deleted | `server/message-db.ts:144-158` | Correct |
| A command receipt and its work commit in one transaction | `server/message-db.ts:254-272` | Correct |
| Follow-up writes use `synchronous = FULL` | `server/message-db.ts:229-238` | Correct |
| `runtime.db`: mode 0700 and 0600, WAL, `NORMAL`, `BEGIN IMMEDIATE`, savepoints, a bad row refused at read | `server/runtime/store.ts:224-240`, `:261-287`, `:184-190` | Correct |
| No production code calls `checkInvariants` | grep of `server`, `src`, `electron`, `scripts` | Correct |
| The restart block is at `runtime.ts:125-155` and has a fifth branch | `server/runtime/runtime.ts:109-158`, `server/memory-freeze-restart.ts:40-55` | Correct |
| `report()` calls the runner before it writes `reportedAt` | `server/runtime/runtime.ts:790-803` | Correct |
| A schema-invalid `config.json` loads as defaults, and a `replaceInstances` save writes the default fleet | `server/config.ts:698-713`, `:884-885`, `:958-961`, `:1135-1137`, `server/index.ts:11799` | Correct |
| `CONTRIBUTING.md:168` says "all of it format 1" | `CONTRIBUTING.md:168` | Correct. The text is out of date |

### 2.4 Changes since the commits of the earlier research

Earlier research files read `3aec210` and `d6660e2d7`. The subagents ran
`git diff <old commit> ed8cb7278` on each file that they cite:

| File | Change | Behaviour |
|---|---|---|
| `server/store.ts` | None since `d6660e2d7`. +12/-21 since `3aec210` (fork leaf, `closedByChanged`, avatar colour) | No change to load, save or repair |
| `server/message-db.ts` | None since `d6660e2d7`. +2/-1 since `3aec210`: one new import at line 11 and one new partial index | One more index at open. Each line after 10 moved down by one, so a citation from `3aec210` such as `:42-46` is now `:43-47` |
| `server/config.ts` | +3/-4: the `vps` section merges with the stored one (`:905`) | No change to load or repair |
| `server/runtime/store.ts`, `server/runtime/types.ts` | None | None |
| `server/runtime/runtime.ts` | +9, commit `01bcd69ed` (#7228) | The fifth branch of the restart rule (section 3.10) |
| `server/data-format.ts` | +1/-1, commit `310e731ed`: `writes` from 1 to 2 | An unreadable marker now stops the start (section 3.2) |

## 3. How it works

### 3.1 The order at start

`server/index.ts` does these steps in this order:

1. `dataFormatAtStart("check", DATA_DIR, version)`, then `ensureDirs()`
   (`server/index.ts:654`). `ensureDirs` renames a legacy data folder if one
   exists, makes the data folder, `events/` and `native/` with no mode, and
   renames a legacy feature flag in `config.json`
   (`server/config.ts:684-693`).
2. The data folder lease, then the engine records (`server/index.ts:656`).
3. A pending workspace restore, if one exists (`server/index.ts:662-665`).
4. `dataFormatAtStart("stamp", ...)`, then `doctorAtStart(DATA_DIR, version)`
   (`server/index.ts:666`).
5. Workspace upkeep and the environment identifier (`server/index.ts:667-669`).
6. `const cfg = loadConfig()` (`server/index.ts:771`).
7. The main store: `new Store(...)` (`server/index.ts:2731-2737`).
8. The runtime: `createCoordinator({ dataDir: DATA_DIR, ... })`
   (`server/index.ts:3844`). This opens `runtime.db`.
9. The seed: if the store has no bots, `testedAi.seed` makes a default bot
   (`server/index.ts:2792-2808`).

`messages.db` opens lazily, at the first call that needs it
(`server/message-db.ts:144-158`). The main store calls it during its own
open (section 3.6).

Edge cases:

- The check runs before the rename of the legacy folder. A marker in a
  legacy folder is not seen. Such folders are older than the marker.
- The comment at `server/index.ts:655` says that the lease comes "before any
  ... config ... is loaded". But step 1 can already write `config.json` (the
  legacy flag rename, `server/legacy-feature-flags.ts:11-27`).
- `mkdirSync` in `ensureDirs` has no `try`. A data folder that cannot be
  written stops the start with an uncaught error (not run, read only).
- A failed rename of the legacy folder is ignored
  (`server/config.ts:686-689`). The server then starts on a new empty folder.

### 3.2 The data format check

`dataFormatAtStart("check")` calls `checkDataFormat`
(`server/data-format.ts:63-66`, `:128-137`):

1. It reads `<data folder>/data-format.json` (`server/data-format.ts:33-43`).
   It removes a UTF-8 byte-order mark first (`:35`).
2. No file: the folder is format 1, and the start continues (`:40`).
3. A marker is valid only when `format` is an integer of 1 or more (`:36`).
   An empty file, NUL bytes, `{}`, `null`, `"2"`, `0`, `1.5` and a file that
   this user cannot read are all "unreadable" (`:39-42`).
4. An unreadable marker:
   - While `writes` is 1, the server writes one warning and takes the data
     as format 1 (`:55-57`).
   - While `writes` is 2 or more, the server stops: "OpenMausBot startup
     failed: <file> cannot be read, so this version cannot tell whether it
     understands the data in <dir>. Nothing was changed. ..." (`:59`).
5. If `marker.format` is more than `reads`, the server stops: "... the data
   in <dir> was written by a newer OpenMausBot (<writtenBy>), in a format
   this version (<version>) cannot read. Nothing was changed. Install
   OpenMausBot <writtenBy> or newer, or put back the copy of the data taken
   before that update." (`:65`, `:68-73`).
6. `dataFormatAtStart` catches only `DataFormatError`. It writes the message
   with `console.error` and calls `process.exit(1)` (`:132-136`). Other
   errors go up.

Since release 0.1.178, `writes` is 2 (commit `310e731ed`). So an empty or
NUL marker after a power loss now stops the start. `CONTRIBUTING.md:200-205`
says this.

### 3.3 The stamp

`stampDataFormat` (`server/data-format.ts:80-100`) runs after the lease and
after a restore:

1. It reads the marker again, with the same rule for an unreadable marker
   (`:86`).
2. A newer format stops the start, as in the check (`:87`).
3. If `marker.format` is equal to or more than `writes`, it writes nothing
   (`:88`). The marker never goes down. An older version that can read the
   data leaves the marker as it is.
4. Else it writes `{ format: writes, writtenBy: version, writtenAt: <ISO
   time> }` with `writeFileAtomic` (`:89-92`).
5. A failed write:
   - While `writes` is 2 or more, the server stops: "could not write data
     format N to <file> (...). Fix the marker write error, then restart."
     (`:95-96`). No store is open yet.
   - While `writes` is 1, the server writes a warning and continues (`:98`).

### 3.4 The two-release rule and the release record

The rule is "what version N writes, version N-1 can read"
(`CONTRIBUTING.md:114`). The reason: the updater keeps a copy of the data
and puts the old version back when the new one fails. A person can also go
back by hand. So the old version must work on data that the new version
touched (`CONTRIBUTING.md:114-120`).

1. Some changes need no new format (`CONTRIBUTING.md:129-135`):
   - a new file, table, index, nullable column or optional JSON field
   - a one-time fill that a marker file or an absent field guards.
2. A change needs a new format when the release before it would fail on the
   new data, lose data or undo the change (`CONTRIBUTING.md:137-143`).
   Examples:
   - a moved file
   - a field that changes meaning
   - a value that older code deletes
   - a higher `version` in a JSON store
   - a table change that breaks an older query.
3. Such a change takes two releases. Release 1 adds the code that reads the
   new format and raises `reads`. Release 2 writes the new format and raises
   `writes` (`CONTRIBUTING.md:145-150`).
4. `server/data-format.test.ts` compares `DATA_FORMAT` with
   `server/data-format-released.json`, the numbers of the last release. Any
   other step fails the build (`CONTRIBUTING.md:161-166`).
5. The workflow "Prepare next release" runs
   `scripts/record-data-format.mjs`. The script reads `DATA_FORMAT` from the
   source with a regular expression and writes
   `{ version, writes, reads }` (`scripts/record-data-format.mjs:8-19`,
   `:28-37`). It can also raise `writes` from 1 to 2 by itself, but only
   when the published tag before it already reads 2 (`:21-26`,
   `.github/workflows/prepare-release.yml:102-114`). The pull request text
   warns when `server/data-format.ts` changed (`prepare-release.yml:125-130`).

The first and only format change so far: Vault values up to 64 KiB. The
limit depends on `DATA_FORMAT.writes >= 2`
(`server/vault/value-limits.ts:4-8`). Commit `e3ea7e666` raised `reads` to
2, and the release bot raised `writes` to 2 in 0.1.178.

The marker does not protect everything. `CONTRIBUTING.md:181-205` says so:

- Many JSON stores accept only `"version": 1` and throw or start empty on
  other values. A release that raises one of these versions and does not
  raise `writes` passes all checks.
- The SQLite databases have no `PRAGMA user_version`. A schema change that
  breaks an older query is not seen.
- Nothing ties a store version or a schema to `DATA_FORMAT`. Review is the
  only check.
- A workspace backup does not carry the marker.

`CONTRIBUTING.md:207-218` lists four changes that would make the rule hold
by itself. None of the four is in the code:

1. a test of all store versions and schemas against `DATA_FORMAT`
2. stores that refuse a higher `version`
3. `user_version` on each database
4. backups that record their format.

### 3.5 The doctor

`doctorAtStart` (`server/doctor/start.ts:54-78`):

1. It reads `doctor-state.json`. An error or a wrong shape counts as "no
   state" (`:35-42`).
2. If the state has this version, the doctor does not run (`:58-61`).
3. Else it calls `runDoctor({ mode: "start", fix: true })`, writes one log
   line for each check that is not OK and one summary line (`:62-65`).
4. It writes `doctor-state.json` with mode 0600. If the write fails, it
   writes a log line, and the doctor runs again at the next start (`:68-72`).
5. It never throws. An outer `catch` writes `[doctor] did not run: ...`
   (`:74-77`). The doctor never stops the server. Only `data-format.ts` does
   (`server/doctor/start.ts:1-5`).

`runDoctor` (`server/doctor/run.ts:78-163`):

1. The checks, in order: data format, lease, folders, registry, temporary
   files, engine runs, `messages.db`, private file modes, settings file
   (`:23-25`). The registry check comes before the temporary files on
   purpose: a temporary file can be the only whole copy.
2. It looks at all checks first. A check that throws becomes a problem, with
   the error text cut to 300 characters (`:42-50`, `:83`).
3. A blocking finding stops all repairs (`:90-95`).
4. For each check that can be fixed: it looks again, fixes, and looks a
   third time. A repair counts only if the third look finds nothing to fix
   (`:118-140`).
5. Before it changes a thing, it copies it into
   `doctor-backups/<time>/` with a `manifest.json`
   (`server/doctor/backup.ts:42-49`, `:109-113`). It keeps the 10 newest
   runs, all runs under 2 GiB, and a run with a copy of `bots.json` or
   `groups.json` for 30 days (`:9-14`).

The checks that repair stored data:

| Check | What it repairs | Reference |
|---|---|---|
| Folders | Makes missing `events/` and `native/` | `server/doctor/checks/folders.ts:31-41` |
| Registry | Puts back a damaged `bots.json` or `groups.json` from the newest whole `.tmp` file of a save that was cut short. With no such copy, it keeps a copy of the damaged file only. A file that this user cannot read is "not checked" | `server/doctor/checks/registry.ts:19-24`, `:72-86`, `server/doctor/files.ts:34-47` |
| Temporary files | Moves `.tmp` files of dead processes into the backup | `server/doctor/checks/temp-files.ts:15-26` |
| Engine runs | Moves run folders with no server and no process into the backup | `server/doctor/checks/engine-runs.ts:35-59` |
| `messages.db` | Runs `PRAGMA quick_check(20)` (only up to 256 MiB at start). Folds a WAL over 64 MiB into the database after a copy. Never rewrites a damaged database | `server/doctor/checks/messages-db.ts:15-17`, `:61-96` |
| Private files | Sets mode 0600 on eight files | see `file-modes-atomic-writes-redaction.md` 3.4 |
| Data format, lease, settings file | Report only | `server/doctor/checks/data-format.ts:12-25`, `settings-file.ts:20-22` |

The command `openmausbot doctor --data [--fix] [--json]` runs the same
checks. It exits with 8 while a problem is left (`server/doctor/command.ts:28`).
With `--fix`, it refuses when another user owns the data folder or when a
live server holds the lease (`server/doctor/run.ts:97-114`).

### 3.6 The main store opens and repairs

The `Store` constructor (`server/store.ts:280-550`):

1. It makes the data folder (`:295`).
2. It reads `bots.json` with `JSON.parse` (`server/registry-store.ts:107-114`).
   A missing, empty or corrupt file throws. The store catches it, sets
   `bots = []` and keeps `botsLoaded = false` (`server/store.ts:296-301`).
   Valid JSON that is not an array also gives `botsLoaded = false` (`:299`).
3. It reads `groups.json` the same way, but with no "loaded" flag
   (`:303-307`).
4. It repairs each bot (`:314-405`). It clears `busy` and `activity`. It
   drops retired apps, repairs a bad soul and writes a missing `SOUL.md`. It
   deletes bad fields. It revokes a pending approval grant to "Ask"
   (`:355-374`). It
   demotes a second Chief in one scope (`:406-420`) and deletes retired
   fields (`:421-426`).
5. `recoverThreadGrantsOnce` (`:427`). It runs once for each data folder and
   then writes the marker `always-allow-recovered`
   (`server/always-allow.ts:56-85`). It is not guarded by `botsLoaded`.
6. It repairs each room (`:429-472`). It removes members that are not in
   `bots.json`, but only when `botsLoaded` is true (`:432`). Then it saves
   `groups.json` if a room changed (`:473`).
7. Two one-time fills run only when their marker file is absent and
   `bots.json` loaded or does not exist (`:474-475`):
   `thread-model-copies-cleared` and `asked-at-filled`.
8. It fixes each task (`:476-532`), then saves `bots.json` if a bot changed
   (`:533`). It writes the markers after the save (`:534-535`).
9. It imports each legacy transcript `messages-<threadId>.json` into
   `messages.db` (`:536-543`, `server/message-db.ts:406-437`).
10. It repairs thread time stamps from `messages.db`, fills `askedAt`
    (`:563-597`), and closes duplicate "pair" conversations (`:606-634`).

The failure case that matters most: a corrupt `bots.json` is written over.

1. The parse fails, so `bots = []`. `OwnedFile.loaded` is not called
   (`server/registry-store.ts:111-112`). So the next write is not skipped as
   "unchanged" (`server/atomic.ts:136-141`).
2. `needsSeed()` is true (`server/store.ts:2249`).
3. At start, `testedAi.seed` calls `seedIfEmpty`, which makes a default bot
   and saves it (`server/index.ts:2808`, `server/tested-ai.ts:316-319`,
   `server/store.ts:2252-2254`).
4. The atomic save replaces the corrupt file with a list of one bot.
5. At the next start, `botsLoaded` is true. The room repair at `:432` now
   removes all old members from the rooms and saves `groups.json`.

The `botsLoaded` guard protects only the first start. The doctor can put
back a `.tmp` copy, but it runs only on the first start of a new version
(section 3.5). The test "tolerates a corrupt bots.json by starting empty"
(`server/store.test.ts:1831-1838`) does not check the file on disk after
the start.

Other failure cases:

- A corrupt `groups.json` loads as no rooms. The next `createGroup` writes
  `[group]` (`server/store.ts:821`). `deleteSection` always saves the room
  list (`:747`), so it can write `[]`.
- After a failed load of `bots.json`, the grant recovery runs on an empty
  list and writes its marker (`server/always-allow.ts:82-85`). The one-time
  recovery is then lost for the real bots.
- `null` or `{}` in `bots.json` makes the constructor throw a `TypeError` at
  `server/store.ts:308`, and the start fails (read, not run).

### 3.7 The main store saves

A save of `bots.json` or `groups.json` writes the whole file with
`writeFileAtomic` and mode 0600. It skips the write when the text is the
same as the last text written or read (`server/registry-store.ts:96-97`,
`server/atomic.ts:132-141`). There are three kinds of save
(`server/registry-store.ts:20-30`, `server/save-batch.ts`):

1. **Now.** A synchronous write. `commitRegistryChange` keeps a snapshot,
   applies the change, saves, and puts the snapshot back if the save fails.
   It throws `RegistrySaveError` (`server/registry-save.ts:16-25`).
2. **Pass.** Written once when the batch of a turn ends
   (`server/save-batch.ts:10-24`, `server/index.ts:7423`). A failed batch
   write only writes a log line (`server/save-batch.ts:26-37`). The resume
   cursor and the dispatch mark use it (`server/store.ts:1784`, `:1792`).
3. **Later.** A debounce of `min(1000, max(50, 10 × last write time))` ms
   (`server/save-batch.ts:44-56`). Usage, `lastContextModel` and the unread
   mark at the end of a turn use it (`server/store.ts:1838`, `:2025`). A
   failed write is tried again each 1000 ms, up to 5 times (`:87-108`).

Facts about the order and the loss:

- A deferred save is written at exit code 0 and at the restart code 75 only
  (`server/save-batch.ts:82-84`). A crash, exit code 1 or 70, or a kill
  writes nothing. Up to 1 s of deferred changes is lost. The comment says
  that the desktop application on Windows stops its server with a kill
  (`:79-80`).
- A narrowed save writes only the bots that changed. After it, a whole save
  waits as a "later" save. An in-place change to another bot is lost if the
  process stops in that second (`server/bots-text.ts:4-6`).
- Some methods save before they change memory: `createGroup`, `deleteGroup`,
  `deleteBot`, `patchBotProfile`, `switchTaskModel` and others
  (`server/store.ts:821`, `:882`, `:1431`, `:1526`, `:2064`).
- Some change memory first and do not roll back: `patchBot` (`:1485`,
  `:1500`), the project methods (`:1910-1962`), `reorderBots` (`:1942`).
- Message writes: `appendMessage` and `patchMessage` write `messages.db`
  first (`:1133-1151`, `:1235-1249`). `insertMessageAfter` and
  `branchMessage` change memory before the database (`:1159-1160`,
  `:1215-1217`).
- `deleteTasks` deletes the rows in `messages.db` and saves the JSON in one
  database transaction (`:2226-2246`, `server/message-db.ts:653-666`).
- At a graceful stop, the server flushes the deferred saves and closes
  `messages.db` (`server/index.ts:15259`).

### 3.8 The message database

`messages.db` uses the SQLite of Node (`node:sqlite`, `server/message-db.ts:4`).
It opens lazily through `db()` (`:144-158`):

1. If the handle is less than 1 s old, `db()` returns it (`:36`, `:146`).
2. If the file still exists, it returns the handle (`:147-150`).
3. If the file is gone, it closes the old handle and opens again (`:151-157`).
   The comment says that SQLite keeps writing to a deleted file with no
   error (`:35`). So a file deleted while the server runs becomes a new
   empty database, with no message to the person.

`open()` (`:40-116`):

1. It makes the folder with 0700 and the file with 0600 (`:41-47`).
2. It sets `journal_mode = WAL` and `synchronous = NORMAL` (`:49-50`).
3. It runs `CREATE ... IF NOT EXISTS` for all tables and indexes (`:51-110`).
4. It adds missing columns, found with `PRAGMA table_info` (`:111-112`,
   `server/cjk-search.ts:62`).
5. It builds the full-text index again when its shape changed
   (`server/cjk-search.ts:63-96`).

The error paths:

- A corrupt file: `open()` has no `try`. The error goes to the caller, and
  the next call tries again. Nothing renames or deletes the file.
- A locked file: no `busy_timeout` is set (`:48`). A second writer fails at
  once (not checked in the SQLite of Node).
- A newer schema: nothing checks it. There is no `user_version`.

Writes:

- A message is an upsert on `(thread_id, id)`. The comment says why it is
  not `INSERT OR REPLACE`: that form skips the delete trigger of the
  full-text index (`:135-139`).
- `transaction()` uses `BEGIN IMMEDIATE`. A nested call is a savepoint
  (`:169-198`).
- `withCommandReceipt` returns the stored result if the key exists. Else it
  runs the work and stores the receipt in the same transaction (`:254-272`).
- Follow-ups and thread deletes use `synchronous = FULL` for their
  transaction. The comment: "A 202/cancel/dispatch claim must reach disk
  (FULL sync) before its result is published." (`:228-238`).
- The notification log keeps the newest 500 rows (`:274`, `:294-303`).

`docs/verification/persistence-performance.md` measured 50 threads of 1,000
messages. A search on the main thread blocked it for 70 to 90 ms. The
project moved only the search to a worker (`:44-51`, `:86-92`). The worker
has a read-only connection. It kept the rule "commits still happen before
acknowledgement" (`:97`).

### 3.9 The runtime store (`runtime.db`)

`openRuntimeStore` (`server/runtime/store.ts:224-240`) opens
`<data folder>/runtime.db` (`server/runtime-coordinator.ts:174`):

1. It makes the folder with 0700 and the file with 0600 (`:226-233`).
2. It sets WAL and `NORMAL` (`:235-238`).
3. It runs the schema with `CREATE ... IF NOT EXISTS` (`:239`, `:115-162`).

Each state change writes the row and its event in one transaction:

1. `transaction(fn)` starts `BEGIN IMMEDIATE`. A nested call is a savepoint
   `runtime_<depth>` (`:261-287`).
2. `insert(a, event)` and `update(a, event)` write the row and call
   `writeEvent` inside one transaction (`:330-342`).
3. `update` of a missing row throws (`:339`).

Each row is the whole record as JSON, with copies of some fields in indexed
columns (`:289-292`). The store checks the JSON with a `zod` schema when it
reads a row, not when it writes it (`:21-87`, `:184-190`). A row with bad
JSON or a bad shape throws. One bad row makes all of `all()` throw, and
`Runtime.open` uses `all()` (`server/runtime/runtime.ts:114`).

There is no schema version and no migration. A partial index for live rows
was added with `IF NOT EXISTS`. The comment says that a change to the
terminal states needs a new index name, because `IF NOT EXISTS` keeps the
old definition (`:136-140`).

The store prunes whole trees older than 30 days, at most one time each day
(`server/runtime-coordinator.ts:51-52`, `:568-578`).

The legacy import runs at each start, before `runtime.open()`
(`server/runtime-coordinator.ts:185-206`):

1. It reads `room-handoffs.json` and the delegation files
   (`server/runtime/import-legacy.ts:38-89`, `:162-285`).
2. It skips each row that already exists (`:51`, `:201`, `:223`, `:241`).
3. It writes all rows in one transaction, then renames the file to
   `.migrated` (`:87`). The comment: "a crash between the writes and the
   rename is harmless" (`:37`, `:161`).
4. A `room-handoffs.json` that does not parse stays in place, and the next
   start tries again (`server/runtime-coordinator.ts:189-194`). An unreadable
   delegation file is logged and renamed (`import-legacy.ts:151-158`).

`checkInvariants` (`server/runtime/invariants.ts:37-126`) checks ten rules.
Examples:

- The status agrees with the live state.
- Each terminal row has one report.
- No brief is a duplicate.
- The replay of the events gives the stored status.
 Only tests call it. No production code calls it.

### 3.10 The restart rule of the runtime

`Runtime.open()` runs one time (`server/runtime/runtime.ts:109-158`). It
works only from stored rows:

1. It reads all rows that are not terminal and sorts them deepest first, so
   that the fate of a child marks its parent first (`:113-114`).
2. A row in `needs_input`: it writes `restart_reconciled` and asks the host
   to show the question again (`:119-124`).
3. Rows in `queued`, `waiting` and `resume` stay as they are (`:125`).
4. For a `running` row, the first branch that matches wins:
   1. It gave out work in this turn (found with event identifiers, not
      times, `server/runtime/tree.ts:123-126`): the row waits, with
      `restart = "cut"` (`:130-133`).
   2. It did an outward action, as the host port `outward` reports: the row
      fails with `interrupted` (`:134-136`).
   3. It ran again one time already: the row fails, "cut twice"
      (`:137-139`).
   4. The host hook `restartCut` gives a line: the row fails with that line
      (`:140-142`). This branch is new in commit `01bcd69ed` (#7228).
   5. Else the row runs again one time, as `queued` or `resume`
      (`:143-148`).
5. A parent that is not terminal gets `restart = "teammates"` (`:150-155`).
6. Each terminal row with no `reportedAt` goes into `reportDue` (`:157`).

The hook of 01bcd69ed is in the host, not in the runtime
(`server/memory-freeze-restart.ts:40-55`). A cut turn fails with
`FROZE_BROWSING` only when these two things are true:

1. A record of a freeze for want of memory falls between the start of the
   turn and the start of this process.
2. The thread called a browser tool after the start of the turn.

A turn with no known start runs again.

After the open, the runtime starts the first 4 reruns at once and then one
each 500 ms on the monotonic clock (`:32-33`, `:400`, `:424`). A cut turn
whose conversation has newer work from after the boot fails as "superseded"
(`:393`, `:429-431`).

Where the runtime acts before it writes, or uses more than one transaction:

- `report()` calls `runner.report` before it writes `reportedAt`
  (`:795-799`). A crash between the two gives a second report at the next
  start (`:157`).
- `needs_input`: the `parked` write and the inbox item are two transactions
  (`:568`, `:572`).
- In `open()`, the `restart_reconciled` event and the settle are two
  transactions (`:135-136`, `:138-139`, `:141-142`).
- `poll()` marks items as delivered before the caller has them (`:733`).

`dispatch` writes `admitted`, `started` and the delivered mark in one
transaction, and calls `runner.run` only after the commit (`:479-497`). A
failed write starts nothing (`server/runtime/runtime.test.ts:134`).

### 3.11 Settings: what this file adds

The load and the save of `config.json` are in
[`newer-config-unavailable.md`](newer-config-unavailable.md) 3.1 and 3.6.
At `ed8cb7278` they did not change, except one merge of the `vps` section
(`server/config.ts:905`). This file confirms:

1. A missing file gives `{}` with no warning. Any other failure gives `{}`
   and the warning `config: ignoring <path> and using defaults: <reason>`
   (`server/config.ts:698-713`).
2. A save reads the file first. Bad JSON or a file that it cannot read
   refuses the save with status 503 and keeps a copy aside
   (`server/config.ts:884-885`, `server/config-backup.ts:43-79`).
3. A file that is valid JSON but fails the schema loads as `{}`, and a save
   still goes ahead. `persistProviderInstance` saves with
   `replaceInstances: true` (`server/index.ts:11799`). The list comes from
   `instanceConfigs`, which gives the default fleet when `cfg.instances` is
   empty (`server/config.ts:1135-1137`). So the saved instances of the
   person become the default fleet. A dated copy is made first
   (`server/config.ts:989`).

New in this file: two writers change `config.json` with no dated copy.
`migrateLegacyFeatureFlags` at each start (`server/legacy-feature-flags.ts:22`)
and the CLI command `access` (`server/cli.ts:438-458`). Both skip a file
that does not parse. The CLI `access` and `config restore` take no lease,
so they can race a running server.

### 3.12 Backup, restore and the marker

- A workspace backup leaves out `data-format.json`, `doctor-backups` and
  `doctor-state.json` (`server/workspace-backup.ts:58-63`). The destination
  keeps its own copies (`:115-119`).
- The restore compares the application version, not the format. It refuses
  a backup from a newer version: "This backup was made by a newer
  OpenMausBot version." (`server/workspace-backup.ts:624-630`).
- A restore uses a journal with the phases `applying`, `committed` and
  `rolled-back`. A crash during `applying` is rolled back at the next start
  (`server/workspace-backup.ts:910-970`).

## 4. The data

### 4.1 The marker files

| File | Shape | Written by |
|---|---|---|
| `data-format.json` | `{ "format": 2, "writtenBy": "0.1.178", "writtenAt": "<ISO time>" }`, with two spaces of indent and a new line (`server/data-format.ts:17-23`, `:92`) | `stampDataFormat`, atomic, **with no mode**, so the umask applies (`:84`, `:92`) |
| `server/data-format-released.json` (in the source, not in the data folder) | `{ "version": "0.1.178", "writes": 2, "reads": 2 }` | `scripts/record-data-format.mjs` |
| `doctor-state.json` | `{ version, summary: { at, version, checked, fixed[], problems[] } }` (`server/doctor/start.ts:13-27`) | the doctor, mode 0600 |
| `doctor-backups/<time>[-n]/manifest.json` | a list of `{ check, action, path, savedAs?, mode? }` (`server/doctor/backup.ts:18`, `:109-113`) | the doctor, folders 0700, files 0600 |
| `thread-model-copies-cleared`, `asked-at-filled` | presence only (`server/store.ts:178-179`) | the main store, 0600 |
| `always-allow-recovered` | `{ "recoveredAt": <ms> }` (`server/always-allow.ts:56`, `:83`) | the main store |
| `legacy-work-threads-follow-bot` | presence only (`server/legacy-work-threads.ts:14`) | the main store |
| `*.imported`, `*.migrated` | the old file, renamed | `messages.db` import, runtime import |

### 4.2 The stores in the data folder

| Store | Kind | Version | Repair on open |
|---|---|---|---|
| `config.json` | JSON object, strict sections | none | flag rename at start |
| `bots.json`, `groups.json` | JSON arrays | none | many field repairs, section 3.6 |
| `messages.db` | SQLite, WAL | none (no `user_version`) | `ADD COLUMN`, `IF NOT EXISTS`, full-text rebuild, legacy JSON import |
| `runtime.db` | SQLite, WAL | `version: 1` inside each row (`server/runtime/store.ts:86`) | `IF NOT EXISTS`, legacy JSON import |
| `events/<threadId>.ndjson` | one JSON event on each line | none | see `event-bus-fold.md` |
| Other JSON stores | `server/command-allowlist.ts`, `server/fleet.ts` and others | `"version": 1`, and a higher one throws or loads empty (`CONTRIBUTING.md:183-188`) | not read |

### 4.3 The schema of `messages.db`

From `server/message-db.ts:51-112`, `server/message-db-memory-index.ts:7-14`
and `server/cjk-search.ts:60-96`:

```sql
messages(thread_id TEXT NOT NULL, id TEXT NOT NULL, at INTEGER NOT NULL,
  role TEXT NOT NULL, kind TEXT NOT NULL, text TEXT, json TEXT NOT NULL,
  search_text TEXT, PRIMARY KEY (thread_id, id))
thread_state(thread_id TEXT PRIMARY KEY, active_leaf_id TEXT)
chat_followups(id TEXT PRIMARY KEY, kind, owner_id, thread_id TEXT NOT NULL,
  send_id TEXT, status TEXT NOT NULL, payload TEXT NOT NULL)
command_receipts(kind, key, at INTEGER, result TEXT, PRIMARY KEY (kind, key))
notification_log(id TEXT PRIMARY KEY, at, kind, bot_id, bot_name, thread_id,
  group_id, title, body, avatar_url, read INTEGER NOT NULL DEFAULT 0,
  for_person TEXT, read_by TEXT)
memory_files(bot_id, path, text, mtime_ms INTEGER, bytes INTEGER,
  search_text TEXT, PRIMARY KEY (bot_id, path))
-- and for messages and memory_files: a view, an FTS5 table with
-- content='<view>' and tokenize='unicode61', and three triggers
```

The whole message is in the `json` column. Most queries read fields with
`json_extract`. There are no foreign keys. About 12 indexes exist, many of
them partial (`server/message-db.ts:62-74`).

### 4.4 The schema of `runtime.db`

From `server/runtime/store.ts:115-162`:

```sql
assignments(id TEXT PRIMARY KEY, root_id TEXT NOT NULL, parent_id TEXT,
  status TEXT NOT NULL, requester_thread_id TEXT, requester_run_id TEXT,
  assignee_bot_id TEXT NOT NULL, assignee_thread_id TEXT NOT NULL,
  created_at INTEGER NOT NULL, finished_at INTEGER, json TEXT NOT NULL)
assignment_events(id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id TEXT NOT NULL, at INTEGER NOT NULL, kind TEXT NOT NULL,
  detail TEXT)
inbox(id TEXT PRIMARY KEY, owner_bot_id TEXT, owner_thread_id TEXT,
  owner_run_id TEXT, assignment_id TEXT NOT NULL, kind TEXT NOT NULL,
  created_at INTEGER NOT NULL, delivered_at INTEGER)
```

- The event identifier is `AUTOINCREMENT`, so all events have one global
  order. `server/runtime/tree.ts:1` says why: "a clock can step back".
- Row and inbox identifiers are `randomUUID()`, or an identifier that the
  caller gives (`server/runtime/runtime.ts:164`, `:255`, `:809`).
- The statuses are `queued`, `running`, `needs_input`, `waiting`, `resume`,
  `completed`, `failed` and `cancelled`. The last three are terminal
  (`server/runtime/types.ts:51-61`).
- The event kinds are listed at `server/runtime/types.ts:185-188`. The store
  does not check an event kind when it reads it (`server/runtime/store.ts:207`).

### 4.5 The pragmas

| Database | `journal_mode` | `synchronous` | `busy_timeout` | `foreign_keys` | `user_version` |
|---|---|---|---|---|---|
| `messages.db` | WAL (`server/message-db.ts:49`) | `NORMAL`, `FULL` for follow-ups and deletes (`:50`, `:229-238`) | not set | not set | not set |
| `runtime.db` | WAL (`server/runtime/store.ts:237`) | `NORMAL` (`:238`) | not set | not set | not set |

### 4.6 The Clock

`Clock { now(): number; monotonic(): number }`
(`server/runtime/types.ts:340-346`). `now` is wall-clock milliseconds for
time stamps. `monotonic` is for stall windows. The default is `Date.now` and
`performance.now` (`server/runtime/runtime.ts:61`). The runtime store gets no
Clock. Its only time is `event.at ?? Date.now()` (`server/runtime/store.ts:294`),
and the runtime always gives `at`.

## 5. The UI

The feature has no component in the window. A search of `src/` for "doctor",
"data format" and the save error found nothing outside tests. What a person
sees:

- **At start:** one English line on standard error and exit code 1, for a
  newer format, an unreadable marker or a failed marker write
  (`server/data-format.ts:59`, `:68-73`, `:96`). The text is in the code, not
  in `src/locales/en.json`.
- **In the log:** `[doctor] first start of V (last: P): N checks, F fixed, P
  need a person` (`server/doctor/start.ts:62-65`), `config: ignoring ... and
  using defaults: ...` (`server/config.ts:708-710`).
- **In `/api/health`:** a `doctor` summary with the identifiers of the checks
  that were fixed and that need a person, never a path
  (`server/routes/status.ts:55-61`, `docs/self-hosting.md:1994-2000`).
- **On a failed registry save:** "Couldn't save <action>: another program is
  holding OpenMausBot's bots.json, or its folder is read-only."
  (`shared/registry-save-failure.ts:5-9`).
- **On a refused settings save:** status 503 and a text that names
  `openmausbot config restore` and the copy that was kept
  (`server/config-backup.ts:62-79`).
- **The command line:** `openmausbot doctor --data` prints `ok`, `fixed`,
  `PROBLEM` or `FAILED` for each check (`server/doctor/command.ts:12-27`).

No window state says "the settings file was ignored" or "running on
defaults".

## 6. The tests

### 6.1 The data format and the doctor

- `server/data-format.test.ts`:
  - The N-1 rule holds for this source (`:31`). A step that skips the
    two-release rule fails (`:40`).
  - The marker is written at the first start and not changed after (`:57`).
    A newer version raises it. An older reader leaves it (`:68`).
  - Newer data is refused with the exact text, and nothing changes (`:78`).
  - A bad marker is format 1 while `writes` is 1 (`:93`). It is refused
    while `writes` is 2 and not changed (`:112`).
  - Real server starts: exit 1 with one line and no files (`:226`). A NUL
    or empty marker after a power loss (`:239`, runs only while `writes`
    is 1). A large Vault value with an unreadable marker exits 1 (`:252`,
    runs only while `writes` is 2).
- `server/doctor/checks/data-format.test.ts:32`: a newer format blocks all
  repairs. A stray temporary file stays, and no backup folder is made.
- `server/doctor/start.test.ts`: the first start fixes and records the
  version (`:20`). The same version does not run again (`:36`). The doctor
  never throws (`:49`).

### 6.2 The main store

- Load and repair: a corrupt `bots.json` starts empty (`server/store.test.ts:1831-1838`).
  A corrupt `bots.json` does not empty the rooms on that start (`:190-201`).
  An unreadable `section-contexts.json` is not written over (`:663-704`).
  Approval grants are revoked at restart (`:1088-1146`). Marker files make
  each one-time fill run once (`:1246-1294`, `:2472-2492`).
- Save failure: a failed save rolls back memory for most changes
  (`:83-119`, `:276-349`, `:551-585`, `:1524-1534`, `:2666-2693`).
- Receipts: a replay with the same key gives the same message and no
  duplicate (`:515-549`).
- Deferred saves (`server/store-deferred-saves.test.ts`, with fake timers):
  many turn ends give one write after 1000 ms (`:33-53`). A durable change
  writes at once and takes the waiting changes with it (`:55-89`). Exit codes
  1 and 70 write nothing (`:104-117`).
- Not tested:
  - a crash in the middle of a write
  - an empty file
  - a corrupt `groups.json` alone
  - valid JSON of the wrong shape
  - what the save after a corrupt `bots.json` writes.

### 6.3 The message database

`server/message-db.test.ts`:

- Rows and the active leaf stay after a reopen (`:60`).
- A legacy JSON thread is imported one time and renamed (`:95`).
- A deleted database file is made again, with a check at most one time each
  second. The test mocks `Date.now` (`:130-143`).
- The file mode is 0600 (`:145`).
- A batch delete is one transaction, and a failure rolls back all of it
  (`:161-190`).
- An index that was dropped is added again on reopen (`:484-509`).

### 6.4 The runtime store and the restart

- `server/runtime/store.test.ts`: a nested transaction is a savepoint, and an
  outer failure rolls back the rows and their events (`:81`). A row that
  fails the schema throws on read, and the other rows still read (`:139`).
  The live index is added to an older file (`:148`).
- `server/runtime/import-legacy.test.ts`: a second import gives 0 rows
  (`:30`). Files that come back after a crash before the rename leave the
  rows as they are (`:160`).
- `server/runtime/runtime.test.ts` and `scenarios.test.ts`: a rerun at most
  one time, a cut after work was given out, "cut twice" fails (`:423`). An
  outward action is not run again (`:1169`, `:1206`). Reruns are paced
  (`:1600`). A rerun that newer work replaced fails (`:1630`). The memory
  freeze hook (`:1652`). Write before act (`:134`, scenarios S23 to S23d at
  `:1058-1134`). Downtime is not counted (S26 at `:1238`).

### 6.5 Time in the tests

- The runtime tests use a fake clock with separate `now` and `monotonic`
  (`server/runtime/testing/fake-clock.ts:3-28`). `sleep` moves only `now`.
- No store or runtime test calls `Date.now`, `Math.random` or a sleep.
- Candidates that can fail by chance:
  - Two tests wait one `setImmediate` tick for a grant
    (`server/store.test.ts:1377`, `:1396`).
  - Some tests find a write by the inode number
    (`server/store.test.ts:466-478`). A file system that uses an inode
    number again can make a "no write" check pass in error.
  - The real-server tests of the marker wait for a server start of up to 60
    to 120 s (`server/data-format.test.ts:205-224`).
  - `server/memory-freeze-restart.ts:47` reads `Date.now()` and
    `process.uptime()` when the caller gives no start time.
- In `runtime.test.ts`, each restart uses a new clock at the same start
  time. So `bootAt` is equal to `createdAt` of the old rows, and the `>=` of
  the "superseded" check (`server/runtime/runtime.ts:430`) can match. The
  tests use separate threads, so they do not meet this case.

## 7. Ours compared

Our crate `bot-core` has only `crates/bot-core/src/lib.rs` today. The
modules below are the ones that step 6 plans, and "no module yet" for step 8.

| Reference | Our crate and module | What we plan | Difference |
|---|---|---|---|
| `server/data-dir.ts`, `ensureDirs` in `server/config.ts:684-693` | `bot-core`, `data_dir.rs` (PR 6.1) | `DataDir` from a path that the shell gives | Same idea. P18 adds mode 0700 and one private write path |
| `server/config.ts`, `server/config-backup.ts` | `bot-core`, `settings.rs` (PR 6.2, 6.3) | `Settings` with `serde`, a missing field gets its default | The reference has no format number in the file. P22 keeps unknown fields. The file format (TOML or JSON) is open |
| `server/atomic.ts` | `bot-core`, `atomic.rs` (PR 6.3) | temporary file, then rename | See `file-modes-atomic-writes-redaction.md` |
| `server/data-format.ts`, `CONTRIBUTING.md:112-218` | no module | nothing | **Not in our plan.** P23 is an optional number in the settings file, not a folder marker |
| `server/doctor/` | no module | nothing | Not in our plan |
| `server/store.ts`, `server/registry-store.ts` (JSON registry) | `bot-core`, step 8, no module yet | SQLite from the first store (D14) | D14 says SQLite from the first store, with no JSON stage. Step 8 names threads and messages. The plan does not say where the bot records go |
| `server/message-db.ts` | `bot-core`, step 8, no module yet | threads and messages in SQLite with `rusqlite` | The reference has no `user_version` and no `busy_timeout` |
| `events/<threadId>.ndjson` (`server/harness/bus.ts`) | `bot-core`, step 8 | the event log of each thread | See `event-bus-fold.md`. The plan does not say if the log is a file or a table |
| `server/runtime/store.ts` (`runtime.db`) | `bot-core`, step 13 | assignments, events and inbox in SQLite (D8, `docs/comparison.md:60-63`) | Not step 8. Its transaction rule is in `AGENTS.md` from the start |
| `server/runtime/runtime.ts:109-158` (restart) | `bot-core`, steps 8 and 13 | `changelog.md` section 7 follows the reference | The row cites `:124-138`, which moved to `:125-155`, and it has no fifth branch |
| `server/runtime/types.ts:340-346` (Clock) | all crates | one `Clock` trait | Follows the reference |

## 8. Where we can be better

Each point has a reason of one of these kinds:

- a wrong state that the compiler or the start refuses
- less code
- a known problem of the reference that we do not copy.

1. **A folder format marker, checked before any store opens.** The reference
   has one (`server/data-format.ts:13-100`). P23 calls a format number "a
   proposal, not a fact of the reference", and puts it in the settings file
   with a read-only open. That is out of date. Reason: the marker is the only
   thing that stops an older version at the door (`CONTRIBUTING.md:172-174`).
   We can copy the rule and the test of the two-release step.
2. **`PRAGMA user_version` on our SQLite database, checked at open.** The
   reference names this as its own gap (`CONTRIBUTING.md:189-193`, `:207-218`
   items 1 and 3). Reason: a schema change that breaks an older query is then
   seen at open, not as a failed query later. Our store is new, so the cost is
   one line now.
3. **A failed load can never lead to a save.** `changelog.md` section 7
   already says: "`save` takes a value that only a successful `load` can
   make." The reference breaks this rule in three new places:
   - the seed writes over a corrupt `bots.json` (section 3.6),
   - `groups.json` has no "loaded" guard (`server/store.ts:303-307`),
   - a one-time marker is written after a failed load
     (`server/always-allow.ts:82-85`).

   Reason: a known problem of the reference ("A file written over after a
   failed read"). In Rust, a `Loaded<T>` value that only `load` returns, and
   a `seed` that needs a "the store is empty" proof, make these cases fail
   to compile.
4. **An unreadable store stops the start with one line, the same as the
   marker.** The reference stops for the marker, but starts empty for a
   corrupt `bots.json` and uses defaults for a schema-invalid `config.json`.
   Reason: one rule is less code and the person sees the problem at once.
   The boundary with P22: this point is for a file that is not JSON or that
   the program cannot read. P22 is for one section that fails the schema in
   a file that is valid JSON. P22 keeps that section as raw JSON.
5. **A database file deleted while the program runs is an error.** The
   reference opens a new empty database with no message
   (`server/message-db.ts:35`, `:144-158`). Reason: silent data loss.
6. **Set `busy_timeout`.** The reference sets none (`server/message-db.ts:48`).
   Reason: a second connection, for example a read-only search worker or a
   backup, fails at once with `SQLITE_BUSY`.
7. **Keep the pragmas of the reference:** WAL, `synchronous = NORMAL`, and
   `FULL` for a commit whose result goes out at once
   (`server/message-db.ts:49-50`, `:228-238`). Reason: the reference measured
   this (`docs/verification/persistence-performance.md`).
8. **Identifiers and order for D17.** The reference makes random UUIDs or
   takes the identifier of the caller, and orders events by `AUTOINCREMENT`,
   never by time (`server/runtime/store.ts:142`, `server/runtime/tree.ts:1`).
   Reason: D17 left "the form of a new identifier" open until step 8. Order
   by event identifier removes the clock from the order.
9. **One transaction for each restart decision.** The reference writes
   `restart_reconciled` and the settle in two transactions
   (`server/runtime/runtime.ts:135-142`). Reason: `AGENTS.md` says that a
   state change writes the row and its event in one transaction.
10. **Say the delivery rule of each output.** The reference reports at least
    once (`:795-799`) and polls at most once (`:733`). Reason: "The same work
    done or delivered two times, or lost" is in 6 of 6 periods of the
    changelog. A type for each rule makes the choice explicit.
11. **Run the invariant checks in production too, as a log line.** The
    reference runs them only in tests. Reason: a broken invariant at a
    restart is found sooner (this is a proposal, not a fact of the
    reference).
12. **No deferred save in step 8.** Our store is SQLite, so a small commit is
    cheap. The reference loses up to 1 s of deferred changes at a crash or a
    kill. On Windows, its desktop application stops its server with a kill
    (`server/save-batch.ts:75-84`). Reason: less code, and no loss
    window.

### 8.1 The problems of `changelog.md` section 5 in this code

| Problem | What the reference does here | Our answer |
|---|---|---|
| State lost at a restart or a crash | `runtime.db` decides from stored rows (section 3.10). WAL with `NORMAL` can lose the last commits at a power loss. Deferred saves lose up to 1 s. A deleted `messages.db` becomes empty. A failed rename of the legacy folder starts an empty folder (`server/config.ts:686-689`) | Points 5, 7, 12. The row of `changelog.md` section 7 must cite `runtime.ts:125-155` and say if we take the fifth branch |
| The same work done or delivered two times, or lost | Message upsert on `(thread_id, id)`. Command receipts in one transaction. Enqueue dedupe (`server/runtime/runtime.ts:236-239`). A rerun can repeat an outward action that the port does not see. A report is at least once, a poll at most once. Parked and woken are two transactions | Points 8, 9, 10 |
| A file written over after a failed read | The marker refuses (writes 2). `messages.db` is never rewritten. The doctor never deletes. But `bots.json` is written over by the seed, `groups.json` has no guard, a marker is written after a failed load, and a schema-invalid `config.json` loses its instances (P22) | Points 3, 4 |
| Tests that fail by chance | The runtime has a fake Clock with `now` and `monotonic`. The store tests use fake timers. Candidates: `setImmediate` waits, inode checks, real-server starts | The `Clock` trait of `changelog.md` section 7. A test of our store opens an in-memory database |

## 9. Not verified

- The default `busy_timeout` of `node:sqlite`, and the SQLite version in the
  Node of the reference.
- What happens upstream when `openRuntimeStore` throws on a corrupt
  `runtime.db` in the constructor of `RuntimeCoordinator`.
- What `open()` of `messages.db` leaves in `handle` when it throws during a
  reopen (`server/message-db.ts:152-155`).
- How `deleteThreads` and the JSON save behave if `COMMIT` fails after the
  JSON save worked.
- That `null` or `{}` in `bots.json` stops the start. This comes from
  reading `server/store.ts:308`, not from a run.
- That a data folder that cannot be written stops the start with an
  uncaught error. This comes from reading `server/config.ts:691`.
- Whether `performance.now()` stops while the computer sleeps on each
  operating system, as `server/runtime/types.ts:343` says.
- Whether the window shows the 503 text of a refused settings save or the
  registry save error.
- `server/doctor/run.test.ts`, `server/doctor.e2e.test.ts` and the tests of
  the other doctor checks: only their test names were read.
- `server/workspace-backup.ts` lines 126-611 and 761-875.
- `server/message-search.worker.ts`, `server/burst/store.ts` (`bursts.db`)
  and `server/cloud-sync-store.ts`.
- The internals of `dropRetiredApps`, `grantScopedApps`, the section context
  file, `botSafetyDigest` and `runCommand`.
- The full list of files in the data folder. The search found about 40 JSON
  files and 15 folders by literal names only.
- `docs/files.md` and `docs/plans/2026-09-14-phase-0-foundation.md` have no
  text about the marker or the repairs (search only).
- No test of the reference was run.
