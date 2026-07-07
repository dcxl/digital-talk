# ComfyUI Provider 接入设计

## 1. 定位

ComfyUI 在本项目中不是“内置绘图平台”，而是 Character 外观生产 Provider。

它只负责：

```text
Character prompt / reference image
-> ComfyUI workflow
-> generated asset
-> save as Character appearance asset
-> bind to CharacterProfile
```

不做：

- 不在平台内复刻 ComfyUI 编辑器。
- 不开放任意节点和任意文件路径给前端。
- 不把 workflow JSON 硬编码进业务代码。
- 不继续走 Live2D 主线。

## 2. 部署假设

MVP 支持两种方式：

| 方式 | 说明 |
| --- | --- |
| 本地 ComfyUI | 用户本机启动 `http://127.0.0.1:8188` |
| 远程 ComfyUI | 用户自己部署，平台只保存 baseUrl 和可选 API Key |

平台只调用 ComfyUI HTTP API：

- `POST /prompt`
- `GET /history/{prompt_id}`
- `GET /view`
- 可选 `GET /queue`
- 可选 `POST /interrupt`

## 3. 环境变量

```env
COMFYUI_BASE_URL=http://127.0.0.1:8188
COMFYUI_API_KEY=
COMFYUI_DEFAULT_TEXT_TO_IMAGE_WORKFLOW=
COMFYUI_DEFAULT_IMAGE_TO_IMAGE_WORKFLOW=
COMFYUI_OUTPUT_POLL_INTERVAL_MS=1000
COMFYUI_OUTPUT_TIMEOUT_MS=120000
COMFYUI_MAX_UPLOAD_BYTES=10485760
COMFYUI_ENABLED=false
```

说明：

| 变量 | 说明 |
| --- | --- |
| `COMFYUI_BASE_URL` | ComfyUI 服务地址 |
| `COMFYUI_API_KEY` | 可选，远程服务网关鉴权 |
| `COMFYUI_DEFAULT_TEXT_TO_IMAGE_WORKFLOW` | 默认文生图 workflow 模板路径或配置 key |
| `COMFYUI_DEFAULT_IMAGE_TO_IMAGE_WORKFLOW` | 默认图生图 workflow 模板路径或配置 key |
| `COMFYUI_OUTPUT_POLL_INTERVAL_MS` | 轮询间隔 |
| `COMFYUI_OUTPUT_TIMEOUT_MS` | 单次生成超时 |
| `COMFYUI_MAX_UPLOAD_BYTES` | 参考图最大上传大小 |
| `COMFYUI_ENABLED` | 是否启用真实调用 |

## 4. ProviderConfig 映射

当前 `ProviderType` 还没有 `image_generation`，v0.5 先复用：

```text
type = avatar
provider = comfyui
```

推荐 `ProviderConfig.options`：

```json
{
  "textToImageWorkflowKey": "default-character-t2i",
  "imageToImageWorkflowKey": "default-character-i2i",
  "pollIntervalMs": 1000,
  "timeoutMs": 120000,
  "outputNodeIds": ["9"],
  "allowedVariableKeys": [
    "positive_prompt",
    "negative_prompt",
    "seed",
    "width",
    "height",
    "reference_image"
  ]
}
```

后续如果新增枚举，可以迁移为：

```text
type = image_generation
provider = comfyui
```

## 5. Workflow 模板

workflow 模板不能由前端直接提交完整 JSON。

建议保存为受控模板：

```text
src/services/comfyui/workflows/
  character-text-to-image.json
  character-image-to-image.json
```

模板变量只允许替换白名单字段：

```ts
type ComfyWorkflowVariables = {
  positive_prompt: string;
  negative_prompt?: string;
  seed?: number;
  width?: number;
  height?: number;
  reference_image?: string;
};
```

前端只能提交变量，后端负责把变量写入 workflow JSON。

## 6. 生成流程

```text
POST /api/characters/:characterId/appearance-generations
-> validate character
-> validate provider
-> create AvatarGenerationJob pending
-> load workflow template
-> apply variables
-> POST ComfyUI /prompt
-> poll /history/{prompt_id}
-> fetch output via /view
-> save file through avatar asset storage
-> create AvatarAsset
-> update CharacterProfile.appearanceProfileId binding
-> mark job completed
```

失败时：

```text
mark job failed
store errorMessage
return provider_error / timeout / invalid_config
```

## 7. Provider 接口

```ts
export interface CharacterAppearanceGenerationProvider {
  id: string;
  name: string;
  generate(input: CharacterAppearanceGenerationInput): Promise<CharacterAppearanceGenerationResult>;
  test(): Promise<ProviderTestResult>;
}

export interface CharacterAppearanceGenerationInput {
  characterId: string;
  prompt: string;
  negativePrompt?: string;
  referenceAssetId?: string;
  workflowKey?: string;
  variables?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface CharacterAppearanceGenerationResult {
  jobId: string;
  assetId: string;
  publicUrl?: string;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
}
```

约束：

- Provider 不直接操作 UI。
- Provider 不决定角色绑定策略。
- Provider 返回产物信息，由 service 负责入库和绑定。

## 8. API 草案

### 8.1 创建生成任务

```http
POST /api/characters/:characterId/appearance-generations
```

Request：

```json
{
  "mode": "text_to_image",
  "prompt": "anime girl, silver hair, cyberpunk jacket",
  "negativePrompt": "low quality, blurry",
  "referenceAssetId": "asset_xxx",
  "workflowKey": "default-character-t2i",
  "variables": {
    "width": 768,
    "height": 1024,
    "seed": 123456
  }
}
```

Response：

```json
{
  "data": {
    "jobId": "job_xxx",
    "status": "running"
  },
  "requestId": "req_xxx"
}
```

### 8.2 查询生成任务

```http
GET /api/characters/:characterId/appearance-generations/:jobId
```

Response：

```json
{
  "data": {
    "id": "job_xxx",
    "status": "completed",
    "asset": {
      "id": "asset_xxx",
      "publicUrl": "/api/avatar-assets/asset_xxx/content",
      "width": 768,
      "height": 1024
    },
    "errorMessage": null
  },
  "requestId": "req_xxx"
}
```

## 9. 错误映射

| 场景 | 错误码 | retryable |
| --- | --- | --- |
| ComfyUI 未启用 | `provider_not_configured` | false |
| baseUrl 无法访问 | `network_error` | true |
| workflow key 不存在 | `invalid_config` | false |
| 变量不在白名单 | `bad_request` | false |
| 生成超时 | `timeout` | true |
| ComfyUI 返回错误 | `provider_error` | true |
| 输出文件不存在 | `provider_error` | true |
| 文件超过限制 | `bad_request` | false |

## 10. 安全边界

必须限制：

- 不允许前端提交任意 workflow JSON。
- 不允许前端传 ComfyUI 本地文件路径。
- 远程 URL 参考图必须走后端下载和校验，避免 SSRF。
- 输出文件只保存到项目定义的 storage。
- 限制图片大小、mime type 和生成超时。
- API Key 只存在服务端。

## 11. MVP 验收

- 未配置 ComfyUI 时，前端显示“未启用”，不能发起真实生成。
- 配置错误时，`test` 接口返回可读错误。
- mock provider 可以生成一条 completed job。
- 真实 ComfyUI 开启后，可以完成一次文生图或图生图。
- 生成图片能落为 `AvatarAsset`，并绑定到 Character 外观。

