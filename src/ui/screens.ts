import {
  AWAKENINGS,
  DANGER_LEVELS,
  LEVEL_UP_OPTIONS,
  PASSIVE_ITEMS,
  POD_WEAPONS,
  SET_BONUSES,
  SHIPS,
  TIER_COLORS,
  TIER_ROMAN,
  TRANSFORMATIONS,
  type AwakeningType,
  type LevelUpOption,
  type PassiveItemConfig,
  type PodWeaponConfig,
  type PlayerForm,
  type SetTag,
  type ShipId,
  type StatMods,
} from '../data/config';
import { getPilotPortraitSvg } from '../cutin/awakeningCutin';

export interface OwnedPodView {
  id: string;
  tier: number;
}

export interface ShopOfferView {
  key: string;
  type: 'pod' | 'item';
  data: PodWeaponConfig | PassiveItemConfig;
  tier: number;
  price: number;
  sold: boolean;
  locked: boolean;
}

export interface HangarView {
  wave: number;
  scrap: number;
  player: {
    shipId: ShipId;
    hp: number;
    maxHp: number;
    mainLevel: number;
    subLevel: number;
    awakening: AwakeningType;
    awakeningTier: number;
    form: PlayerForm;
    stats: Required<StatMods>;
    pods: OwnedPodView[];
    items: string[];
  };
  offers: ShopOfferView[];
  rerollCost: number;
  levelUpChoices: LevelUpOption[];
  levelUpPending: boolean;
}

export interface SideView {
  wave: number;
  scrap: number;
  score: number;
  player: HangarView['player'] & {
    awakeningCharge: number;
    transformCooldown: number;
    hiveShield: number;
    effectiveArmor: number;
  };
}

const escapeHtml = (value: unknown) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function chips(count: number, max: number, kind: 'main' | 'sub' | 'awk', color?: string) {
  return Array.from(
    { length: max },
    (_, i) =>
      `<span class="pip-cell ${i < count ? `on ${kind}` : ''}" ${
        color ? `style="--awk-c:${color}"` : ''
      }></span>`
  ).join('');
}

function tagHtml(tag: SetTag) {
  const set = SET_BONUSES[tag];
  return `<span class="set-tag" style="--tag-c:${set.color}">${set.name}</span>`;
}

export function renderTitle(
  root: HTMLElement,
  selectedShip: ShipId,
  selectedDanger: number,
  bestScore: number
) {
  root.className = 'overlay';
  root.innerHTML = `
    <main class="screen-wrap">
      <div class="logo-box">
        <div class="logo-eyebrow">CANVAS 2D × AIRCRAFT ROGUELIKE × AWAKENING</div>
        <h1 class="logo-title">苍穹觉醒</h1>
        <p class="logo-sub">
          击落运输机，争夺 <b style="color:#ff4b3a">M 主炮</b>、
          <b style="color:#4ade80">S 副弹</b> 与
          <b style="color:#e879f9">A 觉醒核心</b>。切换三系终极觉醒，在弹幕中构筑你的空战流派。
        </p>
      </div>
      <div class="ship-grid">
        ${SHIPS.map((ship) => {
          const awk = AWAKENINGS[ship.defaultAwakening];
          return `
            <article class="ship-card ${ship.id === selectedShip ? 'selected' : ''}" data-act="select-ship" data-id="${ship.id}">
              <div class="ship-card-top">
                <div class="ship-portrait">${getPilotPortraitSvg(ship.id, ship.defaultAwakening, 1)}</div>
                <div class="ship-meta">
                  <h3>${ship.name}</h3>
                  <div class="pilot-name">${ship.pilotName}</div>
                  <div class="ship-role">${ship.title}</div>
                </div>
              </div>
              <div class="badge-list">
                <span class="InfoChip" style="color:${ship.color}">M · ${ship.mainGunName}</span>
                <span class="InfoChip" style="color:#4ade80">S · ${ship.subWeaponName}</span>
                <span class="InfoChip" style="color:${awk.color}">A · ${awk.shortName}</span>
              </div>
              <p style="margin:0;color:#cbd5e1;font-size:13px;line-height:1.45">${ship.desc}</p>
              <p style="margin:0;color:${ship.accentColor};font-size:12px;line-height:1.4">${ship.passiveDesc}</p>
            </article>
          `;
        }).join('')}
      </div>
      <div class="mechanic-banner">
        <div class="mech-box">
          <div class="capsule-icon m">M</div>
          <div><b>主炮强化 Lv.1–8</b><div style="color:#94a3b8;font-size:13px">增加弹道、射速与超载形态；满级继续拾取会触发短暂暴走。</div></div>
        </div>
        <div class="mech-box">
          <div class="capsule-icon s">S</div>
          <div><b>副弹强化 Lv.1–6</b><div style="color:#94a3b8;font-size:13px">提高副弹齐射数量、索敌与全部挂载吊舱威力。</div></div>
        </div>
        <div class="mech-box">
          <div class="capsule-icon a">A</div>
          <div><b>三色觉醒核心</b><div style="color:#94a3b8;font-size:13px">异色切换大招；同色升至二觉与真·觉醒，并回复能量。</div></div>
        </div>
      </div>
      <div class="danger-bar">
        ${DANGER_LEVELS.map(
          (d) =>
            `<button class="danger-btn ${d.level === selectedDanger ? 'selected' : ''}" data-act="select-danger" data-level="${d.level}" title="${escapeHtml(d.desc)}">${d.name}</button>`
        ).join('')}
      </div>
      <div style="text-align:center;color:#94a3b8;font-size:13px">
        WASD / 方向键移动 · Shift 低速 · C 变形 · X/K 觉醒 · Esc/P 暂停 · 最高分 ${bestScore.toLocaleString()}
      </div>
      <div class="screen-actions">
        <button class="btn primary big" data-act="start-game">▶ 开始觉醒出击</button>
        <button class="btn" data-act="open-settings">⚙ 音频与操作</button>
      </div>
    </main>
  `;
}

