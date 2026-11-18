import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2305 PET_SHOW] 展示精灵响应
 * PetShowInfo: userID(4) + catchTime(4) + petID(4) + flag(4) + dv(4) + skinID(4)
 */
export declare class PetShowRspProto extends BaseProto {
    userId: number;
    catchTime: number;
    petId: number;
    flag: number;
    dv: number;
    skinId: number;
    constructor();
    serialize(): Buffer;
    setUserId(userId: number): this;
    setCatchTime(catchTime: number): this;
    setPetId(petId: number): this;
    setFlag(flag: number): this;
    setDv(dv: number): this;
    setSkinId(skinId: number): this;
}
//# sourceMappingURL=PetShowRspProto.d.ts.map