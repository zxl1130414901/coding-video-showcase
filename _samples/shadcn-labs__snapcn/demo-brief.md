# shadcn-labs__snapcn · 演示脚本（v2）

## 这条片子要证明什么
snapcn 把「视频卡片」做成可复用组件：裁切式标题锁版、多机位叠放、瀑布式视频墙，全部由帧驱动，可直接嵌进短视频模板。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–7.0s | 裁切式标题锁版 CutLockup | 210 帧内巨型字标横向推进并裁切出画，背景为 snapcn 方格纸纹理 |
| 2 | 7.0–14.0s | 多机位叠放 PhoneStack | 3 台手机按 stagger=14 帧依次入场，叠加发光与背景流媒体画面 |
| 3 | 14.0–21.0s | 瀑布式视频墙 ReelWall | 4 块视频卡横向错位排布，各自独立播放 bg1/bg2 素材 |

## 中文标注（4–6 条，每条 3–5s）

- **0.8s +4.2s** ① 裁切式标题锁版 ｜ 入参 speed=0.5 控制推进速度，字标裁切出画面
- **5.1s +1.6s** ② 组件即参数 ｜ speed / stagger / 背景色全部由 props 驱动，无需改代码
- **7.4s +3.6s** ③ 多机位叠放 ｜ stagger=14 帧错峰入场，三台手机带同款状态栏细节
- **11.2s +2.2s** ④ 统一时间轴 ｜ 三段各 210 帧接在同一条 630 帧时间轴上播放
- **14.6s +3.8s** ⑤ 视频墙错位排布 ｜ 4 块视频卡独立播放素材，视觉上形成瀑布式滚动

## 管线与实测
- 生成方式：最小 Remotion 宿主 + @remotion/player + esbuild 单文件 bundle；Playwright 逐帧 seekTo 截图；ffmpeg 720p30 合成 3 段，drawtext 烧中文标注
- pipeline：fallback
- 渲染耗时：266282 ms
- 宿主 _host/src/demo.tsx：CutLockup(speed 0.5) / PhoneStack(stagger 14) / ReelWall 各 210 帧拼成 630 帧
- bundle 由 _host/build_bundle.mjs 一次产出，630 帧全部复用；esbuild 走 _tmp/mc_work 的已装副本
- 抓帧脚本 capture_player.py：逐帧 __seek + 2×rAF + screenshot，总耗时 266s

## 已知限制

- 整仓 pnpm 装不完整（落盘缺文件导致 ERR_MODULE_NOT_FOUND），改用最小 Remotion 宿主复用 registry 组件
- 示例自带的 bg1/bg2 是渐变测试素材，手机与卡片内看不到真实影片内容
- 抓帧改用 @remotion/player 逐帧 seek，避免 Remotion CLI bundler 在本机长时间阻塞
