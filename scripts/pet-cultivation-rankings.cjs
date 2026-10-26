'use strict';
const vm = require('node:vm');
const tier = score => score >= 85 ? 0 : score >= 70 ? 1 : score >= 55 ? 2 : score >= 35 ? 3 : 4;
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const dimension = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return value => {
    let low = 0, high = sorted.length;
    while (low < high) { const middle = (low + high) >>> 1; if (sorted[middle] <= value) low = middle + 1; else high = middle; }
    return sorted.length ? low / sorted.length : 0;
  };
};
function leaf(source, dependencies) {
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, Buffer, require(name) {
    if (!Object.hasOwn(dependencies, name)) throw new Error('Unexpected ranking runtime dependency: ' + name);
    return dependencies[name];
  } }, { timeout: 3000 });
  return module.exports;
}
const soulRules = {
  3022: { common: ['damageReduction', 'heal', 'statusImmune'], arena: [], text: '魂印：随已损体力变化的减伤；体力低于对手时回合末回复，高于对手时免疫异常。' },
  3406: { common: [], arena: ['priority', 'heal', 'cleanse', 'damageBoost'], text: '魂印：非Boss战的先制与增伤；满足低体力条件时每场一次回复、清除自身不利状态并清理对手效果。' },
  3481: { common: [], arena: ['heal', 'damageBoost', 'damageReduction', 'ignoreDefense', 'priority'], text: '魂印：非Boss战按异常状态切换续航或减伤，并按上一回合伤害提供后续进攻收益。' }
};
const commonEffects = new Set([1, 4, 5, 7, 10, 11, 12, 13, 14, 15, 16, 22, 28, 33, 36, 43, 49, 52, 71, 87]);
const championFeatures = {
  191: 'statusImmune', 429: 'fixed', 440: 'ppPressure', 444: 'ppRestore', 450: 'heal', 521: 'cleanse', 570: 'shield', 582: 'damageBoost',
  585: 'boost', 669: 'priority', 683: 'fixed', 695: 'control', 697: 'ignoreCap', 699: 'ignoreImmune', 734: 'heal',
  749: 'debuff', 760: 'ignoreDefense', 764: 'retaliation', 779: 'priority', 781: 'clear', 794: 'clear', 821: 'protectEffects',
  843: 'priority', 880: 'clear', 881: 'priority', 882: 'damageBoost', 883: 'teamPressure', 884: 'control', 885: 'boost',
  886: 'ignoreDefense', 920: 'damageBoost', 971: 'heal', 982: 'control', 1014: 'boost', 1043: 'heal',
  1060: 'clear', 1121: 'damageReduction', 1136: 'fixed', 1179: 'damageBoost', 1209: 'clear', 1265: 'damageReduction', 1266: 'shield'
};
function applyRankings(catalogue, { read, pets, learnById, effectList, describe, farms }) {
  const elements = JSON.parse(read('app/config/data/json/elements.json'));
  const natures = JSON.parse(read('app/config/data/json/natures.json'));
  const gameConfig = { GetElementConfig: () => elements, GetNatureConfig: () => natures,
    GetPetById: id => { const pet = pets.get(Number(id)); return pet ? { ...pet, ...Object.fromEntries(['HP','Atk','Def','SpAtk','SpDef','Spd'].map(key => [key, Number(pet[key])])) } : undefined; } };
  const logger = { Debug() {}, Info() {}, Warn(message) { throw new Error(message); }, Error(message) { throw new Error(message); } };
  const dependencies = { '../../../shared/config/game/GameConfig': { GameConfig: gameConfig }, '../../../shared/utils': { Logger: logger } };
  const natureRuntime = leaf(read('app/dist/GameServer/Game/Battle/NatureSystem.js'), dependencies);
  const calculator = leaf(read('app/dist/GameServer/Game/Pet/PetCalculator.js'), { ...dependencies, '../Battle/NatureSystem': natureRuntime }).PetCalculator;
  const elemental = leaf(read('app/dist/GameServer/Game/Battle/ElementSystem.js'), dependencies).ElementSystem;
  const championData = JSON.parse(read('app/dist/GameServer/Game/Battle/ChampionPetData.json'));
  const championArguments = JSON.parse(read('app/dist/GameServer/Game/Battle/ChampionEffectArguments.json'));
  const champion = leaf(read('app/dist/GameServer/Game/Battle/ChampionPetRuntime.js'), { './ChampionPetData.json': championData, './ChampionEffectArguments.json': championArguments }).ChampionPetRuntime;
  const arena = JSON.parse(read('app/dist/GameServer/Game/Battle/StarArenaCatalog.json'));
  const opponents = arena.arenas.flatMap(group => group.trainers.flatMap(trainer => trainer.team));
  if (!opponents.length) throw new Error('Missing arena evaluation opponents');
  const final = catalogue.filter(pet => Number(pets.get(pet.id).EvolvesTo || 0) === 0);
  const totals = dimension(final.map(pet => pet.stats.total));
  const attack = dimension(final.map(pet => Math.max(pet.stats.atk, pet.stats.spAtk)));
  const speed = dimension(final.map(pet => pet.stats.spd));
  const bulk = dimension(final.map(pet => pet.stats.hp + (pet.stats.def + pet.stats.spDef) / 2));
  const neutral = natures.natures.find(nature => !Number(nature.upStat) && !Number(nature.downStat) || Number(nature.upStat) === Number(nature.downStat));
  if (!neutral) throw new Error('Missing neutral nature for ranking benchmark');
  const foeSpeeds = opponents.map(entry => calculator.CalculateStat(entry.petId, 'speed', 100, 31, entry.ev?.[5] || 0, entry.nature || 0));
  const fifthIds = new Set(catalogue.map(pet => champion.Fifth(pet.id)).filter(Boolean));
  const toMove = move => ({ id: Number(move.ID), name: move.Name, level: Number(move.level), description: describe(move) });
  for (const pet of catalogue) {
    pet.finalForm = Number(pets.get(pet.id).EvolvesTo || 0) === 0;
    pet.mainAttack = Math.max(pet.stats.atk, pet.stats.spAtk);
    const category = pet.stats.atk >= pet.stats.spAtk ? 1 : 2;
    const allMoves = [...(learnById.get(pet.id) || [])];
    const fifthId = champion.Fifth(pet.id);
    if (fifthId && !allMoves.some(move => Number(move.ID) === fifthId)) {
      const raw = championData.moves.find(move => Number(move.ID) === fifthId);
      if (!raw) throw new Error('Missing registered fifth skill ' + fifthId);
      allMoves.push({ ...raw, level: 100 });
    }
    const effectsOf = move => {
      const entries = champion.Entries({ id: Number(move.ID) });
      return entries ? entries.map(entry => ({ id: entry.id, a: entry.args })) : effectList(move);
    };
    const features = move => {
      const result = new Set();
      for (const effect of effectsOf(move)) {
        if (effect.id === 4 && effect.a[1] === 100 && effect.a[2] > 0) {
          if (effect.a[0] === (category === 1 ? 0 : 2)) result.add('boost');
          if ([1, 3].includes(effect.a[0])) result.add('defenseBoost');
          if (effect.a[0] === 4) result.add('speedBoost');
        }
        if ((effect.id === 885 || effect.id === 1014) && effect.a[0] > 0) { result.add('defenseBoost'); result.add('speedBoost'); }
        if (effect.id === 585) {
          if (effect.a[1] > 0 || effect.a[3] > 0) result.add('defenseBoost');
          if (effect.a[4] > 0) result.add('speedBoost');
        }
        if (effect.id === 5 && effect.a[2] < 0) result.add('debuff');
        if (effect.id === 43 || effect.id === 1) result.add('heal');
        if (effect.id === 33) result.add('clear');
        if ([49, 52].includes(effect.id)) result.add('shield');
        if ([10, 11, 12, 14, 15, 16, 22].includes(effect.id) && effect.a[0] >= 50) result.add('control');
        if (effect.id === 13) result.add('seed');
        if (effect.id === 28 && Number(move.Category) === 4) result.add('percent');
        if (effect.id === 71) result.add('relay');
        if (effect.id === 87) result.add('ppRestore');
      }
      for (const effect of champion.Entries({ id: Number(move.ID) }) || []) if (championFeatures[effect.id]) result.add(championFeatures[effect.id]);
      if (Number(move.Priority || 0) > 0) result.add('priority');
      return result;
    };
    const moveFeatures = new Map(allMoves.map(move => [Number(move.ID), features(move)]));
    const has = feature => allMoves.some(move => moveFeatures.get(Number(move.ID)).has(feature));
    const physical = category === 1, mainName = physical ? '攻击' : '特攻';
    const slowHealer = has('heal') && pet.stats.spd < 100;
    const ownSpeed = calculator.CalculateStat(pet.id, 'speed', 100, 31, slowHealer ? 6 : 252, neutral.id);
    const speedCoverage = foeSpeeds.filter(value => ownSpeed > value).length / foeSpeeds.length;
    const damaging = allMoves.filter(move => Number(move.Category) === category && Number(move.Power) > 0);
    const coverageOf = moves => opponents.reduce((sum, foe) => {
      const type = Number(pets.get(foe.petId)?.Type);
      if (!type) throw new Error('Missing arena species type ' + foe.petId);
      const best = moves.reduce((value, move) => Math.max(value, elemental.GetEffectiveness(Number(move.Type), type)), 0);
      return sum + clamp(best / 2);
    }, 0) / opponents.length;
    const bestPower = damaging.reduce((best, move) => Math.max(best, Number(move.Power) * (Number(move.MustHit) === 1 ? 1 : Number(move.Accuracy || 100) / 100)), 0);
    const speciesScore = 20 * totals(pet.stats.total) + 8 * attack(pet.mainAttack) + 6 * speed(pet.stats.spd) + 6 * bulk(pet.stats.hp + (pet.stats.def + pet.stats.spDef) / 2);
    const role = slowHealer ? '续航站场' : has('priority') ? '先制输出' : has('boost') ? '强化主攻' : has('clear') ? '消强输出' : physical ? '物攻主力' : '特攻主力';
    const available = allMoves.filter(move => !fifthIds.has(Number(move.ID)));
    const power = move => Number(move.Category) === category ? Number(move.Power || 0) * (Number(move.MustHit) === 1 ? 1 : Number(move.Accuracy || 100) / 100) : 0;
    const quality = (move, flag) => {
      const effects = effectsOf(move);
      if (flag === 'heal') return effects.some(effect => effect.id === 43) || (champion.Entries({ id: Number(move.ID) }) || []).some(effect => championFeatures[effect.id] === 'heal') ? 1 : 0.55;
      if (['boost', 'defenseBoost', 'speedBoost'].includes(flag)) {
        const indices = flag === 'boost' ? [category === 1 ? 0 : 2] : flag === 'defenseBoost' ? [1, 3] : [4];
        const stages = effects.filter(effect => effect.id === 4 && indices.includes(effect.a[0]) && effect.a[1] === 100).reduce((sum, effect) => sum + Math.max(0, effect.a[2]), 0);
        return stages ? Math.min(1.3, stages / 2) : 1;
      }
      return 1;
    };
    const chosen = [], covered = new Set();
    const bestAttack = [...available].filter(move => power(move) > 0).sort((a, b) => power(b) - power(a) || Number(a.ID) - Number(b.ID))[0];
    if (bestAttack) { chosen.push(bestAttack); for (const flag of moveFeatures.get(Number(bestAttack.ID))) covered.add(flag); }
    while (chosen.length < 4) {
      const marginal = move => {
        let value = power(move) / 12;
        for (const flag of moveFeatures.get(Number(move.ID))) if (!covered.has(flag)) value += quality(move, flag) * ({ heal: 44, boost: 36, defenseBoost: 24, speedBoost: 20, clear: 28, shield: 20, priority: 20, control: 18, statusImmune: 24, cleanse: 20, damageReduction: 24, ignoreDefense: 25, ignoreCap: 20, ignoreImmune: 20, teamPressure: 20, ppPressure: 16, ppRestore: 12, damageBoost: 22, debuff: 12, protectEffects: 12, retaliation: 18 }[flag] || 0);
        return value;
      };
      const next = available.filter(move => !chosen.some(entry => entry.ID === move.ID)).sort((a, b) => marginal(b) - marginal(a) || Number(a.ID) - Number(b.ID))[0];
      if (!next) break;
      chosen.push(next); for (const flag of moveFeatures.get(Number(next.ID))) covered.add(flag);
    }
    const chosenFlags = new Set(chosen.flatMap(move => [...moveFeatures.get(Number(move.ID))]));
    const fifth = allMoves.find(move => Number(move.ID) === champion.Fifth(pet.id));
    if (fifth) for (const feature of moveFeatures.get(Number(fifth.ID))) chosenFlags.add(feature);
    const coverage = coverageOf([...chosen, ...(fifth ? [fifth] : [])].filter(move => power(move) > 0));
    const useful = feature => chosenFlags.has(feature);
    const skillScore = Math.min(35, 12 * clamp(bestPower / 160) + (useful('boost') ? 6 : 0) + (useful('heal') ? 6 : 0) + (useful('clear') ? 4 : 0) + (useful('priority') ? 3 : 0) + (useful('shield') || useful('control') || useful('statusImmune') ? 4 : 0));
    const soul = champion.Supported(pet.id) ? soulRules[pet.id] : null;
    const soulFeatures = new Set(soul ? [...soul.common, ...soul.arena] : []);
    const passiveScore = flags => Math.min(15, [...flags].reduce((sum, feature) => sum + ({ damageReduction: 5, heal: 4, statusImmune: 3, priority: 3, damageBoost: 3, cleanse: 2, ignoreDefense: 3 }[feature] || 0), 0));
    const soulScore = passiveScore(soulFeatures);
    const fit = 5 * coverage + 3 * speedCoverage + (useful('heal') || useful('shield') ? 2 : 0);
    const overallScore = Math.round(speciesScore + skillScore + soulScore + fit);
    const arenaSpecies = 12 * totals(pet.stats.total) + 10 * attack(pet.mainAttack) + 8 * speed(pet.stats.spd) + 10 * bulk(pet.stats.hp + (pet.stats.def + pet.stats.spDef) / 2);
    const arenaScore = Math.round(arenaSpecies + skillScore + soulScore + fit);
    const training = [mainName + '252 + ' + (slowHealer ? '体力252 + 速度6' : '速度252 + 体力6') + '（总计510）；按目标选手可调整。',
      '比较基准：100级、31个体、中性性格；速度覆盖只比较开场面板，不包含先制、强化和异常。'];
    for (const index of [physical ? 1 : 3, slowHealer ? 0 : 5]) if (farms[index].length) training.push('刷' + ['体力','攻击','防御','特攻','特防','速度'][index] + '：' + farms[index][0].text + '。');
    const commonReasons = ['种族' + speciesScore.toFixed(1) + '/40：总和、有效主攻、速度、生存分布；不重复累加双攻。',
      '技能' + skillScore.toFixed(1) + '/35：仅按推荐四招及独立第五技能中的已识别机制计分。',
      '魂印' + soulScore + '/15：' + (soul ? soul.text : '无已接入的物种魂印加分；不假定随机特性已开启。'),
      '适配' + fit.toFixed(1) + '/10：按三座擂台当前' + opponents.length + '个出战位置评估属性覆盖与开场速度，并计续航能力。'];
    const limits = ['这是规则初评，不是胜率或逐只实战结论；不代表能单宠通关全部选手。',
      '擂台禁止战斗道具；不能靠吃药补足续航。属性克制、先制和临场换宠仍可能改变结果。'];
    const unknown = new Set(allMoves.flatMap(move => effectList(move).filter(effect => !commonEffects.has(effect.id) && !championFeatures[effect.id]).map(effect => effect.id)));
    if (unknown.size) limits.push('部分附加效果尚未进入此榜规则，未按描述猜测加分；不代表这些效果在战斗中无效。');
    const make = (score, summary, reasons, caveats) => ({ score, tier: tier(score), role, summary, reasons, caveats, training, moves: chosen.map(toMove), fifth: fifth ? toMove(fifth) : null });
    const mechanisms = [['boost','强化'],['heal','回复'],['clear','消强'],['priority','先制'],['shield','护盾'],['statusImmune','异常防护'],['control','控制'],['ignoreDefense','破防']]
      .filter(([feature]) => useful(feature)).map(([, label]) => label);
    const brief = mechanisms.length ? mechanisms.join('、') : '已识别机制较少';
    const arenaBrief = (useful('heal') ? '有回复手段，可持续对抗' : '缺少自身回复，需队友接应') +
      '；基准面板先手覆盖' + Math.round(speedCoverage * 100) + '%' + (useful('priority') ? '，另有先制手段' : '') + '。';
    pet.ratings = {
      overall: make(overallScore, brief + '；' + (soul ? '专属魂印已接入。' : '未计入专属魂印收益。'), commonReasons, limits),
      arena: make(arenaScore, arenaBrief, ['擂台种族' + arenaSpecies.toFixed(1) + '/40：提高速度和生存占比。', ...commonReasons.slice(1)], limits),
      boss: { score: pet.score, tier: pet.tier, role: pet.role, summary: pet.summary, reasons: pet.reasons, caveats: pet.caveats, training: pet.training, moves: pet.moves.filter(move => !fifthIds.has(move.id)), fifth: fifth ? toMove(fifth) : null }
    };
    if (soul || fifth) {
      const bossSoul = passiveScore(new Set(soul?.common || []));
      const bossScore = Math.round(speciesScore + skillScore + bossSoul + (useful('heal') ? 5 : 0) + (useful('clear') ? 5 : 0));
      pet.ratings.boss = make(bossScore, role + '；按Boss战实际保留的魂印和技能评价。',
        ['Boss战不计仅非Boss战触发的魂印收益。', ...commonReasons.slice(0, 2), 'Boss魂印' + bossSoul + '/15。'], pet.caveats);
    }
    pet.score = overallScore; pet.tier = tier(overallScore); pet.role = role; pet.summary = pet.ratings.overall.summary;
    pet.search += ' ' + allMoves.map(move => move.Name).join(' ');
  }
  return catalogue;
}
module.exports = { applyRankings, tier };
