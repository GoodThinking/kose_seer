import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2421 FIGHT_SPECIAL_PET] 挑战盖亚请求
 */
export declare class FightSpecialPetReqProto extends BaseProto {
    param2: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): FightSpecialPetReqProto;
}
//# sourceMappingURL=FightSpecialPetReqProto.d.ts.map