# The bot box

The record of how the reference project runs the process of a bot in a
sandbox on Linux, and of the parts around it: the list of permitted
environment variables, the egress gate, the harness gate, the credential
broker, the broker for MCP headers, the system-call filter and the
self-check.

- Reference: the reference project at commit `42f86aefd` (2026-11-27). It
  includes the release v0.1.184. Each path below is relative to its clone.
- Row of [`reference-features.md`](../reference-features.md): `bot-box.md`
  (parts 11 and 57 of [`README.md`](../README.md)).
- For no step yet of [`../../plan/README.md`](../../plan/README.md).
  Section 7 of [`changelog.md`](../changelog.md) puts the allow list of
  environment variables in step 9 and one gate for memory and processes in
  step 11. This file adds facts to both. It does not propose them again.
- Seven subagents read the files in groups: `box-core`,
  `box-checks-bridge`, `env-egress`, `broker`, `limits-attachments`,
  `callers-ui` and `history`. The main session checked the key lines
  against the code (section 2, "Checked by the main session").
- Borders with other research files:
  - [`security-model.md`](security-model.md), [`safety-floor.md`](safety-floor.md),
    [`write-only-secrets.md`](write-only-secrets.md) and
    [`file-modes-atomic-writes-redaction.md`](file-modes-atomic-writes-redaction.md)
    are not repeated. This file says only what the box adds to them.
  - [`github-sign-in.md`](github-sign-in.md) has the git broker
    (`server/bot-box/broker-github.ts`) and the push guard. This file did
    not read `broker-github.ts` again. It adds only the new facts of the
    push guard (section 3.6).
  - [`acp-adapter.md`](acp-adapter.md) has the credential helper of an
    unboxed bot.
  - The research file "vault-bitwarden" of this batch has the password
    manager and the `bw://` references. This file has only the broker side:
    the broker gets a plain value that the key store resolved before
    (section 3.8, step 2).
- Names: `<PRODUCT>_` is the upper-case prefix of the reference project's
  own name. `<STEERING>_` is the prefix of the steering engine. The data
  folder is the folder that holds all data of the server. `OMB_` is the
  prefix of the reference project's own settings.

## 1. In short

The **bot box** is a sandbox around each process that a bot starts: the
engine CLI, its shell commands, its MCP servers and the helper proxies of
the project (`docs/bot-box.md:3-6`). The reference project makes it with
**bubblewrap** (`bwrap`), a Linux program that starts a process in new
**namespaces**. A namespace is a kernel feature that gives a process its
own view of one resource: the mounted files, the process list, the network
or the host name. Bubblewrap runs without root through a **user
namespace**.

The box is on by default only on a **Cloud home** (a server of the
reference project on Linux, with `OMB_CLOUD_ROLE=home` or `team`). On every
other machine it is off, except when `OMB_BOT_BOX=1` is set. On macOS and
Windows it is always off (`server/bot-box/detect.ts:63-73`). So on the
desktop application, which is our product (decision D10), the reference
runs every bot without a box.

When the box is on, a boxed process sees this (`docs/bot-box.md:10-19`):

- The system folders, read-only.
- The HOME of the server, read-write. The **data folder** is replaced by an
  empty folder. Only the folders of the turn come back.
- A private `/tmp`, `/proc` and process list.
- A network with only a loopback interface. Three loopback ports are
  bridged to three unix sockets of the server: the **egress gate**, the
  **harness gate** and the **credential broker**.

The parts:

1. The **mount plan** (`server/bot-box/plan.ts`). A pure function makes an
   ordered list of mounts. A later mount wins over an earlier one. The
   order is the protection (`server/bot-box/plan.test.ts:87-92`).
2. The **environment allow list** (`server/bot-box/env.ts`). A boxed
   process gets only the variables on the list. The reference calls it the
   "second gate", after the strip that each driver does (`env.ts:1-3`).
3. The **egress gate** (`server/bot-box/egress-gate.ts`). An HTTP proxy that
   is the only way out to the internet. It resolves each name itself and
   connects only to public addresses.
4. The **harness gate** (`server/bot-box/harness-gate.ts`). It lets a boxed
   process reach only the server routes under `/api/internal/`.
5. The **credential broker** (`server/bot-box/broker.ts`). The real keys
   stay in the server process. The boxed process gets a random **token**
   and a base URL that points at the broker. The broker adds the real key
   and sends the request to a fixed address.
6. The **broker for MCP headers** (`server/bot-box/broker-mcp.ts`). The
   secret headers of a URL MCP server stay in the broker too. The engine
   gets a URL with no header.
7. The **system-call filter** (`server/bot-box/seccomp.ts`). A **seccomp**
   filter is a small program that the kernel runs on each system call. The
   reference refuses 34 system calls with the error `EPERM`, on x86-64 only.
8. The **sign-in masks** (`server/bot-box/sign-in-masks.ts`). In the
   server's HOME, a box keeps only the sign-in file of its own engine
   account. Every other sign-in file is covered by an empty read-only file.
9. The **self-check** (`server/bot-box/self-check.ts`, `box-probe.ts`). At
   start, the server runs a probe in a real box over a fake data folder with
   secret **canary** values. A canary is a marker that must never be seen.
   Each **mutation** (a weakened box) must fail exactly the check that
   guards it.

What the reference does not do:

- The box sets no limit on memory, CPU or processes (`plan.ts:379-388`).
- The box **fails open**. When it is wanted but cannot start, or when the
  self-check fails, the bots run as before. Only a log line and a report
  for the hosting Admin show it (`detect.ts:1-4`, `box.ts:329-330`,
  `boot.ts:41-44`).
- The window of the person shows nothing about the box (section 5).

## 2. Files read completely

All paths are in the reference clone at `42f86aefd`.

### Group `box-core`

- `docs/bot-box.md` (251), `server/bot-box/box.ts` (411),
  `server/bot-box/plan.ts` (436), `server/bot-box/boot.ts` (47),
  `server/bot-box/detect.ts` (73), `server/bot-box/hidepid.ts` (6),
  `server/bot-box/program-trust.ts` (41).
- Tests: `box.test.ts` (313), `plan.test.ts` (402), `detect.test.ts` (31),
  `program-trust.test.ts` (118), `turn-bot-folder.test.ts` (124),
  `hostile-home.test.ts` (101), `shutdown.test.ts` (65),
  `command-line-paths.linux.test.ts` (80), `box-cleanup.linux.test.ts` (59),
  `hardlink.test.ts` (48), `hardlink.linux.test.ts` (44), all in
  `server/bot-box/`.
- Ranges: `server/procs.ts` 330-470. `server/index.ts` 715-730.
  `server/drivers/claude-endpoint-folder.ts` 1-12.
  `server/drivers/acp/exit-report.ts` 14-24. `server/env-path.ts` lines 7,
  121, 137.

### Group `box-checks-bridge`

- `server/bot-box/seccomp.ts` (74), `self-check.ts` (174), `box-check.ts`
  (53), `box-probe.ts` (202), `bridge.ts` (36), `box-bridge.ts` (63),
  `relay.ts` (128).
- Tests: `seccomp.test.ts` (37), `self-check.linux.test.ts` (53),
  `bridge.test.ts` (78), `relay.test.ts` (101), `probe-box.test.ts` (81),
  `ask-socket.linux.test.ts` (69).
- Ranges: `deploy/install.sh` 36, 905-960. `server/drivers/claude.ts`
  325-350, 440-460, 1230. `server/drivers/antigravity-auth.ts` 65-130.
  `server/drivers/antigravity-acp.ts` 376-384, 642-644.
  `.github/workflows/ci.yml` 120-126, 211-218.

### Group `env-egress`

- `server/bot-box/env.ts` (95), `env.test.ts` (163), `egress-gate.ts` (133),
  `egress-gate.test.ts` (153), `harness-gate.ts` (88), `harness-gate.test.ts`
  (130), `git-push-guard.ts` (154), `git-push-guard.test.ts` (160),
  `sign-in-masks.ts` (70), `sign-in-masks.test.ts` (213),
  `sign-in-masks.linux.test.ts` (84), `tool-caches.ts` (127),
  `tool-caches.test.ts` (233), `tool-caches.linux.test.ts` (69),
  `retained-upload.linux.test.ts` (50), all in `server/bot-box/`.
- `server/browser/egress/policy.ts` (163).
- Ranges: `server/drivers/acp/core.ts` 105-125, 228-240, 322-360, 515-540,
  866-884, 1078-1092, 1415-1452. `server/credential-env.ts` 1-60.
  `server/browser/egress/gate.ts` 60-110. `electron/egress-addresses.mjs`
  15-103. `server/engine-homes/layout.ts` 53-124.
  `server/drivers/codex-shared-home.ts` 18-30, 140-156.
  `server/drivers/acp/opencode-go.ts` 712-720. `server/drivers/pi-agent-dir.ts`
  1-8. `server/mcp-environment.ts` 30-37.

### Group `broker`

- `server/bot-box/broker.ts` (246), `broker.test.ts` (165), `broker-env.ts`
  (89), `broker-env.test.ts` (60), `broker-headers.ts` (63),
  `broker-headers.test.ts` (168), `broker-mcp.ts` (85), `broker-mcp.test.ts`
  (143), `broker-mcp-refusal.ts` (31), `broker-mcp-refusal.test.ts` (157),
  `broker-probe.ts` (49), `broker-probe.test.ts` (66), all in
  `server/bot-box/`.
- `server/testing/saved-key-broker-host.ts` (44),
  `server/team-personal-mcp-broker.e2e.test.ts` (113),
  `server/mcp-app-connections-box.test.ts` (113),
  `server/github/git-access.ts` (44), `server/github/git-env.ts` (53).
- Ranges: `server/procs.ts` 425-456, 730-743. `server/mcp-result-budget.ts`
  1-40. `server/host/mcp-config.ts` 60-95. `server/host/mcp-servers-host.ts`
  94-175.
- Not read again: `server/bot-box/broker-github.ts`. Its facts come from
  [`github-sign-in.md`](github-sign-in.md).

### Group `limits-attachments`

- `server/box-memory.ts` (39), `server/box-memory.test.ts` (45),
  `server/box-cpus.ts` (7), `server/box-attachments.ts` (50),
  `server/box-attachments.test.ts` (129),
  `server/box-attachments.linux.test.ts` (65), `server/local-vm-box.ts` (29),
  `server/local-vm-box.test.ts` (36), `server/bot-memory-cap.ts` (460),
  `server/bot-thread-limits.ts` (36), `server/cache-sweep/limits.ts` (55).
- Ranges: `server/data/engine.ts` 60-140. `server/perf/process-health.ts`
  1-30, 90-181. `server/process-room.ts` 1-46, 211-233.
  `server/drivers/codex-process.ts` 1-30. `server/process-limits.ts` 48-58,
  73-83. `server/engine-memory.ts` 1-61, 76-88, 871-872.
  `server/attachments.ts` 185-215.

### Group `callers-ui`

- `server/drivers/codex-mcp-mount.ts` (77), `server/engine-homes/layout.ts`
  (124), `server/host/team-box-scope.ts` (42),
  `server/drivers/claude-box.test.ts` (237),
  `server/drivers/antigravity-box.linux.test.ts` (54),
  `server/engine-homes/box.linux.test.ts` (73),
  `server/host/team-box-scope.test.ts` (160).
- Ranges: `server/procs.ts` 1-60, 170-200, 300-560. `server/index.ts` 147,
  278, 281, 715-728, 949-950, 1356, 2357, 2784, 6366, 7785-7795, 7970-8020,
  8305, 8317, 9915-9930, 9992, 10174, 12039, 12200, 12235-12252.
  `server/drivers/acp/core.ts` 23, 78, 100-130, 520-545, 670-690, 920-945,
  1438-1452. `server/routes/cloud-signed.ts` 1-95, 160-180.
  `server/cloud-health.ts` 37-38, 269-270, 292-298, 364.
  `server/drivers/pi.ts` 188-245, 410-435, 900-912.
  `server/drivers/muse-code.ts` 90-100, 225-240, 280-305.
  `server/env-path.ts` 105-175. `server/engine-install.ts` 130-192, 228-245.
  `server/drivers/session-idle.ts` (lines with "box").
  `src/components/ComputerPanel.tsx` 133-189, 368-376, 543-618, 1090-1112,
  1512-1525. `src/locales/en.json` 545-551, 1318, 5285-5334, 6999, and a
  search for box, sandbox, bubblewrap, isolation and egress.
  `server/config.ts` 346, 454-455. `server/routes/status.ts` 41-66.

