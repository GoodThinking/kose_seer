"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketFightOver = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const FightOverRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/FightOverRspProto");
/**
 * 战斗结束包
 * CMD 2506
 */
class PacketFightOver extends BaseProto_1.BaseProto {
    _data;
    constructor(reason, winnerId, twoTimes = 0, threeTimes = 0, autoFightTimes = 0, energyTimes = 0, learnTimes = 0) {
        super(CommandID_1.CommandID.FIGHT_OVER);
        const proto = new FightOverRspProto_1.FightOverRspProto();
        proto.setReason(reason);
        proto.setWinnerId(winnerId);
        proto.setTwoTimes(twoTimes);
        proto.setThreeTimes(threeTimes);
        proto.setAutoFightTimes(autoFightTimes);
        proto.setEnergyTimes(energyTimes);
        proto.setLearnTimes(learnTimes);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketFightOver = PacketFightOver;
//# sourceMappingURL=PacketFightOver.js.map