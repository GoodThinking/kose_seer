import { Logger } from '../../../../shared/utils';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { OnlineTracker } from '../../Player/OnlineTracker';
import { BattleType, IBattleInfo, IBattlePet, ITurnResult } from '../../../../shared/models/BattleModel';
import { BattleConverter } from '../BattleConverter';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { BattleEffectIntegration } from '../BattleEffectIntegration';
import { PvpBattleManager, IPvpAction } from '../PvpBattleManager';
import { BattleInitService } from './BattleInitService';
import { BattleTurnService } from './BattleTurnService';
import { PacketNoteStartFight, PacketNoteUseSkill, PacketChangePet } from '../../../Server/Packet/Send/Battle';
import {
  BattleEventType,
  IAttackResultEvent,
  IBattleRoundEndEvent,
  IBattleRoundStartEvent,
  IBattleStartEvent,
  IPetDeadEvent,
  IPetSwitchEvent,
  IStatusChangeEvent,
} from '../../Event/EventTypes';

/**
 * PvP战斗服务
 * 处理PvP战斗的准备、回合结算、换精灵等逻辑
 * 从 BattleManager 中拆分出来，减少主类体积
 */
export class BattlePvpService {
  private _player: PlayerInstance;
  private _initService: BattleInitService;
  private _turnService: BattleTurnService;

  /**
   * 获取/设置当前战斗实例的回调
   * 由 BattleManager 注入，避免循环依赖
   */
  private _getBattle: () => IBattleInfo | null;
  private _getHPMap: () => Map<number, number>;
  private _updateBattlePet: (battlePet: IBattlePet, newPet: any, petConfig: any) => void;
  private _buildAttackValuePair: (result: ITurnResult, pet1UserId: number, pet2UserId: number) => { firstAttack: any; secondAttack: any };
  private _deductSkillPP: (pet: IBattlePet, skillId: number) => void;
  private _sendFightOverPacket: (player: PlayerInstance, reason: number, winnerId: number) => Promise<void>;
  private _handleFightOver: (winnerId: number, reason: number) => Promise<void>;
  private _syncBattlePetHP: () => Promise<void>;
  private _cleanupBattle: () => void;
  private _initializeBattle: (battle: IBattleInfo) => void;

  constructor(
    player: PlayerInstance,
    initService: BattleInitService,
    turnService: BattleTurnService,
    callbacks: {
      getBattle: () => IBattleInfo | null;
      getHPMap: () => Map<number, number>;
      updateBattlePet: (battlePet: IBattlePet, newPet: any, petConfig: any) => void;
      buildAttackValuePair: (result: ITurnResult, pet1UserId: number, pet2UserId: number) => { firstAttack: any; secondAttack: any };
      deductSkillPP: (pet: IBattlePet, skillId: number) => void;
      sendFightOverPacket: (player: PlayerInstance, reason: number, winnerId: number) => Promise<void>;
      handleFightOver: (winnerId: number, reason: number) => Promise<void>;
      syncBattlePetHP: () => Promise<void>;
      cleanupBattle: () => void;
      initializeBattle: (battle: IBattleInfo) => void;
    }
  ) {
    this._player = player;
    this._initService = initService;
    this._turnService = turnService;
    this._getBattle = callbacks.getBattle;
    this._getHPMap = callbacks.getHPMap;
    this._updateBattlePet = callbacks.updateBattlePet;
    this._buildAttackValuePair = callbacks.buildAttackValuePair;
    this._deductSkillPP = callbacks.deductSkillPP;
    this._sendFightOverPacket = callbacks.sendFightOverPacket;
    this._handleFightOver = callbacks.handleFightOver;
    this._syncBattlePetHP = callbacks.syncBattlePetHP;
    this._cleanupBattle = callbacks.cleanupBattle;
    this._initializeBattle = callbacks.initializeBattle;
  }

  private get battle(): IBattleInfo | null {
    return this._getBattle();
  }

  private get hpMap(): Map<number, number> {
    return this._getHPMap();
  }

  private CaptureStatusSnapshot(battle: IBattleInfo): {
    playerStatus?: number;
    playerTurns: number;
    enemyStatus?: number;
    enemyTurns: number;
  } {
    return {
      playerStatus: battle.player.status,
      playerTurns: battle.player.statusTurns || 0,
      enemyStatus: battle.enemy.status,
      enemyTurns: battle.enemy.statusTurns || 0,
    };
  }

