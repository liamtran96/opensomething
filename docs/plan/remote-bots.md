# Plan: Bot to bot across servers

The proposals from the research file
[`../research/features/remote-bots.md`](../research/features/remote-bots.md)
(batch 12, reference commit `42f86aefd`). The steps, the pull requests and
the order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** none yet. P669 decides the scope. P670 and P671 go to step 13,
  P678 to step 14, and P675 to step 6. P677 extends P356. P672, P673, P674,
  P676 and P679 wait for the step that P669 gives.
- **State:** all open. Decide P669 first. The receiving side is a Bot API
  that another server must reach, and D10 binds each listener to
  `127.0.0.1`. The sending side is only an outgoing HTTPS client.
- **The main finding:** an admin saves a teammate on another server with
  its address and a Bot API key (`server/remote-teammates.ts`). A local bot
  gives it work with `coordinate_bots` to a bot id that starts with
  `remote-` (`server/host/remote-teammate-handoff.ts:21`). The sending side
  writes a marker before each send, then reads the remote thread with a
  backoff. Each read renews the progress of the node, so only the limits of
  the other server end the wait (`remote-teammate-handoff.ts:228-231`). An
  approval on the other server completes the hand-off as a success, and
  "Nothing more comes back" (`:225-227`).

## Proposals

They are in order of importance. Decide P669 first: each other proposal waits for its answer.

### P669. A decision: the scope of this feature (`docs/decisions.md`)

- **Problem in the reference:** the feature needs two sides. The receiving
  side is a Bot API that another server must reach. The reference serves it
  on its webhook receiver port (`server/index.ts:9365-9368`,
  `server/webhook-ingress.ts:98-110`, `server/bot-api-host.ts:248-335`). Our
  D10 binds each listener to `127.0.0.1` and says that a server on a remote
  machine is not planned. Our D14 says "No HTTP server in the plan". The
  sending side is only an outgoing HTTPS client
  (`server/remote-teammates.ts:223-335`). D10 does not stop that.
- **Reason:** without this decision, each other proposal of this file has no
  step. The row of `bot-api.md` in `reference-features.md` is in the group
  "no" (not planned), so the receiving side is already out.
- **Options:**
  - (a) The whole feature stays "later". Record that the receiving Bot API
    is not planned under D10 and D14. Recommended: we have no server of our
    own that a remote bot can call, and the sending side alone can talk only
    to a server of the reference project.
  - (b) Build the sending side only, as a client of the Bot API of the
    reference project. Record that the outgoing call is permitted by D10
    and that the receiving side stays not planned.
- **Release problem:** none. This is a scope decision, not a fix.
- **Change to `docs/decisions.md`:** a new decision with "What" (option a or
  b), "Why" (D10, D14, the group "no" of the Bot API) and "References"
  (`docs/bot-api.md:138-189`, `server/host/remote-teammate-handoff.ts`,
  `server/remote-teammates.ts`, `server/bot-api-host.ts`).

### P670. A deadline for remote work that `progress()` does not renew (step 13)

- **Problem in the reference:** the sending side has no deadline of its own.
  While the other server answers "working", the loop reads again after
  30 s, 60 s, then each 120 s (`server/host/remote-teammate-handoff.ts:23-25`,
  `:228-231`). Each read calls `coordinator.progress()` (`:228`, `:238`).
  `progress()` renews the activity of the root
  (`server/runtime/runtime.ts:655-661`). The root stall of 4 hours checks
  that activity (`runtime.ts:357-363`, `server/runtime/types.ts:382`). The
  turn stall is 24 hours (`server/runtime-coordinator.ts:42`). So only the
  limits of the other server end the wait. A busy state that stays on the
  remote thread gives "working" with no end (`server/bot-api-host.ts:153`).
