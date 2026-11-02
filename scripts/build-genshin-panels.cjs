'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {parseSwf, encodeSwf} = require('./build-universe-extended-species.cjs');
const {values} = parseArgs({options: Object.fromEntries(['baseline','out','java','ffdec','target','boss-plan'].map(key => [key,{type:'string'}]))});
for (const key of ['baseline','out','java','ffdec']) if (!values[key]) throw Error('Missing --'+key);
const base=path.resolve(values.baseline), out=path.resolve(values.out), root=path.resolve(__dirname,'..');
const sources=path.join(root,'compat/client-patches/genshin-panels');
const art=fs.readFileSync(path.join(sources,'panel-art.asinc'),'utf8');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const check=(condition,message)=>{if(!condition)throw Error(message);};
const tagName=tag=>tag.code===82?tag.payload.subarray(4,tag.payload.indexOf(0,4)).toString():null;
const bossPlan=values['boss-plan']?JSON.parse(fs.readFileSync(values['boss-plan'],'utf8')):null;
const definitions={
  spt:{file:'SptPanel.swf',class:'com.robot.module.app.SptPanel',template:'SptPanel.as',data:['BOSSES','SPT_REWARDS','GALAXIES']},
  battleassets:{file:'PetFightDLL.swf',class:'com.robot.petFightModule.assetManager.AssetsLoadManager',template:'../spt-boss/battle/scripts/com/robot/petFightModule/assetManager/AssetsLoadManager.as',data:[],art:false},
  puniroster:{file:'NieoCore.swf',class:'com.robot.app.fightLevel.FightMHTController',template:'../spt-boss/core/scripts/com/robot/app/fightLevel/FightMHTController.as',data:[],art:false}
};
// Data and catalogue helper functions are copied from the selected live SWF, never rebuilt from stale game rules.
function endOf(source,start,mode){
  let round=0,square=0,brace=0,quote='',lineComment=false,blockComment=false;
  for(let i=start;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lineComment){if(c==='\n')lineComment=false;continue;}
    if(blockComment){if(c==='*'&&n==='/'){blockComment=false;i++;}continue;}
    if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
    if(c==='"'||c==="'"){quote=c;continue;}
    if(c==='/'&&n==='/'){lineComment=true;i++;continue;}
    if(c==='/'&&n==='*'){blockComment=true;i++;continue;}
    if(c==='(')round++;else if(c===')')round--;else if(c==='[')square++;else if(c===']')square--;
    else if(c==='{')brace++;else if(c==='}'){
      brace--;if(mode==='function'&&brace===0)return i+1;
    }
    if(mode==='const'&&c===';'&&round===0&&square===0&&brace===0)return i+1;
  }
  throw Error('Unterminated '+mode+' at '+start);
}
function dataMember(source,key){
  const expression=new RegExp('private\\s+const\\s+'+key+'\\s*:\\s*[^=;]+\\s*=');
  const found=expression.exec(source);check(found,'Missing live data '+key);
  return source.slice(found.index,endOf(source,found.index,'const'));
}
function dataHelpers(source){
  return [...source.matchAll(/private\s+function\s+(?:buildCatalog|catalog\d+)\s*\(/g)].map(found=>{
    const open=source.indexOf('{',found.index);
    return source.slice(found.index,endOf(source,open,'function'));
  }).join('\n');
}
function run(args){execFileSync(path.resolve(values.java),['-Djava.awt.headless=true','-Xmx2g','-jar',path.resolve(values.ffdec),...args],{stdio:'inherit',timeout:300000});}
const originalCore=parseSwf(fs.readFileSync(path.join(base,'NieoCore.swf')));
const requested=values.target?values.target.split(','):Object.keys(definitions);
const manifest=[];
const composed=new Map();
function selectedData(source,key,name){
  const member=dataMember(source,key);
  if(name!=='spt'||key!=='BOSSES'||!bossPlan)return member;
  const records=JSON.parse(member.slice(member.indexOf('=')+1).replace(/;\s*$/,''));
  const missing=[];
  for(const boss of records){
    const candidates=bossPlan.profiles.filter(p=>p.petId===boss.id&&p.sptId===(boss.sptId||0));
    const profile=candidates.find(p=>p.mapId===boss.mapId)||candidates.find(p=>p.petName===boss.name);
    if(!profile){missing.push({id:boss.id,sptId:boss.sptId,mapId:boss.mapId,name:boss.name});continue;}
    boss.lv=profile.level;boss.hp=profile.hp;
    boss.mech='【'+profile.name+'】'+profile.mechanic;
    if(profile.routeA)boss.mech+='\n对策A：'+profile.routeA+'\n对策B：'+profile.routeB;
    if(profile.native)boss.mech+='\n保留原生阶段与解法，不附加人数任务或输出份额。';
  }
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'spt-guide-coverage.json'),JSON.stringify({records:records.length,missing},null,2)+'\n');
  check(missing.length===0,'SPT catalogue entries without boss rules: '+JSON.stringify(missing));
  return 'private const BOSSES:Array = '+JSON.stringify(records)+';';
}
for(const name of requested){
  const spec=definitions[name];check(spec,'Unknown target '+name);
  const raw=fs.readFileSync(path.join(base,spec.file)),movie=composed.get(spec.file)||parseSwf(raw);
  const work=path.join(out,name), exported=path.join(path.dirname(base),'source-baseline',name,hash(raw));
  const sourceFile=path.join(exported,'scripts',spec.class.replaceAll('.','/')+'.as');
  if(spec.data.length&&!fs.existsSync(sourceFile))run(['-onerror','abort','-selectclass',spec.class,'-export','script',exported,path.join(base,spec.file)]);
  let source=fs.readFileSync(path.join(sources,spec.template),'utf8');
  const baselineSource=spec.data.length?fs.readFileSync(sourceFile,'utf8'):'';
  const helpers=dataHelpers(baselineSource);
  if(source.includes('// @LIVE_DATA@'))source=source.replace('// @LIVE_DATA@',spec.data.map(key=>selectedData(baselineSource,key,name)).join('\n')+'\n'+helpers);
  else {
    for(const key of spec.data){
      const marker=new RegExp('private const '+key+':Array = \\[\\]; // @'+(key==='catalog'?'CATALOG':'METHODOLOGY')+'@');
      check(marker.test(source),'Missing catalogue marker '+name+':'+key);
      source=source.replace(marker,()=>dataMember(baselineSource,key));
    }
    source=source.replace('// @PANEL_ART@',helpers+'\n// @PANEL_ART@');
  }
  if(spec.art!==false){
    check(source.includes('// @PANEL_ART@'),'Missing panel art marker in '+name);
    source=source.replace('// @PANEL_ART@',art);
  }
  const importDir=path.join(work,'import','scripts',path.dirname(spec.class.replaceAll('.','/')));
  fs.mkdirSync(importDir,{recursive:true});fs.writeFileSync(path.join(importDir,path.basename(spec.class.replaceAll('.','/'))+'.as'),source);
  const code=movie.tags.map((tag,index)=>({tag,index})).filter(entry=>entry.tag.code===82);
  const named=code.filter(entry=>tagName(entry.tag)===spec.class.replaceAll('.','/'));
  check(named.length===1||code.length===1,'Ambiguous live ABC for '+name);
  const target=(named.length===1?named[0]:code[0]).index;
  const coreTarget=spec.file==='NieoCore.swf';
  const linkingCore=composed.get('NieoCore.swf')||originalCore;
  const context=coreTarget?movie:{...movie,tags:movie.tags.flatMap((tag,index)=>index===target?[...linkingCore.tags.filter(t=>t.code===82),tag]:[tag])};
  const input=path.join(work,'context.swf'),compiled=path.join(work,'compiled.swf');
  fs.writeFileSync(input,encodeSwf(context));
  run(['-onerror','abort','-importScript',input,compiled,path.join(work,'import')]);
  const compiledTags=parseSwf(fs.readFileSync(compiled)).tags;
  check(compiledTags.length===context.tags.length,'Compiler changed tag count '+name);
  const compiledTarget=target+(coreTarget?0:context.tags.length-movie.tags.length);
  const replacement=compiledTags[compiledTarget];
  check(replacement?.code===82&&tagName(replacement)===tagName(movie.tags[target]),'Compiled target ABC changed identity '+name);
  const final=encodeSwf({...movie,tags:movie.tags.map((tag,index)=>index===target?replacement:tag)});
  const verified=parseSwf(final);
  check(verified.tags.length===movie.tags.length,'Tag count changed '+name);
  check(movie.tags.every((tag,index)=>index===target||tag.raw.equals(verified.tags[index].raw)),'Unrelated tag changed '+name);
  const destination=path.join(out,spec.file);fs.writeFileSync(destination,final);
  const previous=manifest.findIndex(record=>record.file===spec.file);
  const changedTags=previous<0?[target]:[...manifest[previous].changedTags,target];
  const changedClasses=previous<0?[spec.class]:[...manifest[previous].changedClasses,spec.class];
  const receipt={name,file:spec.file,class:spec.class,before:hash(raw),after:hash(final),changedTag:target,changedTags,changedClasses,protectedTags:movie.tags.length-changedTags.length,bytes:final.length};
  if(previous>=0)manifest.splice(previous,1);
  composed.set(spec.file,verified);
  fs.writeFileSync(path.join(work,'manifest.json'),JSON.stringify(receipt,null,2)+'\n');manifest.push(receipt);
  console.log(JSON.stringify(receipt));
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
