'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {parseArgs} = require('node:util');

// Input: baseline and pinned repository resources. Output: a fresh sparse
// overlay plus manifest.json. No player files or baseline files are changed.
const root = path.resolve(__dirname, '..');
const resource = path.join(root, 'compat/client-resources/extended-species');
const spec = JSON.parse(fs.readFileSync(path.join(resource, 'manifest.json'), 'utf8'));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const checked = (file, expected) => { const b = fs.readFileSync(file); assert.equal(sha(b), expected, 'Unexpected hash: ' + file); return b; };
const once = (text, before, after) => { assert.equal(text.split(before).length, 2, 'Unexpected XML anchor: ' + before); return text.replace(before, after); };
const attrs = tag => Object.fromEntries([...tag.matchAll(/\b([\w]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
function record(xml, id) {
  const found = [...xml.matchAll(new RegExp('<Monster\\b(?=[^>]*\\bID="' + id + '")[^>]*>', 'g'))];
  assert.equal(found.length, 1, 'Expected exactly one Monster ' + id);
  return found[0][0];
}
function changeStats(xml, native) {
  for (const entry of spec.assets) {
    const tag = record(xml, entry.id), a = attrs(tag);
    assert.equal(a.DefName, entry.name, 'Species identity mismatch ' + entry.id);
    let next = tag;
    if (entry.id === 1632) {
      assert.equal(a.HP, ''); assert.equal(a.ATK, '72'); assert.equal(a.Def, '40'); assert.equal(a.Atk, undefined);
      next = once(next, 'HP=""', 'HP="72"');
      next = once(next, 'ATK="72"', 'Atk="40"');
      next = once(next, 'Def="40"', 'Def="46"');
    } else if (entry.id === 1633) {
      assert.equal(a.ATK, '80'); assert.equal(a.Atk, undefined);
      next = once(next, 'ATK="80"', 'Atk="80"');
    } else if (entry.id === 2470) {
      const old = native ? ['132','122','100','75','98','113'] : ['70','80','44','50','43','75'];
      const wanted = ['70','80','44','50','43','75'];
      ['HP','Atk','Def','SpAtk','SpDef','Spd'].forEach((key, i) => {
        assert.equal(a[key], old[i], 'Unexpected 2470 ' + key);
        if (old[i] !== wanted[i]) next = once(next, key + '="' + old[i] + '"', key + '="' + wanted[i] + '"');
      });
      if (native) {
        assert.equal(a.EvolvesFrom, '0');
        next = once(next, 'EvolvesTo="125"', 'EvolvesTo="0"');
        next = once(next, 'EvolvingLv="50"', 'EvolvingLv="0"');
      } else {
        for (const key of ['EvolvesFrom','EvolvesTo','EvolvingLv']) assert.equal(a[key], undefined, 'Unexpected server 2470 evolution');
      }
    }
    if (next !== tag) xml = once(xml, tag, next);
  }
  return xml;
}
function parseSwf(raw) {
  assert.equal(raw.subarray(0, 3).toString('ascii'), 'CWS');
  const body = zlib.inflateSync(raw.subarray(8));
  assert.equal(body.length + 8, raw.readUInt32LE(4));
  let p = Math.ceil ( (5 + (body[0] >> 3) * 4) / 8 ) + 4;
  const header = body.subarray(0, p), tags = [];
  while (p < body.length) {
    const start = p, h = body.readUInt16LE(p); p += 2;
    const code = h >> 6; let len = h & 63;
    if (len === 63) { len = body.readUInt32LE(p); p += 4; }
    assert.ok(p + len <= body.length, 'Truncated SWF tag');
    const payload = body.subarray(p, p + len); p += len;
    tags.push({code, payload, raw: body.subarray(start, p)});
    if (code === 0) break;
  }
  assert.equal(p, body.length);
  return {raw, header, tags};
}
function xmlRecord(swf, symbol) {
  const ids = [];
  for (const t of swf.tags.filter(t => t.code === 76)) {
    let p = 2;
    for (let i = 0; i < t.payload.readUInt16LE(0); i++) {
      const id = t.payload.readUInt16LE(p); p += 2;
      const end = t.payload.indexOf(0, p); assert.ok(end >= p);
      if (t.payload.subarray(p, end).toString('utf8') === symbol) ids.push(id);
      p = end + 1;
    }
  }
  assert.equal(ids.length, 1, 'Expected one symbol ' + symbol);
  const tags = swf.tags.filter(t => t.code === 87 && t.payload.readUInt16LE(0) === ids[0]);
  assert.equal(tags.length, 1, 'Expected one XML tag ' + symbol);
  return tags[0];
}
function xmlTag(swf, symbol, expected, transform) {
  const old = xmlRecord(swf, symbol);
  assert.equal(sha(old.payload.subarray(6)), expected, 'Unexpected XML payload: ' + symbol);
  const payload = Buffer.concat([old.payload.subarray(0, 6), Buffer.from(transform(old.payload.subarray(6).toString('utf8')))]);
  const h = Buffer.alloc(6); h.writeUInt16LE((87 << 6) | 63); h.writeUInt32LE(payload.length, 2);
  swf.tags[swf.tags.indexOf(old)] = {code: 87, payload, raw: Buffer.concat([h, payload])};
}
function encodeSwf(swf) {
  const body = Buffer.concat([swf.header, ...swf.tags.map(t => t.raw)]), h = Buffer.from(swf.raw.subarray(0, 8));
  h.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([h, zlib.deflateSync(body)]);
}
function build({baseline, out}) {
  baseline = path.resolve(baseline); out = path.resolve(out);
  assert.ok(!fs.existsSync(out), 'Choose a fresh output directory');
  assert.ok(out !== baseline && !out.startsWith(baseline + path.sep) && !baseline.startsWith(out + path.sep), 'Output and baseline must be separate');
  const petsRel = 'app/config/data/xml/pets.xml', corePaths = ['client/assets/dll/NieoCore.swf', 'client/overlay/dll/NieoCore.swf'];
  const pets = checked(path.join(baseline, petsRel), spec.baseline.petsSha256).toString('utf8');
  const sptRel = 'app/config/data/xml/spt.xml';
  const spt = checked(path.join(baseline, sptRel), spec.baseline.sptSha256).toString('utf8');
  const core = fs.readFileSync(path.join(baseline, corePaths[0]));
  assert.ok(core.equals(fs.readFileSync(path.join(baseline, corePaths[1]))), 'Effective Core copies differ');
  const swf = parseSwf(core), files = [], assetStatus = [];
  const output = [];
  const queue = (rel, bytes) => {
    const before = path.join(baseline, rel);
    output.push([rel, Buffer.from(bytes)]);
    files.push({path: rel, before: fs.existsSync(before) ? sha(fs.readFileSync(before)) : null, after: sha(Buffer.from(bytes))});
  };
  queue(petsRel, changeStats(pets, false));
  queue(sptRel, changeStats(spt, false));
  xmlTag(swf, 'com.robot.core.config.xml.PetXMLInfo_xmlClass', spec.baseline.petXmlSha256, xml => {
    xml = changeStats(xml, true);
    const tag = record(xml, 2209), child = record(xml, 2210);
    assert.equal(attrs(tag).EvolvesTo, '2209');
    assert.equal(attrs(tag).EvolvingLv, '35');
    assert.equal(attrs(child).EvolvesFrom, '2209');
    return once(xml, tag, once(tag, 'EvolvesTo="2209"', 'EvolvesTo="2210"'));
  });
  xmlTag(swf, 'com.robot.core.config.xml.PetBookXMLInfo_xmlClass', spec.baseline.petBookXmlSha256, xml => {
    const added = [];
    for (const entry of spec.assets) {
      assert.ok(!new RegExp('<Monster\\b(?=[^>]*\\bID="' + entry.id + '")').test(xml), 'Existing book record ' + entry.id);
      let tag = spec.officialBookTags[entry.id];
      assert.ok(typeof tag === 'string' && attrs(tag).ID === String(entry.id) && attrs(tag).Features, 'Invalid official book record ' + entry.id);
      assert.equal(attrs(tag).DefName, entry.id === 2470 ? '萨罗徳' : entry.name);
      if (entry.id === 2470) tag = once(tag, 'DefName="萨罗徳"', 'DefName="萨罗德"');
      // Official locations are not mapped to a known open location in this universe.
      tag = tag.replace(/\s+mapID="[^"]*"/, ' mapID="0"').replace(/\s+jumptarget="[^"]*"/g, '').replace(/\s+Target="[^"]*"/g, '');
      added.push(tag);
    }
    return once(xml, '</root>', added.join('\n') + '\n</root>');
  });
  const coreOut = encodeSwf(swf); for (const rel of corePaths) queue(rel, coreOut);
  for (const entry of spec.assets) {
    const rel = 'client/overlay/resource/pet/head/' + entry.id + '.swf';
    const head = checked(path.join(resource, 'resource/pet/head', entry.id + '.swf'), entry.head);
    queue(rel, head);
    const retained = {};
    for (const [kind, dir] of [['follow','groupFightResource/pet'], ['battle','fightResource/pet/swf']]) {
      const candidate = checked(path.join(resource, 'resource', dir, entry.id + '.swf'), entry[kind]);
      const paths = ['client/overlay/resource/', 'client/assets/resource/'].map(prefix => prefix + dir + '/' + entry.id + '.swf');
      const present = paths.filter(p => fs.existsSync(path.join(baseline, p)));
      for (const p of present) checked(path.join(baseline, p), entry[kind]);
      if (present.length) {
        retained[kind] = {sha256: entry[kind], status: 'baseline_files_verified_and_untouched', paths: present};
      } else {
        // Install the verified official resource when the baseline snapshot lacks it.
        const target = paths[0];
        queue(target, candidate);
        retained[kind] = {sha256: entry[kind], status: 'official_candidate_installed_static_only', paths: [target]};
      }
    }
    assetStatus.push({id: entry.id, head: {sha256: entry.head, status: 'installed_static_only', path: rel}, ...retained});
  }
  const report = {status: 'static_overlay_only', input: {baseline, officialSource: spec.officialSource}, files, assets: assetStatus, limitations: ['No capture, evolution or dex runtime validation.', 'Fourteen custom species remain blocked, including missing native definitions.', 'Intermediate overlay has native 2209 evolution fixed but server evolution remains unchanged. Run the existing content stage before release to patch server 2209 and 100004. Native 100004 and 100005 definitions are absent.']};
  fs.mkdirSync(out, {recursive: true});
  for (const [rel, bytes] of output) { const file = path.join(out, rel); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, bytes); }
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}
if (require.main === module) {
  const {values} = parseArgs({options: {baseline: {type: 'string'}, out: {type: 'string'}}});
  assert.ok(values.baseline && values.out, 'Require --baseline and --out');
  build(values);
}
module.exports = {build, parseSwf, xmlRecord, xmlTag, encodeSwf};
