"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeSkillNullify = exports.TypeSwap = exports.TypeCopy = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 属性复制效果
 *
 * 功能：
 * - 复制自己或对手的属性
 * - 可以覆盖原属性或添加为第二属性
 * - 支持持续回合数或永久生效
 *
 * 使用场景：
 * - 属性模仿（复制对手属性）
 * - 属性传递（将自己属性复制给对手）
 * - 双属性（添加第二属性而不覆盖）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "type_copy",
 *   "source": "opponent",
 *   "duration": 5,
 *   "overwrite": true
 * }
 * ```
 *
 * 与TypeSwap的区别：
 * - TypeSwap: 交换双方属性（双向）
 * - TypeCopy: 复制属性（单向），可选择复制源和目标
 */
class TypeCopy extends BaseAtomicEffect_1.BaseAtomicEffect {
    source;
    duration;
    overwrite;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'TypeCopy', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.TURN_END]);
        this.source = params.source;
        this.duration = params.duration;
        this.overwrite = params.overwrite ?? true;
    }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        // 在AFTER_SKILL时机执行复制
        if (context.timing === EffectContext_1.EffectTiming.AFTER_SKILL) {
            let sourcePet;
            let targetPet;
            if (this.source === 'opponent') {
                // 复制对手属性给自己
                sourcePet = defender;
                targetPet = attacker;
            }
            else {
                // 复制自己属性给对手
                sourcePet = attacker;
                targetPet = defender;
            }
            const sourceType = this.getPetType(sourcePet);
            const targetOriginalType = this.getPetType(targetPet);
            if (this.overwrite) {
                // 覆盖原属性
                this.setPetType(targetPet, sourceType);
                results.push(this.createResult(true, this.source === 'opponent' ? 'attacker' : 'defender', 'type_copy', `属性变为了${this.getTypeName(sourceType)}！`, 0, {
                    original: targetOriginalType,
                    new: sourceType,
                    duration: this.duration
                }));
                this.log(`属性复制: ${this.source === 'opponent' ? '攻击方' : '防御方'}` +
                    `${targetOriginalType}→${sourceType}`);
            }
            else {
                // 添加为第二属性
                this.addSecondaryType(targetPet, sourceType);
                results.push(this.createResult(true, this.source === 'opponent' ? 'attacker' : 'defender', 'type_add', `获得了${this.getTypeName(sourceType)}属性！`, 0, {
                    primary: targetOriginalType,
                    secondary: sourceType,
                    duration: this.duration
                }));
                this.log(`属性添加: ${this.source === 'opponent' ? '攻击方' : '防御方'}` +
                    `获得第二属性${sourceType}`);
            }
            // 记录复制状态
            this.setCopyState(targetPet, targetOriginalType, sourceType, this.duration);
        }
        // 在TURN_END时机检查持续时间
        if (context.timing === EffectContext_1.EffectTiming.TURN_END) {
            const targetPet = this.source === 'opponent' ? attacker : defender;
            const copyState = this.getCopyState(targetPet);
            if (copyState.isCopied && copyState.remainingTurns !== undefined) {
                copyState.remainingTurns--;
                if (copyState.remainingTurns <= 0) {
                    // 恢复原始属性
                    if (this.overwrite) {
                        this.setPetType(targetPet, copyState.originalType);
                    }
                    else {
                        this.removeSecondaryType(targetPet);
                    }
                    copyState.isCopied = false;
                    results.push(this.createResult(true, this.source === 'opponent' ? 'attacker' : 'defender', 'type_restore', `属性恢复了！`, 0, { restoredType: copyState.originalType }));
                    this.log(`属性恢复: ${this.source === 'opponent' ? '攻击方' : '防御方'}` +
                        `${copyState.copiedType}→${copyState.originalType}`);
                }
            }
        }
        return results;
    }
    validate(params) {
        if (!['self', 'opponent'].includes(params.source)) {
            this.log('source必须是self或opponent', 'error');
            return false;
        }
        if (params.duration !== undefined && params.duration < 1) {
            this.log('duration必须大于0', 'error');
            return false;
        }
        return true;
    }
    /**
     * 获取精灵属性
     */
    getPetType(pet) {
        return pet.type ?? pet.elementType ?? 0;
    }
    /**
     * 设置精灵属性
     */
    setPetType(pet, type) {
        if (pet.type !== undefined) {
            pet.type = type;
        }
        if (pet.elementType !== undefined) {
            pet.elementType = type;
        }
    }
    /**
     * 添加第二属性
     */
    addSecondaryType(pet, type) {
        if (!pet.secondaryType) {
            pet.secondaryType = type;
        }
    }
    /**
     * 移除第二属性
     */
    removeSecondaryType(pet) {
        if (pet.secondaryType !== undefined) {
            delete pet.secondaryType;
        }
    }
    /**
     * 获取属性名称（简化版）
     */
    getTypeName(type) {
        const typeNames = {
            0: '普通', 1: '火', 2: '水', 3: '草', 4: '电',
            5: '地面', 6: '飞行', 7: '机械', 8: '冰', 9: '战斗',
            10: '光', 11: '暗影', 12: '神秘', 13: '超能', 14: '龙'
        };
        return typeNames[type] ?? `属性${type}`;
    }
    /**
     * 获取复制状态
     */
    getCopyState(pet) {
        if (!pet.effectStates) {
            pet.effectStates = {};
        }
        if (!pet.effectStates.typeCopy) {
            pet.effectStates.typeCopy = {
                originalType: this.getPetType(pet),
                copiedType: this.getPetType(pet),
                isCopied: false
            };
        }
        return pet.effectStates.typeCopy;
    }
    /**
     * 设置复制状态
     */
    setCopyState(pet, originalType, copiedType, duration) {
        const state = this.getCopyState(pet);
        state.originalType = originalType;
        state.copiedType = copiedType;
        state.isCopied = true;
        if (duration !== undefined) {
            state.remainingTurns = duration;
        }
    }
}
exports.TypeCopy = TypeCopy;
/**
 * 属性交换效果
 *
 * 功能：
 * - 交换自己和对手的属性
 * - 可以设置持续回合数或永久生效
 * - 支持双向交换或单向复制
 *
 * 使用场景：
 * - 属性互换（交换双方属性）
 * - 属性复制（复制对手属性到自己）
 * - 临时属性变化（持续N回合）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "type_swap",
 *   "duration": 5,
 *   "swapBoth": true
 * }
 * ```
 *
 * 状态数据结构：
 * ```typescript
 * {
 *   originalType: number;       // 原始属性
 *   swappedType: number;        // 交换后的属性
 *   remainingTurns: number;     // 剩余回合数
 *   isSwapped: boolean;         // 是否已交换
 * }
 * ```
 */
