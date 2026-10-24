'use strict';
// Build against a fresh live capture, not an old full client or stale TypeScript dist.
// Usage: node scripts/build-map-story.cjs --baseline <capture> --out <release>
//   --reference <reference Core.swf> --resources <captured assets> --java <java> --ffdec <jar>
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const names = ['baseline', 'out', 'reference', 'resources', 'java', 'ffdec'];
const { values: v } = parseArgs({ options: Object.fromEntries(names.map(n => [n, { type: 'string' }])) });
for (const name of names) assert.ok(v[name], 'Missing --' + name);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out);
assert.ok(!fs.existsSync(out), 'Output directory already exists; choose a fresh release directory');
const root = path.resolve(__dirname, '..');
const patch = path.join(root, 'compat/client-patches/map-story');
const server = path.join(root, 'compat/server-patches/map-story');
const guards = JSON.parse(fs.readFileSync(path.join(patch, 'baseline.json')));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const files = [];
const only = (items, label) => { assert.equal(items.length, 1, 'Expected one ' + label); return items[0]; };
function put(rel, data) {
    const before = path.join(baseline, rel), target = path.join(out, rel);
    const bytes = Buffer.from(data);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
    files.push({ path: rel, before: fs.existsSync(before) ? sha(fs.readFileSync(before)) : null, after: sha(bytes) });
}
function parse(raw) {
    assert.equal(raw.subarray(0, 3).toString(), 'CWS');
    const body = zlib.inflateSync(raw.subarray(8));
    assert.equal(body.length + 8, raw.readUInt32LE(4));
    let offset = Math.ceil((5 + (body[0] >> 3) * 4) / 8) + 4;
    const header = body.subarray(0, offset), tags = [];
    while (offset < body.length) {
        const start = offset, short = body.readUInt16LE(offset); offset += 2;
        const code = short >> 6;
        let size = short & 63;
        if (size === 63) { size = body.readUInt32LE(offset); offset += 4; }
        assert.ok(offset + size <= body.length, 'Truncated SWF tag');
        const payload = body.subarray(offset, offset + size); offset += size;
        tags.push({ code, payload, name: code === 82 ? payload.subarray(4, payload.indexOf(0, 4)).toString() : null, raw: body.subarray(start, offset) });
        if (code === 0) break;
    }
    assert.equal(offset, body.length);
    return { raw, header, tags };
}
function encode(source, tags) {
    const body = Buffer.concat([source.header, ...tags]);
    const header = Buffer.from(source.raw.subarray(0, 8));
    header.writeUInt32LE(body.length + 8, 4);
    return Buffer.concat([header, zlib.deflateSync(body, { level: 9 })]);
}
function tag(code, payload) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE((code << 6) | 63); header.writeUInt32LE(payload.length, 2);
    return Buffer.concat([header, payload]);
}
function symbols(t) {
    const result = [];
    let offset = 2;
    for (let i = 0; i < t.payload.readUInt16LE(0); i++) {
        const id = t.payload.readUInt16LE(offset); offset += 2;
        const end = t.payload.indexOf(0, offset);
        assert.ok(end >= offset);
        result.push({ id, name: t.payload.subarray(offset, end).toString() }); offset = end + 1;
    }
    assert.equal(offset, t.payload.length);
    return result;
}
function xmlResource(core, name) {
    const binding = only(core.tags.filter(t => t.code === 76).flatMap(symbols).filter(s => s.name === name), name);
    const resource = only(core.tags.filter(t => t.code === 87 && t.payload.readUInt16LE(0) === binding.id), name + ' data');
    return { resource, xml: resource.payload.subarray(6).toString('utf8') };
}
function replaceOnce(text, before, after) {
    assert.equal(text.split(before).length, 2, 'Baseline changed: ' + before.slice(0, 100));
    return text.replace(before, after);
}
const coreRel = 'client/assets/dll/NieoCore.swf';
const coreRaw = fs.readFileSync(path.join(baseline, coreRel));
assert.ok(coreRaw.equals(fs.readFileSync(path.join(baseline, 'client/overlay/dll/NieoCore.swf'))), 'Core copies differ');
const core = parse(coreRaw);
const referenceRaw = fs.readFileSync(v.reference);
assert.equal(sha(referenceRaw), guards.referenceSha256, 'Reference client changed');
const reference = parse(referenceRaw);
const currentByName = new Map(core.tags.filter(t => t.code === 82).map(t => [t.name, t]));
const referenceByName = new Map(reference.tags.filter(t => t.code === 82).map(t => [t.name, t]));
for (const [name, hash] of Object.entries(guards.sharedClassSha256)) {
    assert.ok(currentByName.has(name), 'Missing shared class: ' + name);
    assert.equal(sha(currentByName.get(name).raw), hash, 'Reconcile shared class before building: ' + name);
}
const classNames = guards.classes;
assert.ok(Array.isArray(classNames) && classNames.length > 0, 'Missing class inventory');
const changedNames = new Set(classNames);
const additions = classNames.filter(n => !currentByName.has(n));
for (const name of classNames) {
    if (currentByName.has(name)) assert.ok(guards.sharedClassSha256[name], 'Unguarded shared class: ' + name);
    else assert.ok(referenceByName.has(name), 'Missing reference class: ' + name);
}
const symbolTag = only(core.tags.filter(t => t.code === 76), 'Core SymbolClass');
const bindings = symbols(symbolTag);
let maxId = Math.max(...bindings.map(s => s.id), ...core.tags.filter(t => t.code === 87).map(t => t.payload.readUInt16LE(0)));
const newBinary = [];
for (const donor of reference.tags.filter(t => t.code === 76).flatMap(symbols)) {
    if (!additions.includes(donor.name.replaceAll('.', '/'))) continue;
    const binary = only(reference.tags.filter(t => t.code === 87 && t.payload.readUInt16LE(0) === donor.id), donor.name + ' binary');
    const payload = Buffer.from(binary.payload), id = ++maxId;
    assert.ok(id <= 65535, 'SWF character ID overflow');
    payload.writeUInt16LE(id, 0);
    newBinary.push(tag(87, payload)); bindings.push({ id, name: donor.name });
}
const symbolParts = [Buffer.alloc(2)]; symbolParts[0].writeUInt16LE(bindings.length);
for (const s of bindings) { const id = Buffer.alloc(2); id.writeUInt16LE(s.id); symbolParts.push(id, Buffer.from(s.name + '\0')); }
const linkedTags = [];
for (const t of core.tags) {
    if (t === symbolTag) {
        linkedTags.push(...newBinary, ...additions.map(n => referenceByName.get(n).raw), tag(76, Buffer.concat(symbolParts)));
    } else linkedTags.push(t.raw);
}
const compiler = path.join(out, 'compiler');
fs.mkdirSync(compiler, { recursive: true });
for (const name of classNames) {
    const dest = path.join(compiler, 'import/scripts', name + '.as');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(patch, 'scripts', name + '.as'), dest);
}
fs.writeFileSync(path.join(compiler, 'linked.swf'), encode(core, linkedTags));
execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
    path.join(compiler, 'linked.swf'), path.join(compiler, 'compiled.swf'), path.join(compiler, 'import')], { stdio: 'inherit', timeout: 240000 });
