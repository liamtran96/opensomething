# Mentions: how a person or a bot names a bot with @

The feature is the row "Mentions: a picker in the composer, colours for each
bot, `@everyone` in a room" of
[`../reference-features.md`](../reference-features.md) (part 23, group 3). It
is for step 14 of [`../../plan/README.md`](../../plan/README.md). The port
goes to `bot-desktop` (the picker, the chips and the colours), `bot-core` (the
parse, who answers, the queue) and `bot-protocol` (the picks on a send).

The reference project is the local clone next to this repository, at commit
`96ff84455`. Its `HEAD` was `96ff84455` during this work, so each file was
read directly. Nobody opened its `enterprise/` directory. The product name is
replaced by `<product>` in strings and keys.

Paths: a path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours, and so are `AGENTS.md`
and `NOTICE`. Every other path is in the reference project, relative to its
root. This includes `docs/verification/`, `docs/plans/` and `docs/specs/`.

What this file adds to the earlier research:

- [`bot-coordination.md`](bot-coordination.md) has rooms, the room post, the
  order of responders (its section 3.3), holds (3.6), the roster (3.18) and
  the send in a room (5.2). This file does not repeat them. It adds:
  - The exact grammar of a mention and of `@everyone` (section 3.2).
  - Bots with the same name, and the two refusal texts (3.3).
  - Person tags, `@you` and `@devs` (3.4).
  - The picker and the picks, from the click to the server (3.5, 3.6).
  - The rule that picks travel in the queue and are merged (3.11).
  - The repeat rule and the end of a chain of bot mentions (3.9).
  - A mention in a one-to-one chat (3.12) and in `post_to_room` (3.13).
  - The chips, the colours and the hints on the screen (section 5).
- **A correction to `bot-coordination.md` section 3.3, step 7.4.** That
  step says "a quoted reply (`replyToId`) to a bot's message goes to that
  bot". This is true only in a room whose responder is `auto`. The server
  sets `replyBot` only when `group.defaultResponder.kind === "auto"`
  (`server/index.ts:10616`), and `autoRoomDefault` passes every other kind
  through with no change (`server/room-routing-members.ts:17-25`). In a room
  with a lead, `everyone` or `mentions`, a quote does not choose the
  responder. The test of the quote rule uses an Auto room
  (`server/room-quoted-replies.e2e.test.ts:37-44`, `:100-107`).
- [`chat-ui.md`](chat-ui.md) has the composer and the edit of a queued
  message. It says that an edit loses the mentions. This file adds all the
  other mention parts of the composer and the chat.
- [`queue-and-steer.md`](queue-and-steer.md) has the queue and the
  coalesce rule. This file adds what the queue does with the picks: they
  are kept in the durable row, and the merge joins them (section 3.11).

## 1. In short

When a person types `@` in the message box, a list of bots opens. The person
picks a bot, and the box gets `@Name ` with a space. The words go to the
server with the id of the picked bot. In a room (a chat with several bots),
the server reads the `@Name` tags and the ids, and starts a turn for each bot
that the line names. A line that names nobody goes to the room's default
responder. `@everyone` in a room wakes every member. A bot can name another
bot in its reply, and that bot answers next, for at most three hops. On the
screen, each `@Name` is drawn as a chip in the colour of its bot.

The reference project keeps the words as plain text. It does not store which
bot a tag meant. It reads the text again each time: on the server to choose
who answers, and in the window to draw the chips.

Terms used in this file:

- **Mention** or **tag**: `@` followed by a name, at the start of a word.
- **Boundary**: the character before `@` that lets a tag start there: the
  start of the text, a space, or an opening mark such as `(` or `**`.
- **Continuation**: a letter, a number, a combining mark or `_` right after
  a name. It makes the tag a part of a longer word, so it is not a tag.
- **Pick**: the id of a bot that the person chose from the @ list. The
  composer keeps it apart from the text and sends it in the field
  `mentions`.
- **Ambiguous name**: a name that two or more bots of the room share, with no
  pick for it.
- **Responder**: a bot that the server starts a turn for, in answer to one
  line.
- **Default responder**: who answers a room line that names no bot. It is
  one of four kinds: a lead bot (`member`), every member (`everyone`), only
  the named bots (`mentions`), or a small model that chooses (`auto`).
- **Decision model** (decider): the small model of the `auto` kind.
- **Hop**: one step in a chain of bot mentions. The person's line is hop 0.
  A bot that a bot reply names runs at hop 1, and so on.
- **Round**: all the turns that one person's line starts in a room.
- **Hold**: a room member that the person stopped. It gets no turn until a
  mention or "resume" brings it back.
- **Person tag**: a tag that names a human: `@you`, the owner's profile
  name, or a teammate on a shared workspace (Team Cloud).
- **Chip**: the coloured span that the window draws over a tag.

## 2. Files read completely

Five readers read the files, one for each group. Each wrote its report to
`.research/` in this worktree.

### 2.1 Read completely

| Group | File | Lines |
|---|---|---|
| Parse | `packages/phone-protocol/src/mention-boundary.ts` | 16 |
| Parse | `shared/mention-boundary.ts` (only re-exports the file above) | 1 |
| Parse | `shared/room-mentions.ts`, `shared/room-mentions.test.ts` | 47, 74 |
| Parse | `shared/person-mention.ts`, `shared/person-mention.test.ts` | 146, 111 |
| Parse | `shared/devs-mention.ts`, `shared/devs-mention.test.ts` | 52, 42 |
| Parse | `src/lib/mentions.ts`, `src/lib/mentions.test.ts` | 126, 145 |
| Parse | `src/lib/mention-picks.ts` | 36 |
| Parse | `src/state/send-mentions.test.ts` | 84 |
| Parse | `src/state/team-people.ts` | 197 |
| Parse | `src/testing/mentions.tsx` | 33 |
| Parse | `server/decider/auto-room-compat.test.ts` | 145 |
| Intake | `server/same-name-mentions.ts`, `.test.ts`, `.e2e.test.ts` | 86, 90, 208 |
| Intake | `server/host/bot-name-clash.ts`, `.test.ts` | 47, 56 |
| Intake | `server/host/transcript-mentions.ts`, `.test.ts` (not about @; see 2.4) | 69, 56 |
| Intake | `server/routes/channels.ts` | 720 |
| Intake | `server/room-steer-addressee.ts`, `.test.ts` | 19, 35 |
| Intake | `server/room-pointed.ts`, `.test.ts` | 61, 39 |
| Intake | `server/channel-queue.ts` | 225 |
| Intake | `server/steer-queue.ts` | 325 |
| Intake | `server/host/bot-access-gate.ts` | 136 |
| Routing | `server/decider/room-routing.ts`, `.test.ts` | 104, 114 |
| Routing | `server/host/room-routing-input.ts` | 39 |
| Routing | `server/room-round-turns.ts`, `.test.ts` | 57, 60 |
| Routing | `server/room-routing-members.ts`, `.test.ts` | 25, 24 |
| Routing | `server/room-holds.ts`, `.test.ts` | 168, 140 |
| Routing | `server/notify.ts` | 114 |
| Routing | `server/chief-of-staff.ts` | 107 |
| Routing | `server/routes/stop-line.ts`, `.test.ts` | 20, 47 |
| Routing | `server/routes/groups.ts` | 97 |
| UI | `src/components/MentionMenu.tsx`, `MentionText.tsx`, `MentionTextarea.tsx` | 83, 15, 59 |
| UI | `src/components/Composer.mentions.test.ts`, `MentionColors.test.ts`, `MentionText.test.ts`, `MentionTextarea.test.ts`, `MentionTextarea.dom.test.ts` | 122, 25, 30, 15, 52 |
| UI | `src/components/Composer.ime.test.ts` | 121 |
| UI | `src/components/MapComposer.tsx`, `src/lib/map-composer.ts`, `.test.ts` | 146, 86, 92 |
| UI | `src/lib/group-routing.ts`, `.test.ts` | 118, 153 |
| UI | `src/lib/room-addressees.ts`, `.test.ts` | 35, 41 |
| UI | `src/lib/room-responder.ts` | 38 |
| UI | `src/lib/group-call.ts`, `.test.ts` | 41, 49 |
| UI | `src/lib/user-bubble-tone.ts`, `.test.ts` | 235, 99 |
| UI | `src/components/ChatRows.tsx`, `room-panel/ResponderPage.tsx`, `bot-access/RoomComposer.tsx` | 51, 76, 12 |
| Documents | `docs/verification/mentions.md` | 196 |
| Documents | `scripts/verify-mentions.ts` | 38 |
| Documents | `docs/verification/evidence/mentions/*.json`: 13 files, not 10 | 1,735 |
| Documents | `docs/verification/room-coordination.md` | 506 |
| Documents | `server/room-coordination.e2e.test.ts` | 508 |

### 2.2 Read in ranges

