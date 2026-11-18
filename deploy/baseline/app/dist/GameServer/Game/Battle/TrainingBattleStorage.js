'use strict';
const { DatabaseManager } = require('../../../DataBase/DatabaseManager');
const { ReconcilePetPP, GetSkillMaxPP } = require('../Pet/PetPP');
const { ItemSystem } = require('../Item/ItemSystem');
const { ChampionPetRuntime: Champion } = require('./ChampionPetRuntime');

function candidate(actor, pet) {
    const stored = actor.player.PetManager.GetPetByCatchTime(pet.catchTime);
    if (!stored || stored.petId !== pet.id || !stored.isInBag) throw new Error('Training pet identity changed');
    const next = JSON.parse(JSON.stringify(stored));
    next.hp = Math.max(0, Math.min(stored.maxHp, pet.hp));
    next.skillPP = ReconcilePetPP(next);
    pet.skills.forEach((id, index) => {
        const pp = pet.skillPP[index];
        if (!Number.isInteger(pp) || pp < 0 || pp > GetSkillMaxPP(id)) throw new Error('Invalid training PP');
        if (id in next.skillPP) next.skillPP[id] = pp;
    });
    return { stored, next };
}
async function save(actor, pet = actor.pet) {
    const data = actor.player.PetManager.PetData;
    const release = await data.AcquireMutation();
    try {
        const { stored, next } = candidate(actor, pet);
        if (stored.hp === next.hp && JSON.stringify(stored.skillPP) === JSON.stringify(next.skillPP)) return;
        await data.CommitPetUpdate(stored, next);
    } finally { release(); }
}
function canUseMedicine(actor, itemId) {
    const config = ItemSystem.GetItem(itemId), pet = actor.pet;
    const item = actor.player.ItemManager.ItemData.ItemList.find(entry => entry.itemId === itemId);
    if (pet.hp <= 0 || !Number.isSafeInteger(item?.count) || item.count < 1) return false;
    if (config?.ItemType === 2 && Number.isInteger(config.PP) && config.PP > 0) {
        return pet.skills.some((id, i) => pet.skillPP[i] < GetSkillMaxPP(id));
    }
    return config?.ItemType === 1 && Number.isInteger(config.HP) && config.HP > 0 &&
        [300011, 300012, 300013, 300014, 300015].includes(itemId) && pet.hp < pet.maxHp;
}
async function medicine(actor, itemId, valid) {
    const player = actor.player, pet = actor.pet;
    const config = ItemSystem.GetItem(itemId), isPP = config?.ItemType === 2;
    const amount = isPP ? config.PP : config?.HP;
    if ((!isPP && ![300011, 300012, 300013, 300014, 300015].includes(itemId)) ||
        config?.ItemType !== (isPP ? 2 : 1) || !Number.isInteger(amount) || amount <= 0 || pet.hp <= 0) {
        throw new Error('Invalid training medicine');
    }
    const items = player.ItemManager.ItemData, pets = player.PetManager.PetData;
    const releaseItems = await items.AcquireReward();
    let releasePets;
    try {
        releasePets = await pets.AcquireMutation();
        if (!valid()) throw new Error('Training medicine expired');
        const { stored, next } = candidate(actor, pet);
        if (isPP) {
            const allowed = Champion.Skills(stored);
            if (pet.skills.some(id => !allowed.includes(id))) throw new Error('Training skill roster changed');
        }
        const hp = isPP ? pet.hp : Math.min(pet.maxHp, pet.hp + amount);
        const pp = pet.skills.map((id, i) => isPP ? Math.min(GetSkillMaxPP(id), pet.skillPP[i] + amount) : pet.skillPP[i]);
        if (hp === pet.hp && pp.every((value, i) => value === pet.skillPP[i])) throw new Error('Medicine has no effect');
        next.hp = Math.min(stored.maxHp, hp);
        pet.skills.forEach((id, i) => { if (id in next.skillPP) next.skillPP[id] = pp[i]; });
        await pets.CommitPetUpdate(stored, next, staged => DatabaseManager.Instance.WithConnection(async driver => {
            if (!valid()) throw new Error('Training medicine expired');
            let inventory = items.ItemList.map(entry => ({ ...entry }));
            const consumed = inventory.find(entry => entry.itemId === itemId);
            if (!consumed || !Number.isSafeInteger(consumed.count) || consumed.count < 1) throw new Error('Medicine stock changed');
            consumed.count--;
            inventory = inventory.filter(entry => entry.itemId !== itemId || entry.count > 0);
            const petList = staged.ToRow().pet_list, itemList = JSON.stringify(inventory);
            let committed = false;
            await driver.beginTransaction();
            try {
                const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [itemList, player.Uid]);
                const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [petList, player.Uid]);
                if (itemWrite.affectedRows !== 1 || petWrite.affectedRows !== 1) throw new Error('Training medicine row missing');
                const [savedPets] = await driver.query('SELECT pet_list FROM player_pets WHERE owner_id = ?', [player.Uid]);
                const [savedItems] = await driver.query('SELECT item_list FROM player_items WHERE owner_id = ?', [player.Uid]);
                if (savedPets?.pet_list !== petList || savedItems?.item_list !== itemList) throw new Error('Training medicine readback mismatch');
                await driver.commit();
                committed = true;
                items.ItemList = inventory;
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        }));
        // A committed item remains spent even if logout/map cancellation occurred during storage.
        pet.hp = hp;
        pet.skillPP = pp;
    } finally {
        if (releasePets) releasePets();
        releaseItems();
    }
}
module.exports = { Save: save, Medicine: medicine, CanUseMedicine: canUseMedicine };
