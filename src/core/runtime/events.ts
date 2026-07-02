export type RuntimeState =
  | "idle"
  | "listening"
  | "transcribing"
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

export interface RAGRetrievedChunk {
  chunkId: string;
  documentId: string;
  documentName: string;
  preview: string;
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
      chunkCount?: number;
      chunked?: boolean;
      durationMs?: number;
      marks?: Array<{
        timeMs: number;
        value: string;
      }>;
      mimeType?: string;
    }
  | {
      type: "tts.chunk";
      messageId: string;
      audioUrl: string;
      durationMs?: number;
      marks?: Array<{
        timeMs: number;
        value: string;
      }>;
      mimeType: string;
      sequence: number;
    }
  | {
      type: "tts.failed";
      messageId: string;
      message: string;
      retryable: boolean;
    }
  | {
      type: "rag.retrieve.started";
      knowledgeBaseId: string;
      query: string;
    }
  | {
      type: "rag.retrieve.completed";
      chunks: RAGRetrievedChunk[];
      knowledgeBaseId: string;
    }
  | {
      type: "rag.retrieve.empty";
      knowledgeBaseId: string;
      query: string;
    }
  | {
      type: "rag.retrieve.failed";
      knowledgeBaseId: string;
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
