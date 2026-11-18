import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 获取NoNo芯片响应包
 */
export declare class PacketNoNoGetChip extends BaseProto {
    private _data;
    constructor(chipId: number, chipCount: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketNoNoGetChip.d.ts.map