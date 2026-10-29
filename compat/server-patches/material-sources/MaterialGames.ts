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

/** Resource games use normalized scores; arcade games also report raw points. */
export class MaterialGames {
  private static readonly sessions = new WeakMap<PlayerInstance, { game: ResourceGame; started: number }>();
  private static readonly lookoutSessions = new WeakSet<PlayerInstance>();
  private static readonly standardSessions = new WeakMap<PlayerInstance, number>();

  public static Join(player: PlayerInstance, gameId: number): void {
    this.lookoutSessions.delete(player);
    this.standardSessions.delete(player);
    if (player.Data.mapID === 7 && gameId === 1) {
      this.sessions.delete(player);
      this.lookoutSessions.add(player);
      return;
    }
    const config = ConfigLoader.Instance.LoadJson<{ games: ResourceGame[]; standardGames: { mapIds: number[] } }>('data/json/material-sources.json');
    if (!config) throw new Error('Material source configuration missing');
    if (gameId === 1 && config.standardGames?.mapIds.includes(player.Data.mapID)) {
      this.sessions.delete(player);
      this.standardSessions.set(player, player.Data.mapID);
      return;
    }
    const game = config.games.find(entry => entry.mapId === player.Data.mapID && entry.gameId === gameId);
    if (!game) throw new Error('Unsupported resource game');
    if (game.superNono && (!player.Data.superNono || !player.Data.hasNono || !(player.Data.nonoState & 2))) {
      throw new Error('Following Super NoNo required');
    }
    this.sessions.set(player, { game, started: Date.now() });
  }

  public static async Finish(player: PlayerInstance, score: number, rawScore: number): Promise<MaterialReward[]> {
    if (this.lookoutSessions.delete(player)) {
      if (player.Data.mapID !== 7 || score !== Math.floor(rawScore / 35000 * 100)) {
        throw new Error('Invalid lookout game outcome');
      }
      const config = ConfigLoader.Instance.LoadJson<{ lookoutGame: { pointsPerCoin: number; maxCoins: number } }>('data/json/material-sources.json');
      if (!config?.lookoutGame) throw new Error('Lookout game configuration missing');
      const coins = Math.min(config.lookoutGame.maxCoins, Math.floor(rawScore / config.lookoutGame.pointsPerCoin));
      if (coins > 0 && !await player.AddCurrency(undefined, coins)) {
        throw new Error('Lookout game currency could not be saved');
      }
      return coins > 0 ? [{ itemId: 1, count: coins }] : [];
    }
    const standardMap = this.standardSessions.get(player);
    if (standardMap !== undefined) {
      this.standardSessions.delete(player);
      if (player.Data.mapID !== standardMap) throw new Error('Game map changed');
      const valid = standardMap === 4
        ? score === Math.floor(rawScore / 3000 * 100)
        : standardMap === 6
          ? score === rawScore && [0, 40, 80, 100].includes(score)
          : [0, 50, 100, 150, 200, 330, 410, 490, 590, 690].includes(rawScore)
            && score === Math.floor(rawScore / 690 * 100);
      if (!valid) throw new Error('Invalid standard game outcome');
      const config = ConfigLoader.Instance.LoadJson<{ standardGames: { coinsPerPercent: number; maxCoins: number } }>('data/json/material-sources.json');
      if (!config?.standardGames) throw new Error('Standard game configuration missing');
      const coins = Math.min(config.standardGames.maxCoins, score * config.standardGames.coinsPerPercent);
      if (coins > 0 && !await player.AddCurrency(undefined, coins)) {
        throw new Error('Game currency could not be saved');
      }
      return coins > 0 ? [{ itemId: 1, count: coins }] : [];
    }
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
