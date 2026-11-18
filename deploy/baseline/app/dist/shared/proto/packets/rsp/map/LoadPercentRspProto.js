"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadPercentRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2441 LOAD_PERCENT] 加载进度响应
 */
class LoadPercentRspProto extends BaseProto_1.BaseProto {
    id; // 对方的ID（BOSS使用0，PVP使用对方玩家ID）
    percent; // 对方的加载进度（0-100）
    constructor(id = 0, percent = 0) {
        super(CommandID_1.CommandID.LOAD_PERCENT);
        this.id = id;
        this.percent = percent;
    }
    serialize() {
        const buffer = Buffer.alloc(8);
        buffer.writeUInt32BE(this.id, 0);
        buffer.writeUInt32BE(this.percent, 4);
        return buffer;
    }
    // 链式调用辅助方法
    setData(id, percent) {
        this.id = id;
        this.percent = percent;
        return this;
    }
}
exports.LoadPercentRspProto = LoadPercentRspProto;
//# sourceMappingURL=LoadPercentRspProto.js.map