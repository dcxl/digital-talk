import { useCallback, useEffect, useMemo, useState } from "react";
import {
  bindCharacterSceneRequest,
  createSceneRequest,
  deleteCharacterRequest,
  readAvatarProfiles,
  readCharacters,
  readProviders,
  readScenes,
  saveCharacterRequest,
  unbindCharacterSceneRequest,
} from "../lib/api";
import type {
  AsyncStatus,
  AvatarProfileItem,
  CharacterFormState,
  CharacterItem,
  CharacterSceneFormState,
  CharacterSceneItem,
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
  const [scenes, setScenes] = useState<CharacterSceneItem[]>([]);
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
      const [nextCharacters, nextAppearances, nextProviders, nextScenes] =
        await Promise.all([
          readCharacters(),
          readAvatarProfiles(),
          readProviders(),
          readScenes(),
        ]);
      const selected = selectCharacter(nextCharacters, preferredId);

      setCharacters(nextCharacters);
      setAppearanceProfiles(nextAppearances);
      setProviders(nextProviders);
      setScenes(nextScenes);
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

  async function createScene(input: CharacterSceneFormState) {
    setStatus("loading");

    try {
      const scene = await createSceneRequest(input);
      setStatus("success");
      setStatusText("场景已创建");
      await loadCharacterWorkspace(selectedCharacterId || form.id || "");
      return scene;
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "场景创建失败");
      return null;
    }
  }

  async function bindScene(sceneId: string, isDefault = false) {
    const characterId = selectedCharacterId || form.id;
    if (!characterId) return;

    setStatus("loading");

    try {
      await bindCharacterSceneRequest({
        characterId,
        isDefault,
        sceneId,
      });
      setStatus("success");
      setStatusText(isDefault ? "默认场景已更新" : "场景已绑定");
      await loadCharacterWorkspace(characterId);
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "场景绑定失败");
    }
  }

  async function unbindScene(sceneId: string) {
    const characterId = selectedCharacterId || form.id;
    if (!characterId) return;

    setStatus("loading");

    try {
      await unbindCharacterSceneRequest({
        characterId,
        sceneId,
      });
      setStatus("success");
      setStatusText("场景绑定已解除");
      await loadCharacterWorkspace(characterId);
    } catch (error) {
      setStatus("error");
      setStatusText(error instanceof Error ? error.message : "解除绑定失败");
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
    bindScene,
    characters,
    createScene,
    deleteCharacter,
    form,
    isBusy,
    loadCharacterWorkspace,
    saveCharacter,
    scenes,
    selectCharacter: selectCharacterProfile,
    selectedCharacter,
    selectedCharacterId,
    startCreateCharacter,
    statusText,
    unbindScene,
    updateForm,
    voiceProviders,
  };
}
