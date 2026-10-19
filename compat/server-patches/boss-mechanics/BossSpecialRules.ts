/**
 * BOSS特殊规则系统
 * 从配置文件读取并应用BOSS特殊规则，只作用于BOSS战里的BOSS本体：
 * 顺序破防、破防与击杀条件、免疫、闪避、减伤、PP耗尽、周几规则、谱尼封印等。
 * 规则状态保存在本场BOSS精灵对象上，玩家自己的同种精灵和野怪不受影响。
 */

import { Logger } from '../../../shared/utils';
import { BossAbilityConfig } from './BossAbility/BossAbilityConfig';
import { GameConfig } from '../../../shared/config/game/GameConfig';

/** 每个BOSS配置条目可选的 mechanics 字段 */
export interface IBossMechanics {
  /** 'sameLifeDeath'=同生共死（HP差值固定伤害），'percentDamage'=百分比削血 */
  immune?: string[];
  /** true=免疫全部异常；数组=只免疫列出的异常状态ID */
  statusImmune?: boolean | number[];
  statDownImmune?: boolean;
  /** 非必中技能对其命中前的额外闪避率（百分比） */
  dodgePercent?: number;
  /** 受到的伤害减免百分比 */
  damageReductionPercent?: number;
  /** 不受属性克制影响 */
  typeNeutral?: boolean;
  /** 出场能力等级 [攻击, 防御, 特攻, 特防, 速度, 命中] */
  startStages?: number[];
  /** 被物理攻击命中后令攻击方陷入异常 */
  onPhysicalHitStatus?: { status: number; chance: number; turns: number };
  /** 体力归零时若自身没有异常状态则回满 */
  reviveUnlessStatus?: boolean;
  /** 只有必中技能能命中（谱尼虚无） */
  onlyMustHit?: boolean;
  /** 不受直接伤害，只受攻击技能附加异常的持续伤害（谱尼圣洁） */
  directDamageImmune?: boolean;
  /** 属性技能施加的异常无效（谱尼圣洁） */
  statusFromAttacksOnly?: boolean;
  /** 单次物理/特殊攻击伤害超过该值时攻击者被秒杀（谱尼能量） */
  counterKillThreshold?: number;
  /** 体力低于该百分比时只使用攻击技能（配合低血秒杀，原版“不管出什么招都必死”） */
  lowHpAttackPercent?: number;
  /** 额外的命数：体力归零后满血满PP复活的次数 */
  extraLives?: number;
  /** 体力低于该百分比时攻击必定致命一击（墨杜萨、菲尼克斯光芒之影） */
  lowHpCritPercent?: number;
  /** 开场先用的技能；对手等级不低于 minFoeLevel 时才用（巴弗洛遇到等级高的精灵先放镇魂歌） */
  openingSkill?: { skillId: number; minFoeLevel?: number };
  /** 每失去一条命后依次切换的形态（克拉尼特两形态、菲尼克斯三分身）：规则、特性、技能整体替换 */
  phases?: IBossPhase[];
}

/** BOSS的一种形态 */
export interface IBossPhase {
  name?: string;
  mechanics?: IBossMechanics;
  abilities?: (number | { id: number; args?: number[] })[];
  skills?: number[];
}

type DamageKind = 'attack' | 'fixed' | 'ohko';

/**
 * BOSS特殊规则管理器
 */
export class BossSpecialRules {
  // ==================== BOSS标记 ====================

  /**
   * 为BOSS战的BOSS精灵挂上本场的特性、规则和状态（按当天星期解析周几规则）
   */
  public static DecorateBoss(pet: any, bossConfig: any): any {
    const weekday = new Date().getDay();
    const abilities = bossConfig.weekdayAbilities?.[weekday] ?? bossConfig.abilities ?? [];
    pet.bossAbilityEntries = abilities.map((a: any) => typeof a === 'number' ? { id: a } : { id: a.id, args: a.args });
    const mechanics: IBossMechanics = { ...(bossConfig.mechanics || {}), ...(bossConfig.weekdayMechanics?.[weekday] || {}) };
    const phases = mechanics.phases || [];
    delete mechanics.phases;
    pet.bossMechanics = mechanics;
    pet.bossState = { sequencePhase: 0, shieldBroken: false, livesLeft: mechanics.extraLives || 0, phases, phase: 0, opened: false };
    (mechanics.startStages || []).forEach((stage, index) => {
      if (stage) pet.battleLevels[index] = stage;
    });
    Logger.Info(`[BossSpecialRules] BOSS规则: ${pet.name} Map=${bossConfig.mapId}/${bossConfig.param2}, ` +
      `特性=[${pet.bossAbilityEntries.map((e: any) => e.id).join(',')}], 规则=${JSON.stringify(mechanics)}`);
    return pet;
  }

