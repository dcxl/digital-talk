import { WorkspacePlaceholderPage } from "@/features/workspace/components/workspace-pages";

export default function PromptsRoute() {
  return (
    <WorkspacePlaceholderPage
      items={["Prompt 列表", "版本管理", "Variables", "Test Panel"]}
      title="提示词管理"
    />
  );
}
