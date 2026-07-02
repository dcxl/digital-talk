import type {
  AvatarFormState,
  AvatarAssetItem,
  AvatarGenerationJobItem,
  AvatarPreviewResult,
  AvatarProfileItem,
  ConversationItem,
  DashboardSummary,
  GeneralSettingsState,
  KnowledgeBaseItem,
  KnowledgeDocumentItem,
  KnowledgeSearchResult,
  PromptFormState,
  PromptTemplateItem,
  PromptTestResult,
  ProviderFormState,
  ProviderItem,
  ProviderTestResult,
  WorkspaceSnapshot,
} from "../types";
import { bailianCosyVoiceDefaults } from "./provider-defaults";

export const emptySnapshot: WorkspaceSnapshot = {
  conversations: [],
  knowledgeBases: [],
  providers: [],
};

export const emptyDashboardSummary: DashboardSummary = {
  metrics: {
    activeProviderCount: 0,
    avgLatencyMs: 0,
    conversationCount: 0,
    knowledgeChunkCount: 0,
    knowledgeDocumentCount: 0,
    providerCount: 0,
    tokensToday: 0,
  },
  recentConversations: [],
  runtimeStatus: [],
  systemInfo: {
    environment: "development",
    persistenceEnabled: false,
    uptimeSeconds: 0,
    version: "0.1.0",
  },
  tokenUsage: [],
};

export async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url);
  if (!response.ok) return null;
  return (await response.json()) as T;
}

export async function readWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const [conversationPayload, knowledgePayload, providerPayload] =
    await Promise.all([
      fetchJson<{ data?: { conversations?: ConversationItem[] } }>(
        "/api/conversations",
      ),
      fetchJson<{ data?: { knowledgeBases?: KnowledgeBaseItem[] } }>(
        "/api/knowledge-bases",
      ),
      fetchJson<{ data?: { providers?: ProviderItem[] } }>("/api/providers"),
    ]);

  return {
    conversations: conversationPayload?.data?.conversations ?? [],
    knowledgeBases: knowledgePayload?.data?.knowledgeBases ?? [],
    providers: providerPayload?.data?.providers ?? [],
  };
}

export async function readDashboardSummary() {
  const payload =
    await fetchJson<{ data?: DashboardSummary }>("/api/dashboard/summary");

  return payload?.data ?? emptyDashboardSummary;
}

export async function readConversations(input: {
  q?: string;
  starred?: boolean;
  status: string;
}) {
  const params = new URLSearchParams({
    limit: "100",
    status: input.status,
  });
  if (input.q) params.set("q", input.q);
  if (input.starred) params.set("starred", "true");

  const payload = await fetchJson<{ data?: { conversations?: ConversationItem[] } }>(
    `/api/conversations?${params.toString()}`,
  );

  return payload?.data?.conversations ?? [];
}

export async function readKnowledgeBases() {
  const payload =
    await fetchJson<{ data?: { knowledgeBases?: KnowledgeBaseItem[] } }>(
      "/api/knowledge-bases",
    );
  return payload?.data?.knowledgeBases ?? [];
}

export async function readProviders() {
  const payload =
    await fetchJson<{ data?: { providers?: ProviderItem[] } }>("/api/providers");
  return payload?.data?.providers ?? [];
}

function getApiErrorMessage(
  payload: { error?: { message?: string } },
  fallback: string,
) {
  return payload.error?.message ?? fallback;
}

