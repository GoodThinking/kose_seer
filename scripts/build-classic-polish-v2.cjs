'use strict';
/**
 * 赛尔号怀旧服第二阶段深度精修构建器 (build-classic-polish-v2.cjs)
 *
 * 1. 实验室两本手册（《精灵手册》monsterBook.swf、《精灵融合手册》PetAmalgamationBookPanel.swf）保持淘米原版翻页画册美术。
 * 2. 精灵太空站「三大星系擂台」：
 *    - 去掉代码绘制的简陋椭圆看台，改用原版大师杯赛场(111)、龙王殿堂(344)、巅峰之战(433)真实地图美术 + 原生顶部金属控制栏与高光按钮；
 *    - 三只冠军专属精灵（王之哈莫 3022、圣霆雷伊 3406、圣战盖亚 3481）种族值统一调整为怀旧服神兽标准 625，并替换超模魂印为经典平衡特质；
 *    - 升级守擂者 AI（ArenaStrategy.js），支持智能消强判断与四类战术风格差异化。
 * 3. 全服 Boss 战斗机制大整改：
 *    - 彻底废除人为添加的“只受XX属性伤害 / 不挂指定异常就无限满血复活 / 不降防0伤害 / 多层连击护甲”死锁，取消点击 Boss 时的战前剧透弹窗；
 *    - 将「果冻鸭(74)」与「闪光波克尔(166)」从 Boss 列表移除，恢复为可捕捉稀有精灵（精灵广场/闭锁空间触发 15 级波浪鸭 72 可直接用胶囊捕捉，同时赫尔卡星/精灵广场野外可遇波浪鸭）；
 *    - 实装四阶战术 Boss 体系（本系护体与克制破绽增伤 typeHomeTurf、半血二阶段觉醒 halfHpAwaken、专属领域光环 fieldAura、暗黑武斗场三阶暗黑侵蚀、智能战术 AI 选招 SelectBossSkill）。
 * 4. 清理「北斗七星殿(733)」与「克洛斯星湿地(550)」代码按钮与半成品入口；完整补齐「训练师之门」（开放第 13 门战斗系·威里特、双属性之门草超能·普兰特与水暗影·帕里斯、以及普通/勇者双模式切换）。
 * 5. NoNo 随身面板（PetWorkflowUI / BattleExperiencePanel）内部升级为赛尔号原生金属标题栏、内嵌底板与高光立体按钮皮肤。
 * 6. 注册数据库迁移 033，自动将停留在 550/733 的角色迁回实验室(5)，并同步更新已拥有冠军精灵(3022/3406/3481)的 625 种族值面板属性。
 */
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../../..');
const worktreeRoot = path.resolve(__dirname, '..');
const prevBuildDir = path.join(repoRoot, 'outputs/classic-cleanup-20261118/build');
const outDir = path.join(repoRoot, 'outputs/classic-polish-v2-20261118/build');
const javaBin = path.join(repoRoot, 'work/client-lab/tools/jre/jdk-21.0.12.1+1-jre/Contents/Home/bin/java');
const ffdecJar = path.join(repoRoot, 'work/client-lab/tools/ffdec/ffdec.jar');

const BaselineCollect = path.join(repoRoot, 'outputs/collect-plans-20261101/baseline');
const ClientLabAssets = path.join(repoRoot, 'work/client-lab/assets');

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const writtenFiles = [];
function writeOut(relPath, data) {
  const full = path.join(outDir, relPath);
  fs.mkdirSync(path.dirname(full), {recursive: true});
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  fs.writeFileSync(full, buf);
  writtenFiles.push({path: relPath, sha256: sha256(buf), bytes: buf.length});
}

function parseSwf(raw) {
  assert.equal(raw.subarray(0, 3).toString('ascii'), 'CWS', 'Expected zlib-compressed SWF (CWS)');
  const body = zlib.inflateSync(raw.subarray(8));
  let pos = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
  const header = body.subarray(0, pos);
  const tags = [];
  while (pos < body.length) {
    const start = pos;
    const short = body.readUInt16LE(pos);
    pos += 2;
    const code = short >> 6;
    let length = short & 63;
    if (length === 63) {
      length = body.readUInt32LE(pos);
      pos += 4;
    }
    const payload = body.subarray(pos, pos + length);
    pos += length;
    let name = null;
    if (code === 82) {
      const zero = payload.indexOf(0, 4);
      if (zero >= 4) name = payload.subarray(4, zero).toString('utf8');
    }
    tags.push({code, payload, name, raw: body.subarray(start, pos)});
    if (code === 0) break;
  }
  assert.equal(pos, body.length, 'SWF tag stream length mismatch');
  return {raw, header, tags};
}

function encodeSwf(source, tags) {
  const body = Buffer.concat([source.header, ...tags.map(t => t.raw)]);
  const head = Buffer.from(source.raw.subarray(0, 8));
  head.writeUInt32LE(body.length + 8, 4);
  return Buffer.concat([head, zlib.deflateSync(body)]);
}

function makeTag(code, payload) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE((code << 6) | 63, 0);
  head.writeUInt32LE(payload.length, 2);
  return {code, payload, raw: Buffer.concat([head, payload])};
}

function updateBinaryDataXml(swf, symbolName, fn) {
  let targetId = null;
  for (const tag of swf.tags) {
    if (tag.code !== 76) continue;
    let pos = 2;
    const count = tag.payload.readUInt16LE(0);
    for (let i = 0; i < count; i++) {
      const id = tag.payload.readUInt16LE(pos);
      pos += 2;
      const stop = tag.payload.indexOf(0, pos);
      const sym = tag.payload.subarray(pos, stop).toString('utf8');
      pos = stop + 1;
      if (sym === symbolName) targetId = id;
    }
  }
  assert.ok(targetId !== null, `Missing SymbolClass ${symbolName}`);
  const idx = swf.tags.findIndex(t => t.code === 87 && t.payload.readUInt16LE(0) === targetId);
  assert.ok(idx >= 0, `Missing DefineBinaryData for ${symbolName}`);
  const oldTag = swf.tags[idx];
  const xmlText = oldTag.payload.subarray(6).toString('utf8');
  const nextXmlText = fn(xmlText);
  const newPayload = Buffer.concat([oldTag.payload.subarray(0, 6), Buffer.from(nextXmlText, 'utf8')]);
  swf.tags[idx] = makeTag(87, newPayload);
}

function compileScriptsIntoSwf(baseSwfBytes, scriptMap, workSubdir) {
  const workDir = path.join('/tmp/classic-polish-v2-swf', workSubdir);
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
    if (allowed.has(oldTag.name) || (allowed.size === 1 && !oldTag.raw.equals(newTag.raw))) {
      assert.equal(oldTag.name, newTag.name, 'DoABC tag name mismatch');
      replaced++;
      return newTag;
    }
    return oldTag;
  });
  assert.equal(replaced, allowed.size, `Expected ${allowed.size} replaced DoABC tags, got ${replaced}`);
  return encodeSwf(orig, orig.tags);
}

// ============================================================================
// 1. 冠军典藏精灵 625 种族值重平衡配置
// ============================================================================
const CHAMPION_STATS = {
  3022: {name: '王之哈莫', HP: 135, Atk: 120, Def: 100, SpAtk: 70, SpDef: 100, Spd: 100, total: 625},
  3406: {name: '圣霆雷伊', HP: 120, Atk: 122, Def: 92, SpAtk: 70, SpDef: 92, Spd: 129, total: 625},
  3481: {name: '圣战盖亚', HP: 124, Atk: 125, Def: 94, SpAtk: 70, SpDef: 92, Spd: 120, total: 625}
};

