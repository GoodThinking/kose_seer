import { BaseProto } from '../../../base/BaseProto';
/**
 * 服务器信息（原始格式）
 * onlineID(4) + userCnt(4) + ip(16) + port(2) + friends(4) = 30字节
 */
export interface ServerInfoRaw {
    onlineID: number;
    userCnt: number;
    ip: string;
    port: number;
    friends: number;
}
/**
 * 好友信息
 */
export interface FriendInfo {
    userID: number;
    timePoke: number;
}
/**
 * [CMD: COMMEND_ONLINE (105)] 推荐服务器列表响应
 * 响应: maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers... + friendData
 */
export declare class CommendOnlineRspProto extends BaseProto {
    maxOnlineID: number;
    isVIP: number;
    onlineCnt: number;
    servers: ServerInfoRaw[];
    friends: FriendInfo[];
    blacklist: number[];
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=CommendOnlineRspProto.d.ts.map