# 代码转视频开源项目对比站

> 65 个「代码 → 视频」开源项目的横向对比站（原有 51 + 飞书文章新增 14），附 51 个真实出片样例。单页应用、全中文、全离线，无外部 CDN 与远程字体。

## 这是什么

- **横向对比**：65 个仓库的 Star、最近更新、分类、语言、渲染后端、输出格式、GPU 依赖、无头 CLI、Windows 支持、安装难度、实测耗时、综合评分，一张表可排序、可筛选。
- **真实样例**：51 个项目在本机实际渲染出的视频/GIF，打开详情即可播放；不是官方宣传片。
- **多视图**：概览（指标卡 + 分类/Star 分布）、对比矩阵（15 列）、时间线（近 7/30/90 天活跃度）、详情抽屉、2–3 项并排对比、Markdown 结论导出、hash 深链。
- **离线优先**：数据在构建期内联进 HTML，缩略图随 `dist` 分发，视频读本地 `_samples`。

本目录是**项目级入口**；前端实现细节见 [app/README.md](app/README.md)，设计说明见 [app/docs/DESIGN.md](app/docs/DESIGN.md)。

## 快速开始

### 方式一：直接打开离线版（推荐先试）

双击 `app\dist\index.html`，或在 `showcase` 目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1
# 选择 [1]
```

- 不需要 Node.js，不需要服务器；`file://` 下数据、缩略图、视频均可用。构建产物使用**经典脚本**（非 ESM，无 `type="module"`、无 `crossorigin`），因此裸双击不会被 file:// 的模块 CORS 策略拦截。
- **2026-11-05 实测（Chromium / Edge，启动参数均为空）**：
  - `dist` 原位双击：65 行矩阵、51 张缩略图、`hyperframes` 详情点击播放 `currentTime` 0 → 1.41s（Edge 1.28s），`readyState=4`，控制台 0 error；
  - 整个 `dist` 拷到 `_tmp\copy-test` 后双击：65 行矩阵、51 张缩略图、0 error（视频因相对路径失效，显示「资源未随文件一起拷贝」）；
  - 只拷 `index.html` 到 `_tmp\single-test` 后双击：仍出 65 行矩阵与全部档案，缩略图/视频回退为占位并给出缺失提示，无 JS 错误。
- **分发要求**：必须**整目录拷贝** `dist`（含 `thumbs\`）；若要播放视频，还需保持 `dist` 到 `_samples` 的三层相对结构。只拷 `index.html` 时界面与数据仍可用，但会明确提示资源未随文件拷贝。
- 双击模式可用，但 `file://` 不支持 HTTP Range，进度条拖动不保证；需要可拖拽的稳定播放体验时，**推荐用 `start.ps1` 的预览模式（方式二）**。

### 方式二：本地预览服务

```powershell
cd F:\coding视频\showcase\app
npm ci                    # 依赖锁定；npm 缓存已指向 showcase\.npm-cache
npm run link:samples      # public\samples → F:\coding视频\_samples 目录联接
npm run preview           # http://127.0.0.1:4173/
```

或运行 `.\start.ps1` 选择 `[2]`：脚本会检测 Node.js、校验/重建目录联接，再用 `Start-Process` 后台拉起 `vite preview` 并打开浏览器。

- `/samples/` 由 Vite 中间件提供，支持 HTTP Range（可拖动进度条）；缩略图由 `dist\thumbs` 提供。
- 若 `public\samples` 联接缺失，中间件会回退到真实 `_samples` 目录，但仍建议执行 `npm run link:samples`。
- `npm run dev` 为开发模式（5173），会热更新；数据更新后生产版需重新 `npm run build`。

### `start.ps1` 说明

| 选项 | 行为 | 前置条件 |
|---|---|---|
| `1` 离线版 | `Start-Process` 打开 `app\dist\index.html` | 已存在 `dist` 构建产物 |
| `2` 预览服务 | 校验 Node.js 与本地 vite；确保目录联接；后台启动 `vite preview`；轮询就绪后打开 4173 | 已 `npm ci`、已 `npm run build` |
| `0` 退出 | 结束菜单 | — |

脚本对中文路径、目录联接指向错误、Node 缺失、端口占用、启动超时均有中文提示；脚本以 UTF-8 BOM 保存，避免 PowerShell 5 默认 ANSI 读取导致乱码。

## 目录结构

