/**
 * 技能效果运行时
 * 按官方效果ID与参数（技能的 SideEffect / SideEffectArg）实现原子效果系统中缺失或不生效的经典效果。
 * 这里接管的效果不再走原子效果配置，避免重复结算；持续效果存在精灵的 effectStates 上，由本模块按回合递减，
 * 不放进 effectCounters（那里的数值每回合都会被当作持续时间递减）。
 * 效果说明取自官方客户端 SkillXMLInfo 的 des，参数个数取自技能数据（与 SeerAPI 一致）。
 */

import { Logger } from '../../../shared/utils';
import { GameConfig } from '../../../shared/config/game/GameConfig';

interface IEntry { id: number; args: number[] }
type Kind = 'attack' | 'fixed' | 'ohko';

/** 官方各效果的参数个数（用于在多效果技能中切分 SideEffectArg） */
const ARG_COUNT: Record<number, number> = {
  1: 0, 2: 0, 3: 0, 4: 3, 5: 3, 6: 1, 7: 0, 8: 0, 9: 2, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1, 15: 1, 16: 1,
  20: 2, 21: 3, 22: 2, 28: 1, 29: 1, 30: 0, 31: 2, 32: 1, 33: 0, 34: 1, 35: 0, 36: 1, 37: 2, 38: 1, 39: 2,
  40: 0, 41: 2, 42: 2, 43: 1, 44: 1, 45: 1, 46: 1, 47: 1, 48: 1, 49: 1, 50: 1, 51: 1, 52: 1, 53: 2, 54: 2,
  55: 1, 56: 1, 57: 2, 58: 1, 59: 2, 60: 2, 61: 0, 62: 1, 63: 0, 64: 0, 65: 3, 66: 1, 67: 1, 68: 1, 69: 1,
  70: 0, 71: 0, 72: 0, 73: 1, 74: 0, 75: 0, 76: 3, 77: 2, 78: 1, 79: 0, 80: 0, 81: 1, 82: 0, 83: 0, 84: 2,
  85: 0, 86: 1, 87: 0, 88: 2, 89: 2, 90: 2, 91: 1, 92: 2, 93: 2, 94: 1, 95: 1, 96: 0, 97: 0, 98: 2, 99: 1,
  100: 0, 101: 1, 102: 0, 103: 1, 104: 2, 105: 1, 106: 1, 107: 2, 108: 2, 109: 2, 110: 3, 111: 0, 112: 0,
  113: 0, 114: 1, 115: 2, 116: 2, 117: 2, 118: 0, 119: 0, 120: 1, 121: 1, 122: 3, 123: 3, 124: 2, 125: 2,
  126: 2, 127: 2, 128: 1, 129: 1, 130: 2, 131: 1, 132: 0, 133: 1, 134: 2, 135: 1, 136: 1, 137: 0, 138: 2,
  139: 0, 140: 2, 141: 1, 142: 1, 143: 0, 144: 1, 145: 1, 146: 2, 147: 2, 148: 3, 149: 4, 150: 2, 151: 2,
  152: 3, 153: 2, 154: 2, 155: 1, 156: 1, 157: 1, 158: 3, 159: 3, 160: 1, 161: 2, 162: 1, 163: 1, 164: 3,
  165: 2, 166: 4, 167: 1, 168: 0, 169: 3, 170: 1, 171: 1, 172: 1, 173: 2, 174: 5, 175: 3, 176: 1, 177: 2,
  178: 2, 179: 1, 180: 0, 181: 4, 182: 4, 183: 2, 184: 3, 185: 1, 186: 3, 187: 2, 188: 0, 189: 1, 190: 1,
  191: 1, 192: 1, 193: 1, 194: 3, 195: 0, 196: 6, 197: 1, 198: 2, 199: 2, 200: 2, 201: 2, 401: 0, 402: 1,
  403: 2, 404: 0, 405: 1, 406: 3, 407: 3, 408: 2, 409: 2, 410: 2, 411: 3, 412: 1, 413: 1, 414: 3, 415: 2,
  416: 3, 417: 2, 418: 2, 419: 2, 420: 1, 421: 0, 422: 1, 423: 0, 428: 1, 429: 3, 430: 2, 431: 0, 434: 2,
  436: 1, 437: 2, 438: 2, 439: 2, 441: 2, 444: 0, 445: 0, 447: 1, 448: 7, 449: 2, 450: 2, 451: 2, 453: 1,
  454: 2, 455: 2, 456: 1, 458: 1, 459: 1, 460: 2, 461: 1, 463: 2, 464: 1, 465: 4, 466: 1, 467: 2, 468: 0,
  471: 1, 472: 1, 473: 3, 474: 3, 475: 2, 476: 1, 478: 1, 482: 2, 484: 3, 485: 0, 487: 2, 488: 2, 489: 1,
  490: 3, 494: 0, 495: 2, 508: 1, 511: 3, 523: 6, 545: 3, 609: 1, 620: 2, 687: 2, 691: 1, 700: 1, 773: 0,
  797: 1, 837: 3, 935: 1, 976: 1, 1044: 1, 1083: 0, 1211: 1, 1248: 2, 1257: 1, 1470: 0, 1603: 2, 1605: 2,
  1635: 2, 1850: 2, 1901: 0, 1925: 1, 2001: 5, 2002: 0, 2003: 4, 2004: 3, 2005: 2, 2007: 1, 2008: 3, 2009: 2,
  2010: 2, 2011: 3, 2012: 3, 2013: 1, 2014: 1, 2015: 12, 2016: 3, 2017: 0, 2018: 1, 2019: 1, 2020: 2,
  2236: 1, 2237: 1
};

/** 由本模块实现的效果；28（降低对方1/n体力）只接管属性技能，攻击技能仍走原有固定伤害 */
const HANDLED = new Set<number>([
  6, 8, 9, 13, 21, 28, 29, 31, 32, 34, 35, 36, 38, 39, 41, 42, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
  57, 58, 59, 60, 61, 62, 63, 65, 66, 67, 68, 70, 71, 72, 73, 74, 75, 77, 78, 79, 80, 81, 84, 85, 86, 87, 88,
  89, 90, 92, 93, 95, 100, 103, 104, 106, 107, 108, 109, 110, 115, 116, 117, 118, 119, 120, 121, 122, 123,
  125, 126, 127, 128, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 144, 145, 146, 147, 148, 149, 151,
  152, 153, 154, 155, 159, 160, 161, 162, 163, 164, 165, 166, 167, 169, 170, 171, 172, 173, 174, 175, 176,
  177, 180, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 195, 196, 197, 198, 199, 402, 405,
  413, 418, 422, 436, 437, 438, 451, 455, 456, 467, 473,
  // 可获得精灵上原本不生效的效果
  82, 83, 91, 98, 111, 113, 129, 130, 131, 411, 415, 423, 439, 478, 523, 545, 609, 797, 837, 1901,
]);

/** 异常状态：0麻痹 1中毒 2烧伤 5冻伤 6害怕 7疲惫 8睡眠 9石化 10混乱 */
const MAIN_STATUSES = [0, 1, 2, 5, 6, 7, 8, 9, 10, 15];
const SLEEP = 8;
/** 未写明回合数的异常持续回合（与原子效果的默认值一致，官方为1~3回合） */
const STATUS_TURNS = 3;
/** 控制类异常：麻痹、害怕、疲惫、睡眠、石化、冰封。出手时扣一回合 */
const CONTROL = [0, 6, 7, 8, 9, 15];

/** 能力等级每级的倍率（防御类强化时伤害按此反算） */
const stageRatio = (stage: number) => stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);

export class SkillEffectRuntime {
  // ==================== 参数 ====================

  public static ArgCount(effectId: number): number | undefined {
    return ARG_COUNT[effectId];
  }

  public static Handles(effectId: number, skill: any): boolean {
    if (effectId === 28) return skill?.category === 4;
    return HANDLED.has(effectId);
  }

