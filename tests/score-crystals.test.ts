import assert from 'node:assert/strict';
import {
  createWorld,
  stepWorld,
  type EnemyState,
  type ShotState,
  type WorldState,
} from '../src/core/world';

const idle = {
  dx: 0,
  dy: 0,
  dragX: 0,
  dragY: 0,
  slow: false,
  firing: false,
  ultimate: false,
};

function scoreState(world: WorldState) {
  return (world as WorldState & {
    score: {
      total: number;
      killScore: number;
      crystalScore: number;
      missedCrystalScore: number;
      noHitEligible: boolean;
      lastWaveBonus: number;
    };
  }).score;
}

function addKillableFighter(world: WorldState) {
  const enemy: EnemyState = {
    id: 7001,
    type: 'fighter',
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
    value: 5,
  };
  const shot: ShotState = {
    id: 7002,
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
}

{
  const world = createWorld('raiden', 0);
  world.spawnCooldown = 999;
  world.transportCooldown = 999;
  addKillableFighter(world);
  stepWorld(world, 1 / 60, idle);

  assert.equal(scoreState(world).killScore, 50, '击毁战斗机必须立即获得25%基础分');
  const crystals = world.pickups.filter((pickup) => pickup.kind === 'score');
  assert.equal(
    crystals.reduce((sum, pickup) => sum + (pickup.scoreValue ?? 0), 0),
    150,
    '战斗机剩余75%分值必须从残骸生成分数钻石',
  );
  assert.ok(crystals.every((pickup) => pickup.sourceEnemyId === 7001));
}

{
  const world = createWorld('raiden', 0);
  world.spawnCooldown = 999;
  world.transportCooldown = 999;
  addKillableFighter(world);
  stepWorld(world, 1 / 60, idle);
  const crystals = world.pickups.filter((pickup) => pickup.kind === 'score');
  for (const crystal of crystals) {
    crystal.x = world.player.x;
    crystal.y = world.player.y;
    crystal.age = 0.3;
  }
  stepWorld(world, 1 / 60, idle);
  assert.equal(scoreState(world).total, 200);
  assert.equal(scoreState(world).crystalScore, 150);
}

{
  const world = createWorld('raiden', 0);
  world.player.stats.dodge = 0;
  const hostile: ShotState = {
    id: 8001,
    owner: 'enemy',
    kind: 'bullet',
    x: world.player.x,
    y: world.player.y,
    radius: 8,
    width: 8,
    height: 8,
    vx: 0,
    vy: 0,
    damage: 10,
    age: 0,
    life: 1,
    color: '#f00',
    piercing: 0,
    homing: 0,
    critical: false,
    grazed: false,
  };
  world.player.invulnerable = 0;
  world.enemyShots.push(hostile);
  stepWorld(world, 1 / 60, idle);
  assert.equal(scoreState(world).noHitEligible, false, '受到实际伤害必须取消本波无伤资格');
}

console.log('score-crystals.test.ts: all assertions passed');
