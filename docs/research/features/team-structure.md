# The shape of a team

Research for step 14 of [`../../plan/README.md`](../../plan/README.md). The
port goes to `bot-core` (who may change whom, the set-up request, the Chief
of each scope) and `bot-engine` (the Chief tools). This file covers these
rows of [`../reference-features.md`](../reference-features.md):

- the supervisor role, a limit on delegations at the same time, and a
  reviewer stage (`2026-08-31-07-delegation-task-board.md`)
- team set-up by the Chief with one review card, and a bot that proposes
  the deletion of a bot (`team-setup.md`)
- the authority of a Chief over more departments (`team-access.md`)
- full access for the Chief (`full-access.md`)
- a bot says where another bot lives (`own-home.md`)
- pages in a room are view-only (`room-pages.md`)
- which computer a room uses (`group-local-vm.md`).

The reference project was read at commit `96ff84455` (HEAD of the local
clone, so the files were read directly). Five subagents read one group of
files each. The lead checked the key claims against the code (section 2.3).

## 1. In short

The special terms, one time each:

- **Chief of Staff (the Chief):** a bot with the flag `chiefOfStaff`. It
  leads the rooms of its department, gets incident reports and answers for
  the person (`server/chief-level.ts:13-16`).
- **Chief level (Chief powers):** the right to create, change and delete
  bots and rooms, to retry a teammate's thread, and to pass its approval
  level down. The Chief has it. The person's default helper bot has it too,
  on a Team Cloud only when its person is an Owner or an Admin
  (`server/chief-level.ts:17-25`).
- **Department:** a name in the `section` field of a bot or a room. The
  list of names and their shared text is in `section-contexts.json`
  (`server/section-context.ts:12-26`). General is the empty name `""`. The
  code also calls a department a "section" and a "team".
- **Managed departments:** `managedSections`, the other departments that a
  Chief is in charge of. Only the person sets them ("Also in charge of").
  At most 100 names of at most 60 characters (`server/store.ts:347-351`).
- **Reach:** the right of one bot to talk to another bot. Any bot reaches
  any visible bot with the same audience (`server/peer-roster.ts:124-128`).
- **Authority:** the right of a Chief to supervise a bot: see its
  incidents, retry its threads, change its setup, close its threads. It
  follows departments, managed departments and ownership. Reach never
  widens it (`server/peer-roster.ts:25-26, 70-81`).
- **Scope of a Chief:** the key that allows one Chief only. It is
  `owner:<email>` for a bot that a person owns, else
  `section:<department>` (`shared/bot-owner.ts:23-26`).
- **Owner (reports to):** on a Team Cloud, the person that a bot answers
  to: the person of a default bot, else `reportsTo`, else `createdBy`
  (`shared/bot-owner.ts:15-20`).
- **Team set-up request:** one plan from a bot with the Chief level. It
  creates up to 8 bots and changes up to 40 bots
  (`server/team-setup-requests.ts:24-25`).
- **Deletion proposal:** a request of a bot with the Chief level to delete
  one bot (`propose_bot_deletion`).
- **Receipt:** `lastTeamSetupReceipt {requestId, result}` on the Chief. It
  makes sure that a request applies one time only (`server/store.ts:169`).
- **Revision:** a SHA-256 hash of the values before the change, only of the
  fields that the change touches (`server/team-setup-requests.ts:66-87`).
- **Review card:** the card "Apply setup for N bots?" or "Delete @X?". The
  reference shows it only in a Cloud turn that the owner did not drive. On
  a local server, the change applies at once and a settled line with Undo
  shows in its place (`server/direct-apply.ts:1-5`).
- **Full access:** the most open approval level. It is the default of each
  new bot and thread. The store keeps no field for it
  (`server/full-access-default.e2e.test.ts:60-64`).
- **Delegated level:** the level of a Chief that goes down with the work
  that the Chief hands out, and only raises the level of the recipient
  (`server/host/delegated-level.ts:27-72`).
- **Place:** one server or computer where the bots of a person live. **Own
  home:** a server of one person that becomes the home of that person's
  bots (`server/own-home.ts`).
- **Places elsewhere:** the names of the bots in the person's other places.
  A bot uses them to say "X lives on Y" (`server/places-elsewhere.ts`).
- **Room:** a conversation of more than one bot and the person. The code
  calls it a group or a channel (`GroupRecord`, `server/store.ts:70`).
- **View-only page:** a page, widget or app that a bot shows in a room. It
  cannot send a message, set the model context or call its server
  (`shared/app-frame/document.ts:52-54`).
- **Point:** the one action that a person can do on a room page: point at a
  part of it. The pick goes only to the bot that made the page.
- **Works on:** the setting of a bot that says which computer its turns
  use: a Local VM, this computer, a cloud computer, a VPS, a browser, or
  none.
- **Lease:** the claim of one thread on one Local VM, 30 minutes, renewed
  while the turn works (`server/local-vm-lease.ts`, `server/index.ts:5547`).
- **Chief absent line:** the line in a department's room when no bot with
  the Chief level is a member (`server/host/chief-rooms.ts:23-29`).
- **Supervisor and reviewer stage:** parts of a plan of 2026-08-31. They
  were never built (section 3.12).

What the reference does, in short:

1. **Reach is wide, authority is narrow.** Since v0.1.128 a department does
   not limit who talks to whom. It still limits who may change whom. A
   Chief changes only the bots of its department, its managed departments,
   or, on a Team Cloud, its person's bots (`server/peer-roster.ts:25-81`).
2. **One Chief for each scope.** Crowning a Chief takes the crown from the
   other Chief of the scope and removes its grants. The rooms that the old
   Chief led follow the new Chief (`server/store.ts:1640-1658`
   `server/host/chief-rooms.ts:34-58`).
3. **A new department goes to the Chief in charge of every department.**
   A microtask after the write adds it to that Chief's managed departments
   (`server/department-grants.ts:27-57`).
4. **The Chief changes the team with three tools:** `propose_team_setup`,
   `create_bot` and `propose_bot_deletion`. All three go to one service,
   which checks the request again at apply time and writes all changes and
   the receipt in one save of `bots.json` (`server/store.ts:1328-1390`).
5. **On a local server a change applies at once, at every level.** The
   person gets one settled line with Undo. A deletion has no Undo. The
   review card waits only in a Cloud turn that the owner did not drive
   (`server/direct-apply.ts:1-5`, `server/index.ts:3036-3039`).
6. **A new bot starts at Full access** and gets a copy of the Chief's
   connected-app grants, also when the Chief is at Ask
   (`server/store.ts:1343-1354`).
7. **The level of a Chief flows down each hop** and stays on the teammate's
   thread after the work. In a room it stays on the turn only
   (`server/host/delegated-level.ts:55-80`).
8. **A room has no computer of its own.** Each member that speaks uses its
   own "Works on" setting, with the same lease as a direct turn
   (`server/index.ts:9801-9809, 9892`).
9. **Pages in a room are view-only,** checked in the page script, the host
   bridge and the server. Point goes only to the page's bot.
10. **The supervisor, the limit of 3 delegations and the reviewer stage
    were never built.** The file that the plan extended,
    `server/delegations.ts`, was deleted in `6f38b547e` (v0.1.108). The
    runtime now allows depth 4 for every bot
    (`server/runtime-coordinator.ts:180`).

### What this file adds to earlier research

- [`bot-coordination.md`](bot-coordination.md) 3.18 and 3.19 have the
  Chief flag, the Chief level, the roster, `canReach` and the 32-hop walk.
  This file adds:
  - `hasAuthority` and `canManage` in full, and the owned Chief of a Team
    Cloud;
  - managed departments, and how a new department reaches a Chief;
  - the rules for rename, delete and move of a department, and the
    `reportsTo` routes;
  - the exact rule of the Chief absent line, and its gap;
  - the git history of "not walls" and of the removed `peers` list.
- [`approval-cards.md`](approval-cards.md) has the family of self-changes
  and the Undo table, with "Team setup Undo in more detail". This file adds
  the full set-up and deletion flows, their limits, the revision of only
  the changed fields, the receipt and the deletion lifecycle. It answers
  the open question of `approval-cards.md` about the receipt: yes, one save
  holds all bot changes, the grants and the receipt
  (`server/store.ts:1373-1380`).
- [`approval-levels.md`](approval-levels.md) 3.16 has the walk to the Chief
  and the engine cap. This file adds a check at `96ff84455`. The delegated
  level stays on the thread. Full removes the 8-card limit. It also adds
  Full access in the Chief's question prompt, the inherited apps, and the
  loopback-owner risk.
- [`assignment-runtime.md`](assignment-runtime.md) has the deletion of
  `server/delegations.ts` and the runtime limits. This file adds the commit
  `6f38b547e` and the import of the old ledger. The old `too_many` was a
  limit of 6 for each thread. The supervisor plan was never built.
- [`threads.md`](threads.md): nothing is repeated. This file adds only the
  `held` event of a computer wait.
- All new: own home, places elsewhere, view-only room pages, Point, the
  computer of a room member turn, the lease and the seat pool.

## 2. Files read completely

All paths are in the reference project. The reports of the subagents are
in `.research/` of the worktree (not in git).

### 2.1 Read completely

The Chief and departments:

