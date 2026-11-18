"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestRegisterReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: REQUEST_REGISTER (1003)] 请求注册
 *
 * 预留接口，暂无请求参数
 */
class RequestRegisterReqProto extends BaseProto_1.BaseProto {
    constructor() {
        super(0); // 请求Proto不需要cmdId
    }
    serialize() {
        // 请求由客户端发送，服务器不需要序列化
        return Buffer.alloc(0);
    }
    /**
     * 从Buffer解析请求注册
     */
    deserialize(_buffer) {
        // 暂无参数
    }
}
exports.RequestRegisterReqProto = RequestRegisterReqProto;
//# sourceMappingURL=RequestRegisterReqProto.js.map