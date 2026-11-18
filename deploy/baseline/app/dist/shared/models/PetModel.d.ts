/**
 * 精灵特性信息接口
 * 参考客户端 PetEffectInfo.as
 */
export interface IPetEffectInfo {
    itemId: number;
    status: number;
    leftCount: number;
    effectID: number;
    args: string;
}
/**
 * 精灵信息接口
 */
export interface IPetInfo {
    id: number;
    userId: number;
    catchTime: number;
    petId: number;
    level: number;
    exp: number;
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    speed: number;
    evHp: number;
    evAtk: number;
    evDef: number;
    evSpAtk: number;
    evSpDef: number;
    evSpeed: number;
    dvHp: number;
    dvAtk: number;
    dvDef: number;
    dvSpAtk: number;
    dvSpDef: number;
    dvSpeed: number;
    nature: number;
    skillArray: number[];
    effectList: IPetEffectInfo[];
    isDefault: boolean;
    isInBag: boolean;
    position: number;
    nick: string;
    obtainTime: number;
    obtainWay: number;
    obtainLevel: number;
    effectCount: number;
    commonMark: number;
    skinId?: number;
    shiny?: number;
}
/**
 * 创建默认精灵信息
 */
export declare function createDefaultPetInfo(userId: number, petId: number): IPetInfo;
//# sourceMappingURL=PetModel.d.ts.map