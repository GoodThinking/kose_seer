'use strict';
// BOSS difficulty lab: a team of level-100 pets (DV 31, 252 HP and main-attack EV) fights a boss N times through the real
// turn pipeline of an isolated runtime copy (no database or network). Used to calibrate lock-and-key bosses.
// Usage: node scripts/boss-lab.cjs <runtime app dir with dist/config/node_modules> <map/param2> [fights]
// env:
//   TEAM=70,261,...     pet ids in order (default: 雷伊, 盖亚, 哈莫雷特, 厄尔塞拉, 谱尼, 塞维尔)
//   POLICY=greedy       best power × type effectiveness
//          types:3,4    only moves of these types; a pet without one is switched out
//          status       inflict a status first when the boss is below 40% and has none
//   POTIONS=n           特级体力药剂 (heals 200, the boss still acts) when below 55%
//   BOSS_PATCH={"map/param2": {...}}  shallow-merged into the boss config before the fights
//   DEBUG=1             print the first fight turn by turn
const path = require('node:path');
const [runtime, key, fightsArg] = process.argv.slice(2);
const app = path.resolve(runtime);
const fights = Number(fightsArg || 40);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));

(async () => {
  const {Logger, LogLevel} = load('shared/utils/Logger');
  Logger.SetMinLevel(LogLevel.Error);
  const {ConfigLoader} = load('shared/config/ConfigLoader');
  const {ConfigRegistry} = load('shared/config/ConfigRegistry');
  const {GetGameConfigRegistrations} = load('shared/config/ConfigDefinitions');
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigLoader.Instance.Reload?.();
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
  await ConfigRegistry.Instance.Initialize();
  const {GameConfig} = load('shared/config/game/GameConfig');
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();
  const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
  BossAbilityConfig.Instance.Load();
  const {BattleInitService} = load('GameServer/Game/Battle/services/BattleInitService');
  const {BattleTurnService} = load('GameServer/Game/Battle/services/BattleTurnService');
  const {BattleEffectIntegration} = load('GameServer/Game/Battle/BattleEffectIntegration');
  const {BossSpecialRules} = load('GameServer/Game/Battle/BossSpecialRules');
  const Puni = load('GameServer/Game/Battle/PuniSealBattle');
  const {BattleType} = load('shared/models/BattleModel');
  const {BattleAlgorithm} = load('GameServer/Game/Battle/BattleAlgorithm');
  const {PetCalculator} = load('GameServer/Game/Pet/PetCalculator');
  const init = new BattleInitService({Uid: 1}), turns = new BattleTurnService();

  for (const [k, patch] of Object.entries(JSON.parse(process.env.BOSS_PATCH || '{}'))) {
    const [pm, pp] = k.split('/').map(Number);
    Object.assign(BossAbilityConfig.Instance.GetBossConfigByMapAndParam(pm, pp), patch);
  }
  const effectText = Object.fromEntries(require(path.join(app, 'config/data/json/skill_effects_v2.json')).effects.map(e => [e.effectId, e.name + e.description]));
  const statusSkill = sid => {
    const s = GameConfig.GetSkillById(sid);
    const ids = String(s.SideEffect || '').split(/\s+/).filter(Boolean).map(Number);
    if (!ids.some(id => /麻痹|烧伤|中毒|冻伤|睡眠|害怕/.test(effectText[id] || ''))) return 0;
    return s.Category === 4 ? 2 : 1;
  };
  const team = (process.env.TEAM || '70,261,216,421,300,413').split(',').map(Number);
  const policy = process.env.POLICY || 'greedy';
  const allowed = policy.startsWith('types:') ? policy.slice(6).split(',').map(Number) : null;
  const kit = id => {
    const moves = GameConfig.GetPetById(id).LearnableMoves?.Move || [];
    const all = moves.map(x => +(x.ID || x.id)).filter(sid => GameConfig.GetSkillById(sid));
    if (policy === 'status') {
      const status = all.filter(statusSkill).sort((p, q) => statusSkill(q) - statusSkill(p))[0];
      return [...new Set([...(status ? [status] : []), ...all.slice(-5)])].slice(0, 6);
    }
    return all.slice(-6);
  };
  const member = id => {
    const cfg = GameConfig.GetPetById(id);
    const main = (cfg.Atk || 0) >= (cfg.SpAtk || 0) ? 'attack' : 'spAtk';
    const stat = (name, ev) => PetCalculator.CalculateStat(id, name, 100, 31, ev, 0);
    const hp = PetCalculator.CalculateHP(id, 100, 31, 252);
    const s = init.CalculateEnemyStats(cfg, 100);
    const pet = init.BuildBattlePet(id, cfg.DefName, 100, s.hp, s.maxHp, s.attack, s.defence, s.spAtk, s.spDef, s.speed, cfg.Type || 0, kit(id), 1700000000 + id, 0);
    return Object.assign(pet, {hp, maxHp: hp, attack: stat('atk', main === 'attack' ? 252 : 0), defence: stat('def', 0),
      spAtk: stat('spAtk', main === 'spAtk' ? 252 : 0), spDef: stat('spDef', 0), speed: stat('speed', 0)});
  };

  const [map, param2] = key.split('/').map(Number);
  const config = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(map, param2);
  let wins = 0, turnsTotal = 0, petsLost = 0;
  for (let f = 0; f < fights; f++) {
    const roster = team.map(member);
    let index = 0;
    const boss = init.BuildBossBattlePet(config, GameConfig.GetPetById(config.petId));
    const battle = {userId: 1, player: roster[0], enemy: boss, turn: 0, isOver: false, startTime: 0, roundCount: 0,
      lastHitWasCritical: false, battleType: BattleType.BOSS, bossMapId: map, bossParam2: param2};
    Puni.InitPuniSeal(battle);
    await init.TriggerPassiveAbilities(battle.player, boss);
    BossSpecialRules.ResetBattleState?.(boss.id);
    BattleEffectIntegration.OnBattleStart(battle);
    let t = 0, potions = Number(process.env.POTIONS || 0);
    const next = async () => {
      if (++index >= roster.length) return false;
      battle.player = roster[index];
      await init.TriggerPassiveAbilities(battle.player, battle.enemy);
      return true;
    };
    while (!battle.isOver && t < 200) {
      t++;
      const me = battle.player;
      const usable = me.skills.map((sid, i) => ({sid, i, s: GameConfig.GetSkillById(sid)})).filter(x => x.s && me.skillPP[x.i] > 0);
      const score = x => (x.s.Power || 0) * BattleAlgorithm.GetTypeEffectiveness(x.s.Type, battle.enemy.type) * (x.s.Type === me.type ? 1.5 : 1);
      let pick = null;
      if (policy === 'status' && !(battle.enemy.statusDurations || []).some(n => n > 0) && battle.enemy.hp * 100 < battle.enemy.maxHp * 40)
        pick = usable.filter(x => statusSkill(x.sid)).sort((p, q) => statusSkill(q.sid) - statusSkill(p.sid))[0] || null;
      if (!pick) {
        let pool = usable.filter(x => x.s.Category !== 4);
        if (allowed) pool = pool.filter(x => allowed.includes(+x.s.Type));
        pick = pool.sort((p, q) => score(q) - score(p))[0];
      }
      if (allowed && !pick) {
        if (!await next()) break;
        continue;
      }
      if (potions > 0 && me.hp * 100 < me.maxHp * 55) {
        potions--;
        me.hp = Math.min(me.maxHp, me.hp + 200);
        turns.ExecuteEnemyTurn(battle);
      } else {
        const before = {p: me.hp, e: battle.enemy.hp};
        turns.ExecuteTurn(battle, pick ? pick.sid : me.skills[0]);
        if (process.env.DEBUG && f === 0) console.log(`t${t} ${me.name} ${pick ? pick.s.Name + '/' + pick.s.Type + '/' + pick.s.Power : '-'} -> boss ${before.e - battle.enemy.hp} (hp ${battle.enemy.hp}/${battle.enemy.maxHp}), me -${before.p - me.hp} (hp ${me.hp}/${me.maxHp})`);
      }
      if (battle.enemy.hp <= 0) { battle.isOver = true; wins++; break; }
      if (battle.player.hp <= 0) {
        petsLost++;
        if (!await next()) break;
      }
    }
    turnsTotal += t;
  }
  console.log(`${key} ${config.petName} Lv${config.level} HP${config.customHP} [${policy}${process.env.TEAM ? ' team ' + process.env.TEAM : ''}${process.env.POTIONS ? ' potions ' + process.env.POTIONS : ''}]: ` +
    `win ${Math.round(wins * 100 / fights)}%  avg turns ${(turnsTotal / fights).toFixed(1)}  pets lost/fight ${(petsLost / fights).toFixed(1)}`);
})().catch(e => { console.error(e); process.exit(1); });
