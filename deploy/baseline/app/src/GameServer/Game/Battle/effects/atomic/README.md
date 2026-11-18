# 原子效果分类说明

原子效果按照JSON配置中的category字段进行逻辑分类。

## 已实现的原子效果 (19个)

### Core (核心基础)
- **IAtomicEffect.ts** - 原子效果接口和枚举定义
- **BaseAtomicEffect.ts** - 原子效果基类
- **AtomicEffectFactory.ts** - 原子效果工厂
- **ConditionalCheck.ts** - 条件判断 (category: core)
- **DurationWrapper.ts** - 持续效果包装器 (category: core)

### Modifier (修正器 - category: modifier)
- **AccuracyModifier.ts** - 命中修正
- **CritModifier.ts** - 暴击修正
- **DamageModifier.ts** - 伤害修正
- **PowerModifier.ts** - 威力修正
- **PriorityModifier.ts** - 先制修正

### Stat (能力变化 - category: stat)
- **StatModifier.ts** - 能力变化
- **StatClear.ts** - 能力清除 ⭐ (新实现)

### Status (异常状态 - category: status)
- **StatusInflictor.ts** - 状态施加

### Heal (回复 - category: heal)
- **HealEffect.ts** - 回复效果
- **Regeneration.ts** - 持续回复 ⭐ (新实现)

### Damage (伤害 - category: damage)
- **FixedDamageEffect.ts** - 固定伤害
- **ContinuousDamage.ts** - 持续伤害 ⭐ (新实现)
- **MultiHit.ts** - 连续攻击 ⭐ (新实现)
- **RandomPower.ts** - 随机威力 ⭐ (新实现)

### Defensive (防御 - category: defensive)
- **ImmuneEffect.ts** - 免疫效果
- **ReflectEffect.ts** - 反弹效果

### Special (特殊 - category: special)
- **SpecialEffect.ts** - 特殊效果

## 待实现的原子效果 (106个)

详见 `seer_server/缺失的原子效果.md`

### 按分类统计

| 分类 | 已实现 | 待实现 | 总计 |
|------|--------|--------|------|
| Core | 2 | 0 | 2 |
| Modifier | 5 | 8 | 13 |
| Stat | 2 | 8 | 10 |
| Status | 1 | 7 | 8 |
| Heal | 2 | 3 | 5 |
| Damage | 4 | 15 | 19 |
| Defensive | 2 | 6 | 8 |
| Special | 1 | 59 | 60 |
| **总计** | **19** | **106** | **125** |

## 命名规范

### 文件命名
- 使用PascalCase命名：`StatClear.ts`, `MultiHit.ts`
- 文件名应清晰表达效果功能
- 避免使用缩写，除非是通用缩写（如HP, PP）

### 类命名
- 类名与文件名一致
- 继承BaseAtomicEffect
- 导出接口使用I前缀：`IStatClearParams`

### 效果类型
- 使用specialType字段标识特殊效果类型
- 使用snake_case命名：`stat_clear`, `multi_hit`
- 与JSON配置中的specialType保持一致

## 添加新效果的步骤

1. **确定分类**：根据效果功能确定category
2. **创建文件**：在atomic目录下创建新的.ts文件
3. **实现效果**：
   ```typescript
   import { BaseAtomicEffect } from './BaseAtomicEffect';
   import { AtomicEffectType } from './IAtomicEffect';
   import { IEffectContext, IEffectResult, EffectTiming } from '../core/EffectContext';
   
   export interface IXxxParams {
     type: AtomicEffectType.SPECIAL;
     specialType: 'xxx';
     // 参数定义
   }
   
   export class XxxEffect extends BaseAtomicEffect {
     private params: IXxxParams;
     
     constructor(params: IXxxParams) {
       super(AtomicEffectType.SPECIAL, 'Xxx Effect', [EffectTiming.XXX]);
       this.params = params;
     }
     
     public execute(context: IEffectContext): IEffectResult[] {
       // 实现逻辑
     }
     
     public validate(params: any): boolean {
       // 验证参数
     }
   }
   ```
4. **更新工厂**：在AtomicEffectFactory.ts中添加创建方法
5. **测试**：编写单元测试验证效果

## 导入方式

```typescript
// 导入单个效果
import { StatClear } from './atomic/StatClear';

// 导入多个效果
import { StatModifier } from './atomic/StatModifier';
import { StatClear } from './atomic/StatClear';

// 导入工厂
import { atomicEffectFactory } from './atomic/AtomicEffectFactory';
```

## 注意事项

- 所有原子效果必须继承BaseAtomicEffect
- 必须实现execute()和validate()方法
- 使用this.log()记录日志
- 使用this.createResult()创建效果结果
- 参数验证要严格，避免运行时错误
- 效果应该是无状态的，状态保存在战斗上下文中

## 相关文档

- `seer_server/缺失的原子效果.md` - 待实现效果列表
- `seer_server/docs/ATOMIC_EFFECTS_IMPLEMENTATION_PLAN.md` - 实现计划
- `seer_server/SKILL_EFFECTS_V2_COMPLETION_REPORT.md` - 配置完成报告
