/// <reference path="./AcquisitionRuntime.d.ts" />
import { ConfigLoader } from '../../../shared/config/ConfigLoader';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import { SptSystem } from './SptSystem';
import { ReconcilePetPP } from './PetPP';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { PacketPetEvolution } from '../../Server/Packet/Send/Pet/PacketPetEvolution';
import { CommandID } from '../../../shared/protocol/CommandID';
import { PetEventType, IPetEvolutionEvent } from '../Event/EventTypes';
import { Logger } from '../../../shared/utils';
import type { IPetInfo } from '../../../shared/models/PetModel';
import type { IItemInfo } from '../../../DataBase/models/ItemData';
import type { PlayerInstance } from '../Player/PlayerInstance';

interface StagedPets { ToRow(): {pet_list: string} }
interface EvolutionManager {
  Player: PlayerInstance;
  PetData: {
    AcquireMutation(): Promise<() => void>;
    GetPetByCatchTime(time: number): IPetInfo | null;
    CommitPetUpdate(pet: IPetInfo, candidate: IPetInfo,
      persist?: (staged: StagedPets) => Promise<void>, publish?: () => void): Promise<void>;
  };
  recalculateStats(pet: IPetInfo): void;
  sendNoteUpdateProp(pets: IPetInfo[], experience: number): Promise<void>;
  sendNoteUpdateSkill(pet: IPetInfo, all: number[], active: number[], inactive: number[]): Promise<void>;
}

interface EvolutionBranch { petId: number; itemId: number; count: number }

/** Branch order and material costs come from the deployed client's CondEvolves XML. */
export function ResolveEvolution(petId: number, index: number): EvolutionBranch | undefined {
  if (!Number.isInteger(index) || index < 1) return;
  const pet = GameConfig.GetPetById(petId);
  if (!pet) return;
  const flag = Number(pet.EvolvFlag || 0);
  if (flag) {
    const rules = ConfigLoader.Instance.LoadJson<{branches: Record<string, EvolutionBranch[]>}>('data/json/special-evolutions.json');
    const branch = rules?.branches[flag]?.[index - 1];
    if (branch && GameConfig.GetPetById(branch.petId)) return branch;
    return;
  }
  const target = SptSystem.GetEvolvesTo(petId);
  if (index === 1 && target && GameConfig.GetPetById(target)) return {petId: target, itemId: 0, count: 0};
}

/** Called only by PetManager; keep its existing notification and attribute calculation methods. */
export async function HandleEvolution(manager: EvolutionManager, catchTime: number, index: number): Promise<void> {
  const player = manager.Player;
  const pets = manager.PetData;
  const release = await pets.AcquireMutation();
  let releaseItems: (() => void) | undefined;
  let committed = false;
  const fail = (code: number) => player.SendPacket(new PacketEmpty(CommandID.PET_EVOLVTION).setResult(code));
  try {
    const pet = pets.GetPetByCatchTime(catchTime);
    const branch = pet && ResolveEvolution(pet.petId, index);
    if (!pet || !branch || pet.level < SptSystem.GetEvolvingLevel(pet.petId)) { await fail(5001); return; }
    const inventory = player.ItemManager.ItemData;
    if (branch.count) {
      releaseItems = await inventory.AcquireReward();
      if (inventory.GetItemCount(branch.itemId) < branch.count) { await fail(5001); return; }
    }
    const oldPetId = pet.petId;
    const candidate: IPetInfo = JSON.parse(JSON.stringify(pet));
    candidate.catchTime = player.ClientProtocol === 'xin-20261013' ? pet.catchTime : Math.floor(Date.now() / 1000);
    if (candidate.catchTime !== pet.catchTime && pets.GetPetByCatchTime(candidate.catchTime)) { await fail(5001); return; }
    candidate.petId = branch.petId;
    manager.recalculateStats(candidate);
    const newSkills = SptSystem.GetNewMovesOnLevelUp(candidate.petId, candidate.level).map(move => move.id);
    const activeSkills = newSkills.slice(0, Math.max(0, 4 - candidate.skillArray.length));
    candidate.skillArray.push(...activeSkills);
    candidate.skillPP = ReconcilePetPP(candidate);
    if (branch.count) {
      let updatedItems: IItemInfo[] = [];
      await pets.CommitPetUpdate(pet, candidate, async (staged: StagedPets) => {
        await DatabaseManager.Instance.WithConnection(async driver => {
          await driver.beginTransaction();
          try {
            const [row] = await driver.query<{item_list: string}>('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
            if (!row) throw new Error('Evolution inventory missing');
            const items: IItemInfo[] = JSON.parse(row.item_list);
            const item = items.find(entry => entry.itemId === branch.itemId);
            if (!item || item.count < branch.count) throw new Error('Evolution material changed');
            item.count -= branch.count;
            updatedItems = items;
            const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), player.Uid]);
            const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [staged.ToRow().pet_list, player.Uid]);
            if (itemWrite.affectedRows !== 1 || petWrite.affectedRows !== 1) throw new Error('Evolution was not saved');
            await driver.commit();
          } catch (error) { await driver.rollback(); throw error; }
        });
      }, () => { inventory.ItemList = updatedItems; });
    } else await pets.CommitPetUpdate(pet, candidate);
    committed = true;
    await player.SendPacket(new PacketPetEvolution(0));
    await manager.sendNoteUpdateProp([pet], 0);
    if (newSkills.length) await manager.sendNoteUpdateSkill(pet, newSkills, activeSkills, newSkills.slice(activeSkills.length));
    const event: IPetEvolutionEvent = {type: PetEventType.PET_EVOLUTION, timestamp: Date.now(), playerId: player.Uid,
      oldPetId, newPetId: branch.petId, level: pet.level, catchTime: pet.catchTime};
    await player.EventBus.Emit(event);
  } catch (error) {
    Logger.Error(committed ? '[SpecialEvolution] Evolution committed; notification failed' : '[SpecialEvolution] Evolution rejected', error as Error);
    if (!committed) await fail(5000);
  } finally { releaseItems?.(); release(); }
}
