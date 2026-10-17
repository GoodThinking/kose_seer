'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['context', 'baseline', 'out', 'java', 'ffdec'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw Error('Missing --' + name);
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const root = path.resolve(__dirname, '..');
const patchRoot = path.join(root, 'compat/server-patches/acquisition-restoration');
const ts = require(path.join(path.resolve(values.context), 'node_modules/typescript'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const files = [];
const check = (condition, message) => { if (!condition) throw Error(message); };
function put(relative, bytes) {
  const target = path.join(out, relative), before = path.join(baseline, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, bytes);
  files.push({path: relative, before: fs.existsSync(before) ? sha(fs.readFileSync(before)) : null, after: sha(bytes)});
}
for (const [name, directory] of [['SpecialEvolution', 'Pet'], ['PermanentPetExchange', 'Pet'], ['RareEncounters', 'Battle']]) {
  const target = 'GameServer/Game/' + directory + '/' + name;
  const source = fs.readFileSync(path.join(patchRoot, name + '.ts'), 'utf8');
  const result = ts.transpileModule(source, {fileName: name + '.ts', reportDiagnostics: true,
    compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true, sourceMap: true}});
  check(!result.diagnostics.some(d => d.category === ts.DiagnosticCategory.Error), 'Invalid TypeScript ' + name);
  put('app/src/' + target + '.ts', source);
  put('app/dist/' + target + '.js', result.outputText);
  const map = JSON.parse(result.sourceMapText);
  map.sources = [path.posix.relative(path.posix.dirname('dist/' + target), 'src/' + target + '.ts')];
  put('app/dist/' + target + '.js.map', JSON.stringify(map));
}
for (const name of ['AcquisitionRuntime.d.ts', 'PetPP.d.ts']) {
  put('app/src/GameServer/Game/Pet/' + name, fs.readFileSync(path.join(patchRoot, name)));
}
function patch(relative, find) {
  const text = fs.readFileSync(path.join(baseline, relative), 'utf8');
  const ast = ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true);
  const edits = [];
  function visit(node) { find(node, ast, edits); ts.forEachChild(node, visit); }
  visit(ast);
  check(edits.length > 0, 'No integration points: ' + relative);
  edits.sort((a, b) => b.start - a.start);
  let result = text;
  for (const edit of edits) result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  check(!ts.createSourceFile(relative, result, ts.ScriptTarget.Latest, true).parseDiagnostics.length, 'Invalid patched module: ' + relative);
  put(relative, result);
  const mapPath = path.join(baseline, relative + '.map');
  if (fs.existsSync(mapPath)) {
    const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const mappings = map.mappings.split(';');
    for (const edit of edits) {
      const first = ast.getLineAndCharacterOfPosition(edit.start).line;
      const last = ast.getLineAndCharacterOfPosition(edit.end).line;
      mappings.splice(first, last - first + 1, ...Array(edit.text.split('\n').length).fill(''));
    }
    map.mappings = mappings.join(';');
    put(relative + '.map', JSON.stringify(map));
  }
}
for (const [directory, extension] of [['src', '.ts'], ['dist', '.js']]) {
  let methods = 0;
  patch('app/' + directory + '/GameServer/Game/Pet/PetManager' + extension, (node, ast, edits) => {
    if ((ts.isImportDeclaration(node) && node.moduleSpecifier.text.endsWith('/PacketPetEvolution')) ||
        (ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === 'PacketPetEvolution_1'))) {
      edits.push({start: node.getStart(ast), end: node.end, text: ''});
    }
    if (ts.isMethodDeclaration(node) && node.name.getText(ast) === 'HandlePetEvolution') {
      methods++;
      edits.push({start: node.body.getStart(ast), end: node.body.end,
        text: '{\n    return require("./SpecialEvolution").HandleEvolution(this, catchTime, evolveIndex);\n  }'});
    }
  });
  check(methods === 1, 'Expected one evolution entry');
  let battles = 0, origins = 0;
  patch('app/' + directory + '/GameServer/Game/Battle/BattleManager' + extension, (node, ast, edits) => {
    if (ts.isCallExpression(node) && node.expression.getText(ast) === 'this._initService.CreatePVEBattle' &&
      node.arguments.map(arg => arg.getText(ast)).join(',') === 'monsterId,monsterLevel') {
      battles++;
      edits.push({start: node.getStart(ast), end: node.end, text: 'this._initService.CreatePVEBattle(...require("./RareEncounters").SelectWildOpponent(mapId, monsterId, monsterLevel, originalPetId))'});
    }
    if (ts.isBinaryExpression(node) && node.left.getText(ast) === 'this._currentBattleOriginalPetId' &&
      node.right.getText(ast) === 'ogres[monsterIndex].originalPetId') {
      origins++;
      edits.push({start: node.right.getStart(ast), end: node.right.end,
        text: 'battle.enemy.id !== monsterId ? battle.enemy.id : ogres[monsterIndex].originalPetId'});
    }
  });
  check(battles === 1 && origins === 1, 'Expected unique wild encounter boundary');
}
// This deployed handler has no TS source. Preserve its existing collection rewards verbatim.
let collectRoutes = 0;
patch('app/dist/GameServer/Server/Packet/Recv/Pet/PetCollectHandler.js', (node, ast, edits) => {
  if (ts.isVariableStatement(node) && node.declarationList.declarations.some(d => d.name.getText(ast) === 'rewardId')) {
    collectRoutes++;
    edits.push({start: node.end, end: node.end,
      text: '\n        if (groupId === 900001) return require("../../../../Game/Pet/PermanentPetExchange").HandleExchange(player, rewardId);'});
  }
});
check(collectRoutes === 1, 'Expected unique collection route');
const config = JSON.parse(fs.readFileSync(path.join(patchRoot, 'pet-acquisition.json')));
for (const name of ['pet-acquisition', 'special-evolutions']) put('app/config/data/json/' + name + '.json', fs.readFileSync(path.join(patchRoot, name + '.json')));
const maps = JSON.parse(fs.readFileSync(path.join(baseline, 'app/config/data/json/map-ogres.json')));
const exemplar = maps.maps['20'].ogres.find(o => o.petId === 30);
check(exemplar, 'Missing wild encounter template');
for (const rule of config.wild) {
  let map = maps.maps[rule.mapId];
  if (!map) map = maps.maps[rule.mapId] = {name: rule.name, spawnCount: 4, randomCount: true, minCount: 2, maxCount: 4, ogres: []};
  check(!map.ogres.some(o => o.petId === rule.petId), 'Encounter already exists: ' + rule.petId);
  const weight = rule.rareProbability ? map.ogres.reduce((n, o) => n + o.weight, 0) * rule.rareProbability / (1 - rule.rareProbability) : rule.weight;
  const ogre = structuredClone(exemplar);
  Object.assign(ogre, {slot: map.ogres.length, petId: rule.petId, shiny: 0, weight, level: null,
    minLevel: rule.minLevel, maxLevel: rule.maxLevel, dropItems: [], catchable: true});
  Object.assign(ogre.refreshConfig, {shinyRate: 0, shinyPetId: -1});
  map.ogres.push(ogre);
}
put('app/config/data/json/map-ogres.json', JSON.stringify(maps, null, 2) + '\n');
const bosses = JSON.parse(fs.readFileSync(path.join(baseline, 'app/config/data/json/boss_abilities.json')));
const lion = bosses.bossConfigs.find(b => b.mapId === 53 && b.petId === 187);
check(lion && [0, 1].includes(lion.param2), 'Unknown Snu cave boss baseline');
check(!bosses.bossConfigs.some(b => b !== lion && b.mapId === 53 && b.param2 === 1), 'Snu cave slot already used');
lion.param2 = 1; // Native lion button sends 1; ActivePet(Dabira) sends 0.
for (const rule of config.mechanisms) {
  check(!bosses.bossConfigs.some(b => b.mapId === rule.mapId && b.param2 === rule.param2), 'Mechanism slot already configured');
  bosses.bossConfigs.push({...rule, dv: 15, ev: 0, nature: 0, abilities: [], drops: []});
}
put('app/config/data/json/boss_abilities.json', JSON.stringify(bosses, null, 2) + '\n');
function parse(raw) {
  check(raw.subarray(0, 3).toString() === 'CWS', 'Expected compressed native Core');
  const body = zlib.inflateSync(raw.subarray(8));
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6;
    let size = short & 63;
    if (size === 63) {size = body.readUInt32LE(offset); offset += 4;}
    const payload = body.subarray(offset, offset + size);
    offset += size;
    tags.push({code, name: code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null, raw: body.subarray(start, offset)});
    if (!code) break;
  }
  check(offset === body.length, 'Invalid native tag stream');
  return {raw, body, header, tags};
}
const corePath = path.join(baseline, 'NieoCore.swf');
const core = parse(fs.readFileSync(corePath));
const nativeSource = fs.readFileSync(path.join(root, 'compat/client-patches/acquisition-restoration/MapProcess_5.as'), 'utf8');
check(nativeSource.includes('[' + config.exchange.petIds.join(',') + ']') && config.exchange.coins === 1000 && config.exchange.groupId === 900001, 'Native exchange catalog mismatch');
const importDir = path.join(out, 'compiler/import');
fs.mkdirSync(path.join(importDir, 'scripts/com/robot/app/mapProcess'), {recursive: true});
fs.writeFileSync(path.join(importDir, 'scripts/com/robot/app/mapProcess/MapProcess_5.as'), nativeSource);
const compiledPath = path.join(out, 'compiler/output.swf');
execFileSync(values.java, ['-Djava.awt.headless=true', '-jar', values.ffdec, '-onerror', 'abort', '-importScript', corePath, compiledPath, importDir], {stdio: 'inherit', timeout: 120000});
const compiled = parse(fs.readFileSync(compiledPath));
const key = 'com/robot/app/mapProcess/MapProcess_5';
const originals = core.tags.filter(t => t.code === 82 && t.name === key), replacements = compiled.tags.filter(t => t.code === 82 && t.name === key);
check(originals.length === 1 && replacements.length === 1 && !originals[0].raw.equals(replacements[0].raw), 'Laboratory class was not rebuilt');
const body = Buffer.concat([core.header, ...core.tags.map(t => t.name === key ? replacements[0].raw : t.raw)]);
const length = Buffer.alloc(4); length.writeUInt32LE(body.length + 8);
const finalCore = Buffer.concat([core.raw.subarray(0, 4), length, zlib.deflateSync(body, {level: 9})]);
const final = parse(finalCore);
check(final.tags.length === core.tags.length && final.tags.every((t, i) => t.name === key || t.raw.equals(core.tags[i].raw)), 'Unrelated Core tag changed');
put('client/assets/dll/NieoCore.swf', finalCore);
files.at(-1).before = sha(core.raw);
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, changedNativeClasses: [key], unrelatedNativeTagsPreserved: true,
  exchangePets: config.exchange.petIds, noDatabaseMigration: true}, null, 2) + '\n');
console.log(JSON.stringify({files: files.length, nativeClass: key, exchangePets: config.exchange.petIds.length, out}));
