import assert from 'node:assert/strict';
import {
  awardEnemyKill,
  beginScoreWave,
  collectScoreCrystal,
  completeScoreWave,
  createScoreState,
  decomposeCrystalValue,
  markWaveDamaged,
  missScoreCrystal,
} from '../src/core/scoring';

{
  const score = createScoreState();
  const award = awardEnemyKill(score, 'fighter');
  assert.equal(award.baseValue, 200);
  assert.equal(award.immediate, 50, '击杀立即获得敌机分值的25%');
  assert.equal(award.crystalValue, 150, '剩余75%必须由分数钻石承载');
  assert.equal(score.total, 50);
  assert.equal(score.killScore, 50);
  assert.equal(
    award.crystals.reduce((sum, crystal) => sum + crystal.value, 0),
    150,
    '钻石组合必须精确等于待收集分数',
  );
}

{
  const crystals = decomposeCrystalValue(13_675);
  assert.deepEqual(
    crystals.map((crystal) => crystal.value),
    [10_000, 2_000, 1_000, 500, 100, 50, 25],
    '优先使用高阶钻石，并用最少数量精确组合分值',
  );
}

{
  const score = createScoreState();
  beginScoreWave(score);
  awardEnemyKill(score, 'fighter');
  collectScoreCrystal(score, 150);
  const bonus = completeScoreWave(score, false);
  assert.equal(score.waveEarnedBeforeBonus, 200);
  assert.equal(bonus, 40, '普通波无伤奖励应为本波所得分数的20%');
  assert.equal(score.total, 240);
  assert.equal(score.noHitWaves, 1);
}

{
  const score = createScoreState();
  beginScoreWave(score);
  const award = awardEnemyKill(score, 'elite');
  collectScoreCrystal(score, award.crystalValue);
  markWaveDamaged(score);
  const bonus = completeScoreWave(score, false);
  assert.equal(bonus, 0, '受到实际伤害后本波不应获得无伤奖励');
  assert.equal(score.noHitEligible, false);
}

{
  const score = createScoreState();
  beginScoreWave(score);
  const award = awardEnemyKill(score, 'elite');
  collectScoreCrystal(score, award.crystalValue);
  const bonus = completeScoreWave(score, true);
  assert.equal(bonus, Math.floor(award.baseValue * 0.3), 'Boss波无伤奖励应为本波所得分数的30%');
}

{
  const score = createScoreState();
  const award = awardEnemyKill(score, 'bomber');
  missScoreCrystal(score, award.crystalValue);
  assert.equal(score.missedCrystalScore, award.crystalValue);
  assert.equal(score.total, award.immediate, '漏掉钻石不能扣除已经获得的击杀基础分');
}

console.log('scoring.test.ts: all assertions passed');
