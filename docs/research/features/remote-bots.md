# Bot to bot across servers (teammates on other servers)

The row of [`reference-features.md`](../reference-features.md): "Bot to bot
across servers: an admin saves a teammate on another server (address and Bot
API key), and local bots give it work with `coordinate_bots`". Group:
later. Crates: `bot-core`, `bot-engine`.

The reference project is at commit `42f86aefd` (2026-11-27, after the tag
v0.1.184). All paths in this file are paths of the reference project, unless
a path starts with `crates/` or `docs/` of this repository.

## What this file adds to earlier research

- [`agent-tools.md`](agent-tools.md) has the `list_bots` entry of a remote
  teammate (`host/remote-teammate-handoff.ts:266-268`). This file adds that
  `list_bots` shows every remote teammate to every bot, with no filter for
  the sender (`server/index.ts:13018`).
- [`chat-and-teams-site.md`](chat-and-teams-site.md) has the limit of 4
  reworks and its proposal P356. This file adds how the count works: its key,
  its window of 6 hours from the last rework, and that a restart clears it.
- [`assignment-runtime.md`](assignment-runtime.md) lists the wrapper
  `remoteHandoff.host` as "not verified" (section 9). This file reads it
  completely (section 3.5). It also shows that the poll loop of a remote
  hand-off renews the two stall clocks of the runtime. So a remote teammate
  that never answers keeps the work open with no end (section 3.6).
- [`bot-coordination.md`](bot-coordination.md) has `coordinate_bots` between
  local bots. This file adds the remote path in front of it: the target
  resolution, five refusals, the receipts and the brief.
- [`security-model.md`](security-model.md) has the loopback trust and the
  request scopes. This file uses its result: the routes of this feature need
  the `admin` scope (`server/request-auth.ts:313-330`, `:539-545`). It adds
  the address checks of the outgoing call and the storage of the key.
- [`harness-upgrades.md`](harness-upgrades.md) has one retry of the Bot API
  (`server/bot-api-host.ts:226-242`). This file adds the request contract of
  the Bot API as a remote teammate uses it.
- `docs/comparison.md` says that a Bot API key is `bak_` plus 32 random
  bytes, and that only its SHA-256 is stored, in `bot-api.json` with mode
  0600. The code confirms this (`server/bot-api.ts:76-82`, `:95`, `:265-270`).
- The changelog problem of v0.1.182, a bot asked to reach another bot "no
  longer leaves the request in your Inbox and waits forever", is **not** in
  this feature. Its commit `f1b3664bb` (2026-11-26) changes
  `server/host/message-person-bots.ts`, `server/host/team-messages.ts` and
  `server/bot-link/link.ts`: a `message_person` call with a bot's name is
  refused, not put in the person's Inbox. No file of this feature changed.

## 1. In short

The special terms, one time each:

- **Teammate on another server (remote teammate):** a bot that another
  server of the reference project runs. An admin of this server saves it in
  Settings. Local bots can then give it work.
- **Bot API:** an HTTP door of one bot on its own server. A program sends a
  message to the bot and gets its reply. It is off by default for each bot
  (`docs/bot-api.md:4`).
- **Bot API key:** the secret that opens the Bot API of one bot. It has the
  form `bak_` plus 43 characters (`server/bot-api.ts:80-82`). The owner of
  the remote bot makes it on the Bot API card of that bot and gives it to
  the admin of this server.
- **Sending side:** this server. Its bot calls `coordinate_bots`, and the
  hand-off code calls the Bot API of the other server.
- **Receiving side:** the other server. Its Bot API runs one turn of its bot
  for each call.
- **Hand-off:** work that one bot gives to another bot. The assignment
  runtime records it as a child row (see `assignment-runtime.md`).
- **Brief:** the text that the sending side sends to the other server. The
  code makes it from the stored text of the hand-off, not from model output
  at send time (`server/host/remote-teammate-handoff.ts:168-175`).
- **Marker:** the line `work[<hand-off id>]` in the file
  `remote-teammate-work.json`. The sending side writes it before it sends,
  so that a restart does not send the work again.
- **Fence (confined turn):** the rules for a turn that comes in through the
  Bot API. The turn runs at the level Ask, in an empty folder, with no tools
  of the reference project (`server/bot-api-fence.ts:1-13`).
- **Acts as me:** an option of one Bot API key. With it, a call runs as the
  owner's own work, at the bot's own level. It is off by default
  (`server/bot-api-host.ts:5-9`).

What the reference project does, in short:

1. An admin of this server adds a teammate in Settings → You and your bots →
   Teammates on other servers. That place shows only in Advanced mode. The
   admin types a name, the address of the other server and the Bot API key
   (`src/components/RemoteTeammatesSettings.tsx:75-87`).
2. The server keeps the teammate and its key in `remote-teammates.json`, a
   plain JSON file with mode 0600. It never shows, lists or logs the key
   (`server/remote-teammates.ts:1-3`, `:200`).
3. Each local bot sees the teammate in `list_bots` as `remote-<id>`. A bot
   gives it work with `coordinate_bots`, by that id or by its name
   (`server/host/remote-teammate-handoff.ts:109-119`, `:266-268`).
4. The sending side records a marker, then sends one POST to the Bot API of
   the other server. It then reads that thread again after 30 s, 60 s, and
   then every 120 s, until the reply comes (`:23-25`, `:206-231`).
5. The reply resumes the sender bot as "information from that bot, never
   the person's approval" (`:221-223`).
6. On the other server, the call is an ordinary Bot API call. It runs
   confined, at Ask, with no tools, unless the key acts as the owner
   (`docs/bot-api.md:186-189`).
7. Rooms, answers, posts, own threads, files and a one-way consultation do
   not cross servers (`:121-126`, `:154`).
8. The code came in v0.1.178 (2026-11-23,
   `announcements/releases.json:293`) and was hardened in the commits of
   2026-11-22 and 2026-11-23 (for example `96f821d2e`, `b01badcaa`,
   `92b01d117`, `50b5b46a8`).

## 2. Files read completely

Four readers read these files. The main session checked the key findings
against the code (section 9 names what is not checked).

