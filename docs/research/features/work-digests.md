# Work digests

The record of how the reference project sums up the work of each bot turn
(the work digest), how Claude Code engine hooks deliver full tool results to
the server, and how the window shows the result as a receipt.

- Reference: the reference project at commit `fcce0b6de` (13 commits after
  the tag v0.1.182). Each path below is relative to its clone.
- Rows of [`reference-features.md`](../reference-features.md), group
  "later":
  - `digests.md`: "Work summaries (digests and receipts) on each reply;
    engine hooks; a hint after a shell timeout" (part 62).
  - `plans/2026-09-14-phase-0-foundation.md`: "A work digest for each turn;
    engine hooks; typed turns with an output schema; a global launch budget;
    commands with receipts; metrics; replay by bytes and a manual compact
    route; a benchmark driver" (parts 62, 17, 8).
- For no step yet of [`../../plan/README.md`](../../plan/README.md). The
  digest needs the store (step 8), tool rows (steps 5 and 12), the memory
  journal (step 15) and a folder snapshot that we do not plan (section 7).
- Six subagents read the files in groups: `core`, `host-wiring`,
  `engine-hooks`, `e2e-tests`, `ui` and `docs`. With the lead, they read 37
  files completely and 22 files in ranges (section 2).
- The lead checked 30 key claims at the cited lines. 28 agree with the code.
  Two claims of the readers were wrong, and this file has the corrected form:
  - Two readers wrote that the hook token "rotates per turn", as the
    comments say (`server/hooks/omb-hook.ts:3`,
    `server/drivers/claude.ts:1083-1084`). The code keeps one bearer for
    each bot, thread, kind and grant set. Only the record behind it is for
    one turn (`server/index.ts:1650-1652`, `:1664-1673`). The token file is
    written again only when the token changes (`claude.ts:1089`).
  - The `docs` reader cited `server/index.ts` lines that are off by 3 to 7
    lines (for example `:5380`, `:5432`, `:5503`). This file uses the lines
    that the lead printed.
- The lead also read five small files that no group had:
  `server/shell-timeout-hint.ts`, `server/host/room-transcript.ts:40-60`,
  `server/held-unread.ts`, `server/message-db-attention.ts` and
  `server/index.ts:8150-8168`.

What this file adds to the research files that are done:

- [`memory.md`](memory.md) section 3.15 has the memory lines of the digest.
  This file does not repeat them. It only says where they enter
  (section 3.2, step 1).
- [`event-bus-fold.md`](event-bus-fold.md) sections 3.9 and 3.10 have the
  wait of `settleDirectTurn` on the digest and the 3 s race. This file adds
  what the digest does inside that wait, and why the wait exists.
- [`context.md`](context.md) has the compaction chips in `DigestChip.tsx`
  and replay by bytes. This file adds the digest chip, the re-send of
  digests after an engine compaction, and the digest line in a context
  rebuild.
- [`safety-floor.md`](safety-floor.md) section 3.7 has the bot safety
  digest. Section 1 of this file says how it differs.
- New: the engine hooks of Claude Code, the late-result window, the spill of
  full tool results, the shell-timeout hint, the file list from the
  checkpoint diff, and the state of each item of the phase-0 plan.

## 1. In short

After each bot turn, the reference project writes one extra message into the
conversation: a **work digest**. A digest says what the turn did, from rows
that the server saw. It does not say if the task succeeded. The document of
the reference says: "records observed work, not proof that a task succeeded"
(`docs/verification/digests.md:3-5`).

A digest holds:

- the tools the bot called, with a count and a failed count for each tool
  (the busiest 8)
- the files that changed in the project folder during the turn (at most 20
  paths)
- the memory files that the bot changed (at most 20)
- the first sentence of the reply (at most 200 characters)
- the error, when the turn failed (at most 300 characters)
- the usage of the turn
- a **coverage** value: did the server get the full output of each tool?

Special terms, each explained one time:

- **Receipt.** The window name for a message that records work and is not a
  reply: a digest, a compaction record or a call record
  (`src/lib/receipts.ts:1-3`). A receipt never becomes the last-message
  preview, the Retry target or the "working" signal.
- **Engine hook.** A command that Claude Code runs at fixed events of its
  own, for example after each tool call. The reference project registers a
  small helper program as that command. The helper sends the event to the
  server (`server/drivers/claude-hooks.ts:1-19`,
  `server/hooks/omb-hook.ts:1-83`).
- **Full result.** The complete output of one tool call. Without hooks, the
  server sees only a preview that the driver cut. With hooks, the server
  gets the full output, removes secrets from it and writes it to a file.
  The tool row then gets `fullResult: true`.
- **Coverage** (`hookCoverage`). `full`: each tool row of the turn has a full
  result. `preview`: the server saw tools, but only previews. `none`: the
  turn had no tool rows (`server/digest.ts:1-2`, `:12-20`).
- **Checkpoint.** A commit of the project folder in a private ("shadow") git
  repository, made before the turn starts. The file list of the digest is
  the difference between that commit and the folder after the turn
  (`server/checkpoints.ts:1-3`, `:882-923`).
- **Command receipt.** A row in the table `command_receipts` with a kind and
  a key. The store writes it in the same transaction as the change, so a
  repeated command does nothing (`server/message-db.ts:89-95`, `:254-272`).
  The digest uses the kinds `digest.append`, `digest.files` and
  `hook.ingest`.
- **Late result.** A full result that arrives after the turn ended. Claude
  Code sends `PostToolUse` in the background, so it can arrive late. The
  server accepts it for 60 s (`server/host/late-tool-results.ts:3-4`).

Who reads a digest:

1. **The model, first.** A context rebuild turns each digest into one line,
   `[What <bot> did in an earlier turn: …]` (`server/digest.ts:147-151`,
   `server/index.ts:6933`). A room window does the same for each member
   (`server/host/room-transcript.ts:50-51`). After Claude Code compacts its
   own context, the server sends the last 2 digests back to it
   (`server/index.ts:5389`, `:5402-5409`). When a bot changes engine, the
   new engine gets the digests (`server/digest.e2e.test.ts:152-161`).
2. **Search.** Digest text is in the full-text index. A search ranks digests
   after text rows (`server/message-db.ts:826-858`).
3. **The Today page and the attention list** read digest rows
   (`server/message-db.ts:495-550`).
4. **The person, only on request.** The window shows the digest chip only
   when the feature `showToolCalls` is on, and it is off by default
   (`src/components/ChatView.tsx:676-677`, `src/lib/feature-flags.ts:59-61`).
   The chip shows the time, the number of tool calls and the number of
   files. It does not show names, the reply, the error, the usage or the
   coverage (`src/components/DigestChip.tsx:20-47`).

