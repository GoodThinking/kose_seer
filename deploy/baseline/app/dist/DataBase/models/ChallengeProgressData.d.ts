import { BaseData } from './BaseData';
/**
 * 挑战进度数据接口
 */
export interface IChallengeProgressInfo {
    userID: number;
    bossAchievement: boolean[];
    maxPuniLv: number;
    towerBossIndex: number;
}
/**
 * 挑战进度数据类
 *
 * 存储玩家的各种挑战进度：
 * - SPT BOSS 击败记录（bossAchievement）
 * - 谱尼封印进度（maxPuniLv）
 * - 勇者之塔进度（towerBossIndex）
 *
 * 优化：
 * - 使用独立表存储，减少主表查询负担
 * - bossAchievement 使用 BLOB 存储，减少 JSON 序列化开销
 */
export declare class ChallengeProgressData extends BaseData {
    userID: number;
    bossAchievement: boolean[];
    maxPuniLv: number;
    towerBossIndex: number;
    constructor(userID: number);
    /**
     * 实现 BaseData 的 save 方法
     */
    save(): Promise<void>;
    /**
     * 从数据库行创建实例
     */
    static FromRow(row: any): ChallengeProgressData;
    /**
     * 转换为数据库行
     */
    ToRow(): any;
    /**
     * 创建默认实例
     */
    static CreateDefault(userID: number): ChallengeProgressData;
}
//# sourceMappingURL=ChallengeProgressData.d.ts.map