import assert from 'node:assert/strict';
import {
  createWorld,
  stepWorld,
  type EnemyState,
  type EnemyType,
  type ShotState,
} from '../src/core/world';

function destroyEnemy(type: EnemyType) {
  const world = createWorld('raiden', 0);
  world.spawnCooldown = 999;
  world.transportCooldown = 999;

  const enemy: EnemyState = {
    id: 9001,
    type,
    x: 240,
    y: 220,
    radius: 16,
    width: 32,
    height: 32,
    hp: 1,
    maxHp: 1,
    armor: 0,
    speed: 0,
    age: 0,
    fireCooldown: 999,
    patternTime: 0,
    phase: 1,
    vx: 0,
    vy: 0,
    elite: false,
    dead: false,
    frozen: 0,
    value: type === 'transport' ? 18 : 5,
  };
  const shot: ShotState = {
    id: 9002,
    owner: 'player',
    kind: 'bullet',
    x: 240,
    y: 220,
    radius: 20,
    width: 20,
    height: 20,
    vx: 0,
    vy: 0,
    damage: 999,
    age: 0,
    life: 2,
    color: '#fff',
    piercing: 0,
    homing: 0,
    critical: false,
    grazed: false,
  };

  world.enemies.push(enemy);
  world.playerShots.push(shot);
  stepWorld(world, 1 / 60, {
    dx: 0,
    dy: 0,
    dragX: 0,
    dragY: 0,
    slow: false,
    firing: false,
    ultimate: false,
  });
  return { world, enemy };
}

{
  const { world, enemy } = destroyEnemy('fighter');
  const scrap = world.pickups.filter((pickup) => pickup.kind === 'scrap');
  assert.ok(scrap.length > 0, '击毁普通敌机必须掉落废料');
  assert.ok(
    scrap.every((pickup) => pickup.sourceEnemyId === enemy.id),
    '每块废料必须记录其来源敌机，而不是作为无来源的随机刷新物',
  );
}

{
  const { world, enemy } = destroyEnemy('transport');
  assert.ok(
    world.pickups.some((pickup) => pickup.kind === 'capsule' && pickup.sourceEnemyId === enemy.id),
    '运输机必须从机体位置掉落强化胶囊',
  );
  assert.ok(
    world.pickups.some((pickup) => pickup.kind === 'scrap' && pickup.sourceEnemyId === enemy.id),
    '运输机除强化胶囊外也必须从机体位置掉落废料',
  );
}

console.log('scrap-drops.test.ts: all assertions passed');
