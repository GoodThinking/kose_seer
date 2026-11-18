import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 获取钻石数量响应包
 */
export declare class PacketGetDiamond extends BaseProto {
    private _data;
    constructor(diamondCount: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetDiamond.d.ts.map