  private static Mechanics(pet: any): IBossMechanics | undefined {
    return pet?.bossMechanics;
  }

  // ==================== 免疫 ====================

  /**
   * 检查BOSS是否免疫同生共死
   */
  public static IsSameLifeDeathImmune(pet: any): boolean {
    return !!this.Mechanics(pet)?.immune?.includes('sameLifeDeath');
  }

  /**
   * 检查目标是否免疫某个异常状态（被动免疫标记、BOSS规则或技能的持续免疫）
   * @param skillId 施加异常的技能，用于判断是否为属性技能
   */
  public static IsStatusImmune(pet: any, status: number, skillId?: number): boolean {
    if (pet?.immuneFlags?.status || require('./SkillEffectRuntime').SkillEffectRuntime.IsStatusImmune(pet || {})) return true;
    const mechanics = this.Mechanics(pet);
    if (!mechanics) return false;
    if (mechanics.statusImmune === true) return true;
    if (Array.isArray(mechanics.statusImmune) && mechanics.statusImmune.includes(status)) return true;
    return !!mechanics.statusFromAttacksOnly && !!skillId && GameConfig.GetSkillById(skillId)?.Category === 4;
  }

  /**
   * 低血必定致命一击（lowHpCritPercent）
   */
  public static IsForcedCrit(pet: any): boolean {
    const percent = this.Mechanics(pet)?.lowHpCritPercent;
    return !!percent && pet.hp > 0 && pet.hp * 100 < pet.maxHp * percent;
  }

  /**
   * 镇魂歌等延迟致死效果：完全免疫异常的目标不受影响（经典版塞维尔镇魂歌无效，魔狮迪露有效）
   */
  public static IsRequiemImmune(pet: any): boolean {
    return !!(pet?.immuneFlags?.status || this.Mechanics(pet)?.statusImmune === true);
  }

  /**
   * 检查目标是否免疫能力下降（被动免疫标记、BOSS规则或技能的持续免疫）
   */
  public static IsStatDownImmune(pet: any): boolean {
    return !!(pet?.immuneFlags?.statDown || this.Mechanics(pet)?.statDownImmune ||
      require('./SkillEffectRuntime').SkillEffectRuntime.IsStatDownImmune(pet || {}));
  }

  // ==================== 命中 ====================

  /**
   * BOSS受击命中修正（必中技能已在调用前放行，作用于自身的技能不受影响）
   * @returns false=本次未命中；undefined=按常规命中判定
   */
  public static CheckBossHit(defender: any, skill: any): false | undefined {
    const mechanics = this.Mechanics(defender);
    const skillConfig: any = GameConfig.GetSkillById(skill.id);
    if (!mechanics || Number(skillConfig?.AtkType) === 3) return undefined;
    if (mechanics.onlyMustHit) {
      Logger.Info(`[BossSpecialRules] ${defender.name} 只会被必中技能命中`);
      return false;
    }
    if (mechanics.dodgePercent && Math.random() * 100 < mechanics.dodgePercent) {
      Logger.Info(`[BossSpecialRules] ${defender.name} 闪避了攻击 (${mechanics.dodgePercent}%)`);
      return false;
    }
    return undefined;
  }

  /**
   * 攻击未命中：顺序破防BOSS按原版规则，正确属性的攻击落空也会消耗当前顺序
   */
  public static OnAttackMissed(defender: any, skill: any): void {
    if (!this.Mechanics(defender) || (skill.category !== 1 && skill.category !== 2)) return;
    const required = this.RequiredSequenceType(defender);
    if (required !== undefined && (skill.type || 8) === required) {
      this.AdvanceSequence(defender, required, '落空');
    }
  }

  // ==================== 伤害 ====================

