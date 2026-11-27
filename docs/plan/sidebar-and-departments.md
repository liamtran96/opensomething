# Plan: The sidebar and departments

The proposals from the research file
[`../research/features/sidebar-and-departments.md`](../research/features/sidebar-and-departments.md)
(batch 13, reference commit `95f3c9f16`). The steps, the pull requests and
the order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** P701 gives the feature two parts: the bot and room positions,
  the rows, the drag and the confirmations with step 11, and the
  departments with step 14, after P278 and P279. P702, P703, P707, P708 and
  P709 go with those two parts. P704 goes to step 6. P705 and P706 go to the
  step of P314 (notifications).
- **State:** all open. Decide P701 first: it gives the steps. Decide P708
  (the name) before the department part.
- **The main finding:** one drag of a bot to another department sends two
  writes, and the first one waits 400 ms in memory
  (`src/components/SidebarBotDrag.tsx:84-85`,
  `src/state/bot-patch-queue.ts:160`). The saves of the bot order have no
  queue and no version check, so the last write wins
  (`server/routes/bot-order.ts:35`). The reference fixed the same race for
  rooms and departments, but not for bots.

## Proposals

Decide P701 first.

### P701. Two plan parts for the sidebar and departments (with step 11 and step 14)

- Kind: a gap. The feature is in the group "later" and has no step.
- What:
  1. With step 11 (`bot-core`, `bot-desktop`): a position for each bot and
     each room in the store of step 8. The bot rows with their marks, the
     drag, Alt+Up/Down and the confirmations in
     `crates/bot-desktop/ui/src/features/sidebar`.
  2. With step 14, after P278 (a department has an id) and P279 (one Chief
     for each scope): the department table (id, name, position), the
     department of a bot and of a room, the name field in place, the
     department menu and the department "mark all as read". The unread
     marks also need the step of P314 (notifications).
- Options:
  - (a) Two parts, as above (recommended).
  - (b) One step after step 14 for all of it. Simpler, but the rows and the
    bot order wait for the departments.
  - (c) Keep the feature "later" with no step. The sidebar stays a mock
    (D16).
- Why: the order and the department are work state. They belong to the
  store, not to the window. Departments need the id of P278 and the Chief
  rule of P279.
- Reference: `server/store.ts:1938-1950` (the bot and room order in the
  store); `server/section-context.ts:14-29` (the department list file);
  `server/store.ts:656-761`, `:1540-1597` (department changes);
  `src/components/Sidebar.tsx:698-919` (the bot row);
  `src/components/SidebarBotDrag.tsx:1-243` (the drag).
- Ours today: `crates/bot-desktop/ui/src/features/sidebar/Sidebar.tsx`
  (385 lines: search, the Inbox row, one Chief, a "Bots" group, a "Tools"
  group). `crates/bot-desktop/ui/src/features/bots/types.ts` has no
  department, position or unread field.

### P702. A move to a department and a new position are one command and one transaction (P701 part 2)

