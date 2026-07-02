const defaultBaseUrl = "http://127.0.0.1:3000";
const baseUrl = normalizeBaseUrl(
  process.env.SMOKE_BASE_URL || getArgValue("--base-url") || defaultBaseUrl,
);
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

async function checkPage(path) {
  const { payload } = await timed(`page ${path}`, () => request(path));

  assert(typeof payload === "string" && payload.length > 0, `${path} is empty`);
  ok(`${path} page returns 200`);
}

async function getLive2DPackage() {
  const { payload } = await timed("live2d packages", () =>
    request("/api/avatar-runtime/live2d-packages"),
  );
  const packages = payload.data?.packages ?? [];
  const selected =
    packages.find((item) => item.packageId === "huohuo") ?? packages[0];

  assert(selected?.packageId, "live2d package is missing");
  assert(selected.valid, `live2d package is invalid: ${selected.errors?.join("; ")}`);
  assert(selected.entrypoint?.url, "live2d package entrypoint is missing");
  assert(selected.textures?.length > 0, "live2d package textures are missing");
  ok(`live2d package ${selected.packageId} is valid`);

  return selected;
}

async function createLive2DProfile(packageId) {
  const name = `Smoke Live2D ${new Date().toISOString()}`;
  const { payload } = await timed("create live2d profile", () =>
    request("/api/avatar-profiles", {
      body: {
        background: "studio",
        config: {
          runtime: {
            motionMap: {
              speaking: {
                expression: ["qizi1", "happy"],
                motion: ["Speaking", "Scene1"],
              },
            },
            packageId,
          },
        },
        driver: "live2d",
        isDefault: false,
        language: "zh-CN",
        name,
        status: "active",
        voice: "default",
      },
      expected: [201],
      method: "POST",
    }),
  );
  const profile = payload.data?.profile;

  assert(profile?.id, "live2d profile id is missing");
  assert(profile.driver === "live2d", "live2d profile driver is wrong");
  ok("live2d profile created");

  return profile;
}

async function checkRuntime(profile, packageId) {
  const { payload } = await timed("live2d runtime snapshot", () =>
    request(`/api/avatar-profiles/${profile.id}/runtime`),
  );
  const runtime = payload.data?.runtime;

  assert(runtime?.driver === "live2d", "runtime driver is not live2d");
  assert(runtime.status === "ready", `runtime status is ${runtime.status}`);
  assert(runtime.asset?.id === packageId, "runtime asset id is wrong");
  assert(runtime.capabilities?.live2d, "runtime live2d capability is false");
  assert(typeof runtime.loadLatencyMs === "number", "runtime latency is missing");
  assert(runtime.motionMap?.speaking, "runtime motion map is missing");
  ok("live2d runtime snapshot is ready");

  return runtime;
}

async function checkPreviewState(profile, previewState) {
  const { payload } = await timed(`preview ${previewState}`, () =>
    request(`/api/avatar-profiles/${profile.id}/preview`, {
      body: {
        state: previewState,
        text: `v0.4 smoke ${previewState}`,
      },
      method: "POST",
    }),
  );
  const preview = payload.data?.preview;
  const runtime = preview?.runtime;

  assert(preview?.state === previewState, `preview state is ${preview?.state}`);
  assert(runtime?.driver === "live2d", "preview runtime driver is not live2d");
  assert(
    runtime.motion?.state === previewState,
    `preview motion state is ${runtime.motion?.state}`,
  );
  assert(typeof runtime.loadLatencyMs === "number", "preview latency is missing");

  if (previewState === "speaking") {
    assert(
      runtime.motion.source === "profile-config",
      "speaking motion override was not used",
    );
  }

  ok(`${previewState} preview returns runtime snapshot`);
}

async function checkPreviewStates(profile) {
  for (const previewState of [
    "idle",
    "thinking",
    "speaking",
    "interrupted",
    "error",
  ]) {
    await checkPreviewState(profile, previewState);
  }
}

async function checkMissingPackageFallback() {
  const profile = await createLive2DProfile("smoke-missing-package");
  const { payload } = await timed("missing live2d package fallback", () =>
    request(`/api/avatar-profiles/${profile.id}/runtime`),
  );
  const runtime = payload.data?.runtime;

  assert(runtime?.driver === "live2d", "fallback runtime driver is wrong");
  assert(runtime.status === "degraded", `fallback status is ${runtime.status}`);
  assert(runtime.fallbackDriver === "static", "fallback driver is not static");
  ok("missing live2d package degrades to static");
}

function printMetrics() {
  console.log("# latency metrics");
  for (const metric of state.metrics) {
    console.log(`# ${metric.label}: ${metric.ms}ms`);
  }
}

async function main() {
  console.log(`# v0.4 smoke baseUrl=${baseUrl}`);

  if (!skipPages) {
    await checkPage("/avatar");
    await checkPage("/conversation");
  }

  const live2dPackage = await getLive2DPackage();
  const profile = await createLive2DProfile(live2dPackage.packageId);

  await checkRuntime(profile, live2dPackage.packageId);
  await checkPreviewStates(profile);
  await checkMissingPackageFallback();

  printMetrics();
  console.log(`# passed ${state.checks} checks`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
  printMetrics();
  process.exitCode = 1;
});
