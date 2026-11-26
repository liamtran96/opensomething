# The safety floor and the decision log

Read on 2026-11-26 for step 10 of [`../../plan/README.md`](../../plan/README.md).
Rows of [`../reference-features.md`](../reference-features.md): "The safety
floor: a list of shell commands that the server never approves by itself"
(`safety-floor.md`) and "The decision log: each allow and each deny writes an
audit row" (`2026-08-31-00-control-plane-roadmap.md`).

The reference project is at commit `96ff84455`. HEAD of the local clone was
`96ff84455`, so the readers read the files directly. All paths are in the
reference project, under `server/` unless a path starts with another folder.
Nobody opened the `enterprise/` directory.

This file adds to [`approval-levels.md`](approval-levels.md) (sections 3.12
and 3.13) and [`approval-cards.md`](approval-cards.md). It does not repeat
them. The approval levels and the cards are out of scope.

## 1. In short

The **safety floor** is a fixed list of shell commands that the server never
allows by itself, at any approval level. Examples: a recursive delete of `/`
or of the home folder, a format of a disk, a fork bomb. The floor changes
only an **automatic** allow. It never changes the answer of a person. It is
off by default, and it does nothing on a Windows server.

The **decision log** is an append-only record of approval decisions: a card
shown, an automatic allow or deny, a person's allow or deny, an Undo. Many
parts of the server write it, not only the approval path. Two screens and two
HTTP exports read it.

The main findings of this file:

1. **A row does not always say what happened.** In some writers the decision
   is the person's click. In others it is the result. One path writes
   `user-approved` after the person pressed Deny (section 3.3).
2. **Some "allowed" rows come before the action and before later checks.** A
   phone call, an email call and a connector call can be logged
   `auto-approved` and then fail or be refused (section 3.3).
3. **One reader skips the privacy filter.** The activity receipt of a bot
   reads the rows of all threads of that bot. The other readers remove the
   rows of private threads (section 3.5).
4. **The floor has more gaps than the tests show.** Brace expansion, a glob,
   `$'/'`, `pwsh -EncodedCommand` and a delete from a pipe all read as
   "clear" (section 3.1).
5. **The Windows reader is complete and tested, but no server uses it.** The
   test file says so (`safety-floor.test.ts:19-23`).
6. **A separate admin activity log** records changes by admins on a shared
   server. The desktop application records nothing in it, and it has no
   screen on the desktop (section 3.6).

### 1.1 Terms

- **Never-list:** the six kinds of command that the floor blocks:
  `delete-root`, `delete-home`, `delete-system-directory`, `format-disk`,
  `overwrite-disk`, `fork-bomb` (`safety-floor.ts:5`).
- **Reading:** the result of the floor for one command line. It is
  `{read: true, verdict}` or `{read: false}`. `{read: false}` means "could not
  read the line to its end". It is never "clear" (`safety-floor.ts:1-3`,
  `:696`).
- **Mode:** the shell grammar that the floor uses for a line: `posix`,
  `windows` or `powershell` (`safety-floor.ts:563-564`).
- **Prefix:** a program that runs another program, for example `sudo` or
  `env`. The floor skips it and reads the program after it.
- **Wrapper:** a program that reads its argument as a new command line, for
  example `sh -c` or `eval`. The floor reads that line again.
- **Decision row:** one line of the decision log (`DecisionRow`,
  `decision-log.ts:53-74`).
- **Source:** the field of a row that says which rule or which part of the
  server decided.
- **Actor:** the person, device or service that answered a card. Only a row
  with the source `user` gets the actor of the request (`decision-log.ts:126`).
- **Admin activity log:** a second log, of changes that an admin makes on a
  shared server (`admin-activity.ts:1-3`).
- **Audit plan:** a pure function that says which admin request gets a row in
  the admin activity log (`admin-audit-plan.ts:20-42`).
- **Activity receipt:** the list of tool runs and approval decisions of one
  bot, in its Activity panel (`activity.ts:323-361`).
- **Shared server:** a server that more than one person uses: a sign-in list
  with members, a paired device, a hosted workspace or a team Cloud
  (`index.ts:1214-1216`).

### 1.2 What the done files cover, and what this file adds

| Part of the two rows | Covered already | Code files | This file |
|---|---|---|---|
| Floor on and off, the six kinds, where it applies, known gaps | `approval-levels.md` 3.12 | `safety-floor.ts`, `safety-floor-gate.ts`, tests | The full list of matches, the prefixes, the wrappers, the modes, more gaps (3.1, 3.2) |
| Floor on Windows | `approval-levels.md` 3.12, P49 | `safety-floor-gate.ts:26-39` | The Windows rules in full, and the tests that pin them (3.2) |
| Changes since `ed8cb7278` | none | `safety-floor.ts`, `drivers/permission-command.ts`, 2 tests | The en dash rule, the stricter file-edit check (3.2, 3.8) |
| Decision log: file, row, redaction, retention | `approval-levels.md` 3.13 | `decision-log.ts` | Corrections only (3.4) |
| Writers of the log outside the approval path | none | 6 host files, `index.ts` ranges | Each kind of row, and when it is written (3.3) |
| Readers of the log | `approval-levels.md` 3.13 item 6 (in short) | `routes/status.ts`, `activity.ts`, `admin-activity.ts` | Each route, filter, limit and access check (3.5) |
| Bot safety digest | file read, but described as part of the log | `bot-safety-digest.ts`, `bots-text.ts` | It is not part of the log or the floor (3.7) |
| Admin audit plan and admin activity log | none | `admin-audit-plan.ts`, `admin-activity.ts`, `index.ts:1213-1330` | All of it (3.6) |
| The UI of the log | none | `src/components/ActivitySection.tsx`, `ActivityPanel.tsx`, `src/lib/activity.ts` | All of it (5) |

**Corrections to `approval-levels.md`:**

- 3.12 item 2: "`diskutil erase*`" is too wide. Only `eraseDisk`,
  `eraseVolume` and `reformat` match, also after `apfs`
  (`safety-floor.ts:632-636`). `diskutil secureErase` is clear.
- 3.12 item 3: the line numbers moved by 3 to 5 lines. `floorReading` is now
  at `safety-floor.ts:701-722`, `judge` at `:572-681`, the wrappers at
  `:582-618`. The `ssh` test row is at `safety-floor.test.ts:405`.
- 3.12 item 3: the shells that it reads again are `sh bash zsh dash ksh ash
  fish` (`:355`), not only `sh` and `bash`.
- 3.13 item 4: the prune runs at start and **every 6 hours**
  (`index.ts:15063-15067`). The "at most one time each hour" limit is a
  second prune, on a write (`decision-log.ts:118-121`). The same prune also
  cuts the admin activity log.
- 3.13 item 6: the limit of 5,000 is only on the JSON reply of the admin
  activity route. Its CSV has no limit (`routes/status.ts:201-213`). The
  receipt reads the last 20,000 rows **of the whole log** before it keeps the
  rows of one bot (`activity.ts:246`, `:333`).
- Section 2, group B lists `bot-safety-digest.ts` with the decision log. The
  digest is a change detector for the bots file. It is not part of the log
  (`bot-safety-digest.ts:1-4`).

## 2. Files read completely