### Group `history`

- `server/container-runtime-probe.ts` (38),
  `apps/docs/content/docs/changelog/index.mdx` (15), and the files above
  that it read again for the current lines.
- Release notes: `announcements/releases.json` (v0.1.154 to v0.1.184, lines
  1-30, 135-190 and single lines found by a search), and the GitHub release
  notes of the older releases (`gh release view`).
- Git history: `git log` of `server/bot-box/`, `docs/bot-box.md` and
  `server/box-*.ts`, and the commits named in section 8.
- Ranges: `server/oom-score.ts` 1-30. `server/cloud-health.ts` 232-250,
  355-368. `server/container-computer.ts` 245-262.
  `server/container-computer.test.ts` 309-377. `server/cloud-secrets.ts`
  lines 5-27.

### Checked by the main session

The main session read these lines again at `42f86aefd` and found them as
the readers said:

- `server/bot-box/detect.ts` 1-4, 50-73. `server/bot-box/box.ts` 155-210,
  278-340, 397-411. `server/bot-box/boot.ts` 14-47.
  `server/bot-box/plan.ts` 250-266, 371-390.
- `server/index.ts` 718-726. `server/procs.ts` 344-353, 420-456, 725-743.
- `server/bot-box/broker.ts` 1-20, 186-213, 231-241, and a search for a
  time limit (none). Every production caller of `revokeThread(` (only
  `broker-probe.ts:44`). `server/bot-box/broker-mcp.ts` 40-62.
- `server/bot-box/env.ts` 44-72. `server/bot-box/egress-gate.ts` 28-34.
- `server/bot-box/self-check.ts` 150-173.
  `server/bot-box/self-check.linux.test.ts` 26-52.
  `server/bot-box/box-probe.ts` 160-172. `server/bot-box/seccomp.ts` 56-61.
  `server/bot-box/bridge.ts` 19-30. `server/bot-box/relay.ts` 8-10.
- `server/engine-homes/layout.ts` 57-68. `docs/bot-box.md` 183-251.
  `server/drivers/claude.ts` 326-347, 1230. `server/local-vm-box.ts` 21-29.
  `server/bot-memory-cap.ts` 1-11. `server/box-attachments.ts` 27-44.
- The commit `b5a333128` and its first tag (v0.1.181).

## 3. How it works

### 3.1 The decision at start, and the gates

1. `server/index.ts:721` deletes the Cloud home secret keys from the
   environment of the server. Then `index.ts:722` awaits
   `startBotBoxAtBoot`. The comment says that the decision is made "before
   any engine starts". This is a top-level `await` with no `try`.
2. `startBotBoxAtBoot` calls `box.start` with the data folder, the HOME of
   the server, the port and the deny set `BOX_DENY_ENV`
   (`server/bot-box/boot.ts:14`, `:31`). The deny set is the workspace
   credentials and the control-plane names (`server/credential-env.ts:5-43`).
3. `detectBox` decides one time (`detect.ts:63-73`). The order:
   1. `OMB_BOT_BOX` is `0`, `off`, `false` or `no`: off, reason
      `switched-off` (`:65`, values at `:33-38`).
   2. `OMB_BOT_BOX` is not set and the server is not a Cloud home: off,
      reason `not-cloud` (`:66`).
   3. The platform is not Linux: off, reason `not-linux` (`:67`).
   4. No `bwrap` on `PATH`: off, reason `no-bwrap` (`:69-70`).
   5. The probe fails: off, reason `userns-refused` (`:71`). The probe is a
      `spawnSync` of `bwrap` with five namespaces and `/bin/true`, with a
      time limit of 5 s (`:50-61`). It does not test `--unshare-cgroup-try`
      or `--seccomp`, which a real box uses (`plan.ts:379-381`). Each
      failure of the probe, a time-out too, gets the reason
      `userns-refused`.
   6. Else on. `socat` is optional (`:72`). Without it, a Node bridge takes
      its place.
   - The type `BoxKind` also names `gvisor` and `user` (`detect.ts:9`).
     `detectBox` never returns them.
4. Box off: `start` writes the log line `bot box: off (<reason>)` and
   returns (`box.ts:283-286`). Nothing else changes.
5. Box on (`box.ts:287-312`):
   1. Make `<data folder>/box` with mode `0700`.
   2. Delete old `egress.sock`, `harness.sock` and `broker.sock` without a
      check (`rmSync` with `force`, `:290`).
   3. Open the egress gate, the harness gate and the credential broker, one
      after the other (`:291-293`). If one of them throws, `start` throws.
      The gates that opened before stay open. Then the boot of the server
      fails, because `index.ts:722` has no `try`.
   4. Write the seccomp filter to `<data folder>/box/seccomp.bpf` with mode
      `0600`, on Linux x86-64 only (`:231-236`, `:294`).
   5. Make three bridges: egress at port 3128, harness at the port of the
      server, broker at port 18080 (`:295-299`, constants `:29`, `:33`).
   6. Make the `BoxRunner` with the code roots, the folders of the engines
      that the app installed, the deny set, the filter, the broker and the
      tool-cache switch (`:300-307`).
   7. Distrust the program folders in HOME (section 3.9) (`:309-310`).
   8. Write the log line `bot box: on (bubblewrap, socat|node bridges,
      credential broker, seccomp on|unsupported here)` (`:311`).
6. Back in `startBotBoxAtBoot`: the server removes the HOME program folders
   from its own `PATH` (`boot.ts:33`).
7. After 5 s, on a timer that does not keep the process alive, the
   self-check runs one time (`boot.ts:17`, `:36-46`, section 3.11). The
   result goes to `box.noteChecks` and to the log. A failed check does not
   turn the box off.

### 3.2 One boxed spawn

All engine processes start through `spawnCli` (`server/procs.ts:407-475`).

1. `boxedSpawn` decides (`procs.ts:345-353`). `box: false` means never. The
   owner `bot` is boxed by default. Another owner is boxed only when the
   caller gives `box`. The request adds the thread and the bot of the
   current turn, a project folder turn (`projectFolderTurn`, `:358-364`)
   and the engine home of a Team Cloud audience.
2. `botBox.wrap` returns `null` when the box is off (`box.ts:329-330`). The
   caller does not branch: the same spawn runs without a box.
3. Not boxed: `outsideBoxOptions` runs (`procs.ts:394-405`). An unboxed
   `bot` spawn gets the server's GitHub sign-in as a git credential helper
   (`:423-425`, see [`acp-adapter.md`](acp-adapter.md)).
4. Boxed: `BoxRunner.wrap` (`box.ts:138-188`) does these steps:
   1. Find the bot and the thread from the working folder (`:112-119`).
   2. Make the uploads folder of the conversation with mode `0700` before
      the box starts, so a later upload shows in a running box
      (`:143-147`). An error is logged, not thrown.
   3. A read-only Team Cloud turn in the bot's folder: make `memory` and
      `skills` first, so that the turn cannot make them (`:148-153`).
   4. Add the folders that the conversation lent (`lend`, `:130-136`) and
      the audience rule of a Team Cloud.
   5. Compute the sign-in masks, only when the request has no home of its
      own (`:157`, section 3.9).
   6. Make the plan (`planBox`, `:158`, section 3.3).
   7. Filter the environment with the allow list (`:160-162`, section 3.4).
   8. Add the HOME program folders to the box's `PATH`, after the others
      (`:163-165`). In the box they are the bot's own programs.
   9. Set the tool-cache variables when that switch is on (`:166-168`).
   10. With its own network: set `HTTPS_PROXY`, `HTTP_PROXY` and their
       lower-case forms to `http://127.0.0.1:3128`. Set `NO_PROXY` and
       `no_proxy` to `127.0.0.1,localhost,::1,[::1]` (`:169-174`). The
       bracketed form is for Node.
   11. Add the bridges and the relay (`:175-177`, section 3.7).
   12. Swap the keys for a broker token (`:178`, `:194-210`, section 3.8).
       The broker mints a token with no grant, rewrites the environment to
       learn the grants, revokes that token, then mints a second token with
       the grants and the GitHub grant (`:200-209`).
   13. Name the keys that stay raw (`unbrokered`, `:180-181`).
   14. Open the filter file and keep its descriptor (`:182`).
   15. Return `bwrap <mounts> <options> -- <bridge starter> <engine>`
       (`:183`).
   - Error path: a throw in steps 13 to 15 closes the descriptor and
     revokes the token (`:184-188`). The test
     `box-cleanup.linux.test.ts:16-58` proves it for a refused hard link.
     A throw before step 12 has no token yet.
5. `spawnCli` passes the filter descriptor after stdio only when stdio is a
   plain list of three (`procs.ts:426-427`). Else the descriptor is not
   passed, but the arguments still say `--seccomp 3` (`plan.ts:381`).
6. On POSIX the spawn is `detached`, so the child has its own process group
   (`procs.ts:434`). The plan has no `--new-session`, and a test checks that
   (`plan.test.ts:94`).
7. A `bot` spawn gets the highest OOM score, so the kernel stops it first
   when memory runs out (`procs.ts:440`, `server/oom-score.ts:8`, `:20-21`).
8. The parent closes the filter descriptor in `finally` (`procs.ts:446-448`).
9. The token is revoked when the child sends `exit` (`procs.ts:453`).
   - Edge case: when `spawn` throws at once, only the GitHub helper is
     released (`:441-445`). When the child reports `error` with no process
     id, the GitHub helper is released (`:454`), but the box token is not.
     So the token can live to its limit of 24 hours.
10. Process trees are recorded on Linux and macOS (`procs.ts:455-469`).

`execCliBoxed` (`procs.ts:479-516`) is the same path for a short command,
such as a model list. Its output is at most 1 MiB for each stream. A
time-out stops the process tree. `execCli` (`:520-560`) is never boxed.

Which spawns are boxed (when the box is on): every engine that a driver
starts as owner `bot`, and every spawn with an explicit `box`. The
`callers-ui` reader found these calls: `server/drivers/claude.ts:1230`,
`claude-keepwarm.ts:126`, `codex.ts:554`, `acp/core.ts:535` and `:1447`,
`acp/browser-auth.ts:137`, `pi.ts:200`, `:240`, `:428`,
`muse-code.ts:296`, `antigravity-acp.ts:384`,
`antigravity-native-login.ts:140`, the model probes `acp/deepseek.ts:213`,
`acp/opencode-go.ts:199`, `:221`, `acp/opencode-probe.ts:176`,
`acp/hermes.ts:287`, and the person's own stdio MCP servers
(`chat-mcp-tools.ts:169`). Not boxed: npm installs
(`engine-install.ts:237`), `execCli`, the `--version` read of Pi
(`pi.ts:905-908`), the bot's browser except on a Team Cloud
(`index.ts:2357`), and every spawn on macOS and Windows.

A driver states its needs as data in each spawn:
`box: { rw, ro, net, allowEnv, botThreads, relay, configured, engine }`
(`procs.ts:335`). `engine` is the name of the driver. It chooses which
sign-in files stay (`plan.ts:100-101`, `layout.ts:57-68`). Some calls write
the name as a literal (`claude-keepwarm.ts:126`, `acp/deepseek.ts:213`,
`acp/opencode-go.ts:199`). Some leave it out (`acp/hermes.ts:287`,
`antigravity-acp.ts:384`). There is no capability flag for the box.

### 3.3 The mount plan

`planBox` (`plan.ts:224-390`) is pure. Its only I/O is a `stat` in
`assertReadOnlySource` (`:213-222`). Bubblewrap applies the mounts in order,
and a later mount wins. `visibleInBox` (`:421-432`) models that rule for the
tests. The order:

1. System, read-only: `/usr`; the links `/bin`, `/lib`, `/lib64`, `/sbin`
   to `usr/*`; the whole `/etc`; `/opt` and `/var/lib` if present; the two
   CPU list files `/sys/devices/system/cpu/possible` and `online`
   (`:228-238`). Nothing else of `/sys`. Without `possible`, a TCMalloc
   program stops with exit 134 (`plan.test.ts:158-172`).
