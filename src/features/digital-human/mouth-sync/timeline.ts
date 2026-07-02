import type { MouthSyncMark, MouthSyncTimeline } from "./types";

const CLOSE_AFTER_LAST_MARK_MS = 180;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function normalizeMarks(marks?: MouthSyncMark[]) {
  if (!marks?.length) return [];

  return marks
    .filter(
      (mark) =>
        Number.isFinite(mark.timeMs) &&
        mark.timeMs >= 0 &&
        typeof mark.value === "string",
    )
    .map((mark) => ({
      timeMs: Math.round(mark.timeMs),
      value: mark.value.trim(),
    }))
    .sort((a, b) => a.timeMs - b.timeMs);
}

export function createMouthSyncTimeline(input: {
  durationMs?: number;
  marks?: MouthSyncMark[];
  startedAtMs: number;
}): MouthSyncTimeline | null {
  const marks = normalizeMarks(input.marks);
  if (marks.length === 0) return null;

  return {
    durationMs: input.durationMs,
    marks,
    source: "speech-mark",
    startedAtMs: input.startedAtMs,
  };
}

export function mapMarkValueToMouthOpen(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 0;

  const numeric = Number(normalized);
  if (Number.isFinite(numeric)) return clamp01(numeric);

  if (/sil|sp|pau|rest|closed|close|none|_/.test(normalized)) return 0;
  if (/open|aa|ah|a|ang|an/.test(normalized)) return 0.95;
  if (/oh|ou|o|u|w/.test(normalized)) return 0.72;
  if (/ee|e|i|y/.test(normalized)) return 0.56;
  if (/m|b|p|f|v/.test(normalized)) return 0.22;

  return 0.64;
}

export function getMouthOpenAt(input: {
  nowMs: number;
  timeline: MouthSyncTimeline;
}) {
  const elapsedMs = Math.max(0, input.nowMs - input.timeline.startedAtMs);
  const marks = input.timeline.marks;
  const firstMark = marks[0];
  const lastMark = marks[marks.length - 1];

  if (!firstMark || !lastMark) return 0;
  if (elapsedMs < firstMark.timeMs) return 0;
  if (elapsedMs > lastMark.timeMs + CLOSE_AFTER_LAST_MARK_MS) return 0;
  if (
    input.timeline.durationMs !== undefined &&
    elapsedMs > input.timeline.durationMs + CLOSE_AFTER_LAST_MARK_MS
  ) {
    return 0;
  }

  let current = firstMark;
  let next: MouthSyncMark | undefined;

  for (let index = 0; index < marks.length; index += 1) {
    const mark = marks[index];
    if (!mark || mark.timeMs > elapsedMs) {
      next = mark;
      break;
    }
    current = mark;
  }

  const currentOpen = mapMarkValueToMouthOpen(current.value);
  if (!next) return currentOpen;

  const nextOpen = mapMarkValueToMouthOpen(next.value);
  const span = Math.max(1, next.timeMs - current.timeMs);
  const progress = clamp01((elapsedMs - current.timeMs) / span);

  return currentOpen + (nextOpen - currentOpen) * progress;
}
