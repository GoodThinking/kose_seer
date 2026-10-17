'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {parseArgs}=require('node:util');
const names=['server-context','core','elite','guide','cloth-book','java','ffdec','out'];
const {values}=parseArgs({options:Object.fromEntries(names.map(name=>[name,{type:'string'}]))});
for(const name of names)if(!values[name])throw Error('Missing --'+name);
const repo=path.resolve(__dirname,'..'),server=path.resolve(values['server-context']),out=path.resolve(values.out);
const client=path.join(repo,'compat/client-patches/coin-products'),backend=path.join(repo,'compat/server-patches/coin-products');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const baseline=JSON.parse(fs.readFileSync(path.join(client,'baselines.json')));
for(const [name,metadata]of Object.entries(baseline))check(sha(fs.readFileSync(values[name]))===metadata.sha256,'Client baseline changed: '+name);
const sources=['GameServer/Game/Item/ItemManager.ts','GameServer/Game/Item/CoinProductPurchase.ts','GameServer/Server/Packet/Recv/User/index.ts','GameServer/Server/Packet/Recv/User/MoneyBuyProductHandler.ts','GameServer/Server/Packet/Send/User/PacketMoneyBuyProduct.ts'];
const ts=require(path.join(server,'node_modules/typescript'));
const config=ts.readConfigFile(path.join(server,'tsconfig.json'),ts.sys.readFile);
check(!config.error,'Cannot read TypeScript config');
const options=ts.convertCompilerOptionsFromJson(config.config.compilerOptions,server).options;
const overlays=new Map(sources.map(relative=>[path.join(server,'src',relative),fs.readFileSync(path.join(backend,'src',relative),'utf8')]));
const host=ts.createCompilerHost(options),originalGet=host.getSourceFile.bind(host),originalExists=host.fileExists.bind(host);
host.fileExists=file=>overlays.has(path.resolve(file))||originalExists(file);
host.getSourceFile=(file,version,onError,fresh)=>overlays.has(path.resolve(file))?ts.createSourceFile(file,overlays.get(path.resolve(file)),version,true):originalGet(file,version,onError,fresh);
const program=ts.createProgram([...overlays.keys()],{...options,noEmit:true},host);
const diagnostics=ts.getPreEmitDiagnostics(program).filter(d=>d.category===ts.DiagnosticCategory.Error&&d.file&&overlays.has(path.resolve(d.file.fileName)));
check(!diagnostics.length,ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>server,getNewLine:()=> '\n'}));
const files=[];
function put(relative,bytes){const dest=path.join(out,relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);files.push({path:relative,sha256:sha(bytes)});}
for(const relative of sources){
  const filename=path.join(server,'src',relative),source=overlays.get(filename),compiled=ts.transpileModule(source,{compilerOptions:options,fileName:filename,reportDiagnostics:true});
  check(!compiled.diagnostics?.some(d=>d.category===ts.DiagnosticCategory.Error),'Compilation failed: '+relative);
  const runtime='dist/'+relative.replace(/\.ts$/,'.js');
  put('app/'+runtime,compiled.outputText);
  const map=JSON.parse(compiled.sourceMapText);
  map.sources=[path.posix.relative(path.posix.dirname(runtime),'src/'+relative)];
  put('app/'+runtime+'.map',JSON.stringify(map));
}
for(const relative of ['config/data/json/money-products.json','config/data/json/unique-items.json','config/data/xml/items.xml'])put('app/'+relative,fs.readFileSync(path.join(backend,relative)));
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'kose-coin-client-'));
function ffdec(...args){execFileSync(values.java,['-Djava.awt.headless=true','-jar',path.resolve(values.ffdec),...args],{stdio:'pipe',timeout:120000,maxBuffer:8000000});}
function clientFile(relative,build){const dest=path.join(out,relative);fs.mkdirSync(path.dirname(dest),{recursive:true});build(dest);files.push({path:relative,sha256:sha(fs.readFileSync(dest))});}
try{
  const data=path.join(scratch,'core-data.swf');
  ffdec('-replace',path.resolve(values.core),data,'1',path.join(client,'binaryData/1.bin'),'31',path.join(client,'binaryData/31.bin'),'34',path.join(client,'binaryData/34.bin'));
  clientFile('client/assets/dll/NieoCore.swf',dest=>ffdec('-importScript',data,dest,path.join(client,'core-source')));
  clientFile('client/overlay/module/com/robot/module/book/ElietCoinBookPanel.swf',dest=>ffdec('-importScript',path.resolve(values.elite),dest,path.join(client,'elite-source')));
  clientFile('client/overlay/module/com/robot/module/book/ShopingGuidePanel.swf',dest=>ffdec('-importText',path.resolve(values.guide),dest,path.join(client,'guide-text')));
  put('client/overlay/resource/module/clothBook/clothBook.swf',fs.readFileSync(values['cloth-book']));
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
check(files.length===17,'Unexpected output file count');
const manifest={currency:'coins',rate:100,products:84,removedIds:[199901,199902,199903,199904,199905],semanticDiagnostics:[],baseline,files};
fs.writeFileSync(path.join(out,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
