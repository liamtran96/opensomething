# Rule: files with mode 0600, atomic writes, redaction of text that an agent wrote

The feature is one row of [`../features.md`](../features.md). Its document in
the reference project is
`docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md`. It belongs to
parts 4 (the store and the data folder) and 11 (security) of
[`../README.md`](../README.md).

The reference project is the local clone at `../OpenMausBot`, commit
`3aec210054cdbafec0701100796335f0de1a5b8e`. All paths in this file are
relative to its root, unless a path starts with `crates/` or `docs/`, which
are ours. Nobody opened its `enterprise/` directory.

## 1. In short

The reference project keeps all its data in one folder on the computer of
the person: `~/.openmausbot`, or the folder that `OMB_DATA_DIR` names
(`server/data-dir.ts:45-56`). That folder holds API keys, transcripts and
memory. The project has one global rule for each file that it keeps there
(`docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md:35-37`):

> **Persisted files are `0600`**, written through `writeFileAtomic`
> (`server/atomic.ts`), and anything agent-authored passes `redactSecrets`
> (`server/redact.ts`) before it reaches disk.

The rule has three parts. Each part protects against a different problem.

- **Mode 0600.** On Linux and macOS, each file has permission bits. `0600`
  means: only the owner can read and write the file. Other user accounts on
  the same computer cannot read it. Windows has no such bits, and the project
  does nothing in their place (section 3.6).
- **Atomic write.** The program writes the new content to a temporary file
  next to the target, then renames the temporary file onto the target. A
  rename on one file system is atomic: a reader sees the whole old file or
  the whole new file, never half of each. A crash in the middle of a save
  cannot leave a torn settings file.
- **Redaction.** Redaction replaces a secret in a text with a marker such as
  `«redacted 51 chars»`. A model can copy an API key into its reply, or a
  tool can print a token. The server redacts such text before it stores the
  text, because the transcript goes back into each later prompt, and because
  people paste logs into bug reports (`server/harness/bus.ts:169`).

The rule is a convention, not one mechanism. The code has one shared helper
for atomic writes and one shared module for redaction, and about 180 and 110
files call them. Many writers do not obey the rule (section 3.5), and the
live stream of a reply to the window is not redacted on the server
(section 3.8).

Terms used in this file:

- **Mode:** the POSIX permission bits of a file, written in octal: `0o600`
  (owner read and write), `0o700` (owner read, write and run; used for
  folders), `0o644` (all can read).
- **umask:** a mask of the process that removes bits from the mode of each
  new file. A usual umask of `022` makes a requested `0o666` into `0o644`.
- **fsync:** a call that waits until the operating system has put the bytes
  on the disk. Without it, a power loss can lose data that a program already
  "wrote".
- **Held secret:** a secret that has no fixed shape, such as a saved website
  password. The server knows it by value and replaces it with `••••••`.
- **Event log:** the file `events/<threadId>.ndjson` that keeps each engine
  event of a thread, one JSON object on each line ([`../driver-contract.md`](../driver-contract.md), section 3).

## 2. Files read completely

Five subagents read the code, one for each group of files. Their reports
were checked against the code at the points that this file uses: each quote
below was read again in the source.

Read completely:

| File | Lines |
|---|---|
| `server/atomic.ts` | 142 |
| `server/atomic.test.ts` | 252 |
| `server/host-file-modes.test.ts` | 45 |
| `server/host-file-tools.ts` | 187 |
| `server/registry-store.ts` | 190 |
| `server/registry-save.ts` | 76 |
| `server/thread-log-rotation.ts` | 77 |
| `server/bot-folder.ts` | 87 |
| `server/data-dir.ts` | 56 |
| `server/harness/bus.ts` | 312 |
| `server/harness/public-reply.ts` | 17 |
| `server/harness/live-steps.ts` | 225 |
| `server/sse-fanout.ts` | 69 |
| `server/recent-log.ts` | 27 |
| `server/drivers/native.ts` | 118 |
| `server/tool-results.ts` | 71 |
| `server/tool-summary.ts` | 73 |
| `server/doctor/checks/secret-modes.ts` | 44 |
| `shared/redact.ts` | 168 |
| `server/redact.ts` | 48 |
| `server/message-redaction.ts` | 146 |
| `server/redact.test.ts` | 337 |
| `shared/redact-linear.test.ts` | 84 |
| `server/server-text-redaction.test.ts` | 30 |
| `server/drivers/acp/exit-report.ts` | 144 |
| `server/drivers/acp/tool-log.ts` | 71 |
| `src/lib/spoken-reply-stream.ts` | 249 |
| `companion/src/wire.ts`, `companion/src/json-scrub.ts`, `companion/test/json-scrub.test.ts` | 98, 191, 95 |
| `connector/src/log.ts`, `connector/test/redaction.test.ts` | 95, 166 |
| `evals/golden/redact/` (4 files) | 576 |
| `server/testing/scrub-ambient-omb-env.ts`, `server/testing/omb-env.ts` | 7, 19 |
| `docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md` | 117 |
| `SECURITY.md`, `AGENTS.md` | 54, 29 |

Read in ranges (the ranges are in the subagent notes of section 9):
`server/store.ts` (2,265 lines), `server/config.ts` (1,228),
`server/message-db.ts` (999), `server/index.ts` (15,276), `server/config-backup.ts`,
`server/drivers/openai-chat.ts`, `server/vault-store.ts`,
`server/secret-vault.ts`, `server/team-backup.ts`, `server/workspace.ts`,
`server/decision-log.ts`, `server/usage-trace/detail.ts`,
`server/devs-report.ts`, `server/admin-activity.ts`, `electron/main.mjs`,
`electron/diagnostics.mjs`, `src/state/live-reply.ts`,
`src/lib/taskTimeline.ts`, `CONTRIBUTING.md`, and about 60 others.

For the about 180 callers of the helper and the about 110 callers of
redaction, the subagents read the function around each call, or only the
line of the call. Section 9 lists them.

## 3. How it works

### 3.1 The atomic write helper (`server/atomic.ts`)

`writeFileAtomic(path, data, options)` (`:53-81`) takes a string or bytes and
two options (`:20-24`):

