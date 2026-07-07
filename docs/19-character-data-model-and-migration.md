# Character 数据模型与迁移设计

## 1. 目标

v0.5 要把 `Character` 升级为一等产品对象，但不能破坏已经可用的 Avatar、TTS、ASR、Conversation 链路。

本阶段采用增量迁移：

```text
CharacterProfile
-> appearanceProfileId
-> AvatarProfile
-> AvatarAsset
```

也就是说：

- `CharacterProfile` 是产品对象。
- `AvatarProfile` 暂时作为外观运行时配置表。
- `AvatarAsset` 暂时作为角色外观资产表。
- 新功能面向 Character 开发，旧 Avatar API 保留兼容。

## 2. 当前数据库状态

当前 Prisma 已有核心表：

- `User`
- `Conversation`
- `Message`
- `KnowledgeBase`
- `Document`
- `DocumentChunk`
- `ProviderConfig`
- `AvatarProfile`
- `AvatarAsset`
- `AvatarGenerationJob`
- `PromptTemplate`
- `PromptVersion`
- `AppSetting`

缺口：

- Conversation 没有 `characterId` / `sceneId`。
- 没有 Character 主表。
- 没有 Scene 绑定。
- 没有 Character Memory。
- 没有 Character Workflow。
- ComfyUI 生成结果还没有明确挂到 Character。

## 3. 迁移原则

1. 只做 additive migration，先不删旧字段和旧表。
2. 新表必须带 `userId`，保持单用户 MVP 兼容，也保留后续多用户扩展。
3. `Conversation.characterId` 和 `sceneId` 必须可空，避免历史会话迁移失败。
4. `CharacterProfile.appearanceProfileId` 可空，支持只有设定、还没有外观的角色草稿。
5. 旧 `/avatar` 继续读写 `AvatarProfile`。
6. 新 `/characters` 优先读写 `CharacterProfile`，必要时同步外观配置到 `AvatarProfile`。

## 4. 枚举设计

```prisma
enum CharacterRoleType {
  knowledge_assistant
  host
  chat_companion
  business_assistant
  custom
}

enum CharacterStatus {
  draft
  active
  disabled
  deleted
}

enum CharacterSceneType {
  knowledge_assistant
  host
  chat_companion
  business_assistant
  custom
}

enum CharacterSceneStatus {
  active
  disabled
  deleted
}

enum CharacterMemoryType {
  long_term
  session_summary
  user_preference
  relationship_fact
  character_fact
}

enum CharacterMemoryStatus {
  active
  disabled
  deleted
}

enum CharacterWorkflowStatus {
  active
  disabled
  deleted
}

enum CharacterWorkflowExecutionStatus {
  pending
  running
  waiting_confirmation
  success
  failed
  cancelled
}
```

## 5. Prisma 草案

### 5.1 User 关系补充

```prisma
model User {
  characterProfiles           CharacterProfile[]
  characterScenes             CharacterScene[]
  characterMemories           CharacterMemory[]
  characterWorkflows          CharacterWorkflow[]
  characterWorkflowExecutions CharacterWorkflowExecution[]
}
```

### 5.2 Conversation 补充

```prisma
model Conversation {
  characterId String?
  character   CharacterProfile? @relation(fields: [characterId], references: [id], onDelete: SetNull)
  sceneId     String?
  scene       CharacterScene?   @relation(fields: [sceneId], references: [id], onDelete: SetNull)

  @@index([characterId])
  @@index([sceneId])
}
```

### 5.3 CharacterProfile

```prisma
model CharacterProfile {
  id                  String            @id @default(cuid())
  userId              String
  user                User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  name                String
  roleType            CharacterRoleType @default(custom)
  description         String?
  tags                Json?
  personaPromptId     String?
  personaPrompt       PromptTemplate?   @relation(fields: [personaPromptId], references: [id], onDelete: SetNull)
  appearanceProfileId String?
  appearanceProfile   AvatarProfile?    @relation(fields: [appearanceProfileId], references: [id], onDelete: SetNull)
  voiceProviderId     String?
  voiceProvider       ProviderConfig?   @relation(fields: [voiceProviderId], references: [id], onDelete: SetNull)
  voice               String?
  language            String?
  memoryPolicy        Json?
  workflowPolicy      Json?
  runtimeConfig       Json?
  comfyWorkflowConfig Json?
  status              CharacterStatus   @default(draft)
  sceneBindings       CharacterSceneBinding[]
  memories            CharacterMemory[]
  workflows           CharacterWorkflow[]
  workflowExecutions  CharacterWorkflowExecution[]
  conversations       Conversation[]
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  @@index([userId])
  @@index([roleType])
  @@index([status])
  @@index([appearanceProfileId])
}
```

### 5.4 CharacterScene

```prisma
model CharacterScene {
  id              String               @id @default(cuid())
  userId          String
  user            User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String
  type            CharacterSceneType   @default(custom)
  description     String?
  promptTemplateId String?
  promptTemplate   PromptTemplate?     @relation(fields: [promptTemplateId], references: [id], onDelete: SetNull)
  knowledgeBaseId String?
  knowledgeBase   KnowledgeBase?       @relation(fields: [knowledgeBaseId], references: [id], onDelete: SetNull)
  inputMode       String               @default("text")
  outputMode      String               @default("text")
  workflowPolicy  Json?
  status          CharacterSceneStatus @default(active)
  bindings        CharacterSceneBinding[]
  conversations   Conversation[]
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt

  @@index([userId])
  @@index([type])
  @@index([status])
  @@index([knowledgeBaseId])
}
```

