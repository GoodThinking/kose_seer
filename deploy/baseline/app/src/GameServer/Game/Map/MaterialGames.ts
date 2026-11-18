import { ConfigLoader } from '../../../shared/config/ConfigLoader';
import type { PlayerInstance } from '../Player/PlayerInstance';
import { GrantMaterials, MaterialReward } from '../Item/MaterialRewards';

interface ResourceGame {
  mapId: number;
  gameId: number;
  itemId: number;
  pointsPerItem: number;
  maxCount: number;
  probability: number;
  minimumSeconds?: number;
  superNono?: boolean;
}

/** Scores use the original Flash game's first GAME_OVER uint32 (0..100). */
export class MaterialGames {
  private static readonly sessions = new WeakMap<PlayerInstance, { game: ResourceGame; started: number }>();

  public static Join(player: PlayerInstance, gameId: number): void {
    const config = ConfigLoader.Instance.LoadJson<{ games: ResourceGame[] }>('data/json/material-sources.json');
    if (!config) throw new Error('Material source configuration missing');
    const game = config.games.find(entry => entry.mapId === player.Data.mapID && entry.gameId === gameId);
    if (!game) throw new Error('Unsupported resource game');
    if (game.superNono && (!player.Data.superNono || !player.Data.hasNono || !(player.Data.nonoState & 2))) {
      throw new Error('Following Super NoNo required');
    }
    this.sessions.set(player, { game, started: Date.now() });
  }

  public static async Finish(player: PlayerInstance, score: number): Promise<MaterialReward[]> {
    const session = this.sessions.get(player);
    this.sessions.delete(player);
    if (!session || session.game.mapId !== player.Data.mapID) throw new Error('Resource game not active on this map');
    if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error('Invalid resource game score');
    if (!score) return [];
    const { game, started } = session;
    if (Date.now() - started < (game.minimumSeconds || 0) * 1000) throw new Error('Resource game not completed');
    return GrantMaterials(player, () => {
      if (player.Data.mapID !== game.mapId) throw new Error('Resource game map changed');
      if (Math.random() >= game.probability) return [];
      return [{ itemId: game.itemId, count: Math.min(game.maxCount, Math.ceil(score / game.pointsPerItem)) }];
    });
  }
}
