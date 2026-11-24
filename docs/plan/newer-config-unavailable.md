# Plan: A config from a newer version is "unavailable"

The proposals from the research file
[`../research/features/newer-config-unavailable.md`](../research/features/newer-config-unavailable.md).
The steps, the pull requests and the order are in
[`README.md`](README.md). The author decides each proposal. Then it
becomes a decision, a pull request or a choice, and its text leaves this
file.

- **Steps:** 4, 6.
- **State:** open. No proposal is decided.

## Proposals

- **P10 (step 4). An entry is raw JSON until the driver reads it.** `DriverEntry` is
  `{ id, kind: String, settings: serde_json::Value }`. The kind is not a
  closed `serde` enum. The registry decodes the settings of a known kind.
  - Why: an unknown kind or field cannot fail the file.
  - Source: `newer-config-unavailable.md` 8.1.
  - Changes: PR 4.1.

- **P11 (step 4). A typed reason for "unavailable".** An enum: `UnknownKind { kind }`,
  `BadSettings { field }`, `StartFailed`, and later `NotInstalled`. Its
  `Display` names a field and never a value. The text goes through the
  redaction of step 6.
  - Why: the compiler refuses a missing case. The reference shows an install
    card for a bad config, and sends `e.message` unchanged.
  - Source: `newer-config-unavailable.md` 8.5, 8.6. `registry.ts:216`,
    `:522`.
  - Changes: PR 4.2, PR 4.3.

- **P12 (step 4). The registry build cannot fail.** `Registry::build` returns
  `Registry`, not `Result`.
  - Why: the reference can reject the whole load when an old driver fails to
    stop.
  - Source: `newer-config-unavailable.md` 8.7.
  - Changes: PR 4.2.

- **P22 (step 6). Keep what this version does not know.** Settings types have
  `#[serde(flatten)] extra: Map<String, Value>`, and a save writes it back. A
  section that fails to parse stays as raw JSON with a warning, and does not
  fail the file. No `deny_unknown_fields` on stored data. A test loads a
  fixed file from a "future" version and saves it with no loss.
  - Why: in the reference, one unknown key in 1 of 16 strict sections makes
    it ignore all settings. A later save can then replace the fleet.
  - Source: `newer-config-unavailable.md` 8.2, 8.3, 8.4, 8.10.
  - Changes: PR 6.2, and a new test PR.

- **P23 (step 6). A format number in the file (optional).** A newer version raises it
  only when an older version cannot read the file safely. The older version
  then opens it read-only.
  - Source: `newer-config-unavailable.md` 8.11. Batch 4 found that the
    reference has a format number, on the whole data folder and not in the
    settings file. It stops the start on a newer format. See
    [P74](store-and-data-format.md), which replaces P23 if it is accepted.
