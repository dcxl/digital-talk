interface ApiPayload<T> {
  data?: T;
  error?: {
    message?: string;
  };
}

interface RealtimeSessionContext {
  avatarProfileId?: string | null;
  conversationId?: string | null;
  knowledgeBaseId?: string | null;
}

interface RealtimeSessionResponse {
  session?: {
    id: string;
  };
}

interface ASRTranscript {
  text?: string;
}

interface RealtimeASRResponse {
  transcript?: ASRTranscript | null;
}

function getPayloadError<T>(payload: ApiPayload<T>, fallback: string) {
  return payload.error?.message ?? fallback;
}

export async function createRealtimeSession(context: RealtimeSessionContext) {
  const response = await fetch("/api/realtime/sessions", {
    body: JSON.stringify({
      avatarProfileId: context.avatarProfileId || undefined,
      conversationId: context.conversationId || undefined,
      knowledgeBaseId: context.knowledgeBaseId || undefined,
      metadata: {
        source: "conversation_page",
      },
      transport: "websocket",
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as ApiPayload<RealtimeSessionResponse>;

  if (!response.ok || !payload.data?.session?.id) {
    throw new Error(getPayloadError(payload, "Realtime session 创建失败"));
  }

  return payload.data.session.id;
}

export async function closeRealtimeSession(sessionId: string) {
  await fetch(`/api/realtime/sessions/${sessionId}/close`, {
    method: "POST",
  }).catch(() => undefined);
}

export async function interruptRealtimeSession(
  sessionId: string,
  reason: string,
) {
  await fetch(`/api/realtime/sessions/${sessionId}/interrupt`, {
    body: JSON.stringify({ reason }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  }).catch(() => undefined);
}

export async function transcribeRealtimeAudio(input: {
  audio: Blob;
  language?: string;
  sessionId: string;
}) {
  const formData = new FormData();
  formData.append("audio", input.audio, "recording.webm");
  if (input.language) formData.append("language", input.language);

  const response = await fetch(
    `/api/realtime/sessions/${input.sessionId}/asr`,
    {
      body: formData,
      method: "POST",
    },
  );
  const payload = (await response.json()) as ApiPayload<RealtimeASRResponse>;

  if (!response.ok) {
    throw new Error(getPayloadError(payload, "Realtime ASR 转写失败"));
  }

  return payload.data?.transcript?.text?.trim() ?? "";
}

export async function transcribeLegacyAudio(audio: Blob, language = "zh") {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");
  formData.append("language", language);

  const response = await fetch("/api/asr", {
    body: formData,
    method: "POST",
  });
  const payload = (await response.json()) as ApiPayload<{
    text?: string;
  }>;

  if (!response.ok) {
    throw new Error(getPayloadError(payload, "ASR 转写失败"));
  }

  return payload.data?.text?.trim() ?? "";
}
