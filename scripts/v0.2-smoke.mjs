const defaultBaseUrl = "http://localhost:3000";
const baseUrl = normalizeBaseUrl(
  process.env.SMOKE_BASE_URL || getArgValue("--base-url") || defaultBaseUrl,
);
const skipChat = isTruthy(process.env.SMOKE_SKIP_CHAT);
const skipTTS = isTruthy(process.env.SMOKE_SKIP_TTS);
const runProviderTest = !isTruthy(process.env.SMOKE_SKIP_PROVIDER_TEST);
const runUploadLimit = !isTruthy(process.env.SMOKE_SKIP_UPLOAD_LIMIT);

const state = {
  checks: 0,
  failures: 0,
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

async function checkPage(path) {
  const { payload } = await request(path);
  assert(typeof payload === "string" && payload.length > 0, `${path} is empty`);
  ok(`${path} page returns 200`);
}

async function createAvatarProfile() {
  const name = `Smoke Avatar ${new Date().toISOString()}`;
  const { payload } = await request("/api/avatar-profiles", {
    body: {
      background: "studio",
      driver: "static",
      isDefault: true,
      language: "zh-CN",
      name,
      status: "active",
      voice: "default",
    },
    expected: [201],
    method: "POST",
  });
  const profile = payload.data?.profile;

  assert(profile?.id, "avatar profile was not created");
  ok("avatar profile created");

  return profile;
}

async function generateAvatarAsset(profileId) {
  const { payload } = await request("/api/avatar-generation-jobs", {
    body: {
      profileId,
      prompt: "v0.2 smoke generated digital human avatar",
      style: "portrait",
    },
    expected: [201],
    method: "POST",
  });
  const job = payload.data?.job;
  const asset = payload.data?.asset ?? job?.resultAsset;

  assert(job?.status === "completed", `avatar job status is ${job?.status}`);
  assert(asset?.id, "generated avatar asset is missing");
  ok("avatar generation job completed");

  return { asset, job };
}

async function bindAvatarAsset(profile, asset) {
  const previewImageUrl = `/api/avatar-assets/${asset.id}/content`;
  const { payload } = await request(`/api/avatar-profiles/${profile.id}`, {
    body: {
      previewImageUrl,
    },
    method: "PATCH",
  });
  const updated = payload.data?.profile;

  assert(updated?.previewImageUrl === previewImageUrl, "avatar asset was not bound");
  ok("avatar asset bound to profile");

  return updated;
}

async function checkAvatarAssetContent(asset) {
  const response = await fetch(endpoint(`/api/avatar-assets/${asset.id}/content`));

  assert(response.status === 200, `asset content returned ${response.status}`);
  assert(
    (response.headers.get("content-type") || "").startsWith("image/"),
    "asset content is not an image",
  );
  ok("avatar asset content is readable");
}

async function checkUploadLimit() {
  const formData = new FormData();
  const bytes = new Uint8Array(8 * 1024 * 1024 + 1);
  formData.append("file", new Blob([bytes], { type: "image/png" }), "too-large.png");

  await request("/api/avatar-assets/upload", {
    body: formData,
    expected: [413],
    method: "POST",
  });
  ok("oversized avatar upload is rejected");
}

async function checkTTS() {
  const text = "v0.2 smoke tts";
  const { payload } = await request("/api/tts", {
    body: {
      format: "mp3",
      text,
    },
    method: "POST",
  });
  const result = payload.data;

  assert(result?.audioUrl, "tts audioUrl is missing");
  assert(result?.mimeType, "tts mimeType is missing");
  ok("tts endpoint returns audio");

  if (!runProviderTest) return;

  const providerPayload = await request("/api/providers/test", {
    body: {
      format: "mp3",
      message: text,
      type: "tts",
    },
    method: "POST",
  });
  const providerResult = providerPayload.payload.data?.result;

  assert(providerResult?.success, "tts provider test did not succeed");
  ok("tts provider test succeeds");
}

function parseSSE(text) {
  return text
    .split(/\n\n+/)
    .map((block) =>
      block
        .split(/\r?\n/)
        .find((line) => line.startsWith("data: "))
        ?.slice(6),
    )
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function checkChatTurn() {
  const response = await fetch(endpoint("/api/chat"), {
    body: JSON.stringify({
      enableTTS: true,
      message: "Reply with: v0.2 smoke ok",
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  assert(response.status === 200, `chat returned ${response.status}`);

  const events = parseSSE(await response.text());
  const done = events.find((event) => event.type === "done");
  const ttsDone = events.find((event) => event.type === "tts.done");
  const ttsFailed = events.find((event) => event.type === "tts.failed");
  const error = events.find((event) => event.type === "error");

  assert(!error, `chat failed: ${error?.message}`);
  assert(done?.conversationId, "chat done event is missing conversationId");
  assert(!ttsFailed, `chat tts failed: ${ttsFailed?.message}`);
  assert(ttsDone?.audioUrl, "chat tts.done audioUrl is missing");
  ok("chat stream completes with tts audio");

  const { payload } = await request(`/api/conversations/${done.conversationId}`);
  const messages = payload.data?.conversation?.messages ?? [];
  const assistant = messages.find((message) => message.id === done.messageId);

  assert(assistant?.audioUrl, "assistant message audioUrl was not persisted");
  ok("assistant audioUrl is persisted");
}

async function main() {
  console.log(`# v0.2 smoke baseUrl=${baseUrl}`);

  await checkPage("/avatar");
  await checkPage("/models");
  await checkPage("/conversation");

  const profile = await createAvatarProfile();
  const { asset } = await generateAvatarAsset(profile.id);
  await checkAvatarAssetContent(asset);
  await bindAvatarAsset(profile, asset);

  if (runUploadLimit) await checkUploadLimit();
  if (!skipTTS) await checkTTS();
  if (!skipChat && !skipTTS) await checkChatTurn();

  console.log(`# passed ${state.checks} checks`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
