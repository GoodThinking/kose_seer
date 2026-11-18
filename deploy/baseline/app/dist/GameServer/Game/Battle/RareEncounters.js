"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectWildOpponent = SelectWildOpponent;
const ConfigLoader_1 = require("../../../shared/config/ConfigLoader");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
/** Resolve a disguised encounter only after the server has validated a live wild-monster slot. */
function SelectWildOpponent(mapId, petId, level, originalPetId) {
    const host = GameConfig_1.GameConfig.GetMapConfigById(mapId)?.ogres.find((ogre) => ogre.petId === petId);
    if (!host || host.isBoss || host.catchable === false || originalPetId !== petId)
        return [petId, level];
    const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/pet-acquisition.json');
    for (const rule of config?.disguises ?? []) {
        if (rule.hostIds.includes(petId) && Math.random() < rule.probability)
            return [rule.petId, rule.level];
    }
    return [petId, level];
}
//# sourceMappingURL=RareEncounters.js.map