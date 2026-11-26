# Plan: Team Board

The proposals from the research file
[`../research/features/team-board.md`](../research/features/team-board.md)
(batch 9, reference commit `140172d88`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 12, 13 and the rooms step of P286, which does not exist yet.
- **State:** all open.
- **The main finding:** the board is a second record of work beside the
  runtime. `board.json` holds the claim, and the runtime holds the turn. The
  lease is the turn: a thread that is idle 20 s after the take counts as a
  lost turn, and the third lost turn fails the item. A file that cannot be
  read becomes an empty board, and the next change writes it over the old
  file. The board came in v0.1.181 with no release note, so each "Problem in
  the reference" line names the releases of its theme in section 5 of
  `changelog.md` (`server/board/store.ts:37-49`; `server/board/host.ts:66-69`;
  `server/board/dispatcher.ts:79-83`, `:105-112`).

## Proposals

- **P484 (choice, gap, waits for the rooms step of P286). Do we build a
  board, and how?** If we build it, its items are rows of the runtime of
  step 13, not a second store.
  - **Problem in the reference:** `take` writes the claim before the turn
    starts (`server/board/dispatcher.ts:147-148`). A crash between the two
    writes leaves the item `working` with no turn. Two minutes later the
    board gives it back and counts a try, and another bot can do the work
    again (`dispatcher.ts:105-112`). The release problem: "The same work
    done two times, or lost" (v0.1.74, v0.1.83, v0.1.108), and section 6,
    "Work between bots".
  - Options:
    - a. No board now. P220 ("no task board") stays.
    - b. A board that only shows the assignment rows (P285).
    - c. A full board made of runtime rows, after the rooms step.
- **P485 (plan, with P484 c). A board store that does not open gives a
  typed error, never an empty board.**
  - **Problem in the reference:** a `board.json` that cannot be read, or
    that is newer, reads as empty, and the next change erases each item of
    each room (`server/board/store.ts:37-49`; `server/board/host.ts:66-69`).
    The test `host.test.ts:178-185` expects this. The release problem: "A
    file written over after a failed read" (v0.1.103, v0.1.107, v0.1.151).
- **P486 (plan, with P484 c). The claim ends on `turn.completed` with its
  outcome, in one transaction. A turn that did not start is a typed refusal
  and counts no try.**
  - **Problem in the reference:** a thread that is idle 20 s after the take
    counts as a lost turn (`dispatcher.ts:105-112`). A start with no bot to
    answer returns with no error and uses a try
    (`server/index.ts:10695-10712`). Talk of a person in the thread keeps
    the lease with no limit (`server/board/wiring.ts:83`). The release
    problems: "Busy and races between bots" (v0.1.21, v0.1.81, v0.1.149),
    and "State lost at a restart".
- **P487 (plan, with P484 c). One admission function makes each claim, also
  on the path of a reply of a person.**
  - **Problem in the reference:** a reply of a person resumes an item with
    no check for a free bot (`server/routes/channels.ts:509-527`;
    `dispatcher.ts:209-212`), so the bot holds two active items
    (`dispatcher.test.ts:238-249`). The release problem: "Busy and races
    between bots" (v0.1.21, v0.1.81).
- **P488 (plan, step 13, with P484 c). At start, the runtime decides each
  claim from the stored rows with the restart rule of step 13.** No wait of
  two minutes and no guess.
  - **Problem in the reference:** after a restart nothing starts for 2
    minutes, then idle threads count as lost, and a crash in a take uses a
    try (`dispatcher.ts:52`, `:159`). The release problem: "State lost at a
    restart" (v0.1.24, v0.1.165, v0.1.180).
- **P489 (plan, with P484 c, see P224). Each wait of the board has a
  deadline and a state that a person can see.**
  - **Problem in the reference:** these items wait with no end, and no UI
    shows them: an item for a bot that left the room
    (`dispatcher.ts:136-137`, `:178`), an item whose need failed
    (`server/board/state.ts:184-186`), and a question to a person with no
    answer (`state.ts:126`). The release problem: "A turn or a wait that
    does not end" (v0.1.123, v0.1.151, v0.1.153).
- **P490 (plan, with P484 c, D17). `board_add` and the create of a person
  take an id that the caller makes. The thread and the item are written in
  one transaction.**
  - **Problem in the reference:** a retry after a lost answer makes a second
    set of threads (`server/routes/board-tools.ts:54-64`;
    `server/routes/board.ts:92-95`). A failed save leaves a thread with no
    item (`host.ts:162-169`). The release problem: "The same work done two
    times, or lost" (v0.1.83, v0.1.108, v0.1.150).
- **P491 (plan, with P484 c). Save a move before anything is sent, check the
  claim of the calling turn, and keep a late result.**
  - **Problem in the reference:** `ask` sends the question before it saves
    the move, so a retry asks the person two times
    (`board-tools.ts:202-203`). The holder check uses only the bot id
    (`state.ts:111`). A change of labels has no check
    (`board-tools.ts:224`). A DELETE of a person during a turn discards the
    result of the bot (`board.ts:104-107`). The release problem: "The same
    work done two times, or lost" (v0.1.83, v0.1.108).
- **P492 (plan, with P484 c). A usage cap holds only its own bot. Only the
  shared spend limit holds all rooms.**
  - **Problem in the reference:** the cap of one bot stops the dispatch in
    each room (`dispatcher.ts:85-92`, `:141`). The release problem: "One
    slow or stuck part blocks the others" (v0.1.114, v0.1.136, v0.1.153,
    v0.1.177).
