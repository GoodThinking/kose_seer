'use strict';
// Compile only the named scene controllers; retain every unrelated captured tag byte-for-byte.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {values: v} = parseArgs({options: Object.fromEntries(['baseline','out','java','ffdec','reference','resources'].map(key => [key,{type:'string'}]))});
for (const key of ['baseline','out','java','ffdec','reference','resources']) assert.ok(v[key], 'Missing --' + key);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out);
assert.ok(!fs.existsSync(out), 'Choose a fresh output directory');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const resourceRules=JSON.parse(fs.readFileSync(path.join(__dirname,'../compat/client-patches/map-story/resources.json')));
const trainingDailyTaskIds=[401,402,403,404,405,406,407];
const movieRule=resourceRules.find(rule=>rule.path==='resource/bounsMovie/task_802_1.swf');
assert.ok(movieRule,'Missing original rescue cinematic provenance');
const movieBytes=fs.readFileSync(path.join(v.resources,movieRule.path));
assert.equal(movieBytes.length,movieRule.bytes);
assert.equal(sha(movieBytes),movieRule.sha256,'Original rescue cinematic differs');
const pirate=JSON.parse(fs.readFileSync(path.join(__dirname,'../compat/server-patches/map-story/pirate_rescue.json')));
const pirateMapRule=resourceRules.find(rule=>rule.path==='resource/map/50.swf');
assert.equal(pirateMapRule?.sha256,pirate.mapSha256,'Reconcile map50 layout provenance');
const pirateMapBytes=fs.readFileSync(path.join(v.resources,pirateMapRule.path));
assert.equal(pirateMapBytes.length,pirateMapRule.bytes);
assert.equal(sha(pirateMapBytes),pirate.mapSha256,'Map50 actor layout changed');
const pirateExitRule=resourceRules.find(rule=>rule.path==='resource/map/48.swf');
assert.ok(pirateExitRule,'Missing verified pirate exit geometry');
const pirateExitBytes=fs.readFileSync(path.join(v.resources,pirateExitRule.path));
assert.equal(pirateExitBytes.length,pirateExitRule.bytes);
assert.equal(sha(pirateExitBytes),pirateExitRule.sha256,'Map48 exit road mask changed');
const restoredInputs=['resource/map/8.swf','resource/map/31.swf','resource/map/33.swf','resource/map/34.swf','resource/map/337.swf','resource/map/343.swf','module/com/robot/module/task/VestigeSpriteSingal.swf','module/com/robot/module/task/VestigeQitaAssembly.swf','module/com/robot/module/task/TaskPanel_94.swf','resource/module/clothBook/collectionTools.swf','resource/map/10038.swf','module/com/robot/module/app/KingTowerChoicePanel.swf','module/com/robot/module/app/KingTowerHeroChoicePanel.swf','module/com/robot/module/app/honorsHall/SpaceGuard.swf','resource/groupTrainingUI.swf','module/com/robot/module/app/GroupListPanel.swf','module/com/robot/module/task/TaskPanel_131.swf','dll/GroupFightDLL.swf','module/com/robot/module/task/MonsterShow.swf','resource/bounsMovie/groupguide.swf','module/com/robot/module/game/ElectricGame.swf','module/com/robot/module/task/SkeeCloth.swf'].map(relative=>{
    const rule=resourceRules.find(candidate=>candidate.path===relative);
    assert.ok(rule,'Missing restored resource provenance: '+relative);
    const bytes=fs.readFileSync(path.join(v.resources,relative));
    assert.equal(bytes.length,rule.bytes);
    assert.equal(sha(bytes),rule.sha256,'Restored source resource changed: '+relative);
    return {rule,bytes};
});
const spiralClasses = {
    'com/robot/app/mapProcess/MapProcess_704':'d1dfc733d1ca9f2025547c68184375e33561b5436b4166458c007d065931878c',
    'com/robot/app/mapProcess/MapProcess_708':'526bab9dfc64065fae2192f8ca6c37b583c9ee0311e769a432a5917bfc4b5dc2',
    'com/robot/app/mapProcess/MapProcess_709':'9b809167c967e23a0a4b4d5cb00e5bc2649867a12df23fd6944e888cc7db1aa1',
    'com/robot/app/mapProcess/MapProcess_710':'a077539d2e66822619077eb4858472ed1bd9c9de93a8ce29ac7d5300b47a2c88',
    'com/robot/app/mapProcess/MapProcess_715':'4319e2b4d4f848e7d4b114b92399ebeba51089928460bdbe164a264883403127',
    'com/robot/app/mapProcess/MapProcess_926':'bd0b3091f40fa0dffca20fafb17582cfe5b0a368af8b8bf43233b13442978b9d'
};
const classes = {
    ...spiralClasses,
    'com/robot/core/manager/map/config/MapConfig':'29bfa8ffdf6d49a4ca7530e2c40e047ad624682dce3fee2770d73ecd9d6e6039',
    'com/robot/core/manager/MapManager':'4c72e3b7f62239348979c299334db294e840dcde61eb155e6b80e94e2256040a',
    'com/robot/core/controller/MapController':'9bab284d7ed92e4c8f60994a000eeb4a636edf1fe79c2def2bb39f3e757244aa',
    'com/robot/core/cmd/UserListCmdListener':'14883173e669a6ce0be0404ced67608685b1b8aab8fe2da0619bdf670cfcac5d',
    'com/robot/core/mode/MapModel':'f347911644783a3d5827e9f4ceb6b9c194fe30fb55efabfbd41245c59ed68ef5',
    'com/robot/core/mode/NonoModel':'8376551d129ea878321415c1ad5be9b94f4a92fdc92bec317575d23e6088cbb6',
    'com/robot/core/ui/mapTip/MapTip':'8bc1d5a8cae3bf98550b14808a29657d0aaf93b79f462c81701a5026ab626e22',
    'com/robot/core/mode/BasePeoleModel':'f7b3b9263e7c1810d46738a0d1edc9d7abecf0e75bd09672dafd5d65080ea642',
    'com/robot/app/task/control/TasksController':'1b2de04184f45673f2c54e68cf9ffcf6ccd7a4e24113288d384dde234d1dfb94',
    'com/robot/app/task/control/TaskController_7':'acf6d89a664ab6f62d3287e5545c7707683bcbdfb99a73a59369846afe5dac58',
    'com/robot/app/task/skeeClothTask/SkeeClothTaskController':'e8016e6fe6efd040655999222ef5f62ad12b153f5a410dd039a7c14f0c2705c4',
    'com/robot/app/task/tc/TaskClass_7':'083c2bfe802754ab017288667a1b9ab25197585a9b71e32a3bf34829d4d2c2a7',
    'com/robot/app/npc/npcClass/NpcClass_2':'98857eb74231ca8a6bd5d704813bf009172a3c5b6968ee84d87c7226174f1f04',
    'com/robot/app/mapProcess/MapProcess_4':'673e7e37908deb7248a5c2f4109bed50e2a8e6825051701b2f21b2c3f806841a',
    'com/robot/app/task/control/TaskController_33':'c31dc1623bb402a488cc3cfd27f83d27c80271ff63333da1091562116c141067',
    'com/robot/app/task/control/TaskController_28':'e677c3f86262c4cc19c94cfe49c8e5f7ce79af3395836aca24217ad398662d8a',
    'com/robot/app/mapProcess/MapProcess_8':'79baef0f4f03e86c532f719f712a89763989e27e9590eefce84c888f47c7883a',
    'com/robot/app/mapProcess/MapProcess_10':'69884564a2c8ba3fd90869b2fbb19c60427a3fd5ef1676b6eac79fa1de68c933',
    'com/robot/app/mapProcess/MapProcess_12':'9df4fa956e60ca9912345a487888378abfafc25b04289fdf934a1b641b41615f',
    'com/robot/app/mapProcess/MapProcess_16':'59a1af8b945e02b7b102504df29728de12039f5e796ed9492045988a87356f22',
    'com/robot/app/mapProcess/MapProcess_17':'abbf4aa76a3abff8027d9286f8cbc7124b137f095aa67c1edb2d0c52824c4307',
    'com/robot/app/task/tc/TaskClass_94':'42f7fac8f534a11e233fd710ef2fba60bf1d8d5f8f532a13c8d36c22fceeb9bd',
    'com/robot/app/buyCloth/BuyClothController':'f566a11089b327e45d2747cd6b0aa5bb4dd9596b5aa2c53f964d0fc8e4e15703',
    'com/robot/app/buyCloth/BuyClothPanel':'76d88b1d9b593962238bb0218d6a9d6000182b563afa4cced85d76459676fe73',
    'com/robot/core/controller/MouseController':'b08156b428e62972cc30148ba9376a304dcca8030a81d8c74bba8b0e62d9285b',
    'com/robot/app/mapProcess/MapProcess_26':'c260e8d4c2b290d2caafe9bbbe6e20bf087d8f42a7cce42b10b7bdd2fc124064',
    'com/robot/app/mapProcess/MapProcess_31':null,
    'com/robot/app/mapProcess/MapProcess_33':'b809f3fb80dbfcffecc63425481f3eaecfb1f0ac12497c2df14f2fd6ac125b83',
    'com/robot/app/mapProcess/MapProcess_34':'ebd0df62bc4e52f860f9bab81f23d0fdf6ea67a77451dc45a0610b94ed5d4cdc',
    'com/robot/app/mapProcess/MapProcess_36':'222791a5cf7cb34478544efd6bff225b739ca8d69dae7bb943682ced9bb8fb0a',
    'com/robot/core/manager/TaskIconManager':'085706c445a7a7519879cabd8b1b31429aea82ded5eb4abdb4ba8688e0535587',
    'com/robot/app/group/GroupUiLinkage':null,
    'com/robot/app/task/process/TaskProcess_11':'700c235c99ff9132ad1fb0207944e85c4d98470eea5e613800d1bc857fd512ce',
    'com/robot/app/mapProcess/MapProcess_110':'2603b9f60e02a2f40ad677e76e7beee93455ee6187756aec092c25d3b4796f53',
    'com/robot/app/darkPortal/DarkPortalModel':'0059916c4dcef2c1e70b17a4fea2003b509a28dd43919d7b8d0377e83272897e',
    'com/robot/app/mapProcess/MapProcess_465':null,
    'com/robot/app/mapProcess/MapProcess_10038':null,
    'com/robot/app/mapProcess/control/SpaceGuardController':null,
    'com/robot/core/config/xml/SpaceGuardXMLInfo':null,
    'com/robot/core/manager/map/MapTransEffect':'4d5dfab0fde3a893e77a006270ed3ed32282f866b25e3e881f49b849db25bbd0',
    'com/robot/app/npc/npcClass/NpcClass_3':'74e41a35a4b9a880d4265e569a089a9f01d0cb9d9b52021c718db1d7bcc2f6b0',
    'com/robot/app/mapProcess/MapProcess_50':null,
    'com/robot/app/mapProcess/MapProcess_684':'81ffd21ca5436ab97aa8449c26bd56ffc6bf2eac5104ba542e643d9800c5fc04',
    'com/robot/app/mapProcess/MapProcess_687':'454b4fd30884eb9e65efcc79890ea243e4ca5c6a71d94650f0797826c2939278',
    'com/robot/app/mapProcess/MapProcess_481':null,
    'com/robot/app/mapProcess/MapProcess_600':'7790499f01748d07e82337f84819ff4521e305dc5c9e5ed5050bf281737b224b',
    'com/robot/app/mapProcess/MapProcess_500':'9b6995d4ed9c26153ff2166c472d9bc46e4818c70d68e4dd130c3ddb209f3eeb',
    'com/robot/app/mapProcess/MapProcess_304':'cc6888fff36140702b7bd8c2a7241d78c3950b0f3762ee2484c6edfe2e6b0d60',
    'com/robot/app/mapProcess/MapProcess_309':null,
    'com/robot/app/task/taskscollection/Task811':'1a18e2bf88a78a9f7d0015a5537f19a61642d1d028173a33233754d958f9291d',
    'com/robot/app/task/taskscollection/Task1143':null,
    'com/robot/app/mapProcess/MapProcess_334':'af44f1c196a2e67b03fb3181ccec1d491725cf470eb4bf23e3f1c34952fc806c',
    'com/robot/app/mapProcess/MapProcess_336':null,
    'com/robot/app/mapProcess/MapProcess_337':null,
    'com/robot/app/mapProcess/MapProcess_338':'29722968bf4f778171d0928d59daa133ed074f37d403d6a4e4d5e5ab29e868bc',
    'com/robot/app/mapProcess/MapProcess_339':'da00cd072c38a38c9f1559813fdcd89dc63197d20866366a1770e81b18326f57',
    'com/robot/app/mapProcess/MapProcess_343':null,
    'com/robot/core/dispatcher/FightDispatcher':null
};
const nativeGroupDir=path.join(__dirname,'../compat/client-patches/map-story');
const nativeGroup=JSON.parse(fs.readFileSync(path.join(nativeGroupDir,'group-native.json'),'utf8'));
for(const name of nativeGroup.classes) {
    assert.ok(!Object.hasOwn(classes,name),'Duplicate native group class: '+name);
    classes[name]=null;
}
for(const [name,hash] of Object.entries(nativeGroup.sharedAbcSha256)) {
    assert.ok(!Object.hasOwn(classes,name),'Duplicate shared group class: '+name);
    classes[name]=hash;
}
const nativeBattle=JSON.parse(fs.readFileSync(path.join(nativeGroupDir,'group-battle/integration.json'),'utf8'));
for (const [name,hash] of Object.entries(nativeBattle.coreClasses)) {
    assert.ok(!Object.hasOwn(classes,name),'Duplicate native battle Core class: '+name);
    classes[name]=hash;
}
const paths = ['client/assets/dll/NieoCore.swf','client/overlay/dll/NieoCore.swf'];
function parse(raw) {
    assert.equal(raw.subarray(0,3).toString(),'CWS');
    const body = zlib.inflateSync(raw.subarray(8));
    assert.equal(body.length + 8,raw.readUInt32LE(4));
    let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
    const header = body.subarray(0,offset), tags = [];
    while (offset < body.length) {
        const start = offset, short = body.readUInt16LE(offset); offset += 2;
        let size = short & 63;
        if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
        assert.ok(offset + size <= body.length);
        const payload = body.subarray(offset,offset + size); offset += size;
        tags.push({code:short >> 6,payload,raw:body.subarray(start,offset),name:(short >> 6) === 82 ? payload.subarray(4,payload.indexOf(0,4)).toString() : null});
        if ((short >> 6) === 0) break;
    }
    assert.equal(offset,body.length);
    return {prefix:raw.subarray(0,8),header,tags};
}
function encode(movie) {
    const body=Buffer.concat([movie.header,...movie.tags.map(tag=>tag.raw)]),prefix=Buffer.from(movie.prefix);
    prefix.writeUInt32LE(body.length+8,4);
    return Buffer.concat([prefix,zlib.deflateSync(body,{level:9})]);
}
function makeTag(code,payload) {
    const header=Buffer.alloc(6);header.writeUInt16LE((code<<6)|63);header.writeUInt32LE(payload.length,2);
    return {code,payload,name:null,raw:Buffer.concat([header,payload])};
}
function once(text,before,after) {
    assert.equal(text.split(before).length,2,'Reconcile changed boundary: '+before.slice(0,90));
    return text.replace(before,after);
}
const original = fs.readFileSync(path.join(baseline,paths[0]));
assert.ok(original.equals(fs.readFileSync(path.join(baseline,paths[1]))), 'Resolve different published Core copies');
const before = parse(original), imports = path.join(out,'compiler/import');
const referenceBytes=fs.readFileSync(v.reference);
assert.equal(sha(referenceBytes),'e5359e1556f602700ef4a13cfa67cc504e6b25cda7ef59294da2140a82391e7a');
const reference=parse(referenceBytes);
const groupSeatBytes=fs.readFileSync(path.join(nativeGroupDir,nativeGroup.seatPoints.path));
assert.equal(groupSeatBytes.length,nativeGroup.seatPoints.bytes,'Native formation XML length changed');
assert.equal(sha(groupSeatBytes),nativeGroup.seatPoints.sha256,'Reconcile native formation XML provenance');
const groupSymbolIndex=before.tags.findIndex(tag=>tag.code===76);
assert.ok(groupSymbolIndex>=0,'Missing Core symbol bindings');
const groupSymbols=before.tags[groupSymbolIndex].payload;
const boundGroupSymbols=new Set();
let groupSymbolCursor=2,groupCharacterId=0;
for(let index=0;index<groupSymbols.readUInt16LE(0);index++) {
    groupCharacterId=Math.max(groupCharacterId,groupSymbols.readUInt16LE(groupSymbolCursor));
    groupSymbolCursor+=2;
    const end=groupSymbols.indexOf(0,groupSymbolCursor);
    assert.ok(end>=groupSymbolCursor,'Invalid Core symbol binding');
    boundGroupSymbols.add(groupSymbols.subarray(groupSymbolCursor,end).toString('utf8'));
    groupSymbolCursor=end+1;
}
assert.equal(groupSymbolCursor,groupSymbols.length);
for(const tag of before.tags.filter(tag=>tag.code===87))groupCharacterId=Math.max(groupCharacterId,tag.payload.readUInt16LE(0));
assert.ok(++groupCharacterId<=0xffff,'Core character IDs exhausted');
const groupCharacterBytes=Buffer.alloc(6);
groupCharacterBytes.writeUInt16LE(groupCharacterId);
const groupSymbolCount=Buffer.alloc(2);
groupSymbolCount.writeUInt16LE(groupSymbols.readUInt16LE(0)+nativeGroup.seatPoints.symbols.length);
const groupBindings=nativeGroup.seatPoints.symbols.map(name=>{
    assert.ok(!boundGroupSymbols.has(name),'Native formation symbol already exists: '+name);
    return Buffer.concat([groupCharacterBytes.subarray(0,2),Buffer.from(name+'\0')]);
});
before.tags[groupSymbolIndex]=makeTag(76,Buffer.concat([groupSymbolCount,groupSymbols.subarray(2),...groupBindings]));
before.tags.splice(groupSymbolIndex,0,makeTag(87,Buffer.concat([groupCharacterBytes,groupSeatBytes])));
for (const [name,hash] of Object.entries(classes)) {
    const matches = before.tags.filter(tag => tag.name === name);
    if(hash) {
        assert.equal(matches.length,1,'Missing or duplicate class: '+name);
        assert.equal(sha(matches[0].payload),hash,'Reconcile newer scene controller: '+name);
    } else {
        assert.equal(matches.length,0,'Class already exists; reconcile before adding: '+name);
        const donorName=name==='com/robot/app/mapProcess/MapProcess_309'?'com/robot/app/mapProcess/MapProcess_304':(name==='com/robot/app/mapProcess/MapProcess_50'||name==='com/robot/app/mapProcess/MapProcess_31')?'com/robot/app/mapProcess/MapProcess_48':name;
        const donors=reference.tags.filter(tag=>tag.name===donorName);
        assert.equal(donors.length,1,'Missing original ABC shell: '+donorName);
        let shell=donors[0];
        if(donorName!==name) {
            const from=Buffer.from(path.basename(donorName)),to=Buffer.from(path.basename(name)),payload=Buffer.from(shell.payload);
            assert.equal(from.length,to.length);
            let renamed=0;
            for(let at=payload.indexOf(from);at>=0;at=payload.indexOf(from,at+to.length)){to.copy(payload,at);++renamed;}
            assert.ok(renamed>0,'Missing donor class identity');
            shell={...makeTag(82,payload),name};
        }
        const index=before.tags.findIndex(tag=>tag.code===76);
        assert.ok(index>=0);before.tags.splice(index,0,shell);
    }
    const sourceRoot = name === 'com/robot/app/mapProcess/MapProcess_600' || name === 'com/robot/app/mapProcess/MapProcess_500' ? '../compat/client-patches/nono-experience/core/scripts' : '../compat/client-patches/map-story/scripts';
    const source = Object.hasOwn(spiralClasses,name)
        ? path.join(__dirname,'../compat/client-patches/spiral-galaxy',path.basename(name) + '.as')
        : path.join(__dirname,sourceRoot,name + '.as');
    const target = path.join(imports,'scripts',name + '.as');
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.copyFileSync(source,target);
}
const compiledPath = path.join(out,'compiler/compiled.swf');
const linkedPath=path.join(out,'compiler/linked.swf');
fs.writeFileSync(linkedPath,encode(before));
execFileSync(v.java,['-Xmx1024m','-XX:ActiveProcessorCount=2','-Djava.awt.headless=true','-jar',v.ffdec,'-onerror','abort','-importScript',linkedPath,compiledPath,imports],{stdio:'inherit',timeout:240000});
const compiled = fs.readFileSync(compiledPath), after = parse(compiled);
assert.ok(before.header.equals(after.header),'Movie geometry changed');
assert.equal(after.tags.length,before.tags.length,'Tag count changed');
const changed = [];
after.tags.forEach((tag,index) => {
    const old = before.tags[index];
    assert.equal(tag.code,old.code,'Tag order changed');
    assert.equal(tag.name,old.name,'ABC order changed');
    if (!tag.raw.equals(old.raw)) {
        assert.ok(Object.hasOwn(classes,tag.name),'Unrelated tag changed: ' + (tag.name || tag.code));
        changed.push(tag.name);
    }
});
assert.deepEqual(changed.sort(),Object.keys(classes).sort(),'Requested source did not compile');
let taskXmlId,mapXmlId,npcXmlId,clothXmlId;
for(const tag of after.tags.filter(tag=>tag.code===76)) {
    let pos=2;
    for(let i=0;i<tag.payload.readUInt16LE(0);i++) {
        const id=tag.payload.readUInt16LE(pos);pos+=2;const end=tag.payload.indexOf(0,pos);
        const symbol=tag.payload.subarray(pos,end).toString();
        if(symbol==='com.robot.core.config.xml.TasksXMLInfo_xmlClass')taskXmlId=id;
        if(symbol==='com.robot.core.manager.map.config.MapConfig_xmlCls')mapXmlId=id;
        if(symbol==='com.robot.core.config.xml.NpcXMLInfo_xmlClass')npcXmlId=id;
        if(symbol==='com.robot.core.config.xml.ExchangeClothXMLInfo_xmlClass')clothXmlId=id;
        pos=end+1;
    }
}
assert.notEqual(taskXmlId,undefined);
const taskXmlIndex=after.tags.findIndex(tag=>tag.code===87&&tag.payload.readUInt16LE(0)===taskXmlId);
assert.ok(taskXmlIndex>=0);
const oldTaskXml=after.tags[taskXmlIndex],questSource=fs.readFileSync(path.join(__dirname,'../compat/client-patches/map-story/quests.xml'),'utf8');
let xml=oldTaskXml.payload.subarray(6).toString('utf8');
// The current project uses the four NEW tutorial tasks, not the orphaned legacy task4.
for(const taskId of [7,28,94,...trainingDailyTaskIds]) {
    const legacyTask=xml.match(new RegExp('<task\\b[^>]*\\bID="'+taskId+'"[^>]*>','g'));
    assert.equal(legacyTask?.length,1);
    assert.match(legacyTask[0],/\bparent="4"/,'Reconcile changed prerequisite: '+taskId);
    xml=once(xml,legacyTask[0],once(legacyTask[0],'parent="4"','parent="85|86|87|88"'));
}
for(const taskId of [33,1247,131,134]) {
    const definition=questSource.match(new RegExp('<task\\b[^>]*\\bID="'+taskId+'"[^>]*>[\\s\\S]*?<\\/task>','g'));
    assert.equal(definition?.length,1,'Missing quest metadata: '+taskId);
    assert.ok(!new RegExp('<task\\b[^>]*\\bID="'+taskId+'"').test(xml),'Quest already published: '+taskId);
    xml=once(xml,'</tasks>',definition[0]+'\n</tasks>');
}
after.tags[taskXmlIndex]=makeTag(87,Buffer.concat([oldTaskXml.payload.subarray(0,6),Buffer.from(xml)]));
assert.notEqual(mapXmlId,undefined,'Missing current map configuration');
const mapXmlIndex=after.tags.findIndex(tag=>tag.code===87&&tag.payload.readUInt16LE(0)===mapXmlId);
assert.ok(mapXmlIndex>=0);
const oldMapXml=after.tags[mapXmlIndex],originalMapXml=oldMapXml.payload.subarray(6).toString('utf8');
const map50=originalMapXml.match(/<map\b[^>]*\bid="50"[^>]*>[\s\S]*?<\/map>/g);
assert.equal(map50?.length,1);
const rescueBinding=map50[0].match(/<component\b[^>]*\bname="rescueBtnMC"[^>]*\/>/g);
assert.equal(rescueBinding?.length,1);
assert.match(rescueBinding[0],/\bhit="rescueBtnHitMc"/);
assert.match(rescueBinding[0],/\bfun="onRescueBtnClick"/);
assert.ok(!/\bisStop=/.test(rescueBinding[0]),'Reconcile changed rescue marker');
let restoredMapXml=once(originalMapXml,map50[0],once(map50[0],rescueBinding[0],rescueBinding[0].replace('/>',' isStop="1"/>')));
const map48=restoredMapXml.match(/<map\b[^>]*\bid="48"[^>]*>[\s\S]*?<\/map>/g);
assert.equal(map48?.length,1);
assert.equal(pirateExitRule.entryCorrections.length,1);
const exitCorrection=pirateExitRule.entryCorrections[0];
const incomingExit=map48[0].match(new RegExp('<Entry\\b[^>]*\\bFromMap="'+exitCorrection.fromMap+'"[^>]*\\/>','g'));
assert.equal(incomingExit?.length,1);
const correctedExit=once(once(incomingExit[0],`PosX="${exitCorrection.before.x}"`,`PosX="${exitCorrection.after.x}"`),`PosY="${exitCorrection.before.y}"`,`PosY="${exitCorrection.after.y}"`);
restoredMapXml=once(restoredMapXml,map48[0],once(map48[0],incomingExit[0],correctedExit));
const map31=restoredMapXml.match(/<map\b[^>]*\bid="31"[^>]*>[\s\S]*?<\/map>/g);
assert.equal(map31?.length,1);
const retiredCable=map31[0].match(/<component\b[^>]*\bname="cableMC"[^>]*\/>/g);
assert.equal(retiredCable?.length,1);
assert.match(retiredCable[0],/\bfun="getCable"/);
// This movie permanently hides the retired tutorial cable; keep only the live ear interaction.
restoredMapXml=once(restoredMapXml,map31[0],once(map31[0],retiredCable[0],''));
// These rooms share map 511's original road mask; its center console blocks (480,330).
for(const mapId of [511,5110,5111,5112]) {
    const room=restoredMapXml.match(new RegExp('<map\\b[^>]*\\bid="'+mapId+'"[^>]*>','g'));
    assert.equal(room?.length,1,'Missing dark portal room: '+mapId);
    assert.match(room[0],/\bx="480"\s+y="330"/,'Reconcile changed dark portal spawn: '+mapId);
    restoredMapXml=once(restoredMapXml,room[0],once(room[0],'x="480" y="330"','x="600" y="300"'));
}
const kingRoomRule=resourceRules.find(rule=>rule.path==='resource/map/10038.swf');
assert.ok(kingRoomRule?.mapDefinition,'Missing recovered King Tower map definition');
assert.match(kingRoomRule.mapDefinition,/\bid="10038"/);
assert.ok(!/<map\b[^>]*\bid="10038"/.test(restoredMapXml),'Reconcile existing King Tower local map');
restoredMapXml=once(restoredMapXml,'</Maps>',kingRoomRule.mapDefinition+'\n</Maps>');
const kingEntrance=restoredMapXml.match(/<map\b[^>]*\bid="465"[^>]*>/g);
assert.equal(kingEntrance?.length,1);
assert.match(kingEntrance[0],/\breplaceMapId="1147"/,'Reconcile King Tower controller binding');
restoredMapXml=once(restoredMapXml,kingEntrance[0],once(kingEntrance[0],' replaceMapId="1147"',''));
const groupEntrance=restoredMapXml.match(/<map\b[^>]*\bid="336"[^>]*>/g);
assert.equal(groupEntrance?.length,1,'Missing original cooperative training entrance');
assert.doesNotMatch(groupEntrance[0],/\breplaceMapId=/,'Reconcile cooperative training controller binding');
for(const mapId of [337,343]) {
    const rule=resourceRules.find(candidate=>candidate.path===`resource/map/${mapId}.swf`);
    assert.ok(rule?.mapDefinition,'Missing authenticated cooperative training room: '+mapId);
    assert.ok(!new RegExp('<map\\b[^>]*\\bid="'+mapId+'"').test(restoredMapXml),'Cooperative room already published: '+mapId);
    restoredMapXml=once(restoredMapXml,'</Maps>',rule.mapDefinition+'\n</Maps>');
}
after.tags[mapXmlIndex]=makeTag(87,Buffer.concat([oldMapXml.payload.subarray(0,6),Buffer.from(restoredMapXml)]));
assert.notEqual(npcXmlId,undefined,'Missing native NPC task configuration');
const npcXmlIndex=after.tags.findIndex(tag=>tag.code===87&&tag.payload.readUInt16LE(0)===npcXmlId);
assert.ok(npcXmlIndex>=0);
const oldNpcXml=after.tags[npcXmlIndex],npcXml=oldNpcXml.payload.subarray(6).toString('utf8');
const doctor=npcXml.match(/<npc\b[^>]*\bid="3"[^>]*>/g);
assert.equal(doctor?.length,1);
assert.match(doctor[0],/\bmapID="5"/);
let restoredDoctor=doctor[0];
for(const attribute of ['startTask','proTask']) {
    const binding=restoredDoctor.match(new RegExp('\\b'+attribute+'="([^"]*)"'));
    assert.ok(binding,'Missing doctor task binding: '+attribute);
    const ids=binding[1].split('|');
    assert.ok(ids.includes('811'),'Preserve current fox story entry');
    assert.ok(!ids.includes('28'),'Task28 doctor binding already exists; reconcile current version');
    restoredDoctor=once(restoredDoctor,binding[0],attribute+'="'+binding[1]+'|28"');
}
const xixi=npcXml.match(/<npc\b[^>]*\bid="2"[^>]*>/g);
assert.equal(xixi?.length,1,'Missing Xixi task binding');
assert.match(xixi[0],/\bmapID="8"/);
const xixiProgress=xixi[0].match(/\bproTask="([^"]*)"/);
assert.ok(xixiProgress,'Missing Xixi progress binding');
assert.ok(!xixiProgress[1].split('|').includes('7'),'Reconcile existing Xixi task 7');
const restoredXixi=once(xixi[0],xixiProgress[0],'proTask="'+xixiProgress[1]+'|7"');
let restoredNpcXml=once(npcXml,doctor[0],restoredDoctor);
restoredNpcXml=once(restoredNpcXml,xixi[0],restoredXixi);
after.tags[npcXmlIndex]=makeTag(87,Buffer.concat([oldNpcXml.payload.subarray(0,6),Buffer.from(restoredNpcXml)]));
const manifest={baseCoreSha256:sha(original),classes:changed,xmlResources:['TasksXMLInfo','MapConfig','NpcXMLInfo'],files:[],noDatabaseMigration:true,noBossBalanceChanges:true,restartGame:true,restartWeb:false};
manifest.resources=[movieRule,pirateMapRule,pirateExitRule,...restoredInputs.map(input=>input.rule)];
const published=encode(after);
function put(relative,bytes) {
    bytes=Buffer.from(bytes);const target=path.join(out,relative),old=path.join(baseline,relative);
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
    manifest.files.push({path:relative,before:fs.existsSync(old)?sha(fs.readFileSync(old)):null,after:sha(bytes)});
}
for(const relative of paths)put(relative,published);
for(const prefix of ['client/assets/','client/overlay/'])put(prefix+movieRule.path,movieBytes);
for(const prefix of ['client/assets/','client/overlay/'])put(prefix+pirateMapRule.path,pirateMapBytes);
for(const prefix of ['client/assets/','client/overlay/'])put(prefix+pirateExitRule.path,pirateExitBytes);
for(const {rule,bytes} of restoredInputs.filter(input=>!input.rule.patch&&input.rule.path!==nativeBattle.source.groupFight.path))for(const prefix of ['client/assets/','client/overlay/'])put(prefix+rule.path,bytes);
const server=path.join(__dirname,'../compat/server-patches/map-story');
// 10004 is the native furniture command; socket close remains the actual logout path.
manifest.deletedFiles=[
    'app/src/GameServer/Server/Packet/Recv/System/PlayerDisconnectHandler.ts',
    ...['js','js.map','d.ts','d.ts.map'].map(ext=>'app/dist/GameServer/Server/Packet/Recv/System/PlayerDisconnectHandler.'+ext)
].filter(relative=>fs.existsSync(path.join(baseline,relative))).map(relative=>({path:relative,beforeSha256:sha(fs.readFileSync(path.join(baseline,relative)))}));
function patchBaseline(relative,from,to) {
    put(relative,once(fs.readFileSync(path.join(baseline,relative),'utf8'),from,to));
}
for(const [relative,from] of [
    ['app/src/GameServer/Server/Packet/Recv/System/index.ts',"export * from './PlayerDisconnectHandler';"],
    ['app/dist/GameServer/Server/Packet/Recv/System/index.d.ts',"export * from './PlayerDisconnectHandler';"],
    ['app/dist/GameServer/Server/Packet/Recv/System/index.js','__exportStar(require("./PlayerDisconnectHandler"), exports);'],
    ['app/src/shared/protocol/CommandID.ts','  // ============ 内部命令 ============\n  PLAYER_DISCONNECT: 10004,          // 玩家断开连接（内部命令）\n'],
    ['app/dist/shared/protocol/CommandID.js','    // ============ 内部命令 ============\n    PLAYER_DISCONNECT: 10004, // 玩家断开连接（内部命令）\n'],
    ['app/dist/shared/protocol/CommandID.d.ts','    readonly PLAYER_DISCONNECT: 10004;\n']
]) patchBaseline(relative,from,'');
for(const relative of ['app/src/GameServer/Server/Packet/Recv/Room/index.ts','app/dist/GameServer/Server/Packet/Recv/Room/index.d.ts']) {
    patchBaseline(relative,"export * from './FitmentAllHandler';","export * from './FitmentAllHandler';\nexport * from './MapFitmentHandler';");
}
patchBaseline('app/dist/GameServer/Server/Packet/Recv/Room/index.js','__exportStar(require("./FitmentAllHandler"), exports);',
    '__exportStar(require("./FitmentAllHandler"), exports);\n__exportStar(require("./MapFitmentHandler"), exports);');
