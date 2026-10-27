'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {parseArgs} = require('node:util');
const {values} = parseArgs({options: Object.fromEntries(['baseline','out','java','ffdec'].map(k => [k,{type:'string'}]))});
for (const key of ['baseline','out','java','ffdec']) assert.ok(values[key], 'Missing --' + key);
const base = path.resolve(values.baseline), out = path.resolve(values.out), root = path.resolve(__dirname,'..');
assert.ok(!fs.existsSync(out), 'Choose a fresh output directory');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = p => fs.readFileSync(path.join(base,p));
function parse(raw) {
  assert.equal(raw.subarray(0,3).toString(),'CWS');
  const body = zlib.inflateSync(raw.subarray(8));
  assert.equal(body.length + 8,raw.readUInt32LE(4));
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0,offset), tags = [];
  while (offset < body.length) {
    const start = offset, h = body.readUInt16LE(offset); offset += 2;
    let length = h & 63;
    if (length === 63) { length = body.readUInt32LE(offset); offset += 4; }
    assert.ok(offset + length <= body.length);
    const data = body.subarray(offset,offset + length); offset += length;
    const code = h >> 6;
    tags.push({code, name: code === 82 ? data.subarray(4,data.indexOf(0,4)).toString() : null, raw: body.subarray(start,offset)});
    if (code === 0) break;
  }
  assert.equal(offset,body.length);
  return {prefix:raw.subarray(0,8),header,tags};
}
function encode(movie,tags) {
  const body = Buffer.concat([movie.header,...tags.map(t => t.raw)]), prefix = Buffer.from(movie.prefix);
  prefix.writeUInt32LE(body.length + 8,4);
  return Buffer.concat([prefix,zlib.deflateSync(body)]);
}
function compile(movie,source,name,context,dir) {
  const imports = path.join(out,'compiler',dir,'import'), file = path.join(imports,'scripts',name + '.as');
  fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,source);
  const input = path.join(out,'compiler',dir,'input.swf'), output = path.join(out,'compiler',dir,'output.swf');
  const tags = context ? movie.tags.flatMap(t => t.code === 82 ? [...context.tags.filter(x => x.code === 82),t] : [t]) : movie.tags;
  fs.writeFileSync(input,encode(movie,tags));
  execFileSync(values.java,['-Djava.awt.headless=true','-jar',values.ffdec,'-onerror','abort','-importScript',input,output,imports],{stdio:'inherit',timeout:240000});
  const rebuilt = parse(fs.readFileSync(output));
  assert.equal(rebuilt.tags.length,tags.length);
  const indexes = tags.map((t,i) => t.code === 82 && (!context ? t.name === name : i >= context.tags.filter(x => x.code === 82).length && t.name === movie.tags.find(x => x.code === 82).name) ? i : -1).filter(i => i >= 0);
  assert.equal(indexes.length,1,'Expected one target ABC');
  const index = indexes[0], replacement = rebuilt.tags[index];
  assert.equal(replacement.name,tags[index].name);
  assert.ok(!replacement.raw.equals(tags[index].raw),'Target ABC unchanged');
  rebuilt.tags.forEach((t,i) => { if (i !== index) assert.ok(t.raw.equals(tags[i].raw),'Unexpected ABC or tag change: ' + (t.name || t.code)); });
  const original = context ? movie.tags.find(t => t.code === 82) : movie.tags.find(t => t.name === name);
  return encode(movie,movie.tags.map(t => t === original ? replacement : t));
}
const corePath = 'client/assets/dll/NieoCore.swf', overlay = 'client/overlay/dll/NieoCore.swf';
const coreBytes = read(corePath), core = parse(coreBytes), mapName = 'com/robot/app/mapProcess/MapProcess_5';
const map = core.tags.filter(t => t.name === mapName);
assert.equal(map.length,1);
assert.equal(sha(map[0].raw),'a20a2a33083314216033d5a569be73cb7feef801a133889d1ad26c0f25616f96','Map 5 changed; reconcile against current Core');
if (fs.existsSync(path.join(base,overlay))) assert.ok(read(overlay).equals(coreBytes),'Core routes differ');
const config = JSON.parse(read('app/config/data/json/pet-acquisition.json'));
const ids = config.exchange.petIds;
assert.ok(Array.isArray(ids) && new Set(ids).size === ids.length && ids.every(Number.isSafeInteger),'Invalid sign-in catalog');
const attrs = text => Object.fromEntries([...text.matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1],m[2].replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>')]));
const species = new Map([...read('app/config/data/xml/pets.xml').toString().matchAll(/<Monster\b[^>]*>/g)].map(m => { const a=attrs(m[0]); return [Number(a.ID),a]; }));
const catalog = ids.map(id => {
  const pet = species.get(id); assert.ok(pet && pet.DefName,'Unknown species ' + id);
  const children = [species.get(Number(pet.EvolvesTo))].filter(Boolean).map(p => p.DefName);
  return {id,name:pet.DefName,evol:children.length ? '可进化为：' + children.join('、') : '当前物种表无后续进化'};
});
const mapSource = fs.readFileSync(path.join(root,'compat/client-patches/pet-acquisition-entries/scripts',mapName + '.as'),'utf8');
const mapCore = compile(core,mapSource,mapName,null,'core');
const taskName = 'com/robot/app/task/TaskMain';
const taskExport = path.join(out,'compiler','task-baseline');
execFileSync(values.java,['-Djava.awt.headless=true','-jar',values.ffdec,'-selectclass',taskName.replaceAll('/','.'),'-export','script',taskExport,path.join(base,corePath)],{stdio:'inherit',timeout:240000});
let taskSource = fs.readFileSync(path.join(taskExport,'scripts',taskName + '.as'),'utf8');
const oldTooltip = '绝版神宠每日签到';
assert.equal(taskSource.split(oldTooltip).length,2,'TaskMain tooltip changed; reconcile current source');
taskSource = taskSource.replace(oldTooltip,'收藏精灵每日签到');
const taskCore = compile(parse(mapCore),taskSource,taskName,null,'task');
const managerName = 'com/robot/core/manager/MapManager';
const managerExport = path.join(out,'compiler','map-manager-baseline');
execFileSync(values.java,['-Djava.awt.headless=true','-jar',values.ffdec,'-selectclass',managerName.replaceAll('/','.'),'-export','script',managerExport,path.join(base,corePath)],{stdio:'inherit',timeout:240000});
let managerSource = fs.readFileSync(path.join(managerExport,'scripts',managerName + '.as'),'utf8');
const oldClassifier = 'return mapID <= ID_MAX || MapConfig.XML_DATA.elements("map").(@id == mapID && @publicMap == "1").length() > 0;';
assert.equal(managerSource.split(oldClassifier).length,2,'Map classifier changed; reconcile current source');
managerSource = managerSource.replace(oldClassifier,`if(mapID <= ID_MAX) return true;
         for each(var map:XML in MapConfig.XML_DATA.elements("map"))
         {
            if(uint(map.attribute("id")) == mapID && String(map.attribute("publicMap")) == "1") return true;
         }
         return false;`);
const newCore = compile(parse(taskCore),managerSource,managerName,null,'map-classifier');
const panelPath = 'client/overlay/resource/module/com/robot/module/app/FightExchangePanel.swf';
const panelBytes = read(panelPath);
assert.equal(sha(panelBytes),'7d0080467b6806c1d9fd1501fd3fc85bdfc8ac3ab1ad73f69323ccb9e76edb49','Panel changed; reconcile current source');
const panel = parse(panelBytes); assert.equal(panel.tags.filter(t => t.code === 82).length,1);
const panelName = 'com/robot/module/app/FightExchangePanel';
let panelSource = fs.readFileSync(path.join(root,'compat/client-patches/daily-sign/FightExchangePanel.as'),'utf8');
const marker = 'private const PETS:Array = []; // @PET_ACQUISITION_CATALOG@';
assert.equal(panelSource.split(marker).length,2);
panelSource = panelSource.replace(marker,'private const PETS:Array = ' + JSON.stringify(catalog) + ';');
const newPanel = compile(panel,panelSource,panelName,parse(newCore),'panel');
const files = [];
function put(relative,bytes,before) { const dest=path.join(out,relative); fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.writeFileSync(dest,bytes); files.push({path:relative,before:before == null ? null : sha(before),after:sha(bytes)}); }
put(corePath,newCore,coreBytes);
put(overlay,newCore,fs.existsSync(path.join(base,overlay)) ? read(overlay) : null);
put(panelPath,newPanel,panelBytes);
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({files,signInPetIds:ids,sharedPanelMap:433},null,2)+'\n');
