# Approval cards: the life of a card, Undo, "always allow", the secret card, masking and the inspector

This file is for the feature row "Docs site `features/approvals-and-inspector.mdx`
and `security/`: approval cards, a change that a bot makes to itself applies
with Undo, the record of an approval result, old cards that close, a narrow
"always allow", the `request_credential` secure card, value masking, the
inspector" of [`../reference-features.md`](../reference-features.md). It is
for step 10 of [`../../plan/README.md`](../../plan/README.md).

- **Reference commit:** `ad27f0716`. Each line number in this file is at
  that commit. The earlier files of step 10 used `ed8cb7278`, so some of
  their line numbers are different.
- **Method:** eight subagents read eight groups of files. Each subagent read
  its files completely, or in recorded ranges, and listed them (section 2).
  The main session checked 24 key claims against the code (section 2.2).
- **The product name:** the reference project puts its own name at the start
  of some texts that the model reads. This file writes that name as `<app>`
  in such quotes.

### What this file adds to earlier research

The earlier files do not repeat here. This file refers to them.

- [`approval-levels.md`](approval-levels.md) has the five levels, the
  decision "ask or allow" (`autoVerdict`), the answer route (its section
  3.7), the card fields (its 4.3), the decision log (its 3.13), the command
  allowlist in short (its 3.14) and the receipt with Undo in one paragraph
  (its 5.2).
- [`chat-driver-tool-calls.md`](chat-driver-tool-calls.md) has the approvals
  inside the tool loop of the chat API driver.
- [`security-model.md`](security-model.md) and
  [`write-only-secrets.md`](write-only-secrets.md) have the Vault, the secret
  card in short and where a key is stored.
- [`file-modes-atomic-writes-redaction.md`](file-modes-atomic-writes-redaction.md)
  has the redaction functions and the fact that a streamed `content.delta`
  goes to each window with no mask (its section 3, steps 4 and 5).

This file adds:

- the full life of an engine permission card: how it opens, the 15-minute
  fail-safe, what closes it, a second answer, and parking of a turn on a card.
- the expiry rule at this commit: questions do not expire, and permission
  cards keep a 15-minute fail-safe (section 8.2, problem 4).
- the change line with Undo for all seven kinds of change, with the data
  that Undo needs and each refusal.
- a contradiction: the docs say a routine for another bot asks, and the code
  applies it with no card.
- the three kinds of "remember this" on a card, and what "never remembered
  for anything that sends" really covers.
- the `request_credential` tool and its card from start to end, with each
  route and each refusal.
- new masking gaps: the replay buffer of the live stream, the live path of
  the inspector, the 50 ms merge window of the event log, and a raw
  `SKILL.md` kept in a card.
- the inspector panel, its data, its limits and its route.
- the parts out of our plan, with their files only.

## 1. In short

A bot acts through an **engine** (the CLI or API that runs the model). When
the engine wants to do an action that the approval level does not allow, it
sends a **permission request**. The server of the reference project shows
the request as an **approval card**: a message of kind `options` in the
conversation. The person answers on the card, and the server sends the
answer back to the engine.

Special terms, each explained one time:

- **Approval card:** a stored message with a `card` object. It has a
  `requestId`, a `tool`, the options and its state. The state is a set of
  optional flags: `answered`, `dismissed`, `expired`, `stopped`, `undone`.
- **Composer panel:** the box above the message field. A waiting card has
  its buttons only there. The card in the transcript has no buttons.
- **Change line (receipt):** a change that a bot makes to itself (profile,
  model, skills, team setup, team memory, routines and triggers) applies at
  once, at every level. It leaves a card with `autoApplied: true`. The
  window shows it as one line with **Details** and **Undo**.
- **Undo:** a route that puts the old values back. It refuses with
  "Changed since, so it can't be undone here." when the thing changed after
  the change.
- **Owner card:** the one case where a self-change still waits on a card: a
  turn on a personal Cloud that its owner did not drive (a guest, or a
  webhook). This case is out of our plan.
- **Always allow:** a saved grant for one exact MCP tool of one engine
  instance and one server setup. It never matches a tool that sends.
- **Saved command:** a saved grant for one exact shell command in one
  folder with one engine instance.
- **Allow for this session:** nothing is saved by the server. The engine
  gets its own suggested rules and stops asking until its session ends.
- **Secret card (`request_credential`):** a card where the person types a key
  or a secret. The value never goes into the conversation. The bot gets
  "configured", a one-use reference, or a path to a private file.
- **Held value:** a secret that the server knows by its exact value. The
  server masks it as `••••••`. A window cannot do this, because only the
  server holds the values.
- **Inspector:** a side panel with three tabs: the run log, the runtime
  events and the raw engine messages of one thread.
- **Vault:** the encrypted store of the reference project for secrets that
  a person saved. A config file holds only a pointer `vault:<id>`.
- **Chief of Staff (Chief):** a bot that may coordinate and set up the other
  bots of a department.
- **Superseded:** a card that a newer card for the same thing replaced. Its
  buttons no longer work.
- **Replay buffer:** the server keeps recent live frames in memory, and
  sends them again to a window that reconnects.
- **HPKE:** a public-key encryption scheme. A phone uses it to seal a secret
  to the key of the server.
- **Parked turn:** a turn that ended with a server card still open. The
  runtime keeps its node in the state `needs_input` until the card is
  answered.

The main findings:

1. **The engine owns the wait, not the server.** The open request lives in
   the memory of the driver. The first answer deletes it. A second answer
   gets `unavailable` (`server/drivers/claude.ts:499-500`, `:571-577`). The
   route then answers HTTP 200 with `outcome: "unavailable"`, the same as
   for an id that never existed (`server/respond-replay.e2e.test.ts:117-127`).
2. **Permission cards still expire after 15 minutes**, in the Claude, Codex
   and ACP drivers (`claude.ts:448`, `:511`, `server/drivers/acp/core.ts:673-676`).
   The release text, as `../changelog.md:358` quotes it, says "Question and
   approval cards no longer expire". That is wider than the change. The
   commit says "Tool permission cards keep their fifteen-minute fail-safe"
   (commit `b82764109`), and the code agrees with the commit.
3. **A restart does not close an engine permission card.** The start sweep
   closes peer cards, "your computer" cards and computer asks only
   (`server/index.ts:9461-9465`). A later click gets "Couldn't deliver that
   answer…".
4. **"Never remembered for anything that sends" covers MCP grants only.** A
   shell command is never "outbound", so a saved `curl -X POST …` runs with
   no question (`server/auto-approve.ts:114-115`). The card also offers
   "Allow for this session" for a send (`claude.ts:1245`,
   `server/request-card.ts:29`, `src/components/PendingApproval.tsx:315`).
5. **The docs disagree with the code about routines.** The docs say a
   routine for another bot asks unless the conversation has Full access
   (`apps/docs/content/docs/features/approvals-and-inspector.mdx:21`). The
   code applies each routine change with no card
   (`server/routine-requests.ts:1008-1010`, `:1022-1025`). A test asserts it
   (`server/routine-requests.test.ts:1973-1988`).
6. **Streamed text leaves the server with no mask,** and the in-memory replay
   buffer keeps it (`server/harness/public-reply.ts:1-3`,
   `server/index.ts:6308-6310`). The window masks shapes only. The inspector
   shows the raw live events until it reloads from disk.

## 2. Files read completely

### 2.1 The files, by group

The reference project is at `ad27f0716`. No file under `enterprise/` was
opened. A "range" entry gives the lines read.

**A. The card on the server** (open, answer, second answer, park, close)

| File | Lines |
|---|---|
| `packages/phone-protocol/src/live-approval.ts` | 145 |
| `server/request-card.ts` | 34 |
| `server/host/resumable-cards.ts` | 52 |
| `server/host/live-approval.ts`, `.test.ts` | 17, 26 |
| `server/guarded-requests.ts`, `.test.ts` | 63, 63 |
| `server/outbound-requests.ts`, `.test.ts` | 90, 70 |
| `server/host/access-requests.ts`, `.test.ts` | 123, 102 |
| `server/host/handoff-requests.ts`, `.test.ts` | 151, 173 |
| `server/host/mcp-requests.ts`, `.test.ts` | 180, 172 |
| `server/parked-cards.e2e.test.ts` | 127 |
| `server/respond-replay.e2e.test.ts` | 129 |
| `server/runtime/questions.ts` | 33 |
| `server/runtime/types.ts` | 402 |
| `server/decision-log.ts` | 275 |
| `server/host/leftover-peer-cards.ts` | 18 |
| `docs/plans/2026-08-18-001-fix-permission-broker-ask-id-collision-plan.md` | 124 |

Ranges: `packages/phone-protocol/src/wire.ts` (1000 lines) 405-440, 520-545,
575-592, 630-715, 740-760, 815-830. `server/index.ts` (15271 lines)
1040-1135, 1895-2060, 2225-2260, 3250-3300, 3312-3358, 4230-4245,
4640-4960, 5000-5030, 6425-6625, 8600-8650, 8730-8752, 9132-9270,
9396-9425, 9455-9475, 11175-11345, 11745-11885.
`server/routes/bot-messages.ts` (874) 1-31, 100-259, 590-874.
`server/drivers/claude.ts` 338-352, 441-593, 1225-1290, 1344-1354,
1960-2000. `server/drivers/codex.ts` 100-108, 664-674, 825-850.
`server/drivers/acp/core.ts` 318-326, 502-511, 600-690.
`packages/phone-protocol/src/runtime-events.ts` 120-190.
`packages/phone-protocol/src/ask-question.ts` 50-75.
`server/message-db.ts` 545-572. `server/waiting-on-person.ts` 46-86.
`server/host/trust-answers.ts` 20-50.

**B. The narrow "always allow"**

| File | Lines |
|---|---|
| `server/always-allow.ts`, `.test.ts` | 90, 114 |
| `src/state/always-allow-save.test.ts` | 99 |
| `server/mcp-grant-spec.ts`, `.test.ts` | 100, 205 |
| `packages/phone-protocol/src/outbound.ts` | 179 |
| `server/command-allowlist.ts`, `.test.ts`, `.e2e.test.ts` | 151, 151, 160 |
| `src/components/PendingApproval.tsx` | 373 |
| `src/components/PendingApproval.command-allowlist.test.ts` | 183 |
| `src/components/CommandAllowlistDialog.tsx`, `.test.ts`, `.escape.test.ts` | 197, 64, 96 |
| `packages/phone-protocol/src/command-allowlist.ts` | 18 |
| `server/provider-tool-allow.ts`, `.test.ts` | 50, 70 |
| `server/auto-approve.ts` | 165 |

