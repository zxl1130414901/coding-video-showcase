# motion-skills v2 演示脚本

仓库：iart-ai/motion-skills（56 个动效技能包 + 逐帧渲染/自检工具链）
旧样例：`sample_basic.mp4`（6.0s / 1280x720 / 180 帧，仅一段简单标题动画）

## 为什么不用旧 demo
旧样例只演示了「GSAP 能跑」，看不出这个项目的真正差异点：**时间线可以被逐帧精确 seek（frame-accurate），因此同一时间轴既能实时预览又能离线确定性出片**，还有技能包里强调的缓动/遮罩/分层编排。

## 三段能力（每段 8s，共 24s，1920x1080@30fps）

| 段 | 时间 | 能力 | 证明什么 | 画面 |
|---|---|---|---|---|
| 1 | 0–8s | 逐字编排 + 遮罩揭示 | `stagger 0.09s` 8 个字符依次入场，`rule1` 用 `scaleX` 遮罩从 0→1 揭示；单个 `tl` 对象串起 8 条独立 tween | 巨大 MOTION 字逐字从下方升起、去模糊、下划线展开 |
| 2 | 8–16s | 六种缓动的物理差异 | 同一 3.4s 时间窗、同一终点 x=1160，六条轨道分别用 `power1/power4/back(2.2)/elastic(1,0.35)/bounce/steps(8)`，同屏可对比「缓动不是装饰，是可计算的运动曲线」 | 6 行跑道，彩点以不同节奏冲线 |
| 3 | 16–24s | 多图层视差 + 进度条编排 | 背景光斑 sine.inOut 8s 长周期漂移、两张卡片 rotateX 透视入场、FRAME 用 `xPercent` 遮罩揭示、进度条 4.2s 线性填充 | 卡片/大字/光斑/进度条四层同时运动 |

## 中文标注（5 条，底部黑条两行）
1. t=0.5 dur=4.2 ——「逐帧确定时间轴」/ 同一 tl 对象可被 `globalTimeline.time(t)` 精确 seek，720 帧无漂移
2. t=5.0 dur=4.0 ——「逐字 stagger 编排」/ 8 字符 stagger 0.09s + 遮罩 scaleX 0→1
3. t=8.6 dur=4.2 ——「六种缓动同屏对比」/ 3.4s 同一时间窗，power/back/elastic/bounce/steps
4. t=16.4 dur=4.0 ——「多层视差 + 遮罩揭示」/ 光斑 8s sine 漂移、卡片 rotateX、文字 xPercent 遮罩
5. t=21.0 dur=3.6 ——「交付自检闭环」/ 先渲染帧再截图核验，6.0s→24.0s 成片 720 帧一次通过

## 生成方式
`capture.mjs`（改写自仓库 `tools/showcase-to-gif.mjs`）：Playwright 打开 `demo_v2.html`，把 `gsap.globalTimeline` 暂停后按 `t=i/30` 逐帧 seek → 1920x1080 PNG → ffmpeg h264_nvenc 编码；再按 0–8/8–16/16–24 切 3 段，用 `build_sample.py` 拼接并烧入中文标注。

## 已知限制
- Playwright 逐帧 round-trip 是瓶颈：1920x1080 每帧约 0.6–0.9s，24s 成片需 10 分钟量级。
- 所有动画都靠 CSS transform/opacity，不涉及 WebGL，因此验证的是「时间线精度」而非 GPU 渲染能力。
- demo 页面为自建（仓库本身是技能包，没有官方可渲染 demo），刻意使用仓库技能包中最常出现的 GSAP 编排手法。
