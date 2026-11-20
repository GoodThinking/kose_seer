"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBossMaterialDrops = GetBossMaterialDrops;
const ConfigLoader_1 = require("../../../../shared/config/ConfigLoader");
const dropStreakByKey = new Map();
function GetBossMaterialDrops(battle, player) {
    if (battle.bossMapId === undefined)
        return [];
    const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/material-sources.json');
    if (!config)
        throw new Error('Material source configuration missing');
    const rewards = [];
    for (const drop of config.bossDrops) {
        if (drop.mapId === battle.bossMapId && drop.petId === battle.enemy.id && drop.probability > 0) {
            const key = `${player?.Uid || 0}:${drop.mapId}:${drop.petId}:${drop.itemId}`;
            const streak = dropStreakByKey.get(key) || 0;
            if (streak >= 1 || Math.random() < drop.probability) {
                dropStreakByKey.set(key, 0);
                rewards.push({ itemId: drop.itemId, count: drop.count });
            }
            else {
                dropStreakByKey.set(key, streak + 1);
            }
        }
    }
    return rewards;
}
//# sourceMappingURL=BossMaterialDrops.js.map