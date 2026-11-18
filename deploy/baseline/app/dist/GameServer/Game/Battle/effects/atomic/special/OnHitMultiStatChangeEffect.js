"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnHitMultiStatChangeEffect = exports.ON_HIT_MULTI_STAT_CHANGE_COUNTER_PREFIX = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
exports.ON_HIT_MULTI_STAT_CHANGE_COUNTER_PREFIX = 'on_hit_multi_stat_change_';
class OnHitMultiStatChangeEffect extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'OnHitMultiStatChangeEffect', [EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.duration = Math.max(1, params.duration ?? 3);
    }
    execute(context) {
        if (!context.attacker) {
            return [];
        }
        if (!context.attacker.effectCounters) {
            context.attacker.effectCounters = {};
        }
        const effectId = context.effectId || 0;
        if (effectId <= 0) {
            return [];
        }
        const counterKey = `${exports.ON_HIT_MULTI_STAT_CHANGE_COUNTER_PREFIX}${effectId}`;
        context.attacker.effectCounters[counterKey] = this.duration;
        return [
            this.createResult(true, 'attacker', 'on_hit_multi_stat_change', `on-hit stat change enabled for ${this.duration} turns`, this.duration, { effectId })
        ];
    }
    validate(params) {
        return params &&
            params.type === IAtomicEffect_1.AtomicEffectType.SPECIAL &&
            params.specialType === 'on_hit_multi_stat_change';
    }
}
exports.OnHitMultiStatChangeEffect = OnHitMultiStatChangeEffect;
//# sourceMappingURL=OnHitMultiStatChangeEffect.js.map