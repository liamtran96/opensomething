# Plan: The event bus, the fold and the streamed reply

The proposals from the research file
[`../research/features/event-bus-fold.md`](../research/features/event-bus-fold.md).
The steps, the pull requests and the order are in
[`README.md`](README.md). The author decides each proposal. Then it
becomes a decision, a pull request or a choice, and its text leaves this
file.

- **Steps:** 2, 7, 8.
- **State:** open. No proposal is decided.

## Proposals

- **P1 (step 2). An item identifier on each content event.** Add `ItemId` to
  `ids.rs`. `ContentDelta` and `ItemCompleted` get a mandatory `item_id`. The
  driver or the runner makes it (D17). In step 8, a unique index on
  `(thread_id, item_id)` makes a second `item.completed` a no-op.
  - Why: the compiler refuses a delta with no item. The reference stores a
    second row for a second `item.completed`, and keeps an old code path for
    events with no id.
  - Source: `event-bus-fold.md` 8.4, 8.5. `server/index.ts:6351`,
    `src/state/live-reply.ts:118-123`.
  - Changes: PR 2.5. D20 gets `item_id`. The D20 open risk about an event
    identifier and a time stays open (P39).

- **P27 (step 7). The runner owns the end of a turn.** The runner folds the events of
  a turn and publishes one "turn settled" fact after the state changes. The
  bus only delivers. "Busy" ends in the same step that stores the end.
  - Why: the reference depends on the order of about 20 `bus.subscribe`
    calls, and one of its own comments about that order is wrong.
  - Source: `event-bus-fold.md` 8.1, 8.2. `server/index.ts:5041`, `:7031`,
    `:6786-6787`.
  - Changes: PR 7.2.

- **P28 (step 7). A slow window reloads. No replay.** A receiver that falls behind
  gets `RecvError::Lagged`. The desktop task then sends one "reload" event,
  and the window reads the thread again. A window that opens reads first,
  then listens.
  - Why: one recovery path in place of three.
  - Source: `event-bus-fold.md` 8.7, 8.8.

- **P29 (step 7). The Tauri payload is one `serde` enum in `bot-protocol`.** No code
  adds a field by hand.
  - Source: `event-bus-fold.md` 8.10. `index.ts:4677`, `sse-fanout.ts:46`.
  - Changes: PR 7.4.

- **P30 (step 7). A failed turn always shows.** The window makes the error row from
  `TurnCompleted { outcome: Failed }`, with the text of the `runtime.error`
  before it or a general text.
  - Why: the reference shows nothing for a failure with no `runtime.error`.
  - Source: `event-bus-fold.md` 8.11. `index.ts:6627-6636`.
  - Changes: PR 7.5.

## Notes for later steps

No decision now. "Accept" for a row means: keep it as a choice of its
step when that step is split into pull requests.

| # | Step | Note | Source |
|---|---|---|---|
| P37 | 8 | The terminal mark and the idle thread in one transaction, then one drain | `event-bus-fold.md` 8.2 |
| P39 | 8 | An event identifier and a time on each stored event (D20 open risk) | `event-bus-fold.md` 7.3 |
