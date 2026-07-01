"use client";

import { useEffect, useState } from "react";
import { emptySnapshot, readWorkspaceSnapshot } from "../lib/api";
import type { WorkspaceSnapshot } from "../types";

export function useWorkspaceSnapshot() {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(emptySnapshot);
  const [isLoading, setIsLoading] = useState(true);

  async function loadSnapshot() {
    setIsLoading(true);
    setSnapshot(await readWorkspaceSnapshot());
    setIsLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    void readWorkspaceSnapshot().then((nextSnapshot) => {
      if (cancelled) return;
      setSnapshot(nextSnapshot);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isLoading,
    loadSnapshot,
    snapshot,
  };
}
