/**
 * 被动特性运行时
 * 按官方精灵特效表（config/data/xml/skill_effects.xml 的 NewSe 说明）实现原子被动里不生效的特性：
 * 命中、暴击、伤害倍率、减伤、致死保护、受击触发、重生等。被接管的特性不再执行原子效果，
 * 由 SkillEffectRuntime 在命中、暴击、威力、伤害、出手后和回合结束时调用本模块。
 * 特性参数取自精灵已注册的被动（effectCounters._registered_passives 的 argValues）。
 */

import { Logger } from '../../../shared/utils';

const REGISTERED = '_registered_passives';

/** 由本模块实现的被动特性 */
const HANDLED = new Set<number>([
  2007, 2008, 2012, 2016, 2020, 2021, 2022, 2024, 2026, 2027, 2028, 2029, 2030, 2031, 2035, 2036, 2038, 2039,
  2040, 2044, 2045, 2046, 2047, 2048, 2049, 2050, 2052, 2055, 2057, 2060, 2061, 2062, 2063, 2064, 2065, 2070,
  2072, 2076, 2079, 2081, 2082, 2098, 2185, 2772,
]);

/** 山神守护（低血守护的显示状态） */
const GUARDIAN_STATUS = 12;

export class PassiveRuntime {
  public static Handles(effectId: number): boolean {
    return HANDLED.has(effectId);
  }

  /** 精灵身上某个被动的参数，没有该被动时返回 undefined */
  private static Args(pet: any, effectId: number): number[] | undefined {
    const passives: any[] = pet?.effectCounters?.[REGISTERED] || [];
    const passive = passives.find(p => p.effectId === effectId);
    return passive ? (passive.argValues || []).map(Number) : undefined;
  }

  private static State(pet: any): Record<string, any> {
    if (!pet.passiveStates) pet.passiveStates = {};
    return pet.passiveStates;
  }

  private static Chance(percent: number): boolean {
    return percent >= 100 || Math.random() * 100 < percent;
  }

  private static Stage(pet: any, stat: number, change: number): void {
    if (stat < 0 || stat > 5 || !change) return;
    if (change < 0 && require('./BossSpecialRules').BossSpecialRules.IsStatDownImmune(pet)) return;
    pet.battleLevels[stat] = Math.max(-6, Math.min(6, (pet.battleLevels[stat] || 0) + change));
  }

  private static Heal(pet: any, amount: number): void {
    if (amount > 0 && pet.hp > 0) pet.hp = Math.min(pet.maxHp, pet.hp + Math.floor(amount));
  }

  private static Attack(skill: any): boolean {
    return skill?.category === 1 || skill?.category === 2;
  }

  // ==================== 特效免疫 ====================

  /** 2050 免疫列出的技能效果ID；2185 免疫列出技能的特效 */
  public static Blocked(defender: any, effectId: number, skill: any): boolean {
    const effects = this.Args(defender, 2050);
    if (effects && effects.includes(effectId)) return true;
    const skills = this.Args(defender, 2185);
    return !!skills && skills.includes(Number(skill?.id));
  }

  // ==================== 出场 ====================

  /** 回合开始：2026 固定属性加成（每只精灵一次），2070 记录对手能力等级 */
  public static OnTurnStart(battle: any): void {
    for (const side of ['player', 'enemy']) {
      const pet = battle[side], foe = battle[side === 'player' ? 'enemy' : 'player'];
      if (!pet) continue;
      const bonus = this.Args(pet, 2026);
      if (bonus && !this.State(pet).flatBonus) {
        this.State(pet).flatBonus = true;
        const field = ['hp', 'attack', 'defence', 'spAtk', 'spDef', 'speed'][bonus[0]];
        if (field === 'hp') { pet.maxHp += bonus[1] || 0; pet.hp += bonus[1] || 0; }
        else if (field) pet[field] = (pet[field] || 0) + (bonus[1] || 0);
      }
      if (foe && this.Args(pet, 2070)) this.State(pet).foeLevels = [...(foe.battleLevels || [])];
    }
  }

