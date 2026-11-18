"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoChangeNameReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 9002 NONO_CHANGE_NAME] 修改NoNo昵称
 * 请求: newName(16 bytes)
 */
class NoNoChangeNameReqProto extends BaseProto_1.BaseProto {
    newName = '';
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new NoNoChangeNameReqProto();
        if (buffer.length >= 16) {
            proto.newName = buffer.toString('utf8', 0, 16).replace(/\0/g, '').trim();
        }
        return proto;
    }
}
exports.NoNoChangeNameReqProto = NoNoChangeNameReqProto;
//# sourceMappingURL=NoNoChangeNameReqProto.js.map