| File | Ranges |
|---|---|
| `server/index.ts` (15,258) | 1604, 3844, 4076-4370, 6740-6830, 7000-7250, 7400-7460, 8120-8340, 9380-9612, 9640-9650, 9698-9712, 9782-9795, 9930-9988, 10168-10175, 10225-10242, 10350-10470, 10560-10880, 13740-13860 |
| `server/store.ts` (2,256) | 160-275, 430-442, 785-830, 850-860, 1263-1300, 1432-1442, 1519-1537 |
| `server/routes/bot-messages.ts` (875) | 1-60, 190-470 |
| `src/components/Composer.tsx` (983) | 38-92 (imports), 175-210, 240-245, 285-310, 335-400, 540-630, 718-730, 805-885, 911 |
| `src/components/ChatMarkdown.tsx` (989) | 484-492, 815-845, 888-989 |
| `src/components/GroupView.tsx` (989) | 112-125, 300-312, 330-390, 455-500, 700-710, 815-840, 880-900, 960-975 |
| `src/components/RoomHeader.tsx` (287) | 1-80, 265 |
| `src/components/RoomTextMessage.tsx` (245) | 85-100, 112, 180-192, 222-230 |
| `src/components/ThreadRefs.tsx` (143) | 1-8, 120-143 |
| `src/components/GroupCallView.tsx` | 295-320 |
| `src/state/store.tsx` (3,260) | 625-680, 2325-2350, 2550-2600 |
| `src/state/optimistic-send.ts` | 20-60 |
| `src/styles.css` | 15-80, 3720-3740 |
| `server/send-idempotency.ts` | 1-77 |
| `server/peer-roster.ts` (443) | 242-290, 380-443 |
| `server/system-prompt.ts` (341), `.test.ts` | 30-70, 315-341; test 335-345 |
| `server/room-roots.e2e.test.ts` (667) | 40-177, 546-626 |
| `server/room-quoted-replies.e2e.test.ts` (301) | 1-191, 255-286 |
| `server/decider-rooms.e2e.test.ts` (471) | 160-188, 216-290 |
| `server/room-queue.e2e.test.ts` (210) | 69-95 |
| `server/room-holds.e2e.test.ts` | 15, 223-244 |
| `server/comms.test.ts` (1,117) | 1-100 |
| `server/notify.test.ts` (196), `server/chief-of-staff.test.ts` (188) | 1-70; 170-188 |
| `packages/phone-protocol/src/wire.ts` | 65-90, 270-292, 340-347, 790-815, 885-925 |
| `docs/team-cloud.md` (1,136) | 22-30, 732-748, 913-1075 |
| `docs/decision-model.md` (358) | 110-140, 275-300 |
| `docs/plans/2026-09-09-thread-aware-bots.md` (171) | 30-45, 125-140 |
| Single lines or short ranges | `server/admission.ts:20-40`, `server/direct-send.ts:15-30`, `server/message-db.ts:205-225`, `server/server-lines.ts:22-25`, `server/bot-visibility.ts:375-387`, `server/contracts.ts:175-182`, `server/names.ts:1-30`, `server/bot-profile.ts:42-47`, `shared/skill-command.ts:70-82`, `src/lib/mascot.ts:45-80`, `src/lib/default-bot.ts:39-41`, `src/components/composer-simple.ts:60-80`, `packages/phone-protocol/src/bot-access.ts:1-30`, `server/runtime-coordinator.ts:100-102, 380`, the keys of `src/locales/en.json` that the code uses |

### 2.3 Claims that the lead checked against the code

The lead read these lines at `96ff84455`. Each claim holds.

| Claim | Lines | Result |
|---|---|---|
| The boundary set and the continuation rule | `packages/phone-protocol/src/mention-boundary.ts:4-16` | Holds |
| The longest name wins, the match ignores case, a hidden bot never matches, a pick only chooses among bots of a tagged name | `shared/room-mentions.ts:23-36` | Holds |
| At most 20 picks, each `^[\w-]{1,128}$`, one bad entry refuses the whole list | `shared/room-mentions.ts:4`, `:42-47` | Holds |
| `@everyone` is checked first and returns every member that is not hidden. An ambiguous name reaches nobody. A hidden lead gives no responder | `server/store.ts:217-248` | Holds |
| The 400 text for bad picks. A program on this machine gets the same-name text with ids. The refusal comes before the queue | `server/routes/channels.ts:396-397`, `:473-477`, `:481-496` | Holds |
| The idempotency fingerprint has no mentions | `server/send-idempotency.ts:68-70` | Holds |
| The merge identity has no mentions. The drained turn joins the texts, takes the sender of the first item and joins all picks | `server/channel-queue.ts:214-219`, `server/index.ts:10853-10861` | Holds |
| At most 3 hops. Mentions are followed only from a root turn that handed out no work. The repeat rule | `server/index.ts:9409`, `:10356-10412` | Holds |
| The hop brief copies the newest bot text of the thread | `server/index.ts:9454-9460`, `:9790` | Holds |
| A busy bot at the last check is skipped with a line, not queued | `server/index.ts:9544-9559` | Holds |
| The one-to-one "named teammates" part comes from stored records and only from reachable bots | `server/index.ts:8136-8148`, `:8285` | Holds |
| `mentionPrompt` is called only by its test | `server/system-prompt.ts:336`, `git grep` | Holds |
| The access gate does not read `mentions` | `server/host/bot-access-gate.ts:65-87` | Holds |
| The room @ list does not filter hidden members. The one-to-one list does | `src/components/Composer.tsx:345-356` | Holds |
| 12 colour names, not 10 | `packages/phone-protocol/src/wire.ts:71-74` | Holds |
| Holds read `@all` as well as `@everyone`. The file credits a design under the MIT license | `server/room-holds.ts:1-4`, `:71-84` | Holds |
| The map composer reaches only the first of two bots with the same name | `src/lib/map-composer.ts:44-47` | Holds |
| A room with a view-only member shows no composer | `src/components/bot-access/RoomComposer.tsx:6-11` | Holds |
| A quote chooses the responder only in an Auto room | `server/index.ts:10616`, `:10685`, `server/room-routing-members.ts:17-25` | Holds. It corrects `bot-coordination.md` |

### 2.4 Notes on the file list

- `server/host/transcript-mentions.ts` is not about @ tags. It finds the
  conversations whose stored text has a word, before a folder clean-up
  (`server/host/transcript-mentions.ts:1-3`).
- The evidence folder has 13 JSON files. Each `*-wait.json` repeats the
  messages of its `*-messages.json` and adds the wait status.
- `server/same-name-mentions.e2e.test.ts` and
  `server/room-coordination.e2e.test.ts` were read whole by two groups.
  The table lists each file one time.

## 3. How it works

### 3.1 The parts and who owns what

| Part | Owner in the reference | What it does |
|---|---|---|
| Grammar | `packages/phone-protocol/src/mention-boundary.ts` | Where a tag can start and where a name ends. The phone app, the window and the server use this one file (`:1`) |
| Bot parse | `shared/room-mentions.ts` | Text, bots and picks give the bots that the line reaches, and the ambiguous names |
| Person parse | `shared/person-mention.ts`, `shared/devs-mention.ts` | `@you`, the profile name, teammates, and the bug-report tag `@devs` |
| Who answers | `server/store.ts:217-248` (`roomResponders`) and `server/index.ts:10560-10830` (`startGroupTurn`) | The responders of one room line |
| Intake | `server/routes/channels.ts:374-503`, `server/routes/bot-messages.ts:199-374` | Checks the picks, refuses a shared name, queues or starts |
| Same name | `server/same-name-mentions.ts` | The refusal texts and the notes to bots |
| Queue | `server/channel-queue.ts`, `server/steer-queue.ts` | Keeps the picks of a queued line |
| Hops | `server/index.ts:10356-10412` | Follows the mentions in a bot's reply |
| Holds | `server/room-holds.ts` | "stop @Bot" holds a member, a mention releases it |
| Picker and chips | `src/components/Composer.tsx`, `MentionMenu.tsx`, `MentionTextarea.tsx`, `MentionText.tsx`, `src/lib/mentions.ts`, `src/lib/mention-picks.ts` | The @ list, the picks in memory, the chips |
| Prediction in the window | `src/lib/group-routing.ts:56-83` | The window's copy of the room rule. It is used only for the image check |

### 3.2 The grammar of a tag (`packages/phone-protocol/src/mention-boundary.ts`, `shared/room-mentions.ts`)

1. **The start.** `@` at offset 0 is a tag start. Else the one UTF-16 unit
   before `@` must be whitespace (`/\s/u`) or one of these opening marks:
   `( * _ ~ [ { < ' "`, the curly quotes `‘ “`, the CJK brackets `〈 《 「 『 【`
   and the full-width `（` (`mention-boundary.ts:4-11`). So `me@Bot.dev` (an
   email) and `/@Bot` (a URL path) are not tags. A closing mark, `-`, `.` or
   `:` before `@` is not a boundary.
2. **The candidates.** Only bots that are not hidden (archived) and have a
   name that is not blank (`room-mentions.ts:24`).
3. **The order.** The longest name first, by UTF-16 length
   (`room-mentions.ts:25`). So "Quill Jr" wins over "Quill".
4. **The match.** The slice of the raw text after `@`, with the length of
   the name, is compared with the name in lower case (`toLowerCase`, not the
   locale form) (`room-mentions.ts:30`). A name can have spaces. The code
   builds no regular expression from a name, so `A+B` and `<img>` match as
   text (`src/lib/mentions.test.ts:60-63`).
5. **The end.** The match is refused when the next code point is a Unicode
   letter, number, mark or `_` (`mention-boundary.ts:14-16`). So `@Quillo`
   and `@Quill2` are not "Quill". `@Quill-bot`, `@Quill's`, `@Quill.` and
   `@Quill。` are "Quill". This is inferred from the rule. The tests cover `!`,
   `、`, `。` and emoji (`src/lib/mentions.test.ts:52-59`).