const compiled = parse(fs.readFileSync(path.join(compiler, 'compiled.swf')));
assert.equal(compiled.tags.length, linkedTags.length, 'Compiler changed tag count');
compiled.tags.forEach((t, i) => {
    if (t.code !== 82 || !changedNames.has(t.name)) assert.ok(t.raw.equals(linkedTags[i]), 'Unrelated compiler change: ' + (t.name || t.code));
});
const replacements = new Map();
function updateXml(symbol, update) {
    const { resource, xml } = xmlResource(core, symbol);
    replacements.set(resource.payload.readUInt16LE(0), tag(87, Buffer.concat([resource.payload.subarray(0, 6), Buffer.from(update(xml))])));
}
updateXml('com.robot.core.manager.map.config.MapConfig_xmlCls', xml => {
    const entries = fs.readFileSync(path.join(patch, 'maps.xml'), 'utf8').match(/<map\b[^>]*>[\s\S]*?<\/map>/g);
    for (let entry of entries) {
        const id = /\bid="(\d+)"/.exec(entry)[1];
        const old = new RegExp('<map\\b(?=[^>]*\\bid="' + id + '")[^>]*>[\\s\\S]*?<\\/map>', 'g');
        const matches = xml.match(old) || [];
        assert.ok(matches.length <= 1, 'Duplicate map: ' + id);
        if (id === '449') {
            const portal = /<Entry\b(?=[^>]*\bFromMap="450")[^>]*\/>/g;
            entry = replaceOnce(entry, only(entry.match(portal) || [], 'restored temple return point'),
                only(matches[0]?.match(portal) || [], 'current temple return point'));
        }
        const fromMaps = [...entry.matchAll(/<Entry\b[^>]*\bFromMap="(\d+)"/g)].map(m => m[1]);
        assert.equal(new Set(fromMaps).size, fromMaps.length, 'Duplicate return route: ' + id);
        xml = matches.length ? xml.replace(old, entry) : replaceOnce(xml, '</Maps>', entry + '\n</Maps>');
    }
    return xml;
});
updateXml('com.robot.core.config.xml.TasksXMLInfo_xmlClass', xml => {
    const entries = fs.readFileSync(path.join(patch, 'quests.xml'), 'utf8').match(/<task\b[^>]*>[\s\S]*?<\/task>/g);
    for (const entry of entries) {
        const id = /\bID="(\d+)"/.exec(entry)[1];
        assert.ok(!new RegExp('<task\\b[^>]*\\bID="' + id + '"').test(xml), 'Quest already exists; reconcile: ' + id);
        xml = replaceOnce(xml, '</tasks>', entry + '\n</tasks>');
    }
    return xml;
});
updateXml('com.robot.app.tasksRecord.TasksRecordConfig_xmlClass', xml => {
    const chapters = fs.readFileSync(path.join(patch, 'chapters.xml'), 'utf8').replace(/^<chapters>/, '').replace(/<\/chapters>\s*$/, '');
    assert.ok(!/starid="2_[345]"/.test(xml), 'Journal chapters already exist');
    const end = /(<\/task>\s*<\/tasks>\s*<\/config>\s*)$/;
    assert.ok(end.test(xml), 'Journal hierarchy changed');
    return xml.replace(end, chapters + '\n$1');
});
const finalTags = compiled.tags.map(t => t.code === 87 && replacements.has(t.payload.readUInt16LE(0)) ? replacements.get(t.payload.readUInt16LE(0)) : t.raw);
const finalCore = encode(core, finalTags);
put(coreRel, finalCore); put('client/overlay/dll/NieoCore.swf', finalCore);

