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
- **Updated on 2026-11-28 to reference commit `e1cc6a290`** (after v0.1.186,
  tag commit `70eb44c1a`). The reference repaired the speed part of the
  problem of P304, not its restart part. It moved further from the "no disk
  path" point of P310. It repaired no other "Problem in the reference" of
  this file. New proposals: P767 to P771. A line number at `e1cc6a290` says
  so. The other line numbers are at `96ff84455`.
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
  - At `e1cc6a290` the reference added three rules to the store. P767 lists
    them. `saveFile` is now at `server/attachments.ts:467-570`.
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
  - **Problem in the reference:** The attach route adds the chat line with
    no check for a repeated call. So a retried `attach_file` call posts the
    same file two times (`server/index.ts:13021-13036`;
    `server/bot-attachment.ts:257-277`). The release problem: "The same work
    done or delivered two times, or lost" (v0.1.83, v0.1.150).
  - Why: the reference adds the line with no duplicate check, so a retried
    call posts two lines ("the same work done two times").
  - Source: `server/bot-attachment.ts:111-284`; `server/index.ts:1603`,
    `:10938-10965`, `:13031-13067`; `server/message-file.ts:384-453`
    (`:384-480` at `e1cc6a290`, after a refactor with the same behaviour).
  - At `e1cc6a290`: not repaired. No commit of the range changes the attach
    route or `attachForTurn`.
- **P304 (decision, step 8). A table of attachment references.**
  `attachment_refs(message_id, attachment_id)` is written in the same
  transaction as the message. The start-up sweep can then remove files that
  no message uses.
  - Why: it replaces a text scan of all messages and an in-memory list of
    names to delete, which a restart loses. Today a file that no message uses
    stays until the person clicks Clear.
  - Source: `server/message-db.ts:687-691`;
    `server/host/delete-leftovers.ts:221-274`; `server/attachments.ts:45`.
  - **Changed at `e1cc6a290`.** The reference repaired the speed of the text
    scan, not the restart:
    - The cleanup after a delete now checks all names in one pass over the
      messages, in slices that give the event loop back (`ccd37f116`, in
      v0.1.186; `server/attachment-references.ts:152-242`;
      `server/host/delete-leftovers.ts:263-299`). Before, one scan for each
      name on the main thread held a large Cloud "for minutes", and the home
      was restarted (`server/attachment-references.ts:1-3`).
    - `threadsReferencing` answers a stored upload name from an index in
      memory (`87246500e`, after the tag;
      `server/message-db.ts:688-690`). The index needs one full synchronous
      read of all rows on its first query
      (`server/message-db-attachment-names.ts:94-112`), and a restart loses
      it.
    - Not repaired: the names to delete are still only in memory
      (`server/host/delete-leftovers.ts:223-225`), "a restart replays
      nothing" (`server/attachment-references.ts:7-8`), and a file that
      nothing uses still stays (`server/attachments.ts:45`).
    - So the reason "a text scan of all messages" is now weaker. The reason
      "an in-memory list that a restart loses" stays. A new reason is
      "One slow or stuck part blocks all the others" (v0.1.186): with the
      table, the question is one indexed query, and it needs no pass and no
      index in memory.
    - A test to copy: the reference checks that its new pass "removes
      exactly what the old check removed"
      (`server/host/delete-leftovers.many-uploads.test.ts:70`). Our test
      can check that the table and a scan of the messages agree.
- **P305 (decision). Do not port the grant "saved this turn".**
  - Why: the grant trusts `mtime`, which a bot with a shell can set.
  - Source: `server/message-file.ts:455-488`; `server/index.ts:1593`, `:1804`.
  - A new reason at `e1cc6a290`: the grant does not use the new guard of the
    owner open (P768). It refuses only hidden paths and the data folder
    (`server/message-file.ts:552-555` at `e1cc6a290`). So a bot can attach a
    key-like file that is not hidden, such as `~/Downloads/server.pem`,
    which the owner open refuses (`server/outside-file-guard.ts:21` at
    `e1cc6a290`).
