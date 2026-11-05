# mifi__editly · 演示脚本（v2）

## 这条片子要证明什么
证明 editly 用一份 JSON5 时间轴把「标题背景、图片浮层、视频层、字幕、全局音轨、GL 转场」组合成一条成片，全部由 ffmpeg 后端落盘。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–5.8s | 多图层同帧叠加 | title-background（线性渐变）+ image-overlay（logo 推近 0.08）+ title 三层同时合成 |
| 2 | 5.8–11.6s | GL 转场 + 视频图层 | circleopen / directionalwipe 转场 1.2s，bg1.mp4 以 cover 裁切进 720p |
| 3 | 11.6–18.6s | 中文字幕 + 全局音轨 | Microsoft YaHei 字幕两行自动换行；music.m4a 全片混流，成片 18.6s |

## 中文标注（4–6 条，每条 3–5s）

- **0.5s +4.6s** ① 三图层同帧叠加 ｜ 渐变标题背景 + logo 浮层 + 标题文案，一份 JSON 同时合成
- **6.2s +4.6s** ② GL 转场 directionalwipe ｜ 两段 clip 重叠 1.2s，headless-gl 做 180° 方向擦除
- **8.9s +3.6s** ③ 视频层 cover 裁切 ｜ bg1.mp4 1080p → 720p cover，浮层 zoomAmount 0.06 推近
- **12.0s +4.0s** ④ 中文字幕层 ｜ Canvas 生成两行字幕，Microsoft YaHei 字体，底部半透明衬底
- **16.2s +2.3s** ⑤ 全局音轨 + 单时间轴 ｜ music.m4a 混流；3×7s − 2×1.2s 转场 = 18.6s 成片

## 管线与实测
- 生成方式：editly 0.0.15 + node20 + tsx 直跑 v3_runner.ts；node_modules\canvas 入口转发 @napi-rs/canvas（N-API 预编译，绕开损坏的 canvas.node）；headless-gl 做 GL 转场；ffmpeg 后端合成 1280x720/30fps，再 drawtext 烧录中文标注
- pipeline：fallback
- 渲染耗时：143000 ms
- 命令：node20 + node_modules\tsx\dist\cli.mjs v3_runner.ts（demo_v3.json5）
- npm registry 使用 npmmirror；GPU 转场走 headless-gl，未占用浏览器 GPU
- @napi-rs/canvas 没有导出 registerFont，shim 用 GlobalFonts.registerFromPath 兼容 canvas API

## 已知限制

- 仓库自带的 canvas 原生二进制 canvas.node 损坏，未重装成功；改为在 node_modules\canvas\index.js 转发 @napi-rs/canvas（预编译 N-API），未改仓库源码
- 字幕层用 fabric Textbox 固定底部锚点，第三段改用纯渐变背景，避免字幕与素材自带文字重叠
- 3 段 7s 经两次 1.2s 转场重叠，成片 18.6s（不是 21s）
