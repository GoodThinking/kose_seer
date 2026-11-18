"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetBossMonster = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetBossMonsterRspProto_1 = require("../../../../../shared/proto/packets/rsp/system/GetBossMonsterRspProto");
/**
 * GET_BOSS_MONSTER 响应包
 * CMD 8004
 *
 * 用于服务器主动推送精灵给玩家
 */
class PacketGetBossMonster extends BaseProto_1.BaseProto {
    _data;
    constructor(petID, captureTm, bonusID = 0, items = []) {
        super(CommandID_1.CommandID.GET_BOSS_MONSTER);
        const proto = new GetBossMonsterRspProto_1.GetBossMonsterRspProto();
        proto.bonusID = bonusID;
        proto.petID = petID;
        proto.captureTm = captureTm;
        proto.items = items;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetBossMonster = PacketGetBossMonster;
//# sourceMappingURL=PacketGetBossMonster.js.map