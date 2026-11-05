# Eidoverse Video 演示脚本（v2）

## 定位
SkyeShark/Eidoverse Video 是「给 AI agent 用的电影工作室」：场景 = 一个 `scene.json` + 一个 `renderFrame(t)` 脚本，
Deno + three.js **WebGPU（TSL 节点材质）** 逐帧渲染，ffmpeg 编码；GPU 计算与节点材质全程在显卡上，CPU 只负责喂 t。
旧样例只有 10 秒的 VRM 站立巡游（`examples/basic_vrm.json`），没有体现「后处理栈 / 材质与反射 / 机位调度」这三件事。

## 三段能力
1. **VRM 角色 + MToon 材质 + 金属地面反射（0-7.2s）**：`examples/v2_fog.js` 载入 `claude.vrm`，走 `VRMLoaderPlugin` → `userData.vrm`，
   播放 VRMA `idle` 骨骼动画；地面 `MeshStandardNodeMaterial`（roughness 0.28 / metalness 0.9）接收实时光照与反射，证明 PBR 节点材质可直接出片。
2. **TSL 后处理栈：depth_fog（同段）→ neon_edges（7.2-14.4s）**：`CustomEffectsDeno.applyTo` 把 TSL 后处理挂到场景上，
   第一段用 `depth_fog`（密度 0.05）做空气纵深，第二段换成 `neon_edges`（青色描边 + 阈值 0.035）把同一模型变成霓虹线框观感；
   两段共用同一套渲染管线，只换 effects 名称与参数，证明后处理是数据驱动的。
3. **blueprint 工程蓝图 + 机位调度（14.4-21.6s）**：第三段切 `blueprint`（纸色/网格/墨线 + 正交深度转换，需要相机 near/far），
   相机从低角度环绕（y 0.85→1.20，半径 2.6→2.4）把角色变成「技术图纸」；`renderFrame(t)` 是纯函数，同 t 必出同帧。

三段拼接 = 21.6s，1080p / 30fps，一次 `python eido.py render` 出一段 mp4，最后 ffmpeg concat。

## 规格
- 1920×1080 / 30fps / 3×7.2s = 21.6s / 3 段 / 4-6 条中文标注
- 命令：`python eido.py render eidoverse/examples/v2_fog.json`（neon / blueprint 同理）
- 场景脚本与 config 都在仓库内 `eidoverse/examples/`，config 里 `skipPreflightQA: true`（本片不接 VRM lipsync/语音）

## 实测成本
- 上批 720p 300 帧纯渲染 18.2s（约 16.5fps）；本批 1080p，同样的 7.2s 段落在数十秒级，
  deno 进程启动 + 模块图加载/编译仍是主要固定开销（每段一次调用约数百秒）。

## 踩坑
- 必须用 `GPU_ADAPTER` / `GPU_DEVICE` 构造 `THREE.WebGPURenderer`，否则 three 自建 GPU 句柄，readback 全黑。
- `_fx.update(t)` 只推 uniform 不渲染，每帧之后必须 `await renderer.renderAsync(scene, camera)`。
- VRM 必须注册 `VRMLoaderPlugin`，否则按普通 GLB 解析：没有 `userData.vrm`，MToon 身体发黑。
- 本片不带音频（示例角色不说话，日志里的 lipsync 警告是预期行为）。
