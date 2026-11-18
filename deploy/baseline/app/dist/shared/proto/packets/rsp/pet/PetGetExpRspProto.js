"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetGetExpRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2319 PET_GET_EXP] 获取精灵经验分配信息响应
 *
 * Response Body:
 * - allocatableExp (uint32): 可分配的经验值
 */
class PetGetExpRspProto extends BaseProto_1.BaseProto {
    allocatableExp = 0;
    constructor(allocatableExp) {
        super(CommandID_1.CommandID.PET_GET_EXP);
        this.allocatableExp = allocatableExp;
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.allocatableExp, 0);
        return buffer;
    }
}
exports.PetGetExpRspProto = PetGetExpRspProto;
//# sourceMappingURL=PetGetExpRspProto.js.map