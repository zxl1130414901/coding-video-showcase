# template-three 能力演示脚本（v2）

## 选型依据
template-three 的定位是 **React Three Fiber + Remotion**：用 React 声明式地写 3D 场景，动画完全由帧号驱动，视频可以用作 3D 物体的纹理。模板自带的 `Scene` 只演示了一台会转的手机；本片把它的能力拆成三层递进：**视频纹理 → 3D 空间与相机 → PBR 材质与灯光**。

## 三段演示
1. **0–10s｜视频帧贴到 3D 物体上**
   `<Video>` 的 `onVideoFrame` 把每一帧画进 `OffscreenCanvas`，再用 `CanvasTexture` 贴到手机的屏幕 `shapeGeometry` 上；弹簧入场 + 持续 `interpolate` 旋转。
   证明点：视频不是后期贴片，而是每帧都更新 3D 纹理；入场与旋转都是帧驱动。
2. **10–20s｜多层视频平面 + 相机推进**
   5 张带视频纹理的平面沿 Z 轴错层排布，蓝/粉双色 tint，相机沿 Z 轴从 17 推到 9，穿层而过。
   证明点：同一纹理可在多物体间复用，空间构图与相机路径由帧号插值。
3. **20–30s｜PBR 材质与三点布光**
   `torusKnotGeometry` + `meshPhysicalMaterial`（metalness 0.65 / clearcoat 1），三盏点光（白 / 蓝 / 粉）+ 地面网格，相机绕物环绕。
   证明点：物理材质、清漆层与多光源在 Remotion 里可直接渲染。

## 渲染方式
新建 `ThreeCapabilities` 组合（900 帧 / 30fps / 1920×1080），Remotion CLI 单 worker + 系统 Chrome（`--gl=vulkan`）渲染；poster.py 烧入中文标注。

## 未做到
- 模板自带的 `phone.mp4` 是占位素材（画面写着 “Drop your video here”），所以第一幕的“视频纹理”内容本身是占位画面。
- 未做后处理（bloom / 景深），只有原生 R3F 光照。
- 场景未使用外部 GLTF 模型，全部是程序化几何体。
