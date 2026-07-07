export interface ComfyUIAppearanceRequest {
  negativePrompt?: string;
  prompt: string;
  style?: string;
}

export function parseComfyUIAppearanceRequest(body: unknown) {
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const prompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
  const negativePrompt =
    typeof record.negativePrompt === "string"
      ? record.negativePrompt.trim()
      : undefined;
  const style = typeof record.style === "string" ? record.style.trim() : undefined;
  const errors: string[] = [];

  if (!prompt) errors.push("prompt is required");
  if (prompt.length > 1_000) {
    errors.push("prompt must be 1000 characters or fewer");
  }
  if ("workflow" in record || "workflowJson" in record || "nodes" in record) {
    errors.push("workflow JSON is not accepted");
  }

  return {
    errors,
    value: {
      negativePrompt,
      prompt,
      style,
    } satisfies ComfyUIAppearanceRequest,
  };
}
