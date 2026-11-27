# The sidebar rows and departments

The reference project at commit `95f3c9f16` (2026-11-27, after the tag
v0.1.184). This record covers two rows of
[`reference-features.md`](../reference-features.md):

- "The sidebar: confirmations, mark all as read, notification sounds"
  (`docs/verification/sidebar.md`).
- "Departments: groups of bots in the sidebar, by drag"
  (`docs/verification/sidebar.md`, `docs/verification/teams.md`, the
  sidebar part only).
- The items of the docs page `features/bots-and-tasks.mdx` that no other
  record covers. Section 3.12 shows that each item already has a record.

Our group for this feature is "later". It has no plan step yet. Its crates
are `bot-desktop` and `bot-core`.

### What this file adds to earlier research

- [`team-structure.md`](team-structure.md) 3.13 has the server rules of
  create, move, rename and delete of a department. Its section 1, item 1,
  and its git history (section 2.2) have "not walls". This file adds:
  - the drag flow and the name-in-place flow of a new department (3.4,
    3.5).
  - the menu of a department row and its confirmation (3.6, 5.3).
  - the shared department order, with `ordered`, `first`, the save queue and
    the undo (3.3).
  - the department file `section-contexts.json` as the owner of the list
    and the order (4.2).
  - the local lists of collapsed departments and their failure modes (3.7).
  - new line numbers. The route file grew from 100 to 121 lines.
- [`notifications.md`](notifications.md) has read-while-visible (3.12),
  read-on-open (3.8), the badge (3.14), the sound, feed and finished
  switches (3.15) and the unread motion (5.4). This file adds:
  - the three "mark all as read" actions: of a bot, of a department and of
    a folder (3.8, 3.9).
  - the mismatch between the rule of the unread dot and the rule of "mark
    all as read", and the test that makes it intended (3.8).
  - one correction. The "Unread" group of notifications.md 5.4 never shows
    at this commit (3.1 and section 2.4).
- [`threads.md`](threads.md) has the thread rows, folders and their order.
  This file adds only the folder "mark as read" (3.9). Folder order stays
  in threads.md.
- [`chat-and-teams-site.md`](chat-and-teams-site.md) has the Inbox row and
  people in the sidebar. This file adds nothing to them.
- [`recovery-and-pausing.md`](recovery-and-pausing.md) has the pause of a
  bot and of a department. This file adds only where the menu items are
  (5.2, 5.3).
- [`bot-settings-ui.md`](bot-settings-ui.md) 3.3 has "New bot" and its
  defaults. This file adds only the department of a new bot (3.12).
- All new: the bot order and the room order (3.2), the rules that keep rows
  in place (3.1), and the left-over code of the reversals (8.2).

The feature "look-and-design" owns the layout of the three places, the
command palette, the modes, skins, themes, right-to-left text and the places
rail. This file names those parts only where a row or a department uses
them.

## 1. In short

The **sidebar** is the left column of the desktop app. Each bot has one
**row**: its avatar, its name, a line of preview text and small **marks**
(dots and icons for working, waiting, failed, queued and unread). A right
click or the "⋯" button opens the **bot menu**.

A **department** is a named group of bots and group chats in the sidebar.
The data calls it a **section**: one string field `section` on each bot and
each room. Some code calls it a **team**. The text that the person reads
says "department". Bots in no department are in **General** (an empty
`section`). Since v0.1.128 a department does not limit which bots talk to
each other: "Departments are folders now, not walls". It still decides
which **Chief of Staff** (the lead bot of a department) is in charge.

The person arranges the sidebar in four ways:

1. **Drag a row.** The top or bottom quarter of a row puts the bot above or
   below. The middle half of a row of a bot in no department makes a **new
   department** with both bots. Its name field opens in place.
2. **Alt+Up and Alt+Down** move the focused row one place in its own list.
3. **Move to department** in the bot menu.
4. **Drag a department heading**, or Alt+Up and Alt+Down on it.

The server keeps three orders: the **bot order** (one list of all bots), the
**room order** and the **department order**. Each order change is a
**stable partial reorder**: the request names only the moved items, and
every other item keeps its place. The **collapsed** state of a department
and the order of the built-in sections stay in the browser storage of each
device.

Rows never move by themselves. Unread, work and a wait on the person show
as marks on the row, not as a move to the top. This is the result of a
reversal in v0.1.182. The old code is still in the files (8.2).

**Mark all as read** exists for one bot, for one department and for one
folder. Each one is a loop in the window that sends one read request for
each unread thread. **Notification sounds** is one switch for each device.
The app plays no audio file. The switch only sets the `silent` flag of the
operating system notice.

The **confirmations** of the sidebar are dialogs with Cancel focused first:
archive a bot, delete a bot, delete a department, delete a group chat and
delete all conversations of a bot.

## 2. Files read completely

Eight readers read the files. Each reader read each file of its group from
the first line to the last. A file marked "ranges" was read only in the
ranges given.

### 2.1 Read completely

| Group | Files (lines) |
|---|---|
| Documents | `docs/verification/sidebar.md` (133), `docs/verification/teams.md` (160), `docs/verification/sidebar-attention.md` (49), `docs/verification/team-access.md` (47), `apps/docs/content/docs/features/bots-and-tasks.mdx` (73), `src/lib/new-bot.ts` (107), `src/lib/default-bot.ts` (165) |
| The sidebar | `src/components/Sidebar.tsx` (1654, in four ranges that cover all lines) |
| Rows and menus | `src/components/SidebarBotMenu.tsx` (484), `src/components/SidebarTeamMenu.tsx` (90), `src/components/SidebarRowMarkers.tsx` (68), `src/components/SidebarBotActivity.tsx` (286), `src/components/SidebarPopoverMenu.tsx` (492), `src/components/bot-panel/bot-actions.ts` (102) |
| Departments, window | `src/components/SidebarSections.tsx` (155), `src/components/SidebarSectionHeader.tsx` (292), `src/components/SidebarSectionPicker.tsx` (123), `src/components/bot-sections.ts` (104), `src/lib/sidebar-layout.ts` (360), `src/lib/sidebar-fold.ts` (56), `src/lib/one-list.ts` (149), `src/components/one-list-sidebar.ts` (108), `src/components/sidebar-state.ts` (37), `src/lib/sidebar-preferences.ts` (511) |
| Drag and order | `src/components/SidebarBotDrag.tsx` (243), `src/lib/sidebar-bot-drop.ts` (93), `src/components/SidebarRoomDrag.tsx` (163), `src/lib/sidebar-room-drop.ts` (28), `src/lib/sidebar-shortcut-order.ts` (30), `shared/bot-order.ts` (39), `server/routes/bot-order.ts` (41), `server/routes/group-order.ts` (35), `server/host/person-bot-order.ts` (69) |
| Departments, server | `server/section-context.ts` (187), `server/department-grants.ts` (58), `server/routes/sidebar-sections.ts` (121), `server/routes/teams.ts` (238), `server/bot-folder.ts` (87) |
| Read marks and sounds | `src/lib/notify.ts` (66), `src/lib/notification-preferences.ts` (171), `src/components/NotificationSettingsRows.tsx` (126), `src/lib/window-prefs.ts` (125), `src/lib/window-pref-changes.ts` (17), `src/lib/bot-unread.ts` (34), `src/lib/folder-read.ts` (77), `src/state/bot-read.ts` (18), `shared/bot-read.ts` (3), `src/state/read-visible.ts` (173), `src/state/inbox.ts` (167), `server/routes/inbox.ts` (46), `server/held-unread.ts` (14), `src/components/unread-notice.ts` (48) |
| Tests | `src/components/Sidebar.departments.test.ts` (524), `src/components/Sidebar.bot-reorder.dom.test.ts` (148), `src/components/SidebarTeamMenu.test.ts` (110), `src/components/SidebarBotRead.test.ts` (241), `src/components/SidebarSections.test.ts` (72), `src/components/SidebarSectionHeader.test.ts` (238), `src/components/SidebarSectionHeader.naming.dom.test.ts` (78), `src/lib/sidebar-layout.test.ts` (473), `src/lib/sidebar-bot-drop.test.ts` (91), `server/host/person-bot-order.test.ts` (43), `server/routes/sidebar-sections.test.ts` (30), `src/lib/notify.test.ts` (277), `src/lib/notification-preferences.test.ts` (226), `server/routes/inbox.test.ts` (100) |

