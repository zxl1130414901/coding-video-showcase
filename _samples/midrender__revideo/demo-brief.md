# midrender__revideo · 演示脚本（v2）

## 这条片子要证明什么
证明它把 React/TSX 组件直接当视频画面：声明式 JSX 节点、信号驱动 tween、错峰 (stagger) 编排、矢量线条绘制与视图缩放，最终逐帧确定性导出 mp4。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–10.0s | JSX 组件即画面 + staggered tween 入场 | Txt/Circle/Rect 以 opacity+scale+rotation 多属性并行 tween 入场 |
| 2 | 10.0–20.0s | 程序化阵列 + 每格延迟 0.08s 错峰 | 9 个 Rect 由 chain+waitFor 编排，整体再旋转 90° |
| 3 | 20.0–29.1s | Line 矢量绘制 + 视图缩放 | 两条折线 end 0→1 绘制，view.scale 1.18 与节点同步放大 |

## 中文标注（4–6 条，每条 3–5s）

- **0.4s +4.0s** ① JSX 组件直接就是画面 ｜ Txt/Circle/Rect 同时 tween 透明度、缩放、旋转，React 组件即帧内容
- **10.4s +4.2s** ② 9 节点错峰动画 ｜ chain + waitFor 让每格延迟 0.08s，整体再旋转 90°
- **20.4s +4.2s** ③ 矢量线条 end 0→1 绘制 ｜ 两条 Line 以 easeOutCubic 生长，用于图表/流程演示
- **25.0s +4.0s** ④ 视图缩放 + 节点同步 ｜ view.scale 1.18 与圆点 scale 1.6 同步，30fps 逐帧确定性导出

## 管线与实测
- 生成方式：@revideo/core renderVideo（@revideo/core/ffmpeg 导出器），3 个 makeScene2D 场景，Playwright + 系统 Chrome headless，1920x1080/30fps；ffmpeg drawtext 烧录中文标注
- pipeline：official
- 渲染耗时：210000 ms
- 命令：node _samples\midrender__revideo\_v2\render_v2.js（cwd 自动切到 packages\template）
- 新建 src\v2.tsx + src\project_v2.ts，不改动模板原有 example.tsx

## 已知限制

- 渲染依赖 Playwright + Chrome，本机需指向系统 Chrome（PUPPETEER_EXECUTABLE_PATH）
- renderVideo 的 outDir/outFile 在本版本被忽略，产物固定落在 packages\template\output\video.mp4
- wasm 导出器会产出空文件，必须改用 @revideo/core/ffmpeg
