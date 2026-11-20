# Step 4. The registry

- **Crate:** `bot-engine` (all paths below are in `crates/bot-engine/src`)
- **Done when:** a test loads one good entry and one bad entry, and the good
  one works.

## Pull requests

| | Commit | Files | What to build | Check |
|---|---|---|---|---|
| [ ] 4.1 | `feat(engine): add the driver config entry` | `config.rs`, `lib.rs` | `DriverEntry`: an identifier, a kind (`fake`, later `chat` and `acp`) and the settings of that kind. It is read with `serde` | A test reads an entry from JSON |
| [ ] 4.2 | `feat(engine): add the registry` | `registry.rs`, `lib.rs` | `Registry` holds a `HashMap` from the identifier to a slot. A slot is a driver or "unavailable" with a reason. `get` returns the driver or a typed refusal | A test builds a registry from one `fake` entry and sends a turn |
| [ ] 4.3 | `test(engine): keep a bad entry as unavailable` | `registry.rs` | A test with an unknown kind and a test with bad settings | The bad entry is "unavailable" with its reason, and the good entry works |

## Choices

- The registry never fails as a whole: one bad entry must not stop the others.
- The reason of an unavailable entry is shown to the person, so it must not
  contain a secret.
