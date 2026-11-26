# Plan: Team structure

The proposals from the research file
[`../research/features/team-structure.md`](../research/features/team-structure.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 14, decisions, and a gap for rooms (P286).
- **State:** all open.
- **The main finding:** reach is wide and authority is narrow. Any bot
  reaches any visible bot with the same audience, but a Chief changes only
  the bots of its department, of its managed departments or of its person
  (`server/peer-roster.ts:70-81`, `:124-128`). On a local server a team
  change applies at once, at every level, and a new bot starts at Full
  access with the connected apps of the Chief (`server/store.ts:1343-1354`).

## Proposals

- **P272 (decision, step 14). A new bot never gets more than its Chief.** It
  never gets a higher level or more apps than the Chief that made it, and it
  never copies "every tool".
  - Why: better than the reference. A Chief at Ask makes bots at Full with
    its own apps. A team change is an access right, so the default is narrow.
  - Source: `server/store.ts:1343-1354`; `server/inherited-apps.ts:18-31`;
    `server/inherited-apps.test.ts:17`; `server/connector-verdict.ts:147-148`.
- **P273 (plan, step 14). The same fence on every host.** A turn with no
  person behind it cannot set up, create or delete bots.
  - Why: better than the reference, which fences only a Cloud guest turn and
    a read-and-draft run. An unattended turn reads text that nobody here
    wrote.
  - Source: `server/host/outside-fence.ts:5`, `:54-56`;
    `server/index.ts:12738`; `server/host/outside-lineage.ts:76-77`;
    `server/read-and-draft.ts:34-41`.
- **P274 (decision, with P243). A local request with no session is not the
  owner.** The desktop app and the CLI get a token for each launch. An engine
  never gets it.
  - Why: better than the reference, which trusts each local process as the
    owner. The shell of a bot must not raise its own level.
  - Source: `server/request-auth.ts:111`, `:745-749`;
    `server/routes/bot-patch.ts:619-620`; `server/index.ts:8285`, `:11956`.
- **P275 (plan, step 14, extends P219). The pull requests of the team.** The
  reach and authority checks, the Chief level, and the three Chief tools:
  `propose_team_setup`, `create_bot` and `propose_bot_deletion`.
  - Why: follows the reference.
  - Source: `server/peer-roster.ts:22-81`; `server/chief-level.ts:17-25`;
    `server/drivers/agents-catalog.ts:350-421`.
- **P276 (decision). Reach and authority stay two checks.** Each is a pure
  function in `bot-core` with typed refusals.
  - Why: follows the reference. It is the end state after two reversals,
    and it keeps "may talk" and "may change" apart.
  - Source: `server/peer-roster.ts:25-26`, `:70-81`, `:124-128`.
- **P277 (plan, step 14). A team set-up is one typed request.** The server
  checks it again at apply time, with a revision of a typed snapshot of only
  the changed fields. It keeps a receipt for each request, not one slot for
  each Chief.
  - Why: follows the reference, and better for the receipt: with many open
    cards, a card that applied can show "cancelled".
  - Source: `server/team-setup-requests.ts:66-87`, `:389-395`;
    `server/store.ts:169`, `:1328-1390`.
- **P278 (decision). A department has an id, and its name is a field.**
  Managed departments are ids. A new department and its grant to the Chief
  are one transaction.
  - Why: better than the reference. A rename there writes all bots, rooms
    and grants again and needs a hand-written rollback. The grant waits in a
    queue in memory.
  - Source: `server/store.ts:668-729`; `server/department-grants.ts:19-57`.
- **P279 (plan, step 14). One Chief for each scope is a store constraint.**
  The crown change, the grant removal and the room re-target are one
  transaction.
  - Why: better than the reference. It checks in five places with two
    answers, and saves the bot before the crown, so a crash can leave two
    Chiefs.
  - Source: `server/store.ts:407-421`, `:1640-1658`;
    `server/routes/bot-patch.ts:742`, `:761-764`;
    `server/routes/sidebar-sections.ts:54-97`.
- **P280 (plan, step 14). The scope of a Chief is a typed enum.** This also
  corrects the Chief absent line.
  - Why: better than the reference. Its string compare means the line never
    shows for a Chief that a person owns.
  - Source: `shared/bot-owner.ts:23-26`; `server/host/chief-rooms.ts:23-29`.
- **P281 (plan, step 14). Check and count the create limit in one step.**
  One limit for each turn covers all creates.
  - Why: better than the reference. `create_bot` counts after an await, so
    two calls pass, and `propose_team_setup` has no limit for each turn.
  - Source: `server/index.ts:13922`, `:13996-13998`;
    `server/team-setup-requests.ts:25`, `:250`.
- **P282 (plan, step 14). Apply, resolve and Undo use one guard.** One guard
  for each request.
  - Why: better than the reference: `resolve` has a lock, `undo` has none.
  - Source: `server/team-setup-requests.ts:459-493`, `:506-507`.
- **P283 (plan, step 14). A deletion has two steps.** Record "deleting" with
  the list of outside computers, then delete them.
  - Why: better than the reference. A cancel after a partial clean-up is
    visible, and a retry can finish it.
  - Source: `server/index.ts:8980-9019`; `server/index.test.ts:4489-4534`.
- **P284 (plan, step 14). The runtime enforces the Chief's retry limit.**
  - Why: better than the reference, where only the prompt says "Never retry
    the same thread more than twice". The runtime owns work state.
  - Source: `server/chief-of-staff.ts:93`.
- **P285 (decision). Do not build the supervisor plan now.** No supervisor,
  no limit on delegations and no reviewer stage. A read-only board can come
  later from the assignment rows.
  - Why: follows the reference, which never built them. The runtime of step
    13 already has the owner, the state, the parent and the depth.
  - Source: `docs/superpowers/plans/2026-08-31-07-delegation-task-board.md:114-153`;
    `server/runtime/types.ts:80-90`, `:375`; `server/runtime-coordinator.ts:180`.
- **P286 (gap). The gaps of rooms.** One view-only type for room pages; a
  computer lease that lives with the open turn of the thread; claims as
  runtime rows; a retry of a failed Chief re-target.
  - Why: better than the reference. It checks for a room in seven places,
    ties a lease to bot busy and keeps claims in memory.
  - Source: `shared/app-frame/document.ts:52-54`;
    `server/local-vm-lease.ts:17-20`; `server/index.ts:5547-5552`;
    `server/host/chief-rooms.ts:41-44`.
- **P287 (not planned). Own home.** If "a bot says where another bot lives"
  comes later, the names go into prompts as typed data.
  - Why: better than the reference. Text that opens a turn is built from
    stored data, from a fixed template.
  - Source: `server/places-elsewhere.ts:116-119`; `server/index.ts:8285`.
- **P288 (correction). Correct the research files.** `changelog.md`
  section 6: only the limit of departments on reach was removed
  (`78c79a440`), and it is older than v0.1.125 (`c0af8050a`). Departments
  still limit authority. `changelog.md` and `changelog-check.md` get a row
  for v0.1.152 (`5819d22d6`: the `peers` list, the peer cards and the
  escalation flag were removed). `reference-features.md` rows 96 to 98: "not
  built". Rows 96 to 98, 183, 195, 200 to 202, 349 and 350: "done".
  - Why: the code at `96ff84455` shows these.
  - Source: `server/peer-roster.ts:25-26`; `5819d22d6`; `78c79a440`.

## New facts for proposals that exist

- **P222 (`bot-coordination.md`).** The delegated level is still written on
  the teammate's thread and stays after the work. At Full access the Chief's
  prompt lets it answer a teammate's question "if you know the answer for
  certain" (`server/host/delegated-level.ts:55-71`;
  `server/full-access-workflows.e2e.test.ts:250-251`;
  `server/host/teammate-prompts.ts:92`).
