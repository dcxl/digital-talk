import { CircleStop, Mic, Play, Send, Volume2 } from "lucide-react";
import { suggestions } from "../constants";
import type { RuntimeState } from "../types";

interface ComposerProps {
  canSend: boolean;
  input: string;
  isBusy: boolean;
  onInputChange: (value: string) => void;
  onInterrupt: () => void;
  onSendMessage: (text: string) => void;
  onToggleListening: () => void;
  state: RuntimeState;
}

export function Composer({
  canSend,
  input,
  isBusy,
  onInputChange,
  onInterrupt,
  onSendMessage,
  onToggleListening,
  state,
}: ComposerProps) {
  return (
    <div className="border-t border-slate-200 p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            disabled={!canSend}
            onClick={() => onSendMessage(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          className={`flex size-11 shrink-0 items-center justify-center rounded-md border disabled:opacity-40 ${
            state === "listening"
              ? "border-violet-200 bg-violet-600 text-white"
              : "border-slate-200 text-slate-600"
          }`}
          disabled={!canSend && state !== "listening"}
          onClick={onToggleListening}
          title={state === "listening" ? "停止录音" : "语音输入"}
        >
          {state === "listening" ? <CircleStop size={18} /> : <Mic size={18} />}
        </button>
        <textarea
          className="min-h-11 flex-1 resize-none rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
          placeholder="输入一个问题，体验数字人对话闭环"
          rows={1}
          value={input}
          disabled={!canSend}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSendMessage(input);
            }
          }}
        />
        {isBusy || state === "speaking" ? (
          <button
            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-orange-600 text-white"
            onClick={onInterrupt}
            title="停止"
          >
            <CircleStop size={18} />
          </button>
        ) : (
          <button
            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white disabled:opacity-40"
            disabled={!input.trim() || !canSend}
            onClick={() => onSendMessage(input)}
            title="发送"
          >
            <Send size={18} />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Play size={14} /> stream
        </span>
        <span className="inline-flex items-center gap-1">
          <Volume2 size={14} /> tts
        </span>
        <span>Enter 发送，Shift + Enter 换行</span>
      </div>
    </div>
  );
}
