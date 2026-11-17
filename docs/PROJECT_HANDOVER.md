# 《苍穹觉醒：雷霆肉鸽》项目总结与交接文档

> 更新日期：2026-11-17（UTC+8）  
> 代码仓库：https://github.com/ZhangMingZhao1/game  
> 关联规范：[`docs/ASSET_GENERATION_SPEC.md`](./ASSET_GENERATION_SPEC.md)（原创机甲美术、背景、立绘与音频生成规范）

---

## 1. 项目概览

**《苍穹觉醒：雷霆肉鸽》（Aether Awakening: Shmup Rogue）** 是一款基于 Web 原生技术栈构建的**纵向卷轴机甲射击 + 局内肉鸽构筑（Shmup × Roguelike）**网页游戏。

### 核心技术栈
- **语言与构建**：TypeScript `5.6`（开启 `strict`）+ Vite `6`（目标 `ES2022`，零第三方重型游戏引擎依赖）
- **渲染架构**：
  - 战场本体：HTML5 `Canvas 2D`（支持 DPR 自适应、离屏发光/弹体/爆炸缓存、固定物理步长细分与插值渲染）
  - 界面与演出：原生 DOM + CSS3（标题选机、机库商店、升级四选一、宽屏左右战术数据侧栏、DNF 风格全屏觉醒立绘 Cut-in）
- **音频架构**：Web Audio API 实时合成背景音乐与战斗音效 + Web Speech API（支持中/日觉醒台词语音播报，预留外部音频替换能力）
- **测试体系**：基于 Node `assert/strict` + `tsx` 的 11 个无头确定性单元/集成测试脚本，核心世界模拟（`src/core/`）与 DOM/Canvas 完全解耦

---

## 2. 已完成功能总结

### 2.1 三台原创机甲与专属双形态变形系统
玩家可通过键盘 `C` 键或画面右下角“变形”按钮自由切换形态（冷却 `1.0 秒`，变形过渡演出 `0.35 秒`，不耗蓝、不提供无敌帧，两种形态存在明确战术取舍）：

| 机体 ID | 机体名称 | 默认形态（主形态） | 变形形态（副形态） | 核心取舍与机制差异 |
| :--- | :--- | :--- | :--- | :--- |
| `raiden` | **赤色雷霆 Mk-II**（A-01 赤曜强袭型） | **强袭机甲模式**（`assault`） | **赤曜飞翼模式**（`flight`） | **强袭**：护甲 `+3`、宽散射火神炮（弹数 `+1`）、追踪导弹 `+2`、移速 `×0.9`、判定半径 `11`。<br>**飞翼**：移速 `×1.25`、攻速 `×1.18`、窄束集中速射、小判定半径 `7`、护甲 `-2`、单轮导弹减少。 |
| `falcon` | **苍蓝猎鹰 Zero**（X-02 苍隼高机动型） | **贯穿狙击模式**（`sniper`） | **双影分体阵列**（`split`） | **狙击**：主炮伤害 `×1.2`、暴击率 `+10%`、攻速 `×0.9`、判定半径 `8`。<br>**双影**：左右展开镜像分体僚机，同步发射三路脉冲激光，副武次元刃攻速 `×1.3`，护甲 `-1`。 |
| `wasp` | **紫电黄蜂 Ayla**（H-03 紫蜂指挥型） | **巡航母机模式**（`cruise`） | **蜂巢要塞模式**（`fortress`） | **巡航**：标准机动推进与集中蜂群索敌。<br>**要塞**：移速 `×0.6`、护甲 `+4`、副武伤害 `×1.45`、电弧额外穿透跳跃 `+1`、判定半径 `12`，并每 `6 秒`（初次切换 `3 秒`）生成 1 层**蜂巢护盾**抵消一次敌弹伤害。 |

### 2.2 武器进化与 DNF 风格三系三阶觉醒
- **局内空投胶囊（击落补给运输机掉落）**：
  - `M 主炮核心`：主武器升至 `Lv.1–8`，提升弹道数量、宽度或穿透。
  - `S 副弹核心`：副武器升至 `Lv.1–6`，强化追踪导弹、回旋次元刃或自律蜂群。
  - `A 三色觉醒核心`：胶囊颜色按赤红/苍蓝/紫电周期轮换；拾取**异色**切换觉醒大招流派，拾取**同色**将当前觉醒突破至 **二次觉醒（II阶）** 与 **真·觉醒（MAX阶）**。
