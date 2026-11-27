# The desktop shell

The record of the desktop shell of the reference project. It shows how the
shell starts, shows its loading screen and hides in the tray. It shows how the
shell restarts a crashed server, connects to a saved server and opens a chat
from a link. It also covers Linux, and what a computer with no desktop
session cannot do.

- Reference: the reference project at commit `42f86aefd` (2026-11-27). It
  includes the release v0.1.184. Each path below is relative to its clone.
- Row of [`reference-features.md`](../reference-features.md): the desktop
  shell (`startup-tray.md`, `desktop-server-connection.md`,
  `desktop-server-recovery.md`, `desktop-chat-links.md`, `linux-desktop.md`
  and the host adapter of `2026-08-31-05-headless-harness.md`). Part 29 of
  [`README.md`](../README.md).
- Step of [`../../plan/README.md`](../../plan/README.md): none yet. The start
  and the stop of the server touch step 7.
- Method: eight subagents (Opus 5.5) read eight groups of files completely.
  The lead checked 27 key claims against the code at `42f86aefd`. All 27
  agree. Section 9 lists what is not verified.

**What this file adds to earlier research.**

- [`composition-root.md`](composition-root.md) has the start and the stop of
  the server by the desktop and the 9.5 s stop wait. This file does not do
  them again. It adds the tests of the supervisor and of the boot probe, and
  the real Electron fixture. It also adds the pause and resume of the
  supervisor, and what the person sees. composition-root read the reference at `ed8cb7278`. Since then
  `electron/data-dir-lease.mjs` (823 to 864 lines), `electron/main.mjs` and
  `electron/server-status.mjs` changed. This file cites only lines read at
  `42f86aefd`.
- [`engine-process-lifecycle.md`](engine-process-lifecycle.md) has the engine
  processes and the `.cmd` shims of `server/env-path.ts`. This file adds the
  login-shell PATH probe (`server/env-path.ts:118-200`), which that file did
  not read.
- [`security-model.md`](security-model.md) has the loopback trust, the owner
  header (`electron/desktop-server-auth.cjs`, `electron/server-session.mjs`)
  and the sign-in of the CLI. This file adds how the preload gives each page
  origin a different bridge (`electron/preload.cjs`), which that file did not
  read.
- [`environments-and-flags.md`](environments-and-flags.md) has the switch of
  local environments. This file adds the pause and resume of the supervisor
  during a switch, and the readiness check of a switch that is a stub.

## 1. In short

The reference project is an Electron app. Electron runs one **main
process** (Node code that owns the windows) and one **renderer** for each
window (the web page). The bot server is a separate **utility process**: a
Node child that Electron starts with `utilityProcess.fork`. The main process
talks to the server child over HTTP on a loopback port. It also uses a
private message port that only the parent can write to.

The shell does six things:

1. **The loading screen and the tray.** At start, a small frameless window
   (the **splash**) shows the app icon and a status line. The main window
   appears when its page draws its first content, when its renderer
   crashes, or after 10 s. On Windows a close of the window hides it in the
   **tray** (the icon area of the task bar). On Linux the tray icon has only
   Open and Quit. macOS has no tray.
2. **Recovery of the bundled server.** A **supervisor** watches the server
   child. When a child that was ready crashes, it starts a new one after 1 s,
   2 s and 4 s. After three failures it shows a native error box and stops.
   It never starts a second child while the old child is still alive.
3. **The server connection.** The desktop always starts its own local
   server. It can also show a **saved server** (a remote server that the
   person added by address or by a **pairing link**). A saved server is a
   page from another origin, so it gets only a safe part of the bridge.
4. **Chat links.** A link `openmausbot://thread/<thread-id>?bot=<bot-id>` or
   `openmausbot://bot/<bot-id>` opens one chat in the desktop app. The main
   process checks only the prefix. The page checks the link strictly.
5. **Linux.** The supported target is Ubuntu 24.04 x64. The `.deb` is the
   recommended package. An AppImage is also built. The `.rpm` is a community
   package. A `.pacman` is "built locally only, never tested"
   (`docs/linux-desktop.md:31-38`, `:116-118`). The builder targets only
   AppImage, deb and rpm (`electron-builder.yml:212-219`). Install hooks fix the sandbox of the
   bundled browser and load an AppArmor profile. NVIDIA computers use
   software rendering.
6. **A computer with no desktop.** The headless plan wanted a
   `HostAdapter` with a list of capabilities. That was never built. The
   server learns that it has a desktop only when the desktop app sends it a
   **grant** over the private message port. `openmausbot serve` is plain
   Node and never gets the grant, so computer control is unavailable there.

Special terms:

- **CSP (Content Security Policy):** a rule in a page that says which
  scripts, styles and addresses the page may load.
- **StatusNotifierItem:** the protocol that Linux desktops use for tray
  icons.
- **COSMIC:** a Linux desktop. Its Wayland session does not send the
  `ready-to-show` event of Electron.
- **AppArmor:** a Linux security module. A profile allows or refuses
  actions to one program.
- **`pkexec`:** a Linux program that runs one command as root after a
  password prompt.
- **foreign-owner:** the result of the boot probe when a process answers on
  the port but is not the child that the app started.
- **Lease:** a file in the data folder that says which process owns the
  folder. The parent holds one lease, and it gives its child a one-time
  capability to take a child lease (`electron/data-dir-lease.mjs:10`).
- **Always-on home:** a mode where this computer is the home of the
  person's bots. The supervisor then never gives up: it waits 5 minutes and
  starts again.
- **Place:** an item of the saved list: the local server, a named local
  folder, or a remote origin. The code calls the list "environments".
- **Hidden start:** a start at login, or after a quiet update, with no
  window.

Our desktop is Tauri 2 (`crates/bot-desktop`), not Electron. Under decision
D10 our core runs in the same process as the window. So we have no server
child, no supervisor and no port search. Section 7 names the Tauri part for
each reference part.

## 2. Files read completely

The paths are relative to the reference clone. A file over about 1,500 lines
was read in ranges, and all ranges together cover the file.

**The main process and the start**

| File | Lines | Ranges |
|---|---|---|
| `electron/main.mjs` | 3,124 | 1-400, 400-800, 800-1149, 1149-1448, 1448-1778, 1778-2107, 2107-2406, 2406-2705, 2705-3124 |
| `electron/boot.mjs` | 19 | all |
| `electron/boot-head-start.mjs` | 16 | all |
| `electron/boot-head-start.node-test.mjs` | 38 | all |
| `electron/main-compile-cache.mjs` | 36 | all |
| `electron/main-compile-cache.node-test.mjs` | 53 | all |
| `electron/main-navigation.node-test.mjs` | 23 | all |
| `electron/startup-cache-eviction.mjs` | 66 | all |
| `electron/startup-cache-eviction.node-test.mjs` | 108 | all |
| `electron/updater-handoff.electron.test.mjs` | 58 | all |

**The loading screen, the tray and the windows**

| File | Lines |
|---|---|
| `electron/startup-screen.mjs` | 119 |
| `electron/startup-screen-preload.cjs` | 6 |
| `electron/startup-tray.node-test.mjs` | 284 |
| `electron/system-tray.mjs` | 61 |
| `electron/lending-indicator.mjs` | 122 |
| `electron/single-instance.mjs` | 16 |
| `electron/single-instance.node-test.mjs` | 84 |
| `electron/window-all-closed.mjs` | 18 |
| `electron/window-all-closed.node-test.mjs` | 61 |
| `electron/window-state.cjs` | 97 |
| `electron/window-state-file.mjs` | 58 |
| `electron/window-state.test.mjs` | 48 |
| `electron/error-pages.mjs` | 57 |
| `electron/error-pages.node-test.mjs` | 52 |
| `electron/menu.mjs` | 150 |
| `electron/menu.test.mjs` | 181 |
| `electron/native-language.node-test.mjs` | 105 |
| `electron/desktop-prefs.mjs` | 237 |
| `scripts/verify-startup-tray.mjs` | 107 |
| `scripts/testing/one-workspace-fixture.ts` | 751 (1-200, 200-480, 481-751) |
| `docs/verification/startup-tray.md` | 32 |

**The recovery of the server**

| File | Lines |
|---|---|
| `electron/server-supervisor.mjs` | 130 |
| `electron/server-supervisor.node-test.mjs` | 549 (1-280, 280-549) |
| `electron/server-boot-probe.mjs` | 101 |
| `electron/server-boot-probe.node-test.mjs` | 342 |
| `electron/server-child-launch.mjs` | 14 |
| `electron/server-child-launch.node-test.mjs` | 240 |
| `scripts/desktop-server-entry.mjs` | 49 |
| `electron/data-dir-lease.mjs` | 864 (1-300, 300-600, 600-864) |
| `electron/desktop-ports.mjs` | 2 |
| `scripts/verify-server-recovery.mjs` | 248 |
| `docs/verification/desktop-server-recovery.md` | 46 |

**The server connection**