| File | Lines | Read |
|---|---|---|
| `server/host/remote-teammate-handoff.ts` | 278 | all |
| `server/host/remote-teammate-handoff.test.ts` | 378 | all |
| `server/remote-teammates.ts` | 335 | all |
| `server/remote-teammates.test.ts` | 373 | all |
| `server/routes/remote-teammates.ts` | 48 | all |
| `server/workspace-backup-policy.ts` | 108 | all |
| `server/workspace-backup-policy.test.ts` | 117 | all |
| `server/bot-api.ts` | 296 | all |
| `server/bot-api-host.ts` | 403 | all |
| `server/bot-api-fence.ts` | 27 | all |
| `server/bot-api.test.ts` | 188 | all |
| `server/bot-api-host.test.ts` | 633 | all |
| `server/bot-api-fence.test.ts` | 36 | all |
| `server/bot-api.e2e.test.ts` | 304 | all |
| `src/components/RemoteTeammatesSettings.tsx` | 201 | all |
| `src/components/RemoteTeammatesSettings.dom.test.ts` | 161 | all |
| `src/components/settings/pages/PlacePages.tsx` | 209 | all |
| `src/components/AdminOnly.tsx` | 14 | all |
| `src/components/bot-settings/BotApiCard.tsx` | 228 | all |
| `shared/settings-places.ts` | 114 | all |
| `docs/bot-api.md` | 195 | all |
| `docs/runtime-contract.md` | 144 | all |

Ranges of larger files:

| File | Lines | Ranges |
|---|---|---|
| `server/index.ts` | 15217 | 483, 644, 2748, 2784 (part), 3838-3862, 9353, 9360-9387, 9420-9442, 11933, 13005-13025, 13470-13478, 13608-13623 |
| `server/webhook-ingress.ts` | 238 | 9, 20-130 |
| `server/request-auth.ts` | 767 | 313-330, 536-545 |
| `server/atomic.ts` | 142 | 53-68 |
| `server/host/outside-lineage.ts` | 161 | 12 |
| `server/checked-handoff.e2e.test.ts` | 123 | 100-123 |
| `server/runtime/runtime.ts` | 975 | 350-363, 389-431, 655-680 (main session) |
| `server/runtime/types.ts` | 402 | 355-385 (main session) |
| `src/components/settings/settings-index.ts` | 344 | 25-62, 66, 68-72, 128, 174-192, 219-222 |
| `src/locales/en.json` | 12334 | 8518-8554, 11160-11186 |
| `announcements/releases.json` | 1277 | 30-60, 180-186, 275-305, 540-552 |

The main session also ran `git log` on the two server files of the feature
and `git show --stat f1b3664bb`. It changed nothing in the clone.

## 3. How it works

### 3.1 Add a teammate

1. The admin opens Settings → You and your bots → Teammates on other
   servers. The place has three gates (`PlacePages.tsx:170`):
   - A team member who is not an admin sees nothing.
   - The place is in an `AdvancedSection`, so it shows only in Advanced
     mode.
   - `AdminOnly` wraps it. That wrapper shows its content while the role is
     not known yet (`AdminOnly.tsx:12`), so the real gate is the server.
2. The admin clicks "Add" and fills the form
   (`RemoteTeammatesSettings.tsx:75-87`):
   - Name: at most 80 characters.
   - Address: at most 500 characters. The admin can paste the whole Bot API
     address from the card of the other bot, or the address of the server.
   - Bot id: optional. It is necessary only when the address has no bot id.
   - Key: a password field, at most 200 characters, placeholder "bak_…".
3. The button "Add teammate" is enabled when the name, the address and the
   key are not empty (`:49`). The browser sends `POST /api/remote-teammates`
   with `{name, address, botId?, key}` (`:51-71`).
4. The server needs the `admin` scope. No path of this feature is in
   `CLIENT_ALLOW`, so `requiredScope` gives `admin`
   (`server/routes/remote-teammates.ts:3-4`, `server/request-auth.ts:313-330`).
5. The server reads the body, at most 16,000 bytes
   (`routes/remote-teammates.ts:21`). It checks the input with a strict
   schema (`server/remote-teammates.ts:91-98`). A key that does not match
   `^bak_[\w-]{16,200}$` gets "paste the key the other server's Bot API card
   showed (it starts with bak_)". This shape also stops a header injection
   (`remote-teammates.test.ts:96`).
6. The server checks the address (`remoteAddress`, `:110-135`). Each error
   is a 400:
   1. Not a URL: "that is not a server address; give it like
      https://maus.example.com".
   2. Not `https:` or `http:`: "the address must start with https:// (or
      http:// on a private network)".
   3. A user name, a password, `?` or `#`: "give the server's address
      without a sign-in, ? or #".
   4. Plain `http:` to a public address: "http://<host> is on the open
      internet and plain http isn't encrypted; use its https:// address".
      Plain `http:` is allowed only on this computer or a private network:
      a LAN address, Tailscale `100.x` or `*.ts.net`, and `*.local`
      (`:108-109`).
   5. An IP literal that is link-local, cloud metadata or reserved, also
      inside NAT64 or 6to4: "<host> is a link-local, metadata or reserved
      address, not another server" (`:37-44`, `:123`). Loopback and private
      addresses are allowed: "a teammate may run on this computer" (`:38`).
   6. A path in the form `/hooks/api/bots/<id>/messages` gives the bot id
      (`:34`, `:124-127`). A bad id, or an id that is not the same as the
      typed bot id, is refused (`:128-129`). No bot id at all: "give the
      other bot's id, or paste the whole Bot API address from its card"
      (`:131`).
   7. The base address, without the end slashes, is at most 300 characters
      (`:132-133`).
7. The store refuses a second teammate with the same base address and bot
   id: 409 "that bot is already a teammate" (`:178`). It refuses the 51st
   teammate: "at most 50 teammates on other servers" (`:20`, `:179`).
8. The store makes the record with a new UUID and `createdAt`, and writes
   the file atomically with mode 0600 (`:180-183`, `:198-202`). A failed
   write keeps the old list in memory (`:197`).
9. The answer is 201 `{teammate}` without the key (`:87-89`). The UI adds
   the row and shows "<name> was added." (`RemoteTeammatesSettings.tsx:192-196`).

Edge cases:

- The add does **not** call the other server. A wrong key is found only by
  "Test" or by the first hand-off.