for(const prefix of ['app/src/','app/dist/']) {
    put(prefix+'GameServer/Game/Item/MapFitmentRewards.js',fs.readFileSync(path.join(server,'MapFitmentRewards.js')));
    put(prefix+'GameServer/Server/Packet/Recv/Room/MapFitmentHandler.js',fs.readFileSync(path.join(server,'MapFitmentHandler.js')));
    put(prefix+'GameServer/Server/Packet/Recv/Room/MapFitmentHandler.d.ts',fs.readFileSync(path.join(server,'MapFitmentHandler.d.ts')));
}
patchBaseline('app/src/GameServer/Server/Packet/Recv/Room/FitmentAllHandler.ts',
    '      // TODO: 从数据库加载玩家的仓库家具列表\n      // 暂时返回空列表\n      const fitments: IFitmentStorageInfo[] = [];',
    '      const fitments: IFitmentStorageInfo[] = player.ItemManager.ItemData.ItemList\n        .filter(item => item.itemId >= 500001 && item.itemId <= 599999 && item.count > 0)\n        .map(item => ({ id: item.itemId, usedCount: 0, allCount: item.count }));');
patchBaseline('app/dist/GameServer/Server/Packet/Recv/Room/FitmentAllHandler.js',
    '            // TODO: 从数据库加载玩家的仓库家具列表\n            // 暂时返回空列表\n            const fitments = [];',
    '            const fitments = player.ItemManager.ItemData.ItemList\n                .filter(item => item.itemId >= 500001 && item.itemId <= 599999 && item.count > 0)\n                .map(item => ({ id: item.itemId, usedCount: 0, allCount: item.count }));');