How the **bot safety digest** differs: `server/bot-safety-digest.ts` makes a
string of the access fields of each bot (25 fields of a bot, 7 of a thread).
A save compares it with the last write, so a permission that was revoked in
place always reaches the disk (`server/bot-safety-digest.ts:1-30`). It has no
turn, no message, no UI and no hook. Only the word "digest" is the same.

The plan of the digest is the "phase-0 foundation" plan. The plan says at its
top that only part of it shipped (`docs/plans/2026-09-14-phase-0-foundation.md:3-8`).
Built: the digest, the Claude hooks, command receipts and replay by bytes.
Not built: typed turns with an output schema, the launch budget, metrics and
the benchmark driver (section 3.9).

## 2. Files read completely

Line counts are the lengths of the files. "Ranges" means that only those
lines were read.

### Group `core`

| File | Lines |
|---|---|
| `server/digest.ts` | 164 |
| `shared/digest.ts` | 1 |
| `packages/phone-protocol/src/digest.ts` | 40 |
| `packages/phone-protocol/src/wire.ts` | ranges 1-20, 420-500, 520-532 of 1000 |
| `packages/phone-protocol/src/wire-tool.ts` | 23 |
| `server/turn-outcome.ts` | 157 |
| `server/digest.test.ts` | 268 |
| `server/tool-results.ts` | 71 |
| `shared/redact.ts` | 168 |
| `shared/tool-name.ts` | 22 |

### Group `host-wiring`

| File | Lines |
|---|---|
| `server/index.ts` | ranges 55-70, 1560-1830, 2325-2350, 5020-5050, 5360-5515, 6340-6362, 6630-6815, 6920-6940, 7795-7810, 8115-8170, 8380-8400, 8988-9005, 9585-9620, 12078-12132, 12705-12845 of 15253 |
| `server/host/late-tool-results.ts` | 91 |
| `server/host/tool-results-sweep.ts` | 218 |
| `server/tool-result-spill.ts` | 12 |
| `server/checkpoints.ts` | 923 |
| `server/message-db.ts` | ranges 1-130, 165-198, 212-285, 495-560, 700-860 of 1000 |
| `server/commands.ts` | 35 |
| `server/store.ts` | ranges 1100-1145, 1215-1250 |
| `server/contracts.ts` | ranges 196-200, 300-312 |

### Group `engine-hooks`

| File | Lines |
|---|---|
| `server/hooks/omb-hook.ts` | 83 |
| `server/hooks/omb-hook.test.ts` | 142 |
| `server/hooks.e2e.test.ts` | 250 |
| `server/proxy-paths.ts` | 31 |
| `server/bot-box/env.ts` | 94 |
| `server/drivers/claude-hooks.ts` | 19 |
| `server/drivers/claude-bot-settings.test.ts` | 113 |
| `server/drivers/claude.ts` | ranges 300-400, 1060-1140, 1260-1270, 1920-1945 of 1989 |
| `server/drivers/codex.ts` | ranges 67, 560-568, 1172-1200, 1340-1346, 1525-1583 of 1583 |
| `server/request-auth.test.ts` | range 700-800 of 969 |
| `scripts/bundle-server.mjs` | range 30-80 of 180 |
| `server/workspace-backup-policy.ts` | range 60-68 |

### Group `e2e-tests`

| File | Lines |
|---|---|
| `server/digest.e2e.test.ts` | 199 |
| `server/digest-control.e2e.test.ts` | 72 |
| `server/provider-error-digest.e2e.test.ts` | 73 |
| `server/cancelled-turn.e2e.test.ts` | 134 |
| `server/index.test.ts` | ranges 11892-11993, 13797-13872 of 15166 (no work-digest test, section 6) |
| `scripts/control-omb.ts` | ranges 125-176, 289-390 of 556 |

### Group `ui`

| File | Lines |
|---|---|
| `src/components/DigestChip.tsx` | 84 |
| `src/components/DigestChip.test.ts` | 97 |
| `src/lib/receipts.ts` | 11 |
| `src/lib/transcript-derivations.ts` | 64 |
| `src/components/CompactionChip.dom.test.ts` | 56 |
| `src/components/sidebar-preview.ts` | 112 |
| `src/state/store.tsx` | ranges 20-35, 110-135 of 3258 |
| `src/components/ChatView.tsx` | ranges 50-95, 640-700, 825-845 of 1180 |
| `src/components/GroupView.tsx` | ranges 15-30, 145-175, 270-295 of 625 |
| `src/locales/en.json` | ranges 2820-2840, 4570-4580, 8708-8716 |
| `src/lib/feature-flags.ts`, `src/components/chat-bubble.ts` | ranges 59-66, 60-75 |

### Group `docs`

| File | Lines |
|---|---|
| `docs/verification/digests.md` | 114 |
| `docs/plans/2026-09-14-phase-0-foundation.md` | 448 |
| `docs/verification/context-compaction.md` | ranges 40-105, 215-275, 295-312, 334-342 of 459 |
| `server/bot-safety-digest.ts` | 30 |
| `server/system-prompt.ts` | range 290-300 |
| `docs/announcements.md` | range 1-20, the rest by search |

### Read by the lead

`server/shell-timeout-hint.ts` (21 lines), `server/held-unread.ts` (14),
`server/message-db-attention.ts` (7), `server/host/room-transcript.ts`
(range 40-60), `server/index.ts` (ranges 1650-1685, 5386-5505, 6724-6800,
8150-8168).

### Release notes

`git log v0.1.182..HEAD` has 13 commits. None of them touches digests, hooks
or receipts. The release card of 0.1.182 and `docs/announcements.md` do not
name them either. There is no release note for this feature after v0.1.182.

## 3. How it works

### 3.1 What is kept in memory during a turn

The server keeps four maps for each thread. All four are in memory only
(`server/index.ts:5035`, `:5366-5370`):

| Map | Value | Set at |
|---|---|---|
| `turnStartedAt` | the start time | `turn.started` (`:6357`) |
| `turnCheckpoints` | bot, folder, commit hash, pin | before dispatch (`:8160`) |
| `liveTurnByThread` | the turn id of the engine | each event with a turn id (`:6350`) |
| `memoryRowsByThread` | the memory journal rows of the turn | `turn.completed` or `session.exited` (`:5034-5045`) |

`clearTurnDigestState` removes all four. A cancel before dispatch, a failed
set-up and the delete of a bot call it (`:2344`, `:8391`, `:8999`,
`:5379-5384`).