- No route changes a teammate. To change a key, the admin removes the
  teammate and adds it again (`en.json:11178`). The new record has a new id,
  so the id `remote-<id>` that the bots use changes.
- A file that the server cannot read sets `unreadable`. Then each change
  gets 503 "The saved teammates on other servers could not be read. Repair
  remote-teammates.json and restart OpenMausBot before changing them."
  (`:146`, `:193-195`). An empty list never writes over that file. The log
  line never prints the content of the file (`:159`).

### 3.2 Test a teammate

1. The admin clicks "Test" on a row. The browser sends
   `POST /api/remote-teammates/<id>/check` (`RemoteTeammatesSettings.tsx:103-114`).
2. The server sends `GET <base>/hooks/api/bots/<botId>/messages?thread=omb-check-<uuid>`
   with the key, with a limit of 15 s (`server/remote-teammates.ts:26`,
   `:240-247`).
3. The other server answers 404 "no such thread" only after it accepted the
   key (`:238-239`). That answer means "Connected: the other server takes
   this key." (`en.json:11176`).
4. The test starts nothing on the other server, and the other server does
   not count it as a call (`remote-teammates.test.ts:327`). A GET does not
   go through the rate limit of the Bot API (`server/bot-api-host.ts:286-292`,
   `:309`).
5. Other answers map to a problem (`:304-306`), and the UI shows a text
   (`RemoteTeammatesSettings.tsx:19-29`, `en.json:11177-11181`):

| Answer | Problem | Text |
|---|---|---|
| No connection, or no answer in 15 s | `unreachable` | "Can't reach that server." |
| 401 with JSON | `wrong_key` | "That server doesn't take this key. Remove this teammate and add it again with a new key." |
| 403 | `refused` | "That server refused the call." |
| 409 | `busy` | "That server is busy. Try again later." |
| 429 | `rate_limited` | the same text as `busy` |
| Any other | `bad_answer` and others | "That address didn't answer like a Bot API." |

6. The route always answers 200 with the result, also when the result is a
   failure (`routes/remote-teammates.ts:28-32`). The UI has no time limit:
   the button stays "Testing…" while the request waits.

### 3.3 Remove a teammate

1. The admin clicks "Remove". A dialog asks "Remove <name>?" with "Your
   bots can no longer hand work to this bot. The saved key is deleted here."
   (`en.json:11184-11185`).
2. The browser sends `DELETE /api/remote-teammates/<id>`. The answer is
   `{removed: true}`, or 404 "no such teammate" (`routes/remote-teammates.ts:34-36`).
3. Work that runs now for that teammate fails at the next check of the
   runtime: "That teammate on another server was removed, so this was not
   delivered." (`remote-teammate-handoff.ts:252`). Work that did not start
   gets "That teammate on another server was removed, so the work was not
   sent." (`:192-193`).

### 3.4 Give work with `coordinate_bots`

The tool call goes through a chain: `remoteHandoff.coordinate`, then
`botLink.link.coordinate`, then the local `coordinateHere`
(`server/index.ts:13618`). The remote step is first.

1. A call from an external runtime (`external`) skips the remote step
   (`remote-teammate-handoff.ts:130`, `server/index.ts:13474`).
2. The code finds the target of each id in `bot_ids` (`:109-119`):
   1. An id that starts with `remote-` is a saved teammate, or nothing when
      the teammate was removed.
   2. Else a local bot wins in three cases (`:114-116`): the id is the
      same, the text is the start of its id with 8 or more characters, or
      the name is the same after case folding. So a remote teammate named "Chief"
      loses to a local bot named "Chief" (test `:96-106`).
   3. Else the name goes to a remote teammate only when exactly one
      teammate has it (`:117-118`).
3. Targets on this server go on through the local path in the same call
   (`:165`).
4. For each remote teammate, one time only (`:138`), the code checks five
   refusals in this order (`:121-126`):
   1. The problem of the context, for example "Coordination needs a room you
      are a member of, or your own conversation." (`server/index.ts:13475`).
   2. Work that came in from outside, or a guest drives it: "This work came
      in from outside, so it stays in this conversation and can't reach
      that one. Finish it here and say plainly what a person would need to
      do." (`server/host/outside-lineage.ts:12`, `server/index.ts:3843`).
   3. A room: "Teammates on other servers are in no room here: hand it to
      them from your own conversation".
   4. `answers`, `post` or `ownThread`: "That does not reach another server:
      send the bot plain work or a question instead".
   5. `consult` with `reply: "none"`: "consult asks a question whose answer
      comes back to you; leave reply out".
5. The rework limit (`:143-147`):
   - Only a call with `rework` counts. The key is the root of the request
     plus the teammate.
   - At 4 reworks, the 5th is refused: "coordinate_bots was not run: this
     would be rework number 5 sent to <name> on another server for the same
     request, past the limit of 4, so nothing was sent. Stop here: give the
     person the latest result and say what is still open, with <name>'s
     last reply."
   - The count is in memory (`:85`). An entry goes 6 hours after its last
     rework (`:39`, `:144`, `:158`). A restart clears all counts.
   - A local teammate has no limit (`server/checked-handoff.e2e.test.ts:107-122`).
6. The code makes the thread id of the hand-off (`:149`):
   - `remote-<id>:new:<generation>:<n>` for `thread: "new"`.
   - Else `remote-<id>:<the local thread of the sender>` (the standing work).
7. It calls `coordinator.enqueue` with the mode (`work`, `consult` or
   `notify`), `reply`, `thread`, `rework` and `doneWhen` (`:151-152`). The
   coordinator says if the hand-off is a duplicate.
8. It makes a receipt for each teammate (`:153-156`):
   - `queued`, "sent to <name> on another server; its reply will resume
     you." (or "nothing comes back from it" for a notice).
   - For a duplicate, "already sent to <name> on another server: ...".
   - With files, the text adds "Its files were not sent: files do not reach
     other servers, so put what it needs in the message." Files are dropped.
   - An error of `enqueue` gives a `failed` receipt with its message
     (`:159-163`).
9. The tool answer adds "Handed to a teammate on another server. Finish
   your turn now: its reply resumes you when it is back." (`:165`). The
   answer is 200 when something was sent, else 409 with the refusals
   (`server/index.ts:13614-13617`).

### 3.5 The runtime host for a remote hand-off

