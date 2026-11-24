# The life of an engine process: start, stop, kill, and late requests

Feature rows of [`../reference-features.md`](../reference-features.md):

- `specs/steer-sigterm-audit.md`: "A graceful Stop for one engine; steer and
  queue never kill".
- `plans/2026-08-18-001-fix-claude-turn-teardown...` and the two other fix
  plans of that date: "Kill the process tree of an engine when a turn ends;
  refuse a permission request that arrives after the turn ended; a guard for
  two requests with the same identifier".

Part 8 of [`../README.md`](../README.md), for step 9 of
[`../../plan/README.md`](../../plan/README.md) (crate `bot-engine`, child
processes of an engine).

Read on 2026-11-24. The reference project was at commit `ed8cb7278`. All
paths are in the reference project unless a line says "ours". Nobody opened
its `enterprise/` directory. Five subagents read the files. The main session
checked the key lines of each report against the code, and read
`server/engine-records.ts` itself.

Other research files already cover parts of this feature. This file does not
repeat them:

| File | What it covers | What this file adds |
|---|---|---|
| [`driver-contract.md`](driver-contract.md) §3.4, §3.5 | What `interruptTurn` does in each driver, and the outcome of a stop | The process part: how the tree is found and killed, the time limits, Windows, the restart sweep |
| [`queue-and-steer.md`](queue-and-steer.md) §3.4, §3.9, §3.12 | Stop and the queue, the `turnId` fence, how each driver takes a steer | The proof that steer and queue call no kill, and the path from the Stop route to the process |
| [`../turn-flow-comparison.md`](../turn-flow-comparison.md) | The events of one turn | Nothing on processes. No overlap |
| [`../changelog.md`](../changelog.md) §7 | The row "Memory and the number of processes" cites three lines | The five gates behind those three lines, and how they work together |

Changes since the earlier files read the reference:

- `server/procs.ts`, `server/engine-stop.ts`, the four `kill-tree` tests,
  `process-room.ts`, `process-limits.ts`, `bot-thread-limits.ts`,
  `codex-process.ts`, `bot-memory-cap.ts`, `permission-proxy.ts`,
  `person-stop.ts`, `person-stops.ts`, `stop-turn.ts` and
  `routes/bot-messages.ts` have no diff from `3aec210` or from `d6660e2d7` to
  `ed8cb7278`. Every line that the earlier files cite in them is still
  correct.
- `server/drivers/claude.ts`: from `3aec210`, one import line came in and 54
  lines of cost helpers moved out after line 640. The behaviour is the same.
  The broker moved one line down (`createPermissionBroker` `:440-592` is now
  `:441-593`). The lines after 640 moved 53 up (the `stop` body `:1829-1836`
  is now `:1776-1783`). There is no diff from `d6660e2d7`.
- `server/drivers/acp/core.ts`: changed after `d6660e2d7`. The stop and
  teardown behaviour is the same, but the lines moved. In
  `driver-contract.md`, `:427-445` is now `:434-451`, `:1091-1104` is now
  `:1042-1055`, `:1442-1445` is now `:1398-1407`, `:1572` is now `:1534`, and
  `:1595-1607` is now `:1557-1568`.
- `server/engine-memory.ts`: 25 lines more (929 to 954). A new
  `stopForBrowser` (`:690-711`) stops the engine of a turn when the memory
  limit of the browser closes its browser. The lines after `:690` moved 25
  down. For example, "stopped while waiting for memory" `:893` is now `:918`,
  and `engineAdmission` `:898` is now `:923`.
- `server/drivers/permission-command.ts`: 83 lines became 134, and its test
  58 became 102 (ACP command helpers). `chat-driver-tool-calls.md:106, 119`
  has the old counts.
- `src/components/Composer.tsx`: since `3aec210`, the stop code moved 8 lines
  down. "Stop and send" `:438-440` is now `:446-448`.

## 1. In short

An engine is a program on the computer, for example the Claude CLI or
Codex. The reference project starts it as a child process for a bot, sends
it a turn, and must stop it again. An engine starts its own children: MCP
servers, shells and tools. When the reference stops an engine, it must stop
all these children too. If it does not, they stay alive and use memory and
process slots.

This feature is about four things:

1. **Stop.** The person presses Stop. The engine must stop the turn and
   report it as stopped, not as a crash.
2. **Steer and queue never kill.** A message sent during a turn must never
   kill the engine.
3. **Teardown.** When a turn ends or a session closes, the whole tree of
   processes goes, on Linux, macOS and Windows.
4. **Late requests.** An engine can ask for permission after its turn ended.
   The reference answers such a request at once and never shows a card. A
   second request with the same identifier is refused.

Two more parts protect the machine. A restart sweep stops what a crashed
server left running. Gates limit how many engine processes run at once.

Special terms, explained one time:

- **Process tree**: a process, its children, their children, and so on.
- **Process group** and **session** (Linux and macOS): the system puts
  processes into groups. One signal to a group reaches all of its members.
  The reference starts each engine as the leader of a new session and group
  (`detached: true`, `server/procs.ts:429-430`).
- **SIGTERM** and **SIGKILL**: two signals. SIGTERM asks a process to exit,
  and the process can clean up or ignore it. SIGKILL ends the process at
  once.
- **taskkill /T /F**: the Windows command that ends a process and its tree
  with force. Windows has no process groups.
- **Graceful stop**: the engine gets a chance to end the turn by itself (a
  protocol message, or the end of its input) before any signal.
- **Retained process**: an engine process that stays alive between turns of
  one thread, so the next turn starts faster.
- **Permission broker**: a small socket server inside the Claude driver. A
  helper process that the engine starts sends permission requests to it.
- **Ask**: one permission request or question from the engine. Its **ask id**
  is the identifier that the helper puts on it.
- **pids.max**: the limit on processes and threads of a Linux container.
  **EAGAIN** is the error when a new process cannot start because of a limit
  like this.
- **Run tag**: a random value that a server run puts in the environment of
  each engine. The next server uses it to find what a crashed run left.

## 2. Files read completely

Kill the process tree, and Windows (subagent 1):

- `server/procs.ts` (735)
- `server/engine-stop.ts` (21)
- `server/kill-tree.test.ts` (326), `server/kill-tree-linux.test.ts` (248),
  `server/kill-tree-windows.test.ts` (73), `server/kill-tree-escaped.test.ts`
  (39)
- `server/procs-spawn-refused.test.ts` (40), `server/cli-lifecycle.test.ts`
  (339), `server/engine-handshake-pipe.test.ts` (56),
  `server/engine-handshake.ts` (62)
- `docs/plans/2026-08-18-002-fix-windows-pipe-name-collision-in-collision-tests-plan.md`
  (114)
- `docs/specs/steer-sigterm-audit.md` (93)

The process budget and memory (subagent 2):

- `server/process-room.ts` (233), `server/process-room.test.ts` (870)
- `server/process-limits.ts` (141), `server/process-shortage.ts` (35),
  `server/bot-thread-limits.ts` (36)
- `server/drivers/codex-process.ts` (132), its test (55)
- `server/idle-and-cap.test.ts` (216)
- `server/bot-memory-cap.ts` (460), `server/host/bot-memory-cap-host.ts` (35)
- `server/perf/process-health.ts` (181), its test (162)
- `server/engine-memory.ts` (954)

The Stop path (subagent 3):

- `docs/specs/steer-vs-queue.md` (111)
- `server/host/person-stop.ts` (94), its test (75)
- `server/person-stops.ts` (70), `server/person-stops.test.ts` (135),
  `server/live-turns.ts` (30)
