import type { ChatMessage, RuntimeState } from "./types";

export const suggestions = [
  "介绍一下 Next Digital Human",
  "如何接入一个新的 LLM Provider？",
  "MVP 第一阶段应该先做什么？",
];

export const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好，我是 Next Digital Human 的原型助手。现在可以先体验文本对话、流式输出和 Avatar 状态变化。",
  status: "completed",
};

export const stateLabel: Record<RuntimeState, string> = {
  idle: "待机",
  listening: "录音中",
  transcribing: "转写中",
  thinking: "思考中",
  streaming: "生成中",
  synthesizing: "合成语音",
  speaking: "说话中",
  interrupted: "已打断",
  error: "异常",
};

export const stateTone: Record<RuntimeState, string> = {
  idle: "bg-slate-100 text-slate-700",
  listening: "bg-violet-100 text-violet-800",
  transcribing: "bg-fuchsia-100 text-fuchsia-800",
  thinking: "bg-amber-100 text-amber-800",
  streaming: "bg-blue-100 text-blue-800",
  synthesizing: "bg-cyan-100 text-cyan-800",
  speaking: "bg-emerald-100 text-emerald-800",
  interrupted: "bg-orange-100 text-orange-800",
  error: "bg-red-100 text-red-800",
};
