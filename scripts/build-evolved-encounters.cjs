'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const util = require('node:util');
const {parseArgs} = require('node:util');
const names = ['baseline', 'out'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw Error('Missing --' + name);
const root = path.resolve(__dirname, '..');
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw Error(message); };
const plan = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/evolved-encounters/evolved-additions.json'), 'utf8'));
const relative = 'app/config/data/json/map-ogres.json';
const text = fs.readFileSync(path.join(baseline, relative), 'utf8');

// Shiny entries keep R25's rule: each fixed shiny is about 5% of its map pool.
const SHINY_SHARE = 0.05;
function apply(maps) {
  const pool = id => { check(maps[id], 'Missing map pool ' + id); return maps[id].ogres; };
  const templates = plan.dexAdditions.map(x => {
    const template = pool(x.mapId).find(o => o.petId === x.copyOf);
    check(template, `Missing family entry ${x.mapId}/${x.copyOf}`);
    return structuredClone(template);
  });
  for (const r of plan.remove) {
    const index = pool(r.mapId).findIndex(o => o.petId === r.petId);
    check(index >= 0, `Missing entry to remove ${r.mapId}/${r.petId}`);
    pool(r.mapId).splice(index, 1);
  }
  for (const w of plan.baseWeights) {
    const entry = pool(w.mapId).find(o => o.petId === w.petId);
    check(entry && entry.weight === w.from, `Base weight changed since planning ${w.mapId}/${w.petId}`);
    entry.weight = w.to;
  }
  const append = (mapId, entry) => {
    const ogres = pool(mapId);
    check(!ogres.some(o => o.petId === entry.petId), `Encounter already exists ${mapId}/${entry.petId}`);
    ogres.push({...entry, slot: Math.max(-1, ...ogres.map(o => o.slot)) + 1});
  };
  for (const x of plan.restore) append(x.mapId, structuredClone(x.entry));
  plan.dexAdditions.forEach((x, index) => append(x.mapId, {...templates[index], ...x.entry,
    dropItems: templates[index].dropItems.filter(drop => drop.itemId === 300001)}));
  for (const mapId of touched) {
    const ogres = pool(mapId), shinies = ogres.filter(o => o.shiny);
    if (!shinies.length) continue;
    const normal = ogres.filter(o => !o.shiny).reduce((sum, o) => sum + o.weight, 0);
    const weight = Math.round(SHINY_SHARE * normal / (1 - SHINY_SHARE * shinies.length) * 100) / 100;
    for (const shiny of shinies) shiny.weight = weight;
  }
}
const touched = [...new Set([...plan.remove, ...plan.baseWeights, ...plan.restore, ...plan.dexAdditions].map(x => String(x.mapId)))];
const expected = JSON.parse(text);
apply(expected.maps);

function mapBlock(source, mapId) {
  const key = `\n    "${mapId}": {`;
  const at = source.indexOf(key);
  check(at >= 0 && source.indexOf(key, at + 1) < 0, 'Expected one map pool ' + mapId);
  const start = at + key.length - 1;
  let depth = 0, index = start;
  for (; index < source.length; index++) {
    if (source[index] === '{') depth++;
    else if (source[index] === '}' && --depth === 0) break;
  }
  return {start, end: index + 1};
}
const render = value => JSON.stringify(value, null, 2).split('\n').join('\n    ');
let result = text;
const original = JSON.parse(text).maps;
for (const mapId of touched) {
  const block = mapBlock(result, mapId);
  check(render(original[mapId]) === result.slice(block.start, block.end), 'Map pool formatting changed: ' + mapId);
  result = result.slice(0, block.start) + render(expected.maps[mapId]) + result.slice(block.end);
}
check(util.isDeepStrictEqual(JSON.parse(result), expected), 'Unexpected encounter changes');
const target = path.join(out, relative);
fs.mkdirSync(path.dirname(target), {recursive: true});
fs.writeFileSync(target, result);
const manifest = {files: [{path: relative, before: sha(Buffer.from(text)), after: sha(Buffer.from(result))}], restartGame: true,
  noDatabaseMigration: true, maps: touched.length, restored: plan.restore.length, dexAdditions: plan.dexAdditions.length,
  baseWeights: plan.baseWeights.length, removed: plan.remove.length};
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
