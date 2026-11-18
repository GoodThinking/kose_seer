"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetDefaultRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2308 PET_DEFAULT] 设置默认精灵响应
 * Response: 空（无body）
 */
class PetDefaultRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.PET_DEFAULT);
    }
    serialize() {
        // 设置默认精灵响应无body
        return Buffer.alloc(0);
    }
}
exports.PetDefaultRspProto = PetDefaultRspProto;
//# sourceMappingURL=PetDefaultRspProto.js.map