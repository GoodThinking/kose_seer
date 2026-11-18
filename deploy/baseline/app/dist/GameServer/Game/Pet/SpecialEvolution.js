"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResolveEvolution = ResolveEvolution;
exports.HandleEvolution = HandleEvolution;
/// <reference path="./AcquisitionRuntime.d.ts" />
const ConfigLoader_1 = require("../../../shared/config/ConfigLoader");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const SptSystem_1 = require("./SptSystem");
const PetPP_1 = require("./PetPP");
const PacketEmpty_1 = require("../../Server/Packet/Send/PacketEmpty");
const PacketPetEvolution_1 = require("../../Server/Packet/Send/Pet/PacketPetEvolution");
const CommandID_1 = require("../../../shared/protocol/CommandID");
const EventTypes_1 = require("../Event/EventTypes");
const utils_1 = require("../../../shared/utils");
/** Branch order and material costs come from the deployed client's CondEvolves XML. */
function ResolveEvolution(petId, index) {
    if (!Number.isInteger(index) || index < 1)
        return;
    const pet = GameConfig_1.GameConfig.GetPetById(petId);
    if (!pet)
        return;
    const flag = Number(pet.EvolvFlag || 0);
    if (flag) {
        const rules = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/special-evolutions.json');
        const branch = rules?.branches[flag]?.[index - 1];
        if (branch && GameConfig_1.GameConfig.GetPetById(branch.petId))
            return branch;
        return;
    }
    const target = SptSystem_1.SptSystem.GetEvolvesTo(petId);
    if (index === 1 && target && GameConfig_1.GameConfig.GetPetById(target))
        return { petId: target, itemId: 0, count: 0 };
}
/** Called only by PetManager; keep its existing notification and attribute calculation methods. */
async function HandleEvolution(manager, catchTime, index) {
    const player = manager.Player;
    const pets = manager.PetData;
    const release = await pets.AcquireMutation();
    let releaseItems;
    let committed = false;
    const fail = (code) => player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_EVOLVTION).setResult(code));
    try {
        const pet = pets.GetPetByCatchTime(catchTime);
        const branch = pet && ResolveEvolution(pet.petId, index);
        if (!pet || !branch || pet.level < SptSystem_1.SptSystem.GetEvolvingLevel(pet.petId)) {
            await fail(5001);
            return;
        }
        const inventory = player.ItemManager.ItemData;
        if (branch.count) {
            releaseItems = await inventory.AcquireReward();
            if (inventory.GetItemCount(branch.itemId) < branch.count) {
                await fail(5001);
                return;
            }
        }
        const oldPetId = pet.petId;
        const candidate = JSON.parse(JSON.stringify(pet));
        candidate.catchTime = player.ClientProtocol === 'xin-20261013' ? pet.catchTime : Math.floor(Date.now() / 1000);
        if (candidate.catchTime !== pet.catchTime && pets.GetPetByCatchTime(candidate.catchTime)) {
            await fail(5001);
            return;
        }
        candidate.petId = branch.petId;
        manager.recalculateStats(candidate);
        const newSkills = SptSystem_1.SptSystem.GetNewMovesOnLevelUp(candidate.petId, candidate.level).map(move => move.id);
        const activeSkills = newSkills.slice(0, Math.max(0, 4 - candidate.skillArray.length));
        candidate.skillArray.push(...activeSkills);
        candidate.skillPP = (0, PetPP_1.ReconcilePetPP)(candidate);
        if (branch.count) {
            let updatedItems = [];
            await pets.CommitPetUpdate(pet, candidate, async (staged) => {
                await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
                    await driver.beginTransaction();
                    try {
                        const [row] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
                        if (!row)
                            throw new Error('Evolution inventory missing');
                        const items = JSON.parse(row.item_list);
                        const item = items.find(entry => entry.itemId === branch.itemId);
                        if (!item || item.count < branch.count)
                            throw new Error('Evolution material changed');
                        item.count -= branch.count;
                        updatedItems = items;
                        const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), player.Uid]);
                        const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [staged.ToRow().pet_list, player.Uid]);
                        if (itemWrite.affectedRows !== 1 || petWrite.affectedRows !== 1)
                            throw new Error('Evolution was not saved');
                        await driver.commit();
                    }
                    catch (error) {
                        await driver.rollback();
                        throw error;
                    }
                });
            }, () => { inventory.ItemList = updatedItems; });
        }
        else
            await pets.CommitPetUpdate(pet, candidate);
        committed = true;
        await player.SendPacket(new PacketPetEvolution_1.PacketPetEvolution(0));
        await manager.sendNoteUpdateProp([pet], 0);
        if (newSkills.length)
            await manager.sendNoteUpdateSkill(pet, newSkills, activeSkills, newSkills.slice(activeSkills.length));
        const event = { type: EventTypes_1.PetEventType.PET_EVOLUTION, timestamp: Date.now(), playerId: player.Uid,
            oldPetId, newPetId: branch.petId, level: pet.level, catchTime: pet.catchTime };
        await player.EventBus.Emit(event);
    }
    catch (error) {
        utils_1.Logger.Error(committed ? '[SpecialEvolution] Evolution committed; notification failed' : '[SpecialEvolution] Evolution rejected', error);
        if (!committed)
            await fail(5000);
    }
    finally {
        releaseItems?.();
        release();
    }
}
//# sourceMappingURL=SpecialEvolution.js.map