2. The code roots, read-only (`:239-243`).
3. `--proc /proc`, `--dev /dev`, and a `tmpfs` on `/tmp`, `/var/tmp` and
   `/run` (`:244-247`).
4. HOME, read-write, when the request has no home of its own (`:256-257`).
5. The folders between HOME and each sign-in file, each bound over itself
   (`:258-259`).
6. The data folder: a `tmpfs` over it, if it is in HOME (`:260-265`). A data
   folder outside HOME was never mounted, so it needs no line
   (`plan.test.ts:224-230`).
7. The engine home of the audience, read-write (`:266`).
8. A process that all conversations of a bot share: all its conversation
   folders, or on a Team Cloud only the allowed ones (`:274-283`).
9. The working folder, the bot's own folder `workspaces/<bot>`, and the
   conversation folder, read-write (`:284-298`).
10. The absolute values of `PATH_ENV_NAMES` (`CLAUDE_CONFIG_DIR`,
    `CODEX_HOME`, the XDG folders, `TMPDIR` and the engine homes, `:204`),
    read-write. For a server that the person configured, a value in the data
    folder is skipped, except the bot's own folders (`:303-309`). The
    reason: a person's MCP server must not make server files writable
    (`:84-87`).
11. The `rw` paths of the request (`:310`).
12. The Team Cloud sign-in files, bound into the audience home (`:311-315`).
13. The engines that the app installed, read-only, after every read-write
    line (`:316-320`). So no read-write line makes an engine writable.
14. The uploads of the conversation, read-only (`:321-329`).
15. The team folder and other conversations, read-only (`:330-338`).
16. Read-only extras (`:339-360`): the `ro` paths of the request, the
    absolute paths on the command line, and the bot's `SOUL.md`. "A command
    line is not a grant": a path in or above the data folder shows only when
    the caller names it in `ro`, or it is in a bot folder (`:351-354`). A
    real-box test proves it (`command-line-paths.linux.test.ts:43-47`).
17. Team files at `/team-files` (`:362-369`).
18. Last: the sign-in lines (`:371-377`). The own sign-in files are bound
    over themselves. Each other sign-in file gets `--ro-bind /dev/null`. The
    folder `.omb-edge` (the TLS keys of the server) gets a `tmpfs`.
19. Options (`:379-388`): `--unshare-user --unshare-ipc --unshare-uts
    --unshare-cgroup-try --die-with-parent --hostname omb-box`, then
    `--unshare-pid`, `--seccomp 3`, `--unshare-net` with a `/run/omb` folder
    and the bridge sockets for a box with its own network, and `--chdir`.

Limits and edge cases:

- A read-only source that is a regular file with more than one hard link is
  refused with an error, at plan time and again when the arguments are made
  (`:213-222`, `:350`, `:406`). Reason: a second name in a writable folder
  could change the file. Folders are not checked (`:216`). A writable bind
  of a hard-linked file is allowed (`hardlink.test.ts:43-47`).
- A mount without `-try` whose source is missing stops bubblewrap before the
  engine starts: `/usr`, `/etc`, HOME, the working folder, the bot folder,
  the `PATH_ENV_NAMES` values, `rw` and the sockets. A driver must make
  such a folder first. Example: `server/drivers/claude-endpoint-folder.ts:3-7`
  and the test `claude-box.test.ts:165-203` ("Can't find source path").
- The plan has no `--clearenv`. The environment is the filtered spawn
  environment (`box.ts:160-162`, `:183`).
- Each mutation (`bind-data`, `bind-otherws`, `share-pid`, `share-net`,
  `env-all`, `tmp-shared`, `no-seccomp`, `engines-rw`) opens one hole
  (`plan.ts:57-58`). `plan.test.ts:297-319` checks that each one changes
  only its own check.
- An identifier must match `^[A-Za-z0-9_-]{1,128}$` (`plan.ts:153`), so
  `../bot-b` is refused (`plan.test.ts:375-392`).

### 3.4 The environment allow list

`boxEnvironment` (`env.ts:76-89`) makes a new object for each spawn. For each
name, `boxEnvironmentAllows` (`env.ts:66-72`) decides in this order:

1. On the never list or under the never prefix `OMB_CLOUD_`: refused
   (`:67`). The never list (`:56-60`) has the license key, the installation
   credential, the loopback trust, the two Cloud descriptors, the data,
   static and DuckDB folders, the two ports, and the CLI session token and
   address `<PRODUCT>_TOKEN` and `<PRODUCT>_URL`. These two would otherwise
   pass under the `<PRODUCT>_` prefix (`:53-55`).
2. In the spawn's `allow` set and not an `OMB_` name: accepted (`:68`).
   `allow` lifts both the allow list and the deny set, for that process
   only (`:63-65`).
3. In the deny set: refused (`:69`).
4. An `OMB_` name: accepted only if it is one of about 75 names or 4
   families (`:25-43`, `:70`).
5. Else accepted only if it is one of about 50 names (shell, locale, Node
   and TLS, proxies, XDG, display, git identity, `:6-17`) or has one of 35
   prefixes (`:46-51`, `:71`).

Edge cases:

- `SSH_CONNECTION` passes only with the value `127.0.0.1 0 127.0.0.1 0`
  (`:14-20`, `:85`). One engine keeps its sign-in in a file only while this
  variable is set.
- The 35 prefixes are wide. Any `GOOGLE_*`, `CLAUDE_*`, `MCP_*`, `META_*` or
  `PI_*` name of the server passes. No test covers that. The feature page
  says it: the list does not stop "the engines' own settings"
  (`docs/bot-box.md:240`).
- `allow` can lift any name that is not `OMB_` and not on the never list
  (`env.ts:68`). Nothing refuses a name such as `LD_PRELOAD` there.
- Names compare with case (`:67-71`). The older strip of the drivers
  compares without case, because Windows does (`credential-env.ts:49-54`).
- `ALL_PROXY` is on the list but the box does not overwrite it
  (`env.ts:10`, `box.ts:31`, `:168-173`).
- The tool-cache step puts back six cache variables that the list dropped,
  with the value the spawn got (`tool-caches.ts:123`).

How a driver adds names: `instanceEnvNames(instance, env)` (`env.ts:93-95`)
returns the names of the engine instance's saved environment whose value in
the spawn is still the saved value. The ACP core passes it in each spawn
(`acp/core.ts:535`, `:1447`), and so do Muse (`muse-code.ts:296`) and Pi's
model list (`pi.ts:200`). An MCP spawn passes all names of its server's
environment, with no value check (`server/mcp-probe.ts:256`,
`chat-mcp-tools.ts:169`). The merge order keeps the server's own value out
(`server/mcp-environment.ts:33`, `:36`). The Claude driver passes no
`allowEnv` (`claude.ts:1230`). Codex passes the names of the person's
configured stdio MCP servers (`codex-mcp-mount.ts:44-53`, `codex.ts:554`),
and removes them from its command shell (`codex.ts:524-526`).

The test "every OMB_ name the server knows has a decision"
(`env.test.ts:149-155`) reads all source files with `git ls-files` and
fails on an `OMB_` name that is on neither list. The server-only list in the
test has about 306 names (`env.test.ts:9-66`). There is no such test for
the prefixes.

### 3.5 The egress gate

An HTTP proxy on `<data folder>/box/egress.sock` (`egress-gate.ts:1-4`,
`:48-133`). In the box it is `127.0.0.1:3128`.

1. A plain HTTP request must have an absolute `http://` URL. Else 400 "The
   box's network gate takes absolute http:// URLs or CONNECT."
   (`:75-80`). TLS must use `CONNECT`.
2. A `CONNECT` target must be `host:port` or `[v6]:port`, port 1 to 65535.
   Else 400 (`:40-46`, `:103`).
3. The gate resolves the name itself with `dns.lookup` on the server
   (`server/browser/egress/gate.ts:75-80`). `localhost` and `*.localhost`
   become loopback. No address: 502 "The name could not be resolved."
   (`egress-gate.ts:65`, `:86`, `:107`).
4. Every address must pass (`policy.ts:118-128`). The rules
   (`egress-gate.ts:28-34`) let only public addresses through, on any port.
   Loopback and the server's own interfaces are refused as `omb`. Private
   ranges are refused as `local-network`. Metadata, link-local and reserved
   addresses are refused with their names (`policy.ts:136-147`,
   `electron/egress-addresses.mjs:19-31`, `:84-97`).
5. A refusal is 403. For `CONNECT` it has the header `X-Omb-Blocked:
   <reason>` (`egress-gate.ts:85`, `:106`). The gate counts refusals. No
   production caller passes `onRefusal`, so a refusal is not logged by
   target (`box.ts:291`).
6. The connection uses only the checked addresses (a pinned lookup,
   `egress-gate.ts:70-71`, `:91`, `:108`). This stops DNS rebinding. The test
   `egress-gate.test.ts:72-76` proves it.
7. Hop-by-hop headers and `proxy-authorization` are dropped (`:38`, `:88`).
8. A thrown error gives 502 `gate_error` and the gate keeps serving
   (`broker-headers.ts:40-55`).

Limits: no host list, no port limit, no time limit on DNS, on the connect or
on an idle tunnel, no byte or connection limit, and no identity of the bot.
One socket serves all boxes (`box.ts:287-292`). Node runs `dns.lookup` on a
small thread pool (a Node fact, not verified here), so slow names from bots
could slow other work of the server.

Other user: the mail service of the server uses `boxRefusal` to refuse a
private mail server: "My Cloud can only reach mail servers on the public
internet." (`server/email/service.ts:37`).

### 3.6 The harness gate, and new facts of the push guard

The harness gate (`harness-gate.ts:1-88`) is a unix socket. In the box it is
bridged to a loopback port with the same number as the server's port, so
`OMB_HARNESS_URL` needs no change (`:2-3`, `box.ts:297`).