- **觉醒大招释放（`X` / `K` 键或右下角觉醒按钮）**：
  - 每次释放消耗 `100` 点觉醒能量；通过提升**魔力（`mana`）**属性可将能量上限扩容为 `200 / 300 ...`，支持积攒多发大招连续释放。
  - 触发时弹出驾驶员立绘 Cut-in 横幅、金属闪光铮鸣与中/日台词语音：
    - **赤红·天穹歼灭炮**：前方巨型粒子光柱持续蒸发敌弹并贯穿暴击（真觉结束附带全屏终焉爆炸）。
    - **苍蓝·次元裂空斩**：冻结全场敌机并高频次元斩击，结束时按累计伤害结算次元崩裂。
    - **紫电·万雷神罚阵列**：开启期间无敌、全武器攻速超载，并周期性降下连锁落雷。

### 2.3 10 波关卡流程、小 Boss 与难度曲线
- **单波时长**：第 1–10 波基础时长为 `90–108 秒`（公式：`clamp(90 + (wave - 1) * 2, 90, 108)`）。
- **每波固定小 Boss（关底守卫 `miniBoss`）**：
  - 每波进行到约 `60 秒` 时生成关底守卫，清空当前敌弹、暂停普通杂兵刷新，顶部 HUD 切换为 `GUARDIAN` 与首领血条，击败奖励 `5,000` 分。
- **第 5 / 10 波双首领递进**：
  - 第 5 波与第 10 波不会跳过小 Boss；必须**先击败当波小 Boss、清空场上残余杂兵并达到波次时限**后，才正式登场三阶段大 Boss（第 5 波：钢铁蛛后 `spider`；第 10 波：苍穹审判号 `valkyrie`）。
- **前期手感与逐波压力（`wavePressureFor`）**：
  - 玩家基础移速设为 `120`（配合局内速度词条成长），避免初始移速过快导致弹幕毫无威胁。
  - 随波次递增缩短刷怪间隔、提高双机/三机编队概率（第 1 波 `35%` 双机，第 2 波起开放三机编队）、缩短敌机首发开火延迟并提升敌弹速度与连射频率。

### 2.4 双轨经济（废料 vs 得分）与机库肉鸽构筑
- **废料（Scrap）**：严格绑定被击毁敌机坐标抛出（无凭空刷出），用于波次结算机库（Hangar）：
  - 购买/合成最多 4 种外挂**武器吊舱（Pod）**，同名吊舱自动升阶（`I → IV`），激活 `实弹 / 能量 / 爆破 / 蜂群 / 觉醒` 五大套装羁绊。
  - 购买**被动插件（Item）**，支持商店槽位锁定与付费重随（Reroll）。
- **得分（Score）**：与废料完全独立，由 `击杀即时分 + 敌机爆出的六档面额分数晶体（靠近自动吸附）+ 波次无伤通关奖励（NO HIT BONUS）` 组成，最高分持久化在 `localStorage`。
- **升级强化（Level-up）**：战斗内积累经验升级，波次结算时四选一强化基础属性（速度、护甲、魔力扩容、攻速、暴击、拾取范围、收获/幸运等）。

### 2.5 响应式战场与多端输入一致性
- **画布自适应**：横屏桌面（视口宽度 `>= 720` 且宽高比 `>= 1.25`）使用 `1280 × 720` 宽屏逻辑战场并展示左右战术面板；竖屏移动设备自动切换 `480 × 720` 逻辑战场，切换窗口大小时按比例平滑迁移实体横坐标且不放大移速。
- **输入统一限速**：PC 鼠标左键拖拽、移动端触屏手势、键盘方向键与手柄摇杆全部受同一机甲移速上限（及 `Shift` `45%` 精准低速）约束；大幅帧间隔在 `stepWorld` 内部按 `1/60s` 子步切分并等比分配拖拽增量，彻底消除低帧率拖拽超速问题。

---

## 3. 目录结构与模块职责

