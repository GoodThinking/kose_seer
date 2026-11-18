"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketChangeColor = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ChangeColorRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/ChangeColorRspProto");
/**
 * 修改颜色响应包
 * CMD 1008
 */
class PacketChangeColor extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, newColor, cost, remain) {
        super(CommandID_1.CommandID.CHANGE_COLOR);
        const proto = new ChangeColorRspProto_1.ChangeColorRspProto();
        proto.userId = userId;
        proto.newColor = newColor;
        proto.cost = cost;
        proto.remain = remain;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketChangeColor = PacketChangeColor;
//# sourceMappingURL=PacketChangeColor.js.map