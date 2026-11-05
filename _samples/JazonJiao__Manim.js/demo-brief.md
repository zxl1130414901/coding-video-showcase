# JazonJiao__Manim.js · 演示脚本（v2）

## 这条片子要证明什么
证明它用 p5.js + 自研 Timer/MObject 类把数学与算法过程写成逐帧脚本：Kruskal 最小生成树的并查集过程、线性回归的坐标轴+散点+KaTeX 公式、LLM 的 DPO 概念动画，三页各 10 秒连续演示。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–10.0s | 算法过程动画：Kruskal + UNION-FIND | 12 节点 / 23 条带权边全部由 Timer 逐帧生成，右侧并查集集合 {0..11} 同步合并 |
| 2 | 10.0–20.0s | 坐标轴 / 散点 / KaTeX 公式排版 | 8 个黄色数据点 + 箭头坐标轴，公式 $\hat y = \hat\beta x + \hat\beta_0$ 由 KaTeX 渲染 |
| 3 | 20.0–30.0s | 概念类动画：DPO 大标题与图形讲解 | LLM Explained/DPO 页面按帧推进，含自研 figures 图形库绘制 |

## 中文标注（4–6 条，每条 3–5s）

- **0.4s +4.0s** ① 算法过程逐帧演算 ｜ Kruskal：12 节点 / 23 条带权边，边按权重排序后依次尝试合并
- **5.0s +4.0s** ② Timer 类控制缓动节奏 ｜ Timer0 匀速 / Timer1 减速 / Timer2 加速，统一折算成帧数
- **10.4s +4.0s** ③ 坐标轴 + 散点 + KaTeX 公式 ｜ p5.js 画坐标轴与 8 个数据点，KaTeX 渲染回归方程
- **20.4s +4.0s** ④ 概念动画复用同一套帧循环 ｜ LLM/DPO 页面用同样的 setup/draw 结构，换脚本即换主题
- **25.5s +4.0s** ⑤ 自动录制成片 ｜ Playwright 逐页录制 webm → ffmpeg 转 1920×1080/30fps，三段拼接 30s

## 管线与实测
- 生成方式：Playwright（系统 Chrome headless）录制仓库自带 p5.js 示例页面：graph.html / Linear Regression idea 1 / dpo.html 各 10s，1920x1080@30fps，三段 concat；ffmpeg drawtext 烧录中文标注
- pipeline：wrapper
- 渲染耗时：210000 ms
- 命令：python _tmp\upgrade2\driver_manimjs.py（内部起 5302 端口 http 服务 + Playwright 录制）
- 三段各录 11s 再裁 1.2s 头部、取 10s，保证每段都是干净画面
- 页面顺序：Graph Algorithms/graph.html → Linear Regression/part_1.html → LLM Explained/DPO/dpo.html

## 已知限制

- 仓库本身没有导出器，成片需要浏览器逐页录制再转码（wrapper 管线）
- 示例 canvas 固定 1200×675，放大到 1080p 后文字边缘略软
- 页面依赖 lib/font/times.ttf 的 XHR 加载，file:// 下会被 CORS 拦截，必须起本地 http 服务