| File | Lines |
|---|---|
| `server/chief-level.ts` | 37 |
| `server/chief-of-staff.ts` | 107 |
| `server/chief-of-staff.test.ts` | 188 |
| `server/department-grants.ts` | 58 |
| `server/host/chief-rooms.ts` | 63 |
| `server/host/chief-rooms.test.ts` | 97 |
| `server/host/delegated-level.ts` | 93 |
| `server/host/delegated-level.test.ts` | 121 (one reader read 39-121) |
| `server/host/teammate-prompts.ts` | 96 |
| `server/host/teammate-prompts.test.ts` | 88 |
| `server/routes/internal-chief-team.ts` | 57 |
| `server/routes/internal-chief-team.test.ts` | 116 |
| `server/peer-roster.ts` | 443 |
| `server/peer-roster-owners.test.ts` | 65 |
| `server/agents-turn.ts` | 101 |
| `server/chief-level-delegation.e2e.test.ts` | 66 |
| `server/chief-level-every-hop.e2e.test.ts` | 115 |
| `server/chief-rooms.e2e.test.ts` | 123 |
| `server/team-roster-prompt.test.ts` | 62 |
| `shared/bot-owner.ts` | 56 |
| `packages/phone-protocol/src/default-bot.ts` | 48 |
| `server/section-context.ts` | 170 |
| `server/section-context.test.ts` | 86 |
| `server/bot-owners.ts` | 70 |
| `server/bot-owners.test.ts` | 49 |
| `server/routes/team-owners.ts` | 155 |
| `server/routes/team-owners.test.ts` | 139 |
| `src/components/RoomChiefAbsent.tsx` | 28 |
| `src/components/bot-settings/ManagedTeamsSettings.tsx` | 40 |
| `docs/verification/team-access.md` | 47 |
| `docs/verification/teams.md` | 160 |
| `apps/docs/content/docs/features/chat-and-teams.mdx` | 137 |

Team set-up and deletion:

| File | Lines |
|---|---|
| `server/team-setup-requests.ts` | 519 |
| `server/team-setup-requests.test.ts` | 784 |
| `server/team-setup.e2e.test.ts` | 140 |
| `server/bot-deletion-write-failure.e2e.test.ts` | 98 |
| `docs/verification/team-setup.md` | 123 |
| `server/host/outside-fence.ts` | 79 |
| `server/bot-link/far-side.ts` | 160 |
| `packages/phone-protocol/src/team-setup.ts` | 72 |
| `shared/team-setup.test.ts` | 44 |
| `server/direct-apply.ts` | 32 |
| `server/direct-apply.test.ts` | 30 |
| `server/host/internal-body-ids.ts` | 13 |
| `server/host/resumable-cards.ts` | 52 |
| `src/components/ApprovalCard.tsx` | 598 |

Full access and the home of a bot:

| File | Lines |
|---|---|
| `server/full-access-default.e2e.test.ts` | 112 |
| `server/full-access-workflows.e2e.test.ts` | 308 |
| `docs/verification/full-access.md` | 71 |
| `server/outbound-hold.ts` | 119 |
| `server/outbound-requests.ts` | 90 |
| `packages/phone-protocol/src/outbound.ts` | 179 |
| `server/connector-verdict.ts` | 203 |
| `server/auto-approve.ts` | 165 |
| `server/inherited-apps.ts` | 31 |
| `server/inherited-apps.test.ts` | 34 |
| `src/components/bot-settings/PermissionsSection.tsx` | 200 |
| `server/own-home.ts` | 51 |
| `server/own-home.test.ts` | 94 |
| `server/own-home.e2e.test.ts` | 166 |
| `server/person-key.ts` | 62 |
| `server/person-key.test.ts` | 134 |
| `docs/verification/own-home.md` | 103 |
| `docs/verification/team-bot-access.md` | 142 |
| `server/places-elsewhere.ts` | 127 |
| `server/routes/places-elsewhere.ts` | 22 |
| `server/places-elsewhere.test.ts` | 124 |
| `server/places-elsewhere.e2e.test.ts` | 103 |
| `server/host/bot-link-host.ts` | 185 |
| `electron/two-places.mjs` | 146 |

Rooms:

| File | Lines |
|---|---|
| `docs/verification/room-pages.md` | 53 |
| `server/room-pages-point.e2e.test.ts` | 123 |
| `scripts/testing/room-pages-ui.e2e.test.ts` | 225 |
| `server/routes/chat-apps.ts` | 125 |
| `server/routes/chat-apps.test.ts` | 284 |
| `shared/app-frame/document.ts` | 102 |
| `docs/verification/group-local-vm.md` | 113 |
| `server/group-local-vm.e2e.test.ts` | 1,378 |
| `server/local-vm-lease.ts` | 68 |
| `server/local-vm-lease.test.ts` | 108 |
| `server/local-vm-seat-pool.ts` | 116 |
| `server/local-vm-seat-pool.test.ts` | 179 |
| `server/auto-vm-claims.ts` | 135 |
| `server/auto-vm-claims.test.ts` | 235 |
| `server/local-vm-settings.ts` | 66 |
| `server/local-vm-stop-reason.ts` | 24 |
| `server/room-member-lock.ts` | 58 |

The plan, its history and the team UI:

| File | Lines |
|---|---|
| `docs/superpowers/plans/2026-08-31-07-delegation-task-board.md` | 200 |
| `server/runtime/handoff-limits.ts` | 14 |
| `src/components/SidebarTeamMenu.tsx` | 78 |
| `src/components/SidebarTeamMenu.test.ts` | 70 |
| `src/components/MoveToTeam.tsx` | 124 |
| `src/components/MoveToTeam.test.ts` | 199 |
| `src/components/ShareDepartmentDialog.tsx` | 63 |
| `src/components/Sidebar.departments.test.ts` | 515 |
| `src/state/team-side.ts` | 150 |
| `server/routes/sidebar-sections.ts` | 100 |
| `server/routes/sidebar-sections.test.ts` | 30 |
| `server/routes/bot-moves.ts` | 57 |
| `server/routes/bot-order.ts` | 41 |
| `server/bot-moves.ts` | 314 |
| `server/bot-moves.test.ts` | 444 |
| `server/team-move-in.ts` | 280 |
| `server/team-move-in.test.ts` | 221 |
| `electron/team-move.mjs` | 269 |
| `electron/team-move-main.mjs` | 281 |
| `electron/team-move.node-test.mjs` | 187 |
| `electron/team-move-bring.node-test.mjs` | 164 |

### 2.2 Read in ranges

| File | Lines | Ranges |
|---|---|---|
| `server/index.ts` | 15,258 | 692, 745-752, 853, 880-925, 1238-1295, 1605-1606, 1778-1792, 1890-2006, 2741-2747, 2808-2982, 2990-3075, 3478, 3711, 4016-4075, 5540-5560, 6140-6210, 8137-8165, 8262, 8285, 8860-9145, 9270-9340, 9380-9412, 9460-10010, 10225-10260, 10425-10460, 10975-11058, 11930-11997, 12585, 12685-12780, 13240-13312, 13540-13548, 13700-14040, 14232-14300 |
| `server/store.ts` | 2,256 | 108-200, 335-440, 640-860, 1255-1470, 1538-1680, 1870-1900, 2085-2160 |
| `server/routes/bot-patch.ts` | 783 | 120-135, 196-258, 490-505, 580-783 |
| `server/request-auth.ts` | 761 | 1-135, 543-600, 610-761 |
| `server/drivers/agents-call.ts` | 996 | 1-30, 177-198, 480-560 |
| `server/drivers/agents-catalog.ts` | 886 | 117-121, 348-430, 805-886 |
| `server/routes/bot-messages.ts` | 875 | 95-110, 188-196, 225-250, 590-735 |
| `server/host/outside-lineage.ts` | 161 | 1-100 |
| `server/peer-roster.test.ts` | 566 | 1-52, 76-180 |
| `server/runtime/types.ts` | - | 80-90, 340-382 |
| `server/runtime-coordinator.ts` | - | 176-208 |
| `server/runtime/import-legacy.ts` | - | 160-170, and grep |
| `server/surface.ts` | - | 1-110 |
| `server/chat-apps.ts` | - | 200-250 |
| `shared/app-frame/bridge.ts`, `helper.ts` | - | 265-338, 285-313 |
| `src/components/PendingApproval.tsx` | 373 | 60-130, 260-373 |
| `packages/phone-protocol/src/wire.ts` | 1,000 | 110-114, 340-366 |
| `docs/team-cloud.md` | 1,136 | 405-420, 686-760 |
| `docs/approval-levels.md` | 462 | 1-90, 135-155, 210-250 |
| `docs/runtime-contract.md` | - | 120-144 |
| `6f38b547e^:server/delegations.ts` | 1,105 | 1-62, 376-445, 670-700 |
| `src/locales/en.json` | 12,062 | the keys named in sections 3 and 5 |

Some lines of `server/index.ts` are longer than 400 characters. The rooms
reader saw the start of these lines only: 120, 3844, 4036, 5541-5543,
5555-5559, 9677, 9955, 9958, 11929, 11980 and 11997. The facts here come
only from the part that was visible.

Git history (read-only): `git show` of `78c79a440`, `5819d22d6`,
`6f38b547e` and `838e320c1`, `git log -S` for "not walls",
`peers?: string[]`, `canAccessTeam`, `git tag --contains 838e320c1`.

### 2.3 Claims that the lead checked against the code

