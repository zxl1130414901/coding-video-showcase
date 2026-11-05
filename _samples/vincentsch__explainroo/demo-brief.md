# vincentsch__explainroo 演示要点（供后续精修）

样例状态：**failed** — npm install 成功（25 分钟）；doctor --fetch 两次（含 hf-mirror 镜像）均拉取 ~400MB 语音模型失败（fetch failed），未能出片

## 最值得演示的 3 个能力
1. **全本地**：配音与渲染均离线
2. **词级时间码**：字幕与高亮对齐
3. **示例完整**：examples 可直接跑

## 画面建议
演示重点：1) script.md→配音→成片全本地；2) 词级时间码驱动的字幕/高亮；3) 示例工程的改法。

## 已知限制（精修时避开）
- 本次实测：npm install 25 分钟；doctor --fetch 两次（含 HF_ENDPOINT=hf-mirror）均报 fetch failed，模型下载不通，未出片
- 模型体积约 400MB，弱网/内网需预先离线放置
- 本地 TTS 首次调用还要拉语音检查模型
- 首次使用需下载约 400MB 模型，弱网成本高
- 默认缓存目录在用户目录，需显式改到 F 盘
