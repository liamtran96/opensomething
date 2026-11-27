# Context: compaction, summaries, rooms, rebuilt sessions and the engine switch

The reference project is the local clone next to this repository, at commit
`96ff84455` (2026-11-25). All paths in this file are relative to its root,
unless a path starts with `crates/` or `docs/`, which are ours. Nobody opened
its `enterprise/` directory.

Row of [`../reference-features.md`](../reference-features.md): "context:
compaction by the engine or by the server, summaries made while idle, the
helper model for summaries, the context breakdown, the context of a room and
room sessions, tool history in a rebuilt session, the engine switch in the
middle of a thread with a replay of the thread". Part 17 of the plan. No step
has it yet. The proposals for the plan are not in this file.

Ten readers read the files: nine in one workflow, and one more for the
backup-engine files. The lead checked the key facts against the code. The
reports are in `.research/` in the worktree. Git does not track them.

What this file adds to the done research files:

- [`harness-upgrades.md`](harness-upgrades.md) (read at `ad27f0716`) has the
  replay budget, the compaction record, Start fresh, the rewind flag and the
  preambles. This file adds who compacts (the engine or the server) and
  Compact now, which asks the engine first. It adds Codex compaction in
  place, idle summaries, keep-warm, the helper model, and the context
  breakdown with its UI. It also adds room context, room sessions, delta
  context (what a session already holds) and resume recovery. Last, it adds
  the tool history of a rebuilt session and the two hand-over paths to a
  backup engine. Section 2.3 lists its lines that are
  now wrong.
- [`threads.md`](threads.md) (read at `eee23ebbe`) says that a thread has its
  own provider session. This file adds what goes into that session and when
  the server replaces it.
- [`memory.md`](memory.md) (read at `eee23ebbe`) has the helper model for
  memory jobs. This file adds the helper model for the summary, the case that
  is not booked, and two wrong lines (section 2.4).
- [`chat-turns.md`](chat-turns.md) (read at `3aec210`) has the room
  transcript of 30 lines. This file adds room sessions, which send only the
  new lines, and the room compaction. Section 2.3 lists its lines that are
  now wrong.

## 1. In short

**What the feature is.** An engine has a context window: the number of
tokens that one request can hold. A long conversation fills it. The
reference project keeps each conversation inside the window in four ways:

1. It lets the engine compact its own session, and it watches the result.
2. It writes its own summary of the old messages (a "fold") when the engine
   does not compact, or when the person asks.
3. It summarizes a conversation while the bot is idle, so that the next turn
   starts small.
4. In a room, it starts a fresh session for a bot with the recent room
   lines.

It also rebuilds a session from the stored messages when it cannot resume
the old one, for example after a switch to another engine.

**The terms, each explained one time:**

- **Context window:** the most tokens that one request to a model can hold.
  The reference finds it from the engine's report, then the model catalog,
  then the model name, then a default of 128,000
  (`server/context-budget.ts:7-13`, `server/model-context-window.ts:3-17`).
- **Session:** the conversation state that an engine keeps on its side. The
  server keeps a "resume cursor" (the session id) for each engine instance
  of a thread (`server/store.ts:83`).
- **Native compaction:** the engine summarizes its own session when it nears
  its window. Claude Code and Codex do it. A driver says so with the
  capability flag `nativeCompaction` (`server/contracts.ts:304-306`).
- **Fold:** the server's own compaction. The server writes a summary of the
  older messages as a `compaction` message, and the next rebuilt session
  starts from that summary (`server/compaction-summary.ts`,
  `server/host/conversation-compaction.ts`).
- **Backstop:** the server folds a session that the engine compacts only when
  the measured context is near the engine's own limit. Then the engine did
  not compact it (`server/host/conversation-compaction.ts:18-23`).
- **Compact now:** the person asks for a compaction. The server asks the
  engine first and folds only if the engine cannot
  (`server/host/conversation-compaction.ts:121-126`).
- **Warm summary (idle summary):** a summary made while the bot is idle, on
  a copy ("fork") of the Claude Code session (`server/warm-summary.ts`,
  `server/host/warm-summary-host.ts`).
- **Keep-warm:** a small request each 50 minutes that keeps the prompt cache
  of a subscription alive. It is off by default (`server/cache-keepwarm.ts`).
- **Helper model:** an engine instance that writes a summary for a bot whose
  own engine cannot make a one-off text call (`server/side-jobs.ts:289-310`).
- **Context breakdown:** the engine's own count of what fills the window, by
  category (`shared/context-breakdown.ts:3-20`). Only Claude Code gives one.
- **Meter reading:** a context reading that the UI shows but that never
  starts a compaction. ACP engines give this kind
  (`server/contracts.ts:311-312`, `server/context-budget.ts:15-18`).
- **Room:** a group chat with several bots. **Room context** is what each bot
  sees: the last 30 readable room lines (`server/host/room-transcript.ts`).
- **Room session:** an option that resumes one engine session for each bot
  of a room and sends it only the lines it did not see
  (`server/host/room-sessions.ts`).
- **Rebuilt session:** a new engine session that starts from a replay of the
  stored conversation (`server/context-rebuild.ts`).
- **Delta context:** the record of which context messages an engine session
  already holds, so that a resumed session gets only the unseen ones
  (`server/delta-context.ts`).
- **Handed state:** that record, stored for each engine instance of a thread
  (`HandedState`, `server/delta-context.ts:37-48`).
- **Tool history:** short lines that tell a rebuilt session which tools
  already ran. It is off by default (`server/replay-settings.ts:6-7`).
- **Engine switch:** the thread moves to another engine instance or model.
  The new engine gets a replay of the thread.
- **Backup engine:** the engine that takes a thread when its own engine is
  at a usage limit or is signed out.

## 2. Files read completely

### 2.1 The files, by group

Each reader read each file of its group from the first line to the last.
"Added" means that the reader found the file and added it to its group. The
"callers" group read only ranges of very large files. Its ranges are in
`.research/callers.md`.

| Group | File | Lines |
|---|---|---|
| Compaction | `docs/verification/context-compaction.md` | 459 |
| | `server/host/conversation-compaction.ts`, its test | 146, 230 |
| | `server/compaction-summary.ts`, its test | 82, 205 |
| | `server/drivers/codex-compact.ts`, its test | 154, 407 |
| | `server/context-compaction.e2e.test.ts` | 520 |
| | `server/drivers/chat-size-limit.ts`, its test (added) | 148, 435 |
| | `server/context-budget.ts`, its test | 34, 48 |
| | `server/model-context-window.ts` (added) | 17 |
| Idle summaries | `server/warm-summary.ts`, its test (added), its e2e test | 256, 268, 171 |
| | `server/host/warm-summary-host.ts`, its test | 249, 504 |
| | `server/drivers/claude-warm-summary.ts`, its test | 149, 194 |
| | `server/drivers/claude-keepwarm.ts`, its test (added) | 240, 138 |
| | `server/drivers/claude-keepwarm-box.test.ts` | 254 |
| | `server/drivers/claude-cost-history.ts` (added) | 92 |
| | `server/cache-keepwarm.ts`, its test, `cache-keepwarm-target.test.ts` (added) | 236, 239, 101 |
| | `server/usage-attribution.ts`, its test, its e2e test | 46, 42, 308 |
| Helper model | `server/side-jobs.ts`, its test | 315, 675 |
| | `server/helper-model.e2e.test.ts` | 304 |
| | `server/helper-followup.ts` | 60 |
| | `server/hosted-models.ts`, its test (added), `hosted-models-api.test.ts` (added) | 136, 102, 376 |
| Breakdown and UI | `shared/context-breakdown.ts` | 16 |
| | `server/context-breakdown.e2e.test.ts` | 93 |
| | `server/drivers/claude-context-usage.ts`, its test | 87, 111 |
| | `server/drivers/acp/session-reports.ts`, its test | 132, 225 |
| | `server/acp-context-reports.e2e.test.ts` | 142 |
| | `server/drivers/openai-context-window.test.ts` | 96 |
| | `src/lib/context-warning.ts`, its test | 36, 57 |
| | `src/lib/context-usage.ts` | 71 |
| | `src/components/ContextWarning.tsx` | 104 |
| | `src/components/ComposerContextMenu.tsx`, its test | 230, 346 |
| | `src/components/DigestChip.tsx` (added), its test (added) | 84, 97 |
| | `src/components/CompactionChip.dom.test.ts` | 56 |
| | `src/components/ChatMoreMenu.tsx` | 289 |
| | `apps/docs/content/docs/features/chat-and-teams.mdx` | 137 |
| | `apps/docs/content/docs/providers/model-providers.mdx`: lines 280-334 read, lines 1-279 searched only | 334 |
| Rooms | `server/room-context.ts`, its test, its e2e test | 151, 95, 93 |
| | `server/room-context-settings.ts`, its test | 19, 42 |
| | `server/host/room-sessions.ts` | 404 |
| | `server/host/room-sessions.test.ts`, in four ranges that cover all lines | 1,905 |
| | `server/room-sessions.e2e.test.ts` | 427 |
| | `server/host/room-transcript.ts`, its test | 78, 140 |
| | `src/components/RoomHeader.tsx` | 287 |
| Rebuilt session | `server/context-rebuild.ts`, its test | 238, 585 |
| | `server/delta-context.ts`, its test | 347, 532 |
| | `server/delta-context.e2e.test.ts`, in ranges that cover all lines (two readers) | 1,389 |
| | `server/turn-context.ts`, its test | 81, 228 |
| | `server/replay-settings.ts`, its test | 18, 53 |
| | `server/resume-plan.ts` (added) | 37 |
| | `server/host/resume-check.ts` (added), its test (added) | 54, 130 |
| | `server/resume-recovery.ts` (added), its test | 46, 76 |
| | `server/fresh-start.ts` | 42 |
| | `server/runtime/capabilities.ts` (added) | 66 |
| | `server/replay-tool-history.e2e.test.ts` | 114 |
| | `server/native-replay.e2e.test.ts` | 71 |
| Engine switch | `server/quota-switch.ts`, its test, its e2e test | 391, 1,026, 180 |
| | `server/host/quota-switch.ts` (added) | 54 |
| | `server/agents-bridge-switch.ts`, its test | 382, 884 |
| | `server/respond-replay.e2e.test.ts` | 129 |
| | `server/chat-replay-kinds.test.ts` (two readers) | 52 |
| | `docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md` | 117 |
| | `server/branching.test.ts`: lines 1-113 and 225-279 only | 279 |
| Backup engine | `server/host/limit-takeover.ts` | 357 |
| | `server/limit-failover.ts` | 159 |
| | `server/host/peer-limit-resend.ts` | 207 |
| Callers (ranges) | `server/index.ts`, `server/drivers/claude.ts`, `codex.ts`, `pi.ts`, `acp/core.ts`, `server/store.ts`, `server/contracts.ts`, `src/components/ChatView.tsx` | 15,258, 2,016, 1,583, 990, 1,541, 2,256, 698, 1,201 |
| | `server/drivers/prompt-split.ts` (whole file) | 188 |

