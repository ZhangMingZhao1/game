export type MainGunId = 'vulcan' | 'laser' | 'arc';
export type SubWeaponId = 'missile' | 'blade' | 'drone_swarm';
export type AwakeningType = 'crimson' | 'azure' | 'violet';
export type SetTag = 'ballistic' | 'energy' | 'explosive' | 'drone' | 'awakening';
export type ShipId = 'raiden' | 'falcon' | 'wasp';
export type PlayerForm = 'assault' | 'flight' | 'sniper' | 'split' | 'cruise' | 'fortress';

export interface TransformationFormConfig {
  id: PlayerForm;
  name: string;
  shortName: string;
  color: string;
  summary: string;
}

export interface TransformationConfig {
  primary: TransformationFormConfig;
  alternate: TransformationFormConfig;
}

export interface StatMods {
  maxHp?: number;
  hpRegen?: number;
  armor?: number;
  dodge?: number;
  speedPct?: number;
  mana?: number;
  damagePct?: number;
  mainDmgPct?: number;
  subDmgPct?: number;
  attackSpeedPct?: number;
  critChance?: number;
  critDmgPct?: number;
  awakeningGainPct?: number;
  awakeningDmgPct?: number;
  harvest?: number;
  luck?: number;
  pickupRangePct?: number;
}

export interface ShipConfig {
  id: ShipId;
  name: string;
  title: string;
  pilotName: string;
  pilotCallsign: string;
  pilotQuote: string;
  color: string;
  accentColor: string;
  mainGun: MainGunId;
  mainGunName: string;
  subWeapon: SubWeaponId;
  subWeaponName: string;
  defaultAwakening: AwakeningType;
  startingPod: string;
  desc: string;
  passiveDesc: string;
  baseStats: Required<StatMods>;
}

export interface AwakeningTierInfo {
  tier: 1 | 2 | 3;
  badge: string;
  skillTitle: string;
  voiceLineCn: string;
  voiceLineJp: string;
  duration: number;
  dmgMult: number;
  desc: string;
}

export interface AwakeningConfig {
  id: AwakeningType;
  name: string;
  shortName: string;
  element: string;
  color: string;
  glowColor: string;
  bgGradient: string;
  tiers: [AwakeningTierInfo, AwakeningTierInfo, AwakeningTierInfo];
}

export interface PodWeaponConfig {
  id: string;
  name: string;
  tags: SetTag[];
  color: string;
  baseCost: number;
  baseDmg: number;
  baseCooldown: number;
  desc: string;
  tierScaling: [number, number, number, number]; // Tier I, II, III, IV multipliers
}

export interface PassiveItemConfig {
  id: string;
  name: string;
  tier: 0 | 1 | 2 | 3;
  cost: number;
  color: string;
  desc: string;
  mods: StatMods;
  special?: string;
}

export interface LevelUpOption {
  id: string;
  name: string;
  desc: string;
  color: string;
  mods: StatMods;
}

export const TIER_COLORS = ['#94a3b8', '#38bdf8', '#c084fc', '#fbbf24'] as const;
export const TIER_ROMAN = ['I', 'II', 'III', 'IV'] as const;

export const TRANSFORMATIONS: Record<ShipId, TransformationConfig> = {
  raiden: {
    primary: {
      id: 'assault',
      name: '强袭机甲模式',
      shortName: '强袭',
      color: '#ff6b4a',
      summary: '重装甲、宽散射与多联导弹',
    },
    alternate: {
      id: 'flight',
      name: '赤曜飞翼模式',
      shortName: '飞翼',
      color: '#fbbf24',
      summary: '高速、小命中框与集中速射',
    },
  },
  falcon: {
    primary: {
      id: 'sniper',
      name: '贯穿狙击模式',
      shortName: '狙击',
      color: '#67e8f9',
      summary: '高伤贯穿、额外暴击与低射速',
    },
    alternate: {
      id: 'split',
      name: '双影分体阵列',
      shortName: '双影',
      color: '#38bdf8',
      summary: '双僚机协同射击与高速次元刃',
    },
  },
  wasp: {
    primary: {
      id: 'cruise',
      name: '巡航母机模式',
      shortName: '巡航',
      color: '#c084fc',
      summary: '机动推进与集中蜂群阵列',
    },
    alternate: {
      id: 'fortress',
      name: '蜂巢要塞模式',
      shortName: '要塞',
      color: '#f472b6',
      summary: '重甲、强化副武器与周期护盾',
    },
  },
};