  private async EmitForBothPlayers(
    player1: PlayerInstance | undefined,
    player2: PlayerInstance | undefined,
    buildEvent: (playerId: number) => object
  ): Promise<void> {
    if (player1) {
      await player1.EventBus.Emit(buildEvent(player1.Uid) as any);
    }
    if (player2) {
      await player2.EventBus.Emit(buildEvent(player2.Uid) as any);
    }
  }

  /**
   * 处理PVP战斗准备
   */
  public async HandleReadyToFight(pvpRoom: any): Promise<void> {
    const allReady = PvpBattleManager.Instance.SetPlayerReady(this._player.Uid);

    if (!allReady) {
      Logger.Info(`[BattlePvpService] PVP战斗准备: UserID=${this._player.Uid}, 等待对手准备`);
      return;
    }

    Logger.Info(`[BattlePvpService] PVP战斗双方准备完毕，开始创建战斗实例`);

    const player1Session = OnlineTracker.Instance.GetPlayerSession(pvpRoom.player1Id);
    const player2Session = OnlineTracker.Instance.GetPlayerSession(pvpRoom.player2Id);

    if (!player1Session?.Player || !player2Session?.Player) {
      Logger.Error(`[BattlePvpService] 无法获取PVP玩家实例`);
      return;
    }

    const battle = await this.CreateBattle(player1Session.Player, player2Session.Player);

    if (!battle) {
      Logger.Error(`[BattlePvpService] 创建PVP战斗失败`);
      return;
    }

    player1Session.Player.BattleManager['_pvpService']._initializeBattle(battle);
    player2Session.Player.BattleManager['_pvpService']._initializeBattle(battle);

    // 初始化对手的HP记录（player2视角）
    const p2HPMap = player2Session.Player.BattleManager['_pvpService']._getHPMap();
    p2HPMap.set(battle.enemy.catchTime, battle.enemy.hp);

    const battleStartResults = BattleEffectIntegration.OnBattleStart(battle);
    Logger.Debug(`[BattlePvpService] PVP战斗开始效果: ${battleStartResults.length}个结果`);

    const player1Pet = BattleConverter.ToFightPetInfo(battle.player, pvpRoom.player1Id, 0);
    const player2Pet = BattleConverter.ToFightPetInfo(battle.enemy, pvpRoom.player2Id, 0);

    Logger.Debug(
      `[BattlePvpService] 发送NOTE_START_FIGHT给双方: ` +
      `player1(${pvpRoom.player1Id}), player2(${pvpRoom.player2Id})`
    );

    await player1Session.Player.SendPacket(new PacketNoteStartFight(0, player1Pet, player2Pet));
    await player2Session.Player.SendPacket(new PacketNoteStartFight(0, player2Pet, player1Pet));
    await this.EmitForBothPlayers(player1Session.Player, player2Session.Player, (playerId) => ({
      type: BattleEventType.BATTLE_START,
      timestamp: Date.now(),
      playerId,
      battleType: BattleType.PVP,
      mapId: -1,
      playerPetId: battle.player.petId,
      enemyPetId: battle.enemy.petId,
      enemyLevel: battle.enemy.level,
    } as IBattleStartEvent));

    Logger.Info(
      `[BattlePvpService] PVP战斗开始: player1=${pvpRoom.player1Id}, player2=${pvpRoom.player2Id}`
    );
  }

