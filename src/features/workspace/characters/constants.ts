import type {
  CharacterFormState,
  CharacterRoleType,
  CharacterSceneFormState,
  CharacterSceneType,
} from "../types";

export const characterRoleOptions: Array<{
  label: string;
  value: CharacterRoleType;
}> = [
  { label: "知识库助手", value: "knowledge_assistant" },
  { label: "主播角色", value: "host" },
  { label: "闲聊陪伴", value: "chat_companion" },
  { label: "业务助手", value: "business_assistant" },
  { label: "自定义", value: "custom" },
];

export const characterRoleLabels = Object.fromEntries(
  characterRoleOptions.map((option) => [option.value, option.label]),
) as Record<CharacterRoleType, string>;

export const characterStatusLabels = {
  active: "已启用",
  deleted: "已删除",
  disabled: "已禁用",
  draft: "草稿",
} as const;

export const characterSceneTypeOptions: Array<{
  label: string;
  value: CharacterSceneType;
}> = [
  { label: "知识库助手", value: "knowledge_assistant" },
  { label: "主播场景", value: "host" },
  { label: "闲聊陪伴", value: "chat_companion" },
  { label: "业务助手", value: "business_assistant" },
  { label: "自定义", value: "custom" },
];

export const characterSceneTypeLabels = Object.fromEntries(
  characterSceneTypeOptions.map((option) => [option.value, option.label]),
) as Record<CharacterSceneType, string>;

export function createBlankCharacterForm(): CharacterFormState {
  return {
    appearanceProfileId: "",
    description: "",
    language: "zh",
    name: "新 AI 角色",
    roleType: "custom",
    status: "draft",
    tagsText: "",
    voice: "",
    voiceProviderId: "",
  };
}

export function createBlankCharacterSceneForm(): CharacterSceneFormState {
  return {
    description: "",
    inputMode: "text",
    name: "新场景",
    outputMode: "text",
    type: "custom",
  };
}
