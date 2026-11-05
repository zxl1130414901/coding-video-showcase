# agg 演示脚本设计（v2）

> 仓库：asciinema/agg（Rust，asciicast → GIF，单文件二进制）
> 目标：证明它把「终端会话 → 像素」这一层做成完全参数化，同一输入能产出完全不同的成片。

## 真实能力（README + `agg --help`）

1. **主题系统**：14 套内置主题（dracula / github-light / monokai / nord / solarized…），映射 ANSI 16 色 + 256 色。
2. **字体与度量**：`--font-family` 回退链、`--font-size`、`--line-height`、`--font-antialiasing`，决定对齐与清晰度。
3. **视口覆盖**：`--cols` / `--rows` 直接改渲染画布，**无需改 cast**（140x34 → 100x24）。
4. **时间轴重排**：`--speed` 等比缩放、`--idle-time-limit` 折叠空闲、`--fps-cap` 控帧率、`--last-frame-duration` 控尾帧。

## 演示分段（3 段：11.6 + 7.7 + 11.6 = 30.9s，1080p30）

| 段 | 能力 | 命令 | 证明点 |
|---|---|---|---|
| 1 | 深色主题渲染 | `--theme dracula --font-size 28` | 输出 2186x1372，ANSI 调色板全部还原 |
| 2 | 浅色主题 + 倍速 | `--theme github-light --font-size 26 --speed 1.5` | 同一 cast，白底 + 时间轴压到 7.7s |
| 3 | 视口 + 字号覆盖 | `--theme monokai --cols 100 --rows 24 --font-size 22` | 输出 1234x770，cast 一行未改 |

同一份 `agg_demo.cast`，三种渲染配置 → 三个完全不同的成片，这正是「渲染参数化」的直接证据。

## 烧入标注（5 条）

0.5s `主题化渲染`；5.2s `字体回退链`；12.2s `浅色主题 + 倍速`；20.2s `视口覆盖`；26.0s `帧率与体积控制`。

## 已知限制

- Windows 字体库缺 JetBrains Mono，实际回退到 Consolas（字形宽度略有差异）。
- 命令里的 `--theme github-light` 会被解析为 `githublight`（CLI 归一化），不影响结果。
- GIF 相同帧合并后平均约 20fps，转 30fps 有帧复制。
