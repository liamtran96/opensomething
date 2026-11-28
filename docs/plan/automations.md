# Plan: Automations

The proposals from the research file
[`../research/features/automations.md`](../research/features/automations.md)
(batch 6, reference commit `eee23ebbe`, with the changes up to `e1cc6a290`
after the release v0.1.186: P174 and P177 are corrected, and P748 to P754 are
new). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. All paths below are in the reference project.

- **Steps:** 15, and a part after step 16 for proactive routines.
- **State:** all open.
- **The main finding:** the reference keeps automations in eleven files, each
  with its own write order. This gives six places where work is lost or done
  two times. Two files (`waits.json`, `check-backs.json`) load as empty
  after a failed read, and the next save writes over them
  (`server/waits.ts:169-179`, `:459-463`; `server/host/check-backs.ts:87-97`).

## Proposals

- **P173 (decision, step 15). Where the webhook receiver goes.** Decision
  D10 has no HTTP server in the core, and a webhook needs a listener.
  - Option a: the listener goes in `bot-cli`. The records and the rules stay
    in `bot-core`.
  - Option b: webhooks leave step 15.
  - Source: `server/webhook-ingress.ts:9`; `server/index.ts:9362-9374` (at
    `e1cc6a290` `:9363-9375`).
- **P174 (decision, step 15). The records of automations go in the SQLite
  store of step 8, with one transaction for each change.** A unique key
  `(routine_id, due_at)` replaces the ledger file and its leases. A foreign
  key to the bot replaces the clean-up at start.
  - **Problem in the reference:** A damaged `bots.json` loads as no bot, and
    the start then makes a default bot. The clean-up that runs after it
    finds one bot and deletes the automations of all the other bots
    (`server/store.ts:299-303`, `:2248-2253`; `server/index.ts:2808`,
    `:9349`; `server/bot-automations.ts:33-37`). The release problem: "A
    file written over after a failed read" (v0.1.103, v0.1.107).
  - At `e1cc6a290` the chain is still present. The failed load still gives
    no bot (`server/store.ts:299-303`). The seed is at
    `server/store.ts:2247-2252` and `server/index.ts:2809`. The clean-up is
    at `server/index.ts:9357`. `server/bot-automations.ts` did not change.
  - Why: better than the reference. Six places lose or double work: the
    routine file is saved before the ledger; a post to a chat and a post to
    a room happen before their receipt is saved; a wait is deleted before
    its follow-up is queued; a check-back saves `startingAt` before the
    start; the holds stay in memory after a failed save. And a corrupt
    `bots.json` deletes automations: the start seeds a default bot when no
    bot loads (`server/store.ts:2249-2253`, `server/index.ts:2808`), so the
    clean-up that runs after it (`:9356`) finds one bot and removes the
    automations of all the others (`server/bot-automations.ts:31-37`).
  - At `e1cc6a290`: the reference did not repair these problems. After the
    tag, it writes the busy marks of one scheduler pass in one write of the
    whole file (`server/save-batch.ts:21-36`, `server/routines.ts:1138`,
    commit `2d156d909`). This lowers the cost of whole-file saves and does
    not change the write order. With one transaction for each change, the
    port does not need that batch (P753).
  - Source: `server/routines.ts:934-936`, `:1516-1552`;
    `server/routine-occurrences.ts:192-239` (at `e1cc6a290` `:195-242`);
    `server/webhooks.ts:746`,
    `:766`, `:812`, `:819`; `server/waits.ts:386-387`;
    `server/host/check-backs.ts:153`.
- **P175 (question for the author). Is model text that the store kept
  "stored data"?** `AGENTS.md` says that text that opens a delegated turn
  is built from stored data, never from model output. Four openings of the
  reference use model text of an earlier turn: the follow-up of a wait, the
  note of a check-back, the carried report of a run with `continuity`, and
  the instructions that a bot writes with its tool.
  - Option a: the text is stored data.
  - Option b: open the turn with fixed text from the record (id, label,
    time), and give the model text as a quoted, marked note.
  - Option c: leave `continuity` out.
  - Source: `server/wait-host.ts:132-144`;
    `server/host/check-backs.ts:65-71`; `server/routine-execution.ts:23`,
    `:77-89`.
