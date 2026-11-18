import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取详细用户信息响应
 * CMD: 2052 GET_MORE_USERINFO
 */
export declare class GetMoreUserInfoRspProto extends BaseProto {
    userId: number;
    nick: string;
    regTime: number;
    petAllNum: number;
    petMaxLev: number;
    bossAchievement: string;
    graduationCount: number;
    monKingWin: number;
    messWin: number;
    maxStage: number;
    maxArenaWins: number;
    curTitle: number;
    constructor();
    setUserId(value: number): this;
    setNick(value: string): this;
    setRegTime(value: number): this;
    setPetAllNum(value: number): this;
    setPetMaxLev(value: number): this;
    setBossAchievement(value: string): this;
    setGraduationCount(value: number): this;
    setMonKingWin(value: number): this;
    setMessWin(value: number): this;
    setMaxStage(value: number): this;
    setMaxArenaWins(value: number): this;
    setCurTitle(value: number): this;
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=GetMoreUserInfoRspProto.d.ts.map