export const SET_BONUSES: Record<
  SetTag,
  {
    name: string;
    color: string;
    desc: string;
    thresholds: { count: number; label: string; mods: StatMods }[];
  }
> = {
  ballistic: {
    name: '实弹武装',
    color: '#ffb347',
    desc: '提升主炮与实弹伤害及暴击',
    thresholds: [
      { count: 2, label: '(2) 伤害 +12%，主炮伤害 +15%', mods: { damagePct: 12, mainDmgPct: 15 } },
      { count: 4, label: '(4) 伤害 +28%，攻速 +15%', mods: { damagePct: 28, mainDmgPct: 30, attackSpeedPct: 15 } },
      { count: 6, label: '(6) 伤害 +50%，暴击率 +15%', mods: { damagePct: 50, mainDmgPct: 50, attackSpeedPct: 25, critChance: 15 } },
    ],
  },
  energy: {
    name: '高能光子',
    color: '#38bdf8',
    desc: '提升暴击率与暴击伤害',
    thresholds: [
      { count: 2, label: '(2) 暴击率 +8%，能量与主炮伤害 +15%', mods: { critChance: 8, mainDmgPct: 15 } },
      { count: 4, label: '(4) 暴击率 +18%，暴击伤害 +35%', mods: { critChance: 18, critDmgPct: 35, mainDmgPct: 25 } },
      { count: 6, label: '(6) 暴击率 +30%，暴击伤害 +75%', mods: { critChance: 30, critDmgPct: 75, mainDmgPct: 45 } },
    ],
  },
  explosive: {
    name: '重装爆破',
    color: '#ff5a5a',
    desc: '大幅强化副弹与爆炸清场威力',
    thresholds: [
      { count: 2, label: '(2) 副弹伤害 +20%，最大生命 +10', mods: { subDmgPct: 20, maxHp: 10 } },
      { count: 4, label: '(4) 副弹伤害 +45%，全局伤害 +18%', mods: { subDmgPct: 45, damagePct: 18, maxHp: 20 } },
      { count: 6, label: '(6) 副弹伤害 +85%，护甲 +4', mods: { subDmgPct: 85, damagePct: 35, maxHp: 35, armor: 4 } },
    ],
  },
  drone: {
    name: '蜂群工程',
    color: '#4ade80',
    desc: '强化副弹射速、生命再生与护甲',
    thresholds: [
      { count: 2, label: '(2) 副弹伤害 +18%，生命再生 +1.5/秒', mods: { subDmgPct: 18, hpRegen: 1.5 } },
      { count: 4, label: '(4) 攻速 +20%，生命再生 +3.5/秒', mods: { subDmgPct: 38, attackSpeedPct: 20, hpRegen: 3.5 } },
      { count: 6, label: '(6) 攻速 +40%，护甲 +5，再生 +6/秒', mods: { subDmgPct: 65, attackSpeedPct: 40, hpRegen: 6, armor: 5 } },
    ],
  },
  awakening: {
    name: '觉醒共鸣',
    color: '#e879f9',
    desc: '加速觉醒大招充能并提高觉醒爆发伤害',
    thresholds: [
      { count: 2, label: '(2) 觉醒充能 +25%，大招伤害 +25%', mods: { awakeningGainPct: 25, awakeningDmgPct: 25 } },
      { count: 4, label: '(4) 觉醒充能 +55%，大招伤害 +60%', mods: { awakeningGainPct: 55, awakeningDmgPct: 60 } },
      { count: 6, label: '(6) 觉醒充能 +100%，大招伤害 +120%', mods: { awakeningGainPct: 100, awakeningDmgPct: 120 } },
    ],
  },
};

