import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2407 CHANGE_PET] 更换精灵响应
 */
export declare class ChangePetRspProto extends BaseProto {
    userId: number;
    petId: number;
    petName: string;
    level: number;
    hp: number;
    maxHp: number;
    catchTime: number;
    constructor();
    serialize(): Buffer;
    setUserId(value: number): this;
    setPetId(value: number): this;
    setPetName(value: string): this;
    setLevel(value: number): this;
    setHP(hp: number, maxHp: number): this;
    setCatchTime(value: number): this;
}
//# sourceMappingURL=ChangePetRspProto.d.ts.map