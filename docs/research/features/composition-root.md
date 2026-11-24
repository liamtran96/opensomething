# The composition root: start-up, shutdown and how the modules connect

Row of [`../reference-features.md`](../reference-features.md):
`server/host/README.md`, `server/routes/README.md`, "The rules for the host
modules and the route modules: how `server/index.ts` is split". Part 5 of
[`../README.md`](../README.md). Step 7 of [`../../plan/README.md`](../../plan/README.md)
(crates `bot-cli` and `bot-desktop`).

We read the reference project on 2026-11-24, at commit `ed8cb7278`. All
paths are in the reference project, unless a line says "ours". Nobody opened
the `enterprise/` directory. Five subagents read the files, one subagent for
each group in section 2. The main session then read the key lines again. The
word "checked" marks a fact that the main session read again in the code.

This file adds to these files:

- [`../openmausbot-system-design.md`](../openmausbot-system-design.md),
  section 4, gives the start-up order in one sentence. This file gives each
  step with its line, the order of shutdown, the crash path and the desktop
  side.
- [`chat-turns.md`](chat-turns.md) and
  [`newer-config-unavailable.md`](newer-config-unavailable.md) describe the
  crash guard as a wrapper of a turn. This file tells what the crash guard
  does to the whole server.
- [`driver-contract.md`](driver-contract.md) says that `dispose` and
  `disposeAll` have no limit. This file tells how the shutdown wraps them.
- [`event-bus-fold.md`](event-bus-fold.md) gives the 1 s bus flush at exit
  and the listeners. This file gives the order of all 16 listeners in the
  first half of `index.ts` and the place of the flush in the shutdown.
- [`queue-and-steer.md`](queue-and-steer.md) gives the queued-send drain.
  This file tells when the drain is allowed to run (`followupsReady`).

This file does not repeat the route table as an HTTP API. Part 6 of
`../README.md` is for that.

**Changes since the earlier research.** The earlier files read commits
`3aec210` and `d6660e2d7`.

- `git diff` from both commits to `ed8cb7278` is empty for
  `graceful-shutdown.ts`, `crash-guard.ts`, `data-dir-lease.ts`,
  `electron/data-dir-lease.mjs`, `harness/registry.ts` and the tests of the
  first two. Their behaviour did not change.
- `server/index.ts` changed 57 lines since `3aec210` and 16 lines since
  `d6660e2d7`. Each change replaces one line with one line, so the line
  numbers did not move. Two changes touch start-up:
  - The coordinator and the routines now get a `restartCut`
    (`index.ts:3845`, `:8672`). It handles a run that a restart cut.
  - The listen callback now also starts an orphan-folder sweep
    (`index.ts:15151`).
- The lines that earlier files cite for the drain (`index.ts:7031-7036`) and
  the bus flush (`index.ts:15265`) did not change.

## 1. In short

The reference project is a Node server and an Electron desktop app. The
desktop app starts the server as a child process. This file is about how the
server is put together, how it starts, and how it stops.

**One file builds everything.** `server/index.ts` has 15,276 lines. It
has 427 import lines, builds each part in the order of the file, and
then listens for requests. There is no `main` function and no separate boot
phase. Each line at the top level of the file runs in order when the file
loads.

**The file is being split.** Two short documents give the rules:

- `server/host/README.md` (42 lines): a "host module" is one concern of the
  server, for example the daily brief or the stop of a turn. It exports a
  factory function that takes its dependencies as one object.
- `server/routes/README.md` (17 lines): a "route module" answers some HTTP
  paths. It exports a factory that returns one request handler.

`index.ts` stays the only place that builds the parts and connects them. Two
tests stop the file from growing again. Most other rules are checked only by
review.

**Start-up** has three stages:

1. The desktop app takes a lock on the data folder, starts the server child,
   and asks it "are you ready?" until the right process answers.
2. The server loads its parts from top to bottom. The order is: the folder
   lock, secrets, settings, engines, the event bus, the store, the
   coordinator, the listeners, the timers.
3. The server listens. Some work waits until each engine is read.

**Shutdown** has two paths:

- A stop signal runs 14 cleanup jobs at the same time, with one time
  limit of 8 s. Then the server flushes the event log for up to 1 s, closes
  its stores and releases the folder lock.
- A crash stops the engines (5 s limit) and exits. It flushes nothing.

Special terms. Each term has this meaning in all of this file:

- **Composition root**: the one place that builds each part of a program and
  gives each part the other parts that it needs. In the reference project it
  is `server/index.ts`.
- **Factory**: a function `createX(deps)` that builds one module and returns
  its functions. The module keeps its own state inside the factory.
- **Deps** (dependencies): the object that the composition root gives to a
  factory. It holds other parts, for example the store, or small functions.
- **Late-bound getter**: a dep in the form `routines: () => routines`. The
  module calls it each time it needs the value. It exists because the value
  is made later in `index.ts` than the module that needs it.
- **TDZ** (temporal dead zone): in JavaScript, a `const` or `let` cannot be
  read before the line that makes it. A read throws an error. The late-bound
  getters avoid this.
- **Route table**: the list `ROUTES` of route handlers. The server tries each
  handler in order until one answers.
- **`PASS`**: the value that a route handler returns when a request is not
  for it.
- **Ratchet test**: a test that stores a number, for example the line count
  of a file, and fails when the number goes up.
- **Data-folder lease**: a lock file in the data folder. It stops a second
  server from using the same folder.
- **Bus listener**: a function that `bus.subscribe` registers. Each event of
  each engine goes to each listener, in the order of registration.
- **Supervisor**: the desktop code that watches the server child and starts
  it again after a crash.
- **Graceful shutdown**: the stop path after a stop signal (SIGINT or
  SIGTERM). It cleans up before the exit.
- **Crash guard**: the code that catches an error that nothing else caught.
  It fails one turn, or it ignores the error, or it stops the server.

## 2. Files read completely

Five subagents read these groups. Each subagent read each file in its group
completely, or in the ranges that this section gives.

**Group 1. The rules and the guards**

| File | Lines |
|---|---|
| `server/host/README.md` | 42 |
| `server/routes/README.md` | 17 |
| `server/routes/table.ts` | 36 |
| `server/workspace-backup-http.ts` | 289 |
| `scripts/testing/file-size-ratchet.test.ts` | 76 |
| `scripts/testing/index-route-ratchet.test.ts` | 30 |
| `scripts/tighten-ratchets.mjs` | 92 |
| `server/request-auth.ts` | 752 |
| `server/routes/announcements.ts` | 19 |
| `server/routes/sign-in.test.ts` | 116 |
| `server/desktop-computer.test.ts` | 100 |
| `server/managed-desktop-cleanup.test.ts` | 408 |
| `server/testing/stall-clock-hooks.mjs` | 23 |
| `tsconfig.server.json` | 33 |
| `server/dev-server.ts` | 4 |

Partial reads: `index.ts:12405-12600`, `:15040-15090`,
`routes/check-backs.ts:1-40`, `:93-113`, `host/no-ai-notice.ts:20-60`,
`harness/http.ts:29-38`, `package.json:19-59`, `bot-link.e2e.test.ts:84-92`,
and the five lines after the `readFileSync` call in five more tests.

**Group 2. `server/index.ts`, lines 1 to 7,650**

| File | Lines |
|---|---|
| `server/index.ts`, lines 1-7650, in 13 ranges of about 600 lines | 15,276 in total |

Partial reads: `server/store.ts:280-310`, `harness/registry.ts:75-90` and
`:153-180`, `bot-box/boot.ts:19-31`.

**Group 3. `server/index.ts`, lines 7,650 to 15,276, and the shutdown files**

| File | Lines |
|---|---|
| `server/index.ts`, lines 7650-15276, in 15 ranges | 15,276 in total |
| `server/graceful-shutdown.ts` | 37 |
| `server/graceful-shutdown.test.ts` | 52 |
| `server/crash-guard.ts` | 128 |
| `server/crash-guard.test.ts` | 148 |
| `server/data-dir.ts` | 56 |
| `server/data-dir.test.ts` | 46 |
| `server/data-dir-lease.ts` | 33 |
| `server/data-dir-lease.test.ts` | 180 |
| `server/data-dir-entry-points.test.ts` | 50 |
| `server/boot-readiness.e2e.test.ts` | 159 |
| `server/acp-shutdown.e2e.test.ts` | 72 |
| `server/browser-shutdown.e2e.test.ts` | 164 |
| `electron/data-dir-lease.mjs` | 823 |
| `server/first-engine-read.ts` | 14 |