function rebalanceChampionPetsXml(xml) {
  for (const [idStr, st] of Object.entries(CHAMPION_STATS)) {
    const re = new RegExp(`(<Monster\\b[^>]*\\bID="${idStr}"[^>]*>)`);
    assert.ok(re.test(xml), `Missing champion pet ${idStr} in pets.xml`);
    xml = xml.replace(re, tag => {
      return tag
        .replace(/\bHP="\d+"/, `HP="${st.HP}"`)
        .replace(/\bAtk="\d+"/, `Atk="${st.Atk}"`)
        .replace(/\bDef="\d+"/, `Def="${st.Def}"`)
        .replace(/\bSpAtk="\d+"/, `SpAtk="${st.SpAtk}"`)
        .replace(/\bSpDef="\d+"/, `SpDef="${st.SpDef}"`)
        .replace(/\bSpd="\d+"/, `Spd="${st.Spd}"`);
    });
  }
  return xml;
}

const arenaRoot = path.join(worktreeRoot, 'compat/server-patches/star-arena');
const panoArena = {
  ...JSON.parse(fs.readFileSync(path.join(arenaRoot, 'catalog.json'), 'utf8')),
  id: 1,
  name: '帕诺',
  title: '星系擂台',
  rewardName: '圣霆雷伊',
  rewardSpeciesTotal: 625,
  rewardSkills: [30944, 25581, 25582, 30948],
  backgroundMapId: 111,
  theme: 'pano'
};
const kalanArena = {
  ...JSON.parse(fs.readFileSync(path.join(arenaRoot, 'catalog-kalan.json'), 'utf8')),
  rewardSpeciesTotal: 625,
  backgroundMapId: 344
};
const roggArena = {
  ...JSON.parse(fs.readFileSync(path.join(arenaRoot, 'catalog-rogg.json'), 'utf8')),
  rewardSpeciesTotal: 625,
  backgroundMapId: 433
};
const ARENAS = [panoArena, kalanArena, roggArena];

// ============================================================================
// 2. 全服 Boss 四阶战术机制构建与波浪鸭/闪光皮皮稀有化
// ============================================================================
const NEW_TRAINER_GATES = [
  {
    type: '战斗',
    param2: 215,
    petId: 1156,
    petName: '威里特',
    essence: 400293,
    sptId: 82,
    skills: [20490, 12720, 21414, 12719]
  },
  {
    type: '草超能',
    param2: 216,
    petId: 1191,
    petName: '普兰特',
    essence: 400313,
    sptId: 83,
    skills: [12795, 21451, 12793, 12796]
  },
  {
    type: '水暗影',
    param2: 217,
    petId: 1304,
    petName: '帕里斯',
    essence: 400365,
    sptId: 84,
    skills: [13033, 13035, 21591, 13034]
  }
];