| Option | Default | Effect |
|---|---|---|
| `mode` | none | The permission bits of the new file (`:62`) |
| `durable` | `true` | `false` skips the fsync (`:64`) |

The steps:

1. Make the temporary name `${path}.${process.pid}.${randomUUID()}.tmp`, in
   the same folder as the target (`:58`).
2. Open it with the flag `"w"` and the mode: `openSync(tmp, "w", options.mode)`
   (`:62`). The mode goes on the new file at creation, "so a
   broader-permission file is never visible before a chmod" (`:61`).
3. Write all the data (`:63`).
4. Unless `durable` is `false`, call `fsyncSync` (`:64`).
5. Close the file (`:65`).
6. Rename the temporary file onto the target with `renameWithRetry` (`:67`).
7. If a step fails: close the file, delete the temporary file, ignore an
   error of these two steps, and throw the original error again (`:68-80`).

The comment at `:1-3` gives the guarantee: "a reader sees the whole old or
the whole new file". With `durable: false`, "a crash still never tears the
file, only a power loss can leave it empty."

`renameWithRetry(tmp, path, rename = renameSync)` (`:36-51`):

1. Try the rename.
2. If it fails with `EPERM`, `EACCES` or `EBUSY` (`:29`), wait and try again.
   The waits are 5, 10, 20, 40 and 80 ms (`:28`): six attempts and about
   155 ms at most.
3. Any other error, or the sixth failure, throws at once (`:47`).

The wait is synchronous: `Atomics.wait` on a shared buffer blocks without a
busy loop (`:31-34`). The retry has no platform check, so it runs on each
platform. Its comment gives Windows as the reason: "Windows refuses a rename
onto a path while anything (a virus scanner, the indexer) holds a handle"
(`:26-27`).

What the helper does not do:

- It does not create the parent folder. Each caller calls `mkdirSync` first
  (for example `server/config.ts:989`, `server/bot-folder.ts:29`).
- It does not fsync the parent folder after the rename. On Linux, the rename
  itself can be lost after a power loss until the folder is synced.
- It does not keep the mode of the file that was there. The new file gets
  `options.mode` (test `server/atomic.test.ts:66-74`).
- It does not follow a symbolic link at the target. The rename replaces the
  link, and the file that the link pointed to does not change (test
  `server/atomic.test.ts:181-190`).
- It has no async form and no lock between two writers. The whole server
  calls it synchronously on its one thread. Each call is timed for the stall
  monitor (`timeBlocking("saves", ...)`, `:54`).
- When `mode` is not given, it passes `undefined` to `openSync` (`:62`). The
  reference does not state the result. Node.js documents a default mode of
  `0o666` for `openSync`, less the umask: so `0o644` on a usual system. This
  fact is from the Node.js documentation, not from the reference.

Two more exports build on it:

- `writeFileAtomicIfChanged(path, data, options)` (`:114-118`) writes only
  when the file on disk differs, and returns `true` when it wrote. The
  compare `holdsExactly` (`:84-112`) answers `true` only when all of these
  are true:
  1. The open succeeds. Not on Windows: with `O_NOFOLLOW` (a link fails) and
     `O_NONBLOCK` (a planted FIFO cannot hang the open) (`:93`). On Windows:
     `lstatSync(path).isFile()` first, because "No O_NOFOLLOW on Windows; a
     reparse point is replaced, not read" (`:88-90`).
  2. It is a regular file with the same byte length (`:96`). The size check
     comes before the read.
  3. The owner is this process user, where `getuid` exists (`:97-98`).
  4. Not on Windows, and only when a mode is given: the file has no bit
     outside that mode (`:100`). So a `0o644` file with the right bytes is
     written again as `0o600`. The comment: "Windows reports 0o666 for any
     writable file; its mode bits mean nothing" (`:99`).
  5. The bytes are equal (`:101`).

  Each error answers `false`, "so this check is never why a save fails"
  (`:83`).
- `OwnedFile` (`:120-142`) is for "a file only this process writes while it
  runs". It remembers the last text that it wrote or loaded, and skips a
  write of the same text without a read of the disk. Three stores use it:
  `bots.json` and `groups.json` (`server/registry-store.ts:96-97`) and
  `routines.json` (`server/routines.ts:357`), all with `mode: 0o600`.

### 3.2 The core stores

| File in the data folder | How it is written | Mode | Redaction before the write |
|---|---|---|---|
| `config.json` (keys, engines, settings) | `writeFileAtomic(p, JSON.stringify(disk, null, 2), { mode: 0o600 })` (`server/config.ts:991`) | `0o600` | None. It holds the keys in plain text (`SECURITY.md:35-42`) |
| `config.json.bak.<date>` | A copy before each save (`server/config-backup.ts:103`, called at `server/config.ts:990`). If the copy fails, the save is refused | `0o600` | None |
| `bots.json`, `groups.json` | `OwnedFile.write` (`server/registry-store.ts:129`, `:143`) | `0o600` | None |
| `bots/<id>/SOUL.md` | `writeSoulMirror` → `writeFileAtomic` (`server/bot-folder.ts:28-31`) | `0o600`, folder `0o700` | None |
| `messages.db` (transcripts, SQLite) | SQLite. The file is made first with `closeSync(openSync(file, "a", 0o600))`, then `chmodSync(file, 0o600)` repairs an old file (`server/message-db.ts:42-46`) | `0o600`, folder `0o700` (`:40`) | `redactBotAuthored` in the store, before the row (`server/store.ts:1133`, `:1155`) |
| `events/<threadId>.ndjson` | `appendFile(..., { mode: 0o600 })`, 64 lines for each batch (`server/harness/bus.ts:229-252`) | `0o600` | `redactSecrets(event)` on each line (`:170`) |
| `native/<threadId>.ndjson` (raw engine protocol) | `appendFileSync(file, ..., { mode: 0o600 })` (`server/drivers/native.ts:94`) | `0o600` | `redactSecrets(...)` on each line (`:72`) |

Facts about the order and the failures:

1. The registry save is "rewritten whole for any change: temp file, fsync,
   rename, owner-only, skipped when the text is unchanged"
   (`server/registry-store.ts:3-4`). A failed save puts the memory state back
   and throws `RegistrySaveError` (`server/registry-save.ts:5-25`).