Partial reads: `lan-address.ts:30-80`, `due-timer.ts:30-45`,
`harness/registry.ts:579-595`, `sessions.ts:250-320`,
`engine-records.ts:149-160`, `:264-274`, `runtime-coordinator.ts:535-560`,
`coordinator.ts:228-236`, `perf/launch-probe.ts:17-23`.

**Group 4. A sample of host and route modules, and the registry**

The subagent counted all files of `server/host/` and `server/routes/` with
shell tools (section 3.3). It then read a sample. The sample has a small, a
medium and a large module, a module with state, and a module with a
late-bound getter.

| File | Lines | Why in the sample |
|---|---|---|
| `server/host/person-stop.ts` and its test | 94, 75 | Small. Late-bound `routines()` and `handoffs()` |
| `server/host/proactive.ts` and its test | 300, 197 | Medium. Builds six other host modules |
| `server/host/peer-limit-resend.ts` and its test | 207, 187 | State in the factory. A generic factory |
| `server/host/brief.ts` and its test | 615, 391 | Large. Saves its state to a file |
| `server/host/team-away.ts` and its test | 343, 240 | Six maps of state. A fake clock and fake timers |
| `server/host/cloud-computer-power.ts` | 293 | Imports process singletons directly |
| `server/routes/web-panels.ts` | 12 | In `ROUTES` with no deps |
| `server/routes/announcements.ts` | 19 | In `ROUTES` with no deps |
| `server/routes/reactions.ts` and its test | 34, 88 | Small |
| `server/routes/today.ts` and its test | 42, 68 | Small |
| `server/routes/jobs.ts` and its test | 131, 197 | Medium. A long poll |
| `server/routes/image-tools.ts` | 191 | A bare `Map` in its deps |
| `server/routes/bot-skills.ts` | 207 | Calls global functions |
| `server/harness/registry.ts` | 595 | The registry, for "one slow part blocks the others" |
| `server/graceful-shutdown.ts` | 37 | `disposeAll` at shutdown |

Partial reads: `host/cloud-computer-power.test.ts` (lines 1-140 and
525-540 of 566), `routes/bot-skills.test.ts` (1-80 of 235). One line of
`brief.ts` (424) was cut at 260 characters when read.

**Group 5. Desktop start-up, shutdown and the updater**

| File | Lines |
|---|---|
| `electron/main.mjs`, in 7 ranges | 3,124 |
| `electron/server-supervisor.mjs` | 130 |
| `electron/server-child-launch.mjs` | 14 |
| `electron/server-boot-probe.mjs` | 101 |
| `electron/server-probe.mjs` | 171 |
| `electron/server-status.mjs` | 145 |
| `electron/data-dir-lease.mjs` | 823 |
| `electron/single-instance.mjs` | 16 |
| `electron/window-all-closed.mjs` | 18 |
| `electron/boot-head-start.mjs` | 16 |
| `electron/startup-screen.mjs` | 119 |
| `electron/updater-coordinator.mjs` | 341 |
| `electron/update-when-quiet.mjs` | 132 |
| `electron/update-when-quiet-main.mjs` | 54 |
| `electron/window-all-closed.node-test.mjs` | 61 |

About 27 lines of `main.mjs` are longer than 300 characters. They were read
only in part. None of them is a line of start-up or shutdown that this file
uses.

Partial reads: `electron/updater.mjs` (28-70, 100-170, 186-233 of 233). The
tests `server-supervisor.node-test.mjs` (1-365, 425-549 of 549),
`single-instance.node-test.mjs` (55-84), `server-child-launch.node-test.mjs`
(50-112), `server-boot-probe.node-test.mjs` (1-50, 267-287),
`data-dir-lease.node-test.mjs` (1-160, 213-247),
`updater-coordinator.node-test.mjs` (211-255). Also `routes/move-freeze.ts`
(1-70) and `error-pages.mjs` (all 57 lines, read by the main session).

**This repository.** The main session read these files:

- `MEMORY.md`, `AGENTS.md`, `docs/research/README.md`, `progress.md`,
  `reference-features.md` (the header and the row), `changelog.md`
  (sections 5 to 7).
- `docs/plan/README.md`, decisions D3 to D10 of `docs/decisions.md`, and
  sections 4, 10 and 11 of `openmausbot-system-design.md`.
- `crates/bot-cli/src/main.rs` and `crates/bot-desktop/src/main.rs`.

## 3. How it works

### 3.1 Which process owns which work

The desktop app and the server are two processes (group 5).

| Work | Desktop main process | Server child |
|---|---|---|
| One copy of the app | Single-instance lock (`main.mjs:186-189`) | none |
| The data folder | Chooses it, takes the main lease, gives the child a one-use delegation (`main.mjs:2833-2847`) | Takes a sub-lease (`data-dir-lease.mjs:614-657`) |
| The server process | Picks the port, starts the child, checks that it is ready, starts it again after a crash | none |
| Secrets | Reads the keychain. Gives secrets to the child in its environment (`main.mjs:1124-1128`) | Reads them from the environment |
| The private token of the desktop | Makes it and sends it by `postMessage` (`main.mjs:295`, `:1159-1164`) | Refuses desktop requests until it gets the token (`main.mjs:1115-1116`) |
| Windows, splash, tray, quit | Yes | none |
| Updates | Decides when the person is away. Asks the server if it is busy | Reports "busy" (`routes/move-freeze.ts:44-48`) |
| Work state: turns, threads, stores | none | All of it |
| Graceful shutdown | Asks the child to stop, and waits 9.5 s | Runs the cleanup (section 3.6) |

### 3.2 The rules for host and route modules

The rules of `server/host/README.md`:

1. One module for each concern. It exports `createArea(deps: AreaDeps)`. The
   deps are the singletons that it needs (`store`, `cfg`, `registry`, `bus`,
   `coordinator`, `sessions`, `broadcast`, `notify`). `index.ts` passes them
   and "stays the only composition root". A module never imports
   `index.ts` (`host/README.md:6-11`).
2. State moves with its code. The maps and sets of a module live inside its
   factory. Another module reads shared state through a function, not a bare
   `Map` (`:12-14`).
3. A pull request that moves code changes no behaviour. The function bodies
   stay byte-identical (`:15-18`).
4. Order that matters stays in `index.ts`. The top-level `await` lines and
   the `bus.subscribe` calls keep their order there (`:19-21`).
5. A `let` that `index.ts` sets far from its declaration becomes a getter in
   deps, for example `deps.routines()` (`:22-25`).
6. Tests follow the code. A test that cut `index.ts` as text imports the new
   module, or is deleted (`:26-30`).
7. A ratchet test enforces the size of files. New modules stay under 1,500
   lines, most under 800 (`:31-34`).
8. Route modules follow `server/routes/README.md` (`:35-38`).

The planned order of the split ends with "boot and shutdown"
(`host/README.md:40-42`). So start-up and shutdown are still in `index.ts`.

The rules of `server/routes/README.md`:

1. A new route goes in a module, not in an `if` block of `index.ts`
   (`routes/README.md:3`).
2. A module exports `createXRoutes(deps): RouteHandler`. It never imports
   `index.ts` (`:7-8`).
3. `index.ts` builds it with one import and one `ROUTES.push(...)`. A module
   with no deps is listed in `table.ts` (`:9-10`).
4. A handler returns `PASS` when a request is not its own. In one module, a
   literal path comes before a pattern that also matches it (`:11-12`).
5. The table runs after the sign-in check, so a handler gets an `auth` that
   is already checked (`:13-14`).
6. A type import must be `import type`. The server runs with
   `node --experimental-strip-types`, which removes only imports marked
   `type`. A bare type import passes `tsc` and fails at boot
   (`:16-17`, `package.json:36`, `tsconfig.server.json:15-18`).

### 3.3 What the modules look like now

The census of group 4 (top-level files only):

