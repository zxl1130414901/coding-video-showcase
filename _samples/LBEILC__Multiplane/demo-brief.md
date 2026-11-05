# Multiplane 演示脚本（v2）

## 定位
LBEILC/Multiplane 把「一个 HTML 文件」变成视频：镜头里声明 `Shot.define({duration, fps, cuts, post, render(t)})`，`render(t)` 只接收秒数，返回一帧画面；CLI 逐帧截图并编码（可选 NVENC）。
旧样例只渲染仓库自带 `examples/animation.html` 2 秒，没有体现「确定性 + 硬切运动模糊 + 任意 HTML」这三件事。

## 三段能力
1. **确定性 render(t) + 硬切（0-5.4s）**：`shots/geo-blur.html` 用 `render(t)` 纯函数驱动位移/旋转，`cuts:[2.7]` 处切到深色底，证明「同一 t 永远同一像素」；`lint` 会拦 Date.now / Math.random 这类不确定源。
2. **硬切安全的运动模糊（同段后半 2.7-5.4s）**：`post:{motionBlur:4, shutter:0.8}` 在切点两侧不跨切混合，所以 2.7s 的切换是干脆的硬切而不是糊成一片。
3. **任意 HTML/CSS 当镜头源（5.4-12.6s）**：`shots/type.html` 用 `fonts:[...]` 注册本地 Roboto Variable（可渲染前等字体就绪），标题位移 + 下划线生长全部由 t 推导。
4. **逐帧截图 + NVENC（12.6-20.0s）**：`shots/layers.html` 是自写的四层视差镜头（网格/圆环/光条/光点），零后期，`--workers 1` 单浏览器逐帧截图、`--encoder nvenc-h264` 直接出 MP4。

按任务要求合并为 3 段：第一段（5.4s）＝确定性 + 运动模糊/硬切；第二段（7.2s）＝字体与排版镜头；第三段（7.4s）＝任意 HTML 视差镜头。

## 规格
- 1280×720 / 30fps / 20.0s / 3 段 / 5 条中文标注 / `--workers 1`
- 命令（镜头必须位于 `--root` 之内，所以自建 shot 放在仓库内 `shots-v2/`）：
  `npx multiplane render shots-v2/<name>.html --root F:\coding视频\LBEILC__Multiplane --out <seg>.mp4 --overwrite --fps 30 --scale 1 --workers 1 --encoder nvenc-h264`

## 实测成本
- 运动模糊镜头（4 采样）约 4.6s/帧，162 帧 ≈ 12 分钟；无后期镜头约 1.1s/帧。
- 因此本片 720p 交付（仓库上限受逐帧截图成本限制，1080p 需 2.25 倍时间）。

## 踩坑
- `shot_outside_root`：`--root` 之外的镜头直接报错，自建镜头必须放到仓库目录内（本片放 `shots-v2/`）。
- `three-cards.html` 需要 `three`（optional），本机未安装 → 3D 卡片/景深镜头未收录（见 knownLimits）。