### 2.2 Read in ranges

| File (lines) | Ranges |
|---|---|
| `server/store.ts` (2254) | 1-9, 120-140, 154-157, 180-186, 270-320, 400-428, 545-552, 640-800, 834-842, 1530-1600, 1915-1965, 2006-2030 |
| `server/index.ts` (15,217) | 196, 631, 952-953, 1250-1295, 4035-4048, 4435-4490, 4695-4715, 11955, 11985, 12035-12037 |
| `src/state/store.tsx` (3258) | 14, 585-600, 718, 885-960, 1060-1075, 1108-1135, 1805, 2478-2560, 2805-2820, 2945-2960, 3000-3100, 3156 |
| `server/peer-roster.ts` (484) | 1-160, 298-415 |
| `server/routes/bot-settings.ts` | 165-230 |
| `server/routes/channels.ts` | 330-375 |
| `server/routes/app-settings.ts` | 1-50 |
| `server/host/place-inbox.ts` (327), `server/host/person-inbox.ts` (578) | 25-27, 90-125, 280-315; 33-34, 130-160, 530-560 |
| `server/registry-store.ts`, `server/atomic.ts`, `server/registry-save.ts` | 60-160; 100-145; 45-75 |
| `apps/docs/content/docs/features/chat-and-teams.mdx` (137), `docs/team-cloud.md` (1143) | 40-75; 410-420, 688-742 |
| `electron/places-together.mjs` | 560-585 |

The test files `src/components/bot-sections.test.ts`,
`src/lib/bot-read.test.ts` and `src/lib/sidebar-preferences.test.ts` were
read by their test names only. `scripts/testing/team-lifecycle-ui.e2e.test.ts`
was read by grep only (section 6).

### 2.3 Claims that the lead checked against the code

| Claim | Lines | Result |
|---|---|---|
| Rows never move for unread or work: `floats` is always false, and the Unread list is off | `src/components/Sidebar.tsx:1095-1099`; `src/lib/sidebar-layout.ts:198-224` | Agrees |
| A role that is not known yet allows a bot drag. The department order waits for a known role | `src/components/bot-sections.ts:10-12`, `:48-52` | Agrees |
| A bot order save has no queue and rolls back to the order from before this move | `src/components/bot-sections.ts:36-45` | Agrees |
| A department order save has a queue, a 10 s limit and an undo that checks for a newer move | `src/components/bot-sections.ts:66-99` | Agrees |
| A cross-list drag sends two writes: the department, then the order | `src/components/SidebarBotDrag.tsx:84-85` | Agrees |
| `reorderBots` changes memory before the save. `reorderGroups` saves first | `server/store.ts:1938-1950` | Agrees |
| A broken `bot-orders.json` loads as empty, and the next save writes over it. A failed save only logs | `server/host/person-bot-order.ts:16-31` | Agrees |
| A broken `section-contexts.json` refuses each write and reads as no departments | `server/section-context.ts:53-78` | Agrees |
| The first offer of a department order applies only while `ordered` is not set | `server/section-context.ts:117-124` | Agrees |
| A broken local list loads as empty, and a list keeps at most 100 items | `src/lib/sidebar-preferences.ts:383-422`, `:435-437` | Agrees |
| The read sender drops `updatedAt` and every error | `src/state/read-visible.ts:10-13` | Agrees |
| The dot skips routine runs and archived threads. "Mark all as read" does not | `src/lib/bot-unread.ts:6-9`; `src/lib/folder-read.ts:9-14` | Agrees |
| The department "Mark all as read" has no in-flight ref, only `disabled` | `src/components/SidebarTeamMenu.tsx:15-35`; `src/lib/folder-read.ts:54-77` | Agrees |
| A department delete emits a `bot` event for every bot of the store | `server/store.ts:738-760` | Agrees |
| `GET /api/sidebar-sections` has no visibility filter in the route | `server/routes/sidebar-sections.ts:42-44` | Agrees, but see section 9 |
| `useBotActions` has no caller outside a test | grep of `src/` | Agrees |
| `useUnreadHold` has no caller | grep of `src/` | Agrees |
| The per-bot peers list is gone. The store deletes the old fields at load | `server/peer-roster.ts:124-128`; `server/store.ts:422-427`; commit `5819d22d6` (v0.1.152) | Agrees |

### 2.4 Changes since the commits of the earlier research

The border records read older commits: `96ff84455` (2026-11-25) for
team-structure, notifications and chat-and-teams-site. Between `96ff84455`
and `95f3c9f16`, 11 files of this feature changed (418 lines added, 164
removed). Do not copy line numbers of these files from the border records.

