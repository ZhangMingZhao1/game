import './styles/main.css';
import { sound } from './audio/sound';
import { AwakeningCutinController } from './cutin/awakeningCutin';
import {
  applyItem,
  chooseLevelUp,
  createWorld,
  effectivePlayerArmor,
  equipPod,
  responsiveFieldWidth,
  resizeWorldField,
  startNextWave,
  stepWorld,
  type InputFrame,
  type WorldEvent,
  type WorldState,
} from './core/world';
import {
  createShopState,
  generateShop,
  markBought,
  rerollCost,
  type ShopState,
} from './core/shop';
import {
  AWAKENINGS,
  SHIPS,
  TRANSFORMATIONS,
  type AwakeningType,
  type ShipId,
} from './data/config';
import { CanvasRenderer } from './render/renderer';
import { InputManager } from './ui/input';
import {
  getItemById,
  randomLevelChoices,
  renderHangar,
  renderPause,
  renderResult,
  renderSettings,
  renderSidebars,
  renderTitle,
  showToast,
  updateTransformButton,
  updateUltimateButton,
  type HangarView,
  type SideView,
} from './ui/screens';

type Screen = 'title' | 'battle' | 'hangar' | 'pause' | 'settings' | 'result';

interface Settings {
  music: number;
  sfx: number;
  voice: number;
  voiceLang: 'cn' | 'jp';
  autoFire: boolean;
}

const $ = <T extends HTMLElement>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
};

const canvas = $('#game') as HTMLCanvasElement;
const ui = $('#ui');
const sideLeft = $('#side-left');
const sideRight = $('#side-right');
const ultButton = $('#ultBtn') as HTMLButtonElement;
const transformButton = $('#transformBtn') as HTMLButtonElement;
const pauseButton = $('#pauseBtn') as HTMLButtonElement;
const cutin = new AwakeningCutinController($('#cutin'));
const renderer = new CanvasRenderer(canvas);
const input = new InputManager(canvas);

