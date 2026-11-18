import { ISkillConfig } from '../../../shared/models/SkillModel';
/**
 * 技能配置管理器
 * 从 XML 文件加载技能数据，使用 ConfigLoader 和 xml2js
 */
export declare class SkillConfig {
    private static _skills;
    private static _loaded;
    /**
     * 加载技能配置
     * 使用 ConfigLoader 从 config/data/skills.xml 加载
     */
    static Load(): void;
    /**
     * 获取技能配置
     */
    static GetSkill(skillId: number): ISkillConfig | undefined;
    /**
     * 获取技能威力
     */
    static GetSkillPower(skillId: number): number;
    /**
     * 获取技能最大PP
     */
    static GetSkillMaxPP(skillId: number): number;
    /**
     * 获取技能名称
     */
    static GetSkillName(skillId: number): string;
    /**
     * 检查技能是否存在
     */
    static HasSkill(skillId: number): boolean;
    /**
     * 获取所有技能
     */
    static GetAllSkills(): ISkillConfig[];
    /**
     * 重新加载配置
     */
    static Reload(): void;
}
//# sourceMappingURL=SkillConfig.d.ts.map