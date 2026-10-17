'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {parseArgs} = require('node:util');
const {execFileSync} = require('node:child_process');

const names = ['core', 'module', 'out', 'java', 'ffdec'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw new Error(`Missing --${name}`);
const out = path.resolve(values.out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => {if (!condition) throw new Error(message);};
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
  const header = body.subarray(0, offset);
  const tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset);
    offset += 2;
    const code = short >> 6;
    let length = short & 63;
    if (length === 63) {length = body.readUInt32LE(offset); offset += 4;}
    check(offset + length <= body.length, 'Truncated SWF tag');
    const payload = body.subarray(offset, offset + length);
    const name = code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null;
    offset += length;
    tags.push({code, name, raw: body.subarray(start, offset)});
    if (code === 0) break;
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

const moduleBytes = fs.readFileSync(values.module), coreBytes = fs.readFileSync(values.core);
check(sha(moduleBytes) === 'cd7383aace48e740ff464d1006a068c59acd34361f938811db502bab4f5ccb4c', 'Galaxy module baseline changed');
const moduleMovie = parse(moduleBytes), core = parse(coreBytes);
const moduleAbcs = moduleMovie.tags.filter(tag => tag.code === 82);
check(moduleAbcs.length === 1, 'Expected one galaxy module ABC');
check(!core.tags.some(tag => tag.code === 82 && tag.name === moduleAbcs[0].name), 'Module ABC already exists in compiler context');
// Core supplies compiler definitions only; the release contains no Core bytes.
put('compiler/input.swf', encode(core, [...core.tags.slice(0, -1), ...moduleAbcs, core.tags.at(-1)]));
put('compiler/import/scripts/com/robot/module/app/subMap/Galaxy_1.as',
  fs.readFileSync(path.join(__dirname, '../compat/client-patches/star-map/Galaxy_1.as')));
execFileSync(values.java, ['-Djava.awt.headless=true', '-jar', values.ffdec, '-onerror', 'abort',
  '-importScript', path.join(out, 'compiler/input.swf'), path.join(out, 'compiler/output.swf'),
  path.join(out, 'compiler/import')], {stdio: 'inherit', timeout: 120000});
const compiled = parse(fs.readFileSync(path.join(out, 'compiler/output.swf')));
const imported = compiled.tags.filter(tag => tag.code === 82 && tag.name === moduleAbcs[0].name);
check(imported.length === 1 && !imported[0].raw.equals(moduleAbcs[0].raw), 'Galaxy source was not compiled');
const finalModule = encode(moduleMovie, moduleMovie.tags.map(tag => tag === moduleAbcs[0] ? imported[0] : tag));
const checked = parse(finalModule);
check(checked.tags.length === moduleMovie.tags.length, 'Module tag count changed');
check(checked.tags.every((tag, index) => tag.code === 82 || tag.raw.equals(moduleMovie.tags[index].raw)), 'Galaxy artwork or linkage changed');
const relative = 'client/overlay/module/com/robot/module/app/subMap/Galaxy_1.swf';
put(relative, finalModule);
const manifest = {
  baseline: {module: sha(moduleBytes), coreCompilerLibrary: sha(coreBytes)},
  files: [{path: relative, after: sha(finalModule)}],
  galaxyArtworkPreserved: true,
  coreUsedOnlyAsCompilerLibrary: true,
  backendChanged: false,
  databaseMigration: false
};
put('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
