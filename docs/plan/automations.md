# Plan: Automations

The proposals from the research file
[`../research/features/automations.md`](../research/features/automations.md)
(batch 6, reference commit `eee23ebbe`). The steps, the pull requests and the
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
  - Source: `server/webhook-ingress.ts:9`; `server/index.ts:9362-9374`.
- **P174 (decision, step 15). The records of automations go in the SQLite
  store of step 8, with one transaction for each change.** A unique key
  `(routine_id, due_at)` replaces the ledger file and its leases. A foreign
  key to the bot replaces the clean-up at start.
  - Why: better than the reference. Six places lose or double work: the
    routine file is saved before the ledger; a post to a chat and a post to
    a room happen before their receipt is saved; a wait is deleted before
    its follow-up is queued; a check-back saves `startingAt` before the
    start; the holds stay in memory after a failed save. And a corrupt
    `bots.json` deletes automations: the start seeds a default bot when no
    bot loads (`server/store.ts:2249-2253`, `server/index.ts:2808`), so the
    clean-up that runs after it (`:9356`) finds one bot and removes the
    automations of all the others (`server/bot-automations.ts:31-37`).
  - Source: `server/routines.ts:934-936`, `:1516-1552`;
    `server/routine-occurrences.ts:192-239`; `server/webhooks.ts:746`,
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
    (`server/index.ts:3015-3024`).
  - The page check of a wait reaches public addresses only, and checks
    again at each redirect (`server/wait-probes.ts:254-292`).

## Notes

- `../comparison.md`, section 5: the ledger of the reference also has a
  mark file and leases (`server/routine-ledger.ts:66-69`,
  `server/routine-occurrences.ts:14-15`).
