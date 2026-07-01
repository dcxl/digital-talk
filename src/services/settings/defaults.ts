export interface GeneralSettings {
  autoSave: boolean;
  language: string;
  theme: "dark" | "light" | "system";
  timeZone: string;
  workspaceName: string;
}

export const generalSettingsKey = "general";

export const defaultGeneralSettings: GeneralSettings = {
  autoSave: true,
  language: "zh-CN",
  theme: "system",
  timeZone: "Asia/Shanghai",
  workspaceName: "Next Digital Human",
};

export function normalizeGeneralSettings(value: unknown): GeneralSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultGeneralSettings;
  }

  const record = value as Record<string, unknown>;
  const theme =
    record.theme === "dark" || record.theme === "light" || record.theme === "system"
      ? record.theme
      : defaultGeneralSettings.theme;

  return {
    autoSave:
      typeof record.autoSave === "boolean"
        ? record.autoSave
        : defaultGeneralSettings.autoSave,
    language:
      typeof record.language === "string" && record.language.trim()
        ? record.language.trim()
        : defaultGeneralSettings.language,
    theme,
    timeZone:
      typeof record.timeZone === "string" && record.timeZone.trim()
        ? record.timeZone.trim()
        : defaultGeneralSettings.timeZone,
    workspaceName:
      typeof record.workspaceName === "string" && record.workspaceName.trim()
        ? record.workspaceName.trim()
        : defaultGeneralSettings.workspaceName,
  };
}
