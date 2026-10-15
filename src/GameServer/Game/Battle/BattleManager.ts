import { GetPetSkillPP, GetSkillMaxPP, ReconcilePetPP } from '../Pet/PetPP';
import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { PlayerInstance } from '../Player/PlayerInstance';
import { IBattleInfo, IBattlePet, IAttackResult, ITurnResult } from '../../../shared/models/BattleModel';
import { BattleInitService, BattleTurnService, BattleRewardService, BattlePvpService } from './services';
import { BattleConverter } from './BattleConverter';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { CommandID } from '../../../shared/protocol/CommandID';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { BattleEffectIntegration } from './BattleEffectIntegration';
import { BossSpecialRules } from './BossSpecialRules';
import { SimplePetInfoProto } from '../../../shared/proto/common/SimplePetInfoProto';
import { AttackValueProto } from '../../../shared/proto/common/AttackValueProto';
import {
  BattleEventType,
  IAttackResultEvent,
  IBattleEndEvent,
  IBattleRoundEndEvent,
  IBattleRoundStartEvent,
  IBattleStartEvent,
  ICatchResultEvent,
  IEscapeResultEvent,
  IPetDeadEvent,
  IPlayerLogoutEvent,
  IPetSwitchEvent,
  PlayerEventType,
  IStatusChangeEvent,
} from '../Event/EventTypes';
import { GameEventBus } from '../Event/GameEventBus';
import { BattleType } from '../../../shared/models/BattleModel';
import {
  PacketNoteReadyToFight,
  PacketNoteStartFight,
  PacketNoteUseSkill,
  PacketFightOver,
  PacketUsePetItem,
  PacketCatchMonster,
  PacketEscapeFight,
  PacketBattleReward,
  PacketChangePet
} from '../../Server/Packet/Send/Battle';
import { PacketMapBoss, PacketMapOgreList } from '../../Server/Packet/Send/Map';
import { PvpBattleManager } from './PvpBattleManager';
import { BossAbilityConfig } from './BossAbility';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { BattleCaptureSystem } from './BattleCaptureSystem';
import { ItemSystem, IItemInfo } from '../Item/ItemSystem';

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
export class BattleManager extends BaseManager {
  // 服务实例
  private _initService: BattleInitService;
  private _turnService: BattleTurnService;
  private _rewardService: BattleRewardService;
  private _pvpService: BattlePvpService;

  // 当前战斗实例（会话级别）
  private _currentBattle: IBattleInfo | null = null;
  private _catchInProgress = false;
  private _petItemInProgress = false;
  private _ppSaveInProgress = false;
  private _petRecoveryInProgress = false;
  private _petItemStorageUncertain = false;
  private _battleActionsInProgress = 0;
  private _battleEpoch = 0;
  private readonly _finishedBattles = new WeakSet<IBattleInfo>();
  private readonly _escapingBattles = new WeakSet<IBattleInfo>();

  // Packet dispatch is concurrent. Serialize consumable actions against other battle actions.
  private async RunBattleAction(command: number, action: () => Promise<void>): Promise<void> {
    if (this._catchInProgress || this._petItemInProgress || this._ppSaveInProgress || this._petRecoveryInProgress) {
      await this.Player.SendPacket(new PacketEmpty(command).setResult(5001));
      return;
    }
    this._battleActionsInProgress++;
    try { await action(); } finally { this._battleActionsInProgress--; }
  }

  /** Map entry/leave invalidates pending battle work before its first await, including same-map reentry. */
  public InvalidatePendingCapture(): void {
    this._battleEpoch++;
  }

  // 当前战斗的野怪槽位（用于战斗结束后刷新）
  private _currentBattleSlot: number = -1;
  private _currentBattleMapId: number = -1;
  private _currentBattleOriginalPetId: number = -1; // 原始精灵ID（用于查找配置）

  // 记录战斗中所有参与过的精灵HP（用于战斗结束时同步）
  private _battlePetHPMap: Map<number, number> = new Map(); // catchTime -> HP
  private readonly _battlePetPPMap = new Map<number, Map<number, number>>(); // PVE catchTime -> skillId -> PP
  private _emittedDeadCatchTimes: Set<number> = new Set();

  constructor(player: PlayerInstance) {
    super(player);

    // 初始化服务
    this._initService = new BattleInitService(player);
    this._turnService = new BattleTurnService();
    this._rewardService = new BattleRewardService(player);

    // 初始化PvP服务（通过回调桥接共享状态）
    this._pvpService = new BattlePvpService(player, this._initService, this._turnService, {
      getBattle: () => this._currentBattle,
      getHPMap: () => this._battlePetHPMap,
      updateBattlePet: (bp, np, pc) => this.UpdateBattlePet(bp, np, pc),
      buildAttackValuePair: (r, p1, p2) => this.BuildAttackValuePair(r, p1, p2),
      deductSkillPP: (pet, sid) => this.DeductSkillPP(pet, sid),
      sendFightOverPacket: (p, r, w) => this.SendFightOverPacket(p, r, w),
      handleFightOver: (w, r) => this.HandleFightOver(w, r),
      syncBattlePetHP: () => this.SyncBattlePetHP(),
      cleanupBattle: () => this.CleanupBattle(),
      initializeBattle: (b) => this.InitializeBattle(b),
    });
  }

  // ==================== 共享辅助方法 ====================

  public RegisterEvents(eventBus: GameEventBus): void {
    // Keep old logout sequence: map leave first, then battle/PVP cleanup.
    eventBus.On<IPlayerLogoutEvent>(PlayerEventType.LOGOUT, this.OnPlayerLogoutEvent.bind(this), 20);
  }

  private async OnPlayerLogoutEvent(_event: IPlayerLogoutEvent): Promise<void> {
    await this.OnLogout();
    PvpBattleManager.Instance.OnPlayerLogout(this.UserID);
  }

  /**
   * 扣除技能PP
   */
  private DeductSkillPP(pet: IBattlePet, skillId: number): void {
    const skillIndex = pet.skills.indexOf(skillId);
    if (skillIndex !== -1 && pet.skillPP && pet.skillPP[skillIndex] > 0) {
      pet.skillPP[skillIndex]--;
      this.RememberBattlePetPP(pet);
      Logger.Debug(`[BattleManager] 扣除技能PP: SkillId=${skillId}, 剩余PP=${pet.skillPP[skillIndex]}`);
    }
  }

  /** 2306/2310 are out-of-battle recovery, never a substitute for a 2406 turn. */
  public BeginOutOfBattleRecovery(): { isCurrent: () => boolean; release: () => void } | null {
    if (this._currentBattle || this._battleActionsInProgress || this._petRecoveryInProgress ||
        PvpBattleManager.Instance.GetPlayerRoom(this.UserID)) return null;
    const epoch = this._battleEpoch, mapId = this.Player.Data.mapID;
    this._petRecoveryInProgress = true;
    return {
      isCurrent: () => this._battleEpoch === epoch && this.Player.Data.mapID === mapId &&
        !this._currentBattle && !PvpBattleManager.Instance.GetPlayerRoom(this.UserID),
      release: () => { this._petRecoveryInProgress = false; },
    };
  }

  private RememberBattlePetPP(pet: IBattlePet): void {
    if (!this._currentBattle || this._currentBattle.isPvp || this._currentBattle.player !== pet || !pet.skillPP) return;
    this._battlePetPPMap.set(pet.catchTime, new Map(pet.skills.map((id, index) => [id, pet.skillPP![index]])));
  }

  /**
   * 构建不攻击的回合结果（换精灵/使用道具时玩家不攻击）
   */
  private BuildNoActionAttackResult(): IAttackResult {
    if (!this._currentBattle) throw new Error('No current battle');
    const playerStatusArray = new Array(20).fill(0);
    if (this._currentBattle.player.status !== undefined) {
      playerStatusArray[this._currentBattle.player.status] = 1;
    }
    return {
      userId: this.UserID,
      skillId: 0,
      atkTimes: 0,
      damage: 0,
      gainHp: 0,
      attackerRemainHp: this._currentBattle.player.hp,
      attackerMaxHp: this._currentBattle.player.maxHp,
      defenderRemainHp: this._currentBattle.enemy.hp,
      defenderMaxHp: this._currentBattle.enemy.maxHp,
      missed: false,
      blocked: false,
      isCrit: false,
      attackerStatus: playerStatusArray,
      attackerBattleLv: this._currentBattle.player.battleLv || []
    };
  }

