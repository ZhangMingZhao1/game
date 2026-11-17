import assert from 'node:assert/strict';
import * as World from '../src/core/world';
import * as Renderer from '../src/render/renderer';

const api = World as typeof World & {
  responsiveFieldWidth?: (viewportWidth: number, viewportHeight: number) => number;
  resizeWorldField?: (world: World.WorldState, width: number) => void;
};

assert.equal(
  typeof api.responsiveFieldWidth,
  'function',
  '核心层必须提供统一的宽屏/窄屏战场尺寸判定',
);

assert.equal(api.responsiveFieldWidth?.(1920, 1080), 1280, '桌面宽屏应使用1280×720战场');
assert.equal(api.responsiveFieldWidth?.(1024, 641), 1280, '常见横向浏览器窗口应使用宽屏战场');
assert.equal(api.responsiveFieldWidth?.(390, 844), 480, '手机竖屏应保留480×720战场');

const wideWorld = (World.createWorld as unknown as (
  ship: 'raiden',
  danger: number,
  fieldWidth: number,
) => World.WorldState)('raiden', 0, 1280);
const wideState = wideWorld as World.WorldState & { fieldWidth?: number; fieldHeight?: number };
assert.equal(wideState.fieldWidth, 1280, '世界模拟必须记录宽屏战场边界');
assert.equal(wideState.fieldHeight, 720);
assert.equal(wideWorld.player.x, 640, '玩家必须出生在宽屏战场中央');

const narrowWorld = World.createWorld('raiden', 0);
narrowWorld.player.x = 360;
assert.equal(typeof api.resizeWorldField, 'function', '窗口尺寸切换时必须能安全重排现有世界坐标');
api.resizeWorldField?.(narrowWorld, 1280);
assert.equal(narrowWorld.fieldWidth, 1280);
assert.equal(narrowWorld.player.x, 960, '切换到宽屏时实体横坐标应按比例迁移');

const rendererApi = Renderer as typeof Renderer & {
  computeFieldViewport?: (
    cssWidth: number,
    cssHeight: number,
    logicalWidth: number,
    logicalHeight: number,
  ) => { scale: number; x: number; y: number; width: number; height: number };
};
assert.equal(typeof rendererApi.computeFieldViewport, 'function', '渲染器必须按动态逻辑尺寸计算显示区域');
assert.deepEqual(rendererApi.computeFieldViewport?.(1920, 1080, 1280, 720), {
  scale: 1.5,
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
});

const moveRight = {
  dx: 1,
  dy: 0,
  dragX: 0,
  dragY: 0,
  slow: false,
  firing: false,
  ultimate: false,
};
const narrowMovementWorld = World.createWorld('raiden', 0, 480);
const wideMovementWorld = World.createWorld('raiden', 0, 1280);
const narrowStartX = narrowMovementWorld.player.x;
const wideStartX = wideMovementWorld.player.x;
World.stepWorld(narrowMovementWorld, 0.25, moveRight);
World.stepWorld(wideMovementWorld, 0.25, moveRight);
const narrowTravel = narrowMovementWorld.player.x - narrowStartX;
const wideTravel = wideMovementWorld.player.x - wideStartX;
assert.ok(
  wideTravel <= narrowTravel * 1.05,
  '宽屏不能额外放大初始移动速度，否则会让弹幕过于容易躲避',
);

console.log('responsive-field.test.ts: all assertions passed');