export function renderSettings(
  root: HTMLElement,
  settings: { music: number; sfx: number; voice: number; voiceLang: 'cn' | 'jp'; autoFire: boolean }
) {
  root.className = 'overlay';
  root.innerHTML = `
    <div class="pause-panel">
      <h2 class="section-title">系统设置 / SYSTEM CONFIG</h2>
      <label class="stat-row"><span>音乐音量</span><input data-setting="music" type="range" min="0" max="1" step="0.05" value="${settings.music}"></label>
      <label class="stat-row"><span>战斗音效</span><input data-setting="sfx" type="range" min="0" max="1" step="0.05" value="${settings.sfx}"></label>
      <label class="stat-row"><span>觉醒语音</span><input data-setting="voice" type="range" min="0" max="1" step="0.05" value="${settings.voice}"></label>
      <label class="stat-row"><span>语音语言</span>
        <select data-setting="voiceLang"><option value="cn" ${settings.voiceLang === 'cn' ? 'selected' : ''}>中文觉醒台词</option><option value="jp" ${settings.voiceLang === 'jp' ? 'selected' : ''}>日文觉醒台词</option></select>
      </label>
      <label class="stat-row"><span>自动射击</span><input data-setting="autoFire" type="checkbox" ${settings.autoFire ? 'checked' : ''}></label>
      <div class="screen-actions"><button class="btn primary" data-act="close-settings">保存并返回</button></div>
    </div>
  `;
}

function podSlotHtml(pod: OwnedPodView | undefined, index: number) {
  if (!pod) return `<div class="pod-slot empty">吊舱槽 ${index + 1}<br>EMPTY</div>`;
  const config = POD_WEAPONS.find((item) => item.id === pod.id);
  if (!config) return `<div class="pod-slot empty">未知武装</div>`;
  return `
    <div class="pod-slot" style="--tier-c:${TIER_COLORS[pod.tier] || TIER_COLORS[0]}">
      <div>
        <b>${config.name}</b>
        <div class="set-tags">${config.tags.map(tagHtml).join('')}</div>
      </div>
      <span style="color:${TIER_COLORS[pod.tier]};font-family:var(--pixel);font-size:11px">TIER ${TIER_ROMAN[pod.tier] || 'I'}</span>
    </div>
  `;
}