  /** 拆出技能上的全部效果及各自参数 */
  public static Entries(skill: any): IEntry[] {
    if (!skill?.sideEffect) return [];
    const ids = String(skill.sideEffect).trim().split(/\s+/).map(Number).filter(id => id > 0);
    const args = String(skill.sideEffectArg ?? '').trim().split(/\s+/).filter(Boolean).map(Number);
    const entries: IEntry[] = [];
    let offset = 0;
    for (const id of ids) {
      const count = ARG_COUNT[id] ?? 0;
      entries.push({ id, args: args.slice(offset, offset + count) });
      offset += count;
    }
    return entries;
  }

  /** 本模块实现的效果；给出 defender 时去掉其特性免疫的效果（2050/2185） */
  private static Mine(skill: any, defender?: any): IEntry[] {
    return this.Entries(skill).filter(e => this.Handles(e.id, skill) && !(defender && this.Passive.Blocked(defender, e.id, skill)));
  }

  /** 被动特性运行时 */
  private static get Passive(): any {
    return require('./PassiveRuntime').PassiveRuntime;
  }

  /** 防守方的特性免疫该效果（供原子效果跳过） */
  public static EffectBlocked(defender: any, effectId: number, skill: any): boolean {
    return !!defender && this.Passive.Blocked(defender, effectId, skill);
  }

  // ==================== 状态工具 ====================

  private static States(pet: any): Record<string, any> {
    if (!pet.effectStates) pet.effectStates = {};
    return pet.effectStates;
  }

  private static Get(pet: any, key: string): any {
    const state = pet?.effectStates?.[key];
    return state && (state.turns === undefined || state.turns > 0) ? state : undefined;
  }

  /** turns 为回合数（本回合结束时开始递减），self 表示属于自身的回合类效果（可被消除） */
  private static Put(pet: any, key: string, turns: number, data: any = {}, self = true): void {
    this.States(pet)[key] = { ...data, turns, self };
  }

  /** 只作用于自身之后出手的效果（暴击、必中、威力、伤害倍率等）：本次出手已结算，从下回合起算 */
  private static Next(n: number): number {
    return n + 1;
  }

  /** 作用于对手出手的效果（减伤、闪避、反击、免疫等）：先出手包含当前回合，后出手从下回合起算 */
  private static During(n: number, isFirst: boolean): number {
    return isFirst ? n : n + 1;
  }

  /** 依赖自身造成伤害的效果（吸血、附带异常等）：攻击技能本次伤害即生效，属性技能从下回合起算 */
  private static Own(n: number, skill: any): number {
    return skill.category === 4 ? n + 1 : n;
  }

  private static Chance(percent: number): boolean {
    return percent >= 100 || Math.random() * 100 < percent;
  }