| File | Lines |
|---|---|
| `electron/server-address.mjs` | 196 |
| `electron/server-address.node-test.mjs` | 132 |
| `electron/tailnet.mjs` | 108 |
| `electron/saved-server.mjs` | 54 |
| `electron/saved-server.d.mts` | 6 |
| `electron/saved-server.node-test.mjs` | 62 |
| `electron/server-session.mjs` | 72 |
| `electron/server-session.node-test.mjs` | 86 |
| `electron/desktop-server-auth.cjs` | 16 |
| `electron/desktop-server-auth.node-test.mjs` | 25 |
| `electron/desktop-workspace.cjs` | 275 |
| `electron/desktop-workspace.node-test.mjs` | 330 |
| `electron/desktop-viewer.cjs` | 36 |
| `electron/environments.cjs` | 508 |
| `electron/environments.node-test.mjs` | 490 (1-250, 250-490) |
| `electron/environments-file.mjs` | 39 |
| `electron/environment-switch.mjs` | 105 |
| `electron/environment-switch.node-test.mjs` | 273 |
| `electron/local-origin.cjs` | 50 |
| `electron/local-origin.node-test.mjs` | 68 |
| `electron/server-probe.mjs` | 171 |
| `electron/server-probe.d.mts` | 28 |
| `electron/server-probe.node-test.mjs` | 154 |
| `electron/server-status.mjs` | 149 |
| `electron/server-status.d.mts` | 12 |
| `electron/server-status.node-test.mjs` | 162 |
| `electron/preload.cjs` | 870 |
| `electron/preload.node-test.mjs` | 218 |
| `electron/preload-contract.node-test.mjs` | 40 |
| `electron/bridge-contract.json` | 297 |
| `electron/cloud-rail.mjs` | 308 |
| `src/components/RemoteComputerSection.tsx` | 233 |
| `src/components/RemoteComputerSection.test.ts` | 117 |
| `src/components/ConnectedWorkspacesSettings.tsx` | 169 |
| `src/components/ConnectedWorkspacesSettings.test.ts` | 209 |
| `src/components/DesktopWorkspaceSwitcher.tsx` | 160 |
| `src/components/DesktopWorkspaceSwitcher.test.ts` | 94 |
| `src/components/DesktopWorkspaceSwitcher.home.test.ts` | 77 |
| `src/components/ServerList.tsx` | 128 |
| `src/components/ServerList.test.ts` | 138 |
| `src/components/PlaceAddSheet.tsx` | 319 |
| `src/lib/saved-servers.ts` | 6 |
| `src/lib/devices.ts` | 345 |
| `scripts/verify-server-connection.mjs` | 347 |
| `docs/verification/desktop-server-connection.md` | 226 |

**Chat links**

| File | Lines |
|---|---|
| `docs/desktop-chat-links.md` | 57 |
| `electron/chat-link.mjs` | 24 |
| `electron/chat-link.node-test.mjs` | 45 |
| `electron/app-link.mjs` | 39 |
| `electron/app-link.d.mts` | 9 |
| `electron/app-link.node-test.mjs` | 58 |
| `electron/app-launches.mjs` | 49 |
| `electron/local-app-windows.mjs` | 166 |
| `electron/local-app-windows.node-test.mjs` | 204 |
| `src/hooks/use-external-chat-links.ts` | 34 |
| `src/hooks/use-external-chat-links.test.ts` | 166 |
| `src/lib/thread-refs.ts` | 435 |
| `src/lib/thread-refs.test.ts` | 290 |
| `src/lib/replace-url.ts` | 4 |
| `src/components/ThreadRefs.tsx` | 164 |
| `src/components/ThreadRefs.test.ts` | 289 |
| `src/local-app-window.tsx` | 30 |
| `src/components/SidebarThreadRow.tsx` | 506 |
| `src/components/SidebarThreadRow.test.ts` | 864 |

**Linux**

| File | Lines |
|---|---|
| `docs/linux-desktop.md` | 424 |
| `electron-builder.yml` | 279 |
| `build/linux-after-install.sh` | 211 |
| `build/linux-after-remove.sh` | 70 |
| `build/linux-openmausbot-browser.apparmor` | 8 |
| `scripts/linux-after-install.test.mjs` | 392 |
| `scripts/after-pack.mjs` | 156 |
| `scripts/verify-linux-package.mjs` | 592 |
| `scripts/smoke-linux-package.mjs` | 597 |
| `scripts/run-linux-package-smoke.mjs` | 157 |
| `scripts/smoke-linux-update.mjs` | 161 |
| `scripts/smoke-deb-command.mjs` | 113 |
| `scripts/smoke-deb-upgrade.mjs` | 111 |
| `scripts/patch-appimage-updater.mjs` | 72 |
| `.github/workflows/package-linux.yml` | 148 |
| `electron/linux-gpu.mjs` | 18 |
| `electron/linux-gpu.node-test.mjs` | 42 |
| `src/lib/software-rendering.ts` | 4 |
| `electron/shell-path.mjs` | 30 |
| `electron/shell-path.node-test.mjs` | 40 |
| `server/env-path.ts` | 472 |
| `server/env-path.test.ts` | 978 (1-500, 500-978) |
| `electron/updater.mjs` | 251 |
| `electron/updater-coordinator.mjs` | 341 |
| `electron/elevated-install.mjs` | 136 |
| `electron/elevated-install.node-test.mjs` | 218 |
| `electron/package-install-command.mjs` | 56 |
| `electron/package-install-command.node-test.mjs` | 208 |
| `electron/terminal-launch.mjs` | 51 |
| `electron/terminal-launch.test.mjs` | 69 |

**The headless host**

| File | Lines |
|---|---|
| `docs/superpowers/plans/2026-08-31-05-headless-harness.md` | 220 |
| `server/desktop-computer.ts` | 70 |
| `server/desktop-computer.test.ts` | 100 |
| `server/local-computer.ts` | 435 |
| `server/local-computer.test.ts` | 361 |
| `server/harness-capabilities.ts` | 60 |
| `server/restart.ts` | 50 |
| `server/cli.ts` | 1,052 |
| `server/headless/main.ts` | 242 |
| `server/headless/main.test.ts` | 88 |
| `server/headless/args.ts` | 274 |
| `server/headless/args.test.ts` | 93 |
| `server/headless/commands.ts` | 236 |
| `server/headless/host-doctor.ts` | 323 |
| `server/headless/host-doctor.test.ts` | 195 |
| `server/headless/saved-servers.ts` | 191 |
| `server/headless/saved-servers.test.ts` | 103 |
| `server/service-unit.ts` | 322 |
| `server/service-cli.ts` | 192 |

**Read in part only.** `server/index.ts` (lines 748, 1405, 1468-1480,
5955-6030, 11951, 12149, 12524-12526, and search hits), `README.md`
(325-338, 378-420, 463-470, 493-542), `electron/approval-trusted-mode.cjs`
(330-384), `electron/capabilities.cjs` (15-32), `src/styles.css`
(1828-1840), `src/state/store.tsx` (around 2742 and 2774),
`src/lib/copy-text.ts` (1-80), `electron/cloud-rail.node-test.mjs`
(170-192, 350-375), `.github/workflows/release.yml` (426-600),
`src/locales/en.json` (the keys that this file quotes).

## 3. How it works

### 3.1 The start of the app

1. `electron/boot.mjs:8-17` turns on the Node compile cache, then imports
   `main.mjs`. The cache is written after 10 s, because a crash or a Windows
   kill skips the write at exit (`electron/main-compile-cache.mjs:19-33`). It
   is off for an AppImage and for a translocated macOS app (`:14-16`).
2. At module load, `main.mjs` asks for the single-instance lock. A second
   copy logs "already running" and calls `process.exit(0)`
   (`electron/main.mjs:186-189`).
3. The `open-url` listener (macOS links) is set at module load
   (`electron/main.mjs:245-248`). No top-level `await` comes before it, so a
   link at a cold start is not lost.
4. When Electron is ready, the web cache is cleared one time for each app
   version, before any window (`electron/startup-cache-eviction.mjs:33-66`,
   `electron/main.mjs:2788-2793`).
5. On Windows and Linux, the tray is made in a `try`. If it fails, the app
   logs "system tray unavailable" and continues (`electron/main.mjs:2794-2804`).
6. `hiddenStart` is true after a start at login or a quiet update
   (`electron/main.mjs:2805`). A hidden start makes no splash.
7. Otherwise the splash opens (`electron/main.mjs:2806`), and the main
   process waits for its `ready` (`:2814`). `ready` comes at 10 s at the
   latest (`electron/startup-screen.mjs:78`). It comes earlier on show,
   close, renderer crash or load failure.
8. The boot folder is chosen (`electron/main.mjs:2822-2832`), then the lease
   is taken (`:2833-2848`). If the lease fails, an error box shows and the app
   quits.
9. The keychain read and the proxy lookup start early and run at the same
   time (`electron/boot-head-start.mjs`, `electron/main.mjs:292`). The
   credentials wait (`take("credentials")`, `:2853`) has no time limit.
10. The scheme `openmausbot` is registered, in a packaged app only
    (`electron/main.mjs:2851`).
11. `await startServerPackaged()` starts the server (`electron/main.mjs:2962`).
    The restore of the organization, the start place and the updater wait
    for it (`:3024-3037`).
12. `.finally(settleStartup)` ends the start (`electron/main.mjs:3047`).
    From now on, a close of the last window can quit the app.

Error paths and limits:

