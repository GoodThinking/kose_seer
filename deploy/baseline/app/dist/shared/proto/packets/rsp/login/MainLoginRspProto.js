"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainLoginRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
const SessionToken_1 = require("../../../../protocol/SessionToken");
/**
 * [CMD: MAIN_LOGIN_IN (104)] 主登录响应
 */
class MainLoginRspProto extends BaseProto_1.BaseProto {
    session = Buffer.alloc(16);
    roleCreated = 0; // 1=已创建角色, 0=未创建角色
    constructor() {
        super(CommandID_1.CommandID.MAIN_LOGIN_IN);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(20);
        writer.WriteBytes(this.session);
        writer.WriteUInt32(this.roleCreated);
        return writer.ToBuffer();
    }
    /**
     * 辅助方法：设置Session
     */
    setSession(sessionKey) {
        this.session = (0, SessionToken_1.SessionKeyToWire)(sessionKey);
        return this;
    }
    /**
     * 辅助方法：设置角色创建状态
     */
    setRoleCreated(created) {
        this.roleCreated = created ? 1 : 0;
        return this;
    }
}
exports.MainLoginRspProto = MainLoginRspProto;
//# sourceMappingURL=MainLoginRspProto.js.map