6. **The scan** goes from each `@` to the next `@`. A line can name many
   bots. Each bot is in the result one time, in the order of the line
   (`room-mentions.ts:28`, `:36`).
7. **Code is not masked in routing.** `resolveMentions` and
   `roomResponders` read the raw text. A tag in a code block at a boundary
   still routes (`shared/room-mentions.ts:28-31` and `server/store.ts:224-235`
   read the raw text). The person parse and
   `@devs` mask fences and code spans (`shared/person-mention.ts:68-87`). The
   picker also treats an indented line as code (`shared/skill-command.ts:70-82`).
8. **Two lower-case functions.** The `@everyone` check uses
   `toLocaleLowerCase` (`server/store.ts:229`). The bot match uses
   `toLowerCase` (`room-mentions.ts:30`).

`@everyone` has its own check in each place that reads it. The rule is the
same: a boundary before `@`, the 8 letters "everyone" in any case, and no
continuation after them (`server/store.ts:224-234`,
`src/lib/group-routing.ts:65-75`, `src/lib/mentions.ts:71-72`).
`@everyone調査`, `user@everyone` and `/@everyone` are not `@everyone`
(`server/comms.test.ts:64-98`).

### 3.3 Bots with the same name

Two bots can have the same name. Names that differ only in case are the same
name (`room-mentions.ts:33`). Nothing makes a bot name unique (section 3.17).

1. **The parse** (`room-mentions.ts:33-36`):
   - One bot of the name: it is reached, with or without a pick.
   - Several bots, and the picks include one or more of them: only the
     picked bots are reached.
   - Several bots, and no pick: the name goes into `ambiguous`, and every
     bot of the name goes into `bots`. The caller decides.
   - A pick never adds a bot whose name the line does not tag
     (`room-mentions.ts:16-17`). So a forged pick can only choose among bots
     that the line already names.
2. **A person's room line** with an ambiguous name is refused with 409
   before it is queued or stored (`server/routes/channels.ts:473-477`;
   `server/same-name-mentions.e2e.test.ts:98-120`). Two texts:
   - A person in the window gets a translated line with no ids:
     `Two bots here are named "{name}": {first} and {second}. Pick the one you mean from the @ list.`
     or `{count} bots here are named "{name}": {choices}. Pick the one you mean from the @ list.`
     (`src/locales/en.json:410-414`). Each choice is the name (at most 80
     characters) and the title (at most 120), or "Chief of Staff" for an
     untitled Chief (`server/same-name-mentions.ts:18-20`). German, Italian,
     Brazilian Portuguese and two Chinese packs have the keys. Other
     languages get English (`server/server-lines.ts:23`).
   - A program on this machine (loopback, no browser origin) gets English
     text with each id: `{n} bots in the room "{room}" are named "{name}", so nothing was sent: {choices}. Send it again with the id of the one you mean in mentions.`
     (`server/same-name-mentions.ts:30-41`). The list shows at most 12 bots,
     then "and N more" (`server/peer-roster.ts:242-250`).
   - Only the first ambiguous name of the line is reported
     (`server/same-name-mentions.ts:15`).
3. **A bot's reply** that tags a shared name wakes none of them. The room
   gets the line `More than one bot here is named "{name}", so that mention reached none of them.`
   (`server/same-name-mentions.ts:59-71`; `server/same-name-mentions.e2e.test.ts:174-187`).
4. **Every room turn** gets a note when members share a name:
   `Some members here share a name, so an @mention of that name reaches none of them: "Quill" is <choices>.`
   With the coordination tools it adds `To bring one in, use coordinate_bots with its id.`
   (`server/same-name-mentions.ts:75-86`).
5. **A one-to-one chat never refuses** a shared name. With no pick, every
   bot of the name is in the "named teammates" part. A pick narrows it to
   one (`server/same-name-mentions.e2e.test.ts:135-154`).
6. **`roomResponders` drops an ambiguous name** with no message
   (`server/store.ts:235-236`). For a person's line the refusal came
   before. For a bot's reply the line in step 3 tells the person.

### 3.4 Person tags, `@you` and `@devs`

1. **`@you`** always names the owner of the application
   (`shared/person-mention.ts:3`). The owner's profile name also works,
   cleaned of `@` and extra spaces (`:7-11`).
2. **Teammates** on a shared workspace are tagged by the whole name, and by
   the first name when no other teammate has it (`:109-125`). Names equal to
   "you", "everyone" or "all" never become person tags (`:5`).
3. **A person wins a tie with a bot.** "@Bob" is the teammate Bob. Only a
   strictly longer bot name ("@Bob Bot") reaches the bot (`:18-24`). The
   one-to-one turn removes person tags before it reads bot tags
   (`server/index.ts:8144-8148`). The bot of the shared name is not told
   (`docs/team-cloud.md:1010-1011`).
4. **A bot named like a person** is not refused. Its own chat gets one
   notice: `{person} is also a person here, so "@{name}" reaches {person}, not this bot. Rename the bot to keep them apart.`
   The Chief's `create_bot` result gets the same warning
   (`server/host/bot-name-clash.ts:1-3`, `:31-44`; `src/locales/en.json:543`).
   A hidden bot gets no notice (`server/host/bot-name-clash.ts:42`).
5. **`@devs`** is a tag for a bug report to the vendor's team. It is the last
   row of each @ list (`src/components/MentionMenu.tsx:18-19`). A bot whose
   name starts the same way, with 4 or more characters, takes the tag
   (`shared/devs-mention.ts:18-24`). A CJK character right after "devs" ends
   the tag (`:10-16`). It is outside the scope of our plan.

### 3.5 The picker and the picks in the composer

1. **Open.** `mentionQueryAt(text, caret)` takes the last `@` before the
   caret. The list stays closed when that `@` is not at a boundary, is in
   code, or the query has more than 24 characters, another `@` or a new line
   (`src/lib/mentions.ts:17-25`; `src/lib/mentions.test.ts:27-31`).
2. **The rows** (`src/components/Composer.tsx:345-356`):
   - In a room: `everyone` first, but not in a bot-to-bot channel. Then each
     member in room order. Hidden members are not removed (`:350`).
   - In a one-to-one chat: every other bot that is not hidden and not hidden
     from the sidebar (`:353`).
   - Then the teammates (people), then `@devs`.
3. **Filter.** A substring of the name, in any case, in the order of the
   rows. There is no ranking and no row limit. The list scrolls
   (`src/lib/mentions.ts:27-31`; `src/components/MentionMenu.tsx:43`). The
   list closes when the query ends with a space and equals a name.
4. **Keys** (`Composer.tsx:832-872`). During IME composition no key acts
   (`:832-833`). The arrow keys move and wrap. Enter or Tab picks. Escape
   closes the list until the text changes (`:826`, `:869`).
5. **Pick** (`Composer.tsx:386-397`). The text from `@` to the caret
   becomes `@Name ` with a space. The caret goes after the space. Only a bot
   row is kept as a pick: `everyone`, a person and `@devs` store no id
   (`src/lib/mention-picks.ts:12-13`).
6. **Where the picks live.** In two maps in the memory of the page, by draft
   (`src/lib/mention-picks.ts:5-6`). They are not saved with the draft. A
   reload loses them (inferred from the code).
7. **Send** (`Composer.tsx:581`, `:596`, `:600-619`). `picks.ids(body)`
   keeps the picks whose names the final text still tags, at most 20
   (`src/lib/mention-picks.ts:18-22`). The store posts them as `mentions`.
   An empty list is left out of the body (`src/state/store.tsx:2341`,
   `:2586`).
8. **After the send** the picks are cleared (`Composer.tsx:623`). A failed
   send gives back the words, the same `sendId` and the picks
   (`Composer.tsx:200-204`, `:589`; `src/lib/mention-picks.ts:29-36`).
9. **The body has no sender field.** The server takes the sender from the
   session (`src/state/store.tsx:2580-2587`).

### 3.6 A person's line in a room: the intake (`server/routes/channels.ts:374-503`)

`bot-coordination.md` section 3.3 has the order of the checks. These are the
mention parts:

1. `parseMentionPicks(body.mentions)`. Not a list, more than 20, or one id
   that is not `^[\w-]{1,128}$`: 400 "mentions must be a list of up to 20 bot ids"
   (`:396-397`). The ids are not checked against the room or against access.
2. **The source.** A loopback call with no browser origin, on a server that
   the desktop does not manage, is stamped `via: "api"` and logged
   (`:419-426`). The sender and the trigger come from the auth, never from
   the body (`:489-490`, `:497`).
3. **Idempotency.** The key is `group:<room>:<thread>:<sendId>`. The
   fingerprint is the text, the reply target and the mode, not the picks
   (`server/send-idempotency.ts:68-70`). A resend with the same `sendId` and
   text but other picks returns the first receipt and is not an error.
   With no `sendId` there is no dedupe (`server/send-idempotency.ts:47`).
4. **The same-name refusal**, 409, before the queue (`server/routes/channels.ts:473-477`, section 3.3).
   The check for the program text keys on `loopback` and no browser origin,
   but not on the desktop flag. So on a desktop-managed server a program gets
   the text with ids, and its line is not stamped `via: "api"` (`:422-423`
   compared with `:474`).
5. **Holds** from the text, in chat mode (`:478`, section 3.14).
6. **The board** (a team board feature) can add its own bot id to the picks
   (`:479-480`).
7. **Queue or start.** The picks go into the queue item, or into
   `startGroupTurn` (`:483-502`).

