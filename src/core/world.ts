import {
  AWAKENINGS,
  DANGER_LEVELS,
  LEVEL_UP_OPTIONS,
  PASSIVE_ITEMS,
  POD_WEAPONS,
  SET_BONUSES,
  SHIPS,
  TRANSFORMATIONS,
} from '../data/config';
import type {
  AwakeningType,
  LevelUpOption,
  MainGunId,
  PlayerForm,
  SetTag,
  ShipConfig,
  ShipId,
  StatMods,
  SubWeaponId,
} from '../data/config';
import {
  awardEnemyKill,
  beginScoreWave,
  collectScoreCrystal,
  completeScoreWave,
  createScoreState,
  markWaveDamaged,
  missScoreCrystal,
  type ScoreCrystalGrade,
  type ScoreState,
} from './scoring';

export const FIELD_WIDTH = 480;
export const FIELD_HEIGHT = 720;
export const WIDE_FIELD_WIDTH = 1280;

export function responsiveFieldWidth(viewportWidth: number, viewportHeight: number): number {
  const safeWidth = Math.max(1, viewportWidth);
  const safeHeight = Math.max(1, viewportHeight);
  return safeWidth >= 720 && safeWidth / safeHeight >= 1.25
    ? WIDE_FIELD_WIDTH
    : FIELD_WIDTH;
}

export type WorldPhase = 'battle' | 'waveClear' | 'gameOver' | 'victory';
export type EnemyType =
  | 'fighter'
  | 'drone'
  | 'heli'
  | 'tank'
  | 'turret'
  | 'bomber'
  | 'transport'
  | 'elite'
  | 'miniBoss';
export type BossType = 'spider' | 'valkyrie';
export type ShotOwner = 'player' | 'enemy';
export type ShotKind =
  | 'bullet'
  | 'laser'
  | 'arc'
  | 'missile'
  | 'blade'
  | 'drone'
  | 'pod'
  | 'slash'
  | 'lightning';
export type PickupKind = 'scrap' | 'energy' | 'capsule' | 'score';
export type CapsuleType = 'M' | 'S' | 'A';

export interface Vec2 {
  x: number;
  y: number;
}

export interface InputFrame {
  dx: number;
  dy: number;
  dragX: number;
  dragY: number;
  slow: boolean;
  firing: boolean;
  ultimate: boolean;
  transform?: boolean;
}

export interface RuntimeStats extends Required<StatMods> {}

export interface PodState {
  id: string;
  tier: 1 | 2 | 3 | 4;
  cooldown: number;
  angle: number;
  tags: SetTag[];
}

export interface PlayerState extends Vec2 {
  radius: number;
  shipId: ShipId;
  mainGun: MainGunId;
  subWeapon: SubWeaponId;
  mainLevel: number;
  subLevel: number;
  hp: number;
  maxHp: number;
  invulnerable: number;
  fireCooldown: number;
  subCooldown: number;
  awakening: AwakeningType;
  awakeningTier: 1 | 2 | 3;
  awakeningCharge: number;
  form: PlayerForm;
  transformCooldown: number;
  transformTimer: number;
  hiveShield: number;
  hiveShieldCooldown: number;
  scrap: number;
  experience: number;
  level: number;
  experienceToNext: number;
  pendingLevelUps: number;
  stats: RuntimeStats;
  permanentMods: StatMods;
  pods: PodState[];
  items: string[];
}

export interface EnemyState extends Vec2 {
  id: number;
  type: EnemyType;
  bossType?: BossType;
  miniBoss?: boolean;
  displayName?: string;
  radius: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  armor: number;
  speed: number;
  age: number;
  fireCooldown: number;
  patternTime: number;
  phase: number;
  vx: number;
  vy: number;
  elite: boolean;
  dead: boolean;
  frozen: number;
  value: number;
}

export interface ShotState extends Vec2 {
  id: number;
  owner: ShotOwner;
  kind: ShotKind;
  radius: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  damage: number;
  age: number;
  life: number;
  color: string;
  piercing: number;
  homing: number;
  critical: boolean;
  grazed: boolean;
  targetId?: number;
}

export interface PickupState extends Vec2 {
  id: number;
  kind: PickupKind;
  /** 击毁后抛出该掉落物的敌机 ID；用于保证掉落绝不凭空随机刷新。 */
  sourceEnemyId: number;
  capsule?: CapsuleType;
  awakening?: AwakeningType;
  scoreValue?: number;
  crystalGrade?: ScoreCrystalGrade;
  radius: number;
  value: number;
  age: number;
  life: number;
  vx: number;
  vy: number;
}

export interface ParticleState extends Vec2 {
  id: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  color: string;
  alpha: number;
}

export interface DamageTextState extends Vec2 {
  id: number;
  text: string;
  color: string;
  age: number;
  life: number;
  critical: boolean;
}

export interface BossState {
  id: number;
  type: BossType;
  phase: 1 | 2 | 3;
  hp: number;
  maxHp: number;
}

export interface UltimateState {
  type: AwakeningType;
  tier: 1 | 2 | 3;
  age: number;
  duration: number;
  tick: number;
  slashCount: number;
  storedDamage: number;
}

export interface RunStats {
  kills: number;
  bossesKilled: number;
  damageDealt: number;
  damageTaken: number;
  shotsFired: number;
  criticalHits: number;
  grazes: number;
  scrapCollected: number;
  capsulesCollected: number;
  dodges: number;
  elapsed: number;
}

export type WorldEvent =
  | { type: 'awakening'; awakening: AwakeningType; tier: 1 | 2 | 3 }
  | { type: 'transformed'; form: PlayerForm }
  | { type: 'hiveShieldBlocked' }
  | { type: 'hit'; x: number; y: number; damage: number; critical: boolean }
  | { type: 'playerHit'; damage: number }
  | { type: 'dodge' }
  | { type: 'graze'; charge: number }
  | { type: 'pickup'; pickup: PickupKind; capsule?: CapsuleType; value?: number }
  | { type: 'enemyKilled'; enemy: EnemyType; boss?: BossType }
  | { type: 'miniBossSpawned'; wave: number }
  | { type: 'levelUp'; level: number }
  | { type: 'waveClear'; wave: number; noHitBonus: number }
  | { type: 'gameOver' }
  | { type: 'victory' };

export interface WorldState {
  fieldWidth: number;
  fieldHeight: number;
  player: PlayerState;
  enemies: EnemyState[];
  playerShots: ShotState[];
  enemyShots: ShotState[];
  pickups: PickupState[];
  particles: ParticleState[];
  damageTexts: DamageTextState[];
  wave: number;
  waveTime: number;
  waveDuration: number;
  phase: WorldPhase;
  scroll: number;
  shake: number;
  flash: number;
  boss: BossState | null;
  stats: RunStats;
  score: ScoreState;
  rngSeed: number;
  events: WorldEvent[];
  danger: number;
  ultimate: UltimateState | null;
  nextId: number;
  spawnCooldown: number;
  transportCooldown: number;
  miniBossSpawned: boolean;
  miniBossDefeated: boolean;
  bossSpawned: boolean;
}

interface EnemyTemplate {
  hp: number;
  armor: number;
  speed: number;
  radius: number;
  width: number;
  height: number;
  fireRate: number;
  value: number;
}

const ENEMY_TEMPLATES: Record<EnemyType, EnemyTemplate> = {
  fighter: { hp: 28, armor: 0, speed: 92, radius: 13, width: 28, height: 30, fireRate: 1.8, value: 5 },
  drone: { hp: 18, armor: 0, speed: 125, radius: 10, width: 22, height: 22, fireRate: 2.2, value: 4 },
  heli: { hp: 75, armor: 2, speed: 48, radius: 19, width: 42, height: 34, fireRate: 1.35, value: 10 },
  tank: { hp: 130, armor: 5, speed: 28, radius: 23, width: 46, height: 48, fireRate: 1.7, value: 15 },
  turret: { hp: 95, armor: 4, speed: 22, radius: 19, width: 38, height: 38, fireRate: 1.1, value: 12 },
  bomber: { hp: 115, armor: 2, speed: 54, radius: 24, width: 52, height: 40, fireRate: 1.45, value: 16 },
  transport: { hp: 165, armor: 3, speed: 40, radius: 26, width: 58, height: 44, fireRate: 2.8, value: 18 },
  elite: { hp: 240, armor: 6, speed: 65, radius: 25, width: 50, height: 52, fireRate: 0.8, value: 30 },
  miniBoss: { hp: 900, armor: 7, speed: 42, radius: 38, width: 82, height: 84, fireRate: 0.62, value: 90 },
};

