"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRelationListRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
const utils_1 = require("../../../../utils");
/**
 * 获取好友关系列表响应
 * CMD 2150: GET_RELATION_LIST
 *
 * 响应格式：
 * - friendCount (4 bytes): 好友数量
 * - friendList: 好友列表（每个好友4字节userID）
 * - blackCount (4 bytes): 黑名单数量
 * - blackList: 黑名单列表（每个4字节userID）
 */
class GetRelationListRspProto extends BaseProto_1.BaseProto {
    friendList;
    blackList;
    constructor(friendList = [], blackList = []) {
        super(CommandID_1.CommandID.GET_RELATION_LIST);
        this.friendList = friendList;
        this.blackList = blackList;
    }
    serialize() {
        const writer = new utils_1.BufferWriter(1024);
        // 好友列表
        writer.WriteUInt32(this.friendList.length);
        for (const friendId of this.friendList) {
            writer.WriteUInt32(friendId);
        }
        // 黑名单
        writer.WriteUInt32(this.blackList.length);
        for (const userId of this.blackList) {
            writer.WriteUInt32(userId);
        }
        return writer.ToBuffer();
    }
    deserialize(buffer) {
        // 不需要实现
    }
}
exports.GetRelationListRspProto = GetRelationListRspProto;
//# sourceMappingURL=GetRelationListRspProto.js.map