"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetOneCureRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2310 PET_ONE_CURE] 恢复单个精灵HP响应
 *
 * 客户端只需要 catchTime，会在本地更新精灵HP和PP
 */
class PetOneCureRspProto extends BaseProto_1.BaseProto {
    _catchTime = 0;
    constructor() {
        super(CommandID_1.CommandID.PET_ONE_CURE);
    }
    setCatchTime(catchTime) {
        this._catchTime = catchTime;
        return this;
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this._catchTime, 0);
        return buffer;
    }
}
exports.PetOneCureRspProto = PetOneCureRspProto;
//# sourceMappingURL=PetOneCureRspProto.js.map