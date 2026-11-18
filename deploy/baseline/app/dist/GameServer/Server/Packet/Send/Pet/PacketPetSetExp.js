"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketPetSetExp = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetSetExpRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/PetSetExpRspProto");
/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配响应包
 *
 * 根据 Lua 端实现，只返回经验池剩余经验（4字节）
 */
class PacketPetSetExp extends BaseProto_1.BaseProto {
    _data;
    constructor(remainingAllocExp) {
        super(CommandID_1.CommandID.PET_SET_EXP);
        const proto = new PetSetExpRspProto_1.PetSetExpRspProto(remainingAllocExp);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketPetSetExp = PacketPetSetExp;
//# sourceMappingURL=PacketPetSetExp.js.map