  private static Rand(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  private static Heal(pet: any, amount: number): void {
    if (amount > 0 && pet.hp > 0) pet.hp = Math.min(pet.maxHp, pet.hp + Math.floor(amount));
  }

  /**
   * 扣体力：dot 为持续伤害（与中毒等同，不经过BOSS的伤害规则，致死由BOSS结算处理），
   * fixed/ohko 经过BOSS的伤害规则
   */
  private static Lose(battle: any, source: any, pet: any, amount: number, skill: any, kind: 'dot' | 'fixed' | 'ohko', mode = 'fixed'): void {
    amount = Math.floor(amount);
    if (amount <= 0 || pet.hp <= 0) return;
    if (kind !== 'dot') amount = this.Passive.Lethal(battle, pet, skill || {}, this.Passive.Shield(battle, pet, skill || {}, amount));
    if (kind !== 'dot' && pet.bossMechanics && battle?.enemy === pet) {
      amount = require('./BossSpecialRules').BossSpecialRules.ModifyDamageToBoss(battle, source, pet, skill || {}, amount, kind, { mode });
    }
    pet.hp = Math.max(0, pet.hp - amount);
  }

  /** 性别：1雄、2雌，取自精灵图鉴，无性别为0 */
  private static Gender(pet: any): number {
    return Number(GameConfig.GetPetById(pet?.petId)?.Gender) || 0;
  }

  /** 个体值：玩家精灵为六项平均（与面板显示一致）；野怪和BOSS没有记录，按服务端野怪固定的24 */
  private static DV(pet: any): number {
    return pet.dv ?? 24;
  }

  /** 连续使用同一技能的次数（含本次）；换技能或落空后重新计算，同一次出手多次读取结果相同 */
  private static Streak(battle: any, attacker: any, skill: any): number {
    const states = this.States(attacker);
    const run = states._streak;
    if (run && run.turn === battle.turn && run.skillId === skill.id) return run.count;
    const count = run && run.skillId === skill.id && states._lastSkill === skill.id ? run.count + 1 : 1;
    states._streak = { skillId: skill.id, count, turn: battle.turn };
    return count;
  }

  private static HasStatus(pet: any, status?: number): boolean {
    const durations = pet.statusDurations || [];
    if (status !== undefined) return (durations[status] || 0) > 0;
    return MAIN_STATUSES.some(s => (durations[s] || 0) > 0);
  }

  private static HasBuff(pet: any): boolean {
    return (pet.battleLevels || []).some((v: number) => v > 0);
  }

  private static HasDebuff(pet: any): boolean {
    return (pet.battleLevels || []).some((v: number) => v < 0);
  }

  public static IsStatusImmune(pet: any): boolean {
    return !!this.Get(pet, 'statusImmune');
  }

  public static IsStatDownImmune(pet: any): boolean {
    return !!this.Get(pet, 'statDownImmune');
  }

  /** 施加异常：免疫或已有异常时无效 */
  public static Inflict(target: any, status: number, turns: number, skillId?: number): boolean {
    if (!target || target.hp <= 0 || this.HasStatus(target)) return false;
    if (require('./BossSpecialRules').BossSpecialRules.IsStatusImmune(target, status, skillId)) return false;
    target.statusTurns = Math.max(1, turns);
    target.status = status;
    Logger.Info(`[技能效果] ${target.name} 陷入异常${status}，${turns}回合`);
    return true;
  }

  private static Stage(target: any, stat: number, change: number): void {
    if (!target || stat < 0 || stat > 5 || !change) return;
    if (change < 0 && require('./BossSpecialRules').BossSpecialRules.IsStatDownImmune(target)) return;
    target.battleLevels[stat] = Math.max(-6, Math.min(6, (target.battleLevels[stat] || 0) + change));
  }

  private static RandomStatus(target: any, list: number[], turns: number, skillId?: number): void {
    this.Inflict(target, list[Math.floor(Math.random() * list.length)], turns, skillId);
  }

  // ==================== 行动与命中 ====================

  /** 本回合被效果禁止行动：效果39令对手所选技能PP归零 */
  public static CanAct(battle: any, pet: any, skill: any): { canAct: false; reason: string } | undefined {
    this.MarkAttempt(battle, pet);
    const skip = this.Get(pet, 'skipTurn');
    const index = pet.skills?.indexOf(skill?.id) ?? -1;
    if (skip && skip.turn === battle.turn && index >= 0 && pet.skillPP?.[index] === 0) return { canAct: false, reason: 'pp' };
    return undefined;
  }

  /**
   * 出手开始：结算上一段出手（同步、禁疗），记下先后手与出手前体力；
   * 后出手方开始行动时，记下先出手方已有的控制类异常
   */
  private static MarkAttempt(battle: any, pet: any): void {
    this.CloseSegment(battle);
    battle._actor = pet;
    const foe = pet === battle.player ? battle.enemy : battle.player;
    const second = !!foe && this.States(foe)._attempted === battle.turn;
    Object.assign(this.States(pet), { _attempted: battle.turn, _first: !second, _hpAtAct: pet.hp });
    if (second) this.States(foe)._controlBefore = { turn: battle.turn, list: CONTROL.filter(s => foe.statusDurations?.[s] > 0) };
  }

  /**
   * 一段出手（或回合开始、回合结束）结束时：
   * 91 对手自己造成的能力变化同步到自身（自身对对手造成的变化不同步）；
   * 797 被禁疗的一方在自己出手中回复的体力作废
   */
  private static CloseSegment(battle: any): void {
    const actor = battle._actor;
    if (actor?.hp > 0 && this.Get(actor, 'healBlock') && actor.hp > actor.effectStates._hpAtAct) actor.hp = actor.effectStates._hpAtAct;
    for (const side of ['player', 'enemy']) {
      const pet = battle[side], foe = battle[side === 'player' ? 'enemy' : 'player'];
      const mirror = this.Get(pet, 'mirrorStages');
      if (!mirror || !foe) continue;
      if (actor !== pet) foe.battleLevels.forEach((v: number, i: number) => this.Stage(pet, i, v - mirror.foe[i]));
      mirror.foe = [...foe.battleLevels];
    }
    battle._actor = undefined;
  }

  /** 先出手方行动后才中的控制类异常：异常回合从当回合算起，当回合已过，少挡一次出手 */
  private static LateControl(battle: any, pet: any): void {
    const before = pet?.effectStates?._controlBefore;
    if (!before || before.turn !== battle.turn) return;
    for (const s of CONTROL) if (pet.statusDurations?.[s] > 0 && !before.list.includes(s)) pet.statusDurations[s]--;
  }

  /** 先制修正：效果142下回合较快出手、效果171属性技能较快出手、效果83雄性必定先手、特性2098受高伤后下回合先手 */
  public static Priority(battle: any, pet: any, skill: any): number {
    let bonus = this.Passive.Priority(battle, pet);
    if (this.Get(pet, 'nextPriority')) bonus += 1;
    if (this.Get(pet, 'alwaysFirst')) bonus += 100;
    if (skill?.category === 4 && this.Get(pet, 'statusPriority')) bonus += 1;
    return bonus;
  }

  public static ResolveHit(battle: any, attacker: any, defender: any, skill: any, isFirst: boolean, check: () => boolean): boolean {
    const attack = skill.category === 1 || skill.category === 2;
    // 478：被封印期间使用的属性技能无效
    if (skill.category === 4 && this.Get(attacker, 'statusSealed')) return this.Miss(defender, 'statusSealed');
    const targetsFoe = Number((GameConfig.GetSkillById(skill.id) as any)?.AtkType) !== 3;
    if (targetsFoe && this.Passive.BeforeHit(battle, attacker, defender, skill, (pet: any) => this.ClearTurnEffects(pet)) === false)
      return this.Miss(defender, 'passive');
    if (targetsFoe && !skill.mustHit) {
      // 52：对方本回合先手时令本方技能失效（必中技能除外）
      if (!isFirst && this.Get(defender, 'firstStrikeBlock')) return this.Miss(defender, 'firstStrikeBlock');
      if (skill.category === 1 && this.Get(defender, 'evadePhysical')) return this.Miss(defender, 'evadePhysical');
      if (skill.category === 2 && this.Get(defender, 'evadeSpecial')) return this.Miss(defender, 'evadeSpecial');
      if (skill.category === 4 && this.Get(defender, 'evadeStatus')) return this.Miss(defender, 'evadeStatus');
    }
    if (attack && this.Get(attacker, 'sureHit')) return true;
    // 特性2007回避、2029精准按倍率修正技能命中率
    const scale = targetsFoe ? this.Passive.AccuracyScale(attacker, defender) : 1;
    if (scale === 1 || skill.mustHit) return check();
    if (scale <= 0) return this.Miss(defender, 'passiveDodge');
    const accuracy = skill.accuracy;
    skill.accuracy = Math.max(0, Math.min(100, (accuracy || 100) * scale));
    try {
      return check();
    } finally {
      skill.accuracy = accuracy;
    }
  }

  private static Miss(defender: any, reason: string): false {
    Logger.Info(`[技能效果] ${defender.name} 的效果令技能落空: ${reason}`);
    return false;
  }

  // ==================== 威力与暴击 ====================

  public static Power(attacker: any, defender: any, skill: any, power: number): number {
    for (const { id, args } of this.Mine(skill, defender)) {
      switch (id) {
        case 9: { // 连续使用每次威力增加n，最高威力m（中间换技能或落空则重新计算）
          const run = this.States(attacker).consecutive;
          const count = run && run.skillId === skill.id && this.States(attacker)._lastSkill === skill.id ? run.count + 1 : 1;
          this.States(attacker).consecutive = { skillId: skill.id, count, turns: undefined, self: false };
          power = Math.min(args[1] || power, power + (args[0] || 0) * (count - 1));
          break;
        }
        case 35: // 惩罚：对方每级能力提升威力+20，最高200
          power = Math.min(200, power + 20 * (defender.battleLevels || []).reduce((s: number, v: number) => s + Math.max(0, v), 0));
          break;
        case 61: power = this.Rand(50, 150); break;
        case 70: power = this.Rand(140, 220); break;
        case 118: power = this.Rand(140, 180); break;
        case 139: { // 50%威力301-350、30%威力101-300、20%威力5-100
          const roll = Math.random() * 100;
          power = roll < 50 ? this.Rand(301, 350) : roll < 80 ? this.Rand(101, 300) : this.Rand(5, 100);
          break;
        }
        case 100: { // 自身体力越少威力越大
          const ratio = attacker.hp / attacker.maxHp;
          power = ratio >= 0.6875 ? 20 : ratio >= 0.354 ? 40 : ratio >= 0.208 ? 80 : ratio >= 0.104 ? 100 : ratio >= 0.042 ? 150 : 200;
          break;
        }
        case 609: if (this.HasStatus(defender, args[0])) power *= 2; break; // 对手处于某异常时威力翻倍
        case 129: if (this.Gender(defender) === args[0]) power *= 2; break; // 对手为某性别时威力翻倍
        case 113: power = 26 + this.DV(attacker) * 4; break; // 个体越高威力越大（26+个体值×4）
        case 1901: power = this.DV(attacker) * 5; break; // 潜力越高威力越大（0~155）
        case 188: // 对手异常时威力翻倍，并消除对手防御、特防的提升
          if (this.HasStatus(defender)) {
            power *= 2;
            for (const stat of [1, 3]) if (defender.battleLevels[stat] > 0) defender.battleLevels[stat] = 0;
          }
          break;
      }
    }
    const boost = this.Get(attacker, 'typePower');
    if (boost && (skill.type || 8) === boost.type) power = Math.floor(power * boost.multiplier);
    return this.Passive.Power(attacker, power);
  }

  public static Crit(battle: any, attacker: any, defender: any, skill: any, check: () => boolean): boolean {
    if (skill.category !== 1 && skill.category !== 2) return check();
    if (this.Get(attacker, 'critAlways') || require('./BossSpecialRules').BossSpecialRules.IsForcedCrit(attacker)) return true;
    // 160：对手落空后的下回合必定暴击
    const next = this.Get(attacker, 'critNext');
    if (next && next.turn < battle.turn) return true;
    for (const { id, args } of this.Mine(skill, defender)) {
      if (id === 193 && this.HasStatus(defender, args[0])) return true;
    }
    // 额外暴击率（x/16）与技能基础暴击率相加
    let bonus = this.Get(attacker, 'critUp') ? 1 : 0;
    for (const { id, args } of this.Mine(skill, defender)) {
      if (id === 95 && this.HasStatus(defender, SLEEP)) bonus += args[0] || 0;
    }
    return this.Passive.Crit(attacker, defender, skill.critRate || 1, check, bonus);
  }

  // ==================== 伤害 ====================

  /**
   * 修正一次伤害：kind=attack 为普通伤害计算结果，fixed/ohko 为固定伤害与秒杀
   * 先算攻击方技能与状态的加成，再算防守方的护盾、减伤与免疫
   */
  public static Damage(battle: any, attacker: any, defender: any, skill: any, damage: number, kind: Kind, isFirst: boolean): number {
    const states = this.States(attacker);
    states._hits = 1;
    if (kind === 'attack' && damage > 0) damage = this.AttackSide(battle, attacker, defender, skill, damage, isFirst);
    if (kind === 'attack') damage = this.Passive.AttackDamage(battle, attacker, defender, skill, damage);
    for (const { id } of this.Mine(skill, defender)) {
      if (id === 34) { // 克制：将本回合所受伤害的n倍反馈给对手
        const received = this.States(attacker)._received;
        const arg = this.Entries(skill).find(e => e.id === 34)?.args[0] || 2;
        damage = received && received.turn === battle.turn ? received.amount * arg : 0;
      }
    }
    if (damage > 0 && (skill.category === 1 || skill.category === 2)) damage = this.DefenderSide(battle, attacker, defender, skill, damage, kind);
    if (damage > 0 && this.Mine(skill).some(e => e.id === 8) && damage >= defender.hp) damage = Math.max(0, defender.hp - 1);
    return this.Passive.Lethal(battle, defender, skill, this.Passive.Shield(battle, defender, skill, damage));
  }

  private static AttackSide(battle: any, attacker: any, defender: any, skill: any, damage: number, isFirst: boolean): number {
    let extra = 0;
    for (const { id, args } of this.Mine(skill, defender)) {
      switch (id) {
        case 31: { // 1回合做m~n次攻击
          const hits = this.Rand(args[0] || 2, Math.max(args[0] || 2, args[1] || args[0] || 2));
          damage *= hits;
          this.States(attacker)._hits = hits;
          break;
        }
        case 29: extra += args[0] || 0; break;
        case 93: if (this.Chance(args[0])) extra += args[1] || 0; break;
        case 88: if (this.Chance(args[0])) damage *= args[1] || 1; break;
        case 402: if (!isFirst) extra += args[0] || 0; break;
        case 405: if (isFirst) extra += args[0] || 0; break;
        case 133: if (this.HasStatus(defender, 2)) extra += args[0] || 0; break;
        case 141: if (this.HasStatus(defender, 5)) extra += args[0] || 0; break;
        case 162: if (this.HasStatus(defender)) extra += args[0] || 0; break;
        case 167: if (this.HasDebuff(defender)) extra += args[0] || 0; break;
        case 413: if (this.HasBuff(defender)) extra += args[0] || 0; break;
        case 467: if (this.HasStatus(defender, args[0])) extra += args[1] || 0; break;
        case 422: extra += Math.floor(damage * (args[0] || 0) / 100); break;
        case 436: extra += Math.floor((attacker.maxHp - attacker.hp) * (args[0] || 0) / 100); break;
        case 455: if (args[0] > 0) extra += Math.floor((attacker.maxHp - attacker.hp) / args[0]) * (args[1] || 0); break;
        case 192: extra += Math.floor(defender.hp * (args[0] || 0) / 100); break;
        case 115: if (this.Chance(args[0]) && args[1] > 0) extra += Math.floor(attacker.speed / args[1]); break;
        case 82: { // 目标为雄性伤害200%，雌性50%
          const gender = this.Gender(defender);
          if (gender === 1) damage *= 2;
          else if (gender === 2) damage = Math.floor(damage / 2);
          break;
        }
        case 130: if (this.Gender(defender) === args[0]) extra += args[1] || 0; break; // 对手为某性别附加n点伤害
        case 111: extra += Math.floor((attacker.level || 1) * (1 + Math.random())); break; // 附加自身等级100%~200%的固定伤害
        case 411: { // 附加对手当前体力n%的伤害，连续使用每次+m%，最高k%
          const percent = Math.min(args[2] || 0, (args[0] || 0) + (args[1] || 0) * (this.Streak(battle, attacker, skill) - 1));
          extra += Math.floor(defender.hp * percent / 100);
          break;
        }
        case 195: { // 无视对手双防能力提升
          const stage = defender.battleLevels?.[skill.category === 1 ? 1 : 3] || 0;
          if (stage > 0) damage = Math.floor(damage * stageRatio(stage));
          break;
        }
      }
    }
    const boost = this.Get(attacker, 'damageMul');
    if (boost) damage = Math.floor(damage * boost.multiplier);
    const male = this.Get(attacker, 'maleDamage');
    if (male && this.Gender(defender) === 1) damage = Math.floor(damage * male.multiplier);
    if ((skill.type || 8) === 5 && this.Get(attacker, 'electricBoost')) damage *= 2;
    const weakened = this.Get(attacker, 'outgoingDivisor');
    if (weakened && weakened.divisor > 1) damage = Math.floor(damage / weakened.divisor);
    damage += extra;
    for (const { id, args } of this.Mine(skill, defender)) if (id === 135) damage = Math.max(damage, args[0] || 0);
    return damage;
  }

  private static DefenderSide(battle: any, attacker: any, defender: any, skill: any, damage: number, kind: Kind): number {
    const immune = this.Get(defender, 'immuneTurn');
    if (immune && immune.turn === battle.turn) return this.Blocked(defender, damage, 'immuneTurn');
    if (this.Get(defender, 'genderShield')) return this.Blocked(defender, damage, 'genderShield');
    const immuneReflect = this.Get(defender, 'immuneReflect');
    if (immuneReflect) return this.Blocked(defender, damage, 'immuneReflect', attacker, immuneReflect.reflectDivisor);
    const reflect = this.Get(defender, 'immuneCategory');
    if (reflect && reflect.category === skill.category) return this.Blocked(defender, damage, 'immuneCategory', attacker, 1);
    const block = this.Get(defender, 'block');
    if (block) {
      if (--block.count <= 0) delete defender.effectStates.block;
      return this.Blocked(defender, damage, 'block');
    }
    if (kind === 'attack') {
      if (skill.category === 1 && this.Get(defender, 'halfPhysical')) damage = Math.floor(damage / 2);
      if (skill.category === 2 && this.Get(defender, 'halfSpecial')) damage = Math.floor(damage / 2);
      if ((skill.type || 8) === 3 && this.Get(defender, 'halfFire')) damage = Math.floor(damage / 2);
      if (this.Get(defender, 'halfAll')) damage = Math.floor(damage / 2);
    }
    const cap = this.Get(defender, 'cap');
    if (cap) damage = Math.min(damage, cap.max);
    const shield = this.Get(defender, 'shield');
    if (shield) {
      const absorbed = Math.min(shield.points, damage);
      shield.points -= absorbed;
      damage -= absorbed;
      if (shield.points <= 0) delete defender.effectStates.shield;
    }
    if (this.Get(defender, 'absorbToHp')) {
      this.Heal(defender, damage);
      return 0;
    }
    if (this.Get(defender, 'endure') && damage >= defender.hp) damage = Math.max(0, defender.hp - 1);
    return damage;
  }

  private static Blocked(defender: any, damage: number, reason: string, attacker?: any, reflectDivisor?: number): number {
    if (attacker && reflectDivisor) attacker.hp = Math.max(0, attacker.hp - Math.floor(damage / reflectDivisor));
    Logger.Info(`[技能效果] ${defender.name} 抵挡了伤害(${reason})`);
    return 0;
  }

  /** 本次攻击的段数（效果31），读取后清除 */
  public static AtkTimes(attacker: any, fallback: number): number {
    const hits = attacker.effectStates?._hits;
    if (attacker.effectStates) delete attacker.effectStates._hits;
    return hits || fallback;
  }

  // ==================== 出手后 ====================

  /** 技能结算完毕（命中后，含属性技能）：本技能的后续效果、反击类状态、睡眠解除等 */
  public static AfterAttack(battle: any, attacker: any, defender: any, skill: any, damage: number, isFirst: boolean): void {
    const attack = skill.category === 1 || skill.category === 2;
    // 睡眠：受到攻击技能命中后解除（本次技能“若对手睡眠”类效果先按睡眠结算）
    const wake = attack && this.HasStatus(defender, SLEEP);
    if (damage > 0) this.States(defender)._received = { turn: battle.turn, amount: damage };
    if (attack) this.Reactions(attacker, defender, skill, damage);
    else this.StatusMoveReactions(attacker, defender);
    for (const { id, args } of this.Mine(skill, defender)) this.Apply(battle, attacker, defender, skill, id, args, damage, isFirst);
    // 持续吸血/回复类状态
    if (damage > 0) {
      const aura = this.Get(attacker, 'drainAura');
      if (aura && aura.divisor > 0) this.Heal(attacker, damage / aura.divisor);
      const first = this.Get(attacker, 'firstDrain');
      if (first && isFirst) this.Heal(attacker, damage * first.percent / 100);
      const onDamage = this.Get(attacker, 'onDamageStatus');
      if (onDamage && this.Chance(onDamage.chance)) this.Inflict(defender, onDamage.status, STATUS_TURNS, skill.id);
      const weaken = this.Get(attacker, 'weakenOnHit');
      if (weaken && this.Chance(weaken.chance)) this.Weaken(defender);
    }
    const regen = this.Get(attacker, 'regen');
    if (regen) this.Heal(attacker, regen.divisor ? attacker.maxHp / regen.divisor : regen.amount);
    const fear = this.Get(attacker, 'firstFear');
    if (fear && isFirst && this.Chance(fear.chance)) this.Inflict(defender, 6, this.Rand(1, 3), skill.id);
    this.States(attacker)._lastSkill = skill.id;
    this.Passive.AfterHit(battle, defender, skill, damage);
    for (const pet of [defender, attacker]) this.Passive.Revive(pet);
    if (this.Get(attacker, 'healBlock') && attacker.hp > attacker.effectStates._hpAtAct) attacker.hp = attacker.effectStates._hpAtAct;
    if (defender.hp <= 0) this.OnKnockout(battle, attacker, defender, skill);
    if (wake) {
      defender.statusDurations[SLEEP] = 0;
      if (defender.status === SLEEP) defender.status = -1;
    }
  }

  /** 防守方被攻击技能命中时的反击类状态 */
  private static Reactions(attacker: any, defender: any, skill: any, damage: number): void {
    const counter = this.Get(defender, 'counter');
    if (counter && damage > 0 && counter.divisor > 0) attacker.hp = Math.max(0, attacker.hp - Math.floor(damage / counter.divisor));
    if (this.Get(defender, 'reflectDouble') && damage > 0) attacker.hp = Math.max(0, attacker.hp - damage * 2);
    const onPhysical = this.Get(defender, 'onPhysicalStatus');
    if (onPhysical && skill.category === 1 && this.Chance(onPhysical.chance)) this.Inflict(attacker, onPhysical.status, STATUS_TURNS, skill.id);
    const onHit = this.Get(defender, 'onHitStatus');
    if (onHit && this.Chance(onHit.chance)) this.Inflict(attacker, onHit.status, STATUS_TURNS, skill.id);
    const boost = this.Get(defender, 'onDamageStage');
    if (boost && damage > 0) this.Stage(defender, boost.stat, boost.change);
    const hurt = this.Get(defender, 'hurtStatus');
    if (hurt && damage > hurt.threshold) this.Inflict(attacker, hurt.status, STATUS_TURNS, skill.id);
    if (this.Get(defender, 'onHitWeakenFoe')) { this.Stage(attacker, 0, -1); this.Stage(attacker, 2, -1); }
    if (this.Get(defender, 'onHitClearFoe')) attacker.battleLevels.forEach((v: number, i: number) => { if (v > 0) attacker.battleLevels[i] = 0; });
    const lowDamage = this.Get(defender, 'onHitMultiDebuff');
    if (lowDamage) { this.Stage(attacker, 1, -1); this.Stage(attacker, 3, -1); this.Stage(attacker, 5, -1); }
  }

  /** 防守方受到属性技能时的反击类状态 */
  private static StatusMoveReactions(attacker: any, defender: any): void {
    const random = this.Get(defender, 'statusMoveCurse');
    if (random) this.RandomStatus(attacker, [2, 5, 1, 0, 6, 8], STATUS_TURNS);
    const punish = this.Get(defender, 'statusMovePunish');
    if (punish && this.Chance(punish.chance)) this.Inflict(attacker, punish.status, STATUS_TURNS);
    const stage = this.Get(defender, 'statusMoveStage');
    if (stage && this.Chance(stage.chance)) { this.Stage(defender, stage.stat1, stage.change); this.Stage(defender, stage.stat2, stage.change); }
    const debuff = this.Get(defender, 'statusMoveDebuff');
    if (debuff && this.Chance(debuff.chance)) this.Stage(attacker, debuff.stat, debuff.change);
    const heal = this.Get(defender, 'statusMoveHeal');
    if (heal && heal.divisor > 0) this.Heal(defender, defender.maxHp / heal.divisor);
  }

  private static Weaken(target: any): void {
    if (require('./BossSpecialRules').BossSpecialRules.IsStatusImmune(target, 11)) return;
    target.statusDurations[11] = Math.min(5, (target.statusDurations[11] || 0) + 1);
  }

  /** 单个效果在出手后的结算 */
  private static Apply(battle: any, attacker: any, defender: any, skill: any, id: number, a: number[], damage: number, isFirst: boolean): void {
    const hitFoe = damage > 0;
    switch (id) {
      // ---- 伤害后的附加效果 ----
      case 6: if (hitFoe && a[0] > 0) attacker.hp = Math.max(0, attacker.hp - Math.floor(damage / a[0])); break; // 反伤1/n
      case 36: if (defender.hp > 0 && this.Chance(a[0])) this.Lose(battle, attacker, defender, defender.hp, skill, 'ohko'); break;
      case 456: if (defender.hp > 0 && defender.hp < a[0]) this.Lose(battle, attacker, defender, defender.hp, skill, 'ohko'); break;
      case 73: if (isFirst) this.Put(attacker, 'reflectDouble', this.During(a[0] || 1, isFirst)); break; // 先手时受攻击反弹2倍伤害
      case 38: // 降低对方n点最大体力
        defender.maxHp = Math.max(1, defender.maxHp - (a[0] || 0));
        defender.hp = Math.min(defender.hp, defender.maxHp);
        break;
      case 39: // n%令对手全部技能PP-m，若对手所选技能PP为0则当回合无法行动
        if (Array.isArray(defender.skillPP) && this.Chance(a[0])) {
          defender.skillPP = defender.skillPP.map((pp: number) => Math.max(0, pp - (a[1] || 1)));
          if (isFirst) this.Put(defender, 'skipTurn', 1, { turn: battle.turn, pendingSkill: true }, false);
        }
        break;
      case 63: // 将自身能力下降转移给对手
        attacker.battleLevels.forEach((v: number, i: number) => { if (v < 0) { this.Stage(defender, i, v); attacker.battleLevels[i] = 0; } });
        break;
      case 85: // 对手的能力提升转到自身
        defender.battleLevels.forEach((v: number, i: number) => { if (v > 0) { this.Stage(attacker, i, v); defender.battleLevels[i] = 0; } });
        break;
      case 415: if (damage > (a[0] || 0)) this.Heal(attacker, a[1] || 0); break; // 伤害大于m时回复n点体力
      case 423: this.Lose(battle, attacker, defender, defender.defence || 0, skill, 'fixed'); break; // 造成等同于对手防御值的固定伤害
      case 523: if (defender.hp > 0) a.forEach((change, stat) => this.Stage(attacker, stat, change)); break; // 未击败对手时自身能力变化
      case 837: { // 吸取对手n点体力，连续使用每次+m，最高k
        const amount = Math.min(a[2] || 0, (a[0] || 0) + (a[1] || 0) * (this.Streak(battle, attacker, skill) - 1));
        const before = defender.hp;
        this.Lose(battle, attacker, defender, amount, skill, 'fixed');
        this.Heal(attacker, before - defender.hp);
        break;
      }
      case 107: if (damage < (a[0] || 0)) this.Stage(attacker, a[1], 1); break;
      case 473: if (damage < (a[0] || 0)) this.Stage(attacker, a[1], a[2] || 1); break;
      case 134: if (damage < (a[0] || 0) && Array.isArray(attacker.skillPP)) attacker.skillPP = attacker.skillPP.map((pp: number, i: number) => Math.min(GameConfig.GetSkillById(attacker.skills[i])?.MaxPP || pp, pp + (a[1] || 0))); break;
      case 145: if (this.HasStatus(defender, 1) && a[0] > 0) this.Heal(attacker, attacker.maxHp / a[0]); break;
      case 154: if (this.HasStatus(defender, a[0]) && a[1] > 0) this.Heal(attacker, damage / a[1]); break;
      case 172: if (!isFirst && a[0] > 0) this.Heal(attacker, damage / a[0]); break;
      case 438: if (this.Chance(a[0]) && a[1] > 0) this.Heal(attacker, attacker.maxHp / a[1]); break;
      case 147: if (!isFirst && this.Chance(a[0])) this.Inflict(defender, a[1], STATUS_TURNS, skill.id); break;
      case 173: if (isFirst && this.Chance(a[0])) this.Inflict(defender, a[1], STATUS_TURNS, skill.id); break;
      case 148: if (!isFirst && this.Chance(a[1])) this.Stage(defender, a[0], a[2]); break;
      case 186: if (!isFirst && this.Chance(a[1])) this.Stage(attacker, a[0], a[2]); break;
      case 122: if (isFirst && this.Chance(a[1])) this.Stage(defender, a[0], a[2]); break;
      case 196:
        if (this.Chance(a[1])) this.Stage(defender, a[0], a[2]);
        if (isFirst && this.Chance(a[4])) this.Stage(defender, a[3], a[5]);
        break;
      case 182: if (this.HasStatus(defender, a[0]) && this.Chance(a[2])) this.Stage(attacker, a[1], a[3]); break;
      case 175: if (this.HasStatus(defender) && this.Chance(a[1])) this.Stage(attacker, a[0], a[2]); break;
      case 184: if (this.HasBuff(defender) && this.Chance(a[1])) this.Stage(attacker, a[0], a[2]); break;
      case 418: case 437: if (this.HasBuff(defender)) this.Stage(defender, a[0], a[1]); break;
      case 121: if ((attacker.type || 0) === (skill.type || 8) && this.Chance(a[0])) this.Inflict(defender, 0, STATUS_TURNS, skill.id); break;
      case 151: // 对手烧伤时疲惫与烧伤并存，否则按普通异常施加
        if (this.HasStatus(defender, 2)) {
          if (this.Chance(a[0]) && defender.hp > 0 && !require('./BossSpecialRules').BossSpecialRules.IsStatusImmune(defender, 7, skill.id))
            defender.statusDurations[7] = Math.max(defender.statusDurations[7] || 0, 1);
        } else if (this.Chance(a[1])) this.Inflict(defender, 7, 1, skill.id);
        break;
      case 159: if (a[0] > 0 && attacker.hp < attacker.maxHp / a[0] && this.Chance(a[1])) this.Inflict(defender, a[2], STATUS_TURNS, skill.id); break;
      case 149:
        if (this.Chance(a[0])) this.Inflict(defender, a[1], STATUS_TURNS, skill.id);
        if (this.Chance(a[2])) this.Inflict(defender, a[3], STATUS_TURNS, skill.id);
        break;
      case 74: { const r = Math.random() * 100; if (r < 30) this.Inflict(defender, r < 10 ? 1 : r < 20 ? 2 : 5, STATUS_TURNS, skill.id); break; }
      case 75: { const r = Math.random() * 100; if (r < 30) this.Inflict(defender, r < 10 ? 0 : r < 20 ? SLEEP : 6, STATUS_TURNS, skill.id); break; }
      case 176: if (this.Chance(a[0])) this.RandomStatus(defender, [2, 5, 1, 0, 6, SLEEP], STATUS_TURNS, skill.id); break;
      case 451: if (this.Chance(a[0])) this.RandomStatus(defender, [2, 5, 1], STATUS_TURNS, skill.id); break;
      case 16: if (this.Chance(a[0])) this.Inflict(defender, SLEEP, STATUS_TURNS, skill.id); break;
      case 103: if (this.Chance(a[0])) this.Weaken(defender); break;
      case 119: // 伤害为奇数30%对手疲惫1回合，偶数30%自身速度+1
        if (damage % 2 === 1) { if (this.Chance(30)) this.Inflict(defender, 7, 1, skill.id); }
        else if (this.Chance(30)) this.Stage(attacker, 4, 1);
        break;
      case 120: if (a[0] > 0) { if (Math.random() < 0.5) this.Lose(battle, attacker, defender, defender.maxHp / a[0], skill, 'fixed', 'percent'); else attacker.hp = Math.max(0, attacker.hp - Math.floor(attacker.maxHp / a[0])); } break;
      case 140: if (a[0] > 0 && a[1] > 0) this.Lose(battle, attacker, defender, defender.maxHp / this.Rand(Math.min(a[0], a[1]), Math.max(a[0], a[1])), skill, 'fixed', 'percent'); break;
      case 28: if (a[0] > 0) this.Lose(battle, attacker, defender, defender.maxHp / a[0], skill, 'fixed', 'percent'); break; // 属性技能：降低对方1/n体力
      case 80: { const cost = Math.floor(attacker.hp / 2); attacker.hp -= cost; this.Lose(battle, attacker, defender, cost, skill, 'fixed'); break; }
      case 79: attacker.hp = Math.max(1, attacker.hp - Math.floor(attacker.maxHp / 2)); for (const stat of [0, 1, 2, 3, 4]) this.Stage(attacker, stat, 1); break;
      case 137: attacker.hp = Math.max(1, attacker.hp - Math.floor(attacker.hp / 2)); this.Stage(attacker, 0, 2); this.Stage(attacker, 4, 2); break;
      case 161: if (this.Chance(a[0]) && a[1] > 0) attacker.hp = Math.max(1, attacker.hp - Math.floor(attacker.hp / a[1])); break;
      case 142: if (a[0] > 0) { attacker.hp = Math.max(1, attacker.hp - Math.floor(attacker.maxHp / a[0])); this.Put(attacker, 'nextPriority', this.Next(1)); } break;
      case 87: if (Array.isArray(attacker.skillPP)) attacker.skillPP = attacker.skills.map((sid: number, i: number) => GameConfig.GetSkillById(sid)?.MaxPP || attacker.skillPP[i]); break;
      case 155: // 恢复全部体力并消除能力下降，自身睡眠n回合
        attacker.hp = attacker.maxHp;
        attacker.battleLevels.forEach((v: number, i: number) => { if (v < 0) attacker.battleLevels[i] = 0; });
        attacker.statusTurns = a[0] || 2;
        attacker.status = SLEEP;
        break;
      case 198: { // 随机令对手n种能力-m
        const stats = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, a[0] || 1);
        for (const stat of stats) this.Stage(defender, stat, -(a[1] || 1));
        break;
      }
      case 180: this.ClearTurnEffects(defender); break;
      case 797: if (this.ClearTurnEffects(defender) > 0) this.Put(defender, 'healBlock', this.During(a[0] || 1, isFirst), {}, false); break; // 消除成功则对手n回合无法用技能回复体力
      case 478: this.Put(defender, 'statusSealed', this.During(a[0] || 1, isFirst), {}, false); break; // n回合内对手的属性技能无效
      case 13: // n回合吸取对方最大体力的1/8（草系无效，免疫寄生者无效）
        if ((defender.type || 0) !== 1 && !require('./BossSpecialRules').BossSpecialRules.IsStatusImmune(defender, 3, skill.id))
          this.Put(defender, 'seeded', a[0] || 5, { by: attacker === battle.player ? 'player' : 'enemy' }, false);
        break;
      case 62: // n回合后若对方没有将自己击败，则对方死亡（完全免疫异常的目标无效）
        if (!require('./BossSpecialRules').BossSpecialRules.IsRequiemImmune(defender))
          this.Put(attacker, 'requiem', (a[0] || 3) + 1, { target: defender === battle.player ? 'player' : 'enemy', skill: { id: skill.id, type: skill.type } }, false);
        break;
      case 60: this.Put(defender, 'dot', a[0] || 5, { damage: a[1] || 0, source: attacker === battle.player ? 'player' : 'enemy', skill: { id: skill.id, type: skill.type } }, false); break;
      case 54: this.Put(defender, 'outgoingDivisor', this.During(a[0] || 1, isFirst), { divisor: a[1] || 2 }, false); break;
      // ---- 自身的持续效果（回合数按 Next / During / Own 起算） ----
      case 21: this.Put(attacker, 'counter', this.During(this.Rand(a[0] || 1, Math.max(a[0] || 1, a[1] || 1)), isFirst), { divisor: a[2] || 1 }); break;
      case 32: this.Put(attacker, 'critUp', this.Next(a[0] || 1)); break;
      case 83: // 自身雄性下两回合必定先手，雌性下两回合必定暴击
        if (this.Gender(attacker) === 1) this.Put(attacker, 'alwaysFirst', this.Next(2));
        else if (this.Gender(attacker) === 2) this.Put(attacker, 'critAlways', this.Next(2));
        break;
      case 98: this.Put(attacker, 'maleDamage', this.Next(a[0] || 1), { multiplier: a[1] || 2 }); break; // n回合内对雄性伤害m倍
      case 131: if (this.Gender(defender) === a[0]) this.Put(attacker, 'genderShield', this.During(1, isFirst)); break; // 对手为某性别则抵挡当回合伤害，后手延续1回合
      case 439: this.Put(attacker, 'weakPunish', a[0] || 1, { damage: a[1] || 0 }); break; // n回合内自身弱化或异常时对手每回合受m点伤害
      case 545: this.Put(attacker, 'hurtStatus', this.During(a[0] || 1, isFirst), { threshold: a[1] || 0, status: a[2] || 0 }); break; // 受到高于m的伤害则对手异常
      case 91: this.Put(attacker, 'mirrorStages', this.During(a[0] || 1, isFirst), { foe: [...defender.battleLevels] }); break; // 对手的能力变化同步到自身
      case 58: this.Put(attacker, 'critAlways', this.Next(a[0] || 1)); break;
      case 41: this.Put(attacker, 'halfFire', this.During(this.Rand(a[0] || 1, Math.max(a[0] || 1, a[1] || 1)), isFirst)); break;
      case 42: this.Put(attacker, 'electricBoost', this.Next(this.Rand(a[0] || 1, Math.max(a[0] || 1, a[1] || 1)))); break;
      case 44: this.Put(attacker, 'halfSpecial', this.During(a[0] || 1, isFirst)); break;
      case 50: this.Put(attacker, 'halfPhysical', this.During(a[0] || 1, isFirst)); break;
      case 45: if (defender.defence) { this.Put(attacker, 'defSync', this.During(a[0] || 1, isFirst), { original: attacker.defence }); attacker.defence = defender.defence; } break;
      case 51: if (defender.attack) { this.Put(attacker, 'atkSync', this.Next(a[0] || 1), { original: attacker.attack }); attacker.attack = defender.attack; } break;
      case 46: this.Put(attacker, 'block', Infinity, { count: a[0] || 1 }); break;
      case 47: this.Put(attacker, 'statDownImmune', this.During(a[0] || 1, isFirst)); break;
      case 48: this.Put(attacker, 'statusImmune', this.During(a[0] || 1, isFirst)); break;
      case 49: this.Put(attacker, 'shield', Infinity, { points: a[0] || 0 }); break;
      case 52: this.Put(attacker, 'firstStrikeBlock', this.During(a[0] || 1, isFirst)); break;
      case 53: case 90: this.Put(attacker, 'damageMul', this.Next(a[0] || 1), { multiplier: a[1] || 2 }); break;
      case 57: this.Put(attacker, 'regen', a[0] || 1, { divisor: a[1] || 8 }); break;
      case 77: this.Put(attacker, 'regen', a[0] || 1, { amount: a[1] || 0 }); break;
      case 65: this.Put(attacker, 'typePower', this.Next(a[0] || 1), { type: a[1], multiplier: a[2] || 2 }); break;
      case 68: this.Put(attacker, 'endure', this.During(a[0] || 1, isFirst)); break;
      case 78: this.Put(attacker, 'evadePhysical', this.During(a[0] || 1, isFirst)); break;
      case 106: this.Put(attacker, 'evadeSpecial', this.During(a[0] || 1, isFirst)); break;
      case 86: this.Put(attacker, 'evadeStatus', this.During(a[0] || 1, isFirst)); break;
      case 81: this.Put(attacker, 'sureHit', this.Next(a[0] || 1)); break;
      case 84: this.Put(attacker, 'onPhysicalStatus', this.During(a[0] || 1, isFirst), { chance: a[1] || 0, status: 0 }); break;
      case 92: this.Put(attacker, 'onPhysicalStatus', this.During(a[0] || 1, isFirst), { chance: a[1] || 0, status: 5 }); break;
      case 108: this.Put(attacker, 'onPhysicalStatus', this.During(a[0] || 1, isFirst), { chance: a[1] || 0, status: 2 }); break;
      case 146: this.Put(attacker, 'onPhysicalStatus', this.During(a[0] || 1, isFirst), { chance: a[1] || 0, status: 1 }); break;
      case 164: this.Put(attacker, 'onHitStatus', this.During(a[0] || 1, isFirst), { chance: a[1] || 0, status: a[2] || 0 }); break;
      case 109: this.Put(attacker, 'onDamageStatus', this.Own(a[0] || 1, skill), { chance: a[1] || 0, status: 5 }); break;
      case 104: this.Put(attacker, 'weakenOnHit', this.Own(a[0] || 1, skill), { chance: a[1] || 0 }); break;
      case 110: this.Put(attacker, 'dodgeBoost', this.During(a[0] || 1, isFirst), { chance: a[1] || 0, stat: a[2] || 0 }); break;
      case 116: this.Put(attacker, 'firstDrain', this.Own(a[0] || 3, skill), { percent: a[1] || 20 }); break;
      case 117: this.Put(attacker, 'firstFear', this.Own(a[0] || 5, skill), { chance: a[1] || 50 }); break;
      case 123: this.Put(attacker, 'onDamageStage', this.During(a[0] || 1, isFirst), { stat: a[1] || 0, change: a[2] || 1 }); break;
      case 125: this.Put(attacker, 'cap', this.During(a[0] || 1, isFirst), { max: a[1] || 0 }); break;
      case 126: this.Put(attacker, 'turnBoost', a[0] || 1, { change: a[1] || 1 }); break;
      case 127: if (this.Chance(a[0])) this.Put(attacker, 'halfAll', this.During(a[1] || 1, isFirst)); break;
      case 128: this.Put(attacker, 'absorbToHp', this.During(a[0] || 1, isFirst)); break;
      case 89: case 153: this.Put(attacker, 'drainAura', this.Own(a[0] || 1, skill), { divisor: a[1] || 2 }); break;
      case 152: this.Put(attacker, 'statusMovePunish', this.During(a[0] || 1, isFirst), { chance: a[1] || 0, status: a[2] || 0 }); break;
      case 163: this.Put(attacker, 'statusMoveCurse', this.During(a[0] || 1, isFirst)); break;
      case 165: this.Put(attacker, 'turnGuard', a[0] || 1, { change: a[1] || 1 }); break;
      case 166: this.Put(attacker, 'statusMoveDebuff', this.During(a[0] || 1, isFirst), { stat: a[1] || 0, chance: a[2] || 0, change: a[3] || -1 }); break;
      case 169: this.Put(attacker, 'turnStatus', a[0] || 1, { chance: a[1] || 0, status: a[2] || 0 }); break;
      case 170: if (isFirst) { this.Put(attacker, 'immuneTurn', 1, { turn: battle.turn }); if (a[0] > 0) this.Heal(attacker, attacker.maxHp / a[0]); } break;
      case 138: if (isFirst) this.Put(attacker, 'immuneReflect', this.During(a[0] || 1, isFirst), { reflectDivisor: a[1] || 2 }); break;
      case 171: this.Put(attacker, 'statusPriority', this.Next(a[0] || 1)); break;
      case 174: this.Put(attacker, 'statusMoveStage', this.During(a[0] || 1, isFirst), { stat1: a[1], stat2: a[2], chance: a[3] || 0, change: a[4] || 1 }); break;
      case 177: this.Put(attacker, 'missHeal', this.During(a[0] || 1, isFirst), { divisor: a[1] || 2 }); break;
      case 160: this.Put(attacker, 'missCrit', this.During(a[0] || 1, isFirst)); break;
      case 183: this.Put(attacker, 'immuneCategory', this.During(a[0] || 1, isFirst), { category: a[1] || 1 }); break;
      case 187: this.Put(attacker, 'statusMoveHeal', this.During(a[0] || 1, isFirst), { divisor: a[1] || 3 }); break;
      case 189: this.Put(attacker, 'onHitWeakenFoe', this.During(a[0] || 1, isFirst)); break;
      case 190: this.Put(attacker, 'onHitClearFoe', this.During(a[0] || 1, isFirst)); break;
      case 191: this.Put(attacker, 'statusImmune', this.During(a[0] || 1, isFirst)); break;
      case 197: this.Put(attacker, 'koClearFoe', this.During(a[0] || 1, isFirst)); break;
      // ---- 换下一只精灵生效 ----
      case 59: attacker.hp = 0; this.Pending(battle, attacker, { stages: [a[0], a[1]].filter(s => s !== undefined) }); break;
      case 71: attacker.hp = 0; this.Pending(battle, attacker, { critTurns: 2 }); break;
      case 144: attacker.hp = 0; this.Pending(battle, attacker, { statusImmune: a[0] || 3 }); break;
      case 199: this.Put(attacker, 'onKoBoost', Infinity, { stat: a[0] || 0, change: a[1] || 1 }); break;
    }
  }