const kingRules=JSON.parse(fs.readFileSync(path.join(server,'king_tower.json')));
for(const [source,relative] of [
    ['SeaVortexActivity.js','app/dist/GameServer/Game/Map/SeaVortexActivity.js'],
    ['SeaVortexHandler.js','app/dist/GameServer/Server/Packet/Recv/Map/SeaVortexHandler.js'],
    ['sea_vortex.json','app/config/data/json/sea_vortex.json'],
    ['ClosedSpaceTreasure.js','app/dist/GameServer/Game/Map/ClosedSpaceTreasure.js'],
    ['ClosedSpaceTreasureHandler.js','app/dist/GameServer/Server/Packet/Recv/Map/ClosedSpaceTreasureHandler.js'],
    ['KingTower.js','app/dist/GameServer/Game/Map/KingTower.js'],
    ['KingTowerHandler.js','app/dist/GameServer/Server/Packet/Recv/Map/KingTowerHandler.js'],
    ['TrainingPartyHandler.js','app/dist/GameServer/Server/Packet/Recv/Map/TrainingPartyHandler.js'],
    ['TrainingBattleRuntime.js','app/dist/GameServer/Game/Battle/TrainingBattleRuntime.js'],
    ['TrainingBattleStorage.js','app/dist/GameServer/Game/Battle/TrainingBattleStorage.js'],
    ['Task7.js','app/dist/GameServer/Game/Task/Task7.js'],
    ['Task7DeleteHandler.js','app/dist/GameServer/Server/Packet/Recv/Task/Task7DeleteHandler.js'],
    ['TrainingBattleTask.js','app/dist/GameServer/Game/Battle/TrainingBattleTask.js'],
    ['TrainingBattlePackets.js','app/dist/GameServer/Game/Battle/TrainingBattlePackets.js'],
    ['TrainingBattleHandler.js','app/dist/GameServer/Server/Packet/Recv/Map/TrainingBattleHandler.js'],
    ['BattleActors.js','app/dist/GameServer/Game/Battle/BattleActors.js'],
    ['king_tower.json','app/config/data/json/king_tower.json'],
    ['closed_space.json','app/config/data/json/closed_space.json']
]) {
    assert.ok(!fs.existsSync(path.join(baseline,relative)),'New sea file already exists: '+relative);
    put(relative,fs.readFileSync(path.join(server,source)));
}
patchBaseline('app/dist/GameServer/Server/Packet/Recv/Task/index.js',
    '__exportStar(require("./DeleteDailyTaskHandler"), exports);',
    '__exportStar(require("./DeleteDailyTaskHandler"), exports);\n__exportStar(require("./Task7DeleteHandler"), exports);');
// Keep persistent effect ownership stable when a group battle changes its
// current attack pair. Ordinary PVE/PVP retain their player/enemy identities.
const actorRewrites = {
    'SkillEffectRuntime.js': [
        ["for (const side of ['player', 'enemy'])", 'for (const side of BattleActors.Sides(battle))', 5],
        ["pet === battle.player ? battle.enemy : battle.player", 'BattleActors.Foe(battle, pet)', 1],
        ["battle[side === 'player' ? 'enemy' : 'player']", 'BattleActors.Foe(battle, pet)', 2],
        ["pet === battle.player ? 'player' : 'enemy'", 'BattleActors.Key(battle, pet)', 1],
        ["attacker === battle.player ? 'player' : 'enemy'", 'BattleActors.Key(battle, attacker)', 2],
        ["defender === battle.player ? 'player' : 'enemy'", 'BattleActors.Key(battle, defender)', 1],
        ["const pet = battle[side], foe = BattleActors.Foe(battle, pet);\n            const mirror = this.Get(pet, 'mirrorStages');",
            "const pet = battle[side];\n            const mirror = this.Get(pet, 'mirrorStages');\n            const foe = mirror ? battle[mirror.target] : undefined;", 1],
        ["{ foe: [...defender.battleLevels] }", '{ foe: [...defender.battleLevels], target: BattleActors.Key(battle, defender) }', 1]
    ],
    'PassiveRuntime.js': [
        ["for (const side of ['player', 'enemy'])", 'for (const side of BattleActors.Sides(battle))', 2],
        ["battle[side === 'player' ? 'enemy' : 'player']", 'BattleActors.Foe(battle, pet)', 2]
    ],
    'ChampionPetRuntime.js': [
        ["for (const side of ['player','enemy'])", 'for (const side of BattleActors.Sides(battle))', 2],
        ["for(const side of ['player','enemy'])", 'for(const side of BattleActors.Sides(b))', 1],
        ['battle.player === pet ? battle.enemy : battle.player', 'BattleActors.Foe(battle, pet)', 1],
        ["battle[side === 'player' ? 'enemy' : 'player']", 'BattleActors.Foe(battle, pet)', 1],
        ["defender === battle.player ? 'player' : 'enemy'", 'BattleActors.Key(battle, defender)', 1],
        ["pet===b.player?'player':'enemy'", 'BattleActors.Key(b,pet)', 1]
    ]
};
for (const [name, changes] of Object.entries(actorRewrites)) {
    const relative='app/dist/GameServer/Game/Battle/'+name;
    let source=fs.readFileSync(path.join(baseline,relative),'utf8');
    for (const [from,to,count] of changes) {
        assert.equal(source.split(from).length-1,count,'Reconcile combat actor ownership: '+name+' / '+from);
        source=source.replaceAll(from,to);
    }
    const firstLine=source.indexOf('\n');
    assert.ok(firstLine>=0);
    source=source.slice(0,firstLine+1)+'const { BattleActors } = require("./BattleActors");\n'+source.slice(firstLine+1);
    put(relative,source);
}
const loginPath='app/dist/GameServer/Game/Login/LoginManager.js';
let login=fs.readFileSync(path.join(baseline,loginPath),'utf8');
login=once(login,'const OnlineTracker_1 = require("../Player/OnlineTracker");','const OnlineTracker_1 = require("../Player/OnlineTracker");\nconst { BroadcastService } = require("../Broadcast/BroadcastService");');
login=once(login,'            await playerInstance.SendPacket(new PacketEnterMap_1.PacketEnterMap(userInfo, 0, playerInstance.ClientProtocol));',`            const enterPacket = new PacketEnterMap_1.PacketEnterMap(userInfo, 0, playerInstance.ClientProtocol);
            await playerInstance.SendPacket(enterPacket);
            await BroadcastService.Instance.BroadcastToMap(mapId, enterPacket, userID);`);
