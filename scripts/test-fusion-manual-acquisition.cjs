'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {buildCatalogue}=require('./pet-boss-handbook-data.cjs');
const fusionSources=require('./fusion-manual-acquisition.cjs');
if(!process.argv[2])throw Error('Usage: node scripts/test-fusion-manual-acquisition.cjs <final-baseline>');
const input=path.resolve(process.argv[2]);
const base=fs.mkdtempSync(path.join(os.tmpdir(),'fusion-sources-'));
try {
 const app=path.join(base,'app');fs.mkdirSync(app,{recursive:true});
 for(const part of ['config','dist'])fs.cpSync(path.join(input,'app',part),path.join(app,part),{recursive:true});
 const jsonDir=path.join(app,'config/data/json');
 const read=name=>JSON.parse(fs.readFileSync(path.join(jsonDir,name),'utf8'));
 const write=(name,value)=>fs.writeFileSync(path.join(jsonDir,name),JSON.stringify(value));
 const config=read('pet-acquisition.json');config.exchange.petIds=[1];write('pet-acquisition.json',config);
 const maps=read('map-ogres.json');
 maps.maps['99001']={name:'路线甲',ogres:[{petId:1,weight:1,catchable:true,level:5}]};
 maps.maps['99002']={name:'路线乙',ogres:[{petId:1,weight:1,catchable:true,level:5}]};
 write('map-ogres.json',maps);
 const catalogue=()=>new Map(buildCatalogue({base}).pets.map(p=>[p.id,p]));
 const first=catalogue();
 const direct=first.get(1).acquisition;
 assert.equal(direct.filter(r=>r.kind==='collection').length,1,'whitelisted pet has one collection route');
 assert.equal(first.get(4).acquisition.some(r=>r.kind==='collection'),false,'non-whitelisted pet has no direct collection route');
 for(const mapId of [99001,99002]){
  assert.ok(direct.some(r=>r.kind==='wild'&&r.target?.mapId===mapId),'both direct captures remain available');
  assert.ok(first.get(3).acquisition.some(r=>r.kind==='evolution'&&r.target?.mapId===mapId),'each source survives two evolution steps');
 }
 const source=fusionSources({base,pet:id=>String(id)}).petSource(3);
 assert.ok(source && source.text.includes('路线甲') && source.text.includes('路线乙'),'fusion manual preserves both inherited sources');
 const xmlPath=path.join(app,'config/data/xml/pets.xml');
 const xml=fs.readFileSync(xmlPath,'utf8');
 const changeMonster=(text,id,change)=>text.replace(new RegExp('(<Monster\\s+ID="'+id+'"[^>]*>)'),change);
 let specialXml=changeMonster(xml,1,tag=>tag.replace('EvolvesTo="2"','EvolvesTo="2" EvolvFlag="99999"'));
 fs.writeFileSync(xmlPath,specialXml);
 const special=read('special-evolutions.json');special.branches['99999']=[{petId:2,itemId:0,count:0}];write('special-evolutions.json',special);
 const branched=catalogue().get(3).acquisition;
 for(const mapId of [99001,99002])assert.ok(branched.some(r=>r.kind==='evolution'&&r.target?.mapId===mapId),'special branch retains each source');
 let cycleXml=changeMonster(xml,1,tag=>tag.replace('EvolvesFrom="0"','EvolvesFrom="2"'));
 cycleXml=changeMonster(cycleXml,2,tag=>tag.replace('EvolvesTo="3"','EvolvesTo="1"'));
 fs.writeFileSync(xmlPath,cycleXml);
 assert.throws(()=>catalogue(),/Evolution cycle/,'cyclic evolution fails rather than looping');
 console.log('PASS: whitelist, multiple routes, normal and special evolution, fusion and cycle guard');
} finally {fs.rmSync(base,{recursive:true,force:true});}