const AWAKENING_CYCLE: AwakeningType[] = ['crimson', 'azure', 'violet'];
const EMPTY_INPUT: InputFrame = {
  dx: 0,
  dy: 0,
  dragX: 0,
  dragY: 0,
  slow: false,
  firing: false,
  ultimate: false,
  transform: false,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function maxAwakeningCharge(player: PlayerState): number {
  return Math.max(100, Math.floor(player.stats.mana / 100) * 100);
}

function grantAwakeningCharge(player: PlayerState, amount: number): void {
  player.awakeningCharge = clamp(
    player.awakeningCharge + amount,
    0,
    maxAwakeningCharge(player),
  );
}

function nextRandom(world: WorldState): number {
  let x = world.rngSeed | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  world.rngSeed = x >>> 0;
  return world.rngSeed / 0x100000000;
}

function randomRange(world: WorldState, min: number, max: number): number {
  return min + (max - min) * nextRandom(world);
}

function newId(world: WorldState): number {
  const id = world.nextId;
  world.nextId += 1;
  return id;
}

function distanceSquared(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function circlesOverlap(a: Vec2, ar: number, b: Vec2, br: number): boolean {
  const radius = ar + br;
  return distanceSquared(a, b) <= radius * radius;
}

function mergeMods(target: StatMods, mods: StatMods): void {
  const keys = Object.keys(mods) as (keyof StatMods)[];
  for (const key of keys) {
    target[key] = (target[key] ?? 0) + (mods[key] ?? 0);
  }
}

function calculateRuntimeStats(ship: ShipConfig, player: PlayerState): RuntimeStats {
  const result: RuntimeStats = { ...ship.baseStats };
  mergeMods(result, player.permanentMods);

  const tagCounts = new Map<SetTag, number>();
  for (const pod of player.pods) {
    for (const tag of pod.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }

  for (const [tag, count] of tagCounts) {
    let activeMods: StatMods | undefined;
    for (const threshold of SET_BONUSES[tag].thresholds) {
      if (count >= threshold.count) activeMods = threshold.mods;
    }
    if (activeMods) mergeMods(result, activeMods);
  }

  if (player.shipId === 'falcon') result.critDmgPct += result.dodge * 0.8;
  if (player.shipId === 'wasp') {
    result.subDmgPct += player.pods.length * 8;
    result.awakeningGainPct += player.pods.length * 6;
  }
  return result;
}

function refreshPlayerStats(world: WorldState, preserveRatio = false): void {
  const player = world.player;
  const ship = SHIPS.find((entry) => entry.id === player.shipId) ?? SHIPS[0];
  const oldMax = Math.max(1, player.maxHp);
  player.stats = calculateRuntimeStats(ship, player);
  player.maxHp = Math.max(1, player.stats.maxHp);
  player.hp = preserveRatio
    ? clamp((player.hp / oldMax) * player.maxHp, 0, player.maxHp)
    : clamp(player.hp, 0, player.maxHp);
}

function waveDurationFor(wave: number): number {
  return clamp(90 + (wave - 1) * 2, 90, 108);
}

export interface WavePressure {
  spawnInterval: number;
  groupChance: number;
  maxGroupSize: number;
  fireRateMult: number;
  bulletSpeedMult: number;
  initialFireDelayMax: number;
}

export function wavePressureFor(wave: number): WavePressure {
  const resolvedWave = clamp(Math.floor(wave), 1, 10);
  return {
    spawnInterval: clamp(1.42 - (resolvedWave - 1) * 0.06, 0.82, 1.42),
    groupChance: clamp(0.35 + (resolvedWave - 1) * 0.06, 0.35, 0.65),
    maxGroupSize: resolvedWave === 1 ? 2 : 3,
    fireRateMult: clamp(1.08 + (resolvedWave - 1) * 0.07, 1.08, 1.65),
    bulletSpeedMult: clamp(1.04 + (resolvedWave - 1) * 0.04, 1.04, 1.38),
    initialFireDelayMax: clamp(0.9 - (resolvedWave - 1) * 0.08, 0.45, 0.9),
  };
}

export interface PlayerFormModifiers {
  speedMult: number;
  armorBonus: number;
  mainDamageMult: number;
  subDamageMult: number;
  attackSpeedMult: number;
  critChanceBonus: number;
  radius: number;
}

export function playerFormModifiers(
  player: Pick<PlayerState, 'shipId' | 'form'>,
): PlayerFormModifiers {
  if (player.form === 'assault') {
    return {
      speedMult: 0.9,
      armorBonus: 3,
      mainDamageMult: 1,
      subDamageMult: 1,
      attackSpeedMult: 1,
      critChanceBonus: 0,
      radius: 11,
    };
  }
  if (player.form === 'flight') {
    return {
      speedMult: 1.25,
      armorBonus: -2,
      mainDamageMult: 1,
      subDamageMult: 1,
      attackSpeedMult: 1.18,
      critChanceBonus: 0,
      radius: 7,
    };
  }
  if (player.form === 'sniper') {
    return {
      speedMult: 1,
      armorBonus: 0,
      mainDamageMult: 1.2,
      subDamageMult: 1,
      attackSpeedMult: 0.9,
      critChanceBonus: 10,
      radius: 8,
    };
  }
  if (player.form === 'split') {
    return {
      speedMult: 1,
      armorBonus: -1,
      mainDamageMult: 1,
      subDamageMult: 1,
      attackSpeedMult: 1,
      critChanceBonus: 0,
      radius: 9,
    };
  }
  if (player.form === 'fortress') {
    return {
      speedMult: 0.6,
      armorBonus: 4,
      mainDamageMult: 1,
      subDamageMult: 1.45,
      attackSpeedMult: 1,
      critChanceBonus: 0,
      radius: 12,
    };
  }
  return {
    speedMult: 1,
    armorBonus: 0,
    mainDamageMult: 1,
    subDamageMult: 1,
    attackSpeedMult: 1,
    critChanceBonus: 0,
    radius: 9,
  };
}

export function effectivePlayerArmor(
  player: Pick<PlayerState, 'shipId' | 'form' | 'stats'>,
): number {
  return Math.max(0, player.stats.armor + playerFormModifiers(player).armorBonus);
}

function initialFormFor(shipId: ShipId): PlayerForm {
  return TRANSFORMATIONS[shipId].primary.id;
}

function nextFormFor(player: Pick<PlayerState, 'shipId' | 'form'>): PlayerForm {
  const config = TRANSFORMATIONS[player.shipId];
  return player.form === config.primary.id ? config.alternate.id : config.primary.id;
}

export function toggleTransformation(world: WorldState): boolean {
  const player = world.player;
  if (
    world.phase !== 'battle'
    || world.ultimate !== null
    || player.transformCooldown > 0
  ) return false;
  player.form = nextFormFor(player);
  player.transformCooldown = 1;
  player.transformTimer = 0.35;
  player.radius = playerFormModifiers(player).radius;
  if (player.shipId === 'wasp') {
    player.hiveShield = 0;
    player.hiveShieldCooldown = player.form === 'fortress' ? 3 : 6;
  }
  world.events.push({ type: 'transformed', form: player.form });
  world.flash = Math.max(world.flash, 0.12);
  world.shake = Math.max(world.shake, 4);
  return true;
}

function initialStats(): RunStats {
  return {
    kills: 0,
    bossesKilled: 0,
    damageDealt: 0,
    damageTaken: 0,
    shotsFired: 0,
    criticalHits: 0,
    grazes: 0,
    scrapCollected: 0,
    capsulesCollected: 0,
    dodges: 0,
    elapsed: 0,
  };
}

export function createWorld(shipId: ShipId, danger = 0, fieldWidth = FIELD_WIDTH): WorldState {
  const ship = SHIPS.find((entry) => entry.id === shipId) ?? SHIPS[0];
  const resolvedFieldWidth = clamp(fieldWidth, FIELD_WIDTH, WIDE_FIELD_WIDTH);
  const form = initialFormFor(ship.id);
  const player = {
    x: resolvedFieldWidth / 2,
    y: FIELD_HEIGHT - 92,
    radius: playerFormModifiers({ shipId: ship.id, form }).radius,
    shipId: ship.id,
    mainGun: ship.mainGun,
    subWeapon: ship.subWeapon,
    mainLevel: 1,
    subLevel: ship.id === 'wasp' ? 2 : 1,
    hp: ship.baseStats.maxHp,
    maxHp: ship.baseStats.maxHp,
    invulnerable: 1.5,
    fireCooldown: 0,
    subCooldown: 0,
    awakening: ship.defaultAwakening,
    awakeningTier: 1 as const,
    awakeningCharge: 0,
    form,
    transformCooldown: 0,
    transformTimer: 0,
    hiveShield: 0,
    hiveShieldCooldown: 6,
    scrap: 0,
    experience: 0,
    level: 1,
    experienceToNext: 40,
    pendingLevelUps: 0,
    stats: { ...ship.baseStats },
    permanentMods: {},
    pods: [] as PodState[],
    items: [] as string[],
  };
  const world: WorldState = {
    fieldWidth: resolvedFieldWidth,
    fieldHeight: FIELD_HEIGHT,
    player,
    enemies: [],
    playerShots: [],
    enemyShots: [],
    pickups: [],
    particles: [],
    damageTexts: [],
    wave: 1,
    waveTime: 0,
    waveDuration: waveDurationFor(1),
    phase: 'battle',
    scroll: 0,
    shake: 0,
    flash: 0,
    boss: null,
    stats: initialStats(),
    score: createScoreState(),
    rngSeed: ((0x9e3779b9 ^ (ship.id.charCodeAt(0) << 16) ^ danger) >>> 0) || 1,
    events: [],
    danger: clamp(Math.floor(danger), 0, DANGER_LEVELS.length - 1),
    ultimate: null,
    nextId: 1,
    spawnCooldown: 0.5,
    transportCooldown: 9,
    miniBossSpawned: false,
    miniBossDefeated: false,
    bossSpawned: false,
  };
  equipPod(world, ship.startingPod);
  return world;
}

export function resizeWorldField(world: WorldState, fieldWidth: number): void {
  const resolvedWidth = clamp(fieldWidth, FIELD_WIDTH, WIDE_FIELD_WIDTH);
  if (resolvedWidth === world.fieldWidth) return;
  const ratio = resolvedWidth / world.fieldWidth;
  const entities: Vec2[] = [
    world.player,
    ...world.enemies,
    ...world.playerShots,
    ...world.enemyShots,
    ...world.pickups,
    ...world.particles,
    ...world.damageTexts,
  ];
  for (const entity of entities) entity.x *= ratio;
  world.fieldWidth = resolvedWidth;
  world.player.x = clamp(world.player.x, world.player.radius + 5, resolvedWidth - world.player.radius - 5);
}

export function applyStatMods(world: WorldState, mods: StatMods): void {
  mergeMods(world.player.permanentMods, mods);
  refreshPlayerStats(world, true);
}

export function equipPod(world: WorldState, podId: string, tier: 1 | 2 | 3 | 4 = 1): boolean {
  const config = POD_WEAPONS.find((pod) => pod.id === podId);
  if (!config) return false;
  const existing = world.player.pods.find((pod) => pod.id === podId);
  if (existing) {
    existing.tier = clamp(Math.max(existing.tier, tier) + 1, 1, 4) as 1 | 2 | 3 | 4;
  } else {
    world.player.pods.push({
      id: podId,
      tier,
      cooldown: 0,
      angle: (world.player.pods.length / 3) * Math.PI * 2,
      tags: [...config.tags],
    });
  }
  refreshPlayerStats(world, false);
  return true;
}

export function applyItem(world: WorldState, itemId: string): boolean {
  const item = PASSIVE_ITEMS.find((entry) => entry.id === itemId);
  if (!item) return false;
  world.player.items.push(item.id);
  applyStatMods(world, item.mods);
  return true;
}

export function chooseLevelUp(world: WorldState, option: string | LevelUpOption): boolean {
  if (world.player.pendingLevelUps <= 0) return false;
  const selected = typeof option === 'string'
    ? LEVEL_UP_OPTIONS.find((entry) => entry.id === option)
    : option;
  if (!selected) return false;
  applyStatMods(world, selected.mods);
  world.player.pendingLevelUps -= 1;
  return true;
}

export function startNextWave(world: WorldState): boolean {
  if (world.phase !== 'waveClear' || world.wave >= 10) return false;
  world.wave += 1;
  world.waveTime = 0;
  world.waveDuration = waveDurationFor(world.wave);
  world.phase = 'battle';
  world.enemies.length = 0;
  world.enemyShots.length = 0;
  world.playerShots.length = 0;
  world.pickups.length = 0;
  world.boss = null;
  world.miniBossSpawned = false;
  world.miniBossDefeated = false;
  world.bossSpawned = false;
  world.spawnCooldown = 1;
  world.transportCooldown = randomRange(world, 7, 11);
  world.player.invulnerable = Math.max(world.player.invulnerable, 1.5);
  world.player.hp = clamp(world.player.hp + world.player.stats.harvest * 0.35, 0, world.player.maxHp);
  beginScoreWave(world.score);
  return true;
}

function addParticle(
  world: WorldState,
  x: number,
  y: number,
  color: string,
  count: number,
  speed = 85,
): void {
  for (let index = 0; index < count; index += 1) {
    const angle = nextRandom(world) * Math.PI * 2;
    const velocity = randomRange(world, speed * 0.3, speed);
    world.particles.push({
      id: newId(world),
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      age: 0,
      life: randomRange(world, 0.25, 0.75),
      size: randomRange(world, 1.5, 4),
      color,
      alpha: 1,
    });
  }
}

function addDamageText(
  world: WorldState,
  x: number,
  y: number,
  damage: number,
  critical: boolean,
  label?: string,
): void {
  world.damageTexts.push({
    id: newId(world),
    x,
    y,
    text: label ?? `${Math.round(damage)}`,
    color: critical ? '#fef08a' : '#ffffff',
    age: 0,
    life: 0.7,
    critical,
  });
}

function nearestEnemy(world: WorldState, from: Vec2, excluded = new Set<number>()): EnemyState | undefined {
  let nearest: EnemyState | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const enemy of world.enemies) {
    if (enemy.dead || excluded.has(enemy.id)) continue;
    const distance = distanceSquared(from, enemy);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = enemy;
    }
  }
  return nearest;
}

function makePlayerShot(
  world: WorldState,
  kind: ShotKind,
  x: number,
  y: number,
  vx: number,
  vy: number,
  damage: number,
  radius: number,
  color: string,
  extras: Partial<ShotState> = {},
): ShotState {
  const formMods = playerFormModifiers(world.player);
  const critChance = clamp(
    world.player.stats.critChance + formMods.critChanceBonus,
    0,
    95,
  ) / 100;
  const critical = nextRandom(world) < critChance;
  const finalDamage = damage * (critical ? world.player.stats.critDmgPct / 100 : 1);
  if (critical) world.stats.criticalHits += 1;
  return {
    id: newId(world),
    owner: 'player',
    kind,
    x,
    y,
    radius,
    width: radius * 2,
    height: radius * 2,
    vx,
    vy,
    damage: finalDamage,
    age: 0,
    life: 4,
    color,
    piercing: 0,
    homing: 0,
    critical,
    grazed: false,
    ...extras,
  };
}

function makeEnemyShot(
  world: WorldState,
  x: number,
  y: number,
  angle: number,
  speed: number,
  damage: number,
  radius = 5,
  color = '#fb7185',
): ShotState {
  return {
    id: newId(world),
    owner: 'enemy',
    kind: 'bullet',
    x,
    y,
    radius,
    width: radius * 2,
    height: radius * 2,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    damage,
    age: 0,
    life: 8,
    color,
    piercing: 0,
    homing: 0,
    critical: false,
    grazed: false,
  };
}

function playerDamageMultiplier(world: WorldState, channel: 'main' | 'sub' | 'awakening'): number {
  const stats = world.player.stats;
  const formMods = playerFormModifiers(world.player);
  const channelBonus = channel === 'main'
    ? stats.mainDmgPct
    : channel === 'sub'
      ? stats.subDmgPct
      : stats.awakeningDmgPct;
  const formMultiplier = channel === 'main'
    ? formMods.mainDamageMult
    : channel === 'sub'
      ? formMods.subDamageMult
      : 1;
  return (1 + stats.damagePct / 100) * (1 + channelBonus / 100) * formMultiplier;
}

function formAttackSpeedMultiplier(player: PlayerState, channel: 'main' | 'sub'): number {
  if (player.form === 'split' && channel === 'sub') return 1.3;
  return playerFormModifiers(player).attackSpeedMult;
}

function fireMainGun(world: WorldState, overdrive: number): void {
  const player = world.player;
  const level = clamp(player.mainLevel, 1, 8);
  const multiplier = playerDamageMultiplier(world, 'main');
  const attackSpeed = (1 + player.stats.attackSpeedPct / 100)
    * overdrive
    * formAttackSpeedMultiplier(player, 'main');
  player.fireCooldown = Math.max(0.045, 0.18 / attackSpeed);

  if (player.mainGun === 'vulcan') {
    const baseCount = 1 + Math.floor((level - 1) / 2);
    const count = player.form === 'assault'
      ? baseCount + 1
      : player.form === 'flight'
        ? Math.max(1, baseCount - 1)
        : baseCount;
    const formSpread = player.form === 'assault' ? 1.45 : player.form === 'flight' ? 0.5 : 1;
    const spread = (0.075 + level * 0.008) * formSpread;
    for (let index = 0; index < count; index += 1) {
      const offset = index - (count - 1) / 2;
      const angle = -Math.PI / 2 + offset * spread;
      world.playerShots.push(makePlayerShot(
        world,
        'bullet',
        player.x + offset * 7,
        player.y - 15,
        Math.cos(angle) * 620,
        Math.sin(angle) * 620,
        (9 + level * 2.1) * multiplier,
        3.5,
        '#ffb347',
      ));
    }
    world.stats.shotsFired += count;
    return;
  }

  if (player.mainGun === 'laser') {
    const width = 4 + level * 0.7;
    const baseDamage = (13 + level * 2.8) * multiplier;
    const splitOffsets = player.form === 'split' ? [-22, 0, 22] : [0];
    for (const offset of splitOffsets) {
      const damageScale = player.form === 'split' ? (offset === 0 ? 0.65 : 0.35) : 1;
      world.playerShots.push(makePlayerShot(
        world,
        'laser',
        player.x + offset,
        player.y - (offset === 0 ? 24 : 12),
        offset * 0.35,
        -880,
        baseDamage * damageScale,
        offset === 0 ? width : width * 0.72,
        offset === 0 ? '#67e8f9' : '#38bdf8',
        {
          width: offset === 0 ? width : width * 0.72,
          height: 38 + level * 4,
          piercing: 1 + Math.floor(level / 3),
          life: 1.2,
        },
      ));
    }
    world.stats.shotsFired += splitOffsets.length;
    return;
  }

  const count = 1 + Math.floor((level - 1) / 3);
  for (let index = 0; index < count; index += 1) {
    const target = nearestEnemy(world, player);
    world.playerShots.push(makePlayerShot(
      world,
      'arc',
      player.x + (index - (count - 1) / 2) * 12,
      player.y - 15,
      0,
      -520,
      (14 + level * 3) * multiplier,
      5,
      '#d8b4fe',
      {
        homing: 5.5,
        targetId: target?.id,
        piercing: Math.floor(level / 4) + (player.form === 'fortress' ? 1 : 0),
      },
    ));
  }
  world.stats.shotsFired += count;
}

function fireSubWeapon(world: WorldState, overdrive: number): void {
  const player = world.player;
  const level = clamp(player.subLevel, 1, 6);
  const multiplier = playerDamageMultiplier(world, 'sub');
  const attackSpeed = (1 + player.stats.attackSpeedPct / 100)
    * overdrive
    * formAttackSpeedMultiplier(player, 'sub');

  if (player.subWeapon === 'missile') {
    player.subCooldown = Math.max(0.2, 1.15 / attackSpeed);
    const baseCount = 2 + Math.floor(level / 2);
    const count = player.form === 'assault'
      ? baseCount + 2
      : player.form === 'flight'
        ? Math.max(1, baseCount - 1)
        : baseCount;
    for (let index = 0; index < count; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const target = nearestEnemy(world, player);
      world.playerShots.push(makePlayerShot(
        world,
        'missile',
        player.x + side * 16,
        player.y,
        side * 90,
        -280,
        (22 + level * 6) * multiplier,
        7,
        '#fb7185',
        { homing: 4 + level * 0.3, targetId: target?.id, life: 4.5 },
      ));
    }
    world.stats.shotsFired += count;
    return;
  }

  if (player.subWeapon === 'blade') {
    player.subCooldown = Math.max(0.28, 1.35 / attackSpeed);
    const count = 1 + Math.floor((level - 1) / 2);
    for (let index = 0; index < count; index += 1) {
      const offset = (index - (count - 1) / 2) * 18;
      world.playerShots.push(makePlayerShot(
        world,
        'blade',
        player.x + offset,
        player.y - 10,
        offset * 2.5,
        -380,
        (30 + level * 7) * multiplier,
        12,
        '#7dd3fc',
        { width: 28, height: 9, piercing: 2 + Math.floor(level / 2), life: 2.8 },
      ));
    }
    world.stats.shotsFired += count;
    return;
  }

  player.subCooldown = Math.max(0.15, 0.72 / attackSpeed);
  const count = 2 + level;
  for (let index = 0; index < count; index += 1) {
    const angle = -Math.PI / 2 + (index - (count - 1) / 2) * 0.09;
    const target = nearestEnemy(world, player);
    world.playerShots.push(makePlayerShot(
      world,
      'drone',
      player.x + Math.cos(index) * 20,
      player.y - 5 + Math.sin(index) * 8,
      Math.cos(angle) * 430,
      Math.sin(angle) * 430,
      (8 + level * 2.8) * multiplier,
      4,
      '#86efac',
      { homing: 7, targetId: target?.id, life: 2.5 },
    ));
  }
  world.stats.shotsFired += count;
}

function firePods(world: WorldState, dt: number, overdrive: number): void {
  const player = world.player;
  const attackSpeed = (1 + player.stats.attackSpeedPct / 100) * overdrive;
  for (let index = 0; index < player.pods.length; index += 1) {
    const pod = player.pods[index];
    const config = POD_WEAPONS.find((entry) => entry.id === pod.id);
    if (!config) continue;
    pod.cooldown -= dt;
    pod.angle += dt * (0.8 + index * 0.05);
    if (pod.cooldown > 0 || world.enemies.length === 0) continue;

    pod.cooldown = Math.max(0.04, config.baseCooldown / attackSpeed);
    const tierScale = config.tierScaling[pod.tier - 1];
    const damage = config.baseDmg * tierScale * playerDamageMultiplier(world, 'sub');
    const x = player.x + Math.cos(pod.angle) * (28 + index * 3);
    const y = player.y + Math.sin(pod.angle) * 15;
    const target = nearestEnemy(world, { x, y });
    const kind: ShotKind = pod.id === 'nuke' || pod.id === 'swarm'
      ? 'missile'
      : pod.id === 'shield_orb'
        ? 'arc'
        : 'pod';
    world.playerShots.push(makePlayerShot(
      world,
      kind,
      x,
      y,
      0,
      -500,
      damage,
      pod.id === 'nuke' ? 11 : 5,
      config.color,
      {
        homing: pod.id === 'gatling' || pod.id === 'railgun' ? 0 : 6,
        targetId: target?.id,
        piercing: pod.id === 'railgun' ? 4 : 0,
        life: 4,
      },
    ));
    world.stats.shotsFired += 1;
  }
}

function spawnEnemy(world: WorldState, type: EnemyType, x?: number, y = -40): EnemyState {
  const template = ENEMY_TEMPLATES[type];
  const danger = DANGER_LEVELS[world.danger];
  const pressure = wavePressureFor(world.wave);
  const waveScale = 1 + (world.wave - 1) * 0.11;
  const elite = type === 'elite' || type === 'miniBoss';
  const hp = template.hp * waveScale * danger.enemyHpMult;
  const enemy: EnemyState = {
    id: newId(world),
    type,
    x: x ?? randomRange(world, 35, world.fieldWidth - 35),
    y,
    radius: template.radius,
    width: template.width,
    height: template.height,
    hp,
    maxHp: hp,
    armor: template.armor + Math.floor((world.wave - 1) / 3),
    speed: template.speed,
    age: 0,
    fireCooldown: randomRange(world, 0.32, pressure.initialFireDelayMax)
      / Math.sqrt(danger.spawnRateMult),
    patternTime: 0,
    phase: 1,
    vx: type === 'drone' ? randomRange(world, -55, 55) : 0,
    vy: template.speed,
    elite,
    dead: false,
    frozen: 0,
    value: template.value,
  };
  world.enemies.push(enemy);
  return enemy;
}

function spawnMiniBoss(world: WorldState): void {
  if (world.miniBossSpawned) return;
  world.miniBossSpawned = true;
  const enemy = spawnEnemy(world, 'miniBoss', world.fieldWidth / 2, -75);
  enemy.miniBoss = true;
  enemy.displayName = `WAVE ${world.wave} · STAGE GUARDIAN`;
  enemy.vx = 0;
  enemy.vy = enemy.speed;
  world.enemyShots.length = 0;
  world.events.push({ type: 'miniBossSpawned', wave: world.wave });
}

function spawnBoss(world: WorldState): void {
  if (world.bossSpawned) return;
  world.bossSpawned = true;
  const type: BossType = world.wave === 5 ? 'spider' : 'valkyrie';
  const danger = DANGER_LEVELS[world.danger];
  const baseHp = type === 'spider' ? 4400 : 8200;
  const hp = baseHp * danger.enemyHpMult;
  const enemy: EnemyState = {
    id: newId(world),
    type: 'elite',
    bossType: type,
    x: world.fieldWidth / 2,
    y: -90,
    radius: type === 'spider' ? 58 : 50,
    width: type === 'spider' ? 130 : 105,
    height: type === 'spider' ? 100 : 118,
    hp,
    maxHp: hp,
    armor: type === 'spider' ? 5 : 8,
    speed: 52,
    age: 0,
    fireCooldown: 1.5,
    patternTime: 0,
    phase: 1,
    vx: 0,
    vy: 52,
    elite: true,
    dead: false,
    frozen: 0,
    value: type === 'spider' ? 180 : 300,
  };
  world.enemies.push(enemy);
  world.boss = { id: enemy.id, type, phase: 1, hp, maxHp: hp };
}

function selectEnemyType(world: WorldState): EnemyType {
  const roll = nextRandom(world);
  const wave = world.wave;
  if (wave >= 7 && roll < 0.08) return 'elite';
  if (wave >= 6 && roll < 0.21) return 'bomber';
  if (wave >= 4 && roll < 0.34) return 'turret';
  if (wave >= 3 && roll < 0.48) return 'tank';
  if (wave >= 2 && roll < 0.65) return 'heli';
  return roll < 0.82 ? 'fighter' : 'drone';
}

function updateSpawning(world: WorldState, dt: number): void {
  const bossWave = world.wave === 5 || world.wave === 10;
  const miniBossTime = Math.min(60, world.waveDuration * (2 / 3));
  if (!world.miniBossSpawned && world.waveTime >= miniBossTime) {
    spawnMiniBoss(world);
  }

  const miniBossAlive = world.enemies.some((enemy) => enemy.type === 'miniBoss' && !enemy.dead);
  const regularEnemiesAlive = world.enemies.some(
    (enemy) => enemy.type !== 'miniBoss' && !enemy.bossType && !enemy.dead,
  );
  if (
    bossWave
    && !world.bossSpawned
    && world.waveTime >= world.waveDuration
    && world.miniBossDefeated
    && !miniBossAlive
    && !regularEnemiesAlive
  ) {
    spawnBoss(world);
    return;
  }
  if (world.bossSpawned || miniBossAlive) return;

  const danger = DANGER_LEVELS[world.danger];
  const pressure = wavePressureFor(world.wave);
  world.spawnCooldown -= dt;
  world.transportCooldown -= dt;
  if (world.spawnCooldown <= 0 && world.waveTime < world.waveDuration - 2) {
    let group = 1;
    if (nextRandom(world) < pressure.groupChance) {
      group = pressure.maxGroupSize === 3 && nextRandom(world) < 0.4 ? 3 : 2;
    }
    for (let index = 0; index < group; index += 1) {
      spawnEnemy(world, selectEnemyType(world), randomRange(world, 35, world.fieldWidth - 35), -30 - index * 32);
    }
    const widthDensity = Math.sqrt(world.fieldWidth / FIELD_WIDTH);
    world.spawnCooldown = randomRange(world, pressure.spawnInterval * 0.75, pressure.spawnInterval * 1.25)
      / danger.spawnRateMult
      / widthDensity;
  }
  if (world.transportCooldown <= 0 && world.waveTime < world.waveDuration - 5) {
    spawnEnemy(world, 'transport', randomRange(world, 55, world.fieldWidth - 55));
    const hasBeacon = world.player.items.includes('airdrop_beacon');
    world.transportCooldown = randomRange(world, hasBeacon ? 7 : 11, hasBeacon ? 11 : 17);
  }
}

function aimAtPlayer(world: WorldState, enemy: EnemyState): number {
  return Math.atan2(world.player.y - enemy.y, world.player.x - enemy.x);
}

function fireEnemyPattern(world: WorldState, enemy: EnemyState): void {
  const danger = DANGER_LEVELS[world.danger];
  const pressure = wavePressureFor(world.wave);
  const damage = (8 + world.wave * 1.1 + (enemy.elite ? 4 : 0)) * danger.enemyDmgMult;
  const aim = aimAtPlayer(world, enemy);
  const template = ENEMY_TEMPLATES[enemy.type];

  if (enemy.type === 'drone' || enemy.type === 'fighter' || enemy.type === 'transport') {
    const count = enemy.type === 'fighter' && world.wave >= 4 ? 3 : 1;
    for (let index = 0; index < count; index += 1) {
      const spread = (index - (count - 1) / 2) * 0.18;
      world.enemyShots.push(makeEnemyShot(
        world,
        enemy.x,
        enemy.y + enemy.radius,
        aim + spread,
        165 * pressure.bulletSpeedMult,
        damage,
      ));
    }
  } else if (enemy.type === 'heli' || enemy.type === 'turret') {
    const count = 5 + Math.min(2, world.danger);
    for (let index = 0; index < count; index += 1) {
      const angle = aim + (index - (count - 1) / 2) * 0.16;
      world.enemyShots.push(makeEnemyShot(
        world,
        enemy.x,
        enemy.y,
        angle,
        140 * pressure.bulletSpeedMult,
        damage,
        5,
        '#f472b6',
      ));
    }
  } else if (enemy.type === 'tank' || enemy.type === 'bomber') {
    const count = 8 + world.danger * 2;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + enemy.age * 0.8;
      world.enemyShots.push(makeEnemyShot(
        world,
        enemy.x,
        enemy.y,
        angle,
        105 * pressure.bulletSpeedMult,
        damage * 0.75,
        6,
        '#fbbf24',
      ));
    }
  } else {
    const count = 10 + world.danger * 2;
    for (let index = 0; index < count; index += 1) {
      const angle = aim + (index - (count - 1) / 2) * 0.12;
      world.enemyShots.push(makeEnemyShot(
        world,
        enemy.x,
        enemy.y,
        angle,
        175 * pressure.bulletSpeedMult,
        damage,
        5.5,
        '#c084fc',
      ));
    }
  }
  enemy.fireCooldown = template.fireRate / danger.spawnRateMult / pressure.fireRateMult;
}

