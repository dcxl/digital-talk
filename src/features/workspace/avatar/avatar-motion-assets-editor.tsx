import { Check, Film, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  avatarMotionAssetsExample,
  getAvatarMotionAssetsEditorValue,
  parseAvatarMotionAssetsEditorValue,
} from "./motion-assets-config";

interface AvatarMotionAssetsEditorProps {
  config?: unknown;
  onChange: (config: Record<string, unknown>) => void;
}

export function AvatarMotionAssetsEditor({
  config,
  onChange,
}: AvatarMotionAssetsEditorProps) {
  const editorValue = useMemo(
    () => getAvatarMotionAssetsEditorValue(config),
    [config],
  );
  const editorKey = useMemo(() => {
    try {
      return JSON.stringify(config ?? null);
    } catch {
      return editorValue;
    }
  }, [config, editorValue]);

  return (
    <AvatarMotionAssetsEditorContent
      config={config}
      editorValue={editorValue}
      key={editorKey}
      onChange={onChange}
    />
  );
}

interface AvatarMotionAssetsEditorContentProps
  extends AvatarMotionAssetsEditorProps {
  editorValue: string;
}

function AvatarMotionAssetsEditorContent({
  config,
  editorValue,
  onChange,
}: AvatarMotionAssetsEditorContentProps) {
  const [rawValue, setRawValue] = useState(editorValue);
  const [message, setMessage] = useState("");

  function applyConfig(value = rawValue) {
    const result = parseAvatarMotionAssetsEditorValue(config, value);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    if (result.config) {
      onChange(result.config);
      setMessage(value.trim() ? "表现资产已应用" : "表现资产已清空");
    }
  }

  function fillExample() {
    setRawValue(avatarMotionAssetsExample);
    setMessage("示例已填入，保存前请先应用");
  }

  const hasError =
    message.includes("不正确") ||
    message.includes("必须") ||
    message.includes("未识别");

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-700"
          htmlFor="avatar-motion-assets"
        >
          <Film size={14} />
          表现资产
        </label>
        <div className="flex gap-2">
          <button
            className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-600"
            onClick={fillExample}
            type="button"
          >
            <RotateCcw size={13} />
            示例
          </button>
          <button
            className="inline-flex h-8 items-center gap-1 rounded-md bg-slate-950 px-2 text-xs text-white"
            onClick={() => applyConfig()}
            type="button"
          >
            <Check size={13} />
            应用
          </button>
        </div>
      </div>
      <textarea
        className="min-h-36 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-5 text-slate-900 outline-none focus:border-indigo-500"
        id="avatar-motion-assets"
        onBlur={() => {
          if (rawValue !== editorValue) applyConfig();
        }}
        onChange={(event) => {
          setRawValue(event.target.value);
          setMessage("");
        }}
        placeholder='{"idle":{"kind":"image","url":"/avatar-idle.png"}}'
        spellCheck={false}
        value={rawValue}
      />
      <p className={`mt-2 min-h-4 text-xs ${hasError ? "text-red-600" : "text-slate-500"}`}>
        {message || "支持 image / video，URL 可使用 public 下的路径"}
      </p>
    </div>
  );
}

