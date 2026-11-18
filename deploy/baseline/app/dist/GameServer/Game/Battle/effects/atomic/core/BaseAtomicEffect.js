"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAtomicEffect = void 0;
const Logger_1 = require("../../../../../../shared/utils/Logger");
class BaseAtomicEffect {
    type;
    name;
    defaultTimings;
    constructor(type, name, defaultTimings) {
        this.type = type;
        this.name = name;
        this.defaultTimings = defaultTimings;
    }
    canTriggerAt(timing) {
        if (this.defaultTimings.length === 0)
            return true;
        return this.defaultTimings.includes(timing);
    }
    createResult(success, target, type, message, value, data) {
        return { effectId: 0, effectName: this.name, success, target, type, value, message, data };
    }
    checkProbability(chance) {
        return Math.random() * 100 < chance;
    }
    log(message, level = 'debug') {
        const fullMessage = `[${this.name}] ${message}`;
        switch (level) {
            case 'debug':
                Logger_1.Logger.Debug(fullMessage);
                break;
            case 'info':
                Logger_1.Logger.Info(fullMessage);
                break;
            case 'warn':
                Logger_1.Logger.Warn(fullMessage);
                break;
            case 'error':
                Logger_1.Logger.Error(fullMessage, new Error(message));
                break;
        }
    }
    getAttacker(context) { return context.attacker; }
    getDefender(context) { return context.defender; }
    getTarget(context, target) {
        return target === 'self' ? context.attacker : context.defender;
    }
}
exports.BaseAtomicEffect = BaseAtomicEffect;
//# sourceMappingURL=BaseAtomicEffect.js.map