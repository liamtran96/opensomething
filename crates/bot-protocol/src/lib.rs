//! Ids, runtime events, assignment and wire types shared by every crate. No I/O.

mod ids;
mod message;

pub use ids::{BotId, MessageId, ThreadId, TurnId};
pub use message::{Message, Role};
