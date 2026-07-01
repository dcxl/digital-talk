import { WorkspacePlaceholderPage } from "@/features/workspace/components/workspace-pages";

export default function PlaygroundRoute() {
  return (
    <WorkspacePlaceholderPage
      items={["Chat 调试", "Runtime Events", "Logs", "Metrics"]}
      title="调试中心"
    />
  );
}