```text
showcase/
├─ app/                     前端（Vite + React + TypeScript）
│  ├─ src/                  入口、组件、视图、纯函数、样式、数据契约
│  ├─ scripts/              link-samples.ps1 / prepare-thumbs.mjs / smoke.mjs / verify-final.mjs / vite-build-sample.mjs
│  ├─ docs/                 DESIGN.md + screenshots/（界面截图与终验截图）
│  ├─ public/               thumbs/（构建生成） + samples（目录联接，指向 _samples）
│  ├─ dist/                 index.html（单文件）+ thumbs/（51 张缩略图）
│  ├─ README.md             前端使用与开发说明
│  └─ package.json / vite.config.ts
├─ data/                    只读数据
│  ├─ repos.json            65 条仓库主数据（前端构建期注入，含文章新增 14 条）
│  ├─ details/              65 份深度档案
│  ├─ evidence.json         645 条取证记录（原有 51 条；新增 14 条以档案内 evidence 为准）
│  └─ repos.sample.json     3 条开发占位数据（仅 dev / build:sample 回退）
├─ scripts/
│  └─ validate-data.mjs     repos.json / evidence.json / manifest.json 自洽性校验
├─ start.ps1                一键启动（离线版 / 预览服务）
└─ README.md                本文件
```

## 数据来源与口径

- **筛选口径（原有 51 条）**：GitHub `pushed_at ≥ 2025-01-01`、非 archived、非 fork。检索原始结果 3059 条，去重 2915 条，纳入 **51** 个（9 个 `git clone --depth 1`，42 个 codeload 归档）。
- **新增来源（14 条）**：飞书文章 `Te14wRPAJiVpJ1k4O9pcpgX3nHg` 的 14 个仓库，按同一字段契约并入；条目带 `source = article:Te14wRPAJiVpJ1k4O9pcpgX3nHg`，关键词搜索「新增」或 `article:` 可筛出这 14 条。原有 51 条除 `sample.spec` 按实测回写外，其余字段值未改动。
- **主数据**：`data/repos.json`，结构 `{ meta, repos }`；`meta.counts = 65 / ok 51 / failed 5 / skipped 9`，`meta.sources` 标注「原有采集」与「文章新增」两段来源，`meta.criteria` 与数据一致。
- **详情档案**：`data/details/<id>.json` 共 **65** 份（原有 51 + 文章 14）；新增档案的 `evidence` 平均 3 条/仓库，用于详情页实测证据区。
- **能力分段**：`_samples/<id>/features.json` 已覆盖全部 **51/51** 个 ok 仓库；7 个升级仓库为 3 段能力 + 6 个 callout（20–24s 三段式 `sample.mp4`，旧片保留 `sample_basic.mp4`），详情页可切换「能力演示 / 基础样例」。
- **旧片覆盖**：51 个 ok 中 **44 个**保留 `sample_basic.mp4`；7 个没有旧片（6 个原本只有单段直出，`maloyan/manim-web` 为 GIF 源），这些仓库切换「基础样例」会显示缺口提示。
- **规格口径**：`sample.spec`（`width/height/fps/durationSec/frames/bytes/codec`）全部由 2026-11-05 的 `ffprobe` 实测回写；缩略图由构建期从当前 `sample.mp4` 的 40%/50%/60% 帧中择优生成。
- **取证**：`data/evidence.json` 保留原有 51 条的 **645** 条取证（`filesRead`、`sampleRef`、`scoreBasis`、`claims`）；新增 14 条不另建取证，改以各自详情档案的 `evidence` 为准。
- **样例验收**（数据流程侧）：ffprobe 可读、时长 ≥ 2s、帧率 ≥ 24fps、中间帧非纯色；不达标的产物不计入 `ok`。
- **评分口径**：`scores` 是本次在 **Windows 11 + RTX 4060 Laptop** 环境下的实测评分，不是官方排名、也不代表代码质量评测。`installComplexity` 按本次实测总耗时（含依赖安装）定档：1 ≈ 1 分钟、2 ≈ 3 分钟、3 ≈ 10 分钟、4 ≈ 30 分钟、5 超过 30 分钟或装不上。
- **未采集字段**：原有 51 条的 `forks`、`openIssues`、`updatedAt` 写 `null`，不做猜测；文章新增的 14 条带 GitHub API 实值。详情页与表格对空值有占位处理。

完整采集与实跑记录见上一级 `F:\coding视频\README.md`（含 5 个失败项与 9 个不可出片项的根因、非标准渲染链路说明）。

## 重新生成数据与重建

数据采集/视频渲染是独立流程，**本仓只读消费**，不会重跑渲染；样例已落盘在 `F:\coding视频\_samples`。

