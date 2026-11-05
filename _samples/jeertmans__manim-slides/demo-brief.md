# manim-slides 能力演示脚本（v2）

## 选型依据
manim-slides 的独特价值不是“又一个 Manim 动画播放器”，而是**把 Manim 场景组织成可翻页、可讲稿的放映**：`Slide.next_slide()` 把一段连续动画切成页面，放映时可按页推进/回退，末端还能 `loop=True` 反复播放。真正能拉开差距的三件事：分页后的重新构图、翻页后的独立数据动画、可循环的收尾段落。

## 三段演示
1. **0–4.7s｜标题页排版与分页**
   `MarkupText` 标题 + 中文副标题居中组合，淡入后 `next_slide()` 推进到下一页。
   证明点：一段场景可以被切成多个“页”，页码状态由 Slide 管理。
2. **4.7–12.3s｜翻页后重建坐标系与数据动画**
   `self.clear()` 清空上一页后新建 Axes，三根柱子 `GrowFromEdge` 生长再拉伸到目标高度，最后浮出数值标签。
   证明点：翻页不是简单追加元素，而是整页重构图；数据动画仍由 Manim 的插值驱动。
3. **12.3–21s｜循环段落**
   画圆环、箭头与轨道点，`MoveAlongPath` 匀速绕行一圈后 `next_slide(loop=True)`。
   证明点：演示末页可设循环，放映时无需重跑脚本即可反复播放。

## 渲染方式
`manim -qm slide_capabilities.py SlideCapabilities`（720p30，无 TeX，全部用 `Text` / `MarkupText` 排版），由 poster.py 归一化到 1080p30 并烧入中文标注。

## 未做到
- 未录制真实键盘翻页交互（headless 渲染只呈现自动推进的时间轴）。
- 循环段落在成片里只播放一圈；`loop=True` 的效果以标注说明。
