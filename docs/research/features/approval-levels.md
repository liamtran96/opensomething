# Approval levels, the permission request path, the safety floor and the decision log

This file is for the feature row "The approval levels (ask, auto-accept
edits, approve for me, custom, full access), the approval level of one
thread, the permission request path, the safety floor and the decision log"
of [`../reference-features.md`](../reference-features.md), part 10. It is for
step 10 of [`../../plan/README.md`](../../plan/README.md).

- **Reference commit:** `ed8cb7278`. Each line number in this file is at
  that commit, unless the text names another commit.
- **Method:** ten subagents read ten groups of files. Each subagent read its
  files completely and listed them (section 2). The main session checked the
  key claims against the code (section 2, "Checks of the main session").
- **What this file adds:** [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md)
  covers the approvals inside the tool loop of the chat API driver, the
  panel above the message box and the transcript line of a card (its
  sections 3.9 and 5.2). [`driver-contract.md`](driver-contract.md) covers
  `respondToRequest` in the driver contract (its section 3.6). This file does
  not repeat them. It adds:
  - the five levels, their data, their defaults and how a level moves
    between bots and threads
  - how each engine driver maps a level to the setting of its engine
  - the permission request path of the CLI engines (the permission proxy and
    its broker) and the central handler on the server
  - the safety floor in full (its never-list and where it applies)
  - the decision log in full
  - the command allowlist, the outbound hold and the desktop grant of Full
    access
  - question cards and the `ask_user` tool
  - the level picker in all five places of the UI
  - the problems of the changelog in this feature.

## 1. In short

A bot can act: it runs commands, edits files and calls tools. The
**approval level** of a conversation says which actions the bot can do
without a question to the person. When an action needs the person, the
engine sends a **permission request**, the server shows an **approval card**,
and the answer of the person goes back to the engine.

The terms, one time each:

- **Approval level:** one of five values. In the code it is
  `approvalMode`:
  - `ask` ("Ask for approval"): the engine asks before commands and file
    changes.
  - `edits` ("Auto-accept edits"): file edits run, other actions can ask.
  - `auto` ("Approve for me"): the **native reviewer** of the engine decides
    (see below). The server itself allows only web search at this level.
  - `full` ("Full access"): each action runs with no question. This is the
    default.
  - `custom` ("Custom (config.toml)"): the permissions of the Codex config
    file of the person. Only the Codex engine offers it.
- **Native reviewer:** a model inside the engine (for example Codex
  `auto_review` or Claude `--permission-mode auto`) that approves routine
  actions. The reference project does not run a reviewer of its own now. It
  had one and removed it (section 3.13).
- **Thread:** one conversation of a bot. A thread can have its own level.
  A thread with no level follows the level of its bot.
- **Permission request:** an engine asks "can I do this action?". On the
  server it is the event `request.opened`, and the answer is the event
  `request.resolved`.
- **Question:** a request that asks the person for words, not for a yes or
  no. The bot uses the `ask_user` tool for it. No level answers a question
  for the person, with one exception (section 3.11).
- **Card:** a chat message of kind `options`. It holds the request and its
  state. The window shows it as the approval box.
- **Permission proxy and broker:** for the Claude CLI, a small MCP server
  (`server/permission-proxy.ts`) takes each permission prompt of the CLI and
  sends it over a local socket to a **broker** inside the driver. The broker
  turns it into `request.opened`.
- **Grant:** a saved permission that lets the server allow a request with no
  card. There are three kinds:
  - a **saved command** (the **command allowlist**): one exact command, for
    one bot, one engine instance and one folder
  - a **remembered tool**: one exact MCP tool of one server config
  - a **session allow** ("Allow for this session"): the engine itself stops
    asking about this action until its session ends.
- **Safety floor:** a fixed never-list of destructive shell commands, for
  example a recursive delete of the root folder. When the floor is on, the
  server never allows such a command automatically. The floor is off by
  default and does nothing on a Windows server.
- **Decision log:** an append-only file of each approval decision: a card
  shown, an automatic allow, an automatic deny, an answer of the person.
- **Chief of Staff (Chief):** a bot that gives work to other bots. Its level
  can flow down to the bots that do the work.
- **Outbound hold:** the card "Send on your behalf?" before a send through a
  connected app (mail, chat, posts, payments).
- **Tool selection:** a separate list of tools that a bot can use at all
  (`toolScope`). It is not the `custom` level.
- **Trusted mode:** the channel of the desktop shell that is the only way to
  raise a bot to `custom`, and one of the ways to raise it to `full`.
- **Unattended:** a turn that no person started, for example a webhook run.

The main facts:

1. The level is the **permission mode of the engine, passed through**. The
   header of `server/auto-approve.ts:1-4` says: "Nothing here decides whether
   an action is safe: each level is the provider's own permission mode passed
   through". The server only adds a small set of grants (section 3.4).
2. Full access is the default for each new bot, thread and engine
   (`packages/phone-protocol/src/approval-mode.ts:75`). A shared company
   workspace makes Ask the default at start (`server/index.ts:750`).
3. The server reads the level **at each decision**, not at the start of the
   turn (`server/host/live-approval.ts:12-16`). But a CLI engine reads its
   level only when its turn starts. So a CLI engine gets a change in the
   middle of a turn at its next turn (section 3.9).
4. A permission request that waits 15 minutes is denied, in each driver. A
   question has no time limit (`server/drivers/claude.ts:448`, `:511`).
5. When the path to the server fails, a permission is denied. The path
   **fails closed** (section 3.6).
6. Which engine offers which level is decided **by the name of the driver**,
   not by a capability flag (`approval-mode.ts:22-26`, `:41-45`). This is
   against our rule in `AGENTS.md`.

## 2. Files read completely

Paths are in the reference project at `ed8cb7278`. The number is the line
count. "Ranges" lists the parts that a subagent read of a file that it did
not read completely.

**Group A, the levels and their data:**
`packages/phone-protocol/src/approval-mode.ts` (112), `tool-scope.ts` (148),
`live-approval.ts` (145), `shared/approval-mode.ts` (1), `tool-scope.ts` (1),
`tool-scope-support.ts` (24), `tool-scope.test.ts` (122), `live-approval.ts`
(1), `live-approval.test.ts` (108), `new-bot-defaults.ts` (38),
`server/new-bot-defaults.ts` (156), `.test.ts` (96), `.e2e.test.ts` (88),
`server/approval-mode.test.ts` (194), `server/runtime/level.ts` (37),
`server/room-turn-level.ts` (22), `.test.ts` (37),
`server/host/delegated-level.ts` (93), `.test.ts` (121), `spawn-level.ts`
(50), `.test.ts` (194), `live-approval.ts` (17), `.test.ts` (26),
`server/auto-approve.ts` (165), `task-record.ts` (47), `chief-level.ts` (37),
`legacy-work-threads.ts` (41), `docs/approval-levels.md` (451),
`docs/tool-selection.md` (133), `docs/verification/full-access.md` (71),
`provider-recovery.md` (129), `tool-selection.md` (201).
Ranges: `server/store.ts` 100-125, 335-380, 510-530, 1335-1350, 1390-1405,
1695-1745, 1990-2015, 2080-2140, `server/index.ts` 750, 3010-3050,
3395-3415, `packages/phone-protocol/src/wire.ts` 150-175, 305-330.

**Group B, the automatic answer and the decision log:**
`server/auto-approve.ts` (165), `auto-approve.test.ts` (221),
`auto-approve-undelivered.test.ts` (24), `decision-log.ts` (275),
`decision-log.test.ts` (202), `decision-log-wiring.test.ts` (314),
`decider/log.ts` (69), `bot-safety-digest.ts` (30),
`host/trust-answers.ts` (64), `routine-unattended-approval.e2e.test.ts` (79),
`safety-floor-gate.ts` (177).
Ranges: `server/index.ts` 6400-6620, `routes/status.ts` 160-240,
`activity.ts` 240-345, `decider/types.ts` 1-130, `decider/index.ts` 276-345,
`bots-text.ts` 30-50, `cli.ts` 455-465, `own-file-reads.ts` 116-121, commit
`725d8f472` through `git show`.

**Group C, the safety floor and guarded sends:**
`server/safety-floor.ts` (724), `safety-floor-gate.ts` (177),
`safety-floor.test.ts` (767), `safety-floor-gate.test.ts` (462),
`safety-floor.e2e.test.ts` (173), `drivers/openai-chat-safety-floor.test.ts`
(237), `drivers/self-answer-safety-floor.test.ts` (292), `outbound-hold.ts`
(119), `outbound-hold.test.ts` (205), `guarded-messages-api.test.ts` (296),
`shared/provider-safety.ts` (7), `docs/verification/safety-floor.md` (141),
`docs/verification/guarded-messages.md` (164),
`server/drivers/permission-command.ts` (134).
Ranges: `server/index.ts` 6438-6560, 14240-14330, `auto-approve.ts` 70-165,
`drivers/chat-tool-approval.ts` 1-80, `drivers/openai-chat.ts` 830-860,
`drivers/acp/core.ts` 585-610, `drivers/codex.ts` 790-805,
`routes/bot-messages.ts` 290-335, `packages/phone-protocol/src/outbound.ts`
1-20, 110-125.

**Group D, the permission request path:**
`server/mcp-gate.ts` (428), `mcp-gate.test.ts` (549), `mcp-gate-config.ts`
(246), `mcp-gate-config.test.ts` (207), `mcp-gate-lifetime.test.ts` (91),
`permission-proxy.ts` (263), `permission-proxy.test.ts` (445),
`drivers/permission-command.ts` (134), `drivers/permission-command.test.ts`
(102), `electron/approval-trusted-mode.cjs` (384),
`electron/approval-trusted-mode.node-test.mjs` (475),
`server/live-approval.e2e.test.ts` (107), `command-allowlist.e2e.test.ts`
(160), `tool-permission-audit.e2e.test.ts` (22),
`docs/verification/command-allowlist.md` (94), `server/command-allowlist.ts`
(151).
Ranges: `server/drivers/claude.ts` 310-352, 405-583, 1085-1100, 1215-1276,
1960-1973, `server/index.ts` 1067-1070, 3040-3110, 3236-3330, 4725-4880,
6430-6600, `routes/bot-messages.ts` 595-700, `routes/bot-settings.ts`
185-240, `store.ts` 156-172, 350-375, `electron/main.mjs` 2735-2756,
`server/procs.ts` 725-735.

