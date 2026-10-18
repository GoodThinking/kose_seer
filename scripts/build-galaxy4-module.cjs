'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['original', 'baseline', 'out', 'java', 'ffdec'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw Error('Missing --' + name);
const root = path.resolve(__dirname, '..');
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw Error(message); };
const galaxyRelative = 'module/com/robot/module/app/subMap/Galaxy_4.swf';
// The unpruned 裂空 module still carries the Core classes the compiler needs to resolve.
const originalHash = '2679cccacb8c05f0aa7d40a30dc749dad61634a9b4c1c5400760a46368cbd044';

function parse(raw) {
  const signature = raw.subarray(0, 3).toString();
  check(signature === 'CWS' || signature === 'FWS', 'Unsupported SWF signature');
  const body = signature === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6;
    let size = short & 63;
    if (size === 63) {size = body.readUInt32LE(offset); offset += 4;}
    offset += size;
    tags.push({code, raw: body.subarray(start, offset)});
    if (!code) break;
  }
  check(offset === body.length, 'Invalid SWF tag stream');
  return {raw, header, tags, signature};
}
function encode(source, replacements) {
  const body = Buffer.concat([source.header, ...source.tags.map(tag => replacements.get(tag) || tag.raw)]);
  const header = Buffer.from(source.raw.subarray(0, 8));
  header.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([header, source.signature === 'CWS' ? zlib.deflateSync(body, {level: 9}) : body]);
}
const unique = (source, code, label) => {
  const tags = source.tags.filter(tag => tag.code === code);
  check(tags.length === 1, 'Expected one ' + label);
  return tags[0];
};

const originalRaw = fs.readFileSync(path.resolve(values.original));
check(sha(originalRaw) === originalHash, 'Unexpected original Galaxy_4 module');
const live = ['assets', 'overlay'].map(dir => fs.readFileSync(path.join(baseline, 'client', dir, galaxyRelative)));
check(live[0].equals(live[1]), 'Galaxy overlay differs from assets; resolve baseline first');
const compiler = path.join(out, 'compiler');
const importDir = path.join(compiler, 'import/scripts/com/robot/module/app/subMap');
fs.mkdirSync(importDir, {recursive: true});
fs.copyFileSync(path.join(root, 'compat/client-patches/fourth-galaxy-p1/Galaxy_4.as'), path.join(importDir, 'Galaxy_4.as'));
const run = args => execFileSync(values.java, ['-Djava.awt.headless=true', '-jar', values.ffdec, ...args], {stdio: 'inherit', timeout: 120000});
const at = name => path.join(compiler, name);
run(['-onerror', 'abort', '-importScript', path.resolve(values.original), at('compiled.swf'), path.join(compiler, 'import')]);
run(['-swf2xml', at('compiled.swf'), at('export.xml')]);
execFileSync('python3', [path.join(root, 'scripts/prune-fourth-galaxy-module.py'), at('export.xml'), at('owned.xml')], {stdio: 'inherit', timeout: 120000});
run(['-xml2swf', at('owned.xml'), at('owned.swf')]);
run(['-abcclean', at('owned.swf'), at('cleaned.swf')]);
const original = parse(originalRaw), cleaned = parse(fs.readFileSync(at('cleaned.swf')));
const replacements = new Map([[unique(original, 82, 'module ABC'), unique(cleaned, 82, 'cleaned ABC').raw],
  [unique(original, 76, 'module symbols'), unique(cleaned, 76, 'cleaned symbols').raw]]);
const result = encode(original, replacements);
const before = parse(live[0]), after = parse(result);
check(before.tags.length === after.tags.length && after.tags.every((tag, index) =>
  tag.code === 82 || tag.raw.equals(before.tags[index].raw)), 'Only the module class may change');
const files = [];
for (const dir of ['assets', 'overlay']) {
  const relative = path.posix.join('client', dir, galaxyRelative), target = path.join(out, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, result);
  files.push({path: relative, before: sha(live[0]), after: sha(result)});
}
const manifest = {files, changedNativeClasses: ['com/robot/module/app/subMap/Galaxy_4'], serverFilesChanged: false, noDatabaseMigration: true};
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