const taskConfigPath = 'app/config/data/json/tasks.json';
const taskConfig = JSON.parse(fs.readFileSync(path.join(baseline, taskConfigPath)));
const storyTasks = JSON.parse(fs.readFileSync(path.join(server, 'tasks.json'))).tasks;
for (const [id, config] of Object.entries(storyTasks)) {
    assert.ok(!Object.hasOwn(taskConfig.tasks, id), 'Server quest already exists; reconcile: ' + id);
    taskConfig.tasks[id] = config;
}
put(taskConfigPath, JSON.stringify(taskConfig, null, 2) + '\n');
const managerPath = 'app/dist/GameServer/Game/Task/TaskManager.js';
let manager = fs.readFileSync(path.join(baseline, managerPath), 'utf8');
const accept = "        await (0, SaveTaskState_1.SaveAcceptedTask)(this.TaskData, taskId);";
manager = replaceOnce(manager, accept,
    "        if (config.parentTaskId && !this.TaskData.IsTaskCompleted(config.parentTaskId))\n" +
    "            throw new Error('Previous story quest is not complete');\n" + accept);
put(managerPath, manager);

const petManagerPath = 'app/dist/GameServer/Game/Pet/PetManager.js';
let petManager = fs.readFileSync(path.join(baseline, petManagerPath), 'utf8');
const levelMethodStart = petManager.indexOf('    /**\n     * 检查并处理升级（包括自动进化）');
const levelMethodEnd = petManager.indexOf('    /**\n     * 重新计算属性', levelMethodStart);
assert.ok(levelMethodStart >= 0 && levelMethodEnd > levelMethodStart, 'Pet progression method changed');
const levelMethod = petManager.slice(levelMethodStart, levelMethodEnd);
assert.ok(levelMethod.includes('    checkLevelUp(pet) {'), 'Pet progression boundary changed');
assert.equal(sha(levelMethod), guards.petProgressionMethodSha256, 'Live pet progression changed; reconcile before building');
assert.equal((petManager.match(/this\.checkLevelUp\(candidate\)/g) || []).length, 3, 'Pet progression callers changed');
petManager = replaceOnce(petManager, levelMethod, '');
petManager = replaceOnce(petManager, 'const PetPP_1 = require("./PetPP");',
    'const PetPP_1 = require("./PetPP");\nconst { AdvancePetExperience } = require("./PetProgression");');
