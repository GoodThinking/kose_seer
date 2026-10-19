import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { DatabaseHelper } from '../../../../../DataBase/DatabaseHelper';
import { GameConfig } from '../../../../../shared/config/game/GameConfig';
import { Logger } from '../../../../../shared/utils';
import { IPetInfo } from '../../../../../shared/models/PetModel';
import { applyRandomIndividualValues } from '../../../../Game/Pet/RandomDv';
import { PetCalculator } from '../../../../Game/Pet/PetCalculator';
import { SptSystem } from '../../../../Game/Pet/SptSystem';
import { ReconcilePetPP } from '../../../../Game/Pet/PetPP';

const MISSING = 5001;
const NO_ITEM = 10016;

const NATURE_BY_ITEM: Record<number, number> = {
  300081: 1, 300082: 18, 300083: 4, 300084: 5, 300085: 8, 300086: 16,
  300933: 0, 300934: 2, 300935: 3, 300936: 6, 300937: 7, 300938: 9, 300939: 10,
  300940: 11, 300941: 12, 300942: 13, 300943: 14, 300944: 15, 300945: 17, 300946: 19,
  300947: 20, 300948: 21, 300949: 22, 300950: 23, 300951: 24,
};
const RANDOM_NATURE_ITEMS = new Set([300025, 300070, 300660, 300728]);
type EvField = 'evHp' | 'evAtk' | 'evDef' | 'evSpAtk' | 'evSpDef' | 'evSpeed';
const EV_FIELD_BY_REMOVE: Record<number, EvField> = {
  1: 'evHp', 2: 'evAtk', 3: 'evDef', 4: 'evSpAtk', 5: 'evSpDef', 6: 'evSpeed',
};
const ALL_EV_FIELDS: EvField[] = ['evHp', 'evAtk', 'evDef', 'evSpAtk', 'evSpDef', 'evSpeed'];

type OutOfFightItem = {
  RandomDv?: number;
  IncreMonLvTo?: number | string;
  EvRemove?: number | string;
};

type PetRecord = IPetInfo & { skillPP?: Record<number, number> };

/** Walk level-up evolutions. Item evolutions stay for the evolution chamber. */
function resolveLevelEvolution(petId: number, level: number): number {
  let current = petId;
  for (let step = 0; step < 6; step++) {
    const info = GameConfig.GetPetById(current);
    const next = Number(info?.EvolvesTo || 0);
    const need = Number(info?.EvolvingLv || 0);
    const flag = Number(info?.EvolvFlag || 0);
    if (!next || flag !== 0 || need < 1 || level < need) break;
    current = next;
  }
  return current;
}

function u32(value: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0, 0);
  return buffer;
}

/** Body read by UsePetItemOutOfFightInfo. Skill list is empty; the client reloads the pet afterwards. */
export function encodeUsePetItemOutOfFight(pet: IPetInfo): Buffer {
  const nick = Buffer.alloc(16);
  Buffer.from(pet.nick || '', 'utf8').copy(nick, 0, 0, 16);
  const dv = Math.floor((pet.dvHp + pet.dvAtk + pet.dvDef + pet.dvSpAtk + pet.dvSpDef + pet.dvSpeed) / 6);
  return Buffer.concat([
    u32(pet.catchTime), u32(pet.petId), nick, u32(pet.nature), u32(dv), u32(pet.level),
    u32(pet.hp), u32(pet.maxHp), u32(pet.exp),
    u32(pet.evHp), u32(pet.evAtk), u32(pet.evDef), u32(pet.evSpAtk), u32(pet.evSpDef), u32(pet.evSpeed),
    u32(pet.atk), u32(pet.spAtk), u32(pet.def), u32(pet.spDef), u32(pet.speed), u32(0),
  ]);
}

class PacketUsePetItemOutOfFight extends BaseProto {
  private body: Buffer;

  constructor(body: Buffer) {
    super(CommandID.USE_PET_ITEM_OUT_OF_FIGHT);
    this.body = body;
  }

  public serialize(): Buffer {
    return this.body;
  }
}

