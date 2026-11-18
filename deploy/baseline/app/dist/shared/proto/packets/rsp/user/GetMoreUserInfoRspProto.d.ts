import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2052] 获取更多用户信息响应
 *
 * 客户端格式（UserInfo.setForMoreInfo）：
 * - userID: uint32
 * - nick: string (16字节，UTF-8)
 * - regTime: uint32 (注册时间)
 * - petAllNum: uint32 (精灵总数)
 * - petMaxLev: uint32 (精灵最高等级)
 * - bossAchievement: byte[200] (BOSS成就，200个字节)
 * - graduationCount: uint32 (毕业次数)
 * - monKingWin: uint32 (怪物王胜利次数)
 * - messWin: uint32 (混战胜利次数)
 * - maxStage: uint32 (最高关卡)
 * - maxArenaWins: uint32 (竞技场最高连胜)
 * - curTitle: uint32 (当前称号)
 */
export declare class GetMoreUserInfoRspProto extends BaseProto {
    userID: number;
    nick: string;
    regTime: number;
    petAllNum: number;
    petMaxLev: number;
    bossAchievement: boolean[];
    graduationCount: number;
    monKingWin: number;
    messWin: number;
    maxStage: number;
    maxArenaWins: number;
    curTitle: number;
    constructor();
    serialize(): Buffer;
    setUserID(value: number): this;
    setNick(value: string): this;
    setRegTime(value: number): this;
    setPetAllNum(value: number): this;
    setPetMaxLev(value: number): this;
    setBossAchievement(value: boolean[]): this;
    setGraduationCount(value: number): this;
    setMonKingWin(value: number): this;
    setMessWin(value: number): this;
    setMaxStage(value: number): this;
    setMaxArenaWins(value: number): this;
    setCurTitle(value: number): this;
}
//# sourceMappingURL=GetMoreUserInfoRspProto.d.ts.map