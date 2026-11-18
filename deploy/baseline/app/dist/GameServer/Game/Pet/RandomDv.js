"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollIndividualValue = rollIndividualValue;
exports.applyRandomIndividualValues = applyRandomIndividualValues;
const PetCalculator_1 = require("./PetCalculator");
function rollIndividualValue() {
    return Math.floor(Math.random() * 32);
}
/** Roll one individual value for all six stats. Preserve level, nature, effort, skills and experience. */
function applyRandomIndividualValues(pet, roll = rollIndividualValue) {
    const dv = roll();
    pet.dvHp = dv;
    pet.dvAtk = dv;
    pet.dvDef = dv;
    pet.dvSpAtk = dv;
    pet.dvSpDef = dv;
    pet.dvSpeed = dv;
    PetCalculator_1.PetCalculator.UpdatePetStats(pet);
}
