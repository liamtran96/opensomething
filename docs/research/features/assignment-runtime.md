# The assignment runtime

Research for step 13 of [`../../plan/README.md`](../../plan/README.md). The
reference project was read at commit `eee23ebbe` (2026-11-24, the release
v0.1.179 has no tag). The port goes to `bot-core`, module `runtime`.

**Update of 2026-11-28.** This file is correct for the changes in the
section "Changes up to `e1cc6a290` (v0.1.186)" at commit `e1cc6a290`
(2026-11-28). The tag v0.1.186 is commit `70eb44c1a` (2026-11-27). The
citations in that section and in each corrected statement are at
`e1cc6a290`. All other parts and citations were read at `eee23ebbe`, and
their line numbers can be old.

Rows of [`../reference-features.md`](../reference-features.md), group 3:
`runtime-contract.md`; "Limits of the runtime: depth 4, 24 requests for each
root, a 24-hour queue"; "Recovery after a restart: a cut turn of a teammate
runs again one time"; "Stop ends the request and all the work that it gave
out".

## 1. In short

The assignment runtime is the part of the reference project that records the
work one bot gives to another bot. It keeps that work in a SQLite database
and starts the turns of the work in order. It wakes the bot that asked when
the work ends. It decides what happens to the work after a restart. All work state
is in this one module. The rest of the server reaches it through one
adapter, the coordinator.

The special terms, one time each:

- **Assignment:** one row for one piece of work. It has a brief, a
  requester, an assignee, a status and an outcome
  (`server/runtime/types.ts:81-167`).
- **Root:** the top assignment of a tree. Each turn that a person, a routine
  or an outside event starts is a root (`docs/runtime-contract.md:13`).
- **Child:** an assignment that a running turn gives to another bot. It has a
  parent and a depth. The root has depth 0.
- **Requester:** the turn that gave the work. **Assignee:** the bot and the
  thread that do it.
- **Envelope:** the text that opens a delegated turn. The runtime builds it
  from the stored row, not from model output (`server/runtime/envelope.ts`).
- **Inbox:** the wake lane. One row for each result or question that a
  requester must see (`server/runtime/store.ts:115-162`).
- **Wake:** the requester's own resume turn. It carries every settled child
  at one time (`docs/runtime-contract.md:46`).
- **Park:** a node waits on the person, with the status `needs_input`.
- **Port:** the `TurnRunner` interface. The host implements it. The runtime
  calls it to start a turn, show a card, report a result and read names
  (`server/runtime/types.ts:309-338`).
- **Tick:** one pass of the runtime over all open rows. It expires, checks
  and starts work. The host calls it on a timer (`server/handoff-ticks.ts:5`).
- **Budget:** a count for each root, renewed by progress: requests,
  executions (turns) and wakes. **Clock:** a time limit: the queue, the stall
  of a tree, the stall of a turn and the wait on the person.
- **Cut turn:** a turn that was running when the server stopped.
- **Outward action:** a send, a post, a push or a payment that the turn did.
  A cut turn that did one never runs again.

The four rows of `reference-features.md` and what the code does:

1. **The contract.** `docs/runtime-contract.md` (144 lines) states one
   record, eight statuses, one wake lane, ten invariants, a restart policy,
   budgets, clocks and the port. The code follows it. Section 3.12 lists
   where they differ.
2. **The limits.** The runtime defaults are depth 4, 24 requests and a
   24-hour queue (`server/runtime/types.ts:374-386`). **The product uses 64
   requests and 96 turns for each root, not 24 and 48**
   (`server/runtime-coordinator.ts:48-49`, `:180`). Depth 4 and the 24-hour
   queue stay, because the constructor merges the defaults under the options
   (`server/runtime/runtime.ts:104` at `e1cc6a290`).
3. **The restart.** Each running row runs again one time, roots too, not
   only the turns of teammates. A row that gave out work, that did an
   outward action, that ran again already, or that froze for want of memory
   does not run again (`server/runtime/runtime.ts:113-162` at `e1cc6a290`).
4. **The stop.** Stop ends the request and all the work that it gave out,
   with teammates in the middle of a turn (`server/runtime/runtime.ts:717-735` at `e1cc6a290`).
   The contract still says that running children "keep their process and
   still report" (`docs/runtime-contract.md:48`). That sentence is old.

What this file adds to earlier research:

- [`store-and-data-format.md`](store-and-data-format.md) sections 3.9, 3.10
  and 4.4 have the database, the restart rule and the schema. This file adds
  the state machine, the budgets, the clocks, the wake, the stop, the tick
  loop, the border with the product layer and all the tests. It corrects one
  claim: `checkInvariants` has code for I1 to I9 only. I10 has no check
  (`server/runtime/invariants.ts:37-126`).
- [`question-cards.md`](question-cards.md) sections 3.3, 3.6 and 3.8 have the
  card, the reminder after one day and the close after three. This file adds
  the path of a child's question to its requester, the lost-wake risk at a
  crash, and the waits store.
- [`chat-turns.md`](chat-turns.md) has the turn of a person. This file adds
  how such a turn becomes a root with `begin()` and `end()`.

## Changes up to `e1cc6a290` (v0.1.186)

Four readers read the commits from `eee23ebbe` to `e1cc6a290`, and the lead
checked the key lines again. Paths are in the reference project, and the
lines are at `e1cc6a290`. "In the tag" means that
`git merge-base --is-ancestor <commit> 70eb44c1a` is true.

| Change | Commits | Tag | File and line | Sections of this file |
|---|---|---|---|---|
| A settlement that the store refused is kept in memory and retried on the next 5 ticks, not lost | `dc668ab6c`, `14b421cdd`, `827c728bf` (merge `5810c6e11`) | In the tag | `server/runtime/runtime.ts:58-59`, `:90-91`, `:200-206`, `:523-538`, `:540-564`, `:325-327`, `:363` | 3.5, 3.6, 4.4, 6.2, 8.3 |
| Work goes back to an ancestor when its reply does not wait (`none` or `poll`). Only `resume` is refused | `c47a9d772` | After the tag | `server/runtime/runtime.ts:232-243`; `server/runtime-coordinator.ts:307-310` | 3.4, 3.11, 3.12 |
| A child's `NEEDS INPUT:` question is read from the full reply, before the clip to 12,000 characters | `d184bc6f9`, `8e2e3223c`, `830c25f10` (merge `91a83e654`) | After the tag | `server/runtime-coordinator.ts:97-103`, `:724`; `server/coordinator.ts:97`; `server/index.ts:5032-5033` | 3.6 |
| The 4-hour limit of an unattended turn uses a monotonic clock | `b0b8cdf0f` | In the tag | `server/host/unattended-turns.ts:91-92` | 3.11 |
| A parked root keeps the cards of its earlier turns | `d54cdee6a` (merge `fed715d20`) | In the tag | `server/index.ts:1965`, `:1995-1999` | none (a host detail) |
| `ownThreads` is built before the coordinator, because `runtime.open()` can run while the server is still built | `a15f6ab26` | After the tag | `server/index.ts:3845-3857`; test `server/coordinator-restart-report.e2e.test.ts:16` | 9 |
| DeepSeek Harness is added to the name list of engines with their own auto reviewer | `579dd35b2` | In the tag | `packages/phone-protocol/src/approval-mode.ts:44-45`; `server/runtime/level.ts:16-21` | 3.12 (item 5 stays true) |

Checked, with no change of the runtime: "release rejected background-job
waiters" (`d78209fe6`, merge `f6e21fc5b`, after the tag) changes
`server/job-slots.ts:63-68`, the limiter of background jobs, which belongs
to [`helper-bot.md`](helper-bot.md). `2d156d909` (after the tag) batches the
saves of the routine scheduler. `6766ba4ca` (in the tag) removes the raw
input of a tool from the driver event `request.opened`, not from
`runtime.db`.

### The settlement retry

1. Before: when the store threw in `turnEnded` or in `end()`, the runtime
   only wrote a log line. The result was lost. The node stayed `running`
   with no live turn, until the turn stall or the tree stall failed it.
2. Now the result goes into the in-memory map `pendingSettlements`
   (`server/runtime/runtime.ts:90-91`). `end()` adds an entry when
   `finishTurn` throws (`:200-206`). `turnEnded` adds one only when its
   guard reads passed (`:523-538`).
3. `retrySettlements()` runs first in each tick (`:325-327`, `:540-564`).
   For each entry:
   1. It drops the entry when the node is gone, ended, not `running`, or
      dispatched again (a new `executions` count).
   2. Else it runs `finishTurn` again in one batch. A success drops the
      entry.
   3. A failure adds one attempt. After `SETTLE_RETRIES = 5` (`:58-59`) it
      drops the entry and writes "giving up after 5 retries".
4. While an entry is pending, the tree stall skips that tree (`:363`).
5. After the give-up, nothing settles the node. The row stays `running`
   with no handle until the tree stall fails the root (4 h in the
   product). The test `runtime.test.ts:1769` shows this path.
6. The map is lost at a crash. The row is then still `running`, so
   `open()` treats it as a cut turn and can run it again.
7. Tests: `server/runtime/runtime.test.ts:1705-1790` (four tests). The
   tests at `:1727` and `:1750` call `checkInvariants`. The tests at
   `:1753` and `:1769` do not.

### The ancestor rule

1. `admit` computes `reply` before the guard:
   `req.reply ?? (mode === "notify" ? "none" : "resume")`
   (`server/runtime/runtime.ts:232`). It refuses an ancestor only when
   `reply === "resume"` (`:238-243`). The comment says that a reply that
   cannot wait on the ancestor cannot close a wait cycle.
2. The coordinator does the same check (`server/runtime-coordinator.ts:310`).
   It also changes the reply to `poll` when the root's reply is `poll`
   (`:307-308`). The runtime does not do this.
3. Through the tools, the new path is mostly a one-way notice. A `poll` ask
   back to the bot that delegated still meets the crossed-wait check:
   `waitingOn` finds the open request of the ancestor and throws the
   `crossed()` text (`:322-323`, `:775-782`). Only `mode: "notify"` skips
   that check (`:322`).
