# Plan: The store and the data format

The proposals from the research file
[`../research/features/store-and-data-format.md`](../research/features/store-and-data-format.md)
(batch 4, reference commit `ed8cb7278`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 6, 8, 13.
- **State:** all open.
- **The main finding:** the reference keeps one format marker on the whole
  data folder and refuses to start on a newer format. Since v0.1.178 it
  writes format 2, so an unreadable marker also stops the start
  (`server/data-format.ts:13`, `:51-60`). But a corrupt store file loads as
  empty, and the next save can write over it.

## Proposals

- **P74 (step 6). A format marker for the data folder, read before any store
  opens.** The code has `writes` and `reads`. A marker above `reads` stops
  the start with one line and changes nothing. A format change takes two
  releases. A test compares the numbers with the last release.
  - Kind: follows the reference. If accepted, it replaces P23.
  - Source: `server/data-format.ts:13-100`, `:128-137`, `server/index.ts:654`,
    `:666`, `CONTRIBUTING.md:112-166`, `scripts/record-data-format.mjs:8-37`.
  - Changes: PR 6.1, and a decision.
- **P75 (step 8). `PRAGMA user_version` on the database, checked at open.**
  A database above the known version is refused with the same line as the
  marker.
  - Kind: better than the reference.
  - **Problem in the reference:** The databases have no schema version. An
    older release does not see a newer schema until a query fails, and a
    format change can lose data on a rollback (`CONTRIBUTING.md:189-201`,
    `:223-224`). The release problem: "The updater loops, sticks or breaks
    the window" (v0.1.144, v0.1.153).
  - Why: the reference finds its schema by its columns, so it does not see
    a change that breaks an older query. It names this as its own gap.
  - Source: `CONTRIBUTING.md:189-193`, `:207-218`, `server/message-db.ts:51-112`,
    `server/runtime/store.ts:115-162`.
- **P76 (steps 6 and 8). A failed load can never lead to a save.** A save
  takes a value that only a good load makes. A seed needs proof that the
  store is empty. Add a test for each case that the reference gets wrong:
  1. The seed writes a default bot over a corrupt `bots.json`.
  2. The next room change writes over a corrupt `groups.json`.
  3. A one-time marker is written after a failed load.
  - Kind: better than the reference.
  - **Problem in the reference:** A corrupt `bots.json` loads as no bots, so
    the start seeds a default bot and writes it over the file
    (`server/store.ts:299-302`, `:2248-2254`; `server/index.ts:2808`). A
    corrupt `groups.json` loads as no rooms, and the next room change writes
    over it (`server/store.ts:304-308`). The grant recovery writes its
    one-time marker after it ran on no bots (`server/store.ts:428`;
    `server/always-allow.ts:85`). The release problem: "A file written over
    after a failed read" (v0.1.103, v0.1.107).
  - Source: `server/store.ts:296-307`, `:427-432`, `:2249-2254`,
    `server/index.ts:2808`, `server/tested-ai.ts:316-319`,
    `server/always-allow.ts:62-85`.
  - Changes: PR 6.2, PR 6.3, step 8. Related: P22.
- **P77 (steps 6 and 8). A store file that is not JSON, or that cannot be
  read, stops the start with one line.** It does not load as empty. P22
  stays the rule for one bad section in a file that is valid JSON.
  - Kind: better than the reference.
  - **Problem in the reference:** A corrupt `bots.json` starts the app with
    no bots. An invalid `config.json` starts it with the defaults and only a
    log line. The person sees an empty or reset app, not the cause
    (`server/store.ts:299-302`; `server/config.ts:699-713`). The release
    problem: "A file written over after a failed read" (v0.1.103, v0.1.151).
  - Why: one rule, and the person sees the problem at once. The reference
    stops for the marker but starts empty on a corrupt store.
  - Source: `server/data-format.ts:55-59`, `server/store.ts:296-301`,
    `server/config.ts:698-713`, `:884-885`.
- **P78 (step 8). The pragmas:** `journal_mode = WAL`, `synchronous =
  NORMAL`, `FULL` for a commit whose result goes out at once, and a
  `busy_timeout`.
  - Kind: follows the reference, with one change: the reference sets no
    `busy_timeout`, so a second connection fails at once.
  - Source: `server/message-db.ts:48-50`, `:228-238`,
    `server/runtime/store.ts:235-238`.
- **P79 (step 8). A database file deleted while the program runs gives a
  typed error.** It never opens a new empty database.
  - Kind: better than the reference, which loses the data with no message.
  - **Problem in the reference:** When `messages.db` is deleted while the
    program runs, the next read opens a new empty database. The messages are
    gone and the person gets no message (`server/message-db.ts:35-36`,
    `:144-158`). The release problem: "The same work done or delivered two
    times, or lost" (v0.1.95).
  - Source: `server/message-db.ts:35`, `:144-158`, `server/message-db.test.ts:130-143`.
- **P80 (step 8). The form of an identifier, and one order of events.** The
  caller makes a random identifier for a thread, a turn and a message. Each
  event gets an `AUTOINCREMENT` identifier. "What happened after X" uses
  the event identifier, never a time.
  - Kind: follows the reference ("a clock can step back").
  - Source: `server/runtime/store.ts:142`, `server/runtime/tree.ts:1`,
    `:104-132`.
  - Changes: the open risk of D17. Related: P39.
- **P81 (step 8). A choice: the event log of a thread is an NDJSON file, as
  the reference, or a table.** A table gives one transaction with the
  message row.
  - Source: `server/harness/bus.ts:229-252`.
- **P82 (step 8). No deferred save.** Each change commits at once.
  - Kind: better than the reference, which loses up to 1 s of changes at a
    kill. Its desktop app stops the server with a kill on Windows.
  - **Problem in the reference:** A kill or a crash loses the changes of up
    to the last 1 s, because they wait in memory. On Windows the desktop app
    stops the server with a kill (`server/save-batch.ts:45`, `:74-83`). The
    release problem: "State lost at a restart or a crash" (v0.1.74,
    v0.1.165) and "Process control on Windows" (v0.1.140).
  - Source: `server/save-batch.ts:44-85`, `server/store-deferred-saves.test.ts:104-117`.
- **P83 (step 13). One transaction for each restart decision, and a stated
  delivery rule.** The `restart_reconciled` event and the settle are one
  transaction. The parked state and its inbox item are one transaction. A
  type states "at least once" or "at most once" for each output.
  - Kind: better than the reference, which uses two transactions here.
  - **Problem in the reference:** A crash between the `restart_reconciled`
    event and the settle leaves a "failed" event on a row that still runs
    (`server/runtime/runtime.ts:135-142`, `:766-768`). A poll marks items
    delivered before the host uses them, so a crash can lose an item
    (`:733`). A report goes out before its mark, so a crash can send it two
    times (`:794-799`). The release problem: "State lost at a restart or a
    crash" (v0.1.165) and "The same work done or delivered two times, or
    lost" (v0.1.108, v0.1.150).
  - Source: `server/runtime/runtime.ts:135-142`, `:157`, `:568-572`, `:733`,
    `:790-803`.
- **P84 (step 13). Do we take the fifth restart branch?** A cut turn fails
  when it used the browser during a freeze for want of memory. The hook is
  in the host, not in the runtime.
  - Kind: a choice. The reference added it in commit `01bcd69ed` (#7228),
    after v0.1.178.
  - Source: `server/runtime/runtime.ts:109-158`, `:140-142`,
    `server/memory-freeze-restart.ts:40-55`.
- **P85 (step 13). After a restart, run the invariant checks one time and
  log each broken rule.**
  - Kind: better than the reference, which runs them only in tests.
  - **Problem in the reference:** No code outside the tests calls the
    invariant checks. A rule that a restart breaks in a real data folder
    stays hidden (`server/runtime/invariants.ts:37`;
    `server/runtime/index.ts:7`). The release problem: none; this is a
    judgment call.
  - Source: `server/runtime/invariants.ts:37-126`.

## New facts for choices and proposals that exist

- **The settings format (a choice of step 6):** the reference uses JSON and
  removes a byte-order mark before the parse (`server/config.ts:696`,
  `server/data-format.ts:35`).
- **P23:** the reference has a format number. It is on the folder, not in
  the settings file (P74).
