# canvas-record v2 演示脚本

仓库：dmnsgn/canvas-record（canvas 录制器：帧精确 step、进度事件、多编码器）
旧样例：`sample_basic.mp4`（4s / 1280x720，2D 粒子 + mp4）

## 三段能力（20.8s）

| 段 | 时间 | 能力 | 证明什么 |
|---|---|---|---|
| 1 | 0–8s | 帧精确 step + 自动停止 | 240 帧严格 8.000s；`duration=8` → `frameTotal=240`，到点自动 stop + 下载 |
| 2 | 8–16s | WebGL 上下文直录 | 直接把 `gl` 交给 Recorder，输出 VP9 webm，无二次 2D 转绘 |
| 3 | 16–20.8s | GIF 编码器直出 | 12fps / 60 帧调色板 GIF 直接下载，验证「一个 API 多容器」 |

## 为什么这样选
canvas-record 的差异点是**编码器矩阵 + 帧精确控制**，而不是画面本身。所以三段刻意用三种源（2D canvas / WebGL2 / GIF 调色板）和三种容器（mp4 / webm / gif），第 3 段用 1280×720@12fps 以符合 GIF 的体积约束。

## 中文标注（5 条）
0.5/4.8/8.4/12.8/17.0 秒各一条，见 `spec.json`，含 240 帧、8.000s、12fps/60 帧等数字。

## 生成方式
`capture_v2.mjs` 用 Playwright 打开 `demo_v2.html?act=1|2|3`，每段由 Recorder 自己 step 并下载；`build_sample.py` 把 mp4/webm/gif 三段统一到 1920×1080@30fps 后拼接并烧标注。

## 已知限制
- GIF 段只有 1280×720@12fps，成片放大到 1080p 会略软（GIF 体积与主线程编码限制）。
- 1080p 长 GIF 在浏览器主线程编码会卡顿，因此控制在 60 帧。
- WebGL 需要 `preserveDrawingBuffer: true`，否则 readback 可能是空帧。
