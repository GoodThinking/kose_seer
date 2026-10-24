'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{parseArgs}=require('node:util');
const {values:v}=parseArgs({options:{baseline:{type:'string'},out:{type:'string'},java:{type:'string'},ffdec:{type:'string'},'server-only':{type:'boolean',default:false}}});
for(const key of ['baseline','out'])assert.ok(v[key],'Missing --'+key);
const root=path.resolve(__dirname,'..'),baseline=path.resolve(v.baseline),out=path.resolve(v.out);
assert.ok(!fs.existsSync(out),'Choose a fresh build directory');
const arenaRoot=path.join(root,'compat/server-patches/star-arena'),championRoot=path.join(root,'compat/server-patches/champion-pets');
const readJSON=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const pano={...readJSON(path.join(arenaRoot,'catalog.json')),id:1,name:'帕诺',title:'星系擂台',rewardName:'圣霆雷伊',rewardSpeciesTotal:710,rewardSkills:[30944,25581,25582,30948],backgroundMapId:102,theme:'pano'};
const arenas=[pano,readJSON(path.join(arenaRoot,'catalog-kalan.json')),readJSON(path.join(arenaRoot,'catalog-rogg.json'))];
const files=[],sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function put(relative,bytes){const before=path.join(baseline,relative),file=path.join(out,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);files.push({path:relative,before:fs.existsSync(before)?sha(fs.readFileSync(before)):null,after:sha(bytes)});}
function once(text,before,after){assert.equal(text.split(before).length,2,'Baseline anchor changed: '+before.slice(0,100));return text.replace(before,after);}
function patch(relative,fn){put(relative,fn(fs.readFileSync(path.join(baseline,relative),'utf8')));}
const battle='app/dist/GameServer/Game/Battle/';
assert.ok(fs.readFileSync(path.join(baseline,battle+'StarArena.js'),'utf8').includes('Buffer.alloc(32)'),'Capture the deployed single-arena baseline');
for(const arena of arenas){assert.equal(arena.trainers.length,16);for(const trainer of arena.trainers){assert.equal(trainer.team.length,6);for(const pet of trainer.team){assert.equal(pet.skills.length,4);assert.equal(new Set(pet.skills).size,4);assert.ok(pet.ev.reduce((a,b)=>a+b,0)<=510);if(arena.id>1)assert.ok(arena.regionalSources[pet.petId],'Missing regional source '+pet.petId);}}}
put(battle+'StarArena.js',fs.readFileSync(path.join(arenaRoot,'StarArena.js')));
put(battle+'StarArenaCatalog.json',JSON.stringify({arenas},null,2)+'\n');
put('app/dist/DataBase/migrations/scripts/028_split_galaxy_arenas.js',fs.readFileSync(path.join(arenaRoot,'028_split_galaxy_arenas.js')));
patch('app/dist/DataBase/migrations/MigrationRunner.js',text=>{
  text=once(text,'const AllMigrations = [','const { Migration028SplitGalaxyArenas } = require("./scripts/028_split_galaxy_arenas");\nconst AllMigrations = [');
  text=once(text,'new Migration027CreateStarArena(),','new Migration027CreateStarArena(),\n  new Migration028SplitGalaxyArenas(),');
  return once(text,"const sqls = dbType === 'mysql' ? migration.upMySQL() : migration.upSQLite();\n                for (const sql of sqls) {\n                    await this._db.Execute(sql);\n                }\n                await this.recordMigration(migration);",`const sqls = dbType === 'mysql' ? migration.upMySQL() : migration.upSQLite();
                if (dbType === 'sqlite' && migration.atomicSQLite) {
                    await this._db.WithConnection(async driver => {
                        await driver.beginTransaction();
                        try {
                            for (const sql of sqls) await driver.execute(sql);
                            await driver.execute('INSERT INTO migrations (version, name) VALUES (?, ?)', [migration.version, migration.name]);
                            await driver.commit();
                        } catch (error) { await driver.rollback(); throw error; }
                    });
                } else {
                    for (const sql of sqls) await this._db.Execute(sql);
                    await this.recordMigration(migration);
                }`);
});
patch('app/config/data/json/map-ogres.json',text=>{const config=JSON.parse(text);for(const arena of arenas.slice(1)){assert.ok(!config.maps[arena.mapId]);config.maps[arena.mapId]={name:arena.name+'星系擂台',spawnCount:0,ogres:[]};}return JSON.stringify(config,null,2)+'\n';});
function parse(raw){assert.equal(raw.subarray(0,3).toString(),'CWS');const body=zlib.inflateSync(raw.subarray(8));assert.equal(body.length+8,raw.readUInt32LE(4));let pos=Math.ceil((5+(body[0]>>3)*4)/8)+4;const header=body.subarray(0,pos),tags=[];while(pos<body.length){const start=pos,short=body.readUInt16LE(pos);pos+=2;const code=short>>6;let length=short&63;if(length===63){length=body.readUInt32LE(pos);pos+=4;}const payload=body.subarray(pos,pos+length);pos+=length;tags.push({code,payload,name:code===82?payload.subarray(4,payload.indexOf(0,4)).toString():null,raw:body.subarray(start,pos)});if(!code)break;}assert.equal(pos,body.length);return{raw,header,tags};}
function encode(source,tags){const body=Buffer.concat([source.header,...tags.map(tag=>tag.raw)]),head=Buffer.from(source.raw.subarray(0,8));head.writeUInt32LE(body.length+8,4);return Buffer.concat([head,zlib.deflateSync(body)]);}
function tag(code,payload){const head=Buffer.alloc(6);head.writeUInt16LE((code<<6)|63);head.writeUInt32LE(payload.length,2);return{code,payload,raw:Buffer.concat([head,payload])};}
function readU30(buf,pos){let value=0;for(let i=0,shift=0;i<5;i++,shift+=7){const b=buf[pos++];value+=(b&127)*2**shift;if(!(b&128))break;}return[value,pos];}
function writeU30(value){const bytes=[];do{let b=value&127;value=Math.floor(value/128);if(value)b|=128;bytes.push(b);}while(value);return Buffer.from(bytes);}
function stubFrom(source,className){const nameEnd=source.payload.indexOf(0,4),abc=source.payload.subarray(nameEnd+1);let pos=4,count;[count,pos]=readU30(abc,pos);for(let i=1;i<count;i++)[,pos]=readU30(abc,pos);[count,pos]=readU30(abc,pos);for(let i=1;i<count;i++)[,pos]=readU30(abc,pos);[count,pos]=readU30(abc,pos);pos+=8*Math.max(0,count-1);const parts=[abc.subarray(0,pos)];[count,pos]=readU30(abc,pos);parts.push(writeU30(count));let changed=0;for(let i=1;i<count;i++){let length;[length,pos]=readU30(abc,pos);let value=abc.subarray(pos,pos+length).toString();pos+=length;if(value.includes('MapProcess_340')){value=value.split('MapProcess_340').join(className);changed++;}const bytes=Buffer.from(value);parts.push(writeU30(bytes.length),bytes);}parts.push(abc.subarray(pos));assert.ok(changed);const result=tag(82,Buffer.concat([source.payload.subarray(0,4),Buffer.from(source.name.replace('MapProcess_340',className)+'\0'),...parts]));result.name=source.name.replace('MapProcess_340',className);return result;}
function xmlTag(source,symbol,transform){let id;for(const item of source.tags.filter(t=>t.code===76)){let pos=2;for(let i=0;i<item.payload.readUInt16LE(0);i++){const candidate=item.payload.readUInt16LE(pos);pos+=2;const stop=item.payload.indexOf(0,pos);if(item.payload.subarray(pos,stop).toString()===symbol)id=candidate;pos=stop+1;}}assert.ok(id,'Missing XML symbol '+symbol);const original=source.tags.find(t=>t.code===87&&t.payload.readUInt16LE(0)===id);assert.ok(original);const updated=tag(87,Buffer.concat([original.payload.subarray(0,6),Buffer.from(transform(original.payload.subarray(6).toString('utf8')))]));source.tags[source.tags.indexOf(original)]=updated;}
const artSources=[];
if(!v['server-only']){
  for(const key of ['java','ffdec'])assert.ok(v[key],'Missing --'+key);
  const coreRel='client/overlay/dll/NieoCore.swf',coreRaw=fs.readFileSync(path.join(baseline,coreRel));
  assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline,'client/assets/dll/NieoCore.swf'))),'Resolve differing effective Core baselines');
  const core=parse(coreRaw),template=core.tags.find(t=>t.name==='com/robot/app/mapProcess/MapProcess_340');assert.ok(template);
  const firstArena=core.tags.findIndex(t=>t.name==='com/robot/app/mapProcess/MapProcess_9508');assert.ok(firstArena>=0);
  for(const name of ['GalaxyArenaMap','MapProcess_9509','MapProcess_9510']){assert.ok(!core.tags.some(t=>t.name==='com/robot/app/mapProcess/'+name));core.tags.splice(core.tags.findIndex(t=>t.name==='com/robot/app/mapProcess/MapProcess_9508'),0,stubFrom(template,name));}
  xmlTag(core,'com.robot.core.manager.map.config.MapConfig_xmlCls',text=>{for(const arena of arenas.slice(1)){assert.ok(!text.includes('id="'+arena.mapId+'"'));text=once(text,'</Maps>','<map id="'+arena.mapId+'" name="'+arena.name+'擂台赛" x="480" y="405" sound="BGM_055"><Entries><Entry FromMap="0" PosX="480" PosY="405"/></Entries><changeMapComp/><funComp/></map>\n</Maps>');}return text;});
  xmlTag(core,'com.robot.core.config.xml.PetBookXMLInfo_xmlClass',text=>{for(const record of fs.readFileSync(path.join(championRoot,'encyclopedia.xml'),'utf8').match(/<Monster\b[^>]*\/>/g)){const id=record.match(/\bID="(\d+)"/)[1];const pattern=new RegExp('<Monster\\b[^>]*\\bID="'+id+'"[^>]*\\/>');assert.ok(pattern.test(text));text=text.replace(pattern,record);}return text;});
  const compiler=path.join(out,'compiler'),imports=path.join(compiler,'import'),importMaps=path.join(imports,'scripts/com/robot/app/mapProcess');fs.mkdirSync(importMaps,{recursive:true});
  const names=['GalaxyArenaMap','MapProcess_102','MapProcess_9508','MapProcess_9509','MapProcess_9510'];
  for(const name of names){let text=fs.readFileSync(path.join(root,'compat/client-patches/star-arena/core/scripts/com/robot/app/mapProcess',name+'.as'),'utf8');if(name==='GalaxyArenaMap')text=once(text,'private static const ARENAS:Array = []; // @GALAXY_ARENAS@','private static const ARENAS:Array = '+JSON.stringify(arenas)+';');fs.writeFileSync(path.join(importMaps,name+'.as'),text);}
  const input=path.join(compiler,'input.swf'),output=path.join(compiler,'output.swf');fs.writeFileSync(input,encode(core,core.tags));
  execFileSync(v.java,['-Djava.awt.headless=true','-Xmx2g','-jar',v.ffdec,'-onerror','abort','-importScript',input,output,imports],{stdio:'inherit',timeout:240000});
  const compiled=parse(fs.readFileSync(output));assert.equal(compiled.tags.length,core.tags.length);const allowed=new Set(names.map(name=>'com/robot/app/mapProcess/'+name));let changed=0;
  core.tags=core.tags.map((old,index)=>{if(old.code!==82||!allowed.has(old.name))return old;const replacement=compiled.tags[index];assert.equal(old.name,replacement.name);assert.ok(!old.raw.equals(replacement.raw),'Expected changed class '+old.name);changed++;return replacement;});assert.equal(changed,names.length);
  const coreBytes=encode(core,core.tags);put('client/assets/dll/NieoCore.swf',coreBytes);put(coreRel,coreBytes);
  for(const arena of arenas.slice(1)){const source='client/assets/resource/map/'+arena.backgroundMapId+'.swf',bytes=fs.readFileSync(path.join(baseline,source));artSources.push({arenaId:arena.id,mapId:arena.backgroundMapId,sha:sha(bytes)});put('client/overlay/resource/map/'+arena.mapId+'.swf',bytes);}
  for(const asset of readJSON(path.join(root,'compat/client-resources/star-arena/galaxy-followers.json'))){
    const bytes=fs.readFileSync(path.join(root,'compat/client-resources/star-arena',asset.path));
    assert.equal(sha(bytes),asset.sha256,'Original follower checksum changed: '+asset.petId);
    put('client/overlay/'+asset.path,bytes);
  }
  console.log(JSON.stringify({compiledClasses:changed,artSources}));
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({files,restartGame:true,restartWeb:false,migration:28,artSources},null,2)+'\n');
console.log(JSON.stringify({out,files:files.length,migration:28}));
