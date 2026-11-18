"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketEmpty = void 0;
const BaseProto_1 = require("../../../../shared/proto/base/BaseProto");
const EmptyRspProto_1 = require("../../../../shared/proto/packets/rsp/EmptyRspProto");
/**
 * 通用空响应包
 * 用于只返回 result 的简单命令
 */
class PacketEmpty extends BaseProto_1.BaseProto {
    _data;
    constructor(cmdId) {
        super(cmdId);
        const proto = new EmptyRspProto_1.EmptyRspProto(cmdId);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketEmpty = PacketEmpty;
//# sourceMappingURL=PacketEmpty.js.map