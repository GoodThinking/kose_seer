"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillEffectsConfig = void 0;
const ConfigRegistry_1 = require("../ConfigRegistry");
const ConfigDefinitions_1 = require("../ConfigDefinitions");
const utils_1 = require("../../utils");
/**
 * 技能效果配置管理类
 */
class SkillEffectsConfig {
    static instance;
    effectsMap;
    loaded;
    constructor() {
        this.effectsMap = new Map();
        this.loaded = false;
    }
    static get Instance() {
        if (!SkillEffectsConfig.instance) {
            SkillEffectsConfig.instance = new SkillEffectsConfig();
        }
        return SkillEffectsConfig.instance;
    }
    /**
     * 加载技能效果配置
     */
    async Load() {
        if (this.loaded) {
            utils_1.Logger.Debug('[SkillEffectsConfig] 配置已加载，跳过');
            return;
        }
        try {
            const config = ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.SKILL_EFFECTS_V2);
            if (!config || !config.effects) {
                utils_1.Logger.Error('[SkillEffectsConfig] 技能效果配置加载失败', new Error('配置为空'));
                return;
            }
            // 解析效果配置
            for (const effect of config.effects) {
                this.effectsMap.set(effect.effectId, effect);
            }
            this.loaded = true;
            utils_1.Logger.Info(`[SkillEffectsConfig] 加载了 ${this.effectsMap.size} 个技能效果配置`);
        }
        catch (error) {
            utils_1.Logger.Error('[SkillEffectsConfig] 加载技能效果配置失败', error);
        }
    }
    /**
     * 根据effectId获取效果配置
     */
    GetEffectById(effectId) {
        if (!this.loaded) {
            utils_1.Logger.Warn('[SkillEffectsConfig] 配置尚未加载');
            return null;
        }
        return this.effectsMap.get(effectId) || null;
    }
    /**
     * 获取所有效果配置
     */
    GetAllEffects() {
        return Array.from(this.effectsMap.values());
    }
    /**
     * 获取已实现的效果
     */
    GetImplementedEffects() {
        return this.GetAllEffects().filter(e => e.implemented);
    }
    /**
     * 获取未实现的效果
     */
    GetUnimplementedEffects() {
        return this.GetAllEffects().filter(e => !e.implemented);
    }
    /**
     * 重新加载配置
     */
    async Reload() {
        this.effectsMap.clear();
        this.loaded = false;
        await this.Load();
    }
    /**
     * 获取配置统计信息
     */
    GetStats() {
        const stats = {
            total: this.effectsMap.size,
            implemented: 0,
            unimplemented: 0,
            byCategory: new Map()
        };
        for (const effect of this.effectsMap.values()) {
            if (effect.implemented) {
                stats.implemented++;
            }
            else {
                stats.unimplemented++;
            }
            const count = stats.byCategory.get(effect.category) || 0;
            stats.byCategory.set(effect.category, count + 1);
        }
        return stats;
    }
}
exports.SkillEffectsConfig = SkillEffectsConfig;
//# sourceMappingURL=SkillEffectsConfig.js.map