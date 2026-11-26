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
  - **Problem in the reference:** The take-over finds the reason of a refusal
    with `instanceof` checks in a long `catch`. A new kind of refusal can fall
    through, and no compiler stops it (`server/index.ts:8371-8431`;
    `server/contracts.ts:40-79`).
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
  - **Problem in the reference:** The server accepts a duplicate backup with
    no error, and it accepts the main model in the backup list. Only the UI
    stops this (`server/routes/bot-patch.ts:254-275`;
    `src/components/bot-panel/BackupAis.tsx:26`).
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
  - **Problem in the reference:** A failed save of a hold is only logged, so a
    restart can forget the hold (`server/limit-resets.ts:365-389`;
    `server/host/limit-takeover.ts:125-133`). The list of moves keeps 500
    rows, and a thread past 500 never goes back to its own engine
    (`server/limit-failover.ts:117`).
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
  - **Problem in the reference:** A damaged pause file reads as "nothing
    paused", so each paused bot starts again
    (`server/host/bot-holds.ts:53-54`). A pause changes the memory before the
    save (`server/host/bot-holds.ts:81-100`). Seven places check the pause,
    each in its own way (`server/index.ts:1657`, `:3846`, `:5002`, `:7443`,
    `:11371`; `server/routines.ts:1142-1144`).
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
  - **Problem in the reference:** A restart sets the incident counts to 0, and
    the retry endpoint does not read them. So a crash loop gets new reports
    and new retries after each restart (`server/host/chief-notices.ts:80-87`;
    `server/index.ts:13701-13732`).
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
- **P461 (plan, new step, `bot-core`). The replay rule as one function.**
  `may_replay` is true only for "before accept". It reads the state of the
  driver protocol and never the error text. `nothing_ran` reads the rows of
  the turn. The take-over, the resend between bots, the room resend and the
  sign-in resume all use these two functions.
  - Why: follows the reference. It is the guard against work done two
    times.
  - Source: `server/resume-recovery.ts:1-42`;
    `server/turn-outcome.ts:144-151`; `server/index.ts:8373-8374`.
- **P462 (plan, new step, `bot-core`). The sign-in resume keeps a failed
  resend.**
  - A wait for a sign-in is a row in the store.
  - When a send fails, or the thread is busy, the wait stays inside the
    24-hour window.
  - **Problem in the reference:** The sign-in resume removes a wait after one
    try, also when the send fails. That turn is then never sent
    (`server/host/sign-in-resume.ts:119-134`, `:183-194`).
  - Why: follows the reference: a 24-hour window, rechecks from 15 s to 5
    minutes, a stop after 5 reads, and only `unsent` turns. Better than the
    reference: it removes a wait after one try, also when the send fails,
    and it drops the wait of a busy thread.
  - Source: `server/host/sign-in-resume.ts:18-23`, `:119-134`, `:183-194`.
- **P463 (decision). Do not port the old quota card or the environment
  switch `OMB_QUOTA_SWITCH`.**
  - Why: less code. The card answers only cards of an earlier version. The
    switch is an environment variable that `config.json` cannot change, and
    D10 keeps settings out of the code. The choice of backups by the person
    is the switch.
  - Source: `server/quota-switch.ts:87-89`, `:305-396`;
    `server/quota-switch.test.ts:42-48`, `:89`.
