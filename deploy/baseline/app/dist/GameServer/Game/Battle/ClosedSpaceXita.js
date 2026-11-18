"use strict";
// Local rule: one successful capture in room 306 since this feature was enabled.
// Room 307 remains independent; historical collection entries are not capture receipts.
const { DatabaseManager } = require('../../../DataBase/DatabaseManager');
const { CommandID } = require('../../../shared/protocol/CommandID');
const { PacketEmpty } = require('../../Server/Packet/Send/PacketEmpty');
const { createDefaultPetInfo } = require('../../../shared/models/PetModel');
const { PetCalculator } = require('../Pet/PetCalculator');
const { SptSystem } = require('../Pet/SptSystem');
const { ReconcilePetPP } = require('../Pet/PetPP');
const { PetEventType, PetObtainSource } = require('../Event/EventTypes');
const { Logger } = require('../../../shared/utils');
const KEY = 'closed-space:306:xita';
const PET = 59;
const LEVEL = 18;

async function Count(player) {
    return DatabaseManager.Instance.WithConnection(async driver => {
        const rows = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [player.Uid, KEY, 0]);
        return rows.length ? 1 : 0;
    });
}

async function Grant306(player, battle, catchTime) {
    const pets = player.PetManager.PetData;
    const release = await pets.AcquireMutation();
    let releaseIdentity;
    let committed = false;
    let pet;
    const valid = () => player.Data.mapID === 306 && player.BattleManager.GetCurrentBattle() === battle && battle.enemy.id === PET && battle.enemy.level === LEVEL && !battle.isOver && player.Session.Player === player && !player.Session.Socket.destroyed;
    try {
        await pets.WaitForStagedSave();
        if (!valid() || pets.HasPendingGrant() || !Number.isInteger(catchTime) || catchTime <= 0 || catchTime > 0xffffffff || pets.GetPetByCatchTime(catchTime)) return false;
        releaseIdentity = pets.ReserveIdentity(catchTime);
        pet = createDefaultPetInfo(player.Uid, PET);
        pet.level = pet.obtainLevel = LEVEL;
        pet.catchTime = catchTime;
        const bagSpace = 6 - pets.GetPetsInBag().length;
        pet.isInBag = bagSpace > 0;
        pet.isDefault = bagSpace === 6;
        PetCalculator.UpdatePetStats(pet);
        pet.skillArray = SptSystem.GetDefaultSkills(PET, LEVEL).slice(0, 4).map(skill => skill.id);
        pet.skillPP = ReconcilePetPP(pet);
        const staged = [...pets.PetList, pet];
        const maxLevel = staged.reduce((max, entry) => Math.max(max, entry.level), 0);
        await DatabaseManager.Instance.WithConnection(async driver => {
            await driver.beginTransaction();
            try {
                const [claim] = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [player.Uid, KEY, 0]);
                const [stored] = await driver.query('SELECT pet_list FROM player_pets WHERE owner_id = ?', [player.Uid]);
                if (claim || !stored || !valid() || JSON.parse(stored.pet_list).some(entry => entry.catchTime === catchTime)) throw new Error('Xita capture unavailable');
                const playerWrite = await driver.execute('UPDATE players SET pet_all_num = ?, pet_max_lev = ? WHERE user_id = ?', [staged.length, maxLevel, player.Uid]);
                const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [JSON.stringify(staged), player.Uid]);
                const claimWrite = await driver.execute('INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)', [player.Uid, KEY, 0, Math.floor(Date.now() / 1000), 1]);
                if (petWrite.affectedRows !== 1 || playerWrite.affectedRows !== 1 || claimWrite.affectedRows !== 1 || !valid()) throw new Error('Xita capture could not commit');
                await driver.commit();
                committed = true;
                pets.PetList = staged;
                player.Data.petAllNum = staged.length;
                player.Data.petMaxLev = maxLevel;
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        });
    } catch (error) {
        if (!committed) {
            Logger.Error('[ClosedSpaceXita] Capture rejected', error);
            return false;
        }
        Logger.Error('[ClosedSpaceXita] Capture committed; post-commit error', error);
    } finally {
        releaseIdentity?.();
        release();
    }
    try {
        await player.EventBus.Emit({ type: PetEventType.PET_OBTAINED, timestamp: Date.now(), playerId: player.Uid,
            petId: PET, level: LEVEL, catchTime, source: PetObtainSource.CATCH });
    } catch (error) { Logger.Error('[ClosedSpaceXita] Capture committed; event failed', error); }
    return true;
}

function Install(BattleManager) {
    const { BattleRewardService } = require('./services/BattleRewardService');
    const originalChallenge = BattleManager.prototype.ChallengeBoss;
    const originalCapture = BattleRewardService.prototype.ProcessCatch;
    BattleManager.prototype.ChallengeBoss = async function(mapId, param2) {
        if ((mapId !== 306 && mapId !== 307) || param2 !== 0) return originalChallenge.call(this, mapId, param2);
        const reject = (code = 5001) => this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(code));
        let acknowledged = false;
        try {
            if (this.Player.Data.mapID !== mapId || (mapId === 306 && await Count(this.Player))) return reject();
            if (this._currentBattle) this.CleanupBattle();
            const epoch = this._battleEpoch;
            const battle = await this._initService.CreatePVEBattle(PET, LEVEL);
            if (!battle) return reject(this.Player.PetManager.GetPetsInBag().some(pet => pet.hp > 0) ? 5001 : 10017);
            if (this._battleEpoch !== epoch || this.Player.Data.mapID !== mapId || (mapId === 306 && await Count(this.Player))) return reject();
            if (this._battleEpoch !== epoch || this.Player.Data.mapID !== mapId) return reject();
            if (mapId === 306) battle.closedSpaceXita306 = true;
            this.InitializeBattle(battle);
            this._currentBattleMapId = mapId;
            acknowledged = true;
            await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS));
            await this.SendReadyToFight(battle, '西塔');
        } catch (error) {
            Logger.Error('[ClosedSpaceXita] Challenge failed', error);
            if (!acknowledged) await reject();
        }
    };
    BattleRewardService.prototype.ProcessCatch = function(userId, battle, catchTime, mapId, slot) {
        if (!battle.closedSpaceXita306) return originalCapture.call(this, userId, battle, catchTime, mapId, slot);
        return Grant306(this._player, battle, catchTime);
    };
}
module.exports = { Count, Install };
