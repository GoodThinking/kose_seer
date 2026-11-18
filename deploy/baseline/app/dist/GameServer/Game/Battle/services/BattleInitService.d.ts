import { PlayerInstance } from '../../Player/PlayerInstance';
import { IBattleInfo } from '../../../../shared/models/BattleModel';
/**
 * 战斗初始化服务
 * 负责创建战斗实例、初始化精灵数据
 */
export declare class BattleInitService {
    private _player;
    constructor(player: PlayerInstance);
    /**
     * 获取玩家首发精灵（必须是健康的）
     * 优先选择首发精灵，如果首发精灵死亡则选择第一个健康的精灵
     */
    private GetPlayerPet;
    /**
     * 构建玩家战斗精灵数据
     */
    private BuildPlayerBattlePet;
    /**
     * 构建敌人战斗精灵数据
     */
    private BuildEnemyBattlePet;
    /**
     * 触发战斗被动能力
     */
    private TriggerPassiveAbilities;
    /**
     * 创建PVE战斗（玩家 vs BOSS/野怪）
     */
    CreatePVEBattle(enemyId: number, enemyLevel: number): Promise<IBattleInfo | null>;
    /**
     * 构建BOSS战斗精灵数据
     */
    private BuildBossBattlePet;
    /**
     * 创建BOSS战斗（使用mapId和param2从配置读取完整信息）
     */
    CreateBossBattle(mapId: number, param2: number): Promise<IBattleInfo | null>;
    /**
     * 构建战斗精灵数据
     */
    private BuildBattlePet;
    /**
     * 计算敌人属性（使用BattleAlgorithm）
     */
    private CalculateEnemyStats;
    /**
     * 计算BOSS属性
     */
    private CalculateBossStats;
    /**
     * 获取敌人技能列表
     */
    private GetEnemySkills;
    /**
     * 验证战斗是否有效
     */
    ValidateBattle(battle: IBattleInfo | null): boolean;
    /**
     * 创建新手战斗（mapId=1）
     * 根据玩家精灵属性生成克制对手：草系→火系→水系→草系
     */
    private CreateFreshBattle;
}
//# sourceMappingURL=BattleInitService.d.ts.map