  /**
   * 创建PVP战斗实例
   */
  public async CreateBattle(
    player1: PlayerInstance,
    player2: PlayerInstance
  ): Promise<IBattleInfo | null> {
    try {
      const player1Pets = player1.PetManager.GetPetsInBag();
      const player2Pets = player2.PetManager.GetPetsInBag();

      const player1HealthyPets = player1Pets.filter(p => p.hp > 0);
      const player2HealthyPets = player2Pets.filter(p => p.hp > 0);

      if (player1HealthyPets.length === 0 || player2HealthyPets.length === 0) {
        Logger.Warn(`[BattlePvpService] PVP战斗创建失败：有玩家没有健康精灵`);
        return null;
      }

      const player1Pet = player1HealthyPets.find(p => p.isDefault) || player1HealthyPets[0];
      const player2Pet = player2HealthyPets.find(p => p.isDefault) || player2HealthyPets[0];

      const player1PetConfig = GameConfig.GetPetById(player1Pet.petId);
      const player2PetConfig = GameConfig.GetPetById(player2Pet.petId);

      if (!player1PetConfig || !player2PetConfig) {
        Logger.Warn(`[BattlePvpService] PVP战斗创建失败：找不到精灵配置`);
        return null;
      }

      const player1BattlePet = this._initService['BuildBattlePet'](
        player1Pet.petId,
        player1Pet.nick || player1PetConfig.DefName || 'Pet',
        player1Pet.level, player1Pet.hp, player1Pet.maxHp,
        player1Pet.atk, player1Pet.def, player1Pet.spAtk, player1Pet.spDef, player1Pet.speed,
        player1PetConfig.Type || 0,
        player1Pet.skillArray.filter((s: number) => s > 0).length > 0 ? player1Pet.skillArray.filter((s: number) => s > 0) : [10001],
        player1Pet.catchTime, 0
      );

      const player2BattlePet = this._initService['BuildBattlePet'](
        player2Pet.petId,
        player2Pet.nick || player2PetConfig.DefName || 'Pet',
        player2Pet.level, player2Pet.hp, player2Pet.maxHp,
        player2Pet.atk, player2Pet.def, player2Pet.spAtk, player2Pet.spDef, player2Pet.speed,
        player2PetConfig.Type || 0,
        player2Pet.skillArray.filter((s: number) => s > 0).length > 0 ? player2Pet.skillArray.filter((s: number) => s > 0) : [10001],
        player2Pet.catchTime, 0
      );

      const battle: IBattleInfo = {
        userId: player1.Uid,
        player: player1BattlePet,
        enemy: player2BattlePet,
        turn: 0,
        isOver: false,
        isPvp: true,
        player2Id: player2.Uid,
        startTime: Date.now()
      };

      return battle;
    } catch (error) {
      Logger.Error(`[BattlePvpService] 创建PVP战斗失败`, error as Error);
      return null;
    }
  }

  /**
   * 处理PVP战斗中的技能使用
   */
  public async HandleUseSkill(skillId: number): Promise<void> {
    const battle = this.battle;
    if (!battle || !battle.player2Id) {
      Logger.Error(`[BattlePvpService] PVP战斗数据异常`);
      return;
    }

    const isPlayer1 = this._player.Uid === battle.userId;
    const myPet = isPlayer1 ? battle.player : battle.enemy;

    this._deductSkillPP(myPet, skillId);

    const action: IPvpAction = { type: 'skill', skillId };
    const bothReady = PvpBattleManager.Instance.SetPlayerAction(this._player.Uid, action);

    if (!bothReady) {
      Logger.Info(`[BattlePvpService] PVP等待对手提交动作: UserID=${this._player.Uid}, SkillId=${skillId}`);
      return;
    }

    await this.ResolveTurn();
  }

  /**
   * 处理PVP换精灵动作提交
   * @returns true 如果双方都已提交动作（已触发 ResolveTurn）
   */
  public async HandleChangePetAction(catchTime: number): Promise<boolean> {
    const action: IPvpAction = { type: 'changePet', catchTime };
    const bothReady = PvpBattleManager.Instance.SetPlayerAction(this._player.Uid, action);

    if (!bothReady) {
      Logger.Info(`[BattlePvpService] PVP换精灵，等待对手: UserID=${this._player.Uid}, CatchTime=${catchTime}`);
      return false;
    }

    await this.ResolveTurn();
    return true;
  }

