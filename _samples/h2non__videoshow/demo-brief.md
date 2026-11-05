# H2non__videoshow · 演示脚本（v2）

## 这条片子要证明什么
证明这个库能把图片序列变成可交付的幻灯片视频：淡入淡出转场与单图停留可控、音轨 + SRT 字幕直接烧入、以及 ASS 字幕样式通道。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–8.0s | 5 张图 + 淡入淡出转场 + 单图时长控制 | loop=1.6s，transitionDuration=0.6s，5 图合成 8.0s |
| 2 | 8.0–15.8s | 音轨 + SRT 字幕烧入 | loop=2.6s，3 图 + song.mp3 + subtitles.srt（useSubRipSubtitles） |
| 3 | 15.8–23.6s | ASS 字幕通道 + 更长停留 | subtitles.ass 直接交给 ffmpeg，3 图合成 7.8s |

## 中文标注（4–6 条，每条 3–5s）

- **0.5s +4.0s** ① 5 图 + 0.6s 淡入淡出 ｜ 单图停留 1.6s，5 张 fixture 合成 8.0s 幻灯片
- **8.6s +4.0s** ② 音轨 + SRT 字幕 ｜ song.mp3 作音轨，subtitles.srt 直接烧进画面，3 图 ×2.6s
- **16.4s +4.0s** ③ ASS 字幕通道 ｜ 换成 .ass 字幕文件，样式由字幕自身携带，不需要改代码
- **20.5s +4.0s** ④ 3 段 concat 拼接 ｜ 三段分别编码后 ffmpeg concat 无缝拼接，成片 23.6s

## 管线与实测
- 生成方式：videoshow（Node/fluent-ffmpeg），3 段各自渲染（5 图转场 / SRT 字幕+音频 / ASS 字幕），ffmpeg concat 拼接，1280x720/30fps；ffmpeg drawtext 烧录中文标注
- pipeline：official
- 渲染耗时：24000 ms
- 命令：node render_v2.js（cwd=_samples\H2non__videoshow\_v2）
- 素材：仓库 test/fixtures 的 step_1..5.png / song.mp3 / subtitles.srt / subtitles.ass

## 已知限制

- ffmpeg 7 的三位能力标志位导致 fluent-ffmpeg 2.1.2 误判 mp4 不可用，样例脚本关闭了能力预校验
- logo 叠加在本机 ffmpeg 7 下报 Invalid argument，未纳入成片
- 输入图片是 562×562 正方形 fixture，1280x720 下有留白
