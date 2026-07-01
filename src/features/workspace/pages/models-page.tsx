"use client";

import { PageFrame, Panel, RefreshButton } from "../components/page-frame";
import { ProviderConfigForm } from "../models/provider-config-form";
import { ProviderList } from "../models/provider-list";
import { ProviderTypeTabs } from "../models/provider-type-tabs";
import { useProviderConfigs } from "../models/use-provider-configs";

export function ModelsPage() {
  const {
    activeType,
    form,
    isBusy,
    loadProviders,
    providerCounts,
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
  } = useProviderConfigs();

  return (
    <PageFrame
      actions={
        <RefreshButton
          isLoading={isBusy}
          onClick={() => void loadProviders()}
        />
      }
      eyebrow="Providers"
      title="模型配置"
    >
      <Panel>
        <ProviderTypeTabs
          activeType={activeType}
          counts={providerCounts}
          onChange={selectProviderType}
        />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <ProviderList
          activeType={activeType}
          isBusy={isBusy}
          onCreate={startCreateProvider}
          onSelect={selectProvider}
          providers={visibleProviders}
          selectedProviderId={selectedProviderId}
        />
        <ProviderConfigForm
          form={form}
          isBusy={isBusy}
          onChange={updateForm}
          onSave={() => void saveProvider()}
          onTest={() => void testProvider()}
          status={status}
          statusText={statusText}
        />
      </div>
    </PageFrame>
  );
}
