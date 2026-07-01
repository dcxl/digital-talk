-- CreateEnum
CREATE TYPE "AvatarDriver" AS ENUM ('static', 'live2d', 'vrm');

-- CreateEnum
CREATE TYPE "AvatarProfileStatus" AS ENUM ('active', 'disabled', 'deleted');

-- CreateTable
CREATE TABLE "AvatarProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "driver" "AvatarDriver" NOT NULL DEFAULT 'static',
    "providerConfigId" TEXT,
    "voiceProviderId" TEXT,
    "voice" TEXT,
    "language" TEXT,
    "background" TEXT,
    "previewImageUrl" TEXT,
    "config" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" "AvatarProfileStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvatarProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AvatarProfile_userId_idx" ON "AvatarProfile"("userId");

-- CreateIndex
CREATE INDEX "AvatarProfile_driver_idx" ON "AvatarProfile"("driver");

-- CreateIndex
CREATE INDEX "AvatarProfile_status_idx" ON "AvatarProfile"("status");

-- CreateIndex
CREATE INDEX "AvatarProfile_isDefault_idx" ON "AvatarProfile"("isDefault");

-- AddForeignKey
ALTER TABLE "AvatarProfile" ADD CONSTRAINT "AvatarProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarProfile" ADD CONSTRAINT "AvatarProfile_providerConfigId_fkey" FOREIGN KEY ("providerConfigId") REFERENCES "ProviderConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvatarProfile" ADD CONSTRAINT "AvatarProfile_voiceProviderId_fkey" FOREIGN KEY ("voiceProviderId") REFERENCES "ProviderConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;
