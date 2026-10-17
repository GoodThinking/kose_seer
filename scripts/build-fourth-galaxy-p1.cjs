'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const names = ['baseline', 'out', 'java', 'ffdec'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw Error('Missing --' + name);
const root = path.resolve(__dirname, '..');
const patch = path.join(root, 'compat/client-patches/fourth-galaxy-p1');
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw Error(message); };
const coreRelative = 'client/assets/dll/NieoCore.swf';
const galaxyRelative = 'module/com/robot/module/app/subMap/Galaxy_4.swf';
const corePath = path.join(baseline, coreRelative);
const galaxyPath = path.join(baseline, 'client/assets', galaxyRelative);
const laboratoryKey = 'com/robot/app/mapProcess/MapProcess_5';
const galaxyKey = 'com/robot/module/app/subMap/Galaxy_4';

function parse(raw) {
  const signature = raw.subarray(0, 3).toString();
  check(signature === 'CWS' || signature === 'FWS', 'Unsupported SWF signature');
  const body = signature === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
  check(body.length + 8 === raw.readUInt32LE(4), 'Invalid SWF length');
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
  return {raw, header, tags, signature};
}
function encode(source, replacements) {
  const body = Buffer.concat([source.header, ...source.tags.map(tag => replacements.get(tag) || tag.raw)]);
  const header = Buffer.from(source.raw.subarray(0, 8));
  header.writeUInt32LE(body.length + 8, 4);
  const result = Buffer.concat([header, source.signature === 'CWS' ? zlib.deflateSync(body, {level: 9}) : body]);
  const final = parse(result);
  check(final.tags.length === source.tags.length && final.tags.every((tag, index) =>
    tag.raw.equals(replacements.get(source.tags[index]) || source.tags[index].raw)), 'Unrelated SWF tag changed');
  return result;
}
function uniqueTag(source, predicate, label) {
  const tags = source.tags.filter(predicate);
  check(tags.length === 1, 'Expected one ' + label);
  return tags[0];
}
function symbolId(source, name) {
  const ids = [];
  for (const tag of source.tags.filter(tag => tag.code === 76)) {
    let offset = 2;
    for (let index = 0; index < tag.payload.readUInt16LE(0); index++) {
      const id = tag.payload.readUInt16LE(offset); offset += 2;
      const end = tag.payload.indexOf(0, offset);
      check(end >= offset, 'Invalid symbol name');
      if (tag.payload.subarray(offset, end).toString() === name) ids.push(id);
      offset = end + 1;
    }
  }
  check(ids.length === 1, 'Expected one symbol ' + name);
  return ids[0];
}
function appendXml(source, replacements, symbol, file, rootName, entryName, expectedIds) {
  const id = symbolId(source, symbol);
  const tag = uniqueTag(source, tag => tag.code === 87 && tag.payload.readUInt16LE(0) === id, symbol);
  const original = tag.payload.subarray(6).toString('utf8');
  const document = fs.readFileSync(path.join(patch, file), 'utf8').trim();
  check(document.startsWith('<' + rootName + '>') && document.endsWith('</' + rootName + '>'), 'Invalid XML root');
  const inner = document.slice(rootName.length + 2, -(rootName.length + 3)).trim();
  const ids = [...inner.matchAll(new RegExp('<' + entryName + '\\b[^>]*\\bid="(\\d+)"', 'g'))].map(match => Number(match[1]));
  check(JSON.stringify(ids) === JSON.stringify(expectedIds), 'Unexpected map patch scope');
  for (const id of ids) check(!new RegExp('<' + entryName + '\\b[^>]*\\bid="' + id + '"').test(original), 'Map already registered: ' + id);
  const closing = new RegExp('</' + rootName + '>\\s*$');
  check(closing.test(original), 'Missing current XML closing root');
  const xml = original.replace(closing, inner + '\n$&');
  const payload = Buffer.concat([tag.payload.subarray(0, 6), Buffer.from(xml, 'utf8')]);
  const header = Buffer.alloc(6); header.writeUInt16LE((87 << 6) | 63); header.writeUInt32LE(payload.length, 2);
  replacements.set(tag, Buffer.concat([header, payload]));
}
function compileClass(sourcePath, nativeSource, key, directory, abcName = key) {
  const importDirectory = path.join(out, 'compiler', directory, 'import');
  const target = path.join(importDirectory, 'scripts', key + '.as');
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(nativeSource, target);
  const compiledPath = path.join(out, 'compiler', directory, 'compiled.swf');
  execFileSync(values.java, ['-Djava.awt.headless=true', '-jar', values.ffdec, '-onerror', 'abort', '-importScript', sourcePath, compiledPath, importDirectory],
    {stdio: 'inherit', timeout: 120000});
  return uniqueTag(parse(fs.readFileSync(compiledPath)), tag => tag.code === 82 && tag.name === abcName, abcName).raw;
}
const core = parse(fs.readFileSync(corePath)), coreReplacements = new Map();
const mapIds = [318, 484, 486, 494, 497];
appendXml(core, coreReplacements, 'com.robot.core.manager.map.config.MapConfig_xmlCls', 'maps.xml', 'Maps', 'map', mapIds);
appendXml(core, coreReplacements, 'com.robot.core.config.xml.SuperMapXMLInfo_xmlClass', 'super-maps.xml', 'superMaps', 'maps', [41, 42, 43, 318]);
appendXml(core, coreReplacements, 'com.robot.core.config.xml.MapIntroXMLInfo_xmlClass', 'map-intro.xml', 'map', 'map', mapIds);
const laboratoryTag = uniqueTag(core, tag => tag.code === 82 && tag.name === laboratoryKey, laboratoryKey);
coreReplacements.set(laboratoryTag, compileClass(corePath,
  path.join(root, 'compat/client-patches/acquisition-restoration/MapProcess_5.as'), laboratoryKey, 'laboratory'));
