import { describe, expect, it } from "vitest";
import {
  createBailianCosyVoiceTTSProvider,
  createCosyVoiceContinueMessage,
  createCosyVoiceFinishMessage,
  createCosyVoiceStartMessage,
} from "./bailian-cosyvoice-tts-provider";

describe("Bailian CosyVoice task messages", () => {
  it("exposes a streaming TTS interface", () => {
    const provider = createBailianCosyVoiceTTSProvider({
      apiKey: "test-key",
      model: "cosyvoice-v3-flash",
      voice: "longxiaochun",
    });

    expect(typeof provider.stream).toBe("function");
  });

  it("builds the DashScope start task payload", () => {
    const message = createCosyVoiceStartMessage({
      format: "mp3",
      model: "cosyvoice-v3-flash",
      sampleRate: 22050,
      taskId: "task-1",
      voice: "longxiaochun",
    });

    expect(message).toEqual({
      header: {
        action: "run-task",
        streaming: "duplex",
        task_id: "task-1",
      },
      payload: {
        task_group: "audio",
        task: "tts",
        function: "SpeechSynthesizer",
        model: "cosyvoice-v3-flash",
        parameters: {
          text_type: "PlainText",
          voice: "longxiaochun",
          format: "mp3",
          sample_rate: 22050,
        },
        input: {},
      },
    });
  });

  it("builds text and finish task payloads", () => {
    expect(
      createCosyVoiceContinueMessage({
        format: "wav",
        model: "cosyvoice-v3-flash",
        sampleRate: 22050,
        taskId: "task-2",
        text: "你好",
        voice: "longxiaochun",
      }),
    ).toEqual({
      header: {
        action: "continue-task",
        streaming: "duplex",
        task_id: "task-2",
      },
      payload: {
        input: {
          text: "你好",
        },
      },
    });

    expect(createCosyVoiceFinishMessage("task-2")).toEqual({
      header: {
        action: "finish-task",
        streaming: "duplex",
        task_id: "task-2",
      },
      payload: {
        input: {},
      },
    });
  });
});