### 3.2 The checkpoint before a turn

1. The checkpoint folder is the folder of the turn, unless that folder is the
   private workspace of the bot (`server/index.ts:7803`).
2. Right before dispatch, the server waits for
   `checkpoints.snapshot(...)` with a pin named after the dispatch claim
   (`:8152-8154`). The comment says: "the engine must not edit the project
   until it settles". This wait has no time limit of its own. Each git
   call has a limit of 120 s (`server/checkpoints.ts:113`).
3. If the claim is no longer current, the server releases the pin and stops
   the set-up (`server/index.ts:8155-8158`).
4. Else the server stores the commit hash in `turnCheckpoints` (`:8159-8160`).
5. Room turns never set a checkpoint. So a room digest has no file list
   (`docs/verification/context-compaction.md:234-236`).
6. `snapshot` never throws. A git timeout turns checkpoints off for that
   folder. Three failures in a row turn them off for the bot
   (`server/checkpoints.ts:786-823`, `:131-141`).

### 3.3 The digest of a direct turn (`scheduleTurnDigest`)

The source is `server/index.ts:5432-5505`.

1. The fold gets `turn.completed`. It calls `scheduleTurnDigest` when it has
   a turn id (`:6724-6735`). The input has the reply, the error of a failed
   turn, the usage and `isCurrent`. `isCurrent` is true while the direct
   generation of the thread has not changed and the task exists
   (`:6663-6664`).
2. The function takes and deletes the start time, the checkpoint and the
   memory rows of the thread first (`:5445-5451`). So the state is gone even
   when the digest is not written.
3. If the turn is no longer current, it stops. No digest (`:5453`).
4. It builds the digest from the active path of the thread
   (`buildTurnDigest`, section 3.4). The duration is 0 when the start time is
   not known (`:5460`).
5. It sets the coverage from what it saw: `full` when each tool row of the
   turn has `fullResult: true`, `preview` when the turn has tool rows,
   `none` when not (`:5465`, `server/digest.ts:12-20`). The engine name is
   not used. The comment says: "Evidence is observed, never inferred from a
   provider's brand" (`server/digest.ts:12`).
6. It appends the digest message with the command receipt
   `digest.append` and the key `<thread>:<turn>` (`:5467-5476`). A repeat of
   the same key returns the first row and appends nothing
   (`server/store.ts:1138-1139`).
7. For a direct turn, it records the digest as "handed" to the engine of
   that instance (`:5477-5481`). So the same engine does not get the digest
   again in its next prompt (`server/digest-control.e2e.test.ts:35-36`).
8. With no checkpoint, it stops here (`:5482`).
9. Else it runs `checkpoints.diffWorkingTree` in a race against a 3,000 ms
   timer. The timer aborts the git work and gives `null` (`:5483-5496`).
10. When the diff gave files, the turn is still current and the row exists,
    it builds the digest again with the files. It keeps the coverage of the
    stored row, because a late hook can have changed it. It patches the row
    with the receipt `digest.files` (`:5497-5499`).
11. An error anywhere is written to the log and dropped (`:5500-5501`). So
    the promise always resolves.
12. At the end, it releases the pin of the checkpoint without a wait
    (`:5502-5504`).

The direct turn ends "busy" only after this promise. That wait is in
[`event-bus-fold.md`](event-bus-fold.md) 3.9 and 3.10
(`server/index.ts:6759`, `:6761`). The longest step is the diff, so a 1:1
turn in a project folder can hold "busy" and the queue for up to 3 s after
the reply.

Error paths and edge cases:

- A timeout of the diff gives a digest with no file list, and no message
  says why (`:5496-5497`).
- A crash between the turn end and step 6 loses the digest. The inputs were
  in memory (section 3.1). Nothing builds a missing digest at start. The
  readers found no such path.
- A crash during the turn loses the checkpoint hash, so the next digest has
  no file list. The pin is also a git ref on disk, and the next process
  removes it on first use (`server/checkpoints.ts:279-282`, `:354-377`).
- A failed turn gets a digest too, with the error and
  `turnSucceeded: false` (`server/provider-error-digest.e2e.test.ts:56-63`).
- A turn that the provider cut off keeps its partial text as the reply of
  the digest (`server/cancelled-turn.e2e.test.ts:86-98`).

### 3.4 Building the digest (`buildTurnDigest`)

The function is pure: no I/O and no wait (`server/digest.ts:52-93`).

1. It takes the activity rows of this turn that have a tool with an
   `itemId` (`:54-55`). A row of another turn, a row with no tool and a chip
   with no `itemId` do not count (`server/digest.test.ts:86-93`).
2. It groups them by tool identity, not by the title of the chip
   (`:56-57`). A name with a space or a `/` becomes `shell`
   (`shared/tool-name.ts:12-22`). The reason is a bug of the past: some
   engines put the whole command in the title, and the title went into a
   stored, searched and replayed row (`server/digest.test.ts:50-51`).
3. For each tool: the count, the failed count (`ok === false` only) and a
   sample. The sample is the first summary that the driver gave, at most
   300 bytes (`:58-62`). The digest does not redact the sample. It trusts
   that the driver did (`:61`).
4. It sorts the tools by count and keeps 8. `toolsDropped` is the number of
   other tools. `toolCalls` is the sum of all calls, with the dropped tools
   (`:65-67`, `:81-82`).
5. It takes at most 20 memory rows and maps `edited` to `updated`
   (`:69-72`).
6. The file list has one budget of 20 paths for changed, then added, then
   deleted. The paths over the budget go into `truncated` (`:95-108`). So a
   turn with 20 changed files shows no added or deleted path.
7. The reply: redact, then cut at the first sentence end (`.`, `!` or `?`
   before a space), then cut to 200 UTF-16 units (`:87`, `:110-115`).
8. The error: redact, put on one line, cut to 300 UTF-16 units (`:88`).
9. The usage is copied as it came (`:89`).

### 3.5 The text of a digest (`renderDigest`, `digestPromptLine`)

1. `renderDigest` joins parts with ` · ` after `[digest]`
   (`server/digest.ts:117-140`):
   1. `turn failed: <error>`, when there is an error.
   2. `tools: Bash ×12 (1 failed), …, +N more`, then
      ` (from tool previews)` when the coverage is `preview`.
   3. With no tools: "no tool activity observed in this turn" (`none`) or
      "no tool calls".
   4. `files: changed …; added …; deleted …; +N more paths`, or
      `files: none changed`, only when the digest has files.
   5. `memory: <kind> <path>, …` and `+N more memory changes`.
   6. `reply: <first sentence>`.
