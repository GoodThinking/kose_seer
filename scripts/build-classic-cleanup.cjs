'use strict';
/**
 * 赛尔号怀旧服经典还原与去冗余构建器 (build-classic-cleanup.cjs)
 *
 * 1. 移除第六星系（远航星域 9700~9794 场景、Galaxy_6、worldMap 第六星系按钮、远航星图、49 位原创宇宙 Boss）。
 * 2. 移除 20 只自造/扩展精灵（1632,1633,2208,2209,2210,2470,100001..100011,110001..110003）与 26 个原创专属技能（50001..50026）。
 * 3. 下线凑数的 82 档收集计划（collect-plans.json）、每日签到白送宠（daily-sign.json）与 SPT 首胜凑数奖励宠（rewardPetId）。
 * 4. 恢复全套赛尔号原版经典 Flash UI（图鉴 PictureBookPanel、收集奖励 PetCollectBoundsPanel、仓库 PetStorage、融合手册 PetAmalgamationBookPanel、精灵手册 monsterBook、分子转化仪 MoleculePanel、NoNo 养成面板 PetTrainingPanel/PetWorkflowUI、刻印面板 PetCountermarkBookPanel、SPT 挑战终端 SptPanel）。
 * 5. 注册数据库迁移 032，自动清理存档中残留的自造扩展精灵、原创宇宙精元、远航遭遇与凑数计划记录，并将停留在 9700~9794/932 的角色安全迁回实验室（Map 5）。
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../../..');
const worktreeRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'outputs/classic-cleanup-20261118/build');
const javaBin = path.join(repoRoot, 'work/client-lab/tools/jre/jdk-21.0.12.1+1-jre/Contents/Home/bin/java');
const ffdecJar = path.join(repoRoot, 'work/client-lab/tools/ffdec/ffdec.jar');

const EXTENDED_SPECIES = new Set([
  1632, 1633, 2208, 2209, 2210, 2470,
  100001, 100002, 100003, 100004, 100005, 100006, 100007, 100008, 100009, 100010, 100011,
  110001, 110002, 110003
]);
const CUSTOM_SKILLS = new Set(Array.from({length: 26}, (_, i) => 50001 + i));
const CUSTOM_ESSENCES = new Set(Array.from({length: 9}, (_, i) => 403034 + i));

const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');

function parseSwf(raw) {
  const sig = raw.subarray(0, 3).toString();
  assert.ok(['CWS', 'FWS'].includes(sig), 'Expected SWF');
  const body = sig === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
  assert.equal(body.length + 8, raw.readUInt32LE(4), 'Invalid SWF length');
  let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, offset), tags = [];
  while (offset < body.length) {
    const start = offset, short = body.readUInt16LE(offset); offset += 2;
    const code = short >> 6;
    let size = short & 63;
    if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
    const payload = body.subarray(offset, offset + size); offset += size;
    const name = code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString('utf8') : null;
    tags.push({code, payload, name, raw: body.subarray(start, offset)});
    if (!code) break;
  }
  assert.equal(offset, body.length, 'Truncated SWF stream');
  return {raw, sig, header, tags};
}

function encodeSwf(source, rawTags) {
  const body = Buffer.concat([source.header, ...rawTags]);
  const head = Buffer.from(source.raw.subarray(0, 8));
  head.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([head, source.sig === 'CWS' ? zlib.deflateSync(body, {level: 9}) : body]);
}

function longTag(code, payload) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE((code << 6) | 63);
  head.writeUInt32LE(payload.length, 2);
  return Buffer.concat([head, payload]);
}

function symbolId(swf, symName) {
  for (const tag of swf.tags.filter(t => t.code === 76)) {
    let offset = 2;
    const count = tag.payload.readUInt16LE(0);
    for (let i = 0; i < count; i++) {
      const id = tag.payload.readUInt16LE(offset); offset += 2;
      const end = tag.payload.indexOf(0, offset);
      if (tag.payload.subarray(offset, end).toString('utf8') === symName) return id;
      offset = end + 1;
    }
  }
  throw new Error('Missing symbol: ' + symName);
}

function replaceBinaryXml(swf, symName, transformFn) {
  const id = symbolId(swf, symName);
  const idx = swf.tags.findIndex(t => t.code === 87 && t.payload.readUInt16LE(0) === id);
  assert.ok(idx >= 0, 'Missing binary tag for ' + symName);
  const oldTag = swf.tags[idx];
  const oldXml = oldTag.payload.subarray(6).toString('utf8');
  const nextXml = transformFn(oldXml);
  const newPayload = Buffer.concat([oldTag.payload.subarray(0, 6), Buffer.from(nextXml, 'utf8')]);
  const raw = longTag(87, newPayload);
  swf.tags[idx] = {code: 87, payload: newPayload, name: null, raw};
}

function ffdecCompileClass(baseSwfPath, classPath, sourceFilePath, workDir, extraAbcTags = []) {
  fs.rmSync(workDir, {recursive: true, force: true});
  const importDir = path.join(workDir, 'import/scripts', path.dirname(classPath));
  fs.mkdirSync(importDir, {recursive: true});
  fs.copyFileSync(sourceFilePath, path.join(importDir, path.basename(classPath) + '.as'));
  let inputSwfPath = baseSwfPath;
  if (extraAbcTags.length > 0) {
    const baseSwf = parseSwf(fs.readFileSync(baseSwfPath));
    const existingNames = new Set(baseSwf.tags.map(t => t.name).filter(Boolean));
    const endIdx = baseSwf.tags.findIndex(t => t.code === 0);
    const mergedTags = [
      ...baseSwf.tags.slice(0, endIdx).map(t => t.raw),
      ...extraAbcTags.filter(t => t.code === 82 && !existingNames.has(t.name)).map(t => t.raw),
      ...baseSwf.tags.slice(endIdx).map(t => t.raw)
    ];
    inputSwfPath = path.join(workDir, 'context.swf');
    fs.writeFileSync(inputSwfPath, encodeSwf(baseSwf, mergedTags));
  }
  const ffdecHome = '/tmp/ffdec-home';
  fs.mkdirSync(path.join(ffdecHome, '.FFDec/flashlib'), {recursive: true});
  const swcSrc = path.join(repoRoot, 'work/client-lab/tools/ffdec/flashlib/playerglobal32_0.swc');
  for (const name of ['playerglobal32_0.swc', 'playerglobal.swc']) {
    const dst = path.join(ffdecHome, '.FFDec/flashlib', name);
    if (!fs.existsSync(dst)) fs.copyFileSync(swcSrc, dst);
  }
  const compiledSwfPath = path.join(workDir, 'compiled.swf');
  execFileSync(javaBin, [
    '-Duser.home=' + ffdecHome,
    '-Djava.awt.headless=true', '-Xmx768m', '-jar', ffdecJar,
    '-onerror', 'abort', '-importScript', inputSwfPath, compiledSwfPath, path.join(workDir, 'import')
  ], {stdio: 'inherit', timeout: 240000});
  const inputSwf = parseSwf(fs.readFileSync(inputSwfPath));
  const compiledSwf = parseSwf(fs.readFileSync(compiledSwfPath));
  assert.equal(compiledSwf.tags.length, inputSwf.tags.length, 'Tag count changed during compile of ' + classPath);
  const changedIndices = [];
  for (let i = 0; i < compiledSwf.tags.length; i++) {
    if (!compiledSwf.tags[i].raw.equals(inputSwf.tags[i].raw)) {
      assert.equal(compiledSwf.tags[i].code, 82, 'Non-ABC tag changed at ' + i);
      changedIndices.push(i);
    }
  }
  assert.equal(changedIndices.length, 1, 'Expected exactly 1 changed ABC tag for ' + classPath + ', got ' + changedIndices.length);
  return {tag: compiledSwf.tags[changedIndices[0]], index: changedIndices[0]};
}

fs.rmSync(outDir, {recursive: true, force: true});
fs.mkdirSync(outDir, {recursive: true});

const writtenFiles = [];
function writeOut(relPath, content) {
  const full = path.join(outDir, relPath);
  fs.mkdirSync(path.dirname(full), {recursive: true});
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  fs.writeFileSync(full, buf);
  writtenFiles.push({path: relPath, sha256: sha(buf), bytes: buf.length});
}

console.log('=== Step 1: Build NieoCore.swf ===');
const preUnivCorePath = path.join(repoRoot, 'outputs/original-universe-20261027/baseline/client/assets/dll/NieoCore.swf');
const preGenshinCorePath = path.join(repoRoot, 'outputs/picturebook-sources-20261101/release/client/assets/dll/NieoCore.swf');
const latestCorePath = path.join(repoRoot, 'outputs/spt-boss-cutover-20261102/release-package/client/assets/dll/NieoCore.swf');

const coreSwf = parseSwf(fs.readFileSync(preUnivCorePath));
const preGenshinSwf = parseSwf(fs.readFileSync(preGenshinCorePath));
const latestSwf = parseSwf(fs.readFileSync(latestCorePath));

// 1a. Insert MapProcess_677 after MapProcess_340
const mp677Tag = latestSwf.tags.find(t => t.name === 'com/robot/app/mapProcess/MapProcess_677');
assert.ok(mp677Tag, 'Missing MapProcess_677 in latest Core');
const mp340Idx = coreSwf.tags.findIndex(t => t.name === 'com/robot/app/mapProcess/MapProcess_340');
assert.ok(mp340Idx >= 0, 'Missing MapProcess_340 in PreUniv Core');
coreSwf.tags.splice(mp340Idx + 1, 0, mp677Tag);

// 1b. Replace classic QoL/fix ABC tags from latest Core
const keepFromLatestAbc = [
  'com/robot/app/mapProcess/MapProcess_460',
  'com/robot/app/mapProcess/MapProcess_5',
  'com/robot/core/controller/MouseController',
  'com/robot/core/mode/OgreModel',
  'com/robot/app/fightNote/FightInviteManager',
  'com/robot/app/fightLevel/FightMHTController'
];
for (const abcName of keepFromLatestAbc) {
  const newTag = latestSwf.tags.find(t => t.name === abcName);
  assert.ok(newTag, 'Missing ' + abcName + ' in latest Core');
  const idx = coreSwf.tags.findIndex(t => t.name === abcName);
  assert.ok(idx >= 0, 'Missing ' + abcName + ' in PreUniv Core');
  coreSwf.tags[idx] = newTag;
}

// 1c. Compile clean TaskMain (no top-right DailySign or PetCollection icon)
const compiledTaskMain = ffdecCompileClass(
  preUnivCorePath,
  'com/robot/app/task/TaskMain',
  path.join(worktreeRoot, 'compat/client-patches/handbook-polish/TaskMain.as'),
  path.join(outDir, '_compiler/taskmain')
);
const taskMainIdx = coreSwf.tags.findIndex(t => t.name === 'com/robot/app/task/TaskMain');
assert.ok(taskMainIdx >= 0, 'Missing TaskMain in Core');
coreSwf.tags[taskMainIdx] = compiledTaskMain.tag;

// 1d. Update XML binary tags in NieoCore.swf
// MapConfig_xmlCls: add Map 677
replaceBinaryXml(coreSwf, 'com.robot.core.manager.map.config.MapConfig_xmlCls', xml => {
  assert.ok(!xml.includes('id="677"'), 'Map 677 already in PreUniv MapConfig');
  return xml.replace('</Maps>', '\t<map id="677" name="希尔星" x="480" y="320" sound="BGM_097"/>\n</Maps>');
});

// MapXMLInfo_xmlClass: 460 door_2 695 -> 462
replaceBinaryXml(coreSwf, 'com.robot.core.config.xml.MapXMLInfo_xmlClass', xml => {
  assert.equal(xml.split('targetID="695"').length, 2, 'Expected one 695 door in MapXMLInfo');
  return xml.replace('<component name="door_2" hit="hit_2" targetID="695" />', '<component name="door_2" hit="hit_2" targetID="462" />');
});

// MapIntroXMLInfo_xmlClass: use PreGenshin's (has 10 Rogue Galaxy planet tips, no 9700..9708)
const preGenshinMapIntroId = symbolId(preGenshinSwf, 'com.robot.core.config.xml.MapIntroXMLInfo_xmlClass');
const preGenshinMapIntroXml = preGenshinSwf.tags.find(t => t.code === 87 && t.payload.readUInt16LE(0) === preGenshinMapIntroId).payload.subarray(6).toString('utf8');
assert.ok(!preGenshinMapIntroXml.includes('9700') && preGenshinMapIntroXml.includes('id="481"'), 'Unexpected PreGenshin MapIntroXML');
replaceBinaryXml(coreSwf, 'com.robot.core.config.xml.MapIntroXMLInfo_xmlClass', () => preGenshinMapIntroXml);

// SkillXMLInfo_xmlClass: take latest (has classic boss skills) and strip 50001..50026
const latestSkillXmlId = symbolId(latestSwf, 'com.robot.core.config.xml.SkillXMLInfo_xmlClass');
const latestSkillXml = latestSwf.tags.find(t => t.code === 87 && t.payload.readUInt16LE(0) === latestSkillXmlId).payload.subarray(6).toString('utf8');
replaceBinaryXml(coreSwf, 'com.robot.core.config.xml.SkillXMLInfo_xmlClass', () => {
  return latestSkillXml.replace(/^\s*<(?:Move|Skill)\b[^>]*\bID="(500(?:0[1-9]|1\d|2[0-6]))"[^>]*\/>\r?\n?/gm, '');
});

const stripExtendedMonsters = xml => xml
  .replace(/^\s*<Monster\b[^>]*\bID="(\d+)"[^>]*\/>\r?\n?/gm, (m, id) => EXTENDED_SPECIES.has(Number(id)) ? '' : m)
  .replace(/^\s*<Monster\b(?![^>]*\/>)[^>]*\bID="(\d+)"[^>]*>(?:(?!<Monster\b)[\s\S])*?<\/Monster>\r?\n?/gm, (m, id) => EXTENDED_SPECIES.has(Number(id)) ? '' : m);

// PetXMLInfo_xmlClass: strip 20 extended species if any
replaceBinaryXml(coreSwf, 'com.robot.core.config.xml.PetXMLInfo_xmlClass', stripExtendedMonsters);

const finalCoreBytes = encodeSwf(coreSwf, coreSwf.tags.map(t => t.raw));
// Verify finalCoreBytes
const checkCore = parseSwf(finalCoreBytes);
assert.ok(!checkCore.tags.some(t => t.name && t.name.includes('Universe')), 'Core still has Universe classes');
assert.ok(checkCore.tags.some(t => t.name === 'com/robot/app/mapProcess/MapProcess_677'), 'Core missing MapProcess_677');
writeOut('client/assets/dll/NieoCore.swf', finalCoreBytes);
writeOut('client/overlay/dll/NieoCore.swf', finalCoreBytes);

console.log('=== Step 2: Build SptPanel.swf & PetCountermarkBookPanel.swf & PetFightDLL.swf ===');
const baseSptPath = path.join(repoRoot, 'work/client-lab/assets/module/com/robot/module/app/SptPanel.swf');
const baseSptSwf = parseSwf(fs.readFileSync(baseSptPath));
const compiledSptTag = ffdecCompileClass(
  baseSptPath,
  'com/robot/module/app/SptPanel',
  path.join(worktreeRoot, 'compat/client-patches/spt-all-bosses/SptPanel.as'),
  path.join(outDir, '_compiler/spt'),
  checkCore.tags.filter(t => t.code === 82)
);
const finalSptBytes = encodeSwf(baseSptSwf, baseSptSwf.tags.map((t, i) => i === compiledSptTag.index ? compiledSptTag.tag.raw : t.raw));
writeOut('client/assets/module/com/robot/module/app/SptPanel.swf', finalSptBytes);

const baseCountermarkPath = path.join(repoRoot, 'outputs/living-world-20261101/baseline/PetCountermarkBookPanel.swf');
const baseCountermarkSwf = parseSwf(fs.readFileSync(baseCountermarkPath));
const compiledCountermarkTag = ffdecCompileClass(
  baseCountermarkPath,
  'com/robot/module/book/PetCountermarkBookPanel',
  path.join(worktreeRoot, 'compat/client-patches/countermark/PetCountermarkBookPanel.as'),
  path.join(outDir, '_compiler/countermark'),
  checkCore.tags.filter(t => t.code === 82)
);
const finalCountermarkBytes = encodeSwf(baseCountermarkSwf, baseCountermarkSwf.tags.map((t, i) => i === compiledCountermarkTag.index ? compiledCountermarkTag.tag.raw : t.raw));
writeOut('client/overlay/module/com/robot/module/book/PetCountermarkBookPanel.swf', finalCountermarkBytes);

// PetFightDLL.swf: take input-battle baseline (no UniverseBossHUD) + AssetsLoadManager from latest
const baseFightSwf = parseSwf(fs.readFileSync(path.join(repoRoot, 'outputs/input-battle-20261101/baseline/PetFightDLL.swf')));
const latestFightSwf = parseSwf(fs.readFileSync(path.join(repoRoot, 'outputs/spt-boss-cutover-20261102/release-package/client/overlay/resource/module/PetFightDLL.swf')));
const assetsLoadTag = latestFightSwf.tags.find(t => t.name === 'com/robot/petFightModule/assetManager/AssetsLoadManager');
assert.ok(assetsLoadTag, 'Missing AssetsLoadManager in latest PetFightDLL');
const finalFightBytes = encodeSwf(baseFightSwf, baseFightSwf.tags.map(t => t.name === 'com/robot/petFightModule/assetManager/AssetsLoadManager' ? assetsLoadTag.raw : t.raw));
writeOut('client/assets/resource/module/PetFightDLL.swf', finalFightBytes);
writeOut('client/overlay/resource/module/PetFightDLL.swf', finalFightBytes);

console.log('=== Step 3: Restore Classic Flash UI SWFs ===');
writeOut('client/assets/resource/worldMap.swf', fs.readFileSync(path.join(repoRoot, 'work/client-lab/live-assets/worldMap.swf')));
writeOut('client/overlay/module/com/robot/module/app/subMap/Galaxy_1.swf', fs.readFileSync(path.join(repoRoot, 'outputs/original-universe-20261027/additional-baseline/Galaxy_1.swf')));
writeOut('client/assets/module/com/robot/module/app/PetCollectBoundsPanel.swf', fs.readFileSync(path.join(repoRoot, 'outputs/collect-plans-20261101/baseline/client/assets/module/com/robot/module/app/PetCollectBoundsPanel.swf')));
const classicStorageBytes = fs.readFileSync(path.join(repoRoot, 'outputs/remaining-ui-20261102/baseline/PetStorage.swf'));
writeOut('client/assets/module/com/robot/module/app/PetStorage.swf', classicStorageBytes);
writeOut('client/overlay/module/com/robot/module/app/PetStorage.swf', classicStorageBytes);
writeOut('client/assets/module/com/robot/module/book/PetAmalgamationBookPanel.swf', fs.readFileSync(path.join(repoRoot, 'work/client-lab/assets/module/com/robot/module/book/PetAmalgamationBookPanel.swf')));
writeOut('client/assets/resource/book/monsterBook.swf', fs.readFileSync(path.join(repoRoot, 'work/client-lab/assets/resource/book/monsterBook.swf')));
writeOut('client/overlay/module/com/robot/module/app/MoleculePanel.swf', fs.readFileSync(path.join(repoRoot, 'outputs/original-universe-20261027/baseline/client/overlay/module/com/robot/module/app/MoleculePanel.swf')));
writeOut('client/assets/module/com/robot/module/app/FightExchangePanel.swf', fs.readFileSync(path.join(repoRoot, 'work/client-lab/assets/module/com/robot/module/app/FightExchangePanel.swf')));

console.log('=== Step 4: Build Clean Server Configs & Runtime ===');
// 4a. universe.json (disabled)
writeOut('app/config/data/json/universe.json', JSON.stringify({publishable: false, scenes: [], encounters: []}, null, 2) + '\n');

// 4b. boss_abilities.json (109 classic bosses, R84 mechanics, no 97xx, no 1633, no filler rewardPetIds)
const baseBosses = JSON.parse(fs.readFileSync(path.join(repoRoot, 'outputs/collect-plans-20261101/baseline/app/config/data/json/boss_abilities.json'), 'utf8'));
baseBosses.bossConfigs = baseBosses.bossConfigs.filter(b => (b.mapId < 9700 || b.mapId === 9507) && !EXTENDED_SPECIES.has(b.petId));
assert.equal(baseBosses.bossConfigs.length, 109, 'Expected 109 classic bosses');
writeOut('app/config/data/json/boss_abilities.json', JSON.stringify(baseBosses, null, 2) + '\n');

// 4c. map-ogres.json (139 classic maps, no 97xx, no 932, no extended species)
const baseOgres = JSON.parse(fs.readFileSync(path.join(repoRoot, 'outputs/pet-source-restoration-20261101/app/config/data/json/map-ogres.json'), 'utf8'));
for (const key of Object.keys(baseOgres.maps)) {
  const mapId = Number(key);
  if ((mapId >= 9700 && mapId <= 9794) || mapId === 932) {
    delete baseOgres.maps[key];
  } else if (Array.isArray(baseOgres.maps[key].ogres)) {
    baseOgres.maps[key].ogres = baseOgres.maps[key].ogres.filter(o => !EXTENDED_SPECIES.has(o.petId));
  }
}
assert.equal(Object.keys(baseOgres.maps).length, 139, 'Expected 139 classic maps in map-ogres.json');
writeOut('app/config/data/json/map-ogres.json', JSON.stringify(baseOgres, null, 2) + '\n');

// 4d. pets.xml, spt.xml, skills.xml, items.xml
const preUnivXmlDir = path.join(repoRoot, 'outputs/original-universe-20261027/baseline/app/config/data/xml');
const cleanPetsXml = stripExtendedMonsters(fs.readFileSync(path.join(preUnivXmlDir, 'pets.xml'), 'utf8'));
const cleanSptXml = stripExtendedMonsters(fs.readFileSync(path.join(preUnivXmlDir, 'spt.xml'), 'utf8'));
for (const id of EXTENDED_SPECIES) {
  assert.ok(!cleanPetsXml.includes(`ID="${id}"`), 'pets.xml still contains ' + id);
  assert.ok(!cleanSptXml.includes(`ID="${id}"`), 'spt.xml still contains ' + id);
}
writeOut('app/config/data/xml/pets.xml', cleanPetsXml);
writeOut('app/config/data/xml/spt.xml', cleanSptXml);

const runtimeSkillsXml = fs.readFileSync(path.join(repoRoot, 'outputs/collect-and-map-hotfix-20261102/runtime/config/data/xml/skills.xml'), 'utf8');
const cleanSkillsXml = runtimeSkillsXml.replace(/^\s*<(?:Move|Skill)\b[^>]*\bID="(500(?:0[1-9]|1\d|2[0-6]))"[^>]*\/>\r?\n?/gm, '');
for (const id of CUSTOM_SKILLS) assert.ok(!cleanSkillsXml.includes(`ID="${id}"`), 'skills.xml still contains ' + id);
writeOut('app/config/data/xml/skills.xml', cleanSkillsXml);

const cleanItemsXml = fs.readFileSync(path.join(preUnivXmlDir, 'items.xml'), 'utf8');
for (const id of CUSTOM_ESSENCES) assert.ok(!cleanItemsXml.includes(`ID="${id}"`), 'items.xml still contains ' + id);
assert.ok(cleanItemsXml.includes('ID="400417"') && cleanItemsXml.includes('ID="400161"'), 'items.xml missing Alder or Kenped essence');
writeOut('app/config/data/xml/items.xml', cleanItemsXml);

// 4e. PetCollectHandler.js (remove CollectPlans & DailySign, keep Countermarks, BeidouSeals, and classic CollectReward 1..5,301)
const hotfixCollectHandler = fs.readFileSync(path.join(repoRoot, 'outputs/collect-and-map-hotfix-20261102/runtime/dist/GameServer/Server/Packet/Recv/Pet/PetCollectHandler.js'), 'utf8');
const cleanCollectHandler = hotfixCollectHandler
  .replace('const CollectPlans_1 = require("../../../../Game/Pet/CollectPlans");\n', '')
  .replace('        if (groupId === 900001)\n            return require("../../../../Game/Pet/DailySign").HandleSignInStatus(player);\n', '')
  .replace('const flag = (CollectReward_1.COLLECT_GROUPS[groupId] || CollectPlans_1.GetPlan(groupId)) && await claimed(player.Uid, groupId) ? 1 : 0;', 'const flag = CollectReward_1.COLLECT_GROUPS[groupId] && await claimed(player.Uid, groupId) ? 1 : 0;')
  .replace('        if (body.length >= 4 && body.readUInt32BE(0) === 900004)\n            return CollectPlans_1.HandleList(player);\n', '')
  .replace('        if (CollectPlans_1.GetPlan(groupId))\n            return CollectPlans_1.HandleClaim(player, groupId, rewardId);\n        if (groupId === 900001) return require("../../../../Game/Pet/DailySign").HandleSignIn(player, rewardId);\n', '');
assert.ok(!cleanCollectHandler.includes('CollectPlans') && !cleanCollectHandler.includes('DailySign'), 'PetCollectHandler still references CollectPlans or DailySign');
writeOut('app/dist/GameServer/Server/Packet/Recv/Pet/PetCollectHandler.js', cleanCollectHandler);

// 4f. Battle engine files (restore pre-SPTBossRules R84+Alder+Puni battle engine + 8004 popup + medicine lock release)
const popupRuntimeBattle = path.join(repoRoot, 'outputs/spt-pet-popup-20261102/runtime/app/dist/GameServer/Game/Battle');
for (const name of [
  'BossSpecialRules.js',
  'BattleConverter.js',
  'BattleEffectIntegration.js',
  'BattleTurnExecutor.js',
  'SkillEffectRuntime.js',
  'UniverseBossBiomes.js',
  'UniverseBossFrontier.js',
  'UniverseBossRules.js',
  'UniverseBossSegments.js'
]) {
  writeOut('app/dist/GameServer/Game/Battle/' + name, fs.readFileSync(path.join(popupRuntimeBattle, name)));
}

// UniverseBossBudget.js: disable completely
let budgetJs = fs.readFileSync(path.join(popupRuntimeBattle, 'UniverseBossBudget.js'), 'utf8');
budgetJs = budgetJs
  .replace('function enabled(battle, pet) { return !!battle?.universeBoss && (!pet || pet === battle.enemy); }', 'function enabled(_battle, _pet) { return false; }')
  .replace('module.exports = {beginTurn,', 'module.exports = {enabled, beginTurn,');
assert.ok(budgetJs.includes('function enabled(_battle, _pet) { return false; }') && budgetJs.includes('module.exports = {enabled,'), 'Failed to disable UniverseBossBudget');
writeOut('app/dist/GameServer/Game/Battle/UniverseBossBudget.js', budgetJs);

// BattleRewardService.js & BattleManager.js (from spt-pet-popup final + medicine lock release)
writeOut(
  'app/dist/GameServer/Game/Battle/services/BattleRewardService.js',
  fs.readFileSync(path.join(repoRoot, 'outputs/spt-pet-popup-20261102/final/app/dist/GameServer/Game/Battle/services/BattleRewardService.js'))
);
writeOut(
  'app/dist/GameServer/Game/Battle/BattleManager.js',
  fs.readFileSync(path.join(repoRoot, 'outputs/spt-pet-popup-20261102/final/app/dist/GameServer/Game/Battle/BattleManager.js'))
);
writeOut(
  'app/dist/GameServer/Game/Map/MapSpawnManager.js',
  fs.readFileSync(path.join(repoRoot, 'outputs/spt-pet-popup-20261102/runtime/app/dist/GameServer/Game/Map/MapSpawnManager.js'))
);

// PetManager.js: ensure bag and default pet are always normalized on login after cleanup
let petManagerJs = fs.readFileSync(path.join(repoRoot, 'outputs/spt-pet-popup-20261102/runtime/app/dist/GameServer/Game/Pet/PetManager.js'), 'utf8');
petManagerJs = petManagerJs.replace(
  '    const release = await this.PetData.AcquireMutation();\n    try {\n',
  `    const release = await this.PetData.AcquireMutation();
    try {
      if (this.PetData.PetList.length > 0 && !this.PetData.PetList.some(p => p.isInBag)) {
        const candidate = JSON.parse(JSON.stringify(this.PetData.PetList[0]));
        candidate.isInBag = true;
        candidate.isDefault = true;
        await this.PetData.CommitPetUpdate(this.PetData.PetList[0], candidate);
      } else if (this.PetData.PetList.some(p => p.isInBag) && !this.PetData.PetList.some(p => p.isInBag && p.isDefault)) {
        const firstBag = this.PetData.PetList.find(p => p.isInBag);
        const candidate = JSON.parse(JSON.stringify(firstBag));
        candidate.isDefault = true;
        await this.PetData.CommitPetUpdate(firstBag, candidate);
      }
`
);
assert.ok(petManagerJs.includes('!this.PetData.PetList.some(p => p.isInBag && p.isDefault)'), 'Failed to patch PetManager.js');
writeOut('app/dist/GameServer/Game/Pet/PetManager.js', petManagerJs);

// 4g. Database Migration 032: Clean up extended species, universe tables, filler claims, and 97xx map positions
const extListSql = [...EXTENDED_SPECIES].join(',');
const essListSql = [...CUSTOM_ESSENCES].join(',');
const migration032 = `'use strict';

class Migration032ClassicCleanup {
    constructor() {
        this.version = 32;
        this.name = 'classic_cleanup';
        this.atomicSQLite = true;
    }
    statements() {
        return [
            \`UPDATE player_pets SET pet_list = COALESCE(
                (SELECT json_group_array(json(value)) FROM json_each(player_pets.pet_list)
                 WHERE CAST(json_extract(value, '$.petId') AS INTEGER) NOT IN (${extListSql})),
                '[]'
            ) WHERE pet_list IS NOT NULL AND json_valid(pet_list)\`,
            'DELETE FROM player_pet_collection WHERE pet_id IN (${extListSql})',
            \`UPDATE player_items SET item_list = COALESCE(
                (SELECT json_group_array(json(value)) FROM json_each(player_items.item_list)
                 WHERE CAST(json_extract(value, '$.itemId') AS INTEGER) NOT IN (${essListSql})),
                '[]'
            ) WHERE item_list IS NOT NULL AND json_valid(item_list)\`,
            'DELETE FROM player_essence_hatches WHERE item_id IN (${essListSql}) OR pet_id IN (${extListSql})',
            'DELETE FROM universe_accounts',
            'DELETE FROM universe_discovery',
            'DELETE FROM universe_discovery_imports',
            'DELETE FROM universe_progress',
            'DELETE FROM universe_events',
            'DELETE FROM universe_surveys',
            'DELETE FROM universe_captures',
            'CREATE TABLE IF NOT EXISTS player_collect_claims (owner_id INTEGER NOT NULL, group_id INTEGER NOT NULL, PRIMARY KEY (owner_id, group_id))',
            'DELETE FROM player_collect_claims WHERE group_id NOT IN (1, 2, 3, 4, 5, 301)',
            "DELETE FROM receiver_claims WHERE reward_key LIKE 'signin:pet%'",
            'UPDATE players SET map_id = 5, pos_x = 480, pos_y = 320 WHERE (map_id >= 9700 AND map_id <= 9794) OR map_id = 932'
        ];
    }
    upSQLite() { return this.statements(); }
    upMySQL() { return this.statements(); }
    downSQLite() { return []; }
    downMySQL() { return []; }
}

module.exports = { Migration032ClassicCleanup };
`;
writeOut('app/dist/DataBase/migrations/scripts/032_classic_cleanup.js', migration032);

let migRunner = fs.readFileSync(path.join(repoRoot, 'outputs/collect-and-map-hotfix-20261102/runtime/dist/DataBase/migrations/MigrationRunner.js'), 'utf8');
migRunner = migRunner.replace(
  'const { Migration031AddAlderProgress } = require("./scripts/031_add_alder_progress");\n',
  'const { Migration031AddAlderProgress } = require("./scripts/031_add_alder_progress");\nconst { Migration032ClassicCleanup } = require("./scripts/032_classic_cleanup");\n'
);
migRunner = migRunner.replace(
  '  new Migration031AddAlderProgress(),\n',
  '  new Migration031AddAlderProgress(),\n  new Migration032ClassicCleanup(),\n'
);
assert.ok(migRunner.includes('new Migration032ClassicCleanup()'), 'Failed to register Migration032ClassicCleanup');
writeOut('app/dist/DataBase/migrations/MigrationRunner.js', migRunner);

// Remove temporary compiler directory before writing manifest
fs.rmSync(path.join(outDir, '_compiler'), {recursive: true, force: true});

const deletePaths = [
  'app/config/data/json/collect-plans.json',
  'app/config/data/json/daily-sign.json',
  'app/dist/GameServer/Game/Pet/CollectPlans.js',
  'app/dist/GameServer/Game/Pet/DailySign.js',
  'app/dist/GameServer/Game/Battle/SPTBossRules.js',
  'app/dist/GameServer/Game/Battle/SPTTeamBattle.js',
  'client/overlay/resource/worldMap.swf',
  'client/overlay/module/com/robot/module/app/subMap/Galaxy_6.swf',
  'client/assets/module/com/robot/module/app/subMap/Galaxy_6.swf',
  'client/overlay/module/com/robot/module/app/SptPanel.swf',
  'client/overlay/module/com/robot/module/app/PetCollectBoundsPanel.swf',
  'client/overlay/module/com/robot/module/book/PetAmalgamationBookPanel.swf',
  'client/overlay/resource/book/monsterBook.swf',
  'client/overlay/resource/book/petCollection.swf',
  'client/overlay/resource/module/com/robot/module/app/FightExchangePanel.swf',
  'client/overlay/module/com/robot/module/app/FightExchangePanel.swf',
  ...Array.from({length: 95}, (_, i) => `client/overlay/resource/map/${9700 + i}.swf`),
  ...[...EXTENDED_SPECIES].map(id => `client/overlay/resource/fightResource/pet/swf/${id}.swf`),
  ...[...EXTENDED_SPECIES].filter(id => id !== 1633).map(id => `client/overlay/resource/groupFightResource/pet/${id}.swf`),
  ...[...EXTENDED_SPECIES].map(id => `client/overlay/resource/pet/head/${id}.swf`),
  ...[...CUSTOM_SKILLS].map(id => `client/overlay/resource/fightResource/skill/swf/${id}.swf`),
  ...[...CUSTOM_ESSENCES].map(id => `client/overlay/resource/item/doodle/icon/${id}.swf`)
];

const manifest = {
  release: 'classic-cleanup-20261118',
  generatedAt: new Date().toISOString(),
  writtenFiles,
  deletePaths
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('=== Build Complete ===');
console.log('Written files:', writtenFiles.length, 'Delete paths:', deletePaths.length);