1. `harnessTarget` takes the part before `?` (`:28`). It refuses a path
   that does not start with `/`, starts with `//`, or has `..` or `\`
   (`:29`).
2. It parses the path with the WHATWG URL parser, so `%2e%2e` segments are
   resolved as the server resolves them (`:25-35`).
3. Only a path under `/api/internal/` passes (`:9`, `:36`). The gate sends
   the parsed path and query, never the raw form.
4. Else: 403 `{"error":"not_a_harness_route"}`, and the server never sees the
   request (`:47-51`). An `Upgrade` (WebSocket) gets a raw 403 (`:73-75`).
5. Method, query, body and the `authorization` bearer pass (`:53-55`,
   test `harness-gate.test.ts:66-76`). The gate does not check the bearer.
   The server checks the bearer of the turn.
6. The server not there: 502 `harness_unreachable` (`:62-65`).

Limits: no rate, body or time limit. The list of hop-by-hop headers does
not have `proxy-authorization` (`:39`).

The push guard (`git-push-guard.ts`) did not change since `fcce0b6de`. New
facts beyond [`github-sign-in.md`](github-sign-in.md): it accepts object
names of 40 or 64 hex digits (SHA-256 repositories, `:13-14`). It cuts a
reason to 900 characters and replaces CR, LF and NUL with a space (`:136`).
Its reader is incremental: a list of about 1 MiB in 100-byte pieces takes
less than 3 s (`git-push-guard.test.ts:48-61`).

### 3.7 Bridges and the relay

A box with its own network has only loopback. Three loopback ports are
bridged to the three host sockets, which the plan binds at
`/run/omb/<name>.sock` (`bridge.ts:1-3`, `plan.ts:382-386`).

1. With `socat` and no relay (`bridge.ts:19-28`): a `/bin/sh -c` script
   starts one `socat` for each bridge in the background, with `fork` for
   each connection. It waits for the first bridge only: at most 100 tries of
   0.2 s with 0.01 s between them. Then it starts the engine with `exec`.
   If the bridge never answers, the engine starts anyway, with no error.
2. Without `socat`, or with a relay: one Node process runs `box-bridge.js`
   and stays the parent of the engine (`bridge.ts:30`,
   `box-bridge.ts:44-56`). It opens all bridges. If a port is in use, it
   exits with 1 before the engine starts. It sends SIGTERM, SIGINT and
   SIGHUP on to the engine. Any death by a signal gives exit 143
   (`box-bridge.ts:53-54`). A bridge has no connection limit and no idle
   time limit (`:31-38`).
3. Cost: about 5 ms and 3 MB for each box, plus one `socat` for each bridge
   (`docs/bot-box.md:59`, measured by the reference).

The relay (`relay.ts`) lets the server reach a port inside an isolated
box, for the OAuth callback of one engine's sign-in.

1. The server listens on `<data folder>/box/relay-<12 hex>.sock`
   (`box.ts:340-343`). The plan binds it at `/run/omb/relay.sock`
   (`plan.ts:386`).
2. The box dials out and keeps one connection waiting (`relay.ts:71-128`).
   It dials again 1 s after a waiting connection closes.
3. To connect, the server takes a waiting connection, or waits up to 10 s
   ("The sign-in's box did not answer."), and writes `<port>\n`
   (`relay.ts:45-58`).
4. The box side checks the line (at most 6 bytes, `^[1-9]\d{0,4}$`, at most
   65535), connects to `127.0.0.1:<port>` in the box and pipes both ways
   (`:93-116`).
5. Limits: 4 waiting connections. A fifth is closed (`:8-10`, `:24-34`).
6. The only user is one engine's sign-in (`antigravity-auth.ts:79`,
   `antigravity-acp.ts:384`, `:643-644`). The test
   `antigravity-box.linux.test.ts:37-53` shows that a direct forward from
   the server's loopback fails with `ECONNREFUSED` and the relay works.
7. Any process in the box can take a waiting connection, and so get the
   callback with the OAuth code (`relay.ts:24-29`, `:46`). It is the same
   box and bot.

The gate and relay sockets get no `chmod`. Only the `0700` folder protects
them (`box.ts:288`, `relay.ts:37`).

The permission socket (the "ask" socket of the question and approval tool)
is not one of the bridges. It is `<data folder>/perm-<tag>.sock`
(`procs.ts:738-743`, `claude.ts:328-335`), or a fallback in `/tmp`
(`claude.ts:340-346`). The Claude driver puts it in the box with `rw`
(`claude.ts:1230`). The server sets mode `0600` after `listen`
(`claude.ts:441-453`), so there is a short time with the default mode.

### 3.8 The credential broker

The broker is a Node HTTP server on the unix socket
`<data folder>/box/broker.sock` (`broker.ts:222-224`, `box.ts:287-293`). In
the box it is `http://127.0.0.1:18080` (`broker.ts:104-106`). It has no TCP
port of its own.

The token and its life:

1. A token is `omb_t0_` and 24 random bytes as hex (`broker.ts:15`, `:139`).
   The broker keeps only its SHA-256 hash and compares with a constant-time
   compare (`:124`, `:142`, `:149`).
2. A grant is a fixed upstream URL and the headers to add (`:23-35`). A
   grant name must match `^[a-z][a-z0-9_-]{0,63}$` (`:65`).
3. Two kinds: a process token (24 hours at most, revoked at the exit of its
   process, `:17`) and a conversation token (24 hours after its last turn,
   `:19`, `touchThread` at `:231-234`).
4. At most 10,000 live tokens. Then the mint throws "The credential broker
   holds too many tokens." (`:20`, `:137`). Old tokens go only at a mint, at
   `stats()` or at a lookup (`:131-136`). No timer sweeps them.
5. The state is in memory only (`:128`). A restart ends all tokens.
6. The broker keeps the bot and the conversation of a token, but it never
   compares them with the request (`:145-154`). The token is a bearer token.

How a key reaches the boxed process (`broker-env.ts:62-89`):

1. Five keys are brokered: `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`,
   `OPENAI_API_KEY`, `GEMINI_API_KEY` and `GOOGLE_API_KEY`
   (`broker-env.ts:22-28`).
2. The key variable gets the token. The base URL variable gets
   `http://127.0.0.1:18080/b/<token>/<grant>` (`:81-85`).
3. A base URL that the server had (http or https, with no user name or
   password) becomes the fixed upstream. Else the default upstream of the
   provider (`:49-56`).
4. Two keys behind one base URL share one grant with both headers (`:72-77`).
   Before v0.1.177 the second key stayed raw (commit `ac66ed052`).
5. Sixteen named keys whose CLI takes no base URL stay raw in the box. The
   report names them under `broker.unbrokered` (`:31-34`, `:87`,
   `docs/bot-box.md:227-229`).
6. A key name that the spawn vouched for (`allowEnv`), that ends with `KEY`,
   `TOKEN` or `SECRET` and that kept its raw value, is also named as raw
   (`box.ts:180-181`).

A request through the broker (`broker.ts:157-213`):

1. The address is `/b/<token>/<grant>/<path>`, or `/g/<grant>/<path>` with
   the token in the header `x-omb-broker` (`:59-61`, `:159-164`). Only git
   uses the second form, so git never writes the token into its files
   (`server/github/git-env.ts:28-40`). Another path: 404 `not_found`.
2. An unknown or malformed token: 401 `unknown_token`. An expired token: 401
   `expired_token`. A grant that the token does not have: 403 `not_granted`
   (`:145-154`).
3. A grant with `serve` answers by itself (the GitHub grant, `:167-170`).
4. The broker drops the credential headers that the client sent
   (`authorization`, `x-api-key`, `x-goog-api-key`, `proxy-authorization`,
   `cookie`, `x-omb-broker`) and sets the grant headers (`:62`, `:68-72`,
   `:183`). The upstream host is fixed. The client path is added to it
   (`:116-122`).
5. A saved header that Node cannot send (a control character, a character
   outside Latin-1): 502 `unusable_credential`. The body names the grant and
   the header, never the value (`:173-181`, `broker-headers.ts:30-37`). A
   key is also trimmed when it is minted (`broker.ts:141`).
6. The upstream does not answer: 502 `upstream_unreachable` (`:211`).
7. A 401 to an MCP `tools/call` POST, with a body of at most 1 MiB, becomes
   a 200 with a JSON-RPC tool error in words (`:190-206`,
   `broker-mcp-refusal.ts:8`, `:22-31`). The words tell the model to call
   `mcp_server` with `sign_in`, or to use the connected app, and "Don't
   retry" (`broker-mcp-refusal.ts:12-17`, `:27-29`). Other 401 answers pass.
8. An `Upgrade` gets a raw 403 (`:219-220`).
9. A throw gives 502 `gate_error`, and the broker keeps serving
   (`broker-headers.ts:40-63`).

There is no time limit on the upstream request (`broker.ts:196`, and no
`timeout` in the file). A stuck upstream holds the connection until the
client closes it (`:213`). There is no limit of connections for each token.

The broker for MCP headers (`broker-mcp.ts:34-68`):

1. Box off: the list of servers comes back unchanged, with the real headers
   (`:40`).
2. `touchThread` keeps the earlier grants of the conversation alive (`:42`).
3. Each URL server with a valid name (`^[a-z0-9][a-z0-9_-]{0,47}$`, with no
   case) gets a grant `mcp-<name>` with its headers (`:18`, `:46-50`). A
   stdio server keeps its environment, and its secrets stay raw in the box
   (`broker-mcp.test.ts:34`, `mcp-app-connections-box.test.ts:68-69`).
4. A SHA-256 fingerprint of the grants decides if the old token can stay
   (`:53-56`). A changed header gives a new token. The old token is not
   revoked (`:57-60`). It still slides with each turn (`:42`).
5. The engine gets `http://127.0.0.1:18080/b/<token>/mcp-<name>` and no
   header (`:63-66`).
6. When the engine reports that a brokered server failed at start,
   `retryBrokeredMcp` forgets the token. The next turn mints a new one, and
   the driver starts the engine again (`:73-78`, `index.ts:6366`).
7. Two names that differ only by case get one grant name. The later server
   wins (`:18`, `:26`, `:49`).
8. `revokeThread` has one production caller: the settings test
   (`broker-probe.ts:44`). So a conversation token is not revoked when a
   turn ends or a conversation is deleted, although `broker.ts:5` says
   "Tokens die ... when their conversation's turn ends".

Where the broker meets the key store: `server/host/mcp-servers-host.ts:110-113`
resolves the headers for each bot before the broker gets them. The broker
gets a plain value, never a `bw://` reference. How the key store reads the
password manager is in "vault-bitwarden". On a Team Cloud the person's own
key is chosen before the broker too (`team-personal-mcp-broker.e2e.test.ts:76-78`,
`:111`).

The settings test of an MCP server (`broker-probe.ts:26-49`) goes through
the broker as a turn does. It mints a grant of 2 minutes on a fake
conversation `mcp-test-<uuid>`, uses the socket directly, and revokes the
grant after. If the brokered test fails and a direct test works, the text
says that "the fault is on our side" (`server/host/mcp-config.ts:75-88`).

The GitHub grant (`server/github/git-access.ts:34-42`) is in the same
process token as the provider keys (`box.ts:206`). It asks the audience
again on each request. The rest is in [`github-sign-in.md`](github-sign-in.md).

### 3.9 Sign-in masks, and a HOME that a bot can write

On a My Cloud (a personal Cloud home), every box has the server's HOME,
read-write (`plan.ts:257`). Two kinds of protection follow from that.

**Sign-in masks** (`sign-in-masks.ts:29-70`), since v0.1.181 (commit
`b5a333128`):

1. `ENGINE_FOLDERS` (`layout.ts:57-68`) lists ten engines: the variable
   that moves the folder, the folder in HOME, the sign-in files, and the
   driver names.
2. For the spawn's `engine`, keep its own sign-in files read-write, bound
   over themselves, so a token refresh writes in place (`:36-50`,
   `plan.ts:108-110`). A link is followed only to the same file of the same
   engine (`:42-45`).
3. Cover each other existing sign-in file with `--ro-bind /dev/null`
   (`:51-57`). Only files that exist, because bubblewrap makes a missing
   target, which would leave an empty file on the server's disk (`:26-28`).
4. Hide `.omb-edge` with a `tmpfs` (`:12`, `:58`).
5. Bind every folder between HOME and these files over itself, so a bot
   cannot rename a parent folder away (`:59-64`). A real-box test proves it
   (`sign-in-masks.linux.test.ts:66-77`).
6. A spawn that names no `engine` keeps no sign-in (`:4`, `:37`). A test
   reads the source of ten driver files and checks that each boxed spawn
   names its engine (`sign-in-masks.test.ts:193-212`).
7. A Team Cloud audience home gets no masks (`sign-in-masks.test.ts:172-184`).

Masks cover sign-in files only. The person's `~/.codex/config.toml` stays
read-write in a Codex bot's box (`sign-in-masks.test.ts:87`), and so does
`~/.claude/skills/` (`:39`, `:156`). On a Team Cloud the "shared" list also
has `config.toml`, `settings.json` and a `.env` (`layout.ts:59-66`). These
are bound read-write into each audience home (`plan.ts:82-83`,
`server/engine-homes/box.linux.test.ts:62-66`).

The open gaps that the reference states (`docs/bot-box.md:185-194`): the
engine's own login is readable by each program in its box. Masks are fixed
when a box starts. Engines outside `ENGINE_FOLDERS` keep their sign-ins
readable from every box. There is no Linux user for each bot.

**The reverse path**: a file that a bot writes in HOME must not act on the
server's own processes, which run outside the box. Three fixes of v0.1.152:

1. Program trust (`program-trust.ts:1-41`). When the box starts, the server
   distrusts HOME and the bot folders, except the data folder
   (`box.ts:309`). The server's `PATH` loses the HOME program folders
   (`boot.ts:33`). An unboxed spawn of a program in such a folder, by path
   or by the real path of a link, fails with `EACCES` and the text "...
   is in a folder the bots can write, so the server does not run it outside
   the bot box." (`procs.ts:394-405`, test `program-trust.test.ts:73-103`).
   The login-shell `PATH` probe is skipped, because the shell reads rc files
   in HOME (`env-path.ts:120-121`).
2. npm and git outside the box ignore `~/.npmrc` and `~/.gitconfig`
   (`engine-install.ts:144-162`, `lent-clone.ts:30`). The test
   `hostile-home.test.ts:37-100` runs the real npm and git against hostile
   files.
