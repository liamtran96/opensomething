# Plan: Work digests

The proposals from the research file
[`../research/features/work-digests.md`](../research/features/work-digests.md)
(batch 10, reference commit `fcce0b6de`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** none yet. The digest needs the store (step 8) and the tool rows
  (step 12). The file list needs checkpoints, which we do not plan. The
  hooks need a Claude adapter, and step 9 is an ACP adapter.
- **State:** all open.
- **The main finding:** a digest is a short record of what a turn did: its
  tools, its files and its memory changes. The reference builds it after
  the turn ends, from four maps in memory, and removes the maps first. A
  crash between the turn end and the digest write loses the digest, and no
  code makes it again at start (`server/index.ts:5445-5451`). Only the hooks
  of Claude Code give full tool results, so every other engine gets a
  digest "from tool previews" (`server/digest.ts:120-122`).

## Proposals

- **P515 (plan, after steps 8 and 12). The digest is written in the
  transaction of `turn.completed`.** The core builds it from stored rows,
  with no file list. The file list is a later patch with its own receipt.
  It goes with P37 and P124.
  - **Problem in the reference:** the inputs of the digest are in four maps
    in memory, and the code removes them before it writes the digest
    (`server/index.ts:5445-5451`, `:5467-5476`). A crash between the two
    loses the digest. The release problem: "State lost at a restart or a
    crash" (v0.1.107, v0.1.165).
  - If accepted, a new decision: a turn digest is a stored message kind, as
    in the reference (`server/message-db.ts:23`). The patch of the file list
    uses a receipt, as `withCommandReceipt` does
    (`server/message-db.ts:254-272`).
- **P516 (plan, with P515). "Busy" ends before the file diff.** The thread
  is idle at once, and the diff patches the digest later.
  - **Problem in the reference:** a 1:1 turn in a project folder holds
    "busy" and the queue until the diff ends, up to 3 s
    (`server/index.ts:5483-5496`, `:6759-6761`).
  - Judgment call: the wait has a limit, so no release names this.
- **P517 (plan, only with checkpoints). A time limit on the snapshot before
  dispatch.**
  - **Problem in the reference:** dispatch waits for the snapshot with no
    limit of its own (`server/index.ts:8152-8154`). Each git call can take
    120 s (`server/checkpoints.ts:113`), and all git work of one folder is
    in one queue (`:263-276`). A slow git delays the next turn. The release
    problems: "One slow or stuck part blocks all the others" (v0.1.114,
    v0.1.177) and "A turn or a wait that does not end" (v0.1.132).
- **P518 (plan, with P515). No copy of the usage in the digest.** A reader
  gets the usage row of P124 and P380 by the turn id.
  - **Problem in the reference:** the room digest drops `cachedInput`
    (`server/index.ts:6797`), but the ledger of the same turn keeps it
    (`:6778`). The copy is never corrected (`server/digest.ts:89`).
  - Judgment call: no code reads `digest.usage`, so nobody sees the wrong
    number today.
- **P519 (decision, extends D22). A driver capability says that the driver
  gives full tool results.** The digest never infers it from the name of
  the engine.
  - **Problem in the reference:** only the Claude hook sets `fullResult`
    (`server/index.ts:5425-5426`). The chat API driver gives its tool rows
    an `itemId` (`server/drivers/openai-chat.ts:816`, `:877`), so its turns
    are always "from tool previews" (`server/digest.ts:120-122`).
  - Judgment call: no release names this.
- **P520 (plan, with a Claude adapter). Keep no full-output file that
  nothing reads.** Keep only the flag and the length.
  - **Problem in the reference:** each hook result goes to a file that
    nothing reads back (`server/host/tool-results-sweep.ts:5-6`). The sweep
    runs on a Cloud home only (`:169-172`), so on a desktop the files stay.
    The redaction knows only fixed key shapes (`shared/redact.ts:12-14`), so
    the output of `cat credentials.json` can stay on disk. The release
    problem: "A secret or an access right in the wrong place" (v0.1.154,
    v0.1.182).
- **P521 (plan, only with checkpoints). Secret file names stay out of the
  digest.** One deny list with a test covers the checkpoint copy and the
  digest, and paths go through the redaction.
  - **Problem in the reference:** the diff lists each path that `EXCLUDES`
    does not name (`server/checkpoints.ts:27-109`), for example
    `credentials.json` or `id_rsa`. The path goes into a row that is stored,
    searched and replayed, and the patch does not redact
    (`server/store.ts:1234-1246`). The release problem: "A secret or an
    access right in the wrong place" (v0.1.101, v0.1.182).
  - If we port the checkpoints, `NOTICE` gets the credits of Cline,
    Roo-Code and Gemini CLI (Apache-2.0), which `server/checkpoints.ts:5-9`
    names. The `NOTICE` of the reference does not have them.
- **P522 (plan, with P515). No reply sentence in the digest line.** The line
  that goes into a context window has the tools, the files and the memory
  only.
  - **Problem in the reference:** `digestPromptLine` puts the first sentence
    of the reply into each context window (`server/digest.ts:138`,
    `:147-151`). The room window already shows the reply line of the speaker
    (`server/host/room-transcript.ts:56-66`), so the sentence is there two
    times.
  - Judgment call: no release names this.
- **P523 (plan, with a Claude adapter). A random hook token for each
  turn.** How to keep the token from the Bash tool is open.
  - **Problem in the reference:** the bearer stays the same for each bot,
    thread and grant set (`server/index.ts:1650-1652`). The token file is
    mounted into the sandbox, and its path is on the environment allow list
    (`server/drivers/claude.ts:1267`, `server/bot-box/env.ts:31`). The
    sandbox is for Linux only. So a shell command of the bot can probably
    post a `PostToolUse` for its own tool ids and mark the turn `full` with
    false text. Not verified: whether the Bash tool gets that variable. The
    release problem: "A secret or an access right in the wrong place"
    (v0.1.181).
- **P524 (plan, only with checkpoints). The file list says that a change can
  come from somebody else.**
  - **Problem in the reference:** the diff compares the commit before the
    turn with the folder after it (`server/checkpoints.ts:905`). An edit of
    the person or of another thread during the turn shows as work of the
    bot.
  - Judgment call: no release names this.

## Notes

These texts of the reference are out of date. Our docs page for the feature
says what the code does:

- `server/hooks/omb-hook.ts:3` and `server/drivers/claude.ts:1083-1084` say
  that the token changes each turn. It does not (P523).
- `scripts/bundle-server.mjs:53-54` names a `Stop` hook.
- `docs/verification/digests.md:55` says 600,000 ms. The code has one day
  (`server/system-prompt.ts:296`).