petManager = petManager.replaceAll('this.checkLevelUp(candidate)', 'AdvancePetExperience(candidate)');
put(petManagerPath, petManager);
const petTypesPath = 'app/dist/GameServer/Game/Pet/PetManager.d.ts';
put(petTypesPath, replaceOnce(fs.readFileSync(path.join(baseline, petTypesPath), 'utf8'),
    '    /**\n     * 检查并处理升级（包括自动进化）\n' +
    '     * @returns { newSkills: 新学会的技能ID列表, evolved: 是否进化 }\n' +
    '     */\n    private checkLevelUp;\n', ''));
put('app/dist/GameServer/Game/Pet/PetProgression.js', fs.readFileSync(path.join(server, 'PetProgression.js')));
const rewardPath = 'app/dist/GameServer/Game/Task/CompleteConfiguredTask.js';
let reward = fs.readFileSync(path.join(baseline, rewardPath), 'utf8');
const progress = '    const bytes = !stored ? [] : stored.xinBytes ?? (0, Task96Buffer_1.DecodeTask96Buffer)(stored);';
reward = replaceOnce(reward, progress, progress + '\n' +
    '    if (config.orderedProgress !== undefined) {\n' +
    '        for (let index = 0; index < config.requiredProgress - 1; index++) {\n' +
    "            if (bytes[index] !== 1) throw new Error('Previous story stage is not complete');\n" +
    '        }\n' +
    '    }');
const validated = '                    validateProgress(taskId, config, taskBuffers);';
reward = replaceOnce(reward, validated, validated + '\n' +
    '                if (config.orderedProgress !== undefined) {\n' +
    '                    const buffer = taskBuffers[taskId];\n' +
    '                    const stages = buffer.xinBytes ?? (0, Task96Buffer_1.DecodeTask96Buffer)(buffer);\n' +
    '                    stages[config.requiredProgress - 1] = 1;\n' +
    '                    if (!buffer.xinBytes)\n' +
    '                        stages.forEach((value, index) => { buffer[index] = value; });\n' +
    '                }');
reward = replaceOnce(reward, "['items', 'coins', 'special', 'pets', 'fitments']",
    "['items', 'coins', 'special', 'pets', 'fitments', 'bagPetLevelGain']");
reward = replaceOnce(reward, '    const itemRewards = [',
    '    const bagPetLevelGain = rewards.bagPetLevelGain ?? 0;\n' +
    "    if (bagPetLevelGain !== 0 && bagPetLevelGain !== 1) throw new Error('Invalid quest bag level reward');\n" +
    '    const itemRewards = [');
