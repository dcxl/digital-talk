import { GitBranch, Play, Plus, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import type {
  CharacterItem,
  CharacterWorkflowFormState,
  CharacterWorkflowItem,
  CharacterWorkflowStatus,
} from "../types";
import {
  characterWorkflowExecutionStatusLabels,
  characterWorkflowStatusLabels,
  createBlankCharacterWorkflowForm,
} from "./constants";

export function CharacterWorkflowPanel({
  character,
  isBusy,
  onCreateWorkflow,
  onRunWorkflow,
  onUpdateWorkflowStatus,
  workflows,
}: {
  character: CharacterItem | null;
  isBusy: boolean;
  onCreateWorkflow: (input: CharacterWorkflowFormState) => void;
  onRunWorkflow: (workflowId: string, confirm?: boolean) => void;
  onUpdateWorkflowStatus: (
    workflowId: string,
    status: CharacterWorkflowStatus,
  ) => void;
  workflows: CharacterWorkflowItem[];
}) {
  const [form, setForm] = useState<CharacterWorkflowFormState>(
    createBlankCharacterWorkflowForm(),
  );

  function updateForm(patch: Partial<CharacterWorkflowFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function submitWorkflow() {
    if (!character || !form.name.trim()) return;
    onCreateWorkflow(form);
    setForm(createBlankCharacterWorkflowForm());
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <span className="flex size-9 items-center justify-center rounded-md bg-amber-50 text-amber-700">
          <GitBranch size={17} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">工作流</h3>
          <p className="mt-1 text-xs text-slate-500">
            {character ? `${workflows.length} 个` : "未选择角色"}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px]">
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            disabled={isBusy || !character}
            onChange={(event) => updateForm({ name: event.target.value })}
            placeholder="工作流名称"
            value={form.name}
          />
          <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <input
              checked={form.requiresConfirmation}
              disabled={isBusy || !character}
              onChange={(event) =>
                updateForm({ requiresConfirmation: event.target.checked })
              }
              type="checkbox"
            />
            运行需确认
          </label>
          <textarea
            className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 md:col-span-2"
            disabled={isBusy || !character}
            onChange={(event) =>
              updateForm({ description: event.target.value })
            }
            placeholder="工作流说明"
            value={form.description}
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 md:col-span-2"
            disabled={isBusy || !character || !form.name.trim()}
            onClick={submitWorkflow}
            type="button"
          >
            <Plus size={15} />
            创建工作流
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 border-t border-slate-100">
        {workflows.map((workflow) => {
          const latestExecution = workflow.executions[0];
          const nextStatus =
            workflow.status === "active" ? "disabled" : "active";

          return (
            <div className="space-y-3 p-4" key={workflow.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {workflow.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {workflow.description || "手动工作流"}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {characterWorkflowStatusLabels[workflow.status]}
                    {latestExecution
                      ? ` · 最近${characterWorkflowExecutionStatusLabels[latestExecution.status]}`
                      : " · 尚未运行"}
                  </p>
                  {latestExecution?.errorMessage ? (
                    <p className="mt-2 text-xs text-red-500">
                      {latestExecution.errorMessage}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:cursor-not-allowed"
                    disabled={isBusy || workflow.status !== "active"}
                    onClick={() => onRunWorkflow(workflow.id, false)}
                    title="运行工作流"
                    type="button"
                  >
                    <Play size={15} />
                  </button>
                  <button
                    className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 disabled:cursor-not-allowed"
                    disabled={isBusy}
                    onClick={() => onUpdateWorkflowStatus(workflow.id, nextStatus)}
                    title={nextStatus === "active" ? "启用工作流" : "禁用工作流"}
                    type="button"
                  >
                    <Power size={15} />
                  </button>
                  <button
                    className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 disabled:cursor-not-allowed"
                    disabled={isBusy}
                    onClick={() => onUpdateWorkflowStatus(workflow.id, "deleted")}
                    title="删除工作流"
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {character && workflows.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">暂无工作流</div>
        ) : null}
        {!character ? (
          <div className="p-4 text-sm text-slate-500">请选择角色后管理工作流</div>
        ) : null}
      </div>
    </section>
  );
}
