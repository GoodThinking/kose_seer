"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialGames = void 0;
const ConfigLoader_1 = require("../../../shared/config/ConfigLoader");
const MaterialRewards_1 = require("../Item/MaterialRewards");
/** Scores use the original Flash game's first GAME_OVER uint32 (0..100). */
class MaterialGames {
    static sessions = new WeakMap();
    static Join(player, gameId) {
        const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/material-sources.json');
        if (!config)
            throw new Error('Material source configuration missing');
        const game = config.games.find(entry => entry.mapId === player.Data.mapID && entry.gameId === gameId);
        if (!game)
            throw new Error('Unsupported resource game');
        if (game.superNono && (!player.Data.superNono || !player.Data.hasNono || !(player.Data.nonoState & 2))) {
            throw new Error('Following Super NoNo required');
        }
        this.sessions.set(player, { game, started: Date.now() });
    }
    static async Finish(player, score) {
        const session = this.sessions.get(player);
        this.sessions.delete(player);
        if (!session || session.game.mapId !== player.Data.mapID)
            throw new Error('Resource game not active on this map');
        if (!Number.isInteger(score) || score < 0 || score > 100)
            throw new Error('Invalid resource game score');
        if (!score)
            return [];
        const { game, started } = session;
        if (Date.now() - started < (game.minimumSeconds || 0) * 1000)
            throw new Error('Resource game not completed');
        return (0, MaterialRewards_1.GrantMaterials)(player, () => {
            if (player.Data.mapID !== game.mapId)
                throw new Error('Resource game map changed');
            if (Math.random() >= game.probability)
                return [];
            return [{ itemId: game.itemId, count: Math.min(game.maxCount, Math.ceil(score / game.pointsPerItem)) }];
        });
    }
}
exports.MaterialGames = MaterialGames;
//# sourceMappingURL=MaterialGames.js.map