import { createCipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = "v1";

function getEncryptionKey() {
  const secret = process.env.PROVIDER_SECRET_KEY;

  if (!secret || secret.length < 32) {
    throw new Error("PROVIDER_SECRET_KEY must be at least 32 characters");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}
