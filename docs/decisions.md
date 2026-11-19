# Decisions

What we chose for this project, why, and where the idea came from. Add an
entry when the structure, the tooling or a core design choice changes. Do not
rewrite an old entry: mark it `Superseded by D<n>` and add a new one.

Each entry has a status: `Accepted`, `Proposed` (not built yet, may change) or
`Superseded`.

References marked *(from memory)* were not checked against the source when the
entry was written. Verify them before relying on them.

---

## D1. A Rust server that runs bots on existing agent engines

- **Date:** 2026-11-19
- **Status:** Accepted
- **What:** A local-first server in Rust. Each bot is a persona around an agent
  engine (an ACP agent CLI or a chat API). The server owns conversations,
  hand-offs, approvals, memory and schedules; the engine only runs turns.
- **Why:** The engine is the hard, fast-moving part and others already build
  it. Owning only the harness keeps the project small and lets one bot use any
  model.
- **Alternatives:** Write our own agent loop (more work, one more engine to
  maintain). Fork OpenMausBot (TypeScript, about 150k lines of server code,
  much of it for features we do not need).
- **References:**
  - OpenMausBot, the main design reference: https://github.com/milind-soni/OpenMausBot
  - Grok Bot, the product shape (roster of persistent bots, skills, routines,
    approvals): https://docs.x.ai/grok-bot/overview

## D2. Apache License 2.0, with attribution in NOTICE

- **Date:** 2026-11-19
- **Status:** Accepted
- **What:** The project is Apache-2.0. `NOTICE` credits OpenMausBot and lists
  each ported component. Nothing under OpenMausBot's `enterprise/` directory is
  read or used. Their names and mascot are not used.
- **Why:** OpenMausBot is Apache-2.0 and ships a `NOTICE`, so section 4(d)
  requires carrying its attribution in a derivative work. Its `enterprise/`
  directory is under a separate source-available license that forbids
  redistribution. Section 6 grants no trademark rights.
- **Alternatives:** MIT for our own code (allowed, but one license for the
  whole repository is simpler and keeps the patent grant).
- **References:**
  - Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
  - OpenMausBot `LICENSING.md`, `NOTICE` and `enterprise/LICENSE`

## D3. A flat Cargo workspace under `crates/`

- **Date:** 2026-11-19
- **Status:** Accepted
- **What:** The root `Cargo.toml` is a virtual manifest with
  `members = ["crates/*"]`. Every crate is a sibling under `crates/`, and a
  crate's folder name equals its package name.
- **Why:**
  - Cargo's crate namespace is already flat, so nested folders make a second
    hierarchy that drifts from it.
  - Separate crates let the compiler enforce dependency direction (D7), where
    modules in one crate make it only a convention.
  - Crates compile in parallel and only changed ones recompile.
  - Contributors know the layout from other projects.
- **Alternatives:** One crate with modules (simpler while the project is a few
  thousand lines; no enforced boundaries). A nested tree of crates (tends to
  decay as the project grows).
- **References:**
  - matklad, "Large Rust Workspaces": https://matklad.github.io/2021/08/22/large-rust-workspaces.html
  - Cargo reference, Workspaces: https://doc.rust-lang.org/cargo/reference/workspaces.html
  - Microsoft Rust Guidelines, Project: https://microsoft.github.io/rust-guidelines/guidelines/project/index.html
  - Projects using a flat `crates/` folder *(from memory)*: rust-analyzer,
    ruff, uv, Zed, Bevy, nushell, ripgrep. Flat at the workspace root without
    a `crates/` folder *(from memory)*: tokio, helix, Codex (`codex-rs`).

## D4. Start with four crates and split when a boundary is proven

- **Date:** 2026-11-19
- **Status:** Accepted
- **What:** The workspace starts with `bot-protocol` (types, no I/O),
  `bot-core` (store, runtime and memory together), `bot-engine` (the `Driver`
  trait and drivers) and `bot-cli` (the only binary, named `opensomething`).
  The planned later splits are in D8.
- **Why:** A boundary drawn before the code exists is a guess, and moving code
  between crates costs more than splitting one crate later.
- **Alternatives:** Create all planned crates now (clearer target, more empty
  crates and more early refactoring).
- **References:** This is our own judgment, not a published convention.

## D5. Versions, lints and the toolchain are declared once at the root