  // ==================== 命中 ====================

  /**
   * 命中前：2024 指定技能必定落空，2052 轮换免疫，2772 攻击方先消除对手回合类效果。
   * 返回 false 表示本次落空，undefined 表示继续常规判定。
   */
  public static BeforeHit(battle: any, attacker: any, defender: any, skill: any, clearTurnEffects: (pet: any) => void): false | undefined {
    if (this.Args(attacker, 2772)) clearTurnEffects(defender);
    const dodge = this.Args(defender, 2024);
    if (dodge && dodge.includes(Number(skill.id))) return false;
    if (this.Args(defender, 2052)) {
      const phase = (battle.turn - 1) % 3; // 第3n+1回合免疫特殊，3n+2免疫物理，3n+3免疫属性
      if ([2, 1, 4][phase] === skill.category) return false;
    }
    return undefined;
  }

  /** 命中率倍率：2007 对自身的命中率-n%，2029 自身命中率+n% */
  public static AccuracyScale(attacker: any, defender: any): number {
    const dodge = this.Args(defender, 2007)?.[0] || 0;
    const bonus = this.Args(attacker, 2029)?.[0] || 0;
    return (1 - dodge / 100) * (1 + bonus / 100);
  }

  /** 落空：2082 闪避回血（回合结束时结算） */
  public static OnMiss(defender: any): void {
    const heal = this.Args(defender, 2082);
    if (heal) this.State(defender).dodgeHeal = (this.State(defender).dodgeHeal || 0) + (heal[0] || 0);
  }

  // ==================== 暴击 ====================

  /**
   * 暴击：2008 固定n/16、2045 固定1/n、2030/2057 额外+n/16、2064 受到暴击率-n/16。
   * base 为原有判定，critRate 为技能基础暴击率（x/16）。
   */
  public static Crit(attacker: any, defender: any, critRate: number, base: () => boolean, extraBonus: number): boolean {
    const fixed = this.Args(attacker, 2008);
    if (fixed) return Math.random() * 16 < (fixed[0] || 0);
    const divisor = this.Args(attacker, 2045);
    if (divisor) return divisor[0] > 0 && Math.random() * divisor[0] < 1;
    let bonus = extraBonus + (this.Args(attacker, 2030)?.[0] || 0);
    const statusCrit = this.Args(attacker, 2057);
    if (statusCrit && (defender.statusDurations?.[statusCrit[0]] || 0) > 0) bonus += statusCrit[1] || 0;
    const rate = Math.max(1, critRate || 1);
    let crit = base() || (bonus > 0 && (rate >= 16 || Math.random() * (16 - rate) < bonus));
    const reduce = this.Args(defender, 2064)?.[0] || 0;
    if (crit && reduce > 0) crit = Math.random() * (rate + bonus) < Math.max(0, rate + bonus - reduce);
    return crit;
  }

  // ==================== 威力与伤害 ====================

  /** 2079 受到高伤后下一招威力翻倍（使用后消耗） */
  public static Power(attacker: any, power: number): number {
    if (!this.State(attacker).nextDouble) return power;
    delete this.State(attacker).nextDouble;
    return power * 2;
  }

