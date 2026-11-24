# Plan: The engine process lifecycle

The proposals from the research file
[`../research/features/engine-process-lifecycle.md`](../research/features/engine-process-lifecycle.md)
(batch 4, reference commit `ed8cb7278`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 3, 9, 10.
- **State:** all open. Decide P65, P66 and P67 before step 3 is typed,
  because they change the `interrupt` method of the `Driver` trait.
- **The main finding:** the reference has four different stop sequences
  and no single rule for a stop that it cannot confirm. A stop of a process
  tree returns `true` or `false`, and `true` can mean "never started"
  (`server/procs.ts:604-670`).

## Proposals

- **P65 (step 3). A stop has a time limit, and the turn always ends with
  `turn.completed`.** When the stop is not confirmed, the outcome says so.
  - Kind: better than the reference.
  - Why: pi sends no `turn.completed`, Claude releases the turn with a
    warning, Codex retries for about 60 s, and the Stop route waits with no
    limit. D20 says that `turn.completed` is always the last event.
  - Source: `server/drivers/pi.ts:528-546`, `server/drivers/claude.ts:1645-1650`,
    `server/drivers/codex.ts:681-686`, `server/drivers/codex-process.ts:80-87`,
    `server/index.ts:2243`.
  - Changes: D22 (a sentence on the time limit), PR 3.3. Related: P35, P56.
- **P66 (steps 3 and 9). A tree stop returns an enum:** `Gone`,
  `NotConfirmed { survivors }`, `NeverStarted`.
  - Kind: better than the reference.
  - Why: the compiler makes each caller handle each case. The reference
    returns `true` for a process with no id, and on Windows `true` when the
    root exited while its children still run.
  - Source: `server/procs.ts:604-618`, `:609`, `:670`.
  - Changes: step 9. PR 3.3 uses it if P65 needs an outcome from `interrupt`.
- **P67 (step 9). One stop sequence for all drivers:** the protocol
  interrupt, the end of input, SIGTERM, then SIGKILL. A driver gives only
  its protocol message and the time of each step.
  - Kind: better than the reference.
  - Why: less code, and the same stop on each engine. Codex waits 1.5 s and
    kills, Claude kills at once, ACP waits 5 s, and a helper uses 500 ms
    and 1,500 ms.
  - Source: `server/drivers/codex.ts:646-666`, `server/drivers/claude.ts:1776-1783`,
    `server/drivers/acp/core.ts:1042-1055`, `server/engine-stop.ts:11-15`.
  - Changes: a PR of step 9 before the first adapter. When it is decided,
    correct `../comparison.md:85`: only the callers of `stopEngineTree`
    close stdin first.
- **P68 (step 9). A process group on Linux and macOS, a Job Object on
  Windows.**
  - Kind: follows the reference on Linux and macOS. Better on Windows.
  - Why: `taskkill /T` fails when one process cannot stop. The stop does
    not check the children after the root exits. There is no check for a
    reused process id. No test covers the failure of `taskkill`.
  - Source: `server/procs.ts:429-430`, `:670-705`,
    `server/kill-tree-windows.test.ts:26-73`.
  - Changes: step 9. Check the version and the license of `process-wrap`
    first. P41 also tests a root that exits before its children, and a
    failed stop.
- **P69 (step 9). A run tag and a restart sweep.** Each run makes a tag and
  a record file for each engine. At the next start, the program stops what
  a dead run left. It never finds a process by name.
  - Kind: follows the reference.
  - Why: an engine leads its own session, so nothing stops it when our
    process dies. With D10, a crash of the desktop leaves its engines
    running. On Windows, P68 makes the sweep unnecessary.
  - Source: `server/engine-records.ts:1-10`, `:126-163`, `:183-281`,
    `server/procs.ts:423-428`.
  - Changes: a PR of step 9, after the stop function.
- **P70 (steps 9 and 11). A limit on engine processes.** Choose one:
  - a: an idle-engine cap, as the reference. One list of idle engines, a
    cap from the memory of the computer, the least recently used closes
    first. An engine with a turn never closes.
  - b: one gate that counts the memory and the processes of each new
    engine process (the proposal in section 7 of
    [`changelog.md`](../research/changelog.md)).
  - Kind: a follows the reference. b is better than the reference.
  - Why: the desktop app of the reference uses only the threads of each bot
    and the idle cap. Its other gates are off there.
  - Source: `server/drivers/session-idle.ts:15`, `:113-141`,
    `server/process-room.ts:226-233`, `:65-175`.
  - Changes: step 9.
- **P71 (step 9, or the first step with steer). A test that a steer never
  kills the engine.** The process id is still alive, and no error event
  came.
  - Kind: follows the reference.
  - Source: `server/drivers/codex.test.ts:3729-3820`,
    `docs/specs/steer-vs-queue.md:62-71`, `docs/specs/steer-sigterm-audit.md`.
  - Changes: the "done when" of the step that adds steer.
- **P72 (steps 9 and 10). Our side makes the id of each engine request.**
  The driver keeps the id of the engine only to send the answer. A request
  after the turn end gets a typed refusal at once and opens no card. At the
  turn end, the driver answers each waiting request. An unknown method gets
  `-32601`.
  - Kind: follows the Codex and ACP drivers. Better than the Claude broker.
  - Why: a repeated id from the engine cannot replace a waiting request. An
    engine that gets no answer waits.
  - Source: `server/drivers/codex.ts:671`, `:806`,
    `server/drivers/acp/core.ts:500-508`, `:524-531`, `:572-575`, `:619`,
    `server/drivers/claude.ts:475-497`, `:564-569`.
  - Changes: step 10, "done when": a request after the turn end shows no
    card. Related: P44, P45.
- **P73 (step 10). One time limit for each kind of request**, a permission
  and a question, in one place.
  - Kind: better than the reference.
  - Why: a question with no limit is a wait that does not end. Claude and
    Codex give 15 minutes to a permission and no limit to a question. ACP
    gives 15 minutes to each.
  - Source: `server/drivers/claude.ts:448`, `:511`, `server/drivers/codex.ts:838`,
    `server/drivers/acp/core.ts:672-675`.
  - Changes: step 10. Related: P6, P118.

## New facts for proposals that exist

- **P61 and P63 stay.** The reference gives an engine all of `process.env`
  less a list, and its fake Claude engine reads many environment variables
  (`server/drivers/acp/core.ts:339-350`, `server/testing/fake-claude-cli.ts:2-102`).
- **P95** (the threat model) takes four items from this research:
  1. a request socket with mode 0600 that fails closed,
  2. the MCP config as a 0600 file that the turn end deletes,
  3. the Windows command line limit of 30,000 characters,
  4. a sweep that never finds a process by name
  (`server/drivers/claude.ts:528-563`, `:842-849`, `server/procs.ts:37-57`).
