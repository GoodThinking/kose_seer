'use strict';
// Exercise integrated canonical task settlement and native medicine transactions without opening a database.
const assert = require('node:assert/strict');
const path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = name => require(path.join(app, 'dist', name));
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { GetGameConfigRegistrations } = load('shared/config/ConfigDefinitions');
const { DatabaseManager } = load('DataBase/DatabaseManager');
const { TaskData, TaskStatus } = load('DataBase/models/TaskData');
const { PetData } = load('DataBase/models/PetData');
const { TaskManager } = load('GameServer/Game/Task/TaskManager');
const { TaskConfig } = load('shared/config/game/TaskConfig');
const { CompleteConfiguredTask } = load('GameServer/Game/Task/CompleteConfiguredTask');
const Task = load('GameServer/Game/Battle/TrainingBattleTask');
const Storage = load('GameServer/Game/Battle/TrainingBattleStorage');
const { ItemSystem } = load('GameServer/Game/Item/ItemSystem');
const { GameConfig } = load('shared/config/game/GameConfig');
const { ChampionPetRuntime: Champion } = load('GameServer/Game/Battle/ChampionPetRuntime');
const { ReconcilePetPP } = load('GameServer/Game/Pet/PetPP');
let rows = { tasks: {}, players: {}, pets: {}, items: {} }, snapshot, failWrite = '';
let serial = Promise.resolve();
const originalConnection = DatabaseManager.Instance.WithConnection;
const driver = {
    async beginTransaction() { assert.equal(snapshot, undefined); snapshot = structuredClone(rows); },
    async commit() { snapshot = undefined; },
    async rollback() { rows = snapshot; snapshot = undefined; },
    async query(sql, params) {
        const uid = params[0];
        if (sql.includes('FROM player_tasks')) return rows.tasks[uid] ? [{ ...rows.tasks[uid] }] : [];
        if (sql.includes('FROM players')) return rows.players[uid] ? [{ ...rows.players[uid] }] : [];
        if (sql.includes('FROM player_pets')) return [{ pet_list: rows.pets[uid] }];
        if (sql.includes('FROM player_items')) return [{ item_list: rows.items[uid] }];
        throw new Error('Unmodeled regression read: ' + sql);
    },
    async execute(sql, params) {
        if (failWrite && sql.includes(failWrite)) throw new Error('Injected strict storage failure');
        const uid = params[params.length - 1];
        if (sql.startsWith('UPDATE player_tasks SET task_list = ?, task_buffers')) rows.tasks[uid] = { task_list: params[0], task_buffers: params[1] };
        else if (sql.startsWith('UPDATE player_tasks SET task_buffers')) rows.tasks[uid].task_buffers = params[0];
        else if (sql.startsWith('UPDATE players SET coins')) rows.players[uid] = { coins: params[0], gold: params[1], allocatable_exp: params[2] };
        else if (sql.startsWith('UPDATE player_pets')) rows.pets[uid] = params[0];
        else if (sql.startsWith('UPDATE player_items')) rows.items[uid] = params[0];
        else throw new Error('Unmodeled regression write: ' + sql);
        return { affectedRows: 1 };
    }
};
DatabaseManager.Instance.WithConnection = callback => {
    const work = serial.then(() => callback(driver));
    serial = work.catch(() => undefined);
    return work;
};
function fixture(uid) {
    const task = { taskId: 131, status: TaskStatus.ACCEPTED, acceptTime: 10, completeTime: 0 };
    const tasks = Object.assign(Object.create(TaskData.prototype), { Uid: uid, TaskList: new Map([[131, task]]), TaskBuffers: new Map() });
    const player = { Uid: uid, Data: { mapID: 100, coins: 50, gold: 0, allocatableExp: 80,
        async WaitForExpAllocation() {}, async WaitForCurrencyOperations() {},
        BeginBalanceReward() { return { publish: (coins, gold, exp) => Object.assign(player.Data,
            { coins, gold, allocatableExp: exp }), release() {} }; } },
        async SendPacket() {} };
    player.TaskManager = new TaskManager(player);
    player.TaskManager.TaskData = tasks;
    rows.tasks[uid] = { task_list: tasks.ToRow().task_list, task_buffers: tasks.ToRow().task_buffers };
    rows.players[uid] = { coins: 50, gold: 0, allocatable_exp: 80 };
    return player;
}
function bytes(...stages) { const value = Buffer.alloc(100); stages.forEach((stage, i) => { value[i] = stage; }); return value; }
function persistedBuffer(player) { return JSON.parse(rows.tasks[player.Uid].task_buffers)[131]; }
(async () => {
    ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
    await ConfigRegistry.Instance.Initialize();
    const config = TaskConfig.Instance.GetTask(131);
    assert.equal(config.requiredProgress, 4);
    assert.equal(config.rewards.coins, 3000);
    assert.deepEqual(config.rewards.special, [{ type: 3, value: 3000 }]);
    const passed = [], player = fixture(99131), manager = player.TaskManager;
    await assert.rejects(manager.SetTaskBufferBytes(131, bytes(1, 1, 1)), /stage|training/i);
    await manager.SetTaskBufferBytes(131, bytes(1));
    player.Data.mapID = 336;
    await manager.SetTaskProgressBytes(131, bytes(1, 1));
    await assert.rejects(manager.SetTaskBufferValue(131, 2, 1), /Win a native/);
    await assert.rejects(manager.SetTaskBufferBytes(131, bytes(0, 0)), /advance once/);
    player.Data.mapID = 102;
    await assert.rejects(CompleteConfiguredTask(player, 131, 0, config), /native training|Justin/i);
    assert.equal(rows.players[player.Uid].coins, 50);
    const win = { mapId: 337, phase: 'settling', winner: 1, cancelReason: 0 };
    await Task.RecordVictory(player, { ...win, winner: 2 });
    await Task.RecordVictory(player, { ...win, cancelReason: 2 });
    await Task.RecordVictory(player, { ...win, mapId: 343 });
    assert.notEqual(persistedBuffer(player).nativeTrainingVictory, true);
    player.Data.mapID = 337;
    await Task.RecordVictory(player, win);
    assert.equal(persistedBuffer(player).nativeTrainingVictory, true);
    assert.deepEqual(persistedBuffer(player).xinBytes.slice(0, 4), [1, 1, 1, 0]);
    await manager.SetTaskBufferBytes(131, bytes(1, 1, 1)); // Original client may echo the server-earned victory.
    await assert.rejects(manager.SetTaskBufferBytes(131, bytes(1, 1, 1, 1)), /advance once/);
    passed.push('ordered original four-stage progression', 'forged battle progress rejected on every buffer API',
        'loss/disconnect/343 never grant337 victory', 'native victory persists independently from task reward');
    // Relog reads committed buffers, never an in-memory victory token.
    const saved = rows.tasks[player.Uid];
    manager.TaskData = Object.assign(Object.create(TaskData.prototype), { Uid: player.Uid,
        TaskList: new Map(Object.entries(JSON.parse(saved.task_list)).map(([key, value]) => [Number(key), value])),
        TaskBuffers: new Map(Object.entries(JSON.parse(saved.task_buffers)).map(([key, value]) => [Number(key), value])) });
    player.Data.mapID = 102;
    failWrite = 'UPDATE players SET coins';
    await assert.rejects(CompleteConfiguredTask(player, 131, 0, config), /Injected strict/);
    assert.equal(rows.players[player.Uid].coins, 50);
    assert.equal(manager.TaskData.IsTaskCompleted(131), false);
    failWrite = '';
    const reward = await CompleteConfiguredTask(player, 131, 0, config);
    assert.equal(rows.players[player.Uid].coins, 3050);
    assert.equal(rows.players[player.Uid].allocatable_exp, 3080);
    assert.equal(manager.TaskData.IsTaskCompleted(131), true);
    assert.deepEqual(reward.items, [{ itemId: 1, count: 3000 }, { itemId: 3, count: 3000 }]);
    await assert.rejects(CompleteConfiguredTask(player, 131, 0, config), /not pending/);
    assert.equal(rows.players[player.Uid].coins, 3050);
    assert.equal(rows.players[player.Uid].allocatable_exp, 3080);
    passed.push('relogin keeps earned victory', 'quest/currency failure rolls back together', 'one-time original3000 coins and3000 accumulatedXP');
    {
        const uid = 99300, pet = { petId: 1, id: 1, catchTime: 123, isInBag: true, hp: 40, maxHp: 100,
            skills: [10001], skillArray: [10001], skillPP: { 10001: 5 } };
        const pets = Object.assign(Object.create(PetData.prototype), { Uid: uid, PetList: [pet],
            _mutationTail: Promise.resolve(), _stagedSave: null, _publishing: false, HasPendingGrant: () => false });
        const inventory = { ItemList: [{ itemId: 300011, count: 2 }, { itemId: 300016, count: 2 }],
            async AcquireReward() { return () => undefined; } };
        const owner = { Uid: uid, PetManager: { PetData: pets, GetPetByCatchTime: value => value === 123 ? pet : null },
            ItemManager: { ItemData: inventory } };
        const actor = { player: owner, pet: { id: 1, catchTime: 123, hp: 40, maxHp: 100, skills: [10001], skillPP: [5] } };
        rows.pets[uid] = JSON.stringify([pet]); rows.items[uid] = JSON.stringify(inventory.ItemList);
        assert(Storage.CanUseMedicine(actor, 300011));
        const hp = Math.min(100, 40 + ItemSystem.GetItem(300011).HP);
        await Storage.Medicine(actor, 300011, () => true);
        assert.equal(actor.pet.hp, hp); assert.equal(pet.hp, hp);
        assert.equal(JSON.parse(rows.pets[uid])[0].hp, hp);
        assert.equal(inventory.ItemList.find(item => item.itemId === 300011).count, 1);
        const pp = Math.min(GameConfig.GetSkillById(10001).MaxPP, 5 + ItemSystem.GetItem(300016).PP);
        await Storage.Medicine(actor, 300016, () => true);
        assert.equal(actor.pet.skillPP[0], pp);
        assert.equal(JSON.parse(rows.pets[uid])[0].skillPP[10001], pp);
        const before = structuredClone({ rows, pet, inventory: inventory.ItemList, actor: actor.pet });
        failWrite = 'UPDATE player_pets';
        await assert.rejects(Storage.Medicine(actor, 300011, () => true), /Injected strict/);
        failWrite = '';
        assert.deepEqual(rows, before.rows); assert.deepEqual(pet, before.pet);
        assert.deepEqual(inventory.ItemList, before.inventory); assert.deepEqual(actor.pet, before.actor);
        passed.push('HP medicine atomically consumes inventory and persists pet', 'PP medicine restores real configured PP',
            'medicine failure never publishes heal/PP or consumes stock');
    }
    for (const species of [3022, 3406, 3481]) {
        const uid = 99400 + species, fifth = Champion.Fifth(species);
        const pet = { petId: species, catchTime: uid, isInBag: true, hp: 100, maxHp: 100, skillArray: [10001] };
        pet.skillPP = ReconcilePetPP(pet);
        assert(fifth > 0 && !pet.skillArray.includes(fifth), 'Real Champion fifth move lives outside the four-slot learned array');
        pet.skillPP[fifth] = 0;
        const pets = Object.assign(Object.create(PetData.prototype), { Uid: uid, PetList: [pet],
            _mutationTail: Promise.resolve(), _stagedSave: null, _publishing: false, HasPendingGrant: () => false });
        const inventory = { ItemList: [{ itemId: 300016, count: 1 }], async AcquireReward() { return () => undefined; } };
        const owner = { Uid: uid, PetManager: { PetData: pets, GetPetByCatchTime: time => time === uid ? pet : null },
            ItemManager: { ItemData: inventory } };
        const skills = Champion.Skills(pet);
        const actor = { player: owner, pet: { id: species, catchTime: uid, hp: 100, maxHp: 100,
            skills, skillPP: skills.map(id => pet.skillPP[id]) } };
        rows.pets[uid] = JSON.stringify([pet]); rows.items[uid] = JSON.stringify(inventory.ItemList);
        assert(Storage.CanUseMedicine(actor, 300016));
        await Storage.Medicine(actor, 300016, () => true);
        const restored = Math.min(GameConfig.GetSkillById(fifth).MaxPP, ItemSystem.GetItem(300016).PP);
        assert.equal(actor.pet.skillPP[skills.indexOf(fifth)], restored);
        assert.equal(pet.skillPP[fifth], restored);
        assert.equal(JSON.parse(rows.pets[uid])[0].skillPP[fifth], restored);
        assert.equal(inventory.ItemList.length, 0);
    }
    passed.push('real3022/3406/3481 fifth-skill PP restores atomically outside four-slot skillArray');
    console.log(JSON.stringify({ passed, databaseOpened: false, realStorageAcceptance: false }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { DatabaseManager.Instance.WithConnection = originalConnection; });
