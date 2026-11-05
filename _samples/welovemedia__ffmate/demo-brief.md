# ffmate 演示脚本设计（v2）

> 仓库：welovemedia/ffmate（Go，FFmpeg 自动化服务层）
> 目标：证明「它不只是一个 ffmpeg 包装器，而是可编排的任务队列 + REST 接口」。

## 读到的真实能力（README + `ffmate server --help` + internal 源码）

1. **REST 任务队列**：`POST /api/v1/tasks` 提交 `{name, command, inputFile, outputFile, priority}`，服务端排队执行；`--max-concurrent-tasks` 控制并发，`priority` 控制顺序（`internal/service/queue`）。
2. **任务对象完整生命周期**：`QUEUED → PROCESSING → DONE_SUCCESSFUL / DONE_ERROR`，`progress` 百分比由 ffmpeg 进度解析回写，`GET /api/v1/tasks` 可轮询（Web UI/WebSocket 同源）。
3. **任意 FFmpeg 图能力**：`command` 是完整 ffmpeg 命令行，因此多输入、`-filter_complex`、lavfi 源、NVENC 全部可用；服务本身不做画质妥协。
4. **可运维参数**：`--ffmpeg` 指定二进制、`--database` 指定 sqlite 位置、`--send-telemetry=false` 关遥测、`--no-ui` 无浏览器。

## 演示分段（3 段 × 8s = 24s，1080p30）

| 段 | 能力 | 画面 | 证明点 |
|---|---|---|---|
| 1 | 队列 + 优先级 | mandelbrot 分形连续缩放 + hue 渐变 | 3 个任务一次性提交，`max-concurrent=1` 时按 priority 1200/900/600 严格串行 |
| 2 | 多输入 + 混合模式 | gradients 底 + life 元胞自动机 `blend=screen` + vignette | `-filter_complex` 双源合成由任务 command 原样执行 |
| 3 | 音频可视化 | sine 220Hz → showwaves 波形 + showspectrum 频谱 | 同一任务内音频分析滤镜与视频叠加，服务端不做限制 |

## 烧入标注（5 条）

1. 0.4s / 4.4s —— `REST 任务队列` / `一次 POST 提交 3 个任务，priority 1200/900/600`
2. 8.2s / 4.4s —— `队列串行调度` / `--max-concurrent-tasks=1，三任务按优先级逐个执行`
3. 12.8s / 4.4s —— `多源滤镜合成` / `-filter_complex 双输入 blend=screen + vignette`
4. 16.8s / 3.6s —— `音频可视化任务` / `sine 220Hz → showwaves 波形 + showspectrum 频谱`
5. 20.6s / 3.4s —— `全链路可观测` / `状态 QUEUED→PROCESSING→DONE_SUCCESSFUL，progress 回写`

## 已知限制

- Windows 下输出路径含中文会被 ffmate 解码成 `F:\coding??`（上游 bug），因此任务统一输出到 `F:\ffmate_tmp`，再由本机复制到 `_samples`。
- 遥测联网失败会让服务 panic（`telemetry.go:56` 空指针），必须 `--send-telemetry=false`。
- 默认 `--database` 落在 `%APPDATA%\ffmate`（C 盘），改为 `_samples` 下的 `ffmate_db.sql`；本机已清理该 C 盘目录。
