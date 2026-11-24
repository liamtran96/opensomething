# Question cards: a bot asks the person, and the answer goes back to the turn

This file is for the feature row "Question cards: a bot asks the person with
buttons or a reply field; on a Team Cloud, a copy goes to the Inbox" of
[`../reference-features.md`](../reference-features.md). It is for step 10 of
[`../../plan/README.md`](../../plan/README.md).

- **Reference commit:** `ad27f0716`. Each line number in this file is at
  that commit.
- **Method:** six subagents read six groups of files (protocol and data,
  host routing, drivers, server wiring, UI, documents). Each one read its
  files completely or in recorded ranges. A seventh subagent checked about
  60 key claims against the code and settled the contradictions between the
  reports. The main session then read the key lines again (section 2,
  "Checks of the main session").
- **Scope:** this file owns the question card. It covers how a bot asks,
  the data of the card, and how the card reaches the window. It also covers
  how the answer goes back to the turn, and what happens when nobody
  answers. The approval card (a
  permission request) belongs to the feature `approval-cards`. This file
  names only the places where the code separates the two. The Inbox copy on
  a Team Cloud is out of our plan. This file records only what it is, its
  files and its lines.
- **What this file adds to earlier research:**
  [`approval-levels.md`](approval-levels.md) section 3.11 and
  [`security-model.md`](security-model.md) (both read at `ed8cb7278`) have a
  short summary of questions. This file confirms that summary at
  `ad27f0716` and adds:
  - a correction: "a question has no time limit" is not true on every path.
    The ACP `interaction_` question still has a 15-minute timer
    (`server/drivers/acp/core.ts:673-676`). The fix of v0.1.126 did not
    change that file.
  - the eight engine mechanisms and their answer shapes (section 3.2)
  - each way a question card closes, and the exact 72-hour formula
  - what happens at a restart, and the late answer with its guards
  - three drivers that report the wrong outcome (Pi, Codex async, Codex
    sync)
  - the UI of the card, its states and its text
  - the line numbers that moved since `ed8cb7278`.

Quoted strings from the code that have the product name of the reference
show it as `<product>`.

## 1. In short

A bot sometimes needs a decision that only the person can make: which file,
which region, yes or no. The bot asks a **question**. The window shows a
**question card**. The card has the question and one button for each
**option** (a choice that the bot gives). It also has a **reply field**
where the person can type their own words. The answer goes back to the bot, and the bot continues.

The special terms:

- **Question card:** a chat row of kind `options` with a card that has a
  `requestId` and no `tool`. It is different from an **approval card**,
  which asks "allow or deny" for an action and has a `tool`.
- **Ask tool:** the tool of an engine that asks the person. It is
  `ask_user` (an MCP tool, or a function tool on the chat API), or the
  engine's own tool. Examples: `AskUserQuestion` of the Claude CLI,
  `requestUserInput` of Codex, `cursor/ask_question` of Cursor.
- **Live question:** a question that a running turn waits on. The engine
  holds the tool call open until the answer comes.
- **NEEDS INPUT:** a second way to ask. A bot that does work for another bot
  ends its reply with a line `NEEDS INPUT: <question>`, and optionally
  `Default: <answer>`. The turn ends, and the work **parks** (it waits in
  the status `needs_input`). The server makes a card from the line.
- **Handed-on work:** work that one bot gave to another bot. Its record is
  an **assignment** in `runtime.db`. A **root** is the top assignment: the
  bot's own conversation with the person.
- **Persistent question:** the reference's name for a question card that
  stays open after its turn ends. Only the person can settle it.
- **Late answer:** an answer that comes after the turn that asked is gone.
  The server sends it to the bot as the person's next message.
- **Settle:** mark the card as done (answered, closed, stopped or expired).
- **Inbox (Team Cloud):** on a Team Cloud, each person has an Inbox chat.
  A copy of a question for that person goes there. Out of our plan.

The main rules of the reference:

1. No approval level answers a question for the person. The one exception
   is at Full access, in handed-on work (section 3.6).
2. A question card has no timer on most paths. Only the answer of a person
   settles it (`packages/phone-protocol/src/ask-question.ts:63-65`).
3. Handed-on work that waits on the person gets one reminder after one day
   and closes after three days (`server/runtime-coordinator.ts:44-46`). A
   root waits with no limit.
4. After a turn ends or the server restarts, the card stays open. An answer
   then becomes a late answer: a new message to the bot.

## 2. Files read completely

Paths are relative to the reference clone. The number is the line count.

**Protocol and data**

- `packages/phone-protocol/src/ask-question.ts` (400)
- `shared/ask-question.ts` (1, a re-export)
- `shared/ask-question.test.ts` (475)
- `packages/phone-protocol/src/runtime-events.ts` (213)
- `packages/phone-protocol/src/live-approval.ts` (145), `shared/live-approval.ts` (1)
- `shared/person-wait.ts` (97)
- `server/runtime/questions.ts` (33), `server/runtime/questions.test.ts` (23)
- `server/runtime/types.ts` (402, in two ranges that cover all lines)
- `server/card-dismissal.ts` (18), `server/card-dismissal.test.ts` (39)
- `server/request-card.ts` (34)
- `src/lib/question-card.ts` (5), `src/lib/card-answer.ts` (25)

**Host: routing, parking and waiting**

- `server/host/ask-cards.ts` (335), `server/host/ask-cards.test.ts` (472)
- `server/host/question-routing.ts` (202), `server/host/question-routing.test.ts` (354)
- `server/question-routing.e2e.test.ts` (283)
- `server/waiting-on-person.ts` (86), `server/waiting-on-person.test.ts` (118)
- `server/runtime-coordinator.ts` (773)
- `server/person-replies.ts` (138)
- `server/guarded-requests.ts` (63)

**Drivers**

- `server/drivers/codex-questions.ts` (58)
- `server/drivers/acp/question-requests.ts` (64)
- `server/drivers/chat-tool-approval.ts` (122)
- `server/permission-proxy.ts` (263)
- `server/drivers/acp/capabilities.ts` (23)

**Server wiring and end-to-end tests**

- `server/question-cards.e2e.test.ts` (229)
- `server/parked-cards.e2e.test.ts` (127)
- `server/late-question-source.e2e.test.ts` (81)
- `server/late-question-today.e2e.test.ts` (72)
- `server/room-question-tasks.e2e.test.ts` (155)
- `server/routes/bot-messages.ts` (874)
- `server/thread-events.ts` (274)
- `server/today.ts` (344)
- `server/reactions.ts` (156)

**UI**

- `src/components/QuestionCard.tsx` (301), `QuestionCard.test.ts` (227), `QuestionCard.answer.test.ts` (162)
- `src/components/AskCard.tsx` (363), `AskCard.test.ts` (171)
- `src/components/OptionCard.tsx` (125), `OptionCard.test.ts` (139)
- `src/components/OptionsCardRow.tsx` (51), `OptionsCardRow.test.ts` (39)
- `src/components/bot-buttons.test.ts` (114)
- `src/question-cards-preview.tsx` (145), `question-cards-preview.html` (12)
- Inbox, record only: `src/components/inbox/inbox-answer.ts` (95),
  `inbox-view.ts` (86), `InboxAnswer.tsx` (110), `InboxQuestionAnswer.tsx`
  (127), `src/components/InboxLine.tsx` (88)

**Documents**

- `docs/verification/question-cards.md` (113)
- `docs/runtime-contract.md` (144)
- `docs/superpowers/specs/2026-10-13-chat-widgets-design.md` (284)
- `server/host/team-slack-host.ts` (361)

**Files read in ranges**