| Claim | Checked at | Result |
|---|---|---|
| Reach is "same audience, not hidden, not self". Authority follows departments, managed departments and owners. `canManage = canReach && hasAuthority` | `server/peer-roster.ts:22-82, 119-128` | correct |
| The Chief level: the Chief, or a default bot whose person is Owner or Admin. An unknown role fails closed | `server/chief-level.ts:5-25` | correct |
| The Chief absent line compares `chiefScope(bot)` with `section:<room section>`, so an owned Chief never matches | `server/host/chief-rooms.ts:23-29`, `shared/bot-owner.ts:23-26` | correct |
| A refused re-target of a room is logged and not tried again | `server/host/chief-rooms.ts:41-44` | correct |
| `setChiefOfStaff` changes the objects in memory, then saves | `server/store.ts:1640-1658` | correct |
| A new department reaches a Chief in a microtask, with a queue in memory | `server/department-grants.ts:19-57` | correct |
| Set-up applies at once unless the turn is a Cloud guest's or the conversation is not the bot's own | `server/direct-apply.ts:17-20`, `server/index.ts:3036-3039` | correct |
| The receipt is one slot on the Chief, and `apply` returns it again for the same request | `server/store.ts:169, 1331`, `server/team-setup-requests.ts:389-390, 509-511` | correct |
| A new bot gets the workspace default level, the Chief's sharing and the Chief's apps | `server/store.ts:1343-1354` | correct |
| `create_bot` adds to the turn counter only after `await submit` | `server/index.ts:13922, 13996-13998` | correct, so two calls at the same time can both pass the check |
| The outside fence runs only when `cloudGuestDriven` is true, which is false off a Cloud | `server/index.ts:12738`, `server/host/outside-lineage.ts:76-77` | correct, but a read-and-draft routine run is fenced on every host by a second fence (`server/read-and-draft.ts:34-41, 162-164`). See 3.6 |
| The delegated level is written on the teammate's thread. A room turn keeps it on the turn only | `server/host/delegated-level.ts:55-80` | correct |
| A loopback request with no session is the owner on a self-hosted server. A shared server gives it service scopes only | `server/request-auth.ts:104-111, 745-749` | correct |
| The runtime allows depth 4. No supervisor field exists | `server/runtime/types.ts:374-378`, `server/runtime-coordinator.ts:180`, grep for `maxConcurrentDelegations`, `reviewerBotId` | correct |
| A lease is dead when it expired or when its bot is not busy | `server/local-vm-lease.ts:17-20` | correct |
| `ROOM_CAN` turns off messages, model context and server calls | `shared/app-frame/document.ts:52-54` | correct |

## 3. How it works

### 3.1 Reach and authority

1. **Reach.** `canReach(from, target)` is true when the target is not the
   sender, is not hidden and has the same audience
   (`server/peer-roster.ts:124-128`, `sameAudience` in
   `server/bot-visibility.ts:121-128`).
2. **A name resolves only among reachable bots,** in this order: the exact
   id, the start of an id of 8 characters or more, the exact name after
   folding, then the loose name (`server/peer-roster.ts:161, 205-237`).
3. **Errors of a name:** an id start that matches more than one bot is
   "ambiguous" (`:221`). Two reachable bots with the same name are refused
   (`:226-228`). A bot with another audience gives "X is shared with
   different people ... ask Y, who looks after it" (`:134-143`). Else "No
   bot with id or name ...", with up to 12 choices (`:242`).
4. **Authority.** `hasAuthority(from, target)`
   (`server/peer-roster.ts:70-76`):
   - A Chief that a person owns has authority over the bots of that owner
     only, in any department.
   - A bot that is owned by a Chief's person answers only to that Chief.
   - Else `hasTeamAuthority(from, target.section)`: the same department,
     or a Chief that has the department in its managed departments. A
     malformed saved value is no grant (`:29-37`).
5. **`canManage` = reach and authority** (`:79-81`). These use it:
   retry-thread (`server/index.ts:13715-13721`), profile and model
   proposals (`:9053-9059`), closing a thread (`chiefTidies`,
   `server/chief-of-staff.ts:8-16`), the questions that a Chief may answer
   (`server/host/teammate-prompts.ts:84`), and the reset of a cloud
   computer (`server/index.ts:9445`).
6. **Refusal text:** "@X is in the D department, which C is not in charge
   of. Only the person can add a department, in C's bot settings,
   Permissions, "Also in charge of"." (`server/peer-roster.ts:59-63`).
7. **Edge cases:**
   - A person's own default bot is never named to another bot
     (`:190-193`).
   - By the rule of step 4, an ordinary bot (not a Chief) has authority in
     its own department. Whether a route lets it use that was not checked
     (section 9).

### 3.2 The person puts a Chief in charge of more departments

1. The person ticks departments under "Also in charge of" and presses
   **Save departments**. The page sends `PATCH /api/bots/<id>` with
   `managedSections` and `acknowledgePeerScope: true`
   (`src/components/bot-settings/ManagedTeamsSettings.tsx:13-37`).
2. **Checks** (`server/routes/bot-patch.ts:584-601`): at most 100 names of
   at most 60 characters, no duplicates. A new name must be a department
   that exists. Only a Chief gets departments. A new name needs
   `acknowledgePeerScope`.
3. **A new grant is a "loosening"** (`:633-635`). Through the local API,
   from outside the packaged desktop, the route refuses it while any bot is
   busy. The code says why: a shell can forge an Origin header (`:636-639`).
   The code also names the gap that is left: "outside the packaged desktop,
   loopback is the owner, so these loosenings are one curl from the bot
   they constrain" (`:619-620`).
4. **Grants go away** when `chiefOfStaff: false` is sent (`:600-601`), and
   when `setChiefOfStaff` takes the crown (`server/store.ts:1650-1654`).
5. Each change of `chiefOfStaff` records `managedSections` in the audit
   (`server/index.ts:1246`).

### 3.3 A new department goes to the Chief in charge of every department

1. **Trigger:** a store write that adds a new department name
   (`server/store.ts:658-662`). The names read at start do not count.
2. `grantNewDepartments` finds the Chiefs that were in charge of every
   department before the write. It counts the grants that still wait in
   its queue (`server/department-grants.ts:27-31`).
3. It waits one microtask. Then it drops the departments that are gone
   again (a failed import), checks each Chief again, and patches
   `managedSections` (`:35-51`).
4. **Limits:** nothing happens when no name is new, or when the list would
   pass 100 names (`:49`).
5. **Errors:** a failed patch logs a warning only (`:53-55`).
6. **Edge cases:** a Chief that a person owns never gets a grant this way
   (`server/peer-roster.ts:46`). The queue is in memory. A crash before the
   microtask loses the grant (from the code, not tested).

### 3.4 Crown a Chief, and the rooms follow

1. **Trigger:** `PATCH` with `chiefOfStaff: true`, or a Chief that moves to
   another department (`server/routes/bot-patch.ts:670-674, 761-764`).
2. `store.setChiefOfStaff(id)` walks all bots of the scope. The new Chief
   is made visible. Each other Chief of the scope loses the crown and its
   managed departments. Then one save (`server/store.ts:1640-1658`).
3. `chiefRooms.moved(changed)` looks at each room that is not a direct
   chat (`server/host/chief-rooms.ts:34-58`):
   - When a former Chief leads the room, the new Chief becomes a member and
     the lead, and the room gets the notice "{chief} is the Chief of Staff
     now, so it leads this room in place of {former}." (`en.json:353`).
   - When the room refuses the change now (for example, it is busy), it
     stays as it was. A warning goes to the log, and nothing tries again
     (`:41-44`).
4. Each room is published again, so the Chief absent line is computed
   again (`server/index.ts:4072`).
5. **Errors and repair:**
   - The route refuses to hide a Chief (`server/routes/bot-patch.ts:497-499`).
   - At load, only the first Chief of each scope keeps the crown
     (`server/store.ts:407-420`).
   - `setChiefOfStaff` changes the objects in memory before it saves. A
     failed save leaves memory and disk different (from the code).
   - The route calls `patchBot`, then `setChiefOfStaff`: two saves
     (`server/routes/bot-patch.ts:742, 761-764`). A crash between them
     leaves two Chiefs until the next load.
6. **Edge cases:**
   - A department can lose its Chief and get none. Its rooms keep the old
     lead (`server/host/chief-rooms.test.ts:65-73`).
   - A Chief that moves to another department takes the crown there. The
     Chief of that department loses it, and nothing tells the person.

### 3.5 The Chief absent line in a room

1. Each time a room is published, the server computes
   `chiefAbsent: chiefAbsentFrom(room, bots) ?? null`
   (`server/index.ts:4072`).
2. `chiefAbsentFrom` (`server/host/chief-rooms.ts:23-29`):
   - A direct chat gives nothing.
   - The Chief is the visible bot with `chiefOfStaff` whose scope is
     `section:<room section>`.
   - The line shows when no visible member has the Chief level.
3. The window shows the line only when the room setup is not pending, the
   client is not remote and the view is not "bare"
   (`src/components/GroupView.tsx:822`).
4. "Add {name}" sends `PATCH /api/groups/<id>` with the Chief added to
   `memberIds` (`src/components/RoomChiefAbsent.tsx:12-17`).
5. **Edge case (gap):** a room has no owner, so its scope is always
   `section:...`. A Chief that a person owns has the scope `owner:...`. So
   no room shows the line for an owned Chief on a Team Cloud. No test
   covers this.

### 3.6 Team set-up: the Chief proposes, the server applies

1. **Trigger:** the Chief's engine calls `propose_team_setup` with
   `{reason, newTeams, operations}`
   (`server/drivers/agents-catalog.ts:384-414`).
2. The tool proxy sends `POST /api/internal/team-setup-requests` with
   `{fromBotId, fromThreadId, plan}` (`server/drivers/agents-call.ts:503-509`).
3. **The turn token** must match the bot and the thread, else 403. A turn
   that ended gives 401 (`server/index.ts:12755-12775`).
