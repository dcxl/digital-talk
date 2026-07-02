import { History, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { RefObject } from "react";
import type {
  AsyncStatus,
  ChatMessage,
  ConversationSummary,
  KnowledgeBaseSummary,
  KnowledgeDocumentSummary,
  RuntimeState,
} from "../types";
import { Composer } from "./composer";
import { KnowledgeControls } from "./knowledge-controls";
import { MessageList } from "./message-list";

interface ConversationPanelProps {
  canSend: boolean;
  conversationId?: string;
  conversations: ConversationSummary[];
  historyStatus: "idle" | "loading" | "error";
  input: string;
  isBusy: boolean;
  knowledgeBases: KnowledgeBaseSummary[];
  knowledgeDocuments: KnowledgeDocumentSummary[];
  knowledgeFileInputRef: RefObject<HTMLInputElement | null>;
  knowledgeName: string;
  knowledgeStatus: AsyncStatus;
  knowledgeStatusText: string;
  messages: ChatMessage[];
  onCreateKnowledgeBase: () => void;
  onDeleteCurrentConversation: () => void;
  onInputChange: (value: string) => void;
  onInterrupt: () => void;
  onKnowledgeNameChange: (value: string) => void;
  onLoadConversations: () => void;
  onLoadKnowledgeBases: () => void;
  onOpenConversation: (conversationId: string) => void;
  onSelectKnowledgeBase: (knowledgeBaseId: string) => void;
  onSendMessage: (text: string) => void;
  onStartNewConversation: () => void;
  onToggleListening: () => void;
  onUploadKnowledgeDocument: (file: File) => void;
  selectedKnowledgeBase?: KnowledgeBaseSummary;
  selectedKnowledgeBaseId: string;
  state: RuntimeState;
}

export function ConversationPanel({
  canSend,
  conversationId,
  conversations,
  historyStatus,
  input,
  isBusy,
  knowledgeBases,
  knowledgeDocuments,
  knowledgeFileInputRef,
  knowledgeName,
  knowledgeStatus,
  knowledgeStatusText,
  messages,
  onCreateKnowledgeBase,
  onDeleteCurrentConversation,
  onInputChange,
  onInterrupt,
  onKnowledgeNameChange,
  onLoadConversations,
  onLoadKnowledgeBases,
  onOpenConversation,
  onSelectKnowledgeBase,
  onSendMessage,
  onStartNewConversation,
  onToggleListening,
  onUploadKnowledgeDocument,
  selectedKnowledgeBase,
  selectedKnowledgeBaseId,
  state,
}: ConversationPanelProps) {
  return (
    <section className="flex min-h-[520px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              对话
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {conversationId ? "已保存会话" : "新会话"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-40"
              disabled={!canSend}
              onClick={onStartNewConversation}
              title="新建会话"
            >
              <Plus size={16} />
            </button>
            <button
              className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-40"
              disabled={!conversationId || !canSend}
              onClick={onDeleteCurrentConversation}
              title="删除当前会话"
            >
              <Trash2 size={16} />
            </button>
            <button
              className="flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-40"
              disabled={historyStatus === "loading"}
              onClick={onLoadConversations}
              title="刷新历史"
            >
              <RefreshCw
                size={16}
                className={historyStatus === "loading" ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {conversations.length > 0 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={`flex max-w-56 shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-left text-xs disabled:opacity-50 ${
                  conversation.id === conversationId
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
                disabled={!canSend}
                onClick={() => onOpenConversation(conversation.id)}
                title={conversation.title}
              >
                <History size={14} />
                <span className="truncate">{conversation.title}</span>
              </button>
            ))}
          </div>
        ) : null}

        <KnowledgeControls
          canSend={canSend}
          fileInputRef={knowledgeFileInputRef}
          knowledgeBases={knowledgeBases}
          knowledgeDocuments={knowledgeDocuments}
          knowledgeName={knowledgeName}
          knowledgeStatus={knowledgeStatus}
          knowledgeStatusText={knowledgeStatusText}
          onCreateKnowledgeBase={onCreateKnowledgeBase}
          onKnowledgeNameChange={onKnowledgeNameChange}
          onLoadKnowledgeBases={onLoadKnowledgeBases}
          onSelectKnowledgeBase={onSelectKnowledgeBase}
          onUploadKnowledgeDocument={onUploadKnowledgeDocument}
          selectedKnowledgeBase={selectedKnowledgeBase}
          selectedKnowledgeBaseId={selectedKnowledgeBaseId}
        />
      </div>

      <MessageList messages={messages} />

      <Composer
        canSend={canSend}
        input={input}
        isBusy={isBusy}
        onInputChange={onInputChange}
        onInterrupt={onInterrupt}
        onSendMessage={onSendMessage}
        onToggleListening={onToggleListening}
        state={state}
      />
    </section>
  );
}
