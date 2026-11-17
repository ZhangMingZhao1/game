import type { BossType, EnemyType } from './world';

export type ScoreCrystalGrade = 'white' | 'cyan' | 'blue' | 'purple' | 'gold' | 'rainbow';

export interface ScoreCrystalAward {
  grade: ScoreCrystalGrade;
  value: number;
}

export interface KillScoreAward {
  baseValue: number;
  immediate: number;
  crystalValue: number;
  crystals: ScoreCrystalAward[];
}

export interface ScoreState {
  total: number;
  killScore: number;
  crystalScore: number;
  missedCrystalScore: number;
  noHitBonus: number;
  noHitWaves: number;
  noHitEligible: boolean;
  waveStartTotal: number;
  waveEarnedBeforeBonus: number;
  lastWaveBonus: number;
}

const ENEMY_SCORE: Record<EnemyType, number> = {
  drone: 100,
  fighter: 200,
  heli: 350,
  tank: 600,
  turret: 350,
  bomber: 600,
  transport: 800,
  elite: 1_500,
  miniBoss: 5_000,
};

const BOSS_SCORE: Record<BossType, number> = {
  spider: 30_000,
  valkyrie: 80_000,
};

const CRYSTAL_DENOMINATIONS: ScoreCrystalAward[] = [
  { grade: 'rainbow', value: 10_000 },
  { grade: 'gold', value: 2_000 },
  { grade: 'gold', value: 1_000 },
  { grade: 'purple', value: 500 },
  { grade: 'blue', value: 100 },
  { grade: 'cyan', value: 50 },
  { grade: 'white', value: 25 },
];

export function createScoreState(): ScoreState {
  return {
    total: 0,
    killScore: 0,
    crystalScore: 0,
    missedCrystalScore: 0,
    noHitBonus: 0,
    noHitWaves: 0,
    noHitEligible: true,
    waveStartTotal: 0,
    waveEarnedBeforeBonus: 0,
    lastWaveBonus: 0,
  };
}

export function enemyScoreValue(enemy: EnemyType, boss?: BossType): number {
  return boss ? BOSS_SCORE[boss] : ENEMY_SCORE[enemy];
}

export function decomposeCrystalValue(total: number): ScoreCrystalAward[] {
  let remaining = Math.max(0, Math.floor(total / 25) * 25);
  const crystals: ScoreCrystalAward[] = [];
  for (const denomination of CRYSTAL_DENOMINATIONS) {
    while (remaining >= denomination.value) {
      crystals.push({ ...denomination });
      remaining -= denomination.value;
    }
  }
  return crystals;
}

export function awardEnemyKill(
  score: ScoreState,
  enemy: EnemyType,
  boss?: BossType,
): KillScoreAward {
  const baseValue = enemyScoreValue(enemy, boss);
  const immediate = Math.floor(baseValue * 0.25);
  const crystalValue = baseValue - immediate;
  score.total += immediate;
  score.killScore += immediate;
  return {
    baseValue,
    immediate,
    crystalValue,
    crystals: decomposeCrystalValue(crystalValue),
  };
}

export function collectScoreCrystal(score: ScoreState, value: number): void {
  const safeValue = Math.max(0, Math.floor(value));
  score.total += safeValue;
  score.crystalScore += safeValue;
}

export function missScoreCrystal(score: ScoreState, value: number): void {
  score.missedCrystalScore += Math.max(0, Math.floor(value));
}

export function beginScoreWave(score: ScoreState): void {
  score.waveStartTotal = score.total;
  score.waveEarnedBeforeBonus = 0;
  score.lastWaveBonus = 0;
  score.noHitEligible = true;
}

export function markWaveDamaged(score: ScoreState): void {
  score.noHitEligible = false;
}

export function completeScoreWave(score: ScoreState, isBossWave: boolean): number {
  const earned = Math.max(0, score.total - score.waveStartTotal);
  score.waveEarnedBeforeBonus = earned;
  const bonus = score.noHitEligible ? Math.floor(earned * (isBossWave ? 0.3 : 0.2)) : 0;
  score.lastWaveBonus = bonus;
  score.total += bonus;
  score.noHitBonus += bonus;
  if (score.noHitEligible) score.noHitWaves += 1;
  return bonus;
}