  /**
   * 统一构建攻击结果Proto对
   * 包含关键的 firstAttack.attackerRemainHp 修正
   */
  private BuildAttackValuePair(
    result: ITurnResult, pet1UserId: number, pet2UserId: number
  ): { firstAttack: AttackValueProto; secondAttack: AttackValueProto } {
    if (!this._currentBattle) throw new Error('No current battle');

    // 判断谁是先手攻击者
    const firstAttackIsP1 = result.firstAttack?.userId === this._currentBattle.userId;
    const firstAttacker = firstAttackIsP1 ? this._currentBattle.player : this._currentBattle.enemy;
    const secondAttacker = firstAttackIsP1 ? this._currentBattle.enemy : this._currentBattle.player;

    // 重要：修正 firstAttack 的 attackerRemainHp
    // firstAttack 执行时记录的是攻击者当时的HP，但后手攻击后攻击者HP可能变了
    // 客户端用 remainHp - currentHp 计算HP变化动画，如果不修正会显示错误的回血/扣血
    if (result.firstAttack && firstAttacker) {
      result.firstAttack.attackerRemainHp = firstAttacker.hp;
    }

    const firstAttackUserId = firstAttackIsP1 ? pet1UserId : pet2UserId;
    const secondAttackUserId = firstAttackIsP1 ? pet2UserId : pet1UserId;
    const firstPet = firstAttackIsP1 ? this._currentBattle.player : this._currentBattle.enemy;
    const secondPet = firstAttackIsP1 ? this._currentBattle.enemy : this._currentBattle.player;

    const firstAttack = BattleConverter.ToAttackValue(
      result.firstAttack,
      firstAttackUserId,
      firstPet.hp, firstPet.maxHp, firstPet.status, firstPet.battleLv, firstPet.type,
      firstAttacker
    );

    const secondAttack = BattleConverter.ToAttackValue(
      result.secondAttack,
      secondAttackUserId,
      secondPet.hp, secondPet.maxHp, secondPet.status, secondPet.battleLv, secondPet.type,
      secondAttacker
    );

    return { firstAttack, secondAttack };
  }

  /**
   * 更新玩家精灵HP记录
   */
  private UpdatePlayerHPRecord(): void {
    if (this._currentBattle && this._currentBattle.player) {
      this._battlePetHPMap.set(
        this._currentBattle.player.catchTime,
        this._currentBattle.player.hp
      );
    }
  }

  private GetBattleTypeForEvent(battle: IBattleInfo): BattleType {
    if (battle.battleType) return battle.battleType;
    return battle.isPvp === true ? BattleType.PVP : BattleType.PVE;
  }

  private CaptureStatusSnapshot(): {
    player: { status?: number; turns: number };
    enemy: { status?: number; turns: number };
  } {
    if (!this._currentBattle) {
      return {
        player: { status: undefined, turns: 0 },
        enemy: { status: undefined, turns: 0 },
      };
    }

    return {
      player: {
        status: this._currentBattle.player.status,
        turns: this._currentBattle.player.statusTurns || 0,
      },
      enemy: {
        status: this._currentBattle.enemy.status,
        turns: this._currentBattle.enemy.statusTurns || 0,
      },
    };
  }

  private async EmitBattleStartEvent(): Promise<void> {
    if (!this._currentBattle) return;
    await this.Player.EventBus.Emit({
      type: BattleEventType.BATTLE_START,
      timestamp: Date.now(),
      playerId: this.UserID,
      battleType: this.GetBattleTypeForEvent(this._currentBattle),
      mapId: this._currentBattleMapId,
      playerPetId: this._currentBattle.player.petId,
      enemyPetId: this._currentBattle.enemy.petId,
      enemyLevel: this._currentBattle.enemy.level,
    } as IBattleStartEvent);
  }

  private async EmitRoundStartEvent(round: number): Promise<void> {
    if (!this._currentBattle) return;
    await this.Player.EventBus.Emit({
      type: BattleEventType.ROUND_START,
      timestamp: Date.now(),
      playerId: this.UserID,
      battleType: this.GetBattleTypeForEvent(this._currentBattle),
      mapId: this._currentBattleMapId,
      round,
    } as IBattleRoundStartEvent);
  }

  private async EmitRoundEndEvent(round: number, isOver: boolean, winnerId?: number): Promise<void> {
    if (!this._currentBattle) return;
    await this.Player.EventBus.Emit({
      type: BattleEventType.ROUND_END,
      timestamp: Date.now(),
      playerId: this.UserID,
      battleType: this.GetBattleTypeForEvent(this._currentBattle),
      mapId: this._currentBattleMapId,
      round,
      isOver,
      winnerId,
    } as IBattleRoundEndEvent);
  }

  private async EmitAttackResultEvents(result: ITurnResult, isCurrent: () => boolean = () => true): Promise<void> {
    const battle = this._currentBattle;
    if (!battle || !isCurrent()) return;

    const emitSingle = async (attack?: IAttackResult): Promise<void> => {
      if (!isCurrent() || !attack || attack.skillId <= 0) return;

      const attackerIsPlayer = attack.userId === battle.userId;
      const attackerPet = attackerIsPlayer ? battle.player : battle.enemy;
      const targetPet = attackerIsPlayer ? battle.enemy : battle.player;

      await this.Player.EventBus.Emit({
        type: BattleEventType.ATTACK_RESULT,
        timestamp: Date.now(),
        playerId: this.UserID,
        attackerId: attackerPet.petId,
        targetId: targetPet.petId,
        skillId: attack.skillId,
        damage: attack.damage,
        isCritical: attack.isCrit,
        isMissed: attack.missed,
        hpChange: -attack.damage,
      } as IAttackResultEvent);
    };

    await emitSingle(result.firstAttack);
    await emitSingle(result.secondAttack);
  }

  private async EmitStatusChangeEvents(before: {
    player: { status?: number; turns: number };
    enemy: { status?: number; turns: number };
  }, isCurrent: () => boolean = () => true): Promise<void> {
    const battle = this._currentBattle;
    if (!battle || !isCurrent()) return;

    const emitTransition = async (
      pet: IBattlePet,
      prevStatus?: number,
      prevTurns: number = 0
    ): Promise<void> => {
      if (!isCurrent()) return;
      const currentStatus = pet.status;
      const currentTurns = pet.statusTurns || 0;

      if (prevStatus === currentStatus) return;

      if (prevStatus !== undefined) {
        await this.Player.EventBus.Emit({
          type: BattleEventType.STATUS_CHANGE,
          timestamp: Date.now(),
          playerId: this.UserID,
          petId: pet.petId,
          status: prevStatus,
          statusTurns: prevTurns,
          isAdd: false,
        } as IStatusChangeEvent);
        if (!isCurrent()) return;
      }

      if (currentStatus !== undefined) {
        await this.Player.EventBus.Emit({
          type: BattleEventType.STATUS_CHANGE,
          timestamp: Date.now(),
          playerId: this.UserID,
          petId: pet.petId,
          status: currentStatus,
          statusTurns: currentTurns,
          isAdd: true,
        } as IStatusChangeEvent);
      }
    };

    await emitTransition(battle.player, before.player.status, before.player.turns);
    await emitTransition(battle.enemy, before.enemy.status, before.enemy.turns);
  }

  private async EmitPetDeadEventsIfNeeded(isCurrent: () => boolean = () => true): Promise<void> {
    if (!this._currentBattle) return;

    const emitDead = async (pet: IBattlePet, killerPetId: number): Promise<void> => {
      if (pet.hp > 0) return;
      if (this._emittedDeadCatchTimes.has(pet.catchTime)) return;
      this._emittedDeadCatchTimes.add(pet.catchTime);

      await this.Player.EventBus.Emit({
        type: BattleEventType.PET_DEAD,
        timestamp: Date.now(),
        playerId: this.UserID,
        petId: pet.petId,
        catchTime: pet.catchTime,
        killerId: killerPetId,
      } as IPetDeadEvent);
    };

    await emitDead(this._currentBattle.player, this._currentBattle.enemy.petId);
    if (!isCurrent()) return;
    await emitDead(this._currentBattle.enemy, this._currentBattle.player.petId);
  }

  /**
   * PvE精灵阵亡检查
   * 检查玩家精灵是否阵亡，同步HP，检查是否还有健康精灵
   * @returns true 表示已处理（调用方应return），false 表示未阵亡
   */
  private async CheckPlayerPetDeath(isCurrent: () => boolean = () => true): Promise<boolean> {
    if (!isCurrent()) return true;
    if (!this._currentBattle || this._currentBattle.player.hp > 0) return false;
    await this.EmitPetDeadEventsIfNeeded(isCurrent);
    if (!isCurrent()) return true;

    // 同步当前精灵的HP（阵亡）
    const currentPet = this.Player.PetManager.GetPetsInBag()
      .find(p => p.catchTime === this._currentBattle!.player.catchTime);
    if (currentPet) {
      currentPet.hp = 0;
      Logger.Info(`[BattleManager] 同步阵亡精灵HP: PetId=${currentPet.petId}, CatchTime=${currentPet.catchTime}`);
    }

    // 检查是否还有其他健康精灵
    const playerPets = this.Player.PetManager.GetPetsInBag();
    const currentCatchTime = this._currentBattle.player.catchTime;
    const hasHealthyPet = playerPets.some(p => p.hp > 0 && p.catchTime !== currentCatchTime);

    if (!hasHealthyPet) {
      Logger.Info(`[BattleManager] 所有精灵阵亡，战斗失败: UserID=${this.UserID}`);
      this._currentBattle.isOver = true;
      await this.HandleFightOver(0, 0, isCurrent);
      return true;
    }

    Logger.Info(`[BattleManager] 当前精灵阵亡，等待切换精灵: UserID=${this.UserID}`);
    return true; // 阵亡但还有健康精灵，等待CHANGE_PET
  }

