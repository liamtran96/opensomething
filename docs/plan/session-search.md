# Plan: Session search

The proposals from the research file
[`../research/features/session-search.md`](../research/features/session-search.md)
(batch 10, reference commit `fcce0b6de`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 8 (the index in the first schema), 15 (the memory index), and a
  new step for the search of past conversations. That step goes to `bot-core` (the scan, the worker, the CJK text and
  the index) and `bot-desktop` (one command).
- **State:** all open.
- **The main finding:** the reference has two search engines over one
  message table. The person gets a substring `LIKE` scan in one worker
  thread, newest first, with no rank (`server/message-search-query.ts:39-44`).
  The bot gets an FTS5 index ranked with `bm25`, which runs on the main
  thread (`server/message-db.ts:821-835`). So the same words can give
  different results. A timeout of one search ends the worker and fails every
  waiting search (`server/message-search-worker.ts:57`, `:64-73`).

## Proposals

- **P525 (decision, with P527 and P528). A deadline for each scan, and a
  timeout stops only that scan.** The deadline starts when the scan starts.
  An interrupt handle stops that statement. The thread and the queue stay.
  - **Problem in the reference:** the timer starts when the request is
    queued, and a timeout ends the worker and rejects all pending requests
    (`server/message-search-worker.ts:57`, `:64-73`). With 8 searches in the
    queue, one slow scan can give "busy" to all 8. The release problem: "One
    slow or stuck part blocks the others" (v0.1.114, v0.1.136, v0.1.153,
    v0.1.177, v0.1.178).
- **P526 (plan, step 8). The index is in the first schema, with a version,
  and a migration runs in one transaction.** Step 8 makes the column
  `search_text`, the view `coalesce(search_text, text)`, the FTS5 table and
  its three triggers. A message write uses an upsert, never
  `INSERT OR REPLACE` (`server/message-db.ts:135-139`). A change of the
  version of the index rules runs the drop, the fill of all rows, the
  create and the rebuild in one transaction.
  - **Problem in the reference:** a crash between the create of the FTS
    table and its rebuild leaves old messages out of search, with no error.
    The next start sees the table as current, because "current" is a text
    test of its SQL (`server/cjk-search.ts:64`, `:80-96`). A change of the
    CJK rules never updates old rows, because the fill reads only rows with
    `search_text IS NULL` (`:70`). The release problem: "State lost at a
    restart or a crash" (v0.1.24, v0.1.74, v0.1.107, v0.1.165, v0.1.180).
- **P527 (decision, with P525). Recall and the memory sync run on the
  search thread, not on the thread that serves the window.**
  - **Problem in the reference:** after a restart, the first memory search
    of each bot reads and indexes every memory file again on the main
    thread (`server/workspace.ts:233`, `:249`, `:260-263`). Recall runs on
    the main thread with no time limit (`server/message-db.ts:826`, `:970`).
    The `LIKE` scan on the main thread held the event loop for 70 to 107 ms
    (`docs/verification/persistence-performance.md:47-74`). The release
    problem: "One slow or stuck part blocks the others" (v0.1.114, v0.1.136,
    v0.1.153, v0.1.177, v0.1.178).
- **P528 (decision). Follow the reference: one search thread with a queue
  of 8.** The 9th search gets a typed "busy" refusal.
  - Not better than the reference. A warning: `docs/comparison.md:254`
    maps the search to `tokio::task::spawn_blocking`, which runs many
    searches at the same time and loses the bound of the reference
    (`server/message-search.worker.ts:6`,
    `server/message-search-worker.ts:27`). That row must name the bound.
    Without the bound, the release problem is "Memory and the number of
    processes" (v0.1.110, v0.1.118, v0.1.165, v0.1.176, v0.1.180).
- **P529 (plan, the search step). Tests with a fake clock and a barrier.**
  The deadline uses our `Clock` trait. A test holds the scan with a barrier,
  as `server/testing/hold-search-result.ts` does.
  - **Problem in the reference:** the worker test expects that a worker
    cannot start in 1 ms (`server/message-search-worker.test.ts:60-62`). The
    end-to-end test needs 8 scans to wait at the same time
    (`server/message-search.e2e.test.ts:52-62`). The release problem:
    "Tests that fail by chance" (v0.1.77, v0.1.99, v0.1.133).
- **P530 (plan, the search step). The SQL filters the threads that the
  viewer can see, before the limit.** The second access check after the
  scan stays, as in the reference (`server/routes/threads.ts:530-543`).
  - **Problem in the reference:** the route asks for the newest
    `limit * 10` matches of all threads, and filters them after the scan
    (`server/routes/threads.ts:529`, `:544-546`). A viewer with limited
    access can get no hits, and the sidebar then shows no "+"
    (`src/components/SearchResults.tsx:55`).
  - Judgment call: no release names this.
- **P531 (plan, the search step). Stop a search that nobody waits for.** The
  UI cancels the old request. The command cancels the queued scan, or
  stops it when it runs.
  - **Problem in the reference:** the palette and the find bar send a
    search after each pause of 150 or 180 ms, with no minimum length
    (`src/components/CommandPalette.tsx:80`,
    `src/components/ChatFindBar.tsx:29`, `:51`). No caller stops its
    request, and the route does not watch for a closed connection. So fast
    typing can fill the 8 places and give "busy" to another view.
  - Judgment call: the class is "One slow or stuck part blocks the
    others", but no release names it.
- **P532 (choice). One rule for the words of the person and of the bot, or
  a clear difference.**
  - **Problem in the reference:** the person searches a substring
    (`server/message-search-query.ts:33-44`). The bot searches words with
    FTS5 (`server/message-db.ts:821-835`, `server/index.ts:13313`,
    `:13343`). So "audi" finds "audit" for the person, but not for the bot.
    The plan of the reference says that the bot uses `/api/search`, and
    that is not true (`docs/superpowers/plans/2026-08-31-06-memory-review-loop.md:161-162`).
  - Options:
    - a. Two engines, as in the reference. Our docs say which caller uses
      which engine.
    - b. FTS5 for the person too, with the `trigram` tokenizer for
      substrings. Not verified: whether the `bundled` feature of `rusqlite`
      has `trigram`.
  - Judgment call: no release names this.
- **P533 (plan, step 15). A content check for the memory index.** Keep a
  hash of the indexed text of each memory file, and compare it in the sync.
  - **Problem in the reference:** an index error after a memory write is
    ignored (`server/workspace.ts:207-214`). A change with the same size and
    the same whole-number time is not seen until the date changes
    (`server/workspace.ts:249`). The bot then recalls old memory text.
  - Judgment call: the class is "State lost at a restart", but no release
    names it.
- **P534 (plan, the search step). Ship the search corrections of the
  reference from the first version.** Each one becomes a "Done when" test.
  - The faults that the reference corrected in later releases:
    - `INSERT OR REPLACE` skipped the delete trigger (`fc53f0524`).
    - Index rows stayed after the person deleted a bot (`2f3d74dbd`).
    - A Han or kana run was one token (`949cabedd`).
    - A katakana word with a long vowel mark gave no terms (`799b5cdba`,
      0.1.154).
    - SQLite `lower()` folds only ASCII (`ab24b7529`, 0.1.154).
    - The search dropped a one-character word (`33f06c6bc`, 0.1.180).
    - A scan held the event loop (`4c02bf748`).
  - Section 5 of `changelog.md` has no search row, so this answers no row
    directly. It follows the aim of `MEMORY.md`: avoid the mistakes of the
    releases.
