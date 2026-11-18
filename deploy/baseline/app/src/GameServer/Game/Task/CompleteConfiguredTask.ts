import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import { IItemInfo } from '../../../DataBase/models/ItemData';
import { BalanceRewardGate } from '../../../DataBase/models/PlayerData';
import { ITaskBuffer, TaskStatus } from '../../../DataBase/models/TaskData';
import { ITaskConfig, ITaskRewardItem } from '../../../shared/config/game/TaskConfig';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { createDefaultPetInfo, IPetInfo } from '../../../shared/models/PetModel';
import { GoldToWire } from '../../../shared/protocol/GoldCurrency';
import { PlayerInstance } from '../Player/PlayerInstance';
import { PetCalculator } from '../Pet/PetCalculator';
import { ReconcilePetPP } from '../Pet/PetPP';
import { SptSystem } from '../Pet/SptSystem';
import { DecodeTask96Buffer } from './Task96Buffer';

export interface CompletedTaskReward {
  petId: number;
  captureTm: number;
  items: ITaskRewardItem[];
  pets: Array<{ petId: number; level: number; catchTime: number }>;
}

function addBalance(value: number, delta: number, field: string): number {
  const next = value + delta;
  if (!Number.isSafeInteger(next) || next < 0 || next > 0x7FFFFFFF) {
    throw new Error(`${field} reward out of range`);
  }
  return next;
}

function requirePositiveUInt(value: number, field: string): void {
  if (!Number.isInteger(value) || value <= 0 || value > 0xFFFFFFFF) {
    throw new Error(`Invalid ${field}`);
  }
}

function validateProgress(taskId: number, config: ITaskConfig, buffers: Record<string, ITaskBuffer>): void {
  if (!config.requiredProgress) return;
  const stored = buffers[taskId];
  const bytes = stored?.xinBytes ?? DecodeTask96Buffer(stored);
  if (bytes.length < config.requiredProgress ||
      !bytes.slice(0, config.requiredProgress).every(value => value === 1)) {
    throw new Error('Task progress incomplete');
  }
}

function buildPet(ownerId: number, petId: number, level: number, catchTime: number, isDefault: boolean, inBag: boolean): IPetInfo {
  if (!GameConfig.GetPetById(petId) || !Number.isInteger(level) || level < 1 || level > 100) {
    throw new Error('Invalid task pet reward');
  }
  const pet = createDefaultPetInfo(ownerId, petId);
  pet.level = pet.obtainLevel = level;
  pet.catchTime = catchTime;
  PetCalculator.UpdatePetStats(pet);
  pet.skillArray = SptSystem.GetDefaultSkills(petId, level).slice(0, 4).map(skill => skill.id);
  pet.skillPP = ReconcilePetPP(pet);
  pet.isDefault = isDefault;
  pet.isInBag = inBag;
  return pet;
}