4. The refusal text did not change: "Cannot assign work back to an
   ancestor; results return automatically" (`runtime.ts:242`).
5. The contract still says that Enqueue refuses work back to an ancestor,
   with one exception, `ownThread` (`docs/runtime-contract.md:36`).
6. Tests: `server/runtime/runtime.test.ts:204`;
   `server/runtime-coordinator.test.ts:396`, `:402-403`, `:410-411`.

### The question of a child

1. Before: the host clipped the reply to 12,000 characters, and `run()` read
   the `NEEDS INPUT:` line from the clipped text. A question line after
   character 12,000 was lost, and the child ended `completed`.
2. Now `handoffReply(text)` returns the clipped text and the question from
   the full text (`server/runtime-coordinator.ts:97-99`). The host uses it
   (`server/index.ts:5032-5033`). `HostTurnResult` has the new field
   `question` (`server/coordinator.ts:97`). `handoffQuestion` uses the
   field, else it parses the text (`runtime-coordinator.ts:101-103`).
   `run()` uses `handoffQuestion` (`:724`).
3. The runtime itself did not change. The question that it parks is still
   clipped to 12,000 characters (`server/runtime/runtime.ts:606`).

## 2. Files read completely

Seven subagents read the reference project at `eee23ebbe`. Each one read
its files completely and wrote a report. Paths are relative to the root of
the reference project.

### 2.1 The runtime module (`server/runtime/`, 24 entries)

| File | Lines | File | Lines |
|---|---|---|---|
| `runtime.ts` | 936 | `runtime.test.ts` | 1,677 |
| `store.ts` | 384 | `store.test.ts` | 275 |
| `types.ts` | 402 | `scenarios.test.ts` | 2,215 |
| `envelope.ts` | 293 | `envelope.test.ts` | 642 |
| `tree.ts` | 162 | `invariants.ts` | 126 |
| `import-legacy.ts` | 285 | `import-legacy.test.ts` | 240 |
| `capabilities.ts` | 66 | `capabilities.test.ts` | 99 |
| `level.ts` | 37 | `level.test.ts` | 94 |
| `questions.ts` | 33 | `questions.test.ts` | 23 |
| `handoff-limits.ts` | 14 | `handoff-limits.test.ts` | 15 |
| `status-reply.ts` | 41 | `status-reply.test.ts` | 45 |
| `index.ts` | 8 | `testing/fake-runner.ts` | 343 |
| `testing/fake-clock.ts` | 28 | | |

### 2.2 The contract, the coordinator and the host

| File | Lines |
|---|---|
| `docs/runtime-contract.md` | 144 |
| `server/runtime-coordinator.ts` | 773 |
| `server/runtime-coordinator.test.ts` | 2,215 |
| `server/runtime-coordinator-reads.test.ts` | 111 |
| `server/coordinator.ts`, `coordinator.test.ts` | 282, 89 |
| `server/job-view.ts`, `job-view.test.ts` | 180, 140 |
| `server/turn-outcome.ts` | 157 |
| `server/handoff-ticks.ts`, `server/due-timer.ts` | 61, 104 |
| `server/routes/jobs.ts`, `jobs.test.ts` | 161, 280 |
| `server/host/README.md` | 42 |
| `server/host/person-stop.ts`, test | 94, 75 |
| `server/host/loop-guard.ts`, test | 257, 839 |
| `server/host/unattended-turns.ts` | 152 |
| `server/host/dispatch-claims.ts`, test | 46, 42 |
| `server/host/queued-reason.ts`, test | 34, 37 |
| `server/host/room-jobs.ts`, test | 110, 93 |
| `server/room-queue.ts`, test, e2e test | 56, 80, 210 |
| `server/host/handoff-files.ts`, test | 474, 634 |
| `server/host/handoff-inbox.ts`, test | 228, 73 |
| `server/host/handoff-status.ts`, test | 196, 143 |
| `server/host/handoff-requests.ts`, test | 151, 173 |

### 2.3 Questions and waits

| File | Lines |
|---|---|
| `server/host/question-routing.ts`, test | 202, 354 |
| `server/host/person-waits.ts`, test | 156, 267 |
| `server/waits.ts`, test | 464, 591 |
| `server/routes/waits.ts`, test | 273, 295 |
| `server/waiting-on-person.ts`, test | 86, 118 |
| `server/handed-waits.e2e.test.ts` | 137 |
| `server/host/long-waits.ts` | 15 |
| `server/host/wait-words.ts`, test | 69, 140 |
| `server/host/ask-cards.ts` (only the parts for handed-on work are used here) | 391 |
| `shared/person-wait.ts`, `packages/phone-protocol/src/waits.ts` | 97, 5 |

### 2.4 End-to-end tests and documents

| File | Lines |
|---|---|
| `server/runtime-coordination.e2e.test.ts` | 350 |
| `server/runtime-paths.e2e.test.ts` | 316 |
| `server/runtime-roots.e2e.test.ts` | 838 |
| `scripts/bench-runtime-reads.ts` | 64 |
| `docs/verification/room-coordination.md` (read all, used for the runtime parts) | 506 |

### 2.5 Read in part

- `server/index.ts` (15,258 lines), in these ranges: 1870-2060, 2160-2360,
  2750-2770, 2790-2797, 3836-4110, 4372-4390, 6655-6665, 6980-7075,
  7625-7660, 7690-7702, 8722-8742, 9370-9440, 13515-13625, 14710-14750,
  15100-15258.
- `server/workspace-backup-databases.test.ts`: 1-120 (the runtime parts are
  14 and 61-103).
- `server/peer-provenance.ts`: 1-30, 58-77, 120-175.
  `server/provenance-label.ts`: 1-39. `server/host-fault.ts`: 10-22, 67-74.
- `packages/phone-protocol/src/approval-mode.ts`: 1-48.
- `server/bot-link/link.ts`: 1-15, 382-398, 412-421, 438-452, 514-528.
- `server/routines.ts`: 755-800. `server/person-replies.ts`: 105-138.
- The git history of the paths in 2.1 and 2.2, and the release note of
  v0.1.180 (`gh release view v0.1.180`).

### 2.6 Checked against the code by the lead

The lead read these lines again at `eee23ebbe`. Each claim agrees with the
code, except where the "Result" column gives a correction.

| Claim | Lines | Result |
|---|---|---|
| The product limits are depth 4, 64 requests, 96 executions, a turn stall of 24 h, a reminder after 24 h and a close after 72 h | `server/runtime-coordinator.ts:42-49`, `:180` | Agrees |
| The defaults stay under the options, so the 24-hour queue, the 4-hour tree stall and 48 wakes apply in the product | `server/runtime/runtime.ts:104` at `e1cc6a290`, `server/runtime/types.ts:374-386` | Agrees. One reader said that there is no 24-hour queue. That is wrong |
| `open()` has five branches for a running row, in this order: gave out work, outward action, cut twice, `restartCut`, run again | `server/runtime/runtime.ts:113-162` at `e1cc6a290` | Agrees |
| `stopRequester` cancels running children too | `server/runtime/runtime.ts:717-735` at `e1cc6a290` | Agrees. `docs/runtime-contract.md:48` says the opposite |
| `report()` calls the host before it writes `reportedAt` | `server/runtime/runtime.ts:790-803` | Agrees |
| The park and the wake of a child's question are two transactions | `server/runtime/runtime.ts:610` at `e1cc6a290`, `:614` at `e1cc6a290`, `:847-868` at `e1cc6a290` | Agrees |
| The brief goes into the envelope with `escapeEnvelope` only | `server/runtime/envelope.ts:140`, `:266-268` | Agrees. One reader said "not clipped". `admit` clips it to 12,000 characters (`runtime.ts:224`). Nothing redacts it |
| `answeredElsewhere` reads `all({openSince})` with no other filter | `server/runtime-coordinator.ts:712-720` | Agrees |
| The tick timer is 250 ms, 10 s or 1 h, and a kick is ignored while a tick runs or one is near | `server/handoff-ticks.ts:5`, `:44-50` | Agrees |
| The pace is "busy" while the engines are not read or a parked node waits for its check | `server/index.ts:9386` at `e1cc6a290` | Agrees |
| The partial index `assignments_live` exists | `server/runtime/store.ts:136-140` | Agrees |
| The contract refusal "no turn" is in the coordinator, not in the runtime | `server/runtime-coordinator.ts:25`, `:268` | Agrees |
| v0.1.180 changes no file of the runtime | `git diff --stat eee23ebbe 5478065c4 -- server/runtime server/runtime-coordinator.ts server/coordinator.ts docs/runtime-contract.md server/handoff-ticks.ts` is empty | Agrees |

## 3. How it works

### 3.1 The layers

1. **The runtime** (`server/runtime/`) owns the rows and all decisions. It
   holds no timer (`server/runtime/runtime.ts:1`). It reaches the host only
   through the `TurnRunner` port (`server/runtime/types.ts:309-338`).
2. **The coordinator** (`server/runtime-coordinator.ts`) builds the runtime,
   implements the port for the host, maps rows to product addresses and
   gives read models. It is the only caller of the runtime in production.
3. **The host** (`server/index.ts`) implements `CoordinatorHost`
   (`server/coordinator.ts:147-181`): it runs engine turns, posts chips and
   cards, and drives the tick timer.
4. **The product layer** (rooms, `coordinate_bots`, the Chief, the chat
   rows) calls the coordinator. That layer belongs to the feature
   bot-coordination. Section 3.14 gives the border.

### 3.2 Build and start

1. The host calls `createCoordinator({ dataDir, restartCut, now, wrote,
   handoffLimit, log, legacyThreads, host })` (`server/index.ts:3844-4034`).
   `wrote` kicks the tick loop and refreshes the hand-off status after each
   store write (`:3846`).
2. The coordinator opens `<data folder>/runtime.db`, or `:memory:` in tests
   (`server/runtime-coordinator.ts:176`). It wraps the store so that each
   write calls `wrote` (`:127-135`).
3. It makes the `Runtime` with a clock (`Date.now` and `performance.now`)
   and the limits of section 3.10 (`:178-183`).
