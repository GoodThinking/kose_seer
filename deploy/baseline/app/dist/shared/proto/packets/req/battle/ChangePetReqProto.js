"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePetReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2407 CHANGE_PET] 更换精灵请求
 */
class ChangePetReqProto extends BaseProto_1.BaseProto {
    catchTime = 0; // 精灵捕获时间
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new ChangePetReqProto();
        if (buffer.length >= 4) {
            proto.catchTime = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.ChangePetReqProto = ChangePetReqProto;
//# sourceMappingURL=ChangePetReqProto.js.map