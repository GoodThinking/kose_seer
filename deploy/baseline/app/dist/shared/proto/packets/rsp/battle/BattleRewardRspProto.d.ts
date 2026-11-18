import { BaseProto } from '../../../base/BaseProto';
/**
 * 战斗奖励响应（物品奖励弹窗）
 * CMD 2202: COMPLETE_TASK
 *
 * 客户端期望的格式（NoviceFinishInfo）：
 * taskId(4) + petId(4) + captureTm(4) + itemCount(4) + [itemId(4) + itemCount(4)]...
 *
 * 注意：虽然使用 COMPLETE_TASK 命令ID，但这是战斗奖励，不是真正的任务完成
 * 客户端会根据 monBallList 显示 ItemInBagAlert 弹窗
 */
export declare class BattleRewardRspProto extends BaseProto {
    taskId: number;
    petId: number;
    captureTm: number;
    items: Array<{
        itemId: number;
        itemCnt: number;
    }>;
    constructor();
    serialize(): Buffer;
    deserialize(_buffer: Buffer): void;
}
//# sourceMappingURL=BattleRewardRspProto.d.ts.map