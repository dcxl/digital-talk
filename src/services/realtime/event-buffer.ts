import { randomUUID } from "node:crypto";
import type {
  RealtimeSessionEvent,
  RealtimeSessionEventType,
  RealtimeSessionStore,
} from "./types";

export function getNextRealtimeEventSequence(events: RealtimeSessionEvent[]) {
  return events.reduce((max, event) => Math.max(max, event.sequence), 0) + 1;
}

export function createRealtimeSessionEvent(input: {
  payload?: Record<string, unknown>;
  sequence: number;
  sessionId: string;
  type: RealtimeSessionEventType;
}): RealtimeSessionEvent {
  return {
    createdAt: new Date().toISOString(),
    id: randomUUID(),
    payload: input.payload,
    sequence: input.sequence,
    sessionId: input.sessionId,
    type: input.type,
  };
}

export async function appendRealtimeSessionEvent(
  store: RealtimeSessionStore,
  input: {
    payload?: Record<string, unknown>;
    sessionId: string;
    ttlSeconds: number;
    type: RealtimeSessionEventType;
  },
) {
  const events = await store.listEvents(input.sessionId);
  const event = createRealtimeSessionEvent({
    payload: input.payload,
    sequence: getNextRealtimeEventSequence(events),
    sessionId: input.sessionId,
    type: input.type,
  });

  await store.appendEvent(input.sessionId, event, input.ttlSeconds);
  return event;
}
