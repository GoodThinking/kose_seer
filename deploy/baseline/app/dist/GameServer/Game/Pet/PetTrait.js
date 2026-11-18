"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.speciesAllowsTrait = speciesAllowsTrait;
exports.isFusionSpecies = isFusionSpecies;
exports.rollTrait = rollTrait;
exports.currentTraitId = currentTraitId;
exports.applyTrait = applyTrait;
exports.assignInnateTrait = assignInnateTrait;
exports.isTraitItem = isTraitItem;
exports.applyTraitItem = applyTraitItem;
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const TRAIT_MIN = 1006;
const TRAIT_MAX = 1045;
function num(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
function petConfig(petId) {
    return GameConfig_1.GameConfig.GetPetById(petId);
}
function speciesAllowsTrait(_petId) {
    return true;
}
function isFusionSpecies(petId) {
    const info = petConfig(petId);
    return num(info?.IsFuseMon) === 1;
}
function traitPool() {
    return GameConfig_1.GameConfig.GetAllPetAbilities().filter(ability => {
        const id = num(ability?.abilityId);
        return id >= TRAIT_MIN && id <= TRAIT_MAX;
    });
}
function rollTrait(exceptId = 0) {
    const pool = traitPool();
    const choices = exceptId > 0 ? pool.filter(ability => num(ability.abilityId) !== exceptId) : pool;
    const list = choices.length > 0 ? choices : pool;
    if (list.length === 0)
        return null;
    return list[Math.floor(Math.random() * list.length)];
}
function currentTraitId(pet) {
    const effect = pet.effectList && pet.effectList[0];
    return num(effect?.effectID || effect?.itemId);
}
function applyTrait(pet, ability) {
    pet.effectList = [{
            itemId: ability.abilityId,
            status: 2,
            leftCount: -1,
            effectID: ability.abilityId,
            args: (ability.args || []).join(' '),
        }];
    pet.effectCount = 1;
}
function assignInnateTrait(pet) {
    if (pet.effectList && pet.effectList.length > 0)
        return;
    if (!speciesAllowsTrait(pet.petId))
        return;
    const trait = rollTrait();
    if (!trait)
        return;
    applyTrait(pet, trait);
}
function isTraitItem(item) {
    if (!item)
        return false;
    return num(item.NewSeReset) === 1 || num(item.NonFuseResetNewse) > 0 || num(item.NonFuseAddNewse) === 1;
}
function allowsPetClass(item, petId) {
    if (!item.LimitPetClass)
        return true;
    const allowed = String(item.LimitPetClass).trim().split(/\s+/).map(num).filter(id => id > 0);
    if (allowed.length === 0)
        return true;
    return allowed.includes(num(petConfig(petId)?.PetClass));
}
function applyTraitItem(pet, item) {
    if (!isTraitItem(item) || !item)
        return 'skip';
    if (!allowsPetClass(item, pet.petId) || !speciesAllowsTrait(pet.petId))
        return 'reject';
    const fusion = isFusionSpecies(pet.petId);
    const fusionReset = num(item.NewSeReset) === 1;
    const openTrait = num(item.NonFuseAddNewse) === 1;
    const resetValue = num(item.NonFuseResetNewse);
    if (fusionReset && !fusion)
        return 'reject';
    if ((openTrait || resetValue > 0) && fusion)
        return 'reject';
    const current = currentTraitId(pet);
    if (openTrait) {
        if (current > 0)
            return 'reject';
        const trait = rollTrait();
        if (!trait)
            return 'reject';
        applyTrait(pet, trait);
        return 'ok';
    }
    if (resetValue > 1) {
        const forced = GameConfig_1.GameConfig.GetPetAbilityById(resetValue);
        if (!forced || current === resetValue)
            return 'reject';
        applyTrait(pet, forced);
        return 'ok';
    }
    const trait = rollTrait(current);
    if (!trait)
        return 'reject';
    applyTrait(pet, trait);
    return 'ok';
}