  /** 消除对手回合类效果（其自身获得的持续效果），返回消除的个数 */
  private static ClearTurnEffects(pet: any): number {
    const states = this.States(pet);
    const keys = Object.keys(states).filter(key => states[key]?.self);
    for (const key of keys) delete states[key];
    return keys.length;
  }

  private static OnKnockout(battle: any, attacker: any, defender: any, skill: any): void {
    for (const { id, args } of this.Mine(skill)) {
      if (id === 66 && args[0] > 0) this.Heal(attacker, attacker.maxHp / args[0]);
      if (id === 67 && args[0] > 0) this.Pending(battle, defender, { maxHpDivisor: args[0] });
      if (id === 185 && this.HasStatus(defender, args[0])) this.Pending(battle, defender, { status: args[0] });
    }
    if (this.Get(defender, 'koClearFoe')) attacker.battleLevels.forEach((v: number, i: number) => { if (v > 0) attacker.battleLevels[i] = 0; });
    const boost = this.Get(defender, 'onKoBoost');
    if (boost) this.Pending(battle, defender, { stages: [boost.stat], change: boost.change });
  }

  /** 记录给己方下一只出场精灵的效果 */
  private static Pending(battle: any, pet: any, effect: any): void {
    const side = pet === battle.player ? 'player' : 'enemy';
    battle.pendingEntry = battle.pendingEntry || {};
    battle.pendingEntry[side] = { ...(battle.pendingEntry[side] || {}), ...effect, from: pet };
  }

