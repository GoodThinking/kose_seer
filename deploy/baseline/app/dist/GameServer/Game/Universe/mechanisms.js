'use strict';

const REQUIRED_PET = Object.freeze({ 5: 1017, 6: 1018, 11: 1278, 13: 1315, 14: 1316, 18: 4149, 91: 516 });

/** Advance only a declared scene interaction or its matching frozen battle result. */
function advance(progress, interaction, definitions, hasPet, battle) {
    const id = Number(progress.encounter_id);
    if (interaction.encounterId !== id || !['mechanism', 'trackingPrerequisite'].includes(interaction.kind)) throw new Error('Wrong mechanism');
    const prerequisite = REQUIRED_PET[id];
    if (prerequisite && !hasPet(prerequisite)) {
        const error = new Error('Observation prerequisite missing');
        error.universeMissingPet = prerequisite;
        throw error;
    }
    const current = Number(progress.mechanism_step);
    const bits = Number(progress.mechanism_bits);
    const cycle = Number(progress.cycle_id);
    if (id === 3 && interaction.holeIndex !== undefined) {
        if (current !== 1 || !Number.isInteger(interaction.holeIndex) || interaction.holeIndex < 0 || interaction.holeIndex > 2) throw new Error('Invalid cave step');
        const exit = (cycle - 1) % 3;
        const bit = 1 << interaction.holeIndex;
        if (interaction.holeIndex === exit || (bits & bit)) throw new Error('Invalid cave seal');
        const nextBits = bits | bit;
        const complete = ((nextBits & (nextBits - 1)) !== 0);
        return { step: complete ? 3 : 1, bits: nextBits, complete };
    }
    if (interaction.step !== current + 1) throw new Error('Invalid mechanism order');
    if (interaction.requiresBattle) {
        if (!battle || Number(battle.originalPetId) !== interaction.battlePetId ||
            (battle.outcome !== 'victory' && (!(!interaction.victoryOnly && battle.outcome === 'capture'))))
            throw new Error('Required battle not completed');
    } else if (battle) {
        throw new Error('Unexpected battle');
    }
    const last = definitions.filter(item => item.encounterId === id).reduce((max, item) => Math.max(max, item.step), 0);
    return { step: interaction.step, bits, complete: interaction.step === last };
}

module.exports = { REQUIRED_PET, advance };