Ranges: `src/state/store.tsx` (3277) 85-105, 230-245, 300-400, 680-700,
2200-2235, 2405-2490. `server/routes/bot-settings.ts` (254) 185-254.
`server/routes/bot-patch.ts` (783) 496-504, 605-660, 725-736.
`server/store.ts` (2256) 108-118, 1395-1408, 1700-1745, 2100-2160.
`server/request-auth.ts` (753) 395-420, 525-540.
`server/permission-proxy.ts` (263) 200-245. `shared/outbound.test.ts` 1-85.
`server/index.test.ts` 7860-7880, 9290-9372.

**C1. Self-changes: profile, model, the Undo route**

| File | Lines |
|---|---|
| `server/direct-apply.ts` | 32 |
| `server/routes/undo.ts` | 23 |
| `server/profile-requests.ts`, `.test.ts` | 535, 583 |
| `server/profile-requests-browser-profile.test.ts` | 193 |
| `server/model-requests.ts`, `.test.ts` | 347, 276 |
| `server/profile-revision.ts` | 26 |
| `server/activity.ts` | 361 |
| `server/profile-versions.ts` | 174 |
| `packages/phone-protocol/src/profile-request.ts`, `model-request.ts` | 40, 22 |
| `server/profile-card-lifecycle.e2e.test.ts` | 94 |

Ranges: `server/index.ts` 1040-1075, 3015-3045, 9085-9350, 10993-11050,
12180-12200, 13236-13330. `server/no-omb-cards.e2e.test.ts` 1-114.
`server/cloud-personal.e2e.test.ts` 615-660. `server/index.test.ts`
12005-12080.

**C2. Self-changes: team setup, team memory, skills, routines, triggers**

| File | Lines |
|---|---|
| `server/team-setup-requests.ts`, `.test.ts` | 519, 784 |
| `server/team-memory-requests.ts` | 103 |
| `server/team-memory.ts` | 354 |
| `server/host/skill-switch-host.ts` | 242 |
| `server/skill-switch.ts` | 99 |
| `server/routine-requests.ts` | 1468 (all, in three ranges) |
| `server/webhook-requests.ts`, `.test.ts` | 277, 166 |
| `server/app-trigger-requests.ts` | 240 |
| `server/cloud-routine-level.ts` | 82 |
| `server/routine-unattended-approval.e2e.test.ts` | 79 |
| `docs/verification/skill-approval-lifecycle.md` | 52 |

Ranges: `server/routine-requests.test.ts` (2105) 1-116, 200-305, 1701-1790,
1940-2105, and the name of each test.

**D. The UI of the cards and of the change line**

| File | Lines |
|---|---|
| `src/components/ApprovalCard.tsx` | 598 |
| `src/components/ApprovalCard.test.ts` | 911 |
| `src/components/ApprovalCard.i18n.test.ts` | 284 |
| `src/components/ApprovalCard.cloud-guest.dom.test.ts` | 50 |
| `src/components/ApprovalCard.team-memory.test.ts` | 33 |
| `src/components/ApprovalCard.wait-details.test.ts` | 54 |
| `src/components/thread-approval.tsx` | 60 |
| `src/components/OptionsCardRow.tsx` | 51 |
| `src/lib/approval-summary.ts`, `.test.ts` | 98, 122 |
| `src/lib/approval-request-contract.test.ts` | 155 |
| `src/lib/card-answer.ts`, `.test.ts` | 25, 32 |
| `src/lib/sidebar-attention.ts`, `.test.ts` | 53, 26 |
| `src/components/bot-panel/SoulChanges.tsx` | 39 |
| `src/testing/thread-approvals.tsx` | 31 |
| `src/state/card-answer-recovery.test.ts` | 155 |
| `scripts/testing/approval-ui-smoke.cjs` | 79 |
| `docs/screenshots/approval-card.png` | image |

Ranges: `src/state/store.tsx` 60-140, 676-700, 760-780, 825-860,
1060-1110, 1273-1300, 2094-2140, 2170-2225, 2415-2520.
`src/components/ChatView.tsx` 655-680, 880-910, 1055-1070.
`src/components/Composer.tsx` 150-175, 428-445, 700-760, 900-915.
`DESIGN.md` (421) 50-66, 200-208.

**E. The secret card and masking**

| File | Lines |
|---|---|
| `server/host/secret-cards.ts`, `.test.ts` | 692, 595 |
| `server/routes/secret-cards.ts`, `.test.ts` | 179, 125 |
| `src/components/SecretRequestCard.tsx`, `.test.ts` | 311, 427 |
| `server/secret-requests.e2e.test.ts` | 214 |
| `server/credential-request.test.ts` | 115 |
| `scripts/testing/secret-card-descriptions.test.ts` | 115 |
| `server/message-redaction.ts` | 146 |
| `shared/redact.ts` | 168 |
| `server/redact.ts` | 48 |
| `server/server-text-redaction.test.ts` | 30 |
| `src/state/live-reply.ts` | 370 |
| `server/harness/public-reply.ts` | 17 |
| `server/sse-fanout.ts` | 69 |
| `server/secret-vault.ts` | 294 |
| `server/vault/value-limits.ts` | 8 |
| `packages/phone-protocol/src/phone-secret-envelope.ts` | 19 |

Ranges: `server/harness/live-steps.ts` 1-80. `server/harness/bus.ts`
95-200. `server/index.ts` 1990-2025, 4640-4720, 6278-6340, 14095-14114.
`server/drivers/agents-catalog.ts` 445-500. `server/drivers/agents-call.ts`
595-625, 960-1000. `packages/phone-protocol/src/wire.ts` 715-785.
`packages/phone-protocol/src/credential-request.ts` 150-200, 273-324.
`server/vault-store.ts` 591-657. `server/phone-activity.ts` 205-260.

**F. The inspector**

| File | Lines |
|---|---|
| `shared/inspector.ts` | 21 |
| `src/lib/inspector.ts`, `.test.ts` | 197, 130 |
| `src/lib/inspector-window.ts`, `.test.ts` | 72, 115 |
| `src/components/InspectorPanel.tsx` | 270 |
| `server/thread-events.ts`, `.test.ts` | 274, 251 |
| `server/host/thread-log-sweep.ts`, `.test.ts` | 457, 312 |
| `src/components/ChatMoreMenu.tsx`, `.test.ts` | 289, 252 |
| `src/hooks/use-remembered-side-panel.ts`, `.dom.test.ts` | 62, 164 |
| `src/components/lazy-screens.tsx` | 161 |
| `src/components/live-panels.test.ts` | 345 |
| `src/components/RunLog.tsx` | 63 |
| `src/lib/taskTimeline.ts` | 66 |
| `server/drivers/native.ts` | 118 |
| `server/harness/bus.ts` | 317 |
| `server/thread-log-rotation.ts` | 77 |

Ranges: `src/App.tsx` (553) 110-128, 180-192, 310-325, 455-490.
`server/routes/status.ts` (253) 1-160. `src/state/store.tsx` 522-530,
925-956, 1425-1500, 1820-1826.

**G. The documents and the parts out of our plan**

| File | Lines |
|---|---|
| `apps/docs/content/docs/features/approvals-and-inspector.mdx` | 29 |
| `apps/docs/content/docs/security/index.mdx` | 29 |
| `apps/docs/content/docs/security/permissions-and-secrets.mdx` | 311 |
| `apps/docs/content/docs/security/analytics.mdx` | 210 |
| `docs/approval-levels.md` | 461 |
| `server/auto-approve.ts` | 165 |

Ranges: `.oss-scanner/threat_model.md` (344) 70-275.
`server/host/outside-lineage.ts` (161) 1-15, 60-140. The first lines of
each out-of-scope file in section 3.11.

### 2.2 Checks of the main session

The main session read these lines itself and found that each claim agrees
with the code.

1. `HEAD` is `ad27f0716`.
2. A `content.delta` goes out unchanged. Only `item.completed` text is
   masked (`server/harness/public-reply.ts:1-3`, `:13-16`).
3. The live broadcast removes `command`, `commandLine` and `reads` from
   `request.opened`, with the comment "the bus's persistence redactor does
   not scrub the live event" (`server/index.ts:6308-6310`).
4. The Claude broker has a 15-minute timer for each ask that is not a
   question (`server/drivers/claude.ts:448`, `:511`).
5. `finish` deletes the pending entry first and returns when it is gone
   (`claude.ts:499-500`). `answer` returns false for an unknown id or the
   wrong kind (`:571-577`).
6. The ACP timer of 15 minutes is set with no test of `isQuestion`
   (`server/drivers/acp/core.ts:673-676`). `isQuestion` is in scope in the
   same block (`:601-668`).
7. The start sweep closes three kinds of card only (`server/index.ts:9461-9465`).
8. On `unavailable`, `answerRequest` closes an unanswered card and adds the
   line "Couldn't deliver that answer…" (`server/index.ts:4795-4811`).
9. `providerToolAllowKey` returns null for an outbound tool and for device
   tools (`server/provider-tool-allow.ts:33-43`).
10. `autoVerdict` checks the outbound guard before saved grants
    (`server/auto-approve.ts:107-123`).
11. The window saves the MCP grant before it answers the card
    (`src/state/store.tsx:2436-2448`).
12. `allowSession` is set for each permission except computer tools, and
    the card keeps it when the request is not a sandbox widening and not a
    guest turn (`claude.ts:1245`, `server/request-card.ts:29`).
13. The composer offers "Allow for this session" when there is no
    `allowKey` and `allowSession` is set (`src/components/PendingApproval.tsx:315-317`).
14. The `/always-allow` route needs an open card with the same key and the
    right to answer it (`server/routes/bot-settings.ts:225-236`).
15. `direct-apply.ts` has the owner-card rule, `UNDO_STALE` and
    "Every trigger change applies since Triggers v2" (`server/direct-apply.ts:1-32`).
16. Profile Undo refuses when `profileRevision` differs (`server/profile-requests.ts:394-404`).
17. Model Undo compares only the current selection (`server/model-requests.ts:258-261`).
18. The Undo route writes one `user-undone` row and answers
    `alreadyUndone` on a second Undo (`server/index.ts:9335-9345`).
19. Team setup Undo treats a created bot with more than one task or a
    person line as changed (`server/team-setup-requests.ts:469-475`). A
    deletion has no `before` (`:412`).
20. A submitted routine always applies (`server/routine-requests.ts:1008-1010`,
    `:1022-1025`), and the test of another bot's routine at Ask
    (`server/routine-requests.test.ts:1973-1988`). The docs line is
    `approvals-and-inspector.mdx:21`.