### 3.7 Who answers a room line (`server/index.ts:10684-10704`, `server/store.ts:217-248`)

1. **Pointed pages first.** When the person pointed at parts of a member's
   page, the page's bot answers, then the bots that the text names
   (`server/room-pointed.ts:43-47`).
2. **`@everyone`** anywhere in the line: every member that is not hidden, in
   member order (`server/store.ts:224-234`).
3. **Named bots**, after the picks resolve ties, in the order of the text.
   An ambiguous name is dropped (`:235-237`).
4. **Auto room and a quote.** In an Auto room, a reply to a bot's message
   makes that bot the lead (`server/index.ts:10616`). In other rooms a
   quote does not choose (correction above).
5. **The default responder** (`server/store.ts:238-247`):
   - `everyone`: every member that is not hidden.
   - `member`: the lead. A hidden lead gives nobody (`server/store.ts:239-241`). The room
     then posts the archived-lead line (`server/index.ts:10712-10714`).
   - `auto`: the decision model runs only when no tag resolved, the room has
     more than one member that can answer, it is not a goal and no page was
     pointed at (`server/index.ts:10703-10704`). It has 1,500 ms and needs a
     probability of 0.6 (`server/decider/room-routing.ts:4-6`). It can answer
     `__everyone__` (`:98`). Else the fallback bot, else the first member.
   - `mentions`: nobody.
6. **An archived bot named in the line** gets the line
   `{bot} is archived and can't respond — restore it or mention an active room member.`
   (`server/index.ts:10672-10683`; `src/locales/en.json:409`).
7. **Held members that the line does not name** are skipped, and the line
   is kept for them. A line that names a held member with no stop word
   released it at the intake, before this step (section 3.14).
8. **Nobody left:** `No active room members can respond — restore an archived bot or add an active member.`
   and no turn (`server/index.ts:10706-10723`).
9. **The round** runs the responders one after another, in one promise
   chain for each room thread (`server/index.ts:10757-10830`). It never
   runs two at the same time in one thread. A bot already in `spoken` is
   skipped (`:10798`).

This explains two orders that the evidence shows. With `@everyone` the turns
follow the member list. With named bots they follow the text
(`docs/verification/evidence/mentions/multi-bot-messages.json`;
`server/room-roots.e2e.test.ts:588-606`).

### 3.8 `@everyone` in each place

| Place | What `@everyone` does | Lines |
|---|---|---|
| A person's room line | Every member that is not hidden answers. It wins over tags and over an ambiguous name | `server/store.ts:224-234`; `src/lib/group-routing.test.ts:92` |
| A bot's reply in a room | Wakes only the members that did not speak yet in the round | `server/index.ts:10384-10388`; `server/room-roots.e2e.test.ts:608-625` |
| A one-to-one chat | Not a tag. The picker has no `everyone` row. No chip | `src/components/Composer.tsx:349`; `docs/verification/mentions.md:25`, `:161-165` |
| A bot-to-bot channel | Not offered. The responder is always `mentions` | `server/store.ts:195` |
| The decision model | Its answer `__everyone__` at 0.6 or more makes every member answer | `server/decider/room-routing.ts:7`, `:98`; `server/index.ts:10779` |
| The team map | Goes to the Chief alone. The Chief decides who it concerns. A pure stop line goes to every tagged bot | `src/lib/map-composer.ts:64-75`; `server/chief-of-staff.ts:26-28` |
| Voice in a room call | "Everyone, …" becomes `@everyone …` | `src/lib/group-call.ts:24-28` |
| Holds | `@everyone` and `@all` hold or release every member | `server/room-holds.ts:71-84`, `:103-113` |

`@all` works only for holds. Routing does not read it (`server/store.ts:224-234`).

### 3.9 Mentions in a bot's reply: hops (`server/index.ts:10356-10412`)

1. **The text** is the bot's last reply of the turn (`:10239`). A working
   note that is not the final reply wakes nobody
   (`server/room-holds.e2e.test.ts:223-243`).
2. **Follow only when all are true** (`server/index.ts:10359-10366`):
   - The turn follows mentions (`followMentions`, default true).
   - The turn's runtime node is a root.
   - The bot handed out no work with `coordinate_bots` in this turn.
   - The round is not cancelled.
   - The hop is less than `MAX_GROUP_HOPS = 3` (`server/index.ts:9409`).
   - The reply is not empty.

   So a mention in a hand-off turn wakes nobody
   (`server/room-coordination.e2e.test.ts:210-221`).
3. **Missed tags.** A tag of a bot outside the room adds the line
   `{name} isn't in this room, so that mention didn't reach them — add them to the room to bring them in.`
   A shared name adds the line of section 3.3 (`server/index.ts:10370-10383`;
   `server/same-name-mentions.ts:59-71`).
4. **Who is next:** `roomResponders(reply, other members, {kind: "mentions"})`
   (`server/index.ts:10386`). There are no picks for model text, so a shared name wakes
   nobody. A reply that names nobody ends the chain.
5. **The repeat rule** (`:10384-10388`). A bot that spoke before this reply
   answers again only when the reply names it by its own name (not by
   `@everyone`), and it took no turn since this reply. A bot that did not
   speak before this reply, but spoke since in this chain, is skipped. So
   one reply never runs one bot two times
   (`server/room-roots.e2e.test.ts:588-606`).
6. **Order.** The next bots run one after another, depth first: a bot's own
   mentions are followed before the loop goes on (`:10389-10411`).
7. **Each hop** is a new root in the runtime, not a child. Its requester is
   the person, and the server writes its brief as
   `Mentioned by <name> (hop N): <text>` (`server/index.ts:9454-9459`;
   `server/room-roots.e2e.test.ts:548-567`). The text after the colon is the
   newest bot text in the thread, so it is model output. The brief is
   stored on the assignment (`server/runtime-coordinator.ts:380`).
8. **The end.** Hop 3 is the last that runs. A tag in a hop-3 reply starts
   nothing, and no line says so (`server/room-roots.e2e.test.ts:569-586`).
9. **The number of turns** of one line is limited by the 3 hops and by the
   repeat rule. No fixed total was found.

### 3.10 A busy member

1. **Wait.** Before a member's turn, `waitForChatRoomMember` shows
   `{bot} is finishing another conversation — will reply here when free`
   and waits for the bot (`server/index.ts:4302-4351`;
   `src/locales/en.json:348`). The wait has a limit of 30 minutes by
   default, set by an environment variable, at least 1 second
   (`server/group-goal-run.ts:8`).
2. **Time out.** `{bot} stayed busy in another conversation for {count} minutes — skipped this round`
   (`src/locales/en.json:395`). Nobody answers for that bot.
3. **The last check.** When a one-to-one turn takes the bot after the wait,
   the room skips it with `{bot} is busy in another conversation — skipped this round`
   and does not queue it (`server/index.ts:9544-9559`).
4. **One bot in two threads.** `claimGroupMemberBot` checks and claims the
   member lock in one synchronous step (`server/index.ts:4141-4146`). So two
   threads that wake on the same release cannot both run the bot.
5. **A speaker that is still stopping.** When the round starts and a stopped
   speaker is not cleared yet, the round posts
   `{bot} is still stopping — this message was not dispatched` and ends
   (`server/index.ts:10760-10769`). The person's row stays. No code that
   sends it again was found.
6. **The queue on the wire.** The room shows each waiting member, its place
   and the bot it waits for: `[First,"running",1,2,null], [Second,"queued",2,2,First]`
   (`server/room-queue.e2e.test.ts:82-86`).

### 3.11 The queue: picks travel and merge

1. **Kept.** A room item has `mentions?: string[]`, "Bot ids picked from the
   @ list" (`server/channel-queue.ts:21-22`). The item is saved in the
   durable follow-up table before it goes into memory (`:86`, `:90-91`).
   After a restart, the `pending` rows come back with their picks (`:35-52`).
   The one-to-one queue does the same (`server/steer-queue.ts:46-47`,
   `:138-140`, `:61-79`).
2. **Merged.** Lines of the same sender merge into one turn. The identity
   has no picks (`server/channel-queue.ts:214-219`;
   `server/steer-queue.ts:259-266`). In a room the limits are 30 items and
   a gap of 120 s (`server/admission.ts:20-40`). The one-to-one drain has no
   item limit (`server/steer-queue.ts:206`).
3. **The merged turn** (`server/index.ts:10853-10861`):
   - It joins the texts with a blank line.
   - It takes the sender and the trigger of the first item.
   - It puts the picks of all items in one list, with repeats.
   - It takes the reply target of the last item.

   So the picks of line A also choose for the tags of line B. A line for the
   default responder that queues after a line with a tag goes to the tagged
   bot only, because routing reads the joined text. Each row in the
   transcript still has its own sender (`:10628-10654`).
4. **Lost.** When the room is gone at drain time, the runner returns and the
   rows are settled with no transcript row (`server/index.ts:10848-10851`;
   `server/channel-queue.ts:204`).
5. **Steer.** A queued room line can steer the running speaker only when it
   names that speaker. A line that names nobody steers the speaker, unless
   the speaker does handed work and is not the lead
   (`server/room-steer-addressee.ts:11-19`; `server/routes/channels.ts:556-564`).
   The names come from the text and the picks of the whole head group
   (`:556`).
