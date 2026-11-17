import { AwakeningType } from '../data/config';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private bgmMode: 'none' | 'menu' | 'battle' | 'boss' | 'shop' = 'none';

  public musicVol = 0.55;
  public sfxVol = 0.8;
  public voiceVol = 0.95;
  public voiceLang: 'cn' | 'jp' = 'cn';

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.masterGain.gain.value = 0.85;
      this.sfxGain.gain.value = this.sfxVol;
      this.musicGain.gain.value = this.musicVol * 0.45;

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public updateVolumes(music: number, sfx: number, voice: number, voiceLang: 'cn' | 'jp') {
    this.musicVol = Math.max(0, Math.min(1, music));
    this.sfxVol = Math.max(0, Math.min(1, sfx));
    this.voiceVol = Math.max(0, Math.min(1, voice));
    this.voiceLang = voiceLang;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVol * 0.45, this.ctx.currentTime, 0.04);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVol, this.ctx.currentTime, 0.04);
    }
  }

  private playTone(
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    vol = 0.2,
    delay = 0,
    target: 'sfx' | 'music' = 'sfx'
  ) {
    if (!this.ctx || !this.sfxGain || !this.musicGain) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, f0), t0);
    if (f1 !== f0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.015, dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g);
    g.connect(target === 'sfx' ? this.sfxGain : this.musicGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.01);
  }

  private playNoise(dur: number, vol = 0.25, cutoff = 1200, delay = 0) {
    if (!this.ctx || !this.sfxGain) return;
    const t0 = this.ctx.currentTime + delay;
    const sampleRate = this.ctx.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, t0);
    filter.frequency.exponentialRampToValueAtTime(140, t0 + dur);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start(t0);
    src.stop(t0 + dur);
  }

  public playShoot(gun: 'vulcan' | 'laser' | 'arc', level: number) {
    this.init();
    const lvBoost = Math.min(level * 18, 120);
    if (gun === 'vulcan') {
      this.playTone('triangle', 520 + lvBoost, 160, 0.055, 0.07);
    } else if (gun === 'laser') {
      this.playTone('sawtooth', 980 + lvBoost, 340, 0.065, 0.065);
    } else {
      this.playTone('square', 740 + lvBoost, 1180, 0.05, 0.06);
    }
  }

  public playSubLaunch() {
    this.init();
    this.playTone('sawtooth', 320, 680, 0.09, 0.08);
  }

  public playHit(crit = false) {
    this.init();
    if (crit) {
      this.playTone('square', 920, 1480, 0.06, 0.11);
    } else {
      this.playTone('triangle', 260, 110, 0.045, 0.07);
    }
  }

  public playExplosion(size: 'small' | 'large' | 'boss') {
    this.init();
    if (size === 'small') {
      this.playNoise(0.18, 0.18, 950);
      this.playTone('sawtooth', 140, 42, 0.16, 0.14);
    } else if (size === 'large') {
      this.playNoise(0.38, 0.32, 1400);
      this.playTone('sawtooth', 110, 28, 0.36, 0.24);
    } else {
      this.playNoise(0.95, 0.55, 2200);
      this.playTone('sawtooth', 95, 22, 0.85, 0.38);
      this.playTone('square', 220, 45, 0.7, 0.25, 0.12);
    }
  }

  /**
   * 拾取局内掉落胶囊音效（主弹M / 副弹S / 觉醒切换与升阶A）
   */
  public playCapsulePickup(kind: 'main' | 'sub' | 'awakening_switch' | 'awakening_tier' | 'scrap' | 'heal') {
    this.init();
    if (kind === 'scrap') {
      this.playTone('sine', 780, 1160, 0.06, 0.07);
      return;
    }
    if (kind === 'heal') {
      this.playTone('triangle', 523.25, 659.25, 0.1, 0.16);
      this.playTone('triangle', 659.25, 1046.5, 0.16, 0.18, 0.08);
      return;
    }
    if (kind === 'main') {
      // 激昂红色主炮升阶音阶
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => this.playTone('square', f, f * 1.05, 0.09, 0.16, i * 0.055));
    } else if (kind === 'sub') {
      // 科技翠绿副弹强化音阶
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((f, i) => this.playTone('triangle', f, f * 1.02, 0.08, 0.16, i * 0.048));
    } else if (kind === 'awakening_switch') {
      // 觉醒类型切换清脆折跃音
      this.playTone('sine', 587.33, 1174.66, 0.14, 0.22);
      this.playTone('sawtooth', 880, 1760, 0.18, 0.15, 0.06);
    } else if (kind === 'awakening_tier') {
      // 觉醒阶位突破（一觉->二觉->真觉）史诗和弦
      const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
      chord.forEach((f, i) => this.playTone('sawtooth', f, f * 1.02, 0.22, 0.18, i * 0.045));
    }
  }

  public playScorePickup(value: number) {
    this.init();
    const tier = value >= 10_000 ? 5 : value >= 2_000 ? 4 : value >= 500 ? 3 : value >= 100 ? 2 : value >= 50 ? 1 : 0;
    const start = 660 + tier * 95;
    this.playTone('sine', start, start * 1.45, 0.07 + tier * 0.008, 0.07);
    if (tier >= 3) this.playTone('triangle', start * 1.5, start * 2, 0.11, 0.05, 0.035);
  }

  public playBossWarning() {
    this.init();
    for (let i = 0; i < 3; i++) {
      this.playTone('sawtooth', 440, 880, 0.26, 0.22, i * 0.35);
      this.playTone('square', 220, 440, 0.26, 0.18, i * 0.35);
    }
  }

  public playSynthesize() {
    this.init();
    const notes = [587.33, 739.99, 880, 1174.66, 1479.98];
    notes.forEach((f, i) => this.playTone('triangle', f, f, 0.14, 0.2, i * 0.055));
  }

  /**
   * DNF 风格觉醒大招专属演出音效 + 驾驶员觉醒台词语音播报
   */
  public playAwakeningCutin(
    type: AwakeningType,
    tier: 1 | 2 | 3,
    voiceCn: string,
    voiceJp: string,
    pilotId: string
  ) {
    this.init();

    // 1. DNF 觉醒标志性“拔刀/碎镜金属闪光铮鸣 (Metallic Flash Chime)”
    const chimeFreqs = [1760, 2217.46, 2637.02, 3520, 4434.92];
    chimeFreqs.forEach((f, idx) => {
      this.playTone('sine', f, f * 0.98, 0.45, 0.16, idx * 0.02);
      this.playTone('triangle', f * 0.5, f, 0.25, 0.14, idx * 0.025);
    });

    // 2. 时停重低音冲击波 (Sub-Bass Time-Stop Drop)
    this.playTone('sine', 180, 28, 0.65, 0.45, 0.02);
    this.playTone('sawtooth', 120, 32, 0.55, 0.28, 0.04);
    this.playNoise(0.35, 0.32, 3200, 0.02);

    // 3. 0.55秒后大招正式爆发的主音效（按三系大招区分）
    const burstDelay = 0.52;
    if (type === 'crimson') {
      // 赤红·天穹歼灭炮：重型粒子洪流咆哮
      this.playNoise(1.4, 0.48, 2600, burstDelay);
      this.playTone('sawtooth', 95, 55, 1.5, 0.36, burstDelay);
      this.playTone('square', 380, 140, 1.2, 0.24, burstDelay + 0.05);
      if (tier === 3) {
        this.playTone('sawtooth', 640, 80, 0.9, 0.35, burstDelay + 0.6);
      }
    } else if (type === 'azure') {
      // 苍蓝·零度次元斩：冰晶冻结 + 高速连环刀鸣
      this.playTone('sine', 2400, 420, 0.45, 0.3, burstDelay);
      const slashCount = tier === 3 ? 12 : tier === 2 ? 9 : 6;
      for (let i = 0; i < slashCount; i++) {
        const d = burstDelay + 0.12 + i * 0.12;
        this.playTone('sawtooth', 1900 + (i % 3) * 350, 320, 0.08, 0.2, d);
        this.playNoise(0.06, 0.18, 4200, d);
      }
    } else {
      // 紫电·万雷神罚阵列：连环雷暴轰鸣
      for (let i = 0; i < 5 + tier * 2; i++) {
        const d = burstDelay + i * 0.16;
        this.playNoise(0.22, 0.3, 3500, d);
        this.playTone('square', 880 - (i % 3) * 140, 90, 0.2, 0.24, d);
      }
    }

    // 4. 驾驶员觉醒语音播报（优先尝试外部音频文件，自动回退 Web Speech API + 合成器无线电共鸣）
    this.speakAwakeningVoice(this.voiceLang === 'jp' ? voiceJp : voiceCn, this.voiceLang, pilotId);
  }

  private speakAwakeningVoice(text: string, lang: 'cn' | 'jp', pilotId: string) {
    if (this.voiceVol <= 0.01) return;

    // 合成器辅助“战术通讯人声共振泛音”，确保在任何未安装语音包的环境下也有酷炫的无线电声效
    const pitchBase = pilotId === 'falcon' ? 620 : pilotId === 'wasp' ? 720 : 560;
    for (let i = 0; i < 6; i++) {
      this.playTone(
        'triangle',
        pitchBase + ((i * 83) % 240),
        pitchBase + 60,
        0.07,
        0.08 * this.voiceVol,
        0.08 + i * 0.07
      );
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === 'jp' ? 'ja-JP' : 'zh-CN';
      utter.volume = this.voiceVol;
      // 根据驾驶员性格调校语速与音高
      if (pilotId === 'falcon') {
        utter.pitch = 1.08;
        utter.rate = 1.18;
      } else if (pilotId === 'wasp') {
        utter.pitch = 1.28;
        utter.rate = 1.22;
      } else {
        utter.pitch = 1.16;
        utter.rate = 1.15;
      }

      const voices = synth.getVoices();
      const targetPrefix = lang === 'jp' ? 'ja' : 'zh';
      const preferred =
        voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(targetPrefix) &&
            (v.name.includes('Xiaoxiao') ||
              v.name.includes('Yunxi') ||
              v.name.includes('Nanami') ||
              v.name.includes('Google') ||
              v.name.includes('Microsoft'))
        ) || voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
      if (preferred) {
        utter.voice = preferred;
      }
      synth.speak(utter);
    } catch {
      // Ignore speech synthesis errors on restricted platforms
    }
  }

  public setBgmMode(mode: 'none' | 'menu' | 'battle' | 'boss' | 'shop') {
    if (this.bgmMode === mode) return;
    this.bgmMode = mode;
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (mode === 'none') return;

    const tempoMs = mode === 'boss' ? 125 : mode === 'battle' ? 145 : 190;
    this.bgmStep = 0;
    this.bgmTimer = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || this.musicVol <= 0.01) return;
      this.tickBgm(this.bgmStep++);
    }, tempoMs);
  }

  private tickBgm(step: number) {
    if (this.bgmMode === 'battle') {
      const bassLine = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
      const leadLine = [440, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25];
      const bass = bassLine[step % bassLine.length];
      this.playTone('sawtooth', bass, bass * 0.99, 0.12, 0.16, 0, 'music');
      const lead = leadLine[(step >> 1) % leadLine.length];
      if (lead > 0 && step % 2 === 0) {
        this.playTone('square', lead, lead * 1.01, 0.18, 0.09, 0, 'music');
      }
    } else if (this.bgmMode === 'boss') {
      const bassLine = [98, 98, 116.54, 98, 130.81, 123.47, 116.54, 110];
      const leadLine = [392, 466.16, 523.25, 587.33, 622.25, 587.33, 523.25, 466.16];
      const bass = bassLine[step % bassLine.length];
      this.playTone('sawtooth', bass, bass, 0.11, 0.2, 0, 'music');
      if (step % 2 === 0) {
        const lead = leadLine[(step >> 1) % leadLine.length];
        this.playTone('square', lead, lead * 1.02, 0.15, 0.12, 0, 'music');
      }
    } else if (this.bgmMode === 'shop' || this.bgmMode === 'menu') {
      const arp = [261.63, 329.63, 392.0, 493.88, 523.25, 493.88, 392.0, 329.63];
      const note = arp[step % arp.length];
      this.playTone('triangle', note, note, 0.16, 0.1, 0, 'music');
    }
  }
}

export const sound = new SoundEngine();
