"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPetSkillPP = GetPetSkillPP;
exports.GetSkillMaxPP = GetSkillMaxPP;
exports.ReconcilePetPP = ReconcilePetPP;
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
/** Stored by skill ID in player_pets.pet_list; only absent legacy/new-skill entries start full. */
function GetPetSkillPP(pet, skillId) {
    const max = GetSkillMaxPP(skillId);
    if (pet.skillPP !== undefined && (!pet.skillPP || typeof pet.skillPP !== 'object' || Array.isArray(pet.skillPP))) {
        throw new Error('Invalid stored pet PP');
    }
    const value = pet.skillPP?.[skillId];
    if (value === undefined)
        return max;
    if (!Number.isInteger(value) || value < 0 || value > max)
        throw new Error('Stored skill PP out of range');
    return value;
}
function GetSkillMaxPP(skillId) {
    return GameConfig_1.GameConfig.GetSkillById(skillId)?.MaxPP || 20;
}
function ReconcilePetPP(pet, recover = false) {
    const skills = require("../Battle/ChampionPetRuntime").ChampionPetRuntime.Skills(pet);
    return Object.fromEntries((skills.length ? skills : [10001]).map(id => {
        const current = GetPetSkillPP(pet, id);
        return [id, recover ? GetSkillMaxPP(id) : current];
    }));
}
//# sourceMappingURL=PetPP.js.map