  /**
   * 修正对BOSS造成的伤害；普通攻击、固定伤害和秒杀都经过这里
   * @param info.mode 固定伤害模式（hp_difference/percent/fixed）
   * @param info.effectiveness 属性克制倍率
   */
  public static ModifyDamageToBoss(
    battle: any,
    attacker: any,
    defender: any,
    skill: any,
    damage: number,
    kind: DamageKind,
    info: { mode?: string; effectiveness?: number } = {}
  ): number {
    const mechanics = this.Mechanics(defender);
    if (!mechanics || defender !== battle.enemy || damage <= 0) return damage;

    if (kind === 'fixed') {
      if (info.mode === 'hp_difference' && mechanics.immune?.includes('sameLifeDeath')) {
        Logger.Info(`[BossSpecialRules] ${defender.name} 免疫同生共死`);
        return 0;
      }
      if (info.mode === 'percent' && mechanics.immune?.includes('percentDamage')) {
        Logger.Info(`[BossSpecialRules] ${defender.name} 免疫百分比伤害`);
        return 0;
      }
    }

    // 秒杀同样受谱尼封印、顺序破防的限制，只是不吃减伤
    if (mechanics.directDamageImmune) {
      Logger.Info(`[BossSpecialRules] ${defender.name} 只受攻击技能附加异常的伤害`);
      return 0;
    }
    damage = require('./PuniSealBattle').ModifyPuniDamage(battle, defender, skill.type || 8, damage);

    const required = this.RequiredSequenceType(defender);
    if (required !== undefined) {
      if ((skill.type || 8) !== required) {
        Logger.Info(`[BossSpecialRules] 顺序破防失败: ${defender.name} 需要属性${required}, 技能属性=${skill.type || 8}, 伤害归零`);
        return 0;
      }
      this.AdvanceSequence(defender, required, '命中');
    }

    if (kind !== 'ohko') {
      if (kind === 'attack' && mechanics.typeNeutral && info.effectiveness && info.effectiveness !== 1) {
        damage = Math.floor(damage / info.effectiveness);
      }
      if (mechanics.damageReductionPercent) {
        damage = Math.max(1, Math.floor(damage * (100 - mechanics.damageReductionPercent) / 100));
      }
    }

    return this.ApplyKillCondition(attacker, defender, skill, damage);
  }

  /**
   * 破防/击杀条件：破防前免疫伤害；只能由指定精灵的指定技能击杀，其他致死伤害保留1血
   */
  private static ApplyKillCondition(attacker: any, defender: any, skill: any, damage: number): number {
    const rule: any = BossAbilityConfig.Instance.GetSpecialKillConditionRule(defender.petId);
    if (!rule) return damage;
    const state = defender.bossState;
    if (skill.id === rule.breakSkillId && !state.shieldBroken) {
      state.shieldBroken = true;
      Logger.Info(`[BossSpecialRules] ${defender.name} 被${rule.breakSkillName || rule.breakSkillId}破防`);
    } else if (rule.shieldUntilBreak && !state.shieldBroken) {
      Logger.Info(`[BossSpecialRules] ${defender.name} 未破防，伤害归零`);
      return 0;
    }
    if (damage >= defender.hp && !(state.shieldBroken && skill.id === rule.killSkillId && attacker.petId === rule.requiredPetId)) {
      Logger.Info(`[BossSpecialRules] ${defender.name} 只能被${rule.requiredPetName || rule.requiredPetId}的${rule.killSkillName || rule.killSkillId}击败，保留1血`);
      return Math.max(0, defender.hp - 1);
    }
    return damage;
  }

  private static RequiredSequenceType(defender: any): number | undefined {
    const rule = BossAbilityConfig.Instance.GetSequentialTypeBreakRule(defender.petId);
    if (!rule?.typeSequence?.length) return undefined;
    return rule.typeSequence[defender.bossState.sequencePhase % rule.typeSequence.length];
  }

  private static AdvanceSequence(defender: any, required: number, reason: string): void {
    defender.bossState.sequencePhase++;
    Logger.Info(`[BossSpecialRules] 顺序破防${reason}: ${defender.name} 属性${required}，进入第${defender.bossState.sequencePhase}步`);
  }

  /**
   * BOSS受到直接攻击并结算体力后：能量反杀、物理受击异常、体力结算
   */
  public static AfterBossDamaged(battle: any, attacker: any, defender: any, skill: any, damage: number): void {
    const mechanics = this.Mechanics(defender);
    if (!mechanics || defender !== battle.enemy) return;
    const attack = skill.category === 1 || skill.category === 2;
    if (mechanics.counterKillThreshold && attack && damage > mechanics.counterKillThreshold && attacker.hp > 0) {
      attacker.hp = 0;
      Logger.Info(`[BossSpecialRules] ${defender.name} 受到${damage}点伤害，反杀${attacker.name}`);
    }
    const onHit = mechanics.onPhysicalHitStatus;
    if (onHit && skill.category === 1 && damage > 0 && attacker.hp > 0 &&
        !(attacker.status > 0) && !this.IsStatusImmune(attacker, onHit.status) && Math.random() * 100 < onHit.chance) {
      attacker.statusTurns = onHit.turns;
      attacker.status = onHit.status;
      Logger.Info(`[BossSpecialRules] ${defender.name} 受到物理攻击，${attacker.name} 陷入异常${onHit.status}`);
    }
    this.SettleBossHp(battle, 'attack');
  }

