import { describe, expect, it } from "vitest";
import { toRAGContextMessage, toRAGSourcePreview } from "./rag";

describe("RAG prompt helpers", () => {
  const source = {
    chunkId: "chunk_1",
    content: "DeepSeek can be used through an OpenAI-compatible API.",
    documentId: "doc_1",
    documentName: "README.md",
  };

  it("builds a system context message from retrieved sources", () => {
    const message = toRAGContextMessage([source]);

    expect(message).toContain("知识库上下文");
    expect(message).toContain("README.md");
    expect(message).toContain("DeepSeek");
  });

  it("returns undefined when no source is retrieved", () => {
    expect(toRAGContextMessage([])).toBeUndefined();
  });

  it("creates source previews without full content", () => {
    expect(toRAGSourcePreview([source])).toEqual([
      {
        chunkId: "chunk_1",
        documentId: "doc_1",
        documentName: "README.md",
        preview: "DeepSeek can be used through an OpenAI-compatible API.",
      },
    ]);
  });
});
