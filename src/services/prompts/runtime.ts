import { isDatabaseConfigured } from "@/services/database/prisma";
import { DEFAULT_SYSTEM_PROMPT, defaultPromptVariables } from "./defaults";
import { getCurrentPromptTemplateByType } from "./repository";
import { renderPromptContent } from "./render";

const runtimePromptValues = {
  char_name: "Next Digital Human",
  user_name: "User",
};

function renderDefaultSystemPrompt() {
  return renderPromptContent(
    DEFAULT_SYSTEM_PROMPT,
    defaultPromptVariables,
    runtimePromptValues,
  ).content;
}

export async function getRuntimeSystemPrompt() {
  if (!isDatabaseConfigured()) return renderDefaultSystemPrompt();

  try {
    const template = await getCurrentPromptTemplateByType("system");
    const version = template?.currentVersion;

    if (!version?.content) return renderDefaultSystemPrompt();

    return renderPromptContent(
      version.content,
      version.variables ?? template?.variables,
      runtimePromptValues,
    ).content;
  } catch {
    return renderDefaultSystemPrompt();
  }
}
