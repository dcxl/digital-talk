"use client";

import { useEffect, useRef, useState } from "react";
import type { RuntimeState } from "@/core/runtime/events";
import { ensureCubismCore } from "../lib/cubism-core";

const MAX_RENDER_DPR = 1;
const MAX_RENDER_FPS = 24;
const MOUTH_GAIN = 2.8;
const SPEAKING_MOUTH_FLOOR = 0.16;

interface Live2DCanvasProps {
  entrypoint: string;
  mouthOpen: number;
  onError: (message: string) => void;
  onReady: () => void;
  state: RuntimeState;
}

type PixiModule = typeof import("pixi.js");
type Live2DModule = typeof import("pixi-live2d-display/cubism4");
type Live2DModelInstance = InstanceType<Live2DModule["Live2DModel"]>;

interface Live2DInternalSize {
  breath?: unknown;
  eyeBlink?: unknown;
  height?: number;
  originalHeight?: number;
  originalWidth?: number;
  physics?: unknown;
  width?: number;
}

interface Live2DInternalModel extends Live2DInternalSize {
  motionManager?: {
    stopAllMotions?: () => void;
  };
}

declare global {
  interface Window {
    PIXI?: PixiModule;
  }
}

function fitModel(input: {
  app: import("pixi.js").Application;
  container: HTMLDivElement;
  model: Live2DModelInstance;
}) {
  const width = Math.max(1, input.container.clientWidth);
  const height = Math.max(1, input.container.clientHeight);

  input.app.renderer.resize(width, height);

  const internalModel = input.model.internalModel as Live2DInternalSize | undefined;
  const modelWidth = Math.max(
    internalModel?.originalWidth ?? 0,
    internalModel?.width ?? 0,
    input.model.width || 0,
    width,
  );
  const modelHeight = Math.max(
    internalModel?.originalHeight ?? 0,
    internalModel?.height ?? 0,
    input.model.height || 0,
    height,
  );
  const scale = Math.min(width / modelWidth, height / modelHeight) * 0.92;

  input.model.anchor.set(0.5, 0.5);
  input.model.scale.set(scale);
  input.model.x = width / 2;
  input.model.y = height / 2;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getMouthTarget(value: number, state: RuntimeState) {
  if (state !== "speaking") return 0;
  return clamp01(Math.max(SPEAKING_MOUTH_FLOOR, value * MOUTH_GAIN));
}

function stabilizeModel(model: Live2DModelInstance) {
  model.autoUpdate = false;
  model.focus(0, 0, true);
  model.internalModel?.motionManager?.stopAllMotions?.();

  const internalModel = model.internalModel as Live2DInternalModel | undefined;
  if (!internalModel) return;

  internalModel.physics = undefined;
  internalModel.breath = undefined;
  internalModel.eyeBlink = undefined;
}

function applyMouthOpen(model: Live2DModelInstance, value: number) {
  const coreModel = model.internalModel?.coreModel as
    | {
        getParameterIndex?: (id: string) => number;
        setParameterValueById?: (id: string, value: number, weight?: number) => void;
      }
    | undefined;

  if (!coreModel?.setParameterValueById) return;

  for (const parameterId of ["ParamMouthOpenY", "ParamMouthOpen", "MouthOpen"]) {
    const index = coreModel.getParameterIndex?.(parameterId) ?? -1;
    if (index >= 0) {
      coreModel.setParameterValueById(parameterId, value, 1);
      return;
    }
  }
}

export function Live2DCanvas({
  entrypoint,
  mouthOpen,
  onError,
  onReady,
  state,
}: Live2DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<Live2DModelInstance | null>(null);
  const mouthOpenRef = useRef(mouthOpen);
  const renderedMouthOpenRef = useRef(0);
  const stateRef = useRef(state);
  const [status, setStatus] = useState("Live2D 加载中");

  useEffect(() => {
    mouthOpenRef.current = state === "speaking" ? mouthOpen : 0;
    stateRef.current = state;
  }, [mouthOpen, state]);

  useEffect(() => {
    let disposed = false;
    let app: import("pixi.js").Application | null = null;
    let resizeObserver: ResizeObserver | null = null;

    async function setup() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      try {
        await ensureCubismCore();
        const [PIXI, live2d] = await Promise.all([
          import("pixi.js"),
          import("pixi-live2d-display/cubism4"),
        ]);

        if (disposed) return;

        window.PIXI = PIXI;
        live2d.Live2DModel.registerTicker(PIXI.Ticker);

        app = new PIXI.Application({
          antialias: true,
          autoDensity: true,
          backgroundAlpha: 0,
          resolution: Math.min(window.devicePixelRatio || 1, MAX_RENDER_DPR),
          view: canvas,
        });
        app.ticker.maxFPS = MAX_RENDER_FPS;

        const model = await live2d.Live2DModel.from(entrypoint, {
          autoInteract: false,
          autoUpdate: false,
          motionPreload: live2d.MotionPreloadStrategy.NONE,
        });

        if (disposed) {
          model.destroy();
          return;
        }

        stabilizeModel(model);
        modelRef.current = model;
        app.stage.addChild(model);
        fitModel({ app, container, model });

        resizeObserver = new ResizeObserver(() => {
          if (app && modelRef.current && containerRef.current) {
            fitModel({
              app,
              container: containerRef.current,
              model: modelRef.current,
            });
          }
        });
        resizeObserver.observe(container);

        app.ticker.add(() => {
          const currentModel = modelRef.current;
          if (!currentModel) return;

          if (stateRef.current === "speaking") {
            currentModel.onTickerUpdate();
          }

          const target = getMouthTarget(mouthOpenRef.current, stateRef.current);
          const current = renderedMouthOpenRef.current;
          const smoothing = target > current ? 0.5 : 0.32;
          const nextValue = current + (target - current) * smoothing;
          renderedMouthOpenRef.current = nextValue < 0.02 ? 0 : nextValue;
          applyMouthOpen(currentModel, renderedMouthOpenRef.current);
        });

        setStatus("Live2D 已加载");
        onReady();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Live2D 渲染初始化失败";
        setStatus(message);
        onError(message);
      }
    }

    void setup();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      modelRef.current?.destroy();
      modelRef.current = null;
      app?.destroy(true, {
        baseTexture: false,
        children: true,
        texture: false,
      });
      app = null;
    };
  }, [entrypoint, onError, onReady]);

  useEffect(() => {
    const model = modelRef.current;
    if (!model) return;

    if (state === "speaking") {
      model.focus(0, 0, true);
      return;
    }
    model.internalModel?.motionManager?.stopAllMotions?.();
    model.focus(0, 0, true);
  }, [state]);

  return (
    <div
      ref={containerRef}
      className="relative h-[340px] w-full overflow-hidden rounded-md bg-gradient-to-b from-slate-50 to-slate-100"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      <span className="absolute bottom-3 left-3 rounded-md bg-white/85 px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
        {status}
      </span>
    </div>
  );
}