function fireBossPattern(world: WorldState, enemy: EnemyState): void {
  const bossType = enemy.bossType;
  if (!bossType) return;
  const danger = DANGER_LEVELS[world.danger];
  const damage = (12 + world.wave * 0.9) * danger.enemyDmgMult;
  const phase = enemy.phase;
  const aim = aimAtPlayer(world, enemy);

  if (bossType === 'spider') {
    if (phase === 1) {
      const count = 14 + world.danger * 2;
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2 + enemy.patternTime * 0.5;
        world.enemyShots.push(makeEnemyShot(world, enemy.x, enemy.y + 20, angle, 115, damage, 6, '#f97316'));
      }
      enemy.fireCooldown = 1.05;
    } else if (phase === 2) {
      for (let index = -5; index <= 5; index += 1) {
        world.enemyShots.push(makeEnemyShot(world, enemy.x, enemy.y + 30, aim + index * 0.115, 170, damage, 5, '#ef4444'));
      }
      enemy.fireCooldown = 0.72;
    } else {
      const count = 22 + world.danger * 3;
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2 + enemy.patternTime * 1.7;
        const speed = index % 2 === 0 ? 135 : 195;
        world.enemyShots.push(makeEnemyShot(world, enemy.x, enemy.y, angle, speed, damage, 5.5, '#fb7185'));
      }
      enemy.fireCooldown = 0.55;
    }
    return;
  }

  if (phase === 1) {
    for (let index = -7; index <= 7; index += 1) {
      const angle = aim + index * 0.095;
      world.enemyShots.push(makeEnemyShot(world, enemy.x, enemy.y + 30, angle, 210, damage, 5, '#a5f3fc'));
    }
    enemy.fireCooldown = 0.82;
  } else if (phase === 2) {
    const count = 26 + world.danger * 3;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 - enemy.patternTime * 1.15;
      world.enemyShots.push(makeEnemyShot(world, enemy.x, enemy.y, angle, 120 + (index % 3) * 35, damage, 5, '#c084fc'));
    }
    enemy.fireCooldown = 0.58;
  } else {
    const count = 18 + world.danger * 4;
    for (let index = 0; index < count; index += 1) {
      const lane = index % 2 === 0 ? 1 : -1;
      const angle = aim + lane * (0.1 + Math.floor(index / 2) * 0.075);
      world.enemyShots.push(makeEnemyShot(world, enemy.x, enemy.y, angle, 170 + index * 4, damage * 1.08, 6, '#e879f9'));
    }
    enemy.fireCooldown = 0.38;
  }
}

