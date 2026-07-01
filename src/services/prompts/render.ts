export interface PromptVariable {
  defaultValue?: string;
  name: string;
  required?: boolean;
}

export interface RenderPromptResult {
  content: string;
  missingVariables: string[];
  variables: PromptVariable[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function normalizePromptVariables(value: unknown): PromptVariable[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item) || typeof item.name !== "string") return null;
      const name = item.name.trim();
      if (!name) return null;
      const variable: PromptVariable = {
        name,
        required: item.required === true,
      };
      if (typeof item.defaultValue === "string") {
        variable.defaultValue = item.defaultValue;
      }

      return variable;
    })
    .filter((item): item is PromptVariable => Boolean(item));
}

export function renderPromptContent(
  content: string,
  variables: unknown,
  values: Record<string, string> = {},
): RenderPromptResult {
  const normalizedVariables = normalizePromptVariables(variables);
  const missingVariables = new Set<string>();

  const rendered = content.replace(
    /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g,
    (match, rawName: string) => {
      const variable = normalizedVariables.find((item) => item.name === rawName);
      const value = values[rawName] ?? variable?.defaultValue;

      if (value) return value;
      if (variable?.required) missingVariables.add(rawName);
      return match;
    },
  );

  return {
    content: rendered,
    missingVariables: [...missingVariables],
    variables: normalizedVariables,
  };
}