assert.equal((reward.match(/petRewards\.length/g) || []).length, 5, 'Task pet persistence branches changed');
reward = reward.replaceAll('petRewards.length', '(petRewards.length || bagPetLevelGain)');
reward = replaceOnce(reward, '                let bagCount = stagedPets.filter(pet => pet.isInBag).length;',
    '                if (bagPetLevelGain) require("../Pet/PetProgression").GrantBagPetLevel(stagedPets);\n' +
    '                let bagCount = stagedPets.filter(pet => pet.isInBag).length;');
put(rewardPath, reward);
const handlerDir = 'app/dist/GameServer/Server/Packet/Recv/Task/';
put(handlerDir + 'StoryStateHandlers.js', fs.readFileSync(path.join(server, 'StoryStateHandlers.js')));
let index = fs.readFileSync(path.join(baseline, handlerDir + 'index.js'), 'utf8');
assert.ok(!index.includes('StoryStateHandlers'), 'Story handlers already registered');
index = replaceOnce(index, '//# sourceMappingURL=index.js.map', '__exportStar(require("./StoryStateHandlers"), exports);\n//# sourceMappingURL=index.js.map');
put(handlerDir + 'index.js', index);

put('app/config/data/json/compass_activity.json', fs.readFileSync(path.join(server, 'compass_activity.json')));
put('app/dist/GameServer/Game/Map/CompassActivity.js', fs.readFileSync(path.join(server, 'CompassActivity.js')));
put('app/dist/GameServer/Game/Map/MysteryMonActivity.js', fs.readFileSync(path.join(server, 'MysteryMonActivity.js')));
put('app/config/data/json/forest_mechanisms.json', fs.readFileSync(path.join(server, 'forest_mechanisms.json')));
put('app/dist/GameServer/Game/Map/ForestMechanisms.js', fs.readFileSync(path.join(server, 'ForestMechanisms.js')));
const mapHandlerDir = 'app/dist/GameServer/Server/Packet/Recv/Map/';
put(mapHandlerDir + 'CompassActivityHandlers.js', fs.readFileSync(path.join(server, 'CompassActivityHandlers.js')));
put(mapHandlerDir + 'MysteryMonHandler.js', fs.readFileSync(path.join(server, 'MysteryMonHandler.js')));
put(mapHandlerDir + 'ForestMechanismHandlers.js', fs.readFileSync(path.join(server, 'ForestMechanismHandlers.js')));
let mapIndex = fs.readFileSync(path.join(baseline, mapHandlerDir + 'index.js'), 'utf8');
assert.ok(!mapIndex.includes('CompassActivityHandlers'), 'Compass handlers already registered');
mapIndex = replaceOnce(mapIndex, '//# sourceMappingURL=index.js.map',
    '__exportStar(require("./CompassActivityHandlers"), exports);\n__exportStar(require("./MysteryMonHandler"), exports);\n__exportStar(require("./ForestMechanismHandlers"), exports);\n//# sourceMappingURL=index.js.map');
put(mapHandlerDir + 'index.js', mapIndex);

const loginPath = 'app/dist/GameServer/Game/Login/LoginManager.js';
let loginManager = fs.readFileSync(path.join(baseline, loginPath), 'utf8');
loginManager = replaceOnce(loginManager, `            // 优先使用当前穿戴（clothIds）作为登录外观，避免被背包装备覆盖。
            const wornClothIds = playerInstance.Data.clothIds;
            const clothList = (Array.isArray(wornClothIds) && wornClothIds.length > 0
                ? wornClothIds.map(id => Number(id) || 0).filter(id => id > 0)
                : playerInstance.ItemManager.GetClothItems().map(item => item.itemId))`,
`            // 当前穿戴只取 clothIds；背包拥有不等于已经装备。
            const wornClothIds = playerInstance.Data.clothIds;
            const clothList = (Array.isArray(wornClothIds)
                ? wornClothIds.map(id => Number(id) || 0).filter(id => id > 0)
                : [])`);