export const SHIPS: ShipConfig[] = [
  {
    id: 'raiden',
    name: '赤色雷霆 Mk-II',
    title: '身经百战的王牌强袭机',
    pilotName: '凛 · 瓦尔基里 (Rin)',
    pilotCallsign: 'VALKYRIE-01',
    pilotQuote: '“主炮校准完毕，空投强化已锁定——今天也一口气轰穿敌阵！”',
    color: '#ff4b3a',
    accentColor: '#ffd23f',
    mainGun: 'vulcan',
    mainGunName: '赤焰火神散射炮',
    subWeapon: 'missile',
    subWeaponName: '双联蜂群追踪弹',
    defaultAwakening: 'crimson',
    startingPod: 'gatling',
    desc: '攻守兼备的全能主力机。火神主炮随等级提升扇形弹幕密度，副弹发射自动索敌的追踪导弹。',
    passiveDesc: '【战术补给】每次拾取 M/S/A 空投胶囊时，额外获得 +8 废料、恢复 5 点生命并立即充能 +12% 觉醒度。',
    baseStats: {
      maxHp: 110,
      hpRegen: 1,
      armor: 2,
      dodge: 5,
      speedPct: 5,
      mana: 100,
      damagePct: 10,
      mainDmgPct: 15,
      subDmgPct: 10,
      attackSpeedPct: 5,
      critChance: 10,
      critDmgPct: 150,
      awakeningGainPct: 15,
      awakeningDmgPct: 15,
      harvest: 10,
      luck: 10,
      pickupRangePct: 15,
    },
  },
  {
    id: 'falcon',
    name: '苍蓝猎鹰 Zero',
    title: '超音速次元截击机',
    pilotName: '零 · 霜月 (Zero)',
    pilotCallsign: 'PHANTOM-ZERO',
    pilotQuote: '“弹幕只是慢动作的残影……在我的次元刀域里，没有人能逃掉。”',
    color: '#38bdf8',
    accentColor: '#7dd3fc',
    mainGun: 'laser',
    mainGunName: '苍穹贯穿脉冲光束',
    subWeapon: 'blade',
    subWeaponName: '寒冰折跃次元刃',
    defaultAwakening: 'azure',
    startingPod: 'railgun',
    desc: '高移速、高暴击的锐利刺客。主炮发射高速贯穿激光束，副弹投掷来回切割敌群的回旋次元刃。',
    passiveDesc: '【次元闪避】擦弹（Graze）获得的觉醒能量与废料翻倍；每点闪避额外提供 +0.8% 暴击伤害。',
    baseStats: {
      maxHp: 85,
      hpRegen: 0.5,
      armor: 0,
      dodge: 18,
      speedPct: 12,
      mana: 100,
      damagePct: 20,
      mainDmgPct: 25,
      subDmgPct: 15,
      attackSpeedPct: 12,
      critChance: 22,
      critDmgPct: 175,
      awakeningGainPct: 25,
      awakeningDmgPct: 25,
      harvest: 6,
      luck: 15,
      pickupRangePct: 10,
    },
  },
  {
    id: 'wasp',
    name: '紫电黄蜂 Ayla',
    title: '自律蜂群战术母舰',
    pilotName: '艾拉 · 斯特拉 (Ayla)',
    pilotCallsign: 'HIVE-QUEEN',
    pilotQuote: '“僚机矩阵全功率展开！用漫天副弹与紫电神罚淹没整片天空吧！”',
    color: '#c084fc',
    accentColor: '#f472b6',
    mainGun: 'arc',
    mainGunName: '紫电连锁电弧炮',
    subWeapon: 'drone_swarm',
    subWeaponName: '自律脉冲蜂群弹',
    defaultAwakening: 'violet',
    startingPod: 'laser_drone',
    desc: '专精副武器与僚机协同的战术母机。主炮发射自动弹跳的电弧闪电，副弹释放密集的自律索敌能量蜂群。',
    passiveDesc: '【母舰核心】开局自带副弹等级 Lv.2；每挂载 1 个武器吊舱，副弹伤害额外 +8%，觉醒充能 +6%。',
    baseStats: {
      maxHp: 100,
      hpRegen: 2,
      armor: 1,
      dodge: 10,
      speedPct: 3,
      mana: 100,
      damagePct: 5,
      mainDmgPct: 0,
      subDmgPct: 35,
      attackSpeedPct: 15,
      critChance: 14,
      critDmgPct: 155,
      awakeningGainPct: 20,
      awakeningDmgPct: 20,
      harvest: 12,
      luck: 18,
      pickupRangePct: 25,
    },
  },
];

