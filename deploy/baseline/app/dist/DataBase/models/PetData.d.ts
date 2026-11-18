/**
 * 精灵数据类
 * 直接映射数据库表，提供静态方法便捷访问
 *
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */
import { IPetInfo } from '../../shared/models/PetModel';
import { BaseData } from './BaseData';
/**
 * 精灵数据（对应数据库表 pets）
 *
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - 提供静态方法 GetPetDataByUid 便捷访问
 */
export declare class PetData extends BaseData {
    /** 用户ID（主键） */
    Uid: number;
    /** 精灵列表 */
    PetList: IPetInfo[];
    constructor(uid: number);
    /**
     * 立即保存到数据库
     */
    save(): Promise<void>;
    /**
     * 从数据库行创建 PetData
     */
    static FromRow(row: any): PetData;
    /**
     * 转换为数据库行
     */
    ToRow(): any;
    /**
     * 静态方法：根据 UID 获取精灵数据
     */
    static GetPetDataByUid(uid: number): Promise<PetData | null>;
    /**
     * 添加精灵
     */
    AddPet(pet: IPetInfo): Promise<void>;
    /**
     * 移除精灵
     */
    RemovePet(petId: number): Promise<boolean>;
    /**
     * 获取精灵（按petId）
     */
    GetPet(petId: number): IPetInfo | null;
    /**
     * 获取精灵（按catchTime）
     */
    GetPetByCatchTime(catchTime: number): IPetInfo | null;
    /**
     * 移除精灵（按catchTime）
     */
    RemovePetByCatchTime(catchTime: number): Promise<boolean>;
    /**
     * 更新玩家统计信息（精灵数量和最高等级）
     */
    private UpdatePlayerStats;
    /**
     * 获取背包中的精灵（按首发和获得时间排序）
     * 排序规则：
     * 1. 首发精灵排在最前面
     * 2. 其他精灵按获得时间（catchTime）升序排列（越早获得越靠前）
     */
    GetPetsInBag(): IPetInfo[];
    /**
     * 获取仓库中的精灵（按获得时间排序）
     * 排序规则：按获得时间（catchTime）升序排列（越早获得越靠前）
     */
    GetPetsInStorage(): IPetInfo[];
    /**
     * 获取精灵数量
     */
    GetPetCount(): {
        total: number;
        inBag: number;
    };
}
//# sourceMappingURL=PetData.d.ts.map