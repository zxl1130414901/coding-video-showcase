# UnMolDeQuimica__manim-Chemistry · 演示脚本（v2）

## 这条片子要证明什么
证明它不是普通 Manim 换皮：能把 .mol 化学数据直接变成 2D 分子、图结构，并且原子是独立可寻址对象；最后用 Bohr 模型展示参数化原子动画。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–6.2s | .mol 文件 → 2D 分子结构 | 读取 morphine_2d.mol，Create 画出 23 个原子、27 条键的分子图 |
| 2 | 6.2–12.2s | 同一份化学数据 → 图结构 | GraphMolecule 复用同一 mol 文件，输出 23 节点 / 27 边图对象 |
| 3 | 12.2–19.2s | 原子级对象可寻址、可单独动画 | 逐个 Indicate 前 4 个原子后整体旋转 60° |
| 4 | 19.2–26.0s | Bohr 原子模型参数化 + 电子层旋转 | e=14 / p=14 / n=14 由参数生成，整体旋转 288° |

## 中文标注（4–6 条，每条 3–5s）

- **0.5s +4.0s** ① .mol 解析：23 原子 / 27 条键 ｜ 直接读 morphine_2d.mol，生成可编辑 2D 分子，不靠手写坐标
- **6.5s +4.0s** ② 同一份数据转成图结构 ｜ GraphMolecule 输出 23 节点 / 27 边，可直接做图算法演示
- **12.6s +4.0s** ③ 原子是独立可寻址对象 ｜ 前 4 个原子逐个 Indicate，再整体旋转 60°，证明可做原子级讲解
- **19.6s +4.2s** ④ Bohr 模型：14e / 14p / 14n ｜ 电子层与原子核由参数生成，整体旋转 288°，无需外部素材

## 管线与实测
- 生成方式：Manim CE 0.19 + manim-chemistry 插件，python -m manim -qh --fps 30 -r 1920,1080；Cairo 渲染 21 个动画，ffmpeg drawtext 烧录标注
- pipeline：official
- 渲染耗时：73000 ms
- 命令：python -m manim -qh --fps 30 -r 1920,1080 scene_v2.py ChemDemoV2
- 成片 26.0s，4 段，共 21 个动画；分子/图数据来自仓库 examples/molecule_files

## 已知限制

- 元素卡片 / 周期表组件内部使用 Tex，本机没有 LaTeX，未纳入演示
- 3D 分子需要 OpenGL 渲染器，本片用 2D 分子与 Bohr 模型替代
- Bohr 轨道是教学示意模型，不代表真实电子云
