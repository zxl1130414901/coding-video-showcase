# alchaincyf__huashu-motion · 演示脚本（v2）

## 这条片子要证明什么
huashu-motion 用「模板 + 变量」生成动效工程：`om new --template` 一条命令拉出完整 index.html、vendor 与字体，`om render` 再用本机 Chrome 逐帧导出。v2 用三个风格差异最大的模板证明覆盖面。

## 分段设计

| # | 时间 | 模板 | 能力 | 实测证据 |
|---|---|---|---|---|
| 1 | 0.00–7.43s | keynote-ui | 模板即工程 | 10s 工程 300 帧 1920×1080，改文案不改版式 |
| 2 | 7.43–14.87s | kurzgesagt | 矢量插画叙事 | 角色/场景按 cue 入场，配色稳定 |
| 3 | 14.87–22.30s | whiteboard | 手绘白板 | 笔画按顺序绘出，适合讲解与标注 |

## 中文标注（6 条，每条 2.6–3.6s）

- **0.3s +3.6s** ① 模板即工程 ｜ om new --template keynote-ui，一条命令生成 10s 可渲染工程
- **4.2s +3.2s** ② 变量化文案 ｜ 标题/眉题/卡片都是变量，改词不改版式
- **8.0s +3.6s** ③ 矢量插画叙事 ｜ kurzgesagt 模板：角色与场景按 cue 入场
- **12.2s +3.2s** ④ 同一渲染器 ｜ Chrome 逐帧截图 + FFmpeg 合成，模板不同管线相同
- **16.0s +3.6s** ⑤ 手绘白板 ｜ whiteboard 模板：笔画按顺序绘出，适合讲解
- **19.6s +2.6s** ⑥ 三段 22.5s ｜ 每段 7.5s，1920×1080@30fps

## 管线与实测
- 渲染：`om new --template` × 3，`om render --workers 1 --silent`，`OM_CHROME` 指向 chrome-headless-shell
- 裁剪：每段原片 10s，取前 7.5s（同时避开片尾 1.2s 免费版角标）
- 拼接：ffmpeg concat + drawtext 烧中文标注，成片 22.3s / 1080p30
- 渲染耗时：约 300000 ms
- 基础小样：sample_basic.mp4（1280×720，14.33s，examples/showcase）

## 已知限制

- 三个模板保留自带中文示例文案，未逐字改写；只裁时长与拼接
- 免费版会在最后 1.2s 烧 “Made with huashu-motion” 角标，本次裁掉片尾规避
- 单 worker 渲染 10s 约 2–4 分钟，1080p 输出需要本机 Chrome/Chromium
