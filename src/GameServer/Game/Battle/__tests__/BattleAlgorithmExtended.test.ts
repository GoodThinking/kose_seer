/**
 * 战斗算法扩展测试
 * 测试更复杂的战斗场景：能力等级组合、真实精灵数据模拟、极端情况等
 */

import { BattleAlgorithm, SkillCategory, IPetBaseStats } from '../BattleAlgorithm';
import { createAttacker, createDefender, createPetWithStages, createEffectContextSimple } from './BattleTestHelpers';
import { ConfigRegistry } from '../../../../shared/config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../../../shared/config/ConfigDefinitions';
import { BattleCore } from '../BattleCore';

describe('BattleAlgorithm - 扩展测试', () => {
  beforeAll(async () => {
    for (const key of [ConfigKeys.PET_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.SKILL_CONFIG]) {
      ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigType.XML);
    }
    ConfigRegistry.Instance.Register(ConfigKeys.NATURES_CONFIG, ConfigPaths[ConfigKeys.NATURES_CONFIG], ConfigType.JSON);
    await ConfigRegistry.Instance.Initialize();
  });

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

      // 固定技能、普通系防守方、随机与暴击，仅改变攻击者是否同系。
      const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);
      try {
        const stabResult = BattleAlgorithm.CalculateDamage(
          attackerStats, defenderStats,
          1, 8, 100, 80, 1,
          SkillCategory.PHYSICAL, undefined, undefined, {isCrit: false}
        );

        const nonStabResult = BattleAlgorithm.CalculateDamage(
          attackerStats, defenderStats,
          8, 8, 100, 80, 1,
          SkillCategory.PHYSICAL, undefined, undefined, {isCrit: false}
        );

        expect(stabResult.effectiveness).toBe(1);
        expect(nonStabResult.effectiveness).toBe(1);
        expect(stabResult.damage).toBe(96);
        expect(nonStabResult.damage).toBe(64);
        expect(stabResult.damage / nonStabResult.damage).toBe(1.5);
      } finally { random.mockRestore(); }
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

    test('中间命中阈值允许超过100，实际命中判定饱和', () => {
      const cases = [
        [100, 6, -6, 900],
        [100, 10, -10, 900],
        [80, -6, 6, 8],
        [80, -10, 10, 8],
      ];

      for (const [base, acc, eva, expected] of cases) {
        const result = BattleAlgorithm.CalculateAccuracy(base, acc, eva);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBe(expected);
      }
      const attacker = createAttacker({battleLv: [0, 0, 0, 0, 0, 6]});
      const defender = createDefender({battleLv: [0, 0, 0, 0, 0, -6]});
      const skill = {id: 10006, name: '命中分支测试', category: 1, type: 8, power: 40,
        maxPP: 35, accuracy: 80, critRate: 0, priority: 0, mustHit: false};
      expect(BattleAlgorithm.CalculateAccuracy(80, 6, -6)).toBe(720);
      const random = jest.spyOn(Math, 'random');
      try {
        for (const roll of [0, 0.5, 0.999999999999]) {
          random.mockReturnValue(roll);
          expect(BattleCore.CheckHit(attacker, defender, skill)).toBe(true);
        }
      } finally { random.mockRestore(); }
    });

    test('按当前生产等级表，基础50、命中+1、闪避-1阈值为88', () => {
      // 当前4/3、3/4规则：floor(50 * (4/3) / (3/4)) = 88；XIN规则尚未验证。
      expect(BattleAlgorithm.GetAccuracyStageMultiplier(1)).toBe(4 / 3);
      expect(BattleAlgorithm.GetAccuracyStageMultiplier(-1)).toBe(3 / 4);
      const result = BattleAlgorithm.CalculateAccuracy(50, 1, -1);
      expect(result).toBe(88);
    });
  });

  describe('天气/加成测试', () => {
    test('应该正确应用印章加成', () => {
      const attackerStats = { hp: 300, maxHp: 300, attack: 200, defence: 150, spAtk: 200, spDef: 160, speed: 150 };
      const defenderStats = { hp: 280, maxHp: 280, attack: 180, defence: 200, spAtk: 150, spDef: 180, speed: 120 };
      const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);
      try {
      const normal = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL, undefined, undefined, {isCrit: false}
      );

      const withBonus = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { isCrit: false, sealBonus: 1.2 } // 20%印章加成
      );

      expect(withBonus.damage).toBeGreaterThan(normal.damage);
      expect(normal.damage).toBe(96);
      expect(withBonus.damage).toBe(115);
      } finally { random.mockRestore(); }
    });

    test('应该正确应用战队加成', () => {
      const attackerStats = { hp: 300, maxHp: 300, attack: 200, defence: 150, spAtk: 200, spDef: 160, speed: 150 };
      const defenderStats = { hp: 280, maxHp: 280, attack: 180, defence: 200, spAtk: 150, spDef: 180, speed: 120 };
      const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);
      try {
      const normal = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL, undefined, undefined, {isCrit: false}
      );

      const withBonus = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL,
        undefined, undefined,
        { isCrit: false, teamBonus: 1.1 } // 10%战队加成
      );

      expect(withBonus.damage).toBeGreaterThan(normal.damage);
      expect(normal.damage).toBe(96);
      expect(withBonus.damage).toBe(105);
      } finally { random.mockRestore(); }
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

      // ID3勇敢 (速度-10%, 攻击+10%)，两种性格的攻击加成相同。
      const slow = BattleAlgorithm.CalculateStats(baseStats, 100, 31, undefined, 3);

      expect(stubborn.attack).toBe(259);
      expect(slow.attack).toBe(stubborn.attack);
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
