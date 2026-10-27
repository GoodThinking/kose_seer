'use strict';
const fs=require('node:fs'),path=require('node:path');
// Read only server-backed routes. Historical dex descriptions are deliberately unused.
module.exports=function({base,pet}) {
 const mapFile='app/config/data/json/map-ogres.json';
 const maps=JSON.parse(fs.readFileSync(path.join(base,mapFile),'utf8')).maps;
 const drops=new Map(),evidence={};
 const add=(index,id,value)=>{if(!index.has(id))index.set(id,[]);index.get(id).push(value);};
 const levels=o=>o.level!=null?o.level+'级':o.minLevel!=null&&o.maxLevel!=null?(o.minLevel===o.maxLevel?o.minLevel:o.minLevel+'–'+o.maxLevel)+'级':'';
 for(const [mapId,map] of Object.entries(maps))for(const [index,o] of (map.ogres||[]).entries()){
  if(!map.name||o.isBoss||Number(o.weight??1)<=0)continue;
  const ref=mapFile+'#/maps/'+mapId+'/ogres/'+index;
  for(const d of o.dropItems||[])if(d.dropRate>0&&d.dropRate<=1&&d.maxCount>0)add(drops,d.itemId,{text:map.name+'击败'+levels(o)+pet(o.petId)+'，掉率 '+Number((d.dropRate*100).toFixed(2))+'%',refs:[ref+'/dropItems']});
 }
 let handbook;
 function petSource(id){
  if(!handbook)handbook=new Map(require('./pet-boss-handbook-data.cjs').buildCatalogue({base}).pets.map(p=>[p.id,p.acquisition]));
  const routes=(handbook.get(id)||[]).filter(r=>r.kind!=='unknown');
  if(!routes.length)return null;
  const result={text:routes.map(r=>r.text).join('；'),refs:routes.flatMap(r=>r.refs||[])};
  evidence['pet:'+id]=result;return result;
 }
 function itemSource(id){const choices=drops.get(id);if(!choices)return null;const unique=[...new Map(choices.map(v=>[v.text,v])).values()];const r={text:unique.map(v=>v.text).join('；'),refs:unique.flatMap(v=>v.refs)};evidence['item:'+id]=r;return r;}
 return {petSource,itemSource,evidence,inputFiles:[mapFile]};
};
