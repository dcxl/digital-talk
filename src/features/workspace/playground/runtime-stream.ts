import type { RuntimeEvent } from "@/core/runtime/events";
import type {
  PlaygroundFormState,
  PlaygroundLogLine,
  PlaygroundMetrics,
} from "./types";

export const initialMetrics: PlaygroundMetrics = {
  eventCount: 0,
  inputTokens: 0,
  outputTokens: 0,
  ragHitCount: 0,
  totalTokens: 0,
};

export const initialForm: PlaygroundFormState = {
  enableTTS: false,
  knowledgeBaseId: "",
  message: "请用一句话介绍 Next Digital Human。",
  modelProviderId: "",
};

export function createLogLine(
  message: string,
  level: PlaygroundLogLine["level"] = "info",
): PlaygroundLogLine {
  return {
    at: new Date().toISOString(),
    id: crypto.randomUUID(),
    level,
    message,
  };
}

function parseRuntimeEventBlock(block: string): RuntimeEvent | null {
  const dataLines = block
    .replaceAll("\r", "")
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart());

  if (dataLines.length === 0) return null;

  try {
    return JSON.parse(dataLines.join("\n")) as RuntimeEvent;
  } catch {
    return null;
  }
}

export async function consumePlaygroundStream(
  response: Response,
  onEvent: (event: RuntimeEvent) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Response body is empty");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const event = parseRuntimeEventBlock(block);
      if (event) onEvent(event);
    }
  }

  buffer += decoder.decode();
  const event = parseRuntimeEventBlock(buffer);
  if (event) onEvent(event);
}
