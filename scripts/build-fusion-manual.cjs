'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {parseArgs}=require('node:util');
const {values}=parseArgs({options:{baseline:{type:'string'},out:{type:'string'},java:{type:'string'},ffdec:{type:'string'}}});
for(const name of ['baseline','out','java','ffdec']) if(!values[name]) throw Error('Missing --'+name);
const root=path.resolve(__dirname,'..'),base=path.resolve(values.baseline),out=path.resolve(values.out);
const sourceDir=path.join(root,'compat/client-patches/fusion-manual');
const modulePath='client/assets/module/com/robot/module/book/PetAmalgamationBookPanel.swf';
const corePath='client/assets/dll/NieoCore.swf';
const handlerPath='app/dist/GameServer/Server/Packet/Recv/Pet/PetFusionHandler.js';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const copy=JSON.parse(fs.readFileSync(path.join(sourceDir,'manual-copy.json'),'utf8'));
const handler=fs.readFileSync(path.join(base,handlerPath),'utf8');
const from=handler.indexOf('const RECIPES = ['),to=handler.indexOf('function petConfig(');
check(from>=0&&to>from,'Unknown fusion rule layout');
const rules=vm.runInNewContext(handler.slice(from,to)+';({RECIPES,MIRACLES,BEIGE,NEIL,ESSENCE_BY_TYPE})',{},{timeout:1000});
check(rules.RECIPES.length===33&&rules.MIRACLES.length===12,'Fusion catalogue changed; review coverage before building');
function attributes(s){return Object.fromEntries([...s.matchAll(/([\w]+)="([^"]*)"/g)].map(m=>[m[1],m[2].replaceAll('&amp;','&')]));}
function xmlIndex(file,tag){return Object.fromEntries([...fs.readFileSync(path.join(base,file),'utf8').matchAll(new RegExp('<'+tag+'\\b([^>]+)>','g'))].map(m=>{const a=attributes(m[1]);return [a.ID,a];}));}
const pets=xmlIndex('app/config/data/xml/pets.xml','Monster'),items=xmlIndex('app/config/data/xml/items.xml','Item');
const pet=id=>{check(pets[id]&&pets[id].DefName,'Missing pet '+id);return pets[id].DefName;};
const item=id=>{check(items[id]&&items[id].Name,'Missing item '+id);return items[id].Name;};
const types=['','草','水','火','飞行','电','机械','地面','普通','冰','超能','战斗','光','暗影','神秘','龙'];
const common='1  每条消耗主宠、副宠、对应精华 1 个、1000 赛尔豆。\n2  主宠必须是最终形态。副宠用斜杠分隔时，任选一只。\n3  材料槽只放对应精华 1 个，放入其他融合材料也会被消耗。';
const catalogue=[];
function acquisition(names){const lines=[];for(const [name,content] of Object.entries(copy.acquisition)){if(names.includes(name)||(name==='吉尔'&&names.includes('里诺')))lines.push((name==='吉尔'?'吉尔、里诺':name)+'：'+content);}return lines.join('\n');}
function accent(soul){const name=item(soul),color=name.replace('元神珠','');check(copy.orbColors[color],'Unknown bead color '+name);return parseInt(copy.orbColors[color].slice(1),16);}
function entry(rule,index){
  check(rule.main.length===1,'Multiple fixed main pets need UI review');
  const approved=copy.fixedLabels[index];
  check(pet(rule.pet)===approved.name&&pet(rule.main[0])===approved.main&&rule.sub.map(pet).join('/')===approved.secondary,'Fixed pet labels differ from approved copy at '+index);
  check(item(rule.essence)===approved.essence&&item(rule.soul)===approved.color+'元神珠','Fixed ingredient differs at '+index);
  return {id:'fixed-'+(index+1),kind:'fixed',name:pet(rule.pet),petId:rule.pet,main:pet(rule.main[0]),mainId:rule.main[0],secondary:rule.sub.map(pet).join(' / '),secondaryIds:rule.sub,essence:item(rule.essence),essenceId:rule.essence,soul:item(rule.soul),soulId:rule.soul,accent:accent(rule.soul),type:types[Number(pets[rule.pet].Type)]||'',rareId:rule.rare?'rare-'+rule.rare.pet:null,
    acquisition:acquisition([pet(rule.main[0]),pet(rule.pet),...rule.sub.map(pet),item(rule.essence)]),notes:common+(rule.pet===301?'\n4  绿色元神珠直接得到黄金布布。':'')+(rule.pet===600?'\n4  配方标记：火刃。':'')};
}
rules.RECIPES.forEach((r,i)=>catalogue.push(entry(r,i)));
for(const [i,rule] of rules.MIRACLES.entries()){
  const weights=new Map();
  for(const [id,w] of rule.weights){check(Number.isFinite(w)&&w>0,'Invalid outcome weight');weights.set(id,(weights.get(id)||0)+w);}
  const total=[...weights.values()].reduce((a,b)=>a+b,0);
  const outcomes=[...weights].map(([id,weight])=>{const probability=weight/total*100;return {petId:id,name:pet(id),weight,probability,percent:Number(probability.toFixed(probability<0.1?4:2))+'%'};});
  catalogue.push({id:'miracle-'+(i+1),kind:'miracle',name:pet(rule.main),main:pet(rule.main),mainId:rule.main,secondary:'同属性精灵 / '+rules.NEIL.map(pet).join(' / '),essence:item(rule.essence),essenceId:rule.essence,soul:item(rule.soul),soulId:rule.soul,accent:accent(rule.soul),type:types[rule.type],outcomes,
    acquisition:acquisition([pet(rule.main),item(rule.essence)]),notes:common+'\n4  副宠须与主宠同属性，或为闪光尼尔 / 闪光菲斯利 / 闪光艾菲亚。\n5  闪光尼尔、闪光菲斯利、闪光艾菲亚是同一系，可作为奇迹融合的副宠。'+(rule.main===239?'\n6  光系没有单独晶体，吉娜斯使用纯净能量。':'')});
}
check(rules.BEIGE.pets.map(pet).join('/')==='卡门兔/辛克/伊达','Fallback pool changed');
catalogue.push({id:'fallback',kind:'fallback',name:'未匹配配方融合',main:'最终形态主宠',secondary:'可作融合材料的副宠',essence:'主宠属性对应精华',soul:item(rules.BEIGE.soul),soulId:rules.BEIGE.soul,accent:accent(rules.BEIGE.soul),acquisition:'',outcomes:rules.BEIGE.pets.map(id=>({petId:id,name:pet(id),probability:100/3,percent:'33.33%'})),notes:common+'\n4  固定、奇迹配方均未匹配，且副宠可当融合材料时适用。\n5  精华不够不会扣精灵。'});
for(const id of [...new Set(rules.RECIPES.filter(r=>r.rare).map(r=>r.rare.pet))]){
  const sources=rules.RECIPES.map((r,i)=>({r,i})).filter(({r})=>r.rare&&r.rare.pet===id);
  check(sources.every(({r})=>r.rare.numerator/r.rare.denominator===0.05),'Rare probability changed');
  catalogue.push({id:'rare-'+id,kind:'rare',name:pet(id),petId:id,soul:'粉色元神珠',accent:0xF49ACC,sources:sources.map(({i})=>'fixed-'+(i+1)),acquisition:'',notes:common});
}
const nativeTypes=JSON.parse(fs.readFileSync(path.join(sourceDir,'native-types.json'),'utf8'));
check(nativeTypes.coreSha256===hash(fs.readFileSync(path.join(base,corePath))),'Native type names need review against the new Core');
const sources=require('./fusion-manual-acquisition.cjs')({base,pets,pet,item,rules});
for(const r of catalogue){
 r.typeId=Number(pets[r.petId??r.mainId]?.Type)||0;
 r.type=r.typeId?nativeTypes.types[r.typeId]:"";
 check(!r.typeId||r.type,'Unknown native type '+r.typeId);
 r.typeParts=r.type?r.type.split(' ').map(name=>Number(Object.keys(nativeTypes.types).find(id=>Number(id)<=20&&nativeTypes.types[id]===name))):[];
 check(r.typeParts.every(id=>id>0),'Unknown badge component');
 const extra=[];
 for(const id of [r.mainId,...(r.secondaryIds||[])].filter(Boolean)){
  if(copy.acquisition[pet(id)]||(pet(id)==='里诺'&&copy.acquisition['吉尔']))continue;
  const source=sources.petSource(id);if(source)extra.push(pet(id)+'：'+source.text+'。');
 }
 if(r.essenceId&&!copy.acquisition[r.essence]){const source=sources.itemSource(r.essenceId);if(source)extra.push(r.essence+'：'+source.text+'。');}
 r.acquisition=[r.acquisition,...extra].filter(Boolean).join('\n');
}
for(const r of catalogue)r.search=[r.name,r.main,r.secondary,r.essence,r.soul,r.type,...(r.outcomes||[]).map(o=>o.name)].filter(Boolean).join(' ');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'acquisition-evidence.json'),JSON.stringify(sources.evidence,null,2)+'\n');
fs.writeFileSync(path.join(out,'catalogue.json'),JSON.stringify(catalogue,null,2)+'\n');
function parse(raw){
  const signature=raw.subarray(0,3).toString();check(['CWS','FWS'].includes(signature),'Unsupported SWF');
  const body=signature==='CWS'?zlib.inflateSync(raw.subarray(8)):raw.subarray(8);
  let pos=Math.ceil((5+(body[0]>>3)*4)/8)+4;
  const header=body.subarray(0,pos),tags=[];
  while(pos<body.length){const start=pos,short=body.readUInt16LE(pos);pos+=2;const code=short>>6;let size=short&63;if(size===63){size=body.readUInt32LE(pos);pos+=4;}const payload=body.subarray(pos,pos+size);pos+=size;tags.push({code,payload,raw:body.subarray(start,pos)});if(code===0)break;}
  check(pos===body.length,'Invalid SWF tag stream');return {raw,signature,header,tags};
}
function encode(swf,tags){const body=Buffer.concat([swf.header,...tags.map(t=>t.raw)]),head=Buffer.from(swf.raw.subarray(0,8));head.writeUInt32LE(body.length+8,4);return Buffer.concat([head,swf.signature==='CWS'?zlib.deflateSync(body,{level:9}):body]);}
const original=parse(fs.readFileSync(path.join(base,modulePath))),core=parse(fs.readFileSync(path.join(base,corePath)));
check(original.tags.filter(t=>t.code===82).length===1,'Expected one module ABC');
const context=encode(original,original.tags.flatMap(t=>t.code===82?[...core.tags.filter(t=>t.code===82),t]:[t]));
const compiler=path.join(out,'compiler'),importFolder=path.join(compiler,'import/scripts/com/robot/module/book');
fs.mkdirSync(importFolder,{recursive:true});
fs.writeFileSync(path.join(compiler,'context.swf'),context);
const source=fs.readFileSync(path.join(sourceDir,'PetAmalgamationBookPanel.as'),'utf8');
check(source.includes('private const catalog:Array = []; // @CATALOG@'),'Missing data marker');
const compiledSource=source.replace('private const catalog:Array = []; // @CATALOG@','private const catalog:Array = '+JSON.stringify(catalogue)+';');
fs.writeFileSync(path.join(importFolder,'PetAmalgamationBookPanel.as'),compiledSource);
const run=args=>execFileSync(values.java,['-Djava.awt.headless=true','-jar',values.ffdec,...args],{stdio:'inherit',timeout:180000});
run(['-onerror','abort','-importScript',path.join(compiler,'context.swf'),path.join(compiler,'compiled.swf'),path.join(compiler,'import')]);
const compiled=parse(fs.readFileSync(path.join(compiler,'compiled.swf')));
const replacement=compiled.tags.filter(t=>t.code===82).at(-1);
check(replacement&&!replacement.raw.equals(original.tags.find(t=>t.code===82).raw),'Module was not changed');
const result=encode(original,original.tags.map(t=>t.code===82?replacement:t));
const final=parse(result);
check(final.tags.length===original.tags.length&&final.tags.every((t,i)=>t.code===82||t.raw.equals(original.tags[i].raw)),'Non-code native tags changed');
const target=path.join(out,'client/overlay/module/com/robot/module/book/PetAmalgamationBookPanel.swf');
fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,result);
const manifest={sourceBaseline:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:[{path:'client/overlay/module/com/robot/module/book/PetAmalgamationBookPanel.swf',sha256:hash(result)}],inputs:{acquisition:Object.fromEntries(sources.inputFiles.map(file=>[file,hash(fs.readFileSync(path.join(base,file)))])),module:hash(original.raw),core:hash(core.raw),fusionHandler:hash(handler),pets:hash(fs.readFileSync(path.join(base,'app/config/data/xml/pets.xml'))),items:hash(fs.readFileSync(path.join(base,'app/config/data/xml/items.xml')))},counts:{fixed:33,miracle:12,rare:2,fallback:1},nativeEntry:'实验室 > 精灵融合手册 > BookId.BOOK_1',nonCodeTagsPreserved:true,coreChanged:false,serverChanged:false,playerDataChanged:false,networkWrites:false};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest));