put(loginPath, loginManager);
const mapPath = 'app/dist/GameServer/Game/Map/MapManager.js';
let mapManager = fs.readFileSync(path.join(baseline, mapPath), 'utf8');
mapManager = replaceOnce(mapManager, `    /**
     * 鏋勫缓鈥滃綋鍓嶇┛鎴粹€濈殑鏈嶈鍒楄〃锛堢敤浜庝汉鐗╂樉绀猴級
     * 浼樺厛浣跨敤 clothIds锛涜嫢缂哄け鍒欏洖閫€鍒?clothes锛堝吋瀹硅€佹暟鎹級銆?   */
    BuildWornClothes(playerData) {
        const wornIds = playerData?.clothIds;
        if (Array.isArray(wornIds) && wornIds.length > 0) {
            return wornIds
                .map(id => ({ id: Number(id) || 0, level: 0 }))
                .filter(c => c.id > 0);
        }
        const clothes = playerData?.clothes;
        if (Array.isArray(clothes) && clothes.length > 0) {
            return clothes
                .map(cloth => ({
                id: Number(cloth?.id) || 0,
                level: Number(cloth?.level) || 0
            }))
                .filter(c => c.id > 0);
        }
        return [];
    }`, `    /**
     * Build map appearance from equipped clothing, never inventory ownership.
     */
    BuildWornClothes(playerData) {
        const wornIds = playerData?.clothIds;
        if (Array.isArray(wornIds)) {
            return wornIds
                .map(id => ({ id: Number(id) || 0, level: 0 }))
                .filter(c => c.id > 0);
        }
        return [];
    }`);
put(mapPath, mapManager);

const encounters = JSON.parse(fs.readFileSync(path.join(server, 'encounters.json')));
const currentBosses = Object.values(JSON.parse(fs.readFileSync(path.join(baseline, 'app/config/data/json/boss_abilities.json'))).bossConfigs);
for (const encounter of encounters) {
    assert.ok(!currentBosses.some(boss => boss.mapId === encounter.mapId && (boss.param2 ?? 0) === encounter.region),
        'Main already configures this encounter; reconcile its balance: ' + encounter.mapId + ':' + encounter.region);
}
put('app/config/data/json/story_encounters.json', JSON.stringify(encounters, null, 2) + '\n');
put('app/dist/GameServer/Game/Battle/StoryEncounters.js', fs.readFileSync(path.join(server, 'StoryEncounters.js')));
const battlePath = 'app/dist/GameServer/Game/Battle/BattleManager.js';
let battleManager = fs.readFileSync(path.join(baseline, battlePath), 'utf8');
const bossStart = `    async ChallengeBoss(mapId, param2) {
        try {
            // 清理旧战斗（如果存在）
            if (this._currentBattle) {
                this.CleanupBattle();
            }`;
battleManager = replaceOnce(battleManager, bossStart, `    async ChallengeBoss(mapId, param2) {
        try {
            const story = require("./StoryEncounters").GetStoryEncounter(this.Player, mapId, param2);
            if (story === null) {
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.CHALLENGE_BOSS).setResult(5001));
                return;
            }
            // 清理旧战斗（如果存在）
            if (this._currentBattle) {
                this.CleanupBattle();
            }
            if (story) {
                const epoch = this._battleEpoch;
                const battle = await this._initService.CreatePVEBattle(story.petId, story.level);
                if (story.activity && (this._battleEpoch !== epoch ||
                    require("./StoryEncounters").GetStoryEncounter(this.Player, mapId, param2) !== story)) {
                    await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.CHALLENGE_BOSS).setResult(5001));
                    return;
                }
                if (!battle) {
                    const healthy = this.Player.PetManager.GetPetsInBag().some(pet => pet.hp > 0);
                    await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.CHALLENGE_BOSS).setResult(healthy ? 5001 : 10017));
                    return;
                }
                // Original encounters use species stats, without SPT balance or first-defeat rewards.
                battle.battleType = story.capture === true ? BattleModel_1.BattleType.PVE : BattleModel_1.BattleType.BOSS;
                if (story.requiredItems) {
                    const started = await require("../Map/MysteryMonActivity").StartPaidStoryEncounter(
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
                } else {
                    this.InitializeBattle(battle);
                    if (story.activity) this._currentBattleMapId = mapId;
                }
                await this.Player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.CHALLENGE_BOSS));
                await this.SendReadyToFight(battle, battle.enemy.name);
                return;
            }`);
