# remotion-bits 演示脚本（v2）

## 定位
仓库 av/remotion-bits 提供一组「开箱即用」的 Remotion 动效组件，每个组件 = 一个 React 组件 + 一条 `transition` props。
旧样例只有 MatrixRain 一个组件 5 秒，无法体现「组件库」这一核心卖点。

## 选中的 3 个能力（与 3 段一一对应）
1. **React 组件化文字动效**（0-8s）：`AnimatedText` 逐字符拆分，`splitStagger=4`、`y 140→0`、`blur 22→0`、`frames [0,80]`；`TypeWriter` 以 `typeSpeed=2` 逐字打出，证明「一个组件 + 一条 props」即可完成入场动画。
2. **StaggeredMotion + AnimatedCounter 编排**（8-16s）：5 张卡片 `stagger=7` 级联，`scale 0.8→1`、`blur 14→0`；计数器 `0→720` 用 `outExpo` 在 210 帧内递增，证明多组件共享同一帧基准，可组合出复杂节奏。
3. **Canvas 特效与渐变过渡叠层**（16-24s）：`MatrixRain` 30fps 逐帧绘制字符雨 + `GradientTransition` 三段渐变插值，与 DOM 文字同屏合成，证明组件既可写 DOM 也可写 canvas。

## 规格
- 1920×1080 / 30fps / 24.0s / 720 帧 / 3 段顺序拼接 / 6 条中文标注
- 渲染：`npx remotion render src/entry-v2.tsx BitsV2 ... --gl=vulkan --concurrency=1`，实测 67.7s

## 踩坑
- 默认 `chrome-headless-shell` 下载超时（30s 设置浏览器失败）→ 加 `--browser-executable="C:\Program Files\Google\Chrome\Application\chrome.exe"` 即通。
- `AnimatedText` 的 children 必须是字符串（内部按字符 split）；传 JSX 元素会被 `String()` 成 `[object Object]`。v1 因此第一幕全黑。
- `GradientTransition` 自带尺寸，外层定位容器必须显式给 `width/height`，否则 `right:120` 会被内容宽度撑到画面外。
