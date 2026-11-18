"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultPetInfo = createDefaultPetInfo;
/**
 * 创建默认精灵信息
 */
function createDefaultPetInfo(userId, petId) {
    const now = Math.floor(Date.now() / 1000);
    // 创建基础精灵对象
    const pet = {
        id: 0,
        userId,
        catchTime: now,
        petId,
        level: 1,
        exp: 0,
        hp: 20, // 临时值，稍后会被 PetCalculator 重新计算
        maxHp: 20, // 临时值，稍后会被 PetCalculator 重新计算
        atk: 10, // 临时值，稍后会被 PetCalculator 重新计算
        def: 10, // 临时值，稍后会被 PetCalculator 重新计算
        spAtk: 10, // 临时值，稍后会被 PetCalculator 重新计算
        spDef: 10, // 临时值，稍后会被 PetCalculator 重新计算
        speed: 10, // 临时值，稍后会被 PetCalculator 重新计算
        evHp: 0,
        evAtk: 0,
        evDef: 0,
        evSpAtk: 0,
        evSpDef: 0,
        evSpeed: 0,
        dvHp: Math.floor(Math.random() * 32), // 0-31
        dvAtk: Math.floor(Math.random() * 32), // 0-31
        dvDef: Math.floor(Math.random() * 32), // 0-31
        dvSpAtk: Math.floor(Math.random() * 32), // 0-31
        dvSpDef: Math.floor(Math.random() * 32), // 0-31
        dvSpeed: Math.floor(Math.random() * 32), // 0-31
        nature: Math.floor(Math.random() * 25), // 0-24（性格ID范围）
        skillArray: [],
        effectList: [],
        isDefault: false,
        isInBag: true,
        position: 0,
        nick: '',
        obtainTime: now,
        obtainWay: 0,
        obtainLevel: 1,
        effectCount: 0,
        commonMark: 0,
        shiny: 0 // 默认普通精灵
    };
    // 注意：属性值应该在调用此函数后，由 PetCalculator.UpdatePetStats(pet) 重新计算
    // 这里的临时值只是为了确保对象结构完整
    const { assignInnateTrait } = require("../../GameServer/Game/Pet/PetTrait");
    assignInnateTrait(pet);
    return pet;
}
//# sourceMappingURL=PetModel.js.map