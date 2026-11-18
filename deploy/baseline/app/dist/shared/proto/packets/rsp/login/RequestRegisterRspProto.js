"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestRegisterRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: REQUEST_REGISTER (1003)] 请求注册响应
 *
 * 预留接口，暂无响应参数
 */
class RequestRegisterRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.REQUEST_REGISTER);
    }
    serialize() {
        // 暂无响应body
        return Buffer.alloc(0);
    }
}
exports.RequestRegisterRspProto = RequestRegisterRspProto;
//# sourceMappingURL=RequestRegisterRspProto.js.map