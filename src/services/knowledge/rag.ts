export interface RAGSource {
  chunkId: string;
  content: string;
  documentId: string;
  documentName: string;
}

export function toRAGContextMessage(sources: RAGSource[]) {
  if (sources.length === 0) return undefined;

  const context = sources
    .map((source, index) => {
      const content = source.content.slice(0, 1500);
      return `[${index + 1}] ${source.documentName}\n${content}`;
    })
    .join("\n\n");

  return [
    "你正在回答一个带知识库上下文的问题。",
    "优先使用以下检索内容回答；如果上下文不足，请明确说明信息不足，不要编造。",
    "",
    context,
  ].join("\n");
}

export function toRAGSourcePreview(sources: RAGSource[]) {
  return sources.map((source) => ({
    chunkId: source.chunkId,
    documentId: source.documentId,
    documentName: source.documentName,
    preview: source.content.slice(0, 180),
  }));
}
