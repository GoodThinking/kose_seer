'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {buildMigration,verifyCatalogue} = require('./pet-acquisition-migration.cjs');
const {values} = parseArgs({options:Object.fromEntries(['baseline','out','java','ffdec'].map(key => [key,{type:'string'}]))});
for (const key of ['baseline','out','java','ffdec']) assert.ok(values[key],'Missing --' + key);
const base = path.resolve(values.baseline), out = path.resolve(values.out);
assert.ok(!fs.existsSync(out),'Choose a fresh output directory');
assert.ok(out !== base && !out.startsWith(base + path.sep),'Do not build inside baseline');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const work = path.join(out,'work'), stage = path.join(work,'stage');
fs.mkdirSync(work,{recursive:true});
fs.cpSync(base,stage,{recursive:true});
const modified = new Set();
function put(relative,bytes) {
  for (const root of [stage,out]) {
    const dest = path.join(root,relative);
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.writeFileSync(dest,bytes);
  }
  modified.add(relative);
}
const migration = buildMigration({base});
for (const [name,value] of [['pet-acquisition.json',migration.acquisition],['boss_abilities.json',migration.bosses],['map-ogres.json',migration.ogres]])
  put('app/config/data/json/' + name,JSON.stringify(value,null,2) + '\n');
put('app/config/data/xml/items.xml',migration.itemsXml);
verifyCatalogue(stage,migration.report);
const stages = [];
function run(name,script,args=[]) {
  const target = path.join(work,name);
  execFileSync(process.execPath,[path.join(__dirname,script),'--baseline',stage,'--out',target,...args],{stdio:'inherit',timeout:600000});
  const manifest = JSON.parse(fs.readFileSync(path.join(target,'manifest.json'),'utf8'));
  assert.ok(Array.isArray(manifest.files),'Missing component manifest: ' + name);
  for (const file of manifest.files) {
    assert.ok(!path.isAbsolute(file.path) && !file.path.split('/').includes('..'),'Unsafe component path');
    const bytes = fs.readFileSync(path.join(target,file.path));
    assert.equal(hash(bytes),file.after,'Component digest mismatch: ' + file.path);
    const current = path.join(stage,file.path);
    if (file.before !== undefined) assert.equal(fs.existsSync(current) ? hash(fs.readFileSync(current)) : null,file.before,'Component baseline mismatch: ' + file.path);
    put(file.path,bytes);
  }
  stages.push({name,files:manifest.files.length});
}
const compiler = ['--java',values.java,'--ffdec',values.ffdec];
run('rewards','build-acquisition-rewards.cjs');
run('entries','build-acquisition-entries.cjs',compiler);
run('essences','build-acquisition-essences.cjs',compiler);
run('spt','build-boss-notes.cjs',['--spt-only',...compiler]);
run('handbook','build-pet-boss-handbook.cjs',['--fusion-baseline',stage,'--book',path.join(stage,'client/overlay/resource/book/monsterBook.swf'),...compiler]);
run('fusion','build-fusion-manual.cjs',compiler);
verifyCatalogue(stage,migration.report);
const files = [...modified].sort().map(relative => {
  const before = path.join(base,relative), after = fs.readFileSync(path.join(out,relative));
  return {path:relative,before:fs.existsSync(before)?hash(fs.readFileSync(before)):null,after:hash(after)};
});
const manifest = {files,stages,originalClaimCount:migration.report.originalCount,collectionPetIds:migration.report.collectionPetIds,newBossCount:migration.newBosses.length,newEssenceCount:migration.newEssences.length,newWildCandidates:migration.report.newWildCandidates,databaseMigration:false,playerDataMutation:false,verification:'Build and catalogue invariants only; gameplay and native UI require separate evidence.'};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(out,'acquisition-report.json'),JSON.stringify(migration.report,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