  /**
   * PVP回合结算
   */
  public async ResolveTurn(): Promise<void> {
    const battle = this.battle;
    if (!battle || !battle.player2Id) return;

    const actions = PvpBattleManager.Instance.GetActions(this._player.Uid);
    if (!actions) {
      Logger.Error(`[BattlePvpService] ResolveTurn: 获取动作失败`);
      return;
    }

    const { player1Action, player2Action, player1Id, player2Id } = actions;

    const player1Session = OnlineTracker.Instance.GetPlayerSession(player1Id);
    const player2Session = OnlineTracker.Instance.GetPlayerSession(player2Id);

    const player1ChangePet = player1Action.type === 'changePet';
    const player2ChangePet = player2Action.type === 'changePet';

    // 处理换精灵动作（在结算前执行）
    if (player1ChangePet && player1Action.catchTime) {
      await this.ExecuteChangePet(player1Id, player1Action.catchTime, true);
    }
    if (player2ChangePet && player2Action.catchTime) {
      await this.ExecuteChangePet(player2Id, player2Action.catchTime, false);
    }

    // 如果双方都换精灵，不执行技能回合，直接结束
    if (player1ChangePet && player2ChangePet) {
      Logger.Info(`[BattlePvpService] PVP双方都换精灵，跳过技能回合`);
      PvpBattleManager.Instance.ClearActions(this._player.Uid);
      return;
    }

    // 确定双方的技能ID（换精灵的一方技能ID为0）
    const player1SkillId = player1ChangePet ? 0 : (player1Action.skillId || 0);
    const player2SkillId = player2ChangePet ? 0 : (player2Action.skillId || 0);

    Logger.Info(
      `[BattlePvpService] PVP回合结算: player1(${player1Id}) ` +
      `action=${player1ChangePet ? 'changePet' : 'skill'} skill=${player1SkillId}, ` +
      `player2(${player2Id}) action=${player2ChangePet ? 'changePet' : 'skill'} skill=${player2SkillId}`
    );

    // 执行PVP回合（传入pet2SkillId）
    const statusBefore = this.CaptureStatusSnapshot(battle);
    const oldPlayerHp = battle.player.hp;
    const oldEnemyHp = battle.enemy.hp;
    const round = battle.turn + 1;
    await this.EmitForBothPlayers(player1Session?.Player, player2Session?.Player, (playerId) => ({
      type: BattleEventType.ROUND_START,
      timestamp: Date.now(),
      playerId,
      battleType: BattleType.PVP,
      mapId: -1,
      round,
    } as IBattleRoundStartEvent));

    const result = this._turnService.ExecuteTurn(battle, player1SkillId, player2SkillId);

    // 构建攻击结果并发送给双方
    const { firstAttack, secondAttack } = this._buildAttackValuePair(result, player1Id, player2Id);

    if (player1Session?.Player) {
      await player1Session.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack, player1Session.Player.ClientProtocol));
    }
    if (player2Session?.Player) {
      await player2Session.Player.SendPacket(new PacketNoteUseSkill(firstAttack, secondAttack, player2Session.Player.ClientProtocol));
    }

    // 更新HP记录
    if (player1Session?.Player) {
      const p1Map = player1Session.Player.BattleManager['_battlePetHPMap'] as Map<number, number>;
      p1Map.set(battle.player.catchTime, battle.player.hp);
    }
    if (player2Session?.Player) {
      const p2Map = player2Session.Player.BattleManager['_battlePetHPMap'] as Map<number, number>;
      p2Map.set(battle.enemy.catchTime, battle.enemy.hp);
    }

    const emitAttack = async (attack: any): Promise<void> => {
      if (!attack || attack.skillId <= 0) return;

      const attackerIsPlayer1 = attack.userId === battle.userId;
      const attackerPet = attackerIsPlayer1 ? battle.player : battle.enemy;
      const targetPet = attackerIsPlayer1 ? battle.enemy : battle.player;

      await this.EmitForBothPlayers(player1Session?.Player, player2Session?.Player, (playerId) => ({
        type: BattleEventType.ATTACK_RESULT,
        timestamp: Date.now(),
        playerId,
        attackerId: attackerPet.petId,
        targetId: targetPet.petId,
        skillId: attack.skillId,
        damage: attack.damage,
        isCritical: attack.isCrit,
        isMissed: attack.missed,
        hpChange: -attack.damage,
      } as IAttackResultEvent));
    };

    await emitAttack(result.firstAttack);
    await emitAttack(result.secondAttack);

    const emitStatusTransition = async (
      pet: IBattlePet,
      prevStatus?: number,
      prevTurns: number = 0
    ): Promise<void> => {
      const currentStatus = pet.status;
      const currentTurns = pet.statusTurns || 0;
      if (prevStatus === currentStatus) return;

      if (prevStatus !== undefined) {
        await this.EmitForBothPlayers(player1Session?.Player, player2Session?.Player, (playerId) => ({
          type: BattleEventType.STATUS_CHANGE,
          timestamp: Date.now(),
          playerId,
          petId: pet.petId,
          status: prevStatus,
          statusTurns: prevTurns,
          isAdd: false,
        } as IStatusChangeEvent));
      }

      if (currentStatus !== undefined) {
        await this.EmitForBothPlayers(player1Session?.Player, player2Session?.Player, (playerId) => ({
          type: BattleEventType.STATUS_CHANGE,
          timestamp: Date.now(),
          playerId,
          petId: pet.petId,
          status: currentStatus,
          statusTurns: currentTurns,
          isAdd: true,
        } as IStatusChangeEvent));
      }
    };

    await emitStatusTransition(battle.player, statusBefore.playerStatus, statusBefore.playerTurns);
    await emitStatusTransition(battle.enemy, statusBefore.enemyStatus, statusBefore.enemyTurns);

    if (oldPlayerHp > 0 && battle.player.hp <= 0) {
      await this.EmitForBothPlayers(player1Session?.Player, player2Session?.Player, (playerId) => ({
        type: BattleEventType.PET_DEAD,
        timestamp: Date.now(),
        playerId,
        petId: battle.player.petId,
        catchTime: battle.player.catchTime,
        killerId: battle.enemy.petId,
      } as IPetDeadEvent));
    }

    if (oldEnemyHp > 0 && battle.enemy.hp <= 0) {
      await this.EmitForBothPlayers(player1Session?.Player, player2Session?.Player, (playerId) => ({
        type: BattleEventType.PET_DEAD,
        timestamp: Date.now(),
        playerId,
        petId: battle.enemy.petId,
        catchTime: battle.enemy.catchTime,
        killerId: battle.player.petId,
      } as IPetDeadEvent));
    }

    await this.EmitForBothPlayers(player1Session?.Player, player2Session?.Player, (playerId) => ({
      type: BattleEventType.ROUND_END,
      timestamp: Date.now(),
      playerId,
      battleType: BattleType.PVP,
      mapId: -1,
      round: battle.turn,
      isOver: result.isOver,
      winnerId: result.winner,
    } as IBattleRoundEndEvent));

    PvpBattleManager.Instance.ClearActions(this._player.Uid);

    const p1Hp = battle.player.hp;
    const p2Hp = battle.enemy.hp;

    await this.CheckBattleEnd(result, player1Id, player2Id);

    Logger.Info(
      `[BattlePvpService] PVP回合结算完成: player1HP=${p1Hp}, player2HP=${p2Hp}, isOver=${result.isOver}`
    );
  }

  /**
   * 执行PVP换精灵
   */
  private async ExecuteChangePet(userId: number, catchTime: number, isPlayer1: boolean): Promise<void> {
    const battle = this.battle;
    if (!battle) return;

    const session = OnlineTracker.Instance.GetPlayerSession(userId);
    if (!session?.Player) return;

    const playerPets = session.Player.PetManager.GetPetsInBag();
    const newPet = playerPets.find(p => p.catchTime === catchTime);
    if (!newPet) return;

    const petConfig = GameConfig.GetPetById(newPet.petId);
    if (!petConfig) return;

    const battlePet = isPlayer1 ? battle.player : battle.enemy;
    const oldPetId = battlePet.petId;

    // 保存旧精灵的HP
    const oldCatchTime = battlePet.catchTime;
    const battleManager = session.Player.BattleManager;
    (battleManager['_battlePetHPMap'] as Map<number, number>).set(oldCatchTime, battlePet.hp);

    this._updateBattlePet(battlePet, newPet, petConfig);
    (battleManager['_battlePetHPMap'] as Map<number, number>).set(newPet.catchTime, battlePet.hp);

    // 发送换精灵通知给双方
    const opponentId = isPlayer1 ? battle.player2Id! : battle.userId;
    const opponentSession = OnlineTracker.Instance.GetPlayerSession(opponentId);

    await session.Player.SendPacket(new PacketChangePet(
      userId, newPet.petId,
      newPet.nick || petConfig.DefName || 'Pet',
      newPet.level, battlePet.hp, battlePet.maxHp, newPet.catchTime
    ));

    if (opponentSession?.Player) {
      await opponentSession.Player.SendPacket(new PacketChangePet(
        userId, newPet.petId,
        newPet.nick || petConfig.DefName || 'Pet',
        newPet.level, battlePet.hp, battlePet.maxHp, newPet.catchTime
      ));
    }

    await this.EmitForBothPlayers(session.Player, opponentSession?.Player, (playerId) => ({
      type: BattleEventType.PET_SWITCH,
      timestamp: Date.now(),
      playerId,
      oldPetId,
      oldCatchTime,
      newPetId: battlePet.petId,
      newCatchTime: battlePet.catchTime,
    } as IPetSwitchEvent));

    Logger.Info(`[BattlePvpService] PVP换精灵: userId=${userId}, newPetId=${newPet.petId}, isPlayer1=${isPlayer1}`);
  }

  /**
   * 检查PVP战斗结束条件
   */
  private async CheckBattleEnd(
    result: { isOver: boolean; winner?: number; reason?: number },
    player1Id: number,
    player2Id: number
  ): Promise<void> {
    const battle = this.battle;
    if (!battle) return;

    const player1Session = OnlineTracker.Instance.GetPlayerSession(player1Id);
    const player2Session = OnlineTracker.Instance.GetPlayerSession(player2Id);

    if (battle.player.hp <= 0) {
      const p1Pets = player1Session?.Player?.PetManager.GetPetsInBag();
      const p1HasHealthy = p1Pets?.some(p => p.hp > 0 && p.catchTime !== battle.player.catchTime);

      if (!p1HasHealthy) {
        battle.isOver = true;
        await this._handleFightOver(player2Id, 0);
        return;
      }
      Logger.Info(`[BattlePvpService] PVP玩家1精灵阵亡，等待切换`);
    }

    if (battle.enemy.hp <= 0) {
      const p2Pets = player2Session?.Player?.PetManager.GetPetsInBag();
      const p2HasHealthy = p2Pets?.some(p => p.hp > 0 && p.catchTime !== battle.enemy.catchTime);

      if (!p2HasHealthy) {
        battle.isOver = true;
        await this._handleFightOver(player1Id, 0);
        return;
      }
      Logger.Info(`[BattlePvpService] PVP玩家2精灵阵亡，等待切换`);
    }

    if (result.isOver) {
      await this._handleFightOver(result.winner || 0, result.reason || 0);
    }
  }

  /**
   * 通知PvP对手战斗结束
   */
  public async NotifyOpponentFightOver(reason: number, winnerId: number): Promise<void> {
    const battle = this.battle;
    if (!battle?.player2Id) return;

    const actualOpponentId = this._player.Uid === battle.userId
      ? battle.player2Id
      : battle.userId;
    const savedPlayer1Id = battle.userId;
    const savedPlayer2Id = battle.player2Id;

    const opponentSession = OnlineTracker.Instance.GetPlayerSession(actualOpponentId);
    if (opponentSession?.Player) {
      await this._sendFightOverPacket(opponentSession.Player, reason, winnerId);
      await opponentSession.Player.BattleManager['SyncBattlePetHP']();
      opponentSession.Player.BattleManager['CleanupBattle']();
    }

    const roomKey = PvpBattleManager.Instance['GetRoomKey'](savedPlayer1Id, savedPlayer2Id);
    PvpBattleManager.Instance.RemoveBattleRoom(roomKey);
  }

  /**
   * 玩家登出时处理PVP战斗
   */
  public async OnLogout(): Promise<void> {
    const battle = this.battle;
    if (!battle || battle.isPvp !== true || !battle.player2Id) return;

    const opponentId = this._player.Uid === battle.userId
      ? battle.player2Id
      : battle.userId;

    Logger.Info(`[BattlePvpService] PVP战斗中玩家掉线，通知对手: opponentId=${opponentId}`);

    const opponentSession = OnlineTracker.Instance.GetPlayerSession(opponentId);
    if (opponentSession?.Player) {
      await this._sendFightOverPacket(opponentSession.Player, 1, opponentId);
      await opponentSession.Player.BattleManager['SyncBattlePetHP']();
      opponentSession.Player.BattleManager['CleanupBattle']();
    }

    // 清理PVP房间
    const roomKey = PvpBattleManager.Instance['GetRoomKey'](battle.userId, battle.player2Id);
    PvpBattleManager.Instance.RemoveBattleRoom(roomKey);
  }
}