| | `server/host/` | `server/routes/` |
|---|---|---|
| Source files | 209 | 133 |
| Test files | 175 | 106 |
| Source files with a test of the same name | 161 | 85 |
| Lines in total | 32,143 | 17,454 |
| Median lines of a file | 104 | 72 |
| Largest file | 830 (`brief-words.ts`) | 872 (`bot-messages.ts`) |
| Files that export `function createX(` | 157 | 123 |
| Files that import `../index.ts` | 0 | 0 |

The shape of a host module (`host/person-stop.ts`, group 4):

1. `export interface PersonStopDeps` lists the deps. A large part is a slice
   of a class: `store: Pick<Store, "appendMessage" | "bot" | ...>`
   (`person-stop.ts:13`).
2. A late-bound dep is a method that can return null:
   `routines(): Pick<RoutineManager, ...> | null` (`:14`).
3. `createPersonStop(deps)` returns a plain object of functions
   (`:49-94`).
4. The public type comes from the factory, not from a declared interface:
   `export type Proactive = ReturnType<typeof createProactive>`
   (`host/proactive.ts:300`).

State inside a factory:

- Closure maps and sets at the top of the factory
  (`host/peer-limit-resend.ts:90-96`, `host/team-away.ts:122-129`).
- A file that the factory loads one time and saves with an atomic write
  (`host/brief.ts:168-184`).
- Timers that the factory owns, with `start()`, `stop()` or `close()`
  (`host/proactive.ts:265-291`).

Optional deps are the test seams: `now?`, `setTimer?`, `fetchImpl?`, with a
default such as `deps.fetchImpl ?? globalThis.fetch`
(`host/team-away.ts:104-121`).

The shape of a route module (group 1, checked: `routes/table.ts:24-36`):

- `PASS` is a unique symbol (`table.ts:10`).
- `RouteContext` has `req`, `res`, `url`, `path`, `method`, `auth`, `json`
  and `readBody` (`:12-21`).
- `RouteHandler = (ctx: RouteContext) => Promise<typeof PASS | void>`
  (`:24`).
- `createCheckBackRoutes(deps): RouteHandler` returns one `async` function. It
  matches the path and returns `PASS` when the path is not its own
  (`routes/check-backs.ts:93-113`).

Where the code does not follow the rules:

- **Host modules build other host modules.** `createProactive` builds the
  brief and five other modules and connects them (checked:
  `host/proactive.ts:93`, `:145`). So `index.ts` is the root only of the top
  level.
- **Process singletons imported directly.** Examples:
  `host/cloud-computer-power.ts:7-8` (`boatHealth`, `boatReadiness`),
  `host/browser.ts:14`, `:60`, `host/chief-notices.ts:3` (`engineMemory`). The
  test of `cloud-computer-power.ts` must mock modules (`vi.mock`) because of
  this (`cloud-computer-power.test.ts:7-38`).
- **"No deps" can mean hidden globals.** `routes/announcements.ts:15-16` calls
  `announcementStore()` and `releaseNotesStore()`.
- **State at module scope.** `host/thread-posts.ts:77`, `:79` and
  `host/bitwarden-cli.ts:51` have maps outside any factory. 53 host files and
  10 route files export no factory.
- **A mutable `Map` in deps.** `routes/image-tools.ts:75`, `:111`,
  `:125-126` changes `inFlight`.
- **The model file is not the model shape.** `routes/README.md:8` says "same
  shape as `server/workspace-backup-http.ts`". That file returns
  `(req, res, path, auth): Promise<boolean>`, not a `RouteHandler`
  (`workspace-backup-http.ts:159`). `index.ts` calls it outside `ROUTES`
  (`index.ts:12576`).
- **One settings object that changes in place.** `const cfg = loadConfig()`
  (`index.ts:771`) goes to many modules. Later `index.ts` runs
  `Object.assign(cfg, loadConfig())` (checked: `index.ts:5108`). Each module
  that holds `cfg` sees the change through the shared object.
- **Errors with an HTTP status attached.** `Object.assign(new Error(..),
  { status, code })` (`host/person-stop.ts:76`). A route reads them back by
  the shape of the object (`routes/reactions.ts:28-31`).

### 3.4 How `index.ts` connects the modules

1. **110 factory calls** from `./host/` and `./routes/` are in lines 1-7650.
   About 145 more are after line 7650 (group 2).
2. A typical call gives some parts as values and some as getters:
   `createVisibilityHost({ store: () => store, routines: () => routines,
   team: Boolean(CLOUD_TEAM), ... })` (`index.ts:1130`).
3. **The late-bound values** (checked for two of them):
   - `routines`: declared at `index.ts:5546`, set at `:8671`. Modules from
     line 951 on get `routines: () => routines`.
   - `calendarCalls`: declared at `:5552`, set at `:8827`.
   - `orgLibrary`: declared at `:1550`, set at `:8789`. A message that
     arrives before that waits in `pendingOrgLibraryRelay` (`:1551`).
   - `workspaceAccess`: declared at `:745`, set at `:15087`.
   - About 20 `const` values are made after line 7650 but are used in
     closures before it, for example `signInSettle` (`:11434`) and
     `mcpConfig` (`:12218`).
4. The getter exists for the order of construction, not because the value
   changes after start-up. A module calls `deps.routines()` each time
   (`host/person-stop.ts:53`).
5. **Order that the comments state:**
   - The lease before any durable state (`index.ts:655`).
   - A pending restore before long-lived objects (`:659`).
   - The engine key policy before the first engine probe (`:1371`).
   - Coordination state before store listeners and routine recovery
     (`:3695`).
   - `upgrades` before any callback that revokes a session (`:4586`).
   - The memory listener before the main fold (`:5041`).
   - The queued-send drain after the main fold (`:7031`).
   - The route table last among the imports (`:572-575`).

### 3.5 The order of server start-up

All steps run at the top level of `index.ts`, in file order. "Await" means
that each later step waits for this step.

1. A side-effect import reads Cloud secrets from a pipe "before any module
   can start a process" (`index.ts:1-2`).
2. Ports from the environment (`:649-652`). The webhook port is the main
   port plus one (`:650`).
3. The data format check and the folders (`:654`).
4. **The data-folder lease** (checked: `:655-658`).
   `acquireDataDirLeaseForProcess(DATA_DIR)` runs "before any durable
   identity, sessions, config or Store state is loaded".
   `startEngineRecords` stops what an earlier server left, and nothing waits
   for it. The exit hook releases the lease.
5. A pending workspace restore, the format stamp and safe repairs
   (`:659-666`).
6. The environment id, the sign-in allow list and the sessions
   (`:669-681`).
7. Cloud secrets go from the environment into memory. Then the code deletes
   them from `process.env` (`:684-719`).
8. **Await: the bot box** (checked: `:720`). This is the sandbox of a bot
   process on Linux. It calls `box.start(...)` (`bot-box/boot.ts:31`). This
   call has no time limit here.
9. The file stores: the Vault, email, held secrets, password managers. A
   password manager refresh starts, and nothing waits for it (`:724-742`).
10. The settings: `const cfg = loadConfig()` (`:771`).
11. The engine registry: `new ProviderRegistry(BUILT_IN_DRIVERS, ...)`
    (`:801`).
12. Team, visibility, access, usage caps, MCP and connections
    (`:806-1380`).
13. **Await: the registry loads each engine** (checked: `:1392-1393`). It
    builds all engines at the same time with `Promise.all`
    (`registry.ts:156-162`). Section 3.9 tells why a stuck engine can stop
    start-up here.
14. The channel to the Electron parent (`:1403`).
15. **The event bus** (`:1485`). It attaches to each engine and registers
    listener 1 (`:1486`).
16. Turn capabilities, the maps of direct turns, resources and browsers
    (`:1609-2730`).
17. **The store** (`:2731-2737`). Its constructor loads `bots.json` and the
    groups synchronously (`store.ts:280-309`).
18. About 40 factories in 52 lines (`:2738-2789`).
19. **Await: move bots off a removed engine** (checked: `:2791`).
20. **On a new data folder only** (checked: `:2792-2793`):
    - Await the Cloud credit, for 15 s or less.
    - Await `refreshUnsetModelSelections()`. It reads each engine.
