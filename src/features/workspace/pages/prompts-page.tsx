"use client";

import { PageFrame, Panel, RefreshButton } from "../components/page-frame";
import { PromptEditor } from "../prompts/prompt-editor";
import { PromptList } from "../prompts/prompt-list";
import { PromptTestPanel } from "../prompts/prompt-test-panel";
import { PromptTypeTabs } from "../prompts/prompt-type-tabs";
import { usePromptManagement } from "../prompts/use-prompt-management";

export function PromptsPage() {
  const {
    activeType,
    addVariable,
    form,
    isBusy,
    loadPrompts,
    promptCounts,
    removeVariable,
    savePrompt,
    selectPrompt,
    selectedPromptId,
    selectType,
    startCreatePrompt,
    statusText,
    testPrompt,
    testResult,
    updateForm,
    updateVariable,
    updateVariableValue,
    visiblePrompts,
  } = usePromptManagement();

  return (
    <PageFrame
      actions={
        <RefreshButton
          isLoading={isBusy}
          onClick={() => void loadPrompts()}
        />
      }
      eyebrow="提示词"
      title="提示词管理"
    >
      <Panel>
        <PromptTypeTabs
          activeType={activeType}
          counts={promptCounts}
          onChange={selectType}
        />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <PromptList
          activeType={activeType}
          isBusy={isBusy}
          onCreate={startCreatePrompt}
          onSelect={selectPrompt}
          prompts={visiblePrompts}
          selectedPromptId={selectedPromptId}
        />
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <PromptEditor
            form={form}
            isBusy={isBusy}
            onAddVariable={addVariable}
            onChange={updateForm}
            onRemoveVariable={removeVariable}
            onSave={() => void savePrompt()}
            onVariableChange={updateVariable}
          />
          <PromptTestPanel
            form={form}
            isBusy={isBusy}
            onChange={updateForm}
            onRun={() => void testPrompt()}
            onVariableValueChange={updateVariableValue}
            result={testResult}
            statusText={statusText}
          />
        </div>
      </div>
    </PageFrame>
  );
}
