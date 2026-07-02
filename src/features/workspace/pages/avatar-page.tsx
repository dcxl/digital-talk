"use client";

import { PageFrame, RefreshButton } from "../components/page-frame";
import { AvatarAssetsPanel } from "../avatar/avatar-assets-panel";
import { AvatarConfigForm } from "../avatar/avatar-config-form";
import { AvatarGenerationPanel } from "../avatar/avatar-generation-panel";
import { AvatarList } from "../avatar/avatar-list";
import { AvatarPreviewStage } from "../avatar/avatar-preview-stage";
import { useAvatarManagement } from "../avatar/use-avatar-management";

export function AvatarPage() {
  const {
    assets,
    avatarProviders,
    bindAvatarAsset,
    form,
    generateAvatarAsset,
    isBusy,
    lastGenerationJob,
    loadAvatarWorkspace,
    preview,
    previewProfile,
    profiles,
    retryAvatarGenerationJob,
    saveProfile,
    selectProfile,
    selectedProfileId,
    startCreateProfile,
    statusText,
    updateForm,
    uploadAvatarAsset,
    voiceProviders,
  } = useAvatarManagement();

  return (
    <PageFrame
      actions={
        <RefreshButton
          isLoading={isBusy}
          onClick={() => void loadAvatarWorkspace()}
        />
      }
      eyebrow="Avatar"
      title="数字人配置"
    >
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <AvatarList
          isBusy={isBusy}
          onCreate={startCreateProfile}
          onSelect={selectProfile}
          profiles={profiles}
          selectedProfileId={selectedProfileId}
        />
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <AvatarPreviewStage
            form={form}
            isBusy={isBusy}
            onPreview={(state) => void previewProfile(state)}
            preview={preview}
          />
          <AvatarConfigForm
            avatarProviders={avatarProviders}
            form={form}
            isBusy={isBusy}
            onChange={updateForm}
            onSave={() => void saveProfile()}
            statusText={statusText}
            voiceProviders={voiceProviders}
          />
          <div className="2xl:col-span-2">
            <AvatarGenerationPanel
              isBusy={isBusy}
              lastJob={lastGenerationJob}
              onGenerate={(input) => void generateAvatarAsset(input)}
              onRetry={(job) => void retryAvatarGenerationJob(job)}
            />
          </div>
          <div className="2xl:col-span-2">
            <AvatarAssetsPanel
              assets={assets}
              isBusy={isBusy}
              onBind={(asset) => void bindAvatarAsset(asset)}
              onUpload={(file) => void uploadAvatarAsset(file)}
              selectedAssetUrl={form.previewImageUrl}
            />
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
