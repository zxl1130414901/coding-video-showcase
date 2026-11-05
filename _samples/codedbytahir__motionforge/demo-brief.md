# codedbytahir__motionforge · 演示脚本（v2）

## 这条片子要证明什么
证明它把 Remotion 风格的 React 组件变成可逐帧导出的视频：FrameContext 提供确定性帧号，Sequence 切分时间轴，组件库自带 KineticTypography / TextStack3D / LiquidText 三类动态文字效果。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–7.5s | KineticTypography（velocity 模式）逐字速度感入场 | 同一组件由 frame 驱动的字形位移/缩放，无需手写关键帧 |
| 2 | 7.5–15.0s | TextStack3D 六层 3D 文字堆叠 | layers=6、depth=28，6 份副本文本沿 Z 轴错位合成厚度 |
| 3 | 15.0–22.5s | LiquidText 液态描边文字 | fill/stroke 双色 + 液态形变，宽 1400 高 340 的容器内自适应 |
| 4 | 22.5–30.0s | Sequence 时间轴编排 + stretching 模式收尾 | 4 个 Sequence 各 225 帧（7.5s）无缝衔接，总 900 帧 30fps |

## 中文标注（4–6 条，每条 3–5s）

- **0.4s +4.0s** ① React 组件即画面 ｜ FrameContext 注入 frame/fps/durationInFrames，组件按帧渲染
- **7.6s +4.0s** ② TextStack3D 六层堆叠 ｜ layers=6 / depth=28：6 份副本沿 Z 轴错位，做出厚度感
- **15.2s +4.0s** ③ LiquidText 液态描边 ｜ 填充 + 描边双色，容器 1400×340 内自适应形变
- **22.8s +4.0s** ④ Sequence 把时间轴切成 4 段 ｜ 每段 225 帧（7.5s），900 帧合计 30s 确定性导出
- **26.8s +3.4s** ⑤ 逐帧截图 → ffmpeg 合成 ｜ Playwright 900 帧截图，1920×1080@30fps 约 180KB 成片

## 管线与实测
- 生成方式：React + FrameContext 逐帧 seek 渲染（vite build 静态包 → Playwright 系统 Chrome 逐帧截图 900 帧）→ ffmpeg 30fps 合成，1920x1080；ffmpeg drawtext 烧录中文标注
- pipeline：wrapper
- 渲染耗时：240000 ms
- 命令：python _tmp\upgrade2\driver_mf.py（http 服务 dist_v2 + Playwright 截图 900 帧）
- harness 在 _tmp\mf_work2，通过 vite alias @mf 指向仓库 src/lib/remotion，不改仓库源码
- main.tsx 增加 ?render=1 渲染模式，暴露 window.__seek(f) 与 window.__ready

## 已知限制

- 仓库无内置导出器，成片靠 Playwright 逐帧截图再合成（wrapper 管线）
- 组件依赖 FrameContext，脱离 Player 需自行注入上下文，否则帧号为空
- 首版布局把 4 个 Sequence 当 flex 子元素排在左上角，需为每段套 AbsoluteFill 才居中
