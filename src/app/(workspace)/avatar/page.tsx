import { WorkspacePlaceholderPage } from "@/features/workspace/pages/placeholder-page";

export default function AvatarRoute() {
  return (
    <WorkspacePlaceholderPage
      items={["Avatar 列表", "预览区", "Driver / Voice / Language / Background"]}
      title="数字人配置"
    />
  );
}
