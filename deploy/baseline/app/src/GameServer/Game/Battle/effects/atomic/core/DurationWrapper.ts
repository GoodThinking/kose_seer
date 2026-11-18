import { BaseAtomicEffect } from './BaseAtomicEffect';
import { AtomicEffectType, IDurationParams, IAtomicEffect } from './IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

/**
 * 持续效果包装器
 * 将其他原子效果包装成持续N回合的效果
 */
export class DurationWrapper extends BaseAtomicEffect {
  private params: IDurationParams;
  private wrappedEffect: IAtomicEffect | null = null;

  constructor(params: IDurationParams) {
    super(AtomicEffectType.DURATION, 'Duration Wrapper', []);
    this.params = params;
  }

  public setWrappedEffect(effect: IAtomicEffect): void {
    this.wrappedEffect = effect;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    
    if (!this.wrappedEffect) {
      this.log('没有被包装的效果', 'warn');
      return results;
    }

    // 执行被包装的效果
    const wrappedResults = this.wrappedEffect.execute(context);
    results.push(...wrappedResults);

    // 添加持续时间信息
    results.push(this.createResult(
      true,
      'both',
      'duration',
      `效果将持续${this.params.duration}回合`,
      this.params.duration
    ));

    return results;
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.DURATION &&
           typeof params.duration === 'number' && params.duration > 0;
  }
}