### 2.2 Drift in the reference project's own documents

`docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md` cites lines
that are now wrong. This is the reference project's own drift, not ours:

- `server/contracts.ts:205` (capabilities): now at `server/contracts.ts:262`.
- `server/store.ts:205` (`costUsd`): cost is now in `addTaskUsage`,
  `server/store.ts:1805-1828`.
- `server/delegations.ts:29`: the file is gone. `MAX_COMMS_DEPTH` is at
  `server/index.ts:1785`.
- `scripts/test-floor.mjs`: the file is not in the tree.

`docs/verification/context-compaction.md:443-444` says that the cost of the
summary helper "is not separately reported". This is true for one path and
false for the other. A helper call is booked (`server/side-jobs.ts:310`). A
summary that the bot's own engine writes is not booked on purpose
(`server/side-jobs.ts:291-292`).

### 2.3 Lines now wrong in the done research files

A script compared each cited `path:line` with the file at the commit that
the research file read and at `96ff84455`. It checked that the moved line has
the same text. "Edited" means that the line itself changed. A line that
moved and kept its text has its new number.

<details>
<summary>The list: harness-upgrades.md 109, chat-turns.md 88, threads.md 7, memory.md 3</summary>

**harness-upgrades.md**, read at `ad27f0716`: 109 lines.
| Line of the file | Cited | At `96ff84455` |
|---|---|---|
| 87 | `server/index.ts:8338` | now `:8325` |
| 96 | `server/routes/bot-messages.ts:546` | now `:547` |
| 123 | `server/index.ts:8372` | now `:8359` |
| 272 | `server/index.ts:8058` | now `:8045` |
| 277 | `server/drivers/codex.test.ts:4294` | now `:4381` |
| 295 | `server/routes/bot-messages.ts:546` | now `:547` |
| 296 | `server/routes/bot-messages.ts:582` | now `:583` |
| 297 | `server/index.ts:7569` | now `:7556` |
| 298 | `server/index.ts:8372` | now `:8359` |
| 301 | `server/contracts.ts:532` | now `:548` |
| 307 | `src/state/store.tsx:2394` | now `:2371` |
| 310 | `src/locales/en.json:2712` | now `:2745` |
| 310 | `src/locales/en.json:9725` | now `:9737` |
| 310 | `src/locales/en.json:9728` | now `:9740` |
| 311 | `server/routine-recovery.ts:187` | now `:190` |
| 311 | `server/index.ts:8750` | now `:8737` |
| 326 | `server/index.ts:7574` | now `:7561` |
| 326 | `server/index.ts:7569` | now `:7556` |
| 327 | `server/index.ts:7504` | now `:7491` |
| 327 | `server/index.ts:7499` | now `:7486` |
| 331 | `server/index.ts:7751` | now `:7738` |
| 331 | `server/index.ts:7746` | now `:7733` |
| 334 | `server/index.ts:6618` | now `:6605` |
| 334 | `server/index.ts:6613` | now `:6600` |
| 352 | `server/contracts.ts:144` | now `:148` |
| 352 | `src/components/Composer.tsx:289` | now `:291` |
| 356 | `server/index.ts:4917` | now `:4915` |
| 359 | `server/index.ts:4918` | now `:4916` |
| 360 | `server/index.ts:6407` | now `:6405` |
| 360 | `server/index.ts:6427` | now `:6425` |
| 361 | `server/contracts.ts:313` | now `:320` |
| 362 | `server/index.ts:7623` | now `:7610` |
| 362 | `server/index.ts:4965` | now `:4963` |
| 367 | `server/contracts.ts:329` | now `:336` |
| 367 | `server/contracts.ts:382` | now `:393` |
| 369 | `server/routes/bot-messages.ts:527` | now `:528` |
| 374 | `src/state/store.tsx:2399` | now `:2376` |
| 376 | `server/routes/bot-messages.ts:527` | now `:528` |
| 396 | `src/locales/en.json:9725` | now `:9737` |
| 406 | `server/index.ts:7419` | now `:7406` |
| 444 | `src/state/store.tsx:2397` | now `:2374` |
| 453 | `src/state/store.tsx:1562` | now `:1564` |
| 453 | `src/state/store.tsx:2416` | now `:2393` |
| 455 | `server/routes/bot-messages.ts:585` | now `:586` |
| 456 | `src/locales/en.json:9728` | now `:9740` |
| 490 | `server/routes/bot-messages.ts:556` | now `:557` |
| 490 | `server/routes/bot-messages.ts:589` | now `:590` |
| 490 | `server/routes/bot-messages.ts:499` | now `:500` |
| 503 | `server/routes/bot-messages.ts:499` | now `:500` |
| 504 | `src/locales/en.json:9729` | now `:9741` |
| 517 | `server/index.ts:5407` | now `:5405` |
| 517 | `server/index.ts:6986` | now `:6973` |
| 517 | `server/index.ts:7707` | now `:7694` |
| 517 | `server/index.ts:12304` | now `:12291` |
| 517 | `server/index.ts:15108` | now `:15095` |
| 525 | `server/index.ts:7706` | now `:7693` |
| 565 | `server/index.ts:7757` | now `:7744` |
| 589 | `server/index.ts:8394` | now `:8381` |
| 630 | `server/contracts.ts:532` | now `:548` |
| 663 | `src/state/store.tsx:337` | now `:338` |
| 663 | `src/state/store.tsx:342` | now `:343` |
| 670 | `src/state/store.tsx:1196` | now `:1198` |
| 672 | `src/state/store.tsx:3079` | now `:3062` |
| 710 | `server/index.ts:6366` | now `:6364` |
| 738 | `server/routine-recovery.ts:64` | now `:67` |
| 738 | `server/routine-recovery.ts:161` | now `:164` |
| 742 | `server/drivers/acp/core.ts:1380` | now `:1362` |
| 747 | `server/routine-recovery.ts:182` | now `:185` |
| 749 | `server/index.ts:8750` | now `:8737` |
| 777 | `server/index.ts:7667` | now `:7654` |
| 821 | `server/index.ts:15090` | now `:15077` |
| 872 | `server/index.ts:6371` | now `:6369` |
| 872 | `server/index.ts:7726` | now `:7713` |
| 872 | `server/index.ts:8372` | now `:8359` |
| 875 | `server/index.ts:8373` | now `:8360` |
| 888 | `server/index.ts:7572` | now `:7559` |
| 889 | `server/routes/bot-messages.ts:595` | now `:596` |
| 891 | `server/index.ts:8473` | now `:8460` |
| 892 | `server/index.ts:8661` | now `:8648` |
| 893 | `server/index.ts:12053` | line edited since `ad27f0716` |
| 898 | `server/index.ts:8372` | now `:8359` |
| 920 | `server/index.ts:4917` | now `:4915` |
| 921 | `src/state/store.tsx:864` | now `:866` |
| 930 | `server/index.ts:6613` | now `:6600` |
| 947 | `src/state/store.tsx:300` | now `:301` |
| 961 | `src/locales/en.json:2712` | now `:2745` |
| 977 | `src/components/Composer.tsx:880` | now `:883` |
| 984 | `src/state/store.tsx:2200` | now `:2202` |
| 984 | `src/state/store.tsx:2206` | now `:2208` |
| 1045 | `server/index.ts:6613` | now `:6600` |
| 1098 | `server/drivers/claude.test.ts:3982` | now `:4073` |
| 1145 | `src/state/store.tsx:2394` | now `:2371` |
| 1155 | `server/index.ts:7570` | now `:7557` |
| 1156 | `server/routes/bot-messages.ts:593` | now `:594` |
| 1190 | `server/index.ts:6617` | now `:6604` |
| 1207 | `src/state/store.tsx:2398` | now `:2375` |
| 1207 | `src/state/store.tsx:2420` | now `:2397` |
| 1210 | `server/routes/bot-messages.ts:595` | now `:596` |
| 1215 | `server/contracts.ts:532` | now `:548` |
| 1220 | `server/routine-recovery.ts:187` | now `:190` |
| 1235 | `server/routes/bot-messages.ts:546` | now `:547` |
| 1237 | `server/index.ts:7724` | now `:7711` |
| 1237 | `server/index.ts:8372` | now `:8359` |
| 1243 | `server/index.ts:8394` | now `:8381` |
| 1250 | `server/routes/bot-messages.ts:555` | now `:556` |
| 1250 | `server/index.ts:8482` | now `:8469` |
| 1263 | `server/index.ts:8372` | now `:8359` |
| 1271 | `server/index.ts:8058` | now `:8045` |
| 1285 | `server/drivers/codex.test.ts:4294` | now `:4381` |

