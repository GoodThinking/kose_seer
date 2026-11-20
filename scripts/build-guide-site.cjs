#!/usr/bin/env node
'use strict';

/**
 * Generates deploy/baseline/client/overlay/guide/guide-data.js
 * directly from the authoritative server baseline and NieoCore.swf.
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'deploy/baseline/app');
const CORE_SWF = path.join(ROOT, 'deploy/baseline/client/overlay/dll/NieoCore.swf');
const OUT_FILE = path.join(ROOT, 'deploy/baseline/client/overlay/guide/guide-data.js');

function readText(...parts) {
  return fs.readFileSync(path.join(APP_DIR, ...parts), 'utf8');
}

function readJson(...parts) {
  return JSON.parse(readText(...parts));
}

function parseAttrs(tag) {
  const out = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(tag))) out[m[1]] = m[2];
  return out;
}

function extractCoreXmls(swfPath) {
  const raw = fs.readFileSync(swfPath);
  const sig = raw.subarray(0, 3).toString('ascii');
  const body = sig === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
  const nbits = body[0] >> 3;
  let offset = Math.floor((5 + nbits * 4 + 7) / 8) + 4;
  const symbols = new Map();
  const binaries = new Map();
  while (offset < body.length) {
    const short = body.readUInt16LE(offset);
    offset += 2;
    const code = short >> 6;
    let size = short & 63;
    if (size === 63) {
      size = body.readUInt32LE(offset);
      offset += 4;
    }
    const payload = body.subarray(offset, offset + size);
    offset += size;
    if (code === 76) {
      const count = payload.readUInt16LE(0);
      let idx = 2;
      for (let i = 0; i < count; i++) {
        const tagId = payload.readUInt16LE(idx);
        const end = payload.indexOf(0, idx + 2);
        const name = payload.subarray(idx + 2, end).toString('utf8');
        symbols.set(name, tagId);
        idx = end + 1;
      }
    } else if (code === 87) {
      const tagId = payload.readUInt16LE(0);
      binaries.set(tagId, payload.subarray(6));
    } else if (code === 0) {
      break;
    }
  }
  return (symbol) => {
    const tagId = symbols.get(symbol);
    if (tagId === undefined || !binaries.has(tagId)) return '';
    return binaries.get(tagId).toString('utf8');
  };
}

function build() {
  const getCoreXml = extractCoreXmls(CORE_SWF);

  // 1. Elements & Natures
  const elementsRaw = readJson('config/data/json/elements.json');
  const typeNames = {};
  for (const t of elementsRaw.types) typeNames[t.id] = t.name;
  const naturesRaw = readJson('config/data/json/natures.json');

  // 2. Maps from NieoCore MapConfig
  const mapConfigXml = getCoreXml('com.robot.core.manager.map.config.MapConfig_xmlCls');
  const mapNames = {};
  for (const m of mapConfigXml.matchAll(/<map\b[^>]*>/g)) {
    const a = parseAttrs(m[0]);
    if (a.id && a.name) mapNames[Number(a.id)] = a.name;
  }
  const mapName = (id) => mapNames[id] || `地图 ${id}`;

  // 3. Items from items.xml
  const itemsXml = readText('config/data/xml/items.xml');
  const itemsById = {};
  const breedByItemId = {};
  for (const m of itemsXml.matchAll(/<Item\b[^>]*>/g)) {
    const a = parseAttrs(m[0]);
    if (a.ID) {
      const iid = Number(a.ID);
      itemsById[iid] = a.Name || `物品#${a.ID}`;
      if (a.BreedMonID && Number(a.BreedMonID) > 0) {
        breedByItemId[iid] = Number(a.BreedMonID);
      }
    }
  }
  const itemName = (id) => itemsById[id] || `道具#${id}`;

  // 4. Skills from skills.xml
  const skillsXml = readText('config/data/xml/skills.xml');
  const skillsById = {};
  for (const m of skillsXml.matchAll(/<Move\b[^>]*>/g)) {
    const a = parseAttrs(m[0]);
    if (a.ID) {
      skillsById[Number(a.ID)] = {
        id: Number(a.ID),
        name: a.Name || `技能#${a.ID}`,
        type: Number(a.Type || 0),
        category: Number(a.Category || 0),
        power: Number(a.Power || 0),
        maxPP: Number(a.MaxPP || 0),
      };
    }
  }

  // 5. Pets from pets.xml + PetBookXMLInfo
  const petsXml = readText('config/data/xml/pets.xml');
  const petAbilitiesRaw = readJson('config/data/json/pet_abilities.json');
  const typeAbilityByTypeId = {};
  const abilityDescByName = {};
  for (const ab of petAbilitiesRaw.abilities || []) {
    abilityDescByName[ab.name] = ab.description;
    if (ab.effectId === 2028 && Array.isArray(ab.args) && ab.args[0]) {
      typeAbilityByTypeId[Number(ab.args[0])] = ab.name;
    }
  }

  const petsById = {};
  const evolvesFrom = {};
  for (const m of petsXml.matchAll(/<Monster\b[^>]*>[\s\S]*?<\/Monster>/g)) {
    const openTag = m[0].match(/<Monster\b[^>]*>/)?.[0] || '';
    const a = parseAttrs(openTag);
    const id = Number(a.ID || 0);
    if (!id) continue;
    const evoTo = Number(a.EvolvesTo || 0);
    const evoLv = Number(a.EvolvingLv || 0);
    const stats = [
      Number(a.HP || 0),
      Number(a.Atk || 0),
      Number(a.Def || 0),
      Number(a.SpAtk || 0),
      Number(a.SpDef || 0),
      Number(a.Spd || 0),
    ];
    const total = stats.reduce((s, v) => s + v, 0);
    const learnMoves = [];
    for (const mm of m[0].matchAll(/<Move\b[^>]*>/g)) {
      const ma = parseAttrs(mm[0]);
      const mid = Number(ma.ID || 0);
      if (mid && skillsById[mid]) {
        learnMoves.push({ id: mid, lv: Number(ma.LearningLv || 0), ...skillsById[mid] });
      }
    }
    petsById[id] = {
      id,
      name: a.DefName || `精灵#${id}`,
      type: Number(a.Type || 0),
      typeName: typeNames[Number(a.Type || 0)] || '未知',
      stats,
      total,
      evolvesTo: evoTo,
      evolvingLv: evoLv,
      petClass: Number(a.PetClass || 0),
      catchRate: Number(a.CatchRate || 0),
      learnMoves,
    };
    if (evoTo) {
      if (!evolvesFrom[evoTo]) evolvesFrom[evoTo] = [];
      evolvesFrom[evoTo].push({ from: id, lv: evoLv });
    }
  }
  const petName = (id) => (petsById[id] ? petsById[id].name : `精灵#${id}`);

  // 6. Soul bead absorption maps from HatchTaskXMLInfo + exact hatchTaskMC (x,y) from map SWFs
  const saierhaoRoot = path.resolve(ROOT, '../..');
  const mapSwfDir = path.join(saierhaoRoot, 'work/client-lab/assets/resource/map');
  const hatchCoordCache = new Map();
  function findHatchCoord(mapId) {
    if (hatchCoordCache.has(mapId)) return hatchCoordCache.get(mapId);
    const swfPath = path.join(mapSwfDir, `${mapId}.swf`);
    if (!fs.existsSync(swfPath)) { hatchCoordCache.set(mapId, null); return null; }
    try {
      const raw = fs.readFileSync(swfPath);
      const body = raw.subarray(0, 3).toString('ascii') === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
      const nbits = body[0] >> 3;
      let off = Math.floor((5 + nbits * 4 + 7) / 8) + 4;
      let hit = null;
      function scan(buf, start, end) {
        let o = start;
        while (o < end && !hit) {
          const sh = buf.readUInt16LE(o); o += 2;
          const code = sh >> 6;
          let sz = sh & 63;
          if (sz === 63) { sz = buf.readUInt32LE(o); o += 4; }
          const p = buf.subarray(o, o + sz); o += sz;
          if (code === 0) break;
          if (code === 39) {
            scan(p, 4, p.length);
          } else if (code === 26 || code === 70) {
            const flags = p[0];
            let idx = (code === 70 ? 2 : 1) + 2;
            if (flags & 0x02) idx += 2;
            let tx = 0, ty = 0;
            if (flags & 0x04) {
              let bitPos = idx * 8;
              const readBits = (n) => {
                let v = 0;
                for (let i = 0; i < n; i++) { v = (v << 1) | ((p[bitPos >> 3] >> (7 - (bitPos & 7))) & 1); bitPos++; }
                return v;
              };
              const readSBits = (n) => {
                if (!n) return 0;
                let v = readBits(n);
                if (v & (1 << (n - 1))) v -= (1 << n);
                return v;
              };
              if (readBits(1)) { const nb = readBits(5); readSBits(nb); readSBits(nb); }
              if (readBits(1)) { const nb = readBits(5); readSBits(nb); readSBits(nb); }
              const nTrans = readBits(5);
              tx = readSBits(nTrans) / 20;
              ty = readSBits(nTrans) / 20;
              idx = Math.ceil(bitPos / 8);
            }
            if (flags & 0x08) {
              if (/hatchTask/i.test(p.toString('latin1'))) hit = { x: Math.round(tx), y: Math.round(ty) };
              continue;
            }
            if (flags & 0x10) idx += 2;
            if (flags & 0x20) {
              const endStr = p.indexOf(0, idx);
              if (endStr > idx && p.subarray(idx, endStr).toString('utf8').toLowerCase().includes('hatch')) {
                hit = { x: Math.round(tx), y: Math.round(ty) };
              }
            }
          }
        }
      }
      scan(body, off, body.length);
      if (hit) {
        const cx = Math.max(52, Math.min(908, hit.x));
        const cy = Math.max(48, Math.min(512, hit.y));
        hit = { x: cx, y: cy, pctX: Number(((cx / 960) * 100).toFixed(1)), pctY: Number(((cy / 560) * 100).toFixed(1)) };
      }
      hatchCoordCache.set(mapId, hit);
      return hit;
    } catch {
      hatchCoordCache.set(mapId, null);
      return null;
    }
  }

  const hatchXml = getCoreXml('com.robot.core.config.xml.HatchTaskXMLInfo_xmlClass');
  const hatchBeads = [];
  const hatchById = {};
  const taskBlocks = hatchXml.matchAll(/<task\b([^>]*)>([\s\S]*?)<\/task>/g);
  for (const m of taskBlocks) {
    const a = parseAttrs(m[1]);
    const id = Number(a.ID || 0);
    if (!id) continue;
    const steps = [];
    for (const pm of m[2].matchAll(/<pro\b[^>]*>/g)) {
      const pa = parseAttrs(pm[0]);
      const mid = Number(pa.map || 0);
      if (!mid) continue;
      const prev = steps.find((s) => s.mapId === mid);
      if (prev) {
        prev.times = (prev.times || 1) + 1;
      } else {
        const coord = findHatchCoord(mid);
        steps.push({
          step: steps.length + 1,
          mapId: mid,
          mapName: mapName(mid),
          times: 1,
          coord,
          desc: pa.des || '',
        });
      }
    }
    const entry = {
      id,
      name: a.name || itemName(id),
      steps,
    };
    hatchBeads.push(entry);
    hatchById[id] = entry;
  }

  // 7. Fusion recipes from PetFusionHandler.js
  const fusionSrc = readText('dist/GameServer/Server/Packet/Recv/Pet/PetFusionHandler.js');
  const parseConstBlock = (constName) => {
    const re = new RegExp(`const\\s+${constName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`);
    const m = fusionSrc.match(re);
    if (!m) return [];
    // Safe evaluation of pure literal array from trusted local repo file
    return Function(`"use strict"; return (${m[1]});`)();
  };
  const fixedRecipesRaw = parseConstBlock('RECIPES');
  const miraclesRaw = parseConstBlock('MIRACLES');

  const fixedRecipes = fixedRecipesRaw.map((r, idx) => ({
    index: idx + 1,
    mainId: r.main[0],
    mainName: petName(r.main[0]),
    mainType: petsById[r.main[0]]?.typeName || '',
    subIds: r.sub,
    subNames: r.sub.map(petName),
    essenceId: r.essence,
    essenceName: itemName(r.essence),
    soulId: r.soul,
    soulName: hatchById[r.soul]?.name || itemName(r.soul),
    absorbMaps: (hatchById[r.soul]?.steps || []).map((s) => `${s.mapName}(${s.mapId})`),
    petId: r.pet,
    petName: petName(r.pet),
    rare: r.rare
      ? {
          soulId: r.rare.soul,
          soulName: hatchById[r.rare.soul]?.name || itemName(r.rare.soul),
          petId: r.rare.pet,
          petName: petName(r.rare.pet),
          chance: `${((r.rare.numerator / r.rare.denominator) * 100).toFixed(0)}%`,
        }
      : null,
  }));

  const miracleRecipes = miraclesRaw.map((m, idx) => {
    const totalW = m.weights.reduce((s, [, w]) => s + w, 0);
    const merged = new Map();
    for (const [pid, w] of m.weights) merged.set(pid, (merged.get(pid) || 0) + w);
    return {
      index: idx + 1,
      mainId: m.main,
      mainName: petName(m.main),
      subTypeId: m.type,
      subTypeName: typeNames[m.type] || `系别${m.type}`,
      essenceId: m.essence,
      essenceName: itemName(m.essence),
      soulId: m.soul,
      soulName: hatchById[m.soul]?.name || itemName(m.soul),
      absorbMaps: (hatchById[m.soul]?.steps || []).map((s) => `${s.mapName}(${s.mapId})`),
      pool: [...merged.entries()]
        .map(([pid, w]) => ({
          petId: pid,
          petName: petName(pid),
          rate: Number(((w / totalW) * 100).toFixed(2)),
        }))
        .sort((a, b) => b.rate - a.rate),
    };
  });

  // 8. Countermarks from countermarks.json
  const countermarksRaw = readJson('config/data/json/countermarks.json');
  const markTierLabel = {
    1: '微型',
    2: '小型',
    3: '中型',
    4: '大型',
    5: '双属性',
  };
  const countermarks = countermarksRaw.marks.map((mk) => ({
    id: mk.id,
    name: mk.name,
    short: mk.short || '',
    kind: mk.kind, // ability | skill
    tier: mk.tier || 0,
    tierLabel: mk.kind === 'ability'
      ? (markTierLabel[mk.tier] || '能力')
      : mk.bossPetId ? 'BOSS专属' : mk.skillType ? '属性通用' : '基础/主宠',
    price: mk.price || 0,
    minLevel: mk.minLevel || 100,
    description: mk.description || '',
    source: mk.source || (mk.price > 0 ? `${mk.price} 赛尔豆兑换` : 'SPT BOSS 掉落'),
    bossPetId: mk.bossPetId || 0,
    bossPetName: mk.bossPetId ? petName(mk.bossPetId) : '',
    skillType: mk.skillType || 0,
    skillTypeName: mk.skillType ? (typeNames[mk.skillType] || '') : '',
    skillIds: mk.skillIds || [],
    skillNames: (mk.skillIds || []).map((sid) => skillsById[sid]?.name || `技能#${sid}`),
    bonus: {
      hp: mk.hp || 0,
      atk: mk.atk || 0,
      def: mk.def || 0,
      spAtk: mk.spAtk || 0,
      spDef: mk.spDef || 0,
      speed: mk.speed || 0,
      powerBonus: mk.powerBonus || 0,
    },
  }));

  // Map bossPetId -> exclusive countermark
  const exclusiveMarkByBossPet = {};
  for (const mk of countermarks) {
    if (mk.bossPetId) {
      if (!exclusiveMarkByBossPet[mk.bossPetId]) exclusiveMarkByBossPet[mk.bossPetId] = [];
      exclusiveMarkByBossPet[mk.bossPetId].push({ id: mk.id, name: mk.name, desc: mk.description });
    }
  }

  // 9. Bosses from boss_abilities.json + puni_config.json + alder_config.json
  const bossRaw = readJson('config/data/json/boss_abilities.json');
  const puniRaw = readJson('config/data/json/puni_config.json');
  const alderRaw = readJson('config/data/json/alder_config.json');

  const DARK_TIER = (param2) => {
    if (param2 <= 1019) return '暗黑·初阶';
    if (param2 <= 1044) return '暗黑·高阶';
    return '暗黑·终阶(两命)';
  };

  function classifyBoss(b) {
    if (b.mapId === 514) return 'puni';
    if (b.mapId === 677) return 'alder';
    if (b.mapId === 102 && b.param2 >= 201 && b.param2 <= 217) return 'train_normal';
    if (b.mapId === 102 && b.param2 >= 301 && b.param2 <= 317) return 'train_hero';
    if (b.mapId === 110) return 'dark';
    if ([684, 686].includes(b.mapId)) return 'story';
    if ([348, 331, 405, 438, 401, 430, 415, 411, 414, 445, 486, 450, 495, 9507, 441, 318].includes(b.mapId)) return 'star';
    return 'classic';
  }

  const bosses = [];
  for (const b of bossRaw.bossConfigs) {
    if (!b.hint && !b.spt && !b.mechanics?.signature) continue;
    // Exclude non-SPT catchable wild/mechanism encounters (依依 12/1、小莹蜂 26/0、达比拉 53/0)
    if (!b.spt && b.catchable !== false && !b.customHP) continue;
    const cat = classifyBoss(b);
    const pInfo = petsById[b.petId] || {};
    const sig = b.mechanics?.signature || null;
    const sptId = b.spt?.sptId || 0;
    const canDropCountermark = sptId >= 1 && sptId <= 200;
    let genericDropPool = '';
    if (canDropCountermark) {
      if (b.level <= 49) genericDropPool = '中型能力刻印 (15%)';
      else if (b.level <= 84) genericDropPool = '中型 / 双属性 / 15系属性刻印 (15%)';
      else genericDropPool = '大型 / 双属性 / 15系属性刻印 (15%)';
    }
    const rewardText = [];
    if (b.spt?.rewardPetId) rewardText.push(`首胜精灵：${petName(b.spt.rewardPetId)}`);
    if (b.spt?.rewardItemId) rewardText.push(`首胜道具：${itemName(b.spt.rewardItemId)}`);
    if (!b.spt && b.catchable !== false) rewardText.push('战斗中可直接捕捉');

    // Title override for Puni / Alder / Train / Dark
    let subtitle = '';
    if (cat === 'puni') {
      const seal = puniRaw.puniSeals.find((s) => s.doorIndex === b.param2);
      if (seal) subtitle = `第 ${seal.doorIndex} 封印 · ${seal.name}`;
    } else if (cat === 'alder') {
      const tr = alderRaw.trials.find((t) => t.doorIndex === b.param2);
      subtitle = tr ? `试炼 ${tr.doorIndex} · ${tr.name}` : '奥尔德真身 (五命)';
    } else if (cat === 'train_normal') {
      subtitle = `训练师之门 · 普通第 ${b.param2 - 200} 门`;
    } else if (cat === 'train_hero') {
      subtitle = `训练师之门 · 勇者第 ${b.param2 - 300} 门`;
    } else if (cat === 'dark') {
      subtitle = DARK_TIER(b.param2);
    } else if (cat === 'story') {
      subtitle = b.mapId === 686 && b.param2 === 1 ? '剧情首领 · 火之果弱化形态' : '剧情首领';
    } else if (cat === 'star') {
      subtitle = '星系霸主 / 守护兽';
    } else {
      subtitle = sptId ? `经典 SPT #${sptId}` : '经典首领';
    }

    bosses.push({
      key: `${b.mapId}/${b.param2}`,
      mapId: b.mapId,
      mapName: mapName(b.mapId),
      param2: b.param2,
      petId: b.petId,
      name: b.petName || pInfo.name || `BOSS#${b.petId}`,
      subtitle,
      category: cat,
      typeName: pInfo.typeName || '',
      level: b.level,
      hp: b.customHP || 0,
      extraLives: b.mechanics?.extraLives || 0,
      sptId,
      signatureId: sig?.id || '',
      hint: b.hint || b.comment || '',
      comment: b.comment || '',
      rewards: rewardText,
      exclusiveMarks: canDropCountermark ? (exclusiveMarkByBossPet[b.petId] || []) : [],
      genericDropPool,
      catchable: !b.spt && b.catchable !== false,
      skills: (b.skills || []).map((sid) => skillsById[sid]?.name || `#${sid}`),
    });
  }

  // 10. Pet Acquisition Index (every obtainable pet + sources)
  const petSources = new Map();
  const addSource = (pid, kind, label, detail) => {
    const id = Number(pid);
    if (!id || !petsById[id]) return;
    if (!petSources.has(id)) petSources.set(id, []);
    const arr = petSources.get(id);
    if (!arr.some((x) => x.kind === kind && x.label === label && x.detail === detail)) {
      arr.push({ kind, label, detail });
    }
  };

  // 10a. Wild spawns (map-ogres.json)
  const ogresRaw = readJson('config/data/json/map-ogres.json');
  const wildMaps = [];
  for (const [midStr, entry] of Object.entries(ogresRaw.maps || {})) {
    const mid = Number(midStr);
    if (mid >= 9700) continue; // classic edition
    if (!entry.spawnCount || entry.spawnProbability === 0) continue;
    const active = (entry.ogres || []).filter(
      (o) => o.catchable !== false && !o.isBoss && (o.weight || 0) > 0 && o.refreshConfig?.enabled
    );
    if (!active.length) continue;
    const totalW = active.reduce((s, o) => s + (o.weight || 1), 0);
    const list = [];
    for (const o of active) {
      const pct = Number((((o.weight || 1) / totalW) * 100).toFixed(1));
      const lv = o.level ? `Lv.${o.level}` : `Lv.${o.minLevel || 1}~${o.maxLevel || 1}`;
      const isRare = pct < 15;
      const label = `${entry.name || mapName(mid)}(${mid})`;
      const detail = `${lv} · 权重占比 ${pct}%${o.shiny ? ' · 闪光' : isRare ? ' · 稀有' : ''}`;
      addSource(o.petId, 'wild', label, detail);
      list.push({ petId: o.petId, petName: petName(o.petId), lv, pct, rare: isRare, shiny: !!o.shiny });
    }
    wildMaps.push({ mapId: mid, mapName: entry.name || mapName(mid), pets: list });
  }

  // 10b. pet-acquisition.json (disguises, special wild, mechanisms)
  const acqRaw = readJson('config/data/json/pet-acquisition.json');
  for (const d of acqRaw.disguises || []) {
    const hosts = (d.hostIds || []).map(petName).join('、');
    addSource(d.petId, 'mechanism', '野外变身遭遇', `进战 ${(d.probability * 100).toFixed(0)}% 变身 (Lv.${d.level})，宿主：${hosts}`);
  }
  for (const w of acqRaw.wild || []) {
    const extra = w.rareProbability ? `稀有 ${(w.rareProbability * 100).toFixed(0)}%` : `权重 ${w.weight}`;
    addSource(w.petId, 'wild', `${w.name || mapName(w.mapId)}(${w.mapId})`, `Lv.${w.minLevel}~${w.maxLevel} · ${extra}`);
  }
  for (const m of acqRaw.mechanisms || []) {
    addSource(m.petId, 'mechanism', `${mapName(m.mapId)}(${m.mapId}) 场景机关`, `触发机关遭遇 Lv.${m.level}（可捕捉）`);
  }
  addSource(83, 'mechanism', `${mapName(12)}(12) 火焰喷射机关`, '穿戴火焰喷射器灼烧林间草丛触发依依逃出（Lv.5 可捕捉）');

  // 10c. Bosses (rewardPet, rewardItem essence, catchable)
  for (const b of bosses) {
    if (b.catchable) {
      addSource(b.petId, 'boss', `${b.mapName}(${b.mapId}) BOSS捕捉`, `Lv.${b.level} · 战斗中直接捕捉`);
    }
  }
  for (const b of bossRaw.bossConfigs) {
    if (b.spt?.rewardPetId) {
      addSource(b.spt.rewardPetId, 'boss', `SPT 首胜 · ${b.petName || petName(b.petId)}`, `${mapName(b.mapId)}(${b.mapId}) 击败直接获得`);
    }
    if (b.spt?.rewardItemId) {
      // Link essence item name back to boss and its hatched base form (BreedMonID)
      const iname = itemName(b.spt.rewardItemId);
      const bname = b.petName || petName(b.petId);
      const detail = `${mapName(b.mapId)}(${b.mapId}) 首胜获「${iname}」分子转化仪孵化`;
      addSource(b.petId, 'boss', `SPT 精元 · ${bname}`, detail);
      const hatchedId = breedByItemId[b.spt.rewardItemId];
      if (hatchedId && hatchedId !== b.petId) {
        addSource(hatchedId, 'boss', `SPT 精元 · ${bname}`, detail);
      }
    }
  }
  const gpRewardsSrc = readText('dist/GameServer/Game/Map/GameplayRewards.js');
  for (const m of gpRewardsSrc.matchAll(/itemId:\s*(\d+)/g)) {
    const iid = Number(m[1]);
    const hatchedId = breedByItemId[iid];
    if (hatchedId) {
      addSource(hatchedId, 'boss', `剧情首领首胜 · ${itemName(iid)}`, `击败对应剧情/特殊首领获「${itemName(iid)}」分子转化仪孵化`);
    }
  }

  // 10d. Fusion
  for (const r of fixedRecipes) {
    addSource(r.petId, 'fusion', `固定融合 · ${r.soulName}`, `${r.mainName} + ${r.subNames[0]}一族 + ${r.essenceName}`);
    if (r.rare) {
      addSource(r.rare.petId, 'fusion', `稀有异变 · ${r.rare.soulName}`, `${r.mainName} + ${r.subNames[0]}一族 (${r.rare.chance} 异变)`);
    }
  }
  for (const m of miracleRecipes) {
    for (const p of m.pool) {
      addSource(p.petId, 'fusion', `奇迹融合 · ${m.mainName}`, `${m.mainName} + ${m.subTypeName}系/尼尔 (${p.rate}%)`);
    }
  }
  for (const pid of [325, 328, 330]) {
    addSource(pid, 'fusion', '通用兜底 · 米色元神珠', '任意非配方主宠 + 可融合副宠随机产出 (各 33.3%)');
  }

  // 10e. Special evolutions
  const specEvoRaw = readJson('config/data/json/special-evolutions.json');
  const specialEvolutions = [];
  for (const [branchId, entries] of Object.entries(specEvoRaw.branches || {})) {
    for (const e of entries) {
      const need = e.itemId ? `${itemName(e.itemId)} ×${e.count}` : '无额外道具（满足条件/进化舱分支）';
      addSource(e.petId, 'evolve', `特殊进化分支 #${branchId}`, need);
      specialEvolutions.push({
        branchId: Number(branchId),
        petId: e.petId,
        petName: petName(e.petId),
        itemId: e.itemId,
        itemName: e.itemId ? itemName(e.itemId) : '无',
        count: e.count,
      });
    }
  }

  // 10f. CollectReward (实验室收集 + 初始补领 + 精灵王之战)
  const collectMod = require(path.join(APP_DIR, 'dist/GameServer/Game/Pet/CollectReward.js'));
  const collectGroups = [
    { id: 1, title: '实验室收集 · 第 1 组（三主宠任选）', condition: '集齐 10 个经典初始生态家族（且尚未拥有所选主宠家族）', rewards: collectMod.COLLECT_GROUPS[1].rewardIds.map((id) => ({ id, name: petName(id) })), families: collectMod.COLLECT_GROUPS[1].families.map((f) => f.map(petName).join('/')) },
    { id: 2, title: '实验室收集 · 第 2 组', condition: '集齐仙人球/卡斯达克/吉尔等 3 个指定家族', rewards: collectMod.COLLECT_GROUPS[2].rewardIds.map((id) => ({ id, name: petName(id) })), families: collectMod.COLLECT_GROUPS[2].families.map((f) => f.map(petName).join('/')) },
    { id: 3, title: '实验室收集 · 第 3 组', condition: '集齐依依/小鳍鱼/丁鲁特等 7 个指定家族', rewards: collectMod.COLLECT_GROUPS[3].rewardIds.map((id) => ({ id, name: petName(id) })), families: collectMod.COLLECT_GROUPS[3].families.map((f) => f.map(petName).join('/')) },
    { id: 4, title: '实验室收集 · 第 4 组', condition: '集齐 9 个指定进阶家族', rewards: collectMod.COLLECT_GROUPS[4].rewardIds.map((id) => ({ id, name: petName(id) })), families: collectMod.COLLECT_GROUPS[4].families.map((f) => f.map(petName).join('/')) },
    { id: 5, title: '实验室补领 · 缺失初始精灵', condition: '背包与仓库均已没有某初始精灵一族时，点击实验室左上角柜子触发博士对话补领（每族限 1 次）', rewards: [1, 4, 7].map((id) => ({ id, name: petName(id) })), families: [] },
    { id: 301, title: '精灵王之战 · 10 胜奖励', condition: '在太空站(102)精灵王之战累计获胜 10 场，领取尚未拥有的三主宠', rewards: [1, 4, 7].map((id) => ({ id, name: petName(id) })), families: [] },
  ];
  for (const g of collectGroups) {
    for (const r of g.rewards) addSource(r.id, 'collect', g.title, g.condition);
  }
  for (const id of [1, 4, 7]) addSource(id, 'starter', '初始精灵', '创建角色时三选一获得');

  // 10g. Star Arena
  const starArenaRaw = readJson('dist/GameServer/Game/Battle/StarArenaCatalog.json');
  const starArenas = (starArenaRaw.arenas || []).map((a) => {
    addSource(a.rewardPetId, 'arena', `星系擂台 · ${a.name || mapName(a.mapId)}`, `连胜 ${a.trainers.length} 位擂主通关，领取 Lv.100 满个体冠军精灵`);
    return {
      id: a.id,
      name: a.name || mapName(a.mapId),
      mapId: a.mapId,
      entryMapId: a.entryMapId,
      entryMapName: mapName(a.entryMapId),
      rewardPetId: a.rewardPetId,
      rewardPetName: petName(a.rewardPetId),
      rewardSkills: (a.rewardSkills || []).map((sid) => skillsById[sid]?.name || `#${sid}`),
      trainers: (a.trainers || []).map((t) => ({
        id: t.id,
        name: t.name,
        title: t.title,
        description: t.description,
        quote: t.quote,
        team: (t.team || []).map((p) => petName(p.petId)),
      })),
    };
  });

  // 10h. Sea Vortex & Story Encounters
  const seaVortex = readJson('config/data/json/sea_vortex.json');
  const seaTotalW = seaVortex.rewards.reduce((s, r) => s + r.weight, 0);
  for (const r of seaVortex.rewards) {
    if (r.petId) {
      addSource(r.petId, 'mechanism', `深海漩涡救援(${seaVortex.mapId})`, `Lv.${r.level} · 相对权重 ${((r.weight / seaTotalW) * 100).toFixed(1)}%`);
    }
  }
  const storyEncounters = readJson('config/data/json/story_encounters.json');
  for (const se of storyEncounters) {
    if (se.capture) {
      const cond = se.requiresSuperNoNo
        ? '需超能 NoNo'
        : se.requiredClothId
        ? `需装备 ${itemName(se.requiredClothId)}`
        : se.requiredItems
        ? `需道具 ${se.requiredItems.map((x) => itemName(x.itemId)).join('+')}`
        : '触发地图机关';
      addSource(se.petId, 'mechanism', `${mapName(se.mapId)}(${se.mapId}) 特殊遭遇`, `Lv.${se.level} · ${cond}（可捕捉）`);
    }
  }

  // 10i. Tasks rewards
  const tasksRaw = readJson('config/data/json/tasks.json');
  for (const [tid, t] of Object.entries(tasksRaw.tasks || {})) {
    for (const p of t.rewards?.pets || []) {
      addSource(p.petId, 'task', `任务 #${tid}`, t.name ? `完成任务「${t.name}」获得` : '完成主线/支线任务获得');
    }
  }

  // 10j. Propagate evolution sources so players searching final forms immediately see how to get them!
  for (let pass = 0; pass < 3; pass++) {
    for (const [pidStr, p] of Object.entries(petsById)) {
      const pid = Number(pidStr);
      if (petSources.has(pid)) continue;
      const prevs = evolvesFrom[pid] || [];
      for (const pr of prevs) {
        if (petSources.has(pr.from)) {
          const lvStr = pr.lv ? `Lv.${pr.lv} ` : '';
          addSource(pid, 'evolve', `由 ${petName(pr.from)} 进化`, `${petName(pr.from)}(#${pr.from}) ${lvStr}进化获得`);
        }
      }
    }
  }

  // Attach wild capture source to each Miracle Fusion main pet
  for (const m of miracleRecipes) {
    let cur = m.mainId;
    const seen = new Set([cur]);
    while (evolvesFrom[cur]?.length && !seen.has(evolvesFrom[cur][0].from)) {
      cur = evolvesFrom[cur][0].from;
      seen.add(cur);
    }
    const baseSrcs = petSources.get(cur) || [];
    const wildSrc = baseSrcs.find((s) => s.kind === 'wild' || s.kind === 'mechanism') || baseSrcs[0];
    m.mainSource = wildSrc
      ? cur !== m.mainId
        ? `${wildSrc.label} 抓「${petName(cur)}」进化`
        : `${wildSrc.label} 直接捕捉`
      : '野外可重复捕捉';
  }

  // Helper: trace to final evolution form and compute tailored build guide
  function getFinalForm(pet) {
    let cur = pet;
    const visited = new Set([cur.id]);
    while (cur.evolvesTo && petsById[cur.evolvesTo] && !visited.has(cur.evolvesTo)) {
      visited.add(cur.evolvesTo);
      cur = petsById[cur.evolvesTo];
    }
    return cur;
  }

  function computePetBuild(pet) {
    const fin = getFinalForm(pet);
    const [hp, atk, def, spAtk, spDef, spd] = fin.stats;
    const typeAb = typeAbilityByTypeId[fin.type];
    const maxOff = Math.max(atk, spAtk);
    const maxDef = Math.max(def, spDef);
    const isPhys = atk >= spAtk;
    const isMixed = Math.abs(atk - spAtk) < 8;
    const isTank = (hp >= 115 && maxDef >= maxOff + 8) || (maxDef >= maxOff + 18);
    const isFast = spd >= 90;

    let role, ev, evAlt, natures, abilities, abilityMark;
    if (isTank) {
      role = '高防肉盾 / 消耗辅助';
      const mainDef = def >= spDef ? '防御' : '特防';
      ev = `体力 255 + ${mainDef} 255`;
      evAlt = `体力 255 + ${isPhys ? '攻击' : '特攻'} 255`;
      natures = def >= spDef
        ? ['大胆（防御+ 攻击-）', '顽皮（防御+ 特攻-）']
        : ['沉着（特防+ 攻击-）', '慎重（特防+ 特攻-）'];
      abilities = ['坚硬', '回神', '回避', '汲取'];
      abilityMark = '大型体力 / 双防双属性刻印';
    } else if (isMixed) {
      role = isFast ? '高速双攻均衡' : '重装双攻均衡';
      ev = isFast ? `${isPhys ? '攻击' : '特攻'} 255 + 速度 255` : `${isPhys ? '攻击' : '特攻'} 255 + 体力 255`;
      evAlt = '攻击/特攻 按配招二选一 + 体力 255';
      natures = isFast
        ? ['急躁（速度+ 防御-）', '天真（速度+ 特防-）', isPhys ? '固执（攻击+ 特攻-）' : '保守（特攻+ 攻击-）']
        : [isPhys ? '固执（攻击+ 特攻-）' : '保守（特攻+ 攻击-）', '平衡型（认真/坦率）'];
      abilities = [typeAb, '汲取', '会心', '精准'].filter(Boolean);
      abilityMark = isFast ? '双攻速度 / 大型速度刻印' : '大型体力 / 攻体双属性刻印';
    } else if (isPhys) {
      role = isFast ? '高速物攻输出' : '重装物攻输出';
      ev = isFast ? '攻击 255 + 速度 255' : '攻击 255 + 体力 255';
      evAlt = isFast ? '攻击 255 + 体力 255（打BOSS更稳）' : `攻击 255 + ${def >= spDef ? '防御' : '特防'} 255`;
      natures = isFast
        ? ['开朗（速度+ 特攻-）', '固执（攻击+ 特攻-）']
        : ['固执（攻击+ 特攻-）', '勇敢（攻击+ 速度-）'];
      abilities = isFast
        ? [typeAb, '汲取', '会心', '瞬杀'].filter(Boolean)
        : ['坚硬', '汲取', '反击', typeAb].filter(Boolean);
      abilityMark = isFast ? '大型攻击 / 疾风攻击双属性刻印' : '大型攻击 / 体力攻击双属性刻印';
    } else {
      role = isFast ? '高速特攻输出' : '重装特攻输出';
      ev = isFast ? '特攻 255 + 速度 255' : '特攻 255 + 体力 255';
      evAlt = isFast ? '特攻 255 + 体力 255（打BOSS更稳）' : `特攻 255 + ${spDef >= def ? '特防' : '防御'} 255`;
      natures = isFast
        ? ['胆小（速度+ 攻击-）', '保守（特攻+ 攻击-）']
        : ['保守（特攻+ 攻击-）', '冷静（特攻+ 速度-）'];
      abilities = isFast
        ? [typeAb, '汲取', '会心', '精准'].filter(Boolean)
        : ['坚硬', '汲取', '反攻', typeAb].filter(Boolean);
      abilityMark = isFast ? '大型特攻 / 疾风特攻双属性刻印' : '大型特攻 / 体力特攻双属性刻印';
    }

    // Check matching exclusive or starter skill countermarks for final form
    const matchedMarks = [];
    const finSkillIds = new Set((fin.learnMoves || []).map((m) => m.id));
    for (const mk of countermarks) {
      if (mk.kind === 'skill' && mk.bossPetId === fin.id) {
        matchedMarks.push(`${mk.name}（${mk.description}）`);
      } else if (mk.kind === 'skill' && mk.skillIds.length && mk.skillIds.some((sid) => finSkillIds.has(sid)) && mk.id >= 20011 && mk.id <= 20013) {
        matchedMarks.push(`${mk.name}（${mk.description}）`);
      }
    }
    if (!matchedMarks.length && fin.type >= 1 && fin.type <= 15) {
      const typeMark = countermarks.find((mk) => mk.kind === 'skill' && mk.skillType === fin.type);
      if (typeMark) matchedMarks.push(`${typeMark.name}（${typeMark.description}）`);
    }

    // Pick top 4 notable learnable moves from final form (highest power matching category + top status move)
    const preferredCat = isPhys ? 1 : 2;
    const moves = fin.learnMoves || [];
    const topAtkMoves = moves
      .filter((m) => m.power > 0 && (isMixed || m.category === preferredCat))
      .sort((a, b) => (b.type === fin.type ? 1 : 0) - (a.type === fin.type ? 1 : 0) || b.power - a.power)
      .slice(0, 3);
    const topStatusMoves = moves
      .filter((m) => m.category === 4)
      .sort((a, b) => b.lv - a.lv)
      .slice(0, 2);
    const topSkills = [...topAtkMoves, ...topStatusMoves]
      .slice(0, 4)
      .map((m) => `${m.name}${m.power ? `(威${m.power})` : '(属性)'}`);

    return {
      basedOn: fin.id !== pet.id ? `${fin.name}(#${fin.id})` : '',
      role,
      ev,
      evAlt,
      natures,
      abilities: abilities.slice(0, 4).map((name) => ({ name, desc: abilityDescByName[name] || '' })),
      marks: [abilityMark, ...matchedMarks],
      topSkills,
    };
  }

  // Build final searchable pets list (all pets that have at least 1 source in the server)
  const petsList = [];
  for (const [pid, sources] of petSources.entries()) {
    const p = petsById[pid];
    if (!p) continue;
    petsList.push({
      id: p.id,
      name: p.name,
      type: p.type,
      typeName: p.typeName,
      total: p.total,
      stats: p.stats,
      evolvesTo: p.evolvesTo ? { id: p.evolvesTo, name: petName(p.evolvesTo), lv: p.evolvingLv } : null,
      evolvesFrom: (evolvesFrom[pid] || []).map((x) => ({ id: x.from, name: petName(x.from), lv: x.lv })),
      sources,
      build: computePetBuild(p),
    });
  }
  petsList.sort((a, b) => a.id - b.id);

  // 11. Mining & Material Sources
  const miningRaw = readJson('config/data/json/mining.json');
  const miningSites = (miningRaw.sites || []).map((s) => ({
    mapId: s.mapId,
    mapName: mapName(s.mapId),
    itemId: s.itemId,
    itemName: itemName(s.itemId),
    tool: s.toolId ? itemName(s.toolId) : s.byHand ? (s.superOnly ? '徒手采集（需超能NoNo）' : '徒手采集') : s.nono === 'super' ? '超能NoNo采集' : '普通NoNo采集',
    count: s.count,
  }));

  const matRaw = readJson('config/data/json/material-sources.json');
  const materialDrops = (matRaw.wildDrops || []).map((d) => ({
    mapId: d.mapId,
    mapName: mapName(d.mapId),
    petId: d.petId,
    petName: petName(d.petId),
    itemId: d.itemId,
    itemName: itemName(d.itemId),
    rate: `${Math.round((matRaw.dropProbability || 0.45) * 100)}%`,
  }));
  const materialBossDrops = (matRaw.bossDrops || []).map((d) => ({
    mapId: d.mapId,
    mapName: mapName(d.mapId),
    petId: d.petId,
    petName: petName(d.petId),
    itemId: d.itemId,
    itemName: itemName(d.itemId),
    rate: `${Math.round((d.probability || 0.45) * 100)}%`,
  }));
  const materialGames = (matRaw.games || []).map((g) => ({
    mapId: g.mapId,
    mapName: mapName(g.mapId),
    gameId: g.gameId,
    itemId: g.itemId,
    itemName: itemName(g.itemId),
    maxCount: g.maxCount,
    rate: `${Math.round((g.probability || 1) * 100)}%`,
    superNono: !!g.superNono,
  }));

  // 12. Curated Planet Terrain & Mechanism Puzzles (grounded 100% in MapProcess_*.as & server configs)
  const kingTower = readJson('config/data/json/king_tower.json');
  const closedSpace = readJson('config/data/json/closed_space.json');
  const mechanisms = [
    {
      id: 'kls-swamp',
      category: 'terrain',
      title: '克洛斯星沼泽 · 地形通行装备',
      mapId: 11,
      mapName: mapName(11),
      tag: '地形通行机关',
      summary: '直接踏入克洛斯星沼泽会被拦住，需先穿戴机械室领取的防陷/沼泽通行装备。',
      steps: [
        '前往飞船机械室(地图 8)的特殊装置领取舱，免费领取并穿戴对应地形装备。',
        '回到克洛斯星(10)进入克洛斯星沼泽(11)，即可自由通行、捕捉仙人球与小豆芽（本服小豆芽刷新率已提升至 13.6%）。',
      ],
      rewards: ['解锁克洛斯星沼泽(11)通行', '捕捉小豆芽 / 仙人球'],
    },
    {
      id: 'mogu-shield',
      category: 'terrain',
      title: '克洛斯星林间 · 拉藤条、破护罩与依依',
      mapId: 12,
      mapName: mapName(12),
      tag: '三大复合机关',
      summary: '林间集成了拉藤条降石块、蘑菇怪五发破护罩、火焰喷射器引出依依三套原版地形机关。',
      steps: [
        '【拉藤条取纤维】依次拉动场景垂下的藤条（拉过的需换下一根），全部拉动后石块降下，点击石块获取植物纤维（防寒服任务材料）。',
        '【破蘑菇怪护罩】对蘑菇怪护罩连续头部射击 5 发（护罩独立体力 100，每发 20）击碎护罩后即可挑战 SPT 蘑菇怪。',
        '【引出稀有依依】穿戴机械室领取的火焰喷射器，灼烧林间草丛触发依依逃出演出，点击即可捕捉依依(#83)。',
      ],
      rewards: ['植物纤维', '蘑菇怪精元', '依依 (#83，可捕捉)'],
      demo: {
        mapId: 12,
        actions: [
          { type: 'click', x: 750, y: 165, label: '① 依次拉动垂下的藤条，降下石块取植物纤维' },
          { type: 'shoot', x: 250, y: 245, label: '② 对蘑菇怪护罩连续头部射击 5 发击碎护罩' },
          { type: 'shoot', x: 460, y: 390, label: '③ 装备火焰喷射器灼烧草丛，引出可捕捉依依' },
        ],
      },
    },
    {
      id: 'kls-diamond',
      category: 'terrain',
      title: '克洛斯星密林 · 连续点击采金刚石',
      mapId: 13,
      mapName: mapName(13),
      tag: '矿石互动机关',
      summary: '密林矿石需在 2.5 秒以上连续点击挖掘，产出克洛斯金刚石。',
      steps: [
        '前往克洛斯星密林(地图 13)，点击场景中的金刚石矿脉。',
        '持续快速点击矿石（超过 2.5 秒），按得分折算产出克洛斯金刚石（单次最多 3 个）。',
      ],
      rewards: ['克洛斯金刚石 (#400022)'],
    },
    {
      id: 'volcano-rock',
      category: 'terrain',
      title: '火山星山洞 · 三击岩石开启深处通道',
      mapId: 16,
      mapName: mapName(16),
      tag: '隐藏通道机关',
      summary: '火山星深处(17)入口被巨石封堵，需手动点击岩石三次才能打开通路。',
      steps: [
        '进入火山星山洞(地图 16)，找到封住洞口的岩石。',
        '连续点击该岩石 3 次，巨石碎裂后露出「前往火山星深处」传送点。',
        '山洞内同时是上古炎兽挑战点，以及红色元神珠原版吸收地图。',
      ],
      rewards: ['开启火山星深处(17)', '挑战上古炎兽'],
      demo: {
        mapId: 16,
        actions: [
          { type: 'click', x: 479, y: 115, label: '① 点击封洞岩石 (1/3)' },
          { type: 'click', x: 479, y: 115, label: '② 再次点击岩石 (2/3)' },
          { type: 'click', x: 479, y: 115, label: '③ 第 3 次击碎岩石，露出深处通道' },
        ],
      },
    },
    {
      id: 'volcano-deep-rescue',
      category: 'terrain',
      title: '火山星深处 · 铺路灭火营救海盗',
      mapId: 17,
      mapName: mapName(17),
      tag: '地形解谜任务',
      summary: '火山星深处被岩浆与烈火阻隔，需使用工具铺路、灭火并完成三场能源海盗战。',
      steps: [
        '从火山星山洞(16)破岩进入火山星深处(17)。',
        '根据被困 NPC 提示，寻找场景工具铺设通路并扑灭火焰（任务 #532 三个能源分支可任意顺序完成）。',
        '击败守卫海盗（含 Lv.100 尼布）完成营救。',
      ],
      rewards: ['推进火山星主线任务 #532'],
    },
    {
      id: 'ocean-diving',
      category: 'terrain',
      title: '海洋星海底 · 潜水装下潜与音符石机关',
      mapId: 22,
      mapName: mapName(22),
      tag: '深水地形机关',
      summary: '下潜至海洋星海底必须穿戴潜水装；海底音符机关需携带对应精灵才能奏响。',
      steps: [
        '前往机械室(地图 8)的潜水装领取装置，免费领取并穿戴「潜水装」。',
        '经海洋星(20) → 深水区(21)下潜进入海洋星海底(22)，可捕捉小鳍鱼(#198)并挑战钢牙鲨。',
        '点击海底音符石需背包携带指定精灵才能激活互动。',
      ],
      rewards: ['解锁海洋星海底(22)', '小鳍鱼 (#198)', '钢牙鲨 SPT'],
    },
    {
      id: 'helka-ruins',
      category: 'terrain',
      title: '赫尔卡星 · 遗迹晶石、电磁棒打影与电柱',
      mapId: 34,
      mapName: `${mapName(33)} / ${mapName(34)} / ${mapName(36)}`,
      tag: '系列星球机关',
      summary: '赫尔卡星三张地图分别藏有晶石凹槽、电磁棒头部射击影子、电系精灵充能石柱三套机关。',
      steps: [
        '【遗迹 33】查看墙上赫星长老留言，寻找并嵌入对应发光晶石。',
        '【神秘通道 34】先调查场景石像集齐能量碎片恢复能量 → 穿戴「电磁棒」→ 用头部射击命中场内移动的影子！',
        '【荒地/电柱 36】该石柱缺少启动电能，将任意「电系精灵」设为跟随/带在背包中点击即可激活。',
      ],
      rewards: ['解锁赫尔卡星隐藏剧情与通道', '采集玄冰/电能资源'],
    },
    {
      id: 'kaku-water-pillar',
      category: 'terrain',
      title: '卡酷星/浮石水域 · 碎石压水柱升活力浮石',
      mapId: 430,
      mapName: mapName(430),
      tag: '力学地形机关',
      summary: '通往星系霸主「亚伦斯」的道路被水域阻断，需利用水压原理升起中央浮石。',
      steps: [
        `前往地图 430（${mapName(430)}）。`,
        '用场景中的碎石块压住两侧的另外两支水柱，中央水柱受压升起并托起「活力浮石」形成通路。',
        '踩过浮石即可走到地面站位 (620,440) 点击挑战星系霸主「亚伦斯」。',
      ],
      rewards: ['打通地形通路', '挑战星系霸主亚伦斯'],
      demo: {
        mapId: 430,
        actions: [
          { type: 'drag', x1: 97, y1: 329, x2: 640, y2: 402, label: '① 用左侧碎石压住前侧水柱' },
          { type: 'drag', x1: 55, y1: 339, x2: 712, y2: 240, label: '② 用碎石压住后侧水柱' },
          { type: 'click', x: 402, y: 305, label: '③ 中央水柱升起活力浮石，点击通行' },
        ],
      },
    },
    {
      id: 'corrosive-gas-435',
      category: 'terrain',
      title: '腐蚀气体地形 · 脱下装备方可通行',
      mapId: 435,
      mapName: mapName(435),
      tag: '反直觉地形机关',
      summary: '地图 435 充满强腐蚀性气体，穿着装备反而会被拦下！必须脱掉身上装备才能前进。',
      steps: [
        `进入地图 435（${mapName(435)}），看到腐蚀气体警告提示。`,
        '打开赛尔装扮栏，卸下/脱去身上的装备。',
        '卸装后即可顺利穿过腐蚀区域，接触紫炎虫并挑战首领「克拉尼特」。',
      ],
      rewards: ['穿过腐蚀气体地形', '挑战克拉尼特'],
    },
    {
      id: 'stele-runes-326',
      category: 'terrain',
      title: '尼古尔/石碑符文 · 拖拽匹配三处地面符文',
      mapId: 326,
      mapName: mapName(326),
      tag: '拖拽解谜机关',
      summary: '将场景中央的石碑拖拽至与图案一致的地面符文上即可触发机关。',
      steps: [
        `进入地图 326（${mapName(326)}），观察中央石碑与地面三处符文（左下方、下方中央、右上方）。`,
        '按提示将中央石碑准确拖拽到图案相同的地面符文位置松手，即可点亮解锁。',
      ],
      rewards: ['解开石碑符文封印'],
      demo: {
        mapId: 326,
        actions: [
          { type: 'drag', x1: 442, y1: 304, x2: 286, y2: 406, label: '① 拖拽中央石碑 → 左下方地面符文' },
          { type: 'drag', x1: 442, y1: 304, x2: 685, y2: 403, label: '② 或拖拽中央石碑 → 下方偏右符文' },
          { type: 'drag', x1: 442, y1: 304, x2: 881, y2: 307, label: '③ 或拖拽中央石碑 → 右上方符文' },
        ],
      },
    },
    {
      id: 'atresia-space',
      category: 'treasure',
      title: '阿特雷西亚密室 304 · 旋转螺丝对齐箭头',
      mapId: 304,
      mapName: mapName(304),
      tag: '旋转解谜宝箱',
      summary: '点击两侧螺丝旋转，使两侧螺丝方向与中央箭头完全一致，即可开启密室宝箱。',
      steps: [
        '进入密室 304，观察中央箭头指示方向。',
        '依次点击左右两侧的螺丝按钮旋转，直到两侧方向与中央箭头一致。',
        `机关解开后点击上方宝箱领取 ${closedSpace.rooms[0].reward.count} 个${itemName(closedSpace.rooms[0].reward.itemId)}（每账号限领 1 次）。`,
      ],
      rewards: [`${itemName(300003)} ×3（304 密室）`],
      demo: {
        mapId: 304,
        actions: [
          { type: 'click', x: 362, y: 118, label: '① 点击左侧螺丝旋转，对齐中央箭头' },
          { type: 'click', x: 503, y: 51, label: '② 点击右侧螺丝旋转，对齐中央箭头' },
          { type: 'click', x: 474, y: 139, label: '③ 解锁后点击宝箱领取 3 个高级胶囊' },
        ],
      },
    },
    {
      id: 'atresia-space-309',
      category: 'treasure',
      title: '阿特雷西亚密室 309 · 逆时针踩六块踏板',
      mapId: 309,
      mapName: mapName(309),
      tag: '顺序踏板宝箱',
      summary: '沿平台逆时针依次走过踏板点亮全部指示灯（走错方向会直接归位重置！），全亮即开宝箱。',
      steps: [
        '进入密室 309，从左侧第一块踏板起步，严格按【逆时针】顺序踩完整个环形平台的踏板。',
        '注意：切勿顺时针或跨格走错方向，否则灯会熄灭并归位。',
        `全部点亮后点击上方宝箱领取 ${closedSpace.rooms[0].reward.count} 个${itemName(closedSpace.rooms[0].reward.itemId)}（每账号限领 1 次）。`,
      ],
      rewards: [`${itemName(300003)} ×3（309 密室）`],
      demo: {
        mapId: 309,
        actions: [
          { type: 'click', x: 142, y: 175, label: '① 逆时针起点：踩左侧踏板' },
          { type: 'click', x: 279, y: 293, label: '② 向左下踩第二块踏板' },
          { type: 'click', x: 534, y: 266, label: '③ 向右下踩第三块踏板' },
          { type: 'click', x: 656, y: 160, label: '④ 向右上踩第四块踏板' },
          { type: 'click', x: 401, y: 149, label: '⑤ 回到上方踩完末块踏板，全灯亮起' },
          { type: 'click', x: 358, y: 103, label: '⑥ 点击上方宝箱领奖' },
        ],
      },
    },
    {
      id: 'laboer-bridge-boat',
      category: 'terrain',
      title: '拉铂尔星 684 · 伸展枯枝搭桥与小木舟渡河',
      mapId: 684,
      mapName: mapName(684),
      tag: '渡河地形机关',
      summary: '拉铂尔星隔河相望，需先点枯枝搭桥，再靠近岸边点小木舟双向渡河。',
      steps: [
        `进入地图 684（${mapName(684)}），点击「会伸展的枯枝」自动架起断崖通路。`,
        '走到岸边后点击「小木舟」登船渡河（返程同样在岸边点击小木舟返航）。',
        '渡河后可点击「皮特萨罗的精灵蛋」唤醒并挑战剧情首领皮特萨罗（蓄力 3 回合破空长鸣，命中 3 次打断）。',
      ],
      rewards: ['解锁对岸区域', '挑战剧情首领皮特萨罗'],
      demo: {
        mapId: 684,
        actions: [
          { type: 'click', x: 120, y: 269, label: '① 点击左侧「会伸展的枯枝」架起断崖通路' },
          { type: 'click', x: 685, y: 361, label: '② 靠近岸边点击「小木舟」登船渡河' },
          { type: 'click', x: 539, y: 401, label: '③ 点击皮特萨罗的精灵蛋唤醒挑战' },
        ],
      },
    },
    {
      id: 'ice-icicle-685',
      category: 'terrain',
      title: '冰锥断桥 685 · 头部射击击落左上蓝冰锥',
      mapId: 685,
      mapName: mapName(685),
      tag: '射击搭桥机关',
      summary: '地图 685 断崖需要用普通头部射击打落左上方蓝色冰锥搭成冰桥，别打错正中紫水晶！',
      steps: [
        `进入地图 685（${mapName(685)}），点击屏幕底部准心图标，选择「普通头部射击」。`,
        '瞄准**左上方蓝色冰锥**射击，冰锥坠落后会横架成通路。',
        '注意：场景正中的紫色水晶不是这处通路的机关。',
      ],
      rewards: ['搭起冰锥断桥通路', '通往暗夜冰狐冰洞(686)'],
      demo: {
        mapId: 685,
        actions: [
          { type: 'shoot', x: 269, y: 86, label: '① 选普通头部射击，瞄准左上方蓝色冰锥！' },
          { type: 'click', x: 269, y: 290, label: '② 冰锥坠落搭成冰桥，沿通路走过断崖' },
        ],
      },
    },
    {
      id: 'night-ice-fox',
      category: 'boss-puzzle',
      title: '暗夜冰狐冰洞 686 · 冰洞搜寻火之果弱化',
      mapId: 686,
      mapName: mapName(686),
      tag: '双形态削弱机关',
      summary: '在周围冰洞点击搜寻「火之果」，持有火之果开战可消除暗夜冰狐开场 40% 夜幕闪避。',
      steps: [
        `进入地图 686（${mapName(686)}），点击暗夜冰狐周围的冰洞搜寻道具「火之果」(#300451，每次尝试冷却 2 秒，无每日上限)。`,
        '未持有火之果直接开战：暗夜冰狐开场自带 40% 夜幕闪避（每次命中 -10%）。',
        '持有火之果开战：触发弱化形态，开场 0 闪避（仅未被打中的回合 +10%，最高 40%）。',
      ],
      rewards: ['大幅降低暗夜冰狐战斗难度'],
    },
    {
      id: 'leaf-boat-81951',
      category: 'terrain',
      title: '拉铂尔仙境 · 大叶子「叶舟」渡水',
      mapId: 81951,
      mapName: '拉铂尔岸边 / 仙境(693)',
      tag: '载具地形机关',
      summary: '与岸边布鲁对话了解仙境线索，点击水面大叶子「叶舟」即可驶向拉铂尔仙境(693)。',
      steps: [
        '在岸边(81951)点击水面漂浮的「大叶子（叶舟）」，自动乘叶舟驶入拉铂尔仙境(693)。',
        '在仙境完成保护与调查后，可随时点击布鲁返航岸边或直接返回船长室。',
      ],
      rewards: ['往返拉铂尔仙境(693)'],
    },
    {
      id: 'maizi-494',
      category: 'pet-puzzle',
      title: '麦兹星 494/496 · 火焰喷射枯枝与旋转方向机关',
      mapId: 494,
      mapName: mapName(494),
      tag: '服装 + 方向机关',
      summary: '494 需装备火焰喷射器点燃枯枝引出隐藏精灵；496 需按正确方向转动机关否则会卡住。',
      steps: [
        `【麦兹星 494】穿戴机械室领取的「${itemName(100044)}」，射击点燃场景枯枝，引出 Lv.18 力亚(#726，可捕捉) 或 Lv.91 马力(#728)。`,
        '【麦兹星球 496】旋转装置时需仔细观察箭头转动方向，转错方向会导致卡住无法移动。',
      ],
      rewards: ['力亚 (#726，Lv.18 可捕捉)'],
    },
    {
      id: 'aling-425',
      category: 'terrain',
      title: '神秘大罗盘 425 & 星印五阶段试炼 10039',
      mapId: 425,
      mapName: mapName(425),
      tag: '罗盘 + 星印机关',
      summary: '启动大罗盘后可射击发光装置、避开带电指针；10039 需按过去→现在→未来顺序校准星印；超能 NoNo 触发阿零。',
      steps: [
        `前往地图 425（${mapName(425)}），点击「罗盘启动装置」点亮大罗盘。`,
        '点亮后可用头部射击左右发光装置、转动钥匙领物资，登上大罗盘时注意避开带电指针。',
        '【星印 10039】严格按「过去星印 → 现在星印 → 未来星印」顺序依次校准完成试炼。',
        '【遭遇阿零】开启超能 NoNo 后点击场景中的阿零(#499)进入 Lv.15 战斗并捕捉。',
      ],
      rewards: ['阿零 (#499，Lv.15 可捕捉)', '罗盘物资与经验'],
    },
    {
      id: 'beidou-733',
      category: 'boss-puzzle',
      title: '北斗七星殿 733 · 七星连锁阵',
      mapId: 733,
      mapName: mapName(733),
      tag: '星阵封印机关',
      summary: '七星连锁阵按贪狼到破军排列 1~7 号位，中央 0 号位为星灵王，当前版本开放前四道封印。',
      steps: [
        `前往北斗七星殿（地图 733），按顺位依次点击贪狼至文曲（1~4 号星位）开启封印挑战。`,
        '每道封印进度与奖励由服务端持久化记录。',
      ],
      rewards: ['北斗七星殿前四道封印进度与奖励'],
    },
    {
      id: 'neil-disguise',
      category: 'pet-puzzle',
      title: '尼尔 · 野外 8% 变身遭遇',
      mapId: 10,
      mapName: '帕诺/各经典星球野外',
      tag: '8% 变身机制',
      summary: '尼尔不会直接站在地图上，而是在你挑战指定 14 种普通野怪时以 8% 概率变身现身！',
      steps: [
        '前往常见野怪地图反复点击以下宿主野怪进入战斗：皮皮、比比鼠、仙人球、小豆芽、毛毛、幽浮、利牙鱼、贝尔、火炎贝、吉尔、林克、玄冰兽、丁格、古鲁。',
        '进战瞬间有 8% 概率触发变身，直接变为 Lv.16 尼尔（可捕捉）。',
        '尼尔一族同时是「奇迹融合」的万能副宠，抓到后非常实用。',
      ],
      rewards: ['尼尔 (#77，Lv.16 可捕捉)'],
    },
    {
      id: 'sea-vortex',
      category: 'pet-puzzle',
      title: '深海漩涡 687 · 头部射击精灵救援',
      mapId: seaVortex.mapId,
      mapName: mapName(seaVortex.mapId),
      tag: '常驻救援玩法',
      summary: '本服取消历史过期限制，永久开放深海漩涡救援，可随机救出多只绝版水系精灵。',
      steps: [
        `前往地图 ${seaVortex.mapId}（${mapName(seaVortex.mapId)}），完成前置引导任务 #${seaVortex.introTaskId}。`,
        `对漩涡目标区域连续头部射击 ${seaVortex.shotsRequired} 次，击败两轮 Lv.100 海盗守卫（尼布）。`,
        '救援成功后按权重随机触发道具（水之精华）或 Lv.15 可捕捉精灵：' + seaVortex.rewards.filter((r) => r.petId).map((r) => `${petName(r.petId)}(${((r.weight / seaTotalW) * 100).toFixed(1)}%)`).join('、') + '。',
      ],
      rewards: seaVortex.rewards.filter((r) => r.petId).map((r) => `${petName(r.petId)} Lv.15`),
      demo: {
        mapId: seaVortex.mapId,
        actions: [
          { type: 'shoot', x: 287, y: 415, label: '① 对准深海漩涡连续头部射击 3 次' },
          { type: 'click', x: 414, y: 120, label: '② 击败两轮 Lv.100 海盗守卫' },
          { type: 'click', x: 451, y: 393, label: '③ 触发救援，随机遭遇绝版水系精灵捕捉' },
        ],
      },
    },
    {
      id: 'sun-land-wenwen',
      category: 'pet-puzzle',
      title: '阳光大地 476 · 三色碎片召唤文文',
      mapId: 476,
      mapName: mapName(476),
      tag: '碎片收集召唤',
      summary: '在阳光大地刷取三色碎片，合成召唤 Lv.15 可捕捉精灵「文文」。',
      steps: [
        '在阳光大地(476)挑战野怪莱克(#742)、丽萨克(#743)，有 10% 概率掉落三色碎片（300414/300415/300416，每次 1~2 个）。',
        '集齐三种碎片各 1 个后，与场景神秘装置交互发起挑战（建战成功才消耗碎片）。',
        '遭遇 Lv.15 文文(#980)，可直接丢胶囊捕捉。',
      ],
      rewards: ['文文 (#980，Lv.15 可捕捉)'],
    },
    {
      id: 'beehive-dabila',
      category: 'pet-puzzle',
      title: '云霄星小莹蜂 & 露希欧达比拉',
      mapId: 26,
      mapName: `${mapName(26)} / ${mapName(53)}`,
      tag: '经典交互遭遇',
      summary: '两只经典机制精灵需通过场景交互触发战斗并捕捉。',
      steps: [
        `小莹蜂(#153)：前往${mapName(26)}(地图 26)触发场景蜂巢交互，遭遇 Lv.13 小莹蜂（可捕捉）。`,
        `达比拉(#178)：前往${mapName(53)}(地图 53)触发场景机关交互，遭遇 Lv.15 达比拉（可捕捉）。`,
      ],
      rewards: ['小莹蜂 (#153)', '达比拉 (#178)'],
    },
    {
      id: 'gaia-schedule',
      category: 'boss-puzzle',
      title: '战神盖亚 · 每日出现地点与击败条件',
      mapId: 15,
      mapName: '火山星 / 拜伦号 / 海洋星',
      tag: '定时/条件首领',
      summary: '盖亚按星期轮换出现在不同星球，且不同日期要求特定击败条件才能通关！',
      steps: [
        '周一、周五 → 火山星(15)：要求在 2 回合内击败盖亚。',
        '周二、周四、周日 → 拜伦号/指定地图(54)：要求最后一击为暴击击败。',
        '周三、周六 → 海洋星/对应轮换地图：按当日战神试炼条件击败（详见游戏内盖亚提示）。',
      ],
      rewards: ['盖亚精元'],
    },
    {
      id: 'king-tower',
      category: 'treasure',
      title: '王者之塔 465 · 30 层普通 & 极限模式',
      mapId: kingTower.entranceMapId,
      mapName: mapName(kingTower.entranceMapId),
      tag: '爬塔挑战',
      summary: '共 30 层 100 级连续敌队。普通模式允许 NoNo，极限模式锁定入场 6 宠但奖励丰厚！',
      steps: [
        `前往地图 ${kingTower.entranceMapId}（${mapName(kingTower.entranceMapId)}）选择普通模式（需 1 只 Lv.100）或极限模式（需 3 只 Lv.100）。`,
        '每 10 层解锁选层入口，断线保留当前层数，打赢整支敌队才推进层数。',
        '极限模式 10 层奖「光明卡修套装」，20 层奖「千锤百炼称号 + 通用刻印激活水晶」，30 层再奖 1 颗「通用刻印激活水晶」。',
      ],
      rewards: ['光明卡修套装(极限10层)', '通用刻印激活水晶(极限20/30层)', '千锤百炼称号'],
    },
    {
      id: 'academy-train',
      category: 'utility',
      title: '精灵学院 485 · 极速刷学习力与经验',
      mapId: 485,
      mapName: mapName(485),
      tag: '养成圣地',
      summary: '太空站(102)或 NoNo 随身服务直达精灵学院(485)，支持原版六项学习力训练室与经验训练室。',
      steps: [
        '初/高级班辅导员 → 打开六项学习力面板，每场固定增加对应学习力（配合 10 倍学习力卡极快刷满 255）。',
        '中央全息终端 → 打开「经验训练室」，可自选 16 系陪练属性与等级档（自动按首发精灵高亮克制系）。',
        '本服优化：每次进入训练室及战后返回房间，自动免费补满全队 HP 与 PP！',
      ],
      rewards: ['高效刷满 510 学习力', '极速升级至 Lv.100', '战后自动满血满 PP'],
    },
    {
      id: 'starter-reclaim',
      category: 'utility',
      title: '实验室 5 · 初始精灵按族补领机制',
      mapId: 5,
      mapName: mapName(5),
      tag: '防误放/融合兜底',
      summary: '不小心把布布种子、伊优或小火猴融合掉了？实验室左上角柜子可以找博士补领！',
      steps: [
        '确保你的背包与仓库里已经完全没有该初始精灵一族（含进化形态与融合形态）。',
        '前往实验室(地图 5)，点击左上角「精灵收集奖励」柜子。',
        '博士会主动弹出对话询问是否带一只回去，确认即可免费补领（三主宠每族各限补领 1 次）。',
      ],
      rewards: ['布布种子 / 伊优 / 小火猴（每族各 1 次）'],
    },
  ];

  // Detect exported visual assets (pet icons & map screenshots)
  const guideImgRoot = path.join(path.dirname(OUT_FILE), 'img');
  const petImgDir = path.join(guideImgRoot, 'pets');
  const mapImgDir = path.join(guideImgRoot, 'maps');
  const petIcons = fs.existsSync(petImgDir)
    ? fs.readdirSync(petImgDir).filter((f) => /^\d+\.png$/.test(f)).map((f) => Number(f.replace('.png', ''))).sort((a, b) => a - b)
    : [];
  const mapImages = fs.existsSync(mapImgDir)
    ? fs.readdirSync(mapImgDir).filter((f) => /^\d+\.jpg$/.test(f)).map((f) => Number(f.replace('.jpg', ''))).sort((a, b) => a - b)
    : [];

  // 13. Element Matchup Matrix (Core 16 types)
  const coreTypes = elementsRaw.types.slice(0, 16).map((t) => ({ id: t.id, name: t.name }));
  const effectiveness = {};
  for (const atk of coreTypes) {
    effectiveness[atk.id] = {};
    const row = elementsRaw.effectiveness[String(atk.id)] || {};
    for (const def of coreTypes) {
      if (row[String(def.id)] !== undefined) effectiveness[atk.id][def.id] = row[String(def.id)];
    }
  }

  const data = {
    meta: {
      generatedAt: new Date().toISOString(),
      version: 'countermark-expansion-20261120',
      stats: {
        obtainablePets: petsList.length,
        bossCount: bosses.length,
        fixedFusions: fixedRecipes.length,
        miracleFusions: miracleRecipes.length,
        countermarks: countermarks.length,
        mechanisms: mechanisms.length,
      },
    },
    assets: {
      pets: petIcons,
      maps: mapImages,
    },
    bosses,
    puniSeals: puniRaw.puniSeals,
    alderConfig: alderRaw,
    pets: petsList,
    fusion: {
      fixed: fixedRecipes,
      miracles: miracleRecipes,
      beigeFallback: {
        soulId: 1000007,
        soulName: hatchById[1000007]?.name || '米色元神珠',
        absorbMaps: (hatchById[1000007]?.steps || []).map((s) => `${s.mapName}(${s.mapId})`),
        pets: [325, 328, 330].map((id) => ({ id, name: petName(id) })),
      },
      hatchBeads,
    },
    countermarks: {
      marks: countermarks,
      dropRules: [
        '仅限拥有 SPT 编号 (1~200) 的经典 BOSS 掉落，宇宙 BOSS 与非 SPT 不掉。',
        '专属技能刻印：仅在「已首胜后的重复挑战」中有 25% 概率掉落对应 BOSS 专属大招刻印。',
        '通用刻印：首胜与重复挑战均有 15% 概率掉落；按 BOSS 等级分池：≤49 级掉中型能力；50~84 级掉中型/双属性/15系通用技能；≥85 级掉大型/双属性/15系通用技能。',
        '所有刻印均需精灵达到 Lv.100 才生效。',
      ],
    },
    mechanisms,
    starArenas,
    collectGroups,
    miningSites,
    materialDrops,
    materialBossDrops,
    materialGames,
    elements: {
      types: coreTypes,
      effectiveness,
    },
    natures: naturesRaw.natures,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  const js = `// Auto-generated by scripts/build-guide-site.cjs — DO NOT EDIT MANUALLY\nwindow.SEER_GUIDE_DATA = ${JSON.stringify(data)};\n`;
  fs.writeFileSync(OUT_FILE, js, 'utf8');
  console.log(`Generated ${OUT_FILE} (${(Buffer.byteLength(js) / 1024).toFixed(1)} KB)`);
  console.log('Summary:', JSON.stringify(data.meta.stats, null, 2));
}

build();