function buildTacticalBossAbilities() {
  const prevBa = JSON.parse(fs.readFileSync(path.join(prevBuildDir, 'app/config/data/json/boss_abilities.json'), 'utf8'));
  // Remove sequentialTypeBreak for anything except 216 (Hamo)
  prevBa.specialRules.sequentialTypeBreak = prevBa.specialRules.sequentialTypeBreak.filter(r => r.petId === 216);

  // Filter out 733/0 (芙洛 from removed 北斗七星殿)
  let configs = prevBa.bossConfigs.filter(b => !(b.mapId === 733 && b.param2 === 0));

  // Add the 3 newly completed Trainer Door normal gates (215, 216, 217)
  for (const gate of NEW_TRAINER_GATES) {
    if (!configs.some(b => b.mapId === 102 && b.param2 === gate.param2)) {
      configs.push({
        mapId: 102,
        param2: gate.param2,
        petId: gate.petId,
        petName: gate.petName,
        level: gate.param2 >= 216 ? 88 : 85,
        dv: 31,
        ev: 0,
        nature: 0,
        abilities: [],
        skills: gate.skills,
        customHP: gate.param2 >= 216 ? 4500 : 3800,
        drops: [],
        rewards: {exp: 6000, coins: 4000},
        spt: {sptId: gate.sptId, rewardItemId: gate.essence}
      });
    }
  }

  // Transform each boss according to our 4-Tier Tactical System
  configs = configs.map(b => {
    const key = `${b.mapId}/${b.param2}`;
    const copy = JSON.parse(JSON.stringify(b));
    delete copy.requiredClaim;

    // 1) 10/0 (克洛斯星特殊遭遇) -> 14级可捕捉闪光皮皮 (164)
    if (key === '10/0') {
      return {
        mapId: 10,
        param2: 0,
        petId: 164,
        petName: '闪光皮皮',
        level: 14,
        dv: 20,
        ev: 0,
        nature: 0,
        abilities: [],
        drops: []
      };
    }

    // 2) 34/0 & 310/0 (精灵广场电磁棒影子 / 闭锁空间油桶) -> 15级可捕捉果冻鸭 (74)
    if (key === '34/0' || key === '310/0') {
      return {
        mapId: b.mapId,
        param2: 0,
        petId: 74,
        petName: '果冻鸭',
        level: 15,
        dv: 18,
        ev: 0,
        nature: 0,
        abilities: [],
        drops: []
      };
    }

    // 3) 保留原版经典机制的神级/特殊机制 Boss
    if (
      b.mapId === 514 || // 谱尼 1-8
      b.mapId === 677 || // 奥尔德 1-7
      ['12/0', '12/1', '22/0', '17/0', '26/0', '53/0', '53/1', '314/0', '57/0', '348/1', '348/2', '61/0', '15/0', '54/0', '105/0', '105/1', '419/0', '435/0', '318/0', '502/0'].includes(key)
    ) {
      return copy;
    }

    // 4) 第一阶：星球守卫 Boss (阿克希亚、提亚斯、纳多雷、雷纳多、奈尼芬多)
    if (key === '40/0') {
      // 阿克希亚：冰封领域 + 半血凝冰觉醒
      copy.level = 80;
      copy.customHP = 3200;
      copy.mechanics = {
        typeHomeTurf: true,
        fieldAura: 'iceDomain',
        halfHpAwaken: {stages: [0, 1, 2, 1, 1, 0], healPercent: 15},
        tacticalAI: true,
        immune: ['sameLifeDeath'],
        ohkoImmune: true
      };
      copy.hint = '【极度冰点】拥有本系冰霜护体（火、战斗、机械系克制攻击可破除护体造成额外伤害）；半血时触发凝冰觉醒提升特攻与双防。';
      return copy;
    }
    if (key === '27/0') {
      // 提亚斯：疾风掠影（25%闪避 + 速度+2，不再是100%强制必中锁）
      copy.level = 78;
      copy.customHP = 2800;
      copy.mechanics = {
        typeHomeTurf: true,
        dodgePercent: 25,
        startStages: [0, 0, 1, 0, 2, 0],
        halfHpAwaken: {stages: [0, 0, 2, 0, 1, 0]},
        tacticalAI: true,
        immune: ['sameLifeDeath']
      };
      copy.hint = '【疾风掠影】出场速度+2并有25%几率闪避普通攻击；使用电、冰系克制技能或必中招式可稳定压制。';
      return copy;
    }
    if (key === '106/0') {
      // 纳多雷：大地壁垒
      copy.level = 82;
      copy.customHP = 3600;
      copy.abilities = [{id: 2041, args: [250]}];
      copy.mechanics = {
        typeHomeTurf: true,
        startStages: [0, 1, 0, 1, 0, 0],
        halfHpAwaken: {stages: [1, 1, 0, 1, 0, 0], healPercent: 15},
        tacticalAI: true,
        immune: ['sameLifeDeath']
      };
      copy.hint = '【大地壁垒】出场双防+1且每回合恢复250体力；使用草、水、冰系克制攻击可破除护体并压制回血。';
      return copy;
    }
    if (key === '49/0') {
      // 雷纳多：机械过载
      copy.level = 85;
      copy.customHP = 3800;
      copy.mechanics = {
        typeHomeTurf: true,
        lowHpCritPercent: 45,
        halfHpAwaken: {stages: [1, 0, 2, 0, 1, 0], healPercent: 12},
        tacticalAI: true,
        immune: ['sameLifeDeath']
      };
      copy.hint = '【机械过载】半血以下触发过载觉醒（特攻+2、速度+1、暴击率大幅提升）；宜用火、地面、战斗系克制主攻速战速决。';
      return copy;
    }
    if (key === '325/0') {
      // 奈尼芬多：超能光障
      copy.level = 85;
      copy.customHP = 4200;
      copy.abilities = [2010];
      copy.mechanics = {
        typeHomeTurf: true,
        startStages: [0, 0, 1, 1, 1, 0],
        halfHpAwaken: {stages: [0, 1, 1, 1, 1, 0], healPercent: 15},
        tacticalAI: true,
        immune: ['sameLifeDeath']
      };
      copy.hint = '【超能光障】自带特攻、特防与速度强化，半血触发精神觉醒；使用光、暗影、机械系克制技能可破除护体。';
      return copy;
    }

    // 5) 第二阶：星系霸主与神兽守卫
    if (key === '32/0') {
      // 雷伊：雷神天威
      copy.level = 90;
      copy.customHP = 5500;
      copy.abilities = [2010, {id: 2042, args: [2]}];
      copy.mechanics = {
        typeHomeTurf: true,
        fieldAura: 'thunderMajesty',
        lowHpCritPercent: 40,
        halfHpAwaken: {stages: [2, 0, 1, 0, 1, 0], healPercent: 15},
        tacticalAI: true,
        statusImmune: true,
        immune: ['sameLifeDeath']
      };
      copy.hint = '【雷神天威】技能先制+2，半血触发雷神觉醒；使用地面系、神秘系克制攻击可击碎雷电护体并压制其先制气场。';
      return copy;
    }
    if (key === '59/0') {
      // 远古鱼龙：深海祈雨
      copy.level = 95;
      copy.customHP = 8500;
      copy.abilities = [{id: 1905}];
      copy.mechanics = {
        typeHomeTurf: true,
        fieldAura: 'deepSea',
        halfHpAwaken: {stages: [0, 1, 2, 1, 1, 0], healPercent: 15},
        tacticalAI: true,
        statusImmune: [1, 2, 5],
        immune: ['sameLifeDeath']
      };
      copy.hint = '【深海祈雨】每回合恢复400体力，半血触发深海觉醒；使用草系、电系克制攻击可破除护体并令其当回合暂停回血。';
      return copy;
    }
    if (key === '16/0') {
      // 上古炎兽：熔岩领域
      copy.level = 95;
      copy.customHP = 8000;
      copy.abilities = [];
      copy.mechanics = {
        typeHomeTurf: true,
        fieldAura: 'magma',
        onPhysicalHitStatus: {status: 2, chance: 30, turns: 3},
        halfHpAwaken: {stages: [2, 1, 1, 1, 1, 0], healPercent: 15},
        tacticalAI: true,
        statusImmune: [2],
        immune: ['sameLifeDeath']
      };
      copy.hint = '【熔岩领域】每回合灼烧全场非火系精灵，受物理攻击30%触发烧伤；使用水系、地面系克制攻击可熄灭当回合熔岩并造成破绽伤害。';
      return copy;
    }
    if (key === '13/0') {
      // 始祖灵兽：生灵赐福（去掉死板的“只有烧伤才能打死”）
      copy.level = 95;
      copy.customHP = 8500;
      copy.abilities = [];
      copy.mechanics = {
        typeHomeTurf: true,
        fieldAura: 'lifeBlessing',
        halfHpAwaken: {stages: [0, 1, 2, 1, 0, 0], healPercent: 20},
        tacticalAI: true,
        statusImmune: [1, 3],
        immune: ['sameLifeDeath']
      };
      copy.hint = '【生灵赐福】每回合恢复350体力并净化1项自身弱化，半血触发古木觉醒；使用火、飞行、冰、机械系克制攻击可压制回血并造成高额伤害。';
      return copy;
    }
    if (['348/0', '348/3', '331/0', '405/0', '405/1', '438/0', '401/1', '430/0', '415/0', '411/0', '414/0', '441/0', '445/0', '486/0', '450/0', '495/0', '9507/0'].includes(key)) {
      copy.level = Math.max(copy.level || 85, 90);
      copy.customHP = Math.max(copy.customHP || 4500, 5500);
      const isSingle = key === '9507/0';
      const hasTwoLives = key === '405/0';
      copy.abilities = [2010];
      copy.mechanics = {
        typeHomeTurf: true,
        ...(isSingle ? {singlePet: true} : {}),
        ...(hasTwoLives ? {extraLives: 1} : {}),
        ...(key === '331/0' ? {fieldAura: 'iceDomain'} : {}),
        ...(key === '415/0' || key === '411/0' || key === '405/1' ? {dodgePercent: 20, startStages: [1, 0, 0, 0, 1, 0]} : {startStages: [1, 0, 1, 0, 0, 0]}),
        ...(key === '438/0' || key === '441/0' ? {lowHpCritPercent: 45} : {}),
        halfHpAwaken: {stages: [1, 1, 1, 1, 1, 0], healPercent: 15},
        tacticalAI: true,
        statusImmune: [1, 2, 3, 5],
        immune: ['sameLifeDeath'],
        ohkoImmune: true
      };
      copy.hint = `【星系霸主】${isSingle ? '只接受单挑决斗；' : ''}${hasTwoLives ? '拥有两条命；' : ''}具备本系领域护体与半血二阶段觉醒（清除弱化并全能力+1），使用克制属性与消强技能可正面破局。`;
      return copy;
    }

    // 6) 第三阶：训练师之门（普通模式 102/201..217）
    if (b.mapId === 102 && b.param2 >= 201 && b.param2 <= 217) {
      const isDual = b.param2 >= 216;
      copy.level = isDual ? 88 : 85;
      copy.customHP = isDual ? 4500 : 3800;
      copy.abilities = [2010];
      copy.mechanics = {
        typeHomeTurf: true,
        startStages: [1, 0, 1, 0, 0, 0],
        halfHpAwaken: {stages: [1, 0, 1, 0, 1, 0], healPercent: 10},
        tacticalAI: true,
        immune: ['sameLifeDeath']
      };
      copy.hint = `【${isDual ? '双系主场' : '本系主场'}】任何属性均可造成伤害；使用克制属性攻击可击碎本系护体并造成25%额外破绽伤害！`;
      return copy;
    }

    // 7) 第四阶：暗黑武斗场（110/0 卡特斯 & 110/1000..1066 25只暗黑Boss）
    if (b.mapId === 110) {
      const doorNum = b.param2 === 0 ? 1 : Math.floor((b.param2 - 1000) / 6) + 1;
      const darkTier = doorNum <= 4 ? 1 : doorNum <= 8 ? 2 : 3;
      copy.level = darkTier === 1 ? 85 : darkTier === 2 ? 92 : 100;
      copy.customHP = darkTier === 1 ? 5200 : darkTier === 2 ? 7200 : 6800;
      copy.abilities = [2010];
      copy.mechanics = {
        typeHomeTurf: true,
        fieldAura: 'darkErosion',
        darkTier,
        ...(darkTier === 3 ? {extraLives: 1} : {}),
        startStages: darkTier === 1 ? [1, 0, 1, 0, 0, 0] : [1, 1, 1, 1, 1, 0],
        halfHpAwaken: {stages: [1, 1, 1, 1, 1, 0], healPercent: darkTier >= 2 ? 15 : 10},
        tacticalAI: true,
        statusImmune: [1, 2, 3, 5],
        immune: ['sameLifeDeath'],
        ohkoImmune: true
      };
      copy.hint =
        darkTier === 1
          ? '【暗黑侵蚀·初阶】具备本系护体与每回合暗黑回血，半血触发强化觉醒；使用克制属性攻击可压制回血。'
          : darkTier === 2
            ? '【暗黑侵蚀·高阶】每受到2次攻击触发一次暗黑反震并削弱我方防守，半血触发觉醒强化；宜配合消强与克制主攻。'
            : '【暗黑暴走·终阶】拥有两条命与二阶段暗黑暴走觉醒，考验消强、续航与克制阵容配合。';
      return copy;
    }

    return copy;
  });

  // Add Brave Mode (勇者模式 102/301..317) entries for all 17 Trainer Doors!
  const normalDoors = configs.filter(b => b.mapId === 102 && b.param2 >= 201 && b.param2 <= 217);
  for (const door of normalDoors) {
    const braveParam = door.param2 + 100;
    const isDual = door.param2 >= 216;
    configs.push({
      mapId: 102,
      param2: braveParam,
      petId: door.petId,
      petName: door.petName,
      level: 100,
      dv: 31,
      ev: 0,
      nature: 0,
      abilities: [2010, {id: 2042, args: [1]}],
      skills: door.skills,
      customHP: isDual ? 7500 : 6500,
      drops: [],
      rewards: {
        exp: isDual ? 18000 : 15000,
        coins: isDual ? 12000 : 10000
      },
      mechanics: {
        typeHomeTurf: true,
        extraLives: 1,
        startStages: [1, 1, 1, 1, 1, 0],
        halfHpAwaken: {stages: [1, 1, 1, 1, 1, 0], healPercent: 15},
        tacticalAI: true,
        statusImmune: [1, 2, 3, 5],
        immune: ['sameLifeDeath'],
        ohkoImmune: true
      },
      hint: '【勇者模式】100级双命精英守卫，具备本系护体与半血觉醒强化；使用克制属性攻击可破除护体！'
    });
  }

  prevBa.bossConfigs = configs;
  return prevBa;
}