6. **Not on the row.** A steered or drained line is written to the
   transcript with no picks (`server/routes/channels.ts:619-630`;
   `server/steer-queue.ts:217-231`; `server/index.ts:10626-10665`).

### 3.12 A mention in a one-to-one chat

1. The route checks the picks like a room (`server/routes/bot-messages.ts:217-218`).
   It passes them on only for a typed line, not for a widget press or an app
   message (`:358`). A goal ignores them (`:247-258`).
2. A mention starts no other bot. The bot of the chat answers
   (`docs/verification/evidence/mentions/direct-messages.json`).
3. The turn reads the tags from the text, with person tags removed, among
   the bots that this bot can reach, and with the picks
   (`server/index.ts:8136-8148`). The comment says: "a bot is never told
   about a peer that coordinate_bots would refuse".
4. The prompt part `mentions` is:
   `The user named these existing teammates: <name> (<id>), …. Use coordinate_bots when their contribution is needed; do not substitute native helper agents for these bots.`
   (`server/index.ts:8285`). It is built from stored records. The name goes
   through `peerName`, which removes `[` and `]` and cuts it to 80
   characters (`server/peer-roster.ts:282-284`).
5. The part is in the volatile half of the system prompt
   (`server/system-prompt.ts:49`). `mentionTurn: true` tells each driver to
   send that half again, even when it did not change
   (`server/index.ts:8329`; `server/contracts.ts:179-180`).
6. A turn of the bot API or a read-and-draft turn gets no `mentions` part
   (`server/index.ts:8286`).
7. `mentionPrompt` in `server/system-prompt.ts:336-341` has other text. Only
   its test calls it.

### 3.13 `post_to_room`: a bot posts in another room (`server/index.ts:13743-13845`)

1. The tool argument `mention_ids` becomes `mentionIds`. The same parser
   checks it: 400 "mention_ids must be a list of up to 20 bot ids"
   (`server/same-name-mentions.ts:44-55`).
2. A shared name with no id: 409 with the program text, ending
   `Post it again with the id of the one you mean in mention_ids.`
   (`server/same-name-mentions.e2e.test.ts:156-172`).
3. The post is a row with the role `bot` and starts no turn (`server/index.ts:13743`).
   So the ids only pass the same-name check. They are not stored, and the
   named bot does not wake.
4. Limits: 3 posts in one turn (`server/index.ts:1604`), 4,000 characters
   (`:9440`), and a budget for each room (`:13776-13798`). The route has no
   idempotency key.
5. The sender is the bot of the turn's capability, never the body
   (`:13746-13749`).

### 3.14 Holds by mention (`server/room-holds.ts`)

The design credit is in the file: "The design follows Hermes Agent's desktop
group chat (MIT), ported to this room model rather than copied"
(`server/room-holds.ts:1-4`). The reference's `NOTICE` does not list it.

1. **When.** At the intake, before the queue, so that a stop reaches a
   member that works now (`server/index.ts:4244-4256`). The tags come from
   `mentionedBots` with the picks.
2. **Hold.** A stop word (stop, halt, pause, and the Stop words of many
   languages) within 2 words of a tag holds that bot (`server/room-holds.ts:9-19`, `:54-69`).
   "stop this bridge" is a task, not a stop (`:58-62`).
3. **Release.** A tag with no stop word releases the bot (`:103-113`). So a
   plain mention of a held bot is a resume.
4. **Quotes and code.** Text in quotes or code counts only by the tags in it
   (`:28-52`).
5. **Everyone.** `@everyone`, `@all` or a bare "resume" works on all
   (`:71-92`).
6. **While held**, up to 20 lines for the bot are kept, one time each
   (`:151-159`). The bot gets them when it comes back
   (`server/index.ts:4270-4288`).
7. Only room members can be held (`server/room-holds.ts:135`).

### 3.15 Mention notifications (`server/notify.ts:95-114`)

These are for a bot that names the person, not for a person that names a
bot.

1. Not in a bot-to-bot channel (`:101`).
2. Only for a turn that ended well and was not stopped (`server/index.ts:6809`).
3. Only from the speaking bot's own text lines of that turn (`server/notify.ts:102-104`).
4. The first line with a person tag gives the text. The title is
   `{bot} in {room} mentioned you` (`src/locales/en.json:341`, `:344`).
5. A bot with `notifications: false` gives no notification (`server/notify.ts:59`).
6. On a shared workspace the profile name is not passed
   (`server/index.ts:6809`).

### 3.16 The prompt text about mentions

All of these come from stored records, not from model output. The hop brief
(section 3.9, item 7) is the one exception.

- Room turn: `To bring a teammate in, mention them like @Name — they'll see the conversation and respond.`
  and, not in a channel, `To get <user>'s attention or ask them something blocking, write @you.`
  (`server/index.ts:9955`).
- With the coordination tools: `Plain @mentions are only for conversational replies in this room.`
  (`server/index.ts:9958`).
- The bots outside the room: `An @mention only reaches the members of this room. The bots between the markers below are NOT in this room, so an @mention will not reach them, but you can reach any of them yourself with coordinate_bots`
  (`server/peer-roster.ts:431-443`). The list is fenced. Each name has its
  `[` and `]` removed, so a name cannot fake a fence (`:407-409`).
- The room roster lists every member record with no hidden filter
  (`server/index.ts:9937-9940`).
- The Chief: `When the person writes to @everyone on the Team map, it comes to you alone, so you decide who it concerns`
  (`server/chief-of-staff.ts:28`). The reason (`:26-27`): one line to 13
  bots cost about 13 model turns, and most of the bots had nothing to do.

### 3.17 Bot names

1. `createBot` only trims the name, or picks a free default name
   (`server/store.ts:1279`; `server/names.ts:12-20`).
2. The profile patch needs a name that is not empty, has one line and has at
   most 100 characters (`server/bot-profile.ts:42-47`).
3. No rule makes a name unique, and no name is reserved. So:
   - A bot named "everyone" can never be reached in a room, because the
     `@everyone` check comes first (`server/store.ts:224-234`).
   - A bot named "you" loses each tie to the owner
     (`shared/person-mention.ts:18-24`).
   - A bot named "devs" takes the bug-report tag (`shared/devs-mention.ts:18-24`).

## 4. The data

### 4.1 On the wire and in storage

| Data | Shape | Where | Lines |
|---|---|---|---|
| Picks on a send | `mentions?: string[]`, at most 20, each `^[\w-]{1,128}$`, repeats removed | `POST /api/groups/:id/messages`, `POST /api/bots/:id/messages` | `shared/room-mentions.ts:4`, `:42-47` |
| Picks of a bot's post | `mention_ids` in the tool, `mentionIds` on the internal route | `POST /api/internal/post-to-room` | `server/same-name-mentions.ts:44-55` |
| A queued room line | `ChannelQueueItem {id, text, replyToId?, sendId?, mode, via?, sender?, trigger?, reaction?, mentions?, pointed?, queuedAt}` | memory, and the payload of the durable follow-up row | `server/channel-queue.ts:11-26`, `:90` |
| A queued one-to-one line | the steer item, with `mentions?: string[]` | memory and the follow-up row | `server/steer-queue.ts:22-48`, `:140` |
| A stored person line | `{id, at, role: "user", kind: "text", text}`, and the server-side `sender`, `via`, `sendId`, `queueId` | the messages store. **No picks, no resolved ids** | `server/index.ts:10626-10665`; `docs/verification/evidence/mentions/channel-messages.json:34-40` |
| A stored bot line | `{role: "bot", from: {botId, name, color}, …}` | the messages store | `docs/verification/evidence/mentions/channel-messages.json:42-52` |
| A missed tag | an activity row, `tool: {name: <line>, ok: false}` | the room thread | `server/index.ts:10374-10383` |
| The default responder | `{kind: "member", botId} \| {kind: "everyone"} \| {kind: "mentions"} \| {kind: "auto", fallbackBotId?}`. A reader treats an unknown kind as the lead | the room record | `packages/phone-protocol/src/wire.ts:794-803` |
| Turns per member | an integer from 1 to 5, default 1 | the room record | `server/room-round-turns.ts:6`, `:21-35` |
| Holds | `holds?: Record<botId, {at, noted?}>`, `heldMessages?: Record<botId, {threadId, messageId}[]>` (at most 20 for each bot) | the room record | `packages/phone-protocol/src/wire.ts:885-920`; `server/room-holds.ts:19` |
| A routed reply | `routedBy {provider, probability}` (two decimals) | the bot reply | `server/index.ts:10783`, `:10802-10803` |
| The room queue | `[botId, state, position, of, waitingForBotId]` for each waiting member | the room event | `server/room-queue.e2e.test.ts:82-86` |
| The bot colour | `color`: one of 12 names (green, blue, red, orange, purple, cyan, pink, yellow, teal, coral, silver, chrome) | the bot record | `packages/phone-protocol/src/wire.ts:71-74`, `:284` |

The tag itself is only text. To know which bot a stored line meant, the
reference reads the text again with today's bots. A rename or a delete
changes the answer (`docs/verification/mentions.md:190-191`).

### 4.2 In the memory of the window

- `picksByDraft: Map<draftId, {id, name}[]>` and `pickedNames: Map<botId, name>`
  (`src/lib/mention-picks.ts:5-6`). `pickedNames` is for all drafts and is
  never cleared.
- A draft id is `group:<room>:<thread>` or `bot:<bot>:<thread>`
  (`src/components/Composer.tsx:175-176`).