put(loginPath,login);
const mapActionPath='app/dist/GameServer/Game/Map/MapActionManager.js';
let mapAction=fs.readFileSync(path.join(baseline,mapActionPath),'utf8');
mapAction=once(mapAction,'const OnlineTracker_1 = require("../Player/OnlineTracker");','const OnlineTracker_1 = require("../Player/OnlineTracker");\nconst { IsInKingTower } = require("./KingTower");');
mapAction=once(mapAction,'    async HandlePeopleWalk(req) {\n        const mapId = this.Player.Data.mapID;',`    async HandlePeopleWalk(req) {
        if (IsInKingTower(this.Player)) {
            await this.Player.SendPacket(new PeopleWalkRspProto_1.PeopleWalkRspProto(req.walkType, this.UserID, req.x, req.y, req.amfData));
            return;
        }
        const mapId = this.Player.Data.mapID;`);
put(mapActionPath,mapAction);
const petManagerPath='app/dist/GameServer/Game/Pet/PetManager.js';
let petManager=fs.readFileSync(path.join(baseline,petManagerPath),'utf8');
petManager=once(petManager,'    PetData;\n','    PetData;\n    shownPetCatchTime = 0;\n');
petManager=once(petManager,'    async HandlePetShow(catchTime) {',`    GetShownPet() {
        return this.shownPetCatchTime ? this.PetData.GetPetByCatchTime(this.shownPetCatchTime) ?? null : null;
    }
    async HandlePetShow(catchTime, flag) {`);
petManager=once(petManager,`        if (pet) {
            const packet = new Pet_1.PacketPetShow(this.UserID, pet.catchTime, pet.petId, 1, pet.dvHp, 0);`,`        if (pet && (flag === 0 || flag === 1)) {
            this.shownPetCatchTime = flag === 1 ? pet.catchTime : 0;
            const packet = new Pet_1.PacketPetShow(this.UserID, pet.catchTime, pet.petId, flag, pet.dvHp, 0);`);
petManager=once(petManager,'展示精灵失败，精灵不存在:','展示精灵失败，精灵不存在或标志无效:');
put(petManagerPath,petManager);
const petShowHandlerPath='app/dist/GameServer/Server/Packet/Recv/Pet/PetShowHandler.js';
let petShowHandler=fs.readFileSync(path.join(baseline,petShowHandlerPath),'utf8');
petShowHandler=once(petShowHandler,`        // HandlePetShow accepts only petId (catchTime)
        await player.PetManager.HandlePetShow(req.catchTime);`,`        await player.PetManager.HandlePetShow(req.catchTime, req.flag);`);
put(petShowHandlerPath,petShowHandler);
const mapManagerPath='app/dist/GameServer/Game/Map/MapManager.js';
let mapManager=fs.readFileSync(path.join(baseline,mapManagerPath),'utf8');
for (const method of ['HandleEnterMap(req)', 'HandleLeaveMap()']) {
    const anchor='    async '+method+' {';
    mapManager=once(mapManager,anchor,anchor+'\n        await require("../Battle/TrainingBattleRuntime").CancelFor(this.Player, 2);');
}
mapManager=once(mapManager,`        let defaultPet = null;
        if (playerInstance?.PetManager) {
            defaultPet = playerInstance.PetManager.GetDefaultPet();
        }
        userInfo.spiritTime = defaultPet?.catchTime || 0;
        userInfo.spiritID = defaultPet?.petId || 0;
        userInfo.petDV = defaultPet?.dvHp || 31;
        userInfo.petSkin = defaultPet?.skinId || 0;
        userInfo.petShiny = defaultPet?.shiny ?? 0;`,`        const shownPet = playerInstance?.PetManager?.GetShownPet();
        userInfo.spiritTime = shownPet?.catchTime || 0;
        userInfo.spiritID = shownPet?.petId || 0;
        userInfo.petDV = shownPet?.dvHp || 31;
        userInfo.petSkin = shownPet?.skinId || 0;
        userInfo.petShiny = shownPet?.shiny ?? 0;`);
put(mapManagerPath,mapManager);
const review=JSON.parse(fs.readFileSync(path.join(server,'dark_portal_review.json')));
const bossPath='app/config/data/json/boss_abilities.json';
const bossData=JSON.parse(fs.readFileSync(path.join(baseline,bossPath)));
const existingBosses=JSON.stringify(bossData.bossConfigs);
for(const door of review.doors) {
    const source=bossData.bossConfigs.find(boss=>boss.mapId===110&&boss.param2===door.sourceParam2);
    assert.ok(source,'Missing review source Boss: '+door.sourceParam2);
    assert.equal(source.petId,door.petId,'Reconcile review opponent');
    assert.ok(!bossData.bossConfigs.some(boss=>boss.mapId===110&&boss.param2===1000+door.door),'Reconcile published review door: '+door.door);
    bossData.bossConfigs.push({...structuredClone(source),param2:1000+door.door,comment:review.provenance+' '+door.name+'；配置继承原入口'+door.sourceParam2+'。'});
}
assert.equal(JSON.stringify(bossData.bossConfigs.slice(0,-review.doors.length)),existingBosses,'Preserve every existing Boss configuration');
put(bossPath,JSON.stringify(bossData,null,2)+'\n');
const taskPath='app/config/data/json/tasks.json',tasks=JSON.parse(fs.readFileSync(path.join(baseline,taskPath)));
const taskDefinitions=JSON.parse(fs.readFileSync(path.join(server,'tasks.json'))).tasks;
for(const taskId of [33,1247,131,134]) {
    assert.ok(!Object.hasOwn(tasks.tasks,String(taskId)),'Reconcile existing quest: '+taskId);
    tasks.tasks[taskId]=taskDefinitions[taskId];
}
assert.deepEqual(tasks.tasks['7'],{name:'防寒套装制作',type:'normal',requiredProgress:3,rewards:{}},'Reconcile task 7 baseline');
tasks.tasks['7']=taskDefinitions['7'];
assert.equal(tasks.tasks['94'].requiredProgress,3,'Reconcile existing energy tutorial stages');
assert.deepEqual(taskDefinitions['94'],{...tasks.tasks['94'],requiredProgress:4},'Preserve existing energy tutorial rewards');
tasks.tasks['94']=taskDefinitions['94'];
assert.deepEqual(tasks.tasks['95'],{name:'宇宙中的黑色旋涡',type:'normal',requiredProgress:8,rewards:{coins:2000,special:[{type:3,value:4000}]}},'Reconcile task 95 rewards');
// Original task panel: left mc0/type 1 is 刺蜂; right mc1/type 2 is 锡蝶.
tasks.tasks['95'].choiceSuitItems={'1':[100346,100347,100348,100349],'2':[100350,100351,100352,100353]};
for(const taskId of trainingDailyTaskIds) {
    assert.deepEqual(tasks.tasks[taskId],{...taskDefinitions[taskId],rewards:{}},'Reconcile original native training reward: '+taskId);
    tasks.tasks[taskId]=taskDefinitions[taskId];
}
put(taskPath,JSON.stringify(tasks,null,2)+'\n');
const taskManagerPath='app/dist/GameServer/Game/Task/TaskManager.js';
let taskManager=fs.readFileSync(path.join(baseline,taskManagerPath),'utf8');
for (const [method,call] of [
    ['SetTaskBufferValue(taskId, index, value)', 'WriteValue(this.Player, index, value)'],
    ['SetTaskProgressBytes(taskId, bytes)', 'WriteProgress(this.Player, bytes)'],
    ['SetTaskBufferBytes(taskId, bytes)', 'WriteProgress(this.Player, bytes)']
]) {
    const anchor='    async '+method+' {';
    taskManager=once(taskManager,anchor,anchor+'\n        if (taskId === 131) return require("../Battle/TrainingBattleTask").'+call+';');
    if (method === 'SetTaskBufferValue(taskId, index, value)') taskManager=once(taskManager,anchor,anchor+'\n        if (taskId === 7) throw new Error("Task 7 requires a complete progress buffer");');
    if (method === 'SetTaskProgressBytes(taskId, bytes)') taskManager=once(taskManager,anchor,anchor+'\n        if (taskId === 7) return require("./Task7").WriteProgress(this.Player, bytes);');
    if (method === 'SetTaskBufferBytes(taskId, bytes)') taskManager=once(taskManager,anchor,anchor+'\n        if (taskId === 7) return require("./Task7").WriteBuffer(this.Player, bytes);');
}
taskManager=once(taskManager,'    GetTaskBuffer(taskId) {','    GetTaskBuffer(taskId) {\n        if (taskId === 131) return require("../Battle/TrainingBattleTask").ReadProgress(this.Player);');
taskManager=once(taskManager,'    GetTaskBuffer(taskId) {','    GetTaskBuffer(taskId) {\n        if (taskId === 7) return require("./Task7").ReadProgress(this.Player);');
taskManager=once(taskManager,'    GetTaskBufferBytes(taskId, length) {','    GetTaskBufferBytes(taskId, length) {\n        if (taskId === 7) return require("./Task7").ReadBuffer(this.Player, length);');
taskManager=once(taskManager,"        if (config.parentTaskId && !this.TaskData.IsTaskCompleted(config.parentTaskId))",
    "        if (taskId === 7 && ![85, 86, 87, 88].some(id => this.TaskData.IsTaskCompleted(id))) throw new Error('Previous story quest is not complete');\n        if (config.parentTaskId && !this.TaskData.IsTaskCompleted(config.parentTaskId))");
taskManager=once(taskManager,'                ...(taskConfig.rewards?.fitments ?? []).map(item => item.fitmentId),',
    '                ...(taskConfig.rewards?.fitments ?? []).map(item => item.fitmentId),\n                ...(taskId === 95 ? taskConfig.choiceSuitItems[String(param)] : []),');
put(taskManagerPath,taskManager);
const encounterPath='app/config/data/json/story_encounters.json',encounters=JSON.parse(fs.readFileSync(path.join(baseline,encounterPath)));
const pandoraEncounter=JSON.parse(fs.readFileSync(path.join(server,'encounters.json'))).filter(row=>row.mapId===329&&row.region===0);
assert.equal(pandoraEncounter.length,1,'Reconcile Pandora encounter definition');
assert.ok(!encounters.some(row=>row.mapId===329&&row.region===0),'Reconcile existing Pandora encounter');
assert.ok(!bossData.bossConfigs.some(boss=>boss.mapId===329&&(boss.param2??0)===0),'Reconcile Pandora Boss slot');
encounters.push(pandoraEncounter[0]);
assert.ok(!encounters.some(row=>row.mapId===687),'Reconcile existing 687 encounters');
const sea=JSON.parse(fs.readFileSync(path.join(server,'sea_vortex.json')));
for(let index=0;index<sea.guard.regions.length;index++)encounters.push({mapId:sea.mapId,region:sea.guard.regions[index],petId:sea.guard.petId,level:sea.guard.level,activity:true,capture:false,requiredCompletedTask:sea.introTaskId,seaVortexPirateSlot:index+1,source:sea.provenance.projectPolicy});
for(const reward of sea.rewards.filter(row=>row.petId))encounters.push({mapId:sea.mapId,region:reward.region,petId:reward.petId,level:reward.level,activity:true,capture:true,requiredCompletedTask:sea.introTaskId,seaVortexRescue:true,source:sea.provenance.rewards+'; '+sea.provenance.projectPolicy});
assert.ok(!encounters.some(row=>row.mapId===pirate.mapId),'Reconcile existing pirate-fortress encounters');
for(const encounter of pirate.encounters)encounters.push({...encounter,source:pirate.provenance.walkthrough+'; '+pirate.provenance.projectPolicy});
put(encounterPath,JSON.stringify(encounters,null,2)+'\n');
const storyPath='app/dist/GameServer/Game/Battle/StoryEncounters.js';
let story=fs.readFileSync(path.join(baseline,storyPath),'utf8');
story=once(story,'    if (encounter.activity === true) {','    if (encounter.activity === true) {\n        if (encounter.requiredCompletedTask && !player.TaskManager.TaskData.IsTaskCompleted(encounter.requiredCompletedTask)) return null;');
put(storyPath,story);
const rewardsPath='app/dist/GameServer/Game/Map/GameplayRewards.js';
let rewards=fs.readFileSync(path.join(baseline,rewardsPath),'utf8');
rewards=once(rewards,'const { CommandID } = require("../../../shared/protocol/CommandID");','const { CommandID } = require("../../../shared/protocol/CommandID");\nconst { RecordSeaPirateVictory } = require("./SeaVortexActivity");');
rewards=once(rewards,'async function GrantMapVictory(player, battle) {','async function GrantMapVictory(player, battle) {\n    await RecordSeaPirateVictory(player, battle);');
rewards=once(rewards,'    await RecordSeaPirateVictory(player, battle);',`    await RecordSeaPirateVictory(player, battle);
    const rescueStage = battle.pirateRescueStage;
    const rescueTasks = player.TaskManager.TaskData;
    if (Number.isInteger(rescueStage) && rescueStage >= 0 && rescueStage <= 3 &&
        rescueTasks.IsTaskAccepted(33) && !rescueTasks.IsTaskCompleted(33)) {
        await SaveTaskBuffer(rescueTasks, 33, current => {
            const next = {...current};
            const progress = current?.xinBytes ? current.xinBytes.slice()
                : current ? DecodeTask96Buffer(current) : new Array(20).fill(0);
            progress[rescueStage] = 1;
            if (current?.xinBytes) next.xinBytes = progress;
            else for (let index = 0; index < progress.length; ++index) next[index] = progress[index];
            return next;
        });
    }`);
