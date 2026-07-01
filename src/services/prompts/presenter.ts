import type {
  PromptTemplate,
  PromptVersion,
} from "@/generated/prisma/client";

export interface PromptTemplateRecord extends PromptTemplate {
  currentVersion?: PromptVersion | null;
  versions?: PromptVersion[];
}

export function serializePromptVersion(version: PromptVersion) {
  return {
    id: version.id,
    promptTemplateId: version.promptTemplateId,
    version: version.version,
    content: version.content,
    variables: version.variables,
    changelog: version.changelog,
    createdByUserId: version.createdByUserId,
    createdAt: version.createdAt.toISOString(),
  };
}

export function serializePromptTemplate(template: PromptTemplateRecord) {
  return {
    id: template.id,
    type: template.type,
    name: template.name,
    description: template.description,
    currentVersionId: template.currentVersionId,
    currentVersion: template.currentVersion
      ? serializePromptVersion(template.currentVersion)
      : null,
    versions: (template.versions ?? []).map(serializePromptVersion),
    variables: template.variables,
    status: template.status,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
