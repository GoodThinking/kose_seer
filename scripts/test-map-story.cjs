'use strict';
// Real handlers, task models and reward transactions; disposable SQLite only.
// Usage: node scripts/test-map-story.cjs <captured app with dependencies> <release> [evidence dir]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const app = path.resolve(process.argv[2]), release = path.resolve(process.argv[3]);
const evidence = process.argv[4] && path.resolve(process.argv[4]);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-map-story-'));
fs.cpSync(path.join(app, 'config'), path.join(temporary, 'config'), { recursive: true });
fs.cpSync(path.join(release, 'app/config'), path.join(temporary, 'config'), { recursive: true });
fs.cpSync(path.join(app, 'dist'), path.join(temporary, 'dist'), { recursive: true });
fs.cpSync(path.join(release, 'app/dist'), path.join(temporary, 'dist'), { recursive: true });
fs.symlinkSync(path.join(app, 'node_modules'), path.join(temporary, 'node_modules'), 'dir');
const compassRules = JSON.parse(fs.readFileSync(path.join(temporary, 'config/data/json/compass_activity.json')));
process.chdir(temporary);
const load = file => require(path.join(temporary, 'dist', file));
load('DataBase/loaders/DataLoader');
const { Config } = load('shared/config/ServerConfig');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { DatabaseManager } = load('DataBase/DatabaseManager');
const { DatabaseHelper } = load('DataBase/DatabaseHelper');
const { PlayerData } = load('DataBase/models/PlayerData');
const { TaskData } = load('DataBase/models/TaskData');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance');
const { GameEventBus } = load('GameServer/Game/Event/GameEventBus');
const { createDefaultPlayerInfo } = load('shared/models/PlayerModel');
const { ItemManager } = load('GameServer/Game/Item/ItemManager');
const { ItemSystem } = load('GameServer/Game/Item/ItemSystem');
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { ConfigKeys, ConfigPaths, ConfigTypes } = load('shared/config/ConfigDefinitions');
const { CompassActivity, CompassAlreadyClaimed } = load('GameServer/Game/Map/CompassActivity');
const { MapManager } = load('GameServer/Game/Map/MapManager');
const { CompassExperienceHandler, CompassItemHandler } = load('GameServer/Server/Packet/Recv/Map/CompassActivityHandlers');
const { TaskManager } = load('GameServer/Game/Task/TaskManager');
const { StoryStatusHandler, StoryBufferRecordHandler } = load('GameServer/Server/Packet/Recv/Task/StoryStateHandlers');
const { BattleManager } = load('GameServer/Game/Battle/BattleManager');
const { BattleType } = load('shared/models/BattleModel');
const { GetStoryEncounter } = load('GameServer/Game/Battle/StoryEncounters');
const { PetManager } = load('GameServer/Game/Pet/PetManager');
const { PetCalculator } = load('GameServer/Game/Pet/PetCalculator');
const { AdvancePetExperience } = load('GameServer/Game/Pet/PetProgression');
const { createDefaultPetInfo } = load('shared/models/PetModel');
const { MysteryMonHandler } = load('GameServer/Server/Packet/Recv/Map/MysteryMonHandler');
const { StartPaidStoryEncounter, GrantMysteryFragments } = load('GameServer/Game/Map/MysteryMonActivity');
const { ForestMechanisms, ValidateForestBossEntry } = load('GameServer/Game/Map/ForestMechanisms');
const { ForestFruitHandler } = load('GameServer/Server/Packet/Recv/Map/ForestMechanismHandlers');
const forestRules = JSON.parse(fs.readFileSync(path.join(temporary, 'config/data/json/forest_mechanisms.json')));
const mysteryRule = JSON.parse(fs.readFileSync(path.join(temporary, 'config/data/json/story_encounters.json'))).find(row => row.fragmentDrop);
const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
const players = [], passed = [];
let uid = 971000;
function uints(values) {
    const bytes = Buffer.alloc(values.length * 4);
    values.forEach((value, i) => bytes.writeUInt32BE(value, i * 4));
    return bytes;
}
function stage(...bits) {
    const bytes = Buffer.alloc(100);
    bytes.set(bits);
    return bytes;
}
async function fixture(initial = {}, items = []) {
    const id = ++uid;
    await db.Execute('INSERT INTO players VALUES (?, 100, 0, 77, 0, 0, 425)', [id]);
    await db.Execute('INSERT INTO player_tasks(owner_id,task_list,task_buffers) VALUES (?,?,?)', [id, JSON.stringify(initial), '{}']);
    await db.Execute('INSERT INTO player_items(owner_id,item_list) VALUES (?,?)', [id, JSON.stringify(items)]);
    const player = Object.create(PlayerInstance.prototype);
    Object.defineProperty(player, 'Uid', { value: id });
    Object.defineProperty(player, 'ClientProtocol', { value: 'xin-20261013' });
    player.Data = new PlayerData(Object.assign(createDefaultPlayerInfo(id, 'MapStoryContract'), { coins: 100, gold: 0, allocatableExp: 77, mapID: 425 }));
    player.EventBus = new GameEventBus();
    player.packets = [];
    player.SendPacket = async packet => player.packets.push({ command: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('xin-20261013') });
    player._session = { Socket: { destroyed: false }, Player: player };
    player.ItemManager = new ItemManager(player);
    await player.ItemManager.Initialize();
    player.TaskManager = new TaskManager(player);
    await player.TaskManager.Initialize();
    players.push(player);
    return player;
}
async function saved(player) {
    const [tasks] = await db.Query('SELECT task_list,task_buffers FROM player_tasks WHERE owner_id=?', [player.Uid]);
    const [wallet] = await db.Query('SELECT coins,gold,allocatable_exp FROM players WHERE user_id=?', [player.Uid]);
    return { tasks: JSON.parse(tasks.task_list), buffers: JSON.parse(tasks.task_buffers), wallet };
}
async function query(player, ids = [616, 619, 624, 658]) {
    await new StoryStatusHandler().Handle(player.Session, {}, uints([5, ids.length, ...ids]));
    const packet = player.packets.at(-1);
    assert.equal(packet.result, 0);
    assert.equal(packet.command, 50008);
    assert.equal(packet.body.readUInt32BE(0), 5);
    assert.equal(packet.body.readUInt32BE(4), ids.length);
    assert.equal(packet.body.length, 8 + ids.length * 8 + 200);
    const states = {};
    for (let i = 0; i < ids.length; i++) {
        assert.equal(packet.body.readUInt32BE(8 + i * 8), ids[i]);
        states[ids[i]] = packet.body.readUInt32BE(12 + i * 8);
    }
    return { states, records: packet.body.subarray(8 + ids.length * 8) };
}
async function records(player, entries) {
    await new StoryBufferRecordHandler().Handle(player.Session, {}, uints([entries.length, ...entries.flat()]));
    return player.packets.at(-1).result;
}
async function reloadTasks(player) {
    const [row] = await db.Query('SELECT * FROM player_tasks WHERE owner_id=?', [player.Uid]);
    player.TaskManager.TaskData = TaskData.FromRow(row);
}
async function savedCompass(player) {
    const [row] = await db.Query('SELECT item_list FROM player_items WHERE owner_id=?', [player.Uid]);
    const claims = await db.Query('SELECT reward_key,period_start,amount FROM receiver_claims WHERE owner_id=? ORDER BY reward_key,period_start', [player.Uid]);
    return { wallet: (await saved(player)).wallet, items: JSON.parse(row.item_list), claims };
}
async function run(name, scenario) { await scenario(); passed.push(name); }
function storyPet(ownerId, petId, level, catchTime, isInBag = true) {
    const pet = Object.assign(createDefaultPetInfo(ownerId, petId), {
        level, catchTime, isInBag, dv: 31, nature: 0, exp: 7,
        skillArray: [10001], skillPP: { 10001: 0 }
    });
    PetCalculator.UpdatePetStats(pet);
    pet.hp = 1;
    return pet;
}
async function treasureFixture() {
    const p = await fixture();
    const pets = [[1, 17, true], [2, 21, true], [3, 99, true], [3, 100, true], [3, 20, false]]
        .map(([id, level, inBag], i) => storyPet(p.Uid, id, level, 1000 + i, inBag));
    await db.Execute('INSERT INTO player_pets(owner_id,pet_list) VALUES (?,?)', [p.Uid, JSON.stringify(pets)]);
    p.PetManager = new PetManager(p);
    await p.PetManager.Initialize();
    await p.TaskManager.AcceptTask(530);
    await p.TaskManager.SetTaskBufferBytes(530, stage(1, 1, 0));
    return p;
}
async function savedTreasure(p) {
    const [pets] = await db.Query('SELECT pet_list FROM player_pets WHERE owner_id=?', [p.Uid]);
    const [items] = await db.Query('SELECT item_list FROM player_items WHERE owner_id=?', [p.Uid]);
    return { ...await saved(p), pets: JSON.parse(pets.pet_list), items: JSON.parse(items.item_list) };
}
async function mysteryFixture(counts = [1, 1, 1], introduced = true) {
    const p = await fixture({}, mysteryRule.requiredItems.map((item, index) => ({
        itemId: item.itemId, count: counts[index], expireTime: 360000
    })));
    p.Data.mapID = mysteryRule.mapId;
    p.BattleManager = new BattleManager(p);
    if (introduced) await records(p, [[mysteryRule.requiredRecord, 1]]);
    return p;
}
async function fragmentCounts(p) {
    return (await savedCompass(p)).items.filter(item => mysteryRule.requiredItems.some(cost => cost.itemId === item.itemId))
        .map(item => item.count);
}
(async () => {
    ConfigLoader.Instance._configDir = path.join(temporary, 'config'); ConfigLoader.Instance.Reload();
    for (const key of [ConfigKeys.ITEM_CONFIG, ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.NATURES_CONFIG]) {
        ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigTypes[key]);
    }
    await ConfigRegistry.Instance.Initialize();
    Config.Config.database = { type: 'sqlite', path: path.join(temporary, 'story.sqlite') };
    Config.Game.clientProtocol = 'xin-20261013';
    await db.Initialize();
    await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL,map_id INTEGER NOT NULL)');
    const taskSchema = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)()
        .upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_tasks'));
    assert.ok(taskSchema, 'Missing canonical player_tasks schema');
    await db.Execute(taskSchema);
    const petSchema = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)()
        .upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'));
    await db.Execute(petSchema);
    const inventorySchema = new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite();
    const quotaSchema = new (load('DataBase/migrations/scripts/021_create_receiver_claims').Migration021CreateReceiverClaims)().upSQLite();
    for (const sql of [...inventorySchema, ...quotaSchema]) await db.Execute(sql);
    await run('High quest states survive reload without extending the 500-byte login task table', async () => {
        const entry = (taskId, status) => ({ taskId, status, acceptTime: 1, completeTime: status === 3 ? 2 : 0 });
        const p = await fixture({ 616: entry(616, 3), 619: entry(619, 2), 658: entry(658, 1) });
        await reloadTasks(p);
        assert.deepEqual((await query(p)).states, { 616: 3, 619: 1, 624: 0, 658: 1 });
        assert.equal(p.TaskManager.GetTaskStatusArray().length, 500);
        assert.deepEqual((await query(await fixture())).states, { 616: 0, 619: 0, 624: 0, 658: 0 });
    });
    await run('Concurrent record bits, boundary bits and clearing persist per player across reload', async () => {
        const p = await fixture();
        const results = await Promise.all([records(p, [[0, 1]]), records(p, [[7, 1]]), records(p, [[1599, 1]])]);
        assert.deepEqual(results, [0, 0, 0]);
        assert.equal(await records(p, [[7, 0]]), 0);
        await reloadTasks(p);
        const expected = Buffer.alloc(200); expected[0] = 1; expected[199] = 128;
        assert.deepEqual((await query(p)).records, expected);
        assert.deepEqual((await query(await fixture())).records, Buffer.alloc(200));
    });
    await run('Malformed record writes reject the whole batch without changing committed or visible bits', async () => {
        const p = await fixture(), before = await saved(p);
        for (const body of [Buffer.alloc(0), uints([2, 0, 1]), uints([2, 0, 1, 1600, 1]), uints([1, 7, 2])]) {
            await new StoryBufferRecordHandler().Handle(p.Session, {}, body);
            assert.equal(p.packets.at(-1).result, 5001);
            assert.deepEqual(await saved(p), before);
            assert.deepEqual((await query(p)).records, Buffer.alloc(200));
        }
    });
    await run('A database failure does not acknowledge or publish an uncommitted story record', async () => {
        const p = await fixture(), before = await saved(p);
        await db.Execute(`CREATE TRIGGER reject_story_record BEFORE UPDATE OF task_buffers ON player_tasks WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'story rollback fixture'); END`);
        try {
            assert.equal(await records(p, [[42, 1]]), 5000);
            assert.deepEqual(await saved(p), before);
            assert.deepEqual((await query(p)).records, Buffer.alloc(200));
        } finally { await db.Execute('DROP TRIGGER reject_story_record'); }
        assert.equal(await records(p, [[42, 1]]), 0);
        await reloadTasks(p);
        assert.equal((await query(p)).records[5], 4);
    });
    await run('Malformed state queries reject unsupported types and truncated or oversized ID lists', async () => {
        const p = await fixture(), before = await saved(p);
        for (const body of [Buffer.alloc(0), uints([4, 1, 616]), uints([5, 2, 616]), uints([5, 257, ...Array(257).fill(616)])]) {
            await new StoryStatusHandler().Handle(p.Session, {}, body);
            assert.equal(p.packets.at(-1).result, 5001);
        }
        assert.deepEqual(await saved(p), before);
    });
    await run('A later story quest cannot be accepted before its original prerequisite completes', async () => {
        const p = await fixture();
        await assert.rejects(p.TaskManager.AcceptTask(619), /Previous story quest/);
        assert.equal((await saved(p)).tasks[619], undefined);
        await p.TaskManager.AcceptTask(616);
        await p.TaskManager.SetTaskBufferBytes(616, stage(1, 1, 1, 0));
        await p.TaskManager.CompleteTask(616, 0);
        assert.equal(p.packets.at(-1).result, 0);
        await p.TaskManager.AcceptTask(619);
        await reloadTasks(p);
        assert.deepEqual((await query(p, [616, 619])).states, { 616: 3, 619: 1 });
    });
    await run('Skipped earlier stages cannot be mistaken for the final in-flight stage', async () => {
        const p = await fixture();
        await p.TaskManager.AcceptTask(616);
        await p.TaskManager.SetTaskBufferBytes(616, stage(0, 1, 1, 1));
        const before = await saved(p);
        await p.TaskManager.CompleteTask(616, 0);
        assert.equal(p.packets.at(-1).result, 5000);
        assert.deepEqual(await saved(p), before);
    });
    await run('Final native stage grants original experience once despite concurrent or repeated completion', async () => {
        const p = await fixture();
        await p.TaskManager.AcceptTask(616);
        await p.TaskManager.SetTaskBufferBytes(616, stage(1, 1, 1, 0));
        await Promise.all([p.TaskManager.CompleteTask(616, 0), p.TaskManager.CompleteTask(616, 0)]);
        await p.TaskManager.CompleteTask(616, 0);
        const state = await saved(p);
        assert.equal(state.tasks[616].status, 3);
        assert.deepEqual(state.buffers[616].xinBytes.slice(0, 4), [1, 1, 1, 1]);
        assert.deepEqual(state.wallet, { coins: 100, gold: 0, allocatable_exp: 5077 });
        assert.equal(p.packets.filter(p => p.command === 2202 && p.result === 0).length, 1);
        await reloadTasks(p);
        assert.equal((await query(p, [616])).states[616], 3);
    });
    await run('The independent mine rescue preserves its original experience and coin rewards', async () => {
        const p = await fixture();
        await p.TaskManager.AcceptTask(620);
        await p.TaskManager.SetTaskBufferBytes(620, stage(1, 1, 0));
        await p.TaskManager.CompleteTask(620, 0);
        assert.equal(p.packets.at(-1).result, 0);
        assert.deepEqual((await saved(p)).wallet, { coins: 2100, gold: 0, allocatable_exp: 2077 });
    });
    await run('Treasure completion upgrades only bag pets once, including evolution, new skills and level cap', async () => {
        const p = await treasureFixture(), before = await savedTreasure(p);
        await Promise.all([p.TaskManager.CompleteTask(530, 0), p.TaskManager.CompleteTask(530, 0)]);
        await p.TaskManager.CompleteTask(530, 0);
        const after = await savedTreasure(p);
        assert.deepEqual(after.pets.map(pet => [pet.petId, pet.level]), [[2, 18], [2, 22], [3, 100], [3, 100], [3, 20]]);
        assert.deepEqual(after.pets.slice(3), before.pets.slice(3));
        assert.deepEqual(after.pets.slice(0, 3).map(pet => pet.exp), [0, 0, 0]);
        assert.ok(after.pets[1].skillArray.includes(10011));
        for (const pet of after.pets.slice(0, 3)) {
            assert.equal(pet.hp, pet.maxHp);
            assert.ok(Object.values(pet.skillPP).every(pp => pp > 0));
        }
        assert.deepEqual(after.pets, p.PetManager.PetData.PetList);
        assert.deepEqual(after.wallet, { coins: 2100, gold: 0, allocatable_exp: 2577 });
        assert.equal(after.items.find(item => item.itemId === 500833).count, 1);
        assert.equal(after.tasks[530].status, 3);
        assert.deepEqual(after.buffers[530].xinBytes.slice(0, 3), [1, 1, 1]);
        assert.equal(p.packets.filter(packet => packet.command === 2202 && packet.result === 0).length, 1);
        assert.deepEqual(await db.Query('SELECT pet_all_num,pet_max_lev FROM players WHERE user_id=?', [p.Uid]),
            [{ pet_all_num: 5, pet_max_lev: 100 }]);
    });
    await run('A failed treasure pet write rolls back task, furniture, currency and cached pet levels together', async () => {
        const p = await treasureFixture(), before = await savedTreasure(p);
        await db.Execute(`CREATE TRIGGER reject_treasure_pet BEFORE UPDATE ON player_pets WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'treasure rollback fixture'); END`);
        try {
            await p.TaskManager.CompleteTask(530, 0);
            assert.equal(p.packets.at(-1).result, 5000);
            assert.deepEqual(await savedTreasure(p), before);
            assert.deepEqual(p.PetManager.PetData.PetList, before.pets);
            assert.equal(p.ItemManager.GetItemCount(500833), 0);
            assert.equal(p.Data.coins, before.wallet.coins);
        } finally { await db.Execute('DROP TRIGGER reject_treasure_pet'); }
        await p.TaskManager.CompleteTask(530, 0);
        assert.equal(p.packets.at(-1).result, 0);
        assert.equal((await savedTreasure(p)).pets[0].level, 18);
    });
    await run('Treasure energy branches allow the original volcano battle first without exposing regular boss routes', async () => {
        const p = await fixture({ 530: { taskId: 530, status: 3, acceptTime: 1, completeTime: 2 } });
        await p.TaskManager.AcceptTask(532);
        p.Data.mapID = 17;
        const encounter = GetStoryEncounter(p, 17, 2);
        assert.deepEqual([encounter.petId, encounter.level], [95, 100]);
        assert.equal(GetStoryEncounter(p, 17, 0), undefined);
        assert.equal(GetStoryEncounter(p, 16, 2), undefined);
        await p.TaskManager.SetTaskBufferBytes(532, stage(0, 0, 1, 0));
        await reloadTasks(p);
        assert.equal(GetStoryEncounter(p, 17, 2), null);
        p.Data.mapID = 12;
        assert.equal(GetStoryEncounter(p, 17, 2), null);
    });
    await run('Unordered energy branches still require all three energies and grant the final reward only once', async () => {
        const p = await treasureFixture();
        await p.TaskManager.CompleteTask(530, 0);
        await p.TaskManager.AcceptTask(532);
        for (const progress of [[0, 0, 1, 0], [0, 1, 1, 1]]) {
            await p.TaskManager.SetTaskBufferBytes(532, stage(...progress));
            const before = await savedTreasure(p);
            await p.TaskManager.CompleteTask(532, 0);
            assert.equal(p.packets.at(-1).result, 5000);
            assert.deepEqual(await savedTreasure(p), before);
        }
        await p.TaskManager.SetTaskBufferBytes(532, stage(1, 1, 1, 0));
        const before = await savedTreasure(p);
        p.packets.length = 0;
        await Promise.all([p.TaskManager.CompleteTask(532, 0), p.TaskManager.CompleteTask(532, 0)]);
        await p.TaskManager.CompleteTask(532, 0);
        const after = await savedTreasure(p);
        assert.equal(after.tasks[532].status, 3);
        assert.deepEqual(after.buffers[532].xinBytes.slice(0, 4), [1, 1, 1, 1]);
        assert.deepEqual(after.wallet, { ...before.wallet, coins: before.wallet.coins + 2000, allocatable_exp: before.wallet.allocatable_exp + 2000 });
        assert.deepEqual(after.pets.map(pet => pet.level), [19, 23, 100, 100, 20]);
        assert.deepEqual(after.pets.slice(2), before.pets.slice(2));
        assert.deepEqual(after.items, before.items);
        assert.equal(p.packets.filter(packet => packet.command === 2202 && packet.result === 0).length, 1);
        await reloadTasks(p);
        assert.equal((await query(p, [532])).states[532], 3);
    });
    await run('Ordinary experience retains excess experience across evolution and multiple levels', async () => {
        const pet = storyPet(1, 1, 17, 1);
        pet.exp = PetCalculator.ExpForNextLevel(17, 1) + PetCalculator.ExpForNextLevel(18, 2) + 7;
        const result = AdvancePetExperience(pet);
        assert.deepEqual([pet.petId, pet.level, pet.exp, result.evolved], [2, 19, 7, true]);
        const learner = storyPet(1, 2, 21, 2);
        learner.exp = PetCalculator.ExpForNextLevel(21, 2) + 5;
        assert.deepEqual(AdvancePetExperience(learner).newSkills, [10011]);
        assert.deepEqual([learner.level, learner.exp], [22, 5]);
    });
    await run('Concurrent compass experience claims credit one weekly reward without requiring a following NoNo', async () => {
        const p = await fixture(), activity = new CompassActivity(p);
        const results = await Promise.allSettled([activity.ClaimExperience(), activity.ClaimExperience()]);
        assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
        assert.ok(results.find(result => result.status === 'rejected').reason instanceof CompassAlreadyClaimed);
        await assert.rejects(new CompassActivity(p).ClaimExperience(), CompassAlreadyClaimed);
        const state = await savedCompass(p);
        assert.deepEqual(state.wallet, { coins: 100, gold: 0, allocatable_exp: 77 + compassRules.experience });
        assert.deepEqual(state.claims.map(row => [row.reward_key, row.amount]), [['compass:experience', compassRules.experience]]);
        assert.equal(p.Data.allocatableExp, state.wallet.allocatable_exp);
    });
    await run('Compass item quota is atomic, independent per reward and independent per player', async () => {
        const p = await fixture(), activity = new CompassActivity(p);
        const results = await Promise.allSettled([activity.ClaimItem(1), activity.ClaimItem(1), activity.ClaimItem(2)]);
        assert.equal(results.filter(result => result.status === 'fulfilled').length, 2);
        assert.ok(results.find(result => result.status === 'rejected').reason instanceof CompassAlreadyClaimed);
        const state = await savedCompass(p);
        assert.deepEqual(state.items.map(item => [item.itemId, item.count]).sort(),
            Object.values(compassRules.items).map(item => [item.itemId, item.count]).sort());
        assert.deepEqual(p.ItemManager.ItemData.ItemList, state.items);
        assert.deepEqual(state.claims.map(row => row.reward_key), ['compass:item:1', 'compass:item:2']);
        const other = await fixture();
        await new CompassActivity(other).ClaimItem(1);
        assert.equal((await savedCompass(other)).items.find(item => item.itemId === compassRules.items[1].itemId).count, compassRules.items[1].count);
    });
    await run('Full inventory rejects a compass item without spending its daily quota', async () => {
        const reward = compassRules.items[1];
        const p = await fixture({}, [{ itemId: reward.itemId, count: ItemSystem.GetMaxStack(reward.itemId), expireTime: 0x057E40 }]);
        const before = await savedCompass(p);
        await assert.rejects(new CompassActivity(p).ClaimItem(1));
        assert.deepEqual(await savedCompass(p), before);
        assert.deepEqual(p.ItemManager.ItemData.ItemList, before.items);
        await new CompassActivity(p).ClaimItem(2);
        assert.deepEqual((await savedCompass(p)).claims.map(row => row.reward_key), ['compass:item:2']);
    });
    await run('Failed compass balance or item writes roll back quota and remain claimable', async () => {
        for (const kind of ['experience', 'item']) {
            const p = await fixture(), before = await savedCompass(p), activity = new CompassActivity(p);
            const target = kind === 'experience' ? 'players' : 'player_items';
            const key = kind === 'experience' ? 'user_id' : 'owner_id';
            await db.Execute(`CREATE TRIGGER reject_compass BEFORE UPDATE ON ${target} WHEN NEW.${key}=${p.Uid} BEGIN SELECT RAISE(ABORT,'compass rollback fixture'); END`);
            try {
                await assert.rejects(kind === 'experience' ? activity.ClaimExperience() : activity.ClaimItem(1), /compass rollback fixture/);
                assert.deepEqual(await savedCompass(p), before);
                assert.deepEqual(p.ItemManager.ItemData.ItemList, before.items);
                assert.equal(p.Data.allocatableExp, before.wallet.allocatable_exp);
            } finally { await db.Execute('DROP TRIGGER reject_compass'); }
            if (kind === 'experience') await activity.ClaimExperience();
            else await activity.ClaimItem(1);
            assert.equal((await savedCompass(p)).claims.length, 1);
        }
    });
    await run('A lost compass item response cannot cause a second grant on retry', async () => {
        const p = await fixture(), send = p.SendPacket;
        p.SendPacket = async () => { throw new Error('compass disconnected response fixture'); };
        await new CompassItemHandler().Handle(p.Session, {}, uints([1]));
        const committed = await savedCompass(p);
        assert.equal(committed.items.find(item => item.itemId === compassRules.items[1].itemId).count, compassRules.items[1].count);
        p.SendPacket = send;
        await new CompassItemHandler().Handle(p.Session, {}, uints([1]));
        assert.equal(p.packets.at(-1).result, 5002);
        assert.deepEqual(await savedCompass(p), committed);
    });
    await run('Malformed, wrong-map and busy compass requests cannot grant or consume quota', async () => {
        const p = await fixture(), before = await savedCompass(p);
        await new CompassExperienceHandler().Handle(p.Session, {}, uints([1]));
        assert.equal(p.packets.at(-1).result, 5001);
        for (const body of [Buffer.alloc(0), uints([3])]) {
            await new CompassItemHandler().Handle(p.Session, {}, body);
            assert.equal(p.packets.at(-1).result, 5001);
        }
        p.Data.mapID = 4;
        await assert.rejects(new CompassActivity(p).ClaimExperience());
        await assert.rejects(new CompassActivity(p).ClaimItem(1));
        p.Data.mapID = 425;
        p.Data.actionType = 1;
        await assert.rejects(new CompassActivity(p).ClaimExperience());
        await assert.rejects(new CompassActivity(p).ClaimItem(1));
        assert.deepEqual(await savedCompass(p), before);
    });
    await run('Compass daily items reset at Beijing midnight without resetting the weekly experience quota', async () => {
        const now = Date.now, p = await fixture(), activity = new CompassActivity(p);
        try {
            Date.now = () => Date.UTC(2026, 9, 25, 15, 59, 59);
            await activity.ClaimExperience();
            await activity.ClaimItem(1);
            Date.now = () => Date.UTC(2026, 9, 25, 16, 0, 1);
            await activity.ClaimExperience();
            await activity.ClaimItem(1);
            Date.now = () => Date.UTC(2026, 9, 26, 16, 0, 1);
            await assert.rejects(activity.ClaimExperience(), CompassAlreadyClaimed);
            await activity.ClaimItem(1);
            const state = await savedCompass(p);
            assert.equal(state.wallet.allocatable_exp, 77 + compassRules.experience * 2);
            assert.equal(state.items.find(item => item.itemId === compassRules.items[1].itemId).count, compassRules.items[1].count * 3);
            assert.equal(state.claims.filter(row => row.reward_key === 'compass:experience').length, 2);
            assert.equal(state.claims.filter(row => row.reward_key === 'compass:item:1').length, 3);
        } finally { Date.now = now; }
    });
    await run('Owning a maze torch does not equip it in map appearance', async () => {
        const p = await fixture({}, [{ itemId: 100044, count: 1, expireTime: 360000 }]);
        assert.equal(p.ItemManager.GetItemCount(100044), 1);
        const info = new MapManager(p).buildUserInfo(p.Uid, p.Data, 0, 0, p);
        assert.deepEqual(info.clothes, []);
    });
    await run('Fragment readiness is read-only, respects introduction and rejects malformed or wrong-map requests', async () => {
        const p = await mysteryFixture([1, 1, 1], false), handler = new MysteryMonHandler();
        await handler.Handle(p.Session, {}, Buffer.alloc(0));
        assert.equal(p.packets.at(-1).body.readUInt32BE(0), 0);
        await records(p, [[218, 1]]);
        for (let i = 0; i < 2; i++) {
            await handler.Handle(p.Session, {}, Buffer.alloc(0));
            assert.equal(p.packets.at(-1).body.readUInt32BE(0), 1);
            assert.deepEqual(await fragmentCounts(p), [1, 1, 1]);
        }
        await handler.Handle(p.Session, {}, uints([1]));
        assert.equal(p.packets.at(-1).result, 5001);
        p.Data.mapID = 494;
        await handler.Handle(p.Session, {}, Buffer.alloc(0));
        assert.equal(p.packets.at(-1).result, 5001);
        assert.deepEqual(await fragmentCounts(p), [1, 1, 1]);
        const missing = await mysteryFixture([1, 0, 1]);
        await handler.Handle(missing.Session, {}, Buffer.alloc(0));
        assert.equal(missing.packets.at(-1).body.readUInt32BE(0), 0);
    });
    await run('Concurrent summon attempts spend one complete fragment set, never a partial set', async () => {
        const p = await mysteryFixture();
        let starts = 0;
        const attempt = () => StartPaidStoryEncounter(p, mysteryRule,
            () => GetStoryEncounter(p, 476, 0) === mysteryRule ||
                GetStoryEncounter(p, 476, 0)?.petId === mysteryRule.petId,
            () => { starts++; });
        assert.deepEqual(await Promise.all([attempt(), attempt(), attempt()]), [true, false, false]);
        assert.equal(starts, 1);
        assert.deepEqual(await fragmentCounts(p), [0, 0, 0]);
        const missing = await mysteryFixture([1, 0, 1]);
        assert.equal(await StartPaidStoryEncounter(missing, mysteryRule, () => true, () => assert.fail('Incomplete set started a battle')), false);
        assert.deepEqual(await fragmentCounts(missing), [1, 0, 1]);
    });
    await run('Fragment payment failure rolls back all colors without starting a battle or publishing counts', async () => {
        const p = await mysteryFixture();
        await db.Execute(`CREATE TRIGGER reject_fragment_payment BEFORE UPDATE ON player_items WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'fragment payment fixture'); END`);
        try {
            await assert.rejects(StartPaidStoryEncounter(p, mysteryRule, () => true, () => assert.fail('Failed payment started a battle')));
            assert.deepEqual(await fragmentCounts(p), [1, 1, 1]);
            assert.deepEqual(mysteryRule.requiredItems.map(item => p.ItemManager.GetItemCount(item.itemId)), [1, 1, 1]);
        } finally { await db.Execute('DROP TRIGGER reject_fragment_payment'); }
    });
    await run('A map change during payment commit restores the original fragment set without starting a battle', async () => {
        const p = await mysteryFixture(), driver = db.Driver, commit = driver.commit;
        driver.commit = async function() { await commit.call(this); p.Data.mapID = 494; };
        try {
            assert.equal(await StartPaidStoryEncounter(p, mysteryRule, () => p.Data.mapID === 476,
                () => assert.fail('Cancelled encounter started a battle')), false);
            assert.deepEqual(await fragmentCounts(p), [1, 1, 1]);
            assert.deepEqual(mysteryRule.requiredItems.map(item => p.ItemManager.GetItemCount(item.itemId)), [1, 1, 1]);
        } finally { driver.commit = commit; }
    });
    await run('Fragment drops require introduced sunlight wild battles and preserve the exact probability boundary', async () => {
        const p = await mysteryFixture([0, 0, 0], false), battle = { battleType: BattleType.PVE, enemy: { id: 742 } };
        const random = Math.random;
        try {
            Math.random = () => 0;
            assert.deepEqual(await GrantMysteryFragments(p, battle, 476, 0), []);
            await records(p, [[218, 1]]);
            for (const [candidate, map, slot] of [
                [battle, 494, 0], [battle, 476, -1],
                [{ ...battle, battleType: BattleType.BOSS }, 476, 0],
                [{ ...battle, enemy: { id: 980 } }, 476, 0]
            ]) assert.deepEqual(await GrantMysteryFragments(p, candidate, map, slot), []);
            assert.deepEqual(await fragmentCounts(p), [0, 0, 0]);
            const rolls = [0.099, 0.99, 0.1, 0.101];
            Math.random = () => rolls.shift();
            assert.deepEqual(await GrantMysteryFragments(p, battle, 476, 0), [{ itemId: 300414, count: 2 }]);
            assert.deepEqual(await fragmentCounts(p), [2, 0, 0]);
        } finally { Math.random = random; }
    });
    await run('Concurrent fragment drops respect client stack limits and report only the amounts actually stored', async () => {
        const p = await mysteryFixture([98, 98, 98]), battle = { battleType: BattleType.PVE, enemy: { id: 743 } };
        const random = Math.random;
        let roll = 0;
        try {
            Math.random = () => roll++ % 2 ? 0.99 : 0;
            const results = await Promise.all([GrantMysteryFragments(p, battle, 476, 0), GrantMysteryFragments(p, battle, 476, 0)]);
            assert.deepEqual(results, [mysteryRule.requiredItems.map(item => ({ itemId: item.itemId, count: 1 })), []]);
            assert.deepEqual(await fragmentCounts(p), [99, 99, 99]);
        } finally { Math.random = random; }
    });
    await run('Fragment drop persistence failure grants no colors and leaves the visible inventory unchanged', async () => {
        const p = await mysteryFixture([0, 0, 0]), random = Math.random;
        await db.Execute(`CREATE TRIGGER reject_fragment_drop BEFORE UPDATE ON player_items WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'fragment drop fixture'); END`);
        try {
            Math.random = () => 0;
            await assert.rejects(GrantMysteryFragments(p, { battleType: BattleType.PVE, enemy: { id: 742 } }, 476, 0));
            assert.deepEqual(await fragmentCounts(p), [0, 0, 0]);
            assert.deepEqual(mysteryRule.requiredItems.map(item => p.ItemManager.GetItemCount(item.itemId)), [0, 0, 0]);
        } finally { Math.random = random; await db.Execute('DROP TRIGGER reject_fragment_drop'); }
    });
    await run('Fruit requests reject malformed bodies, wrong maps and battle state without changing inventory or attempts', async () => {
        const p = await fixture(), before = await savedCompass(p);
        p.BattleManager = new BattleManager(p);
        await new ForestFruitHandler().Handle(p.Session, {}, uints([1]));
        assert.equal(p.packets.at(-1).result, 5001);
        await assert.rejects(new ForestMechanisms(p).CollectFireFruit());
        p.Data.mapID = forestRules.mapId;
        p.Data.actionType = 1;
        await assert.rejects(new ForestMechanisms(p).CollectFireFruit());
        p.Data.actionType = 0;
        p.BattleManager._currentBattle = {};
        await assert.rejects(new ForestMechanisms(p).CollectFireFruit());
        p.BattleManager._currentBattle = null;
        assert.deepEqual(await savedCompass(p), before);
    });
    await run('Concurrent fruit collection grants once per cooldown and empty rolls also consume the attempt interval', async () => {
        const p = await fixture(), now = Date.now, random = Math.random;
        p.Data.mapID = forestRules.mapId;
        p.BattleManager = new BattleManager(p);
        const activity = new ForestMechanisms(p), reward = forestRules.fireFruit;
        let clock = now();
        try {
            Date.now = () => clock;
            Math.random = () => 0;
            const results = await Promise.all([activity.CollectFireFruit(), activity.CollectFireFruit()]);
            assert.deepEqual(results.sort((a, b) => a - b), [0, reward.itemId]);
            clock += reward.cooldownSeconds * 1000;
            Math.random = () => 0.999999;
            assert.equal(await activity.CollectFireFruit(), 0);
            Math.random = () => 0;
            assert.equal(await activity.CollectFireFruit(), 0);
            clock += reward.cooldownSeconds * 1000;
            assert.equal(await activity.CollectFireFruit(), reward.itemId);
            const state = await savedCompass(p);
            assert.deepEqual(state.items.map(item => [item.itemId, item.count]), [[reward.itemId, 2 * reward.count]]);
            assert.deepEqual(p.ItemManager.ItemData.ItemList, state.items);
            assert.equal(state.claims[0].amount, 2 * reward.count);
            assert.deepEqual(state.wallet, { coins: 100, gold: 0, allocatable_exp: 77 });
        } finally { Date.now = now; Math.random = random; }
    });
    await run('Fruit capacity and failed inventory writes preserve both persisted and visible state and do not spend an attempt', async () => {
        const reward = forestRules.fireFruit, random = Math.random;
        const full = await fixture({}, [{ itemId: reward.itemId, count: ItemSystem.GetMaxStack(reward.itemId), expireTime: 0x057E40 }]);
        full.Data.mapID = forestRules.mapId;
        full.BattleManager = new BattleManager(full);
        const fullBefore = await savedCompass(full);
        await assert.rejects(new ForestMechanisms(full).CollectFireFruit(), /背包上限/);
        assert.deepEqual(await savedCompass(full), fullBefore);
        const p = await fixture(), before = await savedCompass(p);
        p.Data.mapID = forestRules.mapId;
        p.BattleManager = new BattleManager(p);
        await db.Execute(`CREATE TRIGGER reject_fruit BEFORE UPDATE ON player_items WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'fruit write fixture'); END`);
        try {
            Math.random = () => 0;
            await assert.rejects(new ForestMechanisms(p).CollectFireFruit(), /fruit write fixture/);
            assert.deepEqual(await savedCompass(p), before);
            assert.deepEqual(p.ItemManager.ItemData.ItemList, before.items);
        } finally { Math.random = random; await db.Execute('DROP TRIGGER reject_fruit'); }
    });
    await run('Weak ice-fox eligibility requires a held fruit and exact real-config identity without affecting other Boss maps', async () => {
        const p = await fixture();
        p.Data.mapID = 686;
        assert.equal(await ValidateForestBossEntry(p, 686, 1, { mapId: 686, petId: 1012, param2: 1 }), false);
        assert.equal(p.packets.at(-1).result, 900);
        assert.equal(await ValidateForestBossEntry(p, 686, 0, { mapId: 686, petId: 1012, param2: 0 }), true);
        assert.equal(await ValidateForestBossEntry(p, 686, 1, undefined), false);
        assert.equal(await ValidateForestBossEntry(p, 686, 1, { mapId: 686, petId: 997, param2: 1 }), false);
        assert.equal(await ValidateForestBossEntry(p, 425, 0, undefined), true);
        const held = await fixture({}, [{ itemId: forestRules.fireFruit.itemId, count: 1, expireTime: 0x057E40 }]);
        held.Data.mapID = 686;
        const before = await savedCompass(held);
        assert.equal(await ValidateForestBossEntry(held, 686, 1, { mapId: 686, petId: 1012, param2: 1 }), true);
        assert.deepEqual(await savedCompass(held), before);
        assert.equal(held.ItemManager.GetItemCount(forestRules.fireFruit.itemId), 1);
    });
    await run('Bubble-clan skill stones and balances commit atomically and concurrent completion cannot duplicate rewards', async () => {
        const p = await fixture();
        await p.TaskManager.AcceptTask(788);
        await p.TaskManager.SetTaskBufferBytes(788, stage(1, 1, 1, 1, 0));
        const before = await savedCompass(p);
        await db.Execute(`CREATE TRIGGER reject_bubble_reward BEFORE UPDATE ON player_items WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'bubble reward fixture'); END`);
        try {
            await p.TaskManager.CompleteTask(788, 0);
            assert.equal(p.packets.at(-1).result, 5000);
            assert.deepEqual(await savedCompass(p), before);
            assert.equal((await saved(p)).tasks[788].status, 1);
        } finally { await db.Execute('DROP TRIGGER reject_bubble_reward'); }
        await Promise.all([p.TaskManager.CompleteTask(788, 0), p.TaskManager.CompleteTask(788, 0)]);
        const after = await savedCompass(p);
        assert.deepEqual(after.wallet, { coins: 600, gold: 0, allocatable_exp: 5077 });
        assert.deepEqual(after.items.map(item => [item.itemId, item.count]), [[300401, 5]]);
        assert.deepEqual(p.ItemManager.ItemData.ItemList, after.items);
        assert.equal((await saved(p)).tasks[788].status, 3);
    });
    const result = { passed: passed.length, scenarios: passed, database: 'disposable SQLite', productionWrites: false };
    if (evidence) {
        fs.mkdirSync(evidence, { recursive: true });
        fs.writeFileSync(path.join(evidence, 'story-server-smoke.json'), JSON.stringify(result, null, 2) + '\n');
    }
    console.log('MAP_STORY_SMOKE=' + JSON.stringify(result));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
    for (const p of players) { p.Data.cleanup(); clearTimeout(p.ItemManager.ItemData._saveTimer); helper.RemoveCache(p.Uid); p.EventBus.Destroy(); }
    await db.Shutdown();
    process.chdir(app);
    fs.rmSync(temporary, { recursive: true, force: true });
    process.exit(process.exitCode || 0);
});
