import type { AvatarDriver, AvatarFormState } from "../types";

export const avatarDriverOptions: Array<{
  disabled?: boolean;
  label: string;
  value: AvatarDriver;
}> = [
  { label: "静态", value: "static" },
  { label: "Live2D", value: "live2d" },
  { label: "VRM", value: "vrm" },
];

export const avatarDriverLabels: Record<AvatarDriver, string> = {
  live2d: "Live2D",
  static: "静态",
  vrm: "VRM",
};

export const avatarBackgroundOptions = [
  "studio",
  "living-room",
  "workspace",
  "plain",
];

export const avatarLanguageOptions = ["zh-CN", "en-US", "ja-JP"];

export const avatarPreviewStates = ["idle", "thinking", "speaking", "error"] as const;

export const avatarBackgroundLabels: Record<string, string> = {
  "living-room": "客厅",
  plain: "纯色",
  studio: "影棚",
  workspace: "工作区",
};

export const avatarPreviewStateLabels: Record<
  (typeof avatarPreviewStates)[number],
  string
> = {
  error: "异常",
  idle: "待机",
  speaking: "说话",
  thinking: "思考",
};

export const avatarStatusLabels: Record<string, string> = {
  active: "启用",
  deleted: "已删除",
  disabled: "停用",
};

export const avatarAssetSourceLabels: Record<string, string> = {
  generated: "生成",
  remote: "远程",
  upload: "上传",
};

export function createBlankAvatarForm(): AvatarFormState {
  return {
    background: "studio",
    driver: "static",
    isDefault: false,
    language: "zh-CN",
    name: "新数字人",
    previewImageUrl: "",
    providerConfigId: "",
    status: "active",
    voice: "default",
    voiceProviderId: "",
  };
}
