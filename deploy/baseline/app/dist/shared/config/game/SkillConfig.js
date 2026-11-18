"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillConfig = void 0;
const utils_1 = require("../../../shared/utils");
const ConfigLoader_1 = require("../../../shared/config/ConfigLoader");
const ConfigDefinitions_1 = require("../../../shared/config/ConfigDefinitions");
/**
 * 技能配置管理器
 * 从 XML 文件加载技能数据，使用 ConfigLoader 和 xml2js
 */
class SkillConfig {
    static _skills = new Map();
    static _loaded = false;
    /**
     * 加载技能配置
     * 使用 ConfigLoader 从 config/data/skills.xml 加载
     */
    static Load() {
        if (this._loaded)
            return;
        try {
            // 从 ConfigDefinitions 获取配置路径
            const configPath = ConfigDefinitions_1.ConfigPaths[ConfigDefinitions_1.ConfigKeys.SKILL_CONFIG];
            // 使用 ConfigLoader 加载 XML（xml2js 解析）
            const xmlData = ConfigLoader_1.ConfigLoader.Instance.LoadXmlSync(configPath);
            if (!xmlData) {
                utils_1.Logger.Error('[SkillConfig] 无法加载技能配置文件');
                return;
            }
            // 解析 xml2js 格式的数据
            const moves = xmlData.MovesTbl?.Moves?.Move;
            if (!moves || !Array.isArray(moves)) {
                utils_1.Logger.Error('[SkillConfig] 技能数据格式错误');
                return;
            }
            let count = 0;
            for (const moveData of moves) {
                const id = moveData.ID;
                if (id > 0) {
                    // 调试：记录技能10030的原始数据
                    if (id === 10030) {
                        utils_1.Logger.Debug(`[SkillConfig] 技能10030原始数据: ${JSON.stringify(moveData)}`);
                    }
                    const skill = {
                        id,
                        name: moveData.Name || `技能${id}`,
                        category: moveData.Category || 1,
                        type: moveData.Type || 8,
                        power: moveData.Power || 0,
                        maxPP: moveData.MaxPP || 35,
                        accuracy: moveData.Accuracy || 100,
                        critRate: moveData.CritRate || 1,
                        priority: moveData.Priority || 0,
                        mustHit: (moveData.MustHit || 0) === 1,
                        sideEffect: moveData.SideEffect,
                        sideEffectArg: moveData.SideEffectArg
                    };
                    // 调试：记录有副作用的技能
                    if (skill.sideEffect) {
                        utils_1.Logger.Debug(`[SkillConfig] 加载技能: ${skill.name} (ID=${id}), ` +
                            `副作用=${skill.sideEffect}, 参数=${skill.sideEffectArg || '无'}`);
                    }
                    this._skills.set(id, skill);
                    count++;
                }
            }
            this._loaded = true;
            utils_1.Logger.Info(`[SkillConfig] 成功加载 ${count} 个技能配置 (路径: ${configPath})`);
        }
        catch (error) {
            utils_1.Logger.Error(`[SkillConfig] 加载技能配置失败: ${error}`);
        }
    }
    /**
     * 获取技能配置
     */
    static GetSkill(skillId) {
        if (!this._loaded) {
            this.Load();
        }
        return this._skills.get(skillId);
    }
    /**
     * 获取技能威力
     */
    static GetSkillPower(skillId) {
        const skill = this.GetSkill(skillId);
        return skill?.power || 40;
    }
    /**
     * 获取技能最大PP
     */
    static GetSkillMaxPP(skillId) {
        const skill = this.GetSkill(skillId);
        return skill?.maxPP || 20;
    }
    /**
     * 获取技能名称
     */
    static GetSkillName(skillId) {
        const skill = this.GetSkill(skillId);
        return skill?.name || `技能${skillId}`;
    }
    /**
     * 检查技能是否存在
     */
    static HasSkill(skillId) {
        if (!this._loaded) {
            this.Load();
        }
        return this._skills.has(skillId);
    }
    /**
     * 获取所有技能
     */
    static GetAllSkills() {
        if (!this._loaded) {
            this.Load();
        }
        return Array.from(this._skills.values());
    }
    /**
     * 重新加载配置
     */
    static Reload() {
        this._skills.clear();
        this._loaded = false;
        this.Load();
    }
}
exports.SkillConfig = SkillConfig;
// 注释掉自动加载，改为按需加载
// 只有GameServer需要时才调用 SkillConfig.Load()
// SkillConfig.Load();
//# sourceMappingURL=SkillConfig.js.map