4. The body must parse strictly, else 400 "Invalid team setup request". The
   thread must belong to the Chief, else 403 (`:13285-13289`).
5. `submit` asks `appliesDirectly` (section 3.9). On a local server the
   answer is "full-access" or "level".
6. **`prepare`** (`server/team-setup-requests.ts`):
   1. It parses the plan with its limits (`:37-44, 237-238`).
   2. The bot must have the Chief level and must not be hidden (`:133-137`).
   3. It merges the operations for one bot. It joins the `soulAppend`
      texts in order (`:240-248`).
   4. It accepts at most 8 creates (`:250`).
   5. It accepts `soulAppend` only for a bot that exists, and checks the
      joined text for credentials (`:254-266`).
   6. It redacts and checks each field (`:146-176`).
   7. It makes the ids of each new bot and its thread (`:268-269`).
   8. It sets `expectedRevision` of each changed bot: a hash of only the
      fields that the change touches (`:66-87, 271`).
   9. It sets the revision of the Chief (`:274-277`) and calls
      `validate` (`:279`).
7. **`applyImmediately`** makes the card text. Below Full it checks that
   the thread has fewer than 8 open proposal cards
   (`server/index.ts:11019-11036`). It keeps the values before the change
   for Undo (`:429-446`).
8. **`apply`** returns the stored result when the Chief's receipt has this
   request id (`:389-390`). Else it checks that the turn is still live
   (`canCommit`), then validates again (`:392-395`).
9. `store.applyTeamSetup` writes all bot changes, the new managed
   departments and the receipt in one save of `bots.json`
   (`server/store.ts:1328-1390`). Then one profile history row for each
   changed bot (`server/team-setup-requests.ts:375-386`).
10. It adds a settled card with `autoApplied: true` and `undo`. The title
    is "Team setup applied" (`:414-421`). The decision log gets
    "auto-approved" (`server/index.ts:13293-13295`). The answer is 201.
11. The proxy tells the model "Applied the requested team setup. ... No
    additional confirmation is needed." (`server/drivers/agents-call.ts:177-189`).

**Errors:**

- `prepare` throws before it makes a card, so no message is added: a bad
  plan, a department that the Chief is not in charge of, a busy target, an
  unknown model, a duplicate name
  (`server/team-setup-requests.test.ts:113-122, 227-231, 564-575`).
- At apply time a `TeamSetupError` gives "cancelled". Another error gives
  "failed" (`:401-407`). A failed write changes nothing
  (`server/store.test.ts:2858-2862`).
- When the result message cannot be added, the result stays "applied"
  with an error text (`:422-425`).

**Limits:**

| Limit | Value | Where |
|---|---|---|
| Bots in one plan | 40 | `server/team-setup-requests.ts:24, 43` |
| New bots in one plan | 8 | `:25, 250` |
| New departments in one plan | 8 | `:39` |
| Department name | 1 to 60, one line | `:19, 31`, `server/store.ts:1333` |
| Departments of one Chief | 100 | `:185`, `server/store.ts:347-348` |
| Reason | 1 to 500 | `:38, 287` |
| Bots in the workspace | 100 | `server/index.ts:1786` |
| `create_bot` in one turn | 4 | `server/index.ts:1605` |
| Open proposal cards in one thread, below Full | 8 (429) | `server/index.ts:11033` |

**Edge cases:**

- A change to a field that the plan does not touch does not cancel the
  plan. A change to a field that the card shows cancels it
  (`server/team-setup-requests.test.ts:265-300`).
- To replace the Chief, the plan must also take the crown from the old
  Chief (`:225`). Only a real Chief can change who the Chief is. The
  default helper bot cannot (`:209`).
- An engine change is refused when the new engine does not support the
  target's level (`server/index.ts:9065-9069`).
- A Chief at Full may change itself while its own requesting thread is
  busy. Only that thread is exempt (`:205-206`).
- **Unattended turns.** The outside fence says that set-up and deletion
  "wait on a person's card" (`server/host/outside-fence.ts:5, 54-56`). It
  runs only when `cloudGuestDriven` is true (`server/index.ts:12738`),
  which is false off a Cloud (`server/host/outside-lineage.ts:76-77`). On a
  local server a read-and-draft routine run is still fenced
  (`server/read-and-draft.ts:34-41`). Another unattended Chief turn, for
  example a routine with normal access, is not fenced from these routes.
  This was found in the code, and no test covers it.

### 3.7 `create_bot`

1. The tool takes `{name, role, instructions or copy_from_bot_id,
   modelSelection?, cwd?}` (`server/drivers/agents-catalog.ts:350-373`).
2. **Checks** (`server/index.ts:13915-13973`): the thread is the Chief's
   own. The bot has the Chief level. At most 4 bots in one turn (429). At
   most 100 bots (409). A name of at most 80, a role of at most 120, each
   on one line, instructions of at most 4,000. The model and the folder.
   All of these again after the awaits. No bot with the same name in the
   Chief's department (409).
3. It makes a plan with one create and the reason "Add @<name> (<role>) to
   the team.", and calls the same `submit` (`:13974-13996`).
4. **Race:** the turn counter goes up only after `await submit`
   (`:13996-13998`). Two calls at the same time in one turn can both pass
   the check of 4.
5. The proxy says "Created @X in <section> [id: ...]. ... Assign work with
   coordinate_bots." (`server/drivers/agents-call.ts:539-543`).
6. `propose_team_setup` allows 8 creates in each call and many calls in a
   turn. So the limit of 4 for each turn holds for `create_bot` only.

### 3.8 A bot proposes the deletion of a bot

1. **Trigger:** `propose_bot_deletion` with `{bot_id, reason}`, the reason
   at most 500. The tool text tells the Chief never to delete itself and
   never to put a deletion in a set-up plan
   (`server/drivers/agents-catalog.ts:415-421`).
2. `POST /api/internal/bot-deletion-requests`. A bad body gives 400. The
   thread must be the Chief's own (`server/index.ts:13299-13303`).
3. `prepareDeletion` checks the Chief level, that the target exists (else
   404) and the reason. It sets a revision of the whole profile of the
   target (`server/team-setup-requests.ts:284-290`).
4. `validate` checks that the target is visible and is not the Chief, is in
   the Chief's departments, is not the default bot, has the same revision
   and is not busy (`:229-232`).
5. `apply` calls `deleteBotWithLifecycle` (`server/index.ts:8883-9047`):
   - many 409 guards: a routine run, a room turn, a change of computer
     settings, a held shared VM, a cloud computer that is still being made
   - a cloud computer list that is not available gives 503, and the bot
     stays (`:8968-8973`)
   - a check again before the first deletion at a provider (`:8976-8977`)
   - it deletes the bot's cloud, VPS and Local VM computers (`:8980-9001`)
   - it revokes the tokens of the bot's threads and stops them
     (`:9003-9004`)
   - a check again before the last change (`:9018-9019`)
   - `store.deleteBot` saves the removal and the Chief's receipt in one
     save, then deletes the files (`server/store.ts:1418-1462`).
6. The line says "Deleted @X". There is no Undo
   (`src/components/ApprovalCard.tsx:215`).

**Errors:**

- A revision change or a Stop during a slow clean-up gives "cancelled".
  The bot stays, but a computer that was already deleted does not come
  back (`server/index.test.ts:4489-4534`).
- A failure after the save gives "applied" with "The changes were saved,
  but cleanup needs attention: ..." (`server/team-setup-requests.ts:402-405`).
- A bot whose `home` is on another server cannot be deleted
  (`server/index.ts:8886`).

### 3.9 Where the review card still shows, and Undo

1. **The rule.** `appliesDirectly` gives null (the owner confirms) only for
   a Cloud turn that a guest drove, or a conversation that is not the
   bot's own (`server/index.ts:3036-3039`, `server/direct-apply.ts:17-20`).
2. **The card** (`server/team-setup-requests.ts:310-373`): the title "Apply
   setup for N bot(s)?" or "Delete @X?", the options "Apply setup" or
   "Delete bot", and "Cancel". The detail has the values before and after,
   a line diff of SOUL.md, what an engine change gains and loses, and
   "After this decision the Chief continues once with the result."
3. The proxy tells the model: "One review card is visible ... End this
   turn; the decision and structured result resume you automatically
   once." (`server/drivers/agents-call.ts:512`).
4. The runtime node parks: "Waiting on the person: team setup decision:
   <title>" (`server/index.ts:1963-1974`).
5. **The answer** goes through `POST /api/threads/<id>/respond`. The
   set-up comes from the stored message, never from the request body
   (`server/routes/bot-messages.ts:725-728`). "Allow" needs the desktop, an
   admin session, or a local browser when no bot is busy (`:188-190`).
   "Deny" is always accepted.
6. **`resolve`** (`server/team-setup-requests.ts:495-518`): a closed card
   returns its result as a duplicate. An in-process set gives 409 "This
   setup is already being applied". The receipt is used again when it
   matches. Allow calls `apply`, which checks all again.
7. **Stop** closes an open card with `answered: "unavailable"`, and
   `resolve` never applies it (`server/host/resumable-cards.ts:12-15`).
8. **Undo** (`server/team-setup-requests.ts:459-493`) works only for a
   change that applied on its own. It refuses with "Changed since, so it
   can't be undone here." when a touched bot changed, when a new bot has
   more than one thread or a line from a person, or when a bot is busy.
   Then it deletes the new bots, puts back the fields and the Chief's
   managed departments, and marks the card `undone`. `undo` has no lock,
   but `resolve` has one.

