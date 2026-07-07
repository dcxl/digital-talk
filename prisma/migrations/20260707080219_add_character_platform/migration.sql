-- CreateEnum
CREATE TYPE "CharacterRoleType" AS ENUM ('knowledge_assistant', 'host', 'chat_companion', 'business_assistant', 'custom');

-- CreateEnum
CREATE TYPE "CharacterStatus" AS ENUM ('draft', 'active', 'disabled', 'deleted');

-- CreateEnum
CREATE TYPE "CharacterSceneType" AS ENUM ('knowledge_assistant', 'host', 'chat_companion', 'business_assistant', 'custom');

-- CreateEnum
CREATE TYPE "CharacterSceneStatus" AS ENUM ('active', 'disabled', 'deleted');

-- CreateEnum
CREATE TYPE "CharacterMemoryType" AS ENUM ('long_term', 'session_summary', 'user_preference', 'relationship_fact', 'character_fact');

-- CreateEnum
CREATE TYPE "CharacterMemoryStatus" AS ENUM ('active', 'disabled', 'deleted');

-- CreateEnum
CREATE TYPE "CharacterWorkflowStatus" AS ENUM ('active', 'disabled', 'deleted');

-- CreateEnum
CREATE TYPE "CharacterWorkflowExecutionStatus" AS ENUM ('pending', 'running', 'waiting_confirmation', 'success', 'failed', 'cancelled');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "characterId" TEXT,
ADD COLUMN     "sceneId" TEXT;

-- CreateTable
CREATE TABLE "CharacterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleType" "CharacterRoleType" NOT NULL DEFAULT 'custom',
    "description" TEXT,
    "tags" JSONB,
    "personaPromptId" TEXT,
    "appearanceProfileId" TEXT,
    "voiceProviderId" TEXT,
    "voice" TEXT,
    "language" TEXT,
    "memoryPolicy" JSONB,
    "workflowPolicy" JSONB,
    "runtimeConfig" JSONB,
    "comfyWorkflowConfig" JSONB,
    "status" "CharacterStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterScene" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CharacterSceneType" NOT NULL DEFAULT 'custom',
    "description" TEXT,
    "promptTemplateId" TEXT,
    "knowledgeBaseId" TEXT,
    "inputMode" TEXT NOT NULL DEFAULT 'text',
    "outputMode" TEXT NOT NULL DEFAULT 'text',
    "workflowPolicy" JSONB,
    "status" "CharacterSceneStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSceneBinding" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterSceneBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "type" "CharacterMemoryType" NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceConversationId" TEXT,
    "confidence" DOUBLE PRECISION,
    "status" "CharacterMemoryStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterWorkflow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" JSONB,
    "steps" JSONB NOT NULL,
    "permission" JSONB,
    "status" "CharacterWorkflowStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterWorkflowExecution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "conversationId" TEXT,
    "status" "CharacterWorkflowExecutionStatus" NOT NULL DEFAULT 'pending',
    "input" JSONB,
    "output" JSONB,
    "errorMessage" TEXT,
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterWorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CharacterProfile_userId_idx" ON "CharacterProfile"("userId");

-- CreateIndex
CREATE INDEX "CharacterProfile_roleType_idx" ON "CharacterProfile"("roleType");

-- CreateIndex
CREATE INDEX "CharacterProfile_status_idx" ON "CharacterProfile"("status");

-- CreateIndex
CREATE INDEX "CharacterProfile_appearanceProfileId_idx" ON "CharacterProfile"("appearanceProfileId");

-- CreateIndex
CREATE INDEX "CharacterProfile_personaPromptId_idx" ON "CharacterProfile"("personaPromptId");

-- CreateIndex
CREATE INDEX "CharacterProfile_voiceProviderId_idx" ON "CharacterProfile"("voiceProviderId");

-- CreateIndex
CREATE INDEX "CharacterScene_userId_idx" ON "CharacterScene"("userId");

-- CreateIndex
CREATE INDEX "CharacterScene_type_idx" ON "CharacterScene"("type");

-- CreateIndex
CREATE INDEX "CharacterScene_status_idx" ON "CharacterScene"("status");

-- CreateIndex
CREATE INDEX "CharacterScene_promptTemplateId_idx" ON "CharacterScene"("promptTemplateId");

-- CreateIndex
CREATE INDEX "CharacterScene_knowledgeBaseId_idx" ON "CharacterScene"("knowledgeBaseId");

-- CreateIndex
CREATE INDEX "CharacterSceneBinding_characterId_idx" ON "CharacterSceneBinding"("characterId");

