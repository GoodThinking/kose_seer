'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');

const {values} = parseArgs({options: Object.fromEntries(['baseline', 'out', 'java', 'ffdec'].map(name => [name, {type: 'string'}]))});
for (const name of ['baseline', 'out', 'java', 'ffdec']) assert.ok(values[name], 'Missing --' + name);
const base = path.resolve(values.baseline), out = path.resolve(values.out), root = path.resolve(__dirname, '..');
assert.ok(!fs.existsSync(out), 'Choose a fresh output directory');
const read = relative => fs.readFileSync(path.join(base, relative));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const decode = value => value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
  const named = {'&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>'};
  return named[entity] ?? String.fromCodePoint(entity[2].toLowerCase() === 'x' ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10));
});
const attrs = text => Object.fromEntries([...text.matchAll(/([\w:.-]+)="([^"]*)"/g)].map(m => [m[1], decode(m[2])]));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function catalog(text) {
  const result = new Map();
  for (const match of text.matchAll(/<Item\b[^>]*>/g)) {
    const item = attrs(match[0]), id = Number(item.ID);
    assert.ok(Number.isSafeInteger(id) && id > 0 && !result.has(id), 'Invalid or duplicate item ID: ' + item.ID);
    result.set(id, item);
  }
  return result;
}
function parse(raw) {
  assert.equal(raw.subarray(0, 3).toString(), 'CWS', 'Expected compressed SWF');
  const body = zlib.inflateSync(raw.subarray(8));
  assert.equal(body.length + 8, raw.readUInt32LE(4));
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6; let length = short & 63;
    if (length === 63) { length = body.readUInt32LE(offset); offset += 4; }
    assert.ok(offset + length <= body.length, 'Truncated SWF tag');
    const data = body.subarray(offset, offset + length); offset += length;
    const end = code === 82 ? data.indexOf(0, 4) : -1;
    if (code === 82) assert.ok(end >= 4, 'Invalid ABC name');
    tags.push({code, data, name: code === 82 ? data.subarray(4, end).toString() : null, raw: body.subarray(start, offset)});
    if (code === 0) break;
  }
  assert.equal(offset, body.length);
  assert.equal(tags.at(-1)?.code, 0);
  return {prefix: raw.subarray(0, 8), header, tags};
}
function encode(movie, tags) {
  const body = Buffer.concat([movie.header, ...tags.map(tag => tag.raw)]), prefix = Buffer.from(movie.prefix);
  prefix.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([prefix, zlib.deflateSync(body)]);
}
function makeTag(code, data) {
  const header = Buffer.alloc(6); header.writeUInt16LE((code << 6) | 63); header.writeUInt32LE(data.length, 2);
  return {code, data, raw: Buffer.concat([header, data])};
}
function symbolId(movie, target) {
  const matches = [];
  for (const tag of movie.tags.filter(t => t.code === 76)) {
    const data = tag.data; let offset = 2;
    assert.ok(data.length >= 2);
    for (let i = 0, count = data.readUInt16LE(0); i < count; i++) {
      assert.ok(offset + 2 <= data.length);
      const id = data.readUInt16LE(offset); offset += 2;
      const end = data.indexOf(0, offset); assert.ok(end >= 0);
      if (data.subarray(offset, end).toString() === target) matches.push(id);
      offset = end + 1;
    }
    assert.equal(offset, data.length);
  }
  assert.equal(matches.length, 1, 'Expected unique ItemXMLInfo symbol');
  return matches[0];
}
function compile(movie, source, name, context, dir) {
  const folder = path.join(temp, dir), imports = path.join(folder, 'import');
  const sourcePath = path.join(imports, 'scripts', name + '.as');
  fs.mkdirSync(path.dirname(sourcePath), {recursive: true}); fs.writeFileSync(sourcePath, source);
  const target = movie.tags.filter(tag => tag.code === 82 && (context || tag.name === name));
  assert.equal(target.length, 1, 'Expected unique target ABC: ' + name);
  const libraries = context ? context.tags.filter(tag => tag.code === 82) : [];
  assert.ok(!libraries.some(tag => tag.name === target[0].name), 'Compiler library contains target ABC name');
  const tags = context ? movie.tags.flatMap(tag => tag === target[0] ? [...libraries, tag] : [tag]) : movie.tags;
  const index = tags.indexOf(target[0]), input = path.join(folder, 'input.swf'), output = path.join(folder, 'output.swf');
  fs.writeFileSync(input, encode(movie, tags));
  execFileSync(values.java, ['-Djava.awt.headless=true', '-jar', values.ffdec, '-onerror', 'abort', '-importScript', input, output, imports], {stdio: 'inherit', timeout: 240000});
  const compiled = parse(fs.readFileSync(output));
  assert.equal(compiled.tags.length, tags.length, 'Compiler changed tag count');
  assert.ok(compiled.header.equals(movie.header), 'Compiler changed SWF header');
  compiled.tags.forEach((tag, i) => { if (i !== index) assert.ok(tag.raw.equals(tags[i].raw), 'Compiler changed unrelated tag: ' + (tag.name || tag.code)); });
  const replacement = compiled.tags[index];
  assert.equal(replacement.name, target[0].name);
  assert.ok(!replacement.raw.equals(target[0].raw), 'Target ABC unchanged: ' + name);
  return movie.tags.map(tag => tag === target[0] ? replacement : tag);
}
function assertUnchanged(original, changed, exceptions) {
  assert.ok(changed.header.equals(original.header));
  assert.equal(changed.tags.length, original.tags.length);
  original.tags.forEach((tag, index) => { if (!exceptions.has(index)) assert.ok(changed.tags[index].raw.equals(tag.raw), 'Unexpected tag change at ' + index); });
}
const routes = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/pet-acquisition/boss-routes.json'), 'utf8'));
const {newBosses, newEssences} = routes;
assert.equal(newBosses.length, 37); assert.equal(newEssences.length, 9);
const serverItems = catalog(read('app/config/data/xml/items.xml').toString('utf8'));
const ids = [...serverItems.values()].filter(item => {
  const id = Number(item.ID), pet = Number(item.BreedMonID), level = Number(item.BreedMonLv), time = Number(item.BreedTime);
  return Number.isSafeInteger(id) && id > 0 && Number.isInteger(pet) && pet > 0 && Number.isInteger(level) && level > 0 && level <= 100 && time > 0;
}).map(item => Number(item.ID)).sort((a, b) => a - b);
assert.ok(ids.length > 0, 'No valid hatching metadata');
const newIds = new Set();
for (const item of newEssences) {
  const id = Number(item.ID), server = serverItems.get(id);
  assert.ok(Number.isSafeInteger(id) && !newIds.has(id) && server && ids.includes(id), 'Invalid new essence: ' + item.ID);
  newIds.add(id);
  for (const [key, value] of Object.entries(item)) assert.equal(server[key], String(value), 'Server metadata mismatch: ' + id + ' ' + key);
}
const corePath = 'client/assets/dll/NieoCore.swf', overlayCorePath = 'client/overlay/dll/NieoCore.swf';
const coreBytes = read(corePath), overlayCoreBytes = read(overlayCorePath);
assert.ok(coreBytes.equals(overlayCoreBytes), 'Core routes differ');
const core = parse(coreBytes), itemId = symbolId(core, 'com.robot.core.config.xml.ItemXMLInfo_xmlClass');
const binaries = core.tags.map((tag, i) => tag.code === 87 && tag.data.length >= 6 && tag.data.readUInt16LE(0) === itemId ? i : -1).filter(i => i >= 0);
assert.equal(binaries.length, 1, 'Expected unique ItemXMLInfo binary');
const binaryIndex = binaries[0], binary = core.tags[binaryIndex], clientText = binary.data.subarray(6).toString('utf8');
const clientItems = catalog(clientText);
for (const id of newIds) assert.ok(!clientItems.has(id), 'Client already contains new essence: ' + id);
let categoryCount = 0;
const updatedText = clientText.replace(/(<Cat\b[^>]*\bID="4"[^>]*>)([\s\S]*?)(<\/Cat>)/g, (_, open, body, close) => {
  categoryCount++;
  return open + body + newEssences.map(item => '        <Item ' + Object.entries(item).map(([key, value]) => key + '="' + escape(value) + '"').join(' ') + '/>\n').join('') + '    ' + close;
});
assert.equal(categoryCount, 1, 'Expected unique client collection category');
const appendedItems = catalog(updatedText);
for (const item of newEssences) for (const [key, value] of Object.entries(item)) assert.equal(appendedItems.get(Number(item.ID))[key], String(value));
const replacementBinary = makeTag(87, Buffer.concat([binary.data.subarray(0, 6), Buffer.from(updatedText, 'utf8')]));
const ogreId = symbolId(core, 'com.robot.core.config.xml.OgreXMLInfo_xmlClass');
const ogreBinaries = core.tags.map((tag, i) => tag.code === 87 && tag.data.length >= 6 && tag.data.readUInt16LE(0) === ogreId ? i : -1).filter(i => i >= 0);
assert.equal(ogreBinaries.length, 1, 'Expected unique OgreXMLInfo binary');
const ogreIndex = ogreBinaries[0], ogreBinary = core.tags[ogreIndex], ogreText = ogreBinary.data.subarray(6).toString('utf8');
const mapConfigId = symbolId(core, 'com.robot.core.manager.map.config.MapConfig_xmlCls');
const mapConfigs = core.tags.filter(tag => tag.code === 87 && tag.data.length >= 6 && tag.data.readUInt16LE(0) === mapConfigId);
assert.equal(mapConfigs.length, 1, 'Expected unique MapConfig binary');
const mapConfigText = mapConfigs[0].data.subarray(6).toString('utf8').replace(/<!--[\s\S]*?-->/g, '');
const registeredMaps = new Set([...mapConfigText.matchAll(/<map\b[^>]*>/g)].map(match => Number(attrs(match[0]).id)));
const positions = routes.bossPositions;
assert.ok(Array.isArray(positions) && positions.length === newBosses.length, 'Missing reviewed boss positions');
const bossKeys = new Set(newBosses.map(boss => boss.mapId + '/' + boss.param2));
assert.equal(bossKeys.size, newBosses.length, 'Duplicate boss map and region');
const positionKeys = new Set();
const ogreSections = [...ogreText.matchAll(/<ogre\b[^>]*>([\s\S]*?)<\/ogre>/g)];
assert.equal(ogreSections.length, 1, 'Expected unique OgreXML wild section');
const wildPoints = new Map();
for (const match of ogreSections[0][1].matchAll(/<item\b[^>]*>/g)) {
  const item = attrs(match[0]), id = Number(item.id);
  if (wildPoints.has(id)) assert.equal(wildPoints.get(id).join('|'), item.pList || '', 'Conflicting wild map: ' + id);
  else wildPoints.set(id, (item.pList || '').split('|'));
}
let updatedOgre = ogreText;
for (const position of positions) {
  const {mapId, region, x, y} = position, key = mapId + '/' + region;
  assert.ok(Number.isSafeInteger(mapId) && Number.isSafeInteger(region) && Number.isSafeInteger(x) && Number.isSafeInteger(y) && x >= 0 && y >= 0 && bossKeys.has(key) && !positionKeys.has(key), 'Invalid reviewed boss position: ' + key);
  positionKeys.add(key);
  assert.ok(registeredMaps.has(mapId), 'Boss map missing from Core MapConfig: ' + mapId);
  assert.equal(wildPoints.get(mapId)?.[region], position.baselinePoint ?? x + ',' + y, 'Boss position baseline differs from current wild map: ' + key);
  let count = 0;
  updatedOgre = updatedOgre.replace(/(<boss\b[^>]*>)([\s\S]*?)(<\/boss>)/g, (_, open, body, close) => {
    count++;
    let found = 0;
    const itemPattern = /<item\b[^>]*>[\s\S]*?<\/item>/g;
    body = body.replace(itemPattern, item => {
      const start = item.match(/^<item\b[^>]*>/);
      if (Number(attrs(start[0]).id) !== mapId) return item;
      found++;
      for (const match of item.matchAll(/<region\b[^>]*>/g)) assert.notEqual(Number(attrs(match[0]).id), region, 'Boss position already exists: ' + key);
      return item.replace('</item>', '  <region id="' + region + '" pList="' + x + ',' + y + '"></region>\n    </item>');
    });
    assert.ok(found <= 1, 'Duplicate boss map: ' + mapId);
    if (!found) body += '\n    <item id="' + mapId + '"><region id="' + region + '" pList="' + x + ',' + y + '"></region></item>\n  ';
    return open + body + close;
  });
  assert.equal(count, 1, 'Expected unique OgreXML boss section');
}
const replacementOgre = makeTag(87, Buffer.concat([ogreBinary.data.subarray(0, 6), Buffer.from(updatedOgre, 'utf8')]));
const managerName = 'com/robot/app/fightNote/FightInviteManager';
let managerSource = fs.readFileSync(path.join(root, 'compat/client-patches/boss-locks/FightInviteManager.as'), 'utf8');
const hintMatch = managerSource.match(/private static const BOSS_HINTS:Object = (\{[^\n]*\});/);
assert.ok(hintMatch, 'Missing BOSS_HINTS literal');
const existingHints = JSON.parse(hintMatch[1]), hints = {};
for (const boss of newBosses) {
  const key = boss.mapId + '/' + boss.param2, reward = Number(boss.spt?.rewardItemId);
  assert.ok(Number.isInteger(boss.mapId) && Number.isInteger(boss.param2) && typeof boss.hint === 'string' && boss.hint.length && !Object.hasOwn(existingHints, key) && !Object.hasOwn(hints, key), 'Invalid or occupied boss hint: ' + key);
  assert.ok(serverItems.has(reward) && ids.includes(reward), 'Invalid boss reward: ' + reward);
  hints[key] = boss.hint;
}
const hintSuffix = Object.entries(hints).map(([key, hint]) => ',' + JSON.stringify(key) + ':' + JSON.stringify(hint)).join('');
managerSource = managerSource.replace(hintMatch[0], hintMatch[0].slice(0, -2) + hintSuffix + '};');
const panelPath = 'client/overlay/module/com/robot/module/app/MoleculePanel.swf', panelBytes = read(panelPath), panel = parse(panelBytes);
const panelName = 'com/robot/module/app/MoleculePanel';
let panelSource = fs.readFileSync(path.join(root, 'compat/client-patches/essence-hatching/MoleculePanel.as'), 'utf8');
const marker = 'private var _needA:Array = [];';
assert.equal(panelSource.split(marker).length, 2, 'Expected unique hatch catalog marker');
panelSource = panelSource.replace(marker, 'private var _needA:Array = ' + JSON.stringify(ids) + ';');
const genericPath = 'client/assets/resource/item/doodle/icon/400051.swf', generic = read(genericPath);
const reused = [...new Set(newBosses.map(boss => Number(boss.spt.rewardItemId)).filter(id => !newIds.has(id)))];
assert.equal(reused.length, 28, 'Expected 28 reused essence icons');
// This configured legacy essence has no icon in either captured production route.
const missingLegacyIcons = new Set([400452]);
const reusedIcons = reused.map(id => {
  const relative = ['client/overlay/resource/item/doodle/icon/', 'client/assets/resource/item/doodle/icon/'].map(prefix => prefix + id + '.swf').find(p => fs.existsSync(path.join(base, p)));
  assert.ok(relative || missingLegacyIcons.has(id), 'Missing reused essence icon: ' + id);
  return relative ? {id, path: relative, sha256: sha(read(relative))} : {id, path: genericPath, sha256: sha(generic), genericReplacement: true};
});
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'acquisition-essences-'));
try {
  const managerIndex = core.tags.findIndex(tag => tag.code === 82 && tag.name === managerName);
  assert.ok(managerIndex >= 0, 'Missing FightInviteManager ABC');
  const compiledTags = compile(core, managerSource, managerName, null, 'manager');
  compiledTags[binaryIndex] = replacementBinary;
  compiledTags[ogreIndex] = replacementOgre;
  const newCore = encode(core, compiledTags), checkedCore = parse(newCore);
  assertUnchanged(core, checkedCore, new Set([binaryIndex, ogreIndex, managerIndex]));
  const panelTags = compile(panel, panelSource, panelName, checkedCore, 'panel');
  const newPanel = encode(panel, panelTags), checkedPanel = parse(newPanel);
  const panelIndex = panel.tags.findIndex(tag => tag.code === 82);
  assertUnchanged(panel, checkedPanel, new Set([panelIndex]));
  const files = [];
  function put(relative, bytes, before) {
    const destination = path.join(out, relative); fs.mkdirSync(path.dirname(destination), {recursive: true}); fs.writeFileSync(destination, bytes);
    files.push({path: relative, before: before === null ? null : sha(before), after: sha(bytes)});
  }
  put(corePath, newCore, coreBytes); put(overlayCorePath, newCore, overlayCoreBytes); put(panelPath, newPanel, panelBytes);
  for (const id of [...newIds,...reusedIcons.filter(icon => icon.genericReplacement).map(icon => icon.id)]) {
    const relative = 'client/overlay/resource/item/doodle/icon/' + id + '.swf';
    assert.ok(!fs.existsSync(path.join(base, relative)) && !fs.existsSync(path.join(base, 'client/assets/resource/item/doodle/icon/' + id + '.swf')), 'New essence icon already exists: ' + id);
    put(relative, generic, null);
  }
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, itemSymbolId: itemId, ogreSymbolId: ogreId, bossPositions: positions, newEssenceIds: [...newIds], hatchIds: ids, bossHintKeys: Object.keys(hints), genericIcon: {path: genericPath, sha256: sha(generic)}, reusedIcons}, null, 2) + '\n');
} finally {
  fs.rmSync(temp, {recursive: true, force: true});
}
