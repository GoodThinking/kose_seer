'use strict';
const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const { values } = require('node:util').parseArgs({ options: { baseline: { type: 'string' }, out: { type: 'string' } } });
for (const key of ['baseline', 'out']) assert.ok(values[key], 'Missing --' + key);
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
assert.ok(!fs.existsSync(out), 'Choose a fresh output directory');
const paths = ['client/overlay/dll/NieoCore.swf', 'client/assets/dll/NieoCore.swf'];
const original = fs.readFileSync(path.join(baseline, paths[0]));
assert.ok(original.equals(fs.readFileSync(path.join(baseline, paths[1]))), 'Core paths differ; reconcile baseline first');
assert.equal(original.subarray(0, 3).toString(), 'CWS');
const body = zlib.inflateSync(original.subarray(8));
assert.equal(body.length + 8, original.readUInt32LE(4));
let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
const header = body.subarray(0, offset), tags = [];
while (offset < body.length) {
  const start = offset, short = body.readUInt16LE(offset); offset += 2;
  const code = short >> 6; let length = short & 63;
  if (length === 63) { length = body.readUInt32LE(offset); offset += 4; }
  assert.ok(offset + length <= body.length, 'Truncated SWF tag');
  const payload = body.subarray(offset, offset + length); offset += length;
  tags.push({ code, payload, raw: body.subarray(start, offset) });
  if (code === 0) break;
}
assert.equal(offset, body.length);
const ids = [];
for (const tag of tags.filter(tag => tag.code === 76)) {
  let at = 2;
  for (let i = 0; i < tag.payload.readUInt16LE(0); i++) {
    const id = tag.payload.readUInt16LE(at); at += 2;
    const end = tag.payload.indexOf(0, at); assert.ok(end >= at);
    if (tag.payload.subarray(at, end).toString() === 'com.robot.core.manager.map.config.MapConfig_xmlCls') ids.push(id);
    at = end + 1;
  }
}
assert.equal(ids.length, 1, 'Expected one MapConfig symbol');
const tables = tags.filter(tag => tag.code === 87 && tag.payload.readUInt16LE(0) === ids[0]);
assert.equal(tables.length, 1, 'Expected one MapConfig table');
const table = tables[0], xml = table.payload.subarray(6).toString('utf8');
const map = xml.match(/<map\b[^>]*\bid="315"[\s\S]*?<\/map>/g);
assert.equal(map?.length, 1, 'Expected one mystery-space map');
const disabled = '<!-- <component name="door_1" hit="comp_1" targetID="316" /> -->';
const enabled = '<component name="door_1" hit="comp_1" targetID="316" />';
assert.equal(map[0].split(disabled).length, 2, 'Mystery-space door changed; reconcile first');
const nextXml = xml.replace(map[0], map[0].replace(disabled, enabled));
const payload = Buffer.concat([table.payload.subarray(0, 6), Buffer.from(nextXml, 'utf8')]);
const tagHeader = Buffer.alloc(6); tagHeader.writeUInt16LE((87 << 6) | 63); tagHeader.writeUInt32LE(payload.length, 2);
const nextBody = Buffer.concat([header, ...tags.map(tag => tag === table ? Buffer.concat([tagHeader, payload]) : tag.raw)]);
const swfHeader = Buffer.from(original.subarray(0, 8)); swfHeader.writeUInt32LE(nextBody.length + 8, 4);
const bytes = Buffer.concat([swfHeader, zlib.deflateSync(nextBody)]);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const files = paths.map(relative => {
  const destination = path.join(out, relative); fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes);
  return { path: relative, before: sha(original), after: sha(bytes) };
});
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ files, changedTag: { code: 87, characterId: ids[0] },
  unchangedTags: tags.length - 1, changedClasses: [], route: { from: 315, to: 316, component: 'door_1' },
  restartGame: false, restartWeb: false, migration: null, playerDataMigration: false }, null, 2) + '\n');
console.log(JSON.stringify({ files: files.length, unchangedTags: tags.length - 1, changedClasses: 0, route: '315 -> 316', out }));