rewards=once(rewards,'    const reward = battle.bossMapId === 684',`    const reward = battle.pirateRescueStage === 3
        ? { key: "pirate:33:medal", itemId: 500813 }
        : battle.bossMapId === 684`);
put(rewardsPath,rewards);
const materialGamesPath='app/dist/GameServer/Game/Map/MaterialGames.js';
let materialGames=fs.readFileSync(path.join(baseline,materialGamesPath),'utf8');
materialGames=once(materialGames,"/** Scores use the original Flash game's first GAME_OVER uint32 (0..100). */",
    '/** Resource games use normalized scores; arcade games also report raw points. */');
materialGames=once(materialGames,'    static sessions = new WeakMap();',
    '    static sessions = new WeakMap();\n    static lookoutSessions = new WeakSet();\n    static standardSessions = new WeakMap();');
materialGames=once(materialGames,'    static Join(player, gameId) {',`    static Join(player, gameId) {
        this.lookoutSessions.delete(player);
        this.standardSessions.delete(player);
        if (player.Data.mapID === 7 && gameId === 1) {
            this.sessions.delete(player);
            this.lookoutSessions.add(player);
            return;
        }`);
materialGames=once(materialGames,'        const game = config.games.find(entry => entry.mapId === player.Data.mapID && entry.gameId === gameId);',`        if (gameId === 1 && config.standardGames?.mapIds.includes(player.Data.mapID)) {
            this.sessions.delete(player);
            this.standardSessions.set(player, player.Data.mapID);
            return;
        }
        const game = config.games.find(entry => entry.mapId === player.Data.mapID && entry.gameId === gameId);`);
materialGames=once(materialGames,'    static async Finish(player, score) {',`    static async Finish(player, score, rawScore) {
        if (this.lookoutSessions.delete(player)) {
            if (player.Data.mapID !== 7 || score !== Math.floor(rawScore / 35000 * 100)) {
                throw new Error('Invalid lookout game outcome');
            }
            const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/material-sources.json');
            if (!config?.lookoutGame) throw new Error('Lookout game configuration missing');
            const coins = Math.min(config.lookoutGame.maxCoins, Math.floor(rawScore / config.lookoutGame.pointsPerCoin));
            if (coins > 0 && !await player.AddCurrency(undefined, coins)) {
                throw new Error('Lookout game currency could not be saved');
            }
            return coins > 0 ? [{ itemId: 1, count: coins }] : [];
        }`);
materialGames=once(materialGames,'        const session = this.sessions.get(player);',`        const standardMap = this.standardSessions.get(player);
        if (standardMap !== undefined) {
            this.standardSessions.delete(player);
            if (player.Data.mapID !== standardMap) throw new Error('Game map changed');
            const valid = standardMap === 4
                ? score === Math.floor(rawScore / 3000 * 100)
                : standardMap === 6
                    ? score === rawScore && [0, 40, 80, 100].includes(score)
                    : [0, 50, 100, 150, 200, 330, 410, 490, 590, 690].includes(rawScore)
                        && score === Math.floor(rawScore / 690 * 100);
            if (!valid) throw new Error('Invalid standard game outcome');
            const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/material-sources.json');
            if (!config?.standardGames) throw new Error('Standard game configuration missing');
            const coins = Math.min(config.standardGames.maxCoins, score * config.standardGames.coinsPerPercent);
            if (coins > 0 && !await player.AddCurrency(undefined, coins)) {
                throw new Error('Game currency could not be saved');
            }
            return coins > 0 ? [{ itemId: 1, count: coins }] : [];
        }
        const session = this.sessions.get(player);`);
put(materialGamesPath,materialGames);
const materialHandlersPath='app/dist/GameServer/Server/Packet/Recv/Map/MaterialHandlers.js';
let materialHandlers=fs.readFileSync(path.join(baseline,materialHandlersPath),'utf8');
materialHandlers=once(materialHandlers,'MaterialGames_1.MaterialGames.Finish(player, score);',
    'MaterialGames_1.MaterialGames.Finish(player, score, body.readUInt32BE(4));');
put(materialHandlersPath,materialHandlers);
const materialConfigPath='app/config/data/json/material-sources.json';
const materialConfig=JSON.parse(fs.readFileSync(path.join(baseline,materialConfigPath),'utf8'));
const projectMaterialConfig=JSON.parse(fs.readFileSync(path.join(__dirname,'../compat/server-patches/material-sources/material-sources.json'),'utf8'));
materialConfig.lookoutGame=projectMaterialConfig.lookoutGame;
materialConfig.standardGames=projectMaterialConfig.standardGames;
assert.notEqual(clothXmlId,undefined,'Missing native equipment conversion recipes');
const clothXml=after.tags.find(tag=>tag.code===87&&tag.payload.readUInt16LE(0)===clothXmlId);
assert.ok(clothXml,'Missing native equipment recipe data');
assert.equal(sha(clothXml.payload.subarray(6)),'d2f316f4b02d1851414ab7ae7c636728ef67d5415e94d17a74c46ded587a95bf','Reconcile native equipment conversion recipes');
materialConfig.clothExchanges=projectMaterialConfig.clothExchanges;
put(materialConfigPath,JSON.stringify(materialConfig,null,2)+'\n');
const oreSalePath='app/dist/GameServer/Server/Packet/Recv/Item/OreSaleHandler.js';
assert.ok(!fs.existsSync(path.join(baseline,oreSalePath)),'Ore sale handler already exists; reconcile current version');
put(oreSalePath,fs.readFileSync(path.join(__dirname,'../compat/server-patches/material-sources/OreSaleHandler.js')));
const clothExchangePath='app/dist/GameServer/Server/Packet/Recv/Item/ExchangeClothHandler.js';
assert.ok(!fs.existsSync(path.join(baseline,clothExchangePath)),'Equipment conversion handler already exists; reconcile current version');
put(clothExchangePath,fs.readFileSync(path.join(__dirname,'../compat/server-patches/material-sources/ExchangeClothHandler.js')));
const helkaCapsulePath='app/dist/GameServer/Game/Item/HelkaCapsule.js';
assert.ok(!fs.existsSync(path.join(baseline,helkaCapsulePath)),'Helka capsule receiver already exists; reconcile current version');
const helkaCapsuleSource=fs.readFileSync(path.join(__dirname,'../compat/server-patches/material-sources/HelkaCapsule.js'));
put(helkaCapsulePath,helkaCapsuleSource);
put('app/src/GameServer/Game/Item/HelkaCapsule.js',helkaCapsuleSource);
const dayGiftSource=fs.readFileSync(path.join(__dirname,'../compat/server-patches/material-sources/MapDayGifts.js'));
for(const prefix of ['app/src/','app/dist/'])put(prefix+'GameServer/Game/Item/MapDayGifts.js',dayGiftSource);
put('app/config/data/json/map-day-gifts.json',fs.readFileSync(path.join(__dirname,'../compat/server-patches/material-sources/map-day-gifts.json')));
put('app/src/GameServer/Server/Packet/Recv/NoNo/ExperienceReceiverHandlers.ts',fs.readFileSync(path.join(__dirname,'../compat/server-patches/material-sources/ExperienceReceiverHandlers.ts')));
const receiverHandlerPath='app/dist/GameServer/Server/Packet/Recv/NoNo/ExperienceReceiverHandlers.js';
let receiverHandler=fs.readFileSync(path.join(baseline,receiverHandlerPath),'utf8');
receiverHandler=once(receiverHandler,'const GachaTicket_1 = require("../../../../Game/Item/GachaTicket");',
    'const GachaTicket_1 = require("../../../../Game/Item/GachaTicket");\nconst HelkaCapsule_1 = require("../../../../Game/Item/HelkaCapsule");');
receiverHandler=once(receiverHandler,'            else\n                count = await new Mining_1.Mining(player).Count(type);',
    '            else if (type === 1502)\n                count = await new HelkaCapsule_1.HelkaCapsule(player).Count();\n            else\n                count = await new Mining_1.Mining(player).Count(type);');
receiverHandler=once(receiverHandler,'            else\n                count = await new Mining_1.Mining(player).Count(type);',
    '            else if (type === 200014)\n                count = await require("../../../../Game/Battle/ClosedSpaceXita").Count(player);\n            else\n                count = await new Mining_1.Mining(player).Count(type);');
receiverHandler=once(receiverHandler,'            else\n                rewards = await new Mining_1.Mining(player).Claim(type);',
    '            else if (type === 1502)\n                rewards = [await new HelkaCapsule_1.HelkaCapsule(player).Claim()];\n            else\n                rewards = await new Mining_1.Mining(player).Claim(type);');
receiverHandler=once(receiverHandler,'error instanceof GachaTicket_1.GachaTicketAlreadyClaimed ? 5002 : 5000',
    'error instanceof GachaTicket_1.GachaTicketAlreadyClaimed || error instanceof HelkaCapsule_1.HelkaCapsuleAlreadyClaimed ? 5002 : 5000');
receiverHandler=once(receiverHandler,'const HelkaCapsule_1 = require("../../../../Game/Item/HelkaCapsule");',
    'const HelkaCapsule_1 = require("../../../../Game/Item/HelkaCapsule");\nconst MapDayGifts = require("../../../../Game/Item/MapDayGifts");');
receiverHandler=once(receiverHandler,'        try {\n            const type = body.readUInt32BE(0);\n            let count;',
    '        const type = body.readUInt32BE(0);\n        try {\n            let count;');
receiverHandler=once(receiverHandler,'        let rewards;\n        try {\n            const type = body.readUInt32BE(0);',
    '        const type = body.readUInt32BE(0);\n        let rewards;\n        try {');
receiverHandler=once(receiverHandler,'            else\n                count = await new Mining_1.Mining(player).Count(type);',
    '            else if (MapDayGifts.IsType(type))\n                count = await MapDayGifts.Count(player, session, type);\n            else\n                count = await new Mining_1.Mining(player).Count(type);');
receiverHandler=once(receiverHandler,'            await player.SendPacket(new PacketReceiverCount(count));',
    '            if (MapDayGifts.IsType(type) && (player.Session !== session || session.Socket.destroyed)) return;\n            await player.SendPacket(new PacketReceiverCount(count));');
receiverHandler=once(receiverHandler,'        catch {\n            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.TALK_COUNT).setResult(5001));',
    '        catch {\n            if (MapDayGifts.IsType(type) && (player.Session !== session || session.Socket.destroyed)) return;\n            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.TALK_COUNT).setResult(5001));');
receiverHandler=once(receiverHandler,'            else\n                rewards = await new Mining_1.Mining(player).Claim(type);',
    '            else if (MapDayGifts.IsType(type))\n                rewards = [await MapDayGifts.Claim(player, session, type)];\n            else\n                rewards = await new Mining_1.Mining(player).Claim(type);');
receiverHandler=once(receiverHandler,'error instanceof HelkaCapsule_1.HelkaCapsuleAlreadyClaimed ? 5002 : 5000',
    'error instanceof HelkaCapsule_1.HelkaCapsuleAlreadyClaimed || error instanceof MapDayGifts.MapDayGiftLimit ? 5002 : 5000');
receiverHandler=once(receiverHandler,'        catch (error) {\n            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.TALK_CATE).setResult(',
    '        catch (error) {\n            if (MapDayGifts.IsType(type) && (player.Session !== session || session.Socket.destroyed)) return;\n            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.TALK_CATE).setResult(');
receiverHandler=once(receiverHandler,'        try {\n            await player.SendPacket(new PacketReceiverReward(rewards));',
    '        if (MapDayGifts.IsType(type) && (player.Session !== session || session.Socket.destroyed)) return;\n        try {\n            await player.SendPacket(new PacketReceiverReward(rewards));');
put(receiverHandlerPath,receiverHandler);
const itemIndexPath='app/dist/GameServer/Server/Packet/Recv/Item/index.js';
const itemIndex=fs.readFileSync(path.join(baseline,itemIndexPath),'utf8');
put(itemIndexPath,once(itemIndex,'__exportStar(require("./MultiItemBuyHandler"), exports);',
    '__exportStar(require("./MultiItemBuyHandler"), exports);\n__exportStar(require("./OreSaleHandler"), exports);\n__exportStar(require("./ExchangeClothHandler"), exports);'));