| File | Lines | Ranges read |
|---|---|---|
| `server/index.ts` | 15271 | 1040-1135, 1896-2030, 3680-3696, 3830-3880, 4010-4024, 4440-4458, 4715-4900, 5004-5012, 5544-5548, 6295-6320, 6425-6690, 7250-7262, 7575-7605, 9390-9430 |
| `server/runtime/runtime.ts` | 936 | 112-160, 312-332, 558-572, 640-656, 850-895, 925-936 |
| `server/runtime/runtime.test.ts` | — | 1014-1110 |
| `server/runtime-coordinator.test.ts` | 2215 | 1-113, 176-200, 470-859, 1566-2215 |
| `server/store.ts` | 2256 | 600-640, 1056-1075, 1130-1260, 1625-1645 |
| `server/store.test.ts` | 2937 | 749-873, 1660-1700, 1979-2005 |
| `server/index.test.ts` | 15145 | 880-910, 1383-1608, 8158-8287 |
| `server/steer-e2e.test.ts` | 1079 | 112-130, 702-800 |
| `server/drivers/claude.ts` | 2016 | 330-600, 845-875, 1080-1110, 1190-1295, 1330-1360, 1630-1685, 1725-1770, 1940-1980 |
| `server/drivers/codex.ts` | 1585 | 660-680, 690-860, 1000-1020, 1528-1570 |
| `server/drivers/acp/core.ts` | 1559 | 88-100, 315-330, 380-390, 495-720, 820-832, 1350-1390, 1500-1535 |
| `server/drivers/acp/cursor.ts` | 565 | 395-475 |
| `server/drivers/acp/grok.ts` | 652 | 276-286, 410-510 (a file path only) |
| `server/drivers/pi.ts` | 990 | 340-405, 470-500, 590-680, 940-972 |
| `server/drivers/pi-mcp-extension.ts` | 761 | 20-40, 515-580, 655-672 |
| `server/drivers/openai-chat.ts` | 1000 | 540-580, 612-636, 715-725, 800-845, 885-900, 950-972 |
| `server/drivers/muse-code.ts` | 783 | 175-200, 310-325, 375-395, 470-510, 644-662, 684-730 |
| `server/contracts.ts` | — | 300-315 |
| Driver tests | — | `claude.test.ts` 335-440, 1034-1225, 4485-4600, `codex.test.ts` 3040-3285, `acp/acp.test.ts` 1665-1945, `acp/cursor.test.ts` 484-640, `pi.test.ts` 931-960, 1135-1260, `openai-chat-tools.test.ts` 544-645, 850-925, `openai-chat.test.ts` 215-270, 485-535, `mistral.test.ts` 150-196, `cerebras.test.ts` 108-146, `testing/fake-acp-cli.ts` 10-24, 1855-1940 |
| `packages/phone-protocol/src/wire.ts` | 1000 | 20-40, 80-92, 355-365, 405-475, 570-800, 940-1000 |
| `src/state/store.tsx` | 3277 | 75-135, 675-700, 760-850, 1060-1095, 1167-1320, 2100-2125, 2195-2235, 2415-2520, 2960-3035, 3040-3110, 3180-3205 |
| `src/components/GroupView.tsx` | 989 | 200-290, 930-945 |
| `DESIGN.md` | 421 | 50-66, 155-170, 200-236 |
| `docs/approval-levels.md` | 461 | 1-40, 100-129, 170-259, 320-461 |
| `docs/team-cloud.md` | 1136 | 48-56, 120-128, 170-191, 700-739, 850-1064 |
| `docs/cloud-pro.md` | 2639 | 940-956, 1238-1250, 1994-2004 |
| `docs/team-slack.md` | 151 | 28-32, 112-151 |
| `docs/cursor.md` | 142 | 100-124 |
| Other | — | `server/message-db.ts` 540-565, `server/routes/today.ts` 1-42, `server/host/resumable-cards.ts` 10-22, `src/components/inbox/use-inbox-actions.ts` 19-45, `announcements/releases.json` 1000-1041, git commits `b82764109` and `7dd032b8d` |

**Checks of the main session.** The main session read these lines again and
found them as the reports said:

- `server/runtime-coordinator.ts:44-46`, `:180` (24 h and 72 h, wired as
  `inputRemindMs` and `inputWaitMs`).
- `server/runtime/runtime.ts:859-878` (`inputExpires` is only for a child,
  the reminder, the close formula) and `:932-935` (`touch` does not write
  `lastActivityAt`). `runtime.test.ts:1014-1041` shows the close at
  `parkedAt + inputWaitMs + 1`.
- `ask-question.ts:9-18`, `:45-65` (the dismiss text, the limits, the two
  predicates).
- `server/index.ts:6433-6436` (a `permission` event with `questions` is a
  question), `:6592-6610` (the settle rule), `:4795-4811` (no "Couldn't
  deliver" line for a question), `:4872-4878` (turn end keeps a question
  open), `:9419-9421` (no start sweep of question cards).
- `server/drivers/claude.ts:448`, `:511`, `:348-352` (15 minutes for a
  permission, no timer for a question, the turn-end reply).
- `server/drivers/acp/core.ts:670-677` (the 15-minute timer that is left).
- `server/person-replies.ts:116-135`, `server/routes/bot-messages.ts:786-797`,
  `server/card-dismissal.ts:5-18`, `server/host/ask-cards.ts:278-289`.
- `server/drivers/pi.ts:626-637`, `:955-969`, `server/drivers/codex-questions.ts:28-42`,
  `server/drivers/codex.ts:714-719`, `:1556-1565` (the wrong outcomes).
- git: `b82764109` "fix(cards): question and peer-approval cards no longer
  expire" is the first commit in tag v0.1.126. `7dd032b8d` "Hand-offs: work
  parked on the person gets a reminder and a limit" is in tag v0.1.153. Its
  message says: "A root's own cards stay unbounded."

## 3. How it works

### 3.1 A bot asks with an ask tool (the live question)

1. The engine calls its ask tool. The driver turns the call into one
   runtime event, `request.opened`, with `requestType: "question"`,
   `tool`, `summary`, `questions[]` and optional flat `choices`
   (`runtime-events.ts:129-171`). Section 3.2 has each engine.
2. The driver registers the ask in an in-memory map before it emits the
   event (for example `codex.ts:840-841`, `pi.ts:620-621`).
3. The server broadcasts the event without `command`, `commandLine` and
   `reads` (`index.ts:6307-6310`). It sets the watchdog to "waiting on a
   human" (`:5009`).
4. A `permission` event that carries `questions[]` is also a question:
   `permission = requestType === "permission" && !questions?.length`
   (`index.ts:6435`).
5. At Full access, in handed-on work, `notAsked` can answer for the person
   with no card (section 3.6, `index.ts:6446-6447`).
6. Else the server appends a row of kind `options` with the title "Your bot
   has a question" (`index.ts:6535-6551`). The card fields come from
   `server/request-card.ts:10-34`:
   - `options` is `choices`, or `[]` for a question (`:19`).
   - `requestType` is `"question"`, and `tool` is not set (`:21-22`).
   - `questionRequest` is `{version: 1, questions, origin?}` when
     `questions` is not empty (`:12`, `:23-25`).
7. The server puts `requestId → messageId` in `askMessageByRequest`, a map
   in memory only (`index.ts:4723`, `:6552`).
8. `askCards.askedAgain` closes older open questions of the same bot in the
   same thread. It skips `needs-input-` cards, live cards, and the cards of
   other members in a room (`ask-cards.ts:265-274`).
9. The server writes a decision row `card-shown` with source `question`
   (`index.ts:6554-6565`). An answer is not a decision row: "a question's
   answer is not a decision" (`:4782-4783`).
10. If the card is not answered yet, three things happen
    (`index.ts:6566-6580`):
    - the activity becomes `waiting-on-you`.
    - A chip "Waiting on your answer in @X" goes to the conversation that
      handed the work on.
    - A notification of kind `question` goes out.
