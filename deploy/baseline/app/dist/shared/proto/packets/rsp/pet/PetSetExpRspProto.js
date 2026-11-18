"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetSetExpRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配响应
 *
 * 根据 Lua 端实现，只返回经验池剩余经验（4字节）
 * 客户端会通过 PET_LIST 刷新精灵信息
 *
 * Response Body:
 * - remainingAllocExp (uint32): 剩余可分配经验
 */
class PetSetExpRspProto extends BaseProto_1.BaseProto {
    remainingAllocExp = 0;
    constructor(remainingAllocExp) {
        super(CommandID_1.CommandID.PET_SET_EXP);
        this.remainingAllocExp = remainingAllocExp;
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.remainingAllocExp, 0);
        return buffer;
    }
}
exports.PetSetExpRspProto = PetSetExpRspProto;
//# sourceMappingURL=PetSetExpRspProto.js.map