function updateEnemies(world: WorldState, dt: number): void {
  for (const enemy of world.enemies) {
    if (enemy.dead) continue;
    enemy.age += dt;
    enemy.patternTime += dt;

    const ratio = enemy.hp / enemy.maxHp;
    enemy.phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
    if (world.boss?.id === enemy.id) {
      world.boss.phase = enemy.phase as 1 | 2 | 3;
      world.boss.hp = Math.max(0, enemy.hp);
    }

    if (enemy.frozen > 0) {
      enemy.frozen -= dt;
      continue;
    }

    if (enemy.bossType) {
      if (enemy.y < 112) enemy.y += enemy.speed * dt;
      else {
        const sweep = Math.min(360, world.fieldWidth * 0.28);
        enemy.x = world.fieldWidth / 2 + Math.sin(enemy.age * (0.6 + enemy.phase * 0.15)) * sweep;
      }
      enemy.fireCooldown -= dt;
      if (enemy.fireCooldown <= 0 && enemy.y >= 90) fireBossPattern(world, enemy);
      continue;
    }

    if (enemy.type === 'miniBoss') {
      if (enemy.y < 138) {
        enemy.y += enemy.speed * dt;
      } else {
        const sweep = Math.min(270, world.fieldWidth * 0.22);
        enemy.x = world.fieldWidth / 2 + Math.sin(enemy.age * (0.85 + enemy.phase * 0.12)) * sweep;
      }
      enemy.fireCooldown -= dt;
      if (enemy.fireCooldown <= 0 && enemy.y >= 95) fireEnemyPattern(world, enemy);
      continue;
    }

    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    if (enemy.type === 'fighter' || enemy.type === 'drone' || enemy.type === 'heli') {
      enemy.x += Math.sin(enemy.age * 2.2 + enemy.id) * 34 * dt;
    }
    if (enemy.x < enemy.radius || enemy.x > world.fieldWidth - enemy.radius) enemy.vx *= -1;
    enemy.fireCooldown -= dt;
    if (enemy.fireCooldown <= 0 && enemy.y > 0 && enemy.y < world.fieldHeight * 0.82) {
      fireEnemyPattern(world, enemy);
    }
    if (enemy.y > world.fieldHeight + 80) enemy.dead = true;
  }
}

