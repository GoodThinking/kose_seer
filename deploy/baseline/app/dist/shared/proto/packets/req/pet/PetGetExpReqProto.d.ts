import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2319 PET_GET_EXP] 获取精灵经验分配信息请求
 * 精灵分配仪功能 - 查询可分配的经验值
 */
export declare class PetGetExpReqProto extends BaseProto {
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): PetGetExpReqProto;
}
//# sourceMappingURL=PetGetExpReqProto.d.ts.map