# shot-scraper 演示脚本（v2）

## 定位
simonw/shot-scraper 的 `video` 子命令可以把一份 YAML「storyboard」录成 WebM：脚本里写 click / type / scroll / pause，浏览器自动执行并全程录屏。
旧样例 10.2s，只演示了「首页 → 点击换主题 → 点卡片」，没有体现「脚本化输入」与「滚动触发动画」。

## 三段能力
1. **YAML storyboard 脚本化录制（0-8.2s）**：`click: "#q"` + `type: {into: "#q", text: "make a 30s launch film", delay_ms: 28}` 逐字符敲入，input 事件触发三张结果卡片依序浮出。证明「输入也能脚本化」。
2. **滚动触发页面动画（8.2-14.4s）**：`scroll: {y: 720, duration: 1.5}` 平滑滚动，IntersectionObserver 触发 4 根柱子长高与 KPI 240 / 7200 / 20 计数。证明「滚动量可精确到像素、且能驱动页面侧动画」。
3. **点击驱动 UI 状态（14.4-20.4s）**：`click: "#play"` 打开弹层并切换主题色，光标轨迹一并录进视频。证明「交互闭环可完全复现」。

## 规格
- 1280×720 / 30fps（原始录制 25fps，交付前转码）/ 20.4s / 3 段 / 5 条中文标注
- 录制命令（注意子命令是 `video`，且本机包无 `__main__.py`）：
  `python -c "import sys; from shot_scraper.cli import cli; sys.argv=['shot-scraper','video','storyboard_v2.yml']; cli()"`
- 单次录制 24.7s（含 ffmpeg 收尾）

## 踩坑
- `python -m shot_scraper ...` 报 `No module named shot_scraper.__main__`；`shot-scraper.exe` 是旧版入口，会把 `storyboard` 当成 url。必须直接调 `cli()`。
- `type:` 只接受 mapping（`{into, text, delay_ms}`），写字符串会 `Unknown storyboard action`。
- storyboard 无 `fps` 字段，输出固定 25fps，成片前需 ffmpeg `-r 30`。