const aimatPath='app/dist/GameServer/Server/Packet/Recv/Map/AimatHandler.js';
let aimat=fs.readFileSync(path.join(baseline,aimatPath),'utf8');
aimat=once(aimat,'        await player.MapActionManager.HandleAimat(req);',`        if (player.Data.mapID === 687) {
            try {
                await require("../../../../Game/Map/SeaVortexActivity").RecordSeaShot(player, req);
            } catch (error) {
                require("../../../../../shared/utils/Logger").Logger.Error("[SeaVortex] Shot progress was not saved", error);
                await require("../../../../Game/Map/ForestMechanisms").SendForestAlert(player, "射击进度未完成保存，请稍后再试。");
            }
        }
        await player.MapActionManager.HandleAimat(req);`);
put(aimatPath,aimat);
const indexPath='app/dist/GameServer/Server/Packet/Recv/Map/index.js';
let index=fs.readFileSync(path.join(baseline,indexPath),'utf8');
index=once(index,'__exportStar(require("./ForestMechanismHandlers"), exports);','__exportStar(require("./ForestMechanismHandlers"), exports);\n__exportStar(require("./SeaVortexHandler"), exports);\n__exportStar(require("./ClosedSpaceTreasureHandler"), exports);\n__exportStar(require("./KingTowerHandler"), exports);\n__exportStar(require("./TrainingPartyHandler"), exports);');
index=once(index,'__exportStar(require("./TrainingPartyHandler"), exports);',
    '__exportStar(require("./TrainingPartyHandler"), exports);\n__exportStar(require("./TrainingBattleHandler"), exports);');
put(indexPath,index);
const battlePath='app/dist/GameServer/Game/Battle/BattleManager.js';
let battle=fs.readFileSync(path.join(baseline,battlePath),'utf8');
for (const [method,guard] of [
    ['async RunBattleAction(command, action)', 'if (require("./TrainingBattleRuntime").IsReserved(this.Player)) { await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(command).setResult(5001)); return; }'],
    ['InitializeBattle(battle)', 'const training = require("./TrainingBattleRuntime"); if (training.IsReserved(this.Player) && battle.nativeTraining !== training.GetTrainingBattle(this.Player)) throw new Error("Native training battle reserved");'],
    ['CleanupBattle()', 'if (this._currentBattle?.nativeTraining && this._currentBattle.nativeTraining.phase !== "closed") { void require("./TrainingBattleRuntime").CancelFor(this.Player, 2); return; }'],
    ['async SyncBattlePetHP()', 'if (this._currentBattle?.nativeTraining) return;'],
    ['async OnLogout()', 'await require("./TrainingBattleRuntime").CancelFor(this.Player, 2);']
]) {
    const anchor='    '+method+' {';
    battle=once(battle,anchor,anchor+'\n        '+guard);
}
battle=once(battle,'                battle.battleType = story.capture === true ? BattleModel_1.BattleType.PVE : BattleModel_1.BattleType.BOSS;','                battle.battleType = story.capture === true ? BattleModel_1.BattleType.PVE : BattleModel_1.BattleType.BOSS;\n                if (story.seaVortexPirateSlot !== undefined) battle.seaVortexPirateSlot = story.seaVortexPirateSlot;');
battle=once(battle,'                if (story.seaVortexPirateSlot !== undefined) battle.seaVortexPirateSlot = story.seaVortexPirateSlot;','                if (story.seaVortexPirateSlot !== undefined) battle.seaVortexPirateSlot = story.seaVortexPirateSlot;\n                if (story.taskId === 33) battle.pirateRescueStage = story.stage;');
battle=once(battle,`                if (story.activity && (this._battleEpoch !== epoch ||
                    require("./StoryEncounters").GetStoryEncounter(this.Player, mapId, param2) !== story)) {`,`                if (this._battleEpoch !== epoch ||
                    require("./StoryEncounters").GetStoryEncounter(this.Player, mapId, param2) !== story) {`);
battle=once(battle,'                if (story.requiredItems) {',`                if (story.seaVortexRescue) {
                    const started = await require("../Map/SeaVortexActivity").StartSeaRescueEncounter(
                        this.Player, story,
                        () => this._battleEpoch === epoch &&
                            require("./StoryEncounters").GetStoryEncounter(this.Player, mapId, param2) === story,
                        () => {
                            this.InitializeBattle(battle);
                            this._currentBattleMapId = mapId;
                        });
                    if (!started) {
                        await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.CHALLENGE_BOSS).setResult(5001));
                        return;
                    }
                } else if (story.requiredItems) {`);
battle=once(battle,'    /** 试炼之塔点怪开战。2429 的层数据由调用方先发出。 */',`    /** 王者之塔连续敌队；只在整队战败后结算一次。 */
    async StartKingTowerBattle(context, acknowledge) {
        if (this._currentBattle || this._petRecoveryInProgress || this.Player.Data.mapID !== context.entranceMapId)
            return false;
        const epoch = this._battleEpoch;
        const session = this.Player.Session;
        const playerData = this._initService.GetPlayerPet();
        if (!playerData)
            return false;
        const playerPet = this._initService.BuildPlayerBattlePet(playerData);
        const enemyTeam = context.definition.pets.map((id, index) => {
            const config = GameConfig_1.GameConfig.GetPetById(id);
            if (!config)
                throw new Error('King tower species missing: ' + id);
            const enemy = this._initService.BuildEnemyBattlePet(id, config, context.enemyLevel);
            enemy.hp = context.definition.hp;
            enemy.maxHp = context.definition.hp;
            enemy.catchTime = index + 1;
            return enemy;
        });
        const battle = {
            userId: this.UserID, player: playerPet, enemy: enemyTeam[0],
            enemyTeam, enemyIndex: 0, kingTower: context,
            turn: 0, roundCount: 0, isOver: false, battleType: BattleModel_1.BattleType.BOSS,
            startTime: Math.floor(Date.now() / 1000), lastHitWasCritical: false
        };
        await this._initService.TriggerPassiveAbilities(playerPet, battle.enemy);
        if (this._currentBattle || this._battleEpoch !== epoch || this._petRecoveryInProgress ||
            this.Player.Session !== session || session.Socket.destroyed || this.Player.Data.mapID !== context.entranceMapId)
            return false;
        this.InitializeBattle(battle);
        this._currentBattleMapId = context.roomMapId;
        this._currentBattleOriginalPetId = battle.enemy.id;
        await acknowledge();
        await this.SendReadyToFight(battle, (context.mode === 2 ? '极限塔' : '王者塔') + context.floor + '层');
        return true;
    }
    /** 试炼之塔点怪开战。2429 的层数据由调用方先发出。 */`);
battle=once(battle,'        const enemyPets = [BattleConverter_1.BattleConverter.ToSimplePetInfo(battle.enemy)];','        const enemyPets = (battle.kingTower ? battle.enemyTeam : [battle.enemy]).map(pet => BattleConverter_1.BattleConverter.ToSimplePetInfo(pet));');
battle=once(battle,'        await this.EmitRoundEndEvent(battle.turn, result.isOver, result.winner);',`        const intermediateKingEnemy = battle.kingTower && battle.enemy.hp <= 0 && battle.enemyIndex + 1 < battle.enemyTeam.length;
        await this.EmitRoundEndEvent(battle.turn, intermediateKingEnemy ? false : result.isOver, intermediateKingEnemy ? undefined : result.winner);`);
battle=once(battle,'        // Claim this battle before the first await. Partial rewards must never be replayed automatically.',`        if (battle.kingTower && winnerId === this.UserID) {
            if (battle.enemy.hp > 0)
                return;
            if (battle.enemyIndex + 1 < battle.enemyTeam.length) {
                battle.enemy = battle.enemyTeam[++battle.enemyIndex];
                battle.isOver = false;
                require('./PassiveAbilitySystem').PassiveAbilitySystem.TriggerPassiveAbilities(battle.enemy, battle.player);
                await this.Player.SendPacket(new Battle_1.PacketChangePet(0, battle.enemy.id, battle.enemy.name,
                    battle.enemy.level, battle.enemy.hp, battle.enemy.maxHp, battle.enemy.catchTime));
                if (stillValid() && this._currentBattle === battle && battle.player.hp <= 0)
                    await this.CheckPlayerPetDeath(stillValid);
                return;
            }
        }
        // Claim this battle before the first await. Partial rewards must never be replayed automatically.`);
battle=once(battle,'        const battleEndResults = BattleEffectIntegration_1.BattleEffectIntegration.OnBattleEnd(battle, winnerId);',`        let kingSettlement;
        if (battle.kingTower && winnerId === this.UserID) {
            try {
                kingSettlement = await require('../Map/KingTower').AdvanceKingTower(this.Player, battle, isCurrent);
            } catch (error) {
                utils_1.Logger.Error('[KingTower] Victory progress synchronization failed', error);
                if (!isCurrent())
                    return;
                winnerId = 0;
                reason = 0;
                await require('../Map/ForestMechanisms').SendForestAlert(this.Player,
                    '通关状态同步中断，请返回入口核对已保存进度；已到账奖励不会重复发放。');
            }
            if (!isCurrent())
                return;
        }
        const battleEndResults = BattleEffectIntegration_1.BattleEffectIntegration.OnBattleEnd(battle, winnerId);`);
battle=once(battle,'        let rewardItems = [];','        let rewardItems = kingSettlement?.rewardItems || [];');
battle=once(battle,'            rewardItems = reward.rewardItems;','            rewardItems = rewardItems.concat(reward.rewardItems);');
battle=once(battle,'        await this.SendFightOverPacket(this.Player, reason, winnerId);',`        await this.SendFightOverPacket(this.Player, reason, winnerId);
        for (const title of kingSettlement?.titleIds || []) {
            const body = Buffer.alloc(4);
            body.writeUInt32BE(title, 0);
            await this.Player.SendPacket({ getCmdId: () => CommandID_1.CommandID.GET_ACHIEVETITLE,
                getResult: () => 0, serialize: () => body });
        }
        if (kingSettlement?.pendingRewards)
            await require('../Map/ForestMechanisms').SendForestAlert(this.Player,
                '通关进度和成就已保存。部分奖励已达背包上限，整理后再与入口守卫交谈即可领取。');`);
const arenaPath='app/dist/GameServer/Server/Packet/Recv/Battle/ArenaHandlers.js';
let arena=fs.readFileSync(path.join(baseline,arenaPath),'utf8');
arena=once(arena,`        const buf = Buffer.alloc(4);
        await player.SendPacket(new PacketAchieveTitleList(buf));`,`        const titles = await require('../../../../Game/Map/KingTower').GetKingTowerTitles(player);
        if (player.Data.curTitle && !titles.includes(player.Data.curTitle)) titles.push(player.Data.curTitle);
        const buf = Buffer.alloc(4 + titles.length * 4);
        buf.writeUInt32BE(titles.length, 0);
        titles.forEach((title, index) => buf.writeUInt32BE(title, 4 + index * 4));
        await player.SendPacket(new PacketAchieveTitleList(buf));`);
put(arenaPath,arena);
const closedSpaceXitaPath='app/dist/GameServer/Game/Battle/ClosedSpaceXita.js';
assert.ok(!fs.existsSync(path.join(baseline,closedSpaceXitaPath)),'Closed-space Xita module already exists; reconcile current version');
put(closedSpaceXitaPath,fs.readFileSync(path.join(__dirname,'../compat/server-patches/map-story/ClosedSpaceXita.js')));
battle=once(battle,'exports.BattleManager = BattleManager;',
    'exports.BattleManager = BattleManager;\nrequire("./ClosedSpaceXita").Install(BattleManager);');
put(battlePath,battle);
const completePath='app/dist/GameServer/Game/Task/CompleteConfiguredTask.js';
let completeTask=fs.readFileSync(path.join(baseline,completePath),'utf8');
completeTask=once(completeTask,"driver.query('SELECT task_list, task_buffers FROM player_tasks WHERE owner_id = ?', [player.Uid])",
    "driver.query('SELECT task_list, task_buffers FROM player_tasks WHERE owner_id = ?' + (taskId === 7 && DatabaseManager_1.DatabaseManager.Instance.DatabaseType === 'mysql' ? ' FOR UPDATE' : ''), [player.Uid])");
completeTask=once(completeTask,"driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid])",
    "driver.query('SELECT item_list FROM player_items WHERE owner_id = ?' + (taskId === 7 && DatabaseManager_1.DatabaseManager.Instance.DatabaseType === 'mysql' ? ' FOR UPDATE' : ''), [player.Uid])");
completeTask=once(completeTask,'                const taskBuffers = JSON.parse(taskRows[0].task_buffers);',
    '                const taskBuffers = JSON.parse(taskRows[0].task_buffers);\n                if (taskId === 131) require("../Battle/TrainingBattleTask").ValidateCompletion(player, taskBuffers);');
completeTask=once(completeTask,'                const taskBuffers = JSON.parse(taskRows[0].task_buffers);',
    '                const taskBuffers = JSON.parse(taskRows[0].task_buffers);\n                if (taskId === 7) require("./Task7").ValidateCompletion(player, taskBuffers);');
completeTask=once(completeTask,'                for (const reward of itemRewards) {',`                const grantedItems = config.uniqueRewardItems === true
                    ? itemRewards.filter(reward => !stagedItems.some(item => item.itemId === reward.itemId &&
                        Number.isSafeInteger(item.count) && item.count >= reward.count))
                    : itemRewards;
                for (const reward of grantedItems) {`);
