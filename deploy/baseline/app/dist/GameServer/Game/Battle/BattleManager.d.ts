import { BaseManager } from '../Base/BaseManager';
import { PlayerInstance } from '../Player/PlayerInstance';
import { IBattleInfo } from '../../../shared/models/BattleModel';
import { SimplePetInfoProto } from '../../../shared/proto/common/SimplePetInfoProto';
import { GameEventBus } from '../Event/GameEventBus';
/**
 * 战斗管理器
 * 处理PvE战斗逻辑：挑战BOSS、准备战斗、使用技能、捕捉精灵等
 * PvP逻辑委托给 BattlePvpService
 *
 * 架构说明：
 * - Manager 负责协调各个 Service
 * - BattlePvpService 处理所有PvP相关逻辑
 * - BattleInitService / BattleTurnService / BattleRewardService 处理具体业务
 * - 使用 BattleConverter 简化 Proto 构建
 */
export declare class BattleManager extends BaseManager {
    private _initService;
    private _turnService;
    private _rewardService;
    private _pvpService;
    private _currentBattle;
    private _currentBattleSlot;
    private _currentBattleMapId;
    private _currentBattleOriginalPetId;
    private _battlePetHPMap;
    private _emittedDeadCatchTimes;
    constructor(player: PlayerInstance);
    RegisterEvents(eventBus: GameEventBus): void;
    private OnPlayerLogoutEvent;
    /**
     * 扣除技能PP
     */
    private DeductSkillPP;
    /**
     * 构建不攻击的回合结果（换精灵/使用道具时玩家不攻击）
     */
    private BuildNoActionAttackResult;
    /**
     * 统一构建攻击结果Proto对
     * 包含关键的 firstAttack.attackerRemainHp 修正
     */
    private BuildAttackValuePair;
    /**
     * 更新玩家精灵HP记录
     */
    private UpdatePlayerHPRecord;
    private GetBattleTypeForEvent;
    private CaptureStatusSnapshot;
    private EmitBattleStartEvent;
    private EmitRoundStartEvent;
    private EmitRoundEndEvent;
    private EmitAttackResultEvents;
    private EmitStatusChangeEvents;
    private EmitPetDeadEventsIfNeeded;
    /**
     * PvE精灵阵亡检查
     * 检查玩家精灵是否阵亡，同步HP，检查是否还有健康精灵
     * @returns true 表示已处理（调用方应return），false 表示未阵亡
     */
    private CheckPlayerPetDeath;
    /**
     * PvE敌方反击并发送结果（换精灵/捕捉失败后）
     */
    private ExecuteEnemyCounterAndSend;
    /**
     * 换精灵验证
     * @returns 验证通过返回 { newPet, petConfig }，失败返回 null（已发送错误包）
     */
    private ValidateChangePet;
    /**
     * 发送战斗结束包给指定玩家
     */
    private SendFightOverPacket;
    /**
     * PvE战斗结束后清理地图（移除野怪、推送更新）
     */
    private CleanupPveMap;
    /**
     * 更新战斗中的精灵数据
     * 用于更换精灵时更新战斗状态
     */
    private UpdateBattlePet;
    /**
     * 同步战斗精灵HP到玩家精灵数据
     * 战斗结束时调用，将战斗中的HP变化同步回数据库
     */
    private SyncBattlePetHP;
    /**
     * 初始化战斗前的准备工作
     * 清理旧战斗数据，初始化HP记录
     */
    private InitializeBattle;
    /**
     * 清理战斗数据
     */
    private CleanupBattle;
    /**
     * 处理挑战野外精灵
     * CMD 2408: FIGHT_NPC_MONSTER
     * 发送 2408 确认 + NOTE_READY_TO_FIGHT (2503)
     */
    HandleFightNpcMonster(monsterIndex: number): Promise<void>;
    /**
     * 处理挑战BOSS
     * CMD 2411: CHALLENGE_BOSS
     * 发送 2411 确认 + NOTE_READY_TO_FIGHT (2503)
     *
     * 1. 优先从 (mapId, param2) 查找BOSS配置
     * 2. 如果未找到且该地图有param2=0的配置，回退到param2=0
     * 3. 如果仍未找到，记录警告
     */
    HandleChallengeBoss(mapId: number, param2: number): Promise<void>;
    /**
     * 处理盖亚挑战
     * CMD 2421: FIGHT_SPECIAL_PET
     *
     * 逻辑与 go-server handleChallengeBoss 一致：
     * - 优先从配置获取BOSS
     * - 未匹配到配置时回退到盖亚
     */
    HandleFightSpecialPet(mapId: number, param2: number): Promise<void>;
    /**
     * 处理准备战斗
     * CMD 2404: READY_TO_FIGHT
     * 发送 NOTE_START_FIGHT (2504)
     */
    HandleReadyToFight(): Promise<void>;
    /**
     * 处理使用技能
     * CMD 2405: USE_SKILL
     */
    HandleUseSkill(skillId: number): Promise<void>;
    /**
     * 处理战斗结束
     */
    private HandleFightOver;
    /**
     * 处理使用精灵道具
     * CMD 2406: USE_PET_ITEM
     */
    HandleUsePetItem(itemId: number): Promise<void>;
    /**
     * 处理更换精灵
     * CMD 2407: CHANGE_PET
     */
    HandleChangePet(catchTime: number): Promise<void>;
    /**
     * 处理捕捉精灵
     * CMD 2409: CATCH_MONSTER
     * @param capsuleID 胶囊物品ID
     */
    HandleCatchMonster(capsuleID?: number): Promise<void>;
    /**
     * 处理逃跑
     * CMD 2410: ESCAPE_FIGHT
     */
    HandleEscapeFight(): Promise<void>;
    /**
     * 获取当前战斗状态
     */
    GetCurrentBattle(): IBattleInfo | null;
    /**
     * 玩家登出时清理战斗
     */
    OnLogout(): Promise<void>;
    /**
     * 构建玩家背包中所有精灵的SimplePetInfoProto数组
     */
    BuildPlayerPetsInfo(): SimplePetInfoProto[];
    /**
     * 发送战斗准备通知 (NOTE_READY_TO_FIGHT)
     */
    private SendReadyToFight;
    /**
     * 检查是否是BOSS战斗
     */
    private IsBossBattle;
    /**
     * 发送BOSS移除通知
     */
    private SendBossRemovalNotification;
    /**
     * 发送野怪列表更新
     */
    private SendOgreListUpdate;
}
//# sourceMappingURL=BattleManager.d.ts.map