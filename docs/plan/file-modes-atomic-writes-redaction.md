# Plan: File modes, atomic writes and redaction

The proposals from the research file
[`../research/features/file-modes-atomic-writes-redaction.md`](../research/features/file-modes-atomic-writes-redaction.md).
The steps, the pull requests and the order are in
[`README.md`](README.md). The author decides each proposal. Then it
becomes a decision, a pull request or a choice, and its text leaves this
file.

- **Steps:** 2, 6, 7.
- **State:** open. No proposal is decided.

## Proposals

- **P4 (step 2). Who sent a message.** A field `author` on `Message`: a person, a bot
  or the system. This is not a third role, so D18 stays.
  - Why: the reference decides redaction with `role !== "bot"`, so text from
    another bot that is stored as `user` is not redacted. The reference added
    "who sent it" in v0.1.140, on day 84.
  - Source: `file-modes-atomic-writes-redaction.md` 8.9. `changelog.md`
    section 7.
  - Option a: now, in a new PR 2.6. Option b: at step 14. Recommendation: b.
    Part 1 has one person and one bot, so `user` always means the person.

- **P18 (step 6). One private write path.** `DataDir` is the only type that gives a
  path in the data folder. Its only write is `write_private(path, bytes)`:
  atomic, mode `0o600` on Unix, no mode parameter, and a sync of the parent
  folder after the rename. The folder is `0o700`, and each start sets the
  mode again. The process umask is `0o077`, so the SQLite `-wal` and `-shm`
  files are private.
  - Why: the reference forgets the mode in 18 of 209 calls and has more than
    40 copies of the atomic write.
  - Source: `file-modes-atomic-writes-redaction.md` 8.1 to 8.5.
    `electron/main.mjs:396-397`.
  - Changes: PR 6.1, PR 6.3.

- **P24 (step 6). The redaction rules.** Copy the high-precision key shapes and their
  positive and negative tests. One marker, `[redacted]`. No minimum length
  for a known value. The reference skips keys shorter than 8 characters.
  - Source: `file-modes-atomic-writes-redaction.md` 8.11, 8.12.
    `server/redact.test.ts:136-336`. `write-only-secrets.md` 8.9.
    `server/drivers/openai-chat.ts:526`.
  - Changes: PR 6.4.

- **P25 (step 7). Where the redaction runs.** Three research files disagree.
  - Option a: in each driver, before the event leaves `bot-engine`
    (`chat-streaming.md` 8.10).
  - Option b: one time in `bot-core`, before the event gets to the window,
    for all drivers (`event-bus-fold.md` 8.9).
  - Option c: at the three boundaries of `bot-core`: the store, the log (a
    `tracing` layer) and the Tauri events
    (`file-modes-atomic-writes-redaction.md` 8.8).
  - The reference redacts in the driver and again in the window, and the
    server does not redact deltas (`chat.ts:643-657`,
    `public-reply.ts:1-3`, `live-reply.ts:182-186`).
  - The held tail (text that can be the start of a secret) stays in the same
    place as the redaction (`file-modes-atomic-writes-redaction.md` 8.13).
  - Recommendation: c. It includes b, and a driver that does not redact
    cannot leak a secret. Provider error text goes through the same function
    (`write-only-secrets.md` 8.9).
  - Changes: a new decision. PR 7.2, PR 7.4, and a log PR.
