"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBossMaterialDrops = GetBossMaterialDrops;
const ConfigLoader_1 = require("../../../../shared/config/ConfigLoader");
function GetBossMaterialDrops(battle) {
    if (battle.bossMapId === undefined)
        return [];
    const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/material-sources.json');
    if (!config)
        throw new Error('Material source configuration missing');
    const rewards = [];
    for (const drop of config.bossDrops) {
        if (drop.mapId === battle.bossMapId && drop.petId === battle.enemy.id && Math.random() < drop.probability) {
            rewards.push({ itemId: drop.itemId, count: drop.count });
        }
    }
    return rewards;
}
//# sourceMappingURL=BossMaterialDrops.js.map