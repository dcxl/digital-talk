import { BookOpen, Link2, Plus, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  CharacterItem,
  CharacterSceneFormState,
  CharacterSceneItem,
} from "../types";
import {
  characterSceneTypeLabels,
  characterSceneTypeOptions,
  createBlankCharacterSceneForm,
} from "./constants";

export function CharacterScenePanel({
  character,
  isBusy,
  onBindScene,
  onCreateScene,
  onSetDefaultScene,
  onUnbindScene,
  scenes,
}: {
  character: CharacterItem | null;
  isBusy: boolean;
  onBindScene: (sceneId: string) => void;
  onCreateScene: (input: CharacterSceneFormState) => void;
  onSetDefaultScene: (sceneId: string) => void;
  onUnbindScene: (sceneId: string) => void;
  scenes: CharacterSceneItem[];
}) {
  const [form, setForm] = useState<CharacterSceneFormState>(
    createBlankCharacterSceneForm(),
  );
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const boundSceneIds = useMemo(
    () => new Set(character?.sceneBindings.map((binding) => binding.sceneId)),
    [character],
  );
  const availableScenes = useMemo(
    () => scenes.filter((scene) => !boundSceneIds.has(scene.id)),
    [boundSceneIds, scenes],
  );
  const resolvedSelectedSceneId = availableScenes.some(
    (scene) => scene.id === selectedSceneId,
  )
    ? selectedSceneId
    : availableScenes[0]?.id || "";
  const canBind = Boolean(character && resolvedSelectedSceneId);

  function updateForm(patch: Partial<CharacterSceneFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function submitScene() {
    if (!form.name.trim()) return;
    onCreateScene(form);
    setForm(createBlankCharacterSceneForm());
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <span className="flex size-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <Link2 size={17} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">场景</h3>
          <p className="mt-1 text-xs text-slate-500">
            {character?.defaultScene?.name ?? "未绑定默认场景"}
          </p>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px]">
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            disabled={isBusy}
            onChange={(event) => updateForm({ name: event.target.value })}
            placeholder="场景名称"
            value={form.name}
          />
          <select
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            disabled={isBusy}
            onChange={(event) =>
              updateForm({
                type: event.target.value as CharacterSceneFormState["type"],
              })
            }
            value={form.type}
          >
            {characterSceneTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            className="min-h-20 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 md:col-span-2"
            disabled={isBusy}
            onChange={(event) =>
              updateForm({ description: event.target.value })
            }
            placeholder="场景说明"
            value={form.description}
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 md:col-span-2"
            disabled={isBusy || !form.name.trim()}
            onClick={submitScene}
            type="button"
          >
            <Plus size={15} />
            创建场景
          </button>
        </div>

        <div className="flex gap-2">
          <select
            className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            disabled={isBusy || !character || availableScenes.length === 0}
            onChange={(event) => setSelectedSceneId(event.target.value)}
            value={resolvedSelectedSceneId}
          >
            {availableScenes.map((scene) => (
              <option key={scene.id} value={scene.id}>
                {scene.name}
              </option>
            ))}
            {availableScenes.length === 0 ? (
              <option value="">暂无可绑定场景</option>
            ) : null}
          </select>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300"
            disabled={isBusy || !canBind}
            onClick={() => onBindScene(resolvedSelectedSceneId)}
            title="绑定场景"
            type="button"
          >
            <Link2 size={15} />
            绑定
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 border-t border-slate-100">
        {character?.sceneBindings.map((binding) => (
          <div
            className="flex items-start justify-between gap-3 p-4"
            key={binding.id}
          >
            <div className="flex min-w-0 gap-3">
              <BookOpen className="mt-0.5 text-slate-400" size={16} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {binding.scene.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {characterSceneTypeLabels[binding.scene.type] ??
                    binding.scene.type}{" "}
                  · {binding.scene.inputMode}/{binding.scene.outputMode}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className={`inline-flex size-8 items-center justify-center rounded-md border ${
                  binding.isDefault
                    ? "border-amber-200 bg-amber-50 text-amber-600"
                    : "border-slate-200 text-slate-400"
                } disabled:cursor-not-allowed`}
                disabled={isBusy || binding.isDefault}
                onClick={() => onSetDefaultScene(binding.sceneId)}
                title="设为默认场景"
                type="button"
              >
                <Star size={15} />
              </button>
              <button
                className="inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 disabled:cursor-not-allowed"
                disabled={isBusy}
                onClick={() => onUnbindScene(binding.sceneId)}
                title="解除绑定"
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {!character?.sceneBindings.length ? (
          <div className="p-4 text-sm text-slate-500">暂无场景绑定</div>
        ) : null}
      </div>
    </section>
  );
}
