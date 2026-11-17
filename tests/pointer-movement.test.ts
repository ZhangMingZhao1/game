import assert from 'node:assert/strict';
import { createWorld, stepWorld } from '../src/core/world';

const dragInput = (dragX: number, slow = false) => ({
  dx: 0,
  dy: 0,
  dragX,
  dragY: 0,
  slow,
  firing: false,
  ultimate: false,
});

{
  const world = createWorld('raiden', 0, 480);
  const startX = world.player.x;
  stepWorld(world, 0.25, dragInput(1_000));
  const travel = world.player.x - startX;
  assert.ok(
    travel >= 28 && travel <= 29,
    `大幅拖拽也不能超过键盘最大速度，0.25秒实际移动${travel}`,
  );
}

{
  const oneFrame = createWorld('raiden', 0, 480);
  const twoFrames = createWorld('raiden', 0, 480);
  stepWorld(oneFrame, 1 / 30, dragInput(6));
  stepWorld(twoFrames, 1 / 60, dragInput(3));
  stepWorld(twoFrames, 1 / 60, dragInput(3));
  assert.ok(
    Math.abs(oneFrame.player.x - twoFrames.player.x) < 0.001,
    '同样的总拖拽距离不能因30帧或60帧模拟而产生不同位移',
  );
}

{
  const normal = createWorld('raiden', 0, 480);
  const slow = createWorld('raiden', 0, 480);
  const normalStartX = normal.player.x;
  const slowStartX = slow.player.x;
  stepWorld(normal, 0.25, dragInput(1_000));
  stepWorld(slow, 0.25, dragInput(1_000, true));
  const normalTravel = normal.player.x - normalStartX;
  const slowTravel = slow.player.x - slowStartX;
  assert.ok(
    Math.abs(slowTravel / normalTravel - 0.45) < 0.01,
    '按住Shift拖拽时也必须使用45%低速移动',
  );
}

console.log('pointer-movement.test.ts: all assertions passed');
