/**
 * 好友信息接口
 */
export interface IFriendInfo {
    id: number;
    userId: number;
    friendId: number;
    status: FriendStatus;
    createTime: number;
}
/**
 * 好友状态枚举
 */
export declare enum FriendStatus {
    PENDING = 0,// 待确认
    CONFIRMED = 1
}
/**
 * 黑名单信息接口
 */
export interface IBlacklistInfo {
    id: number;
    userId: number;
    targetId: number;
    createTime: number;
}
/**
 * 好友数据库行接口
 */
export interface IFriendRow {
    id: number;
    userId: number;
    friendId: number;
    status: number;
    createTime: number;
}
/**
 * 黑名单数据库行接口
 */
export interface IBlacklistRow {
    id: number;
    userId: number;
    targetId: number;
    createTime: number;
}
/**
 * 创建默认好友信息
 */
export declare function createDefaultFriendInfo(): IFriendInfo;
/**
 * 创建默认黑名单信息
 */
export declare function createDefaultBlacklistInfo(): IBlacklistInfo;
//# sourceMappingURL=IFriendInfo.d.ts.map