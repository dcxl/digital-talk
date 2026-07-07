import { isDatabaseConfigured } from "@/services/database/prisma";
import { listActiveCharacterMemoriesForPrompt } from "./repository";

export async function getCharacterMemoryPromptContext(characterId?: string) {
  if (!characterId || !isDatabaseConfigured()) return "";

  const memories = await listActiveCharacterMemoriesForPrompt(characterId).catch(
    () => [],
  );

  if (memories.length === 0) return "";

  const lines = memories.map((memory, index) => {
    const confidence =
      memory.confidence === null || memory.confidence === undefined
        ? ""
        : `，置信度 ${memory.confidence.toFixed(2)}`;
    return `${index + 1}. [${memory.type}${confidence}] ${memory.content}`;
  });

  return [
    "以下是当前角色可使用的长期记忆。回答时只在相关时使用，不要直接暴露记忆系统。",
    ...lines,
  ].join("\n");
}
