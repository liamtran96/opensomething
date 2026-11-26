# Plan: Recovery and pausing

The proposals from the research file
[`../research/features/recovery-and-pausing.md`](../research/features/recovery-and-pausing.md)
(batch 8, reference commit `83d18e3af`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 3, 9, 13 and 15, and a new step "Recovery and pausing" after
  the cap step of P381 and the notifications step of P314 (P469).
- **State:** all open.
- **The main finding:** the reference gives a turn to a backup model only
  when it can prove that the first engine did no work. The driver throws
  `TurnNotStartedError` only after its process stopped, and `nothingRan`
  reads the rows of the turn. The holds, the moves, the sign-in waits and
  the pauses are in JSON files, and a failed save is only logged. The
  incident ledger and the turn budget of each Chief are in memory only
  (`server/contracts.ts:40-79`; `server/drivers/acp/core.ts:1362-1380`;
  `server/turn-outcome.ts:144-151`; `server/limit-failover.ts:152-158`;
  `server/host/chief-notices.ts:80-87`).

## Proposals

- **P453 (plan, step 3, `bot-engine`, amends P55). `NotStarted` carries a
  reason.**
  - `NotStarted { reason }` has these reasons:
    - `Transient`.
    - `SignInRefused`.
    - `UsageLimit { resets_at: Option<…>, scope: Engine | Model | Credits }`.
  - A hold at the start (a "known" refusal) is a separate refusal of the
    runtime, not of the driver.
  - Why: follows the reference. It has one base class,
    `TurnNotStartedError`, with two subclasses for a refused sign-in and a
    usage limit, and a `known` flag. Better than the reference: one enum
    that the take-over must match. The reference reads `instanceof` in a
    long `catch`, and it mixes the "known" holds of the runtime into the
    errors of the driver.
  - Source: `server/contracts.ts:40-79` (`:53` and `:67` extend the base);
    `server/index.ts:8299`, `:8371-8431`;
    `server/drivers/claude-auth-recovery.ts:85-95`.
- **P454 (plan, step 3, `bot-engine`, new facts for P55 and P60).
  `Err(NotStarted)` only after the engine process stopped.** The doc comment
  of `send_turn` says it. The contract test of P60 checks it with the fake
  driver: a `NotStarted` with a live process fails the test. Decide what
  "stopped" means when sessions share one process. P104 keeps one process
  for each thread in step 9, so this decision can wait for a shared process.
  - Why: follows the rule of the reference. Two engines must not work on
    one turn. The reference keeps the rule in comments in each driver.
    `server/drivers/acp/core.ts:1370` counts a shared process as stopped
    with no kill (`session.host.links.size > 0`).
  - Source: `server/drivers/acp/core.ts:1362-1380` (`:1370`);
    `server/drivers/claude-auth-recovery.ts:85-95`;
    `docs/verification/automatic-recovery.md:11-17`.
- **P455 (plan, new step "Recovery and pausing", `bot-core`). The backups of
  a bot.**
  - A bounded type `Backups` holds at most 5 `ModelSelection`. It has no
    duplicate and not the main model of the bot. Its constructor refuses
    each case with a typed error.
  - One backup for the installation, `automatic_recovery: { enabled,
    backup }`. "Enabled" needs a backup.
  - Two readers:
    - `startup_backups`: the list of the bot, else the installation backup.
    - `chosen_backups`: the list of the bot, then the installation backup.
  - A backup must keep the workspace and each tool capability.
  - Why: follows the reference. Better than the reference: the server drops
    a duplicate with no error and accepts the main model in the list. Only
    the UI stops it. The limit of 5 is in three places.
  - Source: `server/automatic-recovery.ts:10-43`;
    `server/routes/bot-patch.ts:254-275`;
    `server/cloud-send-kinds.ts:250-253`;
    `src/components/bot-panel/BackupAis.tsx:26`; `server/config.ts:259-263`.
- **P456 (plan, new step, `bot-core`, tables in the store of step 8, with
  P249). The holds in the store.**
  - Use tables for these:
    - the engine holds.
    - the model holds.
    - the sign-out holds.
    - the notice marks of each stretch.
    - the moves to go back.
  - The runtime writes a hold and its event in one transaction.
  - A move has one row for each thread, with no cap. P249 writes the move
    and the model change in one transaction.
  - Why: follows the rules of the reference:
    - a model hold of at most 6 hours.
    - a guessed hold of 1 hour.
    - a sign-out recheck after 1 hour.
    - a 30-day stretch, with a repeat each 24 hours.
    - going back at the next turn.

    Better than the reference: it has four JSON files, and a failed save is
    only logged or swallowed. The file of moves keeps 500 rows, and a thread
    past 500 never goes back. This is the problem "State lost at a restart".
  - Source: `server/limit-resets.ts:110`, `:365-389`;
    `server/host/limit-takeover.ts:28-35`, `:125-133`;
    `server/limit-failover.ts:117`, `:152-158`;
    `server/limit-notices.ts:106`.
- **P457 (decision, new step). No account rotation at a usage limit.**
  Another sign-in to the same subscription never takes over a limit. A key
  that bills each use can. Another sign-in can take over a sign-out.
  - Why: follows the reference. The reference says that rotating accounts
    "breaks its terms and can get the accounts closed".
  - Source: `server/limit-failover.ts:18-31`;
    `server/host/limit-takeover.ts:183-184`.
- **P458 (plan, steps 13 and 15, `bot-core`, amends P165, with P381). One
  admission gate with a typed refusal for a pause.**
  - The refusal enum of the admission has `Held { by: Bot | Department |
    All }`, next to `CapReached` (P381) and `Busy`. Each entry point calls
    one function: a message, a hand-off, a routine, a room turn and a
    resend.
  - The runtime saves the pause in the store before the state in memory
    changes.
  - A pause that the runtime cannot read is a typed error, not "nothing
    paused".
  - Step 15 adds this: the runtime cancels a due run of a held bot quietly.
  - Why: follows the behaviour of the reference: the 409 `bot_held`, the
    hand-off text "Do not retry", the room skip and `newlyHeld`. Better than
    the reference: it checks the pause in at least seven places.
    `server/host/bot-holds.ts` changes memory before the save, and it reads
    a damaged file as "nothing paused".
  - Source: `server/host/bot-holds.ts:53-54`, `:81-100`;
    `server/routes/bot-holds.ts:53-56`; `server/index.ts:1657`, `:3846`,
    `:5002`, `:7443`, `:9496-9502`, `:11371`;
    `server/routines.ts:1142-1144`.
- **P459 (plan, new step, `bot-core`). The incident ledger in the store,
  and the retry limit enforced.**
  - These go into the store: the count of each thread in the hour, the time
    of the last report, and the turns of each Chief in the hour.
  - The retry endpoint refuses a third retry with a typed refusal.
  - Why: follows the limits of the reference: 2 retries, a mute from the
    6th incident in an hour, 6 Chief turns in an hour, and one automatic
    retry. Better than the reference:
    - the ledger and the budget are in memory. A restart resets them, and
      the check "finished since it was reported" loses its time.
    - the endpoint does not read the ledger. Only the prompt stops a third
      retry.

    This is the problem "The same work done two times".
  - Source: `server/host/chief-notices.ts:80-87`, `:110-120`;
    `server/incidents.ts:67-123`; `server/index.ts:13701-13732`.
- **P460 (decision, new step). The rule of the mute.** In the code of the
  reference, muted incidents also count, so a loop that keeps failing stays
  muted. The document of the reference says that the mute ends when the
  hour passes.
  - Option a: follow the code. It is safer against a storm.
  - Option b: count only the reports that the Chief got. It follows the
    document.
  - Why: the code and the document differ. The author decides.
  - Source: `server/incidents.ts:114-121`; `docs/team-incidents.md:42-44`.

The proposals P461 to P470 come in the next pull request.
