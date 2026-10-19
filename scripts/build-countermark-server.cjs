'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {parseArgs}=require('node:util');
const {values:v}=parseArgs({options:{...Object.fromEntries(['context','baseline','out'].map(n=>[n,{type:'string'}])), 'module-only':{type:'boolean',default:false}}});
for(const n of ['context','baseline','out']) if(!v[n]) throw Error('Missing --'+n);
const baseline=path.resolve(v.baseline),out=path.resolve(v.out),root=path.resolve(__dirname,'..');
const ts=require(path.join(path.resolve(v.context),'node_modules/typescript'));
const files=[],sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function put(rel,bytes){const src=path.join(baseline,rel),dst=path.join(out,rel);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,bytes);files.push({path:rel,before:fs.existsSync(src)?sha(fs.readFileSync(src)):null,after:sha(bytes)});}
function patch(rel,visitor,expected){const text=fs.readFileSync(path.join(baseline,rel),'utf8'),ast=ts.createSourceFile(rel,text,ts.ScriptTarget.Latest,true),edits=[];function walk(n){visitor(n,ast,edits);ts.forEachChild(n,walk);}walk(ast);if(edits.length!==expected)throw Error(`${rel}: expected ${expected} guards, got ${edits.length}`);let result=text;for(const e of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,e.start)+e.text+result.slice(e.end);if(ts.createSourceFile(rel,result,ts.ScriptTarget.Latest,true).parseDiagnostics.length)throw Error('Syntax: '+rel);put(rel,result);if(fs.existsSync(path.join(baseline,rel+'.map'))){const map=JSON.parse(fs.readFileSync(path.join(baseline,rel+'.map'),'utf8'));map.mappings='';put(rel+'.map',JSON.stringify(map));}}
const source=fs.readFileSync(path.join(root,'compat/server-patches/countermark/Countermarks.ts'),'utf8');
// Check the new module semantically against its narrow deployed API boundary. Older
// source modules in the snapshot are incomplete and must never be rebuilt wholesale.
const virtualSource='/countermark/Countermarks.ts', virtualTypes='/countermark/runtime.d.ts';
const runtimeTypes=`
export declare const DatabaseManager: any;
export declare const ConfigLoader: any;
export declare const PetCalculator: any;
export declare const CommandID: any;
export declare const Logger: any;
export declare const GameConfig: any;
export declare class BaseProto { constructor(command: number); }
declare global {
  class Buffer { static alloc(size:number):Buffer; static from(value:string,encoding?:string):Buffer; static concat(parts:Buffer[]):Buffer; length:number; readUInt32BE(offset:number):number; writeUInt32BE(value:number,offset?:number):void; }
}`;
const options={noEmit:true,strict:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,types:[]};
const host=ts.createCompilerHost(options),originalRead=host.readFile,originalExists=host.fileExists;
host.readFile=file=>file===virtualSource?source:file===virtualTypes?runtimeTypes:originalRead(file);
host.fileExists=file=>file===virtualSource||file===virtualTypes||originalExists(file);
host.resolveModuleNames=names=>names.map(()=>({resolvedFileName:virtualTypes,extension:ts.Extension.Dts}));
const program=ts.createProgram([virtualSource],options,host);
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length)throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>root,getNewLine:()=>"\n"}));
const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
if(result.diagnostics.some(d=>d.category===ts.DiagnosticCategory.Error))throw Error('Countermarks syntax');
put('app/src/GameServer/Game/Pet/Countermarks.ts',source);put('app/dist/GameServer/Game/Pet/Countermarks.js',result.outputText);
// Incremental inventory changes reuse the installed integration hooks verbatim.
if(v['module-only']) {
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({files,mode:'module-only',guards:'Only Countermarks.ts/js are emitted; verify before SHA256 before applying',databaseMigration:false},null,2)+'\n');
  console.log(JSON.stringify({out,files:files.length,mode:'module-only'}));
  process.exit(0);
}
put('app/config/data/json/countermarks.json',fs.readFileSync(path.join(root,'compat/server-patches/countermark/countermarks.json')));
for(const [dir,ext] of [['src','.ts'],['dist','.js']]){
 patch(`app/${dir}/GameServer/Game/Pet/PetCalculator${ext}`,(n,a,e)=>{if(ts.isMethodDeclaration(n)&&n.name.getText(a)==='CalculateStatsFromPet'){const ret=n.body.statements.find(ts.isReturnStatement);if(!ret||!ts.isCallExpression(ret.expression))throw Error('Unknown stats baseline');e.push({start:ret.expression.getStart(a),end:ret.expression.end,text:'require("./Countermarks").ApplyStats(pet, '+ret.expression.getText(a)+')'});}},1);
 patch(`app/${dir}/GameServer/Game/Battle/services/BattleInitService${ext}`,(n,a,e)=>{if(ts.isMethodDeclaration(n)&&n.name.getText(a)==='BuildPlayerBattlePet'){e.push({start:n.body.getStart(a)+1,end:n.body.getStart(a)+1,text:'\n    if (require("../../Pet/Countermarks").IsMutating(this._player)) throw new Error("Countermark mutation pending");\n    playerData = {...playerData, pet: require("../../Pet/Countermarks").BattlePet(playerData.pet)};\n'});const ret=n.body.statements.find(s=>ts.isReturnStatement(s)&&s.expression?.getText(a)==='battlePet');e.push({start:ret.getStart(a),end:ret.getStart(a),text:'Object.assign(battlePet, {countermarks: require("../../Pet/Countermarks").Slots(playerData.pet)});\n    '});}},2);
 patch(`app/${dir}/GameServer/Game/Battle/BattleTurnExecutor${ext}`,(n,a,e)=>{if(ts.isVariableDeclaration(n)&&['pet1Skill','pet2Skill'].includes(n.name.getText(a))){const actor=n.name.getText(a)==='pet1Skill'?'player':'enemy';e.push({start:n.initializer.getStart(a),end:n.initializer.end,text:`require("../Pet/Countermarks").Skill(battle.${actor}, ${n.initializer.getText(a)})`});}},2);
 patch(`app/${dir}/GameServer/Game/Battle/BattleManager${ext}`,(n,a,e)=>{if(ts.isMethodDeclaration(n)&&n.name.getText(a)==='UpdateBattlePet')e.push({start:n.body.getStart(a)+1,end:n.body.getStart(a)+1,text:'\n    newPet = require("../Pet/Countermarks").BattlePet(newPet);\n    battlePet.countermarks = require("../Pet/Countermarks").Slots(newPet);\n'});},1);
 patch(`app/${dir}/GameServer/Game/Battle/services/BattlePvpService${ext}`,(n,a,e)=>{
   if(ts.isVariableDeclaration(n)&&['player1Pet','player2Pet'].includes(n.name.getText(a))&&(()=>{let p=n;while(p&&!ts.isMethodDeclaration(p))p=p.parent;return p?.name.getText(a)==='CreateBattle';})()){const owner=n.name.getText(a)==='player1Pet'?'player1':'player2';e.push({start:n.initializer.getStart(a),end:n.initializer.end,text:`require("../../Pet/Countermarks").BattlePet(${n.initializer.getText(a)})`});}
   if(ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(a)==='battle')&&n.parent.getText(a).includes('player1BattlePet'))e.push({start:n.getStart(a),end:n.getStart(a),text:'if (require("../../Pet/Countermarks").IsMutating(player1) || require("../../Pet/Countermarks").IsMutating(player2)) throw new Error("Countermark mutation pending");\n      Object.assign(player1BattlePet, {countermarks: require("../../Pet/Countermarks").Slots(player1Pet)});\n      Object.assign(player2BattlePet, {countermarks: require("../../Pet/Countermarks").Slots(player2Pet)});\n      '});
 },3);
}
patch('app/dist/GameServer/Server/Packet/Recv/Pet/PetCollectHandler.js',(n,a,e)=>{if(ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(a)==='fail')&&n.parent.getText(a).includes('const rewardId'))e.push({start:n.end,end:n.end,text:'\n        if (body.length >= 4 && body.readUInt32BE(0) === 900002) return require("../../../../Game/Pet/Countermarks").Handle(player, body);'});},1);
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({files,guards:'AST integration points counted; before SHA256 required at deployment',databaseMigration:'lazy idempotent player_countermarks table; retained on rollback',protocol:{command:2311,group:900002,requestBytes:20,response:'u32 group,u32 error,UTF8 XML'}},null,2)+'\n');console.log(JSON.stringify({out,files:files.length}));
