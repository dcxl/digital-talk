export interface ComfyUIConfig {
  apiKey?: string;
  baseUrl?: string;
  mock: boolean;
  provider: "disabled" | "mock" | "remote";
  workflowId?: string;
}

function env(name: string) {
  return process.env[name]?.trim() || undefined;
}

export function getComfyUIConfig(): ComfyUIConfig {
  const provider = env("COMFYUI_PROVIDER");
  const baseUrl = env("COMFYUI_BASE_URL");
  const workflowId = env("COMFYUI_WORKFLOW_ID");
  const mock = provider === "mock" || env("COMFYUI_MOCK") === "true";

  if (mock) {
    return {
      mock: true,
      provider: "mock",
      workflowId: workflowId ?? "mock-character-appearance",
    };
  }

  if (baseUrl && workflowId) {
    return {
      apiKey: env("COMFYUI_API_KEY"),
      baseUrl,
      mock: false,
      provider: "remote",
      workflowId,
    };
  }

  return {
    mock: false,
    provider: "disabled",
  };
}

export function isComfyUIConfigured(config = getComfyUIConfig()) {
  return config.provider !== "disabled";
}