- The `whenReady` chain has only `.finally`, and `main.mjs` has no
  `unhandledRejection` handler (search). What Electron does with that
  rejection is not verified.
- The splash never waits more than 10 s. The rest of the start is in
  sequence, behind the start of the server.

### 3.2 The start of the server (what this file adds)

composition-root.md has the full flow. The facts below are the limits and
the edge cases, read at `42f86aefd`.

1. The ports are 8799, 18799 and 28799 (`electron/desktop-ports.mjs:2`).
   `startServerPackaged` tries each port, in two passes, with 2.5 s between
   the passes (`electron/main.mjs:1191-1209`).
2. For each port, `startServerOn` forks the child and polls
   `/api/health` (`electron/server-boot-probe.mjs`). Polls run each 25 ms in
   the first 5 s, then each 500 ms (`:1-3`).
3. The probe allows 60 s. When the child prints the line
   `openmausbot server on `, it allows 180 s more, 240 s in total (`:5-7`,
   `:68`). Each fetch stops at the time that is left (`:76-78`).
4. The child must answer `{app: "openmausbot", pid: <its pid>, static}`.
   Any other answer is "foreign-owner" at once (`:91-97`). The pid is read
   late, because `utilityProcess` sets it only on the `spawn` event
   (`:89-90`).
5. If the probe fails, the child is stopped with the 9.5 s wait. If it does
   not stop, the result is `abort` with the reason "stuck-child", and no other
   port is tried (`electron/main.mjs:1183-1188`, `:1201`).
6. If each port answered as "foreign-owner", the error page says that the
   ports are taken (`electron/main.mjs:1208`, `electron/error-pages.mjs:23-34`).

The worst case (inference from the constants). Each try costs at most its
probe time and the 9.5 s stop wait. A child that does not stop in 9.5 s ends
the start with `abort`, so 9.5 s is the upper bound of the stop.

- With no listening line: 6 x (60 s + 9.5 s) + 2 x 2.5 s = 422 s, about 7
  minutes.
- When each child prints the line and never answers: 6 x (240 s + 9.5 s) +
  5 s = 1,502 s, about 25 minutes.

In that time the splash is gone after 10 s, and the window shows the error page
only at the end.

### 3.3 The loading screen and the hand-over

1. The splash is a 440 x 300 frameless, sandboxed window. Its page is an
   inline HTML string with a strict CSP and the app icon as base64
   (`electron/startup-screen.mjs:8-9`, `:28-37`). There is no HTML file.
2. On COSMIC Wayland, `ready-to-show` never comes. The splash then shows
   500 ms after the page loads (`:63-67`).
3. `status(text)` sets the status line before and after the page loads. It
   does nothing after the splash is disposed.
4. The main window is revealed one time, at the first of these (`:82-115`):
   - `#root` gets its first child (the React app drew).
   - the main renderer crashes (the person then sees the recovery page).
   - 10 s pass.
5. If the person closed the splash during the start, the main window stays
   hidden and off the task bar until the tray Open. A minimized splash keeps
   the main window minimized. A quit in progress never reveals it (`:84`,
   `:100`).
6. The splash is destroyed only when the main window exists, because it is
   the only window. A destroy before that would end the app (`:70`).
7. A close of the splash on Windows hides the app in the tray. On other
   platforms it quits the app (`:47-52`). The close button of the page asks
   main through IPC `startup-screen:close`, because `window.close()` of a page
   skips the cancellable close path (`:53-56`).

### 3.4 Windows, the tray and the quit

1. **Close to tray, Windows only.** The `close` event of the main window is
   cancelled and the window is hidden, when the shutdown has not started and
   a tray exists (`electron/main.mjs:1956-1961`).
2. **The tray.** It has a fixed Windows GUID, so the notification-area
   setting of the person stays after a restart (`electron/system-tray.mjs:3-6`).
   The menu has Open and Quit. A click or a double-click opens the window
   (`:18-26`). Open restores a minimized window, shows it and focuses it. The
   hidden flag is in memory only (`:7`).
3. **Linux tray.** A StatusNotifierItem goes only to the first tray. So the
   lending indicator borrows the same icon (class `Borrowed`,
   `electron/system-tray.mjs:33-58`, `electron/main.mjs:1483`). On Linux the
   tray has only Open and Quit, because not each desktop shows it, and a
   close quits the app (`electron/main.mjs:44`).
4. **window-all-closed.** macOS never quits. On other platforms the app
   quits only after the start has settled, and not after a hidden start or
   in an always-on home (`electron/window-all-closed.mjs:3-18`). The test of
   issue #2028 covers a quit during the start
   (`electron/window-all-closed.node-test.mjs:49`).
5. **A second start.** The second copy exits (step 3.1.2). The first copy
   gets `second-instance` (`electron/main.mjs:250-263`). It reads the links
   in the command line, then `revealForLink` tries the tray, then shows the
   last focused window, then opens a window (`:219-225`).
6. **before-quit** (`electron/main.mjs:3069-3108`):
   1. It sets `desktopShutdownStarted` and closes the subsystems.
   2. It cancels the quit and calls `serverSupervisor.shutdown()`. That stops
      the server with the 9.5 s limit.
   3. At the same time it stops the computer-control driver and the
      companion with a 2.5 s limit (`:3055`, `:3091-3097`).
   4. When both end, it calls `app.quit()` again.
7. The lease is released at `will-quit` and at process `exit`
   (`electron/main.mjs:3122`, `:3124`). `release()` throws while a child
   still holds a child lease (`electron/data-dir-lease.mjs:739`). The quit
   log then says "retaining the data-directory lease" (`electron/main.mjs:3097`).
8. The first SIGINT or SIGTERM quits normally. A second one forces the exit
   (`electron/main.mjs:3059-3067`).
9. **Window size.** `window-state.json` keeps the normal bounds and the
   maximized flag (`electron/window-state-file.mjs:18-30`). The save runs
   250 ms after the last move or resize, and at close. The write goes to a
   temporary file with mode 0600, then a rename. At start the bounds go to
   the display that they overlap most. A window on a removed display is
   centred on the primary display. The size is between 840 x 620 and the
   display size (`electron/window-state.cjs:40-84`).
10. **The menu.** Electron 43 gives English labels to role menus, so
    `electron/menu.mjs:7-66` writes each role menu out with translated
    labels. A Server menu lists the places (`:87-150`). On Windows the quit
    item says "Exit" or "Quit", by the Open at Login setting (`:10`, `:143`).

### 3.5 Recovery of the bundled server

1. `watch(proc)` throws "Cannot replace an owned server child" while a child
   is still owned, or after the shutdown (`electron/server-supervisor.mjs:70-71`).
2. On the exit of the current child (`:72-83`):
   - a late exit of an old child does nothing.
   - the budget resets only when the child was ready for 60 s or more
     (`:12`, `:77`).
   - `onUnavailable()` runs at once.
   - a new start is scheduled **only if the child was ready**. A child that
     dies during its first start is not restarted by this path (`:82`, and the test
     `electron/server-supervisor.node-test.mjs:249-256`).
3. The delays are 1 s, 2 s and 4 s (`:11`, `:38-39`). Each failed probe
   uses one entry.
4. When the budget is spent (`:40-46`):
   - in an always-on home, it waits 5 minutes and starts again with a full
     budget (`:14`, `:40-43`).
   - else `onExhausted()` shows the native box "The bot server stopped". Its
     text says to quit and reopen, and that interrupted chat turns were not
     sent again (`electron/main.mjs:327-333`, `src/locales/en.json:10040-10041`).
     The supervisor has no reset. Only a new start of the app clears it.
5. A start that throws, or returns `abort`, while a child is still owned
   never forks another child (`electron/server-supervisor.mjs:57-58`).
6. `startLater` keeps trying a first start that failed, but only in an
   always-on home (`:85-102`, `electron/main.mjs:2987`).
7. `pause()` drops a queued restart. `resume()` does not bring it back
   (`electron/server-supervisor.mjs:104-114`). A switch of environment pauses
   the supervisor (section 3.7).
8. `shutdown()` can run more than one time. It clears the timer, stops the
   child even while its probe runs, and makes a later `ready()` return false
   (`:116-127`, `:28`).
9. Recovery restarts on the same port only (`electron/main.mjs:299`).
10. When a child exits, the pending approval-mode requests of the desktop are
    refused with "The embedded bot server stopped" (`electron/main.mjs:1168`,
    `electron/approval-trusted-mode.cjs:365-371`).
11. An interrupted turn stays interrupted. Recovery does not send it again
    and does not make a reply (`docs/verification/desktop-server-recovery.md:45`,
    `scripts/verify-server-recovery.mjs:193-198`).
12. No IPC carries the state of the supervisor to the page. A window that
    opened while the server was down shows the error page. It is reloaded
    when the server is ready, and it leaves the "unavailable" set only after
    the reload succeeds (`electron/main.mjs:312-319`, `:2160-2167`).

The stop: `proc.kill()`, then a race against 9.5 s
(`electron/main.mjs:293`, `:342-358`). There is no second signal, no tree
kill and no `taskkill`. A Windows kill skips the normal exit of Node
(`scripts/desktop-server-entry.mjs:25-26`).

### 3.6 Which server the window shows

