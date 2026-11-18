import { ChallengeProgressData } from '../models/ChallengeProgressData';
/**
 * 挑战进度数据访问器
 * 负责挑战进度数据的数据库操作和缓存管理
 */
export declare class ChallengeProgressDataAccessor {
    private static _instance;
    private _cache;
    private constructor();
    static get Instance(): ChallengeProgressDataAccessor;
    /**
     * 获取或创建挑战进度数据
     */
    GetOrCreate(uid: number): Promise<ChallengeProgressData>;
    /**
     * 从数据库加载挑战进度数据
     */
    Load(uid: number): Promise<ChallengeProgressData>;
    /**
     * 保存挑战进度数据到数据库
     */
    Save(data: ChallengeProgressData): Promise<void>;
    /**
     * 获取缓存的数据（不触发数据库查询）
     */
    GetCached(uid: number): ChallengeProgressData | undefined;
    /**
     * 移除缓存
     */
    RemoveCache(uid: number): void;
    /**
     * 清空所有缓存
     */
    ClearAllCache(): void;
    /**
     * 获取缓存统计信息
     */
    GetCacheStats(): {
        size: number;
    };
}
//# sourceMappingURL=ChallengeProgressDataAccessor.d.ts.map