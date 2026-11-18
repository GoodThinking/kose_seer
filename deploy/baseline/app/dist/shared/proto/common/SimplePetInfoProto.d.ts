import { BaseProto } from '../base/BaseProto';
/**
 * 简单精灵信息
 * 用于 NOTE_READY_TO_FIGHT (2503) 中的精灵信息
 */
export declare class SimplePetInfoProto extends BaseProto {
    petId: number;
    level: number;
    hp: number;
    maxHp: number;
    skills: Array<{
        id: number;
        pp: number;
    }>;
    catchTime: number;
    catchMap: number;
    catchRect: number;
    catchLevel: number;
    skinID: number;
    constructor();
    serialize(): Buffer;
    setPetId(value: number): this;
    setLevel(value: number): this;
    setHP(hp: number, maxHp: number): this;
    setSkills(skills: Array<{
        id: number;
        pp: number;
    }>): this;
    setCatchTime(value: number): this;
    setCatchMap(value: number): this;
    setCatchLevel(value: number): this;
    setSkinID(value: number): this;
}
//# sourceMappingURL=SimplePetInfoProto.d.ts.map