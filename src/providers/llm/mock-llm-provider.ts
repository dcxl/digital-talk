import type { LLMChatInput, LLMProvider } from "@/core/providers/types";

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("aborted"));
      return;
    }

    const timer = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      globalThis.clearTimeout(timer);
      reject(new Error("aborted"));
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function buildAnswer(input: LLMChatInput) {
  const latestQuestion =
    input.messages.findLast((message) => message.role === "user")?.content ?? "";

  if (/provider|llm|接口/i.test(latestQuestion)) {
    return "Provider 层会把 LLM、TTS、Avatar、ASR 都收敛成稳定接口。页面和 Runtime 只消费事件流，不直接绑定具体厂商；后续接 OpenAI Compatible、百炼或本地模型时，只需要新增 Provider 适配器。";
  }

  if (/mvp|阶段|任务/i.test(latestQuestion)) {
    return "MVP 第一阶段建议锁定文本对话闭环：会话创建、LLM 流式回复、TTS 状态事件、Avatar 状态驱动和基础错误处理。等链路稳定后，再扩展语音输入、RAG、Tool Calling 和多 Avatar。";
  }

  return "当前原型已经从纯前端 mock 进入 Runtime 骨架：浏览器提交消息，服务端通过事件流返回文本增量、TTS 状态和 Avatar 状态。下一步可以接入真实 LLM Provider，并把会话、消息和事件落库。";
}

export const mockLLMProvider: LLMProvider = {
  id: "mock-llm",
  name: "Mock LLM Provider",
  capability: "llm",
  version: "0.1.0",
  health: "ready",

  async *chat(input) {
    const answer = buildAnswer(input);
    const chunks = answer.match(/[\s\S]{1,6}/g) ?? [];

    for (const chunk of chunks) {
      await wait(42, input.signal);
      yield {
        type: "text.delta",
        text: chunk,
      };
    }

    yield {
      type: "usage",
      usage: {
        promptTokens: Math.ceil(JSON.stringify(input.messages).length / 4),
        completionTokens: Math.ceil(answer.length / 2),
        totalTokens:
          Math.ceil(JSON.stringify(input.messages).length / 4) +
          Math.ceil(answer.length / 2),
      },
    };

    yield {
      type: "done",
      finishReason: "stop",
    };
  },
};
