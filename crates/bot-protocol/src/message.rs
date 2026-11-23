use serde::{Deserialize, Serialize};

use crate::ids::MessageId;

/// Who wrote a message.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Role {
    User,
    Assistant,
}

/// One message of a thread.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Message {
    pub id: MessageId,
    pub role: Role,
    pub text: String,
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::{Message, Role};
    use crate::ids::MessageId;

    #[test]
    fn message_json_has_the_id_the_role_and_the_text() {
        let message = Message {
            id: MessageId::new("message-1"),
            role: Role::User,
            text: "hello".to_owned(),
        };
        let expected = json!({ "id": "message-1", "role": "user", "text": "hello" });

        assert_eq!(serde_json::to_value(&message).unwrap(), expected);
        assert_eq!(
            serde_json::from_value::<Message>(expected).unwrap(),
            message
        );
    }

    #[test]
    fn each_role_is_a_lower_case_word_in_json() {
        assert_eq!(serde_json::to_value(Role::User).unwrap(), json!("user"));
        assert_eq!(
            serde_json::to_value(Role::Assistant).unwrap(),
            json!("assistant")
        );
    }
}
