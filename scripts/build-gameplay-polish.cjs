'use strict';
// Incremental build: preserve unrelated captured client and server changes byte-for-byte.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {values: v} = parseArgs({options: Object.fromEntries(['baseline','out','reference','resources','shore','java','ffdec'].map(key => [key,{type:'string'}]))});
for (const key of ['baseline','out','reference','resources','shore','java','ffdec']) assert.ok(v[key], 'Missing --' + key);
const root = path.resolve(__dirname,'..'), baseline = path.resolve(v.baseline), out = path.resolve(v.out);
assert.ok(!fs.existsSync(out),'Choose a fresh output directory');
const patch = path.join(root,'compat/client-patches/map-story');
const server = path.join(root,'compat/server-patches/map-story');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const files = [];
function put(relative,bytes) {
    bytes = Buffer.from(bytes);
    const target = path.join(out,relative), previous = path.join(baseline,relative);
    fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,bytes);
    files.push({path:relative,before:fs.existsSync(previous)?sha(fs.readFileSync(previous)):null,after:sha(bytes)});
}
function once(text,before,after) { assert.equal(text.split(before).length,2,'Changed boundary: '+before.slice(0,100)); return text.replace(before,after); }
function parse(raw) {
    assert.equal(raw.subarray(0,3).toString(),'CWS');
    const body = zlib.inflateSync(raw.subarray(8)); assert.equal(body.length+8,raw.readUInt32LE(4));
    let offset = Math.ceil((5+(body[0]>>3)*4)/8)+4;
    const header = body.subarray(0,offset), tags = [];
    while(offset<body.length) {
        const start=offset,short=body.readUInt16LE(offset);offset+=2;
        let size=short&63;if(size===63){size=body.readUInt32LE(offset);offset+=4;}
        assert.ok(offset+size<=body.length);
        const payload=body.subarray(offset,offset+size);offset+=size;
        tags.push({code:short>>6,payload,name:(short>>6)===82?payload.subarray(4,payload.indexOf(0,4)).toString():null,raw:body.subarray(start,offset)});
        if((short>>6)===0)break;
    }
    assert.equal(offset,body.length);return{prefix:raw.subarray(0,8),header,tags};
}
function encode(movie,tags=movie.tags) {
    const body=Buffer.concat([movie.header,...tags.map(t=>t.raw)]),prefix=Buffer.from(movie.prefix);prefix.writeUInt32LE(body.length+8,4);
    return Buffer.concat([prefix,zlib.deflateSync(body,{level:9})]);
}
function tag(code,payload) {const head=Buffer.alloc(6);head.writeUInt16LE((code<<6)|63);head.writeUInt32LE(payload.length,2);return{code,payload,raw:Buffer.concat([head,payload])};}
function readU30(bytes,pos){let value=0;for(let i=0,shift=0;i<5;i++,shift+=7){const b=bytes[pos++];value+=(b&127)*2**shift;if(!(b&128))break;}return[value,pos];}
function writeU30(value){const bytes=[];do{let b=value&127;value=Math.floor(value/128);if(value)b|=128;bytes.push(b);}while(value);return Buffer.from(bytes);}
function renamed(source,from,to) {
    const nameEnd=source.payload.indexOf(0,4),abc=source.payload.subarray(nameEnd+1);let pos=4,count;
    [count,pos]=readU30(abc,pos);for(let i=1;i<count;i++)[,pos]=readU30(abc,pos);
    [count,pos]=readU30(abc,pos);for(let i=1;i<count;i++)[,pos]=readU30(abc,pos);
    [count,pos]=readU30(abc,pos);pos+=8*Math.max(0,count-1);
    const parts=[abc.subarray(0,pos)];[count,pos]=readU30(abc,pos);parts.push(writeU30(count));let changed=0;
    for(let i=1;i<count;i++){let length;[length,pos]=readU30(abc,pos);let value=abc.subarray(pos,pos+length).toString();pos+=length;if(value.includes(from)){value=value.split(from).join(to);changed++;}const bytes=Buffer.from(value);parts.push(writeU30(bytes.length),bytes);}
    parts.push(abc.subarray(pos));assert.ok(changed);
    const result=tag(82,Buffer.concat([source.payload.subarray(0,4),Buffer.from(source.name.replace(from,to)+'\0'),...parts]));result.name=source.name.replace(from,to);return result;
}
function xmlResource(movie,name) {
    let id;
    for(const t of movie.tags.filter(t=>t.code===76)) {
        let p=2;for(let i=0;i<t.payload.readUInt16LE(0);i++){const n=t.payload.readUInt16LE(p);p+=2;const end=t.payload.indexOf(0,p);if(t.payload.subarray(p,end).toString()===name){assert.equal(id,undefined);id=n;}p=end+1;}
    }
    assert.notEqual(id,undefined,'Missing XML '+name);
    const data=movie.tags.filter(t=>t.code===87&&t.payload.readUInt16LE(0)===id);assert.equal(data.length,1);
    return{tag:data[0],text:data[0].payload.subarray(6).toString('utf8')};
}
function updateXml(movie,name,transform) {
    const source=xmlResource(movie,name),replacement=tag(87,Buffer.concat([source.tag.payload.subarray(0,6),Buffer.from(transform(source.text))]));
    movie.tags[movie.tags.indexOf(source.tag)]=replacement;
}
const corePath='client/assets/dll/NieoCore.swf', original=fs.readFileSync(path.join(baseline,corePath));
assert.ok(original.equals(fs.readFileSync(path.join(baseline,'client/overlay/dll/NieoCore.swf'))));
const core=parse(original),referenceBytes=fs.readFileSync(v.reference);
assert.equal(sha(referenceBytes),'e5359e1556f602700ef4a13cfa67cc504e6b25cda7ef59294da2140a82391e7a');
const reference=parse(referenceBytes);
const byName=new Map(core.tags.filter(t=>t.code===82).map(t=>[t.name,t]));
const refByName=new Map(reference.tags.filter(t=>t.code===82).map(t=>[t.name,t]));
const existing={
    'com/robot/app/task/control/TasksController':'c961e1c05ad8e130c05bd4bca60f3f54d2cfa99a180758a1f0d628fb6244b59c',
    'com/robot/app/npc/npcClass/NpcClass_1':'54c3d5b99c51f5492a539a076767887e9376bded8ecd75208b83b2b61b7cab99',
    'com/robot/app/npc/npcClass/NpcClass_3':'f200d2093e8f8602b4011dce005cb76db2014423ce989be533fa7e730492bfae',
    'com/robot/app/mapProcess/MapProcess_426':'ac87efc1d89f327a8efa7758c5516d81063c435c4fd28c61a57b1efecf2bd55b',
    'com/robot/core/manager/MapManager':'91131515bb4d74a5f2464b6a6dafbc66f810d9739995b9655cd4937d56d30a34',
    'com/robot/core/controller/MapController':'219b7625f4af24d29aa50495cb333771a746631b1c41dfeaf51571d51ff3cbc7',
    'com/robot/core/manager/map/config/MapProcessConfig':'c9131b17a7f0f38df2ca03efae6618e6dc038c71fc8cf2b181b690912982a6bd',
    'com/robot/app/mapProcess/MapProcess_425':'3cf42230b4f2d12c1a13bbd574f58fed034ce248c036ffe17cd21dd663a6aef5',
    'com/robot/app/mapProcess/MapProcess_684':'9eceeef802146705e56f215ff4bb7752febfa3646c1fdcbb399ca84f71750b8d',
    'com/robot/app/mapProcess/MapProcess_685':'b2eee7d0f30a6cef025f22ce90db089071c6885d5e18783d8c0219eaaacc7720',
    'com/robot/app/mapProcess/MapProcess_686':'ccc1e8fac35cdf139ae85e03fd30656a309098bcb1ac7ac5db79643ae72069aa'
};
for(const [name,hash] of Object.entries(existing))assert.equal(sha(byName.get(name).raw),hash,'Reconcile '+name);
const names=Object.keys(existing);
for(const id of [811,816,819])names.push('com/robot/app/task/taskscollection/Task'+id,'com/robot/app/task/control/TaskController_'+id);
names.push('com/robot/app/task/taskscollection/StoryScene');
for(const id of [666,693,81951,10039])names.push('com/robot/app/mapProcess/MapProcess_'+id);
const additions=[];
for(const name of names.filter(n=>!Object.hasOwn(existing,n))) {
    assert.ok(!byName.has(name),'Class already exists: '+name);
    let donor=refByName.get(name);
    if(!donor&&name.endsWith('/StoryScene'))donor=renamed(refByName.get('com/robot/app/task/taskscollection/Task811'),'Task811','StoryScene');
    if(!donor&&name.includes('/mapProcess/'))donor=renamed(byName.get('com/robot/app/mapProcess/MapProcess_340'),'MapProcess_340',path.basename(name));
    assert.ok(donor,'Missing donor '+name);additions.push(donor);
}
const symbolIndex=core.tags.findIndex(t=>t.code===76);assert.ok(symbolIndex>=0);core.tags.splice(symbolIndex,0,...additions);
const compiler=path.join(out,'compiler'),imports=path.join(compiler,'import');
for(const name of names){const target=path.join(imports,'scripts',name+'.as');fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(patch,'scripts',name+'.as'),target);}
fs.mkdirSync(compiler,{recursive:true});const linked=path.join(compiler,'linked.swf'),compiledPath=path.join(compiler,'compiled.swf');
fs.writeFileSync(linked,encode(core));
execFileSync(v.java,['-Djava.awt.headless=true','-jar',v.ffdec,'-onerror','abort','-importScript',linked,compiledPath,imports],{stdio:'inherit',timeout:240000});
const compiled=parse(fs.readFileSync(compiledPath));assert.equal(compiled.tags.length,core.tags.length);
compiled.tags.forEach((t,i)=>{if(t.code!==82||!names.includes(t.name))assert.ok(t.raw.equals(core.tags[i].raw),'Unrelated compiled change '+(t.name||t.code));});
const questSymbol='com.robot.core.config.xml.TasksXMLInfo_xmlClass';
updateXml(compiled,questSymbol,xml=>{
    const definitions=fs.readFileSync(path.join(patch,'quests.xml'),'utf8');
    for(const id of [811,816,819,10039]) {
        assert.ok(!new RegExp('<task\\b[^>]*\\bID="'+id+'"').test(xml));
        const entries=definitions.match(new RegExp('<task\\b[^>]*\\bID="'+id+'"[^>]*>[\\s\\S]*?<\\/task>','g'));assert.equal(entries?.length,1);
        xml=once(xml,'</tasks>',entries[0]+'\n</tasks>');
    }
    return xml;
});
const archiveSymbol='com.robot.app.tasksRecord.TasksRecordConfig_xmlClass';
updateXml(compiled,archiveSymbol,xml=>{
    const ref=fs.readFileSync(path.join(patch,'chapters.xml'),'utf8');
    const entries=[811,816,819].map(id=>{assert.ok(!new RegExp('<task\\b[^>]*\\bid="'+id+'"').test(xml));const found=ref.match(new RegExp('<task\\b[^>]*\\bid="'+id+'"[^>]*\\/>','g'));assert.equal(found?.length,1);return found[0];});
    const anchor=xml.match(/<task\b[^>]*\bid="801"[^>]*\/>/g);assert.equal(anchor?.length,1);
    return once(xml,anchor[0],anchor[0]+'\n'+entries.join('\n'));
});
updateXml(compiled,'com.robot.core.config.xml.NpcXMLInfo_xmlClass',xml=>{
    for(const [npcId,taskIds] of [[3,[811]],[1,[816,819]]]) {
        const entries=xml.match(new RegExp('<npc\\b[^>]*\\bid="'+npcId+'"[^>]*>','g'));
        assert.equal(entries?.length,1,'NPC continuation entry '+npcId);
        let replacement=entries[0];
        // These chapters finish in their scenes, never through generic NPC endTask completion.
        for(const field of ['startTask','proTask']) {
            const attribute=new RegExp('\\b'+field+'="([^"]*)"'),match=replacement.match(attribute);
            assert.ok(match,'Missing NPC task field '+field);
            const ids=match[1]?match[1].split('|'):[];
            for(const id of taskIds){assert.ok(!ids.includes(String(id)));ids.push(String(id));}
            replacement=replacement.replace(attribute,field+'="'+ids.join('|')+'"');
        }
        xml=once(xml,entries[0],replacement);
    }
    return xml;
});
updateXml(compiled,'com.robot.core.manager.map.config.MapConfig_xmlCls',xml=>{
    const definitions=fs.readFileSync(path.join(patch,'maps.xml'),'utf8');
    for(const id of [81951,10039]) {
        assert.ok(!new RegExp('<map\\b[^>]*\\bid="'+id+'"').test(xml));
        const entries=definitions.match(new RegExp('<map\\b[^>]*\\bid="'+id+'"[^>]*>[\\s\\S]*?<\\/map>','g'));assert.equal(entries?.length,1);
        xml=once(xml,'</Maps>',entries[0]+'\n</Maps>');
    }
    xml=once(xml,'des="//时空罗盘-测试ML"','des="时空罗盘"');
    return xml;
});
const finalCore=encode(compiled);put(corePath,finalCore);put('client/overlay/dll/NieoCore.swf',finalCore);
const moduleNames=[...['811','816','819'].map(id=>'com/robot/module/task/TaskPanel_'+id),'com/robot/module/app/TaskCartoon','com/robot/module/app/TaskIntro_816'];
for(const name of moduleNames) {
    const relative='module/'+name+'.swf',sourceFile=path.join(v.resources,relative),movie=parse(fs.readFileSync(sourceFile));
    assert.equal(movie.tags.filter(t=>t.code===82).length,1,'Module ABC inventory '+name);
    const dir=path.join(compiler,'modules',path.basename(name)),moduleImports=path.join(dir,'import'),target=path.join(moduleImports,'scripts',name+'.as');
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(patch,'modules',path.basename(name),'scripts',name+'.as'),target);
    const context=path.join(dir,'context.swf'),output=path.join(dir,'compiled.swf');
    fs.writeFileSync(context,encode(movie,movie.tags.flatMap(t=>t.code===82?[...compiled.tags.filter(t=>t.code===82),t]:[t])));
    execFileSync(v.java,['-Djava.awt.headless=true','-jar',v.ffdec,'-onerror','abort','-importScript',context,output,moduleImports],{stdio:'inherit',timeout:240000});
    const replacement=parse(fs.readFileSync(output)).tags.filter(t=>t.code===82).at(-1);assert.equal(replacement.name,movie.tags.find(t=>t.code===82).name);
    put('client/overlay/'+relative,encode(movie,movie.tags.map(t=>t.code===82?replacement:t)));
}
const preservedCatalogs = {};
for(const module of [
    {name:'com/robot/module/book/PetAmalgamationBookPanel',relative:'client/overlay/module/com/robot/module/book/PetAmalgamationBookPanel.swf',source:'compat/client-patches/fusion-manual/PetAmalgamationBookPanel.as',hash:'da1985b7d34179f69d47408741131c6c59ef2575198398ea318de412937c84fb'},
    {name:'PetCollectionGallery',relative:'client/overlay/resource/book/petCollection.swf',source:'compat/client-patches/pet-collection/monsterBook.as',hash:'a4fc0719d8bc6edc514681921acd2dd0b73740270d6477756a6a0a387893a9ef'},
    {name:'monsterBook',relative:'client/overlay/resource/book/monsterBook.swf',source:'compat/client-patches/pet-boss-handbook/monsterBook.as',hash:'7adaca8364b5975ff8e7d90cee50caa7f99e7274a08b8dfc373b313d9204a45d'}
]) {
    const sourceFile=path.join(baseline,module.relative),bytes=fs.readFileSync(sourceFile);
    assert.equal(sha(bytes),module.hash,'Reconcile native-control module '+module.name);
    const movie=parse(bytes);assert.equal(movie.tags.filter(t=>t.code===82).length,1);
    const dir=path.join(compiler,'modules',path.basename(module.name)),exported=path.join(dir,'baseline');
    execFileSync(v.java,['-Djava.awt.headless=true','-jar',v.ffdec,'-selectclass',module.name.replaceAll('/','.'),'-export','script',exported,sourceFile],{stdio:'inherit',timeout:120000});
    const deployed=fs.readFileSync(path.join(exported,'scripts',module.name+'.as'),'utf8');
    let source=fs.readFileSync(path.join(root,module.source),'utf8');
    const marker='private const catalog:Array = []; // @CATALOG@';
    assert.equal(source.split(marker).length,2);
    if(module.name==='PetCollectionGallery'||module.name==='monsterBook') {
        const methods=deployed.match(/      private function (?:buildCatalog|catalog\d+)\(\) : Array\r?\n      \{[\s\S]*?\r?\n      \}/g);
        assert.ok(methods?.length>1,'Missing deployed collection catalog');
        source=source.replace(marker,'private const catalog:Array = buildCatalog();');
        assert.ok(/\n   }\s*}\s*$/.test(source));
        source=source.replace(/\n   }\s*}\s*$/,'\n'+methods.join('\n')+'\n   }\n}\n');
        preservedCatalogs[module.name]={methods:methods.length,sha256:sha(Buffer.from(methods.join('\n')))};
        if(module.name==='monsterBook') {
            const methodology=deployed.match(/private const methodology:Array = \[[\s\S]*?\];/);
            assert.ok(methodology,'Missing deployed handbook methodology');
            const methodologyMarker='private const methodology:Array = []; // @METHODOLOGY@';
            assert.equal(source.split(methodologyMarker).length,2);
            source=source.replace(methodologyMarker,methodology[0]);
            preservedCatalogs[module.name].methodologySha256=sha(Buffer.from(methodology[0]));
        }
    } else {
        const declaration=deployed.match(/private const catalog:Array = \[[\s\S]*?\];/);
        assert.ok(declaration,'Missing deployed fusion catalog');
        const catalog=JSON.parse(declaration[0].replace('private const catalog:Array = ','').slice(0,-1));
        source=source.replace(marker,declaration[0]);
        preservedCatalogs[module.name]={entries:catalog.length,sha256:sha(Buffer.from(JSON.stringify(catalog)))};
    }
    const moduleImports=path.join(dir,'import'),target=path.join(moduleImports,'scripts',module.name+'.as');
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,source);
    const context=path.join(dir,'context.swf'),output=path.join(dir,'compiled.swf');
    fs.writeFileSync(context,encode(movie,movie.tags.flatMap(t=>t.code===82?[...compiled.tags.filter(t=>t.code===82),t]:[t])));
    execFileSync(v.java,['-Djava.awt.headless=true','-jar',v.ffdec,'-onerror','abort','-importScript',context,output,moduleImports],{stdio:'inherit',timeout:240000});
    const replacement=parse(fs.readFileSync(output)).tags.filter(t=>t.code===82).at(-1);
    assert.equal(replacement.name,movie.tags.find(t=>t.code===82).name);
    assert.ok(!replacement.raw.equals(movie.tags.find(t=>t.code===82).raw));
    put(module.relative,encode(movie,movie.tags.map(t=>t.code===82?replacement:t)));
}
for(const relative of ['resource/map/666.swf','resource/map/693.swf',...[811,816,819].map(id=>'resource/task/icon/'+id+'.swf'),...['task_811_1','task_811_2','task_811_3','task_816_1','task_816_3','task_816_4','task_816_5','task_819_1','task_819_2','task_819_3','cartoon/task_816'].map(name=>'resource/bounsMovie/'+name+'.swf')])put('client/overlay/'+relative,fs.readFileSync(path.join(v.resources,relative)));
const nicolStory=fs.readFileSync(path.join(v.resources,'resource/map/57.swf'));
assert.equal(sha(nicolStory),'a611c90482ca1500fdefb9e9e3e2f8f1e42c5aea0e091aa8cc00ccdf5c4f30b2');
put('client/overlay/resource/map/81957.swf',nicolStory);
const shore=fs.readFileSync(v.shore);assert.equal(sha(shore),'34663dec97ed44d4701c3888a72c172c81790ebf43a7354af685c43d3f0003fa');
put('client/overlay/resource/map/81951.swf',shore);
const compass=fs.readFileSync(path.join(v.resources,'resource/map/425.swf'));
assert.equal(sha(compass),'c982eaa33ff1f15179d08196e8d060c0f042c20a0076a7d26b47ec2080b93971');
put('client/overlay/resource/map/10039.swf',compass);
const taskRelative='app/config/data/json/tasks.json',tasks=JSON.parse(fs.readFileSync(path.join(baseline,taskRelative))),definitions=JSON.parse(fs.readFileSync(path.join(server,'tasks.json'))).tasks;
for(const id of ['811','816','819','10039']){assert.ok(!Object.hasOwn(tasks.tasks,id),'Existing server task '+id);tasks.tasks[id]=definitions[id];}
put(taskRelative,JSON.stringify(tasks,null,2)+'\n');
const bossRelative='app/config/data/json/boss_abilities.json',bosses=JSON.parse(fs.readFileSync(path.join(baseline,bossRelative))),newBosses=JSON.parse(fs.readFileSync(path.join(server,'gameplay-content.json'))).bossConfigs;
for(const boss of newBosses){assert.ok(!bosses.bossConfigs.some(b=>b.mapId===boss.mapId&&(b.param2??0)===boss.param2),'Boss entry exists; reconcile before merging');bosses.bossConfigs.push(boss);}
put(bossRelative,JSON.stringify(bosses,null,2)+'\n');
put('app/dist/GameServer/Game/Map/GameplayRewards.js',fs.readFileSync(path.join(server,'GameplayRewards.js')));
const completeRelative='app/dist/GameServer/Game/Task/CompleteConfiguredTask.js';
let complete=fs.readFileSync(path.join(baseline,completeRelative),'utf8');
complete=once(complete,'    const stored = buffers[taskId];','    const stored = buffers[taskId];\n    if (config.requiresCompassVictory && stored?.compassVictory !== true) throw new Error("Defeat the compass guardian before claiming the trial reward");');
put(completeRelative,complete);
const battleRelative='app/dist/GameServer/Game/Battle/BattleManager.js';
let battle=fs.readFileSync(path.join(baseline,battleRelative),'utf8');
battle=once(battle,'            if (!await require("../Map/ForestMechanisms").ValidateForestBossEntry(this.Player, mapId, param2, bossConfig)) return;','            if (!await require("../Map/ForestMechanisms").ValidateForestBossEntry(this.Player, mapId, param2, bossConfig)) return;\n            if (!await require("../Map/GameplayRewards").ValidateCompassEntry(this.Player, mapId, param2, bossConfig)) return;');
put(battleRelative,battle);
const rewardRelative='app/dist/GameServer/Game/Battle/services/BattleRewardService.js';
let reward=fs.readFileSync(path.join(baseline,rewardRelative),'utf8');
reward=once(reward,'        try {\n            let expGained = 0;','        try {\n            stage = "map-progress";\n            result.droppedItems.push(...await require("../../Map/GameplayRewards").GrantMapVictory(this._player, battle));\n            stage = "experience";\n            let expGained = 0;');
put(rewardRelative,reward);
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({classes:names,files,preservedCatalogs,restartGame:true,restartWeb:false,databaseChanges:false,projectAuthored:['Task811 ending dialogue','Map81951 shore bridge','Map10039 compass trial','missing 684/686 boss balance'],preserved:['unrelated core ABCs','native module artwork','all existing boss configurations','prices','player database']},null,2)+'\n');
console.log(JSON.stringify({classes:names.length,files:files.length,coreSha256:sha(finalCore)},null,2));
