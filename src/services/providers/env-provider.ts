export function getEnvLLMProvider() {
  const provider = process.env.LLM_PROVIDER?.trim() || "mock";

  return {
    id: "env-default-llm",
    type: "llm",
    provider,
    name: provider === "mock" ? "Mock LLM" : "Environment LLM",
    enabled: true,
    baseUrl: process.env.DEFAULT_LLM_BASE_URL || null,
    model: process.env.DEFAULT_LLM_MODEL || null,
    hasApiKey: Boolean(process.env.DEFAULT_LLM_API_KEY),
    source: "env",
  };
}

export function getEnvTTSProvider() {
  const provider = process.env.TTS_PROVIDER?.trim() || "mock";
  const name =
    provider === "mock"
      ? "Mock TTS"
      : provider === "bailian-cosyvoice"
        ? "Bailian CosyVoice TTS"
        : "Environment TTS";

  return {
    id: "env-default-tts",
    type: "tts",
    provider,
    name,
    enabled: true,
    baseUrl: process.env.DEFAULT_TTS_BASE_URL || null,
    model: process.env.DEFAULT_TTS_MODEL || null,
    options: {
      format: process.env.DEFAULT_TTS_FORMAT || "mp3",
      voice: process.env.DEFAULT_TTS_VOICE || "",
    },
    hasApiKey: Boolean(process.env.DEFAULT_TTS_API_KEY),
    source: "env",
  };
}

export function getEnvASRProvider() {
  const provider = process.env.ASR_PROVIDER?.trim() || "mock";

  return {
    id: "env-default-asr",
    type: "asr",
    provider,
    name: provider === "mock" ? "Mock ASR" : "Environment ASR",
    enabled: true,
    baseUrl: process.env.DEFAULT_ASR_BASE_URL || null,
    model: process.env.DEFAULT_ASR_MODEL || null,
    options: {
      language: process.env.DEFAULT_ASR_LANGUAGE || "zh",
    },
    hasApiKey: Boolean(process.env.DEFAULT_ASR_API_KEY),
    source: "env",
  };
}