- `MentionPeer {name, hidden?, color?, person?}` and
  `MentionRange {start, end, color?, you?, person?}` (`src/lib/mentions.ts:8-11`).
- `MentionChoice {id, name, bot?, person?, team?, all?, devs?}`. A person
  row has the id `person:<email>` (`src/components/MentionMenu.tsx:16`,
  `:22-24`). That id is never sent.

### 4.3 Limits

| Limit | Value | Lines |
|---|---|---|
| Picks on one send | 20 | `shared/room-mentions.ts:4` |
| Length of one pick id | 1 to 128 | `shared/room-mentions.ts:45` |
| Query of the picker | 24 characters | `src/lib/mentions.ts:23` |
| Hops of bot mentions | 3 | `server/index.ts:9409` |
| Turns per member in a round | 1 to 5 | `server/room-round-turns.ts:6` |
| Lines kept for a held bot | 20 | `server/room-holds.ts:19` |
| Words between a stop word and a tag | 2 | `server/room-holds.ts:9` |
| Wait for a busy member | 30 minutes, at least 1 second | `server/group-goal-run.ts:8` |
| Decision model | 1,500 ms, probability 0.6 | `server/decider/room-routing.ts:4-6` |
| Room posts by one bot turn | 3, and 4,000 characters each | `server/index.ts:1604`, `:9440` |
| Choices in a same-name text | 12, then "and N more" | `server/peer-roster.ts:242-250` |
| Merge of queued room lines | 30 items, 120 s between items | `server/admission.ts:20-40` |
| A bot name | 100 characters, one line | `server/bot-profile.ts:42-47` |
| A name in a prompt | 80 characters | `server/peer-roster.ts:260` |

## 5. The UI

### 5.1 The @ list (`src/components/MentionMenu.tsx`)

- A box of 18 rem width and at most 18 rem height, above the message box,
  at its start side, so it moves in right-to-left text (`:43`).
- Each row has an icon, the name, a kind label and a description
  (`:46-77`):

  | Row | Icon | Kind label | Description |
  |---|---|---|---|
  | Bot | its avatar, animated only when highlighted | "Agent" | its title, or "Chief of Staff" for an untitled Chief |
  | `everyone` | the people icon | "Group chat" | "1 bot in this chat", "{count} bots in this chat" (hidden members not counted) |
  | Person | the face of the person | "Person" | none |
  | Department (map only) | the people icon | "Department" | "{count} bots in this department" |
  | `everyone` on the team map | the people icon | "Group chat" | "The only bot here", "All {count} bots" |
  | `@devs` | a bug icon | "Developers" | "Report a bug to <product>" |

- **Two bots with the same name** differ only by the title in the list
  (`src/components/Composer.mentions.test.ts:85-92`).
- Mouse: hover moves the highlight, a click picks (`MentionMenu.tsx:56-57`). The keys are
  in section 3.5.
- Screen readers: the list is a `listbox` named "Tag a bot", each row an
  `option` with `aria-selected` (`MentionMenu.tsx:41-55`). The text box has no
  `aria-activedescendant` or `aria-controls`, so a screen reader does not
  hear the highlighted row while the focus stays in the box. A search of
  `Composer.tsx`, `MapComposer.tsx` and `MentionTextarea.tsx` finds none of
  these attributes.
- No empty state: with no match the list does not show.

### 5.2 Chips in the message box (`src/components/MentionTextarea.tsx`)

1. A real `textarea` is on top. Its text is transparent and its caret shows
   (`src/styles.css:54-58`). Behind it, a copy (the mirror) with
   `aria-hidden` draws the same text with chips (`MentionTextarea.tsx:50-52`).
2. The mirror copies 16 layout properties, the width and the scroll of the
   box, so each letter is under its caret place (`:6-7`, `:17-26`). The
   chip style changes no padding, border or weight, so the caret does not
   move (`src/styles.css:17-18`).
3. The box grows to at most 6 lines (`MentionTextarea.tsx:27-36`).
4. Right-to-left: the mirror gets the same `dir`, and `unicode-bidi: plaintext`,
   so each paragraph takes its own direction (`MentionTextarea.tsx:50`; `src/styles.css:47-53`).
   `docs/verification/mentions.md:33-55` records the bug before this fix.
5. During IME composition the mirror hides and the native text shows
   (`MentionTextarea.tsx:54-56`; `src/styles.css:59-64`).
6. In forced-colours mode (high contrast) the mirror hides, so there are no
   chips (`src/styles.css:75-78`).
7. The box draws no "you" chip, because it passes no person
   (`MentionTextarea.tsx:51`).

### 5.3 Chips in the chat

- A person's own line: plain text with chips, through `ThreadRefText`. No
  "you" chip (`src/components/ThreadRefs.tsx:128-142`).
- A bot's text: Markdown with a remark plugin that draws chips in text
  nodes and skips links and code (`src/lib/mentions.ts:100-126`;
  `src/components/ChatMarkdown.tsx:923-928`). A bot that writes the person's
  profile name gets the "you" chip (`src/components/RoomTextMessage.tsx:95`,
  `:227-229`).
- The cache key of a rendered block has the name, hidden state, person flag
  and colour of each peer. So a rename or a new colour draws the chips again
  (`ChatMarkdown.tsx:832-838`, `:924`).
- **The chip is found by name.** With two members of the same name, the chip
  takes the colour of the first one in the roster. A pick of the second bot
  does not change it (`src/lib/mentions.ts:60-70`).
- A renamed, deleted or hidden bot shows as plain text in old lines
  (`src/components/MentionText.test.ts:26-30`; `docs/verification/mentions.md:190-191`).
- `@everyone` is drawn only in rooms (`src/lib/mentions.ts:71`).

### 5.4 Colours (`src/styles.css:19-42`, `src/lib/mascot.ts:51-64`)

- A chip of a bot sets `--mention-color` to the hex of its colour name. Only
  a name that is a key of the palette map becomes CSS. This stops a crafted
  colour value from reaching CSS (`src/lib/mentions.ts:81-82`).
- `.mention-highlight`: text with 30% of the colour mixed into the ink,
  background with 24% into the inset, underline in the colour
  (`src/styles.css:19-30`).
- `@everyone` and a peer with no colour: grey (`--color-ink-secondary`).
- A person: a dotted underline (`:31-33`).
- "you": the accent colour, bold, with padding (`:34-42`).
- In the person's coloured bubble of a one-to-one chat, a chip mixes 22% of
  its colour into the bubble inset (`src/styles.css:3728-3732`). The test
  checks contrast of 4.5:1 or more for each skin and each colour
  (`src/lib/user-bubble-tone.test.ts:63-98`). The same 22% is also in
  TypeScript (`src/lib/user-bubble-tone.ts:15`), and only the test uses it.
- The record of the manual check gives a lowest text contrast of 6.24:1 over
  70 pairs of colour and skin (`docs/verification/mentions.md:98-103`).
- `mascotBodyColor` changes only the avatar body, not the chip
  (`packages/phone-protocol/src/wire.ts:288`).

### 5.5 Who will answer

- The placeholder of a room box: "Message {name} ({hint})" with "everyone
  responds", "@ to bring a bot in", "The decision model picks who responds"
  or "{name} responds" (`src/components/Composer.tsx:911`;
  `src/components/composer-simple.ts:73`).
- The empty room: "Everyone responds unless you @mention specific bots.",
  "Mention a bot with @ to bring them in.", "{name} responds by default.
  @mention someone else to choose them instead." (`src/lib/group-routing.ts:30-38`).
- The header select and the panel "Who responds": a member as the lead,
  "Let <product> choose", "Everyone", "Only who I @mention", and turns per
  member from 1 to 5 (`src/components/RoomHeader.tsx:31-64`;
  `src/components/room-panel/ResponderPage.tsx:11-76`). Two leads with the
  same name have the same text in the select (`RoomHeader.tsx:51-54`).
- Above a bot's room message: "<bot> → <names>". It lists the author of the
  quoted message, then each room bot that the text tags, live while the
  reply streams (`src/lib/room-addressees.ts:12-35`;
  `src/components/GroupView.tsx:118-122`).
- **There is no warning before the send.** `roomRouteForComposer` knows that
  a typed shared name will be refused (`src/lib/group-routing.ts:56-57`,
  `:77`). The composer uses it only for the image check
  (`Composer.tsx:297-303`). The person learns of the refusal only from the
  409.

### 5.6 The team map (`src/components/MapComposer.tsx`, `src/lib/map-composer.ts`)

- The rows: `everyone` (when there are 2 or more bots), the departments,
  then the bots. Hidden bots are not offered (`MapComposer.tsx:36`, `:47-51`).
- A pick stores no id. The targets come from the text by name, so only the
  first of two bots with the same name can be reached (`map-composer.ts:44-47`).
- A live hint: "Tag a bot with @ to send", "Goes to {count} tagged bots,
  each in its own chat", "Goes to {name}, who passes it on to the bots it
  concerns" (`MapComposer.tsx:96-97`, `:140-142`).
- Send: when the line goes through the Chief, the window first asks
  `POST /api/stop-line`. When that call fails, the line goes to each tagged
  bot (`MapComposer.tsx:83-86`). The window then makes one send for each
  bot, each with a new `sendId` (`:87`).

### 5.7 Access in the window

- A room with a member that the person can only view shows no message box,
  but a line that says so: "writing there makes every bot in it answer"
  (`src/components/bot-access/RoomComposer.tsx:6-11`).
