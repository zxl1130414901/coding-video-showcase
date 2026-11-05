# ManimCommunity/manim 能力演示脚本（sample v2）

## 设计目标
旧样例是 `SquareToCircle`（3 秒，hello world 级）。新样例要回答「Manim 凭什么成为数学动画的事实标准」，因此选 3 项最能拉开差距的能力，30 秒顺序拼接：

| 分段 | 时间 | 能力 | 为什么选它 |
|---|---|---|---|
| 1 | 0–8.8s | MarkupText 富文本排版 + 形状级变换 | Manim 的排版引擎（Pango 上下标/颜色）+ `TransformMatchingShapes` 逐字符插值，是手写 Canvas 很难复刻的 |
| 2 | 8.8–19.1s | 3D 曲面建模 + 相机运镜 | `ThreeDAxes` + `Surface` 参数曲面 + 环境相机旋转，证明它不止 2D 平面动画 |
| 3 | 19.1–29.7s | ValueTracker 数据驱动实时求导 | `always_redraw` 每帧重算切线/斜率，展示声明式 updater 体系 |

## 实现
- 场景文件：`F:\coding视频\_tmp\demo_pipeline\src\ManimCommunity__manim\manim_capabilities.py`
- 渲染命令：`python -m manim -qh --media_dir <tmp> manim_capabilities.py ManimCapabilities`
- 后期：`poster.py` 归一化 1920×1080/30fps、硬切拼接、底部中文能力标注。

## 取舍与限制
- 本机没有安装任何 TeX 发行版（无 latex / dvisvgm），`MathTex` 会直接 `FileNotFoundError`。
  因此第 1 段用 `MarkupText`（Pango 富文本，支持 `<sup>` 上下标）呈现公式排版，而不是 LaTeX。
  这是本机环境限制，不是 Manim 的能力上限；README 中的 `MathTex` 示例需要 TeX 才能跑。
- 3D 段使用 28×28 网格曲面，兼顾 8GB 显存与渲染时间。
- 成片为 30fps（引擎按 60fps 渲染后归一化），没有做补帧。
