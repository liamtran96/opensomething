# Plan: Context

The proposals from the research file
[`../research/features/context.md`](../research/features/context.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 3, 5 and 8, and a new step for context (P247).
- **State:** all open.
- **The main finding:** the reference keeps a conversation inside the context
  window in four ways: the engine compacts its own session, the server writes
  its own summary (a "fold"), a summary is made while the bot is idle, and a
  room bot gets a fresh session with the recent room lines. When it cannot
  resume a session, it rebuilds one from the stored messages
  (`server/context-rebuild.ts`, `server/host/conversation-compaction.ts`).

## Proposals

- **P246 (plan, step 8). Reserve the context fields of a thread in the
  store.** The thread record gets a resume cursor and the handed state for
  each engine instance, the id of the applied fold, the context floor and the
  model of the last context reading. The fold record is a kind of message: the
  first kept message, the last folded message, the summary, the tokens before
  the fold and who asked for it.
  - Why: the rebuild, the resume choice and Compact now read these fields.
    With them in the store from the start, the later step adds no migration.
  - Source: `server/store.ts:82-95`; `server/context-rebuild.ts:148-155`;
    `server/delta-context.ts:37-48`.
- **P247 (plan, new step after 13). A step for context.** In `bot-core`: the
  fold, the rebuilt session and delta context (what a session already holds).
  Done when: a thread that switches engines gets its history one time, and
  the new engine knows which tools already ran. Room sessions, keep-warm and
  the breakdown UI are later (P255).
  - Why: delta context counts teammate results, and an unseen teammate
    result forces a rebuild, so the step needs the runtime of step 13. The
    fold needs the store of step 8 and the threads of step 11.
  - Source: `server/resume-plan.ts:18-37`; `server/delta-context.ts:50-52`, `:89-121`.
- **P248 (decision). The reason for a new session is an enum.** When the
  runtime starts a new engine session for a thread, it records one reason:
  switch, rewind, take-over, outside update or fresh start. The text that
  opens the session comes from that reason.
  - Why: better than the reference. A backup engine that takes a thread at a
    usage limit gets it with `rewound: true`, and the model reads "The user
    rewound this conversation" when no rewind happened. It also follows our
    rule that the text of a turn comes from stored data.
  - Source: `server/index.ts:8459-8461`; `server/turn-context.ts:31-34`.
- **P249 (decision, or a test of step 13). A hand-over is one transaction.**
  The move of a thread to a backup engine writes the new model, the record to
  go back, the notice row and the resend in one transaction.
  - Why: our rule in `AGENTS.md`. The reference writes the model first and
    the failover record second, in another file. A crash between them leaves
    the thread on the backup for good.
  - Source: `server/quota-switch.ts:182-202`; `server/limit-failover.ts:110-118`;
    `server/host/peer-limit-resend.ts:191-195`.
- **P250 (decision, extends D22). Context behaviour comes from driver
  capabilities.** A driver states: the engine compacts its own session
  (`native_compaction`); a resume runs in the same session, fails, or
  rebuilds (`strict_resume`); its context reading is for the meter only; and,
  for a failed resume, whether the engine accepted the prompt first.
  - Why: our rule in `AGENTS.md`. The reference checks the driver name in four
    places, for example `driverKind !== "claudeAgent"`. The ACP driver says
    "before accept" with no check, so a rebuild can send the work two times.
  - Source: `server/contracts.ts:303-312`; `server/index.ts:6963`;
    `server/side-jobs.ts:144`; `server/host/room-sessions.ts:12`;
    `server/drivers/acp/core.ts:1177`.
- **P251 (plan, step 5, with the usage proposal of `changelog.md` section
  7). Each model call books its own usage.** A call books its usage when it
  returns, before any check that drops its result. The usage is the growth
  over a base that the store keeps. A negative growth is refused.
  - Why: a summary that the bot's own engine writes is not booked. A summary
    that the driver drops as busy books nothing, but the same case dropped by
    the host is booked. With no stored base, the whole session total is booked
    again ("usage and cost numbers corrected", v0.1.178).
  - Source: `server/side-jobs.ts:291-292`;
    `server/drivers/claude-warm-summary.ts:139`;
    `server/host/warm-summary-host.ts:135-140`;
    `server/drivers/claude-cost-history.ts:77-91`.
- **P252 (plan, step of P247). Tool history is on by default.** A rebuilt
  session gets one short line for each tool that already ran: the tool, its
  target and "ok" or "failed", never the result.
  - Why: better than the reference. It is off there, and no UI turns it on,
    so an engine that takes over can run a command again. The lines are
    already safe: secrets are removed, and a URL keeps its scheme and host.
  - Source: `server/replay-settings.ts:6-7`; `server/context-rebuild.ts:37-71`.
- **P253 (plan, step of P247). A replay budget that cannot be wrong.** The
  budget is a type that cannot hold less than 1,024 bytes, so the rebuild has
  no error path for it.
  - Why: the reference throws a plain `Error` during a rebuild. Our rule:
    typed refusals, no untyped error into a turn.
  - Source: `server/context-rebuild.ts:193-197`; `server/replay-settings.ts:5`.
- **P254 (plan, step 3, then the step of P247). Each wait of this feature has
  a limit.** The summary scheduler, the wait for a hand-over to settle and the
  check that an engine is still signed out use the wait type of step 3.
  - Why: most waits have a limit (summary 20 s, idle summary 5 min, Codex
    compaction 120 s), and these three have none ("a turn or a wait that does
    not end", six of six periods).
  - Source: `server/warm-summary.ts:143`; `server/quota-switch.ts:247`;
    `server/host/limit-takeover.ts:309`.
- **P255 (later). Room sessions, keep-warm and the breakdown UI.** Room
  sessions send a bot only the room lines it did not see. Keep-warm and idle
  summaries are for Claude Code. The context button shows the breakdown and
  the warning. One owner decides "the session is still live". When keep-warm
  is ported, add Cache Tax (MIT) to our `NOTICE`.
  - Why: these need rooms, the Claude driver and the desktop UI first. The
    reference states its own gap: keep-warm can hold a process past the idle
    time, "so a line can be sent twice".
  - Source: `server/host/room-sessions.ts:14`, `:233`;
    `server/room-context.ts:123-125`; `server/cache-keepwarm.ts:1-4`; the
    reference `NOTICE` line 39.
