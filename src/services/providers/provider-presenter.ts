import type { ProviderConfig } from "@/generated/prisma/client";

export function sanitizeProviderConfig(config: ProviderConfig) {
  return {
    id: config.id,
    type: config.type,
    provider: config.provider,
    name: config.name,
    enabled: config.enabled,
    baseUrl: config.baseUrl,
    model: config.model,
    options: config.options,
    hasApiKey: Boolean(config.apiKeyEncrypted),
    lastTestStatus: config.lastTestStatus,
    lastTestAt: config.lastTestAt,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}
