import assert from 'node:assert/strict';
import * as Renderer from '../src/render/renderer';

interface StageBackgroundSpec {
  src: string;
  layer: 'far' | 'mid' | 'near';
}

const api = Renderer as typeof Renderer & {
  getStageBackgroundSpec?: (wave: number, layer: 'far' | 'mid' | 'near') => StageBackgroundSpec | undefined;
};

assert.equal(
  typeof api.getStageBackgroundSpec,
  'function',
  '渲染层必须公开关卡背景素材规格',
);

assert.deepEqual(api.getStageBackgroundSpec?.(1, 'far'), {
  src: '/assets/backgrounds/wave01_orbit/wave01_orbit_far.jpg',
  layer: 'far',
});
assert.equal(api.getStageBackgroundSpec?.(1, 'mid'), undefined, '尚未交付的中景必须继续使用程序绘制');
assert.equal(api.getStageBackgroundSpec?.(2, 'far'), undefined, '尚未交付的关卡必须继续使用程序绘制');

console.log('stage-background.test.ts: all assertions passed');
