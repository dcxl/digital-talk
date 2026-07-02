import { useEffect, useMemo, useState } from "react";
import {
  createAvatarGenerationJobRequest,
  readAvatarAssets,
  previewAvatarProfileRequest,
  readAvatarProfiles,
  readProviders,
  saveAvatarProfileRequest,
  updateAvatarAssetRequest,
  uploadAvatarAssetRequest,
} from "../lib/api";
import type {
  AsyncStatus,
  AvatarAssetItem,
  AvatarFormState,
  AvatarGenerationJobItem,
  AvatarPreviewResult,
  AvatarPreviewState,
  AvatarProfileItem,
  ProviderItem,
} from "../types";
import { createBlankAvatarForm } from "./constants";

function getAssetUrl(asset: AvatarAssetItem) {
  return asset.publicUrl || `/api/avatar-assets/${asset.id}/content`;
}

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
  const [assets, setAssets] = useState<AvatarAssetItem[]>([]);
  const [profiles, setProfiles] = useState<AvatarProfileItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [lastGenerationJob, setLastGenerationJob] =
    useState<AvatarGenerationJobItem | null>(null);
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
      const [nextAssets, nextProfiles, nextProviders] = await Promise.all([
        readAvatarAssets(),
        readAvatarProfiles(),
        readProviders(),
      ]);
      const selected = selectAvatar(nextProfiles, preferredId);

      setAssets(nextAssets);
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
        const [nextAssets, nextProfiles, nextProviders] = await Promise.all([
          readAvatarAssets(),
          readAvatarProfiles(),
          readProviders(),
        ]);
        const selected = selectAvatar(nextProfiles);

        if (cancelled) return;
        setAssets(nextAssets);
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

  async function bindAvatarAsset(asset: AvatarAssetItem) {
    const assetUrl = getAssetUrl(asset);
    setStatus("loading");

    try {
      if (form.id) {
        const [updatedAsset, updatedProfile] = await Promise.all([
          updateAvatarAssetRequest(asset.id, {
            profileId: form.id,
          }),
          saveAvatarProfileRequest({
            ...form,
            previewImageUrl: assetUrl,
          }),
        ]);

        setAssets((current) =>
          current.map((item) => (item.id === updatedAsset.id ? updatedAsset : item)),
        );
        setForm(toAvatarForm(updatedProfile));
        setSelectedProfileId(updatedProfile.id);
        setStatusText("Avatar Asset 已绑定");
      } else {
        setForm((current) => ({
          ...current,
          previewImageUrl: assetUrl,
        }));
        setStatusText("Asset 已选择，保存 Avatar 后生效");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "Avatar Asset 绑定失败");
    }
  }

  async function uploadAvatarAsset(file: File) {
    setStatus("loading");

    try {
      const asset = await uploadAvatarAssetRequest({
        file,
        name: file.name,
        profileId: form.id,
      });

      setAssets((current) => [asset, ...current]);
      await bindAvatarAsset(asset);
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "Avatar Asset 上传失败");
    }
  }

  async function generateAvatarAsset(input: {
    negativePrompt?: string;
    prompt: string;
    style?: string;
  }) {
    setStatus("loading");

    try {
      const result = await createAvatarGenerationJobRequest({
        negativePrompt: input.negativePrompt,
        profileId: form.id,
        prompt: input.prompt,
        style: input.style,
      });

      setLastGenerationJob(result.job);

      if (result.job.status === "failed") {
        throw new Error(result.job.errorMessage ?? "Avatar 生成失败");
      }

      const asset = result.asset ?? result.job.resultAsset;
      if (!asset) throw new Error("Avatar 生成任务没有返回资产");

      setAssets((current) => [
        asset,
        ...current.filter((item) => item.id !== asset.id),
      ]);
      await bindAvatarAsset(asset);
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "Avatar 生成失败");
    }
  }

  return {
    assets,
    avatarProviders,
    bindAvatarAsset,
    form,
    generateAvatarAsset,
    isBusy: status === "loading",
    lastGenerationJob,
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
    uploadAvatarAsset,
    voiceProviders,
  };
}