11. The window gets the new row through the store's `message` event, which
    `store.onChange` sends as a `message` frame (`index.ts:4445-4457`,
    `store.ts:1149`).

### 3.2 Each engine

All drivers make the same event. The answer comes back as one text block
(section 3.4). Each driver splits it per question with `questionAnswersById`
or `questionAnswersByQuestion` (`ask-question.ts:275-400`) and builds the
reply shape of its engine.

| Engine | Native mechanism | Timer on a question | Turn end with the question open | Answer to the engine | `askTool` flag |
|---|---|---|---|---|---|
| Claude CLI | MCP tool `mcp__ogb__ask_user` (`permission-proxy.ts:167-187`) | none (`claude.ts:511`) | answers "<product>: the turn is ending — wrap up." as `answer`/`system` (`claude.ts:348-352`, `:564-569`) | MCP tool text (`permission-proxy.ts:227-240`) | `{kind:"mcp", server:"ogb", name:"ask_user"}` (`claude.ts:1959`) |
| Claude CLI | `AskUserQuestion` through `--permission-prompt-tool mcp__ogb__approve` (`permission-proxy.ts:209-211`) | none | the same, and `answers:{}` because the source is not `user` (`:146-150`) | `allow` with `updatedInput.answers` (`:130-151`) | the same |
| Codex | `item/tool/requestUserInput` (`codex.ts:734`, `:753-766`) | none (`codex.ts:838`) | deny/system, reply `{answers:{}}` (`codex.ts:671`, `codex-questions.ts:53`) | `{answers:{<id>:{answers:[text]}}}` (`codex-questions.ts:50-58`) | **none** (`codex.ts:1531-1547`) |
| Codex | `request_user_input_async` in an agent message (`codex.ts:1014`) | none | deny/system (`codex-questions.ts:31-33`) | `turn/steer` into the running turn (`:35`) | none |
| Cursor (ACP) | `cursor/ask_question` (`cursor.ts:399-443`) | none | `cancelled` (`core.ts:508`) | option ids, or `skipped` with the person's own words (`cursor.ts:402-443`) | `"AskQuestion"` (`capabilities.ts:19`) |
| `acp/grok.ts` (ACP) | `_x.ai/ask_user_question` (`grok.ts:415-450`) | none | `cancelled` | labels keyed by question text, plus "Other" (`grok.ts:418-450`) | `"ask_user_question"` |
| Any ACP agent | `session/request_permission` with a `toolCallId` that starts with `interaction_` (`core.ts:594`) | **15 minutes** (`core.ts:673-676`) | `cancelled` (`core.ts:508`, `:637-638`) | one `selected` option id. Free text sends `cancelled` and stops the turn (`core.ts:649-662`) | none of its own |
| Pi | `extension_ui_request` `select` or `input` (`pi.ts:603-660`) | none (the timer is for `confirm` only, `pi.ts:639-648`) | `pending.clear()`, no `request.resolved` (`pi.ts:483-485`) | `extension_ui_response` with the original option (`pi.ts:621-638`) | `{kind:"native", name:"ask_user"}` (`pi.ts:951`) |
| Chat API | function tool `ask_user` (`openai-chat.ts:811-831`) | none (`chat-tool-approval.ts:75-96`) | deny/system (`openai-chat.ts:893`, `chat-tool-approval.ts:117-120`) | tool result `{ok:true, text}` (`openai-chat.ts:829`) | set when tools are on (`openai-chat.ts:957`) |
| Muse Code | `userInput/requested` notification (`muse-code.ts:497-504`) | none | deny/system (`muse-code.ts:383-386`) | `userInput/answer` (`muse-code.ts:708-720`) | **none** (`muse-code.ts:646-661`) |

Details that matter for the port:

- **Claude.** `ask_user` shows only when the tool scope of the bot allows
  `mcp:ogb/ask_user` (`permission-proxy.ts:13`, `:203`). A call that the
  scope excludes gets "<product>: this question tool is excluded by the
  bot's tool selection." (`:208`). The broker refuses an ask after the turn,
  with no card (`claude.ts:475-488`). It denies a duplicate id and keeps the
  first ask (`:489-497`). `broker.answer` accepts only `answer` for a
  question (`:574`). If the broker socket closes, each waiting question gets
  a note that tells the bot to ask in its reply instead
  (`permission-proxy.ts:31-37`, `:74-82`).
- **Claude at Full.** The driver does not pass `--permission-prompt-tool`,
  but the `ogb` server stays, so `ask_user` still works (`claude.ts:1091`,
  `:1094-1098`).
- **Pi** asks each question as a separate card, one after the other
  (`pi-mcp-extension.ts:553-566`). Its own schema has no `multiSelect`
  (`:533-547`).
- **Chat** handles `ask_user` before the permission gate. The comment says
  "Full would auto-run an unanswered ask, Ask would show Allow/Deny"
  (`openai-chat.ts:813`). A null answer becomes the tool text "The person
  did not answer this question. Do not guess an answer; ask again later or
  proceed without it." (`:826-827`).
- **ACP vendor requests** with more than 6 questions, or with two equal
  question texts, get JSON-RPC `-32602` (`question-requests.ts:33-37`). A
  vendor request between turns gets `cancelled` and no card
  (`core.ts:525-533`).
- **The driver contract.** `askTool` is "The tool the model asks the person
  with" (`contracts.ts:308-309`). `respondToRequest` "Never throws for a
  vanished ask: `unavailable` means nobody could take the answer"
  (`contracts.ts:313`).

### 3.3 A bot asks with NEEDS INPUT (the parked question)

1. A bot that does handed-on work ends its reply with `NEEDS INPUT: …`.
   `needsInputQuestion` reads it from the last non-empty line, or from the
   line before a last `Default:` line (`runtime-coordinator.ts:82-95`). The
   prefix is case-insensitive (`:36`). "none", "n/a" and similar words ask
   nothing (`:38-39`).
2. The run adapter returns `{kind: "needs_input", question, decide?}`
   (`runtime-coordinator.ts:694-700`). The runtime sets the status
   `needs_input`, stores the question, sets `lastActivityAt` and deletes
   `remindedAt` (`runtime.ts:564`). Then it calls `host.park`
   (`runtime-coordinator.ts:639`).
3. `askCards.park` makes the card (`ask-cards.ts:164-183`, `:191-228`):
   - `requestId` is `needs-input-<node id>-<executions>` (`:24`, `:165`).
     A new execution gets a new card.
   - The title is "Your bot has a question" and the subtitle is the
     question. `withDefault` splits the `Default:` part off, and the default
     becomes the one option (`:165-170`, `runtime/questions.ts:29-33`).
   - If the reply was only the question line, that row becomes the card.
     Else the text before the line stays, and a new card row follows
     (`:176-181`).
   - If the requester decides (section 3.6), the card is posted already
     marked as answered by that bot, with no chip and no notification
     (`:195-200`).
   - Else a chip "<bot> needs your input: <question>" goes to the
     requester, but not to an Inbox that holds a copy. A notification of
     kind `question` goes out (`:211-227`).
4. A bot's own NEEDS INPUT in its own chat (a root) also makes a card, at
   turn end, through `ownQuestion` (`ask-cards.ts:327-332`,
   `index.ts:6677`). The id is `needs-input-<botId>-<turnId>-1`. A root
   does not park on it. The next typed line starts a new root
   (`runtime-coordinator.test.ts:1818-1827`).
5. An approval that nobody answered in handed-on work also parks the work
   as a question, with "Default: Try again" (`waiting-on-person.ts:70-76`,
   `runtime-coordinator.ts:695`).

### 3.4 The person answers in the window