- **P306 (decision, refines D10). One read path for files.** The desktop
  shell serves files through a custom protocol (no HTTP server). One read
  path, scoped to `(thread, message, attachment)`, for all kinds, streamed in
  ranges of at most 8 MB.
  - **Problem in the reference:** An upload that no conversation and no
    avatar uses goes to each viewer who knows its name, so a member's unsent
    file is open to the other members. `GET /api/attachments` reads the
    whole file into memory for each request
    (`server/bot-visibility.ts:322-336`; `server/routes/threads.ts:485-488`;
    `server/attachments.ts:742-747`). The release problem: "A secret or an
    access right in the wrong place" (v0.1.125) and "Memory and the number
    of processes" (v0.1.118).
  - Why: better than the reference. It serves an upload that no conversation
    and no avatar uses to anyone who knows its name, and
    `GET /api/attachments` reads the whole file into memory.
  - Source: `server/routes/threads.ts:200-364`, `:476-513`;
    `server/message-media-links.ts:8-24`; `server/bot-visibility.ts:322-337`;
    `server/attachments.ts:741-748`.
  - At `e1cc6a290`: not repaired. The lines moved: the message file route is
    `server/routes/threads.ts:200-375`, `GET /api/attachments/<name>` is
    `:487-524`, and `readAttachment` is `server/attachments.ts:761-770`,
    with the whole read at `:766`. The visibility gate has the same rule. It
    now gets "which conversations name this file" from an index in memory
    (`server/bot-visibility.ts:323-332`; `server/message-db.ts:688-690`).
  - New at `e1cc6a290` (in v0.1.186): the message file route has a second
    kind of read, the owner open of a linked file outside every root
    (`server/routes/threads.ts:284`, `:305-312`). If we port it (P768), it
    goes inside the one read path, as a typed refusal with a hint, for
    example `OutsideWorkspace { can_open: bool }`.
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
  - **Problem in the reference:** Clear in Settings removes each stored file
    older than 10 minutes that is not in a short kept set. Files of messages
    and drafts are not in that set, so the messages and drafts lose their
    files (`server/attachments.ts:248-264`; `server/index.ts:11948`). The
    release problem: "The same work done or delivered two times, or lost"
    (v0.1.95, v0.1.178).
  - Why: Clear in the reference removes every stored file older than
    10 minutes that is not in a kept set, also files that messages and drafts
    still show.
  - Source: `src/lib/composer-attachments.ts:87-88`, `:427-438`, `:826-841`;
    `server/index.ts:11958`; `server/attachments.ts:247-263`;
    `src/components/AttachmentGallery.tsx:250-442`.
  - At `e1cc6a290`: the "Problem in the reference" is not repaired.
    `clearAttachments` did not change (`server/attachments.ts:265-293` at
    `e1cc6a290`).
  - **Changed at `e1cc6a290`: the reference moved further from "no fallback
    to a raw disk path".** After the tag (`0029b25d8`, in no release yet),
    the desktop app on its own server attaches each file over the upload
    limits by its path on the disk, with no upload and no count or size
    limit (`src/lib/composer-attachments.ts:804-817` at `e1cc6a290`). A
    paired window, a browser and a phone get no path
    (`src/components/ComposerAttachments.tsx:23-26`). The old fallback is
    now at `src/lib/composer-attachments.ts:851-858`. The author decides:
    - keep "no disk path" (the bot never gets a path outside its folder
      from the composer, and the chat can always show the file from the
      store); or
    - follow the reference on our desktop, where the shell and the core are
      on the same computer (D10). Then the bot needs a read grant for that
      path, and the chat cannot show the file from the store.
- **P311 (plan, step 9, refines P41). A test of paths on Windows.** A path in
  another case, a junction, and an unlink of a busy file.
  - Why: the reference compares paths case-sensitively, and `O_NOFOLLOW` is 0
    on Windows, so its check of a link does nothing there.
  - Source: `server/attachments.ts:213-217`; `server/message-file.ts:419-421`.
  - At `e1cc6a290`: not repaired. The lines moved to
    `server/attachments.ts:211-222`, `:232` and
    `server/message-file.ts:394-396`. One change: since `d93d653f0` (after
    the tag), the case-sensitive compare of the folder decides whether a
    delete unlinks the file at all (`server/attachments.ts:232`). Add to
    the test list: a path to the store in another case is not unlinked.
    The new guard of the owner open ignores case on macOS and Windows
    (`server/outside-file-guard.ts:30-33`, `:62`), which is the rule that
    P311 asks for.
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

