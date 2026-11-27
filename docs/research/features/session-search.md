# Session search

The record of the search engine under the search of past conversations in
the reference project. It covers the full-text index and its store, how a
query becomes SQL, the worker thread, CJK and Unicode text, and the limits.

- Reference: the reference project at commit `fcce0b6de`, 13 commits after
  the tag `v0.1.182`. Of those 13 commits, only `ccd37f116` touches a search
  file (`server/message-db.ts`), and it does not change search (section
  3.8). The newest release note is 0.1.182
  (`announcements/releases.json:7`). No release note after v0.1.182 is
  about this feature.
- Row of [`reference-features.md`](../reference-features.md): "Search of
  past sessions", from `2026-08-31-06-memory-review-loop.md` (the search
  part) and `docs/verification/persistence-performance.md`. Part 47 of
  [`README.md`](../README.md). Group "later". Crate `bot-core`.
- Six subagents read the files in groups: `engine-core`, `message-store`,
  `engine-tests`, `route-and-ui`, `docs-and-history` and `ours`.
- The lead read these reference lines and confirmed the claims about them:
  - `server/message-search.worker.ts:1-18` and
    `server/message-search-worker.ts:1-75`.
  - `server/message-search-query.ts:30-64` and `server/cjk-search.ts:1-97`.
  - `server/message-db.ts:30-52`, `:105-160`, `:690-702`, `:722-775` and
    `:819-836`.
  - `server/routes/threads.ts:515-564` and `server/index.ts:13313-13343`.
  - `server/message-search-worker.test.ts:30-67` and
    `server/message-search.e2e.test.ts:20-65`.
  - `docs/verification/persistence-performance.md:44-116`.
  - The lead also checked every production statement that writes
    `messages` (a grep of `INSERT INTO messages` and `UPDATE messages SET`
    in `server/`).

  Other facts come from the reports of the readers, with their file and
  line.

## What this file adds to earlier research

[`memory.md`](memory.md) already has the layer above the engine:

- the `session_search` tool (memory.md:773-806).
- automatic recall, its query rules and its order of results (section 3.5,
  memory.md:591-660).
- `reachThreads` and the short-term rule (memory.md:160-171).
- the memory tables in the data (memory.md:1316).

[`skills.md`](skills.md) has the skill parts of the memory review loop plan
(section 3.5, skills.md:720-795). This file does not repeat them.

This file adds:

- The engine of the search box of the person. It is a `LIKE` scan in a
  worker thread, not full-text search. `comparison.md:254` says this, and
  it is still correct at `fcce0b6de`.
- The FTS5 index: its schema, the view, the triggers, why writes use an
  upsert, and the migration at open.
- The CJK transform at write time.
- The `/api/search` route and its visibility checks.
- The three UI callers.
- The tests of the engine and the measured numbers.
- How the index behaves at a restart and a crash, and a table of limits.

## 1. In short

The reference project has **two search engines** over the same message
table.

1. **The search of the person.** It serves the sidebar search, the command
   palette and the find bar of one chat. It calls `GET /api/search`. The
   server sends the query to **one worker thread**. The worker opens a
   read-only connection and runs a substring `LIKE` scan over every message
   row. It returns the newest matches first, with no ranking
   (`server/message-search-query.ts:39-44`).
2. **The search of the bot.** It serves the `session_search` tool
   (`GET /api/internal/session-search`, `server/index.ts:13313`),
   automatic recall and memory search. It uses an **FTS5 index** and ranks
   the results with `bm25`. It runs synchronously on the main thread
   (`server/message-db.ts:821-835`, `server/index.ts:13343`).

The memory review loop plan says "Search past sessions — already exists
(`/api/search`)" (`docs/superpowers/plans/2026-08-31-06-memory-review-loop.md:161-162`).
But the tool of the bot does not use `/api/search`. It uses the FTS5
engine. So the same words can give different results for the person and
for the bot.

Terms:

- **FTS5**: the full-text search module of SQLite. It keeps an inverted
  index of the words (tokens) of a text column. A query uses `MATCH`.
- **External-content table**: an FTS5 table that stores only the index. It
  reads the text from another table or view (`content='<view>'`). Triggers
  must keep it in step with that table.
- **Trigger**: SQL that SQLite runs after an insert, update or delete on a
  table, in the same transaction.
- **`unicode61`**: the default tokenizer of FTS5. It splits text at spaces
  and punctuation and folds case. It has no dictionary for Chinese or
  Japanese.
- **CJK**: Chinese, Japanese and Korean script. In this code, CJK means
  Han, Hiragana and Katakana only, without Hangul (`server/cjk-search.ts:7`).
- **`search_text`**: a column that holds the text with a zero-width space
  (U+200B) between CJK characters. The index reads this column when it is
  not null.
- **Bigram**: a pair of characters next to each other. "图书馆" gives "图书"
  and "书馆".
- **`bm25`**: the rank function of FTS5. A lower value is a better match.
- **Worker thread**: a Node.js thread with its own event loop. A long scan
  there does not stop the main event loop.
- **Event loop delay**: the time that the main thread cannot answer other
  work, for example a health check.
- **503**: the HTTP status "service unavailable". The reference uses it for
  "search is busy, try again".
- **Active path**: the branch of a conversation that the person sees now. A
  message on another branch is "off the active path".

## 2. Files read completely

All paths are in the reference project unless the group is `ours`.

`engine-core`:

| File | Lines |
|---|---|
| `server/message-search.worker.ts` | 18 |
| `server/message-search-worker.ts` | 75 |
| `server/message-search-query.ts` | 79 |
| `server/cjk-search.ts` | 97 |
| `server/message-db-memory-index.ts` | 17 |
| `server/message-db-bot-text-indexes.ts` | 6 |
| `scripts/bundle-server.mjs` | 180 |

`message-store`:

| File | Lines | Read |
|---|---|---|
| `server/message-db.ts` | 1000 | all |
| `server/message-writes.ts` | 18 | all |
| `server/workspace.ts` | 644 | ranges 1-15, 93-281, 445-560 |
| `server/workspace-backup.ts` | 997 | ranges 1-30, 105-128, 720-980 |
| `git show ccd37f116 -- server/message-db.ts` | | the full diff and message |

`engine-tests`:

| File | Lines | Read |
|---|---|---|
| `server/cjk-search.test.ts` | 147 | all |
| `server/message-search-unicode.test.ts` | 44 | all |
| `server/message-search-worker.test.ts` | 67 | all |
| `server/message-search.e2e.test.ts` | 82 | all |
| `server/thread-search-short-terms.e2e.test.ts` | 41 | all |
| `server/testing/hold-search-result.ts` | 22 | all |
| `server/message-db.test.ts` | 653 | all |
| `server/store.test.ts` | 2950 | ranges 2645-2662, 2790-2860 |
| `server/testing/setup.ts` | | 1-41, for context |
| `vite.config.ts` | | 20-90, for context |

`route-and-ui`:

