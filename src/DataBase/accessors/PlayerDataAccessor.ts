/**
 * PlayerData 访问器
 * 提供 PlayerData 的便捷访问接口
 * 
 * 注意：PlayerData 使用 PlayerRepository 加载，不使用通用 DataLoader
 */

import { PlayerData } from '../models/PlayerData';
import { DataCache } from '../cache/DataCache';
import { PlayerRepository } from '../repositories/Player/PlayerRepository';
import { Logger } from '../../shared/utils';
import { DatabaseManager } from '../DatabaseManager';

/**
 * PlayerData 访问器
 */
export class PlayerDataAccessor {
  private static _instance: PlayerDataAccessor;
  private _playerRepo: PlayerRepository;
  private static readonly PROP_TO_COLUMN: Record<string, string> = {
    userID: 'user_id',
    mapID: 'map_id',
    posX: 'pos_x',
    posY: 'pos_y',
  };

  private constructor() {
    this._playerRepo = new PlayerRepository();
  }

  public static get Instance(): PlayerDataAccessor {
    if (!PlayerDataAccessor._instance) {
      PlayerDataAccessor._instance = new PlayerDataAccessor();
    }
    return PlayerDataAccessor._instance;
  }

  /**
   * 获取 PlayerData（不创建）
   */
  public async Get(uid: number): Promise<PlayerData | null> {
    const cache = DataCache.Instance;

    // 先从缓存获取
    if (cache.Has('player', uid)) {
      return cache.Get<PlayerData>('player', uid)!;
    }

    // 从数据库加载
    try {
      const playerInfo = await this._playerRepo.FindByUserId(uid);
      if (!playerInfo) return null;

      const data = new PlayerData(playerInfo);
      cache.Set('player', uid, data);
      return data;
    } catch (error) {
      Logger.Error(`[PlayerDataAccessor] 加载 PlayerData 失败: uid=${uid}`, error as Error);
      return null;
    }
  }

  /**
   * 获取或创建 PlayerData
   * 注意：PlayerData 不应该自动创建，如果不存在会抛出错误
   */
  public async GetOrCreate(uid: number): Promise<PlayerData> {
    const existing = await this.Get(uid);
    if (existing) return existing;

    // 玩家不存在，抛出错误
    throw new Error(`[PlayerDataAccessor] PlayerData 不存在: uid=${uid}`);
  }

  /**
   * 保存 PlayerData 到数据库
   */
  public async Save(data: PlayerData): Promise<void> {
    let dirtyFields: string[] = [];

    try {
      // Metadata lookup must happen outside the exclusive driver connection.
      const columnsMeta = await this._playerRepo.GetPlayerColumnsMeta();
      let saved = false;
      while (!saved) {
        await data.WaitForExpAllocation();
        saved = await DatabaseManager.Instance.WithConnection(async driver => {
          // Allocation may start while this save waits for the connection.
          if (data.HasExpAllocation()) return false;
          dirtyFields = data.GetDirtyFields();
          const values = new Map(dirtyFields.map(field => [field, JSON.stringify((data as any)[field])]));
          const updates = this.buildColumnUpdates(data, dirtyFields, columnsMeta);
          if (Object.keys(updates).length > 0) {
            await this._playerRepo.UpdateByUserIdColumns(data.userID, updates, driver);
          }
          // A later mutation during the await still needs its own save.
          data.ClearDirtyFields(dirtyFields.filter(field => JSON.stringify((data as any)[field]) === values.get(field)));
          return true;
        });
      }
      Logger.Debug(`[PlayerDataAccessor] PlayerData saved: uid=${data.userID}`);
      return;
    } catch (error) {
      for (const field of dirtyFields) {
        data.MarkDirty(field);
      }
      Logger.Error(`[PlayerDataAccessor] Save PlayerData failed: uid=${data.userID}`, error as Error);
      throw error;
    }

  }
  private buildColumnUpdates(data: PlayerData, dirtyFields: string[], columnsMeta: Map<string, {type: string}>): Record<string, any> {
    const updates: Record<string, any> = {};
    const sourceFields = dirtyFields.length > 0
      ? dirtyFields
      : Object.keys(data as unknown as Record<string, any>);

    for (const prop of sourceFields) {
      // Clean cached wallet fields must not overwrite committed balances.
      if (['coins', 'gold', 'allocatableExp'].includes(prop) && !dirtyFields.includes(prop)) continue;
      const rawValue = (data as any)[prop];
      const column = this.toColumnName(prop);
      if (!column || column === 'user_id') continue;

      const meta = columnsMeta.get(column);
      if (!meta) continue;

      const serialized = this.serializeValueForColumn(rawValue, meta.type);
      if (serialized === undefined) continue;
      updates[column] = serialized;
    }

    if (columnsMeta.has('team_id') && data.teamInfo) {
      updates.team_id = Number(data.teamInfo.id) || 0;
    }

    return updates;
  }

  private toColumnName(prop: string): string {
    if (!prop) return '';
    if (PlayerDataAccessor.PROP_TO_COLUMN[prop]) {
      return PlayerDataAccessor.PROP_TO_COLUMN[prop];
    }

    return prop
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase();
  }

  private serializeValueForColumn(value: any, columnType: string): any {
    if (value === undefined) return undefined;
    if (value === null) return null;

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (Array.isArray(value) || typeof value === 'object') {
      return this.isJsonLikeColumn(columnType) ? JSON.stringify(value) : undefined;
    }

    return value;
  }

  private isJsonLikeColumn(columnType: string): boolean {
    const t = String(columnType || '').toLowerCase();
    return t.includes('json') || t.includes('text') || t.includes('char') || t.includes('blob');
  }
}