  /** 精灵上场：结算上一只留下的效果 */
  public static OnEntry(battle: any): void {
    this.Passive.OnTurnStart(battle);
    for (const side of ['player', 'enemy']) {
      const pending = battle.pendingEntry?.[side];
      const pet = battle[side];
      if (!pending || !pet || pet === pending.from || pet.hp <= 0) continue;
      delete battle.pendingEntry[side];
      for (const stat of pending.stages || []) this.Stage(pet, stat, pending.change || 1);
      if (pending.critTurns) this.Put(pet, 'critAlways', pending.critTurns);
      if (pending.statusImmune) this.Put(pet, 'statusImmune', pending.statusImmune);
      if (pending.maxHpDivisor) { pet.maxHp -= Math.floor(pet.maxHp / pending.maxHpDivisor); pet.hp = Math.min(pet.hp, pet.maxHp); }
      if (pending.status !== undefined) this.Inflict(pet, pending.status, STATUS_TURNS);
    }
  }

  // ==================== 落空 ====================

  public static OnMiss(battle: any, attacker: any, defender: any, skill: any): void {
    this.States(attacker)._lastSkill = undefined;
    this.Passive.OnMiss(defender);
    for (const { id, args } of this.Mine(skill)) {
      if (id === 72) attacker.hp = 0; // 此回合miss则立即死亡
      if (id === 136 && args[0] > 0) this.Heal(attacker, attacker.maxHp / args[0]);
      if (id === 9) delete this.States(attacker).consecutive;
    }
    const dodge = this.Get(defender, 'dodgeBoost');
    if (dodge && this.Chance(dodge.chance)) this.Stage(defender, dodge.stat, 1);
    const heal = this.Get(defender, 'missHeal');
    if (heal && heal.divisor > 0) this.Heal(defender, defender.maxHp / heal.divisor);
    if (this.Get(defender, 'missCrit')) this.Put(defender, 'critNext', 2, { turn: battle.turn });
  }

