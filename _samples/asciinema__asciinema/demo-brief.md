# asciinema 演示脚本设计（v2）

> 仓库：asciinema/asciinema（Rust 重写的终端录制器，asciicast v2/v3）
> 目标：证明「录制产物是纯文本事件流，录制/回放/渲染三层完全解耦」。

## 真实能力（README + src/cli + 格式文档）

1. **`rec` 录制为 asciicast**：终端输出 + 时间戳逐事件写入 `.cast`，而不是录成视频；体积是同等屏幕录像的千分之一量级。
2. **回放侧参数化**：`play -s 2`（倍速）、`--idle-time-limit`（折叠空闲）、跳转/暂停/步进，时间戳是绝对秒，压缩不破坏顺序。
3. **格式可读可改**：一行 header（version/width/height/env）+ N 行 `[time, "o", data]`；可 diff、sed 裁剪、交给任意渲染器。
4. **zstd 压缩（v3）**：多 MB 会话压到几十 KB，且仍是流式可解析。

## 演示分段（3 段 × 约 8.6s = 26s，1080p30）

| 段 | 能力 | 画面 | 证明点 |
|---|---|---|---|
| 1 | `rec` 录制 | `asciinema rec` → git log / ffprobe 逐字回放，时序与真实输出一致 | 事件流即产物，不是屏幕录像 |
| 2 | 回放调速 | `play -s 2 --idle-time-limit 0.5`，同一 cast 压缩时间轴 | 22s 会话 → 8s，事件顺序不变 |
| 3 | 格式解剖 | 逐行染色展示 header + 事件行 | 纯文本可 diff / 裁剪 / 复用 |

三段由 `make_casts.py` 生成真实 cast（`\x1b` 颜色序列按 token 原子切片），`agg` 渲染成 GIF，再转 1080p30 拼成成片。

## 烧入标注（5 条）

0.5s `rec 录制成 cast`；5.0s `播放与录制解耦`；8.8s `回放调速`；13.4s `空闲压缩`；17.2s `纯文本事件流`。

## 已知限制

- 上游 `asciinema rec` 依赖 Unix PTY，Windows 无法直接录制；样例用等价 cast v2 事件流（与 `rec` 输出同格式）。
- agg 合并相同帧，渲染平均约 20fps，转 30fps 时有帧复制。
- 140x34 的 cast 渲染宽度 1874，合成时缩放到 1920x1080（横向轻微拉伸）。
