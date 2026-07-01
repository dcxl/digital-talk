import { WorkspacePlaceholderPage } from "@/features/workspace/pages/placeholder-page";

export default function SettingsRoute() {
  return (
    <WorkspacePlaceholderPage
      items={["General Settings", "Data Export", "Danger Zone"]}
      title="系统设置"
    />
  );
}