**threads.md**, read at `eee23ebbe`: 7 lines.
| Line of the file | Cited | At `96ff84455` |
|---|---|---|
| 307 | `server/config.ts:229` | line edited since `eee23ebbe` |
| 307 | `server/index.ts:11629` | line edited since `eee23ebbe` |
| 715 | `server/engine-memory.ts:525` | now `:527` |
| 1074 | `src/components/Sidebar.tsx:710` | line edited since `eee23ebbe` |
| 1140 | `src/components/SidebarBotActivity.tsx:20` | now `:21` |
| 1271 | `src/components/SidebarBotActivity.tsx:20` | now `:21` |
| 1284 | `server/engine-memory.ts:525` | now `:527` |

**memory.md**, read at `eee23ebbe`: 3 lines.
| Line of the file | Cited | At `96ff84455` |
|---|---|---|
| 816 | `server/request-auth.ts:458` | now `:461` |
| 816 | `server/request-auth.ts:525` | now `:533` |
| 1243 | `server/index.ts:11910` | line edited since `eee23ebbe` |

**chat-turns.md**, read at `3aec210`: 88 lines.
| Line of the file | Cited | At `96ff84455` |
|---|---|---|
| 59 | `server/store.ts:122` | now `:124` |
| 62 | `server/index.ts:7658` | now `:7640` |
| 65 | `server/index.ts:7623` | now `:7605` |
| 322 | `server/index.ts:7123` | now `:7105` |
| 325 | `server/index.ts:7111` | now `:7093` |
| 331 | `server/index.ts:7138` | now `:7120` |
| 332 | `server/index.ts:7161` | now `:7143` |
| 334 | `server/index.ts:7170` | now `:7152` |
| 336 | `server/index.ts:7176` | now `:7158` |
| 338 | `server/index.ts:7180` | now `:7162` |
| 341 | `server/index.ts:7075` | now `:7057` |
| 348 | `server/index.ts:7469` | now `:7451` |
| 349 | `server/routes/tasks.ts:249` | now `:248` |
| 354 | `server/index.ts:7424` | now `:7406` |
| 359 | `server/index.ts:7466` | now `:7448` |
| 368 | `server/index.ts:7504` | now `:7486` |
| 379 | `server/index.ts:7580` | now `:7562` |
| 391 | `server/store.ts:1619` | now `:1611` |
| 394 | `server/index.ts:7673` | now `:7655` |
| 404 | `server/index.ts:7681` | now `:7663` |
| 423 | `server/index.ts:8326` | line edited since `3aec210` |
| 429 | `server/host/skills-library.ts:361` | now `:373` |
| 431 | `server/engine-prestart.ts:97` | now `:171` |
| 434 | `server/index.ts:8356` | now `:8338` |
| 474 | `server/index.ts:8397` | now `:8379` |
| 496 | `server/index.ts:5018` | now `:5011` |
| 496 | `server/index.ts:6643` | now `:6625` |
| 519 | `server/index.ts:6627` | now `:6609` |
| 521 | `server/index.ts:4940` | now `:4933` |
| 523 | `server/index.ts:11750` | now `:11732` |
| 526 | `server/index.ts:4922` | now `:4915` |
| 543 | `server/store.ts:314` | now `:316` |
| 543 | `server/store.ts:524` | now `:526` |
| 585 | `server/index.ts:8051` | now `:8033` |
| 587 | `server/index.ts:8227` | now `:8209` |
| 598 | `server/index.ts:7532` | now `:7514` |
| 608 | `server/routes/tasks.ts:186` | now `:185` |
| 611 | `server/task-record.ts:29` | now `:39` |
| 621 | `server/main-thread.ts:22` | line edited since `3aec210` |
| 626 | `server/message-db.ts:652` | now `:653` |
| 631 | `server/index.ts:10806` | now `:10788` |
| 634 | `server/index.ts:4176` | now `:4171` |
| 636 | `server/index.ts:9562` | now `:9544` |
| 640 | `server/index.ts:10004` | now `:9986` |
| 645 | `server/index.ts:9427` | now `:9409` |
| 658 | `server/store.ts:80` | now `:82` |
| 693 | `server/index.ts:7637` | now `:7619` |
| 711 | `server/routes/bot-messages.ts:799` | now `:802` |
| 739 | `src/components/ChatView.tsx:1024` | now `:1015` |
| 783 | `server/room-turn-timeout.test.ts:42` | now `:98` |
| 783 | `server/room-turn-timeout.test.ts:112` | now `:298` |
| 795 | `server/room-turn-timeout.test.ts:28` | now `:84` |
| 818 | `server/index.ts:7424` | now `:7406` |
| 819 | `server/index.ts:7681` | now `:7663` |
| 820 | `server/index.ts:8397` | now `:8379` |
| 821 | `server/index.ts:6643` | now `:6625` |
| 822 | `server/store.ts:122` | now `:124` |
| 822 | `server/store.ts:1619` | now `:1611` |
| 828 | `server/index.ts:9424` | now `:9406` |
| 836 | `server/index.ts:4956` | now `:4949` |
| 857 | `server/store.ts:122` | now `:124` |
| 864 | `server/index.ts:7683` | now `:7665` |
| 864 | `server/index.ts:7813` | now `:7795` |
| 864 | `server/index.ts:8183` | now `:8165` |
| 864 | `server/index.ts:8239` | now `:8221` |
| 864 | `server/index.ts:8313` | now `:8295` |
| 873 | `server/index.ts:4924` | now `:4917` |
| 880 | `server/routine-recovery.ts:73` | now `:76` |
| 883 | `server/index.ts:15058` | now `:15040` |
| 890 | `server/index.ts:7583` | now `:7565` |
| 890 | `server/index.ts:7658` | now `:7640` |
| 890 | `server/index.ts:7672` | now `:7654` |
| 895 | `server/index.ts:9562` | now `:9544` |
| 904 | `server/index.ts:7469` | now `:7451` |
| 913 | `server/index.ts:10403` | now `:10385` |
| 914 | `server/index.ts:13914` | now `:13896` |
| 922 | `server/index.ts:4176` | now `:4171` |
| 922 | `server/index.ts:4922` | now `:4915` |
| 922 | `server/index.ts:6627` | now `:6609` |
| 926 | `server/index.ts:7466` | now `:7448` |
| 927 | `server/store.ts:122` | now `:124` |
| 927 | `server/store.ts:314` | now `:316` |
| 927 | `server/store.ts:1619` | now `:1611` |
| 952 | `server/user-errors.ts:249` | now `:253` |
| 958 | `server/index.ts:8405` | now `:8387` |
| 958 | `server/index.ts:8497` | now `:8479` |
| 961 | `server/index.ts:10144` | now `:10126` |
| 964 | `server/index.ts:10287` | now `:10269` |

</details>

The script finds a citation in the forms `path:N` and `` `:N` `` after a path
on the same line. It does not find a range end or a citation on the next
line. The readers found the same moves for the lines they checked.
Section 2.5 of `threads.md` reads `5478065c4`. Its citation
`src/components/thread-tab-motion.ts:80` is still correct at that commit and
at `96ff84455`.

### 2.4 Other wrong lines that the readers found

- `memory.md:1178` and `:1609` cite `server/side-jobs.ts:95-102` for the
  `codex exec --ignore-user-config --ephemeral` arguments and for the
  driver-name check. Those lines only define `ONE_OFF_ONLY` and `ownCall`.
  The driver-name check is at `server/side-jobs.ts:144`.
- `newer-config-unavailable.md:151` cites `side-jobs.ts:15-20` for
  `.catch(undefined)`. It is at `server/side-jobs.ts:22`.
- `chat-streaming.md:412-420` lists three steps of the smaller resend. The
  code has four. The fourth step replaces this turn's older tool outputs with
  a marker (`server/drivers/chat-size-limit.ts:128-129`).
- `harness-upgrades.md:1251` says that a summary fork booked the whole
  running total through `claude-cost-history.ts:42-46`. That path goes
  through a base of 0 at `server/drivers/claude-cost-history.ts:91`.
- `threads.md:184` and `:330` name `src/components/SidebarPinnedThreadsPanel.tsx`.
  The file is deleted at `96ff84455`.

## 3. How it works

### 3.1 Who compacts, and when

1. Each engine instance says if it compacts its own session (the flag
   `nativeCompaction`, `server/contracts.ts:304-306`). The host also asks
   `engineCompactionOn`. For Claude Code it is false when
   `DISABLE_AUTO_COMPACT` or `DISABLE_COMPACT` is in the environment
   (`server/host/conversation-compaction.ts:13-16`, `server/index.ts:6963`).
