# Contributing

Contributions are accepted under the [Apache License 2.0](LICENSE). Submit only
code you wrote or have the right to contribute.

## Before you open a pull request

```
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo deny check
```

`cargo deny` is installed with `cargo install cargo-deny --locked`.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):
`type(scope): summary`, for example `feat(engine): add the chat driver` or
`docs: record the storage decision`. The types and the scope rule are listed in
[`AGENTS.md`](AGENTS.md).

## Rules

- Project rules for code, comments and architecture are in
  [`AGENTS.md`](AGENTS.md). They apply to people as well as coding agents.
- A change to the project's structure, tooling or a core design choice adds an
  entry to [`docs/decisions.md`](docs/decisions.md).
- Code ported from another project is recorded in [`NOTICE`](NOTICE).