### 3.10 Restart

1. A pending card is a stored message, so it stays
   (`server/team-setup-requests.ts:370`).
2. The receipt is in `bots.json`, so a request does not apply two times
   after a restart (`server/store.test.ts:2865-2868`).
3. The `resolving` set is in memory. The receipt covers its loss.
4. At the first tick, `reconcileParkedRoots` answers each parked node whose
   card got a result while the server was down (`server/index.ts:9390-9408`).
5. The `canCommit` lease is never stored, so the person can still apply an
   old card after the turn ended (`server/team-setup-requests.ts:125-126`).
6. **The one slot.** Each Chief has one receipt slot. With several open
   cards, a card whose patch failed after it applied is checked again and
   can show "cancelled" although it applied. This needs a failed card
   patch, so it is rare.

### 3.11 Full access, and the Chief's level

1. **Default.** When no level is given, the store writes no `approvalMode`
   (`server/store.ts:1347`). Each turn computes its level. These turns are
   always Ask: a guest's turn, a bot-API thread, a confined thread, an
   engine that does not support the level (`server/index.ts:3015-3020`). A
   hosted company workspace has Ask as its default (`:750`).
2. **The person sets Full.** "Apply Full access to all threads" sends
   `PATCH {approvalMode: "full", applyToAllThreads: true}`. There is no
   confirmation (`src/components/bot-settings/PermissionsSection.tsx:42-57`).
3. **What Full changes in a set-up.** A change applies at every level. Full
   changes only the source label in the decision log, and removes the
   limit of 8 open proposal cards (`server/index.ts:11025, 11032`).
4. **The delegated level** (`server/host/delegated-level.ts:27-80`
   `server/auto-approve.ts:40-61`):
   1. On a hand-off, walk up `parentId`, at most 32 hops, to the nearest
      bot with the Chief level.
   2. Pass nothing when there is no Chief, the target is the sender or the
      Chief, or the work came from outside.
   3. Raise only. Cap by the engine of the recipient. The cap is a list of
      driver names (`server/auto-approve.ts:58`).
   4. **A thread:** write `{approvalMode, autoApprove: false,
      alwaysAllow: []}` on the teammate's thread, and add the line "Full
      access — handed on by Ada, from Clive, a Chief of Staff on Full
      access" (`:64-71`). The thread keeps the level after the work
      (`server/full-access-workflows.e2e.test.ts:250-251`).
   5. **A room turn:** the level is for that turn only. A guest's room
      turn is Ask (`:74-79`).
5. **Questions.** At Full the Chief's prompt adds that it may answer a
   teammate's question "if you know the answer for certain"
   (`server/host/teammate-prompts.ts:92`). Only from a turn with a person
   behind it (`:73-93`).
6. **Apps of a new bot.** A bot that a Chief creates gets a copy of the
   Chief's app grants, only for the same owner and audience
   (`server/inherited-apps.ts:18-31`). A Chief with no `connectorTools`
   record may use every tool (`server/connector-verdict.ts:147-148`), and
   the new bot gets that too (`server/inherited-apps.test.ts:17`).
7. **Sends at Full.** A send through an app needs no card when the bot is
   at Full and has no rule of its own. There is no daily cap
   (`server/outbound-hold.ts:33-37`). At dispatch the server checks the bot
   again (`server/index.ts:14272-14296`).

### 3.12 The supervisor plan, and what happened to it

1. **The plan** (`docs/superpowers/plans/2026-08-31-07-delegation-task-board.md`):
   - a work item with owner, state, deadline and artifacts (`:56-83`)
   - a supervisor flag that allows one more hop, depth 2 and never 3
     (`:114-117`)
   - `maxConcurrentDelegations`, default 3, with the refusal `too_many`
     (`:114, 118`)
   - a reviewer stage: an item with `reviewerBotId` goes to `blocked`,
     then to the reviewer, and a self-review is refused (`:151-153`)
   - a reviewer chain counts against the supervisor's limit (`:153`).
2. **None of it was built.** `git grep` at `96ff84455` finds
   `maxConcurrentDelegations`, `reviewerBotId` and the work item only in
   the plan. In the code "supervisor" names only process supervisors
   (`server/oom-score.ts:8`).
3. **The file that the plan extended is gone.** `server/delegations.ts`
   (1,105 lines) was deleted in `6f38b547e`, merged in `838e320c1`
   (pull request 2702, 2026-10-12, first tag v0.1.108). The reason is in
   `docs/runtime-contract.md:141`: one tool surface, the ledger imported
   one time.
4. **The import.** At start, `importLegacyDelegations` reads
   `delegations.json` and `delegation-receipts.json`, writes assignment
   rows with an "enqueued" event, and renames both files to `*.migrated`
   (`server/runtime/import-legacy.ts:161-283`
   `server/runtime-coordinator.ts:198-205`). A second run changes nothing.
5. **The old limits.** The old `too_many` was a limit of 6 hand-offs queued
   by one thread (`6f38b547e^:server/delegations.ts:382, 401`), not a limit
   for each bot.
6. **The new limits.** Depth 4 for every bot
   (`server/runtime/types.ts:375`, `server/runtime-coordinator.ts:180`),
   24 requests for each root (`server/runtime/types.ts:376`). No board in
   `src/components/TeamMapPage.tsx`.

### 3.13 Departments: create, move, rename, delete

1. **Create.** A write with a new `section` adds the name
   (`server/store.ts:658-666`). `POST /api/sidebar-sections {name, botIds}`
   makes a department with bots.
2. **Move a bot.** A drag in the sidebar, or "Move to department", sends
   `PATCH /api/bots/<id> {section}`:
   - The name is trimmed. Empty means General. More than 60 characters
     gives 400 (`server/routes/bot-patch.ts:201-211`).
   - On a Team Cloud only an Admin may change it
     (`server/request-auth.ts:577-583`).
   - A change of department is a "loosening". Through the local API with
     no session, while a bot is busy, it gives 409 (`bot-patch.ts:640-656`).
   - A Chief that moves takes the crown of the new scope (3.4).
   - `PUT /api/sidebar-sections` and `POST` refuse a move that gives a
     department two Chiefs (409) (`server/routes/sidebar-sections.ts:54-97`).
     `setBotsSection` has no busy check.
3. **Rename** (`server/store.ts:668-729`): 1 to 60 characters, no control
   characters, no merge of two departments. Refused while a member, a
   managing Chief or a room is busy. It writes the bots, rooms and grants
   again with the new name. On an error it writes them back by hand
   (`:687-698`). The grants of an empty department are removed first.
4. **Delete** (`server/store.ts:731-760`): refused while there is work, or
   when General would get two Chiefs. Refused while a team computer is
   assigned (`server/routes/sidebar-sections.ts:42`). The bots and rooms go
   to General. The grants are removed.
5. **Who a bot reports to** (Team Cloud):
   `PUT /api/bots/<id>/reports-to` for an Admin or the current owner, and
   `PUT /api/team/reports-to` for an Admin, up to 200 bots
   (`server/routes/team-owners.ts:121-153`). `setReportsTo` refuses a
   second Chief for one person, then saves each bot alone
   (`server/bot-owners.ts:10-21`). When a member leaves, their bots have no
   owner, and a Chief that would be a second Chief loses the crown
   (`:43-70`).

### 3.14 The home of a bot, and where another bot lives

1. **Own home.** The server sends `own: true` only to its one owner
   (`server/index.ts:12585`, `server/own-home.ts:27-31`). "Make <server> my
   home" moves the bots. A shared server refuses: "... has other people on
   it, so your bots stay here." (`server/own-home.e2e.test.ts:53`). After
   the move, `moved-from.json` exists, and a turn on this computer gives
   409 "This bot lives on <server> now." (`:118-119`). This computer then
   lends itself to the server, with Pause, and never lends its terminal
   (`:144-165`).
2. **Places elsewhere.**
   1. The desktop reads each place at most one time in 10 minutes. It tells
      each place the names of the bots in the other places: at most 20
      places and 500 bots for each place (`electron/two-places.mjs:16, 74-112`).
   2. `PUT /api/places/elsewhere` is for the owner only. Another caller
      gets 403. The body is at most 256 KiB, with a strict schema
      (`server/routes/places-elsewhere.ts:14-19`).
   3. The file `places-elsewhere.json` is written atomically, mode 0600
      (`server/places-elsewhere.ts:16, 99`).
   4. When `coordinate_bots` names a bot that is not here, the bot gets 403
      with "X lives on Y, not here. ... Make Y my home", or a hint when the
      desktop never sent names (`:106-111`).
   5. A bot here with the same name wins (`:69-70`). An archived bot here
      gives "No bot" (`server/places-elsewhere.test.ts:68`).
3. **Stand-ins.** A linked place shows stand-in bots with a private `home`
   field, not sent on the wire (`server/store.ts:157, 174`
   `server/host/bot-link-host.ts:69-78`).
4. **Lent computers follow handed-on work** only while the turn acts for
   the same person (`server/person-key.ts:58-62`).
5. **Risk.** On a self-hosted server, a loopback request with no session
   is the owner (`server/request-auth.ts:111`). So the shell of a bot can
   write the names that go into the prompts of other bots
   (`server/index.ts:11956, 8285`), and can raise a bot to Full access
   (`docs/approval-levels.md:82-87`). A shared server gives such a request
   only the service scopes (`server/request-auth.ts:745-749`).

### 3.15 Pages in a room are view-only, and Point

1. A room member turn shows a page with `show_html`, `show_widget` or an
   app. The row has `kind: "app"` and `from.botId`
   (`server/room-pages-point.e2e.test.ts:50-51`).