- **P113 (`approval-levels.md`).** The engine cap of the delegated level
  still checks driver names (`server/auto-approve.ts:58`).
- **P120 (`approval-levels.md`).** A new bot starts at Full and gets the
  Chief's connected apps, also when the Chief is at Ask (P272;
  `server/store.ts:1343-1354`).
- **P142 (`approval-cards.md`).** All bot changes of a set-up, the grants and
  the receipt are in one save. The one receipt slot for each Chief is the gap
  left (`server/store.ts:169`, `:1373-1380`).
- **P164 (`assignment-runtime.md`).** Depth 4 for every bot replaced "depth
  1, plus one hop for a supervisor". The old `too_many` was 6 queued
  hand-offs for each thread (`server/runtime-coordinator.ts:180`;
  `6f38b547e^:server/delegations.ts:382`, `:401`).
- **P165 (`assignment-runtime.md`).** Team set-up uses `TeamSetupError` with
  an HTTP status, and its outcomes are strings
  (`server/team-setup-requests.ts:59-63`, `:401-407`).
- **P182 (`threads.md`).** A Local VM lease stays alive while its bot is
  busy, not while its thread has a turn (`server/local-vm-lease.ts:18`).
- **P219 (`bot-coordination.md`).** Add the team pull requests of P275.
