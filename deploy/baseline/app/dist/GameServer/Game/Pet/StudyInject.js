"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EV_TOTAL_CAP = exports.EV_STAT_CAP = void 0;
exports.evTotal = evTotal;
exports.injectFullEffort = injectFullEffort;
const PetCalculator_1 = require("./PetCalculator");
const FIELDS = ['evHp', 'evAtk', 'evDef', 'evSpAtk', 'evSpDef', 'evSpeed'];
exports.EV_STAT_CAP = 255;
exports.EV_TOTAL_CAP = 510;
function evTotal(pet) {
    return FIELDS.reduce((sum, field) => sum + pet[field], 0);
}
/** Set one effort value to 255. Rejects a full stat or a total above 510. */
function injectFullEffort(pet, statIndex) {
    const field = FIELDS[statIndex];
    if (!field || pet[field] >= exports.EV_STAT_CAP)
        return false;
    if (evTotal(pet) - pet[field] + exports.EV_STAT_CAP > exports.EV_TOTAL_CAP)
        return false;
    pet[field] = exports.EV_STAT_CAP;
    PetCalculator_1.PetCalculator.UpdatePetStats(pet);
    return true;
}
//# sourceMappingURL=StudyInject.js.map