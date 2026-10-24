'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{parseArgs}=require('node:util');
const {values:v}=parseArgs({options:{baseline:{type:'string'},out:{type:'string'},java:{type:'string'},ffdec:{type:'string'},'server-only':{type:'boolean',default:false}}});
for(const key of ['baseline','out'])assert.ok(v[key],'Missing --'+key);
const root=path.resolve(__dirname,'..'),baseline=path.resolve(v.baseline),out=path.resolve(v.out);
assert.ok(!fs.existsSync(out),'Choose a fresh build directory');
const championRoot=path.join(root,'compat/server-patches/champion-pets'),arenaRoot=path.join(root,'compat/server-patches/star-arena');
const pets=JSON.parse(fs.readFileSync(path.join(championRoot,'species.json'),'utf8'));
const skillData=JSON.parse(fs.readFileSync(path.join(championRoot,'moves.json'),'utf8'));
const catalog=JSON.parse(fs.readFileSync(path.join(arenaRoot,'catalog.json'),'utf8'));
const descriptions=JSON.parse(fs.readFileSync(path.join(championRoot,'descriptions.json'),'utf8'));
const files=[],sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function put(relative,bytes){const file=path.join(out,relative),before=path.join(baseline,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);files.push({path:relative,before:fs.existsSync(before)?sha(fs.readFileSync(before)):null,after:sha(bytes)});}
function once(text,before,after){assert.equal(text.split(before).length,2,'Baseline anchor changed: '+before.slice(0,100));return text.replace(before,after);}
function patch(relative,fn){put(relative,fn(fs.readFileSync(path.join(baseline,relative),'utf8')));}
const battle='app/dist/GameServer/Game/Battle/';
for(const [source,target]of [['ChampionPetRuntime.js','ChampionPetRuntime.js'],['moves.json','ChampionPetData.json'],['effect-arguments.json','ChampionEffectArguments.json']])put(battle+target,fs.readFileSync(path.join(championRoot,source)));
for(const [source,target]of [['StarArena.js','StarArena.js'],['catalog.json','StarArenaCatalog.json']])put(battle+target,fs.readFileSync(path.join(arenaRoot,source)));
put('app/dist/GameServer/Server/Packet/Recv/Battle/StarArenaHandlers.js',fs.readFileSync(path.join(arenaRoot,'StarArenaHandlers.js')));
put('app/dist/DataBase/migrations/scripts/027_create_star_arena.js',fs.readFileSync(path.join(arenaRoot,'027_create_star_arena.js')));
patch(battle+'SkillEffectRuntime.js',text=>text+'\nrequire("./ChampionPetRuntime").ChampionPetRuntime.Install(SkillEffectRuntime);\n');
patch(battle+'services/BattleInitService.js',text=>once(text,'let playerSkills = playerPet.skillArray.filter(s => s > 0);','let playerSkills = require("../ChampionPetRuntime").ChampionPetRuntime.Skills(playerPet);'));
patch('app/dist/GameServer/Game/Pet/PetPP.js',text=>once(text,'const skills = pet.skillArray.filter(id => id > 0);','const skills = require("../Battle/ChampionPetRuntime").ChampionPetRuntime.Skills(pet);'));
patch(battle+'BattleManager.js',text=>{
  text=once(text,'const PetPP_1 = require("../Pet/PetPP");','const PetPP_1 = require("../Pet/PetPP");\nconst Champion = require("./ChampionPetRuntime").ChampionPetRuntime;');
  text=once(text,'const playerSkills = newPet.skillArray.filter((s) => s > 0);','Champion.BeforeSwitch(this._currentBattle, battlePet, battlePet === this._currentBattle?.player ? "player" : "enemy");\n        const playerSkills = Champion.Skills(newPet);');
  text=once(text,'battlePet.effectStates = {};','battlePet.effectStates = {};\n        if (this._currentBattle) Champion.RestoreState(this._currentBattle, battlePet, battlePet === this._currentBattle.player ? "player" : "enemy");');
  text=once(text,'!pet.skillArray.includes(skillId)','!pet.skillArray.includes(skillId) && Champion.Fifth(pet.petId) !== skillId');
  text=once(text,'const pp = battle.player.skillPP[i] - (i === index ? 1 : 0);','const pp = Math.max(0, battle.player.skillPP[i] - (i === index ? Champion.PPCost(battle.player) : 0));');
  text=once(text,'battle.player.skillPP[index]--;','battle.player.skillPP[index] = Math.max(0, battle.player.skillPP[index] - Champion.PPCost(battle.player));');
  text=once(text,'const result = this._turnService.ExecuteTurn(battle, skillId);','const result = this._turnService.ExecuteTurn(battle, skillId);\n        await Champion.PersistPP(this);\n        if (!isCurrent()) return;');
  text=once(text,'const enemyAttackResult = this._turnService.ExecuteEnemyTurn(this._currentBattle);','const enemyAttackResult = this._turnService.ExecuteEnemyTurn(this._currentBattle);\n        await Champion.PersistPP(this);\n        if (!isCurrent()) return;');
  return text;
});
patch(battle+'BattleCore.js',text=>{
  text=once(text,'return BattleAlgorithm_1.BattleAlgorithm.CalculateDamage(attackerStats, defenderStats,','const champion = require("./ChampionPetRuntime").ChampionPetRuntime.PrepareDamage(attacker, defender, skill, defenderStats);\n        return BattleAlgorithm_1.BattleAlgorithm.CalculateDamage(attackerStats, defenderStats,');
  text=once(text,'defender.battleLevels || defender.battleLv, // 优先使用battleLevels','champion?.levels || defender.battleLevels || defender.battleLv, // 优先使用battleLevels');
  return once(text,'{ isCrit });','{ isCrit, minEffectiveness: champion?.minEffectiveness || 0 });');
});
patch(battle+'BattleAlgorithm.js',text=>once(text,'const effectiveness = this.GetTypeEffectiveness(skillType, defenderType);','const effectiveness = Math.max(options.minEffectiveness || 0, this.GetTypeEffectiveness(skillType, defenderType));'));
patch(battle+'BattleTurnExecutor.js',text=>{
  text=once(text,'const turnStartResults = BattleEffectIntegration_1.BattleEffectIntegration.OnTurnStart(battle);','require("./ChampionPetRuntime").ChampionPetRuntime.BeginTurn(battle);\n        const turnStartResults = BattleEffectIntegration_1.BattleEffectIntegration.OnTurnStart(battle);');
  const before='isPvp || battle.enemy.bossMechanics';assert.equal(text.split(before).length,3);text=text.split(before).join('isPvp || battle.enemy.bossMechanics || battle.starArena');
  text=once(text,'BossSpecialRules_1.BossSpecialRules.SpendBossPP(battle, attacker, skill);','BossSpecialRules_1.BossSpecialRules.SpendBossPP(battle, attacker, skill);\n        require("./StarArena").StarArena.SpendPP(battle, attacker, skill);');
  text=once(text,'// 更新回合数（每个完整回合+1）','require("./ChampionPetRuntime").ChampionPetRuntime.RefreshResult(battle, result);\n        // 更新回合数（每个完整回合+1）');
  return text;
});
patch(battle+'services/BattleTurnService.js',text=>{
  const before='require("../BossSpecialRules").BossSpecialRules.SelectBossSkill(battle, BattleCore_1.BattleCore.AISelectSkill(battle.enemy, battle.player, battle.enemy.skills, skillConfigs))';assert.equal(text.split(before).length,3);
  return text.split(before).join('battle.starArena ? require("../StarArena").StarArena.SelectSkill(battle, skillConfigs) : '+before);
});
patch('app/dist/GameServer/Server/Packet/Recv/Battle/index.js',text=>text+'\n__exportStar(require("./StarArenaHandlers"), exports);\n');
patch('app/dist/DataBase/migrations/MigrationRunner.js',text=>{
  text=once(text,'const AllMigrations = [','const { Migration027CreateStarArena } = require("./scripts/027_create_star_arena");\nconst AllMigrations = [');
  return once(text,'new Migration026CreateExperienceSettings(),','new Migration026CreateExperienceSettings(),\n  new Migration027CreateStarArena(),');
});
const xmlEscape=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const attrs=object=>Object.entries(object).map(([key,value])=>`${key}="${xmlEscape(value)}"`).join(' ');
const monsterXML=pets.map(pet=>`<Monster ${attrs(pet.attributes)}><LearnableMoves>${pet.learnableMoves.map(move=>`<Move ID="${move.id}" LearningLv="${move.level}"/>`).join('')}</LearnableMoves><ExtraMoves>${pet.extraMoves.map(move=>`<Move ID="${move.id}" LearningLv="${move.level}"/>`).join('')}</ExtraMoves></Monster>`).join('\n');
function mergeSpecies(text){for(const pet of pets)assert.ok(!new RegExp(`<Monster\\b[^>]*\\bID="${pet.id}"(?:\\s|>)`).test(text),'Champion already configured: '+pet.id);return once(text,'</Monsters>',monsterXML+'\n</Monsters>');}
function mergeMoves(text){let added=[];for(const move of skillData.moves){if(!new RegExp(`<Move\\b[^>]*\\bID="${move.ID}"(?:\\s|/|>)`).test(text))added.push('<Move '+attrs(move)+'/>');}return once(text,'</Moves>',added.join('\n')+'\n</Moves>');}
patch('app/config/data/xml/pets.xml',mergeSpecies);
patch('app/config/data/xml/skills.xml',mergeMoves);
patch('app/config/data/json/map-ogres.json',text=>{const config=JSON.parse(text);assert.ok(!config.maps[9508]);config.maps[9508]={name:'帕诺星系擂台',spawnCount:0,ogres:[]};return JSON.stringify(config,null,2)+'\n';});
function parse(raw){assert.equal(raw.subarray(0,3).toString(),'CWS');const body=zlib.inflateSync(raw.subarray(8));assert.equal(body.length+8,raw.readUInt32LE(4));let pos=Math.ceil((5+(body[0]>>3)*4)/8)+4;const header=body.subarray(0,pos),tags=[];while(pos<body.length){const start=pos,short=body.readUInt16LE(pos);pos+=2;const code=short>>6;let length=short&63;if(length===63){length=body.readUInt32LE(pos);pos+=4;}const payload=body.subarray(pos,pos+length);pos+=length;tags.push({code,payload,name:code===82?payload.subarray(4,payload.indexOf(0,4)).toString():null,raw:body.subarray(start,pos)});if(!code)break;}assert.equal(pos,body.length);return{raw,header,tags};}
function encode(source,tags){const body=Buffer.concat([source.header,...tags.map(tag=>tag.raw)]),head=Buffer.from(source.raw.subarray(0,8));head.writeUInt32LE(body.length+8,4);return Buffer.concat([head,zlib.deflateSync(body)]);}
function tag(code,payload){const head=Buffer.alloc(6);head.writeUInt16LE((code<<6)|63);head.writeUInt32LE(payload.length,2);return{code,payload,raw:Buffer.concat([head,payload])};}
function readU30(buf,pos){let value=0;for(let index=0,shift=0;index<5;index++,shift+=7){const byte=buf[pos++];value+=(byte&127)*2**shift;if(!(byte&128))break;}return[value,pos];}
function writeU30(value){const bytes=[];do{let byte=value&127;value=Math.floor(value/128);if(value)byte|=128;bytes.push(byte);}while(value);return Buffer.from(bytes);}
function stubFrom(source){const nameEnd=source.payload.indexOf(0,4),abc=source.payload.subarray(nameEnd+1);let pos=4,count;[count,pos]=readU30(abc,pos);for(let i=1;i<count;i++)[,pos]=readU30(abc,pos);[count,pos]=readU30(abc,pos);for(let i=1;i<count;i++)[,pos]=readU30(abc,pos);[count,pos]=readU30(abc,pos);pos+=8*Math.max(0,count-1);const parts=[abc.subarray(0,pos)];[count,pos]=readU30(abc,pos);parts.push(writeU30(count));let changed=0;for(let i=1;i<count;i++){let length;[length,pos]=readU30(abc,pos);let value=abc.subarray(pos,pos+length).toString();pos+=length;if(value.includes('MapProcess_340')){value=value.split('MapProcess_340').join('MapProcess_9508');changed++;}const bytes=Buffer.from(value);parts.push(writeU30(bytes.length),bytes);}parts.push(abc.subarray(pos));assert.ok(changed);const result=tag(82,Buffer.concat([source.payload.subarray(0,4),Buffer.from(source.name.replace('MapProcess_340','MapProcess_9508')+'\0'),...parts]));result.name=source.name.replace('MapProcess_340','MapProcess_9508');return result;}
function xmlTag(source,symbol,transform){let id;for(const item of source.tags.filter(t=>t.code===76)){let pos=2;for(let i=0;i<item.payload.readUInt16LE(0);i++){const candidate=item.payload.readUInt16LE(pos);pos+=2;const stop=item.payload.indexOf(0,pos);if(item.payload.subarray(pos,stop).toString()===symbol)id=candidate;pos=stop+1;}}assert.ok(id,'Missing XML symbol '+symbol);const original=source.tags.find(t=>t.code===87&&t.payload.readUInt16LE(0)===id);assert.ok(original);const updated=tag(87,Buffer.concat([original.payload.subarray(0,6),Buffer.from(transform(original.payload.subarray(6).toString('utf8')))]));source.tags[source.tags.indexOf(original)]=updated;}
function sources(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?sources(path.join(directory,entry.name)):entry.name.endsWith('.as')?[path.join(directory,entry.name)]:[]);}
function compile(source,group,linkedCore){
  const work=path.join(out,'compiler',group),imports=path.join(work,'import');fs.mkdirSync(work,{recursive:true});fs.cpSync(path.join(root,'compat/client-patches/star-arena',group),imports,{recursive:true});
  if(group==='core'){
    const map=path.join(imports,'scripts/com/robot/app/mapProcess/MapProcess_9508.as');fs.writeFileSync(map,once(fs.readFileSync(map,'utf8'),'private const TRAINERS:Array = []; // @STAR_ARENA_TRAINERS@','private const TRAINERS:Array = '+JSON.stringify(catalog.trainers)+';'));
    const tips=path.join(imports,'scripts/com/robot/core/ui/skillBtn/SkillInfoTip.as');fs.writeFileSync(tips,once(fs.readFileSync(tips,'utf8'),'private static const CHAMPION_DESCRIPTIONS:Object = {}; // @CHAMPION_DESCRIPTIONS@','private static const CHAMPION_DESCRIPTIONS:Object = '+JSON.stringify(descriptions)+';'));
  }
  const originalNames=new Set(source.tags.filter(t=>t.code===82).map(t=>t.name));
  const linked=linkedCore?[...source.tags.filter(t=>t.code!==0),...linkedCore.tags.filter(t=>t.code===82&&!originalNames.has(t.name)),...source.tags.filter(t=>t.code===0)]:source.tags;
  const input=path.join(work,'input.swf'),output=path.join(work,'output.swf');fs.writeFileSync(input,encode(source,linked));
  execFileSync(v.java,['-Djava.awt.headless=true','-Xmx2g','-jar',v.ffdec,'-onerror','abort','-importScript',input,output,imports],{stdio:'inherit',timeout:240000});
  const compiled=parse(fs.readFileSync(output));assert.equal(compiled.tags.length,linked.length,'Unexpected compiler inventory change');const allowed=new Set(sources(path.join(imports,'scripts')).map(file=>path.relative(path.join(imports,'scripts'),file).replace(/\.as$/,'')));
  let count=0;source.tags=source.tags.map((item,index)=>{const replacement=compiled.tags[index];if(item.code!==82||!allowed.has(item.name))return item;assert.equal(item.name,replacement.name);if(!item.raw.equals(replacement.raw))count++;return replacement;});assert.ok(count>0,'No classes compiled');console.log(JSON.stringify({group,compiledClasses:count}));return source;
}
if(!v['server-only']){
  for(const key of ['java','ffdec'])assert.ok(v[key],'Missing --'+key);
  let core=parse(fs.readFileSync(path.join(baseline,'client/overlay/dll/NieoCore.swf')));
  const template=core.tags.find(t=>t.name==='com/robot/app/mapProcess/MapProcess_340');assert.ok(template,'Missing map class template');assert.ok(!core.tags.some(t=>t.name==='com/robot/app/mapProcess/MapProcess_9508'));core.tags.splice(core.tags.indexOf(template)+1,0,stubFrom(template));
  xmlTag(core,'com.robot.core.manager.map.config.MapConfig_xmlCls',text=>{assert.ok(!text.includes('id="9508"'));return once(text,'</Maps>','<map id="9508" name="帕诺星系擂台" x="475" y="395" sound="BGM_055"><Entries><Entry FromMap="0" PosX="475" PosY="395"/><Entry FromMap="102" PosX="475" PosY="395"/></Entries><changeMapComp/><funComp/></map>\n</Maps>');});
  xmlTag(core,'com.robot.core.config.xml.PetXMLInfo_xmlClass',mergeSpecies);
  xmlTag(core,'com.robot.core.config.xml.SkillXMLInfo_xmlClass',mergeMoves);
  xmlTag(core,'com.robot.core.config.xml.PetBookXMLInfo_xmlClass',text=>{
    const records=fs.readFileSync(path.join(championRoot,'encyclopedia.xml'),'utf8').match(/<Monster\b[^>]*\/>/g);
    for(const record of records){
      const id=record.match(/\bID="(\d+)"/)[1],pattern=new RegExp('<Monster\\b[^>]*\\bID="'+id+'"[^>]*\\/>');
      text=pattern.test(text)?text.replace(pattern,record):once(text,'</root>',record+'\n</root>');
    }
    return text;
  });
  core=compile(core,'core');const coreBytes=encode(core,core.tags);put('client/assets/dll/NieoCore.swf',coreBytes);put('client/overlay/dll/NieoCore.swf',coreBytes);
  const fight=compile(parse(fs.readFileSync(path.join(baseline,'client/overlay/resource/module/PetFightDLL.swf'))),'battle',core);put('client/overlay/resource/module/PetFightDLL.swf',encode(fight,fight.tags));
  put('client/overlay/resource/map/9508.swf',fs.readFileSync(path.join(baseline,'client/assets/resource/map/102.swf')));
  const assets=path.join(root,'compat/client-resources/star-arena');
  const existingMoves=new Set([...fs.readFileSync(path.join(baseline,'app/config/data/xml/skills.xml'),'utf8').matchAll(/<Move\b[^>]*\bID="(\d+)"/g)].map(match=>Number(match[1])));
  function installResources(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory()){installResources(file);continue;}if(!entry.name.endsWith('.swf'))continue;const relative=path.relative(assets,file).split(path.sep).join('/');if(relative.includes('/skill/swf/')&&existingMoves.has(Number(entry.name.replace('.swf',''))))continue;put('client/overlay/'+relative,fs.readFileSync(file));if(relative.startsWith('resource/groupFightResource/pet/'))put('client/overlay/'+relative.replace('resource/groupFightResource/pet/','resource/pet/swf/'),fs.readFileSync(file));}}
  installResources(path.join(assets,'resource'));
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({files,restartGame:true,restartWeb:false,migration:27},null,2)+'\n');
console.log(JSON.stringify({out,files:files.length,migration:27}));