-- CreateIndex
CREATE INDEX "CharacterSceneBinding_sceneId_idx" ON "CharacterSceneBinding"("sceneId");

-- CreateIndex
CREATE INDEX "CharacterSceneBinding_isDefault_idx" ON "CharacterSceneBinding"("isDefault");

-- CreateIndex
CREATE INDEX "CharacterSceneBinding_enabled_idx" ON "CharacterSceneBinding"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterSceneBinding_characterId_sceneId_key" ON "CharacterSceneBinding"("characterId", "sceneId");

-- CreateIndex
CREATE INDEX "CharacterMemory_userId_idx" ON "CharacterMemory"("userId");

-- CreateIndex
CREATE INDEX "CharacterMemory_characterId_idx" ON "CharacterMemory"("characterId");

-- CreateIndex
CREATE INDEX "CharacterMemory_type_idx" ON "CharacterMemory"("type");

-- CreateIndex
CREATE INDEX "CharacterMemory_status_idx" ON "CharacterMemory"("status");

-- CreateIndex
CREATE INDEX "CharacterMemory_sourceConversationId_idx" ON "CharacterMemory"("sourceConversationId");

-- CreateIndex
CREATE INDEX "CharacterMemory_expiresAt_idx" ON "CharacterMemory"("expiresAt");

-- CreateIndex
CREATE INDEX "CharacterWorkflow_userId_idx" ON "CharacterWorkflow"("userId");

-- CreateIndex
CREATE INDEX "CharacterWorkflow_characterId_idx" ON "CharacterWorkflow"("characterId");

-- CreateIndex
CREATE INDEX "CharacterWorkflow_status_idx" ON "CharacterWorkflow"("status");

-- CreateIndex
CREATE INDEX "CharacterWorkflowExecution_userId_idx" ON "CharacterWorkflowExecution"("userId");

-- CreateIndex
CREATE INDEX "CharacterWorkflowExecution_workflowId_idx" ON "CharacterWorkflowExecution"("workflowId");

-- CreateIndex
CREATE INDEX "CharacterWorkflowExecution_characterId_idx" ON "CharacterWorkflowExecution"("characterId");

-- CreateIndex
CREATE INDEX "CharacterWorkflowExecution_conversationId_idx" ON "CharacterWorkflowExecution"("conversationId");

-- CreateIndex
CREATE INDEX "CharacterWorkflowExecution_status_idx" ON "CharacterWorkflowExecution"("status");

-- CreateIndex
CREATE INDEX "Conversation_characterId_idx" ON "Conversation"("characterId");

-- CreateIndex
CREATE INDEX "Conversation_sceneId_idx" ON "Conversation"("sceneId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "CharacterProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "CharacterScene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterProfile" ADD CONSTRAINT "CharacterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterProfile" ADD CONSTRAINT "CharacterProfile_personaPromptId_fkey" FOREIGN KEY ("personaPromptId") REFERENCES "PromptTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterProfile" ADD CONSTRAINT "CharacterProfile_appearanceProfileId_fkey" FOREIGN KEY ("appearanceProfileId") REFERENCES "AvatarProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterProfile" ADD CONSTRAINT "CharacterProfile_voiceProviderId_fkey" FOREIGN KEY ("voiceProviderId") REFERENCES "ProviderConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterScene" ADD CONSTRAINT "CharacterScene_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterScene" ADD CONSTRAINT "CharacterScene_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterScene" ADD CONSTRAINT "CharacterScene_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "KnowledgeBase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSceneBinding" ADD CONSTRAINT "CharacterSceneBinding_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "CharacterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSceneBinding" ADD CONSTRAINT "CharacterSceneBinding_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "CharacterScene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterMemory" ADD CONSTRAINT "CharacterMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterMemory" ADD CONSTRAINT "CharacterMemory_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "CharacterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterMemory" ADD CONSTRAINT "CharacterMemory_sourceConversationId_fkey" FOREIGN KEY ("sourceConversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterWorkflow" ADD CONSTRAINT "CharacterWorkflow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterWorkflow" ADD CONSTRAINT "CharacterWorkflow_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "CharacterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterWorkflowExecution" ADD CONSTRAINT "CharacterWorkflowExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterWorkflowExecution" ADD CONSTRAINT "CharacterWorkflowExecution_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "CharacterWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterWorkflowExecution" ADD CONSTRAINT "CharacterWorkflowExecution_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "CharacterProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterWorkflowExecution" ADD CONSTRAINT "CharacterWorkflowExecution_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
