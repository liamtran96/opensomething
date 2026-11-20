# Step 6. Settings and the data folder

- **Crate:** `bot-core` (all paths below are in `crates/bot-core/src`)
- **Done when:** settings stay after a restart. A test shows that a key does
  not reach a log.
- **Rule:** all data is in one folder, and one setting names that folder
  (decision D10). A test uses a temporary folder, never a real data folder.

## Pull requests

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [ ] 6.1 | `feat(core): add the data folder` | `data_dir.rs`, `error.rs`, `lib.rs` | `DataDir` is made from a path that the caller gives. It creates the folder and gives the path of each file in it | Tests with a temporary folder |
| [ ] 6.2 | `feat(core): add the settings type` | `settings.rs`, `lib.rs` | `Settings` with `serde`: the driver entries and the chosen background. A missing field gets its default | A test reads an empty file and an old file |
| [ ] 6.3 | `feat(core): save settings with an atomic write` | `settings.rs`, `atomic.rs` | Write to a temporary file in the same folder, then rename it | A test saves, loads and compares. A test shows that a failed write keeps the old file |
| [ ] 6.4 | `feat(core): redact secrets` | `redact.rs`, `lib.rs` | `redact(text)` replaces the known secret values and the text that matches a key pattern | A test shows that a key in an error message does not reach the output |
| [ ] 6.5 | `feat(core): keep the key out of Debug output` | `settings.rs` | A `Secret` type for the key. Its `Debug` output is `[redacted]` | A test prints the settings and finds no key |

## Choices

- The file format of the settings: TOML or JSON.
- Where the API key lives: in the settings file in the data folder, or in the
  keychain of the operating system. Record the risk of the choice.
- The default data folder comes from the shell (`bot-desktop` or `bot-cli`),
  and the environment variable that overrides it.