- `server/host/idle-threads.ts` (50), its test (124)
- `src/lib/stop-turn.ts` (106), `src/state/stop-turn-store.test.ts` (106)
- `shared/client-cancel.ts` (79), `src/components/CancelledTurnRow.tsx` (31)
- `server/person-stop.e2e.test.ts` (103),
  `server/stop-stops-helpers.e2e.test.ts` (50)
- `docs/plans/2026-08-18-001-fix-claude-turn-teardown-zombie-cards-plan.md`
  (135)

Teardown in each driver (subagent 4):

- `server/drivers/claude-keepwarm.ts` (240), `server/drivers/codex-warm.ts`
  (426)

The permission broker (subagent 5):

- `docs/plans/2026-08-18-001-fix-permission-broker-ask-id-collision-plan.md`
  (124)
- `server/permission-proxy.ts` (263), its test (445)
- `server/drivers/permission-command.ts` (134), its test (102)
- `server/drivers/claude-spawn-contract.ts` (35)

The main session:

- `server/engine-records.ts` (285)

Read in ranges (the large files):

- `server/drivers/claude.ts` (2,016): 1-60, 300-600, 760-1000, 1085-1100,
  1150-1836, 1935-2016
- `server/drivers/codex.ts` (1,585): 1-20, 400-440, 530-724, 1075-1210,
  1340-1375, 1545-1585
- `server/drivers/acp/core.ts` (1,573): 276-292, 385-560, 553-690, 806-860,
  1030-1060, 1300-1320, 1395-1440, 1530-1573
- `server/index.ts` (15,276): 2185-2270, 2336-2350, 4700-4870, 4915-4952,
  6085-6100, 6325-6380, 6438-6640, 7008-7023, 7500-7512, 14725-14760
- `server/routes/bot-messages.ts` (872): 100-200, 668-872
- `server/drivers/claude.test.ts` (5,117): 225-433, 676-766, 3093-3302,
  3810-4150, 4255-4590
- `server/drivers/codex.test.ts` (4,630): 2691-2727, 3495-3885, 4406-4524
- `server/drivers/acp/acp.test.ts`: 2203-2240, 2439-2462, 3227, 3505-3536
- `server/drivers/pi.ts`: 230-252, 500-572, 915-935
- `server/testing/fake-claude-cli.ts`: 1-12, 80-95, 150-172, 850-1072,
  1360-1415
- Smaller ranges:
  - `server/drivers/session-idle.ts`: 1-21, 108-200
  - `server/contracts.ts`: 253-382
  - `server/env-path.ts`: 240-451 (only the lines that a search found)
  - `src/components/Composer.tsx`: 425-455, 515-530, 920-946
  - `src/components/ChatView.tsx`: 650-660, 808-816, 1010-1028
  - `src/state/store.tsx`: 2022-2028, 2726-2734, 3194-3205
  - `src/locales/en.json`: the keys in section 5

## 3. How it works

### 3.1 Start an engine process (`spawnCli`, `procs.ts:406-468`)

1. The program name is resolved first (`resolveCli`, `procs.ts:32-34`). On
   Windows, `server/env-path.ts:240-243` turns a `.cmd` or `.bat` shim into
   the program that it wraps. Node refuses a `.cmd` without `shell: true`
   since CVE-2024-27980, and the reference never uses `shell: true`, because
   `cmd` would break the JSON in the arguments.
2. On Windows, a command line longer than 30,000 characters throws
   `ENAMETOOLONG` before the start (`procs.ts:37-57`, `:413`). The Windows
   limit is 32,767 (`procs.ts:1-3`).
3. Options: `windowsHide: true` on Windows. `detached: true` on all other
   systems, so the engine leads its own session and group (`procs.ts:429-430`).
4. On Linux and macOS, the environment gets `OMB_ENGINE_TAG` with the run tag
   of this server (`procs.ts:423-428`). Windows gets no tag.