2. When the engine compacts and the person set no `context.compactAt`, the
   server folds only as a backstop. The point is
   `floor(max(limit - 10,000, 0.95 × limit))`. `limit` is the window, or the
   engine's own compaction point when it is lower
   (`server/host/conversation-compaction.ts:20-23`, `:32-33`).
3. For Claude Code the engine's point comes from the CLI flag
   `--autocompact`. The value is clamped to 100,000-1,000,000 tokens. The
   default is 200,000, or 1,000,000 for the 1M model. The variable
   `OMB_CLAUDE_AUTOCOMPACT` set to `off` or `auto` gives no number
   (`server/drivers/claude.ts:183-194`). The flag is sent only if `--help`
   lists it. A CLI that refuses it is remembered (`server/drivers/claude.ts:738-761`).
4. When the engine does not compact, the server folds at a budget. The
   default budget is 0.8 of the window. A `compactAt` below 1 is a share of
   the window, and a value of 1 or more is a token count. The budget is never
   above 0.9 of the window or 0.9 of the engine's point
   (`server/context-budget.ts:21-24`).
5. After a fold, the next fold waits until the context grows 25% over the
   size after the fold (`contextFloor`). It still never passes the 0.9 cap
   (`server/context-budget.ts:27-34`).
6. Only a measured token count starts a fold for an engine that compacts. A
   byte estimate does not (test `server/host/conversation-compaction.test.ts:34-37`).
   For other engines the size is the token count, or bytes ÷ 4 when no count
   exists (`server/context-budget.ts:29`).
7. The measured context is not used after an engine switch, a model switch
   or a rewind. `lastContextModel` is set only after a turn that reported a
   positive count (`server/host/conversation-compaction.ts:95`,
   `server/index.ts:6708-6711`).
8. A meter reading (ACP) never starts a fold (`compactionReading`,
   `server/context-budget.ts:16-18`, used at
   `server/host/conversation-compaction.ts:95` and `server/index.ts:6775`).

### 3.2 The server's fold before a turn

1. The turn setup calls `warmSummaries.beforeTurn`, then
   `compactConversation` (`server/index.ts:7677-7680`).
2. A fold runs only when the previous fold record is applied
   (`server/host/conversation-compaction.ts:86`). A second click at the same
   point does nothing (`:87-88`).
3. The fold keeps the last 2 exchanges. The incoming request is not in the
   folded part (`server/compaction-summary.ts:6-12`, `server/index.ts:7680`).
4. The summary text comes from `side-jobs` (section 3.5). The call has 20
   seconds (`server/compaction-summary.ts:65`).
5. A timeout or a helper error gives an excerpt summary with no model text.
   A Stop throws and writes nothing (`server/compaction-summary.ts:77-79`).
6. The summary is at most 6,000 bytes: up to 2,600 bytes of model text and a
   3,200-byte excerpt (`server/compaction-summary.ts:81`,
   `server/context-rebuild.ts:158`).
7. The record is a `compaction` message. Its append key is
   `<thread>:<last id>:<firstKeptId>`, so a second append of the same fold is
   refused (`server/host/conversation-compaction.ts:140`).
8. The "summarizing" status clears on each exit path. A Stop writes no late
   record (`server/host/conversation-compaction.ts:141-144`, e2e
   `server/context-compaction.e2e.test.ts:186-209`).
9. After a successful send, the server stores `appliedCompactionId`
   (`server/index.ts:8360`). A restart therefore keeps the fold, and the fold
   applies one time (e2e `server/context-compaction.e2e.test.ts:123-166`).

### 3.3 Compact now

1. The person clicks Compact now. The route is `POST /api/bots/:id/compact`
   (`server/routes/bot-messages.ts:495`). It runs only the setup steps and
   sends no turn (`server/index.ts:7682-7692`).
2. The server asks the engine first, through `engineCompact`
   (`server/host/conversation-compaction.ts:121-126`). It first asks the
   resume plan if the next turn will resume this session
   (`server/host/resume-check.ts:40-51`).
3. **Claude Code:** the driver runs `/compact` on a fork of the session. The
   thread moves to the `fork-` session (e2e
   `server/context-compaction.e2e.test.ts:91-121`).
4. **Codex:** the driver sends `thread/compact/start` in place, on the
   process that the last turn left running
   (`server/drivers/codex-compact.ts:47-153`).
   - It never starts a process.
   - It refuses when the login, `config.toml`, the CLI, the config digest,
     the provider or the instance changed since the last turn (`:104-117`).
   - It refuses when the person set `context.compactAt`.
   - The time limit is 120 seconds (`:5`). Stop sends `turn/interrupt` with
     a grace of 750 ms (`:135-140`).
   - After a failure or a stop, the process closes and does not go back to
     the pool (`:143`).
5. When the engine refuses, the server folds (section 3.2).
6. When the engine compacts but the conversation moved on, the result is
   not applied (`server/host/warm-summary-host.ts:155-160`).

### 3.4 Idle summaries and keep-warm

These run only on Claude Code. Keep-warm runs only on subscription logins.

**Warm summary:**

1. After a turn ends, the scheduler looks at the context. It needs at least
   100,000 tokens (`server/warm-summary.ts:16`).
2. It waits 3 minutes after the turn. When the next turn would summarize
   part-way, it waits 10 seconds. When the next turn would summarize at its
   start, it waits 1 second (`server/warm-summary.ts:18-22`).
3. A busy bot retries after 2 minutes. After 50 minutes it gives up, because
   the prompt cache has then expired (`server/warm-summary.ts:24-26`).
4. The driver forks the session and asks it to summarize. The limit is 5
   minutes, and a timeout kills the process tree
   (`server/drivers/claude-warm-summary.ts:15`).
5. If a turn started during the summary, the driver returns
   `{ ok: false, busy: true }` with no usage
   (`server/drivers/claude-warm-summary.ts:139`).
6. The host books the usage, then checks again that the session is the same
   and no turn started (`server/host/warm-summary-host.ts:135-140`).
7. The host moves the resume cursor to the fork, stores the handed state and
   appends a row. These are three separate store calls
   (`server/host/warm-summary-host.ts:142-144`).
8. A turn that needs a summary waits for a running one, at most 3 minutes.
   It does not compact a second time (`server/warm-summary.ts:28`, e2e
   `server/warm-summary.e2e.test.ts:105-120`). Stop ends the wait (e2e
   `:141-155`).

**Keep-warm:**

1. The person turns it on for the app or for one bot. It is off by default
   (`server/config.ts:264-265`, `:586-587`).
2. A ping goes 50 minutes after the last request, inside a window of 180
   minutes by default and 24 hours at most (`server/cache-keepwarm.ts:13-18`).
3. Only a context of at least 50,000 tokens is pinged
   (`server/cache-keepwarm.ts:16`).
4. A ping counts as warm when it writes less than 10% of what it reads
   (`server/cache-keepwarm.ts:20`). The limit of a ping is 120 seconds
   (`server/drivers/claude-keepwarm.ts:27`).
5. A usage-limit refusal ends the window and books nothing (test
   `server/cache-keepwarm.test.ts:114-122`).
6. Keep-warm stops at the spend limit or the usage cap. The warm summary
   stops only at the spend limit (`server/index.ts:5167`, `:5182`).
7. An engine switch or a speaker switch ends the old window and releases its
   hold (`server/cache-keepwarm.ts:175-182`).

The design of keep-warm comes from Cache Tax (MIT). The reference credits it
in its `NOTICE` (line 39) and in the file headers
(`server/cache-keepwarm.ts:1-4`, `server/drivers/claude-keepwarm.ts:3-7`).

**What a ping or a summary costs (v0.1.178).** The Claude CLI reports a
running total for its session. A fork used to book that whole total. Now
`forkUsage` books only the growth over a stored state that matches
(`server/drivers/claude-keepwarm.ts:86-99`). The test shows 0.012 for each
ping and summary, not 11.452 (`server/drivers/claude-warm-summary.test.ts:131-153`).

### 3.5 The helper model for summaries

1. `side-jobs` first tries the bot's own engine. A one-off text call is
   required for the summary job (`ONE_OFF_ONLY`, `server/side-jobs.ts:95-102`).
2. When the conversation's engine has that call, it writes the summary. The
   compaction follows the engine of the conversation, not the bot's default
   (`server/side-jobs.ts:283`).
3. This call is not booked and skips the spend check. The code says that the
   summary "belongs to a turn that already passed the spend limit"
   (`server/side-jobs.ts:291-292`, test `server/side-jobs.test.ts:380-391`).
4. When the engine has no such call, the helper writes it, if the bot allows
   it. `bot.helperModel` must be absent or exactly `true`
   (`server/side-jobs.ts:307`).
5. The helper setting is `helper { instanceId, model }`. A bad entry is
   dropped (`server/side-jobs.ts:18-23`). `OMB_HELPER_INSTANCE` and
   `OMB_HELPER_MODEL` win over the file. An empty instance turns the helper
   off (`:31-38`).
6. A model id that fails `^[A-Za-z0-9][\x21-\x7e]*$` turns off the whole
   helper, because the id goes into a command line (`server/side-jobs.ts:29`).
7. A settings request cannot set the helper (test `server/side-jobs.test.ts:151-156`).
   The server reads the config file again with no restart (e2e
   `server/helper-model.e2e.test.ts:282-303`).
