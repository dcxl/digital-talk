import type {
  CharacterRoleType,
  CharacterStatus,
} from "@/generated/prisma/client";

export const characterRoleTypes = new Set<CharacterRoleType>([
  "knowledge_assistant",
  "host",
  "chat_companion",
  "business_assistant",
  "custom",
]);

export const characterStatuses = new Set<CharacterStatus>([
  "draft",
  "active",
  "disabled",
  "deleted",
]);

export interface CharacterListQuery {
  limit?: number;
  q?: string;
  roleType?: CharacterRoleType;
  status?: CharacterStatus;
}

export interface CharacterWriteInput {
  appearanceProfileId?: string | null;
  comfyWorkflowConfig?: unknown;
  description?: string | null;
  language?: string | null;
  memoryPolicy?: unknown;
  name?: string;
  personaPromptId?: string | null;
  roleType?: CharacterRoleType;
  runtimeConfig?: unknown;
  status?: CharacterStatus;
  tags?: string[] | null;
  voice?: string | null;
  voiceProviderId?: string | null;
  workflowPolicy?: unknown;
}

export interface ParsedCharacterInput<T> {
  errors: string[];
  value: T;
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalNullableString(value: unknown) {
  if (value === null) return null;
  const stringValue = getString(value);
  return stringValue || undefined;
}

function getRoleType(value: unknown) {
  const roleType = getString(value);
  return characterRoleTypes.has(roleType as CharacterRoleType)
    ? (roleType as CharacterRoleType)
    : undefined;
}

function getStatus(value: unknown) {
  const status = getString(value);
  return characterStatuses.has(status as CharacterStatus)
    ? (status as CharacterStatus)
    : undefined;
}

function getStringArray(value: unknown) {
  if (value === null) return null;
  if (!Array.isArray(value)) return undefined;

  return value
    .map((item) => getString(item))
    .filter(Boolean)
    .slice(0, 20);
}

function optionalJson(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "object") return undefined;
  return value;
}

function readBodyRecord(body: unknown) {
  return body && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};
}

export function parseCharacterListQuery(
  searchParams: URLSearchParams,
): CharacterListQuery {
  const limitValue = Number(searchParams.get("limit") ?? "");
  const limit = Number.isFinite(limitValue)
    ? Math.min(Math.max(Math.floor(limitValue), 1), 100)
    : undefined;

  return {
    limit,
    q: getString(searchParams.get("q")),
    roleType: getRoleType(searchParams.get("roleType")),
    status: getStatus(searchParams.get("status")),
  };
}

export function parseCreateCharacterInput(
  body: unknown,
): ParsedCharacterInput<Required<Pick<CharacterWriteInput, "name">> & CharacterWriteInput> {
  const record = readBodyRecord(body);
  const errors: string[] = [];
  const name = getString(record.name);

  if (!name) errors.push("name is required");
  if (name.length > 60) errors.push("name must be 60 characters or fewer");

  return {
    errors,
    value: {
      appearanceProfileId: optionalNullableString(record.appearanceProfileId),
      comfyWorkflowConfig: optionalJson(record.comfyWorkflowConfig),
      description: optionalNullableString(record.description),
      language: optionalNullableString(record.language),
      memoryPolicy: optionalJson(record.memoryPolicy),
      name,
      personaPromptId: optionalNullableString(record.personaPromptId),
      roleType: getRoleType(record.roleType) ?? "custom",
      runtimeConfig: optionalJson(record.runtimeConfig),
      status: getStatus(record.status) ?? "draft",
      tags: getStringArray(record.tags),
      voice: optionalNullableString(record.voice),
      voiceProviderId: optionalNullableString(record.voiceProviderId),
      workflowPolicy: optionalJson(record.workflowPolicy),
    },
  };
}

export function parseUpdateCharacterInput(
  body: unknown,
): ParsedCharacterInput<CharacterWriteInput> {
  const record = readBodyRecord(body);
  const errors: string[] = [];
  const name = getString(record.name);

  if (name.length > 60) errors.push("name must be 60 characters or fewer");

  return {
    errors,
    value: {
      appearanceProfileId: optionalNullableString(record.appearanceProfileId),
      comfyWorkflowConfig: optionalJson(record.comfyWorkflowConfig),
      description: optionalNullableString(record.description),
      language: optionalNullableString(record.language),
      memoryPolicy: optionalJson(record.memoryPolicy),
      name: name || undefined,
      personaPromptId: optionalNullableString(record.personaPromptId),
      roleType: getRoleType(record.roleType),
      runtimeConfig: optionalJson(record.runtimeConfig),
      status: getStatus(record.status),
      tags: getStringArray(record.tags),
      voice: optionalNullableString(record.voice),
      voiceProviderId: optionalNullableString(record.voiceProviderId),
      workflowPolicy: optionalJson(record.workflowPolicy),
    },
  };
}

