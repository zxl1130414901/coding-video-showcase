# Remocn__remocn · 演示脚本（v2）

## 这条片子要证明什么
Remocn 是可直接复用的 Remotion 组件库：纯 CSS/SVG 的场景动画、spring 驱动的数据可视化、逐字符文字入场，都能在统一时间轴里按帧精确复现。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–7.0s | 纯 CSS/SVG 场景动画 | Synthwave 组件 210 帧：太阳条纹、地平线网格带透视平移，画面无位图素材 |
| 2 | 7.0–14.0s | spring 驱动的数据可视化 | AnimatedBarChart 组件：8 根柱按 spring 错峰生长，柱高与数值一一对应 |
| 3 | 14.0–21.0s | 逐字符文字入场 | BottomUpLetters 组件：opacity + translateY 逐字符错位入场，配贝塞尔缓动 |

## 中文标注（4–6 条，每条 3–5s）

- **0.8s +4.2s** ① 纯 CSS/SVG 场景 ｜ Synthwave：太阳条纹 + 透视网格，零位图素材按帧推进
- **5.1s +1.6s** ② 组件级复用 ｜ 注册表里的组件可直接嵌入任意 Remotion Composition
- **7.4s +3.6s** ③ spring 错峰生长 ｜ 8 根柱按不同延迟 spring，柱高对应真实数值
- **11.2s +2.2s** ④ 逐帧可复现 ｜ 每帧 seekTo 后截图，同一 frame 值必出同一画面
- **14.6s +3.6s** ⑤ 逐字符缓动入场 ｜ opacity + translateY 错位，贝塞尔缓动控制节奏

## 管线与实测
- 生成方式：@remotion/player + esbuild 单文件 bundle 复用；Playwright 打开 player.html，逐帧 seekTo 后截图；ffmpeg 720p30 合成 3 段，drawtext 烧中文标注
- pipeline：fallback
- 渲染耗时：136788 ms
- 宿主 _host/src/demo/Demo.tsx 把三组件拼成 630 帧（21s）Composition：Synthwave 0-210 / AnimatedBarChart 210-420 / BottomUpLetters 420-630
- bundle 由 _host/build_bundle.mjs（esbuild API）一次产出 1.49MB 的 player_bundle.js，后续 630 帧全部复用
- 抓帧脚本 _tmp/upgrade2/capture_player.py：逐帧 window.__seek(f) + 2×rAF + screenshot，耗时 136.8s

## 已知限制

- Remotion CLI 的 bundler 在本机极易阻塞，改用 @remotion/player + esbuild 预打包复用，抓帧绕开实时播放
- 组件以静态截图逐帧驱动，音轨为空轨（原组件也无音频）
