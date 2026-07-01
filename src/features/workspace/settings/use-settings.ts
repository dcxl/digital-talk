import { useEffect, useState } from "react";
import {
  defaultGeneralSettings,
  exportWorkspaceRequest,
  readSettings,
  saveSettingsRequest,
} from "../lib/api";
import type { AsyncStatus, GeneralSettingsState } from "../types";

export function useSettings() {
  const [form, setForm] = useState<GeneralSettingsState>(defaultGeneralSettings);
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [statusText, setStatusText] = useState("");

  async function loadSettings() {
    setStatus("loading");

    try {
      setForm(await readSettings());
      setStatus("success");
      setStatusText("设置已加载");
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "设置加载失败");
    }
  }

  function updateForm(patch: Partial<GeneralSettingsState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  async function saveSettings() {
    setStatus("loading");

    try {
      setForm(await saveSettingsRequest(form));
      setStatus("success");
      setStatusText("设置已保存");
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "设置保存失败");
    }
  }

  async function exportWorkspace() {
    setStatus("loading");

    try {
      const blob = await exportWorkspaceRequest();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `next-digital-human-export-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("success");
      setStatusText("导出已生成");
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "导出失败");
    }
  }

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (cancelled) return;
      await loadSettings();
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    exportWorkspace,
    form,
    isLoading: status === "loading",
    loadSettings,
    saveSettings,
    status,
    statusText,
    updateForm,
  };
}