21. **On an older data folder** (checked: `:2794-2796`): the engine reads
    start, and nothing waits for them here. The promise is `enginesRead`.
22. Seeds and sweeps: the default bot, the skills, the browser cleanup
    (`:2808-2842`).
23. The coordinator, which reloads its stored hand-offs (`:3844-4039`).
    It does not run the runtime recovery when it is built: "Not at
    construction: reconciling calls the host, which is still initialising
    then" (`runtime-coordinator.ts:184-185`). The first method call that needs
    the runtime opens it (`:205`). `Runtime.open()` is the restart recovery
    of `changelog.md` section 7 (`runtime/runtime.ts:107-138`). Which call
    comes first at start-up was not traced (section 9).
24. The store listener that makes window frames (`:4450-4508`).
25. The SSE stream id, the sequence counter and the replay buffer
    (`:4651-4658`).
26. **The turn watchdog** and its timer (`:4937-5009`).
27. Bus listeners 3 to 16, with the main fold at `:6256-6841` and the
    queued-send drain at `:7031-7036` (checked).
28. **The routines manager** (checked: `:8671`). It recovers runs that a
    restart cut (`:8672`).
29. Cloud-home ownership, room goals and routine receipts (`:8776-8845`).
30. **Await: the webhook receiver listens** on its own port
    (`:9382-9392`). A failure is only logged. A webhook can arrive before the
    main server listens. It only adds a run to the queue (`:9356`).
31. The hand-off ticks start. Each tick returns at once while `enginesRead`
    is set (`:9403-9409`).
32. Consent cards of the last run are closed, because they "live only in
    memory" (`:9466-9470`).
33. About 70 `ROUTES.push` calls on 53 lines, from `:3844` to `:12384`, and
    three `ROUTES.unshift` calls (checked: `:9375`, `:11947`, `:12058`).
34. The HTTP server object and the WebSocket upgrade (`:15066-15067`).
35. **Await: the edition layer** "before accepting requests"
    (`:15071-15072`).
36. Log pruning, the workspace access timer (`:15081-15092`).
37. **Queued words come back** (`:15095-15126`). Each queued message that was
    in dispatch or interrupted becomes a user message again, with a notice.
    It is "never sent to a model a second time".
38. **`server.listen`** (checked: `:15142`). Section 3.6 continues.
39. The tunnel socket and the phone relay (`:15163-15176`).
40. **The signal handlers and the crash guard** (checked: `:15275-15276`).
    These are the last two lines of the file.

Edge cases:

- **Before step 40 there is no SIGTERM handler and no crash guard.** A
  signal during start-up stops the process with no cleanup. An error in a
  top-level `await` is not under the crash guard. Only the exit hook of step
  4 releases the lease (`index.ts:658`).
- **The getters hide the order.** A factory that calls `broadcast` while it
  is built would read `lastSeq` (declared at `:4657`) before it exists, and
  throw. No subagent found such a call. See section 9.

### 3.6 What happens at `server.listen`

The callback runs these steps in order (checked: `index.ts:15142-15160`):

1. `companyRuntimeReady()`, the speed probe, the tailnet share, the log line
   "server on http://127.0.0.1:PORT", the launch probe.
2. Person waits, hand-off requests, the browser sweep, the Cloud team policy
   and roster, app triggers.
3. After the first engine read: the Chrome launcher and the checkpoint
   seeds (`:15146`).
4. **`followupsReady = true`** and the engine updates (`:15147`). Before this
   line, `drainQueuedSends` returns at once (`:7041`).
5. The queued sends and the queued channel sends are drained
   (`:15148-15149`).
6. The Cloud computer power, the upkeep, and the orphan-folder sweep
   (`:15150-15151`).
7. **`await enginesRead`, with no time limit** (`:15152-15154`). If a
   shutdown started meanwhile, the callback stops.
8. Routines, bot waits, check-backs and proactive work start
   (`:15157`). Then the limit clock, burst recovery and memory upkeep
   (`:15158-15159`).

The listen address is `127.0.0.1`. With `OMB_LAN=1` it is `0.0.0.0`, and a
connection from an address that is not private is closed
(`lan-address.ts:53-59`).

**What a client can do before all work is ready:**

- There is no readiness gate in `handleRequest`
  (`index.ts:12405-15064`).
- `/api/health` answers when the socket is bound. With no sign-in it returns
  `{ app: "openmausbot" }` (`:12548-12550`).
- A message sent before step 4 is stored but not sent to an engine. Step 5
  sends it.
- A turn waits only for the read of its own engine (`:7683-7686`, room turns
  `:10037`).
- Routines and the other timers wait for the read of each engine (step 7).

### 3.7 The order of a request

`handleRequest` (`index.ts:12405`) runs these steps (group 1, checked for
the last step):

1. Parse the URL (`:12407-12413`).
2. Public routes before the sign-in check: hosted health, the MCP OAuth
   callback, static files, `.well-known`, email sign-in, pairing
   (`:12418-12527`).
3. The sign-in check, `resolveRequestAuth(...)` (`:12528-12538`).
4. Public `/api/health` and `/api/brand`. Else `401` (`:12548-12555`).
5. Visibility and access refusals (`:12565-12568`), the admin audit
   (`:12571`).
6. The workspace backup routes and the Cloud move routes, outside the table
   (`:12573-12577`).
7. **`dispatchRoutes(ROUTES, ...)`** (checked: `:12583-12584`), with the
   comment "do not add route `if`s below".
8. About 69 older route `if` blocks after the table (`:12586-15052`).
9. `404` (`:15054`). An error becomes `{status, error, code}`
   (`:15055-15060`).

`dispatchRoutes` (checked: `table.ts:30-36`):

- It awaits each handler in order.
- It stops at the first handler that returns a value that is not `PASS`.
- It also stops when the handler wrote headers, even if it returned
  `PASS`.
- It has no `try`. An error goes to the outer `catch` of `handleRequest`.

The order of the table: three `unshift` calls put a team guard, the usage
caps and the move freeze first. Then the four modules of `table.ts`. Then the
pushes in file order (group 1).

The sign-in rules are keyed by path in `server/request-auth.ts`. A route that
is not in `CLIENT_ALLOW` needs the admin scope ("Default deny",
`request-auth.ts:310-531`).

### 3.8 The order of desktop start-up

1. **Single instance** (checked: `main.mjs:186-189`). A second copy exits.
   The first copy focuses its window (`:250-263`).
2. `app.whenReady()` (`:2787`), the start-up cache, the tray (`:2788-2804`).
3. **The splash screen** (`:2806-2814`). It closes after 10 s at most
   (`startup-screen.mjs:78`). Head-start work (the keychain and the proxy)
   runs while it shows.
4. **The data folder and its lease** (`main.mjs:2821-2847`). On a failure the
   app shows an error box and quits.
5. **Secrets** from the keychain (`:2853`). Credential migrations
   (`:2855-2867`).
6. **The server child** (`:2962`, `:1191-1209`):
   1. It tries the ports 8799, 18799 and 28799, two rounds, with a 2.5 s wait
      between the rounds (`desktop-ports.mjs:2`, `main.mjs:1205`).
   2. `utilityProcess.fork(entry, [], { env, stdio })`
      (`main.mjs:1134-1137`). The output goes to `server.log`.
   3. The environment has the data folder, the port, the lease delegation
      and the provider secrets (`:1111-1132`).
   4. The private token goes by `postMessage` when the child starts
      (`:1159-1164`).
7. **The ready check** (checked: `server-boot-probe.mjs:5-7`, `:91-97`):
   - `GET /api/health` every 25 ms for 5 s, then every 500 ms.
   - Ready only when the answer has the right app name, the process id of
     this child, and `static`. Another answer is "foreign owner".
   - The limit is 60 s. When the log shows that the server listens, it gets
     180 s more.
8. On ready, the supervisor marks the server ready and reloads each window
   that showed the error page (`main.mjs:301-320`).
9. The main window comes only after the server is ready (`:3029`).

Error paths:

- A data folder that is not the default fails: the app goes back to the
  default folder and tries again (`main.mjs:2963-2986`).
- The default folder fails: the window shows the error page.
- Each port is used by another program: the error page says so.

