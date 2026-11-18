import { IPetInfo } from '../../shared/models/PetModel';
/**
 * 精灵管理服务
 */
export declare class PetService {
    /**
     * 发送精灵（使用 GameServer 的实际实现）
     */
    givePet(uid: number, petId: number, level: number, shiny: boolean, customStats?: {
        dvHp?: number;
        dvAtk?: number;
        dvDef?: number;
        dvSpAtk?: number;
        dvSpDef?: number;
        dvSpeed?: number;
        evHp?: number;
        evAtk?: number;
        evDef?: number;
        evSpAtk?: number;
        evSpDef?: number;
        evSpeed?: number;
        nature?: number;
        skills?: number[];
        effectList?: Array<{
            itemId: number;
            status: number;
            leftCount: number;
            effectID: number;
            args: string;
        }>;
    }): Promise<void>;
    /**
     * 删除精灵
     */
    removePet(uid: number, catchTime: number): Promise<void>;
    /**
     * 修改精灵属性
     */
    updatePet(uid: number, catchTime: number, field: string, value: any): Promise<void>;
    /**
     * 批量修改精灵属性
     */
    updatePetBatch(uid: number, updateData: {
        catchTime: number;
        level?: number;
        nature?: number;
        exp?: number;
        hp?: number;
        maxHp?: number;
        atk?: number;
        def?: number;
        spAtk?: number;
        spDef?: number;
        speed?: number;
        evHp?: number;
        evAtk?: number;
        evDef?: number;
        evSpAtk?: number;
        evSpDef?: number;
        evSpeed?: number;
        dvHp?: number;
        dvAtk?: number;
        dvDef?: number;
        dvSpAtk?: number;
        dvSpDef?: number;
        dvSpeed?: number;
        skills?: number[];
        effectList?: Array<{
            itemId: number;
            status: number;
            leftCount: number;
            effectID: number;
            args: string;
        }>;
    }): Promise<void>;
    /**
     * 获取玩家精灵列表
     */
    getPlayerPets(uid: number): Promise<IPetInfo[]>;
    /**
     * 治疗精灵（恢复满血）
     */
    curePet(uid: number, catchTime: number): Promise<void>;
    /**
     * 治疗所有精灵
     */
    cureAllPets(uid: number): Promise<void>;
    /**
     * 设置精灵等级
     */
    setPetLevel(uid: number, catchTime: number, level: number): Promise<void>;
    /**
     * 设置精灵经验
     */
    setPetExp(uid: number, catchTime: number, exp: number): Promise<void>;
}
//# sourceMappingURL=PetService.d.ts.map