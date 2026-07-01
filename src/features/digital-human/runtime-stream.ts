import type { RuntimeEvent } from "./types";

export function parseRuntimeEvent(block: string): RuntimeEvent | null {
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