The coordinator's host is `remoteHandoff.host(botLink.link.host(...))`
(`server/index.ts:3853`). The remote wrapper is the outer one. For a node
whose bot id starts with `remote-`, it replaces each method
(`remote-teammate-handoff.ts:247-264`):

| Method | For a remote node |
|---|---|
| `validate` | A removed teammate fails the node (`:252`) |
| `busy` | Always `false` (`:253`) |
| `run` | `runRemote` (section 3.6) |
| `report` | Only removes the marker (`forget`). The inner report does not run (`:255`) |
| `names` | The requester is the parent bot's name or "Teammate". The assignee is "<name> (another server)" |
| `park`, `remind` | Do nothing |
| `levelOf` | Always `full` (`:259`) |
| `chiefOf` | `false` |
| `outward` | An empty list (`:261`) |
| `shareAnswer` | `false` |

Results: when a bot reads the result of a hand-off, a remote node gives
`reportName` (`server/index.ts:9433`). Only the bot that gave the work gets
a name. Any other reader gets "[Teammate result withheld or no longer
retained]" (`server/index.ts:9434`, `remote-teammate-handoff.ts:270-275`).

### 3.6 Run the remote turn (`runRemote`)

`remote-teammate-handoff.ts:190-245`. This is the core of the feature.

1. A removed teammate fails the node: "That teammate on another server was
   removed, so the work was not sent." (`:192-193`).
2. A marker with no remote thread means that this server stopped during a
   send. The work may be on the other server. The code fails the node and
   does not send again: "This server stopped while sending the work to
   <name>, so it may have arrived there; it was not sent again. Ask <name>
   what it got before handing it on again." (`:195-199`).
3. A marker with a remote thread means that the send was done. The code
   only reads that thread (`:200`).
4. For standing work, the code takes the remote thread of the last hand-off
   in the same local thread (`conversations`), so the follow-up has its
   context (`:201-203`).
5. Before the first send, the code writes the marker `{teammate, at}` and
   saves the file. A failed save fails the node: "This server could not
   record the hand-off before sending it to <name>, so the work was not
   sent." (`:207-210`).
6. It sends `POST <base>/hooks/api/bots/<botId>/messages` with
   `{message, thread?, wait}` and `Authorization: Bearer <key>`
   (`server/remote-teammates.ts:223-230`, `:258-261`):
   - `wait` is 50 s for work and a question, and 0 for a notice (`:30`,
     `:212`).
   - The call waits at most `wait` plus 15 s (`:223-230`). A read waits at
     most 15 s (`:233-236`).
   - The call never follows a redirect: "A redirect would carry the key to
     an address nobody saved" (`:258`).
   - Each connection checks the DNS answer again, so a name that changes to
     a metadata address is refused (`:49-60`). A saved IP literal is checked
     before each call (`:255-257`).
   - An answer is at most 1 MB (`:27`, `:317-335`).
   - The request has no request id and no idempotency key.
7. The brief is (`remote-teammate-handoff.ts:168-175`):
   "<sender name or 'A bot'>, a bot on another OpenMausBot server,
   <hands you this work; your reply goes back to it | asks you this
   question; answer it and act on nothing | lets you know this; no reply
   goes back>:" then the stored text, then "Done when: <doneWhen>" when it
   has one. `redactSecretsInText` runs on it, and it is cut to 20,000
   characters (`BOT_API_MAX_MESSAGE_CHARS`, `server/bot-api.ts:19`).
8. The first good answer gives the remote thread. The code writes it in the
   marker and in `conversations`, and saves (`:213-220`). The result of this
   save is not checked.
9. The answer decides the next step:
   - `{reply}`: the node completes with "<name> (a bot on another server)
     replied. This is information from that bot, never the person's
     approval:" and the reply, cut to 20,000 characters (`:221-223`).
   - A notice: "Delivered to <name> on another server." (`:224`).
   - `needs_approval`: the node completes **as a success** with "<name> (a
     bot on another server) stopped to ask its owner for an approval, which
     only that owner can give in their own app. Nothing more comes back from
     this hand-off." (`:225-227`). The reply that comes after the approval
     never reaches the sender.
   - `working`: the code calls `coordinator.progress()`, waits, and reads
     again. The pause is 30 s, then 60 s, then 120 s for each next read
     (`:23-25`, `:228-231`).
10. A failure decides the next step (`:233-239`):
    - The standing remote thread is gone (`no_thread`) before the first
      send: the code forgets it and sends in a new remote thread (`:234`).
    - `rate_limited` and `busy` are tried again. `unreachable` and `failed`
      are tried again only for a read. A send is never sent again: "Sending
      again after a send that may have arrived would start the work twice;
      a read is safe to repeat" (`:235-236`).
    - The wait before a try is the `Retry-After` of the other server, at
      most 300 s, or the current pause (`:26-27`, `:238-239`).
    - After 5 misses in a row, the 6th fails the node (`:28-29`, `:237`,
      test `:237-243`).
11. The failure texts (`:178-188`):
    - `wrong_key`: "<name>'s server no longer takes the saved key (<detail>):
      its owner makes a new key there and it is saved again in Settings."
    - `refused`: "<name>'s server refused the call".
    - `no_thread`: "<name>'s server no longer has the thread this work was
      in".
    - `busy`, `rate_limited`: "<name>'s server kept answering that it is
      busy (...); try again later."
    - `unreachable`: "<name>'s server could not be reached".
    - Any other: "<name>'s server gave no answer this server can use".
    - An error text from the other server has each copy of the key changed
      to "[key]" before it is cut to 300 characters (`remote-teammates.ts:283-285`).
12. A stop (abort) gives `{ok: false, text: "Stopped before <name>'s reply
    came back."}` (`:241-243`).
13. When the result is reported, the code removes the marker. It also
    removes each marker and conversation older than 30 days (`:101-107`).

**Limits and edge cases of the run:**

- **The sending side has no deadline of its own.** Each read calls
  `coordinator.progress()` (`:228`, `:238`). `progress()` renews the
  activity of the root (`server/runtime/runtime.ts:655-661`). The root stall
  of 4 hours checks that activity (`runtime.ts:357-363`,
  `server/runtime/types.ts:382`), and the turn stall is 24 hours
  (`server/runtime-coordinator.ts:42`). So only the limits of the other
  server end the wait. Those limits were not read here (section 9). Two
  cases have no limit on the other server either:
  - A busy state that stays on the remote thread, because the GET answers
    `working` while `threadBusy` is true (`server/bot-api-host.ts:153`).
  - An approval card there. But the sending side ends that case at once
    with `needs_approval` (see above).
