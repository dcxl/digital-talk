import type { AvatarDriver, AvatarFormState } from "../types";

export const avatarDriverOptions: Array<{
  disabled?: boolean;
  label: string;
  value: AvatarDriver;
}> = [
  { label: "Static", value: "static" },
  { disabled: true, label: "Live2D", value: "live2d" },
  { disabled: true, label: "VRM", value: "vrm" },
];

export const avatarBackgroundOptions = [
  "studio",
  "living-room",
  "workspace",
  "plain",
];

export const avatarLanguageOptions = ["zh-CN", "en-US", "ja-JP"];

export const avatarPreviewStates = ["idle", "thinking", "speaking", "error"] as const;

export function createBlankAvatarForm(): AvatarFormState {
  return {
    background: "studio",
    driver: "static",
    isDefault: false,
    language: "zh-CN",
    name: "New Avatar",
    previewImageUrl: "",
    providerConfigId: "",
    status: "active",
    voice: "default",
    voiceProviderId: "",
  };
}
