import { useEffect, useMemo, useState } from "react";
import {
  previewAvatarProfileRequest,
  readAvatarProfiles,
  readProviders,
  saveAvatarProfileRequest,
} from "../lib/api";
import type {
  AsyncStatus,
  AvatarFormState,
  AvatarPreviewResult,
  AvatarPreviewState,
  AvatarProfileItem,
  ProviderItem,
} from "../types";
import { createBlankAvatarForm } from "./constants";

function toAvatarForm(profile: AvatarProfileItem): AvatarFormState {
  return {
    background: profile.background ?? "studio",
    driver: profile.driver,
    id: profile.id,
    isDefault: profile.isDefault,
    language: profile.language ?? "zh-CN",
    name: profile.name,
    previewImageUrl: profile.previewImageUrl ?? "",
    providerConfigId: profile.providerConfigId ?? "",
    status: profile.status,
    voice: profile.voice ?? "default",
    voiceProviderId: profile.voiceProviderId ?? "",
  };
}

function selectAvatar(
  profiles: AvatarProfileItem[],
  preferredId?: string,
) {
  return (
    profiles.find((profile) => profile.id === preferredId) ??
    profiles.find((profile) => profile.isDefault) ??
    profiles[0] ??
    null
  );
}

export function useAvatarManagement() {
  const [form, setForm] = useState<AvatarFormState>(createBlankAvatarForm());
  const [profiles, setProfiles] = useState<AvatarProfileItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [preview, setPreview] = useState<AvatarPreviewResult | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [statusText, setStatusText] = useState("");

  const avatarProviders = useMemo(
    () => providers.filter((provider) => provider.type === "avatar"),
    [providers],
  );
  const voiceProviders = useMemo(
    () => providers.filter((provider) => provider.type === "tts"),
    [providers],
  );

  async function loadAvatarWorkspace(preferredId = selectedProfileId) {
    setStatus("loading");

    try {
      const [nextProfiles, nextProviders] = await Promise.all([
        readAvatarProfiles(),
        readProviders(),
      ]);
      const selected = selectAvatar(nextProfiles, preferredId);

      setProfiles(nextProfiles);
      setProviders(nextProviders);
      setSelectedProfileId(selected?.id ?? "");
      setForm(selected ? toAvatarForm(selected) : createBlankAvatarForm());
      setPreview(null);
      setStatus("success");
      setStatusText("Avatar 配置已加载");
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "Avatar 加载失败");
    }
  }

  function updateForm(patch: Partial<AvatarFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function selectProfile(profile: AvatarProfileItem) {
    setSelectedProfileId(profile.id);
    setForm(toAvatarForm(profile));
    setPreview(null);
  }

  function startCreateProfile() {
    setSelectedProfileId("");
    setForm(createBlankAvatarForm());
    setPreview(null);
    setStatusText("创建新的 Avatar");
  }

  async function saveProfile() {
    setStatus("loading");

    try {
      const profile = await saveAvatarProfileRequest(form);

      setStatus("success");
      setStatusText("Avatar 配置已保存");
      await loadAvatarWorkspace(profile.id);
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "Avatar 保存失败");
    }
  }

  async function previewProfile(state: AvatarPreviewState) {
    if (!form.id) {
      setStatus("error");
      setStatusText("请先保存 Avatar");
      return;
    }

    setStatus("loading");

    try {
      const result = await previewAvatarProfileRequest({
        profileId: form.id,
        state,
        text: `你好，我是 ${form.name}`,
      });

      setPreview(result);
      setStatus("success");
      setStatusText(`预览状态：${result.state}`);
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "Avatar 预览失败");
    }
  }

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setStatus("loading");

      try {
        const [nextProfiles, nextProviders] = await Promise.all([
          readAvatarProfiles(),
          readProviders(),
        ]);
        const selected = selectAvatar(nextProfiles);

        if (cancelled) return;
        setProfiles(nextProfiles);
        setProviders(nextProviders);
        setSelectedProfileId(selected?.id ?? "");
        setForm(selected ? toAvatarForm(selected) : createBlankAvatarForm());
        setStatus("success");
        setStatusText("Avatar 配置已加载");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setStatusText(
          error instanceof Error ? error.message : "Avatar 加载失败",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    avatarProviders,
    form,
    isBusy: status === "loading",
    loadAvatarWorkspace,
    preview,
    previewProfile,
    profiles,
    saveProfile,
    selectProfile,
    selectedProfileId,
    startCreateProfile,
    status,
    statusText,
    updateForm,
    voiceProviders,
  };
}
