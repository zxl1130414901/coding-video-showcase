# wx4766/html-to-video 能力演示脚本（sample v2）

## 设计目标
旧样例是 `docs/demo-hero.html` 的 6 秒首屏动画。新样例改成一个 24 秒、三幕的原生 Canvas 片子，专门证明「HTML 转视频」的四项差异能力：

| 分段 | 时间 | 能力 | 证明点 |
|---|---|---|---|
| 1 | 0–8s | 纯 HTML/Canvas 排版动画 | 零框架，Canvas 2D 直接绘制；`expoOut`/`inOut` 缓动曲线同步可视化 |
| 2 | 8–16s | 数据驱动的图表动画 | 柱状 78? 逐帧生长、折线按 t 推进，坐标全部由时间函数推导 |
| 3 | 16–24s | 确定性 seek 与逐帧合成 | 三层刻度盘按 t 旋转、扫描线 + 帧号 HUD，证明「同一 t 永远同一帧」 |

## 实现
- 动画文件：`_tmp/demo_pipeline/src/wx4766__html-to-video/demo-capabilities.html`
- 渲染：`node scripts/render-video-seek.js ... --duration=24 --fps=30 --width=1920 --height=1080 --concurrency=1`
  （Playwright 冻结时钟逐帧 seek + ffmpeg 编码，CPU 合成，不依赖 GPU）
- 后期：`poster.py` 烧入 6 条中文能力标注。

## 取舍与限制
- 只有 16:9 一种比例；仓库支持的 `--presets=douyin,xiaohongshu,square` 多比例出片未在成片中演示。
- 片中没有混入音轨，因为该仓库的音频是可选参数，本次重点验证逐帧确定性。
- 旧 `demo-hero` 成片保留为 `sample_basic.mp4`。
