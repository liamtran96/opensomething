export type MessageKind = "person" | "bot" | "error";

export interface Message {
  id: number;
  kind: MessageKind;
  text: string;
}
