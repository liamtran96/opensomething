import {
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatSystemMessage,
} from "@astryxdesign/core/Chat";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import type { Bot } from "../bots/types";
import { Composer } from "./Composer";
import type { MessageKind } from "./types";

interface ChatPaneProps {
  bot: Bot;
  onAdd: (kind: MessageKind, text: string) => void;
}

export function ChatPane({ bot, onAdd }: ChatPaneProps) {
  const [sending, setSending] = useState(false);

  async function send(text: string) {
    onAdd("person", text);
    setSending(true);
    try {
      onAdd("bot", await invoke<string>("send_message", { message: text }));
    } catch (error) {
      onAdd("error", `The message failed: ${String(error)}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <ChatLayout
      className="chat-scroll"
      composer={<Composer onSubmit={send} isDisabled={sending} placeholder={`Message ${bot.name}`} />}
      emptyState={<ChatSystemMessage>Send a message to start.</ChatSystemMessage>}
    >
      {bot.messages.length > 0 && (
        <ChatMessageList align="top" gap={4}>
          {bot.messages.map((message) =>
            message.kind === "error" ? (
              <ChatSystemMessage key={message.id}>{message.text}</ChatSystemMessage>
            ) : message.kind === "person" ? (
              <ChatMessage key={message.id} sender="user">
                <ChatMessageBubble style={{ backgroundColor: bot.color, color: "var(--color-on-dark)" }}>{message.text}</ChatMessageBubble>
              </ChatMessage>
            ) : (
              <ChatMessage key={message.id} sender="assistant">
                <ChatMessageBubble variant="ghost">{message.text}</ChatMessageBubble>
              </ChatMessage>
            ),
          )}
        </ChatMessageList>
      )}
    </ChatLayout>
  );
}
