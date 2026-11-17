import assert from 'node:assert/strict';
import * as World from '../src/core/world';

const moveRight = {
  dx: 1,
  dy: 0,
  dragX: 0,
  dragY: 0,
  slow: false,
  firing: false,
  ultimate: false,
};

{
  const world = World.createWorld('raiden', 0, 480);
  const startX = world.player.x;
  World.stepWorld(world, 0.25, moveRight);
  const travel = world.player.x - startX;
  assert.ok(
    travel >= 28 && travel <= 29,
    `赤曜强袭形态初始0.25秒应移动约28.35单位，实际为${travel}`,
  );

  World.applyStatMods(world, { speedPct: 15 });
  const upgradedStartX = world.player.x;
  World.stepWorld(world, 0.25, moveRight);
  const upgradedTravel = world.player.x - upgradedStartX;
  assert.ok(upgradedTravel >= 32, '一次速度强化后必须能明显感知机动提升');
}

interface WavePressure {
  spawnInterval: number;
  groupChance: number;
  maxGroupSize: number;
  fireRateMult: number;
  bulletSpeedMult: number;
  initialFireDelayMax: number;
}

const api = World as typeof World & {
  wavePressureFor?: (wave: number) => WavePressure;
};

assert.equal(typeof api.wavePressureFor, 'function', '核心层必须集中定义逐关压力曲线');
const wave1 = api.wavePressureFor?.(1) as WavePressure;
const wave2 = api.wavePressureFor?.(2) as WavePressure;
const wave3 = api.wavePressureFor?.(3) as WavePressure;

assert.deepEqual(wave1, {
  spawnInterval: 1.42,
  groupChance: 0.35,
  maxGroupSize: 2,
  fireRateMult: 1.08,
  bulletSpeedMult: 1.04,
  initialFireDelayMax: 0.9,
});
assert.equal(wave2.maxGroupSize, 3, '第二关开始必须允许三机编队');
assert.ok(wave2.groupChance > wave1.groupChance, '第二关编队密度必须高于第一关');
assert.ok(wave3.spawnInterval < wave2.spawnInterval, '第三关刷怪间隔必须继续缩短');
assert.ok(wave3.fireRateMult > wave2.fireRateMult, '第三关敌机持续射击频率必须继续提升');
assert.ok(wave3.bulletSpeedMult > wave2.bulletSpeedMult, '第三关敌弹速度必须继续提升');
assert.ok(wave3.initialFireDelayMax < wave2.initialFireDelayMax, '后续关卡敌机必须更快开始射击');

console.log('difficulty-curve.test.ts: all assertions passed');