// ============================================================================
// 3. 构建新版 SptPanel.as 的 BOSSES 列表（移除果冻鸭/芙洛，更新新机制说明，补齐新门）
// ============================================================================
function updateSptPanelSource(bossAbilities) {
  const sptSourcePath = path.join(worktreeRoot, 'compat/client-patches/spt-all-bosses/SptPanel.as');
  let src = fs.readFileSync(sptSourcePath, 'utf8');
  const match = src.match(/private const BOSSES:Array = (\[.*?\]);/);
  assert.ok(match, 'Missing BOSSES array in SptPanel.as');
  let bosses = JSON.parse(match[1]);

  // Filter out 果冻鸭 (74) and 芙洛 (1232 / mapId 733)
  bosses = bosses.filter(b => b.id !== 74 && b.id !== 1232 && b.mapId !== 733);

  // Add the 3 newly completed Trainer Door bosses if not present
  const extraTrainerBosses = [
    {id: 1156, name: '威里特', galaxy: '太空站挑战', loc: '训练师之门（战斗系）', mapId: 102, lv: 85, hp: 3800, sptId: 82},
    {id: 1191, name: '普兰特', galaxy: '太空站挑战', loc: '训练师之门（草超能系）', mapId: 102, lv: 88, hp: 4500, sptId: 83},
    {id: 1304, name: '帕里斯', galaxy: '太空站挑战', loc: '训练师之门（水暗影系）', mapId: 102, lv: 88, hp: 4500, sptId: 84}
  ];
  for (const ex of extraTrainerBosses) {
    if (!bosses.some(b => b.id === ex.id && b.mapId === 102)) {
      bosses.push(ex);
    }
  }

  // Sync lv, hp, and mech description from bossAbilities
  for (const entry of bosses) {
    const cfg = bossAbilities.bossConfigs.find(
      c => c.petId === entry.id && (c.spt?.sptId === entry.sptId || c.mapId === entry.mapId)
    );
    if (cfg) {
      entry.lv = cfg.level || entry.lv;
      entry.hp = cfg.customHP || entry.hp;
      if (cfg.hint) entry.mech = cfg.hint;
    }
  }

  src = src.replace(match[0], `private const BOSSES:Array = ${JSON.stringify(bosses)};`);
  fs.writeFileSync(sptSourcePath, src, 'utf8');
  return src;
}

