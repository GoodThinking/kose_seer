"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetEvolutionReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2314 PET_EVOLVTION] 精灵进化请求
 *
 * 请求格式: catchTime(4) + evolveIndex(4)
 */
class PetEvolutionReqProto extends BaseProto_1.BaseProto {
    catchTime = 0; // 精灵捕获时间（唯一标识）
    evolveIndex = 0; // 进化索引（通常为1，表示进化到下一形态）
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new PetEvolutionReqProto();
        if (buffer.length >= 4) {
            proto.catchTime = buffer.readUInt32BE(0);
        }
        if (buffer.length >= 8) {
            proto.evolveIndex = buffer.readUInt32BE(4);
        }
        return proto;
    }
}
exports.PetEvolutionReqProto = PetEvolutionReqProto;
//# sourceMappingURL=PetEvolutionReqProto.js.map