'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const names = ['baseline', 'out', 'java', 'ffdec'];
const { values: v } = parseArgs({ options: Object.fromEntries(names.map(name => [name, { type: 'string' }])) });
for (const name of names) assert.ok(v[name], 'Missing --' + name);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out), root = path.resolve(__dirname, '..');
assert.ok(!fs.existsSync(out), 'Choose a fresh output directory');
const client = path.join(root, 'compat/client-patches/nono-experience');
const server = path.join(root, 'compat/server-patches/nono-experience');
const files = [];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function put(relative, bytes) {
  const target = path.join(out, relative), original = path.join(baseline, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes);
  files.push({ path: relative, before: fs.existsSync(original) ? sha(fs.readFileSync(original)) : null, after: sha(bytes) });
}
function replaceOnce(text, before, after) {
  assert.equal(text.split(before).length, 2, 'Baseline anchor changed: ' + before.slice(0, 100));
  return text.replace(before, after);
}
function patch(relative, transform) { put(relative, transform(fs.readFileSync(path.join(baseline, relative), 'utf8'))); }
function parse(raw) {
  assert.equal(raw.subarray(0, 3).toString(), 'CWS');
  const body = zlib.inflateSync(raw.subarray(8));
  assert.equal(body.length + 8, raw.readUInt32LE(4));
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6; let length = short & 63;
    if (length === 63) { length = body.readUInt32LE(offset); offset += 4; }
    assert.ok(offset + length <= body.length);
    const payload = body.subarray(offset, offset + length); offset += length;
    tags.push({ code, name: code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null, raw: body.subarray(start, offset) });
    if (!code) break;
  }
  assert.equal(offset, body.length); return { raw, header, tags };
}
function encode(source, tags) {
  const body = Buffer.concat([source.header, ...tags.map(t => t.raw)]), header = Buffer.from(source.raw.subarray(0, 8));
  header.writeUInt32LE(body.length + 8, 4); return Buffer.concat([header, zlib.deflateSync(body)]);
}
function sources(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sources(path.join(directory, entry.name)) : entry.name.endsWith('.as') ? [path.join(directory, entry.name)] : []);
}
function compile(relative, group, core) {
  const overlay = relative.replace('client/assets/', 'client/overlay/');
  const effective = fs.existsSync(path.join(baseline, overlay)) ? overlay : relative;
  const source = parse(group === 'core' ? encounters.coreBytes : fs.readFileSync(path.join(baseline, effective)));
  const inputDir = path.join(out, 'compiler', group), importRoot = path.join(inputDir, 'import');
  fs.mkdirSync(inputDir, { recursive: true });
  fs.cpSync(path.join(client, group), importRoot, { recursive: true });
  const imported = sources(path.join(importRoot, 'scripts'));
  if (group === 'core') {
    const guide = path.join(importRoot, 'scripts/com/robot/core/config/xml/PetBookXMLInfo.as');
    fs.writeFileSync(guide, replaceOnce(fs.readFileSync(guide, 'utf8'),
      'private static const WILD_LOCATIONS:Object = {}; // @WILD_LOCATIONS@',
      'private static const WILD_LOCATIONS:Object = ' + JSON.stringify(encounters.locations) + ';'));
    const laboratory = path.join(importRoot, 'scripts/com/robot/app/mapProcess/MapProcess_5.as');
    const text = fs.readFileSync(laboratory, 'utf8');
    const declaration = text.match(/private const exchangeGroups:Array = \[[\s\S]*?\];/);
    assert.ok(declaration, 'Missing native laboratory catalog');
    fs.writeFileSync(laboratory, replaceOnce(text, declaration[0],
      'private const exchangeGroups:Array = ' + JSON.stringify(encounters.laboratoryGroups) + ';'));
  }
  const originalNames = new Set(source.tags.filter(t => t.code === 82).map(t => t.name));
  const linkedTags = core ? [...source.tags.filter(t => t.code !== 0), ...core.tags.filter(t => t.code === 82 && !originalNames.has(t.name)), ...source.tags.filter(t => t.code === 0)] : source.tags;
  const input = path.join(inputDir, 'input.swf'), output = path.join(inputDir, 'output.swf');
  fs.writeFileSync(input, encode(source, linkedTags));
  execFileSync(v.java, ['-Djava.awt.headless=true', '-Xmx2g', '-jar', v.ffdec, '-onerror', 'abort', '-importScript', input, output, importRoot], { stdio: 'inherit', timeout: 240000 });
  const compiled = parse(fs.readFileSync(output));
  assert.equal(compiled.tags.length, linkedTags.length, 'Compiler changed tag inventory');
  const names = new Set(imported.map(file => path.relative(path.join(importRoot, 'scripts'), file).replace(/\.as$/, '')));
  const allowed = group === 'core' ? names : originalNames;
  let changes = 0;
  const final = encode(source, source.tags.map((tag, index) => {
    const replacement = compiled.tags[index];
    if (tag.code !== 82 || !allowed.has(tag.name)) return tag;
    assert.equal(replacement.code, 82); assert.equal(replacement.name, tag.name);
    if (!replacement.raw.equals(tag.raw)) changes++;
    return replacement;
  }));
  assert.ok(changes > 0, 'No classes compiled for ' + group);
  put(relative, final);
  console.log(JSON.stringify({ group, changedAbcTags: changes, sources: imported.length }));
  return parse(final);
}
const encounters = require('./nono-encounters.cjs')({ baseline, root, parse, encode });
put('app/config/data/json/map-ogres.json', JSON.stringify(encounters.spawn, null, 2) + '\n');
put('app/config/data/json/pet-acquisition.json', JSON.stringify(encounters.acquisition, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'encounter-audit.json'), JSON.stringify(encounters.audit, null, 2) + '\n');
patch('app/dist/GameServer/Game/Map/MapSpawnManager.js', text => replaceOnce(text,
  'for (let i = 0; i < spawnCount; i++) {\n            // 计算总权重',
  'for (let i = 0; i < spawnCount; i++) {\n            if (mapConfig.spawnProbability !== undefined && Math.random() >= mapConfig.spawnProbability) continue;\n            // 计算总权重'));
