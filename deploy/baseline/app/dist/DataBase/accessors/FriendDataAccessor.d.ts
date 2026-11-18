/**
 * FriendData 访问器
 * 提供 FriendData 的便捷访问接口
 */
import { FriendData } from '../models/FriendData';
/**
 * FriendData 访问器
 */
export declare class FriendDataAccessor {
    private static _instance;
    private constructor();
    static get Instance(): FriendDataAccessor;
    /**
     * 获取或创建 FriendData
     */
    GetOrCreate(uid: number): Promise<FriendData>;
    /**
     * 获取 FriendData（不创建）
     */
    Get(uid: number): FriendData | null;
    /**
     * 保存 FriendData
     */
    Save(data: FriendData): Promise<void>;
}
//# sourceMappingURL=FriendDataAccessor.d.ts.map