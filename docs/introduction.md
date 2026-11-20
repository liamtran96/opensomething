# opensomething

A local-first desktop application for running a team of AI bots, written in
Rust.

Each bot is a persona around an agent engine (an ACP agent CLI or a chat
API). The application owns the conversations, the hand-offs between bots,
approvals, memory and schedules. The engine only runs turns. Your keys and
your conversations stay on your computer.

## Status

Early. The desktop window opens with a chat on a background that you can
change, and it echoes a line. No bot feature is built yet. The
[plan](plan.md) shows what comes next.

## Run it

You need Rust (the version in `rust-toolchain.toml`), Node 24 and pnpm. Run
these commands in `crates/bot-desktop/ui`:

```
pnpm install
pnpm run tauri dev
```

## Where to read

- [Plan](plan.md): the steps to one bot, then a team of bots.
- [Implementation files](plan/README.md): each step as a list of pull
  requests.
- [Decisions](decisions.md): what we chose and why.
- [Comparison](comparison.md): each feature of the reference project and the
  Rust crate that we use for it.

The rules for code and for pull requests are in
[`AGENTS.md`](https://github.com/liamtran96/opensomething/blob/main/AGENTS.md)
and
[`CONTRIBUTING.md`](https://github.com/liamtran96/opensomething/blob/main/CONTRIBUTING.md).

## License

[Apache License 2.0](https://github.com/liamtran96/opensomething/blob/main/LICENSE).
The design draws on OpenMausBot. See
[`NOTICE`](https://github.com/liamtran96/opensomething/blob/main/NOTICE).
