# ccapture.js v2 演示脚本

仓库：spite/ccapture.js（v2：固定帧率 canvas 录制 + GPU 运动模糊 + WebCodecs）
旧样例：`sample_basic.mp4`（4s / 1280x720，单个粒子环 demo）

## 三段能力（1920x1080，24s）

| 段 | 时间 | 能力 | 证明什么 |
|---|---|---|---|
| 1 | 0–8s | 虚拟时钟 + 固定帧率 | `record()` 自驱扁平帧循环：240 帧严格对应 8.000s，机器卡顿不会让视频变慢或掉帧 |
| 2 | 8–16s | GPU 16 子帧运动模糊 | 每个输出帧采样 16 个子帧后平均；子帧按 `(f+k/16)/30` 推进，拖尾方向与速度一致 |
| 3 | 16–24s | WebGL 画布直录 + 多编码 | 原始 WebGL2 片元着色器直接录成 VP9 webm，同一 API 还能输出 mp4 |

## 为什么这样选
旧样例只是「录一段粒子」，看不出 ccapture 与「Playwright 录屏」的差别。真正的差异点是**时间轴由代码控制**（虚拟时钟）和**子帧级运动模糊**，因此第 1/2 段专门围绕这两点；第 3 段补上 WebGL 源与容器选择（mp4/webm）。

## 中文标注（6 条）
0.5/4.8/8.4/12.8/16.6/20.8 秒各一条，见 `spec.json`，带 240 帧、16 子帧、720 帧等数字。

## 生成方式
`capture_v2.mjs` 用 Playwright 打开 `demo_v2.html?act=1|2|3`，由页面内的 CCapture 自己驱动录制并触发下载；三段落盘为 `seg1.mp4 / seg2.mp4 / seg3.webm`，再由 `build_sample.py` 拼接并烧入中文标注。
- `assets/seg1.mp4` 240 帧 8.0s
- `assets/seg2.mp4` 240 帧 8.0s（3840 次子帧绘制）
- `assets/seg3.webm` VP9 8.0s

## 已知限制
- 运动模糊需 16 倍绘制，录制耗时约普通模式的 2-3 倍。
- 依赖 WebCodecs，仅 Chromium 可用；旧浏览器需 `format: "webm-legacy"`。
- 段 3 的着色器在 1080p 全屏采样，边缘像素带宽较高，低端 iGPU 可能掉帧（本机 RTX 4060 正常）。
