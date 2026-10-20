"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangePet = ExchangePet;
exports.HandleExchange = HandleExchange;
/// <reference path="./AcquisitionRuntime.d.ts" />
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const ConfigLoader_1 = require("../../../shared/config/ConfigLoader");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const PetModel_1 = require("../../../shared/models/PetModel");
const BaseProto_1 = require("../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../shared/protocol/CommandID");
const Logger_1 = require("../../../shared/utils/Logger");
const EventTypes_1 = require("../Event/EventTypes");
const PetCalculator_1 = require("./PetCalculator");
const PetPP_1 = require("./PetPP");
const SptSystem_1 = require("./SptSystem");
class ExchangeRejected extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
class PacketExchange extends BaseProto_1.BaseProto {
    petId;
    catchTime;
    coins;
    error;
    constructor(petId, catchTime, coins, error) {
        super(CommandID_1.CommandID.PET_COLLECT);
        this.petId = petId;
        this.catchTime = catchTime;
        this.coins = coins;
        this.error = error;
    }
    serialize() {
        const body = Buffer.alloc(16);
        [this.petId, this.catchTime, this.coins, this.error].forEach((n, i) => body.writeUInt32BE(n, i * 4));
        return body;
    }
}
/** A repeatable private-server route for retired events, not an official wild encounter. */
async function ExchangePet(player, petId) {
    const catalog = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/pet-acquisition.json')?.exchange;
    if (!catalog || player.Data.mapID !== catalog.mapId || !catalog.petIds.includes(petId) || !GameConfig_1.GameConfig.GetPetById(petId)) {
        throw new ExchangeRejected(5001, 'Unavailable exchange');
    }
    const cost = catalog.coins ?? 0;
    if (!Number.isSafeInteger(cost) || cost < 0)
        throw new Error('Invalid exchange cost');
    const pets = player.PetManager.PetData;
    const release = await pets.AcquireMutation();
    let releaseIdentity;
    let wallet;
    try {
        await pets.WaitForStagedSave();
        await player.Data.WaitForExpAllocation();
        await player.Data.WaitForCurrencyOperations();
        if (player.Session.Socket.destroyed || player.Session.Player !== player || player.Data.mapID !== catalog.mapId) {
            throw new ExchangeRejected(5001, 'Exchange session changed');
        }
        wallet = player.Data.BeginBalanceReward();
        const gate = wallet;
        let identity = Math.floor(Date.now() / 1000);
        while (pets.GetPetByCatchTime(identity))
            identity++;
        releaseIdentity = pets.ReserveIdentity(identity);
        const pet = (0, PetModel_1.createDefaultPetInfo)(player.Uid, petId);
        pet.level = pet.obtainLevel = 1;
        pet.catchTime = identity;
        pet.isInBag = false;
        pet.isDefault = false;
        PetCalculator_1.PetCalculator.UpdatePetStats(pet);
        pet.skillArray = SptSystem_1.SptSystem.GetDefaultSkills(petId, 1).slice(0, 4).map(skill => skill.id);
        pet.skillPP = (0, PetPP_1.ReconcilePetPP)(pet);
        const staged = [...pets.PetList, pet];
        const maxLevel = staged.reduce((n, entry) => Math.max(n, entry.level), 0);
        await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            await driver.beginTransaction();
            try {
                const nowSec = Math.floor(Date.now() / 1000);
                const periodStart = Math.floor((nowSec + 8 * 3600) / 86400) * 86400 - 8 * 3600;
                const [claimed] = await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [player.Uid, 'signin:pet', periodStart]);
                if (claimed) {
                    throw new ExchangeRejected(5002, '今日已完成绝版精灵签到，请明天再来！');
                }
                const [stored] = await driver.query('SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?', [player.Uid]);
                if (!stored)
                    throw new Error('Exchange player missing');
                const keys = ['coins', 'gold', 'allocatableExp'];
                const previous = [stored.coins, stored.gold, stored.allocatable_exp];
                const dirty = player.Data.GetDirtyFields();
                const balance = keys.map((key, i) => {
                    const cached = player.Data[key];
                    if (!dirty.includes(key) && cached !== previous[i])
                        throw new Error('Exchange wallet cache stale');
                    const value = dirty.includes(key) ? cached : previous[i];
                    if (!Number.isSafeInteger(value) || value < 0 || value > 0x7fffffff)
                        throw new Error('Invalid exchange wallet');
                    return value;
                });
                if (balance[0] < cost)
                    throw new ExchangeRejected(10016, 'Insufficient Seer coins');
                balance[0] -= cost;
                const petWrite = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [JSON.stringify(staged), player.Uid]);
                const walletWrite = await driver.execute('UPDATE players SET coins = ?, gold = ?, allocatable_exp = ?, pet_all_num = ?, pet_max_lev = ? WHERE user_id = ?', [...balance, staged.length, maxLevel, player.Uid]);
                const claimWrite = await driver.execute('INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)', [player.Uid, 'signin:pet', periodStart, nowSec, 1]);
                if (petWrite.affectedRows !== 1 || walletWrite.affectedRows !== 1 || claimWrite.affectedRows !== 1)
                    throw new Error('Exchange was not saved');
                await driver.commit();
                gate.publish(balance[0], balance[1], balance[2]);
                pets.PetList = staged;
                player.Data.petAllNum = staged.length;
                player.Data.petMaxLev = maxLevel;
            }
            catch (error) {
                await driver.rollback();
                throw error;
            }
        });
        return pet;
    }
    finally {
        releaseIdentity?.();
        wallet?.release();
        release();
    }
}
async function HandleExchange(player, petId) {
    let pet;
    try {
        pet = await ExchangePet(player, petId);
    }
    catch (error) {
        Logger_1.Logger.Error('[PermanentPetExchange] Exchange rejected', error);
        await player.SendPacket(new PacketExchange(0, 0, player.Data.coins, error instanceof ExchangeRejected ? error.code : 5000));
        return;
    }
    // A transport failure after commit must never turn the operation into a second grant or refund.
    try {
        await player.SendPacket(new PacketExchange(pet.petId, pet.catchTime, player.Data.coins, 0));
        const event = { type: EventTypes_1.PetEventType.PET_OBTAINED, timestamp: Date.now(), playerId: player.Uid,
            petId: pet.petId, level: pet.level, catchTime: pet.catchTime, source: EventTypes_1.PetObtainSource.GIVE };
        await player.EventBus.Emit(event);
    }
    catch (error) {
        Logger_1.Logger.Error('[PermanentPetExchange] Exchange committed; notification failed', error);
    }
}
//# sourceMappingURL=PermanentPetExchange.js.map