function updateHomingShot(world: WorldState, shot: ShotState, dt: number): void {
  if (shot.homing <= 0) return;
  let target = shot.targetId === undefined
    ? undefined
    : world.enemies.find((enemy) => enemy.id === shot.targetId && !enemy.dead);
  if (!target) {
    target = nearestEnemy(world, shot);
    shot.targetId = target?.id;
  }
  if (!target) return;
  const targetAngle = Math.atan2(target.y - shot.y, target.x - shot.x);
  const currentAngle = Math.atan2(shot.vy, shot.vx);
  const speed = Math.max(180, Math.hypot(shot.vx, shot.vy));
  let delta = targetAngle - currentAngle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const angle = currentAngle + clamp(delta, -shot.homing * dt, shot.homing * dt);
  shot.vx = Math.cos(angle) * speed;
  shot.vy = Math.sin(angle) * speed;
}

function updateShots(world: WorldState, dt: number): void {
  for (const shot of world.playerShots) {
    shot.age += dt;
    updateHomingShot(world, shot, dt);
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
  }
  const frozen = world.ultimate?.type === 'azure';
  for (const shot of world.enemyShots) {
    shot.age += dt;
    if (!frozen) {
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
    }
  }
}

function damageEnemy(
  world: WorldState,
  enemy: EnemyState,
  rawDamage: number,
  critical: boolean,
  armorPierce = 0,
): number {
  if (enemy.dead) return 0;
  const armor = Math.max(0, enemy.armor - armorPierce);
  const damage = Math.max(1, rawDamage * (100 / (100 + armor * 8)));
  enemy.hp -= damage;
  world.stats.damageDealt += damage;
  world.events.push({ type: 'hit', x: enemy.x, y: enemy.y, damage, critical });
  addDamageText(world, enemy.x, enemy.y - enemy.radius, damage, critical);
  if (enemy.hp <= 0) killEnemy(world, enemy);
  return damage;
}

