import { PlayerInstance } from '../Player/PlayerInstance';
import { GameEventBus } from '../Event/GameEventBus';

/**
 * Manager 基类
 * 所有玩家相关的 Manager 都应该继承此类
 *
 * 生命周期：
 *   1. constructor(player)        — 创建实例
 *   2. RegisterEvents(eventBus)   — 注册事件监听（在 Initialize 之前调用）
 *   3. Initialize()               — 加载数据库数据
 *   4. OnLogout()                 — 玩家登出清理
 *
 * 事件解耦原则：
 *   - 每个 Manager 在 RegisterEvents() 中注册自己关心的事件
 *   - 在业务方法中通过 this.Player.EventBus.Emit() 发出事件
 *   - Manager 之间通过事件通信，不直接调用对方方法
 */
export abstract class BaseManager {
  public Player: PlayerInstance;

  constructor(player: PlayerInstance) {
    this.Player = player;
  }

  /**
   * 获取玩家 UserID（便捷访问）
   */
  protected get UserID(): number {
    return this.Player.Uid;
  }

  /**
   * 注册事件监听
   * 子类重写此方法，在其中调用 eventBus.On() 注册感兴趣的事件。
   * 此方法在 Initialize() 之前调用，确保事件就绪。
   *
   * @example
   * public RegisterEvents(eventBus: GameEventBus): void {
   *   eventBus.On(BattleEventType.BATTLE_END, this.OnBattleEnd.bind(this), 50);
   * }
   */
  public RegisterEvents(eventBus: GameEventBus): void {
    // 子类可以重写
  }

  /**
   * Manager 初始化
   * 子类可以重写此方法来执行初始化逻辑
   *
   * @example
   * public async Initialize(): Promise<void> {
   *   await super.Initialize();
   *   // 加载玩家数据
   *   this._items = await this._itemRepo.FindByUserId(this.UserID);
   * }
   */
  public async Initialize(): Promise<void> {
    // 子类可以重写
  }

  /**
   * 玩家登出时清理
   * 子类可以重写此方法来执行清理逻辑
   *
   * @example
   * public async OnLogout(): Promise<void> {
   *   await super.OnLogout();
   *   // 保存数据
   *   await this._itemRepo.SaveAll(this._items);
   *   // 清理缓存
   *   this._items = [];
   * }
   */
  public async OnLogout(): Promise<void> {
    // 子类可以重写
  }
}