2. When the registry loads, `tightenRegistryFile` sets the file to `0600`
   if a group or other bit is set. It does nothing on Windows
   (`server/registry-store.ts:57-64`).
3. A message row is redacted before the database write and before the
   change event goes to the window (`server/store.ts:1133-1146`).
   `patchMessage`, which changes an existing row, has no redaction
   (`server/store.ts:1244-1257`). See section 3.8.
4. A failed append to the event log does not stop live delivery. The bus
   writes a console line and delivers a `runtime.error` event
   (`server/harness/bus.ts:255-256`, `:277-283`).
5. After each append, `capThreadLog` cuts a log over 256 MiB to its newest
   half: it writes `<file>.trim` with `0o600` and renames it, with no fsync
   and no rename retry (`server/thread-log-rotation.ts:6`, `:25-76`).
6. SQLite runs in WAL mode (`server/message-db.ts:48-49`). No code sets the
   mode of the `-wal` and `-shm` side files. They hold the newest rows of the
   transcript.

### 3.3 Folder modes

The data folder is made in several places, and not all of them give a mode:

- No mode: `ensureDirs()` makes the data folder, `events/` and `native/`
  (`server/config.ts:692`). Also `server/config.ts:989`,
  `server/store.ts:294`, `server/server-update.ts:114` and others.
- Mode `0o700`: `server/message-db.ts:40`, `server/cli.ts:457`,
  `server/service-cli.ts:91`, `electron/data-dir-lease.mjs:579` and about 250
  other `mkdirSync` calls for subfolders.

`mkdirSync` applies the mode only to a folder that it creates. The companion
says so in a comment (`companion/src/state.ts:26`) and then calls `chmodSync`
(`:28`). The server does not. So the mode of the data folder depends on
which call runs first. The order at start-up was not traced.

The usual server start sets no umask. The only `process.umask(0o077)` is in
the Cloud start (`server/cloud-home-start.ts:387`).

### 3.4 Repair and check of modes

- At each open, `messages.db`, `runtime.db` and `bursts.db` get
  `chmodSync(file, 0o600)` (`server/message-db.ts:45`,
  `server/runtime/store.ts:231`, `server/burst/store.ts:76`).
- The doctor check "Private files" (`server/doctor/checks/secret-modes.ts`)
  looks at eight files: `config.json`, `sessions.json`, `bots.json`,
  `groups.json`, `messages.db`, `webhooks.json`, `tunnel-account.json`,
  `browser-engine-key` (`:10-12`).
  1. On Windows it answers "Not checked on Windows." (`:22`).
  2. It finds each file that has a group or other bit (`& 0o077`, `:28`).
  3. With none, it answers "Only the server's user can read them." (`:31`).
  4. Otherwise it reports "Others can read config.json (0644), ..." and
     marks the problem as fixable (`:32-33`).
  5. The fix writes the old mode into the doctor backup and calls
     `chmodSync(file, 0o600)` (`:38-39`). It does not copy the content into
     the backup: "a second copy of a secret is what this check is against"
     (`:1-3`).
- The check does not look at the data folder, the subfolders, the event
  logs or the SQLite side files.
- Other checks refuse a file that is too open: external runtime credentials
  ("use a private file (chmod 600)", `server/external-runtime.ts:23-25`) and
  Cloud start files (`server/cloud-home-start.ts:346`, `:367`).

### 3.5 Writers that do not use the helper

About 180 non-test files import the helper. About 265 files write a file in
another way. The subagent sorted the direct writes into groups.

**A second atomic write by hand (temporary file and rename).** There are
more than 40. Most of them have no fsync, no rename retry and a fixed
temporary name for each process. Examples:

- `electron/main.mjs:396-397`: `credentials.bin`, the encrypted store of all
  provider keys of the desktop application. `writeFileSync(temporary, ...,
  { mode: 0o600 })` then `renameSync`, with no fsync and no retry.
- `electron/main.mjs:428-429` and `electron/workspace-credentials.mjs:66-67`:
  the server's own `config.json`, written by the desktop process without the
  helper.
- `companion/src/state.ts:38-50`: a copy of the helper with `0o600` and
  fsync, and without the rename retry.
- `server/browser/chrome/profile.ts:20-25`: a local `writeAtomic` with a
  default mode of `0o600`.
- `server/host-file-tools.ts:109-167`: the bot tool `write_file`. It is
  async, writes with `flag: "wx"` and `flush: true`, keeps the mode of an
  existing file, and has its own `renameWithRetry` with waits of 0, 50, 150,
  400 and 1000 ms.
- A few use a hard link instead of a rename, so that the write never
  replaces a file: `server/environment.ts:61-69`, the lock files of
  `server/boat-create-idempotency.ts:219-225` and
  `electron/data-dir-lease.mjs:487-493`.
- Some have no mode at all, so the file gets the umask default:
  `electron/always-on-home.mjs:41-42`, `electron/companion.mjs:79-80`,
  `server/stall-watch.worker.ts:94-96`.

**State written in place with `writeFileSync`.** A crash in the middle
leaves a short or empty file. Examples with `0o600`: `usage/alerts.json`
(`server/spend.ts:87`), the Tailscale marker (`server/tailscale.ts:161`), the
engine run records (`server/engine-records.ts:158`, `:240`, `:277`). Without
a mode: `server/meetings/meetbot.ts:971`, `electron/open-at-login.mjs:32`.

**Append-only logs.** They cannot use the helper. Most give `{ mode: 0o600 }`
to `appendFile`: the decision log (`server/decision-log.ts:117`), the usage
ledger (`server/usage-ledger.ts:147`), the usage spans
(`server/usage-trace/spans.ts:96`), the memory journal
(`server/memory-journal.ts:169`). Without a mode: the meeting transcripts
(`server/meetings/manager.ts:214`, `server/meetings/meetbot.ts:51`, `:923`)
and the desktop `server.log` (`electron/main.mjs:498`).

**Config files of other programs.** Several engine drivers write an engine
config that holds an API key, with no mode:
`~/.factory/settings.json` (`server/drivers/acp/droid.ts:75`, `:84`), a
`config.toml` (`server/drivers/acp/grok.ts:250`, key at `:246`) and a
`config.yaml` (`server/drivers/acp/hermes.ts:84`). The same `config.toml`
is written in another function with `0o600` "from its first byte"
(`server/drivers/acp/grok.ts:404-408`).

