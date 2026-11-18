import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 获取魂珠列表响应包
 * CMD 2354: GET_SOUL_BEAD_List
 */
export declare class PacketGetSoulBeadList extends BaseProto {
    private _data;
    constructor(soulBeadList: any[], result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetSoulBeadList.d.ts.map