2. The whole text is at most 1,500 bytes, cut on a code point with ` […]`
   (`:139`, `:153-164`).
3. The text has no usage, duration or samples.
4. The phone apps split the tools part at `×N` and `(N failed)`. This is a
   text contract (`:121`).
5. `digestPromptLine` removes `[digest]` and gives one line:
   `[What <bot> did in an earlier turn: <body>]` (`:147-151`). The body
   includes the `reply:` part, which is model output.

### 3.6 The engine hooks of Claude Code

Only the Claude driver declares the capability `hooks: true`
(`server/drivers/claude.ts:1932`). The contract says: "hooks observe and
inject context, never decide state" (`server/contracts.ts:198-199`,
`:307-308`).

Set-up of a turn:

1. The server adds hooks when the adapter has the capability and
   `OMB_HOOKS` is not `0` (`server/index.ts:1810`, `:8133-8135`, room turns
   `:9603-9605`).
2. `hooksIntegration` makes an internal capability of kind `hooks` for the
   bot, thread and turn. It gives the engine `{ url: http://127.0.0.1:PORT,
   token }` (`:1811-1823`).
3. The token is the session bearer of the bot, thread, kind and grants. It
   stays the same from turn to turn. The record behind it is for one turn
   only (`:1650-1652`, `:1664-1673`). A new random token is made only for
   `perTurn` capabilities (`:1673`).
4. The driver writes the token to
   `<data>/hook-tokens/<24 hex of sha256(bot \0 thread)>/token`, mode
   `0600`, in a folder of mode `0700`. It writes only when the value
   changed, and a prestarted spare process does not write
   (`server/drivers/claude.ts:376-381`, `:1085-1089`).
5. It sets `OMB_HOOK_URL` and `OMB_HOOK_TOKEN_FILE` for the CLI
   (`:1090-1091`). The token is never in the arguments or the environment.
6. It writes the hook list into the private `--settings` file
   (`:1099-1108`). The list (`server/drivers/claude-hooks.ts:13-18`):

   | Event | Matcher | Mode | Claude Code limit |
   |---|---|---|---|
   | `PostToolUse` | all tools | in the background (`async`) | 60 s |
   | `PostToolUseFailure` | `Bash` | waits | 5 s |
   | `PreCompact` | all | waits | 5 s |
   | `SessionStart` | `compact` | waits | 5 s |

   `PostToolUse` runs in the background because Claude Code holds a tool
   result until each waiting hook exits, and each hook is a new process.
   Version 2.1.308 kills a background hook at its limit, so it gets 60 s
   (`claude-hooks.ts:10-12`).
7. On POSIX the command is one shell line with single quotes. On Windows it
   uses `args`, which needs Claude Code 2.1.139 (`claude-hooks.ts:4-9`).
8. The token folder is mounted read-only into the sandbox of the bot
   (`claude.ts:1267`). `OMB_HOOK_TOKEN_FILE` is on the allow list of the
   sandbox environment (`server/bot-box/env.ts:31`).
9. A bot's own `.claude/settings.json` cannot remove these hooks.
   `disableAllHooks` is dropped, and the hooks of the bot run next to ours
   (`server/drivers/claude-bot-settings.test.ts:38-54`, `:91-106`).
10. On/off of hooks is part of the process key, so a change starts a new
    CLI process (`claude.ts:1112-1134`).

The helper (`server/hooks/omb-hook.ts`):

1. It always exits with code 0 (`:1`, `:14-18`).
2. Its time budget is `OMB_HOOK_TIMEOUT_MS`, at most 4,000 ms. A fuse timer
   exits at the budget (`:8-9`, `:19-20`).
3. It reads stdin. Over 1 MiB, it exits and forwards nothing (`:10`,
   `:22-31`).
4. It exits when the JSON is bad, when the event name is missing, when the
   URL is not `http(s)://127.0.0.1[:port]` or when the token file is missing
   or empty (`:38-55`).
5. It posts `{ event, payload }` to `/api/internal/hook` with
   `Authorization: Bearer <token>`, no redirects, and an abort after the
   budget minus 300 ms (`:56-65`).
6. It prints `hookSpecificOutput` when the server gives it. It prints plain
   `context` only for `SessionStart` and `UserPromptSubmit`, because Claude
   Code reads plain output as context only for those events (`:68-74`).
7. Any other answer or error: exit 0 and print nothing (`:75-80`).

### 3.7 The hook route and what the server does with each event

The route (`server/index.ts:12715-12822`):

1. It accepts a live capability (constant-time compare), or the bearer of
   an ended turn that still owes results (`:12716`,
   `server/host/late-tool-results.ts:34-38`). Else 401.
2. The capability must be of kind `hooks` (`:12729-12747`). The bot and
   thread in the query must match the record (`:12750-12760`). Else 403.
3. It calls `ingestEngineHook` and answers with its JSON (`:12821`).

`ingestEngineHook` (`server/index.ts:5390-5430`):

1. After the turn ended, only `PostToolUse` counts (`:5394`).
2. `PreCompact`: the room session of that member is no longer trusted, and
   a chip "context compaction started (manual|auto)" is added
   (`:5396-5401`).
3. `SessionStart` with `source: "compact"`: a chip "context compacted —
   re-sent the last N digest(s)", and the answer `context` has the last 2
   digests since the last fresh start, as prompt lines (`:5402-5410`).
4. `PostToolUseFailure`: the shell-timeout hint (section 3.8).
5. `PostToolUse`:
   1. It needs `tool_use_id` and a `tool_response` (`:5413-5415`).
   2. It finds the activity row of that tool id in the live turn, or in an
      ended turn that owes it (`:5418-5419`). With no row, it does nothing.
      So a hook cannot make a row (`:5420`).
   3. With the key `<thread>:<turn>:<tool id>` and no `hook.ingest`
      receipt yet, it redacts the text, writes it to
      `<data>/tool-results/<thread>/<sha256(key)>.txt` (at most 512 KiB,
      file `0600`, folder `0700`), and patches the row with
      `fullResult: true` when the whole text fit (`:5421-5427`,
      `server/tool-result-spill.ts:6-12`).
   4. For a late result, it marks the tool id as saved. When each tool row
      of that turn now has a full result, it patches the digest to `full`
      and renders the text again (`:5428`, `server/digest.ts:22-28`). This
      patch has no command receipt.
6. Nothing reads the result files back. The row keeps only the flag
   (`server/host/tool-results-sweep.ts:5-6`). Only the Claude hook sets
   `fullResult` anywhere in the code.