1. The bundled local server always starts first (section 3.2). Its folder is
   the folder of the active local place, or the default folder
   (`electron/environments.cjs:428-439`, `electron/main.mjs:2822-2832`).
2. `activeId` in the saved file chooses what the window shows: "local", a
   named local folder, or a remote origin (`electron/environments.cjs:329`,
   `:451-458`). A remote place does not stop the local server. A switch to it
   saves `activeId` and loads that origin (`electron/main.mjs:1645-1665`).
3. Before a saved remote opens, the app fetches
   `/.well-known/openmausbot/environment` with a 3 s limit. Each status below
   500 counts as up. If it is down, a dialog offers Try again, Remove and
   Cancel (`electron/saved-server.mjs:7-38`, `electron/main.mjs:1662`).
4. When a remote page fails to load, the app shows a dialog and switches back
   to Local (`electron/main.mjs:2022-2039`).
5. A saved remote gets a status from `electron/server-status.mjs`: a recheck
   each 60 s when healthy, a jittered backoff from 2 s up to 5 minutes,
   "cantReach" after 120 s, a 15 s limit for each check (`:5`, `:9-12`).
   A blocked state (signed out, or not secure) waits for the person
   (`:77-79`). Each server has its own timer, so one slow server does not
   hold back the others (`:57-65`).

### 3.7 The switch of a local place (what this file adds)

environments-and-flags.md has the full flow. New facts:

1. The switch pauses the supervisor first, and resumes it in `finally`
   (`electron/main.mjs:1566-1640`).
2. If no child is left after the switch, `reviveAfterFailedSwitch` tries at
   1 s, 2 s and 4 s, and never forces a lease that another process holds
   (`electron/environment-switch.mjs:89-105`).
3. A child that does not stop ends the switch while the old lease is still
   held.
4. The readiness check of the switch is a stub: `probeReady: async () =>
   "ready"` (`electron/main.mjs:1596`). The real check is the boot probe
   inside `startServerOn`.
5. Only one switch runs at a time. A second one gets "busy".

### 3.8 Connect to a saved server

1. The person types an address or a pairing link in the Connect sheet
   (`src/components/PlaceAddSheet.tsx:65-179`). The sheet probes 400 ms after
   the typing stops (`:89-100`).
2. The parser accepts (`electron/server-address.mjs:127-191`):
   - `http(s)://host/pair#code=...` (also `?code=`).
   - `openmausbot://pair?address=<encoded origin>&code=` or `&token=`.
   - an address, and a code in a separate field.
3. A pairing code has 12 characters of the alphabet
   `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`, shown as `XXXX-XXXX-XXXX`. The QR
   credential is `omb_pair_` and 43 base64url characters
   (`electron/server-address.mjs:5-7`). A script key, an 8-digit email code
   and an old 6-digit code are each refused with their own message
   (`:105-116`).
4. A bare private address tries https, then http. A tailnet name also tries
   port 8799. An explicit `http` to a public host is refused (`:32-64`,
   `:180-184`).
5. Main probes each candidate in order, with 6 s each, `redirect: "error"`
   and `credentials: "omit"` (`electron/server-probe.mjs:94-145`). Each
   failure maps to one of about 20 sentences that say how to fix it
   (`:11-33`).
6. A native dialog asks "Connect to {host}?". Cancel returns `false` with no
   error, and the form keeps the input (`electron/server-probe.mjs:166`).
7. The app saves the place, then loads `<origin>/pair#code=...`. The secret
   is only in the URL fragment, "so it never reaches a log"
   (`electron/server-address.mjs:193-196`). The desktop never sends the code
   itself.
8. Forget calls `POST /api/auth/logout` with a 5 s limit, then clears the
   storage of that origin, but not its cookies, because the cookie store of
   Chromium is not split by port (`electron/main.mjs:1906-1922`).

### 3.9 What each page may call

1. One sandboxed preload serves each page. `isLocalPage` is true when the
   page origin is the local origin (`electron/preload.cjs:65-66`).
2. The local page gets the full `window.ogb`. Another origin gets only the
   keys of `REMOTE_SAFE` (`electron/preload.cjs:95`), plus `updater` when
   main offers it, plus the home keys when the page is the person's hosted
   home (`:97-122`, `:867-870`).
3. A remote page never gets the saved list, add, forget, switch, pair,
   computer sharing, credentials or file pickers.
4. A call that changes state from a remote page needs a real click
   (`navigator.userActivation.isActive`). Without one it is refused with a
   plain sentence (`electron/preload.cjs:175-216`).
5. Main checks each sender again:
   - `localOnly` compares the frame origin, and refuses until the local
     origin is known. An empty child frame is refused
     (`electron/local-origin.cjs:12-48`).
   - `workspaceOnly` accepts only the main frame of the main window, at the
     active origin (`electron/environments.cjs:56-73`).
6. A remote page cannot make main probe an address. The preload exposes
   `workspaces.probe`, but main registers it through a guard that accepts
   only the rail page or the local origin (`electron/cloud-rail.mjs:170-175`,
   `:252-260`, and the test `electron/cloud-rail.node-test.mjs:178-189`).
7. The main window may navigate only to the active origin. A subframe may
   not embed the local origin or a saved origin
   (`electron/main.mjs:1995-2020`).
8. The bridge stays compatible for two releases. `electron/bridge-contract.json`
   keeps 258 paths of releases 0.1.135 and 0.1.136, and
   `electron/preload-contract.node-test.mjs:29-40` checks them.

### 3.10 Chat links

1. **The formats** (`src/lib/thread-refs.ts`):
   - `openmausbot://thread/<id>?bot=<owner>`. Copy link writes this
     (`:125-127`). The owner is a bot id or a room id. `?bot=` is optional
     when a link opens.
   - `openmausbot://bot/<owner>` opens the current conversation of the owner
     (`:186-207`).
   - `openmausbot://app/la_<16 characters>` opens a saved app. With
     `?window=1` it opens the app in its own window
     (`electron/app-link.mjs:4-30`).
2. **Main checks little.** It trims the link, refuses one over 1,024
   characters, and checks the prefix without case (`electron/chat-link.mjs:6-16`).
3. **The page checks strictly** (`src/lib/thread-refs.ts:158-207`): one
   canonical encoding, `bot` is the only query key, no user, port or hash,
   and each id has at most 256 characters with no control characters
   (`:119-123`).
4. **The owner is strict.** A named owner never falls through to the thread
   of another bot (`src/lib/thread-refs.ts:218-231`).
5. **Delivery on macOS:** the `open-url` event. Main tries the handlers in
   order: team, organization, cloud, package install, app launcher, chat
   (`electron/main.mjs:245-248`).
6. **Delivery on Windows and Linux:** the link is in the command line. A
   cold start reads `process.argv` (`electron/main.mjs:157`). A running app
   gets it in `second-instance` (`:250-263`). A cloud, team or app-launch
   link in the same command line returns early, so a chat link next to it is
   ignored (`:255`).
7. **Hold until ready.** The link waits in three places, and each holds one
   link only:
   1. main keeps `pendingChatLink`, and sends `chat:open` only when a page of
      the right origin has loaded. It tries again on each `did-stop-loading`
      (`electron/main.mjs:196-215`, `:2042-2045`). If the window shows a
      remote server, main switches back to Local first (`:196-207`).
   2. the preload keeps it until the page listens
      (`electron/preload.cjs:15-24`).
   3. the hook keeps it until the state is loaded
      (`src/hooks/use-external-chat-links.ts:15-16`). It then closes Settings
      and the shortcuts list (`:18-19`).
8. **A thread that is not loaded** (cold start): the page asks the server for
   that exact pair (`src/components/ThreadRefs.tsx:109-126`). A 404 shows
   "That thread is no longer here." An unknown bot shows "That bot is no
   longer here." (`:103`). A bot-to-bot group is always refused (`:34`,
   `:92`, `:113`).
9. A link from outside the app only navigates. It never sends, stops or
   makes anything (`electron/chat-link.mjs:1-3`).
10. Launcher links go into a queue of at most 20 and retry each 500 ms while
    the app is not ready (`electron/app-launches.mjs:6-7`, `:15-30`).

Edge cases:

- A newer link replaces an older link that is not yet delivered.
- A pending link lives in memory only. A crash loses it.
- A dev build never registers the scheme (`electron/main.mjs:2851`).
- `electron-builder.yml:5-7` declares the scheme. `package.json` has no
  `build.protocols`.

### 3.11 Linux

1. **Session.** Wayland wins: `XDG_SESSION_TYPE=wayland` or any
   `WAYLAND_DISPLAY` means Wayland, also when `DISPLAY` is set
   (`electron/capabilities.cjs:23-24`). Local control fails closed on
   Wayland, and a saved opt-in is reset (`docs/linux-desktop.md:18-23`,
   `:246-250`). Screen preview uses the portal picker on Wayland
   (`:220-226`).
2. **GPU.** Software rendering is used when NVIDIA is found
   (`/proc/driver/nvidia/version` or `/sys/module/nvidia`), or when
   `OMB_LINUX_GPU=off`. `OMB_LINUX_GPU=on` forces the GPU
   (`electron/linux-gpu.mjs:5-9`). The reason: the GPU process of Chromium
   crashed on NVIDIA and left an invisible window that took the input
   (`:3-4`). The page then drops the backdrop blur
   (`src/styles.css:1831-1837`). `WaylandWpColorManagerV1` is turned off
   (`electron/linux-gpu.mjs:14-18`).
