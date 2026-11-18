"use strict";
/**
 * 技能效果系统
 * 基于原子效果组合的设计
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// 核心
__exportStar(require("./core"), exports);
// 原子效果 - Core
__exportStar(require("./atomic/core/IAtomicEffect"), exports);
__exportStar(require("./atomic/core/BaseAtomicEffect"), exports);
__exportStar(require("./atomic/core/ConditionalCheck"), exports);
__exportStar(require("./atomic/core/DurationWrapper"), exports);
__exportStar(require("./atomic/core/AtomicEffectFactory"), exports);
// 原子效果 - Modifier
__exportStar(require("./atomic/modifier/ModifierEffects"), exports);
// 原子效果 - Stat
__exportStar(require("./atomic/stat/StatEffects"), exports);
// 原子效果 - Status
__exportStar(require("./atomic/status/StatusEffects"), exports);
// 原子效果 - Heal
__exportStar(require("./atomic/heal/HealEffects"), exports);
// 原子效果 - Damage
__exportStar(require("./atomic/damage/DamageEffects"), exports);
// 原子效果 - Defensive
__exportStar(require("./atomic/defensive/DefensiveEffects"), exports);
// 原子效果 - Special
__exportStar(require("./atomic/special/HpEffects"), exports);
__exportStar(require("./atomic/special/SacrificeEffects"), exports);
__exportStar(require("./atomic/special/StatEffects"), exports);
__exportStar(require("./atomic/special/StatusEffects"), exports);
__exportStar(require("./atomic/special/TypeEffects"), exports);
__exportStar(require("./atomic/special/PowerCalcEffects"), exports);
__exportStar(require("./atomic/special/SkillMechanics"), exports);
__exportStar(require("./atomic/special/TriggerEffects"), exports);
__exportStar(require("./atomic/special/AuraAndMiscEffects"), exports);
//# sourceMappingURL=index.js.map