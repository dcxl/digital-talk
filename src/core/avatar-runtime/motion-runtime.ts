import type { RuntimeState } from "@/core/runtime/events";
import {
  resolveAvatarMotionAsset,
  type AvatarRuntimeMotionAssetDirective,
  type AvatarRuntimeMotionAssetMap,
} from "./motion-assets";
import {
  resolveAvatarMotionDirective,
  type AvatarRuntimeMotionDirective,
  type AvatarRuntimeMotionMap,
} from "./motion-map";

export type AvatarMotionAnimationClass =
  | "avatar-motion-breathe"
  | "avatar-motion-error"
  | "avatar-motion-focus"
  | "avatar-motion-float"
  | "avatar-motion-shake"
  | "avatar-motion-speak";

export interface AvatarMotionCssVars {
  "--avatar-motion-brightness": string;
  "--avatar-motion-duration": string;
  "--avatar-motion-glow-opacity": string;
  "--avatar-motion-rotate": string;
  "--avatar-motion-saturate": string;
  "--avatar-motion-scale": string;
  "--avatar-motion-translate-y": string;
}

export interface AvatarMotionViewModel {
  animationClass: AvatarMotionAnimationClass;
  asset?: AvatarRuntimeMotionAssetDirective;
  cssVars: AvatarMotionCssVars;
  expression?: string;
  expressionCandidates: string[];
  intensity: number;
  isSpeaking: boolean;
  motion?: string;
  motionCandidates: string[];
  mouthOpen: number;
  ring: boolean;
  state: RuntimeState;
  volume: number;
}

interface AvatarMotionStatePreset {
  animationClass: AvatarMotionAnimationClass;
  brightness: number;
  durationMs: number;
  intensity: number;
  ring: boolean;
  rotateDeg: number;
  saturate: number;
  scale: number;
  shadowOpacity: number;
  translateY: number;
}

export interface ResolveAvatarMotionRuntimeInput {
  motion?: AvatarRuntimeMotionDirective | null;
  motionAssets?: AvatarRuntimeMotionAssetMap | null;
  motionMap?: AvatarRuntimeMotionMap | null;
  mouthOpen?: number;
  state: RuntimeState;
  volume?: number;
}

const statePresets: Record<RuntimeState, AvatarMotionStatePreset> = {
  error: {
    animationClass: "avatar-motion-error",
    brightness: 0.92,
    durationMs: 1600,
    intensity: 0.34,
    ring: true,
    rotateDeg: 0,
    saturate: 0.68,
    scale: 0.98,
    shadowOpacity: 0.18,
    translateY: 1,
  },
  idle: {
    animationClass: "avatar-motion-breathe",
    brightness: 1,
    durationMs: 3800,
    intensity: 0.12,
    ring: false,
    rotateDeg: 0,
    saturate: 1,
    scale: 1,
    shadowOpacity: 0.12,
    translateY: 0,
  },
  interrupted: {
    animationClass: "avatar-motion-shake",
    brightness: 1,
    durationMs: 520,
    intensity: 0.42,
    ring: true,
    rotateDeg: -1.4,
    saturate: 1.04,
    scale: 0.99,
    shadowOpacity: 0.26,
    translateY: 1,
  },
  listening: {
    animationClass: "avatar-motion-focus",
    brightness: 1.03,
    durationMs: 2200,
    intensity: 0.24,
    ring: true,
    rotateDeg: -0.6,
    saturate: 1.06,
    scale: 1.012,
    shadowOpacity: 0.24,
    translateY: -2,
  },
  speaking: {
    animationClass: "avatar-motion-speak",
    brightness: 1.04,
    durationMs: 860,
    intensity: 0.38,
    ring: true,
    rotateDeg: 0,
    saturate: 1.08,
    scale: 1.018,
    shadowOpacity: 0.3,
    translateY: -2,
  },
  streaming: {
    animationClass: "avatar-motion-float",
    brightness: 1.02,
    durationMs: 2600,
    intensity: 0.27,
    ring: true,
    rotateDeg: 0.8,
    saturate: 1.04,
    scale: 1.006,
    shadowOpacity: 0.2,
    translateY: -3,
  },
  synthesizing: {
    animationClass: "avatar-motion-float",
    brightness: 1.02,
    durationMs: 2400,
    intensity: 0.26,
    ring: true,
    rotateDeg: 0.4,
    saturate: 1.04,
    scale: 1.004,
    shadowOpacity: 0.2,
    translateY: -2,
  },
  thinking: {
    animationClass: "avatar-motion-float",
    brightness: 1.02,
    durationMs: 2800,
    intensity: 0.28,
    ring: true,
    rotateDeg: 0.8,
    saturate: 1.04,
    scale: 1.004,
    shadowOpacity: 0.2,
    translateY: -3,
  },
  transcribing: {
    animationClass: "avatar-motion-focus",
    brightness: 1.03,
    durationMs: 2000,
    intensity: 0.25,
    ring: true,
    rotateDeg: -0.4,
    saturate: 1.06,
    scale: 1.012,
    shadowOpacity: 0.24,
    translateY: -2,
  },
};

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number | undefined) {
  return clamp(typeof value === "number" ? value : 0, 0, 1);
}

