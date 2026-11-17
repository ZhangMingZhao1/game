import {
  TRANSFORMATIONS,
  type AwakeningType,
  type PlayerForm,
  type ShipId,
} from '../data/config';

export const LOGICAL_WIDTH = 480;
export const LOGICAL_HEIGHT = 720;

export interface PlayerSpriteSpec {
  src: string;
  width: number;
  height: number;
}

const PLAYER_SPRITE_SPECS: Partial<Record<ShipId, Partial<Record<PlayerForm, PlayerSpriteSpec>>>> = {
  raiden: {
    assault: {
      src: '/assets/mecha/player/player_crimson_assault_mech.png',
      width: 72,
      height: 92,
    },
    flight: {
      src: '/assets/mecha/player/player_crimson_assault_flight.png',
      width: 82,
      height: 78,
    },
  },
};

export function getPlayerSpriteSpec(
  shipId: ShipId,
  form: PlayerForm = TRANSFORMATIONS[shipId].primary.id,
): PlayerSpriteSpec | undefined {
  return PLAYER_SPRITE_SPECS[shipId]?.[form];
}

export type StageBackgroundLayer = 'far' | 'mid' | 'near';

export interface StageBackgroundSpec {
  src: string;
  layer: StageBackgroundLayer;
}

const STAGE_BACKGROUND_SPECS: Partial<Record<number, Partial<Record<StageBackgroundLayer, StageBackgroundSpec>>>> = {
  1: {
    far: {
      src: '/assets/backgrounds/wave01_orbit/wave01_orbit_far.jpg',
      layer: 'far',
    },
  },
};

export function getStageBackgroundSpec(
  wave: number,
  layer: StageBackgroundLayer,
): StageBackgroundSpec | undefined {
  return STAGE_BACKGROUND_SPECS[wave]?.[layer];
}

export function computeFieldViewport(
  cssWidth: number,
  cssHeight: number,
  logicalWidth: number,
  logicalHeight: number,
): RenderRect & { scale: number } {
  const scale = Math.min(cssWidth / logicalWidth, cssHeight / logicalHeight);
  const width = logicalWidth * scale;
  const height = logicalHeight * scale;
  return {
    scale,
    x: (cssWidth - width) * 0.5,
    y: (cssHeight - height) * 0.5,
    width,
    height,
  };
}

export interface Point {
  x: number;
  y: number;
}

export interface ScreenPoint extends Point {
  inside: boolean;
}

export interface RenderRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderEntityLike {
  x?: number;
  y?: number;
  prevX?: number;
  prevY?: number;
  radius?: number;
  size?: number;
  width?: number;
  height?: number;
  rotation?: number;
  angle?: number;
  color?: string;
  alpha?: number;
  type?: string;
  kind?: string;
  id?: string;
  hp?: number;
  maxHp?: number;
  active?: boolean;
  dead?: boolean;
}

export interface RenderUltimateLike {
  type?: AwakeningType;
  timer?: number;
  age?: number;
  duration?: number;
  tier?: number;
  active?: boolean;
}

/**
 * 渲染器只读取这些字段。字段均为可选，以便尚未定型的 World 类直接以
 * 结构化类型接入；render() 同时接受任意 object。
 */
export interface RenderWorldLike {
  time?: number;
  elapsed?: number;
  wave?: number;
  waveTimer?: number;
  waveDuration?: number;
  fieldWidth?: number;
  fieldHeight?: number;
  score?: number;
  noHitEligible?: boolean;
  scrap?: number;
  player?: RenderEntityLike;
  ship?: RenderEntityLike;
  enemies?: RenderEntityLike[];
  bosses?: RenderEntityLike[];
  boss?: RenderEntityLike | null;
  playerBullets?: RenderEntityLike[];
  playerShots?: RenderEntityLike[];
  enemyBullets?: RenderEntityLike[];
  enemyShots?: RenderEntityLike[];
  bullets?: RenderEntityLike[];
  pickups?: RenderEntityLike[];
  drops?: RenderEntityLike[];
  particles?: RenderEntityLike[];
  damageNumbers?: RenderEntityLike[];
  damageTexts?: RenderEntityLike[];
  ultimate?: RenderUltimateLike | null;
  flash?: number | string;
  shake?: number;
  bossWarning?: number | boolean;
  waveBanner?: number | string;
}

type AnyRecord = Record<string, unknown>;
type Entity = RenderEntityLike & AnyRecord;

const TAU = Math.PI * 2;
const FONT = '"Segoe UI", "Microsoft YaHei", system-ui, sans-serif';

const clamp = (value: number, min = 0, max = 1): number => Math.max(min, Math.min(max, value));
const n = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const s = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
const record = (value: unknown): AnyRecord =>
  typeof value === 'object' && value !== null ? (value as AnyRecord) : {};
