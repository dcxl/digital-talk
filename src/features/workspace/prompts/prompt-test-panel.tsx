import { Play } from "lucide-react";
import type { PromptFormState, PromptTestResult } from "../types";

interface PromptTestPanelProps {
  form: PromptFormState;
  isBusy: boolean;
  onChange: (patch: Partial<PromptFormState>) => void;
  onRun: () => void;
  onVariableValueChange: (name: string, value: string) => void;
  result: PromptTestResult | null;
  statusText: string;
}

export function PromptTestPanel({
  form,
  isBusy,
  onChange,
  onRun,
  onVariableValueChange,
  result,
  statusText,
}: PromptTestPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-950">测试面板</h3>
        <p className="mt-1 text-xs text-slate-500">
          {statusText || "保存后可用当前 LLM 测试 Prompt"}
        </p>
      </div>
      <div className="space-y-4 p-4">
        <label className="block text-xs font-medium text-slate-600">
          测试问题
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500"
            onChange={(event) => onChange({ testMessage: event.target.value })}
            value={form.testMessage}
          />
        </label>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">变量值</p>
          {form.variables.map((variable) => (
            <label
              className="block text-xs text-slate-500"
              key={variable.name}
            >
              {variable.name}
              <input
                className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-indigo-500"
                onChange={(event) =>
                  onVariableValueChange(variable.name, event.target.value)
                }
                value={
                  form.variableValues[variable.name] ??
                  variable.defaultValue ??
                  ""
                }
              />
            </label>
          ))}
          {form.variables.length === 0 ? (
            <div className="rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-500">
              当前 Prompt 没有变量
            </div>
          ) : null}
        </div>

        <button
          className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-3 text-sm text-white disabled:opacity-60"
          disabled={!form.id || isBusy}
          onClick={onRun}
          type="button"
        >
          <Play size={15} />
          测试
        </button>
      </div>

      {result ? (
        <div className="space-y-3 border-t border-slate-200 p-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">延迟</p>
              <p className="mt-1 font-semibold text-slate-950">
                {result.latencyMs}ms
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Token</p>
              <p className="mt-1 font-semibold text-slate-950">
                {result.usage?.totalTokens ?? 0}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600">渲染后的提示词</p>
            <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
              {result.renderedPrompt}
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-600">输出</p>
            <p className="mt-1 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
              {result.output || "无输出"}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
