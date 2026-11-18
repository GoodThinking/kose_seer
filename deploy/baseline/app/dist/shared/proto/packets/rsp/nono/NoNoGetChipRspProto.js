"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoGetChipRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 9023 NONO_GET_CHIP] 获取NoNo芯片响应
 * 响应: padding1(4) + padding2(4) + padding3(4) + count(4) + [chipId(4) + chipCount(4)]...
 */
class NoNoGetChipRspProto extends BaseProto_1.BaseProto {
    chipId = 0; // 芯片ID
    chipCount = 0; // 芯片数量
    constructor() {
        super(CommandID_1.CommandID.NONO_GET_CHIP);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(24);
        writer.WriteUInt32(0); // padding1
        writer.WriteUInt32(0); // padding2
        writer.WriteUInt32(0); // padding3
        writer.WriteUInt32(1); // count = 1
        writer.WriteUInt32(this.chipId);
        writer.WriteUInt32(this.chipCount);
        return writer.ToBuffer();
    }
    setChipId(chipId) {
        this.chipId = chipId;
        return this;
    }
    setChipCount(chipCount) {
        this.chipCount = chipCount;
        return this;
    }
}
exports.NoNoGetChipRspProto = NoNoGetChipRspProto;
//# sourceMappingURL=NoNoGetChipRspProto.js.map