const DEFAULT_SETTINGS: Settings = {
  music: 0.55,
  sfx: 0.8,
  voice: 0.95,
  voiceLang: 'cn',
  autoFire: true,
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? ({ ...fallback, ...JSON.parse(value) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is optional.
  }
}

let settings = loadJson<Settings>('aether_settings', DEFAULT_SETTINGS);
let selectedShip = loadJson<{ ship: ShipId }>('aether_pick', { ship: 'raiden' }).ship;
let selectedDanger = loadJson<{ danger: number }>('aether_danger', { danger: 0 }).danger;
let bestScore = loadJson<{ score: number }>('aether_highscore', { score: 0 }).score;
let world: WorldState | null = null;
let screen: Screen = 'title';
let previousScreen: Screen = 'title';
let paused = false;
let lastTime = performance.now();
let sidebarTimer = 0;
let lastBossId: number | null = null;
let shop: ShopState = createShopState();
let levelChoices = randomLevelChoices();
let lastHitSoundAt = 0;
let lastShootSoundAt = 0;
let finalHandled = false;

input.autoFire = settings.autoFire;
input.onPauseToggle = () => togglePause();
sound.updateVolumes(settings.music, settings.sfx, settings.voice, settings.voiceLang);

function scoreOf(current: WorldState) {
  return Math.floor(current.score.total);
}

function sideView(current: WorldState): SideView {
  return {
    wave: current.wave,
    scrap: current.player.scrap,
    score: scoreOf(current),
    player: {
      shipId: current.player.shipId,
      hp: current.player.hp,
      maxHp: current.player.maxHp,
      mainLevel: current.player.mainLevel,
      subLevel: current.player.subLevel,
      awakening: current.player.awakening,
      awakeningTier: current.player.awakeningTier,
      awakeningCharge: current.player.awakeningCharge,
      form: current.player.form,
      transformCooldown: current.player.transformCooldown,
      hiveShield: current.player.hiveShield,
      effectiveArmor: effectivePlayerArmor(current.player),
      stats: current.player.stats,
      pods: current.player.pods.map((pod) => ({ id: pod.id, tier: pod.tier - 1 })),
      items: current.player.items,
    },
  };
}

function hangarView(current: WorldState): HangarView {
  return {
    wave: current.wave,
    scrap: current.player.scrap,
    player: {
      shipId: current.player.shipId,
      hp: current.player.hp,
      maxHp: current.player.maxHp,
      mainLevel: current.player.mainLevel,
      subLevel: current.player.subLevel,
      awakening: current.player.awakening,
      awakeningTier: current.player.awakeningTier,
      form: current.player.form,
      stats: current.player.stats,
      pods: current.player.pods.map((pod) => ({ id: pod.id, tier: pod.tier - 1 })),
      items: current.player.items,
    },
    offers: shop.offers,
    rerollCost: rerollCost(shop),
    levelUpChoices: levelChoices,
    levelUpPending: current.player.pendingLevelUps > 0,
  };
}

function showTitle() {
  screen = 'title';
  paused = false;
  world = null;
  finalHandled = false;
  cutin.clear();
  sound.setBgmMode('menu');
  document.body.classList.add('menu');
  sideLeft.className = 'side';
  sideRight.className = 'side';
  sideLeft.innerHTML = '';
  sideRight.innerHTML = '';
  renderTitle(ui, selectedShip, selectedDanger, bestScore);
}

function beginRun() {
  sound.init();
  sound.setBgmMode('battle');
  world = createWorld(
    selectedShip,
    selectedDanger,
    responsiveFieldWidth(window.innerWidth, window.innerHeight),
  );
  screen = 'battle';
  paused = false;
  finalHandled = false;
  lastBossId = null;
  lastTime = performance.now();
  shop = createShopState();
  ui.className = '';
  ui.innerHTML = '';
  document.body.classList.remove('menu');
  showToast(`WAVE 1 · ${SHIPS.find((ship) => ship.id === selectedShip)?.name} 出击！`, '#38bdf8');
}

function enterHangar() {
  if (!world || screen === 'hangar') return;
  screen = 'hangar';
  sound.setBgmMode('shop');
  world.player.pendingLevelUps = Math.max(1, world.player.pendingLevelUps);
  levelChoices = randomLevelChoices();
  shop.rerolls = 0;
  generateShop(shop, {
    wave: world.wave,
    luck: world.player.stats.luck,
    scrap: world.player.scrap,
    itemIds: world.player.items,
  });
  sideLeft.className = 'side';
  sideRight.className = 'side';
  sideLeft.innerHTML = '';
  sideRight.innerHTML = '';
  renderHangar(ui, hangarView(world));
}

function rerenderHangar() {
  if (world && screen === 'hangar') renderHangar(ui, hangarView(world));
}

function togglePause(force?: boolean) {
  if (!world || (!['battle', 'pause'].includes(screen))) return;
  const shouldPause = force ?? screen === 'battle';
  if (shouldPause) {
    previousScreen = 'battle';
    screen = 'pause';
    paused = true;
    renderPause(ui, sideView(world));
  } else {
    screen = previousScreen === 'pause' ? 'battle' : previousScreen;
    paused = false;
    ui.className = '';
    ui.innerHTML = '';
    lastTime = performance.now();
  }
}

function finishRun(win: boolean) {
  if (!world || finalHandled) return;
  finalHandled = true;
  screen = 'result';
  paused = true;
  const score = scoreOf(world);
  bestScore = Math.max(bestScore, score);
  saveJson('aether_highscore', { score: bestScore });
  sound.setBgmMode(win ? 'shop' : 'none');
  renderResult(ui, win, {
    score,
    killScore: world.score.killScore,
    crystalScore: world.score.crystalScore,
    missedCrystalScore: world.score.missedCrystalScore,
    noHitBonus: world.score.noHitBonus,
    noHitWaves: world.score.noHitWaves,
    wave: world.wave,
    kills: world.stats.kills,
    damage: world.stats.damageDealt,
    awakenings: (world as WorldState & { awakeningUses?: number }).awakeningUses ?? 0,
    time: world.stats.elapsed,
  });
}

function eventSounds(events: WorldEvent[], before: { main: number; sub: number; awakening: AwakeningType; tier: number }) {
  if (!world) return;
  for (const event of events) {
    if (event.type === 'awakening') {
      const uses = ((world as WorldState & { awakeningUses?: number }).awakeningUses ?? 0) + 1;
      (world as WorldState & { awakeningUses?: number }).awakeningUses = uses;
      cutin.trigger(world.player.shipId, event.awakening, event.tier);
      const info = AWAKENINGS[event.awakening].tiers[event.tier - 1];
      showToast(`${info.badge} · ${info.skillTitle}`, AWAKENINGS[event.awakening].color);
    } else if (event.type === 'enemyKilled') {
      sound.playExplosion(
        event.boss
        || event.enemy === 'miniBoss'
        || event.enemy === 'elite'
        || event.enemy === 'transport'
          ? 'large'
          : 'small',
      );
    } else if (event.type === 'miniBossSpawned') {
      sound.playBossWarning();
      showToast(`WARNING · WAVE ${event.wave} 关底守卫出现`, '#fb7185');
    } else if (event.type === 'playerHit') {
      sound.playExplosion('small');
    } else if (event.type === 'dodge') {
      showToast('DODGE · 极限回避！', '#a5f3fc');
    } else if (event.type === 'transformed') {
      const config = TRANSFORMATIONS[world.player.shipId];
      const form = event.form === config.primary.id ? config.primary : config.alternate;
      sound.playSynthesize();
      showToast(`TRANSFORM · ${form.name}`, form.color);
    } else if (event.type === 'hiveShieldBlocked') {
      sound.playHit(false);
      showToast('HIVE SHIELD · 敌弹抵消', '#f0abfc');
    } else if (event.type === 'hit') {
      const now = performance.now();
      if (now - lastHitSoundAt > 45) {
        sound.playHit(event.critical);
        lastHitSoundAt = now;
      }
    } else if (event.type === 'pickup') {
      if (event.pickup === 'scrap') sound.playCapsulePickup('scrap');
      if (event.pickup === 'score') sound.playScorePickup(event.value ?? 0);
    } else if (event.type === 'levelUp') {
      sound.playSynthesize();
      showToast(`LEVEL UP · 战术等级 ${event.level}`, '#4ade80');
    } else if (event.type === 'waveClear') {
      showToast(`WAVE ${event.wave} CLEAR`, '#fbbf24');
      if (event.noHitBonus > 0) {
        showToast(`NO HIT BONUS +${event.noHitBonus.toLocaleString()}`, '#4ade80');
      }
    }
  }

  if (world.player.mainLevel > before.main) {
    sound.playCapsulePickup('main');
    showToast(`M 主炮强化 · Lv.${world.player.mainLevel}`, '#ff4b3a');
  }
  if (world.player.subLevel > before.sub) {
    sound.playCapsulePickup('sub');
    showToast(`S 副弹强化 · Lv.${world.player.subLevel}`, '#4ade80');
  }
  if (world.player.awakening !== before.awakening) {
    sound.playCapsulePickup('awakening_switch');
    showToast(`A 觉醒切换 · ${AWAKENINGS[world.player.awakening].name}`, AWAKENINGS[world.player.awakening].color);
  } else if (world.player.awakeningTier > before.tier) {
    sound.playCapsulePickup('awakening_tier');
    showToast(
      `A 觉醒突破 · ${AWAKENINGS[world.player.awakening].tiers[world.player.awakeningTier - 1].badge}`,
      AWAKENINGS[world.player.awakening].color
    );
  }
}

function frame(time: number) {
  const dt = Math.min(0.05, Math.max(0, (time - lastTime) / 1000));
  lastTime = time;

  const targetFieldWidth = responsiveFieldWidth(window.innerWidth, window.innerHeight);
  if (world) {
    resizeWorldField(world, targetFieldWidth);
    if (screen === 'battle' && !paused) {
      const move = input.getMoveVector(renderer.scale);
      const before = {
        main: world.player.mainLevel,
        sub: world.player.subLevel,
        awakening: world.player.awakening,
        tier: world.player.awakeningTier,
        shotsFired: world.stats.shotsFired,
      };
      const frameInput: InputFrame = {
        dx: move.dx,
        dy: move.dy,
        dragX: move.rawDragX,
        dragY: move.rawDragY,
        slow: move.slow,
        firing: input.isFiring(),
        ultimate: input.consumeUltimate(),
        transform: input.consumeTransformation(),
      };
      stepWorld(world, dt, frameInput);
      eventSounds(world.events, before);
      if (world.stats.shotsFired > before.shotsFired && time - lastShootSoundAt > 75) {
        sound.playShoot(world.player.mainGun, world.player.mainLevel);
        lastShootSoundAt = time;
      }

      const bossId = world.boss?.id ?? null;
      if (bossId !== null && bossId !== lastBossId) {
        lastBossId = bossId;
        sound.playBossWarning();
        sound.setBgmMode('boss');
        showToast(world.boss?.type === 'spider' ? 'BOSS · ARACHNE 钢铁蛛后' : 'FINAL BOSS · VALKYRIE 苍穹审判号', '#ff5a5a');
      }

      if (world.phase === 'waveClear') {
        enterHangar();
      } else if (world.phase === 'gameOver') {
        finishRun(false);
      } else if (world.phase === 'victory') {
        finishRun(true);
      }
    }

    const renderWorld = {
      ...world,
      elapsed: world.stats.elapsed,
      score: scoreOf(world),
      noHitEligible: world.score.noHitEligible,
      scrap: world.player.scrap,
      waveBanner: world.waveTime < 2.2 ? 2.2 - world.waveTime : 0,
      bossWarning: world.boss && world.boss.phase === 1 && world.waveTime < 3 ? 3 - world.waveTime : 0,
    };
    renderer.render(renderWorld);
    updateUltimateButton(
      ultButton,
      world.player.awakening,
      world.player.awakeningTier,
      world.player.awakeningCharge,
      world.player.stats.mana,
    );
    updateTransformButton(
      transformButton,
      world.player.shipId,
      world.player.form,
      world.player.transformCooldown,
    );

    sidebarTimer -= dt;
    if (screen === 'battle' && sidebarTimer <= 0) {
      sidebarTimer = 0.3;
      renderSidebars(sideLeft, sideRight, sideView(world), {
        left: renderer.fieldRect.x,
        right: renderer.fieldRect.x + renderer.fieldRect.width,
      });
    }
  } else {
    renderer.render({
      fieldWidth: targetFieldWidth,
      fieldHeight: 720,
      elapsed: time / 1000,
      wave: 1,
      waveTime: 0,
      waveDuration: 30,
      player: {
        x: targetFieldWidth / 2,
        y: 600,
        shipId: selectedShip,
        hp: 100,
        maxHp: 100,
        awakeningCharge: 0,
      },
      enemies: [],
      playerShots: [],
      enemyShots: [],
      pickups: [],
      particles: [],
      damageTexts: [],
    });
  }

  requestAnimationFrame(frame);
}

ui.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!target) return;
  const action = target.dataset.act;
  sound.init();

  if (action === 'select-ship') {
    selectedShip = (target.dataset.id || 'raiden') as ShipId;
    saveJson('aether_pick', { ship: selectedShip });
    renderTitle(ui, selectedShip, selectedDanger, bestScore);
  } else if (action === 'select-danger') {
    selectedDanger = Number(target.dataset.level || 0);
    saveJson('aether_danger', { danger: selectedDanger });
    renderTitle(ui, selectedShip, selectedDanger, bestScore);
  } else if (action === 'start-game') {
    beginRun();
  } else if (action === 'open-settings') {
    previousScreen = screen;
    screen = 'settings';
    renderSettings(ui, settings);
  } else if (action === 'close-settings') {
    saveJson('aether_settings', settings);
    input.autoFire = settings.autoFire;
    sound.updateVolumes(settings.music, settings.sfx, settings.voice, settings.voiceLang);
    if (previousScreen === 'title') showTitle();
    else if (world && previousScreen === 'pause') {
      screen = 'pause';
      renderPause(ui, sideView(world));
    }
  } else if (action === 'resume-game') {
    togglePause(false);
  } else if (action === 'restart-run') {
    beginRun();
  } else if (action === 'quit-title') {
    showTitle();
  } else if (action === 'choose-level' && world) {
    if (chooseLevelUp(world, target.dataset.id || '')) {
      sound.playSynthesize();
      levelChoices = randomLevelChoices();
      rerenderHangar();
    }
  } else if (action === 'buy-offer' && world) {
    const offer = shop.offers.find((entry) => entry.key === target.dataset.key);
    if (!offer || offer.sold) return;
    if (world.player.scrap < offer.price) {
      showToast('废料不足，无法购买', '#ff5a5a');
      return;
    }
    let success = false;
    if (offer.type === 'pod') {
      const podId = offer.data.id;
      const hasSame = world.player.pods.some((pod) => pod.id === podId);
      if (!hasSame && world.player.pods.length >= 6) {
        showToast('6个武器槽已满，请购买同款进行合成', '#ff5a5a');
        return;
      }
      success = equipPod(world, podId, Math.max(1, Math.min(4, offer.tier + 1)) as 1 | 2 | 3 | 4);
    } else {
      success = applyItem(world, offer.data.id);
    }
    if (success) {
      world.player.scrap -= offer.price;
      markBought(shop, offer.key);
      sound.playSynthesize();
      showToast(`装备获得 · ${offer.data.name}`, '#fbbf24');
      rerenderHangar();
    }
  } else if (action === 'reroll-shop' && world) {
    const cost = rerollCost(shop);
    if (world.player.scrap < cost) {
      showToast('废料不足，无法刷新', '#ff5a5a');
      return;
    }
    world.player.scrap -= cost;
    shop.rerolls += 1;
    generateShop(
      shop,
      {
        wave: world.wave,
        luck: world.player.stats.luck,
        scrap: world.player.scrap,
        itemIds: world.player.items,
      },
      Math.random,
      true
    );
    rerenderHangar();
  } else if (action === 'next-wave' && world) {
    if (world.player.pendingLevelUps > 0) {
      showToast('请先完成战术升级选择', '#ff5a5a');
      return;
    }
    if (startNextWave(world)) {
      screen = 'battle';
      paused = false;
      sound.setBgmMode(world.wave === 5 || world.wave === 10 ? 'boss' : 'battle');
      ui.className = '';
      ui.innerHTML = '';
      lastTime = performance.now();
      lastBossId = null;
      showToast(`WAVE ${world.wave} · 出击！`, '#38bdf8');
    }
  }
});

