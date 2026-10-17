'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {parseArgs} = require('node:util');
const {execFileSync} = require('node:child_process');
const names = ['server-context', 'pet-index', 'migration-runner', 'items', 'core', 'panel', 'out', 'java', 'ffdec'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw new Error(`Missing --${name}`);
const root = path.resolve(values['server-context']);
const out = path.resolve(values.out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => {if (!condition) throw new Error(message);};
const baseline = {
  petIndex: '400720b500116fe715bab881d13f5062fa460dd67f6a2ebb850fe030033c2365',
  migrationRunner: 'b0d927ed725a540f2f54f97cb82e8a2c782928462e25b49b0077b1a7c9e6e493',
  panel: '46e959a044c32892ed0eb4408dbcfbfa23567f32fe2c76a05394591e6b97afb7',
  items: 'b0c688f64e4e5d3af82d9181abef87027c087be4a21b4ace52761528a37077bf'
};
const ts = require(path.join(root, 'node_modules/typescript/lib/typescript.js'));
const tsconfig = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
check(!tsconfig.error, 'Cannot read server TypeScript configuration');
const options = ts.convertCompilerOptionsFromJson(tsconfig.config.compilerOptions, root).options;
const compile = (source, relative) => ts.transpileModule(source, {compilerOptions: options, fileName: path.join(root, relative), reportDiagnostics: true});
function put(relative, bytes) {
  const file = path.join(out, relative);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, bytes);
}
function replaceOnce(text, before, after) {
  check(text.split(before).length === 2, 'Expected unique source patch anchor: ' + before);
  return text.replace(before, after);
}
const indexRelative = 'src/GameServer/Server/Packet/Recv/Pet/index.ts';
const runnerRelative = 'src/DataBase/migrations/MigrationRunner.ts';
let index = fs.readFileSync(path.join(root, indexRelative), 'utf8');
let runner = fs.readFileSync(path.join(root, runnerRelative), 'utf8');
// The live registry has migrations through 22; leave unrelated pending 23 unregistered.
runner = replaceOnce(runner, "import { Migration023AddLearnTimes } from './scripts/023_add_learn_times';\n", '');
runner = replaceOnce(runner, '  new Migration023AddLearnTimes(),\n', '');
check(sha(fs.readFileSync(values['pet-index'])) === baseline.petIndex && sha(compile(index, indexRelative).outputText) === baseline.petIndex, 'Pet handler index baseline changed');
check(sha(fs.readFileSync(values['migration-runner'])) === baseline.migrationRunner && sha(compile(runner, runnerRelative).outputText) === baseline.migrationRunner, 'Migration registry baseline changed');
check(!index.includes('PetHatchHandlers'), 'Incubation handlers already registered');
index = index.trimEnd() + "\nexport * from './PetHatchHandlers';\n";
runner = replaceOnce(runner, "import { Migration022CreateRewardBoosts } from './scripts/022_create_reward_boosts';",
  "import { Migration022CreateRewardBoosts } from './scripts/022_create_reward_boosts';\nimport { Migration024CreateEssenceHatches } from './scripts/024_create_essence_hatches';");
runner = replaceOnce(runner, '  new Migration022CreateRewardBoosts(),', '  new Migration022CreateRewardBoosts(),\n  new Migration024CreateEssenceHatches(),');
const patchRoot = path.join(__dirname, '../compat/server-patches/essence-hatching');
const sources = new Map([
  [indexRelative, index], [runnerRelative, runner],
  ['src/GameServer/Game/Pet/EssenceHatching.ts', fs.readFileSync(path.join(patchRoot, 'EssenceHatching.ts'), 'utf8')],
  ['src/GameServer/Server/Packet/Recv/Pet/PetHatchHandlers.ts', fs.readFileSync(path.join(patchRoot, 'PetHatchHandlers.ts'), 'utf8')],
  ['src/DataBase/migrations/scripts/024_create_essence_hatches.ts', fs.readFileSync(path.join(patchRoot, '024_create_essence_hatches.ts'), 'utf8')]
]);
const virtual = new Map([...sources].map(([relative, source]) => [path.join(root, relative), source]));
const host = ts.createCompilerHost(options);
const originalExists = host.fileExists.bind(host), originalRead = host.readFile.bind(host), originalGet = host.getSourceFile.bind(host);
host.fileExists = file => virtual.has(path.resolve(file)) || originalExists(file);
host.readFile = file => virtual.get(path.resolve(file)) ?? originalRead(file);
host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => virtual.has(path.resolve(file))
  ? ts.createSourceFile(file, virtual.get(path.resolve(file)), languageVersion, true)
  : originalGet(file, languageVersion, onError, shouldCreateNewSourceFile);
const program = ts.createProgram([...virtual.keys()], {...options, noEmit: true}, host);
const diagnostics = ts.getPreEmitDiagnostics(program).filter(d => d.category === ts.DiagnosticCategory.Error && d.file && virtual.has(path.resolve(d.file.fileName)));
check(!diagnostics.length, ts.formatDiagnosticsWithColorAndContext(diagnostics, {getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n'}));
const files = [];
for (const [relative, source] of sources) {
  const compiled = compile(source, relative);
  check(!compiled.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error), 'TypeScript compilation failed: ' + relative);
  const runtime = relative.replace(/^src\//, 'dist/').replace(/\.ts$/, '.js');
  const map = JSON.parse(compiled.sourceMapText);
  map.sources = [path.posix.relative(path.posix.dirname(runtime), relative)];
  for (const [file, bytes] of [[relative, source], [runtime, compiled.outputText], [runtime + '.map', JSON.stringify(map)]]) {
    put('app/' + file, bytes);
    files.push({path: 'app/' + file, after: sha(bytes)});
  }
}
const settings = fs.readFileSync(path.join(patchRoot, 'essence-hatching.json'), 'utf8');
check(JSON.parse(settings).durationSeconds === 1800, 'Expected thirty-minute incubation');
put('app/config/data/json/essence-hatching.json', settings);
files.push({path: 'app/config/data/json/essence-hatching.json', after: sha(settings)});
const itemsText = fs.readFileSync(values.items, 'utf8');
check(sha(itemsText) === baseline.items, 'Essence metadata baseline changed');
const {XMLParser} = require(path.join(root, 'node_modules/fast-xml-parser'));
const items = new XMLParser({ignoreAttributes: false, attributeNamePrefix: '', parseAttributeValue: true}).parse(itemsText);
const essenceIds = [];
for (const cat of [items.Items.Cat].flat()) for (const item of [cat.Item].flat()) {
  if (Number.isInteger(item?.ID) && item.ID > 0 && Number.isInteger(item.BreedMonID) && item.BreedMonID > 0 &&
      Number.isInteger(item.BreedMonLv) && item.BreedMonLv > 0 && item.BreedMonLv <= 100 && item.BreedTime > 0) essenceIds.push(item.ID);
}
const ids = [...new Set(essenceIds)].sort((a, b) => a - b);
check(ids.length > 0, 'No essence conversion metadata');
let panelSource = fs.readFileSync(path.join(__dirname, '../compat/client-patches/essence-hatching/MoleculePanel.as'), 'utf8');
panelSource = replaceOnce(panelSource, 'private var _needA:Array = [];', 'private var _needA:Array = ' + JSON.stringify(ids) + ';');
function parse(raw) {
  check(raw.subarray(0, 3).toString() === 'CWS', 'Expected compressed SWF');
  const body = zlib.inflateSync(raw.subarray(8));
  check(body.length + 8 === raw.readUInt32LE(4), 'Invalid SWF length');
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6; let length = short & 63;
    if (length === 63) {length = body.readUInt32LE(offset); offset += 4;}
    check(offset + length <= body.length, 'Truncated SWF tag');
    const payload = body.subarray(offset, offset + length);
    const name = code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null;
    offset += length; tags.push({code, name, raw: body.subarray(start, offset)});
    if (code === 0) break;
  }
  check(offset === body.length && tags.at(-1)?.code === 0, 'Invalid SWF end');
  return {raw, header, tags};
}
function encode(movie, tags) {
  const body = Buffer.concat([movie.header, ...tags.map(tag => tag.raw)]);
  const size = Buffer.alloc(4); size.writeUInt32LE(body.length + 8);
  return Buffer.concat([movie.raw.subarray(0, 4), size, zlib.deflateSync(body, {level: 9})]);
}
const panelBytes = fs.readFileSync(values.panel), coreBytes = fs.readFileSync(values.core);
check(sha(panelBytes) === baseline.panel, 'Native molecule panel changed');
const panel = parse(panelBytes), core = parse(coreBytes);
const abcs = panel.tags.filter(tag => tag.code === 82);
check(abcs.length === 1 && !core.tags.some(tag => tag.code === 82 && tag.name === abcs[0].name), 'Unexpected panel compiler layout');
put('compiler/input.swf', encode(core, [...core.tags.slice(0, -1), ...abcs, core.tags.at(-1)]));
put('compiler/import/scripts/com/robot/module/app/MoleculePanel.as', panelSource);
execFileSync(values.java, ['-Djava.awt.headless=true', '-jar', values.ffdec, '-onerror', 'abort', '-importScript',
  path.join(out, 'compiler/input.swf'), path.join(out, 'compiler/output.swf'), path.join(out, 'compiler/import')], {stdio: 'inherit', timeout: 120000});
const compiledMovie = parse(fs.readFileSync(path.join(out, 'compiler/output.swf')));
const imported = compiledMovie.tags.filter(tag => tag.code === 82 && tag.name === abcs[0].name);
check(imported.length === 1 && !imported[0].raw.equals(abcs[0].raw), 'Molecule source was not compiled');
const finalPanel = encode(panel, panel.tags.map(tag => tag === abcs[0] ? imported[0] : tag));
const checkedPanel = parse(finalPanel);
check(checkedPanel.tags.length === panel.tags.length && checkedPanel.tags.every((tag, i) => tag.code === 82 || tag.raw.equals(panel.tags[i].raw)), 'Panel artwork or linkage changed');
const panelRelative = 'client/overlay/module/com/robot/module/app/MoleculePanel.swf';
put(panelRelative, finalPanel); files.push({path: panelRelative, after: sha(finalPanel)});
const manifest = {baseline, files, durationSeconds: 1800, essenceCount: ids.length, schemaVersion: 24,
  coreUsedOnlyAsCompilerLibrary: true, compilerCoreSha256: sha(coreBytes), panelArtworkPreserved: true,
  patchedModuleSemanticDiagnostics: [], databaseMigration: true};
put('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
