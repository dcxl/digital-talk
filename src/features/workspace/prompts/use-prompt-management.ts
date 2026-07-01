import { useEffect, useMemo, useState } from "react";
import {
  createPromptRequest,
  createPromptVersionRequest,
  readPrompts,
  testPromptRequest,
} from "../lib/api";
import type {
  AsyncStatus,
  PromptFormState,
  PromptTemplateItem,
  PromptTestResult,
  PromptType,
  PromptVariable,
} from "../types";
import { createBlankPromptForm } from "./constants";

function toPromptForm(prompt: PromptTemplateItem): PromptFormState {
  const version = prompt.currentVersion ?? prompt.versions[0];
  const variables = version?.variables ?? prompt.variables ?? [];

  return {
    changelog: "",
    content: version?.content ?? "",
    description: prompt.description ?? "",
    id: prompt.id,
    name: prompt.name,
    testMessage: "你是谁？",
    type: prompt.type,
    variableValues: Object.fromEntries(
      variables.map((variable) => [
        variable.name,
        variable.defaultValue ?? "",
      ]),
    ),
    variables,
  };
}

function selectPromptForType(
  prompts: PromptTemplateItem[],
  type: PromptType,
  preferredId?: string,
) {
  const candidates = prompts.filter((prompt) => prompt.type === type);
  return (
    candidates.find((prompt) => prompt.id === preferredId) ??
    candidates[0] ??
    null
  );
}

export function usePromptManagement() {
  const [activeType, setActiveType] = useState<PromptType>("system");
  const [form, setForm] = useState<PromptFormState>(
    createBlankPromptForm("system"),
  );
  const [prompts, setPrompts] = useState<PromptTemplateItem[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [statusText, setStatusText] = useState("");
  const [testResult, setTestResult] = useState<PromptTestResult | null>(null);

  const visiblePrompts = useMemo(
    () => prompts.filter((prompt) => prompt.type === activeType),
    [activeType, prompts],
  );

  const promptCounts = useMemo(
    () =>
      prompts.reduce<Record<string, number>>((result, prompt) => {
        result[prompt.type] = (result[prompt.type] ?? 0) + 1;
        return result;
      }, {}),
    [prompts],
  );

  async function loadPrompts(preferredId = selectedPromptId, type = activeType) {
    setStatus("loading");

    try {
      const nextPrompts = await readPrompts();
      const selected = selectPromptForType(nextPrompts, type, preferredId);

      setPrompts(nextPrompts);
      setActiveType(type);
      setSelectedPromptId(selected?.id ?? "");
      setForm(selected ? toPromptForm(selected) : createBlankPromptForm(type));
      setStatus("success");
      setStatusText("Prompt 已加载");
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "Prompt 加载失败");
    }
  }

  function updateForm(patch: Partial<PromptFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function updateVariable(index: number, patch: Partial<PromptVariable>) {
    setForm((current) => ({
      ...current,
      variables: current.variables.map((variable, variableIndex) =>
        variableIndex === index ? { ...variable, ...patch } : variable,
      ),
    }));
  }

  function addVariable() {
    setForm((current) => ({
      ...current,
      variables: [
        ...current.variables,
        {
          name: "variable_name",
          required: false,
        },
      ],
    }));
  }

  function removeVariable(index: number) {
    setForm((current) => ({
      ...current,
      variables: current.variables.filter((_, variableIndex) => {
        return variableIndex !== index;
      }),
    }));
  }

  function updateVariableValue(name: string, value: string) {
    setForm((current) => ({
      ...current,
      variableValues: {
        ...current.variableValues,
        [name]: value,
      },
    }));
  }

  function selectType(type: PromptType) {
    const selected = selectPromptForType(prompts, type);

    setActiveType(type);
    setSelectedPromptId(selected?.id ?? "");
    setForm(selected ? toPromptForm(selected) : createBlankPromptForm(type));
    setTestResult(null);
  }

  function selectPrompt(prompt: PromptTemplateItem) {
    setActiveType(prompt.type);
    setSelectedPromptId(prompt.id);
    setForm(toPromptForm(prompt));
    setTestResult(null);
  }

  function startCreatePrompt(type = activeType) {
    setSelectedPromptId("");
    setForm(createBlankPromptForm(type));
    setTestResult(null);
    setStatusText("创建新的 Prompt");
  }

  async function savePrompt() {
    setStatus("loading");

    try {
      const prompt = form.id
        ? await createPromptVersionRequest(form)
        : await createPromptRequest(form);

      setStatus("success");
      setStatusText(form.id ? "Prompt 新版本已保存" : "Prompt 已创建");
      await loadPrompts(prompt.id, prompt.type);
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "Prompt 保存失败");
    }
  }

  async function testPrompt() {
    setStatus("loading");

    try {
      const result = await testPromptRequest(form);

      setTestResult(result);
      setStatus("success");
      setStatusText(`Prompt 测试完成 ${result.latencyMs}ms`);
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "Prompt 测试失败");
    }
  }

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setStatus("loading");

      try {
        const nextPrompts = await readPrompts();
        const selected = selectPromptForType(nextPrompts, "system", "");

        if (cancelled) return;
        setPrompts(nextPrompts);
        setActiveType("system");
        setSelectedPromptId(selected?.id ?? "");
        setForm(
          selected ? toPromptForm(selected) : createBlankPromptForm("system"),
        );
        setStatus("success");
        setStatusText("Prompt 已加载");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setStatusText(
          error instanceof Error ? error.message : "Prompt 加载失败",
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    activeType,
    addVariable,
    form,
    isBusy: status === "loading",
    loadPrompts,
    promptCounts,
    removeVariable,
    savePrompt,
    selectPrompt,
    selectedPromptId,
    selectType,
    startCreatePrompt,
    status,
    statusText,
    testPrompt,
    testResult,
    updateForm,
    updateVariable,
    updateVariableValue,
    visiblePrompts,
  };
}
