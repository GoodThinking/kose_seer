'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { parseArgs } = require('node:util');
const { values } = parseArgs({ options: { 'server-context': { type: 'string' }, out: { type: 'string' } } });
if (!values['server-context'] || !values.out) throw new Error('Required: --server-context <current-app> --out <release>');
const context = path.resolve(values['server-context']), out = path.resolve(values.out), repo = path.resolve(__dirname, '..');
const baseline = {
  "src/GameServer/Game/Map/SummoningField.ts": null,
  "dist/GameServer/Game/Map/SummoningField.js": null,
  "dist/GameServer/Game/Map/SummoningField.js.map": null,
  "src/GameServer/Server/Packet/Recv/Map/SummoningHandlers.ts": null,
  "dist/GameServer/Server/Packet/Recv/Map/SummoningHandlers.js": null,
  "dist/GameServer/Server/Packet/Recv/Map/SummoningHandlers.js.map": null,
  "src/GameServer/Server/Packet/Recv/Map/AttackBossHandler.ts": null,
  "dist/GameServer/Server/Packet/Recv/Map/AttackBossHandler.js": "b7b7d34142c8e0cbd744ec873f2b96637414810dceab7ab454a876ac2012005c",
  "dist/GameServer/Server/Packet/Recv/Map/AttackBossHandler.js.map": null,
  "src/GameServer/Server/Packet/Recv/Map/EnterMapHandler.ts": "698eea9702098667c1cdb1861ff54878ebe1d57d05240478a8efb1d9e57e32ce",
  "dist/GameServer/Server/Packet/Recv/Map/EnterMapHandler.js": "79bc8dd5352ccb8fb8ce088fb21239d2159a0f1c4b5292b0e507f3ca300351ff",
  "dist/GameServer/Server/Packet/Recv/Map/EnterMapHandler.js.map": "f14cc7cc20101b667c20bb00cb8599e212a09bb2e998cf86e2cf33bc397da558",
  "src/GameServer/Server/Packet/Recv/Map/LeaveMapHandler.ts": "416d92c58efa86a5fa72db497dea89bf71448309e79df22ab2b7bcc0b1ddcddf",
  "dist/GameServer/Server/Packet/Recv/Map/LeaveMapHandler.js": "68eadd50f0e4b2647e31a63dffd93825d8f50d3d73e1b5872d6f7862ccd94dc6",
  "dist/GameServer/Server/Packet/Recv/Map/LeaveMapHandler.js.map": "b668d3638179e45e8b7002649010502bf4a7cb3cc8d6be3b9fa0fd389c860ae5",
  "src/GameServer/Server/Packet/Recv/Battle/ChallengeBossHandler.ts": "f5f3e2aa221806737bf230fc4e7bb10e5ce1d8437ec171602345a89051251722",
  "dist/GameServer/Server/Packet/Recv/Battle/ChallengeBossHandler.js": "3a26b4cc917e06d6a0223aebfae5bac4413fb20aa553aa4327b4fa057430348c",
  "dist/GameServer/Server/Packet/Recv/Battle/ChallengeBossHandler.js.map": "e0d916d5f546367f25c96fb00dd1aa9aa8c19ef9073af81993c24b1057ab9be2",
  "src/GameServer/Server/Packet/Recv/Map/index.ts": "05a9f6630f9f8ab795b18f05e807726db8ef652add58c5dbecd294af98350006",
  "dist/GameServer/Server/Packet/Recv/Map/index.js": "7e1b381b96436bc1873771a0ba3c43ac21a28d15f0acea8a46bad516065bfba8",
  "dist/GameServer/Server/Packet/Recv/Map/index.js.map": "32565da392696aff9b0b1c9ae2bd3e4df1ef65bf56fade3d1c0185a68f4ff09d",
  "config/data/json/boss_abilities.json": "16d1d5e44a20f77eddbc3bb880cd6fc08127c1b28f0b731e2f740db2ed5b7f61"
};
const sources = [
  "src/GameServer/Game/Map/SummoningField.ts",
  "src/GameServer/Server/Packet/Recv/Map/SummoningHandlers.ts",
  "src/GameServer/Server/Packet/Recv/Map/AttackBossHandler.ts",
  "src/GameServer/Server/Packet/Recv/Map/EnterMapHandler.ts",
  "src/GameServer/Server/Packet/Recv/Map/LeaveMapHandler.ts",
  "src/GameServer/Server/Packet/Recv/Battle/ChallengeBossHandler.ts",
  "src/GameServer/Server/Packet/Recv/Map/index.ts"
];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const [relative, expected] of Object.entries(baseline)) {
  const file = path.join(context, relative), actual = fs.existsSync(file) ? sha(fs.readFileSync(file)) : null;
  if (actual !== expected) throw new Error('Live baseline changed: ' + relative);
}
const ts = require(path.join(context, 'node_modules/typescript/lib/typescript.js'));
const config = ts.readConfigFile(path.join(context, 'tsconfig.json'), ts.sys.readFile);
const options = ts.convertCompilerOptionsFromJson(config.config.compilerOptions, context).options;
const virtual = new Map(sources.map(relative => [path.join(context, relative), fs.readFileSync(path.join(repo, relative), 'utf8')]));
const host = ts.createCompilerHost(options), exists = host.fileExists.bind(host), read = host.readFile.bind(host), get = host.getSourceFile.bind(host);
host.fileExists = file => virtual.has(path.resolve(file)) || exists(file);
host.readFile = file => virtual.get(path.resolve(file)) ?? read(file);
host.getSourceFile = (file, version, onError, fresh) => virtual.has(path.resolve(file))
  ? ts.createSourceFile(file, virtual.get(path.resolve(file)), version, true) : get(file, version, onError, fresh);
