# 代码转视频仓库索引（65 采集 / 51 出片）

## 在线浏览

- 仓库地址：<https://github.com/zxl1130414901/coding-video-showcase>
- 克隆：`git clone https://github.com/zxl1130414901/coding-video-showcase.git`（SSH：`git@github.com:zxl1130414901/coding-video-showcase.git`）
- 离线浏览：完整克隆后，直接用浏览器双击 `showcase/app/dist/index.html`。页面通过相对路径读取 `../../../_samples/` 与 `./thumbs/`，请保持仓库目录结构完整，不要单独拷贝 `index.html`。
- 视频样片（`*.mp4`）由 Git LFS 管理：首次使用请先执行 `git lfs install`，克隆后若视频为指针文件，执行 `git lfs pull`。
- 未开启 GitHub Pages：`dist/index.html` 中的 `__SAMPLE_BASE__` 指向 `../../../_samples/`，Pages 环境下会 404，因此请本地打开。

> 采集与实跑时间：2026-11-04 · 合并文章新增 / 样例定版：2026-11-05 · 数据来源：`manifest.json`（GitHub API 元数据 + 飞书文章 `Te14wRPAJiVpJ1k4O9pcpgX3nHg` 的 14 条新增）+ `_samples/<owner>__<repo>/meta.json`（ffprobe 实测规格）· 可视化画廊：[showcase/app/dist/index.html](showcase/app/dist/index.html)

## 总览

| 指标 | 数量 |
|---|---:|
| 采集仓库 | **65**（原有 51 + 文章新增 14） |
| 成功出片 | **51**（49 个 `.mp4` + 2 个原生 `.gif`） |
| 渲染失败 | **5** |
| 不可出片（跳过） | **9** |

- **筛选口径**：GitHub `pushed_at ≥ 2025-01-01`、非 archived、非 fork；检索原始结果 3059 条（24 + 19 组关键词），去重后 2915 条，原有 51 个（`git clone --depth 1` 9 个，codeload 归档 42 个）。
- **新增来源**：飞书文章 `Te14wRPAJiVpJ1k4O9pcpgX3nHg` 的 14 个仓库，按同一字段契约并入 `repos.json` / `details/` / `manifest.json`；原有 51 条除 `sample.spec` 按实测回写外字段值未改动，新增条目以 `source = article:Te14wRPAJiVpJ1k4O9pcpgX3nHg` 标记。
- **总占用**：仓库本体约 17.37 GB（含新增 14 个仓库约 1.63 GB；含渲染时装入的依赖/构建产物）+ 51 个样例文件 222.1 MB；`_env` 工具链另存 F 盘，未计入；全程未写 C 盘。
- **样例验收**：ffprobe 可读 + 时长 ≥ 2s + 帧率 ≥ 24fps + 中间帧 `preview.png` 非纯色（灰度标准差阈值）。低于 720p（按画面短边计）的产物：`codedbytahir/motionforge` 880x532、`motion-canvas/motion-canvas` 960x540、`transitive-bullshit/ffmpeg-concat` 640x360、`mifi/editly` 640x640（沿用仓库自带素材/默认输出，未放大）。
- **注意**：51 个出片中 2 个仓库本身只产 GIF（`asciinema/agg`、`maloyan/manim-web`），画廊以 `img` 展示；其余 49 个为 mp4，`video` 内嵌播放。

## 表 1 · 按更新时间倒序