### 3.9 One slow or stuck part (changelog section 5)

The changelog row: "One stuck engine check no longer stalls every bot"
(v0.1.114). Section 7 of `changelog.md` says that we follow the reference
here, and cites `harness/registry.ts:71, 228-239`.

What the registry does (checked, except point 5):

1. **Each status read has a 60 s limit** (`registry.ts:71`, `:78-87`). The
   limit stops the wait. It does not stop the probe process.
2. **Callers share a read in progress** (`:228-239`). A read that ended
   less than 3 s ago is used again. A failed read is not used again
   (`:236`).
3. **At start-up, the read waits 5 s or less for one CLI before it starts
   the next** (`:90`, `:265-269`). So one stuck CLI holds back the others
   for 5 s or less.
4. **The start-up read ends only when each engine ends** (`:271`). An engine
   that went from "available" to "unavailable" is read a second time
   (`:272-277`). So `enginesRead` can take about 120 s.
5. **A list of all engines waits for the slowest engine**
   (`registry.ts:514-534`, `Promise.all`). The limit is 60 s.

Where the problem is not solved (checked):

- **No hold-down after a failure.** `read()` stores a reuse entry only after
  a good read (`:466-474`). After a failed read, a `describe()` with no
  `reuse` option starts a new probe (`:456`) and waits up to 60 s again.
  A caller with `reuse` gets the last good read and does not wait
  (`:455-462`). An engine with no good read has nothing to reuse.
- **The hold-down is in another module.** The container probe keeps a
  probe that timed out as "down" for 30 s, and keeps no fast failure
  (`container-runtime-probe.ts:3-6`, `:28-29`). The registry has no such
  rule.
- **`load()` and `createEntry()` have no time limit** (`:153-198`). Each
  entry first awaits `dispose` of the old entry, then `driver.create(...)`.
  Start-up awaits `load()` at `index.ts:1393`. A `create` that never ends
  stops all of start-up.
- **`dispose` has no time limit** (`:587-594`).

Other places where one part waits for another:

| Wait | Limit | Where |
|---|---|---|
| The bot box start | none | `index.ts:720`, `bot-box/boot.ts:31` |
| The registry load | none | `index.ts:1393` |
| Move bots off a removed engine | none seen | `index.ts:2791` |
| The Cloud credit, new folder only | 15 s | `index.ts:2792` |
| The webhook receiver | none seen | `index.ts:9383` |
| The edition layer | none seen | `index.ts:15072` |
| Routines and timers wait for each engine | none | `index.ts:15152-15157` |
| The lease probes of the OS | 5 s or 15 s each, synchronous | `data-dir-lease.mjs:146-148`, `:375`, `:401`, `:443` |
| Desktop: the keychain read and other awaits | none seen | `main.mjs:2853-2873`, `:3024-3029` |
| Desktop: the server start | 60 s, +180 s, for each of 6 tries | `server-boot-probe.mjs:5-7` |

### 3.10 Graceful shutdown

Triggers:

- SIGINT or SIGTERM (checked: `index.ts:15275`).
- A restart that a route asks for: the move freeze (`:9375`), a workspace
  restore (`:11939`), a Cloud reload (`:8755`). These set
  `restartRequested = true` first.

`createGracefulShutdown` (checked: `graceful-shutdown.ts:13-37`):

1. A second call does nothing (`:21-22`).
2. Each cleanup job starts in array order. Then all jobs run at the same
   time: `Promise.allSettled(cleanup.map(...))` (`:29`).
3. This races a time limit of 8 s (`:10`, `:23-27`).
4. Then `exit(code)` runs (`:31-35`).
5. **A failed job is not logged.** `allSettled` keeps its error.

The reason for 8 s (`graceful-shutdown.ts:7-9`): more than the stop path of
an engine (0.5 s, 1.5 s, 1 s) and the browsers (4 s). Less than the wait of
the desktop app and the 10 s default of Docker.

The cleanup jobs (`index.ts:15201-15246`):

1. **Job 1, synchronous:**
   - `followupsReady = false`, `companyShutdown = true`.
   - Close the coordinator, the bot link, the checkpoints. The comment says
     "before any provider is torn down".
   - `noteTurnsCutByShutdown()`.
   - Revoke each turn capability, "before any await".
   - Close the shared computers, phones, live browsers, the desktop viewer,
     the upgrades.
   - Stop the watchdog, the routines, the triggers, the waits, the upkeep.
   - Close the webhook receiver, the tunnel, the tailnet share, the phone
     relay.
2. Job 2: close the phone screens.
3. **Job 3: `await managedDesktop.close(); await registry.disposeAll();`**
   (`:15231`). The engines stop only after the managed desktop closes.
4. Job 4: close the data engine.
5. Job 5: close the browsers.
6. Job 6: stop the live calls.
7. Jobs 7 to 13: flush the profile history, the memory journals, the usage
   ledger, the decision log, the admin activity, the perf data and the bus.
8. Job 14: close the message search.

The exit (checked: `index.ts:15247-15272`):

1. `bus.flushWithin(1_000)`. A timeout or a failure is logged.
2. `sessions.close()`. On a failure: a log line and exit code 1. The next
   start then asks signed-in people to sign in again (`:15255-15257`).
3. `flushLaterSaves()`, `closeMessageDb()`, `mcpOAuth.dispose()`.
4. `markEngineRunClean()`, then `releaseDataDirLeaseAtExit()`. The comment
   says that the next server must not sweep this run.
5. `process.exit(75)` if a restart was asked, else the exit code
   (`restart.ts:2`).

Running turns (checked: `index.ts:15178-15195`):

- `noteTurnsCutByShutdown` adds a failed "restart interrupted" line to each
  busy thread.
- It skips a thread that the coordinator continues after a restart, or that
  the runtime holds. The comment: "a line here, with Retry, would start the
  job a second time".
- `continuesAfterRestart` is true for a running node, and for a queued node
  whose restart rule is "rerun" (`runtime-coordinator.ts:542-547`).

Gaps:

- **The main HTTP server is never closed.** The only `server.close` in
  `index.ts` is for the webhook receiver (checked: `:15227`).
- **The flushes run at the same time as the engines stop.** An event that an
  engine sends while it stops can come after `bus.flush()`. Only the 1 s
  `flushWithin` at the exit gets it.
- **A slow managed desktop uses the 8 s of the engines** (job 3).
- **On Windows, SIGTERM stops the process with no handler.** A test sends an
  IPC message in its place (checked: `acp-shutdown.e2e.test.ts:19-20`).

### 3.11 The crash path

The crash guard (checked: `crash-guard.ts:49-70`, `index.ts:15276`):

1. It listens for `uncaughtException` and `unhandledRejection`
   (`crash-guard.ts:124-126`).
2. It decides:

   | Error | Decision |
   |---|---|
   | More than 10 errors in 60 s | stop the server |
   | A stack overflow, or `ERR_INTERNAL_ASSERTION` | stop the server |
   | An error inside the scope of a turn | fail that turn |
   | A rejection outside a turn | keep running |
   | An exception with a "peer gone" code (`EPIPE`, `ECONNRESET`, ...) | keep running |
   | Another exception | stop the server |

3. "Fail that turn" calls `watchdog.fail(threadId)`. If the turn already
   ended, the decision becomes "stop the server" (`:107-113`).
4. "Stop the server" (`index.ts:15276`):
   1. `companyShutdown = true`.
   2. `noteTurnsCutByShutdown()`.
   3. `registry.disposeAll()`, with a limit of 5 s.
   4. Release the lease and exit with code 70.
   5. A timer of 20 s exits in any case (`crash-guard.ts:52`, `:116-119`).

What a crash loses (group 3):

- Each buffered log: profile history, memory journals, usage ledger,
  decision log, admin activity, perf.
- The newest events of the bus log.
- Saves that wait (`flushLaterSaves`).
- The sessions marker stays, so people that signed in with an account sign
  in again (`sessions.ts:260-282`).
- The engine run is not marked clean. The next start sweeps its processes
  (`index.ts:656`).

