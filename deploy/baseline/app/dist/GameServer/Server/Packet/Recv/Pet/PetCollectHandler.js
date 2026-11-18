"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetCollectHandler = exports.IsCollectHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const DatabaseManager_1 = require("../../../../../DataBase/DatabaseManager");
const utils_1 = require("../../../../../shared/utils");
const CollectReward_1 = require("../../../../Game/Pet/CollectReward");
const TABLE = `CREATE TABLE IF NOT EXISTS player_collect_claims (
  owner_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  PRIMARY KEY (owner_id, group_id)
)`;
function u32(value) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value >>> 0, 0);
    return buffer;
}
async function claimed(ownerId, groupId) {
    return DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
        await driver.execute(TABLE);
        const rows = await driver.query('SELECT 1 AS n FROM player_collect_claims WHERE owner_id = ? AND group_id = ?', [ownerId, groupId]);
        return rows.length > 0;
    });
}
class PacketIsCollect extends BaseProto_1.BaseProto {
    body;
    constructor(body) {
        super(CommandID_1.CommandID.IS_COLLECT);
        this.body = body;
    }
    serialize() { return this.body; }
}
class PacketPetCollect extends BaseProto_1.BaseProto {
    body;
    constructor(body) {
        super(CommandID_1.CommandID.PET_COLLECT);
        this.body = body;
    }
    serialize() { return this.body; }
}
/** [CMD: 2313] group id in, group id plus claimed flag out. */
let IsCollectHandler = class IsCollectHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player || body.length < 4)
            return;
        const groupId = body.readUInt32BE(0);
        if (groupId === 900003)
            return require("../../../../Game/Map/BeidouSeals").HandleStatus(player);
        const flag = CollectReward_1.COLLECT_GROUPS[groupId] && await claimed(player.Uid, groupId) ? 1 : 0;
        if (groupId === 5) {
            const owned = new Set(player.PetManager.PetData.PetList.map(pet => pet.petId));
            let missing = 0;
            for (const [rewardId, family] of Object.entries(CollectReward_1.STARTER_FAMILIES)) {
                if (!family.some(petId => owned.has(petId))) {
                    missing = Number(rewardId);
                    break;
                }
            }
            await player.SendPacket(new PacketIsCollect(Buffer.concat([u32(groupId), u32(flag), u32(missing)])));
            return;
        }
        await player.SendPacket(new PacketIsCollect(Buffer.concat([u32(groupId), u32(flag)])));
    }
};
exports.IsCollectHandler = IsCollectHandler;
exports.IsCollectHandler = IsCollectHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.IS_COLLECT, decorators_1.InjectType.NONE)
], IsCollectHandler);
/** [CMD: 2311] group id plus reward pet id. Grants once when the collection is complete. */
let PetCollectHandler = class PetCollectHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const fail = () => player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_COLLECT).setResult(5001));
        if (body.length >= 4 && body.readUInt32BE(0) === 900002) return require("../../../../Game/Pet/Countermarks").Handle(player, body);
        if (body.length >= 8 && body.readUInt32BE(0) === 900003) return require("../../../../Game/Map/BeidouSeals").HandleAction(player, body.readUInt32BE(4));
        if (body.length < 8) {
            await fail();
            return;
        }
        const groupId = body.readUInt32BE(0);
        const rewardId = body.readUInt32BE(4);
        if (!(0, CollectReward_1.canClaimCollect)(groupId, rewardId, player.PetManager.PetData.PetList, player.Data.monKingWin || 0)) {
            await fail();
            return;
        }
        const inserted = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            await driver.execute(TABLE);
            const rows = await driver.query('SELECT 1 AS n FROM player_collect_claims WHERE owner_id = ? AND group_id = ?', [player.Uid, groupId]);
            if (rows.length > 0)
                return false;
            await driver.execute('INSERT INTO player_collect_claims (owner_id, group_id) VALUES (?, ?)', [player.Uid, groupId]);
            return true;
        });
        if (!inserted) {
            await fail();
            return;
        }
        const catchTime = Math.floor(Date.now() / 1000);
        const granted = await player.PetManager.GivePet(rewardId, 1, catchTime);
        if (!granted) {
            await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.execute('DELETE FROM player_collect_claims WHERE owner_id = ? AND group_id = ?', [player.Uid, groupId]));
            await fail();
            return;
        }
        utils_1.Logger.Info(`[PetCollect] uid=${player.Uid} group=${groupId} pet=${rewardId} catch=${catchTime}`);
        await player.SendPacket(new PacketPetCollect(Buffer.concat([u32(rewardId), u32(catchTime)])));
    }
};
exports.PetCollectHandler = PetCollectHandler;
exports.PetCollectHandler = PetCollectHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_COLLECT, decorators_1.InjectType.NONE)
], PetCollectHandler);
//# sourceMappingURL=PetCollectHandler.js.map