function grantExperience(world: WorldState, amount: number): void {
  const player = world.player;
  player.experience += amount;
  while (player.experience >= player.experienceToNext) {
    player.experience -= player.experienceToNext;
    player.level += 1;
    player.pendingLevelUps += 1;
    player.experienceToNext = Math.round(40 + player.level * 18 + player.level * player.level * 1.5);
    world.events.push({ type: 'levelUp', level: player.level });
  }
}

function spawnPickup(
  world: WorldState,
  enemy: EnemyState,
  kind: PickupKind,
  value: number,
  capsule?: CapsuleType,
  burstIndex = 0,
  burstCount = 1,
): void {
  const angle = -Math.PI * 0.75 + (Math.PI * 1.5 * (burstIndex + 0.5)) / Math.max(1, burstCount);
  const speed = capsule ? 58 : 38 + (burstIndex % 3) * 9;
  world.pickups.push({
    id: newId(world),
    kind,
    sourceEnemyId: enemy.id,
    capsule,
    awakening: capsule === 'A' ? AWAKENING_CYCLE[0] : undefined,
    // 所有战利品均以被击毁敌机的机体坐标为出生点，再向外抛散。
    x: enemy.x,
    y: enemy.y,
    radius: capsule ? 11 : 7,
    value,
    age: 0,
    life: 15,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  });
}