1. **生成数据**（数据流程侧，不在本目录）
   - 输入：GitHub API 元数据 `F:\coding视频\manifest.json`（顶层 `_meta` + `items`）+ `_samples\<id>\meta.json`（ffprobe 实测规格）+ 文章新增 `_reports\article_additions.json` 与 `_reports\article_additions_details\<id>.json`。
   - 输出：覆写 `data/repos.json`、`data/details\` 与 `manifest.json`；字段契约见 `app/src/types/repo.ts`。
   - 说明：采集脚本保留在 `F:\coding视频\_tmp`（如 `build_data.py`），不属于交付产物。
2. **校验数据**
   ```powershell
   cd F:\coding视频\showcase
   node scripts/validate-data.mjs
   ```
   当前结果：`ok: true`，**0 error / 0 warning**；counts 65 / ok 51 / failed 5 / skipped 9；645 条原有取证 + 14 份档案；51 条 `sample.spec` 已按 2026-11-05 ffprobe 实测回写，`spec.bytes` 漂移归零。
3. **重建前端**
   ```powershell
   cd F:\coding视频\showcase\app
   npm ci
   npm run link:samples
   npm run build
   ```
   `prebuild` 会从每个 `sample.mp4` 抽取 40%/50%/60% 三帧、选细节最多的一张生成 `public/thumbs/<id>.png`（51 张全覆盖，14 个无样例仓库跳过）；`build` 产出 `dist/index.html`（单文件）并复制 `dist/thumbs/`。
4. **可选验证**
   ```powershell
   npm run lint
   npm run test        # Vitest：9 个文件 46 条用例
   npx tsc --noEmit
   npm run preview     # 另开终端
   npm run smoke       # 需先 build，Playwright 冒烟 + 截图
   node scripts/verify-final.mjs   # 终验：65 行矩阵 / 来源筛选 / 3 个新增详情 / 四档响应式 / 默认 Chrome file:// 播放
   ```
- npm 缓存与临时目录：`showcase\.npm-cache`（由 `app\.npmrc` 指定）；不写系统盘缓存。

## 已知缺口

| 项 | 数量 | 说明 |
|---|---:|---|
| 渲染失败 `failed` | 5 | 原有 2：`dmtrKovalenko/fframes`（rust-skia 预编译包与 MSVC 14.43 STL 链接不兼容）、`openvideodev/react-video-editor`（Studio `CanvasPanel` 依赖远程字体，初始化不收敛）；新增 3：`vincentsch/explainroo`（400 MB 语音模型拉取失败）、`kaomei/stickman-video-director`（`autopilot preview` 报 EISDIR）、`JohnHeibel/PDoomVideo`（`--clip` 渲染挂死） |
| 不可出片 `skipped` | 9 | 原有 5：`leonid-shevtsov/headless`、`3b1b/videos`、`bangtutorial/bang-motion`、`showlab/Code2Video`、`krassowski/jupyter-manim`；新增 4：`threerocks/sweety-handdraw-video`（缺宿主生图工具）、`pedrovelasquez9/fragua`（1.6 GB Whisper 模型超预算）、`yihui-dev/awesome-opus5-5-videos`（纯提示词合集）、`remotion-dev/skills`（纯技能文档） |
| 无缩略图/无视频 | 14 | 即上述 5 + 9；表格缩略图位置显示「无样例」，详情播放区显示「暂无可用样例」，不是空白破图 |
| `forks` / `openIssues` / `updatedAt` | 原有 51 条为 null | 未采集，UI 不做猜测；新增 14 条带 GitHub API 实值 |
| `homepage` 缺失 | 40/65 | 该字段保留但当前 UI 未展示（详情页只给 GitHub 仓库与本地目录） |
| `renderBackends` / `outputFormats` 为空 | 3 / 2 | 表格以「—」占位 |
| 样例低于 720p | 4 | `motionforge` 880×532、`motion-canvas` 960×540、`ffmpeg-concat` 640×360、`editly` 640×640（沿用仓库默认输出，未放大） |
| 原生 GIF 样例 | 2 | `asciinema/agg`、`maloyan/manim-web`，详情页用 `<img>` 展示 |
| 非仓库默认入口渲出 | 11 | 原有 7 条 + 新增 `hyperframes`（改单 worker + 本地 headless）、`onetake`（截前 10s）、`lemo-opuscar`（自写最小脚本）、`video-use`（本机配音替代云端转录）；逐项见上级 README「非标准链路」 |

## 体积与交付边界

| 产物 | 体积 |
|---|---:|
| `app\dist\index.html`（数据 + JS + CSS 全内联） | 865 KB |
| `app\dist\thumbs\`（51 张 PNG） | 3.94 MB |
| 51 个样例视频/GIF（`_samples\<id>\sample.mp4|gif`） | 222.1 MB（含 7 个 20–24s 三段式新片） |
| `data\repos.json` + `evidence.json` | 369 KB |
| `app\docs\screenshots\`（21 张 PNG） | 3.12 MB |

**边界（必须知道）**：

1. **只拷走 `index.html` 会失去全部缩略图与视频**，但**不会再白屏**：界面、65 条数据、筛选与详情档案均可正常使用，缩略图回退为「无样例」并提示「资源未随文件一起拷贝」。
2. 离线分发需要保持以下最小结构（相对路径写死在构建期）：
   ```text
   <任意根目录>\
   ├─ showcase\app\dist\index.html
   ├─ showcase\app\dist\thumbs\*.png
   └─ _samples\<id>\sample.mp4|gif        # 51 个 ok 项目
   ```
   `dist` 到 `_samples` 的层级必须是三层（`../../../_samples`）；否则视频 404，界面会给出缺失提示。只搬 `dist` 目录（含 thumbs）仍可看表格与缩略图，但视频不可播。
3. 预览服务模式对目录位置不敏感（`/samples/` 由中间件提供），但换机器需要 Node.js 并重新 `npm run link:samples`。
4. `_samples` 目录含渲染中间帧，**最小分发只需 51 个 `sample.mp4|gif`（222.1 MB）+ 51 张缩略图（3.94 MB）**，不必整体拷贝。

## 产物清单

| 路径 | 体积 | 说明 |
|---|---:|---|
| `showcase\README.md` | 11.3 KB | 项目级说明、口径、重建流程、交付边界 |
| `showcase\start.ps1` | 5.9 KB | 一键启动菜单（离线版 / 预览服务） |
| `showcase\app\dist\index.html` | 865 KB | 单文件离线应用，已注入 65 条真实数据 |
| `showcase\app\dist\thumbs\` | 3.94 MB / 51 文件 | 样例缩略图（`<id>.png`，从新片中间帧重抽） |
| `showcase\app\src\` | 0.16 MB / 44 文件 | React + TS 源码（组件/视图/纯函数/样式/类型） |
| `showcase\app\scripts\` | 6 文件 | 目录联接、缩略图准备、冒烟、终验、定版终验、占位构建 |
| `showcase\app\docs\DESIGN.md` | 7.1 KB | 信息架构、交互流、设计 token、无障碍 |
| `showcase\app\docs\screenshots\` | 3.12 MB / 21 文件 | 概览 / 矩阵 / 详情 / 对比 + `final-*` / `final-v3-*` / `fix-file-*` 验收截图 |
| `showcase\app\README.md` | 6.4 KB | 前端开发与运行说明 |
| `showcase\app\package.json` + `package-lock.json` | ~134 KB | 锁定依赖版本 |
| `showcase\data\repos.json` | 169 KB | 65 条仓库主数据（只读） |
| `showcase\data\details\` | 65 份 | 深度档案（原有 51 + 文章 14） |
| `showcase\data\evidence.json` | 200 KB | 645 条取证记录（原有 51 条） |
| `showcase\data\repos.sample.json` | 6 KB | 3 条开发占位数据 |
| `showcase\scripts\validate-data.mjs` | 10 KB | 数据自洽性校验（0 error / 0 warning，字节漂移归零） |
| `F:\coding视频\_samples\<51 id>\sample.mp4|gif` | 222.1 MB | 真实样例；7 个新版为 20–24s 三段式能力演示，旧片保留 `sample_basic.mp4` |
| `F:\coding视频\showcase\app\public\thumbs\<id>.png` | 3.94 MB / 51 张 | 从当前 `sample.mp4` 中间帧重抽的缩略图（构建复制进 `dist\thumbs`） |
| `F:\coding视频\_samples\<id>\features.json` | 51 份 | 能力分段与 callout（站点构建期内联，只读） |
| `F:\coding视频\_reports\article_additions*.json` | — | 文章新增 14 条的源数据与深度档案（合并输入） |

> 未列入：`app\node_modules`（本机依赖，可 `npm ci` 重建）、`_samples` 内渲染中间帧与 `_tmp` 采集脚本（非交付物）。
