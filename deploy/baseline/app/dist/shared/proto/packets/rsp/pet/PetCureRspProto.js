"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetCureRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2306 PET_CURE] 治疗精灵响应
 * Response: 空（无body）
 */
class PetCureRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.PET_CURE);
    }
    serialize() {
        // 治疗响应无body
        return Buffer.alloc(0);
    }
}
exports.PetCureRspProto = PetCureRspProto;
//# sourceMappingURL=PetCureRspProto.js.map