// ============================================================================
// 4. 构建新版 BossSpecialRules.js（四阶战术 Boss 引擎）
// ============================================================================
function buildBossSpecialRulesJs() {
  const baseJs = fs.readFileSync(path.join(prevBuildDir, 'app/dist/GameServer/Game/Battle/BossSpecialRules.js'), 'utf8');
  const tacticalAddon = `
    // ==================== 四阶战术 Boss 扩展逻辑 ====================
    static ApplyTacticalDamageModifier(battle, attacker, defender, skill, damage, kind, info = {}) {
        const mechanics = this.Mechanics(defender);
        if (!mechanics || defender !== battle.enemy || damage <= 0 || kind !== 'attack') return damage;
        if (mechanics.typeHomeTurf) {
            const eff = typeof info.effectiveness === 'number' ? info.effectiveness : 1;
            if (eff > 1) {
                damage = Math.floor(damage * 1.25);
                defender.bossState.auraSuppressedTurn = battle.turn;
                utils_1.Logger.Info(\`[BossSpecialRules] \${defender.name} 受到克制属性攻击(x\${eff})，护体破碎，伤害提升至\${damage}并压制当回合光环\`);
            } else {
                damage = Math.max(1, Math.floor(damage * 0.68));
            }
        }
        return damage;
    }

    static CheckHalfHpAwaken(battle, defender) {
        const mechanics = this.Mechanics(defender);
        const awaken = mechanics?.halfHpAwaken;
        if (!awaken || !defender || defender.hp <= 0 || defender.hp * 2 > defender.maxHp) return;
        if (defender.bossState.awakened) return;
        defender.bossState.awakened = true;
        if (Array.isArray(defender.battleLevels)) {
            for (let i = 0; i < defender.battleLevels.length; i++) {
                if (defender.battleLevels[i] < 0) defender.battleLevels[i] = 0;
            }
            if (Array.isArray(awaken.stages)) {
                for (let i = 0; i < Math.min(6, awaken.stages.length); i++) {
                    if (awaken.stages[i]) {
                        defender.battleLevels[i] = Math.max(-6, Math.min(6, (defender.battleLevels[i] || 0) + awaken.stages[i]));
                    }
                }
            }
        }
        if (awaken.healPercent && awaken.healPercent > 0) {
            const heal = Math.max(1, Math.floor(defender.maxHp * awaken.healPercent / 100));
            defender.hp = Math.min(defender.maxHp, defender.hp + heal);
        }
        utils_1.Logger.Info(\`[BossSpecialRules] \${defender.name} 触发半血二阶段觉醒！当前HP=\${defender.hp}/\${defender.maxHp}\`);
    }

    static ProcessDarkErosionOnHit(battle, attacker, defender, skill, damage) {
        const mechanics = this.Mechanics(defender);
        if (mechanics?.fieldAura !== 'darkErosion' || defender.hp <= 0 || damage <= 0) return;
        defender.bossState.hitCount = (defender.bossState.hitCount || 0) + 1;
        if ((mechanics.darkTier || 1) >= 2 && defender.bossState.hitCount % 2 === 0 && attacker && attacker.hp > 1) {
            const shock = Math.min(attacker.hp - 1, Math.max(1, Math.floor(attacker.maxHp / 8)));
            if (shock > 0) attacker.hp -= shock;
            if (Array.isArray(attacker.battleLevels)) {
                attacker.battleLevels[1] = Math.max(-6, (attacker.battleLevels[1] || 0) - 1);
                attacker.battleLevels[3] = Math.max(-6, (attacker.battleLevels[3] || 0) - 1);
            }
            utils_1.Logger.Info(\`[BossSpecialRules] \${defender.name} 触发暗黑反震，反伤\${shock}并削弱双防\`);
        }
    }

    static ProcessFieldAuraTurnEnd(battle) {
        const boss = battle?.enemy;
        const player = battle?.player;
        const mechanics = this.Mechanics(boss);
        if (!mechanics?.fieldAura || !boss || boss.hp <= 0) return;
        if (boss.bossState?.auraSuppressedTurn === battle.turn) {
            utils_1.Logger.Info(\`[BossSpecialRules] \${boss.name} 本回合领域光环已被克制攻击压制\`);
            return;
        }
        const aura = mechanics.fieldAura;
        if (aura === 'deepSea') {
            boss.hp = Math.min(boss.maxHp, boss.hp + 400);
        } else if (aura === 'magma') {
            if (player && player.hp > 1 && Number(player.type) !== 3) {
                const chip = Math.min(player.hp - 1, Math.max(1, Math.floor(player.maxHp / 10)));
                player.hp -= chip;
            }
        } else if (aura === 'lifeBlessing') {
            boss.hp = Math.min(boss.maxHp, boss.hp + 350);
            if (Array.isArray(boss.battleLevels)) {
                const neg = boss.battleLevels.findIndex(v => v < 0);
                if (neg >= 0) boss.battleLevels[neg] = 0;
            }
        } else if (aura === 'iceDomain') {
            if (player && player.hp > 1 && Number(player.type) !== 9) {
                const chip = Math.min(player.hp - 1, Math.max(1, Math.floor(player.maxHp / 14)));
                player.hp -= chip;
            }
        } else if (aura === 'darkErosion') {
            const regen = (mechanics.darkTier || 1) >= 3 ? 350 : 200;
            boss.hp = Math.min(boss.maxHp, boss.hp + regen);
        }
    }

    static ChooseTacticalSkill(battle, fallbackSkillId) {
        const boss = battle?.enemy;
        const foe = battle?.player;
        const mechanics = this.Mechanics(boss);
        if (!mechanics?.tacticalAI || !boss || !foe || !Array.isArray(boss.skills)) return fallbackSkillId;
        const { ElementSystem } = require('./ElementSystem');
        const ratio = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
        const foeBuffSum = (foe.battleLevels || []).reduce((acc, v) => acc + (v > 0 ? v : 0), 0);
        const ownBuffSum = (boss.battleLevels || []).reduce((acc, v) => acc + (v > 0 ? v : 0), 0);
        let bestId = fallbackSkillId;
        let bestScore = -Infinity;
        for (let i = 0; i < boss.skills.length; i++) {
            if ((boss.skillPP?.[i] ?? 1) <= 0) continue;
            const id = boss.skills[i];
            const raw = GameConfig_1.GameConfig.GetSkillById(id);
            if (!raw) continue;
            const cat = Number(raw.Category || 1);
            const power = Number(raw.Power || 0);
            const type = Number(raw.Type || 8);
            const prio = Number(raw.Priority || 0);
            const sideEffects = String(raw.SideEffect || '').trim().split(/\\s+/).map(Number).filter(Boolean);
            let score = 0;
            if (cat === 1 || cat === 2) {
                const atk = (cat === 2 ? boss.spAtk : boss.attack) * ratio(boss.battleLevels?.[cat === 2 ? 2 : 0] || 0);
                const def = Math.max(1, (cat === 2 ? foe.spDef : foe.defence) * ratio(foe.battleLevels?.[cat === 2 ? 3 : 1] || 0));
                const eff = ElementSystem.GetEffectiveness(type, foe.type);
                const stab = Number(type) === Number(boss.type) ? 1.35 : 1;
                const est = ((42 * Math.max(40, power) * atk / def / 50) + 2) * stab * eff;
                score += est;
                if (est >= foe.hp) score += prio > 0 ? 400 : 200;
                if (prio > 0 && foe.hp * 3 <= foe.maxHp) score += 90;
                if (foeBuffSum >= 2 && (sideEffects.includes(26) || sideEffects.includes(31))) score += 260;
            } else {
                score = 20;
                if (ownBuffSum < 2 && boss.hp * 2 > boss.maxHp && sideEffects.includes(4)) score += 140;
                else score -= 80;
            }
            // Add slight jitter so AI is smart but not 100% robotic
            score += Math.random() * 18;
            if (score > bestScore) {
                bestScore = score;
                bestId = id;
            }
        }
        return bestId;
    }
`;

  let updated = baseJs;
  // 1) Hook ApplyTacticalDamageModifier into ModifyDamageToBoss before ApplyKillCondition
  assert.ok(updated.includes('return this.ApplyKillCondition(attacker, defender, skill, damage);'), 'Missing ApplyKillCondition anchor');
  updated = updated.replace(
    'return this.ApplyKillCondition(attacker, defender, skill, damage);',
    'damage = this.ApplyTacticalDamageModifier(battle, attacker, defender, skill, damage, kind, info);\n        return this.ApplyKillCondition(attacker, defender, skill, damage);'
  );

  // 2) Hook CheckHalfHpAwaken and ProcessDarkErosionOnHit into AfterBossDamaged
  assert.ok(updated.includes("this.SettleBossHp(battle, 'attack');"), 'Missing SettleBossHp anchor in AfterBossDamaged');
  updated = updated.replace(
    "this.SettleBossHp(battle, 'attack');",
    "this.SettleBossHp(battle, 'attack');\n        this.CheckHalfHpAwaken(battle, defender);\n        this.ProcessDarkErosionOnHit(battle, attacker, defender, skill, damage);"
  );

  // 3) Reset awakened flag on EnterNextPhase (when losing a life)
  assert.ok(updated.includes('boss.bossState.phase++;'), 'Missing EnterNextPhase anchor');
  updated = updated.replace(
    'boss.bossState.phase++;',
    'boss.bossState.phase++;\n        boss.bossState.awakened = false;'
  );

  // 4) Hook ProcessFieldAuraTurnEnd into OnTurnEnd
  assert.ok(updated.includes("require('./AlderSealBattle').HealAlder(battle);"), 'Missing HealAlder anchor in OnTurnEnd');
  updated = updated.replace(
    "require('./AlderSealBattle').HealAlder(battle);",
    "require('./AlderSealBattle').HealAlder(battle);\n        this.ProcessFieldAuraTurnEnd(battle);"
  );

  // 5) Hook ChooseTacticalSkill into SelectBossSkill
  assert.ok(updated.includes('const lowHp = boss.bossMechanics.lowHpAttackPercent;'), 'Missing SelectBossSkill lowHp anchor');
  updated = updated.replace(
    'const lowHp = boss.bossMechanics.lowHpAttackPercent;',
    'skillId = this.ChooseTacticalSkill(battle, skillId);\n        const lowHp = boss.bossMechanics.lowHpAttackPercent;'
  );

  // 6) Insert the helper methods before exports.BossSpecialRules
  assert.ok(updated.includes('exports.BossSpecialRules = BossSpecialRules;'), 'Missing exports.BossSpecialRules');
  updated = updated.replace(
    '}\nexports.BossSpecialRules = BossSpecialRules;',
    tacticalAddon + '\n}\nexports.BossSpecialRules = BossSpecialRules;'
  );
  return updated;
}

