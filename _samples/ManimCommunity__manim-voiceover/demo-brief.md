# ManimCommunity__manim-voiceover · 演示脚本（v2）

## 这条片子要证明什么
证明动画时钟可以由旁白驱动：tracker.duration 决定每段动画时长，离线 SAPI 合成语音，四段共享同一条旁白时间线并记录字幕区间。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–6.5s | 旁白时长驱动绘制 | Create(circle) 的 run_time 直接取 tracker.duration |
| 2 | 6.5–12.5s | 旁白时长驱动位移 | circle.animate.shift 关键帧由句子时长决定 |
| 3 | 12.5–18.5s | 旁白时长驱动形变 | Transform(circle→square) 与语音同步，字幕区间自动记录 |
| 4 | 18.5–29.6s | 四段共用一条旁白时间轴 + 收尾 | 第四段同时 Write 注释与 FadeOut，总时长 29.6s |

## 中文标注（4–6 条，每条 3–5s）

- **0.4s +4.0s** ① 旁白时长 = 动画时长 ｜ tracker.duration 直接喂给 Create(circle) 的 run_time
- **6.8s +4.0s** ② 位移关键帧由语音决定 ｜ circle.animate.shift 跟随句子时长，不需要手调秒数
- **12.8s +4.0s** ③ 形变与语音同步 ｜ Transform 圆→方，字幕区间在语音结束时自动截断
- **19.0s +4.0s** ④ 四段共享一条旁白轴 ｜ 11 个动画全部由同一时间线调度，成片 29.6s

## 管线与实测
- 生成方式：manim-voiceover + PyTTSX3（Windows SAPI 子进程），python -m manim -qh --fps 30 -r 1920,1080，语音时长驱动 11 个动画；ffmpeg drawtext 烧录中文标注
- pipeline：official
- 渲染耗时：96000 ms
- 命令：python -m manim -qh --fps 30 -r 1920,1080 scene_v2.py VoiceoverDemoV2
- 语音由 Windows SAPI 离线合成，无需 API Key

## 已知限制

- PyTTSX3 在本机写的是 WAV，插件按 mp3 命名，需在样例脚本里转码修复
- 同进程第二次 runAndWait 会死锁，必须用子进程跑 SAPI
- 语音是英文机器人音（Windows SAPI），无中文发声
