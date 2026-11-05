# VideoFlow 演示脚本（v2）

## 定位
ybouane/VideoFlow 是「代码写视频」的框架：TypeScript 流式 API（`addText` / `addShape` / `group` / `animate` / `wait`）
先编译成一份**可移植 JSON**，再由 `@videoflow/renderer-server` 在无头 Chromium 里逐帧截图、编码 MP4。
旧样例只有 3.1 秒的纯文本片（`examples/01-basic-text.ts`），没有体现「过渡预设 / 3D 图层组 / WebGL 特效栈」这三件事。

## 三段能力
1. **过渡预设 + 文本入场（0-7s）**：同一屏四条文案分别用 `blurResolve`（模糊→清晰）、`typewriter`（打字机）、
   `slideUp`（上滑）、`overshootPop`（回弹放大）入场，串起 25+ 预设这条产品线。
2. **图层组 + 3D 卡片 + 数字滚动（7-14s）**：`$.group()` 把矩形卡片 + 标签 + 数值组合成「一张卡」再整体合成，
   组属性 `perspective` + `rotation` 让三张卡在 3D 空间里对旋；`numberCountUp` 预设把数字从 0 滚到目标值。
3. **WebGL 特效栈（14-21s）**：`effects` 数组按顺序串 `colorCorrection` → `bloom` → `lightSweep`，
   并且 `animate({'effects.lightSweep.progress': -0.2 → 1.25})` 直接给着色器参数打关键帧——特效参数与普通属性同一套动画系统。

三段拼接 = 20.9s，1920×1080 / 30fps，逐帧截图后浏览器内封装 MP4，再拼接并烧标注。

## 规格
- 1920×1080 / 30fps / 20.9s / 3 段 / 5 条中文标注
- 命令：`node examples/v2-showcase.ts`（Node 24 原生跑 TS，`renderVideo` 自动选 server renderer）
- 分辨率无关：尺寸单位默认 `em`（1em = 1% 项目宽度），同一套布局换 1920×1080 也成立

## 实测成本
- 上批 1080p 93 帧耗时 294s（约 3.16s/帧，瓶颈是 Chromium 内逐帧 `drawElementImage` + 逐帧 1x 超采样），
  本次为控时长降到 720p 并缩短到 7s/段；渲染时间以实测为准。

## 踩坑
- 渲染只在 Node 里跑（`typeof window === 'undefined'` 分支），浏览器里 import 该文件不会自动渲染。
- `em` 单位下字号是「占屏宽百分比」，卡片 26em≈屏宽 26%，跨分辨率保持一致。
- 服务端渲染器依赖本机 Chromium（Playwright），首次启动慢，之后逐帧开销仍高。
