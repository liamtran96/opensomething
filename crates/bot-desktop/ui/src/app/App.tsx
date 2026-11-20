import {
  ChatComposer,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatSystemMessage,
} from "@astryxdesign/core/Chat";
import { Theme } from "@astryxdesign/core/theme";
import { BackdropPicker } from "../features/backdrop/BackdropPicker";
import { type BackdropId, backdropStyles, backdrops } from "../features/backdrop/backdrops";
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
  const [backdrop, setBackdrop] = useState<BackdropId>("meadow");
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
    <Theme theme={brandTheme} mode={backdrops[backdrop].mode}>
      <div {...stylex.props(styles.window, backdropStyles[backdrop])}>
        <div {...stylex.props(styles.glass)}>
          <header {...stylex.props(styles.header)}>
            <BackdropPicker value={backdrop} onChange={setBackdrop} />
          </header>
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
      </div>
    </Theme>
  );
}

const styles = stylex.create({
  window: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: 20,
    backgroundSize: "cover",
  },
  glass: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minHeight: 0,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "color-mix(in srgb, var(--color-background-surface) 38%, transparent)",
    backdropFilter: "blur(28px) saturate(140%)",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.25)",
  },
  header: {
    display: "flex",
    justifyContent: "flex-end",
    padding: 12,
  },
});