```text
.
├── index.html                  # 页面骨架：Canvas 画布、左右侧栏、Cut-in 容器、触控快捷按钮
├── package.json                # 脚本配置（dev / build / preview）与开发依赖
├── build.cmd / dev.cmd         # Windows 本地一键构建 / 启动脚本
├── docs/
│   ├── ASSET_GENERATION_SPEC.md # 原创机甲版全量美术/音乐生成规范与提示词模板
│   └── PROJECT_HANDOVER.md      # 项目总结与交接文档（本文档）
├── public/assets/              # 静态美术与音频资源根目录（按规范命名）
│   ├── backgrounds/wave01_orbit/wave01_orbit_far.jpg
│   └── mecha/player/
│       ├── player_crimson_assault_mech.png    # A-01 强袭机甲形态（1024×1024 透明 PNG）
│       ├── player_crimson_assault_flight.png  # A-01 赤曜飞翼形态（1024×1024 透明 PNG）
│       └── player_crimson_assault_base.png    # 早期备份基础图
├── src/
│   ├── main.ts                 # 应用主入口：状态机（标题/战斗/机库/暂停/结算）、主循环、事件音效绑定
│   ├── data/
│   │   └── config.ts           # 静态配置表：三台机体、双形态定义、三系觉醒、吊舱、被动道具、升级池、危险等级
│   ├── core/
│   │   ├── world.ts            # 确定性核心模拟：移动、变形、刷怪、Boss AI、弹幕碰撞、擦弹、大招、波次流转
│   │   ├── scoring.ts          # 计分系统：敌机分值、六档分数晶体拆分算法、无伤波次结算奖励
│   │   └── shop.ts             # 机库商店：按波次与幸运加权的品质随机、价格计算、锁定与刷新
│   ├── render/
│   │   └── renderer.ts         # Canvas 2D 渲染器：精灵/背景异步加载与程序化降级绘制、战场 HUD、特效缓存
│   ├── cutin/
│   │   └── awakeningCutin.ts   # DNF 风格觉醒全屏立绘演出控制器与驾驶员矢量头像生成
│   ├── audio/
│   │   └── sound.ts            # Web Audio 合成器 BGM/SFX 与中/日觉醒台词语音播报
│   ├── ui/
│   │   ├── input.ts            # 键盘、鼠标/触屏相对拖拽、手柄输入采集
│   │   └── screens.ts          # 标题、设置、机库商店、暂停、结算界面与左右侧栏 DOM 渲染
│   └── styles/
│       └── main.css            # 全局科幻 HUD 样式、响应式布局与 Cut-in 动画
└── tests/                      # 11 个确定性自动化回归测试（使用 tsx 直接运行）
```

---

## 4. 美术与音频素材进度及交接指南

### 4.1 当前已接入素材
| 类别 | 工程内路径 | 游戏内用途与尺寸 | 状态 |
| :--- | :--- | :--- | :--- |
| 玩家机甲 | `public/assets/mecha/player/player_crimson_assault_mech.png` | `raiden` 强袭机甲模式（`72 × 92`） | 已上线 |
| 玩家机甲 | `public/assets/mecha/player/player_crimson_assault_flight.png` | `raiden` 赤曜飞翼模式（`82 × 78`） | 已上线 |
| 关卡背景 | `public/assets/backgrounds/wave01_orbit/wave01_orbit_far.jpg` | 第 1 波近地轨道 `far` 远景无缝滚动层 | 已上线 |

> **安全降级机制**：`src/render/renderer.ts` 对所有外部图片均采用异步解码 + `image.complete && image.naturalWidth > 0` 校验。尚未交付图片或加载失败时，自动回退到原有的 Canvas 几何/矢量绘制逻辑，保证游戏随时可玩、测试随时可跑。

### 4.2 紧接下一步美术任务（按“第一关完整美术切片”推进）

当前优先把 **Wave 1（近地轨道）** 的视觉完整度跑通，再横向铺开后续关卡与其他机体：

