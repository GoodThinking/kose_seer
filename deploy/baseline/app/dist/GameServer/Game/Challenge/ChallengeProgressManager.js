"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeProgressManager = void 0;
const BaseManager_1 = require("../Base/BaseManager");
const Logger_1 = require("../../../shared/utils/Logger");
const BossAbilityConfig_1 = require("../Battle/BossAbility/BossAbilityConfig");
const DatabaseHelper_1 = require("../../../DataBase/DatabaseHelper");
const PuniConfig_1 = require("../../../shared/config/game/PuniConfig");
const EventTypes_1 = require("../Event/EventTypes");
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
class ChallengeProgressManager extends BaseManager_1.BaseManager {
    _data;
    constructor(player) {
        super(player);
    }
    // ==================== 事件注册 ====================
    /**
     * 注册事件监听
     * - 监听战斗结束事件，处理谱尼封印和SPT BOSS进度
     */
    RegisterEvents(eventBus) {
        eventBus.On(EventTypes_1.BattleEventType.BATTLE_END, this.OnBattleEnd.bind(this), 50);
    }
    /**
     * 战斗结束事件处理
     */
    OnBattleEnd(event) {
        if (!event.isVictory)
            return;
        // 谱尼封印挑战
        if (event.extra.puniDoorIndex) {
            this.OnPuniBattleVictory(event.extra.puniDoorIndex);
        }
        if (event.extra.alderDoorIndex) {
            this.OnAlderBattleVictory(event.extra.alderDoorIndex);
        }
        // 注意：SPT BOSS 击败标记已在 BattleRewardService.ProcessSPTFirstDefeatReward 中处理
        // 事件处理器不再重复标记，避免双重调用
    }
    /**
     * 初始化（加载挑战进度数据）
     */
    async Initialize() {
        // 从数据库加载挑战进度数据
        this._data = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_ChallengeProgressData(this.UserID);
        Logger_1.Logger.Info(`[ChallengeProgressManager] 初始化完成: UserID=${this.UserID}, ` +
            `SPT击败=${this.GetDefeatedCount()}, 谱尼进度=${this._data.maxPuniLv}, 勇者之塔=${this._data.towerBossIndex}`);
    }
    // ==================== SPT BOSS 挑战进度 ====================
    /**
     * 检查是否已击败指定的SPT BOSS
     * @param sptId SPT任务ID (1-20)
     * @returns 是否已击败
     */
    HasDefeatedSPTBoss(sptId) {
        if (sptId < 1 || sptId > 200) {
            Logger_1.Logger.Warn(`[ChallengeProgressManager] 无效的SPT ID: ${sptId}`);
            return false;
        }
        const index = sptId - 1;
        return this._data.bossAchievement[index] === true;
    }
    /**
     * 标记SPT BOSS为已击败
     * @param sptId SPT任务ID (1-20)
     */
    MarkSPTBossDefeated(sptId) {
        if (sptId < 1 || sptId > 200) {
            Logger_1.Logger.Warn(`[ChallengeProgressManager] 无效的SPT ID: ${sptId}`);
            return;
        }
        const index = sptId - 1;
        if (this._data.bossAchievement[index]) {
            Logger_1.Logger.Debug(`[ChallengeProgressManager] SPT BOSS已击败过: SPTId=${sptId}`);
            return;
        }
        this._data.bossAchievement[index] = true;
        Logger_1.Logger.Info(`[ChallengeProgressManager] 标记SPT BOSS已击败: UserID=${this.UserID}, SPTId=${sptId}`);
    }
    /**
     * 根据地图ID和param2检查是否已击败对应的BOSS
     * @param mapId 地图ID
     * @param param2 参数2
     * @returns 是否已击败
     */
    HasDefeatedBoss(mapId, param2) {
        const bossConfig = BossAbilityConfig_1.BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
        if (!bossConfig || !bossConfig.spt || !bossConfig.spt.sptId) {
            return false;
        }
        return this.HasDefeatedSPTBoss(bossConfig.spt.sptId);
    }
    /**
     * 标记BOSS为已击败（根据地图ID和param2）
     * @param mapId 地图ID
     * @param param2 参数2
     * @returns 是否成功标记
     */
    MarkBossDefeated(mapId, param2) {
        const bossConfig = BossAbilityConfig_1.BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
        if (!bossConfig || !bossConfig.spt || !bossConfig.spt.sptId) {
            Logger_1.Logger.Debug(`[BossAchievementManager] BOSS不是SPT BOSS，无需标记: MapId=${mapId}, Param2=${param2}`);
            return false;
        }
        this.MarkSPTBossDefeated(bossConfig.spt.sptId);
        return true;
    }
    /**
     * 获取已击败的SPT BOSS数量
     * @returns 已击败的BOSS数量
     */
    GetDefeatedCount() {
        let count = 0;
        for (let i = 0; i < 200; i++) {
            if (this._data.bossAchievement[i]) {
                count++;
            }
        }
        return count;
    }
    /**
     * 获取已击败的SPT BOSS ID列表
     * @returns SPT ID数组
     */
    GetDefeatedSPTIds() {
        const sptIds = [];
        for (let i = 0; i < 200; i++) {
            if (this._data.bossAchievement[i]) {
                sptIds.push(i + 1); // sptId从1开始
            }
        }
        return sptIds;
    }
    /**
     * 获取BOSS成就数据（用于登录时发送给客户端）
     * @returns 200字节的Buffer
     */
    GetAchievementBuffer() {
        const buffer = Buffer.alloc(200);
        for (let i = 0; i < 200; i++) {
            buffer[i] = this._data.bossAchievement[i] ? 1 : 0;
        }
        return buffer;
    }
    /**
     * 获取SPT BOSS统计信息
     */
    GetSPTBossStats() {
        const totalDefeated = this.GetDefeatedCount();
        const stats = BossAbilityConfig_1.BossAbilityConfig.Instance.GetStats();
        const totalSPTBosses = stats.sptBosses;
        const completionRate = totalSPTBosses > 0 ? (totalDefeated / totalSPTBosses) * 100 : 0;
        return {
            totalDefeated,
            totalSPTBosses,
            completionRate
        };
    }
    // ==================== 谱尼封印挑战进度 ====================
    /**
     * 获取谱尼封印进度（0-8）
     * 0=未开启，1-7=封印进度，8=解锁真身
     */
    GetPuniLevel() {
        const level = this._data.maxPuniLv || 0;
        // 容错修正异常值
        if (level < 0 || level > 8) {
            Logger_1.Logger.Warn(`[ChallengeProgressManager] 谱尼进度异常，修正为0: UserID=${this.UserID}, Level=${level}`);
            this._data.maxPuniLv = 0;
            return 0;
        }
        return level;
    }
    /**
     * 设置谱尼封印进度
     * @param level 进度等级（0-8）
     */
    SetPuniLevel(level) {
        if (level < 0 || level > 8) {
            Logger_1.Logger.Warn(`[ChallengeProgressManager] 无效的谱尼进度: ${level}`);
            return;
        }
        const oldLevel = this.GetPuniLevel();
        if (level > oldLevel) {
            this._data.maxPuniLv = level;
            Logger_1.Logger.Info(`[ChallengeProgressManager] 更新谱尼进度: UserID=${this.UserID}, ${oldLevel} -> ${level}`);
        }
    }
    /**
     * 检查是否已解锁指定的谱尼封印
     * @param door 封印门号（1-7）或真身（8）
     * @returns 是否已解锁
     */
    HasUnlockedPuniDoor(door) {
        if (door < 1 || door > 8) {
            return false;
        }
        const currentLevel = this.GetPuniLevel();
        // 封印1-7：需要 maxPuniLv >= door-1
        if (door >= 1 && door <= 7) {
            return currentLevel >= door - 1;
        }
        // 真身（8）：需要 maxPuniLv >= 7
        if (door === 8) {
            return currentLevel >= 7;
        }
        return false;
    }
    /**
     * 谱尼战斗胜利后更新进度
     * @param door 封印门号（1-7）或真身（8）
     */
    OnPuniBattleVictory(door) {
        if (door < 1 || door > 8) {
            return;
        }
        const currentLevel = this.GetPuniLevel();
        let targetLevel = currentLevel;
        // 封印1-7：更新到对应门号
        if (door >= 1 && door <= 7) {
            if (currentLevel < door) {
                targetLevel = door;
            }
        }
        // 真身（8）：解锁真身
        if (door === 8) {
            if (currentLevel < 8) {
                targetLevel = 8;
            }
        }
        if (targetLevel !== currentLevel) {
            this.SetPuniLevel(targetLevel);
            Logger_1.Logger.Info(`[ChallengeProgressManager] 谱尼战胜利: Door=${door}, Level ${currentLevel} -> ${targetLevel}`);
        }
    }
    // ==================== 光明异能王·奥尔德挑战进度 ====================
    GetAlderLevel() {
        const level = this._data.maxAlderLv || 0;
        if (level < 0 || level > 7) {
            Logger_1.Logger.Warn(`[ChallengeProgressManager] 奥尔德进度异常，修正为0: UserID=${this.UserID}, Level=${level}`);
            this._data.maxAlderLv = 0;
            return 0;
        }
        return level;
    }
    SetAlderLevel(level) {
        if (level < 0 || level > 7) {
            Logger_1.Logger.Warn(`[ChallengeProgressManager] 无效的奥尔德进度: ${level}`);
            return;
        }
        const oldLevel = this.GetAlderLevel();
        if (level > oldLevel) {
            this._data.maxAlderLv = level;
            Logger_1.Logger.Info(`[ChallengeProgressManager] 更新奥尔德进度: UserID=${this.UserID}, ${oldLevel} -> ${level}`);
        }
    }
    HasUnlockedAlderDoor(door) {
        if (door < 1 || door > 7) return false;
        const level = this.GetAlderLevel();
        return door <= 6 ? level >= door - 1 : level >= 6;
    }
    OnAlderBattleVictory(door) {
        if (door < 1 || door > 7) return;
        const current = this.GetAlderLevel();
        this.SetAlderLevel(door === 7 ? 7 : Math.max(current, door));
        Logger_1.Logger.Info(`[ChallengeProgressManager] 奥尔德战胜利: Door=${door}, Level ${current} -> ${this.GetAlderLevel()}`);
    }
    // ==================== 谱尼封印配置查询 ====================
    /**
     * 获取谱尼封印配置
     * @param door 封印门号（1-8）
     */
    GetPuniSealConfig(door) {
        return PuniConfig_1.PuniConfig.Instance.GetSeal(door);
    }
    /**
     * 获取所有谱尼封印配置
     */
    GetAllPuniSeals() {
        return PuniConfig_1.PuniConfig.Instance.GetAllSeals();
    }
    /**
     * 获取谱尼封印数量
     */
    GetPuniSealCount() {
        return PuniConfig_1.PuniConfig.Instance.GetSealCount();
    }
    // ==================== 勇者之塔挑战进度 ====================
    /**
     * 获取勇者之塔当前层已击败的BOSS数（0/1/2）
     */
    GetTowerBossIndex() {
        return this._data.towerBossIndex || 0;
    }
    /**
     * 设置勇者之塔当前层已击败的BOSS数
     * @param index BOSS索引（0/1/2）
     */
    SetTowerBossIndex(index) {
        if (index < 0 || index > 2) {
            Logger_1.Logger.Warn(`[ChallengeProgressManager] 无效的勇者之塔BOSS索引: ${index}`);
            return;
        }
        this._data.towerBossIndex = index;
        Logger_1.Logger.Info(`[ChallengeProgressManager] 更新勇者之塔进度: UserID=${this.UserID}, BossIndex=${index}`);
    }
    /**
     * 勇者之塔BOSS战斗胜利后更新进度
     */
    OnTowerBossVictory() {
        const currentIndex = this.GetTowerBossIndex();
        if (currentIndex < 2) {
            this.SetTowerBossIndex(currentIndex + 1);
            Logger_1.Logger.Info(`[ChallengeProgressManager] 勇者之塔BOSS击败: ${currentIndex} -> ${currentIndex + 1}`);
        }
    }
    /**
     * 重置勇者之塔当前层进度（进入新层时调用）
     */
    ResetTowerBossIndex() {
        this.SetTowerBossIndex(0);
        Logger_1.Logger.Info(`[ChallengeProgressManager] 重置勇者之塔当前层进度: UserID=${this.UserID}`);
    }
    // ==================== 通用方法 ====================
    /**
     * 获取所有挑战进度统计
     */
    GetAllStats() {
        const sptStats = this.GetSPTBossStats();
        const puniLevel = this.GetPuniLevel();
        const unlockedDoors = [];
        for (let door = 1; door <= 8; door++) {
            if (this.HasUnlockedPuniDoor(door)) {
                unlockedDoors.push(door);
            }
        }
        return {
            sptBoss: sptStats,
            puni: {
                currentLevel: puniLevel,
                maxLevel: 8,
                unlockedDoors,
                hasTrueForm: puniLevel >= 7
            },
            tower: {
                currentBossIndex: this.GetTowerBossIndex(),
                maxBossIndex: 2
            }
        };
    }
    /**
     * 重置所有挑战进度（调试用）
     */
    ResetAll() {
        this._data.bossAchievement = new Array(200).fill(false);
        this._data.maxPuniLv = 0;
        this._data.towerBossIndex = 0;
        Logger_1.Logger.Info(`[ChallengeProgressManager] 重置所有挑战进度: UserID=${this.UserID}`);
    }
}
exports.ChallengeProgressManager = ChallengeProgressManager;
//# sourceMappingURL=ChallengeProgressManager.js.map