  // ==================== 回合结束 ====================

  public static TurnEnd(battle: any): void {
    this.CloseSegment(battle);
    for (const side of ['player', 'enemy']) this.LateControl(battle, battle[side]);
    for (const side of ['player', 'enemy']) {
      const pet = battle[side];
      const foe = battle[side === 'player' ? 'enemy' : 'player'];
      if (!pet?.effectStates) continue;
      const dot = this.Get(pet, 'dot');
      if (dot && pet.hp > 0) this.Lose(battle, battle[dot.source], pet, dot.damage, dot.skill, 'dot');
      const seed = this.Get(pet, 'seeded');
      if (seed && pet.hp > 0) {
        const drain = Math.floor(pet.maxHp / 8);
        this.Lose(battle, battle[seed.by], pet, drain, { id: 20007, type: 8 }, 'dot');
        this.Heal(battle[seed.by], drain);
      }
      const boost = this.Get(pet, 'turnBoost');
      if (boost) { this.Stage(pet, 0, boost.change); this.Stage(pet, 4, boost.change); }
      const guard = this.Get(pet, 'turnGuard');
      if (guard) { this.Stage(pet, 1, guard.change); this.Stage(pet, 3, guard.change); }
      const curse = this.Get(pet, 'turnStatus');
      if (curse && foe && this.Chance(curse.chance)) this.Inflict(foe, curse.status, STATUS_TURNS);
      const punish = this.Get(pet, 'weakPunish');
      if (punish && foe && pet.hp > 0 && (this.HasDebuff(pet) || this.HasStatus(pet))) this.Lose(battle, pet, foe, punish.damage, { id: 21896, type: 8 }, 'fixed');
      const requiem = this.Get(pet, 'requiem');
      if (requiem && requiem.turns === 1 && pet.hp > 0) {
        const target = battle[requiem.target];
        if (target && target.hp > 0) this.Lose(battle, pet, target, target.hp, requiem.skill, 'ohko');
      }
    }
    for (const side of ['player', 'enemy']) this.Tick(battle[side]);
    this.Passive.TurnEnd(battle);
  }

  private static Tick(pet: any): void {
    const states = pet?.effectStates;
    if (!states) return;
    for (const key of Object.keys(states)) {
      const state = states[key];
      if (key.startsWith('_') || !state || state.turns === undefined || state.turns === Infinity) continue;
      if (--state.turns > 0) continue;
      if (key === 'defSync' && state.original !== undefined) pet.defence = state.original;
      if (key === 'atkSync' && state.original !== undefined) pet.attack = state.original;
      delete states[key];
    }
  }
}
