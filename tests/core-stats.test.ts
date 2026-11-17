import assert from 'node:assert/strict';
import { LEVEL_UP_OPTIONS } from '../src/data/config';
import {
  activateAwakening,
  applyStatMods,
  createWorld,
  stepWorld,
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

{
  const world = createWorld('raiden', 0, 480);
  const startX = world.player.x;
  stepWorld(world, 0.25, { ...idle, dx: 1 });
  const travel = world.player.x - startX;
  assert.ok(travel < 50, `初始战机0.25秒移动距离应低于50，实际为${travel}`);
}

{
  const world = createWorld('raiden', 0);
  const player = world.player as WorldState['player'] & { stats: WorldState['player']['stats'] & { mana?: number } };
  assert.equal(player.stats.mana, 100, '战机基础魔力必须为100');
  applyStatMods(world, { mana: 100 } as Parameters<typeof applyStatMods>[1]);
  assert.equal(player.stats.mana, 200, '魔力扩容强化必须提高大招能量上限');
  player.awakeningCharge = 200;
  assert.equal(activateAwakening(world), true);
  assert.equal(player.awakeningCharge, 100, '释放大招只应消耗100点能量');
  world.ultimate = null;
  assert.equal(activateAwakening(world), true, '200魔力充满后应能连续释放两次大招');
  assert.equal(player.awakeningCharge, 0);
}

function addPlayerHit(world: WorldState, id: number): void {
  const shot: ShotState = {
    id,
    owner: 'enemy',
    kind: 'bullet',
    x: world.player.x,
    y: world.player.y,
    radius: 8,
    width: 8,
    height: 8,
    vx: 0,
    vy: 0,
    damage: 20,
    age: 0,
    life: 1,
    color: '#f00',
    piercing: 0,
    homing: 0,
    critical: false,
    grazed: false,
  };
  world.enemyShots.push(shot);
}

{
  const unarmored = createWorld('falcon', 0);
  const armored = createWorld('falcon', 0);
  unarmored.player.stats.dodge = 0;
  armored.player.stats.dodge = 0;
  applyStatMods(armored, { armor: 4 });
  unarmored.player.invulnerable = 0;
  armored.player.invulnerable = 0;
  addPlayerHit(unarmored, 9001);
  addPlayerHit(armored, 9002);
  stepWorld(unarmored, 1 / 60, idle);
  stepWorld(armored, 1 / 60, idle);
  assert.ok(
    armored.stats.damageTaken < unarmored.stats.damageTaken,
    '护甲强化必须降低实际受到的伤害',
  );
}

assert.ok(LEVEL_UP_OPTIONS.some((option) => option.id === 'lu_speed'), '随机强化池必须有独立速度强化');
assert.ok(LEVEL_UP_OPTIONS.some((option) => option.id === 'lu_armor'), '随机强化池必须有独立护甲强化');
assert.ok(LEVEL_UP_OPTIONS.some((option) => option.id === 'lu_mana'), '随机强化池必须有魔力扩容强化');

console.log('core-stats.test.ts: all assertions passed');
