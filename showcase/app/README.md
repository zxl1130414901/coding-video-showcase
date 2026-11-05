# 代码转视频项目横评（Code → Video Showcase）

面向「代码生成视频」赛道的本地评测前端：把 65 个开源项目（原有 51 + 飞书文章新增 14）的仓库信息、实测渲染数据、65 份深度档案、样例成片与踩坑结论汇总到同一界面。支持筛选、排序、**独立详情页**（`#/repo/<id>`）、样例能力分段播放、2–3 项并排对比与活跃度时间线。全中文 UI、全离线可用、无外部 CDN 与远程字体。

## 快速开始

```powershell
cd F:\coding视频\showcase\app
npm install                 # 依赖已锁定版本，registry 走 npmmirror
npm run link:samples        # 建立 public\samples → F:\coding视频\_samples 的目录联接
npm run dev                 # 开发模式，http://127.0.0.1:5173
npm run build               # 生产构建，必须存在 ..\data\repos.json
npm run preview             # 预览构建产物，http://127.0.0.1:4173
```

质量与验证：

```powershell
npm run lint                # ESLint（typescript-eslint）+ 零报错
npm run test                # Vitest，9 个文件 46 条用例（含 18 条详情页纯函数用例）
npm run format:check        # Prettier 检查（需要时用 npm run format 修复）
npm run smoke               # 需先 build；Playwright preview + file:// 双模式冒烟 + 六张 v2 截图
npx tsc --noEmit            # 类型检查
node scripts/verify-final.mjs   # 终验：65 行矩阵 / 来源筛选 14 条 / 3 个新增详情 / 375-1440 响应式 / 默认 Chrome file:// 播放
node scripts/verify-v3.mjs      # 定版：51 个可播 / 5 个新片逐个播放 >0.5s / 能力演示↔基础样例切换 / features 时间轴 / file:// 复测
```

## 数据接入

- 数据由独立数据流程生成，前端**只读消费** `F:\coding视频\showcase\data\repos.json`，不写该目录。
- 结构为 `{ "meta": { ... }, "repos": [ ... ] }`，字段严格遵循约定（`id/owner/repo/url/stars/sample/scores/...`），枚举字段按真实数据取值：
  - `gpuAcceleration`：`required | optional | none | unknown`
  - `cliHeadless`：`yes | partial | no`
  - `windowsSupport`：`works | workaround | broken | unknown`
- 构建期通过 Vite 虚拟模块 `virtual:repos` 注入数据；`npm run build` 找不到真实文件或条数少于 65 会**直接失败**并给出中文提示。
- 数据来源两段：原有 51 条采集 + 飞书文章 `Te14wRPAJiVpJ1k4O9pcpgX3nHg` 新增 14 条；新增条目带 `source` 字段，关键词搜索「新增」或 `article:` 可筛出这 14 条。
- 同时只读扫描 `..\data\details\<id>.json`（深度档案，65 份）与 `..\_samples\<id>\features.json`（能力分段，51/51 已就绪）。两者都**允许缺失**：缺失档案时详情页回落到 `repos.json` 基础字段并显式标注「档案未就绪」；缺失 features 时只显示视频与实测规格，不白屏、不报错。
- 样例文件体积在构建期用 `stat` 只读注入，用于详情页「体积」实测值；不复制、不锁样例视频文件。
- 仅开发期可回退 `data/repos.sample.json`（3 条占位数据）：`npm run dev` 自动回退，或显式 `npm run build:sample`；界面顶部会显示「占位数据」横幅。
- 缩略图：`predev` / `prebuild` 运行 `scripts/prepare-thumbs.mjs`，从每个 `sample.mp4` 抽取 40%/50%/60% 三帧并选细节最多的一张写入 `public/thumbs/<id>.png`（51 张全覆盖），构建时再复制进 `dist/thumbs/`；抽帧失败才回退复制 `sample.thumbPath`。缺失的缩略图在 UI 中回退为「无样例」标识。

### 样例视频与目录联接

视频/缩略图路径相对 `F:\coding视频`，如 `_samples/x/sample.mp4`。

```powershell
npm run link:samples
# 等价于：New-Item -ItemType Junction -Path public\samples -Target F:\coding视频\_samples
```

- dev / preview 的 `/samples/` 由 Vite 中间件提供，支持 HTTP Range（可拖动进度条），优先走 `public\samples` 联接，未建立时回退真实目录。
- Windows 目录联接（Junction）不需要管理员权限，但要求 NTFS；脚本会校验已有联接的指向，错误时自动重建。
- 脚本内不写中文路径字面量，路径由目录结构推导，并以 UTF-8 BOM 保存，规避 PowerShell 默认 ANSI 读取导致的乱码。

## 单文件离线版

`npm run build` 会产出 `dist/index.html`（用 `vite-plugin-singlefile` 内联全部 JS/CSS/数据，当前约 866 KB），可直接双击打开：