export const AWAKENINGS: Record<AwakeningType, AwakeningConfig> = {
  crimson: {
    id: 'crimson',
    name: '赤红·天穹歼灭炮',
    shortName: '天穹歼灭炮',
    element: '赤焰粒子 / 毁灭主炮',
    color: '#ff4b3a',
    glowColor: '#ff9e44',
    bgGradient: 'linear-gradient(115deg, #2a0505 0%, #7f1d1d 45%, #ef4444 85%, #fef08a 100%)',
    tiers: [
      {
        tier: 1,
        badge: '一次觉醒 · I阶',
        skillTitle: '焦土·天穹歼灭炮',
        voiceLineCn: '主炮限制解除！化作灰烬吧——天穹歼灭炮！',
        voiceLineJp: 'リミッター解除！灰になれ——クリムゾン・バスター！！',
        duration: 3.4,
        dmgMult: 1.0,
        desc: '展开战机超载法阵，向前方倾泻巨型赤金粒子洪流，持续蒸发沿途所有敌弹并造成高频贯穿暴击。',
      },
      {
        tier: 2,
        badge: '二次觉醒 · II阶',
        skillTitle: '炽天·红莲崩星炮',
        voiceLineCn: '二次觉醒开启！燃尽这片苍穹——红莲崩星炮！',
        voiceLineJp: '二次覚醒！蒼穹を焼き尽くせ——紅蓮ブレイクキャノン！！',
        duration: 4.4,
        dmgMult: 1.55,
        desc: '光束宽度扩大 45%，附带全屏熔岩火雨溅射，释放期间每秒恢复 6% 最大生命。',
      },
      {
        tier: 3,
        badge: '真·觉醒 · MAX阶',
        skillTitle: '终焉·神威焚世破界炮',
        voiceLineCn: '真·觉醒全功率！！在绯红的终焉之光中——彻底湮灭吧！！',
        voiceLineJp: '真・覚醒フルバースト！！緋色の終焉に消え去れ——ラグナロク・ノヴァ！！',
        duration: 5.5,
        dmgMult: 2.3,
        desc: '全屏赤金毁灭洪流 + 双侧副炮齐射，结束瞬间引发【焚世超新星】二段全屏巨额爆炸！',
      },
    ],
  },
  azure: {
    id: 'azure',
    name: '苍蓝·零度次元斩',
    shortName: '零度次元斩',
    element: '绝对零度 / 时停次元刀',
    color: '#38bdf8',
    glowColor: '#a5f3fc',
    bgGradient: 'linear-gradient(115deg, #04132a 0%, #0c4a6e 45%, #0284c7 85%, #e0f2fe 100%)',
    tiers: [
      {
        tier: 1,
        badge: '一次觉醒 · I阶',
        skillTitle: '零度·次元裂空斩',
        voiceLineCn: '时间凝固……在这片绝对零度的次元里，一刀两断！',
        voiceLineJp: '時よ止まれ……絶対零度の次元で、全てを断つ！',
        duration: 3.2,
        dmgMult: 1.0,
        desc: '冻结全屏敌机与弹幕 3.2 秒，空间中连续划过 28 道苍蓝次元刀光，时停结束时同时引爆斩杀伤害。',
      },
      {
        tier: 2,
        badge: '二次觉醒 · II阶',
        skillTitle: '极冰·千刃无间狱',
        voiceLineCn: '二次觉醒！连空间本身也一同冻结——极冰·千刃无间！',
        voiceLineJp: '二次覚醒！空間ごと凍てつけ——絶氷・千刃無間！！',
        duration: 4.2,
        dmgMult: 1.6,
        desc: '时停延长至 4.2 秒，斩击次数提升至 45 道，所有敌弹直接碎裂转化为回能冰晶。',
      },
      {
        tier: 3,
        badge: '真·觉醒 · MAX阶',
        skillTitle: '虚空·终式万象次元断',
        voiceLineCn: '真·觉醒展开！！万物静止，唯有一闪——万象次元断！！',
        voiceLineJp: '真・覚醒！！森羅万象、一太刀にて断ち切る——次元絶刀・終式！！',
        duration: 5.2,
        dmgMult: 2.4,
        desc: '全屏绝对时停 5.2 秒 + 72 道极速空间裂痕，终结时触发【镜面次元崩碎】造成必定暴击的毁灭伤害！',
      },
    ],
  },
  violet: {
    id: 'violet',
    name: '紫电·万雷神罚阵列',
    shortName: '万雷神罚阵列',
    element: '雷帝神罚 / 全弹超载',
    color: '#c084fc',
    glowColor: '#f5d0fe',
    bgGradient: 'linear-gradient(115deg, #1b052e 0%, #581c87 45%, #9333ea 85%, #f5d0fe 100%)',
    tiers: [
      {
        tier: 1,
        badge: '一次觉醒 · I阶',
        skillTitle: '雷帝·万雷神罚阵列',
        voiceLineCn: '雷云听我号令！降下神罚，全武器超载开火！',
        voiceLineJp: '雷雲よ集え！神罰降臨、全武装オーバードライブ！！',
        duration: 5.0,
        dmgMult: 1.0,
        desc: '召唤 20 道紫电落雷轰击全场敌机，并进入 5 秒【雷神超载】：主炮与副弹攻速 +80%，生成雷电护盾。',
      },
      {
        tier: 2,
        badge: '二次觉醒 · II阶',
        skillTitle: '天罚·紫霄雷神矩阵',
        voiceLineCn: '二次觉醒！亿万伏特奔流——紫霄雷神矩阵，全弹倾泻！',
        voiceLineJp: '二次覚醒！億万ボルトの奔流——紫電マトリクス全開！！',
        duration: 6.5,
        dmgMult: 1.55,
        desc: '落雷增至 32 道，【雷神超载】期间主炮与副弹临时视为满级状态，攻速 +110%。',
      },
      {
        tier: 3,
        badge: '真·觉醒 · MAX阶',
        skillTitle: '神威·诸神黄昏雷暴星域',
        voiceLineCn: '真·觉醒降临！！化身雷霆本身，审判万物——诸神黄昏！！',
        voiceLineJp: '真・覚醒降臨！！我こそが雷霆なり——ラグナロク・サンダーストーム！！',
        duration: 8.0,
        dmgMult: 2.35,
        desc: '持续 8 秒全屏紫电风暴 + 主炮/副弹/全部吊舱攻速 +150% 无限狂暴倾泻，机体全程无敌！',
      },
    ],
  },
};

