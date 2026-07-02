"use client";

import { useCallback, useEffect, useState } from "react";
import type { AvatarRuntimeSnapshot } from "../types";

interface RuntimeResponse {
  data?: {
    runtime?: AvatarRuntimeSnapshot;
  };
  error?: {
    message?: string;
  };
}

export function useAvatarRuntime(avatarId?: null | string) {
  const [runtime, setRuntime] = useState<AvatarRuntimeSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadRuntime = useCallback(async () => {
    await Promise.resolve();

    if (!avatarId) {
      setRuntime(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/avatar-profiles/${avatarId}/runtime`);
      const payload = (await response.json().catch(() => null)) as
        | RuntimeResponse
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ?? `Runtime request failed: ${response.status}`,
        );
      }

      setRuntime(payload?.data?.runtime ?? null);
    } catch (nextError) {
      setRuntime(null);
      setError(nextError instanceof Error ? nextError.message : "数字人运行时加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [avatarId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRuntime();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRuntime]);

  return {
    error,
    isLoading,
    loadRuntime,
    runtime,
  };
}
