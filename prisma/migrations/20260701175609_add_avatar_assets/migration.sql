-- CreateEnum
CREATE TYPE "AvatarAssetType" AS ENUM ('image', 'live2d', 'vrm');

-- CreateEnum
CREATE TYPE "AvatarAssetStatus" AS ENUM ('active', 'processing', 'failed', 'deleted');

-- CreateEnum
CREATE TYPE "AvatarAssetSource" AS ENUM ('upload', 'generated', 'remote');

-- CreateEnum
CREATE TYPE "AvatarGenerationJobStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateTable
CREATE TABLE "AvatarAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "type" "AvatarAssetType" NOT NULL DEFAULT 'image',
    "name" TEXT NOT NULL,
    "status" "AvatarAssetStatus" NOT NULL DEFAULT 'active',
    "source" "AvatarAssetSource" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvatarGenerationJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "providerConfigId" TEXT,
    "status" "AvatarGenerationJobStatus" NOT NULL DEFAULT 'pending',
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "style" TEXT,
    "resultAssetId" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarGenerationJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvatarAsset_userId_idx" ON "AvatarAsset"("userId");

-- CreateIndex
CREATE INDEX "AvatarAsset_profileId_idx" ON "AvatarAsset"("profileId");

-- CreateIndex
CREATE INDEX "AvatarAsset_type_idx" ON "AvatarAsset"("type");

-- CreateIndex
CREATE INDEX "AvatarAsset_status_idx" ON "AvatarAsset"("status");

-- CreateIndex
CREATE INDEX "AvatarAsset_source_idx" ON "AvatarAsset"("source");

-- CreateIndex
CREATE INDEX "AvatarGenerationJob_userId_idx" ON "AvatarGenerationJob"("userId");

-- CreateIndex
CREATE INDEX "AvatarGenerationJob_profileId_idx" ON "AvatarGenerationJob"("profileId");

-- CreateIndex
CREATE INDEX "AvatarGenerationJob_providerConfigId_idx" ON "AvatarGenerationJob"("providerConfigId");

-- CreateIndex
CREATE INDEX "AvatarGenerationJob_resultAssetId_idx" ON "AvatarGenerationJob"("resultAssetId");

-- CreateIndex
CREATE INDEX "AvatarGenerationJob_status_idx" ON "AvatarGenerationJob"("status");

-- AddForeignKey
ALTER TABLE "AvatarAsset" ADD CONSTRAINT "AvatarAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarAsset" ADD CONSTRAINT "AvatarAsset_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AvatarProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarGenerationJob" ADD CONSTRAINT "AvatarGenerationJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarGenerationJob" ADD CONSTRAINT "AvatarGenerationJob_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "AvatarProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarGenerationJob" ADD CONSTRAINT "AvatarGenerationJob_providerConfigId_fkey" FOREIGN KEY ("providerConfigId") REFERENCES "ProviderConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarGenerationJob" ADD CONSTRAINT "AvatarGenerationJob_resultAssetId_fkey" FOREIGN KEY ("resultAssetId") REFERENCES "AvatarAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
