'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {parseArgs} = require('node:util');
const names = ['server-source', 'runtime', 'config', 'out'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw new Error(`Missing --${name}`);
const root = path.resolve(values['server-source']);
const out = path.resolve(values.out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => {if (!condition) throw new Error(message);};
const sourceRelative = 'src/GameServer/Game/Item/Mining.ts';
const runtimeRelative = 'dist/GameServer/Game/Item/Mining.js';
const configRelative = 'config/data/json/mining.json';
const baseline = {
  source: '9ed92666b25b8491601c28c1c61403894535f5853d2ffdb8749ba9a7102f0955',
  runtime: 'eb0e3f77bcfd5f899926f6568cc5af03bbd18f280a24023e73dbad7569fbd30c',
  config: '1e3b724c484ac890e07b88ba331c87076510efd34cc8c75dfbb619076ac5eb4b'
};
const originalSource = fs.readFileSync(path.join(root, sourceRelative), 'utf8');
check(sha(originalSource) === baseline.source, 'Collector source baseline changed');
check(sha(fs.readFileSync(values.runtime)) === baseline.runtime, 'Collector runtime changed');
const originalConfig = fs.readFileSync(values.config);
check(sha(originalConfig) === baseline.config, 'Collector config changed');
const ts = require(path.join(root, 'node_modules/typescript/lib/typescript.js'));
const tsconfig = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
check(!tsconfig.error, 'Cannot read TypeScript configuration');
const options = ts.convertCompilerOptionsFromJson(tsconfig.config.compilerOptions, root).options;
const filename = path.join(root, sourceRelative);
const compile = text => ts.transpileModule(text, {compilerOptions: options, fileName: filename, reportDiagnostics: true});
check(sha(compile(originalSource).outputText) === baseline.runtime, 'Source does not reproduce deployed collector');
const source = fs.readFileSync(path.join(__dirname, '../compat/server-patches/ocean-entry/Mining.ts'), 'utf8');
const host = ts.createCompilerHost(options);
const getSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) =>
  path.resolve(file) === filename ? ts.createSourceFile(file, source, languageVersion, true)
    : getSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile);
const program = ts.createProgram([filename], {...options, noEmit: true}, host);
const diagnostics = ts.getPreEmitDiagnostics(program).filter(d => d.category === ts.DiagnosticCategory.Error && d.file && path.resolve(d.file.fileName) === filename);
check(!diagnostics.length, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n'
}));
const compiled = compile(source);
check(!compiled.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error), 'Collector transpilation failed');
const configText = fs.readFileSync(path.join(__dirname, '../compat/server-patches/ocean-entry/mining.json'), 'utf8');
const config = JSON.parse(configText);
const originalSites = JSON.parse(originalConfig).sites;
check(Array.isArray(config.sites), 'Expected map/type collection sites');
const keys = config.sites.map(site => `${site.mapId}:${site.type}`);
check(new Set(keys).size === keys.length, 'Duplicate map/type collection site');
for (const [type, site] of Object.entries(originalSites)) {
  const preserved = config.sites.find(entry => entry.mapId === site.mapId && entry.type === Number(type));
  check(preserved && Object.keys(preserved).length === Object.keys(site).length + 1 &&
    Object.entries(site).every(([key, value]) => preserved[key] === value), 'Existing mining site changed: ' + type);
}
check(config.sites.length === Object.keys(originalSites).length + 2, 'Unexpected collection site additions');
function put(relative, bytes) {
  const file = path.join(out, relative);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, bytes);
}
put('app/' + runtimeRelative, compiled.outputText);
const sourceMap = JSON.parse(compiled.sourceMapText);
sourceMap.sources = ['../../../../' + sourceRelative];
put('app/' + runtimeRelative + '.map', JSON.stringify(sourceMap));
put('app/' + sourceRelative, source);
put('app/' + configRelative, configText);
const files = [runtimeRelative, runtimeRelative + '.map', sourceRelative, configRelative]
  .map(relative => ({path: 'app/' + relative, after: sha(fs.readFileSync(path.join(out, 'app', relative)))}));
const manifest = {baseline, files, patchedModuleSemanticDiagnostics: [], existingMiningSitesPreserved: true,
  clientChanged: false, databaseMigration: false};
put('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