Four subagents read the files, one for each group. Each wrote its report a
file at a time. I checked the key findings against the code: the floor rows
(`safety-floor-gate.ts:115-127`, `:161-176`), the receipt filter
(`activity.ts:333`, `routes/status.ts:246-248`), the wrong decision values
(`host/outside-writes.ts:81`, `index.ts:11195-11208`,
`host/mcp-requests.ts:112-113`), the rows before the action
(`phones/host.ts:110-112`, `email/host.ts:164`, `index.ts:14207-14216`), the
list rows (`phones/rpc.ts:37`), the merge (`admin-activity.ts:391-392`), the
prune timer (`index.ts:15063-15067`), the digest (`bot-safety-digest.ts:1-11`),
the thread level route (`request-auth.ts:380`, `admin-audit-plan.ts:29-30`,
`routes/tasks.ts:380-386`), `diskutil` (`safety-floor.ts:632-636`), the UI gate
(`src/components/settings/pages/DataPages.tsx:49`) and `watch.json`
(`host/proactive.ts:195-212`).

| Group | File | Lines |
|---|---|---|
| A. Command list | `safety-floor.ts` | 728 |
| | `drivers/permission-command.ts` | 148 |
| | `drivers/permission-command.test.ts` | 135 |
| | `drivers/openai-chat-safety-floor.test.ts` | 270 |
| B. Writers | `phones/host.ts` | 155 |
| | `host/mcp-chat.ts` | 152 |
| | `host/skills-library.ts` | 486 |
| | `host/skill-switch-host.ts` | 242 |
| | `app-settings/host.ts` | 298 |
| | `email/host.ts` | 211 |
| | `decision-log.ts` (again, to check claims) | 275 |
| C. Readers | `routes/status.ts` | 253 |
| | `activity.ts`, `activity.test.ts` | 361, 267 |
| | `read-and-draft.ts` | 188 |
| | `team-memory-requests.ts` | 103 |
| | `host/connector-cards.ts` | 92 |
| | `host/proactive.ts` | 300 |
| | `host/private-records.ts`, `.test.ts` | 65, 96 |
| | `host/lending-lifts.ts` | 203 |
| | `host/outside-writes.ts` | 85 |
| | `src/components/ActivitySection.tsx`, `.test.ts` | 157, 52 |
| | `src/components/ActivityPanel.tsx` | 185 |
| | `src/lib/activity.ts` | 150 |
| | `packages/phone-protocol/src/activity.ts` | 40 |
| D. Audit and documents | `admin-audit-plan.ts` | 43 |
| | `admin-activity.ts`, `.test.ts`, `.e2e.test.ts` | 447, 271, 285 |
| | `bot-safety-digest.ts` | 30 |
| | `bots-text.ts` | 58 |
| | `tool-permission-audit.e2e.test.ts` | 22 |
| | `docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md` | 117 |
| | `docs/verification/shared-workspace-governance.md` | 196 |

**Ranges.**

- `safety-floor.test.ts` (773): 1-37, 159-320, 355-773, and the full diff from
  `ed8cb7278`.
- `index.ts` (15258): 540-556, 692, 746, 775-790, 1085-1135, 1200-1345,
  4760-4850, 5538-5546, 6490-6570, 9110-9360, 11060-11320, 11570-11590,
  11905-11930, 11981, 12043, 12140, 12163, 12176-12186, 12256, 13135-13315,
  13440-13470, 13985-14005, 14145-14260, 15050-15070, 15212-15230.
- `cli.ts` (1053): 420-500. `request-auth.ts`: 311-346, 378-381, 480-552.
  `routes/tasks.ts`: 241-250, 270-330, 368-400. `routes/bot-messages.ts`:
  600-760. `routes/internal-mcp.ts`: 240-392. `host/mcp-requests.ts`: 70-120.
  `routine-requests.ts`: 955-1060. `usage-ledger.ts`: 86, 269-283, 440-446.
  `sessions.ts`: 480-492. `server-update.ts`: 215-245.
  `host/visibility-host.ts`: 40-75. `safety-floor-gate.ts` (read completely
  by `approval-levels.md`): 1-177 again, to check.
- Tests, the cases that read the log: `phones/rpc.test.ts` 75-118, 150-228,
  275-293, 327-342. `app-settings/host.test.ts` 200-210, 320-362, 465-477.
- `docs/self-hosting.md`: 1080-1092, 1220-1228, 1262-1272, 1540-1680.
  `docs/verification/README.md`: lines 62, 108, 109.
  `src/components/settings/pages/DataPages.tsx`: 40-52. `src/locales/en.json`:
  4546-4610, 7895-7903, 8409, 9559-9564.

Reader A also ran `floorReading` from `safety-floor.ts` once with Node, in its
own scratch folder, to test the gaps of section 3.1. It changed no file.

## 3. How it works

### 3.1 The never-list in full

The floor reads one command line and gives a reading. `safety-floor.ts` does
no I/O.

