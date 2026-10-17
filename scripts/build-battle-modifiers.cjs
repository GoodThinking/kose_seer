'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const util = require('node:util');
const {parseArgs} = require('node:util');
const names = ['context', 'baseline', 'out'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw Error('Missing --' + name);
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const ts = require(path.join(path.resolve(values.context), 'node_modules/typescript'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw Error(message); };
const files = [];
function put(relative, bytes) {
  const target = path.join(out, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, bytes);
  files.push({path: relative, before: sha(fs.readFileSync(path.join(baseline, relative))), after: sha(bytes)});
}

// Each insertion is anchored on one exact source line and indented like it; source maps get blank lines.
function patch(relative, insertions) {
  const text = fs.readFileSync(path.join(baseline, relative), 'utf8');
  const lines = text.split('\n');
  const edits = insertions.map(({anchor, code, after, occurrence = 0, count = 1}) => {
    const hits = lines.flatMap((line, index) => line.includes(anchor) ? [index] : []);
    check(hits.length === count, `Expected ${count} anchor ${JSON.stringify(anchor)} in ${relative}`);
    const index = hits[occurrence];
    const indent = lines[index].match(/^\s*/)[0];
    const block = code.trimEnd().split('\n').map(line => line ? indent + line : line);
    return {line: after ? index + 1 : index, block};
  }).sort((a, b) => b.line - a.line);
  for (const {line, block} of edits) lines.splice(line, 0, ...block);
  const result = lines.join('\n');
  check(!ts.createSourceFile(relative, result, ts.ScriptTarget.Latest, true).parseDiagnostics.length, 'Invalid patched module: ' + relative);
  put(relative, result);
  const mapPath = path.join(baseline, relative + '.map');
  if (fs.existsSync(mapPath)) {
    const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const mappings = map.mappings.split(';');
    for (const {line, block} of edits) mappings.splice(line, 0, ...Array(block.length).fill(''));
    map.mappings = mappings.join(';');
    put(relative + '.map', JSON.stringify(map));
  }
}
const battle = (directory, name, extension) => `app/${directory}/GameServer/Game/Battle/${name}${extension}`;

// Conditions used by the power and priority effects that skills actually carry.
const conditions = {
  ts: `case ConditionType.HP_PERCENT_BELOW: {
  const params = this.params as IConditionalParams & { hpDivisor?: number; target?: 'self' | 'opponent' };
  const pet = params.target === 'opponent' ? context.defender : context.attacker;
  const threshold = params.hpDivisor ? 100 / Number(params.hpDivisor) : Number(params.value);
  return pet.maxHp > 0 && pet.hp * 100 < pet.maxHp * threshold;
}
case ConditionType.SELF_HAS_STATUS:
case ConditionType.TARGET_HAS_STATUS: {
  const pet = this.params.condition === ConditionType.SELF_HAS_STATUS ? context.attacker : context.defender;
  return ([] as unknown[]).concat(this.params.value).some(status => (pet.statusDurations?.[Number(status)] ?? 0) > 0);
}
case ConditionType.SAME_TYPE: {
  const params = this.params as IConditionalParams & { compare?: 'opponent' };
  return params.compare === 'opponent' ? context.attacker.type === context.defender.type : context.skillType === context.attacker.type;
}
case ConditionType.SELF_HAS_STAT_DEBUFF:
case ConditionType.TARGET_HAS_STAT_DEBUFF: {
  const pet = this.params.condition === ConditionType.SELF_HAS_STAT_DEBUFF ? context.attacker : context.defender;
  return (pet.battleLevels ?? []).some(level => level < 0);
}
`,
  js: `case IAtomicEffect_1.ConditionType.HP_PERCENT_BELOW: {
    const pet = this.params.target === 'opponent' ? context.defender : context.attacker;
    const threshold = this.params.hpDivisor ? 100 / Number(this.params.hpDivisor) : Number(this.params.value);
    return pet.maxHp > 0 && pet.hp * 100 < pet.maxHp * threshold;
}
case IAtomicEffect_1.ConditionType.SELF_HAS_STATUS:
case IAtomicEffect_1.ConditionType.TARGET_HAS_STATUS: {
    const pet = this.params.condition === IAtomicEffect_1.ConditionType.SELF_HAS_STATUS ? context.attacker : context.defender;
    return [].concat(this.params.value).some(status => (pet.statusDurations?.[Number(status)] ?? 0) > 0);
}
case IAtomicEffect_1.ConditionType.SAME_TYPE:
    return this.params.compare === 'opponent' ? context.attacker.type === context.defender.type : context.skillType === context.attacker.type;
case IAtomicEffect_1.ConditionType.SELF_HAS_STAT_DEBUFF:
case IAtomicEffect_1.ConditionType.TARGET_HAS_STAT_DEBUFF: {
    const pet = this.params.condition === IAtomicEffect_1.ConditionType.SELF_HAS_STAT_DEBUFF ? context.attacker : context.defender;
    return (pet.battleLevels ?? []).some(level => level < 0);
}
`,
};
// Only power and priority timings get a skill copy; other skill-reading atoms keep their current behavior.
const skillState = 'power: skill.power || 0, accuracy: skill.accuracy, priority: skill.priority || 0';
const modifiable = {
  ts: 'timing === EffectTiming.BEFORE_DAMAGE_CALC || timing === EffectTiming.BEFORE_SPEED_CHECK',
  js: 'timing === EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC || timing === EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK',
};
const powerResult = {
  ts: `const powerResult = beforeCalcResults.filter(r => r.success && r.type === 'power_modifier').pop();
if (typeof powerResult?.value === 'number') skillPower = powerResult.value;
`,
  js: `const powerResult = beforeCalcResults.filter(r => r.success && r.type === 'power_modifier').pop();
if (typeof powerResult?.value === 'number')
    skillPower = powerResult.value;
`,
};
const priorityChange = {
  ts: `// Skill priority atoms report absolute values; only the change is added to the skill's own priority.
const priorityChange = (items: IEffectResult[]) => items.reduce((sum, r) =>
  r.success && r.type === 'priority_modifier' && r.data ? sum + r.data.newPriority - r.data.oldPriority : sum, 0);
attackerModifier.priorityMod += priorityChange(attackerResults);
defenderModifier.priorityMod += priorityChange(defenderResults);
`,
  js: `// Skill priority atoms report absolute values; only the change is added to the skill's own priority.
const priorityChange = (items) => items.reduce((sum, r) => r.success && r.type === 'priority_modifier' && r.data ? sum + r.data.newPriority - r.data.oldPriority : sum, 0);
attackerModifier.priorityMod += priorityChange(attackerResults);
defenderModifier.priorityMod += priorityChange(defenderResults);
`,
};
for (const [directory, extension, kind] of [['src', '.ts', 'ts'], ['dist', '.js', 'js']]) {
  patch(battle(directory, 'effects/atomic/core/ConditionalCheck', extension), [
    {anchor: 'default:', code: conditions[kind]},
  ]);
  // A per-trigger copy lets chained modifiers see each other without touching shared skill configs.
  patch(battle(directory, 'EffectTrigger', extension), [
    {anchor: 'context.skillPower = skill.power;', count: 2, occurrence: 0, after: true,
      code: `if (${modifiable[kind]})${kind === 'js' ? '\n    ' : ' '}context.skill = { ${skillState} };`},
    {anchor: 'for (let i = 0; i < effectIds.length; i++) {', code: `const skillState = ${modifiable[kind]} ? { ${skillState} } : undefined;`},
    {anchor: 'context.skillPower = skill.power;', count: 2, occurrence: 1, after: true, code: 'context.skill = skillState;'},
    {anchor: "'probability': 'value',", after: true, code: "'powerMultiplier': 'value',\n'priority': 'value',\n'powerBoost': 'value',"},
  ]);
  patch(battle(directory, 'BattleTurnExecutor', extension), [
    {anchor: 'let skillPower = skill.power || 40;', after: true, code: powerResult[kind]},
  ]);
  patch(battle(directory, 'BattleEffectIntegration', extension), [
    {anchor: 'const defenderModifier = this.CollectSpeedModifiers(defenderPassiveResults);', after: true, code: priorityChange[kind]},
  ]);
}

// PowerModifier multiplies raw power, so "+100%" is x2 and "+50%" is x1.5.
const configPath = 'app/config/data/json/skill_effects_v2.json';
const configText = fs.readFileSync(path.join(baseline, configPath), 'utf8');
const corrections = {
  2: atom => { atom.target = 'opponent'; atom.then[0].value = 2; },
  24: atom => { atom.then[0].value = 2; }, 30: atom => { atom.then[0].value = 2; }, 37: atom => { atom.then[0].value = 2; },
  40: atom => { atom.then[0].value = 2; }, 64: atom => { atom.then[0].value = 2; }, 96: atom => { atom.then[0].value = 2; },
  97: atom => { atom.then[0].value = 2; }, 102: atom => { atom.then[0].value = 2; }, 168: atom => { atom.then[0].value = 2; },
  431: atom => { atom.then[0].value = 2; }, 468: atom => { atom.then[0].value = 2; },
  25: atom => { atom.then[0].value = 1.5; }, 26: atom => { atom.then[0].value = 1.5; }, 27: atom => { atom.then[0].value = 1.5; },
  129: atom => { delete atom.then[0].multiplier; atom.then[0].value = 2; },
  132: atom => { delete atom.then[0].multiplier; atom.then[0].value = 2; },
  401: atom => { atom.compare = 'opponent'; delete atom.then[0].multiplier; atom.then[0].value = 2; },
};
const baselines = {2: 100, 24: 100, 30: 100, 37: 100, 40: 100, 64: 100, 96: 100, 97: 100, 102: 100, 168: 100, 431: 100, 468: 100,
  25: 50, 26: 50, 27: 50, 129: undefined, 132: undefined, 401: undefined};
function effectBlock(text, effectId) {
  const key = `"effectId": ${effectId},`;
  const at = text.indexOf(key);
  check(at >= 0 && text.indexOf(key, at + 1) < 0, 'Expected one effect ' + effectId);
  const start = text.lastIndexOf('{', at);
  let depth = 0, index = start;
  for (; index < text.length; index++) {
    if (text[index] === '{') depth++;
    else if (text[index] === '}' && --depth === 0) break;
  }
  const indent = text.slice(text.lastIndexOf('\n', start) + 1, start);
  return {start, end: index + 1, indent, value: JSON.parse(text.slice(start, index + 1))};
}
const render = (value, indent) => JSON.stringify(value, null, 2).split('\n').join('\n' + indent);
let configResult = configText;
const expected = JSON.parse(configText);
for (const [id, correct] of Object.entries(corrections)) {
  const block = effectBlock(configResult, id);
  check(render(block.value, block.indent) === configResult.slice(block.start, block.end), 'Effect formatting changed: ' + id);
  const atom = block.value.atomicComposition.atoms[0];
  check(atom.type === 'conditional' && atom.then[0].type === 'power_modifier' && atom.then[0].value === baselines[id], 'Unexpected effect baseline: ' + id);
  correct(atom);
  correct(expected.effects.find(e => e.effectId === Number(id)).atomicComposition.atoms[0]);
  configResult = configResult.slice(0, block.start) + render(block.value, block.indent) + configResult.slice(block.end);
}
check(util.isDeepStrictEqual(JSON.parse(configResult), expected), 'Unexpected skill effect changes');
put(configPath, configResult);

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, noDatabaseMigration: true,
  correctedEffects: Object.keys(corrections).map(Number)}, null, 2) + '\n');
console.log(JSON.stringify({files: files.length, correctedEffects: Object.keys(corrections).length, out}));