1. The card dispatches `decideRequest`. The store sends
   `POST /api/threads/:threadId/respond` with
   `{requestId, behavior: "answer", message}` (`QuestionCard.tsx:134`,
   `store.tsx:2422-2458`). Nothing changes in the client state until the
   server sends a patch (`store.tsx:1085-1086`).
2. The message text (`ask-question.ts:234-250`):
   - Empty picks are dropped, and a question with no pick is left out.
   - Picks of a multi-select question are joined with ", ".
   - If nothing is answered, the text is "", and nothing is sent.
   - If any question or answer has a line break, the text is
     "The user answered your questions.\n\nAnswers (JSON):\n" and a JSON
     list.
   - Else it is "The user answered your questions." and a `Q:`/`A:` block
     for each question.
   - For the plain `ask_user` shape (one flat question), the message is the
     label itself (`QuestionCard.tsx:129`).
3. The route (`routes/bot-messages.ts:674-800`):
   1. It refuses a bad `behavior` with 400 (`:677-679`).
   2. `answeredIn` sends an answer on an Inbox copy to the thread that asked
      (`:681`).
   3. `cardAnswerRefusal` returns 403 for a caller that may not answer
      (`:682-683`, `index.ts:1047-1061`).
   4. It runs inside `answeringCardAs`, which stamps `answeredBy` one time
      (`:688`, `index.ts:1112-1128`).
   5. The X rule `dismissQuestionCard` comes next (section 3.7).
   6. In a room, the owner of a question is its first asker, "never a later
      speaker" (`:773-779`). If that bot is gone: 409 (`:780-782`).
   7. Nothing waits: 404 "nothing is waiting on an answer in this
      conversation" (`:783`).
   8. `answerRequest` (`index.ts:4737-4813`) finds the card through the map,
      or by `requestId` (`:4749-4752`), and calls
      `adapter.respondToRequest`. A throw counts as `unavailable`
      (`:4758-4765`). On `answered`, it writes `answeredText` (`:4776-4780`).
   9. On `unavailable` for a persistent question, it does not close the
      card and writes no "Couldn't deliver" line (`:4795-4811`). The route
      then takes the late-answer path (section 3.5).
4. The driver sends the answer to the engine, deletes the ask from its map
   and emits `request.resolved` with `source: "user"`.
5. The server handles `request.resolved` (`index.ts:6583-6612`): it settles
   the chips, sets the activity back to `working`, and patches the card
   only if it is not answered and `shouldSettleRequestCard` holds. For a
   question that means `source === "user"`. The patch sets
   `answered: behavior` and `dismissed: false`. Then it deletes the map
   entry (`:6609`).
6. The store writes the patch to SQLite before it changes memory
   (`store.ts:1236-1250`). The comment says: "Persist before memory: a
   failed write must not mark a card answered that a restart shows
   pending". It emits `message.patch`.
7. The window replaces the whole row and draws the settled line
   (`store.tsx:3074-3076`, `:1273-1300`).

**Other ways to answer:**

- **A typed line.** `askCards.typed` takes a typed line as the answer in
  two cases only: in handed-on work for a card that a live turn waits on,
  or for a named target (`ask-cards.ts:304-323`). In the bot's own
  chat the line is steered or queued as usual (`ask-cards.test.ts:349-355`).
  It dedupes on `sendId` (`:316-317`). Codex: a typed message while its
  question is open is steered into the turn, not taken as the answer
  (`steer-e2e.test.ts:717-721`).
- **A reaction.** 👍 or 👎 on a live card maps to the matching option, or
  "Yes"/"No". Not in rooms (`reactions.ts:34-48`, `:97-102`).
- **A parked answer.** For a `needs-input-` card, `answerParked` finds the
  node and requires the status `waiting` (the view of `needs_input`), a
  question, no cards, and `answerNode` true (`ask-cards.ts:293-300`). The
  next turn of that bot gets `The person answered: "<text>".` in its
  envelope (`runtime-coordinator.test.ts:812`).

### 3.5 The late answer

1. The live ask is gone (turn end, restart, a second answer). The adapter
   returns `unavailable`.
2. The route checks: 404 when the card is missing, 400 "a question answer
   is required" for an empty text, 409 when the asker is gone
   (`bot-messages.ts:786-790`).
3. The server tries `askCards.answerParked` first. If no parked node takes
   it, `personReplies.deliver` sends it (`index.ts:7258-7259`).
4. `deliverLateQuestionAnswer` (`person-replies.ts:116-135`):
   - The `sendId` is fixed for each card:
     `late-question-<sha256(threadId:requestId)[0..32]>` (`:123`).
   - It refuses inside the send slot when the card is gone, answered by the
     person, or dismissed, with "this question has already been answered"
     (`:124-127`, `:85-86`).
   - A bot's answer can be replaced by the person (`decidedByBot`, `:46`).
   - It then patches `answered: "answer"`, `answeredText`, and
     `dismissed: false`, and removes `answeredBy` (`:129-133`).
   - Other conflicts are 409: a different recorded or queued answer, an
     asker that left, a conversation that is gone (`:61-80`).
5. The reply is 200 `{ok: true, outcome: "answered", late: true}`, with
   `queued: true` when the bot is busy (`bot-messages.ts:793`).
6. The person's line is a new user message with `replyToId` set to the card
   (`index.test.ts:1577-1582`). In a room it starts with "@Bot: "
   (`index.test.ts:8229-8234`). It starts a new turn or waits in the queue.

### 3.6 Who else can answer

1. **At Full access, nobody is asked (`notAsked`).** This applies to an
   ask-tool question in a running child with these conditions: it has a
   requester, an outside event did not start it, and it is not private.
   The server then answers "Not asked: at this level nobody is
   interrupted. Take the sensible default yourself …"
   (`question-routing.ts:63-69`). No card is made (`index.ts:6446-6447`).
2. **At Full access, the requester decides (NEEDS INPUT).** `decide` is set
   when `requesterDecides` holds and the question is not person-only
   (`runtime-coordinator.ts:698-700`, `runtime/questions.ts:7-8`). If nobody
   answers, the child gets `Nobody was asked, at this level: go on with your
   default, …` (`runtime-coordinator.test.ts:2044-2061`). Such a question
   gets no reminder (`runtime.ts:868`).
3. **Person-only questions.** `personOnly` matches sign-in, 2FA, payment,
   secrets and the person's own account, mailbox or login, in English and
   German (`runtime/questions.ts:13-26`). No bot can answer them.
4. **Relay by a teammate.** A bot answers a question that its handed-on work
   waits on, with `coordinate_bots` and `answers`
   (`question-routing.ts:102-139`). A security check runs first (`:120-121`).
   A live card gets "@<sender> answered: <msg>". A stale id gets a receipt
   that says nothing waits under that id (`:111-112`).
5. **The Chief answers for the person** (`question-routing.ts:180-199`).
   Only for a live card that can be answered in words, not person-only, in
   a thread the Chief did not open. The text is "@<chief> answered for the
   person: <msg>".

`docs/approval-levels.md:362-364` says that no level answers a question.
Items 1 and 2 disagree with that. The earlier research found the same
conflict (P120).

### 3.7 How a question card closes

A question card has no timer in the server or the window. These are all the
ways it closes:

| Cause | Result on the card | Source |
|---|---|---|
| The person answers | `answered: "answer"`, `answeredText` | `index.ts:6598-6606` |
| A late answer | the same, `answeredBy` removed | `person-replies.ts:129-133` |
| A bot answers (relay, Chief, decide) | `answeredBy: {kind: "bot"}` | `question-routing.ts:125`, `:132`, `:193`, `ask-cards.ts:247-252` |
| The person presses X **after** an answer | `dismissed: true` | `card-dismissal.ts:13-16` |
| The same bot asks again | `answered: "unavailable"`, `dismissed: true` | `ask-cards.ts:265-274` |
| Handed-on work stops | `unavailable`, `dismissed`, `stopped: true` | `ask-cards.ts:287` |
| Handed-on work ends another way | `unavailable`, `dismissed` | `ask-cards.ts:287` |
| Handed-on work expires (72 h) | `expired: true` only | `ask-cards.ts:286`, `index.ts:3877` |
| Only on the ACP `interaction_` path: 15 minutes | the engine gets `cancelled`, the turn stops. The card stays open for a late answer | `core.ts:673-676`, `index.ts:6598` |

