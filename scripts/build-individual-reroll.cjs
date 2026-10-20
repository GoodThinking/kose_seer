'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {parseArgs}=require('node:util');
const {values:v}=parseArgs({options:Object.fromEntries(['baseline','out','context'].map(name=>[name,{type:'string'}]))});
for(const name of ['baseline','out','context'])if(!v[name])throw Error('Missing --'+name);
const baseline=path.resolve(v.baseline),out=path.resolve(v.out);
const ts=require(path.join(path.resolve(v.context),'node_modules/typescript'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const relative='app/dist/GameServer/Game/Pet/RandomDv.js';
if(sha(fs.readFileSync(path.join(baseline,relative)))!=='f54c193ebcc700b28d6f2201ef4254ada8996467de8a8cdb777feb5d73db4fcf')throw Error('Reroll implementation changed; reconcile before building');
const source=fs.readFileSync(path.join(__dirname,'../compat/server-patches/individual-reroll/RandomDv.ts'),'utf8');
const compiled=ts.transpileModule(source,{fileName:'RandomDv.ts',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
if(compiled.diagnostics.some(d=>d.category===ts.DiagnosticCategory.Error))throw Error('Invalid reroll source');
const files=[];
function put(file,bytes){
 const old=path.join(baseline,file),target=path.join(out,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
 files.push({path:file,before:fs.existsSync(old)?sha(fs.readFileSync(old)):null,after:sha(Buffer.from(bytes))});
}
put('app/src/GameServer/Game/Pet/RandomDv.ts',source);
put(relative,compiled.outputText);
if(fs.existsSync(path.join(baseline,relative+'.map'))){const map=JSON.parse(fs.readFileSync(path.join(baseline,relative+'.map'),'utf8'));map.mappings='';put(relative+'.map',JSON.stringify(map));}
const protectedPaths=['app/dist/GameServer/Game/Pet/PetCalculator.js','app/dist/GameServer/Game/Pet/PetManager.js','app/dist/GameServer/Server/Packet/Recv/Pet/UsePetItemOutOfFightHandler.js'];
const protectedInputs=Object.fromEntries(protectedPaths.map(file=>[file,sha(fs.readFileSync(path.join(baseline,file)))]));
const manifest={files,protectedInputs,restartGame:true,restartWeb:false};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
