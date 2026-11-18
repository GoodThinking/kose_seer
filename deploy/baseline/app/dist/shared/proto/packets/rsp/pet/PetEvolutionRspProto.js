"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetEvolutionRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2314 PET_EVOLVTION] 精灵进化响应
 *
 * 根据 Lua 端实现，返回 4 字节（通常为0表示成功）
 * 客户端会通过 PET_LIST 刷新精灵信息
 *
 * Response Body:
 * - status (uint32): 状态（0=成功）
 */
class PetEvolutionRspProto extends BaseProto_1.BaseProto {
    status = 0;
    constructor(status = 0) {
        super(CommandID_1.CommandID.PET_EVOLVTION);
        this.status = status;
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.status, 0);
        return buffer;
    }
}
exports.PetEvolutionRspProto = PetEvolutionRspProto;
//# sourceMappingURL=PetEvolutionRspProto.js.map