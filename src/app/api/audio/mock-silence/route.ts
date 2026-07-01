import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function createSilentWav(durationMs: number) {
  const sampleRate = 8000;
  const channelCount = 1;
  const bytesPerSample = 2;
  const sampleCount = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = sampleCount * channelCount * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  return Buffer.from(buffer);
}

function parseDuration(value: string | null) {
  const durationMs = Number(value);
  if (!Number.isFinite(durationMs)) return 900;
  return Math.min(3000, Math.max(200, Math.floor(durationMs)));
}

export async function GET(request: NextRequest) {
  const durationMs = parseDuration(
    request.nextUrl.searchParams.get("durationMs"),
  );

  return new Response(createSilentWav(durationMs), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "audio/wav",
    },
  });
}
