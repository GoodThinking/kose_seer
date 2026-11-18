"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoIsInfoRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 9027 NONO_IS_INFO] NoNo是否有信息响应
 * 响应: hasNono(4) - 1=有NoNo, 0=无NoNo
 */
class NoNoIsInfoRspProto extends BaseProto_1.BaseProto {
    hasNono = 1; // 是否有NoNo
    constructor() {
        super(CommandID_1.CommandID.NONO_IS_INFO);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(4);
        writer.WriteUInt32(this.hasNono);
        return writer.ToBuffer();
    }
    setHasNono(hasNono) {
        this.hasNono = hasNono;
        return this;
    }
}
exports.NoNoIsInfoRspProto = NoNoIsInfoRspProto;
//# sourceMappingURL=NoNoIsInfoRspProto.js.map