export async function CompleteConfiguredTask(
  player: PlayerInstance,
  taskId: number,
  param: number,
  config: ITaskConfig,
  expectedDailyDay?: number,
): Promise<CompletedTaskReward> {
  const rewards = config.rewards ?? {};
  const unknown = Object.keys(rewards).filter(key => !['items', 'coins', 'special', 'pets', 'fitments'].includes(key));
  if (unknown.length) throw new Error(`Unsupported task reward: ${unknown.join(',')}`);

  const itemRewards: ITaskRewardItem[] = [
    ...(rewards.items ?? []),
    ...(rewards.fitments ?? []).map(item => ({ itemId: item.fitmentId, count: item.count })),
  ];
  for (const reward of itemRewards) {
    requirePositiveUInt(reward.itemId, 'task item id');
    requirePositiveUInt(reward.count, 'task item count');
    if (!GameConfig.GetItemById(reward.itemId)) throw new Error(`Unknown task item ${reward.itemId}`);
  }

  let coins = rewards.coins ?? 0;
  let experience = 0;
  let gold = 0;
  for (const special of rewards.special ?? []) {
    requirePositiveUInt(special.value, 'special reward');
    if (special.type === 1) coins = addBalance(coins, special.value, 'coins');
    else if (special.type === 3) experience = addBalance(experience, special.value, 'experience');
    else if (special.type === 5) gold = addBalance(gold, special.value, 'gold');
    else throw new Error(`Unsupported special reward type ${special.type}`);
  }
  for (const [value, field] of [[coins, 'coins'], [experience, 'experience'], [gold, 'gold']] as const) {
    if (!Number.isSafeInteger(value) || value < 0 || value > 0x7FFFFFFF) throw new Error(`Invalid ${field} reward`);
  }

  const petRewards = (rewards.pets ?? []).map(pet => ({ petId: pet.petId, level: pet.level }));
  if (config.type === 'select_pet') {
    const selected = config.paramMap?.[String(param)];
    if (selected === undefined) throw new Error('Invalid selected pet');
    petRewards.unshift({ petId: selected, level: 5 });
  }
  for (const pet of petRewards) {
    if (!GameConfig.GetPetById(pet.petId) || !Number.isInteger(pet.level) || pet.level < 1 || pet.level > 100) {
      throw new Error('Invalid task pet reward');
    }
  }
  if (config.type !== 'select_pet' && param !== 0 && param !== 1) throw new Error('Invalid task completion parameter');
  if (config.type === 'get_item' && config.targetItemId !== itemRewards[0]?.itemId) {
    throw new Error('Get-item task reward does not match target item');
  }

  const itemData = itemRewards.length || taskId === 94 ? player.ItemManager.ItemData : undefined;
  const petData = petRewards.length || taskId === 90 ? player.PetManager.PetData : undefined;
  const releaseInventory = itemData ? await itemData.AcquireReward() : undefined;
  const releasePets = petData ? await petData.AcquireMutation() : undefined;
  let gate: BalanceRewardGate | undefined;
  const releaseIdentities: Array<() => void> = [];
  try {
    if (petData) await petData.WaitForStagedSave();
    await player.Data.WaitForExpAllocation();
    await player.Data.WaitForCurrencyOperations();
    const balanceGate = player.Data.BeginBalanceReward();
    gate = balanceGate;

    const firstCatchTime = Math.floor(Date.now() / 1000);
    const catchTimes = petRewards.map((_, index) => firstCatchTime + index);
    if (!petData) {
      if (catchTimes.length) throw new Error('Pet reward manager missing');
    } else {
      for (const catchTime of catchTimes) {
        requirePositiveUInt(catchTime, 'task pet identity');
        releaseIdentities.push(petData.ReserveIdentity(catchTime));
      }
    }

    let result!: CompletedTaskReward;
    await DatabaseManager.Instance.WithConnection(async driver => {
      let committed = false;
      await driver.beginTransaction();
      try {
        const taskRows = await driver.query<{ task_list: string; task_buffers: string }>(
          'SELECT task_list, task_buffers FROM player_tasks WHERE owner_id = ?', [player.Uid]
        );
        const itemRows = itemData
          ? await driver.query<{ item_list: string }>('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid])
          : [];
        const petRows = petData
          ? await driver.query<{ pet_list: string }>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [player.Uid])
          : [];
        const balanceRows = await driver.query<{ coins: number; gold: number; allocatable_exp: number }>(
          'SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?', [player.Uid]
        );
        if (!taskRows[0] || !balanceRows[0] || (itemData && !itemRows[0]) ||
            (petData && !petRows[0])) throw new Error('Task reward data missing');

        const stagedItems: IItemInfo[] = itemRows[0] ? JSON.parse(itemRows[0].item_list) : [];
        const taskList = JSON.parse(taskRows[0].task_list);
        const taskBuffers = JSON.parse(taskRows[0].task_buffers);
        const task = taskList[taskId];
        if (!task || (task.status !== TaskStatus.ACCEPTED && task.status !== TaskStatus.IN_PROGRESS)) {
          throw new Error('Task is not pending completion');
        }
        if (expectedDailyDay !== undefined && taskBuffers[taskId]?.dailyDay !== expectedDailyDay) {
          throw new Error('Daily task belongs to another day');
        }
        const mushroomTurnIn = taskId === 19 && (player.ChallengeProgressManager.HasDefeatedSPTBoss(1) ||
          taskList[301]?.status === TaskStatus.COMPLETED);
        if (!mushroomTurnIn) validateProgress(taskId, config, taskBuffers);
        if (taskId === 37) {
          const buffer: ITaskBuffer = taskBuffers[taskId];
          const stages = buffer.xinBytes ?? DecodeTask96Buffer(buffer);
          stages[10] = 1;
          if (!buffer.xinBytes) stages.forEach((value, index) => { buffer[index] = value; });
        }
        if (taskId === 90) {
          const ownedPets: IPetInfo[] = JSON.parse(petRows[0].pet_list);
          if (!ownedPets.some(pet => pet.petId === 10)) {
            throw new Error('Task 90 requires a Pipi in the bag or storage');
          }
          const buffer: ITaskBuffer = taskBuffers[taskId];
          if (buffer.xinBytes) buffer.xinBytes[1] = 1;
          else buffer[1] = 1;
        }
        if (taskId === 88 && ![85, 86, 87].every(id => taskList[id]?.status === TaskStatus.COMPLETED)) {
          throw new Error('Task 88 requires completed onboarding steps');
        }
        if (taskId === 94) {
          for (const itemId of [400001, 400002]) {
            if (!stagedItems.some(item => item.itemId === itemId && item.count >= 5)) {
              throw new Error('Task 94 requires five yellow crystals and five methane canisters');
            }
          }
          const buffer: ITaskBuffer = taskBuffers[taskId];
          if (buffer.xinBytes) buffer.xinBytes[3] = 1;
          else buffer[3] = 1;
        }
        if (taskId === 96) {
          const buffer = taskBuffers[taskId] as ITaskBuffer | undefined;
          const stages = buffer?.xinBytes ?? DecodeTask96Buffer(buffer);
          if (![0, 1, 2].every(index => stages[index] === 1)) throw new Error('Task 96 progress incomplete');
          if (!player.Data.hasNono || !(player.Data.nonoState & 2)) throw new Error('Task 96 requires following NoNo');
          if (buffer?.xinBytes) buffer.xinBytes[3] = 1;
          else {
            taskBuffers[taskId] = { ...buffer };
            stages.forEach((value, index) => { taskBuffers[taskId][index] = value; });
            taskBuffers[taskId][3] = 1;
          }
        }

        for (const reward of itemRewards) {
          const existing = stagedItems.find(item => item.itemId === reward.itemId);
          if (existing) existing.count = addBalance(existing.count, reward.count, 'item count');
          else stagedItems.push({ itemId: reward.itemId, count: reward.count, expireTime: 0x057E40 });
        }

        const stagedPets: IPetInfo[] = petRows[0] ? JSON.parse(petRows[0].pet_list) : [];
        for (const catchTime of catchTimes) {
          if (stagedPets.some(pet => pet.catchTime === catchTime)) throw new Error('Task pet identity collision');
        }
        let bagCount = stagedPets.filter(pet => pet.isInBag).length;
        const grantedPets = petRewards.map((reward, index) => {
          const pet = buildPet(player.Uid, reward.petId, reward.level, catchTimes[index], stagedPets.length === 0, bagCount < 6);
          if (pet.isInBag) bagCount++;
          stagedPets.push(pet);
          return pet;
        });

        const completed = { ...task, status: TaskStatus.COMPLETED, completeTime: Math.floor(Date.now() / 1000) };
        taskList[taskId] = completed;
        const balances = [
          addBalance(Number(balanceRows[0].coins), coins, 'coins'),
          addBalance(Number(balanceRows[0].gold), gold, 'gold'),
          addBalance(Number(balanceRows[0].allocatable_exp), experience, 'experience'),
        ];
        if (gold) GoldToWire(balances[1]);
        const petAllNum = stagedPets.length;
        const petMaxLev = stagedPets.reduce((max, pet) => Math.max(max, pet.level), 0);

        const taskWrite = await driver.execute(
          'UPDATE player_tasks SET task_list = ?, task_buffers = ? WHERE owner_id = ?',
          [JSON.stringify(taskList), JSON.stringify(taskBuffers), player.Uid]
        );
        if (taskWrite.affectedRows !== 1) throw new Error('Task reward data disappeared');
        if (itemRewards.length) {
          const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?',
            [JSON.stringify(stagedItems), player.Uid]);
          if (itemWrite.affectedRows !== 1) throw new Error('Task item data disappeared');
        }
        if (petRewards.length) {
          const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?',
            [JSON.stringify(stagedPets), player.Uid]);
          if (petWrite.affectedRows !== 1) throw new Error('Task pet data disappeared');
        }
        const playerWrite = petRewards.length
          ? await driver.execute(
            'UPDATE players SET coins = ?, gold = ?, allocatable_exp = ?, pet_all_num = ?, pet_max_lev = ? WHERE user_id = ?',
            [...balances, petAllNum, petMaxLev, player.Uid])
          : await driver.execute('UPDATE players SET coins = ?, gold = ?, allocatable_exp = ? WHERE user_id = ?',
            [...balances, player.Uid]);
        if (playerWrite.affectedRows !== 1) throw new Error('Task player data disappeared');
        await driver.commit();
        committed = true;

        if (itemData) {
          itemData.ItemList = stagedItems;
          player.ItemManager.syncClothesToPlayerData();
        }
        if (petRewards.length && petData) petData.PetList = stagedPets;
        player.TaskManager.TaskData.TaskList.set(taskId, completed);
        if (taskBuffers[taskId]) player.TaskManager.TaskData.TaskBuffers.set(taskId, taskBuffers[taskId]);
        balanceGate.publish(balances[0], balances[1], balances[2]);
        if (petRewards.length) {
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
      } catch (error) {
        if (!committed) await driver.rollback();
        throw error;
      }
    });
    return result;
  } finally {
    for (const release of releaseIdentities.reverse()) release();
    gate?.release();
    releasePets?.();
    releaseInventory?.();
  }
}
