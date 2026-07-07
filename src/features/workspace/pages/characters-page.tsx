"use client";

import { PageFrame, RefreshButton } from "../components/page-frame";
import { CharacterAppearancePanel } from "../characters/character-appearance-panel";
import { CharacterList } from "../characters/character-list";
import { CharacterMemoryPanel } from "../characters/character-memory-panel";
import { CharacterPreviewPanel } from "../characters/character-preview-panel";
import { CharacterProfileForm } from "../characters/character-profile-form";
import { CharacterScenePanel } from "../characters/character-scene-panel";
import { CharacterVoicePanel } from "../characters/character-voice-panel";
import { CharacterWorkflowPanel } from "../characters/character-workflow-panel";
import { useCharacterManagement } from "../characters/use-character-management";

export function CharactersPage() {
  const {
    appearanceProfiles,
    bindScene,
    characters,
    createScene,
    deleteCharacter,
    createMemory,
    deleteMemory,
    form,
    isBusy,
    loadCharacterWorkspace,
    memories,
    saveCharacter,
    scenes,
    selectCharacter,
    selectedCharacter,
    selectedCharacterId,
    startCreateCharacter,
    statusText,
    unbindScene,
    updateMemoryStatus,
    updateForm,
    voiceProviders,
  } = useCharacterManagement();

  return (
    <PageFrame
      actions={
        <RefreshButton
          isLoading={isBusy}
          onClick={() => void loadCharacterWorkspace(selectedCharacterId)}
        />
      }
      eyebrow="角色库"
      title="AI 角色管理"
    >
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <CharacterList
          characters={characters}
          isBusy={isBusy}
          onCreate={startCreateCharacter}
          onSelect={selectCharacter}
          selectedCharacterId={selectedCharacterId}
        />
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <CharacterPreviewPanel character={selectedCharacter} />
          <CharacterProfileForm
            form={form}
            isBusy={isBusy}
            onChange={updateForm}
            onDelete={() => void deleteCharacter()}
            onSave={() => void saveCharacter()}
            statusText={statusText}
          />
          <div className="2xl:col-span-2">
            <CharacterAppearancePanel
              appearanceProfiles={appearanceProfiles}
              form={form}
              onChange={updateForm}
            />
          </div>
          <div className="2xl:col-span-2">
            <CharacterVoicePanel
              form={form}
              onChange={updateForm}
              voiceProviders={voiceProviders}
            />
          </div>
          <CharacterScenePanel
            character={selectedCharacter}
            isBusy={isBusy}
            onBindScene={(sceneId) => void bindScene(sceneId)}
            onCreateScene={(input) => void createScene(input)}
            onSetDefaultScene={(sceneId) => void bindScene(sceneId, true)}
            onUnbindScene={(sceneId) => void unbindScene(sceneId)}
            scenes={scenes}
          />
          <CharacterMemoryPanel
            character={selectedCharacter}
            isBusy={isBusy}
            memories={memories}
            onCreateMemory={(input) => void createMemory(input)}
            onDeleteMemory={(memoryId) => void deleteMemory(memoryId)}
            onUpdateMemoryStatus={(memoryId, status) =>
              void updateMemoryStatus(memoryId, status)
            }
          />
          <div className="2xl:col-span-2">
            <CharacterWorkflowPanel character={selectedCharacter} />
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