const galaxy = parse(fs.readFileSync(galaxyPath)), galaxyReplacements = new Map();
const galaxyTag = uniqueTag(galaxy, tag => tag.code === 82, 'Galaxy_4 ABC container');
compileClass(galaxyPath, path.join(patch, 'Galaxy_4.as'), galaxyKey, 'galaxy', galaxyTag.name);
const compiler = path.join(out, 'compiler/galaxy');
const exportedXml = path.join(compiler, 'export.xml'), ownedXml = path.join(compiler, 'owned.xml');
const ownedSwf = path.join(compiler, 'owned.swf'), cleanedSwf = path.join(compiler, 'cleaned.swf');
const javaArgs = ['-Djava.awt.headless=true', '-jar', values.ffdec];
execFileSync(values.java, [...javaArgs, '-swf2xml', path.join(compiler, 'compiled.swf'), exportedXml],
  {stdio: 'inherit', timeout: 120000});
execFileSync('python3', [path.join(root, 'scripts/prune-fourth-galaxy-module.py'), exportedXml, ownedXml],
  {stdio: 'inherit', timeout: 120000});
execFileSync(values.java, [...javaArgs, '-xml2swf', ownedXml, ownedSwf], {stdio: 'inherit', timeout: 120000});
execFileSync(values.java, [...javaArgs, '-abcclean', ownedSwf, cleanedSwf], {stdio: 'inherit', timeout: 120000});
const cleaned = parse(fs.readFileSync(cleanedSwf));
galaxyReplacements.set(galaxyTag, uniqueTag(cleaned, tag => tag.code === 82, 'cleaned Galaxy_4 ABC').raw);
galaxyReplacements.set(uniqueTag(galaxy, tag => tag.code === 76, 'original Galaxy_4 symbols'),
  uniqueTag(cleaned, tag => tag.code === 76, 'cleaned Galaxy_4 symbols').raw);
const coreBytes = encode(core, coreReplacements), galaxyBytes = encode(galaxy, galaxyReplacements);
const files = [];
function put(relative, bytes) {
  const previous = fs.readFileSync(path.join(baseline, relative));
  if (relative !== coreRelative) check(previous.equals(galaxy.raw), 'Galaxy overlay differs from assets; resolve baseline first');
  const target = path.join(out, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, bytes);
  files.push({path: relative, before: sha(previous), after: sha(bytes)});
}
put(coreRelative, coreBytes);
put('client/assets/' + galaxyRelative, galaxyBytes);
put('client/overlay/' + galaxyRelative, galaxyBytes);
const manifest = {files, mapIds, changedNativeClasses: [laboratoryKey, galaxyKey],
  changedEmbeddedTables: ['MapConfig/MapXMLInfo', 'SuperMapXMLInfo', 'MapIntroXMLInfo'], unrelatedNativeTagsPreserved: true,
  moduleUsesSharedCore: true, serverFilesChanged: false, noDatabaseMigration: true};
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
