import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取魂珠列表响应
 * CMD 2354: GET_SOUL_BEAD_List
 *
 * 响应格式：
 * - count (4 bytes): 魂珠数量
 * - 魂珠列表 (每个魂珠的数据)
 */
export declare class GetSoulBeadListRspProto extends BaseProto {
    private soulBeadList;
    constructor(soulBeadList?: any[]);
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=GetSoulBeadListRspProto.d.ts.map