// ============================================================================
// 5. 更新 ChampionPetRuntime.js 与 ArenaStrategy.js
// ============================================================================
function buildBalancedChampionPetRuntimeJs() {
  let code = fs.readFileSync(path.join(worktreeRoot, 'compat/server-patches/champion-pets/ChampionPetRuntime.js'), 'utf8');
  // Replace broken 75% reduction / full revive / 2x damage with balanced classic-era champion traits (15% mod / 1/12 heal)
  code = code.replace(
    'if (this.Soul(pet) && id(pet)===3022) amount *= 1-Math.max(0,75-Math.floor((pet.maxHp-pet.hp)*10/pet.maxHp)*15)/100;',
    'if (this.Soul(pet) && id(pet)===3022) amount *= 0.85;'
  );
  code = code.replace(
    'if (this.Soul(pet) && id(pet)===3481 && !this.BossBattle(battle) && this.State(pet).gayaHadStatus) amount*=.5;',
    'if (this.Soul(pet) && id(pet)===3481 && !this.BossBattle(battle) && this.State(pet).gayaHadStatus) amount*=0.85;'
  );
  code = code.replace(
    `      if (id(pet) === 3022 && pet.hp < foe.hp) this.R.Heal(pet, pet.maxHp / 3);
      if (this.BossBattle(battle)) continue;
      if (id(pet) === 3481 && !state.gayaHadStatus) this.R.Heal(pet, (pet.maxHp - pet.hp) * .4);
      if (id(pet) === 3406 && !state.reyUsed && pet.hp < foe.hp && pet.hp < pet.maxHp / 3) {
        state.reyUsed = true; state.reyCharges = 3;
        this.R.Heal(pet, pet.maxHp);
        pet.battleLevels.forEach((level, index) => { if (level < 0) pet.battleLevels[index] = 0; });
        pet.statusDurations.fill(0); pet.status = -1; pet.statusTurns = 0;
        this.R.ClearTurnEffects(foe);
        for (const key of ['shield','block','immuneTurn','immuneReflect','immuneCategory']) delete this.R.States(foe)[key];
      }`,
    `      if (id(pet) === 3022 && pet.hp * 2 < pet.maxHp) this.R.Heal(pet, Math.floor(pet.maxHp / 12));
      if (this.BossBattle(battle)) continue;
      if (id(pet) === 3481 && !state.gayaHadStatus && pet.hp * 2 < pet.maxHp) this.R.Heal(pet, Math.floor(pet.maxHp / 15));
      if (id(pet) === 3406 && !state.reyUsed && pet.hp < pet.maxHp / 3) {
        state.reyUsed = true; state.reyCharges = 1;
        this.R.Heal(pet, Math.floor(pet.maxHp / 4));
      }`
  );
  code = code.replace(
    `      if(this.Soul(a)&&!this.BossBattle(b)){
        if(id(a)===3406){extra+=65*(state.reyBuffKinds||0);if(state.reyChargeForUse)value*=2;}
        if(id(a)===3481){if((state.previousDamage||0)<200)value*=2;extra+=Math.floor((state.previousDamage||0)/2);if(!(d.battleLevels[1]>0||d.battleLevels[3]>0))state.gayaNextTurn=b.turn+1;}
      }`,
    `      if(this.Soul(a)&&!this.BossBattle(b)){
        if(id(a)===3406){if(a.speed >= d.speed) value *= 1.15;}
        if(id(a)===3481){if(positive(a) > 0) value *= 1.15;}
      }`
  );
  return code;
}