  /**
   * 结算BOSS体力归零：谱尼多命/轮回、额外命数、持续伤害不能致死、无异常时复活
   * @param source 'attack'=直接攻击后；'dot'=回合开始/结束的持续伤害等
   */
  public static SettleBossHp(battle: any, source: 'attack' | 'dot'): void {
    const boss = battle?.enemy;
    const mechanics = this.Mechanics(boss);
    if (!mechanics || boss.hp > 0) return;
    require('./PuniSealBattle').ResolvePuniSurvival(battle, boss);
    if (boss.hp <= 0 && boss.bossState.livesLeft > 0) {
      boss.bossState.livesLeft--;
      boss.hp = boss.maxHp;
      Logger.Info(`[BossSpecialRules] ${boss.name} 复活，剩余额外命数=${boss.bossState.livesLeft}`);
      this.EnterNextPhase(boss);
    }
    if (boss.hp > 0) {
      this.RestorePP(boss);
      return;
    }
    const rule: any = BossAbilityConfig.Instance.GetSpecialKillConditionRule(boss.petId);
    if (source === 'dot' && rule?.dotCannotKill) {
      boss.hp = 1;
      Logger.Info(`[BossSpecialRules] ${boss.name} 持续伤害无法致死，保留1血`);
      return;
    }
    if (mechanics.reviveUnlessStatus && !(boss.statusDurations || []).some((turns: number) => turns > 0)) {
      boss.hp = boss.maxHp;
      Logger.Info(`[BossSpecialRules] ${boss.name} 没有异常状态，体力回满`);
    }
  }

  /**
   * 复活后切换到下一形态：异常、能力等级和回合类效果清空，规则、特性、技能换成新形态的
   */
  private static EnterNextPhase(boss: any): void {
    const phases: IBossPhase[] = boss.bossState.phases || [];
    if (!phases.length) return;
    const phase = phases[Math.min(boss.bossState.phase, phases.length - 1)];
    boss.bossState.phase++;
    boss.bossMechanics = { ...(phase.mechanics || {}) };
    boss.status = undefined;
    boss.statusDurations.fill(0);
    boss.battleLevels.fill(0);
    (phase.mechanics?.startStages || []).forEach((stage, index) => {
      if (stage) boss.battleLevels[index] = stage;
    });
    delete boss.effectStates;
    delete boss.passiveStates;
    if (phase.skills?.length) {
      boss.skills = [...phase.skills];
      boss.skillPP = phase.skills.map((id: number) => GameConfig.GetSkillById(id)?.MaxPP || 0);
    }
    boss.bossAbilityEntries = (phase.abilities || []).map((a: any) => typeof a === 'number' ? { id: a } : { id: a.id, args: a.args });
    boss.immuneFlags = {};
    require('./BossAbility/BossAbilityManager').BossAbilityManager.InitializeBossAbilities(boss, boss.bossAbilityEntries);
    Logger.Info(`[BossSpecialRules] ${boss.name} 进入形态: ${phase.name || boss.bossState.phase}`);
  }

  /**
   * 回合结束：谱尼生命封印回血
   */
  public static OnTurnEnd(battle: any): void {
    if (this.Mechanics(battle?.enemy)) require('./PuniSealBattle').HealPuniLifeSeal(battle);
  }

  // ==================== PP ====================