7. A sweep removes old result files, but only on a Cloud home and only when
   `OMB_TOOL_RESULTS_SWEEP` is set (`server/host/tool-results-sweep.ts:43-48`,
   `:169-172`). On a desktop, the files stay.

The late-result window (`server/host/late-tool-results.ts`):

1. At the end of a turn, the server keeps the unsaved tool ids and the
   bearer of the turn for 60 s (`:3-4`, `:39-42`, `server/index.ts:1740-1746`).
2. The security invariant: "an ended turn's hooks bearer is honoured for
   nothing but saving the full output of that turn's own tool calls, each
   once, until LATE_TOOL_RESULT_MS after the turn ended" (`:24-25`).
3. Each tool id is accepted one time (`:79-81`). After all are in, the
   bearer gets 401 (`server/hooks.e2e.test.ts:171-174`).
4. A revoked generation keeps its bearer for this use. At most 64 are kept
   (`:5`, `:48-52`).
5. The window is in memory. A restart ends it, and the digest stays
   `preview`.

### 3.8 The shell-timeout hint

1. Claude Code 2.1.296 reports a Bash call that hit its limit as
   `PostToolUseFailure` with "Command timed out after …"
   (`server/shell-timeout-hint.ts:3-4`).
2. The server answers with `additionalContext`: do not run it again the same
   way. For a `find /` command, it names `mdfind -name` or a `find` with
   `-maxdepth`. Else it names a larger `timeout`, up to the cap
   (`:7-16`, `:18-21`).
3. The cap is one day: `BASH_MAX_TIMEOUT_MS = 24 * 60 * 60_000`
   (`server/system-prompt.ts:296`). The document says 600,000 ms
   (`docs/verification/digests.md:55`). The document is out of date.

### 3.9 The phase-0 plan against the code

| Item of the plan | State | Evidence |
|---|---|---|
| 0.1 A work digest for each turn | Built, changed | `server/digest.ts`, `server/index.ts:5432-5505`. Coverage is `full`/`preview`/`none`, not `chips`. Files come from one diff with a 3 s limit, not a second snapshot. The digest also has `error`, `toolCalls`, `toolsDropped` and `memoryDropped` |
| 0.2 `PostToolUse`: redact, write, dedupe | Built | `claude-hooks.ts:14`, `index.ts:5413-5427` |
| 0.2 `PreToolUse` filters for noisy commands | Not built | No `PreToolUse` in `claude-hooks.ts:13-18` |
| 0.2 `PreCompact` guidance | Partly | A chip only (`index.ts:5396-5401`). The plan found that `PreCompact` cannot add context (plan `:380-385`) |
| 0.2 `SessionStart` re-send of digests | Built | `index.ts:5402-5410` |
| 0.2 `Stop` hook | Not built | `digests.md:37`. The comment in `scripts/bundle-server.mjs:53-54` still names `Stop`. It is out of date |
| 0.2 A 5 s timer in the helper | Changed | 4 s helper, 5 s Claude Code limit, 60 s for `PostToolUse` |
| 0.3 Typed turns with an output schema | Not built | No `outputSchema` in `server/index.ts` or `server/contracts.ts`. It is only in MCP tool schemas (`server/mcp-gate.ts:197-221`) |
| 0.4 A global launch budget | Not built | No `server/launch-budget.ts`. Only a test uses `launch.acquire` (`server/commands.test.ts:64-73`) |
| 0.5 Commands with receipts | Built | `server/commands.ts:1-35`, `server/message-db.ts:89-95`, `:254-272` |
| 0.6 Metrics | Not built as planned | No `server/metrics.ts`, no `prompt-shape` (search only) |
| 0.7 Replay by bytes | Built | 24,000 bytes (`server/context-rebuild.ts:157`). See [`context.md`](context.md) |
| 0.7 Compaction record and a manual compact route | Built, other shape | `POST /api/bots/:id/compact` (`server/request-auth.ts:372`) |
| 0.8 A benchmark driver | Not built | No `scripts/bench/` |

The plan made a claim that the code does not keep: "secrets in paths are
not a concern, contents never are read" (plan `:136-137`). The diff lists
paths only, but the checkpoint copies the contents of each file that is not
excluded into the shadow repository (section 8, P521).

## 4. The data

### 4.1 The digest type

`packages/phone-protocol/src/digest.ts:2-40`. `shared/digest.ts:1` only
exports it again, so the server, the window and the phone apps share it.

```ts
type HookCoverage = "full" | "preview" | "none";
interface DigestFiles { changed: string[]; added: string[]; deleted: string[]; truncated?: number }
interface DigestTool { name: string; count: number; failed: number; sample?: string }
interface TurnDigest {
  turnId: string; botId: string; threadId: string;
  at: number; durationMs: number;
  tools: DigestTool[]; toolCalls?: number; toolsDropped?: number;
  files?: DigestFiles;
  memory: Array<{ path: string; kind: "created" | "updated" | "deleted" }>; memoryDropped?: number;
  reply: string; error?: string;
  usage?: { input: number; output: number; cachedInput?: number; costUsd?: number | null };
  hookCoverage: HookCoverage;
}
```

`files` is absent when no diff ran. It is not an empty list. The window keeps
that difference: it never says "0 files changed"
(`src/components/DigestChip.tsx:24`).

### 4.2 The limits

| Limit | Value | Unit | Source |
|---|---|---|---|
| `MAX_TOOLS` | 8 | tools | `server/digest.ts:30` |
| `MAX_FILES` | 20 | paths, one budget for 3 lists | `:31`, `:95-108` |
| `MAX_MEMORY` | 20 | rows | `:32` |
| `REPLY_CHARS` | 200 | UTF-16 units, no marker | `:33`, `server/tool-results.ts:13-17` |
| `ERROR_CHARS` | 300 | UTF-16 units, no marker | `:34` |
| `RENDER_BYTES` | 1,500 | UTF-8 bytes, marker ` […]` | `:35`, `:153-164` |
| Tool name | 160 | bytes | `:58` |
| Sample | 300 | bytes | `:62` |
| Memory path, file path | 512 | bytes | `:70`, `:99` |
| Digests re-sent after a compaction | 2 | messages | `server/index.ts:5389` |
| File diff | 3,000 | ms | `server/index.ts:5492` |
| One git call | 120 | s | `server/checkpoints.ts:113` |
| Hook helper | 4,000 | ms | `server/hooks/omb-hook.ts:9` |
| Hook input | 1 | MiB | `omb-hook.ts:10` |
| Late result window | 60 | s | `server/host/late-tool-results.ts:4` |
| One full result file | 512 | KiB | `server/index.ts:5387` |

