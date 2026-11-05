# lemomo-ai__lemo-opuscar · 演示脚本（v2）

## 这条片子要证明什么
Lemo 把「风格」做成插件：`styles/` 下几十套视觉语法，每套都有 demo，统一暴露 `window.DUR` 与 `window.render(t)`。v2 用三套差异极大的风格证明：同一套逐帧渲染器可以跑字符画、剪纸、工程图。

## 分段设计

| # | 时间 | 风格 | 能力 | 实测证据 |
|---|---|---|---|---|
| 1 | 0.00–6.73s | ascii-crt | 字符画 CRT | 59.8s 长片任取 6.8s，等宽字符 + 扫描线 |
| 2 | 6.73–13.47s | papercut-red | 分层剪纸 | 纸片分层 + 朱红配色 + 层叠投影 |
| 3 | 13.47–20.20s | blueprint | 工程图 | 网格底 + 标注线 + 尺寸箭头 |

## 中文标注（6 条，每条 1.9–3.8s）

- **0.3s +3.8s** ① 风格即插件 ｜ styles/ 下 57 套风格，openDemo 直接逐帧渲染
- **4.4s +3.3s** ② ascii-crt 字符画 ｜ 59.8s 长片任取 6.8s，等宽字符 + CRT 扫描线
- **8.2s +3.6s** ③ papercut-red 剪纸 ｜ 纸片分层 + 朱红配色，层叠投影
- **12.4s +3.2s** ④ 同一时间轴 ｜ window.render(t) 固定 30fps 步进，换风格不换驱动
- **15.8s +3.4s** ⑤ blueprint 工程图 ｜ 网格底 + 标注线 + 尺寸箭头，46.7s 素材
- **19.0s +1.9s** ⑥ 三段成片 20.2s ｜ 6.8s × 3，720p30 一次拼接

## 管线与实测
- 渲染：`core/render/page.mjs` 的 `openDemo` + `window.render(t)` 逐帧截图，`_v2/lemo_render.mjs` 接 ffmpeg 管道
- 三段：ascii-crt / papercut-red / blueprint，各 6.8s@30fps，1280×720
- 拼接：ffmpeg concat + drawtext 烧中文标注，成片 20.2s
- 渲染耗时：约 180000 ms
- 基础小样：sample_basic.mp4（1280×720，4.97s，ascii-crt）

## 已知限制

- 仓库只附了 ascii-crt 的 VT323 字体；papercut-red / blueprint 用本机微软雅黑顶替，字形与原设计不同
- hologram-hud 实测卡在字体/渲染阶段（WebGL），第三风格改用 blueprint
- 720p 逐帧约 0.1–0.6s/帧，1080p 会成倍变慢，因此成片保持 720p
