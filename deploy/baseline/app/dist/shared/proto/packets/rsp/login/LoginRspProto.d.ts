import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: LOGIN_IN (1001)] 游戏登录响应
 *
 * 完整协议格式（基于 UserInfo.setForLoginInfo）:
 * - userID (4)
 * - regTime (4)
 * - nick (16 UTF bytes)
 * - vipFlags (4): bit0=vip, bit1=viped
 * - dsFlag (4)
 * - color (4)
 * - texture (4)
 * - energy (4)
 * - coins (4)
 * - fightBadge (4)
 * - mapID (4)
 * - posX (4)
 * - posY (4)
 * - timeToday (4)
 * - timeLimit (4)
 * - isClothHalfDay (1)
 * - isRoomHalfDay (1)
 * - iFortressHalfDay (1)
 * - isHQHalfDay (1)
 * - loginCnt (4)
 * - inviter (4)
 * - newInviteeCnt (4)
 * - vipLevel (4)
 * - vipValue (4)
 * - vipStage (4)
 * - autoCharge (4)
 * - vipEndTime (4)
 * - freshManBonus (4)
 * - nonoChipList (80 bytes)
 * - dailyResArr (50 bytes)
 * - teacherID (4)
 * - studentID (4)
 * - graduationCount (4)
 * - maxPuniLv (4)
 * - petMaxLev (4)
 * - petAllNum (4)
 * - monKingWin (4)
 * - curStage (4)
 * - maxStage (4)
 * - curFreshStage (4)
 * - maxFreshStage (4)
 * - maxArenaWins (4)
 * - twoTimes (4)
 * - threeTimes (4)
 * - autoFight (4)
 * - autoFightTimes (4)
 * - energyTimes (4)
 * - learnTimes (4)
 * - monBtlMedal (4)
 * - recordCnt (4)
 * - obtainTm (4)
 * - soulBeadItemID (4)
 * - expireTm (4)
 * - fuseTimes (4)
 * - hasNono (4)
 * - superNono (4)
 * - nonoState (4): 32 bits
 * - nonoColor (4)
 * - nonoNick (16 UTF bytes)
 * - teamInfo (variable)
 * - teamPKInfo (variable)
 * - padding (1)
 * - badge (4)
 * - reserved (27 bytes)
 */
export declare class LoginRspProto extends BaseProto {
    userId: number;
    regTime: number;
    nickname: string;
    vip: boolean;
    viped: boolean;
    dsFlag: number;
    color: number;
    texture: number;
    energy: number;
    coins: number;
    fightBadge: number;
    mapId: number;
    posX: number;
    posY: number;
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
    nonoChipList: boolean[];
    dailyResArr: number[];
    teacherID: number;
    studentID: number;
    graduationCount: number;
    maxPuniLv: number;
    petMaxLev: number;
    petAllNum: number;
    monKingWin: number;
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
    badge: number;
    taskList: number[];
    petList: any[];
    clothList: Array<{
        id: number;
        level: number;
    }>;
    curTitle: number;
    bossAchievement: boolean[];
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=LoginRspProto.d.ts.map