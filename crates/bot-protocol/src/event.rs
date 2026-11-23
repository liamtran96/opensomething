use serde::{Deserialize, Serialize};

use crate::ids::{ThreadId, TurnId};

/// One thing that happens while an engine runs a turn.
///
/// In JSON the fields of `kind` are at the top level, next to `thread_id` and
/// `turn_id`, and the `type` field names the event.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Event {
    pub thread_id: ThreadId,
    pub turn_id: TurnId,
    #[serde(flatten)]
    pub kind: EventKind,
}

/// The events of one turn. `turn.started` is the first, and `turn.completed`
/// is the last.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum EventKind {
    #[serde(rename = "turn.started")]
    TurnStarted,

    /// The last event of each turn that started.
    #[serde(rename = "turn.completed")]
    TurnCompleted { outcome: Outcome },
}

/// How a turn ended.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Outcome {
    Completed,
    Failed,
    /// A person stopped the turn.
    Interrupted,
}

#[cfg(test)]
mod tests {
    use serde_json::{Value, json};

    use super::{Event, EventKind, Outcome};
    use crate::ids::{ThreadId, TurnId};

    fn assert_json(kind: EventKind, expected: Value) {
        let event = Event {
            thread_id: ThreadId::new("thread-1"),
            turn_id: TurnId::new("turn-1"),
            kind,
        };
        assert_eq!(serde_json::to_value(&event).unwrap(), expected);
        assert_eq!(serde_json::from_value::<Event>(expected).unwrap(), event);
    }

    #[test]
    fn turn_started_json() {
        assert_json(
            EventKind::TurnStarted,
            json!({ "thread_id": "thread-1", "turn_id": "turn-1", "type": "turn.started" }),
        );
    }

    #[test]
    fn turn_completed_json() {
        for (outcome, word) in [
            (Outcome::Completed, "completed"),
            (Outcome::Failed, "failed"),
            (Outcome::Interrupted, "interrupted"),
        ] {
            assert_json(
                EventKind::TurnCompleted { outcome },
                json!({
                    "thread_id": "thread-1",
                    "turn_id": "turn-1",
                    "type": "turn.completed",
                    "outcome": word,
                }),
            );
        }
    }

    #[test]
    fn an_unknown_type_is_an_error() {
        let unknown =
            json!({ "thread_id": "thread-1", "turn_id": "turn-1", "type": "turn.paused" });
        assert!(serde_json::from_value::<Event>(unknown).is_err());
    }
}