const entities = (value: unknown): Entity[] => (Array.isArray(value) ? (value as Entity[]) : []);
const first = (source: AnyRecord, ...keys: string[]): unknown => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
};
const hash = (value: number): number => {
  const x = Math.sin(value * 91.3458 + 17.234) * 47453.5453;
  return x - Math.floor(x);
};
const rgba = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(clean)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${parseInt(clean.slice(0, 2), 16)},${parseInt(clean.slice(2, 4), 16)},${parseInt(clean.slice(4, 6), 16)},${alpha})`;
};

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  glow: number;
}

interface CachedSprites {
  orbs: Map<string, HTMLCanvasElement>;
  glows: Map<string, HTMLCanvasElement>;
  explosions: HTMLCanvasElement[];
}

export class CanvasRenderer {
  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  public scale = 1;
  public offset: Point = { x: 0, y: 0 };
  public fieldRect: RenderRect = { x: 0, y: 0, width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT };

  private dpr = 1;
  private cssWidth = LOGICAL_WIDTH;
  private cssHeight = LOGICAL_HEIGHT;
  private logicalWidth = LOGICAL_WIDTH;
  private logicalHeight = LOGICAL_HEIGHT;
  private readonly cache: CachedSprites = {
    orbs: new Map<string, HTMLCanvasElement>(),
    glows: new Map<string, HTMLCanvasElement>(),
    explosions: [],
  };
  private readonly stars: Star[] = [];
  private readonly playerSprites = new Map<string, HTMLImageElement>();
  private readonly stageBackgrounds = new Map<string, HTMLImageElement>();
  private readonly onWindowResize = (): void => this.resize();

  public constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) throw new Error('Canvas 2D context is unavailable');
    this.ctx = ctx;
    this.canvas.style.display = 'block';
    this.canvas.style.touchAction = 'none';
    this.canvas.style.background = '#02050d';
    this.buildCaches();
    this.buildStars();
    this.loadPlayerSprites();
    this.loadStageBackgrounds();
    this.resize();
    if (typeof window !== 'undefined') window.addEventListener('resize', this.onWindowResize, { passive: true });
  }

  public destroy(): void {
    if (typeof window !== 'undefined') window.removeEventListener('resize', this.onWindowResize);
  }

  /**
   * width/height 为 CSS 像素。省略时优先使用父容器，其次使用窗口尺寸。
   */
  public resize(width?: number, height?: number): void {
    const parent = this.canvas.parentElement;
    const fallbackWidth = typeof window !== 'undefined' ? window.innerWidth : LOGICAL_WIDTH;
    const fallbackHeight = typeof window !== 'undefined' ? window.innerHeight : LOGICAL_HEIGHT;
    this.cssWidth = Math.max(1, width ?? parent?.clientWidth ?? this.canvas.clientWidth ?? fallbackWidth);
    this.cssHeight = Math.max(1, height ?? parent?.clientHeight ?? this.canvas.clientHeight ?? fallbackHeight);
    this.dpr = Math.min(2, Math.max(1, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));
    const viewport = computeFieldViewport(
      this.cssWidth,
      this.cssHeight,
      this.logicalWidth,
      this.logicalHeight,
    );
    this.scale = viewport.scale;
    this.offset = { x: viewport.x, y: viewport.y };
    this.fieldRect = {
      x: viewport.x,
      y: viewport.y,
      width: viewport.width,
      height: viewport.height,
    };
    const pixelWidth = Math.max(1, Math.round(this.cssWidth * this.dpr));
    const pixelHeight = Math.max(1, Math.round(this.cssHeight * this.dpr));
    if (this.canvas.width !== pixelWidth) this.canvas.width = pixelWidth;
    if (this.canvas.height !== pixelHeight) this.canvas.height = pixelHeight;
    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;
    this.ctx.imageSmoothingEnabled = true;
  }

  public screenToField(clientX: number, clientY: number): ScreenPoint {
    const bounds = this.canvas.getBoundingClientRect();
    const cssX = clientX - bounds.left;
    const cssY = clientY - bounds.top;
    const x = (cssX - this.offset.x) / this.scale;
    const y = (cssY - this.offset.y) / this.scale;
    return { x, y, inside: x >= 0 && x <= this.logicalWidth && y >= 0 && y <= this.logicalHeight };
  }

  public render(world: RenderWorldLike | object, alpha = 1): void {
    const w = record(world);
    const fieldWidth = Math.max(LOGICAL_WIDTH, n(w.fieldWidth, LOGICAL_WIDTH));
    const fieldHeight = Math.max(1, n(w.fieldHeight, LOGICAL_HEIGHT));
    if (fieldWidth !== this.logicalWidth || fieldHeight !== this.logicalHeight) {
      this.logicalWidth = fieldWidth;
      this.logicalHeight = fieldHeight;
      this.buildStars();
      this.resize();
    }
    const stats = record(w.stats);
    const time = n(first(w, 'time', 'elapsed', 'gameTime'), n(stats.elapsed, performance.now() * 0.001));
    const interpolation = clamp(alpha);
    const shake = n(first(w, 'shake', 'shakeAmount', 'screenShake'));
    const ultimate = record(w.ultimate);
    const ultimateActive =
      Object.keys(ultimate).length > 0 &&
      ultimate.active !== false &&
      n(ultimate.duration, 1) > 0;
    const ultimateType = this.awakeningType(ultimate.type);
    const ultimateIntensity = ultimateActive
      ? this.ultimateEnvelope(n(first(ultimate, 'age', 'timer')), n(ultimate.duration, 1))
      : 0;
    const ultimateShake = ultimateType === 'crimson' ? ultimateIntensity * 4 : ultimateType === 'violet' ? ultimateIntensity * 2 : 0;
    const shakeX = shake + ultimateShake > 0 ? Math.sin(time * 83) * (shake + ultimateShake) : 0;
    const shakeY = shake + ultimateShake > 0 ? Math.cos(time * 71) * (shake + ultimateShake) * 0.72 : 0;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = '#01030a';
    this.ctx.fillRect(0, 0, this.cssWidth, this.cssHeight);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(this.offset.x, this.offset.y, this.logicalWidth * this.scale, this.logicalHeight * this.scale);
    this.ctx.clip();
    this.ctx.translate(this.offset.x + shakeX * this.scale, this.offset.y + shakeY * this.scale);
    this.ctx.scale(this.scale, this.scale);

    this.drawBackground(w, time);
    if (ultimateActive && ultimateType === 'azure') this.drawAzureAtmosphere(time, ultimateIntensity);
    this.drawWorld(w, interpolation, time);
    if (ultimateActive) this.drawUltimate(ultimateType, ultimate, w, time);
    this.drawWorldOverlays(w, time);
    this.drawHud(w, time);
    this.ctx.restore();

    this.drawLetterbox();
  }

  private buildStars(): void {
    this.stars.length = 0;
    const count = Math.round(110 * (this.logicalWidth / LOGICAL_WIDTH));
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: hash(i * 7.1) * this.logicalWidth,
        y: hash(i * 11.7 + 3) * this.logicalHeight,
        size: 0.5 + hash(i * 5.3 + 9) * 1.8,
        speed: 6 + hash(i * 13.9) * 34,
        glow: hash(i * 17.3),
      });
    }
  }

  private spriteCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to create sprite cache');
    return [canvas, ctx];
  }

  private buildCaches(): void {
    ['#ff554d', '#38bdf8', '#c084fc', '#fbbf24', '#4ade80', '#ffffff'].forEach((color) => {
      this.cache.orbs.set(color, this.makeOrb(color));
      this.cache.glows.set(color, this.makeGlow(color));
    });
    this.cache.explosions = [
      this.makeExplosion('#ffdc73', '#ff5a36'),
      this.makeExplosion('#d8f4ff', '#38bdf8'),
      this.makeExplosion('#f5d0fe', '#9333ea'),
    ];
  }

  private makeOrb(color: string): HTMLCanvasElement {
    const [canvas, ctx] = this.spriteCanvas(64);
    const gradient = ctx.createRadialGradient(27, 25, 1, 32, 32, 30);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.16, color);
    gradient.addColorStop(0.46, rgba(color, 0.85));
    gradient.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = rgba('#ffffff', 0.85);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(32, 32, 10, 0, TAU);
    ctx.stroke();
    return canvas;
  }

  private makeGlow(color: string): HTMLCanvasElement {
    const [canvas, ctx] = this.spriteCanvas(96);
    const gradient = ctx.createRadialGradient(48, 48, 0, 48, 48, 46);
    gradient.addColorStop(0, rgba(color, 0.85));
    gradient.addColorStop(0.2, rgba(color, 0.35));
    gradient.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 96, 96);
    return canvas;
  }

  private makeExplosion(core: string, edge: string): HTMLCanvasElement {
    const [canvas, ctx] = this.spriteCanvas(128);
    const gradient = ctx.createRadialGradient(64, 64, 1, 64, 64, 62);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.12, core);
    gradient.addColorStop(0.4, edge);
    gradient.addColorStop(0.72, rgba(edge, 0.28));
    gradient.addColorStop(1, rgba(edge, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 10; i++) {
      const a = hash(i * 13) * TAU;
      const d = 30 + hash(i * 17) * 28;
      ctx.beginPath();
      ctx.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 3 + hash(i * 19) * 8, 0, TAU);
      ctx.fill();
    }
    return canvas;
  }

  private drawLetterbox(): void {
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.strokeStyle = 'rgba(125,211,252,.18)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      this.fieldRect.x - 0.5,
      this.fieldRect.y - 0.5,
      this.fieldRect.width + 1,
      this.fieldRect.height + 1
    );
  }

  private drawBackground(world: AnyRecord, time: number): void {
    const wave = Math.max(1, Math.floor(n(first(world, 'wave', 'waveIndex', 'currentWave'), 1)));
    const phase = (wave - 1) % 4;
    const farDrawn = this.drawStageFarBackground(wave, time);
    if (!farDrawn) {
      if (phase === 0) this.drawSea(time);
      else if (phase === 1) this.drawCity(time);
      else if (phase === 2) this.drawSky(time);
      else this.drawSpace(time);
    }
    this.drawBackgroundGrid(time, farDrawn ? 3 : phase);
    const shade = this.ctx.createLinearGradient(0, 0, 0, this.logicalHeight);
    shade.addColorStop(0, 'rgba(0,0,0,.18)');
    shade.addColorStop(0.52, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,.35)');
    this.ctx.fillStyle = shade;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
  }

  private drawSea(time: number): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.logicalHeight);
    gradient.addColorStop(0, '#0b3e66');
    gradient.addColorStop(0.45, '#075985');
    gradient.addColorStop(1, '#031c35');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const y = ((i * 34 + time * (24 + (i % 3) * 5)) % (this.logicalHeight + 50)) - 25;
      const x = hash(i * 31) * (this.logicalWidth + 120) - 60;
      this.ctx.strokeStyle = `rgba(125,211,252,${0.08 + (i % 4) * 0.025})`;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.quadraticCurveTo(x + 45, y - 7, x + 95, y);
      this.ctx.quadraticCurveTo(x + 140, y + 7, x + 190, y);
      this.ctx.stroke();
    }
    for (let i = 0; i < 5; i++) {
      const x = 45 + hash(i * 43) * 390;
      const y = ((hash(i * 71) * 720 + time * (15 + i)) % 820) - 60;
      this.ctx.fillStyle = 'rgba(3,20,35,.4)';
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, 18 + i * 3, 4 + i, 0, 0, TAU);
      this.ctx.fill();
    }
  }

  private drawCity(time: number): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.logicalHeight);
    gradient.addColorStop(0, '#20143b');
    gradient.addColorStop(0.55, '#112342');
    gradient.addColorStop(1, '#060a16');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    const scroll = (time * 38) % 130;
    for (let row = -1; row < 7; row++) {
      const y = row * 130 + scroll;
      for (let col = 0; col < Math.ceil(this.logicalWidth / 65) + 1; col++) {
        const seed = row * 29 + col * 7;
        const width = 34 + hash(seed) * 44;
        const height = 55 + hash(seed + 4) * 95;
        const x = col * 70 - 25 + hash(seed + 8) * 22;
        this.ctx.fillStyle = row % 2 ? '#0b1428' : '#101a33';
        this.ctx.fillRect(x, y - height, width, height);
        this.ctx.fillStyle = hash(seed + 2) > 0.5 ? 'rgba(250,204,21,.35)' : 'rgba(56,189,248,.3)';
        for (let wy = y - height + 10; wy < y - 8; wy += 14) {
          for (let wx = x + 8; wx < x + width - 5; wx += 13) {
            if (hash(wx * 0.3 + wy * 0.9) > 0.47) this.ctx.fillRect(wx, wy, 3, 5);
          }
        }
      }
    }
    this.ctx.strokeStyle = 'rgba(244,114,182,.18)';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = ((i * 170 + time * 55) % 900) - 90;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.logicalWidth, y + 90);
      this.ctx.stroke();
    }
  }

  private drawSky(time: number): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.logicalHeight);
    gradient.addColorStop(0, '#062a55');
    gradient.addColorStop(0.48, '#1b75a5');
    gradient.addColorStop(1, '#a3d7e8');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    for (let i = 0; i < 15; i++) {
      const speed = 12 + (i % 5) * 7;
      const y = ((hash(i * 23) * 760 + time * speed) % 850) - 80;
      const x = hash(i * 47) * (this.logicalWidth + 40) - 20 + Math.sin(time * 0.15 + i) * 20;
      const scale = 0.6 + hash(i * 13) * 1.3;
      this.ctx.fillStyle = `rgba(230,248,255,${0.06 + scale * 0.045})`;
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, 58 * scale, 17 * scale, 0.08, 0, TAU);
      this.ctx.ellipse(x + 35 * scale, y + 5, 46 * scale, 12 * scale, -0.1, 0, TAU);
      this.ctx.fill();
    }
    this.ctx.fillStyle = 'rgba(255,255,255,.09)';
    for (let i = 0; i < 7; i++) {
      const y = ((i * 125 + time * 95) % 900) - 90;
      this.ctx.fillRect(25 + (i % 3) * 145, y, 2, 55);
    }
  }

  private drawSpace(time: number): void {
    const gradient = this.ctx.createRadialGradient(390, 120, 10, 250, 340, 520);
    gradient.addColorStop(0, '#25124f');
    gradient.addColorStop(0.42, '#090e2d');
    gradient.addColorStop(1, '#01030b');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.ctx.fillStyle = 'rgba(147,51,234,.08)';
    this.ctx.beginPath();
    this.ctx.ellipse(this.logicalWidth * 0.75, 300 + Math.sin(time * 0.07) * 20, 230, 78, -0.7, 0, TAU);
    this.ctx.fill();
    for (const star of this.stars) {
      const y = (star.y + time * star.speed) % (this.logicalHeight + 8) - 4;
      const twinkle = 0.45 + 0.5 * Math.sin(time * (1.5 + star.glow * 3) + star.x);
      this.ctx.fillStyle = `rgba(${star.glow > 0.75 ? '196,181,253' : '220,240,255'},${0.25 + twinkle * 0.6})`;
      this.ctx.fillRect(star.x, y, star.size, star.size * (1 + star.speed / 28));
    }
  }

  private drawBackgroundGrid(time: number, phase: number): void {
    const horizon = phase === 3 ? 250 : 170;
    this.ctx.save();
    this.ctx.globalAlpha = phase === 0 ? 0.1 : phase === 3 ? 0.17 : 0.08;
    this.ctx.strokeStyle = phase === 1 ? '#f472b6' : phase === 3 ? '#8b5cf6' : '#7dd3fc';
    this.ctx.lineWidth = 1;
    const lanes = Math.ceil(this.logicalWidth / 75);
    for (let i = -lanes; i <= lanes; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.logicalWidth / 2, horizon);
      this.ctx.lineTo(this.logicalWidth / 2 + i * 75, this.logicalHeight);
      this.ctx.stroke();
    }
    const scroll = (time * 0.55) % 1;
    for (let i = 0; i < 17; i++) {
      const t = (i + scroll) / 16;
      const y = horizon + Math.pow(t, 2.1) * (this.logicalHeight - horizon);
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.logicalWidth, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawWorld(world: AnyRecord, alpha: number, time: number): void {
    const playerBullets = this.mergeArrays(world, 'playerBullets', 'playerShots', 'friendlyBullets', 'shots');
    const enemyBullets = this.mergeArrays(world, 'enemyBullets', 'enemyShots', 'hostileBullets');
    const genericBullets = entities(world.bullets);
    const enemiesList = entities(first(world, 'enemies', 'mobs', 'hostiles'));
    const bosses = entities(world.bosses);
    const boss = record(world.boss) as Entity;
    const pickups = this.mergeArrays(world, 'pickups', 'drops', 'items');
    const particles = this.mergeArrays(world, 'particles', 'effects');
    const damageNumbers = this.mergeArrays(world, 'damageNumbers', 'damageTexts', 'floatingTexts', 'texts');

    for (const entity of pickups) this.drawPickup(entity, alpha, time);
    for (const entity of particles) this.drawParticle(entity, alpha, time);
    for (const bullet of playerBullets) this.drawBullet(bullet, alpha, true, time);
    for (const bullet of genericBullets) {
      const friendly = bullet.friendly === true || bullet.owner === 'player' || bullet.team === 'player';
      this.drawBullet(bullet, alpha, friendly, time);
    }
    for (const bullet of enemyBullets) this.drawBullet(bullet, alpha, false, time);
    for (const enemy of enemiesList) this.drawEnemy(enemy, alpha, time);
    if (Object.keys(boss).length > 0 && boss.dead !== true && (boss.x !== undefined || boss.y !== undefined)) {
      this.drawEnemy(boss, alpha, time, true);
    }
    for (const entity of bosses) this.drawEnemy(entity, alpha, time, true);

    const player = record(first(world, 'player', 'ship', 'hero')) as Entity;
    if (Object.keys(player).length > 0 && player.dead !== true) this.drawPlayer(player, alpha, time);
    for (const value of damageNumbers) this.drawDamageNumber(value, alpha);
  }

  private mergeArrays(world: AnyRecord, ...keys: string[]): Entity[] {
    const result: Entity[] = [];
    for (const key of keys) result.push(...entities(world[key]));
    return result;
  }

  private pos(entity: Entity, alpha: number): Point {
    const x = n(entity.x);
    const y = n(entity.y);
    return {
      x: n(first(entity, 'prevX', 'lastX', 'oldX'), x) + (x - n(first(entity, 'prevX', 'lastX', 'oldX'), x)) * alpha,
      y: n(first(entity, 'prevY', 'lastY', 'oldY'), y) + (y - n(first(entity, 'prevY', 'lastY', 'oldY'), y)) * alpha,
    };
  }

  private drawCachedGlow(x: number, y: number, size: number, color: string, alpha = 1): void {
    const sprite = this.cache.glows.get(color) ?? this.cache.glows.get('#ffffff');
    if (!sprite) return;
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
    this.ctx.restore();
  }

  private drawPlayer(entity: Entity, alpha: number, time: number): void {
    const { x, y } = this.pos(entity, alpha);
    const shipId = this.shipId(first(entity, 'shipId', 'id', 'type', 'kind'));
    const form = s(entity.form, TRANSFORMATIONS[shipId].primary.id) as PlayerForm;
    const spriteSpec = getPlayerSpriteSpec(shipId, form);
    const sprite = this.playerSprites.get(`${shipId}:${form}`);
    const spriteReady = spriteSpec !== undefined && sprite?.complete === true && sprite.naturalWidth > 0;
    const invulnerable = n(first(entity, 'invulnerable', 'invulnerableTimer', 'invuln', 'hitTimer')) > 0;
    if (invulnerable && Math.floor(time * 18) % 2 === 0) return;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(n(first(entity, 'rotation', 'angle')));
    const boost = 8 + Math.sin(time * 27) * 3;
    const shipColor = shipId === 'falcon' ? '#38bdf8' : shipId === 'wasp' ? '#c084fc' : '#ff4b3a';
    this.drawCachedGlow(0, 5, 72, shipColor, 0.6);
    const flame = this.ctx.createLinearGradient(0, 10, 0, 38 + boost);
    flame.addColorStop(0, '#ffffff');
    flame.addColorStop(0.25, shipId === 'raiden' ? '#ffd23f' : '#7dd3fc');
    flame.addColorStop(1, rgba(shipColor, 0));
    this.ctx.fillStyle = flame;
    this.ctx.beginPath();
    for (const flameX of spriteReady ? [-8, 8] : [0]) {
      this.ctx.moveTo(flameX - 5, 12);
      this.ctx.lineTo(flameX, 35 + boost);
      this.ctx.lineTo(flameX + 5, 12);
      this.ctx.closePath();
    }
    this.ctx.fill();
    if (spriteReady && spriteSpec) {
      this.ctx.drawImage(
        sprite,
        -spriteSpec.width / 2,
        -spriteSpec.height / 2,
        spriteSpec.width,
        spriteSpec.height,
      );
    } else {
      if (shipId === 'falcon') this.drawFalcon(form === 'split', time);
      else if (shipId === 'wasp') this.drawWasp(time, form === 'fortress');
      else this.drawRaiden();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(0, 1, 2.2, 0, TAU);
      this.ctx.fill();
    }
    if (form === 'fortress' && n(entity.hiveShield) > 0) {
      this.ctx.strokeStyle = rgba('#f0abfc', 0.7 + Math.sin(time * 7) * 0.2);
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 34 + Math.sin(time * 4) * 2, 0, TAU);
      this.ctx.stroke();
    }
    const transformTimer = n(entity.transformTimer);
    if (transformTimer > 0) {
      const progress = clamp(1 - transformTimer / 0.35);
      this.ctx.strokeStyle = rgba(shipColor, 1 - progress);
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 22 + progress * 42, 0, TAU);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private loadPlayerSprites(): void {
    if (typeof Image === 'undefined') return;
    for (const form of ['assault', 'flight'] as const) {
      const spec = getPlayerSpriteSpec('raiden', form);
      if (!spec) continue;
      const image = new Image();
      image.decoding = 'async';
      image.src = spec.src;
      this.playerSprites.set(`raiden:${form}`, image);
    }
  }

  private loadStageBackgrounds(): void {
    if (typeof Image === 'undefined') return;
    const spec = getStageBackgroundSpec(1, 'far');
    if (!spec) return;
    const image = new Image();
    image.decoding = 'async';
    image.src = spec.src;
    this.stageBackgrounds.set('1:far', image);
  }

  private drawStageFarBackground(wave: number, time: number): boolean {
    const spec = getStageBackgroundSpec(wave, 'far');
    const image = this.stageBackgrounds.get(`${wave}:far`);
    if (!spec || !image || image.complete !== true || image.naturalWidth <= 0) return false;
    const scale = Math.max(this.logicalWidth / image.naturalWidth, this.logicalHeight / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const x = (this.logicalWidth - drawWidth) / 2;
    const scroll = (time * 18) % drawHeight;
    this.ctx.drawImage(image, x, -scroll, drawWidth, drawHeight);
    this.ctx.drawImage(image, x, -scroll + drawHeight, drawWidth, drawHeight);
    return true;
  }

  private drawRaiden(): void {
    this.ctx.fillStyle = '#7f1d1d';
    this.ctx.strokeStyle = '#ff9e44';
    this.ctx.lineWidth = 1.4;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -25);
    this.ctx.lineTo(10, -7);
    this.ctx.lineTo(30, 7);
    this.ctx.lineTo(25, 15);
    this.ctx.lineTo(8, 10);
    this.ctx.lineTo(0, 22);
    this.ctx.lineTo(-8, 10);
    this.ctx.lineTo(-25, 15);
    this.ctx.lineTo(-30, 7);
    this.ctx.lineTo(-10, -7);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillRect(-5, -14, 10, 28);
    this.ctx.fillStyle = '#ffd23f';
    this.ctx.fillRect(-24, 4, 9, 3);
    this.ctx.fillRect(15, 4, 9, 3);
  }

  private drawFalcon(split: boolean, time: number): void {
    this.ctx.fillStyle = '#075985';
    this.ctx.strokeStyle = '#a5f3fc';
    this.ctx.lineWidth = 1.3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -30);
    this.ctx.lineTo(7, -8);
    this.ctx.lineTo(27, 16);
    this.ctx.lineTo(8, 9);
    this.ctx.lineTo(0, 24);
    this.ctx.lineTo(-8, 9);
    this.ctx.lineTo(-27, 16);
    this.ctx.lineTo(-7, -8);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -21);
    this.ctx.lineTo(4, 12);
    this.ctx.lineTo(-4, 12);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.strokeStyle = '#e0f2fe';
    this.ctx.beginPath();
    this.ctx.moveTo(-20, 10);
    this.ctx.lineTo(-7, 2);
    this.ctx.moveTo(20, 10);
    this.ctx.lineTo(7, 2);
    this.ctx.stroke();
    if (split) {
      for (const side of [-1, 1]) {
        const x = side * (34 + Math.sin(time * 4) * 2);
        this.ctx.fillStyle = '#075985';
        this.ctx.strokeStyle = '#67e8f9';
        this.ctx.beginPath();
        this.ctx.moveTo(x, -10);
        this.ctx.lineTo(x + side * 8, 8);
        this.ctx.lineTo(x, 14);
        this.ctx.lineTo(x - side * 5, 5);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
      }
    }
  }

  private drawWasp(time: number, fortress: boolean): void {
    this.ctx.fillStyle = '#4c1d95';
    this.ctx.strokeStyle = '#f0abfc';
    this.ctx.lineWidth = 1.3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -24);
    this.ctx.lineTo(10, -8);
    this.ctx.lineTo(26, -1);
    this.ctx.lineTo(20, 17);
    this.ctx.lineTo(7, 12);
    this.ctx.lineTo(0, 23);
    this.ctx.lineTo(-7, 12);
    this.ctx.lineTo(-20, 17);
    this.ctx.lineTo(-26, -1);
    this.ctx.lineTo(-10, -8);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = '#c084fc';
    this.ctx.fillRect(-5, -13, 10, 28);
    if (fortress) {
      this.ctx.strokeStyle = rgba('#f472b6', 0.75);
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 2, 31, 0, TAU);
      this.ctx.stroke();
    }
    for (const side of [-1, 1]) {
      const ox = side * ((fortress ? 42 : 30) + Math.sin(time * 3) * 2);
      this.ctx.fillStyle = '#581c87';
      this.ctx.strokeStyle = '#f472b6';
      this.ctx.beginPath();
      this.ctx.arc(ox, 4, 6, 0, TAU);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(ox - 1, 1, 2, 6);
    }
  }

  private drawEnemy(entity: Entity, alpha: number, time: number, forceBoss = false): void {
    if (entity.active === false || entity.dead === true) return;
    const { x, y } = this.pos(entity, alpha);
    const type = s(first(entity, 'bossType', 'type', 'kind', 'id'), 'fighter').toLowerCase();
    const boss = forceBoss || entity.boss === true || type.includes('boss') || type.includes('spider') || type.includes('valkyrie');
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(n(first(entity, 'rotation', 'angle')));
    this.ctx.globalAlpha = clamp(n(entity.alpha, 1));
    if (type.includes('spider')) this.drawSpiderBoss(time);
    else if (type.includes('valkyrie')) this.drawValkyrieBoss(time);
    else if (type.includes('miniboss')) this.drawMiniBoss(time);
    else this.drawStandardEnemy(entity, type, time);
    this.ctx.restore();
    if (boss) this.drawEntityHealth(entity, x, y + n(entity.height, type.includes('spider') ? 60 : 42), 86);
    else if (n(entity.hp, 1) < n(entity.maxHp, 1)) this.drawEntityHealth(entity, x, y + n(entity.radius, 15) + 9, 30);
  }

  private drawStandardEnemy(entity: Entity, type: string, time: number): void {
    const size = n(first(entity, 'radius', 'size'), type.includes('elite') ? 23 : 15);
    const color = s(entity.color, type.includes('elite') ? '#fb7185' : '#f97316');
    this.drawCachedGlow(0, 0, size * 3.5, color, 0.35);
    this.ctx.fillStyle = type.includes('drone') ? '#3f3f46' : '#451a03';
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = type.includes('elite') ? 2.5 : 1.5;
    this.ctx.beginPath();
    if (type.includes('turret')) {
      this.ctx.rect(-size, -size * 0.7, size * 2, size * 1.4);
      this.ctx.moveTo(-3, size * 0.2);
      this.ctx.lineTo(-3, size * 1.25);
      this.ctx.lineTo(3, size * 1.25);
      this.ctx.lineTo(3, size * 0.2);
    } else {
      this.ctx.moveTo(0, size);
      this.ctx.lineTo(size * 1.2, -size * 0.65);
      this.ctx.lineTo(size * 0.35, -size * 0.35);
      this.ctx.lineTo(0, -size);
      this.ctx.lineTo(-size * 0.35, -size * 0.35);
      this.ctx.lineTo(-size * 1.2, -size * 0.65);
      this.ctx.closePath();
    }
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = '#fde68a';
    this.ctx.fillRect(-2, -2 + Math.sin(time * 5), 4, 7);
  }

  private drawMiniBoss(time: number): void {
    const pulse = 0.75 + Math.sin(time * 7) * 0.2;
    this.drawCachedGlow(0, 0, 130, '#fb7185', 0.48);
    this.ctx.fillStyle = '#3f1723';
    this.ctx.strokeStyle = '#fb7185';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 38);
    this.ctx.lineTo(18, 18);
    this.ctx.lineTo(43, 25);
    this.ctx.lineTo(34, -4);
    this.ctx.lineTo(19, -13);
    this.ctx.lineTo(13, -38);
    this.ctx.lineTo(0, -27);
    this.ctx.lineTo(-13, -38);
    this.ctx.lineTo(-19, -13);
    this.ctx.lineTo(-34, -4);
    this.ctx.lineTo(-43, 25);
    this.ctx.lineTo(-18, 18);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = '#111827';
    this.ctx.fillRect(-13, -16, 26, 38);
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.fillRect(-28, -5, 12, 4);
    this.ctx.fillRect(16, -5, 12, 4);
    this.ctx.fillStyle = `rgba(255,255,255,${pulse})`;
    this.ctx.beginPath();
    this.ctx.arc(0, -8, 5, 0, TAU);
    this.ctx.fill();
  }

  private drawSpiderBoss(time: number): void {
    this.drawCachedGlow(0, 0, 170, '#ff554d', 0.5);
    this.ctx.strokeStyle = '#fb7185';
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const y = -30 + i * 19;
        const pulse = Math.sin(time * 3 + i) * 6;
        this.ctx.beginPath();
        this.ctx.moveTo(side * 28, y);
        this.ctx.lineTo(side * (53 + pulse), y - 10 + i * 3);
        this.ctx.lineTo(side * (76 + pulse), y + (i - 1.5) * 10);
        this.ctx.stroke();
      }
    }
    this.ctx.fillStyle = '#3f0a16';
    this.ctx.strokeStyle = '#f43f5e';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 40, 52, 0, 0, TAU);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = '#111827';
    this.ctx.beginPath();
    this.ctx.arc(0, -32, 29, 0, TAU);
    this.ctx.fill();
    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * 9;
      this.ctx.fillStyle = i % 2 ? '#fbbf24' : '#ff3344';
      this.ctx.beginPath();
      this.ctx.arc(x, -34 + Math.abs(i - 2.5) * 2, 3.5, 0, TAU);
      this.ctx.fill();
    }
    this.ctx.strokeStyle = '#fda4af';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath();
      this.ctx.arc(0, 8, 16 + i * 8, time + i, time + Math.PI + i);
      this.ctx.stroke();
    }
  }

  private drawValkyrieBoss(time: number): void {
    this.drawCachedGlow(0, 0, 190, '#c084fc', 0.6);
    this.ctx.save();
    this.ctx.rotate(time * 0.35);
    this.ctx.strokeStyle = 'rgba(245,208,254,.55)';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      this.ctx.rotate(TAU / 8);
      this.ctx.beginPath();
      this.ctx.moveTo(43, 0);
      this.ctx.lineTo(68, -8);
      this.ctx.lineTo(81, 0);
      this.ctx.lineTo(68, 8);
      this.ctx.closePath();
      this.ctx.stroke();
    }
    this.ctx.restore();
    this.ctx.fillStyle = '#2e1065';
    this.ctx.strokeStyle = '#f0abfc';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -58);
    this.ctx.lineTo(17, -22);
    this.ctx.lineTo(55, -4);
    this.ctx.lineTo(28, 12);
    this.ctx.lineTo(39, 43);
    this.ctx.lineTo(9, 25);
    this.ctx.lineTo(0, 51);
    this.ctx.lineTo(-9, 25);
    this.ctx.lineTo(-39, 43);
    this.ctx.lineTo(-28, 12);
    this.ctx.lineTo(-55, -4);
    this.ctx.lineTo(-17, -22);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = '#e879f9';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -42);
    this.ctx.lineTo(8, 20);
    this.ctx.lineTo(0, 30);
    this.ctx.lineTo(-8, 20);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(0, -8, 5 + Math.sin(time * 8), 0, TAU);
    this.ctx.fill();
  }

  private drawEntityHealth(entity: Entity, x: number, y: number, width: number): void {
    const maxHp = Math.max(1, n(first(entity, 'maxHp', 'hpMax'), 1));
    const ratio = clamp(n(entity.hp, maxHp) / maxHp);
    this.ctx.fillStyle = 'rgba(0,0,0,.62)';
    this.ctx.fillRect(x - width / 2 - 1, y - 1, width + 2, 6);
    this.ctx.fillStyle = ratio < 0.25 ? '#ef4444' : '#fb7185';
    this.ctx.fillRect(x - width / 2, y, width * ratio, 4);
  }

  private drawBullet(entity: Entity, alpha: number, friendly: boolean, time: number): void {
    if (entity.active === false || entity.dead === true) return;
    const { x, y } = this.pos(entity, alpha);
    const kind = s(first(entity, 'type', 'kind'), 'orb').toLowerCase();
    const color = s(entity.color, friendly ? '#38bdf8' : '#ff554d');
    const radius = Math.max(2, n(first(entity, 'radius', 'size'), friendly ? 4 : 5));
    const rotation = n(first(entity, 'rotation', 'angle'));
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    this.ctx.globalAlpha = clamp(n(entity.alpha, 1));
    if (kind.includes('laser') || kind.includes('beam')) {
      const length = n(first(entity, 'height', 'length'), 34);
      const width = n(entity.width, radius * 1.5);
      const gradient = this.ctx.createLinearGradient(0, -length, 0, length);
      gradient.addColorStop(0, rgba(color, 0));
      gradient.addColorStop(0.45, color);
      gradient.addColorStop(1, '#ffffff');
      this.ctx.fillStyle = gradient;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(-width / 2, -length, width, length * 1.35);
    } else if (kind.includes('missile') || kind.includes('rocket')) {
      this.ctx.fillStyle = friendly ? '#dbeafe' : '#fecaca';
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -radius * 2.2);
      this.ctx.lineTo(radius, radius);
      this.ctx.lineTo(0, radius * 0.5);
      this.ctx.lineTo(-radius, radius);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = rgba(color, 0.75);
      this.ctx.fillRect(-radius * 0.45, radius, radius * 0.9, radius * (1.5 + Math.sin(time * 30) * 0.4));
    } else if (kind.includes('blade') || kind.includes('slash')) {
      this.ctx.strokeStyle = color;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 8;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 2.2, -1.2, 1.2);
      this.ctx.stroke();
    } else {
      const sprite = this.cache.orbs.get(color) ?? this.makeOrb(color);
      if (!this.cache.orbs.has(color)) this.cache.orbs.set(color, sprite);
      const size = radius * 5.2;
      this.ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      if (!friendly) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, Math.max(1.2, radius * 0.35), 0, TAU);
        this.ctx.fill();
      }
    }
    this.ctx.restore();
  }

  private drawPickup(entity: Entity, alpha: number, time: number): void {
    if (entity.active === false || entity.dead === true) return;
    const { x, y } = this.pos(entity, alpha);
    const capsule = s(first(entity, 'capsule', 'capsuleType')).toUpperCase();
    const rawType = s(first(entity, 'type', 'kind', 'id'), 'scrap').toLowerCase();
    const type = rawType === 'capsule' && capsule ? capsule.toLowerCase() : rawType;
    const crystalGrade = s(entity.crystalGrade, 'white');
    const awakening = this.awakeningType(first(entity, 'awakeningType', 'colorType', 'awakening'));
    let color = s(entity.color);
    if (!color) {
      if (type === 'score') {
        color = {
          white: '#f8fafc',
          cyan: '#67e8f9',
          blue: '#60a5fa',
          purple: '#c084fc',
          gold: '#facc15',
          rainbow: '#fb7185',
        }[crystalGrade] ?? '#f8fafc';
      } else if (type === 'm' || type.includes('main')) color = '#ef4444';
      else if (type === 's' || type.includes('sub')) color = '#4ade80';
      else if (type === 'a' || type.includes('awaken')) color = this.awakeningColor(awakening);
      else if (type.includes('heal') || type.includes('health')) color = '#34d399';
      else color = '#fbbf24';
    }
    const bob = Math.sin(time * 4 + x * 0.03) * 3;
    this.ctx.save();
    this.ctx.translate(x, y + bob);
    this.ctx.rotate(type.includes('scrap') ? time * 1.7 : type === 'score' ? Math.sin(time * 4) * 0.12 : 0);
    this.drawCachedGlow(0, 0, 52, color, 0.55);
    if (type === 'score') {
      const size = Math.max(7, n(entity.radius, 8));
      if (crystalGrade === 'rainbow') {
        this.ctx.strokeStyle = `hsl(${(time * 150) % 360} 95% 70%)`;
        this.ctx.shadowColor = this.ctx.strokeStyle;
      } else {
        this.ctx.strokeStyle = color;
      }
      this.ctx.shadowBlur = 12;
      this.ctx.fillStyle = rgba(color, 0.5);
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -size * 1.35);
      this.ctx.lineTo(size, 0);
      this.ctx.lineTo(0, size * 1.35);
      this.ctx.lineTo(-size, 0);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.moveTo(0, -size * 0.8);
      this.ctx.lineTo(size * 0.35, 0);
      this.ctx.lineTo(0, size * 0.25);
      this.ctx.closePath();
      this.ctx.fill();
    } else if (type.includes('heal') || type.includes('health')) {
      this.ctx.fillStyle = '#ecfdf5';
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(-10, -10, 20, 20);
      this.ctx.strokeRect(-10, -10, 20, 20);
      this.ctx.fillStyle = color;
      this.ctx.fillRect(-3, -7, 6, 14);
      this.ctx.fillRect(-7, -3, 14, 6);
    } else if (type.includes('scrap') || type.includes('coin')) {
      this.ctx.fillStyle = '#78350f';
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * TAU) / 6;
        const r = i % 2 ? 8 : 11;
        if (i === 0) this.ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else this.ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#fde68a';
      this.ctx.fillRect(-2, -5, 4, 10);
    } else {
      let label = '?';
      if (type === 'm' || type.includes('main')) label = 'M';
      else if (type === 's' || type.includes('sub')) label = 'S';
      else if (type === 'a' || type.includes('awaken')) label = 'A';
      this.ctx.fillStyle = rgba(color, 0.28);
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2.2;
      this.roundRect(-15, -19, 30, 38, 9);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = `900 20px ${FONT}`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(label, 0, 1);
      this.ctx.fillStyle = color;
      this.ctx.fillRect(-7, -14, 14, 2);
    }
    this.ctx.restore();
  }

  private drawParticle(entity: Entity, alpha: number, time: number): void {
    const { x, y } = this.pos(entity, alpha);
    const life = clamp(n(first(entity, 'lifeRatio', 'alpha'), 1));
    const type = s(first(entity, 'type', 'kind'), 'spark').toLowerCase();
    const color = s(entity.color, '#fbbf24');
    const size = Math.max(1, n(first(entity, 'radius', 'size'), 5));
    if (type.includes('explosion') || type.includes('blast')) {
      const variant = type.includes('ice') ? 1 : type.includes('violet') || type.includes('electric') ? 2 : 0;
      const sprite = this.cache.explosions[variant];
      this.ctx.save();
      this.ctx.globalAlpha = life;
      this.ctx.globalCompositeOperation = 'lighter';
      this.ctx.translate(x, y);
      this.ctx.rotate(n(entity.rotation, time * 0.8));
      this.ctx.drawImage(sprite, -size * 4, -size * 4, size * 8, size * 8);
      this.ctx.restore();
      return;
    }
    this.ctx.save();
    this.ctx.globalAlpha = life;
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 7;
    if (type.includes('ring')) {
      this.ctx.lineWidth = Math.max(1, n(entity.width, 2));
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, TAU);
      this.ctx.stroke();
    } else {
      const angle = n(first(entity, 'rotation', 'angle'));
      this.ctx.translate(x, y);
      this.ctx.rotate(angle);
      this.ctx.fillRect(-size * 0.5, -size * 2, size, size * 4);
    }
    this.ctx.restore();
  }

  private drawDamageNumber(entity: Entity, alpha: number): void {
    const { x, y } = this.pos(entity, alpha);
    const value = first(entity, 'text', 'value', 'damage');
    const text = typeof value === 'number' ? Math.round(value).toLocaleString() : s(value);
    if (!text) return;
    const crit = entity.crit === true || entity.critical === true;
    const life = Math.max(0.001, n(entity.life, 1));
    const inferredAlpha = entity.age === undefined ? 1 : 1 - n(entity.age) / life;
    this.ctx.save();
    this.ctx.globalAlpha = clamp(n(entity.alpha, inferredAlpha));
    this.ctx.font = `${crit ? '900' : '700'} ${crit ? 20 : 15}px ${FONT}`;
    this.ctx.textAlign = 'center';
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = 'rgba(0,0,0,.78)';
    this.ctx.strokeText(text, x, y);
    this.ctx.fillStyle = s(entity.color, crit ? '#fde047' : '#ffffff');
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  private drawHud(world: AnyRecord, time: number): void {
    const player = record(first(world, 'player', 'ship', 'hero'));
    const playerStats = record(player.stats);
    const hp = n(first(player, 'hp', 'health'), 0);
    const maxHp = Math.max(1, n(first(player, 'maxHp', 'hpMax', 'maxHealth'), 100));
    const mana = Math.max(100, n(first(playerStats, 'mana', 'maxMana'), n(world.mana, 100)));
    const manaCap = Math.max(100, Math.floor(mana / 100) * 100);
    const awakeningValue = n(first(player, 'awakeningCharge', 'ultimateCharge', 'awaken'), 0);
    const awakening = clamp(awakeningValue / manaCap);
    const stocks = Math.floor(awakeningValue / 100);
    const awakeningType = this.awakeningType(
      first(player, 'awakening', 'awakeningType', 'ultimateType', 'awakenType'),
    );
    const awakeningTier = Math.round(clamp(n(first(player, 'awakeningTier', 'ultimateTier', 'tier'), 1), 1, 3));
    const wave = Math.max(1, Math.floor(n(first(world, 'wave', 'waveIndex', 'currentWave'), 1)));
    const waveTimer = Math.max(0, n(first(world, 'waveTimer', 'waveTime', 'timeInWave')));
    const waveDuration = n(first(world, 'waveDuration', 'waveLength'));
    const remaining = waveDuration > 0 ? Math.max(0, waveDuration - waveTimer) : waveTimer;
    const mainLevel = Math.max(1, Math.floor(n(first(player, 'mainLevel', 'mainGunLevel', 'weaponLevel'), 1)));
    const subLevel = Math.max(1, Math.floor(n(first(player, 'subLevel', 'subWeaponLevel'), 1)));
    const speedPct = Math.round(n(playerStats.speedPct));
    const shipId = this.shipId(first(player, 'shipId', 'id', 'type', 'kind'));
    const transformation = TRANSFORMATIONS[shipId];
    const formId = s(player.form, transformation.primary.id);
    const form = formId === transformation.primary.id ? transformation.primary : transformation.alternate;
    const formArmorBonus = formId === 'assault' ? 3 : formId === 'flight' ? -2 : formId === 'split' ? -1 : formId === 'fortress' ? 4 : 0;
    const armor = Math.max(0, Math.round(n(playerStats.armor) + formArmorBonus));

    this.ctx.save();
    this.ctx.textBaseline = 'middle';
    this.panel(10, 10, 202, 96);
    this.ctx.font = `700 11px ${FONT}`;
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.fillText('HULL', 20, 25);
    this.bar(58, 19, 142, 12, hp / maxHp, hp / maxHp < 0.25 ? '#ef4444' : '#34d399');
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`${Math.ceil(hp)} / ${Math.ceil(maxHp)}`, 196, 25);
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = this.awakeningColor(awakeningType);
    const awakenLabel = stocks > 1
      ? `AWAKEN ×${stocks} · ${['I', 'II', 'MAX'][awakeningTier - 1]}`
      : `AWAKEN ${this.awakeningName(awakeningType)} · ${['I', 'II', 'MAX'][awakeningTier - 1]}`;
    this.ctx.fillText(awakenLabel, 20, 48);
    this.bar(20, 59, 180, 10, awakening, this.awakeningColor(awakeningType));
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = `700 10px ${FONT}`;
    this.ctx.fillText(`SPD +${speedPct}%`, 20, 84);
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.fillText(`ARM ${armor}`, 95, 84);
    this.ctx.fillStyle = '#e879f9';
    this.ctx.fillText(`MANA ${Math.floor(awakeningValue)}/${manaCap}`, 145, 84);

    const wideHud = this.logicalWidth >= 900;
    const centerX = wideHud ? this.logicalWidth / 2 - 125 : 220;
    const infoX = wideHud ? this.logicalWidth - 260 : 220;
    this.panel(centerX, 10, 250, 74);
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.font = `800 13px ${FONT}`;
    this.ctx.fillText(`WAVE ${String(wave).padStart(2, '0')}`, centerX + 11, 27);
    this.ctx.fillStyle = '#7dd3fc';
    this.ctx.font = `700 18px ${FONT}`;
    this.ctx.textAlign = 'center';
    const formalBossActive = Object.keys(record(world.boss)).length > 0;
    const miniBossActive = entities(world.enemies).some(
      (enemy) => enemy.miniBoss === true || s(enemy.type).toLowerCase() === 'miniboss',
    );
    const timerLabel = formalBossActive
      ? 'BOSS'
      : miniBossActive
        ? 'GUARDIAN'
        : this.formatTime(remaining);
    this.ctx.font = `700 ${miniBossActive ? 13 : 18}px ${FONT}`;
    this.ctx.fillText(timerLabel, centerX + 125, 27);
    if (wideHud) this.panel(infoX, 10, 250, 74);
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#fbbf24';
    this.ctx.font = `700 11px ${FONT}`;
    this.ctx.fillText(`SCRAP ${Math.floor(n(first(world, 'scrap', 'currency'), n(player.scrap)))}`, infoX + 238, 24);
    this.ctx.fillStyle = '#e2e8f0';
    const stats = record(world.stats);
    const inferredScore =
      n(stats.kills) * 100 +
      n(stats.bossesKilled) * 5000 +
      n(stats.scrapCollected) * 10 +
      Math.floor(n(stats.damageDealt) * 0.1);
    this.ctx.fillText(`SCORE ${Math.floor(n(world.score, inferredScore)).toLocaleString()}`, infoX + 238, 45);
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#fb7185';
    this.ctx.fillText(`M  LV.${mainLevel}`, centerX + 11, 59);
    this.ctx.fillStyle = '#4ade80';
    this.ctx.fillText(`S  LV.${subLevel}`, centerX + 90, 59);
    this.ctx.fillStyle = form.color;
    this.ctx.fillText(`C  ${form.shortName}`, centerX + 166, 59);
    const noHit = world.noHitEligible !== false;
    this.ctx.fillStyle = noHit ? '#4ade80' : '#ef4444';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(noHit ? 'NO HIT' : 'NO HIT LOST', infoX + 238, 59);

    const boss = this.findBoss(world);
    if (boss) this.drawBossHud(boss, time);
    this.drawControlsHint(world);
    this.ctx.restore();
  }

  private findBoss(world: AnyRecord): Entity | null {
    const direct = record(world.boss) as Entity;
    if (Object.keys(direct).length > 0 && direct.dead !== true) return direct;
    const bosses = entities(world.bosses);
    if (bosses.length > 0) return bosses.find((boss) => boss.dead !== true) ?? null;
    return entities(world.enemies).find(
      (enemy) =>
        enemy.boss === true
        || enemy.miniBoss === true
        || s(enemy.type).toLowerCase() === 'miniboss',
    ) ?? null;
  }

  private drawBossHud(boss: Entity, time: number): void {
    const hp = Math.max(0, n(boss.hp));
    const maxHp = Math.max(1, n(first(boss, 'maxHp', 'hpMax'), 1));
    const ratio = clamp(hp / maxHp);
    const name = s(first(boss, 'name', 'displayName'), s(first(boss, 'type', 'kind'), 'BOSS').toUpperCase());
    const y = 94;
    this.ctx.textAlign = 'center';
    this.ctx.font = `900 13px ${FONT}`;
    this.ctx.fillStyle = Math.floor(time * 4) % 2 ? '#fecdd3' : '#ffffff';
    const barWidth = Math.min(620, this.logicalWidth - 130);
    const barX = (this.logicalWidth - barWidth) / 2;
    this.ctx.fillText(name, this.logicalWidth / 2, y);
    this.ctx.fillStyle = 'rgba(0,0,0,.75)';
    this.ctx.fillRect(barX, y + 10, barWidth, 14);
    const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradient.addColorStop(0, '#be123c');
    gradient.addColorStop(0.6, '#f43f5e');
    gradient.addColorStop(1, '#fda4af');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(barX + 3, y + 13, (barWidth - 6) * ratio, 8);
    this.ctx.strokeStyle = 'rgba(255,255,255,.35)';
    this.ctx.strokeRect(barX + 0.5, y + 10.5, barWidth - 1, 13);
  }

  private drawControlsHint(world: AnyRecord): void {
    const hidden = world.hideControls === true;
    if (hidden) return;
    this.ctx.textAlign = 'center';
    this.ctx.font = `600 10px ${FONT}`;
    this.ctx.fillStyle = 'rgba(226,232,240,.62)';
    this.ctx.fillText('移动：鼠标 / 触控 / WASD    C：变形    觉醒：X / K    暂停：ESC', this.logicalWidth / 2, this.logicalHeight - 14);
  }

  private drawWorldOverlays(world: AnyRecord, time: number): void {
    const flash = first(world, 'flash', 'hitFlash', 'awakeningFlash');
    const flashAmount = typeof flash === 'string' ? 0.35 : clamp(n(flash));
    if (flashAmount > 0) {
      const activeUltimate = record(world.ultimate);
      const ultimateFlash = Object.keys(activeUltimate).length > 0
        ? this.awakeningColor(this.awakeningType(activeUltimate.type))
        : '#ffffff';
      const color = typeof flash === 'string' ? flash : s(first(world, 'flashColor'), ultimateFlash);
      this.ctx.fillStyle = rgba(color, flashAmount * 0.75);
      this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    }
    const warning = first(world, 'bossWarning', 'warningTimer');
    const wave = Math.max(1, Math.floor(n(first(world, 'wave', 'waveIndex'), 1)));
    const waveTimeValue = first(world, 'waveTime', 'waveTimer', 'timeInWave');
    const waveTime = n(waveTimeValue);
    const inferredBossWarning = (wave === 5 || wave === 10) && waveTime > 0.15 && waveTime < 2.25;
    if (warning === true || n(warning) > 0 || inferredBossWarning) {
      this.drawBossWarning(time, n(warning, Math.max(0, 2.25 - waveTime)));
    }
    const banner = first(world, 'waveBanner', 'waveBannerTimer');
    const inferredWaveBanner = waveTimeValue !== undefined && waveTime >= 0 && waveTime < 1.8;
    if ((typeof banner === 'string' && banner) || n(banner) > 0 || inferredWaveBanner) {
      this.drawWaveBanner(
        typeof banner === 'string' ? banner : `WAVE ${wave}`,
        time,
        n(banner, Math.max(0.01, 1.8 - waveTime)),
      );
    }
  }

  private drawBossWarning(time: number, timer: number): void {
    const pulse = 0.45 + Math.sin(time * 12) * 0.25;
    this.ctx.save();
    this.ctx.fillStyle = `rgba(127,0,20,${0.12 + pulse * 0.12})`;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.ctx.translate(this.logicalWidth / 2, this.logicalHeight / 2);
    this.ctx.rotate(-0.07);
    this.ctx.fillStyle = `rgba(220,38,38,${0.72 + pulse * 0.2})`;
    this.ctx.fillRect(-300, -39, 600, 78);
    this.ctx.strokeStyle = '#fecaca';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(-300, -35, 600, 70);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = `900 29px ${FONT}`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚠  BOSS WARNING  ⚠', 0, -5);
    this.ctx.font = `700 10px ${FONT}`;
    this.ctx.fillText(`HIGH ENERGY SIGNATURE DETECTED // ${timer.toFixed(1)}`, 0, 20);
    this.ctx.restore();
  }

  private drawWaveBanner(text: string, time: number, timer: number): void {
    const opacity = clamp(Math.min(timer * 2, timer > 1 ? 1 : timer));
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    const y = this.logicalHeight * 0.37;
    const sweep = ((time * 180) % (this.logicalWidth + 220)) - 100;
    const gradient = this.ctx.createLinearGradient(0, y, this.logicalWidth, y);
    gradient.addColorStop(0, 'rgba(2,132,199,0)');
    gradient.addColorStop(0.5, 'rgba(14,116,144,.72)');
    gradient.addColorStop(1, 'rgba(2,132,199,0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, y - 42, this.logicalWidth, 84);
    this.ctx.fillStyle = 'rgba(255,255,255,.14)';
    this.ctx.fillRect(sweep, y - 42, 75, 84);
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ecfeff';
    this.ctx.font = `900 38px ${FONT}`;
    this.ctx.fillText(text, this.logicalWidth / 2, y);
    this.ctx.font = `700 10px ${FONT}`;
    this.ctx.fillStyle = '#67e8f9';
    this.ctx.fillText('TACTICAL AIRSPACE UPDATED', this.logicalWidth / 2, y + 26);
    this.ctx.restore();
  }

  private drawUltimate(type: AwakeningType, ultimate: AnyRecord, world: AnyRecord, time: number): void {
    const duration = Math.max(0.01, n(ultimate.duration, 1));
    const timer = n(first(ultimate, 'age', 'timer'));
    const tier = Math.round(clamp(n(ultimate.tier, 1), 1, 3));
    const envelope = this.ultimateEnvelope(timer, duration);
    if (type === 'crimson') this.drawCrimsonUltimate(world, time, envelope, tier);
    else if (type === 'azure') this.drawAzureUltimate(time, envelope, tier);
    else this.drawVioletUltimate(world, time, envelope, tier);
    this.drawUltimateTitle(type, tier, timer, duration);
  }

  private ultimateEnvelope(timer: number, duration: number): number {
    const progress = clamp(timer / duration);
    return clamp(Math.sin(progress * Math.PI) * 0.8 + 0.2);
  }

  private drawCrimsonUltimate(world: AnyRecord, time: number, intensity: number, tier: number): void {
    const player = record(first(world, 'player', 'ship', 'hero')) as Entity;
    const p = this.pos(player, 1);
    const x = Object.keys(player).length > 0 ? p.x : this.logicalWidth / 2;
    const y = Object.keys(player).length > 0 ? p.y : this.logicalHeight - 140;
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    const beamWidth = (62 + tier * 25) * (0.88 + Math.sin(time * 38) * 0.05);
    const beam = this.ctx.createLinearGradient(x - beamWidth, 0, x + beamWidth, 0);
    beam.addColorStop(0, 'rgba(239,68,68,0)');
    beam.addColorStop(0.18, rgba('#ef4444', 0.35 * intensity));
    beam.addColorStop(0.38, rgba('#f97316', 0.75 * intensity));
    beam.addColorStop(0.49, rgba('#ffffff', 0.95 * intensity));
    beam.addColorStop(0.51, rgba('#fff7cc', 0.95 * intensity));
    beam.addColorStop(0.68, rgba('#f97316', 0.75 * intensity));
    beam.addColorStop(0.82, rgba('#ef4444', 0.35 * intensity));
    beam.addColorStop(1, 'rgba(239,68,68,0)');
    this.ctx.fillStyle = beam;
    this.ctx.fillRect(x - beamWidth, 0, beamWidth * 2, y + 8);
    this.ctx.fillStyle = rgba('#ffffff', 0.88 * intensity);
    this.ctx.fillRect(x - 7 - tier * 2, 0, 14 + tier * 4, y);
    this.ctx.translate(x, y);
    for (let ring = 0; ring < 3 + tier; ring++) {
      this.ctx.save();
      this.ctx.rotate(time * (ring % 2 ? -1.4 : 1.2) + ring);
      this.ctx.strokeStyle = ring % 2 ? rgba('#fbbf24', intensity) : rgba('#ef4444', intensity);
      this.ctx.lineWidth = 2;
      const radius = 38 + ring * 15;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, TAU);
      this.ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i * TAU) / 8;
        this.ctx.fillStyle = rgba('#fff7cc', intensity);
        this.ctx.fillRect(Math.cos(a) * radius - 2, Math.sin(a) * radius - 2, 4, 4);
      }
      this.ctx.restore();
    }
    this.ctx.restore();
    this.ctx.fillStyle = rgba('#ef4444', 0.08 * intensity);
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
  }

  private drawAzureAtmosphere(time: number, intensity: number): void {
    this.ctx.fillStyle = rgba('#0369a1', 0.16 * intensity);
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    for (const star of this.stars.slice(0, 35)) {
      const x = star.x;
      const y = (star.y + Math.sin(time + star.x) * 3) % this.logicalHeight;
      this.ctx.fillStyle = rgba('#a5f3fc', 0.22 * intensity);
      this.ctx.fillRect(x, y, 1, 8 + star.size * 7);
    }
    this.ctx.restore();
  }

  private drawAzureUltimate(time: number, intensity: number, tier: number): void {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    const count = 14 + tier * 10;
    for (let i = 0; i < count; i++) {
      const cycle = (time * (0.65 + tier * 0.18) + hash(i * 17)) % 1;
      if (cycle > 0.32) continue;
      const a = hash(i * 31) * Math.PI - Math.PI / 2;
      const x = hash(i * 47 + 2) * this.logicalWidth;
      const y = hash(i * 71 + 7) * this.logicalHeight;
      const length = 75 + hash(i * 13) * 190;
      const fade = Math.sin((cycle / 0.32) * Math.PI) * intensity;
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(a);
      const gradient = this.ctx.createLinearGradient(-length, 0, length, 0);
      gradient.addColorStop(0, 'rgba(56,189,248,0)');
      gradient.addColorStop(0.45, rgba('#38bdf8', fade));
      gradient.addColorStop(0.5, rgba('#ffffff', fade));
      gradient.addColorStop(0.55, rgba('#a5f3fc', fade));
      gradient.addColorStop(1, 'rgba(56,189,248,0)');
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 2 + tier;
      this.ctx.beginPath();
      this.ctx.moveTo(-length, 0);
      this.ctx.lineTo(length, 0);
      this.ctx.stroke();
      this.ctx.strokeStyle = rgba('#e0f2fe', fade * 0.45);
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(-length * 0.55, 0);
      this.ctx.lineTo(-length * 0.2, -12);
      this.ctx.lineTo(length * 0.08, 9);
      this.ctx.lineTo(length * 0.45, -5);
      this.ctx.stroke();
      this.ctx.restore();
    }
    this.ctx.restore();
    this.ctx.fillStyle = rgba('#7dd3fc', 0.07 * intensity);
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
  }

  private drawVioletUltimate(world: AnyRecord, time: number, intensity: number, tier: number): void {
    const player = record(first(world, 'player', 'ship', 'hero')) as Entity;
    const p = Object.keys(player).length > 0
      ? this.pos(player, 1)
      : { x: this.logicalWidth / 2, y: this.logicalHeight * 0.72 };
    this.ctx.fillStyle = rgba('#581c87', 0.13 * intensity);
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    const boltCount = 5 + tier * 3;
    for (let i = 0; i < boltCount; i++) {
      const cycle = (time * (1.2 + tier * 0.2) + hash(i * 43)) % 1;
      if (cycle > 0.22) continue;
      const x = 20 + hash(i * 79 + Math.floor(time * 3) * 11) * (this.logicalWidth - 40);
      const targetY = 160 + hash(i * 37 + 8) * 470;
      const fade = Math.sin((cycle / 0.22) * Math.PI) * intensity;
      this.ctx.strokeStyle = rgba(i % 2 ? '#f5d0fe' : '#c084fc', fade);
      this.ctx.shadowColor = '#a855f7';
      this.ctx.shadowBlur = 13;
      this.ctx.lineWidth = i % 3 === 0 ? 4 : 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x, -10);
      let px = x;
      const segments = 9;
      for (let j = 1; j <= segments; j++) {
        const py = (targetY * j) / segments;
        px += (hash(i * 101 + j * 17 + Math.floor(time * 20)) - 0.5) * 34;
        this.ctx.lineTo(px, py);
      }
      this.ctx.stroke();
      this.drawCachedGlow(px, targetY, 90, '#c084fc', fade);
    }
    this.ctx.translate(p.x, p.y);
    for (let ring = 0; ring < 3; ring++) {
      this.ctx.strokeStyle = rgba(ring === 1 ? '#ffffff' : '#c084fc', intensity * (0.8 - ring * 0.12));
      this.ctx.lineWidth = 2 + (ring === 1 ? 2 : 0);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 30 + ring * 18 + Math.sin(time * (4 + ring)) * 5, 0, TAU);
      this.ctx.stroke();
    }
    for (let i = 0; i < 8 + tier * 2; i++) {
      const a = time * (i % 2 ? -2 : 2.4) + (i * TAU) / (8 + tier * 2);
      const radius = 48 + (i % 3) * 14;
      this.ctx.fillStyle = rgba('#f5d0fe', intensity);
      this.ctx.beginPath();
      this.ctx.arc(Math.cos(a) * radius, Math.sin(a) * radius, 2.5, 0, TAU);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  private drawUltimateTitle(type: AwakeningType, tier: number, timer: number, duration: number): void {
    const color = this.awakeningColor(type);
    const progress = clamp(timer / duration);
    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = 'rgba(0,0,0,.52)';
    this.ctx.fillRect(0, 127, this.logicalWidth, 58);
    this.ctx.fillStyle = color;
    this.ctx.font = `900 24px ${FONT}`;
    const title =
      type === 'crimson' ? '赤红 · 天穹歼灭炮' : type === 'azure' ? '苍蓝 · 零度次元斩' : '紫电 · 万雷神罚阵列';
    this.ctx.fillText(title, this.logicalWidth / 2, 151);
    this.ctx.font = `800 10px ${FONT}`;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`${tier === 3 ? '真·觉醒 MAX' : `${tier}阶觉醒`}  //  OVERDRIVE`, this.logicalWidth / 2, 174);
    this.ctx.fillStyle = 'rgba(255,255,255,.14)';
    this.ctx.fillRect(this.logicalWidth / 2 - 170, 181, 340, 2);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(70, 181, 340 * progress, 2);
    this.ctx.restore();
  }

  private panel(x: number, y: number, width: number, height: number): void {
    this.ctx.fillStyle = 'rgba(3,8,20,.72)';
    this.ctx.strokeStyle = 'rgba(148,163,184,.3)';
    this.ctx.lineWidth = 1;
    this.roundRect(x, y, width, height, 7);
    this.ctx.fill();
    this.ctx.stroke();
  }

  private bar(x: number, y: number, width: number, height: number, ratio: number, color: string): void {
    this.ctx.fillStyle = 'rgba(15,23,42,.92)';
    this.roundRect(x, y, width, height, height / 2);
    this.ctx.fill();
    const filled = width * clamp(ratio);
    if (filled <= 0) return;
    const gradient = this.ctx.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, rgba(color, 0.7));
    gradient.addColorStop(1, color);
    this.ctx.fillStyle = gradient;
    this.roundRect(x + 1, y + 1, Math.max(1, filled - 2), height - 2, (height - 2) / 2);
    this.ctx.fill();
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + width, y, x + width, y + height, r);
    this.ctx.arcTo(x + width, y + height, x, y + height, r);
    this.ctx.arcTo(x, y + height, x, y, r);
    this.ctx.arcTo(x, y, x + width, y, r);
    this.ctx.closePath();
  }

  private shipId(value: unknown): ShipId {
    return value === 'falcon' || value === 'wasp' ? value : 'raiden';
  }

  private awakeningType(value: unknown): AwakeningType {
    return value === 'azure' || value === 'violet' ? value : 'crimson';
  }

  private awakeningColor(type: AwakeningType): string {
    return type === 'azure' ? '#38bdf8' : type === 'violet' ? '#c084fc' : '#ff4b3a';
  }

  private awakeningName(type: AwakeningType): string {
    return type === 'azure' ? '苍蓝' : type === 'violet' ? '紫电' : '赤红';
  }

  private formatTime(seconds: number): string {
    const value = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  }
}

export default CanvasRenderer;
