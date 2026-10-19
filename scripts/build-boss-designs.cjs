'use strict';
// Build the boss-design release from a captured live app (already carrying the passive-trait release):
// refresh BossSpecialRules and SkillEffectRuntime, and re-apply boss-mechanics.json onto boss_abilities.json.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {parseArgs} = require('node:util');
const {values: v} = parseArgs({options: Object.fromEntries(['context', 'baseline', 'out'].map(n => [n, {type: 'string'}]))});
for (const n of ['context', 'baseline', 'out']) if (!v[n]) throw Error('Missing --' + n);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out), root = path.resolve(__dirname, '..');
const ts = require(path.join(path.resolve(v.context), 'node_modules/typescript'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const files = [];

function put(rel, bytes) {
  const src = path.join(baseline, rel), dst = path.join(out, rel);
  fs.mkdirSync(path.dirname(dst), {recursive: true});
  fs.writeFileSync(dst, bytes);
  files.push({path: rel, before: fs.existsSync(src) ? sha(fs.readFileSync(src)) : null, after: sha(Buffer.from(bytes))});
}

// Replaced modules: strict semantic check against their narrow imports, then transpile.
function module(rel, source) {
  const virtualSource = '/m/' + rel + '.ts', virtualTypes = '/m/runtime.d.ts';
  const runtimeTypes = 'export declare const Logger: any;\nexport declare const BossAbilityConfig: any;\nexport declare const GameConfig: any;\n' +
    'declare global { function require(id: string): any; }';
  const options = {noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, types: []};
  const host = ts.createCompilerHost(options), readFile = host.readFile, fileExists = host.fileExists;
  host.readFile = f => f === virtualSource ? source : f === virtualTypes ? runtimeTypes : readFile(f);
  host.fileExists = f => f === virtualSource || f === virtualTypes || fileExists(f);
  host.resolveModuleNames = names => names.map(() => ({resolvedFileName: virtualTypes, extension: ts.Extension.Dts}));
  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([virtualSource, virtualTypes], options, host));
  if (diagnostics.length) throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n'}));
  const emitted = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS}}).outputText;
  put(`app/src/GameServer/Game/Battle/${rel}.ts`, source);
  put(`app/dist/GameServer/Game/Battle/${rel}.js`, emitted);
}
assert.ok(fs.existsSync(path.join(baseline, 'app/dist/GameServer/Game/Battle/PassiveRuntime.js')), 'Passive release not on the baseline');
module('BossSpecialRules', fs.readFileSync(path.join(root, 'compat/server-patches/boss-mechanics/BossSpecialRules.ts'), 'utf8'));
module('SkillEffectRuntime', fs.readFileSync(path.join(root, 'compat/server-patches/skill-effects/SkillEffectRuntime.ts'), 'utf8'));

// Boss configuration: re-apply the whole spec (same rule as build-boss-mechanics.cjs); unchanged bosses stay identical.
const spec = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/boss-mechanics/boss-mechanics.json'), 'utf8'));
const bossRel = 'app/config/data/json/boss_abilities.json';
const bossConfig = JSON.parse(fs.readFileSync(path.join(baseline, bossRel), 'utf8'));
for (const item of spec.bosses) {
  const hits = bossConfig.bossConfigs.filter(b => b.mapId === item.mapId && b.param2 === item.param2);
  assert.equal(hits.length, 1, `Boss ${item.mapId}/${item.param2} not unique`);
  assert.equal(hits[0].petId, item.petId, `Boss ${item.mapId}/${item.param2} changed species`);
  Object.assign(hits[0], item.set);
}
put(bossRel, JSON.stringify(bossConfig, null, 2) + '\n');

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, databaseMigration: false,
  guards: 'verify before SHA256 at deployment'}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
