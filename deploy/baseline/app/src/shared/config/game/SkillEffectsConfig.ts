import { ConfigRegistry } from '../ConfigRegistry';
import { ConfigKeys } from '../ConfigDefinitions';
import { Logger } from '../../utils';

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
export class SkillEffectsConfig {
  private static instance: SkillEffectsConfig;
  private effectsMap: Map<number, ISkillEffectConfig>;
  private loaded: boolean;

  private constructor() {
    this.effectsMap = new Map();
    this.loaded = false;
  }

  public static get Instance(): SkillEffectsConfig {
    if (!SkillEffectsConfig.instance) {
      SkillEffectsConfig.instance = new SkillEffectsConfig();
    }
    return SkillEffectsConfig.instance;
  }

  /**
   * 加载技能效果配置
   */
  public async Load(): Promise<void> {
    if (this.loaded) {
      Logger.Debug('[SkillEffectsConfig] 配置已加载，跳过');
      return;
    }

    try {
      const config = ConfigRegistry.Instance.Get<any>(ConfigKeys.SKILL_EFFECTS_V2);
      if (!config || !config.effects) {
        Logger.Error('[SkillEffectsConfig] 技能效果配置加载失败', new Error('配置为空'));
        return;
      }

      // 解析效果配置
      for (const effect of config.effects) {
        this.effectsMap.set(effect.effectId, effect);
      }

      this.loaded = true;
      Logger.Info(`[SkillEffectsConfig] 加载了 ${this.effectsMap.size} 个技能效果配置`);
    } catch (error) {
      Logger.Error('[SkillEffectsConfig] 加载技能效果配置失败', error as Error);
    }
  }

  /**
   * 根据effectId获取效果配置
   */
  public GetEffectById(effectId: number): ISkillEffectConfig | null {
    if (!this.loaded) {
      Logger.Warn('[SkillEffectsConfig] 配置尚未加载');
      return null;
    }

    return this.effectsMap.get(effectId) || null;
  }

  /**
   * 获取所有效果配置
   */
  public GetAllEffects(): ISkillEffectConfig[] {
    return Array.from(this.effectsMap.values());
  }

  /**
   * 获取已实现的效果
   */
  public GetImplementedEffects(): ISkillEffectConfig[] {
    return this.GetAllEffects().filter(e => e.implemented);
  }

  /**
   * 获取未实现的效果
   */
  public GetUnimplementedEffects(): ISkillEffectConfig[] {
    return this.GetAllEffects().filter(e => !e.implemented);
  }

  /**
   * 重新加载配置
   */
  public async Reload(): Promise<void> {
    this.effectsMap.clear();
    this.loaded = false;
    await this.Load();
  }

  /**
   * 获取配置统计信息
   */
  public GetStats(): {
    total: number;
    implemented: number;
    unimplemented: number;
    byCategory: Map<string, number>;
  } {
    const stats = {
      total: this.effectsMap.size,
      implemented: 0,
      unimplemented: 0,
      byCategory: new Map<string, number>()
    };

    for (const effect of this.effectsMap.values()) {
      if (effect.implemented) {
        stats.implemented++;
      } else {
        stats.unimplemented++;
      }

      const count = stats.byCategory.get(effect.category) || 0;
      stats.byCategory.set(effect.category, count + 1);
    }

    return stats;
  }
}
