# Plan: Memory

The proposals from the research file
[`../research/features/memory.md`](../research/features/memory.md)
(batch 6, reference commit `eee23ebbe`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours, and so is `NOTICE`
where a line says "ours". All other paths are in the reference project.

- **Steps:** 15, and D8.
- **State:** all open.
- **The main finding:** memory is plain Markdown files with dated entries,
  a load budget and an Undo for each change. The typed entries and the
  memory proposals of the plans of 2026-08-31 were never built for the
  memory of a bot (`server/memory-capture.ts:127-128`; no code has
  `propose_memory`).

## Proposals

- **P204 (plan, step 15). Split step 15 into memory and routines, with a
  sequence of pull requests.** Memory comes first, as the name of the step
  says. The pull requests, each 200 lines or fewer: the entry type and its
  parser; the path type and the store (read, write with a hash, the 409,
  the size limit); the load budget and the memory parts of the prompt;
  `updateMemory` with the archive; the journal table and Undo; the search
  index and recall; the tools `memory_update`, `memory_log` and
  `session_search` (in step 12 or after it); capture, organize and the
  tidy-up, one pull request each; the window. Memory needs steps 8, 11 and
  12. The first six pull requests need step 8 only. The routines half is in
  P176.
  - Why: follows the order of the reference
    (`docs/plans/2026-09-25-memory-layer.md:158-169`) and our size rule.
  - Source: `server/memory-store.ts:46-111`, `:235-277`;
    `server/workspace.ts:161-184`, `:405-457`, `:598-644`.
- **P205 (decision, extends the D8 item "Memory"). What the reference really
  built.** The files: `MEMORY.md` (loaded, 200 lines and 24,000 bytes),
  topic files with a header (not loaded; an index of 40 topics and 2,000
  characters), an archive, daily logs, thread notes (100 lines and 12,000
  bytes). The entry grammar with until-dates and the superseded mark. A
  write applies at once, and each one has an Undo in the journal: no
  approval step for the memory of a bot. No typed entries and no memory
  proposals.
  - Why: follows the reference. It first put About me behind an approval,
    then removed it after one day: "In use that asked people to curate by
    hand, which they will not do."
    (`docs/plans/2026-09-25-memory-layer.md:34-41`).
  - Source: `server/workspace.ts:30-34`; `server/thread-notes.ts:18-19`;
    `server/memory-topics.ts:7-8`.
- **P206 (step 15). The journal is a table, written before the file.** A
  `memory_changes` table in the store of step 8. The order of a change: the
  row as "pending", the atomic file write, then the row as "done". At start
  a "pending" row is checked against the hash of the file.
  - **Problem in the reference:** The journal row of a memory change waits
    in a queue in memory after the file write, and a failed append is only
    logged. So a crash can lose the row, and then the change cannot be
    undone. Only the last 8 MiB and 500 rows are read, so an older change
    cannot be undone (`server/memory-journal.ts:164-178`, `:220`, `:237`).
    The release problem: "State lost at a restart or a crash" (v0.1.24,
    v0.1.165).
  - Why: better than the reference. It queues the journal row in memory
    after the file write, so a crash loses it
    (`server/memory-journal.ts:162-178`). The journal file has no limit, and
    only its last 8 MiB and 500 rows are read, so older rows cannot be undone
    (`:220`, `:237`).
- **P207 (step 15). Every write path refuses after a failed read, and every
  save has a hash.** The memory module uses the type of step 6: a save takes
  a value that only a successful load can make. The window always sends the
  hash, and so do Undo and delete.
  - Why: the problem "a file written over after a failed read". The daily
    log writes over the day file after any read error
    (`server/workspace.ts:482-487`). `expectedHash` is optional
    (`server/memory-store.ts:256`), and Undo has no check and writes over
    later changes (`server/memory-journal.ts:363-370`).
- **P208 (step 15). Waiting captures are rows in the store.** Each turn that
  waits for capture is a row, deleted when its capture is written or
  refused.
  - Why: the problem "state lost at a restart". The reference saves the ids
    only in `stop()`, so a crash loses them all
    (`server/memory-upkeep.ts:952-964`), and a call in progress is lost even
    at a clean stop (`server/memory-capture-calls.test.ts:385-425`).
- **P209 (decision). Background model calls are a capability of the driver,
  with typed outcomes and limits.** The driver states whether it has a
  quick text call; `bot-core` gets the call as a trait object, and `bot-cli`
  connects it. A call returns a typed outcome: answer, timeout, refused,
  spend limit, no engine. A short-lived error keeps the batch for one more
  try. The timer starts after the wait for a slot, and each bot has its own
  upkeep task.
  - Why: the reference chooses the path by the kind of driver
    (`server/side-jobs.ts:95-102`). Each error becomes "The capture call did
    not answer in time." and the batch is dropped
    (`server/memory-upkeep.ts:221-243`). The 60 s timer starts before the
    wait for one of 3 slots (`server/job-slots.ts:87-89`). One worker serves
    all bots (`server/memory-upkeep.ts:865-889`).
- **P210 (step 15). Who sees what in a room.** A room turn recalls only notes
  from rooms with the same or a wider audience, and each read of a private
  source from a room is disclosed. Off a Team Cloud, About me in a room
  prompt is a choice of the person.
  - Why: a secret or an access right in the wrong place. A room turn
    recalls topic files that can hold facts from a private chat, with no
    notice (`server/index.ts:10157-10158`). `session_search` with the scope
    `threads` from a room returns before the disclosure code (`:13331`).
- **P211 (step 15). Redaction when memory loads, and of the forgotten
  words.** The prompt builder redacts the memory text that it loads, so a
  secret that an engine wrote with its own file tools never reaches a
  prompt. The words of a forget are kept as a hash or redacted.
  - Why: `loadMemory` has no redaction (`server/workspace.ts:161-184`), and
    the forgotten words are kept with no redaction
    (`server/profile-learned.ts:110-117`).
- **P212 (step 15). Capture writes only items with evidence.** A decision or
  an outcome needs a quote from the person or a verified tool result, as a
  preference or a fact does.
  - Why: the reference checks a quote only for preferences and facts
    (`server/memory-capture.ts:225-226`), and `MEMORY.md` goes into every
    prompt.
- **P213 (step 15). One memory switch with one meaning.** Memory off removes
  every memory part of the prompt and every memory tool, or the setting text
  lists what stays.
  - Why: with memory off, the reference keeps the brief of recent work
    (`server/index.ts:8277`), About me and `session_search`
    (`server/drivers/agents-catalog.ts:860`), against its own help text.
- **P214 (step 15). Small rules of the entry type.** One function cuts the
  text for the prompt and for the gauge. The tidy-up removes a whole entry
  with its continuation lines. `memory_log` has a length limit. Memory hits
  of `session_search` apply `since` and `until`.
  - Why: `memoryCapacity` says it cuts "exactly as loadMemory() does" and
    does not (`server/memory-store.ts:145-150`); `applyTidy` drops only the
    first line of a duplicate (`server/memory-tidy.ts:80-83`); `memory_log`
    has no maximum (`server/drivers/agents-catalog.ts:566-568`); memory hits
    ignore the dates (`server/index.ts:13349`).
- **P215 (step 15, window). Keep what the person typed on each conflict.**
  The panel keeps a draft on a 409, as the settings section does. A new
  topic opens only after a successful read.
  - Why: the panel drops the text with no message
    (`src/components/bot-panel/MemoryText.tsx:60-66`).
- **P216 (`NOTICE`, ours). Credit Hermes Agent when the capture prompt is
  ported.** Add a line to "Adapted components" for
  `server/memory-capture.ts`, with the credit to Hermes Agent (Nous
  Research, MIT).
  - Why: `AGENTS.md`, "Reference code and licensing". The room rules of
    capture follow "the background review Hermes Agent runs in group
    threads, MIT" (`server/memory-capture.ts:1-3`). The reference `NOTICE`
    credits Hermes Agent for another file only (`NOTICE:103-106`).
- **P217 (`../comparison.md`, section 5). Correct and extend the memory
  rows.** Add the until-dates, the topic index, thread notes and the
  journal to the row "Memory files" (`docs/comparison.md:122`), and rows for
  capture and the tidy-up, and for the journal as a table.

## Notes for the changelog

- Section 6 of `../research/changelog.md` can get a row for memory: About me
  behind an approval (2026-09-25), replaced by apply, Undo and Remove
  (2026-09-26); and the stop at the size limit, replaced by the archive
  (`ea361ac39`, 2026-10-03).
