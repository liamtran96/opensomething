# Plan: Threads

The proposals from the research file
[`../research/features/threads.md`](../research/features/threads.md)
(batch 6, reference commit `eee23ebbe`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 8, 11 and 12.
- **State:** all open.
- **The main finding:** the unit of busy is the thread, and what waits for a
  free slot is a message, not a thread. A send that finds no free slot goes
  into the SQLite queue with the reason `capacity`
  (`server/index.ts:2179-2191`; `server/steer-queue.ts:140`, `:155`).

## Proposals

- **P182 (decision, replaces the D8 item "One turn per bot at a time").
  The thread is the unit of busy.** One running turn for each thread. A bot
  runs several threads at once, up to a limit. Busy never belongs to the
  bot. This also decides P3.
  - Why: follows the reference. The plan that D8 cites says "the
    direct-conversation decision below is superseded"
    (`docs/plans/2026-09-02-bot-concurrency.md:6-8`). The code tests busy
    for each thread and counts busy threads for the limit
    (`server/index.ts:2179-2191`). `docs/comparison.md:77-79` records the
    conflict.
- **P183 (plan, step 11). Rename step 11 and split it.** The name becomes
  "Threads: a bot has more than one thread". The pull requests: the
  `threads` table and its commands; the slot and the limit; the queued
  reason and the restart rule; the thread list. The three thread tools go
  in step 12.
  - Why: follows the reference: "The existing direct-bot Tasks become
    Threads" (`docs/plans/2026-09-09-independent-threads.md:3-4`).
- **P184 (step 11). One slot type, a queued reason, and every thread loads
  as idle.** A slot enum for each bot and thread: `Idle`, `Starting`,
  `Running`, `WaitingOnPerson`, `Settling`, taken by one `try_claim` before
  the first `await`. A thread that waits for a slot has `Queued { reason }`,
  and the window gets it. The slot is never stored; the queue rows are.
  - Why: better than the reference. It has four sources of busy: the task
    flag, the claim map, the room `busyBotId` and the bot-level slot
    (`server/store.ts:278-279`, `:1631-1636`; `server/index.ts:2179-2181`),
    and callers still read `bot.busy` (`server/index.ts:3858`, `:4988`).
    The window and `list_threads` each find "queued" by their own rule
    (`src/components/SidebarBotActivity.tsx:20`;
    `server/routes/internal-threads.ts:47-55`).
- **P185 (step 11). The limit is a setting with a real "not set" state, and
  the main thread has a reserved slot.** The default follows the
  reference: one thread for each 2 GiB of memory, from 3 to 16, and a
  setting from 1 to 16. No saved value means "follow the memory". Decide it
  with P70.
  - Why: better in two points. The first save of any `threads` setting
    writes the default of that moment, so more memory later never raises
    the limit (`server/config.ts:897`). The main thread is never at the
    limit but counts for the others, so a bot runs the limit plus one
    (`server/index.ts:2190`; `server/thread-capacity-api.test.ts:229-257`).
  - Source: `server/bot-thread-limits.ts:5-6`, `:15-18`;
    `server/config.ts:270`.
- **P186 (decision, step 12). `start_thread` opens the thread from stored
  data.** The tool stores the request as its own row first, then builds the
  opening of the new thread from that row. The create, the chip in the
  source thread and the queue row go in one transaction.
  - Why: `AGENTS.md`: "Text that opens a delegated turn is built from
    stored data, never from model output." The reference puts the model's
    `message` into the opening, and the three writes are separate
    (`server/index.ts:13883-13896`; `server/steer-queue.ts:140`).
- **P187 (step 11). Thread events in the protocol.** `thread.created`,
  `thread.updated`, `thread.deleted` and a slot change, each written with
  its row in one transaction.
  - Why: better than the reference. It sends whole or partial `bot` frames
    only (`packages/phone-protocol/src/wire.ts:964`), and the window guesses
    a deleted open thread from two frames (`src/state/store.tsx:1136-1148`).
    D20 has turn events only.
- **P188 (decision). The selected thread stays in the window.** The server
  keeps no selected thread for each bot. Each command names its thread
  (see P31).
  - Why: better than the reference. It saves `bot.threadId` on each switch
    (`server/routes/tasks.ts:241-264`), two windows fight over it, and the
    window has guard code for it (`src/state/snapshot-navigation.ts:52-89`).
- **P189 (step 8). A `threads` table, not threads inside the bot file.** One
  row for each thread, in the same database as the messages. A delete is
  one transaction.
  - Why: better than the reference. It keeps the threads inside
    `bots.json` and writes the file again on each change, with a known
    crash gap (`server/bots-text.ts:4-6`). Its delete runs a file save inside
    an SQL transaction (`server/message-db.ts:653-666`).
- **P190 (step 8 or 11). A queued message that cannot start for a short-lived
  reason stays queued.** Only a final refusal removes it.
  - Why: the problem "the same work lost". The reference drops it with only
    an activity row (`server/index.ts:7038-7048`).
- **P191 (step 11). The server sets the archive and snooze times, and sends
  an event at the end of a snooze.**
  - Why: better than the reference. It keeps the time that the window sends
    (`server/routes/tasks.ts:338-351`). An ended snooze stays on disk, and
    nothing is sent at its end (`server/index.ts:2846-2853`): each window
    keeps its own timer (`src/components/SidebarThreadRow.tsx:169-184`).
- **P192 (step 11). "Works in a folder" is a capability flag of the
  driver.**
  - Why: `AGENTS.md` gates engine behaviour on capability flags, never on a
    driver's name. The reference uses a list of driver names
    (`server/workspace.ts:16-18`).
- **P193 (step 11). Small rules for the thread record.**
  - One unit for the title length: characters. The reference counts UTF-16
    units at the route (`server/index.ts:13856`) and code points in the
    schema (`server/drivers/agents-schema.ts:58-60`).
  - A flag "named by the person" that a new generated title respects
    (`server/routes/tasks.ts:423-446`).
  - The `start_thread` reply gives the limit that was used
    (`server/index.ts:13898-13906`, against `:2190`).
  - A named constant for the short list (the literal 6 at
    `src/components/SidebarThreadRow.tsx:165`).

## Notes for the changelog

- The quote of v0.1.151 "marked busy with nothing running" is in section 5
  of `../research/changelog.md` but not in the row of v0.1.151.
- The fix of v0.1.161 that frees a turn whose engine process ended is only
  in `../research/changelog-check.md:524`.
