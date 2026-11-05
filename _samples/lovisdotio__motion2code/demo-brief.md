# lovisdotio__motion2code · 演示脚本（v2）

## 这条片子要证明什么
证明 motion2code 能把「一段视频动效」落成可逐帧复现的 GSAP 页面：渲染器不靠录屏，而是把时间轴 seek 到每一帧再截屏，因此任意时刻都可重放、可量化比对。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–7.93s | 视频→代码反向工程 | gallery/think-big 用 GSAP 时间轴复刻原片排版、配色与缓动 |
| 2 | 7.93–15.87s | 任意帧可复现 | gallery/eye 240 帧按 30fps 固定步进抓屏，单帧可重放 |
| 3 | 15.87–23.80s | 多题材同一管线 | gallery/festival-map 地图动效沿用同一 render_anim.py |

## 中文标注（6 条，每条 3–5s）

- **0.4s +4.2s** ① 视频→代码复刻 ｜ 逐帧对照原片，GSAP 重建同一时间轴与缓动
- **5.2s +3.6s** ② 逐帧 seek 可复现 ｜ window.anim.seek(t) 精确定格，不依赖录屏
- **8.6s +3.8s** ③ 任意时刻定格 ｜ eye 篇 240 帧全部可单帧重放，无丢帧
- **12.6s +3.6s** ④ 30fps 固定步进 ｜ 帧号=时间×fps，节奏与原片一致
- **16.4s +4.2s** ⑤ 多题材同一管线 ｜ festival-map 地图动效照跑，版式不串味
- **20.8s +3.2s** ⑥ 帧差可量化 ｜ 原片/复刻逐帧比对，误差用平均像素差衡量

## 管线与实测
- 生成方式：`render_anim.py`（Playwright + `window.anim.seek` 逐帧截图）分别渲染 think-big / eye / festival-map 各 8s，1920×1080@30fps
- 拼接：ffmpeg concat → drawtext 烧中文标注，成片 23.8s
- 渲染耗时：约 110000 ms
- 基础小样：sample_basic.mp4（1280×720，9.97s，仅 think-big）

## 已知限制

- 本次只验证官方 gallery 三页的渲染链路，未跑「从任意视频反推代码」的完整分析流程
- 示例页依赖 gallery 目录结构与 `?external=1` 参数，脱离该目录需改 `--root`
- 渲染走本机 Chrome（channel=chrome），无 GPU 加速时单帧约 100ms