3. The server's own model lists and catalog reads run in the box, because
   the engines load settings and extensions from HOME
   (`probe-box.test.ts:1-2`, `:43-65`, `pi.ts:193-200`, `muse-code.ts:295`).

### 3.10 The system-call filter

1. `seccomp.ts` makes a classic BPF program in TypeScript, with no native
   module (`:1-8`).
2. It loads the architecture word. A process of another architecture is
   stopped (`KILL_PROCESS`), not refused (`:33-36`).
3. It compares the call number with 34 numbers (`:19-26`, `:37-40`): the
   mount family (with the new mount API), kernel modules, kexec, reboot,
   swap, `bpf`, `perf_event_open`, `userfaultfd`, the kernel keyring,
   `open_by_handle_at`, `setns`, `acct`, clock setting, `iopl`, `ioperm`,
   `quotactl` and `lookup_dcookie`. A match returns `EPERM`. Else the call
   is allowed (`:41-42`). So it is a deny list.
4. `unshare`, `clone3`, `ptrace`, `socket` and `connect` stay allowed on
   purpose (`seccomp.test.ts:11-12`). `io_uring_setup` is not in the list.
5. The program does not check the x32 bit of the call number (`:33-42`).
   Whether the kernels of the Cloud allow x32 is not verified.
6. The filter is on only on Linux x86-64 (`:59-61`). On arm64 Linux the box
   runs with no filter, and the log says "unsupported here" (`box.ts:311`).
7. The jump distance is one byte (`:51`). A list of more than 255 calls
   would overflow. Nothing checks it.
8. `simulate` runs the program as the kernel does, for the tests (`:64-74`).

### 3.11 The self-check

`runBoxSelfCheck` (`self-check.ts:65-174`):

1. Make a canary marker (a fixed prefix and 24 hex characters) (`:51`,
   `:67`).
2. Make a fake HOME with a fake data folder in `<root>/check-<8 hex>/`, mode
   `0700`. Write canary files: `messages.db`, `config.json` with a fake key,
   `logins.json`, `providers/key`, `tools/token`, another bot's `MEMORY.md`
   and another turn's notes (`:68-81`).
3. Lay out a fake engine as an npm install does (`:82-87`). Write a file in
   the host's `/tmp` (`:88-90`).
4. Start a canary process `sleep 120` with the marker in its environment
   (`:95`). Start two HTTP servers on loopback: an upstream (reached through
   the harness gate) and a private server (bridged nowhere) (`:96-107`).
5. Open new gates and a broker on fixture sockets (`:108-113`).
6. Wrap the probe with an environment of bad names, each with the marker:
   a control-plane secret, a workspace credential, an SMTP URL, the CLI's
   session token and an unknown secret. Add a provider key for the broker
   (`:139-149`).
7. Spawn the box and wait at most 60 s. A time-out stops `bwrap` with
   `SIGKILL` and gives an error text (`:154-156`).
8. Read the last line of the output as the results (`:160-163`).
9. Clean up: stop the canary, release the token, close the gates and
   servers, delete the fixture (`:165-169`). There is no `try`/`finally`. An
   earlier throw leaves the canary, the servers and the fixture folder with
   the canary files.
10. An error gives `passed 0, total 0, failed []` and the error text
    (`:171`). A caller that reads only `failed` sees no failure.

The probe (`box-probe.ts:120-193`) runs inside the box. Its checks, in
order: the database and config are hidden, the data folder looks empty,
other bot and turn folders are hidden, `/.fly` is gone, the marker is in no
environment value and no file, other processes and their environments are
hidden, the own folders are writable, the engine runs and its folder is
read-only, `/tmp` is private, the host name is `omb-box`, the CPU list is
readable, the harness lets `/api/internal/` through and refuses
`/api/bots`, the host loopback and the internet are not reachable directly
(own network only), the egress gate refuses loopback, metadata and private
addresses, a public target passes (when given), `add_key` gives "Operation
not permitted" (with the filter), and six broker checks
(`box-probe.ts:123-191`).

- Each network step has its own time limit of 2, 3, 5 or 10 s. The steps run
  one after the other. The worst case is about 90 s, more than the outer
  limit of 60 s. Then all results are lost (`box-probe.ts:71-102`,
  `:161-191`, `self-check.ts:156`).
- The filter check tests one call of 34, with `python3`. Without `python3`
  in the box the check fails (`box-probe.ts:173-179`).
- A process is told apart by its process id and its start time
  (`box-probe.ts:52-65`).

What a result does:

- At start, the result goes only to the log and to `box.noteChecks`
  (`boot.ts:41-44`). The box stays on with a failed check. There is no
  second run.
- `box-check.js` is a command for a person or an installer (`box-check.ts:1-53`).
  It exits 0 when all pass, 1 on a failure or an error, and 2 when no box
  can run here.
- The Docker installer runs it with `--public=none`. It stops the install
  on a failed check, except five checks that only warn
  (`deploy/install.sh:36`, `:916-960`). It reads the JSON with shell `case`
  and `sed`.
- The hosting Admin reads `GET /api/cloud/box`, a signed route
  (`server/routes/cloud-signed.ts:23-24`, `:169-175`). The summary has only
  fixed codes and counts (`server/cloud-health.ts:293-298`).

The real-box tests (`self-check.linux.test.ts:26-52`):

- "passes every check inside a real box" expects 31 checks on x86-64, 30
  elsewhere, and 1 more with the CPU list (`:30`). The feature page says 29
  (`docs/bot-box.md:229`).
- "each mutation fails the checks it guards, and only those" (`:34-52`). The
  list does not have `bind-otherws`. Its `share-net` row expects
  `host-loopback-unreachable` and `no-direct-internet` in `failed` (`:38`,
  `:47`). But under `share-net` the probe does not run these two checks
  (`self-check.ts:129`, `box-probe.ts:162-167`), so they cannot be in
  `failed`. The row cannot pass as written.
- CI does not run these tests: the Linux runners cannot start the box, and
  one lane deletes `bwrap` (`.github/workflows/ci.yml:120-126`, `:211-218`).

### 3.12 Uploads in the box

The box hides the data folder, and the uploads are in it. So
`attachmentsForBox` (`server/box-attachments.ts:19-50`) changes the turn
text that goes to the engine:

1. Do nothing when the box is off, when there is no working folder, or when
   the text has no `<attached-` (`:20`).
2. Find the conversation: a task workspace, or the bot's own folder with the
   turn's conversation (`:21-22`, `plan.ts:162-174`).
3. For each `<attached-file path=...>` or `<attached-image path=...>` tag:
   use it only when the file is directly in the uploads folder, its name
   matches `^[A-Za-z0-9][A-Za-z0-9._-]*$`, and it exists (`:9-10`, `:26`).
4. Make `<data folder>/box-uploads/<bot>/<thread>` with mode `0700` and make
   a hard link to the upload (`:31-33`). An upload has mode `0600`
   (`server/attachments.ts:522`, `:594`), and the link shares it.
5. On another file system: copy to `<target>.<pid>.partial` (a reflink when
   the file system can), then rename (`:35-41`).
6. On an error, keep the tag as it was (`:45-46`). The stored message keeps
   the real path (`:16-17`).
7. The plan binds the folder read-only, after every read-write line, only
   into the boxes of that conversation (`plan.ts:321-328`). Real-box tests
   prove that the bot cannot write it or swap it for a link, and that
   another room cannot read it (`box-attachments.linux.test.ts:36-64`).
8. A deleted upload is removed from every `box-uploads` folder, best effort
   (`server/attachments.ts:189-208`).

### 3.13 Limits of memory and processes

The box sets no limit of its own. Its options are namespaces,
`--die-with-parent`, the filter and the network (`plan.ts:379-388`).
`--unshare-cgroup-try` only hides the cgroup tree. A search of
`server/bot-box/` for `rlimit`, `prlimit`, `systemd-run`, `cgroup`,
`memory.max` and `pids.max` found no limit (reader `limits-attachments`).

The limits that apply to a boxed bot are outside the box:

| Limit | Where | What |
|---|---|---|
| Engine memory gate | `server/engine-memory.ts:1-4`, `:871-872` | Turns wait for memory |
| Turns at once | `server/process-room.ts:213-219` | `OMB_TURNS_MAX_RUNNING`: a number, `auto` or `off` |
| Process budget | `server/process-room.ts:13-45` | 60 tasks for each engine, 40 for each extra session, 170 for each browser, 40 for the server. A refused spawn holds new starts for 30 s. A limit learned from `EAGAIN` stays 30 min |
| Threads of one bot | `server/bot-thread-limits.ts:5-24` | At most 16. Without the gate: memory / 2 GiB, from 3 to 16 |
| Memory of one bot | `server/bot-memory-cap.ts:1-11`, `:66-76` | A watchdog that reads `/proc` every 5 s. By default it only writes a log line. A number in `OMB_BOT_MEMORY_MAX_MB` makes it stop engines, and only under memory pressure |
| Codex start slots | `server/drivers/codex-process.ts:6-12` | `OMB_CODEX_LAUNCH_SLOTS`, or at least 2, or one for each CPU |
| DuckDB | `server/data/engine.ts:95-105` | Memory, temp size and 1 to 4 threads |
| Node heap of the server | `server/box-memory.ts:35-39` | 60% of a cgroup limit, from 128 to 4096 MB |
| Tool cache disk | `server/cache-sweep/limits.ts:10-11` | The smaller of 10 GiB and 15% of the volume, Cloud only |
| OOM order | `server/oom-score.ts:8`, `:20-21` | Bot spawns are stopped first by the kernel |

- In `server/box-memory.ts` and `server/box-cpus.ts`, "box" means the
  server's own container or machine, not the bot box. Both only read a
  limit. Neither sets one.
- The per-bot memory cap probes two kernel ways (a systemd scope, a
  delegated cgroup v2) and does not use them: "putting each bot's processes
  in a cgroup of its own needs the server moved into a leaf of its own
  first, which nothing here has verified on a real host"
  (`bot-memory-cap.ts:9-11`).
- The estimates of one engine do not agree: 2 GiB for each thread
  (`bot-thread-limits.ts:6`), 700 MB for a default engine
  (`engine-memory.ts:21`), 1,900 MB for the floor of the cap
  (`bot-memory-cap.ts:28`) and 60 tasks for the process budget
  (`process-room.ts:13`).
- Four modules read the memory facts in their own way
  (`box-memory.ts:21`, `process-limits.ts:48-58`, `engine-memory.ts:76-83`,
  `bot-memory-cap.ts:89-91`). The health report reads host totals
  (`server/cloud-health.ts:236-243`), not the cgroup.
- The box adds processes: three `socat` processes and one more for each
  open connection, or one Node process, for each boxed spawn
  (`bridge.ts:22-30`). The idle policy counts engines, not these helpers
  (`server/drivers/session-idle.ts:52-55`, `:110-120`).
- The per-bot cap reads PSS from `/proc/<pid>/smaps_rollup`. When it cannot
  read it ("a sandboxed one"), it uses RSS and acts only at 1.5 times the cap
  (`bot-memory-cap.ts:210-222`).
- The only kernel memory limit is for Chrome on a Cloud home
  (`server/cloud-home-start.ts:474`, since v0.1.180).

### 3.14 macOS and Windows

- `detectBox` returns `not-linux` on every other platform (`detect.ts:67`).
  A desktop with no setting returns `not-cloud` first (`:66`).
- `wrap` returns `null`, so every bot spawn runs as it is (`box.ts:329-330`,
  `procs.ts:345-353`). An unboxed bot gets the server's GitHub sign-in as a
  git credential helper (`procs.ts:423-425`).
- With the box off there is no environment allow list, no egress gate, no
  harness gate, no broker, no masks, no filter and no program trust. Keys
  and MCP headers reach the engine raw (`box.ts:194-196`,
  `broker-mcp.ts:40`). Only the strip of each driver applies
  (`acp/core.ts:332-345`).
- The tests of the gates, the broker and the plan skip on Windows: a unix
  socket at a file path fails there with `EACCES` (commit `2041a135d`,
  `egress-gate.test.ts:44-46`, `broker.test.ts:33-35`). Tests that need a
  real box are named `*.linux.test.ts` and skip where `bwrap` does not work.
