# Plan: Feature flags and local environments

The proposals from the research file
[`../research/features/environments-and-flags.md`](../research/features/environments-and-flags.md)
(batch 10, reference commit `fcce0b6de`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 6 (the feature flags) and a new step for local environments,
  which does not exist yet. D10 gets a note.
- **State:** all open.
- **The main finding:** the server of the reference reads its data folder
  one time, when the module loads (`server/config.ts:679`). So a switch of
  environment must stop one server process and start another. When a
  rollback failed, the application had no lease and no server until a
  relaunch (`0b2c12707`, v0.1.145). The registry file reads as an empty
  list on any error, and the next save writes that short list over it
  (`electron/environments-file.mjs:21-23`, `electron/main.mjs:1523-1524`).

## Local environments

- **P545 (decision, the environments step). Switch the data folder inside
  one process.** `bot-desktop` asks `bot-core` to close the runtime and the
  store, release the lease, open the new `DataDir`, take its lease and open
  the store. A failure opens the old folder again. The engine processes
  still stop, as in the reference ("Running turns stop.",
  `src/locales/en.json:18`).
  - **Problem in the reference:** a failed rollback "left no lease and no
    server until a relaunch" (`0b2c12707`, v0.1.145). The correction added
    a revive with retries (`electron/environment-switch.mjs:86-105`) on top
    of a supervisor pause and a rollback restart
    (`electron/main.mjs:1565-1615`). On Windows the stop is a kill, and a
    kill writes no deferred save (`electron/main.mjs:346`). The release
    problems: "State lost at a restart or a crash" (v0.1.145) and "Process
    control on Windows".
  - Condition: this holds only if the core runs in the desktop process
    (D10). With a separate core process, we follow the reference.
- **P546 (decision, step 6). An operating-system file lock for the
  lease.** `data_dir.rs` holds an exclusive lock with `fs4`
  (`docs/comparison.md:66`). The system drops the lock when the process
  ends, so there is no process id and no probe. A record next to the lock
  names the host, and a folder whose record names another machine is
  refused.
  - **Problem in the reference:** process probes decide if the owner of the
    lease is alive. A reused process id on Windows needed corrections in
    v0.1.83, v0.1.138 and v0.1.165. One of them took over the lease of a
    live owner, so two servers used one folder (`c18fe85e5`). The probes
    block the main thread for up to 15 s
    (`electron/data-dir-lease.mjs:164-167`, `:420`). The release problem:
    "Process control on Windows" (v0.1.83, v0.1.138, v0.1.165).
  - What we give up: an advisory lock is not reliable on NFS or SMB. The
    host record keeps the check of the reference for a shared folder
    (`electron/data-dir-lease.mjs:124-130`, `:271-294`).
- **P547 (plan, the environments step, new facts for P76). A failed read of
  a list file never leads to a save over it.** `save` takes a value that
  only a successful `load` can make. A damaged or newer file gives a typed
  error, and the person is told. The write uses `atomic.rs` (step 6.3).
  - **Problem in the reference:** `environments.json` reads as an empty
    list on any error, with no log (`electron/environments-file.mjs:21-23`),
    and the next save writes the short list
    (`electron/main.mjs:1523-1524`). A file from a newer version reads as
    empty too (`electron/environments.cjs:301-302`). So a downgrade loses
    every named environment at the first save. `profiles.json` has the same
    fault (`electron/local-profiles.mjs:45-52`, `:82-87`). The release
    problem: "A file written over after a failed read" (v0.1.103, v0.1.107,
    v0.1.151).
- **P548 (plan, the environments step). A time limit on the switch and on
  the wait for work.** The switch is one function with one deadline. At the
  limit it stops the turns as a quit does, or refuses with a typed reason.
  - **Problem in the reference:** the switch has no overall limit. The
    stop, the start, a rollback start and the revive add up to minutes
    (`electron/main.mjs:293`, `:1174-1181`, `:1630-1642`). The wait of a
    profile switch asks the server each second with no limit, and a failed
    request counts as "not busy" (`electron/local-profiles.mjs:152-165`).
    The release problem: "A turn or a wait that does not end" (v0.1.15,
    v0.1.123, v0.1.151).
- **P549 (plan, the environments step). One record of where the
  application runs.** One `running` value, saved in the same step that
  opens the folder. A newer click cancels the older switch before it opens
  anything.
  - **Problem in the reference:** the folder that runs and the active
    identifier are two values (`electron/main.mjs:270-271`). A background
    switch skips the save of the active identifier (`:1616`). After a
    restart, the application can open another folder than the one that
    ran. The release problem: "State lost at a restart or a crash".
- **P550 (plan, new facts for P61 and P504). Each environment starts from a
  list of allowed variables.** The engine homes of the default accounts go
  under the `DataDir`. The person's own engine setup is a setting of the
  environment, off by default.
  - **Problem in the reference:** the server of every environment gets all
    of `process.env` of the desktop (`electron/main.mjs:1113`). The default
    Claude account uses the `~/.claude` of the person, outside the data
    folder. So "API keys are isolated per environment"
    (`docs/plans/local-environments.md:29-31`) is true only for named
    accounts. The release problem: "The person's own engine config reaches
    the bots" (v0.1.104, v0.1.170, v0.1.175).
- **P551 (choice, the environments step). One mechanism for more data
  folders on this computer.** The author decides if we build local
  environments, and which name and entry point we keep.
  - **Problem in the reference:** two lists exist side by side. Named
    environments are in `environments.json` (`electron/environments.cjs:5`).
    Profiles are in `profiles.json`, with at most 20 profiles
    (`electron/local-profiles.mjs:20-22`). The second mechanism reversed the
    design rule "never say workspace" (`50df92437`), and the documents
    describe only the first. The release problem: "A feature added, then
    removed or reversed" (section 6, "Where the data is").
- **P557 (plan, the environments step). The person sees the cause of a
  failed switch, create or forget.** The typed refusal of `bot-core` goes
  to the UI as a key with its own text, in one place.
  - **Problem in the reference:** each action shows one text for every code
    (`locked`, `busy`, `purge` and others)
    (`src/components/ConnectedWorkspacesSettings.tsx:110`, `:127`, `:142`).
    A failed switch can show two messages (`electron/main.mjs:1561-1564`).
  - Judgment call: no release names this.
- **P558 (plan, the environments step). Forget refuses before it acts, and
  says when files stay.** Check each refusal first. Return `kept_files`
  when the folder stays. Refuse a folder that holds the default folder.
  - **Problem in the reference:** forget stops computer sharing before it
    can refuse (`electron/main.mjs:1882`, `:1887-1900`). A purge that the
    guard skips still returns `ok: true` (`:1902-1908`). A new environment
    whose folder holds the default folder is accepted
    (`electron/environments.cjs:418`).
  - Judgment call: no release names this.
