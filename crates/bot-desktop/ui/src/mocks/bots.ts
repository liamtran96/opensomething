import type { Bot } from "../features/bots/types";
import type { Message, MessageKind } from "../features/chat/types";

function conversation(...lines: [MessageKind, string][]): Message[] {
  return lines.map(([kind, text], id) => ({ id, kind, text }));
}

export const mockBots: [Bot, ...Bot[]] = [
  {
    id: "pepper",
    name: "Pepper",
    color: "#d9483b",
    model: "llama-3.3-70b",
    lastActive: "6:17 PM",
    messages: conversation(
      ["bot", "Hi, I'm Pepper. What would you like me to do?"],
      ["person", "Give me a summary of the plan for this week."],
      ["bot", "This week has three tasks: the chat pane, the bot list and the settings panel."],
    ),
  },
  {
    id: "starter",
    name: "Starter",
    color: "#3d4451",
    model: "llama-3.3-70b",
    isChief: true,
    messages: conversation(["bot", "I looked around and nothing is waiting for you."]),
  },
  {
    id: "ledger",
    name: "Ledger",
    color: "#1f9d8a",
    model: "qwen-2.5-coder",
    lastActive: "4:02 PM",
    messages: conversation(
      ["bot", "Hi, I'm Ledger. What would you like me to do?"],
      ["person", "How many invoices are open?"],
      ["bot", "Four invoices are open. Two of them are late."],
    ),
  },
  {
    id: "writer",
    name: "Writer",
    color: "#7a55d6",
    model: "llama-3.3-70b",
    lastActive: "Mon",
    messages: conversation(["bot", "Hi, I'm Writer. What would you like me to do?"]),
  },
  {
    id: "research",
    name: "Research",
    color: "#2f7bf0",
    model: "deepseek-r1",
    messages: [],
  },
];
