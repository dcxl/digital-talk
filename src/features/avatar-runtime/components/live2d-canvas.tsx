"use client";

import { useEffect, useRef, useState } from "react";
import type { RuntimeState } from "@/core/runtime/events";
import {
  resolveAvatarMotionDirective,
  type AvatarRuntimeMotionMap,
} from "@/core/avatar-runtime/motion-map";
import { ensureCubismCore } from "../lib/cubism-core";

interface Live2DCanvasProps {
  entrypoint: string;
  motionMap?: AvatarRuntimeMotionMap;
  mouthOpen: number;
  onError: (message: string) => void;
  onReady: () => void;
  state: RuntimeState;
}

type PixiModule = typeof import("pixi.js");
type Live2DModule = typeof import("pixi-live2d-display/cubism4");
type Live2DModelInstance = InstanceType<Live2DModule["Live2DModel"]>;

interface Live2DInternalSize {
  height?: number;
  originalHeight?: number;
  originalWidth?: number;
  width?: number;
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

async function applyFirstExpression(
  model: Live2DModelInstance,
  candidates: string[],
) {
  if (candidates.length === 0) {
    await model.expression().catch(() => undefined);
    return;
  }

  for (const candidate of candidates) {
    try {
      await model.expression(candidate);
      return;
    } catch {
      // try next configured fallback
    }
  }
}

async function applyFirstMotion(
  model: Live2DModelInstance,
  candidates: string[],
) {
  for (const candidate of candidates) {
    try {
      await model.motion(candidate);
      return;
    } catch {
      // try next configured fallback
    }
  }
}

function getDirectiveKey(input: {
  expressionCandidates: string[];
  motionCandidates: string[];
  state: RuntimeState;
}) {
  return [
    input.state,
    input.motionCandidates.join("|"),
    input.expressionCandidates.join("|"),
  ].join(":");
}

export function Live2DCanvas({
  entrypoint,
  motionMap,
  mouthOpen,
  onError,
  onReady,
  state,
}: Live2DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<Live2DModelInstance | null>(null);
  const mouthOpenRef = useRef(mouthOpen);
  const stateRef = useRef(state);
  const appliedDirectiveKeyRef = useRef("");
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
          resolution: window.devicePixelRatio || 1,
          view: canvas,
        });

        const model = await live2d.Live2DModel.from(entrypoint, {
          autoInteract: false,
        });

        if (disposed) {
          model.destroy();
          return;
        }

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
          if (!modelRef.current) return;
          applyMouthOpen(modelRef.current, mouthOpenRef.current);
          if (stateRef.current === "thinking") {
            modelRef.current.focus(0.08, -0.08);
          } else if (stateRef.current === "speaking") {
            modelRef.current.focus(0, 0.04);
          } else {
            modelRef.current.focus(0, 0);
          }
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

    const directive = resolveAvatarMotionDirective({
      motionMap,
      state,
    });
    const directiveKey = getDirectiveKey(directive);
    if (appliedDirectiveKeyRef.current === directiveKey) return;

    appliedDirectiveKeyRef.current = directiveKey;
    void applyFirstExpression(model, directive.expressionCandidates);
    void applyFirstMotion(model, directive.motionCandidates);
  }, [motionMap, state]);

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
