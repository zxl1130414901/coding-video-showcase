# motion-canvas__motion-canvas · 演示脚本（v2）

## 这条片子要证明什么
用三段自建场景证明 motion-canvas 的声明式时间轴：文本/图形 tween、signal 错峰动画、Line 矢量绘制与视图缩放；矩形、圆形节点都能被合成进成片。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–6.3s | 文本与图形缓动 | Txt 位移/透明度 tween，Circle 与 Rect 同步入场，缓动曲线 easeInOutCubic |
| 2 | 6.3–12.0s | signal + 错峰动画 | 9 个 Rect 由 sequence(0.08) 依次 scale/opacity 入场，再整体 ±90° 旋转 |
| 3 | 12.0–19.0s | Line 矢量绘制 + 视图缩放 | Line.end 0→1 逐段绘制，dot 淡入，view.scale 1→1.16 推镜 |

## 中文标注（4–6 条，每条 3–5s）

- **0.8s +4.4s** ① 声明式时间轴 ｜ makeScene2D 生成器逐帧 yield，Txt/Circle/Rect 同步 tween
- **6.5s +4.4s** ② signal 错峰入场 ｜ sequence(0.08s) 驱动 9 个矩形依次放大，opacity 0→1
- **12.2s +3.8s** ③ Line 逐段绘制 ｜ end 0→1 的矢量描边，顶点先画出折线，再补圆点
- **16.2s +2.6s** ④ 视图缩放收尾 ｜ view.scale 1→1.16 + 整体淡出，19.0s 成片

## 管线与实测
- 生成方式：自建 harness：复制仓库 2D 运行时，vite 构建 index.html，Chrome 逐帧驱动 scene playback 并截图；ffmpeg 30fps 合成 1280x720，再 drawtext 烧录中文标注
- pipeline：fallback
- 渲染耗时：0 ms
- 复制 src/scenes 到 _tmp/mc_work，新增 scenes_v2.ts 与 main_v2.ts，vite build 后 Chrome 逐帧截 570 帧
- 场景 2 的说明文字移到 y=-335，9 宫格下移 20px，避免文字与首行矩形重叠
- 字体：场景内用 Microsoft YaHei（系统字体），标注条用 msyh.ttc（F:\coding视频\_env\fonts）

## 已知限制

- 上一版矩形/圆形节点未合成的问题已在本次重渲修复：几何节点在 3 段均可见（非仅文本/Line）
- 没有用官方播放器；自建 harness 直接驱动 scene playback，因此不含编辑器 UI 与转场特效
- 逐帧截图走 Chrome headless（--disable-gpu），渲染约 10 分钟，非仓库自带 CLI
