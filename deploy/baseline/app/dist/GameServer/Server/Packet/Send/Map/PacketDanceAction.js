"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketDanceAction = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const DanceActionRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/DanceActionRspProto");
/**
 * 舞蹈动作响应包
 * CMD 1009
 */
class PacketDanceAction extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, actionId, actionType) {
        super(CommandID_1.CommandID.DANCE_ACTION);
        const proto = new DanceActionRspProto_1.DanceActionRspProto();
        proto.userId = userId;
        proto.actionId = actionId;
        proto.actionType = actionType;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketDanceAction = PacketDanceAction;
//# sourceMappingURL=PacketDanceAction.js.map