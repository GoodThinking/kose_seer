'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const attrs = text => Object.fromEntries([...text.matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1], m[2]]));

module.exports = function prepareEncounters({ baseline, root, parse, encode }) {
  const read = relative => fs.readFileSync(path.join(baseline, relative), 'utf8');
  const plan = JSON.parse(fs.readFileSync(path.join(root, 'compat/server-patches/nono-experience/encounter-corrections.json')));
  const original = JSON.parse(read('app/config/data/json/map-ogres.json'));
  const spawn = structuredClone(original);
  const acquisition = JSON.parse(read('app/config/data/json/pet-acquisition.json'));
  const coreOverlay = path.join(baseline, 'client/overlay/dll/NieoCore.swf');
  const source = parse(fs.readFileSync(fs.existsSync(coreOverlay) ? coreOverlay : path.join(baseline, 'client/assets/dll/NieoCore.swf')));
  const payload = tag => tag.raw.subarray((tag.raw.readUInt16LE(0) & 63) === 63 ? 6 : 2);
  const symbols = new Map();
  for (const tag of source.tags.filter(t => t.code === 76)) {
    const bytes = payload(tag); let at = 2;
    for (let i = 0; i < bytes.readUInt16LE(0); i++) {
      const id = bytes.readUInt16LE(at); at += 2;
      const end = bytes.indexOf(0, at); assert.ok(end >= at);
      symbols.set(bytes.subarray(at, end).toString(), id); at = end + 1;
    }
  }
  const xml = name => {
    const id = symbols.get(name);
    const tag = source.tags.find(t => t.code === 87 && payload(t).readUInt16LE(0) === id);
    assert.ok(tag, 'Missing embedded XML: ' + name);
    return { tag, text: payload(tag).subarray(6).toString('utf8') };
  };
  const mapXml = xml('com.robot.core.manager.map.config.MapConfig_xmlCls').text;
  const maps = new Map([...mapXml.matchAll(/<map\b[^>]*>/g)].map(m => { const a = attrs(m[0]); return [Number(a.id), a]; }));
  const bookXml = xml('com.robot.core.config.xml.PetBookXMLInfo_xmlClass');
  const book = new Map([...bookXml.text.matchAll(/<Monster\b[^>]*>/g)].map(m => { const a = attrs(m[0]); return [Number(a.ID), a]; }));
  const species = new Map([...read('app/config/data/xml/pets.xml').matchAll(/<Monster\b[^>]*>/g)].map(m => { const a = attrs(m[0]); return [Number(a.ID), a]; }));
  const decisions = new Map();
  for (const change of plan.changes) {
    const from = spawn.maps[change.from]; assert.ok(from, 'Missing source map ' + change.from);
    for (const petId of change.pets) {
      const matches = from.ogres.filter(o => o.petId === petId);
      assert.ok(matches.length, 'Missing correction anchor ' + change.from + '/' + petId);
      for (const ogre of matches) {
        decisions.set(change.from + '/' + petId, change);
        assert.ok(!ogre.isBoss, 'Never move configured BOSS entries');
        if (change.to !== null) {
          assert.ok(maps.has(change.to), 'Destination is not registered: ' + change.to);
          const destination = spawn.maps[change.to] ||= { ...structuredClone(from), name: maps.get(change.to).name, ogres: [] };
          if (!destination.ogres.some(o => o.petId === petId && o.shiny === ogre.shiny)) destination.ogres.push(structuredClone(ogre));
        }
      }
      from.ogres = from.ogres.filter(o => o.petId !== petId);
    }
  }
  for (const [id, map] of Object.entries(spawn.maps)) {
    map.ogres.forEach((ogre, slot) => { ogre.slot = slot; });
    if (maps.has(Number(id))) map.name = maps.get(Number(id)).name;
  }
  // A lone relocated shiny must not become a guaranteed full map of shinies.
  assert.ok(spawn.maps[12].ogres.every(o => o.shiny > 0));
  spawn.maps[12].spawnProbability = original.globalSettings.defaultShinyRate;
  assert.ok(spawn.maps[12].spawnProbability > 0 && spawn.maps[12].spawnProbability < 1);
  // This field is an explicit user-approved private-server habitat, not a historical claim.
  spawn.maps[550].name = original.maps[550].name;
  assert.deepEqual(spawn.maps[550], original.maps[550], 'Approved capture field changed');
  const ogreXml = xml('com.robot.core.config.xml.OgreXMLInfo_xmlClass');
  const ogreSection = ogreXml.text.match(/<ogre>[\s\S]*?<\/ogre>/);
  assert.ok(ogreSection, 'Missing ordinary encounter position section');
  let positionsXml = ogreSection[0];
  const positions = JSON.parse(fs.readFileSync(path.join(root, 'compat/client-patches/nono-experience/positions.json')));
  for (const [id, points] of Object.entries(positions)) {
    assert.equal(points.length, 9);
    const item = '<item id="' + id + '" pList="' + points.map(p => p.join(',')).join('|') + '"/>';
    const pattern = new RegExp('<item\\b[^>]*\\bid="' + id + '"[^>]*(?:/>|>\\s*</item>)');
    positionsXml = pattern.test(positionsXml) ? positionsXml.replace(pattern, item) : positionsXml.replace('</ogre>', item + '</ogre>');
    assert.ok(positionsXml.includes(item));
  }
  const replacements = new Map([[ogreXml.tag, ogreXml.text.replace(ogreSection[0], positionsXml)]]);
  const coreBytes = encode(source, source.tags.map(tag => {
    const text = replacements.get(tag);
    if (text === undefined) return tag;
    const bytes = Buffer.concat([payload(tag).subarray(0, 6), Buffer.from(text)]);
    const header = Buffer.alloc(6); header.writeUInt16LE((87 << 6) | 63); header.writeUInt32LE(bytes.length, 2);
    return { ...tag, raw: Buffer.concat([header, bytes]) };
  }));
  const drawn = new Set([...positionsXml.matchAll(/<item\b[^>]*\bid="(\d+)"[^>]*pList="([^"]*)"/g)].filter(m => m[2].split('|').length >= 9).map(m => Number(m[1])));
  const locations = {};
  for (const [id, map] of Object.entries(spawn.maps)) {
    const mapId = Number(id);
    if (!maps.has(mapId) || !drawn.has(mapId)) continue;
    for (const ogre of map.ogres) {
      if (ogre.isBoss || ogre.catchable === false) continue;
      const rows = locations[ogre.petId] ||= [];
      if (rows.some(row => row.map === mapId)) continue;
      const entry = plan.safeEntries[id] || 0;
      assert.ok(!entry || (maps.has(entry) && maps.get(entry).isLocal !== '1'), 'Unsafe navigation entry ' + entry);
      const entryName = entry ? spawn.maps[entry]?.name || maps.get(entry).name : '';
      rows.push({ map: mapId, name: map.name, entry, entryName,
        route: entry ? (entry === mapId ? '星图公开入口' : entryName + ' → 按场景出口前往' + map.name) : '需经原地图入口进入；不提供直接传送' });
    }
  }
  const audit = Object.entries(original.maps).flatMap(([id, map]) => map.ogres.map(ogre => {
    const change = decisions.get(id + '/' + ogre.petId);
    const actual = maps.get(Number(id));
    const dex = book.get(ogre.petId);
    const evidence = change || plan.verifiedRetentions.find(row => row.map === Number(id) && row.pets.includes(ogre.petId));
    return { map: Number(id), configuredName: map.name, clientName: actual?.name || null, petId: ogre.petId,
      name: species.get(ogre.petId)?.DefName || '', originalDexMap: Number(dex?.mapID || 0), originalDexLocation: dex?.Foundin || '',
      action: change ? (change.to === null ? 'remove' : 'move') : 'retain', destination: change?.to ?? null,
      source: evidence?.source || (Number(id) === 550 ? 'user-approved private capture field' : actual ? 'native:MapConfig/PetBookXMLInfo; ' + plan.legacySource : 'native:MapConfig (unregistered)'),
      reason: evidence?.reason || (!actual ? '客户端未登记；不作为可见野怪或导航来源。' : '保留既有分布及大小同场；未以图鉴星球名称扩增地点。') };
  }));
  return { spawn, acquisition, coreBytes, locations, audit };
};
