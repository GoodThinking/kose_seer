'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const { values: options } = parseArgs({ options: { baseline: { type: 'string' }, out: { type: 'string' }, java: { type: 'string' }, ffdec: { type: 'string' }, 'server-only': { type: 'boolean', default: false }, 'reroll-only': { type: 'boolean', default: false } } });
for (const key of ['baseline', 'out']) assert.ok(options[key], 'Missing --' + key);
const root = path.resolve(__dirname, '..'), baseline = path.resolve(options.baseline), out = path.resolve(options.out);
assert.ok(!fs.existsSync(out), 'Choose a fresh output directory');
const files = [], classes = {}, sha = value => crypto.createHash('sha256').update(value).digest('hex');
function put(relative, bytes) {
  const original = path.join(baseline, relative), destination = path.join(out, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, bytes);
  files.push({ path: relative, before: fs.existsSync(original) ? sha(fs.readFileSync(original)) : null, after: sha(bytes) });
}
function once(text, before, after) { assert.equal(text.split(before).length, 2, 'Live source anchor changed: ' + before.slice(0, 100)); return text.replace(before, after); }
function parse(raw) {
  assert.ok(['CWS', 'FWS'].includes(raw.subarray(0, 3).toString()));
  const body = raw.subarray(0, 3).toString() === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
  assert.equal(body.length + 8, raw.readUInt32LE(4));
  let at = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, at), tags = [];
  while (at < body.length) {
    const begin = at, short = body.readUInt16LE(at); at += 2;
    const code = short >> 6; let size = short & 63;
    if (size === 63) { size = body.readUInt32LE(at); at += 4; }
    const payload = body.subarray(at, at + size); at += size;
    tags.push({ code, payload, name: code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null, raw: body.subarray(begin, at) });
    if (!code) break;
  }
  assert.equal(at, body.length); return { raw, header, tags };
}
function encode(source, tags) {
  const body = Buffer.concat([source.header, ...tags.map(tag => tag.raw)]), header = Buffer.from(source.raw.subarray(0, 8));
  header.write('CWS', 0); header.writeUInt32LE(body.length + 8, 4); return Buffer.concat([header, zlib.deflateSync(body)]);
}
function u30(bytes, at) { let value = 0; for (let shift = 0; shift < 35; shift += 7) { const byte = bytes[at++]; value += (byte & 127) * 2 ** shift; if (!(byte & 128)) return [value, at]; } throw new Error('Invalid U30'); }
function pack(value) { const bytes = []; do { let byte = value & 127; value = Math.floor(value / 128); if (value) byte |= 128; bytes.push(byte); } while (value); return Buffer.from(bytes); }
function stub(template, className) {
  const stop = template.payload.indexOf(0, 4), abc = template.payload.subarray(stop + 1);
  let at = 4, count;
  [count, at] = u30(abc, at); for (let i = 1; i < count; i++) [, at] = u30(abc, at);
  [count, at] = u30(abc, at); for (let i = 1; i < count; i++) [, at] = u30(abc, at);
  [count, at] = u30(abc, at); at += 8 * Math.max(0, count - 1);
  const parts = [abc.subarray(0, at)]; [count, at] = u30(abc, at); parts.push(pack(count));
  for (let i = 1; i < count; i++) {
    let size; [size, at] = u30(abc, at);
    const value = Buffer.from(abc.subarray(at, at + size).toString().replace(/NonoShortcut(?![A-Za-z0-9_])/g, className)); at += size;
    parts.push(pack(value.length), value);
  }
  parts.push(abc.subarray(at));
  const name = 'com/robot/core/ui/nono/' + className;
  const payload = Buffer.concat([template.payload.subarray(0, 4), Buffer.from(name + '\0'), ...parts]);
  const header = Buffer.alloc(6); header.writeUInt16LE((82 << 6) | 63); header.writeUInt32LE(payload.length, 2);
  return { code: 82, name, payload, raw: Buffer.concat([header, payload]) };
}

