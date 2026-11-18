import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 获取详细用户信息响应包
 * CMD 1006
 */
export declare class PacketGetMoreUserInfo extends BaseProto {
    private _data;
    constructor(userId: number, nick: string, regTime?: number, petAllNum?: number, petMaxLev?: number, bossAchievement?: string, graduationCount?: number, monKingWin?: number, messWin?: number, maxStage?: number, maxArenaWins?: number, curTitle?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetMoreUserInfo.d.ts.map