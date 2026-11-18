/**
 * PetData 访问器
 * 提供 PetData 的便捷访问接口
 */
import { PetData } from '../models/PetData';
/**
 * PetData 访问器
 */
export declare class PetDataAccessor {
    private static _instance;
    private constructor();
    static get Instance(): PetDataAccessor;
    /**
     * 获取或创建 PetData
     */
    GetOrCreate(uid: number): Promise<PetData>;
    /**
     * 获取 PetData（不创建）
     */
    Get(uid: number): PetData | null;
    /**
     * 保存 PetData
     */
    Save(data: PetData): Promise<void>;
}
//# sourceMappingURL=PetDataAccessor.d.ts.map