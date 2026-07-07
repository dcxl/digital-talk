# Character Runtime、Memory 与 Workflow 规则

## 1. 目标

本文件定义角色运行时如何把 Character、Scene、Knowledge、Memory、Workflow 组合成一次对话上下文。

核心目标：

```text
用户不是在和通用助手聊天，而是在和某个 Character 在某个 Scene 下交互。
```

## 2. Runtime 输入

一次对话请求至少包含：

```ts
type CharacterRuntimeInput = {
  userId: string;
  conversationId?: string;
  characterId?: string;
  sceneId?: string;
  message: string;
  enableTTS?: boolean;
};
```

`characterId` 可空是为了兼容历史会话，但新入口创建的会话必须尽量带上 `characterId`。

## 3. 上下文装配顺序

建议顺序：

```text
1. 平台基础约束
2. Character Persona
3. Scene Prompt
4. Knowledge Context
5. Character Memory
6. Workflow 能力说明
7. Conversation History
8. User Message
```

优先级规则：

| 来源 | 优先级 | 说明 |
| --- | --- | --- |
| 平台基础约束 | 最高 | 安全、格式、系统边界 |
| Character Persona | 高 | 角色身份和行为风格 |
| Scene Prompt | 高 | 当前场景任务 |
| Knowledge | 中 | 检索事实 |
| Memory | 中 | 长期偏好和关系事实 |
| Workflow | 中 | 可执行能力 |
| History | 低 | 当前会话上下文 |
| User Message | 输入 | 本轮用户问题 |

冲突处理：

- 平台约束高于角色设定。
- 场景任务高于闲聊风格。
- 知识库事实高于记忆中的过期事实。
- 用户本轮明确纠正时，应生成记忆候选，而不是继续使用旧记忆。

## 4. Character Persona

来源：

- `CharacterProfile.description`
- `PromptTemplate.currentVersion`
- `CharacterProfile.runtimeConfig`

建议渲染成：

```text
你正在扮演角色：{{character.name}}
角色类型：{{character.roleType}}
角色简介：{{character.description}}
表达风格和边界：
{{personaPrompt}}
```

## 5. Scene Context

Scene 决定角色当前在做什么。

示例：

```text
场景：知识库助手
任务：基于绑定知识库回答问题，无法确认时说明不确定。
输出方式：简洁中文。
```

不同 Scene 可以改变：

- prompt
- knowledgeBase
- inputMode
- outputMode
- workflowPolicy

## 6. Knowledge Context

知识库只在 Scene 绑定了 `knowledgeBaseId` 时启用。

流程：

```text
user message
-> retrieve chunks
-> rerank or topK
-> inject snippets
```

注入建议：

- MVP topK 取 3-5 条。
- 每条包含 source metadata。
- 不把完整文档塞入 prompt。
- 如果无命中，明确给 LLM 说明“没有检索到相关知识片段”。

## 7. Memory 规则

### 7.1 记忆类型

| 类型 | 用途 |
| --- | --- |
| long_term | 长期事实 |
| session_summary | 会话摘要 |
| user_preference | 用户偏好 |
| relationship_fact | 用户与角色关系 |
| character_fact | 角色设定补充 |

### 7.2 MVP 写入策略

v0.5 只做手动写入：

- 用户在 Memory 面板新增。
- 服务端允许从会话摘要生成候选，但不自动生效。
- 自动记忆写入放到后续版本。

### 7.3 读取策略

每次对话读取：

```text
characterId
-> active memories
-> filter expired
-> group by type
-> limit by token budget
```

建议限制：

- 总注入 token 不超过上下文预算的 15%。
- `user_preference` 优先。
- `relationship_fact` 次之。
- `session_summary` 只取最近摘要。

### 7.4 治理能力

记忆必须支持：

- 查看来源。
- 禁用。
- 删除。
- 设置过期时间。
- 查看置信度。

错误记忆不能只能靠 prompt 覆盖，必须可管理。

## 8. Workflow 规则

### 8.1 MVP 能力边界

第一版只支持：

- 静态 workflow 定义。
- 手动运行。
- 执行日志。
- 失败状态。
- 需要确认时等待用户确认。

不做：

- 自动多步 Agent 编排。
- 可视化工作流画布。
- 后台定时任务。
- 无确认的高风险操作。

### 8.2 Workflow 定义

```json
{
  "trigger": {
    "type": "manual"
  },
  "steps": [
    {
      "id": "summarize",
      "type": "llm",
      "input": {
        "prompt": "总结当前会话"
      }
    }
  ],
  "permission": {
    "requiresConfirmation": true
  }
}
```

### 8.3 执行状态

```text
pending
running
waiting_confirmation
success
failed
cancelled
```

### 8.4 确认机制

需要确认的 workflow：

```text
run requested
-> create execution waiting_confirmation
-> user confirms
-> execute
-> write output
```

用户未确认时不能调用外部 Provider 或写入副作用。

## 9. Runtime 事件建议

后续可补充事件：

```text
character.context.resolved
character.memory.injected
character.scene.resolved
character.workflow.requested
character.workflow.confirmation_required
character.workflow.started
character.workflow.completed
character.workflow.failed
```

前端可以用这些事件展示角色状态，但 MVP 不要求全部实时化。

## 10. API 影响

### 10.1 Chat Request

`POST /api/chat` 追加：

```json
{
  "conversationId": "conv_xxx",
  "characterId": "char_xxx",
  "sceneId": "scene_xxx",
  "message": "你好"
}
```

规则：

- 如果 `conversationId` 已存在，以会话绑定的 `characterId` 为准。
- 如果请求传入的 `characterId` 和会话不一致，返回 `bad_request`。
- 新会话可以传 `characterId` 和 `sceneId`。

### 10.2 Conversation Response

会话列表返回：

```json
{
  "id": "conv_xxx",
  "title": "你好",
  "character": {
    "id": "char_xxx",
    "name": "Emily",
    "avatarUrl": "/api/avatar-assets/asset_xxx/content"
  },
  "scene": {
    "id": "scene_xxx",
    "name": "知识库助手"
  }
}
```

## 11. Prompt 组装伪代码

```ts
async function buildCharacterRuntimeContext(input: CharacterRuntimeInput) {
  const conversation = await resolveConversation(input);
  const character = await resolveCharacter(input.characterId ?? conversation.characterId);
  const scene = await resolveScene(input.sceneId ?? conversation.sceneId, character);
  const persona = await renderCharacterPersona(character);
  const knowledge = await retrieveSceneKnowledge(scene, input.message);
  const memories = await loadCharacterMemories(character.id, input.message);
  const workflows = await listAllowedWorkflows(character.id, scene?.id);
  const history = await loadConversationHistory(conversation.id);

  return composeMessages({
    platformPolicy,
    persona,
    scene,
    knowledge,
    memories,
    workflows,
    history,
    userMessage: input.message
  });
}
```

## 12. 验收标准

- 新会话可以绑定 `characterId`。
- Chat runtime 可以读取 Character persona。
- Scene prompt 可以影响回答。
- Memory 只注入 active 且未过期的记录。
- Workflow 只在手动触发时执行。
- 需要确认的 workflow 不会自动执行。
- 历史无 Character 的会话仍可继续聊天。