| File | Lines | Read |
|---|---|---|
| `server/routes/threads.ts` | 612 | all |
| `src/components/SearchResults.tsx` | 98 | all |
| `src/components/CommandPalette.tsx` | 278 | all |
| `src/components/ChatFindBar.tsx` | 149 | all |
| `src/components/ChatFindBar.fork.test.ts` | 45 | all |
| `packages/phone-protocol/src/responses.ts` | | 106-130 |
| `src/locales/en.json` | 12251 | the search keys only: 2326, 2963-2971, 8396-8397, 9133-9139, 9344-9348 |

`docs-and-history`:

| File | Lines | Read |
|---|---|---|
| `docs/superpowers/plans/2026-08-31-06-memory-review-loop.md` | 175 | all |
| `docs/verification/persistence-performance.md` | 144 | all |
| `scripts/bench-persistence.ts` | 100 | all |
| `docs/plans/2026-09-25-memory-layer.md` | 232 | all |
| `docs/verification/memory-layer.md` | 65 | all |
| `docs/memory.md` | 525 | ranges 1-180, 385-525 (all search lines are in them) |
| `announcements/releases.json` | 1341 | ranges 1-12, 162-164, 215-260, 320-339, 1165-1167, 1215-1260 |
| Git | | `git log v0.1.182..HEAD`, the log of the three engine files, and `git show` of 13 commits |

`ours` (this repository):

| File | Lines | Read |
|---|---|---|
| `docs/plan/README.md` | 449 | all |
| `docs/decisions.md` | 719 | all |
| `docs/comparison.md` | 392 | all |
| `docs/research/README.md` | 230 | all |
| `docs/research/progress.md` | 588 | all |
| `docs/research/changelog.md` | 445 | sections 5-7 (147-241) all |
| `docs/research/features/memory.md` | 1657 | ranges 1-260, 333-388, 495-515, 586-812, 1253-1355, 1460-1657, and a grep of all lines |
| `docs/research/features/skills.md` | 1489 | ranges 1-35, 100-115, 157-178, 383-392, 720-797, 1308-1340, and a grep of all lines |
| `Cargo.toml` and the five `crates/*/Cargo.toml` | | all |
| `crates/*/src/*.rs` (lib and main of each crate, `message.rs`) | | all |
| `crates/bot-desktop/ui/src/components/SearchField.tsx` | 51 | all |

## 3. How it works

### 3.1 The index is made when the database opens

1. `open()` opens `<DATA_DIR>/messages.db` with file mode 0600
   (`server/message-db.ts:40-48`).
2. It sets `journal_mode = WAL` and `synchronous = NORMAL`
   (`message-db.ts:49-50`).
3. It creates the `messages` table and the other tables with
   `CREATE TABLE IF NOT EXISTS` (`message-db.ts:51-112`).
4. It calls `ensureRecallIndex` and `ensureMemoryIndex`
   (`message-db.ts:113-114`). Both call `ensureSearchIndex`
   (`server/cjk-search.ts:60-97`) on one table:
   - `messages` gets the FTS table `messages_fts` and the view
     `messages_search` (`message-db.ts:129`).
   - `memory_files` gets `memory_fts` and `memory_search`
     (`server/message-db-memory-index.ts:16`).
5. `ensureSearchIndex` does these steps:
   1. It adds the column `search_text TEXT` if it is missing
      (`cjk-search.ts:61-62`).
   2. It reads the SQL of the FTS table from `sqlite_master`. The index is
      "current" when that SQL contains the name of the view
      (`cjk-search.ts:63-64`). This string test is the only version check.
   3. When the index is not current, it drops the three triggers and the
      FTS table (`cjk-search.ts:66`). Then, in one transaction, it fills
      `search_text` for each row that has text, has no `search_text`, and
      holds CJK (`cjk-search.ts:67-78`). An error rolls back and throws.
   4. It always runs `CREATE ... IF NOT EXISTS` for the view, the FTS table
      and three triggers (`cjk-search.ts:80-95`). Section 4.2 has their SQL.
   5. When the index was not current, it runs the FTS5 command `rebuild`
      (`cjk-search.ts:96`). This reads every row of the view again.
6. **Error path, no FTS5.** When SQLite has no FTS5 module,
   `describeMissingFts5` changes the error to a message that asks for Node
   24 or newer (`message-db.ts:118-125`). `ensureRecallIndex` throws it
   again (`message-db.ts:130-132`). So `open()` fails, and the whole
   message store fails, not only search. The reference rejected a `LIKE`
   fallback for recall because it is "a second search implementation ...
   ranking differently, silently" (commit `90f98db5d`, from the
   `docs-and-history` reader).
7. **Edge case, the file is deleted.** SQLite keeps writing to a deleted
   file with no error. So `db()` checks once each second
   (`FILE_RECHECK_MS = 1_000`) that the file is there
   (`message-db.ts:35-36`, `:144-159`). When it is gone, `db()` opens a new
   empty database with an empty index. The old rows are lost.
8. **Limit.** The migration (steps 5.3 to 5.5) runs synchronously on the
   main thread, inside the first `db()` call. A large database stops the
   event loop for the time of the fill and the `rebuild`.
9. **Crash gap.** Steps 5.3, 5.4 and 5.5 are separate commits. Only the
   fill is in a transaction (`cjk-search.ts:68-78`). Two crash points:
   - A crash after the `DROP` and before the `CREATE` leaves no FTS table.
     The next open sees "not current" and does the migration again. This
     is safe.
   - A crash after the `CREATE` (`cjk-search.ts:80-95`) and before the
     `rebuild` (`:96`) leaves an empty FTS table whose SQL names the view.
     The next open sees "current" (`:64`) and does not rebuild. The old
     rows stay out of the index, with no error. This comes from the order
     of the code. Nobody reproduced it.

### 3.2 A message is written, and the index follows

1. Each writer computes `search_text = cjkSearchText(text)`
   (`message-db.ts:140-141`, `:469`). For text with no CJK, the value is
   null. The index then reads `text`.
2. `insertMessage` uses an upsert:
   `INSERT ... ON CONFLICT(thread_id, id) DO UPDATE SET ...`
   (`message-db.ts:136-139`). The comment gives the reason. `INSERT OR
   REPLACE` deletes the old row without the delete trigger, because SQLite
   fires that trigger only when recursive triggers are on
   (`message-db.ts:135`). The old index entry then pointed at a row that
   was gone. Commit `fc53f0524` corrected this (from the
   `docs-and-history` reader).
3. The trigger `_ai`, `_ad` or `_au` writes the index entry in the same
   statement, so in the same transaction (`cjk-search.ts:85-94`). A crash
   cannot keep the row and lose its index entry, or the reverse.
4. `updateMessage` updates all columns, `search_text` too, in one statement
   (`message-db.ts:469`).
5. `importThread` in relinked mode uses a plain `INSERT` that sets
   `search_text` (`message-db.ts:450`). It changes only `json.parentId`
   later (`:455`). The update trigger then indexes the same text again
   (from the `message-store` reader).
