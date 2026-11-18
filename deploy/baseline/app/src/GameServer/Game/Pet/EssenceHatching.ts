import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import type { IItemInfo } from '../../../DataBase/models/ItemData';
import { ConfigLoader } from '../../../shared/config/ConfigLoader';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { createDefaultPetInfo, IPetInfo } from '../../../shared/models/PetModel';
import { Logger } from '../../../shared/utils/Logger';
import { IPetObtainedEvent, PetEventType, PetObtainSource } from '../Event/EventTypes';
import type { PlayerInstance } from '../Player/PlayerInstance';
import { PetCalculator } from './PetCalculator';
import { ReconcilePetPP } from './PetPP';
import { SptSystem } from './SptSystem';

interface HatchRow {
  item_id: number;
  pet_id: number;
  pet_level: number;
  ready_at: number;
}

export interface EssenceHatchState {
  active: boolean;
  remaining: number;
  petId: number;
  catchTime: number;
}

export class InvalidEssenceHatch extends Error {}
export class EssenceIncubatorBusy extends Error {}

export class EssenceHatching {
  constructor(private readonly player: PlayerInstance) {}

  private CheckNoNo(): void {
    if (!this.player.Data.hasNono) throw new InvalidEssenceHatch('NoNo required');
  }

  public async Start(itemId: number): Promise<number> {
    this.CheckNoNo();
    const item = GameConfig.GetItemById(itemId);
    const petId = Number(item?.BreedMonID);
    const level = Number(item?.BreedMonLv);
    if (!Number.isInteger(itemId) || !Number.isInteger(petId) || petId <= 0 ||
        !GameConfig.GetPetById(petId) || !Number.isInteger(level) || level < 1 || level > 100 ||
        !item?.BreedTime) throw new InvalidEssenceHatch('Item has no supported essence conversion');
    const settings = ConfigLoader.Instance.LoadJson<{durationSeconds: number}>('data/json/essence-hatching.json');
    const duration = settings?.durationSeconds;
    if (!Number.isSafeInteger(duration) || !duration || duration <= 0 || duration > 0xffffffff) {
      throw new Error('Invalid essence incubation duration');
    }
    const inventory = this.player.ItemManager.ItemData;
    const release = await inventory.AcquireReward();
    try {
      this.CheckNoNo();
      return await DatabaseManager.Instance.WithConnection(async driver => {
        await driver.beginTransaction();
        let committed = false;
        try {
          const [existing] = await driver.query<HatchRow>('SELECT item_id, pet_id, pet_level, ready_at FROM player_essence_hatches WHERE owner_id = ?', [this.player.Uid]);
          if (existing) throw new EssenceIncubatorBusy('An essence is already incubating');
          const items: IItemInfo[] = inventory.ItemList.map(entry => ({...entry}));
          const index = items.findIndex(entry => entry.itemId === itemId);
          if (index < 0 || !Number.isSafeInteger(items[index].count) || items[index].count < 1) {
            throw new InvalidEssenceHatch('Essence not owned');
          }
          if (items[index].count === 1) items.splice(index, 1);
          else items[index].count--;
          const readyAt = Math.floor(Date.now() / 1000) + duration;
          const job = await driver.execute('INSERT INTO player_essence_hatches (owner_id, item_id, pet_id, pet_level, ready_at) VALUES (?, ?, ?, ?, ?)',
            [this.player.Uid, itemId, petId, level, readyAt]);
          const stock = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), this.player.Uid]);
          if (job.affectedRows !== 1 || stock.affectedRows !== 1) throw new Error('Incubation start was not saved');
          await driver.commit();
          committed = true;
          inventory.ItemList = items;
          return duration;
        } catch (error) {
          if (!committed) await driver.rollback();
          throw error;
        }
      });
    } finally {release();}
  }

  public async Get(): Promise<EssenceHatchState> {
    this.CheckNoNo();
    const current = await DatabaseManager.Instance.WithConnection(async driver => {
      const [row] = await driver.query<HatchRow>('SELECT item_id, pet_id, pet_level, ready_at FROM player_essence_hatches WHERE owner_id = ?', [this.player.Uid]);
      return row;
    });
    if (!current) return {active: false, remaining: 0, petId: 0, catchTime: 0};
    const remaining = Math.max(0, Number(current.ready_at) - Math.floor(Date.now() / 1000));
    if (remaining) return {active: true, remaining, petId: current.pet_id, catchTime: 0};

    const pets = this.player.PetManager.PetData;
    const release = await pets.AcquireMutation();
    let releaseIdentity: (() => void) | undefined;
    let granted: IPetInfo | undefined;
    try {
      await pets.WaitForStagedSave();
      const result = await DatabaseManager.Instance.WithConnection(async driver => {
        await driver.beginTransaction();
        let committed = false;
        try {
          const [job] = await driver.query<HatchRow>('SELECT item_id, pet_id, pet_level, ready_at FROM player_essence_hatches WHERE owner_id = ?', [this.player.Uid]);
          if (!job) {await driver.commit(); committed = true; return {active: false, remaining: 0, petId: 0, catchTime: 0};}
          const now = Math.floor(Date.now() / 1000);
          const left = Math.max(0, Number(job.ready_at) - now);
          if (left) {await driver.commit(); committed = true; return {active: true, remaining: left, petId: job.pet_id, catchTime: 0};}
          if (!GameConfig.GetPetById(job.pet_id) || !Number.isInteger(job.pet_level) || job.pet_level < 1 || job.pet_level > 100) {
            throw new Error('Invalid saved incubation target');
          }
          const staged: IPetInfo[] = pets.PetList.slice();
          if (staged.some(pet => pet.catchTime === now)) throw new Error('Pet identity already in use');
          releaseIdentity = pets.ReserveIdentity(now);
          const pet = createDefaultPetInfo(this.player.Uid, job.pet_id);
          pet.level = pet.obtainLevel = job.pet_level;
          pet.catchTime = now;
          // Native 2316 callback moves the committed storage pet into the bag if space permits.
          pet.isInBag = false;
          pet.isDefault = false;
          PetCalculator.UpdatePetStats(pet);
          pet.skillArray = SptSystem.GetDefaultSkills(job.pet_id, job.pet_level).slice(0, 4).map(skill => skill.id);
          pet.skillPP = ReconcilePetPP(pet);
          staged.push(pet);
          const maxLevel = staged.reduce((max, entry) => Math.max(max, entry.level), 0);
          const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [JSON.stringify(staged), this.player.Uid]);
          const playerWrite = await driver.execute('UPDATE players SET pet_all_num = ?, pet_max_lev = ? WHERE user_id = ?', [staged.length, maxLevel, this.player.Uid]);
          const jobWrite = await driver.execute('DELETE FROM player_essence_hatches WHERE owner_id = ?', [this.player.Uid]);
          if (petWrite.affectedRows !== 1 || playerWrite.affectedRows !== 1 || jobWrite.affectedRows !== 1) throw new Error('Hatched pet was not saved');
          await driver.commit();
          committed = true;
          pets.PetList = staged;
          this.player.Data.petAllNum = staged.length;
          this.player.Data.petMaxLev = maxLevel;
          granted = pet;
          return {active: true, remaining: 0, petId: pet.petId, catchTime: pet.catchTime};
        } catch (error) {
          if (!committed) await driver.rollback();
          throw error;
        }
      });
      if (granted) {
        try {
          const event: IPetObtainedEvent = {type: PetEventType.PET_OBTAINED, timestamp: Date.now(), playerId: this.player.Uid,
            petId: granted.petId, level: granted.level, catchTime: granted.catchTime, source: PetObtainSource.GIVE};
          await this.player.EventBus.Emit(event);
        } catch (error) {Logger.Error('[EssenceHatching] Pet committed; acquisition notification failed', error as Error);}
      }
      return result;
    } finally {releaseIdentity?.(); release();}
  }
}
