# glslViewer 能力演示脚本（v2）

## 选型依据
glslViewer 的核心是**一个极轻的 GLSL 沙盒**：给它一个 `.frag`，它就按 `u_time` 逐帧重算整幅画面，并且支持双缓冲反馈与多缓冲管线。仓库自带的 `examples/*.frag` 多是语法自检（渐变、贴图坐标），不足以体现能力，所以本片用三段**自写 shader**（只用 glslViewer 的 uniform 契约，不引第三方库）来展示它真正的三种用法。

## 三段演示
1. **0–8s｜SDF 光线步进 + 法线光照（sdf_metaballs.frag）**
   4 个球体用 smooth-min 融合成流动的金属球，96 步 raymarch 求交，用中心差分求法线，再叠平行光 + 边缘光。
   证明点：每帧 1280×720 全屏跑 96 次循环，仍是实时；这是纯 GPU 片段着色器能力。
2. **8–16s｜双缓冲反馈轨迹（feedback_trails.frag）**
   读取上一帧 `u_doubleBuffer0`、衰减 0.986 后叠加两颗反向公转的“彗星”与旋转三叶线，轨迹靠帧间累积自然生长。
   证明点：glslViewer 的 ping-pong framebuffer，不是单帧无状态着色。
3. **16–24s｜域扭曲 FBM 流体（fbm_flow.frag）**
   5 层 fbm 噪声 + 两层域扭曲，颜色在深蓝与橙色之间过渡。
   证明点：同一条 headless 录制链路可以承载计算量更重的生成式画面。

## 渲染方式
`glslViewer <shader>.frag --headless -w 1280 -h 720 -E record,out.mp4,0,8,30`，单进程逐段录制；poster.py 统一到 1080p30 并烧入中文标注。

## 已知限制
- 三段 shader 为演示自写（仓库 examples 只覆盖语法自检），未使用 lygia 依赖库。
- 视频纹理输入（examples/video.mp4 作为 u_tex0）在 headless 下未成功绑定，因此未做“视频后处理”段。
- 多 shader 串联（scene + postprocess）实测输出与单 shader 相同，未采用。
