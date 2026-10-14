import { createDefaultPlayerInfo } from '../PlayerModel';
import { PlayerInfoToLoginProto } from '../PlayerConverter';

describe('deployed player texture compatibility', () => {
  it.each([0, 1, 7])('preserves stored texture %i during login conversion', texture => {
    const player = createDefaultPlayerInfo(72010, 'texture-test');
    player.texture = texture;
    expect(PlayerInfoToLoginProto(player).texture).toBe(texture);
  });
});
