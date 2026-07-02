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
  conversationId?: string | null;
  message?: {
    id: string;
  } | null;
  transcript?: ASRTranscript | null;
}

export interface VoiceTranscriptResult {
  conversationId?: string | null;
  messageId?: string | null;
  text: string;
}

function getPayloadError<T>(payload: ApiPayload<T>, fallback: string) {
  return payload.error?.message ?? fallback;
}

function getAudioFileName(audio: Blob) {
  if (audio.type.includes("wav")) return "recording.wav";
  if (audio.type.includes("mpeg") || audio.type.includes("mp3")) {
    return "recording.mp3";
  }

  return "recording.webm";
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
}): Promise<VoiceTranscriptResult> {
  const formData = new FormData();
  formData.append("audio", input.audio, getAudioFileName(input.audio));
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

  return {
    conversationId: payload.data?.conversationId,
    messageId: payload.data?.message?.id,
    text: payload.data?.transcript?.text?.trim() ?? "",
  };
}

export async function transcribeLegacyAudio(
  audio: Blob,
  language = "zh",
): Promise<VoiceTranscriptResult> {
  const formData = new FormData();
  formData.append("audio", audio, getAudioFileName(audio));
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

  return {
    text: payload.data?.text?.trim() ?? "",
  };
}