- **P493 (plan, step 12, see P48 and P444). The board tools are in a tool
  group that a person can turn off, at the end of the catalog, with a
  golden test.**
  - **Problem in the reference:** they are core tools
    (`server/drivers/agents-tool-groups.ts:35`), they add 2,055 bytes to
    each turn (`server/drivers/agents-catalog-goldens/profiles.json:1880`,
    `:1954`), and they are in the middle of the catalog, so the switch
    changes the cached part of each tool after them
    (`server/drivers/agents-catalog.ts:655`). The release problem: "The
    size of the tool list" (v0.1.101, v0.1.111, v0.1.120, v0.1.141).
- **P494 (plan, with P484 c). Read only open items, through an index, and
  give `board_list` in pages.** A judgment call: it answers the row "The
  runtime scans all ended work" of section 7 of `changelog.md`, not a
  problem of section 5.
  - The reference: each pass reads all items again for each pair of an item
    and a bot (`host.ts:86-93`; `dispatcher.ts:121`, `:140`). Settled items
    stay. `board_list` can hide an old open item behind newer settled items
    (`board-tools.ts:179-185`).
- **P495 (plan, with P484 c). The opening text comes from stored fields and
  goes only to the holder. An `@` name in model text does not choose who
  answers.** A judgment call: no release problem. It follows our rule that
  the text that opens a delegated turn comes from stored data.
  - The reference: a bot that writes "@everyone" in a `board_add` brief or a
    `later` note starts each bot of the room (`wiring.ts:67-76`, `:154-159`;
    `server/store.ts:225-234`).
- **P496 (plan, with P484 c). The tool descriptions give the limit of 3
  tries and of 20 `later` moves.** A judgment call: no release problem. The
  reference does not tell the model
  (`server/drivers/agents-board-tools.ts:18-74`).
- **P497 (note, step 13, with P484 c). Board scenarios in the invariant
  tests of the runtime:** three tries, the 21st `later`, a restart while an
  item is `working`, a crash between the take and the start, and two active
  items for one bot. It follows the test style of the reference and adds
  the cases that `dispatcher.test.ts` and the two end-to-end tests do not
  have.
- **P498 (note, follows the reference). The board switch is one setting,
  read by the code that builds the board.** It is not a capability flag of
  a driver (D22), and we have no Team Cloud (D10). Source:
  `server/config.ts:229`; `server/index.ts:1802`, `:11371`.

## Other notes

- Three sentences of done research files are true for the plan of
  2026-08-31, but not for the Team Board, which came later:
  `../research/features/team-structure.md:764-765` and `:1037`, and
  `../research/features/bot-coordination.md:1159-1160`. They get a scope
  note in the batch 9 pull request.
- Not verified: whether the limits of unattended turns (4 hours, 400
  requests, 5 denials) apply to a board turn. The path of a room member
  (`server/index.ts:9460-10300`) has no `markUnattended` call. P486 and
  P489 depend on it.