1. **`delete-root`** (`:14-15`):
   - POSIX `rm` with a recursive flag and a target that is `/`. These count:
     `/`, `//`, `/.`, `/..`, `/*`, `/*.*`. A last part `*` or `*.*` is
     removed, and `..` above the root stays at the root (`:489-492`, `:517`).
   - Windows forms, only in the `windows` mode: `rd`, `rmdir`, `del`, `erase`,
     `ri`, `Remove-Item` or `rm` with `C:`, `C:\`, `\`, `%SystemDrive%` or
     `%HOMEDRIVE%` (`:42`, `:543-551`). Git Bash `/c` and `C:/` too
     (`:526-528`, `:625`).
   - Not matched: `\\server\share` (another computer), `C:name`, a relative
     name (`:545-548`).
2. **`delete-home`** (`:16`):
   - Unquoted `~` or `~/...`, `$HOME`, `${HOME}`, `${HOME:?}`, `${HOME?msg}`
     (`:101`, `:319-321`). A quoted `'~'` is a name, not the home (`:34`).
   - The home itself, also `~/`, `~/.` and `~/..`. `~/sub` and `~/../name` are
     allowed (`:515-516`).
   - A path that is equal to the home folder that the gate gives
     (`homedir()`). The compare ignores case on macOS and Windows (`:519`,
     `:524`, `:554-555`).
   - Windows forms: `$env:USERPROFILE`, `$env:HOME`, `%USERPROFILE%`,
     `%HOME%`, `%HOMEDRIVE%%HOMEPATH%` (`:40-41`, `:103-104`, `:537`).
   - A home under a temp folder (`/tmp`, `/var/folders`, `C:\Windows\Temp`
     and others) does not match by its path. `~` and `$HOME` still match
     (`:504-506`).
3. **`delete-system-directory`** (`:20`):
   - Exact paths only: `/etc`, `/usr`, `/bin`, `/sbin`, `/var`, `/boot`,
     `/home`, `/lib`, `/lib32`, `/lib64`, `/libx32`, `/System`, `/Library`,
     `/Applications`, `/Users` (`:22-25`). On macOS also `/private`,
     `/private/etc`, `/private/var` (`:27`).
   - So `/etc/*` matches, but `/usr/local` and `/var/log` do not. The compare
     ignores case on macOS and Windows, not on Linux (`:497`).
   - Windows: `Windows`, `Users`, `Program Files`, `Program Files (x86)` and
     `ProgramData`, one level under a drive only (`:28-31`, `:552`). So
     `C:\Windows\System32` does not match. The variables `%SystemRoot%`,
     `%windir%`, `%ProgramFiles%` and others also count (`:43-45`).
4. **`format-disk`** (`:17`):
   - `mkfs` or `mkfs.<type>` with a `/dev/...` argument that is not a scratch
     device (`loop`, `ram`, `nbd`, `zram`) and has no variable (`:51-57`,
     `:631`). So `mkfs /dev/null` also blocks.
   - `diskutil eraseDisk`, `eraseVolume` or `reformat`, also after `apfs`,
     unless the last argument comes from `$(hdiutil attach ...)`, which is a
     new RAM disk (`:632-636`).
   - Windows: `format C:`, `Format-Volume` with any arguments, and
     `Clear-Disk` only with `-RemoveData` (`:671-679`).
5. **`overwrite-disk`** (`:18`):
   - A redirect (`>`, `>>`, `>|`, `&>`) to a disk device (`:290-318`, `:574`).
   - `dd of=<disk device>` (`:630`).
   - The disk device pattern (`:49`) covers `/dev/disk*`, `/dev/rdisk*`,
     `/dev/disk/<name>`, `/dev/sd*`, `/dev/hd*`, `/dev/vd*`, `/dev/xvd*`,
     `/dev/nvme*`, `/dev/mmcblk*`, `/dev/md*`, `/dev/dm-*` and
     `/dev/mapper/<name>`. A write to `/dev/null` or a terminal is allowed
     (`:48`).
6. **`fork-bomb`** (`:19`): two patterns over the text outside quotes,
   heredocs and comments: `NAME(){ NAME|NAME& };NAME` and the `function NAME`
   form (`:59-65`, `:687`). A cmd or PowerShell bomb does not match.

The label that a person sees names the kind, never the command
(`:7-20`, test `safety-floor.test.ts:713-723`).

**Gaps that the tests pin as "clear"** (`safety-floor.test.ts`):

- `ssh build-host 'rm -rf /'` (`:405`), `docker run ... rm -rf /` (`:404`).
- `alias nuke='rm -rf /'`, `export CLEAN_CMD="rm -rf /"`, a command in an
  array (`:399-401`).
- A heredoc body and `<<<` (`:392-398`).
- `Get-ChildItem C:\ | Remove-Item -Recurse -Force` on all platforms (`:577`).
  It deletes all of `C:\`, but the path comes from a pipe.
- `pwsh -NoProfile -File cleanup.ps1` (`:572`).

**More gaps, found by reading and then run once** (no test pins them). Each
gave "clear": `rm -rf /{etc,usr}`, `rm -rf /e*`, `rm -rf $'/'`,
`pwsh -EncodedCommand ...`, `pwsh –Command ...` with an en dash on the flag,
`Remove-Item -Recurse:$true /`, `Remove-Item -Recurse C:\Windows\System32` on
Windows, `su -c 'rm -rf /'`, `echo 'rm -rf /' | sh`, `bash <<EOF` with
`rm -rf /` in the body, `tee /dev/sda`, `diskutil secureErase`.

The causes, in the code:

- A path is compared as it is spelled. Brace expansion and a glob are not
  resolved (`safety-floor.ts:518-520`).
- `$'...'` is read as a value that is not known (`:133-139`).
- The `pwsh` flag search takes only an ASCII dash (`:596`, `:613`). It does not
  use the new `parameterName` helper.
- The list of prefixes and of shells is closed (`:342-355`). `su`, `xargs`,
  `find -exec`, `chroot`, `csh`, `python -c` and `iex` are not in it.
- Only a redirect and `dd of=` count as a write to a disk. `tee`, `cp`,
  `shred`, `wipefs` and `blkdiscard` do not (`:574`, `:630-637`).

### 3.2 How a line is read

1. A value that is not a string, or only spaces: clear (`:702`).
2. A line over 32 KiB (`32 * 1024` UTF-16 units): `{read: false}`. The floor
   does not scan it (`:359`, `:703`).
3. The private markers U+E000 and U+E001 of the lexer become U+FFFD, so a
   command cannot make a false marker (`:714-715`).
4. A `posix` scan runs on each platform. On a Windows host, a second scan in
   the `windows` mode runs too. A hit in either one blocks (`:716`).
5. A hit gives `{read: true, verdict}`, also when the rest of the line was not
   read. No hit and a line not read to its end gives `{read: false}`. An
   exception gives `{read: false}` (`:717-720`).

**The lexer** (`:91-338`) splits the line at `;`, `|`, `&`, a newline, `(` and
`)`. It reads inside `$( )`, back quotes, `<( )` and `>( )`. Single-quoted
text, a heredoc body and a `#` comment are data, not commands. It nests at
most 40 levels (`:85`). An open quote, `${`, `(` or heredoc gives
`{read: false}` (`:119`, `:221`, `:244`, `:272`, `:331`, `:336`).

**Prefixes that it skips** (`:342-353`, `:391-449`): `sudo`, `doas`, `env`,
`nice`, `timeout`, `exec`, `command`, `nohup`, `time`, `builtin`, `busybox`,
and an assignment `NAME=value`. The program name is the last part of the path,
in lower case, without `.exe`, `.com`, `.cmd` or `.bat` (`:361-363`).

- `sudo -l` and `command -v` run nothing, so the floor does not judge the rest
  (`:429`).
- `env -S LINE` splits LINE into words. A LINE with `$`, a backslash or `#`
  gives `{read: false}` (`:365-368`, `:440-442`).
- A long option that is only the start of a name, for example `sudo --us`,
  gives `{read: false}` (`:421-422`).

**Wrappers that it reads again:**

- `sh bash zsh dash ksh ash fish` with `-c` (also `-ec`, `-xc`) (`:355`,
  `:452-466`).
- `eval`, with its words joined by a space (`:621`).
- `pwsh -c` or `powershell -Command` off Windows: the line after the flag is
  read two times, as POSIX and then as PowerShell (`:593-599`).
- On a Windows host: `cmd /c` or `/k`, and `powershell` or `pwsh -Command`
  (`:600-618`).
- At most 4 levels (`MAX_DEPTH`, `:357`). A fifth wrapper gives
  `{read: false}` (`:584-588`).

**The modes** (`:563-564`):

- `posix` runs on each host, first.
- `windows` runs only when the platform is `win32`. The gate is always off on
  `win32` (`safety-floor-gate.ts:36-39`). So the `windows` mode and the Git
  Bash rules run only in tests. The test file says: "THE WINDOWS ROWS ARE NOT
  USED BY THE GATE YET" (`safety-floor.test.ts:19-23`).
- `powershell` runs only inside `pwsh -c` on macOS or Linux. It judges
  `Remove-Item` and its aliases with `-Recurse` (`:641-652`). This is the only
  non-POSIX reading that a server uses.

**Changed since `ed8cb7278`:** a new helper `parameterName` (`:558-561`) reads
an en dash, an em dash or a horizontal bar at the start of a parameter as `-`.
Before, only `Clear-Disk` had this rule. Now `-Recurse` of `Remove-Item`,
`ri` and `rm` takes it too (`:644-645`, `:658-661`). Tests:
`safety-floor.test.ts:223-227`, `:488`.

### 3.3 Who writes the decision log

`approval-levels.md` 3.13 covers the approval path (`index.ts:4782-4791`,
`:6515-6525`, `:6552-6563`) and the floor. This section covers the other
writers.

**The floor rows** (`safety-floor-gate.ts`):

1. The central handler: `denyAtSafetyFloor` writes `auto-denied`, source
   `safety-floor`, `rule` = the kind, `summary` = the display summary of the
   request (`:115-127`). Then it denies the engine. When the deny fails, it
   stops the turn if the turn is still current (`:128-135`). So the log holds
   the command text of the summary, after redaction.
2. The chat engine gate: `floorBlockForToolCall` writes the same row for a
   never-list command and for an unreadable one, with `rule: "unreadable"`
   (`:161-176`). This gate has no card.
3. A held command (unreadable, with a card) gets no floor row. It gets the
   normal `card-shown` row (`:98-100`).

**The other writers.** "Before" means the row is written before the action.
"After" means after it.

| Writer | Decision | Source | When |
|---|---|---|---|
| `phones/host.ts:110-112` | `auto-approved`, `auto-denied` | `connector-scope` | Before |
| `email/host.ts:164` | `auto-approved`, `auto-denied` | `connector-scope` | Before |
| `index.ts:14207-14216` (connector call) | `auto-approved` | `connector-scope` | Before 6 more checks |
| `index.ts:14157-14197`, `:14245-14248` | `auto-denied` | `connector-scope` | Before |
| `host/connector-cards.ts:42` | `auto-denied` | `connector-scope` | Before |
| `host/mcp-chat.ts:61` with `mcp-requests.ts:84` | `card-shown` | `no-grant` | After the card |
| `host/mcp-chat.ts:61` with `mcp-requests.ts:112-113` | `user-approved`, `user-denied` (the click) | `user` | After the apply |
| `host/mcp-chat.ts:108` with `routes/internal-mcp.ts:251-370` | `auto-approved` | `full-access`, `level` | After |
| `host/skills-library.ts:294-295` | `auto-approved` | `full-access`, `level`, `self` | After |
| `host/skill-switch-host.ts:136-137` | `auto-approved` | `full-access`, `level`, `self` | After |
| `host/skill-switch-host.ts:150-151` | `card-shown` | `skill` | Before |
| `host/skill-switch-host.ts:164-190` | `user-approved`, `user-denied` | `user` | After |
| `app-settings/host.ts:149` | `auto-approved` | `app-settings` | After |
| `read-and-draft.ts:144-183` | `auto-denied` | `routine` | Before (a refusal) |
| `team-memory-requests.ts:64-65`, `:82-83` | `auto-approved` or `card-shown`, then `user-*` | the apply, `team-memory`, `user` | After, before |
| `host/lending-lifts.ts:148`, `:195` | `card-shown`, `user-*` | `question`, `user` | Before, after |
| `host/outside-writes.ts:51`, `:81` | `card-shown`, `user-*` (the result) | `outside-write`, `user` | Before, after |
| `index.ts:9132-9133` (team setup) | `user-*` (the result) | `user` | After |
| `index.ts:9198-9237` (profile, model) | `user-*` | `user` | After |
| `index.ts:9327-9330` (each Undo) | `user-undone` | `user` | After |
| `index.ts:11199-11208` (skill card) | `user-approved` | `user` | After |
| `index.ts:13180-13190` (routine change) | `auto-approved`, always | `appliedBy` or `routine` | After |
| `index.ts:13246-13309`, `:13999-14001` | `auto-approved` or `card-shown` | the apply, `profile`, `model` | After, before |

**Problems in these rows:**

1. **The decision does not mean one thing.**
   - `mcp-requests.ts:112-113` writes the click. A person's Allow that then
     fails to apply is still `user-approved`.
   - `host/outside-writes.ts:81` and `index.ts:9133` write the result. A
     person's Allow that fails to apply is `user-denied`. The log then says
     that the person refused.
   - `index.ts:11195-11208`: the person pressed Deny on a skill card, but the
     staged write had already applied. The code sets the card to `allow` and
     writes `user-approved`.
2. **An "allowed" row does not prove that the call ran.**
   - Phone: an offline phone, a missing phone or a failed job writes no
     second row (`phones/host.ts:126-140`). The test
     `phones/rpc.test.ts:176-180` shows a failed call logged `auto-approved`.
   - Email: no mailbox, a mailbox that cannot send, or a send error writes no
     second row (`email/host.ts:166-186`).
   - Connector call: the proactive fence, the managed policy, the link
     limits, the connector scope, the sandbox and the outbound hold all run
     after the row (`index.ts:14236-14260`).
3. **A list of tools writes rows.** A phone `tools/list` calls `authorize` for
   each tool (`phones/rpc.ts:37`), and each call writes a row
   (`phones/host.ts:110-112`). The log fills with rows for tools that nobody
   called (`phones/rpc.test.ts:114-116`). An email `tools/list` writes no row
   (`email/host.ts:151-154`).
4. **A phone send has no card and no outbound row.** The person confirms with
   the Send tap on the phone, and that tap is not logged (`phones/host.ts:2-4`,
   `phones/rpc.test.ts:183-216`).
5. **The source does not always name the change.** Team setup, bot deletion
   and a new bot use the card source `profile` (`index.ts:13295`, `:13309`,
   `:14001`).

**What a person or an admin does that has no row:**

- A change of the retention days. Only `config.json` or the variable sets
  it (`config.ts:390`). No route writes it.
- A share of a learned skill with other bots (`host/skills-library.ts:226-251`,
  `:427-452`).
- An MCP Sign in card, and the add of a server to the bot list
  (`host/mcp-chat.ts:64-76`, `:104`).
- A failed Allow on a skill switch card or a skill card
  (`host/skill-switch-host.ts:172-185`, `index.ts:11226-11305`).
- A refused Undo (`index.ts:9323-9325`).
- A lending lift answer that comes after the memory changed again, and a
  second "Not now" (`host/lending-lifts.ts:138`, `:187-192`).
- A team memory card that is no longer open (`team-memory-requests.ts:76-80`).
- A connect refused by the policy or the team (`host/connector-cards.ts:46-47`).
- A change of the level of a thread. `routes/tasks.ts` has no call of
  `appendDecision`, and the change gets no admin row either (section 3.6,
  problem 1).

### 3.4 The actor and the retention

**The actor:**

1. `decisionActorFor(auth)` (`index.ts:1087-1096`) gives `{kind: "worker"}`
   for a loopback request with the `service` trust, `{kind: "loopback"}` for
   another loopback request, and `{kind: "session", sessionId, label, email?,
   userId?}` for a session. A `userId` that starts with `portal:` is never
   written.
2. `answeringCardAs` runs the answer of a card inside
   `withDecisionActor` (`index.ts:1112-1128`). The Undo route does the same
   (`index.ts:12182`).
3. `appendDecision` adds the actor of the scope only to a row with the source
   `user` (`decision-log.ts:126`). A writer can still give `row.actor` for any
   source (`:127`). None does.
4. The scope is an `AsyncLocalStorage`. A row that a timer or a queued job
   writes has no actor.
5. The `sessionId` is the `randomUUID()` of the session record. It is not the
   bearer token. The token is kept only as a hash (`sessions.ts:484-488`).

**The retention:**

1. `bindDecisionRetention` at `index.ts:781` reads the live config on each
   call, so a config reload changes it with no restart.
2. A prune runs at start and every 6 hours, for the decision log and the
   admin activity log (`index.ts:15063-15067`). A write also prunes, at most
   one time each hour (`decision-log.ts:118-121`, `admin-activity.ts:35`,
   `:47-50`). The decider log uses the same days (`decider/log.ts:52`).
3. Settings shows the days, read only (`index.ts:11581`,
   `routes/status.ts:220`).
4. A flush runs before a backup and at shutdown (`index.ts:11913`, `:15224`).
5. The CLI command that edits the sign-in list binds the retention from the
   file before it writes an admin row (`cli.ts:460-461`).
6. An older server's `decisions.ndjson` and `.1` files are still read and
   age out (`docs/self-hosting.md:1557-1558`). This is not verified in the
   code.

### 3.5 Who reads the decision log

Each reader goes through `readRows` (`decision-log.ts:190-207`). A missing
file gives no rows. A bad line, or a row with no `at`, `threadId`, `decision`
or `source`, is skipped with no error.

All four routes need the `admin` scope. None of them is in `CLIENT_ALLOW`, and
a route that is not in that list is admin only (`request-auth.ts:311-312`,
`:533-540`). A loopback request has the `admin` scope.

1. **`GET /api/decisions?limit=`** (`routes/status.ts:183-190`):
   - `limit` must be a positive whole number, else 400. The default is 200.
   - It has **no upper limit**. A very large `limit` reads all files.
   - Each row goes through `records.decisionRow(auth)`, the filter of private
     threads (`:53`, `:189`).
   - No UI calls it.
2. **`GET /api/decisions.csv?from&to`** (`routes/status.ts:224-235`):
   - The defaults are the first day of this UTC month and now. A bad date or
     a span over 366 days gives 400 (`usage-ledger.ts:269-283`).
   - Columns: time, decision, source, bot, tool, summary, rule, unattended,
     answered_by, thread, request (`decision-log.ts:256`).
   - `csvCell` puts `'` before a cell that starts with `=`, `+`, `-`, `@`, a
     tab or a CR (`usage-ledger.ts:440-446`).
   - It does not flush the write queue, so a row in the queue is missing.
   - No UI calls it.
3. **`GET /api/admin-activity` and `.csv`** (`routes/status.ts:191-223`):
   - The default range is the last 30 days. `who` is cut to 200 characters.
   - It flushes the admin queue, but not the decision queue (`:197`).
   - The JSON reply has at most 5,000 entries, 500 by default. A bad `limit`
     falls back to 500 with no error (`:212-213`). The CSV has no limit.
   - The 400 text for a bad `what` omits `bot-api`, which the code accepts
     (`admin-activity.ts:13`).
   - The merge is in section 3.6.
4. **`GET /api/bots/:id/activity?limit=`** (`routes/status.ts:237-250`,
   `activity.ts:323-361`):
   1. It reads the last 2,000 runtime events of each thread of the bot that
      the reader may see (`routes/status.ts:246`, `activity.ts:297-321`).
   2. It reads the last 20,000 rows of the **whole** log and keeps the rows
      of this bot (`activity.ts:333`). It does not filter by thread.
   3. It groups rows by `requestId`. The last row gives the outcome. A
      non-allowed decision is its own entry. An allowed decision joins the
      nearest tool run of the same thread and tool, from 5 s before to 30 s
      after (`activity.ts:246-250`, `:270-295`, `:338-356`).
   4. It sorts the result, newest first, and cuts it to `limit` (default 300)
      (`:359-360`).

**Problems of the readers:**

- **A privacy filter is missing on one route.** Step 4.2 keeps rows of all
  threads of the bot, also the private threads that step 4.1 hid. The route
  does not call `records.decisionRow` (`routes/status.ts:248`). On a team
  Cloud an admin can read the summary and the thread id of a decision in
  another person's private chat. The other three routes apply the filter
  (`routes/status.ts:189`, `:198`, `:233`). No test covers this case
  (`activity.test.ts:247-252` tests another bot only).
- **A quiet bot can show no decisions.** The 20,000 rows are of all bots. On a
  busy server the rows of other bots fill the scan (`activity.ts:246`).
- **A filtered row keeps the actor.** `decisionRow` removes `summary`, `rule`,
  `requestId` and the thread, and hides the bot. It keeps `actor`, so a hidden
  row still names who answered (`host/private-records.ts:47-56`). The test has
  no actor in its row (`host/private-records.test.ts:78-79`).
- **A card that timed out stays "Needs you".** A time limit writes no row, so
  the last row stays `card-shown` (`activity.ts:261`).

### 3.6 The admin activity log and the audit plan

**What it records:** changes that an admin makes on a shared server. It is a
separate file: `<data>/admin-activity/YYYY-MM.ndjson`, folder 0700, file 0600
(`admin-activity.ts:33-46`).

**When it records** (`adminActivityRecording`, `index.ts:1214-1216`):

1. Never when the desktop application started the server
   (`DESKTOP_MANAGED`, `index.ts:746`). No code comment gives the reason. The
   documents say: "The packaged desktop app records nothing"
   (`docs/verification/shared-workspace-governance.md:40`).
2. Else it records on a hosted workspace or a team Cloud. It also records
   when the sign-in list is shared, or when a paired device or an open
   pairing code exists.
3. The test `admin-activity.e2e.test.ts:259-284` shows that the change that
   ends the sharing is still recorded.

**The flow of one admin request** (`index.ts:1251-1274`):

1. `adminAuditPlan(method, path, lendingEnabled())` (`admin-audit-plan.ts:20-42`)
   gives null for `GET`, `HEAD`, `OPTIONS`, `/api/internal/` and
   `/api/testing/`. Else it gives a plan:
   - `config` is true when the route needs the `admin` scope (`:24`). The
     third argument changes the scope of the routes of lent computers (`:20`,
     `request-auth.ts:331-334`).
   - Named fields: a new bot (`POST /api/bots` and three import paths), a new
     webhook, a pairing code, a bot change (`PATCH /api/bots/:id`, `/model`,
     `/profile`, `POST /always-allow`), a bot delete, a webhook change, a
     session revoke, a room change, an engine action (`:25-41`).
2. The server takes a "before" copy of the bot, webhook, session, room and
   department grants (`index.ts:1258-1264`). A person's own bot is never
   audited (`:1257`).
3. A config save inside the request writes `configChangeRows` with the actor
   (`index.ts:1224-1230`). A config save from a timer or a bot turn has no
   request scope, so it writes no row (`:1227`).
4. On `finish`, a status of 400 or more writes no row. The server also skips
   the row when the server was not shared at the start and is not shared now
   (`:1268-1269`).
5. `adminAuditRows` makes the rows: `bot.update`, `visibility.update`,
   `bot.create`, `bot.delete`, `webhook.*`, `session.revoke`,
   `pairing.create` (never the code), `engine.<action>`,
   `room.audience-reset` (`index.ts:1276-1330`). An error only writes a
   warning to the console (`:1271-1273`).

**The actor:** `{kind: "cli"}` when a loopback owner request has the CLI
marker header, else `decisionActorFor` (`index.ts:1218-1222`). Any local
caller with owner trust can set that header, so "Command line" is a label, not
a proof.

**Redaction at write** (`admin-activity.ts:80-160`):

- A key whose name has `token`, `secret`, `password`, `credential`,
  `cookie`, `apikey` and others, or ends in `key`, becomes `[hidden]`. A name
  that ends in `tokens` stays (`:81`, `:87-93`).
- Each value under `headers`, `env` or `environment` is hidden (`:82-83`).
- URLs lose the user part, long mixed path parts and credential query values
  (`:105-118`). The value after a secret flag such as `-k` is hidden
  (`:97-102`, `:121-129`).
- Strings also go through `redactSecrets` (`:134`). Depth over 6 is cut,
  arrays over 100 items are cut, and a value over 2,000 characters becomes
  `"[large value]"` (`:84`, `:136-137`, `:157`).
- A bot's instructions are kept only as a length and a short SHA-256
  (`:240`, `:243-247`).

**The merge with decision rows** (`activityEntries`, `admin-activity.ts:384-427`):

- `what=all`: admin rows plus decision rows with the source `user`.
- `what=approvals`: only decision rows with the source `user`.
- `what=decisions`: every decision row, but **no** admin rows (`:409`). The
  governance document says "adds automatic ones", which is wrong
  (`shared-workspace-governance.md:43`).
- A category: only admin rows of that category.
- Decision rows go through `redactSecrets` again (`:395`). Admin rows do not.
- `who` is a substring of the actor label. A row with no actor has the label
  "", so a `who` filter removes every automatic row (`:389`, `:425`).
- So a floor row shows only under "Every approval decision", and never with a
  `who` filter.

**Problems of the admin log:**

1. **A thread level change has no admin row.** `PATCH /api/bots/:id/tasks/:id`
   is in `CLIENT_ALLOW` (`request-auth.ts:380`), and the plan matches only
   `/api/bots/:id` and three sub-paths (`admin-audit-plan.ts:29-30`). The
   handler changes `approvalMode` (`routes/tasks.ts:380-386`). Its checks: a
   team Cloud refusal, the owner on a Cloud home, no `custom` and no `full`
   on a hosted workspace (`:272-277`, `:384-386`). So on a self-hosted shared
   server, a member can raise a thread to Full, and no admin row records it.
   This is by reading. No test covers it.
2. **The compared bot fields are fewer than the safety fields.**
   `BOT_AUDIT_FIELDS` (`admin-activity.ts:227-231`) does not have `toolsOff`,
   `outbound`, `phoneApps`, `access`, `onlyPeopleAdded`, `reportsTo` or
   `createdBy`. `BOT_SAFETY_FIELDS` has them (`bot-safety-digest.ts:7-11`). A
   `PATCH` that changes only those fields writes no row.
3. **A webhook prompt is stored in full** in `webhook.update` and
   `webhook.create` (`index.ts:1232`, `:1303`, `:1311-1314`). A bot's
   instructions are stored only as a hash.
4. **Only `before` and `after` are redacted.** `target.name`, `changed` and
   `action` are written as given (`admin-activity.ts:58-59`).
5. **The UI text is wrong for two engines.** The action `engine.account-add`
   always reads "Added a Claude account" (`en.json:4590`), but the plan gives
   it for three engines (`admin-audit-plan.ts:17-18`, `:41`).

### 3.7 The bot safety digest

The digest is not about the floor, and nobody reads it. It is an internal
string that makes sure a permission change reaches the disk
(`bot-safety-digest.ts:1-4`):

1. `BotsText` keeps one serialized string for each bot of `bots.json`. A save
   that names some bots serializes only those (`bots-text.ts:1-3`).
2. Before each save, `build` computes the digest of each bot: its approval
   level, grants, tools, apps, folders and who may reach it
   (`bot-safety-digest.ts:7-15`). A bot whose digest moved is serialized again,
   also when no save named it (`bots-text.ts:39-45`).
3. `commit` stores the texts and digests after the file is on disk
   (`bots-text.ts:49-55`). When the write fails, `commit` does not run, so the
   next save serializes the same bots again.
4. The comment names a known open risk. Take a change made in place to a bot
   that no save named. A crash before the next full write loses it. A
   permission change is the exception, because step 2 finds it
   (`bots-text.ts:4-6`).

### 3.8 The file-edit check of one ACP engine

`acpFileEditWithin` (`drivers/permission-command.ts:104-118`) is not part of
the floor. It is an automatic allow for "Auto-accept edits" on one native ACP
engine (`drivers/antigravity.ts:275-276`). Since `ed8cb7278` it is stricter.
It allows an edit only when:

1. The kind is `edit`, a root is given and the input names no command.
2. Each path is absolute, has no NUL and **no `..` part** (`:111`).
3. Its real target is a file or does not exist yet. A folder or a device
   fails (`:120-127`).
4. The target is inside the real root, and the path as written is the same as
   the real path. So a path through **any** link, also a link inside the root,
   needs a card (`:113-116`).

A link that is made between this check and the write is not seen. The link
tests are skipped on Windows (`permission-command.test.ts:108`).

**A gap in a nearby function:** `acpShellRequest` joins two different
spellings of a command with a newline for the central floor
(`permission-command.ts:79-80`). A first spelling that ends with a backslash
joins the next line to it in the POSIX reading (`safety-floor.ts:238-241`).
So `{command: "ls \\", CommandLine: "rm -rf ~"}` reads as one `ls` command,
which is clear. Reader A ran this case. `acpAnswersAlone` reads each spelling
alone and has no such gap (`:70-73`).

## 4. The data

**The floor:**

```ts
type FloorRule = "delete-root" | "delete-home" | "delete-system-directory"
  | "format-disk" | "overwrite-disk" | "fork-bomb";            // safety-floor.ts:5
interface FloorVerdict { rule: FloorRule; label: string }      // :7-12
type FloorReading = { read: true; verdict: FloorVerdict | null } | { read: false }; // :696
interface FloorBlock {                                          // safety-floor-gate.ts:41-49
  rule: FloorRule | "unreadable"; label: string;
  line: string;    // "Blocked by the safety floor: <label>"
  reason: string;  // line + advice, sent to the engine as the tool result
}
```

- `MAX_COMMAND_LENGTH` is 32,768 (`safety-floor.ts:359`). `MAX_DEPTH` is 4
  (`:357`). The nesting limit is 40 (`:85`).
- The setting: `config.json` `safetyFloor.enabled`, or the variable
  `OMB_SAFETY_FLOOR=1`. The variable cannot turn it off
  (`safety-floor-gate.ts:14-17`). `GET /api/config` reports
  `safetyFloor.enabled`, and `false` on Windows
  (`docs/self-hosting.md:1583-1589`).

**The decision row** (`decision-log.ts:53-74`, from `approval-levels.md`
3.13): `at`, `threadId`, `requestId?`, `botId?`, `botName?`, `tool?`,
`summary?`, `summaryCode?`, `summaryParams?`, `decision`, `source`, `rule?`,
`unattended?`, `actor?`, `via?`, `origin?`.

- The sources that this file adds to the list of 3.13: `app-settings`,
  `connector-scope`, `outside-write`, `team-memory` (`decision-log.ts:39-43`).
- Only the runtime card path sets `unattended` and `origin`
  (`index.ts:6561-6562`).

**The admin row** (`admin-activity.ts:18-31`):

```ts
interface AdminActionRow {
  at: string;
  category: "config" | "people" | "session" | "webhook" | "bot-api" | "mcp"
    | "engine" | "bot" | "budget" | "visibility";               // :13
  action: string;                  // "<thing>.<verb>", e.g. "bot.update"
  target?: { kind: string; id?: string; name?: string };
  changed?: string[];              // paths, never values
  before?: Record<string, unknown>; after?: Record<string, unknown>; // redacted
  actor: DecisionActor | { kind: "cli" };
}
```

**The audit plan** (`admin-audit-plan.ts:4-15`): `config`, `botId?`,
`createsBots`, `deletesBot?`, `createsWebhook`, `webhookId?`, `sessionId?`,
`pairing`, `engineAction?: {id, action}`, `roomId?`.

**The activity entry** (`admin-activity.ts:357-382`): type `approval` (`at`,
`who`, `what` = the decision, `source`, `bot`, `tool`, `summary`,
`summaryCode`, `summaryParams`, `threadId`, `requestId`) or type `admin`
(`at`, `who`, `what` = the category, `action`, `target`, `changed`, `before`,
`after`). The CSV columns: time, type, who, what, action, target, changed,
before, after, bot, tool, summary, thread (`:430-447`). For a decision, the
`action` column holds the source. `rule` and `requestId` are not in this CSV.

**The receipt row** (`packages/phone-protocol/src/activity.ts:5-40`): `at`,
`threadId`, `turnId?`, `requestId?`, `tool`, `app`, `label`, `labelKey?`,
`appKey?`, `summary?`, `summaryCode?`, `summaryParams?`, `outcome`. The
outcomes: `ran`, `failed`, `running`, `allowed`, `denied`, `waiting`. The map
from a decision (`activity.ts:252-262`): an approve gives `allowed`, a deny or
`user-undone` gives `denied`, `card-shown` gives `waiting`.

**Files:**

| File | Mode | Written |
|---|---|---|
| `<data>/decisions/YYYY-MM.ndjson` | 0600, folder 0700 | append, in order, errors ignored |
| `<data>/admin-activity/YYYY-MM.ndjson` | 0600, folder 0700 | append, in order, errors ignored (`admin-activity.ts:54-68`) |
| `bots.json` | atomic write | narrowed by the digest (3.7) |

The modes do nothing on Windows. Node sets only the write bit there. The tests
skip the mode check on Windows (`admin-activity.test.ts:192`).

## 5. The UI

1. **The notice line of a floor block.** A chat activity line: "Blocked by the
   safety floor: <label>" (`safety-floor-gate.ts:52`, `:118`). For an
   unreadable command: "Blocked by the safety floor: a command it could not
   read". The model gets the same text and an advice in its tool result
   (`:70`, `:78`).
2. **No setting for the floor.** The person can turn it on only in
   `config.json` or with the variable. No Settings field exists
   (`docs/verification/safety-floor.md:139-141`, from `approval-levels.md`).
3. **The Activity panel of a bot** (`src/components/ActivityPanel.tsx`):
   - A side panel of 400 px. It calls `GET /api/bots/<id>/activity?limit=300`
     (`:21`, `:42`). It shows only on a local client (`src/App.tsx:513`).
   - It loads again 400 ms after a live event of type `turn.completed`,
     `runtime.error`, `request.opened`, `request.resolved` or
     `item.completed` (`:63-89`).
   - Text: title "Activity". Subtitle "Every tool {name} used and every
     approval it asked for, newest first." Empty: "Nothing yet. Once {name}
     runs a tool or asks for an approval, it shows up here." Error:
     "Couldn't load: {message}". Busy: "Loading…" (`en.json:7895-7903`).
   - Rows are grouped by day ("Today", "Yesterday", a date). Each row has a
     time, an app, a label, the summary and a chip: Ran, Failed, Running,
     Allowed, Denied, "Needs you" (`en.json:9559-9564`). A floor block shows
     as "Denied" and does not name the kind.
   - The subtitle is not exact, because the server reads only the last
     20,000 rows of all bots.
   - No export button.
4. **The admin Activity page** (`src/components/ActivitySection.tsx`):
   - It shows only when the client is not the desktop application and the
     reader is an admin (`src/components/settings/pages/DataPages.tsx:49`). So
     the person on the desktop has no screen for the decision log, only the
     Activity panel of each bot.
   - It calls `GET /api/admin-activity` 250 ms after a filter change
     (`:64-82`). It never sends `limit`, so it gets at most 500 rows.
   - Filters: Who ("Name or email"), What, From and To dates. What has: "Admin
     changes and answered cards", "Answered cards", "Every approval
     decision", and one choice for each category (`src/lib/activity.ts:5`,
     `en.json:4558-4569`).
   - Footnote: "Who changed settings, people, access and bots on this
     installation, and who answered approval cards. Kept on this server for
     {days} days; nothing is sent to your organization's Admin."
     (`en.json:4547`). The days fall back to 180.
   - States: error "Couldn't load the activity: {message}" with
     `role="alert"`, empty "Nothing matches in this range.", more "Showing
     the newest {shown} of {total}. Narrow the filters, or export CSV for all
     of them." (`:107-113`, `:147-154`).
   - A row: the local time, who ("This computer", "Local service", "Command
     line", an email or "—"), a sentence such as "Approved: Bash in Ops", and
     the summary. An admin row has a "Changed: {paths}" toggle that opens a
     Before and After table. A value over 160 characters is cut
     (`:15-52`, `src/lib/activity.ts:63-81`).
   - "Export CSV" is a plain link to `/api/admin-activity.csv` (`:90`,
     `:143`). A 400 answer downloads as a file. The UI does not show it.
   - The page ignores the `recording` flag of the reply, so it never says that
     a one-person server records nothing (`:68-71`).
   - The old decision words "Reviewer would approve" and "Reviewer would
     decline" still have text (`en.json:4576-4577`).

## 6. The tests

**The floor** (`safety-floor.test.ts`, 773 lines):

- Each platform needs at least 40 blocked and 40 allowed rows, and there are
  at least 40 Windows rows (`:643-650`). A Windows row must block on Windows
  and must not block on macOS or Linux (`:13-17`, `:660-664`).
- The new dash rows (`:223-227`, `:488`).
- The "not clear" rows: an arithmetic `<<` is read as a heredoc that never
  ends, so `(( x << 1 ))` is unreadable. The test calls this a "KNOWN
  LIMITATION" (`:614-624`). `env -S` with a variable, a short long option,
  five wrappers (`:625-640`).
- A block that comes before a break stands (`:688-689`). The 32 KiB limit,
  exactly (`:695-711`). The label never holds a token (`:713-723`). The home
  by its path, with case rules (`:725-736`). An exception gives
  `{read: false}` (`:750-760`). 200,000 characters, 20,000 `(` and 2,000
  nested `bash -c` never throw (`:762-772`).

**The ACP checks** (`drivers/permission-command.test.ts`): the two spellings
of a command, the folders, the floor on ACP under the Linux platform
(`:66-91`), and the new link rules, skipped on Windows (`:108-134`).

**The chat gate** (`drivers/openai-chat-safety-floor.test.ts`):

- A fixture MCP server only records the commands that it gets. Nothing runs a
  shell (`:1-6`, `:30-48`).
- Off, and on under `win32`: `rm -rf /` runs, no row (`:135-158`).
- On at Full: `ls` and `git commit -m 'rm -rf /'` run. `rm -rf /` does not.
  One notice, one `auto-denied` row with `rule: "delete-root"`
  (`:160-178`).
- New: a turn whose only failure is a floor block after the model wrote text
  ends with `blockedAfterReply: true` (`:180-208`).
- Unreadable at Full: refused, `rule: "unreadable"` (`:210-224`). A person's
  Allow at Ask is not changed (`:226-238`). A session grant does not cover a
  never-list command (`:240-253`).
- Gap: the test gives a fake key (`:98-99`), but it does not check that the
  key stays out of the rows.

**The log writers:** `phones/rpc.test.ts` pins the list rows (`:114-116`), the
failed call that is still `auto-approved` (`:176-180`) and the send with no
card (`:183-216`). `app-settings/host.test.ts` pins one row for each set
(`:200-210`) and no key in any row (`:320-362`).

**The readers:**

- `activity.test.ts`: the fold, the 5 s and 30 s window, "waiting", newest
  first, an empty log. Its rows are in the old single file
  `decisions.ndjson`, so the month files are not tested here (`:129`).
- `host/private-records.test.ts`: what an admin keeps of another person's
  row (`:77-88`). Its row has no actor, and its decision value `"allowed"` is
  not a real kind (`:78-79`).

**The admin log:**

- `admin-activity.test.ts`: the redaction cases, the categories, the prune,
  the merge and the CSV formula guard (`:43-260`).
- `admin-activity.e2e.test.ts` runs the real server. A member gets 403. Each
  kind of row, no secret in the files or the CSV, the right admin under
  parallel requests, and "recording only while shared" (`:124-284`). The whole
  suite is skipped on Windows (`:15`, `:99`).
- `tool-permission-audit.e2e.test.ts`: a change of three scope fields writes
  one row, and a title change writes none (`:5-22`).

**No test file imports** `admin-audit-plan.ts`, `bot-safety-digest.ts`,
`bots-text.ts` or `team-memory-requests.ts` (a search of `*.test.ts` in
`server/` and `src/`). The digest is tested only through the store tests
(`registry-store-narrow.test.ts`, not read). `host/proactive.test.ts` exists
and was not read. No test covers the receipt route on a team Cloud.

## 7. Ours compared

None of our crates has approval code yet. `bot-protocol` has `event.rs`,
`ids.rs` and `message.rs`. `bot-core`, `bot-engine`, `bot-cli` and
`bot-desktop` have one source file each.

| Reference | What it does | Ours (crate, module) |
|---|---|---|
| `safety-floor.ts` | The reader and the never-list | `bot-core`, `approval/floor.rs`: a pure function, step 10 or 12 (P49, P97) |
| `safety-floor-gate.ts` | On and off, the deny, the row | `bot-core`, inside the decision function of P112 |
| `drivers/permission-command.ts` | The command line from an engine request | `bot-engine`, the `acp` module (step 9). The floor gets each spelling alone |
| `decision-log.ts` | The log, retention, CSV | `bot-core`, a table of the SQLite store (step 8), written in the same transaction as the state change (`AGENTS.md`) |
| `activity.ts`, `routes/status.ts:237-250` | The receipt of a bot | `bot-core`, one query with a viewer. `bot-desktop`, a Tauri command |
| `routes/status.ts:183-235` | The routes and the CSV | `bot-desktop`, Tauri commands. No HTTP server (D10) |
| `host/private-records.ts` | The privacy filter of an admin | Not needed while one person uses the application (D10) |
| `admin-activity.ts`, `admin-audit-plan.ts` | The admin log | Not planned (D10). The desktop of the reference records nothing too |
| `bot-safety-digest.ts`, `bots-text.ts` | A permission change reaches the disk | Not needed: our store writes each bot row in a transaction |
| `src/components/ActivityPanel.tsx` | The Activity panel | `bot-desktop/ui/src/features/activity/` |
| `src/components/ActivitySection.tsx` | The admin page | Not planned. A view on the desktop is a choice for the author (section 5, item 4) |

## 8. Where we can be better

1. **One meaning for each decision value.** The row keeps the person's answer
   and the result in two fields. **Reason:** a known problem of the reference.
   Three writers use the same value for different things, and one writes
   "approved" for a Deny (`host/mcp-requests.ts:112-113`,
   `host/outside-writes.ts:81`, `index.ts:11195-11208`). An enum for the
   answer and an enum for the result make the wrong row impossible to type.
2. **An "allowed" row only after the last check.** The decision function
   gives one result after all checks, and the row is written with that
   result. **Reason:** a known problem. Three writers log `auto-approved`
   before later refusals (`phones/host.ts:110-112`, `email/host.ts:164`,
   `index.ts:14207-14216`). This adds facts to P46.
3. **A list of tools writes no row.** **Reason:** a known problem. A phone
   `tools/list` fills the log with rows for calls that nobody made
   (`phones/rpc.ts:37`).
4. **One read function with a viewer.** Each reader of the log goes through one
   store query that takes the viewer. **Reason:** a known problem. One of four
   routes skips the privacy filter (`activity.ts:333`). With one function,
   no route can skip it. This matters later, if a server mode comes (D10).
5. **The floor treats more words as unreadable.** A path with a brace, a glob
   at the root or `$'...'`, and `pwsh -EncodedCommand` give a card, not
   "clear". **Reason:** this follows the security invariant of the reference
   ("a line not read to its end is never clear", `safety-floor.ts:1-3`) to
   cases that it reads as clear today (section 3.1).
6. **A level change writes a row.** **Reason:** a known problem. A member can
   raise a thread to Full with no audit row (`request-auth.ts:380`,
   `admin-audit-plan.ts:29-30`). P117 already moves a raise to a Tauri
   command. A row with the old level and the new level costs one more write in
   the same transaction.
7. **The ACP floor reads each spelling alone.** **Reason:** a known gap. A
   joined line hides a second command after a backslash
   (`drivers/permission-command.ts:79-80`).
8. **A test checks that a key stays out of the log.** **Reason:** the
   reference test gives a fake key but does not check the rows
   (`drivers/openai-chat-safety-floor.test.ts:98-99`, `:175-177`).

**Keep as the reference does, because it is correct and tested:**

- The floor changes only an automatic allow, never the answer of a person
  (`openai-chat-safety-floor.test.ts:226-238`).
- A line not read to its end is never clear. An exception gives
  `{read: false}` (`safety-floor.ts:719-720`).
- The label names the kind, never the command (`safety-floor.ts:10`).
- A gate with no card refuses an unreadable command. A gate with a card holds
  it for a person (`safety-floor-gate.ts:98-100`, `:161-176`).
- The floor reads the full command line, never the display summary
  (`safety-floor-gate.ts:94-95`).
- The CSV formula guard (`usage-ledger.ts:440-446`).
- The retention: 180 days, 1 to 3,650, a prune at start and on a timer
  (`decision-log.ts:81-101`, `index.ts:15063-15067`).
- A write error of the log does not deny a tool. The roadmap rule: "an audit
  log must never take down the decision it audits"
  (`2026-08-31-00-control-plane-roadmap.md:54-56`). Our log row is in the same
  transaction as the state change, so this case becomes "the state change
  fails". This is a difference for the author to decide.

### The problems of `changelog.md` section 5 in this feature

| Problem | In this feature | Where |
|---|---|---|
| The approval model changed | Yes. Since `ed8cb7278`: the en dash rule for `-Recurse`, the stricter file-edit check, and `blockedAfterReply` on a chat turn. Also: the floor came in v0.1.111 (`changelog-check.md:622`), and its Windows reader was made inert the same day (`approval-levels.md` P49). The decision values have no single meaning (3.3) | 3.2, 3.3, 3.8 |
| A secret or an access right in the wrong place | Yes. The receipt route skips the privacy filter. A filtered row keeps the actor. A webhook prompt is stored in full. The CLI actor is a header that any local owner can set. Handled: the label has no command, the log rows are redacted, the admin values are redacted | 3.5, 3.6 |
| Process control on Windows | Yes. The floor does nothing on a Windows server. The file modes do nothing on Windows. The admin e2e suite and the link tests are skipped on Windows | 3.2, 4, 6 |
| A file written over after a failed read | Not in the decision log or the admin log: both only append. Yes nearby: `watch.json` of the proactive bot becomes `{}` after any read error, and the next save writes over it. Then the default routine can be made again (`host/proactive.ts:195-212`). That belongs to the automations feature | 3.5 |
| A feature added, then removed or reversed | Yes. The model reviewer left the kinds `review-would-*` and their UI text (`en.json:4576-4577`) | 5 |

## 9. Not verified

- Whether `step.detail` of a tool run event is redacted before it reaches the
  events file. The receipt shows it as the summary of a run (`activity.ts:311`).
- Whether the chat line of a read-and-draft refusal is redacted
  (`read-and-draft.ts:147`).
- Whether each engine asks permission for the email send tool, so that the
  outbound guard puts a card before an email send (`auto-approve.ts:114`).
- Whether the answers to lending lift, outside write and team memory cards run
  inside `answeringCardAs`, so that their rows carry the actor.
- Whether the other admin writers (team owners, team connections, bot access,
  a member who left, the bot API host, the server update) check
  `adminActivityRecording()` first. Only the pause hook was seen to check it
  (`index.ts:11929`).
- Whether `PUT /api/bots/:id/access` and `/reports-to` write their own admin
  rows.
- That a member can raise a thread to Full on a self-hosted shared server. This
  is from the guards of `routes/tasks.ts`, not from a test or a run.
- The reading of the old `decisions.ndjson` file (from
  `docs/self-hosting.md:1557-1558` only).
- `safety-floor.test.ts` lines 38-158, 231-285 and 321-354 (POSIX block rows).
- Whether `pwsh.exe` accepts an en dash before `-Command`.
- The value of `call.reason` in the connector deny row (`index.ts:14162`).
- How Node applies the modes 0600 and 0700 on Windows, at the version of the
  reference.