- **Section 5 theme:** "A turn or a wait that does not end" (v0.1.71
  "Recover a thread whose resume never answers", v0.1.85, v0.1.153 "closes
  after three, instead of waiting forever").
- **Reason:** the deadline of the hand-off is then a fact on the row that
  survives a restart, not a side effect of the activity clocks.
- **Options:**
  - (a) A general deadline on each assignment row, set at enqueue, that no
    progress renews. Remote work gets a default (for example 24 hours).
  - (b) A deadline only for remote nodes, inside the remote runner.
  - Recommended: (a). The runtime of step 13 owns all work state, and one
    rule covers local and remote work.
- **Change to `docs/plan/README.md`:** step 13 gets the proposal. The row
  "A turn or a wait that does not end" of the table "The problems of the
  reference, and the proposals" gets its P-number.

### P671. The remote thread id on the assignment row, in one transaction (step 13)

- **Problem in the reference:** the sending side keeps its "sent" markers
  and the remote conversations in a second file,
  `remote-teammate-work.json` (`server/host/remote-teammate-handoff.ts:41-48`,
  `server/index.ts:3843`). It writes the marker before the send (`:207-210`).
  At start, a file that is not JSON is ignored with a log line, and a JSON
  file with a wrong shape is ignored with no log line (`:89-96`). The code
  does not mark the file as unreadable, so the next `save()` writes the
  empty state over the damaged file (`:97-100`). A running node then has no
  marker, and `runRemote` sends the work again (`:195-210`). The result of
  the save after the first answer is not checked (`:219`).
  `docs/runtime-contract.md:3` says "nothing outside the module may hold work
  state of its own".
- **Section 5 themes:** "The same work done two times, or lost" (v0.1.74
  "prevent duplicate jobs across restarts", v0.1.108 "never append or rerun a
  queued send twice after a crash"). "State lost at a restart" (v0.1.24,
  v0.1.165). "A file written over after a failed read" (v0.1.103, v0.1.107,
  v0.1.151).
- **Reason:** one store, and the row and its event in one transaction
  (`AGENTS.md`). A failed read of the store is a typed error, and no save is
  possible after it (`changelog.md` section 7).
- **Options:**
  - (a) A field `remote_thread` (or a general "outward reference") on the
    assignment row, and a table of remote conversations in `runtime.db`.
    Recommended.
  - (b) Follow the reference: a separate file, but with the "unreadable"
    guard that `server/remote-teammates.ts:193-195` has.
- **Change to `docs/plan/README.md`:** step 13. Three rows of the problems
  table: "The same work done two times, or lost", "State lost at a
  restart", "A file written over after a failed read".

### P672. An approval on the other side does not end the hand-off (step 14, later)

- **Problem in the reference:** when the other server answers
  `needs_approval`, the sending side completes the hand-off as a success:
  "<name> (a bot on another server) stopped to ask its owner for an
  approval, which only that owner can give in their own app. Nothing more
  comes back from this hand-off." (`server/host/remote-teammate-handoff.ts:225-227`).
  The other server keeps the turn and runs it after the approval
  (`server/bot-api-host.test.ts:206-227`). The reply after the approval
  never reaches the sender.
- **Section 5 theme:** "The same work done two times, or lost" (v0.1.83
  "send each teammate result once", v0.1.178 "a hand-off whose file went
  missing is still delivered").
- **Reason:** the result comes back to the bot that asked for it.
- **Options:**
  - (a) Keep the node waiting. Read the remote thread at a slow pace,
    within the deadline of P670. Tell the sender that the work waits for an
    approval there. Recommended.
  - (b) Follow the reference, and add the text "ask again later" to the
    result.
- **Change to `docs/plan/README.md`:** the proposal of this feature, with
  the step of P669. Row "The same work done two times, or lost".

### P673. A failed remote turn is a failure, not an empty reply (later)

- **Problem in the reference:** after a 202, the sending side reads the
  thread with a GET. `threadState` gives `{reply, thread}` when the thread
  is not busy and has no card. It does not check whether the turn ended
  well (`server/bot-api-host.ts:146-155`). A turn that failed with no bot
  text gives `{reply: ""}`. The sending side then completes the hand-off as
  a success with an empty reply (`server/host/remote-teammate-handoff.ts:221-223`).
  The test `server/bot-api-host.test.ts:561-633` shows `{reply: ""}` after a
  refused retry. This comes from reading. No test runs it across servers.
- **Section 5 theme:** "The same work done two times, or lost".
- **Reason:** the sender must know that the work failed, so that it can
  report it or try again.
- **Options:**
  - (a) A typed outcome in the answer (replied, failed, waiting), and an
    empty reply counts as a failure on the sending side. Recommended.
  - (b) Only the sending side check: an empty reply is a failure.
- **Change to `docs/plan/README.md`:** with P672. Row "The same work done two
  times, or lost".

### P674. A request id on each send (later, a protocol change)

- **Problem in the reference:** the POST has only `{message, thread?,
  wait}`. It has no request id and no idempotency key
  (`server/remote-teammates.ts:223-230`, `server/bot-api-host.ts:31-36`).
  The receiver also ignores the header `idempotency-key`: the Bot API door
  returns before that code (`server/webhook-ingress.ts:77-84`, `:98-110`).
  So the sending side never sends again after a timeout or a network error
  on a send, and the work fails at once
  (`server/host/remote-teammate-handoff.ts:235-236`). A lost 202 answer also
  loses the remote thread id (`server/bot-api-host.ts:23-24`).
- **Section 5 theme:** "The same work done two times, or lost" (v0.1.108,
  v0.1.150 "A Claude turn is never sent twice").
- **Reason:** with the assignment id as the key, the sender can send again,
  and the receiver gives the same thread. A network error then does not
  lose the work.
- **Options:**
  - (a) The sending side sends the assignment id as `Idempotency-Key`, and
    our receiver (if we build one) gives the same thread for the same key.
  - (b) Follow the reference: no retry of a send.
  - The reference receiver does not read the key, so (a) helps only between
    two of our servers. With P669 option (b), only (b) is possible.
- **Change to `docs/plan/README.md`:** with P669. Row "The same work done two
  times, or lost".

### P675. The remote key in the secret store (step 6)

- **Problem in the reference:** the key is plain text in
  `remote-teammates.json`, protected only by the file mode 0600
  (`server/remote-teammates.ts:1-3`, `:82`, `:200`). The reference keeps
  other credentials encrypted, for example `logins.json.enc`
  (`server/workspace-backup-policy.ts:43-58`). It does well in other places:
  no redirect (`:258`), the DNS check on each connection (`:49-60`), the key
  out of each answer (`:87-89`, `:283-285`) and out of backups
  (`server/workspace-backup-policy.ts:41-42`).
- **Section 5 theme:** "A secret or an access right in the wrong place"
  (v0.1.151, v0.1.152 "provider keys in the encrypted store of the
  desktop").
- **Reason:** one secret store for all keys, with a key type that has no
  `Debug` output of its value (`changelog.md` section 7).
- **Options:**
  - (a) The key goes in the secret store of step 6. The settings file keeps
    only a reference. Recommended.
  - (b) Follow the reference: a file with mode 0600, and keep the other
    protections.
- **Change to `docs/plan/README.md`:** step 6 gets a note for this key
  type. Row "A secret in the wrong place".

### P676. Which local bots may reach a remote teammate (step 14, later)

- **Problem in the reference:** `list_bots` adds each remote teammate for
  each caller, with no filter for the sender (`server/index.ts:13018`). So
  each local bot can spend the key of the admin. Only work from outside and
  guest work are refused (`server/index.ts:3843`,
  `server/host/outside-lineage.ts:12`).
- **Section 5 theme:** "A secret or an access right in the wrong place"
  (v0.1.178 "Automations stay within the accounts each bot may use.",
  v0.1.181 "each bot reaches only its own AI account's sign-in").
- **Reason:** the admin decides which bots may use a key, as for the
  accounts of connected apps.
- **Options:**
  - (a) A list of the bots that may reach each remote teammate. The default
    is all bots, so the default follows the reference. Recommended.
  - (b) Follow the reference.
- **Change to `docs/plan/README.md`:** with P669. Row "A secret in the wrong
  place".

### P677. The rework count on the row, also for a remote teammate (extend P356)

- **Problem in the reference:** the remote rework count is in memory, keyed
  by the root of the request and the teammate
  (`server/host/remote-teammate-handoff.ts:85`, `:143`). A restart clears it.
  The window of 6 hours starts again at each rework, because `at` changes
  on each send (`:39`, `:144`, `:158`). The test of `:361-378` does not
  cover a restart.
- **Section 5 theme:** "State lost at a restart".
- **Reason:** P356 already proposes a stored count for each teammate. This
  adds the remote case and the window rule.
- **Options:**
  - (a) Add the remote teammate and the 6-hour window to P356. Recommended.
  - (b) No change to P356, and a separate proposal when P669 gives a step.
- **Change:** `docs/plan/chat-and-teams-site.md`, P356 (see "New facts"
  below). Row "State lost at a restart".

### P678. A typed target in `coordinate_bots` (step 14)

- **Problem in the reference:** an id that starts with `remote-` is a remote
  teammate (`server/host/remote-teammate-handoff.ts:18-21`). No guard stops
  a local bot whose id starts with `remote-`. Name resolution has three
  rules for a local win (`:109-119`).
- **Section 5 theme:** none. A judgment call. The author can keep the
  reference.
- **Reason:** the compiler refuses the wrong state, and our ids are opaque
  (D17).
- **Options:**
  - (a) `enum Target { Local(BotId), Remote(TeammateId) }` in the call
    after resolution. Recommended.
  - (b) Follow the reference: a prefix in a string id.
- **Change to `docs/plan/README.md`:** step 14 gets a note, so that the
  type has room for a later remote target. Judgment-call list of the
  problems table.

### P679. A new key without a new teammate (later)

- **Problem in the reference:** no route changes a teammate. To change the
  key, the admin removes the teammate and adds it again
  (`server/routes/remote-teammates.ts:13-36`, `src/locales/en.json:11178`).
  The new record has a new id (`server/remote-teammates.ts:180`). So the
  `remote-<id>` that the bots know changes, and the remote conversations of
  the old id are lost (`server/host/remote-teammate-handoff.ts:201-203`).
- **Section 5 theme:** none. A judgment call.
- **Reason:** a key changes more often than the teammate.
- **Options:**
  - (a) An edit of the key that keeps the id. Recommended.
  - (b) Follow the reference.
- **Change to `docs/plan/README.md`:** with P669. Judgment-call list.

## New facts for open proposals and done research

Each fact goes to the plan file of its proposal when the author decides it. The facts for done research files go into the record pull request of batch 12.

- **P356** (`docs/plan/chat-and-teams-site.md:77-84`): the remote count is
  keyed by the root of the request and the teammate
  (`server/host/remote-teammate-handoff.ts:143`). The window of 6 hours is
  counted from the last rework, not the first (`:144`, `:158`). Its source
  line `:36-38` is correct. Add `:143-158`.
- **P357** (`message_person`): the v0.1.182 fix "a bot asked to reach
  another bot no longer leaves the request in your Inbox and waits forever"
  is commit `f1b3664bb` (2026-11-26). It changes
  `server/host/message-person-bots.ts`, `server/host/team-messages.ts` and
  `server/bot-link/link.ts`. A `message_person` call with a bot's name is
  refused, not put in the person's Inbox. It is a fact for P357, not for
  this feature.
- **`assignment-runtime.md`, section 9:** the wrapper `remoteHandoff.host`
  is now read (`server/host/remote-teammate-handoff.ts:247-264`). For a
  remote node: `busy` is false, `levelOf` is `full`, `outward` is empty,
  `report` only removes the marker, and `park` and `remind` do nothing. The
  runtime still holds a second node with the same destination thread
  (`server/runtime/runtime.ts:389-403`).
- **`agent-tools.md`:** `list_bots` adds the remote teammates for each
  caller with no filter (`server/index.ts:13018`), unlike the linked bots,
  which `linkedRoster.reaches` filters.
- **`docs/comparison.md`, the Bot API row:** confirmed. The key is `bak_`
  plus 32 random bytes in base64url, and only its SHA-256 is in
  `bot-api.json` with mode 0600 (`server/bot-api.ts:76-82`, `:95`,
  `:265-270`). Add: the limit of 10 calls in 60 s is for each bot, not for
  each caller (`:191-199`), and a GET is not counted
  (`server/bot-api-host.ts:286-292`, `:309`).
- **`chat-and-teams-site.md`:** the release note of v0.1.178
  (`announcements/releases.json:294`) says "A teammate on another server
  gets at most 4 redos per request." `docs/bot-api.md` does not say it.

## Changes to `docs/decisions.md` after the author decides

1. A new decision for P669: the scope of bot to bot across servers.
   Recommended text: "The feature stays later. The receiving Bot API is not
   planned, because D10 binds each listener to `127.0.0.1` and D14 has no
   HTTP server. An outgoing call to another server is permitted by D10."
   References: `docs/bot-api.md:138-189`,
   `server/host/remote-teammate-handoff.ts`, `server/remote-teammates.ts`,
   `server/bot-api-host.ts:248-335`, `server/index.ts:9365-9368`.
2. No other decision changes. D17 already supports P678.
