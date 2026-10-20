'use strict';
// Reconcile the native local-map protocol without changing the player's persistent map.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {values: v} = parseArgs({options:Object.fromEntries(['baseline','out','context','java','ffdec'].map(name=>[name,{type:'string'}]))});
for(const name of ['baseline','out','context','java','ffdec'])if(!v[name])throw Error('Missing --'+name);
const baseline=path.resolve(v.baseline),out=path.resolve(v.out),root=path.resolve(__dirname,'..');
const ts=require(path.join(path.resolve(v.context),'node_modules/typescript'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function check(condition,message){if(!condition)throw Error(message);}
const files=[];
function put(relative,bytes){
  const target=path.join(out,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  files.push({path:relative,before:sha(fs.readFileSync(path.join(baseline,relative))),after:sha(Buffer.from(bytes))});
}
for(const [dir,ext] of [['src','ts'],['dist','js']]){
  const relative=`app/${dir}/GameServer/Server/Packet/Recv/Battle/ChallengeBossHandler.${ext}`;
  const text=fs.readFileSync(path.join(baseline,relative),'utf8');
  const ast=ts.createSourceFile(relative,text,ts.ScriptTarget.Latest,true),anchors=[];
  (function visit(node){
    if(ts.isIfStatement(node)&&node.expression.getText(ast)==='mapId === 0')anchors.push(node);
    ts.forEachChild(node,visit);
  })(ast);
  check(anchors.length===1&&!text.includes('mapId === 108'),'Unexpected challenge handler baseline');
  const end=anchors[0].end,indent=ext==='ts'?'    ':'        ';
  const patch=`
${indent}// Native map 514 is local-only; the server still records tower entrance 108.
${indent}if (mapId === 108) {
${indent}    mapId = 514;
${indent}}`;
  const result=text.slice(0,end)+patch+text.slice(end);
  check(ts.createSourceFile(relative,result,ts.ScriptTarget.Latest,true).parseDiagnostics.length===0,'Invalid handler syntax');
  put(relative,result);
  if(ext==='js'){
    const mapRelative=relative+'.map';
    if(fs.existsSync(path.join(baseline,mapRelative))){const map=JSON.parse(fs.readFileSync(path.join(baseline,mapRelative),'utf8'));map.mappings='';put(mapRelative,JSON.stringify(map));}
  }
}
function parse(raw){
  check(raw.subarray(0,3).toString()==='CWS','Expected compressed Core');
  const body=zlib.inflateSync(raw.subarray(8));
  check(body.length+8===raw.readUInt32LE(4),'Invalid Core length');
  let offset=Math.ceil((5+(body[0]>>3)*4)/8)+4;
  const header=body.subarray(0,offset),tags=[];
  while(offset<body.length){
    const start=offset,short=body.readUInt16LE(offset);offset+=2;
    const code=short>>6;let size=short&63;
    if(size===63){size=body.readUInt32LE(offset);offset+=4;}
    const payload=body.subarray(offset,offset+size);offset+=size;
    tags.push({code,name:code===82?payload.subarray(4,payload.indexOf(0,4)).toString():null,raw:body.subarray(start,offset)});
    if(!code)break;
  }
  check(offset===body.length,'Invalid Core tags');return {raw,header,tags};
}
const coreRelative='client/assets/dll/NieoCore.swf',key='com/robot/app/mapProcess/MapProcess_514';
const original=parse(fs.readFileSync(path.join(baseline,coreRelative)));
const oldTag=original.tags.filter(t=>t.name===key);
check(oldTag.length===1&&sha(oldTag[0].raw)==='3850975058e89e2f291acec4fd9b436e9648c980bf6a4c30871e5a4dabcb9ac4','Native Puni class changed; reconcile before building');
const imports=path.join(out,'compiler/import/scripts'),target=path.join(imports,key+'.as');
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.copyFileSync(path.join(root,'compat/client-patches/puni-entry/MapProcess_514.as'),target);
const compiled=path.join(out,'compiler/compiled.swf');
execFileSync(v.java,['-Djava.awt.headless=true','-jar',v.ffdec,'-onerror','abort','-importScript',path.join(baseline,coreRelative),compiled,path.dirname(imports)],{stdio:'inherit',timeout:120000});
const changed=parse(fs.readFileSync(compiled)).tags.filter(t=>t.name===key);
check(changed.length===1&&!changed[0].raw.equals(oldTag[0].raw),'Puni class was not rebuilt');
const body=Buffer.concat([original.header,...original.tags.map(t=>t.name===key?changed[0].raw:t.raw)]);
const length=Buffer.alloc(4);length.writeUInt32LE(body.length+8);
const core=Buffer.concat([original.raw.subarray(0,4),length,zlib.deflateSync(body,{level:9})]);
const result=parse(core);
check(result.tags.length===original.tags.length&&result.tags.every((t,i)=>t.name===key||t.raw.equals(original.tags[i].raw)),'Unrelated Core tags changed');
put(coreRelative,core);
const protectedPaths=['app/config/data/json/boss_abilities.json','app/config/data/json/puni_config.json','app/dist/GameServer/Game/Battle/BattleManager.js','app/dist/GameServer/Game/Battle/PuniSealBattle.js'];
const protectedInputs=Object.fromEntries(protectedPaths.map(relative=>[relative,sha(fs.readFileSync(path.join(baseline,relative)))]));
const manifest={files,protectedInputs,changedNativeClasses:[key],unrelatedNativeTagsPreserved:true,restartGame:true,restartWeb:false};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
