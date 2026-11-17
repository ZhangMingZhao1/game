import { AWAKENINGS, AwakeningType, SHIPS, ShipId } from '../data/config';
import { sound } from '../audio/sound';

/**
 * 生成高精度驾驶员觉醒动态 SVG 立绘（支持随时替换为本地图片）
 */
export function getPilotPortraitSvg(shipId: ShipId, awakening: AwakeningType, tier: 1 | 2 | 3): string {
  const awk = AWAKENINGS[awakening];
  const primary = awk.color;
  const glow = awk.glowColor;
  const isMax = tier === 3;

  if (shipId === 'raiden') {
    // 凛 (Rin) - 赤焰女武神：红金双马尾/战术护目镜/重装机甲领口
    return `<svg viewBox="0 0 320 380" xmlns="http://www.w3.org/2000/svg" class="pilot-svg">
      <defs>
        <radialGradient id="aura-${shipId}" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.75"/>
          <stop offset="60%" stop-color="${primary}" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="hair-${shipId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ff6b4a"/>
          <stop offset="50%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </linearGradient>
        <linearGradient id="armor-${shipId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <circle cx="160" cy="180" r="150" fill="url(#aura-${shipId})" />
      ${
        isMax
          ? `<g stroke="${glow}" stroke-width="2.5" opacity="0.85">
              <polygon points="160,14 195,90 278,90 210,140 235,222 160,172 85,222 110,140 42,90 125,90" fill="none"/>
            </g>`
          : ''
      }
      <!-- 飘动后发与双翼发束 -->
      <path d="M55,140 Q15,220 28,330 Q68,280 95,210 Z" fill="url(#hair-${shipId})" />
      <path d="M265,140 Q305,220 292,330 Q252,280 225,210 Z" fill="url(#hair-${shipId})" />
      <path d="M82,78 Q160,28 238,78 Q268,165 240,260 L80,260 Q52,165 82,78 Z" fill="url(#hair-${shipId})" />
      <!-- 机甲肩甲与作战服 -->
      <path d="M48,370 L78,255 L160,278 L242,255 L272,370 Z" fill="url(#armor-${shipId})" stroke="${primary}" stroke-width="3"/>
      <polygon points="40,285 98,245 112,295 55,335" fill="#b91c1c" stroke="${glow}" stroke-width="2"/>
      <polygon points="280,285 222,245 208,295 265,335" fill="#b91c1c" stroke="${glow}" stroke-width="2"/>
      <!-- 胸口觉醒核心 -->
      <polygon points="160,282 182,312 160,342 138,312" fill="${glow}" stroke="#fff" stroke-width="2"/>
      <!-- 脸部轮廓 -->
      <path d="M112,125 L112,195 Q112,235 160,252 Q208,235 208,195 L208,125 Z" fill="#fde6d8" stroke="#f5bca9" stroke-width="1.5"/>
      <!-- 觉醒发光双眸 -->
      <g class="pilot-eyes">
        <polygon points="122,172 148,168 145,184 125,184" fill="#1e1b4b"/>
        <polygon points="127,173 145,170 143,182 129,182" fill="${primary}"/>
        <circle cx="133" cy="175" r="3" fill="#fff"/>
        <polygon points="198,172 172,168 175,184 195,184" fill="#1e1b4b"/>
        <polygon points="193,173 175,170 177,182 191,182" fill="${primary}"/>
        <circle cx="181" cy="175" r="3" fill="#fff"/>
        <!-- 觉醒眼部流光残影 -->
        <path d="M136,174 Q95,155 45,125" stroke="${glow}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M184,174 Q225,155 275,125" stroke="${glow}" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>
      <!-- 英气眉线与自信呐喊嘴型 -->
      <path d="M118,158 L150,164" stroke="#7f1d1d" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M202,158 L170,164" stroke="#7f1d1d" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M148,215 L172,215 L166,232 L154,232 Z" fill="#be123c" stroke="#881337" stroke-width="1.5"/>
      <!-- 前刘海与战术发饰 -->
      <path d="M96,110 Q125,165 138,125 Q155,172 172,122 Q192,165 224,110 Q195,62 160,62 Q125,62 96,110 Z" fill="url(#hair-${shipId})"/>
      <polygon points="95,95 142,112 135,126 84,114" fill="#fbbf24" stroke="#fff" stroke-width="1.5"/>
      <polygon points="225,95 178,112 185,126 236,114" fill="#fbbf24" stroke="#fff" stroke-width="1.5"/>
    </svg>`;
  }

  if (shipId === 'falcon') {
    // 零 (Zero) - 银白次元刀姬：银发冷艳刺客/苍蓝半脸能量面甲/次元刀光
    return `<svg viewBox="0 0 320 380" xmlns="http://www.w3.org/2000/svg" class="pilot-svg">
      <defs>
        <radialGradient id="aura-${shipId}" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="${glow}" stop-opacity="0.8"/>
          <stop offset="60%" stop-color="${primary}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="hair-${shipId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="55%" stop-color="#bae6fd"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>
      <circle cx="160" cy="180" r="150" fill="url(#aura-${shipId})" />
      <!-- 背景交叉次元太刀 -->
      <line x1="25" y1="330" x2="295" y2="45" stroke="${glow}" stroke-width="6" opacity="0.9"/>
      <line x1="295" y1="330" x2="25" y2="45" stroke="${primary}" stroke-width="4" opacity="0.75"/>
      <!-- 银白飘逸长发 -->
      <path d="M70,80 Q160,25 250,80 Q285,190 262,320 L58,320 Q35,190 70,80 Z" fill="url(#hair-${shipId})" />
      <!-- 高领次元作战服 -->
      <path d="M56,370 L90,250 L160,265 L230,250 L264,370 Z" fill="#090d16" stroke="${primary}" stroke-width="3"/>
      <path d="M118,235 L160,285 L202,235 L192,370 L128,370 Z" fill="#0c4a6e" stroke="${glow}" stroke-width="2"/>
      <!-- 脸部 -->
      <path d="M114,125 L114,195 Q114,234 160,250 Q206,234 206,195 L206,125 Z" fill="#fff1eb"/>
      <!-- 苍蓝冰瞳与刀光眼尾 -->
      <g class="pilot-eyes">
        <polygon points="122,172 149,170 146,183 125,183" fill="#082f49"/>
        <polygon points="127,173 145,171 143,181 129,181" fill="#38bdf8"/>
        <circle cx="135" cy="175" r="2.8" fill="#fff"/>
        <polygon points="198,172 171,170 174,183 195,183" fill="#082f49"/>
        <polygon points="193,173 175,171 177,181 191,181" fill="#38bdf8"/>
        <circle cx="183" cy="175" r="2.8" fill="#fff"/>
        <path d="M188,173 Q238,145 302,110" stroke="${glow}" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
      <!-- 战术能量面甲纹路 -->
      <path d="M114,198 L145,208 L160,202 L175,208 L206,198" fill="none" stroke="${primary}" stroke-width="2" opacity="0.8"/>
      <line x1="150" y1="222" x2="170" y2="222" stroke="#e11d48" stroke-width="2.8" stroke-linecap="round"/>
      <!-- 银色斜刘海与冰晶头冠 -->
      <path d="M95,108 Q130,175 152,130 Q168,182 195,125 Q210,165 228,112 Q196,58 160,58 Q120,58 95,108 Z" fill="url(#hair-${shipId})"/>
      <polygon points="160,34 176,78 160,94 144,78" fill="${glow}" stroke="#fff" stroke-width="2"/>
    </svg>`;
  }

  // 艾拉 (Ayla) - 紫电蜂群统帅：紫粉渐变长发/战术耳机光环/雷电矩阵
  return `<svg viewBox="0 0 320 380" xmlns="http://www.w3.org/2000/svg" class="pilot-svg">
    <defs>
      <radialGradient id="aura-${shipId}" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="${glow}" stop-opacity="0.82"/>
        <stop offset="60%" stop-color="${primary}" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="hair-${shipId}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f5d0fe"/>
        <stop offset="50%" stop-color="#c084fc"/>
        <stop offset="100%" stop-color="#6b21a8"/>
      </linearGradient>
    </defs>
    <circle cx="160" cy="180" r="150" fill="url(#aura-${shipId})" />
    <!-- 身后悬浮六边形蜂群无人机矩阵 -->
    <g stroke="${glow}" stroke-width="2.5" fill="#3b0764" fill-opacity="0.6">
      <polygon points="55,95 78,82 101,95 101,122 78,135 55,122"/>
      <polygon points="265,95 242,82 219,95 219,122 242,135 265,122"/>
      <polygon points="160,18 184,32 184,58 160,72 136,58 136,32"/>
    </g>
    <!-- 紫粉长发 -->
    <path d="M68,85 Q160,30 252,85 Q288,195 265,335 L55,335 Q32,195 68,85 Z" fill="url(#hair-${shipId})" />
    <!-- 指挥官装甲披肩 -->
    <path d="M45,370 L82,252 L160,275 L238,252 L275,370 Z" fill="#1e1035" stroke="${primary}" stroke-width="3"/>
    <circle cx="160" cy="312" r="20" fill="${primary}" stroke="#fff" stroke-width="2.5"/>
    <!-- 脸部 -->
    <path d="M113,125 L113,195 Q113,234 160,250 Q207,234 207,195 L207,125 Z" fill="#fde8dd"/>
    <!-- 紫电双眸 -->
    <g class="pilot-eyes">
      <polygon points="122,171 148,168 146,184 124,184" fill="#2e1065"/>
      <polygon points="126,172 145,170 143,182 128,182" fill="#e879f9"/>
      <circle cx="134" cy="175" r="3" fill="#fff"/>
      <polygon points="198,171 172,168 174,184 196,184" fill="#2e1065"/>
      <polygon points="194,172 175,170 177,182 192,182" fill="#e879f9"/>
      <circle cx="182" cy="175" r="3" fill="#fff"/>
      <path d="M132,174 L82,142 L96,130 L42,102" stroke="${glow}" stroke-width="3.5" fill="none"/>
      <path d="M186,174 L238,142 L224,130 L278,102" stroke="${glow}" stroke-width="3.5" fill="none"/>
    </g>
    <path d="M148,215 Q160,232 172,215 Z" fill="#ec4899"/>
    <!-- 刘海与科技猫耳通讯器 -->
    <path d="M96,110 Q128,168 148,125 Q160,168 174,125 Q196,168 224,110 Q195,62 160,62 Q125,62 96,110 Z" fill="url(#hair-${shipId})"/>
    <polygon points="78,96 105,52 125,88" fill="#1e1b4b" stroke="${glow}" stroke-width="2.5"/>
    <polygon points="242,96 215,52 195,88" fill="#1e1b4b" stroke="${glow}" stroke-width="2.5"/>
  </svg>`;
}

