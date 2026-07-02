import type { ChatMessage } from "../types";

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((message) => (
        <article
          key={message.id}
          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-6 ${
              message.role === "user"
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-slate-50 text-slate-800"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {message.status === "streaming" ? (
              <span className="mt-2 inline-flex text-xs text-blue-600">
                生成中...
              </span>
            ) : null}
            {message.status === "interrupted" ? (
              <span className="mt-2 inline-flex text-xs text-orange-600">
                已打断
              </span>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
