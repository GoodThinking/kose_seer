'use strict';

const { createDefaultPetInfo } = require('../../../shared/models/PetModel');
const { GameConfig } = require('../../../shared/config/game/GameConfig');
const { PetCalculator } = require('../Pet/PetCalculator');
const { SptSystem } = require('../Pet/SptSystem');
const { ReconcilePetPP } = require('../Pet/PetPP');
const { PetEventType, PetObtainSource } = require('../Event/EventTypes');

async function capture(store, player, encounterId, cycleId, catchTime, retainMechanism, validate) {
    if (!Number.isInteger(catchTime) || catchTime <= 0 || catchTime > 0xffffffff) throw new RangeError('Invalid catch identity');
    const pets = player.PetManager.PetData;
    const release = await pets.AcquireMutation();
    let releaseIdentity;
    let granted;
    let staged;
    let maxLevel;
    try {
        const result = await store.transaction(player.Uid, async (driver, account) => {
            if (!validate()) throw new Error('Private battle context changed');
            const previous = await driver.query('SELECT pet_id, catch_time FROM universe_captures WHERE owner_id = ? AND encounter_id = ? AND cycle_id = ?', [player.Uid, encounterId, cycleId]);
            if (previous.length) return { petId: Number(previous[0].pet_id), catchTime: Number(previous[0].catch_time), replay: true };
            if (Number(account.pending_id) !== encounterId || Number(account.pending_cycle) !== cycleId) throw new Error('Pending encounter mismatch');
            const petId = Number(account.pending_pet), level = Number(account.pending_level);
            const dv = Number(account.pending_dv), nature = Number(account.pending_nature);
            if (!GameConfig.GetPetById(petId) || !Number.isInteger(level) || level < 1 || level > 100 || !Number.isInteger(dv) || dv < 0 || dv > 31 || !Number.isInteger(nature) || nature < 0 || nature > 24) throw new Error('Invalid pending individual');
            releaseIdentity = pets.ReserveIdentity(catchTime);
            const pet = createDefaultPetInfo(player.Uid, petId);
            pet.level = pet.obtainLevel = level;
            pet.catchTime = catchTime;
            pet.dvHp = pet.dvAtk = pet.dvDef = pet.dvSpAtk = pet.dvSpDef = pet.dvSpeed = dv;
            pet.nature = nature;
            const bagSpace = 6 - pets.GetPetsInBag().length;
            pet.isDefault = bagSpace === 6;
            pet.isInBag = bagSpace > 0;
            PetCalculator.UpdatePetStats(pet);
            pet.skillArray = SptSystem.GetDefaultSkills(petId, level).slice(0, 4).map(skill => skill.id);
            pet.skillPP = ReconcilePetPP(pet);
            staged = [...pets.PetList, pet];
            maxLevel = staged.reduce((max, entry) => Math.max(max, entry.level), 0);
            const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [JSON.stringify(staged), player.Uid]);
            const playerWrite = await driver.execute('UPDATE players SET pet_all_num = ?, pet_max_lev = ? WHERE user_id = ?', [staged.length, maxLevel, player.Uid]);
            const reset = retainMechanism ? '' : ', mechanism_step = 0, mechanism_bits = 0';
            const progressWrite = await driver.execute(`UPDATE universe_progress SET failures = 0, cycle_id = cycle_id + 1${reset} WHERE owner_id = ? AND encounter_id = ? AND cycle_id = ?`, [player.Uid, encounterId, cycleId]);
            if (petWrite.affectedRows !== 1 || playerWrite.affectedRows !== 1 || progressWrite.affectedRows !== 1) throw new Error('Private capture persistence failed');
            await driver.execute('INSERT INTO universe_captures (owner_id, encounter_id, cycle_id, pet_id, catch_time) VALUES (?, ?, ?, ?, ?)', [player.Uid, encounterId, cycleId, petId, catchTime]);
            await driver.execute('UPDATE universe_accounts SET pending_id = 0, pending_cycle = 0, pending_pet = 0, pending_level = 0, pending_dv = 0, pending_nature = 0 WHERE owner_id = ?', [player.Uid]);
            if (!validate()) throw new Error('Private battle context changed');
            granted = pet;
            return { petId, catchTime, replay: false };
        });
        if (granted) {
            pets.PetList = staged;
            player.Data.petAllNum = staged.length;
            player.Data.petMaxLev = maxLevel;
            try {
                await player.EventBus.Emit({ type: PetEventType.PET_OBTAINED, timestamp: Date.now(), playerId: player.Uid, petId: granted.petId, level: granted.level, catchTime: granted.catchTime, source: PetObtainSource.CATCH });
            } catch (error) {
                require('../../../shared/utils/Logger').Logger.Error('[Universe] Committed capture notification failed', error);
            }
        }
        return result;
    } finally {
        releaseIdentity?.();
        release();
    }
}

module.exports = { capture };
