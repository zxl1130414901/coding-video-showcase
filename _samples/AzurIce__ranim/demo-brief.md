# AzurIce__ranim · 演示脚本（v2）

## 这条片子要证明什么
Ranim 是 Rust 版的 Manim：用 VItem 组合 morph、write/unwrite，用 Typst 排版文字，用 3D 相机做轨道运动，全部走 wgpu/Vulkan 原生渲染。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–5.0s | 形状 morph 与书写动画 | hello_ranim 300 帧：方块 smooth morph 成红色圆，再 write/unwrite/fade_out 收尾，渲染 36.6s |
| 2 | 5.0–13.0s | Typst 排版文本 | text_item 1081 帧：Typst 直接排版英文长句并随时间展开，渲染 6.7s |
| 3 | 13.0–21.0s | 3D 相机与轨道运动 | solar_system 720 帧：8 条行星轨道同心排布，土星/木星等带标签公转，渲染 4.6s |

## 中文标注（4–6 条，每条 3–5s）

- **0.6s +4.0s** ① 形状 morph ｜ 方块按 smooth 缓动变形为圆，轮廓点一一对应
- **4.4s +2.2s** ② 书写 / 擦除 ｜ write / unwrite 逐段描边，是 Manim 系经典手法
- **5.6s +3.6s** ③ Typst 排版直接进场 ｜ 文本由 Typst 引擎排版，非手写坐标
- **9.4s +3.0s** ④ 原生 wgpu 渲染 ｜ 1920x1080@60fps 直出，再降到 720p30 交付
- **13.6s +3.4s** ⑤ 3D 相机轨道 ｜ 八条轨道在同一相机空间内，行星按周期公转
- **17.4s +3.2s** ⑥ 21 秒三场景 ｜ 总渲染 79.1s（编译 46m42s 复用 cargo target 增量完成）

## 管线与实测
- 生成方式：ranim 原生 CLI（Rust + wgpu/Vulkan，RTX 4060）：hello_ranim / text_item / solar_system 三个场景各以 1920x1080@60fps 渲染，ffmpeg 降到 1280x720@30fps 拼三段，drawtext 烧中文标注
- pipeline：native
- 渲染耗时：79124 ms
- 构建：CARGO_TARGET_DIR=F:\coding视频\_env\cargo-target，cargo build --offline --example text_item --example solar_system --features "anims render typst"
- 渲染：hello_ranim.exe / text_item.exe / solar_system.exe 各执行 render <scene>，耗时 36.6s / 6.7s / 4.6s
- ffmpeg 将三段按 8s 截取（hello 全段 5s）后 concat，总 21.0s / 630 帧 / 1280x720@30fps

## 已知限制

- 整仓首次编译 902 crate 需 6596s；本轮复用 F 盘 CARGO_TARGET_DIR 增量补齐示例，仍耗时 46m42s（含 ranim 库重编）
- 示例 #[output] 固定 1920x1080@60fps，交付时统一降到 1280x720@30fps
- hello_ranim 场景本身只有 5s，短于 6s 指标，故三段为 5s + 8s + 8s