const program = ts.createProgram([...virtual.keys()], { ...options, noEmit: true }, host);
const diagnostics = ts.getPreEmitDiagnostics(program).filter(d => d.category === ts.DiagnosticCategory.Error && d.file && virtual.has(path.resolve(d.file.fileName)));
if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: f => f, getCurrentDirectory: () => context, getNewLine: () => '\n' }));
const files = [];
function put(relative, content) {
  const destination = path.join(out, 'app', relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, content);
  files.push({ path: 'app/' + relative, before: baseline[relative], after: sha(content) });
}
for (const relative of sources) {
  const source = fs.readFileSync(path.join(repo, relative), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: options, fileName: path.join(context, relative) });
  const runtime = relative.replace(/^src\//, 'dist/').replace(/\.ts$/, '.js');
  const map = JSON.parse(compiled.sourceMapText); map.sources = [path.posix.relative(path.posix.dirname(runtime), relative)];
  put(relative, source); put(runtime, compiled.outputText); put(runtime + '.map', JSON.stringify(map));
}
const relative = 'config/data/json/boss_abilities.json';
const beforeConfig = JSON.parse(fs.readFileSync(path.join(context, relative))), afterConfig = JSON.parse(fs.readFileSync(path.join(repo, relative)));
const boss = afterConfig.bossConfigs.filter(b => b.mapId === 502);
if (boss.length !== 1 || boss[0].petId !== 115 || boss[0].level !== 40 || boss[0].spt.rewardItemId !== 400106) throw new Error('Invalid summoning boss');
afterConfig.bossConfigs = afterConfig.bossConfigs.filter(b => b.mapId !== 502);
if (JSON.stringify(afterConfig) !== JSON.stringify(beforeConfig)) throw new Error('Unrelated boss configuration changed');
put(relative, fs.readFileSync(path.join(repo, relative)));
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ files, semanticErrors: 0 }, null, 2) + '\n');
console.log(JSON.stringify({ output: out, files: files.length, semanticErrors: 0 }));
