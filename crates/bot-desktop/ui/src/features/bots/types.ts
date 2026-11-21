import type { Message } from "../chat/types";

export interface Bot {
  id: string;
  name: string;
  color: string;
  model: string;
  isChief?: boolean;
  lastActive?: string;
  messages: Message[];
}
