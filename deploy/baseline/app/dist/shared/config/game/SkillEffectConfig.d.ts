import { ISkillEffectConfig } from '../../../shared/models/SkillEffectModel';
/**
 * 技能效果配置管理器
 * 从 XML 文件加载技能效果数据
 */
export declare class SkillEffectConfig {
    private static _effects;
    private static _loaded;
    /**
     * 加载技能效果配置
     * 使用 ConfigLoader 从 config/data/skill_effects.xml 加载
     */
    static Load(): void;
    /**
     * 获取技能效果配置
     */
    static GetEffect(effectId: number): ISkillEffectConfig | undefined;
    /**
     * 检查效果是否存在
     */
    static HasEffect(effectId: number): boolean;
    /**
     * 获取所有效果
     */
    static GetAllEffects(): ISkillEffectConfig[];
    /**
     * 重新加载配置
     */
    static Reload(): void;
}
//# sourceMappingURL=SkillEffectConfig.d.ts.map