**Temporary and download files** mostly use `0o600` and the flag `"wx"`
(for example `server/browser-relay.ts:187`, `server/workspace-backup-http.ts:248`).

**`scripts/`** has 362 files. 134 of them write files (bench fixtures, build
output). None imports the helper.

### 3.6 Windows

1. **No ACL.** No code sets a Windows access list. A search for `icacls`,
   `cacls`, `Get-Acl`, `Set-Acl`, `keytar` and `CryptProtectData` finds
   nothing. The `DPAPI` hits read the key of another browser for a cookie
   import (`server/browser/cookies/sources.ts:40`, `:201`, `:210`).
2. **The mode is passed and ignored.** The code gives the mode to Node on
   each platform. It skips each `chmod` and each mode check on Windows. The
   comments say why: "Windows has no POSIX mode bits"
   (`server/registry-store.ts:57`), "Windows reports 0o666 for any writable
   file" (`server/atomic.ts:99`), "libuv reports every writable Windows file
   as uid 0 mode 0o666" (`server/local-computer.ts:369`). About 18 places
   have such a guard (for example `server/tunnel.ts:67`,
   `server/doctor/backup.ts:145`, `connector/src/state.ts:132`). Six `chmod`
   calls have no guard and rely on a `try`: `server/message-db.ts:45`,
   `server/runtime/store.ts:231`, `server/burst/store.ts:76`,
   `electron/computer-sharing.mjs:376`, `server/drivers/pi.ts:226`,
   `server/drivers/acp/qwen.ts:148`.
3. **The rename retry** in `server/atomic.ts` is the main Windows measure.
   Other copies: `electron/lent-staged.mjs:19-31` (the same codes and waits,
   with a comment that names `server/atomic.ts`),
   `server/host-file-tools.ts:157-166`, and
   `server/drivers/antigravity-runtime.ts:32-50` (also `ENOTEMPTY`, 8
   attempts). `server/engine-standalone.ts:668-683` moves a running program
   aside before it replaces it, because "Windows will not replace a program
   that is running but lets it be renamed".
4. **No `O_NOFOLLOW`.** On Windows the code checks `lstat` first
   (`server/atomic.ts:88-90`) or uses `O_EXCL`
   (`electron/diagnostics.mjs:360`).
5. **The OS key store.** The packaged desktop application keeps provider
   keys in `credentials.bin`, encrypted with Electron `safeStorage`
   (`electron/main.mjs:364-398`). On Windows `safeStorage` uses the user's
   DPAPI key (an Electron fact, not stated in the reference). There is no
   plain-text fallback in the packaged application: the save throws "The
   operating-system credential store is unavailable"
   (`electron/main.mjs:390-392`). An application that is not packaged sends
   the key to the server, which writes it into `config.json`
   (`electron/main.mjs:2713-2720`, `server/config.ts:991`). `SECURITY.md:35-42`
   lists the secrets that stay in plain text on each install: OpenCode
   provider keys, engine `environment` and `key` values, MCP environment and
   header values, and `mcp-oauth.json`.
6. **The doctor** does not check modes on Windows (section 3.4).

So on Windows, the files in the data folder have the access list that they
inherit from the user's profile folder. The reference does not check or
change it.

### 3.7 Redaction: the functions

The shared module is `shared/redact.ts`. The server adds `server/redact.ts`
for objects and `server/message-redaction.ts` for messages.

`redactSecretsInText(text)` (`shared/redact.ts:147-163`) does these steps in
order:

1. Return empty text as it is (`:148`).
2. Run the held-secret scrubbers (`:150`). "Held values first: a short
   one-time code is still a secret" (`:149`).
3. If the text is now shorter than 8 characters, return it (`:151`).
4. Mask private key blocks: keep the `BEGIN` and `END` lines, mask the body
   (`:79-92`, `:153`).
5. Mask each key prefix shape (`:16-39`, `:154`). There are 23 patterns:
   Anthropic and OpenAI `sk-`, Stripe `sk_live_`, xAI, Groq, Cerebras, Meta,
   Hugging Face, PyPI, GitHub classic and fine-grained, GitLab, Slack and
   Slack app, AWS `AKIA` and `ASIA`, Google `AIza`, npm, Notion, Perplexity,
   webhook secrets `whsec_`, SendGrid, the project's own bot API keys
   `bak_`, and its own device and model keys `om[dg]_`.
6. Mask each JWT: `eyJ` and three parts of 8 or more characters, with dots
   (`:43-72`, `:155`).
7. Mask the token after `Bearer ` (12 or more characters, `:99`, `:156`).
8. Mask the base64 after `Authorization: Basic` (`:100-102`, `:157`).
9. Mask the value of `key=value`, `key: value` and `key="value"` when the
   key is a secret word (`api_key`, `secret`, `token`, `password`, and
   others) and the value is one token of 8 or more characters
   (`:103-112`, `:158`).
10. Mask the value of an assignment to a name that ends in `_key` or `-key`,
    with no minimum length (`:113-117`, `:159`).
11. Mask the value after `--token`, `--password`, `--api-key` and similar
    flags (`:118-120`, `:160`).
12. Mask the password in `scheme://user:password@host` (`:121-123`, `:161`).

The marker is `«redacted N chars»`, where N is the length of the secret
(`:10`). `mask` does not mask its own marker again, so a second pass changes
nothing: "re-masking our own marker would change its reported length (and
any hash over the payload)" (`:5-8`).

The design choice is high precision: "a generic "long hex/base64" heuristic
would rewrite real code in the transcript, so only shapes that are
unmistakably credentials match" (`:12-14`). A 40-character git hash stays
(test `server/redact.test.ts:297`).

Each pattern does work in proportion to the text, not to its square. The
reason: redaction "runs on the server's only thread for every engine event,
protocol line and tool result", and an old pattern "held a Cloud home's
thread for minutes on one tool output of a few MB"
(`shared/redact-linear.test.ts:1-3`). The JWT and PEM search are hand-written
scans for this reason (`shared/redact.ts:43-46`, `:74-76`). There is no limit
on the input length.

`redactSecrets(input, depth = 0)` (`server/redact.ts:16-48`) walks a JSON
value:

1. A string gets `redactSecretsInText` (`:17`).
2. Past depth 12, a non-string value comes back as it is (`:18`). So a string
   deeper than 12 levels is not redacted.
3. In an array, an object with a string `name` and a string `value` is an
   environment entry. If the name is a secret name, the value is masked
   whole. If not, the value gets the text pass (`:20-34`).
4. In an object, a string under a secret key name is masked whole
   (`:41-43`). Other values recurse.

`isSecretName(name)` (`server/redact.ts:3-10`) is true when the lower-case
name contains `token`, `secret`, `password`, `passwd`, `apikey`, `api_key`,
`authorization` or `auth_token`, or ends in `key` or `keys` after `_`, `.`,
`-` or nothing. So `hotkey` and `keyboard` are not secret names (test
`server/redact.test.ts:114-121`).

The held-secret scrubbers (`shared/redact.ts:125-145`): "A saved website
password has no shape: it is known by value." The server registers three
(`server/index.ts:728-730`, `server/host/secret-cards.ts:175`):

1. The email service: each mailbox password and SMTP password.
2. The Vault: each saved login password and TOTP secret, the 1Password
   token, the Bitwarden secrets, each saved secret value, each password
   filled in this run (500 at most) and each one-time code for 5 minutes
   (`server/vault-store.ts:558-621`).
3. The secret cards: values that a person gave on a card, for 24 hours, 200
   at most (`server/secret-vault.ts:21`, `:25`).

Each value is matched in its raw, JSON, HTML, URL and form encodings, 4 or
more characters, longest first (`server/vault-store.ts:573-590`, `:628`). The
mask is `••••••` (`shared/redact.ts:130`). API keys from the server config
and MCP OAuth tokens are not in any scrubber.

`redactBotAuthored(message)` (`server/message-redaction.ts:7-146`) is the
gate for the transcript:

- "Bot-authored text is scrubbed of secrets before it is stored (the
  transcript replays into every rebuild); what the user typed stays as
  typed" (`:6`). The code: `if (message.role !== "bot") return message;`
  (`:8`).
- For a bot message it redacts the text, the text parameters, the
  compaction summary, the tool name and summary, and the fields of each card
  type (`:10-144`).
- It does not touch `tool.input` or `tool.output`. Those are redacted in
  each driver before the event (section 3.8).
- A card that offers to allow a command is not masked: the offer is removed
  when redaction would change the command (`:49-52`).

`holdsCredential(text)` (`shared/redact.ts:94-98`) is a test, not a mask. It
is true for a key prefix, a JWT or a private key block. Two places refuse
such a file instead of a rewrite: a skill file
(`shared/skill-files.ts:69`) and an imported setup file
(`server/setup-import.ts:374`).

Other code has its own redaction, with other markers:

| Where | What | Marker |
|---|---|---|
| `server/drivers/openai-chat.ts:526-541`, `:643-657` | The chat driver masks the API key and MCP environment values (8 or more characters) by value, also when a value is split between two stream chunks | `[redacted]` |
| `server/devs-report.ts:78-106` | The bug report: environment secrets, URL queries, `Authorization`, `Cookie` | `«redacted URL parameters»` |
| `server/admin-activity.ts:80-160` | The admin activity log: its own `isSecretName` | `[hidden]` |
| `server/drivers/acp/exit-report.ts:31-52` | The stderr of an engine: Google token shapes, each run of 32 or more characters, lines of a private key | `«redacted N chars»` |
| `server/harness/live-steps.ts:45`, `server/step-summary.ts:16` | A shell assignment `NAME=value` in a status line | `NAME=…` |
| `electron/diagnostics.mjs:53-106` | The desktop diagnostics report. "Kept in parity with server/redact.ts" (`:53`), but it has 10 key shapes, not 23 | `«redacted N chars»` and others |
| `connector/src/log.ts` | The connector: known values only, raw, URL and JSON forms, 8 or more characters | `[secret]` |
| `companion/src/wire.ts:8` | The companion: removes four keys (`resumeCursors`, `sshAlias`, `vpsAlias`, `vpsAliases`) from data for a phone | the member is removed |

### 3.8 Redaction: where it is applied

The reply of a bot goes from the engine to the disk and to the window on
these paths:

1. The driver emits events. For a tool call it redacts the input and the
   result before the event, with `toolDetailPreview` and `commandSummary`
   (`server/tool-summary.ts:36`, `:57`). Each driver calls them:
   `server/drivers/claude.ts:1549`, `:1575`, `server/drivers/codex.ts:997`,
   `:1035`, `server/drivers/acp/core.ts:827`, and others.
2. The bus merges text deltas for 50 ms, then writes each event to the
   event log with `redactSecrets` (`server/harness/bus.ts:170`).
3. The bus gives each listener the raw event (`server/harness/bus.ts:285-295`).
4. The server listener sends the event to each window.
   `publicReplyEvent` redacts only the finished reply (`item.completed` with
   `assistant_text`). A `content.delta` goes out as the engine wrote it
   (`server/harness/public-reply.ts:1-3`, `:13-16`). The comment at
   `server/index.ts:6313` says: "the bus's persistence redactor does not
   scrub the live event".
5. The window masks the streamed text before it shows it. It holds back the
   last word until a space arrives, "so a secret is masked whole or not
   shown" (`src/state/live-reply.ts:181-185`). The speech output does the
   same (`src/lib/spoken-reply-stream.ts:48-55`). The window has no held
   secret scrubber, so a saved password with no shape is not masked there
   (`shared/redact.ts:127`).
6. The finished reply goes to `store.appendMessage`, which calls
   `redactBotAuthored` before the database write (`server/store.ts:1133`).
7. The tool input and the tool result go to the database with only the held
   secret scrub (`server/index.ts:6412`, `:6432`), through `pushMessage` and
   `patchMessage`. Their shape redaction depends on step 1.

Other places where the server redacts before disk:

- Memory that the server writes: `MEMORY.md`, each entry, each log line and
  each topic (`server/workspace.ts:203`, `:347`, `:459`, `:478`, `:530`), and
  the memory API (`server/memory-store.ts:235`). "Redacted where every
  server-side write funnels" (`server/workspace.ts:202`).