- **Date:** 2026-11-19
- **Status:** Accepted
- **What:**
  - `[workspace.package]` holds `version`, `edition`, `rust-version`,
    `license`, `repository` and `publish = false`; crates inherit them.
  - `[workspace.dependencies]` holds every dependency version; crates use
    `name.workspace = true`.
  - `[workspace.lints]` forbids `unsafe_code` and denies `clippy::unwrap_used`
    and `clippy::dbg_macro`; every crate sets `[lints] workspace = true`.
    `clippy.toml` allows `unwrap` in tests.
  - `rust-toolchain.toml` pins Rust 1.94.1 with `rustfmt` and `clippy`.
  - `Cargo.lock` is committed.
- **Why:** One place to change a version or a rule, and no drift between
  crates. A pinned toolchain gives every contributor and CI the same compiler
  and the same lint results. `publish = false` stops an accidental release to
  crates.io. A committed lock file makes the binary's build reproducible.
- **Alternatives:** A floating `stable` toolchain (less upkeep, but a new
  clippy release can break CI without a code change).
- **References:**
  - Cargo reference, Workspaces (the `package`, `dependencies` and `lints`
    tables): https://doc.rust-lang.org/cargo/reference/workspaces.html

## D6. CI runs format, clippy, tests and cargo-deny

- **Date:** 2026-11-19
- **Status:** Accepted
- **What:** `.github/workflows/ci.yml` runs `cargo fmt --all --check`,
  `cargo clippy --workspace --all-targets -- -D warnings`,
  `cargo test --workspace` and `cargo deny check`. `deny.toml` allows only
  permissive licenses, denies yanked crates, unknown registries and unknown
  git sources, and warns on duplicate versions.
- **Why:** The rules in `AGENTS.md` and D2 are checked by a machine instead of
  by review. A dependency with a license outside the allow list fails CI
  before it is merged.
- **Alternatives:** `cargo audit` alone (advisories only, no license check).
- **References:**
  - cargo-deny: https://github.com/EmbarkStudios/cargo-deny
  - OpenZeppelin rust-project-template (a CI layout of this kind): https://github.com/openzeppelin/rust-project-template

## D7. Dependencies between crates point one way

- **Date:** 2026-11-19
- **Status:** Accepted
- **What:** `bot-protocol` depends on no other crate of ours. `bot-core` and
  `bot-engine` depend on `bot-protocol` only. `bot-cli` depends on all of them
  and nothing depends on it. The binary only parses arguments and wires the
  libraries together.
- **Why:** The protocol crate is the contract between the engine side and the
  runtime side, so either can change without the other. Logic in libraries can
  be tested without starting a process.
- **Alternatives:** Let `bot-core` call drivers directly (fewer traits, but the
  runtime could then be tested only with a real engine).
- **References:**
  - OpenMausBot's host rules, which split a 15,000-line composition file into
    modules with explicit dependencies: `server/host/README.md`
  - Codex (`codex-rs`), where a protocol crate is the API between the UI and
    the engine *(from third-party write-ups)*: https://www.mintlify.com/openai/codex/architecture/rust-crates

## D8. Target architecture

- **Date:** 2026-11-19
- **Status:** Proposed
- **What:** The design we are building toward. Each item names the OpenMausBot
  source the idea comes from.
  - **Driver contract.** Every engine implements send turn, interrupt, respond
    to a request and an event stream. Behaviour is gated by capability flags,
    never by a driver's name. (`server/contracts.ts`,
    `server/runtime/capabilities.ts`)
  - **Event bus.** Driver events fan into one stream that is logged per thread
    and pushed to clients. (`server/harness/bus.ts`)
  - **Assignment runtime.** Every turn is a row in SQLite, in a tree. One
    lifecycle, one inbox for wakes, budgets, a restart policy, and invariants
    checked after every test scenario. Each state change writes the row and
    its event in one transaction. (`docs/runtime-contract.md`)
  - **Tools over MCP.** The server exposes its own tools to engines as an MCP
    server, so any engine can use them. (`server/drivers/agents-*.ts`)
  - **Lineage.** Each root records whether a person, a routine or outside
    content started it, and the opening of a delegated turn is written from
    stored data, never from model text. (`docs/runtime-contract.md`, sections
    1 and 4)
  - **Approval levels.** `ask < edits < auto < full`, mapped onto the engine's
    own permission mode. (`docs/approval-levels.md`)
  - **Memory.** Plain markdown per bot with a fixed load budget; recall goes in
    the message, not the system prompt. (`docs/memory.md`)
  - **One turn per bot at a time.** Parallel work comes from more bots.
    (`docs/plans/2026-09-02-bot-concurrency.md`)
  - **Planned crates after the splits:** `bot-store`, `bot-runtime`,
    `bot-memory` and `bot-scheduler` out of `bot-core`; `bot-tools` out of
    `bot-engine`; `bot-server` out of `bot-cli`; and a `bot-testkit` crate for
    the fake driver and the invariant checks.
