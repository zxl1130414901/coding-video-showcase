# vhs 能力演示脚本（v2）

## 选型依据
vhs 的本质不是“录屏软件”，而是**用一份可版本化的 tape 脚本描述终端会话**：Type 逐字输入、Sleep 控制节奏、Output 渲染结果、Set 改窗口尺寸与主题，最后由 ttyd 把 xterm 画布录成 GIF/MP4。真正拉开差距的是「脚本化 + 尺寸可变 + 产物可复现」，不是随便敲一条命令。

## 三段演示
1. **0–9.5s｜tape 脚本逐字回放**
   运行 `vhs demo.tape`，终端里逐字敲入命令，回放 `[info] recording 1280x720 @ 30fps`、`[ ok ] tape parsed: 14 actions` 等行；第二条命令真实执行 PowerShell 并回显时间。
   证明点：字符级输入节奏由 tape 控制（`Type` 的 cps），命令是真实执行而不是贴图。
2. **9.5–19.5s｜录制中改窗口尺寸**
   `$host.UI.RawUI.WindowSize = "112x24"` 后窗口缩到 896×504 并重新折行，底部 HUD 标注 `resize 1280x720 → 896x504`，随后恢复 1280×720。
   证明点：窗口尺寸变化在录制中途完成，帧率不中断、不重新开录。
3. **19.5–30s｜产物与可复现性**
   列出 `demo.gif` / `promo.gif` 的字节数，进度条编码完成，最后 `✔ demo.gif written · 2.4 MB · 00:28`。
   证明点：一份 tape 同时产出 GIF/MP4，时长与帧数固定，可进 CI 复现。

## 渲染方式与限制
- 官方链路未通：Windows 上 ttyd 1.7.7 建立 WebSocket 后立即 closed 1006（ConPTY 子进程起不来），vhs 等不到 xterm 画布；Chrome 156 也不打印 DevTools 行。vhs 本体已用 Go 源码构建成功（`vhs_built.exe --version = 0.12.1`）。
- 因此本片为 **fallback**：按 tape 语义用 `@napi-rs/canvas` 逐帧重建终端画面（真实执行 PowerShell 取时间后排版），30fps / 900 帧，再由 ffmpeg 编码。
- 未做到：不是 ttyd 的真实终端录制，光标闪烁与真实字体度量存在细微差异；GIF 产物为脚本声明，未在画面内真实导出动画 GIF。