export const POD_WEAPONS: PodWeaponConfig[] = [
  {
    id: 'gatling',
    name: '疾风加特林吊舱',
    tags: ['ballistic'],
    color: '#ffb347',
    baseCost: 22,
    baseDmg: 9,
    baseCooldown: 0.14,
    desc: '超高射速双管转轮机炮，持续倾泻密集曳光弹幕。',
    tierScaling: [1, 1.65, 2.55, 4.0],
  },
  {
    id: 'railgun',
    name: '超导电磁轨道炮',
    tags: ['ballistic', 'energy'],
    color: '#38bdf8',
    baseCost: 28,
    baseDmg: 46,
    baseCooldown: 0.85,
    desc: '发射超音速蓝白磁轨弹丸，直线贯穿路径上所有敌机并享受高额暴击加成。',
    tierScaling: [1, 1.7, 2.7, 4.2],
  },
  {
    id: 'swarm',
    name: '蜂群微型导弹舱',
    tags: ['explosive', 'drone'],
    color: '#fb7185',
    baseCost: 26,
    baseDmg: 22,
    baseCooldown: 0.62,
    desc: '周期性齐射多枚自动锁敌的微型高爆飞弹，受副弹等级额外加成。',
    tierScaling: [1, 1.65, 2.6, 4.1],
  },
  {
    id: 'nuke',
    name: '重型热核轰炸舱',
    tags: ['explosive', 'awakening'],
    color: '#ff4b3a',
    baseCost: 32,
    baseDmg: 88,
    baseCooldown: 1.75,
    desc: '发射重型聚变弹头，命中后产生巨型冲击波清除范围内敌弹并造成高额范围伤害。',
    tierScaling: [1, 1.75, 2.8, 4.5],
  },
  {
    id: 'laser_drone',
    name: '浮游脉冲无人机',
    tags: ['drone', 'energy'],
    color: '#4ade80',
    baseCost: 25,
    baseDmg: 18,
    baseCooldown: 0.35,
    desc: '环绕战机飞行的自律浮游炮，自动瞄准最近敌机发射高频能量光束。',
    tierScaling: [1, 1.65, 2.6, 4.1],
  },
  {
    id: 'shield_orb',
    name: '共鸣护盾光球',
    tags: ['drone', 'awakening'],
    color: '#e879f9',
    baseCost: 28,
    baseDmg: 26,
    baseCooldown: 0.25,
    desc: '环绕机体旋转的等离子护盾球，可抵消敌方子弹、灼烧接触敌机并加速觉醒充能。',
    tierScaling: [1, 1.7, 2.75, 4.3],
  },
];

