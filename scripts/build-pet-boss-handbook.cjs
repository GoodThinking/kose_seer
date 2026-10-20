'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {buildCatalogue} = require('./pet-boss-handbook-data.cjs');
const {values} = parseArgs({options:{baseline:{type:'string'},'fusion-baseline':{type:'string'},book:{type:'string'},out:{type:'string'},java:{type:'string'},ffdec:{type:'string'}}});
for(const key of ['baseline','fusion-baseline','book','out','java','ffdec'])if(!values[key])throw Error('Missing --'+key);
const out=path.resolve(values.out),root=path.resolve(__dirname,'..');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const catalogue=buildCatalogue({base:path.resolve(values.baseline),fusionBase:path.resolve(values['fusion-baseline'])});
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'catalogue.json'),JSON.stringify(catalogue,null,2)+'\n');
function parse(raw) {
  const body=raw.subarray(0,3).toString()==='CWS'?zlib.inflateSync(raw.subarray(8)):raw.subarray(8);
  let pos=Math.ceil((5+(body[0]>>3)*4)/8)+4;
  const header=body.subarray(0,pos),tags=[];
  while(pos<body.length) {
    const start=pos,short=body.readUInt16LE(pos);pos+=2;const code=short>>6;let size=short&63;
    if(size===63){size=body.readUInt32LE(pos);pos+=4;}
    const payload=body.subarray(pos,pos+size);pos+=size;tags.push({code,payload,raw:body.subarray(start,pos)});
    if(code===0)break;
  }
  if(pos!==body.length)throw Error('Invalid SWF stream');return {header,tags};
}
function tag(code,payload=Buffer.alloc(0)) {
  const head=Buffer.alloc(6);head.writeUInt16LE((code<<6)|63);head.writeUInt32LE(payload.length,2);return Buffer.concat([head,payload]);
}
function encode(header,tags) {
  const body=Buffer.concat([header,...tags]),head=Buffer.from([67,87,83,10,0,0,0,0]);head.writeUInt32LE(body.length+8,4);return Buffer.concat([head,zlib.deflateSync(body,{level:9})]);
}
const original=parse(fs.readFileSync(values.book));
const sourcePath=path.join(root,'compat/client-patches/pet-boss-handbook/monsterBook.as');
let source=fs.readFileSync(sourcePath,'utf8');
const chunks=[];
for(let i=0;i<catalogue.pets.length;i+=50)chunks.push(catalogue.pets.slice(i,i+50));
source=source.replace('private const catalog:Array = []; // @CATALOG@','private const catalog:Array = buildCatalog();');
source=source.replace('private const methodology:Array = []; // @METHODOLOGY@','private const methodology:Array = '+JSON.stringify(catalogue.methodology)+';');
const methods='\n      private function buildCatalog():Array { var all:Array=[]; '+chunks.map((_,i)=>'all=all.concat(catalog'+i+'());').join(' ')+' return all; }\n'+chunks.map((rows,i)=>'      private function catalog'+i+'():Array { return '+JSON.stringify(rows)+'; }').join('\n');
source=source.replace(/\n   }\s*}\s*$/,methods+'\n   }\n}\n');
const imports=path.join(out,'compiler/import/scripts');fs.mkdirSync(imports,{recursive:true});
fs.writeFileSync(path.join(imports,'monsterBook.as'),source);
const compiledFile=path.join(out,'compiler/compiled.swf');
execFileSync(values.java,['-Djava.awt.headless=true','-Xmx2g','-jar',values.ffdec,'-onerror','abort','-importScript',path.resolve(values.book),compiledFile,path.join(out,'compiler/import')],{stdio:'inherit',timeout:300000});
const compiled=parse(fs.readFileSync(compiledFile));
const abc=compiled.tags.filter(t=>t.code===82);
if(!abc.length || Buffer.concat(abc.map(t=>t.raw)).equals(Buffer.concat(original.tags.filter(t=>t.code===82).map(t=>t.raw))))throw Error('Book code not replaced');
// A library containing one empty MovieClip symbol. All visual content comes from our class.
// Keep the native exported name, but remove the obsolete twenty-frame instructional artwork.
const linkage=Buffer.concat([Buffer.from([1,0,105,2]),Buffer.from('monsterBook\0')]); // symbol617
const sprite=Buffer.concat([Buffer.from([105,2,1,0]),tag(1),tag(0)]);
const fileAttrs=Buffer.from([8,0,0,0]);
const result=encode(original.header,[tag(69,fileAttrs),...abc.map(t=>t.raw),tag(39,sprite),tag(76,linkage),tag(1),tag(0)]);
const relative='client/overlay/resource/book/monsterBook.swf';
const target=path.join(out,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,result);
const manifest={sourceBaseline:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files:[{path:relative,sha256:hash(result)}],inputs:Object.fromEntries([...catalogue.inputs,path.resolve(values.book),sourcePath].map(p=>[p,hash(fs.readFileSync(p))])),counts:{pets:catalogue.pets.length,tiers:catalogue.tiers.map((name,tier)=>({name,count:catalogue.pets.filter(p=>p.tier===tier).length}))},entry:'实验室原有精灵手册 → MonsterBook.loadPanel → resource/book/monsterBook.swf',nativeSymbol:'monsterBook',coreChanged:false,serverChanged:false,playerDataChanged:false,networkWrites:false};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({output:target,counts:manifest.counts,sha256:hash(result)}));
