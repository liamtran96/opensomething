# Plan: Secrets are write-only

The proposals from the research file
[`../research/features/write-only-secrets.md`](../research/features/write-only-secrets.md).
The steps, the pull requests and the order are in
[`README.md`](README.md). The author decides each proposal. Then it
becomes a decision, a pull request or a choice, and its text leaves this
file.

- **Steps:** 6, 7, 9.
- **State:** open. No proposal is decided.

## Proposals

- **P19 (step 6). The API key is in the keychain only.** The `keyring` crate. The
  settings file has no key, so a backup or a copy has no key. Record Windows
  as a decision: the Credential Manager holds the key, and a file mode has no
  effect there. Check the license of `keyring` first.
  - Why: the reference keeps keys in three places, and a removed key comes
    back at the next start.
  - Source: `write-only-secrets.md` 8.3, 8.4.
    `file-modes-atomic-writes-redaction.md` 8.6, 8.7.
    `electron/workspace-credentials-save.node-test.mjs:1-5`.
  - Changes: answers the choice of the key. A new decision.

- **P20 (step 6). A secret type that cannot leave.** `Secret` (or
  `secrecy::SecretString`) has no `Serialize` and no readable `Debug`. Its
  constructor trims, and refuses an empty value or whitespace inside. The
  window gets a separate status type with one `bool`, and no last four
  characters.
  - Why: a Tauri command that returns a key does not compile. The reference
    sends `last4`, and its comment says "booleans only".
  - Source: `write-only-secrets.md` 8.1, 8.2, 8.6.
    `server/routes/config.ts:135`.
  - Changes: PR 6.5, PR 7.6.

- **P21 (step 6). A change to a key is an enum.** `Keep`, `Set(Secret)`, `Remove`.
  - Why: in the reference a missing field means "keep" and `""` means
    "remove", and `""` stays in the file.
  - Source: `write-only-secrets.md` 8.5.
  - Changes: PR 7.6.

- **P32 (step 7). A new key replaces one registry entry.** The save replaces only the
  entry that uses the key, and stops its running turn with a reason. Compare
  a version number, not a copy of the key.
  - Source: `write-only-secrets.md` 8.7. `server/config.ts:654-678`.
  - Changes: PR 7.6.

## Notes for later steps

No decision now. "Accept" for a row means: keep it as a choice of its
step when that step is split into pull requests.

| # | Step | Note | Source |
|---|---|---|---|
| P40 | 9 | Give a key only to the child process of an engine, never to our own environment | `write-only-secrets.md` 8.8 |