export const PASSIVE_ITEMS: PassiveItemConfig[] = [
  {
    id: 'airdrop_beacon',
    name: '战术空投信标',
    tier: 1,
    cost: 28,
    color: '#38bdf8',
    desc: '武装补给运输机出现频率提升 45%，拾取范围 +30%，收获 +10。',
    mods: { pickupRangePct: 30, harvest: 10, luck: 12 },
    special: 'more_transports',
  },
  {
    id: 'awakening_reactor',
    name: 'DNF·觉醒共鸣炉',
    tier: 2,
    cost: 42,
    color: '#e879f9',
    desc: '觉醒充能效率 +35%，觉醒大招伤害 +40%，但护甲 -1。',
    mods: { awakeningGainPct: 35, awakeningDmgPct: 40, armor: -1 },
  },
  {
    id: 'sub_munitions',
    name: '高爆副弹扩容箱',
    tier: 1,
    cost: 30,
    color: '#4ade80',
    desc: '副弹与吊舱伤害 +28%，攻速 +10%。',
    mods: { subDmgPct: 28, attackSpeedPct: 10 },
  },
  {
    id: 'main_overclock',
    name: '主炮超频散热器',
    tier: 1,
    cost: 30,
    color: '#ff4b3a',
    desc: '主炮伤害 +28%，全局攻速 +12%。',
    mods: { mainDmgPct: 28, attackSpeedPct: 12 },
  },
  {
    id: 'glass_cockpit',
    name: '全息玻璃座舱',
    tier: 2,
    cost: 38,
    color: '#c084fc',
    desc: '全局伤害 +32%，暴击率 +12%，但最大生命 -18。',
    mods: { damagePct: 32, critChance: 12, maxHp: -18 },
  },
  {
    id: 'titanium_plating',
    name: '复合反应装甲',
    tier: 1,
    cost: 26,
    color: '#38bdf8',
    desc: '最大生命 +25，护甲 +3，但移速 -5%。',
    mods: { maxHp: 25, armor: 3, speedPct: -5 },
  },
  {
    id: 'graze_converter',
    name: '擦弹能量转换器',
    tier: 2,
    cost: 36,
    color: '#c084fc',
    desc: '闪避 +10%，擦弹时额外获得 +3% 觉醒能量与 +2 废料。',
    mods: { dodge: 10, awakeningGainPct: 20, speedPct: 8 },
    special: 'graze_boost',
  },
  {
    id: 'nano_repair',
    name: '纳米自律维修仓',
    tier: 1,
    cost: 28,
    color: '#4ade80',
    desc: '生命再生 +3.5/秒，最大生命 +12。',
    mods: { hpRegen: 3.5, maxHp: 12 },
  },
  {
    id: 'golden_magnet',
    name: '黄金引力回收器',
    tier: 0,
    cost: 20,
    color: '#94a3b8',
    desc: '拾取磁吸范围 +50%，每波结束收获 +16 废料。',
    mods: { pickupRangePct: 50, harvest: 16 },
  },
  {
    id: 'lucky_dice',
    name: '王牌幸运徽章',
    tier: 1,
    cost: 25,
    color: '#38bdf8',
    desc: '幸运 +25，暴击率 +10%，空投胶囊掉率提升。',
    mods: { luck: 25, critChance: 10 },
  },
  {
    id: 'trinity_core',
    name: '三位一体超导核',
    tier: 3,
    cost: 58,
    color: '#fbbf24',
    desc: '【传说】主炮伤害 +35%，副弹伤害 +35%，觉醒大招伤害 +50%，全属性小幅提升！',
    mods: {
      mainDmgPct: 35,
      subDmgPct: 35,
      awakeningDmgPct: 50,
      attackSpeedPct: 18,
      critChance: 12,
      maxHp: 20,
    },
  },
  {
    id: 'valkyrie_wings',
    name: '女武神推进翼',
    tier: 3,
    cost: 52,
    color: '#fbbf24',
    desc: '【传说】移速 +25%，闪避 +15%，攻速 +25%，觉醒充能 +30%。',
    mods: {
      speedPct: 25,
      dodge: 15,
      attackSpeedPct: 25,
      awakeningGainPct: 30,
    },
  },
];

