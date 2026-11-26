# Plan: Notifications

The proposals from the research file
[`../research/features/notifications.md`](../research/features/notifications.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 10, 11, 12, 13 and 15, and a new step for notifications after
  step 14 (P314).
- **State:** all open.
- **The main finding:** a notification is a short record that a bot made for
  the person: a kind (15 kinds), the bot, the exact thread, a title and a
  body. About 20 makers build one, and the central `notify()` drops a "done"
  of a quiet turn, writes the feed row and sends the frame to the windows.
  The off switch is in one builder only, the feed write is outside any
  transaction with its event, and two of the three quiet rules are in memory
  only (`packages/phone-protocol/src/notification.ts:3-37`;
  `server/notify.ts:59`; `server/index.ts:4897-4904`).

## Proposals

- **P314 (plan, new step after 14). A step "Notifications and the unread
  badge".** It holds the type and the kinds in `bot-protocol`, the policy and
  the feed in `bot-core`, the banner and the tray in `bot-desktop`. Its parts
  land in earlier steps: the approval maker in step 10, the unread fields of
  a thread in step 11, the helper bot's two tools in step 12, the wait and
  routine makers in step 15.
  - Why: part 50 has no step. The quiet rule reads who opened a thread
    (steps 12 and 14). The held "done" reads which threads wait for
    teammates (steps 13 and 14).
  - Source: `server/notify.ts:79-88`; `server/index.ts:4898`;
    `server/done-notice.ts:14-33`.
- **P315 (decision). One notification policy function in `bot-core`.** An
  enum of kinds, and a `match` with no wildcard for each table (title, lean,
  tray look, exemption). The off switch is a type rule that a maker cannot
  skip. `spend` has a typed exemption.
  - Why: better than the reference. It spreads the policy over about 10
    places. "Notifications off for a bot" is checked in one builder only, and
    the outside-write approval passes `{id, name}`, so it skips the check.
  - Source: `server/notify.ts:59`; `server/host/outside-writes.ts:52`;
    `server/index.ts:4897-4904`; the helper bot's table of kinds, lines 17-36
    (research section 3.16).
- **P316 (decision, or the step of P314). The feed row and its event in one
  transaction.** A failed write is a typed error, not a log line. Never
  delete an unread row to keep the cap. Delete only read rows past the cap.
  - Why: our rule in `AGENTS.md`. The reference keeps the newest 500 rows and
    deletes older rows in the insert, unread rows too. A failed feed write is
    logged, and the frame still goes out.
  - Source: `server/message-db.ts:294-303`, `:305-314`.
- **P317 (plan, step 11). The unread mark is saved with its cause.** The
  turn-end unread mark is saved in the same transaction as
  `turn.completed`. Read-on-open writes the thread and its feed rows in one
  transaction.
  - Why: the reference saves a turn-end `unread: true` up to one second
    later, so a crash can lose it. Read-on-open patches the thread in
    `bots.json`, then marks its feed rows in SQLite, with no shared
    transaction.
  - Source: `server/registry-save.ts:48-64`; `server/store.ts:2008-2028`;
    `server/routes/bot-settings.ts:190-192`.
- **P318 (plan, step 13). The quiet rules are in the store.** The "done" hold
  (`owed`), the quiet-turn marks and the internal-turn marks are in the
  runtime's store, not in memory.
  - Why: the held "done" is a `Set` in memory, so a restart loses it ("state
    lost at a restart").
  - Source: `server/done-notice.ts:15`; `server/index.ts:4898`, `:7519-7522`.
- **P319 (decision, extends D17). Each notification has a key from its
  maker.** For example (thread, request id) or (wait id, status). The store
  refuses a second row with that key.
  - Why: it replaces a `Map` in memory and a scan of the messages. A repeated
    request in the reference posted a second card and notification (fixed in
    v0.1.180, commit `e68308207`).
  - Source: `server/index.ts:6432`; `server/wait-host.ts:123-124`.
- **P320 (decision, beside D20). An app event enum, separate from the turn
  events.** `notification.created` and `notifications.read`. Every read path
  sends `notifications.read`.
  - Why: in the reference "mark one" and "mark all" send no frame, so a
    second window stays old until it loads the list again.
  - Source: `server/routes/notifications.ts:57-66`; ours
    `crates/bot-protocol/src/event.rs:9-30`.
- **P321 (note under D10). The banner and its click are in Rust.** Show the
  banner and route its click from Rust (`tauri-plugin-notification`,
  `docs/comparison.md:154`). The Tauri API for the badge and the click is not
  verified.
  - Why: the reference moved its banner to the main process after a banner
    of the page lost its click.
  - Source: `electron/desktop-notifications.mjs:1-4`.
- **P322 (plan, step 15). The brief records a row as notified only when it
  notified.**
  - Why: today a retry with `notify: false` records the row, and its
    notification is lost.
  - Source: `server/host/brief.ts:383-384`, `:586-589`.
- **P323 (plan, step 12). The helper bot's tools return a typed refusal.**
  - Why: the reference route picks 403 or 400 from the first words of the
    error text.
  - Source: the helper bot's notification route, lines 42-43 (research
    section 3.16).
- **P324 (plan, step of P314). The read command takes the thread.** The
  window's read command takes the thread, not the bot flag, and returns a
  typed error.
  - Why: today `select` sends a read when `bot.unread` is set, and the unread
    thread can be another one. The window drops the errors of a read and
    shows the thread as read.
  - Source: `src/state/store.tsx:2544-2545`, `:3013`;
    `src/state/read-visible.ts:11`.
- **P325 (plan). New rows in "The problems of the reference, and the
  proposals" of [`README.md`](README.md).** The same work done two times, or
  lost: P316, P318, P319, P322. State lost at a restart: P317, P318. "Busy"
  and races between bots: P320. The left-over `/api/today` route is not
  ported.
  - Why: the table links each problem to the proposals that answer it.
  - Source: `server/index.ts:12040`; `docs/research/changelog.md` section 5.
