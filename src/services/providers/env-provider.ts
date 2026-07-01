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
