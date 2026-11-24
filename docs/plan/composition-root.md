# Plan: The composition root

The proposals from the research file
[`../research/features/composition-root.md`](../research/features/composition-root.md)
(batch 4, reference commit `ed8cb7278`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 4, 6, 7, 15, later.
- **State:** all open. P26 (in [`README.md`](README.md)) is still the open
  choice that blocks PR 7.3.
- **The main finding:** the reference has two roots in practice. The
  Electron main process builds the desktop parts, and `server/index.ts`
  (15,276 lines) builds the server parts. No host module or route module
  imports `server/index.ts`. Start-up and shutdown are still in that file.

## Proposals

- **P86 (step 6). Take the data-folder lock first.** `DataDir` takes a lock
  before it reads any file. A second open gets a typed refusal. Use a lock
  that the operating system holds, for example `std::fs::File::lock`.
  Check that toolchain 1.94.1 (D5) has it on each platform.
  - Kind: follows the order of the reference. The lock type is better than
    the reference: it needs no process id and no reaper.
  - Why: `bot-cli` and `bot-desktop` can open one folder. The process-id
    checks of the reference failed on Windows in v0.1.83 and v0.1.138.
  - Source: `server/index.ts:655-658`, `electron/data-dir-lease.mjs:391-474`,
    `:659-713`.
  - Changes: PR 6.1, and a decision for the lock.
- **P87 (step 7). One shutdown with an order and one time limit.** Install
  the stop handler before the build. Stop the turns and the engines, then
  flush the bus and the stores. Log each step that fails. Close each
  listener and task.
  - Kind: better than the reference.
  - Why: the reference installs the handler in its last line. It runs all
    cleanup jobs at the same time and logs no failure. It never closes its
    main HTTP server.
  - Source: `server/index.ts:15227-15276`, `server/graceful-shutdown.ts:10`,
    `:29-35`.
  - Changes: PR 7.3, or a new PR of step 7.
- **P88 (step 4). Time limits in the registry.** A limit on the build and
  on the stop of an entry. A failed or timed-out read counts as "down" for
  a fixed time. At the limit, stop the probe, not only the wait.
  - Kind: better than the reference.
  - Why: the reference has no limit on `load()`, `createEntry()` or
    `dispose()`, and its 60 s limit stops only the wait. Its hold-down rule
    is in the container probe, not in the registry.
  - Source: `server/harness/registry.ts:71-87`, `:153-198`, `:456-474`,
    `:587-594`, `server/container-runtime-probe.ts:3-6`, `:28-29`.
  - Changes: step 4. Related: P6, P62.
- **P89 (step 7). Build all parts before the first command.** The root gives
  the state to the Tauri builder only when each part exists.
  - Kind: better than the reference, which holds work back with flags such
    as `followupsReady` and late getters.
  - Source: `server/index.ts:5546`, `:7041`, `:8671`, `:15147`.
  - Changes: PR 7.3.
- **P90 (step 7). Catch a panic on each turn task.** Each turn runs in its
  own `tokio` task. A `JoinError` ends the turn with `turn.completed` and
  `failed` (D20). Add this cost of one process to D10.
  - Kind: better than the reference for our design.
  - Why: with D10, a panic that is not caught closes the window. The
    reference keeps the window alive because a supervisor starts its
    server again.
  - Source: `server/crash-guard.ts:12-14`, `:63-70`, `server/index.ts:15276`,
    `electron/server-supervisor.mjs:70-83`.
  - Changes: PR 7.2.
- **P91 (steps 6 and 7). Settings as a value that the root replaces.** The
  root holds `Arc<Settings>`. A save makes a new value. A reader gets a
  whole old value or a whole new value.
  - Kind: better than the reference, which changes one object in place.
  - Source: `server/index.ts:771`, `:5108`.
  - Changes: PR 6.2, PR 7.6.
- **P92 (step 15). A routine waits only for its own engine.**
  - Kind: better than the reference, where timed work waits for each engine
    read with no limit. A turn already waits only for its own engine.
  - Source: `server/index.ts:7683-7686`, `:15152-15157`.
- **P93 (step 7 or later). Allow one copy of the desktop app.** A second
  start focuses the first window and exits. Check the license of the Tauri
  single-instance plugin first.
  - Kind: follows the reference.
  - Source: `electron/main.mjs:186-189`, `:250-263`.
- **P94 (later). Updater rules.**
  1. At most 3 quiet tries for each version.
  2. Release the single-instance lock before the quit.
  3. After a quiet install, keep the window hidden only for 5 minutes.
  4. Wait for the core to stop before the new version opens the folder.
  - Kind: follows the reference, and closes its gap of the 9.5 s stop.
  - Source: `electron/update-when-quiet.mjs:13-16`, `:78-92`,
    `electron/main.mjs:191-193`, `:293`, `:342-358`.

## New facts for P26

- The command line of the reference builds a second registry of its own
  (`server/cli-setup.ts:29`). Two ratchet tests only slow the growth of the
  one server root (`scripts/testing/file-size-ratchet.test.ts:15-19`).
- The module rules give four notes for our root:
  1. A module takes the narrow trait that it needs.
  2. A module returns typed errors, not an HTTP status.
  3. A module builds only itself.
  4. The model file that `server/routes/README.md:8` names does not have the
     model shape.
- The decision of P26 names each root and the order of start-up. The
  order is the lock, the settings, the registry, the bus, the store, the
  runtime, then the commands. Shutdown is the reverse (P87). D4, D7 and the
  rule of `AGENTS.md` then change to match.
