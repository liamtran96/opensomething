# Plan: The harness upgrades and message branches

The proposals from the research file
[`../research/features/harness-upgrades.md`](../research/features/harness-upgrades.md)
(batch 5, reference commit `ad27f0716`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 5, 8, 9, 13, 15, and the step that adds a context rebuild.
- **State:** all open.
- **The main finding:** a thread keeps all versions of its messages as a
  tree. The visible conversation is the path from the active leaf up through
  the parents (`server/store.ts:1109-1120`). An edit adds a sibling and makes
  it the leaf, and the old message stays (`:1199-1224`). The reference keeps
  `parentId` and `sendId` inside a JSON text, with no column and no index.

## Proposals

- **P153 (step 8, a new decision). The message tree in the schema.** Each
  message has a `parent_id` and a `send_id` from the client. A unique index
  on `(thread_id, send_id)` stops a second row with the same key. Each thread
  has one active leaf. An edit adds a sibling and makes it the leaf. A switch
  moves the leaf to the newest descendant: the largest `at`, then the
  largest insert sequence.
  - Why: follows the reference for the tree. Better than the reference in
    two parts: the database refuses a second row, and the check is one
    lookup, not a scan of the thread. A full order gives one answer for each
    tree, also when the clock steps back (P80).
  - Source: `server/store.ts:1109-1120`, `:1199-1234`,
    `shared/conversation-branch.ts:3-13`, `server/message-db.ts:55-61`,
    `:76-79`, `:594-596`, `server/send-idempotency.ts:26`.
- **P154 (amends D18). Where a summary record and a divider of Start fresh
  go.** D18 has two roles. These rows are neither text of the person nor
  text of the bot. The author chooses:
  - a. a field `kind` on `Message`, as the reference has;
  - b. a separate row type in the store.
  - Source: `server/fresh-start.ts:29-32`,
    `server/host/conversation-compaction.ts:136-140`,
    `server/context-rebuild.ts:148-155`.
- **P155 (step 8, extends P38 and P81). One transaction for an edit.** An
  edit writes the new row, the new leaf, the flag that forces a rebuild and
  the event in one transaction. A switch writes the leaf, the flag and the
  event. The store changes memory only after the commit.
  - Why: a known problem of the reference. It writes the flag `rewound` to
    `bots.json`, a different file. A failed save can lose the flag, and the
    next turn continues an engine session that holds the old branch. It also
    changes memory before the database. This comes from reading the code.
    Nobody ran it.
  - Source: `server/index.ts:7570-7572`, `server/routes/bot-messages.ts:593-595`,
    `server/save-batch.ts:26-36`, `server/store.ts:638`, `:1216-1218`,
    `:1230-1231`, `server/registry-save.ts:16-25`, `server/message-db.ts:461-466`.
- **P156 (step 8 schema, rules in step 9). The session fields on the thread
  row.** The thread row keeps a session id for each engine instance, the
  engine that took the last turn, the flag "rebuild needed", and the id of
  the summary record that the session holds. The flag clears only after a
  dispatch that the driver confirms. A turn rebuilds when another engine ran
  the last turn, or when this engine has no session id.
  - Why: follows the reference. The first rule of the reference failed for
    the switch A → B → A.
  - Source: `server/resume-plan.ts:18-37`, `server/turn-context.ts:18-29`,
    `server/index.ts:7724`, `:8372-8377`, `server/store.ts:1789-1794`,
    `docs/plans/agent-harness-upgrades.md:141-143`.
- **P157 (step 8). A typed refusal for an edit or a switch on a busy
  thread.** The store checks the `send_id` first: a repeat returns the
  stored row and starts no turn. Then it refuses an edit or a switch while a
  turn runs, with a typed value. The busy check and the write are in one
  transaction.
  - Why: a new row takes the leaf of the moment as its parent, so a leaf
    that moves during a turn puts the rest of the turn on another branch.
    The reference depends on code with no `await` between the check and the
    write.
  - Source: `server/routes/bot-messages.ts:546-556`, `:589`,
    `server/store.ts:1136`, `server/branching.test.ts:193-200`.
- **P158 (amends D20, work in steps 5 and 9). Retry events.** Add
  `turn.retrying` with `attempt`, `delay_ms` and a closed enum `reason`. A
  driver sends `turn.started` one time for each turn. It sends a turn again
  only if no model call answered and no text or reasoning streamed. One
  budget counts every resend.
  - Why: follows the reference for the event and the rule "never after an
    answer". In the reference, a relaunch sends `turn.started` again, and the
    fold deletes the error of the first try. It resends a turn that streamed
    only reasoning. Some resends do not count, so one turn can go out more
    than 3 times. `attempt` has two meanings.
  - Source: `packages/phone-protocol/src/runtime-events.ts:53-60`,
    `server/drivers/retry.ts:6-9`, `:29-32`, `:191`, `:219-229`,
    `server/drivers/claude.ts:1454-1458`, `:1487`, `:1785`,
    `server/turn-outcome.ts:27-29`, `server/drivers/codex.ts:690-692`, `:893`,
    `server/index.ts:6617`, `src/lib/inspector.ts:63-64`, commit `812c99063`.
- **P159 (step 8 or 13, related to P37). The activity state is one enum.**
  The activity state has one setter, and `busy` comes from it. "Waiting on
  the person with no turn running" is a value of the enum. The enum has no
  value that no code sets. The state is kept at runtime only, and a start
  sets each thread to idle. In the state of a bot, a dead thread ranks above
  a working thread.
  - Why: a wrong state that the compiler refuses. The reference stores
    `busy` beside the state, and a flag lets them disagree. `no-signal`
    counts as busy, and no code sets it. A bot with one dead thread and one
    working thread shows `working`.
  - Source: `packages/phone-protocol/src/wire.ts:84-88`, `server/store.ts:124`,
    `:315-318`, `:526-529`, `:1611-1636`, commit `cbc0d829c`.
- **P160 (decision). Undo, or versions in its place.** Decide if an edit, a
  switch and Start fresh get an Undo, or record that versions take the
  place of Undo. The reference has no Undo for these actions, and its own
  design rule says "a change that needs undoing gets **Undo**". Versions do
  not undo Start fresh.
  - Source: `DESIGN.md:59`, `src/components/ChatView.tsx:542-564`,
    `server/fresh-start.ts:19-33`.
- **P161 (the step that adds a rebuild). Size the rebuild by the context
  window of the target model.**
  - Why: a known gap of the reference. The doc comment of `contextWindow`
    says that it sizes the rebuild, and the code uses a fixed 24,000 bytes
    and 40 messages.
  - Source: `server/contracts.ts:532-533`, `server/host/resume-check.ts:29`,
    `server/context-rebuild.ts:157`, `:194`,
    `docs/plans/agent-harness-upgrades.md:264-322`.
- **P162 (step 15). One rule for "the engine still holds this message".**
  - Why: the routine retry and the rebuild count in different ways. The
    routine check ignores the rewind flag and the divider of Start fresh, so
    a second start of a routine can point to instructions that the engine
    does not have. This comes from reading the code. Nobody ran it.
  - Source: `server/routine-recovery.ts:182-208`, `server/index.ts:8750`,
    `server/context-rebuild.ts:180-238`.
- **P163 (step 8). Add to "Done when".** "You edit a message, quit and start
  again. The versions and the active branch are there."
  - Why: follows the reference, which tests this.
  - Source: `server/store.test.ts:1840-1850`, `server/branching.test.ts:114-168`.

## New facts for the table of problems

- **Usage and cost numbers.** The row says "None. D20 has no usage event
  yet". The Claude CLI reports a running total for the session. Before
  v0.1.178, a summary or a keep-warm ping booked that whole total. Now it
  books only the growth over a stored base. With no known base, the
  reference still books the whole total.
  - Source: `server/drivers/claude-keepwarm.ts:86-99`,
    `server/drivers/claude-cost-history.ts:42-46`,
    `server/drivers/claude-warm-summary.test.ts:131`, commit `a9d483545`.
- **State lost at a restart:** P155, P159. **The same work done two times,
  or lost:** P153, P157, P158. **A feature added, then removed:** P158, P159.
