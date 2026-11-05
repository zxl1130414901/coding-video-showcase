# kaomei__stickman-video-director 演示要点（供后续精修）

样例状态：**failed** — doctor 全绿；autopilot preview examples/b1 报 EISDIR（输出目录被当文件读取），未生成 mp4

## 最值得演示的 3 个能力
1. **零 GPU**：canvas 逐帧，不吃显卡
2. **720p 原生**：无需降采样
3. **审核流**：validate→preview→approve

## 画面建议
演示重点：1) 720p30 原生画质；2) 字幕逐句高亮；3) 纯 CPU 批量渲染。

## 已知限制（精修时避开）
- 本次实测：doctor 全绿，但 preview 报 EISDIR（读取输出目录当成文件），未出片
- preview 需要先 approve 才能 render，流程较严
- 风格单一（火柴人)
