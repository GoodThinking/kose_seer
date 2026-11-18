"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteConfiguredTask = CompleteConfiguredTask;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const TaskData_1 = require("../../../DataBase/models/TaskData");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const PetModel_1 = require("../../../shared/models/PetModel");
const GoldCurrency_1 = require("../../../shared/protocol/GoldCurrency");
const PetCalculator_1 = require("../Pet/PetCalculator");
const PetPP_1 = require("../Pet/PetPP");
const SptSystem_1 = require("../Pet/SptSystem");
const Task96Buffer_1 = require("./Task96Buffer");
function addBalance(value, delta, field) {
    const next = value + delta;
    if (!Number.isSafeInteger(next) || next < 0 || next > 0x7FFFFFFF) {
        throw new Error(`${field} reward out of range`);
    }
    return next;
}
function requirePositiveUInt(value, field) {
    if (!Number.isInteger(value) || value <= 0 || value > 0xFFFFFFFF) {
        throw new Error(`Invalid ${field}`);
    }
}
const DIRECT_COMPLETE_TASKS = new Set([9, 10, 12, 13, 14, 30]);
function validateProgress(taskId, config, buffers) {
    if (!config.requiredProgress)
        return;
    if (DIRECT_COMPLETE_TASKS.has(taskId))
        return;
    const stored = buffers[taskId];
    if (config.requiresCompassVictory && stored?.compassVictory !== true) throw new Error("Defeat the compass guardian before claiming the trial reward");
    const bytes = !stored ? [] : stored.xinBytes ?? (0, Task96Buffer_1.DecodeTask96Buffer)(stored);
    if (config.orderedProgress !== undefined) {
        for (let index = 0; index < config.requiredProgress - 1; index++) {
            if (bytes[index] !== 1) throw new Error('Previous story stage is not complete');
        }
    }
    let missing = 0;
    for (let index = 0; index < config.requiredProgress; index++) {
        if (bytes[index] !== 1)
            missing++;
    }
    if (missing > 1)
        throw new Error('Task progress incomplete');
}
function buildPet(ownerId, petId, level, catchTime, isDefault, inBag) {
    if (!GameConfig_1.GameConfig.GetPetById(petId) || !Number.isInteger(level) || level < 1 || level > 100) {
        throw new Error('Invalid task pet reward');
    }
    const pet = (0, PetModel_1.createDefaultPetInfo)(ownerId, petId);
    pet.level = pet.obtainLevel = level;
    pet.catchTime = catchTime;
    PetCalculator_1.PetCalculator.UpdatePetStats(pet);
    pet.skillArray = SptSystem_1.SptSystem.GetDefaultSkills(petId, level).slice(0, 4).map(skill => skill.id);
    pet.skillPP = (0, PetPP_1.ReconcilePetPP)(pet);
    pet.isDefault = isDefault;
    pet.isInBag = inBag;
    return pet;
}
async function CompleteConfiguredTask(player, taskId, param, config, expectedDailyDay) {
    const rewards = config.rewards ?? {};
    const unknown = Object.keys(rewards).filter(key => !['items', 'coins', 'special', 'pets', 'fitments', 'bagPetLevelGain'].includes(key));
    if (unknown.length)
        throw new Error(`Unsupported task reward: ${unknown.join(',')}`);
    const bagPetLevelGain = rewards.bagPetLevelGain ?? 0;
    if (bagPetLevelGain !== 0 && bagPetLevelGain !== 1) throw new Error('Invalid quest bag level reward');
    const itemRewards = [
        ...(rewards.items ?? []),
        ...(rewards.fitments ?? []).map(item => ({ itemId: item.fitmentId, count: item.count })),
    ];
    for (const reward of itemRewards) {
        requirePositiveUInt(reward.itemId, 'task item id');
        requirePositiveUInt(reward.count, 'task item count');
        if (!GameConfig_1.GameConfig.GetItemById(reward.itemId))
            throw new Error(`Unknown task item ${reward.itemId}`);
    }
    let coins = rewards.coins ?? 0;
    let experience = 0;
    let gold = 0;
    for (const special of rewards.special ?? []) {
        requirePositiveUInt(special.value, 'special reward');
        if (special.type === 1)
            coins = addBalance(coins, special.value, 'coins');
        else if (special.type === 3)
            experience = addBalance(experience, special.value, 'experience');
        else if (special.type === 5)
            gold = addBalance(gold, special.value, 'gold');
        else
            throw new Error(`Unsupported special reward type ${special.type}`);
    }
    for (const [value, field] of [[coins, 'coins'], [experience, 'experience'], [gold, 'gold']]) {
        if (!Number.isSafeInteger(value) || value < 0 || value > 0x7FFFFFFF)
            throw new Error(`Invalid ${field} reward`);
    }
    const petRewards = (rewards.pets ?? []).map(pet => ({ petId: pet.petId, level: pet.level }));
    if (config.type === 'select_pet') {
        const selected = config.paramMap?.[String(param)];
        if (selected === undefined)
            throw new Error('Invalid selected pet');
        petRewards.unshift({ petId: selected, level: 5 });
    }
    for (const pet of petRewards) {
        if (!GameConfig_1.GameConfig.GetPetById(pet.petId) || !Number.isInteger(pet.level) || pet.level < 1 || pet.level > 100) {
            throw new Error('Invalid task pet reward');
        }
    }
    if (config.type !== 'select_pet' && param !== 0 && param !== 1)
        throw new Error('Invalid task completion parameter');
    if (config.type === 'get_item' && config.targetItemId !== itemRewards[0]?.itemId) {
        throw new Error('Get-item task reward does not match target item');
    }
    const itemData = itemRewards.length || taskId === 94 ? player.ItemManager.ItemData : undefined;
    const petData = (petRewards.length || bagPetLevelGain) || taskId === 90 ? player.PetManager.PetData : undefined;
    const releaseInventory = itemData ? await itemData.AcquireReward() : undefined;
    const releasePets = petData ? await petData.AcquireMutation() : undefined;
    let gate;
    const releaseIdentities = [];
    try {
        if (petData)
            await petData.WaitForStagedSave();
        await player.Data.WaitForExpAllocation();
        await player.Data.WaitForCurrencyOperations();
        const balanceGate = player.Data.BeginBalanceReward();
        gate = balanceGate;
        const firstCatchTime = Math.floor(Date.now() / 1000);
        const catchTimes = petRewards.map((_, index) => firstCatchTime + index);
        if (!petData) {
            if (catchTimes.length)
                throw new Error('Pet reward manager missing');
        }
        else {
            for (const catchTime of catchTimes) {
                requirePositiveUInt(catchTime, 'task pet identity');
                releaseIdentities.push(petData.ReserveIdentity(catchTime));
            }
        }
        let result;
        await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            let committed = false;
            await driver.beginTransaction();
            try {
                const taskRows = await driver.query('SELECT task_list, task_buffers FROM player_tasks WHERE owner_id = ?', [player.Uid]);
                const itemRows = itemData
                    ? await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid])
                    : [];
                const petRows = petData
                    ? await driver.query('SELECT pet_list FROM player_pets WHERE owner_id = ?', [player.Uid])
                    : [];
                const balanceRows = await driver.query('SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?', [player.Uid]);
                if (!taskRows[0] || !balanceRows[0] || (itemData && !itemRows[0]) ||
                    (petData && !petRows[0]))
                    throw new Error('Task reward data missing');
                const stagedItems = itemRows[0] ? JSON.parse(itemRows[0].item_list) : [];
                const taskList = JSON.parse(taskRows[0].task_list);
                const taskBuffers = JSON.parse(taskRows[0].task_buffers);
                const task = taskList[taskId];
                if (!task || (task.status !== TaskData_1.TaskStatus.ACCEPTED && task.status !== TaskData_1.TaskStatus.IN_PROGRESS)) {
                    throw new Error('Task is not pending completion');
                }
                if (expectedDailyDay !== undefined && taskBuffers[taskId]?.dailyDay !== expectedDailyDay) {
                    throw new Error('Daily task belongs to another day');
                }
                const mushroomTurnIn = taskId === 19 && (player.ChallengeProgressManager.HasDefeatedSPTBoss(1) ||
                    taskList[301]?.status === TaskData_1.TaskStatus.COMPLETED);
                if (taskId === 89 && (player.Data.maxFreshStage || 0) < 10) {
                    throw new Error('Task 89 requires clearing trial tower floor 10');
                }
                const towerTurnIn = taskId === 89;
                if (towerTurnIn) {
                    const buffer = taskBuffers[taskId] || (taskBuffers[taskId] = {});
                    if (buffer.xinBytes) {
                        buffer.xinBytes[0] = 1;
                        buffer.xinBytes[1] = 1;
                        buffer.xinBytes[2] = 1;
                    }
                    else {
                        buffer[0] = 1;
                        buffer[1] = 1;
                        buffer[2] = 1;
                    }
                }
                if (!mushroomTurnIn)
                    validateProgress(taskId, config, taskBuffers);
                if (config.orderedProgress !== undefined) {
                    const buffer = taskBuffers[taskId];
                    const stages = buffer.xinBytes ?? (0, Task96Buffer_1.DecodeTask96Buffer)(buffer);
                    stages[config.requiredProgress - 1] = 1;
                    if (!buffer.xinBytes)
                        stages.forEach((value, index) => { buffer[index] = value; });
                }
                if (taskId === 37) {
                    const buffer = taskBuffers[taskId];
                    const stages = buffer.xinBytes ?? (0, Task96Buffer_1.DecodeTask96Buffer)(buffer);
                    stages[10] = 1;
                    if (!buffer.xinBytes)
                        stages.forEach((value, index) => { buffer[index] = value; });
                }
                if (taskId === 90) {
                    const ownedPets = JSON.parse(petRows[0].pet_list);
                    if (!ownedPets.some(pet => pet.petId === 10)) {
                        throw new Error('Task 90 requires a Pipi in the bag or storage');
                    }
                    const buffer = taskBuffers[taskId];
                    if (buffer.xinBytes)
                        buffer.xinBytes[1] = 1;
                    else
                        buffer[1] = 1;
                }
                if (taskId === 88 && ![85, 86, 87].every(id => taskList[id]?.status === TaskData_1.TaskStatus.COMPLETED)) {
                    throw new Error('Task 88 requires completed onboarding steps');
                }
                if (taskId === 94) {
                    for (const itemId of [400001, 400002]) {
                        if (!stagedItems.some(item => item.itemId === itemId && item.count >= 5)) {
                            throw new Error('Task 94 requires five yellow crystals and five methane canisters');
                        }
                    }
                    const buffer = taskBuffers[taskId];
                    if (buffer.xinBytes)
                        buffer.xinBytes[3] = 1;
                    else
                        buffer[3] = 1;
                }
                if (taskId === 96) {
                    const buffer = taskBuffers[taskId];
                    const stages = buffer?.xinBytes ?? (0, Task96Buffer_1.DecodeTask96Buffer)(buffer);
                    if (![0, 1, 2].every(index => stages[index] === 1))
                        throw new Error('Task 96 progress incomplete');
                    if (!player.Data.hasNono || !(player.Data.nonoState & 2))
                        throw new Error('Task 96 requires following NoNo');
                    if (buffer?.xinBytes)
                        buffer.xinBytes[3] = 1;
                    else {
                        taskBuffers[taskId] = { ...buffer };
                        stages.forEach((value, index) => { taskBuffers[taskId][index] = value; });
                        taskBuffers[taskId][3] = 1;
                    }
                }
                for (const reward of itemRewards) {
                    const existing = stagedItems.find(item => item.itemId === reward.itemId);
                    if (existing)
                        existing.count = addBalance(existing.count, reward.count, 'item count');
                    else
                        stagedItems.push({ itemId: reward.itemId, count: reward.count, expireTime: 0x057E40 });
                }
                const stagedPets = petRows[0] ? JSON.parse(petRows[0].pet_list) : [];
                for (const catchTime of catchTimes) {
                    if (stagedPets.some(pet => pet.catchTime === catchTime))
                        throw new Error('Task pet identity collision');
                }
                if (bagPetLevelGain) require("../Pet/PetProgression").GrantBagPetLevel(stagedPets);
                let bagCount = stagedPets.filter(pet => pet.isInBag).length;
                const grantedPets = petRewards.map((reward, index) => {
                    const pet = buildPet(player.Uid, reward.petId, reward.level, catchTimes[index], stagedPets.length === 0, bagCount < 6);
                    if (pet.isInBag)
                        bagCount++;
                    stagedPets.push(pet);
                    return pet;
                });
                const completed = { ...task, status: TaskData_1.TaskStatus.COMPLETED, completeTime: Math.floor(Date.now() / 1000) };
                taskList[taskId] = completed;
                const balances = [
                    addBalance(Number(balanceRows[0].coins), coins, 'coins'),
                    addBalance(Number(balanceRows[0].gold), gold, 'gold'),
                    addBalance(Number(balanceRows[0].allocatable_exp), experience, 'experience'),
                ];
                if (gold)
                    (0, GoldCurrency_1.GoldToWire)(balances[1]);
                const petAllNum = stagedPets.length;
                const petMaxLev = stagedPets.reduce((max, pet) => Math.max(max, pet.level), 0);
                const taskWrite = await driver.execute('UPDATE player_tasks SET task_list = ?, task_buffers = ? WHERE owner_id = ?', [JSON.stringify(taskList), JSON.stringify(taskBuffers), player.Uid]);
                if (taskWrite.affectedRows !== 1)
                    throw new Error('Task reward data disappeared');
                if (itemRewards.length) {
                    const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(stagedItems), player.Uid]);
                    if (itemWrite.affectedRows !== 1)
                        throw new Error('Task item data disappeared');
                }
                if ((petRewards.length || bagPetLevelGain)) {
                    const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [JSON.stringify(stagedPets), player.Uid]);
                    if (petWrite.affectedRows !== 1)
                        throw new Error('Task pet data disappeared');
                }
                const playerWrite = (petRewards.length || bagPetLevelGain)
                    ? await driver.execute('UPDATE players SET coins = ?, gold = ?, allocatable_exp = ?, pet_all_num = ?, pet_max_lev = ? WHERE user_id = ?', [...balances, petAllNum, petMaxLev, player.Uid])
                    : await driver.execute('UPDATE players SET coins = ?, gold = ?, allocatable_exp = ? WHERE user_id = ?', [...balances, player.Uid]);
                if (playerWrite.affectedRows !== 1)
                    throw new Error('Task player data disappeared');
                if (taskId === 91) {
                    await driver.execute("INSERT INTO receiver_claims(owner_id,reward_key,period_start,claimed_at,amount) VALUES(?,?,0,?,1)", [player.Uid, require("./MoonlightEssenceReward").MOONLIGHT_ESSENCE_REWARD_KEY, Math.floor(Date.now() / 1000)]);
                }
                await driver.commit();
                committed = true;
                if (itemData) {
                    itemData.ItemList = stagedItems;
                    player.ItemManager.syncClothesToPlayerData();
                }
                if ((petRewards.length || bagPetLevelGain) && petData)
                    petData.PetList = stagedPets;
                player.TaskManager.TaskData.TaskList.set(taskId, completed);
                if (taskBuffers[taskId])
                    player.TaskManager.TaskData.TaskBuffers.set(taskId, taskBuffers[taskId]);
                balanceGate.publish(balances[0], balances[1], balances[2]);
                if ((petRewards.length || bagPetLevelGain)) {
                    player.Data.petAllNum = petAllNum;
                    player.Data.petMaxLev = petMaxLev;
                }
                result = {
                    petId: grantedPets[0]?.petId ?? 0,
                    captureTm: grantedPets[0]?.catchTime ?? 0,
                    items: [
                        ...itemRewards,
                        ...(coins ? [{ itemId: 1, count: coins }] : []),
                        ...(experience ? [{ itemId: 3, count: experience }] : []),
                        ...(gold ? [{ itemId: 5, count: gold }] : []),
                    ],
                    pets: grantedPets.map(pet => ({ petId: pet.petId, level: pet.level, catchTime: pet.catchTime })),
                };
            }
            catch (error) {
                if (!committed)
                    await driver.rollback();
                throw error;
            }
        });
        return result;
    }
    finally {
        for (const release of releaseIdentities.reverse())
            release();
        gate?.release();
        releasePets?.();
        releaseInventory?.();
    }
}
//# sourceMappingURL=CompleteConfiguredTask.js.map