Two units are mixed: the reply and the error count UTF-16 units, and the
other limits count UTF-8 bytes.

### 4.3 Where it is stored

1. A digest is a row of the table `messages` in `<data>/messages.db` with
   `kind = 'digest'`. `text` is the rendered line. `json` has the full
   message, with the digest at `$.digest` (`server/message-db.ts:51-60`,
   `:516`). The file is mode `0600`, WAL, `synchronous = NORMAL` (`:40-50`).
2. A partial index covers `activity`, `digest` and `options` rows for the
   Today page (`:21-23`, `:67`).
3. `command_receipts(kind, key, at, result)` has the primary key
   `(kind, key)` (`:89-95`). The receipt and the change commit in one
   transaction (`:254-272`). The reading of the readers found no code that
   removes receipts.
4. The append passes the row through `redactBotAuthored`
   (`server/store.ts:1136`). The patch with the file list does not redact
   (`:1234-1246`).
5. The message on the wire has `kind: "digest"`, `text`, `digest`,
   `turnId`, `requestMessageId`, `turnSucceeded` and, in a room, `from`
   (`packages/phone-protocol/src/wire.ts:439-445`, `server/index.ts:5467-5476`).
6. The tool row has `tool.itemId` and `tool.fullResult`. The comment says:
   "Private server-local spill paths are not exposed to clients"
   (`packages/phone-protocol/src/wire-tool.ts:18-22`).

### 4.4 Files on disk

| Path | Content | Mode | Removed |
|---|---|---|---|
| `<data>/checkpoints/<bot>/<16 hex of sha256(folder)>/` | The shadow git repository | `0700` | Garbage collection only (`server/checkpoints.ts:714-741`) |
| `<data>/tool-results/<thread>/<sha256(key)>.txt` | One full tool result, redacted | `0600` | Cloud home with the sweep on, else never |
| `<data>/hook-tokens/<24 hex>/token` | The hook bearer | `0600` | No removal found in `server/drivers/claude.ts`. Left out of backups (`server/workspace-backup-policy.ts:65-66`) |

### 4.5 What the checkpoint never copies

`EXCLUDES` (`server/checkpoints.ts:27-109`): version-control folders,
`.openmausbot-secrets/`, dependency, build and cache folders, logs,
`*.env*`, `.env`, `.env.*`, `*.pem`, `*.key`, pictures, media, archives,
databases and model weights. A folder with a valid `CACHEDIR.TAG` is also
left out (`:439-476`). The checkpoint refuses the filesystem root, the home
folder, Desktop, Documents and Downloads (`:160-187`). Every other file is
copied, for example a `credentials.json`.

## 5. The UI

### 5.1 The digest chip

`src/components/DigestChip.tsx:20-47`.

1. No digest on the message: nothing.
2. The label is "Worked for {duration}" when the duration is over 0, then a
   work phrase when the turn did work, joined by ` · ` (`:28-30`).
3. The work phrase: "Did {tools} tool calls · {files} files changed" and
   its singular forms (`src/locales/en.json:2823-2824`, `:8711-8714`).
4. The tool number is `toolCalls`. Without it, it is the sum of the counts
   with a `+` when tools were dropped: "Did 12+ tool calls" (`:26`).
5. The file number is changed + added + deleted + truncated. With no
   `files`, the phrase has no file part (`:24`).
6. Memory work makes the chip show, but the label does not count it
   (`:25`).
7. An empty label: nothing (`:31`).
8. A "View trace" button opens the trace dialog of the turn (`:40-44`).
9. The tooltip (`title`) is the full digest text, or "What this turn did"
   (`:35`).

Not shown: tool names, failed counts, samples, paths, the reply, the
error, the usage and the coverage. No locale text names the coverage.

Accessibility: the button is a real `<button>`. The icon has no
`aria-hidden`. The full text is only in a tooltip, which a keyboard or a
touch screen does not show well. The label can be cut by `truncate`
(`:35-42`).

### 5.2 Where the chip shows

1. In a 1:1 chat, only when `features.showToolCalls` is on, and in the
   Advanced mode only when the activity toggle for tools is on too
   (`src/components/ChatView.tsx:676-677`, `:791`).
2. In a room, only when `showToolCalls` is on (`src/components/GroupView.tsx:145`,
   `:285-286`).
3. When the chip is hidden, the digest row is a quiet row
   (`src/components/chat-bubble.ts:65-71`).

### 5.3 Receipts in the rest of the window

1. The "working" state reads the last message that is not a receipt
   (`ChatView.tsx:835`). So a late digest does not start the working dots
   again.
2. The Retry button skips receipts (`src/lib/transcript-derivations.ts:27`).
   A room skips only digests and compactions, so a call record can be the
   Retry target there (`GroupView.tsx:157-165`).
3. The sidebar preview skips receipts (`src/components/sidebar-preview.ts:19-22`,
   `:43-58`).
4. A digest does not end the "marked unread" state of a conversation,
   because it is not a reply (`server/held-unread.ts:4-7`).

### 5.4 The phone apps

The document says that the desktop and Android apps hide an empty receipt.
The phone parsers stop at the last `reply:`, even when the reply has ` · `
(`docs/verification/digests.md:73-95`). The readers did not read the phone
code.

## 6. The tests

