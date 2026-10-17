'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {parseArgs} = require('node:util');
const {execFileSync} = require('node:child_process');
const names = ['core', 'fortress', 'out', 'java', 'ffdec'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw Error('Missing --' + name);
const out = path.resolve(values.out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw Error(message); };
function put(relative, bytes) {
  const file = path.join(out, relative);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, bytes);
}
function parse(raw) {
  check(raw.subarray(0, 3).toString() === 'CWS', 'Expected compressed SWF');
  const body = zlib.inflateSync(raw.subarray(8));
  check(body.length + 8 === raw.readUInt32LE(4), 'Invalid SWF length');
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset);
    offset += 2;
    const code = short >> 6;
    let length = short & 63;
    if (length === 63) { length = body.readUInt32LE(offset); offset += 4; }
    check(offset + length <= body.length, 'Truncated SWF tag');
    const payload = body.subarray(offset, offset + length);
    const name = code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null;
    offset += length;
    tags.push({code, name, raw: body.subarray(start, offset)});
    if (!code) break;
  }
  check(offset === body.length && tags.at(-1)?.code === 0, 'Invalid SWF end');
  return {raw, header, tags};
}
function encode(movie, tags) {
  const body = Buffer.concat([movie.header, ...tags.map(tag => tag.raw)]);
  const size = Buffer.alloc(4);
  size.writeUInt32LE(body.length + 8);
  return Buffer.concat([movie.raw.subarray(0, 4), size, zlib.deflateSync(body, {level: 9})]);
}
const classes = ['MapProcess_13', 'MapProcess_56', 'MapProcess_101', 'PKMap'];
const coreBytes = fs.readFileSync(values.core), core = parse(coreBytes);
for (const name of classes) put('compiler/import/scripts/com/robot/app/mapProcess/' + name + '.as',
  fs.readFileSync(path.join(__dirname, '../compat/client-patches/material-sources/', name + '.as')));
execFileSync(values.java, ['-Djava.awt.headless=true', '-jar', values.ffdec, '-onerror', 'abort',
  '-importScript', values.core, path.join(out, 'compiler/output.swf'), path.join(out, 'compiler/import')],
  {stdio: 'inherit', timeout: 120000});
const compiled = parse(fs.readFileSync(path.join(out, 'compiler/output.swf')));
const replacements = new Map();
for (const name of classes) {
  const key = 'com/robot/app/mapProcess/' + name;
  const original = core.tags.filter(tag => tag.code === 82 && tag.name === key);
  const changed = compiled.tags.filter(tag => tag.code === 82 && tag.name === key);
  check(original.length === 1 && changed.length === 1, 'Missing unique class ' + key);
  check(!original[0].raw.equals(changed[0].raw), 'Class was not compiled: ' + key);
  replacements.set(key, changed[0]);
}
// Transplant only the four authorized classes; preserve every other original tag verbatim.
const final = encode(core, core.tags.map(tag => replacements.get(tag.name) || tag));
const result = parse(final);
check(result.tags.length === core.tags.length, 'Native tag count changed');
check(result.tags.every((tag, i) => replacements.has(tag.name) || tag.raw.equals(core.tags[i].raw)), 'Unrelated native class or artwork changed');
const fortress = fs.readFileSync(values.fortress);
check(sha(fortress) === '8028f8a5ef3faa813a0201167586e1479a227d5d0d85146080fd1b108a1caaa8', 'Original fortress artwork changed');
parse(fortress);
const corePath = 'client/assets/dll/NieoCore.swf', fortressPath = 'client/assets/resource/map/700001.swf';
put(corePath, final);
put(fortressPath, fortress);
put('manifest-client.json', JSON.stringify({
  files: [{path: corePath, before: sha(coreBytes), after: sha(final)}, {path: fortressPath, before: null, after: sha(fortress)}],
  changedClasses: classes, unrelatedNativeTagsPreserved: true,
  fortressSource: 'http://seer.61.com.tw/resource/map/700001.swf'
}, null, 2) + '\n');
console.log(JSON.stringify({core: sha(final), fortress: sha(fortress), changedClasses: classes}));
