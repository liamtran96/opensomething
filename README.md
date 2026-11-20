# opensomething

A local-first server for running a team of AI bots, written in Rust.

Each bot is a persona around an agent engine (an ACP agent CLI or a chat API).
The server owns the conversations, the hand-offs between bots, approvals,
memory and schedules; the engine only runs turns.

Status: early. The workspace builds and the binary prints its version; no
feature is built yet.

## Layout

```
Cargo.toml            workspace root: shared versions, dependencies and lints
crates/
  bot-protocol/       ids, runtime events, assignment and wire types; no I/O
  bot-core/           store, assignment runtime and memory
  bot-engine/         the Driver trait and its drivers
  bot-cli/            the opensomething binary
  bot-desktop/        the desktop window (Tauri); its web UI is in ui/
docs/decisions.md     what we chose, why, and the references
```

The crates will be split further as the code grows. The plan and the reasons
are in [`docs/decisions.md`](docs/decisions.md).

## Develop

```
cargo run -p bot-cli
cargo fmt --all --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo deny check
```

The desktop UI is React with the Astryx components and StyleX, built with Vite
(decision D13). It needs Node 24 and pnpm. Run these commands in
`crates/bot-desktop/ui`:

```
pnpm install
pnpm run tauri dev      # the window, with the UI dev server and hot reload
pnpm run tauri build    # the installer
pnpm run theme:build    # after a change to src/themes/brand.ts
pnpm run lint
pnpm run typecheck
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Build order

The first steps add one Rust concept at a time. The reasons are in decision D9.

1. Echo loop: read a line, print it back. No dependencies.
2. One chat-API call: send the line, print the whole reply.
3. Keep the conversation: message types in `bot-protocol`.
4. The `Driver` trait in `bot-engine`, tested with a fake driver.
5. Save conversations to SQLite in `bot-core`.
6. Stream the reply with async.

After that:

7. The server, with an event bus and an event log.
8. An ACP driver, with permission requests shown as approvals.
9. The assignment runtime and its invariant tests.
10. Several bots: `list_bots` and `coordinate_bots` over MCP.
11. Memory, then routines.

## Credits

The design draws on [OpenMausBot](https://github.com/milind-soni/OpenMausBot)
(Apache License 2.0). See [NOTICE](NOTICE). This project is independent and is
not affiliated with OpenMausBot or xAI.

## License

[Apache License 2.0](LICENSE).
