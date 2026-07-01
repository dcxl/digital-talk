ALTER TABLE "Conversation" ADD COLUMN "isStarred" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Conversation" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Conversation" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Conversation_isStarred_idx" ON "Conversation"("isStarred");
CREATE INDEX "Conversation_archivedAt_idx" ON "Conversation"("archivedAt");
