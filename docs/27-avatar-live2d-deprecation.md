# Avatar / Live2D 退场计划

## 1. 背景

项目方向已经从“数字人运行时”调整为：

```text
AI Character Platform
```

Live2D 曾用于验证表现层，但现在不再是主线。后续角色外观生产改为：

```text
上传静态图
ComfyUI 文生图 / 图生图
后续可扩展序列帧或视频资产
```

## 2. 保留内容

短期保留：

- `AvatarProfile`
- `AvatarAsset`
- `AvatarGenerationJob`
- `/api/avatar-profiles`
- `/api/avatar-assets`
- `/avatar` 兼容页面

原因：

- Character 外观第一阶段复用 `AvatarProfile` / `AvatarAsset`。
- 静态图预览和 TTS 配置已经可用。
- 一次性重命名风险大。

## 3. 移除内容

v0.5 可移除：

- Live2D canvas renderer。
- Cubism Core loader。
- Live2D package manifest scanner。
- `/api/avatar-runtime/live2d-packages`。
- Live2D / VRM 新建入口。
- `pixi-live2d-display`。
- `pixi.js`。

数据库 enum 暂时不迁移：

- `AvatarDriver.live2d`
- `AvatarDriver.vrm`
- `AvatarAssetType.live2d`
- `AvatarAssetType.vrm`

原因：

- PostgreSQL enum 删除值成本高。
- 旧数据可能存在。
- UI 和业务层隐藏即可。

## 4. 替换策略

旧：

```text
Live2D model package
-> canvas runtime
-> mouth sync
```

新：

```text
Character appearance asset
-> static preview
-> TTS audio
-> later: ComfyUI generated sequence/video asset
```

MVP 阶段只要求静态外观稳定，不做口型动画。

## 5. 代码删除顺序

1. 替换前端 `AvatarRuntimeStage` 使用方为静态预览组件。
2. 删除 Live2D canvas 和 Cubism loader。
3. 删除 Live2D manifest service 和 route。
4. 调整 avatar runtime provider，只保留 static。
5. 删除相关测试或改为 static fallback 测试。
6. 移除 npm 依赖。
7. 运行 build，确认 trace warning 消失。

## 6. 兼容规则

如果历史 profile 的 `driver = live2d` 或 `vrm`：

```text
runtime driver -> static
status -> degraded
message -> 当前外观类型已退场，使用静态预览
```

不在 UI 新建这类 driver。

## 7. 文档处理

历史文档保留：

- `12-v0.2-digital-human-core.md`
- `13-v0.3-realtime-roadmap.md`
- `14-v0.4-avatar-runtime-roadmap.md`
- `15-v0.5-realtime-transport-roadmap.md`

但 README 必须明确：

- 它们是历史运行时路线。
- 当前主线以 `17`、`18`、`19-27` 为准。

## 8. 验收

- `/characters` 不出现 Live2D / VRM 新建选项。
- `/avatar` 访问不崩溃。
- 历史 Live2D / VRM profile 降级 static。
- build 不再依赖 Live2D SDK。
- package lock 中无 `pixi-live2d-display`。

