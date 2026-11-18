"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatchMonsterRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
const utils_1 = require("../../../../utils");
/**
 * [CMD: 2409 CATCH_MONSTER] 捕捉精灵响应
 */
class CatchMonsterRspProto extends BaseProto_1.BaseProto {
    catchTime = 0; // 捕获时间
    petId = 0; // 精灵ID
    constructor() {
        super(CommandID_1.CommandID.CATCH_MONSTER);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(16);
        writer.WriteUInt32(this.catchTime);
        writer.WriteUInt32(this.petId);
        return writer.ToBuffer();
    }
    // 链式调用
    setCatchTime(value) {
        this.catchTime = value;
        return this;
    }
    setPetId(value) {
        this.petId = value;
        return this;
    }
}
exports.CatchMonsterRspProto = CatchMonsterRspProto;
//# sourceMappingURL=CatchMonsterRspProto.js.map