**Group E, how each engine driver maps a level:**
`server/drivers/codex-approval-config.ts` (160), `codex-app-approval.ts` (99),
`codex-app-approval.test.ts` (25), `acp/driver-hooks.ts` (122),
`acp/approval-matrix.test.ts` (125), `acp/qwen-approvals.test.ts` (25),
`acp/tool-scope.test.ts` (168), `tool-scope-coverage.test.ts` (18),
`acp/live-reply-matrix.test.ts` (81), `server/harness-capabilities.ts` (60),
`server/runtime/capabilities.ts` (66), `drivers/turn-mcp.ts` (129),
`drivers/codex-mcp-mount.ts` (77), `scripts/verify-codex-sandbox.mjs` (100),
`scripts/verify-opencode-permissions.ts` (113),
`scripts/verify-claude-auth-settings.ts` (84).
Ranges: `drivers/claude.ts` 260-640, 775-800, 920-1300, 1400-1430,
1925-1985, `drivers/codex.ts` 100-135, 395-410, 470-548, 720-890, 940-962,
1165-1185, 1236-1370, 1525-1570, `drivers/acp/core.ts` 1-12, 86-325,
515-720, 855-960, 1210-1255, 1420-1432, 1464-1545, `drivers/pi.ts` 280-300,
405-450, 640-740, 979-995, `acp/qwen.ts` 195-230, `acp/cline.ts` 105-125,
`acp/cursor.ts` 488-505, `acp/grok.ts` 440-560 (a file path only, the name
is not used in our product), `server/contracts.ts` 122-145, 250-330,
440-520, 630-645, `codex-instructions.ts` 1-40, `pi-mcp-extension.ts`
685-700.

**Group F1, the server wiring:**
`server/routes/bot-patch.ts` (772), `routes/thread-models.ts` (51),
`host/live-approval.ts` (17), `request-card.ts` (34).
Ranges: `server/index.ts` 1040-1135, 1240-1250, 2236-2256, 2302-2316,
3014-3056, 3243-3300, 3372-3445, 4236-4248, 4725-4900, 5195-5215,
5340-5380, 6256-6620, 8610-8660, 8740-8755, 9300-9345, 9458-9472,
11755-11795, 11855-11890, 15075-15090, `store.ts` 105-120, 150-175,
340-380, 1128-1170, 1225-1260, 1460-1517, 1985-2130, `routes/bot-messages.ts`
590-820, `routes/tasks.ts` 195-225, 265-330, 365-449, `runtime/store.ts`
45-95, `runtime/types.ts` 60-82, 150-165, 220-232.

**Group F2, the end-to-end tests of the server:**
`server/trust-controls.e2e.test.ts` (741), `card-answerers.e2e.test.ts`
(321), `full-access-default.e2e.test.ts` (112),
`full-access-workflows.e2e.test.ts` (308), `respond-replay.e2e.test.ts`
(129), `steer-unattended.e2e.test.ts` (180), `own-file-reads.e2e.test.ts`
(85), `tool-scope.e2e.test.ts` (190), `chief-level-delegation.e2e.test.ts`
(66), `chief-level-every-hop.e2e.test.ts` (115),
`person-only-answers.e2e.test.ts` (50), `parked-cards.e2e.test.ts` (127),
`testing/approval-clock-hooks.mjs` (30).
Ranges: `server/testing/fake-acp-cli.ts` 1-50, 570-578, 990-1005,
1201-1225, 1795-1905.

**Group G, the approval cards in the UI:**
`src/components/ApprovalCard.tsx` (598), `ApprovalCard.test.ts` (911),
`ApprovalCard.i18n.test.ts` (284), `ApprovalCard.cloud-guest.dom.test.ts`
(50), `ApprovalCard.team-memory.test.ts` (33),
`ApprovalCard.wait-details.test.ts` (54), `PendingApproval.tsx` (373),
`PendingApproval.command-allowlist.test.ts` (183), `thread-approval.tsx`
(60), `OptionsCardRow.tsx` (51), `src/testing/thread-approvals.tsx` (31),
`src/lib/approval-summary.ts` (98), `approval-summary.test.ts` (122),
`approval-request-contract.test.ts` (155), `card-answer.ts` (25),
`card-answer.test.ts` (32), `src/state/card-answer-recovery.test.ts` (155),
`scripts/testing/approval-ui-smoke.cjs` (79).
Ranges: `DESIGN.md` 37-66, 256-276, 308-394, `src/state/store.tsx` 678-700,
1060-1100, 2200-2225, 2415-2520, `Composer.tsx` 150-175, 700-760, 900-915,
`ChatView.tsx` 880-910, `AskCard.tsx` 129-164, `activity-text.ts` 1-50,
`src/locales/en.json` by key.

**Group H, the level picker and the permission settings:**
`src/components/ApprovalModeSelector.tsx` (202), `.test.ts` (131),
`.allowlist.test.ts` (87), `.i18n.test.ts` (39),
`src/lib/approval-mode-options.ts` (83), `.test.ts` (16),
`src/components/bot-settings/PermissionsSection.tsx` (200), `.test.ts` (191),
`ToolSelectionCard.tsx` (100), `WriteCommandCard.tsx` (120), `.test.ts` (21),
`ToolGroupsCard.tsx` (50), `.test.ts` (11), `src/lib/team-bulk-settings.ts`
(163), `.test.ts` (233), `scripts/smoke-approval-modes.cjs` (448),
`scripts/testing/tool-selection-ui.e2e.test.ts` (151),
`src/components/thread-approval.tsx` (60), `ComposerAdvancedTools.tsx` (42),
`TeamSettingsDialog.tsx` (244).
Ranges: `src/state/store.tsx` 228-400, 745-765, 1335-1375, 1520-1560,
1740-1760, 1860-1990, 2040-2200, 2640-2710, 2825-2845, `Composer.tsx`
485-500, 770-812, 915-928, `ComposerPlusMenu.tsx` 40-200, `NewBotDialog.tsx`
100-170, 270-285, `Sidebar.tsx` 495-513, 628-640, `bot-panel/SettingsPage.tsx`
45-85, 150-175, `CommandAllowlistDialog.tsx` 1-135, `DESIGN.md` 38-62,
360-372.

**Group I, question cards and `ask_user`:**
`server/host/ask-cards.ts` (335), `ask-cards.test.ts` (472),
`question-routing.ts` (202), `server/question-cards.e2e.test.ts` (229),
`question-routing.e2e.test.ts` (283), `src/components/AskCard.tsx` (363),
`AskCard.test.ts` (171), `QuestionCard.tsx` (301), `QuestionCard.test.ts`
(227), `QuestionCard.answer.test.ts` (162), `src/lib/question-card.ts` (5),
`server/permission-proxy.ts` (263),
`packages/phone-protocol/src/ask-question.ts` (400),
`server/request-card.ts` (34), `server/runtime/questions.ts` (33).
Ranges: `drivers/claude.ts` 441-560, 1080-1100, 1218-1290, `index.ts`
6405-6625, 7225-7275, `person-replies.ts` 100-137, `routes/bot-messages.ts`
760-810, `drivers/openai-chat.ts` 805-835, `drivers/chat-tool-approval.ts`
70-95.

**Checks of the main session.** The main session read these lines again and
found them as the subagents said:

- `server/auto-approve.ts:1-4`, `:32-61`, `:94-123` (the header, the
  delegation rule and the verdict).
- `approval-mode.ts:5`, `:20-26`, `:41-45`, `:75-112` (the levels, support
  by driver name, the default, the parse).
- `server/store.ts:351-354`, `:521-524` (an unknown stored level is deleted
  at load).
- `safety-floor-gate.ts:14-39`, `:98-100` (off by default, nothing on
  Windows, the hold).
- `drivers/claude.ts:448`, `:474-496`, `:511` (15 minutes, a late ask, a
  duplicate id, no limit for a question).
- `index.ts:6309-6316` (the `request.opened` broadcast without the command),
  `:9463-9471` (the sweep at start), `:4741-4818` (`answerRequest`).
- `routes/bot-messages.ts:660-669` (HTTP 200 for `unavailable`).
- `host/question-routing.ts:63-69` (`notAsked`).
- `routes/bot-patch.ts:503-506` (the error text without `edits`).
- `contracts.ts:132-136`, `drivers/claude.ts:953-957`,
  `codex-approval-config.ts:58-85`, `acp/core.ts:594` (the driver mapping).
- `routes/bot-patch.ts:536-580`, `trust-controls.e2e.test.ts:108-140`,
  `full-access-workflows.e2e.test.ts:128-134` (Full over HTTP, section
  3.10).
- `host/ask-cards.ts:276-289` (how a question card closes).

**Changes since the commits of the earlier research.** The subagents ran
`git diff 3aec210 ed8cb7278` and `git diff d6660e2d7 ed8cb7278` on each file
that an earlier research file cites:

1. **A change in behaviour:** `server/drivers/permission-command.ts` went from
   83 to 134 lines in commit `343c745d8` (2026-11-23). The ACP path now reads
   both `command` and `CommandLine`, and both must clear the safety floor.
   Before, a `CommandLine` key hid a command from the floor. It also adds
   `acpAnswersAlone` and `acpFileEditWithin`. Its test went from 58 to 102
   lines.
2. **A change in behaviour:** `acp/core.ts:594` now permits an answer with
   no card through the new hook `allowsAlone` (`acp/driver-hooks.ts:29-31`),
   still only when the floor clears.
3. `docs/approval-levels.md` has 15 more lines since `d6660e2d7` (the native
   Antigravity CLI) and 8 more since `3aec210` (a Codex note for Linux).
   Earlier research gives 428 lines. Now it has 451.
4. No other file of this feature changed. These line numbers moved:
   - `Composer.tsx:733-746` is now `:724-737` (the approval panel)
   - `store.tsx:2428-2440` is now `:2421-2457` (`decideRequest`)
   - `acp/core.ts:923-929` is now `:869-875` (the level override), and
     `:622-751` is now `:564-693` (the request handler).
