# Plan: The driver contract

The proposals from the research file
[`../research/features/driver-contract.md`](../research/features/driver-contract.md)
(batch 3, reference commit `d6660e2`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 3, 4, 5, 7, 8, 9.
- **State:** P52 is decided (D22, 2026-11-23). The others are open.
- **The main finding:** the reference has no capability flag for
  streaming, interrupt or approvals. Each of its drivers must stream, must
  take a stop and must answer a request (`server/contracts.ts:255-323`).
  P52 made this our rule (D22).

## Proposals

- **P53 (step 3). `interrupt(thread, turn)` requires a `TurnId`.**
  - Why: a late Stop can stop the next turn. Claude, Codex, pi and ACP
    ignore the id. Only the chat driver checks it. This takes P35 down to
    the trait.
  - Source: research 8.2. `claude.ts:1963`, `codex.ts:1551-1553`,
    `pi.ts:563-568`, `acp/core.ts:1572`, `openai-chat.ts:961-966`.
  - Changes: PR 3.3.
- **P54 (step 3). A typed busy refusal, and a busy slot that is taken before
  the first `await`.** An entry API of a map, or a guard that frees the slot
  on `Drop`.
  - Why: the compiler refuses the race. Five drivers throw the same untyped
    text. In ACP and Claude, awaits come between the check and the write.
  - Source: research 8.3. `acp/core.ts:922`, `claude.ts:951`,
    `codex.ts:408`, `pi.ts:413`, `openai-chat.ts:518`.
  - Changes: PR 3.2 (`DriverError::Busy`), PR 3.4 (the fake keeps the slot).
- **P55 (step 3). One meaning of `send_turn`.** `Ok` when the engine took
  the prompt. `Err(NotStarted)` when no work was done. After `Ok`, a failure
  comes only as events, never as both. `NotStarted` has no made-up id.
  - Why: Codex returns before the process starts. pi emits `turn.completed`
    and also throws. The reference makes ids that belong to no turn.
  - Source: research 8.4. `codex.ts:1394`, `pi.ts:856-862`,
    `index.ts:8399`, `engine-memory.ts:893`, `index.ts:8325`.
  - Changes: PR 3.2, PR 3.3 (the doc comment of `send_turn`).
- **P56 (step 3). A stop always ends with `Outcome::Interrupted`.**
  - Why: pi and ACP report `ok: true, "cancelled"`, and Claude reports
    `ok: false, "interrupted"`. D20 already has the enum. The contract test
    (P60) checks it.
  - Source: research 8.5. `pi.ts:567`, `claude.ts:1654`.
  - Changes: PR 3.3 (doc comment), P60.
- **P57 (step 3). One `Capabilities` struct, and each field has a reader.**
  No getter, and no second table by driver name. With `serde`, the window
  sees the same struct.
  - Why: less code. `sessionModelSwitch` has no reader. Claude's
    `strictResume` is a getter. A table by name is kept correct only by a
    test. The registry copies 13 fields by hand.
  - Source: research 8.6. `claude.ts:1955-1957`,
    `runtime/capabilities.ts:17-49`, `level.test.ts:67-86`,
    `registry.ts:542-558`.
  - Changes: PR 3.2.
- **P58 (step 3). An optional method exists only with its flag.** For
  example `fn steer(&self) -> Option<&dyn Steer>`.
  - Why: the compiler refuses a flag without its method. The host checks
    both `queueing` and `steer`. The UI checks only `queueing`, of another
    instance.
  - Source: research 8.7. `index.ts:7191`, `routes/bot-messages.ts:405`,
    `Composer.tsx:153-157`.
  - Changes: a rule in the doc comment of the trait (PR 3.3). Steer comes
    later.
- **P59 (step 3). A fake driver that obeys the contract.** It uses the
  `TurnId` of the request, emits a script of events in order, keeps a busy
  state for each thread, and refuses calls after dispose.
  - Why: the reference fake returns `"fake-turn"` for each turn and emits
    nothing, so it cannot test turn ids or the busy rule.
  - Source: research 8.8. `fake-driver.ts:79`.
  - Changes: PR 3.4.
- **P60 (steps 3 and 5). One contract test for all drivers.** A function
  `driver_contract(make_driver)` checks:
  - the events end with one `turn.completed`
  - a stop gives `Interrupted`
  - a stop with no turn is `Ok`
  - a second turn on a thread gets the busy refusal
  - a call after dispose gets a refusal.

  It runs on the fake in step 3 and on the chat driver in step 5.
  - Why: the reference repeats tests for each family of drivers, and never
    tests some methods.
  - Source: research 8.9 and section 6.
  - Changes: a new PR in step 3, and one line in PR 5.4.
- **P6 extended (step 3). More waits with no limit.** No new number. The
  `Deadline` type of P6 also covers these waits of the reference:
  `pi.ts:793` (`Infinity`), `turn-dispatch-guard.ts:16`,
  `registry.ts:579-595` (dispose), `claude-auth-recovery.ts:97`,
  `acp/host.ts:276` (the idle timer starts again while a tool runs).
  - Source: research 8.10.
- **P62 (step 4). Engine readiness is one enum.** For example `Ready`,
  `NeedsSignIn`, `NeedsInstall`, `Unavailable { reason }`.
  - Why: the UI derives readiness in four places, with a special case by
    driver name. pi always says "signed in".
  - Source: research 8.12. `EngineLibrary.tsx:11-17`, `pi.ts:943-944`.
  - Changes: PR 4.2, with P11.
- **P64 (step 7 or 8). "Steered" only after the engine confirms it.** A pipe
  write is `Indeterminate`. The host stores each `Steered` and
  `Indeterminate` text as a row, also when the turn ended during the call.
  - Why: Claude returns `"steered"` after a stdin write. Codex reports an
    `"indeterminate"` answer as `"answered"`. The host returns 409 and
    stores no row after `"steered"`.
  - Source: research 8.14. `claude.ts:1796-1815`,
    `codex-questions.ts:35-40`, `index.ts:7211-7216`.
  - Changes: with P34.

## Notes for later steps

No decision now. "Accept" for a row means: keep it as a choice of its step
when that step is split into pull requests.

| # | Step | Note | Source |
|---|---|---|---|
| P61 | 9 | An engine process gets only the environment keys on an allow-list. Today an unknown secret reaches the engine | research 8.11, `acp/core.ts:333-346` |
| P63 | 9 | The fake engine reads one typed script file, not about 100 environment variables, and does not route by the words of a prompt. With P41 | research 8.13, `fake-claude-cli.ts:2-102`, `:506-540` |
