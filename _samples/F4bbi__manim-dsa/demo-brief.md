# F4bbi__manim-dsa · 演示脚本（v2）

## 这条片子要证明什么
证明这个插件把数据结构直接变成可动画对象：数组索引刻度与 append/pop、栈的 LIFO 进出、加权图的节点+边一次构建、树按层级自动布局。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–6.6s | MArray：索引刻度 + append / pop 动画 | MArray([1,2,3]) 调用 add_indexes() 后 append(4) / pop() 各 1.2s |
| 2 | 6.6–12.6s | MStack：LIFO push / pop | MStack([3,7]) 压入 5 再弹出，动画由 animate.append/pop 驱动 |
| 3 | 12.6–18.4s | MGraph：加权图 + 自定义节点坐标 | 6 条带权边、5 个节点指定坐标，Create 一次成型 |
| 4 | 18.4–24.0s | MTree：层级自动布局 | 7 节点二叉树由 root 自动排布，无需手写坐标 |

## 中文标注（4–6 条，每条 3–5s）

- **0.5s +4.0s** ① MArray 索引刻度 + append/pop ｜ [1,2,3] 自动加索引刻度，append(4) 与 pop() 各 1.2s 动画
- **6.8s +4.0s** ② MStack 的 LIFO 进出 ｜ 2 元素栈压入 5 再弹出，位置与高度自动重排
- **12.8s +4.0s** ③ MGraph 加权图 ｜ 6 条带权边 + 5 个指定坐标节点，Create 一次构建
- **18.6s +4.0s** ④ MTree 层级布局 ｜ 7 节点二叉树按 root 自动分层，无需手写坐标

## 管线与实测
- 生成方式：manim-dsa 插件 + Manim CE 0.19，python -m manim -qh --fps 30 -r 1920,1080；Cairo 渲染 20 个动画；ffmpeg drawtext 烧录中文标注
- pipeline：official
- 渲染耗时：58000 ms
- 命令：python -m manim -qh --fps 30 -r 1920,1080 scene_v2.py DsaDemoV2
- 4 段共 20 个动画，成片 24.0s

## 已知限制

- Text 使用 Consolas 字体，中文标签不进入场景（改由后处理标注）
- 图/树的节点样式只支持插件内置的几种配色
- 1080p Cairo 渲染 24s 成片约 58s
