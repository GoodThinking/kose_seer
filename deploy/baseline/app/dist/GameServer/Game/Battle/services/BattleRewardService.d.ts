import { PlayerInstance } from '../../Player/PlayerInstance';
import { IBattleInfo } from '../../../../shared/models/BattleModel';
/**
 * 战斗奖励服务
 * 负责处理战斗胜利后的奖励：经验、金币、捕获等
 */
export declare class BattleRewardService {
    private _player;
    constructor(player: PlayerInstance);
    /**
     * 处理战斗胜利奖励
     * @param userId 玩家ID
     * @param battle 战斗信息
     * @param mapId 地图ID（可选，用于读取配置）
     * @param slot 野怪槽位（可选，用于读取配置）
     * @param originalPetId 原始精灵ID（可选，用于查找配置，闪光精灵需要用原始ID查找）
     */
    ProcessVictoryReward(userId: number, battle: IBattleInfo, mapId?: number, slot?: number, originalPetId?: number): Promise<{
        expGained: number;
        coinsGained: number;
        levelUp: boolean;
        newLevel: number;
        droppedItems: {
            itemId: number;
            count: number;
        }[];
        rewardItems: Array<{
            itemId: number;
            itemCnt: number;
        }>;
    }>;
    /**
     * 处理SPT首次击败奖励
     * @param battle 战斗信息
     * @param mapId 地图ID（用于周几规则验证）
     * @returns 奖励物品列表
     */
    private ProcessSPTFirstDefeatReward;
    /**
     * 处理精灵捕获
     * @param userId 玩家ID
     * @param battle 战斗信息
     * @param catchTime 捕获时间
     * @param mapId 地图ID（可选，用于检查是否可捕获）
     * @param slot 野怪槽位（可选，用于检查是否可捕获）
     */
    ProcessCatch(userId: number, battle: IBattleInfo, catchTime: number, mapId?: number, slot?: number): Promise<boolean>;
    /**
     * 计算经验奖励
     * 优先从配置读取，否则使用默认计算
     */
    private CalculateExpReward;
    /**
     * 计算金币奖励
     */
    private CalculateCoinsReward;
    /**
     * 处理掉落物品
     */
    private ProcessDropItems;
    /**
     * 检查精灵是否可以捕获
     */
    private IsCatchable;
    /**
     * 获取野怪配置
     */
    private GetOgreConfig;
}
//# sourceMappingURL=BattleRewardService.d.ts.map