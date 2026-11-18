"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetImageAddress = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetImageAddressRspProto_1 = require("../../../../../shared/proto/packets/rsp/system/GetImageAddressRspProto");
/**
 * 获取图片服务器地址响应包
 * CMD 1005
 */
class PacketGetImageAddress extends BaseProto_1.BaseProto {
    _data;
    constructor(ip, port, session) {
        super(CommandID_1.CommandID.GET_IMAGE_ADDRESS);
        const proto = new GetImageAddressRspProto_1.GetImageAddressRspProto();
        proto.ip = ip;
        proto.port = port;
        proto.session = session;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetImageAddress = PacketGetImageAddress;
//# sourceMappingURL=PacketGetImageAddress.js.map