6. `deleteThreads` deletes the rows in one transaction. The delete trigger
   removes the index entries (`message-db.ts:653-666`, from the reader).
7. A restore from a backup can rewrite `text` when the data folder moved.
   It writes `search_text` too, when the column exists, in one transaction
   (`server/workspace-backup.ts:828-856`). An older backup with no
   `search_text` is migrated by `ensureSearchIndex` at the next open.
8. The lead checked every production statement that writes `messages`.
   Each one sets `search_text` or keeps `text` the same. The only other
   writer is a test helper (`server/sentinel/testing.ts:36`). It uses
   `INSERT OR REPLACE` for activity rows with no text.
9. **Edge case.** The fill at migration touches only rows where
   `search_text IS NULL` (`cjk-search.ts:70`). When the CJK rules change in
   a later release, old rows keep the old `search_text`. Nothing computes
   it again.

### 3.3 The CJK transform

1. `CJK` is Han, Hiragana and Katakana, plus `ー` (U+30FC), `ｰ` (U+FF70),
   `ﾞ` (U+FF9E) and `ﾟ` (U+FF9F) (`cjk-search.ts:7`). Unicode puts these
   four marks in the Common script, not in kana (`cjk-search.ts:6`).
   Hangul is not in the set. Korean text is indexed by `unicode61` as it
   is.
2. `CJK_BOUNDARY` matches the position between a CJK character and a letter
   or a digit, on either side (`cjk-search.ts:11`). A CJK character is a
   letter. So the boundary is between each two CJK characters, and between
   CJK and Latin letters or digits. It is not next to punctuation or a
   space.
3. `cjkSearchText` puts `SEARCH_MARK` (U+200B) at each boundary
   (`cjk-search.ts:25-27`). `unicode61` treats U+200B as a separator, so
   each CJK character becomes one token (`cjk-search.ts:3-5`). The code
   writes the mark as an escape so that an editor cannot remove it
   (`cjk-search.ts:12-13`, commit `e56d956bf`).
4. `withoutSearchMarks` removes the marks from a snippet
   (`cjk-search.ts:29`).
5. `ftsPhrase(term)` removes `"`, puts a space at each CJK boundary, and
   quotes the term (`cjk-search.ts:32`). "图书馆" becomes `"图 书 馆"`, a
   phrase of three tokens in a row.
6. `cjkTokenParts(token)` makes the query terms of a CJK run
   (`cjk-search.ts:36-50`):
   - It replaces filler words with a space: Chinese pronouns and function
     words, sentence particles, and two or more long vowel marks
     (`cjk-search.ts:17-20`).
   - Each part gives its overlapping bigrams (`cjk-search.ts:44-45`).
   - When no part has two characters, it keeps a lone Han character and
     drops a lone kana (`cjk-search.ts:46-47`).
7. How recall uses these terms, and the caps of 16 words and 24 bigrams,
   are in [`memory.md`](memory.md) section 3.5 (memory.md:615-625).
