import { useCallback, useRef, useState } from "react";
import type {
  AsyncStatus,
  KnowledgeBaseSummary,
  KnowledgeDocumentSummary,
} from "../types";

export function useKnowledgeBases() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseSummary[]>(
    [],
  );
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] = useState("");
  const [knowledgeDocuments, setKnowledgeDocuments] = useState<
    KnowledgeDocumentSummary[]
  >([]);
  const [knowledgeName, setKnowledgeName] = useState("");
  const [knowledgeStatus, setKnowledgeStatus] = useState<AsyncStatus>("idle");
  const [knowledgeStatusText, setKnowledgeStatusText] = useState("");
  const knowledgeFileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedKnowledgeBase = knowledgeBases.find(
    (knowledgeBase) => knowledgeBase.id === selectedKnowledgeBaseId,
  );

  const loadKnowledgeBases = useCallback(async () => {
    setKnowledgeStatus("loading");

    try {
      const response = await fetch("/api/knowledge-bases");
      const payload = (await response.json()) as {
        data?: {
          knowledgeBases?: KnowledgeBaseSummary[];
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      setKnowledgeBases(payload.data?.knowledgeBases ?? []);
      setKnowledgeStatus("success");
      setKnowledgeStatusText("知识库已同步");
    } catch (error) {
      setKnowledgeStatus("error");
      setKnowledgeStatusText(
        error instanceof Error ? error.message : "加载知识库失败",
      );
    }
  }, []);

  const loadKnowledgeDocuments = useCallback(async (knowledgeBaseId: string) => {
    setKnowledgeStatus("loading");

    try {
      const response = await fetch(
        `/api/knowledge-bases/${knowledgeBaseId}/documents`,
      );
      const payload = (await response.json()) as {
        data?: {
          documents?: KnowledgeDocumentSummary[];
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      setKnowledgeDocuments(payload.data?.documents ?? []);
      setKnowledgeStatus("success");
      setKnowledgeStatusText("文档已同步");
    } catch (error) {
      setKnowledgeStatus("error");
      setKnowledgeStatusText(
        error instanceof Error ? error.message : "加载文档失败",
      );
    }
  }, []);

  async function createKnowledgeBase() {
    const name = knowledgeName.trim();
    if (!name) return;

    setKnowledgeStatus("loading");

    try {
      const response = await fetch("/api/knowledge-bases", {
        body: JSON.stringify({
          name,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        data?: {
          knowledgeBase?: KnowledgeBaseSummary;
        };
        error?: {
          message?: string;
        };
      };

      if (!response.ok || !payload.data?.knowledgeBase) {
        throw new Error(payload.error?.message);
      }

      setKnowledgeBases((current) => [payload.data!.knowledgeBase!, ...current]);
      setSelectedKnowledgeBaseId(payload.data.knowledgeBase.id);
      setKnowledgeName("");
      setKnowledgeStatus("success");
      setKnowledgeStatusText("知识库已创建");
    } catch (error) {
      setKnowledgeStatus("error");
      setKnowledgeStatusText(
        error instanceof Error ? error.message : "创建知识库失败",
      );
    }
  }

  async function uploadKnowledgeDocument(file: File) {
    if (!selectedKnowledgeBaseId) return;

    setKnowledgeStatus("loading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/knowledge-bases/${selectedKnowledgeBaseId}/documents`,
        {
          body: formData,
          method: "POST",
        },
      );
      const payload = (await response.json()) as {
        error?: {
          message?: string;
        };
      };

      if (!response.ok) throw new Error(payload.error?.message);

      await loadKnowledgeBases();
      await loadKnowledgeDocuments(selectedKnowledgeBaseId);
      setKnowledgeStatus("success");
      setKnowledgeStatusText("文档已上传");
    } catch (error) {
      setKnowledgeStatus("error");
      setKnowledgeStatusText(
        error instanceof Error ? error.message : "上传文档失败",
      );
    } finally {
      if (knowledgeFileInputRef.current) {
        knowledgeFileInputRef.current.value = "";
      }
    }
  }

  return {
    createKnowledgeBase,
    knowledgeBases,
    knowledgeDocuments,
    knowledgeFileInputRef,
    knowledgeName,
    knowledgeStatus,
    knowledgeStatusText,
    loadKnowledgeBases,
    loadKnowledgeDocuments,
    selectedKnowledgeBase,
    selectedKnowledgeBaseId,
    setKnowledgeDocuments,
    setKnowledgeName,
    setKnowledgeStatus,
    setKnowledgeStatusText,
    setSelectedKnowledgeBaseId,
    uploadKnowledgeDocument,
  };
}