- **P176 (step 15). Dependencies and pull requests.** Step 15 needs steps 8
  (the store), 12 (the tools) and 13 (a run is a root assignment). The pull
  requests, each 200 lines or fewer: the schedule types as pure functions;
  the tables and the tick with the `Clock` trait; the start of a run
  through the runtime; catch-up and missed rows; run limits and the busy
  miss; failure spacing; check-backs; waits, with the probes as a trait;
  webhooks (after P173); the Automations page.
  - Source: `server/routine-schedules.ts:113-199`;
    `server/due-timer.ts:21`, `:43-104`; `server/routine-execution.ts:29-33`;
    `server/routine-catch-up.ts:16-21`; `server/routine-bounds.ts:64-99`;
    `server/routine-failure-spacing.ts:23-25`; `server/wait-probes.ts:176-178`.
- **P177 (step 15). A deadline for each queued or waiting item.**
  - Why: the problem "a turn or a wait that does not end". The reference
    has no deadline for: webhook, manual and check runs behind a busy bot
    (`server/routine-recovery.ts:232-234`); a waiting run of a one-time or
    webhook routine (`server/routines.ts:1035-1040`); the end of a wait whose
    chat stays busy (`server/waits.ts:380-389`); a check-back for a busy
    chat or a paused bot (`server/host/check-backs.ts:157`, `:178`); a held
    report for a busy chat (`server/automation-reports.ts:230`).
  - At `e1cc6a290`: the reference repaired none of these cases. The lines
    moved: `server/routine-recovery.ts:235-237`, `server/routines.ts:1038-1043`
    and `server/automation-reports.ts:231`. v0.1.186 adds one more case with
    no deadline: a scheduled run that waits while the conversation of an
    earlier run of its routine is live, also a completed run that works a
    follow-up. Its busy time does not count, so it is never given up
    (`server/routines.ts:1123-1125`, `:1136`;
    `server/routine-bounds.ts:90-95`; commit `681bc6f50`, in the tag). P748
    ports this hold, and this proposal gives it its deadline.
- **P178 (step 15). One newtype for each bounded field.**
  - Why: the reference checks one field with two ranges. The run limit is 5
    to 240 minutes in the bot tool and 5 to 1,440 in the service. The note
    of a check-back is 2,000 characters in the route, and the store cuts it
    to 1,000 with no message. The hours of a wait are checked in the route
    only.
  - Source: `server/drivers/agents-call-triggers.ts:237-241`;
    `server/routine-requests.ts:216-222`; `server/routes/check-backs.ts:17-22`;
    `server/host/check-backs.ts:193`; `server/waits.ts:210`;
    `server/routes/waits.ts:117-121`.
- **P179 (step 15). The payload of a webhook never gives the
  instructions.** With no stored instructions, a `task` or `message` field
  of the payload becomes an "[AUTHENTICATED WEBHOOK TASK]" block, so a
  sender with the secret gives the bot a task. Build the opening from the
  stored instructions only, and keep the payload in the data block.
  - Why: a secret or an access right in the wrong place.
  - Source: `server/webhooks.ts:352-357`.
- **P180 (plan). Proactive routines come after step 16 and part 20.** When
  they come, a capability flag of the driver replaces the list of fenced
  engines.
  - Why: `AGENTS.md` forbids a gate on a driver name. The reference fences
    one engine by its name.
  - Source: `server/host/proactive.ts:36`, `:133-136`.
- **P181 (step 15). Follow the reference in these points.**
  - After downtime only the newest occurrence runs, and only up to 12 hours
    late. One missed row counts the others (`server/routine-catch-up.ts:16-21`,
    `:88-100`).
  - No switch-off after failures: after 3 failures the runs are spaced by
    1 hour, then 4 hours (`server/routine-failure-spacing.ts:1-5`, `:23-25`).
  - A run cut by a restart is queued again one time only
    (`server/routines.ts:374-392`, `server/routine-restarts.ts:30-32`).
  - A run limit counts only work time, with at most 2 minutes for each pass
    (`server/routine-bounds.ts:13-84`).
  - An automation never raises the approval level
    (`server/index.ts:3015-3024`, at `e1cc6a290` `:3016-3025`).
  - The page check of a wait reaches public addresses only, and checks
    again at each redirect (`server/wait-probes.ts:254-292`).

## Proposals from the changes up to `e1cc6a290` (v0.1.186)

The main session gives these proposals their P-numbers. Each line number
below is at `e1cc6a290`. "In the tag" means in the release v0.1.186 (tag
`70eb44c1a`).