2. The client gets `GET /api/threads/<thread>/messages/<id>/app`. 404 when
   the person cannot see the thread or the row has no app, 400 for a bad
   `rev` (`server/routes/chat-apps.ts:53-61`). The answer is
   `private, no-store` (`:84-85`).
3. In a room the document gets `ROOM_CAN` and `room: true`
   (`server/chat-apps.ts:228-236`, `shared/app-frame/document.ts:52-54, 100`).
4. **Three layers refuse**, with the text "In a room, pages, apps and
   widgets are view-only: they cannot send messages or tell a bot what
   anyone sees." (`packages/phone-protocol/src/app.ts:185`):
   - the page script: `send` and `setContext` post nothing
     (`shared/app-frame/helper.ts:293-306`)
   - the bridge: server calls, `ui/message` and `ui/update-model-context`
     (`shared/app-frame/bridge.ts:273-274, 320, 334`)
   - the server: 409 for rpc and context (`server/routes/chat-apps.ts:99`)
     and for a widget message (`server/routes/bot-messages.ts:243`).
5. **Point.** `POST /api/groups/<id>/messages` with `pointed: [...]`. Only
   the bot that made the page gets a turn. The lead does not
   (`server/room-pages-point.e2e.test.ts:55-66`).
6. **Errors and edge cases of Point:** an unknown page gives 404. A goal
   with a pick gives 400. A page's bot on hold gives 409. The same `sendId`
   gets the first receipt again. A queued pick whose bot goes on hold is
   reported, not lost (`:76-103`).
7. **Limits:** 120 context updates in 60 seconds for each row
   (`server/routes/chat-apps.ts:49, 107`). A page download is sent as
   opaque bytes with the `sandbox` policy (`:62-77`).

### 3.16 Which computer a room uses

1. `runGroupMemberTurn` always releases the member lock
   (`server/index.ts:9467-9475`).
2. **Before the claim:** refuse during a backup, restore or move. Skip a
   held member. Find the level one time (`:9492-9519`). One turn for each
   bot across chats and rooms: a busy bot gets "{bot} is busy in another
   conversation — skipped this round" (`:9545-9559`).
3. **Check again** after the awaits: the bot, the room, the membership, the
   settings, the provider, the cloud computer, busy (`:9681-9776`).
4. **Claim:** set `busyBotId` and the speaker, start the turn with the
   level, start the stall watch (`:9777-9799`).
5. **Choose the place:** "Works on applies exactly as in a 1:1, so a room is
   no loophole" (`:9801`). A room passes no pin, so there is no fallback to
   the host (`:9838`, `server/surface.ts:53-90`).
6. **Local VM:** "The speaker's desktop, never the coordinator's"
   (`:9892`). The engine must have `capabilities.computerMcp`. The target
   is `shared`, `bot:<sha256>` or `pool:<n>`. The lease claim is
   synchronous. A failed claim gives "this Local VM is already being used
   by another turn" (`:9894-9905`). The control is bound to the bot, the
   thread, the generation and the target (`:9925-9929`).
7. **After the turn:** revoke the capability before the next member
   (`:10238`). Keep the lease only on `timed_out` or `stalled` (`:10241`).
   Release it in `finally` (`:10441-10458`).
8. **The lease:** a claim fails only when another thread holds a live
   lease. A lease is dead when it expired or its bot is not busy
   (`server/local-vm-lease.ts:17-32`).
9. **The seat pool** records a seat at once, so two threads get two seats
   (`server/local-vm-seat-pool.ts:64-71`).

**Limits:**

| Limit | Value | Where |
|---|---|---|
| Lease | 30 minutes | `server/index.ts:5547` |
| Seat affinity | 30 minutes | `server/local-vm-seat-pool.ts:6` |
| `maxInstances` | 1 to 8, default 2 | `server/local-vm-settings.ts:14-36` |
| `idleTimeoutMinutes` | 5 to 1,440, default 480 | same |
| Lazy claim attempts | 3 | `server/auto-vm-claims.ts:44` |
| Stall | 20 minutes with no activity | `server/group-local-vm.e2e.test.ts:942` |

**Edge cases:** a member that takes the shared desktop makes the old gate
give 401 and the new one 200. Another bot's id with this token gives 403
(`server/group-local-vm.e2e.test.ts:960-979`). Stop during readiness
dispatches nothing and releases the lease (`:890-902`). A restart runs the
room turn again one time (`:926-943`). A waiting turn does not get the
private title or the name of the holder (`:1154-1187`).

## 4. The data

**Bot fields** (`packages/phone-protocol/src/wire.ts:346-361`
`server/store.ts:154-175`), all in `bots.json`:

| Field | Meaning |
|---|---|
| `section?: string` | the department. Empty is General |
| `chiefOfStaff?: boolean` | the Chief of its scope |
| `managedSections?: string[]` | the other departments of a Chief. At most 100 of 60 characters. The load repairs bad values (`server/store.ts:347-350`) |
| `createdBy?`, `reportsTo?` | lower-case emails, Team Cloud only |
| `defaultBot?: {person?}` | the person's default helper bot |
| `approvalMode?`, `autoApprove`, `alwaysAllow` | no `approvalMode` means Full |
| `approvalGrant?` | `{requestId, mode, phase, ...}`. An uncommitted grant falls back to Ask at load (`server/store.ts:356-374`) |
| `lastTeamSetupReceipt?` | `{requestId, result}`, one slot, never sent to clients (`server/store.ts:169, 174`) |
| `home?` | `{place, placeName, botId, kind?, gone?}`, on stand-ins only, private |
| `movedTo?` | `{team, state: moving or moved, at}` (`wire.ts:110-114`) |

**Thread fields:** `approvalMode`, `autoApprove`, `alwaysAllow`. The
delegated level is written here (`server/host/delegated-level.ts:64`).

**Team set-up types** (`packages/phone-protocol/src/team-setup.ts:3-56`):
`TeamSetupRequest`, `TeamSetupOperation` (create, update), `TeamSetupFields`,
`TeamSetupResult` with the states "applied", "denied", "cancelled",
"failed" and "pending", and `TeamSetupUndo`. The request is stored as
`card.teamSetupRequest` on a chat message of kind "options"
(`server/team-setup-requests.ts:370`).

**Revision:** the SHA-256 hex of the JSON of the values before
(`server/team-setup-requests.ts:66-87`).

**Decision rows:** tool `set_up_team`, `create_bot` or `delete_bot`.
Decision `auto-approved`, `card-shown`, `user-approved`, `user-denied` or
`user-undone` (`server/index.ts:13293-13309, 9131-9134, 9326-9331`).

**Files:**

| File | Format |
|---|---|
| `section-contexts.json` | `{version: 1, sections, contexts: {name: {text, updatedAt}}, memoryKeys}`, mode 0600, atomic, text at most 24,000 bytes (`server/section-context.ts:12-26, 76-79`) |
| `places-elsewhere.json` | `{v: 1, self, places: [{name, kind, bots}], at}`, mode 0600 (`server/places-elsewhere.ts:17-25`) |
| `moved-from.json` | `{computer, at, told}` (`server/own-home.test.ts:47`) |
| `local-vm-stops/<sha256>.json` | `{stoppedAt}`, folder 0700, file 0600 (`server/local-vm-stop-reason.ts:7-15`) |
| `delegations.json` | old, imported one time, renamed `*.migrated` |

**Room fields:** `section`, `memberIds`, `dm`, `defaultResponder` (member,
auto or mentions), `busyBotId` (cleared at load,
`server/store.ts:430-432`). On the wire, `chiefAbsent: {botId, name} | null`.

**App document:** `{v: 1, messageId, rev, srcdoc, csp, network, can, room?}`,
computed, not stored (`shared/app-frame/document.ts:58-101`). A pick is
`{appId, rev, tag, role, text, selector, html}` on the user message.

**In memory only:**

- the queue of new department grants (`server/department-grants.ts:21`)
- the `resolving` set of set-up requests (`server/team-setup-requests.ts:506-507`)
- the turn counters `createdBots` and `createdRooms`
- the open send holds (`server/outbound-requests.ts:22`)
- the VM leases, the seat affinity, the lazy claims and the member lock
  (`server/index.ts:3478, 5547-5552`).

## 5. The UI

**Settings, Permissions** (`src/components/bot-settings/PermissionsSection.tsx`):

- The Chief card with a crown and a switch: "Chief of Staff", "One for
  {section}", "This is the primary contact for {section}. It can create and
  coordinate specialists in this department, then combine their work into
  one answer." It is hidden on a team (`:63-111`, `en.json:3572-3580`).
- "Also in charge of", a checkbox for each department and **Save
  departments** (`ManagedTeamsSettings.tsx:13-37`, `en.json:7416-7421`).
- "Approval level" with "Apply Full access to all threads" (`:113-137`).
- "Sending on your behalf": "Ask every time" or "Send without asking"
  (`:165-200`).

**Team set-up in the chat** (`src/components/ApprovalCard.tsx`):

- The settled line: a check icon and "{name} set up the team: added @A;
  updated @B", or "{name} deleted @X", with **Undo** (not for a deletion)
  and **Details** (`:214-343`, `en.json:1140-1157`).
- Undo errors: "Changed since, so it can't be undone here." or "Couldn't
  undo: {error}".
- The review card (Cloud owner only): the title, the detail, "Waiting for
  your confirmation below", and the buttons "Cancel" (first focus) and
  "Apply setup" or "Delete bot" (`:534-597`
  `src/components/PendingApproval.tsx:121-125, 337-363`).
