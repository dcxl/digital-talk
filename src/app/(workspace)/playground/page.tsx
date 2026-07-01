import { WorkspacePlaceholderPage } from "@/features/workspace/pages/placeholder-page";

export default function PlaygroundRoute() {
  return (
    <WorkspacePlaceholderPage
      items={["Chat 调试", "Runtime Events", "Logs", "Metrics"]}
      title="调试中心"
    />
  );
}
