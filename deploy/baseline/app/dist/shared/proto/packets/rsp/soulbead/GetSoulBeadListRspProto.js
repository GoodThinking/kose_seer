"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSoulBeadListRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 获取魂珠列表响应
 * CMD 2354: GET_SOUL_BEAD_List
 *
 * 响应格式：
 * - count (4 bytes): 魂珠数量
 * - 魂珠列表 (每个魂珠的数据)
 */
class GetSoulBeadListRspProto extends BaseProto_1.BaseProto {
    soulBeadList;
    constructor(soulBeadList = []) {
        super(CommandID_1.CommandID.GET_SOUL_BEAD_List);
        this.soulBeadList = soulBeadList;
    }
    serialize() {
        // 暂时返回空列表：count = 0
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(0, 0); // count = 0
        return buffer;
    }
    deserialize(buffer) {
        // 不需要实现
    }
}
exports.GetSoulBeadListRspProto = GetSoulBeadListRspProto;
//# sourceMappingURL=GetSoulBeadListRspProto.js.map