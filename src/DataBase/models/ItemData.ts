/**
 * 物品数据类
 * 直接映射数据库表，提供静态方法便捷访问
 * 
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */

import { DatabaseHelper } from '../DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';
import { BaseData } from './BaseData';
import { DatabaseManager } from '../DatabaseManager';

/**
 * 单个物品信息
 */
export interface IItemInfo {
  itemId: number;
  count: number;
  expireTime: number;
}

/**
 * 物品数据（对应数据库表 items）
 * 
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - 提供静态方法 GetItemDataByUid 便捷访问
 */
const pendingRewards = new WeakSet<ItemData>();
const rewardCompletion = new WeakMap<ItemData, Promise<void>>();
const activeMutations = new WeakMap<ItemData, number>();
const mutationCompletion = new WeakMap<ItemData, { promise: Promise<void>; resolve: () => void }>();

export class ItemData extends BaseData {
  /** 用户ID（主键） */
  public Uid: number;

  /** 物品列表 */
  public ItemList: IItemInfo[] = [];

  constructor(uid: number) {
    if (!uid || uid === 0) {
      throw new Error(`[ItemData] Invalid uid: ${uid}`);
    }
    
    // 调用父类构造函数，传入黑名单字段和数组字段
    super(
      uid,
      [], // 额外的黑名单字段
      ['ItemList'] // 需要深度 Proxy 的数组字段
    );
    
    this.Uid = uid;

    // 返回 Proxy 包装的对象，实现自动保存
    return this.createProxy(this);
  }
  /**
   * 立即保存到数据库
   */
  public async save(): Promise<void> {
    try {
      await DatabaseHelper.Instance.SaveItemData(this);
      Logger.Debug(`[ItemData] 自动保存成功: uid=${this.Uid}`);
    } catch (error) {
      Logger.Error(`[ItemData] 自动保存失败: uid=${this.Uid}`, error as Error);
    }
  }

  /**
   * 从数据库行创建 ItemData
   */
  public static FromRow(row: any): ItemData {
    const data = new ItemData(row.owner_id);
    data.ItemList = row.item_list ? JSON.parse(row.item_list) : [];
    return data;
  }

  /**
   * 转换为数据库行
   */
  public ToRow(): any {
    return {
      owner_id: this.Uid,
      item_list: JSON.stringify(this.ItemList)
    };
  }

  /**
   * 静态方法：根据 UID 获取物品数据
   */
  public static async GetItemDataByUid(uid: number): Promise<ItemData | null> {
    const data = await DatabaseHelper.Instance.GetInstance_ItemData(uid);
    return data;
  }

  /**
   * 添加物品
   */
  public HasPendingReward(): boolean {
    return pendingRewards.has(this);
  }

  public WaitForReward(): Promise<void> {
    return rewardCompletion.get(this) || Promise.resolve();
  }

  /** Ordinary async inventory operations may overlap as before, but exclude a staged reward. */
  public BeginMutation(): (() => void) | null {
    if (this.HasPendingReward()) return null;
    if (!activeMutations.get(this)) {
      let resolve!: () => void;
      const promise = new Promise<void>(done => { resolve = done; });
      mutationCompletion.set(this, { promise, resolve });
    }
    activeMutations.set(this, (activeMutations.get(this) || 0) + 1);
    return () => {
      const remaining = (activeMutations.get(this) || 0) - 1;
      activeMutations.set(this, remaining);
      if (!remaining) { mutationCompletion.get(this)?.resolve(); mutationCompletion.delete(this); }
    };
  }

  /** Battle drops wait outside the connection queue, including for task 87 or ordinary inventory writes. */
  public async AcquireReward(): Promise<() => void> {
    while (this.HasPendingReward() || activeMutations.get(this)) {
      if (this.HasPendingReward()) await this.WaitForReward();
      else await mutationCompletion.get(this)!.promise;
    }
    return this.ReserveReward();
  }

  /** Caller owns AcquireReward. Publish only a committed drop; queued autosaves then see that state. */
  public async CommitDrop(itemId: number, count: number): Promise<void> {
    if (!this.HasPendingReward()) throw new Error('Drop reservation required');
    if (!Number.isInteger(count) || count <= 0 || count > 0xFFFFFFFF) throw new Error('Invalid drop count');
    await DatabaseManager.Instance.WithConnection(async driver => {
      const staged = this.ItemList.map(item => ({ ...item }));
      const existing = staged.find(item => item.itemId === itemId);
      if (existing) {
        if (!Number.isInteger(existing.count) || existing.count < 0 || existing.count + count > 0xFFFFFFFF) {
          throw new Error('Item count out of range');
        }
        existing.count += count;
      } else staged.push({ itemId, count, expireTime: 0x057E40 });
      let committed = false;
      await driver.beginTransaction();
      try {
        const write = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?',
          [JSON.stringify(staged), this.Uid]);
        if (write.affectedRows !== 1) throw new Error('Drop inventory data missing');
        await driver.commit();
        committed = true;
        this.ItemList = staged;
      } catch (error) {
        if (!committed) await driver.rollback();
        throw error;
      }
    });
  }

  public ReserveReward(): () => void {
    if (this.HasPendingReward() || activeMutations.get(this)) throw new Error('Inventory operation pending');
    pendingRewards.add(this);
    let complete!: () => void;
    rewardCompletion.set(this, new Promise<void>(resolve => { complete = resolve; }));
    return () => { pendingRewards.delete(this); rewardCompletion.delete(this); complete(); };
  }

  public AddItem(itemId: number, count: number, expireTime: number = 0): void {
    if (this.HasPendingReward()) throw new Error('Inventory reward pending');
    const existing = this.ItemList.find(item => item.itemId === itemId);
    if (existing) {
      existing.count += count;
    } else {
      this.ItemList.push({ itemId, count, expireTime });
    }
    // 自动触发保存（通过深度 Proxy）
  }

  /**
   * 移除物品
   */
  public RemoveItem(itemId: number, count: number): boolean {
    if (this.HasPendingReward()) return false;
    const existing = this.ItemList.find(item => item.itemId === itemId);
    if (!existing || existing.count < count) {
      return false;
    }
    
    existing.count -= count;
    if (existing.count <= 0) {
      this.ItemList = this.ItemList.filter(item => item.itemId !== itemId);
    }
    
    // 自动触发保存（通过深度 Proxy）
    return true;
  }

  /**
   * 检查是否拥有物品
   */
  public HasItem(itemId: number): boolean {
    return this.ItemList.some(item => item.itemId === itemId && item.count > 0);
  }

  /**
   * 获取物品数量
   */
  public GetItemCount(itemId: number): number {
    const item = this.ItemList.find(item => item.itemId === itemId);
    return item ? item.count : 0;
  }
}