8. Each helper call books one row with the trigger `helper`. A call with no
   token count books `costUsd: null`, which means "unpriced", not "free"
   (`server/side-jobs.ts:161-191`).
9. An error in the helper lookup reads as "no helper". The log has one line
   for each change of state (`server/side-jobs.ts:125-130`, `:237-271`).
10. The helper is never a backup engine for a bot at a usage limit. It is not
    used when policy refuses the bot's own engine (`server/side-jobs.ts:284`).

### 3.6 The context breakdown

1. The composer panel asks `POST /api/bots/:id/context` when it opens in
   Advanced mode, and again when a turn starts or ends
   (`src/components/ComposerContextMenu.tsx:95-141`).
2. The route waits 5 seconds (`CONTEXT_BREAKDOWN_WAIT_MS`,
   `server/routes/bot-messages.ts:171`).
3. It answers `null` when the session is outdated: the thread was rewound,
   or a newer summary exists than the one the session applied. It checks
   before and after the read (`server/routes/bot-messages.ts:513-526`,
   `server/fresh-start.ts:37-42`).
4. Claude Code answers a control request with the detail "summary". This
   makes no token-count call and adds no cost
   (`server/drivers/claude-context-usage.ts:1-3`, `:64`).
5. The reply is used before cost handling, so it never reaches the native
   log (`server/drivers/claude.ts:1397-1398`).
6. When the engine process exits, each pending read ends with `null`
   (`server/drivers/claude.ts:852`, `:872`, `:1765`).
7. The breakdown is never stored. After a restart it is `null` until a turn
   runs, and the UI shows the stored `usage.context`
   (`src/components/ComposerContextMenu.tsx:213`).

**ACP engines.** An ACP usage report is a meter reading. It emits
`input: 0, output: 0` (`server/drivers/acp/core.ts:786`). The driver infers a
compaction when a reading falls below 0.6 of the turn's peak
(`server/drivers/acp/session-reports.ts:10-11`, `:29`). For Hermes, a
provenance reason "compression" or a higher depth counts (`:42-53`).

### 3.7 Room context and the room compaction

1. Each room turn gets the last 30 readable room lines. Narration of settled
   turns is taken out first (`server/host/room-transcript.ts:44-47`,
   `server/admission.ts:23`).
2. With room sessions off (the default), each turn sends the whole window,
   also into a warm session that already holds those lines (e2e
   `server/room-sessions.e2e.test.ts:168-181`). This repeats tokens, not work.
3. The server keeps a context reading for each member, keyed by the engine
   instance that ran it (`server/index.ts:6775`, `:10161`).
4. A turn on the same engine instance drops the readings of the other
   members, because one warm process serves the thread
   (`server/room-context.ts:84-99`).
5. A room "compaction" is a fresh session, not a summary. The next turn
   sends `sessionReset: true` and the 30-line window
   (`server/room-context.ts:101-112`, `server/index.ts:10161-10169`).
6. It happens when the person asks, or at 90% of the window
   (`DEFAULT_ROOM_COMPACT_AT`, `server/room-context.ts:6`). `autoCompact:
   false` turns it off. A `roomCompactAt` of 1 or more is a token count
   (`:9-15`).
7. The member route answers 409 when it has no trusted reading, for example
   for an ACP member or after a restart (`server/routes/channels.ts:656-657`,
   e2e `server/acp-context-reports.e2e.test.ts:122`).
8. The text of each line is defended against forged notes. A leading "[" of a
   provenance note is defused, and webhook lines are quoted as JSON
   (`server/host/room-transcript.ts:60-67`).

### 3.8 Room sessions

1. They are on with `context.roomSessions`, or `OMB_ROOM_SESSIONS` set to 1
   or 0 (`server/room-context-settings.ts:3-19`).
2. Only Claude Code qualifies (`ROOM_SESSION_ENGINES`,
   `server/host/room-sessions.ts:12`). The turn also needs `strictResume`,
   the hooks channel and a turn that is not guest-confined (`:278-284`).
3. The stated invariant: each window line is in the text sent, or the same
   session saw it in the same form. "Any doubt sends the whole window"
   (`server/host/room-sessions.ts:1`).
4. A member gets a delta turn only when all of these are true
   (`server/host/room-sessions.ts:225-258`):
   - it was the last speaker on that engine instance in that thread.
   - it settled within the idle time (10 minutes by default).
   - its config hash did not change.
   - its context is below 80% of the engine's compaction point
     (`NEAR_COMPACTION`, `:19`).
5. A delta turn resumes by session id. It gets the unseen lines under one
   note, and the whole window as `recoveryText` (`server/host/room-sessions.ts:305-318`).
6. Otherwise the turn is a `start` with the whole window.
7. A compaction makes the next turn a `start`. The server sees it through the
   `PreCompact` hook (`server/index.ts:5396`) or a token reading that falls
   (`server/host/room-sessions.ts:215-223`).
8. An error in dispatch falls back to the legacy mode with a warning
   (`server/host/room-sessions.ts:367-378`).
9. **Known gap (stated in the code):** keep-warm can hold a process past
   the idle time. After a `start`, that process goes on in the recorded
   session, "so a line can be sent twice" (`server/host/room-sessions.ts:14`). The randomized
   test accepts this (`server/host/room-sessions.test.ts:1821-1824`).

### 3.9 A rebuilt session

1. Before a turn, `resumePlan` decides between a resume and a rebuild
   (`server/resume-plan.ts:18-37`):
   - an unseen teammate result forces a rebuild (`:27`).
   - a Codex thread that holds an effort level, when this turn sends none,
     rebuilds (`:28-32`).
   - a changed config hash rebuilds only with an outside update.
2. The config hash covers the bot identity, its section, the rules for all
   bots and the soul. For Codex only it also covers model and effort
   (`server/host/resume-check.ts:33-38`).
3. A rebuild replays at most 24,000 bytes and 40 messages
   (`server/context-rebuild.ts:157`, `:194`). It starts from the newest
   fold record.
4. A budget below 1,024 bytes throws a plain `Error`, not a typed refusal
   (`server/context-rebuild.ts:195-197`). The config schema has the same
   floor (`server/replay-settings.ts:5`).
5. The preamble says why the session is new. A switch gives "You are joining
   this conversation mid-thread". A rewind gives "The user rewound this
   conversation" (`server/turn-context.ts:31-34`).
6. **Tool history.** It is off by default. `OMB_REPLAY_TOOL_HISTORY` set to 1
   or 0 overrides the setting. No UI sets it (`server/replay-settings.ts:6-18`).
   - When on, at most 20 lines of 120 characters go between the kept
     messages. They use only budget that is left
     (`server/context-rebuild.ts:24-25`, `:114-146`).
   - Each line reads "Assistant: [ran: Tool: target — ok|failed]". It never
     carries the result (e2e `server/replay-tool-history.e2e.test.ts:74-79`).
   - Secrets are redacted and fake notes defused before the line is cut.
     A URL keeps only its scheme and host (`server/context-rebuild.ts:37-49`, `:69-71`).
   - Engines that replay natively get a text-only transcript with no tool
     lines (`server/context-rebuild.ts:185-189`).
   - With tool history off, a switched-in engine does not know which commands
     already ran.
7. **Delta context.** For engines with `strictResume`, the server records
   which context messages the session holds (`server/index.ts:7754`).
   - A resumed session gets the unseen ones in one block. Teammate results
     and the person's own lines always go. Other messages stop at 12 or a
     soft 4,000 bytes (`server/delta-context.ts:50-52`, `:89-121`).
   - More than 200 uncredited messages reset the record, and the turn
     replays (`server/delta-context.ts:52`, `:146`).
   - Context is credited at the provider's first acting event. The turn's
     own replies are credited at `turn.completed`
     (`server/delta-context.ts:299-307`).
   - A steered message is never credited. The next turn offers it again,
     marked "you may already have it" (`server/delta-context.ts:104`, `:260-265`).
   - A new session is credited only with what its rebuild carried. A result
     outside the budget comes later, one time (e2e
     `server/delta-context.e2e.test.ts:864-919`).
8. **Resume recovery.** A failed resume may rebuild in a new session only
   when the engine never accepted the prompt (`before-accept`). An unknown
   case counts as accepted (`server/resume-recovery.ts:6`, `:16-24`).
   - Claude Code: rejected means the CLI exited before `init`
     (`server/drivers/claude.ts:1718-1740`).
   - Codex: it rebuilds one time, only for a missing or archived thread or a
     provider mismatch (`server/drivers/codex.ts:1281-1293`).
   - ACP: the driver sets `before-accept` with no check
     (`server/drivers/acp/core.ts:1177`).

### 3.10 The engine switch with a replay

**A switch by the person.** The thread gets a new instance or model. The new
engine has no cursor, so the next turn rebuilds with the "joining" preamble.
A switch A → B → A sends the history each time, also to A, which still has a
cursor (`server/branching.test.ts:229-278`). Three messages make three
prompts, so no turn runs twice. The reference's roadmap calls this "an
unadvertised tax": "every switch rebuilds context from scratch"
(`docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md:94-98`).

**Path A: the turn is refused at its start.** This is the usual hand-over.

1. Only `TurnNotStartedError` allows it. Only the driver can prove that the
   prompt was not accepted (`server/index.ts:8381-8383`).
2. The server weighs the backups (`limitTakeover.weighBackups` or
   `startupBackups`, `server/index.ts:8433-8445`).
