import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteCharacterRequest,
  readAvatarProfiles,
  readCharacters,
  readProviders,
  saveCharacterRequest,
} from "../lib/api";
import type {
  AsyncStatus,
  AvatarProfileItem,
  CharacterFormState,
  CharacterItem,
  ProviderItem,
} from "../types";
import { createBlankCharacterForm } from "./constants";

function getTagsText(tags: CharacterItem["tags"]) {
  if (!Array.isArray(tags)) return "";
  return tags.filter((tag): tag is string => typeof tag === "string").join("，");
}

function toCharacterForm(character: CharacterItem): CharacterFormState {
  return {
    appearanceProfileId: character.appearance?.profileId ?? "",
    description: character.description ?? "",
    id: character.id,
    language: character.voice.language ?? "zh",
    name: character.name,
    roleType: character.roleType,
    status: character.status === "deleted" ? "draft" : character.status,
    tagsText: getTagsText(character.tags),
    voice: character.voice.voice ?? "",
    voiceProviderId: character.voice.voiceProviderId ?? "",
  };
}

function selectCharacter(characters: CharacterItem[], preferredId?: string) {
  return (
    characters.find((character) => character.id === preferredId) ??
    characters.find((character) => character.status === "active") ??
    characters[0] ??
    null
  );
}

export function useCharacterManagement() {
  const [appearanceProfiles, setAppearanceProfiles] = useState<
    AvatarProfileItem[]
  >([]);
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [form, setForm] = useState<CharacterFormState>(
    createBlankCharacterForm(),
  );
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [statusText, setStatusText] = useState("");

  const selectedCharacter = useMemo(
    () =>
      characters.find((character) => character.id === selectedCharacterId) ??
      null,
    [characters, selectedCharacterId],
  );

  const voiceProviders = useMemo(
    () => providers.filter((provider) => provider.type === "tts"),
    [providers],
  );

  const isBusy = status === "loading";

  const loadCharacterWorkspace = useCallback(async (preferredId = "") => {
    setStatus("loading");

    try {
      const [nextCharacters, nextAppearances, nextProviders] =
        await Promise.all([
          readCharacters(),
          readAvatarProfiles(),
          readProviders(),
        ]);
      const selected = selectCharacter(nextCharacters, preferredId);

      setCharacters(nextCharacters);
      setAppearanceProfiles(nextAppearances);
      setProviders(nextProviders);
      setSelectedCharacterId(selected?.id ?? "");
      setForm(selected ? toCharacterForm(selected) : createBlankCharacterForm());
      setStatus("success");
      setStatusText("角色库已加载");
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "角色库加载失败");
    }
  }, []);

  function updateForm(patch: Partial<CharacterFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  function selectCharacterProfile(character: CharacterItem) {
    setSelectedCharacterId(character.id);
    setForm(toCharacterForm(character));
    setStatusText("角色已选择");
  }

  function startCreateCharacter() {
    setSelectedCharacterId("");
    setForm(createBlankCharacterForm());
    setStatusText("创建新的 AI 角色");
  }

  async function saveCharacter() {
    setStatus("loading");

    try {
      const character = await saveCharacterRequest(form);
      setStatus("success");
      setStatusText("角色已保存");
      await loadCharacterWorkspace(character.id);
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "角色保存失败");
    }
  }

  async function deleteCharacter() {
    if (!form.id) return;
    setStatus("loading");

    try {
      await deleteCharacterRequest(form.id);
      setStatus("success");
      setStatusText("角色已删除");
      await loadCharacterWorkspace("");
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "角色删除失败");
    }
  }

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (!cancelled) await loadCharacterWorkspace("");
    });

    return () => {
      cancelled = true;
    };
  }, [loadCharacterWorkspace]);

  return {
    appearanceProfiles,
    characters,
    deleteCharacter,
    form,
    isBusy,
    loadCharacterWorkspace,
    saveCharacter,
    selectCharacter: selectCharacterProfile,
    selectedCharacter,
    selectedCharacterId,
    startCreateCharacter,
    statusText,
    updateForm,
    voiceProviders,
  };
}
