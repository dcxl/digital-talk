# Starter Avatar Live2D Source Pack

这是一个用于 v0.4 开发的 Live2D 制作素材包，不是已经导出的 Cubism runtime 包。

原因：`.moc3` 是 Live2D Cubism Editor 的导出产物，不能用普通代码直接生成。你需要在 Cubism Editor 中基于 `source/starter-avatar.parts.svg` 建模，然后导出 runtime 文件。

## 目录

```text
public/live2d/starter-avatar/
  source/
    starter-avatar.parts.svg
    parts-manifest.json
  export-template/
    starter-avatar.model3.json
  textures/
  motions/
  expressions/
```

## 导出后应形成

```text
public/live2d/starter-avatar/
  starter-avatar.model3.json
  starter-avatar.moc3
  textures/texture_00.png
  motions/idle.motion3.json
  motions/speaking.motion3.json
  expressions/neutral.exp3.json
  expressions/happy.exp3.json
```

导出完成后，可以把 `export-template/starter-avatar.model3.json` 复制到根目录，并按实际导出文件名修正引用。

## 建模建议

- Mouth: 绑定 `ParamMouthOpenY`
- Eye blink: 绑定 `ParamEyeLOpen` / `ParamEyeROpen`
- Head angle: 绑定 `ParamAngleX` / `ParamAngleY` / `ParamAngleZ`
- Body angle: 绑定 `ParamBodyAngleX`

v0.4 第一版只要求 mouth open、blink、idle motion 和 speaking motion。
