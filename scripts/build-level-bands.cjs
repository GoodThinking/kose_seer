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
const plan = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/level-bands/level-bands.json'), 'utf8'));
const relative = 'app/config/data/json/map-ogres.json';
const text = fs.readFileSync(path.join(baseline, relative), 'utf8');

// Each map is stretched from its planned range onto its band, keeping the order between entries.
function apply(maps) {
  for (const band of plan.bands) {
    check(band.min >= 1 && band.max <= 100 && band.min < band.max, 'Invalid band ' + band.name);
    for (const [mapId, [low, high]] of Object.entries(band.maps)) {
      const ogres = maps[mapId]?.ogres;
      check(ogres?.length && !ogres.some(o => o.isBoss), 'Unexpected pool ' + mapId);
      check(Math.min(...ogres.map(o => o.minLevel)) === low && Math.max(...ogres.map(o => o.maxLevel)) === high,
        `Map ${mapId} levels changed since planning`);
      const scale = level => high === low ? band.min : Math.round(band.min + (level - low) * (band.max - band.min) / (high - low));
      for (const ogre of ogres) {
        ogre.minLevel = high === low ? band.min : scale(ogre.minLevel);
        ogre.maxLevel = high === low ? band.max : scale(ogre.maxLevel);
        if (typeof ogre.level === 'number') ogre.level = scale(ogre.level);
        check(band.min <= ogre.minLevel && ogre.minLevel <= ogre.maxLevel && ogre.maxLevel <= band.max, `Level outside band ${mapId}/${ogre.petId}`);
      }
    }
  }
}
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
const original = JSON.parse(text).maps;
let result = text;
for (const mapId of plan.bands.flatMap(band => Object.keys(band.maps))) {
  const block = mapBlock(result, mapId);
  check(render(original[mapId]) === result.slice(block.start, block.end), 'Map pool formatting changed: ' + mapId);
  result = result.slice(0, block.start) + render(expected.maps[mapId]) + result.slice(block.end);
}
check(util.isDeepStrictEqual(JSON.parse(result), expected), 'Unexpected level changes');
const target = path.join(out, relative);
fs.mkdirSync(path.dirname(target), {recursive: true});
fs.writeFileSync(target, result);
const manifest = {files: [{path: relative, before: sha(Buffer.from(text)), after: sha(Buffer.from(result))}], restartGame: true,
  noDatabaseMigration: true, maps: plan.bands.reduce((n, band) => n + Object.keys(band.maps).length, 0)};
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest));