- The title and detail are English text from the server. Only the buttons
  and states are translated (`ApprovalCard.i18n.test.ts:229-252`).

**Rooms:**

- The Chief absent line: "{name}, your Chief of Staff, isn't in this room,
  so work handed out here runs at each bot's own approval level." and
  "Add {name}" (`en.json:5318-5319`, `RoomChiefAbsent.tsx:20-23`).
- The notice after a new Chief (`en.json:353`).
- A room page row has **Full screen** and **Point**, no **Share**
  (`scripts/testing/room-pages-ui.e2e.test.ts:184-187`). An app button
  shows "Error -32000: ..." with the view-only text (`:188-199`).
- Rows for a computer wait: "Waiting for its turn on this computer",
  "Computer free", "Parked — it continues automatically when the computer
  is free" (`server/group-local-vm.e2e.test.ts:321, 1016, 1143`).

**A teammate's thread:** "Full access — handed on by X, from Y, a Chief of
Staff on Full access" (`server/host/delegated-level.ts:70`).

**Places:** "Make <server> my home", a frozen screen that names the server,
and the line "X lives on Y, so that mention didn't reach it: bots work
together only within one place." (`server/places-elsewhere.ts:124`).

**The sidebar** (`src/components/SidebarTeamMenu.tsx:56-78`): the
department menu has "Add bots", "Mark all as read", "Pause department"
(owner or Admin only), "Set for all bots in this department…", "Rename
department", "Share", "Delete department". The bot menu has "Move to
department" with "New department…" and "Remove from department". The
delete text: "Its bots and group chats stay, with their conversations,
outside any department. The department and its shared instructions are
deleted. This cannot be undone." A Chief's delete offers "Archive instead"
(`Sidebar.departments.test.ts:419-500`).

**Not in the UI:** a board, a list of delegated work, a reviewer. "Who
reports to whom" and "Set owner for all bots" are in
`chat-and-teams.mdx:75-80` but not in `src/`.

"Move to {team}" (`src/components/MoveToTeam.tsx`) moves a bot into a Team
Cloud. Team Cloud is out of scope. The flow is in the report of the
`board-and-ui` group.

## 6. The tests

| File | What it checks |
|---|---|
| `server/chief-of-staff.test.ts` | the rules of `chiefTidies`, the roster cut at 40, the full Chief prompt, the owned Chief, `@everyone` only to a Chief |
| `server/team-roster-prompt.test.ts` | the rules do not change when a bot joins. The roster is not in the process key. A warm process gets a note |
| `server/peer-roster.test.ts` (ranges), `server/peer-roster-owners.test.ts` | reach across departments. Authority only through grants. Malformed grants. Refusal texts. An owned Chief |
| `server/host/chief-rooms.test.ts` | rooms follow the new Chief. A busy room is skipped. The absent line cases |
| `server/host/delegated-level.test.ts` | each hop. A thread that a hand-off opened is never lowered. Outside work brings no level. Rooms. A cycle stops at 32 hops |
| `server/chief-level-delegation.e2e.test.ts` | a Chief at Auto raises a teammate's thread. A Chief at Ask raises nothing |
| `server/chief-level-every-hop.e2e.test.ts` | two hops, in threads and in a room. An ordinary bot passes nothing |
| `server/chief-rooms.e2e.test.ts` | only a Chief gets the Chief tools. A Chief makes and changes a room. A call after the turn is refused |
| `server/routes/internal-chief-team.test.ts` | the catalog is only for an active Chief, also after a wait |
| `server/section-context.test.ts` | the department file, its limit, mode 0600, rename, delete |
| `server/bot-owners.test.ts`, `server/routes/team-owners.test.ts` | a member who leaves. Owner changes give audit rows |
| `server/team-setup-requests.test.ts` | checks, merge, revisions, deny, duplicates, Stop, the receipt, apply at once, the lease, the busy exemption, Undo, the default bot, the bot limit |
| `server/team-setup.e2e.test.ts` | a set-up at Ask applies with no card. A request for another bot gives 403. Undo after a change gives "changed-since". A deletion. `create_bot` in a chat and a room |
| `server/bot-deletion-write-failure.e2e.test.ts` | a failed write keeps all. A retry succeeds |
| `server/store.test.ts:2845-2918` | one save, the receipt after a replay and a reload, a Chief replacement |
| `server/index.test.ts:4489-4554` | a change during a slow clean-up cancels the deletion |
| `server/full-access-default.e2e.test.ts` | Full with no stored field on three engines. Ask on all threads stays after a restart |
| `server/full-access-workflows.e2e.test.ts` | one Full turn applies five kinds of change. New bots get the Chief's apps. A late token gets 401. A change out of scope is refused. The Chief's Full stays on Ada's thread. A restart runs the teammate one time |
| `server/inherited-apps.test.ts`, `server/direct-apply.test.ts`, `server/host/teammate-prompts.test.ts`, `server/outbound-hold.test.ts` | copy only for the same owner. Apply at every level. "for certain" only at Full. 40 sends a day with no card |
| `server/own-home.test.ts`, `server/own-home.e2e.test.ts` | owner rules. The move survives a kill. No routine runs two times. Lending |
| `server/places-elsewhere.test.ts`, `server/places-elsewhere.e2e.test.ts` | the texts. Owner only. Names only. Kept across a restart. A shared server is never told |
| `server/person-key.test.ts` | lending to handed-on work only for the same person |
| `server/room-pages-point.e2e.test.ts` | a pick goes only to the page's bot. 404, 400, 409. The same `sendId`. A queued pick on hold is reported |
| `server/routes/chat-apps.test.ts` | no cache. Opaque download. 120 updates a minute. A room app is view-only to each viewer of the room. Rpc and context in a room give 409 |
| `scripts/testing/room-pages-ui.e2e.test.ts` | a real window. Point and no Share. A click on send posts nothing. Skipped when the browser binary is missing |
| `server/group-local-vm.e2e.test.ts` | 41 cases: a speaker claims its own VM. The gate after settle, expiry, a hand-off. 403 for another bot. Stop and stall. A rerun after a restart. Pool limits. Lazy claims |
| `server/local-vm-lease.test.ts`, `server/local-vm-seat-pool.test.ts`, `server/auto-vm-claims.test.ts` | renew, expire, no revival. Two seats at once. A claim fires one time and fails closed after 3 attempts |
| `src/components/SidebarTeamMenu.test.ts`, `src/components/Sidebar.departments.test.ts` | mark as read. Drag and keys. Only Admins drag. Rename and delete. "Archive instead" |

No test exists for `server/department-grants.ts`, for two `create_bot`
calls at the same time, for a Chief turn with no person on a local server
that calls `propose_team_setup`, or for the Chief absent line with an owned
Chief.

## 7. Ours compared

Our crates have little of this now: `bot-protocol` has `BotId`, `ThreadId`,
`TurnId`, `MessageId`, `Message` and `Event`
(`crates/bot-protocol/src/lib.rs:7-9`). `bot-core` has an echo function
(`crates/bot-core/src/lib.rs:3`). So each row says where the part goes.

| Part | Reference | Ours |
|---|---|---|
| Department, Chief, managed departments, owner | `server/store.ts:154-175, 640-760, 1640-1658`, `shared/bot-owner.ts` | `bot-protocol`: a `DepartmentId` and the bot fields. `bot-core`: a team module with the store rows. Not built |
| Reach and authority | `server/peer-roster.ts:22-136` | `bot-core`: two pure functions with typed refusals. Not built |
| The Chief level | `server/chief-level.ts:17-25` | `bot-core`: a role of the bot. Not built |
| New department to the Chief | `server/department-grants.ts` | `bot-core`: in the same transaction as the new department (section 8, point 5) |
| Team set-up request and deletion | `server/team-setup-requests.ts`, `server/store.ts:1328-1462` | `bot-core`: one request type, applied in one transaction with its receipt. `bot-engine`: the three Chief tools. Not built |
| When a change applies at once | `server/direct-apply.ts`, `server/index.ts:3036-3039` | `bot-core`: one pure function (P112 of [`approval-levels.md`](../../plan/approval-levels.md)) |
| Delegated level | `server/host/delegated-level.ts` | `bot-core`: a field of the assignment (P222 of [`bot-coordination.md`](../../plan/bot-coordination.md)) |
| Chief absent line, room re-target | `server/host/chief-rooms.ts`, `src/components/RoomChiefAbsent.tsx` | `bot-core` for the rule, `bot-desktop` for the line. Rooms have no step (P219) |
| View-only room pages | `shared/app-frame/document.ts:52-54`, seven checks | `bot-protocol`: one `AppCan` from the thread kind. No step |
| Computer of a room | `server/index.ts:9801-9929`, `server/local-vm-lease.ts` | `bot-core` runtime rows, through `TurnRunner`. No step |
| Own home, places elsewhere | `server/own-home.ts`, `server/places-elsewhere.ts` | not planned (`../reference-features.md`, row "Make this server my home") |
| Supervisor, concurrency limit, reviewer | the plan only | nothing. The runtime limits of step 13 (P164) |
| Sidebar and settings UI | `SidebarTeamMenu.tsx`, `PermissionsSection.tsx`, `ManagedTeamsSettings.tsx` | `bot-desktop`. Not built |

## 8. Where we can be better

1. **Keep reach and authority as two checks.** This follows the reference
   (`server/peer-roster.ts:25-26`). Reason: it is the end state after two
   reversals, and it keeps "may talk" and "may change" apart.
