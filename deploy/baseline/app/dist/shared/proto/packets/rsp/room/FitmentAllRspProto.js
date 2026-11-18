"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FitmentAllRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 10007 FITMENT_ALL] 获取所有家具响应
 *
 * 响应格式:
 * - count (uint32) - 家具种类数量
 * - 对于每个家具：
 *   - id (uint32) - 家具ID
 *   - usedCount (uint32) - 已使用数量
 *   - allCount (uint32) - 总数量
 */
class FitmentAllRspProto extends BaseProto_1.BaseProto {
    fitments = [];
    constructor() {
        super(CommandID_1.CommandID.FITMENT_ALL);
    }
    setFitments(fitments) {
        this.fitments = fitments;
    }
    serialize() {
        const buffers = [];
        // count
        const countBuf = Buffer.allocUnsafe(4);
        countBuf.writeUInt32BE(this.fitments.length, 0);
        buffers.push(countBuf);
        // 家具列表
        for (const fitment of this.fitments) {
            const fitmentBuf = Buffer.allocUnsafe(12);
            fitmentBuf.writeUInt32BE(fitment.id, 0);
            fitmentBuf.writeUInt32BE(fitment.usedCount, 4);
            fitmentBuf.writeUInt32BE(fitment.allCount, 8);
            buffers.push(fitmentBuf);
        }
        return Buffer.concat(buffers);
    }
}
exports.FitmentAllRspProto = FitmentAllRspProto;
//# sourceMappingURL=FitmentAllRspProto.js.map