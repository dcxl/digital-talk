import { afterEach, describe, expect, it, vi } from "vitest";
import { decryptSecret, encryptSecret } from "./secret-crypto";

describe("secret crypto", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("decrypts encrypted provider secrets", () => {
    vi.stubEnv("PROVIDER_SECRET_KEY", "x".repeat(32));

    const encrypted = encryptSecret("sk-test-secret");

    expect(encrypted).not.toContain("sk-test-secret");
    expect(decryptSecret(encrypted)).toBe("sk-test-secret");
  });
});