21. The `provided`, `resume` and `dismiss` routes of a secret card do not
    call `threadVisible` or the answer refusal (`server/routes/secret-cards.ts:114-163`).
    The `saved` and `use` routes do (`:60-62`). `resume` and `dismiss` are
    in the client allow list (`server/request-auth.ts:393`).
22. The inspector route computes `shown` and does not use it
    (`server/routes/status.ts:52`, `:119-134`).
23. The window masks streamed text by shape only, because the held-value
    scrub does nothing in a client (`src/state/live-reply.ts:181-186`,
    `shared/redact.ts:125-127`).
24. `scrubbedSkillRequest` masks `preview`, `references`, `gist`, `source`
    and `warnings`, and keeps `previous` as it is (`server/skill-request-card.ts:90-110`).
    `previous.preview` is the full `SKILL.md` text (`server/host/skill-switch-host.ts:60`, `:72`,
    from group C2). So a skill-delete receipt keeps the raw file in the
    stored card.

## 3. How it works

### 3.1 An engine asks: from the request to the card

The Claude driver is the example. The ACP and Codex drivers do the same
steps with their own wire.

1. The permission proxy writes `{t:"ask", id, kind, tool, input}` to the
   socket of the broker (`server/drivers/claude.ts:472-498`).
   - A closed broker answers at once with "the turn ended" (`:475-481`).
   - An ask between turns also gets an answer at once (`:482-488`).
   - An id that is already open is denied with "<app>: duplicate ask id —
     skipping this request." (`:489-497`). This is the fix of
     `docs/plans/2026-08-18-001-fix-permission-broker-ask-id-collision-plan.md:17`.
2. The broker starts a timer of 15 minutes for each ask that is not a
   question (`:448`, `:511`), keeps the ask in its `pending` map, and calls
   `onAsk` (`:513-514`).
3. `onAsk` emits `request.opened` with `requestId = ask.id`, the shell
   command, the files read, `requiresExplicitApproval` (a sandbox widening),
   `nativeReview`, `allowSession` and `approvalScope` (`claude.ts:1225-1252`).
4. The bus listener pauses the stall watchdog while the person is asked
   (`server/index.ts:5009`).
5. The central handler (`server/index.ts:6433-6582`) decides. The decision
   itself is in [`approval-levels.md`](approval-levels.md) 3.4 and 3.5. Here
   are only the steps for the card:
   1. It builds the command candidate and the MCP grant key (`:6449-6460`).
   2. If the verdict allows, it sends the allow. It writes a chip and an
      `auto-approved` decision row only after the engine takes the answer
      (`:6503-6531`). No card is made.
   3. Else it appends the card (`:6535-6551`). The title is "Local computer
      approval", "Approval needed" or "Your bot has a question"
      (`:6539-6544`).
   4. It keeps `requestId → message id` in the memory map
      `askMessageByRequest` (`:6552`), and the command candidate in
      `pendingCommandRules` (`:6553`).
   5. It writes a `card-shown` decision row (`:6554-6565`).
   6. It sets the activity of the task to `waiting-on-you`, writes the
      "waiting" chip and sends a notification (`:6566-6580`).
6. The broadcast copy of `request.opened` has no `command`, `commandLine`
   and `reads` (`:6309`). The event log on disk keeps them (section 3.10).
7. The card fields come from `runtimeRequestCardFields`
   (`server/request-card.ts:10-33`):
   - `options`: the choices of the engine, else `["Allow","Deny"]` for a
     permission and `[]` for a question (`:19`).
   - `allowSession` only for a permission that the engine offered for the
     session, that is not a sandbox widening, and not in a guest turn
     (`:28-29`).

### 3.2 The person answers

1. The window shows the buttons only in the composer panel (section 5.1). A
   button dispatches `decideRequest` (`src/components/PendingApproval.tsx:276-287`).
2. The reducer does not change the card (`src/state/store.tsx:1085-1086`).
   The side effect (`:2422-2458`):
   1. It waits for unsaved settings of the bot (`:2117-2136`).
   2. For "Always allow" on an MCP tool, it saves the grant first
      (section 3.5).
   3. It sends `POST /api/threads/:id/respond` with
      `{requestId, behavior, message?, always?, rememberCommand?, reviewedSha256?}`.
      A deny sends `message: "Denied by the user."` (`PendingApproval.tsx:282`).
   4. An error goes to the error banner of the chat (`store.tsx:2453-2457`).
      The card stays open, so the person can try again.
3. The route (`server/routes/bot-messages.ts:674-800`):
   1. A bad `behavior` gives 400 "behavior must be allow, deny, or answer".
   2. `cardAnswerRefusal` gives 403 (`server/index.ts:1047-1061`). A local
      service may only deny. On a shared workspace, only the person who
      started the conversation, the person who sent the request, or an
      admin may answer.
   3. `rememberCommand` needs an owner or admin and an open command
      candidate (`index.ts:4728-4734`).
   4. Inside `answeringCardAs` (`index.ts:1112-1128`), it tries the cards
      that the server owns first: access, trust, skill, routine, team setup,
      MCP, profile, model, quota and computer asks. Then it calls
      `answerRequest`.
4. `answerRequest` (`index.ts:4737-4813`):
   1. It reads the card before it sends the answer (`:4747-4753`).
   2. It calls `respondToRequest(threadId, requestId, {behavior, message, always})`
      on the engine of the running turn. `always` passes only when the card
      offered `allowSession` (`:4761`). A throw becomes `unavailable`.
   3. On `allowed-once` with `rememberCommand`, it saves the command rule.
      A failure adds the line "Command allowed once, but its allowlist rule
      could not be saved. Try again from the permissions menu." (`:4766-4775`).
   4. It writes `user-approved` or `user-denied` only when the outcome is not
      `unavailable` (`:4782-4794`).
   5. On `unavailable`, it closes an unanswered card with
      `answered: "unavailable", dismissed: true` and adds "Couldn't deliver
      that answer — the request is no longer open, so the action was not
      run" (`:4795-4811`).
5. The driver resolves the ask. `finish(…, "user")` emits `request.resolved`
   with `source: "user"` (`claude.ts:499-510`).
6. The handler of `request.resolved` (`index.ts:6583-6611`) closes the card:
   `answered: behavior`, `dismissed: source !== "user"`, and `expired: true`
   on a timeout. It deletes the map entry.
7. After the work, `answeringCardAs` writes `answeredBy` one time, only for
   a card that is answered or dismissed and not `unavailable`
   (`index.ts:1121-1125`). `answeredBy` is
   `{kind: "session", name, person?} | {kind: "loopback"} | {kind: "worker"} | {kind: "bot", name}`
   with `via?: "call" | "reaction"` (`packages/phone-protocol/src/wire.ts:420-433`).
8. The window gets a `message.patch` frame and replaces the message
   (`store.tsx:1273-1300`). The composer panel then drops the card.

### 3.3 The same card answered two times

1. **In the driver:** the first `finish` deletes the pending entry. A second
   `answer` returns false, so the outcome is `unavailable`
   (`claude.ts:499-500`, `:571-577`, `codex.ts:825`, `acp/core.ts:627`).
2. **In the server:** `answerRequest` writes no second decision row and no
   "Couldn't deliver" line when the card is already answered
   (`index.ts:4783`, `:4802-4806`). `answeredBy` is written one time
   (`:1123`).
3. **The reply:** HTTP 200 `{ok: true, outcome: "unavailable"}`
   (`respond-replay.e2e.test.ts:117-121`). An id that was never issued gets
   the same reply, plus the "Couldn't deliver" line (`:123-127`). A client
   cannot tell the two cases apart.
4. **Other paths** have typed answers:
   - a live voice call: 409 "The request is no longer open."
     (`index.ts:4837-4838`, `:4858-4859`).
   - an MCP card: 409 while it applies, then `alreadySettled: true`
     (`server/host/mcp-requests.ts:99-117`).
   - an access request: 409 "This has already been answered."
     (`server/host/access-requests.ts:98`).
   - an outbound hold: `already_settled` with the first answer
     (`server/outbound-requests.ts:50`).
   - profile, model and skill cards: `alreadySettled: true`
     (`index.ts:9227-9229`, `:9262-9264`, `:11193-11201`).
5. **In the window:** the buttons have no busy state and are never disabled
   while the answer is sent (`PendingApproval.tsx:337-363`). A double click
   sends two POST requests. The server refuses the second one.

### 3.4 What closes an old card

| Event | What closes | Line |
|---|---|---|
| No answer in 15 minutes | The driver denies with source `timeout`. The card gets `expired: true, dismissed: true`. The model reads "<app>: nobody answered this permission request in time. Skip this action and finish what you can without it." | `claude.ts:344-345`, `:511`; `codex.ts:838`; `acp/core.ts:673-676`; `index.ts:6603-6604` |
| The turn ends | The driver drains each open ask with source `system`. A persistent question stays open | `claude.ts:564-569`, `:1350`; `codex.ts:671`; `acp/core.ts:508`; `ask-question.ts:63-65` |
| Stop | `closeOpenApprovals` sets each open card (not a routine, skill, inbox or persistent question card) to `answered: "unavailable", dismissed: true`. `stopCards` sets secret, connector and sign-in cards to `stopped` | `index.ts:4867-4881`, `:2013-2025`; `server/host/resumable-cards.ts:12-15` |
| A new turn | The generation check keeps the cards of the new turn open | `index.ts:2242-2244` |
| "Ask on all threads" (emergency downgrade) | Interrupts all threads and closes their approvals. Other level changes close nothing | `index.ts:3281-3286`, `:8616-8650` |
| Engine reload, change of a company connection | `closeOpenApprovals` for each affected thread | `index.ts:11761`, `:11784`, `:11860`, `:11878` |
| Restart | Closes peer cards, "your computer" cards and computer asks only. **An engine permission card stays open on disk** | `index.ts:9461-9465`; `server/host/leftover-peer-cards.ts:6-17` |
| A newer card about the same thing | An MCP card and a sign-in card supersede the older one | `mcp-requests.ts:65-75`; `handoff-requests.ts:117-122` |

Other time limits on cards: the outbound hold "Send on your behalf?" lasts
9 minutes (`server/outbound-hold.ts:13`). A sign-in hand-off lasts 30
minutes, and a restart starts its timer again
(`server/host/handoff-requests.ts:76`, `:104`, `:129-139`). A parked
runtime wait has no limit by default (`server/runtime/types.ts:384-385`).

