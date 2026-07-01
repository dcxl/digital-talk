import { GitBranch, Globe, Scale } from "lucide-react";

const aboutItems = [
  {
    label: "Version",
    value: "v0.1.0",
  },
  {
    label: "License",
    value: "MIT",
  },
  {
    label: "Repository",
    value: "github.com/dcxl/digital-talk",
  },
  {
    label: "Framework",
    value: "Next.js 16",
  },
];

export function AboutDetails() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-md bg-indigo-600 text-white">
          <Globe size={28} />
        </div>
        <h3 className="mt-5 text-xl font-semibold text-slate-950">
          NEXT DIGITAL HUMAN
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Open source AI digital human framework built with Next.js, Prisma and
          provider-driven runtime modules.
        </p>

        <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
          {aboutItems.map((item) => (
            <div className="rounded-md bg-slate-50 p-4 text-left" key={item.label}>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="mt-1 break-all text-sm font-medium text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <a
            className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm text-white"
            href="https://github.com/dcxl/digital-talk"
            rel="noreferrer"
            target="_blank"
          >
            <GitBranch size={15} />
            GitHub
          </a>
          <span className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm text-slate-700">
            <Scale size={15} />
            MIT License
          </span>
        </div>
      </div>
    </section>
  );
}
