"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendStatus = void 0;
exports.createDefaultFriendInfo = createDefaultFriendInfo;
exports.createDefaultBlacklistInfo = createDefaultBlacklistInfo;
/**
 * 好友状态枚举
 */
var FriendStatus;
(function (FriendStatus) {
    FriendStatus[FriendStatus["PENDING"] = 0] = "PENDING";
    FriendStatus[FriendStatus["CONFIRMED"] = 1] = "CONFIRMED"; // 已确认
})(FriendStatus || (exports.FriendStatus = FriendStatus = {}));
/**
 * 创建默认好友信息
 */
function createDefaultFriendInfo() {
    return {
        id: 0,
        userId: 0,
        friendId: 0,
        status: FriendStatus.PENDING,
        createTime: Math.floor(Date.now() / 1000)
    };
}
/**
 * 创建默认黑名单信息
 */
function createDefaultBlacklistInfo() {
    return {
        id: 0,
        userId: 0,
        targetId: 0,
        createTime: Math.floor(Date.now() / 1000)
    };
}
//# sourceMappingURL=IFriendInfo.js.map