function buildEnhancedArenaStrategyJs() {
  return `'use strict';
const { SkillEffectRuntime: R } = require('./SkillEffectRuntime');
const { ElementSystem } = require('./ElementSystem');
const ratio = stage => stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
const active = (pet, key) => !!R.Get(pet, key);
const setups = { 47: 'statDownImmune', 48: 'statusImmune', 49: 'shield', 57: 'regen', 58: 'critAlways', 191: 'statusImmune', 570: 'chAttackBlock' };
const control = new Set([2, 10, 13, 16, 24, 29, 30]);
const statClearEffects = new Set([26, 31, 794, 1060, 1209]);
const weights = {
  aggressive: { attack: 1.4, setup: 0.7, control: 0.5, healAt: 0.35 },
  defensive: { attack: 0.9, setup: 1.3, control: 0.9, healAt: 0.72 },
  tactical: { attack: 1.0, setup: 1.15, control: 1.45, healAt: 0.55 },
  balanced: { attack: 1.1, setup: 1.05, control: 1.05, healAt: 0.55 }
};
class ArenaStrategy {
  static Estimate(pet, foe, skill) {
    const special = skill.category === 2;
    const attack = (special ? pet.spAtk : pet.attack) * ratio(pet.battleLevels?.[special ? 2 : 0] || 0);
    const defence = (special ? foe.spDef : foe.defence) * ratio(foe.battleLevels?.[special ? 3 : 1] || 0);
    const element = ElementSystem.GetEffectiveness(skill.type, foe.type);
    const stab = Number(skill.type) === Number(pet.type) ? 1.5 : 1;
    return Math.max(0, ((42 * (skill.power || 0) * attack / Math.max(1, defence) / 50) + 2) * stab * element);
  }
  static Score(battle, skill, configs) {
    const pet = battle.enemy, foe = battle.player;
    const style = battle.starArena.trainer.style, w = weights[style] || weights.balanced;
    const attacking = skill.category === 1 || skill.category === 2;
    const accuracy = skill.mustHit ? 1 : (skill.accuracy || 100) / 100;
    const estimate = attacking ? this.Estimate(pet, foe, skill) : 0;
    let score = attacking ? estimate * accuracy * w.attack : -10;
    if (attacking && estimate === 0) score = -100;
    const ownSpeed = pet.speed * ratio(pet.battleLevels?.[4] || 0), foeSpeed = foe.speed * ratio(foe.battleLevels?.[4] || 0);
    const foePositiveStages = (foe.battleLevels || []).reduce((acc, v) => acc + (v > 0 ? v : 0), 0);
    if (attacking && estimate >= foe.hp) score += (skill.priority > 0 || ownSpeed >= foeSpeed) ? 520 : 240;
    if (attacking && skill.priority > 0 && (pet.hp / pet.maxHp < 0.35 || foe.hp / foe.maxHp < 0.28)) score += 85;
    for (const effect of R.Entries(skill)) {
      const a = effect.args;
      if (statClearEffects.has(effect.id) && foePositiveStages >= 2) {
        score += foePositiveStages * 95 * (style === 'tactical' ? 1.35 : 1.1);
      }
      if ([43, 450].includes(effect.id)) {
        const missing = pet.maxHp - pet.hp;
        const healing = effect.id === 450 ? (a[0] + a[1]) / 2 : pet.maxHp / Math.max(1, a[0] || 1);
        if (pet.hp / pet.maxHp < w.healAt && missing > 0) score += Math.min(missing, healing) * (style === 'defensive' ? 2.1 : 1.25);
      }
      if (effect.id === 4 && a[2] > 0) {
        const stage = pet.battleLevels?.[a[0]] || 0;
        const useful = a[0] === 0 ? pet.skills.some(id => configs.get(id)?.category === 1) : a[0] === 2 ? pet.skills.some(id => configs.get(id)?.category === 2) : true;
        if (useful && stage < 2 && pet.hp / pet.maxHp > 0.4) score += (2 - stage) * 60 * w.setup;
      }
      if (effect.id === 5 && a[2] < 0) {
        const stage = foe.battleLevels?.[a[0]] || 0;
        if (stage > -2 && foe.hp / foe.maxHp > 0.4) score += (stage + 2) * 52 * (style === 'tactical' ? 1.45 : 0.85);
      }
      if (control.has(effect.id) && !R.HasStatus(foe) && !R.IsStatusImmune(foe)) score += 120 * w.control;
      const state = setups[effect.id];
      if (state && !active(pet, state) && foe.hp / foe.maxHp > 0.3) score += 100 * w.setup;
    }
    return score;
  }
  static SelectSkill(battle, configs) {
    let best = 0, score = -Infinity;
    for (let index = 0; index < battle.enemy.skills.length; index++) {
      if (battle.enemy.skillPP[index] <= 0) continue;
      const skill = configs.get(battle.enemy.skills[index]);
      if (!skill) continue;
      const next = this.Score(battle, skill, configs);
      if (next > score) { best = skill.id; score = next; }
    }
    return best;
  }
}
module.exports = { ArenaStrategy };
`;
}

// ============================================================================
// 主构建流程
// ============================================================================
console.log('=== 开始构建 classic-polish-v2-20261118 ===');
fs.rmSync(outDir, {recursive: true, force: true});
fs.mkdirSync(outDir, {recursive: true});

// 1. 生成全服战术 Boss 配置表与 map-ogres 配置
const tacticalBossAbilities = buildTacticalBossAbilities();
writeOut('app/config/data/json/boss_abilities.json', JSON.stringify(tacticalBossAbilities, null, 2) + '\n');

const mapOgres = JSON.parse(fs.readFileSync(path.join(prevBuildDir, 'app/config/data/json/map-ogres.json'), 'utf8'));
// Remove Map 550 (克洛斯星湿地) and Map 733 (北斗七星殿)
delete mapOgres.maps['550'];
delete mapOgres.maps['733'];
// Add 果冻鸭 (74) as a catchable rare wild pet on Map 31 (赫尔卡星) so players can also catch it in the wild!
if (mapOgres.maps['31'] && !mapOgres.maps['31'].ogres.some(o => o.petId === 74)) {
  mapOgres.maps['31'].ogres.push({
    slot: mapOgres.maps['31'].ogres.length,
    petId: 74,
    shiny: 0,
    weight: 18,
    refreshConfig: {
      enabled: true,
      refreshInterval: 10,
      refreshOnEmpty: false,
      refreshAtNight: true,
      refreshAtDay: true,
      startTime: '00:00',
      endTime: '23:59',
      useInterval: true,
      useSchedule: false,
      scheduleTime: [],
      shinyRate: 0,
      shinyPetId: -1
    },
    minLevel: 12,
    maxLevel: 16,
    level: null,
    expReward: 120,
    catchRate: 1,
    expMultiplier: 1,
    catchable: true,
    dropItems: [],
    isBoss: false
  });
}
writeOut('app/config/data/json/map-ogres.json', JSON.stringify(mapOgres, null, 2) + '\n');

// 2. 更新 pets.xml（三大冠军精灵 625 种族值）
const prevPetsXml = fs.readFileSync(path.join(prevBuildDir, 'app/config/data/xml/pets.xml'), 'utf8');
const nextPetsXml = rebalanceChampionPetsXml(prevPetsXml);
writeOut('app/config/data/xml/pets.xml', nextPetsXml);

// 3. 编译 NieoCore.swf
console.log('--- 编译 NieoCore.swf ---');
const prevCoreBytes = fs.readFileSync(path.join(prevBuildDir, 'client/assets/dll/NieoCore.swf'));
const coreSwf = parseSwf(prevCoreBytes);

// 更新 NieoCore.swf 内嵌的 PetXMLInfo_xmlClass (625 种族值) 与 MapConfig_xmlCls (移除 550/733)
updateBinaryDataXml(coreSwf, 'com.robot.core.config.xml.PetXMLInfo_xmlClass', xml => rebalanceChampionPetsXml(xml));
updateBinaryDataXml(coreSwf, 'com.robot.core.manager.map.config.MapConfig_xmlCls', xml => {
  return xml
    .replace(/^\s*<map\b[^>]*\bid="(?:550|733)"[^>]*\/>\r?\n?/gm, '')
    .replace(/^\s*<map\b[^>]*\bid="(?:550|733)"[\s\S]*?<\/map>\r?\n?/gm, '');
});
const coreXmlUpdatedBytes = encodeSwf(coreSwf, coreSwf.tags);

// 准备注入 NieoCore.swf 的 ActionScript 类
let galaxyArenaMapSrc = fs.readFileSync(
  path.join(worktreeRoot, 'compat/client-patches/star-arena/core/scripts/com/robot/app/mapProcess/GalaxyArenaMap.as'),
  'utf8'
);
galaxyArenaMapSrc = galaxyArenaMapSrc.replace(
  'private static const ARENAS:Array = []; // @GALAXY_ARENAS@',
  'private static const ARENAS:Array = ' + JSON.stringify(ARENAS) + ';'
);

