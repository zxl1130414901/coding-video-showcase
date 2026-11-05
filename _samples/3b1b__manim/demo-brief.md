# 3b1b__manim · 演示脚本（v2）

## 这条片子要证明什么
证明 3b1b 的 ManimGL 能把公式/几何对象连续变形：彩色文本、Triangle→Square→Circle 的 Transform 链、坐标轴上的函数曲线与沿路径运动，以及相机取景框推拉。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–6.4s | 彩色 Text 布局 + 逐条入场 | 多行彩色标签依次 FadeIn，字体与颜色可分别指定 |
| 2 | 6.4–13.0s | Transform 链：三角→方→圆 | 同一对象连续两次 Transform，拓扑连续变形 |
| 3 | 13.0–19.6s | Axes + FunctionGraph + MoveAlongPath | 函数曲线 ShowCreation 后，圆点沿曲线运动 |
| 4 | 19.6–25.8s | 相机取景框推拉 | camera.frame 缩放/移动，画面构图实时变化 |

## 中文标注（4–6 条，每条 3–5s）

- **0.4s +4.0s** ① 彩色 Text 逐条入场 ｜ 多行彩色标签连续 FadeIn，颜色/字号可分别设置
- **6.8s +4.0s** ② Transform 链变形 ｜ 三角→方→圆连续变形，同一对象拓扑不变
- **13.4s +4.0s** ③ 坐标轴上的函数曲线 ｜ Axes + FunctionGraph 绘制曲线，圆点沿路径移动
- **19.8s +4.0s** ④ 相机取景框推拉 ｜ camera.frame 缩放 + 位移，构图实时变化

## 管线与实测
- 生成方式：ManimGL 1.7.2（OpenGL 实时渲染，独立 venv _env\pygl），self.camera.fps=30，-m 720p30 输出；ffmpeg drawtext 烧录中文标注
- pipeline：official
- 渲染耗时：132000 ms
- 命令：manimgl scene_v2.py ManimGLDemoV2 -m（独立 venv _env\pygl）
- 成片 25.8s 1280x720 30fps

## 已知限制

- ManimGL 在 1080p raw pipe 下报 OSError Errno 22，只能 720p
- OpenGL 渲染需要设置 self.camera.fps，否则默认 60fps
- ManimGL 用 ShowCreation，Manim CE 的 Create 不可用