2. **A department has an id, and its name is a field.** The reference
   finds a department by its name. So a rename writes all bots, rooms and
   grants again, is refused while busy, and needs a hand-written rollback
   (`server/store.ts:668-729`). Reason: with an id, a rename changes one
   row and never waits for work, and an old grant cannot come back.
3. **One Chief for each scope is a store constraint.** The reference checks
   it in five places with two answers: refuse (409) or take the crown
   (`server/routes/sidebar-sections.ts:54-97`
   `server/routes/bot-patch.ts:761-764`, `server/store.ts:407-421`).
   Reason: a unique index makes two Chiefs impossible. One function
   decides "refuse or take the crown".
4. **A Chief change is one transaction.** The reference saves the bot, then
   the crown, and changes memory before the save
   (`server/routes/bot-patch.ts:742, 761-764`
   `server/store.ts:1646-1656`). Reason: the AGENTS.md rule "the row and
   its event in one transaction". A crash cannot leave two Chiefs.
5. **The new department and its grant are one transaction.** The reference
   uses a microtask and a queue in memory
   (`server/department-grants.ts:19-57`). Reason: a crash cannot lose the
   grant, and the code is shorter.
6. **A receipt for each request.** The reference keeps one receipt slot on
   each Chief (`server/store.ts:169`). Reason: with many open cards, a
   card that applied can show "cancelled".
7. **A typed snapshot for the revision.** Keep the idea of a revision of
   only the touched fields (`server/team-setup-requests.ts:66-87`), but
   hash a typed value. Reason: a new field or a new field order cannot
   change the hash without notice.
8. **A new bot never gets more than the Chief that made it.** A Chief at
   Ask makes bots at Full with its own apps, and a Chief with "every tool"
   makes bots with "every tool" (`server/store.ts:1343-1354`
   `server/inherited-apps.test.ts:17`). Reason: the default must be narrow.
   A team change is an access right.
9. **The same fence on every host.** The reference fences set-up and
   deletion only in a Cloud guest turn and in a read-and-draft run
   (`server/index.ts:12738`, `server/read-and-draft.ts:34-41`). Reason: an
   unattended turn reads text that nobody here wrote. It must not change
   the team on any host.
10. **Check and count a turn limit in one step, and use one limit for all
    creates.** `create_bot` counts after an await, and `propose_team_setup`
    has no limit for each turn (`server/index.ts:13996-13998`). Reason: two
    calls at the same time pass the check.
11. **Undo and apply use one guard.** `undo` has no lock, `resolve` has one
    (`server/team-setup-requests.ts:459-493, 506-507`). Reason: two Undo
    requests at the same time.
12. **A deletion in two steps.** Record "deleting" with the list of outside
    computers before it deletes them (`server/index.test.ts:4515-4534`).
    Reason: a cancel after a partial clean-up is visible, and a retry can
    finish it.
13. **The Chief's retry limit is in the runtime.** The reference has only
    the prompt line "Never retry the same thread more than twice"
    (`server/chief-of-staff.ts:93`). Reason: the runtime owns work state,
    and a prompt does not enforce a limit.
14. **A typed scope for the Chief.** The scope is a string, and that string
    compare is why the Chief absent line misses an owned Chief
    (`shared/bot-owner.ts:23-26`, `server/host/chief-rooms.ts:25-26`).
    Reason: an enum makes the compiler check the comparison.
15. **One view-only type for room pages.** The reference checks for a room
    in seven places (`helper.ts:294, 303`, `bridge.ts:274, 320, 334`
    `routes/chat-apps.ts:99`, `routes/bot-messages.ts:243`). Reason: a room
    document with `message: true` cannot exist.
16. **A lease lives with the thread's open turn, and claims are runtime
    rows.** The reference ties a lease to bot busy and keeps claims in
    memory (`server/local-vm-lease.ts:18`, `server/index.ts:5547-5552`).
    Reason: our plan has no busy flag on the bot (P182), and one recovery
    path clears all claims at start.
17. **A loopback request is not the owner.** The reference trusts each
    local process as the owner on a self-hosted server
    (`server/request-auth.ts:111`). Reason: the shell of a bot must not
    raise its own level or write text that goes into other bots' prompts.
18. **Names from another place are data.** Put the names in a typed list,
    and build the sentence from a fixed template
    (`server/places-elsewhere.ts:116-119`). Reason: the AGENTS.md rule that
    text that opens a delegated turn is built from stored data.
19. **The engine cap is a capability.** The reference checks driver names
    (`server/auto-approve.ts:58`). Reason: the AGENTS.md rule.
20. **Do not build the supervisor plan now.** The reference wrote it and
    never built it. The runtime of step 13 already has the owner, the
    state, the parent and the depth of each assignment
    (`server/runtime/types.ts:80-90`). Reason: a read-only board can come
    later from the assignment rows, with no new store.

**Problems of [`../changelog.md`](../changelog.md) section 5 that the
reference has here:**

| Problem | Here | Evidence |
|---|---|---|
| "Busy" and races between bots | yes | the `create_bot` counter after an await (`server/index.ts:13996-13998`). `undo` has no lock. A lease lives on bot busy (`server/local-vm-lease.ts:18`). Many guards exist: busy refusals for rename and delete (`server/store.ts:677-679, 734-736`), checks again after each await (`server/index.ts:9681-9776`) |
| The same work two times or lost | handled, one edge | the receipt (`server/store.ts:1331`). The one slot for each Chief (3.10). A new department grant in memory (`server/department-grants.ts:21`). A cancelled deletion after a computer was deleted |
| State lost at a restart | partly | pending cards and receipts are stored. Send holds, leases, claims, the member lock and the grant queue are in memory only |
| A secret or an access right in the wrong place | yes | the delegated level stays on the thread (`server/host/delegated-level.ts:64`). New bots at Full with the Chief's apps (`server/store.ts:1343-1354`). Loopback is the owner (`server/request-auth.ts:111`). An unattended Chief turn on a local server is not fenced from set-up (3.6, from the code, not run) |
| The approval model changed | yes | the review card came in v0.1.103 and went in v0.1.115. Now a change applies at every level (`server/direct-apply.ts:1-5`). A Chief's level now reaches each hop, not only the first (`server/chief-level-every-hop.e2e.test.ts:8-9`) |
| A feature added, then removed or reversed | yes | departments limited reach from `c0af8050a` (2026-09-13) to `78c79a440` (v0.1.128). The `peers` list came in `87814c65f` and went in `5819d22d6` (v0.1.152), with the peer approval cards. `server/delegations.ts` went in v0.1.108. The supervisor plan was never built |

**Corrections for the research files:**

- [`../changelog.md`](../changelog.md) section 6 says "departments
  (v0.1.125) -> "Departments are folders now, not walls" (v0.1.128)". It
  reads as if departments were removed. Only their limit on reach was
  removed, and that limit is older than v0.1.125. Departments still limit
  authority, set-up and deletion.
- `../changelog.md` and `../changelog-check.md` have no row for v0.1.152:
  the `peers` list, the peer approval cards and the escalation flag were
  removed (`5819d22d6`).
- [`../reference-features.md`](../reference-features.md) rows 96 to 98
  (supervisor, limit, reviewer) have the state "not stated". The code shows
  "not built".
- The docs of the reference are out of date in these places:
  - `docs/verification/team-setup.md:24-37, 48-49, 101-109` (the cards,
    and "New specialists use Ask");
  - `docs/verification/full-access.md:38-39` ("retains four pending
    reviews");
  - `chat-and-teams.mdx:55, 75-80`.

## 9. Not verified

- The race of the `create_bot` counter, the save failure of
  `setChiefOfStaff` and the lost grant of `department-grants.ts` come from
  reading the code. No test shows them.
- Whether an ordinary bot can use `canManage` in its own department
  through a route. `hasTeamAuthority` gives it authority
  (`server/peer-roster.ts:33`). The routes that call it were not all read.
- Whether a Chief turn with no person on a local server (a routine with
  normal access, a webhook) has the Chief tools listed and reaches
  `propose_team_setup`. The fence code says that nothing stops it. No run
  was done.
- What happens when a card is approved after a restart and its parked node
  is gone (`server/index.ts:1993-1998`).
- Two Undo requests at the same time for one card.
- What an open "Send on your behalf?" card shows after a restart.
- Where the internal route turns the status of a `TeamSetupError` into the
  HTTP status.
- Whether other code adds a new department of a set-up to the department
  list. `applyTeamSetup` saves only `bots.json` (`server/store.ts:1380`).
- The VPS case of a deletion: the code deletes the bot when the VPS does
  not answer (`server/index.ts:8958-8961`), and the verification doc says
  that it keeps the bot.
- The rule that a computer's sleep is not silence (v0.1.142, v0.1.178) was
  not found in the ranges read.
- Not read: `retryThread` and `chiefForBot` (`server/incidents.ts`),
  `personal-reach.ts`, `linked-roster.ts`, the route of
  `/api/sidebar-sections` beyond its first 100 lines, `TeamDialog.tsx`,
  `Sidebar.tsx`, `TeamMapPage.tsx` (grep only), `readyLocalVmForTurn`,
  `mountHostComputer`, the Point frame script, `server/bot-link/link.ts`,
  `electron/own-home-main.mjs`, `server/move-freeze.ts`,
  `server/routes/bot-messages-apps.test.ts`, `server/page-files.test.ts`,
  and the test names only of `server/connector-verdict.test.ts`.
- The body of pull request 2702. Only its merge message and
  `docs/runtime-contract.md` give the reason.
- Whether the release note of v0.1.152 names the removal of the `peers`
  list.
