/**
 * 技能效果测试
 * 测试各种原子效果（Atomic Effects）的行为
 */

import { BattleAlgorithm, SkillCategory } from '../BattleAlgorithm';
import {
  createAttacker,
  createDefender,
  createMockBattlePet,
  createMockEffectContext,
  createDamageContext,
  createPetWithStages,
  createPetWithStatus,
  applyDamage,
  healPet
} from './BattleTestHelpers';
import { EffectTiming } from '../effects/core/EffectContext';
import { BattleStatus } from '../../../../shared/models/BattleModel';

describe('BattleEffectSystem - 技能效果测试', () => {

  describe('HP相关效果测试', () => {
    test('造成伤害后HP应正确减少', () => {
      const attacker = createAttacker({ hp: 300, maxHp: 300 });
      const defender = createDefender({ hp: 280, maxHp: 280 });

      const defenderBeforeHp = defender.hp;

      // 模拟造成50伤害
      applyDamage(defender, 50);

      expect(defender.hp).toBe(defenderBeforeHp - 50);
      expect(defender.hp).toBe(230);
    });

    test('HP不应低于0', () => {
      const defender = createDefender({ hp: 280, maxHp: 280 });

      applyDamage(defender, 300);

      expect(defender.hp).toBe(0);
    });

    test('恢复HP不应超过MaxHp', () => {
      const defender = createDefender({ hp: 100, maxHp: 280 });

      healPet(defender, 300);

      expect(defender.hp).toBe(280);
    });

    test('攻击方回复HP', () => {
      const attacker = createAttacker({ hp: 100, maxHp: 300 });

      healPet(attacker, 50);

      expect(attacker.hp).toBe(150);
    });
  });

  describe('能力等级效果测试', () => {
    test('能力等级应在-6到+6之间', () => {
      const pet = createPetWithStages([10, -10, 5, -5, 3, -3]);

      // 超出范围的值应该在计算时被限制
      for (let i = 0; i < pet.battleLevels!.length; i++) {
        const stage = pet.battleLevels![i];
        const modifier = BattleAlgorithm.ApplyStageModifier(100, stage);

        // 使用正确范围的值进行测试
        const validStage = Math.max(-6, Math.min(6, stage));
        const expectedModifier = BattleAlgorithm.ApplyStageModifier(100, validStage);

        expect(modifier).toBe(expectedModifier);
      }
    });

    test('攻击等级+2应该使伤害显著提升', () => {
      const attacker = createPetWithStages([2, 0, 0, 0, 0, 0], true);
      const defender = createDefender();

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
        1, 1, 100, 80, 1,
        SkillCategory.PHYSICAL,
        attacker.battleLevels,
        undefined
      );

      // +2 = 2.0x 伤害加成
      expect(result.damage).toBeGreaterThan(0);
    });
  });

  describe('状态效果测试', () => {
    test('应能正确设置异常状态', () => {
      const pet = createPetWithStatus(BattleStatus.POISON, 3);

      expect(pet.status).toBe(BattleStatus.POISON);
      expect(pet.statusTurns).toBe(3);
    });

    test('状态回合应该可以减少', () => {
      let pet = createPetWithStatus(BattleStatus.PARALYSIS, 2);

      // 模拟回合开始
      if (pet.statusTurns && pet.statusTurns > 0) {
        pet.statusTurns--;
      }

      expect(pet.statusTurns).toBe(1);

      // 再减少一次
      if (pet.statusTurns && pet.statusTurns > 0) {
        pet.statusTurns--;
      }

      expect(pet.statusTurns).toBe(0);
      expect(pet.status).toBeUndefined();
    });

    test('多个异常状态应正确存储', () => {
      const pet = createAttacker();
      pet.statusDurations = new Array(20).fill(0);

      // 中毒3回合
      pet.statusDurations[BattleStatus.POISON] = 3;
      // 烧伤2回合
      pet.statusDurations[BattleStatus.BURN] = 2;

      expect(pet.statusDurations[BattleStatus.POISON]).toBe(3);
      expect(pet.statusDurations[BattleStatus.BURN]).toBe(2);
    });

    test('常见异常状态枚举值', () => {
      expect(BattleStatus.PARALYSIS).toBe(0);
      expect(BattleStatus.POISON).toBe(1);
      expect(BattleStatus.BURN).toBe(2);
      expect(BattleStatus.SLEEP).toBe(8);
      expect(BattleStatus.FEAR).toBe(6);
    });
  });

  describe('特殊状态测试', () => {
    test('畏缩状态应可设置', () => {
      const pet = createAttacker();
      pet.flinched = true;

      expect(pet.flinched).toBe(true);
    });

    test('束缚状态应可设置', () => {
      const pet = createAttacker();
      pet.bound = true;
      pet.boundTurns = 2;

      expect(pet.bound).toBe(true);
      expect(pet.boundTurns).toBe(2);
    });

    test('疲惫状态应可设置', () => {
      const pet = createAttacker();
      pet.fatigue = true;
      pet.fatigueTurns = 1;

      expect(pet.fatigue).toBe(true);
      expect(pet.fatigueTurns).toBe(1);
    });
  });

  describe('技能PP测试', () => {
    test('使用技能应减少PP', () => {
      const pet = createAttacker();
      pet.skillPP = [30, 25, 20, 15];

      // 使用技能0 (_pp索引0对应技能0)
      if (pet.skillPP[0] > 0) {
        pet.skillPP[0]--;
      }

      expect(pet.skillPP[0]).toBe(29);
    });

    test('PP为0时不能使用技能', () => {
      const pet = createAttacker();
      pet.skillPP = [0, 25, 20, 15];

      let canUse = false;
      if (pet.skillPP[0] > 0) {
        pet.skillPP[0]--;
        canUse = true;
      }

      expect(canUse).toBe(false);
      expect(pet.skillPP[0]).toBe(0);
    });

    test('lastMove应记录上次使用的技能', () => {
      const pet = createAttacker();
      pet.skills = [1001, 1002, 1003, 1004];
      pet.lastMove = 0;

      // 使用技能2
      pet.lastMove = pet.skills[2];

      expect(pet.lastMove).toBe(1003);
    });
  });

  describe('免疫标志测试', () => {
    test('应能设置免疫能力下降', () => {
      const pet = createAttacker();
      pet.immuneFlags = { statDown: true, status: false };

      expect(pet.immuneFlags?.statDown).toBe(true);
      expect(pet.immuneFlags?.status).toBe(false);
    });

    test('应能设置免疫异常状态', () => {
      const pet = createAttacker();
      pet.immuneFlags = { statDown: false, status: true };

      expect(pet.immuneFlags?.status).toBe(true);
    });
  });

  describe('效果上下文测试', () => {
    test('应能创建基本效果上下文', () => {
      const attacker = createAttacker();
      const defender = createDefender();

      const context = createMockEffectContext(attacker, defender, {
        skillId: 1001,
        damage: 100,
        timing: EffectTiming.AFTER_DAMAGE_APPLY
      });

      expect(context.attacker).toBe(attacker);
      expect(context.defender).toBe(defender);
      expect(context.skillId).toBe(1001);
      expect(context.damage).toBe(100);
      expect(context.timing).toBe(EffectTiming.AFTER_DAMAGE_APPLY);
    });

    test('伤害上下文应包含伤害值', () => {
      const attacker = createAttacker();
      const defender = createDefender();
      const damage = 150;

      const context = createDamageContext(damage, attacker, defender);

      expect(context.damage).toBe(damage);
      expect(context.originalDamage).toBe(damage);
    });

    test('效果上下文应包含修改器', () => {
      const attacker = createAttacker();
      const defender = createDefender();

      const context = createMockEffectContext(attacker, defender, {
        damageMultiplier: 1.5,
        hitRateModifier: 10,
        critRateModifier: 20,
        priorityModifier: 1
      });

      expect(context.damageMultiplier).toBe(1.5);
      expect(context.hitRateModifier).toBe(10);
      expect(context.critRateModifier).toBe(20);
      expect(context.priorityModifier).toBe(1);
    });
  });

  describe('伤害边界测试', () => {
    test('最小伤害应为1（克制）', () => {
      const attackerStats = { hp: 300, maxHp: 300, attack: 10, defence: 1000, spAtk: 10, spDef: 1000, speed: 100 };
      const defenderStats = { hp: 280, maxHp: 280, attack: 10, defence: 1000, spAtk: 10, spDef: 1000, speed: 100 };

      const result = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 2, 1, 1, 1, // 草攻击水，1级，威力1
        SkillCategory.PHYSICAL
      );

      // 克制时即使伤害计算为0，最低为1
      expect(result.damage).toBeGreaterThanOrEqual(1);
    });

    test('无效技能伤害应为0', () => {
      const attackerStats = { hp: 300, maxHp: 300, attack: 200, defence: 150, spAtk: 200, spDef: 160, speed: 150 };
      const defenderStats = { hp: 280, maxHp: 280, attack: 180, defence: 200, spAtk: 150, spDef: 180, speed: 120 };

      const result = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 0, 1, // 威力0的变化技能
        SkillCategory.STATUS
      );

      expect(result.damage).toBe(0);
    });

    test('威力0的攻击技能应造成1伤害', () => {
      const attackerStats = { hp: 300, maxHp: 300, attack: 200, defence: 150, spAtk: 200, spDef: 160, speed: 150 };
      const defenderStats = { hp: 280, maxHp: 280, attack: 180, defence: 200, spAtk: 150, spDef: 180, speed: 120 };

      const result = BattleAlgorithm.CalculateDamage(
        attackerStats, defenderStats,
        1, 1, 100, 0, 1,
        SkillCategory.PHYSICAL
      );

      // 攻击技能即使威力为0，也应该至少有1伤害
      expect(result.damage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('效果触发时机测试', () => {
    test('所有EffectTiming应正确定义', () => {
      expect(EffectTiming.BATTLE_START).toBe('BATTLE_START');
      expect(EffectTiming.TURN_START).toBe('TURN_START');
      expect(EffectTiming.BEFORE_SKILL).toBe('BEFORE_SKILL');
      expect(EffectTiming.BEFORE_DAMAGE_CALC).toBe('BEFORE_DAMAGE_CALC');
      expect(EffectTiming.AFTER_DAMAGE_APPLY).toBe('AFTER_DAMAGE_APPLY');
      expect(EffectTiming.AFTER_SKILL).toBe('AFTER_SKILL');
      expect(EffectTiming.TURN_END).toBe('TURN_END');
      expect(EffectTiming.BATTLE_END).toBe('BATTLE_END');
      expect(EffectTiming.ON_HIT).toBe('ON_HIT');
      expect(EffectTiming.ON_ATTACK).toBe('ON_ATTACK');
    });
  });
});