- Kind: a choice. Better than the reference. New facts for P682.
- **Problem in the reference:** one drag across lists sends two writes. The
  department goes through the patch queue of the bot, which waits up to
  400 ms in memory, then `PATCH /api/bots/<id>`. The order goes in a
  separate `PUT /api/bots/order`. One can fail while the other succeeds: the
  bot keeps its old department but the order is saved, or the reverse. A
  crash in the 400 ms loses the department
  (`src/components/SidebarBotDrag.tsx:84-85`;
  `src/components/bot-sections.ts:25-45`; `src/state/store.tsx:2809-2812`;
  `src/state/bot-patch-queue.ts:160`). The release problems: "The same work
  done two times, or lost" and "State lost at a restart or a crash". The
  reference fixed the same problem for threads ("Thread changes are saved
  before they're shown", v0.1.115), not for a bot move.
- Options:
  - (a) One command `move_bot { bot, department, after }` that writes the
    department and the position in one transaction and emits one event
    (recommended).
  - (b) Two commands, as the reference, but each one saved at once with no
    queue (P682 alone).
- Why: the rule of `AGENTS.md`: "Every state change in the runtime writes
  the row and its event in one transaction before anything acts on it".
  P682 has the 400 ms wait. This proposal adds the two writes of one drag.
- The position part can go with P701 part 1.
- Tests to add: a move whose second write fails leaves the bot in its old
  department and its old place.

### P703. Each order change carries a revision, and the window has one save queue for each order (P701 parts 1 and 2)

- Kind: a choice. Better than the reference.
- **Problem in the reference:** the saves of the bot order have no queue and
  no check for a newer move. Two fast moves send two requests at once, and
  the server keeps the last one that it handles. The rollback of a failed
  first move puts back the order from before that move, so it can undo the
  second move on screen while the server keeps the second move
  (`src/components/bot-sections.ts:36-45`). The server has no version check:
  the last write wins for two windows or two people
  (`server/routes/bot-order.ts:22-39`, `:35`). The store also changes the
  bot list in memory before it saves, so a failed save leaves memory and
  disk different, with no event (`server/store.ts:1940-1945`). The release
  problem: "Busy and races between bots". The reference fixed the race for
  rooms in v0.1.155 ("Room order: save one at a time, never restore an old
  order", `0e4a0ccbe`, `src/components/SidebarRoomDrag.tsx:13-41`) and for
  departments in commits after v0.1.184 (`13a7a61be`, `ececd019d`,
  `4eb7a30da`, `ff18c38eb`, `src/components/bot-sections.ts:66-99`). The bot
  order never got the same fix.
- Options:
  - (a) The order command carries the revision of the list that the window
    saw. A stale revision gets a typed refusal, and the window shows the
    order of the store (recommended).
  - (b) Follow the reference fix for departments: a queue in the window, a
    time limit, and after no answer, read the order of the server. No
    server revision.
  - (c) Follow the reference for bots (no queue). Not recommended.
- Why: one rule for the three orders (bots, rooms, departments). A save
  first, then the change in memory, as `reorderGroups` does
  (`server/store.ts:1947-1950`).
- Decision text if option a: "The bot, room and department orders are store
  state with a revision. A stale order change gets a typed refusal."
  Reference: `src/components/bot-sections.ts:36-99`,
  `server/routes/bot-order.ts:35`.
- Tests to add: two moves with the first one failing; two windows with a
  stale revision; a failed write leaves the old order in memory.

### P704. The collapsed state is keyed by the department id, and a failed read of the window settings never leads to a write (step 6)

- Kind: a change of a step. Better than the reference. New facts for P278
  and P76.
- **Problem in the reference:** the collapsed list and the two section
  orders are in browser storage, keyed by the name (`section:<name>`)
  (`src/lib/sidebar-preferences.ts:15-17`; `src/lib/sidebar-layout.ts:18`,
  `:53-55`). Bad JSON or one bad item makes a list empty, and the next click
  writes a list built from empty over the old one
  (`src/lib/sidebar-preferences.ts:385-394`;
  `src/components/SidebarSections.tsx:45-47`, `:82-87`). A list keeps 100
  items and a new collapsed id goes at the end, so the 101st collapse shows
  on the screen but is not saved (`src/lib/sidebar-preferences.ts:415`,
  `:435-437`). A rename rewrites the ids
  (`src/components/SidebarSections.tsx:88-95`), but a delete does not, so a
  new department with the old name comes back collapsed and in the old
  place. The lists have no `storage` listener, so two windows write over
  each other (`src/lib/sidebar-preferences.ts:424-459`). The return of a
  collapsed department and the lost 101st entry come from the code; no test
  runs them. The release problem: "A file written over after a failed read"
  (v0.1.103, v0.1.107, v0.1.151).
- Options:
  - (a) Keep the collapsed state for each device, keyed by the department
    id, in the window settings of step 6. A failed load gives a typed error
    and no save (recommended).
  - (b) Keep it in the store with the department, the same on each device.
  - (c) Follow the reference (name keys in browser storage).
- Why: with an id, a rename changes nothing in the window settings, and a
  delete removes the entry. P76 already says that a failed load can never
  lead to a save.

### P705. A read takes the last message that the person saw (the step of P314)

- Kind: a choice. Better than the reference. New facts for P324. A judgment
  call inside its release problem: no release note names this case.
- **Problem in the reference:** the window drops the time it saw
  (`src/state/read-visible.ts:10-13`, the `_updatedAt` argument). The
  server sets the read cursor to the newest message at the time of the
  request (`server/index.ts:4039-4042`;
  `server/routes/bot-settings.ts:189-191`). A reply that arrives between the
  view and the request is marked read, and the person never sees its dot.
  The release problem: "The same work done two times, or lost".
- Options:
  - (a) The read command takes the id of the last message on the screen.
    The store marks read up to that message only (recommended).
  - (b) Follow the reference.
- Why: the person loses no new message. P324 has the dropped errors of a
  read and the thread of the read. This adds the race.

### P706. One read command for a bot, a department or a folder (the step of P314; P701 part 2 for the department scope)

- Kind: a choice. Better than the reference. A judgment call: the reference
  shows no release problem here, so the author can keep the reference.
- **Problem in the reference:** the window sends one request for each
  unread thread, in three copies of the loop with three separate guards
  (`src/components/SidebarBotMenu.tsx:91-111`;
  `src/components/SidebarTeamMenu.tsx:15-35`;
  `src/components/bot-panel/bot-actions.ts:33-47`; the loop is
  `src/lib/folder-read.ts:31-77`). A bot read and its department read can
  run at the same time and post the same thread two times. The department
  read has no in-flight ref, only a `disabled` button. Two hundred unread
  threads are two hundred requests. The list is taken at the click, so a
  bot moved into the department during the loop is not read. The server
  read is idempotent, and the reference keeps the done reads on purpose
  ("Completed reads were kept", `src/components/SidebarBotRead.test.ts:80`).
- Options:
  - (a) One command `mark_read { scope: Bot | Department | Folder }` in
    `bot-core`, one transaction, one event (recommended).
  - (b) Follow the reference: a loop in the window that keeps the done
    reads.
- Why: less code, and the scope is a typed value.
- Decide also: "mark all as read" includes archived threads on purpose, but
  the dot does not (`src/lib/folder-read.ts:9-14` against
  `src/lib/bot-unread.ts:6-9`; `src/lib/bot-read.test.ts:19`). Decide which
  rule the command follows.

### P707. Port the end state of the reversals, not their left-over code (P701)

- Kind: a decision. Better than the reference: we do not copy dead code.
- **Problem in the reference:** v0.1.182 (`b8cf45d55`) turned off two
  behaviours: busy bots first, and the Unread list. The code and its tests
  stay: `activeBotsFirst`, `unreadBotsApart`, `withUnreadSection`,
  `nextUnreadHold`, `useUnreadHold` (no caller), and the float logic of
  `savedPlacement` (`src/components/Sidebar.tsx:1095-1099`;
  `src/lib/sidebar-layout.ts:147-230`; `src/lib/sidebar-bot-drop.ts:57-71`;
  `src/components/unread-notice.ts:40`;
  `src/lib/sidebar-layout.test.ts:333-465`). The hook `useBotActions` has
  no caller outside a test (`src/components/bot-panel/bot-actions.ts:14`;
  `src/components/bot-archive.test.ts:23`). The docs page still says that
  sections keep "bot communication rules"
  (`apps/docs/content/docs/features/bots-and-tasks.mdx:56`), which ended in
  v0.1.128 and v0.1.152. The release problem: "A feature added, then
  removed or reversed" (departments v0.1.125 to v0.1.128, the peers list
  v0.1.152, the rows v0.1.182).
- Options:
  - (a) Build only the end state: rows keep their place, and marks show
    unread, work and a wait (recommended).
  - (b) Build the Unread list as an option. Not recommended: the reference
    removed it.
- Decision text if option a: "Rows keep their place. Unread, work and a
  wait show as marks, never as a move. We port only the end state of a
  reversal." Reference: `src/components/Sidebar.tsx:1095-1099`.
- Why: less code, and no tests for behaviour that the app does not show.

### P708. One name in code, wire and text: `department` (a decision before P701 part 2)

- Kind: a decision. Better than the reference.
- **Problem in the reference:** one thing has four names. The data and the
  routes say `section` (`/api/sidebar-sections`,
  `packages/phone-protocol/src/wire.ts:349-356`). Components say `team`
  (`TeamMenuItems`, `team.*` keys, `src/components/SidebarTeamMenu.tsx:60`).
  i18n keys say `Context` (`src/components/SidebarSectionPicker.tsx:65`,
  `:97`, `:117`). The text says "department". A test still uses the old
  text "A team with that name already exists"
  (`server/routes/sidebar-sections.test.ts:28`), which no code produces
  (`server/store.ts:673`). The two delete texts say two things: "move to
  General" and "outside any department"
  (`src/components/Sidebar.tsx:1531-1533`). The release problem: "A feature
  added, then removed or reversed" (v0.1.125, v0.1.128).
- Options:
  - (a) `department` everywhere, with "General" for no department
    (recommended).
  - (b) `section` in the data and "department" in the text, as the
    reference.
- Decision text if option a: "A department is called `department` in code,
  wire and text. No department is 'General'."
- Why: a reader and the compiler see one concept.
- Also for D16: add the departments and their headings to the list of
  sidebar parts. D16 names only "the chief bot, the 'Bots' group"
  (`src/components/Sidebar.tsx:1104-1110`).

### P709. Follow the reference for the UI of rows, menus, drag and confirmations (P701)

- Kind: a choice. Follows the reference.
- What:
  - the drop zones: a quarter above and a quarter below, and the middle
    half makes a new department (`src/lib/sidebar-bot-drop.ts:21-25`);
  - no nested departments: "group" only on a bot in no department
    (`src/lib/sidebar-bot-drop.ts:53`);
  - the name field in place, with "New department" and the first free
    number; Enter or a blur commits one time; Escape cancels
    (`src/lib/sidebar-bot-drop.ts:87-93`;
    `src/components/SidebarSectionHeader.tsx:210-247`);
  - Alt+Up/Down with the announcement "{name} moved to position {position}
    of {count}" (`src/components/SidebarBotDrag.tsx:90-93`);
  - the bot menu and the department menu, with their item order
    (`src/components/SidebarBotRead.test.ts:174`;
    `src/components/SidebarTeamMenu.test.ts:85`);
  - the marks of a row and of a collapsed heading
    (`src/components/SidebarRowMarkers.tsx:17-52`;
    `src/components/SidebarSectionHeader.tsx:249-292`);
  - Cancel has the focus first, and the archive check runs at confirm time
    (`docs/verification/sidebar.md:10-17`;
    `src/components/Sidebar.tsx:444-449`, `:1032-1040`);
  - notification sounds as the `silent` flag of the notice of the operating
    system, one switch for each device (`src/lib/notify.ts:53`;
    `src/lib/notification-preferences.ts:4`, `:27`).
- Options: (a) follow the reference (recommended). (b) our own design.
- Why: these are the end state after several fixes, and tests show them.

## New facts for open proposals

- **P682** ([`bot-settings-ui.md`](bot-settings-ui.md)): a drag across lists
  also sends a second write, the order, apart from the patch queue
  (`src/components/SidebarBotDrag.tsx:84-85`). See P702.
- **P324** ([`notifications.md`](notifications.md)): the read cursor is the
  newest message at the time of the request (`server/index.ts:4039-4042`).
  See P705.
- **P278** ([`team-structure.md`](team-structure.md)): a department delete
  emits a `bot` event for each bot of the store, not only the moved ones,
  and the window also applies the HTTP answer (`server/store.ts:757-759`;
  `src/state/store.tsx:917-922`). The collapsed state is keyed by the name
  (P704).
- **P76** ([`store-and-data-format.md`](store-and-data-format.md)):
  `bot-orders.json` loads as empty after a failed read, and the next save
  writes over the order of each person. A failed save only logs
  (`server/host/person-bot-order.ts:16-31`). It exists on a Team Cloud only
  (`server/index.ts:953`), so it is out of scope while P351 keeps one
  person. The browser lists of P704 have the same fault
  (`src/lib/sidebar-preferences.ts:385-394`).
- **P321** ([`notifications.md`](notifications.md)): each open window shows
  its own notice and plays the sound for one `notify` frame
  (`src/state/store.tsx:3083`). A tag replaces a notice only within one
  browser or the bridge (`src/lib/notify.ts:31`;
  `electron/desktop-notifications.mjs:69-74`).

## The problems of `changelog.md` section 5 in this feature

| Problem | Proposals |
|---|---|
| A feature added, then removed or reversed (departments v0.1.125 to v0.1.128, the peers list v0.1.152, the rows v0.1.182) | P707, P708 |
| The same work done two times, or lost | P702, P705 (a judgment call inside the problem) |
| State lost at a restart or a crash | P702 |
| A file written over after a failed read | P704 |
| "Busy" and races between bots | P703 |
| No release problem: a judgment call | P706 |