- The box does not touch the Windows problems of changelog section 5
  (`EPERM` on unlink, a reused process id, `.cmd` wrappers, `taskkill /T`).
- The per-bot memory watchdog, the cgroup reads and the CPU list are Linux
  only (`bot-memory-cap.ts:87`, `:433`, `server/perf/process-health.ts:112-114`).
  On macOS and Windows the only memory guard is the thread count of a bot,
  unless `OMB_TURNS_MAX_RUNNING` turns on the gate (`bot-thread-limits.ts:8`,
  `process-room.ts:231`).

### 3.15 Stop, and the error paths

- `BotBox.stop()` closes the three gates at the same time (`box.ts:399-408`).
  The test `shutdown.test.ts:31-64` proves that each gate closes in less
  than 1 s with an idle or a half-sent client.
- A search of `server/` found no production caller of `stop()`. It does not
  delete the sockets or the filter file. The next start deletes old sockets
  (`box.ts:290`). `--die-with-parent` stops the boxed processes with the
  server (`plan.ts:379`).
- `bwrap` gone after the start: the child reports `ENOENT` with no process
  id. Nothing detects the box again after the start (`box.ts:281`).
- A child stopped by signal N shows exit 128+N. The ACP exit report turns
  134 (`SIGABRT`) and 159 (`SIGSYS`, "a system call the sandbox refuses")
  into words (`server/drivers/acp/exit-report.ts:14-24`).
- With the box on, the Local VM computer (Docker) is refused at once with
  409 and code `bot_box`: "The Local VM needs the Docker socket, which the
  bot box does not expose" (`server/local-vm-box.ts:11-12`, `:21-29`). The
  reason: the Docker socket "would be root-equivalent" (`:1-3`). It is all
  or nothing for the server.

### 3.16 What this file adds to the files that are done

- [`security-model.md`](security-model.md) (line 1002) asks if a bot can
  reach the permission socket from inside the box. Yes. The Claude driver
  binds it read-write (`claude.ts:1230`), and a real-box test sends a
  question through it and gets the answer (`ask-socket.linux.test.ts:50-60`).
  Without it, the helper returns "could not show this question to the
  person" (`:61-64`).
- [`engine-process-lifecycle.md`](engine-process-lifecycle.md) (line 1010)
  asks how the box limits the socket to its own bot. The socket is
  `<data folder>/perm-<tag>.sock`, with a tag from the bot and the thread
  (`claude.ts:328-335`, `procs.ts:738-743`). The data folder is under a
  `tmpfs` in each box (`plan.ts:260-262`). Only the spawn that names the
  socket in `rw` gets it back (`plan.ts:310`, `claude.ts:1230`). The fallback
  in `/tmp` (`claude.ts:340-346`) is also private, because each box has its
  own `/tmp`. The broker does no check of the peer (security-model.md).
- [`github-sign-in.md`](github-sign-in.md): the GitHub grant rides in the
  same process token as the provider keys (`box.ts:206`). The push guard
  has three new facts (section 3.6).
- [`write-only-secrets.md`](write-only-secrets.md) and
  [`file-modes-atomic-writes-redaction.md`](file-modes-atomic-writes-redaction.md):
  the broker trims a saved key and refuses a header value that Node cannot
  send, one request at a time, since v0.1.184 (`broker-headers.ts:1-25`).
  Before, such a key stopped the server at each start (commit `88a285945`,
  `announcements/releases.json:27`).
- [`changelog.md`](../changelog.md): the rows of v0.1.183 (no note, no tag)
  and v0.1.184 are not in section 8 yet. v0.1.184 has a box fix: "One saved
  key with a stray character can no longer take a Cloud down."
  (`announcements/releases.json:27`).

## 4. The data

### Types

| Type | Where | Fields |
|---|---|---|
| `BoxDetection` | `detect.ts:11-17` | `box` (`bwrap` or `off`), `reason` (`switched-off`, `not-linux`, `no-bwrap`, `userns-refused`, `not-cloud` or null), `tools` (`bwrap`, `socat` or null) |
| `BoxRequest` | `plan.ts:60-102` | `command`, `args`, `cwd`, `env`, `allowEnv`, `rw`, `ro`, `net` (`isolated` by default, or `shared`), `botId`, `botThreads`, `home`, `shared`, `configured`, `relay`, `threadId`, `conversationFolder`, `conversationBot`, `audience`, `engine` |
| `Mount` | `plan.ts:32-35` | `ro` or `bind` with `source`, `target`, `optional`. `tmpfs`, `proc`, `dev`, `dir`, `mask` with `target`. `symlink` with `link`, `target` |
| `BoxPlan` | `plan.ts:140-148` | `mounts`, `options`, `net`, `writable`, `botId` |
| `SignInMasks` | `plan.ts:105-115` | `folders`, `own`, `masked`, `hidden` |
| `BoxAudience` | `plan.ts:119-130` | `teamReadOnly`, `threads` (`rw`, `ro`), `teamFiles` (`source`, `write`) |
| `BoxMutation` | `plan.ts:57-58` | `bind-data`, `bind-otherws`, `share-pid`, `share-net`, `env-all`, `tmp-shared`, `no-seccomp`, `engines-rw` |
| `WrappedSpawn` | `box.ts:39-51` | `command` (the `bwrap` path), `args`, `env`, `plan`, `token`, `release()`, `unbrokered`, `extraFds` |
| `BoxReport` | `box.ts:215-228` | `box`, `reason`, `checks`, `bridge` (`socat`, `node` or null), `boxed`, `refused` (`egress`, `harness`), `broker` (`on`, `tokens`, `forwarded`, `refused`, `unbrokered`), `hardening` (`seccomp`, `denied`, `hidepid`, `flyApiPrivate`) |
| `BrokerGrant` | `broker.ts:23-35` | `upstream`, `headers`, `mcpServer`, `mcpApp`, `serve` |
| `BrokerToken` | `broker.ts:48-54` | `token`, `botId`, `threadId`, `expiresAt`, `grants` |
| `ProbeSpec`, `ProbeResult` | `box-probe.ts:15-50` | The paths, the marker, the process ids with start times, the ports, the switches. A result is `id`, `ok`, `detail` |
| `SelfCheckResult` | `self-check.ts:43-49` | `passed`, `total`, `failed`, `at`, `results`, `skipped`, `durationMs`, `error` |
| `EngineFolder` | `server/engine-homes/layout.ts:44-50` | `env`, `home`, `shared`, `drivers` |

### Files, sockets and paths

| What | Path | Mode |
|---|---|---|
| Box folder | `<data folder>/box/` | `0700` (`box.ts:288`) |
| Gate sockets | `<data folder>/box/egress.sock`, `harness.sock`, `broker.sock` | No `chmod`. The folder protects them |
| Relay sockets | `<data folder>/box/relay-<12 hex>.sock` | No `chmod` (`relay.ts:37`) |
| Filter | `<data folder>/box/seccomp.bpf` | `0600` (`box.ts:231-236`) |
| Self-check fixture | `<data folder>/box/check-<8 hex>/` | `0700`, deleted after the run |
| Uploads for a box | `<data folder>/box-uploads/<bot>/<thread>/` | Folder `0700`, files are hard links of `0600` uploads |
| Permission socket | `<data folder>/perm-<tag>.sock`, or `/tmp/omb-perm-<16 hex>.sock` | `0600` after `listen` |
| In the box | `/run/omb/egress.sock`, `harness.sock`, `broker.sock`, `relay.sock`; host name `omb-box` | |
| Team files in the box | `/team-files`, with `templates` read-only | |

The backup of the workspace skips the live sockets and the filter
(`server/workspace-backup.ts:47`).

### Ports and numbers

- Egress: `127.0.0.1:3128` (`box.ts:29`). Broker: `127.0.0.1:18080`
  (`box.ts:33`). Harness: the port of the server.
- Filter descriptor: 3 (`box.ts:35`).
- Probe of `bwrap`: 5 s. Self-check delay: 5 s. Self-check limit: 60 s.
- Relay: 4 waiting connections, 6 bytes for the port line, 10 s wait, 1 s
  redial.
- Broker: 24 hours for a token, 10,000 tokens, 1 MiB of a refused MCP call,
  2 minutes for a settings test.
- Broker for MCP headers: 10,000 remembered conversations
  (`broker-mcp.ts:19-22`).

### Environment variables a person sets

There is no key in the settings file and no switch in the window for the box
(reader `callers-ui`). Only environment variables:

- `OMB_BOT_BOX`: not set means on for a Cloud home and off elsewhere.
  `0`, `off`, `false`, `no` turn it off. `1`, `on`, `bwrap`, `true`, `yes`
  turn it on (`detect.ts:33-38`).
- `OMB_CLOUD_ROLE`: `home` or `team` makes a Cloud role (`detect.ts:28-30`).
- `OMB_CACHE_ROOT`: tool caches in each box's HOME, Cloud only, off by
  default (`tool-caches.ts:26`, `:63-65`).
- `OMB_CACHE_SWEEP`, `OMB_CACHE_CAP_TOOLS`, `OMB_CACHE_CAP_APP`: the disk cap
  of the caches (`cache-sweep/limits.ts:32-55`).
- `OMB_BOT_MEMORY_MAX_MB`: the memory cap of one bot (`bot-memory-cap.ts:25`).
- `OMB_CLOUD_HARDEN=0`: skips the two root steps of the supervisor (the
  `hidepid` remount and the root-only `/.fly`) (`docs/bot-box.md:251`).

### What goes over the wire

- The boxed process sees `ANTHROPIC_API_KEY=omb_t0_<48 hex>` and
  `ANTHROPIC_BASE_URL=http://127.0.0.1:18080/b/<token>/anthropic`
  (`broker-env.ts:81-84`). The token is in both values.
- Git sees `url.<http://127.0.0.1:18080/g/github>.insteadof` and the header
  `x-omb-broker: <token>` in `GIT_CONFIG_PARAMETERS`
  (`server/github/git-env.ts:28-40`).
- The broker answers in JSON: `{"error":"unknown_token"}` and the other
  codes of section 3.8.

## 5. The UI

The window of the person shows nothing about the box (reader `callers-ui`):

- `src/locales/en.json` has no text for the box, bubblewrap, the self-check
  or the egress gate. The word "box" in `src/components/ComputerPanel.tsx`
  (`:133`, `:372`, `:543-618`, `:1518`) is the remote computer service,
  whose token has the settings key `box` (`server/config.ts:454-455`). It
  is not the bot box.
- `/api/health` returns `box: "on"` or `"off"` (`server/routes/status.ts:64`).
  No file in `src/` reads it.
- The full report goes only to the hosting Admin, through the signed route
  `GET /api/cloud/box` (`server/routes/cloud-signed.ts:23-24`, `:169-175`).
  The Admin is not in the open part of the reference.
- A person can see these texts that the box causes:
  - The MCP reconnect line: "The MCP server {name} didn't connect, so its
    tools weren't available this time. It connects again on your next
    message." (`en.json:545`, plural at `:551`). It does not name the box.
  - The broker refusals, mapped to "{name} needs you to sign in before its
    tools work. Open Apps → MCP servers and sign in to it." and "{name}
    refused its sign-in or key. Open Apps → MCP servers to sign in again or
    update its key." (`en.json:546-547`, `server/mcp-failure.ts:18-20`).
  - A chat notice when the memory cap stops an engine
    (`chat.notice.botMemoryCap`, `bot-memory-cap.ts:361-363`).
  - Server errors in English, not translated: the Local VM text
    (`local-vm-box.ts:11-12`), the "folder the bots can write" text
    (`procs.ts:401`), and the mail text (`email/service.ts:37`). Where the
    window shows them is not verified.
- Log lines: `bot box: off (<reason>)`, `bot box: on (...)`
  (`box.ts:283-285`, `:311`) and the self-check line (`boot.ts:42-43`).

## 6. The tests

What the tests of the reference prove. All tests of the gates, the broker
and the plan skip on Windows. All `*.linux.test.ts` files skip where
`bwrap` does not work, and CI does not run them (section 3.11).

