import { BaseProto } from '../../../base/BaseProto';
/**
 * GET_BOSS_MONSTER 响应协议
 * CMD 8004
 *
 * 用于服务器主动推送精灵给玩家（BOSS精灵、GM发送等）
 *
 * 响应格式:
 * - bonusID: uint32 (奖励ID，通常为0)
 * - petID: uint32 (精灵ID)
 * - captureTm: uint32 (捕获时间/catchTime)
 * - itemCount: uint32 (物品数量)
 * - items: Array<{itemID: uint32, itemCnt: uint32}> (物品列表)
 */
export declare class GetBossMonsterRspProto extends BaseProto {
    bonusID: number;
    petID: number;
    captureTm: number;
    items: Array<{
        itemID: number;
        itemCnt: number;
    }>;
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=GetBossMonsterRspProto.d.ts.map