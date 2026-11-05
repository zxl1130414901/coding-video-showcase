# yongkyuns__noon · 演示脚本（v2）

## 这条片子要证明什么
Noon 是 Python 驱动的程序化矢量动画库：一条函数、一组采样点、四个控制点，都能直接写成可动画的矢量路径。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–6.5s | 基础图形创建与循环动画 | Your first scene：圆与方块 create 入场后按周期循环位移，录制 109 帧 / 16.67fps |
| 2 | 6.5–13.0s | 函数绘制与采样点对比 | Functions and samples：平滑函数曲线 + 折线采样点双图层对比，108 帧连续录 |
| 3 | 13.0–19.5s | 矢量曲线与贝塞尔构造 | Bend a vector curve：四个控制点生成一条 S 形矢量路径，端点带控制圆点 |

## 中文标注（4–6 条，每条 3–5s）

- **0.7s +4.0s** ① Python 即场景 ｜ playground 里直接写 Python，Pyodide 编译后实时出图
- **4.9s +1.4s** ② 实机运行，非离线渲染 ｜ 真实 WebGL2 画面按 16.67fps 录下，再转 30fps
- **6.9s +3.2s** ③ 函数与采样点双图层 ｜ 同一条函数既画平滑曲线，也画折线采样做对照
- **10.4s +2.2s** ④ 数学直接成图 ｜ 坐标轴、刻度、箭头全部由库内几何原语构成
- **13.6s +3.4s** ⑤ 四控制点成曲线 ｜ 四点生成一条矢量路径，端点圆点标注控制位置
- **17.2s +1.8s** ⑥ 19.5 秒三段实拍 ｜ 3 个示例各录 6.5s，总耗时 181s（含 Pyodide 重编译）

## 管线与实测
- 生成方式：线上 playground（yongkyuns.github.io/noon，Pyodide + WebGL2）实机录制：注入 setInterval 抓帧钩子，页内 drawImage 拷出 canvas 为 JPEG（16.67fps），ffmpeg 转 30fps 并拼 3 段，drawtext 烧中文标注
- pipeline：fallback
- 渲染耗时：181400 ms
- 录制脚本 _samples/yongkyuns__noon/_v2/capture_noon5.py：button.example-browser-trigger 打开画廊 → 选中卡片 → setInterval 抓帧
- 三段：Your first scene 109 帧 / Functions and samples 108 帧 / Bend a vector curve 108 帧，各 6.4-6.5s
- 拼接后 19.47s / 1280x720 / 30fps

## 已知限制

- 线上 playground 的 WebGL canvas 不能直接截屏（整页截图一次约 8s），改为页内 drawImage + toDataURL 抓帧
- 原生 canvas 尺寸 1240x696，上采样到 1280x720；录制 16.67fps 后转 30fps，运动略有重复帧
- 全程未点 Run，只切换示例，避免重建导致画面空白
