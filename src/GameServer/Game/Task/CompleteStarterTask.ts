import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import { TaskData, TaskStatus } from '../../../DataBase/models/TaskData';
import { PetData } from '../../../DataBase/models/PetData';
import { createDefaultPetInfo } from '../../../shared/models/PetModel';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { PetCalculator } from '../Pet/PetCalculator';
import { SptSystem } from '../Pet/SptSystem';

/** Task 86 has exactly one chosen pet and no other rewards. Stage without
 * touching proxied live data; publish only after both durable writes commit. */
export async function CompleteStarterTask(tasks: TaskData, pets: PetData, petId: number, catchTime: number): Promise<void> {
  if (!GameConfig.GetPetById(petId) || !Number.isInteger(catchTime) || catchTime <= 0 || catchTime > 0xFFFFFFFF) {
    throw new Error('Invalid starter pet');
  }
  const releaseIdentity = pets.ReserveIdentity(catchTime);
  try {
    await DatabaseManager.Instance.WithConnection(async driver => {
      let committed = false;
      await driver.beginTransaction();
      try {
        const rows = await driver.query<any>('SELECT task_list FROM player_tasks WHERE owner_id = ?', [tasks.Uid]);
        const persisted = rows[0] && JSON.parse(rows[0].task_list)['86'];
        if (!persisted || persisted.status !== TaskStatus.ACCEPTED) throw new Error('Starter task is not accepted');
        const petRows = await driver.query<any>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [pets.Uid]);
        if (!petRows.length) throw new Error('Pet data missing');
        if (pets.GetPetByCatchTime(catchTime) || JSON.parse(petRows[0].pet_list).some((pet: any) => pet.catchTime === catchTime)) {
          throw new Error('Starter catch time collision');
        }
        const pet = createDefaultPetInfo(pets.Uid, petId);
        pet.level = pet.obtainLevel = 5;
        pet.catchTime = catchTime;
        PetCalculator.UpdatePetStats(pet);
        pet.skillArray = SptSystem.GetDefaultSkills(petId, 5).slice(0, 4).map(skill => skill.id);
        const bagCount = pets.GetPetsInBag().length;
        pet.isDefault = bagCount === 0;
        pet.isInBag = bagCount < 6;
        const completed = { ...tasks.GetTask(86)!, status: TaskStatus.COMPLETED, completeTime: Math.floor(Date.now() / 1000) };
        const stagedTasks = { ...JSON.parse(tasks.ToRow().task_list), '86': completed };
        const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [JSON.stringify([...pets.PetList, pet]), pets.Uid]);
        const taskWrite = await driver.execute('UPDATE player_tasks SET task_list = ? WHERE owner_id = ?', [JSON.stringify(stagedTasks), tasks.Uid]);
        if (petWrite.affectedRows !== 1 || taskWrite.affectedRows !== 1) throw new Error('Starter data disappeared');
        await driver.commit();
        committed = true;
        // No await between commit and publication; queued auto-saves see the new state.
        pets.PetList.push(pet);
        tasks.TaskList.set(86, completed);
      } catch (error) {
        if (!committed) await driver.rollback();
        throw error;
      }
    });
  } finally { releaseIdentity(); }
}
