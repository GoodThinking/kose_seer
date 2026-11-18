"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRoleReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: CREATE_ROLE (108)] 创建角色请求
 * 请求: userID(4) + nickname(16) + color(4) = 24字节
 */
class CreateRoleReqProto extends BaseProto_1.BaseProto {
    userID = 0;
    nickname = '';
    color = 0;
    constructor() {
        super(0); // 请求Proto不需要cmdId
    }
    serialize() {
        // 请求由客户端发送，服务器不需要序列化
        return Buffer.alloc(0);
    }
    /**
     * 从Buffer快速解析
     */
    static fromBuffer(buffer) {
        const proto = new CreateRoleReqProto();
        if (buffer.length >= 24) {
            proto.userID = buffer.readUInt32BE(0);
            proto.nickname = buffer.toString('utf8', 4, 20).replace(/\0/g, '').trim();
            proto.color = buffer.readUInt32BE(20);
        }
        return proto;
    }
}
exports.CreateRoleReqProto = CreateRoleReqProto;
//# sourceMappingURL=CreateRoleReqProto.js.map