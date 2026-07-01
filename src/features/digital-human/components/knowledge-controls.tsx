import { BookOpen, FolderPlus, RefreshCw, Upload } from "lucide-react";
import type { RefObject } from "react";
import type {
  AsyncStatus,
  KnowledgeBaseSummary,
  KnowledgeDocumentSummary,
} from "../types";

interface KnowledgeControlsProps {
  canSend: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  knowledgeBases: KnowledgeBaseSummary[];
  knowledgeDocuments: KnowledgeDocumentSummary[];
  knowledgeName: string;
  knowledgeStatus: AsyncStatus;
  knowledgeStatusText: string;
  onCreateKnowledgeBase: () => void;
  onKnowledgeNameChange: (value: string) => void;
  onLoadKnowledgeBases: () => void;
  onSelectKnowledgeBase: (value: string) => void;
  onUploadKnowledgeDocument: (file: File) => void;
  selectedKnowledgeBase?: KnowledgeBaseSummary;
  selectedKnowledgeBaseId: string;
}

export function KnowledgeControls({
  canSend,
  fileInputRef,
  knowledgeBases,
  knowledgeDocuments,
  knowledgeName,
  knowledgeStatus,
  knowledgeStatusText,
  onCreateKnowledgeBase,
  onKnowledgeNameChange,
  onLoadKnowledgeBases,
  onSelectKnowledgeBase,
  onUploadKnowledgeDocument,
  selectedKnowledgeBase,
  selectedKnowledgeBaseId,
}: KnowledgeControlsProps) {
  return (
    <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2">
          <BookOpen size={15} className="shrink-0 text-slate-500" />
          <select
            className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus:border-slate-400"
            disabled={!canSend}
            value={selectedKnowledgeBaseId}
            onChange={(event) => onSelectKnowledgeBase(event.target.value)}
          >
            <option value="">不使用知识库</option>
            {knowledgeBases.map((knowledgeBase) => (
              <option key={knowledgeBase.id} value={knowledgeBase.id}>
                {knowledgeBase.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex shrink-0 gap-2">
          <button
            className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
            disabled={knowledgeStatus === "loading"}
            onClick={onLoadKnowledgeBases}
            title="刷新知识库"
          >
            <RefreshCw
              size={15}
              className={knowledgeStatus === "loading" ? "animate-spin" : ""}
            />
          </button>
          <button
            className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
            disabled={!selectedKnowledgeBaseId || !canSend}
            onClick={() => fileInputRef.current?.click()}
            title="上传文档"
          >
            <Upload size={15} />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-slate-400"
          disabled={!canSend}
          placeholder="新知识库名称"
          value={knowledgeName}
          onChange={(event) => onKnowledgeNameChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onCreateKnowledgeBase();
            }
          }}
        />
        <button
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white disabled:opacity-40"
          disabled={!knowledgeName.trim() || knowledgeStatus === "loading"}
          onClick={onCreateKnowledgeBase}
          title="创建知识库"
        >
          <FolderPlus size={15} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        accept=".csv,.json,.md,.markdown,.txt,text/*"
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUploadKnowledgeDocument(file);
        }}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>
          {selectedKnowledgeBase
            ? `${selectedKnowledgeBase.documentCount} docs · ${selectedKnowledgeBase.chunkCount} chunks`
            : "未选择"}
        </span>
        <span>{knowledgeStatusText || "知识库待同步"}</span>
        {knowledgeDocuments.slice(0, 2).map((document) => (
          <span
            key={document.id}
            className="max-w-44 truncate rounded bg-white px-2 py-1 text-slate-600"
            title={document.originalName}
          >
            {document.name}
          </span>
        ))}
      </div>
    </div>
  );
}
