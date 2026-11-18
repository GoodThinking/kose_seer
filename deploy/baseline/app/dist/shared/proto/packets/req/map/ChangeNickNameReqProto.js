"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeNickNameReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 修改昵称请求
 * CMD: 2061 CHANG_NICK_NAME
 */
class ChangeNickNameReqProto extends BaseProto_1.BaseProto {
    newNick = '';
    constructor() {
        super(CommandID_1.CommandID.CHANG_NICK_NAME);
    }
    deserialize(buffer) {
        if (buffer.length >= 16) {
            this.newNick = buffer.toString('utf8', 0, 16).replace(/\0/g, '');
        }
    }
    serialize() {
        const buffer = Buffer.alloc(16);
        buffer.write(this.newNick, 0, 16, 'utf8');
        return buffer;
    }
}
exports.ChangeNickNameReqProto = ChangeNickNameReqProto;
//# sourceMappingURL=ChangeNickNameReqProto.js.map