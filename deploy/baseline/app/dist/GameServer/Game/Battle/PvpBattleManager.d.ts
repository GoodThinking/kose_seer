import { IBattleInfo } from '../../../shared/models/BattleModel';
/**
 * PVP对战邀请信息
 */
interface IPvpInvite {
    inviterId: number;
    inviterNick: string;
    targetId: number;
    targetNick: string;
    timestamp: number;
}
/**
 * PVP玩家回合动作
 */
export interface IPvpAction {
    type: 'skill' | 'changePet';
    skillId?: number;
    catchTime?: number;
}
/**
 * PVP战斗房间
 */
interface IPvpBattleRoom {
    player1Id: number;
    player2Id: number;
    battle: IBattleInfo | null;
    player1Ready: boolean;
    player2Ready: boolean;
    player1Action: IPvpAction | null;
    player2Action: IPvpAction | null;
    player1LoadPercent: number;
    player2LoadPercent: number;
    createdAt: number;
}
/**
 * PVP对战管理器（单例）
 * 管理玩家之间的对战邀请和匹配
 */
export declare class PvpBattleManager {
    private static _instance;
    private _invites;
    private _pendingInvites;
    private _battleRooms;
    private _playerRooms;
    private readonly INVITE_TIMEOUT;
    private readonly ROOM_TIMEOUT;
    private constructor();
    static get Instance(): PvpBattleManager;
    /**
     * 创建邀请
     */
    CreateInvite(inviterId: number, inviterNick: string, targetId: number, targetNick: string): boolean;
    /**
     * 取消邀请
     */
    CancelInvite(inviterId: number, targetId: number): boolean;
    /**
     * 处理邀请（接受/拒绝）
     */
    HandleInvite(inviterId: number, targetId: number, accept: boolean): IPvpInvite | null;
    /**
     * 创建PVP战斗房间
     */
    CreateBattleRoom(player1Id: number, player2Id: number): string;
    /**
     * 设置玩家准备状态
     */
    SetPlayerReady(userId: number): boolean;
    /**
     * 设置玩家加载进度
     */
    SetPlayerLoadPercent(userId: number, percent: number): void;
    /**
     * 获取对方玩家的加载进度
     */
    GetOpponentLoadPercent(userId: number): number;
    /**
     * 获取玩家所在房间
     */
    GetPlayerRoom(userId: number): IPvpBattleRoom | null;
    /**
     * 设置房间战斗实例
     */
    SetRoomBattle(roomKey: string, battle: IBattleInfo): void;
    /**
     * 移除战斗房间
     */
    RemoveBattleRoom(roomKey: string): void;
    /**
     * 获取邀请信息
     */
    GetInvite(inviterId: number, targetId: number): IPvpInvite | null;
    /**
     * 获取玩家的所有待处理邀请
     */
    GetPendingInvites(userId: number): number[];
    /**
     * 清理超时邀请
     */
    private CleanupExpiredInvites;
    /**
     * 清理超时房间
     */
    private CleanupExpiredRooms;
    /**
     * 玩家登出时清理相关邀请和房间
     */
    OnPlayerLogout(userId: number): void;
    /**
     * 设置玩家回合动作
     * @returns true 如果双方都已提交动作
     */
    SetPlayerAction(userId: number, action: IPvpAction): boolean;
    /**
     * 获取双方动作
     */
    GetActions(userId: number): {
        player1Action: IPvpAction;
        player2Action: IPvpAction;
        player1Id: number;
        player2Id: number;
    } | null;
    /**
     * 清空双方动作（回合结算后调用）
     */
    ClearActions(userId: number): void;
    /**
     * 生成邀请键
     */
    private GetInviteKey;
    /**
     * 生成房间键
     */
    private GetRoomKey;
}
export {};
//# sourceMappingURL=PvpBattleManager.d.ts.map