'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {parseArgs} = require('node:util');
const names = ['context', 'baseline', 'out'];
const {values} = parseArgs({options: Object.fromEntries(names.map(name => [name, {type: 'string'}]))});
for (const name of names) if (!values[name]) throw Error('Missing --' + name);
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
const ts = require(path.join(path.resolve(values.context), 'node_modules/typescript'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw Error(message); };
const target = 'GameServer/Game/Map/MapSpawnManager';
// The deployed dist carries later station-boss patches; both files are edited in place, never rebuilt from src.
const expected = {
  ['app/src/' + target + '.ts']: '6385ee55c398d051ab21e2e6f01bc4792d23fa773025d0837ad86b3f6aa9c9a0',
  ['app/dist/' + target + '.js']: '8beba15802677dad532f032f94371987ce3142f5792d055fc98c0dd346819ee7',
  ['app/dist/' + target + '.js.map']: 'd94d4a4113aec6ef7b20575aef4a4a9e7bbda3ce866768dc8b3e9cd40cc79c3e',
};
for (const [relative, hash] of Object.entries(expected)) {
  check(sha(fs.readFileSync(path.join(baseline, relative))) === hash, 'Unexpected spawn manager baseline: ' + relative);
}
const files = [];
function put(relative, bytes) {
  const file = path.join(out, relative);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, bytes);
  files.push({path: relative, before: sha(fs.readFileSync(path.join(baseline, relative))), after: sha(bytes)});
}
// A finished wild battle redraws the pool so evolved forms keep appearing; station bosses keep their HP.
const branch = {
  ts: `else {
  // A finished wild battle redraws the pool so evolved forms keep appearing; station bosses keep their HP.
  this._ogres = this.GenerateOgres(this._currentMapId);
  Logger.Info(\`[MapSpawnManager] 战斗结束，重新刷新野怪: userId=\${this.UserID}, mapId=\${this._currentMapId}, 野怪数量=\${this._ogres.length}\`);
}`,
  js: `else {
    // A finished wild battle redraws the pool so evolved forms keep appearing; station bosses keep their HP.
    this._ogres = this.GenerateOgres(this._currentMapId);
    Logger_1.Logger.Info(\`[MapSpawnManager] 战斗结束，重新刷新野怪: userId=\${this.UserID}, mapId=\${this._currentMapId}, 野怪数量=\${this._ogres.length}\`);
}`,
};
for (const [relative, kind] of [['app/src/' + target + '.ts', 'ts'], ['app/dist/' + target + '.js', 'js']]) {
  const lines = fs.readFileSync(path.join(baseline, relative), 'utf8').split('\n');
  const hits = lines.flatMap((line, index) => line.includes('this.OnEnterMap(this._currentMapId);') ? [index] : []);
  check(hits.length === 1 && lines[hits[0] + 1].trim() === '}', 'Unexpected battle-end refresh block: ' + relative);
  const at = hits[0] + 2, indent = lines[hits[0] + 1].match(/^\s*/)[0];
  const block = branch[kind].split('\n').map(line => indent + line);
  lines.splice(at, 0, ...block);
  const text = lines.join('\n');
  check(!ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true).parseDiagnostics.length, 'Invalid patched module: ' + relative);
  put(relative, text);
  if (kind === 'js') {
    const map = JSON.parse(fs.readFileSync(path.join(baseline, relative + '.map'), 'utf8'));
    const mappings = map.mappings.split(';');
    mappings.splice(at, 0, ...Array(block.length).fill(''));
    map.mappings = mappings.join(';');
    put(relative + '.map', JSON.stringify(map));
  }
}
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, noDatabaseMigration: true,
  behavior: 'every finished wild battle redraws the map ogres; bosses unchanged; empty map still re-enters'}, null, 2) + '\n');
console.log(JSON.stringify({files: files.length, out}));
