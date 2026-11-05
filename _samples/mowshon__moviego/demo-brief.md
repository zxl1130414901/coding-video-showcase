# mowshon__moviego · 演示脚本（v2）

## 这条片子要证明什么
证明 Go 也能写视频剪辑代码：同一份 API 里做动态文字叠层、关键帧画中画、字幕与调色，并用 Sequence 做交叉淡入 / 左擦除转场。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–8.0s | AnimatedText 打字机动画 + 图层叠放 | 标题以 typewriter 动画 2s 入场，Layer(10) 叠在淡入底片上 |
| 2 | 8.0–16.8s | 关键帧画中画（PropScale 1.00→1.18） | 第二段素材 ResizeTo(860x484) 定位到右上角，7s 内平滑放大 18% |
| 3 | 16.8–25.0s | 调色 + SRT 字幕烧入 + 转场编排 | Brightness/Contrast/Saturation 三段调色，SubtitlesSRT 烧入 3 条字幕，Crossfade 0.8s / WipeLeft 0.8s 串联 |

## 中文标注（4–6 条，每条 3–5s）

- **0.5s +4.0s** ① AnimatedText 打字机入场 ｜ 2 秒 typewriter 动画逐字打出标题，图层号 10 直压底片
- **8.6s +4.0s** ② 画中画 + 关键帧缩放 ｜ 第二段素材缩到 860×484 定在右上角，7s 内 PropScale 1.00→1.18
- **17.2s +4.0s** ③ 调色链 + SRT 字幕 ｜ 亮度 +0.04 / 对比 1.12 / 饱和 1.15，3 条 SRT 字幕直接烧进画面
- **21.5s +4.0s** ④ Sequence 转场编排 ｜ Crossfade 0.8s 与 WipeLeft 0.8s 串联三段，成片 25.0s

## 管线与实测
- 生成方式：Go 1.25 + moviego v2（本地 replace 仓库源码），ffmpeg lavfi 生成渐变底片，AnimatedText 打字机 + 图层合成 + SRT 字幕，WriteVideo 导出 1920x1080/30fps；ffmpeg drawtext 烧录中文标注
- pipeline：official
- 渲染耗时：48000 ms
- 命令：go build -o test_build.exe . 后运行（cwd=_v2，素材为 ffmpeg lavfi 生成的渐变底片）
- 素材：bg_a/b/c.mp4 各 8.5s 1920x1080/30fps + 正弦音轨；captions.srt 3 条字幕

## 已知限制

- moviego 依赖本机 ffmpeg，Windows 上需要先进入 PATH 才能导出
- 视频编码走 ffmpeg 管道，1080p 长片导出耗时与磁盘写入速度正相关
- SRT 字幕为英文素材，中文字幕需自备字体与 SRT
