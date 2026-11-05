# manimgx 能力演示脚本（v2）

## 选型依据
manimgx 是 Manim 的 Rust/wgpu 重写版：同一套 Python 场景 API，但由 Rust 内核 + GPU 实时渲染，并自带 storyboard / 排版检查。真正的差距在三处：**完整 LaTeX 排版、三维曲面与深度着色、以及 60fps 级别的快速出片**。因此选三个仓库自带的代表作，各取一段。

## 三段演示
1. **0–11s｜LaTeX 级数 + 复平面几何（euler_identity.py）**
   右侧是完整的 `e^x = Σ x^n/n!` 级数公式，左侧复平面上逐项向量首尾相接，部分和逼近 `e^{it} = cos t + i sin t` 的圆弧。
   证明点：公式不是贴图，是由 LaTeX 排版；几何元素与公式同步演进。
2. **11–21s｜函数曲线与导数定义（derivative.py）**
   `f(x)` 曲线、切点与割线，下方是 `df/dx = (f(x+dx) - f(x))/dx` 的分数排版与实时数值（0.70、dx=0.012）。
   证明点：数值随动画变化并实时回填公式，适合讲解型内容。
3. **21–30s｜三维参数曲面与深度着色（clifford_torus.py）**
   Clifford torus 的四维旋转投影，曲面有内外两侧的分色、表面高光与参数曲线叠加，右上角同步显示 `X(u,v)` 与投影公式。
   证明点：真正的 3D 曲面渲染（含深度排序与光照），不是二维伪 3D。

## 渲染方式
`python -m manimgx render <example>.py -o <out>.mp4 -r 1280x720 --fps 30`，单进程、单 GPU 队列；三段由 poster.py 统一到 1080p30 并烧入中文标注。

## 已知限制
- 为控制单卡占用，本次统一 720p30 渲染（用例默认 1080p60）；render 耗时 euler 205s、torus 508s、derivative 复用既有 1080p60 成片。
- euler/derivative 复用已有渲染（derivative 为 60fps 原始成片）。
