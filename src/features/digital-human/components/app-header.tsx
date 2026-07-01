import { Bot, Settings, Sparkles } from "lucide-react";

interface AppHeaderProps {
  onOpenSettings: () => void;
}

export function AppHeader({ onOpenSettings }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Bot size={20} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-950">
              Next Digital Human
            </h1>
            <p className="text-xs text-slate-500">
              Open source AI avatar runtime
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm sm:flex">
            <Sparkles size={16} />
            OpenAI Compatible
          </button>
          <button
            className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm"
            onClick={onOpenSettings}
            title="设置"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
