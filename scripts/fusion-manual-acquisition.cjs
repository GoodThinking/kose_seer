'use strict';
const fs=require('node:fs'),path=require('node:path');
// Read only server-backed routes. Historical dex descriptions are deliberately unused.
module.exports=function({base,pets,pet,item,rules}) {
 const mapFile='app/config/data/json/map-ogres.json',exchangeFile='app/config/data/json/pet-acquisition.json';
 const maps=JSON.parse(fs.readFileSync(path.join(base,mapFile),'utf8')).maps;
 const config=JSON.parse(fs.readFileSync(path.join(base,exchangeFile),'utf8'));
 const evolutionFile='app/config/data/json/special-evolutions.json';
 const special=JSON.parse(fs.readFileSync(path.join(base,evolutionFile),'utf8')).branches;
 const wild=new Map(),drops=new Map(),evidence={};
 const add=(index,id,value)=>{if(!index.has(id))index.set(id,[]);index.get(id).push(value);};
 const levels=o=>o.level!=null?o.level+'级':o.minLevel!=null&&o.maxLevel!=null?(o.minLevel===o.maxLevel?o.minLevel:o.minLevel+'–'+o.maxLevel)+'级':'';
 for(const [mapId,map] of Object.entries(maps))for(const [index,o] of (map.ogres||[]).entries()){
  if(!map.name||o.isBoss||Number(o.weight??1)<=0)continue;
  const ref=mapFile+'#/maps/'+mapId+'/ogres/'+index;
  if(o.catchable!==false)add(wild,o.petId,{text:map.name+'，'+levels(o)+'野外捕捉',refs:[ref]});
  for(const d of o.dropItems||[])if(d.dropRate>0&&d.dropRate<=1&&d.maxCount>0)add(drops,d.itemId,{text:map.name+'击败'+levels(o)+pet(o.petId)+'，掉率 '+Number((d.dropRate*100).toFixed(2))+'%',refs:[ref+'/dropItems']});
 }
 function route(id,seen=new Set()){
  if(seen.has(id))throw Error('Evolution cycle '+id);seen.add(id);
  if(wild.has(id))return wild.get(id)[0];
  if(config.exchange.mapId===5&&config.exchange.petIds.includes(id))return {text:'实验室博士的「精灵常驻兑换」，消耗 '+config.exchange.coins+' 赛尔豆',refs:[exchangeFile+'#/exchange']};
  const fixed=rules.RECIPES.find(r=>r.pet===id);
  if(fixed)return {text:'「'+pet(id)+'」固定配方融合获得',refs:['PetFusionHandler.js#RECIPES']};
  const rare=rules.RECIPES.find(r=>r.rare?.pet===id);
  if(rare)return {text:'「'+pet(rare.pet)+'」配方的粉色元神珠分支获得',refs:['PetFusionHandler.js#RECIPES/rare']};
  const p=pets[id],from=Number(p?.EvolvesFrom),prev=pets[from];
  if(from&&Number(prev?.EvolvesTo)===id&&Number(prev.EvolvingLv)>0){
   const origin=route(from,seen);
   return {text:'由'+pet(from)+' '+prev.EvolvingLv+'级进化'+(origin?'；'+pet(from)+'：'+origin.text:''),refs:['app/config/data/xml/pets.xml#'+from,...(origin?.refs||[])]};
  }
  const branch=prev&&special[Number(prev.EvolvFlag)]?.find(r=>r.petId===id);
  if(from&&branch&&Number(prev.EvolvingLv)>0){
   const origin=route(from,seen);
   return {text:'由'+pet(from)+'达到 '+prev.EvolvingLv+'级后条件进化'+(branch.count?'，消耗'+item(branch.itemId)+' '+branch.count+'个':'')+(origin?'；'+pet(from)+'：'+origin.text:''),refs:[evolutionFile+'#/branches/'+prev.EvolvFlag,'app/config/data/xml/pets.xml#'+from,...(origin?.refs||[])]};
  }
  const disguised=config.disguises?.find(r=>r.petId===id);
  if(disguised){
   for(const [mapId,map] of Object.entries(maps))for(const [index,o] of (map.ogres||[]).entries())if(!o.isBoss&&o.catchable!==false&&disguised.hostIds.includes(o.petId))return {text:'在'+map.name+'与'+pet(o.petId)+'对战时可能出现',refs:[exchangeFile+'#/disguises',mapFile+'#/maps/'+mapId+'/ogres/'+index]};
  }
  const miracle=rules.MIRACLES.find(r=>r.weights.some(([target])=>target===id));
  if(miracle)return {text:'「'+pet(miracle.main)+'」奇迹融合的随机结果之一',refs:['PetFusionHandler.js#MIRACLES']};
  return null;
 }
 function petSource(id){const r=route(id);if(r)evidence['pet:'+id]=r;return r;}
 function itemSource(id){const choices=drops.get(id);if(!choices)return null;const unique=[...new Map(choices.map(v=>[v.text,v])).values()];const r={text:unique.map(v=>v.text).join('；'),refs:unique.flatMap(v=>v.refs)};evidence['item:'+id]=r;return r;}
 return {petSource,itemSource,evidence,inputFiles:[mapFile,exchangeFile,evolutionFile]};
};
