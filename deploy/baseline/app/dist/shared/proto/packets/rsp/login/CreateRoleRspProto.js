"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRoleRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
const SessionToken_1 = require("../../../../protocol/SessionToken");
/**
 * [CMD: CREATE_ROLE (108)] 创建角色响应
 */
class CreateRoleRspProto extends BaseProto_1.BaseProto {
    session = Buffer.alloc(16);
    constructor() {
        super(CommandID_1.CommandID.CREATE_ROLE);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(16);
        writer.WriteBytes(this.session);
        return writer.ToBuffer();
    }
    /**
     * 辅助方法：设置Session
     */
    setSession(sessionKey) {
        this.session = (0, SessionToken_1.SessionKeyToWire)(sessionKey);
        return this;
    }
}
exports.CreateRoleRspProto = CreateRoleRspProto;
//# sourceMappingURL=CreateRoleRspProto.js.map