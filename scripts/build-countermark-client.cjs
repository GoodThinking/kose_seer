'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const {execFileSync}=require('node:child_process');
const {values}=require('node:util').parseArgs({options:{baseline:{type:'string'},out:{type:'string'},java:{type:'string'},ffdec:{type:'string'},'module-only':{type:'boolean',default:false}}});
for(const name of ['baseline','out','java','ffdec']) if(!values[name]) throw Error('Missing --'+name);
const root=path.resolve(__dirname,'..'),base=path.resolve(values.baseline),out=path.resolve(values.out),src=path.join(root,'compat/client-patches/countermark');
const check=(v,m)=>{if(!v)throw Error(m);},hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const moduleOnly=values['module-only'];
const guardFile=moduleOnly?'visual-baseline-hashes.json':'baseline-hashes.json';
const inputs=JSON.parse(fs.readFileSync(path.join(src,guardFile),'utf8'));
for(const [file,expected] of Object.entries(inputs)) check(hash(fs.readFileSync(path.join(base,file)))===expected,'Baseline changed; review before updating guard: '+file);
const corePath='client/assets/dll/NieoCore.swf',templatePath='client/assets/module/com/robot/module/book/PetAmalgamationBookPanel.swf';
function parse(raw){
 const signature=raw.subarray(0,3).toString();check(['CWS','FWS'].includes(signature),'Unsupported SWF');
 const body=signature==='CWS'?zlib.inflateSync(raw.subarray(8)):raw.subarray(8);
 let p=Math.ceil((5+(body[0]>>3)*4)/8)+4;const header=body.subarray(0,p),tags=[];
 while(p<body.length){let start=p,short=body.readUInt16LE(p);p+=2;let size=short&63,code=short>>6;if(size===63){size=body.readUInt32LE(p);p+=4;}const payload=body.subarray(p,p+size);p+=size;tags.push({code,payload,raw:body.subarray(start,p)});if(code===0)break;}
 check(p===body.length,'Invalid SWF stream');return {raw,signature,header,tags};
}
function tag(code,payload){const head=Buffer.alloc(6);head.writeUInt16LE((code<<6)|63);head.writeUInt32LE(payload.length,2);return {code,payload,raw:Buffer.concat([head,payload])};}
function encode(s,tags){const body=Buffer.concat([s.header,...tags.map(t=>t.raw)]),h=Buffer.from(s.raw.subarray(0,8));h.writeUInt32LE(body.length+8,4);return Buffer.concat([h,s.signature==='CWS'?zlib.deflateSync(body,{level:9}):body]);}
function u30(n){const out=[];do{let b=n&127;n>>>=7;if(n)b|=128;out.push(b);}while(n);return Buffer.from(out);}
function renameABC(t){
 const b=t.payload;let p=b.indexOf(0,4)+1;check(p>4,'Invalid DoABC name');p+=4;
 const read=()=>{let n=0,shift=0,v;do{v=b[p++];n|=(v&127)<<shift;shift+=7;}while(v&128);return n>>>0;};
 let n=read();for(let i=1;i<n;i++)read();n=read();for(let i=1;i<n;i++)read();n=read();p+=Math.max(0,n-1)*8;
 const count=read(),parts=[b.subarray(0,p)];let changed=0;
 for(let i=1;i<count;i++){const size=read(),str=b.subarray(p,p+size).toString('utf8');p+=size;const next=str.replaceAll('PetAmalgamationBookPanel','PetCountermarkBookPanel');if(next!==str)changed++;const bytes=Buffer.from(next);parts.push(u30(bytes.length),bytes);}
 check(changed>0,'Template QName not found');parts.push(b.subarray(p));return tag(t.code,Buffer.concat(parts));
}
function renameSymbol(t){
 if(t.code!==76)return t;const b=t.payload,n=b.readUInt16LE(0),parts=[b.subarray(0,2)];let p=2;
 for(let i=0;i<n;i++){parts.push(b.subarray(p,p+2));p+=2;const end=b.indexOf(0,p),s=b.subarray(p,end).toString().replaceAll('PetAmalgamationBookPanel','PetCountermarkBookPanel');parts.push(Buffer.from(s+'\0'));p=end+1;}
 return tag(t.code,Buffer.concat(parts));
}
fs.mkdirSync(out,{recursive:true});
const core=parse(fs.readFileSync(path.join(base,corePath))),original=parse(fs.readFileSync(path.join(base,templatePath)));
check(original.tags.filter(t=>t.code===82).length===1,'Expected one template ABC');
const renamed=original.tags.map(t=>t.code===82?renameABC(t):renameSymbol(t));
const run=args=>execFileSync(values.java,['-Djava.awt.headless=true','-jar',values.ffdec,...args],{stdio:'inherit',timeout:240000});
const compiler=path.join(out,'compiler'),moduleImport=path.join(compiler,'module-import/scripts/com/robot/module/book');fs.mkdirSync(moduleImport,{recursive:true});
fs.writeFileSync(path.join(compiler,'module-context.swf'),encode(original,renamed.flatMap(t=>t.code===82?[...core.tags.filter(t=>t.code===82),t]:[t])));
fs.copyFileSync(path.join(src,'PetCountermarkBookPanel.as'),path.join(moduleImport,'PetCountermarkBookPanel.as'));
run(['-onerror','abort','-importScript',path.join(compiler,'module-context.swf'),path.join(compiler,'module-compiled.swf'),path.join(compiler,'module-import')]);
const moduleCompiled=parse(fs.readFileSync(path.join(compiler,'module-compiled.swf'))),replacement=moduleCompiled.tags.filter(t=>t.code===82).at(-1);
check(replacement&&!replacement.raw.equals(renamed.find(t=>t.code===82).raw),'Module compile produced no change');
const moduleResult=encode(original,renamed.map(t=>t.code===82?replacement:t));
const moduleFinal=parse(moduleResult);
check(moduleFinal.tags.every((t,i)=>t.code===82||t.code===76||t.raw.equals(original.tags[i].raw)),'Module non-code tags changed');
const outputs={'client/overlay/module/com/robot/module/book/PetCountermarkBookPanel.swf':moduleResult};
const changedCore=[];
if(!moduleOnly){
 const coreImport=path.join(compiler,'core-import/scripts/com/robot/app/petbag/ui');fs.mkdirSync(coreImport,{recursive:true});
 fs.copyFileSync(path.join(src,'PetBagPanel.as'),path.join(coreImport,'PetBagPanel.as'));
 run(['-onerror','abort','-importScript',path.join(base,corePath),path.join(compiler,'core-compiled.swf'),path.join(compiler,'core-import')]);
 const coreCompiled=parse(fs.readFileSync(path.join(compiler,'core-compiled.swf')));
 check(core.tags.length===coreCompiled.tags.length,'Core tag count changed');
 for(let i=0;i<core.tags.length;i++)if(!core.tags[i].raw.equals(coreCompiled.tags[i].raw)){check(core.tags[i].code===82&&coreCompiled.tags[i].code===82,'Core non-code tag changed at '+i);changedCore.push(i);}
 check(changedCore.length===1,'Expected exactly one changed Core ABC, got '+changedCore.length);
 outputs['client/assets/dll/NieoCore.swf']=encode(core,core.tags.map((t,i)=>changedCore.includes(i)?coreCompiled.tags[i]:t));
}
for(const [file,bytes] of Object.entries(outputs)){const target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}
const sourceFiles=moduleOnly?['PetCountermarkBookPanel.as',guardFile]:['PetCountermarkBookPanel.as','PetBagPanel.as',guardFile];
const manifest={buildMode:moduleOnly?'module-only':'full-v1',coreChanged:!moduleOnly,sourceBaseline:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),inputs,sources:Object.fromEntries(sourceFiles.map(f=>[f,hash(fs.readFileSync(path.join(src,f)))])),builderSha256:hash(fs.readFileSync(__filename)),files:Object.entries(outputs).map(([file,b])=>({path:file,sha256:hash(b)})),nativeEntry:'精灵背包 > 精灵刻印',moduleClass:'com.robot.module.book.PetCountermarkBookPanel',protocol:{command:2311,group:900002,requestU32:['group','op','catchTime','markId','slot']},changedCoreABC:changedCore,coreOtherABCAndNonCodePreserved:true,moduleNativeTagsPreservedExceptSymbolClass:true,fusionManualUnchanged:true,productionDataWrittenByBuild:false};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest,null,2));
