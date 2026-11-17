import assert from 'node:assert/strict';
import * as World from '../src/core/world';

type PlayerForm = 'assault' | 'flight' | 'sniper' | 'split' | 'cruise' | 'fortress';

interface TransformPlayer {
  form: PlayerForm;
  transformCooldown: number;
  transformTimer: number;
  hiveShield: number;
  hiveShieldCooldown: number;
}

const api = World as typeof World & {
  toggleTransformation?: (world: World.WorldState) => boolean;
};

assert.equal(typeof api.toggleTransformation, 'function', '核心层必须提供机甲形态切换能力');
const toggleTransformation = api.toggleTransformation as (world: World.WorldState) => boolean;

const idle = {
  dx: 0,
  dy: 0,
  dragX: 0,
  dragY: 0,
  slow: false,
  firing: false,
  ultimate: false,
  transform: false,
};

function transformPlayer(world: World.WorldState): World.PlayerState & TransformPlayer {
  return world.player as World.PlayerState & TransformPlayer;
}

function advance(world: World.WorldState, seconds: number): void {
  for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) {
    World.stepWorld(world, 1 / 60, idle);
  }
}

function fireOnce(world: World.WorldState): World.ShotState[] {
  World.stepWorld(world, 1 / 60, { ...idle, firing: true });
  return world.playerShots;
}

{
  const raiden = World.createWorld('raiden', 0, 480);
  const player = transformPlayer(raiden);
  assert.equal(player.form, 'assault');
  assert.equal(player.radius, 11, '赤曜强袭机甲模式应使用较大的命中框');
  assert.equal(toggleTransformation(raiden), true);
  assert.equal(player.form, 'flight');
  assert.equal(player.radius, 7, '赤曜飞翼模式必须缩小命中框');
  assert.equal(toggleTransformation(raiden), false, '一秒冷却内不能反复切换形态');
  advance(raiden, 1.05);
  assert.equal(toggleTransformation(raiden), true);
  assert.equal(player.form, 'assault');
}

{
  const falcon = World.createWorld('falcon', 0, 480);
  assert.equal(transformPlayer(falcon).form, 'sniper');
  toggleTransformation(falcon);
  assert.equal(transformPlayer(falcon).form, 'split');

  const wasp = World.createWorld('wasp', 0, 480);
  assert.equal(transformPlayer(wasp).form, 'cruise');
  toggleTransformation(wasp);
  assert.equal(transformPlayer(wasp).form, 'fortress');
  assert.equal(wasp.player.radius, 12);
}

{
  const assault = World.createWorld('raiden', 0, 480);
  const flight = World.createWorld('raiden', 0, 480);
  toggleTransformation(flight);
  const assaultShots = fireOnce(assault);
  const flightShots = fireOnce(flight);
  assert.equal(assaultShots.filter((shot) => shot.kind === 'bullet').length, 2);
  assert.equal(assaultShots.filter((shot) => shot.kind === 'missile').length, 4);
  assert.equal(flightShots.filter((shot) => shot.kind === 'bullet').length, 1);
  assert.equal(flightShots.filter((shot) => shot.kind === 'missile').length, 1);
}

{
  const sniper = World.createWorld('falcon', 0, 480);
  const split = World.createWorld('falcon', 0, 480);
  toggleTransformation(split);
  assert.equal(fireOnce(sniper).filter((shot) => shot.kind === 'laser').length, 1);
  assert.equal(fireOnce(split).filter((shot) => shot.kind === 'laser').length, 3);
}

{
  const cruise = World.createWorld('wasp', 0, 480);
  const fortress = World.createWorld('wasp', 0, 480);
  toggleTransformation(fortress);
  const cruiseShots = fireOnce(cruise);
  const fortressShots = fireOnce(fortress);
  const cruiseDrone = cruiseShots.find((shot) => shot.kind === 'drone');
  const fortressDrone = fortressShots.find((shot) => shot.kind === 'drone');
  assert.ok(cruiseDrone && fortressDrone);
  assert.ok(
    fortressDrone.damage >= cruiseDrone.damage * 1.44,
    '蜂巢要塞的副武器伤害必须提高45%',
  );
  assert.ok(
    (fortressShots.find((shot) => shot.kind === 'arc')?.piercing ?? 0)
      > (cruiseShots.find((shot) => shot.kind === 'arc')?.piercing ?? 0),
    '蜂巢要塞的电弧必须额外跳跃一次',
  );
}

{
  const fortress = World.createWorld('wasp', 0, 480);
  toggleTransformation(fortress);
  const player = transformPlayer(fortress);
  player.hiveShieldCooldown = 0;
  advance(fortress, 1 / 60);
  assert.equal(player.hiveShield, 1, '蜂巢要塞必须周期性生成一层护盾');
  player.invulnerable = 0;
  const hpBefore = player.hp;
  fortress.enemyShots.push({
    id: 9999,
    owner: 'enemy',
    kind: 'bullet',
    x: player.x,
    y: player.y,
    radius: 6,
    width: 12,
    height: 12,
    vx: 0,
    vy: 0,
    damage: 99,
    age: 0,
    life: 1,
    color: '#f00',
    piercing: 0,
    homing: 0,
    critical: false,
    grazed: false,
  });
  World.stepWorld(fortress, 1 / 60, idle);
  assert.equal(player.hp, hpBefore, '蜂巢护盾必须抵消一次敌弹');
  assert.equal(player.hiveShield, 0);
}

console.log('transformation.test.ts: all assertions passed');