- **P748 (step 15). Hold a scheduled occurrence while the conversation of an
  earlier run of its routine still works.** Follow the reference.
  - In v0.1.186 the next occurrence waits while the turn of another run of
    the routine is live, of any status (`server/routines.ts:1123-1125`;
    `server/routine-turn-live.ts:19-22`; commit `681bc6f50`, in the tag).
  - This includes a completed run whose conversation works a follow-up of
    the person. The release note says: "a scheduled run waits while an
    earlier run of the same routine is still working."
  - In our port the runtime owns all work state, so "a turn is live in the
    conversation of an earlier run" is a query on the store, not a call to
    the host.
  - The reference gives this wait no deadline (`server/routines.ts:1136`,
    `server/routine-bounds.ts:90-95`). P177 gives it one.
  - Why: the problem "'Busy' and races between bots" of
    `changelog.md` section 5. Before v0.1.186, two turns of one routine
    worked at the same time.
  - Test: the test `server/routines.test.ts:175-192` with the fake driver
    and the in-memory store.
- **P749 (step 15). The Undo of a change by a bot keeps the earlier state,
  and it is written in the same transaction as the change.**
  - **Problem in the reference:** in v0.1.186 the Undo of a pause sets the
    routine to on, and the Undo of a resume sets it to off, whatever the
    state was before. So when a bot pauses a routine that is already
    paused, Undo turns it on (`server/routine-requests.ts:1136` at
    `eee23ebbe`). The reference repaired this after the tag
    (`server/routine-requests.ts:1019-1021`, `:1136`, commit `b63ecc7cb`).
    These parts are still present at `e1cc6a290`:
    - a card with no snapshot still gets the opposite of the action. This
      occurs for an old card, and for a snapshot that fails the schema
      (`server/routine-requests.ts:908`, `:1136`);
    - the Undo of a webhook pause or resume does not put back
      `verificationPending`, which the action set to `false`
      (`server/webhook-requests.ts:184`, `:263`; `server/webhooks.ts:524`);
    - the snapshot of a pause must copy the name and the instructions of
      the routine, masked and cut, only to pass the schema
      (`server/routine-requests.ts:890-909`).
  - No theme of `changelog.md` section 5 has this problem, so this is a
    judgment call. The author can keep the reference.
  - Option a: one Rust enum for each kind of Undo, for example
    `Toggle { was_enabled, was_pending }`, `Update { before }`,
    `Delete { before }` and `Create { id }`. A toggle then keeps no text of
    the routine.
  - Option b: follow the reference at `e1cc6a290`: a full snapshot for each
    action, and the opposite of the action when it has none.
- **P750 (step 15). One schedule type for the store, the request card, the
  bot tool and a backup, with strict parsing.**
  - **Problem in the reference:** until v0.1.186, the team backup had its
    own schedule schema with three types: `once`, `daily` and an
    `interval` with two fields (`shared/team-backup.ts:69-72` at
    `eee23ebbe`). The export checks the whole document and stops at the
    first error (`shared/team-backup.ts:179-184`). The release note of
    v0.1.186 says that team backups now "keep cron and limit-reset
    routines" (`shared/team-backup.ts:73-86`, commit `24a632800`, in the
    tag). The copies still differ at `e1cc6a290`: the backup accepts a
    `once` time that is negative or not a whole number
    (`shared/team-backup.ts:76`), and the request card refuses it
    (`server/routine-request-schemas.ts:78`).
  - No theme of `changelog.md` section 5 has this problem, so this is a
    judgment call. The release fix shows the cost of separate copies.
  - How: one `Schedule` enum with `#[serde(deny_unknown_fields)]` on each
    variant, so a field is never dropped with no message. The instant
    newtype of P178 checks the `once` time.
  - Follow the reference in one point: an import computes the time of a
    `limit_reset` routine again on the destination, and each imported
    routine starts paused (`server/team-backup.ts:256-258`,
    `server/routines.ts:954-958`).
  - Test: a round trip of each variant through export and import (compare
    `server/team-backup.test.ts:203-306`).
- **P751 (step 15). The end of a run is one enum, and "partly done" comes
  from facts that the runtime owns.** Follow the reference rule of v0.1.186.
  A failed step fails the run. One case completes the run as partly done:
  each failed call of the turn was a block of the safety floor, after
  earlier reply text. The run keeps the error of the step
  (`server/routines.ts:1292-1300`; commits `48b93742f` to `ba5c2c50e`, in
  the tag).
  - The reference shows three end states with two flags: completed;
    completed with `partial` and an error; failed with `partial`. Its wire
    comment still says that `partial` is for a failed run
    (`packages/phone-protocol/src/routines.ts:236-237`). A Rust enum
    (`Completed`, `CompletedPartly { step_error }`,
    `Failed { reply_came }`) gives each state one form.
  - Only the chat-completions runtime of the reference sets the fact
    `blockedAfterReply` (`server/drivers/openai-chat.ts:761`). In our port
    the runtime sets it from the tool results. A capability flag of the
    driver says if its tool results show a block of the safety floor
    (`AGENTS.md`: never a gate on a driver name).
  - "After the reply" follows the reference: after any assistant text of
    the turn, also text beside a tool call
    (`server/drivers/openai-chat.ts:735-737`). The author chose this on
    2026-11-28.
