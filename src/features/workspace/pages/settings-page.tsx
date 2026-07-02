"use client";

import { PageFrame, RefreshButton } from "../components/page-frame";
import { DangerZonePanel } from "../settings/danger-zone-panel";
import { DataExportPanel } from "../settings/data-export-panel";
import { GeneralSettingsPanel } from "../settings/general-settings-panel";
import { useSettings } from "../settings/use-settings";

export function SettingsPage() {
  const {
    exportWorkspace,
    form,
    isLoading,
    loadSettings,
    saveSettings,
    statusText,
    updateForm,
  } = useSettings();

  return (
    <PageFrame
      actions={
        <RefreshButton
          isLoading={isLoading}
          onClick={() => void loadSettings()}
        />
      }
      eyebrow="设置"
      title="系统设置"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <GeneralSettingsPanel
          form={form}
          isLoading={isLoading}
          onChange={updateForm}
          onSave={() => void saveSettings()}
          statusText={statusText}
        />
        <div className="flex flex-col gap-4">
          <DataExportPanel
            isLoading={isLoading}
            onExport={() => void exportWorkspace()}
          />
          <DangerZonePanel />
        </div>
      </div>
    </PageFrame>
  );
}
