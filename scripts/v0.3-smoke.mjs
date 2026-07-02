const defaultBaseUrl = "http://127.0.0.1:3000";
const baseUrl = normalizeBaseUrl(
  process.env.SMOKE_BASE_URL || getArgValue("--base-url") || defaultBaseUrl,
);
const skipChat = isTruthy(process.env.SMOKE_SKIP_CHAT);
const skipTTS = isTruthy(process.env.SMOKE_SKIP_TTS);
const skipPages = isTruthy(process.env.SMOKE_SKIP_PAGES);

const state = {
  checks: 0,
  failures: 0,
  metrics: [],
};

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase());
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function endpoint(path) {
  return `${baseUrl}${path}`;
}

function ok(message) {
  state.checks += 1;
  console.log(`ok ${state.checks} - ${message}`);
}

function fail(message) {
  state.failures += 1;
  console.error(`not ok ${state.checks + state.failures} - ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function formatPayload(payload) {
  if (typeof payload === "string") return payload.slice(0, 500);
  return JSON.stringify(payload).slice(0, 500);
}

function recordMetric(label, startedAt) {
  state.metrics.push({
    label,
    ms: Math.max(0, Math.round(performance.now() - startedAt)),
  });
}

async function timed(label, fn) {
  const startedAt = performance.now();
  try {
    return await fn();
  } finally {
    recordMetric(label, startedAt);
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return response.text();
}

async function request(path, options = {}) {
  const expected = options.expected ?? [200];
  const headers = new Headers(options.headers);
  let body = options.body;

  if (
    body &&
    !(body instanceof FormData) &&
    typeof body !== "string" &&
    !(body instanceof Blob)
  ) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(endpoint(path), {
    ...options,
    body,
    headers,
  });
  const payload = await parseResponse(response);

  if (!expected.includes(response.status)) {
    throw new Error(
      `${options.method ?? "GET"} ${path} returned ${response.status}: ${formatPayload(
        payload,
      )}`,
    );
  }

  return {
    payload,
    response,
  };
}

function parseSSE(text) {
  return text
    .split(/\n\n+/)
    .map((block) => {
      const event = {};

      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith("event: ")) event.event = line.slice(7);
        if (line.startsWith("id: ")) event.id = line.slice(4);
        if (line.startsWith("data: ")) event.data = JSON.parse(line.slice(6));
      }

      return event.data === undefined ? null : event;
    })
    .filter(Boolean);
}

function writeString(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function createSilentWav(options = {}) {
  const sampleRate = options.sampleRate ?? 16000;
  const durationMs = options.durationMs ?? 500;
  const samples = Math.max(1, Math.floor((sampleRate * durationMs) / 1000));
  const channels = 1;
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  return new Uint8Array(buffer);
}

async function checkPage(path) {
  const { payload } = await timed(`page ${path}`, () => request(path));

  assert(typeof payload === "string" && payload.length > 0, `${path} is empty`);
  ok(`${path} page returns 200`);
}

async function createRealtimeSession() {
  const { payload } = await timed("realtime session create", () =>
    request("/api/realtime/sessions", {
      body: {
        metadata: {
          source: "v0.3-smoke",
        },
        transport: "sse",
      },
      expected: [201],
      method: "POST",
    }),
  );
  const session = payload.data?.session;

  assert(session?.id, "realtime session id is missing");
  assert(session.status === "idle", `session status is ${session.status}`);
  assert(session.transport === "sse", `session transport is ${session.transport}`);
  ok("realtime session opens");

  return session;
}

async function getRealtimeSession(sessionId) {
  const { payload } = await timed("realtime session get", () =>
    request(`/api/realtime/sessions/${sessionId}`),
  );
  const session = payload.data?.session;

  assert(session?.id === sessionId, "realtime session get returned wrong session");
  ok("realtime session is queryable");

  return session;
}

async function transcribeAudio(sessionId) {
  const formData = new FormData();
  formData.append(
    "audio",
    new Blob([createSilentWav()], { type: "audio/wav" }),
    "smoke.wav",
  );
  formData.append("language", "zh-CN");

  const { payload } = await timed("realtime asr", () =>
    request(`/api/realtime/sessions/${sessionId}/asr`, {
      body: formData,
      method: "POST",
    }),
  );
  const result = payload.data;
  const events = result?.events ?? [];
  const transcript = result?.transcript;

  assert(
    events.some((event) => event.type === "asr.partial"),
    "asr.partial event is missing",
  );
  assert(
    events.some((event) => event.type === "asr.final"),
    "asr.final event is missing",
  );
  assert(
    typeof transcript?.text === "string" && transcript.text.length > 0,
    "final transcript text is missing",
  );
  assert(result.session?.status === "idle", "session did not return to idle");
  ok("microphone audio produces final transcript");

  if (result.conversationId) ok("final transcript persists conversation");
  if (result.message?.id) ok("final transcript persists user message");

  return result;
}

async function checkChatTurn(asrResult) {
  if (skipChat) return null;

  const transcript = asrResult.transcript?.text;
  assert(typeof transcript === "string" && transcript, "chat transcript is missing");

  const response = await timed("chat from realtime transcript", () =>
    fetch(endpoint("/api/chat"), {
      body: JSON.stringify({
        conversationId: asrResult.conversationId,
        enableTTS: !skipTTS,
        message: transcript,
        userMessageId: asrResult.message?.id,
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    }),
  );

  assert(response.status === 200, `chat returned ${response.status}`);

  const events = parseSSE(await response.text());
  const done = events.find((entry) => entry.data?.type === "done")?.data;
  const error = events.find((entry) => entry.data?.type === "error")?.data;
  const textDone = events.find((entry) => entry.data?.type === "text.done")?.data;
  const ttsDone = events.find((entry) => entry.data?.type === "tts.done")?.data;
  const ttsFailed = events.find((entry) => entry.data?.type === "tts.failed")?.data;
  const speaking = events.find(
    (entry) => entry.data?.type === "avatar.state" && entry.data.state === "speaking",
  )?.data;

  assert(!error, `chat failed: ${error?.message}`);
  assert(done?.conversationId, "chat done event is missing conversationId");
  assert(textDone, "chat text.done event is missing");
  ok("transcript triggers LLM reply");

  if (!skipTTS) {
    assert(!ttsFailed, `chat tts failed: ${ttsFailed?.message}`);
    assert(ttsDone?.audioUrl, "chat tts.done audioUrl is missing");
    assert(speaking, "avatar speaking state is missing");
    ok("TTS audio and avatar speaking state are emitted");
  }

  return done;
}

async function interruptSession(sessionId) {
  const { payload } = await timed("realtime interrupt", () =>
    request(`/api/realtime/sessions/${sessionId}/interrupt`, {
      body: {
        reason: "smoke_barge_in",
      },
      method: "POST",
    }),
  );
  const session = payload.data?.session;
  const event = payload.data?.event;

  assert(session?.status === "interrupted", "session was not interrupted");
  assert(event?.type === "session.interrupted", "interrupt event is missing");
  ok("barge-in interrupt is persisted");
}

async function closeSession(sessionId) {
  const { payload } = await timed("realtime close", () =>
    request(`/api/realtime/sessions/${sessionId}/close`, {
      method: "POST",
    }),
  );
  const session = payload.data?.session;

  assert(session?.status === "closed", "session was not closed");
  ok("realtime session closes");
}

async function checkEventReplay(sessionId) {
  const { payload } = await timed("realtime event replay", () =>
    request(`/api/realtime/sessions/${sessionId}/events`),
  );
  const entries = parseSSE(payload);
  const eventNames = new Set(entries.map((entry) => entry.event));

  assert(eventNames.has("session.snapshot"), "session snapshot event is missing");
  assert(eventNames.has("asr.partial"), "asr.partial replay is missing");
  assert(eventNames.has("asr.final"), "asr.final replay is missing");
  assert(
    eventNames.has("session.interrupted"),
    "session.interrupted replay is missing",
  );
  assert(eventNames.has("session.closed"), "session.closed replay is missing");
  ok("SSE event replay includes realtime lifecycle");
}

async function checkFailureRecovery(sessionId) {
  await timed("closed interrupt rejection", () =>
    request(`/api/realtime/sessions/${sessionId}/interrupt`, {
      body: {
        reason: "after_close",
      },
      expected: [409],
      method: "POST",
    }),
  );
  ok("closed session rejects interrupt");

  const formData = new FormData();
  formData.append(
    "audio",
    new Blob([createSilentWav({ durationMs: 120 })], { type: "audio/wav" }),
    "closed.wav",
  );

  await timed("closed asr rejection", () =>
    request(`/api/realtime/sessions/${sessionId}/asr`, {
      body: formData,
      expected: [409],
      method: "POST",
    }),
  );
  ok("closed session rejects ASR");

  await timed("missing session rejection", () =>
    request("/api/realtime/sessions/smoke-missing-session", {
      expected: [404],
    }),
  );
  ok("missing session returns readable 404");
}

function printMetrics() {
  console.log("# latency metrics");
  for (const metric of state.metrics) {
    console.log(`# ${metric.label}: ${metric.ms}ms`);
  }
}

async function main() {
  console.log(`# v0.3 smoke baseUrl=${baseUrl}`);

  if (!skipPages) {
    await checkPage("/conversation");
    await checkPage("/avatar");
  }

  const session = await createRealtimeSession();
  let closed = false;

  try {
    await getRealtimeSession(session.id);
    const asrResult = await transcribeAudio(session.id);
    await checkChatTurn(asrResult);
    await interruptSession(session.id);
    await closeSession(session.id);
    closed = true;
    await checkEventReplay(session.id);
    await checkFailureRecovery(session.id);
  } finally {
    if (!closed) {
      await closeSession(session.id).catch(() => undefined);
    }
  }

  printMetrics();
  console.log(`# passed ${state.checks} checks`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
  printMetrics();
  process.exitCode = 1;
});