  /**
   * PvE敌方反击并发送结果（换精灵/捕捉失败后）
   */
  private async ExecuteEnemyCounterAndSend(isCurrent: () => boolean = () => true): Promise<void> {
    if (!this._currentBattle) return;

    const enemyAttackResult = this._turnService.ExecuteEnemyTurn(this._currentBattle);

    // firstAttack: 玩家不攻击
    const noActionResult = this.BuildNoActionAttackResult();
    const firstAttack = BattleConverter.ToAttackValue(
      noActionResult, this.UserID,
      this._currentBattle.player.hp, this._currentBattle.player.maxHp,
      this._currentBattle.player.status, this._currentBattle.player.battleLv,
      this._currentBattle.player.type, this._currentBattle.player
    );

    // secondAttack: 敌人反击
    const secondAttack = BattleConverter.ToAttackValue(
      enemyAttackResult, 0,
      this._currentBattle.enemy.hp, this._currentBattle.enemy.maxHp,
      this._currentBattle.enemy.status, this._currentBattle.enemy.battleLv,
      this._currentBattle.enemy.type, this._currentBattle.enemy
    );

    await this.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack, this.Player.ClientProtocol));
    if (!isCurrent()) return;
    this.UpdatePlayerHPRecord();
  }

  /**
   * 换精灵验证
   * @returns 验证通过返回 { newPet, petConfig }，失败返回 null（已发送错误包）
   */
  private ValidateChangePet(catchTime: number, isPvp: boolean): { newPet: any; petConfig: any } | null {
    if (!this._currentBattle) return null;

    const playerPets = this.Player.PetManager.GetPetsInBag();
    const newPet = playerPets.find(p => p.catchTime === catchTime);

    if (!newPet) {
      Logger.Warn(`[BattleManager] 未找到精灵: CatchTime=${catchTime}`);
      this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5001));
      return null;
    }

    // 检查是否是当前精灵
    const isPlayer1 = this._currentBattle.userId === this.UserID;
    const myCurrentPet = (isPvp && !isPlayer1) ? this._currentBattle.enemy : this._currentBattle.player;
    if (myCurrentPet.catchTime === catchTime) {
      Logger.Warn(`[BattleManager] 尝试切换到当前精灵: CatchTime=${catchTime}`);
      this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5002));
      return null;
    }

    if (newPet.hp <= 0) {
      Logger.Warn(`[BattleManager] 精灵已阵亡: CatchTime=${catchTime}`);
      this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5003));
      return null;
    }

    const petConfig = GameConfig.GetPetById(newPet.petId);
    if (!petConfig) {
      Logger.Warn(`[BattleManager] 找不到精灵配置: PetId=${newPet.petId}`);
      this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5001));
      return null;
    }

    return { newPet, petConfig };
  }

  /**
   * 发送战斗结束包给指定玩家
   */
  private async SendFightOverPacket(player: PlayerInstance, reason: number, winnerId: number): Promise<void> {
    const playerData = player.Data;
    await player.SendPacket(new PacketFightOver(
      reason, winnerId,
      playerData.twoTimes || 0,
      playerData.threeTimes || 0,
      playerData.autoFightTimes || 0,
      playerData.energyTimes || 0,
      playerData.learnTimes || 0
    ));
  }

  /**
   * PvE战斗结束后清理地图（移除野怪、推送更新）
   */
  private async CleanupPveMap(isCurrent: () => boolean = () => true): Promise<void> {
    if (!isCurrent() || this._currentBattleSlot < 0) return;

    this.Player.MapSpawnManager.OnBattleEnd(this._currentBattleSlot);
    Logger.Info(`[BattleManager] 战斗结束，移除野怪: userId=${this.UserID}, slot=${this._currentBattleSlot}`);

    await this.SendOgreListUpdate();
    if (!isCurrent()) return;

    if (this._currentBattleMapId >= 0 && await this.IsBossBattle(this._currentBattleMapId, this._currentBattleSlot)) {
      if (!isCurrent()) return;
      await this.SendBossRemovalNotification(this._currentBattleSlot);
    }
  }

  // ==================== 精灵数据更新 ====================

  /**
   * 更新战斗中的精灵数据
   * 用于更换精灵时更新战斗状态
   */
  private UpdateBattlePet(battlePet: any, newPet: any, petConfig: any): void {
    this.RememberBattlePetPP(battlePet);
    // 获取技能
    const playerSkills = newPet.skillArray.filter((s: number) => s > 0);
    const finalSkills = playerSkills.length > 0 ? playerSkills : [10001];

    // 获取技能PP
    const skillPPs = finalSkills.map((skillId: number) => {
      const skillConfig = GameConfig.GetSkillById(skillId);
      const maxPP = skillConfig?.MaxPP || 20;
      Logger.Debug(`[BattleManager] UpdateBattlePet: SkillId=${skillId}, MaxPP=${maxPP}, SkillName=${skillConfig?.Name || 'Unknown'}`);
      const savedPP = this._currentBattle?.isPvp ? undefined : this._battlePetPPMap.get(newPet.catchTime)?.get(skillId);
      return this._currentBattle?.isPvp ? maxPP : savedPP === undefined ? GetPetSkillPP(newPet, skillId) : Math.min(maxPP, savedPP);
    });

    Logger.Debug(`[BattleManager] UpdateBattlePet: Skills=${JSON.stringify(finalSkills)}, PPs=${JSON.stringify(skillPPs)}`);

    // 检查是否有战斗中的HP记录（切换回之前上过场的精灵）
    const battleHp = this._battlePetHPMap.get(newPet.catchTime);
    const actualHp = battleHp !== undefined ? battleHp : newPet.hp;

    Logger.Debug(`[BattleManager] UpdateBattlePet: CatchTime=${newPet.catchTime}, BattleHP=${battleHp}, DbHP=${newPet.hp}, ActualHP=${actualHp}`);

    // 更新基本属性
    battlePet.petId = newPet.petId;
    battlePet.id = newPet.petId;
    battlePet.name = newPet.nick || petConfig.DefName || 'Pet';
    battlePet.level = newPet.level;
    battlePet.hp = actualHp;  // 使用战斗中的HP（如果有记录）
    battlePet.maxHp = newPet.maxHp;
    battlePet.attack = newPet.atk;
    battlePet.defence = newPet.def;
    battlePet.spAtk = newPet.spAtk;
    battlePet.spDef = newPet.spDef;
    battlePet.speed = newPet.speed;
    battlePet.type = petConfig.Type || 0;
    battlePet.skills = finalSkills;
    battlePet.catchTime = newPet.catchTime;
    battlePet.skinID = 0;  // 皮肤ID（暂时使用默认皮肤0）
    battlePet.skillPP = skillPPs;

    // 重置战斗状态
    battlePet.statusArray = new Array(20).fill(0);
    battlePet.battleLv = new Array(6).fill(0);
    battlePet.status = undefined;
    battlePet.statusTurns = 0;
    battlePet.statusDurations = new Array(20).fill(0);
    battlePet.battleLevels = [0, 0, 0, 0, 0, 0];
    battlePet.effectCounters = {};
  }

  /**
   * 同步战斗精灵HP到玩家精灵数据
   * 战斗结束时调用，将战斗中的HP变化同步回数据库
   */
  private async SyncBattlePetHP(): Promise<void> {
    if (!this._currentBattle) return;

    // 1. 更新当前战斗精灵的HP
    const currentBattlePet = this._currentBattle.player;
    this._battlePetHPMap.set(currentBattlePet.catchTime, currentBattlePet.hp);

    // 2. 同步所有参与过战斗的精灵HP
    const playerPets = this.Player.PetManager.GetPetsInBag();

    for (const [catchTime, battleHP] of this._battlePetHPMap.entries()) {
      const playerPet = playerPets.find(p => p.catchTime === catchTime);

      if (!playerPet) {
        // 在PVP战斗中，可能是对手的精灵，跳过
        Logger.Debug(`[BattleManager] 跳过非己方精灵: catchTime=${catchTime}`);
        continue;
      }

      // 同步HP（确保不超过最大值，不低于0）
      const newHp = Math.max(0, Math.min(battleHP, playerPet.maxHp));
      playerPet.hp = newHp;

      Logger.Info(
        `[BattleManager] 同步精灵HP: PetId=${playerPet.petId}, ` +
        `CatchTime=${catchTime}, HP=${newHp}/${playerPet.maxHp}`
      );
    }

    // 3. 清空HP记录
    this._battlePetHPMap.clear();
  }

  // ==================== 战斗准备与清理 ====================

  /**
   * 初始化战斗前的准备工作
   * 清理旧战斗数据，初始化HP记录
   */
  private InitializeBattle(battle: IBattleInfo): void {
    if (this._petRecoveryInProgress) throw new Error('Out-of-battle pet recovery pending');
    this._battleEpoch++;
    this._currentBattle = battle;
    this._battlePetPPMap.clear();
    this.RememberBattlePetPP(battle.player);
    this._battlePetHPMap.clear();
    this._emittedDeadCatchTimes.clear();
    this._battlePetHPMap.set(battle.player.catchTime, battle.player.hp);

    Logger.Debug(
      `[BattleManager] 初始化战斗: UserID=${this.UserID}, ` +
      `PlayerPet(id=${battle.player.id}, hp=${battle.player.hp}), ` +
      `EnemyPet(id=${battle.enemy.id}, hp=${battle.enemy.hp})`
    );
  }

  /**
   * 清理战斗数据
   */
  private CleanupBattle(): void {
    this._currentBattle = null;
    this._battlePetPPMap.clear();
    this._currentBattleSlot = -1;
    this._currentBattleMapId = -1;
    this._currentBattleOriginalPetId = -1;
    this._battlePetHPMap.clear();
    this._emittedDeadCatchTimes.clear();

    Logger.Debug(`[BattleManager] 清理战斗数据: UserID=${this.UserID}`);
  }

  // ==================== 战斗入口 ====================

  /**
   * 处理挑战野外精灵
   * CMD 2408: FIGHT_NPC_MONSTER
   * 发送 2408 确认 + NOTE_READY_TO_FIGHT (2503)
   */
  public async HandleFightNpcMonster(monsterIndex: number): Promise<void> {
    return this.RunBattleAction(CommandID.FIGHT_NPC_MONSTER, () => this.FightNpcMonster(monsterIndex));
  }

  private async FightNpcMonster(monsterIndex: number): Promise<void> {
    try {
      // 清理旧战斗（如果存在）
      if (this._currentBattle) {
        this.CleanupBattle();
      }

      // 验证索引范围
      if (monsterIndex < 0 || monsterIndex > 8) {
        await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5001));
        Logger.Warn(`[BattleManager] 无效的怪物索引: ${monsterIndex}`);
        return;
      }

      // 使用 MapSpawnManager 获取玩家的野怪列表
      const mapId = this.Player.Data.mapID || 1;
      const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);

      // 检查索引位置是否有怪物
      if (!ogres[monsterIndex] || ogres[monsterIndex].petId <= 0) {
        await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5001));
        Logger.Warn(`[BattleManager] 索引 ${monsterIndex} 位置没有怪物`);
        return;
      }

      const monsterId = ogres[monsterIndex].petId;
      const originalPetId = ogres[monsterIndex].originalPetId; // 原始精灵ID（闪光时使用）

      // 从配置读取野怪等级
      const mapConfig = GameConfig.GetMapConfigById(mapId);
      let monsterLevel = 5; // 默认等级

      if (mapConfig) {
        // 根据精灵ID查找配置（优先用当前ID，找不到则用原始ID）
        let ogreConfig = mapConfig.ogres.find((o: any) => o.petId === monsterId);

        // 如果找不到（可能是闪光精灵），尝试用原始ID查找
        if (!ogreConfig && originalPetId > 0 && originalPetId !== monsterId) {
          ogreConfig = mapConfig.ogres.find((o: any) => o.petId === originalPetId);
          Logger.Debug(`[BattleManager] 闪光精灵，使用原始ID查找配置: petId=${monsterId}, originalPetId=${originalPetId}`);
        }

        if (ogreConfig) {
          Logger.Debug(
            `[BattleManager] 野怪配置: petId=${monsterId}, originalPetId=${originalPetId}, slot=${monsterIndex}, ` +
            `level=${ogreConfig.level}, minLevel=${ogreConfig.minLevel}, maxLevel=${ogreConfig.maxLevel}`
          );

          // 优先使用配置的等级（必须是有效数字）
          if (ogreConfig.level !== undefined && ogreConfig.level !== null && typeof ogreConfig.level === 'number') {
            monsterLevel = ogreConfig.level;
            Logger.Debug(`[BattleManager] 使用固定等级: ${monsterLevel}`);
          } else if (ogreConfig.minLevel !== undefined && ogreConfig.maxLevel !== undefined) {
            // 如果配置了等级范围，随机生成
            monsterLevel = Math.floor(
              Math.random() * (ogreConfig.maxLevel - ogreConfig.minLevel + 1) + ogreConfig.minLevel
            );
            Logger.Debug(`[BattleManager] 随机等级: ${monsterLevel} (范围: ${ogreConfig.minLevel}-${ogreConfig.maxLevel})`);
          }
        } else {
          Logger.Warn(`[BattleManager] 未找到精灵配置: mapId=${mapId}, petId=${monsterId}, originalPetId=${originalPetId}, slot=${monsterIndex}`);
        }
      }

      // 限制等级范围 1-100
      monsterLevel = Math.max(1, Math.min(monsterLevel, 100));

      // 创建战斗实例
      const battle = await this._initService.CreatePVEBattle(monsterId, monsterLevel);

      if (!battle) {
        // 检查是否是因为没有健康的精灵
        const healthyPets = this.Player.PetManager.GetPetsInBag().filter(p => p.hp > 0);
        if (healthyPets.length === 0) {
          await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(10017));
          Logger.Warn(`[BattleManager] 玩家所有精灵已阵亡: UserID=${this.UserID}`);
        } else {
          await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5001));
          Logger.Warn(`[BattleManager] 创建战斗失败: UserID=${this.UserID}`);
        }
        return;
      }

      // 保存战斗槽位信息（用于战斗结束后刷新）
      this._currentBattleSlot = monsterIndex;
      this._currentBattleMapId = mapId;
      this._currentBattleOriginalPetId = ogres[monsterIndex].originalPetId;

      // 初始化战斗
      this.InitializeBattle(battle);

      // 1. 先发送 2408 确认（空响应）
      await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER));

      // 2. 然后发送 NOTE_READY_TO_FIGHT (2503)
      await this.SendReadyToFight(battle, '野生精灵');

      Logger.Info(`[BattleManager] 挑战野外精灵: UserID=${this.UserID}, Index=${monsterIndex}, PetId=${monsterId}, Level=${monsterLevel}`);
    } catch (error) {
      Logger.Error(`[BattleManager] HandleFightNpcMonster failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_NPC_MONSTER).setResult(5000));
    }
  }

  /**
   * 处理挑战BOSS
   * CMD 2411: CHALLENGE_BOSS
   * 发送 2411 确认 + NOTE_READY_TO_FIGHT (2503)
   * 
   * 1. 优先从 (mapId, param2) 查找BOSS配置
   * 2. 如果未找到且该地图有param2=0的配置，回退到param2=0
   * 3. 如果仍未找到，记录警告
   */
  public async HandleChallengeBoss(mapId: number, param2: number): Promise<void> {
    return this.RunBattleAction(CommandID.CHALLENGE_BOSS, () => this.ChallengeBoss(mapId, param2));
  }

  private async ChallengeBoss(mapId: number, param2: number): Promise<void> {
    try {
      // 清理旧战斗（如果存在）
      if (this._currentBattle) {
        this.CleanupBattle();
      }

      // 谱尼挑战：检查封印解锁状态
      if ((mapId === 108 || mapId === 514) && param2 >= 1 && param2 <= 8) {
        const door = param2;
        const puniLevel = this.Player.ChallengeProgressManager.GetPuniLevel();

        // 封印1-7：需要 maxPuniLv >= door-1
        if (door >= 1 && door <= 7) {
          if (puniLevel < door - 1) {
            Logger.Warn(`[BattleManager] 谱尼封印未解锁: Door=${door}, MaxPuniLv=${puniLevel}`);
            await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(11027));
            return;
          }
        }
        // 真身（8）：需要 maxPuniLv >= 7
        if (door === 8 && puniLevel < 7) {
          Logger.Warn(`[BattleManager] 谱尼真身未解锁: MaxPuniLv=${puniLevel}`);
          await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(11027));
          return;
        }
      }

      // 1. 尝试从 (mapId, param2) 查找BOSS配置
      let bossConfig = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
      let actualParam2 = param2;

      if (bossConfig) {
        Logger.Info(
          `[BattleManager] 从配置获取BOSS: MapId=${mapId}, Param2=${param2} -> ` +
          `PetId=${bossConfig.petId}, Level=${bossConfig.level}`
        );
      } else {
        // 2. 该地图在配置中但param2不匹配：按单BOSS地图回退到param2=0
        bossConfig = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, 0);
        if (bossConfig) {
          actualParam2 = 0;
          Logger.Info(
            `[BattleManager] param2未命中，回退到 MapId=${mapId}, Param2=0 -> ` +
            `PetId=${bossConfig.petId}, Level=${bossConfig.level}`
          );
        } else {
          // 3. 配置未找到
          Logger.Warn(
            `[BattleManager] 配置未找到: MapId=${mapId}, Param2=${param2}`
          );
        }
      }

      // 使用CreateBossBattle方法
      const battle = await this._initService.CreateBossBattle(mapId, actualParam2);

      if (!battle) {
        const healthyPets = this.Player.PetManager.GetPetsInBag().filter(p => p.hp > 0);
        if (healthyPets.length === 0) {
          await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(10017));
          Logger.Warn(`[BattleManager] 玩家所有精灵已阵亡: UserID=${this.UserID}`);
        } else {
          await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(5001));
          Logger.Warn(`[BattleManager] 创建BOSS战斗失败: UserID=${this.UserID}, MapId=${mapId}, Param2=${param2}`);
        }
        return;
      }

      // 初始化战斗
      this.InitializeBattle(battle);

      await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS));
      await this.SendReadyToFight(battle, 'BOSS');

      Logger.Info(`[BattleManager] 挑战BOSS: UserID=${this.UserID}, MapId=${mapId}, Param2=${actualParam2}`);
    } catch (error) {
      Logger.Error(`[BattleManager] HandleChallengeBoss failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.CHALLENGE_BOSS).setResult(5000));
    }
  }

  /**
   * 处理盖亚挑战
   * CMD 2421: FIGHT_SPECIAL_PET
   * 
   * 逻辑与 go-server handleChallengeBoss 一致：
   * - 优先从配置获取BOSS
   * - 未匹配到配置时回退到盖亚
   */
  public async HandleFightSpecialPet(mapId: number, param2: number): Promise<void> {
    return this.RunBattleAction(CommandID.FIGHT_SPECIAL_PET, () => this.FightSpecialPet(mapId, param2));
  }

  private async FightSpecialPet(mapId: number, param2: number): Promise<void> {
    try {
      // 清理旧战斗
      if (this._currentBattle) {
        this.CleanupBattle();
      }

      // 尝试从配置获取
      let bossConfig = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
      let actualParam2 = param2;

      if (bossConfig) {
        Logger.Info(
          `[BattleManager] 盖亚挑战(配置命中): MapId=${mapId}, Param2=${param2} -> ` +
          `PetId=${bossConfig.petId}, Level=${bossConfig.level}`
        );
      } else {
        // 回退到 param2=0
        bossConfig = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, 0);
        if (bossConfig) {
          actualParam2 = 0;
          Logger.Info(`[BattleManager] 盖亚挑战回退到param2=0`);
        } else {
          // 配置未找到，回退到盖亚
          Logger.Info(`[BattleManager] 盖亚挑战配置未找到，使用盖亚默认配置`);
        }
      }

      // 使用CreateBossBattle方法
      const battle = await this._initService.CreateBossBattle(mapId, actualParam2);

      if (!battle) {
        await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_SPECIAL_PET).setResult(5001));
        Logger.Warn(`[BattleManager] 创建盖亚战斗失败: UserID=${this.UserID}`);
        return;
      }

      this.InitializeBattle(battle);

      await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_SPECIAL_PET));
      await this.SendReadyToFight(battle, 'BOSS');

      Logger.Info(`[BattleManager] 盖亚挑战: UserID=${this.UserID}, MapId=${mapId}`);
    } catch (error) {
      Logger.Error(`[BattleManager] HandleFightSpecialPet failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.FIGHT_SPECIAL_PET).setResult(5000));
    }
  }

  /**
   * 处理准备战斗
   * CMD 2404: READY_TO_FIGHT
   * 发送 NOTE_START_FIGHT (2504)
   */
  public async HandleReadyToFight(): Promise<void> {
    return this.RunBattleAction(CommandID.READY_TO_FIGHT, () => this.ReadyToFight());
  }

  private async ReadyToFight(): Promise<void> {
    // 检查是否是PVP战斗
    const pvpRoom = PvpBattleManager.Instance.GetPlayerRoom(this.Player.Uid);

    if (pvpRoom) {
      await this._pvpService.HandleReadyToFight(pvpRoom);
      return;
    }

    // PVE战斗准备
    if (!this._currentBattle) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.READY_TO_FIGHT).setResult(5001));
      return;
    }

    if (!this._initService.ValidateBattle(this._currentBattle)) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.READY_TO_FIGHT).setResult(5002));
      return;
    }

    // 初始化HP记录（记录首发精灵）
    this._battlePetHPMap.clear();
    this._battlePetHPMap.set(this._currentBattle.player.catchTime, this._currentBattle.player.hp);

    // 重置BOSS特殊规则状态
    BossSpecialRules.ResetBattleState(this._currentBattle.enemy.id);

    // 战斗开始效果
    const battleStartResults = BattleEffectIntegration.OnBattleStart(this._currentBattle);
    Logger.Debug(`[BattleManager] 战斗开始效果: ${battleStartResults.length}个结果`);

    const playerPet = BattleConverter.ToFightPetInfo(this._currentBattle.player, this.Player.Uid, 0);
    const enemyPet = BattleConverter.ToFightPetInfo(this._currentBattle.enemy, 0, 1);

    await this.Player.SendPacket(new PacketNoteStartFight(0, playerPet, enemyPet));
    await this.EmitBattleStartEvent();

    Logger.Info(`[BattleManager] 准备战斗(PVE): UserID=${this.Player.Uid}`);
  }

  // ==================== 技能使用 ====================

  /**
   * 处理使用技能
   * CMD 2405: USE_SKILL
   */
  public async HandleUseSkill(skillId: number): Promise<void> {
    return this.RunBattleAction(CommandID.USE_SKILL, () => this.UseSkill(skillId));
  }

  private async UseSkill(skillId: number): Promise<void> {
    const battle = this._currentBattle;
    const epoch = this._battleEpoch, mapId = this.Player.Data.mapID;
    const isCurrent = () => this._currentBattle === battle && this._battleEpoch === epoch && this.Player.Data.mapID === mapId;
    if (!battle || !isCurrent() || battle.isOver) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.USE_SKILL).setResult(5001));
      return;
    }

    if (battle.isPvp === true) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.USE_SKILL));
      await this._pvpService.HandleUseSkill(skillId);
      return;
    }

    const index = battle.player.skills.indexOf(skillId);
    if (index < 0 || !battle.player.skillPP || battle.player.skillPP[index] <= 0) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.USE_SKILL).setResult(5001));
      return;
    }
    this._ppSaveInProgress = true;
    try {
      const release = await this.Player.PetManager.PetData.AcquireMutation();
      try {
        if (!isCurrent()) return;
        const pet = this.Player.PetManager.GetPetByCatchTime(battle.player.catchTime);
        if (!pet) throw new Error('Battle PP pet missing');
        if (pet.skillArray.some(id => id > 0) && !pet.skillArray.includes(skillId)) {
          await this.Player.SendPacket(new PacketEmpty(CommandID.USE_SKILL).setResult(5001));
          return;
        }
        const candidate = JSON.parse(JSON.stringify(pet));
        candidate.skillPP = ReconcilePetPP(candidate);
        battle.player.skills.forEach((id, i) => {
          const pp = battle.player.skillPP![i] - (i === index ? 1 : 0);
          if (!Number.isInteger(pp) || pp < 0 || pp > GetSkillMaxPP(id)) throw new Error('Invalid battle PP');
          if (id in candidate.skillPP) candidate.skillPP[id] = pp;
        });
        await this.Player.PetManager.PetData.CommitPetUpdate(pet, candidate);
        if (this._currentBattle === battle) {
          battle.player.skillPP[index]--;
          this.RememberBattlePetPP(battle.player);
        }
      } finally { release(); }
    } catch (error) {
      Logger.Error('[BattleManager] PP consumption was not persisted', error as Error);
      if (isCurrent()) await this.Player.SendPacket(new PacketEmpty(CommandID.USE_SKILL).setResult(5000));
      return;
    } finally { this._ppSaveInProgress = false; }
    if (!isCurrent()) return;
    await this.Player.SendPacket(new PacketEmpty(CommandID.USE_SKILL));
    if (!isCurrent()) return;
    const currentTurn = battle.turn;
    await this.EmitRoundStartEvent(currentTurn + 1);
    if (!isCurrent() || battle.isOver) return;
    const statusBefore = this.CaptureStatusSnapshot();

    const result = this._turnService.ExecuteTurn(battle, skillId);
    const { firstAttack, secondAttack } = this.BuildAttackValuePair(result, this.UserID, 0);

    await this.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack, this.Player.ClientProtocol));
    if (!isCurrent()) return;
    this.UpdatePlayerHPRecord();
    await this.EmitAttackResultEvents(result, isCurrent);
    if (!isCurrent()) return;
    await this.EmitStatusChangeEvents(statusBefore, isCurrent);
    if (!isCurrent()) return;
    await this.EmitPetDeadEventsIfNeeded(isCurrent);
    if (!isCurrent()) return;
    await this.EmitRoundEndEvent(battle.turn, result.isOver, result.winner);
    if (!isCurrent()) return;

    if (await this.CheckPlayerPetDeath(isCurrent)) return;
    if (!isCurrent()) return;

    if (result.isOver) {
      await this.HandleFightOver(result.winner || 0, result.reason || 0, isCurrent);
    }

    Logger.Info(`[BattleManager] 使用技能: UserID=${this.UserID}, SkillId=${skillId}, Turn=${currentTurn}`);
  }

  // ==================== 战斗结束 ====================

  /**
   * 处理战斗结束
   */
  private async HandleFightOver(winnerId: number, reason: number, stillValid: () => boolean = () => true): Promise<void> {
    const battle = this._currentBattle;
    if (!battle || !stillValid() || this._finishedBattles.has(battle)) return;
    // Claim this battle before the first await. Partial rewards must never be replayed automatically.
    this._finishedBattles.add(battle);
    const epoch = this._battleEpoch;
    const isCurrent = () => this._currentBattle === battle && this._battleEpoch === epoch && stillValid();

    const isPvp = battle.isPvp === true;

    await this.SyncBattlePetHP();
    if (!isCurrent()) return;

    const battleEndResults = BattleEffectIntegration.OnBattleEnd(battle, winnerId);
    Logger.Debug(`[BattleManager] 战斗结束效果: ${battleEndResults.length}个结果`);

    // PVE胜利奖励
    let rewardItems: Array<{ itemId: number; itemCnt: number }> = [];
    let rewardSettlement: { rewardStatus: 'complete' | 'partial' | 'failed'; rewardFailedStage?: string } | undefined;
    if (!isPvp && winnerId === this.UserID) {
      const reward = await this._rewardService.ProcessVictoryReward(
        this.UserID,
        battle,
        this._currentBattleMapId >= 0 ? this._currentBattleMapId : undefined,
        this._currentBattleSlot >= 0 ? this._currentBattleSlot : undefined,
        this._currentBattleOriginalPetId >= 0 ? this._currentBattleOriginalPetId : undefined
      );
      if (!isCurrent()) return;
      rewardItems = reward.rewardItems;
      rewardSettlement = { rewardStatus: reward.status, rewardFailedStage: reward.failedStage };
      if (reward.status !== 'complete') {
        Logger.Error(`[BattleManager] Reward settlement ${reward.status}: Stage=${reward.failedStage}; committed rewards retained, automatic replay disabled`);
      }
      Logger.Info(`[BattleManager] 战斗胜利奖励: Exp=${reward.expGained}, Coins=${reward.coinsGained}, LevelUp=${reward.levelUp}, Drops=${reward.droppedItems.length}, RewardItems=${rewardItems.length}`);
    }

    // 发送战斗结束包
    await this.SendFightOverPacket(this.Player, reason, winnerId);
    if (!isCurrent()) return;

    // PVP通知对手
    if (isPvp) {
      await this._pvpService.NotifyOpponentFightOver(reason, winnerId);
    }

    // PVE清理地图
    if (!isPvp) {
      await this.CleanupPveMap(isCurrent);
      if (!isCurrent()) return;
    }

    // 延迟推送物品奖励弹窗（仅PVE）
    if (!isPvp && rewardItems.length > 0) {
      setTimeout(async () => {
        // Normal cleanup clears currentBattle; a new battle/map/logout changes the epoch instead.
        if (this._battleEpoch !== epoch) return;
        await this.Player.SendPacket(new PacketBattleReward(rewardItems));
        Logger.Info(`[BattleManager] 推送物品奖励弹窗: RewardItems=${rewardItems.length}`);
      }, 1200);
    }

    // 派发战斗结束事件（在 CleanupBattle 之前，确保数据可用）
    await this.Player.EventBus.Emit({
      type: BattleEventType.BATTLE_END,
      timestamp: Date.now(),
      playerId: this.UserID,
      battleType: this.GetBattleTypeForEvent(battle),
      mapId: this._currentBattleMapId,
      isVictory: winnerId === this.UserID,
      playerPetId: battle.player.petId,
      enemyPetId: battle.enemy.petId,
      rounds: battle.roundCount || 0,
      extra: {
        sptId: battle.enemy.id,
        dropItems: rewardItems.map(r => ({ itemId: r.itemId, count: r.itemCnt })),
        ...rewardSettlement,
      },
    } as IBattleEndEvent);

    if (!isCurrent()) return;
    this.CleanupBattle();

    Logger.Info(`[BattleManager] 战斗结束: Winner=${winnerId}, Reason=${reason}, IsPvp=${isPvp}`);
  }

  // ==================== 道具/换精灵/捕捉/逃跑 ====================

  /**
   * 处理使用精灵道具
   * CMD 2406: USE_PET_ITEM
   */
  public async HandleUsePetItem(itemId: number, catchTime?: number): Promise<void> {
    if (itemId === 300016) {
      const inventory = this.Player.ItemManager.ItemData;
      if (this._ppSaveInProgress || this._petItemInProgress || this._catchInProgress || inventory.HasPendingReward()) {
        await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
        return;
      }
      const epoch = this._battleEpoch, battle = this._currentBattle, mapId = this.Player.Data.mapID;
      this._ppSaveInProgress = true;
      let release: (() => void) | undefined;
      try {
        // An exclusive existing reservation protects the detached inventory snapshot until publication.
        release = await inventory.AcquireReward();
        this._ppSaveInProgress = false;
        if (this._battleEpoch !== epoch || this._currentBattle !== battle || this.Player.Data.mapID !== mapId) return;
        await this.RunBattleAction(CommandID.USE_PET_ITEM, () => this.UsePetItem(itemId, catchTime));
      } finally { this._ppSaveInProgress = false; release?.(); }
      return;
    }
    // Keep a failed-save compensation inside the inventory operation, excluding staged task rewards.
    const release = this.Player.ItemManager.ItemData.BeginMutation();
    if (!release) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5000));
      return;
    }
    try {
      await this.RunBattleAction(CommandID.USE_PET_ITEM, () => this.UsePetItem(itemId, catchTime));
    } finally { release(); }
  }

  private async UsePetItem(itemId: number, catchTime?: number): Promise<void> {
    const battle = this._currentBattle;
    if (!battle || battle.isOver || battle.isPvp || this._petItemStorageUncertain || this._battleActionsInProgress > 1 ||
        (this.Player.ClientProtocol === 'xin-20261013' && catchTime !== battle.player.catchTime) ||
        (catchTime !== undefined && catchTime !== battle.player.catchTime) ||
        (this._currentBattleMapId >= 0 && this.Player.Data.mapID !== this._currentBattleMapId) ||
        battle.player.hp <= 0 || (itemId !== 300016 && battle.player.hp >= battle.player.maxHp)) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
      return;
    }

    // Only the pinned client's five fixed-HP medicines and basic PP medicine are supported.
    const isPP = itemId === 300016;
    const medicine = ItemSystem.GetItem(itemId) as (IItemInfo & { HP?: number; PP?: number; ItemType?: number }) | null;
    const healAmount = isPP ? medicine?.PP : medicine?.HP;
    const pet = this.Player.PetManager.GetPetByCatchTime(battle.player.catchTime);
    const itemData = this.Player.ItemManager.ItemData;
    const petData = this.Player.PetManager.PetData;
    const item = itemData.ItemList.find(entry => entry.itemId === itemId);
    if (isPP && pet && pet.skillArray.some(id => id > 0) && battle.player.skills.some(id => !pet.skillArray.includes(id))) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
      return;
    }
    if ((!isPP && ![300011, 300012, 300013, 300014, 300015].includes(itemId)) || medicine?.ItemType !== (isPP ? 2 : 1) || !Number.isInteger(healAmount) ||
        !healAmount || healAmount <= 0 || !pet || !item) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
      return;
    }
    const restoredPP = isPP ? battle.player.skills.map((id, index) => {
      const maxPP = GameConfig.GetSkillById(id)?.MaxPP;
      const pp = battle.player.skillPP?.[index];
      if (!Number.isInteger(maxPP) || !maxPP || maxPP <= 0 ||
          pp === undefined || !Number.isInteger(pp) || pp < 0 || pp > maxPP) return Number.NaN;
      return Math.min(maxPP, pp + healAmount);
    }) : [];
    if ((isPP && (!restoredPP.length || restoredPP.some(pp => !Number.isInteger(pp)) ||
        !restoredPP.some((pp, index) => pp > battle.player.skillPP![index]))) ||
        (isPP ? !Number.isSafeInteger(item.count) || item.count < 1 : !this.Player.ItemManager.ConsumeItem(itemId, 1))) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
      return;
    }

    const epoch = this._battleEpoch, mapId = this.Player.Data.mapID, targetCatchTime = battle.player.catchTime;
    const isCurrent = () => this._currentBattle === battle && this._battleEpoch === epoch &&
      this.Player.Data.mapID === mapId && battle.player.catchTime === targetCatchTime;
    this._petItemInProgress = true;
    try {
      if (isPP) {
        const release = await petData.AcquireMutation();
        try {
          if (!isCurrent()) return;
          if (pet.skillArray.some(id => id > 0) && battle.player.skills.some(id => !pet.skillArray.includes(id))) {
            await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
            return;
          }
          const candidate = JSON.parse(JSON.stringify(pet));
          candidate.skillPP = ReconcilePetPP(candidate);
          battle.player.skills.forEach((id, i) => { candidate.skillPP[id] = restoredPP[i]; });
          await petData.CommitPetUpdate(pet, candidate, staged => DatabaseManager.Instance.WithConnection(async driver => {
            let inventory = itemData.ItemList.map(entry => ({...entry}));
            const consumed = inventory.find(entry => entry.itemId === itemId);
            if (!consumed || !Number.isSafeInteger(consumed.count) || consumed.count < 1) throw new Error('PP medicine stock changed');
            consumed.count--;
            if (consumed.count === 0) inventory = inventory.filter(entry => entry.itemId !== itemId);
            const petList = staged.ToRow().pet_list, itemList = JSON.stringify(inventory);
            let committed = false;
            await driver.beginTransaction();
            try {
              const items = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [itemList, this.UserID]);
              const pets = await driver.execute('UPDATE player_pets SET pet_list = ? WHERE owner_id = ?', [petList, this.UserID]);
              if (items.affectedRows !== 1 || pets.affectedRows !== 1) throw new Error('PP medicine storage row missing');
              const [savedPet] = await driver.query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [this.UserID]);
              const [savedItems] = await driver.query<{item_list: string}>('SELECT item_list FROM player_items WHERE owner_id = ?', [this.UserID]);
              if (savedPet?.pet_list !== petList || savedItems?.item_list !== itemList) throw new Error('PP medicine readback mismatch');
              await driver.commit(); committed = true;
              // Publish before releasing the DB connection; queued inventory autosaves see the committed count.
              itemData.ItemList = inventory;
            } catch (error) { if (!committed) await driver.rollback(); throw error; }
          }));
          if (this._currentBattle === battle && battle.player.catchTime === targetCatchTime) {
            battle.player.skillPP = restoredPP;
            this.RememberBattlePetPP(battle.player);
          }
        } catch (error) {
          this._petItemStorageUncertain = true;
          Logger.Error('[BattleManager] PP medicine transaction failed', error as Error);
          if (isCurrent()) await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
          return;
        } finally { release(); }
        if (!isCurrent()) return;
        await this.Player.SendPacket(new PacketUsePetItem(this.UserID, itemId, battle.player.hp, 0));
        await this.ContinueNieoMedicineTurn(catchTime, isCurrent);
        return;
      }
      try {
        await DatabaseHelper.Instance.SaveItemData(itemData, true);
      } catch (error) {
        // Undo only our one-unit delta; never replace the inventory or overwrite a replacement entry.
        const currentItem = itemData.ItemList.find(entry => entry.itemId === itemId);
        if (currentItem === item) currentItem.count += 1;
        else if (!currentItem && item.count === 0) itemData.ItemList.push({...item, count: 1});
        this._petItemStorageUncertain = true;
        Logger.Error('[BattleManager] Medicine inventory save failed; further medicine use disabled', error as Error);
        if (isCurrent()) await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
        return;
      }
      if (!isCurrent()) return;
      const oldHp = battle.player.hp;
      const nextHp = Math.min(battle.player.maxHp, oldHp + healAmount);
      const actualHeal = nextHp - oldHp;
      const oldPetHp = pet.hp;
      pet.hp = nextHp;
      try {
        await DatabaseHelper.Instance.SavePetData(petData, true);
      } catch (error) {
        // Restore only our pending HP write, preserving any independently changed/replaced pet.
        if (pet.hp === nextHp) pet.hp = oldPetHp;
        this._petItemStorageUncertain = true;
        Logger.Error('[BattleManager] Medicine HP save failed; further medicine use disabled', error as Error);
        if (isCurrent()) await this.Player.SendPacket(new PacketEmpty(CommandID.USE_PET_ITEM).setResult(5001));
        return;
      }
      // Retain a committed heal on its owning battle; invalidation still blocks packets and counterattacks.
      if (this._currentBattle === battle && battle.player.catchTime === targetCatchTime) {
        battle.player.hp = nextHp;
        this._battlePetHPMap.set(targetCatchTime, nextHp);
      }
      if (!isCurrent()) return;
      await this.Player.SendPacket(new PacketUsePetItem(this.UserID, itemId, battle.player.hp, actualHeal));
      Logger.Info(`[BattleManager] 使用道具: UserID=${this.UserID}, ItemId=${itemId}, Heal=${actualHeal}`);
      await this.ContinueNieoMedicineTurn(catchTime, isCurrent);
    } finally {
      this._petItemInProgress = false;
    }
  }

  private async ContinueNieoMedicineTurn(catchTime: number | undefined, isCurrent: () => boolean): Promise<void> {
    // Nieo's item animation resumes a queued NOTE_USE_SKILL before enabling the next turn.
    if (this.Player.ClientProtocol !== 'kose' || catchTime === undefined || !isCurrent()) return;
    await this.ExecuteEnemyCounterAndSend(isCurrent);
    if (isCurrent()) await this.CheckPlayerPetDeath(isCurrent);
  }

  /**
   * 处理更换精灵
   * CMD 2407: CHANGE_PET
   */
  public async HandleChangePet(catchTime: number): Promise<void> {
    return this.RunBattleAction(CommandID.CHANGE_PET, () => this.ChangePet(catchTime));
  }

  private async ChangePet(catchTime: number): Promise<void> {
    if (!this._currentBattle || this._currentBattle.isOver) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5001));
      return;
    }

    try {
      const isPvp = this._currentBattle.isPvp === true;

      const validated = this.ValidateChangePet(catchTime, isPvp);
      if (!validated) return;

      const { newPet, petConfig } = validated;

      // PVP模式：换精灵作为回合动作
      if (isPvp) {
        await this._pvpService.HandleChangePetAction(catchTime);
        return;
      }

      // PVE模式：立即执行
      const oldPetId = this._currentBattle.player.petId;
      const oldCatchTime = this._currentBattle.player.catchTime;
      this.UpdateBattlePet(this._currentBattle.player, newPet, petConfig);
      this._battlePetHPMap.set(newPet.catchTime, this._currentBattle.player.hp);

      // 发送切换精灵数据（包含CommandID.CHANGE_PET）
      await this.Player.SendPacket(new PacketChangePet(
        this.UserID, newPet.petId,
        newPet.nick || petConfig.DefName || 'Pet',
        newPet.level,
        this._currentBattle.player.hp,
        this._currentBattle.player.maxHp,
        newPet.catchTime
      ));
      await this.Player.EventBus.Emit({
        type: BattleEventType.PET_SWITCH,
        timestamp: Date.now(),
        playerId: this.UserID,
        oldPetId,
        oldCatchTime,
        newPetId: this._currentBattle.player.petId,
        newCatchTime: this._currentBattle.player.catchTime,
      } as IPetSwitchEvent);

      Logger.Info(
        `[BattleManager] 更换精灵: UserID=${this.UserID}, PetId=${newPet.petId}, ` +
        `HP=${this._currentBattle.player.hp}/${this._currentBattle.player.maxHp}, CatchTime=${catchTime}`
      );

      // 敌方反击
      await this.ExecuteEnemyCounterAndSend();
      await this.CheckPlayerPetDeath();

      Logger.Info(`[BattleManager] 更换精灵成功: UserID=${this.UserID}, PetId=${newPet.petId}, CatchTime=${catchTime}`);
    } catch (error) {
      Logger.Error(`[BattleManager] 更换精灵失败`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.CHANGE_PET).setResult(5000));
    }
  }

  /**
   * 处理捕捉精灵
   * CMD 2409: CATCH_MONSTER
   * @param capsuleID 胶囊物品ID
   */
  public async HandleCatchMonster(capsuleID: number = 300001): Promise<void> {
    if (this._catchInProgress || this._battleActionsInProgress > 0 || !this._currentBattle || this._currentBattle.isOver || this._currentBattle.isPvp) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.CATCH_MONSTER).setResult(5001));
      return;
    }

    if (this._turnService.GetPokeBallType(capsuleID) === undefined ||
        (this._currentBattleMapId >= 0 && this.Player.Data.mapID !== this._currentBattleMapId) ||
        !BattleCaptureSystem.CanCapture(this._currentBattle.enemy, this._currentBattle.battleType === BattleType.BOSS).canCapture ||
        !this._rewardService.IsCatchable(this._currentBattle.enemy.id,
          this._currentBattleMapId >= 0 ? this._currentBattleMapId : undefined,
          this._currentBattleSlot >= 0 ? this._currentBattleSlot : undefined) ||
        !this.Player.ItemManager.ConsumeItem(capsuleID, 1)) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.CATCH_MONSTER).setResult(5001));
      return;
    }

    const battle = this._currentBattle;
    const mapId = this._currentBattleMapId, slot = this._currentBattleSlot;
    const playerMapId = this.Player.Data.mapID, epoch = this._battleEpoch;
    const isCurrent = () => this._currentBattle === battle && this._battleEpoch === epoch &&
      this.Player.Data.mapID === playerMapId;
    this._catchInProgress = true;
    try {
      await DatabaseHelper.Instance.SaveItemData(this.Player.ItemManager.ItemData);
      if (!isCurrent()) return;
      await this.ProcessCatchAttempt(capsuleID, battle, mapId, slot, isCurrent);
    } finally {
      this._catchInProgress = false;
    }
  }

  private async ProcessCatchAttempt(
    capsuleID: number, battle: IBattleInfo, mapId: number, slot: number, isCurrent: () => boolean
  ): Promise<void> {
    const catchResult = this._turnService.Catch(battle, capsuleID);

    if (catchResult.success) {
      await this.SyncBattlePetHP();
      if (!isCurrent()) return;
      const success = await this._rewardService.ProcessCatch(
        this.UserID,
        battle,
        catchResult.catchTime,
        mapId >= 0 ? mapId : undefined,
        slot >= 0 ? slot : undefined
      );
      // GivePet may already have committed the original target. Never retry/refund or finalize a successor battle.
      if (!isCurrent()) return;

      if (success) {
        battle.isOver = true;
        const enemyId = battle.enemy.id;
        await this.EmitCatchResult(true, capsuleID, battle);
        if (!isCurrent()) return;

        await this.Player.SendPacket(new PacketCatchMonster(catchResult.catchTime, enemyId));
        if (!isCurrent()) return;

        // 发送战斗结束协议（reason=6表示捕捉成功）
        await this.SendFightOverPacket(this.Player, 6, this.UserID);
        if (!isCurrent()) return;

        // 清理地图
        await this.CleanupPveMap(isCurrent);
        if (!isCurrent()) return;

        this.CleanupBattle();

        Logger.Info(
          `[BattleManager] 捕获成功: UserID=${this.UserID}, PetId=${enemyId}, ` +
          `捕获率=${catchResult.catchRate.toFixed(2)}%, 摇晃次数=${catchResult.shakeCount}`
        );
      } else {
        await this.EmitCatchResult(false, capsuleID, battle);
        if (!isCurrent()) return;
        await this.Player.SendPacket(new PacketEmpty(CommandID.CATCH_MONSTER).setResult(5003));
        Logger.Error(`[BattleManager] 捕获成功但入库失败: UserID=${this.UserID}`);
      }
    } else {
      // 捕获失败
      await this.EmitCatchResult(false, capsuleID, battle);
      if (!isCurrent()) return;
      await this.Player.SendPacket(new PacketCatchMonster(0, battle.enemy.id));
      if (!isCurrent()) return;
      Logger.Info(
        `[BattleManager] 捕获失败: UserID=${this.UserID}, ` +
        `捕获率=${catchResult.catchRate.toFixed(2)}%, 摇晃次数=${catchResult.shakeCount}`
      );

      // 敌方反击
      await this.ExecuteEnemyCounterAndSend(isCurrent);
      if (!isCurrent()) return;

      if (await this.CheckPlayerPetDeath(isCurrent)) return;

      Logger.Info(`[BattleManager] 捕获失败后敌人反击: 玩家HP=${this._currentBattle?.player.hp}, 敌人HP=${this._currentBattle?.enemy.hp}`);
    }
  }

  /**
   * 处理逃跑
   * CMD 2410: ESCAPE_FIGHT
   */
  public async HandleEscapeFight(): Promise<void> {
    return this.RunBattleAction(CommandID.ESCAPE_FIGHT, () => this.EscapeFight());
  }

  private async EscapeFight(): Promise<void> {
    const battle = this._currentBattle;
    if (!battle || battle.isOver || (battle.isPvp !== true && this._escapingBattles.has(battle))) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.ESCAPE_FIGHT).setResult(5001));
      return;
    }
    const epoch = this._battleEpoch, mapId = this.Player.Data.mapID;
    // Scope this continuation guard to PVE; leave the existing PVP escape behavior unchanged.
    const isCurrent = battle.isPvp === true ? () => true : () =>
      this._currentBattle === battle && this._battleEpoch === epoch && this.Player.Data.mapID === mapId;

    // Claim only this PVE battle before the first await; a successor must not share its lock.
    if (battle.isPvp !== true) this._escapingBattles.add(battle);
    try {
      Logger.Info(`[BattleManager] 逃跑成功: UserID=${this.UserID}`);

      await this.SyncBattlePetHP();
      if (!isCurrent()) return;

      await this.Player.SendPacket(new PacketEscapeFight(1));
      if (!isCurrent()) return;
      await this.Player.EventBus.Emit({
        type: BattleEventType.ESCAPE_RESULT,
        timestamp: Date.now(),
        playerId: this.UserID,
        success: true,
        reason: 'player_escape',
      } as IEscapeResultEvent);
      if (!isCurrent()) return;

      // 发送战斗结束包 (reason=1 表示逃跑)
      await this.SendFightOverPacket(this.Player, 1, 0);
      if (!isCurrent()) return;

      this.CleanupBattle();
    } finally {
      this._escapingBattles.delete(battle);
    }
  }

  // ==================== 查询/生命周期 ====================
  private async EmitCatchResult(success: boolean, capsuleId: number, battle: IBattleInfo): Promise<void> {
    await this.Player.EventBus.Emit({
      type: BattleEventType.CATCH_RESULT,
      timestamp: Date.now(),
      playerId: this.UserID,
      targetPetId: battle.enemy.id,
      success,
      capsuleId,
    } as ICatchResultEvent);
  }

  /**
   * 获取当前战斗状态
   */
  public GetCurrentBattle(): IBattleInfo | null {
    return this._currentBattle;
  }

  /**
   * 玩家登出时清理战斗
   */
  public async OnLogout(): Promise<void> {
    this._battleEpoch++;
    if (!this._currentBattle) {
      if (this._petRecoveryInProgress) {
        const release = await this.Player.ItemManager.ItemData.AcquireReward();
        try { await this.Player.PetManager.PetData.WaitForStagedSave(); }
        finally { release(); }
      }
      return;
    }

    Logger.Info(`[BattleManager] 玩家登出，清理战斗: UserID=${this.UserID}`);

    // 如果是PVP战斗，通知对手战斗结束（对手获胜）
    if (this._currentBattle.isPvp === true && this._currentBattle.player2Id) {
      await this._pvpService.OnLogout();
    } else if (this._currentBattle.isPvp !== true) {
      // A medicine operation owns BeginMutation until its persistence outcome is published.
      const release = await this.Player.ItemManager.ItemData.AcquireReward();
      try {
        await this.Player.PetManager.PetData.WaitForStagedSave();
        await this.SyncBattlePetHP();
        this.CleanupBattle();
      } finally {
        release();
      }
      return;
    }

    // 清理本地战斗数据
    this.CleanupBattle();
  }

  /**
   * 构建玩家背包中所有精灵的SimplePetInfoProto数组
   */
  public BuildPlayerPetsInfo(): SimplePetInfoProto[] {
    return this.Player.PetManager.GetPetsInBag().map(pet => {
      const petConfig = GameConfig.GetPetById(pet.petId);
      const skills = pet.skillArray.filter(s => s > 0);
      const finalSkills = skills.length > 0 ? skills : [10001];

      const skillsWithPP = finalSkills.map(skillId => {
        const skillConfig = GameConfig.GetSkillById(skillId);
        return {
          id: skillId,
          pp: this._currentBattle?.isPvp ? skillConfig?.MaxPP || 20 : GetPetSkillPP(pet, skillId)
        };
      });

      return new SimplePetInfoProto()
        .setPetId(pet.petId)
        .setLevel(pet.level)
        .setHP(pet.hp, pet.maxHp)
        .setSkills(skillsWithPP)
        .setCatchTime(pet.catchTime)
        .setCatchMap(301)
        .setCatchLevel(pet.level)
        .setSkinID(this.Player.ClientProtocol === 'xin-20261013' ? pet.skinId ?? 0 : 0)
        .setShiny(this.Player.ClientProtocol === 'xin-20261013' ? pet.shiny ?? 0 : 0);
    });
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 发送战斗准备通知 (NOTE_READY_TO_FIGHT)
   */
  private async SendReadyToFight(battle: IBattleInfo, enemyNickname: string = ''): Promise<void> {
    const playerNick = this.Player.Data.nick || `Player${this.UserID}`;
    const playerPets = this.BuildPlayerPetsInfo();
    const enemyPets = [BattleConverter.ToSimplePetInfo(battle.enemy)];

    // 如果是BOSS战斗，使用BOSS配置中的petName作为敌人昵称
    let actualEnemyNickname = enemyNickname;
    if (battle.bossMapId !== undefined && battle.bossParam2 !== undefined) {
      const bossConfig = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(battle.bossMapId, battle.bossParam2);
      if (bossConfig && bossConfig.petName) {
        actualEnemyNickname = bossConfig.petName;
      }
    }

    await this.Player.SendPacket(new PacketNoteReadyToFight(
      this.UserID,
      playerNick,
      playerPets,
      0,
      actualEnemyNickname,
      enemyPets,
      this.Player.ClientProtocol
    ));
  }

  /**
   * 检查是否是BOSS战斗
   */
  private async IsBossBattle(mapId: number, slot: number): Promise<boolean> {
    const mapConfig = GameConfig.GetMapConfigById(mapId);
    if (!mapConfig) return false;

    const ogre = mapConfig.ogres.find((o: any) => o.slot === slot);
    return ogre?.isBoss === true;
  }

  /**
   * 发送BOSS移除通知
   */
  private async SendBossRemovalNotification(region: number): Promise<void> {
    const bossRemoval = this.Player.MapSpawnManager.RemoveBoss(region);
    if (bossRemoval) {
      await this.Player.SendPacket(new PacketMapBoss([bossRemoval]));
      Logger.Info(`[BattleManager] 推送BOSS移除通知: region=${region}`);
    }
  }

  /**
   * 发送野怪列表更新
   */
  private async SendOgreListUpdate(): Promise<void> {
    const mapId = this.Player.Data.mapID || 1;
    const ogres = this.Player.MapSpawnManager.GetMapOgres(mapId);

    if (ogres.length > 0) {
      await this.Player.SendPacket(new PacketMapOgreList(ogres));
      Logger.Info(`[BattleManager] 推送野怪列表更新: mapId=${mapId}, count=${ogres.length}`);
    }
  }
}
