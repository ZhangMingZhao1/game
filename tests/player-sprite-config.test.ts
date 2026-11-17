import assert from 'node:assert/strict';
import type { PlayerForm, ShipId } from '../src/data/config';
import * as Renderer from '../src/render/renderer';

interface PlayerSpriteSpec {
  src: string;
  width: number;
  height: number;
}

const api = Renderer as typeof Renderer & {
  getPlayerSpriteSpec?: (shipId: ShipId, form?: PlayerForm) => PlayerSpriteSpec | undefined;
};

assert.equal(
  typeof api.getPlayerSpriteSpec,
  'function',
  '渲染层必须公开玩家机甲素材规格，避免路径和显示尺寸散落在绘制逻辑中',
);

assert.deepEqual(api.getPlayerSpriteSpec?.('raiden', 'assault'), {
  src: '/assets/mecha/player/player_crimson_assault_mech.png',
  width: 72,
  height: 92,
});
assert.deepEqual(api.getPlayerSpriteSpec?.('raiden', 'flight'), {
  src: '/assets/mecha/player/player_crimson_assault_flight.png',
  width: 82,
  height: 78,
});
assert.equal(api.getPlayerSpriteSpec?.('falcon'), undefined, '未交付素材的机体必须继续使用程序绘制');
assert.equal(api.getPlayerSpriteSpec?.('wasp'), undefined, '未交付素材的机体必须继续使用程序绘制');

console.log('player-sprite-config.test.ts: all assertions passed');