// Keep the live class bodies intact; change only the medicine refresh boundary.
const rerollClasses = [
  'com.robot.app.petbag.ui.PetBagPanel', 'com.robot.app.petbag.ui.PetBagListItem',
  'com.robot.app.bag.BagListItem', 'com.robot.core.manager.PetManager',
  'com.robot.app.petbag.petPropsBag.PetBagModel', 'com.robot.app.petbag.petPropsBag.ui.PetPropsPanel'
];
function patchRerollSources(sources, exported) {
  const managerName = 'com/robot/core/manager/PetManager';
  sources.set(managerName, once(exported(managerName), '      public static function upDate() : void', `      public static function updateBagPet(pet:PetInfo) : void
      {
         if(!_bagMap.containsKey(pet.catchTime))return;
         pet.isDefault = pet.catchTime == defaultTime;
         _bagMap.add(pet.catchTime,pet);
         if(showInfo != null && showInfo.catchTime == pet.catchTime)showInfo = pet;
         dispatchEvent(new PetEvent(PetEvent.UPDATE_INFO,pet.catchTime));
      }

      public static function upDate() : void`));
  const cardName = 'com/robot/app/petbag/ui/PetBagListItem';
  sources.set(cardName, once(exported(cardName), '      public function show(param1:PetInfo) : void', `      public function refreshInfo(pet:PetInfo) : void
      {
         if(this._info == null || this._info.id != pet.id || this._info.skinID != pet.skinID)
         {
            this.show(pet);
            return;
         }
         this._info = pet;
         var hp:String = pet.hp + "/" + pet.maxHp;
         var level:String = "lv." + pet.level;
         if(this._barTxt.text != hp)this._barTxt.text = hp;
         if(this._lvTxt.text != level)this._lvTxt.text = level;
         this._markMc.width = pet.hp / pet.maxHp * this._barMc.width;
      }

      public function show(param1:PetInfo) : void`));
  const itemName = 'com/robot/app/bag/BagListItem';
  sources.set(itemName, once(exported(itemName), '      public function setInfo(param1:SingleItemInfo, param2:Boolean = false) : void', `      public function refreshPetItem(info:SingleItemInfo) : void
      {
         if(this._info == null || this._info.itemID != info.itemID || this._info.itemLevel != info.itemLevel ||
            this._info.leftTime != info.leftTime || this._info.itemNum == 0 || info.itemNum == 0)
         {
            this.clear();
            this.setInfo(info);
            return;
         }
         this._info = info;
         var count:String = info.itemNum > 1 ? String(info.itemNum) : "";
         if(this._txt.text != count)this._txt.text = count;
      }

      public function setInfo(param1:SingleItemInfo, param2:Boolean = false) : void`));
  const bagName = 'com/robot/app/petbag/ui/PetBagPanel';
  let bag = sources.get(bagName);
  bag = once(bag, '         this._infoMc.show(this._curretItem.info);',
    '         if((_mainUI["itemMC"] as MovieClip).visible)this._infoMc.hide();\n         else this._infoMc.show(this._curretItem.info);');
  bag = once(bag, '         this._petPropsPanel.getPetInfo(this._curretItem.info);\n         if((_mainUI["itemMC"] as MovieClip).visible)\n         {\n            this._infoMc.hide();\n         }',
    '         this._petPropsPanel.getPetInfo(this._curretItem.info);');
  bag = once(bag, '         (_mainUI["itemMC"] as MovieClip).visible = false;\n      }',
    '         (_mainUI["itemMC"] as MovieClip).visible = false;\n         if(this._curretItem != null && this._curretItem.info != null)this._infoMc.show(this._curretItem.info);\n      }');
  bag = once(bag, `      private function onUpDate(param1:PetEvent) : void
      {
         this.refreshItem();
      }`, `      private function onUpDate(param1:PetEvent) : void
      {
         var catchTime:uint = param1.catchTime();
         if(catchTime != 0)
         {
            for(var i:int = 0;i < this._listCon.numChildren;i++)
            {
               var item:PetBagListItem = this._listCon.getChildAt(i) as PetBagListItem;
               if(item.info != null && item.info.catchTime == catchTime)
               {
                  var pet:PetInfo = PetManager.getPetInfo(catchTime);
                  if(pet == null)break;
                  item.refreshInfo(pet);
                  if(item == this._curretItem)this.setSelect(item);
                  return;
               }
            }
         }
         this.refreshItem();
      }`);
  sources.set(bagName, bag);
}
if (options['reroll-only']) {
  assert.ok(!options['server-only'], 'Choose one build mode');
  for (const key of ['java', 'ffdec']) assert.ok(options[key], 'Missing --' + key);
  const java = args => execFileSync(options.java, ['-Djava.awt.headless=true', '-Xmx3g', '-jar', options.ffdec, ...args], { stdio: ['ignore','pipe','inherit'], timeout: 300000 });
  const relative = 'client/overlay/dll/NieoCore.swf', input = path.join(baseline, relative);
  const original = parse(fs.readFileSync(input));
  const exportRoot = path.join(out, 'native-source'), imports = path.join(out, 'compiler/core/import');
  java(['-selectclass', rerollClasses.join(','), '-export', 'script', exportRoot, input]);
  const exported = name => fs.readFileSync(path.join(exportRoot, 'scripts', name + '.as'), 'utf8').replace(/\r\n/g, '\n');
  const sources = new Map([['com/robot/app/petbag/ui/PetBagPanel', exported('com/robot/app/petbag/ui/PetBagPanel')]]);
  for (const name of ['PetBagModel', 'ui/PetPropsPanel']) {
    const fullName = 'com/robot/app/petbag/petPropsBag/' + name;
    let source = fs.readFileSync(path.join(root, 'compat/client-patches/continuous-pet-edit/scripts', fullName + '.as'), 'utf8');
    if (name === 'ui/PetPropsPanel') {
      for (const key of ['ITEM_META', 'REROLL_TYPES']) {
        const declaration = exported(fullName).match(new RegExp('private static const ' + key + ':Object = [\\s\\S]*?;\\n'));
        assert.ok(declaration, 'Missing live medicine metadata: ' + key);
        source = once(source, 'private static const ' + key + ':Object = {}; // @' + key + '@', declaration[0].trim());
      }
    }
    sources.set(fullName, source);
  }
  patchRerollSources(sources, exported);
  for (const [name, source] of sources) {
    const file = path.join(imports, 'scripts', name + '.as');
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, source);
  }
  const compiledFile = path.join(out, 'compiler/core/output.swf');
  java(['-onerror', 'abort', '-importScript', input, compiledFile, imports]);
  const compiled = parse(fs.readFileSync(compiledFile));
  assert.equal(compiled.tags.length, original.tags.length);
  const bytes = encode(original, original.tags.map((tag, position) => {
    if (!sources.has(tag.name)) return tag;
    const next = compiled.tags[position];
    assert.equal(next.name, tag.name); assert.ok(!next.raw.equals(tag.raw), 'Class did not compile: ' + tag.name);
    classes[tag.name] = { before: sha(tag.payload), after: sha(next.payload) };
    return next;
  }));
  assert.equal(Object.keys(classes).length, sources.size);
  put(relative, bytes); put(relative.replace('client/overlay/', 'client/assets/'), bytes);
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ files, classes, restartGame: false, restartWeb: false, migration: null, playerDataMigration: false }, null, 2) + '\n');
  console.log(JSON.stringify({ out, files: files.length, classes: sources.size, migration: null }));
  process.exit(0);
}