4. Nothing reads the rows yet. The first call of any coordinator method runs
   `ready()` (`:186-208`). The comment says why: "reconciling calls the host,
   which is still initialising then" (`:185`).
5. `ready()` imports `room-handoffs.json` and the old delegation files, then
   calls `runtime.open()`, the restart policy of section 3.9.
   - A handoffs file that does not parse stays in place, and the next start
     tries again. An unreadable delegation file is renamed and its items are
     lost (`server/runtime/import-legacy.ts:40`, `:282-283`).
6. The host starts the tick loop at module load
   (`server/index.ts:9385-9404`):
   1. While the engines are not read, each tick returns at once, and the
      pace is "busy". The loop runs every 250 ms and does nothing (`:9386-9387`).
   2. The first real tick answers the parked roots whose cards the person
      acted on while the server was down (`reconcileParkedRoots`). Then it
      prunes trees older than 30 days (`:9389-9393`).
   3. It checks each node in the in-memory set `parkedNodesToReconcile`
      (`:9395-9401`).
   4. It calls `coordinator.tick()`, which prunes at most one time each day
      and then calls `runtime.tick()` (`:9402`,
      `server/runtime-coordinator.ts:581-602`).
7. Open risk: `drainQueuedSends()` runs before the server waits for the
   engines (`server/index.ts:15130`, `:15134`), and it calls
   `coordinator.active()`. So `runtime.open()` can run before the engines
   are read. Nobody verified the effect.

### 3.3 A turn of the person becomes a root

