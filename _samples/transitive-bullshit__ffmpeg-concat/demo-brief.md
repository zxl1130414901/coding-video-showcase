# transitive-bullshit__ffmpeg-concat · 演示脚本（v2）

## 这条片子要证明什么
证明它能把多段素材用 WebGL 着色器转场串起来：3 种 gl-transition（圆形开孔 / 方向扭曲 / 灰度渐变）各 1.2s，逐帧在 GPU 上合成而不是简单叠化。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–5.5s | 首段素材 + 帧初始化 | clip1 5.5s 720p30，165 帧 raw RGBA 抽帧 |
| 2 | 5.5–9.8s | circleopen 圆形开孔转场 | 1.2s GL 着色器转场，圆形遮罩扩张到全屏 |
| 3 | 9.8–14.1s | directionalwarp 方向扭曲转场 | 1.2s 扭曲位移过渡，支持自定义方向参数 |
| 4 | 14.1–18.4s | fadegrays 灰度渐变转场 + 音频拼接 | 1.2s 灰阶过渡，输出 18.4s / 720p30 并保留音轨 |

## 中文标注（4–6 条，每条 3–5s）

- **0.3s +3.4s** ① 4 段素材进 GL 合成管线 ｜ 每段 5.5s 720p30，先抽成 raw RGBA 帧，交给 GPU 逐帧处理
- **5.7s +3.4s** ② circleopen 圆形开孔 ｜ 1.2s gl-transition，圆形遮罩从中心扩张，非普通叠化
- **10.0s +3.4s** ③ directionalwarp 方向扭曲 ｜ 1.2s 扭曲位移过渡，参数化方向，画面像被推向一侧
- **14.3s +3.4s** ④ fadegrays 灰度过渡 + 音轨 ｜ 1.2s 灰阶过渡，成片 18.4s，音频随片段拼成一条轨

## 管线与实测
- 生成方式：ffmpeg-concat（fluent-ffmpeg + gl-transitions），4 段 720p30 片段，circleopen / directionalwarp / fadegrays 各 1200ms，GL 转场逐帧渲染后编码；ffmpeg drawtext 烧录中文标注
- pipeline：official
- 渲染耗时：676000 ms
- 命令：node20 run_fc.js（cwd=_samples\transitive-bullshit__ffmpeg-concat\_v2）
- transitions.json 为裸数组（对象形式会报 transitions 数量不匹配）

## 已知限制

- ffmpeg 7 的三位能力标志位导致 fluent-ffmpeg 误判 concat 格式不可用，样例脚本关闭了能力预校验
- raw RGBA 抽帧写入 F 盘约 2fps，4 段 720p 全流程约 11 分钟；1080p 会成倍变慢
- 180° 以上方向扭曲不支持，转场时长超过素材时长会截断
