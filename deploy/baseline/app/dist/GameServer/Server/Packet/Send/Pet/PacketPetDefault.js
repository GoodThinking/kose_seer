"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketPetDefault = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetDefaultRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/PetDefaultRspProto");
/**
 * 设置默认精灵响应包
 * CMD 2308
 */
class PacketPetDefault extends BaseProto_1.BaseProto {
    _data;
    constructor() {
        super(CommandID_1.CommandID.PET_DEFAULT);
        const proto = new PetDefaultRspProto_1.PetDefaultRspProto();
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketPetDefault = PacketPetDefault;
//# sourceMappingURL=PacketPetDefault.js.map