function offerHtml(offer: ShopOfferView) {
  if (offer.sold) return `<div class="shop-card sold">SOLD OUT</div>`;
  const tierColor = TIER_COLORS[Math.max(0, Math.min(3, offer.tier))];
  if (offer.type === 'pod') {
    const pod = offer.data as PodWeaponConfig;
    return `
      <article class="shop-card" style="--tier-c:${tierColor}">
        <div>
          <h3>${pod.name} <span style="color:${tierColor}">${TIER_ROMAN[offer.tier]}</span></h3>
          <div class="set-tags">${pod.tags.map(tagHtml).join('')}</div>
          <p>${pod.desc}</p>
        </div>
        <button class="btn gold" data-act="buy-offer" data-key="${offer.key}">◆ ${offer.price} 废料</button>
      </article>
    `;
  }
  const item = offer.data as PassiveItemConfig;
  return `
    <article class="shop-card" style="--tier-c:${item.color}">
      <div>
        <h3>${item.name}</h3>
        <div class="set-tags"><span class="set-tag" style="--tag-c:${item.color}">被动模块</span></div>
        <p>${item.desc}</p>
      </div>
      <button class="btn gold" data-act="buy-offer" data-key="${offer.key}">◆ ${offer.price} 废料</button>
    </article>
  `;
}

function manaCapacity(mana: number) {
  return Math.max(100, Math.floor(mana / 100) * 100);
}

function ultimateStocks(charge: number) {
  return Math.floor(Math.max(0, charge) / 100);
}

function statRows(view: HangarView) {
  const s = view.player.stats;
  const mana = Math.max(100, Math.round(s.mana ?? 100));
  return [
    ['机体耐久', `${Math.ceil(view.player.hp)} / ${Math.ceil(view.player.maxHp)}`],
    ['速度', `+${Math.round(s.speedPct)}%`],
    ['护甲', `${Math.round(s.armor)}`],
    ['魔力', `${mana} · 可存 ${Math.floor(mana / 100)} 次大招`],
    ['闪避', `${Math.round(s.dodge)}%`],
    ['全局伤害', `+${Math.round(s.damagePct)}%`],
    ['主炮伤害', `+${Math.round(s.mainDmgPct)}%`],
    ['副弹伤害', `+${Math.round(s.subDmgPct)}%`],
    ['攻击速度', `+${Math.round(s.attackSpeedPct)}%`],
    ['暴击率', `${Math.round(s.critChance)}%`],
    ['觉醒充能效率', `+${Math.round(s.awakeningGainPct)}%`],
    ['觉醒伤害', `+${Math.round(s.awakeningDmgPct)}%`],
    ['幸运 / 收获', `${Math.round(s.luck)} / ${Math.round(s.harvest)}`],
  ]
    .map(([name, value]) => `<div class="stat-row"><span>${name}</span><b class="good">${value}</b></div>`)
    .join('');
}