| Test file | What it guarantees |
|---|---|
| `server/digest.test.ts` (19 cases) | Counts by tool identity, the failed count, the first sample, the order (`:32-48`). Command titles become `shell` and no command text is in the line (`:50-84`). Rows of other turns do not count (`:86-93`). 8 tools kept, `toolCalls` = 55 (`:95-104`). Memory `edited` → `updated` (`:106-118`). First sentence and 200 units (`:120-125`). Error on one line, a key masked, 300 units (`:127-138`). No lone surrogate (`:140-147`). A webhook secret masked (`:149-154`). 30 files → 20 and `truncated` 10 (`:156-161`). Byte limits stay valid UTF-8 (`:163-174`). The text stays under 1,500 bytes (`:200-207`). Coverage depends only on what was seen, for 8 engine kinds (`:225-240`). The late upgrade runs once (`:242-255`) |
| `server/hooks/omb-hook.test.ts` | Large answers are fully written before exit. Input over 1 MiB is not sent. A redirect is not followed. Bad input and no server give exit 0. The bearer and body are right. A server that never answers: exit in under 5 s. `context` printed only for `SessionStart` (`:50-141`) |
| `server/hooks.e2e.test.ts` | Full results written per call, mode `0600`, no path on the row, digest `full` (`:113-137`). A forged bearer gets 401 (`:140-143`). Late results: the digest is `preview` first, then `full`. The ended bearer gets 403 for another bot or thread, and 401 after all results are in (`:146-175`). Compaction: two chips and the re-sent digest line (`:181-204`). The shell-timeout hint (`:208-233`). `OMB_HOOKS=0` gives `preview` (`:236-249`) |
| `server/digest.e2e.test.ts` | One digest per turn for ACP, Claude, Codex and Pi fakes. Its counts equal the tool rows (`:109-131`). A file added during the turn is listed, and an edit of the person before the turn is not (`:133-150`, `:165-196`). The digest reaches another engine after a switch (`:152-161`) |
| `server/digest-control.e2e.test.ts` | Two turns give two digests. The same engine does not get them again. `full` with hooks. A reused tool id gets its own file. No data folder path on the wire. Room digests name the speaker. Two `digest.append` receipts in the database (`:30-63`) |
| `server/provider-error-digest.e2e.test.ts` | A 429 or 503 gives a digest with the error and `turnSucceeded: false`. The key is not in the digest or the log. The log has the class and status only (`:50-68`) |
| `server/cancelled-turn.e2e.test.ts` | A turn cut off by the provider keeps its partial reply in the digest (`:86-98`) |
| `server/drivers/claude-bot-settings.test.ts` | A bot cannot turn our hooks off. Symlinks and a FIFO are refused or skipped (`:38-87`) |
| `src/components/DigestChip.test.ts` | The label rules, singular forms, `12+`, no "0 files", the tooltip (`:19-96`) |

Not tested (from the reports):

- the shared file budget across the three lists
- a restart during or after a turn
- a diff that times out
- secret file names in the diff
- the usage in a digest
- the digest of the automatic retry of a failed turn
- the chip on Windows (the end-to-end suites are POSIX only)
- `server/index.test.ts` has no work-digest test

## 7. Ours compared

What we have now: `bot-protocol` has `event.rs`, `ids.rs` and `message.rs`.
`bot-core` and `bot-engine` have only `lib.rs`. We have no digest, no
receipt, no hook and no checkpoint. No step of the plan names them.
Decision D20 gives each turn one `turn.completed` as the last event, and P37
and P124 ask for the turn end and the usage in one transaction. The digest
fits after those.

| Part of the reference | Reference files | Our crate and module | Step | State |
|---|---|---|---|---|
| The digest type and message kind | `packages/phone-protocol/src/digest.ts`, `wire.ts:439-445` | `bot-protocol`, `message.rs` (a `Digest` kind) | 8 or later | Not planned |
| Build and render (pure) | `server/digest.ts` | `bot-core`, `digest.rs` | after 8 | Not planned |
| The schedule, the receipts | `server/index.ts:5432-5505`, `server/commands.ts`, `server/message-db.ts:89-95` | `bot-core`, `digest.rs`, the store of step 8 | after 8 | Not planned. Our store write with an id of the caller (D17) gives the dedupe |
| The memory lines | `server/index.ts:5034-5045` | `bot-core`, `memory` | 15 | See [`memory.md`](memory.md) 3.15 |
| The checkpoint and the file diff | `server/checkpoints.ts` | none | none | Not planned. If we port it, the credits of Cline, Roo-Code and Gemini CLI (`checkpoints.ts:5-9`) go into our `NOTICE`. The `NOTICE` of the reference does not have them |
| Claude Code hooks | `server/drivers/claude-hooks.ts`, `server/hooks/omb-hook.ts` | `bot-engine`, a Claude adapter | none | Not planned. Step 9 has one ACP adapter, and in the reference no ACP driver has hooks |
| The hook route and the late window | `server/index.ts:5390-5430`, `:12715-12822`, `server/host/late-tool-results.ts` | `bot-core` | none | D10: no HTTP. A hook would reach the core another way |
| The shell-timeout hint | `server/shell-timeout-hint.ts` | `bot-engine`, the Claude adapter | none | Not planned |
| The re-send after a compaction | `server/index.ts:5402-5410` | `bot-core`, context | new step of P247 | See [`context.md`](context.md) |
| The digest line in context | `server/digest.ts:147-151`, `server/index.ts:6933`, `server/host/room-transcript.ts:50-51` | `bot-core`, context | new step of P247 | Not planned |
| The chip and receipts | `src/components/DigestChip.tsx`, `src/lib/receipts.ts` | `bot-desktop`, `ui/src/features/chat/` | after 8 | Not planned |
| Typed turns with an output schema | none (plan 0.3 only) | none | none | Not built in the reference |

Where we differ by design:

1. We have no HTTP server (D10). A hook helper of a Claude adapter would
   reach the core through a local socket or a pipe, not a route. The
   loopback check and the redirect refusal of the helper then change form.
2. Our chat API driver (step 5) runs the tools itself, so the core holds
   each full result. In the reference, only Claude hooks give `full`
   (section 3.7, step 6).

## 8. Where we can be better

Each point has a reason. A point that answers a problem of section 5 of
[`changelog.md`](../changelog.md) names it. The numbers P515 to P524 are the
proposals of this file.

1. **P515. The digest in the same transaction as the turn end.** Problem in
   the reference: a crash between the end of a turn and the digest write
   loses the digest. Its inputs are in four maps in memory, which are
   removed first (`server/index.ts:5445-5451`), and no code makes a missing
   digest at start. We build the digest without files from stored rows and
   write it in the transaction of `turn.completed` (P37, P124). The file
   list is a later patch. Changelog problem: "State lost at a restart or a
   crash" (v0.1.107, v0.1.165).
2. **P516. "Busy" ends before the file diff.** Problem in the reference: a 1:1
   turn in a project folder holds "busy" and the queue until the diff ends,
   up to 3 s (`server/index.ts:5483-5496`, `:6759-6761`). The wait has a
   limit, so the reference does not have a release problem here. With P515,
   the thread can be idle at once and the diff patches the digest later.
   This is a judgment call.
3. **P517. A time limit on the snapshot before dispatch.** Problem in the
   reference: dispatch waits for `checkpoints.snapshot` with no limit of its
   own (`server/index.ts:8152-8154`). Each git call can take 120 s
   (`server/checkpoints.ts:113`), and all git work of one folder is in one
   queue (`:263-276`). A slow git delays the start of the next turn. The
   number of git calls in one snapshot is not verified. Changelog problems:
   "One slow or stuck part blocks all the others" (v0.1.114, v0.1.177) and
   "A turn or a wait that does not end" (v0.1.132). Only when we build
   checkpoints.
