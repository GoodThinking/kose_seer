/**
 * BOSS特殊规则系统
 * 从配置文件读取并应用BOSS特殊规则
 * 包括：顺序破防、特殊击杀条件、周几出现规则等
 */
/**
 * BOSS特殊规则管理器
 */
export declare class BossSpecialRules {
    private static readonly SAME_LIFE_DEATH_IMMUNE_IDS;
    private static readonly STATUS_IMMUNE_IDS;
    /**
     * 检查BOSS是否免疫同生共死
     */
    static IsSameLifeDeathImmune(petId: number): boolean;
    /**
     * 检查BOSS是否免疫异常状态
     */
    static IsStatusImmune(petId: number): boolean;
    private static sequentialBreakPhases;
    private static specialKillBroken;
    /**
     * 重置战斗状态（战斗开始时调用）
     */
    static ResetBattleState(petId: number): void;
    /**
     * 应用顺序破防规则（在伤害计算后调用）
     * @param defenderId 防御方精灵ID
     * @param skillType 技能属性类型
     * @param damage 原始伤害
     * @returns 修正后的伤害
     */
    static ApplySequentialTypeBreak(defenderId: number, skillType: number, damage: number): {
        damage: number;
        phaseAdvanced: boolean;
        requiredType?: number;
    };
    /**
     * 应用特殊击杀条件规则（在伤害计算后调用）
     * @param defenderId 防御方精灵ID
     * @param attackerId 攻击方精灵ID
     * @param skillId 技能ID
     * @param damage 原始伤害
     * @param defenderCurrentHP 防御方当前HP
     * @returns 修正后的伤害
     */
    static ApplySpecialKillCondition(defenderId: number, attackerId: number, skillId: number, damage: number, defenderCurrentHP: number): {
        damage: number;
        broken: boolean;
        protected: boolean;
    };
    /**
     * 验证周几出现规则的挑战条件（在战斗结束时调用）
     * @param defenderId 防御方精灵ID
     * @param mapId 当前地图ID
     * @param roundCount 战斗回合数
     * @param isCriticalHit 是否致命一击击败
     * @returns 是否满足挑战条件
     */
    static ValidateWeekdayScheduleCondition(defenderId: number, mapId: number, roundCount: number, isCriticalHit: boolean): {
        valid: boolean;
        condition?: string;
        conditionDesc?: string;
    };
    /**
     * 获取顺序破防BOSS的当前阶段信息（用于客户端显示）
     * @param petId 精灵ID
     * @returns 当前阶段和所需属性类型
     */
    static GetSequentialBreakPhaseInfo(petId: number): {
        currentPhase: number;
        requiredType?: number;
        typeName?: string;
    } | undefined;
    /**
     * 获取特殊击杀条件BOSS的状态（用于客户端显示）
     * @param petId 精灵ID
     * @returns 是否已破防
     */
    static GetSpecialKillConditionStatus(petId: number): {
        isBroken: boolean;
        rule?: any;
    } | undefined;
}
//# sourceMappingURL=BossSpecialRules.d.ts.map