| Test | What it proves |
|---|---|
| `detect.test.ts:8-30` | On by default on a Cloud home, off elsewhere. `OMB_BOT_BOX` decides either way. macOS gives `not-linux`. No `bwrap` gives `no-bwrap`. A failed probe gives `userns-refused` |
| `box.test.ts:38-55` | The spawn runs under `bwrap`. The environment keeps only allowed names and gets the proxy names. Denied and unknown names are gone |
| `box.test.ts:139-148` | Off: `wrap` returns `null`, one log line, no box folder |
| `box.test.ts:152-191` | On: three sockets. A key becomes `omb_t0_` and 48 hex. A raw key of a CLI with no base URL stays and is named. `release()` ends the token |
| `box.test.ts:245-276` | A `bot` spawn is boxed. A spawn of the server and `box: false` are not |
| `plan.test.ts:46-66` | A turn sees its own folders and the code, and nothing else of the data folder |
| `plan.test.ts:79-95` | The order of the arguments. HOME, then the `tmpfs` of the data folder, then the working folder. No `--new-session` |
| `plan.test.ts:97-119` | The engines stay read-only, whatever the turn may write |
| `plan.test.ts:232-269` | A path on a command line or in a configured server's environment shows nothing of the data folder |
| `plan.test.ts:297-319` | Each mutation opens only its own hole |
| `plan.test.ts:321-393` | The Team Cloud audience rules |
| `command-line-paths.linux.test.ts:43-79` | The same, in a real box, with canary files |
| `hardlink.test.ts`, `hardlink.linux.test.ts` | A hard-linked read-only file is refused, at plan time and at argument time |
| `box-cleanup.linux.test.ts:16-58` | A refused wrap leaves no open descriptor and no live token |
| `program-trust.test.ts:36-117` | The server does not find or start a program in HOME. A boxed process keeps them on its `PATH` |
| `hostile-home.test.ts:37-100` | The real npm and git ignore a hostile `.npmrc` and `.gitconfig` when the box is on |
| `turn-bot-folder.test.ts:52-123` | A bot gets its own folder and conversation folder, never another bot's |
| `shutdown.test.ts:31-64` | Each gate closes in less than 1 s with a stuck client |
| `env.test.ts:78-155` | The allow list, the deny set, the never list, `allow`, `SSH_CONNECTION`, and a decision for each `OMB_` name in the source |
| `egress-gate.test.ts:60-152` | Loopback, private, metadata and reserved addresses are refused. DNS rebinding is refused. A public address passes. A client that leaves stops the upstream |
| `harness-gate.test.ts:66-129` | Only `/api/internal/` passes, in every encoded form. The bearer passes. 502 when the server is not there |
| `sign-in-masks.test.ts:56-212` | Own sign-in kept, others masked, links not followed, folders bound, a source scan that each boxed engine spawn names its engine |
| `sign-in-masks.linux.test.ts:40-83` | In a real box: a masked file is empty and cannot be written or renamed. The own file can be written in place |
| `tool-caches.test.ts`, `tool-caches.linux.test.ts` | The cache variables, the tag file, and that the plan does not change |
| `broker.test.ts:69-165` | The real key is added, client credentials are dropped, the event stream passes, wrong, revoked and expired tokens are refused |
| `broker-env.test.ts:8-59` | The rewrite of the keys and base URLs, two keys behind one base URL |
| `broker-headers.test.ts:33-167` | A bad saved key fails one request, ten times, and the server keeps serving. A server with bad keys on disk starts |
| `broker-mcp.test.ts:32-142` | URL server headers move to the broker. stdio servers keep their environment. A token stays across turns while the headers stay |
| `broker-mcp-refusal.test.ts:58-157` | The 401 of a tool call becomes a tool error in words. Other 401s pass |
| `broker-probe.test.ts:30-65` | The settings test goes through the broker and ends its grant |
| `seccomp.test.ts:8-36` | Each denied call gives `EPERM`. Common calls pass. Another architecture is stopped |
| `self-check.linux.test.ts:26-52` | All checks pass in a real box. Each mutation fails its checks (but see the `share-net` row, section 3.11) |
| `bridge.test.ts`, `relay.test.ts` | The bridge script, the Node bridge, the relay limits |
| `ask-socket.linux.test.ts:50-64` | A question reaches the person from a real box through the permission socket |
| `box-attachments.test.ts`, `box-attachments.linux.test.ts` | Uploads are linked into a read-only folder of one conversation |
| `claude-box.test.ts:73-236` | A Claude turn with a fake `bwrap`: the permission socket, the hook token, a missing bind source |
| `antigravity-box.linux.test.ts:37-53` | The relay brings an OAuth callback into a real box |
| `engine-homes/box.linux.test.ts:53-72` | A Team Cloud audience sees its own home and the team sign-in, never another person's transcripts |
| `team-box-scope.test.ts:28-159` | The audience rule through the real spawn path |

Two tests use the real data folder and the real HOME of the computer
(`claude-box.test.ts:74`, `:83`, `:95`, `team-box-scope.test.ts:59`,
`:74-78`). Our rule forbids that (`AGENTS.md`).

## 7. Ours compared

We have no process code yet. `crates/bot-engine/src/lib.rs` and
`crates/bot-core/src/lib.rs` are the only files of those crates. Step 9 of
the plan starts the first engine process.

| Part of the reference | Reference files | Ours: crate and module | State |
|---|---|---|---|
| One function starts every engine process | `server/procs.ts:345-475` | `bot-engine`, a process runner (step 9, P478 says gh goes through it) | Not built |
| Detection and the decision at start | `server/bot-box/detect.ts`, `boot.ts`, `box.ts:278-312` | `bot-engine`, a sandbox module; `bot-cli` connects it at start | Not planned |
| The mount plan | `server/bot-box/plan.ts` | `bot-engine`, a pure plan function and its tests | Not planned |
| The environment allow list | `server/bot-box/env.ts` | `bot-engine`, the environment of a child process (P61, P508, step 9). For every process, boxed or not | Proposed |
| An own home for each engine | `server/engine-homes/layout.ts`, `sign-in-masks.ts` | `bot-engine`, the engine home (P103, P504, step 9) | Proposed |
| The egress gate and the harness gate | `server/bot-box/egress-gate.ts`, `harness-gate.ts` | `bot-engine` or a later crate. `docs/comparison.md:169` maps the browser's gate to `fast-socks5` and `hickory-resolver` | Not planned |
| The credential broker | `server/bot-box/broker*.ts` | `bot-engine` or a later crate, with the `Secret` type of P480 | Not planned |
| The system-call filter | `server/bot-box/seccomp.ts` | `bot-engine`, Linux only | Not planned |
| The self-check | `server/bot-box/self-check.ts`, `box-probe.ts`, `box-check.ts` | `bot-engine` tests and a `bot-cli` command | Not planned |
| Uploads in the box | `server/box-attachments.ts` | `bot-engine` (with P301 to P313 of [`bot-attachments.md`](bot-attachments.md)) | Not planned |
| Limits of memory and processes | `server/process-room.ts`, `bot-memory-cap.ts`, `bot-thread-limits.ts`, `engine-memory.ts` | `bot-engine` step 9 and `bot-core` step 11 (P70) | Proposed |

The row `bot-box.md` of `reference-features.md:320` says the crate is
`bot-core`. That does not fit our rules: the runtime in `bot-core` "does
no I/O beyond its own store" (`AGENTS.md`). The box starts `bwrap`, writes a
filter file and opens three sockets. So the box belongs in `bot-engine`,
next to the process runner of step 9. `bot-cli` connects it at start. The
author can correct the "Ours" column.

Points where the reference and our rules differ:

- The reference states the needs of a driver with the driver's name
  (`layout.ts:57-68`, `claude-keepwarm.ts:126`). Our rule gates engine
  behaviour by capability flags, never by a driver's name (`AGENTS.md`).
- The reference keeps the switches of the box in environment variables
  only (`detect.ts:33-38`). Decision D10 says settings come from variables,
  flags or a settings file, so this is allowed. The reference itself
  dropped one hidden switch because "hidden env flags count as settings"
  (commit `17a3f5af3`).
- Two tests of the reference use the real data folder (section 6). Our
  tests never do (`AGENTS.md`).
- The box of the reference fails open. Our runtime returns typed refusals
  (`AGENTS.md`). A refusal "the box is wanted but is off" fits that rule.

## 8. Where we can be better

### Proposals

The main session gives the P-numbers. P576 is a decision. The others are
ordered by importance.

- **P576 (decision, refines D10). What our desktop does about the box.**
  The reference has no box on macOS, Windows or a Linux desktop
  (`detect.ts:66-67`). There every engine gets the raw keys and MCP headers
  (`box.ts:194-196`, `broker-mcp.ts:40`). Choose one:
  - a: follow the reference. No sandbox on the desktop. Keep one process
    runner in `bot-engine` that takes a sandbox request as data, with one
    "no sandbox" kind now, so a Linux box can come later without a change
    to the drivers. The desktop gets the allow list (P61) and an own engine
    home (P103) instead.
  - b: a and a Linux box later, in its own step after step 16, off by
    default on the desktop.
  - Kind: follows the reference. This file recommends a.
- **P577 (plan, step 9, with P61). The needs of a driver for its process are
  a typed capability, and the spawn requires an engine identity.** The
  capability names its sign-in files, its extra read-only and writable
  paths, its relay and whether it shares a process.
  - **Problem in the reference:** the sign-in files of a process are chosen
    by a driver-name string, and a spawn with no `engine` silently keeps no
    sign-in (`sign-in-masks.ts:4`, `:37`, `layout.ts:57-68`). The guard is
    a text scan of ten source files (`sign-in-masks.test.ts:193-212`). This
    is the area of "A secret or an access right in the wrong place" of
    v0.1.181 ("each bot reaches only its own AI account's sign-in").
- **P578 (plan, step 9 and later). A grant ends with its owner.** A process
  grant is a value that revokes itself when it is dropped, so every end path
  revokes it: a failed spawn, an error with no process id, and the exit. A
  conversation grant ends when the turn ends, when the conversation is
  deleted, and when its headers change.
  - **Problem in the reference:** a token is not revoked when `spawn`
    throws or reports an error with no process id (`procs.ts:441-454`). An
    MCP token keeps an old secret valid after a header change, and it still
    slides with each turn (`broker-mcp.ts:42`, `:57-60`). `revokeThread`
    has one production caller, the settings test (`broker-probe.ts:44`),
    although `broker.ts:5` says that tokens die when the turn ends. Theme
    "A secret or an access right in the wrong place" (v0.1.92, v0.1.101,
    v0.1.181). These cases are not in a release note.
- **P579 (plan, with the broker). Every connection of a gate or the broker has
  time limits:** connect, first byte and idle, each a named constant, and a
  DNS look-up with a limit.
  - **Problem in the reference:** the broker has no time limit on the
    upstream (`broker.ts:196`), and the egress gate has none on DNS, the
    connect or a tunnel (`egress-gate.ts:63-69`, `:108`). A stuck MCP server
    holds the turn until the engine gives up. Theme "One slow or stuck part
    blocks all the others" (v0.1.114, v0.1.153, v0.1.177).
- **P580 (plan, step 6, with P480). A header value is a type that a saved
  key must pass when it is saved and when it is read.** The send path then
  cannot fail on a bad byte.
  - **Problem in the reference:** one saved key with a control character
    made the broker throw, the server stopped, and the check at start sent
    the same request again: "a crash loop" (commit `88a285945`,
    `broker-headers.ts:1-6`). The fix trims the key and fails one request
    (`broker.ts:173-181`), but a bad stored value still loads
    (`broker-headers.test.ts:46-55`). Theme "One slow or stuck part blocks
    all the others", release v0.1.184 ("One saved key with a stray
    character can no longer take a Cloud down.",
    `announcements/releases.json:27`). `changelog.md` does not have
    v0.1.184 yet.
- **P581 (plan, with P576 b). A box that is wanted but off is a typed refusal
  and a visible state.** The runtime refuses a turn when the settings ask
  for a box and the box cannot start, or when a check that must pass fails.
  The window shows the state, its reason and the result of the check.
  - Kind: a judgment call. The reference fails open (`detect.ts:1-4`,
    `:70-71`, `box.ts:329-330`, `boot.ts:41-44`) and shows nothing to the
    person (section 5). No release of section 5 names this. The first
    release note of the box said that bots "can't see ... any keys"
    (`GH v0.1.122:22`), and that was not true for sign-ins until v0.1.181.
