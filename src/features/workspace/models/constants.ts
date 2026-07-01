import type { ProviderFormState, ProviderType } from "../types";
import { bailianCosyVoiceDefaults } from "../lib/provider-defaults";

export const providerTypeTabs: Array<{
  description: string;
  label: string;
  value: ProviderType;
}> = [
  {
    description: "对话推理",
    label: "LLM",
    value: "llm",
  },
  {
    description: "向量检索",
    label: "Embedding",
    value: "embedding",
  },
  {
    description: "语音合成",
    label: "TTS",
    value: "tts",
  },
  {
    description: "语音识别",
    label: "ASR",
    value: "asr",
  },
];

export const providerOptionsByType: Record<
  ProviderType,
  Array<{
    label: string;
    value: string;
  }>
> = {
  asr: [
    { label: "Custom", value: "custom" },
    { label: "OpenAI Compatible", value: "openai-compatible" },
    { label: "Local", value: "local" },
  ],
  avatar: [{ label: "Custom", value: "custom" }],
  embedding: [
    { label: "OpenAI Compatible", value: "openai-compatible" },
    { label: "DeepSeek", value: "deepseek" },
    { label: "Custom", value: "custom" },
  ],
  llm: [
    { label: "DeepSeek", value: "deepseek" },
    { label: "OpenAI Compatible", value: "openai-compatible" },
    { label: "OpenAI", value: "openai" },
    { label: "Mock", value: "mock" },
    { label: "Custom", value: "custom" },
  ],
  tts: [
    { label: "阿里云百炼 CosyVoice", value: "bailian-cosyvoice" },
    { label: "OpenAI Compatible", value: "openai-compatible" },
    { label: "OpenAI", value: "openai" },
    { label: "Custom HTTP", value: "custom-http" },
    { label: "Mock", value: "mock" },
    { label: "Local", value: "local" },
  ],
};

const defaultModelByType: Record<ProviderType, string> = {
  asr: "",
  avatar: "",
  embedding: "text-embedding-3-small",
  llm: "deepseek-chat",
  tts: bailianCosyVoiceDefaults.model,
};

export function createBlankProviderForm(type: ProviderType): ProviderFormState {
  return {
    apiKey: "",
    baseUrl: type === "tts" ? bailianCosyVoiceDefaults.baseUrl : "",
    enabled: true,
    model: defaultModelByType[type],
    name: `New ${type.toUpperCase()} Provider`,
    provider: providerOptionsByType[type][0]?.value ?? "custom",
    type,
    ...(type === "tts"
      ? {
          format: "mp3" as const,
          voice: bailianCosyVoiceDefaults.voice,
        }
      : {}),
  };
}