3. It switches the thread with `rewound: true`, writes "recovery" rows and
   calls `startTurn` again with the same user message
   (`server/index.ts:8456-8470`).
4. The new engine gets the rewind preamble, which does not say that this is
   a hand-over (`server/turn-context.ts:31-32`).

**Path B: the turn ran and then failed on a limit.** `quotaSwitch.turnFailed`
handles it (`server/quota-switch.ts:214-272`, called at `server/index.ts:6662`).

1. Only the person's own direct request moves (`server/quota-switch.ts:236-239`).
2. The backup must not be known as limited (`:142`). Another sign-in of the
   same subscription is not a backup, unless it bills for each use
   (`server/limit-failover.ts:17-30`).
3. The probe of the backup has 30 seconds (`server/quota-switch.ts:122-129`).
4. The thread switches, then a notice row is written, then the message is
   sent again. These are three separate writes (`server/quota-switch.ts:182-202`).
5. In five cases the message is not sent again: part of it already ran, a
   card waits, the request still runs, the thread is busy, or a teammate's
   question waits
   (`server/quota-switch.ts:189-196`).
6. `OMB_QUOTA_SWITCH=0` turns this path off (`server/quota-switch.ts:85-87`).
7. The current code raises no new quota card. It only answers a card that an
   earlier version left (test `server/quota-switch.test.ts:89`).

**Room turns** use `roomLimits.atStart` (`server/index.ts:9522-9523`).
**Bot-to-bot turns** use `peer-limit-resend` (`server/index.ts:5002`).
**The way back** is `limitFailovers.switchBack` (`server/index.ts:8646-8649`).

**The backup engine: how it is chosen, held and given back.**

1. `weighBackups` uses only the backups that the person chose, in their
   order (`server/host/limit-takeover.ts:198-220`). For a limit on one model
   or its credits, it tries the default model of the same engine first
   (`:217`).
2. A backup must be ready, not limited, not signed out, not on the same
   plan, and must have the tools and the approval level
   (`server/host/limit-takeover.ts:175-191`). The first usable backup wins
   (`:343`).
3. Another sign-in to the same subscription never takes a limited thread,
   because rotation of accounts "breaks its terms". A key that bills each
   use may take it (`server/limit-failover.ts:17-25`). For a sign-out,
   another sign-in may take it (`server/host/limit-takeover.ts:184`).
4. A model hold lasts until the named reset, or 1 hour when no reset is
   named. It is never longer than 6 hours (`server/host/limit-takeover.ts:28`,
   `:144-148`). A signed-out engine is tried again after 1 hour, unless its
   status still says signed out (`:150-156`).
5. With no backup, or with `OMB_QUOTA_SWITCH=0`, the turn runs on its own
   engine (`server/host/limit-takeover.ts:281-286`).
6. **The way back** runs only at the start of the next turn, with no timer
   (`server/index.ts:7466`). `restore` waits for `resetsAt`, or 1 hour when
   no reset is known (`server/limit-failover.ts:72`, `:130`). A thread that
   someone moved by hand is forgotten (`:128`). A second hand-over keeps the
   first engine as the one to go back to (`:112-114`).
7. The failover rows and the holds are saved in JSON files. The list keeps
   the last 500 rows (`server/limit-failover.ts:117`). A failed write is only
   logged (`:155-157`, `server/host/limit-takeover.ts:130-132`).
8. In each path, the thread's model is written first and the failover row
   second, in another file (`server/quota-switch.ts:182`, `:186`,
   `server/index.ts:8459-8462`, `server/host/peer-limit-resend.ts:191`,
   `:195`). A crash between them leaves the thread on the backup for good.
9. A bot-to-bot turn is sent again only when nothing ran, and only one time
   (`server/host/peer-limit-resend.ts:118`, `:145-149`, `:171`). Its pending
   resends are in memory and are lost at a restart (`:90-96`).
10. `stillSignedOut` has no time limit. It blocks the prestart of an engine
    and the way back until a sign-in or a turn works
    (`server/host/limit-takeover.ts:309`, `server/index.ts:1656`).
11. Rooms record no failover row. They try the member's own engine again at
    each turn (`server/host/limit-takeover.ts:345-346`).

**The releases of changelog section 6, matched to today's code:**

| Release | Line | Code at `96ff84455` |
|---|---|---|
| v0.1.111 | `changelog.md:339` | `server/host/limit-takeover.ts:198-220`, `server/limit-failover.ts:111-137` |
| v0.1.142 | `changelog.md:385`, "any backup engine that has its tools" | `server/host/limit-takeover.ts:188-189`, `server/host/peer-limit-resend.ts:185-187` |
| v0.1.166 | `changelog.md:403`, "only to a backup you chose" | `server/host/limit-takeover.ts:193-195`, `:216-218` |
| v0.1.175 | `changelog.md:408`, "stops at the limit" | `server/host/limit-takeover.ts:284-285` |
| v0.1.178 | `changelog.md:411`, the sign-in hiccup | In the drivers: `server/drivers/antigravity.ts:117-129`, `server/drivers/acp/driver-hooks.ts:122-131`. The related check is `signedOutStop` (`server/host/limit-takeover.ts:91-93`) |

### 3.11 A chat request that is too large

This is in the driver for chat APIs. Nothing is stored.

1. A 413, a "too large" body, `context_length_exceeded` or llama.cpp's
   `exceed_context_size_error` counts as a size refusal
   (`server/drivers/chat-size-limit.ts:7-11`, `:23-30`).
2. A 429 "Request too large … tokens per min" also counts (test
   `server/drivers/chat-size-limit.test.ts:35`). That request is larger than
   the limit for one minute, so it can never pass as it is.
3. The driver builds a smaller request in four steps, in this order
   (`server/drivers/chat-size-limit.ts:123-129`):
   1. remove images.
   2. cut this turn's tool outputs over 4,000 bytes to 1,000.
   3. remove earlier messages, the oldest first.
   4. replace this turn's older tool outputs with an "already ran: do not
      repeat it" marker.
4. The target is half the refused size, or 0.8 of llama.cpp's own count
   when it gives one (`server/drivers/chat-size-limit.ts:13`).
5. It sends again one time, or two times when the service gave its window
   size (`server/drivers/chat-size-limit.ts:50`).

### 3.12 A restart or a crash

On disk: the resume cursors, the handed state, `appliedCompactionId`,
`contextFloor` and `lastContextModel` (`server/store.ts:82-93`), the
prompt-split receipts with mode 0600 (`server/drivers/prompt-split.ts:58-83`)
and the Claude cost history (`server/drivers/claude.ts:1381-1386`).

In memory only, lost at a restart:

- the warm-summary scheduler and the keep-warm windows
  (`server/warm-summary.ts:92-96`, `server/cache-keepwarm.ts:65-67`).
- the parked fork contracts, kept 60 minutes
  (`server/drivers/claude-warm-summary.ts:17`, `:89`).
- the room context tracker and the room-session records
  (`server/room-context.ts:33-34`, `server/host/room-sessions.ts:124-127`).
- the pending delta hand-off (`server/delta-context.ts:213`).
- the `limited`, `building` and `answering` sets of the quota switch
  (`server/quota-switch.ts:107-111`).

What happens next:

1. Room sessions fall back to a `start`, which is safe. Compact now in a room
   answers 409 until the next reading.
2. Teammate turns that SIGTERM or SIGKILL cut run again one time, in place,
   with "this turn continues it". A second restart ends the work as `failed`
   (e2e `server/delta-context.e2e.test.ts:650-822`).
3. A turn with an unknown outcome is not sent again. The person gets a
   "Review the result" row (e2e `server/delta-context.e2e.test.ts:1095-1122`).
4. The thread `usage` is saved late (`server/store.ts:1838`). A crash just
   after a turn can lose its usage and its context reading.
5. Start fresh writes the thread record and then the divider in two calls
   (`server/fresh-start.ts:22`, `:29`). A crash between them leaves `rewound`
   set with no divider.

## 4. The data

**Thread record (`TaskRecord`, `server/store.ts:82-93`), fields of this
feature.** None of them goes to the client (`TaskWirePrivateKeys`, `:95`).

| Field | Type | Meaning |
|---|---|---|
| `resumeCursors` | map: instance id → session | The session to resume, for each engine instance |
| `lastInstanceId` | string | The instance of the last turn |
| `handedMessages` | map: instance id → `HandedState` | What each session holds |
| `appliedCompactionId` | string | The newest fold that the session applied |
| `contextFloor` | number | The size after the last fold, for the 25% rule |
| `lastContextModel` | string | The model of the last measured reading |

**`HandedState`** (`server/delta-context.ts:37-48`): `session`, `config`
(hash), `effort` (Codex), `omitted` (the newest message left out of the
starting history), `through` (received up to this message) and `ids` (at most
200).

**Fold record** (`CompactionRecord`, `server/context-rebuild.ts:148-155`):
`firstKeptId` (empty for a full fold), `foldedThroughId`, `summary`,
`tokensBefore`, `by` (`person` or `harness`). A Start fresh divider is the
same message kind with `fresh: true` (`server/fresh-start.ts:31`). An engine
compaction is a `compaction` message with `engineCompaction: true`
(`server/index.ts:6607`).

**Replay entry** (`server/context-rebuild.ts:10-15`): `id`, `role` (`user` or
`assistant`), `text`, `priorSummary`.