/**
 * DNF 风格觉醒大招全屏斜切立绘特写控制器
 */
export class AwakeningCutinController {
  private el: HTMLElement;
  private hideTimer: number | null = null;

  constructor(el: HTMLElement) {
    this.el = el;
  }

  public trigger(shipId: ShipId, awakening: AwakeningType, tier: 1 | 2 | 3) {
    const ship = SHIPS.find((s) => s.id === shipId) || SHIPS[0];
    const awk = AWAKENINGS[awakening];
    const tierInfo = awk.tiers[tier - 1];
    const voiceLine = sound.voiceLang === 'jp' ? tierInfo.voiceLineJp : tierInfo.voiceLineCn;

    // 播放 DNF 觉醒铮鸣 + 语音台词 + 技能音效
    sound.playAwakeningCutin(awakening, tier, tierInfo.voiceLineCn, tierInfo.voiceLineJp, shipId);

    const portraitSvg = getPilotPortraitSvg(shipId, awakening, tier);

    this.el.style.setProperty('--awk-color', awk.color);
    this.el.style.setProperty('--awk-glow', awk.glowColor);
    this.el.style.setProperty('--awk-bg', awk.bgGradient);

    this.el.innerHTML = `
      <div class="dnf-cutin-overlay tier-${tier}">
        <div class="dnf-screen-flash"></div>
        <div class="dnf-speedlines"></div>
        <div class="dnf-slash-bar">
          <div class="dnf-portrait-box">
            <div class="dnf-magic-circle"></div>
            ${portraitSvg}
          </div>
          <div class="dnf-title-zone">
            <div class="dnf-pilot-tag">
              <span class="dnf-badge">${tierInfo.badge}</span>
              <span class="dnf-callsign">${ship.pilotName} · ${ship.pilotCallsign}</span>
            </div>
            <div class="dnf-skill-name" data-text="${tierInfo.skillTitle}">${tierInfo.skillTitle}</div>
            <div class="dnf-voice-bar">
              <span class="dnf-voice-wave"><i></i><i></i><i></i><i></i></span>
              <span class="dnf-voice-text">“${voiceLine}”</span>
            </div>
          </div>
        </div>
        <div class="dnf-lightning-border"></div>
      </div>
    `;

    this.el.hidden = false;
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
    }
    this.hideTimer = window.setTimeout(() => {
      this.el.hidden = true;
      this.el.innerHTML = '';
      this.hideTimer = null;
    }, 2050);
  }

  public clear() {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.el.hidden = true;
    this.el.innerHTML = '';
  }
}
