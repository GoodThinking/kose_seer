/**
 * 战斗算法测试
 * 测试伤害计算、属性计算、速度判定等核心逻辑
 */

import { BattleAlgorithm, SkillCategory, IPetBaseStats, IDamageOptions } from '../BattleAlgorithm';
import { createAttacker, createDefender, createPetWithStages } from './BattleTestHelpers';

describe('BattleAlgorithm - 战斗算法测试', () => {
  
  // 测试用精灵种族值
  const mockPetStats: IPetBaseStats = {
    hp: 100,
    attack: 100,
    defence: 100,
    spAtk: 100,
    spDef: 100,
    speed: 100
  };

  describe('属性计算', () => {
    test('应该正确计算100级精灵的属性', () => {
      const stats = BattleAlgorithm.CalculateStats(mockPetStats, 100, 31);
      
      // 体力公式: (种族值×2 + 个体值 + 学习力÷4) × 等级÷100 + 等级 + 10
      // = (100×2 + 31 + 0) × 100÷100 + 100 + 10 = 341
      expect(stats.hp).toBe(341);
      expect(stats.maxHp).toBe(341);
      
      // 非体力公式: [(种族值×2 + 个体值 + 学习力÷4) × 等级÷100 + 5] × 性格修正
      // = (100×2 + 31 + 0) × 100÷100 + 5 = 236 (性格修正1.0)
      expect(stats.attack).toBe(236);
      expect(stats.defence).toBe(236);
      expect(stats.spAtk).toBe(236);
      expect(stats.spDef).toBe(236);
      expect(stats.speed).toBe(236);
    });

    test('应该正确应用性格修正', () => {
      // 性格1: 固执 (攻击+10%, 特攻-10%)
      const stats = BattleAlgorithm.CalculateStats(mockPetStats, 100, 31, undefined, 1);
      
      expect(stats.attack).toBeGreaterThan(236); // 攻击提升
      expect(stats.spAtk).toBeLessThan(236);     // 特攻降低
    });

    test('应该正确应用学习力', () => {
      const ev = {
        hp: 252,
        attack: 252,
        defence: 0,
        spAtk: 0,
        spDef: 0,
        speed: 4
      };
      
      const stats = BattleAlgorithm.CalculateStats(mockPetStats, 100, 31, ev);
      
      // 学习力252 = +63点属性值
      expect(stats.hp).toBeGreaterThan(341);
      expect(stats.attack).toBeGreaterThan(236);
    });

    test('简化计算应该返回合理的属性值', () => {
      const stats = BattleAlgorithm.CalculateStatsSimple(mockPetStats, 50);
      
      expect(stats.hp).toBeGreaterThan(0);
      expect(stats.attack).toBeGreaterThan(0);
      expect(stats.maxHp).toBe(stats.hp);
    });
  });

  describe('伤害计算', () => {
    const attackerStats = BattleAlgorithm.CalculateStats(mockPetStats, 100, 31);
    const defenderStats = BattleAlgorithm.CalculateStats(mockPetStats, 100, 31);

    test('应该正确计算物理伤害', () => {
      const result = BattleAlgorithm.CalculateDamage(
        attackerStats,
        defenderStats,
        1, // 草系
        2, // 水系
        100,
        80, // 威力80
        1, // 草系技能
        SkillCategory.PHYSICAL
      );

      expect(result.damage).toBeGreaterThan(0);
      expect(result.effectiveness).toBe(2.0); // 草克水
      expect(result.isCrit).toBeDefined();
    });

    test('应该正确计算特殊伤害', () => {
      const result = BattleAlgorithm.CalculateDamage(
        attackerStats,
        defenderStats,
        3, // 火系
        1, // 草系
        100,
        80,
        3, // 火系技能
        SkillCategory.SPECIAL
      );

      expect(result.damage).toBeGreaterThan(0);
      expect(result.effectiveness).toBe(2.0); // 火克草
    });

    test('变化技能不应该造成伤害', () => {
      const result = BattleAlgorithm.CalculateDamage(
        attackerStats,
        defenderStats,
        1, 1, 100, 0, 1,
        SkillCategory.STATUS
      );

      expect(result.damage).toBe(0);
    });

    test('暴击应该增加伤害', () => {
      const normalResult = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats, 1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { isCrit: false }
      );

      const critResult = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats, 1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { isCrit: true }
      );

      expect(critResult.damage).toBeGreaterThan(normalResult.damage);
      expect(critResult.isCrit).toBe(true);
    });

    test('属性克制应该影响伤害', () => {
      // 克制 (2.0x)
      const superEffective = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 2, // 草攻击水
        100, 80, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { isCrit: false }
      );

      // 普通 (1.0x)
      const normal = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, // 草攻击草
        100, 80, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { isCrit: false }
      );

      // 被克制 (0.5x)
      const notVeryEffective = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 3, // 草攻击火
        100, 80, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { isCrit: false }
      );

      expect(superEffective.damage).toBeGreaterThan(normal.damage);
      expect(normal.damage).toBeGreaterThan(notVeryEffective.damage);
    });

    test('能力等级修正应该影响伤害', () => {
      // 攻击+2
      const boosted = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL,
        [2, 0, 0, 0, 0, 0], // 攻击+2
        undefined,
        { isCrit: false }
      );

      // 攻击+0
      const normal = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL,
        [0, 0, 0, 0, 0, 0],
        undefined,
        { isCrit: false }
      );

      expect(boosted.damage).toBeGreaterThan(normal.damage);
    });
  });

  describe('速度判定', () => {
    test('速度高的应该先手', () => {
      const result = BattleAlgorithm.DetermineFirstMove(150, 100);
      expect(result).toBe(1); // 攻击方先手
    });

    test('速度低的应该后手', () => {
      const result = BattleAlgorithm.DetermineFirstMove(100, 150);
      expect(result).toBe(-1); // 防守方先手
    });

    test('优先度高的应该先手（无视速度）', () => {
      const result = BattleAlgorithm.DetermineFirstMove(
        50,  // 速度低
        150, // 速度高
        1,   // 优先度+1
        0    // 优先度0
      );
      expect(result).toBe(1); // 攻击方先手（因为优先度高）
    });

    test('同速应该随机决定先手', () => {
      const results = new Set();
      
      // 运行100次，应该有两种结果
      for (let i = 0; i < 100; i++) {
        const result = BattleAlgorithm.DetermineFirstMove(100, 100);
        results.add(result);
      }
      
      expect(results.size).toBe(2); // 应该有1和-1两种结果
      expect(results.has(1)).toBe(true);
      expect(results.has(-1)).toBe(true);
    });
  });

  describe('能力等级系统', () => {
    test('应该正确应用能力等级修正', () => {
      const baseStat = 100;
      
      // +1 = 1.5x
      expect(BattleAlgorithm.ApplyStageModifier(baseStat, 1)).toBe(150);
      
      // +2 = 2.0x
      expect(BattleAlgorithm.ApplyStageModifier(baseStat, 2)).toBe(200);
      
      // -1 = 0.67x
      expect(BattleAlgorithm.ApplyStageModifier(baseStat, -1)).toBe(66);
      
      // -2 = 0.5x
      expect(BattleAlgorithm.ApplyStageModifier(baseStat, -2)).toBe(50);
    });

    test('能力等级应该限制在-6到+6之间', () => {
      const baseStat = 100;
      
      // 超过+6应该按+6计算
      expect(BattleAlgorithm.ApplyStageModifier(baseStat, 10)).toBe(
        BattleAlgorithm.ApplyStageModifier(baseStat, 6)
      );
      
      // 低于-6应该按-6计算
      expect(BattleAlgorithm.ApplyStageModifier(baseStat, -10)).toBe(
        BattleAlgorithm.ApplyStageModifier(baseStat, -6)
      );
    });

    test('应该正确计算命中率', () => {
      // 基础命中80%，命中+1，闪避0
      const accuracy1 = BattleAlgorithm.CalculateAccuracy(80, 1, 0);
      expect(accuracy1).toBeGreaterThan(80);
      
      // 基础命中80%，命中0，闪避+1
      const accuracy2 = BattleAlgorithm.CalculateAccuracy(80, 0, 1);
      expect(accuracy2).toBeLessThan(80);
      
      // 基础命中80%，命中+1，闪避+1（互相抵消）
      const accuracy3 = BattleAlgorithm.CalculateAccuracy(80, 1, 1);
      expect(accuracy3).toBe(80);
    });
  });

  describe('属性克制系统', () => {
    test('应该正确返回克制关系', () => {
      // 草克水
      expect(BattleAlgorithm.GetTypeEffectiveness(1, 2)).toBe(2.0);
      
      // 水克火
      expect(BattleAlgorithm.GetTypeEffectiveness(2, 3)).toBe(2.0);
      
      // 火克草
      expect(BattleAlgorithm.GetTypeEffectiveness(3, 1)).toBe(2.0);
    });

    test('应该正确返回被克制关系', () => {
      // 草被火克制
      expect(BattleAlgorithm.GetTypeEffectiveness(1, 3)).toBe(0.5);
      
      // 水被草克制
      expect(BattleAlgorithm.GetTypeEffectiveness(2, 1)).toBe(0.5);
      
      // 火被水克制
      expect(BattleAlgorithm.GetTypeEffectiveness(3, 2)).toBe(0.5);
    });

    test('相同属性应该返回普通效果', () => {
      expect(BattleAlgorithm.GetTypeEffectiveness(1, 1)).toBe(1.0);
      expect(BattleAlgorithm.GetTypeEffectiveness(2, 2)).toBe(1.0);
      expect(BattleAlgorithm.GetTypeEffectiveness(3, 3)).toBe(1.0);
    });
  });

  describe('暴击系统', () => {
    test('应该正确计算暴击率', () => {
      // 基础暴击率 6.25%
      const baseRate = BattleAlgorithm.CalculateCritRate();
      expect(baseRate).toBe(0.0625);
      
      // 暴击等级+1 = 12.5%
      const rate1 = BattleAlgorithm.CalculateCritRate(0.0625, 1);
      expect(rate1).toBe(0.125);
      
      // 暴击等级+2 = 18.75%
      const rate2 = BattleAlgorithm.CalculateCritRate(0.0625, 2);
      expect(rate2).toBe(0.1875);
      
      // 暴击等级+4 = 31.25%
      const rate4 = BattleAlgorithm.CalculateCritRate(0.0625, 4);
      expect(rate4).toBe(0.3125);
    });

    test('暴击率不应该超过100%', () => {
      const rate = BattleAlgorithm.CalculateCritRate(0.5, 10);
      expect(rate).toBeLessThanOrEqual(1.0);
    });
  });

  describe('边界情况', () => {
    const attackerStats = BattleAlgorithm.CalculateStats(mockPetStats, 100, 31);
    const defenderStats = BattleAlgorithm.CalculateStats(mockPetStats, 100, 31);
    
    test('等级应该限制在1-100之间', () => {
      const stats0 = BattleAlgorithm.CalculateStats(mockPetStats, 0, 31);
      const stats1 = BattleAlgorithm.CalculateStats(mockPetStats, 1, 31);
      expect(stats0.hp).toBe(stats1.hp); // 0级按1级计算
      
      const stats100 = BattleAlgorithm.CalculateStats(mockPetStats, 100, 31);
      const stats200 = BattleAlgorithm.CalculateStats(mockPetStats, 200, 31);
      expect(stats100.hp).toBe(stats200.hp); // 200级按100级计算
    });

    test('防御为0时不应该导致除零错误', () => {
      const weakDefender = {
        ...defenderStats,
        defence: 0,
        spDef: 0
      };
      
      expect(() => {
        BattleAlgorithm.CalculateDamage(
          attackerStats, weakDefender,
          1, 1, 100, 80, 1,
          SkillCategory.PHYSICAL
        );
      }).not.toThrow();
    });

    test('威力为0的技能应该造成最小伤害', () => {
      const result = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 0, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { isCrit: false }
      );
      
      expect(result.damage).toBeGreaterThanOrEqual(0);
    });
  });
});
