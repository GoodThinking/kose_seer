"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPetExperienceFields = GetPetExperienceFields;
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const ServerConfig_1 = require("../../../shared/config/ServerConfig");
const PetCalculator_1 = require("./PetCalculator");
/** 数据库存等级内经验；固定XIN及显式启用的旧Nieo以累计差值显示增量。 */
function GetPetExperienceFields(pet, protocol) {
    if (protocol !== 'xin-20261013' && ServerConfig_1.Config.Game.cumulativePetExperience !== true) {
        return { exp: pet.exp, currentLvExp: 0,
            nextLvExp: pet.level === 100 ? pet.exp : PetCalculator_1.PetCalculator.ExpForNextLevel(pet.level, pet.petId) };
    }
    if (!Number.isInteger(pet.level) || pet.level < 1 || pet.level > 100 ||
        !Number.isSafeInteger(pet.exp) || pet.exp < 0) {
        throw new Error('Invalid pet experience state');
    }
    const configs = GameConfig_1.GameConfig.GetAllPets();
    const config = configs.find(item => item.ID === pet.petId);
    if (!config)
        throw new Error(`Missing experience config: ${pet.petId}`);
    // 当前升级实际执行 EvolvesTo；EvolvesFrom 的历史来源不是可执行进化边。
    // 检查实际正向及入向边，避免跨成本曲线投影。
    const pending = [pet.petId], visited = new Set();
    while (pending.length) {
        const id = pending.pop();
        if (visited.has(id))
            continue;
        visited.add(id);
        const current = configs.find(item => item.ID === id);
        if ((current.GrowthType ?? 1) !== (config.GrowthType ?? 1)) {
            throw new Error(`Unsupported cross-GrowthType experience projection: ${pet.petId}`);
        }
        for (const other of configs) {
            if (other.ID === current.EvolvesTo || other.EvolvesTo === id) {
                if (!visited.has(other.ID))
                    pending.push(other.ID);
            }
        }
    }
    const base = Math.max(0, PetCalculator_1.PetCalculator.CalculateExpForLevel(pet.level, pet.petId)
        - PetCalculator_1.PetCalculator.CalculateExpForLevel(1, pet.petId));
    const exp = base + pet.exp;
    const nextLvExp = pet.level === 100 ? exp : base + PetCalculator_1.PetCalculator.ExpForNextLevel(pet.level, pet.petId);
    if (![base, exp, nextLvExp].every(value => Number.isSafeInteger(value) && value <= 0xffffffff)) {
        throw new Error('Pet experience projection exceeds uint32');
    }
    return { exp, currentLvExp: base, nextLvExp };
}
//# sourceMappingURL=PetExperienceProjection.js.map