export const LEVEL_UP_OPTIONS: LevelUpOption[] = [
  {
    id: 'lu_main',
    name: '主炮火力强化',
    desc: '主炮伤害 +18%，全局伤害 +6%',
    color: '#ff4b3a',
    mods: { mainDmgPct: 18, damagePct: 6 },
  },
  {
    id: 'lu_sub',
    name: '副弹与吊舱专精',
    desc: '副弹伤害 +20%，攻速 +8%',
    color: '#4ade80',
    mods: { subDmgPct: 20, attackSpeedPct: 8 },
  },
  {
    id: 'lu_awakening',
    name: '觉醒共鸣回路',
    desc: '觉醒充能效率 +22%，大招伤害 +25%',
    color: '#e879f9',
    mods: { awakeningGainPct: 22, awakeningDmgPct: 25 },
  },
  {
    id: 'lu_haste',
    name: '超频射击序列',
    desc: '攻击速度 +18%，主炮伤害 +6%',
    color: '#38bdf8',
    mods: { attackSpeedPct: 18, mainDmgPct: 6 },
  },
  {
    id: 'lu_speed',
    name: '矢量推进校准',
    desc: '移动速度 +15%，拾取范围 +10%',
    color: '#22d3ee',
    mods: { speedPct: 15, pickupRangePct: 10 },
  },
  {
    id: 'lu_armor',
    name: '复合装甲强化',
    desc: '护甲 +4，最大生命 +10',
    color: '#94a3b8',
    mods: { armor: 4, maxHp: 10 },
  },
  {
    id: 'lu_mana',
    name: '魔力容器扩张',
    desc: '魔力上限 +100，可额外储存一次觉醒大招',
    color: '#d946ef',
    mods: { mana: 100 },
  },
  {
    id: 'lu_crit',
    name: '精密弱点锁定',
    desc: '暴击率 +10%，暴击伤害 +25%',
    color: '#fbbf24',
    mods: { critChance: 10, critDmgPct: 25 },
  },
  {
    id: 'lu_hull',
    name: '重装机甲镀层',
    desc: '最大生命 +22，护甲 +2，生命再生 +1/秒',
    color: '#60a5fa',
    mods: { maxHp: 22, armor: 2, hpRegen: 1 },
  },
  {
    id: 'lu_evade',
    name: '幻影机动引擎',
    desc: '闪避率 +9%，移速 +12%，拾取范围 +20%',
    color: '#a78bfa',
    mods: { dodge: 9, speedPct: 12, pickupRangePct: 20 },
  },
  {
    id: 'lu_fortune',
    name: '战地搜刮协议',
    desc: '收获 +15，幸运 +18（大幅提高空投掉率）',
    color: '#34d399',
    mods: { harvest: 15, luck: 18 },
  },
];

export const DANGER_LEVELS = [
  { level: 0, name: '危险 0 · 标准出击', enemyHpMult: 1.0, enemyDmgMult: 1.0, spawnRateMult: 1.0, scrapMult: 1.0, desc: '标准街机难度，适合熟悉主/副弹进化与三大觉醒演出。' },
  { level: 1, name: '危险 1 · 前线警戒', enemyHpMult: 1.25, enemyDmgMult: 1.15, spawnRateMult: 1.15, scrapMult: 1.15, desc: '敌机装甲 +25%，精英编队更早登场，废料收益 +15%。' },
  { level: 2, name: '危险 2 · 弹幕风暴', enemyHpMult: 1.55, enemyDmgMult: 1.3, spawnRateMult: 1.3, scrapMult: 1.3, desc: '敌机弹幕密度提升，首领解锁强化弹幕，废料收益 +30%。' },
  { level: 3, name: '危险 3 · 炼狱苍穹', enemyHpMult: 2.0, enemyDmgMult: 1.5, spawnRateMult: 1.45, scrapMult: 1.5, desc: '王牌飞行员专属挑战，高压弹幕地狱，废料收益 +50%。' },
];
