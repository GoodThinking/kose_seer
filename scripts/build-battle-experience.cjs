'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const { values: options } = parseArgs({ options: { baseline: { type: 'string' }, out: { type: 'string' }, java: { type: 'string' }, ffdec: { type: 'string' }, 'server-only': { type: 'boolean', default: false } } });
for (const key of ['baseline', 'out']) assert.ok(options[key], 'Missing --' + key);
const root = path.resolve(__dirname, '..'), baseline = path.resolve(options.baseline), out = path.resolve(options.out);
assert.ok(!fs.existsSync(out), 'Choose a fresh output directory');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const guard = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/battle-experience/baseline.json'), 'utf8'));
const files = [];
function put(relative, bytes) {
  const target = path.join(out, relative), before = path.join(baseline, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
  files.push({ path: relative, before: fs.existsSync(before) ? sha(fs.readFileSync(before)) : null, after: sha(bytes) });
}
for (const [file, hash] of Object.entries(guard.files)) assert.equal(sha(fs.readFileSync(path.join(baseline, file))), hash, 'Live target changed; merge first: ' + file);
const serverSources = {
  'app/dist/GameServer/Server/Packet/Recv/NoNo/NonoExperienceHandler.js': 'nono-experience/NonoExperienceHandler.js',
  'app/dist/GameServer/Server/Packet/Recv/NoNo/TeamPresets.js': 'nono-experience/TeamPresets.js',
  'app/dist/GameServer/Server/Packet/Recv/Battle/BattleExperienceHandlers.js': 'battle-experience/BattleExperienceHandlers.js',
  'app/dist/GameServer/Game/Battle/BattleExperience.js': 'battle-experience/BattleExperience.js',
  'app/dist/GameServer/Game/Battle/ChampionPetRuntime.js': 'champion-pets/ChampionPetRuntime.js',
  'app/dist/GameServer/Game/Battle/ArenaStrategy.js': 'star-arena/ArenaStrategy.js',
  'app/dist/GameServer/Game/Task/MoonlightEssenceReward.js': 'essence-hatching/MoonlightEssenceReward.js'
};
for (const [destination, source] of Object.entries(serverSources)) put(destination, fs.readFileSync(path.join(root, 'compat/server-patches', source)));
const arenaRelative = 'app/dist/GameServer/Game/Battle/StarArena.js';
let arena = fs.readFileSync(path.join(baseline, arenaRelative), 'utf8');
const start = arena.indexOf('  static SelectSkill(battle,configs){'), end = arena.indexOf('  static SpendPP(', start);
assert.ok(start >= 0 && end > start);
arena = arena.slice(0, start) + "  static SelectSkill(battle,configs){\n    return require('./ArenaStrategy').ArenaStrategy.SelectSkill(battle,configs);\n  }\n" + arena.slice(end);
put(arenaRelative, arena);
const indexRelative = 'app/dist/GameServer/Server/Packet/Recv/Battle/index.js';
const index = fs.readFileSync(path.join(baseline, indexRelative), 'utf8');
assert.ok(!index.includes('BattleExperienceHandlers'));
put(indexRelative, index + '\n__exportStar(require("./BattleExperienceHandlers"), exports);\n');
const materialRelative = 'app/config/data/json/material-sources.json';
const materials = JSON.parse(fs.readFileSync(path.join(baseline, materialRelative), 'utf8'));
const diamond = materials.games.find(game => game.mapId === 13 && game.gameId === 1);
const policy = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/material-sources/material-sources.json'), 'utf8')).games.find(game => game.mapId === 13 && game.gameId === 1);
assert.equal(diamond.minimumSeconds, 5, 'Diamond collection time changed; merge first');
diamond.minimumSeconds = policy.minimumSeconds;
put(materialRelative, JSON.stringify(materials, null, 2) + '\n');
const tasksRelative = 'app/config/data/json/tasks.json';
const tasks = JSON.parse(fs.readFileSync(path.join(baseline, tasksRelative), 'utf8'));
const moonlight = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/logging-gaiyin/tasks.json'), 'utf8')).tasks['91'];
assert.equal(tasks.tasks['91'].name, moonlight.name);
assert.deepEqual(tasks.tasks['91'].rewards.items ?? [], [], 'Meteor reward changed; merge first');
tasks.tasks['91'].rewards.items = moonlight.rewards.items;
put(tasksRelative, JSON.stringify(tasks, null, 2) + '\n');
const taskManagerRelative = 'app/dist/GameServer/Game/Task/TaskManager.js';
let taskManager = fs.readFileSync(path.join(baseline, taskManagerRelative), 'utf8');
const initializeLog = '        Logger_1.Logger.Debug(`[TaskManager] 用户 ${this.UserID} 初始化完成`);';
assert.ok(taskManager.includes(initializeLog));
taskManager = taskManager.replace(initializeLog, '        await require("./MoonlightEssenceReward").ReconcileMoonlightEssence(this.Player);\n' + initializeLog);
put(taskManagerRelative, taskManager);
const completionRelative = 'app/dist/GameServer/Game/Task/CompleteConfiguredTask.js';
let completion = fs.readFileSync(path.join(baseline, completionRelative), 'utf8');
const rewardCommit = '                await driver.commit();\n                committed = true;\n                if (itemData) {';
assert.ok(completion.includes(rewardCommit));
const essenceReceipt = '                if (taskId === 91) {\n                    await driver.execute("INSERT INTO receiver_claims(owner_id,reward_key,period_start,claimed_at,amount) VALUES(?,?,0,?,1)", [player.Uid, require("./MoonlightEssenceReward").MOONLIGHT_ESSENCE_REWARD_KEY, Math.floor(Date.now() / 1000)]);\n                }\n';
completion = completion.replace(rewardCommit, essenceReceipt + rewardCommit);
put(completionRelative, completion);
const bossesRelative = 'app/config/data/json/boss_abilities.json';
const bosses = JSON.parse(fs.readFileSync(path.join(baseline, bossesRelative), 'utf8'));
const allison = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/map-mechanisms/allison-guard.json'), 'utf8'));
assert.ok(!bosses.bossConfigs.some(boss => boss.mapId === allison.mapId && boss.param2 === allison.param2), 'Allison plot opponent changed; merge first');
bosses.bossConfigs.push(allison);
put(bossesRelative, JSON.stringify(bosses, null, 2) + '\n');
const traitRelative = 'app/dist/GameServer/Game/Pet/PetTrait.js';
const traitBefore = fs.readFileSync(path.join(baseline, traitRelative), 'utf8');
const traitPredicate = 'return num(info?.BreedingMon ?? info?.breedingmon) === 1;';
assert.ok(traitBefore.includes(traitPredicate), 'Fusion trait classification changed; merge first');
put(traitRelative, traitBefore.replace(traitPredicate, 'return num(info?.IsFuseMon) === 1;'));
function parse(raw) {
  assert.ok(['CWS', 'FWS'].includes(raw.subarray(0, 3).toString()));
  const body = raw.subarray(0, 3).toString() === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
  assert.equal(body.length + 8, raw.readUInt32LE(4));
  let at = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, at), tags = [];
  while (at < body.length) {
    const begin = at, short = body.readUInt16LE(at); at += 2;
    const code = short >> 6; let size = short & 63;
    if (size === 63) { size = body.readUInt32LE(at); at += 4; }
    const payload = body.subarray(at, at + size); at += size;
    tags.push({ code, payload, name: code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null, raw: body.subarray(begin, at) });
    if (!code) break;
  }
  assert.equal(at, body.length); return { raw, header, tags };
}
function encode(source, tags) {
  const body = Buffer.concat([source.header, ...tags.map(t => t.raw)]), head = Buffer.from(source.raw.subarray(0, 8));
  head.write('CWS', 0); head.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([head, zlib.deflateSync(body)]);
}
function u30(bytes, at) { let value = 0; for (let shift = 0; shift < 35; shift += 7) { const b = bytes[at++]; value += (b & 127) * 2 ** shift; if (!(b & 128)) return [value, at]; } throw new Error('Invalid U30'); }
function pack(value) { const bytes = []; do { let b = value & 127; value = Math.floor(value / 128); if (value) b |= 128; bytes.push(b); } while (value); return Buffer.from(bytes); }
function stub(template, className) {
  const stop = template.payload.indexOf(0, 4), abc = template.payload.subarray(stop + 1);
  let at = 4, count;
  [count, at] = u30(abc, at); for (let i = 1; i < count; i++) [, at] = u30(abc, at);
  [count, at] = u30(abc, at); for (let i = 1; i < count; i++) [, at] = u30(abc, at);
  [count, at] = u30(abc, at); at += 8 * Math.max(0, count - 1);
  const pieces = [abc.subarray(0, at)]; [count, at] = u30(abc, at); pieces.push(pack(count));
  for (let i = 1; i < count; i++) {
    let size; [size, at] = u30(abc, at);
    const text = abc.subarray(at, at + size).toString().replace(/NonoShortcut(?![A-Za-z0-9_])/g, className); at += size;
    const value = Buffer.from(text); pieces.push(pack(value.length), value);
  }
  pieces.push(abc.subarray(at));
  const name = 'com/robot/core/ui/nono/' + className;
  const payload = Buffer.concat([template.payload.subarray(0, 4), Buffer.from(name + '\0'), ...pieces]);
  const tagHead = Buffer.alloc(6); tagHead.writeUInt16LE((82 << 6) | 63); tagHead.writeUInt32LE(payload.length, 2);
  return { code: 82, name, payload, raw: Buffer.concat([tagHead, payload]) };
}
function compile(relative, group, names, core) {
  const original = parse(fs.readFileSync(path.join(baseline, relative)));
  if (guard.resources[relative]) assert.equal(sha(original.raw), guard.resources[relative], 'Native resource changed; merge first: ' + relative);
  for (const name of names.filter(name => guard.classes[name])) {
    const tag = original.tags.find(tag => tag.name === name);
    assert.ok(tag, 'Missing target class ' + name); assert.equal(sha(tag.payload), guard.classes[name], 'Native class changed; merge first: ' + name);
  }
  let inputTags = original.tags.slice();
  if (group === 'core') {
    const template = inputTags.find(t => t.name === 'com/robot/core/ui/nono/NonoShortcut');
    for (const name of ['TeamPresetPanel', 'BattleExperiencePanel']) {
      assert.ok(!inputTags.some(t => t.name === 'com/robot/core/ui/nono/' + name));
      inputTags.splice(inputTags.findIndex(t => t === template), 0, stub(template, name));
    }
  } else {
    const existing = new Set(inputTags.map(t => t.name));
    inputTags = [...inputTags.filter(t => t.code !== 0), ...core.tags.filter(t => t.code === 82 && !existing.has(t.name)), ...inputTags.filter(t => t.code === 0)];
  }
  const compiler = path.join(out, 'compiler', group), imports = path.join(compiler, 'import');
  for (const name of group === 'skills' ? ['com/robot/module/app/skill/SkillReplacePanel'] : names) {
    const sourceRoot = name.startsWith('com/robot/module/app/skill/') ? 'continuous-pet-edit' : name.startsWith('com/robot/petFightModule/') ? 'star-arena/battle' : name === 'com/robot/app/mapProcess/MapProcess_326' ? 'map-mechanisms' : name.startsWith('com/robot/app/') ? 'gathering-speed' : 'nono-experience/core';
    const target = path.join(imports, 'scripts', name + '.as'); fs.mkdirSync(path.dirname(target), { recursive: true });
    const source = name === 'com/robot/app/mapProcess/MapProcess_13' ? path.join(root, 'compat/client-patches/material-sources/MapProcess_13.as') : path.join(root, 'compat/client-patches', sourceRoot, 'scripts', name + '.as');
    const contents = fs.readFileSync(source, 'utf8');
    fs.writeFileSync(target, contents);
  }
  const input = path.join(compiler, 'input.swf'), output = path.join(compiler, 'output.swf'); fs.writeFileSync(input, encode(original, inputTags));
  execFileSync(options.java, ['-Djava.awt.headless=true', '-Xmx2g', '-jar', options.ffdec, '-onerror', 'abort', '-importScript', input, output, imports], { stdio: 'inherit', timeout: 240000 });
  const compiled = parse(fs.readFileSync(output)); assert.equal(compiled.tags.length, inputTags.length);
  const allowed = new Set(names), selected = group === 'core' ? inputTags : original.tags;
  let changed = 0;
  const final = encode(original, selected.map((tag, i) => {
    if (!allowed.has(tag.name)) return tag;
    const next = compiled.tags[i]; assert.equal(next.name, tag.name); assert.ok(!next.raw.equals(tag.raw), 'Class did not compile: ' + tag.name); changed++;
    return next;
  }));
  assert.equal(changed, names.length);
  put(relative, final); put(relative.replace('client/overlay/', 'client/assets/'), final);
  console.log(JSON.stringify({ group, changedClasses: changed, otherClassesPreserved: true }));
  return parse(final);
}
function compileGallery() {
  const relative = 'client/overlay/resource/book/petCollection.swf';
  const input = path.join(baseline, relative), original = parse(fs.readFileSync(input));
  assert.equal(sha(fs.readFileSync(input)), guard.resources[relative], 'Standalone museum changed; merge first');
  const indices = original.tags.map((tag, index) => tag.code === 82 ? index : -1).filter(index => index >= 0);
  assert.equal(indices.length, 1, 'Unexpected museum class layout');
  const types = JSON.parse(fs.readFileSync(path.join(root, 'compat/client-patches/fusion-manual/native-types.json'))).types;
  const catalog = [];
  const xml = fs.readFileSync(path.join(baseline, 'app/config/data/xml/pets.xml'), 'utf8');
  for (const match of xml.matchAll(/<Monster\b([^>]*)>/g)) {
    const attrs = Object.fromEntries([...match[1].matchAll(/(\w+)="([^"]*)"/g)].map(value => [value[1], value[2]]));
    if (!['HP', 'Atk', 'Def', 'SpAtk', 'SpDef', 'Spd'].every(key => attrs[key] !== undefined && Number.isFinite(Number(attrs[key])))) continue;
    assert.ok(Number.isSafeInteger(Number(attrs.ID)) && Number(attrs.ID) > 0);
    catalog.push({ id: Number(attrs.ID), name: attrs.DefName.replaceAll('&amp;', '&').replaceAll('&quot;', '"'), type: types[attrs.Type] || '属性' + attrs.Type });
  }
  catalog.sort((a, b) => a.id - b.id);
  assert.ok(catalog.length && new Set(catalog.map(pet => pet.id)).size === catalog.length);
  let source = fs.readFileSync(path.join(root, 'compat/client-patches/pet-collection/monsterBook.as'), 'utf8');
  const marker = 'private const catalog:Array = []; // @CATALOG@';
  assert.equal(source.split(marker).length, 2);
  source = source.replace(marker, 'private const catalog:Array = buildCatalog();');
  const chunks = [];
  for (let at = 0; at < catalog.length; at += 60) chunks.push(catalog.slice(at, at + 60));
  const methods = '\n      private function buildCatalog():Array { var all:Array=[]; ' + chunks.map((_, index) => 'all=all.concat(catalog' + index + '());').join(' ') + ' return all; }\n' + chunks.map((rows, index) => '      private function catalog' + index + '():Array { return ' + JSON.stringify(rows) + '; }').join('\n');
  source = source.replace(/\n   }\s*}\s*$/, methods + '\n   }\n}\n');
  const compiler = path.join(out, 'compiler/gallery'), imports = path.join(compiler, 'import'), output = path.join(compiler, 'output.swf');
  fs.mkdirSync(path.join(imports, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(imports, 'scripts/PetCollectionGallery.as'), source);
  execFileSync(options.java, ['-Djava.awt.headless=true', '-Xmx2g', '-jar', options.ffdec, '-onerror', 'abort', '-importScript', input, output, imports], { stdio: 'inherit', timeout: 180000 });
  const compiled = parse(fs.readFileSync(output)), index = indices[0];
  assert.equal(compiled.tags.length, original.tags.length);
  assert.equal(compiled.tags[index].code, 82);
  assert.ok(!compiled.tags[index].raw.equals(original.tags[index].raw), 'Museum did not compile');
  put(relative, encode(original, original.tags.map((tag, at) => at === index ? compiled.tags[index] : tag)));
  console.log(JSON.stringify({ group: 'gallery', changedClasses: 1, species: catalog.length, originalHandbookUnchanged: true }));
}
if (!options['server-only']) {
  for (const key of ['java', 'ffdec']) assert.ok(options[key], 'Missing --' + key);
  // Medicine panels and their refresh dependencies are compiled together by build-pet-workflow.cjs.
  const core = compile('client/overlay/dll/NieoCore.swf', 'core', ['com/robot/core/ui/nono/TeamPresetPanel', 'com/robot/core/ui/nono/BattleExperiencePanel', 'com/robot/core/ui/nono/NonoShortcut', 'com/robot/app/energy/utils/EnergyController', 'com/robot/app/mapProcess/MapProcess_13', 'com/robot/app/mapProcess/MapProcess_56', 'com/robot/app/mapProcess/MapProcess_59', 'com/robot/app/mapProcess/MapProcess_326']);
  compile('client/overlay/resource/module/PetFightDLL.swf', 'battle', ['com/robot/petFightModule/PetFightEntry'], core);
  compileGallery();
  compile('client/overlay/module/com/robot/module/app/PetSelectPanel.swf', 'skills', ['frame1'], core);
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ files, restartGame: true, restartWeb: false, migration: null }, null, 2) + '\n');
console.log(JSON.stringify({ out, files: files.length, migration: null }));
