'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {buildCatalogue} = require('./pet-boss-handbook-data.cjs');
const args=Object.fromEntries(process.argv.slice(2).reduce((a,v,i,all)=>{if(i%2===0)a.push([v,all[i+1]]);return a},[]));
if(!args['--baseline']||!args['--audit']||!args['--out'])throw Error('Usage: node pet-acquisition-ordinary.cjs --baseline <snapshot> --audit <audit.json> --out <ordinary-routes.json>');
const base=path.resolve(args['--baseline']);
const audit=JSON.parse(fs.readFileSync(args['--audit'],'utf8'));
const zlib=require('node:zlib');
function coreXml(symbol) {
 const raw=fs.readFileSync(path.join(base,'client/assets/dll/NieoCore.swf'));
 const body=raw.subarray(0,3).toString()==='CWS'?zlib.inflateSync(raw.subarray(8)):raw.subarray(8);
 let p=Math.ceil((5+(body[0]>>3)*4)/8)+4;const tags=[];
 while(p<body.length){const h=body.readUInt16LE(p);p+=2;const code=h>>6;let length=h&63;if(length===63){length=body.readUInt32LE(p);p+=4}tags.push({code,payload:body.subarray(p,p+length)});p+=length}
 let symbolId;
 for(const t of tags.filter(x=>x.code===76)){let i=2;for(let n=0;n<t.payload.readUInt16LE(0);n++){const id=t.payload.readUInt16LE(i);i+=2;const end=t.payload.indexOf(0,i);if(t.payload.subarray(i,end).toString()===symbol)symbolId=id;i=end+1}}
 const matches=tags.filter(t=>t.code===87&&t.payload.readUInt16LE(0)===symbolId);
 if(matches.length!==1)throw Error('Core XML symbol missing: '+symbol);
 return matches[0].payload.subarray(6).toString('utf8');
}
const mapXml=coreXml('com.robot.core.manager.map.config.MapConfig_xmlCls');
const ogreXml=coreXml('com.robot.core.config.xml.OgreXMLInfo_xmlClass');
const registered=new Set([...mapXml.matchAll(/<map\s+id="(\d+)"/g)].map(m=>+m[1]));
const positions=new Set([...ogreXml.slice(ogreXml.indexOf('<ogre>'),ogreXml.indexOf('</ogre>')).matchAll(/<item\s+id="(\d+)"\s+pList="([^"]+)"/g)].filter(m=>m[2].split('|').length>=9).map(m=>+m[1]));
const openHabitats=new Set([10,11,12,13,15,16,20,21,22,25,26,27,30,31,40,41,47,48,49,51,52,54,55,56,57,58,60,61,62,64,550,925]);
const nativeTypes=JSON.parse(fs.readFileSync(path.join(__dirname,'../compat/client-patches/fusion-manual/native-types.json'),'utf8')).types;
const data=path.join(base,'app/config/data');
const read=(p)=>fs.readFileSync(path.join(data,p),'utf8');
const json=(p)=>JSON.parse(read('json/'+p));
const attr=s=>Object.fromEntries([...s.matchAll(/(\w+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const parseMonsters=s=>new Map([...s.matchAll(/<Monster\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Monster>)/g)].map(m=>{const p=attr(m[1]); return [+p.ID,{...p,body:m[2]||''}]}));
const pets=parseMonsters(read('xml/pets.xml'));
const spt=parseMonsters(read('xml/spt.xml'));
const skills=new Map([...read('xml/skills.xml').matchAll(/<Move\b([^>]*?)\/>/g)].map(m=>{const a=attr(m[1]);return [+a.ID,a]}));
const maps=json('map-ogres.json').maps, branches=json('special-evolutions.json').branches;
const fusionText=fs.readFileSync(path.join(base,'app/dist/GameServer/Server/Packet/Recv/Pet/PetFusionHandler.js'),'utf8');
const fusion=vm.runInNewContext(fusionText.slice(fusionText.indexOf('const RECIPES = ['),fusionText.indexOf('function petConfig('))+';({RECIPES,MIRACLES,NEIL})');
const cat=new Map(buildCatalogue({base}).pets.map(p=>[p.id,p]));
const high=new Set(audit.entries.filter(e=>e.maxFamilyRating>=70).map(e=>e.petId));
const ordinary=audit.entries.filter(e=>!high.has(e.petId));
if(audit.entries.length!==538||high.size!==49||ordinary.length!==489)throw Error('audit partition changed');
const current=new Set(json('pet-acquisition.json').exchange.petIds);
if(current.size!==538||audit.entries.some(e=>!current.has(e.petId)))throw Error('current exchange differs from audit');
const edges=new Map(), incoming=new Map();
for(const [id,p] of pets){
 const destinations=+p.EvolvingLv>0 ? (+p.EvolvFlag ? (branches[p.EvolvFlag]||[]).map(x=>({id:+x.petId,itemId:+x.itemId,count:+x.count})) : (+p.EvolvesTo?[{id:+p.EvolvesTo,itemId:0,count:0}]:[])) : [];
 edges.set(id,destinations.filter(e=>pets.has(e.id)));
 for(const e of edges.get(id)){if(!incoming.has(e.id))incoming.set(e.id,[]);incoming.get(e.id).push(id);}
}
function descendants(id){const found=new Set(),queue=[id];while(queue.length){const n=queue.pop();if(found.has(n))continue;found.add(n);for(const e of edges.get(n)||[])queue.push(e.id)}return [...found].sort((a,b)=>a-b)}
function ancestors(id){const found=new Set(),queue=[id];while(queue.length){const n=queue.pop();if(found.has(n))continue;found.add(n);queue.push(...(incoming.get(n)||[]))}return [...found].sort((a,b)=>a-b)}
const protectedForms=new Set([...high].flatMap(descendants));
const cross=ordinary.filter(e=>descendants(e.petId).some(n=>protectedForms.has(n))).map(e=>e.petId);
if(cross.length)throw Error('ordinary descendants intersect high families: '+cross.join(','));
const repeat=new Map(), reachable=new Map();
const addReach=(id,source,isRepeat)=>{if(!reachable.has(id))reachable.set(id,source);if(isRepeat&&!repeat.has(id))repeat.set(id,source)};
for(const [mid,map] of Object.entries(maps))for(const o of map.ogres||[])if(registered.has(+mid)&&positions.has(+mid)&&!o.isBoss&&o.catchable!==false&&o.refreshConfig?.enabled&&o.weight>0)addReach(+o.petId,{kind:'wild',mapId:+mid,text:map.name+'捕捉'+(pets.get(+o.petId)?.DefName||o.petId)},true);
for(const [id,p] of cat)for(const r of p.acquisition||[]){
 if(r.kind==='wild' && r.target?.mapId && registered.has(+r.target.mapId) && positions.has(+r.target.mapId) && !r.text.includes('前置获取'))addReach(id,r,true);
 else if(['task','boss'].includes(r.kind)&&!r.text.includes('融合')&&!r.text.includes('元神珠')&&!r.text.includes('米色')&&!r.text.includes('前置获取'))addReach(id,r,false);
}
function expand(){let changed=true;while(changed){changed=false;for(const [id,source] of [...reachable])for(const e of edges.get(id)||[]){if(e.count>0)continue;if(!reachable.has(e.id)){reachable.set(e.id,{kind:'evolution',from:id,level:+pets.get(id).EvolvingLv,text:`${pets.get(id).DefName}达到${pets.get(id).EvolvingLv}级进化`});changed=true;}if(repeat.has(id)&&!repeat.has(e.id)){repeat.set(e.id,{kind:'evolution',from:id,level:+pets.get(id).EvolvingLv,text:`可重复获取${pets.get(id).DefName}并进化`});changed=true;}}}}
expand();
const parentIds=new Set(fusion.RECIPES.flatMap(r=>[...r.main,...r.sub]).concat(fusion.MIRACLES.map(r=>r.main)));
const collectionReview={
 126:'拉博、库博全部可学技能已核对；气力、斗气和双防强化是常规强化，绝一闪等为攻击，无比例削血、消强、回复或自爆接力。全家族不含固定或奇迹主副亲本。',
 351:'磁碟怪、双碟怪、迪斯凯特全部可学技能已核对；绝对静止、折光、相位光波分别提供防御强化、单次抵挡及转移自身降级，无比例削血、消强、回复或自爆接力。全家族不含固定或奇迹主副亲本。'
};
for(const id of Object.keys(collectionReview).map(Number)){
 if(reachable.has(id)||incoming.has(id)||descendants(id).some(n=>parentIds.has(n)||protectedForms.has(n)))throw Error('collection review prerequisites changed: '+id);
 addReach(id,{kind:'collection',text:'每日签到领取'+pets.get(id).DefName},false);
}
expand();
const habitat={'草':[11,12,56,550],'水':[20,21,22,57],'火':[15,16,54,55],'飞行':[10,25,26,27],'电':[30,31],'机械':[30,31,550],'地面':[49,54,55,57,64],'普通':[13,47,48,54,550],'冰':[40,41,51,52],'超能':[60,550],'战斗':[58,925,550],'光':[61,550],'暗影':[62],'神秘':[61,62],'龙':[60,550],'次元':[61,62]};
const usableMaps=Object.entries(maps).map(([id,m])=>({id:+id,map:m,normal:(m.ogres||[]).filter(o=>!o.isBoss&&o.catchable!==false&&o.refreshConfig?.enabled&&o.weight>0)})).filter(m=>openHabitats.has(m.id)&&registered.has(m.id)&&positions.has(m.id)&&m.normal.length&&m.map.spawnCount>0);
const additions=[],addedCount=new Map();
function addWild(id,why){
 if(protectedForms.has(id) && id!==1216)throw Error('protected form requested as wild '+id);
 const p=pets.get(id);if(!p)throw Error('missing pet '+id);
 const components=(nativeTypes[p.Type]||'').split(' '), allowed=new Set(components.flatMap(t=>habitat[t]||[]));
 const candidates=usableMaps.filter(m=>allowed.has(m.id)).map(m=>({...m,extra:addedCount.get(m.id)||0})).sort((a,b)=>a.extra-b.extra||a.normal.length-b.normal.length||a.id-b.id);
 if(!candidates.length)throw Error('No registered habitat with nine wild positions for type '+p.Type+' '+p.DefName);
 const m=candidates[0], template=m.normal.find(o=>pets.get(+o.petId)?.Type===p.Type)||m.normal[0];
 const entry=JSON.parse(JSON.stringify(template));entry.petId=id;entry.shiny=0;entry.slot=(m.map.ogres||[]).length+(addedCount.get(m.id)||0);entry.dropItems=[];entry.refreshConfig.shinyPetId=-1;entry.refreshConfig.shinyRate=0;
 additions.push({mapId:m.id,entry,reason:why});addedCount.set(m.id,(addedCount.get(m.id)||0)+1);
 addReach(id,{kind:'wild',mapId:m.id,text:m.map.name+'捕捉'+p.DefName},true);expand();
}
// An existing parent family may only have an irreversible task/boss reward.
// Preserve protected high-value branches; their repeatability is integrated by the owner.
const protectedParents=[];
for(const id of [...parentIds].sort((a,b)=>a-b)){
 if(repeat.has(id))continue;
 const roots=ancestors(id).filter(n=>!protectedForms.has(n)&&descendants(n).includes(id)&&descendants(n).every(d=>!protectedForms.has(d)));
 if(!roots.length){if(id===1216){addWild(id,'高优先级负责人确认：固定融合副亲本需要可重复野外来源');continue;}protectedParents.push(id);continue;}
 const root=roots.find(n=>!incoming.has(n))||roots[0];
 addWild(root,'融合亲本'+id+'可重复获取');
 if(!repeat.has(id))addWild(id,'融合亲本直接可重复获取');
}
for(const e of ordinary){
 if(reachable.has(e.petId))continue;
 const roots=ancestors(e.petId).filter(n=>descendants(n).every(d=>!protectedForms.has(d)));
 const root=roots.find(n=>!incoming.has(n))||roots[0]||e.petId;
 if(!reachable.has(root))addWild(root,'原领取精灵家族的普通捕捉来源');
 if(!reachable.has(e.petId))addWild(e.petId,'分支进化材料未确认，提供可玩捕捉来源');
}
const deps=[];
for(const r of fusion.RECIPES){
 for(const role of ['main','sub'])for(const id of r[role])deps.push({kind:'fixed',resultPetId:r.pet,rarePetId:r.rare?.pet||null,role,petId:id,source:repeat.get(id)||null,requiresHighOwner:!repeat.has(id),essenceItemId:r.essence});
}
for(const r of fusion.MIRACLES){
 deps.push({kind:'miracle',role:'main',petId:r.main,results:r.weights.map(([id,weight])=>({petId:id,weight})),essenceItemId:r.essence,source:repeat.get(r.main)||null,requiresHighOwner:!repeat.has(r.main)});
 const choice=[...repeat.keys()].filter(id=>+pets.get(id)?.Type===r.type||fusion.NEIL.includes(id)).sort((a,b)=>a-b)[0];
 if(!choice)throw Error('no repeat miracle sub type '+r.type);
 deps.push({kind:'miracle',role:'sub',mainPetId:r.main,petId:choice,requiredType:r.type,source:repeat.get(choice),results:r.weights.map(([id])=>id)});
}
function skillEvidence(id){return descendants(id).map(n=>{const ids=new Set();for(const body of [pets.get(n)?.body||'',spt.get(n)?.body||'']){const part=body.match(/<LearnableMoves>([\s\S]*?)<\/LearnableMoves>/)?.[1]||'';for(const m of part.matchAll(/<Move\b([^>]*?)\/>/g)){const a=attr(m[1]);if(+a.LearningLv<=100)ids.add(+a.ID)}}return {petId:n,name:pets.get(n)?.DefName,skills:[...ids].sort((a,b)=>a-b).map(i=>({id:i,name:skills.get(i)?.Name||'',sideEffect:skills.get(i)?.SideEffect||'',sideEffectArg:skills.get(i)?.SideEffectArg||''})),rating:cat.get(n)?{overall:cat.get(n).score}:null}})}
const routes=ordinary.map(e=>({petId:e.petId,disposition:reachable.get(e.petId).kind==='collection'?'collection':reachable.get(e.petId).kind==='wild'?'wild':'existing',source:reachable.get(e.petId),family:{ancestors:ancestors(e.petId),descendants:descendants(e.petId)},skillEvidence:skillEvidence(e.petId),...(collectionReview[e.petId]?{collectionReview:collectionReview[e.petId]}:{}),entryVerification:'pending',acquisitionVerification:'pending'}));
const result={routes,collectionPetIds:Object.keys(collectionReview).map(Number),wildAdditions:additions,fusionDependencies:deps,checks:{exchangeCount:current.size,highPriorityCount:high.size,ordinaryCount:routes.length,uniqueOrdinaryCount:new Set(routes.map(r=>r.petId)).size,reachableOrdinaryCount:routes.filter(r=>r.source).length,protectedParentsNeedingIntegration:protectedParents,entryVerification:'pending',acquisitionVerification:'pending',evolutionClosure:'普通和无道具特殊进化；道具条件不假定可达',spawnRule:'普通池按权重独立抽样，配置slot是候选索引；实体槽随机分配，清空或重新进图重抽',mapEvidence:'Core地图表注册且野怪坐标至少9个；按属性或复合属性明确生境分配，实际入口仍待实测',mapCounts:Object.fromEntries(addedCount)}};
fs.writeFileSync(path.resolve(args['--out']),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result.checks));
