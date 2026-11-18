"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenSuperNonoRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: OPEN_SUPER_NONO (80001)] 开启超级NoNo响应
 *
 * Response Body:
 * - success (uint32): 是否成功 (0=成功, 1=失败)
 */
class OpenSuperNonoRspProto extends BaseProto_1.BaseProto {
    success = 0;
    constructor(success = 0) {
        super(CommandID_1.CommandID.OPEN_SUPER_NONO);
        this.success = success;
    }
    serialize() {
        const writer = new utils_1.BufferWriter(4);
        writer.WriteUInt32(this.success);
        return writer.ToBuffer();
    }
}
exports.OpenSuperNonoRspProto = OpenSuperNonoRspProto;
//# sourceMappingURL=OpenSuperNonoRspProto.js.map