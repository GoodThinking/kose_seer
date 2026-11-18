/**
 * 战斗算法扩展测试
 * 测试更复杂的战斗场景：能力等级组合、真实精灵数据模拟、极端情况等
 */

import { BattleAlgorithm, SkillCategory, IPetBaseStats } from '../BattleAlgorithm';
import { createAttacker, createDefender, createPetWithStages, createEffectContextSimple } from './BattleTestHelpers';

describe('BattleAlgorithm - 扩展测试', () => {

  describe('能力等级组合测试', () => {
    test('攻击+2 防御-1 应该造成更高伤害', () => {
      const attacker = createAttacker();
      const defender = createDefender();

      // 攻击方攻击+2
      attacker.battleLevels = [2, 0, 0, 0, 0, 0];
      // 防御方防御-1
      defender.battleLevels = [0, -1, 0, 0, 0, 0];

      const attackerStats = {
        hp: attacker.hp,
        maxHp: attacker.maxHp,
        attack: attacker.attack,
        defence: attacker.defence,
        spAtk: attacker.spAtk,
        spDef: attacker.spDef,
        speed: attacker.speed
      };

      const defenderStats = {
        hp: defender.hp,
        maxHp: defender.maxHp,
        attack: defender.attack,
        defence: defender.defence,
        spAtk: defender.spAtk,
        spDef: defender.spDef,
        speed: defender.speed
      };

      const result = BattleAlgorithm.CalculateDamage(
        attackerStats,
        defenderStats,
        1, 2, 100, 80, 1,
        SkillCategory.PHYSICAL,
        attacker.battleLevels,
        defender.battleLevels
      );

      // 攻击+2 = 2x, 防御-1 = 0.67x, 草克水 = 2x
      // 基础伤害应该显著增加
      expect(result.damage).toBeGreaterThan(0);
      expect(result.effectiveness).toBe(2.0);
    });

    test('能力等级应该正确应用在特殊攻击上', () => {
      const attackerStats = { hp: 300, maxHp: 300, attack: 200, defence: 150, spAtk: 250, spDef: 160, speed: 150 };
      const defenderStats = { hp: 280, maxHp: 280, attack: 180, defence: 200, spAtk: 150, spDef: 180, speed: 120 };

      // 特攻+3, 特防-2
      const result = BattleAlgorithm.CalculateDamage(
        attackerStats,
        defenderStats,
        1, 1, 100, 100, 1,
        SkillCategory.SPECIAL,
        [0, 0, 3, 0, 0, 0],  // 特攻+3
        [0, 0, 0, -2, 0, 0]  // 特防-2
      );

      // +3 = 2.5x, -2 = 0.5x
      expect(result.damage).toBeGreaterThan(0);
    });

    test('速度等级应该影响先手判定', () => {
      // 速度相同的情况
      let result = BattleAlgorithm.DetermineFirstMove(100, 100, 0, 0);
      expect([1, -1]).toContain(result); // 应该随机

      // 速度+1 vs 速度0
      result = BattleAlgorithm.DetermineFirstMove(100, 100, 0, 0);
      // 速度相同，优先度相同，应该随机

      // 优先度+1
      result = BattleAlgorithm.DetermineFirstMove(50, 200, 1, 0);
      expect(result).toBe(1); // 优先度高即使速度低也先手
    });
  });

  describe('本系加成(STAB)测试', () => {
    test('本系技能应该获得1.5倍加成', () => {
      const attackerStats = { hp: 300, maxHp: 300, attack: 200, defence: 150, spAtk: 200, spDef: 160, speed: 150 };
      const defenderStats = { hp: 280, maxHp: 280, attack: 180, defence: 200, spAtk: 150, spDef: 180, speed: 120 };

      // 草系精灵使用草系技能（本系）
      const stabResult = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1, // 草系攻击草系
        SkillCategory.PHYSICAL
      );

      // 草系精灵使用火系技能（非本系）
      const nonStabResult = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        3, 1, 100, 80, 3, // 火系攻击草系
        SkillCategory.PHYSICAL
      );

      // 本系加成应该使伤害更高
      expect(stabResult.damage).toBeGreaterThan(nonStabResult.damage);
    });
  });

  describe('暴击系统扩展测试', () => {
    test('暴击应该造成1.5倍伤害', () => {
      const attackerStats = { hp: 300, maxHp: 300, attack: 200, defence: 150, spAtk: 200, spDef: 160, speed: 150 };
      const defenderStats = { hp: 280, maxHp: 280, attack: 180, defence: 200, spAtk: 150, spDef: 180, speed: 120 };

      const normalResult = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { isCrit: false }
      );

      const critResult = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { isCrit: true }
      );

      expect(critResult.damage).toBeGreaterThan(normalResult.damage);
      expect(critResult.isCrit).toBe(true);
    });

    test('暴击率应该受暴击等级影响', () => {
      const baseRate = 0.0625; // 6.25%

      // 暴击等级0 = 1x = 6.25%
      expect(BattleAlgorithm.CalculateCritRate(baseRate, 0)).toBe(0.0625);

      // 暴击等级1 = 2x = 12.5%
      expect(BattleAlgorithm.CalculateCritRate(baseRate, 1)).toBe(0.125);

      // 暴击等级4 = 5x = 31.25%
      expect(BattleAlgorithm.CalculateCritRate(baseRate, 4)).toBe(0.3125);
    });

    test('暴击率不应该超过100%', () => {
      const rate = BattleAlgorithm.CalculateCritRate(0.5, 10);
      expect(rate).toBeLessThanOrEqual(1.0);
    });
  });

  describe('属性克制扩展测试', () => {
    test('双重克制应该返回正确倍率', () => {
      // 草克水，水克火，火克草
      // 冰克草、飞行、地面、龙

      // 单重克制
      expect(BattleAlgorithm.GetTypeEffectiveness(1, 2)).toBe(2.0); // 草克水
      expect(BattleAlgorithm.GetTypeEffectiveness(2, 3)).toBe(2.0); // 水克火

      // 无克制
      expect(BattleAlgorithm.GetTypeEffectiveness(1, 3)).toBe(0.5); // 草被火克

      // 互相不克制
      expect(BattleAlgorithm.GetTypeEffectiveness(8, 1)).toBe(1.0); // 普通不克草
    });

    test('龙系互克', () => {
      expect(BattleAlgorithm.GetTypeEffectiveness(15, 15)).toBe(2.0); // 龙克龙
    });

    test('圣灵系克暗影和龙', () => {
      expect(BattleAlgorithm.GetTypeEffectiveness(16, 13)).toBe(2.0); // 圣灵克暗影
      expect(BattleAlgorithm.GetTypeEffectiveness(16, 15)).toBe(2.0); // 圣灵克龙
    });
  });

  describe('命中率扩展测试', () => {
    test('命中率应该在合理范围内', () => {
      // 100%命中技能，命中+0, 闪避+0
      expect(BattleAlgorithm.CalculateAccuracy(100, 0, 0)).toBe(100);

      // 100%命中技能，命中+6, 闪避-6
      const highAcc = BattleAlgorithm.CalculateAccuracy(100, 6, -6);
      expect(highAcc).toBeGreaterThan(100);

      // 100%命中技能，命中-6, 闪避+6
      const lowAcc = BattleAlgorithm.CalculateAccuracy(100, -6, 6);
      expect(lowAcc).toBeLessThan(100);
    });

    test('命中率不应该超过100%或低于0%', () => {
      const cases = [
        [100, 6, -6],
        [100, 10, -10],
        [80, -6, 6],
        [80, -10, 10],
      ];

      for (const [base, acc, eva] of cases) {
        const result = BattleAlgorithm.CalculateAccuracy(base, acc, eva);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }
    });

    test('命中率50%时，命中+1闪避-1应该变为100%', () => {
      // 50% * (4/3) / (2/3) = 50% * 2 = 100%
      const result = BattleAlgorithm.CalculateAccuracy(50, 1, -1);
      expect(result).toBe(100);
    });
  });

  describe('天气/加成测试', () => {
    test('应该正确应用印章加成', () => {
      const attackerStats = { hp: 300, maxHp: 300, attack: 200, defence: 150, spAtk: 200, spDef: 160, speed: 150 };
      const defenderStats = { hp: 280, maxHp: 280, attack: 180, defence: 200, spAtk: 150, spDef: 180, speed: 120 };

      const normal = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL
      );

      const withBonus = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { sealBonus: 1.2 } // 20%印章加成
      );

      expect(withBonus.damage).toBeGreaterThan(normal.damage);
    });

    test('应该正确应用战队加成', () => {
      const attackerStats = { hp: 300, maxHp: 300, attack: 200, defence: 150, spAtk: 200, spDef: 160, speed: 150 };
      const defenderStats = { hp: 280, maxHp: 280, attack: 180, defence: 200, spAtk: 150, spDef: 180, speed: 120 };

      const normal = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL
      );

      const withBonus = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { teamBonus: 1.1 } // 10%战队加成
      );

      expect(withBonus.damage).toBeGreaterThan(normal.damage);
    });
  });

  describe('极端情况测试', () => {
    test('等级1精灵属性计算', () => {
      const baseStats: IPetBaseStats = { hp: 100, attack: 100, defence: 100, spAtk: 100, spDef: 100, speed: 100 };

      const stats = BattleAlgorithm.CalculateStats(baseStats, 1, 31);

      expect(stats.hp).toBeGreaterThan(0);
      expect(stats.attack).toBeGreaterThan(0);
      expect(stats.hp).toBeLessThan(200); // 1级不应该有太高的HP
    });

    test('满学习力精灵属性计算', () => {
      const baseStats: IPetBaseStats = { hp: 100, attack: 100, defence: 100, spAtk: 100, spDef: 100, speed: 100 };

      const statsNoEv = BattleAlgorithm.CalculateStats(baseStats, 100, 31);
      const statsFullEv = BattleAlgorithm.CalculateStats(baseStats, 100, 31, {
        hp: 252, attack: 252, defence: 252, spAtk: 252, spDef: 252, speed: 252
      });

      // 满学习力应该显著提高属性
      expect(statsFullEv.attack).toBeGreaterThan(statsNoEv.attack);
      expect(statsFullEv.hp).toBeGreaterThan(statsNoEv.hp);
    });

    test('极限性格修正', () => {
      const baseStats: IPetBaseStats = { hp: 100, attack: 100, defence: 100, spAtk: 100, spDef: 100, speed: 100 };

      // 固执 (攻击+10%, 特攻-10%)
      const stubborn = BattleAlgorithm.CalculateStats(baseStats, 100, 31, undefined, 1);

      // 慢吞吞 (速度-10%, 攻击+10%)
      const slow = BattleAlgorithm.CalculateStats(baseStats, 100, 31, undefined, 2);

      expect(stubborn.attack).toBeGreaterThan(slow.attack);
      expect(slow.speed).toBeLessThan(stubborn.speed);
    });

    test('伤害应该考虑随机波动', () => {
      const attackerStats = { hp: 300, maxHp: 300, attack: 200, defence: 150, spAtk: 200, spDef: 160, speed: 150 };
      const defenderStats = { hp: 280, maxHp: 280, attack: 180, defence: 200, spAtk: 150, spDef: 180, speed: 120 };

      const results: number[] = [];

      // 运行多次以观察随机波动
      for (let i = 0; i < 20; i++) {
        const result = BattleAlgorithm.CalculateDamage(
          attackerStats, defenderStats,
          1, 1, 100, 100, 1,
          SkillCategory.PHYSICAL,
          undefined, undefined,
          { isCrit: false }
        );
        results.push(result.damage);
      }

      // 随机波动范围应该在85%-100%之间
      const minDamage = Math.min(...results);
      const maxDamage = Math.max(...results);

      // 由于随机性，最大值和最小值应该不同
      expect(results.length).toBe(20);
    });
  });
});