5. On Linux and macOS:
   - the child goes into the set `cliGroups`. Only a child in this set ever
     gets a signal to its group (`procs.ts:448`, comment at `:59`: "a plain
     child may share ours, so never signal its group").
   - its start time is read at once and kept with its pid (`procs.ts:449-456`).
     Linux reads field 22 of `/proc/<pid>/stat` (`:102-107`). macOS runs `ps`
     with a 2 s limit (`:68-84`).
   - `recordEngine` writes a record file for the restart sweep (`:457`, see
     3.10).
6. A stdin error is ignored (`procs.ts:465-466`). On Windows, a write between
   `taskkill` and the close of the pipe errors later and would crash the
   server.
7. A start that the system refuses (EAGAIN, EMFILE, ENFILE, ENOMEM) goes to
   the process budget (`procs.ts:433-445`, see 3.11).
   `describeSpawnFailure` (`procs.ts:583-602`) gives the text for the person:
   no room, a working folder that is gone, not installed, not executable, or
   too much launch data for Windows.

`execCli` (`procs.ts:512-553`) is for short commands. It starts no group.
When it has a time limit, it records the root and kills the tree with
`killCliTree(child, 0)` at the limit plus 2 s (`:546`).

### 3.2 Kill a process tree on Linux and macOS (`killCliTree`, `procs.ts:604-668`)

1. A second call for the same child gets the same promise (`procs.ts:606-607`).
2. A child with no pid counts as stopped: `true` (`:609`). A pid of 1 or
   less, or the pid of the server, gives `false` (`:610`).
3. `captureCliTree` (`procs.ts:174-187`) finds the descendants and keeps each
   pid with its start time:
   - Linux walks `/proc/<pid>/task/<tid>/children` (`:189-209`). If the walk
     can have missed a process, it reads all processes instead (`:211-238`).
     The walk can miss a process when a task list is hidden, a thread is a
     zombie, a parent changed, or a parent pid was reused.
   - macOS always reads all processes with `ps -A`.
   - A gateway daemon that left on purpose is skipped (`:134-158`, Linux only).
4. If the tree is already gone, return `true` (`:661`).
5. Send SIGTERM (`signal`, `:636-647`):
   1. capture the tree again.
   2. send the signal to each tracked descendant, the deepest first. Before
      each signal, read the process again. Its start time must be the same.
      A reused pid gets no signal (`:281-291`).
   3. send the signal to the group (`process.kill(-pid)`) when the root still
      runs, or when its start time matches exactly (`:640`).
   4. if the group signal fails and the root still runs, signal the root only.
6. Wait up to `timeoutMs` (default 5,000 ms). Check each 25 ms or on `exit`
   (`:657`, `:708-718`). At the end, one extra check, because a timer can run
   before Node reads the exit (`:652-656`).
7. Send SIGKILL in the same way, and wait 1,000 ms more (`:663-667`).
8. "Gone" means all of these (`settled`, `:624-635`):
   - the root exited.
   - each tracked descendant is gone, is a zombie, or has a new start time.
   - the group answers `ESRCH` to `kill(-pid, 0)`, or its leader pid now has a
     new start time. On Linux only, a group whose only members are zombies
     also counts (`linuxGroupOnlyExited`, `:253-269`). This is for a server
     that runs as process 1 in a container, where nobody collects zombies.
9. The result:
   - `true`: the whole tree is gone. The promise stays cached, so a late call
     cannot signal a reused pid. The record file is deleted (`:615-616`).
   - `false`: the stop is not confirmed. The cache entry goes, so a retry can
     run.

The longest time is `timeoutMs` + 1 s. A process that left the group (for
example with `setsid`) is stopped only if a capture saw it while it was still
a descendant.

### 3.3 Kill a process tree on Windows (`procs.ts:670-705`)

1. If the root already exited, return `true` at once (`:670`). The
   descendants are not checked.
2. Run `taskkill /PID <pid> /T /F` (`:688`). There is no graceful step.
3. One timer of `timeoutMs` gives `false` (`:685`). A `close` event gives
   `true`.
4. When `taskkill` succeeds, wait for the `exit` of the root, not for its
   pipes. A caller can rename the executable at once (`:690-694`).
5. When `taskkill` fails, call `child.kill()` and wait for `exit` too
   (`:696-703`). `taskkill /T` also fails when one process of the tree could
   not be stopped. That process can hold the pipes, so `close` never comes.
   This is the fix for "taskkill /T fails" (v0.1.140, commit `2bd074d3a`).
   Before it, Codex reported "did not shut down after termination was
   requested" on each turn.

Windows has no tree capture, no record file, no restart sweep and no pid
reuse check (`procs.ts:424`, `:448-463`).

### 3.4 The graceful helper (`stopEngineTree`, `engine-stop.ts:11-21`)

1. End the stdin of the engine. For a stream-JSON engine, the end of input
   is the signal to exit.
2. Wait up to 500 ms for the exit (`ENGINE_EOF_GRACE_MS`).
3. Call `killCliTree` with 1,500 ms (`ENGINE_TERM_GRACE_MS`).
4. The longest time is about 3 s. The comment gives the reason for step 3:
   "the MCP servers and tools it started lead no group of their own and stay
   behind otherwise" (`:8-10`).

`stopEngineTrees` stops several trees at the same time and returns `true`
only if all are gone (`:18-21`).

Callers: Claude when its spawn settings change or at dispose
(`claude.ts:1192`, `:2011`), and ACP when a session closes or at dispose
(`acp/core.ts:398`, `:430`, `:1568`). Claude Stop and Codex call
`killCliTree` directly. `docs/comparison.md:85` (ours) says "Stop: close
stdin, then terminate the group, then kill". That is true only for these
callers.

### 3.5 Stop, from the button to the process

`queue-and-steer.md` §3.9 has the queue side. `driver-contract.md` §3.5 has
the outcome of each driver.

1. The person presses the Stop button of the composer
   (`Composer.tsx:928-943`) or of the chat head (`ChatView.tsx:1014-1026`).
   The store calls `sendStop` (`store.tsx:2730-2732`).
2. The client drops a second press within 1 s (`stop-turn.ts:12`, `:65-69`).
   It sends `POST /api/bots/:id/interrupt` with `{threadId, turnId?}`
   (`:72-75`). `turnId` is the running turn that the client learned from
   `turn.started` (`:26-35`).
3. The route checks the body (`bot-messages.ts:801-818`). A Stop for a turn
   that is not the live turn answers `200 {ok: true, outcome:
   "already-stopped"}` and stops nothing (`:824-825`, fence
   `person-stops.ts:53-55`).
4. `stopThreadForPerson` (`host/person-stop.ts:52-64`):
   1. reads `idleThreads.stopping` before anything else (see the error paths
      below).
   2. marks the stop with the person who pressed it, stops the goal and the
      hand-offs.
   3. awaits `interruptDirectThread`.
   4. frees the thread if no engine held the turn.
5. `interruptDirectThread` (`index.ts:2229-2245`) marks the request message
   `requestCancelled`, cancels a dispatch that has not started, and awaits
   `adapter.interruptTurn(threadId)` of the engine that runs the turn
   (`:2243`). The route has no time limit around this await.
6. The driver acts on the process:

   | Driver | Graceful step | Then | Time before the kill |
   |---|---|---|---|
   | Codex | `turn/interrupt` (`codex.ts:653-656`) | Polls 15 ms for the end, then always `killCliTree(child)` (`:657-664`) | 750 ms for the request, up to 750 ms of polls, then 5 s after SIGTERM, then 1 s |
   | Claude | None | `closeSession` ends stdin, and `stopSession` calls `killCliTree` at once (`claude.ts:1776-1783`, `:835-841`) | 5 s after SIGTERM, then 1 s |
   | ACP | `session/cancel` (`acp/core.ts:1042-1055`) | After 5 s, `endUncancelled` closes the session (`stopEngineTree(child, 5000, 5000)`, `:430`). If the process still has other sessions and the close is not confirmed, it fails their turns and calls `killCliTree(host.child)` (`:434-451`) | 5 s for the cancel. Then 5 s of end-of-input grace, 5 s after SIGTERM and 1 s. Or the default 5 s after SIGTERM and 1 s for a shared process |
   | pi | `abort` (`pi.ts:563-568`) | The turn end kills the tree (`pi.ts:525-541`) | 5 s after SIGTERM, then 1 s |

7. Codex sets `stopRequested` before its first `await` (`codex.ts:647-649`).
   So the close handler settles the turn as `interrupted`, not as a crash
   (`:1145-1148`). The comment gives the reason: "killing first surfaced
   routine stops as 'codex exited null (signal SIGTERM) before
   turn/completed'" (`:643-644`).
8. When the turn ends, the server writes one row "You stopped this."
   (`index.ts:6338-6344`, `person-stops.ts:58-70`). The turn is filed as
   `cancelled`, not failed (`index.ts:6651`, `:6677`).

The reference has no capability flag that chooses a graceful or a hard stop.
Each driver decides inside `interruptTurn`. ACP reads its agent profile
(`support.cancelMeta`, `acp/core.ts:1045`), not the name of the driver.

Error paths:

- **No turn runs.** The driver does nothing (`codex.ts:1552`). `PersonStops`
  records nothing (`person-stops.ts:15`).
- **Stop two times.** The client drops the second press. Codex keeps a flag
  `interruptRequested` (`codex.ts:645`, `:650-652`). `killCliTree` returns the
  same promise.
- **A chat marked busy with nothing running** (v0.1.151, commit `1d72099d5`).
  `idleThreads.stopping` is read before the interrupt. If no engine held the
  turn, it frees the thread after the interrupt, unless a newer turn started
  meanwhile (`host/idle-threads.ts:42-48`). Freeing settles the turn, sets
  the thread idle and drains the queue (`:26-32`). The watchdog frees such
  threads each 60 s (`index.ts:4939`).
- **The kill is not confirmed.** Codex retries 12 times, each 5 s
  (`codex-process.ts:80-87`), then completes the turn (`codex.ts:681-686`). It
  keeps the ownership of the thread while the stop is uncertain (test
  `codex.test.ts:3854`). Claude emits "Claude could not be confirmed stopped;
  its helper processes may still be running." one time and releases the turn
  (`claude.ts:1645-1650`). pi emits a `runtime.error` and sends no
  `turn.completed` (`pi.ts:528-546`).
- **A system stop** (watchdog, limits) goes through `turnStops`, not
  `personStops`, so it is not shown as the stop of the person
  (`index.ts:7016`, `:7023`).

### 3.6 Steer and queue never kill (`docs/specs/steer-sigterm-audit.md`)

1. `steer-vs-queue.md:62-65` (criterion b): no steer or queue path may call
   `killCliTree` during a turn. `:66-71` (criterion c): the SIGTERM error must
   not be reachable from steer, queue or Stop.
2. The audit lists three Codex kill sites: the catalog probe, the identity
   probe, and the turn funnel `terminate()` (`audit:14-27`). The callers of
   `terminate()` are `stop()`, the teardown after `settle()`, and two
   relaunches before `turn/start` was accepted.
3. Its "static proof" (`audit:61-78`) says that `steerActiveTurn`, the steer
   route, the drain and `steer-queue.ts` call no kill and no interrupt.
4. Now: `steerActiveTurn` (`codex.ts:705-721`) refuses when the turn settled,
   was abandoned, has a stop requested, or its child exited. Else it sends one
   `turn/steer` with a 10 s limit. The steer route calls only
   `adapter.steer` (`bot-messages.ts:389`, `:422-423`). A search of
   `steer-queue.ts` finds no kill.
5. One path from a steer can still stop a turn (not kill it): "person first".
   A steered message with no answer after 60 s of tool time stops the turn
   and queues the message again (`index.ts:7022-7023`, `:7233`,
   `queue-and-steer.md` §3.4).

The audit's line numbers are out of date. For example, it cites
`index.ts:17028`, and the file now has 15,276 lines. The facts still hold.

### 3.7 Teardown when a turn ends

| Driver | Process life | Normal turn end | Error or Stop | Idle |
|---|---|---|---|---|
| Claude | One for each thread, kept between turns (`claude.ts:1-2`) | No kill. The broker pauses, temp files go, `turn.completed`, the idle timer starts (`:1348-1365`) | Sign-in or update needed, or team tools failed: `closeSession` (`:1359-1360`). Stop: 3.5 | `closeSession`: end stdin, then `killCliTree` after 5 s (`:861-879`). The time is 10 min by default, 30 s for a chat nobody looks at (`session-idle.ts:51-56`, `:229-235`) |
| Codex | One `app-server` for each conversation. Kept only after a good turn (`codex.ts:679-680`) | Kept: no kill. Not kept: `stop()` without `turn/interrupt`, then `killCliTree`, and `turn.completed` waits for it (`:638-686`) | Same as not kept | `armIdleClose`, then `killCliTree` (`codex-warm.ts:288-297`, `:324-342`). `OMB_CODEX_SESSION_KEEP=0` ends each process with its turn (`:261`) |
| ACP | One for each conversation, or shared by up to 6 sessions (`acp/core.ts:285`, `:533-537`) | No kill. The idle timer starts (`:500-522`) | Stop: 3.5 | Last session on the process: `stopEngineTree(child, 5000, 5000)` (`:430`). Shared: `session/close`, and the process is recycled 60 s later (`:456-466`) |
| pi | One for each turn | End stdin, `killCliTree`, and `turn.completed` only after the kill is confirmed (`pi.ts:525-541`) | Same | None |

Order of events at a normal Claude turn end (`claude.ts:1537`, then
`:1341-1365`):

1. The `result` frame comes (`:1537`). If steers wait, the result is held for
   2 s, or until 30 s of silence (`:1593-1611`).
2. `settle` sets `settled` and clears the timers (`:1341-1349`).
3. `broker.pause()` answers each waiting ask with a system reply
   (`:1350`, see 3.9).
4. The MCP config and the system prompt file are deleted (`:1351-1354`).
5. `session.turn = null` and `active.delete` (`:1355-1357`). From now, a new
   ask gets "the turn ended".
6. `turn.completed` is emitted (`:1363`).
7. The idle timer starts if the process is alive (`:1364`).

The drivers write no rows. They keep memory maps and emit events. The server
writes the rows (not traced here, see section 9).

The zombie-cards plan (`docs/plans/2026-08-18-001-fix-claude-turn-teardown...`)
no longer describes the code:

- **The bug** (plan lines 24-26): `settle()` closed the broker but did not
  kill the child. `net.Server.close()` keeps open connections, so a late ask
  became a card for a turn that had ended. The answer then returned
  "unavailable".
- **The plan**: kill the child in `settle` (U1) and add a `closed` flag to the
  broker (U2).
- **The code now**: U1 was replaced by the retained process, so `settle` does
  not kill. U2 is there, and a second guard was added: `isActive()`
  (`claude.ts:482-487`, see 3.9). The test mode `result-then-hang` no longer
  exists in `fake-claude-cli.ts`.
- The plan says `killCliTree` sends SIGTERM only, with no SIGKILL
  (`plan:35`, `:52`). The code now sends SIGKILL after the grace (3.2).

### 3.8 The engine exits by itself during a turn

- **Claude** (`finalizeClose`, `claude.ts:1642-1769`):
  1. kill what is left of the tree with `killCliTree(child, 0)`. The MCP
     helpers can outlive the root (`:1644-1650`).
  2. a stop was requested: settle `interrupted`.
  3. a result was held: settle it.
  4. else retry only if `mayResendTurn` allows it (`:1673-1674`). It refuses
     when the engine already answered or streamed text. This is "A Claude
     turn is never sent twice" (v0.1.150). An assistant frame sets
     `answered` (`:1487`).
  5. else emit "claude exited N before result" with the last 300 characters
     of stderr, and settle `exit_before_result` (`:1754-1760`).
- **Codex** (`codex.ts:1139-1166`): an exit by a signal (out of memory,
  SIGKILL) is final. A relaunch happens only before `turn/start` was
  accepted (`:1159-1162`).
- **ACP** (`acp/core.ts:835-848`): `exit_before_result`, with no retry. A
  prompt that the engine accepted is never sent again (`:1422`).

### 3.9 The permission broker: one ask, a late ask, a repeated id

The broker is `createPermissionBroker` (`claude.ts:441-593`). Only the Claude
driver has it. Codex and ACP get requests on their own JSON-RPC stream.

1. **Connect.** The engine starts the helper `permission-proxy.ts` as an MCP
   server from `--mcp-config` (`claude.ts:1098`). The helper connects one time
   to the socket of its session (`permission-proxy.ts:101-102`).
   - The socket path digests `botId\0threadId` (`claude.ts:414-421`).
     POSIX: `<data>/perm-<tag>.sock`. Windows: the named pipe
     `\\.\pipe\<name>-perm-<server pid>-<tag>` (`procs.ts:729-735`).
   - On POSIX the socket gets mode 0600. If `chmod` fails, the broker refuses
     that path (`claude.ts:528-542`). If no path binds, the broker throws
     (`:562-563`).
2. **Ask.** The helper sends one JSON line `{t: "ask", id, kind?, tool,
   input}` with `id = randomUUID()` (`permission-proxy.ts:141`, `:212`,
   `:224`).
3. **Three guards**, in this order (`claude.ts:475-497`):
   1. the broker is closed: answer with `systemEndedReply` at once.
   2. no turn is active (`isActive()` is `Boolean(sessions.get(threadId)?.turn)`,
      `:1224`): the same answer. The comment: "A retained process keeps its
      proxy connection between turns; late asks fail closed."
   3. the id is already waiting: log it with `JSON.stringify` (the id comes
      from the client), and deny with "<name>: duplicate ask id —
      skipping this request." (`:346`, `:489-497`). The first ask stays as it
      was.
   
   The broker always answers, and never drops a line. The reason
   (`:476`): "permission-proxy.ts resolves only on an answer, so a drop hangs
   the tool".
4. **Wait.** The ask goes into `pending` with a `finish` function
   (`:498-514`). A permission ask gets a 15-minute timer, and the time-out
   denies it (`:448`, `:511`). A question has no timer.
5. **Show.** `onAsk` emits `request.opened` (`claude.ts:1224-1253`). The
   server answers it alone (a grant, full access, the safety floor) or shows
   a card (`index.ts:6438-6575`).
6. **Answer.** The person answers through
   `POST /api/threads/:id/respond` (`bot-messages.ts:672-796`), then
   `answerRequest` (`index.ts:4742-4818`), then `broker.answer`
   (`claude.ts:571-577`). An unknown id, or an answer of the wrong kind,
   returns `false`. The card then says "Couldn't deliver that answer"
   (`index.ts:4800-4815`).
7. **Once only.** `finish` runs only if `pending.delete(askId)` succeeds
   (`claude.ts:500`). A second answer does nothing.
8. **Turn end.** `drain()` finishes each waiting ask with
   `systemEndedReply` and source `system` (`claude.ts:564-569`):
   - a permission: `deny`, "<name>: the turn ended".
   - a question: `answer`, "<name>: the turn is ending — wrap up."
     (`:348-352`).
   
   `drain()` runs from `pause()` at the turn end, and from `close()` at a
   Stop, an idle close or a failed start.
9. **The helper side.** It takes an answer only on the connection that sent
   the ask (`permission-proxy.ts:63-66`). A system answer to a question is
   not taken as words of the person (`:146-149`). If the connection drops,
   each waiting ask is denied (`:74-81`).

The repeated-id plan (`docs/plans/2026-08-18-001-fix-permission-broker-ask-id-collision-plan.md`):
`pending` belongs to the broker, not to one connection. A second
`pending.set` replaced the first ask, and the answer to one ask then deleted
the other. That left a card that nobody could answer (`plan:15`, `:21`). The
cause can be a UUID collision or a bad client on the socket (`plan:27-34`).

The Windows pipe plan (`docs/plans/2026-08-18-002-...`): four tests had thread
ids that gave the same 8-character tag. Windows keeps a pipe name for a short
time after `close()`, so the next `listen()` failed with `EADDRINUSE`. The plan
changed only the tests. Later, commit `927d91c1e` put a digest of the thread
id into the name. Now the broker also tries two names with random suffixes
(`claude.ts:423-438`).

Codex and ACP make the request id on the server (`codex.ts:806`,
`acp/core.ts:619`), so they need no repeated-id guard. Both finish their
open asks at the turn end (`codex.ts:671`, `acp/core.ts:500-508`). Between
turns, ACP answers a request with `cancelled` (`acp/core.ts:524-531`), and a
kept Codex process refuses a request with JSON-RPC error -32601
(`codex-warm.ts:129-133`).

### 3.10 The restart sweep (`server/engine-records.ts`)

Engines lead sessions of their own, so nothing stops them when the server
dies (`engine-records.ts:1-2`).

1. At start, a server makes a random tag of 32 hex characters, and a folder
   `<data>/engine-runs/<tag>/` with mode 0700. It writes `server.json` with
   its pid, start time, boot id and pid namespace (`:149-163`).
2. Each engine that `spawnCli` starts gets the tag in its environment
   (3.1). Its children inherit it. A record file `<pid>.json` with the pid
   and start time is written (`:236-254`).
3. The record goes when `killCliTree` confirms the tree gone (`:257-260`), or
   when the child exits and its group is gone (`:241-245`).
4. At a clean exit, if no recorded group still runs, the server writes the
   file `clean` (`:264-281`).
5. The next server reads each earlier folder (`sweepRun`, `:183-228`):
   - `clean` exists: delete the folder.
   - the earlier server was on another boot or in another container: delete
     the folder (`:173-175`).
   - the earlier server still runs, or its state is unknown: leave it.
   - the earlier server is dead: find what it left (`leftBehind`,
     `:126-144`). It takes a recorded leader with the same start time. It
     also takes a process with the earlier tag in the group or session of a
     recorded leader.
6. Send SIGTERM, wait up to 1.5 s, read again, send SIGKILL, wait up to 1 s
   (`:216-226`).
7. The sweep never touches these (`:136-143`):
   - a process with the tag of this server.
   - a process that started after this server.
   - an agent-browser daemon.
   - a daemon that moved to a session of its own.

   Nothing is found by name.
8. Windows: off (`:10`, `:150`).

### 3.11 How many engine processes can run

The reference has five separate gates and one watchdog. A turn must pass
each gate, in this order:

1. **Threads for each bot** (`bot-thread-limits.ts:5-30`). A thread here is a
   conversation, not an OS thread. The limit is 16 where the memory gate is
   on. Else it is one for each 2 GiB of memory, from 3 to 16. The Starter
   plan has 1. A direct send at the limit gets HTTP 409 `thread_limit`
   (`index.ts:7508-7509`). Other paths queue it.
2. **The turn gate** (`engine-memory.ts:317-344`, `admit` `:533-567`). The
   limit is the lower of the plan limit and the server limit. The server
   limit is the lower of memory / 700 MB and the pids limit / 60 tasks
   (`process-room.ts:43-45`). A turn over the limit waits in a queue with
   **no time limit**. It ends only on abort. The person gets a notice at once
   and each 10 minutes (`engine-memory.ts:40`, `:547-558`). The queue puts
   the work of the person first, and bot work that waited 5 minutes
   (`:836-845`). The gate is on only for a Cloud host, a container with a
   limit, or a set `OMB_TURNS_MAX_RUNNING`. It is off in the desktop app
   (`process-room.ts:226-233`).
3. **Room for a new process** (`engine-memory.ts:738-783`).
   - Memory: one engine counts as the average PSS of engines that ran 30 s,
     from 300 MB to 1,500 MB, and 700 MB before the first measure.
   - Processes: `ProcessBudget.short()` (`process-room.ts:107-111`). One
     engine counts 60 tasks, a browser 170, one more session 40, the server
     40 (`:13-27`). A margin of 10 % (at least 32) stays free (`:43`).
   - When there is no room, the gate stops the engine that was idle longest,
     or waits. The only task is never held back (`engine-memory.ts:772`).
4. **Codex start slots** (`codex-process.ts:6-67`). At most `max(2, CPUs)`
   Codex processes start at the same time. The reason (`:6-7`): each one
   starts its MCP servers, and many at once push those calls past their
   time limits. The wait has no time limit and ends only on Stop. The slot
   goes back when `turn/start` is accepted (`codex.ts:1369`).
5. **Browser room** (`process-room.ts:134-150`). A browser waits up to 20 s,
   then the tool gets the text `BROWSER_NO_ROOM`.

One more limit is for engines that wait between turns, not for new turns.
**The idle-engine cap** (`session-idle.ts:113-151`) runs "On every host"
(`:15`), so also in the desktop app:

1. Each retained engine that goes idle (a Claude session, a kept Codex
   process, an ACP session) enters one list, the least recently used first
   (`:125-139`, called from `armIdleClose`, `:186`).
2. The cap is `OMB_IDLE_ENGINES_MAX` when it is 1 or more. Else it is one for
   each 2 GB of memory, from 4 to 8, and 2 on a computer with 1.5 GB or less
   (`:116-121`). The comment says each idle engine "holds 250 to 450 MB with
   its MCP servers" (`:114-115`).
3. Over the cap, the engines whose conversation nobody looks at close first,
   then the least recently used (`:138`). An engine with a turn or a
   keep-warm hold is never closed (`:134`).
4. Where the turn gate is on, the room for memory and processes can close
   more idle engines first, spares before used ones (`:135-137`).
5. The next turn of a closed conversation starts a new process and resumes
   the session by its id (`:15-16`).

Test: `session-idle.test.ts:238` "closes the least recently used idle engines
past the cap, on a box with room to spare".

How the budget learns from EAGAIN (`process-room.ts:153-167`):

1. Each refused start counts by its code.
2. EAGAIN, EMFILE, ENFILE or ENOMEM: nothing new starts for 30 s
   (`SHORTAGE_HOLD_MS`, `:29`).
3. EAGAIN when the container shows no number for `pids.max`: the limit
   becomes the lower of the old learned limit and the current count, at
   least 64 (`:162`).
4. 30 minutes after the last refusal, the learned limit is dropped
   (`LEARNED_FOR_MS`, `:32`, `:101`). It does not grow back in steps.
5. The state is in memory only.

An ACP engine that writes a thread-start failure on stderr before its first
answer counts as EAGAIN too (`acp/host.ts:206-209`, `host-fault.ts:16-27`).

The watchdog (`engine-memory.ts:609-664`) runs each 2 s while an engine
runs. When free memory is low, it stops these, in this order:

1. the engine that was idle longest.
2. browsers that no turn uses.
3. one busy engine, with SIGKILL. The work of a bot goes before the work of
   the person, and the newest first.

A new engine that wrote nothing in 90 s while
the server is short of room gets SIGKILL (`:388-411`). The memory cap for
one bot (`bot-memory-cap.ts`) only logs, unless `OMB_BOT_MEMORY_MAX_MB` is
set.

### 3.12 The problems of `changelog.md` section 5 in this code

| Problem | What the code does | Where |
|---|---|---|
| Process control on Windows | `taskkill /T /F` with a fallback that counts the exit of the root. `.cmd` shims resolved without a shell. A command-line limit of 30,000. Pipe names with the server pid and random suffixes. No tree capture, no pid reuse check, no sweep | `procs.ts:670-705`, `env-path.ts:240-243`, `procs.ts:37-57`, `claude.ts:423-438` |
| Memory and the number of processes | Five gates and a watchdog (3.11). The three lines of `changelog.md` §7 are still correct | `codex-process.ts:11`, `bot-thread-limits.ts:5-18`, `process-room.ts:13-45` |
| A turn or a wait that does not end | The turn gate and the Codex slot wait with no limit. A question ask has no limit. The Stop route awaits `interruptTurn` with no limit. A stop that is not confirmed: Codex retries for 60 s, pi sends no `turn.completed` | `engine-memory.ts:533-567`, `codex-process.ts:35-54`, `claude.ts:511`, `index.ts:2243`, `pi.ts:528-546` |
| The same work done two times, or lost | An ask is finished once. A repeated id is denied. A late ask is answered, never dropped. A turn is not sent again after an answer. The `turnId` fence keeps a second Stop off the next turn | `claude.ts:500`, `:489-497`, `:475-488`, `:1673-1674`, `person-stops.ts:53-55` |

Items of the release notes that this code does not have: "EPERM unlink"
(v0.1.57, the Antigravity installer) and the data folder lease after a
reused pid (v0.1.83, v0.1.138, `electron/data-dir-lease.mjs`). Nobody read
them (section 9).

## 4. The data

### 4.1 Time limits and sizes

| Name | Value | Where |
|---|---|---|
| Grace after SIGTERM (`killCliTree` default) | 5,000 ms | `procs.ts:605` |
| Wait after SIGKILL | 1,000 ms | `procs.ts:667` |
| Poll while waiting | 25 ms | `procs.ts:657` |
| End-of-input grace (`stopEngineTree`) | 500 ms | `engine-stop.ts:5` |
| SIGTERM grace (`stopEngineTree`) | 1,500 ms | `engine-stop.ts:6` |
| Kill after a short command's limit | limit + 2,000 ms | `procs.ts:510`, `:546` |
| Handshake of an ACP probe | 30,000 ms | `engine-handshake.ts:6` |
| Codex `turn/interrupt` grace | 750 ms (twice) | `codex.ts:653-660` |
| Codex retries of an unconfirmed kill | 12 × 5,000 ms | `codex-process.ts:80-87` |
| ACP time before a forced end | 5,000 ms | `acp/core.ts:1047-1050` |
| Claude close: stdin end, then kill | 5,000 ms | `claude.ts:878` |
| Permission ask time-out | 15 min | `claude.ts:448` |
| Restart sweep: SIGTERM wait, SIGKILL wait | 1,500 ms, 1,000 ms | `engine-records.ts:216-226` |
| Windows command-line limit | 30,000 characters | `procs.ts:37` |
| Hold after a refused start | 30 s | `process-room.ts:29` |
| Life of a learned pids limit | 30 min | `process-room.ts:32` |
| Tasks for one engine, browser, session, server | 60, 170, 40, 40 | `process-room.ts:13-27` |
| Codex start slots | `max(2, CPUs)` | `codex-process.ts:8-12` |
| Threads for each bot | 3 to 16, Starter 1 | `bot-thread-limits.ts:5-30` |

### 4.2 The broker wire format (one JSON object for each line)

```json
{"t": "ask", "id": "<uuid from the helper>", "kind": "question", "tool": "ask_user", "input": {}}
{"t": "answer", "id": "<same id>", "behavior": "allow", "message": "...", "source": "user", "always": true}
```

- `kind` is absent for a permission (`permission-proxy.ts:224`).
- `behavior` is `allow`, `deny` or `answer`. `source` is `user`, `timeout`
  or `system` (`claude.ts:341-342`). `always` is sent only with `allow`
  (`:506`, `:575`).
- The late-ask reply and the repeated-id reply have no `source`
  (`:478`, `:485`, `:494`).

### 4.3 What is stored

- `<data>/engine-runs/<tag>/server.json`: `{pid, start, boot, ns}`, mode 0600
  (`engine-records.ts:158`).
- `<data>/engine-runs/<tag>/<pid>.json`: `{pid, start, at}`, mode 0600
  (`:240`).
- `<data>/engine-runs/<tag>/clean`: an empty file (`:277`).
- `<data>/perm-<tag>.sock`: the socket, mode 0600, deleted at close
  (`claude.ts:529-542`, `:587-589`).
- Everything else is in memory: the tracked trees (`linuxTrees`), the cached
  stop promises (`stopping`), the broker map `pending`, the process budget,
  the turn gate queue and the Codex slots.

## 5. The UI

- **Stop button**: a square button in the composer while the thread is busy
  (`Composer.tsx:524-526`, `:928-943`). Label key `chat.stopTurn` "Stop this
  turn", title `chat.stop` "Stop". A second button is in the chat head, but
  not in the simple head (`ChatView.tsx:1014-1026`).
- **Stopped row**: `CancelledTurnRow` shows "You stopped this."
  (`chat.turnStoppedByYou`), "{name} stopped this." or "Stopped"
  (`CancelledTurnRow.tsx:9-12`). The client shows it before the server row
  comes, if its own Stop reached a turn (`stop-turn.ts:95-106`).
- **No room**: `chat.notice.outOfProcesses` "There is no room to start
  another program ({code}), so this task could not run. Nothing was sent to
  the AI. It starts again by itself when there is room." (`en.json:10435`).
- **Waiting for room**: `server.room.wait`, `server.room.turns` and
  `server.memory.wait`, with the number running and the number ahead
  (`en.json:355-363`). `server.queued.capacity` for the thread limit
  (`:391`).
- **Codex slot**: "Waiting for a free Codex slot: N Codex runs are starting
  on this computer." This text is in the code, not in a locale file
  (`codex.ts:423`).
- **Approval card after the turn ended**: a late ask opens no card. A card
  that was open when the turn ended is settled with source `system`. A
  question card is settled only by an answer of the person
  (`packages/phone-protocol/src/ask-question.ts:62-65`).

## 6. The tests

Process tree (real processes):

- `kill-tree.test.ts:49`: the root and a grandchild die (all systems).
- `kill-tree.test.ts:92`: a detached helper that ignores SIGTERM dies after
  the root exits (Linux).
- `kill-tree.test.ts:227`: a root that ignores SIGTERM gets SIGKILL. A second
  call gets the same promise (not Windows).
- `kill-tree.test.ts:289`: a plain child that is not in `cliGroups` never gets
  a group signal.
- `kill-tree.test.ts:305`: when signals are denied, the result is `false` in
  less than 1.5 s, and a later retry gives `true`.
- `kill-tree-escaped.test.ts:25`: a grandchild that left the group and
  ignores SIGTERM dies within 3 s (POSIX).

Process tree (mocked system):

- `kill-tree-linux.test.ts:97-170`: signals go to the deepest first. A reused
  pid or a reused root group gets no signal. An unreadable process gives
  `false`. Each case runs with and without the children files.
- `kill-tree-linux.test.ts:181-231`: the fallback to a read of all processes
  when the children files can be incomplete.
- `kill-tree-windows.test.ts:26-73`: `taskkill` before and after the exit, no
  exit, and no callback. **No test covers the `taskkill` failure path**
  (`procs.ts:696-703`).

Stop and steer:

- `codex.test.ts:3729`, `:3755`, `:3771`, `:3805`: a steer, a refused steer
  and a steer that times out keep the child alive. A `killCliTree` spy sees
  no call.
- `codex.test.ts:3822`, `:3838`: Stop goes through the protocol with no
  signal error. The kill after the grace still settles `interrupted`.
- `steer-e2e.test.ts:702-843`: a Codex steer, a room steer and a room Stop
  leave no "SIGTERM" in messages or stderr.
- `cli-stop.e2e.test.ts:12`: the task stays busy until a helper that ignores
  SIGTERM is gone. All pids die within 10 s. The next send works.
- `person-stop.e2e.test.ts:13`: one stopped row, no failure row, the queued
  message runs and is not cancelled.
- `idle-threads.test.ts:50-106`: Stop frees a busy chat that no engine
  holds, and never frees a newer turn.
- `person-stops.test.ts:97-106`: the `turnId` fence.
- `stop-turn.test.ts:37`: a double click sends one Stop.

Teardown:

- `claude.test.ts:3093`: a turn after Stop waits for the old process.
- `claude.test.ts:3218-3302`: a tree that is not confirmed gone still
  settles once as `interrupted`, warns once, and frees the session.
- `claude.test.ts:3917`: dispose stops the whole tree of a retained engine,
  with a grandchild (POSIX).
- `claude.test.ts:4045`: a turn is never sent again after an answer.
- `codex.test.ts:3698`: no child survives `stopAll`, or a SIGKILL of the root
  while idle.
- `codex.test.ts:2691-2727`: an unconfirmed exit still completes after the
  retries.

Permission broker:

- `claude.test.ts:4403-4512`: a repeated id on the same connection or on a
  second connection is denied. One `request.opened`. The first ask can
  still be answered. An id is accepted again after it was answered.
- `claude.test.ts:3165-3209`, `:3829-3851`, `:4514-4578`: after Stop, between
  retained turns and after close, a late ask gets "the turn ended" or "wrap
  up", opens no card, and its answer returns `unavailable`.
- `claude.test.ts:239-278`: thread ids with the same start, and two bots with
  the same thread id, get different sockets.
- `permission-proxy.test.ts:393`, `:407`: when the broker dies or the
  connection drops, each waiting ask is denied.

Restart sweep:

- `engine-records.test.ts:56-220`: an unclean run is swept, with the child in
  its group. A clean run is not. A run whose server still runs, or from
  another boot, is left. A process in a session of its own, a process that
  only took a recorded pid, and a process newer than the server are never
  taken.

Budget:

- `process-room.test.ts:138`: the limit is learned from the first EAGAIN.
- `process-room.test.ts:446`: the learned limit holds turns, and is dropped
  after 31 minutes.
- `process-room.test.ts:398`: a turn waits with a notice when each engine is
  busy.
- `process-room.test.ts:829`: a browser waits 20 s, then gets
  `BROWSER_NO_ROOM`.
- `codex-process.test.ts:16`: slots go in order. An aborted waiter is
  skipped. A release works once.

## 7. Ours compared

Our code has nothing for this feature now. `crates/bot-engine/src/lib.rs`
(ours) has one line, a doc comment. `docs/threat-model.md` (ours) does not
exist yet, and the plan asks for it before step 9.

| Topic | The reference | Our plan |
|---|---|---|
| Start a process | `spawnCli` in `procs.ts:406-468`: own group on POSIX, `windowsHide`, run tag | Step 9, `bot-engine`. `comparison.md:85` (ours) names `tokio::process` and `process-wrap` 10 |
| Kill a tree | `killCliTree` in `procs.ts:604-706`. Returns a boolean | Step 9. No module named yet |
| Graceful stop | `stopEngineTree` in `engine-stop.ts:11-21` for some callers. Each driver chooses in `interruptTurn` | D22: `interrupt` is mandatory and not a flag. No time limit and no outcome type yet |
| Windows | `taskkill /T /F` (`procs.ts:670-705`) | P41: a test that starts and stops a fake engine with a tree on Windows |
| Restart sweep | `engine-records.ts`, POSIX only | Not planned |
| Permission broker | Unix socket or named pipe for the Claude CLI (`claude.ts:441-593`) | Step 10. Our first engine with requests is ACP (step 9), which sends them on JSON-RPC. No socket |
| Late ask, repeated id | Answered at once, denied (`claude.ts:475-497`) | Not planned |
| Process gates | Five gates (3.11) | `changelog.md` §7: a proposal for one gate. `plan/README.md:377` says "None. It comes with step 9" |
| Environment of the engine | All of `process.env` less a list (`acp/core.ts:333-346`) | P61: an allow-list |
| Fake engine | Many environment variables (`fake-claude-cli.ts:2-102`) | P63: one typed script file |

Where we differ: D10 makes the core run inside the desktop process. In the
reference, the turn gate is off in the desktop app (`process-room.ts:226-233`).
So for our first target, these limits of the reference apply:

- the threads for each bot (`bot-thread-limits.ts:5-30`).
- the idle-engine cap, 4 to 8 retained engines (`session-idle.ts:113-139`).
- the Codex start slots (`codex-process.ts:6-12`), which do not matter for
  an ACP engine.

## 8. Where we can be better

1. **A stop returns a type, not a boolean.** `killCliTree` returns `true` for
   "gone" and `false` for "not confirmed". It also returns `true` for a child
   that never started (`procs.ts:609`) and for a Windows root that exited
   while its children run (`procs.ts:670`). An enum
   `TreeStop { Gone, NotConfirmed { survivors }, NeverStarted }` makes the
   caller handle each case. Reason: a wrong state that the compiler refuses.
2. **Each stop has a limit, and `turn.completed` is always sent.** pi sends no
   `turn.completed` when its kill is not confirmed (`pi.ts:528-546`). Claude
   releases the turn (`claude.ts:1645-1650`). Codex retries for 60 s, then
   completes (`codex.ts:681-686`). The Stop route awaits `interruptTurn` with
   no limit (`index.ts:2243`). Our `interrupt` ends within a fixed time and
   the turn ends with an outcome such as `stop_failed`. D20 says
   `turn.completed` is always the last event. Reason: a known problem of the
   reference ("A turn or a wait that does not end").
3. **One stop ladder for all drivers, with values as data.** The reference
   has four ladders (3.5 table): Codex interrupts and waits 1.5 s, Claude
   kills at once, ACP waits 5 s, pi aborts. One function in `bot-engine`
   takes the steps: protocol interrupt (when the engine has one), end of
   input, SIGTERM, SIGKILL, each with a time. A driver gives only its
   protocol message and its times. Reason: less code, and the same stop on
   each engine.
4. **A Windows Job Object instead of `taskkill /T`.** `taskkill /T` fails when
   one process cannot be stopped (v0.1.140). A root that already exited
   gives `true` while its children run (`procs.ts:670`). There is no pid
   reuse check. A Job Object holds the whole tree from the start, and
   closing it ends each member, also a grandchild whose parent exited. The
   crate `process-wrap` has a Job Object wrapper for Windows and a process
   group wrapper for Unix. Check its version and license before we add it.
   Reason: a known problem of the reference (three Windows bugs in one
   function).
5. **Our side makes the request id.** The Claude broker trusts the id of the
   helper and needs a guard for a repeated id (`claude.ts:489-497`). Codex
   and ACP already make the id on the server (`codex.ts:806`,
   `acp/core.ts:619`). Our runtime gives each request its own id (D17) and
   keeps the JSON-RPC id of the engine only to send the answer. A repeated id
   from the engine then cannot replace a waiting request. Reason: a wrong
   state that the compiler refuses.
6. **A late request always gets a typed answer.** Follow the reference: never
   drop a request, because the engine then hangs (`claude.ts:476`). A request
   after the turn end gets a refusal at once, and opens no card
   (`claude.ts:475-488`, `acp/core.ts:524-531`). In Rust, the driver answers
   from an enum `RequestRefusal { TurnEnded, DuplicateId, TimedOut }`.
   Reason: follows the reference, and the `AGENTS.md` rule on typed refusals.
7. **One rule for the time of a request.** A Claude permission has 15 minutes,
   a Claude or Codex question has no limit, and an ACP question has 15 minutes
   (`claude.ts:511`, `codex.ts:838`, `acp/core.ts:672-675`). We use one
   limit for each kind, in one place. Reason: a known problem of the
   reference (a wait with no end, and three rules for one thing).
8. **Each wait for room has a limit and a reason.** The turn gate and the
   Codex slot wait until abort (`engine-memory.ts:533-567`,
   `codex-process.ts:35-54`). `changelog.md` §7 already says "A wait is a type
   that cannot be made without a limit and a reason". Reason: a known problem
   of the reference.
9. **Follow the idle-engine cap at step 9. Keep the other gates for later.**
   In the desktop (D10), the reference uses only two process limits: the
   threads for each bot, and the idle-engine cap (3.11). The cap is the one
   that step 9 needs, because our ACP driver keeps one process for each
   thread. Follow it: one list of idle engines across all drivers, a cap from
   the memory of the computer, and the least recently used closes first
   (`session-idle.ts:113-139`). The turn gate, the process budget and the
   memory watchdog are for servers in containers (`process-room.ts:226-233`).
   Their learned limit can come from a stderr line, not from a real refused
   start (`acp/host.ts:206-209`). It also drops to nothing after 30 minutes
   instead of growing back in steps (`process-room.ts:101`). When we need a
   server gate, one gate that counts memory and processes replaces the
   reference's three (the proposal of `changelog.md` §7). Reason: follows
   the reference for the desktop, and less code for the server.
10. **Keep the restart sweep.** The design of `engine-records.ts` is good: a
    random tag, a record with the start time, and a "clean" mark. It never
    finds a process by name. Follow it in `bot-engine` from step 9, because
    D10 runs the core inside the desktop, and a crash of the desktop leaves
    the engines running. Reason: follows the reference ("State lost at a
    restart or a crash" leaves processes).
11. **A test that steer never kills, from the first driver that steers.** The
    reference added the audit after the bug (`steer-sigterm-audit.md`). A
    test with a fake engine that checks the pid is alive after a steer, like
    `codex.test.ts:3729`, costs little. Reason: a known problem of the
    reference.
12. **Keep the research documents current.** The zombie-cards plan and the
    audit describe code that changed (3.6, 3.7). D19 keeps one page for each
    feature in `docs/`. Our page for step 9 says what the code does now.
    Reason: a known problem of the reference (old plans that a reader can
    take as true).

The problems of `changelog.md` section 5 that the reference has in this
feature:

- **Process control on Windows**: `taskkill` failures, the early `true`, no
  pid reuse check, pipe names (points 4, 1).
- **A turn or a wait that does not end**: the turn gate, the Codex slot, the
  question asks, the Stop route, pi with no `turn.completed` (points 2, 7, 8).
- **The same work done two times, or lost**: the repeated ask id, the late
  ask (points 5, 6). The reference handles both now.
- **Memory and the number of processes**: five gates (point 9).
- **"Busy" and races between bots**: a chat marked busy with nothing
  running (v0.1.151, fixed by `idle-threads.ts`). The broker socket path
  takes the bot id too (`claude.ts:414-421`, "scope broker socket by bot id",
  v0.1.76).
- **State lost at a restart or a crash**: engines left running after a crash
  (point 10). The reference handles it on POSIX only.
- **A secret or an access right in the wrong place**: the MCP config "carries
  credentials and argv is readable via `ps`" and is deleted at the turn end
  (`claude.ts:842-849`, `:1351`). The socket has mode 0600 and the broker
  refuses a path it cannot protect (`claude.ts:528-542`). Follow both.
- **One slow or stuck part blocks the others**: a Stop on a shared ACP
  process that times out ends the turns of the other threads too
  (`acp/core.ts:434-451`).

## 9. Not verified

- Whether the server writes the stopped row and its event in one
  transaction. Nobody found the store code for it.
- What the Stop route answers when `interruptTurn` throws. The route has no
  `try` at `bot-messages.ts:827`.
- Whether Codex reports a failed kill on the Stop path. `interruptTurn`
  ignores the result of `stop()` (`codex.ts:1552`).
- Whether a steered message that the engine had not read is lost on a plain
  Stop, for engines other than the chat API.
- The fixes for "EPERM unlink" (v0.1.57) and for the data folder lease after
  a reused pid (v0.1.83, v0.1.138). The lease is in
  `electron/data-dir-lease.mjs` and `server/data-dir-lease.ts`, which nobody
  read.
- The `.cmd` shim code of `server/env-path.ts` beyond the lines that a search
  found.
- How the bot sandbox limits the socket to its own bot (`claude.ts:1297`,
  `box: { rw: [socketPath] }`).
- Whether every error path of the Codex start gives the start slot back
  before the child exits.
- Whether a driver that never emits `turn.completed` and never throws holds a
  place in the turn gate for ever (`engine-memory.ts:538`, `:883`, `:940`).
- That "A stuck engine stops in minutes, not 15" (v0.1.132) is the 5-minute
  `DEFAULT_NO_SIGNS_STOP_MS` of ACP (`quiet-status.ts:325`). It is likely,
  but the release text is not in the clone.
- What makes a bot browser use fewer processes (v0.1.176), and the code for
  "about 3 GB to 1.6 GB" (v0.1.118).
- That Node's `detached: true` makes a new session on POSIX. The code
  depends on it (`procs.ts:296-297`). This is Node behaviour, not code that
  was read.
- That `process-wrap` has the Job Object and process group wrappers that
  point 4 names, and its current version and license.
