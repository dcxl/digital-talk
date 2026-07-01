import type { PromptType } from "@/generated/prisma/client";

export const DEFAULT_SYSTEM_PROMPT = [
  "你是 {{char_name}}，一个生产级 AI 数字人助手。",
  "你需要用简洁、准确、自然的中文回答用户。",
  "如果知识库上下文不足，请明确说明不确定，不要编造。",
].join("\n");

export const defaultPromptVariables = [
  {
    name: "char_name",
    required: true,
    defaultValue: "Next Digital Human",
  },
  {
    name: "user_name",
    required: false,
    defaultValue: "User",
  },
];

export const promptTypes = new Set<PromptType>([
  "system",
  "chat",
  "summary",
  "translate",
  "custom",
]);