### 5.5 CharacterSceneBinding

```prisma
model CharacterSceneBinding {
  id          String           @id @default(cuid())
  characterId String
  character   CharacterProfile @relation(fields: [characterId], references: [id], onDelete: Cascade)
  sceneId     String
  scene       CharacterScene   @relation(fields: [sceneId], references: [id], onDelete: Cascade)
  isDefault   Boolean          @default(false)
  enabled     Boolean          @default(true)
  config      Json?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([characterId, sceneId])
  @@index([characterId])
  @@index([sceneId])
  @@index([isDefault])
}
```

默认场景约束先由业务层保证：同一角色最多一个 `isDefault = true`。

### 5.6 CharacterMemory

```prisma
model CharacterMemory {
  id                   String                @id @default(cuid())
  userId               String
  user                 User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  characterId          String
  character            CharacterProfile      @relation(fields: [characterId], references: [id], onDelete: Cascade)
  type                 CharacterMemoryType
  content              String
  source               String
  sourceConversationId String?
  sourceConversation   Conversation?         @relation(fields: [sourceConversationId], references: [id], onDelete: SetNull)
  confidence           Float?
  status               CharacterMemoryStatus @default(active)
  metadata             Json?
  expiresAt            DateTime?
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt

  @@index([userId])
  @@index([characterId])
  @@index([type])
  @@index([status])
  @@index([expiresAt])
}
```

### 5.7 CharacterWorkflow

```prisma
model CharacterWorkflow {
  id          String                  @id @default(cuid())
  userId      String
  user        User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  characterId String
  character   CharacterProfile        @relation(fields: [characterId], references: [id], onDelete: Cascade)
  name        String
  description String?
  trigger     Json?
  steps       Json
  permission  Json?
  status      CharacterWorkflowStatus @default(active)
  executions  CharacterWorkflowExecution[]
  createdAt   DateTime                @default(now())
  updatedAt   DateTime                @updatedAt

  @@index([userId])
  @@index([characterId])
  @@index([status])
}
```

### 5.8 CharacterWorkflowExecution

```prisma
model CharacterWorkflowExecution {
  id                   String                           @id @default(cuid())
  userId               String
  user                 User                             @relation(fields: [userId], references: [id], onDelete: Cascade)
  workflowId           String
  workflow             CharacterWorkflow                @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  characterId          String
  character            CharacterProfile                 @relation(fields: [characterId], references: [id], onDelete: Cascade)
  conversationId       String?
  conversation         Conversation?                    @relation(fields: [conversationId], references: [id], onDelete: SetNull)
  status               CharacterWorkflowExecutionStatus @default(pending)
  input                Json?
  output               Json?
  errorMessage         String?
  requiresConfirmation Boolean                          @default(false)
  startedAt            DateTime?
  completedAt          DateTime?
  createdAt            DateTime                         @default(now())
  updatedAt            DateTime                         @updatedAt

  @@index([userId])
  @@index([workflowId])
  @@index([characterId])
  @@index([conversationId])
  @@index([status])
}
```

## 6. Backfill 策略

首次迁移后执行一次数据补全：

1. 查询每个用户的 `AvatarProfile`。
2. 为每个 active Avatar 创建一个 `CharacterProfile`。
3. `CharacterProfile.name = AvatarProfile.name`。
4. `CharacterProfile.appearanceProfileId = AvatarProfile.id`。
5. `voiceProviderId`、`voice`、`language` 从 AvatarProfile 复制。
6. `roleType = custom`，`status = active`。
7. 如果用户没有 AvatarProfile，则创建一个 draft Character。

不要自动把历史 Conversation 绑定到某个 Character，除非用户显式选择默认角色。历史会话保持 `characterId = null`。

## 7. Repository 拆分

建议新增：

```text
src/services/characters/
  repository.ts
  presenter.ts
  schema.ts
  migration.ts

src/services/character-scenes/
  repository.ts
  presenter.ts
  schema.ts

src/services/character-memories/
  repository.ts
  presenter.ts
  schema.ts

src/services/character-workflows/
  repository.ts
  presenter.ts
  schema.ts
```

约束：

- API route 只做鉴权、解析、调用 service。
- repository 只处理数据库。
- presenter 只处理返回给前端的数据形状。
- schema 只处理请求校验。
- 不把 Character 逻辑塞回 `workspace-pages.tsx` 或现有 Avatar hook。

## 8. 验收标准

- Prisma migration 可执行。
- 旧 `/avatar` 页面和 API 不受影响。
- 新 `CharacterProfile` 可以创建、查询、更新、软删除。
- 一个 Character 可以绑定一个 `appearanceProfileId`。
- Conversation 可以保存 `characterId` 和 `sceneId`。
- 每个 Character 可以维护独立 Memory 和 Workflow。
- `npm run build` 通过。

