import { BaseManager } from '../Base/BaseManager';
import { PlayerInstance } from '../Player/PlayerInstance';
import { IPuniSeal } from '../../../shared/config/game/PuniConfig';
import { GameEventBus } from '../Event/GameEventBus';
/**
 * 挑战进度管理器
 * 管理玩家的各种挑战进度：
 * 1. SPT BOSS 击败记录（bossAchievement，200字节数组）
 * 2. 谱尼封印进度（maxPuniLv，0-8）
 * 3. 勇者之塔进度（towerBossIndex，当前层已击败BOSS数）
 * 4. 其他挑战进度...
 *
 * 数据存储：
 * - 使用独立的 player_challenge_progress 表
 * - bossAchievement 使用 BLOB 存储，减少 JSON 序列化开销
 * - 支持自动保存（通过 BaseData 的 Proxy 机制）
 *
 */
export declare class ChallengeProgressManager extends BaseManager {
    private _data;
    constructor(player: PlayerInstance);
    /**
     * 注册事件监听
     * - 监听战斗结束事件，处理谱尼封印和SPT BOSS进度
     */
    RegisterEvents(eventBus: GameEventBus): void;
    /**
     * 战斗结束事件处理
     */
    private OnBattleEnd;
    /**
     * 初始化（加载挑战进度数据）
     */
    Initialize(): Promise<void>;
    /**
     * 检查是否已击败指定的SPT BOSS
     * @param sptId SPT任务ID (1-20)
     * @returns 是否已击败
     */
    HasDefeatedSPTBoss(sptId: number): boolean;
    /**
     * 标记SPT BOSS为已击败
     * @param sptId SPT任务ID (1-20)
     */
    MarkSPTBossDefeated(sptId: number): void;
    /**
     * 根据地图ID和param2检查是否已击败对应的BOSS
     * @param mapId 地图ID
     * @param param2 参数2
     * @returns 是否已击败
     */
    HasDefeatedBoss(mapId: number, param2: number): boolean;
    /**
     * 标记BOSS为已击败（根据地图ID和param2）
     * @param mapId 地图ID
     * @param param2 参数2
     * @returns 是否成功标记
     */
    MarkBossDefeated(mapId: number, param2: number): boolean;
    /**
     * 获取已击败的SPT BOSS数量
     * @returns 已击败的BOSS数量
     */
    GetDefeatedCount(): number;
    /**
     * 获取已击败的SPT BOSS ID列表
     * @returns SPT ID数组
     */
    GetDefeatedSPTIds(): number[];
    /**
     * 获取BOSS成就数据（用于登录时发送给客户端）
     * @returns 200字节的Buffer
     */
    GetAchievementBuffer(): Buffer;
    /**
     * 获取SPT BOSS统计信息
     */
    GetSPTBossStats(): {
        totalDefeated: number;
        totalSPTBosses: number;
        completionRate: number;
    };
    /**
     * 获取谱尼封印进度（0-8）
     * 0=未开启，1-7=封印进度，8=解锁真身
     */
    GetPuniLevel(): number;
    /**
     * 设置谱尼封印进度
     * @param level 进度等级（0-8）
     */
    SetPuniLevel(level: number): void;
    /**
     * 检查是否已解锁指定的谱尼封印
     * @param door 封印门号（1-7）或真身（8）
     * @returns 是否已解锁
     */
    HasUnlockedPuniDoor(door: number): boolean;
    /**
     * 谱尼战斗胜利后更新进度
     * @param door 封印门号（1-7）或真身（8）
     */
    OnPuniBattleVictory(door: number): void;
    /**
     * 获取谱尼封印配置
     * @param door 封印门号（1-8）
     */
    GetPuniSealConfig(door: number): IPuniSeal | undefined;
    /**
     * 获取所有谱尼封印配置
     */
    GetAllPuniSeals(): IPuniSeal[];
    /**
     * 获取谱尼封印数量
     */
    GetPuniSealCount(): number;
    /**
     * 获取勇者之塔当前层已击败的BOSS数（0/1/2）
     */
    GetTowerBossIndex(): number;
    /**
     * 设置勇者之塔当前层已击败的BOSS数
     * @param index BOSS索引（0/1/2）
     */
    SetTowerBossIndex(index: number): void;
    /**
     * 勇者之塔BOSS战斗胜利后更新进度
     */
    OnTowerBossVictory(): void;
    /**
     * 重置勇者之塔当前层进度（进入新层时调用）
     */
    ResetTowerBossIndex(): void;
    /**
     * 获取所有挑战进度统计
     */
    GetAllStats(): {
        sptBoss: {
            totalDefeated: number;
            totalSPTBosses: number;
            completionRate: number;
        };
        puni: {
            currentLevel: number;
            maxLevel: number;
            unlockedDoors: number[];
            hasTrueForm: boolean;
        };
        tower: {
            currentBossIndex: number;
            maxBossIndex: number;
        };
    };
    /**
     * 重置所有挑战进度（调试用）
     */
    ResetAll(): void;
}
//# sourceMappingURL=ChallengeProgressManager.d.ts.map