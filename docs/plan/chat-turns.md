# Plan: One chat turn from send to reply

The proposals from the research file
[`../research/features/chat-turns.md`](../research/features/chat-turns.md).
The steps, the pull requests and the order are in
[`README.md`](README.md). The author decides each proposal. Then it
becomes a decision, a pull request or a choice, and its text leaves this
file.

- **Steps:** 2, 3, 7, 8, 14.
- **State:** open. No proposal is decided.

## Proposals

- **P2 (step 3). The runtime makes the turn identifier.** The runtime makes the
  `TurnId` before it calls the driver, and puts it in `TurnRequest`.
  - Why: less code. In the reference the driver makes the identifier, and
    events can arrive before the server knows it. The server needs a
    quarantine, a registry of early completions and 4,096 retired
    identifiers.
  - Source: `chat-turns.md` 8.1. `server/turn-dispatch-guard.ts:23-162`,
    `server/index.ts:2303`, `:8370-8375`.
  - Changes: PR 3.3, PR 7.2, a line in D17.

- **P3 (step 2). The thread is the unit of "busy".** Change D8 "One turn per bot at a
  time" to "one turn per thread at a time". The bot has no busy flag. The
  state of a thread is one enum, for example `Idle`, `Starting`,
  `Running { turn }`, `WaitingOnPerson { turn }`, with one function for each
  change. Rooms and several bots (step 14) use the same unit.
  - Why: the compiler refuses "busy with no turn". The plan that D8 cites
    was replaced in the reference on 2026-09-09. The reference changed
    "busy" in three steps (v0.1.81, v0.1.83, v0.1.86).
  - Source: `chat-turns.md` 7, 8.2, 8.7. `changelog.md` sections 6 and 7.
    `server/store.ts:122`, `server/index.ts:2179-2181`, `:9562`,
    `server/room-member-lock.ts:1`.
  - Changes: D8, or a new decision. Step 7 (in memory) and step 8 (store).

- **P6 (step 3). No wait without a limit.** A `Deadline` type that has no "infinite"
  value. Each wait on an engine takes one. `TurnRequest` has a deadline.
  - Why: "a turn or a wait that does not end" is in 6 of 6 periods of the
    history. In the reference, `guardTurnDispatch` has no timeout, and a turn
    that waits on a person has no limit.
  - Source: `chat-turns.md` 8.4. `changelog.md` sections 5 and 7.
    `server/turn-dispatch-guard.ts:16`, `server/turn-watchdog.ts:246`,
    `server/index.ts:4924`.
  - Changes: a new PR 3.4. The fake driver moves to 3.5, and the interrupt
    test moves to 3.6. A new decision.

- **P8 (step 3). Cancel by type.** `send_turn` stops at the next `await` when its
  stream is dropped or a `CancellationToken` fires. No check after each
  `await` by hand.
  - Why: less code. The reference checks a claim by hand in seven places.
  - Source: `chat-turns.md` 8.3. `server/index.ts:7683-7699`, `:7813`,
    `:8183`, `:8239`, `:8313`.
  - Changes: PR 3.3.

- **P9 (step 3). Refusals reach the window with their code.** The `DriverError` enum
  and the runtime refusals go to the window as a typed value, not as text.
  - Why: the reference loses `thread_busy` and `thread_limit` in its general
    HTTP error handler.
  - Source: `chat-turns.md` 8.5. `server/index.ts:15058`.
  - Changes: PR 3.2, PR 7.3.

- **P31 (step 7). `send_message` takes a `ThreadId` and has a length limit.** The
  selected thread is not an input. The command refuses a very large paste.
  - Source: `chat-turns.md` 8.9, 8.10. `server/index.ts:7469`,
    `server/message-text.ts:2-5`.
  - Changes: PR 7.3.

## Gaps that have no step

- **P35. Stop.** The trait has `interrupt` (3.3), but no command and no
  button calls it. Add PR 7.7: a Tauri command that requires a `TurnId`, and
  a Stop button. The command refuses a Stop with no `TurnId`.
  - Why: in the reference a Stop that names no turn stops whatever runs.
    After a reload that can be a queued turn that just started.
  - Source: `chat-turns.md` 7, 8.8. `server/person-stops.ts:51-55`.

- **P36. A watchdog for a turn that goes quiet.** A stop by a time limit
  needs its own outcome or reason, not `Interrupted`, because no person
  pressed Stop. With P6 it can be a deadline in the runtime.
  - Source: `chat-turns.md` 7. `server/index.ts:4956-4963`.
  - Changes: a PR in step 8, or a note for later.

## Notes for later steps

No decision now. "Accept" for a row means: keep it as a choice of its
step when that step is split into pull requests.

| # | Step | Note | Source |
|---|---|---|---|
| P38 | 8 | The user row and the start of the turn in one transaction | `chat-turns.md` 8.6 |
| P51 | 14 | Text that opens a turn comes from stored data, also for rooms | `chat-turns.md` 8.11 |
