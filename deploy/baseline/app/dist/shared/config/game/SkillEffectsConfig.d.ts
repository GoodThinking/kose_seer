/**
 * 技能效果配置接口
 */
export interface ISkillEffectConfig {
    effectId: number;
    name: string;
    argsNum: number;
    category: string;
    timing: string[];
    description: string;
    implemented: boolean;
    implementClass: string;
    args: IEffectArg[];
    atomicComposition: IAtomicComposition;
}
export interface IEffectArg {
    index: number;
    name: string;
    type: string;
    description: string;
    default: any;
}
export interface IAtomicComposition {
    type: 'composite' | 'single';
    atoms: any[];
}
/**
 * 技能效果配置管理类
 */
export declare class SkillEffectsConfig {
    private static instance;
    private effectsMap;
    private loaded;
    private constructor();
    static get Instance(): SkillEffectsConfig;
    /**
     * 加载技能效果配置
     */
    Load(): Promise<void>;
    /**
     * 根据effectId获取效果配置
     */
    GetEffectById(effectId: number): ISkillEffectConfig | null;
    /**
     * 获取所有效果配置
     */
    GetAllEffects(): ISkillEffectConfig[];
    /**
     * 获取已实现的效果
     */
    GetImplementedEffects(): ISkillEffectConfig[];
    /**
     * 获取未实现的效果
     */
    GetUnimplementedEffects(): ISkillEffectConfig[];
    /**
     * 重新加载配置
     */
    Reload(): Promise<void>;
    /**
     * 获取配置统计信息
     */
    GetStats(): {
        total: number;
        implemented: number;
        unimplemented: number;
        byCategory: Map<string, number>;
    };
}
//# sourceMappingURL=SkillEffectsConfig.d.ts.map