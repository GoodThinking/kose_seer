/**
 * 精灵特性管理服务
 * 每个精灵只能拥有一个特性，参数从 pet_abilities.json 读取
 */
export declare class AbilityService {
    /**
     * 获取所有可用特性列表（从 pet_abilities.json）
     */
    getAllAbilities(): any[];
    /**
     * 获取指定精灵的特性ID
     */
    getPetAbility(uid: number, catchTime: number): Promise<{
        abilityId: number;
    }>;
    /**
     * 设置精灵特性（替换现有特性）
     */
    setAbility(uid: number, catchTime: number, abilityId: number): Promise<void>;
    /**
     * 清除精灵特性
     */
    clearAbility(uid: number, catchTime: number): Promise<void>;
}
//# sourceMappingURL=AbilityService.d.ts.map