8. History. Before commit `949cabedd`, `unicode61` indexed a whole Han or
   kana run as one token, so a word inside a sentence never matched (issue
   #5161). Twenty Chinese questions recalled 0 of 20 notes before the
   correction and 20 of 20 after it. Commit `799b5cdba` added the four
   Common-script marks. Before that, a katakana word with a long vowel mark
   gave no query terms, and team search "returned every entry" (from the
   `docs-and-history` reader).

### 3.4 The search of the person: `GET /api/search`

The route is in `server/routes/threads.ts:515-564`.

1. It reads `q` with no trim and no length check (`threads.ts:516`).
2. It reads `limit` (`threads.ts:518`):
   - no value gives 40.
   - a value is clamped to 1..100.
   - text, 0 or a negative value gives 1, not a 400.
   - a fraction is not rounded. `.slice(0, 2.5)` gives 2 hits
     (`threads.ts:546`).
3. It reads `threadId` and trims it (`threads.ts:519`). When the thread is
   unknown, or the viewer cannot see it, it returns 404 "no such
   conversation" (`threads.ts:520-522`). The two cases give the same text,
   so the answer does not show that a hidden thread exists.
4. It asks the engine for `limit` hits when the viewer sees everything.
   Otherwise it asks for `min(limit * 10, 1000)` hits (`threads.ts:529`).
   Because `limit` is at most 100, the cap of 1000 never acts.
5. It awaits `searchMessagesAsync` (section 3.5).
6. It checks access again after the await, because "A scan may outlive a
   revocation or audience edit" (`threads.ts:530`):
   - On a hosted workspace with a session, it calls
     `workspaceAccess.authorize` again. Without that service it returns
     503 (`threads.ts:531-535`).
   - It resolves the request auth again and makes the visible set again
     (`threads.ts:536-542`).
   - A thread scope that the viewer lost gives 404 (`threads.ts:543`).
7. It keeps the hits in threads that the viewer can see now, then takes the
   first `limit` hits (`threads.ts:544-546`).
8. For each hit, it adds the bot or room name, the task title and
   `onActivePath` (`threads.ts:547-559`). `onActivePath` loads the active
   path of each matched thread one time and keeps it in a map for the
   request (`threads.ts:523-528`). This runs on the main thread.
9. It drops a hit whose thread is no longer a bot thread or a room thread
   (`threads.ts:550`, `:560-562`).
10. It returns `200 { hits }` (`threads.ts:563`).

Error paths and edge cases:

- The route has no `try`/`catch` around the await, no abort signal and no
  check for a client that went away (`threads.ts:529`). A thrown
  `SearchUnavailable` has `status = 503`
  (`server/message-search-worker.ts:5-7`). How the route table turns it
  into a response was not read.
- **A restricted viewer can miss old matches.** The engine returns the
  newest `limit * 10` matches of all threads, and the route filters them
  after the scan. When more than `limit * 10` newer matches are in threads
  that the viewer cannot see, the viewer gets fewer hits or none, but
  older visible matches exist. Steps 4 and 7 cause this. Nobody measured
  it.
- There is no cursor and no second page.

### 3.5 The worker

The client is `server/message-search-worker.ts`. The worker is
`server/message-search.worker.ts`.

1. `searchMessagesAsync` returns `[]` for an empty query
   (`server/message-db.ts:698`).
2. It calls `db()` first, so that the main connection makes or migrates the
   schema before any read-only scan (`message-db.ts:699`). This is the
   point where the migration of section 3.1 can run on the main thread.
3. It makes one `MessageSearchWorker` for the process, the first time, and
   keeps it (`message-db.ts:37`, `:700`).
4. `search()` rejects at once with 503 "Search is busy. Try again shortly."
   when 8 requests are pending (`message-search-worker.ts:27`).
5. When no worker runs, it starts one (`message-search-worker.ts:28-35`):
   - It loads `message-search.worker.ts` when that file exists, else the
     bundled `.js` file (`:29-30`). The bundle script builds the worker as
     its own entry (`scripts/bundle-server.mjs:34`).
   - It passes `execArgv: []`, so the worker does not get the test loaders
     or the inspector port (`:32-33`).
6. It calls `worker.ref()` so that the process stays alive during the
   request (`:54`). It gives the request the next number of a counter
   (`:55`).
7. It starts a timer of 30 000 ms when it queues the request (`:21`,
   `:57`). It posts `{ id, query, limit, threadId }` (`:59`).
8. The worker handles one message at a time. For each request it
   (`message-search.worker.ts:6-17`):
   1. opens a new `DatabaseSync(file, { readOnly: true })`.
   2. runs the scan of section 3.6.
   3. posts `{ id, hits }`.
   4. closes the connection in `finally`. The reason: "Closing after each
      scan keeps no old database inode open across a workspace restore"
      (`:5`).
9. On any error, the worker posts `{ id, failed: true }` with no text,
   because "Database errors can contain private paths or query text"
   (`message-search.worker.ts:12-14`).
10. The client handles a reply (`message-search-worker.ts:36-45`):
    - It ignores a reply from an older worker (`:37`) and an unknown id
      (`:38-39`).
    - It clears the timer.
    - `failed` gives 503 "Search could not finish. Try again shortly."
      (`:42`).
    - When no request is pending, it calls `worker.unref()` (`:44`). The
      idle worker stays loaded but does not keep the process alive.

Error paths:

- **Timeout.** When the timer of one request fires, it calls `close()`
  (`:57`). `close()` rejects **every** pending request with 503 "Search
  was interrupted. Try again shortly." and stops the worker (`:64-73`).
  The timer starts at queue time, not at scan time. So a request can time
  out because the requests in front of it were slow.
- **A worker error or exit** also calls `close()` (`:46-51`).
- **`postMessage` throws**: `close()` (`:59-60`).
- **Restart.** The next `search()` starts a new worker (`:28`). There is no
  backoff.
- **A missing database file.** The read-only open fails. The worker does
  not create the file (`server/message-search-worker.test.ts:52-58`).
- **Shutdown and maintenance.** `closeMessageSearch` ends the worker
  (`message-db.ts:984-990`). `closeMessageDb` calls it but does not wait
  for it (`message-db.ts:993`). Maintenance waits for both
  (`server/index.ts:11904-11906`). Shutdown calls both
  (`server/index.ts:15222`, `:15236`). These `index.ts` lines are from the
  `message-store` reader.

### 3.6 The scan

`searchMessagesInDatabase` is in `server/message-search-query.ts:32-79`.

1. `needle = query.trim().toLowerCase()`. An empty needle gives `[]`
   (`:33-34`). The needle is the whole query, not words. "audit links"
   finds only that exact text.
2. It registers the SQL function `omb_search_lower` on the connection. The
   function calls JavaScript `toLowerCase`, because the SQLite `lower()`
   folds only ASCII (`:35-36`). Commit `ab24b7529` added this (release
   0.1.154, "Search matches upper and lower case in every language").
3. It escapes `\`, `%` and `_`, and makes the pattern `%needle%` (`:37`).
4. It runs this SQL (`:39-44`):

   ```sql
   SELECT thread_id, id, at, role, kind, text,
          json_extract(json, '$.tool.name') AS tool_name,
          json_extract(json, '$.from.name') AS from_name
   FROM messages
   WHERE [thread_id = ? AND]
     ((kind = 'text' AND text IS NOT NULL AND omb_search_lower(text) LIKE ? ESCAPE '\')
      OR (kind = 'activity' AND tool_name IS NOT NULL AND omb_search_lower(tool_name) LIKE ? ESCAPE '\'))
   ORDER BY at DESC LIMIT ?
   ```

   It reads `text`, not `search_text`, so the U+200B marks do not matter
   here. It calls the JavaScript function once for each row. No index can
   help a `LIKE '%...%'` pattern. So each search reads the whole table.
5. For each row it makes a snippet (`:58-64`):
   - It finds the match with `matchSpan`, which maps the place in the
     lower-case text back to the original text when lower case changes the
     length, for example "İ" (`:15-30`).
   - It keeps 60 code units before the match and 90 after it (`:60-61`).
   - It folds white space and adds "…" at a cut end (`:62-64`).
   - It returns `matchStart` and `matchLength` in the snippet.
6. There is no rank. The newest message comes first.

### 3.7 The search of the bot (FTS5), in short

The query rules are in [`memory.md`](memory.md) (memory.md:611-638,
773-806). The engine facts that this file adds:

1. `recallMessages` joins `messages_fts` to `messages` on `rowid` and uses
   `MATCH ?` with the thread list as `IN (?, ?, ...)`
   (`message-db.ts:821-835`). The list has no cap in this function.
2. It orders by `(m.kind = 'digest')`, then `bm25(messages_fts)`, then
   `m.at DESC` (`message-db.ts:833`). It makes a snippet with
   `snippet(messages_fts, 0, '[', ']', '…', 48)` (`message-db.ts:830`,
   `:774`).
3. `recallMemory` does the same on `memory_fts`, ordered by `bm25` then the
   file time (`message-db.ts:967-982`).
4. Neither function catches an error. They run with `db()` on the main
   thread, with no time limit.
5. Before each memory search, `searchMemoryFiles` runs `syncMemoryIndex`
   (`server/workspace.ts:260-263`). That function stats each memory file
   of the bot and indexes a file again when its size or its whole-number
   mtime changed, or when the date changed (`workspace.ts:241-258`). The
   date map is in process memory (`workspace.ts:233`). So after a restart,
   the first search of each bot reads and indexes every memory file again,
   on the main thread.
6. A memory write indexes the file after the file write. An index error is
   ignored (`workspace.ts:199-214`). A change that keeps the same size and
   the same whole-number mtime is not seen until the date changes
   (`workspace.ts:249`).

### 3.8 Commits after v0.1.182

Only `ccd37f116` of the 13 commits touches a search file. It adds a
`messageWritten(json)` call after each message write
(`message-db.ts:15`, `:440`, `:452`, `:456`, `:469`), for a new scan of
uploads. It does not change the index, the scan or recall. Its message is
evidence for the problem "one slow part blocks the others". A full-table
scan for each upload on the main thread "held the event loop for many
minutes", health checks failed, and the hosted home was restarted. The
reference now cuts that scan into slices of about 15 ms (from the
`message-store` and `docs-and-history` readers).

### 3.9 Measured numbers

From `docs/verification/persistence-performance.md` and
`scripts/bench-persistence.ts`. The test machine was macOS arm64 with Node
26.7.0 and 50 000 seeded messages (`persistence-performance.md:44-45`).
Each value is the median of three maximum event-loop delays.

| Workload | Sessions | Synchronous scan | Scan in the worker |
|---|---:|---:|---:|
| Mixed (`:47-51`) | 1 | 70.84 ms | 3.22 ms |
| | 10 | 73.14 ms | 9.77 ms |
| | 50 | 90.11 ms | 25.90 ms |
| Paced, checkpointed (`:70-74`) | 1 | 99.81 ms | 3.47 ms |
| | 10 | 102.11 ms | 9.04 ms |
| | 50 | 107.22 ms | 25.99 ms |

- One scan took about 65 to 85 ms. The worker frees the event loop but
  does not make the SQL faster (`:53-55`).
- Outliers: 492.04 ms without the worker and 292.55 ms with it, and one
  message append of 1 267.99 ms. The cause was not found (`:57-63`).
- The bench measures one query with no hit (from the reader:
  `bench-persistence.ts:79-80`). Nobody measured the FTS5 latency, the
  size of the index or the memory of the worker.
- The scope of the change: "Only `/api/search` scans move to a worker.
  Agent recall ... not silently changed" (`:86-87`).

### 3.10 Limits

| Limit | Value | Where |
|---|---|---|
| Route `limit` | default 40, 1 to 100 | `threads.ts:518` |
| Rows asked from the engine for a restricted viewer | `limit * 10`, cap 1000 (never reached) | `threads.ts:529` |
| Pending searches | 8, the 9th gets 503 | `message-search-worker.ts:27` |
| Deadline of a search | 30 000 ms from queue time | `message-search-worker.ts:21`, `:57` |
| Worker threads | 1 for each process | `message-db.ts:37`, `:700` |
| Connections | 1 new read-only connection for each search | `message-search.worker.ts:9` |
| Snippet of the person | 60 code units before, 90 after | `message-search-query.ts:60-61` |
| Snippet of the bot | 48 tokens | `message-db.ts:774` |
| Recall results | 12 by default | `message-db.ts:821`, `:967` |
| Recall query terms | 16 words and 24 bigrams | `message-db.ts:771` |
| Check that the database file exists | each 1 s | `message-db.ts:36` |
| Memory file size | 256 KiB | `workspace.ts:186` |
| UI minimum query length | 2 in the sidebar, none elsewhere | `SearchResults.tsx:11`, `:22` |

## 4. The data

### 4.1 Tables

All tables are in `<DATA_DIR>/messages.db`.

- `messages(thread_id, id, at, role, kind, text, json)`, primary key
  `(thread_id, id)` (`message-db.ts:52-61`). `ensureSearchIndex` adds
  `search_text TEXT` (`cjk-search.ts:62`).
- `memory_files(bot_id, path, text NOT NULL, mtime_ms, bytes)`, primary key
  `(bot_id, path)`, plus `search_text` (`message-db-memory-index.ts:6-15`).
  It holds a copy of each memory file, after expired entries are removed
  (`workspace.ts:235-239`).
- `message-db-bot-text-indexes.ts` adds two partial B-tree indexes for
  other reads. They are not part of search
  (`server/message-db-bot-text-indexes.ts:5-6`).

### 4.2 The index objects for each table

`ensureSearchIndex` makes these objects (`cjk-search.ts:80-95`). `<t>` is
the trigger prefix.

```sql
CREATE VIEW IF NOT EXISTS <view> AS
  SELECT rowid AS rid, coalesce(search_text, text) AS text FROM <table>;
CREATE VIRTUAL TABLE IF NOT EXISTS <fts> USING fts5(
  text, content='<view>', content_rowid='rid', tokenize='unicode61');
-- <t>_ai: after insert, add the new entry
-- <t>_ad: after delete, send the 'delete' command for the old entry
-- <t>_au: after update, 'delete' the old entry, then add the new one
```

- The FTS table stores only the index. The text stays in the base table.
- The triggers compute `coalesce(search_text, text)`. They never compute
  `search_text`. The writer must set it.
- `tokenize='unicode61'` has no options. The default of `remove_diacritics`
  in the SQLite of Node was not checked.

### 4.3 Wire types

- `SearchHit` from the engine: `threadId`, `messageId`, `at`, `role`,
  `kind`, `snippet`, `matchStart`, `matchLength`, `from?`
  (`message-search-query.ts:3-13`).
- `SearchResponse` adds `botId` or `groupId`, `name`, `task` and
  `onActivePath` (`packages/phone-protocol/src/responses.ts:106-130`).
  `matchStart` and `matchLength` count UTF-16 code units
  (`responses.ts:113`).
- Worker request: `{ id, query, limit, threadId? }`. Reply:
  `{ id, hits }` or `{ id, failed: true }`
  (`message-search.worker.ts:6-14`).

### 4.4 State at a restart

- The index is in the database file, so it survives a restart. Nothing
  rebuilds it or checks it at a normal start. The string test of section
  3.1 is the only check.
- The worker keeps no state. It opens the file again for each search.
- The memory index stays in the file, but the date map that decides a
  re-index is lost (`workspace.ts:233`).
- `synchronous = NORMAL` with WAL can lose the last commits at a power
  loss. The row and its index entry stay in step, because the trigger is
  in the same transaction.

## 5. The UI

Three components call `/api/search`. The `route-and-ui` reader gives these
facts.

| | Sidebar results (`SearchResults.tsx`) | Command palette (`CommandPalette.tsx`) | Find bar of one chat (`ChatFindBar.tsx`) |
|---|---|---|---|
| Minimum length | 2 after trim (`:11`, `:22`) | none (`:70`) | none (`:29`) |
| Wait after a key | 250 ms (`:12`) | 150 ms (`:80`) | 180 ms (`:51`) |
| `limit` | 40 (`:31`) | 12 (`:77`) | 100 and `threadId` (`:37`) |
| Query sent | trimmed (`:19`) | trimmed and lower case (`:67`) | trimmed (`:27`) |
| Old answers | an `alive` flag (`:29`, `:35-38`) | an `alive` flag (`:75`, `:81-84`) | a request counter (`:15`, `:28`, `:39`) |
| Request aborted | no | no | no |
| Loading | a header with no count (`:27`, `:55`) | none, message hits cleared at each key (`:74`) | "Searching…" (`:35`, `:112-113`) |
| Error | `search.failed` in the list (`:57`) | ignored, shows as no result (`:79`) | the global error box (`:43-47`) |
| No result | `search.noMatch` (`:58`) | `sidebar.noMatch` or `palette.empty` (`:192-196`) | `chat.find.noResults` (`:117`) |

- **Count.** The sidebar shows "40+" only when exactly 40 hits come back
  (`SearchResults.tsx:55`). A restricted viewer can get fewer than 40 when
  more exist, and then sees no "+". The find bar shows "x of 100" at the
  cap, with no sign of more (`ChatFindBar.tsx:116`).
- **Mark.** The UI cuts the snippet at `matchStart` and `matchLength` and
  puts the match in one `<mark>` (`SearchResults.tsx:61-63`, `:84`,
  `CommandPalette.tsx:254-256`, `:268`). React renders the text, so a
  snippet cannot add markup. Only one match is marked in each hit.
- **Text direction.** The sidebar snippet has `dir="auto"`
  (`SearchResults.tsx:81`). The palette snippet does not
  (`CommandPalette.tsx:267`).
- **Other branch.** The sidebar shows "other version" when `onActivePath`
  is false (`SearchResults.tsx:87-91`). The palette does not.
- **Open a hit.** All three call `landOnSearchHit` (`src/lib/focus-message.ts:35`,
  not read). In a fork panel, the find bar first checks that the hit is in
  the thread of the panel. For a hit off the active path, it posts
  `/api/bots/:ownerId/active-branch`, and then focuses the message
  (`ChatFindBar.tsx:62-71`). New results move to the first hit at once
  (`ChatFindBar.tsx:83-86`).
- **Keys.** In the palette, Up and Down move and wrap, Enter opens, Escape
  closes, and IME composition is ignored (`CommandPalette.tsx:125-142`,
  `:153-154`). In the find bar, Enter goes to the next hit and Shift+Enter
  to the one before, in the order of the server, which is newest first
  (`ChatFindBar.tsx:78-81`, `:98-105`).
- **Text keys** in `src/locales/en.json`: `sidebar.noMatch` (2326),
  `chat.find.*` (2963-2971), `commandPalette.searchLabel` and
  `searchPlaceholder` (8396-8397), `palette.*` (9133-9139),
  `search.messages`, `messagesCount`, `failed`, `noMatch`, `otherVersion`
  (9344-9348).

## 6. The tests

Setup (from the `engine-tests` reader):

- Each test file gets a temporary home from `mkdtempSync`. The database is
  a real file `DATA_DIR/messages.db` in it. `closeMessageDb` runs after
  each test (`server/testing/setup.ts:10-12`, `:34-35`).
- The `ensureSearchIndex` tests use `:memory:` (`cjk-search.test.ts:55`).
- Test files run one at a time (`vite.config.ts:66`). None of these files
  is on the CI retry list.

What the tests prove:

| Test | What it proves |
|---|---|
| `cjk-search.test.ts:15-25` | `cjkSearchText` adds marks, gives null with no CJK, and `withoutSearchMarks` gives the original text back. `ftsPhrase("图书馆")` is `"图 书 馆"`. |
| `cjk-search.test.ts:29-49` | Bigrams, a lone Han character kept, a lone kana dropped, long vowel marks kept inside a word. |
| `cjk-search.test.ts:71-92` | A legacy plain index migrates. A word inside a Chinese sentence is found. English still matches. A second run changes nothing. Insert, update and delete stay in step. FTS5 `integrity-check` passes. |
| `cjk-search.test.ts:96-146` | 20 Chinese questions in other words each find their note. One Han character works. A katakana word works. |
| `message-search-unicode.test.ts:16-43` | Case folding for É, Cyrillic, Greek and Ü. The mark stays right when "İ" gets longer in lower case. `%` and `_` are literal. The worker gives the same hits as the synchronous scan. |
| `message-search-worker.test.ts:26-32` | The worker sees committed inserts and deletes with no restart. |
| `message-search-worker.test.ts:34-39` | 8 pending scans, the 9th gets 503, then capacity comes back. |
| `message-search-worker.test.ts:41-50` | `closeMessageSearch` rejects a pending scan with 503. The next scan opens the new database. |
| `message-search-worker.test.ts:52-58` | A missing file gives "Search could not finish" (503), and the file is not created. |
| `message-search-worker.test.ts:60-67` | With a deadline of 1 ms, both waiting requests get 503. |
| `message-search.e2e.test.ts:24-62` | 50 000 rows of about 1 KB, 16 parallel `/api/search` calls. Each gets 200 with no hits or 503 busy. `/api/health` answers 200 while scans wait, and at least one scan ends after it. |
| `message-db.test.ts:191-246` | FTS recall ranks, keeps to the given threads, leaves out activity rows, marks `[term]`, does not throw on raw FTS syntax, and keeps the index in step after update, upsert and delete. CJK with Chinese punctuation works. |
| `message-db.test.ts:350-361` | When the FTS table and triggers are dropped, the next open makes them again and indexes every row. |
| `message-db.test.ts:551-563` | `describeMissingFts5` names Node 24 and the running version. |
| `message-db.test.ts:572-580` | A digest is found but comes after normal text. |
| `store.test.ts:2817-2856` | Deleting a bot removes its memory rows and index entries. `integrity-check` passes. |
| `ChatFindBar.fork.test.ts:38-42` | A hit in a fork focuses the message with no page change. |

- `server/testing/hold-search-result.ts` is a test-only barrier. It holds a
  search result until the test lets it go
  (`hold-search-result.ts:8-21`). `bot-visibility.e2e.test.ts:40` uses it
  to change access during a scan with no timing guess.
- `thread-search-short-terms.e2e.test.ts` tests the short-term rule of
  `reachThreads`. See [`memory.md`](memory.md).

Tests that can fail by chance:

- `message-search-worker.test.ts:60-67` uses the real clock. It expects
  that "A fresh worker cannot import/open SQLite before this short
  deadline" of 1 ms (`:61`).
- `message-search.e2e.test.ts:52-62` needs the queue to reach 8 pending
  scans, else it throws "Fixture never reached the bounded search queue"
  (`:54`). It also needs one scan to end after the health answer (`:62`).
  Both depend on the speed of the machine.
- `hold-search-result.ts:15-18` polls a file each 5 ms with a real deadline
  of 10 s.
- `ChatFindBar.fork.test.ts:38` waits for the real 180 ms timer, with no
  fake timers.
- A Windows CI error `ECONNRESET` came from a seed loop that blocked the
  event loop. The test now yields each 1000 rows
  (`message-search.e2e.test.ts:31-32`).

What no test covers:

- a worker that crashes during a scan (`message-search-worker.ts:46-51`).
- one slow scan that makes the scans behind it time out.
- a crash during the migration of the index.
- a stale `search_text` after a change of the CJK rules.
- the miss of old matches for a restricted viewer.
- a start with no FTS5 (only the text of the error is tested).
- Korean, emoji, and combining marks other than kana marks.
- rank ties and results over the limit.

## 7. Ours compared

What we have now (from the `ours` reader):

- No store yet. No `rusqlite` in `Cargo.toml`, no FTS5 and no search code.
  `bot-core` has only `echo_reply` (`crates/bot-core/src/lib.rs:3-5`).
  `bot-protocol` has `Message { id, role, text }`
  (`crates/bot-protocol/src/message.rs:15-19`).
- The UI `SearchField` filters the mock bots by name only
  (`crates/bot-desktop/ui/src/components/SearchField.tsx:13-27`).
- D14 chooses "SQLite from the first store, with `rusqlite` and its
  `bundled` feature" (`docs/decisions.md:406-407`). D8 (proposed) writes a
  row and its event in one transaction (`decisions.md:161-164`).
- Step 8 of the plan is the SQLite store in `bot-core`
  (`docs/plan/README.md:353`). The plan has no search step.
- `comparison.md:254` maps the search of the person to `rusqlite` and
  `tokio::task::spawn_blocking`. `comparison.md:123` maps recall to FTS5 in
  `bundled`.

| Reference | Ours |
|---|---|
| `server/message-db.ts` (store, upsert, `recallMessages`, `recallMemory`) | `bot-core`, the store module of step 8. Later the `bot-store` crate of D8. |
| `server/cjk-search.ts` (`ensureSearchIndex`, CJK transform, bigrams) | `bot-core`, a `store::search_index` module for the schema and triggers, and a `search::cjk` module for the text rules. |
| `server/message-search-query.ts` (the `LIKE` scan) | `bot-core`, a `search::scan` module. |
| `server/message-search-worker.ts` and `message-search.worker.ts` | `bot-core`, a `search::worker` module with one owned thread (see the note below). |
| `server/routes/threads.ts:515-564` (`/api/search`) | `bot-desktop`, a Tauri command, with the visibility check in `bot-core`. |
| `server/message-db-memory-index.ts`, `server/workspace.ts:199-263` | `bot-core` `memory::index`. memory.md:1511 puts recall in `bot-core` `memory::recall`. |
| `SearchResults.tsx`, `CommandPalette.tsx`, `ChatFindBar.tsx` | `bot-desktop/ui`, the `SearchField` and new components. |

Note on `comparison.md:254`. `spawn_blocking` alone runs each search on
any thread of the tokio blocking pool. That pool has up to 512 threads by
default. It drops two properties of the reference: one serial worker
(`message-search.worker.ts:6`) and the cap of 8 pending searches
(`message-search-worker.ts:27`). To follow the reference, we keep a bound:
one search thread that the store owns, with a queue of 8, or a semaphore
of 1 around `spawn_blocking`. The tokio default of 512 is a fact of tokio,
not of this research. Check it for the version that we use.

Rust facts to check when we build:

- `rusqlite` can register a Rust function for Unicode lower case, like
  `omb_search_lower`. Rust `str::to_lowercase` and JavaScript
  `toLowerCase` can differ for some characters. The `matchSpan` rule then
  needs its own test.
- `rusqlite` has `Connection::get_interrupt_handle`, which stops a running
  statement on that connection. The reference cannot stop one scan. It can
  only end the worker. This is not verified for the version of `rusqlite`
  that we will use.
- `matchStart` counts UTF-16 code units (`responses.ts:113`). Rust strings
  count bytes. The Tauri wire type must say which unit it uses.

## 8. Where we can be better

Section 5 of [`changelog.md`](../changelog.md) names no search release.
The problems below are of the same classes as rows of that section, with
the evidence in the code and the commits of the reference. These classes
of changelog.md section 5 show here:

- **One slow or stuck part blocks the others** (changelog.md:172, releases
  v0.1.114, v0.1.136, v0.1.153, v0.1.177, v0.1.178). Here: the shared
  timeout of the worker, the main-thread recall, the main-thread migration,
  and the post-tag commit `ccd37f116`.
- **State lost at a restart** (changelog.md:164, releases v0.1.24, v0.1.74,
  v0.1.107, v0.1.165, v0.1.180). Here: the crash gap of the migration, and
  `search_text` that never changes after a rule change.
- **Memory and the number of processes** (changelog.md:168). Here: one
  worker thread and one connection for each search. The reference keeps
  this small. We must not lose the bound (P528).
- **Tests that fail by chance** (changelog.md:166, releases v0.1.77,
  v0.1.99, v0.1.133). Here: the 1 ms deadline and the e2e test that needs
  a fast machine.

**P525. A deadline for each scan, and a timeout stops only that scan.**
Problem in the reference: one slow search makes every waiting search fail.
The timer starts when the request is queued, and a timeout ends the worker
and rejects all pending requests
(`server/message-search-worker.ts:57`, `:64-73`). With 8 searches in the
queue, a slow first scan can give 503 to all 8. This is the problem "one
slow or stuck part blocks the others" of changelog.md section 5 (releases
v0.1.114, v0.1.136, v0.1.153, v0.1.177, v0.1.178). Proposal: start the deadline when the scan starts. Stop only
that statement with an interrupt handle, and keep the thread and the queue.

**P526. Create the index in the first schema, with a version, and migrate it
in one transaction.** Problem in the reference: a crash between the
`CREATE` of the FTS table and its `rebuild` leaves old messages out of
search with no error, because the next start sees the table as current
(`server/cjk-search.ts:64`, `:80-96`). Also, a change of the CJK rules never
updates old rows, because the fill touches only `search_text IS NULL`
(`cjk-search.ts:70`). This is the problem "state lost at a restart" of
changelog.md section 5 (releases v0.1.24, v0.1.74, v0.1.107, v0.1.165,
v0.1.180). Proposal: step 8
creates `search_text`, the FTS table and the triggers in its first schema,
so we need no migration at the start. Keep a version number of the index
rules (for example in `PRAGMA user_version` or a meta row). A change of
version runs the drop, the fill of all rows, the create and the rebuild in
one transaction.

**P527. Run the recall and the memory sync of the bot off the main thread.**
Problem in the reference: after a restart, the first memory search of each
bot reads and indexes every memory file again, on the main thread, before
it answers (`server/workspace.ts:233`, `:249`, `:260-263`). `recallMessages`
and `recallMemory` also run synchronously on the main thread with no time
limit (`server/message-db.ts:826`, `:970`). Nobody measured the latency of
FTS5 recall (`persistence-performance.md:86-87`). The measured numbers are
for the `LIKE` scan only: 70 to 107 ms of maximum event-loop delay when it
ran on the main thread (`persistence-performance.md:47-74`). Commit
`ccd37f116`, after v0.1.182, shows a different main-thread scan that
stopped a hosted home for minutes. This is the problem "one slow or stuck
part blocks the others" of changelog.md section 5 (releases v0.1.114,
v0.1.136, v0.1.153, v0.1.177, v0.1.178). Proposal: the FTS queries and the
memory sync use the same search thread as the scan (P528), with the same
deadline.

**P528. Follow the reference: one search thread with a queue of 8.** This is
not "better". It warns that our `comparison.md:254` can lose a bound of the
reference. Problem that we must not add: plain `spawn_blocking` lets many
searches run at the same time on the blocking pool. The reference has one
serial worker and 8 pending searches at most
(`message-search.worker.ts:6`, `message-search-worker.ts:27`). Unbounded
threads would be the problem "memory and the number of processes" of
changelog.md section 5 (releases v0.1.110, v0.1.118, v0.1.165, v0.1.176,
v0.1.180).

**P529. Tests with a fake clock and a barrier, not the speed of the
machine.** Problem in the reference: the worker test expects that a worker
cannot start in 1 ms (`server/message-search-worker.test.ts:60-62`). The
e2e test needs 8 scans to wait at the same time and one scan to end after
the health check (`server/message-search.e2e.test.ts:52-62`). This is the
problem "tests that fail by chance" of changelog.md section 5 (releases
v0.1.77, v0.1.99, v0.1.133). Proposal: the deadline uses our `Clock` trait
(changelog.md:223). A test holds the scan with a barrier, as
`server/testing/hold-search-result.ts` does, and then checks the queue and
the health answer.

**P530. Filter the threads that the viewer can see in the SQL, before the
limit.** Problem in the reference: the route asks for the newest
`limit * 10` matches of all threads and filters them after the scan
(`server/routes/threads.ts:529`, `:544-546`). A viewer with limited access
can get no hits when many newer matches are in hidden threads, and the
sidebar then shows no "+" (`SearchResults.tsx:55`). Judgment call: no
release of changelog.md section 5 names this. Proposal: pass the visible
thread ids to the scan, or a scope that the store resolves. Keep the second
access check after the scan (`threads.ts:530-543`), which follows the
reference.

**P531. Stop a search that nobody waits for.** Problem in the reference: the
palette and the find bar send a search after each pause of 150 or 180 ms,
with no minimum length (`CommandPalette.tsx:70`, `:80`,
`ChatFindBar.tsx:29`, `:51`). No caller aborts its request, and the route
does not watch for a closed connection (`threads.ts:529`). Each search runs
to its end and holds one of the 8 places. So fast typing can give "Search
is busy" to another view. Class: one slow part blocks the others, but no
release names it, so it is a judgment call. Proposal: the UI cancels the
old request. The command cancels the queued scan, or interrupts it when it
runs.

**P532. One rule for the words of the person and of the bot, or a clear
difference.** Problem in the reference: the person searches a substring
with `LIKE` (`message-search-query.ts:33-44`), and the bot searches tokens
with FTS5 (`message-db.ts:821-835`). The plan says the bot uses
`/api/search` (`2026-08-31-06-memory-review-loop.md:161-162`), but it does
not (`server/index.ts:13313`, `:13343`). "audi" finds "audit" for the
person but not for the bot in mode "all". Judgment call: no release names
it. Options for the author:

- a. Follow the reference: two engines, and our documents say which one
  each caller uses.
- b. Use FTS5 for the person too, with the `trigram` tokenizer of SQLite,
  which can serve substring search. This removes the full-table scan
  (65 to 85 ms for 50 000 rows, `persistence-performance.md:53`). Whether
  `trigram` folds case for all languages like `toLowerCase` was not
  checked.

**P533. A content check for the memory index.** Problem in the reference: an
index error after a memory write is ignored (`server/workspace.ts:207-214`).
A change with the same size and the same whole-number mtime is not seen
until the date changes (`workspace.ts:249`). The bot then recalls old
memory text. Class: state lost at a restart, but no release names it, so
it is a judgment call. Proposal: keep a hash of the indexed text, and
compare it in the sync. Write the index row in the same transaction as the
memory row when the memory moves into the store.

**P534. Ship the search corrections of the reference from the first
version.** Problem in the reference: the search engine had these faults in
its releases, and each one was corrected later. Each one becomes a "Done
when" test of our search step:

| Fault in the reference | Correction | First release with it | Our test |
|---|---|---|---|
| `INSERT OR REPLACE` removed a row without the delete trigger, so the index pointed at a dead row | `fc53f0524`, upsert (`message-db.ts:135-139`) | v0.1.55 (first tag), no release note found | An upsert of the same id keeps one index entry. FTS5 `integrity-check` passes. |
| Index rows stayed after a bot was deleted | `2f3d74dbd` | v0.1.102 (first tag), no release note found | Deleting a bot removes its rows and index entries (`store.test.ts:2817-2856`). |
| A Han or kana run was one token, so a word inside a sentence never matched. 0 of 20 Chinese notes were recalled | `949cabedd`, `search_text` (`cjk-search.ts:3-5`, `:25-27`) | v0.1.153 (first tag), no release note found | 20 Chinese questions find their notes (`cjk-search.test.ts:96-146`). |
| A katakana word with a long vowel mark gave no query terms | `799b5cdba` (`cjk-search.ts:6-7`) | 0.1.154 (`releases.json:1238`) | A katakana word with `ー` is found. |
| SQLite `lower()` folds only ASCII, so search ignored case only for ASCII letters | `ab24b7529` (`message-search-query.ts:35-36`) | 0.1.154 (`releases.json:1239`) | Case folding for É, Cyrillic, Greek and Ü, and a correct mark for "İ" (`message-search-unicode.test.ts:16-43`). |
| A one-character word was dropped from the query | `33f06c6bc` | 0.1.180 (`releases.json:240`) | See [`memory.md`](memory.md) (memory.md:160-171). |
| A synchronous `LIKE` scan held the event loop for 70 to 107 ms | `4c02bf748`, the worker | v0.1.153 or later, not checked | The health check answers while 8 scans wait. |

The "first tag" is the oldest `v` tag that contains the commit
(`git tag --contains`). `releases.json` starts at 0.1.153
(`announcements/releases.json:1249`), so older releases have no note in it.
This is the aim of MEMORY.md, "avoid those mistakes from the releases". It
answers no row of changelog.md section 5 directly, because section 5 has
no search row.

## 9. Not verified

- The FTS5 documentation of SQLite may warn that a `'delete'` command with
  values that are not in an external-content index can corrupt the index.
  If this is true, the crash gap of section 3.1 can also corrupt the index
  when an old row changes later, not only leave rows out. This research
  did not check the SQLite documentation.
- The first release of commit `4c02bf748` (the worker).

- The crash gap of the migration (section 3.1, item 9) comes from the order
  of the code. Nobody reproduced it.
- How the route table turns a thrown `SearchUnavailable` or a missing FTS5
  error into an HTTP response.
- The default of `remove_diacritics` for `unicode61` in the SQLite of Node,
  and its limit on the number of SQL variables (the `IN` list of
  `message-db.ts:824`).
- Whether the quoting in `ftsQuery` and `ftsPhrase` can still make an FTS5
  syntax error. The recall functions do not catch one.
- Whether the 60 and 90 code-unit cut of a snippet can split a surrogate
  pair (`message-search-query.ts:60-63`).
- What `landOnSearchHit` does (`src/lib/focus-message.ts:35`).
- How backups copy `messages.db` (`server/workspace-backup-databases.ts`
  was not read), and whether the FTS shadow tables are copied as they are.
- Whether the "faster index for the Bot Library" of release 0.1.178
  (`announcements/releases.json:332`) is this index.
- The size of the index, the memory of the worker and the latency of FTS5.
  The reference measured none of them.
- Whether the `bundled` feature of `rusqlite` turns on FTS5 and `trigram`.
  Our `comparison.md:123` says so for FTS5. Nobody checked the build
  script of `libsqlite3-sys`.
- The tokio blocking pool default of 512 threads, for the version that we
  will use.
- The parts of `server/workspace.ts` and `server/workspace-backup.ts`
  outside the ranges of section 2.
