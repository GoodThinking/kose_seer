"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketBlackList = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BlackListRspProto_1 = require("../../../../../shared/proto/packets/rsp/friend/BlackListRspProto");
/**
 * 黑名单列表响应包
 * CMD 2159
 */
class PacketBlackList extends BaseProto_1.BaseProto {
    _data;
    constructor(blackList, result = 0) {
        super(CommandID_1.CommandID.BLACK_LIST);
        const proto = new BlackListRspProto_1.BlackListRspProto();
        proto.blackList = blackList;
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketBlackList = PacketBlackList;
//# sourceMappingURL=PacketBlackList.js.map