3. **Install hook** (`build/linux-after-install.sh`, for deb, rpm and
   pacman):
   - it sets directories that an old upgrade left at 0775 back to
     root:root 0755 (`:4-10`, `:40-68`).
   - it makes `chrome-sandbox` root setuid 4755 (`:70-83`).
   - it refuses links, special files and hard links in the browser tree
     (`:85-106`).
   - it loads an AppArmor profile that allows user namespaces for the
     bundled headless browser only (`build/linux-openmausbot-browser.apparmor:6-8`,
     hook `:196-198`). It fails closed when namespaces are restricted and the
     profile does not load (`:147-151`, `:190-193`).
4. **Remove hook.** It keeps the profile on upgrade, for the argument forms
   of dpkg, rpm and pacman (`build/linux-after-remove.sh:9-13`).
5. **PATH for engine CLIs.** A GUI app does not get the PATH of the shell.
   `server/env-path.ts:118-139` builds the PATH in this order: folders that
   the app registered, `OMB_EXTRA_PATH`, the inherited PATH, the last
   login-shell PATH, known folders that exist, then the app fallback folders
   last, so the person's own copy wins.
   - The login-shell probe runs `$SHELL -l -i -c 'printf ...'`, detached, and
     kills the process group with SIGKILL after 5 s. It reads at most 1 MiB.
     It uses the answer only after exit 0 with both markers
     (`server/env-path.ts:142-200`).
   - The probe is skipped under tests, in sealed fixtures, on Windows, and
     when the home programs are not trusted (`:121`).
   - The first call returns the PATH **before** the probe ends (`:118-125`).
     A CLI that only the rc files of the shell put on the PATH (for example
     nvm) is found only on a later call (inference).
   - The desktop has a second probe for lent commands
     (`electron/shell-path.mjs:12-30`). It caches the result for the life of
     the process, also a failed result (inference: never retried).
6. **Updates on Linux.** The file `resources/package-type` chooses the route
   (`electron/package-install-command.mjs:7-23`):
   - `.deb` with a display and `pkexec`: one password prompt runs a fixed
     root script. It checks the SHA-512 of the feed, then runs
     `apt-get install` (`electron/elevated-install.mjs:37-136`). The limit is
     15 minutes. On success it releases the single-instance lock, relaunches
     and quits (`electron/updater.mjs:106-111`).
   - rpm, pacman, or a `.deb` with no prompt: the app copies a command and
     opens a terminal (`electron/terminal-launch.mjs:45-49`).
   - AppImage: `quitAndInstall` through a patched updater. The patch writes
     the new file over the old one with an atomic rename, so the launcher of
     the person still works (`scripts/patch-appimage-updater.mjs:1-27`). It
     also waits for the old process to release the lease before the new copy
     opens (`:29-44`).
   - Linux has no quiet install on quit (`electron/updater.mjs:33`,
     `:230-231`, `:240`). The first check runs at 15 s, then each hour
     (`:249-250`).

### 3.12 A computer with no desktop

1. **The plan was not built.** `server/host-adapter.ts`,
   `server/supervisor.ts`, `server/serve.ts`, `GET /api/machine`, the machine
   roster and the service files of the plan do not exist (search).
2. **The grant.** "This computer" is the computer of the desktop app. Only
   the server that the app started may drive it. The app gives the driver
   connection to that one child over the private utility-process port. "No
   file, environment variable or HTTP route supplies it"
   (`server/desktop-computer.ts:2-6`).
3. A server of `serve` is plain Node with no parent port. So `granted()`
   stays false and `connection()` stays null (`server/desktop-computer.ts:26-47`).
   A test shows that `OMB_DESKTOP_PARENT=1` and a record file are not enough
   without the grant (`server/desktop-computer.test.ts:23-40`).
4. The record of the Linux driver is decoded again at each use: exact keys,
   a certified driver version, the identity of the binary, a private socket
   and two live process ids. Any failure gives "unavailable"
   (`server/local-computer.ts:139-340`, `:386-402`).
5. **How it reports it.** There is no capability object. Each computer
   option gets `{available, ready, canStart, canCreate, reason}`. The local
   option is ready only with a connection (`server/index.ts:5979-5981`,
   `:6015-6017`). The text with no grant is: "Only the OpenMausBot app on this
   computer can let a bot use it. Open the app here, or let the bot work in
   its own browser or on a cloud desktop instead."
   (`server/desktop-computer.ts:55-57`).
6. Screen preview and dictation have no server-side check in the files read.
   The README table is the only source (`README.md:380-387`).
7. **The ready wait of `serve`.** `OMB_SERVE_READY_TIMEOUT_MS`, 60 s by
   default, from 5 s to 1 hour. A bad value silently falls back to 60 s
   (`server/headless/args.ts:266-274`). The loop polls `/api/health` each
   250 ms until the pid matches (`server/cli.ts:270-275`, `:808-811`). On a
   timeout it says "did not become ready within 1m", stops the child and
   exits 1 (`:817-821`).
8. **The stop of `serve`.** The tunnel, Caddy and Tailscale stop first, then
   SIGTERM, then SIGKILL after 10 s, on the direct child only
   (`server/cli.ts:784-800`).
9. **The restart policy of `serve`** (`server/restart.ts:1-45`): exit 75
   restarts at once, at most 5 times in a row. A crash (exit 70, or a signal
   of the system) restarts after 1, 2, 5, 15 and 30 s, then stops. A run of
   60 s resets both counts.
10. **The service.** `openmausbot service install` writes a systemd unit with
    `Restart=always`, `RestartSec=3`, `KillMode=mixed` and
    `TimeoutStopSec=30` (`server/service-unit.ts:36-64`), or a launchd agent
    with `KeepAlive` (`:70-107`). Windows is refused (`server/service-cli.ts:63-67`).
11. **Credentials with no keychain** (`server/headless/saved-servers.ts`).
    On macOS the CLI token goes to the Keychain through `security -i`, with
    the command on stdin (`:50-51`, `:154`). Elsewhere it goes to a file of
    mode 0600 in a folder of mode 0700 (`:157-163`). An unreadable or corrupt
    `servers.json` is an error ("fix or remove it"), not an empty list
    (`:74-87`).

## 4. The data

| Data | Where | Shape | Source |
|---|---|---|---|
| Saved places | `<userData>/environments.json` (or `environments-staging.json`) | `{version: 2, environments: [{id, kind: "local" \| "remote", name (60 at most), origin \| dataDir, color?, microphone?, home?, team?, cloud?}], activeId, localColor}` | `electron/environments.cjs:294-338` |
| Window size | `<userData>/window-state.json` | `{bounds: {x, y, width, height}, maximized}`. Integers only. Default 1040 x 760, minimum 840 x 620 | `electron/window-state.cjs:1-21` |
| Parent lease | `<dataDir>/openmausbot-server.lease` | process id, token and start time of the owner | `electron/data-dir-lease.mjs:10` |
| Child lease | `<dataDir>/.openmausbot-server-child/openmausbot-server.lease` | taken with the one-time capability `v1:<pid>:<token>`, which the child deletes from its environment on read | `electron/data-dir-lease.mjs:621-676`, `:752-755` |
| Version of the last cache clear | a file under `userData` | the app version | `electron/startup-cache-eviction.mjs:33-66` |
| Health answer | `GET /api/health` | `{app: "openmausbot", pid, static, ...}`. A caller with no sign-in gets only `{app}` | `electron/server-boot-probe.mjs:91-96`, `server/index.ts:12524-12526` |
| Server descriptor | `GET /.well-known/openmausbot/environment` | probed before a save and before an open | `electron/saved-server.mjs:7-38`, `electron/server-probe.mjs:94-145` |
| Chat link | the URL | `openmausbot://thread/<id>?bot=<owner>`, `openmausbot://bot/<owner>`, `openmausbot://app/la_<16>` | `src/lib/thread-refs.ts:125-207`, `electron/app-link.mjs:5-7` |
| Owner token | memory only | 32 random bytes for each launch, sent as the header `X-OpenMausBot-Desktop-Owner` | `electron/main.mjs:295`, `electron/server-session.mjs:11-48` |
| Computer grant | memory of the server only | `{type: "openmausbot:local-computer", connection}` | `server/desktop-computer.ts:10`, `:28-41` |
| CLI saved servers | `<config>/openmausbot/servers.json`, `sessions/<name>` | mode 0600, folder 0700 | `server/headless/saved-servers.ts:43-87`, `:157-163` |

Environment variables of the child (`electron/main.mjs:1111-1132`):
`OMB_DATA_DIR`, `OMB_PORT`, `OMB_DESKTOP_PARENT=1`, the lease capability, the
proxy and the credentials. Variables of the shell: `OMB_LINUX_GPU`,
`OMB_EXTRA_PATH`, `OMB_SERVE_READY_TIMEOUT_MS`, `OMB_UPDATE_INSTALL=terminal`,
`OMB_CLOUD_STAGING=1`.

What is never saved by the desktop:

- the pairing code and the QR credential (a test checks this,
  `electron/environments.node-test.mjs:18-26`).
