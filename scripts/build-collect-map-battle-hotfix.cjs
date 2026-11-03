'use strict';
// Patch an explicitly captured deployed application without rebuilding unrelated releases.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {parseArgs} = require('node:util');
const {values} = parseArgs({options: {baseline: {type: 'string'}, out: {type: 'string'}}});
if (!values.baseline || !values.out) throw Error('Usage: node build-collect-map-battle-hotfix.cjs --baseline <app> --out <directory>');
const baseline = path.resolve(values.baseline), output = path.resolve(values.out), files = [];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function patch(relative, transform) {
  const source = fs.readFileSync(path.join(baseline, relative));
  const result = Buffer.from(transform(source.toString('utf8')));
  const destination = path.join(output, 'app', relative);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.writeFileSync(destination, result);
  files.push({path: 'app/' + relative, before: hash(source), after: hash(result)});
}
function replace(text, before, after) {
  if (text.split(before).length !== 2) throw Error('Changed deployed source anchor: ' + before);
  return text.replace(before, after);
}
patch('dist/GameServer/Game/Battle/SkillEffectRuntime.js', text => replace(text,
  'if (!battle?.universeBoss || defender.hp <= 0 || !(damage > 0)) return 0;',
  'if (!require("./UniverseBossBudget").enabled(battle) || defender.hp <= 0 || !(damage > 0)) return 0;'));
patch('dist/GameServer/Game/Map/MapSpawnManager.js', text => replace(text,
  'hp: boss.petId === 47 ? (boss.customHP || 100) : (boss.customHP || boss.level || 100),',
  'hp: boss.petId === 47 ? 100 : (boss.customHP || boss.level || 100),'));
for (const name of ['UniverseBossBudget', 'UniverseBossSegments']) {
  patch('dist/GameServer/Game/Battle/' + name + '.js', () =>
    fs.readFileSync(path.join(__dirname, '../compat/server-patches/universe-budgets', name + '.js')));
}
patch('dist/GameServer/Game/Battle/BattleTurnExecutor.js', require('./patch-attack-damage-display.cjs'));
patch('dist/GameServer/Game/Battle/BattleConverter.js', text =>
  replace(text, '.setDamage(attack.damage)', '.setDamage(attack.displayDamage ?? attack.damage)'));
fs.mkdirSync(output, {recursive: true});
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseChanges: false}, null, 2) + '\n');
console.log(JSON.stringify({output, files}));
