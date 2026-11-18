"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoNoInfo = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoNoInfoRspProto_1 = require("../../../../../shared/proto/packets/rsp/nono/NoNoInfoRspProto");
/**
 * NoNo 信息响应包
 * CMD 9003
 *
 * 基于官方服务器抓包数据
 */
class PacketNoNoInfo extends BaseProto_1.BaseProto {
    _data;
    constructor(userID, flag, state, nick, superNono, color, power, mate, iq, ai, birth, chargeTime, superEnergy, superLevel, superStage) {
        super(CommandID_1.CommandID.NONO_INFO);
        const proto = new NoNoInfoRspProto_1.NoNoInfoRspProto();
        proto.userID = userID;
        proto.flag = flag;
        proto.state = state;
        proto.nick = nick;
        proto.superNono = superNono;
        proto.color = color;
        proto.power = power;
        proto.mate = mate;
        proto.iq = iq;
        proto.ai = ai;
        proto.birth = birth;
        proto.chargeTime = chargeTime;
        proto.func = new Array(160).fill(true); // 所有功能默认开启
        proto.superEnergy = superEnergy;
        proto.superLevel = superLevel;
        proto.superStage = superStage;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoNoInfo = PacketNoNoInfo;
//# sourceMappingURL=PacketNoNoInfo.js.map