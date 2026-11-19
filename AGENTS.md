# opensomething agent notes

A local-first server for running a team of AI bots, written in Rust. The
layout and build order are in [`README.md`](README.md).

What we chose and why is in [`docs/decisions.md`](docs/decisions.md). Read it
before changing the structure, the tooling or a core design choice, and add an
entry when you change one.

## Reference code and licensing

The design draws on OpenMausBot (Apache License 2.0). When you use it as a
reference:

- Never read, copy or port anything under its `enterprise/` directory. That
  directory is not Apache-licensed.
- When a file here ports a specific OpenMausBot file or module, add a line to
  the "Adapted components" section of [`NOTICE`](NOTICE) naming the path it
  adapts. If OpenMausBot's own `NOTICE` credits a third party for that path,
  carry that credit over too.
- Do not use the names "OpenMausBot", "MausBot", "Grok" or "Grok Bot" in
  identifiers, product text or assets. Mention them only in `NOTICE` and the
  README's credits.
- Check a dependency's license before adding it. Prefer MIT, Apache-2.0 or
  BSD; ask before adding anything copyleft.

## Architecture rules

- `bot-cli` is the only composition root. Other crates take what they need as
  trait objects or constructor arguments and never depend on it.
- `bot-protocol` depends on no other crate of ours and does no I/O.
- The runtime in `bot-core` owns all work state. It reaches the host only
  through its `TurnRunner` trait and does no I/O beyond its own store.
- Dependency versions go in `[workspace.dependencies]` in the root
  `Cargo.toml`; a crate uses `name.workspace = true`.
- Engine behaviour is gated by capability flags on the driver, never by a
  driver's name.
- Every state change in the runtime writes the row and its event in one
  transaction before anything acts on it.
- The runtime returns typed refusals. It does not panic or return an untyped
  error into a turn.
- Text that opens a delegated turn is built from stored data, never from model
  output.

## Rust conventions

- Before claiming a change works, run `cargo fmt --all --check`,
  `cargo clippy --workspace --all-targets -- -D warnings` and
  `cargo test --workspace`, and report the result. After adding or changing a
  dependency, also run `cargo deny check`.
- No `unwrap()` or `expect()` outside tests, except on an invariant stated in
  the `expect` message. Library crates use `thiserror` enums; only binaries
  use `anyhow`.
- No `unsafe`: the workspace lint forbids it.
- Never suppress a lint that guards correctness; fix the code.
- Test the runtime with a fake driver and an in-memory store. Never run tests
  against a person's real data directory or real engine accounts.
- Never log or persist secrets. Redact tokens and keys before text reaches
  disk.

## Comments

Write a comment only for what the code cannot say:

- a license or attribution notice;
- a fact forced by something outside this code (a vendor, CLI, OS or protocol
  behaviour), with its version when it has one;
- the doc comment of a public contract: wire types, the `Driver` and
  `TurnRunner` traits, config fields people edit;
- a link to an upstream issue;
- a security invariant or a known open risk.

Do not narrate what the next line does, restate a name, record history or
leave commented-out code. When code needs a paragraph to explain a surprise,
change the code instead: a better name, a type, an extracted function.

## Commits

- Do not commit or push unless asked.
- Write commit messages as Conventional Commits: `type(scope): summary`.
  - Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`,
    `perf`.
  - The scope is optional and names a crate without its `bot-` prefix:
    `feat(engine): add the chat driver`.
  - The summary is lower case, imperative and has no full stop.
  - Mark a breaking change with `!` after the type or scope and explain it in
    a `BREAKING CHANGE:` footer.
- No `Co-Authored-By` trailer and no generated-by footer in commit messages or
  pull request descriptions.