const handlerRelative = 'app/dist/GameServer/Server/Packet/Recv/NoNo/PetWorkflowHandlers.js';
put(handlerRelative, fs.readFileSync(path.join(root, 'compat/server-patches/pet-workflow/PetWorkflowHandlers.js')));
const indexRelative = 'app/dist/GameServer/Server/Packet/Recv/NoNo/index.js';
let index = fs.readFileSync(path.join(baseline, indexRelative), 'utf8');
assert.ok(!index.includes('./PetWorkflowHandlers'), 'Workflow handlers already installed; reconcile registration first');
index += '\nconst workflowHandlers = require("./PetWorkflowHandlers");\n';
for (const name of ['PetStorageSwapHandler', 'PetTrainingHandler', 'ConsumableRestockHandler', 'HatchStatusHandler']) index += `exports.${name} = workflowHandlers.${name};\n`;
put(indexRelative, index);
// Compile only the added recovery function; retain every unrelated live handler change.
const ts = require('typescript');
const recoveryRelative = 'app/dist/GameServer/Server/Packet/Recv/Pet/UsePetItemOutOfFightHandler.js';
let recoveryHandler = fs.readFileSync(path.join(baseline, recoveryRelative), 'utf8');
const recoverySource = ts.transpileModule(fs.readFileSync(path.join(root, 'src/GameServer/Server/Packet/Recv/Pet/UsePetItemOutOfFightHandler.ts'), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, experimentalDecorators: true }
}).outputText;
const recoveryAst = ts.createSourceFile('recovery.js', recoverySource, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);
const recoveryFunction = recoveryAst.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'useRecoveryMedicine');
assert.ok(recoveryFunction, 'Missing recovery medicine implementation');
assert.ok(!recoveryHandler.includes('function useRecoveryMedicine('), 'Recovery handler already installed; reconcile first');
recoveryHandler = once(recoveryHandler, 'const DatabaseHelper_1 = require("../../../../../DataBase/DatabaseHelper");',
  'const DatabaseHelper_1 = require("../../../../../DataBase/DatabaseHelper");\nconst DatabaseManager_1 = require("../../../../../DataBase/DatabaseManager");');
