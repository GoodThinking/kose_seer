#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const root = path.resolve(__dirname, '..');
const { values: args } = parseArgs({ options: Object.fromEntries(
  ['baseline', 'out', 'java', 'ffdec'].map(name => [name, { type: 'string' }])) });
for (const key of ['baseline', 'out', 'java', 'ffdec']) {
  if (!args[key]) throw new Error(`Required --${key}`);
}
const baseline = path.resolve(args.baseline);
const out = path.resolve(args.out);
if (fs.existsSync(out)) throw new Error(`Output already exists: ${out}`);
const ts = require(path.join(baseline, 'app/node_modules/typescript'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const pinned = {
  'app/src/GameServer/Game/Pet/PermanentPetExchange.ts': '0d31ad383c0000c3492f7271b74687b001f279927eea4a306e1c938939585895',
  'app/dist/GameServer/Game/Pet/PermanentPetExchange.js': '2092f58d5235659601a7b577c71811b4ed60d5c5d25c52a6620e047d965e106a',
  'app/dist/GameServer/Server/Packet/Recv/Pet/PetCollectHandler.js': '776f474d708f9dfb62451e76b2b8240e0036121408a55a8e30905c134e1fba39',
  'client/overlay/resource/module/com/robot/module/app/FightExchangePanel.swf': 'cb125db953dc3a82e9873c67eeb4cd0146b077a13914ed4a04a526eb2d04cde4'
};
for (const [relative, expected] of Object.entries(pinned)) {
  if (sha(fs.readFileSync(path.join(baseline, relative))) !== expected) {
    throw new Error(`Baseline changed; reconcile before building: ${relative}`);
  }
}
const files = [];
function emit(relative, data) {
  const target = path.join(out, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
  const original = path.join(baseline, relative);
  files.push({ path: relative, before: fs.existsSync(original) ? sha(fs.readFileSync(original)) : null,
    after: sha(Buffer.isBuffer(data) ? data : Buffer.from(data)) });
}
const sourcePath = 'app/src/GameServer/Game/Pet/PermanentPetExchange.ts';
const source = fs.readFileSync(path.join(root, 'compat/server-patches/puni-lifesteal-signin/PermanentPetExchange.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  fileName: 'PermanentPetExchange.ts',
  reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
    esModuleInterop: true, sourceMap: true, experimentalDecorators: true }
});
if (compiled.diagnostics.some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)) {
  throw new Error('Invalid TypeScript patch');
}
const map = JSON.parse(compiled.sourceMapText);
map.sources = ['../../../../src/GameServer/Game/Pet/PermanentPetExchange.ts'];
emit(sourcePath, source);
emit('app/dist/GameServer/Game/Pet/PermanentPetExchange.js', compiled.outputText);
emit('app/dist/GameServer/Game/Pet/PermanentPetExchange.js.map', JSON.stringify(map));

const handlerPath = 'app/dist/GameServer/Server/Packet/Recv/Pet/PetCollectHandler.js';
const handler = fs.readFileSync(path.join(baseline, handlerPath), 'utf8');
const tree = ts.createSourceFile(handlerPath, handler, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
let insertion = null;
function visit(node) {
  if ((ts.isClassExpression(node) || ts.isClassDeclaration(node)) && node.name?.text === 'IsCollectHandler') {
    const method = node.members.find(member => ts.isMethodDeclaration(member) && member.name.getText(tree) === 'Handle');
    const statement = method?.body.statements.find(item => ts.isVariableStatement(item) &&
      item.declarationList.declarations.some(declaration => declaration.name.getText(tree) === 'groupId'));
    if (!statement || insertion !== null) throw new Error('Unexpected IsCollectHandler shape');
    insertion = statement.end;
  }
  ts.forEachChild(node, visit);
}
visit(tree);
if (insertion === null) throw new Error('IsCollectHandler not found');
const route = '\n        if (groupId === 900001)\n            return require("../../../../Game/Pet/PermanentPetExchange").HandleSignInStatus(player);';
emit(handlerPath, handler.slice(0, insertion) + route + handler.slice(insertion));

function parseSwf(bytes) {
  const signature = bytes.toString('ascii', 0, 3);
  if (!['FWS', 'CWS'].includes(signature)) throw new Error('Unsupported SWF');
  const body = signature === 'CWS' ? zlib.inflateSync(bytes.subarray(8)) : bytes.subarray(8);
  if (body.length + 8 !== bytes.readUInt32LE(4)) throw new Error('Invalid SWF length');
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const prefix = body.subarray(0, offset);
  const tags = [];
  while (offset < body.length) {
    const start = offset;
    const header = body.readUInt16LE(offset); offset += 2;
    const code = header >> 6;
    let length = header & 63;
    if (length === 63) { length = body.readUInt32LE(offset); offset += 4; }
    const payload = body.subarray(offset, offset + length);
    if (payload.length !== length) throw new Error('Truncated SWF tag');
    offset += length;
    tags.push({ code, raw: body.subarray(start, offset),
      name: code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString('utf8') : null });
  }
  return { header: bytes.subarray(0, 8), prefix, tags };
}
function assemble(template, tags) {
  const body = Buffer.concat([template.prefix, ...tags.map(tag => tag.raw)]);
  const header = Buffer.from(template.header);
  header.write('CWS'); header.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([header, zlib.deflateSync(body)]);
}
function ffdec(...values) {
  execFileSync(args.java, ['-Xmx2g', '-jar', args.ffdec, ...values], { stdio: ['ignore', 'pipe', 'pipe'] });
}
const panelPath = 'client/overlay/resource/module/com/robot/module/app/FightExchangePanel.swf';
const panelFile = path.join(baseline, panelPath);
const panel = parseSwf(fs.readFileSync(panelFile));
const panelIndex = panel.tags.findIndex(tag => tag.code === 82);
if (panelIndex < 0 || panel.tags.filter(tag => tag.code === 82).length !== 1) throw new Error('Expected one panel ABC');
const coreFile = path.join(baseline, 'client/overlay/dll/NieoCore.swf');
const coreBytes = fs.readFileSync(coreFile);
const core = parseSwf(coreBytes);
const scratch = path.join(out, '.build');
fs.mkdirSync(scratch, { recursive: true });
const exported = path.join(scratch, 'original');
ffdec('-export', 'script', exported, panelFile);
const localTypes = new Set();
function collectTypes(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collectTypes(file);
    else if (entry.name.endsWith('.as')) localTypes.add(path.relative(path.join(exported, 'scripts'), file).replaceAll(path.sep, '/').slice(0, -3));
  }
}
collectTypes(path.join(exported, 'scripts'));
const libraries = core.tags.filter(tag => tag.code === 82 && !localTypes.has(tag.name));
const combined = [...panel.tags.slice(0, panelIndex), ...libraries, ...panel.tags.slice(panelIndex)];
const compilerInput = path.join(scratch, 'library.swf');
const compilerOutput = path.join(scratch, 'compiled.swf');
fs.writeFileSync(compilerInput, assemble(panel, combined));
const imports = path.join(scratch, 'imports');
const panelSource = path.join(imports, 'com/robot/module/app/FightExchangePanel.as');
fs.mkdirSync(path.dirname(panelSource), { recursive: true });
fs.copyFileSync(path.join(root, 'compat/client-patches/daily-sign/FightExchangePanel.as'), panelSource);
ffdec('-importScript', compilerInput, compilerOutput, imports);
const updated = parseSwf(fs.readFileSync(compilerOutput));
const replacement = updated.tags[panelIndex + libraries.length];
if (updated.tags.length !== combined.length || replacement?.code !== 82 || replacement.name !== panel.tags[panelIndex].name) {
  throw new Error('Compiler changed target tag structure');
}
if (replacement.raw.equals(panel.tags[panelIndex].raw)) throw new Error('Panel script was not imported');
const finalTags = panel.tags.map((tag, index) => index === panelIndex ? replacement : tag);
const final = assemble(panel, finalTags);
const checked = parseSwf(final);
if (!panel.prefix.equals(checked.prefix) || panel.tags.some((tag, index) => tag.code !== 82 && !tag.raw.equals(checked.tags[index].raw))) {
  throw new Error('Panel artwork, fonts, linkage or dimensions changed');
}
emit(panelPath, final);
fs.rmSync(scratch, { recursive: true });
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({
  restartGame: true, restartWeb: false, databaseChanges: false,
  compilerOnlyCore: { sha256: sha(coreBytes), deployed: false }, files
}, null, 2) + '\n');
console.log(JSON.stringify({ output: out, files: files.length, panelBytes: final.length, preservedNonAbcTags: true }));
