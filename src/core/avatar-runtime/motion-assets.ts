import type { RuntimeState } from "@/core/runtime/events";

export type AvatarRuntimeMotionAssetKind = "image" | "sprite" | "video";
export type AvatarRuntimeMotionAssetSource = "profile-config";

export interface AvatarRuntimeMotionAsset {
  id?: string;
  kind: AvatarRuntimeMotionAssetKind;
  label?: string;
  loop?: boolean;
  posterUrl?: string;
  url: string;
}

export interface AvatarRuntimeMotionAssetTarget
  extends AvatarRuntimeMotionAsset {
  expression?: string | string[];
  motion?: string | string[];
}

export type AvatarRuntimeMotionAssetMap = Partial<
  Record<RuntimeState, AvatarRuntimeMotionAssetTarget | AvatarRuntimeMotionAssetTarget[]>
>;

export interface AvatarRuntimeMotionAssetDirective
  extends AvatarRuntimeMotionAsset {
  expressionCandidates: string[];
  matchedBy: "expression" | "motion" | "state";
  motionCandidates: string[];
  source: AvatarRuntimeMotionAssetSource;
  state: RuntimeState;
}

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

function normalizeKind(value: unknown): AvatarRuntimeMotionAssetKind | null {
  if (value === "image" || value === "sprite" || value === "video") {
    return value;
  }

  return null;
}

function normalizeAssetTarget(
  value: unknown,
): AvatarRuntimeMotionAssetTarget | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  const kind = normalizeKind(record.kind);
  const url = typeof record.url === "string" ? record.url.trim() : "";

  if (!kind || !url) return null;

  const expression = compactStrings(record.expression);
  const motion = compactStrings(record.motion);
  const id = typeof record.id === "string" ? record.id.trim() : "";
  const label = typeof record.label === "string" ? record.label.trim() : "";
  const posterUrl =
    typeof record.posterUrl === "string" ? record.posterUrl.trim() : "";

  return {
    ...(expression.length === 1 ? { expression: expression[0] } : {}),
    ...(expression.length > 1 ? { expression } : {}),
    ...(id ? { id } : {}),
    kind,
    ...(label ? { label } : {}),
    ...(typeof record.loop === "boolean" ? { loop: record.loop } : {}),
    ...(motion.length === 1 ? { motion: motion[0] } : {}),
    ...(motion.length > 1 ? { motion } : {}),
    ...(posterUrl ? { posterUrl } : {}),
    url,
  };
}

export function normalizeAvatarRuntimeMotionAssets(
  value: unknown,
): AvatarRuntimeMotionAssetMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const result: AvatarRuntimeMotionAssetMap = {};
  for (const [key, targetValue] of Object.entries(value)) {
    if (!runtimeStates.has(key as RuntimeState)) continue;

    const values = Array.isArray(targetValue) ? targetValue : [targetValue];
    const targets = values
      .map((item) => normalizeAssetTarget(item))
      .filter((item): item is AvatarRuntimeMotionAssetTarget => Boolean(item));

    if (targets.length === 1) {
      result[key as RuntimeState] = targets[0];
    } else if (targets.length > 1) {
      result[key as RuntimeState] = targets;
    }
  }

  return result;
}

export function getAvatarRuntimeMotionAssetsFromConfig(config: unknown) {
  if (!config || typeof config !== "object") return {};

  const record = config as Record<string, unknown>;
  const runtime = record.runtime;
  const runtimeAssets =
    runtime && typeof runtime === "object"
      ? (runtime as Record<string, unknown>).motionAssets
      : undefined;

  return normalizeAvatarRuntimeMotionAssets(
    runtimeAssets ?? record.motionAssets,
  );
}

function toCandidates(value: string | string[] | undefined) {
  return compactStrings(value);
}

function intersects(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return false;

  const rightSet = new Set(right);
  return left.some((item) => rightSet.has(item));
}

function toDirective(input: {
  asset: AvatarRuntimeMotionAssetTarget;
  matchedBy: AvatarRuntimeMotionAssetDirective["matchedBy"];
  state: RuntimeState;
}): AvatarRuntimeMotionAssetDirective {
  const expressionCandidates = toCandidates(input.asset.expression);
  const motionCandidates = toCandidates(input.asset.motion);

  return {
    ...(input.asset.id ? { id: input.asset.id } : {}),
    expressionCandidates,
    kind: input.asset.kind,
    ...(input.asset.label ? { label: input.asset.label } : {}),
    ...(typeof input.asset.loop === "boolean" ? { loop: input.asset.loop } : {}),
    matchedBy: input.matchedBy,
    motionCandidates,
    ...(input.asset.posterUrl ? { posterUrl: input.asset.posterUrl } : {}),
    source: "profile-config",
    state: input.state,
    url: input.asset.url,
  };
}

export function resolveAvatarMotionAsset(input: {
  expressionCandidates?: string[];
  motionAssets?: AvatarRuntimeMotionAssetMap | null;
  motionCandidates?: string[];
  state: RuntimeState;
}): AvatarRuntimeMotionAssetDirective | undefined {
  const motionAssets = normalizeAvatarRuntimeMotionAssets(input.motionAssets);
  const target = motionAssets[input.state];
  if (!target) return undefined;

  const assets = Array.isArray(target) ? target : [target];
  const expressionMatch = assets.find((asset) =>
    intersects(toCandidates(asset.expression), input.expressionCandidates ?? []),
  );
  if (expressionMatch) {
    return toDirective({
      asset: expressionMatch,
      matchedBy: "expression",
      state: input.state,
    });
  }

  const motionMatch = assets.find((asset) =>
    intersects(toCandidates(asset.motion), input.motionCandidates ?? []),
  );
  if (motionMatch) {
    return toDirective({
      asset: motionMatch,
      matchedBy: "motion",
      state: input.state,
    });
  }

  return toDirective({
    asset: assets[0],
    matchedBy: "state",
    state: input.state,
  });
}

