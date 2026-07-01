import { WorkspacePlaceholderPage } from "@/features/workspace/components/workspace-pages";

export default function AboutRoute() {
  return (
    <WorkspacePlaceholderPage
      items={["Version", "MIT License", "GitHub Repository"]}
      title="关于项目"
    />
  );
}
