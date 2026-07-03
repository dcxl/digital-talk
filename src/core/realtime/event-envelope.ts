export interface RealtimeEventEnvelope<
  TType extends string = string,
  TPayload = unknown,
> {
  id: string;
  payload: TPayload;
  sequence: number;
  sessionId: string;
  timestamp: string;
  type: TType;
}

export interface StoredRealtimeEventLike<
  TType extends string = string,
  TPayload = unknown,
> {
  createdAt: string;
  id: string;
  payload?: TPayload;
  sequence: number;
  sessionId: string;
  type: TType;
}

function createEventId() {
  return globalThis.crypto?.randomUUID?.() ?? `evt_${Date.now()}_${Math.random()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function createRealtimeEventEnvelope<
  TType extends string,
  TPayload = null,
>(input: {
  id?: string;
  payload?: TPayload;
  sequence: number;
  sessionId: string;
  timestamp?: string;
  type: TType;
}): RealtimeEventEnvelope<TType, TPayload | null> {
  return {
    id: input.id ?? createEventId(),
    payload: input.payload ?? null,
    sequence: input.sequence,
    sessionId: input.sessionId,
    timestamp: input.timestamp ?? new Date().toISOString(),
    type: input.type,
  };
}

export function realtimeEventToEnvelope<
  TType extends string,
  TPayload = unknown,
>(
  event: StoredRealtimeEventLike<TType, TPayload>,
): RealtimeEventEnvelope<TType, TPayload | null> {
  return createRealtimeEventEnvelope({
    id: event.id,
    payload: event.payload,
    sequence: event.sequence,
    sessionId: event.sessionId,
    timestamp: event.createdAt,
    type: event.type,
  });
}

export function isRealtimeEventEnvelope(
  value: unknown,
): value is RealtimeEventEnvelope {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.sessionId === "string" &&
    typeof value.sequence === "number" &&
    Number.isFinite(value.sequence) &&
    typeof value.timestamp === "string" &&
    typeof value.type === "string" &&
    "payload" in value
  );
}
