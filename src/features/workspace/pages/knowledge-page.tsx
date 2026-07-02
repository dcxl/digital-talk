"use client";

import { useEffect, useRef, useState } from "react";
import {
  CloudUpload,
  Database,
  FileSearch,
  FileText,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { PageFrame, Panel, RefreshButton } from "../components/page-frame";
import {
  createKnowledgeBaseRequest,
  readKnowledgeBases,
  readKnowledgeDocuments,
  searchKnowledgeBaseRequest,
  uploadKnowledgeDocumentRequest,
} from "../lib/api";
import { formatDate, formatFileSize } from "../lib/format";
import type {
  KnowledgeBaseItem,
  KnowledgeDocumentItem,
  KnowledgeSearchResult,
} from "../types";

export function KnowledgePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocumentItem[]>([]);
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState("");
  const [knowledgeName, setKnowledgeName] = useState("");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [statusText, setStatusText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const selectedKnowledgeBase = knowledgeBases.find(
    (item) => item.id === selectedKnowledgeBaseId,
  );
  const documentCount = knowledgeBases.reduce(
    (total, item) => total + item.documentCount,
    0,
  );
  const chunkCount = knowledgeBases.reduce(
    (total, item) => total + item.chunkCount,
    0,
  );

  async function loadKnowledgeWorkspace(nextSelectedId = selectedKnowledgeBaseId) {
    setIsLoading(true);
    const nextKnowledgeBases = await readKnowledgeBases();
    const resolvedSelectedId =
      nextSelectedId &&
      nextKnowledgeBases.some((item) => item.id === nextSelectedId)
        ? nextSelectedId
        : (nextKnowledgeBases[0]?.id ?? "");
    const nextDocuments = resolvedSelectedId
      ? await readKnowledgeDocuments(resolvedSelectedId)
      : [];

    setKnowledgeBases(nextKnowledgeBases);
    setSelectedKnowledgeBaseId(resolvedSelectedId);
    setDocuments(nextDocuments);
    setIsLoading(false);
  }

  async function createKnowledgeBase() {
    const name = knowledgeName.trim();
    if (!name) return;

    setIsLoading(true);
    try {
      const knowledgeBase = await createKnowledgeBaseRequest(name);
      setKnowledgeName("");
      setStatusText("知识库已创建");
      await loadKnowledgeWorkspace(knowledgeBase.id);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "创建知识库失败");
      setIsLoading(false);
    }
  }

  async function uploadDocument(file: File) {
    if (!selectedKnowledgeBaseId) return;

    setIsUploading(true);
    try {
      await uploadKnowledgeDocumentRequest(selectedKnowledgeBaseId, file);
      setStatusText("文档已上传");
      await loadKnowledgeWorkspace(selectedKnowledgeBaseId);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "上传文档失败");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function runSearch() {
    const trimmedQuery = query.trim();
    if (!selectedKnowledgeBaseId || !trimmedQuery) return;

    setIsSearching(true);
    try {
      const results = await searchKnowledgeBaseRequest(
        selectedKnowledgeBaseId,
        trimmedQuery,
      );
      setSearchResults(results);
      setStatusText(results.length > 0 ? "检索完成" : "未命中文档切片");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "检索失败");
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void readKnowledgeBases().then(async (nextKnowledgeBases) => {
      if (cancelled) return;
      const nextSelectedId = nextKnowledgeBases[0]?.id ?? "";
      const nextDocuments = nextSelectedId
        ? await readKnowledgeDocuments(nextSelectedId)
        : [];
      if (cancelled) return;
      setKnowledgeBases(nextKnowledgeBases);
      setSelectedKnowledgeBaseId(nextSelectedId);
      setDocuments(nextDocuments);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!selectedKnowledgeBaseId) {
      void Promise.resolve().then(() => {
        if (!cancelled) setDocuments([]);
      });
      return () => {
        cancelled = true;
      };
    }

    void readKnowledgeDocuments(selectedKnowledgeBaseId).then((nextDocuments) => {
      if (cancelled) return;
      setDocuments(nextDocuments);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedKnowledgeBaseId]);

  return (
    <PageFrame
      actions={
        <RefreshButton
          isLoading={isLoading}
          onClick={() => void loadKnowledgeWorkspace()}
        />
      }
      eyebrow="RAG"
      title="知识库"
    >
      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Panel>
          <div className="border-b border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-950">
              知识库
            </h3>
            <div className="mt-3 flex gap-2">
              <input
                className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                onChange={(event) => setKnowledgeName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void createKnowledgeBase();
                }}
                placeholder="新知识库名称"
                value={knowledgeName}
              />
              <button
                className="flex size-9 items-center justify-center rounded-md bg-indigo-600 text-white disabled:opacity-60"
                disabled={!knowledgeName.trim() || isLoading}
                onClick={() => void createKnowledgeBase()}
                title="创建知识库"
                type="button"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {knowledgeBases.map((item) => (
              <button
                className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                  selectedKnowledgeBaseId === item.id
                    ? "bg-indigo-50"
                    : "hover:bg-slate-50"
                }`}
                key={item.id}
                onClick={() => {
                  setSelectedKnowledgeBaseId(item.id);
                  setSearchResults([]);
                }}
                type="button"
              >
                <Database className="mt-0.5 shrink-0 text-indigo-600" size={16} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {item.name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {item.documentCount} 个文档 · {item.chunkCount} 个切片
                  </span>
                </span>
              </button>
            ))}
            {knowledgeBases.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">暂无知识库</div>
            ) : null}
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">知识库</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {knowledgeBases.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">文档</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {documentCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">切片</p>
                <p className="mt-1 text-xl font-semibold text-slate-950">
                  {chunkCount}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-slate-950">
                  {selectedKnowledgeBase?.name ?? "未选择知识库"}
                </h3>
                <p className="text-xs text-slate-500">
                  {statusText || "支持 txt、md、json 等文本类文件，当前限制 2MB"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadDocument(file);
                  }}
                  type="file"
                />
                <button
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-3 text-sm text-white disabled:opacity-60"
                  disabled={!selectedKnowledgeBaseId || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <CloudUpload size={15} />
                  {isUploading ? "上传中" : "上传文档"}
                </button>
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-950">文档</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">名称</th>
                    <th className="px-4 py-3 font-medium">类型</th>
                    <th className="px-4 py-3 font-medium">大小</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">切片</th>
                    <th className="px-4 py-3 font-medium">更新时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((document) => (
                    <tr key={document.id}>
                      <td className="max-w-md truncate px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <FileText className="shrink-0 text-slate-500" size={14} />
                          <span className="truncate font-medium text-slate-900">
                            {document.name || document.originalName}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {document.mimeType ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatFileSize(document.size)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                          {document.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {document.chunkCount}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(document.updatedAt)}
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-slate-500" colSpan={6}>
                        暂无文档
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel>
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-950">
                检索测试
              </h3>
            </div>
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
              <div className="flex flex-col gap-3">
                <textarea
                  className="min-h-32 resize-none rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="输入检索问题"
                  value={query}
                />
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm text-white disabled:opacity-60"
                  disabled={!selectedKnowledgeBaseId || !query.trim() || isSearching}
                  onClick={() => void runSearch()}
                  type="button"
                >
                  {isSearching ? (
                    <RefreshCw className="animate-spin" size={15} />
                  ) : (
                    <Search size={15} />
                  )}
                  检索
                </button>
              </div>
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <div
                    className="rounded-md border border-slate-200 bg-slate-50 p-3"
                    key={result.chunkId}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {result.documentName}
                      </p>
                      <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs text-slate-500">
                        {result.tokenCount ?? 0} token
                      </span>
                    </div>
                    <p className="line-clamp-4 text-sm leading-6 text-slate-600">
                      {result.content}
                    </p>
                  </div>
                ))}
                {searchResults.length === 0 ? (
                  <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
                    <FileSearch className="mr-2" size={16} />
                    暂无检索结果
                  </div>
                ) : null}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageFrame>
  );
}
