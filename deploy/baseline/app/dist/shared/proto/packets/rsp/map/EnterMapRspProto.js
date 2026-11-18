"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterMapRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
const SeerMapUserInfoProto_1 = require("../../../common/SeerMapUserInfoProto");
/**
 * [CMD: 2001 ENTER_MAP] 进入地图响应
 * 返回玩家的完整信息
 */
class EnterMapRspProto extends BaseProto_1.BaseProto {
    userInfo;
    constructor(userInfo) {
        super(CommandID_1.CommandID.ENTER_MAP);
        this.userInfo = userInfo || new SeerMapUserInfoProto_1.SeerMapUserInfoProto();
    }
    serialize(protocol = 'kose') {
        return this.userInfo.serialize(protocol);
    }
    // 链式调用辅助方法
    setUserInfo(userInfo) {
        this.userInfo = userInfo;
        return this;
    }
}
exports.EnterMapRspProto = EnterMapRspProto;
//# sourceMappingURL=EnterMapRspProto.js.map