| Change | Commit | Release |
|---|---|---|
| Rows keep their place. Unread and work show as marks (#7552) | `b8cf45d55` | v0.1.182. The row of v0.1.182 in `changelog.md` does not have it |
| One department order on the server, shown by every client | `13a7a61be` | after v0.1.184, no tag yet |
| Department order saves go one after the other | `ececd019d` | after v0.1.184 |
| Each department order save stops after 10 s | `4eb7a30da` | after v0.1.184 |
| After a save with no answer, show the order the server holds | `ff18c38eb` | after v0.1.184 |
| Move up and Move down in the department menu (phone) | `f02e1e39d` | v0.1.182 |
| A cleaner department menu | `8fad75e65` | after v0.1.184 |
| Cloud bots land in a place department in the one list (#7681) | `7227e1367` | after v0.1.184 |
| Room order: save one at a time, never restore an old order | `0e4a0ccbe` | v0.1.155 |

The release history of the base parts, from `git tag --contains`:

| Part | Commit | First release |
|---|---|---|
| Shared instructions for each section | `077f186fd` | v0.1.46 |
| The department routes leave `server/index.ts` | `9ebb0c3fd` | v0.1.123 |
| The fleet bot order, `PUT /api/bots/order` | `e68b20db2` | v0.1.125 |
| "Every bot can reach every bot" | `78c79a440` | v0.1.128 |
| Drag bots to reorder them and into departments (#3906) | `e6cc9b5c6` | v0.1.135 |
| The peers list is removed (#5188) | `5819d22d6` | v0.1.152 |
| On a team, unread marks, notices and the bot order are each person's own (#5168) | `f55d45c6e` | v0.1.152 |

## 3. How it works

### 3.1 The rows and their order on screen

1. The window gets the bots in the server order (`state.bots`). The layout
   splits them into lists (`src/lib/sidebar-layout.ts:113-135`):
   1. Hidden bots, bots hidden from the sidebar and the bot that the app
      welcomes now are left out (`:119-120`).
   2. Pinned bots go to "Pinned" (`:121-123`).
   3. One Chief with no department goes above all sections. On a phone it
      is a large tile (`src/components/Sidebar.tsx:1351-1357`).
   4. Then the Chiefs of departments, the bots in departments, and the bots
      in no department (`src/lib/sidebar-layout.ts:125-133`).
2. Each list keeps the server order. The test says: "The server owns this
   order (PUT /api/bots/order); a reorder made on a phone must show up here
   unchanged." (`src/lib/sidebar-layout.test.ts:77`).
3. Rows never move by themselves. The comment says: "Rows keep their place
   while the app is in use: unread, work and a wait on the person show as
   marks on the row, never as a move to the top or into an Unread list. Only
   a pin, a drag, Alt+Up/Down or a move to a department moves a row."
   (`src/components/Sidebar.tsx:1095-1096`). The code passes
   `floats = () => false` and `unreadApart = false` (`:1097-1099`). So
   `activeBotsFirst` changes nothing, and `unreadBotsApart` returns an empty
   Unread list (`src/lib/sidebar-layout.ts:201-202`, `:214-224`).
4. The sections show in this natural order: Pinned (only with pins), Group
   chats, Bot threads, Bots, then each department
   (`src/components/Sidebar.tsx:1104-1110`). The saved order of this device
   can change it (3.7). The department order of the server fills the places
   of the departments (3.3).
5. A department exists in the list when the server lists it, or when a shown
   bot or room names it (`sectionsInUse`, `src/lib/sidebar-layout.ts:157-162`).
6. Inside a section, the rows are: the drop slot (Bots only), the Chiefs of
   the department, its group chats, then its bots
   (`src/components/Sidebar.tsx:1426-1447`).
7. ⌘1 to ⌘9 and ⌘⇧[ / ⌘⇧] use the rows as drawn on screen, read from the
   page, not `state.bots`. A bot in a collapsed department is not in that
   list (`src/lib/sidebar-shortcut-order.ts:1-30`).

### 3.2 Save the bot order and the room order

The bot order:

1. A drop or Alt+Up/Down gives the new order of one list
   (`src/components/SidebarBotDrag.tsx:78`).
2. `saveBotOrder` stops if the order of those ids did not change
   (`src/components/bot-sections.ts:38-39`).
3. It shows the new order at once (`botsOrdered`), then sends
   `PUT /api/bots/order {botIds}` with no wait (`:40-41`).
4. The server checks the body (`server/routes/bot-order.ts:24-33`):
   - The only key is `botIds`: a non-empty list of distinct, non-empty ids.
     Else 400 "botIds must be a non-empty array of distinct bot ids".
   - Each id exists and the caller can see it. Else 400
     "unknown bot: <id>". A hidden bot gets the same answer as a missing
     one, so the ids cannot probe the fleet.
5. The store reorders the list in place, saves `bots.json`, then emits
   `bots.order` (`server/store.ts:1940-1945`). The list changes before the
   save. If the save throws, memory has the new order, the disk has the old
   one, and no event goes out.
6. The server sends `{kind: "bots.order", botIds}` with every bot id to each
   window (`server/index.ts:4484`). Each window applies a stable partial
   reorder. A frame that changes nothing keeps the state object
   (`src/state/store.tsx:925-926`, `:3032-3033`).
7. The answer is 200 `{botIds}` with only the bots the caller can see
   (`server/routes/bot-order.ts:37-39`).
8. If the request fails, the window shows the order from before this move,
   and an error (`src/components/bot-sections.ts:41-44`).

The error paths and the limits of the bot order:

- The saves of one window have no queue. Two fast moves send two requests
  at the same time. The server keeps the last one that it handles.
- The rollback has no check for a newer move. If the first of two moves
  fails, its rollback can undo the second move on screen while the server
  holds the second move (`src/components/bot-sections.ts:38-44`).
- The server has no version check. The last write wins for two windows or
  two people (`server/routes/bot-order.ts:35`).
- A bot can also reorder the fleet. The app setting `bots.order` ("Bot
  order") takes 1 to 100 ids and calls the same route
  (`server/app-settings/registry.ts:178-182`, `:386`).
- On a Team Cloud, a User who is not an admin has an own order in
  `bot-orders.json`. An Owner or an Admin sets the team order
  (`server/host/person-bot-order.ts:1-2`, `:56`;
  `server/routes/bot-order.ts:34-35`). This part is for Team Cloud only
  (`server/index.ts:953`).

The room order has a queue and a safe rollback:

1. `saveRoomOrder` stops if nothing changed
   (`src/components/SidebarRoomDrag.tsx:20-21`).
2. The first save of a batch keeps the confirmed order of all rooms
   (`:22`).
3. It shows the new order at once, then chains
   `PUT /api/groups/order {groupIds}` after the save before it (`:25-27`).
4. The store saves a copy first, then changes the live list, then emits
   `groups.order` (`server/store.ts:1947-1950`). The comment says "saved
   before the live list changes".
5. The last save of a batch can end with a failure. Then the window puts
   back the confirmed order of the rooms that the batch moved. It shows the
   last error (`src/components/SidebarRoomDrag.tsx:32-40`).
6. A room moves only up or down in its own list. It never moves to another
   department by drag (`src/lib/sidebar-room-drop.ts:12-15`).

### 3.3 The shared department order

1. The department list and its order are in `section-contexts.json`
   (`server/section-context.ts:14`, `:21-29`).
2. On mount, a person who is owner or admin offers the order that this
   device showed before. It sends `PUT /api/sidebar-sections/order
   {sections, first: true}` one time for each mount, when there are 2 or
   more departments (`src/components/SidebarSections.tsx:56-64`;
   `src/components/bot-sections.ts:62-65`). Errors are dropped on purpose,
   for an older server.
3. The server takes a `first` offer only while the flag `ordered` is not
   set (`server/section-context.ts:121`). The first device to update keeps
   its departments where they were (`src/components/SidebarSections.test.ts:48`).
4. A move of a heading calls `saveDepartmentOrder`
   (`src/components/SidebarSections.tsx:107`;
   `src/components/bot-sections.ts:73-88`):
   1. Stop if nothing moved.
   2. Keep `before` and take a request number.
   3. Show the new order at once (`sectionsOrdered`).
   4. Chain the PUT after the save before it, with a 10 s limit. "Moves
      reach the server in the order they were made: the server keeps the
      last order it gets." (`:68-69`).
5. The server checks the body: a non-empty list of distinct names, each a
   department that the caller can see. Else 400 "sections must be a
   non-empty array of distinct department names" or "unknown department:
   <name>" (`server/routes/sidebar-sections.ts:48-57`). It saves with
   `ordered: true` and emits `sections` (`server/section-context.ts:122`;
   `server/store.ts:657`).
6. After a failure, `undoMove` runs only if no newer move was made
   (`src/components/bot-sections.ts:89-99`):
   - A 4xx changed nothing, so the order from before comes back.
   - No answer or a 5xx may have been kept, so the window reads
     `GET /api/sidebar-sections` and shows the order that the server holds.
     If that read fails too, it shows the order from before.
7. A person who is not owner or admin, or whose role is not known yet, keeps
   the order of this device (`src/components/bot-sections.ts:48-52`).

### 3.4 Drag a bot

1. A drag is on when the sections are interactive or the sidebar is the
   column of avatars, never on a phone
   (`src/components/Sidebar.tsx:1103`). Sections are not interactive while
   a search query is set (`src/lib/sidebar-layout.ts:92-94`). The room drag
   is also off during a search (`src/components/Sidebar.tsx:1078`).
2. The person must be owner or admin, or the role is not known yet
   (`useMayMoveBots`, `src/components/bot-sections.ts:10-12`;
   `src/components/SidebarBotDrag.tsx:57`, `:177`).
3. `onDragStart` puts the bot id in the drag data under the type
   `application/x-<product>-sidebar-bot` (`src/lib/sidebar-bot-drop.ts:1`;
   `src/components/SidebarBotDrag.tsx:120-127`). `<product>` is the
   product name of the reference.
4. Over a row, the place comes from the pointer height
   (`src/lib/sidebar-bot-drop.ts:21-25`):
   - the middle half (25% to 75%) is "group", only when the target bot is
     in no department and the drag is not in the column of avatars.
   - else the upper half is "before" and the lower half is "after".
5. Over a whole section, a drop between rows or below the last row goes to
   the nearest row. A drop on the heading of a department puts the bot at
   its end (`src/components/SidebarBotDrag.tsx:189-224`).
6. When every bot is in a department, a dashed slot "Remove from
   department" shows at the top while a drag runs (`:225-228`).
7. `planBotDrop` returns nothing for a drop that changes nothing, a bot
   that is in no list, a drop on itself or an unknown target
   (`src/lib/sidebar-bot-drop.ts:47-55`). A "group" drop on a bot that is
   already in a department returns nothing. So departments cannot nest.
8. A move ("before", "after" or "end") does these writes
   (`src/components/SidebarBotDrag.tsx:78-89`):
   1. If the list changed, `moveBotsToSection` sets the department of the
      bot. In a local window it dispatches `updateBot {section}`, which goes
      through the patch queue of the bot to `PATCH /api/bots/<id>`
      (`src/components/bot-sections.ts:25-34`;
      `src/state/store.tsx:2809-2812`). A remote client sends
      `POST /api/sidebar-sections {name, botIds}`.
   2. `saveBotOrder` saves the order of the target list (3.2).
   These are two separate writes. One can fail and the other can succeed.
9. A drag that the column of avatars cannot show is refused: a move to
   another list, or a "group" (`:95-101`).
10. A drag begun while the role was not known drops nothing if the role
    turns out to be a member (`src/components/Sidebar.departments.test.ts:396`).
11. The drop uses the lists of the last render. A bot that another window
    removed during the drag is ignored (`src/lib/sidebar-bot-drop.ts:48-49`).

Alt+Up and Alt+Down:

1. Only Alt with ArrowUp or ArrowDown moves a row. Ctrl, Meta or Shift
   gives nothing (`src/lib/sidebar-bot-drop.ts:82-85`).
2. A row moves one place in its own list, and not past an end (`:73-80`).
3. The window says "{name} moved to position {position} of {count}" in a
   polite live region, and focuses the row on the next frame
   (`src/components/SidebarBotDrag.tsx:90-93`).

### 3.5 Make or rename a department in place

1. A "group" drop opens a name field in a new heading at the end of the
   list. The two bots show in it, the target bot first
   (`src/components/SidebarBotDrag.tsx:74-76`, `:166-167`;
   `src/lib/sidebar-bot-drop.ts:53`).
2. The default name is "New department", then "New department 2" and so
   on, the first free number (`src/lib/sidebar-bot-drop.ts:87-93`).
3. The field takes focus with all text selected. Its limit is 60
   characters (`src/components/SidebarSectionHeader.tsx:210-247`).
4. Enter or a blur commits. Escape cancels. A `settled` ref makes sure that
   only one of them runs, so Enter and then a blur commit one time
   (`:213`, `:219-241`).
5. On commit, a blank name gives the default name. Each visible bot that
   this server owns gets `updateBot {section: name}`
   (`src/components/SidebarBotDrag.tsx:154-157`). The department comes into
   being when a bot save names it (`server/store.ts:658-665`).
6. On cancel, the bots go back and nothing is saved (`:237`). Another drag
   over a heading that is being named is refused
   (`src/components/Sidebar.departments.test.ts:248-252`).
7. Rename in place (Simple mode): the department menu opens the same field
   with the old name. Commit sends `PATCH /api/sidebar-sections?section=<old>
   {name}`, then sets the list from the answer
   (`src/components/bot-sections.ts:101-104`). A failure shows the error
   (`src/components/SidebarBotDrag.tsx:160-162`). Advanced mode keeps a
   rename dialog (`src/components/Sidebar.tsx:1524`).
8. The server rules of rename (1 to 60 characters, no control characters,
   no merge, refused while a member is busy) are in
   [`team-structure.md`](team-structure.md) 3.13.

### 3.6 The department menu and delete

1. The menu opens from the "⋯" of a heading in Simple mode, or a right
   click in Advanced mode. A remote client and a department that cannot be
   changed get no menu (`src/components/Sidebar.tsx:1407-1415`, `:1359`).
2. The items are in 5.3.
3. Delete opens a confirmation (`src/components/Sidebar.tsx:1531-1543`):
   1. A ref stops a second confirm while one runs. Cancel is ignored while
      it runs (`:1534-1536`).
   2. It sends `DELETE /api/sidebar-sections?section=<name>`
      (`:1539`).
   3. The server refuses 409 when a team computer is assigned
      (`server/routes/sidebar-sections.ts:63`). The store refuses during
      active work, and when General would get two Chiefs
      (`server/store.ts:735-744`).
   4. The store moves the bots and rooms of the department to General. It
      removes the name from the grants of each Chief. It saves the bots, the
      rooms and the list file, and rolls back on an error (`:738-754`).
   5. It emits a `bot` event for every bot of the store, not only the moved
      ones, then a `group` event for each moved room, then `sections`
      (`:757-759`).
   6. The window gets the answer `{sections}` and dispatches
      `sectionDeleted`. This clears `section` on each bot and room of that
      name (`src/state/store.tsx:917-922`). The frames of step 5 then set
      the same state again.
   7. On an error, the message shows in the notice of the sidebar
      (`src/components/Sidebar.tsx:1541`).
4. A delete does not clear the collapsed state or the saved place of the
   department on this device (3.7).

### 3.7 Collapse and the order of this device

1. Three lists are in the browser storage of each device
   (`src/lib/sidebar-preferences.ts:15-17`): the collapsed sections, the
   section order of Advanced mode and the section order of Simple mode.
   Their keys are `<product>.sidebarCollapsedSections.v1`,
   `<product>.sidebarSectionOrder.v1` and
   `<product>.sidebarSectionOrder.simple.v1`.
2. A department in these lists is `section:<name>`
   (`src/lib/sidebar-layout.ts:18`, `:53-55`). The id is the name.
3. The hook reads the three lists one time at mount
   (`src/components/SidebarSections.tsx:45-47`).
4. A click on a heading flips its id and saves the whole list at once
   (`:82-87`). A collapse is off during a search and in the column of
   avatars (`src/lib/sidebar-layout.ts:92-103`).
5. A rename rewrites the old id in all three lists (`:88-95`). A delete
   does not. A new department with the old name comes back collapsed and in
   the old place.
6. A list holds strings of 1 to 240 characters, at most 100
   (`src/lib/sidebar-preferences.ts:383-422`). These are the error paths:
   - Bad JSON or one bad item makes the whole list empty (`:385-394`). The
     next click saves a list built from empty. This writes over the old
     list.
   - A new collapsed id goes at the end (`:435-437`), and a save keeps the
     first 100 (`:415`). With 100 ids stored, a new collapse shows on
     screen but is not saved. After a restart the department is open
     again.
   - Storage errors are swallowed (`:416-420`).
   - These lists have no `storage` listener (`:424-459`). Each window keeps
     its own copy from mount and saves its whole list. The last window to
     write wins.
7. `mergeSectionOrder` keeps the saved place of a section that does not
   show now (`src/lib/sidebar-layout.ts:311-345`). So old ids stay in the
   saved order.

### 3.8 "Mark all conversations as read" for one bot

1. The bot menu has the item. Advanced: "Mark all conversations as read".
   Simple: "Mark as read" while the bot shows unread, else "Mark as unread"
   (`src/components/SidebarBotMenu.tsx:334-341`, `:454-457`).
2. A ref `readInFlight` stops a second start (`:91`, `:96-97`).
3. `markBotRead` sends one `POST /api/bots/<id>/read {threadId}` for each
   unread thread, one after another, and dispatches `botPatched` after each
   (`src/lib/folder-read.ts:31-52`).
4. The list of unread threads is the list at the start. A thread that turns
   unread later is not read (`src/lib/bot-read.test.ts:72`).
5. On success the menu closes, but only if it is still the same menu
   (`src/components/SidebarBotMenu.tsx:103`).
6. On a failure, the menu stays open with "Could not mark all conversations
   as read. Completed reads were kept. Try again." and the error. A second
   click reads only the rest (`:104-106`;
   `src/components/SidebarBotRead.test.ts:80`).
7. The item is off while any read runs. In Advanced mode it is also off
   when `botUnreadThreadIds` is empty (`:457`). A remote client that is
   pinned to one thread does not get it (`docs/verification/sidebar.md:42-44`).

Two rules of "unread" differ:

- The dot of a row skips routine runs and archived threads
  (`src/lib/bot-unread.ts:6-9`).
- "Mark all as read" reads every unread thread, archived ones too
  (`src/lib/folder-read.ts:9-14`). A test makes this intended: "includes
  unfiled, filed, working, waiting and archived threads"
  (`src/lib/bot-read.test.ts:19`).
- So the Advanced item can be on for a row that shows no dot.

The server side of a read, `POST /api/bots/<id>/read`, is in
[`notifications.md`](notifications.md) 3.8. This file adds one fact. The
read cursor is the newest message at the time of the request
(`server/index.ts:4039-4042`). The window does not send the time it saw
(`src/state/read-visible.ts:10-13`). So a reply that arrives between
the view and the request is marked read.

### 3.9 "Mark all as read" for a department and for a folder

The department:

1. The item shows only while a bot or a group chat of the department is
   unread (`src/components/SidebarTeamMenu.tsx:19-20`).
2. `departmentUnread` takes two lists (`src/lib/folder-read.ts:54-60`):
   - the shown bots with unread threads whose trimmed `section` is the name.
   - the unread group chats (not direct chats) whose `section` is the name.

   Bots compare a trimmed name. Rooms compare the exact name.
3. A click sets `reading` and turns the button off (`:22`, `:32`).
4. `markDepartmentRead` reads each bot (3.8), then each unread thread of
   each group chat with `POST /api/groups/<id>/read {threadId}`, one at a
   time. "One request at a time, so a failure keeps every read before it."
   (`src/lib/folder-read.ts:62-77`). It does not use the batch form of the
   room route (`server/routes/channels.ts:343-357`).
5. On success the menu closes. On a failure a global error shows with the
   same text as 3.8, and the menu stays open
   (`src/components/SidebarTeamMenu.tsx:24-27`).
6. There is no in-flight ref, only the `disabled` button. The bot menu, the
   department menu and the unused hook `useBotActions` each have their own
   guard (`src/components/SidebarBotMenu.tsx:91`;
   `src/components/SidebarTeamMenu.tsx:18`;
   `src/components/bot-panel/bot-actions.ts:33-47`). A bot read and its
   department read can run at the same time and post the same thread two
   times. The server read is idempotent, so the second post changes
   nothing.
7. The list is the one at the click. A bot moved into the department during
   the loop is not read.

The folder of one bot:

1. The folder menu offers "mark as read" only when the folder has unread
   threads (`src/components/Sidebar.tsx:609`).
2. A click is refused while a read runs. The status says "Marking folder as
   read…", then "Folder marked as read", or an alert with the error
   (`:535-546`).
3. `markFolderRead` reads the unread threads of the folder with the same
   helper (`src/lib/folder-read.ts:16-29`).

### 3.10 Notification sounds

1. The switch "Notification sounds" is in Settings → Appearance, one for
   each device (`docs/verification/sidebar.md:92-94`). Its key is
   `omb-notification-sounds`. It is on unless the value is `"0"`
   (`src/lib/notification-preferences.ts:4`, `:27`).
2. There is no audio file. A notice gets `silent: true` when the switch is
   off. Else the operating system plays its own sound
   (`src/lib/notify.ts:53`; `src/lib/notify.test.ts:242-248`).
3. In the desktop app the notice goes to the bridge of the main process. If
   the bridge says no or fails, the page shows its own notice
   (`src/lib/notify.ts:61-65`).
4. A notice for a bot has the tag `<product>:<botId>`. A new notice for the
   same bot replaces the old one in one browser or in the bridge
   (`src/lib/notify.ts:31`; `electron/desktop-notifications.mjs:69-74`).
5. Each open window that gets a `notify` frame shows its own notice
   (`src/state/store.tsx:3083`). Two windows without focus each show a
   notice and each play the sound. No test covers this.
6. The other switches, the focus rule and the window preference report are
   in [`notifications.md`](notifications.md) 3.10 and 3.15.

### 3.11 The confirmations of the sidebar

1. **Archive a bot.** `requestArchive` checks `currentArchivableBot` before
   it shows the dialog, and again at confirm. The comment says: "A
   confirmation may span live fleet updates; never authorize from its
   snapshot." (`src/components/Sidebar.tsx:444-449`, `:1032-1040`). The
   check refuses the last active bot, a Chief and the default bot. After
   the archive, a notice with Undo shows for 5,000 ms
   (`:1025-1029`, `:1627-1651`).
2. **Delete a bot.** The menu sets the dialog with no check
   (`:1493`). Confirm dispatches `deleteBot` (`:1507`). For a Chief, the
   dialog offers "Archive instead", which sends `PATCH /api/bots/<id>
   {hidden: true, chiefOfStaff: false}`
   (`src/components/Sidebar.departments.test.ts:502-512`).
3. **Delete a department** (3.6).
4. **Delete a group chat.** Confirm reads the room from live state, because
   "it may have been removed while the dialog was open"
   (`src/components/Sidebar.tsx:1565-1577`).
5. **Delete all conversations of a bot.** The More menu has the item only
   with two or more threads. The dialog says "Delete all conversations
   (3)?" with the count (`src/components/SidebarBotRead.test.ts:183-195`).
6. The dialog puts focus on Cancel first, traps Tab, and gives focus back to
   the trigger on Escape (`docs/verification/sidebar.md:10-17`).

No confirmation guards these: move to a department, "mark all as read",
"Pin" and a drag.

### 3.12 The items of `bots-and-tasks.mdx`

Each item has a record. This file adds only the department of a new bot.

| Item (line of the page) | Record |
|---|---|
| A new bot from saved defaults (16) | [`bot-settings-ui.md`](bot-settings-ui.md) 3.3; [`bot-profile.md`](bot-profile.md) 3.9 |
| Review of a template draft, then Create bot (16) | `bot-settings-ui.md` 3.4; `bot-profile.md` 3.9 |
| Three direct threads at a time (22) | [`threads.md`](threads.md) 3.14 |
| Groups (50, 54) | [`bot-coordination.md`](bot-coordination.md) 3.2 to 3.8 |
| Hold a bot in a group (52) | `bot-coordination.md` 3.6 |
| Appoint or replace a Chief (58-60) | [`team-structure.md`](team-structure.md) 3.4 and 3.6 |
| Delegation (64) | `bot-coordination.md` 3.9 to 3.14 |

The department of a new bot:

1. A team User who is not an admin sends no `section`. The server applies
   its own default (`src/lib/new-bot.ts:54-62`).
2. A paired remote device sends `section` if one is given (`:63-66`).
3. Otherwise the window reads `GET /api/bot-defaults` and sets `section` in
   the draft (`:67-72`).
4. "New bot" in the department dialog makes the bot in that department at
   once (`apps/docs/content/docs/features/chat-and-teams.mdx:69`).

The page has one left-over. It says: "Existing sections keep their Chief
of Staff assignments and bot communication rules."
(`apps/docs/content/docs/features/bots-and-tasks.mdx:56`). The rules of
communication by section were removed in v0.1.128, and the per-bot peers
list in v0.1.152 (section 2.4).

## 4. The data

### 4.1 Types

| Type | Fields | Lines |
|---|---|---|
| Bot (the parts of this feature) | `section?: string` ("Optional labeled divider used to organize this bot in the sidebar"); `chiefOfStaff?`; `managedSections?`; `pinned?`; `unread?`; `tasks[].unread`; `tasks[].heldUnread` | `packages/phone-protocol/src/wire.ts:349-356` |
| Room | `section?: string`; `dm?` | `server/store.ts:792`, `:834-838` |
| `BotLists` | a map from department name to bot ids. The key `""` is the bots in no department | `src/lib/sidebar-bot-drop.test.ts:5-9` |
| `BotDrop` | `{kind: "row", botId, place: "before" \| "after" \| "group"}` or `{kind: "end", list}` | `src/lib/sidebar-bot-drop.ts:4-12` |
| `BotMove` | `{kind: "move", section, order}` or `{kind: "group", botIds}` | `:14-18` |
| `Naming` | `{kind: "new", botIds, name}` or `{kind: "rename", section}` | `src/components/SidebarBotDrag.tsx:23` |
| `DepartmentOrder` | `{order, save(names), offer(names)}` | `src/components/bot-sections.ts:55-60` |
| Section id | built-in: `builtin:pinned`, `builtin:unread`, `builtin:channels`, `builtin:bot-chats`, `builtin:bots`, `builtin:attention`, `builtin:tools`. A department: `section:<name>` | `src/lib/sidebar-layout.ts:10-18`, `:53-60` |
| `NEW_DEPARTMENT` | `"\u0000new"`, the id of a department that has no name yet | `src/components/SidebarBotDrag.tsx:12` |

### 4.2 Files on disk

| File | Shape | After a failed read | Lines |
|---|---|---|---|
| `bots.json` | the bots, in the fleet order, each with `section` | loads as no bots. P76 has the overwrite | `server/store.ts:296-303` |
| `groups.json` | the rooms, in the room order | loads as no rooms. P76 | `server/store.ts:304-308` |
| `section-contexts.json` | `{version: 1, sections, contexts, memoryKeys, ordered?}`, mode 0600, atomic | a write refuses with `serverError.department.readFailed`. A read gives no departments | `server/section-context.ts:14`, `:21-29`, `:53-83` |
| `bot-orders.json` (Team Cloud only) | `{version: 1, orders: {personKey: botIds}}`, mode 0600, atomic | loads as empty. The next save writes over the orders of every person. A failed save only logs | `server/host/person-bot-order.ts:12-31` |

So a department lives in two places: the list file and the `section` field
of each bot and room. The department of a bot is not in the list file.

### 4.3 Browser storage (one copy for each device)

| Key | Value | Default | Lines |
|---|---|---|---|
| `<product>.sidebarCollapsedSections.v1` | JSON list of section ids | empty | `src/lib/sidebar-preferences.ts:15` |
| `<product>.sidebarSectionOrder.v1` | JSON list of section ids (Advanced) | natural order | `:16` |
| `<product>.sidebarSectionOrder.simple.v1` | JSON list of section ids (Simple) | Pinned, Bots, Group chats, Bot threads first | `:17`; `src/lib/sidebar-layout.ts:270-281` |
| `<product>.sidebarDensity` | `"avatars"` for the column, else comfortable | comfortable | `src/lib/sidebar-preferences.ts:10`, `:22-35` |
| `omb-notification-sounds` | `"0"` or `"1"` | on | `src/lib/notification-preferences.ts:4`, `:27` |

### 4.4 State in memory only (lost at a restart)

- The drag state and a department that is still being named
  (`src/components/SidebarBotDrag.tsx:54-56`).
- The open state of a bot's thread list (`src/lib/search-disclosure.ts:3`)
  and the collapsed folders inside a bot (`src/components/Sidebar.tsx:462`).
- The batch state of the room order (`src/components/SidebarRoomDrag.tsx:16`).
- The queue and the request number of the department order
  (`src/components/bot-sections.ts:66-69`).
- The grant of a new department to a Chief waits in a microtask queue
  (`server/department-grants.ts:21`, `:35`). See P278.
- The per-person "mark as unread" holds of the window
  (`src/state/read-visible.ts:15-27`).

### 4.5 HTTP routes of this feature

| Route | Body | Answer | Lines |
|---|---|---|---|
| `PUT /api/bots/order` | `{botIds}` | `{botIds}` | `server/routes/bot-order.ts:22-39` |
| `PUT /api/groups/order` | `{groupIds}` | `{groupIds}` | `server/routes/group-order.ts:19-33` |
| `GET /api/sidebar-sections` | none | `{sections}` | `server/routes/sidebar-sections.ts:42-44` |
| `PUT /api/sidebar-sections/order` | `{sections, first?}` | `{sections}` | `:48-59` |
| `POST /api/sidebar-sections` | `{name, botIds?}` | `{section, sections, bots}` | `:93-118` |
| `PUT /api/sidebar-sections?section=` | `{addBotIds, removeBotIds}` | `{sections, bots}` | `:75-92` |
| `PATCH /api/sidebar-sections?section=` | `{name}` | `{sections}` | `:60-74` |
| `DELETE /api/sidebar-sections?section=` | none | `{sections}` | `:60-74` |
| `POST /api/bots/<id>/read` | `{threadId, reason?}` | `{bot}` | `server/routes/bot-settings.ts:173-197` |
| `POST /api/groups/<id>/read` | `{threadId}` or `{threadIds}` (at most 500) | `{group}` | `server/routes/channels.ts:338-363` |

The frames: `bots.order`, `groups.order` and `sections` each carry the whole
list (`server/index.ts:4446-4452`, `:4484-4485`).

## 5. The UI

### 5.1 A bot row

- Avatar size: 44 by default, 36 in a Simple row, 32 when the thread list
  shows (`src/components/Sidebar.tsx:715`).
- The marks (`src/components/SidebarRowMarkers.tsx:17-52`):
  - working: a green dot, "Working".
  - failed: a red dot, "Ran into a problem".
  - teammate: an accent dot, "Waiting on a teammate…".
  - queued: a grey dot, "Queued".
  - waiting: a yellow dot at the top right, "Waiting for you…". Waiting wins
    over unread.
  - unread: an accent dot, "Unread".
  - On a desktop the dot sits where the "⋯" button shows, and fades on
    hover. On a touch screen both show.
- A Chief has a crown. A live call has a phone icon. A pinned bot has a pin
  icon (`src/components/Sidebar.tsx:760-778`).
- The second line, in order: the waiting text, "waiting on teammate",
  "Queued", the last line of a failed turn, the place line, else the
  preview. A working bot shows its current step (`:829-832`).
- A bot being deleted shows a spinner and "Deleting the bot and any desktop
  it owns…", and no hover actions (`:822-826`, `:897`).
- A bot that turns unread plays a motion of its avatar for 8,400 ms
  (`src/components/unread-notice.ts:10-26`). There is no sound in the row.

### 5.2 The bot menu

Simple mode, top to bottom (`src/components/SidebarBotRead.test.ts:174`):
"Pin", "Move to department", "Mark as read", "New thread", "View threads",
"Rename", "Publish", "Copy conversation ID", "More", "Archive", "Delete".

- "Move to department" is a flyout: one row for each department (the
  current one has a check and is off), "New department…" and "Remove from
  department" (`src/components/SidebarBotMenu.tsx:310-320`).
- "More" holds "Edit profile", "Pause bot", "Pause every bot", "Make Chief
  of Staff", "Duplicate" and "Delete all conversations…"
  (`src/components/SidebarBotRead.test.ts:233`).

Advanced mode (`src/components/SidebarBotMenu.tsx:417-479`): the thread
items, "Pin", the Chief item, "Move to department" (it opens a separate
picker), "Mark as Unread", "Mark all conversations as read", "Edit Profile",
"Duplicate", the pause items, "Publish", "Copy conversation ID", the move
items and the leave items.

The picker of Advanced mode (`src/components/SidebarSectionPicker.tsx:64-120`):
the heading "Move to department", one row for each department, a field
"New department…" (60 characters) with "Add", and "Move to General" in red
when the bot has a department.

### 5.3 A department heading and its menu

- Simple mode draws a quiet line with the name. The "⋯" button, "Actions
  for {name} department", shows on hover. The chevron shows on hover or
  focus. The whole line is the drag source
  (`src/components/SidebarSectionHeader.tsx:84-139`).
- Advanced mode draws a heading with "Share {name}", "Delete {name}
  department" (a trash icon) and a grip "Drag to reorder" (`:141-207`).
- A collapsed heading shows marks: a dot for waiting, a dot for unread, and
  a green pulse for working only when neither dot shows. A number gives the
  rows that need the person (`:249-292`). Example: "1 waiting for you, 2
  unread, 2 working".
- Alt+Up and Alt+Down move the heading (`:62-71`).
- The menu items, in order (`src/components/SidebarTeamMenu.test.ts:85`):
  "Add bots", "Rename department", "Settings for all bots…", "Pause
  department", "Mark all as read", "Share", a separator, "Delete department"
  in red. "Move up" and "Move down" show only on a phone (`:94`).
- An empty department has an "Add bots" button. With members it says "Add
  or remove bots" (`src/components/Sidebar.tsx:1448-1452`).
- The delete dialog: title "Delete {name} department?", button "Delete
  department". Advanced text: "Bots and group chats move to General with
  their conversations intact. The department and its shared instructions
  are deleted. This cannot be undone." Simple text: "Its bots and group
  chats stay, with their conversations, outside any department. The
  department and its shared instructions are deleted. This cannot be
  undone." (`src/components/Sidebar.tsx:1531-1543`).

### 5.4 The drag

- The dragged row is at 40% opacity. A "group" target gets an accent
  outline. "Before" and "after" draw a 2 px accent line
  (`src/components/SidebarBotDrag.tsx:33-40`).
- A heading that a bot would go into gets an accent outline
  (`src/components/SidebarSectionHeader.tsx:56-57`, `:82`).
- The name field of a new department has the label "New department name"
  (`src/components/SidebarBotDrag.tsx:235`).

### 5.5 Settings

The row "Notification sounds" says: "Play this computer's alert sound when
an agent finishes or needs you. Turn it off to keep the banners but lose
the chime (handy on a call, where the agent is already talking to you)."
Simple mode: "Plays a sound when a bot finishes or needs you."
(`src/components/NotificationSettingsRows.tsx:109`). The switch does not
need the notice permission.

## 6. The tests

| Test file | What it shows |
|---|---|
| `src/components/Sidebar.departments.test.ts` (524) | A drag saves only the bots of the target list. A middle drop opens the name field with "New department", and a blank commit keeps the default name. The first free name. Escape puts the bots back. A drop on a heading or between rows. A drop out of a department. The "Remove from department" slot. Alt+Up/Down and its announcement. Busy and waiting bots keep their place. A member without the admin scope cannot drag, also from a handler of an old render. A drag begun before the role was known drops nothing. Rename in place sends the PATCH. The delete text. Move up and Move down only on a phone. The move flyout. "Archive instead" for a Chief |
| `src/components/Sidebar.bot-reorder.dom.test.ts` (148) | A real render in Simple and Advanced mode: drop below, a working bot keeps its place, Alt+arrow past a working bot, a waiting bot keeps its place, an unread bot keeps its place |
| `src/lib/sidebar-bot-drop.test.ts` (91) | The middle half groups. A drop that changes nothing plans nothing. Unknown ids plan nothing. Only Alt+ArrowUp and Alt+ArrowDown. The first free name. The float cases, which the app does not use now |
| `src/lib/sidebar-layout.test.ts` (473) | Built-in ids do not clash with department names. `section:<name>` round-trips. Lists keep the server order. Collapse is off during a search. The saved section order and the place of an empty section. Simple order. The department order of the workspace. Also `activeBotsFirst` and the Unread list, which the app does not use now |
| `src/components/SidebarSections.test.ts` (72) | The workspace order fills the places of departments. A move saves it. The offer runs one time. A person who may not change it keeps the device order |
| `src/components/bot-sections.test.ts` (names only) | Two quick moves go one after the other. Each save stops after a limit. After no answer or a 5xx, the window shows the order of the server. After a refusal, the order from before |
| `src/components/SidebarSectionHeader.test.ts` (238), `.naming.dom.test.ts` (78) | The two looks. Delete is separate from collapse. The attention marks and the count. Enter then blur commits one time. Escape cancels |
| `src/components/SidebarTeamMenu.test.ts` (110) | "Mark all as read" only while something is unread. It reads bots, then rooms, and closes the menu. A failure shows an error and keeps the menu. The order of the items |
| `src/components/SidebarBotRead.test.ts` (241) | Two quick clicks start one read. Progress. The menu closes after the last read. A failure keeps the done reads, and a retry reads only the rest. A reopened menu is not closed by an old read. The Simple toggle. The item order of the Simple menu |
| `src/lib/bot-read.test.ts` (names only) | Archived and working threads are read too. Reads go in order. A partial failure keeps the done reads. New threads that arrive during a read are not read. Hundreds of threads with no parallel requests. No write when all are read |
| `server/host/person-bot-order.test.ts` (43) | The own order of a person survives a restart. A new bot takes its team place. The frame is rewritten for each person |
| `server/routes/sidebar-sections.test.ts` (30) | Only the mapping of store refusals to error keys |
| `src/lib/notify.test.ts` (277), `src/lib/notification-preferences.test.ts` (226) | Sounds on by default, `silent: true` when off. One banner with the bridge, the page banner when the bridge says no. The switch survives a reload and follows other windows |
| `server/routes/inbox.test.ts` (100) | The Inbox read-all of a Team Cloud, which is idempotent. Not the sidebar |
| `scripts/testing/team-lifecycle-ui.e2e.test.ts` (359, by grep only) | A rename keeps the collapsed list and the section order in browser storage (`:90-106`). The delete confirm: focus, Cancel, Escape, and a confirm that removes the department and its shared instructions (`:178-251`) |
| `src/lib/sidebar-preferences.test.ts` (names only) | The collapsed list and the orders round-trip. Bad storage is ignored. Arrays are capped. Blocked storage is tolerated (`:100-149`) |

No test in the files read covers these:

- the server side of `PUT /api/bots/order` (its checks, its broadcast).
- a failed bot order save and its rollback.
- the collapsed state after a delete, and a collapse past 100 entries.
- a corrupt `bot-orders.json`.
- a drag while another window changes the list, and two writers of one
  order.
- a double click on the department "Mark all as read".
- one notice from two windows.

## 7. Ours compared

Our crates have no part of this feature yet. Our sidebar
(`crates/bot-desktop/ui/src/features/sidebar/Sidebar.tsx`, 385 lines) has a
search field, an Inbox row, one Chief row above a "Bots" group, and a
"Tools" group. The open state of each group is React state. Our `Bot` type
(`crates/bot-desktop/ui/src/features/bots/types.ts`) has `id`, `name`,
`color`, `model`, `isChief`, `lastActive` and `messages`. It has no
department, no position and no unread field.

| Part | The reference | Ours |
|---|---|---|
| The rows and the marks | `src/components/Sidebar.tsx:698-919`, `SidebarRowMarkers.tsx`, `SidebarBotActivity.tsx` | `bot-desktop/ui/features/sidebar`. The marks need the thread state of step 11 and the unread state of P314 |
| The bot order | `server/routes/bot-order.ts`, `server/store.ts:1938-1945`, `src/components/bot-sections.ts:36-45` | `bot-core`: a position column of the bot table in the store of step 8. No step yet (T1) |
| Departments | `server/section-context.ts`, `server/routes/sidebar-sections.ts`, `server/store.ts:656-761`, `:1540-1597` | `bot-core`: a department table with an id (P278), a department id on the bot and the room. No step yet (T1) |
| The department order | `server/section-context.ts:117-124`, `src/components/bot-sections.ts:66-99` | a position column of the department table (T1) |
| Drag and the name field | `src/components/SidebarBotDrag.tsx`, `src/lib/sidebar-bot-drop.ts`, `SidebarSectionHeader.tsx` | `bot-desktop/ui/features/sidebar`. The plan logic of a drop is pure, so it can move to `bot-core` as one function with tests |
| Collapse | `src/lib/sidebar-preferences.ts:15-17`, `SidebarSections.tsx` | `bot-desktop`, a setting of the window (T4) |
| Mark all as read | `src/lib/folder-read.ts`, `SidebarBotMenu.tsx:91-111`, `SidebarTeamMenu.tsx:15-35` | `bot-core`: one read command (T5, T6, P324) |
| Notification sound | `src/lib/notify.ts:53`, `notification-preferences.ts` | `bot-desktop`, the Rust banner of P321 |
| The confirmations | `src/components/Sidebar.tsx:1032-1057`, `:1507-1577` | `bot-desktop`, the Astryx `Dialog` (D16) |
| The per-person order of a Team Cloud | `server/host/person-bot-order.ts` | not planned while P351 keeps one person |

## 8. Where we can be better

### 8.1 Proposals

**T1. Two plan parts for this feature.**

1. With step 11: a position for each bot and each room in the store of
   step 8, the bot rows with their marks, the drag and Alt+Up/Down, and the
   confirmations in `bot-desktop`.
2. With step 14, after P278 and P279: the department table (an id, a name,
   a position), the department of a bot and a room, the name field, the
   department menu and the department "mark all as read". The unread marks
   also need the step of P314.

- Gap. The feature is in the group "later" and has no step.
- Why: the order and the department are work state, so they belong to the
  store, not to the window. Departments need the id of P278 and the Chief
  rule of P279, which are in step 14.
- Source: `server/store.ts:1938-1950`; `server/section-context.ts:14-29`.

**T2. A move to a department and a new position are one command and one
transaction.**

- Problem in the reference: a drag across lists sends two writes. The
  department goes through the patch queue of the bot, which waits up to
  400 ms in memory. The order goes in a separate `PUT /api/bots/order`. One
  can fail while the other succeeds, and a crash in the 400 ms loses the
  department (`src/components/SidebarBotDrag.tsx:84-85`;
  `src/components/bot-sections.ts:25-45`; `src/state/bot-patch-queue.ts:160`).
  The release problems: "The same work done two times, or lost" and "State
  lost at a restart or a crash". The reference fixed the same problem for
  threads: "Thread changes are saved before they're shown" (v0.1.115).
- Why: the `AGENTS.md` rule "the row and its event in one transaction". A
  drag gives one event with the department and the position. The 400 ms
  wait is already in P682. This proposal adds the two writes of one drag,
  as new facts for P682.
- Source: as above.

**T3. Each order change carries the revision that the window saw, and the
window has one queue for each order.**

- Problem in the reference: the saves of the bot order have no queue and no
  check for a newer move. The rollback of a failed first move can undo a
  second move on screen while the server keeps the second move
  (`src/components/bot-sections.ts:36-45`). The server has no version
  check, so the last write wins (`server/routes/bot-order.ts:35`). The
  reference fixed this for rooms (`src/components/SidebarRoomDrag.tsx:13-41`)
  and, after v0.1.184, for departments (`ececd019d`, `4eb7a30da`,
  `ff18c38eb`), but not for bots. The release problem: "Busy and races
  between bots". The reference fixed it for rooms in v0.1.155
  ("Room order: save one at a time, never restore an old order",
  `0e4a0ccbe`) and for departments in commits after v0.1.184. The bot order
  never got the same fix.
- Why: one rule for the three orders. A stale move gets a typed refusal,
  and the window shows the order of the store.
- Source: `src/components/bot-sections.ts:36-99`;
  `src/components/SidebarRoomDrag.tsx:13-41`.

**T4. The collapsed state is keyed by the department id, and a failed read
of the window settings never leads to a write.**

- Problem in the reference: the collapsed list and the section orders are
  keyed by the name, `section:<name>`. Bad JSON makes a list empty, and the
  next click writes over it. A list keeps 100 items, so the 101st collapse
  is not saved. A deleted department keeps its entries, so a new department
  with the same name comes back collapsed. Two windows write over each
  other (`src/lib/sidebar-preferences.ts:383-437`;
  `src/components/SidebarSections.tsx:45-47`, `:82-95`). The return of a
  collapsed department and the lost 101st entry come from the code. No
  test runs them. The release problem: "A file written over after a failed
  read" (v0.1.103, v0.1.107, v0.1.151).
- Why: with an id, a rename changes nothing in the window settings, and a
  delete removes the entry. This adds new facts to P278 and P76.
- Source: as above.

**T5. One read command for a bot, a department or a folder.** It reads all
the threads of the scope in one transaction and gives one event.

- Problem in the reference: the window sends one request for each thread,
  in three copies of the loop with three separate guards
  (`src/components/SidebarBotMenu.tsx:91-111`;
  `src/components/SidebarTeamMenu.tsx:15-35`;
  `src/components/bot-panel/bot-actions.ts:33-47`). A bot read and its
  department read can post the same thread two times. Two hundred unread
  threads are two hundred requests.
- The release problem: none that the reference shows. The server read is
  idempotent, and the reference keeps the done reads by design. This is a
  judgment call. The author can keep the reference.
- Why: less code, and the scope is a typed value (bot, department, folder).
  This adds new facts to P324.
- Source: `src/lib/folder-read.ts:9-77`.

**T6. A read takes the last message that the person saw.** The store marks
read up to that message, not up to the newest one.

- Problem in the reference: the window drops the time it saw
  (`src/state/read-visible.ts:10-13`). The server marks read up to the
  newest message at the time of the request (`server/index.ts:4039-4042`).
  A reply that arrives between the view and the request is marked read and
  the person never sees its dot. The release problem: "The same work done
  two times, or lost". No release note names this case, so it is a
  judgment call inside that problem.
- Why: the person loses no new message. P324 has the dropped errors of a
  read. This proposal adds the race, as new facts for P324.
- Source: as above.

**T7. Port the end state of the reversals, not their left-over code.**

- Problem in the reference: v0.1.182 (`b8cf45d55`) turned off two
  behaviours: busy bots first, and the Unread list. The code and its tests
  stay:
  `activeBotsFirst`, `unreadBotsApart`, `withUnreadSection`, `nextUnreadHold`,
  `useUnreadHold` (no caller), and the float logic of `savedPlacement`
  (`src/components/Sidebar.tsx:1097-1099`;
  `src/lib/sidebar-layout.ts:147-230`; `src/lib/sidebar-bot-drop.ts:57-71`;
  `src/components/unread-notice.ts:40`). The hook `useBotActions` has no
  caller (`src/components/bot-panel/bot-actions.ts:14`). The release
  problem: "A feature added, then removed or reversed" (v0.1.125 to
  v0.1.128 for departments, v0.1.182 for the rows).
- Why: rows that keep their place are the end state. We build only that.
- Source: as above.

**T8. One name in code, wire and text: `department`.**

- Problem in the reference: one thing has three names. The data and the
  routes say `section` (`/api/sidebar-sections`), components say `team`
  (`TeamMenuItems`, `team.*` keys), i18n keys say `Context`, and the text
  says "department" (`src/components/SidebarSectionPicker.tsx:65`, `:97`,
  `:117`; `src/components/SidebarTeamMenu.tsx:60`). A test still uses the
  old text "A team with that name already exists"
  (`server/routes/sidebar-sections.test.ts:28`). The two delete texts say
  two things: "move to General" and "outside any department"
  (`src/components/Sidebar.tsx:1532`). The release problem: "A feature
  added, then removed or reversed" (v0.1.125, v0.1.128).
- Why: a reader and the compiler see one concept.
- Source: as above.

**T9. Follow the reference for the UI of rows, menus, drag and
confirmations.** These parts follow the reference:

- the drop zones: a quarter above and below, and the middle half groups.
- the name field in place, with the first free name.
- Alt+Up/Down, with its announcement.
- the menu items and their order.
- Cancel focused first, and the archive check at confirm time.

- Follows the reference.
- Why: these are the end state after several fixes, and tests show them.
- Source: sections 3.4 to 3.6, 3.11, 5.2 to 5.4.

### 8.2 The problems of `changelog.md` section 5 that the reference has here

| Problem | Here | Lines |
|---|---|---|
| A feature added, then removed or reversed | Yes. Sections with shared instructions (v0.1.46) became departments (v0.1.125). Reach by section ended in v0.1.128 ("folders, not walls"), and the per-bot peers list in v0.1.152. Busy-first rows and the Unread list ended in v0.1.182, but their code stays. The department order moved from each device to the server after v0.1.184, with a one-time offer of the old order | `src/components/Sidebar.tsx:1095-1099`; `src/lib/sidebar-layout.ts:147-230`; `src/components/SidebarSections.tsx:56-64`; `server/section-context.ts:117-124` |
| The same work done two times, or lost | Yes. Two writes for one drag. A read marks a reply that the person did not see. Two windows each show a notice and play the sound. A department delete emits a `bot` event for every bot, and the window also applies the HTTP answer | `src/components/SidebarBotDrag.tsx:84-85`; `server/index.ts:4039-4042`; `src/state/store.tsx:3083`; `server/store.ts:757` |
| State lost at a restart or a crash | Partly. The bot order changes memory before the save. The department of a dragged bot waits up to 400 ms. A collapse past 100 entries is not saved. The grant of a new department waits in memory (P278) | `server/store.ts:1941-1942`; `src/state/bot-patch-queue.ts:160`; `src/lib/sidebar-preferences.ts:415`, `:436` |
| A file written over after a failed read | Yes. The local lists of the window. `bot-orders.json` on a Team Cloud. `bots.json` and `groups.json` (P76). `section-contexts.json` is guarded: a write refuses | `src/lib/sidebar-preferences.ts:385-394`; `server/host/person-bot-order.ts:16-31`; `server/section-context.ts:74-77` |
| "Busy" and races between bots | Yes. The bot order has no queue and an unsafe rollback. No order has a version. The local lists have no listener for other windows. A drag uses the lists of the last render. A rename and a delete are refused while a member is busy | `src/components/bot-sections.ts:36-45`; `src/lib/sidebar-preferences.ts:424-459`; `server/store.ts:674-679`, `:735-737` |

## 9. Not verified

- `GET /api/sidebar-sections` returns all departments with no visibility
  filter in the route (`server/routes/sidebar-sections.ts:42-44`). The
  privacy test of a Team Cloud lists this route
  (`server/cloud-team-privacy-holes.e2e.test.ts:217`), so another layer may
  filter it. This was not traced.
- What happens when `saveBots` throws inside `reorderBots`: whether a
  handler turns it into a 500.
- Whether two bot order requests of one window can reach the server out of
  order.
- Whether the bridge of the desktop can fail after it showed a notice. Then
  the page would show a second one (`src/lib/notify.ts:65`).
- Whether a browser plays the sound again when a notice with the same tag
  replaces an older one. No `renotify` is set (`src/lib/notify.ts:49-54`).
- Which document is right about a face on a bot row:
  `apps/docs/content/docs/features/chat-and-teams.mdx:75` (a face shows) or
  `docs/team-cloud.md:694-695` (no face).
- `apps/docs/content/docs/features/chat-and-teams.mdx:55` still names a
  per-bot list and "Let it talk to every bot". The code removed that list
  in v0.1.152 (`server/store.ts:422-427`). The page was not checked for a
  newer edit.
- The check of `docs/verification/sidebar.md` seeds twelve unread threads
  (`:30`) and reports 14 (`:53`). The file does not explain this.
- The tests of `src/components/bot-sections.test.ts`,
  `src/lib/bot-read.test.ts` and `src/lib/sidebar-preferences.test.ts` were
  read by their names only, and the e2e test of the team lifecycle by grep
  only.
- The one list of two places (`src/lib/one-list.ts`,
  `src/components/one-list-sidebar.ts`) was read for its effect on
  departments only. The places rail belongs to the feature
  "look-and-design".