- the session token. It is an HttpOnly cookie in the cookie store of
  Chromium.
- the owner token.

Writes:

- `environments.json` and `window-state.json` are written to
  `<file>.<pid>.tmp` with mode 0600, then renamed. There is no fsync
  (`electron/environments-file.mjs:25-36`, `electron/window-state-file.mjs:18-30`).
- The app writes `environments.json` before it changes its state in memory
  (`electron/main.mjs:1523-1528`). A failed write throws
  `environments-save-failed`.
- A read of `environments.json` that fails, a JSON error, or a version that is
  not 1 or 2 all give an empty list, with no log and no warning
  (`electron/environments-file.mjs:13-23`, `electron/environments.cjs:292-302`).
  The next save then writes over the file. A test pins this
  (`electron/environments.node-test.mjs:228-229`).

IPC channels of this feature (main registers about 120 in all, and the
main-process report has the full table):

| Channel | What | Source |
|---|---|---|
| `startup-screen:close` | the close button of the splash | `electron/startup-screen.mjs:53-56` |
| `window:maximized-changed` | main to the page | `electron/window-state-file.mjs:46-52` |
| `chat:open` | main to the page, a chat link | `electron/main.mjs:196-215` |
| `environments:status`, `environments:retry`, `environments:status-changed` | the status of saved servers | `electron/main.mjs:2671` |
| `workspaces:open-settings` | open Settings, Servers | `electron/main.mjs:1770-1779` |
| `local-apps:open-chat` | an app window asks for a chat | `electron/local-app-windows.mjs:153-158` |

Channels with no sender guard: `window:*` (`electron/main.mjs:2264-2279`),
`desktop:skin` (`:2250`), `perm:status` (`:2329`), `desktop-remote:state`
(`:2416`) and `desktop:capabilities` (`:2698`).

## 5. The UI

**The splash.** A 440 x 300 window with the app icon, the product name, a
status line and a close button. Its language is the app language (`lang`
attribute, for example `pt-BR` with the close label "Fechar",
`electron/startup-tray.node-test.mjs:142`).

**The tray.** The tooltip is the product name. It is not translated. The
menu has Open (`native.tray.open`) and Quit (`native.tray.quit`)
(`electron/system-tray.mjs:18-23`). The package checklist names the item
"Quit OpenMausBot" (`docs/verification/startup-tray.md:29-31`).

**The error page.** A `data:` page that says the server never came up. It
gives a reason (the ports are taken, or a slow start) and a `file://` link to
`server.log`. In an always-on home it adds that the app "keeps trying ...
every 5 minutes" (`electron/error-pages.mjs:23-34`, `src/locales/en.json:10046`).

**Native boxes.**

- "The bot server stopped" with the path of `server.log`, when the
  supervisor gives up (`electron/main.mjs:327-333`).
- The boot boxes: folder missing (`:2829`), lease not safe (`:2841`), boot
  failure (`:2985`). A boot box quits the app only when the default folder
  also failed (`electron/error-pages.mjs:40-44`).
- "Connect to {host}?" before a save (`electron/main.mjs:1781-1799`).
- Try again, Remove, Cancel for a saved server that is down
  (`electron/main.mjs:1662`).

**Settings, Servers** (`ConnectedWorkspacesSettings`, then `ServerList`):

- each row has Switch, Pair again, Remove, copy address and an update note
  (`src/components/ServerList.tsx:86-126`).
- the status line shows checking, reconnecting, "Can't reach" with Try now,
  signed out with Pair again, and not secure with Edit address (`:51-65`).
- the loading text is "Loading servers…". The error text is "Saved servers
  could not be loaded." It has no retry, and it says to reopen the page
  (`src/components/ConnectedWorkspacesSettings.tsx:40`, `:91`).
- one `pending` flag for the page blocks each action while one action runs
  (`:61-63`). A Settings page polls `computerSharing.servers` each 5 s
  (`:48`).

**The Connect sheet** (`src/components/PlaceAddSheet.tsx`): one field for the
address or link, a "Check again" button (`:152`), Escape, X or a click
outside to close, and a focus trap (`:193-227`). A second submit is blocked
while one runs (`:116`). An error shows without the prefix "Error invoking
remote method" (`src/components/RemoteComputerSection.tsx:11-16`).

**The native menu.** "Connect to another computer…" opens Settings, Servers.
On a remote page it first switches to the local page
(`electron/environments.cjs:101`, `electron/main.mjs:1770-1779`). "Add Server
from Copied Pairing Link…" reads the clipboard (`electron/menu.mjs:117`).

**RemoteComputerSection.** It shows only for an install that is already in
the old client mode, which "ends Dec 7"
(`src/components/settings/pages/AppPages.tsx:72`,
`src/components/RemoteComputerSection.tsx:96`, `:119-121`). Pair and
disconnect relaunch the app after 250 ms (`electron/main.mjs:2405-2434`).

**Copy link.** The ··· menu of a chat row has "Copy link" in Advanced mode
only (`src/components/SidebarThreadRow.tsx:473`). A second item "Copy link
(HTTPS)" shows when the server has a public address (`:474`). The result of
the copy is not used, so the person sees no "Copied" and no error
(`:437-440`).

**Chat link notices.** "That thread is no longer here." and "That bot is no
longer here." (`src/components/ThreadRefs.tsx:103`, `src/state/store.tsx:2742`,
`:2774`).

**The Linux update card.** The strings are at `src/locales/en.json:10287-10297`.

## 6. The tests

**Loading screen and tray** (`electron/startup-tray.node-test.mjs`, 15
cases, fake windows and a fake tray):

- a splash that is never ready resolves `ready` at exactly 10,000 ms, not
  9,999, and is not destroyed (`:60`).
- a crash of the splash renderer resolves `ready` (`:78`).
- COSMIC: show 500 ms after the load (`:89`).
- the reveal waits for content in `#root` (`:112`).
- a close of the splash during the start keeps the main window hidden until
  tray Open (`:127`).
- the tray and the splash use the app language (`:142`).
- a main renderer crash reveals the window (`:176`). A renderer that never
  draws is revealed at 10 s (`:182`). A quit never reveals it (`:190`).
- on macOS, or with no `onHide`, a close of the splash quits (`:198`).
- Linux: the lending indicator borrows the one tray icon, and gives it back
  (`:246`).

**Supervisor** (`electron/server-supervisor.node-test.mjs`, delays 10, 20,
40 ms):

- a crash clears readiness at once, retries at 10, 20 and 40, ignores the
  late exit of an old child, then "exhausted", then no more forks (`:56-78`).
- always-on home waits the long delay, then quick tries again (`:80-102`).
- a stuck child (`abort`) never gets a sibling (`:106-129`, `:227-247`).
- only a stable uptime resets the budget (`:177-192`).
- a quit cancels a queued retry, and `watch()` after the shutdown throws
  (`:194-204`).
- a quit stops a new child whose probe runs (`:206-225`).
- a child that dies during the first start is not restarted (`:249-256`).
- pause publishes the outage and forks nothing. Resume does not bring back a
  dropped restart (`:258-288`).
- a second quit joins the same stop (`:309-326`).
- the switch of a local place: one safety fork, rollback, and "a child that
  will not stop aborts the switch" (`:428-540`).

**Boot probe** (`electron/server-boot-probe.node-test.mjs`, 342 lines): the
fast and slow polls, the extra time after the listening line, a wrong pid
is "foreign-owner" at once, and a fetch never runs past the deadline.

**Real Electron fixtures**, run by hand, not in `package.json`:

- `scripts/verify-startup-tray.mjs`: the real splash, a screenshot, a click on
  its close button, the restore through the tray, the real Quit item. A 45 s
  watchdog. The network is blocked.
- `scripts/verify-server-recovery.mjs`: three scenarios on macOS and Linux
  with a fake engine. (1) A crash after a turn starts: a new pid on the same
  port, the old approval refused, a new one accepted, the turn not sent
  again. (2) A quit during the first backoff: no new child after the
  deadline. (3) A crash of each child: exactly three retries at 1, 2 and 4 s,
  then "exhausted". The script asserts that the platform is not win32
  (`:222`), because it uses SIGSTOP and SIGKILL.
- `scripts/verify-server-connection.mjs`: the real Settings components in a
  disposable Electron window. It is stale: it expects labels that are not in
  `en.json` any more ("Server address or pairing link", "Name (optional)",
  "Forget {name}"), and it expects a remote `workspaces` bridge of two keys
  (`:264`). The current list of about 18 keys is in
  `electron/cloud-rail.node-test.mjs:366-368`. Not run.