  /**
   * BOSS战里BOSS选技能：全部技能PP耗尽时本回合不行动（返回0）；低血秒杀阶段只用攻击技能
   */
  public static SelectBossSkill(battle: any, skillId: number): number {
    const boss = battle?.enemy;
    if (!this.Mechanics(boss) || !Array.isArray(boss.skillPP)) return skillId;
    if (!boss.skillPP.some((pp: number) => pp > 0)) {
      Logger.Info(`[BossSpecialRules] ${boss.name} 技能PP耗尽，无法行动`);
      return 0;
    }
    const opening = boss.bossMechanics.openingSkill;
    if (opening && !boss.bossState.opened) {
      boss.bossState.opened = true;
      const index = boss.skills.indexOf(opening.skillId);
      if (index >= 0 && boss.skillPP[index] > 0 && (battle.player?.level || 0) >= (opening.minFoeLevel || 0)) return opening.skillId;
    }
    const lowHp = boss.bossMechanics.lowHpAttackPercent;
    if (lowHp && boss.hp * 100 < boss.maxHp * lowHp && GameConfig.GetSkillById(skillId)?.Category === 4) {
      const attack = boss.skills.find((id: number, i: number) => boss.skillPP[i] > 0 && GameConfig.GetSkillById(id)?.Category !== 4);
      if (attack) skillId = attack;
    }
    return skillId;
  }

  /**
   * BOSS真正出手时消耗PP（睡眠、麻痹等无法行动的回合不消耗）
   */
  public static SpendBossPP(battle: any, attacker: any, skill: any): void {
    if (attacker !== battle?.enemy || !this.Mechanics(attacker) || !Array.isArray(attacker.skillPP)) return;
    const index = attacker.skills.indexOf(skill.id);
    if (index >= 0 && attacker.skillPP[index] > 0) attacker.skillPP[index]--;
  }

  private static RestorePP(boss: any): void {
    if (!Array.isArray(boss.skillPP)) return;
    boss.skills.forEach((skillId: number, index: number) => {
      boss.skillPP[index] = GameConfig.GetSkillById(skillId)?.MaxPP || boss.skillPP[index];
    });
  }

  // ==================== 周几规则 ====================

  /**
   * 验证周几出现规则的挑战条件（在战斗结束时调用）
   * @param defenderId 防御方精灵ID
   * @param mapId 当前地图ID
   * @param roundCount 战斗回合数
   * @param isCriticalHit 是否致命一击击败
   * @returns 是否满足挑战条件
   */
  public static ValidateWeekdayScheduleCondition(
    defenderId: number,
    mapId: number,
    roundCount: number,
    isCriticalHit: boolean
  ): { valid: boolean; condition?: string; conditionDesc?: string } {
    // 检查是否为周几出现规则BOSS
    if (!BossAbilityConfig.Instance.IsWeekdayScheduleBoss(defenderId)) {
      return { valid: true }; // 不是周几规则BOSS，默认通过
    }

    // 获取当前周几
    const now = new Date();
    const weekday = now.getDay(); // 0=周日, 1=周一, ..., 6=周六

    // 获取当前周几的规则
    const schedule = BossAbilityConfig.Instance.GetWeekdayScheduleByWeekday(defenderId, weekday);
    if (!schedule) {
      Logger.Warn(
        `[BossSpecialRules] 周几出现规则: BOSS=${defenderId}, ` +
        `周几=${weekday}, 未找到对应规则`
      );
      return { valid: false };
    }

    // 检查地图是否匹配
    if (schedule.mapId !== mapId) {
      Logger.Info(
        `[BossSpecialRules] 周几出现规则-地图不匹配: BOSS=${defenderId}, ` +
        `周几=${weekday}, 期望地图=${schedule.mapId}(${schedule.mapName}), ` +
        `实际地图=${mapId}`
      );
      return { valid: false, condition: schedule.condition, conditionDesc: schedule.conditionDesc };
    }

    // 验证挑战条件
    let conditionMet = false;
    switch (schedule.condition) {
      case 'criticalHit':
        // 致命一击击败
        conditionMet = isCriticalHit;
        break;

      case 'withinRounds':
        // N回合内击败
        conditionMet = roundCount <= (schedule.conditionValue || 2);
        break;

      case 'afterRounds':
        // N回合后击败
        conditionMet = roundCount > (schedule.conditionValue || 10);
        break;

      default:
        Logger.Warn(
          `[BossSpecialRules] 周几出现规则-未知条件类型: ${schedule.condition}`
        );
        conditionMet = false;
    }

    Logger.Info(
      `[BossSpecialRules] 周几出现规则验证: BOSS=${defenderId}, ` +
      `周几=${weekday}, 地图=${schedule.mapName}, ` +
      `条件=${schedule.conditionDesc}, 回合数=${roundCount}, ` +
      `致命一击=${isCriticalHit}, 结果=${conditionMet ? '通过' : '失败'}`
    );

    return {
      valid: conditionMet,
      condition: schedule.condition,
      conditionDesc: schedule.conditionDesc
    };
  }
}
