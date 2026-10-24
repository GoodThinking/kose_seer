"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancePetExperience = AdvancePetExperience;
exports.GrantBagPetLevel = GrantBagPetLevel;
const { Logger } = require("../../../shared/utils");
const { PetCalculator } = require("./PetCalculator");
const { SptSystem } = require("./SptSystem");
const { ReconcilePetPP } = require("./PetPP");

function AdvancePetExperience(pet) {
    const newSkills = [];
    let evolved = false;
    // pet.exp 是当前等级内的经验。
    while (pet.level < 100) {
        const requiredExp = PetCalculator.ExpForNextLevel(pet.level, pet.petId);
        if (requiredExp <= 0 || pet.exp < requiredExp)
            break;
        pet.exp -= requiredExp;
        pet.level++;
        PetCalculator.UpdatePetStats(pet);
        Logger.Debug(`[PetManager] 精灵升级: PetId=${pet.petId}, NewLevel=${pet.level}, RemainingExp=${pet.exp}`);
        const evolvesTo = SptSystem.GetEvolvesTo(pet.petId);
        const evolvingLevel = SptSystem.GetEvolvingLevel(pet.petId);
        Logger.Debug(`[PetManager] 检查进化: PetId=${pet.petId}, Level=${pet.level}, EvolvesTo=${evolvesTo}, EvolvingLevel=${evolvingLevel}`);
        if (evolvesTo > 0 && pet.level >= evolvingLevel) {
            const oldPetId = pet.petId;
            pet.petId = evolvesTo;
            PetCalculator.UpdatePetStats(pet);
            evolved = true;
            Logger.Info(`[PetManager] 精灵自动进化: OldPetId=${oldPetId}, NewPetId=${evolvesTo}, Level=${pet.level}`);
        }
        for (const move of SptSystem.GetNewMovesOnLevelUp(pet.petId, pet.level)) {
            newSkills.push(move.id);
            Logger.Info(`[PetManager] 精灵学会新技能: PetId=${pet.petId}, Level=${pet.level}, SkillId=${move.id}`);
        }
    }
    return { newSkills, evolved };
}

function GrantBagPetLevel(pets) {
    for (const pet of pets) {
        if (!pet.isInBag || pet.level >= 100)
            continue;
        const requiredExp = PetCalculator.ExpForNextLevel(pet.level, pet.petId);
        if (!Number.isSafeInteger(requiredExp) || requiredExp <= 0)
            throw new Error('Invalid quest pet level threshold');
        // 补足当前等级所需经验，恰好升一级；沿用普通升级的进化和技能规则。
        pet.exp = requiredExp;
        const result = AdvancePetExperience(pet);
        const newSkills = [...new Set(result.newSkills)].filter(id => !pet.skillArray.includes(id));
        pet.skillArray.push(...newSkills.slice(0, Math.max(0, 4 - pet.skillArray.length)));
        pet.hp = pet.maxHp;
        pet.skillPP = ReconcilePetPP(pet, true);
    }
}
