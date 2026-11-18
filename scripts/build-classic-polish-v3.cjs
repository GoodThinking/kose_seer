'use strict';
/**
 * 赛尔号怀旧服经典还原第三阶段构建器 (build-classic-polish-v3.cjs)
 *
 * 1. 全地图野怪净化与五系等级梯度重排 (map-ogres.json)：
 *    - 清理所有地图中乱塞的二阶/三阶进化形态（全部还原为一阶初始形态）与错位/暗金精灵（1192 巨蘑怪、1072 莫德、1487 霍迪斯、461 阿尔克、1401 萨里、1462 拉可尼、652 诺拉德、1237 洛拉托兹、1143 鲁迪诺斯、1267 瑞姆、432 杰西卡、1460 暗金杰西卡、1396 查尔、932 马尔洛、1463 尼可拉），并将第五星系雾气石林(717)的比比鼠还原为 1135 沃沃尔。
 *    - 重排五大星系初始野怪等级带，所有初始野怪最高等级严格控制在进化等级（EvolvingLv - 1）以内，杜绝 95~100 级一阶幼体，保证任何捕捉到的野生精灵均可正常升级触发一阶→二阶→三阶完整进化。
 * 2. 精灵学院（Map 485）与训练室（Map 488~493 / 470~475）「刷学习力 + 按属性与阶段等级刷经验」一体化：
 *    - 编译注入 TrainData / TrainItemPanel / TrainGradePanel / TrainControl / MapProcess_485 / MapProcess_102 / NonoShortcut 到 NieoCore.swf。
 *    - 在 boss_abilities.json 中补齐 12 间学习力训练室（488~493 初级、470~475 高级，param2=0..4）以及 16 大属性 × 5 个阶段等级（Lv.20/40/60/80/100，param2=111..265）专属经验陪练配置。
 *    - 更新 BattleRewardService.js 与 PetManager.js：学习力训练室单场产出 +5（初级）/ +10~12（高级）对应单项学习力；经验特训按阶段产出 1,800 ~ 42,000 基础经验并附赠 50% 经验池，同时标记 noEvGain=true 确保刷经验不污染学习力。
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../../..');
const worktreeRoot = path.resolve(__dirname, '..');
const prevDir = path.join(repoRoot, 'outputs/classic-polish-v2-20261118/build');
const outDir = path.join(repoRoot, 'outputs/classic-polish-v3-20261118/build');
const javaBin = path.join(repoRoot, 'work/client-lab/tools/jre/jdk-21.0.12.1+1-jre/Contents/Home/bin/java');
const ffdecJar = path.join(repoRoot, 'work/client-lab/tools/ffdec/ffdec.jar');

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

function compileScriptsIntoSwf(baseSwfBytes, scriptMap, workSubdir) {
  const workDir = path.join('/tmp/classic-polish-v3-swf', workSubdir);
  fs.rmSync(workDir, {recursive: true, force: true});
  const importDir = path.join(workDir, 'import');
  const ffdecHome = '/tmp/ffdec-home';
  const flashLibDir = path.join(ffdecHome, '.FFDec/flashlib');
  fs.mkdirSync(flashLibDir, {recursive: true});
  const playerglobalSrc = path.join(repoRoot, 'work/client-lab/tools/ffdec/flashlib/playerglobal32_0.swc');
  const playerglobalDst = path.join(flashLibDir, 'playerglobal32_0.swc');
  if (!fs.existsSync(playerglobalDst)) {
    fs.copyFileSync(playerglobalSrc, playerglobalDst);
  }
  for (const [relClassPath, sourceContent] of Object.entries(scriptMap)) {
    const file = path.join(importDir, 'scripts', relClassPath + '.as');
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, sourceContent, 'utf8');
  }
  const inputSwf = path.join(workDir, 'input.swf');
  const outputSwf = path.join(workDir, 'output.swf');
  fs.writeFileSync(inputSwf, baseSwfBytes);
  execFileSync(
    javaBin,
    ['-Duser.home=' + ffdecHome, '-Djava.awt.headless=true', '-Xmx2g', '-jar', ffdecJar, '-onerror', 'abort', '-importScript', inputSwf, outputSwf, importDir],
    {stdio: 'inherit', timeout: 300000}
  );
  const orig = parseSwf(baseSwfBytes);
  const comp = parseSwf(fs.readFileSync(outputSwf));
  assert.equal(comp.tags.length, orig.tags.length, 'Tag count changed during FFDec import');
  const allowed = new Set(Object.keys(scriptMap));
  let replaced = 0;
  orig.tags = orig.tags.map((oldTag, idx) => {
    if (oldTag.code !== 82) return oldTag;
    const newTag = comp.tags[idx];
    if (allowed.has(oldTag.name)) {
      assert.equal(oldTag.name, newTag.name, 'DoABC tag name mismatch');
      replaced++;
      return newTag;
    }
    return oldTag;
  });
  assert.equal(replaced, allowed.size, `Expected ${allowed.size} replaced DoABC tags, got ${replaced}`);
  return encodeSwf(orig, orig.tags.map(t => t.raw));
}

console.log('1. 复制 classic-polish-v2-20261118 构建产物到 classic-polish-v3-20261118...');
fs.rmSync(outDir, {recursive: true, force: true});
fs.cpSync(prevDir, outDir, {recursive: true});

// 解析 pets.xml 获取进化链与名称
const petsXml = fs.readFileSync(path.join(outDir, 'app/config/data/xml/pets.xml'), 'utf8');
const petInfo = new Map();
for (const m of petsXml.matchAll(/<Monster\s+([^>]+)>/g)) {
  const a = m[1];
  const id = Number((a.match(/\bID="(\d+)"/) || [])[1]);
  const name = (a.match(/\bDefName="([^"]+)"/) || [])[1] || '';
  const type = Number((a.match(/\bType="(\d+)"/) || [])[1] || 1);
  const evolvesFrom = Number((a.match(/\bEvolvesFrom="(\d+)"/) || [])[1] || 0);
  const evolvesTo = Number((a.match(/\bEvolvesTo="(\d+)"/) || [])[1] || 0);
  const evolvingLv = Number((a.match(/\bEvolvingLv="(\d+)"/) || [])[1] || 0);
  if (id && !petInfo.has(id)) {
    petInfo.set(id, {id, name, type, evolvesFrom, evolvesTo, evolvingLv});
  }
}

function getBaseId(id) {
  let cur = id, guard = 0;
  while (petInfo.get(cur)?.evolvesFrom > 0 && guard++ < 5) {
    cur = petInfo.get(cur).evolvesFrom;
  }
  return cur;
}

console.log('2. 净化全地图野怪（仅保留一阶初始形态、清理错位/暗金怪、重排五系等级带）...');
const mapOgresPath = path.join(outDir, 'app/config/data/json/map-ogres.json');
const mapOgres = JSON.parse(fs.readFileSync(mapOgresPath, 'utf8'));

// 各张地图明确移除的乱塞错位/暗金/跨期怪
const MAP_REMOVE_PETS = {
  '11': new Set([1192]),
  '21': new Set([1072]),
  '25': new Set([1487]),
  '26': new Set([461, 1401]),
  '30': new Set([1462]),
  '47': new Set([652]),
  '55': new Set([1237]),
  '57': new Set([1143, 1267]),
  '58': new Set([432, 1460, 1396]),
  '60': new Set([932]),
  '61': new Set([1463]),
};
// 地图内整体替换（雾气石林的新手比比鼠换成螺旋星系一阶沃沃尔）
const MAP_REPLACE_PETS = {'717': {13: 1135}};
// 组队野怪、不可捕捉剧情怪、靓号与梦境活动图保持原样
const KEEP_AS_IS_MAPS = new Set(['337', '343', '495', '673', '679']);

// 五大星系等级带（用户确认）：帕诺 2~25、卡兰 25~40、罗格 35~50、裂空 45~60、螺旋 55~70
const GALAXY_BANDS = {1: [2, 25], 2: [25, 40], 3: [35, 50], 4: [45, 60], 5: [55, 70]};
// Core MapXMLInfo.super -> SuperMapXMLInfo.galaxy 只登记了前三星系；裂空/螺旋星球与无 super 的场景按星球归属补齐
const SUPER_GALAXY = {439: 4, 441: 4, 459: 4, 481: 4, 484: 4, 494: 4, 497: 4, 29: 5, 702: 5};
const MAP_GALAXY = {
  51: 1, 323: 1, 329: 2,
  356: 3, 400: 3, 432: 3, 434: 3,
  451: 4, 453: 4, 454: 4, 455: 4, 667: 4, 669: 4, 670: 4, 671: 4,
  691: 5, 692: 5, 694: 5, 696: 5, 717: 5, 721: 5, 725: 5, 731: 5, 732: 5, 736: 5,
  744: 5, 748: 5, 750: 5, 759: 5, 782: 5, 787: 5, 793: 5, 797: 5,
};

const coreForXml = parseSwf(fs.readFileSync(path.join(outDir, 'client/overlay/dll/NieoCore.swf')));
function readBinaryXml(swf, symName) {
  const id = symbolId(swf, symName);
  const tag = swf.tags.find(t => t.code === 87 && t.payload.readUInt16LE(0) === id);
  assert.ok(tag, 'Missing binary tag for ' + symName);
  return tag.payload.subarray(6).toString('utf8');
}
const attr = (s, k) => (s.match(new RegExp('\\b' + k + '="([^"]*)"')) || [])[1];
const mapSuper = new Map();
for (const m of readBinaryXml(coreForXml, 'com.robot.core.config.xml.MapXMLInfo_xmlClass').matchAll(/<map ([^>]*)>/g)) {
  const id = Number(attr(m[1], 'id'));
  if (id && !mapSuper.has(id)) mapSuper.set(id, Number(attr(m[1], 'super') || 0));
}
const superGalaxy = new Map(Object.entries(SUPER_GALAXY).map(([k, v]) => [Number(k), v]));
for (const m of readBinaryXml(coreForXml, 'com.robot.core.config.xml.SuperMapXMLInfo_xmlClass').matchAll(/<maps ([^>]*)>/g)) {
  const g = Number(attr(m[1], 'galaxy') || 0);
  if (g) superGalaxy.set(Number(attr(m[1], 'id')), g);
}
function galaxyOf(mapNum) {
  return MAP_GALAXY[mapNum] || superGalaxy.get(mapSuper.get(mapNum)) || 0;
}

// 每星系按原等级先后排序，把 5 级宽的窗口线性铺在星系等级带内，保留由浅到深的探索顺序
const galaxyMaps = {1: [], 2: [], 3: [], 4: [], 5: []};
for (const [mapId, m] of Object.entries(mapOgres.maps)) {
  if (KEEP_AS_IS_MAPS.has(mapId) || !(m.ogres || []).length) continue;
  const g = galaxyOf(Number(mapId));
  assert.ok(g, `Map ${mapId} ${m.name} has spawns but no galaxy`);
  const oldMin = Math.min(...m.ogres.map(o => o.minLevel));
  galaxyMaps[g].push({mapId, oldMin});
}
const mapWindow = new Map();
for (const [g, list] of Object.entries(galaxyMaps)) {
  const [lo, hi] = GALAXY_BANDS[g];
  list.sort((a, b) => a.oldMin - b.oldMin || Number(a.mapId) - Number(b.mapId));
  list.forEach((item, rank) => {
    const start = list.length > 1 ? lo + Math.round(rank * (hi - lo - 5) / (list.length - 1)) : lo;
    mapWindow.set(item.mapId, {galaxy: Number(g), min: start, max: start + 5});
  });
}

let cleanedCount = 0;
for (const [mapId, m] of Object.entries(mapOgres.maps)) {
  if (KEEP_AS_IS_MAPS.has(mapId) || !(m.ogres || []).length) continue;
  const win = mapWindow.get(mapId);
  const removeSet = MAP_REMOVE_PETS[mapId] || new Set();
  const replace = MAP_REPLACE_PETS[mapId] || {};
  const nextOgres = [];
  for (const o of m.ogres) {
    assert.ok(!o.isBoss, `Unexpected boss ogre on map ${mapId}`);
    if (removeSet.has(o.petId)) { cleanedCount++; continue; }
    let targetPetId = getBaseId(o.petId);
    targetPetId = replace[targetPetId] || targetPetId;
    if (targetPetId !== o.petId) cleanedCount++;
    const dup = nextOgres.find(n => n.petId === targetPetId);
    if (dup) { dup.weight = Math.max(dup.weight || 1, o.weight || 1); continue; }
    const p = petInfo.get(targetPetId);
    assert.ok(p, `Missing pet ${targetPetId}`);
    const updated = {...o, slot: nextOgres.length, petId: targetPetId, petName: p.name, minLevel: win.min, maxLevel: win.max};
    delete updated.note;
    nextOgres.push(updated);
  }
  m.ogres = nextOgres;
}
for (const [mapId, m] of Object.entries(mapOgres.maps)) {
  if (KEEP_AS_IS_MAPS.has(mapId)) continue;
  for (const o of m.ogres || []) {
    assert.equal(petInfo.get(o.petId).evolvesFrom, 0, `Map ${mapId} still spawns evolved pet ${o.petId}`);
    assert.ok(o.maxLevel < 100 && o.minLevel >= 2, `Map ${mapId} level out of range`);
  }
}
fs.writeFileSync(mapOgresPath, JSON.stringify(mapOgres, null, 2) + '\n');
console.log(`   已净化/还原 ${cleanedCount} 处进化体或错位野怪；${mapWindow.size} 张野外图按五星系重排等级。`);


console.log('3. 构建精灵学院学习力训练室（488~493 / 470~475）与 16 属性 × 5 阶段经验特训配置...');
const bossAbilitiesPath = path.join(outDir, 'app/config/data/json/boss_abilities.json');
const bossAbilities = JSON.parse(fs.readFileSync(bossAbilitiesPath, 'utf8'));

const EV_ROOMS = {
  488: {pets: [10, 13, 33, 126, 164], level: 15, hp: 42, atk: 10, def: 16, spAtk: 10, spDef: 16, spd: 14, desc: '初级攻击学习力训练室'},
  489: {pets: [228, 330, 228, 330, 228], level: 15, hp: 42, atk: 10, def: 16, spAtk: 10, spDef: 16, spd: 14, desc: '初级防御学习力训练室'},
  490: {pets: [19, 62, 108, 158, 184], level: 15, hp: 42, atk: 10, def: 16, spAtk: 10, spDef: 16, spd: 14, desc: '初级特攻学习力训练室'},
  491: {pets: [232, 328, 232, 328, 232], level: 15, hp: 42, atk: 10, def: 16, spAtk: 10, spDef: 16, spd: 14, desc: '初级特防学习力训练室'},
  492: {pets: [22, 25, 43, 153, 319], level: 15, hp: 42, atk: 10, def: 16, spAtk: 10, spDef: 16, spd: 14, desc: '初级速度学习力训练室'},
  493: {pets: [56, 105, 456, 482, 111], level: 15, hp: 42, atk: 10, def: 16, spAtk: 10, spDef: 16, spd: 14, desc: '初级体力学习力训练室'},
  470: {pets: [12, 15, 29, 55, 73], level: 30, hp: 72, atk: 14, def: 22, spAtk: 14, spDef: 22, spd: 18, desc: '高级攻击学习力训练室'},
  471: {pets: [229, 331, 229, 331, 229], level: 30, hp: 72, atk: 14, def: 22, spAtk: 14, spDef: 22, spd: 18, desc: '高级防御学习力训练室'},
  472: {pets: [21, 37, 64, 79, 130], level: 30, hp: 72, atk: 14, def: 22, spAtk: 14, spDef: 22, spd: 18, desc: '高级特攻学习力训练室'},
  473: {pets: [234, 32, 234, 32, 234], level: 30, hp: 72, atk: 14, def: 22, spAtk: 14, spDef: 22, spd: 18, desc: '高级特防学习力训练室'},
  474: {pets: [24, 45, 155, 321, 321], level: 30, hp: 72, atk: 14, def: 22, spAtk: 14, spDef: 22, spd: 18, desc: '高级速度学习力训练室'},
  475: {pets: [58, 107, 458, 58, 458], level: 30, hp: 72, atk: 14, def: 22, spAtk: 14, spDef: 22, spd: 18, desc: '高级体力学习力训练室'},
};

const EXP_PETS = {
  1: [1, 2, 3],          // 草系：布布种子 -> 布布草 -> 布布花
  2: [4, 5, 6],          // 水系：伊优 -> 尤里安 -> 巴鲁斯
  3: [7, 8, 9],          // 火系：小火猴 -> 烈火猴 -> 烈焰猩猩
  4: [10, 11, 12],       // 飞行系：皮皮 -> 比波 -> 波克尔
  5: [13, 14, 15],       // 电系：比比鼠 -> 闪电鼠 -> 天雷鼠
  6: [71, 72, 73],       // 机械系：派派 -> 派鲁克 -> 派鲁基达
  7: [53, 54, 55],       // 地面系：莫比 -> 格格尔 -> 鲁加斯
  8: [119, 120, 121],    // 普通系：莱尼 -> 特鲁尼 -> 伊卡罗尼
  9: [65, 66, 67],       // 冰系：林克 -> 林斯奇 -> 布林克斯
  10: [77, 78, 79],      // 超能系：尼尔 -> 菲斯利 -> 艾斯菲亚
  11: [275, 276, 277],   // 战斗系：尹赫 -> 尹泰奇 -> 尹泰拉多
  12: [237, 238, 239],   // 光系：吉宝 -> 吉娜 -> 吉娜斯
  13: [128, 129, 130],   // 暗影系：波古 -> 吉拉 -> 吉古拉
  14: [313, 314, 315],   // 神秘系：卡鲁 -> 卡克拉 -> 卡鲁耶克
  15: [1326, 1327, 1328],// 龙系：兰迪 -> 兰特 -> 索兰特
  16: [1203, 1204, 1204],// 圣灵系：蒙塔 -> 迈尔斯（两段进化）
};
for (const [typeId, chain] of Object.entries(EXP_PETS)) {
  chain.forEach((petId, idx) => {
    const p = petInfo.get(petId);
    assert.ok(p && p.type === Number(typeId), `EXP_PETS ${typeId} stage ${idx} type mismatch: ${petId}`);
    if (idx > 0 && petId !== chain[idx - 1]) assert.equal(getBaseId(petId), getBaseId(chain[0]), `EXP_PETS ${typeId} chain broken at ${petId}`);
  });
}
// 客户端 TrainData.as 的陪练表必须与服务端一致
{
  const asSrc = fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/academy-train/TrainData.as'), 'utf8');
  const block = asSrc.slice(asSrc.indexOf('EXP_PETS:Array = ['), asSrc.indexOf('];', asSrc.indexOf('EXP_PETS:Array = [')));
  const rows = [...block.matchAll(/\[(\d+), (\d+), (\d+)\]/g)].map(r => [Number(r[1]), Number(r[2]), Number(r[3])]);
  assert.deepEqual(rows, Object.values(EXP_PETS), 'TrainData.as EXP_PETS differs from server table');
}

const TIER_SPECS = {
  1: {level: 20, stageIdx: 0, hp: 40, exp: 1800},
  2: {level: 40, stageIdx: 1, hp: 70, exp: 5400},
  3: {level: 60, stageIdx: 2, hp: 100, exp: 12000},
  4: {level: 80, stageIdx: 2, hp: 135, exp: 24000},
  5: {level: 100, stageIdx: 2, hp: 170, exp: 42000},
};

const ALL_TRAIN_MAPS = [485, 488, 489, 490, 491, 492, 493, 470, 471, 472, 473, 474, 475];
const trainMapSet = new Set(ALL_TRAIN_MAPS);
bossAbilities.bossConfigs = bossAbilities.bossConfigs.filter(b => !trainMapSet.has(Number(b.mapId)));

for (const [roomIdStr, cfg] of Object.entries(EV_ROOMS)) {
  const roomId = Number(roomIdStr);
  cfg.pets.forEach((petId, slotIdx) => {
    const p = petInfo.get(petId) || {name: '训练陪练', type: 8};
    bossAbilities.bossConfigs.push({
      mapId: roomId,
      param2: slotIdx,
      petId,
      petName: p.name,
      level: cfg.level,
      dv: 0,
      ev: 0,
      nature: 0,
      customHP: cfg.hp,
      skills: [10001],
      abilities: [],
      drops: [],
      rewards: {exp: cfg.level * 15, coins: cfg.level * 5},
      description: cfg.desc,
    });
  });
}

for (const roomId of ALL_TRAIN_MAPS) {
  for (let typeId = 1; typeId <= 16; typeId++) {
    for (let tierIdx = 1; tierIdx <= 5; tierIdx++) {
      const param2 = 100 + typeId * 10 + tierIdx;
      const spec = TIER_SPECS[tierIdx];
      const petId = EXP_PETS[typeId][spec.stageIdx];
      const p = petInfo.get(petId) || {name: '经验陪练', type: typeId};
      bossAbilities.bossConfigs.push({
        mapId: roomId,
        param2,
        petId,
        petName: p.name,
        level: spec.level,
        dv: 0,
        ev: 0,
        nature: 0,
        customHP: spec.hp,
        skills: [10001],
        abilities: [],
        drops: [],
        rewards: {exp: spec.exp, coins: spec.level * 5},
        description: `经验特训 Lv.${spec.level}`,
      });
    }
  }
}
fs.writeFileSync(bossAbilitiesPath, JSON.stringify(bossAbilities, null, 2) + '\n');

console.log('4. 更新服务端 BattleRewardService.js 与 PetManager.js（支持训练室定向学习力倍率与经验特训纯净经验）...');
const p1Dir = path.join(repoRoot, 'outputs/classic-cleanup-20261118/build');
const petMgrPath = path.join(outDir, 'app/dist/GameServer/Game/Pet/PetManager.js');
fs.mkdirSync(path.dirname(petMgrPath), {recursive: true});
let petMgrJs = fs.readFileSync(path.join(p1Dir, 'app/dist/GameServer/Game/Pet/PetManager.js'), 'utf8');
const evLine = 'const evChanged = defeatedPetId !== undefined && PetCalculator_1.PetCalculator.ApplyBattleEV(candidate, defeatedPetId, boost?.learningMultiplier ?? 1);';
assert.equal(petMgrJs.split(evLine).length, 2, 'Expected one evChanged line in PetManager.js');
petMgrJs = petMgrJs.replace(evLine,
  '// 学习力训练室只加本室单项；经验特训不加学习力。其余战斗按被击败精灵产出。\n' +
  '            const evChanged = defeatedPetId !== undefined && (boost?.fixedEv ? ApplyTrainingRoomEV(candidate, boost.fixedEv) : !boost?.noEvGain && PetCalculator_1.PetCalculator.ApplyBattleEV(candidate, defeatedPetId, boost?.learningMultiplier ?? 1));');
const classAnchor = 'class PetManager extends BaseManager_1.BaseManager {';
assert.equal(petMgrJs.split(classAnchor).length, 2, 'Expected PetManager class anchor');
petMgrJs = petMgrJs.replace(classAnchor, `/** 学习力训练室定向加点：单项不超过 255、总和不超过 510，截断部分不转移。 */
function ApplyTrainingRoomEV(pet, fixedEv) {
    const fields = ['evHp', 'evAtk', 'evDef', 'evSpAtk', 'evSpDef', 'evSpeed'];
    if (!fields.includes(fixedEv.field) || !Number.isSafeInteger(fixedEv.amount) || fixedEv.amount < 1)
        throw new Error('Invalid training room EV');
    const total = fields.reduce((sum, field) => sum + pet[field], 0);
    if (fields.some(field => !Number.isInteger(pet[field]) || pet[field] < 0 || pet[field] > 255) || total > 510)
        throw new Error('Invalid pet EV state');
    const gain = Math.min(fixedEv.amount, 255 - pet[fixedEv.field], 510 - total);
    pet[fixedEv.field] += gain;
    return gain > 0;
}
${classAnchor}`);
fs.writeFileSync(petMgrPath, petMgrJs);

const rewardSvcPath = path.join(outDir, 'app/dist/GameServer/Game/Battle/services/BattleRewardService.js');
fs.mkdirSync(path.dirname(rewardSvcPath), {recursive: true});
let rewardSvcJs = fs.readFileSync(path.join(p1Dir, 'app/dist/GameServer/Game/Battle/services/BattleRewardService.js'), 'utf8');
const targetRewardBlock = `                expGained = this.CalculateExpReward(battle.enemy.level, battle.enemy.id, mapId, slot) * boosts.experience.multiplier;
                coinsGained = this.CalculateCoinsReward(battle.enemy.level) * boosts.coins.multiplier;
                const catchTime = battle.player.catchTime;
                if (!this._player.PetManager.GetPetByCatchTime(catchTime))
                    throw new Error('Reward pet missing');
                result.levelUp = await this._player.PetManager.HandleAddPetExpByCatchTime(catchTime, expGained, battle.enemy.id, {
                    learningMultiplier: boosts.learning.multiplier * (learnTimes > 0 ? 2 : 1),
                    storedExperience: boosts.experience.multiplier > 1 ? expGained : 0,
                    learningUse: learnTimes > 0 ? { expected: learnTimes, remaining: learnTimes - 1 } : undefined,
                });`;

const replacementRewardBlock = `                // 精灵学院训练室：param2 0..4 为学习力靶子（本室单项 初级+5/高级+10），1TL(T=系别,L=阶段1..5) 为经验特训
                const trainRoomEv = { 488: ['evAtk', 5], 489: ['evDef', 5], 490: ['evSpAtk', 5], 491: ['evSpDef', 5], 492: ['evSpeed', 5], 493: ['evHp', 5],
                    470: ['evAtk', 10], 471: ['evDef', 10], 472: ['evSpAtk', 10], 473: ['evSpDef', 10], 474: ['evSpeed', 10], 475: ['evHp', 10] };
                const trainMapId = Number(battle.bossMapId ?? -1);
                const trainParam2 = Number(battle.bossParam2 ?? -1);
                const trainRoom = trainRoomEv[trainMapId];
                const expTier = (trainRoom || trainMapId === 485) && trainParam2 >= 111 && trainParam2 <= 265 && trainParam2 % 10 >= 1 && trainParam2 % 10 <= 5 ? trainParam2 % 10 : 0;
                const evTrain = !expTier && trainRoom && trainParam2 >= 0 && trainParam2 <= 4 ? trainRoom : undefined;
                const learningMultiplier = boosts.learning.multiplier * (!expTier && learnTimes > 0 ? 2 : 1);
                expGained = (expTier ? [0, 1800, 5400, 12000, 24000, 42000][expTier] : this.CalculateExpReward(battle.enemy.level, battle.enemy.id, mapId, slot)) * boosts.experience.multiplier;
                coinsGained = this.CalculateCoinsReward(battle.enemy.level) * boosts.coins.multiplier;
                const catchTime = battle.player.catchTime;
                if (!this._player.PetManager.GetPetByCatchTime(catchTime))
                    throw new Error('Reward pet missing');
                result.levelUp = await this._player.PetManager.HandleAddPetExpByCatchTime(catchTime, expGained, battle.enemy.id, {
                    noEvGain: expTier > 0,
                    fixedEv: evTrain ? { field: evTrain[0], amount: evTrain[1] * learningMultiplier } : undefined,
                    learningMultiplier,
                    storedExperience: boosts.experience.multiplier > 1 ? expGained : (expTier ? Math.floor(expGained * 0.5) : 0),
                    learningUse: !expTier && learnTimes > 0 ? { expected: learnTimes, remaining: learnTimes - 1 } : undefined,
                });`;

assert.ok(rewardSvcJs.includes(targetRewardBlock), 'Expected reward block in BattleRewardService.js');
rewardSvcJs = rewardSvcJs.replace(targetRewardBlock, replacementRewardBlock);
fs.writeFileSync(rewardSvcPath, rewardSvcJs);

console.log('5. 编译并注入客户端 NieoCore.swf（精灵学院与综合训练室面板）...');
const nieoPath = path.join(outDir, 'client/overlay/dll/NieoCore.swf');
const nieoAssetsPath = path.join(outDir, 'client/assets/dll/NieoCore.swf');

const scriptMap = {
  'com/robot/app/task/petstory/app/train/TrainData': fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/academy-train/TrainData.as'), 'utf8'),
  'com/robot/app/task/petstory/app/train/TrainItemPanel': fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/academy-train/TrainItemPanel.as'), 'utf8'),
  'com/robot/app/task/petstory/app/train/TrainGradePanel': fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/academy-train/TrainGradePanel.as'), 'utf8'),
  'com/robot/app/task/petstory/app/train/TrainControl': fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/academy-train/TrainControl.as'), 'utf8'),
  'com/robot/app/mapProcess/MapProcess_485': fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/academy-train/MapProcess_485.as'), 'utf8'),
  'com/robot/app/mapProcess/MapProcess_102': fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/train-door/MapProcess_102.as'), 'utf8'),
  'com/robot/core/ui/nono/NonoShortcut': fs.readFileSync(path.join(worktreeRoot, 'compat/client-patches/nono-experience/core/scripts/com/robot/core/ui/nono/NonoShortcut.as'), 'utf8'),
};

const compiledNieoBytes = compileScriptsIntoSwf(fs.readFileSync(nieoPath), scriptMap, 'nieocore');
const finalNieo = parseSwf(compiledNieoBytes);
replaceBinaryXml(finalNieo, 'com.robot.core.config.xml.MapIntroXMLInfo_xmlClass', xml => {
  return xml.replace('<map id="485" des="精灵学院">', '<map id="485" des="刷学习力与经验特训">');
});
// 星图地图说明的等级区间跟随新等级带：同一星球（同 super）各野外场景窗口的并集
replaceBinaryXml(finalNieo, 'com.robot.core.config.xml.MapIntroXMLInfo_xmlClass', xml => {
  let changed = 0;
  const next = xml.replace(/<map id="(\d+)"([^>]*?)level="[^"]*"/g, (whole, id, mid) => {
    const sup = mapSuper.get(Number(id));
    const wins = [...mapWindow.entries()].filter(([mid2]) => mid2 === id || (sup && mapSuper.get(Number(mid2)) === sup)).map(([, w]) => w);
    if (!wins.length) return whole;
    changed++;
    return `<map id="${id}"${mid}level="${Math.min(...wins.map(w => w.min))}-${Math.max(...wins.map(w => w.max))}"`;
  });
  console.log(`   地图说明等级同步 ${changed} 处`);
  return next;
});
const finalNieoBuf = encodeSwf(finalNieo, finalNieo.tags.map(t => t.raw));
fs.writeFileSync(nieoPath, finalNieoBuf);
fs.writeFileSync(nieoAssetsPath, finalNieoBuf);

console.log('6. 更新 manifest.json...');
const manifestPath = path.join(outDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.release = 'classic-polish-v3-20261118';

const updatedRelPaths = [
  'app/config/data/json/map-ogres.json',
  'app/config/data/json/boss_abilities.json',
  'app/dist/GameServer/Game/Pet/PetManager.js',
  'app/dist/GameServer/Game/Battle/services/BattleRewardService.js',
  'client/overlay/dll/NieoCore.swf',
  'client/assets/dll/NieoCore.swf',
];

for (const rel of updatedRelPaths) {
  const buf = fs.readFileSync(path.join(outDir, rel));
  const entry = {path: rel, sha256: sha(buf), bytes: buf.length};
  const idx = manifest.writtenFiles.findIndex(f => f.path === rel);
  if (idx >= 0) manifest.writtenFiles[idx] = entry; else manifest.writtenFiles.push(entry);
}
manifest.generatedAt = new Date().toISOString();
delete manifest.builtAt;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('构建完成 ->', outDir);
