import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  readProviders,
  saveProviderConfigRequest,
  testProviderConfigRequest,
} from "../lib/api";
import type {
  AsyncStatus,
  ProviderFormState,
  ProviderItem,
  ProviderType,
} from "../types";
import { createBlankProviderForm } from "./constants";

function getStringOption(options: unknown, key: string) {
  if (!options || typeof options !== "object") return undefined;

  const value = (options as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toProviderForm(provider: ProviderItem): ProviderFormState {
  const format = getStringOption(provider.options, "format");

  return {
    apiKey: "",
    baseUrl: provider.baseUrl ?? "",
    enabled: provider.enabled,
    format: format === "wav" ? "wav" : "mp3",
    hasApiKey: provider.hasApiKey,
    id: provider.source === "env" ? undefined : provider.id,
    model: provider.model ?? "",
    name: provider.name,
    provider: provider.provider,
    source: provider.source,
    type: provider.type,
    voice: getStringOption(provider.options, "voice") ?? "",
  };
}

function selectProviderForType(
  providers: ProviderItem[],
  type: ProviderType,
  preferredId?: string,
) {
  const candidates = providers.filter((provider) => provider.type === type);
  return (
    candidates.find((provider) => provider.id === preferredId) ??
    candidates[0] ??
    null
  );
}

export function useProviderConfigs() {
  const [activeType, setActiveType] = useState<ProviderType>("llm");
  const [form, setForm] = useState<ProviderFormState>(
    createBlankProviderForm("llm"),
  );
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [statusText, setStatusText] = useState("");
  const activeTypeRef = useRef(activeType);
  const selectedProviderIdRef = useRef(selectedProviderId);

  const visibleProviders = useMemo(
    () => providers.filter((provider) => provider.type === activeType),
    [activeType, providers],
  );

  const providerCounts = useMemo(
    () =>
      providers.reduce<Record<string, number>>((result, provider) => {
        result[provider.type] = (result[provider.type] ?? 0) + 1;
        return result;
      }, {}),
    [providers],
  );

  const loadProviders = useCallback(
    async (preferredId?: string, preferredType?: ProviderType) => {
      const resolvedType = preferredType ?? activeTypeRef.current;
      const resolvedId = preferredId ?? selectedProviderIdRef.current;

      setStatus("loading");

      try {
        const nextProviders = await readProviders();
        const selected = selectProviderForType(
          nextProviders,
          resolvedType,
          resolvedId,
        );

        setProviders(nextProviders);
        activeTypeRef.current = resolvedType;
        selectedProviderIdRef.current = selected?.id ?? "";
        setActiveType(resolvedType);
        setSelectedProviderId(selected?.id ?? "");
        setForm(
          selected ? toProviderForm(selected) : createBlankProviderForm(resolvedType),
        );
        setStatus("success");
        setStatusText("服务商配置已加载");
      } catch (error) {
        setStatus("error");
        setStatusText(
          error instanceof Error ? error.message : "服务商配置加载失败",
        );
      }
    },
    [],
  );

  function updateForm(patch: Partial<ProviderFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function selectProviderType(type: ProviderType) {
    const selected = selectProviderForType(providers, type);

    activeTypeRef.current = type;
    selectedProviderIdRef.current = selected?.id ?? "";
    setActiveType(type);
    setSelectedProviderId(selected?.id ?? "");
    setForm(selected ? toProviderForm(selected) : createBlankProviderForm(type));
  }

  function selectProvider(provider: ProviderItem) {
    activeTypeRef.current = provider.type;
    selectedProviderIdRef.current = provider.id;
    setSelectedProviderId(provider.id);
    setActiveType(provider.type);
    setForm(toProviderForm(provider));
  }

  function startCreateProvider(type = activeType) {
    activeTypeRef.current = type;
    selectedProviderIdRef.current = "";
    setSelectedProviderId("");
    setForm(createBlankProviderForm(type));
    setStatusText("创建新的服务商配置");
  }

  async function saveProvider() {
    setStatus("loading");

    try {
      const provider = await saveProviderConfigRequest(form);

      setStatus("success");
      setStatusText("服务商配置已保存");
      await loadProviders(provider.id, provider.type);
    } catch (error) {
      setStatus("error");
      setStatusText(
        error instanceof Error ? error.message : "服务商配置保存失败",
      );
    }
  }

  async function testProvider() {
    setStatus("loading");

    try {
      const result = await testProviderConfigRequest(form);

      setStatus("success");
      setStatusText(`测试通过 ${result.latencyMs}ms`);
      if (form.id && form.source !== "env") {
        await loadProviders(form.id, form.type);
      }
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "服务商测试失败");
    }
  }

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (!cancelled) void loadProviders("", "llm");
    });

    return () => {
      cancelled = true;
    };
  }, [loadProviders]);

  useEffect(() => {
    activeTypeRef.current = activeType;
  }, [activeType]);

  useEffect(() => {
    selectedProviderIdRef.current = selectedProviderId;
  }, [selectedProviderId]);

  return {
    activeType,
    form,
    isBusy: status === "loading",
    loadProviders,
    providerCounts,
    providers,
    saveProvider,
    selectProvider,
    selectProviderType,
    selectedProviderId,
    startCreateProvider,
    status,
    statusText,
    testProvider,
    updateForm,
    visibleProviders,
  };
}
