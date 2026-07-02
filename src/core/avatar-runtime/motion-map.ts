import type { RuntimeState } from "@/core/runtime/events";

export type AvatarRuntimeMotionSource = "default" | "profile-config";

export interface AvatarRuntimeMotionTarget {
  expression?: string | string[];
  motion?: string | string[];
}

export type AvatarRuntimeMotionMap = Partial<
  Record<RuntimeState, AvatarRuntimeMotionTarget>
>;

export interface AvatarRuntimeMotionDirective {
  expression?: string;
  expressionCandidates: string[];
  motion?: string;
  motionCandidates: string[];
  source: AvatarRuntimeMotionSource;
  state: RuntimeState;
}

export const defaultAvatarRuntimeMotionMap: AvatarRuntimeMotionMap = {
  error: {
    expression: ["sad", "cry", "neutral"],
  },
  idle: {
    expression: "neutral",
    motion: ["Idle", "idle"],
  },
  interrupted: {
    expression: ["surprised", "cry", "neutral"],
  },
  listening: {
    expression: ["attentive", "neutral"],
  },
  speaking: {
    expression: ["speaking", "happy", "neutral"],
    motion: ["Speaking", "speaking"],
  },
  streaming: {
    expression: ["thinking", "angry", "neutral"],
  },
  synthesizing: {
    expression: ["thinking", "angry", "neutral"],
  },
  thinking: {
    expression: ["thinking", "angry", "neutral"],
  },
  transcribing: {
    expression: ["attentive", "neutral"],
  },
};

const runtimeStates = new Set<RuntimeState>([
  "error",
  "idle",
  "interrupted",
  "listening",
  "speaking",
  "streaming",
  "synthesizing",
  "thinking",
  "transcribing",
]);

function compactStrings(value: unknown) {
  const values = Array.isArray(value) ? value : [value];

  return values
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeTarget(value: unknown): AvatarRuntimeMotionTarget | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const expression = compactStrings(record.expression);
  const motion = compactStrings(record.motion);

  if (expression.length === 0 && motion.length === 0) return null;

  return {
    ...(expression.length === 1 ? { expression: expression[0] } : {}),
    ...(expression.length > 1 ? { expression } : {}),
    ...(motion.length === 1 ? { motion: motion[0] } : {}),
    ...(motion.length > 1 ? { motion } : {}),
  };
}

export function normalizeAvatarRuntimeMotionMap(
  value: unknown,
): AvatarRuntimeMotionMap {
  if (!value || typeof value !== "object") return {};

  const result: AvatarRuntimeMotionMap = {};
  for (const [key, targetValue] of Object.entries(value)) {
    if (!runtimeStates.has(key as RuntimeState)) continue;

    const target = normalizeTarget(targetValue);
    if (target) result[key as RuntimeState] = target;
  }

  return result;
}

export function getAvatarRuntimeMotionMapFromConfig(config: unknown) {
  if (!config || typeof config !== "object") return {};

  const record = config as Record<string, unknown>;
  const runtime = record.runtime;
  const live2d = record.live2d;
  const runtimeMap =
    runtime && typeof runtime === "object"
      ? (runtime as Record<string, unknown>).motionMap
      : undefined;
  const live2dMap =
    live2d && typeof live2d === "object"
      ? (live2d as Record<string, unknown>).motionMap
      : undefined;

  return normalizeAvatarRuntimeMotionMap(
    runtimeMap ?? live2dMap ?? record.motionMap,
  );
}

function toCandidates(value: string | string[] | undefined) {
  return compactStrings(value);
}

export function resolveAvatarMotionDirective(input: {
  motionMap?: AvatarRuntimeMotionMap | null;
  state: RuntimeState;
}): AvatarRuntimeMotionDirective {
  const motionMap = normalizeAvatarRuntimeMotionMap(input.motionMap);
  const fallback =
    defaultAvatarRuntimeMotionMap[input.state] ??
    defaultAvatarRuntimeMotionMap.idle ??
    {};
  const override = motionMap[input.state];
  const target = override ? { ...fallback, ...override } : fallback;
  const expressionCandidates = toCandidates(target.expression);
  const motionCandidates = toCandidates(target.motion);

  return {
    expression: expressionCandidates[0],
    expressionCandidates,
    motion: motionCandidates[0],
    motionCandidates,
    source: override ? "profile-config" : "default",
    state: input.state,
  };
}
