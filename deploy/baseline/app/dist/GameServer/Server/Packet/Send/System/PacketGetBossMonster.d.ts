import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * GET_BOSS_MONSTER 响应包
 * CMD 8004
 *
 * 用于服务器主动推送精灵给玩家
 */
export declare class PacketGetBossMonster extends BaseProto {
    private _data;
    constructor(petID: number, captureTm: number, bonusID?: number, items?: Array<{
        itemID: number;
        itemCnt: number;
    }>);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetBossMonster.d.ts.map