4. **P518. No copy of the usage in the digest.** Problem in the reference:
   the digest holds a second copy of the usage that can disagree with the
   ledger. The room digest drops `cachedInput` (`server/index.ts:6797`),
   but the ledger of the same turn keeps it (`:6778`). The copy is never
   corrected (`server/digest.ts:89`). A search found no code that reads
   `digest.usage`, so nobody sees the wrong number today. We leave `usage`
   out, and a reader gets it from the usage row of P124 and P380 by the
   turn id. This is a judgment call: no harm now.
5. **P519. Full-result evidence is a capability of the driver.** Problem in
   the reference: only the Claude hook sets `fullResult`
   (`server/index.ts:5425-5426`). The chat API driver gives each tool row an
   `itemId` (`server/drivers/openai-chat.ts:816`, `:877`), so its turns are
   always `preview`, and the digest says "from tool previews"
   (`server/digest.ts:120-122`). The server ran those tools itself. Whether
   it keeps each whole result is not verified. A capability flag
   (for example `full_tool_results`) says that the driver gives full
   results. AGENTS.md asks for capability flags. This is a judgment call:
   no release problem.
6. **P520. Keep no full result that nothing reads.** Problem in the
   reference: each hook result is written to a file that nothing reads
   back (`server/host/tool-results-sweep.ts:5-6`). On a desktop the files
   stay forever (`:169-172`). The redaction knows only fixed key shapes
   (`shared/redact.ts:12-14`), so the output of `cat credentials.json` can
   stay on disk. The row in `messages.db` already has the preview, so the
   file adds only the rest of the output. We keep only the flag and the
   length. Changelog problem:
   "A secret or an access right in the wrong place" (v0.1.154, v0.1.182).
7. **P521. Secret file names stay out of the digest.** Problem in the
   reference: the diff lists each path that `EXCLUDES` does not name
   (`server/checkpoints.ts:27-109`). A `credentials.json` or `id_rsa` goes
   by name into a stored, searched and replayed row. The patch with the
   file list does not redact (`server/store.ts:1234-1246`), and the
   checkpoint copies the file contents too. When we build checkpoints, one
   deny list with a test applies to the copy and the digest, and paths go
   through the redaction. Changelog problem: "A secret or an access right
   in the wrong place" (v0.1.101, v0.1.182).
8. **P522. No reply sentence in the digest line.** Problem in the reference:
   `digestPromptLine` puts the first sentence of the reply into each context
   window (`server/digest.ts:138`, `:147-151`). The room window already
   shows the reply line of the speaker (`server/host/room-transcript.ts:56-66`),
   so the sentence is there two times and costs bytes. The line has the
   tools, files and memory only. The AGENTS.md rule on delegated turns does
   not apply: a context window does not open a delegated turn. This is a
   judgment call: no release problem.
9. **P523. A hook token that the shell of the bot cannot read.** Problem in
   the reference: the bearer stays the same for each bot and thread
   (`server/index.ts:1650-1652`). The token file is mounted into the sandbox
   of the bot, and its path is on the environment allow list
   (`server/drivers/claude.ts:1267`, `server/bot-box/env.ts:31`). The
   sandbox is for Linux only. On other systems the shell runs as the same
   user, so mode `0600` does not stop a read. So a shell command of the bot
   can probably post a `PostToolUse` for its own tool ids and mark the turn
   `full` with false text. It cannot make rows (`server/index.ts:5420`) or
   reach another bot (403). Whether the Bash tool gets that variable is not
   verified. A random token for each turn makes a token useless after its
   turn. Claude Code starts the hook and the Bash tool, so the fix that
   keeps the token from the Bash tool is open. Changelog problem: "A secret
   or an access right in the wrong place" (v0.1.181). Only when we build a
   Claude adapter.
10. **P524. The file list says whose changes it has.** Problem in the
    reference: the diff compares the commit before the turn with the folder
    after it (`server/checkpoints.ts:905`). An edit of the person or of
    another thread in the same folder during the turn is listed as work of
    the bot. A digest field "changed during the turn, maybe not by this
    bot" is honest. This is a judgment call: no release problem.

Other points that need no proposal:

- The comments that say the token rotates each turn
  (`server/hooks/omb-hook.ts:3`, `server/drivers/claude.ts:1083-1084`), the
  `Stop` hook in `scripts/bundle-server.mjs:53-54` and the 600,000 ms in
  `docs/verification/digests.md:55` are out of date. Our docs page for the
  feature says what the code does.
- Two units of length (UTF-16 units and UTF-8 bytes) are in one type
  (section 4.2). We use one unit.

The problems of section 5 of `changelog.md` that the reference has here:

| Problem | Here | Proposal |
|---|---|---|
| A turn or a wait that does not end | No. Each wait has a limit: 3 s diff, 4 s helper, 60 s late window. The snapshot before dispatch has only the 120 s limit of each git call | P517 |
| State lost at a restart or a crash | Yes: the four maps, the late window, the hook capabilities | P515 |
| One slow or stuck part blocks all the others | Partly: one git queue for each folder, the snapshot wait | P517 (P516 is a judgment call) |
| A secret or an access right in the wrong place | Partly: the result files, secret file names, the hook token in the sandbox | P520, P521, P523 |
| Usage and cost numbers corrected | No harm now: the room digest drops cached input, but nothing reads the digest usage | none (P518 is a judgment call) |

## 9. Not verified

- Whether the Bash tool of Claude Code inside the sandbox gets
  `OMB_HOOK_TOKEN_FILE` (P523).
- The number of git calls in one snapshot, and the size of the global git
  slot pool (`server/job-slots.ts` was not read).
- Whether another limit stops a turn set-up that waits for the snapshot. A
  search of `server/turn-watchdog.ts` found none (P517).
- What a prestarted spare Claude process uses as its token, because the
  spare does not write the file (`server/drivers/claude.ts:1089`).
- Whether `tool.summary` and `tool.output` are redacted before they are
  stored. The digest trusts the summary (`server/digest.ts:61`).
- Whether the automatic retry of a failed turn gets its own digest
  (`server/provider-error-digest.e2e.test.ts:46`).
- The phone code that hides empty receipts and splits the tools part
  (`docs/verification/digests.md:73-95`).
- What the trace dialog shows for a turn (`src/components/lazy-screens`).
- That `git add -A` uses the `.gitignore` of the folder under
  `GIT_WORK_TREE`. This is the normal behaviour of git, not checked in code.
- The fake engines of the end-to-end tests (`server/testing/fake-*.ts`).
- Other test files that name the digest kind (for example
  `server/person-stop.e2e.test.ts`, `server/today.test.ts`,
  `server/delta-context.test.ts`) were found by search and not read.
- Whether something removes old rows of `command_receipts`.
