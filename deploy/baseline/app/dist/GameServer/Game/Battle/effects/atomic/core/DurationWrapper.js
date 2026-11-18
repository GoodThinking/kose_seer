"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DurationWrapper = void 0;
const BaseAtomicEffect_1 = require("./BaseAtomicEffect");
const IAtomicEffect_1 = require("./IAtomicEffect");
/**
 * 持续效果包装器
 * 将其他原子效果包装成持续N回合的效果
 */
class DurationWrapper extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    wrappedEffect = null;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.DURATION, 'Duration Wrapper', []);
        this.params = params;
    }
    setWrappedEffect(effect) {
        this.wrappedEffect = effect;
    }
    execute(context) {
        const results = [];
        if (!this.wrappedEffect) {
            this.log('没有被包装的效果', 'warn');
            return results;
        }
        // 执行被包装的效果
        const wrappedResults = this.wrappedEffect.execute(context);
        results.push(...wrappedResults);
        // 添加持续时间信息
        results.push(this.createResult(true, 'both', 'duration', `效果将持续${this.params.duration}回合`, this.params.duration));
        return results;
    }
    validate(params) {
        return params && params.type === IAtomicEffect_1.AtomicEffectType.DURATION &&
            typeof params.duration === 'number' && params.duration > 0;
    }
}
exports.DurationWrapper = DurationWrapper;
//# sourceMappingURL=DurationWrapper.js.map