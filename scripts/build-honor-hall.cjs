'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {parseArgs} = require('node:util');
const names = ['baseline', 'out'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw Error('Missing --' + name);
const root = path.resolve(__dirname, '..');
const patch = path.join(root, 'compat/client-patches/honor-hall');
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw Error(message); };
const coreRelative = 'client/assets/dll/NieoCore.swf';

function parse(raw) {
  check(raw.subarray(0, 3).toString() === 'CWS', 'Expected compressed native Core');
  const body = zlib.inflateSync(raw.subarray(8));
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6;
    let size = short & 63;
    if (size === 63) {size = body.readUInt32LE(offset); offset += 4;}
    const payload = body.subarray(offset, offset + size); offset += size;
    tags.push({code, payload, name: code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null,
      raw: body.subarray(start, offset)});
    if (!code) break;
  }
  check(offset === body.length, 'Invalid SWF tag stream');
  return {raw, header, tags};
}
function symbolId(source, name) {
  const ids = [];
  for (const tag of source.tags.filter(tag => tag.code === 76)) {
    let offset = 2;
    for (let index = 0; index < tag.payload.readUInt16LE(0); index++) {
      const id = tag.payload.readUInt16LE(offset); offset += 2;
      const end = tag.payload.indexOf(0, offset);
      if (tag.payload.subarray(offset, end).toString() === name) ids.push(id);
      offset = end + 1;
    }
  }
  check(ids.length === 1, 'Expected one symbol ' + name);
  return ids[0];
}
function appendXml(source, replacements, symbol, file, rootName, entryName) {
  const id = symbolId(source, symbol);
  const tags = source.tags.filter(tag => tag.code === 87 && tag.payload.readUInt16LE(0) === id);
  check(tags.length === 1, 'Expected one table ' + symbol);
  const original = tags[0].payload.subarray(6).toString('utf8');
  const document = fs.readFileSync(path.join(patch, file), 'utf8').trim();
  const inner = document.slice(rootName.length + 2, -(rootName.length + 3)).trim();
  const ids = [...inner.matchAll(new RegExp('<' + entryName + '\\b[^>]*\\bid="(\\d+)"', 'g'))].map(match => match[1]);
  check(ids.length === 1 && ids[0] === '332', 'Unexpected map patch scope');
  check(!new RegExp('<' + entryName + '\\b[^>]*\\bid="332"').test(original), 'Map already registered: 332');
  const closing = new RegExp('</' + rootName + '>\\s*$');
  check(closing.test(original), 'Missing current XML closing root');
  const payload = Buffer.concat([tags[0].payload.subarray(0, 6), Buffer.from(original.replace(closing, inner + '\n$&'), 'utf8')]);
  const header = Buffer.alloc(6); header.writeUInt16LE((87 << 6) | 63); header.writeUInt32LE(payload.length, 2);
  replacements.set(tags[0], Buffer.concat([header, payload]));
}

const core = parse(fs.readFileSync(path.join(baseline, coreRelative))), replacements = new Map();
appendXml(core, replacements, 'com.robot.core.manager.map.config.MapConfig_xmlCls', 'maps.xml', 'Maps', 'map');
appendXml(core, replacements, 'com.robot.core.config.xml.MapIntroXMLInfo_xmlClass', 'map-intro.xml', 'map', 'map');

const body = Buffer.concat([core.header, ...core.tags.map(tag => replacements.get(tag) || tag.raw)]);
const length = Buffer.alloc(4); length.writeUInt32LE(body.length + 8);
const finalCore = Buffer.concat([core.raw.subarray(0, 4), length, zlib.deflateSync(body, {level: 9})]);
const final = parse(finalCore);
check(final.tags.length === core.tags.length && final.tags.every((tag, index) =>
  tag.raw.equals(replacements.get(core.tags[index]) || core.tags[index].raw)), 'Unrelated Core tag changed');
const target = path.join(out, coreRelative);
fs.mkdirSync(path.dirname(target), {recursive: true});
fs.writeFileSync(target, finalCore);
const manifest = {files: [{path: coreRelative, before: sha(core.raw), after: sha(finalCore)}], mapIds: [332],
  changedEmbeddedTables: ['MapConfig/MapXMLInfo', 'MapIntroXMLInfo'],
  unrelatedNativeTagsPreserved: true, serverFilesChanged: false, noDatabaseMigration: true};
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
