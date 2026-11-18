"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EssenceHatching = exports.EssenceIncubatorBusy = exports.InvalidEssenceHatch = void 0;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const ConfigLoader_1 = require("../../../shared/config/ConfigLoader");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const PetModel_1 = require("../../../shared/models/PetModel");
const Logger_1 = require("../../../shared/utils/Logger");
const EventTypes_1 = require("../Event/EventTypes");
const PetCalculator_1 = require("./PetCalculator");
const PetPP_1 = require("./PetPP");
const SptSystem_1 = require("./SptSystem");
class InvalidEssenceHatch extends Error {
}
exports.InvalidEssenceHatch = InvalidEssenceHatch;
class EssenceIncubatorBusy extends Error {
}
exports.EssenceIncubatorBusy = EssenceIncubatorBusy;
class EssenceHatching {
    player;
    constructor(player) {
        this.player = player;
    }
    CheckNoNo() {
        if (!this.player.Data.hasNono)
            throw new InvalidEssenceHatch('NoNo required');
    }
    async Start(itemId) {
        this.CheckNoNo();
        const item = GameConfig_1.GameConfig.GetItemById(itemId);
        const petId = Number(item?.BreedMonID);
        const level = Number(item?.BreedMonLv);
        if (!Number.isInteger(itemId) || !Number.isInteger(petId) || petId <= 0 ||
            !GameConfig_1.GameConfig.GetPetById(petId) || !Number.isInteger(level) || level < 1 || level > 100 ||
            !item?.BreedTime)
            throw new InvalidEssenceHatch('Item has no supported essence conversion');
        const settings = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/essence-hatching.json');
        const duration = settings?.durationSeconds;
        if (!Number.isSafeInteger(duration) || !duration || duration <= 0 || duration > 0xffffffff) {
            throw new Error('Invalid essence incubation duration');
        }
        const inventory = this.player.ItemManager.ItemData;
        const release = await inventory.AcquireReward();
        try {
            this.CheckNoNo();
            return await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
                await driver.beginTransaction();
                let committed = false;
                try {
                    const [existing] = await driver.query('SELECT item_id, pet_id, pet_level, ready_at FROM player_essence_hatches WHERE owner_id = ?', [this.player.Uid]);
                    if (existing)
                        throw new EssenceIncubatorBusy('An essence is already incubating');
                    const items = inventory.ItemList.map(entry => ({ ...entry }));
                    const index = items.findIndex(entry => entry.itemId === itemId);
                    if (index < 0 || !Number.isSafeInteger(items[index].count) || items[index].count < 1) {
                        throw new InvalidEssenceHatch('Essence not owned');
                    }
                    if (items[index].count === 1)
                        items.splice(index, 1);
                    else
                        items[index].count--;
                    const readyAt = Math.floor(Date.now() / 1000) + duration;
                    const job = await driver.execute('INSERT INTO player_essence_hatches (owner_id, item_id, pet_id, pet_level, ready_at) VALUES (?, ?, ?, ?, ?)', [this.player.Uid, itemId, petId, level, readyAt]);
                    const stock = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items), this.player.Uid]);
                    if (job.affectedRows !== 1 || stock.affectedRows !== 1)
                        throw new Error('Incubation start was not saved');
                    await driver.commit();
                    committed = true;
                    inventory.ItemList = items;
                    return duration;
                }
                catch (error) {
                    if (!committed)
                        await driver.rollback();
                    throw error;
                }
            });
        }
        finally {
            release();
        }
    }
    async Get() {
        this.CheckNoNo();
        const current = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            const [row] = await driver.query('SELECT item_id, pet_id, pet_level, ready_at FROM player_essence_hatches WHERE owner_id = ?', [this.player.Uid]);
            return row;
        });
        if (!current)
            return { active: false, remaining: 0, petId: 0, catchTime: 0 };
        const remaining = Math.max(0, Number(current.ready_at) - Math.floor(Date.now() / 1000));
        if (remaining)
            return { active: true, remaining, petId: current.pet_id, catchTime: 0 };
        const pets = this.player.PetManager.PetData;
        const release = await pets.AcquireMutation();
        let releaseIdentity;
        let granted;
        try {
            await pets.WaitForStagedSave();
            const result = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
                await driver.beginTransaction();
                let committed = false;
                try {
                    const [job] = await driver.query('SELECT item_id, pet_id, pet_level, ready_at FROM player_essence_hatches WHERE owner_id = ?', [this.player.Uid]);
                    if (!job) {
                        await driver.commit();
                        committed = true;
                        return { active: false, remaining: 0, petId: 0, catchTime: 0 };
                    }
                    const now = Math.floor(Date.now() / 1000);
                    const left = Math.max(0, Number(job.ready_at) - now);
                    if (left) {
                        await driver.commit();
                        committed = true;
                        return { active: true, remaining: left, petId: job.pet_id, catchTime: 0 };
                    }
                    if (!GameConfig_1.GameConfig.GetPetById(job.pet_id) || !Number.isInteger(job.pet_level) || job.pet_level < 1 || job.pet_level > 100) {
                        throw new Error('Invalid saved incubation target');
                    }
                    const staged = pets.PetList.slice();
                    if (staged.some(pet => pet.catchTime === now))
                        throw new Error('Pet identity already in use');
                    releaseIdentity = pets.ReserveIdentity(now);
                    const pet = (0, PetModel_1.createDefaultPetInfo)(this.player.Uid, job.pet_id);
                    pet.level = pet.obtainLevel = job.pet_level;
                    pet.catchTime = now;
                    // Native 2316 callback moves the committed storage pet into the bag if space permits.
                    pet.isInBag = false;
                    pet.isDefault = false;
                    PetCalculator_1.PetCalculator.UpdatePetStats(pet);
                    pet.skillArray = SptSystem_1.SptSystem.GetDefaultSkills(job.pet_id, job.pet_level).slice(0, 4).map(skill => skill.id);
                    pet.skillPP = (0, PetPP_1.ReconcilePetPP)(pet);
                    staged.push(pet);
                    const maxLevel = staged.reduce((max, entry) => Math.max(max, entry.level), 0);
                    const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [JSON.stringify(staged), this.player.Uid]);
                    const playerWrite = await driver.execute('UPDATE players SET pet_all_num = ?, pet_max_lev = ? WHERE user_id = ?', [staged.length, maxLevel, this.player.Uid]);
                    const jobWrite = await driver.execute('DELETE FROM player_essence_hatches WHERE owner_id = ?', [this.player.Uid]);
                    if (petWrite.affectedRows !== 1 || playerWrite.affectedRows !== 1 || jobWrite.affectedRows !== 1)
                        throw new Error('Hatched pet was not saved');
                    await driver.commit();
                    committed = true;
                    pets.PetList = staged;
                    this.player.Data.petAllNum = staged.length;
                    this.player.Data.petMaxLev = maxLevel;
                    granted = pet;
                    return { active: true, remaining: 0, petId: pet.petId, catchTime: pet.catchTime };
                }
                catch (error) {
                    if (!committed)
                        await driver.rollback();
                    throw error;
                }
            });
            if (granted) {
                try {
                    const event = { type: EventTypes_1.PetEventType.PET_OBTAINED, timestamp: Date.now(), playerId: this.player.Uid,
                        petId: granted.petId, level: granted.level, catchTime: granted.catchTime, source: EventTypes_1.PetObtainSource.GIVE };
                    await this.player.EventBus.Emit(event);
                }
                catch (error) {
                    Logger_1.Logger.Error('[EssenceHatching] Pet committed; acquisition notification failed', error);
                }
            }
            return result;
        }
        finally {
            releaseIdentity?.();
            release();
        }
    }
}
exports.EssenceHatching = EssenceHatching;
//# sourceMappingURL=EssenceHatching.js.map