  /**
   * 攻击伤害修正（kind=attack）：攻击方的加成/削减，双方倍率，防守方的减伤、免疫与护盾。
   * 致死保护在 Lethal 中处理（所有伤害类型都适用）。
   */
  public static AttackDamage(battle: any, attacker: any, defender: any, skill: any, damage: number): number {
    if (damage <= 0) return damage;
    // ---- 攻击方 ----
    const typeBonus = this.Args(attacker, 2028);
    if (typeBonus && (skill.type || 8) === typeBonus[0]) damage = Math.floor(damage * (100 + (typeBonus[1] || 0)) / 100);
    const plus = this.Args(attacker, 2038);
    if (plus) damage = Math.floor(damage * (100 + (plus[0] || 0)) / 100);
    const category = this.Args(attacker, 2065);
    if (category && category[0] === skill.category) damage = Math.floor(damage * (100 + (category[1] || 0)) / 100);
    const minus = this.Args(attacker, 2076);
    if (minus) damage = Math.floor(damage * (100 - (minus[0] || 0)) / 100);
    const flat = this.Args(attacker, skill.category === 1 ? 2062 : 2063);
    if (flat && this.Chance(flat[0])) damage += flat[1] || 0;
    // ---- 双方 ----
    for (const pet of [attacker, defender]) {
      const both = this.Args(pet, 2055);
      if (both) damage = Math.floor(damage * (both[0] || 1));
      const lower = this.Args(pet, 2047);
      if (lower) damage = Math.floor(damage * (100 - (lower[0] || 0)) / 100);
    }
    // ---- 防守方 ----
    const immuneType = this.Args(defender, 2048);
    if (immuneType && immuneType[0] === skill.category) return this.NoDamage(defender, 'attackType');
    const multiply = this.Args(defender, 2022);
    if (multiply) damage = Math.floor(damage * (multiply[0] || 1));
    const even = this.Args(defender, 2039);
    if (even && damage % 2 === 0) damage *= even[0] || 1;
    const odd = this.Args(defender, 2040);
    if (odd && damage % 2 === 1 && odd[0] > 0) damage = Math.floor(damage / odd[0]);
    const guard = this.State(defender).hitGuard;
    if (guard && guard.until >= battle.turn) damage = Math.floor(damage * (100 - guard.percent) / 100);
    const guardian = this.State(defender).guardian;
    if (guardian && guardian.until >= battle.turn) damage = Math.floor(damage / 10);
    const reduce = this.Args(defender, 2060);
    if (reduce && this.Chance(reduce[0])) damage = Math.max(0, damage - (reduce[1] || 0));
    const block = this.Args(defender, 2061);
    if (block && this.Chance(block[0])) return this.NoDamage(defender, 'chanceBlock');
    return damage;
  }

  /** 所有伤害类型都适用的护盾：2020 技能破防、2027 属性顺序破防、2036 轮换属性护盾 */
  public static Shield(battle: any, defender: any, skill: any, damage: number): number {
    if (damage <= 0) return damage;
    const unlock = this.Args(defender, 2020);
    if (unlock && !this.State(defender).unlocked) {
      if (!unlock.includes(Number(skill.id))) return this.NoDamage(defender, 'skillShield');
      this.State(defender).unlocked = true;
    }
    const sequence = (this.Args(defender, 2027) || []).filter(t => t > 0);
    if (sequence.length) {
      const phase = this.State(defender).sequence || 0;
      if ((skill.type || 8) !== sequence[phase % sequence.length]) return this.NoDamage(defender, 'typeSequence');
      this.State(defender).sequence = phase + 1;
    }
    const rotation = (this.Args(defender, 2036) || []).filter(t => t > 0);
    if (rotation.length && (skill.type || 8) !== rotation[Math.floor((battle.turn - 1) / 5) % rotation.length])
      return this.NoDamage(defender, 'rotatingType');
    return damage;
  }

  /** 致死保护：2021 指定技能外余1、2031 n%余m、2046 五回合不死（余1后回满） */
  public static Lethal(battle: any, defender: any, skill: any, damage: number): number {
    if (damage < defender.hp || defender.hp <= 0) return damage;
    const except = this.Args(defender, 2021);
    if (except && !except.includes(Number(skill.id))) return Math.max(0, defender.hp - 1);
    const survive = this.Args(defender, 2031);
    if (survive && this.Chance(survive[0])) return Math.max(0, defender.hp - Math.max(1, survive[1] || 1));
    if (this.Args(defender, 2046)) {
      const state = this.State(defender);
      if (battle.turn - (state.immortalFrom ?? 1) < 5) {
        state.immortalFrom = battle.turn;
        state.immortalHeal = true;
        return Math.max(0, defender.hp - 1);
      }
    }
    return damage;
  }

