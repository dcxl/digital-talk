"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Archive, ArrowRight, RotateCcw, Star, Trash2 } from "lucide-react";
import { PageFrame, Panel, RefreshButton } from "../components/page-frame";
import { readConversations } from "../lib/api";
import { formatDate } from "../lib/format";
import type { ConversationItem } from "../types";

export function HistoryPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [starredOnly, setStarredOnly] = useState(false);

  async function loadHistory() {
    setIsLoading(true);
    setConversations(
      await readConversations({
        q: query.trim() || undefined,
        starred: starredOnly,
        status,
      }),
    );
    setIsLoading(false);
  }

  async function updateHistoryConversation(
    conversationId: string,
    body: Record<string, boolean | string>,
  ) {
    await fetch(`/api/conversations/${conversationId}`, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    });
    await loadHistory();
  }

  async function deleteHistoryConversation(conversationId: string) {
    await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
    });
    await loadHistory();
  }

  useEffect(() => {
    let cancelled = false;

    void readConversations({
      q: query.trim() || undefined,
      starred: starredOnly,
      status,
    }).then((nextConversations) => {
      if (cancelled) return;
      setConversations(nextConversations);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [query, starredOnly, status]);

  const statusTabs = useMemo(
    () => [
      { label: "Active", value: "active" },
      { label: "Archived", value: "archived" },
      { label: "Deleted", value: "deleted" },
    ],
    [],
  );

  return (
    <PageFrame
      actions={<RefreshButton isLoading={isLoading} onClick={loadHistory} />}
      eyebrow="Sessions"
      title="会话历史"
    >
      <Panel>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 lg:max-w-md"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索会话"
            value={query}
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
              {statusTabs.map((tab) => (
                <button
                  className={`h-8 rounded px-3 text-xs font-medium ${
                    status === tab.value
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500"
                  }`}
                  key={tab.value}
                  onClick={() => setStatus(tab.value)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm ${
                starredOnly
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              onClick={() => setStarredOnly((current) => !current)}
              type="button"
            >
              <Star size={15} />
              Starred
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Messages</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <td className="max-w-md truncate px-4 py-3 font-medium text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      {conversation.isStarred ? (
                        <Star
                          className="shrink-0 fill-indigo-500 text-indigo-500"
                          size={14}
                        />
                      ) : null}
                      <span className="truncate">{conversation.title}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {conversation._count?.messages ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(conversation.lastMessageAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      {conversation.status ?? status}
                    </span>
                  </td>
                  <td className="flex gap-2 px-4 py-3">
                    <Link
                      className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-700"
                      href="/conversation"
                      title="打开"
                    >
                      <ArrowRight size={13} />
                    </Link>
                    <button
                      className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-700"
                      onClick={() =>
                        void updateHistoryConversation(conversation.id, {
                          isStarred: !conversation.isStarred,
                        })
                      }
                      title={conversation.isStarred ? "取消收藏" : "收藏"}
                      type="button"
                    >
                      <Star size={13} />
                    </button>
                    {status === "archived" || status === "deleted" ? (
                      <button
                        className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-700"
                        onClick={() =>
                          void updateHistoryConversation(conversation.id, {
                            status: "active",
                          })
                        }
                        title="恢复"
                        type="button"
                      >
                        <RotateCcw size={13} />
                      </button>
                    ) : (
                      <button
                        className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-700"
                        onClick={() =>
                          void updateHistoryConversation(conversation.id, {
                            status: "archived",
                          })
                        }
                        title="归档"
                        type="button"
                      >
                        <Archive size={13} />
                      </button>
                    )}
                    {status !== "deleted" ? (
                      <button
                        className="inline-flex size-8 items-center justify-center rounded-md border border-red-200 text-red-600"
                        onClick={() => void deleteHistoryConversation(conversation.id)}
                        title="删除"
                        type="button"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {conversations.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={5}>
                    暂无会话
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </PageFrame>
  );
}
