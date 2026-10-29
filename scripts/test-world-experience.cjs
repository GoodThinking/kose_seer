'use strict';
// Real activity code, item/task models and disposable SQLite; never open player databases.
// Usage: node scripts/test-world-experience.cjs <captured app> <release> [evidence dir]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
assert.ok(process.argv[2] && process.argv[3], 'Expected captured app and release');
const app = path.resolve(process.argv[2]), release = path.resolve(process.argv[3]);
const evidence = process.argv[4] && path.resolve(process.argv[4]);
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-sea-vortex-'));
for (const directory of ['config', 'dist']) {
    fs.cpSync(path.join(app, directory), path.join(temporary, directory), {recursive: true});
    fs.cpSync(path.join(release, 'app', directory), path.join(temporary, directory), {recursive: true});
}
fs.symlinkSync(path.join(app, 'node_modules'), path.join(temporary, 'node_modules'), 'dir');
process.chdir(temporary);
const load = file => require(path.join(temporary, 'dist', file));
load('DataBase/loaders/DataLoader');
const {Config} = load('shared/config/ServerConfig');
const {ConfigLoader} = load('shared/config/ConfigLoader');
const {ConfigRegistry} = load('shared/config/ConfigRegistry');
const {ConfigKeys, ConfigPaths, ConfigTypes} = load('shared/config/ConfigDefinitions');
const {DatabaseManager} = load('DataBase/DatabaseManager');
const {DatabaseHelper} = load('DataBase/DatabaseHelper');
const {PlayerData} = load('DataBase/models/PlayerData');
const {PlayerInstance} = load('GameServer/Game/Player/PlayerInstance');
const {GameEventBus} = load('GameServer/Game/Event/GameEventBus');
const {createDefaultPlayerInfo} = load('shared/models/PlayerModel');
const {ItemManager} = load('GameServer/Game/Item/ItemManager');
const {ItemSystem} = load('GameServer/Game/Item/ItemSystem');
const {TaskManager} = load('GameServer/Game/Task/TaskManager');
const {BattleManager} = load('GameServer/Game/Battle/BattleManager');
const {SeaVortexError, GetSeaState, RecordSeaShot, RecordSeaPirateVictory, ResolveSeaRescue, StartSeaRescueEncounter} = load('GameServer/Game/Map/SeaVortexActivity');
const rules = require(path.join(temporary, 'config/data/json/sea_vortex.json'));
const {ClosedSpaceError, ClaimClosedSpaceTreasure} = load('GameServer/Game/Map/ClosedSpaceTreasure');
const spaceRules = require(path.join(temporary, 'config/data/json/closed_space.json'));
const {GrantMapVictory} = load('GameServer/Game/Map/GameplayRewards');
const {GetStoryEncounter} = load('GameServer/Game/Battle/StoryEncounters');
const {SaveAcceptedTask, SaveFinishedTask, SaveTaskBuffer} = load('GameServer/Game/Task/SaveTaskState');
const {CompleteConfiguredTask} = load('GameServer/Game/Task/CompleteConfiguredTask');
const {Task7DeleteHandler} = load('GameServer/Server/Packet/Recv/Task/Task7DeleteHandler');
const {ExchangeClothHandler} = load('GameServer/Server/Packet/Recv/Item/ExchangeClothHandler');
const taskDefinitions = require(path.join(temporary, 'config/data/json/tasks.json')).tasks;
const task7 = taskDefinitions['7'], task33 = taskDefinitions['33'], task94 = taskDefinitions['94'];
const db = DatabaseManager.Instance, players = [], passed = [];
const bubble = rules.rewards.find(reward => reward.itemId);
const rescued = rules.rewards.find(reward => reward.petId);
const shot = {x: (rules.shotBounds.minX + rules.shotBounds.maxX) / 2, y: (rules.shotBounds.minY + rules.shotBounds.maxY) / 2};
let nextUid = 972000;
async function fixture(introduced = true, items = []) {
    const id = ++nextUid;
    await db.Execute('INSERT INTO players VALUES (?,100,0,0,0,0,?)', [id, rules.mapId]);
    const tasks = introduced ? {[rules.introTaskId]: {taskId: rules.introTaskId, status: 3, acceptTime: 1, completeTime: 2}} : {};
    await db.Execute('INSERT INTO player_tasks(owner_id,task_list,task_buffers) VALUES (?,?,?)', [id, JSON.stringify(tasks), '{}']);
    await db.Execute('INSERT INTO player_items(owner_id,item_list) VALUES (?,?)', [id, JSON.stringify(items)]);
    const p = Object.create(PlayerInstance.prototype);
    Object.defineProperty(p, 'Uid', {value: id});
    p.Data = new PlayerData(Object.assign(createDefaultPlayerInfo(id, 'SeaVortexContract'), {coins: 100, gold: 0, mapID: rules.mapId}));
    p.EventBus = new GameEventBus();
    p.packets = [];
    p.SendPacket = async packet => p.packets.push(packet);
    p._session = {Socket: {destroyed: false}, Player: p};
    p.ItemManager = new ItemManager(p);
    await p.ItemManager.Initialize();
    p.TaskManager = new TaskManager(p);
    await p.TaskManager.Initialize();
    p.BattleManager = new BattleManager(p);
    players.push(p);
    return p;
}
async function seed(p, state) {
    for (const [key, value] of Object.entries(state)) {
        await db.Execute('INSERT INTO receiver_claims(owner_id,reward_key,period_start,claimed_at,amount) VALUES (?,?,0,1,?)', [p.Uid, 'sea:vortex:' + key, value]);
    }
}
async function saved(p) {
    const claims = await db.Query('SELECT reward_key,amount FROM receiver_claims WHERE owner_id=? ORDER BY reward_key', [p.Uid]);
    const [inventory] = await db.Query('SELECT item_list FROM player_items WHERE owner_id=?', [p.Uid]);
    return {claims, items: JSON.parse(inventory.item_list)};
}
async function run(name, scenario) { await scenario(); passed.push(name); }
(async () => {
    ConfigLoader.Instance._configDir = path.join(temporary, 'config');
    ConfigLoader.Instance.Reload();
    for (const key of [ConfigKeys.ITEM_CONFIG, ConfigKeys.PET_CONFIG, ConfigKeys.SKILL_CONFIG, ConfigKeys.SPT_CONFIG, ConfigKeys.NATURES_CONFIG]) {
        ConfigRegistry.Instance.Register(key, ConfigPaths[key], ConfigTypes[key]);
    }
    await ConfigRegistry.Instance.Initialize();
    Config.Config.database = {type: 'sqlite', path: path.join(temporary, 'sea.sqlite')};
    await db.Initialize();
    await db.Execute('CREATE TABLE players(user_id INTEGER PRIMARY KEY,coins INTEGER NOT NULL,gold INTEGER NOT NULL,allocatable_exp INTEGER NOT NULL,pet_all_num INTEGER NOT NULL,pet_max_lev INTEGER NOT NULL,map_id INTEGER NOT NULL)');
    const migration = new (load('DataBase/migrations/scripts/012_fix_all_tables').Migration012FixAllTables)();
    await db.Execute(migration.upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_tasks')));
    for (const sql of [...new (load('DataBase/migrations/scripts/006_create_items').Migration006CreateItems)().upSQLite(), ...new (load('DataBase/migrations/scripts/021_create_receiver_claims').Migration021CreateReceiverClaims)().upSQLite()]) await db.Execute(sql);
    await run('Only introduced idle players in the actual temple earn shot progress', async () => {
        const p = await fixture(false);
        await RecordSeaShot(p, shot);
        assert.deepEqual((await saved(p)).claims, []);
        await assert.rejects(GetSeaState(p), SeaVortexError);
        const q = await fixture();
        q.Data.mapID = rules.mapId - 1;
        await RecordSeaShot(q, shot);
        assert.deepEqual((await saved(q)).claims, []);
        q.Data.mapID = rules.mapId;
        q.Data.actionType = 1;
        await RecordSeaShot(q, shot);
        assert.deepEqual((await saved(q)).claims, []);
    });
    await run('Off-target shots cannot unlock rescue and concurrent valid hits stop at the required count', async () => {
        const p = await fixture();
        await RecordSeaShot(p, {...shot, x: rules.shotBounds.minX - 1});
        await assert.rejects(ResolveSeaRescue(p, 0), SeaVortexError);
        await Promise.all(Array.from({length: 12}, () => RecordSeaShot(p, shot)));
        assert.equal((await GetSeaState(p)).shots, rules.shotsRequired);
        const q = await fixture();
        assert.equal((await GetSeaState(q)).shots, 0);
    });
    await run('A failed shot write rolls back and leaves a real retry available', async () => {
        const p = await fixture();
        await db.Execute(`CREATE TRIGGER reject_sea_shot BEFORE INSERT ON receiver_claims WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'sea shot fixture'); END`);
        try {
            await assert.rejects(RecordSeaShot(p, shot), /sea shot fixture/);
            assert.equal((await GetSeaState(p)).shots, 0);
        } finally { await db.Execute('DROP TRIGGER reject_sea_shot'); }
        await RecordSeaShot(p, shot);
        assert.equal((await GetSeaState(p)).shots, 1);
    });
    await run('Only the matching pirate victory unlocks its own rescue and replay does not grow it', async () => {
        const p = await fixture();
        await RecordSeaPirateVictory(p, {seaVortexPirateSlot: 0, enemy: {id: rules.guard.petId}});
        await RecordSeaPirateVictory(p, {seaVortexPirateSlot: 1, enemy: {id: rules.guard.petId + 1}});
        assert.deepEqual((await saved(p)).claims, []);
        await Promise.all(Array.from({length: 8}, () => RecordSeaPirateVictory(p, {seaVortexPirateSlot: 1, enemy: {id: rules.guard.petId}})));
        const state = await GetSeaState(p);
        assert.equal(state.run, 1);
        assert.equal(state.pk, 0);
        assert.equal((await saved(p)).claims.length, 1);
    });
    await run('A full bubble inventory preserves the earned rescue instead of consuming or rerolling it', async () => {
        const p = await fixture(true, [{itemId: bubble.itemId, count: ItemSystem.GetMaxStack(bubble.itemId), expireTime: 0}]);
        await seed(p, {drag: rules.shotsRequired});
        const before = await saved(p);
        await assert.rejects(ResolveSeaRescue(p, 0), SeaVortexError);
        assert.deepEqual(await saved(p), before);
        assert.deepEqual(p.ItemManager.ItemData.ItemList, before.items);
    });
    await run('Persisted species survives policy reordering and repeated resolution without another draw', async () => {
        const p = await fixture();
        await seed(p, {pending: rescued.petId, 'pending-slot': 0});
        const original = rules.rewards.slice();
        rules.rewards.reverse();
        try {
            const results = await Promise.all(Array.from({length: 8}, () => ResolveSeaRescue(p, 0)));
            assert.ok(results.every(result => result.petId === rescued.petId && result.region === rescued.region));
            assert.equal((await GetSeaState(p)).petId, rescued.petId);
            await assert.rejects(ResolveSeaRescue(p, 1), SeaVortexError);
            assert.deepEqual((await saved(p)).items, []);
        } finally { rules.rewards.splice(0, rules.rewards.length, ...original); }
    });
    await run('Wrong species, wrong region and stale map cannot consume the selected encounter', async () => {
        const p = await fixture();
        await seed(p, {pending: rescued.petId, 'pending-slot': 0});
        const before = await saved(p);
        const mustNotStart = () => assert.fail('An invalid encounter started');
        assert.equal(await StartSeaRescueEncounter(p, {...rescued, petId: rescued.petId + 1}, () => true, mustNotStart), false);
        assert.equal(await StartSeaRescueEncounter(p, {...rescued, region: rescued.region + 1}, () => true, mustNotStart), false);
        assert.equal(await StartSeaRescueEncounter(p, rescued, () => false, mustNotStart), false);
        assert.deepEqual(await saved(p), before);
    });
    await run('A map change during commit restores the same species and leaves it resumable', async () => {
        const p = await fixture();
        await seed(p, {pending: rescued.petId, 'pending-slot': 0});
        let checks = 0;
        assert.equal(await StartSeaRescueEncounter(p, rescued, () => ++checks < 3, () => assert.fail('Cancelled battle started')), false);
        assert.equal((await GetSeaState(p)).petId, rescued.petId);
        assert.equal((await ResolveSeaRescue(p, 0)).petId, rescued.petId);
    });
    await run('A failed encounter-consume write preserves the selected species and its retry', async () => {
        const p = await fixture();
        await seed(p, {pending: rescued.petId, 'pending-slot': 0});
        await db.Execute(`CREATE TRIGGER reject_sea_consume BEFORE UPDATE ON receiver_claims WHEN NEW.owner_id=${p.Uid} AND NEW.reward_key='sea:vortex:pending' AND NEW.amount=0 BEGIN SELECT RAISE(ABORT,'sea consume fixture'); END`);
        try {
            await assert.rejects(StartSeaRescueEncounter(p, rescued, () => true, () => assert.fail('Uncommitted battle started')), /sea consume fixture/);
            assert.equal((await GetSeaState(p)).petId, rescued.petId);
        } finally { await db.Execute('DROP TRIGGER reject_sea_consume'); }
    });
    await run('Concurrent starts cannot turn one selected encounter into multiple battles', async () => {
        const p = await fixture();
        await seed(p, {pending: rescued.petId, 'pending-slot': 0});
        let started = 0;
        const results = await Promise.all(Array.from({length: 8}, () => StartSeaRescueEncounter(p, rescued, () => true, () => { ++started; })));
        assert.equal(results.filter(Boolean).length, 1);
        assert.equal(started, 1);
        assert.equal((await GetSeaState(p)).petId, 0);
        await assert.rejects(ResolveSeaRescue(p, 0), SeaVortexError);
    });
    await run('Closed-space treasure rejects another room or prize index without touching inventory', async () => {
        const p = await fixture(), before = await saved(p);
        for (const room of spaceRules.rooms) await assert.rejects(ClaimClosedSpaceTreasure(p, room.prizeIndex), ClosedSpaceError);
        p.Data.mapID = spaceRules.rooms[0].mapId;
        await assert.rejects(ClaimClosedSpaceTreasure(p, 0xffffffff), ClosedSpaceError);
        assert.deepEqual(await saved(p), before);
    });
    await run('Concurrent treasure claims grant one reward per owner and room across repeats', async () => {
        const p = await fixture(), room = spaceRules.rooms[0];
        p.Data.mapID = room.mapId;
        const results = await Promise.all(Array.from({length: 12}, () => ClaimClosedSpaceTreasure(p, room.prizeIndex)));
        assert.equal(results.filter(result => result.reward).length, 1);
        assert.equal((await saved(p)).items.find(item => item.itemId === room.reward.itemId).count, room.reward.count);
        assert.deepEqual(p.ItemManager.ItemData.ItemList, (await saved(p)).items);
        assert.equal((await ClaimClosedSpaceTreasure(p, room.prizeIndex)).alreadyClaimed, true);
        for (const other of spaceRules.rooms.slice(1)) {
            p.Data.mapID = other.mapId;
            assert.equal((await ClaimClosedSpaceTreasure(p, other.prizeIndex)).alreadyClaimed, false);
        }
        assert.equal((await saved(p)).claims.length, spaceRules.rooms.length);
        const q = await fixture();
        q.Data.mapID = room.mapId;
        assert.equal((await ClaimClosedSpaceTreasure(q, room.prizeIndex)).alreadyClaimed, false);
        assert.equal((await saved(q)).items.find(item => item.itemId === room.reward.itemId).count, room.reward.count);
    });
    await run('A full inventory preserves the closed-space treasure claim for a later retry', async () => {
        const room = spaceRules.rooms[0];
        const p = await fixture(true, [{itemId: room.reward.itemId, count: ItemSystem.GetMaxStack(room.reward.itemId), expireTime: 0}]);
        p.Data.mapID = room.mapId;
        const before = await saved(p);
        await assert.rejects(ClaimClosedSpaceTreasure(p, room.prizeIndex), ClosedSpaceError);
        assert.deepEqual(await saved(p), before);
        assert.deepEqual(p.ItemManager.ItemData.ItemList, before.items);
    });
    await run('Treasure claim failure rolls back inventory and leaves a committed-once retry', async () => {
        const p = await fixture(), room = spaceRules.rooms[0];
        p.Data.mapID = room.mapId;
        const before = await saved(p);
        await db.Execute(`CREATE TRIGGER reject_space_claim BEFORE INSERT ON receiver_claims WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'space claim fixture'); END`);
        try {
            await assert.rejects(ClaimClosedSpaceTreasure(p, room.prizeIndex), /space claim fixture/);
            assert.deepEqual(await saved(p), before);
            assert.deepEqual(p.ItemManager.ItemData.ItemList, before.items);
        } finally { await db.Execute('DROP TRIGGER reject_space_claim'); }
        assert.equal((await ClaimClosedSpaceTreasure(p, room.prizeIndex)).alreadyClaimed, false);
        assert.equal((await saved(p)).items.find(item => item.itemId === room.reward.itemId).count, room.reward.count);
    });
    await run('Pirate guard victories persist in any order before the real Zog encounter unlocks', async () => {
        const p = await fixture(false);
        p.Data.mapID = 50;
        await SaveAcceptedTask(p.TaskManager.TaskData, 33);
        assert.equal(GetStoryEncounter(p, 50, 3), null);
        for (const stage of [2, 0, 1]) {
            const encounter = GetStoryEncounter(p, 50, stage);
            assert.equal(encounter.taskId, 33);
            assert.equal(encounter.stage, stage);
            await GrantMapVictory(p, {pirateRescueStage: stage});
            assert.equal(GetStoryEncounter(p, 50, stage), null);
        }
        assert.equal(GetStoryEncounter(p, 50, 3).petId, 96);
        const [stored] = await db.Query('SELECT task_buffers FROM player_tasks WHERE owner_id=?', [p.Uid]);
        const progress = JSON.parse(stored.task_buffers)['33'];
        assert.deepEqual([progress[0], progress[1], progress[2]], [1, 1, 1]);
        assert.deepEqual((await saved(p)).items, []);
    });
    await run('Changing map while a quest enemy loads cannot start a stale battle or lock movement', async () => {
        const p = await fixture(false);
        p.Data.mapID = 50;
        await SaveAcceptedTask(p.TaskManager.TaskData, 33);
        let loaded, unblock;
        const loading = new Promise(resolve => { loaded = resolve; });
        p.BattleManager._initService.CreatePVEBattle = async () => {
            loaded();
            return new Promise(resolve => { unblock = resolve; });
        };
        const opening = p.BattleManager.ChallengeBoss(50, 0);
        await loading;
        p.Data.mapID = 48;
        p.BattleManager.CleanupBattle();
        unblock({enemy: {id: 60, name: '铁达斯'}});
        await opening;
        assert.equal(p.BattleManager.GetCurrentBattle(), null);
        assert.equal(p.Data.actionType, 0);
        assert.equal(p.Data.mapID, 48);
        assert.deepEqual((await saved(p)).items, []);
    });
    await run('Quest33 grants missing unique equipment only and never reports an already-owned medal as new', async () => {
        const p = await fixture(false, [
            {itemId: 100159, count: 1, expireTime: 0},
            {itemId: 500813, count: 1, expireTime: 0},
        ]);
        await SaveAcceptedTask(p.TaskManager.TaskData, 33);
        await SaveTaskBuffer(p.TaskManager.TaskData, 33, () => Object.fromEntries(Array.from({length: 20}, (_, index) => [index, index < 6 ? 1 : 0])));
        const reward = await CompleteConfiguredTask(p, 33, 1, task33);
        assert.deepEqual(reward.items.map(item => item.itemId).sort(), [100160, 100161]);
        const owned = (await saved(p)).items;
        assert.deepEqual(owned.map(item => [item.itemId, item.count]).sort((a, b) => a[0] - b[0]),
            [[100159, 1], [100160, 1], [100161, 1], [500813, 1]]);
        await assert.rejects(CompleteConfiguredTask(p, 33, 1, task33), /not pending completion/);
        assert.deepEqual((await saved(p)).items, owned);
        const [persisted] = await db.Query('SELECT task_list FROM player_tasks WHERE owner_id=?', [p.Uid]);
        assert.equal(JSON.parse(persisted.task_list)['33'].status, 3);
    });
    await run('Quest33 item-write failure rolls back completion and all rewards before a successful retry', async () => {
        const p = await fixture(false);
        await SaveAcceptedTask(p.TaskManager.TaskData, 33);
        await SaveTaskBuffer(p.TaskManager.TaskData, 33, () => Object.fromEntries(Array.from({length: 20}, (_, index) => [index, index < 6 ? 1 : 0])));
        await db.Execute(`CREATE TRIGGER reject_pirate_reward BEFORE UPDATE ON player_items WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'pirate reward fixture'); END`);
        try {
            await assert.rejects(CompleteConfiguredTask(p, 33, 1, task33), /pirate reward fixture/);
            const [persisted] = await db.Query('SELECT task_list FROM player_tasks WHERE owner_id=?', [p.Uid]);
            assert.equal(JSON.parse(persisted.task_list)['33'].status, 1);
            assert.deepEqual((await saved(p)).items, []);
            assert.equal(p.TaskManager.TaskData.IsTaskCompleted(33), false);
        } finally { await db.Execute('DROP TRIGGER reject_pirate_reward'); }
        const reward = await CompleteConfiguredTask(p, 33, 1, task33);
        assert.deepEqual(reward.items.map(item => [item.itemId, item.count]).sort((a, b) => a[0] - b[0]),
            [[100159, 1], [100160, 1], [100161, 1], [500813, 1]]);
        assert.equal(p.TaskManager.TaskData.IsTaskCompleted(33), true);
    });
    await run('Energy tutorial requires the mining report and five of each resource before one reward', async () => {
        const materials = [
            {itemId: 400001, count: 5, expireTime: 0},
            {itemId: 400002, count: 5, expireTime: 0},
        ];
        const p = await fixture(false, materials);
        await SaveAcceptedTask(p.TaskManager.TaskData, 94);
        await SaveTaskBuffer(p.TaskManager.TaskData, 94, () => Object.fromEntries(Array.from({length: 20}, (_, index) => [index, index < 2 ? 1 : 0])));
        await assert.rejects(CompleteConfiguredTask(p, 94, 1, task94), /progress incomplete/);
        const [unreported] = await db.Query('SELECT coins,allocatable_exp FROM players WHERE user_id=?', [p.Uid]);
        assert.deepEqual(unreported, {coins: 100, allocatable_exp: 0});
        await SaveTaskBuffer(p.TaskManager.TaskData, 94, () => Object.fromEntries(Array.from({length: 20}, (_, index) => [index, index < 3 ? 1 : 0])));
        const q = await fixture(false, [
            {itemId: 400001, count: 4, expireTime: 0},
            {itemId: 400002, count: 5, expireTime: 0},
        ]);
        await SaveAcceptedTask(q.TaskManager.TaskData, 94);
        await SaveTaskBuffer(q.TaskManager.TaskData, 94, () => Object.fromEntries(Array.from({length: 20}, (_, index) => [index, index < 3 ? 1 : 0])));
        await assert.rejects(CompleteConfiguredTask(q, 94, 1, task94), /requires five yellow crystals and five methane canisters/);
        const [short] = await db.Query('SELECT coins,allocatable_exp FROM players WHERE user_id=?', [q.Uid]);
        assert.deepEqual(short, {coins: 100, allocatable_exp: 0});
        assert.equal(q.TaskManager.TaskData.IsTaskCompleted(94), false);
        await CompleteConfiguredTask(p, 94, 1, task94);
        await assert.rejects(CompleteConfiguredTask(p, 94, 1, task94), /not pending completion/);
        const [completed] = await db.Query('SELECT coins,allocatable_exp FROM players WHERE user_id=?', [p.Uid]);
        assert.deepEqual(completed, {coins: 1100, allocatable_exp: 500});
        const [stored] = await db.Query('SELECT task_list,task_buffers FROM player_tasks WHERE owner_id=?', [p.Uid]);
        assert.equal(JSON.parse(stored.task_list)['94'].status, 3);
        assert.deepEqual(Object.values(JSON.parse(stored.task_buffers)['94']).slice(0, 4), [1, 1, 1, 1]);
        assert.deepEqual((await saved(p)).items, materials);
    });
    await run('Task7 requires one tutorial and saves either material order across both protocols', async () => {
        const noTutorial = await fixture(false);
        await assert.rejects(noTutorial.TaskManager.AcceptTask(7), /Previous story quest/);
        for (const prerequisite of [85, 86, 87, 88]) {
            const p = await fixture(false);
            await SaveFinishedTask(p.TaskManager.TaskData, prerequisite);
            await p.TaskManager.AcceptTask(7);
            await assert.rejects(p.TaskManager.AcceptTask(7), /already accepted/);
        }
        for (const first of [0, 1]) {
            const p = await fixture(false);
            await SaveFinishedTask(p.TaskManager.TaskData, 85);
            await p.TaskManager.AcceptTask(7);
            p.Data.clothIds = [100014];
            p.Data.mapID = first === 0 ? 12 : 17;
            const firstBuffer = Buffer.alloc(20);
            firstBuffer[first] = 1;
            await p.TaskManager.SetTaskProgressBytes(7, firstBuffer);
            const restarted = new TaskManager(p);
            await restarted.Initialize();
            p.TaskManager = restarted;
            assert.equal(p.TaskManager.GetTaskBuffer(7)[first], 1);
            p.Data.mapID = first === 0 ? 17 : 12;
            const staleBuffer = Buffer.alloc(100);
            staleBuffer[1 - first] = 1;
            await p.TaskManager.SetTaskBufferBytes(7, staleBuffer);
            assert.deepEqual(Array.from(p.TaskManager.GetTaskBuffer(7)).slice(0, 3), [1, 1, 0]);
            assert.deepEqual(Array.from(p.TaskManager.GetTaskBufferBytes(7, 100)).slice(0, 3), [1, 1, 0]);
        }
    });
    await run('Task7 rejects invalid material transitions and grants exactly one material on Xixi delivery', async () => {
        const p = await fixture(false);
        await SaveFinishedTask(p.TaskManager.TaskData, 85);
        await p.TaskManager.AcceptTask(7);
        p.Data.mapID = 8;
        await assert.rejects(p.TaskManager.SetTaskProgressBytes(7, Buffer.from([1, 0, ...Array(18).fill(0)])), /map 12/);
        p.Data.mapID = 12;
        await assert.rejects(p.TaskManager.SetTaskProgressBytes(7, Buffer.from([1, 1, ...Array(18).fill(0)])), /separately/);
        await p.TaskManager.SetTaskProgressBytes(7, Buffer.from([1, 0, ...Array(18).fill(0)]));
        p.Data.mapID = 17;
        await assert.rejects(p.TaskManager.SetTaskProgressBytes(7, Buffer.from([1, 1, ...Array(18).fill(0)])), /drill/);
        p.Data.clothIds = [100014];
        await p.TaskManager.SetTaskProgressBytes(7, Buffer.from([1, 1, ...Array(18).fill(0)]));
        await assert.rejects(CompleteConfiguredTask(p, 7, 1, task7), /Xixi/);
        p.Data.mapID = 8;
        const outcomes = await Promise.allSettled([CompleteConfiguredTask(p, 7, 1, task7), CompleteConfiguredTask(p, 7, 1, task7)]);
        assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 1);
        assert.equal((await saved(p)).items.filter(item => item.itemId === 400052).reduce((sum, item) => sum + item.count, 0), 1);
        assert.deepEqual(Array.from(p.TaskManager.GetTaskBuffer(7)).slice(0, 3), [1, 1, 1]);
        await assert.rejects(CompleteConfiguredTask(p, 7, 1, task7), /not pending completion/);
        const exchange = new ExchangeClothHandler();
        const request = Buffer.alloc(4);
        request.writeUInt32BE(2);
        p.Data.mapID = 6;
        await exchange.Handle(p.Session, null, request);
        const after = (await saved(p)).items;
        assert.equal(after.some(item => item.itemId === 400052), false);
        for (const id of [100087, 100088, 100089, 100090, 100091])
            assert.equal(after.find(item => item.itemId === id)?.count, 1);
        await exchange.Handle(p.Session, null, request);
        assert.deepEqual((await saved(p)).items, after);
    });
    await run('Task7 preserves an existing material and rolls back failed delivery', async () => {
        for (const existing of [false, true]) {
            const p = await fixture(false, existing ? [{itemId: 400052, count: 1, expireTime: 0}] : []);
            await SaveFinishedTask(p.TaskManager.TaskData, 85);
            await p.TaskManager.AcceptTask(7);
            p.Data.mapID = 12;
            await p.TaskManager.SetTaskProgressBytes(7, Buffer.from([1, 0, ...Array(18).fill(0)]));
            p.Data.mapID = 17;
            p.Data.clothIds = [100014];
            await p.TaskManager.SetTaskProgressBytes(7, Buffer.from([1, 1, ...Array(18).fill(0)]));
            p.Data.mapID = 8;
            await db.Execute(`CREATE TRIGGER reject_task7_reward BEFORE UPDATE ON player_items WHEN NEW.owner_id=${p.Uid} BEGIN SELECT RAISE(ABORT,'task7 fixture'); END`);
            try {
                await assert.rejects(CompleteConfiguredTask(p, 7, 1, task7), /task7 fixture/);
                assert.equal(p.TaskManager.TaskData.IsTaskCompleted(7), false);
                assert.deepEqual(Array.from(p.TaskManager.GetTaskBuffer(7)).slice(0, 3), [1, 1, 0]);
            } finally { await db.Execute('DROP TRIGGER reject_task7_reward'); }
            const result = await CompleteConfiguredTask(p, 7, 1, task7);
            assert.equal((await saved(p)).items.filter(item => item.itemId === 400052).reduce((sum, item) => sum + item.count, 0), 1);
            assert.equal(result.items.some(item => item.itemId === 400052), !existing);
        }
    });
    await run('Task7 abandonment clears only unfinished progress and permits clean reacceptance', async () => {
        const p = await fixture(false);
        await SaveFinishedTask(p.TaskManager.TaskData, 85);
        await p.TaskManager.AcceptTask(7);
        p.Data.mapID = 12;
        await p.TaskManager.SetTaskProgressBytes(7, Buffer.from([1, 0, ...Array(18).fill(0)]));
        const handler = new Task7DeleteHandler();
        const request = Buffer.alloc(4);
        request.writeUInt32BE(7);
        p.packets.length = 0;
        await handler.Handle({Player: p}, null, Buffer.alloc(3));
        assert.equal(p.packets.at(-1).getResult(), 5001);
        assert.equal(p.TaskManager.TaskData.GetTask(7).status, 1);
        p.packets.length = 0;
        await handler.Handle({Player: p}, null, request);
        assert.equal(p.packets.at(-1).getCmdId(), 2205);
        assert.equal(p.packets.at(-1).getResult(), 0);
        assert.deepEqual(p.packets.at(-1).serialize(), request);
        assert.equal(p.TaskManager.TaskData.GetTask(7), undefined);
        assert.deepEqual(Array.from(p.TaskManager.GetTaskBuffer(7)).slice(0, 3), [0, 0, 0]);
        await p.TaskManager.AcceptTask(7);
        assert.deepEqual(Array.from(p.TaskManager.GetTaskBuffer(7)).slice(0, 3), [0, 0, 0]);
        p.Data.mapID = 12;
        await p.TaskManager.SetTaskProgressBytes(7, Buffer.from([1, 0, ...Array(18).fill(0)]));
        p.Data.mapID = 17;
        p.Data.clothIds = [100014];
        await p.TaskManager.SetTaskProgressBytes(7, Buffer.from([1, 1, ...Array(18).fill(0)]));
        p.Data.mapID = 8;
        await CompleteConfiguredTask(p, 7, 1, task7);
        p.packets.length = 0;
        await handler.Handle({Player: p}, null, request);
        assert.equal(p.packets.at(-1).getResult(), 5000);
        assert.equal(p.TaskManager.TaskData.IsTaskCompleted(7), true);
        assert.equal((await saved(p)).items.find(item => item.itemId === 400052)?.count, 1);
    });
    const result = {passed: passed.length, scenarios: passed, database: 'disposable SQLite', productionWrites: false, rngOverridden: false};
    if (evidence) {
        fs.mkdirSync(evidence, {recursive: true});
        fs.writeFileSync(path.join(evidence, 'world-experience-server-smoke.json'), JSON.stringify(result, null, 2) + '\n');
    }
    console.log('WORLD_EXPERIENCE_SMOKE=' + JSON.stringify(result));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
    for (const p of players) { p.BattleManager.CleanupBattle(); p.Data.cleanup(); clearTimeout(p.ItemManager.ItemData._saveTimer); DatabaseHelper.Instance.RemoveCache(p.Uid); p.EventBus.Destroy(); }
    await db.Shutdown();
    process.chdir(app);
    fs.rmSync(temporary, {recursive: true, force: true});
    process.exit(process.exitCode || 0);
});
