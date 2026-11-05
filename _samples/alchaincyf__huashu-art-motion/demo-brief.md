# alchaincyf__huashu-art-motion · 演示脚本（v2）

## 这条片子要证明什么
huashu-art-motion 是「语法驱动」的科普动画引擎：一份 JSON 写清 grammar、cues、主题，渲染器就按时间轴逐帧出片。v2 用三种 grammar 证明它不只是数学动画，而是可复用的版式系统。

## 分段设计

| # | 时间 | grammar | 能力 | 实测证据 |
|---|---|---|---|---|
| 1 | 0.00–8.13s | t1_3b1b | 数学讲解版式 | 损失曲线、公式 token、结论按 cue 依次入场 |
| 2 | 8.13–15.07s | t3_finance_chart | 数据图表版式 | 5 根柱逐条生长，4.4s 高亮「7.8 倍」 |
| 3 | 15.07–22.50s | y5_kinetic_type | 动态文字版式 | 数字滚到 3000、对比文案、关键词高亮 |

## 中文标注（6 条，每条 2.7–4.2s）

- **0.3s +4.0s** ① 数学讲解语法 ｜ t1_3b1b 版式：曲线、公式、结论按 cue 依次入场
- **5.0s +3.0s** ② 时长精确到帧 ｜ 帧数 = 8.2s × 30fps = 246，不多不少
- **8.2s +4.0s** ③ 数据图表语法 ｜ 5 根柱逐条生长，4.4s 高亮 7.8 倍
- **12.6s +3.0s** ④ 主题换肤 ｜ ink→paper→poster，配色与底纹随 JSON 切换
- **15.4s +4.2s** ⑤ 动态文字语法 ｜ 数字滚动 3000、两段对比文案、关键词高亮
- **20.0s +2.7s** ⑥ 一份 JSON 出片 ｜ grammar + cues 决定版式与节拍，不用写页面

## 管线与实测
- 渲染：`scripts/engine/render.py --spec`，分别渲 t1_3b1b(8.2s) / t3_finance_chart(7s) / y5_kinetic_type(7.5s)
- 规格：1920×1080@30fps，本地 HTTP 服务 + Playwright 逐帧
- 拼接：ffmpeg concat + drawtext 烧中文标注，成片 22.5s
- 渲染耗时：约 105000 ms
- 基础小样：sample_basic.mp4（1280×720，9.97s，t1_3b1b）

## 已知限制

- 三个片段都来自官方 examples，未自写新 grammar；只调整 duration 以适配分段
- 画风偏欧美科普，中文排版依赖示例自带字体回退，字形粗细不如英文稳定
- 需要 Python + Playwright + FFmpeg 三件套，渲染时起本地 HTTP 服务
