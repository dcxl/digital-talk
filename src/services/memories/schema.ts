import type {
  CharacterMemoryStatus,
  CharacterMemoryType,
} from "@/generated/prisma/client";

export const characterMemoryTypes = new Set<CharacterMemoryType>([
  "long_term",
  "session_summary",
  "user_preference",
  "relationship_fact",
  "character_fact",
]);

export const characterMemoryStatuses = new Set<CharacterMemoryStatus>([
  "active",
  "disabled",
  "deleted",
]);

export interface MemoryListQuery {
  limit?: number;
  status?: CharacterMemoryStatus;
  type?: CharacterMemoryType;
}

export interface MemoryWriteInput {
  confidence?: number | null;
  content?: string;
  expiresAt?: Date | null;
  metadata?: unknown;
  source?: string;
  sourceConversationId?: string | null;
  status?: CharacterMemoryStatus;
  type?: CharacterMemoryType;
}

export interface ParsedMemoryInput<T> {
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

function getMemoryType(value: unknown) {
  const type = getString(value);
  return characterMemoryTypes.has(type as CharacterMemoryType)
    ? (type as CharacterMemoryType)
    : undefined;
}

function getMemoryStatus(value: unknown) {
  const status = getString(value);
  return characterMemoryStatuses.has(status as CharacterMemoryStatus)
    ? (status as CharacterMemoryStatus)
    : undefined;
}

function getConfidence(value: unknown) {
  if (value === null) return null;
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) return undefined;
  return Math.min(Math.max(numberValue, 0), 1);
}

function optionalDate(value: unknown) {
  if (value === null) return null;
  const stringValue = getString(value);
  if (!stringValue) return undefined;

  const date = new Date(stringValue);
  return Number.isNaN(date.getTime()) ? undefined : date;
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

export function parseMemoryListQuery(
  searchParams: URLSearchParams,
): MemoryListQuery {
  const limitValue = Number(searchParams.get("limit") ?? "");
  const limit = Number.isFinite(limitValue)
    ? Math.min(Math.max(Math.floor(limitValue), 1), 100)
    : undefined;

  return {
    limit,
    status: getMemoryStatus(searchParams.get("status")),
    type: getMemoryType(searchParams.get("type")),
  };
}

export function parseCreateMemoryInput(
  body: unknown,
): ParsedMemoryInput<Required<Pick<MemoryWriteInput, "content">> & MemoryWriteInput> {
  const record = readBodyRecord(body);
  const errors: string[] = [];
  const content = getString(record.content);

  if (!content) errors.push("content is required");
  if (content.length > 2000) {
    errors.push("content must be 2000 characters or fewer");
  }

  return {
    errors,
    value: {
      confidence: getConfidence(record.confidence) ?? 1,
      content,
      expiresAt: optionalDate(record.expiresAt),
      metadata: optionalJson(record.metadata),
      source: getString(record.source) || "manual",
      sourceConversationId: optionalNullableString(record.sourceConversationId),
      status: getMemoryStatus(record.status) ?? "active",
      type: getMemoryType(record.type) ?? "long_term",
    },
  };
}

export function parseUpdateMemoryInput(
  body: unknown,
): ParsedMemoryInput<MemoryWriteInput> {
  const record = readBodyRecord(body);
  const errors: string[] = [];
  const content = getString(record.content);

  if (content.length > 2000) {
    errors.push("content must be 2000 characters or fewer");
  }

  return {
    errors,
    value: {
      confidence: getConfidence(record.confidence),
      content: content || undefined,
      expiresAt: optionalDate(record.expiresAt),
      metadata: optionalJson(record.metadata),
      source: getString(record.source) || undefined,
      sourceConversationId: optionalNullableString(record.sourceConversationId),
      status: getMemoryStatus(record.status),
      type: getMemoryType(record.type),
    },
  };
}
