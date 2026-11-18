"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeNickNameRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 修改昵称响应
 * CMD: 2061 CHANG_NICK_NAME
 */
class ChangeNickNameRspProto extends BaseProto_1.BaseProto {
    userId = 0;
    newNick = '';
    constructor(userId = 0, newNick = '') {
        super(CommandID_1.CommandID.CHANG_NICK_NAME);
        this.userId = userId;
        this.newNick = newNick;
    }
    deserialize(buffer) {
        this.userId = buffer.readUInt32BE(0);
        this.newNick = buffer.toString('utf8', 4, 20).replace(/\0/g, '');
    }
    serialize() {
        const buffer = Buffer.alloc(20);
        buffer.writeUInt32BE(this.userId, 0);
        buffer.write(this.newNick, 4, 16, 'utf8');
        return buffer;
    }
}
exports.ChangeNickNameRspProto = ChangeNickNameRspProto;
//# sourceMappingURL=ChangeNickNameRspProto.js.map