## New proposals from the update to `e1cc6a290` (v0.1.186)

The main session gives these proposals their P-numbers. The numbers go on
from P765 and P766 of [`safety-floor.md`](safety-floor.md). Line numbers are
at `e1cc6a290`.

- **P767 (plan, step 8, refines P301). Three rules of the store from after
  v0.1.186.** Follow the reference:
  1. A delete unlinks only a file of the store. The reference checks
     `resolve(dirname(path)) === resolve(ATTACHMENTS_DIR)` before each
     unlink (`server/attachments.ts:231-236`, `d93d653f0`). If P302 chooses
     an `AttachmentId`, the delete takes the id and only the store turns it
     into a path, so a free path cannot reach the delete. Else we check the
     folder before each unlink, as the reference does.
  2. A name that comes from another computer must be a bare file name: not
     empty, not `.` or `..`, no `/` or `\`, and equal to its own base name.
     Else the store refuses it (`server/attachments.ts:576-579`,
     `aea459a1b`).
  3. If we port originals (section 3.7 of the research file), the step
     "make room, then copy" runs one at a time for each folder. The
     reference uses a queue of promises for each folder
     (`server/attachment-originals.ts:21`, `:54-81`, `5e4bd5f2f`). In Rust:
     one `tokio::sync::Mutex` for each folder, or one task that owns the
     folder.
  - Why: the reference added these rules after the tag, in no release
    yet. Without rule 3, two uploads at the same time can take the folder
    over its total (test `server/attachment-originals.test.ts:74`). Rules 1
    and 2 are second guards: no caller of the reference passes a bad path
    today. No theme of section 5 of `changelog.md` matches rule 3. Plan
    table row: none.
  - Source: `server/attachments.ts:211-236`, `:572-626`;
    `server/attachment-originals.ts:16-81`; tests
    `server/attachments.test.ts:359`, `:500`,
    `server/attachment-originals.test.ts:74`, `:84`.
- **P768 (decision, step 7 or later, refines D10 and P306). The owner opens
  a linked file outside the workspace.** v0.1.186 lets the owner or an
  admin of a self-hosted server open one file that a bot links and that is
  outside every root. Options:
  - a. Port it as the reference does: two requests, a deny list (a part
    that starts with `.`, names of keys and credentials, the Keychain,
    browser profiles, the credential stores of Windows), the data folder
    refused, the guard on the link as written and on the realpath before
    and after the open, and the dev/ino check
    (`server/outside-file-guard.ts:21-70`;
    `server/message-file.ts:484-531`; `server/routes/threads.ts:284`,
    `:305-312`).
  - b. Better than the reference: the person picks the file in a native
    file dialog of the shell, which opens at the linked path. The choice of
    the person is the grant, and the path of the bot is only a hint. We
    have no HTTP server (D10), so the dialog is a command of the shell.
  - c. Port option a, and make the confirmation a rule of the core: the
    first answer gives a grant id for one use, and the second request must
    send it.
  - d. Do not port it. A link outside the workspace stays a path with
    "Show in folder".
  - **Problem in the reference:** the deny list of v0.1.186 missed the key
    formats `.p8`, `.kdb`, `.ppk`, `.jks`, `.keystore`, `.asc` and `.gpg`,
    so the owner could open such a key file in v0.1.186. `b94d19216` added
    them the next day (`server/outside-file-guard.ts:21`). Linux has no
    list of stores (`:52`). The server keeps no state between the two
    requests, so the confirmation is a step of the UI only
    (`server/routes/threads.ts:306`). The release problem: "A secret or an
    access right in the wrong place" (v0.1.186).
  - Why: the bot chooses the path, and the server reads it with its own
    rights. The reference says that "a boxed or prompt-injected bot must not
    be able to hand the owner a secret it cannot read itself"
    (`server/outside-file-guard.ts:1-3`). An allow list (option b) cannot
    miss a format. Plan table row: "A secret or an access right in the
    wrong place".
  - Source: `server/outside-file-guard.ts:1-70`;
    `server/message-file.ts:435-441`, `:484-531`;
    `server/routes/threads.ts:284`, `:298-312`; `server/index.ts:11963`;
    `server/request-auth.ts:69-71`;
    `src/components/OutsideWorkspacePreview.tsx:7-28`; tests
    `server/outside-file-guard.test.ts:13-56`,
    `server/routes/threads-file-handle.test.ts:144`.
- **P769 (plan, step 7, `crates/bot-desktop/ui`). The open file preview
  stays with its conversation.** Follow the reference of v0.1.186: a map
  `thread id → preview` in the memory of the window, not stored. The map
  keeps the ids and the path, not the bytes. On a return, the preview comes
  back and does not take the focus. It is forgotten on close, when another
  panel opens on that side, when it is shown again, and when a new file
  opens in that conversation. The content is read again on a return, so a
  missing file shows the read error with Retry.
  - Better than the reference: forget the entry when its conversation is
    deleted, and put a limit on the size of the map.
  - **Problem in the reference:** the map keeps the preview of a deleted
    conversation until the window reloads, and it has no size limit. No
    other code uses the map (`src/lib/file-preview.ts:32`). The release
    problem: none; this is a judgment call.
  - Note: with P302 and P306, the kept preview names the stored copy by its
    id. The reference falls back to a delivered copy with the same file
    name (`server/routes/threads.ts:298-304`), so a kept preview of a moved
    file can come back as another file of the same name. A kept preview of
    a file that Clear removed fails on a return, so the fix of P310 also
    protects it.
  - Source: `src/lib/file-preview.ts:9`, `:31-58`;
    `src/components/FilePreviewPanel.tsx:28-34`, `:44-45`; tests
    `src/components/FilePreviewPanel.dom.test.ts:102-160`.
- **P770 (plan, step 7, with P310). A linked text file opens as text.**
  Follow the reference of v0.1.186: a link in a reply to a `.txt`, `.text`
  or `.log` file opens a plain text preview, with the read limit, the
  `windows-1252` fallback and the "not text" error of the Markdown preview.
  On the desktop, a file outside the workspace keeps "Show in folder".
  - The open choice: the reference previews only a linked text file. An
    attached `.txt` still saves a copy, because only the link passes the
    flag (`src/components/ChatMarkdown.tsx:369-370`, against
    `src/components/AttachmentPreview.tsx:874`). The author decides whether
    an attached text file also previews. No release problem matches it.
  - Source: `src/components/HtmlFilePreview.tsx:24-26`, `:60-67`, `:93`;
    `src/components/MarkdownFilePreview.tsx:39-77`; tests
    `src/components/FilePreviewPanel.dom.test.ts:219-248`.
- **P771 (plan, step 7). The wheel zooms the image in the lightbox.** Follow
  the reference of after the tag (no release yet): the scale is
  `scale * exp(-deltaY / 200)`, at most 16, and at 1 or less the image fits
  again. The point under the pointer stays in place. A wheel line is 16 px
  and a page is the height of the stage. The zoom goes in only over the
  picture. Every wheel event on the overlay is stopped, so the chat behind
  does not scroll. The zoom resets when the image changes.
  - Better than the reference: also a zoom by the keyboard (`+`, `-`, `0`)
    and a pan by a drag.
  - **Problem in the reference:** only the wheel zooms, and the stage clips
    a zoomed image (`src/components/AttachmentPreview.tsx:568`;
    `src/components/preview-zoom.ts:29-47`). A person with only a keyboard
    or a touch screen cannot zoom, and nobody can move to the clipped part.
    The release problem: none; this is a judgment call.
  - Source: `src/components/preview-zoom.ts:3-47`;
    `src/components/AttachmentPreview.tsx:447-448`, `:513`, `:568`,
    `:591-592`; tests `src/components/preview-zoom.test.ts`,
    `src/components/AttachmentPreview.test.ts:375`.
