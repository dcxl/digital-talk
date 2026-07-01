-- CreateEnum
CREATE TYPE "PromptType" AS ENUM ('system', 'chat', 'summary', 'translate', 'custom');

-- CreateEnum
CREATE TYPE "PromptStatus" AS ENUM ('active', 'disabled', 'deleted');

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PromptType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currentVersionId" TEXT,
    "variables" JSONB,
    "status" "PromptStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptVersion" (
    "id" TEXT NOT NULL,
    "promptTemplateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "changelog" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_currentVersionId_key" ON "PromptTemplate"("currentVersionId");

-- CreateIndex
CREATE INDEX "PromptTemplate_userId_idx" ON "PromptTemplate"("userId");

-- CreateIndex
CREATE INDEX "PromptTemplate_type_idx" ON "PromptTemplate"("type");

-- CreateIndex
CREATE INDEX "PromptTemplate_status_idx" ON "PromptTemplate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_userId_type_name_key" ON "PromptTemplate"("userId", "type", "name");

-- CreateIndex
CREATE INDEX "PromptVersion_promptTemplateId_idx" ON "PromptVersion"("promptTemplateId");

-- CreateIndex
CREATE INDEX "PromptVersion_createdByUserId_idx" ON "PromptVersion"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptVersion_promptTemplateId_version_key" ON "PromptVersion"("promptTemplateId", "version");

-- AddForeignKey
ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTemplate" ADD CONSTRAINT "PromptTemplate_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "PromptVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptVersion" ADD CONSTRAINT "PromptVersion_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptVersion" ADD CONSTRAINT "PromptVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