- Learned skills (`server/skills.ts:998`, `server/skill-share.ts:50`).
- The decision log (`server/decision-log.ts:130`) and its CSV export
  (`:259`).
- The usage trace: each detail line, cut to 80 or 120 characters
  (`server/usage-trace/detail.ts:9-13`).
- A spilled full tool result (`server/index.ts:5431`).
- Exports: the team backup redacts memory files on the way out, because
  "files the bot's own tools wrote never passed the server's scrub"
  (`server/team-backup.ts:15-25`). Packages redact each text part
  (`shared/package-format.ts:930-940`).
- Crash lines (`server/crash-guard.ts:79`, `:95`) and the 200 warning lines
  kept for a bug report (`server/recent-log.ts:19`).

Text from an agent that reaches disk, a log or a client with no redaction.
Each item was read in the code:

1. The streamed reply (`content.delta`) to each window, as said in step 4.
2. The live title of a tool call: `server/drivers/acp/core.ts:826` and
   `server/drivers/claude.ts:1549` send the raw title. The stored name and
   the event log are redacted.
3. Live `runtime.error`, `runtime.notice` and `request.opened` events go out
   unchanged (`server/harness/public-reply.ts:16`). Some drivers redact the
   text first (`server/drivers/muse-code.ts:394`,
   `server/drivers/acp/rpc-error.ts:25`), others were not checked.
4. A message that one bot sends to another is stored with `role: "user"`
   (`server/host/question-routing.ts:147`, `server/host/relayed-turn.ts:30`),
   so `redactBotAuthored` returns it unchanged.
5. `store.patchMessage` has no redaction (`server/store.ts:1244-1257`).
6. The process log. `console.warn` and `console.error` print the raw
   arguments: `captureRecentLog` redacts only the copy that it keeps
   (`server/recent-log.ts:12-24`). Of 490 non-test `console` calls in
   `server/`, 4 redact on the same line. About 199 print an error object or
   a response body. There is no logger module.
7. HTTP error bodies: 44 places send `error.message` or `String(error)` in
   a JSON body with no redaction. The `json` helper does not redact
   (`server/harness/http.ts:29-36`).
8. Memory files that the bot writes with its own file tools, in the engine
   process (comment at `server/team-backup.ts:15`).

Possible, not traced to the end: the "done" notification body (the reply
before redaction, `server/index.ts:6352`, `:6661`, `:6769`), the chat history
in a team backup (`server/team-backup.ts:37-53`), and a runtime node answer
of `BRIEF_MAX` characters or less (`server/runtime/runtime.ts:639`).

## 4. The data

- **The data folder:** `~/.openmausbot`, or `OMB_DATA_DIR`
  (`server/data-dir.ts:45-56`). Subfolders `events/` and `native/`
  (`server/config.ts:680-683`).
- **`AtomicWriteOptions`:** `{ mode?: number; durable?: boolean }`
  (`server/atomic.ts:20-24`).
- **Temporary file name:** `<target>.<pid>.<uuid>.tmp`, next to the target
  (`server/atomic.ts:58`). A crash before the rename leaves this file. No
  code was found that removes old `.tmp` files of the helper at start-up.
- **Modes in use:** `0o600` (about 400 literals: files), `0o700` (about 250:
  folders and private programs), `0o755` (installed programs), `0o644`
  (service files and files that others must read), `0o400` and `0o500`
  (imported skill files, `server/imported-skills.ts:215`).
- **Helper call sites:** 209 write sites in 171 non-test files.
  - 187 pass `mode: 0o600` (for example `server/config.ts:991`).
  - 4 pass another mode: a launcher script with `0o700`
    (`server/browser/chrome/wrapper.ts:109`), and three that keep a mode from
    a caller or a source file (`server/fleet-cli.ts:222`,
    `server/moved-paths-repair.ts:117`, `server/workspace-backup.ts:744`).
  - 18 pass no mode. Most are caches and public catalogs (model lists,
    themes, an announcement feed). Three hold text about people or
    conversations: the answers of check-work (`server/host/check-work.ts:138`),
    the meeting records (`server/meetings/manager.ts:106`) and thread ids
    (`server/host/setting-nudges.ts:51`). The data format marker uses the
    helper as an injected default with no mode (`server/data-format.ts:84`).
  - 13 pass `durable: false`: caches, timings, a hook token
    (`server/drivers/claude.ts:1172`) and an engine MCP config
    (`server/drivers/acp/copilot.ts:263`). `writeSoulMirror` takes the value
    from its caller (`server/bot-folder.ts:26-30`).
- **No shared JSON wrapper.** Each store calls `writeFileAtomic` directly
  with `JSON.stringify`. The wrappers are local to one file, for example
  `VaultStore.write` (21 calls, `server/vault-store.ts:252`) and `writeJson`
  in the workspace backup (20 calls, `server/workspace-backup.ts:162`).