**The comment and the code do not agree.** The comment at `index.ts:15276`
and the header at `crash-guard.ts:12-14` say that running turns "stay
running" and that the next start runs them again. But the crash path also
calls `noteTurnsCutByShutdown()`. So a busy thread that the runtime does not
hold gets the failed "restart interrupted" line, and the person must press
Retry. Only the turns that the runtime holds run again.

### 3.12 The data-folder lease

The server and the desktop use one implementation:
`server/data-dir-lease.ts` exports `electron/data-dir-lease.mjs`
(`data-dir-lease.ts:1-11`).

Acquire (`data-dir-lease.mjs:659-713`):

1. Write a candidate file with mode 0600 and fsync it.
2. `linkSync(candidate, lease)` is the atomic claim. The lease file is
   `openmausbot-server.lease` (`:7`).
3. If the file exists, read the owner:
   - Another machine: refuse (`:695-698`).
   - The owner is alive: refuse (`:700-703`).
   - The owner is dead: an election retires it (`:705-707`, `:509-557`).
4. A record that cannot be read fails closed (`:303-319`).

"Alive" needs three checks (`:124-135`, `:337-347`, `:451-459`):

- The owner is not from an earlier boot of the machine.
- The process id answers `kill(pid, 0)`.
- The identity matches: start ticks on Linux, creation time on Windows.

The desktop gives the child a one-use delegation in the environment. The
child deletes the variable and takes a sub-lease (`:586-657`). The desktop
cannot release its lease while the child lease is alive (`:718-731`).

Windows (`:391-474`): there is no boot id. A dead process can still answer
`kill 0`, so the code asks `tasklist` and PowerShell. A creation time that
cannot be read counts as "the owner".

### 3.13 Desktop shutdown and restart

The supervisor (checked: `server-supervisor.mjs:1-14`, `:70-83`):

- It starts the child again only if the child was ready before.
- Waits of 1 s, 2 s and 4 s. The count goes back to zero after 60 s of
  ready time.
- After 3 failures it shows "The bot server stopped" (`main.mjs:327-333`).
- On an always-on home, it waits 5 minutes and starts again, with no end.
- It does not read the exit code (`main.mjs:1171`). So the server's
  "restart me" code 75 counts as a crash and uses one try.

Quit (`main.mjs:3069-3108`):

1. `before-quit` stops the default quit the first time.
2. The supervisor stops the child (`server-supervisor.mjs:116-127`).
3. Other cleanup runs for 2.5 s or less.
4. Then the app quits again.

The stop of the child (checked: `main.mjs:293`, `:342-358`):

- `proc.kill()`, then a wait of 9.5 s: the 8 s of the server and its 1 s
  log flush.
- **No force stop after the wait.** The app logs "server child did not stop
  before desktop exit; retaining the data-directory lease" and quits.
- The next start then refuses the folder while the old child lives
  (`data-dir-lease.mjs:595-598`).

### 3.14 The updater, where it touches start-up and shutdown

The changelog row: "The updater loops, sticks or breaks the window".

1. The first check is 15 s after start, then each hour (`updater.mjs:231-232`).
2. A quiet install runs on macOS and Windows only (`updater.mjs:31-32`).
3. "Quiet" (checked: `update-when-quiet.mjs:78-92`):
   - Fewer than 3 tries for this version.
   - No typing in the app for 30 s.
   - The person is away: the screen is locked, or idle for 10 minutes.
   - No move, lending, talk or backup.
   - The server is not busy.
4. The app asks the server with `GET /api/move/freeze` (10 s limit). This
   only reports `busy()`. It does not stop new turns
   (`routes/move-freeze.ts:44-48`).
5. The app writes a record of the try first (`update-when-quiet.mjs:105`).
   Then `quitAndInstall` (`updater-coordinator.mjs:241-262`).
6. The server stops through the normal quit path (section 3.13). There is no
   separate flush for an update.
7. The single-instance lock is released before the quit, so the new version
   can start (checked: `main.mjs:191-193`).

Guards:

- **Loops:** 3 tries for each version (checked: `update-when-quiet.mjs:13-14`).
- **Stuck:** after 2 minutes, the app shows "Restart is taking longer than
  expected" (`en.json:8549`). It does not try again
  (`updater-coordinator.mjs:264-273`).
- **Window:** a reopen after a quiet install stays hidden only if the window
  was closed, and only within 5 minutes (`update-when-quiet.mjs:15-16`,
  `:46-48`).

Gap (inference of group 5): if the old server child needs more than 9.5 s
to stop, the new version finds its lease. The new version then shows an
error box and quits (`data-dir-lease.mjs:595-598`, `main.mjs:2840-2846`).

## 4. The data

| Data | Where | Owner |
|---|---|---|
| The lease file and its owner record: pid, host, token, created at, boot id, uptime, pid namespace, start ticks, machine id hash | `<data>/openmausbot-server.lease` (`data-dir-lease.mjs:7`, `:662-672`) | Desktop or server |
| The child sub-lease | `<data>/.openmausbot-server-child/` | Server child |
| The reaper records of a dead owner | `.reap-<token>` files, up to 128 generations (`data-dir-lease.mjs:509-557`) | Both |
| The lease delegation | `OPENMAUSBOT_INTERNAL_DATA_DIR_LEASE = v1:<pid>:<token>` in the child environment (`data-dir-lease.mjs:10`) | Desktop |
| The engine run records | `startEngineRecords`, `markEngineRunClean` (`index.ts:656`, `:15261`) | Server |
| The sessions and the "open" marker | `sessions.json` (`index.ts:674-681`, `sessions.ts:302-311`) | Server |
| The engine status of the last run | `<data>/providers/engine-status.json` (`index.ts:801`) | Registry |
| The quiet-install record: from, to, tries, at, window | the updater (`update-when-quiet.mjs:105`) | Desktop |
| The server log | `server.log` in the log folder (`main.mjs:494-503`) | Desktop |

Exit codes (`restart.ts:2`, `:5`): 0 for a normal stop, 75 to ask for a
restart, 70 after a crash, 1 when the sessions could not be saved.

Limits:

| Limit | Value | Where |
|---|---|---|
| Graceful cleanup | 8 s | `graceful-shutdown.ts:10` |
| Bus flush at exit | 1 s | `index.ts:15265` |
| Engine stop at a crash | 5 s | `index.ts:15276` |
| Crash exit in any case | 20 s | `crash-guard.ts:52` |
| Crash storm | 10 errors in 60 s | `crash-guard.ts:49-50` |
| Engine status read | 60 s | `registry.ts:71` |
| Start-up step for one CLI | 5 s | `registry.ts:90` |
| Cloud credit on a new folder | 15 s | `index.ts:2792` |
| Desktop wait for the child to stop | 9.5 s | `main.mjs:293` |
| Server ready check | 60 s, +180 s | `server-boot-probe.mjs:5-6` |
| Restart waits | 1 s, 2 s, 4 s, reset after 60 s | `server-supervisor.mjs:11-12` |
| Quiet-install tries | 3 for each version | `update-when-quiet.mjs:14` |
| File size | listed from 1,000 lines, 2,000 for a file that is not listed | `file-size-ratchet.test.ts:15-16` |

## 5. The UI

Only the desktop app has UI for this feature. The text comes from
`src/locales/en.json`. "The app" replaces the product name in the quotes.

| State | What the person sees | Where |
|---|---|---|
| Start-up | A splash with the app icon, the name, a spinner and "Opening your workspace…". A close button | `startup-screen.mjs:19` |
| Start-up takes long | The splash line can change through `status()` | `startup-screen.mjs:116-117`, `home-window.mjs:321` |
| The server did not start in time | An error page in the main window: "The background server didn't come up in time — this is usually slow startup, not a port conflict. Quit and reopen the app." and "If it keeps happening, check {log}." | `error-pages.mjs:23-33`, `en.json:9842-9843` |
| Each port is used | "Every … port answered health checks from another process …" | `en.json:9841` |
| Always-on home | One more line: "… it keeps trying to start the server every 5 minutes." | `en.json:9844` |
| The chosen folder failed, the default folder works | Error box "The environment was unhealthy" | `error-pages.mjs:40-44`, `en.json:9922-9923` |
| Both folders failed | Error box "… could not start", then the app quits | `en.json:9924-9925` |
| The server crashed 3 times | Error box "The bot server stopped": "Automatic recovery could not restart the background server. … Interrupted chat turns were not resent." | `main.mjs:327-333`, `en.json:9838-9839` |
| A turn cut by a stop | A failed activity line "turn interrupted — the app restarted" in the chat | `index.ts:15184`, `en.json:8553` |
| Queued words cut by a stop | The words come back as a user message, with the notice "Queued follow-up interrupted by restart or restore — it may have already run. Review the result before sending it again." | `index.ts:15095-15124`, `en.json:8563` |
| The update is slow | "Restart is taking longer than expected. Quit and reopen the app to finish the update." | `updater-coordinator.mjs:265-270`, `en.json:8549` |

