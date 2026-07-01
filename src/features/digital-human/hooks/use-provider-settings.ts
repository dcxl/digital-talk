import { useCallback, useState } from "react";
import type { AsyncStatus, ProviderFormState, ProviderSummary } from "../types";

const initialProviderForm: ProviderFormState = {
  name: "DeepSeek",
  provider: "openai-compatible",
  baseUrl: "",
  model: "",
  apiKey: "",
};

export function useProviderSettings() {
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [providerForm, setProviderForm] =
    useState<ProviderFormState>(initialProviderForm);
  const [providerStatus, setProviderStatus] = useState<AsyncStatus>("idle");
  const [providerStatusText, setProviderStatusText] = useState("");

  function updateProviderForm(patch: Partial<ProviderFormState>) {
    setProviderForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  const loadProviders = useCallback(async () => {
    setProviderStatus("loading");

    try {
      const response = await fetch("/api/providers");
      const payload = (await response.json()) as {
        data?: {
          providers?: ProviderSummary[];
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      const nextProviders = payload.data?.providers ?? [];
      const editableProvider =
        nextProviders.find((provider) => provider.source !== "env") ??
        nextProviders[0];

      setProviders(nextProviders);
      if (editableProvider) {
        setProviderForm((current) => ({
          id:
            editableProvider.source === "env" ? undefined : editableProvider.id,
          name:
            editableProvider.source === "env"
              ? "DeepSeek"
              : editableProvider.name || current.name,
          provider:
            editableProvider.provider === "openai"
              ? "openai-compatible"
              : editableProvider.provider || current.provider,
          baseUrl: editableProvider.baseUrl ?? current.baseUrl,
          model: editableProvider.model ?? current.model,
          apiKey: "",
        }));
      }
      setProviderStatus("success");
      setProviderStatusText("配置已加载");
    } catch (error) {
      setProviderStatus("error");
      setProviderStatusText(
        error instanceof Error ? error.message : "加载 Provider 失败",
      );
    }
  }, []);

  async function testProvider() {
    setProviderStatus("loading");

    try {
      const endpoint = providerForm.id
        ? `/api/providers/${providerForm.id}/test`
        : "/api/providers/test";
      const response = await fetch(endpoint, {
        body: JSON.stringify(
          providerForm.id
            ? {
                input: "回复 provider ok",
              }
            : {
                apiKey: providerForm.apiKey,
                baseUrl: providerForm.baseUrl,
                message: "回复 provider ok",
                model: providerForm.model,
                provider: providerForm.provider,
                type: "llm",
              },
        ),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: {
          result?: {
            latencyMs: number;
          };
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      setProviderStatus("success");
      setProviderStatusText(
        `测试通过 ${payload.data?.result?.latencyMs ?? 0}ms`,
      );
    } catch (error) {
      setProviderStatus("error");
      setProviderStatusText(
        error instanceof Error ? error.message : "Provider 测试失败",
      );
    }
  }

  async function saveProvider() {
    setProviderStatus("loading");

    try {
      const response = await fetch("/api/providers", {
        body: JSON.stringify({
          id: providerForm.id,
          type: "llm",
          provider: providerForm.provider,
          name: providerForm.name,
          baseUrl: providerForm.baseUrl,
          model: providerForm.model,
          apiKey: providerForm.apiKey,
          enabled: true,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: {
          provider?: ProviderSummary;
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      setProviderForm((current) => ({
        ...current,
        id: payload.data?.provider?.id ?? current.id,
        apiKey: "",
      }));
      setProviderStatus("success");
      setProviderStatusText("配置已保存");
      await loadProviders();
    } catch (error) {
      setProviderStatus("error");
      setProviderStatusText(
        error instanceof Error ? error.message : "Provider 保存失败",
      );
    }
  }

  return {
    loadProviders,
    providerForm,
    providers,
    providerStatus,
    providerStatusText,
    saveProvider,
    testProvider,
    updateProviderForm,
  };
}
