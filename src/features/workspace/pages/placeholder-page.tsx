import { Database } from "lucide-react";
import { PageFrame, Panel } from "../components/page-frame";

export function WorkspacePlaceholderPage({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  return (
    <PageFrame eyebrow="规划中" title={title}>
      <Panel className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              className="flex min-h-20 items-start gap-3 rounded-md bg-slate-50 p-3"
              key={item}
            >
              <Database className="mt-0.5 text-indigo-600" size={17} />
              <p className="text-sm text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </Panel>
    </PageFrame>
  );
}
