"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolveEffectTiming = ResolveEffectTiming;
exports.ResolveEffectTimings = ResolveEffectTimings;
exports.MatchesEffectTiming = MatchesEffectTiming;
const EffectContext_1 = require("./EffectContext");
const LEGACY_TIMING_ALIASES = {
    ON_SKILL_USE: EffectContext_1.EffectTiming.AFTER_SKILL,
    BEFORE_DAMAGE: EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC,
    ON_BATTLE_END: EffectContext_1.EffectTiming.BATTLE_END,
    BEFORE_ACCURACY_CHECK: EffectContext_1.EffectTiming.BEFORE_HIT_CHECK,
    AFTER_ACCURACY_CHECK: EffectContext_1.EffectTiming.AFTER_HIT_CHECK,
    BEFORE_TURN_ORDER: EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK,
    BEFORE_EFFECT_APPLY: EffectContext_1.EffectTiming.SKILL_EFFECT,
    AFTER_STAT_CHANGE: EffectContext_1.EffectTiming.AFTER_SKILL
};
function NormalizeRawTiming(raw) {
    return raw.toString().trim().toUpperCase();
}
function ResolveEffectTiming(raw) {
    if (!raw) {
        return null;
    }
    const normalized = NormalizeRawTiming(raw);
    if (Object.values(EffectContext_1.EffectTiming).includes(normalized)) {
        return normalized;
    }
    return LEGACY_TIMING_ALIASES[normalized] ?? null;
}
function ResolveEffectTimings(rawTimings) {
    if (!rawTimings || rawTimings.length === 0) {
        return [];
    }
    const resolved = new Set();
    for (const raw of rawTimings) {
        const timing = ResolveEffectTiming(raw);
        if (timing) {
            resolved.add(timing);
        }
    }
    return Array.from(resolved);
}
function MatchesEffectTiming(configuredTimings, currentTiming) {
    if (!configuredTimings || configuredTimings.length === 0) {
        return false;
    }
    const normalizedCurrent = ResolveEffectTiming(currentTiming);
    if (!normalizedCurrent) {
        return false;
    }
    for (const rawTiming of configuredTimings) {
        const normalizedTiming = ResolveEffectTiming(rawTiming);
        if (normalizedTiming === normalizedCurrent) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=EffectTimingResolver.js.map