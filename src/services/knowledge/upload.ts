import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export function sanitizeFileName(name: string) {
  return name
    .replaceAll(/[/\\?%*:|"<>]/g, "-")
    .replaceAll(/\s+/g, "-")
    .slice(0, 120);
}

export function isTextLikeFile(file: File) {
  return (
    file.type.startsWith("text/") ||
    /\.(csv|json|md|markdown|txt)$/i.test(file.name)
  );
}

export async function persistKnowledgeFile(input: {
  file: File;
  knowledgeBaseId: string;
}) {
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const safeName = sanitizeFileName(input.file.name || "document");
  const objectName = `${crypto.randomUUID()}-${safeName}`;
  const relativeDir = join("storage", "uploads", input.knowledgeBaseId);
  const relativePath = join(relativeDir, objectName);
  const absoluteDir = join(process.cwd(), relativeDir);
  const absolutePath = join(process.cwd(), relativePath);

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    bytes,
    storageKey: relativePath,
  };
}
