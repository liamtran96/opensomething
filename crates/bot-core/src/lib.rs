//! Store, assignment runtime and memory.

pub fn echo_reply(message: &str) -> String {
    message.trim().to_owned()
}

#[cfg(test)]
mod tests {
    use super::echo_reply;

    #[test]
    fn echo_reply_returns_the_message_without_outer_spaces() {
        assert_eq!(echo_reply("  hello \n"), "hello");
    }
}