completeTask=once(completeTask,'                    const existing = stagedItems.find(item => item.itemId === reward.itemId);',
    `                    const existing = stagedItems.find(item => item.itemId === reward.itemId);
                    if (taskId === 134 && (existing?.count ?? 0) + reward.count > GameConfig_1.GameConfig.GetItemById(reward.itemId).Max)
                        throw new Error('Task 134 essence inventory is full');`);
completeTask=once(completeTask,'                        ...itemRewards,','                        ...grantedItems,');
completeTask=once(completeTask,'    const itemRewards = [',`    const selectedSuit = taskId === 95 ? config.choiceSuitItems?.[String(param)] : undefined;
    if (taskId === 95 && (!Array.isArray(selectedSuit) || selectedSuit.length !== 4))
        throw new Error('Invalid task 95 suit choice');
    const itemRewards = [`);
completeTask=once(completeTask,'        ...(rewards.items ?? []),','        ...(rewards.items ?? []),\n        ...(selectedSuit ?? []).map(itemId => ({ itemId, count: 1 })),');
completeTask=once(completeTask,"    if (config.type !== 'select_pet' && param !== 0 && param !== 1)","    if (taskId !== 95 && config.type !== 'select_pet' && param !== 0 && param !== 1)");
completeTask=once(completeTask,'                if (config.orderedProgress !== undefined) {','                if (config.orderedProgress !== undefined || taskId === 95) {');
put(completePath,completeTask);
const handbookRelative='client/overlay/resource/book/monsterBook.swf';
assert.notEqual(mapXmlId,undefined,'Missing current map names');
const mapXml=after.tags.find(tag=>tag.code===87&&tag.payload.readUInt16LE(0)===mapXmlId)?.payload.subarray(6).toString('utf8');
assert.ok(mapXml);
const mapNames=new Map([...mapXml.matchAll(/<map\b([^>]*)>/g)].map(([,attributes])=>{
    const id=attributes.match(/\bid="(\d+)"/),name=attributes.match(/\bname="([^"]*)"/);
    assert.ok(id&&name,'Map identity missing from current client');
    return [Number(id[1]),name[1].replaceAll('&quot;','"').replaceAll('&amp;','&')];
}));
const seaRules=JSON.parse(fs.readFileSync(path.join(server,'sea_vortex.json')));
const catalogue=require('./pet-boss-handbook-data.cjs').buildCatalogue({base:baseline,seaVortex:seaRules,darkPortalReview:review,kingTower:kingRules});
const seaRoutes=new Map(catalogue.pets.map(pet=>[pet.id,pet.acquisition.filter(route=>route.text.includes('深海宫殿救援（'+seaRules.mapId+'）'))]).filter(([,routes])=>routes.length));
const task28Routes=new Map(catalogue.pets.map(pet=>[pet.id,pet.acquisition.filter(route=>route.text.includes('完成任务#28「'))]).filter(([,routes])=>routes.length));
const reviewRoutes=new Map(catalogue.pets.map(pet=>[pet.id,pet.acquisition.filter(route=>route.text.includes('第十一门·破防研习'))]).filter(([,routes])=>routes.length));
const kingRoutes=new Map(catalogue.pets.map(pet=>[pet.id,pet.acquisition.filter(route=>route.text.includes('王者之塔（'+kingRules.entranceMapId+'）'))]).filter(([,routes])=>routes.length));
const templePrefix=mapNames.get(36)+'捕捉';
const templeRoutes=new Map(catalogue.pets.map(pet=>[pet.id,pet.acquisition.filter(route=>route.text.includes(templePrefix))]).filter(([,routes])=>routes.length));
for(const id of [145,146,147])assert.ok(templeRoutes.has(id),'Temple species or evolution lacks its mechanism acquisition route: '+id);
for(const id of [620,621,622,644,645])assert.ok(kingRoutes.has(id),'King Tower essence or evolution lacks its acquisition route: '+id);
for(const reward of seaRules.rewards.filter(reward=>reward.petId&&reward.weight>0))assert.ok(seaRoutes.has(reward.petId),'Rescue species missing from handbook');
const catalogueById=new Map(catalogue.pets.map(pet=>[pet.id,pet]));
const arenaRewards=new Set(JSON.parse(fs.readFileSync(path.join(baseline,'app/dist/GameServer/Game/Battle/StarArenaCatalog.json'))).arenas.map(arena=>arena.rewardPetId));
const normalizeMapClue=text=>text.replace(/地图#(\d+)/g,(original,id)=>mapNames.has(Number(id))?mapNames.get(Number(id))+'（'+id+'）':original);
const chunksPattern=/(      private function catalog\d+\(\) : Array\s*\{\s*return\s+)(\[[\s\S]*?\])(;[ \t]*\r?\n[ \t]*\})/g;
function deployedCatalogueChunks(source) {
    const body=source.match(/private function buildCatalog\(\) : Array\s*\{([\s\S]*?)\r?\n      \}/);
    assert.ok(body,'Missing native catalogue assembly');
    const calls=[...body[1].matchAll(/\b(catalog\d+)\(\)/g)].map(match=>match[1]);
    const methods=[...source.matchAll(chunksPattern)];
    const names=methods.map(match=>match[1].match(/private function (catalog\d+)/)[1]);
    assert.ok(calls.length>0);
    assert.equal(new Set(calls).size,calls.length,'Native catalogue repeats a chunk');
    assert.deepEqual(names,calls,'Preserve every referenced native catalogue chunk');
    return methods.map(match=>JSON.parse(match[2]));
}
function compileNativeBook(relative,className,expectedHash,transform) {
    const bytes=fs.readFileSync(path.join(baseline,relative));
    assert.equal(sha(bytes),expectedHash,'Reconcile newer native module '+className);
    const dir=path.join(out,'compiler/books',className),exported=path.join(dir,'baseline');
    execFileSync(v.java,['-Xmx1024m','-XX:ActiveProcessorCount=2','-Djava.awt.headless=true','-jar',v.ffdec,'-selectclass',className,'-export','script',exported,path.join(baseline,relative)],{stdio:'inherit',timeout:120000});
    const source=transform(fs.readFileSync(path.join(exported,'scripts',className+'.as'),'utf8'));
    const imports=path.join(dir,'import'),target=path.join(imports,'scripts',className+'.as');
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,source);
    const movie=parse(bytes),abc=movie.tags.filter(tag=>tag.code===82);
    assert.equal(abc.length,1);
    const context=path.join(dir,'context.swf'),compiled=path.join(dir,'compiled.swf');
    fs.writeFileSync(context,encode({...movie,tags:movie.tags.flatMap(tag=>tag.code===82?[...after.tags.filter(tag=>tag.code===82),tag]:[tag])}));
    execFileSync(v.java,['-Xmx1024m','-XX:ActiveProcessorCount=2','-Djava.awt.headless=true','-jar',v.ffdec,'-onerror','abort','-importScript',context,compiled,imports],{stdio:'inherit',timeout:240000});
    const replacement=parse(fs.readFileSync(compiled)).tags.filter(tag=>tag.code===82).at(-1);
    assert.equal(replacement.name,abc[0].name);
    assert.ok(!replacement.raw.equals(abc[0].raw));
    put(relative,encode({...movie,tags:movie.tags.map(tag=>tag.code===82?replacement:tag)}));
}
const bookIds=new Set(),oldBookIds=new Set(),changedBookIds=[],addedBookIds=[];
let bookEntries=0;
compileNativeBook(handbookRelative,'monsterBook','6147f8b1fc2f24b8082998e67c92e9f911c8588c03dd6efbd3db745cc9ca6a66',source=>{
    const chunks=deployedCatalogueChunks(source);
    for(const rows of chunks)for(const row of rows){assert.ok(!oldBookIds.has(row.id));oldBookIds.add(row.id);}
    const additions=catalogue.pets.filter(pet=>!oldBookIds.has(pet.id));
    for(const pet of additions)assert.ok(arenaRewards.has(pet.id),'New configured species requires explicit catalogue reconciliation: '+pet.id);
    const withoutAcquisition=(key,value)=>key==='acquisition'?undefined:value;
    let index=0;
    source=source.replace(chunksPattern,(whole,head,literal,tail)=>{
        const rows=chunks[index++],otherFields=JSON.stringify(rows,withoutAcquisition);
        for(const row of rows) {
            assert.ok(Number.isInteger(row.id)&&Array.isArray(row.acquisition));
            assert.ok(catalogueById.has(row.id),'Deployed species missing from current configuration');
            assert.ok(!bookIds.has(row.id),'Duplicate deployed handbook entry');
            bookIds.add(row.id);++bookEntries;
            const previous=JSON.stringify(row.acquisition);
            for(const route of row.acquisition) {
                assert.equal(typeof route.text,'string','Deployed acquisition route lacks text');
                route.text=normalizeMapClue(route.text);
            }
            for(const route of seaRoutes.get(row.id)||[])if(!row.acquisition.some(existing=>existing.text===route.text))row.acquisition.push(route);
            for(const route of reviewRoutes.get(row.id)||[])if(!row.acquisition.some(existing=>existing.text===route.text))row.acquisition.push(route);
            if(kingRoutes.has(row.id)) {
                row.acquisition=row.acquisition.filter(route=>route.kind!=='unknown');
                for(const route of kingRoutes.get(row.id))if(!row.acquisition.some(existing=>existing.text===route.text))row.acquisition.push(route);
            }
            const restoredTask28=task28Routes.get(row.id);
            if(restoredTask28) {
                row.acquisition=row.acquisition.filter(route=>!route.text.includes('完成任务#28「'));
                for(const route of restoredTask28)if(!row.acquisition.some(existing=>existing.text===route.text))row.acquisition.push(route);
            }
            const templeSources=templeRoutes.get(row.id);
            if(templeSources) {
                row.acquisition=row.acquisition.filter(route=>!route.text.includes(templePrefix));
                for(const route of templeSources)if(!row.acquisition.some(existing=>existing.text===route.text))row.acquisition.push(route);
            }
            if(JSON.stringify(row.acquisition)!==previous)changedBookIds.push(row.id);
        }
        assert.equal(JSON.stringify(rows,withoutAcquisition),otherFields,'Existing ratings, moves, training or other pet fields changed');
        if(index===chunks.length)for(const pet of additions) {
            assert.ok(!bookIds.has(pet.id));bookIds.add(pet.id);++bookEntries;addedBookIds.push(pet.id);
            rows.push({...pet,featured:false,acquisition:pet.acquisition.map(route=>({...route,text:normalizeMapClue(route.text)}))});
        }
        return head+JSON.stringify(rows,null,2)+tail;
    });
    return source;
});
assert.equal(bookEntries,catalogue.pets.length,'Do not replace or truncate deployed catalogue');
for(const pet of catalogue.pets)assert.ok(bookIds.has(pet.id),'Configured species absent from handbook');
for(const id of seaRoutes.keys())assert.ok(bookIds.has(id),'New rescue route has no handbook entry');
manifest.handbook={entries:bookEntries,changedAcquisitionEntries:changedBookIds.length,changedIds:changedBookIds,addedChampionSpecies:addedBookIds,rescueSpeciesAndEvolutions:[...seaRoutes.keys()],task28SpeciesAndEvolutions:[...task28Routes.keys()],kingTowerSpeciesAndEvolutions:[...kingRoutes.keys()],templeSpeciesAndEvolutions:[...templeRoutes.keys()],unchangedExistingRatingsMovesTrainingAndOtherFields:true};
compileNativeBook('client/overlay/resource/book/petCollection.swf','PetCollectionGallery','254f34088a6d338caa5eaf6a620caf328a077e994ce350bdf900a6bff4972a4b',source=>{
    const chunks=deployedCatalogueChunks(source);
    const ids=new Set();
    for(const rows of chunks)for(const row of rows){assert.ok(!ids.has(row.id));ids.add(row.id);}
    for(const id of oldBookIds)assert.ok(ids.has(id),'Existing handbook species absent from collection gallery');
    const additions=addedBookIds.filter(id=>!ids.has(id)).map(id=>catalogueById.get(id));
    for(const pet of additions)ids.add(pet.id);
    assert.equal(ids.size,bookIds.size,'Native books disagree on configured species');
    for(const id of bookIds)assert.ok(ids.has(id));
    let index=0;
    source=source.replace(chunksPattern,(whole,head,literal,tail)=>{
        const rows=chunks[index++];
        if(index===chunks.length)for(const pet of additions)rows.push({id:pet.id,name:pet.name,type:pet.type});
        return head+JSON.stringify(rows,null,2)+tail;
    });
    manifest.collectionGallery={entries:ids.size,addedChampionSpecies:additions.map(pet=>pet.id),existingRecordsAndNativeInterfacePreserved:true};
    return source;
});
function renameAssemblyDocument(movie,from,to) {
    const oldPackage=from.slice(0,from.lastIndexOf('.')),newPackage=to.slice(0,to.lastIndexOf('.'));
    const oldClass=from.slice(from.lastIndexOf('.')+1),newClass=to.slice(to.lastIndexOf('.')+1);
    const oldPrivate=oldPackage+':'+oldClass;
    let symbols=0,strings=0;
    const tags=movie.tags.map(tag=>{
        if(tag.code===76) {
            const before=Buffer.from(from),replacement=Buffer.from(to),payload=Buffer.from(tag.payload),at=payload.indexOf(before);
            if(at<0)return tag;
            assert.equal(before.length,replacement.length);
            assert.equal(payload.indexOf(before,at+1),-1);
            replacement.copy(payload,at);++symbols;
            return makeTag(76,payload);
        }
        if(tag.code!==82)return tag;
        const payload=Buffer.from(tag.payload);
        let cursor=payload.indexOf(0,4)+5;
        function u30() {
            let value=0;
            for(let shift=0;shift<35;shift+=7) {
                assert.ok(cursor<payload.length);
                const byte=payload[cursor++];value+=(byte&127)*2**shift;
                if(!(byte&128))return value;
            }
            throw new Error('Invalid ABC integer');
        }
        for(let pool=0;pool<2;pool++){const count=u30();for(let i=1;i<count;i++)u30();}
        const doubles=u30();cursor+=Math.max(0,doubles-1)*8;
        const count=u30();
        for(let i=1;i<count;i++) {
            const length=u30(),text=payload.subarray(cursor,cursor+length).toString('utf8');
            let replacement=text;
            if(text===oldPackage)replacement=newPackage;
            else if(text===oldClass)replacement=newClass;
            else if(text.startsWith(oldPrivate))replacement=text.replace(oldPackage+':',newPackage+':').replaceAll(oldClass,newClass);
            else if(text.startsWith(oldClass+'.as$'))replacement=newClass+text.slice(oldClass.length);
            if(replacement!==text) {
                const bytes=Buffer.from(replacement);
                assert.equal(bytes.length,length,'ABC rename must retain string widths');
                bytes.copy(payload,cursor);++strings;
            }
            cursor+=length;
        }
        return {...makeTag(82,payload),name:tag.name};
    });
    assert.equal(symbols,1,'Missing assembly document symbol');
    assert.ok(strings>=3,'Missing assembly class namespaces');
    return {...movie,tags};
}
function compileRestoredTaskModule({rule,bytes}) {
    assert.equal(rule.patch.classes.length,1);
    const className=rule.patch.classes[0],dir=path.join(out,'compiler/task-modules',className),imports=path.join(dir,'import');
    let movie=parse(bytes);
    if(rule.patch.renameDocumentFrom)movie=renameAssemblyDocument(movie,rule.patch.renameDocumentFrom,rule.patch.renameDocumentTo);
    const abc=movie.tags.filter(tag=>tag.code===82);
    assert.deepEqual(abc.map(tag=>tag.name),rule.patch.abcTags);
    const source=path.join(__dirname,'../compat/client-patches/map-story',rule.patch.directory,'scripts',className.replaceAll('.','/')+'.as');
    const target=path.join(imports,'scripts',className.replaceAll('.','/')+'.as');
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);
    const context=path.join(dir,'context.swf'),compiled=path.join(dir,'compiled.swf');
    const targetName=rule.patch.targetAbc||abc[0].name;
    assert.equal(abc.filter(tag=>tag.name===targetName).length,1,'Missing native module controller ABC');
    let insertedCore=false;
    const contextual={...movie,tags:movie.tags.flatMap(tag=>{
        if(tag.code!==82||insertedCore)return [tag];
        insertedCore=true;
        return [...after.tags.filter(candidate=>candidate.code===82),tag];
    })};
    fs.writeFileSync(context,encode(contextual));
    execFileSync(v.java,['-Xmx1024m','-XX:ActiveProcessorCount=2','-Djava.awt.headless=true','-jar',v.ffdec,'-onerror','abort','-importScript',context,compiled,imports],{stdio:'inherit',timeout:240000});
    const linked=parse(fs.readFileSync(compiled));
    assert.equal(linked.tags.length,contextual.tags.length,'Native module tag count changed');
    let replacement;
    linked.tags.forEach((tag,index)=>{
        const original=contextual.tags[index];
        assert.equal(tag.code,original.code);
        assert.equal(tag.name,original.name);
        if(tag.code===82&&tag.name===targetName) {
            assert.ok(!replacement,'Duplicate native module controller');
            assert.ok(!tag.raw.equals(original.raw),'Native module controller did not compile');
            replacement=tag;
        } else assert.ok(tag.raw.equals(original.raw),'Unrelated native module tag changed: '+(tag.name||tag.code));
    });
    assert.ok(replacement);
    const result=encode({...movie,tags:movie.tags.map(tag=>tag.code===82&&tag.name===targetName?replacement:tag)});
    for(const prefix of ['client/assets/','client/overlay/'])put(prefix+rule.path,result);
    return {path:rule.path,sourceSha256:rule.sha256,sha256:sha(result),editedClass:className,originalArtTagsPreserved:true};
}
manifest.nativeTaskModules=restoredInputs.filter(input=>input.rule.patch).map(compileRestoredTaskModule);
function compileNativeTrainingBattle() {
    const spec=nativeBattle.dllCompilation;
    const input=restoredInputs.find(entry=>entry.rule.path===nativeBattle.source.groupFight.path);
    assert.ok(input,'Missing original native battle resource');
    const movie=parse(input.bytes),allowed=new Set(spec.keepAbcNames),changed=new Set(nativeBattle.nativeSources.filter(entry=>entry.compile).map(entry=>entry.class));
    const nativeSources=new Map(nativeBattle.nativeSources.map(entry=>[entry.class,entry]));
    const originalNames=movie.tags.filter(tag=>tag.code===82).map(tag=>tag.name);
    assert.equal(new Set(originalNames).size,originalNames.length,'Duplicate original battle ABC');
    for (const name of allowed) assert.ok(originalNames.includes(name),'Missing native battle class: '+name);
    let removedBindings=0,removedExports=0,removedCharacters=0;
    const tags=movie.tags.flatMap(tag=>{
        if (tag.code===82) return allowed.has(tag.name)?[tag]:[];
        if (tag.code===87&&spec.omitBinaryCharacterIds.includes(tag.payload.readUInt16LE(0))) {
            ++removedCharacters;
            return [];
        }
        if (tag.code!==76&&tag.code!==56) return [tag];
        const bindings=[];
        let cursor=2;
        for (let index=0;index<tag.payload.readUInt16LE(0);++index) {
            const start=cursor,end=tag.payload.indexOf(0,cursor+2);
            assert.ok(end>=cursor+2,'Invalid native battle symbol binding');
            const name=tag.payload.subarray(cursor+2,end).toString('utf8');
            cursor=end+1;
            if (spec.omitSymbolClassNames.includes(name)) {
                if (tag.code===76) ++removedBindings;
                else ++removedExports;
            }
            else bindings.push(tag.payload.subarray(start,cursor));
        }
        assert.equal(cursor,tag.payload.length);
        const count=Buffer.alloc(2);
        count.writeUInt16LE(bindings.length);
        return [makeTag(tag.code,Buffer.concat([count,...bindings]))];
    });
    assert.equal(removedBindings,spec.omitSymbolClassNames.length,'Reconcile excluded battle symbols');
    assert.equal(removedExports,spec.omitSymbolClassNames.length,'Reconcile excluded battle exports');
    assert.equal(removedCharacters,spec.omitBinaryCharacterIds.length,'Reconcile excluded battle binaries');
    assert.equal(tags.filter(tag=>tag.code===82).length,allowed.size,'Native battle whitelist differs');
    for (const tag of tags.filter(tag=>tag.code===82)) {
        const expected=nativeSources.get(tag.name)?.originalAbcPayloadSha256||nativeBattle.nativeAssetAbcPayloadSha256[tag.name];
        assert.equal(sha(tag.payload),expected,'Reconcile original native battle class: '+tag.name);
    }
    for (const binary of spec.preserveBinaryCharacters) {
        const matches=tags.filter(tag=>tag.code===87&&tag.payload.readUInt16LE(0)===binary.characterId);
        assert.equal(matches.length,1,'Missing native skill relation XML');
        assert.equal(sha(matches[0].payload),binary.payloadSha256,'Native skill relation XML changed');
    }
    const dir=path.join(out,'compiler/native-training'),imports=path.join(dir,'import');
    for (const name of changed) {
        const source=path.join(nativeGroupDir,nativeBattle.nativeSourceDirectory,name+'.as');
        const bytes=fs.readFileSync(source);
        assert.equal(sha(bytes),nativeSources.get(name)?.sourceSha256,'Native battle source changed: '+name);
        const target=path.join(imports,'scripts',name+'.as');
        fs.mkdirSync(path.dirname(target),{recursive:true});
        fs.writeFileSync(target,bytes);
    }
    const coreTags=after.tags.filter(tag=>tag.code===82),contextTags=[];
    let inserted=false;
    for (const tag of tags) {
        if (!inserted&&tag.code===82) { contextTags.push(...coreTags);inserted=true; }
        contextTags.push(tag);
    }
    assert.ok(inserted);
    const context=path.join(dir,'context.swf'),compiled=path.join(dir,'compiled.swf');
    fs.writeFileSync(context,encode({...movie,tags:contextTags}));
    execFileSync(v.java,['-Xmx1024m','-XX:ActiveProcessorCount=2','-Djava.awt.headless=true','-jar',v.ffdec,'-onerror','abort','-importScript',context,compiled,imports],{stdio:'inherit',timeout:240000});
    const linked=parse(fs.readFileSync(compiled)),replacements=new Map();
    assert.equal(linked.tags.length,contextTags.length,'Native battle compiler changed tag count');
    linked.tags.forEach((tag,index)=>{
        const original=contextTags[index];
        assert.equal(tag.code,original.code);
        assert.equal(tag.name,original.name);
        if (tag.code===82&&changed.has(tag.name)) {
            assert.ok(!replacements.has(tag.name),'Duplicate compiled native battle class');
            assert.ok(!tag.raw.equals(original.raw),'Native battle class did not compile: '+tag.name);
            replacements.set(tag.name,tag);
        } else assert.ok(tag.raw.equals(original.raw),'Unrelated battle art or Core changed: '+(tag.name||tag.code));
    });
    assert.deepEqual([...replacements.keys()].sort(),[...changed].sort(),'Missing compiled native battle classes');
    const result=encode({...movie,tags:tags.map(tag=>tag.code===82&&replacements.has(tag.name)?replacements.get(tag.name):tag)});
    for (const relative of spec.outputPaths) put(relative,result);
    return {path:input.rule.path,sourceSha256:input.rule.sha256,sha256:sha(result),classes:[...changed],
        nativeClasses:spec.nativeOriginalAbcCount,assetClasses:spec.assetAbcCount,unrelatedClassesRemoved:originalNames.length-allowed.size,
        originalArtTagsPreserved:true,originalSkillRelationXmlPreserved:true};
}
manifest.nativeTrainingBattle=compileNativeTrainingBattle();
function compileNormalBattleObserver() {
    const relative='resource/module/PetFightDLL.swf';
    const baselineHash='bdc7ec68c649357516b7b9a60c72180a1c10581b8fe30402a33e428884b5d5fb';
    const targetName='com/robot/petFightModule/ui/ToolBtnPanelObserver';
    const input=fs.readFileSync(path.join(baseline,'client/overlay',relative));
    assert.equal(sha(input),baselineHash,'Reconcile current deployed normal battle module');
    assert.equal(sha(fs.readFileSync(path.join(baseline,'client/assets',relative))),baselineHash,'Normal battle assets/overlay baseline differs');
    const movie=parse(input),moduleAbcs=movie.tags.filter(tag=>tag.code===82);
    const moduleNames=new Set(moduleAbcs.map(tag=>tag.name));
    assert.equal(moduleNames.size,moduleAbcs.length,'Duplicate normal battle ABC');
    const target=moduleAbcs.filter(tag=>tag.name===targetName);
    assert.equal(target.length,1,'Missing normal battle observer ABC');
    assert.equal(sha(target[0].payload),'4ea44616aa650cc30bff677ae5ba84be410019c13d922b5671a4dbb13400736e','Reconcile normal battle observer');
    const source=path.join(__dirname,'../compat/client-patches/map-story/normal-battle/scripts',targetName+'.as');
    const sourceBytes=fs.readFileSync(source),dir=path.join(out,'compiler/normal-battle'),imports=path.join(dir,'import');
    const importPath=path.join(imports,'scripts',targetName+'.as');
    fs.mkdirSync(path.dirname(importPath),{recursive:true});fs.writeFileSync(importPath,sourceBytes);
    const coreTags=after.tags.filter(tag=>tag.code===82&&!moduleNames.has(tag.name));
    let inserted=false;
    const contextual={...movie,tags:movie.tags.flatMap(tag=>{
        if(tag.code!==82||inserted)return [tag];
        inserted=true;return [...coreTags,tag];
    })};
    assert.ok(inserted);
    const context=path.join(dir,'context.swf'),compiled=path.join(dir,'compiled.swf');
    fs.writeFileSync(context,encode(contextual));
    execFileSync(v.java,['-Xmx1024m','-XX:ActiveProcessorCount=2','-Djava.awt.headless=true','-jar',v.ffdec,'-onerror','abort','-importScript',context,compiled,imports],{stdio:'inherit',timeout:240000});
    const linked=parse(fs.readFileSync(compiled));
    assert.equal(linked.tags.length,contextual.tags.length,'Normal battle compiler changed tag count');
    let replacement;
    linked.tags.forEach((tag,index)=>{
        const old=contextual.tags[index];
        assert.equal(tag.code,old.code);assert.equal(tag.name,old.name);
        if(tag.code===82&&tag.name===targetName) {
            assert.ok(!replacement,'Duplicate compiled normal battle observer');
            assert.ok(!tag.raw.equals(old.raw),'Normal battle observer did not compile');
            replacement=tag;
        } else assert.ok(tag.raw.equals(old.raw),'Unrelated normal battle or Core tag changed: '+(tag.name||tag.code));
    });
    assert.ok(replacement);
    const result=encode({...movie,tags:movie.tags.map(tag=>tag.code===82&&tag.name===targetName?replacement:tag)});
    for(const prefix of ['client/assets/','client/overlay/'])put(prefix+relative,result);
    return {path:relative,sourceSha256:baselineHash,sha256:sha(result),editedClass:targetName,sourceClassSha256:sha(sourceBytes),originalOtherTagsPreserved:true};
}
manifest.normalBattle=compileNormalBattleObserver();
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2) + '\n');
console.log(JSON.stringify(manifest,null,2));