export async function saveProviderConfigRequest(input: ProviderFormState) {
  const body: Record<string, unknown> = {
    type: input.type,
    provider: input.provider.trim(),
    name: input.name.trim(),
    baseUrl: input.baseUrl.trim(),
    model: input.model.trim(),
    enabled: input.enabled,
  };

  if (input.type === "tts") {
    body.options = {
      format: input.format ?? "mp3",
      voice:
        input.voice?.trim() ||
        (input.provider === "bailian-cosyvoice"
          ? bailianCosyVoiceDefaults.voice
          : "alloy"),
    };
  }

  if (input.id && input.source !== "env") body.id = input.id;
  if (input.apiKey.trim()) body.apiKey = input.apiKey.trim();

  const response = await fetch("/api/providers", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: {
      provider?: ProviderItem;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.provider) {
    throw new Error(getApiErrorMessage(payload, "保存 Provider 失败"));
  }

  return payload.data.provider;
}

export async function testProviderConfigRequest(input: ProviderFormState) {
  if (input.type !== "llm" && input.type !== "tts") {
    throw new Error("当前仅支持 LLM / TTS Provider 测试");
  }

  const isEnvFallback = input.source === "env" && !input.apiKey.trim();
  const testText =
    input.type === "tts" ? "你好，我是数字人语音测试。" : "回复 provider ok";
  const endpoint =
    input.id && input.source !== "env"
      ? `/api/providers/${input.id}/test`
      : "/api/providers/test";
  const body =
    input.id && input.source !== "env"
      ? {
          input: testText,
        }
      : isEnvFallback
        ? {
            message: testText,
            type: input.type,
          }
        : {
            apiKey: input.apiKey.trim(),
            baseUrl: input.baseUrl.trim(),
            format: input.format ?? "mp3",
            message: testText,
            model: input.model.trim(),
            provider: input.provider.trim(),
            type: input.type,
            voice: input.voice?.trim(),
          };

  const response = await fetch(endpoint, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: {
      result?: ProviderTestResult;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.result) {
    throw new Error(getApiErrorMessage(payload, "服务商测试失败"));
  }

  return payload.data.result;
}

export async function readKnowledgeDocuments(knowledgeBaseId: string) {
  const payload =
    await fetchJson<{ data?: { documents?: KnowledgeDocumentItem[] } }>(
      `/api/knowledge-bases/${knowledgeBaseId}/documents`,
    );
  return payload?.data?.documents ?? [];
}

export async function createKnowledgeBaseRequest(name: string) {
  const response = await fetch("/api/knowledge-bases", {
    body: JSON.stringify({ name }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: {
      knowledgeBase?: KnowledgeBaseItem;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.knowledgeBase) {
    throw new Error(getApiErrorMessage(payload, "创建知识库失败"));
  }

  return payload.data.knowledgeBase;
}

export async function uploadKnowledgeDocumentRequest(
  knowledgeBaseId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/documents`, {
    body: formData,
    method: "POST",
  });
  const payload = (await response.json()) as {
    error?: {
      message?: string;
    };
  };

  if (!response.ok) throw new Error(getApiErrorMessage(payload, "上传文档失败"));
}

export async function searchKnowledgeBaseRequest(
  knowledgeBaseId: string,
  query: string,
) {
  const response = await fetch(`/api/knowledge-bases/${knowledgeBaseId}/search`, {
    body: JSON.stringify({
      limit: 8,
      query,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: {
      results?: KnowledgeSearchResult[];
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok) throw new Error(getApiErrorMessage(payload, "检索失败"));

  return payload.data?.results ?? [];
}

export async function readPrompts() {
  const payload =
    await fetchJson<{ data?: { prompts?: PromptTemplateItem[] } }>(
      "/api/prompts",
    );
  return payload?.data?.prompts ?? [];
}

function getPromptPayload(input: PromptFormState) {
  return {
    type: input.type,
    name: input.name.trim(),
    description: input.description.trim(),
    content: input.content.trim(),
    variables: input.variables,
  };
}

export async function createPromptRequest(input: PromptFormState) {
  const response = await fetch("/api/prompts", {
    body: JSON.stringify(getPromptPayload(input)),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: {
      prompt?: PromptTemplateItem;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.prompt) {
    throw new Error(getApiErrorMessage(payload, "创建 Prompt 失败"));
  }

  return payload.data.prompt;
}

export async function createPromptVersionRequest(input: PromptFormState) {
  if (!input.id) throw new Error("提示词 id 必填");

  const response = await fetch(`/api/prompts/${input.id}/versions`, {
    body: JSON.stringify({
      ...getPromptPayload(input),
      changelog: input.changelog.trim(),
      setCurrent: true,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: {
      prompt?: PromptTemplateItem;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.prompt) {
    throw new Error(getApiErrorMessage(payload, "保存 Prompt 版本失败"));
  }

  return payload.data.prompt;
}

export async function testPromptRequest(input: PromptFormState) {
  if (!input.id) throw new Error("请先保存 Prompt");

  const response = await fetch(`/api/prompts/${input.id}/test`, {
    body: JSON.stringify({
      message: input.testMessage,
      variables: input.variableValues,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: PromptTestResult;
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data) {
    throw new Error(getApiErrorMessage(payload, "提示词测试失败"));
  }

  return payload.data;
}

export async function readAvatarProfiles() {
  const payload =
    await fetchJson<{ data?: { profiles?: AvatarProfileItem[] } }>(
      "/api/avatar-profiles",
    );
  return payload?.data?.profiles ?? [];
}

export async function readAvatarAssets() {
  const payload =
    await fetchJson<{ data?: { assets?: AvatarAssetItem[] } }>(
      "/api/avatar-assets",
    );
  return payload?.data?.assets ?? [];
}

function getAvatarPayload(input: AvatarFormState) {
  const providerConfigId =
    input.providerConfigId && !input.providerConfigId.startsWith("env-")
      ? input.providerConfigId
      : null;
  const voiceProviderId =
    input.voiceProviderId && !input.voiceProviderId.startsWith("env-")
      ? input.voiceProviderId
      : null;
  const currentConfig =
    input.config && typeof input.config === "object" && !Array.isArray(input.config)
      ? (input.config as Record<string, unknown>)
      : {};

  return {
    id: input.id,
    name: input.name.trim(),
    driver: input.driver,
    providerConfigId,
    voiceProviderId,
    voice: input.voice.trim() || null,
    language: input.language.trim() || null,
    background: input.background.trim() || null,
    previewImageUrl: input.previewImageUrl.trim() || null,
    isDefault: input.isDefault,
    status: input.status,
    config: {
      ...currentConfig,
      scene: input.background.trim() || "studio",
    },
  };
}

export async function saveAvatarProfileRequest(input: AvatarFormState) {
  const response = await fetch(
    input.id ? `/api/avatar-profiles/${input.id}` : "/api/avatar-profiles",
    {
      body: JSON.stringify(getAvatarPayload(input)),
      headers: {
        "Content-Type": "application/json",
      },
      method: input.id ? "PATCH" : "POST",
    },
  );
  const payload = (await response.json()) as {
    data?: {
      profile?: AvatarProfileItem;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.profile) {
    throw new Error(getApiErrorMessage(payload, "保存 Avatar 失败"));
  }

  return payload.data.profile;
}

export async function previewAvatarProfileRequest(input: {
  profileId: string;
  state: AvatarPreviewResult["state"];
  text: string;
}) {
  const response = await fetch(
    `/api/avatar-profiles/${input.profileId}/preview`,
    {
      body: JSON.stringify({
        state: input.state,
        text: input.text,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );
  const payload = (await response.json()) as {
    data?: {
      preview?: AvatarPreviewResult;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.preview) {
    throw new Error(getApiErrorMessage(payload, "数字人预览失败"));
  }

  return payload.data.preview;
}

export async function uploadAvatarAssetRequest(input: {
  file: File;
  name?: string;
  profileId?: string;
}) {
  const formData = new FormData();
  formData.append("file", input.file);
  if (input.name) formData.append("name", input.name);
  if (input.profileId) formData.append("profileId", input.profileId);

  const response = await fetch("/api/avatar-assets/upload", {
    body: formData,
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: {
      asset?: AvatarAssetItem;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.asset) {
    throw new Error(getApiErrorMessage(payload, "上传 Avatar 资产失败"));
  }

  return payload.data.asset;
}

export async function createAvatarGenerationJobRequest(input: {
  negativePrompt?: string;
  profileId?: string;
  prompt: string;
  style?: string;
}) {
  const response = await fetch("/api/avatar-generation-jobs", {
    body: JSON.stringify({
      negativePrompt: input.negativePrompt?.trim() || undefined,
      profileId: input.profileId,
      prompt: input.prompt.trim(),
      style: input.style?.trim() || undefined,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: {
      asset?: AvatarAssetItem;
      job?: AvatarGenerationJobItem;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.job) {
    throw new Error(getApiErrorMessage(payload, "生成 Avatar 失败"));
  }

  return {
    asset: payload.data.asset,
    job: payload.data.job,
  };
}

export async function retryAvatarGenerationJobRequest(jobId: string) {
  const response = await fetch(`/api/avatar-generation-jobs/${jobId}/retry`, {
    method: "POST",
  });
  const payload = (await response.json()) as {
    data?: {
      asset?: AvatarAssetItem;
      job?: AvatarGenerationJobItem;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.job) {
    throw new Error(getApiErrorMessage(payload, "重试 Avatar 生成失败"));
  }

  return {
    asset: payload.data.asset,
    job: payload.data.job,
  };
}

export async function updateAvatarAssetRequest(
  assetId: string,
  input: Partial<Pick<AvatarAssetItem, "name" | "profileId" | "publicUrl">>,
) {
  const response = await fetch(`/api/avatar-assets/${assetId}`, {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
  const payload = (await response.json()) as {
    data?: {
      asset?: AvatarAssetItem;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.asset) {
    throw new Error(getApiErrorMessage(payload, "更新 Avatar 资产失败"));
  }

  return payload.data.asset;
}

export const defaultGeneralSettings: GeneralSettingsState = {
  autoSave: true,
  language: "zh-CN",
  theme: "system",
  timeZone: "Asia/Shanghai",
  workspaceName: "Next Digital Human",
};

export async function readSettings() {
  const payload =
    await fetchJson<{ data?: { general?: GeneralSettingsState } }>(
      "/api/settings",
    );
  return payload?.data?.general ?? defaultGeneralSettings;
}

export async function saveSettingsRequest(input: GeneralSettingsState) {
  const response = await fetch("/api/settings", {
    body: JSON.stringify({
      general: input,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
  const payload = (await response.json()) as {
    data?: {
      general?: GeneralSettingsState;
    };
    error?: {
      message?: string;
    };
  };

  if (!response.ok || !payload.data?.general) {
    throw new Error(getApiErrorMessage(payload, "保存设置失败"));
  }

  return payload.data.general;
}

export async function exportWorkspaceRequest() {
  const response = await fetch("/api/settings/export");
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: {
        message?: string;
      };
    };
    throw new Error(getApiErrorMessage(payload, "导出失败"));
  }

  return response.blob();
}
