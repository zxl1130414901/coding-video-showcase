# manim-physics v2 演示脚本

仓库：Matheart/manim-physics（给 manim 加物理：pymunk 刚体、库仑/磁场、摆、波）
旧样例：`sample_basic.mp4`（6.0s，只有一个自由落体小场景）

## 三段能力（1920x1080@30fps，22.8s）

| 段 | 时间 | 能力 | 证明什么 |
|---|---|---|---|
| 1 | 0–8.0s | pymunk 刚体碰撞 | 三体（圆/方/三角）+ 三面静态墙，碰撞、摩擦、旋转由物理引擎逐帧积分 240 帧 |
| 2 | 8.0–15.4s | 库仑电场向量场 | 3 个正负点电荷的箭头场按 1/r² 逐点计算，全场数百箭头 222 帧 |
| 3 | 15.4–22.8s | 多摆混沌 | 7 个摆长 1→5 的刚体摆 pymunk 耦合，非线性运动 |

## 为什么这样选
manim 本身负责「画得好看」，manim-physics 的差异点是「画面由物理方程驱动」：位置不是 keyframe，而是 `pymunk` 积分出的结果。因此每段都让引擎自己跑，不预烘焙轨迹。

- 段 1 展示碰撞/旋转/摩擦（SpaceScene + make_rigid_body / make_static_body）
- 段 2 展示标量场可视化（Charge + ElectricField，箭头逐点由库仑定律生成）
- 段 3 展示多体耦合（MultiPendulum/Pendulum + start_swinging，初始角度相同但摆长不同 → 混沌）

## 中文标注（6 条，底部两行）
见 `spec.json` 的 callouts：0.5/4.8/8.3/12.4/15.7/19.9 秒各一条，覆盖三段，含帧数（240/222/684）和 1/r² 等数字。

## 生成方式
`scene_v2.py` 里 3 个 Scene 各自 `python -m manim -qm` 输出 1080p30（config 在模块里覆盖为 1920×1080@30）；`build_sample.py` 顺序拼接并烧入中文标注。

## 已知限制
- 仓库源码版本 0.2.3 与安装版 0.4.0 / manim 0.19 有 API 漂移：`Lens+Ray` 折射段报 `IndexError`，`RadialWave(center=...)` 报 `unexpected keyword`，这两段被替换/剔除。
- 段 2 的电场箭头在 1080p 下较密，远看是纹理、近看是矢量场。
- 渲染为 CPU Cairo，22.8s 成片耗时约 1.5 分钟。