**Other unit tests:** `single-instance` (shows the last focused window,
releases the lock one time), `window-all-closed` (issue #2028),
`window-state.test.mjs` (fit to displays), `error-pages`, `menu.test.mjs`,
`boot-head-start`, `main-compile-cache`, `startup-cache-eviction`,
`environments` (corrupt file gives an empty list, the code is never saved),
`environment-switch`, `server-address`, `server-probe`, `server-status`,
`preload-contract` (258 paths of two releases), `chat-link`, `app-link`,
`use-external-chat-links`, `thread-refs`, `ThreadRefs`, `SidebarThreadRow`
(the exact copied link for a bot row and a room row, `:591-619`),
`linux-gpu`, `shell-path`, `env-path`, `elevated-install`,
`package-install-command`, `terminal-launch`, `desktop-computer` (no grant,
no computer), `local-computer`, `host-doctor`, `args`, `saved-servers`.
`window-state-file.mjs` has no test.

**Linux packages** (CI `.github/workflows/package-linux.yml`):

- `scripts/smoke-linux-package.mjs` kills Electron with SIGKILL, then requires
  the driver daemons, the socket and pid files and the server to be gone in
  10 s, and a new start to make a new generation (`:442-572`).
- a lane with a slow broker proves that the first paint does not wait for an
  optional broker (`:168-187`).
- `scripts/smoke-linux-update.mjs` proves the AppImage overwrite in place
  (`:59-143`). `release.yml:426-515` does not run it.
- `scripts/linux-after-install.test.mjs` has more than 30 cases of the
  install and remove hooks.

## 7. Ours compared

The main difference: under D10 our core runs inside the Tauri process
(`docs/decisions.md`, D10, status Proposed). So we have no server child. A
crash of the core is a crash of the app. Nothing of ours matches
`electron/server-supervisor.mjs`, the port search or the boot probe. Our
`crates/bot-desktop/src/main.rs` today has one command, `send_message`, and
no plugins. `tauri.conf.json` has one window, 900 x 640, minimum 480 x 360.

| Part | Reference files | Ours (crate and module) | Tauri part | State |
|---|---|---|---|---|
| Server process | `electron/main.mjs:1111-1188`, `electron/server-child-launch.mjs` | `bot-desktop/src/main.rs` builds the core in the process (step 7.3) | none: the core is a library | different by D10. T1 |
| Supervisor | `electron/server-supervisor.mjs` | none. P90 catches a panic of one turn task | none | different by D10. T1 |
| Boot probe and ports | `electron/server-boot-probe.mjs`, `electron/desktop-ports.mjs` | none | none | not needed under D10 |
| Start order and start limit | `electron/main.mjs:2787-3047` | `bot-desktop/src/main.rs` (P26, P89) | `Builder::setup` | T2 |
| Loading screen | `electron/startup-screen.mjs` | the first state of `crates/bot-desktop/ui` | the main window shows the UI at once. A second window is possible with `WebviewWindowBuilder` (not verified for our needs) | T2 |
| Stop and quit order | `electron/main.mjs:3069-3124` | P87 | `RunEvent::ExitRequested`, `api.prevent_exit()` (API names not verified) | P87, new facts below |
| One instance | `electron/main.mjs:186-193`, `electron/single-instance.mjs` | P93 | `tauri-plugin-single-instance` (`docs/comparison.md:153`) | P93, new facts below |
| Tray | `electron/system-tray.mjs` | none | the tray API of `tauri` (feature `tray-icon`, `docs/comparison.md:155`) | T3 |
| Close to tray and window-all-closed | `electron/main.mjs:1956-1961`, `electron/window-all-closed.mjs` | none | `WindowEvent::CloseRequested`, `RunEvent::ExitRequested` (not verified) | T3 |
| Window size | `electron/window-state.cjs`, `electron/window-state-file.mjs` | none | `tauri-plugin-window-state` (not verified, license not checked) | T5 for the read rule |
| Chat links | `electron/chat-link.mjs`, `src/lib/thread-refs.ts`, `src/hooks/use-external-chat-links.ts` | none. Threads come in step 11 | `tauri-plugin-deep-link` (`docs/comparison.md:152`) | T4 |
| Saved places, pairing | `electron/environments.cjs`, `electron/server-address.mjs`, `electron/server-probe.mjs` | none. D10 plans no remote server | none | not planned. T5 for the read rule |
| Bridge by origin | `electron/preload.cjs:65-122`, `electron/local-origin.cjs` | `crates/bot-desktop/capabilities/default.json` (`core:default`, window `main`) | capabilities. A remote URL gets no command unless a capability names it | T6 |
| Linux GPU flags | `electron/linux-gpu.mjs` | none | our window is WebKitGTK, not Chromium. The Chromium flags do not apply | section 9 |
| Linux sandbox and AppArmor | `build/linux-after-install.sh`, `build/linux-openmausbot-browser.apparmor` | none | the Tauri bundler (deb, rpm, AppImage). We bundle no browser | not needed now |
| PATH of engine CLIs | `server/env-path.ts:104-200` | `bot-engine` (step 9) | none | T7 |
| Linux updates | `electron/updater.mjs`, `electron/elevated-install.mjs`, `scripts/patch-appimage-updater.mjs` | P94 | `tauri-plugin-updater` (`docs/comparison.md:151`) | P94, new facts below |
| No-desktop capabilities | `server/desktop-computer.ts`, `server/local-computer.ts` | none | none | T8 |
| `serve` and its restarts | `server/cli.ts:669-905`, `server/restart.ts`, `server/service-unit.ts` | `bot-cli` | none | T9 |

New facts for proposals that exist:

- **P87 (one shutdown).** The reference stops the server with `kill()` and a
  9.5 s race, with no second signal and no tree kill
  (`electron/main.mjs:342-358`). The computer driver and the companion stop
  at the same time, with 2.5 s (`:3055`, `:3091-3097`). A second SIGINT
  forces the exit (`:3059-3067`).
- **P90 (catch a panic).** In the reference a crash refuses the pending
  approval-mode requests of the desktop (`electron/approval-trusted-mode.cjs:365-371`).
  An interrupted turn is not sent again
  (`docs/verification/desktop-server-recovery.md:45`). Our panic handler can
  do the same: end the turn as failed, refuse its pending approvals.
- **P93 (one copy).** The order in `second-instance`: read the links first,
  then show the tray window, then the last focused window, then a new window
  (`electron/main.mjs:219-225`, `:250-263`). On Windows and Linux a chat link
  comes through this path.
- **P94 (updater rules).** The lock is released also before the relaunch of
  a Linux package install (`electron/updater.mjs:106-111`). The AppImage
  patch writes in place and waits for the lease
  (`scripts/patch-appimage-updater.mjs:1-44`). After an elevated install the
  state can stay "installing" with only a message after 2 minutes
  (`electron/updater-coordinator.mjs:264-273`, `:291`).
- **P41 (Windows process test).** The only end-to-end recovery fixture
  refuses win32 (`scripts/verify-server-recovery.mjs:222`).
- **P546 (the lease as a file lock).** The Windows liveness probes of the
  lease are synchronous `execFileSync` calls on the main process: `wmic` and
  `tasklist` with 5 s, PowerShell with 15 s
  (`electron/data-dir-lease.mjs:165-167`, `:394`, `:417-420`, `:450`,
  `:459-462`). One probe can freeze the window for up to 15 s (inference).

## 8. Where we can be better

Each proposal has a T-number. The main session gives the P-numbers.

**T1. Decide how the core recovers from a crash (before step 7, with P26).**

- Problem in the reference: the supervisor gives up after three tries in
  about 7 s and shows a native box. Only a quit and a new start clear it
  (`electron/server-supervisor.mjs:11`, `:40-46`, `electron/main.mjs:327-333`).
  A child that does not stop blocks each new child
  (`electron/server-supervisor.mjs:57-58`). The recovery is not tested on
  Windows (`scripts/verify-server-recovery.mjs:222`). The release problem:
  "State lost at a restart or a crash" ("recover the embedded server after a
  crash", v0.1.74, v0.1.165).
- Option a (recommended): keep D10. The core runs in the process. P90
  catches a panic of one turn task. The recovery of turns at the next start
  (changelog.md section 7, `server/runtime/runtime.ts:109-158`) replaces the
  supervisor. We remove the port search, the identity probe, the lease
  hand-off between parent and child, and the stuck-child case. The cost: a
  panic outside a turn task closes the window.
- Option b: follow the reference. The core runs as a child process (a
  Tauri sidecar). A Rust supervisor restarts it at 1, 2 and 4 s. It resets
  the budget after 60 s of stable uptime. It never starts a second child,
  and it shows a dialog at the end.
- Changes: D10 (add the cost of one process and the recovery rule), P26.

**T2. A bounded start that the person can see (step 7).**

- Problem in the reference: the start of the server can wait about 7
  minutes with no listening line. It can wait about 25 minutes when each
  child prints the line and never answers (inference from
  `electron/server-boot-probe.mjs:5-6` and `electron/main.mjs:1191-1209`).
  The splash leaves after 10 s, and the person sees the error page only at
  the end. The restore, the start place and the updater wait behind it
  (`electron/main.mjs:2962`, `:3024-3037`). The release problems: "A turn or
  a wait that does not end" (v0.1.15, v0.1.123) and "One slow or stuck part
  blocks all the others" (v0.1.114).
- What: the window opens at once with a "starting" state. The root builds
  the parts with one limit for the whole start (P88 gives each part its own
  limit). At the limit, the window shows which part did not start, with a
  path to the log. The window never waits for an optional part.
- Tauri part: the start state is a Tauri event after `setup`. No splash
  window is needed, because the UI loads from disk with no server.
- Changes: PR 7.3 and PR 7.5, with P88 and P89.

**T3. The tray and the close rules (later, with the routines of step 15).**

- Kind: follows the reference. Judgment call for the step: before the
  routines, no work runs while the window is closed, so a hidden window has
  no use.
- What: on Windows a close hides the window in the tray. On Linux the tray
  has only Open and Quit, and a close quits. macOS has no tray and never
  quits on close. Before the start ends, an empty window set does not quit
  (issue #2028). A hidden start (at login, after a quiet update) runs with no
  window.
- Source: `electron/system-tray.mjs:3-26`, `electron/main.mjs:44`,
  `:1956-1961`, `electron/window-all-closed.mjs:3-18`.
- Tauri part: the `tray-icon` feature of `tauri`, `WindowEvent::CloseRequested`,
  `RunEvent::ExitRequested` (API names not verified).

**T4. Chat links with one typed parser (after step 11).**

- Problem in the reference: the link is checked in two places, a prefix in
  main and a strict parse in the page (`electron/chat-link.mjs:6-16`,
  `src/lib/thread-refs.ts:158-207`). A pending link has no time limit and no
  notice when the page never loads (`electron/main.mjs:196-215`,
  `src/hooks/use-external-chat-links.ts:16`). Copy link gives no "Copied"
  and no error (`src/components/SidebarThreadRow.tsx:437-440`). The release
  problem: "A turn or a wait that does not end" (v0.1.15, v0.1.123), for the
  wait (inference). The two-place parse is a judgment call.
- What: one parser in Rust makes an enum `ChatLink { Thread { thread, owner
  }, Bot { owner } }` from the URL. It uses the same rules as the reference:
  - One encoding only.
  - `bot` is the only query key.
  - An id has 256 characters at most and no control characters.
  - The owner is strict.

  The window gets only a parsed link. A held link expires and shows a
  notice. A link only navigates.
- The scheme name needs a decision: it is the product name, and AGENTS.md
  forbids the name of the reference.
- Tauri part: `tauri-plugin-deep-link`, and the deep-link path of
  `tauri-plugin-single-instance` for Windows and Linux (license and API not
  checked).

**T5. A desktop file that cannot be read is never written over (step 6).**

- Problem in the reference: a corrupt `environments.json`, or one of a newer
  version, reads as an empty list with no warning. The next save writes
  over it (`electron/environments-file.mjs:13-23`,
  `electron/environments.cjs:292-302`, and the test pins it in
  `electron/environments.node-test.mjs:228-229`). The release problem: "A
  file written over after a failed read" (v0.1.103, v0.1.107, v0.1.151).
- What: the rule of changelog.md section 7 ("`save` takes a value that only
  a successful `load` can make") applies to each file of `bot-desktop` too.
  For data that only looks nice, such as the window size, a failed read may
  give the default, but the code states that choice.
- Changes: step 6. Related: P22, P547.

**T6. Commands only for our own page (step 7, PR 7.4).**

- Kind: follows the reference, and answers the release problem "A secret
  or an access right in the wrong place" ("Web pages no longer get owner
  access", v0.1.113). The reference gives each origin a different
  bridge and checks the sender again in main, and it fails closed until the
  local origin is known (`electron/preload.cjs:65-122`,
  `electron/local-origin.cjs:12-48`, `electron/environments.cjs:56-73`).
- What: `capabilities/default.json` names the window `main` and no remote
  URL. A test checks that the capability file gives no command to a remote
  URL. When we add a command, we add it to a capability by name.
- Our window loads no remote page now, so this is a test and a rule, not
  new code.

**T7. Find the engine CLIs on the PATH of the login shell (step 9).**

- Kind: follows the reference, with one change.
- Problem in the reference: the first call of `augmentedPath()` returns
  before the login-shell probe ends (`server/env-path.ts:118-125`). A CLI on
  a PATH that only the rc files make (nvm, for example) is not found at the
  first engine check (inference). The desktop has a second probe that keeps
  a failed result for the life of the process (`electron/shell-path.mjs:12-30`).
  The release problem: none proven. This is a judgment call.
- What: one probe in `bot-engine`, the same as the reference: `$SHELL -l -i
  -c` with markers, detached, its process group killed after 5 s, 1 MiB at
  most, used only after exit 0. The order of folders follows
  `server/env-path.ts:127-139`. An engine check that does not find a CLI
  waits for the probe (at most 5 s) and looks again. A failed probe can run
  again.

**T8. A list of host capabilities with the full key set (later).**

- Kind: judgment call. The reference has no capability object. It learns
  that it has a desktop only from a grant over the private port
  (`server/desktop-computer.ts:2-6`, `:26-47`), and screen preview and
  dictation have no server-side check.
- What: when we add computer control, `bot-core` gets a struct of
  capabilities with one field for each capability and no default value.
  `bot-desktop` and `bot-cli` each make it. A test lists all the fields, so
  a new capability cannot default to "supported" (the rule of the plan,
  `docs/superpowers/plans/2026-08-31-05-headless-harness.md:85`).

**T9. One restart policy for a server (later, if `bot-cli` gets a
service).**

- Problem in the reference: the systemd unit has `Restart=always`
  (`server/service-unit.ts:52`), and `serve` has its own policy that stops
  after five crashes (`server/restart.ts:9`, `:33-35`). systemd then starts
  it again each 3 s, so a crash loop never ends (inference). The release
  problem: "Memory and the number of processes" (v0.1.165, "EAGAIN"), by
  inference.
- What: if we write a service file, one layer restarts. Either systemd with
  `StartLimitBurst`, or our own policy and `Restart=no`.

**The problems of changelog.md section 5 in this feature:**

| Problem | In the reference here | Answer |
|---|---|---|
| The updater loops, sticks or breaks the window | The lock is released before an update relaunch, so the new copy does not exit (`electron/main.mjs:191-193`, `electron/updater.mjs:106-111`). The AppImage launcher broke when the old file was removed. A patch writes in place (`scripts/patch-appimage-updater.mjs:1-27`). The state can stay "installing" after an elevated install (`electron/updater-coordinator.mjs:264-273`). No loop seen | P94, new facts |
| Process control on Windows | The server stops with `kill()` only, no tree kill (`electron/main.mjs:342-358`). The lease probes are synchronous with 5 s and 15 s limits (`electron/data-dir-lease.mjs:165-167`, `:417-420`). The recovery fixture refuses win32 | P87, P41, P546 |
| State lost at a restart or a crash | An interrupted turn is not sent again. Pending approval-mode requests are refused. A corrupt `environments.json` reads as empty. A pending chat link, the hidden flag of the tray and the computer grant live in memory only | T1, T5, P90 |
| A wait that does not end | The start of the server is bounded but long (about 7 or 25 minutes, inference). A pending chat link has no limit. Launcher links retry each 500 ms with no cap (`electron/app-launches.mjs:6`, `:15-24`). The credentials wait at start has no limit (`electron/main.mjs:2853`). `runStatus` of the CLI fetches with no limit (`server/cli.ts:420`) | T2, T4 |
| One slow or stuck part blocks the others | The start waits in sequence behind the server (`electron/main.mjs:2962`). One `pending` flag blocks the whole Servers page. A child that does not stop blocks each new child. A Windows lease probe can freeze the main process. Good: each saved server has its own timer, and the first paint does not wait for an optional broker | T2 |
| Memory and the number of processes | At most one server child. Engines can stay alive after a SIGKILL of the server (`docs/verification/desktop-server-recovery.md:43-44`). systemd and `serve` both restart | T9 (engine processes: engine-process-lifecycle.md) |

## 9. Not verified

- The worst-case start time (about 7 and 25 minutes) is computed from the
  constants. Nobody ran it.
- What Electron does with a rejection of the `whenReady` chain.
- Whether the keychain read and `session.clearCache()` have their own time
  limits.
- Whether the approval-mode requests that a crash refuses include tool
  approvals. The code shows only desktop approval-mode requests.
- Whether the web page shows its own "reconnecting" banner while the
  supervisor waits. No desktop IPC carries that state.
- Whether `scripts/verify-server-connection.mjs` passes at `42f86aefd`. It
  was not run. Its labels look stale.
- Whether the `/pair#code=...` URL stays in the history or the session
  restore of Chromium.
- Whether electron-builder writes the `MimeType` line for the scheme on
  Linux, and how an AppImage registers the scheme.
- Whether electron-builder writes `resources/package-type` for pacman, and
  whether a pacman upgrade runs the hook again.
- Whether the desktop sends the computer grant again after a restart of the
  server child.
- The Linux GPU problems of WebKitGTK, which our window uses. The reference
  has only Chromium facts. We need our own check on NVIDIA and Wayland.
- The Tauri API names in section 7 and the licenses of the Tauri plugins.
  AGENTS.md asks for a license check before each new dependency.
- Real behaviour on Windows and on Wayland of the tray, the GUID and the
  splash. Only code comments and unit tests support it.
- The files that the readers did not read: `electron/home-window.mjs`,
  `electron/always-on-home.mjs`, `electron/open-at-login.mjs`,
  `electron/app-frame-guard.mjs`, `server/cli-usage.ts`, `server/config.ts`,
  `docs/self-hosting.md`, `docs/deploy-vps.md`, `docs/headless-cli.md`.
- Row 135 of `reference-features.md` says "not stated" for the host adapter.
  It was not built. The grant over the private port takes its place.
