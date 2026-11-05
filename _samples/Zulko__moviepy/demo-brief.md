# Zulko__moviepy · 演示脚本（v2）

## 这条片子要证明什么
证明 MoviePy 不只是拼图片：同一份 Python 时间线上做子片段裁剪 + 变速、图层与画中画、交叉淡化转场与调色、圆形蒙版 + 黑白滤镜，并用 numpy 合成音轨。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–7.0s | subclipped 裁剪 + with_speed_scaled 变速 + 交叉淡入 | 3.6s 片段 1.6× 加速后重复 4 次补满 7s，CrossFadeIn 0.8s 入场 |
| 2 | 7.0–14.0s | 多层合成 + 画中画 + 定时出现 | 底片 MultiplyColor 0.55 压暗，画中画 0.38 倍定位 (820,70)，第 3.6s 标题贴片 |
| 3 | 14.0–21.0s | CrossFadeIn 转场 + 调色 | 两条同源片段 MultiplyColor 0.75/1.15，1.6s 交叉淡化叠化 |
| 4 | 21.0–28.0s | 圆形蒙版 + 黑白滤镜 + numpy 正弦音轨 | 560px 圆形遮罩按 sin/cos 轨迹移动，BlackAndWhite + LumContrast，220/440Hz 混音 |

## 中文标注（4–6 条，每条 3–5s）

- **0.5s +4.0s** ① subclipped + 1.6× 变速 ｜ 3.6s 片段加速到 2.25s，重复 4 次补满 7s，再叠 0.8s 交叉淡入
- **7.6s +4.0s** ② 图层 + 画中画 ｜ 底片压暗到 0.55，画中画缩到 0.38 倍固定在右上角，3.6s 后出现标题贴片
- **14.6s +4.0s** ③ 交叉淡化 + 双路调色 ｜ 0.75 / 1.15 两种调色叠加，1.6s CrossFadeIn 形成叠化转场
- **21.6s +4.2s** ④ 圆形蒙版 + 黑白 + numpy 音轨 ｜ 560px 圆形 mask 走 sin/cos 轨迹，220+440Hz 正弦音轨由 numpy 现场合成

## 管线与实测
- 生成方式：MoviePy 2.2（v2 API），Python 脚本 4 段 ×7s，numpy 生成音轨，write_videofile 1280x720/30fps；ffmpeg drawtext 烧录中文标注
- pipeline：official
- 渲染耗时：168000 ms
- 命令：python render_v2.py（cwd=_samples\Zulko__moviepy\_v2）
- 素材：仓库 media/doc_medias/example.mp4，渐变底/标题/圆形蒙版由 PIL 现场生成

## 已知限制

- 1080p 编码在本机曾出现 BrokenPipeError，本次按 1280x720 稳定出片
- 标题贴片用 PIL 预渲染 PNG，不是 MoviePy 原生 TextClip（原生需要 ImageMagick）
- 合成全部在 CPU，4 段 28s 渲染约 168s