After the server is ready, the desktop reloads each window that showed the
error page (`main.mjs:312-319`).

## 6. The tests

| Test | What it guarantees |
|---|---|
| `graceful-shutdown.test.ts:6-32` | Two calls start each job one time. The exit waits for each job, then uses code 0 |
| `graceful-shutdown.test.ts:34-51` | A job that never ends: the exit comes at the time limit |
| `crash-guard.test.ts:29-39` | The decision table of section 3.11 |
| `crash-guard.test.ts:54-75` | An error of a running turn stops that turn, and the server stays up. An error of a turn that already ended stops the server with 70 |
| `crash-guard.test.ts:99-121` | A fatal error calls the shutdown one time. 20 s later the process exits. The 11th error in a minute stops the server |
| `crash-guard.test.ts:138-147` | A real process: exit 0 after a turn error, exit 70 after another error |
| `data-dir.test.ts:10-46` | The default folder. A test run with no `OMB_DATA_DIR` refuses the real home folder |
| `data-dir-entry-points.test.ts:32-50` | The same rule for each command-line entry point |
| `data-dir-lease.test.ts:57-179` | Acquire, refuse a second acquire, release, a stolen token, two processes, a dead child, a corrupt record that fails closed |
| `boot-readiness.e2e.test.ts:67-102` | Health answers while an engine probe is held. A message is accepted, and no turn runs until the probe ends |
| `boot-readiness.e2e.test.ts:104-133` | A turn runs when its own engine is read, while another engine is still held |
| `boot-readiness.e2e.test.ts:135-159` | Queued words from the last run are sent before a message of this run |
| `acp-shutdown.e2e.test.ts:11-72` | SIGTERM during a stalled turn: exit 0, and the partial reply is stored and still there after a restart |
| `browser-shutdown.e2e.test.ts:107-163` | SIGTERM closes the browsers of the bots. After SIGKILL, the next start closes only the browsers of the crashed server |
| `file-size-ratchet.test.ts` | A listed file does not grow. A file that is not listed stays under 1,000 lines, or 2,000 |
| `index-route-ratchet.test.ts` | The counts of six path-check strings in `index.ts` do not go up |
| `server-supervisor.node-test.mjs` | A child that dies in its first boot is not started again. A shutdown also stops a child whose probe is in progress |
| `window-all-closed.node-test.mjs:17-61` | The app does not quit before start-up ends |
| `updater-coordinator.node-test.mjs:211-231` | A slow install shows the message and does not try again |

What the ratchets do not catch (group 1):

- The route ratchet counts strings in the whole file
  (`index-route-ratchet.test.ts:19`). It does not see `path === SOME_CONST`
  (8 times), `path.endsWith(` (4 times) or a helper such as
  `isLongPollPath(path)`. A move out and a new route in the same pull
  request pass.
- "Under 1,500 lines" is only in the README. Five listed files are already
  over 2,000 lines: `index.ts` (15,276), `src/state/store.tsx` (3,278),
  `electron/main.mjs` (3,124), `server/store.ts` (2,256),
  `drivers/claude.ts` (2,016).
- No test checks that a module does not import `index.ts`, the order of the
  route table, the `import type` rule, or the order of start-up.
- Ten test files still read `index.ts` as text and cut parts of it, against
  rule 6 (for example `managed-desktop-cleanup.test.ts:9-29`,
  `routes/sign-in.test.ts:85-116`). A loader hook rewrites a line of
  `index.ts` for a test (`server/testing/stall-clock-hooks.mjs:11-21`).

No test that we read covers the full order of start-up, or a stop signal
during start-up.

## 7. Ours compared

### 7.1 What we have now

- `crates/bot-cli/src/main.rs`: an echo loop. It depends on `bot-core`,
  `bot-engine` and `bot-protocol` (ours: `crates/bot-cli/Cargo.toml`).
- `crates/bot-desktop/src/main.rs`: a Tauri app with one command,
  `send_message`, that calls `bot_core::echo_reply` (ours, 12 lines).
- `AGENTS.md`: "`bot-cli` is the only composition root."
- Step 7 of `docs/plan/README.md` has `bot-desktop` connect the crates (PR
  7.3). P26 is open.

### 7.2 Which reference part goes where

| Reference | What it does | Ours |
|---|---|---|
| `server/index.ts:648-15276` (top level) | Builds and connects each part | The composition root: `bot-desktop/src/main.rs` and `bot-cli/src/main.rs` (P26) |
| `server/host/*.ts` (`createX(deps)`) | One concern, explicit deps | One module in `bot-core` or `bot-engine`, with a struct of deps or constructor arguments |
| `server/routes/table.ts`, `server/routes/*.ts` | HTTP routes | Tauri commands in `bot-desktop` (D10). No HTTP server |
| `server/request-auth.ts` | Sign-in and scopes by path | Not needed while there is no listener (D10) |
| `server/graceful-shutdown.ts` | Cleanup jobs with one limit | A shutdown function in the root (`bot-desktop/src/main.rs`, `bot-cli/src/main.rs`), called from the Tauri exit event and from Ctrl-C. The bus flush in `bot-core/src/bus.rs` (PR 7.1) |
| `server/crash-guard.ts` | Fail one turn, or stop | A panic boundary on each turn task in `bot-core/src/runner.rs` (PR 7.2, section 8, point 7) |
| `electron/data-dir-lease.mjs`, `server/data-dir-lease.ts` | One server for each data folder | A lock on the data folder in `bot-core` (`data_dir.rs`, step 6) |
| `electron/single-instance.mjs` | One copy of the app | The Tauri single-instance plugin in `bot-desktop` |
| `server/harness/registry.ts` `load`, `disposeAll` | Builds and stops engines | `bot-engine/src/registry.rs` (step 4) |
| `electron/server-supervisor.mjs`, `server-boot-probe.mjs`, `server-child-launch.mjs` | Start, check and restart the server child | Not needed: the core runs in the desktop process (D10) |
| `electron/updater-coordinator.mjs`, `update-when-quiet*.mjs` | Updates when the person is away | Later. Not in part 1 |

### 7.3 Where we are different

1. **One process, not two.** D10 puts the core in the process of the
   desktop app. So we do not need these parts: the port search, the ready
   check, the lease delegation, the private token, the supervisor. But we
   also lose what the supervisor gave. In the reference, a crash of the
   server leaves the window alive, and the supervisor starts the server
   again. In our design,
   a panic that is not caught stops the window too. This is a new problem
   that we make, not only a simplification.
2. **Two binaries can open one data folder.** `bot-cli` and `bot-desktop`
   can run at the same time on the same folder. So we need the lease of the
   reference, even with one process for each binary.
3. **The order still applies.** Lease, settings, registry, bus, store,
   runtime, then the commands. The reverse at shutdown.
4. **Rust removes the TDZ problem at compile time.** A value that does not
   exist yet cannot be passed. The late-bound getters of the reference
   become a fixed order of construction. A real cycle between two parts
   needs a channel or a trait, and the compiler shows it.
5. **Tauri commands replace the route table.** `generate_handler!` lists
   each command in one place. There is no `PASS` and no order of handlers.

## 8. Where we can be better

Each point has a reason: a wrong state that the compiler refuses, less code,
or a known problem of the reference.

1. **Make the root a list of constructor calls with no logic** (P26).
   Reason: a known problem. The reference root grew to 15,276 lines. About
   7,000 of them mix wiring and logic (section 3.4). Two ratchet tests only
   slow the growth. The reference has two roots in
   practice: the Electron main process builds the desktop parts, and the
   server builds the rest (section 3.1). It also builds a second registry in
   its command line (checked: `server/cli-setup.ts:29`). This is evidence
   for option a and for option b of P26. The author decides.
