# Plan: The desktop shell

The proposals from the research file
[`../research/features/desktop-shell.md`](../research/features/desktop-shell.md)
(batch 12, reference commit `42f86aefd`). The steps, the pull requests and
the order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project. Our desktop is Tauri 2 (`crates/bot-desktop`). Under
decision D10 the core runs in the same process as the window.

- **Steps:** P660, P661 and P665 go to step 7. P664 goes to step 6, and
  P666 to step 9. P663 (chat links) goes after step 11, and P662 (the tray)
  with the routines of step 15. P667 and P668 are later.
- **State:** all open. Decide P660 first, with P26: it says how the core
  recovers from a crash, and it blocks PR 7.3.
- **The main finding:** the reference runs its server as a child process of
  Electron. A supervisor restarts a crashed server at 1 s, 2 s and 4 s, then
  shows a native box (`electron/server-supervisor.mjs:11-14`, `:40-46`).
  The start can wait minutes with no message to the person, because each
  try has its own probe time and stop wait
  (`electron/server-boot-probe.mjs:5-7`, `electron/main.mjs:293`). Under D10
  our core runs in the process of the window, so most of the supervisor,
  the port search and the identity probe have no place.

## Proposals

Decide P660 first: it refines D10 and blocks PR 7.3 with P26.

### P660. Decide how the core recovers from a crash (before step 7, with P26)

- Kind: a decision. Option a is better than the reference. Option b follows
  the reference.