- **Why:** These are the parts of OpenMausBot that carry its design. Its
  desktop shell, phone relay, cloud computers, browser engine and team
  features are most of its size and are left out.
- **Alternatives:** Not decided yet: which engine comes first (an ACP agent or
  a chat API), and whether the first client is the CLI only.
- **References:** The OpenMausBot paths above, at
  https://github.com/milind-soni/OpenMausBot

## D9. The first steps add one concept at a time

- **Date:** 2026-11-19
- **Status:** Accepted
- **What:** Before the server and the runtime, the project is built in six
  small steps, each of which runs and adds one Rust concept:
  1. Echo loop in `bot-cli`: `main`, `String`, `loop`, `Result` and `?`.
  2. One blocking chat-API call: dependencies, structs, `serde`, an API key
     read from the environment.
  3. Keep the conversation: structs and enums in `bot-protocol`, `Vec`, using
     one crate from another.
  4. The `Driver` trait in `bot-engine`: traits, and a test with a fake driver.
  5. Save conversations to SQLite in `bot-core`: `rusqlite`, ownership and
     borrowing across crates.
  6. Stream the reply: `tokio` and `async`/`await`.
- **Why:** The author is new to Rust. Async and trait-based design are among
  the harder parts of the language, and meeting them together with a database
  and an HTTP API in the first milestone would hide which one caused a given
  compiler error. Each step leaves a working program.
- **Alternatives:** Start with async and streaming from the first call (less
  rewriting later; much steeper start). Step 2 uses a blocking HTTP call that
  step 6 replaces, and that rewrite is accepted as the cost of the slower
  path.
- **References:**
  - The Rust Programming Language: https://doc.rust-lang.org/book/

## D10. The product is a desktop application; a server stays possible

- **Date:** 2026-11-19
- **Status:** Proposed
- **What:** People download an installer, open the application, connect one
  AI provider, make a bot and send it a task. The application runs the bots on
  the person's own computer. We operate no service and hold no data.
  - The application is a shell. It starts the Rust core in the same process or
    on `127.0.0.1` and shows a web UI in a window.
  - Tauri is the proposed shell, because the backend is already Rust and the
    installer is small. This choice is not final until the desktop step starts.
  - The UI is web technology (HTML, CSS, TypeScript). The framework is not
    chosen yet.
  - A server that a person hosts on a remote machine is not planned now. The
    rules below keep it possible.
- **Rules that apply to code from step 2 on,** because they are difficult to
  add later:
  - All settings come from environment variables, flags or a settings file.
    No setting is a constant in the code.
  - All data is in one folder. One setting names that folder.
  - A network listener binds to `127.0.0.1` only.
  - A request from a web page or from another machine must sign in. A request
    is never trusted because of its network address alone.
  - A secret is never written to a log.
  - Logic stays in the library crates. The shell and the CLI only start it.
- **Why:** This is the shape of the product we follow: its quickstart is
  "download the desktop app, connect one provider, create your first bot, send
  a task". A desktop application needs no server knowledge from the person who
  installs it, and their keys and conversations stay on their computer.
- **Alternatives:** A self-hosted server as the main product (access from a
  phone or a second computer, but the person must run a server). A hosted
  service (we would hold data and keys and pay for servers). Electron as the
  shell (what OpenMausBot uses; it needs a Node backend, and ours is Rust).
- **References:**
  - MausBot quickstart: https://mausbot.com/#quickstart
  - OpenMausBot `electron/` (the shell) and `docs/self-hosting.md` (the server
    path): https://github.com/milind-soni/OpenMausBot
  - Tauri: https://tauri.app/

## D11. MPL-2.0 is a permitted dependency license

- **Date:** 2026-11-19
- **Status:** Accepted
- **What:** `deny.toml` permits MPL-2.0 in addition to the permissive
  licenses. No other copyleft license is permitted.
- **Why:** Tauri depends on seven MPL-2.0 libraries that process CSS, such as
  `cssparser`. The desktop application (D10) cannot use Tauri without them.
  MPL-2.0 applies to each file of the library: a person who changes one of
  those files and distributes it must publish the changed file. Our own code
  stays Apache-2.0, and we use the libraries without change.
- **Alternatives:** A different window tool with no MPL-2.0 dependency (none
  was examined). Changing one of these libraries would need a new decision.
- **References:**
  - Mozilla Public License 2.0: https://www.mozilla.org/en-US/MPL/2.0/
  - The license list came from `cargo metadata` on 2026-11-19: 427
    third-party packages, 7 of them MPL-2.0.