const coreRel = 'client/assets/dll/NieoCore.swf';
const core = compile(coreRel, 'core');
put('client/overlay/dll/NieoCore.swf', fs.readFileSync(path.join(out, coreRel)));
const modules = [
  ['battle', 'client/assets/resource/module/PetFightDLL.swf'],
  ['warehouse', 'client/assets/module/com/robot/module/app/PetStorage.swf'],
];
for (const [group, relative] of modules) if (fs.existsSync(path.join(client, group, 'scripts'))) {
  compile(relative, group, core);
  put(relative.replace('client/assets/', 'client/overlay/'), fs.readFileSync(path.join(out, relative)));
}
put('app/dist/GameServer/Server/Packet/Recv/NoNo/NonoExperienceHandler.js', fs.readFileSync(path.join(server, 'NonoExperienceHandler.js')));
put('app/dist/DataBase/migrations/scripts/026_create_experience_settings.js', fs.readFileSync(path.join(server, '026_create_experience_settings.js')));
patch('app/dist/GameServer/Server/Packet/Recv/NoNo/index.js', text => {
  assert.ok(!text.includes('NonoExperienceHandler'));
  return text + '\n__exportStar(require("./NonoExperienceHandler"), exports);\n';
});
patch('app/dist/DataBase/migrations/MigrationRunner.js', text => {
  assert.ok(!text.includes('Migration026'));
  text = replaceOnce(text, 'const AllMigrations = [', 'const { Migration026CreateExperienceSettings } = require("./scripts/026_create_experience_settings");\nconst AllMigrations = [');
  return replaceOnce(text, 'new Migration025CreatePetCollection(),', 'new Migration025CreatePetCollection(),\n  new Migration026CreateExperienceSettings(),');
});
patch('app/dist/DataBase/models/PetData.js', text => replaceOnce(text,
  'return a.catchTime - b.catchTime;',
  'if (Number.isInteger(a.bagOrder) || Number.isInteger(b.bagOrder)) {\n                const order = (a.bagOrder ?? 6) - (b.bagOrder ?? 6);\n                if (order) return order;\n            }\n            return a.catchTime - b.catchTime;'));
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ files, restartGame: true, restartWeb: false, migration: 26 }, null, 2) + '\n');
console.log(JSON.stringify({ files: files.length, out }));