  private static NoDamage(defender: any, reason: string): number {
    Logger.Info(`[被动特性] ${defender.name} 抵挡了伤害(${reason})`);
    return 0;
  }

  // ==================== 出手后 ====================

  /** 防守方受到本次技能后的被动；damage 为实际扣除的体力 */
  public static AfterHit(battle: any, defender: any, skill: any, damage: number): void {
    const state = this.State(defender);
    if (state.immortalHeal) {
      delete state.immortalHeal;
      defender.hp = defender.maxHp;
    }
    if (defender.hp <= 0) return;
    if (this.Attack(skill)) {
      const special = this.Args(defender, 2012);
      if (special && skill.category === 2 && (state.spBoosts || 0) < (special[1] || 0)) {
        state.spBoosts = (state.spBoosts || 0) + 1;
        this.Stage(defender, special[0], 1);
      }
      const boost = this.Args(defender, 2035);
      if (boost && this.Chance(boost[1])) this.Stage(defender, boost[0], 1);
      const guard = this.Args(defender, 2049);
      if (guard) state.hitGuard = { until: battle.turn + (guard[0] || 1), percent: guard[1] || 0 };
    }
    if (damage > 0) {
      const bind = this.Args(defender, 2016);
      if (bind) defender.battleLevels[bind[0]] = Math.min(6, Math.max(defender.battleLevels[bind[0]] || 0,
        Math.floor((defender.maxHp - defender.hp) * 8 / defender.maxHp)));
      const low = this.Args(defender, 2072);
      if (low && damage < (low[0] || 0)) this.Heal(defender, low[0]);
      const high = this.Args(defender, 2079);
      if (high && damage > (high[0] || 0)) state.nextDouble = true;
      const first = this.Args(defender, 2098);
      if (first && damage > (first[0] || 0)) state.firstTurn = battle.turn + 1;
      const guardian = this.Args(defender, 2081);
      if (guardian && defender.hp * 100 < defender.maxHp * (guardian[0] || 0)) {
        state.guardian = { until: battle.turn + (guardian[1] || 1) };
        defender.statusDurations[GUARDIAN_STATUS] = guardian[1] || 1;
      }
    }
  }

  /** 体力归零后：2044 重生（体力、PP回满），可触发n次 */
  public static Revive(pet: any): boolean {
    if (!pet || pet.hp > 0) return false;
    const revive = this.Args(pet, 2044);
    const state = this.State(pet);
    if (!revive || (state.revives || 0) >= (revive[0] || 1)) return false;
    state.revives = (state.revives || 0) + 1;
    pet.hp = pet.maxHp;
    if (Array.isArray(pet.skillPP)) pet.skillPP = pet.skillPP.map((pp: number, i: number) =>
      require('../../../shared/config/game/GameConfig').GameConfig.GetSkillById(pet.skills[i])?.MaxPP || pp);
    Logger.Info(`[被动特性] ${pet.name} 重生(${state.revives}/${revive[0] || 1})`);
    return true;
  }

  /** 先制：2098 受到高伤后下回合必定先手 */
  public static Priority(battle: any, pet: any): number {
    return this.State(pet).firstTurn === battle.turn ? 100 : 0;
  }

  // ==================== 回合结束 ====================

  public static TurnEnd(battle: any): void {
    for (const side of ['player', 'enemy']) {
      const pet = battle[side], foe = battle[side === 'player' ? 'enemy' : 'player'];
      if (!pet?.passiveStates) continue;
      const state = pet.passiveStates;
      if (state.dodgeHeal) { this.Heal(pet, state.dodgeHeal); delete state.dodgeHeal; }
      if (state.foeLevels && foe) {
        (foe.battleLevels || []).forEach((level: number, i: number) => {
          const gain = level - (state.foeLevels[i] || 0);
          if (gain > 0) this.Stage(pet, i, gain);
        });
        delete state.foeLevels;
      }
      this.Revive(pet);
    }
  }
}