2. **Take the data-folder lease before the settings load** (step 6.1).
   Reason: a known problem ("State lost at a restart", "Process control on
   Windows"). The reference takes it first (`index.ts:655`). Its process id
   checks caused the Windows bugs of v0.1.83 and v0.1.138. A lock that the
   operating system holds, for example `File::lock` of the standard library,
   ends when the process ends. It needs no process id, no boot id and no
   reaper. Check that our toolchain (1.94.1, D5) has it on each platform
   before the choice.
3. **One shutdown with an order and one time limit.** Reason: known
   problems in the reference (section 3.10):
   - Install the handler first, not on the last line (`index.ts:15275`). A
     stop during start-up then also cleans up.
   - Stop the engines first, then flush the bus. The reference runs the
     flush at the same time as the engine stop.
   - Log each failed step. `allSettled` in the reference keeps the error.
   - Close each listener. The reference never closes its main HTTP server.
4. **Time limits on the registry** (step 4). Reason: a known problem, and
   `changelog.md` section 7 needs a note. Changes:
   - A limit on `create` and on `dispose`. A stuck `create` stops all of
     start-up in the reference (`registry.ts:153-198`, `index.ts:1393`).
   - Keep a failed read for some time. The reference starts a new probe of
     60 s at each list (`registry.ts:456`, `:466-474`). The container probe of the
     reference already does this for 30 s (`container-runtime-probe.ts:6`).
   - Stop the probe at the limit, not only the wait (`registry.ts:78-87`).
5. **Start the timed work when each engine is read, not when all are read.**
   Reason: a known problem. Routines and waits in the reference wait for the
   slowest engine with no limit (`index.ts:15152-15157`). A turn already
   waits only for its own engine (`index.ts:7683-7686`).
6. **Build all parts before the first command.** Reason: a wrong state that
   the compiler refuses. In Rust, the Tauri builder gets the state after
   each part exists. The reference has no readiness gate and uses a flag
   (`followupsReady`, `index.ts:7041`, `:15147`) to hold back the drain.
7. **A panic boundary for each turn, and a crash path that flushes.**
   Reason: a known problem. The crash path of the reference flushes nothing
   (section 3.11). Its comment and its code disagree about which turns run
   again. With one process (D10), a panic in a turn task must fail only
   that turn: `tokio` gives a `JoinError` for a task that panics. The turn
   then gets `turn.completed` with `failed` (D20).
8. **Settings as a value that is replaced, not one object changed in
   place.** Reason: a wrong state that the compiler refuses. The reference
   runs `Object.assign(cfg, loadConfig())` (`index.ts:5108`), and each
   holder sees a half-changed object during the change. A shared
   `Arc<Settings>` that the root swaps gives each reader a whole old or a
   whole new value.
9. **Deps as constructor arguments that name a trait, not a slice of a
   class.** Reason: less code. The reference uses `Pick<Store, ...>` in 79
   modules and `as unknown as XDeps` casts in its tests
   (`host/person-stop.test.ts:8-17`). A Rust trait for the narrow need gives
   a fake for tests with no cast.
10. **Typed errors, not an HTTP status on an `Error`.** Reason: a wrong
    state that the compiler refuses. The reference attaches `status` to an
    `Error` and reads it back by shape (`host/person-stop.ts:76`,
    `routes/reactions.ts:28-31`). `AGENTS.md` asks for typed refusals.
11. **A restart that is not a crash.** Reason: a known problem. The desktop
    of the reference counts exit code 75 as a crash (`main.mjs:1171`). With
    one process this goes away. If `bot-cli` ever runs a server child, it
    must read the code.
12. **Secrets not in a child environment.** Reason: a known problem ("A
    secret in the wrong place"). The desktop of the reference gives provider
    secrets in the environment of the child (`main.mjs:1124-1128`). It moved
    Cloud secrets to a pipe in v0.1.92 (`index.ts:1-2`), but not these. With
    one process (D10), the secret stays in memory. Step 9 starts engine
    processes. The row "The person's own engine config reaches the bots" of
    `changelog.md` section 7 covers their environment.

**Problems of `changelog.md` section 5 that the reference has here:**

| Problem | In this feature | Section |
|---|---|---|
| One slow or stuck part blocks all the others | Partly solved. No limit on `registry.load`, `create`, `dispose`, the bot box start or `await enginesRead`. No hold-down after a failed read | 3.9 |
| State lost at a restart or a crash | The crash path flushes nothing. A turn that the runtime does not hold gets "interrupted", not a rerun. A stop during start-up runs no cleanup | 3.5, 3.11 |
| The updater loops, sticks or breaks the window | Loops: 3 tries. Stuck: only a message. Window: the hidden reopen rule. A server child slower than 9.5 s blocks the new version | 3.14 |
| Process control on Windows | SIGTERM runs no handler. The lease needs `tasklist` and PowerShell | 3.10, 3.12 |
| A secret in the wrong place | Provider secrets in the child environment | 3.8 |
| Tests that fail by chance | Ten tests read `index.ts` as text and break when a marker moves | 6 |

**Corrections for other files** (this file does not change them):

- `changelog.md:215`, row "One slow or stuck part blocks the others": the
  row is correct, but each rule is in a different module. "A check that
  hangs counts as down for a time" is true only for the container probe
  (`container-runtime-probe.ts:3-6`). The registry has the 60 s limit and the
  shared read, but no hold-down (`registry.ts:456`, `:466-474`). The row
  does not say that `load()`, `createEntry()` and `dispose()` have no limit
  (`registry.ts:153-198`, `:587-594`). Step 4 must not take the hold-down as
  a fact of the reference registry.
- `server/routes/README.md:8` in the reference names a model file that does
  not have the model shape (section 3.3). Do not copy that file as a model.

## 9. Not verified

- Which call opens the runtime first at start-up, and so when the restart
  recovery runs relative to `listen` and to the first engine read. The
  runtime opens on the first method call, not when it is built
  (`runtime-coordinator.ts:184-205`). `noteTurnsCutByShutdown` calls
  `coordinator.continuesAfterRestart`, which may open it at shutdown.
- Whether `box.start` (`bot-box/boot.ts:31`), `loadEnterpriseLayer`,
  `listenWebhookIngress` and `registry.readAtStart` have a time limit
  inside.
- Whether `testedAi.settle` and `refreshUnsetModelSelections` on a new
  folder call each engine before they return.
- Whether a factory calls `broadcast` while it is built, which would throw
  on `lastSeq` (`index.ts:4657`).
- Whether a throw in `finish()` (`flushLaterSaves`, `closeMessageDb`) stops
  `process.exit` and leaves the process running.
- Whether SQLite loses data at a crash, and what `bus.flush`,
  `flushWithin` and `closeMessageDb` do inside.
- Whether a probe that passes its 60 s limit leaves its CLI process
  running, so that stuck probes pile up.
- What `utilityProcess.kill()` does on Windows, and whether a child still
  alive stops when the Electron main process exits.
- Whether a turn that starts between the quiet check and `quitAndInstall`
  is protected. It looks unprotected.
- Whether route tests that run `rmSync(DATA_DIR)`
  (`routes/today.test.ts:14`, `routes/jobs.test.ts:19`) can reach a real
  data folder. `data-dir.test.ts` says a test run refuses the real home, but
  the vitest set-up was not read.
- Whether a bare type import really crashes on the Node version of the
  reference. The rule comes from the README and the Node documentation.
- That each `ROUTES.push` runs at module load. No push line starts with an
  `if`, but pushes inside a callback on the same line were not excluded.
- That the list of ten tests that read `index.ts` as text is complete.
- The hunks of the 57-line diff of `index.ts` since `3aec210` that do not
  touch start-up or shutdown were not read.
- About 27 long lines of `electron/main.mjs` were read only in part.
- The bodies of most tests of the lease, the updater, the ready check and
  the child launch. `update-when-quiet.node-test.mjs` and
  `data-dir-lease-windows.node-test.mjs` were not read.
- 53 host files and 10 route files with no factory were counted, not read.
