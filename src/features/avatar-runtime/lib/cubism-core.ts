"use client";

let loadingPromise: Promise<void> | null = null;

declare global {
  interface Window {
    Live2DCubismCore?: unknown;
  }
}

export function ensureCubismCore() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Live2DCubismCore) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-live2d-cubism-core="true"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Live2D Cubism Core 加载失败")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.dataset.live2dCubismCore = "true";
    script.src = "/vendor/live2d/live2dcubismcore.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Live2D Cubism Core 加载失败"));
    document.head.appendChild(script);
  });

  return loadingPromise;
}
