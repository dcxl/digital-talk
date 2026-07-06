import type { PromptFormState, PromptType } from "../types";

export const promptTypeTabs: Array<{
  label: string;
  value: PromptType;
}> = [
  { label: "系统", value: "system" },
  { label: "对话", value: "chat" },
  { label: "摘要", value: "summary" },
  { label: "翻译", value: "translate" },
  { label: "自定义", value: "custom" },
];

export function createBlankPromptForm(type: PromptType): PromptFormState {
  return {
    changelog: "",
    content:
      type === "system"
        ? "你是 {{char_name}}，请用简洁自然的中文回答用户。"
        : "",
    description: "",
    name: `新建 ${type} 提示词`,
    testMessage: "你是谁？",
    type,
    variableValues: {
      char_name: "AI 角色助手",
      user_name: "用户",
    },
    variables:
      type === "system"
        ? [
            {
              defaultValue: "AI 角色助手",
              name: "char_name",
              required: true,
            },
            {
              defaultValue: "用户",
              name: "user_name",
              required: false,
            },
          ]
        : [],
  };
}