recoveryHandler = once(recoveryHandler, '        const fixedNature = NATURE_BY_ITEM[itemId];',
  '        if (item && (Number(item.HP) > 0 || Number(item.PP) > 0)) {\n            await useRecoveryMedicine(player, catchTime, itemId);\n            return;\n        }\n        const fixedNature = NATURE_BY_ITEM[itemId];');
put(recoveryRelative, recoveryHandler + '\n' + recoveryFunction.getText(recoveryAst) + '\n');
if (!options['server-only']) {
  for (const key of ['java', 'ffdec']) assert.ok(options[key], 'Missing --' + key);
  const java = args => execFileSync(options.java, ['-Djava.awt.headless=true', '-Xmx3g', '-jar', options.ffdec, ...args], { stdio: ['ignore','pipe','inherit'], timeout: 300000 });
  const coreRelative = 'client/overlay/dll/NieoCore.swf', original = parse(fs.readFileSync(path.join(baseline, coreRelative)));
  const originalNames = new Set(original.tags.filter(tag => tag.code === 82).map(tag => tag.name));
  const exportRoot = path.join(out, 'native-source');
  java(['-selectclass', [...rerollClasses, 'org.taomee.manager.TaomeeManager', 'com.robot.app.petbag.petPropsBag.petPropClass.*'].join(','), '-export', 'script', exportRoot, path.join(baseline, coreRelative)]);
  const exported = name => fs.readFileSync(path.join(exportRoot, 'scripts', name + '.as'), 'utf8');
  const itemXml = fs.readFileSync(path.join(baseline, 'app/config/data/xml/items.xml'), 'utf8');
  const metadata = {}, rerolls = {}, commandsByClass = new Map();
  const propDirectory = path.join(exportRoot, 'scripts/com/robot/app/petbag/petPropsBag/petPropClass');
  function commandNames(id, seen = new Set()) {
    if (commandsByClass.has(id)) return commandsByClass.get(id);
    assert.ok(!seen.has(id), 'Circular item class'); seen.add(id);
    const file = path.join(propDirectory, 'PetPropClass_' + id + '.as');
    if (!fs.existsSync(file)) return [];
    const source = fs.readFileSync(file, 'utf8');
    const commands = [...source.matchAll(/SocketConnection\.(?:send|addCmdListener)\(CommandID\.(\w+)/g)].map(match => match[1]);
    for (const parent of source.matchAll(/(?:extends |new )PetPropClass_(\d+)/g)) commands.push(...commandNames(parent[1], new Set(seen)));
    const result = [...new Set(commands)]; commandsByClass.set(id, result); return result;
  }
  for (const match of itemXml.matchAll(/<Item\b([^>]*)>/g)) {
    const item = Object.fromEntries([...match[1].matchAll(/(\w+)="([^"]*)"/g)].map(value => [value[1], value[2]]));
    const kind = Number(item.RandomDv) === 1 ? 'dv' : Number(item.MonNatureReset) === 1 ? 'nature' : Number(item.NewSeReset) === 1 || Number(item.NonFuseResetNewse) === 1 ? 'trait' : null;
    if (kind) rerolls[item.ID] = kind;
    if (!fs.existsSync(path.join(propDirectory, 'PetPropClass_' + item.ID + '.as')) && item.bShowPetBag !== '1' && Number(item.ID) !== 300700) continue;
    const group = kind || Number(item.MonAttrReset) ? '洗练' : Object.keys(item).some(key => /^Ev|FullAbility|Study/.test(key)) ? '学习力' : Number(item.HP) > 0 || Number(item.PP) > 0 ? '恢复' : '其他';
    const commands = Number(item.ID) === 300700 ? ['USE_PET_ITEM_OUT_OF_FIGHT'] : commandNames(item.ID);
    metadata[item.ID] = { group, safeRepeat: Number(item.HP) > 0 || Number(item.PP) > 0, hp: Number(item.HP) || 0, pp: Number(item.PP) || 0, commands: commands.map(name => '@COMMAND:' + name + '@') };
  }
  assert.deepEqual([rerolls[300024], rerolls[300025], rerolls[300052], rerolls[300054]], ['dv', 'nature', 'trait', 'trait']);
  const additions = ['PetWorkflowClient', 'PetWorkflowUI', 'PetTrainingPanel', 'ConsumableRestockPanel', 'HatchStatusPanel'];
  const imports = path.join(out, 'compiler/core/import'), sources = new Map();
  for (const name of [...additions, 'NonoShortcut', 'BattleExperiencePanel']) sources.set('com/robot/core/ui/nono/' + name, fs.readFileSync(path.join(root, 'compat/client-patches/nono-experience/core/scripts/com/robot/core/ui/nono/' + name + '.as'), 'utf8'));
  for (const name of ['PetBagModel', 'ui/PetPropsPanel']) sources.set('com/robot/app/petbag/petPropsBag/' + name, fs.readFileSync(path.join(root, 'compat/client-patches/continuous-pet-edit/scripts/com/robot/app/petbag/petPropsBag/' + name + '.as'), 'utf8'));
  let props = sources.get('com/robot/app/petbag/petPropsBag/ui/PetPropsPanel');
  props = once(props, 'private static const REROLL_TYPES:Object = {}; // @REROLL_TYPES@', 'private static const REROLL_TYPES:Object = ' + JSON.stringify(rerolls) + ';');
  const metaSource = JSON.stringify(metadata).replace(/"@COMMAND:(\w+)@"/g, 'CommandID.$1');
  props = once(props, 'private static const ITEM_META:Object = {}; // @ITEM_META@', 'private static const ITEM_META:Object = ' + metaSource + ';');
  sources.set('com/robot/app/petbag/petPropsBag/ui/PetPropsPanel', props);
  let bag = exported('com/robot/app/petbag/ui/PetBagPanel');
  bag = once(bag, '         this._petPropsPanel.getPetInfo(this._curretItem.info);', '         this._petPropsPanel.getPetInfo(this._curretItem.info);\n         if((_mainUI["itemMC"] as MovieClip).visible)\n         {\n            this._infoMc.hide();\n         }');
  sources.set('com/robot/app/petbag/ui/PetBagPanel', bag);
  patchRerollSources(sources, exported);
  let taomee = exported('org/taomee/manager/TaomeeManager');
  taomee = once(taomee, '         _stage = param2;', '         _stage = param2;\n         com.robot.core.ui.nono.HatchStatusPanel.install();');
  sources.set('org/taomee/manager/TaomeeManager', taomee);
  for (const [name, source] of sources) { const file = path.join(imports, 'scripts', name + '.as'); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, source); }
  const template = original.tags.find(tag => tag.name === 'com/robot/core/ui/nono/NonoShortcut'); assert.ok(template);
  const linked = original.tags.slice();
  for (const name of additions) if (!originalNames.has('com/robot/core/ui/nono/' + name)) linked.splice(linked.findIndex(tag => tag === template), 0, stub(template, name));
  const compiler = path.join(out, 'compiler/core'), input = path.join(compiler, 'input.swf'), output = path.join(compiler, 'output.swf');
  fs.writeFileSync(input, encode(original, linked));
  java(['-onerror', 'abort', '-importScript', input, output, imports]);
  const compiled = parse(fs.readFileSync(output)); assert.equal(compiled.tags.length, linked.length);
  const coreBytes = encode(original, linked.map((tag, position) => {
    if (!sources.has(tag.name)) return tag;
    const next = compiled.tags[position]; assert.equal(next.name, tag.name); assert.ok(!next.raw.equals(tag.raw), 'Class did not compile: ' + tag.name);
    const before = original.tags.find(value => value.name === tag.name); classes[tag.name] = { before: before ? sha(before.payload) : null, after: sha(next.payload) }; return next;
  }));
  put(coreRelative, coreBytes); put(coreRelative.replace('client/overlay/', 'client/assets/'), coreBytes);
  const core = parse(coreBytes), warehouseRelative = 'client/overlay/module/com/robot/module/app/PetStorage.swf';
  const warehouse = parse(fs.readFileSync(path.join(baseline, warehouseRelative)));
  const warehouseNames = new Set(warehouse.tags.filter(tag => tag.code === 82).map(tag => tag.name));
  assert.equal(warehouseNames.size, 1, 'Warehouse ABC layout changed; inspect before compiling');
  const warehouseLinked = [...warehouse.tags.filter(tag => tag.code !== 0), ...core.tags.filter(tag => tag.code === 82 && !warehouseNames.has(tag.name)), ...warehouse.tags.filter(tag => tag.code === 0)];
  const warehouseCompiler = path.join(out, 'compiler/warehouse'), warehouseImports = path.join(warehouseCompiler, 'import');
  const warehouseSource = path.join(warehouseImports, 'scripts/com/robot/module/app/PetStorage.as'); fs.mkdirSync(path.dirname(warehouseSource), { recursive: true });
  fs.copyFileSync(path.join(root, 'compat/client-patches/nono-experience/warehouse/scripts/com/robot/module/app/PetStorage.as'), warehouseSource);
  const warehouseInput = path.join(warehouseCompiler, 'input.swf'), warehouseOutput = path.join(warehouseCompiler, 'output.swf'); fs.writeFileSync(warehouseInput, encode(warehouse, warehouseLinked));
  java(['-onerror', 'abort', '-importScript', warehouseInput, warehouseOutput, warehouseImports]);
  const nextWarehouse = parse(fs.readFileSync(warehouseOutput)); assert.equal(nextWarehouse.tags.length, warehouseLinked.length);
  const warehouseBytes = encode(warehouse, warehouse.tags.map((tag, position) => {
    if (tag.code !== 82) return tag;
    const next = nextWarehouse.tags[position]; assert.equal(next.name, tag.name); assert.ok(!next.raw.equals(tag.raw)); return next;
  }));
  put(warehouseRelative, warehouseBytes); put(warehouseRelative.replace('client/overlay/', 'client/assets/'), warehouseBytes);
  const bookOut = path.join(out, 'book');
  execFileSync(process.execPath, [path.join(root, 'scripts/build-pet-boss-handbook.cjs'), '--baseline', baseline, '--fusion-baseline', baseline, '--book', path.join(baseline, 'client/overlay/resource/book/monsterBook.swf'), '--out', bookOut, '--java', options.java, '--ffdec', options.ffdec], { stdio: 'inherit', timeout: 360000 });
  put('client/overlay/resource/book/monsterBook.swf', fs.readFileSync(path.join(bookOut, 'client/overlay/resource/book/monsterBook.swf')));
}
const manifest = { files, classes, restartGame: true, restartWeb: false, migration: null, playerDataMigration: false };
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ out, files: files.length, classes: Object.keys(classes).length, migration: null }));
