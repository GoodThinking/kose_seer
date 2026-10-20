'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['baseline', 'out', 'java', 'ffdec', 'context'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw Error('Missing --' + name);
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const relative = 'client/assets/dll/NieoCore.swf';
const keys = ['com/robot/app/mapProcess/MapProcess_5', 'com/robot/core/manager/PetManager'];
const ts = require(path.join(path.resolve(values.context), 'node_modules/typescript'));
const files = [];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function check(condition, message) { if (!condition) throw Error(message); }
function parse(raw) {
  check(raw.subarray(0, 3).toString() === 'CWS', 'Expected compressed native Core');
  const body = zlib.inflateSync(raw.subarray(8));
  check(raw.readUInt32LE(4) === body.length + 8, 'Invalid native length');
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6;
    let size = short & 63;
    if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
    const payload = body.subarray(offset, offset + size); offset += size;
    tags.push({code, name: code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null, raw: body.subarray(start, offset)});
    if (!code) break;
  }
  check(offset === body.length, 'Invalid native tag stream');
  return {raw, header, tags};
}
const corePath = path.join(baseline, relative);
const core = parse(fs.readFileSync(corePath));
const importDir = path.join(out, 'compiler/import');
for (const [key, source] of [
  [keys[0], '../compat/client-patches/acquisition-restoration/MapProcess_5.as'],
  [keys[1], '../compat/client-patches/pet-storage/PetManager.as']
]) {
  const target = path.join(importDir, 'scripts', key + '.as');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(__dirname, source), target);
}
const compiledPath = path.join(out, 'compiler/output.swf');
execFileSync(values.java, ['-Djava.awt.headless=true', '-jar', values.ffdec, '-onerror', 'abort', '-importScript',
  corePath, compiledPath, importDir], {stdio: 'inherit', timeout: 120000});
const compiled = parse(fs.readFileSync(compiledPath));
const replacements = new Map();
for (const key of keys) {
  const replacement = compiled.tags.filter(t => t.code === 82 && t.name === key);
  const original = core.tags.filter(t => t.code === 82 && t.name === key);
  check(original.length === 1 && replacement.length === 1 && !original[0].raw.equals(replacement[0].raw), 'Native class was not rebuilt: ' + key);
  replacements.set(key, replacement[0].raw);
}
const body = Buffer.concat([core.header, ...core.tags.map(t => replacements.get(t.name) || t.raw)]);
const length = Buffer.alloc(4); length.writeUInt32LE(body.length + 8);
const finalCore = Buffer.concat([core.raw.subarray(0, 4), length, zlib.deflateSync(body, {level: 9})]);
const final = parse(finalCore);
check(final.tags.length === core.tags.length && final.tags.every((t, i) => keys.includes(t.name) || t.raw.equals(core.tags[i].raw)), 'Unrelated Core tag changed');
function put(name, bytes) {
  fs.mkdirSync(path.dirname(path.join(out, name)), {recursive: true});
  fs.writeFileSync(path.join(out, name), bytes);
  files.push({path: name, before: sha(fs.readFileSync(path.join(baseline, name))), after: sha(bytes)});
}
put(relative, finalCore);
function patch(name, visit) {
  const source = fs.readFileSync(path.join(baseline, name), 'utf8');
  const ast = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true);
  const edits = [];
  function walk(node) { visit(node, ast, edits); ts.forEachChild(node, walk); }
  walk(ast);
  check(edits.length > 0, 'No patch points in ' + name);
  let result = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  check(!ts.createSourceFile(name, result, ts.ScriptTarget.Latest, true).parseDiagnostics.length, 'Invalid patched module: ' + name);
  put(name, result);
}
for (const extension of ['js', 'ts']) {
  const name = `app/${extension === 'js' ? 'dist' : 'src'}/GameServer/Game/Pet/PetManager.${extension}`;
  let methods = 0;
  patch(name, (node, ast, edits) => {
    if (!ts.isMethodDeclaration(node) || node.name.getText(ast) !== 'GivePet') return;
    check(node.parameters.length === 4, 'Unknown GivePet signature');
    methods++;
    edits.push({start: node.parameters.end, end: node.parameters.end, text: `, toStorage${extension === 'ts' ? ': boolean' : ''} = false`});
    function grant(child) {
      if (ts.isBinaryExpression(child) && child.left.getText(ast) === 'newPet.isDefault') {
        check(child.right.getText(ast) === 'bagSpace === 6', 'Unknown default-pet rule');
        edits.push({start: child.right.getStart(ast), end: child.right.end, text: '!toStorage && bagSpace === 6'});
      }
      if (ts.isIfStatement(child) && child.expression.getText(ast) === 'bagSpace <= 0') {
        edits.push({start: child.expression.getStart(ast), end: child.expression.end, text: 'toStorage || bagSpace <= 0'});
        if (extension === 'ts') {
          const position = child.thenStatement.statements[0].end;
          edits.push({start: position, end: position, text: ' if (toStorage) newPet.isDefault = false;'});
        }
      }
      if (ts.isTemplateExpression(child) && child.getText(ast).includes('背包满，将精灵放入仓库')) {
        edits.push({start: child.getStart(ast), end: child.end, text: child.getText(ast).replace('背包满，将精灵放入仓库', '将精灵放入仓库')});
      }
      ts.forEachChild(child, grant);
    }
    grant(node.body);
    check(edits.length === 4, 'Unknown GivePet placement implementation');
  });
  check(methods === 1, 'Expected one GivePet method');
}
let towerCalls = 0;
patch('app/dist/GameServer/Game/Battle/FreshTower.js', (node, ast, edits) => {
  if (ts.isCallExpression(node) && node.expression.getText(ast) === 'player.PetManager.GivePet') {
    check(node.arguments.map(arg => arg.getText(ast)).join(',') === 'petId,5,catchTime', 'Unknown tower grant call');
    towerCalls++;
    edits.push({start: node.arguments.end, end: node.arguments.end, text: ', undefined, true'});
  }
});
check(towerCalls === 1, 'Expected one tower grant call');
const manifest = {files, changedNativeClasses: keys, unrelatedNativeTagsPreserved: true, restartGame: true, noDatabaseMigration: true};
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