- **P582 (plan, step 9). Settings checks, model lists and the self-check
  start their process through the same path as a turn.**
  - Kind: a judgment call, with release evidence. Many fixes of the box
    were "it works outside the box and fails inside", while Settings said
    Ready or connected: engines gone in the box with exit 127 (v0.1.126,
    `0011279cb`), an MCP 404 (v0.1.132, `1fee5d86b`), the permission socket
    (v0.1.135, `8537559a9`), uploads (v0.1.141, `352313dff`) and a shared
    process (v0.1.147, `90102ee90`). This pattern is not a theme of
    section 5. The author can add it.
- **P583 (later, with the box). The self-check has one total deadline,
  writes each result when it ends, runs the network checks at the same
  time, cleans up with a guard, and runs in CI with every mutation.**
  - Kind: a judgment call. In the reference the steps run one after the
    other and can take about 90 s, more than the limit of 60 s, and then
    all results are lost (`box-probe.ts:161-191`, `self-check.ts:156`,
    `:171`). An early throw leaves the canary process and files
    (`self-check.ts:95-169`). The test leaves out `bind-otherws`, its
    `share-net` row cannot pass, and CI skips it
    (`self-check.linux.test.ts:35-50`, `.github/workflows/ci.yml:211-218`).
- **P584 (later, with the box). One helper process for each box, and a bridge
  that does not come up refuses the turn.**
  - Kind: a judgment call. The reference starts three `socat` processes
    and one more for each connection, or one Node process, for each box
    (`bridge.ts:22-30`). When the first bridge does not answer, the engine
    starts anyway (`bridge.ts:26`). The process count goes to P70.
- **P585 (later, with the box). The egress gate knows which box asks, and
  logs each refusal with the bot.** An optional list of hosts and ports for
  each bot comes later.
  - Kind: a judgment call. One socket serves all boxes, and a refusal is
    only counted (`box.ts:287-292`, `egress-gate.ts:59-62`). Any public host
    on any port passes (`egress-gate.ts:28-34`), so a raw key in a box can go
    anywhere public.
- **P586 (later, with the box). A socket is made in a private folder before
  it is bound, not changed with `chmod` after `listen`.** The relay gives a
  secret value to the waiting connection, so another process in the box
  cannot take the callback.
  - Kind: a judgment call. The permission socket has its default mode for a
    short time (`claude.ts:441-446`), worst for the fallback in `/tmp`. Any
    process in the box can take a relay connection and get the OAuth code
    (`relay.ts:24-29`, `:46`).
- **P587 (later, with the box). The filter checks the x32 bit, has a table
  for aarch64, and comes from a maintained crate,** with a simulator test as
  `seccomp.ts:64-74` has. Check the license of the crate first (`AGENTS.md`).
  - Kind: a judgment call. The filter does not check the x32 bit
    (`seccomp.ts:33-42`) and is off on arm64 (`:59-61`).
- **P588 (later, with the box). The plan has `--clearenv` with explicit
  variables, a short list of `/etc` files, and a property test.** The
  property: no path of the data folder is visible unless a line grants it.
  - Kind: a judgment call. The reference keeps the environment out of the
    plan (`box.ts:160-162`, `:183`), binds the whole `/etc`
    (`plan.ts:234`), and tests the plan with examples
    (`plan.test.ts:46-66`), with `visibleInBox` as the model
    (`plan.ts:421-432`).

### New facts for open proposals

- **P61 and P508 (step 9, the allow list of environment variables,
  `changelog.md` section 7).**
  - The reference already has an allow list, but only at the box boundary,
    as the "second gate" (`env.ts:1-3`). On the desktop only the strip of
    each driver applies (`acp/core.ts:332-345`).
  - 35 prefixes let unknown names through, such as `GOOGLE_*` or
    `CLAUDE_*` (`env.ts:46-51`). The never list had to patch one prefix for
    the CLI session token (`env.ts:53-55`).
  - The `OMB_` part costs upkeep: 61 commits in 16 days touched `env.ts` or
    its test, and only 14 changed `env.ts` (reader `history`). The test
    keeps about 306 server-only names (`env.test.ts:9-66`). A decision next
    to each variable is cheaper.
  - `allow` lifts the deny set too (`env.ts:68`). Codex vouches for all
    names of the person's MCP servers for the whole engine process
    (`codex-mcp-mount.ts:44-53`). The tool-cache step puts back names that
    the list dropped (`tool-caches.ts:123`). `ALL_PROXY` passes and is not
    overwritten (`env.ts:10`, `box.ts:31`).
  - Names compare with case in the box and without case in the strip of the
    drivers (`env.ts:67-71`, `credential-env.ts:49-54`). One function for
    both, with case on Linux and macOS and without case on Windows.
- **The row "The person's own engine config reaches the bots" of
  `changelog.md` section 7 (step 9: each driver states the instruction
  files of the person that it blocks, and a test checks the list).**
  - Four drivers block the files in four ways: a settings field for Claude
    (`claude.ts:1064`), an environment flag for OpenCode
    (`acp/opencode-go.ts:715-718`), a home swap for Codex
    (`codex-shared-home.ts:24`) and a folder swap for Pi
    (`pi-agent-dir.ts:1-6`). No shared test checks them.
  - Codex keeps the person's own home in five cases: a Team Cloud, a home
    in the data folder, no `auth.json`, a login in the keyring, or a failed
    link (`codex-shared-home.ts:144-154`).
  - The path `~/.claude/rules/**` stayed open for six weeks after v0.1.104,
    until v0.1.177 (commit `73f90abe8`).
  - The OpenCode leak came from an engine update: OpenCode 2.3.1 began to
    read `CLAUDE.md` again (commit `c29e9bf51`, v0.1.170).
  - One escape switch stays: `OMB_CLAUDE_INHERIT_USER_CONFIG`
    (`claude.ts:138-142`). The Codex switch was removed because "hidden env
    flags count as settings" (commit `17a3f5af3`).
  - The box masks sign-in files, not instruction files. The person's
    `~/.codex/config.toml` stays read-write in a Codex bot's box
    (`layout.ts:57-68`, `sign-in-masks.test.ts:87`).
- **P103 and P504 (step 9, the engine home).**
  - On a My Cloud every box had the server's HOME, so every bot could read
    every engine's sign-in from v0.1.122 to v0.1.180 (commit `b5a333128`,
    v0.1.181). The fix masks files (`sign-in-masks.ts:29-70`), and the
    masks are fixed when a box starts (`docs/bot-box.md:188-190`).
  - The writable HOME caused the reverse problem, fixed in three places in
    v0.1.152 (`program-trust.ts`, `engine-install.ts:144-162`,
    `lent-clone.ts:30`). An own home for each engine from the start avoids
    both.
  - On a Team Cloud the "shared sign-in" list also has `config.toml`,
    `settings.json` and a `.env`, bound read-write into each audience home
    (`layout.ts:59-66`, `box.linux.test.ts:62-66`). P504 should list only
    credential files.
- **P70 (steps 9 and 11, one gate for memory and processes,
  `changelog.md` section 7).**
  - The box sets no limit (`plan.ts:379-388`). The kernel ways for each bot
    are probed and not used (`bot-memory-cap.ts:9-11`, `:85-96`).
  - Ten separate limits (section 3.13), four estimates of one engine that do
    not agree, and four readers of the memory facts.
  - The box adds helper processes for each spawn (`bridge.ts:22-30`) that
    the idle policy does not count (`session-idle.ts:110-120`).
  - One read of the limits (CPU count, memory limit, process limit), passed
    to every gate and to the report, removes the drift.
- **P41 and P68 (step 9, Windows).** The box does nothing on Windows or
  macOS (`detect.ts:67`). Its tests skip there. No Windows problem of
  section 5 changes.
- **P95 (the threat model before step 9).** The layer table of the
  reference (`docs/bot-box.md:235-244`) is a good form: each layer, what it
  stops and what it does not stop.
- **P472 to P474 (step 16, the git broker).** The GitHub grant rides in the
  same process token as the provider keys (`box.ts:206`). Git uses the
  header form of the broker, so the token is not in git's files
  (`git-env.ts:28-40`).

### Problems of changelog section 5 in the reference here

- **A secret or an access right in the wrong place.**
  - Every engine sign-in readable by every bot on a My Cloud, from
    v0.1.122 to v0.1.180 (`b5a333128`, v0.1.181).
  - Operator `OMB_` settings, an SMTP URL with its password among them, in
    every bot shell until v0.1.153 (`08c36a72f`).
  - A second key behind one base URL raw in the box until v0.1.177
    (`ac66ed052`).
  - Still open by design: subscription logins in the box, 16 raw keys with
    no base URL, stdio MCP secrets raw (`docs/bot-box.md:185-187`,
    `broker-env.ts:31-34`, `broker-mcp.test.ts:34`).
  - Still open: old MCP tokens not revoked (P578), the token not revoked on a
    failed spawn (P578), and Team Cloud sign-in files writable by each bot
    (`box.linux.test.ts:62-66`).
- **The person's own engine config reaches the bots** (v0.1.104,
  v0.1.170, v0.1.175). The box does not stop it: it is off on the desktop,
  and it masks sign-in files, not instruction files (`layout.ts:57-68`).
  Four drivers fix it in four ways (`claude.ts:1064`,
  `acp/opencode-go.ts:715-718`, `codex-shared-home.ts:24`, `:144-156`,
  `pi-agent-dir.ts:1-6`). The box adds the reverse problem: a bot writes
  HOME and the server reads it (v0.1.152).
- **Memory and the number of processes** (v0.1.110, v0.1.165, v0.1.180).
  The box sets no limit and adds helper processes (section 3.13).
- **One slow or stuck part blocks all the others** (v0.1.177). The box
  refuses Docker at once, so a stuck Docker cannot hold a boxed turn
  (`local-vm-box.ts:21-29`). The probe of `bwrap` is a `spawnSync` of up to
  5 s that the boot awaits (`detect.ts:50-61`, `index.ts:722`). The broker
  and the gates have no time limits (P579). One bad key stopped the whole
  server until v0.1.184 (P580). The stuck-Docker fix of v0.1.177 (commit
  `f59d495dd`) is still there and has not changed:
  `server/container-runtime-probe.ts:6-37` has only that one commit.
- **Process control on Windows.** The box does nothing there (section
  3.14).

## 9. Not verified

- What `bwrap` does when it gets `--seccomp 3` but descriptor 3 is not
  passed (`procs.ts:426-427`). It probably fails to read the filter and
  stops.
- Whether Node sends `exit` after a spawn `error` with no process id. If
  not, the token of such a spawn lives 24 hours (`procs.ts:451-454`).
- Whether `SIGKILL` on `bwrap` at the time-out of the self-check also stops
  the probe inside (`self-check.ts:156`, `--die-with-parent` at
  `plan.ts:379`).
- Whether the harness and egress checks also fail under `share-net`. A
  shared network has no bridges (`box.ts:175`), so they probably do. The
  main session did not run the test.
- Whether the kernels of the Cloud hosts allow the x32 ABI.
- The memory cost of a Node bridge against `socat`. Only "about 5 ms and
  3 MB for each box, plus one socat for each bridge" is stated
  (`docs/bot-box.md:59`).
- Whether slow DNS answers from bots slow the whole server through Node's
  thread pool (`gate.ts:79`).
- Whether a Pi turn loses its saved keys, because the turn spawn passes no
  `allowEnv` (`pi.ts:428`).
- Whether Codex reads the person's `AGENTS.md` in the cases where
  `codex-shared-home.ts:144-154` keeps the person's own home.
- Where the window shows the 409 `bot_box` error and the `EACCES` "folder
  the bots can write" error.
- The display of the hosting Admin, which reads `/api/cloud/box`. It is not
  in the open part of the reference.
- The release notes of v0.1.123 to v0.1.153 were not read one by one. The
  first release of each commit comes from `git tag --contains`.
- The lines `GH vX:line` come from the GitHub release notes, not from the
  repository at `42f86aefd`.
- No test of the reference was run.
