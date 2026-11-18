"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoNoExeList = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoNoExeListRspProto_1 = require("../../../../../shared/proto/packets/rsp/nono/NoNoExeListRspProto");
/**
 * NoNo 执行列表响应包
 * CMD 9015
 */
class PacketNoNoExeList extends BaseProto_1.BaseProto {
    _data;
    constructor() {
        super(CommandID_1.CommandID.NONO_EXE_LIST);
        const proto = new NoNoExeListRspProto_1.NoNoExeListRspProto();
        proto.count = 0; // 空列表
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoNoExeList = PacketNoNoExeList;
//# sourceMappingURL=PacketNoNoExeList.js.map