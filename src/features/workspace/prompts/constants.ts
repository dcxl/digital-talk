import type { PromptFormState, PromptType } from "../types";

export const promptTypeTabs: Array<{
  label: string;
  value: PromptType;
}> = [
  { label: "System", value: "system" },
  { label: "Chat", value: "chat" },
  { label: "Summary", value: "summary" },
  { label: "Translate", value: "translate" },
  { label: "Custom", value: "custom" },
];

export function createBlankPromptForm(type: PromptType): PromptFormState {
  return {
    changelog: "",
    content:
      type === "system"
        ? "你是 {{char_name}}，请用简洁自然的中文回答用户。"
        : "",
    description: "",
    name: `New ${type} prompt`,
    testMessage: "你是谁？",
    type,
    variableValues: {
      char_name: "Next Digital Human",
      user_name: "User",
    },
    variables:
      type === "system"
        ? [
            {
              defaultValue: "Next Digital Human",
              name: "char_name",
              required: true,
            },
            {
              defaultValue: "User",
              name: "user_name",
              required: false,
            },
          ]
        : [],
  };
}