- **经典脚本交付**：构建末尾由 `offlineClassicPlugin` 把 ESM 内联脚本改为尾部经典 `<script>`（IIFE + strict），移除 `type="module"` 与 `crossorigin`，并校验产物零残留；因此 `file://` 下不受模块 CORS 限制。数据仍为构建期内联，运行时无 `fetch`。
- **路由兼容**：只用 hash；`syncLocationHash` 的 `history.replaceState` 带 try/catch，被 `file://` 拒绝时回退到 `location.hash`，初始解析也做兜底，不再因路由异常白屏。
- 数据（`repos.json` 65 条 + 65 份 `details/*.json` + 51 份 `features.json`）已内联进 HTML，`file://` 下无需服务器。
- 缩略图使用 `./thumbs/`（随构建复制）；视频使用 `../../../_samples/`（构建期写入 `window.__SAMPLE_BASE__`）。
- **分发要求**：必须整目录拷贝 `dist`（含 `thumbs/`）；播放视频还需保持到 `_samples` 的三层相对结构。单拷 `index.html` 时 UI 与数据仍可用，缩略图/视频缺失会显示「资源未随文件一起拷贝」，并有顶部离线横幅说明。
- **file:// 实测结论（2026-11-05，Chromium + Edge，启动参数为空）**：dist 原位双击 65 行 / 51 图 / 播放 `currentTime` 1.41s（Edge 1.28s）/ `readyState=4` / 0 error；整目录拷贝与单文件拷贝均为 65 行、无 JS 错误。双击模式无 HTTP Range（拖动进度条不保证）；需要稳定拖拽时用 `start.ps1` 预览模式。

## 目录结构

```text
app/
├─ src/
│  ├─ app 入口        App.tsx / main.tsx
│  ├─ components/     通用组件（表格、筛选、指标卡、环形图、图标、缩略图等）
│  ├─ features/       视图域：overview / matrix / timeline / detail / compare / data
│  ├─ lib/            纯函数与工具（筛选、排序、评分、活跃度、对比、深链、格式化）
│  ├─ styles/         global.css（设计 token、布局、响应式、减少动效）
│  ├─ types/          Repo 数据契约、路由与虚拟模块声明
│  └─ data/           只读数据装载入口
├─ scripts/           link-samples.ps1 / prepare-thumbs.mjs / smoke.mjs / verify-final.mjs / verify-v3.mjs
├─ docs/              DESIGN.md 与 screenshots/
├─ public/            thumbs/（生成）与 samples（目录联接）
└─ vite.config.ts     数据注入、样例中间件、缩略图复制、单文件构建
```

## 功能一览

| 模块       | 能力                                                                                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| 总览       | 总数 / 出片成功 / 未出片 / 总体积指标卡，分类与 Star 区间环形图，分类快捷入口                            |
| 对比矩阵   | 15 列、表头吸顶、点击表头升降序、行悬浮高亮、样例状态与综合分，行可键盘进入详情                          |
| 筛选与搜索 | 分类、样例状态、Windows、GPU、许可证、语言多选 + 关键词，计数实时更新、一键重置                          |
| 详情页     | Hero / 能做什么 / 适用场景 / 能力上限 / 完整工作流 / 差异化与硬短板 / 对比建议 / 样例能力分段 / 实测证据 |
| 对比模式   | 2–3 项并排：基础指标 + 13 行档案级差异（能力上限、场景、工作流、短板），可复制 Markdown                  |
| 时间线     | 近 7 / 30 / 90 天 / 更早四档活跃度分布与最近更新 Top 10                                                  |
| 深链       | `#/repo/<id>`、`#/?view=matrix&category=...`，筛选与对比选择均可分享还原；详情页标题随项目变化           |

## Windows 注意事项

- npm 缓存已通过 `.npmrc` 指向 F 盘，registry 为 `https://registry.npmmirror.com`，不写系统盘缓存。
- `public\samples` 是目录联接，`public/` 已在 `.gitignore` 中忽略；换机器后重新执行 `npm run link:samples` 与 `npm run build`。
- 若 `public\samples` 被普通目录占用，脚本会报错退出，需手动删除后重试。
- 视频路径为中文目录时，浏览器 `file://` 相对路径已做编码处理；`<video>` 通过 preview 中间件支持 Range 请求。
- 冒烟脚本使用 F 盘 `F:\coding视频\_env\ms-playwright` 下的浏览器（`PLAYWRIGHT_BROWSERS_PATH` 已指向该目录），无需联网下载；`verify-final.mjs` 优先用本机默认 Chrome（`channel: 'chrome'`），失败才回退内置 Chromium。

## 当前状态

- 真实数据已接入：65 个项目（原有 51 + 文章新增 14）、65 份深度档案；能力分段 `features.json` **51/51 全覆盖**（7 个升级仓库为 3 段能力 + 6 callout，支持「能力演示 / 基础样例」切换，其余按现有分段内联）。
- 14 个项目缺少缩略图/视频（failed 5 + skipped 9），界面使用「无样例」缩略图占位与「暂无可用样例」空态兜底。
- 默认 Chrome + `file://` 实测可播放（`currentTime` 推进、`readyState=4`、0 error）；无 Range，拖拽体验建议走 `start.ps1` 预览模式。
- 51 条 `sample.spec` 已按 ffprobe 实测回写；`validate-data.mjs` 为 0 error / 0 warning；缩略图 51 张由当前 `sample.mp4` 中间帧重抽。
- 前端不写入 `..\data\`；数据更新后重新 `npm run build` 即可。
