# heygen-com__hyperframes · 演示脚本（v2）

## 这条片子要证明什么
HyperFrames 的卖点是「用 HTML 写片子、用 Chromium 逐帧导出」。这条片用三个官方 registry 块证明：同一套浏览器 seek→截图→编码管线，既能做数据竞赛、也能画图表和地图，且不靠实时录屏。

## 分段设计

| # | 时间 | 官方块 | 能力 | 实测证据 |
|---|---|---|---|---|
| 1 | 0.00–7.43s | bar-chart-race | HTML→MP4 逐帧捕获 | 排序、柱长、Ticker 由 GSAP 时间轴驱动 |
| 2 | 7.43–14.87s | data-chart | 图表绘制 | 坐标轴/折线/标注按系列入场，SVG 1080p 不糊 |
| 3 | 14.87–22.30s | spain-map | 地图标注 | 投影底图 + 城市点 + 引线，纯 HTML/SVG |

## 中文标注（6 条，每条 2.6–3.6s）

- **0.3s +3.6s** ① HTML→MP4 逐帧捕获 ｜ 浏览器 seek 到 t 再截图，不靠实时录屏
- **4.2s +3.2s** ② 数据竞赛动画 ｜ 排序、柱长、Ticker 全由 GSAP 时间轴驱动
- **8.0s +3.6s** ③ 图表绘制 ｜ 坐标轴/折线/标注按系列入场，SVG 1080p 不糊
- **12.2s +3.2s** ④ 官方 Registry 块 ｜ 直接复用 registry/blocks，不写页面也能出片
- **16.0s +3.6s** ⑤ 地图标注 ｜ 投影底图 + 城市点 + 引线，纯 HTML/SVG
- **19.6s +2.6s** ⑥ 三段 22.5s ｜ 7.5s × 3，1920×1080@30fps

## 管线与实测
- 渲染：hyperframes CLI 0.9.14，三个工程各 `--start 0 --end 7.5 -f 30 -w 1`，Chromium headless-shell 逐帧
- 缓存：`HYPERFRAMES_CACHE_DIR` 重定向到 `F:\coding视频\_env\cache\hyperframes`，未写 C 盘
- 拼接：ffmpeg concat + drawtext 烧中文标注，成片 22.3s / 1080p30
- 渲染耗时：约 330000 ms（三段）
- 基础小样：sample_basic.mp4（1280×720，7.97s，warm-grain）

## 已知限制

- `flowchart` 与 `thread-message-stack` 两个官方块在本机报 timeline 未注册，本次第二段改用 `data-chart`
- 块内 GSAP 走 jsDelivr，离线环境需本地镜像
- 官方块自带英文文案，中文只出现在底部标注条，未改块内排版
