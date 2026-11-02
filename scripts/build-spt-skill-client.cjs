'use strict';
// Add missing native attribute-skill definitions required by actual SPT parties.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {parseArgs} = require('node:util');
const {parseSwf, xmlRecord, xmlTag, encodeSwf} = require('./build-universe-extended-species.cjs');
const {moves} = require('./universe-boss-skill-data.cjs');
const {values} = parseArgs({options:Object.fromEntries(['baseline','runtime','calibration','out'].map(key => [key,{type:'string'}]))});
for (const key of ['baseline','runtime','calibration','out']) assert.ok(values[key], 'Missing --' + key);
const baseline = path.resolve(values.baseline), runtime = path.resolve(values.runtime), out = path.resolve(values.out);
assert.ok(!fs.existsSync(out), 'Choose a fresh output directory');
assert.ok(out !== baseline && !out.startsWith(baseline + path.sep) && !baseline.startsWith(out + path.sep), 'Keep baseline and output separate');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const calibrationBytes = fs.readFileSync(path.resolve(values.calibration));
const calibration = JSON.parse(calibrationBytes);
const bossBytes = fs.readFileSync(path.join(runtime,'config/data/json/boss_abilities.json'));
const bosses = JSON.parse(bossBytes).bossConfigs.filter(boss => boss.sptBoss);
assert.equal(calibration.complete, true);
assert.equal(calibration.bossConfigHash, sha(bossBytes));
assert.equal(calibration.encounters, bosses.length);
assert.equal(calibration.winningRoutes, calibration.encounters * 2);
const playerIds = new Set(calibration.results.flatMap(row => [row.routeA,row.routeB].flatMap(team => team.specs.flatMap(pet => pet.skills))));
// Native seals select moves outside the ordinary boss row.
const bossIds = new Set(bosses.flatMap(boss => [...(boss.skills || []),...(boss.mechanics?.phases || []).flatMap(phase => phase.skills || [])]));
for (const row of calibration.results) for (const team of [row.routeA,row.routeB]) {
  for (const step of team.trace) if (step.enemySkill) bossIds.add(step.enemySkill);
}
const required = new Set([10001,...playerIds,...bossIds]);
const serverXml = fs.readFileSync(path.join(runtime,'config/data/xml/skills.xml'),'utf8');
const server = moves(serverXml);
const coreBytes = fs.readFileSync(path.join(baseline,'NieoCore.swf'));
const movie = parseSwf(coreBytes), originalTags = movie.tags.slice();
const symbol = 'com.robot.core.config.xml.SkillXMLInfo_xmlClass';
const record = xmlRecord(movie,symbol), nativeBytes = record.payload.subarray(6), nativeXml = nativeBytes.toString('utf8');
const native = moves(nativeXml), added = [...required].filter(id => !native.has(id)).sort((a,b) => a-b);
for (const id of required) assert.ok(server.has(id), 'Required server skill missing: ' + id);
for (const id of added) {
  const skill = server.get(id);
  // Attribute skills use native property-skill playback; attack skills need verified movies as well.
  assert.equal(skill.Category, '4', 'Missing attack definition requires its verified animation: ' + id);
  assert.ok(skill.Name && Number(skill.MaxPP) > 0 && Number.isInteger(Number(skill.MaxPP)), 'Invalid server skill: ' + id);
}
const addedSet = new Set(added), additions = [];
for (const match of serverXml.matchAll(/<Move\b(?=[^>]*\bID="(\d+)")[^>]*\/>/g)) {
  if (addedSet.has(Number(match[1]))) additions.push(match[0]);
}
assert.equal(additions.length, added.length, 'Each missing skill must have one complete source record');
assert.equal((nativeXml.match(/<\/Moves\s*>/g) || []).length, 1);
const updatedXml = added.length ? nativeXml.replace(/<\/Moves\s*>/, additions.join('\n') + '\n</Moves>') : nativeXml;
const updated = moves(updatedXml);
for (const id of required) assert.ok(updated.has(id), 'Native skill coverage incomplete: ' + id);
for (const id of added) assert.deepEqual(updated.get(id), server.get(id), 'Skill semantics changed: ' + id);
let result = coreBytes;
if (added.length) {
  xmlTag(movie,symbol,sha(nativeBytes),() => updatedXml);
  result = encodeSwf(movie);
}
const verified = added.length ? parseSwf(result) : movie;
assert.equal(verified.tags.length, originalTags.length);
const changedTags = originalTags.flatMap((tag,index) => tag.raw.equals(verified.tags[index].raw) ? [] : [index]);
assert.ok(changedTags.length <= 1 && changedTags.every(index => originalTags[index] === record), 'Only the embedded skill XML may change');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'NieoCore.swf'),result);
const manifest = {baseline,runtime,calibration:path.resolve(values.calibration),calibrationHash:sha(calibrationBytes),bossConfigHash:sha(bossBytes),serverSkillXmlHash:sha(Buffer.from(serverXml)),requiredPlayerIds:[...playerIds].sort((a,b) => a-b),requiredBossIds:[...bossIds].sort((a,b) => a-b),addedIds:added,sourceRecords:added.map(id => server.get(id)),file:'NieoCore.swf',before:sha(coreBytes),after:sha(result),changedTags,protectedTags:originalTags.length-changedTags.length,bytes:result.length};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({file:manifest.file,addedIds:added,requiredPlayerMoves:playerIds.size,requiredBossMoves:bossIds.size,changedTags,protectedTags:manifest.protectedTags,after:manifest.after}));
