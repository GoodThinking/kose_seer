'use strict';
const { randomUUID } = require('node:crypto');
const { BaseProto } = require('../../../shared/proto/base/BaseProto');
const { SkillEffectRuntime: R } = require('./SkillEffectRuntime');
const { ChampionPetRuntime: C } = require('./ChampionPetRuntime');
const { BattleTurnExecutor: Executor } = require('./BattleTurnExecutor');
const { BattleCore } = require('./BattleCore');
const names = {
  block: '抵挡攻击', shield: '护盾', immuneTurn: '本回合免伤', genderShield: '性别条件免伤', immuneReflect: '免伤并反弹', immuneCategory: '指定类别免伤',
  statusImmune: '免疫异常', statDownImmune: '免疫能力下降', regen: '持续回复', critAlways: '致命一击保证', sureHit: '必中', cap: '单次伤害上限',
  halfPhysical: '物理减伤', halfSpecial: '特殊减伤', halfAll: '全类别减伤', halfFire: '火系减伤', statusSealed: '属性技能封锁', healBlock: '回复封锁',
  firstStrikeBlock: '先手封锁', evadePhysical: '物理招式回避', evadeSpecial: '特殊招式回避', evadeStatus: '属性招式回避', absorbToHp: '伤害转回复', endure: '保留体力',
  chPPCost: '技能PP消耗增加', chReflectStatus: '异常反弹', chAttackBlock: '一次性攻击免疫', chAllAttackBlock: '攻击技能免疫',
  chStatusBlock: '令对方属性招式失效', chAttackPunish: '受到攻击时削减对手体力上限', chProtectedEffects: '效果不可消除',
  chPriority: '技能先制', chIgnoreDefense: '忽略部分防御', chAttackReduction: '下次攻击减伤',
  chFixedReduction: '下次固定伤害减伤', chDamageBoost: '伤害提高', chDrainOnUse: '使用招式吸取体力', chNextDamage: '下次伤害提高', chStatusPunish: '受到属性招式后获得免伤', chFailNext: '下次技能失效',
  nextPriority: '下次先制', alwaysFirst: '优先出手', statusPriority: '属性技能先制', reflect: '伤害反弹'
};
const statusNames = ['麻痹', '中毒', '烧伤', '吸取', '寄生', '冻伤', '害怕', '疲惫', '睡眠', '石化', '混乱', '弱化', '衰弱', '免疫', '易伤', '冰封'];
const reasons = {
  pp: '所选技能PP不足', idle: '本回合让出行动', changePet: '本回合更换精灵', paralysis: '麻痹导致无法行动', fear: '害怕导致无法行动', fatigue: '疲惫导致无法行动',
  sleep: '睡眠导致无法行动', petrify: '石化导致无法行动', ice_seal: '冰封导致无法行动', flinch: '畏缩导致无法行动', statusSealed: '属性技能被封锁', passive: '目标特性令技能失效', passiveDodge: '目标特性令招式落空',
  firstStrikeBlock: '先手封锁令技能失效', evadePhysical: '物理招式被回避', evadeSpecial: '特殊招式被回避', evadeStatus: '属性招式被回避',
  chFailNext: '一次性技能失效效果已消耗', chStatusBlock: '对方效果令属性招式失效'
};
class PacketExperience extends BaseProto {
  constructor(value) { super(91013); this.value = value; }
  serialize() { return Buffer.from(JSON.stringify({ version: 1, ...this.value }), 'utf8'); }
}
class BattleExperience {
  static frame;
  static Ensure(battle) {
    return battle.experience || (battle.experience = { id: randomUUID(), turn: battle.turn || 0, seq: 0, events: [], lost: [], seenDead: new Set(), counters: { player: { damage: 0, misses: 0, blocked: 0 }, enemy: { damage: 0, misses: 0, blocked: 0 } }, outcome: null });
  }
  static Event(battle, text, kind = 'effect', side) {
    const report = this.Ensure(battle);
    report.events.push({ seq: ++report.seq, turn: battle.turn || 0, text, kind, side });
    if (report.events.length > 96) report.events.shift();
  }
  static Side(battle, pet) { return pet === battle.player ? 'player' : 'enemy'; }
  static Dead(battle) {
    const report = this.Ensure(battle);
    for (const side of ['player', 'enemy']) {
      const pet = battle[side], key = side + ':' + pet.petId + ':' + pet.catchTime;
      if (pet.hp <= 0 && !report.seenDead.has(key)) {
        report.seenDead.add(key); report.lost.push({ side, petId: pet.petId, name: pet.name, turn: battle.turn || 0 });
        this.Event(battle, pet.name + '被击倒', 'faint', side);
      }
    }
  }
  static Effects(battle, pet) {
    const result = [];
    for (const [key, label] of Object.entries(names)) {
      const state = R.Get(pet, key); if (!state) continue;
      let text = label;
      if (Number.isFinite(state.turns)) text += '，剩余' + state.turns + '回合';
      if (Number.isFinite(state.count)) text += '，剩余' + state.count + '次';
      if (Number.isFinite(state.points)) text += '，护盾值' + state.points;
      if (Number.isFinite(state.percent)) text += '，' + state.percent + '%';
      if (Number.isFinite(state.max)) text += '，上限' + state.max;
      if (Number.isFinite(state.factor)) text += '，消耗×' + state.factor;
      result.push(text);
    }
    (pet.statusDurations || []).forEach((turns, index) => { if (turns > 0) result.push((statusNames[index] || '异常' + index) + '，剩余' + turns + '回合'); });
    const stats = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
    (pet.battleLevels || []).forEach((level, index) => { if (level) result.push(stats[index] + (level > 0 ? '+' : '') + level); });
    if (C.Supported(pet.petId)) {
      if (!C.Soul(pet)) result.push('魂印在本场BOSS战中不生效');
      else if (pet.petId === 3022) result.push('魂印减伤：' + Math.max(0, 75 - Math.floor((pet.maxHp - pet.hp) * 10 / pet.maxHp) * 15) + '%');
      else if (pet.petId === 3406 && pet.championState?.reyUsed) result.push('魂印救援已使用；剩余强化招式' + (pet.championState.reyCharges || 0) + '次');
      else result.push('魂印生效中');
    }
    return result;
  }
  static View(manager, operation = 0) {
    const battle = manager._currentBattle;
    if (!battle) return { ok: true, operation, active: false, report: manager.Player.lastBattleExperience || null };
    const report = this.Ensure(battle);
    const reverse = battle.isPvp && battle.userId !== manager.UserID;
    const own = reverse ? battle.enemy : battle.player, foe = reverse ? battle.player : battle.enemy;
    return { ok: true, operation, active: true, id: report.id, turn: battle.turn || 0, seq: report.seq,
      own: { name: own.name, effects: this.Effects(battle, own) }, foe: { name: foe.name, effects: this.Effects(battle, foe) },
      events: report.events.slice(-12).map(event => ({ ...event, side: reverse ? event.side === 'player' ? 'enemy' : event.side === 'enemy' ? 'player' : event.side : event.side })) };
  }
  static Push(manager) { return manager.Player.SendPacket(new PacketExperience(this.View(manager))); }
  static Install(BattleManager) {
    if (this.installed) return; this.installed = true;
    const self = this;
    const wrap = (target, name, fn) => { const original = target[name]; if (typeof original !== 'function') throw new Error('Missing battle feedback hook ' + name); target[name] = function (...args) { return fn.call(this, original.bind(this), ...args); }; };
    wrap(Executor, 'ExecuteTurn', function (base, battle, ...args) {
      self.Ensure(battle);
      const value = base(battle, ...args);
      self.Dead(battle); return value;
    });
    wrap(Executor, 'ExecuteAttack', function (base, battle, attacker, defender, skill, userId, canAct, first) {
      const previous = self.frame;
      const frame = { battle, attacker, defender, skill, failure: null, blocks: [], absorbed: 0 };
      self.frame = frame;
      try {
        const result = base(battle, attacker, defender, skill, userId, canAct, first);
        const side = self.Side(battle, attacker), counter = self.Ensure(battle).counters[side];
        counter.damage += Math.max(0, result.damage || 0);
        if (!canAct.canAct) {
          const reason = reasons[canAct.reason] || (canAct.reason ? String(canAct.reason) + '，无法行动' : '受到控制，无法行动');
          self.Event(battle, attacker.name + '：' + reason, 'failure', side);
        } else if (frame.failure || result.missed) {
          counter.misses++; self.Event(battle, attacker.name + '使用' + skill.name + '：' + (frame.failure || '招式未命中'), 'failure', side);
        }
        if (frame.blocks.length) { counter.blocked++; self.Event(battle, defender.name + '：' + [...new Set(frame.blocks)].join('；'), 'block', self.Side(battle, defender)); }
        if (frame.absorbed > 0) self.Event(battle, defender.name + '护盾吸收' + frame.absorbed + '点伤害', 'shield', self.Side(battle, defender));
        self.Dead(battle); return result;
      } finally { self.frame = previous; }
    });
    wrap(R, 'Miss', function (base, defender, reason, ...args) {
      if (self.frame) self.frame.failure = reasons[reason] || '效果令招式失效（' + reason + '）';
      return base(defender, reason, ...args);
    });
    wrap(R, 'Blocked', function (base, defender, damage, reason, ...args) {
      if (self.frame && damage > 0) self.frame.blocks.push((names[reason] || reason) + (reason === 'chAttackBlock' ? '抵挡伤害，已消耗一次' : '抵挡伤害'));
      return base(defender, damage, reason, ...args);
    });
    wrap(R, 'DefenderSide', function (base, battle, attacker, defender, skill, damage, kind) {
      const shield = R.Get(defender, 'shield')?.points || 0;
      const value = base(battle, attacker, defender, skill, damage, kind);
      if (self.frame) {
        self.frame.absorbed += Math.max(0, shield - (R.Get(defender, 'shield')?.points || 0));
      }
      return value;
    });
    wrap(BattleCore, 'CalculateDamage', function (base, ...args) {
      const value = base(...args);
      if (self.frame && value.effectiveness === 0) self.frame.failure = '属性无效';
      return value;
    });
    wrap(C, 'EndTurn', function (base, battle) {
      const before = ['player', 'enemy'].map(side => ({ side, pet: battle[side], hp: battle[side].hp, used: !!battle[side].championState?.reyUsed }));
      const value = base(battle);
      for (const item of before) {
        if (!item.used && item.pet.championState?.reyUsed) self.Event(battle, item.pet.name + '魂印救援触发：回复体力、清除异常并获得后续强化', 'soul', item.side);
        else if (item.pet.hp > item.hp) self.Event(battle, item.pet.name + '魂印回复' + (item.pet.hp - item.hp) + '点体力', 'soul', item.side);
      }
      return value;
    });
    wrap(BattleManager.prototype, 'InitializeBattle', function (base, battle) { const value = base(battle); self.Ensure(battle); this.Player.lastBattleExperience = null; return value; });
    wrap(BattleManager.prototype, 'UseSkill', async function (base, skill) {
      const battle = this._currentBattle;
      if (battle) {
        const index = battle.player.skills.indexOf(skill);
        if (index >= 0 && battle.player.skillPP[index] <= 0) self.Event(battle, battle.player.name + '：所选技能PP不足', 'failure', 'player');
      }
      const value = await base(skill);
      await self.Push(this); return value;
    });
    wrap(BattleManager.prototype, 'EmitRoundEndEvent', async function (base, ...args) { const value = await base(...args); if (this._currentBattle) await self.Push(this); return value; });
    wrap(BattleManager.prototype, 'SendFightOverPacket', async function (base, player, reason, winner) {
      const battle = this._currentBattle;
      if (battle) self.Ensure(battle).outcome = { winner, reason };
      return base(player, reason, winner);
    });
    wrap(BattleManager.prototype, 'CleanupBattle', function (base) {
      const battle = this._currentBattle;
      if (battle) {
        self.Dead(battle);
        const report = self.Ensure(battle), reverse = battle.isPvp && battle.userId !== this.UserID;
        const side = value => reverse ? value === 'player' ? 'enemy' : 'player' : value;
        const outcome = report.outcome;
        this.Player.lastBattleExperience = { id: report.id, turns: battle.turn || 0,
          result: !outcome ? '战斗中断' : outcome.reason === 1 ? '离开战斗' : outcome.winner === this.UserID ? '胜利' : '败退',
          counters: reverse ? { player: report.counters.enemy, enemy: report.counters.player } : report.counters,
          lost: report.lost.map(item => ({ ...item, side: side(item.side) })),
          events: report.events.map(event => ({ ...event, side: event.side ? side(event.side) : undefined })), truncated: report.seq > report.events.length };
      }
      return base();
    });
  }
}
module.exports = { BattleExperience, PacketExperience };