1. The host's `startTurn` calls `coordinator.beginTurn({ id, address,
   brief, level, opener?, origin, goalRunId? })` (`server/index.ts:7643-7648`).
   The turn identifier of the host is the root identifier.
2. `beginTurn` returns the row that exists for the same identifier
   (`server/runtime-coordinator.ts:369-370`). Else it calls `runtime.begin`
   (`:372-384`).
3. `begin` writes `enqueued` ("queued: root") and `started` ("running: turn 1
   (host), level <l>") in one transaction (`server/runtime/runtime.ts:161-178`).
   A repeated identifier throws on the primary key. That throw is not a
   typed refusal.
4. The turn ends through `settleDirectCoordination`, which deletes the
   settler before it calls it, so it settles one time
   (`server/index.ts:1977-1989`). For a root with no settler it calls
   `coordinator.endTurn` (`:1988`).
5. `endTurn` calls `runtime.end(id, EndResult)` (`server/runtime-coordinator.ts:395`).
   The result is `ok`, `text`, `evidence`, and optionally `needsInput` (open
   cards), `continue` (a step cap) or `stalled` (`server/runtime/types.ts:275-285`).
6. `end` on an identifier that is not a running root only logs "not a
   running root" (`server/runtime/runtime.ts:183`).
7. A new line of the person in a thread with a parked root starts a second
   root. The parked root stays (`server/runtime-roots.e2e.test.ts:260-264`).

### 3.4 A bot gives work to another bot (enqueue)

1. The product layer calls `coordinator.enqueue(...)`. The coordinator does
   its own checks first and throws a plain `Error` for each refusal
   (`server/runtime-coordinator.ts:268-291`):
   - a turn with no root: "The requesting turn has no root (no turn)" (`:25`, `:268`).
   - a hand-off limit of the host (pause, plan cap, usage cap) (`server/index.ts:3846`).
   - two bots that wait on each other, `crossed()` (`:137-143`, `:290-291`).
   - a duplicate sibling, which returns the row that exists (`:281-283`).
2. `runtime.enqueue` calls `admit` (`server/runtime/runtime.ts:218-272`). The
   checks run in this order:
   1. The parent exists, else "The requesting turn no longer exists".
   2. The parent is running, else "The requesting turn is not running".
   3. The brief is clipped to 12,000 characters (`:224`).
   4. The target is not an ancestor, else "Cannot assign work back to an
      ancestor; results return automatically". Two exceptions:
      `ownThread` (a bot opens work on itself in a new thread) and
      `answersSender` (a one-way notice back to the sender)
      (`server/runtime/tree.ts:80-91`). **Since `c47a9d772` (after the tag
      v0.1.186)** a third exception applies: the rule refuses only a reply
      of `resume`. Work with reply `none` or `poll` may go to an ancestor
      (`server/runtime/runtime.ts:232-243` at `e1cc6a290`). See the section
      "Changes up to `e1cc6a290`".
   5. Dedupe: the same brief, mode, bot, thread and group under the same
      parent returns the row that exists, unless `rework` is set and that
      row ended (`:246-248` at `e1cc6a290`). This check comes before the depth check.
   6. Depth: `parent.depth + 1 > depth` refuses with "Assignment depth limit
      reached (4)" (`:240`). So the deepest child has depth 4.
   7. For an unattended root, the total of 300 turns
      ("Request budget exhausted: 300 turns in all", outcome `budget`).
   8. The requests budget: "Request budget exhausted: 64 requests without
      progress" (outcome `budget`). A fan-out counts one time (`:241`).
   9. The level is computed (section 3.12, item 5).
   10. The host's `validate` runs. A throw gives "The host could not
       validate the request now". A text is the refusal.
   11. The row and its event `enqueued` are written in one transaction, with
       the root's request count (`:265-268`).
3. The result is `EnqueueResult`: `{ok: true, assignment, duplicate}` or
   `{ok: false, reason, outcome: "refused" | "budget"}`
   (`server/runtime/types.ts:237-239`). The type also allows
   `outcome: "duplicate"`, but no code returns it.
4. The coordinator changes the refusal to text and throws it: a budget
   refusal gets its own wording, and a depth refusal becomes "Room handoff
   depth limit reached" (`server/runtime-coordinator.ts:339-342` at `e1cc6a290`).

### 3.5 The tick

`tick()` does not overlap itself and does nothing after `close()`
(`server/runtime/runtime.ts:286-295`). One tick does these steps:

0. **Since v0.1.186:** first, `retrySettlements()` settles each result that
   the store refused before (`server/runtime/runtime.ts:325-327`,
   `:540-564` at `e1cc6a290`).

1. It reads all open rows through the partial index (`:330` at `e1cc6a290`) and goes
   deepest first, so that each node fails with its own reason.
2. **Queue clock.** A `queued` row with no continuation and not away, older
   than 24 h, fails with `expired` and "never started" or "not resumed"
   (`:325-326`). The time starts at `max(lastActivityAt, bootAt)`, so a
   restart opens the window again.
3. **Wait on the person.** A child in `needs_input` goes to `chaseParked`
   (section 3.7).
4. **Turn stall.** A running turn with no activity for `turnStallMs` fails
   with `stalled` (`:332-334`). The clock is monotonic. The product sets 24 h,
   so the host watchdog (20 minutes, `server/index.ts:4928` at `e1cc6a290`) acts first.
5. **Validate.** The host's `validate` runs for each open row. A text fails
   the row with `refused` (`:338-345`).
6. **Tree stall.** A tree with no progress of its root for 4 h fails as a
   whole, unless a node waits on the person, holds a continuation or is
   away (`:346-356`). Since v0.1.186, a node with a pending settlement also
   stops the tree stall (`server/runtime/runtime.ts:363` at `e1cc6a290`).
7. **Resume.** A `waiting` node becomes `resume` when all its awaited
   children ended and were reported, or when a child asks a question
   (`:362-375`). A root whose reply is `poll`, or that has nothing to answer,
   completes instead.
8. **Dispatch** (`:379-426`). For each `queued` or `resume` row:
   - A rerun waits for its slot: 4 at once, then one each 500 ms
     (`:400`, `:424`). It writes "waiting its turn to start again after the
     restart".
   - A rerun whose thread has newer work from another root since the boot
     fails with "cut by a restart; newer work in this conversation started
     before it could run again, so it was not run again" (`:393`, `:440-442` at `e1cc6a290`).
   - Turns in the same thread never overlap (`:395`). In a room, the turn of
     the requester holds its thread (`:398`).
   - The executions budget (96) refuses a new turn but never the owed
     follow-up of a node whose children ended (`:408-412`).
   - `validate` runs again, then `canStart`. `true` starts the turn. A text
     writes one `held` event for each change of reason. `false` waits with
     no event (`:606-612`).
9. `changed` goes to the host one time for each tick (`server/runtime/runtime.test.ts:711`).

`pace()` tells the host how soon to tick again: "busy" while any row runs or
waits in the queue, "parked" while only parked work is open, else "idle"
(`:285-292` at `e1cc6a290`). The host maps these to 250 ms, 10 s and 1 h
(`server/handoff-ticks.ts:5`). Section 8 has the risk of a loop that stays
"busy".

### 3.6 A delegated turn, from dispatch to result

1. **The claim.** `dispatch` writes `running`, `admitted`, `started`
   ("running: turn N[ (resume)], level L"), the root budgets and the
   delivered marks of the inbox items, in one transaction. Only after the
   commit does it call `runner.run` (`server/runtime/runtime.ts:473-497`). A
   failed write starts nothing (`server/runtime/runtime.test.ts:134`).
2. **The input.** `RunInput` has the turn kind (`first`, `resume`, `rerun`,
   `answered`, `continued`), the restart note, the envelope, the answer, the
   settled children, the children that ask, and the continuation
   (`server/runtime/types.ts:241-262`). A resume carries every settled
   child, also the ones from earlier rounds (`runtime.ts:444-445`).
3. **The text.** The coordinator builds the text from stored rows with
   `composeEnvelope`, `composeResume` or `composeRootTurn`
   (`server/runtime-coordinator.ts:678-690`). A child's result whose route
   no longer validates is replaced by "Result withheld: …" (`:762-768`).
4. **The host turn.** The host adds a roster block on the first turn, then
   calls `startTurn(..., coordination: { id, resumed, settle })`
   (`server/index.ts:3938-3997`). On an abort it interrupts the thread and
   settles with "Coordinated work was stopped" (`:3982-3987`). The host has
   no time limit of its own here.
5. **The result.** The coordinator's `run()` maps the turn to a `RunResult`
   in this order (`server/runtime-coordinator.ts:667-701`):
   1. aborted: `failed` with `stopped`.
   2. a step cap: `continue`.
   3. open cards: `needs_input` with the cards.
   4. a `NEEDS INPUT:` line, children only: `needs_input`. Since
      `d184bc6f9` (after the tag v0.1.186), the line is read from the full
      reply before the clip to 12,000 characters, and it comes as the field
      `question` (`server/runtime-coordinator.ts:97-103`, `:724` at
      `e1cc6a290`).
   5. an unanswered approval, children with a person origin: `needs_input`
      with "Default: Try again".
   6. not ok: `failed` with `stalled` or `provider_error`.
   7. else `completed`, with an optional check by a small model that the
      reply is only an acknowledgement (`server/runtime/status-reply.ts:14-41`).
6. **Settle** (`server/runtime/runtime.ts:511-600`). Only the live in-memory
   handle can settle the turn, so a late result of a stopped turn is dropped
   (`:511-522`). **Since v0.1.186**, a result whose store write threw is also
   kept in `pendingSettlements` and settles on a later tick, with no handle,
   while the node is still `running` with the same `executions` count
   (`server/runtime/runtime.ts:523-564` at `e1cc6a290`). Then:
   - `continue`: the loop guard checks the evidence. A stop gives `failed`
     with `stalled`. Else the row is `queued` again with event `continued`
     (`:542-560`).
   - `needs_input`: section 3.7.
   - awaited children still open: `waiting` (`:582-591`).
   - else `completed` or `failed`, after one more `validate` (`:537-539`, `:596-597`).

### 3.7 A question of a child reaches its requester

1. The child ends with `needs_input`. The runtime sets the question
   (clipped to 12,000), `lastActivityAt`, the cards and, for a child with no
   cards at Full access, `decide`. It deletes `remindedAt`. It writes
   `parked` (`server/runtime/runtime.ts:563-568`).
2. It calls `runner.park`. The host shows a card "Your bot has a question",
   a chip "<bot> needs your input: <question>" in the requester's thread and
   a notification (`server/host/ask-cards.ts:185-248`). With `decide`, the
   card is posted already answered by the requester bot.
3. In a **second** transaction it writes the `needs_input` inbox item and
   counts a wake (`runtime.ts:614` at `e1cc6a290`, `:847-868` at `e1cc6a290`). More than 48 wakes fail the
   whole root with `budget`.
4. On the next tick the waiting requester becomes `resume` with
   "resume: a teammate asks" (`:362-375`, `:848-857`). Its turn carries the
   question (`carrying`) and gets one of three texts
   (`server/runtime/envelope.ts:190-220`):
   - **decide**: "yours to answer", with the child's default.
   - **cards**: "Only <person> can do that and it is already in front of
     them: do not ask them again".
   - **person**: the child "waits on <person> … however long it takes". A
     question that only the person can answer says "do not answer it for
     them".
5. Who decides the route: `requesterDecides` is Full access, a bot turn as
   requester and an origin that is not outside
   (`server/runtime/questions.ts:7-8`). A question about sign-in, payment,
   secrets or the person's own account goes to the person. The test is a
   regular expression in English and German only (`:13-21`).
6. The answer comes back on one of three paths. Each one calls
   `runtime.answer`:
   - the person answers the card (`server/host/ask-cards.ts:313-320`).
   - a bot sends `coordinate_bots` with `answers` (`server/host/question-routing.ts:102-139`).
   - the requester's carrying turn ends with no answer, so the default
     applies (`runtime.ts:529`, `:886-895`).
7. `answer` works only in `needs_input`. It writes `queued` and `answered`
   in one transaction (`runtime.ts:643-657`). A second answer, an answer
   after the close and an answer after a stop return a bare `false`.
8. The next turn of the child is `answered`. Its envelope ends with
   "Your question was: … The person answered: …", "@X answered: …" or
   "Nobody was asked, at this level: go on with your default …"
   (`envelope.ts:112-123`).
9. **The clocks of the wait** (`runtime.ts:859-878`). Only a child has them.
   A root never expires.
   1. More than 24 h after `lastActivityAt`, with no reminder yet and no
      `decide`: it sets `remindedAt`, writes `reminded`, and calls
      `runner.remind`. The host sends "Still waiting on your answer: … This
      work closes in N days if nobody answers."
   2. The node closes when `now > max(lastActivityAt + 72 h, remindedAt + 48 h)`.
      The close is `failed` with `expired` and "the person did not answer".
      Each open node below gets "Stopped with the request it was for".
   3. The tick that sends the reminder never closes the node. A late
      reminder gives the person 48 more hours.
   4. The clock is the wall clock, so a restart does not open the window
      again.

Some traffic from a requester to a child does not go through the runtime
(`server/host/question-routing.ts:122-125`, `:143-153`, `:180-199`):

- a steered addition (`composeAddition`).
- an answer to a live card of a running turn.
- an answer of the Chief for the person.

### 3.8 Stop and cancel

1. **The person stops a conversation.** Each Stop goes to
   `interruptDirectThread` (`server/index.ts:2229-2245`):
   1. It marks the request stopped and closes the parked cards of the thread
      while they still belong to the node (`:2231-2236`).
   2. It calls `coordinator.stopAwaitingDirect(threadId, cause)`, which calls
      `runtime.stopRequester` (`:2237`, `server/runtime-coordinator.ts:470`).
   3. Only then does it interrupt the engine of this thread (`:2243`).
2. `stopRequester` (`server/runtime/runtime.ts:717-735` at `e1cc6a290`), whose comment says
   "stop means stop":
   - for each open node of that conversation, it cancels every open child
     tree, started or not, with "Stopped before it started", "Stopped before
     it resumed" or "Stopped with the request it was for".
   - then it cancels the node itself. Nothing resumes it.
3. The engine of each child stops because the runtime aborts its signal.
   The host's abort handler then interrupts the child thread
   (`server/index.ts:3982-3984`).
4. The same path serves these callers: the Stop button, the guarded-request
   route, the loop-guard stop, the unattended limits, `interruptTurn` of a
   routine and the Stop of a room (`server/index.ts:2758-2760`, `:6995-7000`,
   `:14731-14735`).
5. **The person stops one hand-off** (new in v0.1.180, merged before
   `eee23ebbe`). `POST /api/threads/:id/job/:assignmentId/stop` calls
   `coordinator.stopHandoff`, which calls `runtime.cancel(id, "stopped")`
   (`server/routes/jobs.ts:78-90`, `server/runtime-coordinator.ts:504-516` at `e1cc6a290`).
   The requester hears it and goes on.
6. **cancel** cascades down the tree, aborts running turns and writes
   `cancelled` with `stopped` (`runtime.ts:668-673`). The requester gets
   the report.
7. The coordinator remembers for 24 h, in memory, that the person stopped
   that work (`server/runtime-coordinator.ts:168` at `e1cc6a290`, `:498-516`). A guard keeps
   a stop that the system made (a restart, a cut) from being recorded as the
   person's stop (`:462-495`).

### 3.9 The restart

`open()` runs one time and uses only stored rows
(`server/runtime/runtime.ts:113-162` at `e1cc6a290`).

1. It reads the open rows and sorts them deepest first, so that the fate of
   a child marks its parent first.
2. A row in `needs_input`: it writes "needs_input: parked again" and calls
   `park(n, question, true)`. The host shows nothing two times
   (`server/host/ask-cards.ts:230`).
3. Rows in `queued`, `waiting` and `resume` stay as they are.
4. For a `running` row, the first branch that matches wins:
   1. It gave out work since its turn began (found with event identifiers,
      not times, `server/runtime/tree.ts:105-126`): `waiting`, with
      `restart = "cut"`.
   2. It did an outward action, as the host port `outward` reports: `failed`
      with `interrupted` and "Interrupted by an <product> restart after it
      already <what>; not resumed, so nothing is done twice."
      (`server/runtime/tree.ts:23-33`).
   3. It ran again one time already: `failed` with `CUT_TWICE`.
   4. The host hook `restartCut` gives a line (a turn that used the browser
      when the server froze for want of memory): `failed` with that line.
   5. Else it runs again one time: `restart = "rerun"`, `restarts + 1`,
      status `resume` if it has children, else `queued`.
5. The parent of a cut child gets `restart = "teammates"`. Its next turn
   lists the cut teammates (`tree.ts:150-162`).
6. Each ended row with no `reportedAt` goes into `reportDue`. This line
   reads **all** rows, ended rows too (`runtime.ts:161` at `e1cc6a290`).

The rerun turn opens with a note: "… First check what that turn already did
(files, commits, messages, anything sent or started) and verify anything
uncertain, so nothing is done twice …" (`tree.ts:153`).

Rows are the roots too. A person's cut turn runs again one time
(`server/runtime-roots.e2e.test.ts:333-361`). The host's `outward` port
blocks one case: "A person's cut root never reruns after a follow-up in its
thread" (`server/index.ts:4035-4043` at `e1cc6a290`).

At shutdown the host closes the runtime before it stops the engines, "so
what the teardown fails stays cut for the next start" (`:15188-15189`). After
a crash, the running rows stay `running`, so the next start runs them again
(`:15258`).

### 3.10 Budgets and clocks

| Limit | Default (`types.ts:374-386`) | In the product | Enforced at (`runtime.ts`) |
|---|---|---|---|
| Depth | 4 | 4 | `:240` |
| Requests for each root, since the last progress | 24 | **64** (`runtime-coordinator.ts:48`) | `:246-249` |
| Turns for each root, since the last progress | 48 | **96** (`:49`) | `:408-412` |
| Wakes for each root | 48 | 48 | `:572-574`, `:817-823` |
| Turns in all, unattended roots | 300 | 300, or `OMB_HANDOFF_MAX_TURNS` | `:242-245`, `:404-407` |
| Failed hand-offs in a row, unattended roots | 5 | 5, or `OMB_HANDOFF_MAX_FAILURES` | `:772`, `:783-787` |
| Queue | 24 h | 24 h | `:325` (wall clock, from the boot) |
| Tree stall | 4 h | 4 h | `:346-356` (wall clock, from the boot) |
| Turn stall | 20 min | **24 h** (`runtime-coordinator.ts:42`) | `:332` (monotonic) |
| Reminder | infinite | **24 h** (`:45`) | `:868` (wall clock) |
| Close of the wait | infinite | **72 h** (`:46`) | `:876` (wall clock) |

- Progress renews the per-root budgets: a child that completes calls
  `renew()` (`runtime.ts:769`, `:829-832`). For a root that a person started,
  a **failed** child renews them too. Only unattended roots stop at 5
  failures in a row (`:769-773`).
- Waits with no limit by design: a root parked on cards, any park when the
  wait limit is infinite, a node queued to continue, and work held for an
  away place (`types.ts:366-368`, `runtime.ts:325`, `:901-903` at `e1cc6a290`).

### 3.11 Loop guards

Four separate things carry this name or do this work:

1. **The continuation guard** (`server/runtime/tree.ts:38-63`). Two
   continuations in a row with no successful tool call, or the same error
   three times, end the node with `failed` and `stalled`. A continuation
   with no evidence counts neither way.
2. **The ancestor rule** in `admit` (section 3.4, step 2.4). Since
   `c47a9d772` (after the tag v0.1.186), it guards only wait cycles: it
   refuses only a reply of `resume` (`server/runtime/runtime.ts:238-243` at
   `e1cc6a290`).
3. **The crossed wait** in the coordinator: two bots that wait on each other
   (`server/runtime-coordinator.ts:137-143`).
4. **The shell repeat guard** of the host, for one command that fails the
   same way again and again in one turn: a chip at 5, 10 and 20 repeats, one
   steered note at 5, and a stop at 20 for unattended turns only
   (`server/host/loop-guard.ts:1-4`, `:44-46`, `:100`, `:149-155`).
   Unattended turns also stop after 4 h, 400 model requests or 5 denials
   (`server/host/unattended-turns.ts:19`). Since v0.1.186 the 4 h are on a
   monotonic clock, so a clock set forward or a computer asleep does not
   count (`server/host/unattended-turns.ts:91-92` at `e1cc6a290`).

### 3.12 Where the contract and the code differ

1. **Stop.** The contract says that running children "keep their process
   and still report" (`docs/runtime-contract.md:48`). The code cancels them
   (`runtime.ts:717-735` at `e1cc6a290`, tests `runtime.test.ts:547-568`).
2. **Budgets.** The contract has "three budgets per root" and "Progress
   renews them; nothing else does" (`:89`). The code also has the total of
   300 and the 5 failures in a row, and a failed child renews the budgets of
   a person's root (`runtime.ts:769`).
3. **I4.** The contract reports a root only when the runtime ended it
   (`:45`). The checker wants `reportedAt` on every ended root
   (`server/runtime/invariants.ts:65`).
4. **Authority.** The contract says "exactly three" authorities and lists
   two (`:63-64`). The code has three (`server/provenance-label.ts:15-19`).
   The runtime uses two of them.
5. **The level rule** reads name lists in `approval-mode.ts`, not the
   capability flags that the contract names (`server/runtime/level.ts:16-21`).
   A test keeps the two the same (`level.test.ts:67-86`).
6. **Ports.** `remind?` is a port, and `admitted`, `progress`, `budget`,
   `held` and `reminded` are event kinds. The contract has none of them.
   The contract says that progress writes no event, and that is true.
7. **Goal runs.** The contract gives rules for `goalRunId`
   (`:49`). The runtime only stores the field. The host applies the rule
   (`server/index.ts:1956-1975`).
8. **One answer to the same request** (`:38`) is in the coordinator
   (`server/runtime-coordinator.ts:712-742`), not in the runtime.
9. `docs/verification/room-coordination.md` is older still: it says 24
   requests and 48 turns (`:465-471`), a question that expires after 30
   minutes (`:470-471`), and that a person's own turn does not run again
   (`:54-55`).
10. **The ancestor rule (since `c47a9d772`, after the tag v0.1.186).** The
    contract says that Enqueue refuses work back to an ancestor, with one
    exception, `ownThread` (`docs/runtime-contract.md:36` at `e1cc6a290`).
    The code also lets through each reply that does not wait (`none`,
    `poll`) (`server/runtime/runtime.ts:238-243` at `e1cc6a290`).

### 3.13 The problems of `changelog.md` in this code

| Release and problem | What the code does now |
|---|---|
| v0.1.74 "prevent duplicate jobs across restarts" | Not the runtime. It is webhook receipts (`server/routines.ts:763-799`), from before the runtime existed. The runtime has its own dedupe (section 3.4) |
| v0.1.83 "send each teammate result once" | Before the runtime too. Now `report()` stops when `reportedAt` is set (`runtime.ts:791`), and the host posts one result row for each child (`server/index.ts:3907`). The order "report, then write" leaves a second report possible after a crash (section 8) |
| v0.1.108, section 6 "Work between bots" | The runtime replaced two other paths: the room hand-off tree (`server/room-handoffs.ts`, deleted in `1b5877a6f`) and the delegation ledger with five tools (`server/delegations.ts`, deleted in `838e320c1`). Their files are imported one time at start. Each hand-off goes through `coordinator.enqueue` (`server/runtime-coordinator.ts:297`). The coordinator writes rows only there, in `beginTurn` and in the import |
| v0.1.149 "all its CPU re-checking the queue" | Not the tick loop. It was the memory queue of engines, which read all open rows for each waiter (`e14bffd02`). The fix reads one thread with `runningIn` (`server/runtime-coordinator.ts:362-365`) |
| v0.1.153 "closes after three" | Section 3.7, item 9. Commit `7dd032b8d` |
| v0.1.165 "a crash restarts cleanly and interrupted turns run again" | The paced reruns and the superseded rerun (section 3.5, step 8). Commit `d4108c8b0` |
| v0.1.178 "a hand-off whose file went missing is still delivered" | Not the runtime. It is the link between two places of the person. A **result** is delivered without its files, with a note (`server/bot-link/link.ts:417-421`). An **outgoing hand-off** whose files are gone fails after 3 tries and is not delivered (`:387-396`). On one server, a missing stored file gives the line "no longer kept; ask @X to send it again" and the turn runs (`server/host/handoff-files.ts:299-302`) |
| Section 7 row "The runtime scans all ended work" | Fixed two times: the partial index (v0.1.109, `66ddff8a7`, from 12.7 s to 190 ms for a broadcast at 15,012 rows) and reads by thread (v0.1.165, `c6f93f124`). Three full reads stay: section 8, item A3 |
| v0.1.179 and v0.1.180 | v0.1.179 has no release. The note of v0.1.180 names "See and stop each hand-off", "One-off hand-off threads tidy themselves up", "A send to a busy standing thread runs beside the busy turn" and "After a restart caused by running out of memory, the task that was using the browser is not started again by itself". Each one was merged before `eee23ebbe`. The diff from `eee23ebbe` to `5478065c4` changes no runtime file |

### 3.14 The border with the product layer

The product layer calls only the `Coordinator` interface
(`server/coordinator.ts:183-250`). Each coordinator method calls these
functions of the runtime (`server/runtime-coordinator.ts`):

| Coordinator method | Runtime function | Coordinator lines | Use |
|---|---|---|---|
| `createCoordinator` | `new Runtime(store, runner, options)` | 178-183 | build |
| any first call (`ready()`) | `open()` | 207 | restart policy, one time |
| `beginTurn` | `begin(req)` | 372-384 | a root for each turn of a person, a routine, a room or an outside caller |
| `endTurn` | `end(id, result)` | 395 | the end of such a turn |
| `enqueue` | `enqueue(req)` | 297-312 | a hand-off |
| `answerNode`, answer by thread | `answer(id, text, by?)` | 402, 622 | an answer to a parked node |
| `followCard` | `followCard(id, from, to)` | 407 | a card that moved |
| `releaseParked`, `cancelRoom`, `cancelDirect`, `stopHandoff` | `cancel(id, reason, outcome)` | 413, 451, 458, 483 | release a park, cancel a room, cancel a thread, stop one hand-off |
| `stopAwaitingDirect` | `stopRequester(owner, reason)` | 470 | Stop of a conversation |
| `status`, `poll` | `status(id)`, `poll(owner)` | 318, 350 | `assignment_status`, outside runtimes |
| `progress`, `held` | `progress(id)`, `held(id, why)` | 610, 615, 739 | activity and a held reason from the host |
| `liveEdges` | `liveEdges()` | 560 | the team map |
| `tick`, `pace` | `tick()`, `pace()` | 584, 589 | the tick loop |
| `prune` | `prune(before)` | 433, 597 | 30 days |
| `close` | `close()` | 605 | shutdown |

`outstanding()` has no caller. The coordinator also reads the store directly
for its read models, and it uses `envelope.ts`, `tree.ts`, `questions.ts` and
`status-reply.ts` directly.

## 4. The data

### 4.1 The database `runtime.db`

The schema of the three tables is in
[`store-and-data-format.md`](store-and-data-format.md) section 4.4
(`server/runtime/store.ts:115-162`). This file adds the indexes and the
rules of the store.

- Indexes on `assignments`: `root_id`, `parent_id`, `status`,
  `requester_thread_id`, `requester_run_id`, `(assignee_bot_id,
  assignee_thread_id)`, `(assignee_thread_id, created_at)`, and the partial
  index `assignments_live ON assignments(created_at) WHERE status NOT IN
  ('completed', 'failed', 'cancelled')` (`store.ts:128-140`). There is no
  index on `finished_at`.
- Pragmas: WAL and `synchronous = NORMAL`. No `busy_timeout`, no foreign
  keys, no migrations. Each record has `version: 1` (`store.ts:236-237`).
- A transaction starts with `BEGIN IMMEDIATE`. A nested call is a savepoint
  (`store.ts:261-287`). `insert` and `update` write the row and its event in
  one transaction (`:330-342`). `withBatch` in the runtime only groups the
  calls to `changed`. It is not a transaction (`runtime.ts:920-930`).
- The row is the whole record as JSON. A `zod` schema checks it at read. One
  bad row makes each `all()` throw (`store.ts:184-190`).
- A parse cache holds up to 8,192 rows or 8,000,000 characters
  (`store.ts:168-171`).
- Nothing stops a second process from opening the same file. The host has a
  lease on the data folder for that.

### 4.2 The record

`Assignment` (`server/runtime/types.ts:81-167`), with its groups of fields:

| Group | Fields |
|---|---|
| Tree | `id`, `rootId`, `parentId?`, `depth` (root 0) |
| Who | `origin {kind: person, routine, outside; source; ref?; quote? (≤ 400, never model text); onBehalfOf?}`, written once at the root and copied down. `requester {kind: person, bot_turn, routine_run, external_runtime; botId?; threadId?; runId?; chief?}`. `assignee {botId; destination {kind: work_thread, standing_thread, room_thread; threadId; groupId?}}` |
| Work | `mode` (`work`, `consult`, `notify`), `reply` (`resume`, `poll`, `none`), `brief` (≤ 12,000), `doneWhen?`, `goalRunId?`, `rework`, `batchKey?`, `fanOut?`, `approved?` |
| State | `status`, `outcome?`, `outcomeDetail?`, `fault?` (a host failure kind) |
| Level | `level` (`ask`, `edits`, `auto`, `full`, `custom`), `levelSource` (`own`, `chief`, `engine_cap`) |
| Counts | `executions` (turns started), `restarts`, `restart?` (`rerun`, `cut`, `teammates`) |
| Times | `createdAt`, `startedAt?`, `lastActivityAt`, `finishedAt?`, `reportedAt?`, `remindedAt?` |
| Result | `result` (≤ 12,000), `evidence? {commands, filesChanged, toolCalls, okToolCalls, errors (≤ 3, each ≤ 200), outward, summary}`, `statusOnly?` |
| Question | `question?`, `decide? {default?}`, `answer?`, `answeredBy? (bot or default)`, `cards?`, `carrying?` |
| Loop | `continuation? {note, handoffPath?, count}`, `guard? {stale, errors}` |
| Root only | `budgets? {since, requests, executions, wakes, total?, failed?}` |

- **Statuses:** `queued`, `running`, `needs_input`, `waiting`, `resume`,
  `completed`, `failed`, `cancelled`. The last three are terminal
  (`types.ts:51-61`).
- **Outcomes:** `done`, `needs_input`, `cap_continued`, `stalled`,
  `interrupted`, `budget`, `provider_error`, `denied`, `expired`, `stopped`,
  `refused`, `duplicate` (`types.ts:64-76`).
- **Event kinds:** `enqueued`, `refused`, `admitted`, `started`, `progress`,
  `parked`, `answered`, `waiting`, `resume_due`, `settled`, `reported`,
  `woken`, `cancelled`, `restart_reconciled`, `budget`, `stalled`,
  `continued`, `held`, `reminded` (`types.ts:185-188`). The detail of each
  event is text. The replay reads the status from the first word of the
  detail (`invariants.ts:9-27`).
- **Inbox item:** `{id, ownerBotId?, ownerThreadId?, ownerRunId?,
  assignmentId, kind (settled, needs_input, stalled), createdAt,
  deliveredAt?}` (`types.ts:198-211`).

### 4.3 The state machine

Each arrow writes the row and its event in one transaction, except where it
says "two writes" (`server/runtime/runtime.ts`).

| From | To | Trigger | Lines |
|---|---|---|---|
| none | `running` (root) | `begin` | 161-178 |
| none | `queued` | `enqueue` passes all checks | 218-272 |
| `queued`, `resume` | `running` | dispatch | 433-509 |
| `running` | `queued` | `continue`, loop guard passes | 542-560 |
| `running` | `failed` (`stalled`) | `continue`, loop guard stops (two writes) | 546-550 |
| `running` | `needs_input` | a question or open cards (the wake is a second write) | 563-575 |
| `running` | `waiting` | awaited children are open | 582-591 |
| `running` | `completed`, `failed` | the turn ends | 596-597 |
| `running` | `failed` (`refused`) | `validate` refuses at the end of the turn | 537-539 |
| `waiting` | `resume` | all children ended, or one asks | 362-375 |
| `waiting` (root) | `completed` | all ended and nothing to answer | 368-369 |
| `resume` | `waiting` | nothing left to resume for | 386-390 |
| `needs_input` | `queued` | `answer`, or the default | 642-657, 886-888 |
| `needs_input` (child) | `failed` (`expired`) | the wait closes | 876-877 |
| `queued` | `failed` (`expired`) | the queue clock | 325-326 |
| `running` | `failed` (`stalled`) | the turn clock | 332-334 |
| any open | `failed` (`refused`) | `validate` on a tick | 338-345 |
| open tree | `failed` (`stalled`) | the tree clock | 346-356 |
| `queued` (rerun) | `failed` (`interrupted`) | newer work in the thread | 393 |
| open tree | `failed` (`budget`) | turns in all, turns, wakes, failures in a row | 404-412, 572-574, 783-787 |
| any open | `cancelled` (`stopped`) | `cancel`, `stopRequester` | 668-693 |
| `running` | `waiting`, `failed`, `queued`, `resume` | `open` after a restart (section 3.9) | 109-158 |

A terminal row never changes again. `settle` on a terminal row does nothing
(`:756`).

### 4.4 State that is only in memory

These are lost at a crash (`runtime.ts:81-94`, `:299-301`):

- the turn handles (`AbortController`, last activity, carried questions).
- `heldFor` (so a held reason is written again after a restart), `heldAway`,
  `awayNow`.
- `reportDue` (rebuilt by `open`), `rootActivity`, `nextRerunAt`,
  `rerunsStarted`, `bootAt`.
- Since v0.1.186, `pendingSettlements`: the results that the store refused
  (`server/runtime/runtime.ts:90-91` at `e1cc6a290`). After a crash in the
  retry window, the row is still `running`, so `open()` treats it as a cut
  turn and can run it again.

In the coordinator: the memory of the person's stops (24 h), the stop cause,
the join wait of a shared answer (`server/runtime-coordinator.ts:160-166`).

In the host: the dispatch claims, the settlers, the parked seats, the set
`parkedNodesToReconcile`, and the chips in the requester's thread
(`server/index.ts:1876-1910`, `server/host/ask-cards.ts:110`, `:135`).

### 4.5 The views

- `HandoffView` (`server/runtime-coordinator.ts:105-133` at `e1cc6a290`) maps a row for the
  product layer. `needs_input` shows as `"waiting"`, so the view cannot tell
  a park from a wait on children. A running root on its first turn shows as
  `"source"`.
- `JobNode` and `JobView` (`server/job-view.ts:16-56`): section 5.

### 4.6 The texts that the runtime writes

The fixed texts have the product name of the reference project in them. This
file writes `<product>` in its place. For example `CUT_TWICE`: "Interrupted by another <product> restart after
resuming once; not resumed again. Some of its steps may already have taken
effect." (`server/runtime/tree.ts:5`). The others are at `tree.ts:7`,
`:150-162` and `runtime.ts:34-36`, `:56`. Our port must use other words
(`AGENTS.md`, "Reference code and licensing").

## 5. The UI

The runtime has no UI of its own. The person sees its state in four places.
The row of each hand-off in the chat, and the row above the message box,
belong to the feature bot-coordination.

### 5.1 The job of a conversation

`GET /api/threads/:threadId/job` gives a read model of the work of one
conversation (`server/routes/jobs.ts:95-159`, `server/job-view.ts:83-180`).

1. Query: `scope` (`job` or `turn`), `since` (a server time, default now),
   `wait` (0 to 25,000 ms), `version`, `full`. A bad value gives 400.
2. A thread that the reader cannot see gives 404 "no such conversation".
3. With a `wait` and the same `version`, the read waits. It looks again 150
   ms after each store change and each 2 s, and it answers at the time
   limit. After the wait it checks the session again (401) and the
   visibility again (404), then reads one more time.
4. The view has a `state` and a `reason`, in this order:
   - `needs-input`: "<bot> needs you: <question>", or "A teammate needs an
     answer in a conversation you cannot open".
   - `failed`: "<bot>'s engine stopped unexpectedly".
   - `stalled`: "No sign of progress from <bot>'s engine".
   - `running`: "<bot> is working", "Waiting on N teammate tasks: <names>",
     "A message is waiting its turn".
   - `idle`: "Nothing is running in this conversation".
   - `completed`: "<bot> finished", with "; N teammate tasks did not
     complete (<names>)".
   - else "<bot>'s work ended because it was stopped" or "… as <outcome>".
5. The nodes: at most 500, the newest kept. A result is clipped to 280
   characters unless `full` is set. `hidden` counts the rows that the
   reader cannot see, but not the rows that the cap of 500 drops
   (`job-view.ts:143-144`, `:174`).
6. `version` is a hash of the state and of each row's status, outcome,
   executions and question.
7. The reason never names or quotes work in a conversation that the reader
   cannot open (`job-view.ts:85-87`).

### 5.2 Stop one hand-off

`POST /api/threads/:threadId/job/:assignmentId/stop`
(`server/routes/jobs.ts:78-90`):

- 404 "no such hand-off in this conversation" for the conversation's own
  root, room work, work of another conversation or an unknown identifier.
- 403 `{code: "stop_not_yours"}` when the host refuses.
- 200 `{ok: true, outcome: "stopped"}` or `{ok: true, outcome: "already-ended"}`.

### 5.3 Cards, chips and notifications

These come from the port calls `park`, `remind` and `report`
(`server/host/ask-cards.ts`, `server/index.ts:3876-3930`):

- a question card "Your bot has a question", and a chip "<bot> needs your
  input: <question>" in the requester's thread.
- a reminder "Still waiting on your answer: <question> This work closes in N
  days if nobody answers.".
- an expired card "Expired before anyone answered".
- one result row for each child in the requester's thread. Its text is
  redacted and clipped to 2,000 characters (`server/index.ts:3909-3922`).
- the notices "Resuming after a restart" and, in the parent thread, a note
  that a restart cut the teammate (`:3966-3972`).

### 5.4 The empty, busy and error states

- Empty: `idle`, "Nothing is running in this conversation".
- Busy: `running`, and the pace keeps a cloud machine awake while the
  runtime is "busy" (`server/index.ts:15119`).
- Error: a read that fails during a wait answers 500 with the error text
  (`server/routes/jobs.test.ts:158-168`).

## 6. The tests

### 6.1 The two suites of the runtime

- `server/runtime/runtime.test.ts`: 67 tests in 12 groups.
  `server/runtime/scenarios.test.ts`: 63 tests in 14 groups.
- Both use an in-memory store (`openRuntimeStore(":memory:")`), a fake clock
  and a fake `TurnRunner`. Neither uses a host, an engine or a data folder.
- They use two different harnesses. `runtime.test.ts` has its own fake
  (`:12-90`). `scenarios.test.ts` uses `testing/fake-runner.ts` and
  `testing/fake-clock.ts`.
- A restart is `close()` on the old runtime, then a new runtime on the same
  store, then `open()` (`runtime.test.ts:434-439`, `scenarios.test.ts:59-65`).
- The fake clock has a wall time and a monotonic time that move apart, so a
  test can model a sleep of the computer.
- `checkInvariants(store, runner.live())` runs at the end of almost each
  test (`server/runtime/invariants.ts:37-126`).

### 6.2 What the tests prove, by invariant

| Invariant | Tests | Gap |
|---|---|---|
| I1 a live owner for each open row | the checker, S01, S08, S09 | A running root, `queued` and `resume` are not checked |
| I2 one report, at most one wake | `runtime.test.ts:93`, `:671`, S01, S07, S08 | The wake budget is never reached |
| I3 no result or brief two times | `runtime.test.ts:159`, `:908`, S02, S18 | Rework while the first row is open |
| I4 each root ends and is reported | S14, R-S3, R-S9, `runtime.test.ts:1121`, `:1206` | Checked only on ended roots |
| I5 `expired` is never `completed` | S07b, S13, R-S4, `runtime.test.ts:250`, `:1014` | none |
| I6 the level that ran is the level stored | S25 | Three engine kinds only |
| I7 an event for each status change | S22, R-S6 | Only the status is replayed |
| I8 at most one rerun | S08, R-S3, `runtime.test.ts:423`, `:1600` | none |
| I9 a wake only when idle | `runtime.test.ts:701`, `:1375`, S21, S29 | The checker does not test "idle" |
| I10 no throw into a turn | S23, S23b, S23c, R-S7 | No checker. A `validate` or a store write that throws at enqueue has no test. Since v0.1.186, a store write that throws at settle has four tests (`server/runtime/runtime.test.ts:1705-1790` at `e1cc6a290`) |

### 6.3 Behaviours that only the tests show

1. A resume carries every settled child, not only the new ones
   (`scenarios.test.ts:274-275`).
2. A root that completes in its own turn gets `reported` with "own turn"
   and no call to the host (`runtime.test.ts:127`).
3. A `failed` result that comes after `close()` is ignored, so the row stays
   `running` for the next `open()` (`runtime.test.ts:434-437`).
4. A held reason writes one event for each change of reason, not for each
   tick (`runtime.test.ts:256-261`).
5. The reminder test is strict: at exactly 24 h nothing is sent
   (`runtime.test.ts:1024-1029`).
6. A settlement renews the budgets while the root's own turn still runs
   (`scenarios.test.ts:616-624`).
7. The tests set `depth` to 1 or 2 and the queue to 1,000 ms. The default
   values are never used as defaults.

### 6.4 Paths with no test

`pace()`, `followCard()`, the wake budget, `goalRunId`, `ownThread`,
`answersSender`, `doneWhen`, `fault`, the queue expiry of a row that ran
already, a stop of a queued rerun, an enqueue with no parent, the clip of a
brief at 12,000, and a `completed` result after `close()`
(`server/runtime/runtime.ts:285-292` at `e1cc6a290`, `:660-666`, `:572-574`, `:221`,
`:224`, `:326`, `:517`, `:687`).

### 6.5 The coordinator and the end-to-end tests

- `server/runtime-coordinator.test.ts` (2,215 lines) tests the border:
  restart (`:1312`, `:1673`, `:1723`), a parked root that stays 40 days and
  is never pruned (`:1854`), no rerun after an outward action (`:1896`), a
  late reminder with the work still open at 78.5 h, because the tick of the
  reminder never closes it (`:2025`), and 5 failures in a row (`:2195`).
- `server/runtime-coordinator-reads.test.ts` checks with `EXPLAIN QUERY
  PLAN` that the reads by thread use an index, and that no server file calls
  `coordinator.all()` (`:83-110`). It does not catch `answeredElsewhere`.
- `server/runtime-coordination.e2e.test.ts` starts a real server with
  scripted bots:
  - S1: one envelope, one resume, exactly one "Mira replied" chip.
  - S2: a question goes to the person and comes back.
  - S2b: a parked question across a restart gives no second resume and no
    second chip.
  - S3: a cut child runs again one time.
  - S4: Stop cancels queued work.
- `server/runtime-paths.e2e.test.ts`: a routine as requester, a
  consultation, a one-way notice, an outside runtime that polls, and a
  routine that survives a restart.
- `server/runtime-roots.e2e.test.ts`: a person's turn as a root, credential,
  connector and sign-in cards, a rerun of a cut root, a step cap that
  continues in place (201 model requests, then one continuation), the
  computer seat queue, Stop on each kind of card, no rerun after `git push`,
  and the watchdog stop after 20 minutes.
- `server/routes/jobs.test.ts`: the long poll and the stop route.
- `scripts/bench-runtime-reads.ts`: the cost of one finished turn's reads at
  1,809, 5,000, 20,000 and 50,000 rows. It gives numbers, not limits.

### 6.6 What we can port

Almost each test of the two suites can be ported one to one with a fake
driver, an in-memory store and a fake clock. These need a decision first:

1. One test uses the secret scrubber of the host (`runtime.test.ts:315`).
2. S25 needs the table of engine capabilities.
3. Tests that rely on the order of JavaScript promises
   (`runtime.test.ts:288-292`, `:983-990`) need a fixed executor and a rule
   for calls back into the runtime from the driver.
4. A test that fails one store write (`runtime.test.ts:134`) needs the store
   as a trait.
5. Each expected text with the product name of the reference project gets
   our own words.

## 7. Ours compared

### 7.1 What we have

- `crates/bot-core/src/lib.rs` has only the echo function and a doc line
  "Store, assignment runtime and memory". No runtime code exists.
- Step 13 of the plan: "The assignment runtime and its invariant tests",
  crate `bot-core`, done when "Each scenario test passes the invariant
  checks". Step 14 adds `coordinate_bots`.
- Decision D8 names the runtime as the target: one row for each turn, in a
  tree, one wake lane, budgets, a restart policy, invariants after each
  scenario, the row and its event in one transaction.
- `AGENTS.md` has the rules that apply: the runtime owns all work state, it
  reaches the host only through `TurnRunner`, it does no I/O beyond its own
  store, it returns typed refusals, and text that opens a delegated turn
  comes from stored data.

### 7.2 Where each part goes

| Reference | Ours (proposed module in `bot-core`) |
|---|---|
| `server/runtime/types.ts` | `runtime/types.rs`: the record, the enums, `Limits`, `RunInput`, `RunResult` |
| `server/runtime/store.ts` | `runtime/store.rs` on `rusqlite` (the store of step 8) |
| `server/runtime/runtime.ts` | `runtime/mod.rs`: `Runtime` with `begin`, `end`, `enqueue`, `tick`, `answer`, `cancel`, `stop_requester`, `open` |
| `TurnRunner`, `Clock` in `types.ts` | `runtime/ports.rs`, two traits |
| `server/runtime/tree.ts` | `runtime/tree.rs`: ancestry, loop guard, restart notes |
| `server/runtime/envelope.ts`, `questions.ts`, `level.ts` | `runtime/envelope.rs`, `runtime/questions.rs`, `runtime/level.rs` |
| `server/runtime/invariants.ts` | `runtime/invariants.rs`, behind a feature for tests (later in `bot-testkit`, D8) |
| `server/runtime/testing/*` | the fake runner and the fake clock, in the same place |
| `server/runtime-coordinator.ts` | the product side of step 14, not step 13 |
| `server/handoff-ticks.ts` | the shell (`bot-desktop` or `bot-cli`), on `tokio::time` |
| `server/runtime/handoff-limits.ts` (reads the environment) | the settings of step 6, read by the shell |
| `server/runtime/capabilities.ts` | flags that each driver declares (`bot-engine`) |
| `server/runtime/import-legacy.ts` | not needed. We have no old data |

### 7.3 Where our documents differ from the code

- `docs/comparison.md:64` says "nine invariant checks". The contract has
  ten, and the checker has code for nine (I10 has none).
- `docs/research/changelog.md` section 7, row "State lost at a restart",
  cites `runtime.ts:109-158` and says "a fifth branch". The code has five
  branches for a running row. `restartCut` is the fourth, and the rerun is
  the fifth (`runtime.ts:140-147`). `progress.md` calls `restartCut` "a
  fourth branch". Both agree with the code.
- `docs/research/reference-features.md`, the row "24 requests for each
  root": the product uses 64. The row "a cut turn of a teammate runs again
  one time": each running row runs again one time, roots too.

## 8. Where we can be better

The labels A1 to A10 are local to this file. The main session gives them
P-numbers.

### 8.1 New points

- **A1. A typed refusal for each refusal.** One enum for the refusals of
  `enqueue`, `answer`, `begin` and `end`, with the values as fields (for
  example the depth limit). The coordinator maps the enum to the text for
  the model.
  - Why: `AGENTS.md` says "The runtime returns typed refusals". The
    reference returns a free-text `reason` (`types.ts:237-239`), a bare
    `false` from `answer` (`runtime.ts:687` at `e1cc6a290`), and a throw from `begin` on a
    repeated identifier (`:176-179` at `e1cc6a290`). The coordinator then matches the text
    with a regular expression (`runtime-coordinator.ts:339-342` at `e1cc6a290`). The
    compiler can check an enum. It cannot check a regular expression.
- **A2. The limits of the product are named settings.** Depth, requests,
  turns, wakes, the total, the failures in a row and the four clocks are one
  `Limits` struct that the shell reads from the settings. The defaults are
  the values of the product (64 and 96), not the test values.
  - Why: the reference has two sets of values, 24 and 48 in the runtime
    and 64 and 96 in the coordinator (`types.ts:374-386`,
    `runtime-coordinator.ts:48-49`). Its documents and our feature list name
    the wrong set. The runtime also reads the environment
    (`handoff-limits.ts:12-14`), which `AGENTS.md` keeps out of the runtime.
- **A3. No read of all rows, from the first version.** The three full reads
  that remain become reads through an index:
  - `open()` reads all rows to find unreported results
    (`runtime.ts:161` at `e1cc6a290`). Use a partial index on rows where `reportedAt` is
    null.
  - `newerWorkIn` reads all rows of a thread, ended rows too (`:440-442` at `e1cc6a290`).
    Use the index of the thread with `created_at >= boot`.
  - `answeredElsewhere` reads all rows open since a time
    (`runtime-coordinator.ts:747` at `e1cc6a290`), a full scan.
  - Why: changelog section 5, the scans of ended work. The reference fixed
    it two times and three cases remain.
- **A4. A tick that cannot stay busy for nothing.** `pace()` says "busy"
  for a queued row that `canStart` refuses for ever (`runtime.ts:289` at `e1cc6a290`,
  `:429-431` at `e1cc6a290`). A tick that throws, for example on one bad row, keeps the
  pace at "busy" (`server/handoff-ticks.ts:33-38`, `store.ts:190`). The set
  `parkedNodesToReconcile` can hold the pace at "busy"
  (`server/index.ts:9386` at `e1cc6a290`, `:9399` at `e1cc6a290`). Each case gives 4 ticks each second.
  Each tick reads all open rows two times (`runtime.ts:330` at `e1cc6a290`, `:391` at `e1cc6a290`).
  Proposal: the pace counts only rows that can start, and a tick that fails
  backs off.
  - Why: changelog section 5, "Busy" and races (v0.1.149). These are
    possible, not proven by a test.
- **A5. Redact the brief, the question and the result before the store
  write.** The reference redacts an answer only when it is longer than
  12,000 characters (`runtime.ts:689-690` at `e1cc6a290`). It stores and sends the brief
  with no redaction (`envelope.ts:140`), and the result also
  (`envelope.ts:183`). The host redacts only the result row of the chat
  (`server/index.ts:3933` at `e1cc6a290`).
  - Why: `AGENTS.md` says "Redact tokens and keys before text reaches
    disk".
- **A6. One dedupe.** The coordinator and the runtime each check for a
  duplicate sibling, with different keys (`runtime-coordinator.ts:313-315` at `e1cc6a290`,
  `runtime.ts:246-248` at `e1cc6a290`). We keep the one in the runtime.
  - Why: less code, and one rule.
- **A7. A child's view that keeps `needs_input`.** `HandoffView` shows
  `needs_input` as `"waiting"` (`runtime-coordinator.ts:99`), and
  `liveEdges` shows each open edge that is not queued as `"running"`
  (`:561`). Our view keeps the status of the runtime.
  - Why: a wrong state that the type can refuse.
- **A8. The person's stop survives a restart.** The reference keeps it in
  memory for 24 h (`runtime-coordinator.ts:168` at `e1cc6a290`). After a restart a stopped
  request can be given out again.
  - Why: changelog section 5, state lost at a restart.
- **A9. Follow the code on Stop, and correct the contract.** Stop cancels
  running children too (`runtime.ts:717-735` at `e1cc6a290`). Our contract says so.
  - Why: the reference document is old (`docs/runtime-contract.md:48`).
- **A10. A requester's question of a child in a language other than English
  or German goes to the person.** The reference treats it as a question that
  a bot can decide (`questions.ts:10-21`), so at Full access a bot can get
  a sign-in or payment question.
  - Why: a question that only the person can answer must not go to a bot.

### 8.2 New facts for proposals that exist

- **P83 (one transaction for each restart decision, and a delivery rule).**
  Three more places:
  - The park of a child's question (`runtime.ts:610` at `e1cc6a290`) and its wake
    (`:614` at `e1cc6a290`) are two transactions. `open()` parks the child again but never
    sends the wake again, and the requester resumes only when that inbox
    item exists (`:897-898` at `e1cc6a290`). A crash between the two leaves the requester
    waiting with no question.
  - `report()` calls the host before it writes `reportedAt`
    (`:795-799`), and the wake of a result is a third transaction (`:802`,
    `:815`). A crash between them gives a second report, or loses the wake
    of a polling requester.
  - The outward branch and the cut-twice branch of `open()` write
    `restart_reconciled` and then `settle` as two writes (`:138-143` at `e1cc6a290`).
- **P84 (the fifth restart branch).** v0.1.180 publishes it: "After a
  restart caused by running out of memory, the task that was using the
  browser is not started again by itself." It is a host hook, not a rule of
  the runtime (`runtime.ts:144-146` at `e1cc6a290`).
- **P85 (run the invariant checks after a restart).** The checker reads all
  rows (`invariants.ts:39`), so it is not cheap on a large store. It also
  has no check for I10.
- **P132 (redact the handoff file).** The runtime puts `handoffPath` into the
  turn text with no check that the file exists
  (`envelope.ts:279-282`). A missing file still gives a turn that points at
  nothing.
- **P133 (a time limit for a whole turn).** The product sets the runtime's
  turn stall to 24 h and leaves the stall to the host watchdog (20 min,
  `server/index.ts:4928` at `e1cc6a290`). The host turn has no time limit of its own
  (`:3974-3998`).
- **P138 (a limit for a question in the bot's own chat).** A parked root has
  no limit and is never pruned. A test keeps one for 40 days
  (`runtime-coordinator.test.ts:1854`).
- **P51 (text that opens a turn comes from stored data).** The runtime does
  this: `composeEnvelope` uses the stored row and the host's names
  (`envelope.ts:125-143`). Two inputs are raw: `handoffPath` (`:281`) and
  the brief, which is defused but not quoted (`:140`).

### 8.3 The problems of changelog section 5 that the reference has here

| Problem | Here | Lines |
|---|---|---|
| A turn or a wait that does not end | A parked root has no limit. The host turn has no time limit. A shared answer polls each second until the first request ends | `types.ts:366-368`, `index.ts:3974-3998`, `runtime-coordinator.ts:730-742` |
| The same work done two times, or lost | A second report after a crash. A lost wake of a question after a crash. A rerun can repeat work that had no outward label. **Repaired in v0.1.186:** "a result the store couldn't save is kept and retried." A result whose store write threw was lost before. Now it is kept in memory and retried on the next 5 ticks. It is still lost at a crash or after the fifth failure | `runtime.ts:795-799`, `:568-572`, `tree.ts:153`; at `e1cc6a290`: `runtime.ts:58-59`, `:90-91`, `:540-564` |
| "Busy" and races | A pace that stays "busy" (A4). The coordinator reads all open rows on each call of about 18 methods, also for each host event. Since v0.1.186, a settlement that the store refused five times leaves a `running` row with no handle, and the pace stays "busy" until the tree stall (4 h) | `runtime-coordinator.ts:703-705`, `:608-616`; at `e1cc6a290`: `runtime.ts:289`, `:557-561` |
| State lost at a restart | The person's stop, `heldFor`, the chips, the dispatch claims | section 4.4 |
| Scans of ended work | Three full reads (A3) | section 8.1 |
| A secret in the wrong place | The brief, the question and the result are stored and sent with no redaction (A5) | `envelope.ts:140`, `:183` |

**Note of batch 12 (2026-11-27, reference `42f86aefd`).** The wrapper
`remoteHandoff.host` is now read (`server/host/remote-teammate-handoff.ts:247-264`).
For a remote node, `busy` is false, `levelOf` is `full`, `outward` is
empty, `report` only removes the marker, and `park` and `remind` do
nothing. The runtime still holds a second node with the same destination
thread (`server/runtime/runtime.ts:389-403`). The full record is
[`remote-bots.md`](remote-bots.md).

## 9. Not verified

- Whether `runtime.open()` runs before the engines are read, through
  `drainQueuedSends()` (`server/index.ts:15130`). New fact at `e1cc6a290`:
  `open()` can run inside the constructor of `RoutineManager`, while
  `server/index.ts` still builds the host objects. Commit `a15f6ab26`
  (after the tag v0.1.186) builds `ownThreads` before `createCoordinator`
  for this reason (`server/index.ts:3845-3857`; test
  `server/coordinator-restart-report.e2e.test.ts:16`).
- The update of 2026-11-28: the readers read the large files
  (`server/runtime/runtime.ts`, `server/runtime-coordinator.ts`,
  `server/index.ts`) in ranges and through the diffs, not completely.
  Whether a pending settlement acts with `stopRequester` in other ways than
  the test `server/runtime/runtime.test.ts:1731` shows is not verified. No
  coordinator test sends a `poll` ask back to an ancestor.
- What the host's `run` does when the turn throws. `run()` of the
  coordinator has no catch.
- Whether the tree stall of 4 h can fail a request that waits for a shared
  answer while it polls.
- Whether a late answer to an expired card is delivered as a new message
  (`server/person-replies.ts:116-135`).
- Whether a tick after `coordinator.close()` is safe. `handoffTicks.stop()`
  is never called.
- What two processes do with the same `runtime.db`.
- The wrappers of the host object (`remoteHandoff.host`,
  `botLink.link.host`), the watchdog, `restartCutStop` and
  `runRootTurn`.
- The patterns of `redactSecretsInText` (`shared/redact.ts`).
- The role of the deleted `server/aside-queue.ts`.
- Whether the goal loop "Finish together" or `start_thread` is a path for a
  hand-off outside the runtime (`docs/verification/room-coordination.md:94-96`,
  `:454-456`).
- The value of `FILE_MAX_BYTES` of the hand-off files, and the limits
  `maxConcurrentChildThreads` and `maxConcurrentBotThreads`.
- The text behind the line keys of the host (`server.teammates.*`,
  `chat.notice.*`), except the ones quoted here.
- No test of the reference was run. Each expected value comes from the
  source.
