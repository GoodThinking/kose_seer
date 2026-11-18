"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FitmentUseringRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 10006 FITMENT_USERING] 使用家具响应
 *
 * 响应格式:
 * - ownerId: uint32 (房主ID)
 * - roomId: uint32 (房间ID)
 * - count: uint32 (家具数量)
 * - fitments: IFitmentInfo[] (家具列表)
 */
class FitmentUseringRspProto extends BaseProto_1.BaseProto {
    ownerId = 0;
    roomId = 0;
    fitments = [];
    constructor() {
        super(CommandID_1.CommandID.FITMENT_USERING);
    }
    serialize() {
        const bufferSize = 12 + this.fitments.length * 20;
        const buffer = Buffer.alloc(bufferSize);
        let offset = 0;
        // 写入房主ID
        buffer.writeUInt32BE(this.ownerId, offset);
        offset += 4;
        // 写入房间ID
        buffer.writeUInt32BE(this.roomId, offset);
        offset += 4;
        // 写入家具数量
        buffer.writeUInt32BE(this.fitments.length, offset);
        offset += 4;
        // 写入家具列表
        for (const fitment of this.fitments) {
            buffer.writeUInt32BE(fitment.id, offset);
            offset += 4;
            buffer.writeUInt32BE(fitment.x, offset);
            offset += 4;
            buffer.writeUInt32BE(fitment.y, offset);
            offset += 4;
            buffer.writeUInt32BE(fitment.dir, offset);
            offset += 4;
            buffer.writeUInt32BE(fitment.status, offset);
            offset += 4;
        }
        return buffer;
    }
    setOwner(ownerId, roomId) {
        this.ownerId = ownerId;
        this.roomId = roomId;
        return this;
    }
    setFitments(fitments) {
        this.fitments = fitments;
        return this;
    }
}
exports.FitmentUseringRspProto = FitmentUseringRspProto;
//# sourceMappingURL=FitmentUseringRspProto.js.map