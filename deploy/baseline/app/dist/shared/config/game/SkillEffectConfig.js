"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillEffectConfig = void 0;
const utils_1 = require("../../../shared/utils");
const ConfigLoader_1 = require("../../../shared/config/ConfigLoader");
const ConfigDefinitions_1 = require("../../../shared/config/ConfigDefinitions");
/**
 * 技能效果配置管理器
 * 从 XML 文件加载技能效果数据
 */
class SkillEffectConfig {
    static _effects = new Map();
    static _loaded = false;
    /**
     * 加载技能效果配置
     * 使用 ConfigLoader 从 config/data/skill_effects.xml 加载
     */
    static Load() {
        if (this._loaded)
            return;
        try {
            // 从 ConfigDefinitions 获取配置路径
            const configPath = ConfigDefinitions_1.ConfigPaths[ConfigDefinitions_1.ConfigKeys.SKILL_EFFECTS_CONFIG];
            // 使用 ConfigLoader 加载 XML（xml2js 解析）
            const xmlData = ConfigLoader_1.ConfigLoader.Instance.LoadXmlSync(configPath);
            if (!xmlData) {
                utils_1.Logger.Warn('[SkillEffectConfig] 无法加载技能效果配置文件，使用空配置');
                this._loaded = true;
                return;
            }
            // 解析 xml2js 格式的数据
            const effects = xmlData.NewSe?.NewSeIdx;
            if (!effects || !Array.isArray(effects)) {
                utils_1.Logger.Warn('[SkillEffectConfig] 技能效果数据格式错误，使用空配置');
                this._loaded = true;
                return;
            }
            let count = 0;
            for (const effectData of effects) {
                const id = effectData.Idx;
                if (id > 0) {
                    const effect = {
                        id,
                        eid: effectData.Eid || 0,
                        stat: effectData.Stat || 0,
                        times: effectData.Times || 0,
                        args: effectData.Args || '',
                        desc: effectData.Desc || effectData.Des || '',
                        desc2: effectData.Desc2,
                        itemId: effectData.ItemId
                    };
                    this._effects.set(id, effect);
                    count++;
                }
            }
            this._loaded = true;
            utils_1.Logger.Info(`[SkillEffectConfig] 成功加载 ${count} 个技能效果配置 (路径: ${configPath})`);
        }
        catch (error) {
            utils_1.Logger.Error(`[SkillEffectConfig] 加载技能效果配置失败: ${error}`);
            this._loaded = true; // 标记为已加载，避免重复尝试
        }
    }
    /**
     * 获取技能效果配置
     */
    static GetEffect(effectId) {
        if (!this._loaded) {
            this.Load();
        }
        return this._effects.get(effectId);
    }
    /**
     * 检查效果是否存在
     */
    static HasEffect(effectId) {
        if (!this._loaded) {
            this.Load();
        }
        return this._effects.has(effectId);
    }
    /**
     * 获取所有效果
     */
    static GetAllEffects() {
        if (!this._loaded) {
            this.Load();
        }
        return Array.from(this._effects.values());
    }
    /**
     * 重新加载配置
     */
    static Reload() {
        this._effects.clear();
        this._loaded = false;
        this.Load();
    }
}
exports.SkillEffectConfig = SkillEffectConfig;
// 注释掉自动加载，改为按需加载
// 只有GameServer需要时才调用 SkillEffectConfig.Load()
// SkillEffectConfig.Load();
//# sourceMappingURL=SkillEffectConfig.js.map