"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import {
  BookOpen,
  Bot,
  FileText,
  GitBranch,
  History,
  Info,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Play,
  Settings,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface WorkspaceShellProps {
  children: React.ReactNode;
}

interface NavigationItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const primaryNavigation: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "运行概览",
    icon: LayoutDashboard,
  },
  {
    href: "/conversation",
    label: "Conversation",
    description: "数字人对话",
    icon: MessageSquare,
  },
  {
    href: "/history",
    label: "History",
    description: "会话历史",
    icon: History,
  },
  {
    href: "/avatar",
    label: "Avatar",
    description: "数字人配置",
    icon: UserRound,
  },
  {
    href: "/knowledge",
    label: "Knowledge",
    description: "知识库",
    icon: BookOpen,
  },
  {
    href: "/prompts",
    label: "Prompt",
    description: "提示词",
    icon: FileText,
  },
  {
    href: "/models",
    label: "Models",
    description: "模型配置",
    icon: SlidersHorizontal,
  },
  {
    href: "/playground",
    label: "Playground",
    description: "调试中心",
    icon: Play,
  },
];

const secondaryNavigation: NavigationItem[] = [
  {
    href: "/settings",
    label: "Settings",
    description: "系统设置",
    icon: Settings,
  },
  {
    href: "/about",
    label: "About",
    description: "项目信息",
    icon: Info,
  },
];

const allNavigation = [...primaryNavigation, ...secondaryNavigation];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveCurrentPage(pathname: string) {
  return (
    allNavigation.find((item) => isActivePath(pathname, item.href)) ??
    primaryNavigation[1]
  );
}

function NavigationLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavigationItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      className={clsx(
        "group flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm transition",
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-300 hover:bg-slate-800 hover:text-white",
      )}
      href={item.href}
      onClick={onNavigate}
    >
      <Icon size={17} />
      <span className="min-w-0">
        <span className="block truncate font-medium">{item.label}</span>
        <span
          className={clsx(
            "block truncate text-xs",
            active ? "text-indigo-100" : "text-slate-500 group-hover:text-slate-400",
          )}
        >
          {item.description}
        </span>
      </span>
    </Link>
  );
}

function Sidebar({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex size-9 items-center justify-center rounded-md bg-indigo-600">
          <Bot size={19} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">NEXT DIGITAL HUMAN</p>
          <p className="text-xs text-slate-500">Workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {primaryNavigation.map((item) => (
          <NavigationLink
            key={item.href}
            item={item}
            onNavigate={onNavigate}
            pathname={pathname}
          />
        ))}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        {secondaryNavigation.map((item) => (
          <NavigationLink
            key={item.href}
            item={item}
            onNavigate={onNavigate}
            pathname={pathname}
          />
        ))}
        <a
          className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          href="https://github.com/dcxl/digital-talk"
          rel="noreferrer"
          target="_blank"
        >
          <GitBranch size={17} />
          <span className="min-w-0">
            <span className="block truncate font-medium">GitHub</span>
            <span className="block truncate text-xs text-slate-500">Repository</span>
          </span>
        </a>
      </div>
    </div>
  );
}

export function AppShell({ children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPage = resolveCurrentPage(pathname);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="hidden fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-900 md:block">
        <Sidebar pathname={pathname} />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="关闭导航"
            className="absolute inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
            type="button"
          />
          <div className="relative h-full w-72 max-w-[85vw]">
            <Sidebar pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                aria-label="打开导航"
                className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 md:hidden"
                onClick={() => setMobileOpen(true)}
                type="button"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-slate-950">
                  {currentPage.label}
                </h1>
                <p className="truncate text-xs text-slate-500">
                  {currentPage.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                className="hidden size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 sm:flex"
                href="/about"
                title="About"
              >
                <Info size={16} />
              </Link>
              <Link
                className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700"
                href="/settings"
                title="Settings"
              >
                <Settings size={16} />
              </Link>
              {mobileOpen ? (
                <button
                  aria-label="关闭导航"
                  className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 md:hidden"
                  onClick={() => setMobileOpen(false)}
                  type="button"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
