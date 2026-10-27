'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {buildCatalogue} = require('./pet-boss-handbook-data.cjs');
const attrs = text => Object.fromEntries([...text.matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1],m[2]]));
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function appendEssences(xml, additions) {
  const ids = new Set([...xml.matchAll(/<Item\b[^>]*>/g)].map(m => Number(attrs(m[0]).ID)));
  for (const item of additions) { assert.ok(!ids.has(Number(item.ID)), 'Item already exists: ' + item.ID); ids.add(Number(item.ID)); }
  let count = 0;
  const result = xml.replace(/(<Cat\b[^>]*\bID="4"[^>]*>)([\s\S]*?)(<\/Cat>)/g, (_,open,body,close) => {
    count++;
    return open + body + additions.map(item => '        <Item ' + Object.entries(item).map(([key,value]) => key + '="' + escape(value) + '"').join(' ') + '/>\n').join('') + '    ' + close;
  });
  assert.equal(count,1,'Expected one collection item category');
  return result;
}
function buildMigration({base}) {
  const read = rel => fs.readFileSync(path.join(base,'app/config/data',rel),'utf8');
  const load = name => JSON.parse(read('json/' + name));
  const policy = name => JSON.parse(fs.readFileSync(path.join(__dirname,'../compat/server-patches/pet-acquisition',name),'utf8'));
  const high = policy('boss-routes.json'), ordinary = policy('ordinary-routes.json');
  const acquisition = load('pet-acquisition.json'), bosses = load('boss_abilities.json'), ogres = load('map-ogres.json');
  const originalIds = acquisition.exchange.petIds;
  const routes = [...high.routes,...ordinary.routes].sort((a,b) => a.petId-b.petId);
  assert.equal(originalIds.length,538,'Acquisition baseline changed');
  assert.equal(new Set(originalIds).size,538);
  assert.deepEqual(routes.map(r => r.petId),[...originalIds].sort((a,b) => a-b),'Every old claim needs exactly one disposition');
  assert.ok(routes.every(r => r.source && r.skillEvidence?.length),'Incomplete route decision');
  assert.ok(ordinary.collectionPetIds.length > 0,'Explicitly reviewed collection whitelist required');
  assert.equal(new Set(ordinary.collectionPetIds).size,ordinary.collectionPetIds.length);
  assert.ok(ordinary.collectionPetIds.every(id => originalIds.includes(id) && !high.routes.some(r => r.petId === id)));
  acquisition.exchange.petIds = [...ordinary.collectionPetIds].sort((a,b) => a-b);
  const slots = new Set(bosses.bossConfigs.map(b => b.mapId + '/' + b.param2));
  const spts = new Set(bosses.bossConfigs.map(b => b.spt?.sptId).filter(Boolean));
  const pets = new Set([...read('xml/pets.xml').matchAll(/<Monster\b[^>]*>/g)].map(m => Number(attrs(m[0]).ID)));
  for (const boss of high.newBosses) {
    const key = boss.mapId + '/' + boss.param2;
    assert.ok(!slots.has(key),'Occupied Boss encounter: ' + key); slots.add(key);
    assert.ok(Number.isInteger(boss.spt.sptId) && boss.spt.sptId <= 200 && !spts.has(boss.spt.sptId),'Occupied SPT ID'); spts.add(boss.spt.sptId);
    assert.ok(pets.has(boss.petId) && boss.skills.length === 4 && boss.spt.rewardItemId > 0);
    assert.ok(!boss.spt.rewardPetId,'New Bosses grant essence, not pets');
    bosses.bossConfigs.push(boss);
  }
  for (const addition of [...ordinary.wildAdditions,...high.bossSpawns]) {
    const map = ogres.maps[addition.mapId];
    assert.ok(map && pets.has(addition.entry.petId),'Unknown map or species');
    assert.ok(!map.ogres.some(o => o.petId === addition.entry.petId && Boolean(o.isBoss) === Boolean(addition.entry.isBoss)),'Duplicate spawn');
    if (addition.entry.isBoss) {
      assert.ok(addition.entry.slot >= 0 && addition.entry.slot < 9);
      assert.ok(!map.ogres.some(o => o.isBoss && o.slot === addition.entry.slot),'Occupied Boss entity slot');
    }
    const entry = structuredClone(addition.entry);
    if (entry.isBoss) entry.standingOnly = true;
    map.ogres.push(entry);
  }
  const itemsXml = appendEssences(read('xml/items.xml'),high.newEssences);
  const items = new Map([...itemsXml.matchAll(/<Item\b[^>]*>/g)].map(m => {const a=attrs(m[0]);return [Number(a.ID),a];}));
  for (const boss of high.newBosses) {
    const item = items.get(boss.spt.rewardItemId);
    assert.ok(item && Number(item.BreedMonID)>0 && Number(item.BreedMonLv)===1,'Invalid essence');
    assert.ok(high.bossSpawns.some(s => s.mapId === boss.mapId && s.entry.slot === boss.param2 && s.entry.petId === boss.petId),'Boss has no matching entity');
  }
  return {acquisition,bosses,ogres,itemsXml,newBosses:high.newBosses,newEssences:high.newEssences,report:{originalCount:originalIds.length,collectionPetIds:acquisition.exchange.petIds,routeCount:routes.length,newBosses:high.newBosses.length,newWildCandidates:ordinary.wildAdditions.length,newEssences:high.newEssences.length,routes,fusionDependencies:ordinary.fusionDependencies}};
}
function verifyCatalogue(base, report) {
  const catalogue = buildCatalogue({base});
  const pets = new Map(catalogue.pets.map(p => [p.id,p]));
  for (const route of report.routes) {
    const pet = pets.get(route.petId);
    assert.ok(pet && pet.acquisition.every(r => r.kind !== 'unknown'),'Unreachable acquisition: ' + route.petId);
    assert.equal(pet.acquisition.some(r => r.kind === 'collection'),report.collectionPetIds.includes(route.petId),'Whitelist/source mismatch: ' + route.petId);
  }
  return catalogue;
}
module.exports = {buildMigration,appendEssences,verifyCatalogue};