1. **【当前待生成 #1】第一关中景透明层**：`public/assets/backgrounds/wave01_orbit/wave01_orbit_mid.png`
   - **规格**：`1280 × 1440`（或同比例高清竖图），**透明背景 PNG**，顶部与底部严格纵向无缝循环（Vertical Seamless）。
   - **构图**：左右两侧边缘为纵向延伸的废弃轨道空间站桁架、太阳能帆板残骸与微弱地球蓝色大气弧光；**中央至少 520px 宽区域保持完全透明干净**，不遮挡底层星云远景与战斗弹幕。
   - **可直接使用的正面提示词**：
     ```text
     原创科幻机甲纵向卷轴射击游戏背景素材，第一关“近地轨道”中景透明图层（Midground Layer）。
     画面左右两侧边缘分布沿垂直方向延伸的巨型废弃轨道空间站桁架、破损太阳能帆板阵列、船坞机械骨架与少量散落的装甲模块，左外侧带有柔和的地球蓝色大气层边缘弧光与冷青色散射光；左上方主光源，金属结构受光面呈冷灰蓝与少量暖金警示灯点缀，背光面深邃低对比。
     俯视约60度正交游戏镜头，与纵向卷轴射击视角一致。画面中央至少520像素宽的垂直通道保持完全透明干净，只允许极少量微弱半透明宇宙尘雾掠过边缘，绝不遮挡底层的星空远景，也不干扰红色玩家机甲、敌机、弹幕和掉落物的识别。
     顶部边缘与底部边缘的桁架走向、残骸位置、光影和透明度必须严格纵向无缝衔接（Vertical Seamless Tileable），上下拼接滚动时不能出现断层或硬切边。
     1280×1440竖向构图，干净的Alpha透明背景PNG，sRGB，硬表面科幻机械细节，中低对比度背景层，无角色，无敌机，无子弹，无文字，无UI，无水印，无边框。
     ```
   - **负面提示词**：
     ```text
     高达，Gundam，现有动漫或游戏标志，品牌Logo，可读文字，水印，UI，边框，伪棋盘格像素，不透明纯黑背景，不透明星空底图，遮挡中央区域的巨大行星，横跨画面中央的桥梁或管道，高饱和刺眼霓虹，强烈眩光，大面积纯白高光，火焰爆炸，机甲，战斗机，子弹，透视消失点汇聚在画面正中，上下边缘截断无法衔接，明显接缝，模糊，低清噪点
     ```
2. **第一关近景透明层**：`public/assets/backgrounds/wave01_orbit/wave01_orbit_near.png`（少量漂浮装甲碎片与微弱冷色光带，快速视差掠过）。
3. **第一关主力敌机精灵**（前上方 60° 俯视、朝屏幕下方、红橙敌我识别灯、`768×768` 透明底）：
   - 侦察无人机：`public/assets/mecha/enemy/enemy_scout_drone.png`（对应 `drone`）
   - 量产轻型机甲：`public/assets/mecha/enemy/enemy_light_mech.png`（对应 `fighter`）
   - 补给运输机甲：`public/assets/mecha/enemy/enemy_supply_carrier.png`（对应 `transport`）
   - 关底守卫小 Boss：`public/assets/mecha/enemy/enemy_stage_guardian.png`（对应 `miniBoss`，`1024×1024`）
4. **其余玩家机甲双形态与驾驶员立绘**：
   - `X-02 苍隼`（狙击形态 + 双影分体形态）、`H-03 紫蜂`（巡航母机形态 + 蜂巢要塞形态）
   - 三位驾驶员菜单头像与觉醒大招透明立绘（替换 `src/cutin/awakeningCutin.ts` 中的内联 SVG）

### 4.3 新素材接入代码指引
1. **接入新关卡背景层（`mid` / `near` 或第 2–10 关）**：
   - 在 `src/render/renderer.ts` 顶部的 `STAGE_BACKGROUND_SPECS` 注册路径。
   - 在 `loadStageBackgrounds()` 中遍历 `STAGE_BACKGROUND_SPECS` 预加载图片。
   - 在 `drawBackground()` 中按 `far（慢速 ~18px/s） → mid（中速 ~36px/s，就绪后可关闭默认网格 drawBackgroundGrid） → near（快速 ~68px/s，半透明叠加）` 顺序绘制，并在 `tests/stage-background.test.ts` 补充对应规格断言。
2. **接入其余玩家机甲精灵**：
   - 将透明 PNG 放入 `public/assets/mecha/player/`。
   - 在 `src/render/renderer.ts` 的 `PLAYER_SPRITE_SPECS` 中补充 `falcon`（`sniper` / `split`）与 `wasp`（`cruise` / `fortress`）配置，并在 `loadPlayerSprites()` 中遍历全部已配置机体与形态加载，同步更新 `tests/player-sprite-config.test.ts`。
3. **接入敌机与 Boss 精灵**：
   - 参照 `getPlayerSpriteSpec` 模式，在 `src/render/renderer.ts` 新增 `getEnemySpriteSpec(type)`，在 `drawEnemy()` 中优先绘制已就绪贴图，未就绪时回退 `drawStandardEnemy / drawMiniBoss / drawSpiderBoss / drawValkyrieBoss`。

---

## 5. 本地开发、测试与调试命令

### 5.1 安装与运行
环境要求：Node.js `>= 20`（推荐 `22+`）与 `pnpm`。