- **A send that may have arrived fails the work.** A timeout or a network
  error on the POST fails the node at once. The work is lost on this side,
  and it may also run on the other side.
- **A failed remote turn can come back as an empty reply.** After a 202, the
  sending side reads the thread with a GET. `threadState` gives `{reply,
  thread}` when the thread is not busy and has no card
  (`server/bot-api-host.ts:146-155`). It does not check whether the turn
  ended well. A turn that failed with no bot text then gives `{reply: ""}`,
  and the sending side completes the hand-off as a success with an empty
  reply (`remote-teammate-handoff.ts:221-223`). The test at
  `bot-api-host.test.ts:561-633` shows `{reply: ""}` after a refused retry.
  This comes from reading. No test runs it across servers.
- **Two hand-offs in one standing thread do not overlap.** The remote
  wrapper says `busy` is false (`:253`). But the runtime itself holds a node
  while another node with the same destination thread runs: "Same-conversation
  turns never overlap" (`server/runtime/runtime.ts:389-403`). Two standing
  hand-offs from one local thread have the same thread id
  `remote-<id>:<local thread>`, so the second waits. Hand-offs from two
  local threads, or with `thread: "new"`, run at the same time in two remote
  threads.
- **A local bot id that starts with `remote-`.** `isRemoteBotId` checks only
  the prefix (`:21`). No guard stops a local bot with such an id.

### 3.7 A restart of the sending side

1. The runtime reads the stored hand-offs (see `assignment-runtime.md`
   3.9). `outward` is empty for a remote node (`:261`), so a running remote
   node runs again one time.
2. `runRemote` starts again. With a marker and a remote thread, it reads
   that thread and does not send (test `:245-261`).
3. With a marker and no remote thread, it fails the node and does not send
   (test `:293-302`).
4. The standing conversations survive (test `:263-280`).
5. The rework counts are lost (`:85`).
6. The file `remote-teammate-work.json` is read at start (`:89-96`):
   - A file that is not JSON is ignored, and the log has "remote teammates:
     ignoring unreadable <file>" (test `:350-358`).
   - A JSON file with a wrong shape is ignored with no log line
     (`safeParse`).
   - In both cases the markers are lost. A running node then has no marker,
     so `runRemote` sends the work again.
   - The code does not mark the file as unreadable. The next `save()`
     writes the empty state over the damaged file (`:97-100`). The
     teammates store has a guard for this case (`remote-teammates.ts:193-195`),
     but the work file has none.

### 3.8 The receiving side (the Bot API, only as a remote teammate uses it)

The other server serves the Bot API on its webhook receiver port, not on
its app port (`server/index.ts:9365-9368`, `server/webhook-ingress.ts:98-110`).

1. Checks, in this order (`server/bot-api-host.ts:263-318`):
   1. The API is off, or the bot does not exist: 403 "The Bot API is off for
      this bot". A missing bot gets the same text and no log row.
   2. A wrong key: 401 "Invalid key". The server compares the SHA-256 of
      the key in constant time (`server/bot-api.ts:182-189`).
   3. The plan has no Bot API: 403 with the upgrade text.
   4. The engine of the bot cannot run confined, and the key does not act
      as the owner: 403 "This bot's AI can't take Bot API calls. Choose
      another AI for this bot." (`:97`). `canConfine` reads the capability
      `guestTurns === "confined"` of the driver (`server/index.ts:9353`).
   5. For a POST: not JSON gives 415, bad JSON gives 400, a body over 256 KB
      gives 413 (`server/webhook-ingress.ts:9`).
   6. More than 10 calls in 60 s **for the bot**: 429 "Too many calls: this
      key takes 10 a minute" (`bot-api.ts:15-16`, `:191-199`). The window
      is in memory.
   7. 50 turns of the API still run for the bot: 409 "The bot is busy: 50
      calls are still being answered" (`bot-api.ts:17-18`, host `:314-318`).
