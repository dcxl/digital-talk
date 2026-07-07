import type { CharacterWorkflowStatus } from "@/generated/prisma/client";

export const characterWorkflowStatuses = new Set<CharacterWorkflowStatus>([
  "active",
  "disabled",
  "deleted",
]);

export interface WorkflowListQuery {
  limit?: number;
  status?: CharacterWorkflowStatus;
}

export interface WorkflowWriteInput {
  description?: string | null;
  name?: string;
  permission?: unknown;
  status?: CharacterWorkflowStatus;
  steps?: unknown;
  trigger?: unknown;
}

export interface WorkflowRunInput {
  confirm?: boolean;
  conversationId?: string | null;
  input?: unknown;
}

export interface ParsedWorkflowInput<T> {
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

function getStatus(value: unknown) {
  const status = getString(value);
  return characterWorkflowStatuses.has(status as CharacterWorkflowStatus)
    ? (status as CharacterWorkflowStatus)
    : undefined;
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

export function parseWorkflowListQuery(
  searchParams: URLSearchParams,
): WorkflowListQuery {
  const limitValue = Number(searchParams.get("limit") ?? "");
  const limit = Number.isFinite(limitValue)
    ? Math.min(Math.max(Math.floor(limitValue), 1), 100)
    : undefined;

  return {
    limit,
    status: getStatus(searchParams.get("status")),
  };
}

export function parseCreateWorkflowInput(
  body: unknown,
): ParsedWorkflowInput<Required<Pick<WorkflowWriteInput, "name" | "steps">> & WorkflowWriteInput> {
  const record = readBodyRecord(body);
  const errors: string[] = [];
  const name = getString(record.name);
  const steps = optionalJson(record.steps);

  if (!name) errors.push("name is required");
  if (name.length > 80) errors.push("name must be 80 characters or fewer");
  if (!steps) errors.push("steps is required");

  return {
    errors,
    value: {
      description: optionalNullableString(record.description),
      name,
      permission: optionalJson(record.permission),
      status: getStatus(record.status) ?? "active",
      steps: steps ?? [],
      trigger: optionalJson(record.trigger),
    },
  };
}

export function parseUpdateWorkflowInput(
  body: unknown,
): ParsedWorkflowInput<WorkflowWriteInput> {
  const record = readBodyRecord(body);
  const errors: string[] = [];
  const name = getString(record.name);

  if (name.length > 80) errors.push("name must be 80 characters or fewer");

  return {
    errors,
    value: {
      description: optionalNullableString(record.description),
      name: name || undefined,
      permission: optionalJson(record.permission),
      status: getStatus(record.status),
      steps: optionalJson(record.steps),
      trigger: optionalJson(record.trigger),
    },
  };
}

export function parseRunWorkflowInput(
  body: unknown,
): ParsedWorkflowInput<WorkflowRunInput> {
  const record = readBodyRecord(body);

  return {
    errors: [],
    value: {
      confirm: typeof record.confirm === "boolean" ? record.confirm : false,
      conversationId: optionalNullableString(record.conversationId),
      input: optionalJson(record.input),
    },
  };
}
