"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, GitBranch, Globe } from "lucide-react";

export function LoginPage() {
  const router = useRouter();

  function continueToWorkspace() {
    router.push("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 hidden w-1/2 opacity-45 lg:block"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #020617 0%, rgba(2,6,23,0.32) 48%, rgba(2,6,23,0.08) 100%), url('/marketing/digital-human.png')",
          backgroundPosition: "center right",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/95 p-6 text-slate-950 shadow-2xl">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex size-10 items-center justify-center rounded-md bg-indigo-600 text-white">
              <Bot size={19} />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                NEXT DIGITAL HUMAN
              </span>
              <span className="block text-xs text-slate-500">工作台登录</span>
            </span>
          </Link>

          <div className="mt-8">
            <h1 className="text-2xl font-semibold">欢迎回来</h1>
            <p className="mt-2 text-sm text-slate-500">
              MVP 使用默认用户进入工作台。
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50"
              onClick={continueToWorkspace}
              type="button"
            >
              <GitBranch size={16} />
              使用 GitHub 继续
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50"
              onClick={continueToWorkspace}
              type="button"
            >
              <Globe size={16} />
              使用 Google 继续
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">或</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              continueToWorkspace();
            }}
          >
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              邮箱
              <input
                className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                placeholder="you@example.com"
                type="email"
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              密码
              <input
                className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500"
                placeholder="请输入密码"
                type="password"
              />
            </label>
            <button
              className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-500"
              type="submit"
            >
              登录
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