- **P752 (step 15). The reason why an approval waited is kept on the stored
  ask, as a typed cause.**
  - **Problem in the reference:** in v0.1.186 (`65780d818`) the reason is
    in a map in memory, with at most 500 entries
    (`server/routine-held-reasons.ts:3-15`). Many approval cards in other
    conversations can push out the reason of a routine before its timeout.
    Then the stop line has no reason. A restart loses the map. The run
    drops its ask at a restart anyway (`server/routines.ts:377`), so that
    loss is small.
  - What the reference does: the stop line of a run whose approval nobody
    answered ends with the reason of the approval card. An example is
    "This sends something on your behalf, so it asks you first."
    (`server/routine-waits.ts:56`, `server/auto-approve.ts:150-167`).
  - No theme of `changelog.md` section 5 has this problem, so this is a
    judgment call.
  - How: an enum such as `HeldCause { Outbound, ProviderRequires,
    WidensLimits, Confined }` on the ask row, written in the transaction
    that opens the ask. The stop is
    `ApprovalUnanswered { subject, held: Option<HeldCause> }`, and the UI
    writes the words.
- **P753 (step 15). The busy time of a queued run needs no save batch.**
  The reference writes the whole routines file for each change, so after
  the tag it groups the busy-minute marks of one pass in one write
  (`server/save-batch.ts:21-36`, `server/routines.ts:1138`, commit
  `2d156d909`). With one transaction for each change (P174), each mark is
  a small update. Follow the reference in two points:
  - a stamp that the app shows (the deferral, the deferral notice, a moved
    occurrence, a wake retry) is committed before its event goes out
    (`server/routines.ts:1103-1105`, `:1128-1135`, `:1144`);
  - `busy_ms` is a total, and the last count time is in memory only. A
    crash then loses at most one pass of busy time and never counts it two
    times (`server/routine-bounds.ts:30-37`).
  - Test: compare `server/server-writes.test.ts:142-170`: two queued runs
    on a busy bot, a restart, and each run with its stamp and its busy
    time.
- **P754 (step 15, and the desktop). Only the `done` notice of a scheduled
  run has the mark of a scheduled report.** Follow the reference of
  v0.1.186. A run is scheduled when its trigger is `schedule`
  (`server/routine-occurrences.ts:28-29`). The mark is kept only on a
  `done` notice (`server/notify.ts:76`). The desktop shows a marked notice
  under its own per-device switch (`src/lib/notify.ts:41`,
  `src/lib/notification-preferences.ts:130-137`). Commits `4b2f021e6` and
  `81f2821c0`, in the tag.
  - The switch is a setting of the desktop (`bot-desktop`). `bot-core`
    only sets the mark, and `bot-protocol` gives it as a field of the done
    notice.
  - The reference has two marks with one name: the routing option
    `{ routine: true }` for each routine run, and the notice field for a
    scheduled run only (`server/index.ts:5554`). Give them two names in
    Rust.
  - The reference computes the trigger with a fallback for old rows:
    `triggerSource ?? (manual ? "manual" : "schedule")`
    (`server/routine-occurrences.ts:29`). Our store has no old rows, so the
    trigger is a required column with no fallback.

## Notes

- After the tag, the reference scopes an OpenCode usage limit to the
  provider that hit it (`server/drivers/acp/opencode-go.ts:788-799`,
  commit `645566fe8`). The clock records a refusal only for a limit of the
  whole engine (`server/limit-resets.ts:217-218`). So a provider limit no
  longer gives a reset time to a `limit_reset` routine on that engine
  (`server/limit-resets.ts:141-146`). When the port has `limit_reset`
  routines, say which scope of a limit a routine waits for. This belongs
  with the usage-limit topic.

- `../comparison.md`, section 5: the ledger of the reference also has a
  mark file and leases (`server/routine-ledger.ts:66-69`,
  `server/routine-occurrences.ts:14-15`).
