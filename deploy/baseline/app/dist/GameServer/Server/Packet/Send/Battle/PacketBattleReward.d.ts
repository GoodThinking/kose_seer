import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 战斗奖励包（显示物品奖励弹窗）
 *
 * 客户端会显示 ItemInBagAlert 弹窗：
 * - 如果有物品奖励，逐个显示物品获得弹窗
 * - 如果有精灵奖励，显示精灵获得提示
 *
 * 特殊物品ID：
 * - 1: 赛尔豆（金币）
 * - 3: 积累经验
 * - 500001-600000: 基地仓库物品
 * - 600001-700000: 投掷道具
 * - 其他: 储存箱物品
 */
export declare class PacketBattleReward extends BaseProto {
    private _data;
    /**
     * @param items 物品奖励列表
     * @param petId 奖励精灵ID（可选）
     * @param captureTm 捕获时间（可选）
     * @param result 结果码（0=成功）
     */
    constructor(items: Array<{
        itemId: number;
        itemCnt: number;
    }>, petId?: number, captureTm?: number, result?: number);
    serialize(): Buffer;
    deserialize(_buffer: Buffer): void;
}
//# sourceMappingURL=PacketBattleReward.d.ts.map