function spawnScoreCrystals(world: WorldState, enemy: EnemyState): void {
  const award = awardEnemyKill(world.score, enemy.type, enemy.bossType);
  const count = award.crystals.length;
  award.crystals.forEach((crystal, index) => {
    const angle = -Math.PI * 0.86 + (Math.PI * 1.72 * (index + 0.5)) / Math.max(1, count);
    const speed = 56 + (index % 3) * 12;
    world.pickups.push({
      id: newId(world),
      kind: 'score',
      sourceEnemyId: enemy.id,
      scoreValue: crystal.value,
      crystalGrade: crystal.grade,
      x: enemy.x,
      y: enemy.y,
      radius: crystal.grade === 'rainbow' ? 12 : crystal.grade === 'gold' ? 10 : 8,
      value: crystal.value,
      age: 0,
      life: 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  });
}

function dropLoot(world: WorldState, enemy: EnemyState): void {
  const danger = DANGER_LEVELS[world.danger];
  if (enemy.type === 'transport') {
    const roll = nextRandom(world);
    const luck = world.player.stats.luck / 500;
    const capsule: CapsuleType = roll < 0.37 - luck ? 'M' : roll < 0.72 - luck * 0.3 ? 'S' : 'A';
    spawnPickup(world, enemy, 'capsule', 1, capsule);
  }

  // 废料总量由敌机型号和危险等级决定，不再进行随机场景刷新或随机价值浮动。
  const scrapTotal = Math.max(1, Math.round(enemy.value * danger.scrapMult));
  const scrapPieces = enemy.bossType
    ? 8
    : enemy.type === 'transport'
      ? 4
      : enemy.elite
        ? 5
        : Math.min(4, Math.max(1, Math.ceil(enemy.value / 8)));
  let distributed = 0;
  for (let index = 0; index < scrapPieces; index += 1) {
    const remaining = scrapTotal - distributed;
    const piecesLeft = scrapPieces - index;
    const value = Math.max(1, Math.floor(remaining / piecesLeft));
    distributed += value;
    spawnPickup(world, enemy, 'scrap', value, undefined, index, scrapPieces);
  }
  const energyChance = 0.18 + world.player.stats.luck * 0.002 + (enemy.elite ? 0.25 : 0);
  if (nextRandom(world) < energyChance) spawnPickup(world, enemy, 'energy', enemy.elite ? 12 : 5);
}

function killEnemy(world: WorldState, enemy: EnemyState): void {
  if (enemy.dead) return;
  enemy.dead = true;
  enemy.hp = 0;
  world.stats.kills += 1;
  grantExperience(world, Math.max(2, Math.round(enemy.value * 0.65)));
  world.events.push({ type: 'enemyKilled', enemy: enemy.type, boss: enemy.bossType });
  addParticle(world, enemy.x, enemy.y, enemy.bossType ? '#fbbf24' : '#fb7185', enemy.bossType ? 35 : 8, 150);
  world.shake = Math.max(world.shake, enemy.bossType ? 18 : 4);
  spawnScoreCrystals(world, enemy);
  dropLoot(world, enemy);

  if (enemy.type === 'miniBoss') {
    world.miniBossDefeated = true;
    world.enemyShots.length = 0;
  }
  if (enemy.bossType) {
    world.stats.bossesKilled += 1;
    world.enemyShots.length = 0;
    world.boss = null;
  }
}

function explodeMissile(world: WorldState, shot: ShotState): void {
  if (shot.kind !== 'missile') return;
  const radius = shot.radius >= 10 ? 72 : 38;
  for (const enemy of world.enemies) {
    if (!enemy.dead && distanceSquared(enemy, shot) <= radius * radius) {
      damageEnemy(world, enemy, shot.damage * 0.45, shot.critical);
    }
  }
  if (shot.radius >= 10) {
    world.enemyShots = world.enemyShots.filter((enemyShot) => distanceSquared(enemyShot, shot) > radius * radius);
  }
  addParticle(world, shot.x, shot.y, shot.color, 10, 130);
}

function chainArc(world: WorldState, first: EnemyState, shot: ShotState): void {
  if (shot.kind !== 'arc') return;
  const hit = new Set<number>([first.id]);
  let from: Vec2 = first;
  const chains = 1 + Math.floor(world.player.mainLevel / 3);
  for (let index = 0; index < chains; index += 1) {
    const target = nearestEnemy(world, from, hit);
    if (!target || distanceSquared(from, target) > 150 * 150) break;
    hit.add(target.id);
    damageEnemy(world, target, shot.damage * Math.pow(0.72, index + 1), shot.critical);
    addParticle(world, target.x, target.y, '#d8b4fe', 3, 60);
    from = target;
  }
}

function handlePlayerShotCollisions(world: WorldState): void {
  const removed = new Set<number>();
  for (const shot of world.playerShots) {
    if (removed.has(shot.id)) continue;
    for (const enemy of world.enemies) {
      if (enemy.dead) continue;
      const hitRadius = shot.radius + enemy.radius;
      if (distanceSquared(shot, enemy) > hitRadius * hitRadius) continue;
      const armorPierce = shot.kind === 'laser' || shot.kind === 'blade' ? 3 : 0;
      damageEnemy(world, enemy, shot.damage, shot.critical, armorPierce);
      chainArc(world, enemy, shot);
      explodeMissile(world, shot);
      if (shot.piercing > 0) {
        shot.piercing -= 1;
        shot.damage *= 0.82;
      } else {
        removed.add(shot.id);
        break;
      }
    }
  }
  world.playerShots = world.playerShots.filter((shot) => !removed.has(shot.id));
}

function isUltimateInvulnerable(world: WorldState): boolean {
  return world.ultimate?.type === 'violet';
}

function damagePlayer(world: WorldState, rawDamage: number): void {
  const player = world.player;
  if (player.invulnerable > 0 || isUltimateInvulnerable(world) || world.phase !== 'battle') return;
  if (nextRandom(world) < clamp(player.stats.dodge, 0, 75) / 100) {
    player.invulnerable = 0.18;
    world.stats.dodges += 1;
    world.events.push({ type: 'dodge' });
    addDamageText(world, player.x, player.y - 18, 0, false, 'DODGE');
    return;
  }
  const damage = Math.max(1, rawDamage * (100 / (100 + effectivePlayerArmor(player) * 10)));
  player.hp -= damage;
  player.invulnerable = 1.05;
  markWaveDamaged(world.score);
  world.stats.damageTaken += damage;
  world.events.push({ type: 'playerHit', damage });
  world.shake = Math.max(world.shake, 10);
  world.flash = Math.max(world.flash, 0.18);
  addDamageText(world, player.x, player.y - 20, damage, false);
  addParticle(world, player.x, player.y, '#ef4444', 12, 125);
  if (player.hp <= 0) {
    player.hp = 0;
    world.phase = 'gameOver';
    world.events.push({ type: 'gameOver' });
  }
}

function handleEnemyShotCollisions(world: WorldState): void {
  const removed = new Set<number>();
  const player = world.player;
  for (const shot of world.enemyShots) {
    const hitDistance = player.radius + shot.radius;
    const grazeDistance = hitDistance + 18;
    const distance = distanceSquared(player, shot);
    if (distance <= hitDistance * hitDistance) {
      removed.add(shot.id);
      if (player.form === 'fortress' && player.hiveShield > 0) {
        player.hiveShield = 0;
        player.hiveShieldCooldown = 6;
        world.events.push({ type: 'hiveShieldBlocked' });
        world.shake = Math.max(world.shake, 3);
        addParticle(world, player.x, player.y, '#f0abfc', 10, 95);
        continue;
      }
      damagePlayer(world, shot.damage);
    } else if (!shot.grazed && distance <= grazeDistance * grazeDistance) {
      shot.grazed = true;
      const falconMultiplier = player.shipId === 'falcon' ? 2 : 1;
      const converter = player.items.includes('graze_converter');
      const charge = (1.5 + (converter ? 3 : 0)) * falconMultiplier * (1 + player.stats.awakeningGainPct / 100);
      grantAwakeningCharge(player, charge);
      if (player.shipId === 'falcon' || converter) {
        const scrap = player.shipId === 'falcon' ? 2 : 1;
        player.scrap += scrap;
        world.stats.scrapCollected += scrap;
      }
      world.stats.grazes += 1;
      world.events.push({ type: 'graze', charge });
    }
  }
  world.enemyShots = world.enemyShots.filter((shot) => !removed.has(shot.id));
}

function handleContactCollisions(world: WorldState): void {
  for (const enemy of world.enemies) {
    if (enemy.dead || !circlesOverlap(world.player, world.player.radius, enemy, enemy.radius * 0.75)) continue;
    damagePlayer(world, enemy.bossType ? 35 : 14 + world.wave);
    if (!enemy.bossType) damageEnemy(world, enemy, enemy.maxHp * 0.45, false);
  }
}

function currentCapsuleAwakening(age: number): AwakeningType {
  return AWAKENING_CYCLE[Math.floor(age / 0.8) % AWAKENING_CYCLE.length];
}

function collectPickup(world: WorldState, pickup: PickupState): void {
  const player = world.player;
  world.events.push({
    type: 'pickup',
    pickup: pickup.kind,
    capsule: pickup.capsule,
    value: pickup.scoreValue,
  });
  if (pickup.kind === 'score') {
    const value = pickup.scoreValue ?? pickup.value;
    collectScoreCrystal(world.score, value);
    addDamageText(world, pickup.x, pickup.y - 8, value, true, `+${value}`);
    return;
  }
  if (pickup.kind === 'scrap') {
    player.scrap += pickup.value;
    world.stats.scrapCollected += pickup.value;
    return;
  }
  if (pickup.kind === 'energy') {
    const gain = pickup.value * (1 + player.stats.awakeningGainPct / 100);
    grantAwakeningCharge(player, gain);
    return;
  }

  world.stats.capsulesCollected += 1;
  if (pickup.capsule === 'M') player.mainLevel = Math.min(8, player.mainLevel + 1);
  if (pickup.capsule === 'S') player.subLevel = Math.min(6, player.subLevel + 1);
  if (pickup.capsule === 'A') {
    const awakening = pickup.awakening ?? currentCapsuleAwakening(pickup.age);
    if (awakening === player.awakening) {
      player.awakeningTier = Math.min(3, player.awakeningTier + 1) as 1 | 2 | 3;
    } else {
      player.awakening = awakening;
      player.awakeningTier = 1;
    }
    grantAwakeningCharge(player, 35);
  }
  if (player.shipId === 'raiden') {
    player.scrap += 8;
    player.hp = clamp(player.hp + 5, 0, player.maxHp);
    grantAwakeningCharge(player, 12);
    world.stats.scrapCollected += 8;
  }
}

function updatePickups(world: WorldState, dt: number): void {
  const collected = new Set<number>();
  const player = world.player;
  const baseRange = 42 * (1 + player.stats.pickupRangePct / 100);
  for (const pickup of world.pickups) {
    pickup.age += dt;
    if (pickup.capsule === 'A') pickup.awakening = currentCapsuleAwakening(pickup.age);
    pickup.vx *= Math.pow(0.8, dt);
    pickup.vy = Math.min(95, pickup.vy + 18 * dt);
    const distance = Math.sqrt(distanceSquared(player, pickup));
    const range = pickup.kind === 'score'
      ? 125 * (1 + player.stats.pickupRangePct / 200)
      : baseRange;
    if (distance < range && (pickup.kind !== 'score' || pickup.age >= 0.25)) {
      const force = distance < 1 ? 0 : (pickup.kind === 'score' ? 720 : 460) / distance;
      pickup.vx += (player.x - pickup.x) * force * dt;
      pickup.vy += (player.y - pickup.y) * force * dt;
    }
    pickup.x += pickup.vx * dt;
    pickup.y += pickup.vy * dt;
    if (circlesOverlap(player, player.radius, pickup, pickup.radius + 3)) {
      collectPickup(world, pickup);
      collected.add(pickup.id);
      addParticle(world, pickup.x, pickup.y, '#fef08a', 7, 80);
    }
  }
  world.pickups = world.pickups.filter((pickup) => {
    if (collected.has(pickup.id)) return false;
    const expired = pickup.age >= pickup.life || pickup.y >= world.fieldHeight + 70;
    if (expired && pickup.kind === 'score') {
      missScoreCrystal(world.score, pickup.scoreValue ?? pickup.value);
    }
    return !expired;
  });
}

export function activateAwakening(world: WorldState): boolean {
  const player = world.player;
  if (
    world.phase !== 'battle'
    || world.ultimate !== null
    || player.awakeningCharge < 100
  ) return false;
  const config = AWAKENINGS[player.awakening].tiers[player.awakeningTier - 1];
  player.awakeningCharge = Math.max(0, player.awakeningCharge - 100);
  player.invulnerable = Math.max(player.invulnerable, 0.75);
  world.ultimate = {
    type: player.awakening,
    tier: player.awakeningTier,
    age: 0,
    duration: config.duration,
    tick: 0,
    slashCount: 0,
    storedDamage: 0,
  };
  world.events.push({
    type: 'awakening',
    awakening: player.awakening,
    tier: player.awakeningTier,
  });
  world.flash = 0.45;
  world.shake = 14;
  if (player.awakening === 'azure') {
    for (const enemy of world.enemies) enemy.frozen = Math.max(enemy.frozen, config.duration);
  }
  return true;
}

function updateCrimsonUltimate(world: WorldState, ultimate: UltimateState, dt: number): void {
  ultimate.tick -= dt;
  if (ultimate.tick > 0) return;
  ultimate.tick += 0.08;
  const tierConfig = AWAKENINGS.crimson.tiers[ultimate.tier - 1];
  const halfWidth = 38 + ultimate.tier * 18;
  const damage = (38 + ultimate.tier * 18) * tierConfig.dmgMult * playerDamageMultiplier(world, 'awakening');
  for (const enemy of world.enemies) {
    if (!enemy.dead && Math.abs(enemy.x - world.player.x) <= halfWidth + enemy.radius && enemy.y < world.player.y) {
      damageEnemy(world, enemy, damage, true, 99);
    }
  }
  world.enemyShots = world.enemyShots.filter(
    (shot) => Math.abs(shot.x - world.player.x) > halfWidth || shot.y > world.player.y,
  );
  if (ultimate.tier >= 2) {
    world.player.hp = clamp(world.player.hp + world.player.maxHp * 0.06 * 0.08, 0, world.player.maxHp);
  }
  addParticle(world, world.player.x + randomRange(world, -halfWidth, halfWidth), randomRange(world, 80, world.player.y), '#ff6b4a', 2, 50);
}

function updateAzureUltimate(world: WorldState, ultimate: UltimateState, dt: number): void {
  const desiredSlashes = Math.floor(
    (ultimate.age / ultimate.duration) * (ultimate.tier === 1 ? 28 : ultimate.tier === 2 ? 45 : 72),
  );
  while (ultimate.slashCount < desiredSlashes) {
    ultimate.slashCount += 1;
    const target = nearestEnemy(world, {
      x: randomRange(world, 0, world.fieldWidth),
      y: randomRange(world, 0, world.fieldHeight * 0.75),
    });
    if (!target) continue;
    const tierConfig = AWAKENINGS.azure.tiers[ultimate.tier - 1];
    const damage = (16 + ultimate.tier * 8) * tierConfig.dmgMult * playerDamageMultiplier(world, 'awakening');
    ultimate.storedDamage += damageEnemy(world, target, damage, false, 99);
    world.playerShots.push(makePlayerShot(
      world,
      'slash',
      target.x + randomRange(world, -25, 25),
      target.y + randomRange(world, -20, 20),
      0,
      0,
      0,
      1,
      '#7dd3fc',
      { width: 70, height: 5, life: 0.18 },
    ));
  }
  if (ultimate.tier >= 2) {
    const before = world.enemyShots.length;
    world.enemyShots.length = 0;
    grantAwakeningCharge(world.player, before * 0.12 * dt);
  }
}

function updateVioletUltimate(world: WorldState, ultimate: UltimateState, dt: number): void {
  ultimate.tick -= dt;
  if (ultimate.tick > 0) return;
  ultimate.tick += 0.22 / ultimate.tier;
  const target = nearestEnemy(world, {
    x: randomRange(world, 0, world.fieldWidth),
    y: randomRange(world, 0, world.fieldHeight * 0.8),
  });
  if (!target) return;
  const tierConfig = AWAKENINGS.violet.tiers[ultimate.tier - 1];
  const damage = (85 + ultimate.tier * 30) * tierConfig.dmgMult * playerDamageMultiplier(world, 'awakening');
  damageEnemy(world, target, damage, true, 8);
  world.playerShots.push(makePlayerShot(
    world,
    'lightning',
    target.x,
    target.y,
    0,
    0,
    0,
    2,
    '#e879f9',
    { width: 8, height: target.y, life: 0.12 },
  ));
  addParticle(world, target.x, target.y, '#e879f9', 9, 140);
}

function finishUltimate(world: WorldState, ultimate: UltimateState): void {
  if (ultimate.type === 'crimson' && ultimate.tier === 3) {
    const damage = 650 * playerDamageMultiplier(world, 'awakening');
    for (const enemy of world.enemies) damageEnemy(world, enemy, damage, true, 99);
    world.enemyShots.length = 0;
    world.flash = 0.6;
  } else if (ultimate.type === 'azure') {
    const tierConfig = AWAKENINGS.azure.tiers[ultimate.tier - 1];
    const damage = (120 + ultimate.tier * 100 + ultimate.storedDamage * 0.18)
      * tierConfig.dmgMult
      * playerDamageMultiplier(world, 'awakening');
    for (const enemy of world.enemies) damageEnemy(world, enemy, damage, ultimate.tier === 3, 99);
    world.enemyShots.length = 0;
    world.flash = 0.45;
  }
  world.ultimate = null;
}

function updateUltimate(world: WorldState, dt: number): void {
  const ultimate = world.ultimate;
  if (!ultimate) return;
  ultimate.age += dt;
  if (ultimate.type === 'crimson') updateCrimsonUltimate(world, ultimate, dt);
  else if (ultimate.type === 'azure') updateAzureUltimate(world, ultimate, dt);
  else updateVioletUltimate(world, ultimate, dt);
  if (ultimate.age >= ultimate.duration) finishUltimate(world, ultimate);
}

function movePlayer(world: WorldState, dt: number, input: InputFrame): void {
  const player = world.player;
  const length = Math.hypot(input.dx, input.dy);
  const dx = length > 1 ? input.dx / length : input.dx;
  const dy = length > 1 ? input.dy / length : input.dy;
  const baseSpeed = 120
    * (1 + player.stats.speedPct / 100)
    * playerFormModifiers(player).speedMult
    * (input.slow ? 0.45 : 1);
  const maxDistance = baseSpeed * dt;
  let moveX = dx * maxDistance + input.dragX;
  let moveY = dy * maxDistance + input.dragY;
  const moveDistance = Math.hypot(moveX, moveY);
  if (moveDistance > maxDistance) {
    moveX = (moveX / moveDistance) * maxDistance;
    moveY = (moveY / moveDistance) * maxDistance;
  }
  player.x += moveX;
  player.y += moveY;
  player.x = clamp(player.x, player.radius + 5, world.fieldWidth - player.radius - 5);
  player.y = clamp(player.y, 80, world.fieldHeight - player.radius - 8);
}

function updatePlayer(world: WorldState, dt: number, input: InputFrame): void {
  const player = world.player;
  player.transformCooldown = Math.max(0, player.transformCooldown - dt);
  player.transformTimer = Math.max(0, player.transformTimer - dt);
  if (input.transform) toggleTransformation(world);
  if (player.form === 'fortress') {
    if (player.hiveShield <= 0) {
      player.hiveShieldCooldown = Math.max(0, player.hiveShieldCooldown - dt);
      if (player.hiveShieldCooldown <= 0) player.hiveShield = 1;
    }
  } else if (player.shipId === 'wasp') {
    player.hiveShield = 0;
    player.hiveShieldCooldown = 6;
  }
  movePlayer(world, dt, input);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  player.fireCooldown -= dt;
  player.subCooldown -= dt;
  player.hp = clamp(player.hp + player.stats.hpRegen * dt, 0, player.maxHp);
  if (input.ultimate) activateAwakening(world);

  const violet = world.ultimate?.type === 'violet' ? world.ultimate : null;
  const overdrive = violet ? 1.8 + violet.tier * 0.35 : 1;
  if (input.firing && player.fireCooldown <= 0) fireMainGun(world, overdrive);
  if (input.firing && player.subCooldown <= 0) fireSubWeapon(world, overdrive);
  if (input.firing) firePods(world, dt, overdrive);
}

function updateEffects(world: WorldState, dt: number): void {
  for (const particle of world.particles) {
    particle.age += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.08, dt);
    particle.vy *= Math.pow(0.08, dt);
    particle.alpha = clamp(1 - particle.age / particle.life, 0, 1);
  }
  for (const text of world.damageTexts) {
    text.age += dt;
    text.y -= 34 * dt;
  }
  world.particles = world.particles.filter((particle) => particle.age < particle.life);
  world.damageTexts = world.damageTexts.filter((text) => text.age < text.life);
  world.shake = Math.max(0, world.shake - 30 * dt);
  world.flash = Math.max(0, world.flash - dt);
}

function removeExpiredEntities(world: WorldState): void {
  world.playerShots = world.playerShots.filter(
    (shot) => shot.age < shot.life
      && shot.x > -100
      && shot.x < world.fieldWidth + 100
      && shot.y > -120
      && shot.y < world.fieldHeight + 120,
  );
  world.enemyShots = world.enemyShots.filter(
    (shot) => shot.age < shot.life
      && shot.x > -80
      && shot.x < world.fieldWidth + 80
      && shot.y > -80
      && shot.y < world.fieldHeight + 80,
  );
  world.enemies = world.enemies.filter((enemy) => !enemy.dead);
}

function enterWaveClear(world: WorldState): void {
  if (world.phase !== 'battle') return;
  world.phase = 'waveClear';
  world.enemyShots.length = 0;
  world.playerShots.length = 0;
  world.player.scrap += Math.max(0, Math.round(world.player.stats.harvest));
  world.stats.scrapCollected += Math.max(0, Math.round(world.player.stats.harvest));
  const noHitBonus = completeScoreWave(world.score, world.wave === 5 || world.wave === 10);
  world.events.push({ type: 'waveClear', wave: world.wave, noHitBonus });
}

function checkWaveEnd(world: WorldState): void {
  if (world.phase !== 'battle' || world.enemies.length > 0) return;
  if (world.pickups.some((pickup) => pickup.kind === 'score')) return;
  if (world.wave === 5 || world.wave === 10) {
    if (!world.bossSpawned) return;
    if (world.boss !== null) return;
    if (world.wave === 10) {
      completeScoreWave(world.score, true);
      world.phase = 'victory';
      world.events.push({ type: 'victory' });
      return;
    }
    enterWaveClear(world);
    return;
  }
  if (
    world.waveTime >= world.waveDuration
    && world.miniBossSpawned
    && world.miniBossDefeated
  ) enterWaveClear(world);
}

function simulateStep(world: WorldState, dt: number, input: InputFrame): void {
  world.stats.elapsed += dt;
  world.waveTime += dt;
  world.scroll = (world.scroll + dt * (55 + world.wave * 2)) % world.fieldHeight;

  updatePlayer(world, dt, input);
  updateSpawning(world, dt);
  updateEnemies(world, dt);
  updateUltimate(world, dt);
  updateShots(world, dt);
  handlePlayerShotCollisions(world);
  handleEnemyShotCollisions(world);
  handleContactCollisions(world);
  updatePickups(world, dt);
  updateEffects(world, dt);
  removeExpiredEntities(world);
  checkWaveEnd(world);
}

/**
 * Advances the deterministic simulation. Large frame times are subdivided so
 * collisions and scripted fire rates remain stable without depending on a renderer.
 */
export function stepWorld(world: WorldState, dt: number, input: InputFrame = EMPTY_INPUT): void {
  world.events.length = 0;
  if (world.phase !== 'battle' || !Number.isFinite(dt) || dt <= 0) return;
  let remaining = Math.min(dt, 0.25);
  const totalDt = remaining;
  while (remaining > 0 && world.phase === 'battle') {
    const step = Math.min(remaining, 1 / 60);
    const stepInput = input.dragX === 0 && input.dragY === 0
      ? input
      : {
          ...input,
          dragX: input.dragX * (step / totalDt),
          dragY: input.dragY * (step / totalDt),
        };
    simulateStep(world, step, stepInput);
    remaining -= step;
  }
}
