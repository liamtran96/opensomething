# Implementation files

Each file splits one step of [`../plan.md`](../plan.md) into pull requests.
Each pull request obeys the 200-line limit in [`AGENTS.md`](../../AGENTS.md),
builds, and passes the checks without the ones after it.

Only part 1 is split. Split a later part when the part before it is done,
because its design depends on what we learn.

| Step | File |
|---|---|
| 1 | [`step-01-chat-skeleton.md`](step-01-chat-skeleton.md) |
| 2 | [`step-02-protocol-types.md`](step-02-protocol-types.md) |
| 3 | [`step-03-driver-trait.md`](step-03-driver-trait.md) |
| 4 | [`step-04-registry.md`](step-04-registry.md) |
| 5 | [`step-05-chat-driver.md`](step-05-chat-driver.md) |
| 6 | [`step-06-settings.md`](step-06-settings.md) |
| 7 | [`step-07-event-bus.md`](step-07-event-bus.md) |

In each file, tick a pull request when it is merged. "Choices" are open
points: record each one in [`../decisions.md`](../decisions.md) when you make
it.
