# Plan: Safety floor

The proposals from the research file
[`../research/features/safety-floor.md`](../research/features/safety-floor.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project, under `server/` unless a path starts with another
folder.

- **Steps:** 8, 9 and 10, a note under D10, and later (P392).
- **State:** all open.
- **The main finding:** the safety floor is a fixed list of shell commands
  that the server never allows by itself. It changes only an automatic
  allow, it is off by default, and it does nothing on a Windows server. The
  decision log is an append-only record of approval decisions. A row does
  not always say what happened: one writer records the click, another the
  result, and one writes `user-approved` after the person pressed Deny
  (`safety-floor-gate.ts:36-39`; `host/mcp-requests.ts:112-113`;
  `index.ts:11195-11208`).

## Proposals

- **P386 (decision, before steps 8 and 10). The log row: in the
  transaction, or best effort.** Option a: the row goes in the same
  transaction as the state change, as the rule of `AGENTS.md` says. A failed
  log write then stops the change. Option b: best effort, as the reference
  does. This breaks the `AGENTS.md` rule for this one table.
  - Why: the reference ignores a write error, so a full disk does not deny a
    tool. Plan table row: "A file written over after a failed read".
  - Source: `decision-log.ts:124-141`;
    `docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md:54-56`;
    `approval-levels.md` 3.13 item 5.
- **P387 (plan, step 10, `bot-protocol`). The row stores the answer and the
  result in two fields.** The person's answer (allow, deny) and the result
  (applied, failed) are two separate enums. Then the code cannot write a
  wrong row.
  - **Problem in the reference:** One field holds the click or the result,
    and each writer picks one. One writer records `user-approved` after the
    person pressed Deny, so the log says that the person allowed a change
    that they refused (`host/mcp-requests.ts:112-113`;
    `host/outside-writes.ts:81`; `index.ts:9125-9126`, `:11180-11198`). The
    release problem: none; this is a judgment call.
  - Why: better than the reference. One writer there records the click,
    two record the result, and one writes `user-approved` after the person
    pressed Deny. Plan table row: "The approval model changed".
  - Source: `host/mcp-requests.ts:112-113`; `host/outside-writes.ts:81`;
    `index.ts:9132-9133`, `:11195-11208`.
- **P388 (plan, step 9, `bot-engine`, `acp` module). The ACP floor reads
  each spelling alone.** The floor reads each spelling of a command as its
  own line.
  - Why: the reference joins two spellings of a command with a newline. A
    first spelling that ends with a backslash hides the second one:
    `{command: "ls \\", CommandLine: "rm -rf ~"}` reads as clear. Plan table
    row: "The approval model changed".
  - Source: `drivers/permission-command.ts:70-73`, `:79-80`;
    `safety-floor.ts:238-241`.
- **P389 (plan, step 10). A list of tools writes no row.** Only a call
  writes a decision row.
  - Why: in the reference a phone `tools/list` calls `authorize` for each
    tool, and each call writes a row. An email `tools/list` writes none. Plan
    table row: "The approval model changed".
  - Source: `phones/rpc.ts:37`; `phones/host.ts:110-112`;
    `phones/rpc.test.ts:114-116`; `email/host.ts:151-154`.
- **P390 (plan, step 10). A test checks that a key never reaches the log.**
  The test gives a fake key to the driver and then reads the rows.
  - Why: the reference test gives a fake key to the driver but does not
    check the rows. Plan table row: "A secret or an access right in the
    wrong place".
  - Source: `drivers/openai-chat-safety-floor.test.ts:98-99`, `:175-177`.
- **P391 (choice, step 10, `bot-desktop`). A view of the decision log on
  the desktop.** The author decides whether the desktop shows the log.
  - Why: the reference shows the log page only in a browser, never in the
    desktop application. The desktop person sees only the Activity panel of
    each bot. Plan table row: none.
  - Source: `src/components/settings/pages/DataPages.tsx:49`;
    `src/components/ActivitySection.tsx:64-82`;
    `src/components/ActivityPanel.tsx:21`, `:42`.
- **P392 (later, under D10). One read function with a viewer.** Each read
  of the log goes through one store query that takes the viewer.
  - **Problem in the reference:** The activity route of a bot reads its
    decision rows by bot only, and it does not use the privacy filter. On a
    team Cloud an admin can read the summary and the thread id of a decision
    in the private chat of another person (`activity.ts:334`;
    `routes/status.ts:246-248`). The release problem: "A secret or an access
    right in the wrong place" (v0.1.125).
  - Why: better than the reference. There one of four routes skips the
    privacy filter: the activity receipt of a bot reads the rows of all its
    threads, also the private ones. Plan table row: "A secret or an access
    right in the wrong place".
  - Source: `activity.ts:333`; `routes/status.ts:246-248`, against
    `routes/status.ts:189`, `:198`, `:233` and
    `host/private-records.ts:47-56`.
- **P393 (decision, a note under D10). No admin activity log while the
  product is desktop only.**
  - Why: follows the reference. Its desktop also records nothing in that
    log. Plan table row: none.
  - Source: `index.ts:746`, `:1214-1216`;
    `docs/verification/shared-workspace-governance.md:40`.

## New facts for proposals that exist

- **P46 (step 10):** an "allowed" row must come after the last check. Three
  writers log `auto-approved` before later refusals or failures
  (`phones/host.ts:110-112`, with the test `phones/rpc.test.ts:176-180`;
  `email/host.ts:164`, later failures at `:166-186`;
  `index.ts:14207-14216`, six checks after the row at `:14236-14260`). Plan
  table row: "The approval model changed".
- **P49 and P97 (steps 10 and 12):** the full Windows reader exists and is
  tested. Only the gate turns it off. The test file says "THE WINDOWS ROWS
  ARE NOT USED BY THE GATE YET". These commands read as clear:
  `rm -rf /{etc,usr}`, `rm -rf /e*`, `rm -rf $'/'`, `pwsh -EncodedCommand`,
  `pwsh –Command` (en dash), `Remove-Item -Recurse:$true /`,
  `Remove-Item -Recurse C:\Windows\System32`, `su -c`, `echo ... | sh`,
  `tee /dev/sda`, `diskutil secureErase`,
  `Get-ChildItem C:\ | Remove-Item -Recurse -Force`. Our floor treats a
  brace, a glob at the root, `$'...'` and `-EncodedCommand` as unreadable,
  so they get a card. This extends the rule of the reference ("a line not
  read to its end is never clear"). P49 goes up in priority, because the
  work computer of the author runs Windows (`MEMORY.md`)
  (`safety-floor-gate.ts:36-39`; `safety-floor.test.ts:19-23`, `:572`,
  `:577`; `safety-floor.ts:1-3`, `:133-139`, `:342-355`, `:518-520`, `:552`,
  `:574`, `:596`, `:613`, `:630-637`). Plan table rows: "Process control on
  Windows", "The approval model changed".
- **P117 (step 10):** a change of the level of a thread writes no admin row
  and no decision row. On a self-hosted shared server, a member can raise a
  thread to Full with no record. This comes from reading the guards; no test
  covers it. Ours: each level change writes a row with the old level and the
  new level, in the same transaction (`request-auth.ts:380`;
  `admin-audit-plan.ts:29-30`; `routes/tasks.ts:272-277`, `:380-386`, with
  no `appendDecision` in the file). Plan table row: "A secret or an access
  right in the wrong place".
