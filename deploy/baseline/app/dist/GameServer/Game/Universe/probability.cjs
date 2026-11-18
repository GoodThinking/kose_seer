'use strict';

const PROFILES = Object.freeze({
    rare: Object.freeze({ base: 0.01, soft: 10, increment: 0.03, hard: 35 }),
    rarePlus: Object.freeze({ base: 0.003, soft: 20, increment: 0.02, hard: 50 }),
    shiny: Object.freeze({ base: 0.001, soft: 30, increment: 0.015, hard: 65 }),
});

function probability(kind, failures) {
    const profile = PROFILES[kind];
    if (!profile || !Number.isSafeInteger(failures) || failures < 0) {
        throw new RangeError('Invalid encounter rarity or failure count');
    }
    if (failures >= profile.hard - 1) return 1;
    return Math.min(1, profile.base + Math.max(0, failures - profile.soft) * profile.increment);
}

function shouldAppear(kind, failures, value) {
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Invalid random value');
    return value < probability(kind, failures);
}

module.exports = { PROFILES, probability, shouldAppear };
