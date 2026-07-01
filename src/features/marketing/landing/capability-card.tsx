import type { LucideIcon } from "lucide-react";

interface CapabilityCardProps {
  description: string;
  icon: LucideIcon;
  title: string;
}

export function CapabilityCard({
  description,
  icon: Icon,
  title,
}: CapabilityCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
        <Icon size={18} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}
