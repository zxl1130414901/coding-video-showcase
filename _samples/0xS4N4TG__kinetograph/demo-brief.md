# 0xS4N4TG__kinetograph · 演示脚本（v2）

## 这条片子要证明什么
Kinetograph 不走浏览器，用 Skia + Vulkan 原生合成：同一份 JSX 场景由 GPU 逐帧绘制，文本、图形、颜色补间都能确定性出帧。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–6.0s | 分层文字与补间 | 标题/副标题由 easing 补间上浮入场，黄色进度条 25→80 帧内从 2px 拉伸到 640px |
| 2 | 6.0–12.0s | spring 驱动图形动画 | 5 个圆角矩形按 10 帧间隔 spring 错峰弹入，各自独立旋转 0→180 度 |
| 3 | 12.0–18.0s | 颜色补间与伪相机轨道 | 背景在 0/90/180 帧完成三段 interpolateColors，圆按正弦轨道绕行 1.4π 且半径 60→120 |

## 中文标注（4–6 条，每条 3–5s）

- **0.7s +4.2s** ① 声明式分层排版 ｜ 标题/副标题/进度条同场景内分层，坐标即像素
- **4.9s +1.4s** ② 原生 GPU 渲染 ｜ Skia + Vulkan 直出 720p30，不启动浏览器
- **6.5s +3.2s** ③ spring 错峰弹入 ｜ damping 12 / stiffness 120，五个图形相位各差 10 帧
- **9.6s +2.4s** ④ 逐帧旋转 ｜ 每个矩形 rotation 由 interpolate 独立驱动，节奏可对齐
- **12.4s +3.6s** ⑤ 颜色补间 + 轨道 ｜ interpolateColors 三段渐变，圆形沿轨道绕行同时变大
- **16.2s +1.8s** ⑥ 18 秒三幕一次出片 ｜ 3×180 帧渲染仅 17.2s，Vulkan + NVENC 全 GPU 链路

## 管线与实测
- 生成方式：kinetograph CLI 原生渲染（Skia + Vulkan GPU，h264_nvenc 编码）：3 个 Composition 各 180 帧 1280x720/30fps，--concurrency 1，ffmpeg concat 后 drawtext 烧中文标注
- pipeline：native
- 渲染耗时：17241 ms
- 场景源码 proj/src/scenes_v2/Scenes.tsx：LayeredType / SpringShapes / ColorCamera 各 180 帧
- 渲染命令：kinetograph render src/index.tsx -o _v2/seg_x.mp4 --comp X --range 0..=179 --concurrency 1 --encoder h264_nvenc
- 三段 concat 后总时长 18.00s（540 帧），渲染耗时 17.2s

## 已知限制

- 上一轮单帧极慢是因为 cargo 全量编译争抢 CPU；本轮编译结束后同样场景 180 帧仅 1-5s
- 场景内所有子元素需显式 layoutItem={{position:'absolute'}}，否则会被按流式布局依次叠加
- 文本 x/y 为左上角坐标，居中需用 maxWidth=1280 + align=center