```bash
# 安装依赖
pnpm install

# 启动本地开发服务器（默认 http://localhost:5173）
pnpm dev

# TypeScript 类型检查 + 生产包构建（输出至 dist/）
pnpm build
```

> Windows 环境下若已安装好 `node_modules`，也可直接双击或运行 `.\dev.cmd` 与 `.\build.cmd`。

### 5.2 运行自动化回归测试
`tests/` 下共有 11 个测试文件，分别守护属性、难度曲线、变形、计分、分数晶体、废料掉落、小 Boss 关卡结构、响应式画布、指针限速与素材规格。

**Linux / macOS (Bash)：**
```bash
for t in tests/*.test.ts; do pnpm exec tsx "$t" || exit 1; done
```

**Windows (PowerShell)：**
```powershell
Get-ChildItem tests/*.test.ts | ForEach-Object { pnpm exec tsx $_.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

| 测试文件 | 守护的核心规则 |
| :--- | :--- |
| `tests/core-stats.test.ts` | 初始移速上限、魔力扩容连放大招、护甲减伤公式、升级词条完整性 |
| `tests/difficulty-curve.test.ts` | 赤曜初始移速与强化感知、`wavePressureFor` 第 1–3 波编队及弹幕增压 |
| `tests/pointer-movement.test.ts` | 鼠标/触屏大幅拖拽限速、30fps/60fps 位移一致性、`Shift` 低速拖拽 |
| `tests/transformation.test.ts` | 三台机体双形态切换、1 秒冷却、命中框变化、武器形态差异、蜂巢护盾挡弹 |
| `tests/stage-structure.test.ts` | 单波 `>= 90s`、60s 刷小 Boss、第 5 波先小 Boss 后追加正式蜘蛛 Boss |
| `tests/scrap-drops.test.ts` | 废料严格由被击毁敌机抛出，绝不随时间凭空刷新 |
| `tests/scoring.test.ts` | 敌机/小 Boss/Boss 计分、无伤波次奖励、受击取消当波无伤资格 |
| `tests/score-crystals.test.ts` | 击杀抛出分数晶体、靠近自动吸附与漏吃统计 |
| `tests/responsive-field.test.ts` | `1280×720` 与 `480×720` 自适应判定、窗口缩放坐标等比迁移 |
| `tests/player-sprite-config.test.ts` | 玩家机甲双形态贴图路径与显示尺寸契约 |
| `tests/stage-background.test.ts` | 关卡背景分层素材路径契约与未交付降级规则 |

### 5.3 开发态内置调试指令
在 `pnpm dev` 开发模式下，可在浏览器控制台调用 `window.__aetherDebug` 快速验收演出与关卡流转：

```js
__aetherDebug.getWorld()                  // 查看当前完整世界状态快照
__aetherDebug.fillAwakening()             // 立即充满 100 点觉醒能量
__aetherDebug.setAwakening('azure', 3)    // 切换为指定觉醒系（'crimson' | 'azure' | 'violet'）与阶位（1 | 2 | 3）并充满能量
__aetherDebug.finishWave()                // 快进当前波次时间并清空场内敌机
```

---

## 6. 后续迭代建议与注意事项

1. **优先完成 Wave 1 视觉闭环**：接入 `wave01_orbit_mid.png` 后，可在第 1 波隐藏程序化透视网格（`drawBackgroundGrid`），使太空远景 + 轨道空间站中景 + 碎片近景呈现纯正美术画感。
2. **第二阶段变形肉鸽词条**：基础双形态已稳定运行，后续可在 `PASSIVE_ITEMS` 或 `LEVEL_UP_OPTIONS` 中加入变形联动词条（如“切换形态瞬间释放小型消弹脉冲”、“飞翼模式擦弹回复护盾”、“双影僚机继承暴击加成”）。
3. **修改数值时注意回归断言**：`difficulty-curve.test.ts`、`pointer-movement.test.ts` 与 `transformation.test.ts` 对赤曜初始移速、判定半径和首发弹数有精确区间断言；后续调优平衡性时请先更新测试预期再改实现。
4. **音频外部化扩展**：`src/audio/sound.ts` 目前以合成器发声为主，后续按 `docs/ASSET_GENERATION_SPEC.md` 第 12 节交付 `.ogg` 音乐音效后，可在 `SoundManager` 中按波次与事件名优先播放音频资源、合成器保留为加载兜底。
