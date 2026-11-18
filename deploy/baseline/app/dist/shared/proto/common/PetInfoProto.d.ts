import { BaseProto } from '../base/BaseProto';
/**
 * 精灵技能信息
 */
export interface IPetSkill {
    id: number;
    pp: number;
}
/**
 * 精灵效果信息（对应客户端 PetEffectInfo）
 * 固定 24 字节
 */
export interface IPetEffect {
    itemId: number;
    status: number;
    leftCount: number;
    effectID: number;
    arg1: number;
    arg2: number;
}
/**
 * 精灵信息Proto（完整版）
 * 对应前端: com.robot.core.info.pet.PetInfo (isDefault/param2 = true)
 */
export declare class PetInfoProto extends BaseProto {
    id: number;
    name: string;
    dv: number;
    nature: number;
    level: number;
    exp: number;
    lvExp: number;
    nextLvExp: number;
    hp: number;
    maxHp: number;
    attack: number;
    defence: number;
    s_a: number;
    s_d: number;
    speed: number;
    ev_hp: number;
    ev_attack: number;
    ev_defence: number;
    ev_sa: number;
    ev_sd: number;
    ev_sp: number;
    skills: IPetSkill[];
    catchTime: number;
    catchMap: number;
    catchRect: number;
    catchLevel: number;
    effects: IPetEffect[];
    skinID: number;
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=PetInfoProto.d.ts.map