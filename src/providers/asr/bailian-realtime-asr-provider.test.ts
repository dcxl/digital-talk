import { describe, expect, it } from "vitest";
import {
  createBailianASRFinishMessage,
  createBailianASRStartMessage,
} from "./bailian-realtime-asr-provider";

describe("Bailian realtime ASR task messages", () => {
  it("builds the DashScope start task payload", () => {
    expect(
      createBailianASRStartMessage({
        format: "wav",
        model: "fun-asr-realtime",
        sampleRate: 16000,
        taskId: "task-1",
      }),
    ).toEqual({
      header: {
        action: "run-task",
        streaming: "duplex",
        task_id: "task-1",
      },
      payload: {
        task_group: "audio",
        task: "asr",
        function: "recognition",
        model: "fun-asr-realtime",
        parameters: {
          format: "wav",
          sample_rate: 16000,
        },
        input: {},
      },
    });
  });

  it("builds the finish task payload", () => {
    expect(createBailianASRFinishMessage("task-1")).toEqual({
      header: {
        action: "finish-task",
        streaming: "duplex",
        task_id: "task-1",
      },
      payload: {
        input: {},
      },
    });
  });
});
