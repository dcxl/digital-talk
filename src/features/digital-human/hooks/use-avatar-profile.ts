import { useCallback, useState } from "react";

interface AvatarProfileSummary {
  id: string;
  isDefault: boolean;
  name: string;
  previewImageUrl?: string | null;
}

function selectAvatarProfile(profiles: AvatarProfileSummary[]) {
  return (
    profiles.find((profile) => profile.isDefault) ??
    profiles[0] ??
    null
  );
}

export function useAvatarProfile() {
  const [avatarProfile, setAvatarProfile] =
    useState<AvatarProfileSummary | null>(null);

  const loadAvatarProfile = useCallback(async () => {
    const response = await fetch("/api/avatar-profiles");
    if (!response.ok) return;

    const payload = (await response.json()) as {
      data?: {
        profiles?: AvatarProfileSummary[];
      };
    };
    setAvatarProfile(selectAvatarProfile(payload.data?.profiles ?? []));
  }, []);

  return {
    avatarProfile,
    loadAvatarProfile,
  };
}
