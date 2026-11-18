import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2318 PET_SET_EXP] 设置精灵经验分配请求
 * 精灵分配仪功能 - 将经验分配给指定精灵
 */
export declare class PetSetExpReqProto extends BaseProto {
    catchTime: number;
    expAmount: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): PetSetExpReqProto;
}
//# sourceMappingURL=PetSetExpReqProto.d.ts.map