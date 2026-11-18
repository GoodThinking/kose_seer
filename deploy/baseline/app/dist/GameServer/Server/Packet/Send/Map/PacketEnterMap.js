"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketEnterMap = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const EnterMapRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/EnterMapRspProto");
/**
 * 进入地图响应包
 * CMD 2001
 */
class PacketEnterMap extends BaseProto_1.BaseProto {
    _data;
    constructor(userInfo, result = 0, protocol = 'kose') {
        super(CommandID_1.CommandID.ENTER_MAP);
        const proto = new EnterMapRspProto_1.EnterMapRspProto();
        if (userInfo) {
            proto.userInfo = userInfo;
        }
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize(protocol);
    }
    serialize() {
        return this._data;
    }
}
exports.PacketEnterMap = PacketEnterMap;
//# sourceMappingURL=PacketEnterMap.js.map