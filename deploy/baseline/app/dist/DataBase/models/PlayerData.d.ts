/**
 * 玩家数据类
 * 直接映射数据库表，提供静态方法便捷访问
 *
 * 特性：使用 Proxy 实现属性修改时自动保存到数据库
 */
import { IPlayerInfo } from '../../shared/models/PlayerModel';
/**
 * 玩家数据（对应数据库表 players）
 *
 * 架构说明：
 * - 这是一个数据类，直接映射数据库表
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - 使用 Proxy 实现属性修改时自动保存（黑名单模式）
 * - 提供静态方法 GetPlayerByUid 便捷访问
 */
export declare class PlayerData implements IPlayerInfo {
    userID: number;
    regTime: number;
    nick: string;
    vip: number;
    viped: number;
    dsFlag: number;
    color: number;
    texture: number;
    energy: number;
    coins: number;
    gold: number;
    fightBadge: number;
    allocatableExp: number;
    mapID: number;
    posX: number;
    posY: number;
    actionType: number;
    action: number;
    direction: number;
    changeShape: number;
    playerForm: boolean;
    transTime: number;
    fightFlag: number;
    timeToday: number;
    timeLimit: number;
    isClothHalfDay: boolean;
    isRoomHalfDay: boolean;
    iFortressHalfDay: boolean;
    isHQHalfDay: boolean;
    loginCnt: number;
    inviter: number;
    newInviteeCnt: number;
    vipLevel: number;
    vipValue: number;
    vipStage: number;
    autoCharge: number;
    vipEndTime: number;
    freshManBonus: number;
    nonoChipList: number[];
    dailyResArr: number[];
    teacherID: number;
    studentID: number;
    graduationCount: number;
    maxPuniLv: number;
    towerBossIndex: number;
    petMaxLev: number;
    petAllNum: number;
    monKingWin: number;
    messWin: number;
    curStage: number;
    maxStage: number;
    curFreshStage: number;
    maxFreshStage: number;
    maxArenaWins: number;
    twoTimes: number;
    threeTimes: number;
    autoFight: number;
    autoFightTimes: number;
    energyTimes: number;
    learnTimes: number;
    monBtlMedal: number;
    recordCnt: number;
    obtainTm: number;
    soulBeadItemID: number;
    expireTm: number;
    fuseTimes: number;
    hasNono: boolean;
    superNono: boolean;
    nonoState: number;
    nonoColor: number;
    nonoNick: string;
    nonoFlag: number;
    nonoPower: number;
    nonoMate: number;
    nonoIq: number;
    nonoAi: number;
    nonoBirth: number;
    nonoChargeTime: number;
    nonoSuperEnergy: number;
    nonoSuperLevel: number;
    nonoSuperStage: number;
    teamInfo: any;
    teamPKInfo: any;
    badge: number;
    taskList: number[];
    petNum: number;
    pets: any[];
    clothCount: number;
    clothes: any[];
    clothIds: number[];
    curTitle: number;
    bossAchievement: boolean[];
    private _saveTimer;
    private _pendingSave;
    private _dirtyFields;
    constructor(data: IPlayerInfo);
    /**
     * 创建 Proxy 包装，实现属性修改时自动保存
     */
    private createProxy;
    /**
     * 调度保存操作（防抖，100ms内的多次修改只保存一次）
     */
    private scheduleSave;
    /**
     * 立即保存到数据库
     */
    save(): Promise<void>;
    /**
     * 清理定时器（用于关闭时清理资源）
     */
    cleanup(): void;
    /**
     * 获取当前脏字段列表
     */
    GetDirtyFields(): string[];
    /**
     * 清理脏字段
     */
    ClearDirtyFields(fields?: string[]): void;
    /**
     * 手动标记字段为脏
     */
    MarkDirty(field: string): void;
    /**
     * 静态方法：根据 UID 获取玩家数据
     *
     *
     * @example
     * // 在 FriendManager 中使用
     * const player = await PlayerData.GetPlayerByUid(friendUid);
     * if (player) {
     *   console.log(player.nick);
     * }
     *
     * // 在 Handler 中使用
     * const targetPlayer = await PlayerData.GetPlayerByUid(req.Uid);
     */
    static GetPlayerByUid(uid: number): Promise<PlayerData | null>;
    /**
     * 转换为简单信息（用于好友列表等）
     */
    ToSimpleInfo(): any;
    /**
     * 转换为详细信息（用于查看资料）
     */
    ToDetailInfo(): any;
}
//# sourceMappingURL=PlayerData.d.ts.map