Notes:

- `closed` skips a card that a live turn still waits on
  (`ask-cards.ts:284`). It does nothing for a root (`:279`).
- The X refuses a question that has no answer: 409 "answer this question
  before dismissing it" (`card-dismissal.ts:13-14`). So the person cannot
  close an open question from the chat card.
- The end of a turn does not close the card. `closeOpenApprovals` only
  deletes the map entry of a persistent question (`index.ts:4874-4876`).
  The card stays answerable (`index.test.ts:1494-1510`).
- A line typed past an open question removes it from the list of waits.
  It does not change the row (`person-wait.ts:67-81`).

### 3.8 When nobody answers: reminder and close

1. The runtime ticks. For a node in `needs_input` with a parent (handed-on
   work) and a finite `inputWaitMs`, `chaseParked` runs
   (`runtime.ts:859-861`). A root never expires.
2. The host sets `inputRemindMs` to 24 hours and `inputWaitMs` to 72 hours
   (`runtime-coordinator.ts:44-46`, `:180`). The runtime default for both
   is infinite (`runtime/types.ts:366-371`, `:384-385`).
3. **Reminder.** When `now - lastActivityAt > 24 h`, and there is no
   reminder yet and no `decide`, the runtime sets `remindedAt`, writes a
   `reminded` event and calls `remind` (`runtime.ts:868-874`).
   `askCards.remind` sends one notification of kind `question` with the
   days that are left, and marks the thread unread. It adds no row
   (`ask-cards.ts:232-243`).
4. **Close.** The node closes when
   `now > max(lastActivityAt + 72 h, remindedAt + 48 h)` (`runtime.ts:876`).
   The reminder does not move `lastActivityAt` (`touch` only reports the
   rows, `runtime.ts:932-935`). So a reminder that comes late, for example
   after the computer slept, gives the person 48 more hours
   (`runtime.test.ts:1043-1060`).
5. The close is `cancelTree(n, "the person did not answer", "failed",
   "expired")` (`runtime.ts:877`). The host reports it, and `askCards.closed`
   marks the card `expired: true` (`index.ts:3877`). The window shows
   "Expired before anyone answered".
6. The clock is the wall clock, so a restart does not reset it
   (`runtime.ts:863-864`, `runtime/types.ts:366-367`). A new question in the
   same node resets the clock and the reminder (`runtime.ts:564`,
   `runtime.test.ts:1063-1080`).
7. Today lists an open question for 7 days only (`shared/today.ts:66`,
   `message-db.ts:540-550`). After that it drops from Today, but it stays
   open.

### 3.9 At a restart

1. The card row is in `messages.db` and loads lazily
   (`store.ts:1056-1058`, `:1134-1152`). Assignments are in `runtime.db`
   (`runtime-coordinator.ts:176`).
2. Lost: `askMessageByRequest` (`index.ts:4723`), every driver's map of
   open asks (`claude.ts:449-452`, `codex.ts:579`, `acp/core.ts:996`,
   `pi.ts:383`, `chat-tool-approval.ts:36`, `muse-code.ts:501`), the
   waiting-chip maps (`ask-cards.ts:90`, `:115`), `UnansweredApprovals`
   (`waiting-on-person.ts:47`) and `cloudCardAnswersInFlight`
   (`index.ts:1105`).
3. At start, the runtime parks each `needs_input` node again with
   `restored = true`, and does not reset its clock (`runtime.ts:119-123`).
   `park` then posts no second card, chip or notification
   (`ask-cards.ts:166`, `:186-188`, `:210`).
4. A running node that the restart cut is set to run again, or to cut, or
   to fail (`runtime.ts:125-148`).
5. `reconcileParkedRoots` runs on the first tick. It releases a waiting node
   whose cards are no longer live. It handles no question card
   (`index.ts:9403-9404`, `:9419-9421`, `:1912-1954`).
6. So no sweep closes a question card at start. After a restart:
   - In a root, the card stays open and takes a late answer
     (`index.test.ts:1383-1607`).
   - In handed-on work, the cut child runs again with a restart note. The
     old card closes when that work ends (`question-routing.e2e.test.ts:260-282`,
     `ask-cards.ts:282-287`).
   - A parked `needs-input-` card stays answerable, also through its Inbox
     copy (`question-routing.e2e.test.ts:233-258`).

### 3.10 Limits and edge cases

- **Parse of the input** (`ask-question.ts:77-127`): the input comes from
  the model, so each field is checked and cut, never cast. An empty
  question is skipped. A duplicate label is dropped. An empty option list
  stays: "the card always offers free text" (`:104`). `multiSelect` stays
  only when it is exactly `true`. `custom: false` stays only with options.
  No question left: `null`, and the call "gets the ordinary card" (`:116`).
- **Protocol ids** (Codex): an id must be a string of 1 to 200 characters.
  A duplicate id fails the whole request (`:325-343`).
- **Two equal question texts** cannot be told apart in a reply
  (`repeatsQuestionText`, `:346-348`). A reply that names them answers
  neither (`:361-368`).
- **Reading an answer back**: malformed JSON gives `{}`. Only questions that
  were asked are filed. A bare reply is filed only when one question was
  asked. `Object.create(null)` stops a `__proto__` key (`:354-400`).
- **Echo**: `capAnswerEcho` cuts at the last whole `Q:` block and adds
  "[answer truncated]" (`:261-267`). Its limit comes from the caps, so a
  card answer is never cut (`:256-258`).
- **Room fence**: while a question card is live in a room, changes to its
  task and to the room return 409 (`index.ts:3682-3693`,
  `room-question-tasks.e2e.test.ts:84-113`).

## 4. The data

### 4.1 The question

`packages/phone-protocol/src/ask-question.ts`:

| Type or constant | Fields or value | Line |
|---|---|---|
| `AskQuestionOption` | `label: string`, `description?: string` | 20-23 |
| `AskQuestion` | `question`, `header?` (a short tab label), `multiSelect?`, `options[]`, `custom?: false` (options only, no free text) | 25-34 |
| `QuestionRequestCardData` | `version: 1`, `questions[]`, `origin?: "tool" \| "output"` (`output` only shows a badge) | 36-42 |
| `ProtocolAskQuestion` | `{id, question}`, for Codex ids. The card never sees the ids | 316-320 |
| `MAX_QUESTIONS` | 6 | 13 |
| `MAX_OPTIONS` | 12 | 14 |
| `MAX_QUESTION_TEXT` | 8,000 characters | 15 |
| `MAX_LABEL` | 120 | 16 |
| `MAX_DESCRIPTION` | 400 | 17 |
| `MAX_CUSTOM_ANSWER` | 2,000 | 18 |
| `MAX_CHOICES` | 5, for a flat `choices` list | 147 |
| `MAX_QUESTION_ID` | 200 | 314 |
| `QUESTION_DISMISS_MESSAGE` | "The user closed this question without answering. Use your best judgment and continue." | 9 |
| `ANSWER_PREAMBLE` | "The user answered your questions." | 230 |

The comment at `:11-12` says the Claude CLI's own limits are 1-4 questions
and 2-4 options, and these leave room for an engine that allows more.

**Tool schemas.** Three schemas exist for the same purpose:

- Claude MCP `ask_user`: `question` (required), `choices` ("Optional 2-5
  suggested answers"), `multiSelect` (`permission-proxy.ts:167-187`).
- Chat API `ask_user` (`ASK_USER_TOOL_DEFINITION`, `ask-question.ts:183-226`):
  `questions` 1 to 6, each with `question`, `header`, `multiSelect`,
  `options` (at most 12, `{label, description}`). No `custom`.
- Pi: its own schema with `questions[]` and no `multiSelect`
  (`pi-mcp-extension.ts:533-547`).

### 4.2 The card

The card lives on a transcript row: `WireMessage.kind: "options"` and
`card?: OptionCardData` (`wire.ts:439-460`), "serialized as stored"
(`:438`). Fields for a question (`wire.ts:635-705`):

| Field | Meaning | Line |
|---|---|---|
| `title`, `subtitle`, `options: string[]` | the text and the flat choices | 641-646 |
| `requestType?: "permission" \| "question"` | tells a question from an approval after the live run ends | 647-648 |
| `answered?` | the behaviour: `answer`, `unavailable`, … | 649 |
| `answeredText?`, `answeredBy?: CardAnswerer` | the answer and who gave it | 650-655 |
| `dismissed?` | closed | 649-655 |
| `requestId?` | set while the card is a live ask | 656-657 |
| `tool?` | set on approval cards only | 658-659 |
| `expired?` | "no answer came in time" | 662-664 |
| `stopped?` | "Stop ended the work that asked" | 665-666 |
| `questionRequest?` | the structured questions | 698-699 |
| `fixedOptions?` | "clients offer no free-text reply" | 700-701 |

`CardAnswerer` (`wire.ts:420-433`) is `session`, `loopback`, `worker` or
`bot` (with `name`), each with an optional `via: "call" | "reaction"`.

Example row (`index.test.ts:886-899`):

```json
{"id": "cancel-question-card", "role": "bot", "kind": "options",
 "card": {"title": "Your bot has a question", "subtitle": "Which file should I update?",
          "options": ["README", "Guide"], "requestId": "cancel-question-request",
          "requestType": "question"}}
```

### 4.3 The events

- `request.opened` (`runtime-events.ts:129-171`): `requestType`, `tool`,
  `summary`, `choices?`, `questions?`, `origin?`, and approval fields.
- `request.resolved` (`:172-180`): `behavior: "allow" | "deny" | "answer"`,
  `source: "user" | "auto" | "timeout" | "system" | "unavailable" | "peer"`.
- `server/thread-events.ts:200-218` checks both events before it stores
  them in `<threadId>.ndjson` (`:257`). The inspector reads them back
  (`:246-274`).

### 4.4 The predicates

The reference uses four functions to tell a question from other cards:

| Function | Rule | Line |
|---|---|---|
| `isPersistentQuestionCard` | `requestType === "question"`, or `questionRequest`, or no `requestType`, no `tool` and no routine, skill, profile, model or team-setup request | `ask-question.ts:45-60` |
| `shouldSettleRequestCard` | `!persistent \|\| source === "user"` | `ask-question.ts:63-65` |
| `isQuestionCard` (client) | `requestId && !tool && (requestType === "question" \|\| questionRequest)` | `src/lib/question-card.ts:4-5` |
| `liveCardKind` | null when answered, dismissed or expired. "review" for a proposal. `tool` means approval, else question | `live-approval.ts:14-20` |

They do not agree on an empty card `{}`: the first says "question", the
third says no (`shared/ask-question.test.ts:457-465`). The verifier found no
real card that falls in the gap.

### 4.5 Stored rows

| Store | What | Line |
|---|---|---|
| `messages.db`, table `messages(id, json)` | the card row | `parked-cards.e2e.test.ts:112-117`, `store.ts:1134-1152` |
| `runtime.db`, table `assignments` | `status: "needs_input"`, `question`, `remindedAt`, `decide`, `answer`, `answeredBy`, `cards[]` (ids of open cards) | `runtime/types.ts:54`, `:130-150` |
| `runtime.db`, `assignment_events` | `parked`, `answered`, `reminded` | `runtime/types.ts:185-188` |
| decision log | `card-shown` with source `question` | `index.ts:6554-6565` |
| memory only | `askMessageByRequest`, driver maps, chip maps | section 3.9 |

## 5. The UI

### 5.1 Which component draws a card

`optionsCardRow` picks one component (`OptionsCardRow.tsx:33-42`, rooms in
`GroupView.tsx:251-267`):

- `isQuestionCard` → `QuestionCard`.
- `requestId` and `tool` → `ApprovalCard` (feature `approval-cards`).
- else → `OptionCard` (first-run quizzes, offers).

All three use the shell `AskCard.tsx`. An open question or approval that is
not an Inbox copy gets an `AskingLine` above it (`OptionsCardRow.tsx:44-47`).

### 5.2 Layout and text

- **Shell** (`AskCard.tsx:45-126`): `role="group"`,
  `data-ask-card="pending"`, at most 560 px wide, 18 px radius. `DESIGN.md:162`
  asks for an 18 px radius on transcript cards.
- **Header:** a 16 px avatar and "{name} asks" (`AskCard.tsx:15-28`).
- **Title:** a question of 160 characters or fewer is the title
  (`TITLE_MAX`, `QuestionCard.tsx:41`, `:121`). A longer one shows its
  `header` as the title and the question below, cut to four lines with
  "Show full question". Else "{name} has a question", or "Your bot has a
  question".
- **Badge:** "Agent-composed question" when `origin === "output"` (`:176`).
- **Tabs** for a set of questions: `role="tablist"` with the label
  "Questions" (`:169`, `:177-193`). Each question has one tab, named by
  its header or "Question {n}". A green check shows when it is answered.
  The meta line reads "{answered} of {count} answered".
- **Choices** (`AskCard.tsx:155-199`): full-width buttons, at least 40 px
  high (44 px on touch). A radio group for single select, checkboxes and
  "Choose all that apply" for multi-select.
- **Free text** (`AskCard.tsx:202-243`): "Something else…" when the question
  has options, else the question as label and "Type your answer". Not shown
  when `custom === false` (`QuestionCard.tsx:119`, `:210`). The field takes
  at most 2,000 characters (`:220`).
- **Footer:** "Done" for one multi-select question, "Submit answers" for a
  set, else "Submit answer". It is off until each question has an answer
  (`:172`, `:116`).
- **Colour:** buttons use the asking bot's colour (`:316-319`).
- **Keyboard:** arrows, Home and End move between choices, also for
  right-to-left text (`AskCard.tsx:346-363`). Enter sends, Shift+Enter
  breaks the line, and nothing is sent during an IME composition
  (`:213-217`). No letter keys (`QuestionCard.answer.test.ts:84-89`).

### 5.3 Behaviour of the card

- **One tap.** One single-select question with options sends at once when
  the person taps a choice (`answersInOneTap`, `QuestionCard.tsx:51-53`,
  `:143-147`). No Submit button shows.
- **A set.** A tap on a single-select question moves to the next question
  with no answer (`:149-150`). Enter in the last open free-text field sends
  the whole set (`:153-157`).
- **Busy.** The picked choice shows a spinner, the others are off, and a
  second click does nothing (`:126`, `QuestionCard.answer.test.ts:69-82`).
- **Error.** "Couldn't send your answer. Try again." with `role="alert"`.
  The choices work again (`QuestionCard.tsx:225`, `AskCard.tsx:246-248`).
- **Empty.** A card with no question draws nothing (`QuestionCard.tsx:107`).
- **No timer** and no dismiss button on the chat card.

### 5.4 Settled states

`AskSettledLine` (`AskCard.tsx:259-292`, `QuestionCard.tsx:272-298`):

| State | Text |
|---|---|
| answered, one question | "You chose: X" (a choice) or "You answered: X" (own words) |
| answered, a set | "Answered · Model: … · Style: …", with "Details" / "Hide details" |
| stopped | "Stopped before you answered" |
| expired | "Expired before anyone answered" |
| closed or unavailable | "Closed without an answer" |
| a bot decided | "{name} decides this", "Picked by {name}: X", with "Answer yourself" or "Change" (`:253-258`) |

### 5.5 Reconnect and preview

- On a snapshot request, the store loads the whole chat again from REST
  (`store.tsx:3196-3203`). Drafts and the "sending" state are React state
  and are lost (`QuestionCard.tsx:102-105`).
- `question-cards-preview.html` mounts the real chat and Inbox over a fixed
  store, with `?state=question|approval|open|answered|others` and
  `surface=chat|inbox|panel` (`question-cards-preview.tsx:17-23`, `:119-135`).

### 5.6 The Inbox copy (Team Cloud, record only)

On a Team Cloud, a teammate bot's question to a person also goes to that
person's Inbox chat as a copy with `inbox: {kind: "ask", from, origin}`
(`question-cards.e2e.test.ts:141-171`). An answer on the copy goes to the
thread that asked (`answeredIn`, `bot-messages.ts:681`, `index.ts:3834-3836`).
Stop or an answer on the original also changes the copy.

- Server: `bot-messages.ts:133-146`, `:287-290`, `:602-604`, `:681`,
  `index.ts:1057-1059`, `:2761`, `:3834-3836`, `:4826`, `:4873`,
  `:11957-11958`, `ask-cards.ts:2-4`, `:35-46`, `:94`, `:124`, `:211`,
  `:230-231`, `:296`, `:302-322`, `question-routing.ts:81`, `:130`, `:159`,
  `message-db.ts:545`, `:557`, `today.ts:24-26`, `:286`.
- Client: `src/components/inbox/inbox-answer.ts`, `inbox-view.ts`,
  `InboxAnswer.tsx`, `InboxQuestionAnswer.tsx`, `InboxLine.tsx`. The Inbox
  has its own compact form, with digit keys 1-9 and a "Close without
  answering" X (`InboxQuestionAnswer.tsx:14`, `:55-66`, `:99-103`).
- Documents: `docs/team-cloud.md:180-187`, `:705-713`, `:913-982`, `:1016`
  (`person-inbox.json`), `docs/verification/question-cards.md:5-30`.
- Not read: `server/host/person-inbox.ts`, `server/ask-routing.ts`,
  `packages/phone-protocol/src/inbox.ts`.
- **Slack** gets no card. A run that waits on a card reports
  `waiting: "question"` with a link to the app (`team-slack-host.ts:121-123`,
  `docs/team-slack.md:137-143`).

## 6. The tests

| Test | What it guarantees |
|---|---|
| `shared/ask-question.test.ts` | the parse and its caps (`:44-113`), the answer text (`:180-201`), the read-back by text and id with ambiguous and malformed input (`:285-427`), `isPersistentQuestionCard` (`:457-465`), `shouldSettleRequestCard` is false for a question on timeout, system or unavailable (`:467-474`) |
| `server/card-dismissal.test.ts` | the X closes only an answered question (`:14-30`) |
| `server/runtime/questions.test.ts` | `personOnly` in English and German (`:5-22`). No test for `requesterDecides` or `withDefault` |
| `server/host/ask-cards.test.ts` | one card, one chip and one notification for NEEDS INPUT (`:84-94`). nothing posted twice after a restart (`:122-137`, `:220-228`). the decide flow (`:175-204`). the default as an option (`:206-212`). `askedAgain` (`:230-237`). stop, expired, failed, done (`:259-296`). typed answers and dedupe (`:304-363`). the reminder (`:366-386`) |
| `server/host/question-routing.test.ts` | `notAsked` (`:75-98`), relay cases (`:100-223`), the Chief (`:225-299`) |
| `server/question-routing.e2e.test.ts` | at Full no question reaches the person (`:105-131`). a restart keeps one card and one copy, and an answer after the restart reaches the bot (`:233-258`). a live card whose turn a restart cut closes once the work continues (`:260-282`) |
| `server/runtime/runtime.test.ts` | the 72-hour rule: one reminder, the close, a restart in the middle (`:1014-1041`). a late reminder after downtime (`:1043-1060`). a new question resets the clock, and decide sends no reminder (`:1063-1093`). a root parked on cards never expires (`:1096`) |
| `server/runtime-coordinator.test.ts` | NEEDS INPUT parse (`:176-195`). park, answer once, envelope (`:794-815`). a parked root survives a restart (`:1723-1746`). person-only stays with the person (`:2063-2130`) |
| `server/question-cards.e2e.test.ts` | Team Cloud: card and Inbox copy, one notification, answer on the copy, both settle (`:141-171`). typed words answer (`:173-186`). NEEDS INPUT card (`:188-215`). Stop marks both `stopped` (`:217-228`) |
| `server/index.test.ts` | a question restored after a restart, not closed by a later turn, X refused, late answer 200 `late: true` (`:1383-1607`). a room interrupt keeps the question (`:8181-8242`) |
| `server/late-question-*.e2e.test.ts` | a late answer clears Today and wakes the bot; a deleted asker gives 409 |
| `server/room-question-tasks.e2e.test.ts` | the room fence during a live question, and a late answer after a restart (`:84-139`) |
| `server/store.test.ts` | a question card survives a reload (`:780-818`); a failed patch keeps memory and SQLite pending (`:1676-1691`) |
| driver tests | each engine's shape, refusals and turn end (section 3.2). `codex.test.ts:3258-3280`, `cursor.test.ts:614-628`, `pi.test.ts:1226-1242`: a question is still open after 72 h and the answer still arrives |
| UI tests | `QuestionCard.test.ts`, `QuestionCard.answer.test.ts`, `AskCard.test.ts`, `OptionCard.test.ts`, `OptionsCardRow.test.ts`: the layout, one tap, one answer at a time, the error state, the settled lines |

Gaps in the tests:

- No test shows that a Claude, chat, Muse or ACP `interaction_` question has
  no timer.
- `runtime-coordinator.test.ts:2025-2042` moves the clock past three days
  and the question still waits. This is only because the first tick after
  24 hours sends the reminder, which adds 48 hours. The document
  `docs/verification/question-cards.md:81` says this test "keeps a question
  waiting past … three days", which says more than the test shows.

## 7. Ours compared

We have no request type yet. `bot-protocol` has the identifiers, the message
and the event union of step 2 (`crates/bot-protocol/src/event.rs`,
`ids.rs`, `message.rs`). Plan step 10 builds "the permission request path
and the approval box". Proposal P118 asks if questions go in step 10 or
later.

| Part | Reference files | Our crate and module | Step |
|---|---|---|---|
| The question data and limits | `packages/phone-protocol/src/ask-question.ts` | `bot-protocol`, a new `request` module | 10 |
| `request.opened` / `request.resolved` | `runtime-events.ts:129-180` | `bot-protocol`, `event.rs` (decision D20) | 10 |
| The answer text and its read-back | `ask-question.ts:228-400` | `bot-protocol` (pure, no I/O) | 10 |
| The driver answer path | `contracts.ts:308-313`, `claude.ts`, `permission-proxy.ts`, `acp/core.ts`, `acp/question-requests.ts`, `codex-questions.ts`, `chat-tool-approval.ts` | `bot-engine`, the `Driver` trait (decision D22) and each driver | 10 |
| The card row, its settle rule, the late answer | `index.ts:6433-6612`, `:4737-4813`, `person-replies.ts`, `card-dismissal.ts` | `bot-core`, the store and the turn runtime | 10 |
| The card in the window | `QuestionCard.tsx`, `AskCard.tsx`, `src/lib/card-answer.ts` | `bot-desktop`, `crates/bot-desktop/ui` (TypeScript) | 10 |
| NEEDS INPUT, parking, 24 h / 72 h | `runtime-coordinator.ts`, `runtime/runtime.ts:859-878`, `ask-cards.ts` | `bot-core`, the assignment runtime | 13 |
| Relay, the Chief, `notAsked`, decide | `question-routing.ts`, `runtime/questions.ts` | `bot-core` | 14 |
| The Inbox copy, Today, Slack | `inbox/*`, `today.ts`, `team-slack-host.ts` | not planned | — |

Where the reference breaks our rules in `AGENTS.md`:

- "Every state change in the runtime writes the row and its event in one
  transaction before anything acts on it." The reference broadcasts
  `request.opened` before it stores the card (`index.ts:6307-6310` before
  `:6535`). The link from request to card is a map in memory
  (`index.ts:4723`). P116 already proposes the fix for the first point.
- "Engine behaviour is gated by capability flags on the driver." Codex and
  Muse open question cards with no `askTool` flag (`codex.ts:1531-1547`,
  `muse-code.ts:646-661`).
- "The runtime returns typed refusals." The respond route answers HTTP 200
  with `outcome: "unavailable"` for an approval that cannot reach the
  engine (`index.test.ts:8160-8165`). A question goes to the late path. P45
  covers this.

## 8. Where we can be better

1. **A question kind that the compiler checks.** The reference tells a
   question from an approval with four functions that disagree on the edge
   (section 4.4), plus a string `requestType`. A Rust enum
   `Request::Question { questions } | Request::Permission { tool, … }`
   gives each place one answer.
   - Why: a wrong state that the compiler refuses.
2. **A question answer has no `allow` and no `deny`.** In the reference,
   Codex sync does not check the behaviour, and `allow` on a question sends
   empty answers and settles the card as "allow" (`codex.ts:1558-1564`).
   Claude refuses it at `claude.ts:574`. One type
   `QuestionAnswer::Answered(text) | Closed` removes the case for all
   drivers.
   - Why: a wrong state that the compiler refuses.
3. **The driver reports what the engine got.** Pi sends `cancelled` to the
   engine when two labels collide, but reports `answered` and
   `source: "user"` (`pi.ts:633-635` against `:961-968`). Codex async
   reports `answered` when the steer timed out (`codex.ts:718`,
   `codex-questions.ts:35-40`). The card then says "answered" and the bot
   got nothing.
   - Why: a known problem of the reference that we do not copy. Problem
     "the same work done or delivered two times, or lost".
4. **No timer on any question.** The ACP `interaction_` question kept its
   15-minute timer after v0.1.126 (`core.ts:673-676`). It sends the
   permission timeout text and stops the turn.
   - Why: a known problem of the reference, and it is the path our step 9
     ACP driver uses.
5. **The link from request to card is stored.** Keep the `request_id` on
   the stored card row and find the card by it, not by a map in memory.
   The reference already falls back to a search by `requestId`
   (`index.ts:4749-4752`), so the map adds a second source of truth.
   - Why: less code, and no state lost at a restart.
6. **One explicit state for the card.** The reference uses five flags
   (`answered`, `dismissed`, `expired`, `stopped`, `answeredBy`) that make
   states such as `dismissed` with no `answered`. The window draws that one
   as a live card (`QuestionCard.tsx:109`). An enum `Open | Answered |
   Closed | Stopped | Expired | DecidedBy` has no such state.
   - Why: a wrong state that the compiler refuses.
7. **A late answer to an expired card is refused.** `deliverLateQuestionAnswer`
   checks `answered` and `dismissed`, but not `expired`
   (`person-replies.ts:126`). A closed card refuses with the wrong text,
   "already been answered".
   - Why: a known problem. Plausible, from the code, not run.
8. **A limit for a root question, or a clear choice to have none.** The
   reference closes handed-on work after 72 hours but keeps a root
   question open with no limit ("A root's own cards stay unbounded",
   commit `7dd032b8d`). A live ask-tool question in a root holds the engine
   process open with no end.
   - Why: problem "a turn or a wait that does not end".
9. **The X of the Inbox works on an open question.** The Inbox sends
   `QUESTION_DISMISS_MESSAGE`, and the server refuses it with 409 because
   the card has no answer (`card-dismissal.ts:13-14`,
   `use-inbox-actions.ts:19-24`). Plausible, from the code, not run. Out of
   our plan, but the same rule applies to any close button that we add.
10. **The window gets an error when the answer is pending.** On
    `settlementPending`, the store shows a global error and does not reset
    the card, so the card stays in "sending" (`store.tsx:2449-2451`).
    - Why: a known problem of the reference that we do not copy.
11. **Documents equal to the code.** The reference documents say a question
    "by default never runs out" (`docs/runtime-contract.md:40`, `:122`) and
    "waits however long they take" (`docs/team-cloud.md:949`). The code
    closes handed-on work after 72 hours. Two comments are stale:
    `src/lib/card-answer.ts:1` and `server/drivers/openai-chat.test.ts:516`
    still talk of a question timeout.
    - Why: the same problem as P121.

### The problems of `changelog.md` that the reference has here

| Problem (section 5 or 6 of `changelog.md`) | In this feature |
|---|---|
| A turn or a wait that does not end (v0.1.153, "closes after three, instead of waiting forever") | Fixed for handed-on work only (commit `7dd032b8d`, `runtime.ts:859-878`). A root question has no limit. The close can come later than 72 hours after a late reminder. Points 4 and 8 |
| The approval model (section 6, v0.1.126, "Question and approval cards no longer expire") | Commit `b82764109` removed the question timers in five drivers and missed `acp/core.ts:673-676`. Point 4 |
| The same work done or delivered two times, or lost | Guards: each driver deletes the ask before it replies, the server settles only an unanswered card (`index.ts:6593`), a fixed `sendId` for a late answer (`person-replies.ts:123`), a store patch before memory (`store.ts:1236-1250`). Gaps: Pi and Codex async report a wrong outcome (point 3). Muse deletes the ask before the command (`muse-code.ts:691`). If the command fails after the engine got it, the late path can send the answer two times (plausible, not traced). A late answer to an expired card goes through (point 7) |
| State lost at a restart or a crash | The card and the assignment are stored. The request map, the driver maps and the waiting chips are in memory (section 3.9). A live ask cannot be answered after a restart. Its answer becomes a new message. A "Waiting on your answer" chip can stay unsettled (plausible, not tested). Point 5 |

## 9. Not verified

- `server/permission-proxy.test.ts` and `server/teammate-follow-ups.e2e.test.ts`
  were not read.
- `server/runtime/envelope.ts` was not read. The text "The person answered:
  …" is seen only in tests.
- Where the `quotaSwitch` card is made, and if it carries `tool` or
  `requestType`.
- The Inbox internals: `server/host/person-inbox.ts`, `server/ask-routing.ts`,
  `packages/phone-protocol/src/inbox.ts`, `src/state/inbox.ts`.
- Whether the 409 of the Inbox "Close without answering" shows to the
  person (only `refreshInbox` runs on an error).
- Whether a Muse `userInput/answer` command that throws can already have
  reached the engine (a possible double answer).
- Whether the late answer to an expired child card starts a turn after the
  node failed (traced only to `person-replies.ts:63`, `:100`).
- Waiting chips left unsettled after a restart (`ask-cards.ts:90`, `:115`,
  not tested).
- What the Claude CLI does with `AskUserQuestion` at Full, when no
  `--permission-prompt-tool` is passed.
- `ApprovalCard`, `PendingApproval`, `AskingLine` and `ExpandableText` were
  not read. They belong to other features.
- `team-cloud.md:951` says the reminder is said in words in the Inbox. The
  code sends a notification (`ask-cards.ts:240`). No code for the words was
  found.