- **P464 (plan, the table "The problems of the reference, and the
  proposals").** Change these rows:
  - "Sign-in to an engine, engine CLIs that change: P10, P11. No other": add
    P453, P462, P467 and P470 (`server/drivers/claude-auth-recovery.ts:23-50`,
    `server/host/limit-takeover.ts:89-93`, `server/drivers/acp/grok.ts:254-260`).
  - "The same work done two times, or lost": add P454, P459 and P461
    (`server/drivers/acp/core.ts:1370-1380`,
    `server/host/chief-notices.ts:110-120`, `server/turn-outcome.ts:144-151`).
  - "State lost at a restart": add P456, P458, P459 and P462
    (`server/limit-failover.ts:117`, `server/host/bot-holds.ts:53-54`,
    `server/host/chief-notices.ts:80-87`,
    `server/host/sign-in-resume.ts:183-194`).
  - "Busy and races between bots": add P458 (`server/index.ts:7443`,
    `:11919`).
  - "A turn or a wait that does not end": add P465 (`server/index.ts:11919`).
  - Why: the table must name each proposal that answers a problem.
- **P465 (plan, new step, `bot-core`). A time limit on the stop of a
  pause.** The stop of the running turns of a paused bot has a limit. The
  runtime reports a turn that does not stop in time, and the pause stays.
  - **Problem in the reference:** The stop of a pause waits for each interrupt
    with no time limit, so one stuck engine holds the pause
    (`server/index.ts:11919`; `src/lib/bot-pause.ts:29-35`).
  - Why: better than the reference. It awaits each interrupt with no limit,
    and the client waits up to 60 s. "One slow or stuck part blocks the
    others" is a problem of the reference.
  - Source: `server/index.ts:11919`; `src/lib/bot-pause.ts:29-35`.
- **P466 (plan, step 9, `bot-engine`). An internal error retires the
  process.** A JSON-RPC -32603 marks the session as failed. The driver ends
  the turn one time and never sends an accepted prompt again. The next turn
  starts a new process and loads the session. The driver rebuilds a lost
  session one time from the stored conversation.
  - Why: follows the reference.
  - Source: `server/drivers/acp/rpc-error.ts:35-36`;
    `server/drivers/acp/core.ts:1150-1181`, `:1390-1400`;
    `server/drivers/acp/acp.test.ts:3195-3231`.
- **P467 (plan, step 9, `bot-engine`). Picture input is a capability from
  the handshake of the engine.** The driver accepts images when
  `initialize` says so. A known exception is a runtime that says "no" but
  accepts images. The adapter computes this capability from the version
  that the runtime reports, not from the driver name. A turn with images on
  a runtime with no image input fails with a plain message.
  - Why: follows the reference. `AGENTS.md` gates engine behaviour by
    capability flags. D22 adds the `Capabilities` struct with the first
    step that reads a flag, and this is such a flag.
  - Source: `server/drivers/acp/core.ts:1108-1116`;
    `server/drivers/acp/grok.ts:254-260`;
    `docs/verification/provider-recovery.md:17-22`.
- **P468 (plan, new step, `bot-desktop`). The UI of recovery and pausing.**
  - The "Backup AIs" card in the bot panel, with no switch and at most 5.
  - The installation backup in Settings, in Advanced, for admins.
  - The `recovery:` and `notice:` status lines, with "Sign in" on a setup
    notice.
  - "Pause bot", "Pause department" and "Pause every bot" in the menus,
    with no confirmation dialog. The label changes from the state on the
    server.
  - The "Paused" mark on the row.
  - Why: follows the reference and `DESIGN.md`: a status mark on its row,
    one home for each setting, and no confirmation dialog.
  - Source: `src/components/bot-panel/BackupAis.tsx`;
    `src/components/AutomaticRecoverySettings.tsx`;
    `src/components/StatusActivityRow.tsx:21-35`;
    `src/components/SidebarBotMenu.tsx:213-221`; `DESIGN.md:52-55`, `:64`,
    `:293`. The proposal list of the batch gave `DESIGN.md:51-52` and `:285-299`. Line 51 is
    about the thread pill, and lines 285-299 are the full table of
    components. The rules are at the corrected lines.
- **P469 (plan, "Gaps that have no step").** Add this line: "Recovery and
  pausing has no step yet. The engine part goes to steps 3 and 9 (P453,
  P454, P466, P467, P470). The pause gate goes to steps 13 and 15 (P458). A
  new step after P381 and P314 has the rest (P455 to P457, P459 to P463,
  P465, P468)." The new step must come after these:
  - step 13, because the runtime owns the work state.
  - step 14, because incidents need `coordinate_bots` and a Chief.
  - step 15, because a pause and a reset act on routines.
  - P381, because the take-over runs the spend gate again.
  - P314, because "{who} hit a problem" is a notification.
  - Why: the plan must say where each researched feature goes. The spend
    gate in the take-over and the notification of an incident force the
    order.
  - Source: `server/index.ts:8450` (the spend gate);
    `server/host/chief-notices.ts:181-192` (the notification);
    `server/routines.ts:1142-1144` (routines);
    `server/index.ts:13701-13732` (the tool of the Chief needs a team).
- **P470 (plan, step 9 and the new step, `bot-engine`). Limit reports and
  refusal frames are driver capabilities.** A driver says if its engine
  reports plan usage, if a meter is only shown, and how it marks a refused
  sign-in or a usage limit. The runtime reads only these flags.
  - **Problem in the reference:** The limit reports are read through lists of
    engine names and through frame shapes of given CLI versions. A CLI update
    can break the detection (`server/limit-resets.ts:22`, `:25-26`;
    `server/drivers/claude-auth-recovery.ts:23-24`).
  - Why: better than the reference. `AGENTS.md` gates engine behaviour by
    capability flags, never by the name of a driver. The reference has lists
    by engine name, and frame shapes that are tied to CLI versions.
  - Source: `server/limit-resets.ts:22`, `:25-26`;
    `server/drivers/claude-auth-recovery.ts:23-24`, `:35-36`.

## New facts for proposals that exist

- **P55:** P453 adds the reason to `NotStarted`, and P454 adds the rule
  "only after the process stopped" to the doc comment of `send_turn`.
- **P60:** the contract test also checks that the fake driver returns
  `NotStarted` only after its process stopped (P454).
- **P165:** the refusal enum of the admission gets `Held` (P458), next to
  `CapReached` of P381.
- **P249:** the rows of P456 for the moves to go back are the "record to go
  back" that P249 writes in one transaction.

## Notes

Each T of the batch has a P-number. This note has no P-number because it is
outside `docs/plan/` and `docs/decisions.md`. Three rows of
`docs/comparison.md` are out of date (section 1 of the research file):

- line 207: only a backup that the person chose takes over (since v0.1.166,
  `server/host/limit-takeover.ts:193-197`).
- line 246: the webhook path of a pause is now traced. The runtime cancels a
  due run quietly (`server/routines.ts:1142-1144`).
- line 311: add the automatic retry and the limits
  (`server/host/chief-notices.ts:269-278`, `server/incidents.ts:67-71`).
