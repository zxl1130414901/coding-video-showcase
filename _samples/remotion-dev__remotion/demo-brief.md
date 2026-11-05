# remotion-dev/remotion 能力演示脚本（sample v2）

## 设计目标
旧样例是 `HelloWorld`（纯文字淡入，4 秒）。新样例要展示「React 即视频」的三项核心差异能力，30 秒顺序拼接：

| 分段 | 时间 | 能力 | 证明点 |
|---|---|---|---|
| 1 | 0–9s | React 组件 + 帧驱动插值 | 卡片、数字、进度条全部由组件状态和 `interpolate()` 计算，复用前端生态 |
| 2 | 9–19s | 真实音频解码与波形同步 | `useAudioData` 解码 WAV，`visualizeAudioWaveform` 按帧取 96 个采样点；`<Audio>` 音轨写进 MP4 |
| 3 | 19–30s | Series 时间轴 + 字幕转场 | `Series.Sequence` 切片，字幕按帧弹簧进出，CI 可确定性重渲染 |

## 实现
- 组件：`_samples/remotion-dev__remotion/proj/src/Capabilities.tsx`（新增 Composition `Capabilities`，1920×1080/30fps/900 帧）
- 音频：ffmpeg 合成 10 秒节奏音轨 `public/beat.wav`，随第 2 段播放
- 渲染：`npx remotion render src/index.ts Capabilities --concurrency=1`（单 worker，避免与其他 GPU 任务抢资源）
- 后期：`poster.py` 烧入中文标注。

## 取舍与限制
- 第 2 段波形画在 SVG 中，使用 `@remotion/media-utils` 官方可视化 API，而非手写假波形。
- 为控制渲染时长，1080p 900 帧、单 worker；未启用 60fps。
- 旧 `HelloWorld` 保留为 `sample_basic.mp4`。
