"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectWildOpponent = SelectWildOpponent;
const ConfigLoader_1 = require("../../../shared/config/ConfigLoader");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const disguiseStreakByPet = new Map();
/** Resolve a disguised encounter only after the server has validated a live wild-monster slot. */
function SelectWildOpponent(mapId, petId, level, originalPetId) {
    const host = GameConfig_1.GameConfig.GetMapConfigById(mapId)?.ogres.find((ogre) => ogre.petId === petId);
    if (!host || host.isBoss || host.catchable === false || originalPetId !== petId)
        return [petId, level];
    const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/pet-acquisition.json');
    for (const rule of config?.disguises ?? []) {
        if (rule.hostIds.includes(petId)) {
            const streak = disguiseStreakByPet.get(rule.petId) || 0;
            // 保底：最多连续打 9 只宿主野怪未触发，第 10 只 100% 必触发变身稀有精灵（如尼尔、闪光皮皮等）
            if (streak >= 9 || Math.random() < rule.probability) {
                disguiseStreakByPet.set(rule.petId, 0);
                return [rule.petId, rule.level];
            }
            disguiseStreakByPet.set(rule.petId, streak + 1);
        }
    }
    return [petId, level];
}
//# sourceMappingURL=RareEncounters.js.map