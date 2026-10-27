'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {values} = require('node:util').parseArgs({options:Object.fromEntries(['baseline','out','java','ffdec'].map(name=>[name,{type:'string'}]))});
for(const name of ['baseline','out','java','ffdec'])assert.ok(values[name],'Missing --'+name);
const root = path.resolve(__dirname,'..'), baseline = path.resolve(values.baseline), out = path.resolve(values.out);
assert.ok(!fs.existsSync(out),'Choose a fresh output directory');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const guard = JSON.parse(fs.readFileSync(path.join(root,'compat/client-patches/catch-bag-sync/baseline.json'),'utf8'));
for(const [relative,expected] of Object.entries(guard))assert.equal(sha(fs.readFileSync(path.join(baseline,relative))),expected,'Live target changed: '+relative);
const files = [];
function put(relative,bytes){
  const target=path.join(out,relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  files.push({path:relative,before:guard[relative],after:sha(bytes)});
}
function parse(raw){
  assert.ok(['CWS','FWS'].includes(raw.subarray(0,3).toString()));
  const body=raw.subarray(0,3).toString()==='CWS'?zlib.inflateSync(raw.subarray(8)):raw.subarray(8);
  assert.equal(body.length+8,raw.readUInt32LE(4));
  let at=Math.ceil((5+(body[0]>>3)*4)/8)+4;
  const header=body.subarray(0,at),tags=[];
  while(at<body.length){
    const begin=at,short=body.readUInt16LE(at);at+=2;
    const code=short>>6;let size=short&63;
    if(size===63){size=body.readUInt32LE(at);at+=4;}
    const payload=body.subarray(at,at+size);at+=size;
    tags.push({code,name:code===82?payload.subarray(4,payload.indexOf(0,4)).toString():null,raw:body.subarray(begin,at)});
    if(!code)break;
  }
  assert.equal(at,body.length);return {raw,header,tags};
}
function encode(source,tags){
  const body=Buffer.concat([source.header,...tags.map(tag=>tag.raw)]),head=Buffer.from(source.raw.subarray(0,8));
  head.write('CWS',0);head.writeUInt32LE(body.length+8,4);
  return Buffer.concat([head,zlib.deflateSync(body)]);
}
const serverRelative='app/dist/GameServer/Server/Packet/Recv/NoNo/PetWorkflowHandlers.js';
const server=fs.readFileSync(path.join(root,'compat/server-patches/pet-workflow/PetWorkflowHandlers.js'),'utf8');
const previous="  if (input.operation === 'state') return reply(player, 91020, storageState(player));";
const next="  if (input.operation === 'state') return reply(player, 91020, storageState(player), player.PetManager.GetPetsInBag());";
assert.equal(sha(Buffer.from(server.replace(next,previous))),guard[serverRelative],'Unrelated workflow code changed');
put(serverRelative,server);
const relative='client/overlay/resource/module/PetFightDLL.swf';
const original=parse(fs.readFileSync(path.join(baseline,relative)));
const core=parse(fs.readFileSync(path.join(baseline,'client/overlay/dll/NieoCore.swf')));
const className='com/robot/petFightModule/view/BaseFighterPetWin';
const index=original.tags.findIndex(tag=>tag.name===className);
assert.ok(index>=0,'Missing capture animation class');
const existing=new Set(original.tags.map(tag=>tag.name));
const inputs=[...original.tags.filter(tag=>tag.code!==0),...core.tags.filter(tag=>tag.code===82&&!existing.has(tag.name)),...original.tags.filter(tag=>tag.code===0)];
const compiler=path.join(out,'compiler'),imports=path.join(compiler,'import');
const source=path.join(imports,'scripts',className+'.as');
fs.mkdirSync(path.dirname(source),{recursive:true});
fs.copyFileSync(path.join(root,'compat/client-patches/catch-bag-sync/scripts',className+'.as'),source);
const input=path.join(compiler,'input.swf'),output=path.join(compiler,'output.swf');
fs.writeFileSync(input,encode(original,inputs));
execFileSync(values.java,['-Djava.awt.headless=true','-Xmx2g','-jar',values.ffdec,'-onerror','abort','-importScript',input,output,imports],{stdio:'inherit',timeout:240000});
const compiled=parse(fs.readFileSync(output));assert.equal(compiled.tags.length,inputs.length);
assert.equal(compiled.tags[index].name,className);assert.ok(!compiled.tags[index].raw.equals(original.tags[index].raw));
const final=encode(original,original.tags.map((tag,at)=>at===index?compiled.tags[at]:tag));
put(relative,final);put(relative.replace('client/overlay/','client/assets/'),final);
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({files,inputs:guard,restartGame:true,restartWeb:false,migration:null,changedClass:className,otherTagsPreserved:original.tags.length-1},null,2)+'\n');
console.log(JSON.stringify({files:files.length,changedClasses:1,otherTagsPreserved:original.tags.length-1,out}));
