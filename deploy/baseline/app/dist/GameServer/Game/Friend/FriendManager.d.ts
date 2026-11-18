import { BaseManager } from '../Base/BaseManager';
import { FriendData } from '../../../DataBase/models/FriendData';
/**
 * 好友管理器
 * 负责处理好友相关的业务逻辑
 *
 * 架构特点：
 * - 继承 BaseManager，获得便捷方法
 * - 持有 FriendData 对象（直接映射数据库）
 * - 直接操作 FriendData 的属性（Array.push、Array.splice 等）
 * - FriendData 继承 BaseData，自动保存（100ms 防抖）
 * - 不需要手动调用 save()
 */
export declare class FriendManager extends BaseManager {
    /** 好友数据 */
    FriendData: FriendData;
    /** 玩家数据仓库（用于查询其他玩家信息）*/
    private _playerRepo;
    constructor(player: any);
    /**
     * 初始化（加载好友数据）
     */
    Initialize(): Promise<void>;
    /**
     * 添加好友（发送好友申请）
     */
    HandleAddFriend(targetUid: number): Promise<void>;
    /**
     * 确认添加好友（接受好友申请）
     */
    HandleConfirmAddFriend(targetUid: number): Promise<void>;
    /**
     * 拒绝好友申请
     */
    HandleRefuseAddFriend(targetUid: number): Promise<void>;
    /**
     * 删除好友
     */
    HandleRemoveFriend(targetUid: number): Promise<void>;
    /**
     * 添加到黑名单
     */
    HandleAddToBlacklist(targetUid: number): Promise<void>;
    /**
     * 从黑名单移除
     */
    HandleRemoveFromBlacklist(targetUid: number): Promise<void>;
    /**
     * 获取好友列表
     */
    HandleGetFriendList(): Promise<void>;
    /**
     * 获取黑名单列表
     */
    HandleGetBlacklist(): Promise<void>;
    /**
     * 查看在线好友
     */
    HandleSeeOnline(): Promise<void>;
    /**
     * 接收好友申请（由其他玩家的 FriendManager 调用）
     */
    ReceiveFriendApply(fromUid: number): void;
    /**
     * 移除已发送的好友申请（对方确认/拒绝后调用）
     */
    RemoveSentApply(targetUid: number): void;
    /**
     * 被添加为好友（对方确认申请后调用）
     */
    AddFriendEntry(friendUid: number): void;
    /**
     * 被删除好友（对方删除好友后调用）
     */
    RemoveFriendEntry(friendUid: number): void;
    /**
     * 获取好友列表（只读）
     */
    GetFriendList(): number[];
    /**
     * 获取黑名单列表（只读）
     */
    GetBlackList(): number[];
    /**
     * 登出清理
     */
    OnLogout(): Promise<void>;
}
//# sourceMappingURL=FriendManager.d.ts.map