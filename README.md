# opensomething

A local-first desktop application for running a team of AI bots, written in
Rust.

Each bot is a persona around an agent engine (an ACP agent CLI or a chat API).
The application owns the conversations, the hand-offs between bots, approvals,
memory and schedules; the engine only runs turns. Your keys and your
conversations stay on your computer.

Status: early. The desktop window shows the full layout (bot sidebar, chat,
settings) with mock bots, and it echoes a line; no bot feature is built yet.

## Layout

```
Cargo.toml            workspace root: shared versions, dependencies and lints
crates/
  bot-protocol/       ids, runtime events, assignment and wire types; no I/O
  bot-core/           store, assignment runtime and memory
  bot-engine/         the Driver trait and its drivers
  bot-cli/            the opensomething binary
  bot-desktop/        the desktop window (Tauri); its web UI is in ui/
apps/
  docs/               the docs web site (Next.js and Fumadocs)
docs/
  plan.md             the steps, with a "done when" check for each
  plan/               each step as a list of pull requests
  decisions.md        what we chose, why, and the references
  comparison.md       the reference project's features and our crate for each
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

The docs web site is a Next.js app with Fumadocs (decision D15). Its pages
are MDX files in `apps/docs/content/docs`. Run these commands in `apps/docs`:

```
pnpm install
pnpm run dev            # the site at http://localhost:3000, with reload
pnpm run build          # static files in out/
pnpm run typecheck
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Build order

The steps and their "done when" checks are in [`docs/plan.md`](docs/plan.md).
Each step of part 1 is split into pull requests in [`docs/plan/`](docs/plan/README.md).
The reasons for the order are in decision D14.

1. One bot that answers: the chat UI, the protocol types, the `Driver` trait
   with a fake driver, the chat API driver, settings, then a streamed reply
   in the window.
2. The bot remembers and acts: the SQLite store, the ACP driver, approvals.
3. A team of bots: tasks, our own tools over MCP, the assignment runtime,
   `coordinate_bots`, memory, routines, outside tools.

## Credits

The design draws on [OpenMausBot](https://github.com/milind-soni/OpenMausBot)
(Apache License 2.0). See [NOTICE](NOTICE). This project is independent and is
not affiliated with OpenMausBot or xAI.

## License

[Apache License 2.0](LICENSE).
