'use strict';
// BOSS difficulty lab: a team of pets (level 100 unless LEVEL is set; DV 31, 252 HP and main-attack EV) fights a boss N times through the real
// turn pipeline of an isolated runtime copy (no database or network). Used to calibrate lock-and-key bosses.
// Usage: node scripts/boss-lab.cjs <runtime app dir with dist/config/node_modules> <map/param2> [fights]
// env:
//   TEAM=70,261,...     pet ids in order (default: 雷伊, 盖亚, 哈莫雷特, 厄尔塞拉, 谱尼, 塞维尔)
//   POLICY=greedy       best power × type effectiveness
//          types:3,4    only moves of these types; a pet without one is switched out
//          status       inflict a status first when the boss is below 40% and has none
//   Key policies carry four moves: the pet's best key moves, then its strongest attacks.
//          status:5     use the best move for this status whenever the boss lacks it; below 45% switch its holder in
//          clear        use a boost-clearing move while the boss has a stage of +2 or more
//          armor        lower defence or special defence until one of them is below 0 (armor:both = until both are)
//          multihit     only multi-hit attacks; a pet without one is switched out
//          musthit      only sure-hit attacks; a pet without one is switched out
//          sequence:1,5 only the type the boss currently needs; a pet without it is switched out
//   POTIONS=n           特级体力药剂 (heals 200, the boss still acts) when below 55%
//   LEVEL=n             team level (default 100); pets only carry moves learnt by then
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
  const effectList = require(path.join(app, 'config/data/json/skill_effects_v2.json')).effects;
  const effectText = Object.fromEntries(effectList.map(e => [e.effectId, e.name + e.description]));
  const argCount = Object.fromEntries(effectList.map(e => [e.effectId, e.argsNum || 0]));
  const statusSkill = sid => {
    const s = GameConfig.GetSkillById(sid);
    const ids = String(s.SideEffect || '').split(/\s+/).filter(Boolean).map(Number);
    if (!ids.some(id => /麻痹|烧伤|中毒|冻伤|睡眠|害怕/.test(effectText[id] || ''))) return 0;
    return s.Category === 4 ? 2 : 1;
  };
  // 技能的附加效果及参数（按效果表的参数个数切分 SideEffectArg）
  const effectsOf = sid => {
    const s = GameConfig.GetSkillById(sid);
    const ids = String(s.SideEffect || '').split(/\s+/).filter(Boolean).map(Number);
    const args = String(s.SideEffectArg || '').split(/\s+/).filter(Boolean).map(Number);
    let at = 0;
    return ids.map(id => ({id, args: args.slice(at, at += argCount[id] || 0)}));
  };
  const STATUS_EFFECT = {10: 0, 11: 1, 12: 2, 14: 5, 15: 6, 16: 8};
  const isAttack = sid => GameConfig.GetSkillById(sid).Category !== 4;
  const statusChance = (sid, status) => Math.max(0, ...effectsOf(sid).filter(e => STATUS_EFFECT[e.id] === status).map(e => e.args[0] || 0));
  const clears = sid => effectsOf(sid).some(e => [33, 430, 453].includes(e.id));
  const lowers = (sid, stat) => effectsOf(sid).some(e => e.id === 5 && e.args[0] === stat && e.args[2] < 0 && e.args[1] >= 70);
  const hits = sid => { const e = effectsOf(sid).find(x => x.id === 31); return e ? ((e.args[0] || 2) + (e.args[1] || e.args[0] || 2)) / 2 : 0; };
  const mustHit = sid => String(GameConfig.GetSkillById(sid).MustHit) === '1' && isAttack(sid);

  const team = (process.env.TEAM || '70,261,216,421,300,413').split(',').map(Number);
  const level = Number(process.env.LEVEL || 100);
  const policy = process.env.POLICY || 'greedy';
  const [mode, modeArg] = policy.split(':');
  const allowed = mode === 'types' ? modeArg.split(',').map(Number) : null;
  const sequence = mode === 'sequence' ? modeArg.split(',').map(Number) : null;
  const keyStatus = mode === 'status' && modeArg !== undefined ? Number(modeArg) : null;
  const legacy = ['greedy', 'types'].includes(mode) || (mode === 'status' && keyStatus === null);
  const [map, param2] = key.split('/').map(Number);
  const config = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(map, param2);
  const bossType = GameConfig.GetPetById(config.petId).Type;
  const power = (sid, petType) => {
    const s = GameConfig.GetSkillById(sid);
    return (s.Power || 0) * BattleAlgorithm.GetTypeEffectiveness(s.Type, bossType) * (s.Type === petType ? 1.5 : 1) * (hits(sid) || 1);
  };
  // 本策略下这个技能能不能打出伤害（排他类锁只认钥匙招）
  const counts = (sid, need) => {
    if (!isAttack(sid)) return false;
    if (mode === 'multihit') return hits(sid) > 0;
    if (mode === 'musthit') return mustHit(sid);
    if (sequence) return need === undefined || GameConfig.GetSkillById(sid).Type === need;
    return true;
  };
  const kit = id => {
    const moves = GameConfig.GetPetById(id).LearnableMoves?.Move || [];
    const all = moves.filter(x => +(x.LearningLv || 0) <= level).map(x => +(x.ID || x.id)).filter(sid => GameConfig.GetSkillById(sid));
    if (mode === 'status' && keyStatus === null) {
      const status = all.filter(statusSkill).sort((p, q) => statusSkill(q) - statusSkill(p))[0];
      return [...new Set([...(status ? [status] : []), ...all.slice(-5)])].slice(0, 6);
    }
    if (legacy) return all.slice(-6);
    const petType = GameConfig.GetPetById(id).Type;
    const byPower = list => [...list].sort((p, q) => power(q, petType) - power(p, petType));
    let keys = [];
    if (keyStatus !== null) keys = all.filter(sid => statusChance(sid, keyStatus) > 0).sort((p, q) => statusChance(q, keyStatus) - statusChance(p, keyStatus)).slice(0, 1);
    if (mode === 'clear') keys = byPower(all.filter(clears)).slice(0, 1);
    if (mode === 'armor') keys = [1, 3].map(stat => all.find(sid => lowers(sid, stat))).filter(Boolean).slice(0, modeArg === 'both' ? 2 : 1);
    if (mode === 'multihit' || mode === 'musthit') keys = byPower(all.filter(sid => counts(sid))).slice(0, 2);
    if (sequence) keys = [...new Set(sequence)].map(t => byPower(all.filter(sid => isAttack(sid) && GameConfig.GetSkillById(sid).Type === t))[0]).filter(Boolean);
    return [...new Set([...keys, ...byPower(all.filter(isAttack))])].slice(0, 4);
  };
  const member = id => {
    const cfg = GameConfig.GetPetById(id);
    const main = (cfg.Atk || 0) >= (cfg.SpAtk || 0) ? 'attack' : 'spAtk';
    const stat = (name, ev) => PetCalculator.CalculateStat(id, name, level, 31, ev, 0);
    const hp = PetCalculator.CalculateHP(id, level, 31, 252);
    const s = init.CalculateEnemyStats(cfg, level);
    const pet = init.BuildBattlePet(id, cfg.DefName, level, s.hp, s.maxHp, s.attack, s.defence, s.spAtk, s.spDef, s.speed, cfg.Type || 0, kit(id), 1700000000 + id, 0);
    return Object.assign(pet, {hp, maxHp: hp, attack: stat('atk', main === 'attack' ? 252 : 0), defence: stat('def', 0),
      spAtk: stat('spAtk', main === 'spAtk' ? 252 : 0), spDef: stat('spDef', 0), speed: stat('speed', 0)});
  };

  let wins = 0, turnsTotal = 0, petsLost = 0;
  for (let f = 0; f < fights; f++) {
    const roster = team.map(member);
    const boss = init.BuildBossBattlePet(config, GameConfig.GetPetById(config.petId));
    const battle = {userId: 1, player: roster[0], enemy: boss, turn: 0, isOver: false, startTime: 0, roundCount: 0,
      lastHitWasCritical: false, battleType: BattleType.BOSS, bossMapId: map, bossParam2: param2};
    Puni.InitPuniSeal(battle);
    await init.TriggerPassiveAbilities(battle.player, boss);
    BossSpecialRules.ResetBattleState?.(boss.id);
    BattleEffectIntegration.OnBattleStart(battle);
    let t = 0, potions = Number(process.env.POTIONS || 0);
    // 换人：主动换占用本回合（BOSS照常出手），倒下后换人不占回合
    const bring = async (pet, voluntary) => {
      battle.player = pet;
      await init.TriggerPassiveAbilities(pet, battle.enemy);
      if (voluntary) turns.ExecuteEnemyTurn(battle);
    };
    const holder = (test, except) => roster.find(p => p !== except && p.hp > 0 && p.skills.some((sid, i) => p.skillPP[i] > 0 && test(sid)));
    const keyTest = keyStatus !== null ? sid => statusChance(sid, keyStatus) > 0 : mode === 'clear' ? clears : mode === 'armor' ? sid => lowers(sid, 1) || lowers(sid, 3) : null;
    while (!battle.isOver && t < 200) {
      t++;
      const me = battle.player;
      const usable = me.skills.map((sid, i) => ({sid, i, s: GameConfig.GetSkillById(sid)})).filter(x => x.s && me.skillPP[x.i] > 0);
      const score = x => (x.s.Power || 0) * BattleAlgorithm.GetTypeEffectiveness(x.s.Type, battle.enemy.type) * (x.s.Type === me.type ? 1.5 : 1) * (legacy ? 1 : hits(x.sid) || 1);
      const enemy = battle.enemy, levels = enemy.battleLevels || [];
      let pick = null, keyNeeded = false;
      if (policy === 'status' && !(enemy.statusDurations || []).some(n => n > 0) && enemy.hp * 100 < enemy.maxHp * 40)
        pick = usable.filter(x => statusSkill(x.sid)).sort((p, q) => statusSkill(q.sid) - statusSkill(p.sid))[0] || null;
      // 钥匙异常一掉就补（刚结束的那一回合它抵抗，不浪费出手）
      if (keyStatus !== null && !((enemy.statusDurations || [])[keyStatus] > 0)) {
        const keyMove = usable.filter(x => statusChance(x.sid, keyStatus) > 0).sort((p, q) => statusChance(q.sid, keyStatus) - statusChance(p.sid, keyStatus))[0] || null;
        const low = enemy.hp * 100 < enemy.maxHp * 45;
        if (!(enemy.bossState?.keyGuard > 0)) {
          pick = keyMove;
          keyNeeded = low;
        } else if (enemy.hp * 100 < enemy.maxHp * 30) {
          // 它这回合抵抗钥匙异常，血又低：不出攻击招，免得没异常就把它打倒（它会回满）
          pick = keyMove || usable.find(x => x.s.Category === 4) || null;
          keyNeeded = !pick;
        }
      }
      if (mode === 'clear' && levels.some(l => l >= 2)) {
        keyNeeded = true;
        pick = usable.find(x => clears(x.sid)) || null;
      }
      if (mode === 'armor' && !(modeArg === 'both' ? levels[1] < 0 && levels[3] < 0 : levels[1] < 0 || levels[3] < 0)) {
        keyNeeded = true;
        pick = usable.find(x => lowers(x.sid, 1) && !(levels[1] < 0)) || usable.find(x => lowers(x.sid, 3) && !(levels[3] < 0)) || null;
      }
      const need = sequence ? sequence[(enemy.bossState?.sequencePhase || 0) % sequence.length] : undefined;
      // 需要钥匙招而当前精灵没有：换上有钥匙招的精灵
      const keyHolder = keyNeeded && !pick && keyTest ? holder(keyTest, me) : null;
      if (!pick) {
        let pool = usable.filter(x => x.s.Category !== 4);
        if (allowed) pool = pool.filter(x => allowed.includes(+x.s.Type));
        if (!legacy) pool = pool.filter(x => counts(x.sid, need));
        pick = pool.sort((p, q) => score(q) - score(p))[0];
      }
      const exclusive = allowed || ['multihit', 'musthit', 'sequence'].includes(mode);
      const swap = keyHolder || (exclusive && !pick ? holder(sid => isAttack(sid) && (allowed ? allowed.includes(+GameConfig.GetSkillById(sid).Type) : counts(sid, need)), me) : null);
      if (exclusive && !pick && !swap) break;
      if (swap) {
        await bring(swap, true);
        if (process.env.DEBUG && f === 0) console.log(`t${t} 换上 ${swap.name}`);
      } else if (potions > 0 && me.hp * 100 < me.maxHp * 55) {
        potions--;
        me.hp = Math.min(me.maxHp, me.hp + 200);
        turns.ExecuteEnemyTurn(battle);
      } else {
        const before = {p: me.hp, e: battle.enemy.hp};
        turns.ExecuteTurn(battle, pick ? pick.sid : me.skills[0]);
        if (process.env.DEBUG && f === 0) console.log(`t${t} ${me.name} ${pick ? pick.s.Name + '/' + pick.s.Type + '/' + pick.s.Power : '-'} -> boss ${before.e - battle.enemy.hp} (hp ${battle.enemy.hp}/${battle.enemy.maxHp} lv ${JSON.stringify([...(battle.enemy.battleLevels || [])])} st ${JSON.stringify((battle.enemy.statusDurations || []).map((d, i) => d > 0 ? i : -1).filter(i => i >= 0))}), me -${before.p - me.hp} (hp ${me.hp}/${me.maxHp})`);
      }
      if (battle.enemy.hp <= 0) { battle.isOver = true; wins++; break; }
      if (battle.player.hp <= 0) {
        petsLost++;
        const nextPet = roster.find(p => p.hp > 0);
        if (!nextPet) break;
        await bring(nextPet, false);
      }
    }
    turnsTotal += t;
  }
  console.log(`${key} ${config.petName} Lv${config.level} HP${config.customHP} [${policy}${process.env.TEAM ? ' team ' + process.env.TEAM : ''}${process.env.POTIONS ? ' potions ' + process.env.POTIONS : ''}${level !== 100 ? ' Lv' + level : ''}]: ` +
    `win ${Math.round(wins * 100 / fights)}%  avg turns ${(turnsTotal / fights).toFixed(1)}  pets lost/fight ${(petsLost / fights).toFixed(1)}`);
})().catch(e => { console.error(e); process.exit(1); });
