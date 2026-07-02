import Link from "next/link";
import {
  BookOpen,
  Bot,
  GitBranch,
  MessageSquare,
  Play,
  Settings,
} from "lucide-react";
import { CapabilityCard } from "./capability-card";

const capabilities = [
  {
    title: "AI 原生",
    description: "LLM、RAG、语音和数字人运行时统一接入。",
    icon: Bot,
  },
  {
    title: "实时对话",
    description: "流式对话、会话历史和知识库检索闭环。",
    icon: MessageSquare,
  },
  {
    title: "可扩展",
    description: "服务商、提示词、数字人配置可替换扩展。",
    icon: Settings,
  },
  {
    title: "生产就绪",
    description: "Prisma 数据模型、模块化 API 和工作台页面。",
    icon: Play,
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3 text-white" href="/">
            <span className="flex size-9 items-center justify-center rounded-md bg-indigo-600">
              <Bot size={18} />
            </span>
            <span className="text-sm font-semibold tracking-wide">
              NEXT DIGITAL HUMAN
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <a
              className="hidden h-9 items-center gap-2 rounded-md px-3 text-sm text-slate-200 hover:bg-white/10 sm:inline-flex"
              href="https://github.com/dcxl/digital-talk/tree/main/docs"
              rel="noreferrer"
              target="_blank"
            >
              <BookOpen size={15} />
              文档
            </a>
            <a
              className="hidden h-9 items-center gap-2 rounded-md px-3 text-sm text-slate-200 hover:bg-white/10 sm:inline-flex"
              href="https://github.com/dcxl/digital-talk"
              rel="noreferrer"
              target="_blank"
            >
              <GitBranch size={15} />
              GitHub
            </a>
            <Link
              className="inline-flex h-9 items-center gap-2 rounded-md bg-white px-3 text-sm font-medium text-slate-950"
              href="/login"
            >
              <Play size={15} />
              开始使用
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative min-h-[72vh] overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.76)_48%,rgba(16,185,129,0.24))]" />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-full opacity-55 md:w-[58%] md:opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #020617 0%, rgba(2,6,23,0.64) 36%, rgba(2,6,23,0.12) 100%), url('/marketing/digital-human.png')",
            backgroundPosition: "center right",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        />
        <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-7xl items-center px-4 pb-16 pt-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-emerald-300">
              开源 AI 数字人
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-white sm:text-6xl">
              NEXT DIGITAL HUMAN
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              基于 Next.js、Prisma 和 Provider Runtime 的生产级数字人框架，
              覆盖对话、知识库、提示词、模型配置与调试工作台。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-md bg-indigo-500 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-400"
                href="/login"
              >
                <Play size={16} />
                开始使用
              </Link>
              <a
                className="inline-flex h-11 items-center gap-2 rounded-md border border-white/20 px-4 text-sm font-medium text-white hover:bg-white/10"
                href="https://github.com/dcxl/digital-talk"
                rel="noreferrer"
                target="_blank"
              >
                <GitBranch size={16} />
                GitHub 点星
              </a>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/15 pt-6">
              <div>
                <dt className="text-xs text-slate-400">模块</dt>
                <dd className="mt-1 text-lg font-semibold text-white">12</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">运行时</dt>
                <dd className="mt-1 text-lg font-semibold text-white">LLM</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">技术栈</dt>
                <dd className="mt-1 text-lg font-semibold text-white">Next.js</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {capabilities.map((item) => (
          <CapabilityCard
            description={item.description}
            icon={item.icon}
            key={item.title}
            title={item.title}
          />
        ))}
      </section>
    </main>
  );
}