After a timeout, the final text of the turn gets "[<app>: nobody answered
the approval for "…" in time, so it did not run. Do not report it as done;
it needs the person's approval.]" (`server/waiting-on-person.ts:78-85`,
used at `index.ts:5022`). A routine run that waits fails with "Stopped:
nobody answered the approval to use …" (`server/routine-unattended-approval.e2e.test.ts:71-73`).

### 3.5 A turn parked on a card

Only cards that the server owns can park a turn. An engine permission card
cannot, because it lives only while the engine process waits.

1. At the end of a turn, `hostTurnResult` collects the open "resumable"
   cards of the turn (`index.ts:1957-1975`). Resumable cards are team setup
   and MCP cards, connector cards, secret cards and sign-in cards that are
   not resumed, superseded or stopped (`server/host/resumable-cards.ts:19-46`).
2. If such cards are open, the turn returns
   `cards: {question: "Waiting on the person: …", ids}`. The runtime node
   goes to `needs_input` (`server/runtime/types.ts:54`, `:148-150`).
3. An answer calls `answerCardNode(threadId, messageId, text)`. It finds the
   node that holds that card and answers it (`index.ts:1993-1998`).
4. If no node takes the answer, the card keeps its result. The next check
   or the next start gives it to the node (`index.ts:1912-1954`).
5. At start, `reconcileParkedRoots` answers nodes whose card was answered
   while the server was off. It releases nodes whose card cannot answer,
   with "The card it waited on was replaced or closed"
   (`index.ts:9403-9404`, `:9419-9421`; `server/parked-cards.e2e.test.ts:99-127`).

### 3.6 A change that a bot makes to itself, and Undo

**The rule.** "A change a bot asks for (its own or a teammate's skills,
profile, model, team setup or team memory) applies at once at every level,
with an Undo notice where undoing means something" (`server/direct-apply.ts:1-4`).
`appliesNow` gives `"full-access"` or `"level"` for the decision log, or
null when the owner must confirm (`:17-20`). The server wires it as
`ownerMustConfirm: cloudGuestDriven(threadId) || !connectorThread(botId, threadId)`
(`server/index.ts:3037-3039`).

**Apply** (profile as the example, `server/profile-requests.ts:264-385`):