ui.addEventListener('input', (event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  const key = target.dataset.setting as keyof Settings | undefined;
  if (!key) return;
  if (key === 'autoFire') settings.autoFire = (target as HTMLInputElement).checked;
  else if (key === 'voiceLang') settings.voiceLang = target.value as 'cn' | 'jp';
  else settings[key] = Number(target.value) as never;
  sound.updateVolumes(settings.music, settings.sfx, settings.voice, settings.voiceLang);
});

ultButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  input.queueUltimate();
});
transformButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  input.queueTransformation();
});
pauseButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  togglePause();
});

window.addEventListener('blur', () => {
  if (screen === 'battle') togglePause(true);
});

if (import.meta.env.DEV) {
  Object.assign(window, {
    __aetherDebug: {
      getWorld: () => world,
      fillAwakening: () => {
        if (world) world.player.awakeningCharge = 100;
      },
      setAwakening: (type: AwakeningType, tier: 1 | 2 | 3 = 3) => {
        if (!world) return;
        world.player.awakening = type;
        world.player.awakeningTier = tier;
        world.player.awakeningCharge = 100;
      },
      finishWave: () => {
        if (!world) return;
        world.waveTime = world.waveDuration;
        world.enemies.length = 0;
      },
    },
  });
}

showTitle();
requestAnimationFrame(frame);