5. **A correction to [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md)
   3.9 item 5.** Its example of an automatic answer ("when a saved 'always
   allow' rule matches the tool") is not exact. The engine owns "Allow for
   this session". The server grants only exact saved commands and remembered
   MCP tools that send nothing (`auto-approve.ts:115-116`).
6. **Open points of `chat-driver-tool-calls.md` section 9 that this file
   closes:** the part of `mcp-gate.ts` (a filter, not an approval path,
   section 3.6), the patterns of the never-list (section 3.12),
   `shared/tool-scope.ts` (section 3.5 and 5.1), the start-up sweep (none for
   engine cards, section 4.4).

## 3. How it works

### 3.1 The levels and their order

1. The levels are `APPROVAL_MODES = ["ask","edits","auto","full","custom"]`
   (`approval-mode.ts:5`). The picker shows them in this order.
2. The reference has **three orderings** of the levels:
   - `levelWithin(level, limit)` uses the index in the array. `custom` is
     equal only to itself (`approval-mode.ts:9-11`).
   - `APPROVAL_RANK = {ask:0, edits:1, auto:2, full:3, custom:4}`, used by
     `approvalModeWidens` (`approval-mode.ts:47`, `:63-65`). Here a move to
     `custom` is always "wider", also from `full`.
   - `LEVEL_RANK` (`auto-approve.ts:38`) and `TRAVELS`
     (`server/runtime/level.ts:13`) leave `custom` out.
3. Support by engine (`approval-mode.ts:22-26`):
   - `custom` only when the driver kind is `codex`
   - `edits` only for `claudeAgent`, `grokAgent`, `antigravityAgent`,
     `qwenAgent`, `geminiAgent`
   - each other level on each engine, also an unknown engine.
4. `hasNativeAutoReview` is true for `codex`, `claudeAgent`, `cursorAgent`,
   `grokAgent`, `qwenAgent` (`approval-mode.ts:41-45`). On another engine,
   "Approve for me" behaves like Ask (the UI says so, section 5.1).
5. A model switch to another engine drops the level to Ask when the new
   engine does not have it, and always for `custom`
   (`modelSwitchNeedsAsk`, `approval-mode.ts:33-39`). The switch and the
   drop are one write (`index.ts:2615-2641`, `store.ts:2051-2069`: "never
   publish a new provider before its approval downgrade").

### 3.2 Where a level is stored and how it is read

1. A bot and a thread each have three fields: `approvalMode`, the old
   boolean `autoApprove` and `alwaysAllow` (a list of remembered tool keys)
   (`wire.ts:317-322` for a bot, `:163-165` for a thread).
2. A department or a routine stores no level:
   - a change "for all bots in this department" writes each bot and each
     thread (section 5.4, `store.ts:2093-2104`)
   - the conversation of a routine run copies the level of its bot
     (`host/spawn-level.ts:34-37`).
3. `approvalModeFor` reads a level in this order (`approval-mode.ts:87-102`):
   1. A pending desktop grant (`approvalGrant`, section 3.10) gives `ask`,
      unless the grant is for one other thread.
   2. A valid `approvalMode` is used as it is.
   3. The old `autoApprove === true` gives `auto`, never `full`.
   4. No value gives the default (`full`, or `ask` on a shared workspace).
   5. Any other value gives `ask`. The comment says: "an unknown persisted
      value fails closed to Ask" (`:85-86`).
4. **But step 5 never runs for a stored value.** At load, the store deletes
   an `approvalMode` that is not valid, for a bot and for a thread
   (`store.ts:351-354`, `:521-524`). Then step 4 gives the default, Full
   access. So an unknown stored value becomes **Full**, not Ask. The test
   `approval-mode.test.ts:105-110` checks only the function, not the load.
   The main session read both places. Nobody ran it.
5. The level of a thread (`threadApproval`, `approval-mode.ts:55-61`): the
   thread's own `approvalMode` wins. A thread with `autoApprove` but no mode
   gets the default, not the level of its bot. `projectBotForTask` puts the
   thread fields over the bot (`store.ts:1998`).
6. At load:
   - A desktop grant that is still pending is revoked. For a grant of one
     thread, that thread goes to Ask. Else the bot goes to Ask, and also each
     of its threads on `full` or `custom` (`store.ts:355-373`).
   - A one-time repair: hand-off threads made before 2026-10-14 that save
     Ask lose all three fields, so that they follow their bot. A marker file
     records that the repair ran (`legacy-work-threads.ts:12`, `:18-40`).
   - The fields `peers` and `approvePeerComms` of an old peer approval are
     removed (`store.ts:421-424`).

### 3.3 How a new thread gets its level

1. A new thread is built from one of three sources
   (`server/task-record.ts:17-42`): the level of its bot with its grants. An
   exact `ask` or `full` with no grants. Or `{from: level}`, which keeps the
   grants of the bot. While a grant of the whole bot is pending, a new
   thread saves no level, so it keeps following its bot (`:18`).
2. **The spawn rule** (`host/spawn-level.ts:29-49`). A thread that a
   conversation opens takes the level of that conversation, up or down:
   - Nothing is copied when the conversation has no level of its own, is a
     routine run, or has a pending grant (`:37-38`).
   - If a floor holds the turn of the source at Ask (a guest, a Bot API key,
     a fence, the engine), the new thread opens at Ask (`:42`).
   - `custom` is never copied. The result is Ask, unless the target is the
     same bot and is itself on Custom (`:44-46`).
   - A level above the target's own needs `mayRaise` (`:47`). A lower level
     needs nobody.
   - The engine caps the level (`modelSwitchNeedsAsk`, `:48`).
3. **The level of a turn** (`approvalModeForTurn`, `index.ts:3016-3024`):
   Ask for a thread of a guest, of the Bot API or a fenced thread. A
   `custom` turn that a peer started runs as `auto`
   (`auto-approve.ts:32-35`). A level that the engine does not support
   becomes Ask.

### 3.4 The automatic answer: `autoVerdict`

The server gets `request.opened` and decides: allow at once, or show a card.
`autoVerdict(mode, tool, context)` is a pure function
(`auto-approve.ts:94-123`). Its rules, in order:

1. `AskUserQuestion` or `ask_user` (also with an `mcp__x__` prefix): always a
   person, also at Full (`:63-65`, `:108`).
2. `full`: allow each other request, a sandbox widening too (`:112`).
3. `requiresExplicitApproval` (the engine asks to widen its own sandbox, for
   example Bash with `dangerouslyDisableSandbox`): a card (`:113`).
4. An outbound tool (a send): a card (`:114`).
5. A saved command, then a remembered tool, then a read of the bot's own
   files: allow (`:115-117`).
6. `auto` and the bare name is a web search (`websearch`, `web_search`,
   `web-search`, `search_web`): allow (`:68`, `:118-120`).
7. `auto` or `custom`: a card with the source `native-approval` (the engine
   left this request for the person) (`:121`).
8. Else: a card with the source `no-grant` (`:122`).

The result is `AutoVerdict {approve: string | null, source}`. `approve` is
the text of the activity chip. `null` means "a person decides"
(`auto-approve.ts:76-92`).

"Reads of own files" means plain reads of `workspaces/<botId>` and
`bots/<botId>/SOUL.md`, with no pipe to a shell
(`own-file-reads.e2e.test.ts:46-51`, `:60-79`). The comment says "at every
level" (`auto-approve.ts:3-4`), and the unit test checks each level
(`auto-approve.test.ts:125-134`). The end-to-end test checks only Ask.

### 3.5 The central handler of `request.opened`

`server/index.ts:6438-6597`. For each request of each engine:

1. The request is a **permission** when `requestType` is `permission` and it
   has no questions (`:6440`). A question goes to section 3.11.
2. The effective level (`:6446-6450`):
   - Ask when there is no asker, or the turn is driven by a guest or by the
     Bot API
   - else the level of the speaker in a room (`roomTurnLevels.forRequest`,
     an in-memory map, `room-turn-level.ts:6-21`)
   - else the live level of the thread (`liveApprovalMode`).
3. The context (`:6453-6471`):
   - `commandAllowed`: an exact match in the command allowlist. Not for a
     guest turn, and not with `requiresExplicitApproval`.
   - `toolAllowed`: a remembered MCP tool, keyed by engine, server config
     and tool.
   - `ownFilesRead`: `readsOwnFiles` checks the paths. Never in a guest
     turn.
4. The verdict is `heldAtSafetyFloor(event, autoVerdict(...))` (`:6466-6472`).
   When the floor is on and cannot read the command, an allow becomes a card
   with the source `safety-floor` (`safety-floor-gate.ts:98-100`).
5. Auto on an engine whose reviewer is not active: one line in the thread
   says that the bot asks before each action (`:6474-6493`).
6. **When the verdict allows:**
   1. `denyAtSafetyFloor` runs first. On a never-list command it posts a
      notice, writes `auto-denied`, sends `deny` with the reason, and stops
      here (`safety-floor-gate.ts:102-143`, `index.ts:6504-6507`).
   2. Else `deliverFullAccessApproval` sends `{behavior: "allow"}`
      (`auto-approve.ts:12-27`).
   3. If the turn is no longer current (`isCurrent`: the same direct-turn
      generation or the same room speaker), nothing more happens
      (`index.ts:6497-6510`).
   4. Each outcome other than `allowed-once` releases the watchdog. Each
      outcome other than `unavailable` also adds a failed row, for example
      "The provider rejected this action despite Full access."
      (`:6511-6514`, `auto-approve.ts:126-134`).
   5. On success: the chip `<verdict>: <summary, 120 characters>`, then the
      decision row `auto-approved`. The row is written **only after the
      engine accepts** (`:6516-6535`).
7. **Else a card** (`:6539-6585`):
   - The title is "Local computer approval", "Approval needed" or "Your bot
     has a question" (`:6542-6549`).
   - A held note from `approvalHeldNote`: outbound, sandbox or native
     (`auto-approve.ts:148-157`). There is no note for `safety-floor`. The
     notes `undelivered*` exist (`:142-143`), but the function never returns
     them.
   - The card is appended. `askMessageByRequest` and `pendingCommandRules`
     (in memory) get the key `threadId:requestId` (`:6558`,
     `index.ts:4726-4731`).
   - A `card-shown` decision row with its source and `unattended`
     (`:6566-6577`).
   - The activity of the task becomes `waiting-on-you`, and a notification
     of kind `approval` goes out only if the card is still open
     (`:6572-6593`).
8. **The order of the events.** The raw `request.opened` goes to the
   clients **before** the card is written (`index.ts:6311-6315` comes before
   `:6540`). The broadcast removes `command`, `commandLine` and `reads`
   (`:6314`: "Exact executable input is internal").
9. `request.resolved` (`:6588-6614`): the card gets `answered:
   <behavior>`. It is `dismissed` unless the source is `user`. A `timeout`
   sets `expired` and records the request as unanswered. The activity goes
   back to `working`.

### 3.6 The permission request path of the Claude CLI

The ACP, Codex and Pi drivers use their own protocol (section 3.8). The
Claude CLI uses an MCP tool:

1. **Before the CLI starts.** The driver adds
   `--permission-prompt-tool mcp__ogb__approve`, except at Full
   (`bypassPermissions`) (`claude.ts:1094-1096`). At Full the CLI never
   asks. The `ogb` server stays, so that `ask_user` works (`:1091`).
2. `ogb` is `node permission-proxy.ts <socketPath>`, with
   `OMB_PERMISSION_TOOL_SCOPE` from the tool selection (`:1097-1098`).
3. The broker binds a socket (a named pipe on Windows) and sets mode `0600`
   (`claude.ts:516-561`, `:528-540`). If no socket binds, it throws: **the
   path fails closed** (`:562-563`). The MCP config is written only when the
   real path is known (`:1268-1276`).
4. The proxy connects at once, so that an old proxy never reaches a newer
   broker at the same path (`permission-proxy.ts:101-102`).
5. **The CLI calls `approve`.** The proxy sends one JSON line
   `{t:"ask", id:<uuid>, tool, input}` and keeps the ask in `waiting`, by id
   and by connection (`permission-proxy.ts:106-117`, `:212-226`).
6. **The broker checks the ask** (`claude.ts:474-514`):
   - Broker closed, or no turn active: an answer at once. A permission gets
     deny "the turn ended", a question gets "wrap up" (`:474-487`,
     `:348-352`). The comment: "late asks fail closed".
   - A duplicate id: deny (`:488-496`).
   - Else: the ask goes in `pending`, a timer of 15 minutes starts (none for
     a question), and `onAsk` emits `request.opened` (`:498-514`,
     `:1225-1254`).
7. The server decides (section 3.5).
8. **The person answers** (section 3.7). `adapter.respondToRequest` calls
   `broker.answer` (`claude.ts:1964-1973`). It refuses an answer of the
   wrong kind (`answer` for a permission, allow or deny for a question)
   (`:572-576`).
9. `finish` writes the answer line and emits `request.resolved`
   (`:499-510`). A second `finish` does nothing (`:500`).
10. The proxy matches the answer by id and by connection
    (`permission-proxy.ts:63-66`). It returns to the CLI
    `{behavior:"allow", updatedInput, updatedPermissions?}` or
    `{behavior:"deny", message}` (`:231-238`). With `always`, it returns the
    rule that the CLI suggested, and the CLI keeps it (`:216-220`, `:234`).

**Error paths. Each one denies:**

| Case | Result | Where |
|---|---|---|
| The broker dies, or the connection drops | Each waiting ask gets deny "Skip this step, and say in your reply..." | `permission-proxy.ts:31-37`, `:74-82` |
| A write fails | The same | `:111-115` |
| No answer in 15 minutes | Deny, source `timeout` | `claude.ts:448`, `:511` |
| The turn ends or the session closes | `drain()` answers each ask, source `system` | `claude.ts:564-582` |
| An ask after the turn | Deny at once, no card | `claude.ts:474-487` |

The proxy tries to connect again after 0, 200 and 800 ms
(`permission-proxy.ts:86-100`).

**Not part of this path:** `server/mcp-gate.ts` is a filter between an
engine and an MCP server. It applies the tool selection, cuts large results
and hides app-only tools. It refuses a tool outside the selection with a
JSON-RPC error (`mcp-gate.ts:310-323`) and never asks a person.

### 3.7 The answer of the person

1. The routes are `POST /api/bots/:id/respond` and
   `POST /api/threads/:id/respond` (`routes/bot-messages.ts:596-791`). The
   body is `{requestId, behavior: allow|deny|answer, message?, always?,
   rememberCommand?, reviewedSha256?, dismiss?}`.
2. Checks:
   - 400 for a bad `behavior` (`:606`).
   - 403 from `cardAnswerRefusal` (`:608-610`). A local service with no
     session can only deny (`index.ts:1048-1051`). On a shared workspace,
     only the person who started the thread, the person who sent the
     request, or an admin can answer (`:1057-1059`). A card that names
     nobody can be answered by each member (`card-answerers.e2e.test.ts:239-245`).
   - 403 for `rememberCommand` from a person who is not owner or admin, or
     for a request with no saved command (`index.ts:4733-4739`).
3. The route tries the other card kinds first (access, trust, team setup,
   MCP, routine, profile, model, skill), then calls `answerRequest`.
4. `answerRequest` (`index.ts:4741-4818`):
   1. It reads the card before it sends the answer, "because delivery
      synchronously consumes the askMessageByRequest entry" (`:4752`).
   2. It sends the answer to the engine that runs the turn
      (`runningTurnEngines`, else the registry). A throw becomes
      `unavailable` (`:4760-4769`).
   3. `always` passes only if the card offered `allowSession` (`:4766`).
   4. A saved command is stored only after `allowed-once` (`:4771-4780`).
   5. A decision row `user-approved` or `user-denied` is written only when
      the answer reached the engine (`:4789-4800`).
   6. On `unavailable`: the card becomes `answered: "unavailable",
      dismissed: true`. If the card was not answered before, the chat gets
      "Couldn't deliver that answer — the request is no longer open, so the
      action was not run" (`:4801-4817`).
5. The route returns **HTTP 200** with `{ok: true, outcome}`, also for
   `unavailable` (`bot-messages.ts:669`). A persistent question takes the
   late-answer path (section 3.11).
6. **A second answer.** The routes do not check the card first. They trust
   the outcome of the engine. A replay of an answered card gives 200
   `unavailable`, no second decision row and no "Couldn't deliver" line. An
   unknown id gives 200 `unavailable` and the line
   (`respond-replay.e2e.test.ts:109-127`, `index.ts:4815`).
7. The voice path and the reaction path use `respondToCard`, which returns
   typed errors: 401, 403, 404, 409 when the card is already settled, 409
   for `unavailable` (`index.ts:4834-4866`).

### 3.8 How each engine driver maps a level

The turn input has `approvalMode`, sent again at each turn "so a resumed
native session cannot keep a stale, more permissive mode"
(`contracts.ts:132-133`). `approvalModeNow()` is for a driver that gates its
own tool calls, which is the chat API driver (`contracts.ts:134-136`, see
[`chat-driver-tool-calls.md`](chat-driver-tool-calls.md) 3.7).

| Engine | ask | edits | auto | full | custom |
|---|---|---|---|---|---|
| Claude CLI (`claude.ts:953-957`) | `--permission-mode default` and the prompt tool | `acceptEdits` | `auto`. The card says if the reviewer is active (`:1228-1232`) | `bypassPermissions`, no prompt tool | not offered |
| Codex (`codex-approval-config.ts:58-85`) | `approvalPolicy: on-request`, reviewer `user`, sandbox `workspace-write` | not offered. Mapped to Ask if sent (`:56-57`) | as Ask, reviewer `auto_review` | `never`, reviewer `user`, `danger-full-access` | the profile and policy of the Codex config of the person (`codex.ts:1182`, `codex-approval-config.ts:100-155`) |
| Qwen (`acp/qwen.ts:201-206`) | no flag | `--approval-mode auto-edit` | `--approval-mode auto` | `--yolo` | not offered |
| Gemini (`qwen-approvals.test.ts:18-24`) | none | `--approval-mode auto_edit` | none (stays Ask) | `--yolo` | not offered |
| Cursor (`acp/cursor.ts:495-500`) | none | not offered | `--auto-review` | `--force` | not offered |
| `acp/grok.ts:543-547` | `--permission-mode default` | `acceptEdits` | `auto` | `bypassPermissions` | not offered |
| Cline (`acp/cline.ts:116-119`) | `--auto-approve false` at each level. The server answers | | | | |
| OpenCode (`approval-matrix.test.ts:88-93`) | env `OPENCODE_PERMISSION`, outside folders "ask" | same | same | all "allow" | not offered |
| Droid (`approval-matrix.test.ts:106-111`) | `session/set_mode normal` | | `normal` | `auto-high` | not offered |
| Kimi, Hermes, a custom ACP engine | no flags. Each request is a card | | | | |
| Pi (`pi.ts:414`, `:448`) | `approvalMode` in its 0600 `mcp.json`. The extension gates tools | same | same | custom MCP tools not gated | not offered |

More facts:

1. **A level change reaches a CLI engine at its next turn, usually with a
   new process.** The Claude mode is in the argument list, and a changed
   list closes the process ("spawn contract changed", `claude.ts:1142-1192`).
   Codex reuses a warm process only at the same level (`codex.ts:546-547`).
   ACP flags are in the spawn arguments (`acp/core.ts:926-958`). Engines
   with `sessionScopedApproval` (Antigravity, Devin, Kiro) set the mode at
   each turn with `configureSession`, and a failure closes the session as
   `approval-unconfirmed` (`acp/core.ts:1219-1247`).
2. **The ACP request** (`acp/core.ts:564-693`): options are chosen by
   `kind`, `*_once` first, never by position (`:579-583`). With no matching
   option, the answer is `cancelled` and the turn stops (`:585-597`,
   `:659-661`). At an explicit `full`, the ACP core still emits a card, and
   the server allows it (`approval-matrix.test.ts:80-81`).
3. **Drivers that answer alone.** Codex at Full answers a request itself
   only when the safety floor clears the command (`codex.ts:799-805`,
   `permission-command.ts:29-32`). ACP answers alone with the hook
   `allowsAlone` or an old `fullAuto` with no level, and also only when the
   floor clears (`acp/core.ts:594`).
4. Claude Auto can become `default` on a model without Auto. The `init`
   event reports the real mode (`claude.ts:783-785`, `:1423`).
5. Codex checks that its sandbox is the same as the request or stricter.
   Else the turn throws before it starts (`codex-approval-config.ts:40-47`,
   `:87-98`). If the app server refuses the profile field, the driver tries
   once more with the old fields (`:157-160`).
6. `always`: Claude keeps the rule of the CLI. ACP uses `allow_always` or
   keeps the exact operation in `sessionAllows` (`acp/core.ts:629-647`).
   Codex and Pi ignore it (`codex.ts:1558-1564`, `pi.ts:979-992`).
7. **No capability flag gates a level.** `ProviderAdapter.capabilities` has
   no level flag (`contracts.ts:255-310`). `engineCapabilities()` builds
   `nativeReviewer`, `full` and `edits` from the name lists
   (`runtime/capabilities.ts:57-65`). Inside the ACP family, optional hooks
   on the driver (`allowsAlone`, `sessionScopedApproval`) gate the behaviour
   (`acp/driver-hooks.ts:29-31`).

### 3.9 A change of level

1. **Who can change it** (`routes/bot-patch.ts:497-574`,
   `routes/tasks.ts:380-399`):
   - `approvalMode` must be a valid level. The error text says "ask, auto,
     full, or custom" and does not name `edits` (`bot-patch.ts:503-506`).
   - 409 while a desktop grant is pending (`bot-patch.ts:159-163`).
   - 400 when the engine does not support the level (`:528-537`).
   - 403 for each move into or out of Custom over HTTP ("only from the
     packaged desktop app", `:540-547`).
   - 403 for Full on a hosted workspace (`:548-551`).
   - Auto on the local computer needs `acknowledgeLocalAuto` (`:568-577`).
   - `applyToAllThreads` writes each thread of the bot. It is refused when a
     thread is on Custom (`:552-565`, `:704`).
   - On a thread: 409 for Auto from a loopback call with no origin while
     bots are busy. `refreshPermissions: true` copies the level of the bot to
     the thread (`tasks.ts:294-326`).
2. **During a turn.** The server reads the level at each decision
   (`live-approval.ts:12-16`). It judges the level on the engine of the
   running turn. The chat API driver reads it before each tool call. A CLI
   engine keeps its level until the next turn (section 3.8).
   `live-approval.e2e.test.ts` shows Ask to Full during a turn: the next
   tool runs. Full to Ask: the next tool gets a card.
3. **An emergency downgrade.** This is a move from Full or Custom to Ask
   through the desktop channel while the bot is busy. The server stores Ask
   first ("Fail closed: persist Ask before the first await",
   `index.ts:3430`). Then it stops the running turns and closes the open
   approvals (`:3281-3286`, `:3405`,
   `:8621-8655`, `isEmergencyApprovalDowngrade` at `approval-mode.ts:107-112`).
   A lower level through the HTTP route does not stop the turn. It relies on
   the live read.
4. **No receipt with Undo** exists for a change of level. Undo exists only
   for changes that a bot applied by itself (section 5.2).

### 3.10 The desktop grant of Full access and Custom

The aim: a bot must not be able to raise its own level. HTTP on the loopback
address is not safe for this, because "a bot's shell could curl it"
(`index.ts:3055-3056`).

1. Custom, a move out of Custom, and Full through the desktop go only
   through the private channel of the Electron utility process. The handler
   refuses when the application is not packaged (`electron/main.mjs:2750-2756`).
2. The steps for Full or Custom: `set`, `confirm`, `activate`, `finalize`,
   `commit`. Each is a message with `{requestId, botId, mode}` and a
   `*-result` reply (`approval-trusted-mode.cjs:49-124`).
   - `set` writes `approvalGrant` with phase `prepared`. Until the grant
     ends, the bot runs as Ask (`store.ts:157-166`).
   - Each step checks the request id, the mode and the phase
     (`index.ts:3076-3240`).
   - `commit` applies the level and removes the grant.
3. On a time limit (10 s by default), a bad reply or a reply that does not
   match, Electron sends a compensating `set` to Ask for the same scope
   (`approval-trusted-mode.cjs:127-131`, `:204-222`).
4. At start, the store revokes each grant that is still there (section 3.2).
5. **But Full over HTTP is permitted** on a local workspace. The comment
   says: "Full access applies from any client that can reach this API;
   Custom moves only through the desktop's private channel"
   (`bot-patch.ts:538-539`). Two other guards exist:
   - Auto on the local computer needs `acknowledgeLocalAuto`, "so a bot
     curling the loopback API is refused" (`bot-patch.ts:567-578`).
   - A new task with `approvalMode: "full"` through
     `POST /api/bots/:id/tasks` gets 403
     (`full-access-workflows.e2e.test.ts:132`).

### 3.11 Questions and `ask_user`

1. Two schemas have the same name (`ask_user`):
   - The Claude CLI: an MCP tool of the `ogb` server with `question`,
     `choices` and `multiSelect` (`permission-proxy.ts:167-186`). It shows
     only when the tool selection allows `mcp:ogb:ask_user` (`:13`, `:205`).
   - The chat API and Pi: a function tool with `questions[]`
     (`packages/phone-protocol/src/ask-question.ts:183-226`).
2. Limits (`ask-question.ts:11-18`): 6 questions, 12 options, a question of
   8,000 characters, a label of 120, a description of 400, a free answer of
   2,000. A flat `choices` list has at most 5. An empty option list is
   permitted, so a card always has free text.
3. A question has no time limit (`claude.ts:511`). A `request.resolved`
   settles a question card only when its source is `user`
   (`index.ts:6603-6611`). Two other paths close it:
   - When the handed-on work ends, `closed` marks the card `expired`, or
     `unavailable` and `dismissed`, with `stopped` after a stop. It skips a
     card that a turn still waits on (`ask-cards.ts:276-289`).
   - `closeOpenApprovals` skips persistent questions (section 3.7).
4. **The exception to "no level answers a question".** At Full, in work
   that another bot handed on, `notAsked` answers the question with "Not
   asked: at this level nobody is interrupted. Take the sensible default
   yourself ..." (`host/question-routing.ts:63-69`). It does not apply to a
   question about sign-in, payment, secrets or accounts (`personOnly`,
   `runtime/questions.ts:13-26`), to work from outside, or to private work.
   `docs/approval-levels.md:352-354` says that no level answers a question.
   The code and its test (`question-routing.e2e.test.ts:104-131`) disagree
   with that document.
5. **NEEDS INPUT.** A reply that ends with `NEEDS INPUT: ...` (and an
   optional `Default: ...`) becomes the same card, with the id
   `needs-input-<node>-<execution>` (`ask-cards.ts:24`, `:164-183`). The work
   parks until the person answers (`parked-cards.e2e.test.ts:46-96`).
6. **A late answer.** If the request is no longer open and the card is a
   persistent question, the answer goes to parked work, or else it is sent
   as a new message to the bot (`routes/bot-messages.ts:783-795`,
   `person-replies.ts:116-134`).
7. **Who else can answer.** A teammate bot can answer a question that waits
   (`relay`, `question-routing.ts:102-139`). A Chief can answer for the
   person in some cases (`answerForPerson`, `:180-199`). A person-only
   question is refused for both (`:114-117`).
8. After one day, a parked question gets one reminder notification
   (`ask-cards.ts:232-243`).

### 3.12 The safety floor

1. **On and off.** Off by default. `OMB_SAFETY_FLOOR=1` or the config
   `safetyFloor.enabled` turns it on. The variable cannot turn it off
   (`safety-floor-gate.ts:14-17`). On Windows it is never in force
   (`:37-39`), and the server says so one time (`:26-34`). The person can
   change only on or off. The list is fixed (`safety-floor-gate.test.ts:95`).
   No setting in the UI exists (`docs/verification/safety-floor.md:139-141`).
2. **The never-list** (`safety-floor.ts:5`): `delete-root`, `delete-home`,
   `delete-system-directory`, `format-disk`, `overwrite-disk`, `fork-bomb`.
   The label that the person sees never has the command in it, because a
   command can hold a credential (`:7-20`).
   - System folders: `/etc`, `/usr`, `/bin`, `/sbin`, `/var`, `/boot`,
     `/home`, `/lib*`, `/System`, `/Library`, `/Applications`, `/Users`, and
     `/private...` on macOS (`:22-27`). Windows folders and variables
     (`:28-46`).
   - Disk devices by a regex (`:49`). Scratch devices are not included
     (`:52-57`).
3. **How it reads a command** (`floorReading`, `safety-floor.ts:697-718`):
   - It splits the line into each simple command, also inside `;`, `|`,
     `&&`, subshells, `$( )` and back quotes (`:91-338`).
   - It skips `sudo`, `env`, `timeout`, `nohup` and other prefixes
     (`:342-449`). It reads `sh -c`, `bash -c`, `eval` and `pwsh -c` again,
     to a depth of 4 (`:357`, `:579-616`).
   - `rm -r` checks each target (`:469-494`). `dd of=<disk>`, `mkfs`,
     `diskutil erase*` and Windows forms are also checked (`:569-676`).
   - **Security invariant:** a line that it cannot read to its end is
     `{read: false}`, never "clear" (`:3`, `:713-714`). A line longer than
     32 KiB is not read (`:359`, `:699`). An exception gives `{read: false}`
     (`:715-716`).
4. **Where it applies.** The floor changes only an **automatic** allow. It
   never changes the answer of a person (`safety-floor.e2e.test.ts:121-128`):
   - in the central handler, after `autoVerdict` (section 3.5): a never-list
     command is denied, and a command it cannot read gets a card
   - in the chat API gate, at Full or under a session allow
     (`chat-tool-approval.ts:42-47`): a never-list command and a command it
     cannot read are both refused, because this gate has no card to show
     (`safety-floor-gate.ts:155-177`)
   - in the drivers that answer alone: Codex, Muse Code and ACP
     (`permission-command.ts:29-32`, `:67-81`).
5. The floor reads `event.commandLine ?? event.command.command`, never the
   summary, which is cut at 200 characters (`safety-floor-gate.ts:94-95`).
   The chat gate reads only the argument `command` or `cmd` (`:145-153`).
6. **Known gaps** (`docs/verification/safety-floor.md:87-137`): it cannot
   reach an engine that never asks (Claude `bypassPermissions`, Codex with
   approvals off). It does nothing on Windows. `<<` is read as a heredoc, so
   such a line is not read. `ssh host 'rm -rf /'` is allowed
   (`safety-floor.test.ts:399-400`).
7. **Pure or not.** `floorReading` is pure. The gate around it reads module
   state, `process.env` and `homedir()`, and writes the log, calls the
   engine and writes the console (`safety-floor-gate.ts:20-23`, `:57-79`).

### 3.13 The decision log

1. **The file.** `<data>/decisions/YYYY-MM.ndjson`, one file for each month
   in UTC (`decision-log.ts:76`, `:110-112`). The folder has mode 0700 and
   the file 0600 (`:116-117`).
2. **The row** (`DecisionRow`, `:53-74`): `at`, `threadId`, `requestId`,
   `botId`, `botName`, `tool`, `summary`, `summaryCode`, `summaryParams`,
   `decision`, `source`, `rule`, `unattended`, `actor`, `via`, `origin`.
   - `decision`: `card-shown`, `auto-approved`, `auto-denied`,
     `user-approved`, `user-denied`, `user-undone`, and two old values
     `review-would-approve` and `review-would-deny` (`:15-23`).
   - `source`: the verdict sources plus `level`, `self`, `question`,
     `routine`, `skill`, `profile`, `outbound`, `team-memory` and more
     (`:28-45`).
   - `actor`: a session, the loopback owner or a worker. Only on rows with
     the source `user` (`:48-51`, `:126`).
3. **Redaction.** `redactSecrets` runs over the full row before the write
   (`:129-130`) and over the CSV export (`:259`).
4. **Retention.** `OMB_DECISION_RETENTION_DAYS`, then the config
   `decisions.retentionDays`, then 180 days. A valid value is 1 to 3,650
   (`:81-82`, `:95-101`). A month file is deleted only when the full month is
   older than the limit (`:172`). A prune runs at most one time each hour,
   and at start (`index.ts:15082`). No size limit exists for a row or a
   file.
5. **Best effort.** A write error is ignored, and the order is kept. The
   comment: "A full disk must not turn into denied tools"
   (`decision-log.ts:124-141`).
6. **Readers.** `GET /api/decisions?limit=` (default 200),
   `GET /api/decisions.csv?from&to` (at most one year), the admin activity
   page (at most 5,000 rows), and the activity receipt of a bot (the last
   20,000 rows) (`routes/status.ts:183-235`, `activity.ts:246-333`). The CSV
   cells are made safe against spreadsheet formulas (`decision-log.ts:255-275`).
7. **What has no row** (from [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md)
   3.9, still true): a call that a CLI engine at Full runs with no request,
   a call under a session allow, a time limit, a stop.
8. **A removed feature.** The reference had its own model reviewer for
   Auto (8 s limit, a JSON verdict), regex guards for destructive and
   sensitive actions, and a downgrade from Auto to Ask for unattended turns.
   Commit `725d8f472` (2026-09-11) removed them. The decision kinds
   `review-would-*` and the sources `auto-review*` stay
   (`decision-log.ts:22-23`, `:44-45`).
9. **Not the same:** `server/decider/` answers room routing and inbox
   triage. It never answers approvals (`decider/types.ts:12-16`). Its own
   log never holds message text or a key (`decider/log.ts:1`).

### 3.14 The command allowlist

1. A rule is `{id, command, cwd, providerInstanceId}` for one bot
   (`command-allowlist.ts:21-48`). It matches the exact command (each byte),
   the exact folder and the engine instance. It is not a prefix and not a
   wildcard (`docs/verification/command-allowlist.md:6-8`).
2. Limits: a command of at most 16 KiB, no control characters except tab,
   CR and LF, and **a command that holds a secret is refused**
   (`command-allowlist.ts:26-32`). At most 200 rules for each bot and an
   8 MiB file (`:9-12`).
3. The file is `<data>/command-allowlist.json`, written atomically with mode
   0600. It is not in bot profiles or backups (`:63`, `:144-150`). A file
   that cannot be read turns off each grant and refuses writes with 503
   (`:94-97`, `:134-142`).
4. Sources: "Always allow this command" on a card, saved only after the
   engine accepted that request (`index.ts:4771-4780`). And the API
   `GET/POST/DELETE /api/bots/:id/command-allowlist`, for an owner or an
   admin (`routes/bot-settings.ts:189-209`).
5. Not for a guest turn, not for a sandbox widening, not for MCP tools or
   questions. A rule always goes through the safety floor first.

### 3.15 The outbound hold and guarded messages

1. **The rule** (`packages/phone-protocol/src/outbound.ts:8-11`,
   `:118-120`): `{policy: "ask" | "allow"}`. With no rule of its own, a bot at
   Full gets "allow", a bot at another level gets "ask".
2. A send with no card happens only at Full with no rule, or with "allow"
   (and not opaque code below Full) (`outbound-hold.ts:33-37`). Else the card
   "Send on your behalf?" shows. It waits 9 minutes
   (`OUTBOUND_HOLD_MS`, `:13`).
3. `beforeDispatch` checks again against the fresh bot record and the
   current level. A change to `ask` while a send waits refuses that send
   (`outbound-hold.ts:110-117`, `trust-controls.e2e.test.ts:534-561`).
4. One Allow does not cover the next send (`trust-controls.e2e.test.ts:259-263`).
5. **Guarded messages** (`POST /api/bots/:id/messages/guarded`) refuse with
   409 and start no turn when the level is not exactly the expected level,
   the branch changed, or the thread is busy
   (`routes/bot-messages.ts:316-335`, `docs/verification/guarded-messages.md:8-33`).

### 3.16 A Chief's level flows down

1. `delegatedApprovalMode` (`auto-approve.ts:42-61`): only the level of a
   Chief, never to the same bot, only **up**, never to a bot on Custom, and
   capped by the engine of the receiver. A Chief's Custom reads as Auto.
2. `host/delegated-level.ts` walks up at most 32 hops to the nearest Chief
   (`:27`, `:33-41`). Nothing travels from work that came from outside
   (`:46`). `apply` saves the level on the thread of the teammate, clears its
   grants and adds the line "<Level> — handed on by X, from Y, a Chief of
   Staff on <Level>" (`:58-72`).
3. The level of the teammate's own bot does not change
   (`chief-level-every-hop.e2e.test.ts:61-70`). In a room, the level rides
   the hand-off and is not written on the shared thread (`:86-109`).
4. **Two rules disagree.** `runtime/level.ts:16-28` caps `auto` on an engine
   with no reviewer. `delegatedApprovalMode` uses `supportsApprovalMode`,
   which is true for `auto` on each engine. So a Chief on Approve for me can
   give `auto` to a teammate on an engine with no reviewer, and the runtime
   records another level.

### 3.17 Limits

| Limit | Value | Where |
|---|---|---|
| Wait for a permission | 15 minutes, then deny | `claude.ts:448`, `codex.ts:838`, `acp/core.ts:672-675`, `pi.ts:659-686` |
| Wait for a question | none | `claude.ts:511` |
| Wait for a send card | 9 minutes | `outbound-hold.ts:13` |
| A step of the desktop grant | 10 s (1 ms to 60 s) | `approval-trusted-mode.cjs:127-131` |
| Proxy connect again | 0, 200, 800 ms | `permission-proxy.ts:90` |
| Floor: a command | 32 KiB, depth 4, nesting 40 | `safety-floor.ts:85`, `:357`, `:359` |
| Saved command | 16 KiB, 200 for each bot, 8 MiB file | `command-allowlist.ts:9-12` |
| Decision log | 180 days, 1 to 3,650 | `decision-log.ts:81-101` |
| Chief walk | 32 hops | `host/delegated-level.ts:27` |
| Tool selection | 256 entries, 1,024 characters each | `tool-scope.ts:15-42` |

## 4. The data

### 4.1 The level

```ts
// packages/phone-protocol/src/approval-mode.ts:5, :75
export const APPROVAL_MODES = ["ask", "edits", "auto", "full", "custom"] as const;
export const DEFAULT_APPROVAL_MODE: ApprovalMode = "full";
```

On a bot and on a thread (`wire.ts:163-165`, `:317-322`):

```json
{ "approvalMode": "full", "autoApprove": false, "alwaysAllow": ["<tool key>"] }
```

Private to the server, never sent to a client (`store.ts:157-173`):

```json
{ "approvalGrant": { "requestId": "<uuid>", "mode": "full",
  "phase": "prepared", "threadId": "<id>", "threadOnly": true } }
```

The runtime has `level` and `levelSource: "own" | "chief" | "engine_cap"`
on each assignment row (`runtime/store.ts:58-59`, `runtime/types.ts:78-79`).

### 4.2 The request and its answer

`request.opened` (`claude.ts:1232-1253`):

| Field | Meaning |
|---|---|
| `requestId` | The id of the ask |
| `requestType` | `permission` or `question` |
| `tool`, `summary` | The tool and a short text |
| `command`, `commandLine`, `reads` | Internal: removed before the broadcast (`index.ts:6314`) |
| `requiresExplicitApproval` | A sandbox widening |
| `nativeReview` | Is the reviewer of the engine active |
| `allowSession` | Can the answer be "for this session" |
| `approvalScope` | `local-computer` for actions on the person's computer |
| `questions`, `choices` | For a question |

`request.resolved`: `requestId`, `behavior`, `source` (`user`, `timeout`,
`system`), `approvalScope` (`claude.ts:1255-1265`).

The answer of the engine adapter: `allowed-once`, `rejected`, `answered` or
`unavailable` (`claude.ts:1964-1973`).

The socket between the proxy and the broker, one JSON object for each line
(`permission-proxy.ts:17-22`, `:224`, `claude.ts:505-507`):

```json
{"t":"ask","id":"<uuid>","tool":"Bash","input":{"command":"ls"}}
{"t":"answer","id":"<uuid>","behavior":"allow","source":"user","always":true}
```

### 4.3 The card

A message of kind `options` with `card` (`wire.ts:635-701`,
`request-card.ts:10-34`):

| Field | Meaning |
|---|---|
| `title`, `subtitle`, `summaryCode`, `summaryParams` | The text. `subtitle` is redacted when it is saved (`approval-request-contract.test.ts:134-154`) |
| `options` | The choices of the engine, else `["Allow","Deny"]`. `[]` for a question |
| `requestId`, `requestType`, `tool` | The request |
| `commandAllowlist`, `allowKey`, `allowSession` | Which grant buttons can show |
| `held`, `heldCode` | Why the server did not answer |
| `answered`, `answeredText`, `answeredBy`, `dismissed`, `expired`, `stopped` | The state |
| `questionRequest`, `fixedOptions` | For a question |

The state of a card is in **several optional fields**, not one value.
`answered` can be `allow`, `deny`, `answer` or `unavailable`.

### 4.4 What is stored and where

| Data | Where | Survives a restart |
|---|---|---|
| Level, grants of the bot and the thread | `bots.json` and the tasks | yes |
| The card | the messages of the thread | yes |
| `askMessageByRequest`, `pendingCommandRules` | memory (`index.ts:4726-4731`) | no |
| The waiting ask in the broker or the driver | memory | no |
| Room levels | memory (`room-turn-level.ts:6-21`) | no |
| Session allows | memory of the engine or the driver | no |
| Saved commands | `command-allowlist.json` | yes |
| The decision log | `decisions/YYYY-MM.ndjson` | yes |

**At start**, the server closes peer cards, "your computer" cards and
computer cards ("Consent cards live only in memory", `index.ts:9465-9470`).
The subagents found **no** sweep at start for an engine permission card.
Such a card stays open on disk. A click then gets "Couldn't deliver that
answer". This agrees with [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md)
section 9.

## 5. The UI

[`chat-driver-tool-calls.md`](chat-driver-tool-calls.md) 5.2 describes the
panel above the message box, its buttons and the transcript line. This
section adds what that file does not have.

### 5.1 The level picker

The picker is in five places:

1. **Bot settings, Permissions** (`bot-settings/PermissionsSection.tsx`):
   the wide `ApprovalModeSelector`. Rules (`:44-59`):
   - Ask goes to each thread (`applyToAllThreads`), unless a thread is on
     Custom and there is no desktop bridge.
   - Full always goes to each thread.
   - Edits and Custom change only the default of the bot.
   - Auto on a bot with the local computer opens a warning first
     (`LocalComputerAutoWarning`).
   - A button "Apply Full access to all threads" and, for an owner or admin,
     "Manage command allowlist" (`:133-142`).
2. **The new bot dialog** uses the same section in a draft
   (`NewBotDialog.tsx:36`, `:154-162`).
3. **The message box:** the "+" menu has "Before {name} acts" with the same
   options (`ComposerPlusMenu.tsx:50-101`). A chip shows only when the
   thread's level differs from the bot's (`Composer.tsx:806`). It changes
   only this thread (`thread-approval.tsx:25-33`). No picker in a room or on
   a remote client.
4. **The simple bot panel:** Ask and Full only. Another level shows as a
   third segment that is disabled (`bot-panel/SettingsPage.tsx:62-75`).
5. **A department:** "Set for all bots in this department…" (section 5.4).

The menu (`ApprovalModeSelector.tsx:127-198`), 340 px wide:

```
+------------------------------------------------+
| How should {provider} actions be approved?     |
| (busy note, while the bot works)               |
| Learn more                                     |
| (o) Ask for approval                           |
|     Requests approval for commands and file    |
|     changes                                    |
| ( ) Auto-accept edits                          |
| ( ) Approve for me                             |
| ( ) Full access                          [v]   |
|     Full computer access (elevated risk)       |
| Manage command allowlist                       |
| ( ) Custom (config.toml)                       |
| (note: Custom only in the desktop app)         |
+------------------------------------------------+
```

Text (`src/locales/en.json:3551-3576`):

| Level | Label | Chip | Description |
|---|---|---|---|
| ask | "Ask for approval" | "Ask" | "Requests approval for commands and file changes" |
| edits | "Auto-accept edits" | "Edits" | "Approves file edits automatically; other actions can still require approval" |
| auto | "Approve for me" | "Auto" | "Uses the provider's automatic review to approve routine actions and ask about others. Web search is allowed without asking." |
| full | "Full access" | "Full access" | "Full computer access (elevated risk)" |
| custom | "Custom (config.toml)" | "Custom" | "Uses permissions defined in config.toml" |

- Auto on an engine with no reviewer: "This provider has no automatic
  review. Behaves like Ask" (`:3568`).
- While the bot works: "The bot is working. A change applies from its next
  step where its AI allows it, otherwise from its next turn." (`:3570`). The
  picker stays enabled (`ApprovalModeSelector.allowlist.test.ts:72-86`).
- **The list of levels is chosen by the driver name**:
  `approvalModeOptionsFor` filters by `supportsApprovalMode`, hides Auto for
  `antigravityAgent`, and changes the label of Full for that engine to "Auto
  (full access)" (`approval-mode-options.ts:50-83`).

### 5.2 Receipts with Undo

A change that a bot made to itself (a routine, a profile, a skill, team
memory) applies at once and shows a line with Undo
(`ApprovalCard.tsx:228-343`, `POST /api/threads/:id/undo`). A second Undo
gives `alreadyUndone` (`full-access-workflows.e2e.test.ts:213-236`). A change
of the level by the person has **no** receipt and no Undo.

### 5.3 The question card

`QuestionCard.tsx` and `AskCard.tsx`:

- The header "{name} asks" (`en.json:1192`). The title is the question
  itself when there is one question of at most 160 characters.
- One question with one choice sends on one tap. Else a button "Submit
  answer", "Submit answers" or "Done".
- Arrow keys, Home and End move the focus, also for right-to-left text. No
  letter shortcuts (`AskCard.tsx:346-363`).
- A free text field: Enter sends, Shift+Enter adds a line, nothing is sent
  during IME input. At most 2,000 characters.
- Settled lines: "You chose:", "You answered:", "Stopped before you
  answered", "Expired before anyone answered", "Closed without an answer".
- A card that a bot decides: "{name} decides this", with "Answer yourself".

### 5.4 The department dialog

`TeamSettingsDialog.tsx`, `team-bulk-settings.ts`:

1. Radio buttons: ask, edits, auto, full. No Custom ("Custom approval stays
   a per-bot setting in that bot's settings.", `en.json:2178`).
2. A plan for each bot: "Will change", "Already set", or "Skipped: {engine}
   does not offer this approval level" (`team-bulk-settings.ts:91-97`). A
   busy bot is not skipped.
3. The plan shows before the change. The local Auto warning shows one time.
4. The bots change one at a time, with the same checks as the settings of
   each bot. A refusal of the server becomes the reason of that row
   (`TeamSettingsDialog.tsx:129-155`).

### 5.5 What the window sends

- A bot: `PATCH /api/bots/{id}` with `{approvalMode, applyToAllThreads?}`,
  or the desktop bridge `window.ogb.approvals.setMode(...)` for Custom, a
  move out of Custom, or Full when a bridge exists (`store.tsx:1897-1977`).
- A thread: `PATCH /api/bots/{id}/tasks/{threadId}` or the bridge with
  `threadOnly: true` (`store.tsx:1880-1894`).
- The thread write is optimistic (`:1349-1355`). The bot write is not for
  `applyToAllThreads`: the threads change when the server copy arrives
  (`:1532-1534`, `:2069-2071`).
- Before a send, `waitForExecutionSettings` refuses with "settingsNotSaved"
  when the saved level is not the expected level (`:2117-2137`).
- An error goes to the general error banner.

### 5.6 States and rules of `DESIGN.md`

- `DESIGN.md:57-59`: "No new asks", "no default below Full access", and a
  change that needs undoing gets Undo.
- The approval panel has no "sending" state. A failed card answer opens the
  card again only when its `pendingAnswer` is still the same answer
  (`store.tsx:1077-1082`). The panel path (`decideRequest`) changes nothing
  at once (`:1085-1086`).
- A guest of a Cloud sees "The owner of this Cloud has to approve this. ..."
  (`en.json:2632`).
- A held note: "The provider requires your approval for this action.",
  "This loosens the AI's own safety limits, so only Full access can approve
  it automatically.", "This sends something on your behalf, so it asks you
  first." (`en.json:1293-1296`).

## 6. The tests

The tests show what the reference guarantees.

**The levels and their flow:**

- `server/approval-mode.test.ts`: the support table by engine. Five values
  only. Old `autoApprove` maps to `auto`. The default is `full`. An unknown
  value gives `ask` (in the function only). A pending grant reads as `ask`
  the emergency downgrade.
- `host/spawn-level.test.ts`: a new thread copies the level both ways, also
  after a restart. Custom rules. A guest cannot raise.
- `host/delegated-level.test.ts`, `chief-level-delegation.e2e.test.ts`,
  `chief-level-every-hop.e2e.test.ts`: the level of a Chief goes down each
  hop, only up, with the activity line. The teammate's own default stays.
- `full-access-default.e2e.test.ts`: new bots on three engines are Full
  with no stored field (`:60-91`). Ask on all threads survives a restart
  (`:93-106`).
- `full-access-workflows.e2e.test.ts`: one thread at Full while its bot is
  at Ask (`:238-249`). Full through the public task API gives 403
  (`:132`).
- `live-approval.e2e.test.ts`, `host/live-approval.test.ts`: a change during
  a turn applies to the next tool call.
- `room-turn-level.test.ts`: a room turn keeps its own level.

**The verdict and the log:**

- `auto-approve.test.ts`: the order of the rules. Web search only at Auto
  and only by its bare name. Own files at each level. A question is never
  answered. The Chief rules.
- `decision-log.test.ts`: order, redaction, mode 0600, one file for each
  month, retention, the actor only on rows of the person, CSV safety, a
  burst of 100 rows keeps its order.
- `decision-log-wiring.test.ts`: real cards with the fake ACP CLI: the
  sources `native-approval`, `no-grant`, `question`. `unattended: true` for a
  webhook turn.
- `routine-unattended-approval.e2e.test.ts`: an unattended routine at Ask
  waits, and after 15 minutes the run fails with "Stopped: nobody answered
  the approval…".

**The path:**

- `permission-proxy.test.ts`: the broker dies and each waiting ask is
  denied (`:393-405`). A dropped connection answers and connects again
  (`:407-420`). A 1.5 MB input returns byte for byte (`:331-346`).
- `command-allowlist.e2e.test.ts`: only an owner can remember. `&& pwd`, a
  sandbox widening and another tool do not match. Another folder gets a
  card. Rules survive a restart.
- `respond-replay.e2e.test.ts`: a replay is `unavailable`, with no second
  row.
- `card-answerers.e2e.test.ts`: who can answer. A local service can only
  deny.
- `acp/approval-matrix.test.ts`: seven ACP drivers at Full, Auto and Ask:
  the arguments, a card for each residual request, a deny resolves
  `rejected`.
- `electron/approval-trusted-mode.node-test.mjs`: another process cannot
  answer a grant. A time limit revokes before it rejects.

**The safety floor:**

- `safety-floor.test.ts`: about 300 blocked forms, at least 40 for each
  platform. Allowed data. "not read" cases. A lost place is never clear. No
  secret in a label. It never throws.
- `safety-floor-gate.test.ts`: off means nothing. One deny, one notice, one
  row. No interrupt of a stale turn. Windows does nothing.
- `safety-floor.e2e.test.ts`: the floor denies after a config change. The
  card of a person stands. The broadcast has no `command`.
- `self-answer-safety-floor.test.ts`, `openai-chat-safety-floor.test.ts`:
  the drivers that answer alone send a floored command to the server.

**The UI:**

- `ApprovalModeSelector.test.ts`: the labels. Which levels each engine
  gets (by name). The Custom lock.
- `PermissionsSection.test.ts`: Full and Ask go to each thread. Edits and
  Custom go to the bot only. The local Auto warning.
- `team-bulk-settings.test.ts`: the plan, one bot at a time, a refusal
  shown as the reason.
- `scripts/smoke-approval-modes.cjs`: Electron with fake CLIs. The Claude
  flag for each level (`:178-187`). HTTP Custom gives 403 (`:191-229`).

**A test helper with a clock:** `server/testing/approval-clock-hooks.mjs`
makes the 15-minute timer fire when a file exists. It runs only with
`OMB_TEST_APPROVAL_CLOCK=1` (`:5-8`).

**Not tested:** the load of an unknown stored level (section 3.2, step 4)
own-file reads at a level other than Ask in an end-to-end test. The `custom`
level in the end-to-end tests of group F2.

## 7. Ours compared

Our crates today: `bot-protocol` has `ids.rs`, `event.rs` (only
`turn.started` and `turn.completed`) and `message.rs`. `bot-engine` and
`bot-core` are empty. No crate has approvals yet. Step 10 of the plan names
`bot-protocol`, `bot-engine` and `bot-desktop`.

| Reference | What it does | Ours (crate, module) |
|---|---|---|
| `packages/phone-protocol/src/approval-mode.ts` | The five levels, the default, the parse | `bot-protocol`, `approval.rs`: an enum `Level` |
| `contracts.ts:122-136`, `:313-323` | `approvalMode` on a turn, `respondToRequest`, the outcomes | `bot-protocol` (the request and answer types, the events `request.opened` and `request.resolved`). `bot-engine`, the `Driver` trait (decision D22 already has "answers a request") |
| `approval-mode.ts:22-45`, `runtime/capabilities.ts` | Which engine offers which level, by name | `bot-engine`: a capability of the driver |
| `drivers/claude.ts:953-957`, `codex-approval-config.ts`, `acp/*.ts` | A level to the setting of the engine | `bot-engine`, each driver module. The ACP adapter first (step 9) |
| `acp/core.ts:564-693` | The ACP request, options by `kind` | `bot-engine`, `acp` module (`docs/comparison.md` already says "by its `kind`, never by its position") |
| `permission-proxy.ts`, `drivers/claude.ts:405-583` | The MCP proxy and its socket broker | `bot-engine`, later, for a Claude adapter (`tokio::net`, `docs/comparison.md` 4) |
| `auto-approve.ts:94-123`, `safety-floor-gate.ts:98-143` | The decision | `bot-core`, `approval/decide.rs`: one pure function |
| `index.ts:6438-6587`, `:4741-4818` | The handler, the card, the answer | `bot-core`, `approval/` with the runtime and the store |
| `decision-log.ts` | The log | `bot-core`, a table of the SQLite store of step 8 |
| `command-allowlist.ts` | Saved commands | `bot-core`, a table of the store |
| `safety-floor.ts` | The never-list | `bot-core` or `bot-engine`, step 12 (P49) |
| `host/delegated-level.ts`, `spawn-level.ts`, `runtime/level.ts` | The level of a new thread and of delegated work | `bot-core`, the runtime (steps 13 and 14) |
| `electron/approval-trusted-mode.cjs` | The raise to Full or Custom | `bot-desktop`: a Tauri command, not an HTTP route |
| `src/components/ApprovalCard.tsx`, `PendingApproval.tsx` | The approval box | `bot-desktop/ui/src/features/approval/` |
| `ApprovalModeSelector.tsx`, `approval-mode-options.ts` | The picker | `bot-desktop/ui/src/features/approval/` |
| `QuestionCard.tsx`, `AskCard.tsx`, `ask-question.ts` | Questions | `bot-protocol` (the question type) and `bot-desktop` |

## 8. Where we can be better

Each point names a problem of the reference, with the line, and a reason.

1. **One pure decision function, with honest inputs.** The reference
   decides in about six places (section 3.5, 3.8 item 3, 3.12 item 4). Its
   `autoVerdict` is already pure (`auto-approve.ts:94-123`), but the inputs
   come from I/O in `index.ts:6453-6471`, and the floor wraps it in two
   steps. We can have one function in `bot-core`:
   `decide(level, request, grants, floor) -> Allow { reason } | Ask { reason } | Deny { rule }`.
   The caller resolves the grants and the floor reading first. The
   function has one more input: "can this path show a card". Then the
   difference between the central handler (a card for a command that the
   floor cannot read) and the chat gate (a refusal) is one visible rule.
   **Reason:** less code, and a test table covers all cases. Note: the
   changelog row names "the native mode of each driver" as one of the six
   places. At `ed8cb7278` the engine itself decides for Auto
   (`auto-approve.ts:1-4`). So the function has only the grants of the
   server, and each driver only maps the level to the mode of its engine,
   as the row says.
2. **Levels by capability, not by name.** `supportsApprovalMode` and
   `hasNativeAutoReview` are lists of driver names (`approval-mode.ts:22-45`),
   and the UI adds more name checks (`approval-mode-options.ts:55-82`).
   **Reason:** our rule in `AGENTS.md`. A capability `levels: set of Level`
   and `native_reviewer: bool` on each driver lets a new engine work with no
   change in the UI.
3. **An unknown stored level must not become Full.** The load deletes it,
   and the default then gives Full (`store.ts:351-354`,
   `approval-mode.ts:101`). **Reason:** a known bug of the reference, the
   opposite of its comment. With a `serde` enum, an unknown value is a parse
   error. We map it to Ask with a typed warning and keep the raw value.
4. **One order, and Custom outside it.** The reference has three orders
   (section 3.1), and two rules disagree on `auto` for an engine with no
   reviewer (section 3.16 item 4). **Reason:** a wrong state that the
   compiler refuses. A type such as `enum Approval { Level(Level), Custom }`
   with `Level: Ord` makes "is Custom above Full?" a question that does not
   compile.
5. **The event after the write.** The reference broadcasts `request.opened`
   before it writes the card (`index.ts:6311-6315` before `:6540`). **Reason:**
   our rule in `AGENTS.md`: write the row and its event in one transaction,
   then act.
6. **Waiting requests in the store, and a sweep at start.** The keys of a
   request are in memory (`index.ts:4726-4731`), and no sweep at start
   closes an engine permission card (`index.ts:9465-9470`). This is P44 of
   [`../../plan/chat-driver-tool-calls.md`](../../plan/chat-driver-tool-calls.md).
   The new facts here: the same is true for the Claude broker, the ACP
   driver and the room levels.
7. **A typed refusal for an answer.** The HTTP route answers 200 for
   `unavailable` (`bot-messages.ts:669`), but the voice path returns 409 for
   the same case (`index.ts:4863-4866`). **Reason:** two answers for one
   case. P45 already proposes typed refusals. Use them on all paths.
8. **A decision row in the same transaction as the decision.** The log is
   best effort and the row of an automatic allow is written after the engine
   accepts (`decision-log.ts:124-141`, `index.ts:6516-6535`). A crash between
   loses the row. **Reason:** with SQLite (step 8) the row and the state
   change are one transaction, and the "full disk" problem of the reference
   becomes a typed error of the store. P46 adds a row for each call.
9. **One state of a card.** The state is in six optional fields (section
   4.3). This is P42. The new fact: question cards have the same problem,
   with `stopped` as a seventh field (`wire.ts:666`).
10. **The raise to Full only through the desktop channel.** The reference
    protects Custom and local Auto from "a bot curling the loopback API"
    (`bot-patch.ts:567-568`, `index.ts:3055-3056`). But its comment says
    "Full access applies from any client that can reach this API"
    (`bot-patch.ts:538-539`). Whether a bot's shell has the credentials of
    that API is not verified (section 9). Its five-step grant exists
    because the server is another process.
    **Reason:** our desktop and our core are one process (D10). A Tauri
    command for each raise is not reachable from a shell, and it needs one
    transaction, not five phases.
11. **The level of a CLI engine during a turn.** The UI text says "A change
    applies from its next step where its AI allows it, otherwise from its
    next turn" (`en.json:3570`). A lower level does not stop a CLI turn,
    except through the desktop downgrade (section 3.9). **Reason:** the
    person reads the picker and thinks that the change is in force. Each
    driver can state a capability `live_level_change: bool`, and the UI can
    say exactly when the change applies.
12. **The document agrees with the code.** `docs/approval-levels.md`
    disagrees with the code in at least these places:
    - "no approval level ever answers a question" (`:352-354`), against
      `question-routing.ts:63-69`
    - the list of engines that offer Edits (`:77`), against
      `approval-mode.ts:24`
    - the text "delegated by" (`:223`), where the code says "handed on by"
    - "the turn runs with exactly that level" (`:230-231`), against the live
      read.

    Also, the error text of `bot-patch.ts:505` does not name `edits`. **Reason:** D19
    says that each feature has one page. A test that reads the levels from
    the code and checks the page stops the drift.
13. **A safety floor that works on Windows.** This is P49. The new facts:
    the floor already has a Windows reader that only tests use
    (`safety-floor.ts:650-676`, commit `9e6c8d5b6` made it inert the same
    day it came, 2026-10-13).
14. **Questions follow the same rule at each level.** `notAsked` answers a
    question at Full in handed-on work (`question-routing.ts:63-69`).
    **Reason:** "a question always reaches a human" is in the header of
    `auto-approve.ts:4`. Two rules for one thing confuse the person. Raise
    it as a choice, not as a silent change.

**Keep as the reference does, because it is correct and tested:**

- The path fails closed: a dead broker, a write error, a late ask and a
  time limit each deny (`permission-proxy.ts:31-37`, `claude.ts:474-487`).
- Options are chosen by `kind`, never by position (`acp/core.ts:579-583`).
- A saved command is exact, and a command with a secret is refused
  (`command-allowlist.ts:26-32`).
- The command is not in the broadcast (`index.ts:6314`).
- The level is sent again at each turn (`contracts.ts:132-133`).
- A delegated level goes only up and is capped by the engine
  (`auto-approve.ts:42-61`).
- The floor changes only an automatic allow, never the answer of a
  person, and a line that it cannot read is never "clear"
  (`safety-floor.ts:3`).
- A saved command is stored only after the engine accepted the request
  (`index.ts:4771-4780`).

### The problems of `changelog.md` section 5 in this feature

| Problem | In this feature | Where |
|---|---|---|
| The approval model changed | Yes. At `ed8cb7278`: the model reviewer of the server is gone (`725d8f472`). Full is the default (`593fd1c5a`, 2026-10-14). A daily limit of sends came and went (`95de9d8f0`, `9071887cc`). "Always allow" became "Allow for this session" where the grant is only for the session (`7c14288f7`). The changelog row about "six places" is right about the places, but Auto is now the engine's own mode | 3.4, 3.13, 3.15 |
| A feature added, then removed or reversed | Yes. These came, then went or changed: <br>- the reviewer of the server with its regex guards <br>- the daily send cap <br>- the floor on Windows <br>- a Chief's level that reached only the first hop (now each hop, `chief-level-every-hop.e2e.test.ts:8-9`) <br>- the level picker in the message box (`c8ced85bb`). <br>A level for a department is a bulk change with no stored level | 3.12, 3.13, 3.16, 5.1 |
| "Busy" and races between bots | Yes. A request after the turn ended: the broker denies it at once (`claude.ts:474-487`), and an automatic allow is not reported when the turn is not current (`index.ts:6497-6510`). In a room, an answer goes to the current speaker, which can be another bot than the one that asked (`bot-messages.ts:770-775`) | 3.5, 3.6, 3.7 |
| A turn or a wait that does not end | Yes. A permission waits 15 minutes. A question waits for ever. A parked question gets one reminder after a day | 3.11, 3.17 |
| The same work done two times | Handled: a replayed answer gives `unavailable` with no second row. A duplicate ask id is denied | 3.6, 3.7 |
| State lost at a restart | Yes. The keys of a request, the room levels and the session allows are in memory, and no sweep closes an engine card at start | 4.4 |
| A secret in the wrong place | Handled: the command is not broadcast, the log is redacted, a saved command with a secret is refused | 3.13, 3.14 |
| Process control on Windows | Yes: the floor does nothing on Windows | 3.12 |
| Engine CLIs that change | Yes. Codex tries again with the old fields when the app server refuses the profile field. Claude Auto can become `default` on a model with no Auto | 3.8 |
| Tests that fail by chance | A clock hook for the 15-minute timer | 6 |

## 9. Not verified

- Whether a bot's shell has the credentials to call `PATCH /api/bots/:id`
  on the loopback address, and so whether a bot can raise itself to Full
  (`bot-patch.ts:538-539`). The auth of the local API was not read.
- How the HTTP route answers when a second device answers first: the
  adapters return `unavailable` for an unknown id (inferred, not read in
  each adapter).
- Whether the recovery of busy tasks at start calls `closeOpenApprovals`.
- The bodies of `configureSession` for Antigravity, Devin, Kiro and Droid,
  and the driver files of Gemini, OpenCode, Kimi and Hermes (from tests
  only).
- Who answers residual requests at Full for Pi (the comment at `pi.ts:658`
  says the server can).
- The handlers of the desktop grant steps `confirm`, `activate` and
  `finalize` (`index.ts:3110-3236`, only by search).
- `liveApprovalMode`, `isUnattended`, `commandAllowlistCandidate` and
  `savedToolGrant`: their bodies.
- The calls of `appendDecision` outside `index.ts` and
  `safety-floor-gate.ts` (outbound hold, MCP chat, skills, app settings,
  mail, phones).
- `redactSecrets` itself (`redact.ts`, covered in
  [`file-modes-atomic-writes-redaction.md`](file-modes-atomic-writes-redaction.md)).
- Whether a Cloud guest's buttons are disabled or refused by the server.
- What commit `741ce6859` ("Narrow what 'always allow' grants") changed.
- The 403 for a Custom template of a new bot
  (`new-bot-defaults.e2e.test.ts:82-84`): the code that sends it.
- The ask tools of Codex, Pi and Muse Code (`codex-questions.ts`,
  `acp/question-requests.ts`, `pi-mcp-extension.ts`).
- Where `isOutboundTool` is defined.
- No test was run. The event examples in section 4 are from the code, not
  from a run.