1. The internal route checks the body with zod (400 "invalid profile
   proposal"), the sender (403 "unknown sender") and that the thread is the
   sender's (403) (`index.ts:13236-13249`).
2. `prepare` checks and redacts the reason (at most 500 characters) and each
   field (`profile-requests.ts:110-175`). The instructions file (soul) can
   be 24000 bytes.
3. It keeps `before` for each changed field. When redaction changes a
   `before` text, `exactBefore` is false, and the change gets no Undo
   (`:286-303`, `:380`).
4. It pins `expectedRevision`, a sha256 of the profile plus
   `lastProfileRequestId` (`server/profile-revision.ts:19-26`).
5. It appends the card with `options: []` and `dismissed: true`, then
   resolves it as "allow" (`:345-363`). The profile and its receipt id are
   written in one patch (`:503-504`). A history row is written to
   `<bot folder>/history.ndjson` (`server/profile-versions.ts:84-101`).
6. `recordAutoApplied` sets `autoApplied: true` and
   `undo: {appliedRevision}` (`:371-385`). It swallows each error.
7. The route writes an `auto-approved` decision row with source `level` or
   `full-access` and answers 201 (`index.ts:13259-13264`).

**Undo** (`POST /api/threads/:id/undo {requestId}`, `server/routes/undo.ts:13-20`,
`server/index.ts:9296-9346`):

1. The person must be allowed to answer that card with "allow"
   (`cardAnswerRefusal`, 403).
2. The card is found by `requestId` (404 "this change is no longer in the
   conversation"). The proposing bot comes from the message, "never from the
   card payload" (`:9300-9302`).
3. The service of the card kind does the Undo (`:9321-9327`). Each service:
   1. answers `already_undone` for a card with `undone`.
   2. refuses a card that is not `autoApplied` with
      "Only a change that applied on its own can be undone here." (409).
   3. refuses a card of another conversation (403).
   4. refuses with `UNDO_STALE` (409, `code: "changed-since"`) when the
      thing changed after the change.
   5. puts the old values back and sets `undone: true` on the card.
4. The route writes one `user-undone` decision row and answers
   `{ok: true, undone: true, alreadyUndone?: true}` (`:9339-9345`). A second
   Undo writes no row.

**How each kind decides "changed since":**

| Kind | Data kept on the card for Undo | "Changed since" means | Line |
|---|---|---|---|
| Profile | `before`, `undo.appliedRevision` | the revision of the whole profile differs, or the bot is gone | `profile-requests.ts:401-404` |
| Default model | `before`, `selection` | the current selection is not `selection`. No revision | `model-requests.ts:258-261` |
| Team setup | `undo: {created, before, revisions}` | a bot is gone, its revision differs, or a created bot has more than one task or a person line | `team-setup-requests.ts:469-475` |
| Team memory | `teamMemoryRequest.revision` | the fact is not accepted, its revision differs, or a replaced fact has a new accepted fact | `team-memory.ts:292-304` |
| Skill switch | `previous` (delete only) | the skill is missing, fixed, or not in the state that the change left | `skill-switch-host.ts:217-239` |
| Routine | `undo: {appliedUpdatedAt, before?}` | `updatedAt` differs (update, pause, resume). Create checks only that the routine exists | `routine-requests.ts:1093-1176` |
| Webhook, app trigger | `undo: {appliedUpdatedAt, before?}` | the same as routines | `webhook-requests.ts:234-277`; `app-trigger-requests.ts:196-240` |

**Cases with no Undo:**

- A bot deletion: `before` is undefined, so `undo` is never set
  (`team-setup-requests.ts:412-414`; test `.test.ts:712-719`).
- A routine or test run (`run_now`): "A routine run can't be undone."
  (`routine-requests.ts:1118`).
- A profile change whose old text held something like a credential
  (`profile-requests.ts:380`; test `.test.ts:574-582`).
- A routine with attachments, or with a name or prompt that redaction would
  change (`routine-requests.ts:891-892`).
- A change whose receipt patch failed: `recordAutoApplied` swallows the
  error, and Undo then says "Only a change that applied on its own…"
  (`profile-requests.ts:371-385`, `routine-requests.ts:1089-1090`).

**Team setup Undo in more detail** (`team-setup-requests.ts:458-493`):

1. Any touched bot that is busy gives "Wait for the bots this setup changed
   to finish their work, then undo." (`:476`).
2. It checks `deletionRefusal` for each created bot first, so that nothing
   is deleted while one bot is blocked (`:477-478`).
3. It deletes the created bots one by one, and checks "changed" again inside
   each delete (`:480`).
4. It restores the `before` fields as actor "user", via "revert", and the
   Chief's `managedSections` (`:481-487`).
5. An error returns the redacted message, at most 500 characters. The card
   is then not `undone` (`:488-490`).

**Routines, webhooks and app triggers never wait on a card.** `submit`
always applies, and the grant only names why (`routine-requests.ts:1008-1010`).
Webhook and app-trigger services have no grant parameter
(`webhook-requests.ts:1-2`, `app-trigger-requests.ts:1-2`). A deleted
routine comes back with a **new** id (`routine-requests.ts:1144-1158`). A
deleted webhook or app trigger comes back with its old id, URL and secret
(`webhook-requests.ts:267-268`; test `.test.ts:123-128`).

**The owner card** (out of our plan): a Cloud turn that the owner did not
drive is a special case. In it, team setup, team memory, skill, profile and
model changes show a card with "Confirm" and "Cancel" (or the words of the kind).
The change waits for the owner
(`server/direct-apply.ts:1-4`, `profile-requests.ts:351`,
`model-requests.ts:218`, test `server/cloud-personal.e2e.test.ts:615-652`).

### 3.7 The three kinds of "remember this"

| Kind | What is saved | Where | Who may save | Matched by | Line |
|---|---|---|---|---|---|
| Always allow (MCP tool) | `provider-tool:<engine instance>:<server>:<tool>:<16 hex of sha256 of the server config>` | `alwaysAllow` of the bot and a copy on each thread, at most 200 | anyone who may answer the card | the thread list or the bot list | `server/provider-tool-allow.ts:33-50`; `server/always-allow.ts:1-9` |
| Saved command | `{command, cwd, providerInstanceId}` for one bot | `command-allowlist.json`, mode 0600, at most 200 rules for each bot | owner or admin | the exact strings | `server/command-allowlist.ts:9-61`, `:145-148`; `index.ts:4728-4733` |
| Allow for this session | nothing on the server | the engine's own rules | anyone who may answer | the engine | `server/permission-proxy.ts:215-234` |

**Always allow, step by step:**

1. The server makes the key only for a permission with a `requestId`, not a
   sandbox widening, not on the local computer, and not in a guest turn
   (`index.ts:6449-6460`). The key is null for an outbound tool, for the
   `computer`, `phone` and `openmausbot_phone` servers and for
   `agents:shared_computer` (`provider-tool-allow.ts:8-10`, `:38-40`).
2. The composer shows "Always allow" only when the card has an `allowKey`
   and is not a durable card (`PendingApproval.tsx:310-312`).
3. The window first sends `POST /api/bots/:id/always-allow {threadId, allowKey}`
   (or a PATCH of the bot when the bot does not own the thread), then the
   answer (`store.tsx:2436-2448`). A failed save leaves the card waiting
   (`src/state/always-allow-save.test.ts:90-98`).
4. The route (`server/routes/bot-settings.ts:218-251`) needs two things. The
   thread must have an open card with the same key, else 409 "that grant is
   not on a pending approval for this bot". The person must have the right to
   answer it, else 403. A list over 200
   gives 400 "This bot already always-allows {max} tools. Remove one under
   Access in its settings, then try again." (`server/user-errors.ts:211`).
5. The key holds a Vault reference `vault:<id>`, never a value, and leaves
   out the restart count. So a key rotation keeps the grant, and a change of
   the command, the arguments, the URL or a header ends it
   (`server/mcp-grant-spec.ts:1-23`).

**Saved command, step by step:**

1. The server makes a candidate only for a request with `event.command`
   (the Claude driver sets it for `Bash` only, `claude.ts:1241-1243`).
2. The composer shows "Always allow" with the label "Always allow this
   command" only for an owner or admin (`PendingApproval.tsx:272`, `:313-314`).
3. The server saves the rule only after the engine answered `allowed-once`
   (`index.ts:4766-4775`).
4. A command with a credential in it is refused
   (`command-allowlist.ts:30-32`). The command is never rewritten. `git*`
   does not match `git status`, and `cmd && git push` does not match `cmd`
   (`server/command-allowlist.test.ts:43-55`).
5. A corrupt file disables all rules, and each write gives 503 "Saved
   command rules could not be read. Repair the rule store before changing
   them." (`command-allowlist.ts:69-98`).

**What "never remembered for anything that sends, posts or moves money"
covers** (v0.1.176):

- It covers MCP grants. The key is null for an outbound tool, and
  `autoVerdict` checks `isOutboundTool` before each saved grant
  (`server/auto-approve.ts:114-116`).
- "Outbound" is a decision by tool name only. Send verbs are SEND, REPLY,
  POST, PUBLISH, SHARE, REFUND, CHARGE, PAY, TRANSFER, BUY and others, plus
  CREATE with MESSAGE, EMAIL, INVOICE, PAYMENT and others
  (`packages/phone-protocol/src/outbound.ts:14-43`). `GOOGLECALENDAR_CREATE_EVENT`
  and `GITHUB_CREATE_AN_ISSUE` are not outbound (`shared/outbound.test.ts:56-60`).
- It does not cover shell commands. `Bash` is never outbound
  (`shared/outbound.test.ts:77`). So a saved command that posts runs with no
  question at each level. Only the safety floor never-list and the hold for
  a command line that cannot be read still apply (`server/index.ts:6499-6501`,
  `server/safety-floor-gate.ts:98-100`).
- It does not cover "Allow for this session". The Claude driver offers it
  for each permission except computer tools (`claude.ts:1245`), and the
  composer shows it for a card with no `allowKey` (`PendingApproval.tsx:315`).
  What the engine then saves is not verified (section 9).

**Saved grants and a change of level.** A change of the level of a thread
clears only the list of the thread (`index.ts:3369`). Matching also reads
the list of the bot (`index.ts:6465`). So an MCP grant stays in force after
a change to Ask. Saved commands do not depend on the level. A person removes
them in the dialog or in Settings (section 5.5).

### 3.8 The secret card (`request_credential`)

The tool has three modes (`server/drivers/agents-catalog.ts:452-475`):

- `credential_id`: one of 19 keys that the reference project keeps itself,
  or `email` (`packages/phone-protocol/src/credential-request.ts:155-183`).
- no `credential_id`: a custom secret with `label` (at most 80 characters),
  `reason` (at most 240) and `delivery` (`ref` or `file`).
- `email`: a card for a mailbox or for its outgoing server.

**The bot asks:**

1. The MCP proxy chooses the mode (`server/drivers/agents-call.ts:601-608`).
   An unknown id gives "request_credential needs a supported credential_id."
2. The internal route takes the sender and the thread from the internal
   capability, not from the body (`server/index.ts:14114`).
3. A named key (`server/host/secret-cards.ts:531-576`):
   - a key that is already set gives 200 `alreadyConfigured`. The bot reads
     "… is already configured. Continue the task." (`agents-call.ts:618-620`).
   - else it appends a card of kind `secret`, marks each older open card for
     the same key as `superseded`, and moves a parked turn to the new card
     with `followCard` (`:545-574`).
4. A custom secret (`secret-cards.ts:631-683`):
   - unless `replace` is set, it looks for a saved secret with that name in
     the Vault or a linked password manager. A hit is handed over at once,
     with no card (`:645-655`).
   - else it appends a card and supersedes an older card with the same label.
5. An email card supersedes an older card with the same label, but it does
   **not** call `followCard` (`secret-cards.ts:622-625`).
6. The bot reads a fixed text, for example "A secure … request is now in
   this conversation … End this turn; <app> will resume the task after the
   user saves or declines. Never ask them to paste the key into chat."
   (`agents-call.ts:624-625`).

**The person answers** (routes in `server/routes/secret-cards.ts`):

| Route | Guards | Effect |
|---|---|---|
| `POST …/save` | JSON (415), body limit, `threadVisible` and card exists (404), answer refusal (403) | Saves a custom value in the Vault and hands it over, or connects email (`:68-83`) |
| `GET …/saved`, `POST …/use` | the same guards, admin scope | Lists names only, and hands a chosen saved secret over (`:53-67`) |
| `POST …/provide` | companion header (403), device header (401), envelope schema (400) | A phone sends an HPKE-sealed value (`:85-113`) |
| `POST …/provided` | phone in flight (409), dismissed (409), key not set (409) | Resumes after the window saved a named key itself (`:127-139`) |
| `POST …/resume` | superseded (409), not ready (409) | Tries the resume again (`:140-155`) |
| `POST …/dismiss` | superseded (409) | The bot hears that the person declined (`:156-162`) |

The routes `provided`, `resume` and `dismiss` do not check `threadVisible`
or the answer refusal (`:114-163`). `resume` and `dismiss` are open to a
member (`server/request-auth.ts:393`).

**What the bot gets back after the answer** (`secret-cards.ts:96-107`,
`:182-189`):

- a named key: "the user securely provided X … You do not receive the
  secret".
- `ref`: "The person saved X as secret-ref:…. … It works once, only for you
  in this conversation, for an hour, and you never see the value." Only the
  tools of the reference project take the reference, and they turn it into a
  `vault:<id>` pointer (`server/secret-vault.ts:162-223`).
- `file`: "The person saved X to the file <path>. Read it only inside a
  command … never print, echo, log or copy it anywhere else. It is deleted
  after 24 hours." The file is mode 0600 in a 0700 folder
  `.openmausbot-secrets` (`secret-vault.ts:111-149`).
- declined: "the user declined to provide X …".

**What closes a secret card:** saved (`provided`, then `resumed`), declined,
superseded, or stopped by Stop (`index.ts:2008-2018`). A card has no time
limit. The reference lasts 1 hour and one use, the file 24 hours, and a
sweep runs each 10 minutes (`secret-vault.ts:20-21`, `secret-cards.ts:94`).

**Two answers:** a second save gives 409 `alreadySaved`
(`secret-requests.e2e.test.ts:169`). A phone submission has an operation id,
and a different second submission gives 409 (`secret-cards.ts:439-478`).
The phone path and `use` check the card again after their `await`
(`:311-312`, `:490-502`). The email paths do not (`:343-351`, `:359-361`).

### 3.9 Value masking

There are two layers (`shared/redact.ts:16-163`):

1. **Shapes:** PEM blocks, key prefixes, JWT, Bearer, Basic auth,
   `key=value`, `--token` flags and URL user info. The mask is
   `«redacted N chars»`. Text under 8 characters is not checked by shape.
2. **Held values:** the exact values that the server holds. A secret card
   value and each Vault value are registered (`secret-cards.ts:175`,
   `secret-vault.ts:270-286`). The server keeps six forms of each value
   (raw, JSON, HTML, URI, form) of at least 4 characters, for 24 hours, at
   most 200 values (`server/vault-store.ts:591-608`, `secret-vault.ts:25`).
   The mask is `••••••`. In a window this layer does nothing
   (`shared/redact.ts:125-127`).

Where masking runs:

| Path | Masked? | Line |
|---|---|---|
| A bot message when it is stored | yes, both layers, with card fields | `server/store.ts:1136`; `server/message-redaction.ts:7-146` |
| `patchMessage` | no | `server/store.ts:1236-1248` |
| The event log and the native log on disk | yes, for each merged chunk | `server/harness/bus.ts:116-125`, `:170`; `server/drivers/native.ts:70-72` |
| A finished reply on the live stream | yes | `public-reply.ts:14` |
| A streamed `content.delta` on the live stream | no | `public-reply.ts:3`, `:15`; `index.ts:6309` |
| The replay buffer of the live stream | no, it keeps the raw frame | `index.ts:4652-4676` |
| The streamed text in the window | shapes only, and the last word waits for a space | `src/state/live-reply.ts:181-186` |
| The live lines of a tool output | shapes, at most 160 characters a line | `server/harness/live-steps.ts:44-57` |
| The inspector's live rows | no (raw bus events) | section 3.10 |
| `skillRequest.previous` on a stored card | no | `server/skill-request-card.ts:90-110` |

The release text of v0.1.154 says "Streamed text is shown as the bot
produces it. Saved secrets are masked once the message is saved, as before."
(`announcements/releases.json:933`).

### 3.10 The inspector

1. The ⋯ menu of a chat has "Inspector". It toggles `inspectorOpen`
   (`src/components/ChatMoreMenu.tsx:172-180`). The item is not there for a
   remote client (`:165`). Other side panels close it, and it closes them
   (`src/state/store.tsx:1444-1455`).
2. It is a side panel (`<aside aria-label="Inspector">`), not a separate
   window. Below the `md` width it covers the chat. From `md` up its width
   is `min(460px,45vw)` (`src/components/InspectorPanel.tsx:168`). The
   window remembers it in `localStorage["omb-side-panel-open"]`
   (`src/hooks/use-remembered-side-panel.ts:5-25`).
3. It loads `GET /api/threads/:id/events?limit=400`
   (`InspectorPanel.tsx:39-58`). The route (`server/routes/status.ts:119-134`):
   1. answers 404 "no such thread" for an unknown thread.
   2. answers 400 "limit must be a positive whole number".
   3. writes the held native lines to disk (`flushNativeLog`), but not the
      queue of the bus.
   4. reads the end of `events/<id>.ndjson` and `native/<id>.ndjson`: at most
      2000 lines (300 by default), at most 8 MiB, from the end in 64 KiB
      blocks, with synchronous reads (`server/thread-events.ts:8-11`, `:83-118`, `:246-274`).
   5. skips a line that is not valid JSON or not a valid event, and still
      counts it in `total` (`:68-81`, `:140-234`).
4. The route needs the admin scope, by default deny
   (`server/request-auth.ts:310-311`, `:524-531`). It does not apply the
   filter for private chats (`status.ts:52`).
5. Live frames from the app-wide stream are added in batches each 16 ms or
   400 events (`InspectorPanel.tsx:83-87`). The window keeps the newest 400
   entries of each kind (`src/lib/inspector-window.ts:4`, `:12-20`). A
   reload from disk replaces a live entry when its id is on disk
   (`:57-72`).
6. It reloads on mount, on missed frames, 400 ms after `turn.completed` or
   `runtime.error`, and with "Reload from disk" (`InspectorPanel.tsx:93-120`, `:218-220`).
7. Rows: consecutive `content.delta` events fold into one row with "×N"
   (`src/lib/inspector.ts:157-170`). An approval shows as
   "permission: Bash — …" or "question (agent-composed): …" and
   "resolved allow · user" (`:97-103`).
8. Retention: each log is cut to its newest half at 256 MiB by default
   (`server/thread-log-rotation.ts:6`, `:34`). A sweep on a Cloud trims idle
   logs when an environment variable turns it on
   (`server/host/thread-log-sweep.ts:28-68`).
9. The "Run log" tab is built from the stored messages, masked again, and
   shows the last 200 entries. It shows no approval card
   (`src/lib/taskTimeline.ts:27-66`, `src/components/RunLog.tsx:19`).

### 3.11 Parts out of our plan (what each is, and its files)

| Part | What it is | Files |
|---|---|---|
| Owner approval on a Cloud | A turn on a personal Cloud that its owner did not drive runs at Ask, and its self-changes wait for the owner | `server/direct-apply.ts:1-4`; `server/index.ts:3037-3039`; `server/host/outside-lineage.ts:66-128`; `server/cloud-routine-level.ts:1-82`; `server/cloud-owner.ts:1-4`; `server/routes/secret-cards.ts:15`, `:31` |
| Website sign-in policy | When a bot may sign in to a site, and the "Sign in needed" card | `permissions-and-secrets.mdx:76-137`; `server/system-prompt.ts:133-134`; `src/components/SignInRequestCard.tsx` (263); `server/host/sign-in-settle.ts` (136); `server/routes/browser-sites.ts` (52) |
| Remote browser control | Renderer permission lists of the desktop app and the VNC viewer | `electron/app-permissions.mjs` (212); `electron/desktop-viewer-permissions.mjs` (27); their `.node-test.mjs` files; `server/browser/control.ts` (not opened) |
| Saved logins | A sealed store of website logins, the fill tool, and a 60 s hold of page scripts after a fill | `server/vault-store.ts:1-4` (667); `server/login-fill.ts:81` (758); `server/browser-secret-hold.ts` (60); cookie import in `server/browser/cookies/requests.ts:1-3` (37) |
| Analytics | Optional events with counts, booleans and words from fixed lists. No approval-card event | `apps/docs/content/docs/security/analytics.mdx:7-179`; `src/lib/analytics.ts` (210); `src/lib/analytics-allowlist.ts` (94); `electron/launch-analytics.mjs` (94) |

### 3.12 Limits

| Limit | Value | Line |
|---|---|---|
| Permission ask fail-safe | 15 minutes | `claude.ts:448`; `codex.ts:838`; `acp/core.ts:675` |
| Outbound hold | 9 minutes | `server/outbound-hold.ts:13` |
| Sign-in hand-off | 30 minutes | `handoff-requests.ts:76` |
| Open proposal cards in one thread | 8 (auto changes skip it) | `index.ts:11040-11047` |
| Reason of a change | 500 characters | `profile-requests.ts:18` |
| Always-allow keys of a bot | 200 | `always-allow.ts:9` |
| Saved commands of a bot | 200, command 16384 bytes, folder 4096 bytes, file 8 MiB | `command-allowlist.ts:9-13` |
| Secret label, reason | 80, 240 characters | `credential-request.ts:158-159` |
| Secret value | 65536 bytes (4096 with an old data format) | `server/vault/value-limits.ts:4-5` |
| Reference, file | 1 hour and one use, 24 hours | `secret-vault.ts:20-21` |
| Held values | 200, each at least 4 characters | `secret-vault.ts:25`; `vault-store.ts:591` |
| Decision log | 180 days by default, 3650 at most | `decision-log.ts:81-101` |
| Inspector | 400 entries of each kind in the window. 2000 lines and 8 MiB from the server | `inspector-window.ts:4`; `thread-events.ts:8-11` |
| Event log rotation | 256 MiB, cut to the newest half | `thread-log-rotation.ts:6` |

## 4. The data

### 4.1 The card (`OptionCardData`)

`packages/phone-protocol/src/wire.ts:635-705`. The window copy is
`src/state/store.tsx:79-112`. A card is the `card` of a stored message of
kind `options` (`wire.ts:460`).

| Field | Meaning | Line |
|---|---|---|
| `title`, `subtitle`, `options` | The text and the choices. `summaryCode` and `summaryParams` give translated words | `:641-646` |
| `requestType` | `permission` or `question` | `:647-648` |
| `requestId`, `tool` | The request | `:656-659` |
| `answered`, `answeredText` | `allow`, `deny`, `answer`, `unavailable`, or the answer text | `:649-652` |
| `answeredBy` | Who answered, and `via: call \| reaction` | `:654-655`, `:420-433` |
| `dismissed` | Closed by the system, not by the person | `:653` |
| `expired` | "Terminal: no answer came in time, or this proposal went stale … clients must not offer its options." | `:662-664` |
| `stopped` | Closed by Stop (secret, connector and sign-in cards) | `:665-666` |
| `held`, `heldCode` | Why the server did not answer it | `:660-661`, `:667-668` |
| `allowKey`, `allowSession`, `commandAllowlist` | Which "remember" button can show | `:669-674` |
| `approvalScope` | `local-computer` | `:675-676` |
| `autoApplied`, `undone` | A change line, and its Undo | `:677-682` |
| `routineRequest`, `webhookRequest`, `appTriggerRequest`, `profileRequest`, `modelRequest`, `teamSetupRequest`, `mcpRequest`, `skillRequest`, `questionRequest`, `quotaSwitch`, `outboundRequest`, `teamMemoryRequest`, `lendingLift`, `yourComputer` | The kind of card, with its own payload | `:636-640`, `:684-704` |

The state of a card is in six flags. One card can have more than one flag
set. For example, a timed-out card has `answered`, `dismissed` and
`expired`.

### 4.2 The events and the answer

- `request.opened` (`packages/phone-protocol/src/runtime-events.ts:129-171`)
  and `request.resolved` (`:172-180`). [`approval-levels.md`](approval-levels.md)
  4.2 has their fields. At this commit `source` of `request.resolved` has six
  values: `user`, `auto`, `timeout`, `system`, `unavailable`, `peer`.
- The answer body:
  `{requestId, behavior: "allow"|"deny"|"answer", message?, always?, rememberCommand?, reviewedSha256?}`
  (`server/routes/bot-messages.ts:676-687`).
- The engine outcome: `allowed-once | rejected | answered | unavailable`
  (`server/contracts.ts:122`).
- The reply: `{ok: true, outcome}`. Server cards add `alreadySettled` and
  `result`.

### 4.3 The payloads that Undo needs

```text
ProfileRequestCardData  (packages/phone-protocol/src/profile-request.ts:20-40)
  version: 1, requestId, botId, threadId, targetBotId, targetName,
  createdAt, reason, changes, before, expectedRevision, appliedAt?,
  undo?: { appliedRevision }

ModelRequestCardData    (packages/phone-protocol/src/model-request.ts:8-22)
  version, requestId, botId, threadId, targetBotId, targetName,
  createdAt, reason, selection, before, appliedAt?     (no revision)

TeamSetupUndo           (packages/phone-protocol/src/team-setup.ts:50-56)
  created: botId[], before: [{botId, fields, managedSections?}],
  revisions: { botId: sha256 }

teamMemoryRequest       (packages/phone-protocol/src/wire.ts:640)
  section, entryId, kind, revision?

RoutineRequestUndo      (server/routine-requests.ts:1077-1084)
  name, schedule?, appliedUpdatedAt?, before?: snapshot, ownersBefore?

skillRequest.previous   (packages/phone-protocol/src/skill-request.ts:53)
  preview (the full SKILL.md), source, references?, enabled?
```

### 4.4 The secret card (`SecretRequestCardData`)

`packages/phone-protocol/src/wire.ts:715-751`. It is the `secret` of a
message of kind `secret`. It never holds a value.

| Field | Meaning |
|---|---|
| `target` | A key id, or `customSecret` |
| `label`, `description`, `descriptionParts?`, `placeholder`, `helpUrl`, `reason?` | The text |
| `delivery?` | `ref`, `file` or `email` |
| `address?`, `emailReading?`, `emailOutgoing?` | Email cards |
| `requestKey` | A random UUID for each card. The phone envelope must name it |
| `savedAt?`, `phoneOperationId?` | When and how it was saved |
| `provided?`, `dismissed?`, `superseded?`, `resumed?`, `error?`, `stopped?` | The state, again in flags |

### 4.5 Saved command rule

```json
{ "version": 1,
  "rules": [ { "id": "<uuid>", "botId": "b1", "command": "pnpm test",
               "cwd": "/abs/folder", "providerInstanceId": "claude-1" } ] }
```

`<data>/command-allowlist.json`, mode 0600, written atomically, not in
backups (`server/command-allowlist.ts:145-148`,
`server/workspace-backup-policy.ts:39`).

### 4.6 The decision row

`server/decision-log.ts:53-74`: `at, threadId, requestId?, botId?, botName?,
tool?, summary?, summaryCode?, summaryParams?, decision, source, rule?,
unattended?, actor?, via?, origin?`. `decision` adds `user-undone` to the
kinds in [`approval-levels.md`](approval-levels.md) 3.13 (`:21`). `source`
adds `level`, `self`, `profile` and `model` (`:25-45`). The Activity page
shows `user-undone` as "denied" (`server/activity.ts:258-259`).

### 4.7 The inspector page

```json
{ "entries": [ { "kind": "runtime", "at": "…", "data": { "type": "request.opened", "…": "…" } },
               { "kind": "native",  "at": "…", "data": { "at": "…", "dir": "out", "source": "…", "msg": {} } } ],
  "total": { "runtime": 1687, "native": 920 } }
```

`shared/inspector.ts:4-20`. `total` is the count before the cap, "so the UI
can say 'showing 200 of 1,687'".

### 4.8 What is stored, and where

| Data | Where | After a restart |
|---|---|---|
| The card | the message in the thread database | yes |
| `askMessageByRequest`, `pendingCommandRules`, the open asks of a driver | memory (`index.ts:4723-4726`, `claude.ts:449-452`) | no |
| `unansweredApprovals` | memory (`server/waiting-on-person.ts:46-86`) | no |
| Always-allow keys | `bots.json` and each task | yes |
| Saved commands | `command-allowlist.json` | yes |
| The decision log | `decisions/YYYY-MM.ndjson`, 0600 | yes |
| The profile history | `<bot folder>/history.ndjson`, 0600 | yes |
| A secret reference | memory only (`secret-vault.ts:18-19`) | no |
| A secret file | `<home>/.openmausbot-secrets/<thread>/<card>`, 0600 | yes, for 24 hours |
| The held values for masking | memory | no |
| The event log, the native log | `events/<thread>.ndjson`, `native/<thread>.ndjson`, 0600 | yes |

## 5. The UI

### 5.1 One request, two places

A waiting permission request shows in two places (`src/components/ApprovalCard.test.ts:774-807`):

- **In the transcript**, the card has no buttons. A plain tool request is a
  one-line row. While it waits, the row is visible only to a screen reader
  and ends with "Waiting for your answer below" (`ApprovalCard.tsx:381-386`,
  `:528`). A durable proposal (routine, skill, profile, model, MCP, team
  setup) keeps a bordered box with "Waiting for your confirmation below"
  (`:534-597`).
- **In the composer panel**, above the message field, the buttons show. The
  panel shows the first waiting card and "{index} of {count}" when there are
  more (`src/components/Composer.tsx:159-161`, `:724-737`,
  `PendingApproval.tsx:201-205`). While it is open, the message field is
  disabled (`Composer.tsx:163`, `:906-909`).

### 5.2 The buttons of the composer panel

`PendingApproval.tsx:294-364`, with the English text of `src/locales/en.json`.

| Card | Buttons, from left to right |
|---|---|
| A plain tool | "Cancel turn" (behind a chevron) · "Always allow" (tooltip "Stop asking {name} about {key}") · "Deny" · "Allow once" |
| A command, for an owner or admin | "Always allow" with the name "Always allow this command" and the tooltip "Remember this exact command for this bot and provider in {cwd}, including other threads using that folder" |
| A session grant | "Allow for this session" with the tooltip "The provider stops asking about this action until the session ends" |
| A routine, profile or titled card | "Cancel" · "Confirm" or the action of the card ("Apply setup", "Delete bot", "Turn on") |
| A skill | "Enable" or "Update", disabled when the skill has no reviewed hash |

The panel has a chevron for "Details" / "Hide details"
(`PendingApproval.tsx:206-218`). Only a titled card puts the focus on
"Deny" or "Cancel" (`:342`). No keyboard shortcut answers a card.

Held notes under the card (`server/auto-approve.ts:137-144`):

- "This sends something on your behalf, so it asks you first."
- "The provider requires your approval for this action."
- "This loosens the AI's own safety limits, so only Full access can approve
  it automatically."
- "Full access couldn't deliver this approval."
- "Approve for me couldn't answer this one."

### 5.3 The states of a card

| State | What the person sees | Line |
|---|---|---|
| Waiting | the panel with buttons, and a hidden row in the transcript | `ApprovalCard.tsx:381-386` |
| Sending | no change. The buttons stay active | `PendingApproval.tsx:337-363`; `store.tsx:1085` |
| Answered | an icon, the header and "· Allowed", "· Denied" or "· Cancelled", plus "· by voice" or "· by reaction" | `ApprovalCard.tsx:395-418`, `:93-109` |
| Failed to send | a red banner of the whole chat (`role="alert"`). The card stays open | `store.tsx:2453-2456`; `ChatErrorBanner.tsx:24-45` |
| Timed out | a clock and "No answer in time. It did not run" | `ApprovalCard.tsx:95`, `:399-400` |
| A proposal that went stale | "Expired. Ask for a fresh proposal." | `:95` |

A screen reader hears "{name} needs your approval" one time for each new
request (`src/lib/transcript-announcer.ts:41-42`).

### 5.4 The change line

`AppliedChangeLine` (`ApprovalCard.tsx:228-343`) shows a card with
`autoApplied`, `answered: "allow"` and no `held`:

```text
✓ Clive set up the team: added @Mira     Undo   Details
✓ Clive set up the team: added @Mira · Undone          Details
```

- The sentence comes from the kind: "{name} updated its profile: {title}",
  "{name} changed its default model: {title}", "{name} set up the team:
  {title}", "{name} deleted {target}", "{name} saved to department memory:
  {title}", "{name} added a skill: {title}" and the routine lines
  (`en.json:1123-1141`, `:5778-5783`). A routine line never shows a raw cron
  text (`ApprovalCard.tsx:148-160`).
- `canUndo` comes from the payload of each kind (`:162-226`). Team memory
  shows Undo only to an owner or admin (`:248-249`).
- Undo shows "Undoing…" and is disabled while it runs. The errors are
  "Changed since, so it can't be undone here." and "Couldn't undo: {error}"
  (`:271-283`).
- The line changes only when the server patch comes. The window keeps no
  local "undone" state (`:274-283`).
- "Details" shows the stored `subtitle` in a `<pre>` (`:332-340`).

### 5.5 Other places

- **Settings, Access:** "Always allowed", "Tools this bot no longer asks
  about.", "Nothing standing yet.", with a "Remove" button for each raw key
  (`en.json:7380-7384`; `src/components/bot-panel/SettingsPage.tsx:168-195`).
- **The command allowlist dialog** (`src/components/CommandAllowlistDialog.tsx`):
  "Each rule allows one exact command for this bot, provider and working
  folder, including other threads using that folder. Rules stay saved until
  removed." and "Enter the complete command. Prefixes and wildcards do not
  create broader permissions." (`en.json:1240-1257`). It traps Tab, closes
  on Escape and gives the focus back to its opener (`:42-60`, `:113-127`).
- **The secret card** (`src/components/SecretRequestCard.tsx`): a password
  field, "Save securely", "Not now", the hint for each delivery (for example
  "Saved to a private file your bot's commands can read for 24 hours, then
  deleted. It is never added to chat."), and the settled states "{label}
  saved securely", "Bot resumed without seeing the key", "Superseded by a
  newer request", "Stopped" (`:190-310`; `en.json:8316-8320`, `:9264-9280`).
- **The sidebar:** a thread that waits shows "Waiting" and sorts first. A
  closed section shows "{count} waiting for you" (`src/lib/sidebar-attention.ts:31-52`).
- **The inspector:** header "Inspector" with a close button, tabs "Run log",
  "events" and "raw", the counter "last {shown} of {total}", "Reload from
  disk", "couldn't load: {error}", and the empty texts "No runtime events for
  this thread yet." (`InspectorPanel.tsx:168-234`).
- **`DESIGN.md:57-59`:** "No new asks. No new permission asks, approval
  cards, confirm dialogs … A bot gets on with the work; a change that needs
  undoing gets **Undo**."

The screenshot `docs/screenshots/approval-card.png`, which the docs page
uses, shows a question card, not an approval card.

## 6. The tests

| Test | What it guarantees |
|---|---|
| `server/respond-replay.e2e.test.ts:109-127` | A second answer gets 200 `unavailable` and writes one decision row. An unknown id adds one "Couldn't deliver" line |
| `server/parked-cards.e2e.test.ts:72-127` | Parked work follows a newer secret card. After a restart, work on a replaced card is cancelled |
| `server/host/mcp-requests.test.ts:51-171` | Owner review, supersede, Stop closes, restart, 409 while busy |
| `server/host/access-requests.test.ts:62-75` | One admin settles each copy, a second answer gets 409 |
| `server/outbound-requests.test.ts:9-55` | One claim, then `already_settled`. A timeout is a deny |
| `server/command-allowlist.test.ts:39-150`, `.e2e.test.ts:14-160` | Exact match only, no wildcard, a corrupt file fails closed, the rule is saved only after `allowed-once` |
| `server/provider-tool-allow.test.ts:13-69` | No key for a send, a device tool or a changed config. The bot grant matches a new thread |
| `server/mcp-grant-spec.test.ts:28-204` | A key holds a Vault reference, not a value. Old keys move only for the same server |
| `src/state/always-allow-save.test.ts:78-98` | The grant is saved before the answer. A failed save leaves the card waiting |
| `src/components/PendingApproval.command-allowlist.test.ts:83-154` | Owner gating and labels. No "Always allow" on a send, but only with `allowSession` forced off (`:149`) |
| `server/profile-requests.test.ts:508-583` | A self-change applies at Ask. Undo restores only the changed fields, works one time, and refuses after a change |
| `server/model-requests.test.ts:229-275` | Undo one time, then refused after a change |
| `server/team-setup-requests.test.ts:658-720` | Undo deletes unused created bots. A used bot refuses. A deletion has no Undo |
| `server/routine-requests.test.ts:1943-2104` | Each routine change applies with no card, also for another bot. Each Undo kind |
| `server/webhook-requests.test.ts:106-158` | Undo of a delete keeps the URL and the secret |
| `server/host/secret-cards.test.ts:116-401` | The value is never in the card or the resume text. One save only |
| `server/secret-requests.e2e.test.ts:154-213` | The tool schema. A canary value is not in any file, HTTP answer, tool result or server log. It does not check the live stream |
| `src/components/SecretRequestCard.test.ts:292-303` | Analytics never hold the key |
| `src/components/ApprovalCard.test.ts:651-871` | The change line, " · Undone", one card for one request |
| `src/lib/inspector-window.test.ts:96-104`, `live-panels.test.ts:206-302` | The window keeps the last 400 of 10000 with a correct total, and the fetch URL |
| `server/thread-events.test.ts:22-250` | Tail read, corrupt lines skipped and counted, a path in the thread id refused |

No test checks:

- that a restart closes an engine permission card.
- that the live stream or the replay buffer masks a secret.
- the ACP timeout on a question.
- the routes `resume` and `dismiss` of a secret card for a member of
  another thread.

## 7. Ours compared

Our crates today: `bot-protocol` has `ids.rs`, `event.rs` and `message.rs`.
`bot-engine` and `bot-core` have only `lib.rs`. The window has
`features/backdrop`, `bots`, `chat`, `settings` and `sidebar`. No crate has
cards yet. Step 10 names `bot-protocol`, `bot-engine` and `bot-desktop`. P110
of [`../../plan/approval-levels.md`](../../plan/approval-levels.md) already
proposes to add `bot-core`.

| Reference | What it does | Ours (crate, module) | Step |
|---|---|---|---|
| `wire.ts:635-705`, `request-card.ts` | The card and its fields | `bot-protocol`, `card.rs`: one `CardState` enum (P42) | 10 |
| `runtime-events.ts:129-180` | `request.opened`, `request.resolved` | `bot-protocol`, `event.rs` | 10 |
| `claude.ts:441-593`, `acp/core.ts:600-690` | The open ask, the fail-safe, the drain at turn end | `bot-engine`, the ACP driver. The timeout is a value that the core gives, not a constant in each driver | 9, 10 |
| `index.ts:4737-4813`, `:6433-6611` | Answer, record, close | `bot-core`, `approval/` with the runtime and the store | 10 |
| `index.ts:4867-4881`, `:9461-9465` | Close at Stop, sweep at start | `bot-core`, `approval/` (P44) | 10 |
| `index.ts:1957-2006`, `resumable-cards.ts` | Park a turn on a card | `bot-core`, the runtime | 13 |
| `decision-log.ts` | The record of each answer | `bot-core`, a table of the store (P46) | 8, 10 |
| `provider-tool-allow.ts`, `always-allow.ts`, `mcp-grant-spec.ts` | Always allow for an MCP tool | `bot-core`, `approval/grants.rs` | 16 |
| `command-allowlist.ts` | Saved commands | `bot-core`, a table of the store | 10 |
| `outbound.ts` | What "sends" | `bot-core` or `bot-engine`: a flag that each tool states, not a guess from its name | 12, 16 |
| `direct-apply.ts`, `profile-requests.ts`, `model-requests.ts`, `team-setup-requests.ts`, `team-memory-requests.ts`, `skill-switch-host.ts`, `routine-requests.ts` | A self-change with Undo | `bot-core`, a module `change/` with one receipt type. It needs profiles (step 4), tasks (11), our tools (12), memory and routines (15) | 11 to 15 |
| `routes/undo.ts` | Undo | a Tauri command into `bot-core` | 11 to 15 |
| `secret-cards.ts`, `secret-vault.ts`, `agents-catalog.ts:452-475` | `request_credential` | `bot-core` (the Vault of step 6) and `bot-engine` (our tool server of step 12) | 6, 12 |
| `shared/redact.ts`, `message-redaction.ts`, `public-reply.ts` | Masking | `bot-core`, one redaction function at the store, the log and the event to the window (`../changelog.md` section 7, row "A secret in the wrong place"; `docs/comparison.md:68`) | 6, 7 |
| `ApprovalCard.tsx`, `PendingApproval.tsx`, `OptionsCardRow.tsx` | The card and the panel | `bot-desktop/ui/src/features/approval/` | 10 |
| `SecretRequestCard.tsx` | The secret card | `bot-desktop/ui/src/features/approval/` or `features/secrets/` | 12 |
| `InspectorPanel.tsx`, `inspector.ts`, `inspector-window.ts`, `thread-events.ts` | The inspector | `bot-desktop/ui/src/features/inspector/` and a Tauri command that reads the event log of step 8 | 8 or later |

## 8. Where we can be better

### 8.1 Proposals

Each point names the reference line and a reason. The points that earlier
files already propose are named with their number and are not repeated.

1. **One state for a card, and a sweep at start.** P42 (one `CardState`
   enum) and P44 (open requests in the store, closed at start) already
   cover this. New facts for them: the start sweep of the reference closes
   three kinds of card only (`server/index.ts:9461-9465`), and Stop writes
   `answered: "unavailable"` where the wire has a `stopped` flag
   (`index.ts:4878`, `wire.ts:665-666`). **Reason:** a card that no engine
   waits for must not look open.
2. **A second answer gets its own typed answer.** P45 covers typed refusals.
   New fact: the reference gives the same HTTP 200 `unavailable` to a
   second answer and to an id that never existed
   (`respond-replay.e2e.test.ts:117-127`). **Reason:** the window can then say
   "already answered by X" and not show a generic error.
3. **The window shows "sending" and disables the buttons.** The reference
   has no busy state, so Allow then Deny sends two answers
   (`PendingApproval.tsx:337-363`, `store.tsx:1085`). **Reason:** one click,
   one answer. The store still refuses a second answer.
4. **The fail-safe time is one value of the core.** Three drivers each have
   their own 15-minute constant, and the ACP driver sets it also for a
   question (`acp/core.ts:673-676`). **Reason:** one rule in one place, and
   a question must not get a timeout that the release note says it does not
   have.
5. **"Sends" is a flag on the tool, and it also stops the session grant.**
   The reference guesses from the tool name (`outbound.ts:14-43`), never
   marks a shell command (`shared/outbound.test.ts:77`), and offers "Allow
   for this session" for a send (`claude.ts:1245`, `PendingApproval.tsx:315`).
   **Reason:** our own tools come from our own MCP server (step 12), so each
   of them can state "sends: yes or no". A request that sends gets "Allow
   once" and "Deny" only. A flag on a tool cannot mark a shell command, so
   a saved command that sends stays an open risk. The author decides if
   saved commands stay at all.
6. **A grant is saved after the answer is accepted, in one transaction.**
   The reference saves an MCP grant before the answer (`store.tsx:2436-2448`)
   and a command rule after (`index.ts:4766-4775`). **Reason:** one order for
   both, and no standing grant for a card that was then denied or closed.
7. **Each change of a bot writes one receipt row with its Undo data in the
   same transaction as the change.** The reference applies the change, then
   patches the card, then writes the decision row, and swallows errors
   between (`profile-requests.ts:371-385`, `routine-requests.ts:1089-1090`,
   `index.ts:9340`). Team setup Undo deletes bots one by one with no
   rollback (`team-setup-requests.ts:480-490`). **Reason:** our rule in
   `AGENTS.md`, "Every state change in the runtime writes the row and its
   event in one transaction". A failed patch then cannot remove the Undo.
8. **Each kind of change has a revision.** Model Undo and routine-create
   Undo check only equality or existence (`model-requests.ts:258-261`,
   `routine-requests.ts:1119-1123`). **Reason:** a value that changed away and
   back must count as "changed since", as it does for profiles.
9. **The secret routes check the thread and the person the same way.**
   `provided`, `resume` and `dismiss` skip `threadVisible` and the answer
   refusal (`routes/secret-cards.ts:114-163`). **Reason:** one guard for each
   card route. Our desktop runs on the person's own computer (D10). D10 also keeps a
   server possible, and a typed guard on each route holds in both cases.
10. **The event to the window goes through the same redaction as the
    store.** The reference masks the stored message and the log, but not
    the live delta, the replay buffer or the inspector's live rows
    (`public-reply.ts:1-3`, `index.ts:4652-4676`, `:6309`). **Reason:** our
    core runs in the process of the window (D10). So the core holds the
    secret values, and it can mask the delta before the event leaves it. Section 7 of
    [`../changelog.md`](../changelog.md) already wants "One redaction
    function" at "the store, the log and the window". New facts:
    the replay buffer, the inspector, and the 50 ms merge window that can
    split a secret between two masked chunks (`bus.ts:116-125`).
11. **Undo data never holds a raw secret.** A skill-delete receipt keeps the
    full `SKILL.md` in `skillRequest.previous`, and the card scrub does not
    reach it (`server/skill-request-card.ts:90-110`,
    `server/host/skill-switch-host.ts:60`, `:72`). **Reason:** our receipt
    keeps a pointer to a copy in the bot folder, not the text, so a card
    never holds a secret.
12. **The inspector reads through the same filter as the chat.** The
    reference route computes `shown` and does not use it
    (`routes/status.ts:52`). It serves `command` and `reads` from disk while
    the live event hides them (`index.ts:6309`, `thread-events.ts:200-208`).
    **Reason:** one rule for what the window may see.
13. **The docs page agrees with the code** (D19, P121). The docs say a
    routine for another bot asks (`approvals-and-inspector.mdx:21`). The code
    applies it (`routine-requests.ts:1008-1025`). The docs screenshot shows a
    question card. **Reason:** our feature page is the contract that a
    person reads.

### 8.2 The problems of `changelog.md` section 5 in this feature

| Problem | In this feature | Line |
|---|---|---|
| (1) The approval model changed about 10 times | Yes. A card has 14 payload kinds and six state flags. The rule "self-changes apply with Undo" has one exception (the Cloud owner) and one kind that has its own rule (routines). The docs still describe the older routine rule | `wire.ts:635-705`; `direct-apply.ts:1-32`; `approvals-and-inspector.mdx:21` |
| (2) A secret in the wrong place: streamed text masked only "once the message is saved" (v0.1.154) | Yes. Confirmed in code, and wider than the note: the replay buffer, the inspector's live rows, the window with no held values, and the merge window of the log. Also a raw `SKILL.md` in a stored card | `public-reply.ts:1-3`; `index.ts:4652-4676`; `shared/redact.ts:125-127`; `bus.ts:116-125`; `skill-request-card.ts:90-110` |
| (3) A saved approval "never remembered for anything that sends" (v0.1.176) | Partly true. True for MCP grants. Not true for saved shell commands. The session grant is offered for a send | `provider-tool-allow.ts:38-40`; `auto-approve.ts:114-115`; `claude.ts:1245` |
| (4) Cards "no longer expire" (v0.1.126) | Only questions and peer cards no longer expire. The release text, as the changelog row quotes it, says "Question and approval cards no longer expire.", which is wider than the change. The commit and the code keep a 15-minute fail-safe for permission cards. The ACP driver also sets the timer for a question | `../changelog.md:358`; commit `b82764109`; `claude.ts:511`; `acp/core.ts:673-676` |
| (5) The same work done two times: one approval answered twice | Safe on the server, because the driver deletes the open ask on the first answer. The reply does not say "already answered". The window sends two answers on a double click | `claude.ts:499-500`; `respond-replay.e2e.test.ts:117-127`; `PendingApproval.tsx:337-363` |
| A turn or a wait that does not end | A permission card left open by a restart stays open, and a parked wait has no limit by default | `index.ts:9461-9465`; `runtime/types.ts:384-385` |
| State lost at a restart | The open asks, the command candidates and the secret references are in memory only | `index.ts:4723-4726`; `secret-vault.ts:18-19` |

## 9. Not verified

- What the Claude CLI saves from `permission_suggestions` when a person
  chooses "Allow for this session" on a send. Also whether a later send then
  runs with no question.
- Whether an ACP question reaches the 15-minute timer in practice. The code
  sets the timer with no test of `isQuestion` (`acp/core.ts:673-676`).
- The exact text of the release note of v0.1.126 in `announcements/releases.json`.
  A search for "no longer expire" found no line. The changelog row quotes it.
- Whether a send inside an always-allowed Composio multi-execute call is
  always caught by the outbound hold of the relay
  (`server/index.ts:14237-14275`). No test covers it.
- How `store.applyTeamSetup` writes `lastTeamSetupReceipt`, and whether it is
  one transaction (`server/store.ts` was not read for this).
- What "used" means for a bot that a setup created: only its tasks and its
  person lines are checked (`team-setup-requests.ts:472`). A bot that ran only
  routines may count as unused.
- Who sets `secret.error` on a secret card, and whether a turn parked on a
  superseded email card can still resume.
- Whether the phone app opens its own event stream and shows `content.delta`.
- The size and the life of the replay buffer of the live stream.
- Whether a member of a Team Cloud can call the `resume` or `dismiss` route
  for a card in a thread that the member cannot see. The guard is missing in
  the route, but the member's access to the bot was not traced.
- Where the per-device grant for remote browser control lives
  (`server/browser/control.ts` was not opened).
- The meaning of `!connectorThread` in the owner-card rule
  (`server/index.ts:3039`, `:10993`). Group C1 found that the internal routes
  return 403 before it can be reached.