**Context breakdown** (`shared/context-breakdown.ts:3-20`): `tokens`,
`window`, `categories` (each with `id`, `kind` of `used`, `buffer` or `free`,
and `tokens`), `messages` (tool calls, tool results, attachments, assistant,
user), `autoCompact`, `autoCompactAt`.

**Room member reading** (`server/room-context.ts:8`): `tokens`, `window`,
`compactRequested`.

**Driver contract** (`server/contracts.ts`):

- flags `strictResume`, `nativeCompaction`, `contextReading: "meter"`
  (`:303-312`).
- `cacheKeepWarm { ping, hold, compact }` (`:346-350`).
- `compactSession` (`:356`) and `contextBreakdown` (`:374`).
- results `CacheWarmPingResult`, `IdleCompactResult` and `EngineCompactResult`,
  each with the call's own tokens and `costUsd` (`:377-391`).

**Settings** (`server/config.ts:377-379`, `:467`): `context { rebuildBytes,
compactAt, autoCompact, roomCompactAt, roomSessions, replayToolHistory }`,
`cacheKeepWarm { enabled, windowMinutes }` (`:264-265`), and `helper
{ instanceId, model }` (`server/side-jobs.ts:18-23`).

**Numbers in one place:**

| What | Value | Where |
|---|---|---|
| Default window | 128,000 tokens | `server/context-budget.ts:4` |
| Fold budget | 0.8 of the window, at most 0.9 | `server/context-budget.ts:21-24` |
| Regrowth after a fold | 25% | `server/context-budget.ts:32` |
| Backstop | `max(limit − 10,000, 0.95 × limit)` | `server/host/conversation-compaction.ts:22` |
| Summary limit | 20 s, 6,000 bytes | `server/compaction-summary.ts:65`, `server/context-rebuild.ts:158` |
| Replay budget | 24,000 bytes, 40 messages | `server/context-rebuild.ts:157`, `:194` |
| Codex compaction | 120 s | `server/drivers/codex-compact.ts:5` |
| Warm summary | ≥ 100,000 tokens, 3 min idle, 5 min limit | `server/warm-summary.ts:16-18`, `server/drivers/claude-warm-summary.ts:15` |
| Keep-warm | ping at 50 min, window 180 min, ≥ 50,000 tokens | `server/cache-keepwarm.ts:14-17` |
| Breakdown read | 5 s | `server/routes/bot-messages.ts:171` |
| Room window | 30 lines, compaction at 90% | `server/admission.ts:23`, `server/room-context.ts:6` |
| Room session | 80% of the engine's point, 10 min idle | `server/host/room-sessions.ts:19` |
| Unseen block | 12 messages, 4,000 bytes | `server/delta-context.ts:50-51` |
| ACP compaction | reading < 0.6 of the peak | `server/drivers/acp/session-reports.ts:10-11` |
| Backup probe | 30 s | `server/quota-switch.ts:124` |

## 5. The UI

1. **The context button** in the message box: a ring that fills with the
   share used. Its label is "Context {percent}%". The colour is quiet below
   50%, warning from 50% and danger from 80%
   (`src/components/ComposerContextMenu.tsx:197-230`, `src/lib/context-usage.ts:15-20`).
2. **Its panel** shows a meter and, in Advanced mode, the breakdown rows:
   system prompt, memory files, tools, skills and subagents, tool calls and
   results, messages, other, "Reserved for compacting" and free space
   (`src/lib/context-usage.ts:31-57`).
   - Tool calls and results are moved out of the messages row.
   - A `buffer` row is "Reserved for compacting", not free space.
   - The note "The provider compacts this conversation automatically" shows
     when the engine says so (`src/components/ComposerContextMenu.tsx:155`).
3. **No stale count.** The panel shows no count between a summary and the end
   of the next turn. It drops the count when the person picks another branch
   (`src/components/ComposerContextMenu.tsx:82-118`). A failed request shows
   no error toast (`:129`).
4. **Actions in the panel:** "Compact context" and "Start fresh" for a 1:1
   chat. Both are off while the bot is busy. "Compact context" is also off
   after a compaction until the next reading (`:157-165`).
5. **The header warning** in a 1:1 chat shows at 80% of a known window. It
   hides after a compaction until the next reply (`src/lib/context-warning.ts:4-26`).
   Its text is "Context {tokens} ({percent}% of {window})" with a "Compact
   now" button (`src/components/ContextWarning.tsx:28-46`).
6. **In a room,** each member at 80% or more gets a line and a button. A
   member with a compaction requested shows "Compacts before its next turn."
   (`src/components/ContextWarning.tsx:67-89`). The room header shows a badge
   for each member (`src/components/RoomHeader.tsx:67`, `:108`). The room
   button does not check if that member is busy
   (`src/components/ComposerContextMenu.tsx:186`).
7. **Chips in the transcript** (`src/components/DigestChip.tsx:51-84`):
   - "Fresh start · Messages above this line aren't sent to the bot".
   - "Earlier context summarized", which opens to show the summary.
   - "Earlier context shortened to recent excerpts", with a warning that
     older details may be missing (the model was not available).
   - "Chat condensed into a summary" for the engine's own compaction.
8. **"Start a new chat to save tokens"** shows under the last compaction of
   the branch, only in a 1:1 chat (`src/components/ChatView.tsx:700`,
   `src/lib/transcript-derivations.ts:36`).
9. **Start fresh** is also in the "⋯" menu. It is off while busy, with no
   messages, or when the newest message is already a divider
   (`src/components/ChatMoreMenu.tsx:125-132`).
10. **Notices of a hand-over** are rows in the chat, for example "continuing
    on {name} after hitting the usage limit" (`server/quota-switch.ts:200`).
11. **The docs site** does not describe any of this. `chat-and-teams.mdx` has
    no context section. `model-providers.mdx:291-307` covers only the window
    of Ollama.

## 6. The tests

| Test | What it proves |
|---|---|
| `server/context-compaction.e2e.test.ts` | Compact now on Claude Code moves to the fork (`:91-121`). A fold survives a restart and applies once (`:123-166`). Stop writes no late record (`:186-209`). The off switches of Claude compaction (`:211-232`). Codex books only its own usage (`:392-400`). A switch after a Codex compaction replays the stored thread (`:507-520`) |
| `server/host/conversation-compaction.test.ts` | A byte estimate never starts a backstop fold (`:34-37`). The thresholds |
| `server/compaction-summary.test.ts` | A hung helper books nothing (`:150-186`). The size cap and the excerpt fallback |
| `server/drivers/codex-compact.test.ts` | Time limit and Stop (`:240-337`). Only the growth of usage is booked (`:386-398`) |
| `server/drivers/chat-size-limit.test.ts` | Each body that counts as a size refusal (`:30-40`). The order of the trim steps |
| `server/warm-summary.test.ts`, `.e2e.test.ts` | Scheduling, give-up and retry. A turn waits for a running summary and does not compact again (`:105-120`). Stop ends the wait (`:141-155`). No test covers the 3-minute cap |
| `server/host/warm-summary-host.test.ts` | Booking on a stale result of an in-place compaction (`:436-464`) |
| `server/drivers/claude-warm-summary.test.ts` | A ping and a summary book 0.012, not the session total (`:131-153`) |
| `server/cache-keepwarm.test.ts`, `cache-keepwarm-target.test.ts` | A limit ends the window and books nothing (`:114-122`). A ping is booked once, to its target (`:52-62`) |
| `server/side-jobs.test.ts`, `server/helper-model.e2e.test.ts` | Helper choice, the fail-closed switch (`:525-538`), no settings write (`:151-156`), the unbooked engine summary (`:380-391`), live config reload (e2e `:282-303`) |
| `server/hosted-models-api.test.ts` | A forced switch replays the history once with no resume (`:255-256`) |
| `server/context-breakdown.e2e.test.ts`, `server/drivers/claude-context-usage.test.ts` | The breakdown route and the mapping. The read is not in the native log (`server/drivers/claude.test.ts:1259-1275`) |
| `server/acp-context-reports.e2e.test.ts` | A meter reading shows but never starts a fold, and the room route answers 409 (`:88-123`) |
| `src/components/ComposerContextMenu.test.ts` | Rows and order, no count after a summary, branch switch, an old answer never overwrites a new one, room meters |
| `src/lib/context-warning.test.ts`, `DigestChip.test.ts`, `CompactionChip.dom.test.ts` | The 80% rule, the chips, and that summary text is escaped |
| `server/room-context.test.ts`, `.e2e.test.ts` | The 90% reset, displacement, the token-count form of `roomCompactAt` |
| `server/host/room-sessions.test.ts`, `server/room-sessions.e2e.test.ts` | The delta rules, the fallbacks, and a randomized model of the invariant that accepts the keep-warm gap (`:1821-1824`) |
| `server/context-rebuild.test.ts`, `server/replay-settings.test.ts` | The budget, the tool lines, the redaction, the floor of 1,024 (`:18-24`) |
| `server/delta-context.test.ts`, `.e2e.test.ts` | Credit rules. Results reach a switched-in engine once (`:585-611`, `:964-983`, `:1224-1240`). Restart reruns (`:650-822`). A rebuild credits only what it carried (`:864-919`) |
| `server/replay-tool-history.e2e.test.ts` | The form of a tool line, and that it reaches a switched-in engine (`:74-103`) |
| `server/resume-recovery.test.ts` | Rebuild only before the prompt was accepted (`:19-75`) |
| `server/quota-switch.test.ts`, `.e2e.test.ts` | No resend after part ran (`:280-292`), while held (`:459-470`, `:728-849`), a card answer only by "answer" (`:873-886`). The e2e test covers path A only |
| `server/branching.test.ts` | A → B → A replays each way, and no turn runs twice (`:229-278`) |
| `server/respond-replay.e2e.test.ts`, `server/chat-replay-kinds.test.ts` | One decision row for a replayed answer (`:117-121`). The chat engine gets the history once (`:37-51`) |