/**
 * [CMD: 2326 USE_PET_ITEM_OUT_OF_FIGHT]
 * Handles individual rerolls, nature items, level potions, and effort-value forget potions.
 */
@Opcode(CommandID.USE_PET_ITEM_OUT_OF_FIGHT, InjectType.NONE)
export class UsePetItemOutOfFightHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const fail = (code: number) => player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM_OUT_OF_FIGHT).setResult(code));
    if (body.length < 8) {
      await fail(MISSING);
      return;
    }

    const catchTime = body.readUInt32BE(0);
    const itemId = body.readUInt32BE(4);
    const item = GameConfig.GetItemById(itemId) as OutOfFightItem | null;
    const pet = player.PetManager.PetData.PetList.find(entry => entry.catchTime === catchTime) as PetRecord | undefined;
    if (!pet || player.ItemManager.GetItemCount(itemId) < 1) {
      await fail(pet ? NO_ITEM : MISSING);
      return;
    }

    const fixedNature = NATURE_BY_ITEM[itemId];
    const randomNature = RANDOM_NATURE_ITEMS.has(itemId);
    let skipConsume = false;
    if (item && item.RandomDv === 1) {
      applyRandomIndividualValues(pet);
    } else if (fixedNature !== undefined || randomNature) {
      let nature = fixedNature;
      if (nature === undefined) {
        do {
          nature = Math.floor(Math.random() * 25);
        } while (nature === pet.nature);
      }
      pet.nature = nature;
      PetCalculator.UpdatePetStats(pet);
      Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} nature=${nature}`);
    } else if (item && Number(item.EvRemove) >= 1 && Number(item.EvRemove) <= 7) {
      const evRemove = Number(item.EvRemove);
      const evFields = evRemove === 7 ? ALL_EV_FIELDS : [EV_FIELD_BY_REMOVE[evRemove]];
      if (!evFields.some(field => Number(pet[field]) > 0)) {
        await fail(MISSING);
        return;
      }
      for (const field of evFields) {
        pet[field] = 0;
      }
      PetCalculator.UpdatePetStats(pet);
      Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} evRemove=${evRemove}`);
    } else {
      const targetLevel = Number(item && item.IncreMonLvTo);
      if (!Number.isInteger(targetLevel) || targetLevel < 1) {
        Logger.Warn(`[UsePetItemOutOfFight] unsupported item ${itemId}`);
        await fail(MISSING);
        return;
      }
      const raising = pet.level < targetLevel;
      const evolvedId = resolveLevelEvolution(pet.petId, raising ? targetLevel : pet.level);
      if (!raising && evolvedId === pet.petId) {
        await fail(MISSING);
        return;
      }
      if (raising) {
        pet.level = targetLevel;
        pet.exp = 0;
      } else {
        skipConsume = true;
      }
      if (evolvedId !== pet.petId) {
        Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} evolve ${pet.petId} -> ${evolvedId}`);
        pet.petId = evolvedId;
      }
      PetCalculator.UpdatePetStats(pet);
      pet.hp = pet.maxHp;
      const learned = SptSystem.GetLearnableMovesByLevel(pet.petId, pet.level) || [];
      if (!Array.isArray(pet.skillArray)) pet.skillArray = [];
      for (const move of learned) {
        if (pet.skillArray.length >= 4) break;
        if (move && move.id > 0 && !pet.skillArray.includes(move.id)) pet.skillArray.push(move.id);
      }
      pet.skillPP = ReconcilePetPP(pet, true);
      Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} level=${pet.level}`);
    }

    await DatabaseHelper.Instance.SavePetData(player.PetManager.PetData);
    if (!skipConsume) {
      if (!player.ItemManager.ConsumeItem(itemId, 1)) {
        await fail(NO_ITEM);
        return;
      }
      await DatabaseHelper.Instance.SaveItemData(player.ItemManager.ItemData);
    }
    Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} catch=${catchTime} dv=${pet.dvHp}/${pet.dvAtk}/${pet.dvDef}/${pet.dvSpAtk}/${pet.dvSpDef}/${pet.dvSpeed}`);
    await player.SendPacket(new PacketUsePetItemOutOfFight(encodeUsePetItemOutOfFight(pet)));
  }
}
