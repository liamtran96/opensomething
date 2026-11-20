import {
  ChatComposer,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatSystemMessage,
} from "@astryxdesign/core/Chat";
import { Theme } from "@astryxdesign/core/theme";
import { brandTheme } from "../themes/built/brand";
import * as stylex from "@stylexjs/stylex";
import { invoke } from "@tauri-apps/api/core";
import { useRef, useState } from "react";

type MessageKind = "person" | "bot" | "error";

interface Message {
  id: number;
  kind: MessageKind;
  text: string;
}

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const nextId = useRef(0);

  function add(kind: MessageKind, text: string) {
    const id = nextId.current++;
    setMessages((current) => [...current, { id, kind, text }]);
  }

  async function send(value: string) {
    const text = value.trim();
    if (!text || sending) return;

    add("person", text);
    setSending(true);
    try {
      add("bot", await invoke<string>("send_message", { message: text }));
    } catch (error) {
      add("error", `The message failed: ${String(error)}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <Theme theme={brandTheme}>
      <div {...stylex.props(styles.window)}>
        <ChatLayout
          composer={<ChatComposer onSubmit={send} isDisabled={sending} placeholder="Write a message" />}
          emptyState={<ChatSystemMessage>Send a message to start.</ChatSystemMessage>}
        >
          {messages.length > 0 && (
            <ChatMessageList>
              {messages.map((message) =>
                message.kind === "error" ? (
                  <ChatSystemMessage key={message.id}>{message.text}</ChatSystemMessage>
                ) : (
                  <ChatMessage key={message.id} sender={message.kind === "person" ? "user" : "assistant"}>
                    <ChatMessageBubble>{message.text}</ChatMessageBubble>
                  </ChatMessage>
                ),
              )}
            </ChatMessageList>
          )}
        </ChatLayout>
      </div>
    </Theme>
  );
}

const styles = stylex.create({
  window: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
});
