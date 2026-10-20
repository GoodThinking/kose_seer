'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {values} = parseArgs({options:Object.fromEntries(['baseline','out','java','ffdec'].map(name=>[name,{type:'string'}]))});
for(const name of ['baseline','out','java','ffdec'])if(!values[name])throw Error('Missing --'+name);
const baseline=path.resolve(values.baseline),out=path.resolve(values.out);
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function check(condition,message){if(!condition)throw Error(message);}
const coreRelative='client/assets/dll/NieoCore.swf',htmlRelative='client/index.html';
const key='com/robot/app/task/TaskMain';
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
const original=parse(fs.readFileSync(path.join(baseline,coreRelative)));
const oldTag=original.tags.filter(t=>t.name===key);
check(oldTag.length===1&&sha(oldTag[0].raw)==='6be580f657a99768661d71756332379f2df810247f1054ad113b1a52508f47b3','TaskMain changed; reconcile its current source before building');
check(sha(fs.readFileSync(path.join(baseline,htmlRelative)))==='2f7aaafcc90b5d79659893a2cf731941700c74f52478115da6e6f01d956e24a5','Browser host changed; reconcile wheel integration before building');
execFileSync(process.execPath,[path.join(__dirname,'build-pet-boss-handbook.cjs'),'--baseline',baseline,'--fusion-baseline',baseline,'--book',path.join(baseline,'client/assets/resource/book/monsterBook.swf'),'--out',out,'--java',values.java,'--ffdec',values.ffdec],{stdio:'inherit',timeout:300000});
const bookManifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json'),'utf8'));
const imports=path.join(out,'honor-compiler/import/scripts'),target=path.join(imports,key+'.as');
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.copyFileSync(path.join(__dirname,'../compat/client-patches/handbook-polish/TaskMain.as'),target);
const compiledPath=path.join(out,'honor-compiler/compiled.swf');
execFileSync(values.java,['-Djava.awt.headless=true','-jar',values.ffdec,'-onerror','abort','-importScript',path.join(baseline,coreRelative),compiledPath,path.dirname(imports)],{stdio:'inherit',timeout:120000});
const changed=parse(fs.readFileSync(compiledPath)).tags.filter(t=>t.name===key);
check(changed.length===1&&!changed[0].raw.equals(oldTag[0].raw),'Honor entry class was not rebuilt');
const body=Buffer.concat([original.header,...original.tags.map(t=>t.name===key?changed[0].raw:t.raw)]);
const length=Buffer.alloc(4);length.writeUInt32LE(body.length+8);
const core=Buffer.concat([original.raw.subarray(0,4),length,zlib.deflateSync(body,{level:9})]);
const result=parse(core);
check(result.tags.length===original.tags.length&&result.tags.every((t,i)=>t.name===key||t.raw.equals(original.tags[i].raw)),'Unrelated Core tag changed');
for(const [relative,bytes] of [[coreRelative,core],[htmlRelative,fs.readFileSync(path.join(__dirname,'../compat/client-patches/versioned-assets/index.html'))]]){
  fs.mkdirSync(path.dirname(path.join(out,relative)),{recursive:true});fs.writeFileSync(path.join(out,relative),bytes);
}
const files=[coreRelative,bookManifest.files[0].path,htmlRelative].map(relative=>({path:relative,before:sha(fs.readFileSync(path.join(baseline,relative))),after:sha(fs.readFileSync(path.join(out,relative)))}));
const protectedInputs=Object.fromEntries(Object.entries(bookManifest.inputs).filter(([file])=>file.startsWith(baseline+path.sep)).map(([file,hash])=>[path.relative(baseline,file),hash]));
const manifest={...bookManifest,files,protectedInputs,coreChanged:true,changedNativeClasses:[key],unrelatedNativeTagsPreserved:true,restartGame:false,restartWeb:false};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({files,counts:manifest.counts}));