battleManager = replaceOnce(battleManager,
    '            let bossConfig = BossAbility_1.BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);',
    '            let bossConfig = BossAbility_1.BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);\n' +
    '            if (!await require("../Map/ForestMechanisms").ValidateForestBossEntry(this.Player, mapId, param2, bossConfig)) return;');
put(battlePath, battleManager);

const battleRewardPath = 'app/dist/GameServer/Game/Battle/services/BattleRewardService.js';
let battleReward = fs.readFileSync(path.join(baseline, battleRewardPath), 'utf8');
battleReward = replaceOnce(battleReward, '            // 6. 处理SPT首次击败奖励（如果是BOSS战斗）',
    '            result.droppedItems.push(...await require("../../Map/MysteryMonActivity").GrantMysteryFragments(this._player, battle, mapId, slot));\n' +
    '            // 6. 处理SPT首次击败奖励（如果是BOSS战斗）');
put(battleRewardPath, battleReward);

for (const asset of JSON.parse(fs.readFileSync(path.join(patch, 'resources.json')))) {
    let bytes = fs.readFileSync(path.join(v.resources, asset.path));
    assert.equal(sha(bytes), asset.sha256, 'Captured asset changed: ' + asset.path);
    assert.ok(['CWS', 'FWS'].includes(bytes.subarray(0, 3).toString()), 'Invalid SWF asset');
    if (asset.patch) {
        const directory = path.join(compiler, asset.patch.directory);
        for (const name of asset.patch.classes) {
            const script = name.replaceAll('.', '/') + '.as';
            const target = path.join(directory, 'import/scripts', script);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.copyFileSync(path.join(patch, asset.patch.directory, 'scripts', script), target);
        }
        const compiledPath = path.join(directory, 'compiled.swf');
        execFileSync(v.java, ['-Djava.awt.headless=true', '-jar', v.ffdec, '-onerror', 'abort', '-importScript',
            path.join(v.resources, asset.path), compiledPath, path.join(directory, 'import')],
            { stdio: 'inherit', timeout: 120000 });
        const before = parse(bytes), compiledBytes = fs.readFileSync(compiledPath), after = parse(compiledBytes);
        assert.ok(before.header.equals(after.header), 'Module geometry changed: ' + asset.path);
        assert.equal(before.tags.length, after.tags.length, 'Module tag count changed: ' + asset.path);
        const allowed = new Set(asset.patch.abcTags);
        const changed = [];
        after.tags.forEach((t, index) => {
            if (t.raw.equals(before.tags[index].raw)) return;
            assert.ok(t.code === 82 && allowed.has(t.name), 'Unrelated module change: ' + asset.path);
            changed.push(t.name);
        });
        assert.deepEqual(changed.sort(), [...allowed].sort(), 'Module script was not patched: ' + asset.path);
        bytes = compiledBytes;
    }
    if (!asset.missingFromLive && !asset.patch) continue;
    for (const prefix of ['client/assets/', 'client/overlay/']) put(prefix + asset.path, bytes);
}
const manifest = { baselineCoreSha256: sha(coreRaw), referenceSha256: sha(referenceRaw), classes: classNames,
    quests: Object.keys(storyTasks).map(Number), files };
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ files: files.length, classes: classNames.length, addedClasses: additions.length, quests: manifest.quests, coreSha256: sha(finalCore) }, null, 2));
