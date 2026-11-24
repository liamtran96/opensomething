# Plan: The approval levels

The proposals from the research file
[`../research/features/approval-levels.md`](../research/features/approval-levels.md)
(batch 4, reference commit `ed8cb7278`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 10, 12, 14.
- **State:** all open.
- **The main finding:** the reference has five levels (`ask`, `edits`,
  `auto`, `full`, `custom`), and Full is the default. It has three orders
  of the levels. An unknown stored level becomes Full, not the Ask that its
  comment promises: the load deletes the value, and then the default
  applies (`packages/phone-protocol/src/approval-mode.ts:74`, `:85-102`,
  `server/store.ts:351-354`).

## Proposals

- **P110 (step 10). Add `bot-core` to the crates of step 10.**
  - Why: the decision and the state of a waiting request belong to the
    runtime (`AGENTS.md`). In the reference, the server decides and
    answers, not the drivers.
  - Source: `server/index.ts:4741-4818`, `:6438-6587`, `server/auto-approve.ts:94-123`.
- **P111 (step 10). Correct D8.** There are five levels. `custom` is not in
  the order, and only Codex offers it. Full is the default. The level is
  the permission mode of the engine, and the server adds a small set of
  grants.
  - Source: `approval-mode.ts:5`, `:22-26`, `:74`, `server/auto-approve.ts:1-4`.
- **P112 (step 10). One pure decision function in `bot-core`:**
  `decide(level, request, grants, floor, can_show_card)` gives `Allow`,
  `Ask` or `Deny`, each with its reason. A driver only maps the level to
  the mode of its engine.
  - Kind: better than the reference, which decides in about six places.
    This is the proposal of the last row of section 7 of
    [`changelog.md`](../research/changelog.md).
  - Source: `server/auto-approve.ts:94-123`, `server/index.ts:6453-6471`,
    `server/safety-floor-gate.ts:98-177`, `server/drivers/permission-command.ts:29-32`.
- **P113 (steps 3 and 10). The levels that a driver supports, and a native
  reviewer, are capabilities.** No code checks a driver name. This applies
  to each list of driver names in the reference.
  - Kind: better than the reference (the rule of `AGENTS.md`).
  - Source: `approval-mode.ts:22-26`, `:41-45`, `server/runtime/capabilities.ts:57-65`,
    `src/lib/approval-mode-options.ts:50-83`, `server/index.ts:1067-1070`.
  - Related: P57.
- **P114 (step 10). One ordered level type.** `Ask < Edits < Auto < Full`
  with `Ord`, and `Custom` outside the order. An unknown stored value
  becomes Ask with a typed warning, and the store keeps the raw value.
  - Kind: better than the reference: one order instead of three, and the
    bug above is fixed.
  - Source: `approval-mode.ts:9-11`, `:47`, `server/auto-approve.ts:38`,
    `server/runtime/level.ts:13-28`, `server/store.ts:351-354`, `:521-524`.
- **P115 (step 10). "Fail closed" in the "done when".** A test shows that a
  dead path, the time limit and a request after the turn end each deny.
  - Kind: follows the reference. Its tests cover the dead path and the late
    request. No test of the reference covers the time limit of 15 minutes.
  - Source: `server/permission-proxy.ts:31-37`, `:74-82`,
    `server/permission-proxy.test.ts:393-405`, `server/drivers/claude.test.ts:3829`,
    `:4514`.
- **P116 (step 10). The window gets `request.opened` after the card is
  stored,** in one transaction with its event.
  - Kind: better than the reference, which sends the event first.
  - Source: `server/index.ts:6311-6315`, `:6540`.
- **P117 (step 10). A raise to Full or Custom only through a Tauri
  command,** in one transaction. No other path can raise a level.
  - Kind: better than the reference, where Full applies "from any client
    that can reach this API", and a grant takes five steps.
  - Source: `server/routes/bot-patch.ts:538-578`, `server/index.ts:3055-3056`,
    `electron/approval-trusted-mode.cjs:49-124`.
- **P118 (step 10). A choice: are questions (`ask_user`, the question card)
  in step 10 or later?** A question uses the same path, but it has words as
  its answer and other UI.
  - Source: `packages/phone-protocol/src/ask-question.ts:11-18`,
    `server/host/ask-cards.ts:164-183`.
- **P119 (step 10 or 12). Each driver states if a change of level applies
  during a turn.** The picker then says exactly when it applies.
  - Kind: better than the reference, whose text says "from its next step
    where its AI allows it, otherwise from its next turn".
  - Source: `server/contracts.ts:132-136`, `server/drivers/claude.ts:1142-1192`.
- **P120 (steps 10 and 14). The default level, and what Full never does.**
  1. The default of a new bot: Full, as the reference, or Ask.
  2. One rule in one place: Full never answers a question and never types a
     secret for the person. A question request has no "approve" variant.
  3. Choose: a question always reaches a person. Or, as the code of the
     reference does, Full answers a question in work that another bot
     handed on.
  - Why: the reference changed the default from Ask to Full (commit
    `593fd1c5a`). Its header, its document and its code disagree.
  - Source: `approval-mode.ts:74`, `server/auto-approve.ts:4`, `:108-112`,
    `server/host/question-routing.ts:63-69`, `docs/approval-levels.md:352-354`.
- **P121 (step 10). A test keeps the feature page equal to the code** (D19).
  - Why: the document of the reference disagrees with its code in at least
    four places.
  - Source: `docs/approval-levels.md:77`, `:223`, `:230-231`, `approval-mode.ts:24`.

## New facts for proposals that exist

- **P44:** the reference sweeps only peer cards and computer cards at
  start, not engine permission cards (`server/index.ts:9465-9470`).
- **P45:** the HTTP route answers 200 for an answer that cannot reach the
  engine, and the voice path answers 409 (`server/routes/bot-messages.ts:669`,
  `server/index.ts:4863-4866`).
- **P46:** the decision log ignores a write error, and the row of an
  automatic allow comes after the engine accepts (`server/decision-log.ts:124-141`).
- **P42:** question cards have one more state, `stopped`
  (`packages/phone-protocol/src/wire.ts:649-666`).
- **P49:** the floor already reads Windows commands, but only its tests use
  that reader (`server/safety-floor.ts:650-676`, `server/safety-floor-gate.ts:37-39`).
