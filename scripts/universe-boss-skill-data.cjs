'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const resource = path.resolve(__dirname, '../compat/client-resources/universe-boss-skills');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const decode = value => value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
  if (entity[0] === '#') return String.fromCodePoint(entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1)));
  return {amp:'&', lt:'<', gt:'>', quot:'"', apos:"'"}[entity];
});
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
function moves(xml) {
  const result = new Map();
  for (const match of xml.matchAll(/<Move\b([^>]*?)(?:\/?)>/g)) {
    const attrs = {};
    for (const attr of match[1].matchAll(/([\w:.-]+)\s*=\s*(["'])(.*?)\2/gs)) {
      assert.ok(!(attr[1] in attrs), 'Duplicate Move attribute ' + attr[1]);
      attrs[attr[1]] = decode(attr[3]);
    }
    assert.ok(/^\d+$/.test(attrs.ID || ''), 'Invalid Move ID');
    const id = Number(attrs.ID);
    assert.ok(Number.isSafeInteger(id) && id > 0, 'Invalid Move ID');
    assert.ok(!result.has(id), 'Duplicate Move ID ' + id);
    result.set(id, attrs);
  }
  return result;
}
const baseFields = ['Name', 'Category', 'Type', 'Power', 'MaxPP', 'Accuracy'];
const officialFields = [...baseFields, 'SideEffect', 'SideEffectArg', 'MustHit', 'Priority'];
const defaults = {Power:'0', SideEffect:'', SideEffectArg:'', MustHit:'0', Priority:'0'};
function compare(a, b, fields, id, label) {
  for (const field of fields) {
    const left = a[field] ?? defaults[field], right = b[field] ?? defaults[field];
    assert.ok(left !== undefined && right !== undefined, `${label} missing ${field} for ${id}`);
    assert.equal(String(left), String(right), `${label} ${field} mismatch for ${id}`);
  }
}
function plan({baseline, nativeXml, serverXml, bossConfig, world}) {
  assert.ok(typeof baseline === 'string' && baseline, 'Missing baseline');
  assert.ok(typeof nativeXml === 'string' && typeof serverXml === 'string', 'Expected XML strings');
  assert.ok(Array.isArray(bossConfig?.bossConfigs) && Array.isArray(world?.bossEncounters), 'Invalid boss inputs');
  const native = moves(nativeXml), server = moves(serverXml);
  const source = JSON.parse(fs.readFileSync(path.join(resource, 'skills.json'), 'utf8'));
  const official = new Map(), movies = new Map();
  for (const record of source.records) {
    const id = Number(record.ID);
    assert.ok(Number.isSafeInteger(id) && id > 0 && String(id) === record.ID && !official.has(id), 'Invalid official skill ID');
    official.set(id, record);
  }
  for (const movie of source.movies.files) {
    assert.ok(Number.isSafeInteger(movie.id) && movie.id > 0 && !movies.has(movie.id) && /^[a-f0-9]{64}$/.test(movie.sha256), 'Invalid movie entry');
    movies.set(movie.id, movie);
  }
  const required = new Set(), keys = new Set();
  for (const entry of world.bossEncounters) {
    assert.ok(entry.key && !keys.has(entry.key), 'Duplicate boss key');
    keys.add(entry.key);
    let matches = bossConfig.bossConfigs.filter(b => b.universeBossKey === entry.key);
    assert.ok(matches.length <= 1, 'Duplicate built boss ' + entry.key);
    let skills;
    if (matches.length) {
      assert.equal(matches[0].petId, entry.bossPetId, 'Built boss identity mismatch: ' + entry.key);
      skills = matches[0].skills;
    } else if (entry.kind === 'relocatedBoss') {
      matches = bossConfig.bossConfigs.filter(b => b.mapId === entry.oldMapId && b.param2 === entry.oldRegion && b.petId === entry.bossPetId);
      assert.equal(matches.length, 1, 'Old boss identity not unique: ' + entry.key);
      skills = matches[0].skills;
    } else {
      assert.equal(entry.kind, 'newEcologicalLord', 'Unknown boss kind');
      skills = entry.battleContract?.skills;
    }
    assert.ok(Array.isArray(skills) && skills.length > 0, 'Missing boss skills: ' + entry.key);
    for (const id of skills) {
      assert.ok(Number.isSafeInteger(id) && id > 0, 'Invalid boss skill: ' + entry.key);
      required.add(id);
    }
  }
  const requiredIds = [...required].sort((a, b) => a - b), addedIds = [], tags = [], assets = [];
  for (const id of requiredIds) {
    const serverRecord = server.get(id), existing = native.get(id), candidate = official.get(id);
    assert.ok(serverRecord, 'Missing server skill ' + id);
    assert.ok(['1', '2', '4'].includes(serverRecord.Category), 'Invalid skill category ' + id);
    if (existing) {
      compare(existing, serverRecord, baseFields, id, 'Native skill');
    } else {
      assert.ok(candidate, 'Missing official skill ' + id);
      compare(candidate, serverRecord, officialFields, id, 'Official skill');
      assert.ok(['1', '2', '4'].includes(candidate.Category), 'Invalid official category ' + id);
      for (const [name, value] of Object.entries(candidate)) {
        assert.ok(/^[A-Za-z_][\w.:-]*$/.test(name) && typeof value === 'string', 'Invalid official attribute ' + id);
      }
      tags.push('        <Move ' + Object.entries(candidate).map(([name, value]) => `${name}="${escape(value)}"`).join(' ') + '/>');
      addedIds.push(id);
    }
    if (candidate) {
      const movie = movies.get(id);
      assert.ok(movie, 'Missing official movie ' + id);
      const bytes = fs.readFileSync(path.join(resource, 'movies', id + '.swf'));
      assert.equal(bytes.length, movie.bytes, 'Movie length mismatch: ' + id);
      assert.equal(sha(bytes), movie.sha256, 'Movie hash mismatch: ' + id);
      const suffix = `resource/fightResource/skill/swf/${id}.swf`;
      const overlay = path.join(baseline, 'client/overlay', suffix), asset = path.join(baseline, 'client/assets', suffix);
      const effective = fs.existsSync(overlay) ? overlay : fs.existsSync(asset) ? asset : null;
      if (effective) assert.equal(sha(fs.readFileSync(effective)), movie.sha256, 'Baseline movie hash mismatch: ' + id);
      else assets.push({relative: 'client/overlay/' + suffix, bytes});
    }
  }
  let xml = nativeXml;
  if (tags.length) {
    assert.equal((nativeXml.match(/<\/Moves\s*>/g) || []).length, 1, 'Expected one Moves closing tag');
    xml = nativeXml.replace(/<\/Moves\s*>/, tags.join('\n') + '\n</Moves>');
  }
  return {xml, assets, addedIds, requiredIds};
}
module.exports = {plan, moves};
