'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const build=require('./fusion-manual-acquisition.cjs');
const base=fs.mkdtempSync(path.join(os.tmpdir(),'fusion-sources-'));
try {
 const dir=path.join(base,'app/config/data/json');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'map-ogres.json'),JSON.stringify({maps:{11:{name:'核实地图',ogres:[{petId:1,weight:1,catchable:true,minLevel:7,maxLevel:8,dropItems:[{itemId:400005,dropRate:.45,minCount:1,maxCount:1}]},{petId:4,weight:1,catchable:false},{petId:5,weight:0,catchable:true}]}}}));
 fs.writeFileSync(path.join(dir,'pet-acquisition.json'),JSON.stringify({exchange:{mapId:5,coins:1000,petIds:[6]},disguises:[]}));
 fs.writeFileSync(path.join(dir,'special-evolutions.json'),JSON.stringify({branches:{1:[{petId:9,itemId:400005,count:20}]}}));
 const pets={1:{EvolvesTo:2,EvolvingLv:18},2:{EvolvesFrom:1,EvolvesTo:3,EvolvingLv:32},3:{EvolvesFrom:2},4:{},5:{},6:{},7:{EvolvesFrom:6},8:{},9:{EvolvesFrom:10},10:{EvolvFlag:1,EvolvingLv:20}};
 const source=build({base,pets,pet:id=>'精灵'+id,item:id=>'物品'+id,rules:{RECIPES:[],MIRACLES:[]}});
 assert.match(source.petSource(1).text,/核实地图，7–8级野外捕捉/);
 assert.match(source.petSource(3).text,/精灵2 32级进化.*精灵1 18级进化/);
 assert.equal(source.petSource(4),null,'uncatchable encounters cannot be presented as capture sources');
 assert.equal(source.petSource(5),null,'zero-weight encounters cannot be presented as sources');
 assert.match(source.petSource(6).text,/精灵常驻兑换.*1000/);
 assert.equal(source.petSource(7),null,'EvolvesFrom alone is not proof of an executable evolution');
 assert.match(source.petSource(9).text,/精灵10达到 20级后条件进化，消耗物品400005 20个/);
 assert.equal(source.petSource(8),null,'unknown sources stay absent');
 assert.match(source.itemSource(400005).text,/击败7–8级精灵1，掉率 45%/);
 assert.equal(source.itemSource(400006),null);
 assert.ok(source.evidence['pet:3'].refs.includes('app/config/data/xml/pets.xml#2'));
 console.log('PASS: capture eligibility, evolution levels and links, exchange, drops, unknown-source exclusion and evidence');
} finally {fs.rmSync(base,{recursive:true,force:true});}