- **Stores with secrets.** All use `0o600`. Three are encrypted:
  `logins.json.enc` and `member-secrets.json.enc` of the Vault
  (`server/vault-store.ts:259-260`) and `email.json.enc`
  (`server/email/store.ts:103`). Their keys are plain hex files with `0o600`
  in the same data folder: `logins-key` (`server/vault-store.ts:212`, "a 0600
  file beside it", `:1`), `email-key` (`server/email/store.ts:76`). The
  webhook secrets are sealed with AES-256-GCM (`server/webhooks.ts:435-438`)
  under `webhook-key` (`:431`). These stores are not encrypted:
  `config.json`, the sessions (`server/sessions.ts:297`), the ChatGPT OAuth
  tokens (`server/drivers/chatgpt-plan-auth.ts:127`), the MCP OAuth tokens
  (`server/mcp-oauth-store.ts:118`), the members' app tokens
  (`server/team-connections.ts:166`), the tunnel account
  (`server/tunnel.ts:78`), the Composio broker token
  (`server/cloud-connected-apps.ts:168`) and the phone relay private key
  (`server/phone-relay.ts:116`).
- **Folders of these stores.** 26 files make the parent folder with no mode
  next to the write, among them the Vault, the email store, the webhook
  key, the MCP OAuth store and `config.json` (for example
  `server/vault-store.ts:211`, `server/email/store.ts:75`,
  `server/webhooks.ts:430`). 51 files use `0o700`. Three also call
  `chmodSync(dir, 0o700)` for a folder that exists
  (`server/team-connections.ts:158-159`, `server/sentinel/store.ts:127-129`,
  `server/drivers/chatgpt-plan-auth.ts:45-47`).
- **The redaction marker:** `«redacted N chars»` (`shared/redact.ts:10`). The
  held-secret marker: `••••••` (`:130`).
- **The message fields that `redactBotAuthored` changes:** listed at
  `server/message-redaction.ts:10-144`.

## 5. The UI

The feature has little UI.

- **Doctor, "Private files":** the texts "Not checked on Windows.", "Only
  the server's user can read them." and "Others can read <file> (0<mode>)."
  with a fix that makes the file owner-only
  (`server/doctor/checks/secret-modes.ts:22`, `:31-33`).
- **A redacted secret in the chat:** the window shows `«redacted N chars»`
  in place of the secret. While a reply streams, the last word is held back
  until a space arrives (`src/state/live-reply.ts:181-185`).
- **The run log of a task:** the window masks the tool name, the summary
  and the copied run log again, for older messages
  (`src/lib/taskTimeline.ts:47-48`, `:61-65`).
- **The key store of the desktop application:** a save fails with "The
  operating-system credential store is unavailable" or "The
  operating-system credential store could not be read this launch"
  (`electron/main.mjs:387-392`).
- **Settings:** a stored key never goes back to the window. The window sees
  only `configured: true` (roadmap `:32-34`). That rule is the subject of
  another row of `features.md`.

## 6. The tests

`server/atomic.test.ts` (each line is one test):

- The file is written, a longer old file is replaced in full, no temporary
  file stays, Unicode survives (`:38-58`).
- A `0o644` file becomes `0o600` when the mode is given (`:66`, not on
  Windows).
- When the rename fails, the temporary file is deleted (`:76`).
- One fsync by default, none with `durable: false` (`:95`, `:100`).
- `writeFileAtomicIfChanged` leaves the file alone (same inode, same time,
  no fsync) when the bytes are equal (`:124`); writes when the bytes differ
  (`:140`); does not read the old file when the size differs (`:150`);
  writes a new file (`:159`); passes `durable` on (`:165`).
- It writes again when the bytes are equal and the mode is too open
  (`:173`), replaces a symbolic link instead of a write through it (`:181`),
  and does not hang on a FIFO (`:192`). These three are not run on Windows.
- `renameWithRetry` survives three `EPERM` failures (`:223`), retries
  `EACCES` and `EBUSY` (`:229`), stops after six attempts (`:237`), and does
  not retry `ENOENT`, `EXDEV` or `EISDIR` (`:243`).
- No test covers `OwnedFile`.

`server/host-file-modes.test.ts` tests the bot tool `write_file`, not the
helper: with umask `022` and `077`, an overwrite keeps the modes `0664`,
`0775` and `0600`, and a new file gets `0o666` less the umask (`:10-42`).

`server/redact.test.ts`:

- Environment entries with a secret name are masked, their names and other
  values stay (`:10-104`).
- Normal protocol traffic comes back equal (`:106`).
- 25 known key shapes are masked (`:136-171`). Exact-length shapes
  (SendGrid, Notion, Perplexity) are masked only at their exact length
  (`:173-204`).
- JWT, PEM body, `Bearer`, `Authorization: Basic`, `key=value`, `_KEY=`,
  URL passwords and secret flags are masked (`:224-281`).
- Text that looks near a secret stays: `hotkey=`, a URL with a port,
  `the key: patience`, a git hash, `const token = await getToken();`,
  `password: (leave blank …)`, `Bearer tokens are sent …` (`:283-306`).
- A second pass changes nothing (`:217`, `:246-257`, `:314-322`).
- `holdsCredential` is true for real shapes and false for placeholders such
  as `API_KEY=your-key-here` and `glpat-your-token-here` (`:326-336`).

`shared/redact-linear.test.ts`: six inputs of 1 to 2 MB, each built to make
a naive pattern slow, finish in less than 10 seconds each (`:18-33`). Before
the fix, 2 MB of base64url took about 4 minutes (`:16-17`).

`server/server-text-redaction.test.ts`: a secret is absent from each stored
and each returned message for a limit error, a notice and message
parameters (`:17-29`).

`server/harness/bus.test.ts:94-110`: each event is scrubbed one time on its
way to the event log.

`connector/test/redaction.test.ts`: the connector masks known values in raw,
URL and JSON form, ignores values shorter than 8 characters, and drops the
`config` property of an HTTP error (`:24-165`).

No test checks that a streamed delta, a log line or an HTTP error body is
redacted. No test checks the mode of a file on Windows.

## 7. Ours compared

**What we have:** nothing yet. Our crates have 153 lines
(`crates/bot-protocol/src/ids.rs` and four short `lib.rs` and `main.rs`
files). No code writes a file, sets a mode or redacts.

**What we plan:**

- [`../../plan/step-06-settings.md`](../../plan/step-06-settings.md):
  6.3 `atomic.rs` ("write to a temporary file in the same folder, then
  rename it", with a test that a failed write keeps the old file); 6.4
  `redact.rs` ("replaces the known secret values and the text that matches a
  key pattern"); 6.5 a `Secret` type whose `Debug` output is `[redacted]`.
- [`../../plan.md`](../../plan.md) row 6: "A test shows that a key does not
  reach a log."
- [`../../decisions.md`](../../decisions.md) D14: "Tests, atomic writes and
  redaction come with the part they protect." D14 also chooses SQLite from
  the first store, so the transcript is one database file, as in the
  reference.
- [`../../comparison.md`](../../comparison.md): the atomic write with
  `tempfile` (`persist`) or `atomic-write-file`, the redaction with `regex`
  and `secrecy`, the logs with `tracing`.
- `AGENTS.md`: "Never log or persist secrets. Redact tokens and keys before
  text reaches disk."

**Where we differ, or can differ:**

| Point | The reference | Our plan |
|---|---|---|
| Mode | Each caller passes `mode: 0o600`. 18 helper calls and many direct writes forget it | Not decided. Step 6.3 does not name a mode |
| Windows | Mode ignored, no ACL; keys in plain `config.json` unless the packaged Electron application uses `safeStorage` | Not decided. The step 6 choice "the keychain of the operating system" is open |
| Parent folder | Not synced after the rename | Not decided |
| Writers | One helper and more than 40 hand-written copies | Not decided |
| Redaction | Shape patterns plus held values; marker `«redacted N chars»` | Known values plus key patterns (step 6.4); marker `[redacted]` in 6.5 |
| User text | Never redacted | Not decided |
| Logs | No logger. `console` prints raw text | `tracing` (comparison.md). Where the redaction runs is not decided |
| Live stream | Not redacted on the server; the window masks it | Our window is the only client (D10). Not decided |

## 8. Where we can be better

1. **Make the mode part of the type, not an option.** The reference has an
   optional `mode`, and 18 of 209 helper calls forget it. A Rust
   `write_private(path, bytes)` that always creates the file with `0o600` on
   Unix, and has no mode parameter, removes this error. A public file needs
   a second, named function. Reason: a wrong state that the compiler
   refuses.
2. **One write path for the data folder.** The reference has more than 40
   hand-written copies of the atomic write, most without fsync or rename
   retry, among them the store of all desktop keys
   (`electron/main.mjs:396-397`). We have one process and one crate that
   owns the data folder (`bot-core`). If `DataDir` is the only type that can
   give a path in the folder, and its only write method is atomic, a direct
   write needs a deliberate bypass. Reason: a known problem that we do not
   copy.
3. **Sync the parent folder after the rename on Unix.** The reference does
   not. `atomic-write-file` and `tempfile` with a manual `File::sync_all` on
   the folder both can do it. Reason: a known problem that we do not copy.
   The cost is one more sync for each save, so settings saves only, not
   each message (messages go to SQLite).
4. **Set the folder mode on each start, not only at creation.** The
   reference makes the data folder in several places, some without a mode,
   and `mkdir` does not change a folder that exists. We can create it one
   time in `DataDir` with `0o700` and repair it with a `chmod` at each start.
   Reason: less code and a known problem that we do not copy.
5. **Cover the SQLite side files.** The reference sets `0600` on
   `messages.db` but not on `-wal` and `-shm`, which hold the newest rows. A
   process umask of `0o077`, set one time at start, covers each file that
   SQLite or any library makes. Reason: a known problem that we do not copy.
6. **Do not keep a key file beside the file that it encrypts.** The Vault
   and the email store encrypt their data, but the key is a plain `0o600`
   file in the same folder (`server/vault-store.ts:1`, `:212`). Anyone who
   can read one file can read the other, so the encryption protects only
   against a copy of one file. A key in the operating system key store
   (point 7) is a real second barrier. Reason: a known problem that we do
   not copy.
7. **Decide Windows explicitly.** The reference passes a mode that Windows
   ignores and reports "Not checked on Windows." The default access list of
   a folder under the user profile already denies other standard users, but
   the reference does not check it. We can record this as a decision, and
   keep the API key in the Windows Credential Manager (the `keyring` crate)
   instead of a file. Reason: a known open risk made visible.
8. **Redact at the boundaries, not at 110 call sites.** The reference calls
   redaction in about 110 files, and still misses the live stream, logs,
   HTTP error bodies, `patchMessage` and bot text stored as a user message.
   We have three boundaries: the store (all messages and events), the log
   (`tracing`), and the Tauri events to the window. A redaction at each of
   the three covers each producer. A `tracing` layer that redacts each field
   covers each log line, which the reference does not do. Reason: less code,
   and known gaps that we do not copy.
9. **Redact by role, but with the author in the type.** The reference
   decides with `role !== "bot"`, and text from another bot stored as
   `role: "user"` escapes. If the stored message type says who wrote it (a
   person, a bot, the server), the rule "redact what a bot or a tool wrote"
   cannot miss a relayed message. Reason: a wrong state that the compiler
   refuses. D18 keeps two roles, so this is a separate field, not a third
   role.
10. **Keep the secret out of `Debug` and `Display`.** The reference has no
   type for a secret: a key is a string in `config.json` and in memory. Step
   6.5 already plans a `Secret` type. With `secrecy::SecretString`, a key
   cannot reach a log through `{:?}`. Reason: a wrong state that the
   compiler refuses.
11. **Copy the high-precision patterns and their tests.** The reference
    chose shapes that are "unmistakably credentials" and has a good test set
    of positives and negatives (`server/redact.test.ts:136-336`). Rust's
    `regex` crate has linear time by design, so the hand-written JWT and PEM
    scans of the reference are not necessary. Reason: less code.
12. **Keep the marker stable and idempotent.** The reference marker keeps
    the length and is not masked twice. Step 6.5 uses `[redacted]`, and the
    chat driver of the reference also uses `[redacted]`. One marker in all
    places makes a test and a search simpler. Reason: less code.
13. **Hold back a split secret in the stream.** If our core redacts the
    stream before the window, it must hold a suffix that can be the start
    of a known secret, as `server/drivers/openai-chat.ts:643-657` does for
    known values. Reason: a known problem that we do not copy.

## 9. Not verified

- The callers of the helper (about 180 files) and of redaction (about 110
  files) were read at the call site, often only the line of the call. The
  destination of a file in a row can be wrong where the path was not traced.
- `server/index.ts`, `server/store.ts`, `server/config.ts` and
  `server/message-db.ts` were read in ranges only.
- The default mode of a helper file with no `mode` (`0o666` less the
  umask) is from the Node.js documentation. No test of the reference shows
  it.
- The order of the `mkdirSync` calls at start-up, and so the real mode of
  the data folder.
- The permissions that SQLite gives `-wal` and `-shm`.
- What `phoneActivity`, `teamMessages.route` and the notification code send
  to a phone or a notification. The "done" notification item in section 3.8
  depends on them.
- Each `runtime.error` emit in `claude.ts`, `codex.ts`, `pi.ts`,
  `acp/core.ts` and `openai-chat.ts`, for redaction before the event.
- What each of the 44 HTTP error bodies can hold. Several are validation
  messages, not engine errors.
- The `content.delta` events of other stream kinds (reasoning text).
- The `scripts/` folder: only the first write of 14 files was seen.
- Whether `safeStorage` on Windows uses DPAPI is an Electron fact, not
  stated in the reference.
- No test of the reference was run. Each statement about a test comes from
  its source.
