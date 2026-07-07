# Character Studio 页面级原型

## 1. 页面目标

`/characters` 是 v0.5 主入口，用于创建、管理和运行 AI Character。

第一版要完成：

```text
角色列表
-> 角色详情
-> 外观资产
-> 声音配置
-> 场景绑定
-> 记忆管理
-> 工作流管理
-> 进入对话运行
```

旧 `/avatar` 保留兼容，但新功能不再从 Avatar 页面扩展。

## 2. 页面信息架构

```text
/characters
├── Character Library
│   ├── 搜索
│   ├── 类型筛选
│   ├── 状态筛选
│   └── 角色列表
└── Character Studio
    ├── Profile
    ├── Appearance
    ├── Voice
    ├── Scene
    ├── Memory
    └── Workflow
```

## 3. 页面布局

建议三栏：

```text
左栏：角色列表
中栏：角色配置表单
右栏：预览与运行状态
```

移动端改为：

```text
角色列表
-> 点击进入角色详情
-> tabs 切换 Profile / Appearance / Scene / Memory / Workflow
```

## 4. Character Library

### 4.1 列表字段

每个角色卡片展示：

- 头像或外观缩略图
- 名称
- 角色类型
- 默认场景
- 状态
- 最近更新时间

### 4.2 操作

- 新建角色
- 复制角色
- 禁用角色
- 删除角色
- 进入对话

删除使用软删除：

```text
status = deleted
```

## 5. Profile 面板

字段：

| 字段 | 说明 |
| --- | --- |
| name | 角色名称 |
| roleType | 角色类型 |
| description | 角色简介 |
| tags | 标签 |
| personaPromptId | 绑定人格 Prompt |
| status | draft / active / disabled |

校验：

- `name` 必填。
- active 角色必须至少有 name、roleType。
- 没有外观资产时允许保存为 draft。

## 6. Appearance 面板

第一版支持三种入口：

| 入口 | 说明 |
| --- | --- |
| 上传图片 | 用户手动上传头像或半身像 |
| 绑定已有资产 | 选择已有 `AvatarAsset` |
| ComfyUI 生成 | 配置存在时发起生成 |

### 6.1 上传状态

```text
idle
uploading
uploaded
failed
```

### 6.2 ComfyUI 生成状态

```text
not_configured
idle
running
completed
failed
timeout
```

未启用 ComfyUI 时，显示配置提示，不展示可点击的生成按钮。

## 7. Voice 面板

字段：

- TTS Provider
- voice
- language
- speed
- pitch

第一版复用现有 TTS 能力，不重写 Provider。

## 8. Scene 面板

能力：

- 查看已绑定场景。
- 绑定场景。
- 设为默认场景。
- 解除绑定。

场景字段：

| 字段 | 说明 |
| --- | --- |
| name | 场景名称 |
| type | knowledge_assistant / host / chat_companion / business_assistant / custom |
| promptTemplateId | 场景提示词 |
| knowledgeBaseId | 可选知识库 |
| inputMode | text / voice |
| outputMode | text / voice |

## 9. Memory 面板

第一版只做可治理的手动记忆：

- 查看记忆列表。
- 新增记忆。
- 禁用记忆。
- 删除记忆。
- 查看来源会话。

列表字段：

- type
- content
- source
- confidence
- status
- createdAt

## 10. Workflow 面板

第一版只做手动 workflow：

- 创建 workflow 定义。
- 手动运行。
- 查看执行日志。
- 失败重试。
- 需要确认时不自动执行。

workflow 不做复杂画布编排，先用结构化 JSON 表达。

## 11. 进入对话

从角色进入对话时：

```text
POST /api/conversations
{
  "characterId": "...",
  "sceneId": "..."
}
```

规则：

- 如果用户选择场景，使用选择的 `sceneId`。
- 如果没有选择，使用角色默认场景。
- 如果没有默认场景，允许只带 `characterId` 创建普通角色对话。

## 12. 空状态与错误状态

必须覆盖：

| 状态 | 处理 |
| --- | --- |
| 没有角色 | 显示新建角色入口 |
| 没有外观 | 显示上传/绑定/ComfyUI 配置入口 |
| 没有场景 | 允许创建普通对话，同时提示可绑定场景 |
| 没有记忆 | 显示新增记忆入口 |
| 没有 workflow | 显示新增 workflow 入口 |
| Provider 错误 | 显示错误摘要和重试入口 |

## 13. 工程拆分

建议文件：

```text
src/features/workspace/characters/
  character-list.tsx
  character-profile-form.tsx
  character-appearance-panel.tsx
  character-voice-panel.tsx
  character-scene-panel.tsx
  character-memory-panel.tsx
  character-workflow-panel.tsx
  character-preview-panel.tsx
  use-character-management.ts
  types.ts
  constants.ts

src/features/workspace/pages/characters-page.tsx
```

约束：

- 页面只组合模块。
- API 请求放 hook 或 service client。
- 表单校验独立。
- 展示组件不直接写数据库逻辑。

## 14. 验收标准

- `/characters` 可以独立展示角色库。
- 可以新建 draft Character。
- 可以上传或绑定外观资产。
- 可以保存声音配置。
- 可以绑定默认场景。
- 可以维护手动记忆。
- 可以创建并手动运行 workflow。
- 从角色进入对话时会带上 `characterId`。

