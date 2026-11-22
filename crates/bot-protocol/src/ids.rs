use serde::{Deserialize, Serialize};

/// Identifies a bot. A plain string in JSON.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct BotId(String);

/// Identifies a thread: one conversation with a bot. A plain string in JSON.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct ThreadId(String);

/// Identifies a turn: one request to an engine and its reply. A plain string in JSON.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct TurnId(String);

/// Identifies a message. A plain string in JSON.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct MessageId(String);

impl BotId {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl ThreadId {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TurnId {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl MessageId {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[cfg(test)]
mod tests {
    use super::{BotId, MessageId, ThreadId, TurnId};

    #[test]
    fn bot_id_is_a_plain_string_in_json() {
        let id = BotId::new("bot-1");
        let json = serde_json::to_string(&id).unwrap();
        assert_eq!(json, r#""bot-1""#);
        assert_eq!(serde_json::from_str::<BotId>(&json).unwrap(), id);
    }

    #[test]
    fn thread_id_is_a_plain_string_in_json() {
        let id = ThreadId::new("thread-1");
        let json = serde_json::to_string(&id).unwrap();
        assert_eq!(json, r#""thread-1""#);
        assert_eq!(serde_json::from_str::<ThreadId>(&json).unwrap(), id);
    }

    #[test]
    fn turn_id_is_a_plain_string_in_json() {
        let id = TurnId::new("turn-1");
        let json = serde_json::to_string(&id).unwrap();
        assert_eq!(json, r#""turn-1""#);
        assert_eq!(serde_json::from_str::<TurnId>(&json).unwrap(), id);
    }

    #[test]
    fn message_id_is_a_plain_string_in_json() {
        let id = MessageId::new("message-1");
        let json = serde_json::to_string(&id).unwrap();
        assert_eq!(json, r#""message-1""#);
        assert_eq!(serde_json::from_str::<MessageId>(&json).unwrap(), id);
    }
}