- **Problem in the reference:** the supervisor gives up after three tries,
  at 1 s, 2 s and 4 s, and shows a native box "The bot server stopped". Only
  a quit and a new start clear it (`electron/server-supervisor.mjs:11`,
  `:40-46`, `electron/main.mjs:327-333`). A child that does not stop blocks
  each new child (`electron/server-supervisor.mjs:57-58`,
  `electron/main.mjs:1183-1188`). The recovery is not tested on Windows: the
  only end-to-end fixture refuses win32 (`scripts/verify-server-recovery.mjs:222`).
  An interrupted turn is not sent again
  (`docs/verification/desktop-server-recovery.md:45`). The release problem:
  "State lost at a restart or a crash" ("recover the embedded server after a
  crash", v0.1.74, and v0.1.165).
- How the reference works:
  1. `watch(proc)` throws while a child is still owned
     (`electron/server-supervisor.mjs:70-71`).
  2. A new start is scheduled only when the child that exited was ready.
     A child that dies in its first start is not restarted by this path
     (`:82`, test `electron/server-supervisor.node-test.mjs:249-256`).
  3. The budget resets after 60 s of stable uptime (`:12`, `:77`).
  4. In an always-on home it waits 5 minutes and starts again with a full
     budget (`:14`, `:40-43`).
  5. A crash refuses the pending approval-mode requests of the desktop
     (`electron/main.mjs:1168`, `electron/approval-trusted-mode.cjs:365-371`).
- Option a (recommended): keep D10. The core runs in the process. P90
  catches a panic of one turn task and ends that turn as failed. The
  recovery of turns at the next start (changelog.md section 7,
  `server/runtime/runtime.ts:109-158`) takes the place of the supervisor.
  - Why: we remove the port search, the identity probe, the lease hand-off
    between parent and child, and the stuck-child case. These are the parts
    that failed in the release history.
  - Cost: a panic outside a turn task closes the window. The next start
    recovers the turns.
- Option b: follow the reference. The core runs as a child process (a Tauri
  sidecar). A Rust supervisor restarts it at 1, 2 and 4 s. It resets the
  budget after 60 s of stable uptime. It never starts a second child, and it
  shows a dialog at the end.
- Changes: D10 (add the cost of one process and the recovery rule), P26,
  PR 7.3.

### P661. A bounded start that the person can see (step 7)

- Kind: better than the reference.
- **Problem in the reference:** the start of the server can wait about 7
  minutes with no listening line. It can wait about 25 minutes when each
  child prints the line and never answers. The sum (inference from the
  constants): each try costs its probe time and at most the 9.5 s stop
  wait, so 6 x (60 s + 9.5 s) + 2 x 2.5 s = 422 s, and 6 x (240 s + 9.5 s)
  + 5 s = 1,502 s (`electron/server-boot-probe.mjs:5-7`,
  `electron/desktop-ports.mjs:2`, `electron/main.mjs:293`, `:1183-1209`).
  The splash leaves after 10 s (`electron/startup-screen.mjs:78`), and the
  person sees the error page only at the end. The restore of the
  organization, the start place and the updater wait behind the server
  (`electron/main.mjs:2962`, `:3024-3037`). The release problems: "A turn or
  a wait that does not end" (v0.1.15, v0.1.123) and "One slow or stuck part
  blocks all the others" (v0.1.114).
- What:
  1. The window opens at once with a "starting" state.
  2. The root builds the parts with one time limit for the whole start. P88
     gives each part its own limit.
  3. At the limit, the window shows which part did not start, with the path
     of the log.
  4. The window never waits for an optional part.
- Tauri part: the start state is a Tauri event after `Builder::setup`. No
  splash window is needed, because the UI loads from disk and needs no
  server.
- Changes: PR 7.3 and PR 7.5, with P88 and P89.

### P662. The tray and the close rules (later, with the routines of step 15)

- Kind: follows the reference. Judgment call for the step: before the
  routines, no work runs while the window is closed, so a hidden window has
  no use.
- What the reference does:
  1. On Windows a close of the main window hides it in the tray, when the
     shutdown has not started and a tray exists (`electron/main.mjs:1956-1961`).
  2. The tray has a fixed Windows GUID, so the notification-area setting
     stays after a restart (`electron/system-tray.mjs:3-6`). Its menu has
     Open and Quit. A click or a double-click opens the window (`:18-26`).
  3. On Linux the tray has only Open and Quit, and a close quits the app
     (`electron/main.mjs:44`). A lending indicator borrows the one tray icon
     (`electron/system-tray.mjs:33-58`).
  4. macOS has no tray and never quits on close.
  5. Before the start ends, an empty window set does not quit (issue #2028,
     `electron/window-all-closed.mjs:3-18`,
     `electron/window-all-closed.node-test.mjs:49`).
  6. A hidden start (at login, after a quiet update) runs with no window
     (`electron/main.mjs:2805`).
  7. A close of the splash on Windows hides the app. On other platforms it
     quits (`electron/startup-screen.mjs:47-52`).
- Tauri part: the `tray-icon` feature of `tauri`,
  `WindowEvent::CloseRequested`, `RunEvent::ExitRequested` and
  `api.prevent_exit()` (API names not verified).

### P663. Chat links with one typed parser (after step 11)

- Kind: better than the reference.
- **Problem in the reference:** the link is checked in two places: a prefix
  check in main and a strict parse in the page (`electron/chat-link.mjs:6-16`,
  `src/lib/thread-refs.ts:158-207`). A pending link has no time limit and no
  notice when the page never loads or never hydrates
  (`electron/main.mjs:196-215`, `src/hooks/use-external-chat-links.ts:16`).
  Each of the three holding places keeps one link only, so a newer link
  replaces an older one. Copy link gives no "Copied" and no error
  (`src/components/SidebarThreadRow.tsx:437-440`). The release problem: "A
  turn or a wait that does not end" (v0.1.15, v0.1.123), for the wait
  (inference). The two-place parse is a judgment call.
- What the reference does that we keep:
  - `openmausbot://thread/<id>?bot=<owner>` and `openmausbot://bot/<owner>`
    (`src/lib/thread-refs.ts:125-127`, `:186-207`).
  - The owner is strict: a named owner never falls through to the thread of
    another bot (`src/lib/thread-refs.ts:218-231`).
  - A link only navigates. It never sends, stops or makes anything
    (`electron/chat-link.mjs:1-3`).
  - A thread that is not loaded is asked from the server as an exact pair,
    and a 404 shows "That thread is no longer here."
    (`src/components/ThreadRefs.tsx:109-126`).
- What:
  1. One parser in Rust makes an enum
     `ChatLink { Thread { thread, owner }, Bot { owner } }` from the URL. It
     uses the rules of the reference: one encoding only, `bot` is the only
     query key, an id has 256 characters at most and no control characters
     (`src/lib/thread-refs.ts:119-123`).
  2. The window gets only a parsed link.
  3. A held link expires and shows a notice.
  4. Copy link shows "Copied" or an error.
- The scheme name needs a decision. It is the product name, and `AGENTS.md`
  forbids the name of the reference.
- Tauri part: `tauri-plugin-deep-link`, and the deep-link path of
  `tauri-plugin-single-instance` for Windows and Linux (license and API not
  checked).

### P664. A desktop file that cannot be read is never written over (step 6)

- Kind: better than the reference.
- **Problem in the reference:** a corrupt `environments.json`, or one of a
  newer version, reads as an empty list with no warning. The next save writes
  over it (`electron/environments-file.mjs:13-23`,
  `electron/environments.cjs:292-302`). A test pins this behaviour
  (`electron/environments.node-test.mjs:228-229`). The release problem: "A
  file written over after a failed read" (v0.1.103, v0.1.107, v0.1.151).
- What: the rule of changelog.md section 7 ("`save` takes a value that only
  a successful `load` can make") applies to each file of `bot-desktop` too.
  For data that only looks nice, such as the window size
  (`electron/window-state-file.mjs:11-17`), a failed read may give the
  default, but the code states that choice.
- Changes: step 6. Related: P22, P547.

### P665. Commands only for our own page (step 7, PR 7.4)

- Kind: follows the reference. It answers the release problem "A secret or
  an access right in the wrong place" ("Web pages no longer get owner
  access", v0.1.113).
- What the reference does:
  1. One preload gives the full bridge only to the local origin. Another
     origin gets only the `REMOTE_SAFE` keys (`electron/preload.cjs:65-66`,
     `:95-122`).
  2. A call that changes state from a remote page needs a real click
     (`electron/preload.cjs:175-216`).
  3. Main checks each sender again and fails closed until the local origin
     is known (`electron/local-origin.cjs:12-48`,
     `electron/environments.cjs:56-73`).
  4. A contract test keeps the bridge paths of two releases
     (`electron/bridge-contract.json`,
     `electron/preload-contract.node-test.mjs:29-40`).
- What: `capabilities/default.json` names the window `main` and no remote
  URL. A test checks that the capability file gives no command to a remote
  URL. When we add a command, we add it to a capability by name. Our window
  loads no remote page now, so this is a test and a rule, not new code.

### P666. Find the engine CLIs on the PATH of the login shell (step 9)

- Kind: follows the reference, with one change. Judgment call.
- **Problem in the reference:** the first call of `augmentedPath()` returns
  before the login-shell probe ends (`server/env-path.ts:118-125`). A CLI on
  a PATH that only the rc files make (nvm, for example) is not found at the
  first engine check (inference). The desktop has a second probe that keeps
  a failed result for the life of the process (`electron/shell-path.mjs:12-30`,
  inference). The release problem: none proven.
- What the reference does:
  1. The PATH order: folders that the app registered, `OMB_EXTRA_PATH`, the
     inherited PATH, the last login-shell PATH, known folders that exist,
     then the fallback folders of the app last, so the person's own copy
     wins (`server/env-path.ts:127-139`).
  2. The probe runs `$SHELL -l -i -c 'printf "__OMB_PATH__%s__OMB_END__"
     "$PATH"'`, detached. It kills the process group with SIGKILL after 5 s,
     reads at most 1 MiB, and uses the answer only after exit 0 with both
     markers (`server/env-path.ts:142-200`).
  3. It is skipped under tests, in sealed fixtures, on Windows, and when the
     home programs are not trusted (`:121`).
- What: one probe in `bot-engine`, the same as the reference. An engine
  check that does not find a CLI waits for the probe (at most 5 s) and looks
  again. A failed probe can run again.
- Note: `engine-process-lifecycle.md` read `server/env-path.ts` only from
  line 222. This probe is new research.

### P667. A list of host capabilities with the full key set (later)

- Kind: judgment call.
- What the reference does: it has no capability object. The plan
  `docs/superpowers/plans/2026-08-31-05-headless-harness.md` wanted a
  `HostAdapter` with `HostCapabilities`, but `server/host-adapter.ts` was
  never made. The server learns that it has a desktop only from a grant over
  the private utility-process port (`server/desktop-computer.ts:2-6`,
  `:26-47`). Screen preview and dictation have no server-side check
  (`README.md:380-387` is the only source).
- What: when we add computer control, `bot-core` gets a struct of
  capabilities with one field for each capability and no default value.
  `bot-desktop` and `bot-cli` each make it. A test lists all the fields, so
  a new capability cannot default to "supported" (the rule of the plan,
  `docs/superpowers/plans/2026-08-31-05-headless-harness.md:85`).

### P668. One restart policy for a server (later, if `bot-cli` gets a service)

- Kind: better than the reference.
- **Problem in the reference:** the systemd unit has `Restart=always` and
  `RestartSec=3` (`server/service-unit.ts:52-53`). `serve` has its own policy
  that stops after five crashes in a row (`server/restart.ts:9`, `:33-35`).
  systemd then starts it again each 3 s, so a crash loop never ends
  (inference). The release problem: "Memory and the number of processes"
  (v0.1.165, "EAGAIN"), by inference.
- What: if we write a service file, only one layer restarts. Either systemd
  with `StartLimitBurst`, or our own policy and `Restart=no`.

## New facts for open proposals

Each fact goes to the plan file of its proposal when the author decides it.

- **P87 (one shutdown), `docs/plan/composition-root.md`:** the reference
  stops the server with `proc.kill()` and a 9.5 s race, with no second
  signal and no tree kill (`electron/main.mjs:293`, `:342-358`). The
  computer-control driver and the companion stop at the same time, with
  2.5 s (`:3055`, `:3091-3097`). A second SIGINT forces the exit
  (`:3059-3067`). The lease is released at `will-quit` and at `exit`
  (`:3122`, `:3124`), and `release()` throws while a child still holds a
  child lease (`electron/data-dir-lease.mjs:739`).
- **P90 (catch a panic), `docs/plan/composition-root.md`:** after a crash the
  reference refuses the pending approval-mode requests of the desktop
  (`electron/approval-trusted-mode.cjs:365-371`). An interrupted turn is not
  sent again (`docs/verification/desktop-server-recovery.md:45`). Our panic
  handler can do the same: end the turn as failed and refuse its pending
  approvals.
- **P93 (one copy), `docs/plan/composition-root.md`:** the order in
  `second-instance` is: read the links in the command line first, then show
  the tray window, then the last focused window, then a new window
  (`electron/main.mjs:219-225`, `:250-263`, `electron/single-instance.mjs:1-9`).
  On Windows and Linux a chat link comes by this path.
- **P94 (updater rules), `docs/plan/composition-root.md`:**
  - The lock is also released before the relaunch of a Linux package
    install (`electron/updater.mjs:106-111`).
  - The AppImage patch writes the new file over the old one with an atomic
    rename, and waits for the old process to release the lease
    (`scripts/patch-appimage-updater.mjs:1-44`). `release.yml:426-515` does
    not run its smoke test.
  - After an elevated install the state can stay "installing", with only a
    message after 2 minutes (`electron/updater-coordinator.mjs:264-273`,
    `:291`).
  - Linux has no quiet install on quit (`electron/updater.mjs:33`,
    `:230-231`, `:240`).
- **P546 (the lease as a file lock), `docs/plan/environments-and-flags.md`:**
  the Windows liveness probes of the lease are synchronous `execFileSync`
  calls on the main process: `wmic` and `tasklist` with 5 s, PowerShell with
  15 s (`electron/data-dir-lease.mjs:165-167`, `:394`, `:417-420`, `:450`,
  `:459-462`). One probe can freeze the window for up to 15 s (inference).
- **The switch of environment, `docs/plan/environments-and-flags.md`:** the
  switch pauses the supervisor and resumes it in `finally`. `resume()` does
  not bring back a dropped restart (`electron/server-supervisor.mjs:104-114`).
  If no child is left, a revive tries at 1, 2 and 4 s and never forces a
  lease (`electron/environment-switch.mjs:89-105`). The readiness check of
  the switch is a stub, `probeReady: async () => "ready"`
  (`electron/main.mjs:1596`).
- **P41 (Windows process test), `docs/plan/README.md` notes:** the only
  end-to-end recovery fixture refuses win32
  (`scripts/verify-server-recovery.mjs:222`).

## Changes to `docs/decisions.md` after the author decides

1. D10: add the outcome of P660: how the core recovers from a crash, and the
   cost of one process. Reference: `electron/server-supervisor.mjs:11-14`,
   `:40-46`, `:57-58`, `:70-83`, `electron/main.mjs:327-333`.
2. Only if P663 is accepted: a new decision for the name of the link scheme,
   because of the naming rule of `AGENTS.md`. Reference:
   `electron/main.mjs:2851`, `electron-builder.yml:5-7`.
