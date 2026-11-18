"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetOneCureReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2310 PET_ONE_CURE] 恢复单个精灵HP请求
 */
class PetOneCureReqProto extends BaseProto_1.BaseProto {
    catchTime = 0;
    coins = 0; // 客户端发送的赛尔豆数量（可选）
    constructor() {
        super(CommandID_1.CommandID.PET_ONE_CURE);
    }
    deserialize(buffer) {
        let offset = 0;
        // 使用大端序读取 catchTime
        this.catchTime = buffer.readUInt32BE(offset);
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.PetOneCureReqProto = PetOneCureReqProto;
//# sourceMappingURL=PetOneCureReqProto.js.map