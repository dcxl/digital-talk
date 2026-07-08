import { Check, Code2, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  avatarMotionMapExample,
  getAvatarMotionMapEditorValue,
  parseAvatarMotionMapEditorValue,
} from "./motion-config";

interface AvatarMotionConfigEditorProps {
  config?: unknown;
  onChange: (config: Record<string, unknown>) => void;
}

export function AvatarMotionConfigEditor({
  config,
  onChange,
}: AvatarMotionConfigEditorProps) {
  const editorValue = useMemo(
    () => getAvatarMotionMapEditorValue(config),
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
    <AvatarMotionConfigEditorContent
      config={config}
      editorValue={editorValue}
      key={editorKey}
      onChange={onChange}
    />
  );
}

interface AvatarMotionConfigEditorContentProps
  extends AvatarMotionConfigEditorProps {
  editorValue: string;
}

function AvatarMotionConfigEditorContent({
  config,
  editorValue,
  onChange,
}: AvatarMotionConfigEditorContentProps) {
  const [rawValue, setRawValue] = useState(editorValue);
  const [message, setMessage] = useState("");

  function applyConfig(value = rawValue) {
    const result = parseAvatarMotionMapEditorValue(config, value);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    if (result.config) {
      onChange(result.config);
      setMessage(value.trim() ? "动作映射已应用" : "动作映射已清空");
    }
  }

  function fillExample() {
    setRawValue(avatarMotionMapExample);
    setMessage("示例已填入，保存前请先应用");
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-700"
          htmlFor="avatar-motion-map"
        >
          <Code2 size={14} />
          动作映射
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
        id="avatar-motion-map"
        onBlur={() => {
          if (rawValue !== editorValue) applyConfig();
        }}
        onChange={(event) => {
          setRawValue(event.target.value);
          setMessage("");
        }}
        placeholder='{"speaking":{"expression":"happy","motion":"talk-soft"}}'
        spellCheck={false}
        value={rawValue}
      />
      <p
        className={`mt-2 min-h-4 text-xs ${
          message.includes("不正确") ||
          message.includes("必须") ||
          message.includes("未识别")
            ? "text-red-600"
            : "text-slate-500"
        }`}
      >
        {message || "支持 idle / listening / thinking / speaking / error 等状态"}
      </p>
    </div>
  );
}