## 7. Ours compared

Our code has no context feature yet. `crates/bot-core/src/lib.rs` is a stub.
`crates/bot-protocol` has two message roles (decision D18) and a turn with
`turn.completed` as the last event (decision D20). It has no usage field and
no context reading.

| Part | The reference | Ours: crate, module, step |
|---|---|---|
| Thread session state | `server/store.ts:82-93` | `bot-core`, the store of step 8. The fields are not planned |
| Who compacts | `nativeCompaction` flag, `server/host/conversation-compaction.ts` | A driver capability in `bot-engine` (D22). The fold in `bot-core` |
| Fold record and rebuild | `server/context-rebuild.ts`, `server/compaction-summary.ts` | `bot-core`. A typed refusal for a bad budget, not a plain error |
| Summary text | `server/side-jobs.ts` | `bot-core` asks a `TurnRunner`-like port. The host gives the engine |
| Idle summary and keep-warm | `server/warm-summary.ts`, `server/cache-keepwarm.ts`, Claude driver | `bot-engine` (Claude driver) and a scheduler in `bot-core`. Later |
| Breakdown | `shared/context-breakdown.ts`, `server/drivers/claude-context-usage.ts` | A wire type in `bot-protocol`, a driver call in `bot-engine`, the panel in `bot-desktop` |
| Room context and room sessions | `server/host/room-transcript.ts`, `server/host/room-sessions.ts` | `bot-core`, after rooms exist. Later |
| Delta context | `server/delta-context.ts` | `bot-core`, with the assignment runtime of step 13 |
| Engine switch, backup engine | `server/index.ts:8432-8470`, `server/quota-switch.ts`, `server/host/limit-takeover.ts` | `bot-core`. A capability flag says "not started", never an error text |
| Chat size limit | `server/drivers/chat-size-limit.ts` | `bot-engine`, the chat driver of step 5 |

## 8. Where we can be better

1. **Store the hand-over in one transaction.** The reference does three
   separate writes in path B (`server/quota-switch.ts:182-202`), in the warm
   summary (`server/host/warm-summary-host.ts:142-144`) and in Start fresh
   (`server/fresh-start.ts:22`, `:29`). A crash between them leaves a thread
   on the backup with no resend, or `rewound` with no divider. Our rule says
   that each state change writes its row and its event in one transaction.
2. **One preamble for each reason.** Path A gives the backup the rewind
   preamble (`server/index.ts:8459-8461`, `server/turn-context.ts:31-32`).
   The model reads "the user rewound this conversation" when no rewind
   happened. An enum of reasons (switch, rewind, take-over, outside update)
   makes a wrong text impossible.
3. **Gate by capability, not by driver name.** `engineCompactionOn` checks
   `driverKind !== "claudeAgent"` (`server/index.ts:6963`). `quickModel`
   does the same (`server/side-jobs.ts:144`), and so do room sessions
   (`server/host/room-sessions.ts:12`) and the tool bridge
   (`server/agents-bridge-switch.ts:269-273`). Our architecture rule forbids
   this.
4. **A typed refusal for a bad replay budget.** The reference throws
   `Error("invalid context replay budget")` (`server/context-rebuild.ts:195-197`).
   A config type that cannot hold a value below 1,024 removes the error.
5. **Book every model call.** A summary that the bot's own engine writes is
   not booked and skips the spend check (`server/side-jobs.ts:291-292`).
   A summary dropped as `busy` books nothing
   (`server/drivers/claude-warm-summary.ts:139`), but a summary that the
   host drops is booked (`server/host/warm-summary-host.ts:136-140`). We book
   each call where it returns, with its own tokens, before any check.
6. **Usage as growth, with a known base.** When no stored state matches,
   the base is 0 and the whole session total is booked
   (`server/drivers/claude-cost-history.ts:77-91`). The history file is
   written with no durable save, and its errors are ignored (`:36-37`). Our
   usage type keeps the base in the store and refuses a negative growth.
7. **Read the Codex usage base after the lease settles.** The base is read at
   `server/drivers/codex-compact.ts:79`, before `await lease.settled` at
   `:103`. A late report of the last turn in that gap would go to the
   compaction. This is a risk, not a proven bug.
8. **Tool history on by default, with results cut.** With it off, an engine
   that takes over does not know what ran, and can run a command again
   (`server/replay-settings.ts:6-7`). The lines are already safe: secrets
   are redacted and URLs are cut (`server/context-rebuild.ts:37-71`).
9. **A time limit on each wait.** The scheduler puts no limit on `deps.run`
   (`server/warm-summary.ts:143`). `await settled` in path B has none
   (`server/quota-switch.ts:247`). A bad `<product>_ACP_PROMPT_IDLE_TIMEOUT_MS`
   can make the idle limit 0 (`server/drivers/acp/quiet-status.ts:22`). Our
   wait type cannot exist without a limit and a reason (changelog section 7).
10. **Close the room keep-warm gap.** The room-session record expires at the
    plain idle time (`server/host/room-sessions.ts:233`), but keep-warm
    holds the process longer (`server/room-context.ts:123-125`). The code
    states the gap (`:14`). One owner for "the session is still live" fixes
    both.
11. **Persist what a restart needs.** The room context tracker and the
    room-session records are in memory (`server/room-context.ts:33-34`,
    `server/host/room-sessions.ts:124-127`). After a restart, Compact now in
    a room answers 409. The thread `usage` is saved late
    (`server/store.ts:1838`).
12. **A switch that keeps the old session.** A → B → A rebuilds A from
    scratch (`server/branching.test.ts:229-278`). With handed state for each
    instance, A can resume and get only the unseen messages.
13. **Classify ACP resume failures.** The ACP driver sets `before-accept`
    with no check (`server/drivers/acp/core.ts:1177`). A rebuild after an
    accepted prompt sends the work two times.
14. **Remove dead code.** `RoomContextTracker.forget` and
    `RoomSessions.forget` have no caller (`server/room-context.ts:114`,
    `server/host/room-sessions.ts:321`).
15. **Document the UI.** The docs site has no page for the context button,
    the warning, the chips or Start fresh.

**Problems of [`changelog.md`](../changelog.md) section 5 that the reference
has here:**

| Problem | In this feature |
|---|---|
| Usage and cost numbers corrected | Fixed in v0.1.178 for forks (`server/drivers/claude-keepwarm.ts:86-99`). Still open: no base gives the whole total (`claude-cost-history.ts:91`), an engine summary is not booked (`side-jobs.ts:291-292`), a busy summary is not booked (`claude-warm-summary.ts:139`), and the Codex base risk (`codex-compact.ts:79`) |
| A turn or a wait that does not end | Bounded: summary 20 s, warm summary 5 min, turn wait 3 min, Codex 120 s, breakdown 5 s, probe 30 s. Not bounded: `deps.run` in the scheduler and `await settled` in path B |
| State lost at a restart or a crash | Folds and cursors survive. The room trackers, the keep-warm windows, the delta hand-off and the quota sets do not. Three multi-write sequences have no transaction |
| The same work done two times | Guarded: rebuild only before accept, `nothingRan`, the fold append key. Open: a steered message is offered again, the room keep-warm gap, ACP `before-accept` |
| A bot at a usage limit and the backup engine | Two paths (A and B), a room path and a bot-to-bot path. See section 3.10. A sign-in hiccup "no longer counts as signed out or hands the chat to the backup engine" (v0.1.178) |

**Note of batch 12 (2026-11-27, reference `42f86aefd`).** `server/side-jobs.ts`
has 331 lines now. This file cites a copy with 315 lines, so some of its
lines of that file moved: the summary on the bot's own engine is at
`:307-308`, the switch `helperModel` at `:323`, the list of jobs at `:44`,
and `quickModel` at `:148`. The full record of the helper model is
[`helper-bot.md`](helper-bot.md).

## 9. Not verified

- The time limit and the usage booking of the Claude `/compact` on a fork.
- Whether a helper process is killed after the 20-second timeout.
- Whether `usageTrace.settle` can give a summary row the trace of the turn
  that just ended (`server/index.ts:1342`, `server/usage-trace/recorder.ts:371-399`).
- Whether a strictResume thread with a cursor and no handed record can occur
  after a lost save (`server/resume-plan.ts:25-26`).
- The Claude CLI version that turns on `strictResume`
  (`server/drivers/claude.ts:1954-1957`). A fixture uses 2.1.270.
- Whether path A also reaches `turnFailed`, and whether path B adds a second
  user row with the same text.
- Whether a switch back to A sends the history into A's old session, so that
  A holds turn 1 two times.
- The vendor facts about Claude Code's compaction point (about 33,000 tokens
  under the window) and Codex at 90%. The tests use fakes.
- Whether discarded fork sessions are removed from disk.
- `model-providers.mdx` lines 1-279 were searched, not read.
- `server/branching.test.ts` lines 114-224 were not read in this task.
  `harness-upgrades.md` covers them.
- No reader ran the tests.
- The drift script does not find a range end, a citation on the next line,
  or a path under the reference's `docs/` and `scripts/` folders.
