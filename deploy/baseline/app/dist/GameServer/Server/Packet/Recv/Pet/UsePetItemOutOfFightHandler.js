"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsePetItemOutOfFightHandler = void 0;
exports.encodeUsePetItemOutOfFight = encodeUsePetItemOutOfFight;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const DatabaseHelper_1 = require("../../../../../DataBase/DatabaseHelper");
const DatabaseManager_1 = require("../../../../../DataBase/DatabaseManager");
const GameConfig_1 = require("../../../../../shared/config/game/GameConfig");
const utils_1 = require("../../../../../shared/utils");
const RandomDv_1 = require("../../../../Game/Pet/RandomDv");
const PetCalculator_1 = require("../../../../Game/Pet/PetCalculator");
const SptSystem_1 = require("../../../../Game/Pet/SptSystem");
const PetPP_1 = require("../../../../Game/Pet/PetPP");
const PetTrait_1 = require("../../../../Game/Pet/PetTrait");
const MISSING = 5001;
const NO_ITEM = 10016;
const NATURE_BY_ITEM = {
    300081: 1, 300082: 18, 300083: 4, 300084: 5, 300085: 8, 300086: 16,
    300933: 0, 300934: 2, 300935: 3, 300936: 6, 300937: 7, 300938: 9, 300939: 10,
    300940: 11, 300941: 12, 300942: 13, 300943: 14, 300944: 15, 300945: 17, 300946: 19,
    300947: 20, 300948: 21, 300949: 22, 300950: 23, 300951: 24,
};
const RANDOM_NATURE_ITEMS = new Set([300025, 300070, 300660, 300728]);
const EV_FIELD_BY_REMOVE = {
    1: 'evHp', 2: 'evAtk', 3: 'evDef', 4: 'evSpAtk', 5: 'evSpDef', 6: 'evSpeed',
};
const ALL_EV_FIELDS = ['evHp', 'evAtk', 'evDef', 'evSpAtk', 'evSpDef', 'evSpeed'];
/** Walk level-up evolutions. Item evolutions stay for the evolution chamber. */
function resolveLevelEvolution(petId, level) {
    let current = petId;
    for (let step = 0; step < 6; step++) {
        const info = GameConfig_1.GameConfig.GetPetById(current);
        const next = Number(info?.EvolvesTo || 0);
        const need = Number(info?.EvolvingLv || 0);
        const flag = Number(info?.EvolvFlag || 0);
        if (!next || flag !== 0 || need < 1 || level < need)
            break;
        current = next;
    }
    return current;
}
function u32(value) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value >>> 0, 0);
    return buffer;
}
/** Body read by UsePetItemOutOfFightInfo. Skill list is empty; the client reloads the pet afterwards. */
function encodeUsePetItemOutOfFight(pet) {
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
class PacketUsePetItemOutOfFight extends BaseProto_1.BaseProto {
    body;
    constructor(body) {
        super(CommandID_1.CommandID.USE_PET_ITEM_OUT_OF_FIGHT);
        this.body = body;
    }
    serialize() {
        return this.body;
    }
}
/**
 * [CMD: 2326 USE_PET_ITEM_OUT_OF_FIGHT]
 * Handles individual rerolls, nature items, level potions, and effort-value forget potions.
 */
let UsePetItemOutOfFightHandler = class UsePetItemOutOfFightHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const fail = (code) => player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.USE_PET_ITEM_OUT_OF_FIGHT).setResult(code));
        if (body.length < 8) {
            await fail(MISSING);
            return;
        }
        const catchTime = body.readUInt32BE(0);
        const itemId = body.readUInt32BE(4);
        const item = GameConfig_1.GameConfig.GetItemById(itemId);
        const pet = player.PetManager.PetData.PetList.find(entry => entry.catchTime === catchTime);
        if (!pet || player.ItemManager.GetItemCount(itemId) < 1) {
            await fail(pet ? NO_ITEM : MISSING);
            return;
        }
        if (item && (Number(item.HP) > 0 || Number(item.PP) > 0)) {
            await useRecoveryMedicine(player, catchTime, itemId);
            return;
        }
        const fixedNature = NATURE_BY_ITEM[itemId];
        const randomNature = RANDOM_NATURE_ITEMS.has(itemId);
        let skipConsume = false;
        if (item && item.RandomDv === 1) {
            (0, RandomDv_1.applyRandomIndividualValues)(pet);
        }
        else if (fixedNature !== undefined || randomNature) {
            let nature = fixedNature;
            if (nature === undefined) {
                do {
                    nature = Math.floor(Math.random() * 25);
                } while (nature === pet.nature);
            }
            pet.nature = nature;
            PetCalculator_1.PetCalculator.UpdatePetStats(pet);
            utils_1.Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} nature=${nature}`);
        }
        else if (item && Number(item.EvRemove) >= 1 && Number(item.EvRemove) <= 7) {
            const evRemove = Number(item.EvRemove);
            const evFields = evRemove === 7 ? ALL_EV_FIELDS : [EV_FIELD_BY_REMOVE[evRemove]];
            if (!evFields.some(field => Number(pet[field]) > 0)) {
                await fail(MISSING);
                return;
            }
            for (const field of evFields) {
                pet[field] = 0;
            }
            PetCalculator_1.PetCalculator.UpdatePetStats(pet);
            utils_1.Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} evRemove=${evRemove}`);
        }
        else if (item && Number(item.DecreMonLv) >= 1) {
            const drop = Math.floor(Number(item.DecreMonLv));
            if (pet.level <= 1) {
                await fail(MISSING);
                return;
            }
            pet.level = Math.max(1, pet.level - drop);
            pet.exp = 0;
            PetCalculator_1.PetCalculator.UpdatePetStats(pet);
            if (pet.hp > pet.maxHp)
                pet.hp = pet.maxHp;
            utils_1.Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} level=${pet.level}`);
        }
        else if ((0, PetTrait_1.isTraitItem)(item)) {
            if ((0, PetTrait_1.applyTraitItem)(pet, item) !== 'ok') {
                await fail(MISSING);
                return;
            }
            utils_1.Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} trait=${(0, PetTrait_1.currentTraitId)(pet)}`);
        }
        else {
            const targetLevel = Number(item && item.IncreMonLvTo);
            if (!Number.isInteger(targetLevel) || targetLevel < 1) {
                utils_1.Logger.Warn(`[UsePetItemOutOfFight] unsupported item ${itemId}`);
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
            }
            else {
                skipConsume = true;
            }
            if (evolvedId !== pet.petId) {
                utils_1.Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} evolve ${pet.petId} -> ${evolvedId}`);
                pet.petId = evolvedId;
            }
            PetCalculator_1.PetCalculator.UpdatePetStats(pet);
            pet.hp = pet.maxHp;
            const learned = SptSystem_1.SptSystem.GetLearnableMovesByLevel(pet.petId, pet.level) || [];
            if (!Array.isArray(pet.skillArray))
                pet.skillArray = [];
            for (const move of learned) {
                if (pet.skillArray.length >= 4)
                    break;
                if (move && move.id > 0 && !pet.skillArray.includes(move.id))
                    pet.skillArray.push(move.id);
            }
            pet.skillPP = (0, PetPP_1.ReconcilePetPP)(pet, true);
            utils_1.Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} level=${pet.level}`);
        }
        await DatabaseHelper_1.DatabaseHelper.Instance.SavePetData(player.PetManager.PetData);
        if (!skipConsume) {
            if (!player.ItemManager.ConsumeItem(itemId, 1)) {
                await fail(NO_ITEM);
                return;
            }
            await DatabaseHelper_1.DatabaseHelper.Instance.SaveItemData(player.ItemManager.ItemData);
        }
        utils_1.Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} catch=${catchTime} dv=${pet.dvHp}/${pet.dvAtk}/${pet.dvDef}/${pet.dvSpAtk}/${pet.dvSpDef}/${pet.dvSpeed}`);
        await player.SendPacket(new PacketUsePetItemOutOfFight(encodeUsePetItemOutOfFight(pet)));
    }
};
exports.UsePetItemOutOfFightHandler = UsePetItemOutOfFightHandler;
exports.UsePetItemOutOfFightHandler = UsePetItemOutOfFightHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.USE_PET_ITEM_OUT_OF_FIGHT, decorators_1.InjectType.NONE)
], UsePetItemOutOfFightHandler);

async function useRecoveryMedicine(player, catchTime, itemId) {
    const fail = (code) => player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.USE_PET_ITEM_OUT_OF_FIGHT).setResult(code));
    const recovery = player.BattleManager.BeginOutOfBattleRecovery();
    if (!recovery) {
        await fail(MISSING);
        return;
    }
    const pets = player.PetManager.PetData, items = player.ItemManager.ItemData;
    let releaseItems, releasePets;
    let committed = false;
    try {
        releaseItems = await items.AcquireReward();
        releasePets = await pets.AcquireMutation();
        if (!recovery.isCurrent() || pets.HasPendingGrant()) {
            await fail(MISSING);
            return;
        }
        const item = GameConfig_1.GameConfig.GetItemById(itemId);
        const pet = pets.GetPetByCatchTime(catchTime);
        const stock = items.ItemList.find(entry => entry.itemId === itemId);
        const isPP = Number(item?.ItemType) === 2;
        const amount = Number(isPP ? item?.PP : item?.HP);
        if (!pet?.isInBag || Number(pet.course) > 0 || !Number.isSafeInteger(amount) || amount <= 0 ||
            Number(item?.ItemType) !== (isPP ? 2 : 1)) {
            await fail(MISSING);
            return;
        }
        if (!stock || !Number.isSafeInteger(stock.count) || stock.count < 1) {
            await fail(NO_ITEM);
            return;
        }
        const candidate = { ...pet };
        let changed = false;
        if (isPP) {
            candidate.skillPP = (0, PetPP_1.ReconcilePetPP)(pet);
            for (const id of Object.keys(candidate.skillPP).map(Number)) {
                const before = candidate.skillPP[id];
                candidate.skillPP[id] = Math.min((0, PetPP_1.GetSkillMaxPP)(id), before + amount);
                changed ||= candidate.skillPP[id] > before;
            }
        }
        else {
            candidate.hp = Math.min(pet.maxHp, pet.hp + amount);
            changed = candidate.hp > pet.hp;
        }
        if (!changed) {
            await fail(MISSING);
            return;
        }
        const inventory = items.ItemList.map(entry => ({ ...entry }));
        const consumed = inventory.find(entry => entry.itemId === itemId);
        consumed.count--;
        const nextItems = inventory.filter(entry => entry.itemId !== itemId || entry.count > 0);
        await pets.CommitPetUpdate(pet, candidate, staged => DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            const petList = staged.ToRow().pet_list, itemList = JSON.stringify(nextItems);
            await driver.beginTransaction();
            try {
                const savedItems = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [itemList, player.Uid]);
                const savedPets = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [petList, player.Uid]);
                if (savedItems.affectedRows !== 1 || savedPets.affectedRows !== 1)
                    throw new Error('Recovery item storage row missing');
                const [actualPet] = await driver.query('SELECT pet_list FROM player_pets WHERE owner_id = ?', [player.Uid]);
                const [actualItems] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
                if (actualPet?.pet_list !== petList || actualItems?.item_list !== itemList)
                    throw new Error('Recovery item readback mismatch');
                await driver.commit();
                committed = true;
                items.ItemList = nextItems;
            }
            catch (error) {
                if (!committed)
                    await driver.rollback();
                throw error;
            }
        }));
        await player.SendPacket(new PacketUsePetItemOutOfFight(encodeUsePetItemOutOfFight(pet)));
    }
    catch (error) {
        utils_1.Logger.Error('[UsePetItemOutOfFight] Recovery item failed', error);
        if (!committed)
            await fail(MISSING);
    }
    finally {
        releasePets?.();
        releaseItems?.();
        recovery.release();
    }
}