export function renderHangar(root: HTMLElement, view: HangarView) {
  const awk = AWAKENINGS[view.player.awakening];
  const tagCounts = new Map<SetTag, number>();
  view.player.pods.forEach((owned) => {
    POD_WEAPONS.find((p) => p.id === owned.id)?.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  const slots = Array.from({ length: 6 }, (_, i) => podSlotHtml(view.player.pods[i], i)).join('');
  const levelBlock = view.levelUpPending
    ? `
      <section class="section-card">
        <h2 class="section-title" style="color:#4ade80">LEVEL UP · 选择一项战术强化</h2>
        <div class="levelup-grid">
          ${view.levelUpChoices
            .map(
              (choice) => `
                <button class="level-card" style="--card-c:${choice.color}" data-act="choose-level" data-id="${choice.id}">
                  <h3>${choice.name}</h3><p>${choice.desc}</p>
                </button>`
            )
            .join('')}
        </div>
      </section>`
    : '';

  root.className = 'overlay';
  root.innerHTML = `
    <main class="hangar-layout">
      <div class="hangar-main">
        <header class="hangar-header">
          <div><div class="hangar-title">WAVE ${view.wave} CLEAR · 战术整备机库</div><small style="color:#94a3b8">合成副武器、构筑羁绊，为下一波完成整备</small></div>
          <div class="scrap-counter">◆ ${Math.floor(view.scrap)}</div>
        </header>
        ${levelBlock}
        <section class="section-card">
          <h2 class="section-title">武器吊舱 · 两个同名同阶自动合成为高阶</h2>
          <div class="pod-slots-grid">${slots}</div>
        </section>
        <section class="section-card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px">
            <h2 class="section-title" style="margin:0">战术商店 · 4件随机商品</h2>
            <button class="btn" data-act="reroll-shop">刷新商品 ◆ ${view.rerollCost}</button>
          </div>
          <div class="shop-cards">${view.offers.map(offerHtml).join('')}</div>
        </section>
      </div>
      <aside class="hangar-side">
        <section class="side-card side-pilot">
          <div class="side-pilot-avatar">${getPilotPortraitSvg(view.player.shipId, view.player.awakening, Math.max(1, Math.min(3, view.player.awakeningTier)) as 1 | 2 | 3)}</div>
          <div>
            <b>${SHIPS.find((s) => s.id === view.player.shipId)?.name || view.player.shipId}</b>
            <div style="color:${awk.color};font-size:13px">${awk.name} · ${view.player.awakeningTier}阶</div>
          </div>
        </section>
        <section class="side-card">
          <h3>局内火力成长</h3>
          <div class="growth-bars">
            <div class="growth-row"><div class="growth-head"><span style="color:#ff4b3a">M 主炮</span><b>Lv.${view.player.mainLevel}</b></div><div class="pips-bar">${chips(view.player.mainLevel, 8, 'main')}</div></div>
            <div class="growth-row"><div class="growth-head"><span style="color:#4ade80">S 副弹</span><b>Lv.${view.player.subLevel}</b></div><div class="pips-bar">${chips(view.player.subLevel, 6, 'sub')}</div></div>
            <div class="growth-row"><div class="growth-head"><span style="color:${awk.color}">A 觉醒</span><b>${view.player.awakeningTier}阶</b></div><div class="pips-bar">${chips(view.player.awakeningTier, 3, 'awk', awk.color)}</div></div>
            <div class="growth-row"><div class="growth-head"><span style="color:#22d3ee">速度</span><b>+${Math.round(view.player.stats.speedPct)}%</b></div></div>
            <div class="growth-row"><div class="growth-head"><span style="color:#94a3b8">护甲</span><b>${Math.round(view.player.stats.armor)}</b></div></div>
            <div class="growth-row"><div class="growth-head"><span style="color:#d946ef">魔力</span><b>${Math.max(100, Math.round(view.player.stats.mana ?? 100))} · ×${Math.floor(Math.max(100, view.player.stats.mana ?? 100) / 100)}</b></div></div>
          </div>
        </section>
        <section class="stat-list"><h3 class="section-title">机体战斗属性</h3>${statRows(view)}</section>
        <section class="side-card">
          <h3>套装羁绊</h3>
          ${Object.entries(SET_BONUSES)
            .map(([tag, set]) => {
              const count = tagCounts.get(tag as SetTag) || 0;
              const best = [...set.thresholds].reverse().find((t) => count >= t.count);
              return `<div class="set-bonus-row ${best ? 'active' : ''}" style="--set-c:${set.color}"><b>${set.name} ${count}/6</b><br>${best?.label || set.thresholds[0].label}</div>`;
            })
            .join('')}
        </section>
        <button class="btn primary big" data-act="next-wave" ${view.levelUpPending ? 'disabled' : ''}>下一波出击 ▶</button>
      </aside>
    </main>
  `;
}

export function renderPause(root: HTMLElement, view: SideView) {
  root.className = 'overlay';
  root.innerHTML = `
    <section class="pause-panel">
      <div class="logo-eyebrow">TACTICAL PAUSE</div>
      <h2 class="section-title" style="font-size:20px;margin-top:16px">战术暂停</h2>
      <p style="color:#94a3b8">Wave ${view.wave} · 得分 ${view.score.toLocaleString()} · 废料 ${Math.floor(view.scrap)}</p>
      <div class="growth-bars">
        <div class="growth-row"><div class="growth-head"><span style="color:#ff4b3a">M 主炮</span><b>Lv.${view.player.mainLevel}</b></div><div class="pips-bar">${chips(view.player.mainLevel, 8, 'main')}</div></div>
        <div class="growth-row"><div class="growth-head"><span style="color:#4ade80">S 副弹</span><b>Lv.${view.player.subLevel}</b></div><div class="pips-bar">${chips(view.player.subLevel, 6, 'sub')}</div></div>
      </div>
      <div class="screen-actions">
        <button class="btn primary" data-act="resume-game">继续战斗</button>
        <button class="btn" data-act="restart-run">重新开始</button>
        <button class="btn" data-act="quit-title">返回标题</button>
      </div>
    </section>
  `;
}

export function renderResult(
  root: HTMLElement,
  win: boolean,
  stats: {
    score: number;
    killScore: number;
    crystalScore: number;
    missedCrystalScore: number;
    noHitBonus: number;
    noHitWaves: number;
    wave: number;
    kills: number;
    damage: number;
    awakenings: number;
    time: number;
  }
) {
  root.className = 'overlay';
  root.innerHTML = `
    <section class="result-panel ${win ? 'win' : 'lose'}">
      <div class="logo-eyebrow">${win ? 'MISSION COMPLETE' : 'AIRCRAFT DESTROYED'}</div>
      <h1 style="font-family:var(--pixel);color:${win ? '#fbbf24' : '#ff5a5a'};font-size:22px">${win ? '苍穹制霸 · 作战成功' : '机体坠毁 · 作战失败'}</h1>
      <div class="result-stats">
        <div class="result-stat"><span>最终得分</span><b>${Math.floor(stats.score).toLocaleString()}</b></div>
        <div class="result-stat"><span>击毁基础分</span><b>${Math.floor(stats.killScore).toLocaleString()}</b></div>
        <div class="result-stat"><span>钻石收集分</span><b>${Math.floor(stats.crystalScore).toLocaleString()}</b></div>
        <div class="result-stat"><span>无伤奖励</span><b>${Math.floor(stats.noHitBonus).toLocaleString()}</b></div>
        <div class="result-stat"><span>漏失钻石分</span><b>${Math.floor(stats.missedCrystalScore).toLocaleString()}</b></div>
        <div class="result-stat"><span>无伤波次</span><b>${stats.noHitWaves}</b></div>
        <div class="result-stat"><span>抵达波次</span><b>${stats.wave}</b></div>
        <div class="result-stat"><span>击毁敌机</span><b>${stats.kills}</b></div>
        <div class="result-stat"><span>作战时间</span><b>${Math.floor(stats.time / 60)}:${String(Math.floor(stats.time % 60)).padStart(2, '0')}</b></div>
      </div>
      <div class="screen-actions">
        <button class="btn primary big" data-act="restart-run">再次出击</button>
        <button class="btn" data-act="quit-title">返回标题</button>
      </div>
    </section>
  `;
}

export function renderSidebars(left: HTMLElement, right: HTMLElement, view: SideView, fieldRect: { left: number; right: number }) {
  const renderedFieldWidth = Math.max(0, fieldRect.right - fieldRect.left);
  const showOverlay = window.innerWidth >= 1200 && renderedFieldWidth >= 1000;
  const overlayWidth = Math.max(230, Math.min(300, Math.round(window.innerWidth * 0.16)));
  const showLeft = showOverlay;
  const showRight = showOverlay;
  left.className = showLeft ? 'side show' : 'side';
  right.className = showRight ? 'side show' : 'side';
  left.style.left = '0';
  left.style.width = `${overlayWidth}px`;
  right.style.right = '0';
  right.style.width = `${overlayWidth}px`;
  if (showLeft) {
    const awk = AWAKENINGS[view.player.awakening];
    const transformConfig = TRANSFORMATIONS[view.player.shipId];
    const form = view.player.form === transformConfig.primary.id
      ? transformConfig.primary
      : transformConfig.alternate;
    left.innerHTML = `
      <div class="side-card side-pilot">
        <div class="side-pilot-avatar">${getPilotPortraitSvg(view.player.shipId, view.player.awakening, Math.max(1, Math.min(3, view.player.awakeningTier)) as 1 | 2 | 3)}</div>
        <div><b>${SHIPS.find((s) => s.id === view.player.shipId)?.name || ''}</b><div style="color:${awk.color};font-size:12px">${awk.shortName}</div></div>
      </div>
      <div class="side-card">
        <h3>局内强化</h3>
        <div class="growth-bars">
          <div class="growth-row"><div class="growth-head"><span style="color:#ff4b3a">M 主炮</span><b>Lv.${view.player.mainLevel}</b></div><div class="pips-bar">${chips(view.player.mainLevel, 8, 'main')}</div></div>
          <div class="growth-row"><div class="growth-head"><span style="color:#4ade80">S 副弹</span><b>Lv.${view.player.subLevel}</b></div><div class="pips-bar">${chips(view.player.subLevel, 6, 'sub')}</div></div>
          <div class="growth-row"><div class="growth-head"><span style="color:${awk.color}">觉醒能量</span><b>${Math.floor(view.player.awakeningCharge)} / ${manaCapacity(view.player.stats.mana ?? 100)}</b></div><div class="pips-bar">${chips(Math.min(30, Math.floor(view.player.awakeningCharge / 10)), Math.min(30, Math.floor(manaCapacity(view.player.stats.mana ?? 100) / 10)), 'awk', awk.color)}</div></div>
          <div class="growth-row"><div class="growth-head"><span style="color:${form.color}">当前形态</span><b>${form.name}</b></div><div style="color:#94a3b8;font-size:11px;margin-top:4px">${form.summary}</div></div>
        </div>
      </div>
    `;
  } else left.innerHTML = '';
  if (showRight) {
    const mana = Math.max(100, Math.round(view.player.stats.mana ?? 100));
    right.innerHTML = `
      <div class="side-card"><h3>作战数据</h3>
        <div class="stat-row"><span>波次</span><b>${view.wave} / 10</b></div>
        <div class="stat-row"><span>得分</span><b class="good">${view.score.toLocaleString()}</b></div>
        <div class="stat-row"><span>废料</span><b class="good">◆ ${Math.floor(view.scrap)}</b></div>
        <div class="stat-row"><span>机体耐久</span><b>${Math.ceil(view.player.hp)} / ${Math.ceil(view.player.maxHp)}</b></div>
        <div class="stat-row"><span>速度</span><b>+${Math.round(view.player.stats.speedPct)}%</b></div>
        <div class="stat-row"><span>护甲</span><b>${Math.round(view.player.effectiveArmor)}</b></div>
        <div class="stat-row"><span>魔力</span><b>${mana} · ×${Math.floor(mana / 100)}</b></div>
        ${view.player.form === 'fortress' ? `<div class="stat-row"><span>蜂巢护盾</span><b class="good">${view.player.hiveShield > 0 ? 'READY' : '充能中'}</b></div>` : ''}
      </div>
      <div class="side-card"><h3>操作</h3><div style="color:#94a3b8;font-size:12px;line-height:1.7">WASD / 方向键 · 移动<br>SHIFT · 精准低速<br>C · 切换形态<br>X / K · 觉醒大招<br>ESC / P · 暂停</div></div>
    `;
  } else right.innerHTML = '';
}

export function updateUltimateButton(
  button: HTMLButtonElement,
  awakening: AwakeningType,
  tier: number,
  charge: number,
  mana = 100,
) {
  const awk = AWAKENINGS[awakening];
  const capacity = manaCapacity(mana);
  const stocks = ultimateStocks(charge);
  button.style.setProperty('--ult-color', awk.color);
  button.classList.toggle('ready', charge >= 100);
  button.querySelector<HTMLElement>('.ult-label')!.textContent = tier >= 3 ? '真觉' : tier === 2 ? '二觉' : '觉';
  button.querySelector<HTMLElement>('.ult-pct')!.textContent = stocks > 1
    ? `×${stocks}`
    : charge >= 100
      ? 'READY'
      : `${Math.floor(charge)}/${capacity}`;
}

export function updateTransformButton(
  button: HTMLButtonElement,
  shipId: ShipId,
  formId: PlayerForm,
  cooldown: number,
): void {
  const config = TRANSFORMATIONS[shipId];
  const form = formId === config.primary.id ? config.primary : config.alternate;
  button.style.setProperty('--transform-color', form.color);
  button.classList.toggle('cooldown', cooldown > 0);
  button.querySelector<HTMLElement>('.transform-label')!.textContent = form.shortName;
  button.querySelector<HTMLElement>('.transform-mode')!.textContent = cooldown > 0
    ? `${cooldown.toFixed(1)}s`
    : 'C · 切换';
}

export function showToast(text: string, color = '#fbbf24') {
  let stack = document.querySelector<HTMLElement>('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = 'game-toast';
  toast.style.setProperty('--toast-c', color);
  toast.textContent = text;
  stack.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2250);
}

export function randomLevelChoices(random = Math.random): LevelUpOption[] {
  const pool = [...LEVEL_UP_OPTIONS];
  const choices: LevelUpOption[] = [];
  while (choices.length < 4 && pool.length) {
    const index = Math.floor(random() * pool.length);
    choices.push(pool.splice(index, 1)[0]);
  }
  return choices;
}

export function getItemById(id: string) {
  return PASSIVE_ITEMS.find((item) => item.id === id);
}
