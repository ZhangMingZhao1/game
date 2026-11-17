import assert from 'node:assert/strict';
import { createWorld, stepWorld, type WorldState } from '../src/core/world';

const idle = {
  dx: 0,
  dy: 0,
  dragX: 0,
  dragY: 0,
  slow: false,
  firing: false,
  ultimate: false,
};

type StageWorld = WorldState & {
  miniBossSpawned?: boolean;
  miniBossDefeated?: boolean;
};

{
  const world = createWorld('raiden', 0) as StageWorld;
  assert.ok(world.waveDuration >= 90, '每关基础时长必须至少90秒');
  world.spawnCooldown = 999;
  world.transportCooldown = 999;
  world.waveTime = 59.9;
  stepWorld(world, 0.2, idle);
  assert.ok(
    world.enemies.some((enemy) => enemy.type === ('miniBoss' as never)),
    '普通关约60秒必须生成小Boss',
  );
}

{
  const world = createWorld('raiden', 0) as StageWorld;
  world.wave = 5;
  world.waveDuration = 90;
  world.waveTime = 59.9;
  world.spawnCooldown = 999;
  world.transportCooldown = 999;
  stepWorld(world, 0.2, idle);
  assert.equal(world.boss, null, '第5关不能跳过小Boss直接生成正式Boss');
  assert.ok(
    world.enemies.some((enemy) => enemy.type === ('miniBoss' as never)),
    '第5关也必须先生成小Boss',
  );

  world.enemies.length = 0;
  world.miniBossSpawned = true;
  world.miniBossDefeated = true;
  world.waveTime = 90;
  stepWorld(world, 1 / 60, idle);
  assert.equal(world.boss?.type, 'spider', '第5关小Boss击败后必须追加正式Boss');
}

console.log('stage-structure.test.ts: all assertions passed');