| 仓库 | ⭐ | 更新时间 | 语言 | 样例规格（分辨率 · 时长 · 帧率 · 帧数 · 大小） | 状态 | 样例文件 |
|---|---:|---|---|---|---|---|
| [yongkyuns/noon](https://github.com/yongkyuns/noon) | 138 | 2026-11-04 | Rust | 1280x720 · 19.47s · 30fps · 584 帧 · 176 KB | 出片 | [sample.mp4](_samples/yongkyuns__noon/sample.mp4) |
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | 70471 | 2026-11-03 | TypeScript | 1920x1080 · 29.9s · 30fps · 897 帧 · 3651 KB | 出片 | [sample.mp4](_samples/remotion-dev__remotion/sample.mp4) |
| [BintzGavin/helios](https://github.com/BintzGavin/helios) | 123 | 2026-11-03 | TypeScript | 1280x720 · 18s · 30fps · 540 帧 · 433 KB | 出片 | [sample.mp4](_samples/BintzGavin__helios/sample.mp4) |
| [0xS4N4TG/kinetograph](https://github.com/0xS4N4TG/kinetograph) | 452 | 2026-11-03 | TypeScript | 1280x720 · 18s · 30fps · 540 帧 · 588 KB | 出片 | [sample.mp4](_samples/0xS4N4TG__kinetograph/sample.mp4) |
| [dmtrKovalenko/fframes](https://github.com/dmtrKovalenko/fframes) | 3162 | 2026-11-03 | Rust | — | 失败 | — |
| [Remocn/remocn](https://github.com/Remocn/remocn) | 1667 | 2026-11-03 | TypeScript | 1280x720 · 21s · 30fps · 630 帧 · 1547 KB | 出片 | [sample.mp4](_samples/Remocn__remocn/sample.mp4) |
| [wx4766/html-to-video](https://github.com/wx4766/html-to-video) | 179 | 2026-11-03 | JavaScript | 1920x1080 · 23.9s · 30fps · 717 帧 · 1429 KB | 出片 | [sample.mp4](_samples/wx4766__html-to-video/sample.mp4) |
| [shadcn-labs/snapcn](https://github.com/shadcn-labs/snapcn) | 560 | 2026-11-03 | TypeScript | 1280x720 · 21s · 30fps · 630 帧 · 1257 KB | 出片 | [sample.mp4](_samples/shadcn-labs__snapcn/sample.mp4) |
| [academa-labs/manimgx](https://github.com/academa-labs/manimgx) | 2506 | 2026-11-02 | Python | 1920x1080 · 29.93s · 30fps · 898 帧 · 4580 KB | 出片 | [sample.mp4](_samples/academa-labs__manimgx/sample.mp4) |
| [jeertmans/manim-slides](https://github.com/jeertmans/manim-slides) | 974 | 2026-11-02 | Python | 1920x1080 · 20.9s · 30fps · 627 帧 · 450 KB | 出片 | [sample.mp4](_samples/jeertmans__manim-slides/sample.mp4) |
| [patriciogonzalezvivo/glslViewer](https://github.com/patriciogonzalezvivo/glslViewer) | 5353 | 2026-11-02 | C++ | 1920x1080 · 23.9s · 30fps · 717 帧 · 11477 KB | 出片 | [sample.mp4](_samples/patriciogonzalezvivo__glslViewer/sample.mp4) |
| [charmbracelet/vhs](https://github.com/charmbracelet/vhs) | 21261 | 2026-11-02 | Go | 1920x1080 · 29.9s · 30fps · 897 帧 · 1230 KB | 出片 | [sample.mp4](_samples/charmbracelet__vhs/sample.mp4) |
| [remotion-dev/template-code-hike](https://github.com/remotion-dev/template-code-hike) | 222 | 2026-11-02 | TypeScript | 1920x1080 · 29.9s · 30fps · 897 帧 · 1063 KB | 出片 | [sample.mp4](_samples/remotion-dev__template-code-hike/sample.mp4) |
| [remotion-dev/template-three](https://github.com/remotion-dev/template-three) | 117 | 2026-11-02 | TypeScript | 1920x1080 · 29.9s · 30fps · 897 帧 · 3807 KB | 出片 | [sample.mp4](_samples/remotion-dev__template-three/sample.mp4) |
| [ManimCommunity/manim](https://github.com/ManimCommunity/manim) | 42215 | 2026-11-02 | Python | 1920x1080 · 26.2s · 30fps · 786 帧 · 2336 KB | 出片 | [sample.mp4](_samples/ManimCommunity__manim/sample.mp4) |
| [AzurIce/ranim](https://github.com/AzurIce/ranim) | 662 | 2026-10-31 | Rust | 1280x720 · 21s · 30fps · 630 帧 · 643 KB | 出片 | [sample.mp4](_samples/AzurIce__ranim/sample.mp4) |
| [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | 16586 | 2026-10-29 | TypeScript | 1920x1080 · 35.9s · 30fps · 1077 帧 · 14974 KB | 出片 | [sample.mp4](_samples/Vincentwei1021__video-shotcraft/sample.mp4) |
| [welovemedia/ffmate](https://github.com/welovemedia/ffmate) | 601 | 2026-10-28 | Go | 1920x1080 · 21.9s · 30fps · 657 帧 · 30540 KB | 出片 | [sample.mp4](_samples/welovemedia__ffmate/sample.mp4) |
| [asciinema/asciinema](https://github.com/asciinema/asciinema) | 17934 | 2026-10-27 | Rust | 1920x1080 · 26s · 30fps · 780 帧 · 713 KB | 出片 | [sample.mp4](_samples/asciinema__asciinema/sample.mp4) |
| [asciinema/agg](https://github.com/asciinema/agg) | 1743 | 2026-10-27 | Rust | 1207x731 · 4.6s · 60fps · 181 帧 · 136 KB | 出片 | [sample.gif](_samples/asciinema__agg/sample.gif) |
| [iart-ai/motion-skills](https://github.com/iart-ai/motion-skills) | 1187 | 2026-10-25 | HTML | 1920x1080 · 24.17s · 30fps · 725 帧 · 1641 KB | 出片 | [sample.mp4](_samples/iart-ai__motion-skills/sample.mp4) |
| [maloyan/manim-web](https://github.com/maloyan/manim-web) | 510 | 2026-10-25 | TypeScript | 1280x720 · 2.7s · 33.33fps · 90 帧 · 403 KB | 出片 | [sample.gif](_samples/maloyan__manim-web/sample.gif) |
| [LBEILC/Multiplane](https://github.com/LBEILC/Multiplane) | 147 | 2026-10-25 | JavaScript | 1280x720 · 19.9s · 30fps · 597 帧 · 2829 KB | 出片 | [sample.mp4](_samples/LBEILC__Multiplane/sample.mp4) |
| [SkyeShark/eidoverse-video](https://github.com/SkyeShark/eidoverse-video) | 117 | 2026-10-19 | JavaScript | 1920x1080 · 21.5s · 30fps · 645 帧 · 21262 KB | 出片 | [sample.mp4](_samples/SkyeShark__eidoverse-video/sample.mp4) |
| [Matheart/manim-physics](https://github.com/Matheart/manim-physics) | 412 | 2026-10-15 | Python | 1920x1080 · 22.7s · 30fps · 681 帧 · 3105 KB | 出片 | [sample.mp4](_samples/Matheart__manim-physics/sample.mp4) |
| [simonw/shot-scraper](https://github.com/simonw/shot-scraper) | 2602 | 2026-10-14 | Python | 1280x720 · 20.33s · 30fps · 610 帧 · 1873 KB | 出片 | [sample.mp4](_samples/simonw__shot-scraper/sample.mp4) |
| [spite/ccapture.js](https://github.com/spite/ccapture.js) | 3780 | 2026-10-13 | JavaScript | 1920x1080 · 23.9s · 30fps · 717 帧 · 15812 KB | 出片 | [sample.mp4](_samples/spite__ccapture.js/sample.mp4) |
| [cth9191/animate](https://github.com/cth9191/animate) | 1467 | 2026-10-05 | JavaScript | 1080x1920 · 23.87s · 30fps · 716 帧 · 17969 KB | 出片 | [sample.mp4](_samples/cth9191__animate/sample.mp4) |
| [leonid-shevtsov/headless](https://github.com/leonid-shevtsov/headless) | 969 | 2026-09-30 | Ruby | — | 不可出片 | — |
| [3b1b/videos](https://github.com/3b1b/videos) | 11457 | 2026-09-29 | Python | — | 不可出片 | — |
| [dmnsgn/canvas-record](https://github.com/dmnsgn/canvas-record) | 433 | 2026-09-17 | JavaScript | 1920x1080 · 20.67s · 30fps · 620 帧 · 11686 KB | 出片 | [sample.mp4](_samples/dmnsgn__canvas-record/sample.mp4) |
| [ybouane/VideoFlow](https://github.com/ybouane/VideoFlow) | 170 | 2026-09-16 | TypeScript | 1920x1080 · 20.9s · 30fps · 627 帧 · 2470 KB | 出片 | [sample.mp4](_samples/ybouane__VideoFlow/sample.mp4) |
| [av/remotion-bits](https://github.com/av/remotion-bits) | 508 | 2026-09-15 | TypeScript | 1920x1080 · 23.9s · 30fps · 717 帧 · 16669 KB | 出片 | [sample.mp4](_samples/av__remotion-bits/sample.mp4) |
| [bangtutorial/bang-motion](https://github.com/bangtutorial/bang-motion) | 1025 | 2026-09-15 | HTML | — | 不可出片 | — |
| [UnMolDeQuimica/manim-Chemistry](https://github.com/UnMolDeQuimica/manim-Chemistry) | 95 | 2026-09-11 | Python | 1920x1080 · 26.07s · 30fps · 782 帧 · 1320 KB | 出片 | [sample.mp4](_samples/UnMolDeQuimica__manim-Chemistry/sample.mp4) |
| [3b1b/manim](https://github.com/3b1b/manim) | 96097 | 2026-09-09 | Python | 1280x720 · 25.8s · 30fps · 774 帧 · 844 KB | 出片 | [sample.mp4](_samples/3b1b__manim/sample.mp4) |
| [codedbytahir/motionforge](https://github.com/codedbytahir/motionforge) | 97 | 2026-08-29 | TypeScript | 1920x1080 · 30s · 30fps · 900 帧 · 368 KB | 出片 | [sample.mp4](_samples/codedbytahir__motionforge/sample.mp4) |
| [Zulko/moviepy](https://github.com/Zulko/moviepy) | 15104 | 2026-08-26 | Python | 1280x720 · 28s · 30fps · 840 帧 · 4182 KB | 出片 | [sample.mp4](_samples/Zulko__moviepy/sample.mp4) |
| [showlab/Code2Video](https://github.com/showlab/Code2Video) | 2236 | 2026-08-24 | Python | — | 不可出片 | — |
| [JazonJiao/Manim.js](https://github.com/JazonJiao/Manim.js) | 454 | 2026-08-22 | JavaScript | 1920x1080 · 30s · 30fps · 900 帧 · 784 KB | 出片 | [sample.mp4](_samples/JazonJiao__Manim.js/sample.mp4) |
| [midrender/revideo](https://github.com/midrender/revideo) | 4174 | 2026-07-15 | TypeScript | 1920x1080 · 29.08s · 30fps · 872 帧 · 802 KB | 出片 | [sample.mp4](_samples/midrender__revideo/sample.mp4) |
| [F4bbi/manim-dsa](https://github.com/F4bbi/manim-dsa) | 91 | 2026-07-13 | Python | 1920x1080 · 24s · 30fps · 720 帧 · 536 KB | 出片 | [sample.mp4](_samples/F4bbi__manim-dsa/sample.mp4) |
| [motion-canvas/motion-canvas](https://github.com/motion-canvas/motion-canvas) | 19676 | 2026-07-02 | TypeScript | 1280x720 · 19s · 30fps · 570 帧 · 517 KB | 出片 | [sample.mp4](_samples/motion-canvas__motion-canvas/sample.mp4) |
| [openvideodev/react-video-editor](https://github.com/openvideodev/react-video-editor) | 1830 | 2026-06-30 | TypeScript | — | 失败 | — |
| [mowshon/moviego](https://github.com/mowshon/moviego) | 303 | 2026-06-22 | Go | 1920x1080 · 25.01s · 30fps · 750 帧 · 3313 KB | 出片 | [sample.mp4](_samples/mowshon__moviego/sample.mp4) |
| [nexu-io/html-video](https://github.com/nexu-io/html-video) | 4803 | 2026-06-21 | HTML | 1920x1080 · 29.85s · 60fps · 1791 帧 · 937 KB | 出片 | [sample.mp4](_samples/nexu-io__html-video/sample.mp4) |
| [ManimCommunity/manim-voiceover](https://github.com/ManimCommunity/manim-voiceover) | 326 | 2026-06-15 | Python | 1920x1080 · 29.6s · 30fps · 888 帧 · 1090 KB | 出片 | [sample.mp4](_samples/ManimCommunity__manim-voiceover/sample.mp4) |
| [krassowski/jupyter-manim](https://github.com/krassowski/jupyter-manim) | 198 | 2026-04-13 | Python | — | 不可出片 | — |
| [transitive-bullshit/ffmpeg-concat](https://github.com/transitive-bullshit/ffmpeg-concat) | 991 | 2026-01-24 | JavaScript | 1280x720 · 18.42s · 30fps · 552 帧 · 2474 KB | 出片 | [sample.mp4](_samples/transitive-bullshit__ffmpeg-concat/sample.mp4) |
| [h2non/videoshow](https://github.com/h2non/videoshow) | 903 | 2026-01-21 | JavaScript | 1280x720 · 23.6s · 30fps · 708 帧 · 2891 KB | 出片 | [sample.mp4](_samples/h2non__videoshow/sample.mp4) |
| [mifi/editly](https://github.com/mifi/editly) | 5579 | 2025-05-12 | TypeScript | 1280x720 · 18.6s · 30fps · 558 帧 · 2119 KB | 出片 | [sample.mp4](_samples/mifi__editly/sample.mp4) |

## 表 2 · 按星级倒序

| 仓库 | ⭐ | 更新时间 | 语言 | 样例规格（分辨率 · 时长 · 帧率 · 帧数 · 大小） | 状态 | 样例文件 |
|---|---:|---|---|---|---|---|
| [3b1b/manim](https://github.com/3b1b/manim) | 96097 | 2026-09-09 | Python | 1280x720 · 25.8s · 30fps · 774 帧 · 844 KB | 出片 | [sample.mp4](_samples/3b1b__manim/sample.mp4) |
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | 70471 | 2026-11-03 | TypeScript | 1920x1080 · 29.9s · 30fps · 897 帧 · 3651 KB | 出片 | [sample.mp4](_samples/remotion-dev__remotion/sample.mp4) |
| [ManimCommunity/manim](https://github.com/ManimCommunity/manim) | 42215 | 2026-11-02 | Python | 1920x1080 · 26.2s · 30fps · 786 帧 · 2336 KB | 出片 | [sample.mp4](_samples/ManimCommunity__manim/sample.mp4) |
| [charmbracelet/vhs](https://github.com/charmbracelet/vhs) | 21261 | 2026-11-02 | Go | 1920x1080 · 29.9s · 30fps · 897 帧 · 1230 KB | 出片 | [sample.mp4](_samples/charmbracelet__vhs/sample.mp4) |
| [motion-canvas/motion-canvas](https://github.com/motion-canvas/motion-canvas) | 19676 | 2026-07-02 | TypeScript | 1280x720 · 19s · 30fps · 570 帧 · 517 KB | 出片 | [sample.mp4](_samples/motion-canvas__motion-canvas/sample.mp4) |
| [asciinema/asciinema](https://github.com/asciinema/asciinema) | 17934 | 2026-10-27 | Rust | 1920x1080 · 26s · 30fps · 780 帧 · 713 KB | 出片 | [sample.mp4](_samples/asciinema__asciinema/sample.mp4) |
| [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | 16586 | 2026-10-29 | TypeScript | 1920x1080 · 35.9s · 30fps · 1077 帧 · 14974 KB | 出片 | [sample.mp4](_samples/Vincentwei1021__video-shotcraft/sample.mp4) |
| [Zulko/moviepy](https://github.com/Zulko/moviepy) | 15104 | 2026-08-26 | Python | 1280x720 · 28s · 30fps · 840 帧 · 4182 KB | 出片 | [sample.mp4](_samples/Zulko__moviepy/sample.mp4) |
| [3b1b/videos](https://github.com/3b1b/videos) | 11457 | 2026-09-29 | Python | — | 不可出片 | — |
| [mifi/editly](https://github.com/mifi/editly) | 5579 | 2025-05-12 | TypeScript | 1280x720 · 18.6s · 30fps · 558 帧 · 2119 KB | 出片 | [sample.mp4](_samples/mifi__editly/sample.mp4) |
| [patriciogonzalezvivo/glslViewer](https://github.com/patriciogonzalezvivo/glslViewer) | 5353 | 2026-11-02 | C++ | 1920x1080 · 23.9s · 30fps · 717 帧 · 11477 KB | 出片 | [sample.mp4](_samples/patriciogonzalezvivo__glslViewer/sample.mp4) |
| [nexu-io/html-video](https://github.com/nexu-io/html-video) | 4803 | 2026-06-21 | HTML | 1920x1080 · 29.85s · 60fps · 1791 帧 · 937 KB | 出片 | [sample.mp4](_samples/nexu-io__html-video/sample.mp4) |
| [midrender/revideo](https://github.com/midrender/revideo) | 4174 | 2026-07-15 | TypeScript | 1920x1080 · 29.08s · 30fps · 872 帧 · 802 KB | 出片 | [sample.mp4](_samples/midrender__revideo/sample.mp4) |
| [spite/ccapture.js](https://github.com/spite/ccapture.js) | 3780 | 2026-10-13 | JavaScript | 1920x1080 · 23.9s · 30fps · 717 帧 · 15812 KB | 出片 | [sample.mp4](_samples/spite__ccapture.js/sample.mp4) |
| [dmtrKovalenko/fframes](https://github.com/dmtrKovalenko/fframes) | 3162 | 2026-11-03 | Rust | — | 失败 | — |
| [simonw/shot-scraper](https://github.com/simonw/shot-scraper) | 2602 | 2026-10-14 | Python | 1280x720 · 20.33s · 30fps · 610 帧 · 1873 KB | 出片 | [sample.mp4](_samples/simonw__shot-scraper/sample.mp4) |
| [academa-labs/manimgx](https://github.com/academa-labs/manimgx) | 2506 | 2026-11-02 | Python | 1920x1080 · 29.93s · 30fps · 898 帧 · 4580 KB | 出片 | [sample.mp4](_samples/academa-labs__manimgx/sample.mp4) |
| [showlab/Code2Video](https://github.com/showlab/Code2Video) | 2236 | 2026-08-24 | Python | — | 不可出片 | — |
| [openvideodev/react-video-editor](https://github.com/openvideodev/react-video-editor) | 1830 | 2026-06-30 | TypeScript | — | 失败 | — |
| [asciinema/agg](https://github.com/asciinema/agg) | 1743 | 2026-10-27 | Rust | 1207x731 · 4.6s · 60fps · 181 帧 · 136 KB | 出片 | [sample.gif](_samples/asciinema__agg/sample.gif) |
| [Remocn/remocn](https://github.com/Remocn/remocn) | 1667 | 2026-11-03 | TypeScript | 1280x720 · 21s · 30fps · 630 帧 · 1547 KB | 出片 | [sample.mp4](_samples/Remocn__remocn/sample.mp4) |
| [cth9191/animate](https://github.com/cth9191/animate) | 1467 | 2026-10-05 | JavaScript | 1080x1920 · 23.87s · 30fps · 716 帧 · 17969 KB | 出片 | [sample.mp4](_samples/cth9191__animate/sample.mp4) |
| [iart-ai/motion-skills](https://github.com/iart-ai/motion-skills) | 1187 | 2026-10-25 | HTML | 1920x1080 · 24.17s · 30fps · 725 帧 · 1641 KB | 出片 | [sample.mp4](_samples/iart-ai__motion-skills/sample.mp4) |
| [bangtutorial/bang-motion](https://github.com/bangtutorial/bang-motion) | 1025 | 2026-09-15 | HTML | — | 不可出片 | — |
| [transitive-bullshit/ffmpeg-concat](https://github.com/transitive-bullshit/ffmpeg-concat) | 991 | 2026-01-24 | JavaScript | 1280x720 · 18.42s · 30fps · 552 帧 · 2474 KB | 出片 | [sample.mp4](_samples/transitive-bullshit__ffmpeg-concat/sample.mp4) |
| [jeertmans/manim-slides](https://github.com/jeertmans/manim-slides) | 974 | 2026-11-02 | Python | 1920x1080 · 20.9s · 30fps · 627 帧 · 450 KB | 出片 | [sample.mp4](_samples/jeertmans__manim-slides/sample.mp4) |
| [leonid-shevtsov/headless](https://github.com/leonid-shevtsov/headless) | 969 | 2026-09-30 | Ruby | — | 不可出片 | — |
| [h2non/videoshow](https://github.com/h2non/videoshow) | 903 | 2026-01-21 | JavaScript | 1280x720 · 23.6s · 30fps · 708 帧 · 2891 KB | 出片 | [sample.mp4](_samples/h2non__videoshow/sample.mp4) |
| [AzurIce/ranim](https://github.com/AzurIce/ranim) | 662 | 2026-10-31 | Rust | 1280x720 · 21s · 30fps · 630 帧 · 643 KB | 出片 | [sample.mp4](_samples/AzurIce__ranim/sample.mp4) |
| [welovemedia/ffmate](https://github.com/welovemedia/ffmate) | 601 | 2026-10-28 | Go | 1920x1080 · 21.9s · 30fps · 657 帧 · 30540 KB | 出片 | [sample.mp4](_samples/welovemedia__ffmate/sample.mp4) |
| [shadcn-labs/snapcn](https://github.com/shadcn-labs/snapcn) | 560 | 2026-11-03 | TypeScript | 1280x720 · 21s · 30fps · 630 帧 · 1257 KB | 出片 | [sample.mp4](_samples/shadcn-labs__snapcn/sample.mp4) |
| [maloyan/manim-web](https://github.com/maloyan/manim-web) | 510 | 2026-10-25 | TypeScript | 1280x720 · 2.7s · 33.33fps · 90 帧 · 403 KB | 出片 | [sample.gif](_samples/maloyan__manim-web/sample.gif) |
| [av/remotion-bits](https://github.com/av/remotion-bits) | 508 | 2026-09-15 | TypeScript | 1920x1080 · 23.9s · 30fps · 717 帧 · 16669 KB | 出片 | [sample.mp4](_samples/av__remotion-bits/sample.mp4) |
| [JazonJiao/Manim.js](https://github.com/JazonJiao/Manim.js) | 454 | 2026-08-22 | JavaScript | 1920x1080 · 30s · 30fps · 900 帧 · 784 KB | 出片 | [sample.mp4](_samples/JazonJiao__Manim.js/sample.mp4) |
| [0xS4N4TG/kinetograph](https://github.com/0xS4N4TG/kinetograph) | 452 | 2026-11-03 | TypeScript | 1280x720 · 18s · 30fps · 540 帧 · 588 KB | 出片 | [sample.mp4](_samples/0xS4N4TG__kinetograph/sample.mp4) |
| [dmnsgn/canvas-record](https://github.com/dmnsgn/canvas-record) | 433 | 2026-09-17 | JavaScript | 1920x1080 · 20.67s · 30fps · 620 帧 · 11686 KB | 出片 | [sample.mp4](_samples/dmnsgn__canvas-record/sample.mp4) |
| [Matheart/manim-physics](https://github.com/Matheart/manim-physics) | 412 | 2026-10-15 | Python | 1920x1080 · 22.7s · 30fps · 681 帧 · 3105 KB | 出片 | [sample.mp4](_samples/Matheart__manim-physics/sample.mp4) |
| [ManimCommunity/manim-voiceover](https://github.com/ManimCommunity/manim-voiceover) | 326 | 2026-06-15 | Python | 1920x1080 · 29.6s · 30fps · 888 帧 · 1090 KB | 出片 | [sample.mp4](_samples/ManimCommunity__manim-voiceover/sample.mp4) |
| [mowshon/moviego](https://github.com/mowshon/moviego) | 303 | 2026-06-22 | Go | 1920x1080 · 25.01s · 30fps · 750 帧 · 3313 KB | 出片 | [sample.mp4](_samples/mowshon__moviego/sample.mp4) |
| [remotion-dev/template-code-hike](https://github.com/remotion-dev/template-code-hike) | 222 | 2026-11-02 | TypeScript | 1920x1080 · 29.9s · 30fps · 897 帧 · 1063 KB | 出片 | [sample.mp4](_samples/remotion-dev__template-code-hike/sample.mp4) |
| [krassowski/jupyter-manim](https://github.com/krassowski/jupyter-manim) | 198 | 2026-04-13 | Python | — | 不可出片 | — |
| [wx4766/html-to-video](https://github.com/wx4766/html-to-video) | 179 | 2026-11-03 | JavaScript | 1920x1080 · 23.9s · 30fps · 717 帧 · 1429 KB | 出片 | [sample.mp4](_samples/wx4766__html-to-video/sample.mp4) |
| [ybouane/VideoFlow](https://github.com/ybouane/VideoFlow) | 170 | 2026-09-16 | TypeScript | 1920x1080 · 20.9s · 30fps · 627 帧 · 2470 KB | 出片 | [sample.mp4](_samples/ybouane__VideoFlow/sample.mp4) |
| [LBEILC/Multiplane](https://github.com/LBEILC/Multiplane) | 147 | 2026-10-25 | JavaScript | 1280x720 · 19.9s · 30fps · 597 帧 · 2829 KB | 出片 | [sample.mp4](_samples/LBEILC__Multiplane/sample.mp4) |
| [yongkyuns/noon](https://github.com/yongkyuns/noon) | 138 | 2026-11-04 | Rust | 1280x720 · 19.47s · 30fps · 584 帧 · 176 KB | 出片 | [sample.mp4](_samples/yongkyuns__noon/sample.mp4) |
| [BintzGavin/helios](https://github.com/BintzGavin/helios) | 123 | 2026-11-03 | TypeScript | 1280x720 · 18s · 30fps · 540 帧 · 433 KB | 出片 | [sample.mp4](_samples/BintzGavin__helios/sample.mp4) |
| [remotion-dev/template-three](https://github.com/remotion-dev/template-three) | 117 | 2026-11-02 | TypeScript | 1920x1080 · 29.9s · 30fps · 897 帧 · 3807 KB | 出片 | [sample.mp4](_samples/remotion-dev__template-three/sample.mp4) |
| [SkyeShark/eidoverse-video](https://github.com/SkyeShark/eidoverse-video) | 117 | 2026-10-19 | JavaScript | 1920x1080 · 21.5s · 30fps · 645 帧 · 21262 KB | 出片 | [sample.mp4](_samples/SkyeShark__eidoverse-video/sample.mp4) |
| [codedbytahir/motionforge](https://github.com/codedbytahir/motionforge) | 97 | 2026-08-29 | TypeScript | 1920x1080 · 30s · 30fps · 900 帧 · 368 KB | 出片 | [sample.mp4](_samples/codedbytahir__motionforge/sample.mp4) |
| [UnMolDeQuimica/manim-Chemistry](https://github.com/UnMolDeQuimica/manim-Chemistry) | 95 | 2026-09-11 | Python | 1920x1080 · 26.07s · 30fps · 782 帧 · 1320 KB | 出片 | [sample.mp4](_samples/UnMolDeQuimica__manim-Chemistry/sample.mp4) |
| [F4bbi/manim-dsa](https://github.com/F4bbi/manim-dsa) | 91 | 2026-07-13 | Python | 1920x1080 · 24s · 30fps · 720 帧 · 536 KB | 出片 | [sample.mp4](_samples/F4bbi__manim-dsa/sample.mp4) |

## 表 3 · 文章新增 14 条（2026-11-05 合并）

| 仓库 | ⭐ | 更新时间 | 语言 | 样例规格（分辨率 · 时长 · 帧率 · 帧数 · 大小） | 状态 | 样例文件 |
|---|---:|---|---|---|---|---|
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | 79071 | 2026-11-05 | TypeScript | 1920x1080 · 22.3s · 30fps · 669 帧 · 1373 KB | 出片 | [sample.mp4](_samples/heygen-com__hyperframes/sample.mp4) |
| [feitangyuan/onetake](https://github.com/feitangyuan/onetake) | 3763 | 2026-11-05 | Python | 1280x720 · 21.8s · 30fps · 654 帧 · 1374 KB | 出片 | [sample.mp4](_samples/feitangyuan__onetake/sample.mp4) |
| [kaomei/stickman-video-director](https://github.com/kaomei/stickman-video-director) | 4299 | 2026-11-04 | JavaScript | — | 失败 | — |
| [threerocks/sweety-handdraw-video](https://github.com/threerocks/sweety-handdraw-video) | 1055 | 2026-11-03 | JavaScript | — | 不可出片 | — |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | 6373 | 2026-11-02 | TypeScript | — | 不可出片 | — |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | 12339 | 2026-10-31 | JavaScript | 1280x720 · 20.2s · 30fps · 606 帧 · 4812 KB | 出片 | [sample.mp4](_samples/lemomo-ai__lemo-opuscar/sample.mp4) |
| [pedrovelasquez9/fragua](https://github.com/pedrovelasquez9/fragua) | 13 | 2026-10-30 | Python | — | 不可出片 | — |
| [alchaincyf/huashu-motion](https://github.com/alchaincyf/huashu-motion) | 2374 | 2026-10-22 | JavaScript | 1920x1080 · 22.3s · 30fps · 669 帧 · 8540 KB | 出片 | [sample.mp4](_samples/alchaincyf__huashu-motion/sample.mp4) |
| [vincentsch/explainroo](https://github.com/vincentsch/explainroo) | 844 | 2026-10-20 | JavaScript | — | 失败 | — |
| [lovisdotio/motion2code](https://github.com/lovisdotio/motion2code) | 330 | 2026-10-20 | HTML | 1920x1080 · 23.8s · 30fps · 714 帧 · 6867 KB | 出片 | [sample.mp4](_samples/lovisdotio__motion2code/sample.mp4) |
| [alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) | 6260 | 2026-10-16 | JavaScript | 1920x1080 · 22.5s · 30fps · 675 帧 · 2208 KB | 出片 | [sample.mp4](_samples/alchaincyf__huashu-art-motion/sample.mp4) |
| [yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) | 13606 | 2026-10-13 | — | — | 不可出片 | — |
| [browser-use/video-use](https://github.com/browser-use/video-use) | 30559 | 2026-10-08 | Python | 1920x1080 · 20.63s · 30fps · 619 帧 · 3371 KB | 出片 | [sample.mp4](_samples/browser-use__video-use/sample.mp4) |
| [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo) | 2837 | 2026-09-25 | JavaScript | — | 失败 | — |

> 上表为文章新增的 14 条，已并入 `manifest.json`（`_meta` 标注合并来源）与站点数据集；按更新时间倒序。其中 7 个出片仓库已升级为 **20–24 秒三段式能力演示**（旧片保留为 `sample_basic.mp4`），并配套 `features.json`（3 段能力 + 6 个 callout）。样例规格为 2026-11-05 ffprobe 实测值。

## 失败项（5）

| 仓库 | 状态 | 根因关键词 |
|---|---|---|
| [dmtrKovalenko/fframes](https://github.com/dmtrKovalenko/fframes) | 失败 | `__std_find_first_of_trivial_pos_1` LNK2019 / LNK1120：本机 MSVC 14.43（VS2022 BuildTools 17.13）的 STL 不含该符号，而 rust-skia 0.153.3 的 Windows 预编译包由 MSVC 14.44+ 构建；升级 BuildTools 需写 C 盘，clang-cl 重建 Skia 超出 45 分钟上限 |
| [openvideodev/react-video-editor](https://github.com/openvideodev/react-video-editor) | 失败 | Studio 初始化不收敛：`CanvasPanel.onReady` 依赖远程字体 `https://cdn.designcombo.dev/fonts/Geist-SemiBold.ttf`（外网不可达，永久挂起）与 pixi `studio.ready`，两者均未完成；无任何可录制画面 |
| [vincentsch/explainroo](https://github.com/vincentsch/explainroo) | 失败 | `npm install` 成功（25 分钟）；`doctor --fetch` 两次（含 hf-mirror 镜像）均拉取约 400 MB 语音模型失败，未能出片 |
| [kaomei/stickman-video-director](https://github.com/kaomei/stickman-video-director) | 失败 | `doctor` 全绿；`autopilot preview examples/b1` 报 EISDIR（输出目录被当文件读取），未生成 mp4 |
| [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo) | 失败 | 官方 `--stills` 正常；`--clip` 片段渲染两次挂死（无帧输出，约 3s/帧），未生成 mp4 |

## 不可出片（9）

| 仓库 | 状态 | 根因关键词 |
|---|---|---|
| [leonid-shevtsov/headless](https://github.com/leonid-shevtsov/headless) | 不可出片 | Unix PTY + Xvfb：Ruby 虚拟 X 屏幕，Windows 无等价实现 |
| [3b1b/videos](https://github.com/3b1b/videos) | 不可出片 | 内容仓库，非框架：manimgl（OpenGL 上下文）+ LaTeX 全套 + 专用字体/音频资产，单场景成本过高 |
| [bangtutorial/bang-motion](https://github.com/bangtutorial/bang-motion) | 不可出片 | 文档/技能仓库：README 指向的 `starters/` 目录不存在，无任何可执行渲染入口 |
| [showlab/Code2Video](https://github.com/showlab/Code2Video) | 不可出片 | 需 LLM + VLM API Key（README 要求 `api_config.json` 填 Claude-4-Opus 等），仓库无离线 CASES 产物 |
| [krassowski/jupyter-manim](https://github.com/krassowski/jupyter-manim) | 不可出片 | 仅支持已停更的 ManimCairo 后端（`manimlib.scene` + ShowCreation），与现版 ManimCE/ManimGL 不兼容 |
| [threerocks/sweety-handdraw-video](https://github.com/threerocks/sweety-handdraw-video) | 不可出片 | 缺宿主生图工具与完整 job/design/art-direction/旁白对齐，构造 simulated 任务超出预算 |
| [pedrovelasquez9/fragua](https://github.com/pedrovelasquez9/fragua) | 不可出片 | setup 需拉取约 1.6 GB Whisper 模型并通过系统包管理安装依赖，超出本轮基础验证预算 |
| [yihui-dev/awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos) | 不可出片 | 纯提示词合集，无渲染入口 |
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | 不可出片 | 纯技能文档仓库，无可运行工程 |

## 非标准链路（状态为出片，但产物不是仓库默认入口直接渲出）

| 仓库 | 实际做法 |
|---|---|
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | monorepo 整装不可行，改用官方 `packages/template-helloworld` 复制到 `_samples` 渲染（`workspace:*` 改写为 npm `^4.0.0`） |
| [Remocn/remocn](https://github.com/Remocn/remocn) | 整仓 900+ 依赖装不动，改为最小 Remotion 宿主 + 仓库内自包含组件 `synthwave` |
| [shadcn-labs/snapcn](https://github.com/shadcn-labs/snapcn) | 整仓 pnpm 落盘不完整，改为最小宿主 + 组件 `cut-lockup`；另修 Chrome 156 `--headless=old` 失效 |
| [charmbracelet/vhs](https://github.com/charmbracelet/vhs) | Windows 侧 ttyd/ConPTY 桥接失效（WebSocket closed 1006），用真实执行的 PowerShell 输出逐帧绘制终端窗口（非 ttyd 实拍） |
| [yongkyuns/noon](https://github.com/yongkyuns/noon) | 本地 Rust 未构建，录制其 GitHub Pages playground（CDP `Page.startScreencast` 实时抓帧 9.4s） |
| [asciinema/asciinema](https://github.com/asciinema/asciinema) | 录制端官方声明不支持 Windows（Unix PTY），走 cast v2 → `agg` GIF → ffmpeg mp4 链路 |
| [codedbytahir/motionforge](https://github.com/codedbytahir/motionforge) | Web 编辑器无 CLI，自建最小宿主引用仓库 `src/lib/remotion` 组件，逐帧截图 |
| [motion-canvas/motion-canvas](https://github.com/motion-canvas/motion-canvas) | 官方 vite 插件不可用，自建最小工程 + Playwright 逐帧导出 120 张 PNG |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | 默认 `workers=auto`（22 进程）拉不起浏览器，改 `--workers 1` + 本地 chrome-headless-shell；官方 `warm-grain` 示例拆 3 段能力演示，整片 22.3s |
| [feitangyuan/onetake](https://github.com/feitangyuan/onetake) | 官方 `templates/comp.html` 一镜到底模板 + `window.__seek` 逐帧抓图；3 段能力演示整片 21.8s，ffmpeg 编码 720p |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | 仓库无示例工程，自写最小调用脚本（`core/render/page.mjs` openDemo + 逐帧截图 + ffmpeg 合片）；`styles/ascii-crt/demo` 扩到 3 段 20.2s |
| [browser-use/video-use](https://github.com/browser-use/video-use) | 云端 Scribe 转录需 ElevenLabs Key，改本机 SAPI 配音 + 手写词级时间轴，走官方 `render.py` 裁切/调色/字幕链路；3 段能力演示整片 20.6s |

> 这些样例都是真机、真命令产出的，但入口经过改写/借用（宿主工程、官方模板、线上 playground、终端画面模拟）；细节见各仓库 `meta.json` 的 `notes_zh`。

## 数据与复现

- 元数据：`manifest.json`（顶层 `_meta` 标注合并来源；`items` 每条含 `sample_status` / `sample_path` / `sample_spec` / `sample_note_zh`）
- 文章新增：`_reports/article_additions.json`（14 条）+ `_reports/article_additions_details/<id>.json`（14 份深度档案，已并入 `showcase\data\details\`）
- 样例：`_samples/<owner>__<repo>/sample.mp4|sample.gif` + `preview.png` + `meta.json`（`cmd`、`render_ms`、`ffprobe`、`notes_zh`）
- 过程报告：`_reports/samples_part1.md`、`samples_part2.md`、`samples_part3.md`、`samples_recovery_a.md`、`samples_recovery_b.md`、`download_report.md`、`sample_playbook.md`、`final_summary.md`