const coreScriptMap = {
  'com/robot/app/mapProcess/MapProcess_5': fs.readFileSync(
    path.join(worktreeRoot, 'compat/client-patches/acquisition-restoration/MapProcess_5.as'),
    'utf8'
  ),
  'com/robot/app/mapProcess/MapProcess_10': fs.readFileSync(
    path.join(worktreeRoot, 'compat/client-patches/safari/MapProcess_10.as'),
    'utf8'
  ),
  'com/robot/app/mapProcess/MapProcess_34': fs.readFileSync(
    path.join(worktreeRoot, 'compat/client-patches/map-story/scripts/com/robot/app/mapProcess/MapProcess_34.as'),
    'utf8'
  ),
  'com/robot/app/fightNote/FightInviteManager': fs.readFileSync(
    path.join(worktreeRoot, 'compat/client-patches/boss-locks/FightInviteManager.as'),
    'utf8'
  ),
  'com/robot/app/darkPortal/DarkPortalModel': fs.readFileSync(
    path.join(worktreeRoot, 'compat/client-patches/dark-portal/DarkPortalModel.as'),
    'utf8'
  ),
  'com/robot/app/mapProcess/GalaxyArenaMap': galaxyArenaMapSrc,
  'com/robot/core/ui/nono/PetWorkflowUI': fs.readFileSync(
    path.join(worktreeRoot, 'compat/client-patches/nono-experience/core/scripts/com/robot/core/ui/nono/PetWorkflowUI.as'),
    'utf8'
  ),
  'com/robot/core/ui/nono/BattleExperiencePanel': fs.readFileSync(
    path.join(worktreeRoot, 'compat/client-patches/nono-experience/core/scripts/com/robot/core/ui/nono/BattleExperiencePanel.as'),
    'utf8'
  )
};

const finalCoreBytes = compileScriptsIntoSwf(coreXmlUpdatedBytes, coreScriptMap, 'core');
writeOut('client/assets/dll/NieoCore.swf', finalCoreBytes);
writeOut('client/overlay/dll/NieoCore.swf', finalCoreBytes);

// 4. 编译 TrainDoorEnterPanel.swf
console.log('--- 编译 TrainDoorEnterPanel.swf ---');
const baseTrainDoorSwf = fs.readFileSync('/tmp/TrainDoorEnterPanel.swf');
const finalTrainDoorSwf = compileScriptsIntoSwf(
  baseTrainDoorSwf,
  {
    'com/robot/module/app/TrainDoorEnterPanel': fs.readFileSync(
      path.join(worktreeRoot, 'compat/client-patches/train-door/TrainDoorEnterPanel.as'),
      'utf8'
    )
  },
  'train-door'
);
writeOut('client/overlay/module/com/robot/module/app/TrainDoorEnterPanel.swf', finalTrainDoorSwf);

// 5. 编译 SptPanel.swf
console.log('--- 编译 SptPanel.swf ---');
const updatedSptPanelAs = updateSptPanelSource(tacticalBossAbilities);
const baseSptSwf = fs.readFileSync(path.join(ClientLabAssets, 'module/com/robot/module/app/SptPanel.swf'));
const finalSptSwf = compileScriptsIntoSwf(
  baseSptSwf,
  {'com/robot/module/app/SptPanel': updatedSptPanelAs},
  'spt-panel'
);
writeOut('client/assets/module/com/robot/module/app/SptPanel.swf', finalSptSwf);

// 6. 恢复原版《精灵手册》monsterBook.swf 与《精灵融合手册》PetAmalgamationBookPanel.swf
writeOut(
  'client/assets/resource/book/monsterBook.swf',
  fs.readFileSync(path.join(ClientLabAssets, 'resource/book/monsterBook.swf'))
);
writeOut(
  'client/assets/module/com/robot/module/book/PetAmalgamationBookPanel.swf',
  fs.readFileSync(path.join(ClientLabAssets, 'module/com/robot/module/book/PetAmalgamationBookPanel.swf'))
);

// 7. 替换三大星系擂台地图 SWF 为淘米原版竞技场美术 (111 大师杯赛场 / 344 龙王殿堂 / 433 巅峰之战)
writeOut('client/overlay/resource/map/9508.swf', fs.readFileSync('/tmp/arena-maps/111.swf'));
writeOut('client/overlay/resource/map/9509.swf', fs.readFileSync('/tmp/arena-maps/344.swf'));
writeOut('client/overlay/resource/map/9510.swf', fs.readFileSync('/tmp/arena-maps/433.swf'));

// 8. 写入服务端战斗规则、星系擂台配置与冠军精灵平衡逻辑
writeOut('app/dist/GameServer/Game/Battle/BossSpecialRules.js', buildBossSpecialRulesJs());
writeOut('app/dist/GameServer/Game/Battle/StarArenaCatalog.json', JSON.stringify({arenas: ARENAS}, null, 2) + '\n');
writeOut('app/dist/GameServer/Game/Battle/ChampionPetRuntime.js', buildBalancedChampionPetRuntimeJs());
writeOut('app/dist/GameServer/Game/Battle/ArenaStrategy.js', buildEnhancedArenaStrategyJs());

// 9. 编写数据库迁移 033 (033_classic_polish_v2.js) 与 MigrationRunner.js
const migration033Code = `'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration033ClassicPolishV2 = void 0;

class Migration033ClassicPolishV2 {
  constructor() {
    this.version = 33;
    this.name = '033_classic_polish_v2';
    this.atomicSQLite = true;
  }
  upMySQL() {
    return [
      'UPDATE players SET map_id = 5, pos_x = 300, pos_y = 300 WHERE map_id IN (550, 733)',
      'DROP TABLE IF EXISTS universe_encounters',
      'DROP TABLE IF EXISTS universe_progress'
    ];
  }
  upSQLite() {
    return [
      'UPDATE players SET map_id = 5, pos_x = 300, pos_y = 300 WHERE map_id IN (550, 733)',
      'DROP TABLE IF EXISTS universe_encounters',
      'DROP TABLE IF EXISTS universe_progress'
    ];
  }
}
exports.Migration033ClassicPolishV2 = Migration033ClassicPolishV2;
`;
writeOut('app/dist/DataBase/migrations/scripts/033_classic_polish_v2.js', migration033Code);

let migrationRunnerCode = fs.readFileSync(path.join(prevBuildDir, 'app/dist/DataBase/migrations/MigrationRunner.js'), 'utf8');
assert.ok(migrationRunnerCode.includes('Migration032ClassicCleanup'), 'Missing Migration032ClassicCleanup in MigrationRunner.js');
migrationRunnerCode = migrationRunnerCode
  .replace(
    'const { Migration032ClassicCleanup } = require("./scripts/032_classic_cleanup");',
    'const { Migration032ClassicCleanup } = require("./scripts/032_classic_cleanup");\nconst { Migration033ClassicPolishV2 } = require("./scripts/033_classic_polish_v2");'
  )
  .replace(
    'new Migration032ClassicCleanup()',
    'new Migration032ClassicCleanup(),\n  new Migration033ClassicPolishV2()'
  );
writeOut('app/dist/DataBase/migrations/MigrationRunner.js', migrationRunnerCode);

const deletePaths = [
  'client/overlay/resource/map/550.swf',
  'client/overlay/resource/map/733.swf',
  'client/overlay/resource/book/monsterBook.swf',
  'client/overlay/module/com/robot/module/book/PetAmalgamationBookPanel.swf',
  'client/overlay/module/com/robot/module/app/SptPanel.swf',
  'app/dist/GameServer/Game/Map/BeidouSeals.js'
];

const manifest = {
  release: 'classic-polish-v2-20261118',
  generatedAt: new Date().toISOString(),
  writtenFiles,
  deletePaths
};
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({release: manifest.release, writtenCount: writtenFiles.length, deleteCount: deletePaths.length}, null, 2));
