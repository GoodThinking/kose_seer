'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {parseArgs} = require('node:util');
const {values} = parseArgs({options: Object.fromEntries(['context', 'baseline', 'out'].map(n => [n, {type: 'string'}]))});
for (const n of ['context', 'baseline', 'out']) if (!values[n]) throw Error('Missing --' + n);
const context = path.resolve(values.context), baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const root = path.resolve(__dirname, '..');
const ts = require(path.join(context, 'node_modules/typescript'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const files = [];
function put(relative, bytes) {
  const target = path.join(out, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, bytes);
  const beforePath = path.join(baseline, relative);
  files.push({path: relative, before: fs.existsSync(beforePath) ? sha(fs.readFileSync(beforePath)) : null, after: sha(bytes)});
}
const sourceFiles = [
  ['compat/server-patches/material-sources/Mining.ts', 'GameServer/Game/Item/Mining'],
  ['compat/server-patches/material-sources/ExperienceReceiverHandlers.ts', 'GameServer/Server/Packet/Recv/NoNo/ExperienceReceiverHandlers'],
  ['compat/server-patches/material-sources/MaterialRewards.ts', 'GameServer/Game/Item/MaterialRewards'],
  ['compat/server-patches/material-sources/MaterialGames.ts', 'GameServer/Game/Map/MaterialGames'],
  ['compat/server-patches/material-sources/MaterialHandlers.ts', 'GameServer/Server/Packet/Recv/Map/MaterialHandlers'],
  ['compat/server-patches/material-sources/SummoningHandlers.ts', 'GameServer/Server/Packet/Recv/Map/SummoningHandlers'],
  ['compat/server-patches/material-sources/index.ts', 'GameServer/Server/Packet/Recv/Map/index'],
  ['compat/server-patches/material-sources/BossMaterialDrops.ts', 'GameServer/Game/Battle/services/BossMaterialDrops']
];
for (const [input, target] of sourceFiles) {
  const source = fs.readFileSync(path.join(root, input), 'utf8');
  const compiled = ts.transpileModule(source, {fileName: target + '.ts', reportDiagnostics: true, compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true,
    experimentalDecorators: true, emitDecoratorMetadata: true, esModuleInterop: true, sourceMap: true
  }});
  const errors = compiled.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error);
  if (errors.length) throw Error(ts.formatDiagnosticsWithColorAndContext(errors, {getCurrentDirectory: () => root, getCanonicalFileName: f => f, getNewLine: () => '\n'}));
  put('app/src/' + target + '.ts', source);
  put('app/dist/' + target + '.js', compiled.outputText);
  const map = JSON.parse(compiled.sourceMapText);
  map.sources = [path.posix.relative(path.posix.dirname('dist/' + target), 'src/' + target + '.ts')];
  put('app/dist/' + target + '.js.map', JSON.stringify(map));
}
const configText = fs.readFileSync(path.join(root, 'compat/server-patches/material-sources/material-sources.json'), 'utf8');
const config = JSON.parse(configText);
const encounters = JSON.parse(fs.readFileSync(path.join(baseline, 'app/config/data/json/map-ogres.json')));
for (const rule of config.wildDrops) {
  const ogres = encounters.maps[rule.mapId]?.ogres.filter(o => o.petId === rule.petId);
  if (!ogres?.length) throw Error('Missing original material encounter: ' + JSON.stringify(rule));
  for (const ogre of ogres) {
    ogre.dropItems ??= [];
    // Keep any independently published drop, including the user's Bell water essence.
    if (!ogre.dropItems.some(drop => drop.itemId === rule.itemId)) ogre.dropItems.push({
      itemId: rule.itemId, dropRate: config.dropProbability, minCount: config.dropCount, maxCount: config.dropCount
    });
  }
}
put('app/config/data/json/map-ogres.json', JSON.stringify(encounters, null, 2) + '\n');
put('app/config/data/json/material-sources.json', configText);
put('app/config/data/json/mining.json', fs.readFileSync(path.join(root, 'compat/server-patches/material-sources/mining.json')));
const bosses = JSON.parse(fs.readFileSync(path.join(baseline, 'app/config/data/json/boss_abilities.json')));
if (bosses.bossConfigs.some(boss => boss.mapId === config.darkGate.mapId)) throw Error('Dark arena already configured; merge explicitly');
bosses.bossConfigs.push({
  mapId: config.darkGate.mapId, param2: 0, petId: config.darkGate.petId,
  petName: '魔牙鲨', level: config.darkGate.level, dv: 31, ev: 0, nature: 0, abilities: [], drops: []
});
put('app/config/data/json/boss_abilities.json', JSON.stringify(bosses, null, 2) + '\n');
// The deployed settlement includes fixes newer than its TypeScript source.
// Locate the insertion with the parser and preserve all other bytes in both baselines.
for (const [directory, extension] of [['src', '.ts'], ['dist', '.js']]) {
  const relative = 'app/' + directory + '/GameServer/Game/Battle/services/BattleRewardService' + extension;
  const text = fs.readFileSync(path.join(baseline, relative), 'utf8');
  const ast = ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true);
  const matches = [];
  function visit(node) {
    if (ts.isMethodDeclaration(node) && node.name.getText(ast) === 'ProcessVictoryReward') {
      function locate(child) {
        if (ts.isVariableStatement(child) && child.declarationList.declarations.some(declaration =>
          declaration.name.getText(ast) === 'droppedItems' && declaration.initializer &&
          ts.isCallExpression(declaration.initializer) && declaration.initializer.expression.getText(ast) === 'this.ProcessDropItems')) matches.push(child);
        ts.forEachChild(child, locate);
      }
      locate(node);
    } else ts.forEachChild(node, visit);
  }
  visit(ast);
  if (matches.length !== 1 || text.includes('GetBossMaterialDrops')) throw Error('Unexpected battle reward baseline');
  const position = matches[0].end;
  const line = text.slice(text.lastIndexOf('\n', position) + 1, position);
  const indent = line.match(/^\s*/)[0];
  put(relative, text.slice(0, position) + '\n' + indent +
    'droppedItems.push(...require("./BossMaterialDrops").GetBossMaterialDrops(battle));' + text.slice(position));
  if (directory === 'dist') {
    const mapPath = relative + '.map', mapFile = path.join(baseline, mapPath);
    if (fs.existsSync(mapFile)) {
      const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
      const mappings = map.mappings.split(';');
      mappings.splice(ast.getLineAndCharacterOfPosition(position).line + 1, 0, '');
      map.mappings = mappings.join(';');
      put(mapPath, JSON.stringify(map));
    }
  }
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, naturalResourceDailyLimit: null, waterFusionPreserved: true}, null, 2) + '\n');
console.log(JSON.stringify({files: files.length, wildRules: config.wildDrops.length, out}));
