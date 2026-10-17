'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const util = require('node:util');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['baseline', 'out', 'java', 'ffdec'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw Error('Missing --' + name);
const root = path.resolve(__dirname, '..');
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw Error(message); };
const files = [];
function put(relative, bytes) {
  const target = path.join(out, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, bytes);
  files.push({path: relative, before: sha(fs.readFileSync(path.join(baseline, relative))), after: sha(bytes)});
}
const patchDir = path.join(root, 'compat/server-patches/acquisition-expansion');
const wild = JSON.parse(fs.readFileSync(path.join(patchDir, 'wild-additions.json'), 'utf8')).additions;
const catalog = JSON.parse(fs.readFileSync(path.join(patchDir, 'exchange-groups.json'), 'utf8'));
const exchangeIds = catalog.groups.flatMap(group => group.petIds);
check(new Set(exchangeIds).size === exchangeIds.length && catalog.coins === 1000, 'Invalid exchange catalog');

// Wild additions copy the map's first encounter so refresh, catch and capsule drops match the pool.
const ogresPath = 'app/config/data/json/map-ogres.json';
let ogresText = fs.readFileSync(path.join(baseline, ogresPath), 'utf8');
const expectedOgres = JSON.parse(ogresText);
function mapBlock(text, mapId) {
  const key = `\n    "${mapId}": {`;
  const at = text.indexOf(key);
  check(at >= 0 && text.indexOf(key, at + 1) < 0, 'Expected one map pool ' + mapId);
  const start = at + key.length - 1;
  let depth = 0, index = start;
  for (; index < text.length; index++) {
    if (text[index] === '{') depth++;
    else if (text[index] === '}' && --depth === 0) break;
  }
  return {start, end: index + 1, value: JSON.parse(text.slice(start, index + 1))};
}
const render = value => JSON.stringify(value, null, 2).split('\n').join('\n    ');
for (const mapId of [...new Set(wild.map(entry => entry.mapId))]) {
  const block = mapBlock(ogresText, mapId);
  check(render(block.value) === ogresText.slice(block.start, block.end), 'Map pool formatting changed: ' + mapId);
  for (const pool of [block.value, expectedOgres.maps[mapId]]) {
    const template = pool.ogres[0];
    for (const entry of wild.filter(e => e.mapId === mapId)) {
      check(!pool.ogres.some(o => o.petId === entry.petId), `Encounter already exists: ${mapId}/${entry.petId}`);
      check(template.minLevel === entry.minLevel && template.maxLevel === entry.maxLevel, 'Map level baseline changed: ' + mapId);
      pool.ogres.push({...structuredClone(template), slot: Math.max(...pool.ogres.map(o => o.slot)) + 1, petId: entry.petId, shiny: entry.shiny, weight: entry.weight,
        dropItems: template.dropItems.filter(drop => drop.itemId === 300001)});
    }
  }
  ogresText = ogresText.slice(0, block.start) + render(block.value) + ogresText.slice(block.end);
}
check(util.isDeepStrictEqual(JSON.parse(ogresText), expectedOgres), 'Unexpected encounter changes');
put(ogresPath, ogresText);

// The exchange keeps R54's sixteen parents and adds every remaining resource-ready dex pet.
const acquisitionPath = 'app/config/data/json/pet-acquisition.json';
const acquisition = JSON.parse(fs.readFileSync(path.join(baseline, acquisitionPath), 'utf8'));
check(acquisition.exchange.groupId === 900001 && acquisition.exchange.coins === 1000 && acquisition.exchange.mapId === 5, 'Unknown exchange baseline');
check(acquisition.exchange.petIds.every(id => exchangeIds.includes(id)), 'Exchange would drop an existing pet');
acquisition.exchange.petIds = exchangeIds;
put(acquisitionPath, JSON.stringify(acquisition, null, 2) + '\n');

function parse(raw) {
  const signature = raw.subarray(0, 3).toString();
  check(signature === 'CWS', 'Expected compressed native Core');
  const body = zlib.inflateSync(raw.subarray(8));
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6;
    let size = short & 63;
    if (size === 63) {size = body.readUInt32LE(offset); offset += 4;}
    const payload = body.subarray(offset, offset + size); offset += size;
    tags.push({code, name: code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null, raw: body.subarray(start, offset)});
    if (!code) break;
  }
  check(offset === body.length, 'Invalid native tag stream');
  return {raw, header, tags};
}
const coreRelative = 'client/assets/dll/NieoCore.swf';
const core = parse(fs.readFileSync(path.join(baseline, coreRelative)));
const nativePath = path.join(root, 'compat/client-patches/acquisition-restoration/MapProcess_5.as');
const nativeSource = fs.readFileSync(nativePath, 'utf8');
const nativeGroups = '[' + catalog.groups.map(g => `["${g.type}",[${g.petIds.join(',')}]]`).join(',') + ']';
check(nativeSource.includes(`private const exchangeGroups:Array = ${nativeGroups};`), 'Native exchange catalog mismatch');
const importDir = path.join(out, 'compiler/import');
fs.mkdirSync(path.join(importDir, 'scripts/com/robot/app/mapProcess'), {recursive: true});
fs.copyFileSync(nativePath, path.join(importDir, 'scripts/com/robot/app/mapProcess/MapProcess_5.as'));
const compiledPath = path.join(out, 'compiler/output.swf');
execFileSync(values.java, ['-Djava.awt.headless=true', '-jar', values.ffdec, '-onerror', 'abort', '-importScript',
  path.join(baseline, coreRelative), compiledPath, importDir], {stdio: 'inherit', timeout: 120000});
const key = 'com/robot/app/mapProcess/MapProcess_5';
const replacement = parse(fs.readFileSync(compiledPath)).tags.filter(t => t.code === 82 && t.name === key);
check(core.tags.filter(t => t.code === 82 && t.name === key).length === 1 && replacement.length === 1, 'Laboratory class was not rebuilt');
const body = Buffer.concat([core.header, ...core.tags.map(t => t.name === key ? replacement[0].raw : t.raw)]);
const length = Buffer.alloc(4); length.writeUInt32LE(body.length + 8);
const finalCore = Buffer.concat([core.raw.subarray(0, 4), length, zlib.deflateSync(body, {level: 9})]);
const final = parse(finalCore);
check(final.tags.length === core.tags.length && final.tags.every((t, i) => t.name === key || t.raw.equals(core.tags[i].raw)), 'Unrelated Core tag changed');
put(coreRelative, finalCore);

fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, noDatabaseMigration: true,
  changedNativeClasses: [key], unrelatedNativeTagsPreserved: true, wildAdditions: wild.length, exchangePets: exchangeIds.length}, null, 2) + '\n');
console.log(JSON.stringify({files: files.length, wildAdditions: wild.length, exchangePets: exchangeIds.length, out}));
