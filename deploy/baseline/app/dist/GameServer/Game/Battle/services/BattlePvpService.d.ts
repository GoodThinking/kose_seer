import { PlayerInstance } from '../../Player/PlayerInstance';
import { IBattleInfo, IBattlePet, ITurnResult } from '../../../../shared/models/BattleModel';
import { BattleInitService } from './BattleInitService';
import { BattleTurnService } from './BattleTurnService';
/**
 * PvP战斗服务
 * 处理PvP战斗的准备、回合结算、换精灵等逻辑
 * 从 BattleManager 中拆分出来，减少主类体积
 */
export declare class BattlePvpService {
    private _player;
    private _initService;
    private _turnService;
    /**
     * 获取/设置当前战斗实例的回调
     * 由 BattleManager 注入，避免循环依赖
     */
    private _getBattle;
    private _getHPMap;
    private _updateBattlePet;
    private _buildAttackValuePair;
    private _deductSkillPP;
    private _sendFightOverPacket;
    private _handleFightOver;
    private _syncBattlePetHP;
    private _cleanupBattle;
    private _initializeBattle;
    constructor(player: PlayerInstance, initService: BattleInitService, turnService: BattleTurnService, callbacks: {
        getBattle: () => IBattleInfo | null;
        getHPMap: () => Map<number, number>;
        updateBattlePet: (battlePet: IBattlePet, newPet: any, petConfig: any) => void;
        buildAttackValuePair: (result: ITurnResult, pet1UserId: number, pet2UserId: number) => {
            firstAttack: any;
            secondAttack: any;
        };
        deductSkillPP: (pet: IBattlePet, skillId: number) => void;
        sendFightOverPacket: (player: PlayerInstance, reason: number, winnerId: number) => Promise<void>;
        handleFightOver: (winnerId: number, reason: number) => Promise<void>;
        syncBattlePetHP: () => Promise<void>;
        cleanupBattle: () => void;
        initializeBattle: (battle: IBattleInfo) => void;
    });
    private get battle();
    private get hpMap();
    private CaptureStatusSnapshot;
    private EmitForBothPlayers;
    /**
     * 处理PVP战斗准备
     */
    HandleReadyToFight(pvpRoom: any): Promise<void>;
    /**
     * 创建PVP战斗实例
     */
    CreateBattle(player1: PlayerInstance, player2: PlayerInstance): Promise<IBattleInfo | null>;
    /**
     * 处理PVP战斗中的技能使用
     */
    HandleUseSkill(skillId: number): Promise<void>;
    /**
     * 处理PVP换精灵动作提交
     * @returns true 如果双方都已提交动作（已触发 ResolveTurn）
     */
    HandleChangePetAction(catchTime: number): Promise<boolean>;
    /**
     * PVP回合结算
     */
    ResolveTurn(): Promise<void>;
    /**
     * 执行PVP换精灵
     */
    private ExecuteChangePet;
    /**
     * 检查PVP战斗结束条件
     */
    private CheckBattleEnd;
    /**
     * 通知PvP对手战斗结束
     */
    NotifyOpponentFightOver(reason: number, winnerId: number): Promise<void>;
    /**
     * 玩家登出时处理PVP战斗
     */
    OnLogout(): Promise<void>;
}
//# sourceMappingURL=BattlePvpService.d.ts.map