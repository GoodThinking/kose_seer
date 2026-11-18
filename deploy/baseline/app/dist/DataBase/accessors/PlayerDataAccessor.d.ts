/**
 * PlayerData 访问器
 * 提供 PlayerData 的便捷访问接口
 *
 * 注意：PlayerData 使用 PlayerRepository 加载，不使用通用 DataLoader
 */
import { PlayerData } from '../models/PlayerData';
/**
 * PlayerData 访问器
 */
export declare class PlayerDataAccessor {
    private static _instance;
    private _playerRepo;
    private static readonly PROP_TO_COLUMN;
    private constructor();
    static get Instance(): PlayerDataAccessor;
    /**
     * 获取 PlayerData（不创建）
     */
    Get(uid: number): Promise<PlayerData | null>;
    /**
     * 获取或创建 PlayerData
     * 注意：PlayerData 不应该自动创建，如果不存在会抛出错误
     */
    GetOrCreate(uid: number): Promise<PlayerData>;
    /**
     * 保存 PlayerData 到数据库
     */
    Save(data: PlayerData): Promise<void>;
    private buildColumnUpdates;
    private toColumnName;
    private serializeValueForColumn;
    private isJsonLikeColumn;
}
//# sourceMappingURL=PlayerDataAccessor.d.ts.map