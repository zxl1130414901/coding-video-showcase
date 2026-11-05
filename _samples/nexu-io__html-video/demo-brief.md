# nexu-io__html-video · 演示脚本（v2）

## 这条片子要证明什么
证明它能把「一堆独立的 HTML/CSS/JS 场景」按 data-start / data-duration 精确拼成一条品牌宣传片：一个项目 JSON 指定模板与变量，CLI 一条命令完成渲染，无需手写时间轴或导出代码。

## 分段设计

| # | 时间 | 能力 | 实测证据 |
|---|---|---|---|
| 1 | 0.0–8.0s | 场景模板化：4s problem-type + 4s card-to-logo 顺序播放 | 8 个 composition 由 data-start/data-duration 精确调度，0-4s 痛点引入，4-8s 卡片折叠成 logo |
| 2 | 8.0–14.8s | 品牌揭示 + 流程图节点连线 | 2s brand-reveal 后接 4.8s benefits-flowchart，节点与连线在 HTML 中声明式绘制 |
| 3 | 14.8–22.0s | 产品界面展示 + 价值支柱转盘 | 4.7s product-surfaces 与 2.5s wheel-pillars 连续切换，全部为可替换的 HTML 组件 |
| 4 | 22.0–29.9s | foundation 收束 + CTA 结尾 | 07-foundation 与 08-cta-outro 两段收尾，成片 1920x1080 60fps 共 1791 帧、29.85s |

## 中文标注（4–6 条，每条 3–5s）

- **0.4s +4.0s** ① 一条 CLI 命令渲染 8 段 HTML 场景 ｜ project-render + 项目 JSON → 自动串成 29.85s 宣传片
- **8.3s +4.0s** ② 每段都是独立 HTML/CSS/JS composition ｜ data-start / data-duration 精确控制起止，换场景只改模板文件
- **14.9s +4.0s** ③ Playwright 录制 webm → ffmpeg 转 mp4 ｜ 实测 1920×1080、60fps、1791 帧、29.85s、约 700KB
- **21.0s +4.0s** ④ 品牌页 / 流程图 / 产品页全部可复用 ｜ brand-reveal、benefits-flowchart、product-surfaces 均为模板片段
- **26.2s +3.6s** ⑤ foundation + CTA 结尾一气呵成 ｜ 同一套模板可产出 25-35s 的多场景促销片

## 管线与实测
- 生成方式：node packages/cli/dist/bin.js project-render proj_2ae81db3-c1f --output（模板 frame-product-promo-30s，8 个 HTML composition），Playwright 录制 webm → ffmpeg 转 mp4，1920x1080/60fps；ffmpeg drawtext 烧录中文标注
- pipeline：official
- 渲染耗时：55000 ms
- 命令：node packages\cli\dist\bin.js project-render proj_2ae81db3-c1f --cwd _samples\nexu-io__html-video --output _v2\render_v2.mp4
- 第一次后台执行因参数顺序/输出目录问题退出 1，补齐 --cwd 与绝对输出路径后一次成功
- 模板来自 templates\frame-product-promo-30s：01 痛点 → 02 卡片 → 03 品牌 → 04 流程图 → 05 产品面 → 06 价值转盘 → 07 基础 → 08 CTA

## 已知限制

- CLI 输出不含音轨：模板自带 sfx 与 warm-pad 素材，本版本渲染未混入音频
- Playwright 录制为可变帧率 webm，转码后才固定 60fps，首末各约 0.1s 需修剪
- Windows 下 pnpm 安装与 build 脚本的 chmod 步骤会失败，但 tsc 产物可用