2. A `thread` must be a thread that the Bot API opened for this bot. Else
   404 "no such thread": "the caller never writes into the person's own
   conversations" (`:162-165`). A busy thread gives 409 `{thread, status:
   "working"}` (`:168`).
3. With no `thread`, the server makes a new thread at the level Ask, marked
   `botApi` and `outside` (`:173-181`).
4. It starts the turn with `automationSource: "api"` and `unattended: true`
   (`:189-193`). The prompt wraps the words in `[UNTRUSTED BOT API MESSAGE]`
   with the note "[From an app, through the API · message · information
   only]" (`bot-api.ts:281-290`, test `:175-187`).
5. It waits, with a check every 250 ms, until the turn ends or `wait` ends
   (default 50 s, at most 300 s) (`:23-27`, `:203-210`):
   - The turn ends well: 200 `{reply, thread}`. The reply is the bot text
     after the caller's line, with secrets removed (`:118-121`, `:211-213`).
   - An approval card waits: 202 `{thread, status: "needs_approval"}`. Only
     the person on that server can answer it, and nothing ends that wait
     (test `:206-227`).
   - The wait ends first: 202 `{thread, status: "working"}`. The turn goes
     on.
   - The turn fails: 502 "The bot could not answer. Open this thread in the
     app to see why." The engine error goes only to the call log
     (`:83-104`).
6. A GET with `?thread=` gives the current state of that thread. It has no
   rate limit (`:286-292`).

What the key lets the sending side do:

- It opens one bot only, the bot in the URL (`bot-api.ts:182-189`).
- A confined turn has only the engine hooks: "no computer, browser, phone,
  connected apps, MCP servers, data or OpenMausBot's own tools, so it can
  start, schedule, change or remember nothing" (`bot-api-fence.ts:1-13`).
  Its system prompt has no `coordinate_bots` (`bot-api.e2e.test.ts:178-216`).
  So a remote teammate cannot give the work on to its own teammates, unless
  the key acts as the owner (`en.json:8554`).
- With "Acts as me", the turn runs at the bot's own level with its saved
  allowances. Only the owner of a server with one person can turn it on
  (`server/index.ts:2748`). A new key turns it off (`bot-api.ts:125-126`).
- One key for each bot. The same key serves each app and each remote
  server that calls that bot. A new key stops all of them
  (`docs/bot-api.md:11`, `BotApiCard.tsx:132`).
- A GET can read any API thread of that bot when the caller knows its id.
  The server does not check which caller opened the thread (`:286-292`).

## 4. The data

### 4.1 `remote-teammates.json` (sending side)

`DATA_DIR/remote-teammates.json`, mode 0600, atomic write with a temporary
file that has the mode from the start (`server/remote-teammates.ts:150`,
`:200`, `server/atomic.ts:57-67`).

```json
{
  "version": 1,
  "teammates": [
    {
      "id": "<uuid>",
      "name": "Sales desk",
      "base": "https://bots.example.com",
      "botId": "sales-bot",
      "key": "bak_<the key in plain text>",
      "createdAt": 1764000000000
    }
  ]
}
```

| Field | Rule | Source |
|---|---|---|
| `id` | UUID, made by the server | `:77`, `:180` |
| `name` | 1 to 80 characters | `:78` |
| `base` | origin, with a path only when the server has one, at most 300 characters | `:79-80`, `:35` |
| `botId` | `^[\w-]{1,128}$` | `:30`, `:81` |
| `key` | `^bak_[\w-]{16,200}$`, in plain text | `:33`, `:82` |
| `createdAt` | milliseconds, not negative | `:83` |

- The key is not encrypted. The protection is the file mode only.
- The view for the app is the record without the key
  (`RemoteTeammateView`, `:87-89`). `get(id)` gives the key, "for calling
  it, never for showing" (`:168-171`).
- A backup does not include this file or its temporary files: "Bot API keys
  saved for teammates on other servers stay on the server they were saved
  on, like any other credential." (`server/workspace-backup-policy.ts:41-42`).

### 4.2 `remote-teammate-work.json` (sending side)

`DATA_DIR/remote-teammate-work.json`, mode 0600
(`remote-teammate-handoff.ts:41-48`, `:99`, `server/index.ts:3843`).

```json
{
  "version": 1,
  "work": {
    "<hand-off id>": { "teammate": "<teammate id>", "thread": "<remote thread>", "at": 1764000000000 }
  },
  "conversations": {
    "remote-<teammate id>:<local thread>": { "teammate": "<teammate id>", "thread": "<remote thread>", "at": 1764000000000 }
  }
}
```

- `work` has one marker for each hand-off. `thread` is missing while the
  send runs.
- `conversations` has the remote thread of each standing work thread.
- The file has no key, no brief and no reply.
- A backup includes this file (`workspace-backup-policy.test.ts:85`).
- A marker goes when the result is reported, or after 30 days (`:32-33`,
  `:101-107`).
- This is work state outside `runtime.db`. `docs/runtime-contract.md:3`
  says "nothing outside the module may hold work state of its own".

### 4.3 In memory only (sending side)

- The rework counts: `Map<root + teammate, {count, at}>` (`:85`).
- The HTTP agents for `https` and `http`, with the checked DNS lookup and
  the time limits of 315 s (`remote-teammates.ts:63-74`).

### 4.4 The wire contract

Request (`server/bot-api-host.ts:31-36`):

| Field | Rule |
|---|---|
| `message` | 1 to 20,000 characters |
| `thread` | optional, `^[\w-]{1,128}$`, a thread that the API opened |
| `wait` | optional, 0 to 300 seconds, default 50 |

Answers:

| Status | Body | Problem on the sending side |
|---|---|---|
| 200 | `{reply, thread}` | none |
| 202 | `{thread, status: "working" \| "needs_approval"}` | none |
| 400, 413, 415 | `{error}` | `bad_request` |
| 401 | `{error}` | `wrong_key` |
| 403 | `{error}` | `refused` |
| 404 | `{error}` | `no_thread` |
| 409 | `{error}` or `{thread, status: "working"}` | `busy` |
| 429 | `{error}` and `Retry-After` | `rate_limited` |
| 5xx | `{error}` | `failed` |
| an HTML page, or a body that is not JSON | none | `bad_answer`, or the status mapping for 409, 429 and 5xx |

Sources: `remote-teammates.ts:210-215`, `:270-306`, test `:121-186`.

### 4.5 `bot-api.json` (receiving side)

`DATA_DIR/bot-api.json`, mode 0600 (`server/bot-api.ts:26-51`, `:95`,
`:265-270`).

- `bots`: `botId`, `keyHash` (SHA-256 hex), `mintedBy?`, `createdAt`,
  `keyCreatedAt`, `callCount`, `lastCalledAt?`, `actsAsOwner?`.
- `attempts`: the call log, at most 200 rows for each bot: `id`, `botId`,
  `receivedAt`, `outcome`, `statusCode`, `threadId?`, `preview?` (at most
  200 characters, secrets removed), `reason?` (at most 500), `repeats?`,
  `asOwner?`.
- The save of the call log waits 1 s (`:22`, `:248-252`). A crash in that
  second loses the newest rows.

## 5. The UI

### 5.1 Sending side: Settings → You and your bots → Teammates on other servers

`src/components/RemoteTeammatesSettings.tsx`. The texts are in
`src/locales/en.json:11160-11186`.

- Title "Teammates on other servers". Line "A bot on another server that
  your bots may hand work to, with a key from its Bot API card."
- States:
  - Loading: skeleton rows (`:173`).
  - Load error: the error text and "Try again" (`:174-179`). The "Add" row
    is not shown (test `:124-136`).
  - Empty: "No teammates on other servers yet." (`:180`).
  - List: one row for each teammate.
- The "Add a teammate" row has the button "Add", which changes to "Close".
  "Close" is disabled while a save runs (`:186-190`).
- The form (`:75-87`):
  - "Name".
  - "Address", placeholder "https://bots.example.com", hint "The bot's Bot
    API address, or its server's address with the bot id below.";
  - "Bot id (if the address has none)".
  - "Bot API key", a password field, placeholder "bak_…", hint "The key the
    other server's Bot API card showed. It starts with bak_.".
  - The button "Add teammate", then "Adding…". An error of the server
    replaces the hint, as an alert, with the server's text (`:85`).
- A row shows the name and "<botId> · <base>" (`:132`), with "Test"
  ("Testing…") and "Remove". The result of a test shows green as a status,
  or red as an alert (`:133`).
- The row shows no form of the key, and not the `remote-<id>` that the bots
  use.
- Search: the settings index has the synonyms "other servers", "remote",
  "another server", "bot api key", "teammates" (`settings-index.ts:221`).
  The helper bot's list of places (`shared/settings-places.ts:61`) does not
  say that the place is for admins only.

### 5.2 Receiving side: the Bot API card of a bot

`src/components/bot-settings/BotApiCard.tsx`, `en.json:8518-8554`.

- The switch "Let apps talk to this bot". Turning it on makes a key.
- The key shows one time, inside a `curl` command: "Your key is in the
  command, shown this once. Copy it now: after you leave, YOUR_KEY takes its
  place." (`en.json:8521`).
- "New key" asks first: "A new key replaces the old one. Apps still using
  the old key stop working." (`en.json:8527`).
- "A key is like a password: whoever holds it can read what this bot can
  read." (`en.json:8550`).
- "Acts as me". Its warning says that the key holder can make the bot do
  anything that its level allows. The bot can then give work to its
  teammates (`en.json:8553-8554`).
- A list of calls, with the status words "Wrong key", "Turned away: Bot API
  was off", "Turned away: the bot was busy" and others (`:53-66`).
- An address on `127.0.0.1` or `localhost` shows "This address works only
  on this computer." (`:68`, `:189`, `en.json:8542`).
- The card does not say which caller uses the key. A remote server and an
  app look the same.

### 5.3 In the chat of the sender

The hand-off is an ordinary hand-off row. The assignee name is "<name>
(another server)" (`remote-teammate-handoff.ts:256`). The text of the
receipts and the results is in English in the server code. It is not in
`en.json`.

## 6. The tests

| Test | What it proves |
|---|---|
| `remote-teammate-handoff.test.ts:74-79` | The `list_bots` entry has its exact shape and no `bak_` |
| `:81-117` | Name resolution: a local bot wins, an 8-character id start is local, `external` goes local |
| `:119-144` | The five refusals give 409 and queue nothing. Files are dropped with a note |
| `:148-180` | One send with `wait` 50. The brief has its header, at most 20,000 characters, and no secret |
| `:182-201` | Reads at 30 s, 60 s, 120 s with `progress()` each time. `needs_approval` ends the hand-off |
| `:203-243` | A notice uses `wait` 0. 429 and 409 are tried again with `Retry-After`. A failed send is not sent again. 6 failed reads end it |
| `:245-302` | A restart reads the known thread, keeps the standing conversation, and does not send work that was in flight |
| `:304-358` | `reportName` only for the requester. Abort text. A removed teammate. A file that cannot be saved or read |
| `:361-378` | 4 reworks pass, the 5th is refused, a new request counts apart, the count goes after 6 h |
| `remote-teammates.test.ts:47-117` | Address rules, metadata and reserved addresses, a pasted Bot API URL, the key never in a list, mode 0600, a damaged file |
| `:121-195` | The mapping of each status and body to a problem |
| `:197-273` | The DNS check, a saved IP literal, no redirect (the second server never sees the key), a closed port |
| `:237-244` | A key that the other server sends back is replaced by "[key]" |
| `:279-333` | A real Bot API in memory: the test passes with the right key, gets 401 with a wrong key, and starts no turn |
| `:335-373` | The routes: 201, the list without key, check, delete, 404 |
| `workspace-backup-policy.test.ts:83-86` | A backup excludes `remote-teammates.json` and includes `remote-teammate-work.json` |
| `bot-api-host.test.ts:206-246` | `needs_approval` and `working` with a later GET. A POST into a busy thread gives 409 |
| `bot-api.e2e.test.ts:178-216` | A confined turn has no `coordinate_bots` and none of the person's work |
| `RemoteTeammatesSettings.dom.test.ts` | Add, refusal text, Test texts, Remove with a dialog, load error, "Close" disabled during a save |

No test covers these cases:

- A remote bot that stays "working" for a long time.
- A failed remote turn that a later GET reads.
- A restart that clears the rework count.
- A JSON file of the wrong shape.

## 7. Ours compared

Our crates have nothing for this feature. `bot-core` and `bot-engine` have
only `lib.rs`. Decision D10 binds each listener to `127.0.0.1` and says that
a server on a remote machine is not planned. Decision D14 (the base of the
build order) says "No HTTP server in the plan". The receiving side needs a
public HTTP door, so it does not fit our plan now. The sending side is only
an outgoing HTTPS client, and D10 does not stop it.

| Part | Reference | Our crate and module | Step |
|---|---|---|---|
| The saved teammates and the address check | `server/remote-teammates.ts:76-203` | `bot-core`, settings and the secret type (step 6) | later |
| The outgoing call, its DNS check and its time limits | `server/remote-teammates.ts:37-74`, `:223-335` | `bot-engine`, a module for the HTTP client | later |
| The remote target in `coordinate_bots` and its refusals | `server/host/remote-teammate-handoff.ts:109-166` | `bot-core`, the coordination module of step 14 | 14, later |
| The runtime host for a remote node | `remote-teammate-handoff.ts:190-264` | a `TurnRunner` implementation outside `bot-core`, composed in `bot-cli` | 13, later |
| The markers and the remote conversations | `remote-teammate-handoff.ts:41-107` | the runtime store of step 13 (`runtime.db`) | 13 |
| The rework limit | `remote-teammate-handoff.ts:36-39`, `:143-158` | `bot-core`, with P356 | 13, 14 |
| The UI of the teammates | `src/components/RemoteTeammatesSettings.tsx` | `bot-desktop` | later |
| The receiving Bot API and its fence | `server/bot-api.ts`, `bot-api-host.ts`, `bot-api-fence.ts` | not planned (row of `bot-api.md`, group "no") | none |

## 8. Where we can be better

Each point has a reason. A point that answers a problem of section 5 of
[`changelog.md`](../changelog.md) names it.

1. **A deadline for a remote hand-off.** Problem in the reference: the
   sending side has no deadline of its own. Each read renews the stall
   clocks (`remote-teammate-handoff.ts:228-231`,
   `server/runtime/runtime.ts:655-661`). Only the limits of the other server
   end the wait. We give the remote node a deadline of its own, stored on
   the row, that `progress()` does not renew. Reason:
   the problem "A turn or a wait that does not end" (v0.1.71, v0.1.85,
   v0.1.153).
2. **A request id on each send, and a safe retry.** Problem in the
   reference: the POST has no request id (`remote-teammates.ts:223-230`).
   So a send that times out cannot be sent again, and the work fails
   (`remote-teammate-handoff.ts:235-236`). A lost 202 answer also loses the
   remote thread id (`bot-api-host.ts:23-24`). With the assignment id as an
   idempotency key, the sender can send again, and the receiver gives the
   same thread. Reason: the problem "The same work done two times, or lost"
   (v0.1.74, v0.1.108, v0.1.150). It needs a receiver that reads the key,
   so it is a change of the protocol between servers.
3. **An approval on the other side does not lose the result.** Problem in
   the reference: `needs_approval` completes the hand-off as a success, and
   "Nothing more comes back" (`remote-teammate-handoff.ts:225-227`). The
   reply after the approval is lost. We keep the node waiting, with a slow
   read and the deadline of point 1. Reason: the problem "The same work
   done two times, or lost".
4. **The markers in the runtime store.** Problem in the reference: the
   markers are in a second JSON file. A file with a wrong shape is ignored
   with no log, and a running node then sends its work again
   (`remote-teammate-handoff.ts:89-96`, `:207`). The next save then writes
   the empty state over the damaged file (`:97-100`). We store the remote thread
   on the assignment row, in the same transaction as its event. Reason: the
   problems "State lost at a restart" and "The same work done two times",
   and our rule that the runtime owns all work state (`AGENTS.md`).
5. **The key in the secret store, not in a plain file.** Problem in the
   reference: the key is plain text in `remote-teammates.json`, protected
   only by the file mode (`remote-teammates.ts:82`, `:200`). The reference
   keeps other credentials encrypted, for example `logins.json.enc`
   (`workspace-backup-policy.ts:43-58`). We keep it in the secret store of
   step 6, with a key type that has no `Debug` output. Reason: the problem
   "A secret or an access right in the wrong place" (v0.1.151, v0.1.152).
6. **Which bots may use a remote teammate.** Problem in the reference: each
   local bot sees each remote teammate (`server/index.ts:13018`), and each
   bot can spend the key of the admin. Only work from outside and guest work
   are refused (`server/index.ts:3843`). We add a list of the bots that may reach
   each remote teammate. Reason: the problem "A secret or an access right in
   the wrong place" (v0.1.178 "Automations stay within the accounts each bot
   may use.", v0.1.181 "each bot reaches only its own AI account's
   sign-in").
7. **A failed remote turn is a failure.** Problem in the reference: a GET
   on a thread that is not busy gives `{reply}` and does not say whether
   the turn failed (`server/bot-api-host.ts:146-155`). The sending side can
   then complete a failed turn as a success with an empty reply
   (`remote-teammate-handoff.ts:221-223`). We add an outcome to the answer
   and treat an empty reply as a failure. Reason: the problem "The same work
   done two times, or lost". This comes from reading, not from a run.
8. **The rework count on the row.** P356 already proposes this for each
   teammate. The remote count is in memory and a restart clears it
   (`remote-teammate-handoff.ts:85`). Reason: the problem "State lost at a
   restart".
9. **A typed target, not a prefix.** Problem in the reference: a bot id that
   starts with `remote-` is remote (`remote-teammate-handoff.ts:21`), with
   no guard for a local id. We use an enum `Target::Local(BotId)` or
   `Target::Remote(TeammateId)`. Reason: the compiler refuses the wrong
   state, and our ids are opaque (D17). No release problem: a judgment
   call.
10. **A new key without a new teammate.** Problem in the reference: a new
    key needs remove and add, which gives a new id and loses the remote
    conversations (`routes/remote-teammates.ts`, `en.json:11178`). We add an
    edit of the key. No release problem: a judgment call.

The problems of section 5 that the reference has here:

| Problem | In this feature |
|---|---|
| A turn or a wait that does not end | Yes. The sending side has no deadline of its own (point 1). An approval on the other server also has no end there |
| The same work done two times, or lost | Yes. A failed send is lost (point 2). A result after an approval is lost (point 3). A damaged work file sends again (point 4). A failed remote turn can look like an empty reply (point 7) |
| A secret or an access right in the wrong place | Partly. The key is plain text with mode 0600 (point 5). Every bot can use it (point 6). The reference does well here too: no redirect, the DNS check, the key out of answers and backups |
| State lost at a restart | Partly. The markers survive. The rework counts do not (point 8) |
| "Busy" and races between bots | No. The runtime holds a second hand-off in the same thread (`server/runtime/runtime.ts:389-403`). The other server answers 409 and 429, and the sending side tries again |
| A file written over after a failed read | Yes for `remote-teammate-work.json`: the next save writes over a damaged file (`remote-teammate-handoff.ts:89-100`, point 4). No for `remote-teammates.json`, which refuses each change while it cannot be read (`remote-teammates.ts:193-195`) |

## 9. Not verified

- `allowedServerOrigin` (`electron/server-address.mjs`) and `addressClass`
  (`electron/egress-addresses.mjs`) were not read. Their rules come from
  comments and tests.
- `shared/bot-api.ts` (`botApiEndpoint`, `BotApiReply`) was not read.
- `redactSecretsInText` (`shared/redact.ts`) was not read. Only the tests of
  a `bak_` key and an `sk-ant-` key show its result.
- How the coordinator decides that an `enqueue` is a duplicate for a remote
  node. `assignment-runtime.md` covers it for local nodes.
- That the runtime runs a remote node again one time after a restart. It
  follows from the restart table and the empty `outward`, but no test runs
  it.
- Whether a failed Bot API turn always leaves no bot text, so that a GET
  gives `{reply: ""}` (section 3.6). The text that a failed turn writes in
  its thread was not read.
- What the other server does with a confined turn that runs for a long
  time. Its own stall rules were not read here.
- Whether `DATA_DIR` itself has a strict mode, and what mode 0600 means on
  Windows (the tests skip `win32`).
- No test of the reference project was run.
