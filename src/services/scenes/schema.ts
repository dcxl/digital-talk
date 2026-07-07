import type {
  CharacterSceneStatus,
  CharacterSceneType,
} from "@/generated/prisma/client";

export const characterSceneTypes = new Set<CharacterSceneType>([
  "knowledge_assistant",
  "host",
  "chat_companion",
  "business_assistant",
  "custom",
]);

export const characterSceneStatuses = new Set<CharacterSceneStatus>([
  "active",
  "disabled",
  "deleted",
]);

export interface SceneListQuery {
  limit?: number;
  q?: string;
  status?: CharacterSceneStatus;
  type?: CharacterSceneType;
}

export interface SceneWriteInput {
  description?: string | null;
  inputMode?: string;
  knowledgeBaseId?: string | null;
  name?: string;
  outputMode?: string;
  promptTemplateId?: string | null;
  status?: CharacterSceneStatus;
  type?: CharacterSceneType;
  workflowPolicy?: unknown;
}

export interface SceneBindingWriteInput {
  config?: unknown;
  enabled?: boolean;
  isDefault?: boolean;
}

export interface ParsedSceneInput<T> {
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

function getSceneType(value: unknown) {
  const type = getString(value);
  return characterSceneTypes.has(type as CharacterSceneType)
    ? (type as CharacterSceneType)
    : undefined;
}

function getSceneStatus(value: unknown) {
  const status = getString(value);
  return characterSceneStatuses.has(status as CharacterSceneStatus)
    ? (status as CharacterSceneStatus)
    : undefined;
}

function optionalJson(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "object") return undefined;
  return value;
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function readBodyRecord(body: unknown) {
  return body && typeof body === "object"
    ? (body as Record<string, unknown>)
    : {};
}

export function parseSceneListQuery(
  searchParams: URLSearchParams,
): SceneListQuery {
  const limitValue = Number(searchParams.get("limit") ?? "");
  const limit = Number.isFinite(limitValue)
    ? Math.min(Math.max(Math.floor(limitValue), 1), 100)
    : undefined;

  return {
    limit,
    q: getString(searchParams.get("q")),
    status: getSceneStatus(searchParams.get("status")),
    type: getSceneType(searchParams.get("type")),
  };
}

export function parseCreateSceneInput(
  body: unknown,
): ParsedSceneInput<Required<Pick<SceneWriteInput, "name">> & SceneWriteInput> {
  const record = readBodyRecord(body);
  const errors: string[] = [];
  const name = getString(record.name);

  if (!name) errors.push("name is required");
  if (name.length > 80) errors.push("name must be 80 characters or fewer");

  return {
    errors,
    value: {
      description: optionalNullableString(record.description),
      inputMode: getString(record.inputMode) || "text",
      knowledgeBaseId: optionalNullableString(record.knowledgeBaseId),
      name,
      outputMode: getString(record.outputMode) || "text",
      promptTemplateId: optionalNullableString(record.promptTemplateId),
      status: getSceneStatus(record.status) ?? "active",
      type: getSceneType(record.type) ?? "custom",
      workflowPolicy: optionalJson(record.workflowPolicy),
    },
  };
}

export function parseUpdateSceneInput(
  body: unknown,
): ParsedSceneInput<SceneWriteInput> {
  const record = readBodyRecord(body);
  const errors: string[] = [];
  const name = getString(record.name);

  if (name.length > 80) errors.push("name must be 80 characters or fewer");

  return {
    errors,
    value: {
      description: optionalNullableString(record.description),
      inputMode: getString(record.inputMode) || undefined,
      knowledgeBaseId: optionalNullableString(record.knowledgeBaseId),
      name: name || undefined,
      outputMode: getString(record.outputMode) || undefined,
      promptTemplateId: optionalNullableString(record.promptTemplateId),
      status: getSceneStatus(record.status),
      type: getSceneType(record.type),
      workflowPolicy: optionalJson(record.workflowPolicy),
    },
  };
}

export function parseBindSceneInput(
  body: unknown,
): ParsedSceneInput<SceneBindingWriteInput> {
  const record = readBodyRecord(body);

  return {
    errors: [],
    value: {
      config: optionalJson(record.config),
      enabled: getBoolean(record.enabled),
      isDefault: getBoolean(record.isDefault),
    },
  };
}