- The one-to-one list hides hidden bots and bots hidden from the sidebar,
  but not bots that the person can only view (`Composer.tsx:353`).
- The room list shows hidden members. They get no chip and no turn
  (`Composer.tsx:350`; `src/lib/group-routing.ts:64`).

### 5.8 Voice in a room call (`src/lib/group-call.ts`)

- "Atlas, can you take this?" becomes `@Atlas can you take this?`.
  "Everyone, …" becomes `@everyone …` (`:24-38`). These rules use their own
  regular expressions, not the shared grammar.
- In a `mentions` room, speech that names nobody is not sent. The call says
  "Say a member's name — or say everyone." (`GroupCallView.tsx:303-309`).
- A spoken line has no picks and no `sendId` (`GroupCallView.tsx:312`).

## 6. The tests

| Area | What the tests fix | Lines |
|---|---|---|
| Grammar | Boundaries (`(`, `**`, `【`, full-width), no tag after a letter or `/`, no tag before a letter, number, mark, `_` or a supplementary letter, offsets right after `İ` and emoji | `shared/room-mentions.test.ts:47-51`; `src/lib/mentions.test.ts:8-59`; `server/comms.test.ts:31-62` |
| Same name | A pick chooses one. Both picked keep the line order. No pick gives `ambiguous`. A repeated tag is reported one time. A hidden twin does not make a name ambiguous. The longest name wins | `shared/room-mentions.test.ts:12-45` |
| Picks field | `undefined` and `null` are absent. A string, a number, a space, 129 characters or 21 ids are refused. 20 is accepted | `shared/room-mentions.test.ts:58-73` |
| Refusal texts | The exact person text and program text, with 2 and 3 bots | `server/same-name-mentions.test.ts:12-63` |
| End to end, same name | A pick wins over the lead. A refused line is not stored. A picked line queues and is answered one time. 400 for bad picks. A one-to-one chat lists both bots. `post_to_room` needs `mention_ids`. A bot reply wakes neither twin | `server/same-name-mentions.e2e.test.ts:88-207` |
| Who answers | Lead, a tag overrides the lead, `everyone`, `mentions`, `@everyone` in a `mentions` room, the auto fallback, a hidden fallback | `server/comms.test.ts:64-98`; `server/decider/auto-room-compat.test.ts:26-47` |
| Decision model | A tag skips the model. `__everyone__` makes each member answer. Below 0.6 the lead answers | `server/decider-rooms.e2e.test.ts:216-290`; `server/decider/room-routing.test.ts:64-113` |
| Quote | A tag wins over a quote. In an Auto room a quote picks the quoted bot. A tag of a paused bot is not sent to another bot | `server/room-quoted-replies.e2e.test.ts:100-190` |
| Hops | Each responder is a root. Hops 1 to 3 run, hop 4 does not. A nested tag runs a bot one time. A bot's `@everyone` skips bots that spoke | `server/room-roots.e2e.test.ts:152-177`, `:548-625` |
| Hand-off | A tag in a hand-off turn wakes nobody | `server/room-coordination.e2e.test.ts:210-221` |
| Working notes | A tag in a note that is not the final reply wakes nobody | `server/room-holds.e2e.test.ts:223-243` |
| Holds | Stop near a tag holds. A plain tag releases. `@everyone`, `@all` and "resume". Quotes and code. At most 20 kept lines | `server/room-holds.test.ts:16-100` |
| Steer | A named line steers only the named speaker | `server/room-steer-addressee.test.ts:17-34` |
| Composer | A pick sends its id. A pick is forgotten after its send. A failed send gives back the pick. A pick in a one-to-one chat | `src/components/Composer.mentions.test.ts:85-121`; `src/state/send-mentions.test.ts:68-83` |
| IME | No key acts during composition. A Japanese name is picked | `src/components/Composer.ime.test.ts:75-112` |
| Chips and colours | Each colour by name, not by place in the roster. `@everyone` grey. Unknown names plain. Same result in plain text and Markdown | `src/components/MentionColors.test.ts:8-24`; `src/components/MentionText.test.ts:7-30` |
| Mirror | Same `dir` in three directions. It follows a class change. The composing mark | `src/components/MentionTextarea.test.ts:6-15`; `src/components/MentionTextarea.dom.test.ts:14-52` |
| Window prediction | The same rule as the server, with `ambiguous: true` for a typed shared name | `src/lib/group-routing.test.ts:30-94` |
| Team map | Tag order, the longest name, departments, `@everyone` to the Chief, a stop to each bot | `src/lib/map-composer.test.ts:15-91` |
| Manual record | Highlights, colours, right-to-left, the DM preview. It says it does not prove routing | `docs/verification/mentions.md:188-190`; `scripts/verify-mentions.ts:33` (no assertions) |

Gaps found: no test calls `buildMentionNotification` (`server/notify.test.ts`).
No test covers a person who types the name of a hidden bot in a room. No
test covers two queued lines with different picks. The test title "ten bot
colors" loops over 12 (`src/components/MentionColors.test.ts:8`).

## 7. Ours compared

