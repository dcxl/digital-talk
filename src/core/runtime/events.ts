export type RuntimeState =
  | "idle"
  | "thinking"
  | "streaming"
  | "synthesizing"
  | "speaking"
  | "interrupted"
  | "error";

export type ChatRole = "user" | "assistant";

export type ChatMessageStatus =
  | "pending"
  | "streaming"
  | "completed"
  | "interrupted"
  | "failed";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  status?: ChatMessageStatus;
}

export type RuntimeEvent =
  | {
      type: "message.created";
      conversationId?: string;
      message: ChatMessage;
    }
  | {
      type: "assistant.created";
      conversationId?: string;
      message: ChatMessage;
    }
  | {
      type: "avatar.state";
      state: RuntimeState;
      reason?: string;
    }
  | {
      type: "text.delta";
      messageId: string;
      text: string;
    }
  | {
      type: "text.done";
      messageId: string;
    }
  | {
      type: "tts.started";
      messageId: string;
    }
  | {
      type: "tts.done";
      messageId: string;
      audioUrl?: string;
      durationMs?: number;
      mimeType?: string;
    }
  | {
      type: "tts.failed";
      messageId: string;
      message: string;
      retryable: boolean;
    }
  | {
      type: "usage";
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    }
  | {
      type: "done";
      conversationId?: string;
      messageId: string;
    }
  | {
      type: "error";
      code: string;
      message: string;
      retryable: boolean;
    };

export function encodeRuntimeEvent(event: RuntimeEvent) {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}
