export type RuntimeState =
  | "idle"
  | "thinking"
  | "streaming"
  | "synthesizing"
  | "speaking"
  | "interrupted"
  | "error";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status?: "pending" | "streaming" | "completed" | "interrupted" | "failed";
}