Our crates have no mention code. A search of `crates/` for "mention" and
"everyone" finds nothing. `bot-protocol::Message` has only `id`, `role` and
`text` (`crates/bot-protocol/src/message.rs:13-19`). The desktop composer
copies only the layout of the reference composer (`NOTICE`, "Adapted
components").

Step 14 of the plan is `coordinate_bots` between bots. Rooms have no step
yet: P229 in [`../../plan/bot-coordination.md`](../../plan/bot-coordination.md)
is the gap "for the step of rooms". So most of this feature goes into that
gap. Only the one-to-one parts belong to step 14.

| Reference | What it does | Our crate and module | When |
|---|---|---|---|
| `packages/phone-protocol/src/mention-boundary.ts`, `shared/room-mentions.ts` | The grammar and the bot parse | `bot-core`, a pure module `mention` (no I/O) | Step 14, for the one-to-one part |
| `src/lib/mentions.ts` (ranges for chips, the picker query) | The parse in the window | `bot-desktop` UI, `features/chat/`, or a call to the `bot-core` parse (section 8, item 6) | With the picker |
| `src/lib/mention-picks.ts`, `src/components/Composer.tsx:345-397`, `MentionMenu.tsx` | The @ list and the picks | `bot-desktop` UI, `features/chat/Composer.tsx` | With the picker |
| `MentionTextarea.tsx`, `MentionText.tsx`, `src/styles.css:17-78` | Chips over the text box and in the chat | `bot-desktop` UI, `features/chat/` | With the picker |
| `mentions?: string[]` on a send | The picks | `bot-protocol`, a field on the send command | Step 14 |
| `server/index.ts:8136-8148`, `:8285` | "The user named these existing teammates" | `bot-core`, the prompt parts of a turn | Step 14 |
| `server/store.ts:217-248`, `server/index.ts:10560-10830` | Who answers in a room | `bot-core`, a pure function `responders(line, room) -> Vec<BotId>` | The rooms gap (P229) |
| `server/index.ts:10356-10412` | Hops of bot mentions | `bot-core`, the room round | The rooms gap |
| `server/same-name-mentions.ts` | Refusal texts and notes | `bot-core`, a typed refusal (`AGENTS.md`: typed refusals) | Step 14 for the code; the rooms gap for the room text |
| `server/channel-queue.ts`, `server/steer-queue.ts` | Picks in the queue | `bot-core`, the queue of step 7 and its store of step 8 | Steps 7 and 8, or the rooms gap |
| `server/room-holds.ts` | Holds by mention | `bot-core`, the room round | The rooms gap. Credit to carry (section 8, item 12) |
| `server/decider/room-routing.ts` | The decision model | `bot-engine` (the call), `bot-core` (the fallback) | Later. `docs/comparison.md:206` lists it |
| `server/notify.ts:95-114` | A bot names the person | `bot-core` events, `bot-desktop` notices | Later |
| `src/lib/map-composer.ts`, `server/chief-of-staff.ts:28` | `@everyone` on the team map | `bot-desktop` | Later (the team map is part 24) |
| `shared/devs-mention.ts` | Bug report to the vendor | none | Out of scope |

## 8. Where we can be better

Each point says what the reference does, what we can do, and why it is
better. The author decides each one (`MEMORY.md`: "Follow the reference, and
raise each improvement").

1. **Store which bot each tag meant.** The reference stores only the text
   (section 4.1). It reads the text again with today's bots. So the chip of a
   second bot with the same name has the first bot's colour
   (`src/lib/mentions.ts:60-70`), a renamed bot shows as plain text
   (`docs/verification/mentions.md:190-191`), and a line taken from the
   queue has lost its picks (`server/routes/channels.ts:619-630`). We can
   store the resolved tags on the message, for example
   `mentions: Vec<Mention { bot: BotId, start: u32, end: u32 }>`.
   **Reason:** one source of truth. Display, routing and a later read give
   the same bot, and a rename does not change history.
2. **Put the picks in the idempotency check, and keep them for each queued
   line.** The fingerprint has no picks (`server/send-idempotency.ts:68-70`).
   A resend with other picks returns the first receipt with no error. The
   merge joins the picks of all lines (`server/index.ts:10861`), so the picks
   of one line choose for the tags of another. **Reason:** the problem "the
   same work done two times, or lost" of `changelog.md` section 5. A pick is
   a part of what the person sent.
3. **Check each pick against what the sender can reach.** The access gate
   does not read `mentions` (`server/host/bot-access-gate.ts:65-87`). The
   parse checks only the shape (`shared/room-mentions.ts:42-47`). In a
   one-to-one chat the turn filters by reach (`server/index.ts:8136-8148`), so
   the harm is small there. We can refuse a pick that is not a bot the sender
   can reach, with a typed refusal. **Reason:** the problem "an access right
   in the wrong place". The check is at one place, not in each caller.
4. **Refuse reserved bot names.** A bot named "everyone" can never be
   reached in a room, "you" loses each tie, and "devs" takes the bug tag
   (section 3.17). We can refuse `everyone`, `all` and `you` as bot names at
   create and rename. **Reason:** a wrong state that the code then refuses,
   and less special code in the parse.
5. **Build the hop brief from stored ids only.** The brief of a hop is
   `Mentioned by <name> (hop N): <the newest bot text>`
   (`server/index.ts:9454-9459`). The text after the colon is model output.
   It is stored on the assignment (`server/runtime-coordinator.ts:380`). We
   did not find if a model reads it (section 9). `AGENTS.md` says: "Text that
   opens a delegated turn is built from stored data, never from model
   output." We can give the hop a reference to the stored reply (its message
   id) and the name from the bot record. **Reason:** a rule of this
   repository. The room context already shows the reply.
6. **One grammar for the Rust core and the TypeScript window.** The reference
   keeps one file for the phone, the window and the server
   (`packages/phone-protocol/src/mention-boundary.ts:1`). We have two
   languages. Choose one of these: (a) the window calls the `bot-core` parse
   through a Tauri command, or (b) a JSON file of test cases that the Rust
   tests and the TypeScript tests both run. **Reason:** without this, the
   chip and the route can disagree. That is the bug the reference wrote its
   shared file to stop.
7. **One rule for code and for case.** The bot parse reads tags in code. The
   person parse and the picker do not. The picker also treats indented lines
   as code (section 3.2, item 7). `@everyone` uses `toLocaleLowerCase`, the
   rest uses `toLowerCase` (`server/store.ts:229`, `shared/room-mentions.ts:30`).
   In Rust, `str::to_lowercase` does not depend on a locale. **Reason:**
   less code, and a tag in a code sample does not start a turn.
8. **Never skip a mentioned bot with no way back.** A bot that is busy at
   the last check is skipped (`server/index.ts:9544-9559`). A line sent while
   a stopped speaker clears is not sent, and nothing sends it again
   (`:10760-10769`). A tag in a hop-3 reply starts nothing and no line says so
   (section 3.9, item 8). We can queue the turn for the busy bot, keep the
   line in the queue until the speaker clears, and write one line when the
   hop limit stops a chain. **Reason:** the problem "busy and races between
   bots" (none answers) of `changelog.md` section 5.
9. **Keep the sender of each line in a merged turn.** The merged turn takes
   the sender and the trigger of the first item (`server/index.ts:10859-10860`),
   but the rows keep their own sender (`:10628-10654`). Our P218 gives each
   message a typed sender. The merge rule can join only lines of one sender,
   which is what `coalesceIdentity` already does for people
   (`server/channel-queue.ts:214-219`). **Reason:** the problem "who sent a
   message" of `changelog.md` section 7.
10. **Warn before the send.** The window already knows that a typed shared
    name will be refused (`src/lib/group-routing.ts:77`). The composer uses
    that only for images (`Composer.tsx:297-303`). We can show the hint
    under the box and open the @ list on that name. **Reason:** the person
    sees the problem before the 409, and the code is already there.
11. **The @ list follows the routing rule.** The room list shows hidden
    members, who never answer (`Composer.tsx:350`). The one-to-one list shows
    bots that the person can only view (`:353`). **Reason:** the list offers
    only what the server accepts. Same rule, less surprise.
12. **Carry the credit of the holds design.** `server/room-holds.ts:1-4`
    credits "Hermes Agent's desktop group chat (MIT)". The reference's
    `NOTICE` does not list it. When we port the holds, add a line to our
    `NOTICE`. **Reason:** `AGENTS.md`, "Reference code and licensing".
13. **One transaction for a held skip.** `noteHeldSkip` changes the room and
    appends the line in two calls (`server/index.ts:4219`, `:4224`).
    **Reason:** `AGENTS.md`: "Every state change in the runtime writes the row
    and its event in one transaction".
14. **Accessibility of the @ list.** Wire the text box as a combobox
    (`aria-controls`, `aria-activedescendant`, `aria-expanded`), so a screen
    reader hears the highlighted row (section 5.1). **Reason:** the reference
    lacks it. It costs a few attributes.
15. **Ids on the team map.** The map finds targets by name only, so the
    second of two bots with the same name is never reached
    (`src/lib/map-composer.ts:44-47`). It makes one send for each bot, with no
    shared id (`MapComposer.tsx:87`). **Reason:** the same rule as the
    composer, and one id for the whole send.

Keep these rules of the reference as they are: the grammar of section 3.2;
"a pick never adds a bot"; the refusal of a person's ambiguous line before
the queue; `@everyone` before tags; the 3-hop limit and the repeat rule;
names in prompts fenced and cleaned (`server/peer-roster.ts:407-409`); only a
palette name becomes CSS (`src/lib/mentions.ts:81-82`); the mirror with the
same `dir` and `unicode-bidi: plaintext`.

### 8.1 The problems of `changelog.md` section 5 in this code

| Problem | Does the reference have it here? | Lines |
|---|---|---|
| "Busy" and races between bots | **Two answer one mention: no.** One promise chain for each room thread runs one responder at a time. A synchronous claim stops one bot in two threads. The repeat rule stops a second turn from one reply. **None answers: yes, in four cases.** A busy bot at the last check is skipped. A wait of 30 minutes ends in a skip. A line sent while a speaker clears is not sent. A paused bot (not a room hold) that is named does not answer, by design | `server/index.ts:10757-10830`, `:4141-4146`, `:10384-10388`, `:9544-9559`, `:4335-4348`, `:10760-10769`; `server/room-quoted-replies.e2e.test.ts:179-190` |
| The same work done two times, or lost | **Yes.** A resend with other picks is taken as the same send. The merge joins picks across lines. Queued lines for a room that is gone are settled with no row. A held bot keeps only 20 lines. The map makes N sends with N ids. No `sendId` on a voice line | `server/send-idempotency.ts:68-70`; `server/index.ts:10861`, `:10848-10851`; `server/room-holds.ts:151-159`; `src/components/MapComposer.tsx:87`; `src/components/GroupCallView.tsx:312` |
| Who sent a message | **Partly.** The sender comes from the auth, never the body. A program is stamped `via: "api"` and its lines never merge. But a merged turn takes the first sender. On a desktop-managed server a program gets the program text and no stamp. The hop brief puts a bot's words in a node whose requester is the person | `server/routes/channels.ts:419-426`, `:474`; `server/channel-queue.ts:215`; `server/index.ts:10859`, `:9454-9459`; `server/room-roots.e2e.test.ts:559-562` |
| A secret or an access right in the wrong place | **Access, yes.** The gate does not check picks. The room list shows hidden members, the one-to-one list shows view-only bots. A room with a view-only member hides the box, which helps. A one-to-one turn tells a bot only about bots it can reach. The decision model gets text with secrets removed | `server/host/bot-access-gate.ts:65-87`; `src/components/Composer.tsx:350`, `:353`; `src/components/bot-access/RoomComposer.tsx:6-11`; `server/index.ts:8136-8148`; `server/host/room-routing-input.ts:19` |

## 9. Not verified

- Whether a model reads the hop brief `Mentioned by … (hop N): …`. It is
  stored on the assignment (`server/runtime-coordinator.ts:380`) and shown
  as the node text (`:102`). The prompt path was not read.
- A bot under a global hold (not a room hold) that a line names: the code
  seems to skip it with no line (`server/index.ts:9503-9510`, `:4214-4215`).
- Whether anything sends again a line that "was not dispatched" while a
  speaker cleared (`server/index.ts:10760-10769`).
- `followRoomMentions` for bots in another place of the person
  (`server/host/bot-link-rooms.ts:362`). Only its wiring was read
  (`server/index.ts:3844`).
- Whether follow-up rows left at "dispatching" by a crash come back after a
  restart. The two queue files restore only `pending` rows.
- How the tool layer maps `mention_ids` to `mentionIds`, and whether it
  removes a repeated tool call.
- What `createChannel` does with a member id that does not exist
  (`server/routes/groups.ts:53` refuses only a bot the caller cannot see).
- Whether hidden bots stay in `memberIds`. This decides if the room prompt
  lists them (`server/index.ts:9937-9940`).
- A person in a Team Cloud room who types the name of a bot they cannot see.
  No test and no read code cover it.
- The total number of turns that one line can start with `@everyone` at each
  hop. Only the hop limit and the repeat rule were read.
- That a reload loses the picks. The code keeps them only in memory
  (`src/lib/mention-picks.ts:5-6`). Nobody ran it.
- That the remark plugin never sees code text. The plugin skips the code
  nodes (`src/lib/mentions.ts:103`). The remark parse was not read.
- The effect of `toLocaleLowerCase` on `@everyone` under a Turkish locale
  (`server/store.ts:229`).
- A bot name that has `@` in it: the scan goes on from the next character
  (`shared/room-mentions.ts:28`).
- Whether every way to make a bot goes through the name rules of the
  profile patch. `createBot` does not check (`server/store.ts:1279`).
