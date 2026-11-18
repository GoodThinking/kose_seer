/**
 * 好友数据类
 * 直接映射数据库表，通过 ORM 自动保存
 *
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */
import { BaseData } from './BaseData';
/**
 * 好友聊天消息
 */
export interface IFriendChatData {
    sendTime: number;
    message: string;
    extraId: number;
    sendUid: number;
    receiveUid: number;
}
/**
 * 好友聊天历史
 */
export interface IFriendChatHistory {
    messageList: IFriendChatData[];
}
/**
 * 好友数据（对应数据库表 friends）
 *
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 */
export declare class FriendData extends BaseData {
    /** 用户ID（主键） */
    Uid: number;
    /** 好友列表 */
    FriendList: number[];
    /** 黑名单列表 */
    BlackList: number[];
    /** 发送的好友申请列表 */
    SendApplyList: number[];
    /** 接收的好友申请列表 */
    ReceiveApplyList: number[];
    /** 聊天历史（key: 好友 uid） */
    ChatHistory: Map<number, IFriendChatHistory>;
    constructor(uid: number);
    /**
     * 立即保存到数据库
     */
    save(): Promise<void>;
    /**
     * 从数据库行创建 FriendData
     */
    static FromRow(row: any): FriendData;
    /**
     * 转换为数据库行
     */
    ToRow(): any;
}
//# sourceMappingURL=FriendData.d.ts.map