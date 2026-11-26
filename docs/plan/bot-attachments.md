# Plan: Bot attachments

The proposals from the research file
[`../research/features/bot-attachments.md`](../research/features/bot-attachments.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 7, 8, 9, 12, 13 and 14, and a gap for `vm_exec` (P308).
- **State:** all open.
- **The main finding:** a bot sends a file with the tool `attach_file`. The
  server copies the file into one flat private store, `<data>/attachments`,
  and adds the chat line at once, during the turn. The chat never reads the
  folder of the bot again. The store never removes a file to make room, and
  the start-up sweep removes only old partial files
  (`server/index.ts:13041-13047`; `server/attachments.ts:21-37`, `:45`).

## Proposals

- **P301 (plan, step 8 or a new step before `attach_file`). A step owns the
  attachment store.** Add `bot-core::attachments`. Follow the reference: one
  flat folder `<data>/attachments`, a `wx` partial file with mode `0600` and
  then a hard link (never a rename over a name), a ceiling of 512 MB that
  gives 507 and never evicts, and a start-up sweep of partial files older
  than 1 hour only.
  - Why: no step owns the store now, and `attach_file` (P303) needs it.
  - Source: `server/attachments.ts:21-37`, `:142-163`, `:451-555`;
    `server/host/start-upkeep.ts:86-94`.
- **P302 (decision, with D17 and P80). A message holds its attachments.**
  Add `attachments: Vec<Attachment>` (kinds image, file, audio) to our
  `Message`, with `#[serde(default, skip_serializing_if = "Vec::is_empty")]`,
  so the JSON of step 2 stays valid. The open choice: the absolute `path` of
  the reference, or an `AttachmentId` that only the store resolves.
  - Why: our `Message` has only an id, a role and text.
  - Source: `packages/phone-protocol/src/wire.ts:450-459`; ours
    `crates/bot-protocol/src/message.rs:15-19`.
- **P303 (plan, step 12, after `list_bots`; refines P194 and P201). The tool
  `attach_file`.** Follow the reference: the roots (workspace, pinned and
  configured folder, inbox, files of this conversation); the store is never a
  source; 10 files for each turn, with the slot reserved before the await;
  the chat line added at once; typed refusals for 400, 403, 404, 409, 413,
  415, 429 and 507. Better than the reference: the key `(turn, tool call id)`
  makes a retried call return the first result, so one call posts one line.
  - Why: the reference adds the line with no duplicate check, so a retried
    call posts two lines ("the same work done two times").
  - Source: `server/bot-attachment.ts:111-284`; `server/index.ts:1603`,
    `:10938-10965`, `:13031-13067`; `server/message-file.ts:384-453`.
- **P304 (decision, step 8). A table of attachment references.**
  `attachment_refs(message_id, attachment_id)` is written in the same
  transaction as the message. The start-up sweep can then remove files that
  no message uses.
  - Why: it replaces a text scan of all messages and an in-memory list of
    names to delete, which a restart loses. Today a file that no message uses
    stays until the person clicks Clear.
  - Source: `server/message-db.ts:687-691`;
    `server/host/delete-leftovers.ts:221-274`; `server/attachments.ts:45`.
- **P305 (decision). Do not port the grant "saved this turn".**
  - Why: the grant trusts `mtime`, which a bot with a shell can set.
  - Source: `server/message-file.ts:455-488`; `server/index.ts:1593`, `:1804`.
- **P306 (decision, refines D10). One read path for files.** The desktop
  shell serves files through a custom protocol (no HTTP server). One read
  path, scoped to `(thread, message, attachment)`, for all kinds, streamed in
  ranges of at most 8 MB.
  - Why: better than the reference. It serves an upload that no conversation
    and no avatar uses to anyone who knows its name, and
    `GET /api/attachments` reads the whole file into memory.
  - Source: `server/routes/threads.ts:200-364`, `:476-513`;
    `server/message-media-links.ts:8-24`; `server/bot-visibility.ts:322-337`;
    `server/attachments.ts:741-748`.
- **P307 (plan, step 14, with P219 and P225). Files in a hand-off.** Follow
  the reference: 5 files and 100 MB in one call, 20 files and 200 MB for one
  assignment, 100 files and 500 MB in one UTC day; stored names made by an
  HMAC of the bytes; copies in the inbox of the receiver; files returned with
  the result; 30 days and 2,000 batches.
  - Why: one bot gives work to another in step 14, and the work can need
    files.
  - Source: `server/host/handoff-files.ts:29-43`, `:162-355`;
    `server/bot-attachment.ts:78-103`.
- **P308 (gap, refines P203). `vm_exec` has no step.** We have no Local VM.
  Record its limits for later: 60 s by default, 1 to 300 s, a command of
  20,000 characters at most, each output stream cut to 20,000 characters,
  `timeout -k 5` inside the container.
  - Why: the limits are known now, and P203 gives each tool a deadline.
  - Source: `server/container-computer.ts:1021-1079`;
    `server/drivers/agents-catalog.ts:304-317`; `server/vps-exec.ts:11-32`.
- **P309 (plan, step 8 or 13). Parked files are rows of the turn.** A file
  that a turn makes while it runs (a generated image, a voice note) is
  stored at once, not held in memory.
  - Why: the reference keeps them in memory until the turn ends, so a crash
    loses them ("state lost at a restart").
  - Source: `server/index.ts:2268`, `:6378-6385`;
    `server/host/turn-attachments.ts:9-80`.
- **P310 (plan, step 7 or a gap). The gallery, the players and the
  composer.** Keep one `uploadId` for each file across a retry. Better than
  the reference: no fallback to a raw disk path, and Clear keeps the files of
  drafts.
  - Why: Clear in the reference removes every stored file older than
    10 minutes that is not in a kept set, also files that messages and drafts
    still show.
  - Source: `src/lib/composer-attachments.ts:87-88`, `:427-438`, `:826-841`;
    `server/index.ts:11958`; `server/attachments.ts:247-263`;
    `src/components/AttachmentGallery.tsx:250-442`.
- **P311 (plan, step 9, refines P41). A test of paths on Windows.** A path in
  another case, a junction, and an unlink of a busy file.
  - Why: the reference compares paths case-sensitively, and `O_NOFOLLOW` is 0
    on Windows, so its check of a link does nothing there.
  - Source: `server/attachments.ts:213-217`; `server/message-file.ts:419-421`.
- **P312 (plan, step 12, with P197). One module of limits.** The tool text
  reads the limits from it.
  - Why: the reference tool text has a fixed "10 MB", and the code has 10 MB
    for an image and 100 MB for other files.
  - Source: `server/drivers/agents-catalog.ts:321`;
    `packages/phone-protocol/src/upload-limits.ts:1-7`.
- **P313 (plan). New rows in "The problems of the reference, and the
  proposals" of [`README.md`](README.md).** The same work done two times, or
  lost: P303, P304. State lost at a restart: P304, P309. A secret in the
  wrong place: P305, P306, P310. Process control on Windows: P311. Memory and
  the number of processes: P306.
  - Why: the table links each problem to the proposals that answer it.
  - Source: `docs/research/changelog.md` section 5.