class TypeSwap extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    swapBoth;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'TypeSwap', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.TURN_END]);
        this.duration = params.duration;
        this.swapBoth = params.swapBoth ?? true;
    }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        // 在AFTER_SKILL时机执行交换
        if (context.timing === EffectContext_1.EffectTiming.AFTER_SKILL) {
            const attackerType = this.getPetType(attacker);
            const defenderType = this.getPetType(defender);
            if (this.swapBoth) {
                // 双向交换
                this.setPetType(attacker, defenderType);
                this.setPetType(defender, attackerType);
                // 记录交换状态
                this.setSwapState(attacker, attackerType, defenderType, this.duration);
                this.setSwapState(defender, defenderType, attackerType, this.duration);
                results.push(this.createResult(true, 'both', 'type_swap', `双方属性互换！`, 0, {
                    attackerOriginal: attackerType,
                    attackerNew: defenderType,
                    defenderOriginal: defenderType,
                    defenderNew: attackerType,
                    duration: this.duration
                }));
                this.log(`属性互换: 攻击方${attackerType}→${defenderType}, 防御方${defenderType}→${attackerType}`);
            }
            else {
                // 单向复制（攻击方复制防御方属性）
                this.setPetType(attacker, defenderType);
                this.setSwapState(attacker, attackerType, defenderType, this.duration);
                results.push(this.createResult(true, 'attacker', 'type_copy', `复制了对手的属性！`, 0, {
                    original: attackerType,
                    new: defenderType,
                    duration: this.duration
                }));
                this.log(`属性复制: 攻击方${attackerType}→${defenderType}`);
            }
        }
        // 在TURN_END时机检查持续时间
        if (context.timing === EffectContext_1.EffectTiming.TURN_END) {
            const attackerState = this.getSwapState(attacker);
            const defenderState = this.getSwapState(defender);
            // 检查攻击方
            if (attackerState.isSwapped) {
                if (attackerState.remainingTurns !== undefined) {
                    attackerState.remainingTurns--;
                    if (attackerState.remainingTurns <= 0) {
                        // 恢复原始属性
                        this.setPetType(attacker, attackerState.originalType);
                        attackerState.isSwapped = false;
                        results.push(this.createResult(true, 'attacker', 'type_restore', `属性恢复了！`, 0, { restoredType: attackerState.originalType }));
                        this.log(`攻击方属性恢复: ${attackerState.swappedType}→${attackerState.originalType}`);
                    }
                }
            }
            // 检查防御方
            if (this.swapBoth && defenderState.isSwapped) {
                if (defenderState.remainingTurns !== undefined) {
                    defenderState.remainingTurns--;
                    if (defenderState.remainingTurns <= 0) {
                        // 恢复原始属性
                        this.setPetType(defender, defenderState.originalType);
                        defenderState.isSwapped = false;
                        results.push(this.createResult(true, 'defender', 'type_restore', `属性恢复了！`, 0, { restoredType: defenderState.originalType }));
                        this.log(`防御方属性恢复: ${defenderState.swappedType}→${defenderState.originalType}`);
                    }
                }
            }
        }
        return results;
    }
    validate(params) {
        if (params.duration !== undefined && params.duration < 1) {
            this.log('duration必须大于0', 'error');
            return false;
        }
        return true;
    }
    /**
     * 获取精灵属性
     */
    getPetType(pet) {
        return pet.type ?? pet.elementType ?? 0;
    }
    /**
     * 设置精灵属性
     */
    setPetType(pet, type) {
        if (pet.type !== undefined) {
            pet.type = type;
        }
        if (pet.elementType !== undefined) {
            pet.elementType = type;
        }
    }
    /**
     * 获取交换状态
     */
    getSwapState(pet) {
        if (!pet.effectStates) {
            pet.effectStates = {};
        }
        if (!pet.effectStates.typeSwap) {
            pet.effectStates.typeSwap = {
                originalType: this.getPetType(pet),
                swappedType: this.getPetType(pet),
                isSwapped: false
            };
        }
        return pet.effectStates.typeSwap;
    }
    /**
     * 设置交换状态
     */
    setSwapState(pet, originalType, swappedType, duration) {
        const state = this.getSwapState(pet);
        state.originalType = originalType;
        state.swappedType = swappedType;
        state.isSwapped = true;
        if (duration !== undefined) {
            state.remainingTurns = duration;
        }
    }
}
exports.TypeSwap = TypeSwap;
/**
 * 属性技能无效化效果
 *
 * 使特定属性的技能无效
 *
 * @category Special
 * @example
 * // 持续火属性技能无效
 * {
 *   duration: 5,
 *   types: [1] // 1 = 火属性
 * }
 */
class TypeSkillNullify extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    types;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'TypeSkillNullify', []);
        this.duration = params.duration;
        this.types = params.types;
    }
    validate(params) {
        return this.duration > 0 && this.types.length > 0;
    }
    execute(context) {
        const { attacker, defender, skillType } = context;
        // 检查技能属性是否在无效化列表中
        if (skillType !== undefined && this.types.includes(skillType)) {
            // 技能无效，伤害归零
            return [this.createResult(true, 'defender', 'type_skill_nullify', `属性技能无效（属性${skillType}）`, 0, {
                    nullifiedType: skillType,
                    types: this.types,
                    duration: this.duration
                })];
        }
        return [this.createResult(false, 'defender', 'type_skill_nullify', '技能属性不在无效化列表中')];
    }
}
exports.TypeSkillNullify = TypeSkillNullify;
//# sourceMappingURL=TypeEffects.js.map