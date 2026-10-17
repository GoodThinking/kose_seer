'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {parseArgs} = require('node:util');
const names = ['context', 'baseline', 'out'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw Error('Missing --' + name);
const root = path.resolve(__dirname, '..');
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const ts = require(path.join(path.resolve(values.context), 'node_modules/typescript'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw Error(message); };
const files = [];
function put(relative, bytes) {
  const target = path.join(out, relative), before = path.join(baseline, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, bytes);
  files.push({path: relative, before: fs.existsSync(before) ? sha(fs.readFileSync(before)) : null, after: sha(bytes)});
}
// The receiver handlers on the server are R53's transpiled source; refuse anything newer.
const handler = 'GameServer/Server/Packet/Recv/NoNo/ExperienceReceiverHandlers';
const expected = {
  ['app/src/' + handler + '.ts']: 'c7e0a11299b7152e72d8ea0ddb29dbae620be28e42ba5806b2c8989de7e670be',
  ['app/dist/' + handler + '.js']: 'a08224a74f47e8556706f619af95acec2324a3bf16f5b40a9bd81a678ac5ac52',
  ['app/dist/' + handler + '.js.map']: '3b87a77ac6e36549138b1abcd47f0abbedd19459593db38834ebadc492ca69fa',
};
for (const [relative, hash] of Object.entries(expected)) {
  check(sha(fs.readFileSync(path.join(baseline, relative))) === hash, 'Unexpected receiver baseline: ' + relative);
}
check(!fs.existsSync(path.join(baseline, 'app/dist/GameServer/Game/Item/GachaTicket.js')), 'Gacha ticket module already deployed');
for (const [input, target] of [
  ['compat/server-patches/gacha-ticket/GachaTicket.ts', 'GameServer/Game/Item/GachaTicket'],
  ['compat/server-patches/material-sources/ExperienceReceiverHandlers.ts', handler],
]) {
  const source = fs.readFileSync(path.join(root, input), 'utf8');
  const compiled = ts.transpileModule(source, {fileName: target + '.ts', reportDiagnostics: true, compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true,
    experimentalDecorators: true, emitDecoratorMetadata: true, esModuleInterop: true, sourceMap: true
  }});
  check(!compiled.diagnostics.some(d => d.category === ts.DiagnosticCategory.Error), 'Invalid TypeScript ' + input);
  put('app/src/' + target + '.ts', source);
  put('app/dist/' + target + '.js', compiled.outputText);
  const map = JSON.parse(compiled.sourceMapText);
  map.sources = [path.posix.relative(path.posix.dirname('dist/' + target), 'src/' + target + '.ts')];
  put('app/dist/' + target + '.js.map', JSON.stringify(map));
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, noDatabaseMigration: true,
  receiverType: 2051, reward: {itemId: 400501, count: 2, period: 'Beijing day'}}, null, 2) + '\n');
console.log(JSON.stringify({files: files.length, out}));
