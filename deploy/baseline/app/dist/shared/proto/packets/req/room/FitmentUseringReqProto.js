"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FitmentUseringReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 10006 FITMENT_USERING] 使用家具请求
 *
 * 请求格式:
 * - targetUserId: uint32 (目标用户ID，访问谁的房间)
 */
class FitmentUseringReqProto extends BaseProto_1.BaseProto {
    targetUserId = 0;
    constructor() {
        super(CommandID_1.CommandID.FITMENT_USERING);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new FitmentUseringReqProto();
        if (buffer.length >= 4) {
            proto.targetUserId = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.FitmentUseringReqProto = FitmentUseringReqProto;
//# sourceMappingURL=FitmentUseringReqProto.js.map