function formatNumber(value: number) {
  return Number(value.toFixed(3)).toString();
}

function resolveMouthOpen(input: {
  mouthOpen: number;
  state: RuntimeState;
  volume: number;
}) {
  if (input.state !== "speaking") return 0;

  const audioDrivenMouth = Math.max(input.mouthOpen, input.volume * 0.72, 0.14);
  return clamp(audioDrivenMouth * 1.28, 0, 1);
}

export function resolveAvatarMotionRuntime(
  input: ResolveAvatarMotionRuntimeInput,
): AvatarMotionViewModel {
  const preset = statePresets[input.state];
  const volume = clamp01(input.volume);
  const mouthOpen = resolveMouthOpen({
    mouthOpen: clamp01(input.mouthOpen),
    state: input.state,
    volume,
  });
  const speakingBoost = input.state === "speaking" ? volume : 0;
  const providedMotion =
    input.motion?.state === input.state ? input.motion : undefined;
  const directive =
    providedMotion ??
    resolveAvatarMotionDirective({
      motionMap: input.motionMap,
      state: input.state,
    });
  const asset = resolveAvatarMotionAsset({
    expressionCandidates: directive.expressionCandidates,
    motionAssets: input.motionAssets,
    motionCandidates: directive.motionCandidates,
    state: input.state,
  });
  const scale = preset.scale + speakingBoost * 0.035;
  const translateY = preset.translateY - speakingBoost * 3;
  const intensity = clamp01(preset.intensity + speakingBoost * 0.42);
  const glowOpacity = clamp(
    preset.shadowOpacity + speakingBoost * 0.38 + mouthOpen * 0.18,
    0,
    0.78,
  );

  return {
    animationClass: preset.animationClass,
    ...(asset ? { asset } : {}),
    cssVars: {
      "--avatar-motion-brightness": formatNumber(preset.brightness),
      "--avatar-motion-duration": `${preset.durationMs}ms`,
      "--avatar-motion-glow-opacity": formatNumber(glowOpacity),
      "--avatar-motion-rotate": `${formatNumber(preset.rotateDeg)}deg`,
      "--avatar-motion-saturate": formatNumber(preset.saturate),
      "--avatar-motion-scale": formatNumber(scale),
      "--avatar-motion-translate-y": `${formatNumber(translateY)}px`,
    },
    expression: directive.expression,
    expressionCandidates: directive.expressionCandidates,
    intensity,
    isSpeaking: input.state === "speaking",
    motion: directive.motion,
    motionCandidates: directive.motionCandidates,
    mouthOpen,
    ring: preset.ring,
    state: input.state,
    volume,
  };
}
