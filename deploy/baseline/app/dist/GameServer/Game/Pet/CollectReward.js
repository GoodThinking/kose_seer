"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECT_GROUPS = void 0;
exports.ownsFamily = ownsFamily;
exports.canClaimCollect = canClaimCollect;
exports.COLLECT_GROUPS = {
    1: {
        rewardIds: [1, 4, 7],
        families: [[22, 23, 24], [30, 31, 32], [35, 36, 37], [13, 14, 15], [10, 11, 12], [33, 34], [38, 39, 40], [43, 44, 45], [25, 26], [16, 17, 18]],
    },
    2: { rewardIds: [71], families: [[27, 28, 29], [53, 54, 55], [65, 66, 67]] },
    3: { rewardIds: [275], families: [[83, 84, 85], [198, 199, 200], [89, 90], [249, 250, 251], [145, 146, 147], [51, 52], [178, 179, 180]] },
    4: { rewardIds: [669], families: [[235, 236], [228, 229], [232, 233, 234], [237, 238, 239], [291, 292], [293, 294, 295], [414, 415], [399, 400], [344, 345]] },
    5: { rewardIds: [1, 4, 7], families: [] },
    301: { rewardIds: [1, 4, 7], families: [] },
};
const STARTER_FAMILIES = { 1: [1, 2, 3, 303], 4: [4, 5, 6, 306], 7: [7, 8, 9, 309] };
exports.STARTER_FAMILIES = STARTER_FAMILIES;
function ownsFamily(owned, family) {
    return family.some(id => owned.has(id));
}
function canClaimCollect(groupId, rewardId, pets, monKingWin) {
    const group = exports.COLLECT_GROUPS[groupId];
    if (!group || !group.rewardIds.includes(rewardId))
        return false;
    const owned = new Set(pets.map(pet => pet.petId));
    if (groupId === 301 && monKingWin < 10)
        return false;
    if (!group.families.every(family => ownsFamily(owned, family)))
        return false;
    const blocked = STARTER_FAMILIES[rewardId];
    return !blocked || !ownsFamily(owned, blocked);
}
//# sourceMappingURL=CollectReward.js.map