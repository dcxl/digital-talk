import type {
  AvatarProfile,
  ProviderConfig,
} from "@/generated/prisma/client";
import { sanitizeProviderConfig } from "@/services/providers/provider-presenter";

export interface AvatarProfileRecord extends AvatarProfile {
  providerConfig?: ProviderConfig | null;
  voiceProvider?: ProviderConfig | null;
}

export function serializeAvatarProfile(profile: AvatarProfileRecord) {
  return {
    id: profile.id,
    name: profile.name,
    driver: profile.driver,
    providerConfigId: profile.providerConfigId,
    providerConfig: profile.providerConfig
      ? sanitizeProviderConfig(profile.providerConfig)
      : null,
    voiceProviderId: profile.voiceProviderId,
    voiceProvider: profile.voiceProvider
      ? sanitizeProviderConfig(profile.voiceProvider)
      : null,
    voice: profile.voice,
    language: profile.language,
    background: profile.background,
    previewImageUrl: profile.previewImageUrl,
    config: profile.config,
    isDefault: profile.isDefault,
    status: profile.status,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
